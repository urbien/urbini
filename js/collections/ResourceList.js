//'use strict';
define('collections/ResourceList', [
  'globals',
  'utils', 
  'error', 
  'events'
], function(G, U, Errors, Events) {
  var tsProp = 'davGetLastModified';
  var listParams = ['perPage', 'offset'];
  var ResourceList = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");
      
      options = options || {};
      _.extend(this, {
        page: 0,
        perPage: 45, // 30,
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
      
      var vocModel = this.vocModel = this.model;
//          adapter = vocModel.adapter;
      
//      if (adapter) {
//        this.getUrl = adapter.getCollectionUrl || this.getUrl;
//        this.parse = adapter.parseCollection || this.parse;
//      }
      
      var meta = vocModel.properties;
      _.bindAll(this, 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl', 'onResourceChange'); // fixes loss of context for 'this' within methods
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
      
      this.belongsInCollection = U.buildValueTester(this.params, this.vocModel);
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

      Events.on('newResource:' + this.type, function(resource, options) {
        // we are adding this resource to this collection at the moment
        if (this.adding || this.get(resource))
          return;
        
        if (!resource.isNew() && resource.collection) // wait for newResourceList event and check all in bulk
          return;
        
//        var types = U.getTypes(resource.vocModel);
//        if (!_.contains(types, this.type))
//          return;
        
        if (this.belongsInCollection(resource)) {
          this.add(resource);
          this.trigger('added', [resource]);
        }
      }.bind(this));
      
      
      Events.on('newResourceList:' + this.type, function(list) {
        if (list === this)
          return;
        
//        var types = U.getTypes(list.vocModel);
//        if (!_.contains(types, this.type))
//          return;
        
        var candidates = list.filter(function(res) {
          return !this.get(res);
        }.bind(this));
        
        if (!candidates.length)
          return;
        
        var added = [];
        _.each(candidates, function(resource) {
          if (this.belongsInCollection(resource))
            this.add(resource) && added.push(resource);
        }.bind(this));
        
        if (added.length)
          this.trigger('added', added);
        
      }.bind(this));
      
//      this.sync = this.constructor.sync;
      
      this.monitorQueryChanges();
      G.log(this.TAG, "info", "init " + this.shortName + " resourceList");
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
      return new ResourceList(U.slice.call(this.models), _.extend(_.pick(this, ['model', 'rUri', 'title'].concat(listParams)), {cache: false, params: _.clone(this.params)}));
    },
    onResourceChange: function(resource, options) {
      options = options || {};
      if (!options.partOfUpdate)
        this.trigger('updated', [resource]);
    },
    add: function(models, options) {
      var multiAdd = _.isArray(models);
      models = multiAdd ? models : [models];
      if (!models.length)
        return;
      
      models = _.map(models, function(m) {
        var resource = m instanceof Backbone.Model ? m : new this.vocModel(m, {silent: true, parse: true}); // avoid tripping newResource event as we want to trigger bulk 'added' event
        
        // just in case we're already subscribed, unsubscribe
//        resource.off('replaced', this.replace);
        var uri = resource.getUri();
        if (U.isTempUri(uri)) {
          resource.once('uriChanged', function(oldUri) {
            var newUri = resource.getUri();
            this._byId[newUri] = this._byId[oldUri]; // HACK? we need to replace the internal models cache mapping to use the new uri
            delete this._byId[oldUri];
          }.bind(this));
        }
        
        resource.off('change', this.onResourceChange);
        
//        resource.on('replaced', this.replace);
        resource.on('change', this.onResourceChange);
        return resource;
      }.bind(this));
      
      this.adding = true;
      try {
        return Backbone.Collection.prototype.add.call(this, models, options);
      } finally {
        this.adding = false;
        if (multiAdd && !this.resetting) {
          this.trigger('added', models);
        }
        
        Events.trigger('newResources', models);
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
      G.log(this.TAG, "info", "fetching next page");
      this.offset += this.perPage;
      this.offset = Math.min(this.offset, this.models.length);
      this.pager(options);
    },
    getPreviousPage: function () {
      this.offset -= this.perPage;
      this.offset = Math.max(0, this.offset);
      this.pager();
    },
    getPageAtOffset: function(offset) {
      this.offset = offset;
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
    getUrl: function() {
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.getCollectionUrl)
        return adapter.getCollectionUrl.call(this);
      
      var url = this.baseUrl + (this.params ? "?$minify=y&$mobile=y&" + $.param(this.params) : '');
      if (this.params  &&  window.location.hash  && window.location.hash.startsWith('#chooser/'))
        url += '&$chooser=y';
      return url;
    },
    parseQuery: function(query) {
      var params, filtered = {};
      if (query)
        params = U.getQueryParams(query);
      else
        params = this.params || {};
      
      for (var name in params) {
        if (name == '$offset') {
          this.offset = parseInt(val); // offset is special because we need it for lookup in db
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
    parse: function(response) {
      if (this.lastFetchOrigin !== 'db')
        this._lastFetchedOn = G.currentServerTime();
      
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.parseCollection)
        return adapter.parseCollection.call(this, response);
      
      if (!response || response.error)
        return [];

      var metadata = response.metadata;
      if (response.data) {
        this.offset = response.metadata.offset;
        if (this.offset)
          G.log(this.TAG, "info", "received page, offset = " + this.offset);
        
        this.page = Math.floor(this.offset / this.perPage);
        response = response.data;
      }
      
      var editMojo = metadata && metadata.edit;
      if (editMojo) {
        _.each(response, function(m) {
          m.edit = editMojo;
        });
      }
      
      return response;
    },
    reset: function() {
      this.resetting = true;
      try {
        return Backbone.Collection.prototype.reset.apply(this, arguments);
      } finally {
        this.resetting = false;
      }
    },
    onReset: function(model, options) {
      if (options.params) {
        _.extend(this.params, options.params);
        this.belongsInCollection = U.buildValueTester(this.params, this.vocModel);
        this._lastFetchedOn = null;
      }
    },
    fetch: function(options) {
      options = _.extend({update: true, remove: false, parse: true}, options);
      var self = this,
          error = options.error = options.error || Errors.getBackboneErrorHandler(),
          adapter = this.vocModel.adapter;
      
      if (adapter) {
        auth = adapter.requiredAuthorization && adapter.requiredAuthorization() || 'simple';
        if (auth != 'simple')
          return this.vocModel.API.oauth(parseInt(auth.slice(5)), this.type);
      }
      
      try {
        options.url = this.getUrl();
      } catch (err) {
        error(this, {status: 204, details: err.message}, options);
        return;
      }

      this.params = this.params || {};
      if (this.offset)
        this.params.$offset = this.offset;
      this.rUri = options.rUri;
      var urlParams = this.rUri ? U.getParamMap(this.rUri) : {};
      var limit;
      if (urlParams) {
        limit = urlParams.$limit;
        limit = limit && parseInt(limit);
      }
      if (!limit)
        limit = this.perPage;
      
      if (limit && limit > 50)
        options.timeout = 5000 + limit * 50;
      
      options.error = function() {
        self._lastFetchedOn = G.currentServerTime();
        if (error)
          error.apply(this, arguments);
      }
      
      var success = options.success || function(resp, status, xhr) {
        self.update(resp, options);        
      };
      
      options.success = function(resp, status, xhr) {
        if (self.lastFetchOrigin === 'db') {
          self.update(resp, options);
          success(resp, status, xhr);
          return;
        }
        else
          self._lastFetchedOn = now;
        
        var now = G.currentServerTime(),
            code = xhr.status;
        
        function err() {
          debugger;
          G.log(self.TAG, 'error', code, options.url);
          error(self, resp || {code: code}, options);            
        }
        
        switch (code) {
          case 200:
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
        
        if (resp && resp.error) {
          err();
          return;
        }
        
        self.update(resp.data, options);
        success(resp, status, xhr);
      }; 
      
      return this.sync('read', this, options);
    },
    
    update: function(resources, options) {
      if (this.lastFetchOrigin === 'db') {
        var numBefore = this.models.length;
        Backbone.Collection.prototype.set.call(this, resources, options);
        return;
      }

      resources = this.parse(resources);      
      if (!_.size(resources)) {
        return false;
      }
      
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // An alternative is to override Backbone.Collection.reset() method and do some magic there.
      
      var added = [],
          skipped = [],
          updated = [],
          now = G.currentServerTime();
      
      for (var i = 0; i < resources.length; i++) {
        var r = resources[i];
        r._lastFetchedOn = now;
        var uri = r._uri;
        var saved = this.get(uri);
        var ts = saved && saved.get(tsProp) || 0;
        var newLastModified = r[tsProp];
        if (typeof newLastModified === "undefined") 
          newR = 0;
        
        if (!newLastModified || newLastModified > ts) {
          if (saved) {
            saved.set(r, {partOfUpdate: true}); // to avoid updating collection (and thus views) 20 times
            updated.push(saved);
          }
          else {
            added.push(r);
          }
        }
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }
      
      this.add(added);
      updated.length && this.trigger('updated', updated);
      
      // not everyone who cares about resources being updated has access to the collection
      Events.trigger('updatedResources', _.union(updated, added)); 
      return this;
    }    
  }, {
    displayName: 'ResourceList'
  });
  
  return ResourceList;
});
