define('physicsBridge', ['globals', 'underscore', 'FrameWatch', 'lib/fastdom', 'hammer', 'domUtils', 'utils', 'events'], function(G, _, FrameWatch, Q, Hammer, DOM, U, Events) {
  var worker,
      jsBase = G.serverName + '/js/',
      physicsModuleInfo = G.files['lib/physicsjs-custom.js'],
      masonryModuleInfo = G.files['lib/jquery.masonry.js'],
      commonMethods = ['step', 'addBody', 'removeBody', 'distanceConstraint', 'drag', 'dragend', 'benchBodies', 'unbenchBodies', 'style', 'animateStyle', 'track', 'trackDrag', 'page'],
      layoutMethods = ['addBricks', 'setLimit', 'unsetLimit', 'sleep', 'wake', 'continue', 'home', 'end', 'resize', 'setBounds', 'lock', 'unlock', 'isLocked', 'destroy', 'reset', 'page', 'snapTo', 'snapBy'],
      LOCK_STEP = false, // if true, step the world through postMessage, if false let the world run its own clock
      PHYSICS_TIME = _.now(), // from here on in,
      NOW = PHYSICS_TIME,     // these diverge
      UNRENDERED = {},
//      UNRENDERED,
      hammerOptions = {},
      hammer = new Hammer(document.body, hammerOptions),
      Physics,
      HERE,
      THERE,
      MouseWheelHandler,
      MOUSE_WHEEL_TIMEOUT,
      KeyHandler,
      MAX_DRAG_VECTOR = 200,
      PAGE_VECTOR_MAG = 80,
      ARROW_KEY_VECTOR_MAG = 40,
      WHEEL_VECTOR_MAG = 7,
      ID_TO_LAYOUT_MANAGER = {},
      ID_TO_EL = {},
      ID_TO_LAST_TRANSFORM = {},
//      ID_TO_LAST_TRANSITION = {},
      ZERO_TRANSLATION = [0, 0, 0],
      DEFAULT_SCALE = [1, 1, 1],
      MIN_SCALE = [0.0001, 0.0001, 1],
      ZERO_ROTATION = [0, 0, 0],
      IDENTITY_TRANSFORM = [1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            0, 0, 0, 1];
  
      zeroVector = [0, 0, 0],
      numDraggables = 0,
      DRAGGABLES = {}, // id to DragProxy
      DRAG_ENABLED = true,
      bounds = [0, 0, 0, 0],
      renderListeners = {
        render: {},
        translate: {
          '': {},
          x: {},
          y: {},
          z: {}
        },
        rotate: {
          '': {},
          x: {},
          y: {},
          z: {}
        },
        scale: {
          '': {},
          x: {},
          y: {},
          z: {}
        }
      },
      callbacks = {},
      subscriptions = {},
      TRANSFORM_PROPS = ['rotate', 'translate', 'scale', 'skew', 'transform'],
      isMoz = G.browser.firefox,
      TRANSFORM_PROP = DOM.prefix('transform'),
      TRANSFORM_ORIGIN_PROP = DOM.prefix('transform-origin'),
      TRANSITION_PROP = DOM.prefix('transition'),
      SCROLLER_TYPES = ['verticalMain', 'horizontal'],
      CONSTANTS = {
        worldConfig: {
          timestep: 1000 / 60
        },
        byScrollerType: {},
        maxOpacity: DOM.maxOpacity,
        degree: 1,
//        drag: G.browser.mobile ? 0.05 : 0.1,
        drag: 0.1,
        tilt: 0.4,
        groupMemberConstraintStiffness: 0.3,
        springDamping: 0.1,
        springStiffness: 0.1 // stiff bounce: 0.1, // mid bounce: 0.005, // loosy goosy: 0.001,
      },
//      SCROLLER_CONSTANTS = {
//        degree: 1,
//        drag: 0.1,
//        groupMemberConstraintStiffness: 0.3,
//        springDamping: 0.1,
//        springStiffness: 0.1 // stiff bounce: 0.1, // mid bounce: 0.005, // loosy goosy: 0.001,
//      },
      DRAG_LOCK = null,
      MOUSE_OUTED = false,
      FORCE_GPU = true,
      STYLE_ORDER = ['transform', 'opacity', 'z-index', 'width', 'height'],
      FIX = {
        transform: true // issue toFixed on float
      },
      PREFIX = {
        transform: 'matrix3d('
      },
      SUFFIX = {          
        transform: ')'        
      },
      SEPARATOR = {
        transform: ', '
      },
//      UNITS_MAP = {
//        px: 0,
//        em: 1,
//        '%': 2
//      },
//      UNITS = ['px', 'em', '%'],
      UNITS = {
        width: 'px',
        height: 'px'
      },
      NEED_UNITS = ['width', 'height'],
      STYLE_NUM_VALUES = {
        transform: 16
      },
      STYLE_INFO = {
        order: STYLE_ORDER,
//        units: UNITS_MAP,
        needUnits: NEED_UNITS,
//        prefix: PREFIX,
//        suffix: SUFFIX,
//        units: UNITS,
//        separator: SEPARATOR,
        values: STYLE_NUM_VALUES
      };
      
//      ,
//      STYLE_MAP = ['opacity', 'translation', 'rotation'];

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("Physics Bridge");
    G.log.apply(G, args);
//    console.log.apply(console, arguments);
  };

  function isPageKey(keyCode) {
    return keyCode == 33 || keyCode == 34;
  }
  
  function adjustForScreen(dragMag) {
    var v = G.viewport;
    if (v.height < 640)
      dragMag /= 2;
    
    return dragMag;    
  };
  
  function getPageDragMag() {
    return adjustForScreen(PAGE_VECTOR_MAG);
  };
  
  function getArrowDragMag() {
    return adjustForScreen(ARROW_KEY_VECTOR_MAG);
  };

  function getWheelDragMag() {
    return adjustForScreen(WHEEL_VECTOR_MAG);
  };

  function isDragAlongAxis(drag, axis) {
    switch (axis) {
    case null:
      return true;
    case 'x':
      return /left|right/.test(drag);
    case 'y':
      return /up|down/.test(drag);
    default:
      return false;
    }
  };

//  function getDragAlongAxis(vector, axis) {
//    switch (axis) {
//    case 'x':
//      vector[1] = vector[2] = 0;
//    case 'y':
//      vector[0] = vector[2] = 0;
//    default:
//      return drag;
//    }    
//  };

  // prevent click on capture phase
  document.$on('click', function(e) {
    if (!G.canClick()) {
      log('events', 'PREVENTING CLICK', _.now());
      e.preventDefault();
      e.stopPropagation();
//      e.stopImmediatePropagation();
      G.enableClick();
      return false;
    }
    else {
      if (G.support.pushState) {
        var t = e.target;
        if (!t.tagName != 'A')
          t = t.$closest('a');
        
        if (t) {
          e.preventDefault();
          if (!t.href.startsWith('javascript:'))
            Events.trigger('navigate', t.href);
        }
      }
      
      log('events', 'ALLOWING CLICK', _.now());
    }
  }, true);

  document.$on('click', function(e) {
    if (e.defaultPrevented)
      return;
    
    var a = e.target,
        tagName = a.tagName,
        href = a.$attr('href'),
        dataHref = a.$data('href');
    
    if (href == '#' && dataHref) {
      Events.stopEvent(e);
      Events.trigger('navigate', dataHref);
      return;
    }
    
    if (tagName == 'A') {
      if (href == '#') {
        Events.stopEvent(e);
        return;
      }
      else if (href && U.isExternalUrl(href)) {
        return;
      }
      else {
        debugger;
        return;
      }
    }
  }, false);

//  // re-enable click on bubble phase
//  document.addEventListener('click', enableClick);

  window.onscroll = function(e) {
//    debugger;
    console.log("NATIVE SCROLL: " + window.pageXOffset + ", " + window.pageYOffset);
    if (window.pageYOffset != 1 || window.pageXOffset) {
      e.preventDefault();
      window.scrollTo(0, 1);
    }
  };
  
//  window.scrollTo(0, 1);
  
  hammer.on('touchstart', function(e) {
    G.enableClick();
  });
  
//  hammer.on('tap', disableClick);
  
  function backupDragHandler(e) {
    G.disableClick();
    var draggable,
        rejects,
        twiceRejects,
        i;
    
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn() && isDragAlongAxis(e.type, draggable.axis)) {
        if (draggable.getElement().contains(e.target)) {
          if (draggable._ondrag.apply(draggable, arguments) !== false)
            return;
        }
        else {
          if (!rejects)
            rejects = [];
          
          rejects.push(draggable);
        }
      }
    }

    // get desperate
    i = rejects ? rejects.length : 0;
    while (i--) {
      draggable = rejects[i];
      if (e.target.contains(draggable.getElement())) {
        if (draggable._ondrag.apply(draggable, arguments) !== false)
          return;
      }      
      else {
        if (!twiceRejects)
          twiceRejects = [];
        
        twiceRejects.push(draggable);
      }
    }

    // get really desperate
    i = twiceRejects ? twiceRejects.length : 0;
    while (i--) {
      draggable = twiceRejects[i];
      if (draggable._ondrag.apply(draggable, arguments) !== false)
        return;
    }

    // oh well, we tried harder than they deserve
    e.preventDefault();
  };
  
  hammer.on('dragleft dragright dragup dragdown', backupDragHandler);
  hammer.on('dragend', function(e) {
    var draggable;
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn())
        draggable._ondragend.apply(draggable, arguments);
    }
    
    e.preventDefault();
  });

  hammer.on('hold', function(e) {
    e.preventDefault(); // prevent browser context menu on mac/mobile
  });

  function tickMonitor(lastFrameDuration) {      
    var keepTicking = false;
    if (numDraggables) {
      for (var id in DRAGGABLES) {
        keepTicking = DRAGGABLES[id].tick() || keepTicking;
      }
    }
    
    if (!keepTicking) {
      FrameWatch.stopListeningToTick(tickMonitor);
      return;
    }

    
//    if (LOCK_STEP) {
//      var newNow = _.now(),
//      delay = TIMESTEP > newNow - NOW;    
//      if (!delay) {
//        newNow = NOW;
//        PHYSICS_TIME += TIMESTEP;
//        THERE.step(PHYSICS_TIME);
//      }
//    }
  };
  
  function dragOnTick() {
    if (!FrameWatch.hasTickListener(tickMonitor))
      FrameWatch.listenToTick(tickMonitor);
  };
  
