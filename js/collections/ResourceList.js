//'use strict';
define('collections/ResourceList', [
  'globals',
  'utils', 
  'error', 
  'events',
  'lib/fastdom'
], function(G, U, Errors, Events, Q) {
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("ResourceList");
    G.log.apply(G, args);
  };
  
  var tsProp = 'davGetLastModified';
  var listParams = ['perPage', 'offset'];
  var ResourceList = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");

      if (!this.cid)
        this.cid = _.uniqueId('rl');

      options = options || {};
      _.extend(this, {
        page: 0,
        perPage: 10,
        offset: 0,
        firstPage: 0,
        params: {},
        model: (models && models.length && models[0].vocModel),
        listId: G.nextId()
      });
      
      for (var o in options) {
        if (typeof this[o] != 'function')
          this[o] = options[o];
      }
      
      var vocModel = this.vocModel = this.model,
          meta = vocModel.properties;
          
      _.bindAll(this, 'fetch', 'parse', '_parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl', 'onResourceChange', 'disablePaging', 'enablePaging'); // fixes loss of context for 'this' within methods
//      this.on('add', this.onAdd, this);
      this.on('reset', this.onReset, this);
//      this.on('aroundMe', vocModel.getAroundMe);
      this.type = vocModel.type;
      this.shortName = vocModel.shortName || vocModel.shortName;
      this.displayName = vocModel.displayName;
//      this.baseUrl = G.apiUrl + this.shortName;
//      this.url = this.baseUrl;
      this.baseUrl = G.apiUrl + encodeURIComponent(this.type);
      this.url = this.baseUrl;
      if (options.params) {
        this._parseParams(options.params);
//        this.query = $.param(this.params);
      }
      else
        this._parseQuery(options._query);
      
      if (vocModel.adapter) {
        var validator = vocModel.adapter.validateCollection,
            valid = false;
        
        if (validator) {
          try {
            valid = validator.call(this);
          } catch (err) {
            // TODO handle error
          }
        }
        
        if (!valid) {
          // TODO handle error
        }
      }
      
      try {
        this.belongsInCollection = U.buildValueTester(this.params, this.vocModel) || G.trueFn;
        this._unbreak();
      } catch (err) {
        this.belongsInCollection = G.falseFn; // for example, the where clause might assume a logged in user
        this._break();
      }
      
      if (options.cache !== false)
        this.announceNewList();
      
//      this.on('updated', function() {
//        debugger;
//      });
//
//      this.on('replaced', function() {
//        debugger;
//      });
//
//      this.on('added', function() {
//        debugger;
//      });

      if (!this['final']) {
        var self = this;
        this.listenTo(Events, 'newResource:' + this.type, function(resource, fromList) {
          // we are adding this resource to this collection at the moment
          if (self == fromList)
            return;
          
          setTimeout(function() {            
            Q.nonDom(self.filterAndAddResources.bind(self, [resource]), self);
          }, 1000);
        });
        
        this.listenTo(Events, 'newResources:' + this.type, function(resources, fromList) {
          // we are adding this resource to this collection at the moment
          if (self == fromList)
            return;
          
          setTimeout(function() {            
            Q.nonDom(self.filterAndAddResources.bind(self, resources), self);
          }, 1000);
        });
        
        this.listenTo(Events, 'newResourceList:' + this.type, function(list) {
          if (self == list)
            return;
  
          setTimeout(function() {            
            Q.nonDom(self.filterAndAddResources.bind(self, list.models), self);
          }, 1000);
        });
      }
      
      this.monitorQueryChanges();
      this.enablePaging();
      this.on('endOfList', this.disablePaging);
      this.resetRange();
      this._fetchDeferreds = {};
      log("info", "init " + this.shortName + " resourceList");      
    },
    
    resetRange: function() {
      if (!this.range)
        this.range = new Array(2);
      
      this.range[0] = 0;
      this.range[1] = this.models.length;
    },
    
    setRange: function(from, to) {
      if (from > this.range[0])
        this.collection.remove(this.collection.slice(this.from, from));
      
      this.range[0] = from;
      if (to < this.range[1])
        this.collection.remove(this.collection.slice(to, this.range[1]));
      
      this.range[1] = to;
    },

    getRange: function() {
      this.range[1] = this.models.length;
      return this.range;
    },
    
    setTotal: function(total) {
      this.total = total;
      this.trigger('total', total);
    },
    
    getTotal: function() {
      return this.total || null;
    },
    
