//'use strict';
define('views/BasicView', [
  'globals',
  'backbone',
  'utils',
  'templates',
  'events',
  'lib/fastdom'
], function(G, _Backbone, U, Templates, Events, Q) {
  var basicOptions = ['source', 'parentView', 'returnUri'],
      AP = Array.prototype,
      viewportEvents = ['resize', 'orientationchange'],
      viewProps = ['pageView', 'parentView', 'model', 'resource', 'collection'],
      backboneOn = Backbone.View.prototype.on,
      $wnd = $(window);

  function disableHover($el) {
    $el.bind('mouseover', function() {
      return false;
    });
  }
  
  // END http://open.bekk.no/mixins-in-backbone //
  
  var BasicView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'reverseBubbleEvent', 'render', 'refresh', 'destroy', '_onActive', '_onInactive', '_onViewportDimensionsChanged', '_render',  '_refresh');      
      this.TAG = this.TAG || this.constructor.displayName;
//      this.log('newView', ++this.constructor._instanceCounter);
      
      var superCtor = this.constructor;
      while (superCtor.__super__) {
        var superDuperCtor = superCtor.__super__.constructor;
        if (superCtor === superDuperCtor) // prevent infinite loops
          break;
        
        _.defaults(this.events, superDuperCtor.prototype.events);
        superCtor = superDuperCtor;
      }
      
      // replace click with vclick and so on, if necessary
      for (var eventSelectorName in this.events) {
        var eventName = eventSelectorName.match(/^([^\.\ ]+)/);
        if (!eventName)
          continue;
        
        eventName = eventName[1];
        var actualName = Events.getEventName(eventName);
        if (actualName !== eventName && !events[actualName]) {
          this.events[eventSelectorName.replace(eventName, actualName)] = this.events[eventSelectorName];
          delete this.events[eventSelectorName];
        }
      }
      
      options = options || {};
      this._updateHashInfo();
      this._loadingDfd = new $.Deferred();
      this._loadingDfd.promise().done(function() {
        if (!this.rendered)
          this.rendered = true;
      }.bind(this));
      
      this._taskQueue = [];      
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
          this.listenTo(res, 'modelChanged', this._onModelChanged);
        }
        
        this.modelType = this.vocModel.type;
      }
      
      this.router = window.router || Backbone.history; //G.Router || Backbone.history;
      
      this._doRefresh = this.refresh;
      this.refresh = this._refresh;

      this._doRender = this.render;
      this.render = this._render;

//      this.on('active', this._onActive);
//      this.on('inactive', this._onInactive);
      
      for (var i = 0; i < viewportEvents.length; i++) {
        var event = viewportEvents[i],
            listener = 'on' + event;
        
        if (listener in window) {
          window.addEventListener(event, this._onViewportDimensionsChanged, false);          
        }
      }
      
//      this.on('destroyed', this._onDestroyed);
      this.loc = G.localize;
      if (this.model)
        this.listenTo(Events, 'preparingModelForDestruction.' + this.model.cid, this._preventModelDeletion);
      
//      G.log(this.TAG, 'new view', this.getPageTitle());
      return this;
    },
    
    windowEvents: {
      'resize.default': '_onViewportDimensionsChanged',
      'orientationchange.default': '_onViewportDimensionsChanged'
    },
    
    myEvents: {
      '.default active': '_onActive',
      '.default inactive': '_onInactive',
      '.default destroyed': '_onDestroyed'
    },
    
    globalEvents: {},
    
    modelEvents: {},
    
    _preventModelDeletion: function() {
      Events.trigger('saveModelFromUntimelyDeath.' + this.model.cid);
    },
    
    _updateHashInfo: function() {
      this._hashInfo = U.getCurrentUrlInfo();
      this.hash = U.getHash();
      this.hashParams = this._hashInfo && this._hashInfo.params || {};
    },

    getBaseTemplateData: function() {
      var data = {
        viewId: this.cid
      };
      
      if (this.resource) {
        data._uri = this.resource.get('_uri');
//        data.davDisplayName = this.resource.attributes.davDisplayName;
      }
      
      return data;
    },
    
    refresh: function() {
      // override this
    },
    
//    _refresh: function(rOptions) {
//      var force = rOptions && rOptions.force;
//      if (!force && !this.rendered)
//        return this;
//      
////      this.log('refresh', 'page title:', this.getPageTitle());
//      this._queueTask(this._doRefresh, this, arguments);
//      return this;
//    },
    
    _refresh: function(rOptions) {
      var force = rOptions && rOptions.force;
      if (!force && !this.rendered)
        return this;
      
//      this.log('refresh', 'page title:', this.getPageTitle());
//      this._queueTask(this._doRefresh, this, arguments);
      if (this.isActive())
        this._doRefresh.apply(this, arguments);
      else
        this._refreshArgs = arguments;
      
      return this;
    },

    //    _render: function(rOptions) {
