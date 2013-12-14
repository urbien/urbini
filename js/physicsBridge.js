define('physicsBridge', ['globals', 'underscore', 'FrameWatch', 'lib/fastdom', 'hammer', 'domUtils'], function(G, _, FrameWatch, Q, Hammer, DOM) {
  var worker,
      commonMethods = ['addBody', 'removeBody', 'distanceConstraint', 'drag', 'dragend', 'resize', 'benchBodies', 'unbenchBodies'],
      masonryMethods = ['addBricks', 'setLimit', 'sleep', 'wake', 'resize'],
      UNRENDERED = {},
      tickerId,
      hammer,
      hammerOptions = {},
      bridge,
      HERE,
      THERE,
      DragProxy,
      ID_TO_EL = {},
      ID_TO_LAST_TRANSFORM = {},
      ZERO_TRANSLATION = [0, 0, 0],
      ZERO_ROTATION = [0, 0, 0],
      IDENTITY_TRANSFORM = [1, 0, 0, 0,
                            0, 1, 0, 0,
                            0, 0, 1, 0,
                            0, 0, 0, 1];
  
      zeroVector = [0, 0, 0],
      DRAGGABLES = [],
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
      TRANSFORM_PROP = DOM.prefix('transform'),
      TRANSITION_PROP = DOM.prefix('transition');

    document.addEventListener('click', function(e) {
      try {
        if (!G.canClick()) {
          G.log('events', 'PREVENTING CLICK', _.now());
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        G.log('events', 'ALLOWING CLICK', _.now());
      } finally {
        G.enableClick();
      }
    }, true);

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
    Q.write(_render.bind(null, transforms));
  }
  
  function _render(transforms) {
    DOM.processRenderQueue();
    
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
          transformStr += translate.join(', ');
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
          transformStr += 'rotate(' + rotate[2] + 'rad)'; // for now, only around Z axis
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
  };
  
  /**
   * currently only sends drag data once a frame (maybe it should send every time it gets a drag event)
   */
  DragProxy = {
    init: function(){
      this.touchPos = zeroVector.slice();
      this.touchPosOld = zeroVector.slice();
      this.tmp = zeroVector.slice();
      this.dragged = zeroVector.slice();
      this.offset = zeroVector.slice();
      
      this.dragging = false;      
      this._ondrag = this._ondrag.bind(this);
      this._ondragend = this._ondragend.bind(this);
      hammer.on('drag', this._ondrag);
      hammer.on('dragend', this._ondragend);
    },

    _ondrag: function(e) {
      G.disableClick();
      var gesture = e.gesture,
          center = gesture.center,
          touch = e.gesture.touches[0];
        
      gesture.preventDefault();
      if (this.dragging) {
        _.extend(this.touchPosOld, this.touchPos);
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
      }
      else {
        this.dragging = true;
        this.touchPos[0] = touch.pageX;
        this.touchPos[1] = touch.pageY;
        _.extend(this.tmp, this.touchPos);
        this.tmp[0] -= gesture.deltaX / 2;
        this.tmp[1] -= gesture.deltaY / 2;
        _.extend(this.touchPosOld, this.tmp);
      }
      
      _.extend(this.tmp, this.touchPos);
      sub(this.tmp, this.touchPosOld);
      add(this.dragged, mult(this.tmp, 0.5)); // do we need this?
    },

    _ondragend: function(e) {
      e.gesture.preventDefault();
      if (this.dragging) {
        this.dragging = false;
        THERE.dragend(this.dragged, DRAGGABLES);
      }
    },

    connect: function( hammer ){        
      hammer.on('drag', this._ondrag);
      hammer.on('dragend', this._ondragend);
    },

    disconnect: function( hammer ){
      // unsubscribe when disconnected
      hammer.off('drag', this._ondrag);
      hammer.off('dragend', this._ondragend);
    },
    
    tick: function( data ) {
      if (this.dragging && !isEqual(this.dragged, zeroVector)) {
        THERE.drag(this.dragged, DRAGGABLES);
        zero(this.dragged);
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
  
  bridge = {
    init: function() {
      if (!worker) {
        this.here.init();
        this.there.init();
      }
    },
    
    echo: function(callback) {
      THERE.rpc(null, 'echo', [addCallback(callback)]);
    },
    
    addBody: function(id, type, options, el, draggable) {
      if (el)
        HERE.addBody(el, id);
      if (draggable)
        this.addDraggables(id);
      
      THERE.addBody(type, options, id);
    },
    
    benchBodies: function(/* ids */) {
      THERE.benchBodies.apply(THERE, arguments);
    },

    unbenchBodies: function(/* ids */) {
      THERE.unbenchBodies.apply(THERE, arguments);
    },
    
    addDraggables: function(/* ids */) {
      DRAGGABLES.push.apply(DRAGGABLES, arguments);
    },
    removeDraggables: function(/* ids */) {
      DRAGGABLES = _.difference(DRAGGABLES, _.toArray(arguments));
    },

    here: {
      getTransform: function(id) {
        return ID_TO_LAST_TRANSFORM[id];
      },      
      on: function(event, id, callback) {
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
        hammer = new Hammer(document, hammerOptions);
        DragProxy.init();
        DragProxy.connect(hammer);
        
        tickerId = FrameWatch.listenToTick(function() {
          if (_.size(UNRENDERED)) {
            render(UNRENDERED);
            UNRENDERED = {};
          }
          
          DragProxy.tick();
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
      
      masonry: {
        newMason: function() {
          return Mason.apply(null, arguments);
        }
      }
    }
  };
  
  function Mason(slidingWindowOptions, callback) {
    if (!(this instanceof Mason))
      return new Mason(slidingWindowOptions, callback);
    
    this.id = _.uniqueId('mason');
    THERE.rpc(null, 'masonry.init', [this.id, slidingWindowOptions, addSubscription(callback)]);
  };
  
  HERE = bridge.here;
  THERE = bridge.there;
  
  commonMethods.forEach(function(method) {
    THERE[method] = function() {
      return this.rpc(null, method, _.toArray(arguments));
    };
  });
  
  masonryMethods.forEach(function(method) {
    Mason.prototype[method] = function() {
      console.log("MASONRY." + method);
      return THERE.rpc(this.id, method, _.toArray(arguments));
    };
  });
  
  return bridge;
});