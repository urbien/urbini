define('views/mixins/Scrollable', ['globals', 'underscore', 'utils', 'domUtils', 'events', 'lib/fastdom', 'hammer'], function(G, _, U, DOM, Events, Q) {
  var AXES = ['X', 'Y'],
      beziers = {
        fling: [0.103, 0.389, 0.307, 0.966], // cubic-bezier(0.33, 0.66, 0.66, 1)
//        bounceDeceleration: [0, 0.5, 0.5, 1],
        bounce: [0.7, 0, 0.9, 0.6],
        easeIn: [0.420, 0.000, 1.000, 1.000]
      },      
      NUM_PRECALCED_DISTANCES = 20,
      SCROLL_EVENT_DISTANCE_THRESH = 50,
      bezierStep = 1 / NUM_PRECALCED_DISTANCES,
      doc = document,
      AXIS_INDEX = {
        X: 0,
        Y: 1
      },
      SCROLL_OFFSET = {
        X: 0,
        Y: 0
      },
      axisToDim= {
        X: 'width',
        Y: 'height'
      },
      dimToAxis= {
        width: 'X',
        height: 'Y'
      };


  var originalScroll = window.onscroll;
  window.onscroll = function(e) {
    if (window.pageXOffset || window.pageYOffset) {
      SCROLL_OFFSET.X = -window.pageXOffset;
      SCROLL_OFFSET.Y = -window.pageYOffset;
      console.debug('scrolled to', SCROLL_OFFSET);
      window.scrollTo(0, 0);
    }
    
    if (originalScroll)
      originalScroll.apply(this, arguments);
  };
  
//  // IE9, Chrome, Safari, Opera
//  window.addEventListener("mousewheel", mouseWheelHandler, true);
//  // Firefox
//  window.addEventListener("DOMMouseScroll", mouseWheelHandler, true);
//  
//  function mouseWheelHandler(e) {
//    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
//    
//    debugger;
//  }
  
  
  for (var bezier in beziers) {
    var curve = beziers[bezier];
    curve.transform = 'cubic-bezier({0}, {1}, {2}, {3})'.format(curve[0], curve[1], curve[2], curve[3]);
//    curve.initialVelocityMultiplier = (CSS.getBezierPercentComplete(curve[0], curve[1], curve[2], curve[3], bezierStep, 0.01) - CSS.getBezierPercentComplete(curve[0], curve[1], curve[2], curve[3], 0.05, 0.01)) / 0.05;
    var percentComplete = 0;
    var percentTime = 0;
    var d = curve.distanceMultipliers = [];
    for (var i = 0; i < NUM_PRECALCED_DISTANCES; i++) {
      percentTime += bezierStep;
      percentComplete = DOM.getBezierPercentComplete(curve[0], curve[1], curve[2], curve[3], percentTime, 0.01);
      d.push(percentComplete);
    }
    
//    var v = curve.velocityMultipliers = [];
//    var percentComplete = 0;
//    var time = 0;
//    for (var i = 0; i < NUM_PRECALCED_VELOCITIES; i++) {
//      var oldPercent = percentComplete;
//      time += velocityInc;
//      percentComplete = CSS.getBezierPercentComplete(curve[0], curve[1], curve[2], curve[3], time, 0.01);
//      v.push((percentComplete - oldPercent) / velocityInc);
//    }
  }

  doc.addEventListener('click', function(e) {
//    var state = G.getScrollState();
    try {
//      if (state !== 'idle' && state !== 'clicking') {
      if (!G.canClick()) {
        G.log('events', 'PREVENTING CLICK', _.now());
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      G.log('events', 'ALLOWING CLICK', _.now());
    } finally {
//      Events.trigger('scrollState', 'idle');
      G.enableClick();
    }
  }, true);
  
//  $(doc).hammer().on('click', function(e) {
//    if (G.getScrollState() !== 'clicking') {
//      e.preventDefault();
//      e.stopPropagation();
//      return false;
//    }
//  });
  
  function getDirectionMultiplier(direction) {
    return direction == 'up' || direction == 'left' ? -1 : 1; 
  }
  
  function isVertical(direction) {
    return direction == 'up' || direction == 'down';
  }

  function scrollPosToOffset(pos) {
    return {
      scrollLeft: -pos.X,
      scrollTop: -pos.Y
    }
  }

  function scrollOffsetToPos(offset) {
    return {
      X: -offset.X,
      Y: -offset.Y
    }
  }

  function oppositeDir(dir) {
    return dir == 'X' ? 'Y' : 'X';
  }
  
  function calcAnimationTime(distance) {
    return (Math.sqrt(Math.abs(distance)) * 50) | 0;
  }
  
  function calcDistance(pos1, pos2) {
    var x = pos1.X - pos2.X,
        y = pos1.Y - pos2.Y;
    
    return Math.sqrt(x * x + y * y);
  }
  
//  function isInBounds(point, bounds, includeBorder) {
//    var lessThan = includeBorder ? _['<'] : _['<=']; // looks like you would want the opposite, but we're looking to eliminate, not to match
//    for (var i in AXES) {
//      var axis = AXES[i];
//      if (!isInRange(point[axis], bounds[axis] - SCROLL_OFFSET[axis]))
//        return false;
//    }    
//    
//    return true;
//  }

  /*
   * @param range { min: min, max: max }
   */
  function isInRange(num, range, includeBorder) {
    var lessThan = includeBorder ? _['<'] : _['<=']; // looks like you would want the opposite, but we're looking to eliminate, not to match
    return !lessThan(num, range.min) && !lessThan(range.max, num);
  }

  function limitToBounds(point, bounds) {
    var limited = {};
    for (var i in AXES) {
      var axis = AXES[i],
          val = point[axis],
          bound = bounds[axis];
      
      limited[axis] = Math.max(bound.min, Math.min(val, bound.max));
    }
    
    return limited;
  }
  
  var initCoord = {
    X: 0,
    Y: 0
  };
  
  var initDimensions = {
    width: 0,
    height: 0
  }
  
  function getInitBounds() {
    return {
      X: {
        min: 0,
        max: 0
      },
      Y: {
        min: 0,
        max: 0
      }
    };
  }

  function getInitScrollerProps() {
    return {
      axis: 'Y',
      SCROLL_EVENT_TIME_PERIOD: 200,
      SCROLL_EVENT_DISTANCE_PERIOD: 200,
      MAX_COAST_TIME: 2500,
      MAX_VELOCITY: 7,
      MAX_OUT_OF_BOUNDS: 50,
      deceleration: 0.0035,
      keyboard: true,
      momentum: true,
      timeouts: [],
      viewportDestination: _.clone(initCoord),
      prevViewportDestination: null,
      position: _.clone(initCoord),
      prevPosition: null,
      scrollBounds: getInitBounds(),
      bounceBounds: getInitBounds(),
      metrics: {
        snapGrid: _.clone(initCoord),
        container: _.clone(initDimensions),
        content: _.clone(initDimensions)
      }
    };
  }
  
  var Scrollable = Backbone.Mixin.extend({
    className: 'scrollable',
    initialize: function(options) {
      _.bindAll(this, '_initScroller', '_resetScroller', '_snapScroller', '_flingScroller', '_scrollTo', '_calculateScrollerSize', '_onSizeInvalidated', '_onScrollerClick', '_onScrollerActive', '_onScrollerInactive',
                      '_onScrollerMouseOut', '_onScrollerTouch', '_onScrollerDragStart', '_onScrollerDragEnd', '_onScrollerDrag', '_onScrollerSwipe', '_onKeyDown', '_onKeyUp', '_updateScrollPositionAndReset',
                      '_onNativeScroll', '_onMouseWheel', '_checkIfScrolledToHead', '_stopScroller'); //, '_onScrollerRelease');
      
      this.onload(this._initScroller.bind(this));
    },
    
    _initScroller: function(options) {
      this._scrollerProps = _.deepExtend({}, getInitScrollerProps(), this._scrollableOptions, options);
      var self = this;
      var el = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = el.parentNode || doc.body;      
      (function calcSize() {
        Q.read(function() {          
          if (self._calculateScrollerSize() !== false)
            self._toggleScrollEventHandlers(true);
          else
            self._queueScrollTimeout(calcSize, 100);
        });
      })();
      
//      this._transitionScrollerState(UNINITIALIZED, 'init'); // simulate 'init' event in UNINITIALIZED state      
    },
    
    events: {
      'click': '_onScrollerClick',
//      'release': '_onScrollerClick',
//      'release': '_onScrollerDragEnd',
//      'touchend': '_onScrollerClick',
      'touch': '_onScrollerTouch',
//      'release': '_onScrollerRelease',
      'page_show': '_onScrollerActive',      
      'page_beforehide': '_onScrollerInactive',
      'drag': '_onScrollerDrag',
      'swipe': '_onScrollerSwipe',
      'dragstart': '_onScrollerDragStart',
      'dragend': '_onScrollerDragEnd',
      'scrollo': '_checkIfScrolledToHead'
    },
    
    /**
     * on mobile devices, we want to trigger a native scroll event when the user reaches the top of the page so that the navbar shows
     */
    _checkIfScrolledToHead: function(e) {
      var info = e.detail;
      if (this._getScrollAxis() == 'Y') {
        if (!this._scrolledToHead && info.scrollTop == 0) { // && !this._scrollerProps._snapping) { // not sure we want to trigger this event if we're snapping 
          this._scrolledToHead = true;
          info._scrollo = true;
          var scrollEvent = $.Event('scroll', info);
          $(window).trigger(scrollEvent);
        }
        else
          this._scrolledToHead = false;
      }
    },

    myEvents: {
      'destroyed': '_toggleScrollEventHandlers'
    },

    windowEvents: {
      'scroll': '_onNativeScroll',
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated'
    },

    /**
     * @return true if the scroller is currently coasting/flinging or snapping (in other words, scrolling without the user dragging it)
     */
    _isScrollingHandsFree: function() {
      if (!this._scrollerInitialized)
        return false;
            
      var s = this._scrollerProps;
      return s._flinging || s._snapping;
    },
    
    _isScrolling: function() {
      var s = this._scrollerProps;
      return !!(s._keyHeld || s._start || s._flinging || s._snapping || s._dragging);
    },
    
    _onNativeScroll: function(e) {
      if (this._scrollerInitialized && !e._scrollo && this.isPageView()) {
      // Native scroll was prevented but we recorded the desired scroll location, now we scroll the scroller there manually
        this._scrollTo(SCROLL_OFFSET.X, SCROLL_OFFSET.Y);
      }
    },
    
    _onMouseWheel: function(e) {
      if (!this._scrollerInitialized)
        return;
      
//      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))),
      this._resetScroller();
      var self = this,
          s = this._scrollerProps,
          delta = e.wheelDelta,
          bound = delta > 0 ? 'max' : 'min',
          bounds = s.scrollBounds,    
          x = bounds.X[bound],
          y = bounds.Y[bound],
          time = Math.abs(delta * 20);

      s._flinging = true;
      this._queueScrollTimeout(this._updateScrollPositionAndReset, 200);
      this._scrollTo(x, y, time, beziers.easeIn);
    },
    
    _onScrollerActive: function() {
      if (this._scrollerInitialized)
        this._toggleScrollEventHandlers(true);
      
      if (this._scrollerSizeRecalcQueued) {
        this._scrollerSizeRecalcQueued = false;
        this._onSizeInvalidated();
      }
    },

    _onScrollerInactive: function() {
      if (this._scrollerInitialized) {
        var s = this._scrollerProps;
        if (s._snapping || !this._isInBounds(s.position, false /* don't include bounce gutter */))
          this._snapScroller(true); // immediate snap
        else
          this._resetScroller();
        
        this._toggleScrollEventHandlers(false);
      }
    },

//    _onScrollerRelease: function(e) {
//      PREVENT_CLICK = false;
//      var s = this._scrollerProps;
//      if (G.getScrollState() != 'idle') {
//        console.log("PREVENTING RELEASE");
//        Events.stopEvent(e);
//        e.gesture.preventDefault();
//        e.gesture.stopPropagation();
//        return false;
//      }
//      else
//      if (G.getScrollState() == 'touching')
//        Events.trigger('scrollState', 'clicking');
//        
//      e.preventDefault();
//      if (this._isScrolling()) {
//        e.stopImmediatePropagation();
//        return false;
//      }
//    },

    _updateScrollPositionAndReset: function() {
//      console.log("UPDATING SCROLL POSITION AND RESETTING");
      this._updateScrollPosition(); // parse from CSS
      this._triggerScrollEvent('scroll');
      this._stopScroller();
      this._resetScroller();
    },
    
    _stopScroller: function() {
      var s = this._scrollerProps;
      this._scrollTo(s.position.X, s.position.Y);
    },
    
    _onScrollerMouseOut: function(e) {
      if (!this._scrollerInitialized || !this._isScrolling())
        return;
      
      // check if the user swiped offscreen (in which case we can't detect 'mouseup' so we will simulate 'mouseup' NOW)
      e = e ? e : window.event;
      var from = e.relatedTarget || e.toElement,
          s = this._scrollerProps;
      
      if (!from || from.nodeName == "HTML") {
        if (s._dragging) {
          this.el.dispatchEvent(new MouseEvent('mouseup', {
//            view: this.el,
            cancelable: true,
            bubbles: true
          }));
          
//          e.type = 'mouseup';
//          e.target = this.el;
//          this.el.dispatchEvent(e);
//          s._start = s._keyHeld = s._flinging = s._snapping = s._dragging = null;
//          if (!this._isInBounds(s.position, false /* don't include bounce gutter */))
//            this._snapScroller(); //To(axis, pos[axis] < s.scrollBounds[axis].min ? 'min' : 'max');
//          else {
////            Events.trigger('scrollState', 'idle');
//            this._resetScroller();
//          }
        }
      }
    },
    
    _onScrollerTouch: function(e) {
      var s = this._scrollerProps;
      if (this._isScrollingHandsFree()) {
        e.gesture.preventDefault();
        this._queueScrollTimeout(this._updateScrollPositionAndReset, 50);
      }
      
      G.enableClick();
//      else if (G.getScrollState() == 'idle')
//        Events.trigger('scrollState', 'touching');
    },

    _onScrollerDragStart: function(e) {
      if (!this._canScroll(e))
        return;
      
      var s = this._scrollerProps;
      e.gesture.preventDefault();
//      PREVENT_CLICK = true;
      if (this._isScrollingHandsFree()) // if we're currently coasting/flinging, we don't know our position
        this._updateScrollPosition();   // so we need to parse our position from css
      
      this._resetScroller();
      s._start = e.gesture.touches[0];
      s._startTime = e.gesture.timeStamp;
      G.disableClick();
    },

    _onScrollerDragEnd: function(e) {
      if (!this._canScroll(e))
        return;
      
      e.gesture.preventDefault();
      var s = this._scrollerProps,
          pos;
//          axis;
      
      if (!s._start)
        return;
      
      pos = s.position;
//      axis = this._getScrollAxis();
      s._start = s._startTime = null;
      if (!s._flinging) {
        if (!this._isInBounds(pos, false /* don't include bounce gutter */))
          this._snapScroller(); //To(axis, pos[axis] < s.scrollBounds[axis].min ? 'min' : 'max');
        else
          this._resetScroller();
      }
    },

    _onScrollerDrag: function(e) {
      if (!this._canScroll(e))
        return;
      
      // scrollTo immediately
      e.gesture.preventDefault();
      var s = this._scrollerProps;
      if (!s._start) {
        this._onScrollerDragStart(e);
        return;
      }
      
      s._dragging = true;
//      Events.trigger('scrollState', 'dragging');
      var touch = e.gesture.touches[0],
          pos = s.position,
          axis = this._getScrollAxis(),
          coordProp = 'page' + axis,
          distance = touch[coordProp] - s._start[coordProp],
          now = _.now(),
          time = now - s._startTime,
          newX, newY;
      
      if (!distance)
        return;
      
      this._setScrollVelocity(distance / time);
      s._start = touch;
      s._startTime = e.gesture.timeStamp;
      if (axis == 'X') {
        newX = pos.X + distance;
        newY = pos.Y;
      }
      else {
        newX = pos.X;        
        newY = pos.Y + distance;
      }
      
      this._scrollTo(newX, newY);
    },

    _canScroll: function(e) {
      if (!this._scrollerInitialized || !e || !e.gesture)
        return false;
      
      var axis = this._getScrollAxis(),
          dir = e.gesture.direction;
      
      if ((axis == 'X' && !isVertical(dir)) || 
          (axis == 'Y' && isVertical(dir))) {
        return true;
      }
      else
        return false;
    },
    
    _onScrollerSwipe: function(e) {
      if (!this._canScroll(e))
        return;
      
      // scrollTo and do momentum
      var s = this._scrollerProps,
          axis,
          velocity,
          pos;
      
      if (!s.momentum)
        return;
            
      e.gesture.preventDefault();
      axis = this._getScrollAxis();
      velocity = Math.min(e.gesture['velocity' + axis], s.MAX_VELOCITY) * getDirectionMultiplier(e.gesture.direction);
      pos = s.position;
          
      if (!this._isInBounds(pos, false /* don't include bounce gutter */, true /* border counts as out */)) { 
        var axis = this._getScrollAxis(),
            offset = s.position[axis],
            tooBig = offset > s.scrollBounds[axis].max;
          
        if ((tooBig && velocity < 0) || (!tooBig && velocity > 0)) {
          e.gesture.stopDetect();
          this._flingScroller(velocity);
        }
      }
      else if (Math.abs(velocity) > 0.5) {
        e.gesture.stopDetect();
        this._flingScroller(velocity);
      }
    },

    _onKeyDown: function(e) {
      if (!this._scrollerInitialized)
        return;
      
      var s = this._scrollerProps;
      if (s._keyHeld)
        return;
      
      var self = this,
          keyCode = U.getKeyEventCode(e),
          axis = this._getScrollAxis(),
          pos = s.position,
          newPos = _.clone(pos),
          bounds = s.scrollBounds[axis],
          maxJumpTime = 300,
          jump = keyCode >= 33 && keyCode <=36,
          ease,
          time,
          distance;

      switch (keyCode) {
      case 33: // page up
        distance = window.innerHeight;
        break;
      case 34: // page down
        distance = -window.innerHeight;
        break;
      case 36: // home
        distance = bounds.max - pos[axis];
        break;
      case 38: // up arrow
        distance = bounds.max - pos[axis];
        time = distance;
        ease = beziers.easeIn;
        break;
      case 40: // down arrow
        distance = bounds.min - pos[axis];
        time = distance; //calcAnimationTime(distance);
        ease = beziers.easeIn;
        break;
      case 35: // end
        distance = bounds.min - pos[axis];
        break;
      default:
        return;
      }        
      
      this._resetScroller();
      s._keyHeld = keyCode;
//      this.log('KEYING DOWN', keyCode);
      
      distance = distance | 0;
      newPos[axis] += distance;
      newPos = this._limitToBounds(newPos);
      if (_.isEqual(newPos, pos))
        return;
      
      if (distance > s.metrics.container[axisToDim[axis]])
        time = time ? Math.abs(time) : this._calcAnimationTime(pos, newPos);
      else
        time = 0;
      
      if (jump)
        time = Math.min(time, maxJumpTime);
      
      e.preventDefault();
      this._scrollTo(newPos.X, newPos.Y, time, ease);
    },
    
    _onKeyUp: function(e) {
      if (!this._scrollerInitialized)
        return;
      
      var s = this._scrollerProps;
      if (!s._keyHeld)
        return;

//      this.log('KEYING UP', U.getKeyEventCode(e));
      e.preventDefault();
      this._updateScrollPositionAndReset();
    },

    _toggleScrollEventHandlers: function(enable) {
      if (this._scrollingEnabled == enable)
        return;
      
      var self = this;
      var s = this._scrollerProps;
      var horizontal = this._getScrollAxis() == 'X';
      var domMethod = enable ? 'addEventListener' : 'removeEventListener';
      var frame = s.frame;
//      var observer = frame;//doc;
      var hammer = this.hammer();
      var hammerMethod = enable ? 'on' : 'off';
//      var dragEvents = horizontal ? 'dragright dragleft' : 'dragup dragdown';
//      var swipeEvents = horizontal ? 'swiperight swipeleft' : 'swipeup swipedown';
      
      this._scrollingEnabled = enable;
//      frame[domMethod]('load', this._onSizeInvalidated, true);
//      this.el[domMethod]('click', this._onScrollerClick, true); // we want clicks on capture phase
//      hammer[hammerMethod]('tap', this._onScrollerClick, true);
//      hammer[hammerMethod]('click', this._onScrollerClick, true);
//      this.el[domMethod]('tap', this._onScrollerClick, true); // we want clicks on capture phase
//      hammer[hammerMethod]('tap', this._onScrollerClick);
////      hammer[hammerMethod]('release', this._onScrollerRelease);
//      this.hammer({ drag_block_horizontal:true, drag_block_vertical:true })
//        [hammerMethod](dragEvents, this._onScrollerDrag)
//        [hammerMethod](swipeEvents, this._onScrollerSwipe);
//        [hammerMethod]('dragstart', this._onScrollerDragStart)
//        [hammerMethod]('dragend', this._onScrollerDragEnd);
      
      if (s.keyboard) {
        doc[domMethod]('keydown', this._onKeyDown, true);
        doc[domMethod]('keyup', this._onKeyUp, true);
      }
      
      if (!G.browser.touch) {
        doc[domMethod]('mouseout', this._onScrollerMouseOut);
        if (G.browser.firefox) {
          // Firefox
          frame[domMethod]("DOMMouseScroll", this._onMouseWheel, true);
        }
        else {
          // IE9, Chrome, Safari, Opera
          frame[domMethod]("mousewheel", this._onMouseWheel, true);
        }
      }
      
      if (!enable) {
        if (this._mutationObserver) {
          this._mutationObserver.disconnect();
        } else {
          frame[domMethod]('DOMSubtreeModified', this._onSizeInvalidated, true);
        }
        
        return;
      }
      
      if (!this._mutationObserver) { // reuse disconnected instance if available
//        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        if (window.MutationObserver)
          this._mutationObserver = new MutationObserver(this._onSizeInvalidated);
      }

      if (this._mutationObserver) {
        this._mutationObserver.observe(this.el, {
          childList: true,
          characterData: true,
          subtree: true
        });
      } else {
        var self = this;
        frame[domMethod]('DOMSubtreeModified', Q.debounce(function (e) {
          // Ignore changes to nested FT Scrollers - even updating a transform style
          // can trigger a DOMSubtreeModified in IE, causing nested scrollers to always
          // favour the deepest scroller as parent scrollers 'resize'/end scrolling.
          var srcElement = e && e.srcElement;
          if (srcElement && (srcElement === frame || srcElement.className.indexOf('scrollable') !== -1))
            return;

          self._onSizeInvalidated(e);
        }, 100), true);
      }
    },
    
    _sizeInvalidatedDebouncePeriod: 100,
    _onSizeInvalidated: function(e) {
//      console.log("SIZE INVALIDATED");
//      if (e && e.type == 'scroll') {
//        position.X -= SCROLL_OFFSET.X;
//        position.Y -= SCROLL_OFFSET.Y;
//        SCROLL_OFFSET.X = window.scrollX;
//        SCROLL_OFFSET.Y = window.scrollY;
//        this._updateScrollPosition(position.X, position.Y);
//      }
      
//      if (!this.isActive())
//        return;
      
      var self = this,
          now = _.now(),
          lastInvalidated = this._sizeInvalidatedTime || now, // debounce first too
          period = this._sizeInvalidatedDebouncePeriod;
      
      this._sizeInvalidatedTime = now;
      if (now - lastInvalidated < period) {
        if (this._sizeInvalidatedTimer) {
          if (resetTimeout(this._sizeInvalidatedTimer)) // if we were able to reset it, it means the timer hasn't expired yet
            return;
        }
        else {
          this._sizeInvalidatedTimer = setTimeout(this._onSizeInvalidated, period);
          return;
        }
      }
      
//      if (!this.isPageView()) {
//        var page = this.getPageView();
//        if (page)
//          page.$el.trigger('resize');
//      }
        
      if (!this.rendered || !this._scrollerProps || !this._scrollerProps.position)
        return;
      
      if (this.getLastPageEvent() !== 'page_show') {
        if (this._scrollerSizeRecalcQueued)
          return;
        
        this._scrollerSizeRecalcQueued = true;
//        this.pageView.el.addEventListener('page_show', function onpageshow() {
//          self.pageView.el.removeEventListener('page_show', onpageshow);
//          self._onSizeInvalidated();
//        });
      }
      
//      if (e && e.type == 'load' && e.target && e.target.tagName == 'IMG')
//        return;
      
      this.log("RECALCULATING SCROLLER SIZE", e && e.type);
//      this._scrollerSizeRecalcQueued = false;
//      this.log('invalidated size');
      Q.read(function() {
        this._calculateScrollerSize();
        if (!this._isInBounds())
          this._snapScroller(true);
      }, this);
    },
    
    _calculateScrollerSize: function() {
      this._scrollerInitialized = false;
      var s = this._scrollerProps,
          frame = s.frame,
          scrollWidth = this.el.scrollWidth || this.el.offsetWidth,
          scrollHeight = this.el.offsetHeight,
          containerWidth = frame.offsetWidth,
          containerHeight = frame.offsetHeight,
          axis = this._getScrollAxis(),
          scrollX = axis == 'X',
          scrollDim = scrollX ? scrollWidth : scrollHeight,
          containerDim = scrollX ? containerWidth : containerHeight,
          metrics = s.metrics,
          container,
          content,
          snapGrid,
          position,
          scrollBounds,
          bounceBounds,
          gutter = s.MAX_OUT_OF_BOUNDS,
          scrollInfo,
          containerSizeChanged = contentSizeChanged = true;
      
      if (!scrollDim || !containerDim)
        return false;
      
      this._scrollerInitialized = true;
      content = metrics.content;
      container = metrics.container;
      containerSizeChanged = scrollX ? container.width != containerWidth : container.height != containerHeight;
      contentSizeChanged = scrollX ? content.width != scrollWidth : content.height != scrollHeight;
      if (!containerSizeChanged && !contentSizeChanged) 
        return;
      
      snapGrid = metrics.snapGrid;
      scrollBounds = s.scrollBounds;
      bounceBounds = s.bounceBounds;
      snapGrid.X = container.width = containerWidth;
      snapGrid.Y = container.height = containerHeight;
      content.width = content.rawWidth = scrollWidth;
      content.height = content.rawHeight = scrollHeight;
      scrollBounds.X.min = Math.min(scrollX ? containerWidth - scrollWidth : 0, 0);
      scrollBounds.Y.min = Math.min(!scrollX ? containerHeight - scrollHeight : 0, 0);
      bounceBounds.X.min = Math.min(scrollX ? containerWidth - scrollWidth - gutter : 0, 0);
      bounceBounds.Y.min = Math.min(!scrollX ? containerHeight - scrollHeight - gutter : 0, 0); 
        
      if (containerSizeChanged || contentSizeChanged) {
        var scrollInfo = scrollInfo = this.getScrollInfo(),
            dim = axisToDim[axis];
        
        if (containerSizeChanged)
          this.el.dispatchEvent(new CustomEvent('scrollosize', {detail: scrollInfo}));
        
        if (contentSizeChanged)
          this.el.dispatchEvent(new CustomEvent('scrollocontent', {detail: scrollInfo}));
        
        if (content[dim] > container[dim])
          this.el.dispatchEvent(new CustomEvent('scrolloable', {detail: scrollInfo}));
      }
      
      this.setDimensions(content.width, content.height);
    },
    
    _queueScrollTimeout: function(fn, time) {
      this._scrollerProps.timeouts.push(setTimeout(fn, time));
    },
    
    _resetScroller: function() {
//      this.log('RESETTING SCROLLER');
      var s = this._scrollerProps;
      this._clearScrollTimeouts();
//      this._clearTouchHistory();
      if (this._isScrolling()) {
        s._start = s._keyHeld = s._flinging = s._snapping = s._dragging = null;
//        Events.trigger('scrollState', 'idle');
        Q.write(this._clearScrollerTransitionStyle, this, undefined, {
          throttle: true,
          last: true
        });
      }
      
//      G.enableClick();
    },
    
    _clearScrollerTransitionStyle: function() {
//      this.log("clearing scroller transition style");
      DOM.setStylePropertyValues(this.el.style, {
        transition: null
      });
    },
    
    _clearScrollTimeouts: function() {
      var timeouts = this._scrollerProps.timeouts;
      for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
      }
      
      timeouts.length = 0;
    },

    _updateScrollPosition: function(x, y) {
      var pos = this._scrollerProps.position;
      if (arguments.length) {
        if (arguments.length == 1) { // passed in position object
          _.extend(pos, arguments[0]);
        }
        else {
          pos.X = x;
          pos.Y = y;
        }
      }
      else {
        _.extend(pos, DOM.getTranslation(this.el));
      }
      
//      pos.X += SCROLL_OFFSET.X;
//      pos.Y += SCROLL_OFFSET.Y;
      this.setPosition(pos.X, pos.Y);
    },
    
    _getScrollerState: function() {
      return this._scrollerProps.state;
    },
    
    isInnermostScroller: function(e) {
      return this.el == $(e.target).closest('.scrollable')[0];
    },

    _onScrollerClick: function(e) {
      if (!this._scrollerInitialized)
        return;
      
//      console.debug(this.TAG, e.type.toUpperCase(), "EVENT:", e);
//      var s = this._scrollerProps;
//      if (this._isScrolling()) {
//        console.debug("PREVENTING CLICK EVENT: ", e);
//        e = e.gesture || e;
//        e.preventDefault();
//        e.stopPropagation();
//        if (!s._start && !s._snapping && !this._isInBounds(s.position, false /* don't include bounce gutter */)) {
//          // theoretically, this shouldn't happen, but it happened once
//          debugger;
//          this._snapScroller();
//        }
//        
//        return false;
//      }
//      
//      this._resetScroller();
      
      Q.read(this._calculateScrollerSize, this);
    },
    
    _triggerScrollEvent: function(type, scroll) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          pos = scroll ? scrollOffsetToPos(scroll) : s.position,
          prevPos = s.prevPosition;
      
      if (prevPos && Math.abs(pos[axis] - prevPos[axis]) < SCROLL_EVENT_DISTANCE_THRESH)
        return;
      
//      this.log("SCROLL FROM: ", prevPos[axis], pos[axis]);
      s.prevPosition = _.clone(pos); 
      this.el.dispatchEvent(new CustomEvent(type.replace('scroll', 'scrollo'), { detail: this.getScrollInfo(scroll) }));
    },
    
    getScrollInfo: function(scroll) {
      if (!this._scrollerInitialized)
        return null;
      
      scroll = scroll || this._getScrollOffset();
      return _.extend(_.deepExtend({}, _.pick(this._scrollerProps.metrics, 'container', 'content')), scroll);      
    },
    
    _scrollTo: function(x, y, time, ease) {
      time = time || 0;
      ease = ease || beziers.fling;
//      this.log('scrolling to:', x, ',', y, ', in ' + time + 'ms');
      var s = this._scrollerProps,
          pos = s.position,
          bounce = s.bounce;
      
//      x -= SCROLL_OFFSET.X;
//      y -= SCROLL_OFFSET.Y;
      if (time) {
        var self = this,
            axis = this._getScrollAxis(),
            viewportDim = G.viewport[axisToDim[axis]],
            axisIdx = axis == 'X' ? 0 : 1,
            newCoord = arguments[axisIdx],
            distance = newCoord - pos[axis],
            avgVelocity = distance / time,
            numScrollEvents = (Math.max(time / s.SCROLL_EVENT_TIME_PERIOD, distance / s.SCROLL_EVENT_DISTANCE_PERIOD) + 1) | 0, // round to int
            period = (time / numScrollEvents) | 0, // round to int
            timePeriodPercent = period / time,
//            distanceUnit = distance / numScrollEvents,
            distanceMultipliers = ease.distanceMultipliers,
            percentDistanceTraveled = 0,
            percentTimeTraveled = 0,
            pingPos = U.clone(pos),
            alertedAboutDestinationProximity = false,
            scrollTime = 0;
    
        this._setScrollVelocity(distanceMultipliers[0] * distance / time);
        function ping() {
          if (self._isScrolling()) {
            var prevPercentTime = percentTimeTraveled;
            var prevPercentDist = percentDistanceTraveled;
            var distanceTraveled = percentDistanceTraveled * distance;
            percentTimeTraveled += timePeriodPercent;
            percentDistanceTraveled = distanceMultipliers[(percentTimeTraveled * NUM_PRECALCED_DISTANCES) | 0];
            self._setScrollVelocity(avgVelocity * (percentDistanceTraveled - prevPercentDist) / (percentTimeTraveled - prevPercentTime));
            pingPos[axis] = pos[axis] + distanceTraveled;
//            self._updateScrollPosition(pingPos.X, pingPos.Y);
            if (!alertedAboutDestinationProximity && Math.abs(distance - distanceTraveled) < viewportDim * 3) {
//              console.log("SENDING VIEWPORT DESTINATION ALERT", x, y, time - percentTimeTraveled * time);
              alertedAboutDestinationProximity = true;
              self._setViewportDestination(x, y, time - percentTimeTraveled * time);
            }
              
//            console.log("DISTANCE LEFT: ", distance - distanceTraveled);
            self._triggerScrollEvent('scroll', scrollPosToOffset(pingPos));
          }
        }
        
        this._queueScrollTimeout(function() {
          var destination = _.clone(pos);
          destination[axis] += distance;
          self._setScrollVelocity(0);
          self._updateScrollPosition(x, y);
          self._triggerScrollEvent('scroll', scrollPosToOffset(destination));
          self._resetScroller();
          U.recycle(pingPos);
        }, time);
        
        // queue up scroll events
        if (numScrollEvents) {
          for (var i = 0; i < numScrollEvents; i++) {
            this._queueScrollTimeout(ping, scrollTime += period);
          }
        }
        else
          self._setViewportDestination(x, y, time);
      }
      else {
        this._updateScrollPosition(x, y);
        this._setViewportDestination(x, y, 0);
        this._triggerScrollEvent('scroll');
      }
      
      Q.write(this._setScrollerCSS, this, [x, y, time, ease], {
        throttle: true,
        last: true
      });
    },
    
    _setScrollerCSS: function (x, y, time, ease) {
      DOM.setStylePropertyValues(this.el.style, {
        transition: 'all {0}ms {1}'.format(time, time == 0 ? '' : ease.transform),
        transform: DOM.getTranslationString(x, y)
      });
      
//      this._triggerScrollEvent('scroll');
    },

    _getScrollPosition: function() {
      return this._scrollerProps.position;
    },

    _getScrollOffset: function() {
      return scrollPosToOffset(this._scrollerProps.position);
    },

    _isInBounds: function(position, includeBounceGutter, borderIsOut) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis();
      
      return isInRange(s.position[axis], 
                       (includeBounceGutter ? s.bounceBounds : s.scrollBounds)[axis], // - SCROLL_OFFSET[axis], 
                       !borderIsOut);
    },

    _limitToBounds: function(position, includeBounceGutter) {
      var s = this._scrollerProps;
      return limitToBounds(position, 
                           includeBounceGutter ? s.bounceBounds : s.scrollBounds);
    },
    
    _snapScroller: function(immediate) {
      this._clearScrollTimeouts();
      // snap the content div to its frame
//      this.log('snapping scroller');
      var s = this._scrollerProps,
          axis = this._getScrollAxis();
      
      this._snapScrollerTo(axis, 
                           s.position[axis] < s.scrollBounds[axis].min ? 'min' : 'max', 
                           immediate);
    },
    
    _snapScrollerTo: function(axis, endpoint, immediate) {
      var self = this,
          s = this._scrollerProps,
          pos = s.position,
          snapToX = pos.X,
          snapToY = pos.Y,
          destination = s.scrollBounds[axis][endpoint],
          time;
      
      s._snapping = true;
//      Events.trigger('scrollState', 'snapping');
      if (axis == 'X')
        snapToX = destination;
      else
        snapToY = destination;
      
      time = immediate ? 0 : this._calcAnimationTime(pos.X, pos.Y, snapToX, snapToY) / 2;    
      this._scrollTo(snapToX, snapToY, time, beziers.bounce, time);
    },
    
    _calcAnimationTime: function(distance) {
      if (arguments.length == 2) {
        var axis = this._getScrollAxis();
        distance = Math.abs(arguments[0][axis] - arguments[1][axis]);
      }
      else if (arguments.length == 4) {
        var axis = this._getScrollAxis();
        var idx = axis == 'X' ? 0 : 1;
        distance = Math.abs(arguments[idx] - arguments[idx + 2]);
      }
      
      return Math.min(calcAnimationTime(distance), this._scrollerProps.MAX_COAST_TIME);
    },

    _getScrollAxis: function() {
      return this._scrollerProps.axis;
    },
    
    _setScrollAxis: function(axis) {
      this._scrollerProps.axis = axis;      
    },

    _flingScroller: function(velocity) {
      this._clearScrollTimeouts();
      var self = this,
          s = this._scrollerProps,
          axis = this._getScrollAxis(),
          otherAxis = oppositeDir(axis),
          deceleration = velocity < 0 ? s.deceleration : -s.deceleration,
          distance = (-(velocity * velocity) / (2 * deceleration)) / 2 | 0,  // divide by two is a hack to account for the fling accelerating first before decelerating 
          newPos = {},
          pastDestination,
          timeToDestination,
          timeToReset;

      s._flinging = true;
//      Events.trigger('scrollState', 'flinging');
      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      newPos = this._limitToBounds(newPos);
      distance = calcDistance(s.position, newPos);
//      pastDestination = this._limitToBounds(newPos, true);
      timeToDestination = this._calcAnimationTime(distance);    
      this._scrollTo(newPos.X, newPos.Y, timeToDestination, beziers.fling);
    },
    
    _scrollVelocity: 0,
    _setScrollVelocity: function(velocity) {
//      this.log(this.TAG, "SCROLL VELOCITY:", velocity);
      this._scrollVelocity = velocity;
    },
    
    _getScrollVelocity: function() {
      return this._scrollVelocity;
    },

    _viewportDestination: {
      X: 0,
      Y: 0
    },
    
    _setViewportDestination: function(x, y, timeToDestination) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          prevDest = s.prevViewportDestination;
      
      if (prevDest && Math.abs(arguments[AXIS_INDEX[axis]] - prevDest[axis]) < SCROLL_EVENT_DISTANCE_THRESH)
        return;

      if (!prevDest)
        s.prevViewportDestination = {};
      
      s.viewportDestination.X = s.prevViewportDestination.X = x;
      s.viewportDestination.Y = s.prevViewportDestination.Y = y;
      s.viewportArrivalTime = _.now() + timeToDestination;
      this.trigger('viewportDestination', x, y, timeToDestination);
//      this.log("VIEWPORT DESTINATION:", x, y, "IN", timeToDestination, "MILLIS");
    },
    
    _getViewportDestination: function() {
      return this._scrollerProps.viewportDestination;
    },
    
    _isViewportAtDestination: function() {
      return this._scrollerProps.viewportArrivalTime < _.now();
    },
    
    isScrolledToHead: function() {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          bounds = s.scrollBounds;
      
      return s.position[axis] == bounds[axis].max;
    },
    
    isScrolledToTail: function() {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          bounds = s.scrollBounds;
      
      return s.position[axis] == bounds[axis].min;
    },
    
    snapScrollerToTail: function(immediate) {
      var axis = this._getScrollAxis();
      this._snapScrollerTo(axis, 'min', immediate);
    },
    
    snapScrollerToHead: function(immediate) {
      var axis = this._getScrollAxis();
      this._snapScrollerTo(axis, 'max', immediate);
    }
  }, {
    displayName: 'Scrollable'    
  });
  
  return Scrollable;
});