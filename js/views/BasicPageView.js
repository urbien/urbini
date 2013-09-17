//'use strict';
define('views/BasicPageView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'jqueryMobile',
  'jqueryImagesLoaded'
], function(G, _, U, Events, BasicView, $m) {
  var MESSAGE_BAR_TYPES = ['info', 'error', 'tip', 'countdown'],
      pageEvents = ['pageshow', 'pagehide', 'pagebeforeshow'],
      lazyAttr = G.lazyImgSrcAttr,
      WIN_HEIGHT,
      // Vertical offset in px. Used for preloading images while scrolling
      IMG_OFFSET = 200,
      doc = document,
      $wnd = $(window);

//  function isInBounds(position, from, to) {
//    return position.bottom >= from && position.top <= to;    
//  }
  
  function cleanImage(img, completely) {
    img.onload = null;
    img.removeAttribute('onload');
    // on IE < 8 we get an onerror event instead of an onload event
    img.onerror = null;
    img.removeAttribute('onerror');
    if (completely)
      img.removeAttribute(lazyAttr);
  };
  
  function viewport() {
    var documentEl = doc.documentElement;
    if (documentEl.clientHeight >= 0) {
      return documentEl.clientHeight;
    } else if (doc.body && doc.body.clientHeight >= 0) {
      return doc.body.clientHeight
    } else if (window.innerHeight >= 0) {
      return window.innerHeight;
    } else {
      return 0;
    }
  };

  function saveViewport() {
    WIN_HEIGHT = G.viewportHeight = viewport();
  };
  
  saveViewport();
  $wnd.on('resize', _.throttle(saveViewport, 20));
  
  function getDummyImages($el) {
    return $el.find('img[{0}]'.format(lazyAttr));
  }

  function getLoadedImages($el) {
    return $el.find('img:not([{0}])'.format(lazyAttr));
  }

  // Override image element .getAttribute globally so that we give the real src
  // does not works for ie < 8: http://perfectionkills.com/whats-wrong-with-extending-the-dom/
  // Internet Explorer 7 (and below) [...] does not expose global Node, Element, HTMLElement, HTMLParagraphElement
  window['HTMLImageElement'] && overrideGetattribute();
  function overrideGetattribute() {
    var original = HTMLImageElement.prototype.getAttribute;
    HTMLImageElement.prototype.getAttribute = function(name) {
      if(name === 'src') {
        var realSrc = original.call(this, lazyAttr);
        return realSrc || original.call(this, name);
      } else {
        // our own lazyloader will go through theses lines
        // because we use getAttribute(lazyAttr)
        return original.call(this, name);
      }
    }
  }
    
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
      _.bindAll(this, 'onpageevent', 'swiperight', 'swipeleft', 'scroll', '_onScroll', '_showImages', '_loadImage'); //, 'onpageshow', 'onpagehide');            
      
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
      
      function onActive() {
        $wnd.on('scroll', self._onScroll);
        if (self.rendered)
          onload();
        else
          self.onload(onload);
        
        if (!self._title)
          self._updateTitle();
        
        self._subscribeToImageEvents();        
      }
      
      function onInactive() {
        $wnd.off('scroll', self._onScroll);
//        $wnd.off('scroll', self._onScroll);
      }
      
      this.on('active', onActive);
      this.on('inactive', onInactive);
    },
    
    events: {
      'imageOnload': '_loadImage',
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
      this.trigger('inactive');
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
//        Events.on('header.' + type, _.partial(self.createMessageBar.bind(self), type));
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
        bar.$el.css({opacity: 0});
        self.$el.prepend(bar.$el);
        self.trigger('messageBarsAdded', bar);
        bar.$el.animate({opacity: 1}, 500);
        
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
        
        hash = _.replaceParam(hash, '-autoClose', null);
      }
      else if (autoCloseOption) {
        Events.trigger('messageBar', 'info', {
          message: {
            link: 'javascript:self.close()',
            message: 'Click here to close this window'
          },
          persist: true
        });
        
        hash = _.replaceParam(hash, '-autoCloseOptions', null);
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
          hash = _.replaceParam(hash, regularParam, null);
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
    

    
    _subscribeToImageEvents: function() {
      if (this._subscribedToImageEvents)
        return;
      
      var self = this;
      this.onload(function() {
//        if (!self.isChildless()) // let each view handle its own images
//          return;

        self.getPageView().$el.on('scroll', self._showImages);
      });
      
      this._subscribedToImageEvents = true;
    },

    _unsubscribeFromImageEvents: function() {
      this.$el.off('scroll', this._showImages);
      this._subscribedToImageEvents = false;
    },

    _hideOffscreenImages: function() {
      var offscreenImgs;
      if (this.isActive()) {
        offscreenImgs = this.$('img:not([src="{0}"])'.format(G.blankImgDataUrl)).filter(function() {
          return !U.isRectPartiallyInViewport(this.getBoundingClientRect(), IMG_OFFSET);
        });
      }
      else 
        offscreenImgs = this.$('img'); // TODO only images that are lazy loaded
          
      if (offscreenImgs.length) {
        offscreenImgs.each(function() {
          U.HTML.lazifyImage(this);
        });
      }
    },
    
    _showImages: _.throttle(function() {
//      if (true)
//        return;
//      
//      if (!this._imgs || !this._imgs.length)
//        this._imgs = getDummyImages(this.$el);
      
      if (!this._imgs || !this._imgs.length)
        return;
      
      var documentEl = doc.documentElement,
          imgs = this._imgs,
          i = imgs.length - 1,
          allImagesDone = true,
          imgInfos = _.map(imgs, function(img) {
            return {
              inBounds: U.isRectPartiallyInViewport(img.getBoundingClientRect(), IMG_OFFSET),
              inDoc: $.contains(documentEl, img)
            }
          });
      
      for (; i >= 0; i--) {
        this._loadImage(imgs[i], imgInfos[i]);
      }
  
      if (!this._imgs || !this._imgs.length)
        this._unsubscribeFromImageEvents();
    }, 50),
    
    _loadImage: function(img, info) {
      var documentEl = doc.documentElement,
          dataUrl,
          realSrc,
          inDoc,
          inBounds,
          bounds,
          blob,
          res;
      
      img = img.target || img;
      if (info) {
        inDoc = info.inDoc;
        inBounds = info.inBounds;
      }
      
      if (img.src != G.blankImgDataUrl)
        return;
      
      this._subscribeToImageEvents();
      realSrc = img.getAttribute(lazyAttr);
      if (!realSrc)
        return true;

      if (!info) {
        inDoc = $.contains(documentEl, img);
        inBounds = U.isRectPartiallyInViewport(img.getBoundingClientRect(), IMG_OFFSET);
      }
      
      if (inDoc && inBounds) {
        // To avoid onload loop calls
        // removeAttribute on IE is not enough to prevent the event to fire
        this._fetchImage(img);
        return true;
      }
      else if (inDoc) {
        // wait till it's scrolled into the viewport
        if (!this._imgs)
          this._imgs = [];
        
        if (!_.contains(this._imgs, img))
          this._imgs.push(img);
        
        return false; 
      }
      else {
        // should be here in a bit
        setTimeout(_.partial(this._loadImage, img), 100);
        return false;
      }
    },
    
    _fetchImage: function(img) {
      var url,
          imgInfoAtt,
          imgInfo, // { cid: {String} resource cid for the resource to which this image belongs, prop: {String} property name }
          res,
          prop,
          imgUri,
          data;
      
      if (img.file || img.blob) {
        cleanImage(img, true);
        img.src = URL.createObjectURL(img.file || img.blob);
        URL.revokeObjectURL(img.src);
        return;
      }
      
      url = img.getAttribute(lazyAttr);
      imgInfoAtt = img.getAttribute('data-for');
      if (!imgInfoAtt)
        return;
      
      cleanImage(img);
      imgInfo = U.parseImageAttribute(imgInfoAtt);
      res = this.findResourceByCid(imgInfo.id) || this.findResourceByUri(imgInfo.id);
      prop = imgInfo.prop;
      
      if (res && prop && (imgUri = res.get(prop))) {
        var dataProp = prop + '.data',
            hasData = _.has(res.attributes, dataProp),
            data = hasData && res.get(dataProp);
        
        if (data) {
          res.unset(dataProp, { silent: true }); // don't keep the file/blob in memory
          if (typeof data == 'string')
            img.src = data;
          else if (data instanceof Blob) {
            img.blob = data; // do keep file/blob on the image
            img.src = URL.createObjectURL(data);
            URL.revokeObjectURL(img.src);
          }
          else if (data instanceof File) {
            img.file = data; // do keep file/blob on the image
            img.src = URL.createObjectURL(data);
            URL.revokeObjectURL(img.src);
          }
          else if (data._filePath) {
            U.require('fileSystem').done(function(FS) {
              FS.readAsFile(data._filePath, data._contentType).done(function(file) {
                img.file = file; // do keep file/blob on the image
                img.src = URL.createObjectURL(file);
                URL.revokeObjectURL(img.src);
              });
            });
          }
          
          return;
        }
        else if (hasData) {
          res.fetch({
            dbOnly: true,
            success: function() {
              debugger;
              self._fetchImage(img);
            },
            error: function() {
              debugger;
            }
          });
          
          return;
        }
        
        img.onload = function() {
          U.getImage(url, 'blob').done(function(blob) {
            if (!blob)
              return;
                  
            // save to resource
            var atts = {};
            atts[prop + '.uri'] = imgUri;
            atts[dataProp] = blob;
            res.set(atts, {
              silent: true
            });
            
            Events.trigger('updatedResources', [res]); // save the image to the db
          });
        };
      }
      
      img.src = url;
      img.removeAttribute(lazyAttr);
      if (this._imgs)
        Array.remove(this._imgs, img);
      
      this.log('imageLoad', 'lazy loading image: ' + url);
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