//    clearRange: function(from, to) {
//      for (var i = from; i < to; i++) {
//        this.models[i] = null;
//      }
//
//      if (from == this.range[0])
//        this.range[0] = to;
//      else if (to == this.range[1])
//        this.range[1] = from;
//    },

    setStartIndex: function(start) {
      var range = this.getRange();
      if (start < range[0])
        throw "Can't set start index to where there are no models";
      
      if (start > range[1])
        throw "Start index must be lower than end index";
      
      this.remove(this.models.slice(this.range[0], start));
      this.range[0] = start;
    },

    setEndIndex: function(end) {
      var range = this.getRange();
      if (end > range[1])
        throw "Can't set end index to where there are no models";
      
      this.remove(this.models.slice(this.range[1]));
      this.range[1] = end;
    },

    filterAndAddResources: function(resources) {
//      if (this.adding) // avoid infinite loop
//        return;
      
      var self = this,
          added = [];
      
      for (var i = 0, len = resources.length; i < len; i++) {
        var resource = resources[i];
        if (!this.get(resource) && this.belongsInCollection(resource))
          added.push(resource);
      }
      
      this.add(added, {
        announce: false,
        parse: false
      });
    },
    
    announceNewList: function() {
      Events.trigger('newResourceList', this);
      Events.trigger('newResourceList:' + this.type, this);
    },
    
    monitorQueryChanges: function() {
      if (!this.params || !_.size(this.params))
        return;
      
      var meta = this.vocModel.properties;
      var params = this.params;
      _.each(params, function(uri, param) {
        var prop = meta[param];
        if (!prop || !U.isResourceProp(prop))
          return;
        
        if (!U.isTempUri(uri))
          return;
        
        Events.once('synced:' + uri, function(data) {
          this.params[param] = data._uri;
          this.trigger('queryChanged');
        }.bind(this));
      }.bind(this));
    },
    
    clone: function() {
      return new ResourceList(this.models.slice(), _.extend(_.pick(this, ['model', 'rUri', 'title', 'total'].concat(listParams)), {cache: false, params: _.clone(this.params)}));
    },
    onResourceChange: function(resource, options) {
      options = options || {};
      if (!options.partOfUpdate)
        this.trigger('updated', [resource]);
    },
    
    /**
     * assumes unsorted collection
     */
    add: function(resources, options) {
      if (!_.size(resources))
        return;
      
      if (this['final'] && this.models.length)
        throw "This list is locked, it cannot be changed";
      
      options = _.defaults({}, options, { silent: true, parse: true });
      var self = this,
          multiAdd = _.isArray(resources),
          fromServer = this.lastFetchOrigin == 'server',
          params = this.modelParamsStrict,
          setInitialParams = fromServer && _.size(params),
          numBefore = this.length,
          models = this.models,
          added,
          numAfter,
          i,
          result;
      
      resources = multiAdd ? resources : [resources];
      if (!resources.length)
        return;

      Backbone.Collection.prototype.add.call(this, resources, options);
      
      numAfter = this.length;
      if (numAfter <= numBefore)
        return;
      
      for (var i = numBefore; i < numAfter; i++) {
        var resource = models[i],
            uri = resource.getUri();
          
        if (U.isTempUri(uri)) {
          resource.once('uriChanged', function(oldUri) {
            var newUri = resource.getUri();
            self._byId[newUri] = self._byId[oldUri]; // HACK? we need to replace the internal models cache mapping to use the new uri
            delete self._byId[oldUri];
          });
        }
        
        if (setInitialParams) {
          // we may be end up requesting models with $select=..., or $omit=..., so we should set the provided ones right now, in case they're omitted from the fetch response
          resource.set(params, {silent: true});
        }

        this.listenTo(resource, 'change', self.onResourceChange);
        this.listenTo(resource, 'change', self.onResourceChange);
      }

      if (multiAdd && !this.resetting) {
        added = models.slice(numBefore);
        this.trigger('added', added);
      }
      
      if (options.announce !== false) {
        added = added || models.slice(numBefore);
        Events.trigger('newResources', added, this);
        Events.trigger('newResources:' + this.type, added, this);
      }

      return result;
    },
