define('views/mixins/Scrollable', ['globals', 'underscore', 'utils', 'events', 'lib/animationQueue'], function(G, _, U, Events, Q) {

  window.s = []; 
  var FORCE_TOUCH = false,
      SCROLL_DISTANCE_THRESH = 25,
      SCROLL_TIME_THRESH = 1000,
      nonTouchEvents = ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup'],
      touchEvents = ['touchstart', 'touchend', 'touchmove'],
      AXES = ['X', 'Y'],
      IS_TOUCH = FORCE_TOUCH || G.browser.mobile,
      TOUCH_EVENTS = IS_TOUCH ? {
        touchstart: 'touchstart',
        touchend: 'touchend',
        touchmove: 'touchmove',
        touchcancel: 'touchcancel'
      } : {
        touchstart: 'mousedown',
        touchend: 'mouseup',
        touchmove: 'mousemove'
//          ,
//        touchcancel: 'touchcancel'
      },
      beziers = {
        fling: 'cubic-bezier(0.103, 0.389, 0.307, 0.966)', // cubic-bezier(0.33, 0.66, 0.66, 1)
        bounceDeceleration: 'cubic-bezier(0, 0.5, 0.5, 1)',
        bounce: 'cubic-bezier(0.7, 0, 0.9, 0.6)',
        easeIn: 'cubic-bezier(0.420, 0.000, 1.000, 1.000)'
      },
      
      // SCROLLER STATES
      UNINITIALIZED = 'uninitialized',
      INACTIVE = 'inactive',
      READY = 'ready',
      DRAGGING = 'dragging',
      COASTING = 'coasting',
      SNAPPING = 'snapping',
      // END SCROLLER STATES
      doc = document,
      CSS = U.CSS;

//  document.body.addEventListener('mousemove', function() {
//    debugger;
//    e.preventDefault();
//  }, false)

  doc.body.addEventListener('touchmove', function(e) {
    // This prevents native scrolling from happening.
    e.preventDefault();
  }, false);

  function scrollPosToOffset(pos) {
    return {
      scrollLeft: -pos.X,
      scrollTop: -pos.Y
    }
  }
  
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
  
  function normalizePosition(pos) {
    pos.X = parseInt(pos.X);
    pos.Y = parseInt(pos.Y);
    return pos;
  }

  function toTouchEvent(mouseEvent) {
    var touches = [{
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY
    }];
    
    return {
      target: mouseEvent.target,
      targetTouches: touches,
      changedTouches: touches,
      timeStamp: mouseEvent.timeStamp,
      preventDefault: mouseEvent.preventDefault.bind(mouseEvent),
      stopPropagation: mouseEvent.stopPropagation.bind(mouseEvent)
    }
  }
  
  function getGesture(touch1, touch2) {
    return {
      X: touch2.X - touch1.X,
      Y: touch2.Y - touch1.Y,
      distance: calcDistance(touch1, touch2),
      time: touch2.timeStamp - touch1.timeStamp
    }
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

  // START Sroller Finite State Machine. Each scroller state expects only certain events, and has functions to handle those events, and then return the new scroller state
  var TRANSITION_MAP = {
    uninitialized: {
      // Events to expect in 'uninitialized' state
      init: function(e) {
        if (this._scrollerProps.metrics || this._calculateSizes() !== false) {
//          this.el.addEventListener('click', this.);
//          doc.addEventListener('keydown', this, true);
//          doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
          this._scrollTo(this._scrollerProps.position);
          return this._transitionScrollerState(INACTIVE, 'wake');
        }
        else {
          this._queueScrollTimeout(function() {
            this._transitionScrollerState(UNINITIALIZED, 'init');
          }.bind(this), 100);
          
          return UNINITIALIZED;
        }
      }
    },
    
    inactive: {
      wake: function() {
        this._listenToTouchEvents('touchstart', 'keydown', 'click');
        return READY;
      }
    },
    
    ready: {
      // Events to expect in READY state
      mousedown: function(e) {
        switch (e.button) {
        case 0:
          return this._transitionScrollerState(READY, 'touchstart', toTouchEvent(e));
        default:
          return READY;
        }
      },
      
      keydown: function(e) {
        var s = this._scrollerProps,
            keyCode = s._keyHeld = U.getKeyEventCode(e),
            axis = this._getScrollAxis(),
            pos = s.position,
            newPos = _.clone(pos),
            bounds = s.scrollBounds[axis],
            maxJumpTime = 300,
            jump = keyCode >= 33 && keyCode <=36,
            ease,
            time,
            distance;

        this._resetScroller();        
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
          time = distance * 3;
          ease = beziers.easeIn;
          break;
        case 40: // down arrow
          distance = bounds.min - pos[axis];
          time = distance * 3; //calcAnimationTime(distance);
          ease = beziers.easeIn;
          break;
        case 35: // end
          distance = bounds.min - pos[axis];
          break;
        default:
          return s.state;
        }        
        
        newPos[axis] += distance;
        newPos = this._limitToBounds(normalizePosition(newPos));
        if (_.isEqual(newPos, pos))
          return READY;
              
        time = time || this._calcAnimationTime(pos, newPos);
        if (jump)
          time = Math.min(time, maxJumpTime);
        
        this._scrollTo(newPos, time, ease);
        this._scheduleScrollerStateTransition(COASTING, 'coastcomplete', {
          time: time,
          to: newPos
        }, time);
        
//        this._stopListeningToTouchEvents('keyup');
        this._listenToTouchEvents('keyup');
//        doc.removeEventListener('keyup', this, true); // just in case we left one hanging
//        doc.addEventListener('keyup', this, true);
        return COASTING;
      },
      
      touchstart: function(e) {
        // grab, subscribe to touchmove
        e.preventDefault();
        this._clearScrollTimeouts();
        this._clearTouchHistory();
        this._stopListeningToTouchEvents('touchend');
        this._listenToTouchEvents('touchend', 'touchmove');
//        doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
//        doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true); // just in case
//        doc.removeEventListener(TOUCH_EVENTS.touchend, this, true); // just in case
//        doc.addEventListener(TOUCH_EVENTS.touchmove, this, true);
//        doc.addEventListener(TOUCH_EVENTS.touchend, this, true);
        this._updateTouchHistory(e, e.targetTouches[0]);
        return DRAGGING;
      },
      
      sleep: function(e) {
        this._cleanupScroller();
        return INACTIVE;
      }
    },
    dragging: {
      // Events to expect in DRAGGING state
      mousemove: function(e) {
        return this._transitionScrollerState(DRAGGING, 'touchmove', toTouchEvent(e));
      },
      touchmove: function(e) {
        // scroll to new position
        e.preventDefault();
        var s = this._scrollerProps, 
            history = s.touchHistory,
            historyLength = history.length,
            lastTimeStamp, 
            scrollX,
            gesture,
            position,
            targetPosition;
        
        if (!historyLength || !e.targetTouches.length) { // || !this._isDragging())
          debugger; // should never happen
          return;
        }
        
  //      this.log('touchmove at: ' + e.targetTouches[0].clientY);
        lastTimeStamp = s._lastTouchMoveTime || Date.now();
        s._lastTouchMoveTime = Date.now();
        if (!historyLength)
          this._triggerScrollEvent('scrollstart');
          
        this._updateTouchHistory(e, e.targetTouches[0]);
        scrollX = this._getScrollAxis() == 'X';
        gesture = s.lastGesture;
        position = s.position;
        
        targetPosition = normalizePosition({ 
          X: scrollX ? s.position.X + gesture.X : s.position.X, 
          Y: !scrollX ? s.position.Y + gesture.Y : s.position.Y 
        });
  
        this._scrollTo(targetPosition); // immediate, duration 0
        return DRAGGING;
      },

      mouseup: function(e) {
        return this._transitionScrollerState(DRAGGING, 'touchend', toTouchEvent(e));
      },

      touchend: function(e) {
        // if fling
        if (!e.changedTouches.length) {
          debugger; // should never happen
          return;
        }
        
        e.preventDefault();
        var isInBounds = this._isInBounds(),
            s = this._scrollerProps;
        
        if (!isInBounds 
            || s.distanceTraveled > SCROLL_DISTANCE_THRESH 
            || (s.distanceTraveled > (SCROLL_DISTANCE_THRESH / 2) && s.timeTraveled > SCROLL_TIME_THRESH)) {          
          s.preventClick = true;
          e.preventDefault();
          e.stopPropagation();
//          this.log('trying to prevent click event');
        }
        else {
          // this was a click, not a swipe/scroll
//          this.log('this was a click, not a scroll, only traveled: ' + s.distanceTraveled + 'px');
          var touch = _.last(s.touchHistory);
//          $(document.elementFromPoint(touch.X, touch.Y)).click();
          this._resetScroller();
          $(e.target).click();
          return s.state;
        }

        if (this._flingScrollerIfNeeded()) {
          // fling scroll, schedule state change to bounce/snap/ready
          return COASTING;
        }
        else {
          // update position and reset scroll, unsubscribe from touchmove/touchend
          if (this._snapScrollerIfNeeded())
            return SNAPPING;
          
//          this._updateScrollPosition(); // parse it from CSS transform
          this._resetScroller();
          return READY;
        }
      },
      
      sleep: function(e) {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    },
    coasting: {
      // Events to expect in COASTING state
      mousedown: function(e) {
        return this._transitionScrollerState(COASTING, 'touchstart', toTouchEvent(e));
      },

      keydown: function(e) {
        var s = this._scrollerProps,
            keyCode = U.getKeyEventCode(e);
        
        if (s._keyHeld)
          return s.state;
        
        return this._transitionScrollerState(READY, 'keydown', e);
      },
      
      keyup: function(e) {
        var s = this._scrollerProps,
            keyCode = U.getKeyEventCode(e);
        
        if (keyCode == s._keyHeld) {
          this._resetScroller();
          return READY;
        }
        else {
          debugger;
          return s.state;
        }
              
//        switch (keyCode) {
//        case 33: // page up
//          this.log('keyEvent page up');
//          break;
//        case 34: // page down
//          this.log('keyEvent page down');
//          break;
//        case 38: // up arrow
//          this.log('keyEvent up arrow');
//          break;
//        case 40: // down arrow
//          this.log('keyEvent down arrow');
//          break;
//        }
      },


      touchstart: function(e) {
        // stop, calc new position, then call ready->touchstart handler and return whatever it returns
        this._clearScrollTimeouts();
        this._clearTouchHistory();
        this._updateScrollPosition(); // parse it from CSS transform
        var pos = this._getScrollPosition();
        this._scrollTo(pos);
        return this._transitionScrollerState(READY, 'touchstart', e);
      },
      
      coastcomplete: function(flingInfo) {
        this._updateScrollPosition(flingInfo.to);
        if (this._snapScrollerIfNeeded())
          return SNAPPING;
        
        this._resetScroller();
        return READY;
      },
      
      sleep: function(e) {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    },
    snapping: {
      // Events to expect in 'snapping' state
      mousedown: function(e) {
        return this._transitionScrollerState(SNAPPING, 'touchstart', toTouchEvent(e));
      },
      
      touchstart: function(e) {
//        var touch = e.targetTouches[0];
//        if (!isInBounds(U.cloneTouch(touch), this._scrollerProps.scrollBounds))
//          return SNAPPING; // keep on snapping if the user clicks out of bounds (nothing to click/drag there)
//        else {
          // same as when you get a touchstart during coasting
          return this._transitionScrollerState(COASTING, 'touchstart', e);
//        }
      },
      snapcomplete: function(e) {
        return this._transitionScrollerState(COASTING, 'coastcomplete', e);
      },
      
      sleep: function(e) {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    }
  }
  
  // END Sroller Finite State Machine. Each scroller state expects only certain events, and has functions to handle those events, and then return the new scroller state

  
  var initScrollerProps = {
    state: UNINITIALIZED,
    axis: 'Y',
    touchHistory: [],
    SCROLL_EVENT_TIME_PERIOD: 200,
    SCROLL_EVENT_DISTANCE_PERIOD: 200,
    MAX_COAST_TIME: 1500,
    MAX_VELOCITY: 5,
//    MIN_START_VELOCITY_: 0.25,
    MAX_OUT_OF_BOUNDS: 50,
    BOUNCE_OUT_TIME: 400,
    BOUNCE_BACK_TIME: 400,
    acceleration: 0.005,
    momentum: true,
    timeTraveled: 0,
    distanceTraveled: 0,
    timeouts: []
  };
  
  var Scrollable = Backbone.Mixin.extend({
    initialize: function(options) {
      _.bindAll(this, '_initScroller', '_resetScroller', '_snapScroller', '_flingScroller', '_scrollTo', '_calculateSizes', '_onSizeInvalidated', '_onClickInScroller', '_onScrollerActive', '_onScrollerInactive');
      this.onload(this._initScroller.bind(this));
    },
    
    _initScroller: function(options) {
      window.s.push(this);
      this._scrollerProps = _.deepExtend({}, initScrollerProps, options);
      var el = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = el.parentNode || doc.body;
      this._transitionScrollerState(UNINITIALIZED, 'init'); // simulate 'init' event in UNINITIALIZED state
    },
    
    events: {
//      'click': '_onClickInScroller',
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated',
      'pageshow': '_onScrollerActive',      
      'pagebeforehide': '_onScrollerInactive'
    },

//    globalEvents: {
//      'pageChange': '_onScrollerPageChanged'
//    },
    
    myEvents: {
      'invalidateSize': '_onSizeInvalidated'
//        ,
//      'active': '_onScrollerActive',
//      'inactive': '_onScrollerInactive'
    },
    
//    _onScrollerPageChanged: function(from, to) {
//      if (this == to)
//        this._updateScrollPosition();
//    },
    
    _onScrollerActive: function() {
      var s = this._scrollerProps;
      if (s && s.state == INACTIVE)
        this._transitionScrollerState(this._scrollerProps.state, 'wake');
    },

    _onScrollerInactive: function() {
      var s = this._scrollerProps;
      if (s && s.state !== UNINITIALIZED)
        this._transitionScrollerState(this._scrollerProps.state, 'sleep');
    },
    
//    _activateScroller: function() {
//      if (this.scrollerProps.state != INACTIVE)
//        return;
//      
//      this._transition
//    },
//
//    _deactivateScroller: function() {      
//      doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchend, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true);
//    },
//
//    _onSizeInvalidated: _.debounce(function(e) {
    _onSizeInvalidated: function(e) {
      if (!this.rendered || !this.isActive())
        return;
      
      if (this._lastPageEvent !== 'pageshow') {
        this.pageView.$el.one('pageshow', this._onSizeInvalidated);
        return;
      }
      
//      var timeout = e ? 0 : 100;
      this.log('invalidated size');
//      this._queueScrollTimeout(function() {        
        this.log('old size: ' + JSON.stringify(this.getScrollInfo()));
        this._calculateSizes();
        this.log('new size: ' + JSON.stringify(this.getScrollInfo()));
        if (!this._isInBounds())
          this._snapScroller(true);
//      }.bind(this), timeout);
    },
    
    _calculateSizes: function() {
      var s = this._scrollerProps,
          frame = s.frame,
//          scrollWidth = this.el.offsetWidth,
//          scrollHeight = this.el.offsetHeight,
//          visibleBounds = U.getVisibleBounds(this.el),
          scrollWidth = this.el.offsetWidth,
          scrollHeight = this.el.offsetHeight,
          containerWidth = frame.offsetWidth,
          containerHeight = frame.offsetHeight,
          scrollX = this._getScrollAxis() == 'X',
//          hadPosition = !!s.position,
          gutter = s.MAX_OUT_OF_BOUNDS;
      
      if (!scrollHeight || !containerHeight)
        return false;

//      if (hadPosition) {
//        debugger;
//      }
//      
//      if (s.metrics && s.metrics.content.height - scrollHeight > 200) // height suddenly decreased?
//        debugger;
      
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

    _transitionScrollerState: function(fromState, withEvent, event) {
//      this.log('state: ' + fromState + ', event: ' + withEvent);
      var handlers = TRANSITION_MAP[fromState],
          handler = handlers && handlers[withEvent];
      
      if (!handler)
        return;
      
//      try {
        return (this._scrollerProps.state = handler.call(this, event));
//      } catch(err) {
//        debugger;
//      } finally {
//        if (!this._scrollerProps.state)
//          debugger;
//        if (fromState !== this._scrollerProps.state)
//          this.log('scroller state changed from ' + fromState.toUpperCase() + ' to ' + this._scrollerProps.state.toUpperCase());
//      }
    },    

    _listenToTouchEvents: function() {
      this._stopListeningToTouchEvents.apply(this, arguments);
      var types = arguments,
          s = this._scrollerProps,
          listeners = s.touchListeners;
      
      if (typeof types == 'string')
        types = [types];

      if (!listeners) {
        listeners = s.touchListeners = {
          keydown: false,
          keyup: false,
          click: false,
          touchstart: false,
          touchmove: false,
          touchend: false
        };
      }
      
      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        type = TOUCH_EVENTS[type] || type;
        if (!listeners[type]) {
          listeners[type] = true;
          var listener = type == 'click' ? this.el : doc;
          listener.addEventListener(type, this, true);
        }
      }
    },

    _stopListeningToTouchEvents: function() {
      var types = arguments,
          listeners = this._scrollerProps.touchListeners;
      
      if (!listeners)
        return;
      
      if (!types.length)
        types = _.keys(listeners);
      
      if (typeof types == 'string')
        types = [types];
      
      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        type = TOUCH_EVENTS[type] || type;
        if (listeners[type]) {
          listeners[type] = false;
          var listener = type == 'click' ? this.el : doc;
          listener.removeEventListener(type, this, true);
        }
      }
    },

    _queueScrollTimeout: function(fn, time) {
      this._scrollerProps.timeouts.push(setTimeout(fn, time));
    },
    
    _resetScroller: function(wake) {
//      this.log('resetting scroll');
//      this._updateScrollPosition(); // parse it from CSS transform
      this._cleanupScroller();
      this._transitionScrollerState(INACTIVE, 'wake');
    },
    
    _cleanupScroller: function() {
      var s = this._scrollerProps;
      this._clearScrollTimeouts();
      this._clearTouchHistory();
      s.dragging = s.decelerating = s.coasting = s.touchendReceived = false;
      s.startTimestamp = s.lastTimestamp = 0;

      this._updateScrollPosition();
      
      Q.start(CSS.setStylePropertyValues, CSS, [this.el.style, {
        transition: null
      }]);
      
//      doc.removeEventListener('keydown', this, true);
//      doc.removeEventListener('keyup', this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchend, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
      this._stopListeningToTouchEvents();
    },
    
    _clearTouchHistory: function() {
      var s = this._scrollerProps;
      s.touchHistory.length = s.distanceTraveled = s.timeTraveled = 0;
    },
    
    _clearScrollTimeouts: function() {
      var timeouts = this._scrollerProps.timeouts;   
      for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
      }
      
      timeouts.length = 0;
    },

    _updateTouchHistory: function(e, touch) {
      var s = this._scrollerProps,
          history = s.touchHistory;
      
      history.push({
        X: touch.clientX,
        Y: touch.clientY,
        timeStamp: e.timeStamp
      });

      if (history.length > 1) {
        var g = s.lastGesture = this._getLastGesture();
        s.distanceTraveled += g.distance;
        s.timeTraveled += g.time;
        
        if (history.length > 30)
          history = history.slice(history.length - 10);
      }
    },
    
    _getLastGesture: function() {
      var history = this._scrollerProps.touchHistory,
          l = history.length;
      
      if (l > 1)
        return getGesture(history[l - 2], history[l - 1]);
      else
        return null;
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
        Q.start(function() {          
          this._scrollerProps.position = CSS.getTranslation(this.el);
        }, this);
      }
//      this.log('new scroll position: ' + JSON.stringify(this._scrollerProps.position));
    },
    
    _getScrollerState: function() {
      return this._scrollerProps.state;
    },
    
    handleEvent: function(e) {
      if (e.type == 'click')
        return this._onClickInScroller(e);
      
      var state = this._getScrollerState(),
          stateHandlers = TRANSITION_MAP[state],
          eventType = e.type;
      
      if (stateHandlers && stateHandlers[eventType])
        this._transitionScrollerState(state, eventType, e);
    },
    
    _onClickInScroller: function(e) {
//      this.log('in scroller onclick handler');
      var ok = !this._scrollerProps.preventClick;
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
        this._scrollerProps.preventClick = false;
      }
      
      return ok;
    },
    
    onTransitionEnd: function(e) {
//      CSS.setStylePropertyValues(this.el.style, {
//        transition: null
//      });
//      this.log('event', 'transitionend event: ' + e.propertyName);
    },
    
    _triggerScrollEvent: function(type, scroll) {
      this.log('SCROLL: ' + type, Date.now());
      this.$el.trigger(type.replace('scroll', 'scrollo'), this.getScrollInfo(scroll));
    },
    
    getScrollInfo: function(scroll) {
      scroll = scroll || this._getScrollOffset();
      return _.extend(_.deepExtend({}, _.pick(this._scrollerProps.metrics, 'container', 'content')), scroll);      
    },
    
    _scrollTo: function(position, time, ease) {
//      if (isNaN(position.Y) || position.X != 0)
//        debugger;
      
//      this.log('scrolling to: ' + JSON.stringify(position) + ', in ' + time + 'ms');
      time = time || 0;
      var s = this._scrollerProps,
          bounce = s.bounce;
      
      if (!time)
        this._updateScrollPosition(position);
//      else
//        this._queueScrollTimeout(this._updateScrollPosition.bind(this, offsetX, offsetY), time);
      
      Q.start(function() {        
        CSS.setStylePropertyValues(this.el.style, {
          transition: 'all {0}ms {1}'.format(time, time == 0 ? '' : ease || beziers.fling),
          transform: 'matrix(1, 0, 0, 1, {0}, {1})'.format(position.X, position.Y)
        });
        
        this._triggerScrollEvent('scroll');
      }, this);
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
    
    _snapScrollerIfNeeded: function() {
      if (this._isInBounds())
        return;
      
//      doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
      this._listenToTouchEvents('touchstart');
      this._snapScroller();
      return true;
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
      var s = this._scrollerProps,
          snapTo = _.clone(s.position),
          time;
      
      snapTo[axis] = s.scrollBounds[axis][endpoint];
      time = immediate ? 0 : this._calcAnimationTime(s.position, snapTo);    
      this._scrollTo(snapTo, time, beziers.bounce, time);
      this._scheduleScrollerStateTransition(SNAPPING, 'snapcomplete', {
        time: time,
        to: snapTo
      }, time);
    },
    
    _scheduleScrollerStateTransition: function(fromState, eventName, eventData, time) {
      this._queueScrollTimeout(this._transitionScrollerState.bind(this, fromState, eventName, eventData), time);
    },

    _calcAnimationTime: function(distance) {
      if (arguments.length == 2) {
        var axis = this._getScrollAxis();
        distance = Math.abs(arguments[0][axis] - arguments[1][axis]);
      }
      
      return Math.min(calcAnimationTime(distance), this._scrollerProps.MAX_COAST_TIME);
    },

    _getScrollAxis: function() {
      return this._scrollerProps.axis;
    },
    
    _setScrollAxis: function(axis) {
      this._scrollerProps.axis = axis;      
    },

    _updateEndVelocity: function(direction) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          lastGesture = s.lastGesture,
          velocity = lastGesture[axis] / lastGesture.time;
      
      return (s.velocity = velocity > 0 ? Math.min(velocity, s.MAX_VELOCITY) : Math.max(velocity, -s.MAX_VELOCITY));
    },

    _flingScrollerIfNeeded: function() {
      var s = this._scrollerProps;
      this._updateEndVelocity();
      if (!this._isInBounds(s.position, false /* don't include bounce gutter */, true /* border counts as out */)) { 
        var axis = this._getScrollAxis(),
            offset = s.position[axis],
            tooBig = offset > s.scrollBounds[axis].max;
          
        if ((tooBig && s.velocity < 0) || (!tooBig && s.velocity > 0)) {
          this._flingScroller();
          return true;
        }
      }
      else if (Math.abs(s.velocity) > 0.5) {
        this._flingScroller();
        return true;
      }
    },
    
    _flingScroller: function() {
      this._clearScrollTimeouts();
//      doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
      this._listenToTouchEvents('touchstart');
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          otherAxis = oppositeDir(axis),
          velocity = s.velocity,
          acceleration = velocity < 0 ? s.acceleration : -s.acceleration,
          distance = - (velocity * velocity) / (2 * acceleration),
          newPos = {},
          destination,
          pastDestination,
          timeToDestination,
          timeToReset;

      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      destination = this._limitToBounds(normalizePosition(newPos));
//      pastDestination = this._limitToBounds(newPos, true);
      timeToDestination = timeToReset = this._calcAnimationTime(distance);    
      this._scrollTo(destination, timeToDestination, beziers.fling);      
      this._scheduleScrollerStateTransition(COASTING, 'coastcomplete', {
        to: destination,
        time: timeToDestination
      }, timeToDestination);
      
      
      // queue up events
      var numScrollEvents = Math.round(Math.max(timeToReset / s.SCROLL_EVENT_TIME_PERIOD, distance / s.SCROLL_EVENT_DISTANCE_PERIOD)),
          period = Math.round(timeToReset / numScrollEvents),
          distanceUnit = (destination[axis] - s.position[axis]) / numScrollEvents, 
          pingPos = _.clone(s.position),
          scrollTime = 0;
      
      for (var i = 0; i < numScrollEvents; i++) {
        this._queueScrollTimeout(function() {
          pingPos[axis] += distanceUnit;
          this._triggerScrollEvent('scroll', scrollPosToOffset(pingPos));
        }.bind(this), scrollTime += period);
      }      
    }
  }, {
    displayName: 'Scrollable'    
  });
  
  return Scrollable;
});