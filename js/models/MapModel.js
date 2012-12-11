define([
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!error'
], function($, __jqm__, _, Backbone, U, Error) {
  return Backbone.Model.extend({
    initialize: function(options) {
      _.bindAll(this, 'parse', 'url', 'fetch'); // fixes loss of context for 'this' within methods
      this.model = options.model;
      var url = this.model.url;
      this.baseUrl = typeof url == 'function' ? url.apply(this) : url;
    },  
    parse: function(resp) {
      return resp.data && resp.data[0];
    },
    url: function() {
  //    var base = this.get('url');
      return this.baseUrl + (this.baseUrl.indexOf("?") == -1 ? "?" : "&") + "$map=y";
    },
    fetch: function(options) {
      options = options || {};
      options.noDB = true;
      return Backbone.Model.prototype.fetch.call(this, options);
    }  
  });
});
