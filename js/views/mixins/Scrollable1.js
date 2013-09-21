define('views/mixins/Scrollable1', ['globals', 'underscore', 'utils', 'events'], function(G, _, U, Events) {

  var FORCE_TOUCH = false,
      SCROLL_DISTANCE_THRESH = 25,
      SCROLL_TIME_THRESH = 1000,
      mouseEvents = ['mousedown', 'mouseup', 'mousemove'],
      touchEvents = ['touchstart', 'touchend', 'touchmove'],
      INPUT_EVENTS = FORCE_TOUCH || G.browser.mobile ? touchEvents : mouseEvents,
      beziers = {
        fling: 'cubic-bezier(0.103, 0.389, 0.307, 0.966)', // cubic-bezier(0.33, 0.66, 0.66, 1)
        bounceDeceleration: 'cubic-bezier(0, 0.5, 0.5, 1)',
        bounce: 'cubic-bezier(0.7, 0, 0.9, 0.6)'
      };

//  document.body.addEventListener('mousemove', function() {
//    debugger;
//    e.preventDefault();
//  }, false)

  document.body.addEventListener('touchmove', function(e) {
    // This prevents native scrolling from happening.
    e.preventDefault();
  }, false);

  function isScrollableContainer(el) {
    var style = window.getComputedStyle(el);
    return style.overflow == 'hidden' && style.position == 'absolute';
  }
  
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
    SCROLL_EVENT_PERIOD: 200,
    MAX_COAST_TIME: 1500,
    MIN_START_VELOCITY_: 0.25,
    MAX_OUT_OF_BOUNDS: 50,
    BOUNCE_OUT_TIME: 400,
    BOUNCE_BACK_TIME: 400,
    acceleration: -0.005,
    momentum: true,
    timeTraveled: 0,
    distanceTraveled: 0,
    min: {},
    max: {},
    dragging: false,
    coasting: false,
    snapping: false,
    decelerating: false,
    timeouts: []
  };
  
  var Scrollable = {
    initialize: function(options) {
      _.bindAll(this, '_initScroller', 'onTouchStart', 'onTouchMove', 'onTouchEnd', '_resetScroll', '_snapToBounds', '_scrollTo', '_calculateSizes', '_onSizeInvalidated');
      var scrollerOptions = {
        axes: {
          X: options.scrollX !== false,
          Y: options.scrollY !== false
        }
      };
      
      this.onload(this._initScroller.bind(this, scrollerOptions));
    },
    
    _initScroller: function(options) {
      this._scrollerProps = _.deepExtend({}, initScrollerProps, options);
      var el = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = el.parentNode || document.body;
      this._calculateSizes().done(this._finishScrollerInit.bind(this));
    },
    
    _finishScrollerInit: function() {
      var el = this.el;
      for (var i = 0; i < INPUT_EVENTS.length; i++) {
        el.addEventListener(INPUT_EVENTS[i], this, false);
      }
      
      el.addEventListener('webkitTransitionEnd', this, false);
      el.addEventListener('transitionend', this, false);
      el.addEventListener('click', this, true);
      
      this._scrollTo(0, 0);      
    },
    
    events: {
//      'touchstart': 'onTouchStart',
//      'touchmove': 'onTouchMove',
//      'touchend': 'onTouchEnd',
      'resize': '_calculateSizes',
      'orientationchange': '_calculateSizes'
    },

    windowEvents: {
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated'
    },
    
    myEvents: {
      'invalidateSize': '_onSizeInvalidated'
    },
    
    _onSizeInvalidated: _.debounce(function() {
      if (!this.rendered)
        return;
      
      console.log('invalidated size');
      this._calculateSizes();
      if (this._isOutOfBounds())
        this._snapToBounds(true);
    }, 100),
    
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
          hadPosition = !!s.position,
          gutter = s.MAX_OUT_OF_BOUNDS,
          dfd = $.Deferred(),
          promise = dfd.promise();
      
      dfd._id = _.uniqueId('dfd');
      if (!scrollHeight || !containerHeight) {
        if (isScrollableContainer(frame)) {
          setTimeout(function() {
            this._calculateSizes().done(dfd.resolve).fail(dfd.reject);
          }.bind(this), 100);
        }
        else {
          dfd.reject();
          console.error('Scrollable view is not in a scrollable container: ' + this.TAG);
        }
        
        return promise;
      }

      s.position = {
        X: 0,
        Y: 0
      };  
      
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
      
      if (hadPosition)
        this._updateScrollPosition();

      dfd.resolve();
      return promise;
      
//      s.min.X = window.innerWidth - s.contentWidth;
//      s.max.X = 0;
//      s.min.Y = window.innerHeight - s.contentHeight;
//      s.max.Y = 0;
    },
    
    _queueScrollTimeout: function(fn, context, time) {
      this._scrollerProps.timeouts.push(setTimeout(fn.bind(context), time));
    },
    
    _resetScroll: function(x, y) {
//      console.log('resetting scroll');
      var s = this._scrollerProps,
          timeouts = s.timeouts;
      
      for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
      }
      
      timeouts.length = 0;
      if (arguments.length)
        this._updateScrollPosition(x, y);
      
      this._clearTouchHistory();
      s.dragging = s.decelerating = s.coasting = s.preventClick = s.touchendReceived = false;
      s.startTimestamp = s.lastTimestamp = s.distanceTraveled = s.timeTraveled = 0;
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: null
      });      
    },
    
    _clearTouchHistory: function() {
      var s = this._scrollerProps;
      s.startTouch = s.endTouch = null;      
    },

    _updateTouchHistory: function(e, touch) {
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
    },
    
    _updateScrollPosition: function(x, y) {
//      if (x == 0 && y == -1)
//        debugger;
      
//      console.log('updating scroll position:', x, y);
      if (arguments.length) {
        this._scrollerProps.position.X = x;
        this._scrollerProps.position.Y = y;
      }
      else {
        var style = document.defaultView.getComputedStyle(this.el, null);
        this._scrollerProps.position = U.CSS.parseTranslation(U.CSS.getStylePropertyValue(style, 'transform'));
      }
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
      case 'mousedown':
        this.onTouchStart(_.extend(e, {
          targetTouches: [U.cloneTouch(e)]
        }));
        
        break;
      case 'mousemove':
        this.onTouchMove(_.extend(e, {
          targetTouches: [U.cloneTouch(e)]
        }));
        
        break;
      case 'mouseup':
        this.onTouchEnd(_.extend(e, {
          changedTouches: [U.cloneTouch(e)]
        }));
        
        break;
      case 'webkitTransitionEnd':
        this.onTransitionEnd(e);
        break;
      }
    },

    onClick: function(e) {
      var ok = !this._scrollerProps.preventClick;
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

//      console.log('touchstart at: ' + e.targetTouches[0].clientY);
      var s = this._scrollerProps;
      if (s.startTouch && !s.touchendReceived) {
        // user dragged out of the event receiving area.
      }
      
      this._stopMomentum(e);
//      this._resetScroll();
    },

    onTouchMove: function(e) {
      var s = this._scrollerProps, 
          last, 
          scrollX,
          gesture,
          targetPosition;
      
      if (!s.startTouch)
        return;
      
//      console.log('touchmove at: ' + e.targetTouches[0].clientY);
      last = this._lastTouchMoveTime || Date.now();
      this._lastTouchMoveTime = Date.now();
      if (!e.targetTouches.length) // || !this._isDragging())
        return;
      
      s.dragging = true;
      if (!s.endTouch)
        this._triggerScrollEvent('scrollstart');
        
      this._updateTouchHistory(e, e.targetTouches[0]);

      scrollX = this._getScrollAxis() == 'X';
      gesture = {
        X: s.endTouch.X - s.startTouch.X,
        Y: s.endTouch.Y - s.startTouch.Y
      };
      
      targetPosition = { 
        X: scrollX ? s.position.X + gesture.X : s.position.X, 
        Y: !scrollX ? s.position.Y + gesture.Y : s.position.Y 
      };

      this._scrollTo(targetPosition.X, targetPosition.Y);
    },

    _onTouchEnd: function(e, isOutOfBounds) {
//      console.log('touchend at: ' + e.changedTouches[0].clientY);
      var s = this._scrollerProps;
      if (!s.startTouch) {
        if (isOutOfBounds)
          this._snapToBounds();
        
        return;
      }

//      this._updateTouchHistory(e, e.changedTouches[0]); // don't update on touchend, firefox fires touchmove first with the same coordinates 
      if (!isOutOfBounds && (s.distanceTraveled < SCROLL_DISTANCE_THRESH)) {// || s.timeTraveled < SCROLL_TIME_THRESH)) {
        // this was a click, not a swipe
//        console.log('this was a click');
        this._resetScroll();
        return;
      }
      else {
        s.preventClick = true;
        e.preventDefault();
//        console.log('this was a scroll');
      }
      
      if (this._isDragging()) {
        s.dragging = false;
        if (this._shouldStartMomentum())
          this._doMomentum();
        else
          this._snapToBounds();
      }
      else {
        this._resetScroll();
        if (isOutOfBounds)
          this._snapToBounds();
      }
    },
    
    onTouchEnd: function(e) {
      var s = this._scrollerProps,
          isOutOfBounds;
      
      try {
        if (!e.changedTouches.length)
          return;
        
        isOutOfBounds = this._isOutOfBounds();
        this._onTouchEnd(e, isOutOfBounds);
      } finally {
        this._clearTouchHistory();
//        if (isOutOfBounds)
//          this._snapToBounds();
        
        s.touchendReceived = true;
      }
    },
    
    _triggerScrollEvent: function(type, scroll) {
      this.$el.trigger(type, scroll || this._getScrollPosition());
    },
    
    _scrollTo: function(offsetX, offsetY, time, ease) {
//      console.log('scrolling to: ' + offsetX + ', ' + offsetY);
      time = time || 0;
      var s = this._scrollerProps,
          content = s.metrics.content,
          bounce = s.bounce;
      
//      clearTimeout(s.bounceBackTimer);
      if (time) {
//        this._scheduleBounceBack(offsetX, offsetY, time);
        this._queueScrollTimeout(function() {
//          s.position.X = offsetX;
//          s.position.Y = offsetY;
          this._updateScrollPosition(offsetX, offsetY);
          var scroll = this._getScrollPosition();
          this._triggerScrollEvent('scroll', scroll);
          this._triggerScrollEvent('scrollend', scroll);
        }, this, time);
      }
      else {
//        s.position.X = offsetX;
//        s.position.Y = offsetY;
        this._updateScrollPosition(offsetX, offsetY);
        if (!s.endTouch)
          this._snapToBounds();
      }
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: 'all {0}ms {1}'.format(time, time == 0 ? '' : ease || beziers.fling),
        transform: 'translate3d({0}px, {1}px, 0px)'.format(offsetX, offsetY)
      });      

      this._triggerScrollEvent('scroll');
    },

    _getScrollPosition: function() {
      var pos = this._scrollerProps.position;
      return { 
        scrollLeft: -pos.X, 
        scrollTop: -pos.Y 
      };
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
    
    _snapToBounds: function(immediate) {
      // make sure the element is not outside the frame, and snap it back if it is
      var s = this._scrollerProps,
          pos = s.position,
          inBounds = this._limitToBounds(pos),
          time = immediate ? 0 : this._calcAnimationTime(calcDistance(pos, inBounds));
      
      if (!_.isEqual(pos, inBounds)) {
//        console.log('snapping from:', pos, 'to:', inBounds);
        s.snapping = true;
//        this._resetScroll()
        this._clearTouchHistory();
        this._scrollTo(inBounds.X, inBounds.Y, time, beziers.bounce);
        this._scheduleResetScroll(time, inBounds.X, inBounds.Y);
      }
    },
    
    _scheduleResetScroll: function(time, x, y) {
      this._queueScrollTimeout(function() {
        this._resetScroll(x, y);
      }, this, time);
    },
    
    _calcAnimationTime: function(distance) {
      return Math.min(calcAnimationTime(distance), this._scrollerProps.MAX_COAST_TIME);
    },

    _scheduleDeceleration: function(from, to, time) {
      var s = this._scrollerProps;
      this._queueScrollTimeout(function() {
        s.coasting = false;
        s.decelerating = true;
        s.position = from;
        this._scrollTo(to.X, to.Y, s.BOUNCE_OUT_TIME, beziers.bounceDeceleration);
      }, this, time);
    },

    /**
     * if x or y is out of bounds, schedule a bounce back after "time" millis pass
     */
    _scheduleBounceBack: function(from, to, time) {
      var s = this._scrollerProps;
      this._queueScrollTimeoutTimeout(function() {
        s.position = from;
        this._scrollTo(to.X, to.Y, s.BOUNCE_BACK_TIME, beziers.bounce);
      }, this, time);
    },
    
    _isDragging: function() {
      return this._scrollerProps.dragging;
    },

    _shouldStartMomentum: function() {
      var s = this._scrollerProps;
      this._getEndVelocity();
      if (this._isOutOfBounds(s.position, false, true)) {
        var axis = this._getScrollAxis(),
            offset = s.position[axis],
            tooBig = offset > s.scrollMax[axis];
          
        return (tooBig && s.velocity < 0) || (!tooBig && s.velocity > 0);
      }
      
      return Math.abs(s.velocity) > 0.5;
    },

    _isDecelerating: function() {
      return this._scrollerProps.decelerating;
    },

    _isCoasting: function() {
      return this._scrollerProps.coasting;
    },

    _isSnapping: function() {
      return this._scrollerProps.snapping;
    },
    
    _isScrollerIdle: function() {
      var s = this._scrollerProps;
      return !s.coasting && !s.decelerating && !s.snapping;
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
//      console.log('flinging');
      this._clearTouchHistory();
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

      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      var destination = this._limitToBounds(newPos),
          pastDestination = this._limitToBounds(newPos, true),
          timeToDestination = this._calcAnimationTime(distance),
          timeToReset;
      
//      if (timeToDestination > s.MAX_COAST_TIME) {
//        distance = calcDistance(s.MAX_COAST_TIME);
//      }
      
      timeToReset = timeToDestination;
//      newPos = this._limitToBounds(newPos);
//      var time = this._calcAnimationTime(distance); //parseInt(Math.min(-velocity / acceleration, s.MAX_MOMENTUM_TIME), 10);
//      this._scrollTo(pastDestination.X, pastDestination.Y, timeToDestination, beziers.fling);
      this._scrollTo(destination.X, destination.Y, timeToDestination, beziers.fling);
//      if (!_.isEqual(destination, pastDestination)) {
//        timeToReset += s.BOUNCE_OUT_TIME + s.BOUNCE_BACK_TIME;
//        this._scheduleDeceleration(destination, pastDestination, timeToDestination);
//        this._scheduleBounceBack(pastDestination, destination, timeToReset);
//      }
      
      var period = s.SCROLL_EVENT_PERIOD,
          numScrollEvents = timeToReset / period,
          distanceUnit = (destination[axis] - s.position[axis]) / numScrollEvents, 
          pingPos = _.clone(s.position),
          scrollTime = 0;
      
      for (var i = 0; i < numScrollEvents; i++) {
        this._queueScrollTimeout(function() {
          pingPos = _.clone(pingPos);
          pingPos[axis] += distanceUnit;
          this._triggerScrollEvent('scroll', pingPos);
        }, this, scrollTime += period);
      }
      
      this._scheduleResetScroll(timeToDestination, destination.X, destination.Y);
      s.coasting = true;
    },
    
    _stopMomentum: function(e) {
      var s = this._scrollerProps;
      if (!this._isScrollerIdle()) {
        console.log('stopping momentum at:', s.position.x, s.position.y);
        this._updateScrollPosition();
        this._scrollTo(s.position.X, s.position.Y);
        this._resetScroll();
      }
      else
        console.log("not stopping momentum, nothing to stop");
      
      this._updateTouchHistory(e, e.targetTouches[0]);
    } 
  }
  
  return Scrollable;
});