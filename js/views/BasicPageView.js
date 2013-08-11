//'use strict';
define('views/BasicPageView', [
  'globals',
  'utils',
  'events',
  'views/BasicView'
], function(G, U, Events, BasicView) {
  function removeTooltip(elm) {
    elm.removeClass('hint--always hint--left hint--right')
       .removeAttr('data-hint');
  };
  
  function addTooltip(elm, tooltip, direction) {
    elm.addClass('hint--always hint--{0}'.format(direction))
       .attr('data-hint', tooltip);
  };
  
  var PageView = BasicView.extend({
    initialize: function(options) {
      var self = this;
      BasicView.prototype.initialize.apply(this, arguments);
//      _.extend(this.events, this.prototype.events);
      _.bindAll(this, 'pageshow', 'swiperight', 'swipeleft');      
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
        self.checkError();
        if (G.callInProgress)
          self.createCallInProgressHeader(G.callInProgress);        
      };
      
      var render = this.render;
      this.render = function() {
        render.apply(self, arguments);
        self.checkError();
        if (G.callInProgress)
          self.createCallInProgressHeader(G.callInProgress);        
      };
      
      this.onload(this.checkError.bind(this));
      
      Events.on('newRTCCall', function(call) {
        self.createCallInProgressHeader(call);
      });      
    },
    
    events: {
      'scrollstart': 'reverseBubbleEvent',
      'scrollstop': 'reverseBubbleEvent',      
      'scroll': 'reverseBubbleEvent',
      'pageshow': 'pageshow',
      'pagebeforeshow': 'reverseBubbleEvent',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },

    pageshow: function() {
      if (!this._scrolledToTopOnLoad) {
        this.scrollToTop();
        this._scrolledToTopOnLoad = true;
      }
      
      this.reverseBubbleEvent.apply(this, arguments);
    },
    
    swipeleft: function(e) {
      this.log('events', 'swipeleft');
      Events.trigger('forward');
      return false;
    },
    
    swiperight: function(e) {
      this.log('events', 'swiperight');
      Events.trigger('back');
      return false;
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
      var selector = step.get('selector'),
          tooltip = step.get('tooltip'),
          direction = (step.get('direction') || 'left');
       
      if (!selector || !tooltip)
        return;
      
      try {
        var elm = this.$(selector);
        addTooltip(elm, tooltip, direction);
        this.once('active', function(active) {
          if (!active)
            removeTooltip(elm);
        });
        
      } catch (err) {
        this.log('error', 'bad selector for tour step: {0}, err: '.format(selector), err);
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

    checkError: function() {
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
    }
  }, {
    displayName: 'BasicPageView'
  });
  
  return PageView;
});