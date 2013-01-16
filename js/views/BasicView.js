define([
  'globals',
  'cache!backbone',
  'cache!templates'
], function(G, Backbone, Templates) {
  return Backbone.View.extend({
    initialize: function(options) {
      var res = this.data = this.model;
      if (this.model instanceof Backbone.Collection) {
        this.collection = res;
        this.vocModel = res.model;
      }
      else {
        this.resource = res;
        this.collection = res.collection;
        this.vocModel = res.constructor;
      }
      
      this.router = G.Router || Backbone.history;
      return this;
    },
  }, {
    displayName: 'BasicView'
  });
});