////      this.log('render', 'page title:', this.getPageTitle());
//      this._queueTask(function() {
//        this._doRender.apply(this, arguments);
//        if (this.autoFinish !== false)
//          this.finish();
//
//        if (G.browser.mobile)
//          disableHover(this.$el);
//      }, this, arguments); //, !delay);
//      
//      return this;
//    },

    _render: function(rOptions) {
  //    this.log('render', 'page title:', this.getPageTitle());
      if (this.isActive()) {
        this._doRender.apply(this, arguments);
        if (this.autoFinish !== false)
          this.finish();
        
        if (G.browser.mobile)
          disableHover(this.$el);
      }
      else
        this._renderData = arguments;
      
      return this;
    },

    isChildless: function() {
      return !_.size(this.children);
    },
    
    update: function() {
      if (this.rendered)
        this.refresh.apply(this, arguments);
      else
        this.render.apply(this, arguments);      
    },
    
    destroy: function() {
      if (this._destroyed)
        return;
      
      this._destroyed = true;
      this.trigger('destroyed');
    },
    
    _onDestroyed: function() {
      this.trigger('inactive');
      for (var cid in this.children) {
        this.children[cid].destroy();
      }
      
      for (var i = 0; i < viewportEvents.length; i++) {
        window.removeEventListener(viewportEvents[i], this._onViewportDimensionsChanged);          
      }
      
      Events.trigger('viewDestroyed', this);
      Events.trigger('viewDestroyed:' + this.cid, this);
      
      this.stopListening();
      this.$el.remove();
//      Q.start(this.$el.remove, this.$el);
      
//      for (var i in viewProps) {
//        this[viewProps[i]] = null;
//      }
//      
//      _.wipe(this);
    },
    
    _onModelChanged: function() {
      this.vocModel = this.model.vocModel;
    },
    
    _getChildrenLoadingDeferreds: function() {
      return _.pluck(this.getDescendants(), '_loadingDfd');
    },
    
    _getLoadingDeferreds: function() {
      return [this._loadingDfd].concat(this._getChildrenLoadingDeferreds());
    },
    
//    isDoneLoading: function() {
//      return _.all(this._getLoadingDeferreds(), function(c) {
//        return c.state() !== 'pending';
//      });
//    },

    onload: function(callback) {
      return $.whenAll.apply($, this._getLoadingDeferreds()).then(callback);
    },

//    onload: function(callback) {
//      return this._loadingDfd.promise().then(callback);
//    },
//
//    onChildrenLoaded: function(callback) {
//      var promise = $.whenAll.apply($, this._getChildrenLoadingDeferreds());
//      callback && promise.then(callback);
//      return promise;
//    },
    
    finish: function() {
      this._loadingDfd.resolve();
    },
    
    _queueTask: function(fn, scope, args) {
      var self = this,
          lazyDfd = $.Deferred();
      
      this._taskQueue.push(lazyDfd);
      lazyDfd.start = function() {
        this._started = true;
//        self.log('info', 'running {0} task'.format(self.TAG));
        var promise = fn.apply(scope, args || []);
        if (_.isPromise(promise))
          promise.then(lazyDfd.resolve, lazyDfd.reject);
        else
          lazyDfd.resolve();
      };
      
      lazyDfd.promise().always(function() {
        self._dequeueTask(lazyDfd);
        self._processQueue();
      });
      
      this._processQueue();
    },

    _dequeueTask: function(task) {
      Array.remove(this._taskQueue, task);
    },

    _processQueue: function() {
      if (!this.isActive())
        return;
      
      var next = this._taskQueue[0];
      if (next) {
        if (!next._started) {
//          G.q({
//            name: this.TAG + ':task:' + this.cid,
//            task: next.start.bind(next)
          next.start();
//          });
        }
        else
          this.log('info', 'postponing {0} {1} task'.format(this.TAG, this.cid));
      }
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
        
      _.pushUniq(this._templates, templateName);
      this._templateMap[templateName] = localName;
      this._monitorTemplate(templateName);
      return template;
    },  
    
    _monitorTemplate: function(templateName) {
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
    },
    
    atBottom: function() {
      var $w = $(window);
      return this.pageView.$el.height() - $w.height() - $w.scrollTop() < 20;
    },
    