//  function enableClick() {
//    G.enableClick();
//  };

  function disableClick() {
    G.disableClick();
  };

  function isSVG(el) {
    return el.nearestViewportElement || el.tagName.toUpperCase() == 'SVG';
  };

  function isScrollable(el) {
//    if (isSVG(el))
//      return false;
    
    switch (el.tagName) {
      case 'TEXTAREA':
        return false;
      case 'INPUT':
        return el.getAttribute('type') == 'text';
      default:
        return true;
    }
  };

  function stopDragEvent(e) {
    e.gesture.preventDefault();
    e.gesture.stopPropagation();
    e.stopPropagation();
//    e.preventDefault();
  };
  
  function dragend(draggable, v, coast) {
    THERE.dragend(v, draggable.getId(), !coast);
  };
  
  function drag(draggable, v, doPage) {
    if (doPage && draggable.isPaged()) {
      getLayoutManagers(draggable.getId()).map(function(l) {
        l.page(v[1] > 0 ? -1 : 1);
      });
//      THERE.page({
//        body: draggable.getId(),
//        pages: v[1] > 0 ? -1 : 1
//      });
    }
    else
      THERE.drag(v, draggable.getId());
  }
  
  function getLayoutManagers(/* ids */) {
    var i = arguments.length,
        manager,
        managers = [];
        
    while (i--) {
      manager = ID_TO_LAYOUT_MANAGER[arguments[i]];
      if (manager)
        managers.push(manager);
    }
    
    return managers;
  };
  
  Events.on('pageDown', function() {
    simulateKeyPress(34);
  });

  Events.on('pageUp', function() {
    simulateKeyPress(33);
  });
  
  function simulateKeyPress(code) {
    KeyHandler._onKeyDown({
      keyCode: code
    });
    
    KeyHandler._onKeyUp({
      keyCode: code
    });
  };
  
  KeyHandler = {
    _keyHeld: null,
    _dragged: zeroVector.slice(),
    _coast: false,
    handleEvent: function(e) {
      if (!isScrollable(e.target))
        return;

      switch (e.target.tagName) {
        case 'TEXTAREA':
        case 'INPUT':
          return;
      }

      switch (e.type) {
      case 'keydown':
        return this._onKeyDown.call(this, e);
      case 'keyup':
        return this._onKeyUp.call(this, e);
      default: 
        debugger;
      }
    },
    
    getDragDirection: function(keyCode) {
      switch (keyCode) {
      case 33: // page up
        return 'up';
      case 34: // page down
        return 'down';
      case 35: // end
        return 'downright';
      case 36: // home
        return 'upleft';
      case 37: // left arrow
        return 'left';
      case 38: // up arrow
        return 'up';
      case 39: // right arrow
        return 'right';
      case 40: // down arrow
        return 'down';
      default:
        throw "key does not correspond to a direction";
      }
    },
    
    _onKeyDown: function(e) {
      if (!numDraggables)
        return;
      
      var keyCode = U.getKeyEventCode(e),
          vector = this._dragged,
          viewport = G.viewport,
//          axisIdx = 1, // generalize to X, Y
//          dimProp = axisIdx == 0 ? 'width' : 'height',
          dir,
          draggable,
          isPage = isPageKey(keyCode);
          
      if (this._keyHeld && this._keyHeld != keyCode)
        return;
      
      switch (keyCode) {
      case 33: // page up
        if (this._keyHeld)
          return;
      
        vector[0] = vector[1] = getPageDragMag();
        break;
      case 34: // page down
        if (this._keyHeld)
          return;
        
        vector[0] = vector[1] = -getPageDragMag();
        break;
      case 35: // end
        if (this._keyHeld)
          return;
        
        var managers = getLayoutManagers.apply(null, _.keys(DRAGGABLES)),
            i = managers.length;
        
        while (i--) {
          managers[i].end();
        }
        
        return; 
      case 36: // home
        if (this._keyHeld)
          return;
        
        var managers = getLayoutManagers.apply(null, _.keys(DRAGGABLES)),
            i = managers.length;
        
        while (i--) {
          managers[i].home();
        }
        
        return; 
      case 37: // left arrow
        this._coast = true;
        vector[0] = getArrowDragMag();
        break;
      case 38: // up arrow
        this._coast = true;
        vector[1] = getArrowDragMag();
        break;
      case 39: // right arrow
        this._coast = true;
        vector[0] = -getArrowDragMag();
        break;
      case 40: // down arrow
        this._coast = true;
        vector[1] = -getArrowDragMag();
        break;
      default:
        return;
      }        
      
      dir = this.getDragDirection(keyCode);
      this._keyHeld = keyCode;
      var endV = isPage ? mult(vector, 2) : mult(vector.slice(), 0.5);
      for (var id in DRAGGABLES) {
        draggable = DRAGGABLES[id];
        if (draggable.isOn() && isDragAlongAxis(dir, draggable.axis)) {
          drag(draggable, vector, isPage);
          dragend(draggable, endV, false); // smoother
        }
      }
    },
    
    _onKeyUp: function(e) {
      var keyCode = U.getKeyEventCode(e);
      if (this._keyHeld && keyCode == this._keyHeld) {
//        var isPage = isPageKey(keyCode);
//        var draggable,
//            dir = this.getDragDirection(keyCode);
//        
//        for (var id in DRAGGABLES) {
//          draggable = DRAGGABLES[id];
//          if (draggable.isOn() && isDragAlongAxis(dir, draggable.axis)) {
//            if (!isPage || !draggable.isPaged())
//              dragend(draggable, this._dragged, !this._coast);
//          }
//        }

        this._coast = false;
        this._keyHeld = null;
        var i = this._dragged.length;
        while (i--) {
          this._dragged[i] = 0;
        }
      }
    }
  };
  
  document.addEventListener('keydown', KeyHandler);
  document.addEventListener('keyup', KeyHandler)
  
  // from Sly.js
  var scrolling = {
    last: 0,
    delta: 0,
    resetTime: 200
  };
  
  function normalizeWheelDelta(event) {
    scrolling.curDelta = event.wheelDelta ? -event.wheelDelta / 120 : event.detail / 3;
    time = +new Date();
    if (scrolling.last < time - scrolling.resetTime) {
      scrolling.delta = 0;
    }
    
    scrolling.last = time;
    scrolling.delta += scrolling.curDelta;
    if (Math.abs(scrolling.delta) < 1) {
      scrolling.finalDelta = 0;
    } else {
      scrolling.finalDelta = Math.round(scrolling.delta / 1);
      scrolling.delta %= 1;
    }
    
    return scrolling.finalDelta;
  };
  
  MouseWheelHandler = {
    _vector: [0, 0, 0],
    handleEvent: function(e) {
      if (!isScrollable(e.target)) {
//        console.log("1. MOUSE WHEEL FAIL");
        return;
      }
      
      var target = e.target,
          draggable,
          el,
          dragEl,
          axis,
          coast,
          v,
          delta,
          args,
          rejects = [];
      
      for (var id in DRAGGABLES) {
        draggable = DRAGGABLES[id];
        el = draggable.getElement();
        if (el == e.target || el.contains(e.target)) {
          dragEl = el;
          break;
        }
      }
      
      if (!dragEl) {
        for (var id in DRAGGABLES) {
          draggable = DRAGGABLES[id];
          el = draggable.getElement();
          if (e.target.contains(el)) {
            dragEl = el;
            break;
          }
        }        
      }
      
      if (!dragEl) {
//        console.debug("2. MOUSE WHEEL FAIL", e.target);
        return;
      }
      
      axis = draggable.getAxis();
      v = MouseWheelHandler._vector;
      v[0] = v[1] = 0;
//      delta = getArrowDragMag() * Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
      delta = -absCeil(normalizeWheelDelta(e), 3);
      v[axis == 'x' ? 0 : 1] = 0.1 * getWheelDragMag() * delta;
      drag(draggable, v);
//      if (Math.abs(e.delta) < 1) {
//        console.log("ENDING DRAG", delta);
        dragend(draggable, mult(v, 10), false); // if true, will prevent coast
//      }
//      else
//        console.log("1. NOT ENDING DRAG");        
    }
  };

