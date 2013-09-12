//'use strict';
define('views/BasicPageView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMobile',
  'jqueryImagesLoaded'
], function(G, U, Events, BasicView, $m) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip', 'countdown'],
      pageEvents = ['pageshow', 'pagehide', 'pagebeforeshow'],
      $wnd = $(window);
  
  function isInsideDraggableElement(element) {
    return !!$(element).parents('[draggable=true]').length;
  };
  
//  function isTouchWithinBounds(touch1, touch2, bound) {
//    if (!touch1 || !touch2)
//      return false;
//    
//    bound = bound || 10;
//    return _.all(['pageX', 'pageY'], function(p) {        
//      return Math.abs(touch1[p] - touch2[p]) < bound;
//    });
//  };
//  
//  function cloneTouch(touch) {
//    return {
//      pageX: touch.pageX,
//      pageY: touch.pageY
//    }
//  };
  
  var PageView = BasicView.extend({
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
      _.bindAll(this, 'onpageevent', 'swiperight', 'swipeleft', 'scroll'); //, 'onpageshow', 'onpagehide');            
      $wnd.on('scroll', this.onScroll.bind(this));
      
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
    
      Events.on('tourStep', function(step) {
        if (self.isActive()) {
          self.onpageshow(function() {
            self.runTourStep(step);
          });
        }
      });
      
      Events.on('messageBar', function(type, data) {
        self.createMessageBar.apply(self, arguments);
      });
      
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
      
      Events.on('newRTCCall', function(call) {
        self.createCallInProgressHeader(call);
      });

      Events.on('activeView', function(view) {
        if (view !== self)
          self.trigger('inactive');
        else
          self.trigger('active');
      });
      
      this.on('titleChanged', function(title) {
        self._updateTitle(title);
      });
      
      this.on('inactive', function() {        
        self._clearMessageBar();        
      });
      
      function onload() {
        self._checkMessageBar();
        self._checkAutoClose();
      }
      
      this.on('active', function() {
        if (self.rendered)
          onload();
        else
          self.onload(onload);
        
        if (!self._title)
          self._updateTitle();        
      });
    },
    
    events: {
      'scrollstart': 'reverseBubbleEvent',
      'scrollstop': 'reverseBubbleEvent',      
      'scroll': 'scroll',
      'pagehide': 'onpageevent',
      'pageshow': 'onpageevent',
      'pagebeforeshow': 'onpageevent',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
//        ,
//      'touchstart': 'highlightOnTouchStart',
//      'touchmove': 'unhighlightOnTouchMove',
//      'touchend': 'unhighlightOnTouchEnd'
    },

    destroy: function() {
      $wnd.off('scroll', this.onScroll);
      BasicView.prototype.destroy.call(this);
    },
    
//    highlightOnTouchStart: function(e) {
//      var self = this,
//          touches = e.touches;
//      
//      if (_.isUndefined(touches))
//        return;
//      
//      // Mobile safari doesn't let you copy touch objects, so copy it manually
//      this._firstTouch = cloneTouch(touches[0]);
//      this.touchStartTimer = setTimeout(function() {
//        self.highlight(e.target, e);
//      }, 100);
//    },
//
//    unhighlightOnTouchMove: function(e) {
//      if (_.isUndefined(this._firstTouch))
//        return;
//      
//      var touches = e.touches;
//      if (_.isUndefined(touches))
//        return;
//      
//      // Mobile safari doesn't let you copy touch objects, so copy it manually
//      var tMove = cloneTouch(touches[0]);
//      
//      // remove this class only if you're a certain distance away from the initial touch
//      if (!isTouchWithinBounds(this._firstTouch, tMove)) {
//        this.clearTouchStartTimer();
//        this.unhighlight(e.target, e); // in case the first timer ran out and it got highlighted already?
//      }
//    },
//
//    unhighlightOnTouchEnd: function(e) {
//      // removing active class needs to be on timer because adding is also on a timer
//      // if this is not done, sometimes the active class removal is called before...
//      var self = this;
//      setTimeout(function() {
//        self.unhighlight(e.target, e);
//      }, 100);
//    },
//    
//    /**
//     * Stub. Override this
//     */
//    highlight: function(target, e) {
////      throw "highlight needs to be implemented by all subclasses";
//    },
//
//    /**
//     * Stub. Override this
//     */
//    unhighlight: function(target, e) {
////      throw "unhighlight needs to be implemented by all subclasses";
//    },
//
//    clearTouchStartTimer: function() {
//      clearTimeout(this.touchStartTimer);
//      this.touchStartTimer = null;
//    },
    
    _restoreScroll: function() {
      this.scrollTo(this._scrollPosition);
    },
    
    onpageevent: function(e) {
      this._lastPageEvent = e.type;
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
      if (this.$el) {
        this.$el.triggerHandler('scroll');
        this.log('visibility', 'START visibility report for ' + this.TAG);
        this.logVisibility();
        this.log('visibility', 'END visibility report for ' + this.TAG);
      }
    },
    
//    addTooltip: function(data) {
////      if (!this._tooltipTemplate)
////        this.makeTemplate('tooltipTemplate', '_tooltipTemplate', this.modelType);
////      
////      var html = this._tooltipTemplate(data),
//      var element = data.element; //.parent('div');
////      element.addClass('hint--always hint--{0}'.format(data.direction));
////      element.attr('data-hint', data.tooltip);
//      var position = element.offset();
//      var t = position.top + element.outerHeight()/2 - 23;
//      var l = position.left + element.outerWidth()/2 - 23;
//      if (data.tooltip)
//        $('#page').prepend('<div class="play hint--always hint--' + data.direction + '" style="top:' + t + 'px; left:' + l + 'px" data-hint="' + data.tooltip + '"><div class="glow"></div><div class="shape"></div></div>');
//      else
//        $('#page').prepend('<div class="play" style="top:' + t + 'px; left:' + l + 'px;"><div class="glow"></div><div class="shape"></div></div>');
//      this.once('active', function(active) {
//        if (!active) {
//          removeTooltip(element);
//          $('.play').remove();
//        }
//      });
//    },
    
    runTourStep: function(step) {      
      var element,
          info = step.get('infoMessage');
      
      try {
        element = this.$(step.get('selector'));
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

      if (element.length) {
        this.addTooltip(element, 
                        step.get('tooltip'), 
                        step.get('direction'),
                        step.get('tooltipType') || 'info',
                        step.get('tooltipStyle') == 'squareCorners' ? 'square' : 'rounded');
      }
    },
    
    removeTooltip: function($el) {
  //    if (elm[0].tagName == 'DIV')
  //      elm.removeClass('hint--always hint--left hint--right ').removeAttr('data-hint');
  //    else
  //      elm.unwrap();
      
      var nonHintClasses = _.filter(($el.attr("class") || '').split(" "), function(item) {
        return !item.startsWith("hint--");
      });
      this.$el.off('resize', function() {
        
      });
      $el.attr("class", nonHintClasses.join(" "));
    },
    
    addTooltip: function(el, tooltip, direction, type, style) {
      el = el instanceof $ ? el : $(el);
      var classes = ['always', 
                     direction || 'left', 
                     type      || 'info', 
                     style     || 'rounded'];
     
      classes = _.map(classes, function(cl) {
        return 'hint--' + cl;
      });
     
      var self = this;
      var position = el.offset();
      var t = position.top + el.outerHeight()/2 - 20;
      var l = position.left + el.outerWidth()/2 - 20;
      if (l + 40 > $(window).width()) 
        l = $(window).width() - 40;
      if (tooltip)
        $('#page').prepend('<div class="play ' + classes.join(' ') + '" style="top:' + t + 'px; left:' + l + 'px" data-hint="' + tooltip + '"><div class="glow"></div><div class="shape"></div></div>');
      else
        $('#page').prepend('<div class="play" style="top:' + t + 'px; left:' + l + 'px;"><div class="glow"></div><div class="shape"></div></div>');
//      el.addClass(classes.join(' '), {duration: 1000});
//      el.attr('data-hint', tooltip);      
      this.once('inactive', function() {
        self.removeTooltip(el);
        $('.play').remove();
      });
      
      this.$el.on('resize', function() {
        var position = el.offset();
        var t = position.top + el.outerHeight()/2 - 20;
        var l = position.left + el.outerWidth()/2 - 20;
        if (l + 40 > $(window).width()) 
          l = $(window).width() - 40;
        $('.play').css('top', t + 'px');
        $('.play').css('left', l + 'px');
      });
    },

    _updateTitle: function(title) {
      this._title = document.title = title || this.getPageTitle();
    },
    
    getPageTitle: function() {
      var title = this.$('#pageTitle');
      return title.length ? title.text() : this.hashParams.$title || G.currentApp.title;
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
//        Events.on('header.' + type, U.partialWith(self.createMessageBar, self, type));
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
        
        bar.on('messageBarRemoved', function(e) {
          self.trigger.apply(self, ['messageBarRemoved'].concat(U.concat.call(arguments)));
        });
        
        bar.render(data);
        G.q(function() {          
          bar.$el.css({opacity: 0});
          self.$el.prepend(bar.$el);
          self.trigger('messageBarsAdded', bar);
          bar.$el.animate({opacity: 1}, 500);
        });
        
        Events.once('messageBar.{0}.clear.{1}'.format(type, data.id), function() {
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
        var header = self.addChild(new CIPHeader({
          model: self.model,
          call: call
        }));
        
        header.render();
        G.animationQueue.queueTask(function() {          
          self.$el.prepend(header.$el);
        });
        
        Events.once('endRTCCall', header.destroy.bind(header));
      });      
    },

    _clearMessageBar: function() {
      for (var name in this.children) {
        if (/^messageBar/.test(name))
          this.children[name].destroy();
      }
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
        this.$el.one('pagehide', countdownPromise.cancel);
        
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
            regularParam = '-' + type;
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
    }
  }, {
    displayName: 'BasicPageView'
  });
  
  _.each(['pageshow', 'pagehide'], function(e) {
    PageView.prototype['on' + e] = function(fn) {
      if (this._lastPageEvent == e)
        fn();
      else
        this.$el.one(e, fn);
    };
  });
  
  return PageView;
});