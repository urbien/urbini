define('views/mixins/Scrollable', ['globals', 'underscore', 'utils', 'events', 'lib/fastdom', 'lib/jquery.hammer'], function(G, _, U, Events, Q, Hammer) {
  var AXES = ['X', 'Y'],
      beziers = {
        fling: 'cubic-bezier(0.103, 0.389, 0.307, 0.966)', // cubic-bezier(0.33, 0.66, 0.66, 1)
        bounceDeceleration: 'cubic-bezier(0, 0.5, 0.5, 1)',
        bounce: 'cubic-bezier(0.7, 0, 0.9, 0.6)',
        easeIn: 'cubic-bezier(0.420, 0.000, 1.000, 1.000)'
      },      
      doc = document,
      CSS = U.CSS;

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
  
  function isInBounds(point, bounds, includeBorder) {
    var lessThan = includeBorder ? _['<'] : _['<=']; // looks like you would want the opposite, but we're looking to eliminate, not to match
    for (var i in AXES) {
      var axis = AXES[i];
      if (!isInRange(point[axis], bounds[axis]))
        return false;
    }    
    
    return true;
  }

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
  
  var initScrollerProps = {
    axis: 'Y',
    SCROLL_EVENT_TIME_PERIOD: 200,
    SCROLL_EVENT_DISTANCE_PERIOD: 200,
    MAX_COAST_TIME: 1500,
    MAX_VELOCITY: 5,
    MAX_OUT_OF_BOUNDS: 50,
    acceleration: 0.005,
    keyboard: true,
    momentum: true,
    timeouts: []
  };
  
  var Scrollable = Backbone.Mixin.extend({
    initialize: function(options) {
      _.bindAll(this, '_initScroller', '_resetScroller', '_snapScroller', '_flingScroller', '_scrollTo', '_calculateSizes', '_onSizeInvalidated', '_onClickInScroller', '_onScrollerActive', '_onScrollerInactive',
                      '_onDragScrollerStart', '_onDragScrollerEnd', '_onDragScroller', '_onSwipeScroller', '_onKeyDown', '_onKeyUp'); //, '_onReleaseInScroller');
      
      this.onload(this._initScroller.bind(this));
      this.$el.addClass('scrollable');
    },
    
    render: function() {
      this.$el.addClass('scrollable');
    },
    
    _initScroller: function(options) {
      this._scrollerProps = _.deepExtend({}, initScrollerProps, this._scrollableOptions, options);
      var self = this;
      var el = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = el.parentNode || doc.body;      
      (function calcSize() {        
        if (self._calculateSizes() !== false)
          self._toggleScrollEventHandlers(true);
        else
          self._queueScrollTimeout(calcSize, 100);
      })();
      
//      this._transitionScrollerState(UNINITIALIZED, 'init'); // simulate 'init' event in UNINITIALIZED state      
    },
    
    events: {
//      'click': '_onClickInScroller',
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated',
      'page_show': '_onScrollerActive',      
      'page_beforehide': '_onScrollerInactive',
      'click': '_onClickInScroller',
//      'release': '_onClickInScroller',
//      'release': '_onReleaseInScroller',
      'drag': '_onDragScroller',
      'swipe': '_onSwipeScroller',
      'dragstart': '_onDragScrollerStart',
      'dragend': '_onDragScrollerEnd'
    },

    myEvents: {
      'invalidateSize': '_onSizeInvalidated'
    },
    
    _isScrolling: function() {
      var s = this._scrollerProps;
      return !!(s._keyHeld || s._start || s._flinging || s._snapping || s._dragging);
    },
    
    _onScrollerActive: function() {
      if (this._scrollerInitialized)
        this._toggleScrollEventHandlers(true);
    },

    _onScrollerInactive: function() {
      if (this._scrollerInitialized) {
        this._resetScroller();
        this._toggleScrollEventHandlers(false);
      }
    },

//    _onReleaseInScroller: function(e) {
//      e.preventDefault();
//      if (this._isScrolling()) {
//        e.stopImmediatePropagation();
//        return false;
//      }
//    },
    
    _onDragScrollerStart: function(e) {
      if (!this._canScroll(e))
        return;
      
      e.gesture.preventDefault();
      this._resetScroller();
      this._scrollerProps._start = e.gesture.touches[0];
    },

    _onDragScrollerEnd: function(e) {
      if (!this._canScroll(e))
        return;
      
      e.gesture.preventDefault();
      var s = this._scrollerProps,
          pos = s.position,
          axis = this._getScrollAxis();
      
      s._start = null;
      if (!s._flinging) {
        if (!this._isInBounds(pos, false /* don't include bounce gutter */))
          this._snapScroller(); //To(axis, pos[axis] < s.scrollBounds[axis].min ? 'min' : 'max');
        else
          this._resetScroller();
      }
    },

    _onDragScroller: function(e) {
      if (!this._canScroll(e))
        return;
      
      // scrollTo immediately
      e.gesture.preventDefault();
      var s = this._scrollerProps;
      if (!s._start) {
        this._onDragScrollerStart(e);
        return;
      }
      
      s._dragging = true;
      var touch = e.gesture.touches[0],
          pos = s.position,
          axis = this._getScrollAxis(),
          coordProp = axis == 'X' ? 'pageX' : 'pageY',
          distance = touch[coordProp] - s._start[coordProp],
          newX, newY;
      
      if (!distance)
        return;
      
      s._start = touch;
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
    
    _onSwipeScroller: function(e) {
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
          
        if ((tooBig && velocity < 0) || (!tooBig && velocity > 0))
          this._flingScroller(velocity);
      }
      else if (Math.abs(velocity) > 0.5)
        this._flingScroller(velocity);
    },

    _onKeyDown: function(e) {
      if (!this._canScroll(e))
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
            
      time = time ? Math.abs(time) : this._calcAnimationTime(pos, newPos);
      if (jump)
        time = Math.min(time, maxJumpTime);
      
      this._scrollTo(newPos.X, newPos.Y, time, ease);
    },
    
    _onKeyUp: function(e) {
      if (!this._canScroll(e))
        return;
      
      var s = this._scrollerProps;
      if (!s._keyHeld)
        return;

//      this.log('KEYING UP', U.getKeyEventCode(e));
      this._updateScrollPosition();
      this._scrollTo(s.position.X, s.position.Y);
      this._resetScroller();
    },

    _toggleScrollEventHandlers: function(enable) {
      if (this._scrollingEnabled == enable)
        return;
      
      var self = this;
      var s = this._scrollerProps;
      var horizontal = this._getScrollAxis() == 'X';
      var hammerMethod = enable ? 'on' : 'off';
      var domMethod = enable ? 'addEventListener' : 'removeEventListener';
      var frame = s.frame;
//      var observer = frame;//doc;
      var hammer = this.hammer();
//      var dragEvents = horizontal ? 'dragright dragleft' : 'dragup dragdown';
//      var swipeEvents = horizontal ? 'swiperight swipeleft' : 'swipeup swipedown';
      
      this._scrollingEnabled = enable;
      frame[domMethod]('load', this._onSizeInvalidated, true);
//      hammer[hammerMethod]('tap', this._onClickInScroller);
////      hammer[hammerMethod]('release', this._onReleaseInScroller);
//      this.hammer({ drag_block_horizontal:true, drag_block_vertical:true })
//        [hammerMethod](dragEvents, this._onDragScroller)
//        [hammerMethod](swipeEvents, this._onSwipeScroller);
//        [hammerMethod]('dragstart', this._onDragScrollerStart)
//        [hammerMethod]('dragend', this._onDragScrollerEnd);
      
      if (s.keyboard) {
        doc[domMethod]('keydown', this._onKeyDown, true);
        doc[domMethod]('keyup', this._onKeyUp, true);
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
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window[_vendorStylePropertyPrefix + 'MutationObserver'];
        if (MutationObserver)
          this._mutationObserver = new MutationObserver(this._onSizeInvalidated);
      }

      if (this._mutationObserver) {
        this._mutationObserver.observe(frame, {
          childList: true,
          characterData: true,
          subtree: true
        });
      } else {
        var self = this;
        frame[domMethod]('DOMSubtreeModified', _.debounce(function (e) {
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
    
    _onSizeInvalidated: _.debounce(function(e) {
      if (!this.isActive())
        return;
      
      if (!this.isPageView()) {
        var page = this.getPageView();
        if (page)
          page.$el.trigger('resize');
      }
        
      if (!this.rendered || !this._scrollerProps || !this._scrollerProps.position)
        return;
      
      if (this.getLastPageEvent() !== 'page_show') {
        if (this._scrollerSizeRecalcQueued)
          return;
        
        this._scrollerSizeRecalcQueued = true;
        this.pageView.$el.one('page_show', this._onSizeInvalidated);
        return;
      }
      
//      if (e && e.type == 'load' && e.target && e.target.tagName == 'IMG')
//        return;
      
      this.log("RECALCULATING SCROLLER SIZE", e && e.type);
      this._scrollerSizeRecalcQueued = false;
//      this.log('invalidated size');
      this._calculateSizes();
      if (!this._isInBounds())
        this._snapScroller(true);
    }, 100),
    
    _calculateSizes: function() {
      this._scrollerInitialized = false;
      var s = this._scrollerProps,
          frame = s.frame,
          scrollWidth = this.el.scrollWidth,
          scrollHeight = this.el.offsetHeight,
          containerWidth = frame.offsetWidth,
          containerHeight = frame.offsetHeight,
          axis = this._getScrollAxis(),
          scrollDim = axis == 'X' ? scrollWidth : scrollHeight,
          containerDim = axis == 'X' ? containerWidth : containerHeight,
          scrollX = axis == 'X',
//          hadPosition = !!s.position,
          gutter = s.MAX_OUT_OF_BOUNDS;
      
      if (!scrollDim || !containerDim)
        return false;
      
      this._scrollerInitialized = true;
      _.extend(s, {        
        metrics: {
          snapGrid: {
            X: containerWidth,
            Y: containerHeight
          },
          container: {
            width: containerWidth,
            height: containerHeight
          },
          content: {
            width: scrollWidth,
            height: scrollHeight,
            rawWidth: scrollWidth,
            rawHeight: scrollHeight
//            ,
//            visible: visibleBounds
          }
        },
        
        scrollBounds: {
          X: {
            min: Math.min(scrollX ? containerWidth - scrollWidth : 0, 0), 
            max: 0
          },
          Y: {
            min: Math.min(!scrollX ? containerHeight - scrollHeight : 0, 0),
            max: 0
          }  
        },
        
        bounceBounds: {
          X: {
            min: Math.min(scrollX ? containerWidth - scrollWidth - gutter : 0, 0), 
            max: 0
          },
          Y: {
            min: Math.min(!scrollX ? containerHeight - scrollHeight - gutter : 0, 0),
            max: 0
          }  
        }
      });

      if (!s.position) {
        s.position = {
          X: 0,
          Y: 0
        }
      }
//      if (hadPosition)
//        this._updateScrollPosition();
      
      this.$el.trigger('scrollosize', this.getScrollInfo());
    },
    
    getVisibleScrollerArea: function(forceRecalc) {
      var top, left, width, height;
      if (forceRecalc) {
        var translation = U.CSS.getTranslation(this.el);
        top = -translation.Y,
        left = -translation.X;
        width = Math.min(window.innerWidth, this.$el.width());
        height = Math.min(window.innerHeight, this.$el.height());
      }
      else {
        var info = this.pageView.getScrollInfo(),
            content = info.content;

//        width = content.visibileWidth;
//        height = content.visibileHeight;
        top = info.scrollTop;
        left = info.scrollLeft;
        width = Math.min(window.innerWidth, content.width);
        height = Math.min(window.innerHeight, content.height);
      }
      
      return {
        top: top,
        bottom: top + height,
        left: left,
        right: left + width
      }
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
        this._updateScrollPosition(); // parse from CSS
        s._start = s._keyHeld = s._flinging = s._snapping = s._dragging = null;
        Q.write(this._clearScrollerTransitionStyle, this, undefined, {
          throttle: true,
          last: true
        });
      }
    },
    
    _clearScrollerTransitionStyle: function() {
//      this.log("clearing scroller transition style");
      CSS.setStylePropertyValues(this.el.style, {
        transition: null
      });
    },
    
//    _clearTouchHistory: function() {
//      var s = this._scrollerProps;
//      s.touchHistory.length = s.distanceTraveled = s.timeTraveled = 0;
//    },
    
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
        this._scrollerProps.position = CSS.getTranslation(this.el);
//        console.debug("PARSED SCROLL POS:", this._scrollerProps.position, this.TAG);
      }
    },
    
    _getScrollerState: function() {
      return this._scrollerProps.state;
    },
    
    isInnermostScroller: function(e) {
      return this.el == $(e.target).closest('.scrollable')[0];
    },
    
    _onClickInScroller: function(e) {
//      console.debug(this.TAG, e.type.toUpperCase(), "EVENT:", e);
      var s = this._scrollerProps;
      if (this._isScrolling()) {
        console.debug("PREVENTING CLICK EVENT: ", e);
        (e.gesture || e).preventDefault();
        return false;
      }
      
      this._resetScroller();
    },
    
    _triggerScrollEvent: function(type, scroll) {
      this.$el.trigger(type.replace('scroll', 'scrollo'), this.getScrollInfo(scroll));
    },
    
    getScrollInfo: function(scroll) {
      scroll = scroll || this._getScrollOffset();
      return _.extend(_.deepExtend({}, _.pick(this._scrollerProps.metrics, 'container', 'content')), scroll);      
    },
    
    _scrollTo: function(x, y, time, ease) {
      time = time || 0;
//      this.log('scrolling to:', x, ',', y, ', in ' + time + 'ms');
      var s = this._scrollerProps,
          pos = s.position,
          bounce = s.bounce;
      
      if (time) {
        // queue up scroll events
        var self = this,
            axis = this._getScrollAxis(),
            newCoord = arguments[axis == 'X' ? 0 : 1],
            distance = Math.abs(newCoord - pos[axis]),
            numScrollEvents = Math.max(time / s.SCROLL_EVENT_TIME_PERIOD, distance / s.SCROLL_EVENT_DISTANCE_PERIOD) | 0, // round to int
            period = (time / numScrollEvents) | 0, // round to int
            distanceUnit = distance / numScrollEvents,
            pingPos = U.clone(pos),
            scrollTime = 0;
    
        function ping() {
          if (self._isScrolling()) {
            pingPos[axis] += distanceUnit;
            self._triggerScrollEvent('scroll', scrollPosToOffset(pingPos));
          }
        }
        
        this._queueScrollTimeout(function() {
          s.position.X = x;
          s.position.Y = y;
          self._resetScroller();
          U.recycle(pingPos);
        }, time);
        
        for (var i = 0; i < numScrollEvents; i++) {
          this._queueScrollTimeout(ping, scrollTime += period);
        }      
      }
      else
        this._updateScrollPosition(x, y);
//      else
//        this._queueScrollTimeout(this._updateScrollPosition.bind(this, offsetX, offsetY), time);
      
      Q.write(this._setScrollerCSS, this, [x, y, time, ease], {
        throttle: true,
        last: true
      });
    },
    
    _setScrollerCSS: function (x, y, time, ease) {
      CSS.setStylePropertyValues(this.el.style, {
        transition: 'all {0}ms {1}'.format(time, time == 0 ? '' : ease || beziers.fling),
        transform: CSS.getTranslationString(x, y)
      });
      
      this._triggerScrollEvent('scroll');
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
                       (includeBounceGutter ? s.bounceBounds : s.scrollBounds)[axis], 
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
      if (axis == 'X')
        snapToX = destination;
      else
        snapToY = destination;
      
      time = immediate ? 0 : this._calcAnimationTime(pos.X, pos.Y, snapToX, snapToY) / 2;    
      this._scrollTo(snapToX, snapToY, time, beziers.bounce, time);
      s._snapping = false;
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
          acceleration = velocity < 0 ? s.acceleration : -s.acceleration,
          distance = (-(velocity * velocity) / (2 * acceleration)) | 0,
          newPos = {},
          pastDestination,
          timeToDestination,
          timeToReset;

      s._flinging = true;
      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      newPos = this._limitToBounds(newPos);
      distance = calcDistance(s.position, newPos);
//      pastDestination = this._limitToBounds(newPos, true);
      timeToDestination = timeToReset = this._calcAnimationTime(distance);    
      this._scrollTo(newPos.X, newPos.Y, timeToDestination, beziers.fling);      
    }
  }, {
    displayName: 'Scrollable'    
  });
  
  return Scrollable;
});