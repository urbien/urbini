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
      options = options || {};
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
  
  _.extend(BasicView.prototype, {
    makeTemplate: function(templateName) {
      return U.template(templateName, this);
    },
  
    
    isActive: function() {
      if (this.active)
        return true;
      
      var view = this.parentView;
      while (view) {
        if (view.active)
          return true;
        
        view = view.parentView;
      }
      
      return false;
    },
  
    isChildOf: function(view) {
      var parent = this.parentView;
      while (parent) {
        if (view === parent)
          return true;
        
        parent = parent.parentView;
      }
      
      return false;
    },
    
  //  assign: function (view, selector) {
  //    view.setElement(this.$(selector)).render();
  //  }
  
    assign: function (selector, view) {
      var selectors;
      if (_.isObject(selector)) {
          selectors = selector;
      }
      else {
          selectors = {};
          selectors[selector] = view;
      }
      if (!selectors) return;
      _.each(selectors, function (view, selector) {
          view.setElement(this.$(selector)).render();
      }, this);
    },
    
    finalize: function () {
    },
    
    restyle: function() {
      this.$el.find('ul[data-role]').listview();
      this.$el.find('div[data-role="fieldcontain"]').fieldcontain();
      this.$el.find('button[data-role="button"]').button();
      this.$el.find('input,textarea').textinput();
//      this.$el.page();
    }
  });

  return BasicView; 
});