//  hammer.on("mousewheel", function(ev) { 
//    // create some hammerisch eventData
//    var self = this;
//    var eventType = MOUSE_WHEEL_TIMEOUT ? 'mousemove' : 'mousedown';
//    var touches   = Hammer.event.getTouchList(ev, eventType);
//    var eventData = Hammer.event.collectEventData(this, eventType, touches, ev);
////    ev.touches = touches;
////    _.extend(ev, eventData);
////    Hammer.detection.startDetect(hammer, ev);
////
////    // you should calculate the zooming over here, 
////    // should be something like wheelDelta * the current scale level, or something...
//////    eventData.scale = ev.wheelDelta;
////
//    // trigger drag event
//    if (eventType == 'mousemove') {
//      eventData.deltaX = 0;
//      eventData.deltaY = ev.wheelDelta;
//      hammer.trigger("drag", eventData);
//      if (ev.wheelDelta > 0)
//        hammer.trigger("dragdown", eventData);
//      else
//        hammer.trigger("dragup", eventData);
//    }
//      
//    if (!resetTimeout(MOUSE_WHEEL_TIMEOUT)) {
//      MOUSE_WHEEL_TIMEOUT = setTimeout(function() {
//        MOUSE_WHEEL_TIMEOUT = null;
//        eventData = Hammer.event.collectEventData(self, 'mouseup', touches, ev);
//        eventData.deltaX = 0;
//        eventData.deltaY = ev.wheelDelta;
//        hammer.trigger("dragend", eventData);
//      }, 100);
//    }
//
//    // prevent scrolling
//    ev.preventDefault();
//  });
  
  if (isMoz) {
    // Firefox
    document.addEventListener("DOMMouseScroll", MouseWheelHandler, true);
  }
  else {
    // IE9, Chrome, Safari, Opera
    document.addEventListener("mousewheel", MouseWheelHandler, true);
  }

  // VECTOR functions
  function isEqual(v1, v2) {
    return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2];
  };
  
  function zero(v) {
    v[0] = 0;
    v[1] = 0;
    v[2] = 0;
    return v;
  };
  
  function sub(v1, v2) {
    v1[0] -= v2[0];
    v1[1] -= v2[1];
    v1[2] -= v2[2];
    return v1;
  };

  function add(v1, v2) {
    v1[0] += v2[0];
    v1[1] += v2[1];
    v1[2] += v2[2];
    return v1;
  };

  function absCeil(n, ceil) {
    return (n < 0 ? -1 : 1) * Math.min(Math.abs(n), ceil);
  };
  
  function ceil(v, ceil) {
    for (var i = 0; i < v.length; i++) {
      var sign = v[i] < 0 ? -1 : 1,
          mag = Math.abs(v[i]);
      
      v[i] = sign * Math.min(mag, typeof ceil == 'object' ? ceil[i] : ceil);
    }

    return v;
  };

  function mult(v1, c) {
    v1[0] *= c;
    v1[1] *= c;
    v1[2] *= c;
    return v1;
  };
  
  // End VECTOR functions

  function calcBounds() {
    var viewport = G.viewport;
    bounds[0] = bounds[1] = 0;
    bounds[2] = bounds[0] + viewport.width;
    bounds[3] = bounds[1] + viewport.height;
  };

  function replaceCallbacks(args) {
    _.each(args, function(arg, idx) {
      if (typeof arg == 'function') {
        args[idx] = addCallback(arg);
      }
      else if (typeof arg == 'object') {
        replaceCallbacks(arg);
      }
    });
  };
  
  function addCallback(callback) {
    var cbId = _.uniqueId('physicsCallback');
    callbacks[cbId] = callback;
    return cbId;
  };

  function addSubscription(callback) {
    var cbId = _.uniqueId('physicsSubscription');
    subscriptions[cbId] = callback;
    return cbId;
  };

  function invokeListeners(listeners /* args */) {
    var len;
    if (listeners && (len = listeners.length)) {
      listeners = listeners.slice(); // avoid concurrent modification
      var args = _.tail(arguments);
      for (var i = 0; i < len; i++) {
        listeners[i].apply(null, args);
      }
    }
  };
  
