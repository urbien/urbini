define('collectionSynchronizer', ['globals', 'underscore', 'utils', 'synchronizer', 'idbQueryBuilder', 'indexedDB'], function(G, _, U, Synchronizer, QueryBuilder, IndexedDBModule) {
  var NO_DB = G.dbType === 'none',
      REF_STORE,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise();

  function CollectionSynchronizer() {
    Synchronizer.apply(this, arguments);
  };
  
  function addEmptyResponseHeaderFn(xhr) {
    xhr.getResponseHeader = G.emptyFn;
    return xhr;
  }
  
  CollectionSynchronizer.prototype = Object.create(Synchronizer.prototype);
  CollectionSynchronizer.constructor = CollectionSynchronizer;

  CollectionSynchronizer.prototype._getLastFetchedOn = function() {
    if (this.info && !_.isUndefined(this.info.lastFetchedOn))
      return this.info.lastFetchedOn;
    
    var resources = this.data.models;
    return resources.length && resources[0].loaded && Synchronizer.getLastFetched(this.data.models, this._getNow());
  };

  CollectionSynchronizer.prototype._queryDB = function() {
    var filter = U.getQueryParams(this.data),
        meta = this.data.vocModel.properties;
    
    if (_.any(_.keys(filter), function(param) {
      return /\./.test(param);
    })) {
      debugger;
      return G.getRejectedPromise();
    }

    return this._getItems({
      key: this._getKey(),
      data: this.data,
      from: this.options.from,
      limit: this.options.limit || this.data.perPage,
      filter: filter
    });
  };

//  CollectionSynchronizer.prototype._fetchFromServer = function() {
//    if (!this.data.isUpdate())
//  };
  
  CollectionSynchronizer.prototype._preProcess = function() {
    var result = Synchronizer.prototype._preProcess.call(this),
        params = this.data.params,
        numNow = this.data.length,
        perPage = this.data.perPage,
        options = this.options,
        info = this.info,
        numRequested,
        shortPage;
    
    if (options.from)
      info.start = params.$offset && parseInt(params.$offset) || 0;
    else
      info.start = 0;

    numRequested = params.$limit ? parseInt(params.$limit) : perPage;
    info.end = info.start + numRequested;
    
//    shortPage = !!(numNow && numNow < perPage);
    info.isUpdate = numNow >= info.end; // || shortPage;
//    if (numNow) // we've already gotten everything out of the DB
//      this.info.isForceFetch = true;
    
    return result;
  };
  
  CollectionSynchronizer.prototype._read = function() {
    if (!this._preProcess())
      return;
    
    if (this._isUpdate()) {
      if (this._isForceFetch() || this._isStale())
        this._delayedFetch(); // shortPage ? null : lf); // if shortPage, don't set If-Modified-Since header
      else if (this.data.length)
        this._success(null, 'success', addEmptyResponseHeaderFn({
          status: 304
        })); // the data is fresh, let's get out of here
      
      return;
    }
    else {
      if (this.data.isOutOfResources()) {
        this._error(null, {code: 204, details: 'End of list'}, this.options);
        return;
      }
      
      if (this._isStale() && this.info.start < this.data.length) {
        this._success(null, 'success', addEmptyResponseHeaderFn({status: 304})); // no need to refetch from db, we already did, and there's nothing to fetch from the server it seems
        return; 
      }
    }
    
    var adapter = this.data.vocModel.adapter;
    if (adapter && adapter.supportsPaging && !adapter.supportsPaging()) {
      this._error(null, {code: 204, details: 'End of list'}, this.options);
      return;
    }
    
    return Synchronizer.prototype._read.call(this);
  };
  
  CollectionSynchronizer.prototype._onDBSuccess = function(results) {
    if (!results || !results.length)
      return this._fetchFromServer(100);
          
    var numBefore = this.data.length,
        numAfter,
        lastFetchedTS,
        pagination = {
          offset: this.options.start
        };
//        resp = {
//          data: results, 
//          metadata: {
//            offset: this.options.start
//          }
//        };
      
    try {
      if (this._isForceFetch())
        return this._fetchFromServer();
        
      numAfter = this.data.length;
      if (!this._isUpdate() && numAfter === numBefore) // db results are useless
        return this._delayedFetch();
      
      lastFetchedTS = Synchronizer.getLastFetched(results, this._getNow());
      if (this._isStale(lastFetchedTS, this._getNow()))
        return this._delayedFetch();
    } finally {    
      this._success(results, 'success', {
        getResponseHeader: function(p) {
          if (p == 'X-Pagination')
            return pagination;
        }
      }); // add to / update collection
    }
  };

  CollectionSynchronizer.prototype._getItems = function(options) {
    if (NO_DB)
      return REJECTED_PROMISE;
    
    var self = this,
        IDB = IndexedDBModule.getIDB(),
        type = U.getTypeUri(options.key),
        filter = options.filter,
        limit = options.limit,
        data = options.data,
        props = data.vocModel.properties,
        temps = {},
        query;
    
    if (!IDB.hasStore(type))
      return REJECTED_PROMISE;

    // no searching by composite keys like user.name
    if (_.any(filter, function(val, key) {
      return /\./.test(key);
    })) {
      return REJECTED_PROMISE;
    }
          
    for (var key in filter) {
      var val = filter[key];
      if (U.isResourceProp(props[key]) && U.isTempUri(val)) {
        temps[key] = val;
      }
    }
    
    if (!_.size(temps)) {
      function search() {
        options = _.clone(options);
        options.filter = data.belongsInCollection;
        return IDB.search(type, options);
      }
      
      query = QueryBuilder.buildQuery(data, filter);
      if (query) {
        return IDB.queryByIndex(query).getAll(type).then(function(results) {
          return results;
        }, search);
      }
      else
        return search();
    }
    
    return IDB.queryByIndex('_tempUri').oneof(_.values(temps)).getAll(REF_STORE.name).then(function(results) {
      if (!results.length)
        return REJECTED_PROMISE;
      
      var tempUriToRef = {};
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (r._uri) {
          tempUriToRef[r._tempUri] = r._uri;
        }
      }
      
      for (var key in temps) {
        var tempUri = temps[key];
        var ref = tempUriToRef[tempUri];
        if (ref) {
          filter[key] = ref._uri;
        }
      }
      
      return self._getItems(options);
    });
  };
  
  CollectionSynchronizer.prototype._getKey = function() {
    return this.data.vocModel.type;
  };
  
  CollectionSynchronizer.init = function() {
    REF_STORE = G.getRefStoreInfo();
    delete CollectionSynchronizer.init;
  };
  
  return CollectionSynchronizer;
});