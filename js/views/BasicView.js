//'use strict';
define('views/BasicView', [
  'globals',
  'backbone',
  'utils',
  'domUtils',
  'templates',
  'events',
  'physicsBridge',
  'lib/fastdom'
], function(G, _Backbone, U, DOM, Templates, Events, Physics, Q) {
  var AP = Array.prototype,
      backboneOn = Backbone.View.prototype.on,
      $wnd = $(window),
      baseTemplateData = function() {};

  baseTemplateData.prototype = {
    G: G,
    $: $,
    U: U,
    loc: function() {
      G.localize.apply(this, arguments);
    }
  };
  
  baseTemplateData = new baseTemplateData();
  function disableHover(el) {
    el.addEventListener('mouseover', function() {
      return false;
    });
  }

  // END http://open.bekk.no/mixins-in-backbone //
  
  var BasicView = Backbone.View.extend({
//    viewType: 'resource',
    _scrollerType: 'verticalMain',
    _numBricks: 0,
    _initializedCounter: 0,
    _flexigroup: false,
    _draggable: false,
    _scrollbar: false,
    _scrollbarThickness: 5,
    _dragAxis: null, // 'x' or 'y' if you want to limit it to one axis
    _rail: true,
    _scrollAxis: 'y',
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'destroy', '_onActive', '_onInactive', '_render',  '_refresh', 'finish', '_onViewportDimensionsChanged', '_recheckDimensions', '_onMutation');
      this._initializedCounter++;
      this.TAG = this.TAG || this.constructor.displayName;
//      this.log('newView', ++this.constructor._instanceCounter);
      var superCtor = this.constructor;
      while (superCtor.__super__) {
        var superDuperCtor = superCtor.__super__.constructor;
        if (superCtor === superDuperCtor) // prevent infinite loops
          break;
        
        _.defaults(this.events, superDuperCtor.prototype.events);
        _.defaults(this.pageEvents, superDuperCtor.prototype.pageEvents);
        _.defaults(this.myEvents, superDuperCtor.prototype.myEvents);
        _.defaults(this.windowEvents, superDuperCtor.prototype.windowEvents);
        superCtor = superDuperCtor;
      }
      
//      // replace click with vclick and so on, if necessary
//      for (var eventSelectorName in this.events) {
//        var eventName = eventSelectorName.match(/^([^\.\ ]+)/);
//        if (!eventName)
//          continue;
//        
//        eventName = eventName[1];
//        var actualName = Events.getEventName(eventName);
//        if (actualName !== eventName && !events[actualName]) {
//          this.events[eventSelectorName.replace(eventName, actualName)] = this.events[eventSelectorName];
//          delete this.events[eventSelectorName];
//        }
//      }
      
      options = options || {};
      this._updateHashInfo();
      this._loadingDfd = new $.Deferred();
      this._loadPromise = this._loadingDfd.done(function() {
        if (!this.rendered) {
          this.rendered = true;
          this.trigger('rendered');
        }
      }.bind(this));

      this._bodies = [];
      this._draggables = [];
      this._taskQueue = [];      
      this._templates = [];
      this._templateMap = {};

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
      
//      this.on('destroyed', this._onDestroyed);
      this.loc = G.localize;
      if (this.model)
        this.listenTo(Events, 'preparingModelForDestruction.' + this.model.cid, this._preventModelDeletion);
      
      this._dimensions = {};
      this._bounds = new Array(4);
//      if (this.resource)
//        this._viewBrick._uri = U.getShortUri(this.resource.getUri(), this.vocModel);
//
//      G.log(this.TAG, 'new view', this.getPageTitle());
      return this;
    },
    
    _configure: function() {
//      options = options || {};
//      options.attributes = options.attributes || {};
//      options.attributes['data-viewid'] = this.cid;
      var atts = this.attributes = this.attributes || {};
      atts['data-viewid'] = this.cid;
//      if (!_.has(atts, 'id'))
//        atts['id'] = 'view' + G.nextId();
      
      return Backbone.View.prototype._configure.apply(this, arguments);
    },
    
    renderHtml: function(html) {
      var tag = DOM.tag(this.tagName, html, this.attributes);
      return DOM.toHTML(tag);
    },

//    /**
//     * doesn't change a thing, only remembers this view's dimensions
//     */
//    setDimensions: function(width, height) {
//      var dim = this._dimensions;
//      dim.width = width;
//      dim.height = height;
//    },
//    
//    /**
//     * @return the last data passed in to setDimensions (doesn't access DOM so may not be up to date)
//     */
//    getDimensions: function() {
//      return this._dimensions;
//    },
//    
//    setWidth: function(width) {
//      this._dimensions.width = width;
//    },
//
//    setHeight: function(height) {
//      this._dimensions.height = height;
//    },

    /**
     * doesn't change a thing, only remembers this view's position
     */
    setPosition: function(x, y, z) {
      if (arguments.length == 1)
        this._position = arguments[0];
      else {
        var loc = this._position = this._position || {};
        loc.x = x;
        loc.y = y;
        loc.z = z;
      }
    },

    /**
     * @return the last data passed in to setPosition (doesn't access DOM so may not be up to date)
     */
    getPosition: function() {
      return this._position;
    },

    /**
     * doesn't change a thing, only remembers this view's offset from its parent
     */
    setParentOffset: function(x, y, z) {
      if (arguments.length == 1)
        this._parentOffset = arguments[0];
      else {
        var loc = this._parentOffset = this._parentOffset || {};
        loc.x = x;
        loc.y = y;
        loc.z = z;
      }
    },

    /**
     * @return the last data passed in to setParentOffset (doesn't access DOM so may not be up to date)
     */
    getParentOffset: function() {
      return this._parentOffset;
    },

    /**
     * @return true if this element is at least partially in the viewport
     */
    isInViewport: function() {
      var loc = this._position,
          dim = this._dimensions,
          myWidth = dim && dim.width || 0,
          myHeight = dim && dim.height || 0,
          viewport;
      
      if (!loc)
        return false;
      
      viewport = G.viewport;
      return loc.x >= viewport.width - myWidth && 
             loc.x <= viewport.width + myWidth &&
             loc.y >= viewport.width - myHeight && 
             loc.y <= viewport.height + myHeight;
    },
    
//    calculateGeography: function() {
//      if (!this._offsetParent)
//        this._offsetParent = this.$el.offsetParent();
//      
//      if (!this._parentPosition)
//        this._parentPosition = this.parentView.getPosition();
//      
//      var el = this.el,
//          width = el.offsetWidth,
//          height = el.offsetHeight,
//          parentPosition = this._parentPosition || this.,
//          offsetParent,
//          x,
//          y;
//
//      
//      
//      this.setDimensions(width, height);
//      while (parent = parent.parentView) {
//        var parentPos = parent.getPosition();
//        
//      }
//      
//      self.setChildPosition(child);
//    },
//
//    setElement: function(el) {
//      this._hammer = Hammer(el instanceof $ ? el[0] : el, {
//        prevent_default: true,
//        no_mouseevents: true
//      });
//      
//      return Backbone.View.prototype.setElement.apply(this, arguments);
//    },
    
    myEvents: {
      '.default active': '_onActive',
      '.default inactive': '_onInactive',
      '.default destroyed': '_onDestroyed'
    },
    
    globalEvents: {},
    
    modelEvents: {},
    
    windowEvents: {
      'viewportdimensions': '_onViewportDimensionsChanged'
    },
    
    _preventModelDeletion: function() {
      Events.trigger('saveModelFromUntimelyDeath.' + this.model.cid);
    },
    
    _updateHashInfo: function() {
      this._hashInfo = U.getCurrentUrlInfo();
      this.hash = U.getHash();
      this.hashParams = this._hashInfo && this._hashInfo.params || {};
    },

    getBaseTemplateData: function() {
      var data = this._baseTemplateData;
      if (data)
        _.wipe(data);
      else
        data = this._baseTemplateData = {};
      
      data.viewId = this.cid;
      if (this.resource)
        data._uri = this.resource.get('_uri');
      
      return data;
    },
    
    refresh: function() {
      // override this
    },
    
    _refresh: function(rOptions) {
      rOptions = rOptions || {};
      var force = rOptions.force;
      if (!force && !this.rendered)
        return this;
      
//      this.log('refresh', 'page title:', this.getPageTitle());
//      this._queueTask(this._doRefresh, this, arguments);
      if (this.isActive()) {
        this._doRefresh.apply(this, arguments);
        if (rOptions.delegateEvents !== false)
          this.redelegateEvents();
        
        this._checkScrollbar();
      }
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

    _checkScrollbar: function() {
      if (this._scrollbar) {
        this.scrollbar = this.el.$('.scrollbar')[0];
        if (!this.scrollbar) {
          var self = this,
              scrollbarId = this.getScrollbarId(),
              tmpl_data = {
                axis: this._scrollAxis,
                id: scrollbarId
              };
          
          if (!this.scrollbarTemplate)
            this.makeTemplate('scrollbarTemplate', 'scrollbarTemplate', this.vocModel && this.vocModel.type);

          tmpl_data[this._scrollAxis == 'x' ? 'height' : 'width'] = this._scrollbarThickness;
          this.scrollbar = DOM.parseHTML(this.scrollbarTemplate(tmpl_data))[0];
          this.el.$prepend(this.scrollbar);
          Physics.here.addBody(this.scrollbar, scrollbarId);
//          Q.read(function() {
//            Physics.there.updateBody(scrollbarId, {
//              //.. new vertices based on new ortho-axis dim of scrollbar
//            });
//          }, this);
        }
      }
    },
    
    _render: function(rOptions) {
  //    this.log('render', 'page title:', this.getPageTitle());
      rOptions = rOptions || {};
      if (rOptions.force || this.isActive()) {
        var result = this._doRender.apply(this, arguments);
        if (this.autoFinish !== false)
          this.finish(rOptions);
        else if (rOptions.delegateEvents !== false)
          this.redelegateEvents(); // bind what events we can at the moment
        
        if (this.el && G.browser.mobile) // TODO disable hover when el appears
          disableHover(this.el);

        this._checkScrollbar();
        return result;
      }
      else {
        this._renderArgs = arguments;
        return this;
      }
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
    
    destroy: function(keepEl) {
      if (this._destroyed)
        return;
      
      this._destroyed = true;
      this.trigger('destroyed', keepEl);
    },
    
    _onDestroyed: function(keepEl) {
//      Events.trigger('garbage', this);
      this.trigger('inactive');
      for (var cid in this.children) {
        this.children[cid].destroy();
      }
      
//      if (this.parentView)
//        delete this.parentView.children[this.cid];
//      
//      for (var i = 0; i < viewportEvents.length; i++) {
//        window.removeEventListener(viewportEvents[i], this._onViewportDimensionsChanged);          
//      }
      
      Events.trigger('viewDestroyed', this);
      Events.trigger('viewDestroyed:' + this.cid, this);
      
      if (this.model)
        this.stopListening(this.model);
      if (this.pageView)
        this.stopListening(this.pageView);
      
      this.undelegateAllEvents();
      this.stopListening(); // last cleanup
      this.unobserveMutations();
      
      if (this.parentView) {
        this.parentView.removeChild(this);
        delete this.parentView;
      }

      if (this.pageView)
        delete this.pageView;
      
      if (this._draggable)
        Physics.removeDraggable(this.getContainerBodyId());
      if (this.mason)
        this.mason.destroy();

      if (!keepEl && this.el)
        this.el.$remove();
      
      this.$el = this.el = this._hammer = this._hammered = null;
      
//      if (this._bodies.length)
//        Physics.removeBodies.apply(Physics, this._bodies);
//      if (this._draggables.length)
//        Physics.removeDraggables.apply(Physics, this._draggables);
    },
    
    _onModelChanged: function() {
      this.vocModel = this.model.vocModel;
    },
    
    _getChildrenLoadingPromises: function() {
      return _.pluck(this.getDescendants(), '_loadPromise');
    },
    
    _getLoadingPromises: function() {
      return [this._loadPromise].concat(this._getChildrenLoadingPromises());
    },
    
//    isDoneLoading: function() {
//      return _.all(this._getLoadingDeferreds(), function(c) {
//        return c.state() !== 'pending';
//      });
//    },

    onload: function(callback, context) {
      return this._loadPromise.done(context ? callback.bind(context) : callback);
//      return $.whenAll.apply($, this._getLoadingPromises()).then(callback);
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
    
    finish: function(options) {      
      this._loadingDfd.resolve();
      if (!options || options.delegateEvents !== false)
        this.redelegateEvents();
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
      var proxy = function(json) {
        if (json == baseTemplateData)
          return template(json);
        else
          return template(_.extend(this.getBaseTemplateData(), json));
      }.bind(this);
      
      return proxy;
    },  
    
    _monitorTemplate: function(templateName) {
      var self = this,
          event = 'templateUpdate:' + templateName;
      
      this.stopListening(Events, event);
      this.listenTo(Events, event, function(template) {
        var dClUri = template.get('modelDavClassUri');
        if (dClUri) {
          var type = U.getTypeUri(dClUri);
          if (U.getTypes(self.vocModel).indexOf(type) == -1)
            return;
        }
        
        self.makeTemplate(templateName, self._templateMap[templateName], dClUri);
        self[self.rendered ? 'render' : 'refresh']();
        self.restyle();
      });
    },
    
    atBottom: function() {
      return this.pageView.$el.height() - $wnd.height() - $wnd.scrollTop() < 20;
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
      return view;
    },
    
    removeChild: function(view) {
      if (this.children)
        delete this.children[view.cid];
      
//      for (var prop in this) {
//        if (this[prop] === view)
//          this[prop] = null;
//      }
    },
    
    getChildViews: function() {
      return this.children;
    },

//    empty: function() {
////      _.wipe(this.children);
//      this.$el.empty();
//    },
//
//    html: function(html) {
////      _.wipe(this.children);
//      this.$el.html(html);
//    },
    
    getDescendants: function() {
      if (!this.children)
        return [];
      else {
        var childViews = _.values(this.children);
        return _.union([], childViews, _.union.apply(_, _.map(childViews, function(child) {return child.getDescendants()})));
      }
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

    getLastPageEvent: function() {
      var pageView = this.getPageView();
      return pageView && pageView._lastPageEvent;
    },
    
    getPageTitle: function() {
      return this.pageView && this.pageView.getPageTitle();
    },
    
    updateMason: function() {
      if (this.mason) {
        var args = [this._bounds];
        if (this._viewBrick)
          args.push([this._viewBrick])
        
        this.mason.resize.apply(this.mason, args);
        return true;
      }        
    },
    
    _onViewportDimensionsChanged: function() {
      Q.read(this._recheckDimensions, this);
    },
    
    _recheckDimensions: function() {
      if (this.el && this.mason && this._updateSize()) {
        if (this._viewBrick)
          this.buildViewBrick();
        
        return this.updateMason();
      }
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
      
      if (this.mason) {
        this.mason.wake();
//        DOM.queueRender(this.el, DOM.opaqueStyle);
        if (this._draggable)
          this.addDraggable();
      }
      
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
      if (this._draggable)
        Physics.disconnectDraggable(this.getContainerBodyId());

//      if (this.mason) {
//        this.mason.sleep();
//        DOM.queueRender(this.el, DOM.transparentStyle);
//      }
      
      this.triggerChildren('inactive');      
    },
    
    turnOffPhysics: function() {
      if (this.mason && !this.isActive())
        this.mason.sleep();
      
      var children = this.children;
      if (children) {
        for (var id in children) {
          children[id].turnOffPhysics();
        }
      }
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
          allowRoles = locProp && this.vocModel.properties[locProp].allowRoles;
      
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

      for (var selector in selectors) {
        var el = this.$(selector);
        selectors[selector].setElement(el instanceof NodeList ? el[0] : el).render(renderOptions);
      }
      
//      Q.read(function() {
//        for (var selector in selectors) {
//          selectors[selector].setElement(this.$(selector));
//        }
//        
//        for (var selector in selectors) {      
//          selectors[selector].render(renderOptions);
//        }
//      }, this);      
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
      if (G.isJQM()) {
        this.$el.find('ul[data-role]').listview();
        this.$el.find('div[data-role="fieldcontain"]').fieldcontain();
        this.$el.find('button[data-role="button"]').button();
        this.$el.find('input,textarea').textinput();
//      this.$el.page();
      }
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

//    getOffset: function(css) {
////      var computedStyle = window.getComputedStyle()
//      return this.$el.offset();
//    },
    
    getTitle: function() {
      if (this.resource)
        return U.getDisplayName(this.resource);
      else if (this.collection)
        return this.collection.models[0] && U.getDisplayName(this.collection.models[0]);
      else
        return "Unknown";
    },
    
//    isInViewport: function() {
//      return this.el && U.isInViewport(this.el);
//    },
//
//    isAtLeastPartiallyInViewport: function() {
//      return this.el && U.isAtLeastPartiallyInViewport(this.el);
//    },
//
//    // <debug>
//    logVisibility: function() {      
//      var numVisible = 0,
//          numPartiallyVisible = 0,
//          numInvisible = 0;
//      
//      _.each(this.children, function(child) {
//        child.logVisibility();
//        var isVisible = child.isInViewport(),
//            isPartiallyVisible = child.isAtLeastPartiallyInViewport();
//        
//        isVisible ? numVisible++ && numPartiallyVisible++ : numInvisible++;
//        child.log('visibility', '"{0}" is {1}visible'.format(child.getTitle(), isVisible ? '' : 
//                                                                                 isPartiallyVisible ? 'partially ' : 'in'));
//      });
//    },
//    // </debug>
  
    getPreviousHash: function() {
      return this.getPageView().source;
    },
    
    getOrientation: function() {
      var viewport = G.viewport;
      return viewport.height > viewport.width ? 'portrait' : 'landscape';
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

    findChildByResource: function(res) {
      for (var childId in this.children) {
        var child = this.children[childId];
        if (child.resource == res)
          return child;
      }
      
      return undefined;
    },
    
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
    
    on: function() {
      var args = arguments;
      if (args.length == 2) {
        args = _.toArray(args);
        args.push(this);
      }
        
      return backboneOn.apply(this, args);
    },
    
    doesModelSubclass: function(clName) {
      var supers = this['extends'];
      return !!(supers && supers.length && (~supers.indexOf(clName) || (!/\^http:\/\//.test(clName) && ~supers.indexOf(U.getLongUri1(clName)))));
    },

    doesModelImplement: function(iface) {
      var interfaces = this['implements'];
      return !!(interfaces && ~interfaces.indexOf(iface));
    },
    
    unobserveMutations: function() {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
      } else {
        this.el && this.el.removeEventListener('DOMSubtreeModified', this._mutationObserverCallback, true);
      }
    },

    observeMutations: function(options, callback) {
      this._mutationObserverCallback = callback;
      if (!this._mutationObserver) { // reuse disconnected instance if available
        if (window.MutationObserver)
          this._mutationObserver = new MutationObserver(callback);
      }

      if (this._mutationObserver) {
        this._mutationObserver.observe(this.el, _.defaults(options || {}, {
          attributes: true,
          childList: true,
          characterData: true,
          attributeOldValue: true,
          subtree: true
        }));
      } else {
        this.el.addEventListener('DOMSubtreeModified', callback, true);
      }      
    },
    
    getFetchPromise: function() {
      return this.pageView && this.pageView.getFetchPromise();
    },
    
    toggleVisibility: function(off) {
      if (this.el) {
        if (off)
          this.el.style.opacity = 0;
        else
          this.el.style.opacity = 1;
      }
    },
    
    getScrollbarId: function() {
      return 'scrollbar-' + this.getBodyId();
    },

    getBoxBodyId: function() {
      return Physics.getBoxId(this.getBodyId());
    },

    getRailBodyId: function() {
      return Physics.getRailId(this.getBodyId());
    },

    getContainerRailBodyId: function() {
      return Physics.getRailId(this.getContainerBodyId());
    },

    getContainerBoxBodyId: function() {
      return Physics.getBoxId(this.getContainerBodyId());
    },

    getBodyId: function() {
      return this.cid;
    },

    getContainerBodyId: function() {
      return this.TAG + '.' + this.cid;
    },

    getFlexigroupId: function() {
      return 'flexigroup.' + this.cid;
    },

    addDraggable: function() {
      Physics.addDraggable(this.hammer(), this._flexigroup ? this.getFlexigroupId() : this.getContainerBodyId(), this._dragAxis);
    },

    _updateSize: function() {
      // TODO - move this to domUtils - it's per DOM element, not per view
      var viewport = G.viewport,
          doUpdate = false,
          oldOuterWidth = this._outerWidth,
          oldOuterHeight = this._outerHeight,
          oldWidth = this._width,
          oldHeight = this._height;

      this._offsetLeft = this.el.offsetLeft;
      this._offsetTop = this.el.offsetTop;

      // TODO: fix this nonsense
      this._outerWidth = this.el.$outerWidth();
      if (this._outerWidth)
        this._width = Math.min(this._outerWidth, viewport.width);
      else
        this._width = viewport.width > this._offsetLeft ? viewport.width - this._offsetLeft : viewport.width;
      
      this._outerHeight = this.el.$outerHeight();
      if (this._outerHeight)
        this._height = Math.min(this._outerHeight, viewport.height);
      else
        this._height = viewport.height > this._offsetTop ? viewport.height - this._offsetTop : viewport.height;
          
      if (this._width != oldWidth || this._height != oldHeight)
        doUpdate = true;
      
      if (this._outerWidth != oldOuterWidth || this._outerHeight != oldOuterHeight) {
        doUpdate = true;
//        this._viewBrick.vertices = [
//          {x: 0, y: this._outerHeight},
//          {x: this._outerWidth, y: this._outerHeight},
//          {x: this._outerWidth, y: 0},
//          {x: 0, y: 0}
//        ];
      }
      
//      this._bounds = [this._offsetLeft, this._offsetTop, 
//                      this._offsetLeft + this._width, this._offsetTop + this._height];
      
      this._bounds[0] = this._bounds[1] = 0;
      this._bounds[2] = this._width;
      this._bounds[3] = this._height;
      
//      if (doUpdate && this._viewBrick)
//        this.buildViewBrick();
//      
//      if (this._horizontal) {
//        if (this._width > viewport.width)
//          this.log("BAD BAD BAD BAD WIDTH for " + this.TAG + ": " + this._width);
//      }
//      else {
//        if (this._height > viewport.height)
//          this.log("BAD BAD BAD BAD HEIGHT for " + this.TAG + ": " + this._height);        
//      }
        
      return doUpdate;
    },
    
    _onPhysicsMessage: function() {
      // override me
    },
    
    addToWorld: function(options, addViewBrick) {      
//      var viewport = G.viewport;
      if (this.mason)
        return;
      
      this._updateSize();
      var self = this,
          containerId = this.getContainerBodyId(),
          topEdgeId = _.uniqueId('topEdge'),
          scrollbarId,
          scrollbarOptions;

      if (this._scrollbar) {
        scrollbarId = this.getScrollbarId();
        scrollbarOptions = _.defaults({
          _id: scrollbarId,
          vertices: Physics.getRectVertices(this._scrollbarThickness, this._scrollbarThickness)
        }, _.omit(this.getContainerBodyOptions(), 'style'));
        
        Physics.there.addBody('convex-polygon', scrollbarOptions, scrollbarId);
      }
      

      options = options || {};      
      _.defaults(options, {
        slidingWindow: false,
        container: containerId,
        scrollbar: scrollbarId, 
        bounds: this._bounds,
        flexigroup: this._flexigroup ? this.getFlexigroupId() : false,
        scrollerType: this._scrollerType
      });

      this.addContainerBodyToWorld();
      this.mason = Physics.there.layout.newLayout(options, this._onPhysicsMessage);

//      $.when.apply($, this.pageView._getLoadingPromises()).done(function() { // maybe this is a bit wasteful?
//        if (self._updateSize())
//          self.updateMason();
//      });

      if (addViewBrick)
        this.addViewBrick();
      
      this.observeMutations(null, this._onMutation);
    },
    
    _onMutation: function(mutations) {
      var i = mutations.length,
          recheck = false,
          m;
      
      while (i--) {
        m = mutations[i];
        if (!m.target.classList.contains("scrollbar")) {
          recheck = true;
          break;
        }
      }
      
      if (!recheck)
        return;
      
      if (this._mutationTimeout) {
        if (resetTimeout(this._mutationTimeout))
          return;
        else
          clearTimeout(this._mutationTimeout);
      }
      
      this._mutationTimeout = setTimeout(this._onViewportDimensionsChanged, 20);
//      if (this.mason && this._updateSize()) {
//        this.updateMason();
//      }
//      
//      var self = this;
//      mutations.forEach(function(mutation) {
//        if (self.mason && self._updateSize() {
//          self.updateMason();
//        }
//      });
    },
    
    getContainerBodyOptions: function() {
      var options = this._containerBodyOptions = this._containerBodyOptions || {};
      options._id = this.getContainerBodyId();
      options.container = this.parentView && this.parentView.getContainerBodyId();
      options.x = 0;
      options.y = 0;
      if (!options.style)
        options.style = {};
      
      _.extend(options.style, this.style);
      return options;
    },
    
    setStyle: function(style) {
      Physics.there.style(this.getContainerBodyId(), style);
    },
    
    getMaxOpacity: function() {
      return DOM.maxOpacity;
    },
    
    addContainerBodyToWorld: function() {
      if (this._addedContainerBodyToWorld)
        return;
      
      this._addedContainerBodyToWorld = true;
      var id = this.getContainerBodyId(),
          railArgs,
          chain = [{
            method: 'addBody',
            args: ['point', this.getContainerBodyOptions()]
          }],
          x1, x2, y1, y2;
      
      if (this._rail) {
        if (this._rail instanceof Array)
          railArgs = this._rail;
        else if (this._dragAxis == 'x')
          railArgs = [id, 1, 0];
        else
          railArgs = [id, 0, 1];
        
        chain.push({
          method: 'addRail',
          args: railArgs
        });
      }
      
      if (this._flexigroup) {
         Physics.there.addBody('point', _.defaults({
           _id: this.getFlexigroupId()
         }, this.getContainerBodyOptions()));
      }
      
      Physics.here.addBody(this.el, id);      
      Physics.there.chain(chain);
      
//      Physics.there.addBody('point', this.getContainerBodyOptions(), id);
      if (this._draggable)
        this.addDraggable();
    },
    
    getViewBrick: function() {
      return this._viewBrick;
    },
    
    buildViewBrick: function() {
      if (!this._viewBrick) {
        this._viewBrick = {
          _id: this.getBodyId(),
          style: {}
        };
      }
      
      if (this.resource)
        this._viewBrick.resource = this.resource;
      
      if (this.style)
        _.extend(this._viewBrick.style, this.style);
      
      return this.buildBrick(this._viewBrick, true);
    },
    
    buildBrick: function(options, thisView) {
      var brick = options,
          v,
          width, 
          height;
      
//      brick.fixed = !this._flexigroup;
      brick.mass = _.has(brick, 'mass') ? brick.mass : 0.1;
      brick.restitution = _.has(brick, 'restitution') ? brick.restitution : 0.3;
      brick.lock = brick.lock || {};      
      
      if (thisView) {
        width = this._outerWidth;
        height = this._outerHeight;
        brick._id = this.getBodyId();
        if (this.resource)
          brick._uri = U.getShortUri(this.resource.getUri(), this.vocModel);
        
        // HACK
        if (this._dragAxis)
          brick.lock[_.oppositeAxis(this._dragAxis)] = 0;
        // END HACK

        brick.offset = brick.offset || {};
        brick.offset.x = this._offsetLeft;
        brick.offset.y = this._offsetTop;
      }
      else {
        if (brick.el) {
          debugger;
          width = brick.el.$outerWidth();
          height = brick.el.$outerHeight();
          brick.offset = brick.offset || {};
          brick.offset.x = brick.el.offsetLeft;
          brick.offset.y = brick.el.offsetTop;
          delete brick.el;
        }
        
        if (brick.resource)
          brick._uri = U.getShortUri(brick.resource.getUri(), brick.resource.vocModel);
      }
      
//      if (_.has(brick, 'resource')) {
//        brick._uri = U.getShortUri(brick.resource.getUri(), brick.resource.vocModel);
        delete brick.resource;
//      }
      
      // vertices
      brick.vertices = Physics.updateRectVertices(brick.vertices, width, height);
      return brick;
    },
    
    addViewBrick: function() {
      this.addBricksToWorld([this.buildViewBrick()]);
      
      // TODO: get rid of this when we make everything into bricks 
      this.mason.setLimit(this._numBricks);
    },
    
    addBricksToWorld: function(bricks, atTheHead) {
      this._numBricks += bricks.length;
      this.mason.addBricks(bricks, atTheHead);
//      this.mason.setLimit(this._numBricks);
    },

    removeFromWorld: function() {
      Physics.there.removeBody(this.getBodyId());
      this._addedToWorld = false;
    }
  }, {
    displayName: 'BasicView',
    _instanceCounter: 0,
    /*
    // Example of preinitData used by preinitialize method
    preinitData: {
      interfaceProperties: {
        ImageResource: ['ImageResource.originalImage']
      },
      superclasses: [G.commonTypes.App, 'Urbien'];
    }
     */
    preinitialize: function(options) {
      var vocModel = options.vocModel,
          meta = vocModel.properties,
          preinitData = this.preinitData,
          interfaceProps = preinitData && preinitData.interfaceProperties,
          superclasses = preinitData && preinitData.superclasses || [],
          preinit = _.extend({
            clonedProperties: {},
            'extends': [],
            'implements': []
          }, options),
          ifaces = preinit['implements'],
          supers = preinit['extends'],
          clonedProps = preinit.clonedProperties;
          
      if (interfaceProps) {
        for (var iface in interfaceProps) {
          if (U.isA(vocModel, iface)) {
            ifaces.push(iface);
            var props = interfaceProps[iface],
                cloned = clonedProps[iface] = {};
            
            if (props) {
              for (var i = 0, n = props.length; i < n; i++) {
                var prop = props[i];
                var cOf = U.getCloneOf(vocModel, iface + '.' + prop);
                var len = cOf.length;
                if (len)
                  cloned[prop] = len == 1 ? cOf[0] : cOf;
              }
            }
          }
        }
      }
      
      _.pushUniq(superclasses, vocModel.type);
      if (superclasses) {
        for (var i = 0, len = superclasses.length; i < len; i++) {
          var sCl = superclasses[i];
          if (U.isAssignableFrom(vocModel, sCl)) {
//            var sIdx = sCl.indexOf('/');
//            if (~sIdx)
//              sCl = sCl.slice(sIdx + 1);
          
            supers.push(sCl);
          }
        }
      }
      
      return this.extend(preinit);
    },
    
    clickDataHref: function(e) {
      Events.trigger('navigate', e.currentTarget.dataset.href);
    }    
  });

  return BasicView; 
});