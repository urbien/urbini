//'use strict';
define([
  'globals',
  'jquery',
  'backbone',
  'utils',
  'templates',
  'events'
], function(G, $, Backbone, U, Templates, Events) {
  var basicOptions = ['source', 'parentView', 'returnUri'];
  var BasicView = Backbone.View.extend({
    initialize: function(options) {
      this.TAG = this.TAG || this.constructor.displayName;
      G.log(this.TAG, 'new view', this.getPageTitle());
      options = options || {};
      this._loadingDfd = new $.Deferred();
      this._loadingDfd.promise().done(function() {
        this.rendered = true;
      }.bind(this));
      
      this._templates = [];
      this._templateMap = {};
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
        res.on('modelChanged', function() {
          this.vocModel = res.vocModel;
        }.bind(this));
      }
      
      this.router = G.Router || Backbone.history;
      var refresh = this.refresh;
      this.refresh = function(rOptions) {
        if (!this.rendered)
          return this;
        
        if ((!rOptions || !rOptions.force) && !this.isPanel && !this.isActive()) {
          // to avoid rendering views 10 times in the background. Render when it's about to be visible
           this.__refreshArgs = arguments; 
           return false;
         }
        
        G.log(this.TAG, 'refresh', 'page title:', this.getPageTitle());
        refresh && refresh.apply(this, arguments);
      };
      
      var render = this.render;
      this.render = function(rOptions) {
        if ((!rOptions || !rOptions.force) && !this.isPanel && !this.isActive()) {
         // to avoid rendering views 10 times in the background. Render when it's about to be visible
          this.__renderArgs = arguments; 
          return false;
        }
        else {
//          if (!this.TAG)
//            debugger;
          
          G.log(this.TAG, 'render', 'page title:', this.getPageTitle());
          render.apply(this, arguments);
          if (this.autoFinish !== false)
            this.finish();
          return this;
        }
      }.bind(this);
      
      this.on('active', function(active) {
        this.active = active; // keep this
        _.each(this.children, function(child) {
          child.trigger('active', active);
        }); // keep this
        
        if (active && (this.__renderArgs || this.__refreshArgs)) {
          var method, args;
          if (this.rendered) {
            method = refresh;
            args = this.__refreshArgs;
            this.__refreshArgs = null;
          }
          else {
            method = render;
            args = this.__renderArgs;
            this.__renderArgs = null;
          }
          
          method.apply(this, args);
          this.finish();
        }        
      }.bind(this));
////////// comment end
      
      _.each(['onorientationchange', 'onresize'], function(listener) {
        if (listener in window) {
          var event = listener.slice(2);
          window.addEventListener(event, function() {
            this.$el.trigger(event);
          }.bind(this), false);
        }
      }.bind(this));
      
      return this;
    }
  }, {
    displayName: 'BasicView'
  });
  
  _.extend(BasicView.prototype, {
    refresh: function() {
      // override this
//      this.render();
//      this.restyle();
    },
    
    refreshOrRender: function() {
      if (this.rendered)
        this.refresh.apply(this, arguments);
      else
        this.render.apply(this, arguments);
    },
    
    _getLoadingDeferreds: function() {
      return [this._loadingDfd].concat(_.pluck(this.getDescendants(), '_loadingDfd'));
    },
    
    isDoneLoading: function() {
      return _.all(this._getLoadingDeferreds(), function(c) {
        return c.isResolved() || c.isRejected();
      });
    },
    
    whenDoneLoading: function(callback) {
      $.when.apply($, this._getLoadingDeferreds()).then(callback);
    },
    
    finish: function() {
      this._loadingDfd.resolve();
    },
    
    getTemplate: function(templateName, type) {
      return Templates.get(templateName, type);
    },

    getOriginalTemplate: function(templateName) {
      return Templates.getOriginalTemplate(templateName);
    },

    makeTemplate: function(templateName, localName, type, dontFallBackToDefault) {
//      localName = localName || templateName;
      var template = this[localName] = U.template(templateName, type, this);
      if (!template) {
        if (!dontFallBackToDefault && type)
          return this.makeTemplate(templateName, localName);
        else
          return template;
      }
        
      U.pushUniq(this._templates, templateName);
      this._templateMap[templateName] = localName;
      var event = 'templateUpdate:' + templateName;
      this.stopListening(Events, event);
      this.listenTo(Events, event, function(template) {
        var dClUri = template.get('modelDavClassUri');
        if (dClUri) {
          var type = U.getTypeUri(dClUri);
          if (U.getTypes(this.vocModel).indexOf(type) == -1)
            return;
        }
        
        this.makeTemplate(templateName, this._templateMap[templateName], dClUri);
        this[this.rendered ? 'render' : 'refresh']();
        this.restyle();
      }.bind(this));

      return template;
    },  
    
    addChild: function(name, view) {
      this.children = this.children || {};
      this[name] = this.children[name] = view;
      view.parentView = view.parentView || this;
      return view;
    },
    
    getChildViews: function() {
      return this.children;
    },
    
    getDescendants: function() {
      if (!this.children)
        return [];
      else {
        var childViews = _.values(this.children);
        return _.union([], childViews, _.union.apply(_, _.map(childViews, function(child) {return child.getDescendants()})));
      }
    },
    
    isPageView: function(view) {
      return view && view.cid === this.getPageView().cid;
    },
    
    getPageView: function() {
      var parent = this;
      while (parent.parentView) {
        parent = parent.parentView;
      }
      
      return parent;
    },
    
    getPageTitle: function() {
      var pageView = this.getPageView();
      if (!pageView)
        return null;
      
      var title = pageView.$('#pageTitle');
      return title.length ? title.text() : null;
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
      
      if (!selectors) 
        return;
      
      _.each(selectors, function (view, selector) {
          view.setElement(this.$(selector)).render(renderOptions);
      }, this);
    },
    
    finalize: function () {
    },

    padding: function(horizontal) {
      var one = horizontal ? 'left' : 'top';
      var two = horizontal ? 'right' : 'bottom';
      var padding = this.$el.css('padding') || "0px";
      var onePadding = this.$el.css('padding-' + one) || "0px",
          twoPadding = this.$el.css('padding-' + two) || "0px";
      
      var padding = parseFloat(padding);
      return (parseFloat(onePadding) || padding) 
           + (parseFloat(twoPadding) || padding);
    },
    
    innerHeight: function() {
      return this.el.clientHeight ? this.el.clientHeight - this.padding(false) : this.parentView ? this.parentView.innerHeight() - this.padding(false) : null;
    },

    innerWidth: function() {
      return this.el.clientWidth ? this.el.clientWidth - this.padding(true) : this.parentView ? this.parentView.innerWidth() - this.padding(true) : null;
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
  },
  {
    displayName: 'BasicView'
  });

  return BasicView; 
});