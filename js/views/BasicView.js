//'use strict';
define('views/BasicView', [
  'globals',
  'backbone',
  'utils',
  'templates',
  'events'
], function(G, _Backbone, U, Templates, Events) {
  var basicOptions = ['source', 'parentView', 'returnUri'];
  var BasicView = Backbone.View.extend({
    superInitialize: function() {
      var superCl = this.constructor.__super__,
          superInit = superCl.initialize;
      
      if (superInit == this.initialize) {
        superCl = superCl.constructor.__super__;
        if (superCl)
          superInit = superCl.initialize;
      }
      
      if (superInit)
        superInit.apply(this, arguments);
    },
    initialize: function(options) {
//      this._initOptions = options;
      _.bindAll(this, 'reverseBubbleEvent');
      var superCtor = this.constructor;
      while (superCtor.__super__) {
        var superDuperCtor = superCtor.__super__.constructor;
        if (superCtor === superDuperCtor) // prevent infinite loops
          break;
        
        _.defaults(this.events, superDuperCtor.prototype.events);
        superCtor = superDuperCtor;
      }
      
      this.TAG = this.TAG || this.constructor.displayName;
      options = options || {};
      this._hashInfo = G.currentHashInfo;
      this.hash = U.getHash();
      this.hashParams = this._hashInfo && this._hashInfo.params || {};
      this._loadingDfd = new $.Deferred();
      this._loadingDfd.promise().done(function() {
        if (!this.rendered)
          this.rendered = true;
      }.bind(this));
      
      this._templates = [];
      this._templateMap = {};
      _.extend(this, _.pick(options, basicOptions));
      this.pageView = this.getPageView();
      
      var res = this.data = this.model = this.model || options.resource || options.collection;
      if (res) {
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
        
        this.modelType = this.vocModel.type;
      }
      
      this.router = window.router || Backbone.history; //G.Router || Backbone.history;
      var refresh = this.refresh;
      this.refresh = function(rOptions) {
        var force = rOptions && rOptions.force;
        if (!force && !this.rendered)
          return this;
        
        if (!force && !this.isPanel && !this.isActive()) {
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

      this._activeDfd = $.Deferred();
      this._inactiveDfd = $.Deferred();
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
        
        if (active) {
          this._activeDfd.resolve();
          this._inactiveDfd = $.Deferred();
        }
        else {
          this._inactiveDfd.resolve();
          this._activeDfd = $.Deferred();
        }
      }.bind(this));
////////// comment end
      
      var self = this;
      _.each(['onorientationchange', 'onresize'], function(listener) {
        if (listener in window) {
          var event = listener.slice(2);
          window.addEventListener(event, function() {
            self.onActive(function() {
              self['_' + event](event);
            });
          }, false);
          
          self['_' + event] = _.debounce(function(e) {
            G.log(self.TAG, 'events', e);
            self.$el.trigger(e);
          }, 100);          
        }
      });

//      this.initialized = true;
      G.log(this.TAG, 'new view', this.getPageTitle());
      return this;
    },
    
    refresh: function() {
      // override this
//      this.render();
//      this.restyle();
    },
    
//    forceRerender: function() {
//      this.render(this._renderArguments);
//    },
    
    refreshOrRender: function() {
      if (this.rendered)
        this.refresh.apply(this, arguments);
      else
        this.render.apply(this, arguments);
    },
    
    destroy: function() {
      Events.trigger('viewDestroyed', this);
      Events.trigger('viewDestroyed:' + this.cid, this);
      this.remove();
    },
    
    _getLoadingDeferreds: function() {
      return [this._loadingDfd].concat(_.pluck(this.getDescendants(), '_loadingDfd'));
    },
    
    isDoneLoading: function() {
      return _.all(this._getLoadingDeferreds(), function(c) {
        return c.state() !== 'pending';
      });
    },
    
    onload: function(callback) {
      var promise = $.whenAll.apply($, this._getLoadingDeferreds());
      callback && promise.then(callback);
      return promise;
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
    
    atBottom: function() {
      var $w = $(window);
      return this.pageView.$el.height() - $w.height() - $w.scrollTop() < 20;
    },
    
    onInactive: function(callback) {
      this._inactiveDfd.done(callback);
    },

    onActive: function(callback) {
      this._activeDfd.done(callback);
    },
    
    addChild: function(name, view) {
      this.children = this.children || {};
      this[name] = this.children[name] = view;
      view.parentView = view.parentView || this;
      view.pageView = this.getPageView() || view.pageView;
      
      Events.on('viewDestroyed:' + view.cid, function(view) {
        if (self.children)
          delete self.children[name];
      });

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
    
    reverseBubbleEvent: function(e) {
      if (!this.isActive())
        return;
      
      _.each(this.children, function(child) {
        child.$el && child.$el.triggerHandler(e.type, e); // triggerHandler will prevent the event from bubbling back up and creating an infinite loop
      });
    },
    
    showLoadingIndicator: function() {
      var page = this.pageView;
      if (page)
        page.showLoadingIndicator.apply(page, arguments);
    },

    hideLoadingIndicator: function() {
      var page = this.pageView;
      if (page)
        page.hideLoadingIndicator.apply(page, arguments);
    },

    isPageView: function(view) {
      return false;
    },
    
    getPageView: function() {
      if (this.pageView)
        return this.pageView;
      
      var parent = this;
      while (parent.parentView) {
        parent = parent.parentView;
        if (parent.isPageView())
          return parent;
      }
    },
    
    getPageTitle: function() {
      return this.pageView && this.pageView.getPageTitle();
    },
    
    isActive: function() {
//      if (this.active)
//        return true;
//      
//      var view = this.parentView;
//      while (view) {
//        if (view.active)
//          return true;
//        
//        view = view.parentView;
//      }
//      
//      return false;
      return this.active || (this.pageView && this.pageView.isActive());
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
    
    isGeo: function() {
      if (this.collection) {
        return this.collection.isOneOf(["Locatable", "Shape"]);
      }
      else {
        var res = this.resource;
        return !!((res.isA("Locatable") && res.get('latitude') && res.get('longitude')) || 
                  (res.isA("Shape") && res.get('shapeJson')))
      }
    },
    
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

//    isPortrait: function() {
//      return window.innerHeight > window.innerWidth;
//    },
//    
//    isLandscape: function() {
//      return !this.isPortrait();
//    },
    
    padding: function(horizontal) {
      var one = horizontal ? 'left' : 'top';
      var two = horizontal ? 'right' : 'bottom';
      var padding = this.$el.css('padding') || "0px";
      var onePadding = this.$el.css('padding-' + one) || "0px",
          twoPadding = this.$el.css('padding-' + two) || "0px";
      
      padding = parseFloat(padding);
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
    
    getHashInfo: function() {
      return _.clone(this._hashInfo);
    },
    
    isCacheable: function() {
      return true;
    },

    isPortrait: function() {
      return this.getOrientation() == 'portrait';
    },
    
    isLandscape: function() {
      return this.getOrientation() == 'landscape';
    },

    getTitle: function() {
      if (this.resource)
        return U.getDisplayName(this.resource);
      else if (this.collection)
        return this.collection.models[0] && U.getDisplayName(this.collection.models[0]);
      else
        return "Unknown";
    },
    
    isInViewport: function() {
      return this.el && U.isInViewport(this.el);
    },

    isAtLeastPartiallyInViewport: function() {
      return this.el && U.isAtLeastPartiallyInViewport(this.el);
    },

    logVisibility: function() {      
      var numVisible = 0,
          numPartiallyVisible = 0,
          numInvisible = 0;
      
      _.each(this.children, function(child) {
        child.logVisibility();
        var isVisible = child.isInViewport(),
            isPartiallyVisible = child.isAtLeastPartiallyInViewport();
        
        isVisible ? numVisible++ && numPartiallyVisible++ : numInvisible++;
        child.log('visibility', '"{0}" is {1}visible'.format(child.getTitle(), isVisible ? '' : 
                                                                                 isPartiallyVisible ? 'partially ' : 'in'));
      });
    },
    
    getOrientation: function() {
      return ($(window).height() > $(window).width()) ? 'portrait' : 'landscape';
    },
    
    log: function() {
      if (G.DEBUG) {
        var args = [].slice.call(arguments);
        args.unshift(this.TAG);
        G.log.apply(G, args);
      }
    }
  }, {
    displayName: 'BasicView'
  });

  return BasicView; 
});