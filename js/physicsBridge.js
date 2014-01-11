define('physicsBridge', ['globals', 'underscore', 'FrameWatch', 'lib/fastdom', 'hammer', 'domUtils', 'utils', 'events'], function(G, _, FrameWatch, Q, Hammer, DOM, U, Events) {
  var worker,
      jsBase = G.serverName + '/js/',
      physicsModuleInfo = G.files['lib/physicsjs-custom.js'],
      masonryModuleInfo = G.files['lib/jquery.masonry.js'],
      commonMethods = ['step', 'addBody', 'removeBody', 'distanceConstraint', 'drag', 'dragend', 'benchBodies', 'unbenchBodies'],
      layoutMethods = ['addBricks', 'setLimit', 'unsetLimit', 'sleep', 'wake', 'continue', 'home', 'end', 'resize', 'setBounds', 'lock', 'unlock', 'isLocked', 'destroy', 'reset'],
      LOCK_STEP = false, // if true, step the world through postMessage, if false let the world run its own clock
      PHYSICS_TIME = _.now(), // from here on in,
      NOW = PHYSICS_TIME,     // these diverge
      UNRENDERED = {},
      hammerOptions = {},
      hammer = new Hammer(document, hammerOptions),
      Physics,
      HERE,
      THERE,
      KeyHandler,
      ARROW_KEY_VECTOR_MAG = 80,
      ID_TO_LAYOUT_MANAGER = {},
      ID_TO_EL = {},
      ID_TO_LAST_TRANSFORM = {},
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
      INPUT_TAGS = ['input', 'textarea'],
      TRANSFORM_PROPS = ['rotate', 'translate', 'scale'],
      TRANSFORM_PROP = DOM.prefix('transform', true),
      TRANSFORM_ORIGIN_PROP = DOM.prefix('transform-origin', true),
      TRANSITION_PROP = DOM.prefix('transition', true),
      SCROLLER_TYPES = ['verticalMain', 'horizontal'],
      CONSTANTS = {
        worldConfig: {
          timestep: 1000 / 60
        },
        byScrollerType: {},
        maxOpacity: 0.999999,
        degree: 1,
        drag: 0.1,
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
      TICKING = false,
      isMoz = G.browser.firefox;
//      ,
//      STYLE_ORDER = ['opacity', 'translation', 'rotation'];

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("Physics Bridge");
    G.log.apply(G, args);
//    console.log.apply(console, arguments);
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
    else
      log('events', 'ALLOWING CLICK', _.now());
  }, true);

//  // re-enable click on bubble phase
//  document.addEventListener('click', enableClick);

  window.onscroll = function(e) {
    console.log("NATIVE SCROLL: " + window.pageXOffset + ", " + window.pageYOffset);
    if (window.pageYOffset != 1 || window.pageXOffset)
      window.scrollTo(0, 1);
  };
  
  window.scrollTo(0, 1);
  
  hammer.on('touchstart', enableClick);
//  hammer.on('tap', disableClick);
  hammer.on('dragleft dragright dragup dragdown', function(e) {
    G.disableClick();
    var draggable,
        rejects,
        twiceRejects,
        i;
    
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn() && isDragAlongAxis(e.type, draggable.axis)) {
        if (draggable.hammer.element.contains(e.target)) {
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
      if (e.target.contains(draggable.hammer.element)) {
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
  });
  
  hammer.on('dragend', function() {
    var draggable;
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn())
        draggable._ondragend.apply(draggable, arguments);
    }
  });

  function dragOnTick() {
    if (TICKING)
      return;
    
    TICKING = true;
    FrameWatch.listenToTick(function tickMonitor(lastFrameDuration) {      
      var keepTicking = false;
      if (numDraggables) {
        for (var id in DRAGGABLES) {
          keepTicking = DRAGGABLES[id].tick() || keepTicking;
        }
      }
      
      if (!keepTicking) {
        FrameWatch.stopListeningToTick(tickMonitor);
        TICKING = false;
        return;
      }

      
//      if (LOCK_STEP) {
//        var newNow = _.now(),
//        delay = TIMESTEP > newNow - NOW;    
//        if (!delay) {
//          newNow = NOW;
//          PHYSICS_TIME += TIMESTEP;
//          THERE.step(PHYSICS_TIME);
//        }
//      }
    });
  };
  
  function enableClick() {
    G.enableClick();
  };

  function disableClick() {
    G.disableClick();
  };

  function isUserInputTag(tag) {
    return INPUT_TAGS.indexOf(tag.toLowerCase()) != -1;
  };

  function stopDragEvent(e) {
    e.gesture.preventDefault();
    e.gesture.stopPropagation();
    e.stopPropagation();
//    e.preventDefault();
  };
  
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
  
  KeyHandler = {
    _keyHeld: null,
    _dragged: zeroVector.slice(),
    _coast: false,
    handleEvent: function(e) {
      if (isUserInputTag(e.target.tagName))
        return;

//      log(e.type.toUpperCase(), U.getKeyEventCode(e));

      switch (e.type) {
      case 'keydown':
        return this._onKeyDown.call(this, e);
      case 'keyup':
        return this._onKeyUp.call(this, e);
      default: 
        debugger;
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
          draggable;
          
      if (this._keyHeld && this._keyHeld != keyCode)
        return;
      
      switch (keyCode) {
      case 33: // page up
        if (this._keyHeld)
          return;
        
        vector[0] = viewport.width;
        vector[1] = viewport.height;
        break;
      case 34: // page down
        if (this._keyHeld)
          return;
        
        vector[0] = -viewport.width;
        vector[1] = -viewport.height;
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
        vector[0] = ARROW_KEY_VECTOR_MAG;
        break;
      case 38: // up arrow
        this._coast = true;
        vector[1] = ARROW_KEY_VECTOR_MAG;
        break;
      case 39: // right arrow
        this._coast = true;
        vector[0] = -ARROW_KEY_VECTOR_MAG;
        break;
      case 40: // down arrow
        this._coast = true;
        vector[1] = -ARROW_KEY_VECTOR_MAG;
        break;
      default:
        return;
      }        
      
      this._keyHeld = keyCode;
      for (var id in DRAGGABLES) {
        draggable = DRAGGABLES[id];
        if (draggable.isOn())
          THERE.drag(this._dragged, id);
      }
    },
    
    _onKeyUp: function(e) {
      if (this._keyHeld && U.getKeyEventCode(e) == this._keyHeld) {
        var draggable;
        for (var id in DRAGGABLES) {
          draggable = DRAGGABLES[id];
          if (draggable.isOn())
            THERE.dragend(this._dragged, id, !this._coast);
        }

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
    var i = args.length,
        arg;
    
    while (i--) {
      arg = args[i];
      if (typeof arg == 'function') {
        args[i] = addCallback(arg);
      }
    }
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
  
  function render() {
    THERE.rpc(null, 'render'); // signal readiness for next set of render data    
    var el,
        style,
        styles = UNRENDERED,
        transform,
        translate,
        scale,
        rotate,
        oldTranslate,
        oldRotate,
        oldScale,
        transformStr,
        listeners,
        dtx, dty, dtz,
        drx, dry, drz;
    
    for (var id in styles) {
      el = ID_TO_EL[id];
      if (el) {
        oldTransform = ID_TO_LAST_TRANSFORM[id] || IDENTITY_TRANSFORM;
        style = styles[id];
        for (var prop in style) {
          if (TRANSFORM_PROPS.indexOf(prop) == -1) {
            el.style[DOM.prefix(prop, true)] = style[prop];
          }
        }
        
        transform = style.transform;
        if (!transform)
          continue;

        translate = transform.translate;
        scale = transform.scale;
        rotate = transform.rotate;
        transformStr = null;
        if (translate || scale) {
          transformStr = '';
          if (scale) {
            if (!_.isEqual(scale, DEFAULT_SCALE)) {
              transformStr = 'scale3d(' + scale[0] + ', ' + scale[1] + ', ' + scale[2] + ')';
              if (_.isEqual(scale, MIN_SCALE)) 
                translate = null;
            }
            
            oldScale = oldTransform.scale || DEFAULT_SCALE;
            dsx = scale[0] - oldScale[0];
            dsy = scale[1] - oldScale[1];
            dsz = scale[2] - oldScale[2];
            invokeListeners(renderListeners.scale[''][id], el, dsx, dsy, dsz);
            invokeListeners(renderListeners.scale.x[id], el, dsx);
            invokeListeners(renderListeners.scale.y[id], el, dsy);
            invokeListeners(renderListeners.scale.z[id], el, dsz);
          }
          else
            scale = DEFAULT_SCALE;
          
          if (translate) {
            transformStr = 'matrix3d(' + scale[0] + ', 0, 0, 0, 0, ' + scale[1] + ', 0, 0, 0, 0, ' + scale[2] + ', 0, ';
  //        transformStr = 'translate(';
            transformStr += translate[0].toFixed(10) + ', ' + translate[1].toFixed(10) + ', ' + translate[2].toFixed(10) + ', 1)';
  //          transformStr += translate[0].toFixed(10) + 'px, ' + translate[1].toFixed(10) + 'px)';
            oldTranslate = oldTransform.translate || ZERO_TRANSLATION;
            dtx = translate[0] - oldTranslate[0];
            dty = translate[1] - oldTranslate[1];
            dtz = translate[2] - oldTranslate[2];
            invokeListeners(renderListeners.translate[''][id], el, dtx, dty, dtz);
            invokeListeners(renderListeners.translate.x[id], el, dtx);
            invokeListeners(renderListeners.translate.y[id], el, dty);
            invokeListeners(renderListeners.translate.z[id], el, dtz);
          }          
        }
          
//        else {
//          transformStr += '0, 0, 0';
////          transformStr += '0px, 0px)';
//        }
//        
        
        // ROTATION
        if (rotate) {
          // TODO: all axes, no need for now
          transformStr = transformStr || '';
          var unit = rotate.unit || 'rad';
          if (rotate[0])
            transformStr += ' rotateX(' + rotate[0].toFixed(10) + unit +')';
          if (rotate[1])
            transformStr += ' rotateY(' + rotate[1].toFixed(10) + unit +')';
          if (rotate[2])
            transformStr += ' rotateZ(' + rotate[2].toFixed(10) + unit +')';
          
//          if (rotate[2])
//            transformStr += 'rotate(' + rotate[2].toFixed(10) + 'rad)'; // for now, only around Z axis
          
          oldRotate = oldTransform.rotate || ZERO_ROTATION;
//          drx = rotate[0] - oldRotate[0];
//          dry = rotate[1] - oldRotate[1];
          drz = rotate[2] - oldRotate[2];
          invokeListeners(renderListeners.rotate[''][id], el, drx, dry, drz);
//          invokeListeners(renderListeners.rotate.z[id], drx);
//          invokeListeners(renderListeners.rotate.y[id], dry);
          invokeListeners(renderListeners.rotate.z[id], drz);
        }
        
        if (transformStr != null) {
          el.style[TRANSFORM_PROP] = transformStr;
          el.style[TRANSITION_PROP] = '';
          el.style[TRANSFORM_ORIGIN_PROP] = '0%; 0%';
          if (isMoz) {
            el.style.transform = transformStr;
            el.style.transition = '';
            el.style['transform-origin'] = '0% 0%';
          }
          
        }
        
//        el.style[TRANSFORM_PROP] = 'matrix3d(' + transform.join(',') + ')';
        
        invokeListeners(renderListeners.render[id], el, oldTransform, transform);

        ID_TO_LAST_TRANSFORM[id] = transform;
//        if (!el.parentNode)  // nodes of known size or irrelevant size can be attached at first render instead of at some arbitrary view build time
//          groupEl.appendChild(el);
      }
    }
    
    invokeListeners(renderListeners.render['']);
    UNRENDERED = {};
  };

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
  function DragProxy(hammer, id, axis) {
    this.id = id;
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
    this.hammer = hammer;
    this.connect();
  };
    
  DragProxy.prototype = {
    _onmouseout: function(e) {
      if (this.drag && this.hammer) {
        // check if the user swiped offscreen (in which case we can't detect 'mouseup' so we will simulate 'mouseup' NOW)
        MOUSE_OUTED = true;
        this.hammer.element.dispatchEvent(new MouseEvent('mouseup', {
          cancelable: true,
          bubbles: true
        }));
      }
    },

    _canHandle: function(e) {
      if (DRAG_ENABLED && (!DRAG_LOCK || DRAG_LOCK == this.id)) // && !isUserInputTag(e.target.tagName))
        return true;
      
//      if (!isUserInputTag(e.target.tagName))
//        return true;
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
          this.tmp[0] -= gesture.deltaX / 2;
        if (this.axis != 'x')
          this.tmp[1] -= gesture.deltaY / 2;
        
        if (this.tmp[0] == this.tmp[1] && this.tmp[0] == 0)
          return false;
        
        Array.copy(this.tmp, this.touchPosOld);
      }
      
      Array.copy(this.touchPos, this.tmp);
      sub(this.tmp, this.touchPosOld);
      add(this.dragVector, this.tmp);
      Array.copy(this.dragVector, this.lastDragVector);
//      return false;
//      add(this.dragVector, mult(this.tmp, 0.5)); // do we need this?
    },

    _ondragend: function(e) {
      if (!this._canHandle(e))
        return false;

      stopDragEvent(e);
      DRAG_LOCK = null;
      endAllDrags(this);      
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
        this.hammer.on(this.dragEventName, this._ondrag);
        this.hammer.on('dragend', this._ondragend);
      }
    },
    
    disconnect: function() {
      if (this._connected) {
        this._connected = false;
        this.hammer.off(this.dragEventName, this._ondrag);
        this.hammer.off('dragend', this._ondragend);
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

        THERE.dragend(this.lastDragVector, this.id);
        zero(this.lastDragVector);
        
//        Physics.echo(enableClick); // async and faster than setTimeout 
      }
      
      if (this.drag && !isEqual(this.dragVector, zeroVector)) {
//        log("DRAG, distance: (" + this.dragVector[0] + ", " + this.dragVector[1] + ")");
        THERE.drag(this.dragVector, this.id);
      }
      
      zero(this.dragVector);
      return true;
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
  
  Physics = {
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
    
    addDraggable: function(hammer, id, axis) {
      var proxy = DRAGGABLES[id];
      if (proxy) {
        this.connectDraggable(id);
      }
      else {
        numDraggables++;
        proxy = DRAGGABLES[id] = new DragProxy(hammer, id, axis);
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
//              if (_.size(UNRENDERED))
//                debugger; // should never happen
                
              UNRENDERED = e.data.bodies;
              Q.write(render, this, null, {
                throttle: true,
                last: true
              });
              
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
          constants: CONSTANTS
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
        var rpcs = _.toArray(arguments),
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