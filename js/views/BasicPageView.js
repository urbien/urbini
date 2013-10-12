//'use strict';
define('views/BasicPageView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'views/mixins/Scrollable',
  'views/mixins/LazyImageLoader',
  'jqueryMobile',
  'jqueryImagesLoaded'
], function(G, _, U, Events, BasicView, Scrollable, LazyImageLoader, $m) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip', 'countdown'],
      pageEvents = ['pageshow', 'pagehide', 'pagebeforeshow'],
      doc = document,
      $wnd = $(window);

  
  function isInsideDraggableElement(element) {
    return !!$(element).parents('[draggable=true]').length;
  };
  
  var PageView = BasicView.extend({
    mixins: [Scrollable, LazyImageLoader],
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
      _.bindAll(this, 'onpageevent', 'swiperight', 'swipeleft', 'scroll', '_onScroll'); //, 'onpageshow', 'onpagehide');            
      
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
    },
    
    events: {
      'scrollstart.page': 'reverseBubbleEvent',
      'scrollstop.page': 'reverseBubbleEvent',      
      'scroll.page': 'scroll',
      'pagehide.page': 'onpageevent',
      'pageshow.page': 'onpageevent',
      'pagebeforeshow.page': 'onpageevent',
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
      '.page active': '_onActive',
      '.page inactive': '_onInactive',
      '.page titleChanged': '_updateTitle'
    },
    
    windowEvents: {
      'scroll': '_onScroll'
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
      BasicView.prototype._onActive.apply(this, arguments);
      var onload = function() {
        this._checkMessageBar();
        this._checkAutoClose();
      }.bind(this);

      if (this.rendered)
        onload();
      else
        this.onload(onload);
      
      if (!this._title)
        this._updateTitle();
    },
    
    _onInactive: function() {
//      this.trigger('inactive');
      BasicView.prototype._onInactive.apply(this, arguments);
      this._clearMessageBar();        
    },
    
    _restoreScroll: function() {
      this.scrollTo(this._scrollPosition);
    },
    
    onpageevent: function(e) {
      this._lastPageEvent = e.type;
//      if (e.type == 'pageshow')
//        this.trigger('active');
//      else if (e.type == 'pagehide')
//        this.trigger('inactive');
      
      this.reverseBubbleEvent.apply(this, arguments);      
    },

    scroll: function() {
//      if (this._scrollPosition && $wnd.scrollTop() == 0)
//        debugger;
      
      var newTop = $wnd.scrollTop(),
          oldTop = this._scrollPosition || 0,
          scrollCheckpoint = this._scrollCheckpoint || 0;
      
      this._scrollPosition = newTop;
      if (Math.abs(newTop - scrollCheckpoint) > 100) {
        this._scrollCheckpoint = newTop;
        this._hideOffscreenImages();
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
    
    _onScroll: _.throttle(function() {
      if (!this.isActive())
        return;
      
      if (typeof this._scrollPosition == 'undefined' && !$wnd.scrollTop()) // weird fake scroll event after page load
        return;
      
      if (this.$el) {
        this.$el.triggerHandler('scroll');
        // <debug>
        this.log('visibility', 'START visibility report for ' + this.TAG);
        this.logVisibility();
        this.log('visibility', 'END visibility report for ' + this.TAG);
        // </debug>
      }
    }, 100),
    
    onTourStep: function(step) {
      if (this.isActive())
        this.onpageshow(this.runTourStep.bind(this, step));
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
      this._title = doc.title = title || this.getPageTitle();
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