//  function renderOld() {
//    THERE.rpc(null, 'render'); // signal readiness for next set of render data    
//    for (var id in UNRENDERED) {
//      renderBody(id, UNRENDERED[id]);
//    }
//    
//    invokeListeners(renderListeners.render['']);
//    UNRENDERED = {};
//  };
  
  function render() {
//    console.log("RENDERING");
    worker.postMessage({
      method: 'render'
    });
    
    var id,
        buffers = [];
    
    for (id in UNRENDERED) {
      renderBody(id, UNRENDERED[id], buffers);
    }

    invokeListeners(renderListeners.render['']);
    if (!G.browser.msie) {
      worker.postMessage({
        method: 'recycle',
        args: [UNRENDERED]
      }, buffers);
    }
  };
  
  function renderBody(id, style, buffers) {
    /* UNRENDERED: { // map of body id to css property values in order of STYLE_ORDER array, with as many values per property as specified by STYLE_NUM_VALUES 
    *   'ListPage.view12': []
    * } 
    */

    var el = ID_TO_EL[id],
        numVals,
        suffix,
        separator,
        unit,
        prop,
        prefixed,
        val,
        fix,
        remove,
        ignore,
        subVal,
        j;
        
    if (el) {
//      throw "no element found for id " + id;
      for (i = 0, l = style.length, propIdx = 0; i < l; propIdx++) { // i is incremented in inner loop
        j = 0;
        prop = STYLE_ORDER[propIdx];
        prefixed = DOM.prefix(prop);
        numVals = STYLE_NUM_VALUES[prop];
        unit = UNITS[prop];
        separator = SEPARATOR[prop];
        val = PREFIX[prop];
        remove = false;
        ignore = false;
        fix = FIX[prop];
        if (prop == 'transform') {
          fix = true;
          if (style[i] == MIN_SCALE[0]) {
            el.style[prefixed] = 'scale3d(0.0001, 0.0001, 1)';
            i += numVals;
            continue;
          }
        }
        
        for (j = 0; j < numVals; i++, j++) {
          if (j)
            val += separator;
      
          subVal = style[i];
          if ((ignore = subVal == Infinity) || 
              (remove = isNaN(subVal))) {
            i += numVals - j;
            break;
          }
          
          if (fix)
            subVal = subVal.toFixed(10);
          
          if (unit)
            subVal += unit;
          
          val += subVal;
        }
        
        if (remove)
          el.style.removeProperty(prefixed);
        else if (!ignore) {
          val += SUFFIX[prop];
          el.style[prefixed] = val;
        }
      }
      
      invokeListeners(renderListeners.render[id], el); //, oldTransform, transform);
    }
    
    buffers.push(style.buffer);
  };
  
