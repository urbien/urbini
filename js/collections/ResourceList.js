define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!error', 
  'cache!models/Resource' 
], function(G, $, __jqm__, _, Backbone, U, Error, Resource) {
  return Backbone.Collection.extend({
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");
      
      _.extend(this, {
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
      
      _.bindAll(this, 'getKey', 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl'); //, 'onAdd'); //, 'fetch'); // fixes loss of context for 'this' within methods
      this.on('add', this.onAdd, this);
      this.on('reset', this.onReset, this);
//      this.on('aroundMe', this.model.getAroundMe);
      this.type = this.model.type;
      this.shortName = this.model.shortName || this.model.shortName;
      this.displayName = this.model.displayName;
//      this.baseUrl = G.apiUrl + this.shortName;
//      this.url = this.baseUrl;
      this.baseUrl = G.apiUrl + this.shortName;
      this.url = this.baseUrl;      
      this.queryMap[this.limitParam] = this.perPage;
      this.parseQuery(options._query);
//      this.sync = this.constructor.sync;
      
      console.log("init " + this.shortName + " resourceList");
    },
    getNextPage: function(options) {
      console.log("fetching next page");
      this.offset += this.perPage;
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
      options.startAfter = _.last(this.models).get('_uri');
      this.fetch(options);
    },
    setPerPage: function(perPage) {
      this.page = this.firstPage;
      this.perPage = perPage;
      this.pager();
    },
    getUrl: function() {
      return this.baseUrl + (this.queryMap ? "?" + $.param(this.queryMap) : '');
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
      
      this.url = this.getUrl();
    },
    getKey: function() {
      return this.url;
    },
    isA: function(interfaceName) {
      return U.isA(this.model, interfaceName);
    },
    parse: function(response) {
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
      
      this._lastFetchedOn = new Date().getTime();
      return response;
    },
    onReset: function(model) {
      console.log("resourceList onReset");
    },
    onAdd: function(model) {
  //    console.log("resourceList onAdd");
    },
    fetchAll: function(options) { 
      return Backbone.Model.prototype.fetch.call(this, options);
    },
    fetch: function(options) {
      var self = this;
      options = options || {};
      options.add = true;
      this.queryMap = this.queryMap || {};
      if (this.offset)
        this.queryMap[this.offsetParam] = this.offset;
      this.rUri = options._rUri;
      options.url = this.getUrl();
      options.error = options.error || Error.getDefaultErrorHandler();
      var success = options.success;
      options.success = function() {
        success && success.apply(self, arguments);
//        MB.fetchModelsForLinkedResources.call(self.model);
      };
  
//      debugger;
//      return Backbone.Collection.prototype.fetch.call(this, options);
//      var jqXHR = Backbone.Collection.prototype.fetch.apply(this, arguments);
//      if (options.sync)
//        jqXHR.timeout = 5000;
//      
//      return jqXHR;
      Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
  }, {});
});
