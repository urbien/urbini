//'use strict';
define([
  'globals',
  'backbone',
  'utils',
  'templates'
], function(G, Backbone, U, Templates) {
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
  BasicView.prototype.makeTemplate = function(templateName) {
    return U.template(templateName, this);
  };

  
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

  BasicView.prototype.isChildOf = function(view) {
    var parent = this.parentView;
    while (parent) {
      if (view === parent)
        return true;
      
      parent = parent.parentView;
    }
    
    return false;
  };
  
  BasicView.prototype.assign = function (view, selector) {
    view.setElement(this.$(selector)).render();
  }
  
  BasicView.prototype.finalize = function () {
  }

  return BasicView; 
});