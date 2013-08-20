//'use strict';
define('views/BasicPageView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMobile'
], function(G, U, Events, BasicView, $m) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip'],
      pageEvents = ['pageshow', 'pagehide', 'pagebeforeshow'],
      $wnd = $(window);

  function removeTooltip($el) {
//    if (elm[0].tagName == 'DIV')
//      elm.removeClass('hint--always hint--left hint--right ').removeAttr('data-hint');
//    else
//      elm.unwrap();
    
    var nonHintClasses = _.filter($el.attr("class").split(" "), function(item) {
      return !item.startsWith("hint--");
    });
    
    $el.attr("class", nonHintClasses.join(" "));
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
  
  var PageView = BasicView.extend({
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
      _.bindAll(this, 'pageevent', 'swiperight', 'swipeleft', 'scroll', 'onpageshow', 'onpagehide');            
      $wnd.on('scroll', this.onScroll.bind(this));
      
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
        self.createMessageBar(type, data);
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
      
      this.onload(this._checkMessageBar.bind(this));
      this.onload(this._checkAutoClose.bind(this));
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
          if (self.rendered) {
            self._checkMessageBar();
            self._checkAutoClose();
          }
          
          var title = self.getPageTitle();
          if (title)
            document.title = title;
        }
        else
          self._clearMessageBar();        
      });
    },
    
    events: {
      'scrollstart': 'reverseBubbleEvent',
      'scrollstop': 'reverseBubbleEvent',      
      'scroll': 'scroll',
      'pagehide': 'pageevent',
      'pageshow': 'pageevent',
      'pagebeforeshow': 'pageevent',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft',
      'touchstart': 'highlightOnTouchStart',
      'touchmove': 'unhighlightOnTouchMove',
      'touchend': 'unhighlightOnTouchEnd'
    },

    destroy: function() {
      $wnd.off('scroll', this.onScroll);
      BasicView.prototype.destroy.call(this);
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
    
    _restoreScroll: function() {
      this.scrollTo(this._scrollPosition);
    },
    
    pageevent: function(e) {
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
    
    addTooltip: function(el, tooltip, direction, type, style) {
      el = el instanceof $ ? el : $(el);
      var classes = ['always', 
                     direction || 'left', 
                     type      || 'info', 
                     style     || 'rounded'];
     
      classes = _.map(classes, function(cl) {
        return 'hint--' + cl;
      });
     
      el.addClass(classes.join(' '), {duration: 1000});
      el.attr('data-hint', tooltip);
      this.once('active', function(active) {
        if (!active)
          removeTooltip(el);
      });
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

      if (data.resource && data.resource !== this.resource)
        return;
      
      var self = this,
          name = 'messageBar' + type.capitalizeFirst();
//          ,
//          cached = this.getChildView(name);
      
//      cached && cached.destroy();
      U.require('views/MessageBar').done(function(MessageBar) {
        var bar = self.addChild(name, new MessageBar({
          model: self.model,
          type: type
        }));
        
        bar.render(data);
        bar.$el.css({opacity: 0});
        self.$el.prepend(bar.$el);
        bar.$el.animate({opacity: 1}, 500);
        Events.on('messageBar.' + type + '.clear', function(id) {
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

    _checkAutoClose: function() {
      var autoClose = this.hashParams['-autoClose'],
          autoCloseOption = this.hashParams['-autoCloseOption'] == 'y',
          hash = this.hash;
      
      if (autoClose) {
        try {
          var millis = parseInt(autoClose);
        } catch (err) {
        }

        var seconds = millis / 1000;
        Events.trigger('messageBar', 'info', {
          message: {
            message: 'This page will self-destruct in: <span class="countdown">{0} seconds.</span>'.format(seconds), // Close this message to stop the destruction.'.format(seconds),
            onclose: function() {
              // TODO: allow an onclose handler to be attached
            }
          },
          persist: true
        });
        
        U.countdown(this.$('.countdown')[0], seconds).done(window.close.bind(window));
        
        millis = millis || 5000;
        var closeTimeout = setTimeout(function() {
          window.close();
        }, millis);
        
        Events.once('pageChange', function() {
          clearTimeout(closeTimeout);
        });
        
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