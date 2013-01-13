define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!error', 
  'cache!events',
  'cache!models/Resource',
], function(G, $, __jqm__, _, Backbone, U, Error, Events, Resource) {
  var tsProp = 'davGetLastModified';
  var ResourceList = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");
      
      _.extend(this,   {
        page: 0,
        perPage: 30,
        offset: 0,
        firstPage: 0,
        offsetParam: "$offset",
        limitParam: "$limit",
        queryMap: {},
        model: options.model || models[0].model,
        rUri: options._rUri
      });
      
      this.vocModel = vocModel = this.model;
      this.resources = this.models;
      _.bindAll(this, 'getKey', 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl'); //, 'onAdd'); //, 'fetch'); // fixes loss of context for 'this' within methods
      this.on('add', this.onAdd, this);
      this.on('reset', this.onReset, this);
//      this.on('aroundMe', vocModel.getAroundMe);
      this.type = vocModel.type;
      this.shortName = vocModel.shortName || vocModel.shortName;
      this.displayName = vocModel.displayName;
//      this.baseUrl = G.apiUrl + this.shortName;
//      this.url = this.baseUrl;
      this.baseUrl = G.apiUrl + encodeURIComponent(this.type);
      this.url = this.baseUrl;      
      this.queryMap[this.limitParam] = this.perPage;
      this.parseQuery(options._query);
//      this.sync = this.constructor.sync;
      
      console.log("init " + this.shortName + " resourceList");
    },
    getNextPage: function(options) {
      console.log("fetching next page");
      this.offset += this.perPage;
      this.offset = Math.min(this.offset, this.resources.length);
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
      var length = this.resources.length;
      if (length)
        options.startAfter = this.resources[length - 1].get('_uri');
      
      this.fetch(options);
    },
    setPerPage: function(perPage) {
      this.page = this.firstPage;
      this.perPage = perPage;
      this.pager();
    },
    getUrl: function() {
      return this.baseUrl + (this.queryMap ? "?$minify=y&" + $.param(this.queryMap) : '');
    },
    parseQuery: function(query) {
      if (!query)
        return;
      
      query = query.split("&");
      var qMap = this.queryMap = this.queryMap || {};
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
          qMap[name] = val;
      }
      
      this.url = this.baseUrl + (this.queryMap ? $.param(this.queryMap) : ''); //this.getUrl();
    },
    getKey: function() {
      return this.vocModel.type;
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
          console.log("received page, offset = " + this.offset);
        
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
    onReset: function(model) {
      console.log("resourceList onReset");
      this.resources = this.models;
    },
    onAdd: function(model) {
  //    console.log("resourceList onAdd");
    },
    fetchAll: function(options) { 
      return Backbone.Model.prototype.fetch.call(this, options);
    },
    fetch: function(options) {
      var self = this;
      options = _.extend({update: true, remove: false, parse: true}, options);
      this.queryMap = this.queryMap || {};
      if (this.offset)
        this.queryMap[this.offsetParam] = this.offset;
      this.rUri = options._rUri;
      options.url = this.getUrl();
      var error = options.error = options.error || Error.getDefaultErrorHandler();
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
        
        var err = function() {
          G.log(RM.TAG, 'error', code, options.url);
          error(resp && resp.error || {code: code}, status, xhr);            
        }
        
        self._lastFetchedOn = now;
        switch (xhr.status) {
          case 200:
            break;
          case 204:
            success(resp, status, xhr);
            return;
          case 304:
            var ms = self.resources.slice(options.start, options.end);
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
        var numBefore = this.resources.length;
        Backbone.Collection.prototype.update.call(this, resources, options);
        if (this.resources.length > numBefore)
          Events.trigger('refresh', this, _.map(this.resources.slice(numBefore), function(s) {return s.get('_uri')}));

        return;
      }

      resources = this.parse(resources);
      if (!_.size(resources))
        return false;
      
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // An alternative is to override Backbone.Collection.reset() method and do some magic there.
      
      var toAdd = [];
      var skipped = [];
      var modified = [];
      var now = G.currentServerTime();
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
          toAdd.push(r);
          if (saved) {
            saved.set(r);
            modified.push(uri);
          }
          else {
            this.add(new this.vocModel(r));            
          }
        }
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }
      
      if (toAdd.length) {
        Events.trigger('refresh', self, _.map(toAdd, function(s) {return s._uri}));
        Lablz.ResourceManager.addItems(toAdd); 
      }
      
      return this;
    }
  }, {
    displayName: 'ResourceList'
  });
  
  return ResourceList;
});