//  function renderBodyOld(id, style) {
//    var el = ID_TO_EL[id],
//        propVal,
//        transform,
//        translate,
//        scale,
//        rotate,
//        oldTransition,
//        oldTranslate,
//        oldRotate,
//        oldScale,
//        transformStr,
//        listeners,
//        dtx, dty, dtz,
//        drx, dry, drz;
//
//    if (!el)
//      return false;
//    
//    oldTransform = ID_TO_LAST_TRANSFORM[id] || IDENTITY_TRANSFORM;
//    for (var prop in style) {
//      if (TRANSFORM_PROPS.indexOf(prop) == -1) {
//        propVal = style[prop];
//        if (propVal == null)
//          el.style.removeProperty(prop)
//        else
//          el.style[DOM.prefix(prop)] = propVal;
//      }
//    }
//    
//    transform = style.transform;
//    if (transform) {
//      if (FORCE_GPU)
//        el.style[TRANSFORM_PROP] = DOM.toMatrix3DString(transform);
//      else {
//        el.style.top = transform[13] + 'px';
//        el.style.left = transform[12] + 'px';
//      }
//        
////        oldTransition = ID_TO_LAST_TRANSITION[id] || '';
////        if (oldTransition)
////          el.style[TRANSITION_PROP] = ID_TO_LAST_TRANSITION[id] = '';
//      
//      invokeListeners(renderListeners.render[id], el, oldTransform, transform);
//    }
//      
////      if (!transform)
////        continue;
////
////      translate = transform.translate;
////      scale = transform.scale;
////      rotate = transform.rotate;
////      transformStr = null;
////      if (translate || scale) {
////        transformStr = '';
////        if (scale) {
////          if (!_.isEqual(scale, DEFAULT_SCALE)) {
////            transformStr = 'scale3d(' + scale[0] + ', ' + scale[1] + ', ' + scale[2] + ')';
////            if (_.isEqual(scale, MIN_SCALE)) 
////              translate = null;
////          }
////          
////          oldScale = oldTransform.scale || DEFAULT_SCALE;
////          dsx = scale[0] - oldScale[0];
////          dsy = scale[1] - oldScale[1];
////          dsz = scale[2] - oldScale[2];
////          invokeListeners(renderListeners.scale[''][id], el, dsx, dsy, dsz);
////          invokeListeners(renderListeners.scale.x[id], el, dsx);
////          invokeListeners(renderListeners.scale.y[id], el, dsy);
////          invokeListeners(renderListeners.scale.z[id], el, dsz);
////        }
////        else
////          scale = DEFAULT_SCALE;
////        
////        if (translate) {
////          transformStr = 'matrix3d(' + scale[0] + ', 0, 0, 0, 0, ' + scale[1] + ', 0, 0, 0, 0, ' + scale[2] + ', 0, ';
//////        transformStr = 'translate(';
////          transformStr += translate[0].toFixed(10) + ', ' + translate[1].toFixed(10) + ', ' + translate[2].toFixed(10) + ', 1)';
//////          transformStr += translate[0].toFixed(10) + 'px, ' + translate[1].toFixed(10) + 'px)';
////          oldTranslate = oldTransform.translate || ZERO_TRANSLATION;
////          dtx = translate[0] - oldTranslate[0];
////          dty = translate[1] - oldTranslate[1];
////          dtz = translate[2] - oldTranslate[2];
////          invokeListeners(renderListeners.translate[''][id], el, dtx, dty, dtz);
////          invokeListeners(renderListeners.translate.x[id], el, dtx);
////          invokeListeners(renderListeners.translate.y[id], el, dty);
////          invokeListeners(renderListeners.translate.z[id], el, dtz);
////        }          
////      }
////        
//////      else {
//////        transformStr += '0, 0, 0';
////////        transformStr += '0px, 0px)';
//////      }
//////      
////      
////      // ROTATION
////      if (rotate) {
////        // TODO: all axes, no need for now
////        transformStr = transformStr || '';
////        var unit = rotate.unit || 'deg';
////        if (rotate[0])
////          transformStr += ' rotateX(' + rotate[0].toFixed(10) + unit +')';
////        if (rotate[1])
////          transformStr += ' rotateY(' + rotate[1].toFixed(10) + unit +')';
////        if (rotate[2])
////          transformStr += ' rotateZ(' + rotate[2].toFixed(10) + unit +')';
////        
//////        if (rotate[2])
//////          transformStr += 'rotate(' + rotate[2].toFixed(10) + 'rad)'; // for now, only around Z axis
////        
////        oldRotate = oldTransform.rotate || ZERO_ROTATION;
//////        drx = rotate[0] - oldRotate[0];
//////        dry = rotate[1] - oldRotate[1];
////        drz = rotate[2] - oldRotate[2];
////        invokeListeners(renderListeners.rotate[''][id], el, drx, dry, drz);
//////        invokeListeners(renderListeners.rotate.z[id], drx);
//////        invokeListeners(renderListeners.rotate.y[id], dry);
////        invokeListeners(renderListeners.rotate.z[id], drz);
////      }
////      
////      if (transformStr != null) {
////        el.style[TRANSFORM_PROP] = transformStr;
////        el.style[TRANSITION_PROP] = '';
//////        el.style[TRANSFORM_ORIGIN_PROP] = '0% 0%';
//////        if (isMoz) {
//////          el.style.transform = transformStr;
//////          el.style.transition = '';
//////          el.style['transform-origin'] = '0% 0%';
//////        }
////        
////      }
////      
//////      el.style[TRANSFORM_PROP] = 'matrix3d(' + transform.join(',') + ')';
////      
////      invokeListeners(renderListeners.render[id], el, oldTransform, transform);
//
//    ID_TO_LAST_TRANSFORM[id] = transform;
////      if (!el.parentNode)  // nodes of known size or irrelevant size can be attached at first render instead of at some arbitrary view build time
////        groupEl.appendChild(el);
//  };

  function endAllDrags(currentDraggable) {
    for (var id in DRAGGABLES) {
      var draggable = DRAGGABLES[id];
      if (draggable.drag) {
        if (draggable != currentDraggable)
          log("DRAG CROSSED OVER FROM ONE DRAGGABLE ELEMENT TO ANOTHER");
          
        dragOnTick();
        draggable.drag = false;
        draggable.dragEnd = true; // queue up drag end
      }
    }
  };
  
  /**
   * currently only sends drag data once a frame (maybe it should send every time it gets a drag event)
   * TODO: make it work for nested draggables
   */
  function DragProxy(el, id, axis, paging) {
    this.element = el;
    this.id = id;
    this.paging = !!paging;
    this.axis = axis;
    if (axis)
      this.dragEventName = axis == 'x' ? 'dragleft dragright' : 'dragup dragdown';
    else
      this.dragEventName = 'drag';
    
    this.touchPos = zeroVector.slice();
    this.touchPosOld = zeroVector.slice();
    this.tmp = zeroVector.slice();
    this.dragVector = zeroVector.slice();
    this.lastDragVector = zeroVector.slice();
    this.offset = zeroVector.slice();
    
    this.drag = false;      
    this._ondrag = this._ondrag.bind(this);
    this._ondragend = this._ondragend.bind(this);
//    this.hammer = hammerOrElement instanceof Hammer.Instance ? hammerOrElement : new Hammer(hammerOrElement);
//    this.hammer = hammer;
    this.connect();
  };
    
  DragProxy.prototype = {
    _onmouseout: function(e) {
      if (this.drag) {// && this.hammer) {
        // check if the user swiped offscreen (in which case we can't detect 'mouseup' so we will simulate 'mouseup' NOW)
        MOUSE_OUTED = true;
        this.getElement().dispatchEvent(new MouseEvent('mouseup', {
          cancelable: true,
          bubbles: true
        }));
      }
    },

    _canHandle: function(e) {
      if (DRAG_ENABLED && (!DRAG_LOCK || DRAG_LOCK == this.id) && isScrollable(e.target)) {
//        if (isSVG(e.target) && this.axis == 'y' && Math.abs(e.gesture.deltaX) - Math.abs(e.gesture.deltaY) > 0) {
//          e.preventDefault();
//          e.stopPropagation();
//          e.stopImmediatePropagation();
//          return false;
//        }
        
        return true;
      }
    },
    
    _ondrag: function(e) {
      if (!this._canHandle(e))
        return false;
      
      G.disableClick();
      var gesture = e.gesture,
          center = gesture.center,
          touch = e.gesture.touches[0];
        
      stopDragEvent(e);
      dragOnTick();
      if (this.drag) {
        Array.copy(this.touchPos, this.touchPosOld);
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
      }
      else {
        this.drag = true;
        DRAG_LOCK = this.id; // lock this gesture
        
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
        Array.copy(this.touchPos, this.tmp);

        if (this.axis != 'y')
          this.tmp[0] -= adjustForScreen(gesture.deltaX / 2);
        if (this.axis != 'x')
          this.tmp[1] -= adjustForScreen(gesture.deltaY / 2);
        
        if (this.tmp[0] == this.tmp[1] && this.tmp[0] == 0)
          return false;
        
        Array.copy(this.tmp, this.touchPosOld);
      }
      
      Array.copy(this.touchPos, this.tmp);
      sub(this.tmp, this.touchPosOld);
      add(this.dragVector, this.tmp);
      ceil(this.dragVector, MAX_DRAG_VECTOR);
      Array.copy(this.dragVector, this.lastDragVector);
      return false;
//      add(this.dragVector, mult(this.tmp, 0.5)); // do we need this?
    },

    _ondragend: function(e) {
      if (!this._canHandle(e) || !this.drag)
        return false;

      stopDragEvent(e);
      DRAG_LOCK = null;
      endAllDrags(this);      
      return false;
    },

//    //  add(this.dragVector, mult(this.tmp, 0.5)); // do we need this? And if so, why??
//    _ondrag: function(e) {    
//      log("DRAG", this.dragVector[1]);
//      THERE.drag(this.dragVector, DRAGGABLES);
//      Array.copy(this.dragVector, this.lastDragVector);
//      zero(this.dragVector);
//    },
//    
//    _ondragend: function(e) {
//      e.gesture.preventDefault();
//      log("DRAGEND", this.lastDragVector[1]);
//      THERE.dragend(this.lastDragVector, DRAGGABLES);        
//      zero(this.lastDragVector);
//    },
//    
//    //_onswipe: function(e) {
//    //  this.log('swipe');
//    //},
//    

    connect: function() {
      if (!this._connected) {
        this._connected = true;
        var el = this.getElement();
        el.$on(this.dragEventName, this._ondrag);
        el.$on('dragend', this._ondragend);
      }
    },
    
    disconnect: function() {
      if (this._connected) {
        this._connected = false;
        var el = this.getElement();
        el.$off(this.dragEventName, this._ondrag);
        el.$off('dragend', this._ondragend);
      }
    },
    
    isOn: function() {
      return this._connected;
    },
    
    tick: function( data ) {
      if (!this.isOn() || (!this.drag && !this.dragEnd))
        return false;
            
      if (this.dragEnd) {
        this.dragEnd = false;
//        THERE.chain({
//            method: 'dragend',
//            args: [this.lastDragVector, this.id]
//          }, {
//            method: 'echo',
//            args: [enableClick] // async and faster than setTimeout
//          }
//        );

        dragend(this, this.lastDragVector);
        zero(this.lastDragVector);
        
//        Physics.echo(enableClick); // async and faster than setTimeout 
      }
      
      if (this.drag && !isEqual(this.dragVector, zeroVector)) {
//        log("DRAG, distance: (" + this.dragVector[0] + ", " + this.dragVector[1] + ")");
        drag(this, this.dragVector);
      }
      
      zero(this.dragVector);
      return true;
    },
    
    getElement: function() {
      return this.element;
    },
    
    getAxis: function() {
      return this.axis;
    },
    
    getId: function() {
      return this.id;
    },
    
    isPaged: function() {
      return this.paging;
    }
  };

  function getRenderListeners(event) {
    switch (event) {
      case 'translate':
      case 'rotate':
      case 'scale':
        return renderListeners[event][''];
      default:
        return _.leaf(renderListeners, event);
    }
  }
  
  Physics = window.Physics = {
    getRailId: function(bodyId) {
      return 'rail-' + bodyId;
    },
    getBoxId: function(bodyId) {
      return 'box-' + bodyId;
    },
    getRectVertices: function(width, height) {
      return [
        {x: 0, y: 0},
        {x: width, y: 0},
        {x: width, y: height},
        {x: 0, y: height}
      ];
    },
    updateRectVertices: function(vertices, width, height) {
      if (!vertices)
        return Physics.getRectVertices(width, height);
      
      var v0 = vertices[0],
          v1 = vertices[1],
          v2 = vertices[2],
          v3 = vertices[3];
      
      v0.x = v0.y = v1.y = v3.x = 0;
      v1.x = v2.x = width;
      v2.y = v3.y = height;
      return vertices;
    },
    isDragging: function() {
      return !!DRAG_LOCK;
    },
    constants: CONSTANTS,
    init: function() {
      if (!worker) {
        this.here.init();
        this.there.init();
      }
    },
    
    echo: function(callback) {
      THERE.rpc(null, 'echo', [addCallback(callback)]);
    },
    
//    addBody: function(id, type, options, el, hammer) {
//      if (el)
//        HERE.addBody(el, id);
//      if (hammer)
//        this.addDraggable(hammer || el, id);
//      
//      THERE.addBody(type, options, id);
//    },
    
    benchBodies: function(/* ids */) {
      THERE.benchBodies.apply(THERE, arguments);
    },

    unbenchBodies: function(/* ids */) {
      THERE.unbenchBodies.apply(THERE, arguments);
    },
    
    addDraggable: function(el, id, axis, paging) {
      var proxy = DRAGGABLES[id];
      if (proxy) {
        this.connectDraggable(id);
      }
      else {
        numDraggables++;
        proxy = DRAGGABLES[id] = new DragProxy(el, id, axis, paging);
      }
      
      return proxy;
    },
    
    connectDraggable: function(id) {
      var draggable = DRAGGABLES[id];
      if (draggable) {
        draggable.connect();
        return draggable;
      }
    },
    
    disconnectDraggable: function(id) {
      var draggable = DRAGGABLES[id];
      if (draggable) {
        draggable.disconnect();
        return draggable;
      }
      
//      DRAGGABLES = _.difference(DRAGGABLES, _.toArray(arguments));
    },

    removeDraggable: function(id) {
      this.disconnectDraggable(id);
      if (DRAGGABLES[id]) {
        delete DRAGGABLES[id];
        numDraggables--;
      }
//      DRAGGABLES = _.difference(DRAGGABLES, _.toArray(arguments));
    },

    disableDrag: function() {
      DRAG_ENABLED = false;
//      for (var id in DRAGGABLES) {
//        this.disconnectDraggable(id);
//      }
    },

    enableDrag: function() {
      DRAG_ENABLED = true;
//      for (var id in DRAGGABLES) {
//        this.disconnectDraggable(id);
//      }
    },
    
    here: {
      getTransform: function(id) {
        return ID_TO_LAST_TRANSFORM[id];
      },      
      on: function(event, id, callback) {
        if (arguments.length == 2) {
          callback = id;
          id = '';
        }
        
        var byEvent = getRenderListeners(event),
            cbs;
        
        if (!byEvent)
          throw "unsupported render event " + event;
        
        cbs = byEvent[id] = byEvent[id] || [];
        cbs.push(callback);
      },
      once: function(event, id, callback) {
        HERE.on(event, id, function proxy() {
          HERE.off(event, id, proxy);
          callback.apply(null, arguments);
        });
      },
      off: function(event, id, callback) {
        var byEvent = getRenderListeners(event),
            cbs;
        
        if (!byEvent) {
          for (var event in renderListeners) {
            renderListeners[event] = {};
          }
          
          return;
        }
        
        cbs = byEvent[id];
        if (callback)
          Array.remove(cbs, callback);
        else
          cbs.length = 0;
      },
      getViewportBounds: function() {
        return bounds;
      },
      getIds: function(els) {
        debugger;
      },
      init: function() {
        var i = STYLE_ORDER.length,
            styleProp,
            writeOptions = {
              throttle: true,
              last: true
            };
        
        while (i--) {
          styleProp = STYLE_ORDER[i];
          if (!_.has(UNITS, styleProp))
            UNITS[styleProp] = '';
          if (!_.has(STYLE_NUM_VALUES, styleProp))
            STYLE_NUM_VALUES[styleProp] = 1;
          if (!_.has(PREFIX, styleProp))
            PREFIX[styleProp] = '';
          if (!_.has(SUFFIX, styleProp))
            SUFFIX[styleProp] = '';
          if (!_.has(SEPARATOR, styleProp))
            SEPARATOR[styleProp] = ' ';
        }
        
//        var clone = _.deepExtend({}, Physics.constants);
//        for (var i = 0; i < SCROLLER_TYPES.length; i++) {
//          Physics.constants.byScrollerType[SCROLLER_TYPES[i]] = _.deepExtend({}, clone);
//        }        

//        hammer = new Hammer(document, hammerOptions);
//        DragProxy.init();
//        DragProxy.connect(hammer);
        document.addEventListener('mouseout', function(e) {
          e = e ? e : window.event;
          var from = e.fromElement || e.relatedTarget || e.toElement;
          if (!from || from.nodeName == "HTML") {
            log("MOUSEOUT, attempting to trigger drag end");
            for (var id in DRAGGABLES) {
              DRAGGABLES[id]._onmouseout();
              if (MOUSE_OUTED)
                break;
            }
            
            MOUSE_OUTED = false;
          }
        });
        
        worker = G.loadWorker('js/physicsWorker.js');        
        worker.onmessage = function(e) {
          var topic = e.data.topic,
              callback;
          
          switch (topic) {
            case 'render':
//              if (_.any(UNRENDERED, _.size))
//                debugger; // should never happen
                
              UNRENDERED = e.data.bodies;
              Q.write(render, this, null, writeOptions);
              
              break;
            case 'callback':
              callback = callbacks[e.data.id];
              if (callback)
                callback(e.data.data);
              
              delete callbacks[e.data.id];
              break;
            case 'event':
              callback = subscriptions[e.data.id];
              if (callback)
                callback(e.data.data);
              
              break;
            case 'log':
            case 'debug':
              console[topic].apply(console, e.data.args);
              break;
          }
        };
        
        worker.onerror = function(e) {
          debugger;
        };
      },
      
      addBody: function(el, id) {
        ID_TO_EL[id] = el;
      },

      removeBody: function(elOrId) {
        if (typeof elOrId == 'string')
          delete ID_TO_EL[elOrId];
        else {
          for (var id in ID_TO_EL) {
            if (ID_TO_EL[id] == el) {
              delete ID_TO_EL[id];
              return;
            }
          }
        }
      },
      
      removeBodies: function() {
        _(arguments).map(this.removeBody.bind(this));
      }
    },
    
    there: {
      init: function() {
        window.addEventListener('viewportdimensions', this.updateBounds.bind(this));
        this.postMessage({
          physicsJSUrl: jsBase + (physicsModuleInfo.fullName || physicsModuleInfo.name),
          masonryUrl: jsBase + (masonryModuleInfo.fullName || masonryModuleInfo.name),
          debug: G.DEBUG,
          stepSelf: !LOCK_STEP,
          constants: CONSTANTS,
          styleInfo: STYLE_INFO
        });
        
        this.updateBounds();
        this.rpc(null, 'render'); // signal readiness for next set of render data    
      },

      updateBounds: function() {
        calcBounds();
        var self = this,
            disconnected = [],
            chain = [{
              method: 'updateBounds',
              args: bounds
            }];
        /*
        // disconnect/reconnect draggables before/after resize handling
        _.each(DRAGGABLES, function(draggable, id) {
          if (draggable.isOn() && draggable.drag) { // currently dragging
            Physics.disconnectDraggable(id);
            disconnected.push(id);
            chain.push({
              method: 'dragend',
              args: [ZERO_VECTOR, id]
            });
          }          
        });
        
        if (disconnected.length > 1) {
          chain.push({
            method: 'echo',
            args: [function() {
              var i = disconnected.length;
              while (i--) {
                Physics.connectDraggable(disconnected[i]);
              }
            }]
          });
        };
        // end draggable hack
        */
        return THERE.chain.apply(THERE, chain);
      },
      
      postMessage: function() {
        worker.postMessage.apply(worker, arguments);
      },
      
      subscribe: function(objectName, event, callback) {
        var callbackId = _.uniqueId('physicsCallback');
        callbacks[callbackId] = callback;
        this.rpc(objectName, 'subscribe', [event, callbackId]);
        return callbackId;
      },

      unsubscribe: function(objectName, event, callbackId) {
        delete callbacks[callbackId];
        this.rpc(objectName, 'unsubscribe', [event, callbackId]);
      },

      chain: function() {
        var rpcs = arguments[0] instanceof Array ? arguments[0] : _.toArray(arguments),
            rpc;
        
        for (var i = 0, l = rpcs.length; i < l; i++) {
          rpc = rpcs[i];
          if (rpc.args)
            replaceCallbacks(rpc.args);
        }
        
        worker.postMessage({
          method: 'chain',
          args: rpcs
        });
      },
      
      rpc: function(objectName, method, args) {
        if (args)
          replaceCallbacks(args);
        
//        G.log("events", "RPC", method, (args ? args.join(",") : ''));
        worker.postMessage({
          object: objectName,
          method: method,
          args: args
        });
      },
      
      layout: {
        newLayout: function() {
          return LayoutManager.apply(null, arguments);
        }
      },
      
      set: function(type, constantName, value) {
        var constants;
//        if (type)
//          constants = Physics.constants.byScrollerType[type];
//        else
          constants = Physics.constants;
        
        constants[constantName] = value;
        return this.rpc(null, 'set', _.toArray(arguments));
      }
    }
  };
  
  function LayoutManager(options, callback) {
    if (!(this instanceof LayoutManager))
      return new LayoutManager(options, callback);
    
    ID_TO_LAYOUT_MANAGER[options.container] = this;
    this.id = _.uniqueId('layoutManager');
    this.containerId = options.container;
    THERE.rpc(null, 'layout.init', [this.id, options, addSubscription(callback)]);
  };
  
