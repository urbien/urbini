define('synchronizer', ['globals', 'underscore', 'utils', 'backbone', 'events', 'indexedDB'], function(G, _, U, Backbone, Events, IndexedDBModule) {

  var MAX_DATA_AGE = G.MAX_DATA_AGE = 180000,
      NO_DB = G.dbType === 'none',
      RESOLVED_PROMISE = $.Deferred().resolve().promise(),
      REJECTED_PROMISE = $.Deferred().reject().promise(),
      REF_STORE;
  
  function getLastFetchedTimestamp(resOrJson) {
    return U.getValue(resOrJson, '_lastFetchedOn') || U.getValue(resOrJson, 'davGetLastModified');
  };

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("taskQueue");
    G.log.apply(G, args);
  };

  //////////////////// SYNCHRONIZER /////////////////
   
  function Synchronizer(method, data, options) {
    this.data = data;
    this.method = method;
    this.options = options;
  };

  Synchronizer.prototype.sync = function() {
    return this['_' + this.method]();
  };  
  
  Synchronizer.prototype._isUpdate = function() {
    return false;
  };
  
  Synchronizer.prototype._setLastFetched = function() {
    if (this.info.lastFetchedOn) {
      var ifMod = {
        "If-Modified-Since": new Date(this.info.lastFetchedOn).toUTCString()
      };
      
      this.options.headers = this.options.headers || {};
      _.extend(this.options.headers, ifMod);
    }
  }
  
  Synchronizer.prototype._delayedFetch = function() {
    return this._fetchFromServer(100);
  };

  Synchronizer.prototype._fetchFromServer = function(delay) {
    var self = this,
        options = this.options;
    
    if (!G.online) {
      this._error(null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options);
      return;
    }
    
    if (U.isModel(this.data) && U.isTempUri(this.data.getUri()))
      return this._error(data, {code: 204}, this.options);
  
    if (this._isUpdate() && !this._isForceFetch())
      this._setLastFetched();

    if (delay) {
      setTimeout(this._fetchFromServer.bind(this), delay);
      return;
    }
    
    if (this._isSyncRequest() || !G.hasWebWorkers)
      return this._defaultSync();
      
    U.ajax({url: options.url, type: 'GET', headers: options.headers}).always(function() {
      self.data.lastFetchOrigin = 'server';
    }).done(function(data, status, xhr) {
      self._success(data, status, xhr);
    }).fail(function(xhr, status, msg) {
  //    if (xhr.status === 304)
  //      return;
  //    
      log('error', 'failed to get resources from url', options.url, msg);
      self._error(null, xhr, options);
    });      
  },
      
  Synchronizer.prototype._defaultSync = function() {
//    if (this._isSyncRequest())
//      this.options.timeout = 10000;
    
    var self = this,
        tName = 'sync ' + this.options.url;
    
    G.startedTask(tName);
    this.options.success = function() {
      G.finishedTask(tName);
      self.data.lastFetchOrigin = 'server';
      self._success.apply(self.data, arguments);
    }
    
    return Backbone.defaultSync(this.method, this.data, this.options);
  };
  
  Synchronizer.prototype._queryDB = function() {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._getKey = function() {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._preProcess = function() {
    if (this.info)
      return true;
    
    var self = this;
    this.data._dirty = 0;
    this.info = {
      isSyncRequest: this.options.sync || false,
      isForceFetch: this.options.forceFetch || this.data._dirty,
      now: G.currentServerTime(),
      vocModel: this.data.vocModel,
      key: this._getKey()
    };

    this.info.lastFetchedOn = this._getLastFetchedOn();
    this.info.isUpdate = this._isUpdate();
    this._error = this.options.error || function(model, err, options) {
      log('error', 'failed to {0} {1}'.format(self.method, self._getKey()));
    };
    
    this._success = this.options.success || function(resp, status, xhr) {
      log('error', 'success: {0} {1}'.format(self.method, self._getKey()));
    };
    
    return true;
  };

  _.each(['isForceFetch', 'isUpdate', 'isSyncRequest'], function(infoProp) {
    Synchronizer.prototype['_' + infoProp] = function() {
      return this.info[infoProp];
    };
  });
  
  _.each(['now', 'vocModel', 'lastFetchedOn'], function(infoProp) {
    Synchronizer.prototype['_get' + infoProp.capitalizeFirst()] = function() {
      return this.info[infoProp];
    };
  });
  
  Synchronizer.prototype._read = function(options) {
    var self = this,
        keepGoing = this._preProcess();
    
    if (!keepGoing)
      return keepGoing;
    
    if (this._isForceFetch())
      return this._fetchFromServer();
    
    this._queryDB().then(function(results) {
      if (!results || _.isArray(results) && !results.length)
        return self._fetchFromServer(100);
            
      self.options.sync = false;
      self.data.lastFetchOrigin = 'db';
      log('db', "got resources from db: " + self.info.vocModel.type);
      self._onDBSuccess(results);
    }, this._onDBError.bind(this));
  };
  
  Synchronizer.prototype._onDBSuccess = function(results) {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._onDBError = function(results) {
    if (G.online)
      this._fetchFromServer();
    else if (this._isSyncRequest())
      this._error(this.data, {type: 'offline'}, this.options);      
  };

  Synchronizer.prototype._isStale = function() {
    return Synchronizer.isStale(this._getLastFetchedOn(), this._getNow());
  };

  Synchronizer.getLastFetched = function(obj, now) {
    now = now || G.currentServerTime();
    if (!obj) 
      return now;
    
    var ts,
        type = U.getObjectType(obj).toLowerCase();
    
    switch (type) {
      case '[object array]':
        ts = _.reduce(obj, function(memo, next)  {
          return Math.min(memo, getLastFetchedTimestamp(next) || 0);
        }, Infinity);
        break;
      case '[object object]':
        ts = getLastFetchedTimestamp(obj);
        break;
      case '[object number]':
        ts = obj;
        break;
    }
  
    return ts || 0;
  };
  
  Synchronizer.isStale = function(timestamp, now) {
    return !timestamp || now - timestamp > MAX_DATA_AGE;
  };
  
  Synchronizer.addItems = function(classUri, items) {
    var IDB = IndexedDBModule.getIDB();    
    if (!IDB.hasStore(classUri)) {
      return $.Deferred(function(defer) {          
        Events.trigger('createObjectStores', [classUri], function() {
          Synchronizer.addItems(classUri, items).then(defer.resolve, defer.reject);
        });
      }).promise();
    }

    if (classUri.startsWith('http')) {
      var vocModel = U.getModel(classUri);
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        items[i] = U.isModel(item) ? item.toJSON() : item;
      }
    }
    
    return IDB.put(classUri, items);
  };

  Synchronizer.init = _.once(function() {
    REF_STORE = G.getRefStoreInfo();
  });
  
  return Synchronizer;
});