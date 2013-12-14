//'use strict';
define('views/BasicPageView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'views/mixins/LazyImageLoader',
//  'views/mixins/Scrollable',
  'lib/fastdom',
  '@widgets',
  'domUtils'
//  ,
//  'jqueryImagesLoaded'
], function(G, _, U, Events, BasicView, LazyImageLoader, Q, $m, DOM) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip', 'countdown'],
      pageEvents = ['page_show', 'page_hide', 'page_beforeshow'],
      doc = document,
      viewport = G.viewport,
      mixins = [];
//      mixins = [Scrollable];

  if (G.lazifyImages)
    mixins.unshift(LazyImageLoader);
  
  function isInsideDraggableElement(element) {
    return !!$(element).parents('[draggable=true]').length;
  };

  function getTooltipPos(el) {
    var position = el.$offset();
    var t = position.top + el.offsetHeight / 2 - 20;
    var l = position.left + el.offsetWidth /2 - 20;
    if (l + 40 > viewport.width) 
      l = viewport.width - 40;
    
    return {
      top: t,
      left: l
    };
  }
  
  var PageView = BasicView.extend({
//    mixins: [Scrollable],
    _fetchPromise: null,
    _draggable: true,
    _flexigroup: false,
    viaHammer: true,
    style: {
      'min-height': '100%'
    },
    mixins: mixins,
//    constructor: function(options) {
//      options = options || {};
//      var atts = options.attributes = options.attributes || {};
//      atts.id = 'page' + G.nextId();
//      atts['data-role'] = 'page';
//      return BasicView.call(this, options);
//    },
    
    _configure: function(options) {
//      var atts = options.attributes = options.attributes || {};
      var atts = this.attributes = this.attributes || {};
      atts['id'] = options.el && options.el.id || 'page' + G.nextId();      
      atts['data-role'] = 'page';
      return BasicView.prototype._configure.apply(this, arguments);
    },

    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
      _.bindAll(this, 'onpageevent', 'swiperight', 'swipeleft'/*, 'scroll', '_onScroll'*/, '_onViewportDimensionsChanged'); //, 'onpage_show', 'onpage_hide');            
      
//      this._subscribeToImageEvents();
//      
//    if (navigator.mozApps) {
//      var getSelf = navigator.mozApps.getSelf();
//      getSelf.onsuccess = function(e) {
//        var isInstalled = getSelf.result != null;
//        if (!isInstalled) {
//          debugger;
//          var req = navigator.mozApps.install(G.firefoxManifestPath);
//          req.onsuccess = function(e) {
//            debugger;
//          };
//         
//          req.onerror = function(e) {
//            debugger;
//          };
//        }
//      };
//    }
    
      var refresh = this.refresh;
      this.refresh = function() {
        refresh.apply(self, arguments);
//        self.checkError();
        if (G.callInProgress)
          self.createCallInProgressHeader(G.callInProgress);        
      };
      
      var render = this.render;
      this.render = function() {
        render.apply(self, arguments);
//        self.checkError();
        if (G.callInProgress)
          self.createCallInProgressHeader(G.callInProgress);        
      };
      
      if (this.model) {
        if (this.resource) {
          if (this.resource.loaded || !this.resource.getUri()) {
            this._fetchPromise = G.getResolvedPromise();
            return;
          }
        }
        else if (this.collection) {
          if (this.collection._lastFetchedOn) {
            this._fetchPromise = G.getResolvedPromise();
            return;
          }
        }
        
        var fetchDfd = $.Deferred();
        this._fetchPromise = fetchDfd.promise();
        this.model.fetch(_.extend({
          success: fetchDfd.resolve,
          error: fetchDfd.reject
        }, options.fetchOptions));
      }
    },
    
    events: {
//      'scrollstart.page': 'reverseBubbleEvent',
//      'scrollstop.page': 'reverseBubbleEvent',      
//      'scroll.page': 'scroll',
      'page_hide.page': 'onpageevent',
      'page_show.page': 'onpageevent',
      'page_beforeshow.page': 'onpageevent',
      'swiperight.page': 'swiperight',
      'swipeleft.page': 'swipeleft'
    },

    globalEvents: {
      'newRTCCall': 'createCallInProgressHeader',
      'activeView': '_onActiveView',
      'tourStep': 'onTourStep',
      'messageBar': 'createMessageBar'
    },
    
    myEvents: {
      '.page titleChanged': '_updateTitle',
      '.default active': '_onActive',
      '.default inactive': '_onInactive',
      '.default destroyed': '_onDestroyed'
    },
    
    windowEvents: {
      'viewportdimensions': '_onViewportDimensionsChanged'
    },
    
    _onActiveView: function(view) {
      if (view !== this) {
        if (this.active)
          this.trigger('inactive');
      }
      else {
        if (!this.active)
          this.trigger('active');
      }
    },
    
    _onActive: function() {
//      this.trigger('active');
      var self = this;
      BasicView.prototype._onActive.apply(this, arguments);
      var onload = function() {
//        self.addToWorld(true);
        self._checkMessageBar();
        self._checkAutoClose();
      };

      if (this.rendered) {
        onload();
//        this.reconnectToWorld();
      }
      else
        this.onload(onload);
      
      if (!this._title)
        this._updateTitle();
    },
    
    _onInactive: function() {
//      this.trigger('inactive');
//      this.disconnectFromWorld();
      BasicView.prototype._onInactive.apply(this, arguments);
      this._clearMessageBar();        
    },
    
//    _restoreScroll: function() {
//      this.scrollTo(this._scrollPosition);
//    },
    
    onpageevent: function(e) {
      this._lastPageEvent = e.type;
//      if (e.type == 'page_show')
//        this.trigger('active');
//      else if (e.type == 'page_hide')
//        this.trigger('inactive');
      
//      this.reverseBubbleEvent.apply(this, arguments);      
    },

//    scroll: function() {
////      if (this._scrollPosition && $wnd.scrollTop() == 0)
////        debugger;
//      
//      var newTop = $wnd.scrollTop(),
//          oldTop = this._scrollPosition || 0,
//          scrollCheckpoint = this._scrollCheckpoint || 0;
//      
//      this._scrollPosition = newTop;
//      if (Math.abs(newTop - scrollCheckpoint) > 100) {
//        this._scrollCheckpoint = newTop;
//        this._hideOffscreenImages();
//      }
//      
//      this.reverseBubbleEvent.apply(this, arguments);
//    },
    
    swipeleft: function(e) {
//      if (isInsideDraggableElement(e.target))
//        return;
      
      this.log('events', 'swipeleft');
//      Events.trigger('forward');
//      return false;
    },
    
    swiperight: function(e) {
//      if (isInsideDraggableElement(e.target))
//        return;
      
      this.log('events', 'swiperight');
//      Events.trigger('back');
//      return false;
    },

    scrollTo: function(position) {
      $m.silentScroll(position || 0);
    },

    getPageView: function() {
      return this;
    },
    
    isPageView: function() {
      return true;
    },
    
//    _onScroll: _.throttle(function() {
//      if (!this.isActive())
//        return;
//      
//      if (typeof this._scrollPosition == 'undefined' && !$wnd.scrollTop()) // weird fake scroll event after page load
//        return;
//      
//      if (this.$el) {
//        this.$el.triggerHandler('scroll');
//        // <debug>
////        this.log('visibility', 'START visibility report for ' + this.TAG);
////        this.logVisibility();
////        this.log('visibility', 'END visibility report for ' + this.TAG);
//        // </debug>
//      }
//    }, 100),

    _onViewportDimensionsChanged: function(e) {
      this._fixTooltips();
    },

    onTourStep: function(step) {
      if (this.isActive())
        this.onpage_show(this.runTourStep.bind(this, step));
    },
    
    runTourStep: function(step) {      
      var element,
          info = step.get('infoMessage');
      
      try {
        element = this.$(step.get('selector'))[0];
      } catch (err) {
        this.log('error', 'bad selector for tour step: {0}, err: '.format(selector), err);
        return;
      }
      
      if (info) {
        Events.trigger('messageBar', 'tip', {
          message: info,
          persist: true
        });
      }

      if (element) {
        this.addTooltip(element, 
                        step.get('tooltip'), 
                        step.get('direction'),
                        step.get('tooltipType') || 'info',
                        step.get('tooltipStyle') == 'squareCorners' ? 'square' : 'rounded');
      }
    },
    
    _fixTooltips: function() {
      var tooltipOn = this._tooltipOn,
          tooltip,
          el,
          pos;
      
      if (!tooltipOn)
        return;
      
      tooltip = this._getTooltip();
      if (tooltip) {
        pos = getTooltipPos(tooltip);
        tooltip.$css({
          top: pos.top + 'px',
          left: pos.left + 'px'
        });
      }
    },
    
    removeTooltip: function(el) {
      var i = el.classList.length;
      while (i--) {
        var cl = el.classList[i];
        if (cl.startsWith('hint--'))
          el.classList.remove(cl);
      }
      
      if (this._tooltipOn == el)
        this._tooltipOn = null;
    },
    
    _getTooltip: function() {
      return doc.getElementsByClassName('play')[0];
    },
    
    addTooltip: function(el, tooltip, direction, type, style) {
//      el = el instanceof $ ? el : $(el);
      this._tooltipOn = el;
      var classes = ['always', 
                     direction || 'left', 
                     type      || 'info', 
                     style     || 'rounded'];
     
      classes = _.map(classes, function(cl) {
        return 'hint--' + cl;
      });
     
      var self = this;
      var pos = getTooltipPos(el);
      var page = doc.getElementById('page');
      if (tooltip)
        page.$prepend('<div class="play ' + classes.join(' ') + '" style="top:' + pos.top + 'px; left:' + pos.left + 'px" data-hint="' + tooltip + '"><div class="glow"></div><div class="shape"></div></div>');
      else
        page.$prepend('<div class="play" style="top:' + t + 'px; left:' + l + 'px;"><div class="glow"></div><div class="shape"></div></div>');

      this.once('inactive', function() {
        self.removeTooltip(el);
        self._getTooltips().remove();
      });
    },

    _updateTitle: function(title) {
      this._title = doc.title = title || this.getPageTitle();
    },
    
    getPageTitle: function() {
      var title = this.$('#pageTitle');
      return title.length ? title[0].innerText : this.hashParams.$title || G.currentApp.title;
    },
    
    isActive: function() {
      return this.active;
    },
    
    isChildOf: function(/* view */) {
      return false;
    },
    
//    setupErrorHandling: function() {
//      var self = this,
//          vocModel = this.vocModel,
//          type = this.modelType;
//      
//      _.each(MESSAGE_BAR_TYPES, function(type) {
//        Events.on('header.' + type, self.createMessageBar.bind(self, type));
//      });
//    },
    
    getChildView: function(name) {
      return this.children && this.children[name];
    },
    
    createMessageBar: function(type, data) {
      // TODO: allow an onclose handler to be attached
      if (!this.isActive())
        return;

      if (typeof data == 'string') {
        data = {
          message: data
        }
      }
      
      if (data.resource && data.resource !== this.resource)
        return;
      
      var self = this,
          name = 'messageBar' + type.capitalizeFirst();
//          ,
//          events = data.events = data.events || {},
//          onremove = events.remove;
//          ,
//          cached = this.getChildView(name);
      
//      cached && cached.destroy();
      
      U.require('views/MessageBar').done(function(MessageBar) {
        var bar = self.addChild(new MessageBar({
          model: self.model,
          type: type
        }));
        
        self.listenTo(bar, 'messageBarRemoved', function(e) {
          self.trigger.apply(self, ['messageBarRemoved'].concat(U.concat.call(arguments)));
        });
        
        bar.render(data);
        bar.$el.css({opacity: 0});
        self.$el.prepend(bar.$el);
        self.trigger('messageBarsAdded', bar);
        bar.$el.animate({opacity: 1}, 500);
        
        self.listenToOnce(Events, 'messageBar.{0}.clear.{1}'.format(type, data.id || G.nextId()), bar.destroy, bar);
      });
    },
    
    createCallInProgressHeader: function(call) {
      if (!this.isActive() || U.isChatPage(this.hash)) // maybe we want it on all pages immediately?
        return;
      
      var self = this,
          name = 'cipHeader';
          cached = this.getChildView(name);
      
      cached && cached.destroy();
     
      U.require('views/CallInProgressHeader').done(function(CIPHeader) {        
        var header = self.addChild(new CIPHeader({
          model: self.model,
          call: call
        }));
        
        header.render();
        self.$el.prepend(header.$el);        
        Events.once('endRTCCall', header.destroy.bind(header));
      });      
    },

    _clearMessageBar: function() {
      for (var name in this.children) {
        if (/^messageBar/.test(name))
          this.children[name].destroy();
      }
    },
    
    _onDestroyed: function() {
//      this.removeFromWorld();
      return BasicView.prototype._onDestroyed.apply(this, arguments);
    },

    _checkAutoClose: function() {
      var self = this,
          autoClose = this.hashParams['-autoClose'],
          autoCloseOption = this.hashParams['-autoCloseOption'] == 'y',
          hash = this.hash;
      
      if (autoClose) {
        if (autoClose === 'y') {
          window.close();
          return;
        }
        
        try {
          var millis = parseInt(autoClose);
        } catch (err) {
        }

        millis = millis || 5000;
        var seconds = millis / 1000;
        Events.trigger('messageBar', 'countdown', {
          message: {
            message: 'This page will self-destruct in: <div style="display:inline" class="countdown">{0}</div> seconds.'.format(seconds) // Close this message to stop the destruction.'.format(seconds),
//            events: {
//              remove: function() {
//                debugger;
//              }
//            }
          },
          persist: true
        });
        
        var countdownSpan = this.$('.countdown'),
            cleanup = function() {
              window.close();
              self._clearMessageBar(); // we can't always close the window
            };
            
        var countdownPromise = U.countdown(seconds).progress(countdownSpan.text.bind(countdownSpan)).done(cleanup);
        this.$el.one('page_hide', countdownPromise.cancel);
        
        hash = U.replaceParam(hash, '-autoClose', null);
      }
      else if (autoCloseOption) {
        Events.trigger('messageBar', 'info', {
          message: {
            link: 'javascript:self.close()',
            message: 'Click here to close this window'
          },
          persist: true
        });
        
        hash = U.replaceParam(hash, '-autoCloseOptions', null);
      }
      
      if (hash != this.hash)
        Events.trigger('navigate', hash, {trigger: false, replace: true});
    },

    _checkMessageBar: function() {
      var self = this,
          hash = this.hash,
          events = {};
      
      _.each(MESSAGE_BAR_TYPES, function(type) {
        var glued = self.hashParams['-glued' + type.capitalizeFirst()],
            regularParam = '-' + type,
            data = glued || self.hashParams[regularParam],
            isError = type !== 'error';
        
        if (isError && !data && this.resource) {
          data = this.resource.get('_error');
          if (data) {
            events[type] = {
              resource: this.resource,
              message: data.details,
              persist: true
            }
          }
          
          return;
        }
            
        if (!data)
          return;
        
        events[type] = {
          message: data,
          persist: !!glued
        };
        
        if (!glued)
          hash = U.replaceParam(hash, regularParam, null);
      });      

      for (event in events) {
        Events.trigger('messageBar', event, events[event]);
      }

      if (hash != this.hash)
        Events.trigger('navigate', hash, {trigger: false, replace: true});
    },
    
    isActivePage: function() {
      return this.pageView && $m.activePage === this.pageView.$el;
    },
    
    showLoadingIndicator: function(timeout) {
      $m.loading('show');
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
      
      $m.loading('hide');
    },
    
    getFetchPromise: function() {
      return this._fetchPromise;
    }
  }, {
    displayName: 'BasicPageView'
  });
  
  _.each(['page_show', 'page_hide'], function(e) {
    PageView.prototype['on' + e] = function(fn) {
      if (this._lastPageEvent == e)
        fn();
      else
        this.$el.one(e, fn);
    };
  });
  
  return PageView;
});