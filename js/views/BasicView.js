define([
  'globals',
  'underscore',
  'backbone',
  'templates'
], function(G, _, Backbone, Templates) {
  var basicOptions = ['source', 'parentView'];
  return Backbone.View.extend({
    initialize: function(options) {
      _.extend(this, _.pick(options, basicOptions));
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
    }
  }, {
    displayName: 'BasicView'
  });
});