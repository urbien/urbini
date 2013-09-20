//'use strict';
define('collections/ResourceList', [
  'globals',
  'utils', 
  'error', 
  'events'
], function(G, U, Errors, Events) {
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
        perPage: 30,
        offset: 0,
        firstPage: 0,
        params: {},
        model: (models && models[0] && models[0].vocModel),
        listId: G.nextId()
      });
      
      for (var o in options) {
        if (typeof this[o] != 'function')
          this[o] = options[o];
      }
      
      var self = this,
          vocModel = this.vocModel = this.model,
          meta = vocModel.properties;
          
      _.bindAll(this, 'fetch', 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl', 'onResourceChange', 'disablePaging', 'enablePaging'); // fixes loss of context for 'this' within methods
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
        this.params = options.params;
        this.query = $.param(this.params);
      }
      else
        this.parseQuery(options._query);
      
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
        this.belongsInCollection = U.buildValueTester(this.params, this.vocModel);
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
        this.listenTo(Events, 'newResource:' + this.type, function(resource, options) {
          // we are adding this resource to this collection at the moment
          self.filterAndAddResources([resource], options);
        });
        
        this.listenTo(Events, 'newResources:' + this.type, function(resources, options) {
          // we are adding this resource to this collection at the moment
          self.filterAndAddResources(resources, options);
        });
        
        this.listenTo(Events, 'newResourceList:' + this.type, function(list) {
          if (list === self)
            return;
  
          self.filterAndAddResources(list.models);        
        });
      }
      
      this.monitorQueryChanges();
      this.enablePaging();
      this.on('endOfList', this.disablePaging);
      log("info", "init " + this.shortName + " resourceList");      
    },

    filterAndAddResources: function(resources) {
//      if (this.adding) // avoid infinite loop
//        return;
      
      var self = this,
          added = [];
      
      _.each(resources, function(resource) {          
        if (!self.get(resource) && self.belongsInCollection(resource))
          added.push(resource);
      });
      
      self.add(added, {
        announce: false
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
      return new ResourceList(this.models.slice(), _.extend(_.pick(this, ['model', 'rUri', 'title'].concat(listParams)), {cache: false, params: _.clone(this.params)}));
    },
    onResourceChange: function(resource, options) {
      options = options || {};
      if (!options.partOfUpdate)
        this.trigger('updated', [resource]);
    },
    add: function(resources, options) {
      if (this['final'] && this.models.length)
        throw "This list is locked, it cannot be changed";
      
      options = options || {};
      var self = this,
          multiAdd = _.isArray(resources);
      
      resources = multiAdd ? resources : [resources];
      if (!resources.length)
        return;
      
      resources = _.map(resources, function(resource) {
        return resource instanceof Backbone.Model ? resource : new this.vocModel(resource, {silent: true, parse: true}); // avoid tripping newResource event as we want to trigger bulk 'added' event        
      }.bind(this));

      _.each(resources, function(resource) {
        var uri = resource.getUri();
        if (U.isTempUri(uri)) {
          resource.once('uriChanged', function(oldUri) {
            var newUri = resource.getUri();
            this._byId[newUri] = this._byId[oldUri]; // HACK? we need to replace the internal models cache mapping to use the new uri
            delete this._byId[oldUri];
          }.bind(this));
        }
        
        self.listenTo(resource, 'change', self.onResourceChange);
        self.listenTo(resource, 'change', self.onResourceChange);
      });
      
//      this.adding = true;
      try {
        return Backbone.Collection.prototype.add.call(this, resources, options);
      } finally {
//        this.adding = false;
        if (multiAdd && !this.resetting) {
          this.trigger('added', resources);
        }
        
        if (options.announce !== false) {
          Events.trigger('newResources', resources);
          Events.trigger('newResources:' + this.type, resources);
        }
      }
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
      this.setOffset(this.offset + this.perPage);
      this.setOffset(Math.min(this.offset, this.models.length));
      this.pager(options);
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
      
      this.fetch(options);
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
    parseQuery: function(query) {
      var params, filtered = {};
      if (query)
        params = U.getQueryParams(query);
      else
        params = this.params || {};
      
      for (var name in params) {
        if (name == '$offset') {
          this.setOffset(parseInt(val)); // offset is special because we need it for lookup in db
          this.page = Math.floor(this.offset / this.perPage);
        }
        else if (name == '$limit') {
          this.perPage = filtered.$limit = parseInt(val);
        }
        else if (name.charAt(0) == '-')
          continue;
        else
          filtered[name] = params[name];
      }
      
      this.params = filtered;
      this.url = this.baseUrl + (this.params ? $.param(this.params) : ''); //this.getUrl();
      this.query = U.getQueryString(U.getQueryParams(this), true); // sort params in alphabetical order for easier lookup
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
      _.each(response, function(res) {
        res._uri = U.getLongUri1(res._uri, vocModel);
      });
      
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.parseCollection)
        return adapter.parseCollection.call(this, response);
      
      if (!response)
        return [];

      return response;
    },
    
    set: function(resources, options) {
      options = _.defaults(options || {}, {partOfUpdate: true});
      return Backbone.Collection.prototype.set.call(this, resources, options);
    },

    disablePaging: function() {
      this._outOfData = true;
      setTimeout(this.enablePaging, 3 * 60000);
    },

    enablePaging: function() {
      this._outOfData = false;
    },
    
    isOutOfResources: function() {
      return this._outOfData;
    },
    
    reset: function(models, options) {
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
          this.belongsInCollection = U.buildValueTester(this.params, this.vocModel);
          this._unbreak();
        } catch (err) {
          this.belongsInCollection = G.falseFn; // for example, the where clause might assume a logged in user  
          this._break();
        }
        
        this._lastFetchedOn = null;
      }
    },
    
    fetch: function(options) {
      if (this.offset && !this._outOfData)
        log("info", "fetching next page");

      options = options || {};
      _.defaults(options, {
        update: true, 
        remove: false, 
        parse: true
      });
      
      var self = this,
          vocModel = this.vocModel,
          error = options.error = options.error || Errors.getBackboneErrorHandler(),
          adapter = vocModel.adapter,
          extraParams = options.params || {};

      if (this['final']) {
        error(this, {status: 204, details: "This list is locked"}, options);
        return;      
      }

      if (!extraParams.$omit && !extraParams.$select && !this.params.$omit && !this.params.$select) {
        if (!this.offset || !this.models.length) {
          if (!_.has(vocModel, 'splitRequest'))
            U.setSplitRequest(vocModel);
          
          if (vocModel.splitRequest)
            extraParams.$select = U.splitRequestFirstHalf;
        }
      }

      this.params = this.params || {};
      if (this.offset)
        this.params.$offset = this.offset;
      
      this.rUri = options.rUri;
      var urlParams = this.rUri ? _.getParamMap(this.rUri) : {};
      var limit;
      if (urlParams) {
        limit = urlParams.$limit;
        limit = limit && parseInt(limit);
      }
      if (!limit)
        limit = this.perPage;
      
      if (limit > 50)
        options.timeout = 5000 + limit * 50;
      
      this.params.$limit = limit;
      
      try {
        options.url = this.getUrl(extraParams);
      } catch (err) {
        error(this, {status: 204, details: err.message}, options);
        return;
      }

//      if (this.currentlyFetching && this.currentlyFetching.url == options.url) {
//        
//      }
        
      options.error = function(xhr, resp, options) {
        self._lastFetchedOn = G.currentServerTime();
        if (error)
          error.call(self, self, resp, options);
      }
      
      var success = options.success || function(resp, status, xhr) {
        var pagination = xhr.getResponseHeader("X-Pagination"),
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
        
        if (mojo) {
          try {
            mojo = JSON.parse(mojo);
            if (mojo.edit) {
              _.each(resp, function(m) {
                m.edit = editMojo;
              });
            }
          } catch (err) {
          }
        }
        
        self.update(resp, options);        
      };
      
      options.success = function(resp, status, xhr) {
        if (self.lastFetchOrigin === 'db') {
          self.update(resp, options);
          success(resp, status, xhr);
          return;
        }
        else {
          var select = extraParams && extraParams.$select;
          if (select && select !== '$all') {
            var first = self.models[0];
            if (first) {
              var props = U.parsePropsList(select, self.vocModel),
                  atts = U.filterObj(first.attributes, function(key) { return /^[a-zA-Z]+$/.test(key) }),
                  nonSelectedProps = _.difference(_.keys(atts), props),
                  hasNonSelectedProps = !_.size(_.pick(atts, nonSelectedProps));
              
              if (!hasNonSelectedProps) {
                var newOptions = {
                  forceFetch: true,
                  forceMerge: true,
                  params: _.extend(_.omit(extraParams, '$select'), {
                    $omit: select,
                    $blCounts: 'y' // might as well make the most of this request
                  })
                };
                
                G.whenNotRendering(_.partial(self.fetch, newOptions), self);
              }
            }
          }
          
          self._lastFetchedOn = now;
        }
        
        var now = G.currentServerTime(),
            code = xhr.status;
        
        function err() {
          debugger;
          log('error', code, options.url);
          error(self, resp || {code: code}, options);            
        }
        
        switch (code) {
          case 200:
            if (!resp)
              debugger;
            
            break;
          case 204:
            self.trigger('endOfList');
            success([], status, xhr);
            return;
          case 304:
            var ms = self.models.slice(options.start, options.end);
            _.each(ms, function(m) {
              m.set({'_lastFetchedOn': now}, {silent: true});
            });
            
            self.trigger('endOfList');
            success([], status, xhr);
            return;
          default:
            err();
            return;
        }
        
        self.update(resp, options);
        success(resp, status, xhr);
      }; 
      
      return this.sync('read', this, options);
    },
    
    update: function(resources, options) {
      if (this.lastFetchOrigin === 'db') {
        var numBefore = this.models.length;
        this.set(resources, options);
        return;
      }

      resources = this.parse(resources);      
      if (!_.size(resources)) {
        return false;
      }
      
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
      else if (this.params.$offset)
        this.trigger('endOfList');
      
      return this;
    },
    
    isFetching: function() {
      return this._fetchPromise && this._fetchPromise.state() == 'pending';
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
  
  return ResourceList;
});
