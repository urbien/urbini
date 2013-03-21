//'use strict';
define([
  'globals',
  'backbone',
  'utils',
  'templates',
  'events'
], function(G, Backbone, U, Templates, Events) {
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
      Events.on('templateUpdate', function(template) {
        var dClUri = template.get('modelDavClassUri');
        if (!dClUri)
          return;
        
        var type = U.getTypeUri(dClUri);
        if (U.getTypes(this.vocModel).indexOf(type) == -1)
          return;
        
        var templateName = template.get('templateName');
        this.makeTemplate(templateName, this._templateMap[templateName]);
        this.refresh();
      }.bind(this));
      
      return this;
    }
  }, {
    displayName: 'BasicView'
  });
  
  _.extend(BasicView.prototype, {
    refresh: function() {
      // override this
    },
    
    makeTemplate: function(templateName, localName, type, fallBackToDefault) {
      var template = this[localName] = U.template(templateName, type, this);
      if (!template) {
        if (fallBackToDefault && type)
          return this.makeTemplate(templateName, localName);
        else
          return template;
      }
        
      this._templates = this._templates || [];
      this._templateMap = this._templateMap || {};
      U.pushUniq(this._templates, templateName);
      this._templateMap[templateName] = localName;
      return template;
    },  
    
    addChild: function(name, view) {
      this.children = this.children || {};
      this[name] = this.children[name] = view;
      return view;
    },
    
    getChildViews: function() {
      return this.children;
    },
    
    getDescendants: function() {
      if (!this.children)
        return [];
      else {
        var childViews = _.values(this.children)
        return _.union([], childViews, _.union.apply(_, _.map(childViews, function(child) {return child.getDescendants()})));
      }
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
  
    assign: function (selector, view, renderOptions) {
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
          view.setElement(this.$(selector)).render(renderOptions);
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
    },
    
    showLoadingIndicator: function(timeout) {
      $.mobile.loading('show');
      // in case if fetch failed to invoke a callback
      // then hide loading indicator after 3 sec.
      if (timeout) {
        return timeoutId = setTimeout(function() {
          this.hideLoadingIndicator(timeoutId);
        }.bind(this), timeout);
      }
    },
    
    hideLoadingIndicator: function(timeoutId) {
      if (typeof timeoutId !== 'undefined')
        clearTimeout(timeoutId);
      
      $.mobile.loading('hide');
    }
  });

  return BasicView; 
});