//  LayoutManager.prototype = {
//    resize: function() {
//      var self = this,
//          draggable = this.containerId && Physics.disconnectDraggable(this.containerId),
//          args = _.toArray(arguments),
//          chain = [{
//            object: this.id,
//            method: 'resize',
//            args: args
//          }];
//      
//      if (draggable) {
//        if (draggable.drag) { // currently dragging
//          chain.push({
//            method: 'dragend',
//            args: [ZERO_VECTOR, this.containerId]
//          });
//        }
//
//        chain.push({
//          method: 'echo',
//          args: [function() {
//            Physics.connectDraggable(self.containerId);
//          }]
//        });
//      }
//      
//      return THERE.chain.apply(THERE, chain);
//    }  
//  };
  
  HERE = Physics.here;
  THERE = Physics.there;
  
  commonMethods.forEach(function(method) {
    THERE[method] = function() {
      return this.rpc(null, method, _.toArray(arguments));
    };
  });
  
  layoutMethods.forEach(function(method) {
    LayoutManager.prototype[method] = function() {
      switch (method) {
      case 'continue':
      case 'addBricks':
        this.unlock();
        break;
      case 'lock':
        this._handlingRangeRequest = true;
        return;
      case 'unlock':
        this._handlingRangeRequest = false;
        return;
      case 'isLocked':
        return this._handlingRangeRequest;
      }
      
      return THERE.rpc(this.id, method, _.toArray(arguments));
    };
  });
  
  return Physics;
});