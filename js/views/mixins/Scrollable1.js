define('views/mixins/Scrollable1', ['globals', 'underscore', 'utils'], function(G, _, U) {

  var FORCE_TOUCH = true,
      SCROLL_DISTANCE_THRESH = 25,
      SCROLL_TIME_THRESH = 1000,
      mouseEvents = ['mousedown', 'mouseup', 'mousemove'],
      touchEvents = ['touchstart', 'touchend', 'touchmove'];
  
  
  document.body.addEventListener('touchmove', function(e) {
    // This prevents native scrolling from happening.
    e.preventDefault();
  }, false);

  function oppositeDir(dir) {
    return dir == 'X' ? 'Y' : 'X';
  }
  
  function calcAnimationTime(distance) {
    return parseInt(Math.sqrt(Math.abs(distance)) * 50, 10);
  }
  
  function calcDistance(pos1, pos2) {
    var x = pos1.X - pos2.X,
        y = pos1.Y - pos2.Y;
    
    return Math.sqrt(x * x + y * y);
  }
  
  function limitToBounds(position, min, max) {
    return {
      X: Math.max(Math.min(position.X, max.X), min.X),
      Y: Math.max(Math.min(position.Y, max.Y), min.Y)
    }
  }

  function isOnTheBorder(position, min, max, axis) {
    if (axis)
      return position[axis] == min[axis] || position[axis] == max[axis];
    else
      return isOnTheBorder(position, min, max, 'X') || isOnTheBorder(position, min, max, 'Y');
  }

//  var Utils = {
//    X: function(touch) {
//      return touch.X;
//    },
//    Y: function(touch) {
//      return touch.Y;
//    }
//  }
  
  var initScrollerProps = {
    axes: {
      X: false,
      Y: false
    },
    startTouch: null,
    endTouch: null,
    MAX_SCROLL_TIME: 2400,
    MIN_START_VELOCITY_: 0.25,
    MAX_OUT_OF_BOUNDS: 50,
    BOUNCE_BACK_TIME_: 400,
    acceleration: -0.005,
    momentum: true,
    timeTraveled: 0,
    distanceTraveled: 0,
    min: {},
    max: {},
    dragging: false,
    decelerating: false
  };
  
  var Scrollable = {
    initialize: function(options) {
      _.bindAll(this, '_initScroller', 'onTouchStart', 'onTouchMove', 'onTouchEnd', '_resetScroll', '_snapToBounds', '_scrollTo');
      var scrollerOptions = {
        axes: {
          X: options.scrollX !== false,
          Y: options.scrollY !== false
        }
      };
      
      this.onload(_.partial(this._initScroller, scrollerOptions));
    },
    
    _initScroller: function(options) {
      this._scrollerProps = _.deepExtend({}, initScrollerProps, options);
      var element = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = element.parentNode || document.body;
      this._calculateSizes().done(_.partial(this._scrollTo, 0, 0));
      
      var events = FORCE_TOUCH || G.browser.mobile ? touchEvents : mouseEvents;
//      if (FORCE_TOUCH || G.browser.mobile) {
//        frame.addEventListener('touchstart', this, false);
//        frame.addEventListener('touchmove', this, false);
//        frame.addEventListener('touchend', this, false);
////        frame.addEventListener('touchcancel', this, false);
//      } else {
//        frame.addEventListener('mousedown', this, false);
//        frame.addEventListener('mousemove', this, false);
//        frame.addEventListener('mouseup', this, false);
//      }
      
      for (var i = 0; i < events.length; i++) {
        frame.addEventListener(events[i], this, false);
      }
      
      frame.addEventListener('webkitTransitionEnd', this, false);
      frame.addEventListener('transitionend', this, false);
      frame.addEventListener('click', this, true);
    },
    
    events: {
//      'touchstart': 'onTouchStart',
//      'touchmove': 'onTouchMove',
//      'touchend': 'onTouchEnd',
      'resize': '_calculateSizes',
      'orientationchange': '_calculateSizes'
    },
    
    myEvents: {
      'invalidateSize': '_calculateSizes'
    },
    
    _calculateSizes: function() {
      var s = this._scrollerProps,
//      s.contentWidth = this.el.width;
//      s.contentHeight = this.el.height;      
          frame = s.frame,
          scrollWidth = this.el.offsetWidth,
          scrollHeight = this.el.offsetHeight,
          containerWidth = frame.offsetWidth,
          containerHeight = frame.offsetHeight,
          scrollX = this._getScrollAxis() == 'X',
          dfd = $.Deferred();
      
      if (!scrollHeight || !containerHeight) {
        setTimeout(function() {
          this._calculateSizes().done(dfd.resolve).fail(dfd.reject);
        }.bind(this), 100);
        
        return dfd.promise();
      }
      
//      s.snapGrid.X = s.containerWidth = frame.offsetWidth;
//      s.snapGrid.Y = s.containerHeight = frame.offsetHeight;
      s.metrics = {
        snapGrid: {
          X: containerWidth,
          Y: containerHeight
        },
        container: {
          X: containerWidth,
          Y: containerHeight
        },
        content: {
          X: scrollWidth,
          Y: scrollHeight,
          rawX: scrollWidth,
          rawY: scrollHeight
        }
      };
      
      s.scrollMax = {
        X: 0,
        Y: 0
      };
      
      s.scrollMin = {
        X: scrollX ? containerWidth - scrollWidth : 0,
        Y: !scrollX ? containerHeight - scrollHeight : 0
      };

      var gutter = s.MAX_OUT_OF_BOUNDS;
      s.bounce = {
        scrollMin: {
          X: scrollX ? containerWidth - scrollWidth - gutter : 0,
          Y: !scrollX ? containerHeight - scrollHeight - gutter : 0
        },
        scrollMax: {
          X: scrollX ? gutter : 0,
          Y: !scrollX ? gutter : 0
        }
      };

      s.position = {
        X: 0,
        Y: 0
      };
      
      return G.getResolvedPromise();
      
//      s.min.X = window.innerWidth - s.contentWidth;
//      s.max.X = 0;
//      s.min.Y = window.innerHeight - s.contentHeight;
//      s.max.Y = 0;
    },
    
    _resetScroll: function(x, y) {
      var s = this._scrollerProps;
      if (arguments.length) {
        s.position.X = x;
        s.position.Y = y;
      }
      
      s.dragging = false;
      s.startTouch = s.endTouch = null;
      s.startTimestamp = s.lastTimestamp = s.distanceTraveled = s.timeTraveled = 0;
      clearTimeout(s.bounceBackTimer);
      clearTimeout(s.resetScrollTimer);
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: null
      });
      
      if (this._isOutOfBounds())
        this._snapToBounds();
    },

    _updateTouchHistory: function(e, touch) {
//      this._updateScrollPosition(touch.X, touch.Y);
      
      var s = this._scrollerProps;
      s.startTimestamp = s.lastTimestamp;
      s.lastTimestamp = e.timeStamp;
      if (s.endTouch) {
        s.startTouch = s.endTouch;
        s.endTouch = U.cloneTouch(touch);
      }
      else {
        s.endTouch = U.cloneTouch(touch);
      }
      
      if (!s.startTouch)
        s.startTouch = s.endTouch;
      
      if (s.startTouch) {
        s.distanceTraveled += calcDistance(s.endTouch, s.startTouch);
        s.timeTraveled += s.endTouch.timeStamp - s.startTouch.timeStamp;
      }
//      else
//        this.$el.trigger('scrollstart', { scrollLeft: -s.position.X, scrollTop: -s.position.Y });
    },
    
    _updateScrollPosition: function(x, y) {
//      if (arguments.length) {
//        this._scrollerProps.position.X = x;
//        this._scrollerProps.position.Y = y;
//      }
//      else
      var style = document.defaultView.getComputedStyle(this.el, null);
      this._scrollerProps.position = U.CSS.parseTranslation(U.CSS.getStylePropertyValue(style, 'transform'));
    },
    
    handleEvent: function(e) {
      var s = this._scrollerProps;
      switch (e.type) {
      case 'touchstart':
        this.onTouchStart(e);
        break;
      case 'touchmove':
        this.onTouchMove(e);
        break;
//      case 'touchcancel':
      case 'touchend':
        this.onTouchEnd(e);
        break;
      case 'click':
        this.onClick(e);
        break;
//      case 'mousedown':
//        s.onTouchStart(e);
//        break;
//      case 'mousemove':
//        s.onTouchMove(e);
//        break;
//      case 'mouseup':
//        s.onTouchEnd(e);
//        break;
      case 'webkitTransitionEnd':
        this.onTransitionEnd(e);
        break;
      }
    },

    onClick: function(e) {
      var ok = !this._scrollerProps._preventClick;
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      return ok;
    },
    
    onTransitionEnd: function(e) {
//      U.CSS.setStylePropertyValues(this.el.style, {
//        transition: null
//      });
      this.log('event', 'transitionend event: ' + e.propertyName);
    },

//    setMinOffset: function(offset) {
//
//    },
//
//    setMaxOffset: function(offset) {
//
//    },

    onTouchStart: function(e) {
      if (!e.targetTouches.length)
        return;

      this._updateTouchHistory(e, e.targetTouches[0]);
      // This will be shown in part 4.
      var s = this._scrollerProps;
      s.dragging = true;
      this._stopMomentum();
//      s.startTouch = s.endTouch;
//      s.contentStartOffset.Y = s.contentOffset.Y;
//      s.contentStartOffset.X = s.contentOffset.X;
    },

    onTouchMove: function(e) {
      var last = this._lastTouchMoveTime || Date.now();
      this._lastTouchMoveTime = Date.now();
      console.log('time since last touch move: ' + (this._lastTouchMoveTime - last));
      if (!e.targetTouches.length || !this._isDragging())
        return;
      
      var s = this._scrollerProps;
      if (!s.endTouch)
        this.$el.trigger('scrollstart', { scrollLeft: -s.position.X, scrollTop: -s.position.Y });
        
      this._updateTouchHistory(e, e.targetTouches[0]);

      var scrollX = this._getScrollAxis() == 'X';
      var gesture = {
        X: s.endTouch.X - s.startTouch.X,
        Y: s.endTouch.Y - s.startTouch.Y
      };
      
      var targetPosition = { 
        X: scrollX ? s.position.X + gesture.X : s.position.X, 
        Y: !scrollX ? s.position.Y + gesture.Y : s.position.Y 
      };

      this._scrollTo(targetPosition.X, targetPosition.Y);
    },

    onTouchEnd: function(e) {
      if (!e.changedTouches.length)
        return;
      
      var s = this._scrollerProps;
      if (!s.startTouch)
        return;

      this._updateTouchHistory(e, e.changedTouches[0]);
      if (s.distanceTraveled < SCROLL_DISTANCE_THRESH || s.timeTraveled < SCROLL_TIME_THRESH) {
        s._preventClick = true;
        console.log('this was a click');
      }
      else
        console.log('this was a scroll');
      
      if (this._isDragging()) {
        if (this._shouldStartMomentum()) {
          this._doMomentum();
        } else {
          this._snapToBounds();
        }
      }
      
      s.dragging = false;
      e.preventDefault();
      
      this.$el.trigger('scroll');
      this.$el.trigger('scrollend', { scrollLeft: -s.position.X, scrollTop: -s.position.Y });
    },
    
//    momentumTo: function(offsetX, offsetY) {
//      var s = this._scrollerProps;
//      s.contentOffset.X = offsetX;
//      s.contentOffset.Y = offsetY;
//      U.CSS.setStylePropertyValues(this.el.style, {
//        transition: 'transform {0}ms cubic-bezier(0.33, 0.66, 0.66, 1)'.format(s.BOUNCE_BACK_TIME_),
//        transform: 'translate3d({0}px, {1}px, 0)'.format(offsetX, offsetY)
//      });
//    },

    _scrollTo: function(offsetX, offsetY, time, ease) {
      time = time || 0;
      var s = this._scrollerProps,
          content = s.metrics.content,
          bounce = s.bounce;
      
      clearTimeout(s.bounceBackTimer);
      if (time) {
//        var adjusted = this._limitToBounds({
//          X: offsetX,
//          Y: offsetY
//        }, true);
//        
//        offsetX = adjusted.X;
//        offsetY = adjusted.Y;
        this._scheduleBounceBack(offsetX, offsetY, time);
      }
      else {
        s.position.X = offsetX;
        s.position.Y = offsetY;
        if (!s.endTouch)
          this._snapToBounds();
      }
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: 'all {0}ms {1}'.format(time, ease || 'cubic-bezier(0.33, 0.66, 0.66, 1)'),
        transform: 'translate3d({0}px, {1}px, 0px)'.format(offsetX, offsetY)
      });      

      this.$el.trigger('scroll');
      
