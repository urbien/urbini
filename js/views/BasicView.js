//'use strict';
define([
  'globals',
  'backbone',
  'templates'
], function(G, Backbone, Templates) {
  var basicOptions = ['source', 'parentView', 'returnUri'];
  var BasicView = Backbone.View.extend({
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

//  BasicView.prototype.setActive = function(active) {
//    this.active = active;
//  }

  BasicView.prototype.isActive = function() {
    if (this.active)
      return true;
    
    var view = this.parentView;
    while (view) {
      if (view.active)
        return true;
      
      view = view.parentView;
    }
    
    return false;
  };
  
  return BasicView; 
});