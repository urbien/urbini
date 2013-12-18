define('physicsBridge', ['globals', 'underscore', 'FrameWatch', 'lib/fastdom', 'hammer', 'domUtils', 'utils'], function(G, _, FrameWatch, Q, Hammer, DOM, U) {
  var worker,
      physicsModuleInfo = G.files['lib/physicsjs-custom.js'],
      masonryModuleInfo = G.files['lib/jquery.masonry.js'],
      commonMethods = ['step', 'addBody', 'removeBody', 'distanceConstraint', 'drag', 'dragend', 'resize', 'benchBodies', 'unbenchBodies'],
      layoutMethods = ['addBricks', 'setLimit', 'sleep', 'wake', 'continue', 'resize', 'home', 'end', 'setBounds'],
      TIMESTEP = 1000/60,
      LOCK_STEP = false, // if true, step the world through postMessage, if false let the world run its own clock
      PHYSICS_TIME = _.now(), // from here on in,
      NOW = PHYSICS_TIME,     // these diverge
      UNRENDERED = {},
      tickerId,
      hammerOptions = {},
      hammer = new Hammer(document, hammerOptions),
      Physics,
      HERE,
      THERE,
      KeyHandler,
      ID_TO_LAYOUT_MANAGER = {},
      ID_TO_EL = {},
      ID_TO_LAST_TRANSFORM = {},
      ZERO_TRANSLATION = [0, 0, 0],
      ZERO_ROTATION = [0, 0, 0],
      IDENTITY_TRANSFORM = [1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            0, 0, 0, 1];
  
      zeroVector = [0, 0, 0],
      DRAGGABLES = {}, // id to DragProxy
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
        }  
      },
      callbacks = {},
      subscriptions = {},
      INPUT_TAGS = ['input', 'textarea'],
      TRANSFORM_PROP = DOM.prefix('transform'),
      TRANSITION_PROP = DOM.prefix('transition'),
      CONSTANTS = {
        drag: 0.1,
        groupMemberConstraintStiffness: 0.3,
        springDamping: 0.1,
        springStiffness: 0.1 // stiff bounce: 0.1, // mid bounce: 0.005, // loosy goosy: 0.001,
      },
      MOUSE_OUTED = false;


  function log() {
//    var args = [].slice.call(arguments);
//    args.unshift("Physics Bridge");
//    G.log.apply(G, args);
    console.log.apply(console, arguments);
  };
      
  hammer.on('drag', function() {
    var draggable;
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn())
        draggable._ondrag.apply(draggable, arguments);
    }
  });

  hammer.on('dragend', function() {
    var draggable;
    for (var id in DRAGGABLES) {
      draggable = DRAGGABLES[id];
      if (draggable.isOn())
        draggable._ondragend.apply(draggable, arguments);
    }
  });

  document.addEventListener('click', function(e) {
    try {
      if (!G.canClick()) {
        log('events', 'PREVENTING CLICK', _.now());
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      log('events', 'ALLOWING CLICK', _.now());
    } finally {
      enableClick();
    }
  }, true);

  function enableClick() {
    G.enableClick();
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
      if (!_.size(DRAGGABLES))
        return;
      
      var keyCode = U.getKeyEventCode(e),
          vector = this._dragged,
          viewport = G.viewport,
          axisIdx = 1, // generalize to X, Y
          dimProp = axisIdx == 0 ? 'width' : 'height',
          draggable;
          
      if (this._keyHeld && this._keyHeld != keyCode)
        return;
      
      switch (keyCode) {
      case 33: // page up
        if (this._keyHeld)
          return;
        
        vector[axisIdx] = viewport[dimProp];
        break;
      case 34: // page down
        if (this._keyHeld)
          return;
        
        vector[axisIdx] = -viewport[dimProp];
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
      case 38: // up arrow
        this._coast = true;
        vector[axisIdx] = 40;
        break;
      case 40: // down arrow
        this._coast = true;
        vector[axisIdx] = -40;
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
    bounds[2] = bounds[2] + viewport.width;
    bounds[3] = bounds[3] + viewport.height;
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
  
  function render(transforms) {
    var el,
        transform,
        translate,
        rotate,
        oldTranslate,
        oldRotate,
        transformStr,
        listeners,
        dtx, dty, dtz,
        drx, dry, drz;
    
    for (var id in transforms) {
      el = ID_TO_EL[id];
      if (el) {
        oldTransform = ID_TO_LAST_TRANSFORM[id] || IDENTITY_TRANSFORM;
        transform = transforms[id];
        transformStr = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ';
        if ((translate = transform.translate)) {
          transformStr += translate[0].toFixed(10) + ', ' + translate[1].toFixed(10) + ', ' + translate[2].toFixed(10);
          oldTranslate = oldTransform.translate || ZERO_TRANSLATION;
          dtx = translate[0] - oldTranslate[0];
          dty = translate[1] - oldTranslate[1];
          dtz = translate[2] - oldTranslate[2];
          invokeListeners(renderListeners.translate[''][id], el, dtx, dty, dtz);
          invokeListeners(renderListeners.translate.x[id], el, dtx);
          invokeListeners(renderListeners.translate.y[id], el, dty);
          invokeListeners(renderListeners.translate.z[id], el, dtz);
        }
        else
          transformStr += '0, 0, 0';
        
        transformStr += ', 1) ';
        if ((rotate = transform.rotate)) {
          // TODO: all axes, no need for now
//          transformStr += 'rotateX(' + rotate[0] + 'rad) ' + 'rotateY(' + rotate[1] + 'rad)' + 'rotateZ(' + rotate[2] + 'rad)';
          transformStr += 'rotate(' + rotate[2].toFixed(10) + 'rad)'; // for now, only around Z axis
          oldRotate = oldTransform.rotate || ZERO_ROTATION;
//          drx = rotate[0] - oldRotate[0];
//          dry = rotate[1] - oldRotate[1];
          drz = rotate[2] - oldRotate[2];
          invokeListeners(renderListeners.rotate[''][id], el, drx, dry, drz);
//          invokeListeners(renderListeners.rotate.z[id], drx);
//          invokeListeners(renderListeners.rotate.y[id], dry);
          invokeListeners(renderListeners.rotate.z[id], drz);
        }
        
//        el.style[TRANSFORM_PROP] = 'matrix3d(' + transform.join(',') + ')';
        el.style[TRANSFORM_PROP] = transformStr;
        el.style[TRANSITION_PROP] = '';
        
        invokeListeners(renderListeners.render[id], el, oldTransform, transform);

        ID_TO_LAST_TRANSFORM[id] = transform;
//        if (!el.parentNode)  // nodes of known size or irrelevant size can be attached at first render instead of at some arbitrary view build time
//          groupEl.appendChild(el);
      }
    }
    
    invokeListeners(renderListeners.render['']);
  };

  /**
   * currently only sends drag data once a frame (maybe it should send every time it gets a drag event)
   * TODO: make it work for nested draggables
   */
  function DragProxy(hammerOrElement, id) {
    this.id = id;
    this.touchPos = zeroVector.slice();
    this.touchPosOld = zeroVector.slice();
    this.tmp = zeroVector.slice();
    this.dragVector = zeroVector.slice();
    this.lastDragVector = zeroVector.slice();
    this.offset = zeroVector.slice();
    
    this.drag = false;      
    this._ondrag = this._ondrag.bind(this);
    this._ondragend = this._ondragend.bind(this);
    this.hammer = hammerOrElement instanceof Hammer.Instance ? hammerOrElement : new Hammer(hammerOrElement);
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

    _ondrag: function(e) {
      if (isUserInputTag(e.target.tagName))
        return;
      
      G.disableClick();
      var gesture = e.gesture,
          center = gesture.center,
          touch = e.gesture.touches[0];
        
      stopDragEvent(e);
      if (this.drag) {
        Array.copy(this.touchPos, this.touchPosOld);
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
      }
      else {
        this.drag = true;
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
        Array.copy(this.touchPos, this.tmp);
        
        this.tmp[0] -= gesture.deltaX / 2;
        this.tmp[1] -= gesture.deltaY / 2;
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
      if (isUserInputTag(e.target.tagName))
        return;
      
      if (this.drag) {
        stopDragEvent(e);
        this.drag = false;
        this.dragEnd = true;
//        log("DRAG RELEASE, speed: (" + this.dragVector[0] + ", " + this.dragVector[1] + ")");
      }
      
//      return false;
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
      this._connected = true;
      this.hammer.on('drag', this._ondrag);
      this.hammer.on('dragend', this._ondragend);
    },
    
    disconnect: function() {
      this._connected = false;
      this.hammer.off('drag', this._ondrag);
      this.hammer.off('dragend', this._ondragend);
    },
    
    isOn: function() {
      return this._connected;
    },
    
    tick: function( data ) {
      if (!this.isOn())
        return
            
      if (this.dragEnd) {
        this.dragEnd = false;
        THERE.dragend(this.lastDragVector, this.id);
        zero(this.lastDragVector);
        
        Physics.echo(enableClick) // async and faster than setTimeout
      }
      
      if (this.drag && !isEqual(this.dragVector, zeroVector)) {
//        log("DRAG, distance: (" + this.dragVector[0] + ", " + this.dragVector[1] + ")");
        THERE.drag(this.dragVector, this.id);
        zero(this.dragVector);
      }
    }
  };

  function getRenderListeners(event) {
    if (event == 'translate')
      return renderListeners.translate[''];
    else if (event == 'rotate')
      return renderListeners.translate[''];
    else
      return _.leaf(renderListeners, event);
  }
  
  Physics = {
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
    
    addBody: function(id, type, options, el, hammer) {
      if (el)
        HERE.addBody(el, id);
      if (hammer)
        this.addDraggable(hammer || el, id);
      
      THERE.addBody(type, options, id);
    },
    
    benchBodies: function(/* ids */) {
      THERE.benchBodies.apply(THERE, arguments);
    },

    unbenchBodies: function(/* ids */) {
      THERE.unbenchBodies.apply(THERE, arguments);
    },
    
    addDraggable: function(hammerOrElement, id) {
      var proxy = new DragProxy(hammerOrElement, id);
      DRAGGABLES[id] = proxy;
      return proxy;
    },
    
    suspendDraggable: function(id) {
      var draggable = DRAGGABLES[id];
      if (draggable)
        draggable.disconnect();
      
//      DRAGGABLES = _.difference(DRAGGABLES, _.toArray(arguments));
    },

    removeDraggable: function(id) {
      this.suspendDraggable(id);
      delete DRAGGABLES[id];
//      DRAGGABLES = _.difference(DRAGGABLES, _.toArray(arguments));
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
        
        tickerId = FrameWatch.listenToTick(function(lastFrameDuration) {
          if (_.size(UNRENDERED)) {            
            render(UNRENDERED);
            UNRENDERED = {};
          }
          
          DOM.processRenderQueue();
          for (var id in DRAGGABLES) {
            DRAGGABLES[id].tick();
          }
          
          if (LOCK_STEP) {
            var newNow = _.now(),
            delay = TIMESTEP > newNow - NOW;    
            if (!delay) {
              newNow = NOW;
              PHYSICS_TIME += TIMESTEP;
              THERE.step(PHYSICS_TIME);
            }
          }
        });
        
        var fileInfo = G.files['physicsWorker.js'];
        worker = new Worker(G.serverName + '/js/' + (fileInfo.fullName || fileInfo.name));
        worker.onmessage = function(e) {
          var topic = e.data.topic,
              callback;
          
          switch (topic) {
            case 'render':
              if (UNRENDERED)
                _.extend(UNRENDERED, e.data.bodies);
              else
                UNRENDERED = e.data.bodies;
              
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
          physicsJSUrl: physicsModuleInfo.fullName || physicsModuleInfo.name,
          masonryUrl: masonryModuleInfo.fullName || masonryModuleInfo.name,
          debug: G.DEBUG,
          stepSelf: !LOCK_STEP,
          constants: CONSTANTS
        });
        
        this.updateBounds();
      },

      updateBounds: function() {
        calcBounds();
        worker.postMessage({
          method: 'updateBounds',
          args: bounds
        });
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

      rpc: function(objectName, method, args) {
        if (args) {
          var i = args.length,
              arg;
          
          while (i--) {
            arg = args[i];
            if (typeof arg == 'function') {
              args[i] = addCallback(arg);
            }
          }
        }
        
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
      
      set: function(constantName, value) {
        Physics.constants[constantName] = value;
        return this.rpc(null, 'set', _.toArray(arguments));
      }
    }
  };
  
  function LayoutManager(options, callback) {
    if (!(this instanceof LayoutManager))
      return new LayoutManager(options, callback);
    
    ID_TO_LAYOUT_MANAGER[options.container] = this;
    this.id = _.uniqueId('layoutManager');
    THERE.rpc(null, 'layout.init', [this.id, options, addSubscription(callback)]);
  };
  
  HERE = Physics.here;
  THERE = Physics.there;
  
  commonMethods.forEach(function(method) {
    THERE[method] = function() {
      return this.rpc(null, method, _.toArray(arguments));
    };
  });
  
  layoutMethods.forEach(function(method) {
    LayoutManager.prototype[method] = function() {
      return THERE.rpc(this.id, method, _.toArray(arguments));
    };
  });
  
  return Physics;
});