//      U.CSS.setStylePropertyValues(this.el.style, {
//        transform: 'translate3d({0}px, {1}px, 0)'.format(offsetX, offsetY)
//      });
    },

    _isOutOfBounds: function(position, includeBounceGutter, borderIsOut) {
      var s = this._scrollerProps;
      position = position || s.position;
      if (_.isEqual(position, this._limitToBounds(position, includeBounceGutter)))
        return borderIsOut ? this._isOnTheBorder(position, includeBounceGutter) : false;
      else
        return true;
    },

    _isOnTheBorder: function(position, includeBounceGutter) {
      var s = this._scrollerProps,
          bounds = includeBounceGutter ? s.bounce : s;
      
      return isOnTheBorder(position, bounds.scrollMin, bounds.scrollMax, this._getScrollAxis());      
    },

    _limitToBounds: function(position, includeBounceGutter) {
      var s = this._scrollerProps,
          bounds = includeBounceGutter ? s.bounce : s;
      
      return limitToBounds(position, bounds.scrollMin, bounds.scrollMax);
    },
    
    _snapToBounds: function() {
      // make sure the element is not outside the frame, and snap it back if it is
      var s = this._scrollerProps,
          pos = s.position,
          inBounds = this._limitToBounds(pos);
      
      clearTimeout(s.bounceBackTimer);
      if (!_.isEqual(pos, inBounds)) {
        console.log('snapping from:', pos, 'to:', inBounds);
        this._scrollTo(inBounds.X, inBounds.Y, this._calcAnimationTime(calcDistance(pos, inBounds)));
      }
    },
    
    _calcAnimationTime: function(distance) {
      return Math.min(calcAnimationTime(distance), this._scrollerProps.MAX_SCROLL_TIME);
    },

    /**
     * if x or y is out of bounds, schedule a bounce back after "time" millis pass
     */
    _scheduleBounceBack: function(x, y, time) {
      var s = this._scrollerProps,
          newPos = { X: x, Y: y };
      
      if (this._isOutOfBounds(newPos)) {
        s.bounceBackTimer = setTimeout(function() {
          s.position = newPos;
          this._snapToBounds();
        }.bind(this), time);
      }
      else
        s.resetScrollTimer = setTimeout(_.partial(this._resetScroll, x, y), time);
    },
    
    _isDragging: function() {
      return this._scrollerProps.dragging;
    },

    _shouldStartMomentum: function() {
      var s = this._scrollerProps
      if (this._isOutOfBounds(s.position, false, true))
        return false;
      
      this._getEndVelocity();
      return Math.abs(this._scrollerProps.velocity) > 0.5;
    },

    _isDecelerating: function() {
      return this._scrollerProps.decelerating;
    },

    _getScrollAxis: function() {
//      var s = this._scrollerProps;
//      if (Math.abs(s.startTouch.X - s.endTouch.X) > Math.abs(s.startTouch.Y - s.endTouch.Y))
//        return 'X';
//      else
//        return 'Y';
      return this._scrollerProps.axes.X ? 'X' : 'Y';
    },

    _getEndVelocity: function(direction) {
      var s = this._scrollerProps;
      var axis = this._getScrollAxis();
      var distance = s.endTouch[axis] - s.startTouch[axis]; 
      var velocity = distance / (s.lastTimestamp - s.startTimestamp);
      return (s.velocity = velocity);
    },
    
    _doMomentum: function() {
      console.log('flinging');
      var s = this._scrollerProps;
      
      // Calculate the movement properties. Implement _getEndVelocity using the
      // start and end position / time.
      var axis = this._getScrollAxis(),
          otherAxis = oppositeDir(axis),
//      var velocity = this._getEndVelocity(axis);
          velocity = s.velocity,
          acceleration = velocity < 0 ? 0.0005 : -0.0005,
          distance = - (velocity * velocity) / (2 * acceleration),
          newPos = {};

      // Set up the transition and execute the transform. Once you implement this
      // you will need to figure out an appropriate time to clear the transition
      // so that it doesn’t apply to subsequent scrolling.
//      var newX, newY;
//      switch (axis) {
//      case 'X':
//        newX = s.position.X + distance;
//        newY = s.position.Y;
//        break;
//      case 'Y':
//        newX = s.position.X;
//        newY = s.position.Y + distance;
//        break;
//      }
      
      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      newPos = this._limitToBounds(newPos, true);
//      var time = this._calcAnimationTime(distance); //parseInt(Math.min(-velocity / acceleration, s.MAX_MOMENTUM_TIME), 10);
      this._scrollTo(newPos.X, newPos.Y, this._calcAnimationTime(distance));
      s.decelerating = true;
    },
    
    _stopMomentum: function() {
      var s = this._scrollerProps;
      if (this._isDecelerating()) {
        s.decelerating = false;
        s.velocity = 0;
        this._updateScrollPosition();
        console.log('stopping momentum at: ' + s.position);
        this._scrollTo(s.position.X, s.position.Y);
        this._resetScroll();
      }
    } 
  }
  
  return Scrollable;
});