//    onInactive: function(callback) {
//      this._inactiveDfd.done(callback);
//    },
//
//    onActive: function(callback) {
//      this._activeDfd.done(callback);
//    },
    
    addChild: function(view) {
      var self = this;
      if (!this.children)
        this.children = {};
      
      this.children[view.cid] = view;
      view.parentView = view.parentView || this;
      view.pageView = this.getPageView() || view.pageView;
      view.once('destroyed', function() {
        if (self.children)
          delete self.children[view.cid];
        
        for (var prop in self) {
          if (self[prop] === view)
            self[prop] = null;
        }
      });
      
      return view;
    },
    
    getChildViews: function() {
      return this.children;
    },

    empty: function() {
//      _.wipe(this.children);
      this.$el.empty();
    },

    html: function(html) {
//      _.wipe(this.children);
      this.$el.html(html);
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
      _.each(this.children, function(child) {
        child.$el && child.$el.triggerHandler(e.type, e); // triggerHandler will prevent the event from bubbling back up and creating an infinite loop
      });
    },
    
    triggerChildren: function(event) {
      var args = _.tail(arguments);
      args.unshift(event);
      _.each(this.children, function(child) {
        child.trigger.apply(child, args);
      }); // keep this
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
    
    _onViewportDimensionsChanged: function(event) {
      var $el = this.$el,
          type = event.type;
      
      if (this.isActive())
        $el.trigger(type);
    },
    
//    _onActive: function() {
//      if (this.active)
//        return;
//      
//      this.active = true;
//      this.triggerChildren('active');
//      this._updateHashInfo();
//      this._processQueue();
//    },

    _onActive: function() {
      if (this.active)
        return;
      
      var renderArgs = this._renderArgs,
          refreshArgs = this._refreshArgs;
      
      this.active = true;
      this._renderArgs = this._refreshArgs = null;
      this.triggerChildren('active');
      this._updateHashInfo();
//      this._processQueue();
      if (renderArgs)
        this._render.apply(this, renderArgs);
      else if (refreshArgs)
        this._refresh.apply(this, refreshArgs);
    },

    _onInactive: function() {
      if (!this.active)
        return;
      
      this.active = false;
      this.triggerChildren('inactive');      
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
      var isGeo,
          role = U.getUserRole(),
          locProp = U.getCloneOf(this.vocModel, 'Locatable.latitude')[0] || U.getCloneOf(this.vocModel, 'Shape.shape')[0],
          allowRoles = locProp && this.vocModel.properties[locProp];
      
      if (this.collection) {
        return this.collection.isOneOf(["Locatable", "Shape"]) &&
               (!allowRoles || U.isUserInRole(role, allowRoles));
      }
      else {
        var res = this.resource;
        return ((res.isA("Locatable") && res.get('latitude') && res.get('longitude')) || 
               (res.isA("Shape") && res.get('shapeJson'))) && 
               (!allowRoles || U.isUserInRole(role, allowRoles, res));
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

    getOffset: function(css) {
//      var computedStyle = window.getComputedStyle()
      return this.$el.offset();
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

    // <debug>
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
    // </debug>
  
    getPreviousHash: function() {
      return this.getPageView().source;
    },
    
    getOrientation: function() {
      return ($(window).height() > $(window).width()) ? 'portrait' : 'landscape';
    },

    navigate: function(fragment, options) {
      Events.trigger('navigate', fragment, options);
    },
    
    log: function() {
      if (G.DEBUG) {
        var args = _.toArray(arguments);
        args.unshift(this.TAG);
        G.log.apply(G, args);
      }
    },

//    _fetchImage1: function(img) {
//      img.src = img.getAttribute(lazyAttr);
//      cleanImage(img);
//    },

    findResourceByCid: function(cid) {
      if (this.resource && this.resource.cid == cid)
        return this.resource;
      
      for (var childId in this.children) {
        var res = this.children[childId].findResourceByCid(cid);
        if (res)
          return res;
      }
  
      return undefined;
    },
    
    findResourceByUri: function(uri) {
      if (this.resource && this.resource.getUri() == uri)
        return this.resource;
      
      for (var childId in this.children) {
        var res = this.children[childId].findResourceByUri(uri);
        if (res)
          return res;
      }
  
      return undefined;
    },
    
    /**
     * @return offsets on all sides of the visible part of the element, an area no greater than the browser viewport
     */
    getVisibleArea: function(forceRecalc) {
      var width,
          height,
          top,
          bottom;
      
      // assume for now that we don't nest scrollables in scrollables...and that only pageViews use the Scrollable mixin...for now
      if (this.pageView.mixes('Scrollable')) {
      	return this.pageView.getVisibleScrollerArea(forceRecalc);
      }
      else {
        var offset = this.$el.offset();
        width = Math.min(window.innerWidth, this.$el.width());
        height = Math.min(window.innerHeight, this.$el.height());
        offset.bottom = offset.top + height;
        offset.right = offset.left + width;
        return offset;
      }
    },
    
    on: function() {
      var args = arguments;
      if (args.length == 2) {
        args = _.toArray(args);
        args.push(this);
      }
        
      return backboneOn.apply(this, args);
    }
  }, {
    displayName: 'BasicView',
    _instanceCounter: 0
  });

  return BasicView; 
});