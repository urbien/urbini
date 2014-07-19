//'use strict';
define('views/BasicPageView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'error',
  'views/BasicView',
//  'views/mixins/LazyImageLoader',
//  'views/mixins/Scrollable',
  'lib/fastdom',
  '@widgets',
  'domUtils'
//  ,
//  'jqueryImagesLoaded'
], function(G, _, U, Events, Errors, BasicView, /*LazyImageLoader,*/ Q, $m, DOM) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip', 'countdown'],
      pageEvents = ['page_show', 'page_hide', 'page_beforeshow'],
      doc = document,
      viewport = G.viewport;
//  ,
//      mixins = [];
//      mixins = [Scrollable];

//  if (G.lazifyImages)
//    mixins.unshift(LazyImageLoader);
  
  function isInsideDraggableElement(element) {
    return !!$(element).parents('[draggable=true]').length;
  };
  
  var PageView = BasicView.extend({
//    mixins: [Scrollable],
    _autoFetch: true,
    _fetchPromise: null,
    _draggable: true,
    _dragAxis: 'y',
    _scrollbar: true,
    _flexigroup: false,
    viaHammer: true,
    attributes: {
      'data-role': 'page'
    },
    style: {
      opacity: 0,
      'min-height': '100%',
      'transform-origin': '50% 50%',
      perspective: '1000px'
    },
//    mixins: mixins,
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
      if (!options.mock)
        this.addContainerBodyToWorld();
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
        if (!this.el.parentNode)
          document.body.appendChild(this.el);
        
        render.apply(self, arguments);
//        self.checkError();
        if (G.callInProgress)
          self.createCallInProgressHeader(G.callInProgress);        
      };
      
      if (this.model) {
        if (this.resource) {
          if (this.resource.isLoaded() || /*this.resource.isNew() ||*/ !this.resource.getUri()) {
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
        
        this._fetchDfd = $.Deferred();
        this._fetchPromise = this._fetchDfd.promise();
        this._fetchPromise.fail(Errors.getBackboneErrorHandler());
        if (this._autoFetch) {
          this.model.fetch(_.extend({
            sync: true,
            success: self._fetchDfd.resolve,
            error: self._fetchDfd.reject
          }, options.fetchOptions));
        }
      }
      
      this.listenTo(Events, 'getCachedView:' + U.simplifyUrl(window.location.href), function(cb) {
        cb(self);
      });
    },
    
    events: {
//      'scrollstart.page': 'reverseBubbleEvent',
//      'scrollstop.page': 'reverseBubbleEvent',      
//      'scroll.page': 'scroll',
      'page_hide.page': 'onpageevent',
      'page_show.page': 'onpageevent',
      'page_beforeshow.page': 'onpageevent',
      'swiperight.page': 'swiperight',
      'swipeleft.page': 'swipeleft',
      'click.page .videoLauncher': U.launchVideo,
      'click.page .reqLogin': function(e) { Events.stopEvent(e); Events.trigger('req-login', {dismissible: true}) },
      'click.page .pgDown': 'pageDown',
      'click.page .pgUp': 'pageUp',
      'click.page [data-selector]': 'scrollToTarget',
      'click.page .closeBtn': 'closeDialog'
    },
    
    closeDialog: function(e) {
      var tooltip = e.target.$closest('.play');
      if (tooltip)
        tooltip.$remove();
    },
    
    scrollToTarget: function(e) {
      var link = e.selectorTarget,
          selector = link.$data('selector'),
          target = this.$(selector)[0],
          offset,
          tooltip,
          direction;
      
      if (!target)
        return;
      
      Events.stopEvent(e);
      offset = target.$offset();
      tooltip = link.$data('tooltip');
      direction = link.$data('direction');
      
      if (this.mason)
        this.mason.snapBy(0, -offset.top);
      
      if (tooltip) {
        this.addTooltip({
          el: target, 
          tooltip: tooltip, 
          direction: direction, 
          type: 'info', 
          style: 'square'
        });
      }
    },
    
    pageUp: function(e) {
      var pages = parseInt(e.selectorTarget.$data('pages') || "1");
      Events.stopEvent(e);
      Events.trigger('pageUp', pages);
    },
    
    pageDown: function(e) {
      var pages = parseInt(e.selectorTarget.$data('pages') || "1");
      Events.stopEvent(e);
      Events.trigger('pageDown', pages);
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
      
      this._updateTitle();
    },
    
    _onInactive: function() {
//      this.trigger('inactive');
//      this.disconnectFromWorld();
      BasicView.prototype._onInactive.apply(this, arguments);
      this._clearMessageBar();   
      this.removeTooltips();
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
      BasicView.prototype._onViewportDimensionsChanged.apply(this, arguments);
      this._fixTooltips();
    },

    onTourStep: function(step) {
      if (this.isActive())
        this.onpage_show(this.runTourStep.bind(this, step));
    },
    
    runTourStep: function(step) {
      if (!this.rendered) {
        this.onload(function() {
          if (this.isActive())
            this.runTourStep(step);
        }, this);
        return;
      }
      
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
        this.addTooltip({
          el: element, 
          tooltip: step.get('tooltip'), 
          direction: step.get('direction'),
          type: step.get('tooltipType') || 'info',
          style: step.get('tooltipStyle') == 'squareCorners' ? 'square' : 'rounded'
        });
      }
    },
    
    _fixTooltips: function() {
      var self = this,
          remove = [];
      
      this.getTooltips().$forEach(function(tooltip) {
        var el = self._getTooltipBaseElement(tooltip);
        if (!el) {
          remove.push(tooltip);
          return;
        }
        
        tooltip.$css(self.getTooltipPos(el));
      });
      
      if (remove.length)
        remove.forEach(function(tooltip) { tooltip.$remove() });
    },
    
    getTooltipPos: function(el) {
      var cPos = this.el.$offset(),
          pos = el.$offset(),
          info = {
            top: -cPos.top + pos.top + el.offsetHeight / 2 - 20,
            left: -cPos.left + pos.left + el.offsetWidth / 2 - 20
          };
      
      info.maxWidth = (viewport.width - info.left) * 2;
      for (var p in info) {
        info[p] = info[p] + 'px';
      }
      
      return info;
    },
    
    getTooltips: function() {
      return this.el.$('.play');
    },
    
    removeTooltips: function() {
      this.getTooltips().$remove();
      delete this._tooltipMap;
    },
    
//    el, tooltip, direction, type, style
    addTooltip: function(options) {
      this.removeTooltips();
      var self = this,
          el = options.el,
          tooltip = options.tooltip,
          direction = options.direction || 'left',
          type = options.type || 'info',
          style = options.style || 'square',
          pos = this.getTooltipPos(el),
          posStyle = 'top:' + pos.top + ';left:' + pos.left + ';',
          page = this.el,
          tooltipEl,
          classes = ['always', direction, type, style].map(function(cl) {
            return 'hint--' + cl;
          });
      
      if (pos.maxWidth)
        posStyle += 'max-width:' + pos.maxWidth + ';';
      
//      var closeBtn = '<div style="display:inline; width: auto; text-align: center; "><div class="closeparent" style="background:#fff;color:#555; margin: 7px 0 0 0; display: inline-block;padding: 0 5px; border-radius: 4px;">OK</div></div>';
//      var closeBtn = '<i class="closeBtn ' + direction.replace('-', ' ') + '"></i>';
      var closeBtn = '';
      if (tooltip)
        tooltipEl = DOM.parseHTML('<div class="play ' + classes.join(' ') + '" style="' + posStyle + '"><div class="content">' + tooltip + closeBtn + '</div></div>');
      else {
        debugger;
        tooltipEl = DOM.parseHTML('<div class="play" style="' + posStyle + '"></div>');
      }
      
      tooltipEl = tooltipEl[0];
      this._tooltipMap = this._tooltipMap || {};
      this._tooltipMap[tooltipEl.$getUniqueId()] = el;
      page.$prepend(tooltipEl);
      
      var events = ['tap', 'drag'];
      events.map(function(event) {
        document.addEventListener(event, function removeTooltips() {
          events.map(function(event) {
            document.removeEventListener(event, removeTooltips, true);
          });
          
          self.removeTooltips();
        }, true);
      });
    },
    
    _getTooltipBaseElement: function(tooltipEl) {
      return this._tooltipMap && this._tooltipMap[tooltipEl.$getUniqueId()];
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
        bar.el.style.opacity = 0;
        self.el.$prepend(bar.el);
        bar.el.$fadeTo(1, 500);
        self.trigger('messageBarsAdded', bar);
//        bar.$el.animate({opacity: 1}, 500);
        
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
        self.el.$prepend(header.el);        
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
        this.el.$once('page_hide', countdownPromise.cancel);
        
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
      this.$('.messageList').$remove();
      
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

      for (var event in events) {
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
    },
    
    isListPage: function() {
      return this.model == this.collection;
    }
  }, {
    displayName: 'BasicPageView'
  });
  
  _.each(['page_show', 'page_hide'], function(e) {
    PageView.prototype['on' + e] = function(fn) {
      if (this._lastPageEvent == e)
        fn();
      else
        this.el.$once(e, fn);
    };
  });
  
  return PageView;
});