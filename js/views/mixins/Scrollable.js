define('views/mixins/Scrollable', [
  'globals',
  'underscore',
  'utils'
], function(G, _) {
  
  function isTouchWithinBounds(touch1, touch2, bound) {
    if (!touch1 || !touch2)
      return false;

    bound = bound || 10;
    return Math.abs(touch1.pageX - touch2.pageX) < bound 
        && Math.abs(touch1.pageY - touch2.pageY);
  };

  return {
    events: {
      '.scrollable touchstart': 'highlightOnTouchStart',
      '.scrollable touchmove': 'unhighlightOnTouchMove',
      '.scrollable touchend': 'unhighlightOnTouchEnd'
    },
    
    initialize: function() {
      _.bindAll(this, 'highlightOnTouchStart', 'unhighlightOnTouchMove', 'unhighlightOnTouchEnd');
    },
    
    highlightOnTouchStart: function(e) {
      if (_.has(e, '_isScroll'))
        return;
      
      var touches = e.touches;
      if (_.isUndefined(touches))
        return;
      
      // Mobile safari doesn't let you copy touch objects, so copy it manually
      this._firstTouch = U.cloneTouch(touches[0]);
      this.touchStartTimer = setTimeout(_.partial(this.highlight.bind(this), e.target, e), 100);
    },

    unhighlightOnTouchMove: function(e) {
      if (_.has(e, '_isScroll'))
        return;
      
      if (_.isUndefined(this._firstTouch))
        return;
      
      var touches = e.touches;
      if (_.isUndefined(touches))
        return;
      
      // Mobile safari doesn't let you copy touch objects, so copy it manually
      var tMove = U.cloneTouch(touches[0]);
      
      // remove this class only if you're a certain distance away from the initial touch
      if (!isTouchWithinBounds(this._firstTouch, tMove)) {
        this.clearTouchStartTimer();
        this.unhighlight(e.target, e); // in case the first timer ran out and it got highlighted already?
      }
    },

    unhighlightOnTouchEnd: function(e) {
      if (_.has(e, '_isScroll'))
        return;
      
      // removing active class needs to be on timer because adding is also on a timer
      // if this is not done, sometimes the active class removal is called before...
      setTimeout(_.partial(this.unhighlight.bind(this), e.target, e), 100);
    },
    
    highlight: function(target, e) {
      e._isScroll = false;
//      throw "highlight needs to be implemented by all subclasses";
      $(target).trigger(e);
    },

    /**
     * Stub. Override this
     */
    unhighlight: function(target, e) {
      e._isScroll = true;
//      throw "unhighlight needs to be implemented by all subclasses";
      $(target).trigger(e);
    },

    clearTouchStartTimer: function() {
      clearTimeout(this.touchStartTimer);
      this.touchStartTimer = null;
    }
  }
});