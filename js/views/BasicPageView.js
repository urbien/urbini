//'use strict';
define('views/BasicPageView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMobile'
], function(G, U, Events, BasicView, $m) {
  function removeTooltip(elm) {
    elm.removeClass('hint--always hint--left hint--right')
       .removeAttr('data-hint');
  };

  function isInsideDraggableElement(element) {
    return !!$(element).parents('[draggable=true]').length;
  };
  
  function isTouchWithinBounds(touch1, touch2, bound) {
    if (!touch1 || !touch2)
      return false;
    
    bound = bound || 10;
    return _.all(['pageX', 'pageY'], function(p) {        
      return Math.abs(touch1[p] - touch2[p]) < bound;
    });
  };
  

  function cloneTouch(touch) {
    return {
      pageX: touch.pageX,
      pageY: touch.pageY
    }
  };
  
//  function addTooltip(elm, tooltip, direction) {
//    elm.addClass('hint--always hint--{0}'.format(direction))
//       .attr('data-hint', tooltip);
//  };
  
  var $wnd = $(window);
  var PageView = BasicView.extend({
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
//      _.extend(this.events, this.prototype.events);
      _.bindAll(this, 'pageshow', 'pagebeforeshow', 'swiperight', 'swipeleft', 'scroll');      
      this.setupErrorHandling();
//      this._loadingDfd.promise().done(function() {
//        self.$el.one('pageshow', self.scrollToTop);
//      });
      
      $(window).on('scroll', this.onScroll.bind(this));
      
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
    
      Events.on('tourStep', function(step) {
        if (self.isActive())
          self.runTourStep(step);
      });
      
//      Events.on('headerMessage', function(data) {
//        var error = data.error,
//            errMsg = error ? error.msg || error : null,
//            info = data.info,
//            infoMsg = info ? info.msg || info : null,
//            errorBar = self.$('div#headerMessageBar');
//        
//        if (!errorBar.length)
//          return;
//        
//        errorBar.html("");
//        errorBar.html(U.template('headerErrorBar')({error: errMsg, info: infoMsg, style: "background-color:#FFFC40;"}));
//  
//        var hash = U.getHash(), orgHash = hash;
//        if (error && !error.glued)
//          hash = U.replaceParam(hash, {'-error': null});
//        if (info && !info.glued)
//          hash = U.replaceParam(hash, {'-info': null});
//        
//        if (hash != orgHash)
//          Events.trigger('navigate', hash, {trigger: false, replace: true});
//      });
      
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
      
      this.onload(this._checkError.bind(this));
      Events.on('newRTCCall', function(call) {
        self.createCallInProgressHeader(call);
      });

      Events.on('activeView', function(view) {
        if (view !== self)
          self.trigger('active', false);
        else
          self.trigger('active', true);
      });
      
      this.on('active', function(active) {
        if (active) {
          self._checkError();
        }
        else {
          self._clearMessageBar();
          self._pageshowFired = false;
          self._pagebeforeshowFired = false;
        }
      });
    },
    
    events: {
      'scrollstart': 'reverseBubbleEvent',
      'scrollstop': 'reverseBubbleEvent',      
      'scroll': 'scroll',
      'pageshow': 'pageshow',
      'pagebeforeshow': 'pagebeforeshow',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft',
      'touchstart': 'highlightOnTouchStart',
      'touchmove': 'unhighlightOnTouchMove',
      'touchend': 'unhighlightOnTouchEnd'
    },

    highlightOnTouchStart: function(e) {
      var self = this,
          touches = e.touches;
      
      if (_.isUndefined(touches))
        return;
      
      // Mobile safari doesn't let you copy touch objects, so copy it manually
      this._firstTouch = cloneTouch(touches[0]);
      this.touchStartTimer = setTimeout(function() {
        self.highlight(e.target, e);
      }, 100);
    },

    unhighlightOnTouchMove: function(e) {
      if (_.isUndefined(this._firstTouch))
        return;
      
      var touches = e.touches;
      if (_.isUndefined(touches))
        return;
      
      // Mobile safari doesn't let you copy touch objects, so copy it manually
      var tMove = cloneTouch(touches[0]);
      
      // remove this class only if you're a certain distance away from the initial touch
      if (!isTouchWithinBounds(this._firstTouch, tMove)) {
        this.clearTouchStartTimer();
        this.unhighlight(e.target, e); // in case the first timer ran out and it got highlighted already?
      }
    },

    unhighlightOnTouchEnd: function(e) {
      // removing active class needs to be on timer because adding is also on a timer
      // if this is not done, sometimes the active class removal is called before...
      var self = this;
      setTimeout(function() {
        self.unhighlight(e.target, e);
      }, 100);
    },
    
    /**
     * Stub. Override this
     */
    highlight: function(target, e) {
//      throw "highlight needs to be implemented by all subclasses";
    },

    /**
     * Stub. Override this
     */
    unhighlight: function(target, e) {
//      throw "unhighlight needs to be implemented by all subclasses";
    },

    clearTouchStartTimer: function() {
      clearTimeout(this.touchStartTimer);
      this.touchStartTimer = null;
    },
    
    pagebeforeshow: function() {
      this._pagebeforeshowFired = true;
      this.reverseBubbleEvent.apply(this, arguments);      
    },

    _restoreScroll: function() {
      this.scrollTo(this._scrollPosition);
    },
    
    pageshow: function() {
      this._pageshowFired = true;
      this._restoreScroll();
      this.reverseBubbleEvent.apply(this, arguments);
    },
    
    scroll: function() {
//      if (this._scrollPosition && $wnd.scrollTop() == 0)
//        debugger;
      
      if (this._pageshowFired && this.isActive()) {
        this._scrollPosition = $wnd.scrollTop();
//        this.log('scroll', this._scrollPosition);
      }
      
      this.reverseBubbleEvent.apply(this, arguments);
    },
    
    swipeleft: function(e) {
      if (isInsideDraggableElement(e.target))
        return;
      
      this.log('events', 'swipeleft');
      Events.trigger('forward');
      return false;
    },
    
    swiperight: function(e) {
      if (isInsideDraggableElement(e.target))
        return;
      
      this.log('events', 'swiperight');
      Events.trigger('back');
      return false;
    },

    scrollTo: function(position) {
      $m.silentScroll(position || 0);
    },

    scrollToBottom: function() {
      $('html, body').animate({
        scrollTop: this.pageView.$el.height()
      }, 200);
    },

    getPageView: function() {
      return this;
    },
    
    isPageView: function() {
      return true;
    },
    
    onScroll: function() {
      this.$el.triggerHandler('scroll');
      this.log('visibility', 'START visibility report for ' + this.TAG);
      this.logVisibility();
      this.log('visibility', 'END visibility report for ' + this.TAG);
    },
    
    addTooltip: function(data) {
//      if (!this._tooltipTemplate)
//        this.makeTemplate('tooltipTemplate', '_tooltipTemplate', this.modelType);
//      
//      var html = this._tooltipTemplate(data),
      var element = data.element; //.parent('div');
      element.addClass('hint--always hint--{0}'.format(data.direction));
      element.attr('data-hint', data.tooltip);
      
      this.once('active', function(active) {
        if (!active)
          removeTooltip(element);
      });
    },
    
    runTourStep: function(step) {      
      var element;
      
      try {
        element = this.$(step.get('selector'));
      } catch (err) {
        this.log('error', 'bad selector for tour step: {0}, err: '.format(selector), err);
        return;
      }
      
      if (element.length) {
        this.addTooltip({
          element: element,
          direction: step.get('direction') || 'left',
          tooltip: step.get('tooltip')
        });
      }
    },

    getPageTitle: function() {
      var title = this.$('#pageTitle');
      return title.length ? title.text() : null;
    },
    
    isActive: function() {
      return this.active;
    },
    
    isChildOf: function(/* view */) {
      return false;
    },
    
    setupErrorHandling: function() {
      var self = this,
          vocModel = this.vocModel,
          type = this.modelType;
      
      _.each(['info', 'error'], function(type) {
        Events.on('header.' + type, U.partialWith(self.createMessageBar, self, type));
      });
    },
    
    getChildView: function(name) {
      return this.children && this.children[name];
    },
    
    createMessageBar: function(type, data) {
      if (!this.isActive())
        return;

      if (data.resource && data.resource !== this.resource)
        return;
      
      var self = this,
          name = 'messageBar' + type.capitalizeFirst(),
          cached = this.getChildView(name);
      
      cached && cached.destroy();
      U.require('views/MessageBar').done(function(MessageBar) {
        var bar = self.addChild(name, new MessageBar({
          model: self.model,
          type: type
        }));
        
        bar.render(data);
        self.$el.prepend(bar.$el);
        Events.on('header.' + type + '.clear', function(id) {
          if (id == data.id)
            bar.destroy();
        });
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
        var header = self.addChild(name, new CIPHeader({
          model: self.model,
          call: call
        })).render();
        
        header.render();
        self.$el.prepend(header.$el);

        Events.on('endRTCCall', function() {
          header.destroy();
        });
      });      
    },

    _clearMessageBar: function() {
      for (var name in this.children) {
        if (/^messageBar/.test(name))
          this.children[name].destroy();
      }
    },

    _checkError: function() {
      var gluedError = this.hashParams['-gluedError'],
          error = gluedError || this.hashParams['-error'],
          gluedInfo = this.hashParams['-gluedInfo'],
          info = gluedInfo || this.hashParams['-info'],
          hash = this.hash,
          events = {};
      
      if (info) {
        events['header.info'] = {
          message: info,
          persist: !!gluedInfo
        };
      }
      
      if (error) {
        events['header.error'] = {
          message: error,
          persist: !!gluedError
        }
      }
      else if (this.resource) {
        error = this.resource.get('_error');
        if (error) {
          events['header.error'] = {
            resource: this.resource,
            message: error.details,
            persist: true
          }
        }
      }

      for (event in events) {
        Events.trigger(event, events[event]);
      }
            
      if (error && !gluedError)
        hash = U.replaceParam(hash, {'-error': null});
      if (info && !gluedInfo)
        hash = U.replaceParam(hash, {'-info': null});
      
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
    }
  }, {
    displayName: 'BasicPageView'
  });
  
  return PageView;
});