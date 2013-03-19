//'use strict';
define([
  'globals',
  'utils', 
  'error', 
  'events'
], function(G, U, Errors, Events) {
  var tsProp = 'davGetLastModified';
  var ResourceList = Backbone.Collection.extend({
    TAG: "ResourceList",
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");
      
      options = options || {};
      _.extend(this, {
        page: 0,
        perPage: 45, // 30,
        offset: 0,
        firstPage: 0,
        offsetParam: "$offset",
        limitParam: "$limit",
        params: options.params || {},
        model: options.model || models[0].model,
        rUri: options._rUri,
        listId: G.nextId(),
        title: options.title
      });
      
      var vocModel = this.vocModel = this.model;
      _.bindAll(this, 'getKey', 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl', 'replace', 'onResourceChange'); // fixes loss of context for 'this' within methods
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
      this.params[this.limitParam] = this.perPage;
      this.parseQuery(options._query);
      this.belongsInCollection = U.buildValueTester(this.params, this.vocModel);
      if (options.cache !== false)
        Events.trigger('newResourceList', this);
      
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

      Events.on('newResource', function(resource, options) {
        // we are adding this resource to this collection at the moment
        if (this.adding)
          return;
        
        if (this.get(resource))
          return;
        
        var types = U.getTypes(resource.vocModel);
        if (!_.contains(types, this.type))
          return;
        
        if (this.belongsInCollection(resource)) {
          debugger;
          this.add(resource);
          this.trigger('added', [resource]);
        }
      }.bind(this));
      
//      this.sync = this.constructor.sync;
      
      G.log(this.TAG, "info", "init " + this.shortName + " resourceList");
    },
    clone: function() {
      return new ResourceList(U.slice.call(this.models), _.extend(_.pick(this, 'model', 'rUri', 'title'), {cache: false, params: _.clone(this.params)}));
    },
    onResourceChange: function(resource) {
      this.trigger('updated', [resource]);
    },
    add: function(models, options) {
      var multiAdd = _.isArray(models);
      models = multiAdd ? models : [models];
      models = _.map(models, function(m) {
        var resource = m instanceof Backbone.Model ? m : new this.vocModel(m, {silent: true}); // avoid tripping newResource event as we want to trigger bulk 'added' event
        
        // just in case we're already subscribed, unsubscribe
        resource.off('replaced', this.replace); 
        resource.off('change', this.onResourceChange);
        
        resource.on('replaced', this.replace);
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
      }
    },
    replace: function(resource, oldUri) {
      this.remove(resource);
      this.add(resource);
      this.trigger('replaced', resource, oldUri);
    },
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
        options.startAfter = this.models[length - 1].getUri();
      
      this.fetch(options);
    },
    setPerPage: function(perPage) {
      this.page = this.firstPage;
      this.perPage = perPage;
      this.pager();
    },
    getUrl: function() {
      var url = this.baseUrl + (this.params ? "?$minify=y&$mobile=y&" + $.param(this.params) : '');
      if (this.params  &&  window.location.hash  && window.location.hash.startsWith('#chooser/'))
        url += '&$chooser=y';
      return url;
    },
    parseQuery: function(query) {
      if (!query)
        return;
      
      this.query = query;
      query = query.split("&");
      var params = this.params = this.params || {};
      for (var i = 0; i < query.length; i++) {
        var p = query[i].split("=");
        var name = decodeURIComponent(p[0]);
        var val = decodeURIComponent(p[1]);
        var q = query[i];
        if (q == this.offsetParam) {
          this.offset = parseInt(val); // offset is special because we need it for lookup in db
          this.page = Math.floor(this.offset / this.perPage);
        }
        else if (q.charAt(0) == '-')
          continue;
        else
          params[name] = val;
      }
      
      this.url = this.baseUrl + (this.params ? $.param(this.params) : ''); //this.getUrl();
    },
    getKey: function() {
      return this.vocModel.type;
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
      var self = this;
      options = _.extend({update: true, remove: false, parse: true}, options);
      this.params = this.params || {};
      if (this.offset)
        this.params[this.offsetParam] = this.offset;
      this.rUri = options._rUri;
      options.url = this.getUrl();
      var error = options.error = options.error || Errors.getDefaultErrorHandler();
      options.error = function() {
        self._lastFetchedOn = G.currentServerTime();
        if (error)
          error.apply(this, arguments);
      }
      
      var success = options.success || function(resp, status, xhr) {
        self.update(resp, options);        
      };
      
      options.success = function(resp, status, xhr) {
        var now = G.currentServerTime();
        if (self.lastFetchOrigin === 'db') {
          self.update(resp, options);
          success(resp, status, xhr);
          return;
        }
        
        var code = xhr.status;
        var err = function() {
          debugger;
          G.log(RM.TAG, 'error', code, options.url);
          error(resp && resp.error || {code: code}, status, xhr);            
        }
        
        self._lastFetchedOn = now;
        switch (code) {
          case 200:
            break;
          case 204:
            success(resp, status, xhr);
            return;
          case 304:
            var ms = self.models.slice(options.start, options.end);
            _.each(ms, function(m) {
              m.set({'_lastFetchedOn': now}, {silent: true});
            });
            
            return;
          default:
            err();
            return;
        }
        
        if (resp && resp.error) {
          err();
          return;
        }
        
        var newData = resp.data;
        self.update(resp, options);
        success(resp, status, xhr);
      }; 
      
      return this.sync('read', this, options);
    },
    
    update: function(resources, options) {
      if (this.lastFetchOrigin === 'db') {
        var numBefore = this.models.length;
        Backbone.Collection.prototype.update.call(this, resources, options);
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
            saved.set(r);
            updated.push(saved);
          }
          else {
            added.push(r);
          }
        }
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }
      
      var vocModel = this.vocModel;
      
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