//    replace: function(resource, oldUri) {
//      if (U.isModel(oldUri))
//        this.remove(oldUri)
//      else
//        this.remove(resource);
//      
//      this.add([resource]); // to make it act like multi-add, so it triggers an 'added' event
//      this.trigger('replaced', resource, oldUri);
//    },
    
    getNextPage: function(options) {
      var params = options.params,
          offset = params && params.$offset || this.length;
      
      this.setOffset(offset);
      return this.pager(options);
    },
    getPreviousPage: function () {
      this.setOffset(this.offset - this.perPage);
      this.setOffset(Math.max(0, this.offset));
      this.pager();
    },
    getPageAtOffset: function(offset) {
      this.setOffset(offset);
      this.pager();
    },
    pager: function(options) {
      this.page = Math.floor(this.offset / this.perPage);
      options = options || {};
      options.sync = true;
      options.nextPage = true;
      var length = this.models.length;
      if (length)
        options.from = this.models[length - 1].getUri();
      
      return this.fetch(options);
    },
    setPerPage: function(perPage) {
      this.page = this.firstPage;
      this.perPage = perPage;
      this.pager();
    },
    getUrl: function(params) {
      params = params ? _.clone(params) : {};
      _.defaults(params, {
        $minify: 'y',
        $mobile: 'y'
      }, this.params);
      
      if (this.params  &&  window.location.hash  && window.location.hash.startsWith('#chooser/'))
        params.$chooser = 'y';
      
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.getCollectionUrl)
        return adapter.getCollectionUrl.call(this, params);
      
      return this.baseUrl + '?' + $.param(params);
    },
    
    _parseQuery: function(query) {
      var params;
      if (query)
        params = U.getQueryParams(query);
      else
        params = this.params || {};
      
      this._parseParams(params);
    },
    
    _parseParams: function(params) {
      var modelParams = {},
          strict = {};
      
      for (var name in params) {
        var val = params[name];
        if (name == '$offset') {
          this.setOffset(parseInt(val)); // offset is special because we need it for lookup in db
          this.page = Math.floor(this.offset / this.perPage);
        }
        else if (name == '$limit') {
          this.perPage = params.$limit = parseInt(val);
        }
        else if (!/^-/.test(name)) {
          modelParams[name] = val;
          if (!/^\$/.test(name))
            strict[name] = val;
        }
      }
      
      this.params = params;
      this.modelParams = modelParams;
      this.modelParamsStrict = strict;
      this.url = this.baseUrl + (_.size(this.params) ? "?" + $.param(this.params) : ''); //this.getUrl();
      this.query = U.getQueryString(modelParams, true); // sort params in alphabetical order for easier lookup
    },
    isAll: function(interfaceNames) {
      return U.isAll(this.vocModel, interfaceNames);
    },
    isOneOf: function(interfaceNames) {
      return U.isOneOf(this.vocModel, interfaceNames);
    },
    isA: function(interfaceName) {
      return U.isA(this.vocModel, interfaceName);
    },
    
    setOffset: function(offset) {
      if (typeof offset !== 'undefined')
        this.offset = offset;
    },
    
    parse: function(response) {
      if (this.lastFetchOrigin !== 'db')
        this._lastFetchedOn = G.currentServerTime();
      
      var vocModel = this.vocModel;
      for (var i = 0, len = response.length; i < len; i++) {
        var res = response[i];
        res._uri = U.getLongUri1(res._uri, vocModel);
      }
      
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.parseCollection)
        return adapter.parseCollection.call(this, response);
      
      if (!response)
        return [];

      return response;
    },
    
    set: function(resources, options) {
      options = _.defaults(options || {}, {partOfUpdate: true});
//      var start = _.now();
//      try {
        return Backbone.Collection.prototype.set.call(this, resources, options);
//      } finally {
//        log("Collection.set for {0} resources took {1}ms".format(resources.length, _.now() - start | 0));
//      }
    },

    disablePaging: function() {
      this._outOfData = true;
      window._setTimeout(this.enablePaging, 3 * 60000);
    },

    enablePaging: function() {
      this._outOfData = false;
    },
    
    isOutOfResources: function() {
      return this._outOfData;
    },
    
    reset: function(models, options) {
      delete this.total;
      if (this['final'] && this.models.length)
        throw "This list is locked, it cannot be changed";
      
      this.enablePaging();
      var needsToBeStored = !U.isModel(models[0]);
      
      this.resetting = true;
      try {
        return Backbone.Collection.prototype.reset.apply(this, arguments);
      } finally {
        this.resetting = false;
      }
      
      if (needsToBeStored)
        Events.trigger('updatedResources', this.models);
    },

    isBroken: function() {
      return this._broken;
    },
    
    _break: function() {
      this._broken = true;
    },

    _unbreak: function() {
      this._broken = false;
    },

    onReset: function(model, options) {
      if (options.params) {
        _.extend(this.params, options.params);
        try {
          this.belongsInCollection = U.buildValueTester(this.params, this.vocModel) || G.trueFn;
          this._unbreak();
        } catch (err) {
          this.belongsInCollection = G.falseFn; // for example, the where clause might assume a logged in user  
          this._break();
        }
        
        this._lastFetchedOn = null;
      }
    },
    
    fetch: function(options) {
      options = options || {};
      _.defaults(options, {
        headers: {
          'Range-Need-Total': true
        },
        update: true, 
        remove: false, 
        parse: true
      });
      
      var self = this,
          vocModel = this.vocModel,
          success = options.success,
          error = options.error = options.error || Errors.getBackboneErrorHandler(),
          adapter = vocModel.adapter,
          params = this.params,
          extraParams = options.params || {},
          urlParams,
          limit;

      if (this['final']) {
        error(this, {status: 204, details: "This list is locked"}, options);
        return G.getRejectedPromise();      
      }

      if (!extraParams.$omit && !extraParams.$select && !this.params.$omit && !this.params.$select) {
        if (!this.offset || !this.models.length) {
          if (!_.has(vocModel, 'splitRequest'))
            U.setSplitRequest(vocModel);
          
          if (vocModel.splitRequest)
            extraParams.$select = U.splitRequestFirstHalf;
        }
      }

      if (this.offset)
        params.$offset = this.offset;
      
      this.rUri = options.rUri;
      urlParams = this.rUri ? _.getParamMap(this.rUri) : {};
      if (urlParams) {
        limit = urlParams.$limit;
        limit = limit && parseInt(limit);
      }
      if (!limit)
        limit = extraParams.$limit || this.perPage;
      
      if (limit > 50)
        options.timeout = 5000 + limit * 50;
      
      options.limit = params.$limit = limit;
      try {
        options.url = this.getUrl(extraParams);
      } catch (err) {
        error(this, {status: 204, details: err.message}, options);
        return G.getRejectedPromise();      
      }

//      if (this.currentlyFetching && this.currentlyFetching.url == options.url) {
//        
//      }
        
      options.error = function(xhr, resp, options) {
        self._lastFetchedOn = G.currentServerTime();
        if (error)
          error.call(self, self, resp, options);
      }
      
      options.success = function(resp, status, xhr) {
        if (self.lastFetchOrigin === 'db') {
          if (success)
            return success(resp, status, xhr);
          
          return;
        }
        
        var now = G.currentServerTime(),
            code = xhr.status,
            select = extraParams && extraParams.$select,
            pagination = xhr.getResponseHeader("X-Pagination"),
            total = xhr.getResponseHeader("X-Range-Total"),
            mojo = xhr.getResponseHeader("X-Mojo");
        
        if (pagination) {
          try {
            pagination = JSON.parse(pagination);
            self.setOffset(pagination.offset);
            if (self.offset)
              log("info", "received page, offset = " + self.offset);
            
            self.page = Math.floor(self.offset / self.perPage);
          } catch (err) {
          }
        }
        
        if (total != null)
          self.setTotal(parseInt(total));
        
        if (mojo) {
          try {
            mojo = JSON.parse(mojo);
            if (mojo = mojo.edit) {
              for (var i = 0, len = resp.length; i < len; i++) {
                resp[i].edit = mojo;
              }
            }
          } catch (err) {
          }
        }
        
        function err() {
          debugger;
          log('error', code, options.url);
          error(self, resp || {code: code}, options);            
        }
        
        self._lastFetchedOn = now;
        switch (code) {
          case 200:
            if (!resp)
              debugger;
            
            break;
          case 204:
            self.trigger('endOfList');
            if (success)
              success([], status, xhr);
            
            return;
          case 304:
//            var ms = self.models.slice(options.start, options.end);
            var models = self.models,
                start = options.start || 0,
                end = options.end || (start + params.$limit);
            
            end = Math.min(end, models.length);
            if (typeof start != 'undefined' && typeof end != 'undefined') {
              for (var i = start; i < end; i++) {
                models[i].set({'_lastFetchedOn': now}, {silent: true});              
              }
            }
            
//            _.each(ms, function(m) {
//              m.set({'_lastFetchedOn': now}, {silent: true});
//            });
//            
//            self.trigger('endOfList');
            if (success)
              success([], status, xhr);
            
            return;
          default:
            err();
            return;
        }
        
        self.update(resp, options);        
        if (success)
          success(resp, status, xhr);
        
        if (!select || select == '$all')
          return;
        
        var first = self.models[0];
        if (!first)
          return;
        
        var props = U.parsePropsList(select, self.vocModel),
            atts = U.filterObj(first.attributes, function(key) { return /^[a-zA-Z]+$/.test(key) }),
            nonSelectedProps = _.difference(_.keys(atts), props),
            hasNonSelectedProps = !_.size(_.pick(atts, nonSelectedProps));

        if (hasNonSelectedProps)
          return;
        
        var newOptions = {
          forceFetch: true,
          forceMerge: true,
          params: _.extend(_.omit(extraParams, '$select'), {
            $omit: select,
            $blCounts: 'y' // might as well make the most of this request
          })
        };
        
//        G.whenNotRendering(self.fetch.bind(self, newOptions));
        self.fetch(newOptions);
      }; 

      if (this.offset && !this._outOfData) {
        log("info", "fetching next page, from " + this.offset + ", to: " + (this.offset + limit));
      }

      return this.sync('read', this, options);
    },
    
    update: function(resources, options) {
      if (!resources || !resources.length)
        return;
      
      if (this.lastFetchOrigin === 'db') {
//        var numBefore = this.models.length;
        this.add(resources, _.defaults({
          parse: false // make sure parse if false
        }, options));
        
        return;
      }

      resources = this.parse(resources);
      
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // An alternative is to override Backbone.Collection.reset() method and do some magic there.
      
      var forceMerge = options.forceMerge,
          added = [],
          skipped = [],
          updated = [],
          now = G.currentServerTime();
      
      for (var i = 0; i < resources.length; i++) {
        var r = resources[i];
        r._lastFetchedOn = now;
        var uri = r._uri,
            saved = this.get(uri),
            ts = saved && saved.get(tsProp) || 0,
            newLastModified = r[tsProp],
            newData = saved && saved.changedAttributes(r), // new prop values, including meta props like _uri, _lastFetchedOn, etc.
            newModelProps = newData && U.filterObj(newData, U.isModelParameter);
        
        if ((forceMerge && newModelProps && _.size(newModelProps)) || !newLastModified || newLastModified > ts) {
          if (saved) {
            saved.set(newData, {
              partOfUpdate: true  // to avoid updating collection (and thus views) 20 times
            }); 
            
            updated.push(saved);
          }
          else {
            added.push(r);
          }
        }
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }
      
      if (added.length + updated.length) {
        if (added.length)
          this.add(added);
        
        if (updated.length)
          this.trigger('updated', updated);
        
        // not everyone who cares about resources being updated has access to the collection
        Events.trigger('updatedResources', _.union(updated, added));
      }
//      else if (this.params.$offset)
//        this.trigger('endOfList');
      
      return this;
    },
    
    isFetching: function(url) {
      return url ? _.has(this._fetchDeferreds, url) : !!_.size(this._fetchDeferreds);
    },

    getFetchDeferred: function(url) {
      return this._fetchDeferreds[url];
    },

    setFetchDeferred: function(url, deferred) {
      this._fetchDeferreds[url] = deferred;
    },

    clearFetchDeferred: function(url) {
      delete this._fetchDeferreds[url];
    },
    
    selfDestruct: function() {
      this.stopListening();
      var models = this.models;
      for (var i = 0, num = models.length; i < num; i++) {
        models[i].collection = null;
      }
      
      models.length = 0;
    }
  }, {
    displayName: 'ResourceList'
  });
  
//  _.toTimedFunction(Backbone.Collection.prototype, 'set');
  return ResourceList;
});
