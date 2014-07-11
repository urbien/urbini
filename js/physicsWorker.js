var ArrayProto = Array.prototype,
    indexOf = ArrayProto.indexOf,
    concat = ArrayProto.concat,
    slice = ArrayProto.slice,
    benchedBodies = {},
//    JUST_HIDDEN = [],
    world,
    integrator,
    NUMBER_UNITS = ['px', 'em', '%'],
    CONSTANTS,
    LAST_STEP_TIME,
    LAST_STEP_DT,
//    DRAG_FINISH_PENDING = false,
    IS_DRAGGING = false,
    DRAG_ANCHOR,
    DRAG_CONSTRAINTS = [],
//    DRAG_TRACKERS = [],
    TRACKERS = [],
    CancelType = {
      unhandle: 'unhandle', // stop handling 'step' event for action
      stop: 'stop',         // stop handling 'step' event for action, and stop the body at its current location if it's moving
      revert: 'revert'      // stop handling 'step' event for action, and revert the body to its state before the action
    },
    WORLD_CONFIG = {
      positionRenderResolution: 1,
      angleRenderResolution: 0.001,
      timestep: 1000 / 60,
      maxIPF: 6
    },
    
    // START Transfer protocol props
    STYLE_BUFFER_LENGTH,
    STYLE_ORDER,
//    UNIT_MAP,
//    PREFIX,
//    SUFFIX,
//    UNITS,
//    SEPARATOR,
    STYLE_NUM_VALUES,
    // END Transfer protocol
    
//    airDragBodies = [],
    constrainer,
//    boxer,
    railroad,
    ZERO_ROTATION = [0, 0, 0],
    UNSCALED = [1, 1, 1],
    MIN_SCALE = [0.0001, 0.0001, 1],
    IDENTITY_TRANSFORM,
    MIN_SCALE_TRANSFORM,
//    IDENTITY_TRANSFORM = [1, 0, 0, 0, 
//                          0, 1, 0, 0, 
//                          0, 0, 1, 0, 
//                          0 , 0, 0, 1],
//    MIN_SCALE_TRANSFORM = [0.0001, 0, 0, 0, 
//                           0, 0.0001, 0, 0, 
//                           0, 0, 0.0001, 0, 
//                           0, 0, 0, 0.0001],
    OPACITY_INC = 0.05,
    LEFT,
    RIGHT,
    ORIGIN,
    BOUNDS,
    BOUNDS_AREA,
    RENDERED_SINCE_BOUNDS_CHANGE = false,
    PUBSUB_SNAP_CANCELED = 'snap-canceled',
    proxiedObjects,
    layoutManagers = {},
    DEBUG,
    DIR_X_NEG,
    DIR_X_POS,
    DIR_Y_POS,
    DIR_Y_NEG,
    DIR_Z_NEG,
    DIR_Z_POS,
    DIR_MAP = {
      left: null,
      right: null,
      up: null,
      down: null
    },
    RERENDER = false,
    MAX_OPACITY = 0.999999,
    HEAD_STR = "head (top / left)",
    TAIL_STR = "tail (bottom / right)",
    BUFFERS = [],
    STYLE_ARRAY_CACHE = [];

String.prototype.endsWith = function(str) {
  return this.slice(this.length - str.length) === str;
};

function getStyleBufferLength() {
  if (!STYLE_BUFFER_LENGTH) {
    STYLE_BUFFER_LENGTH = 0;
    var i = STYLE_ORDER.length;
    while (i--) {
      STYLE_BUFFER_LENGTH += STYLE_NUM_VALUES[STYLE_ORDER[i]] || 1;
    }
  }
  
  return STYLE_BUFFER_LENGTH;
};

function newStyleArray() {
  return STYLE_ARRAY_CACHE.pop() || new Float64Array(getStyleBufferLength());
};

function toStyleArray(style, array) {
  array = array || newStyleArray();
  var prop,
      val,
      numVals,
      idx = 0;
      
  for (var i = 0; i < STYLE_ORDER.length; i++) {
    prop = STYLE_ORDER[i];
    numVals = STYLE_NUM_VALUES[prop] || 1;
    if (style.hasOwnProperty(prop)) {
      val = style[prop];
      if (val == null)
        val = NaN;
      else if (val instanceof Array) { //numVals == 1)
        for (var j = 0; j < numVals; j++) {
          array[idx++] = val[j];
        }
      }
      else if (typeof val == 'string') {
        array[idx++] = parseFloat(val);
//        unit = val.match(/[^\d]+/);
//        if (unit)
//          unit = unit[0];
      }
      else if (typeof val == 'number')
        array[idx++] = val;
      else
        throw "unsupported value for property " + prop;
    }
    else {
      for (var j = 0; j < numVals; j++) {
        array[idx++] = Infinity; // to distinguish from null, which means to remove. "Infinity" is used to signify "ignore"
      }
    }
  }
  
  return array;
};

function index(obj, i) {
  return obj[i];
};

function getAxisIndex(axis) {
  switch (axis) {
  case 'x':
    return 0;
  case 'y':
    return 1;
  case 'z':
    return 2;
  default:
    throw "not a valid axis: " + axis;
  }
};

function isNumberUnit(unit, value, type) {
  if (!isNaN(value) || type == 'number' || ~NUMBER_UNITS.indexOf(unit))
    return true;
  
  if (typeof value == 'string') {
    var i = NUMBER_UNITS.length;
    while (i--) {
      if (value.endsWith(NUMBER_UNITS[i]))
        return true;
    }
  }
  
  return false;
}

//function DragTracker(body, trackingType, trackBodies) {
//  this.body = body;
//  this.type = trackingType || 'vel';
//  this.trackBodies = trackBodies;
//  DRAG_TRACKERS.push(this);
//};
//
//DragTracker.prototype = {
//  isTrackingPosition: function() {
//    return this.type == 'pos';
//  },
//  canTrack: function(dragData) {
//    if (!this.trackBodies)
//      return true;
//    
//    var trackables = this.trackBodies,
//        i = trackables.length,
//        bodies = dragData.bodies;
//    
//    while (i--) {
//      if (!bodies.indexOf(trackables[i]))
//        return true;
//    }
//    
//    return false;
//  }
//};
//
////function addDragTracker(body) {
////  var idx = DRAG_TRACKERS.indexOf(body);
////  if (idx == -1)
////    DRAG_TRACKERS.push(body);
////};
//
//function getDragTracker(body) {
//  var i = DRAG_TRACKERS.length,
//      tracker;
//  
//  while (i--) {
//    tracker = DRAG_TRACKERS[i];
//    if (tracker.body == body)
//      return tracker;
//  }
//  
//  return null;
//};
//
//function removeDragTracker(body) {
//  var tracker = getDragTracker(body),
//      idx;
//  
//  if (tracker) {
//    idx = DRAG_TRACKERS.indexOf(body);
//    if (~idx)
//      DRAG_TRACKERS.splice(idx, 1);
//  }
//};
//
//function getTracker(bodyA, bodyB) {
//  var i = TRACKERS.length,
//      tracker;
//  
//  while (i--) {
//    tracker = TRACKERS[i];
//    if (tracker.bodyA == bodyA && tracker.bodyB == bodyB)
//      return tracker;
//  }
//  
//  return null;
//};
//
//function getTrackersByType(body, type) {
//  type = type || 'all';
//  
//  var i = TRACKERS.length,
//      trackers = [],
//      tracker;
//  
//  while (i--) {
//    tracker = TRACKERS[i];
//    switch (type) {
//    case 'tracked':
//      if (tracker.bodyB == body)
//        trackers.push(body);
//      
//      break;
//    case 'tracking':
//      if (tracker.bodyA == body)
//        trackers.push(body);
//      
//      break;
//    case 'all':
//      if (tracker.bodyA == body || tracker.bodyB == body)
//        trackers.push(t);
//      
//      break;
//    }
//  }
//  
//  return trackers;
//};
//
//function removeTrackers(body, type) {
//  getTrackersByType(body, type).forEach(function(tracker) {
//    tracker.destroy();
//  });
//};
//
//function Tracker(bodyA, bodyB) {
//  this.bodyA = getBody(bodyA);
//  this.bodyB = getBody(bodyB);
//  this._props = {};
//  TRACKERS.push(this);
//};
//
//Tracker.prototype = {
//  untrack: function(prop) {
//    world.unsubscribe('step', this._props[prop]);
//  },
//  track: function(prop) {
//    if (this._props[prop])
//      return;
//    
//    var a = this.bodyA,
//        b = this.bodyA;
//    
//    function trackProp() {
//      switch (prop) {
//      case 'acc':
//      case 'vel':
//      case 'pos':
//        a.state[prop].clone(b.state[prop]);
//        break;
//      default:
//        a.state.renderData.set(prop, b.state.renderData.get(prop));
//        break;
//      }
//    };
//    
//    this._props[prop] = trackProp;
//    world.subscribe('step', trackProp);
//  },
//  destroy: function() {
//    var idx = TRACKERS.indexOf(this);
//    if (~idx)
//      TRACKERS.splice(idx, 1);
//    
//    for (var p in this._props) {
//      this.untrack(p);
//    }
//  }
//};

function noop() {};

// resolve string path to object, e.g. 'Physics.util' to Physics.util
function leaf(obj, path, separator) {
  return path.split(separator||'.').reduce(index, obj);
};

function sign(number) {
  return number < 0 ? -1 : 1;
};

/**
 * Note: increase and decrease are in magnitude, not in raw value, so 1 to 2 as well as -1 to -2 is an "increase" of 1 
 */
function getNextValue(oldValue, newValue, maxDecrease, maxIncrease, minDecrease, minIncrease) {
  minDecrease = minDecrease == undefined ? 0 : minDecrease;
  minIncrease = minIncrease == undefined ? 0 : minIncrease;
  maxDecrease = maxDecrease == undefined ? Infinity : maxDecrease;
  maxIncrease = maxIncrease == undefined ? Infinity : maxIncrease;
  if (oldValue < 0) {
    if (newValue < oldValue)
      newValue = Math.min(newValue, oldValue - minIncrease);
    else
      newValue = Math.max(newValue, oldValue + minDecrease);
  }
  else {
    if (newValue < oldValue)
      newValue = Math.min(newValue, oldValue - minDecrease);
    else
      newValue = Math.max(newValue, oldValue + minIncrease);
  }
    
  var low = oldValue < 0 ? oldValue - maxIncrease : oldValue - maxDecrease,
      high = oldValue < 0 ? oldValue + maxDecrease : oldValue + maxIncrease;
  
  return Physics.util.clamp(newValue, low, high);
};

self.console = self.console || {
  log: function() {
  //  DEBUG && console && console.log.apply(console, arguments);
    postMessage({
      topic: 'log',
      args: slice.call(arguments)
    });
  },

  debug: function() {
  //  DEBUG && console && console.debug.apply(console, arguments);
    postMessage({
      topic: 'debug',
      args: slice.call(arguments)
    });
  }
};

self.log = function() {
  if (DEBUG)
    console.log.apply(console, arguments);
};

self.debug = function() {
  if (DEBUG)
    console.debug.apply(console, arguments);
};

this.onmessage = function(e){
//  try {
    _onmessage(e);
//  } catch (err) {
//    debugger;
//  }
};

function _onmessage(e) {
  if (!world) {
    var physicsJSUrl = e.data.physicsJSUrl,
        masonryUrl = e.data.masonryUrl;
    
    if (!physicsJSUrl)
      throw "Missing required imports: Physics";

    if (!masonryUrl)
      throw "Missing required imports: Masonry";

    log("IMPORTING: " + physicsJSUrl);
    importScripts(physicsJSUrl);
    log("IMPORTING: " + masonryUrl);
    importScripts(masonryUrl);
    DEBUG = e.data.debug;
//    with (e.data.styleInfo) {
      // Transfer protocol props
//    UNIT_MAP = e.data.styleInfo.units;
    STYLE_ORDER = e.data.styleInfo.order;
    STYLE_NUM_VALUES = e.data.styleInfo.values;
//      PREFIX = prefix;
//      SUFFIX = suffix;
//      UNITS = units;
//      SEPARATOR = separator;
//    }
    
    CONSTANTS = {};
    Object.keys(CONSTANTS).forEach(function(c) {
      if (c != 'degree') {
        CONSTANTS['_' + c] = CONSTANTS[c];
        CONSTANTS.__defineGetter__(c, function() {
          var deg = CONSTANTS.degree;
          if (deg == 0)
            deg = 1;
          else if (deg < 0)
            deg = -1 / deg;
            
          return Math.pow(CONSTANTS['_' + c], deg);
        });
        
        CONSTANTS.__defineSetter__(c, function(val) {
          if (c == 'drag')
            val /= 4;
          
          CONSTANTS['_' + c] = val;
        });
      }
    });
    
    Physics.util.extend(WORLD_CONFIG, CONSTANTS.worldConfig);
    Physics.util.extend(CONSTANTS, e.data.constants);
    world = Physics( WORLD_CONFIG, function(world, Physics) {
      initWorld(world, e.data.stepSelf);
    });
    
    proxiedObjects = {
      world: world,
      Physics: Physics
    };
    
    return;
  }
  
  executeRPC(e.data);
};

function executeRPC(rpc) {
  var obj = rpc.object ? leaf(proxiedObjects, rpc.object) : API,
      method = leaf(obj, rpc.method),
      args = rpc.args || [],
      callbackId = rpc.callback,
      result;

  if (obj instanceof Physics.util.pubsub) {
    if (method == 'subscribe')
      return subscribe.apply(obj, args);
    else if (method == 'unsubscribe')
      return unsubscribe.apply(obj, args);
  }
  
  if (obj instanceof LayoutManager) {
    if (obj._requestLessTimePlaced) {
      obj.log("Bricks took " + (Physics.util.now() - obj._requestLessTimePlaced) + "ms to remove");
      delete obj._requestLessTimePlaced;
    }
  }
  
//  log("RPC " + method + (args ? args.join(",") : ''));
  if (callbackId)
    args.push(callbackId);
  
  method.apply(obj, args);
}

function doCallback(callbackId, data) {
  switch (typeof callbackId) {
  case null:
  case undefined:
    return;
  case 'function':
    callbackId(data);
    break;
  default:
    postMessage({
      topic: 'callback',
      id: callbackId,
      data: data
    });
  }
};

function triggerEvent(callbackId, data) {
  postMessage({
    topic: 'event',
    id: callbackId,
    data: data
  });
};

function vectorToLeft(fromPos) {
  return Physics.vector(LEFT).vsub(fromPos).set(v.get(0), 0).normalize();
};

function vectorToRight(fromPos) {
  return Physics.vector(RIGHT).vsub(fromPos).set(v.get(0), 0).normalize();
};

function vectorToCenter(fromPos) {
  return Physics.vector(ORIGIN).vsub(fromPos).set(v.get(0), 0).normalize();
};

function getAABB(body) {
  if (body.geometry._aabb == false)
    body.geometry.aabb();
  
  return body.geometry._aabb;
};

function updateBounds(minX, minY, maxX, maxY) {
  RENDERED_SINCE_BOUNDS_CHANGE = false;
  BOUNDS = Physics.aabb.apply(Physics, arguments);
  BOUNDS_AREA = (maxX - minX) * (maxY - minY);
  var leftX = minX - (maxX - minX),
      leftY = minY,
      rightX = maxX,
      rightY = minY,
      back = 10;
  
  if (!LEFT) {
    LEFT = Physics.body('point', {
      _id: 'left',
      fixed: true,
      hidden: true,
      x: leftX,
      y: leftY,
      z: -back
    });

    RIGHT = Physics.body('point', {
      _id: 'right',
      fixed: true,
      hidden: true,
      x: rightX,
      y: rightY,
      z: -back
    });
    
    ORIGIN = Physics.body('point', {
      _id: 'center',
      fixed: true,
      hidden: true,
      x: minX,
      y: minY,
      z: 0
    });
    
//    LEFT._id = 'left';
//    RIGHT._id = 'right';
//    ORIGIN._id = 'center';
    world.addBody(LEFT);
    world.addBody(RIGHT);
    world.addBody(ORIGIN);
  }
  else {
    ORIGIN.state.pos.set(minX, minY);
    LEFT.state.pos.set(leftX, leftY);
    RIGHT.state.pos.set(rightX, rightY);
  }
};

function addBehavior(behavior, options) {
  world.addBehavior( Physics.behavior(behavior, options) );
};

function updateVector(v, x, y, z) {
  if (x == null)
    x = v.get(0);
  
  if (y == null)
    y = v.get(1);
  
  if (z == null)
    z = v.get(2);
  
  v.set(x, y, z);
  return v;
}

function removeActions(/*, action, action */) {
  for (var i = 0, l = arguments.length; i < l; i++) {
    removeAction(body, arguments[i]);
  }
}

//function onOutOfActions(body, callback) {
//  if (!body._actions || !body._actions.length)
//    callback();
//  else
//    (body._outOfActionsCallbacks = body._outOfActionsCallbacks || []).push(callback);
//};

function removeAction(body, action) {
  if (body._actions) {
    var idx = body._actions.indexOf(action);
    if (~idx)
      body._actions.splice(idx, 1);
    else
      debugger;
    
//    if (!body._actions.length) {
//      var callbacks = body._outOfActionsCallbacks;
//      body._outOfActionsCallbacks = [];
//      if (callbacks) {
//        var i = callbacks.length;
//        while (i--) {
//          callbacks[i]();
//          callbacks.length--;
//        }
//      }
//    }
  }
};

//function bindTrackedAction() {
//  if (options.trackAction)
//    options.track = getAction(body._actions, options.trackAction);
//};

function hasActionsPending(body) {
  return body && body._actions && body._actions.length;
}

function getAction(trackInfo) {
  if (typeof trackInfo == 'function')
    return trackInfo;
  else if (trackInfo) {
    if (typeof trackInfo.action == 'object')
      return trackInfo.action;
    
    var id = trackInfo.action,
        body = getBody(trackInfo.body),
        actions = body && body._actions,
        i = actions && actions.length,
        action;
    
    while (i--) {
      action = actions[i];
      if (action.id == id)
        return action;
    }
  }
};

function getActionOptions(options) {
  return {
    id: options.actionId,
    track: getAction(options.trackAction),
    forceFollow: options.forceFollow,
    duration: options.duration
  };
};

function Action(options) {
  var complete = false,
      canceled = false,
      started = false,
      startTime,
      timePassed = 0,
      _onstep = options.onstep,
      _onIP = options.onIntegratePositions,
      _onIV = options.onIntegrateVelocities,
      onstep,
      onIP,
      onIV,
      ratio,
      trackedAction = options.track,
      action,
      previousRatio = 0,
      goingBackwards = false,
      defaultTimestep = WORLD_CONFIG.timestep;

  if (!(!!_onstep ^ !!_onIV ^ !!_onIP))
    throw "actions can currently only subscribe to ONE of 'integrate:positions', 'integrate:velocities' or 'step' events";
  
  function start() {
    if (!started) {
      started = true;
      startTime = LAST_STEP_TIME;
      log("Started action: " + (action.name));
      if (action.onstart)
        action.onstart(action.ratio());
    }
  };
  
  function unsubscribe() {
    if (onstep)
      world.unsubscribe('step', onstep);
    else if (onIP)
      world.unsubscribe('integrate:positions', onIP);
    else if (onIV)
      world.unsubscribe('integrate:velocities', onIV);
  };
  
  // allow tracking of another action
  ratio = trackedAction ? trackedAction.ratio.bind(trackedAction) : function() {
    if (!this.duration)
      throw "the default implementation for this method requires a time limit";
    
    return Math.max(0, 
           Math.min(1, timePassed / this.duration));
  };
  
  function canIterate(ratio) {
//    if (complete || canceled)
//      return false;
    
    if (trackedAction) {
      switch (trackedAction.state()) {
      case 'canceled':
        action.cancel();
        return false;
      case 'completed':
        action.complete();
        return false;
      }
      
      if (goingBackwards) {
        if (ratio > previousRatio) {
          goingBackwards = false;
        }
      }
      else {
        if (ratio < previousRatio) {
          goingBackwards = true;
          if (options.forceFollow) {
            if (typeof options.forceFollow == 'number')
              options.forceFollow--;
          }
          else {
            action.complete();
            return false;
          }
        }
      }
    }
    
    previousRatio = ratio;
    return true;
  };
  
  function setupIterator(fn) {
    return function(data) {
      var ratio = this.ratio();
      if (canIterate(ratio)) {
        timePassed += data.dt;
        start();
        fn.call(this, ratio);
      }      
    }
  };
  
  onstep = _onstep && setupIterator(_onstep);  
  onIP = _onIP && setupIterator(_onIP);
  onIV = _onIV && setupIterator(_onIV);
  
  action = Physics.util.extend({}, options, {
    id: options.id || Physics.util.uniqueId('action'),
    ratio: ratio,
    start: function() {
      if (onstep)
        world.subscribe('step', onstep, action);
      else if (onIP)
        world.subscribe('integrate:positions', onIP, action);
      else if (onIV)
        world.subscribe('integrate:velocities', onIV, action);
    },
    state: function() {
      return complete ? 'completed' : canceled ? 'canceled' : 'running';
    },
    cancel: function() {
      if (!complete && !canceled) {
        canceled = true;
        log("Canceled action: " + (this.name || this.type));
        unsubscribe();
        if (this.oncancel)
          this.oncancel.apply(this, arguments);
        
        this.cleanup(); // prevent memory leak via circular reference endSnap -> action -> endSnap         
      }
    },
    complete: function() {
      if (!complete && !canceled) {
        complete = true;      
        log("Completed action: " + (this.name || this.type));
//        world.unsubscribe('step', onstep);
        unsubscribe();
        if (this.oncomplete)
          this.oncomplete.apply(this, arguments);
        
        this.cleanup(); // prevent memory leak via circular reference endSnap -> action -> endSnap         
      }
    },
    cleanup: function() {
      delete this.oncancel;
      delete this.oncomplete;
    }
  });
  
  return action;
};

function addAction(body, action) { //, exclusive) {
//  if (exclusive)
  var oncomplete = action.oncomplete,
      oncancel = action.oncancel;
  
//  API.cancelPendingActions(body);  
  body._actions = body._actions || [];
  body._actions.push(action);
  
  action.oncomplete = function() {
    removeAction(body, action);
    oncomplete && oncomplete.apply(this, arguments);
  };
  
  action.oncancel = function() {
    removeAction(body, action);
    oncancel && oncancel.apply(this, arguments);
  };
};

function minify(/* body1, body2,..., or array of bodies */) {
  var bodies = arguments[0] instanceof Array ? arguments[0] : arguments,
      i = bodies.length;
  
  while (i--) {
    bodies[i].state.renderData.set('scale', MIN_SCALE);
  }
};

function pluck(obj, prop1, prop2 /* etc. */) {
  var subset = {};
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop) && indexOf.call(arguments, prop) > 0) {
      subset[prop] = obj[prop];
    }
  }
  
  return subset;
}

function toJSON(obj) {
  var json = {};
  for (var prop in obj) {
    if (typeof obj[prop] != 'function')
      json[prop] = obj[prop];
  }
  
  return json;
};

///**
// * NOTE: assumes rectangles are not rotated
// */
//function _getOverlapArea(aabb1, aabb2) {
//  aabb1 = aabb1.get ? aabb1.get() : aabb1;
//  aabb2 = aabb2.get ? aabb2.get() : aabb2;
//  var left1 = aabb1.pos.x - aabb1.halfWidth,
//      right1 = aabb1.pos.x + aabb1.halfWidth,
//      top1 = aabb1.pos.y - aabb1.halfHeight,
//      bottom1 = aabb1.pos.y + aabb1.halfHeight,
//      left2 = aabb2.pos.x - aabb2.halfWidth,
//      right2 = aabb2.pos.x + aabb2.halfWidth,
//      top2 = aabb2.pos.y - aabb2.halfHeight,
//      bottom2 = aabb2.pos.y + aabb2.halfHeight;
//  
////  return !(left1 > right2 || 
////           left2 > right1 ||
////           top1 > bottom2 ||
////           top2 > bottom1);
//  
//  return left1 > right2 || left2 > right1 || top1 > bottom2 || top2 > bottom1 
//          ? 0 
//          : Math.min(Math.max(right2 - left1, right1 - left2, bottom2 - top1, bottom1 - top2, 0), Math.max(aabb1.halfWidth, aabb1.halfHeight) * 2, Math.max(aabb2.halfWidth, aabb2.halfHeight) * 2);
//};

function fixRectVertices(v) {
  if (v[0].x == 0 && v[1].x == 0 && v[2].x == 0 && v[3].x == 0)
    v[1].x = v[2].x = 1;

  if (v[0].y == 0 && v[1].y == 0 && v[2].y == 0 && v[3].y == 0)
    v[2].y = v[3].y = 1;
};

function _getOverlapArea(aabbA, aabbB, areaA, areaB) {
  aabbA = aabbA.get ? aabbA.get() : aabbA;
  aabbB = aabbB.get ? aabbB.get() : aabbB;
  var x1A = aabbA.pos.x - aabbA.halfWidth,
      y1A = aabbA.pos.y - aabbA.halfHeight,
      x2A = aabbA.pos.x + aabbA.halfWidth,
      y2A = aabbA.pos.y + aabbA.halfHeight,
      x1B = aabbB.pos.x - aabbB.halfWidth,
      y1B = aabbB.pos.y - aabbB.halfHeight,
      x2B = aabbB.pos.x + aabbB.halfWidth,
      y2B = aabbB.pos.y + aabbB.halfHeight,
      left = Math.max(x1A, x1B),
      right = Math.min(x2A, x2B),
      top = Math.max(y1A, y1B),
      bottom = Math.min(y2A, y2B),
      rl = right - left,
      bt = bottom - top;
  
  if (rl > 0 && bt > 0)
    return rl * bt;
  else {
    if (rl > 0)
      return bt;
    else if (bt > 0)
      return rl;
    else
      return Math.max(rl, bt); // distance
  }
  
//      ,
//      intersection,
//      union;
//  
//  
//  if (!(x1A > x2B || x2A > x1B || y1A > y2B || y2B > y1A))
//    return 0;
//  
//  areaA = areaA || aabbA.halfWidth * aabbA.halfHeight * 4;
//  areaB = areaB || aabbB.halfWidth * aabbB.halfHeight * 4;
//  intersection = Math.max(0, Math.max(x2A, x2B) - Math.min(x1A, x1B)) * Math.max(0, Math.max(y2A, y2B) - Math.min(y1A, y1B));
//  union = areaA + areaB - intersection;
  
};

/**
 * NOTE: assumes rectangles are not rotated
 */
function getOverlapArea(body, bounds, bodyArea, boundsArea) {
  bounds = bounds || BOUNDS;
  var aabb = body.aabb(), // don't use getAABB() because it returns the original copy, and we want to adjust the aabb we receive for our calculations without changing the body's actual aabb
      frame = body.options.frame,
      frameAABB = frame && getAABB(frame),
      xOffset,
      yOffset;
  
  if (frame) {
    switch (frame.geometry.name) {
    case 'point':
      xOffset = frame.state.pos.get(0);
      yOffset = frame.state.pos.get(1);
      break;
    default:
      xOffset = frame.state.pos.get(0) - frameAABB._hw;
      yOffset = frame.state.pos.get(1) - frameAABB._hh;
      break;
    }
    
    aabb.pos.x += xOffset;
    aabb.pos.y += yOffset;
  }
    
  var area = _getOverlapArea(aabb, bounds, bodyArea, boundsArea);
  if (area < 0)
    body.state.distanceFromBounds = area;
  else
    body.state.distanceFromBounds = 0;
  
  return area;
};

function recycleStyleArray(body, array) {
  if (body)
    body.state.renderData.encoded.push(array);
  else
    STYLE_ARRAY_CACHE.push(array);
};

function recycle(recycled) {
  bodies = getBodies.apply(null, Object.keys(recycled).concat(true)); // last arg specifies to get back a map, not an array
  var ids = Object.keys(recycled),
      i = ids.length;
  
//    while (i--) {
//      id = ids[i];
//      if (body = bodies[id])
//        body.state.renderData.encoded = recycled[id];

  for (var id in recycled) {
    recycleStyleArray(bodies[id], recycled[id]);
  }
};

function render() {
  var bodies,
      body,
      id,
      msg = {
        topic: 'render',
        bodies: {}
      },
      styles = msg.bodies,
      style;//,
//      update = false;

  bodies = world.getBodies();
  BUFFERS.length = 0;
  world.publish({
    topic: 'beforeRender'
  });
  
  for (var i = 0; i < bodies.length; i++) {
    body = bodies[i];
    if (!body.hidden && getId(body)) {
      body.state.rendered.isTranslated = isTranslationRenderable(body);
//      body.state.rendered.isRotated = isRotationRenderable(body);
    }
  };
  
  for (var i = 0; i < bodies.length; i++) {
    body = bodies[i];
    id = getId(body);
    if (id && !body.hidden) {
//      style = renderBody(body);
//      if (style) {
//        update = true;
//        styles[getId(body)] = style;
//      }
      
      if (style = renderBody(body)) {
        styles[id] = style;
        BUFFERS.push(style.buffer);
      }
    }
  };

  RENDERED_SINCE_BOUNDS_CHANGE = true;
//  RERENDER = !update;
  RERENDER = !BUFFERS.length;
  if (!RERENDER) {
//    postMessage({
//      topic: 'render',
//      bodies: styles
//    });
    postMessage(msg, BUFFERS);
    if (BUFFERS[0].byteLength) {
      debugger; // transferables not supported
    }
    
//    bodies = getBodies.apply(null, Object.keys(msg.bodies));
//    var i = bodies.length;
//    while (i--) {
//      bodies[i].state.renderData.encoded = newStyleArray();
//    }
  }
  
  world.publish({
    topic: 'postRender',
    rendered: !RERENDER
  });
};

function isTranslationRenderable(body) {
  return body.state.pos.dist(body.state.rendered.pos) > world._opts.positionRenderResolution;
};

function isRotationRenderable(body) {
  return Math.abs(body.state.angular.pos - body.state.rendered.angular.pos) > world._opts.angleRenderResolution;
};

function hasMovedSinceLastRender(body) {
  if (!RENDERED_SINCE_BOUNDS_CHANGE || !body.rendered() || body.state.rendered.isTranslated) // || body.state.rendered.isRotated)
    return true;
  
  if (body.options.frame)
    return hasMovedSinceLastRender(body.options.frame);
  else
    return false;
};

function calcTransform(body) {
  var aabb = getAABB(body),
      pos = body.state.pos,
      scale = body.state.renderData.get('scale'),
      rotate = body.state.renderData.get('rotate'),
//      skew = body.state.renderData.get('skew'),
      m = body.state.renderData.get('transform'),
      invisible = body.state.renderData.get('opacity') == 0,
      minified = arrayEquals(scale, MIN_SCALE);
  
  Physics.util.extend(m, IDENTITY_TRANSFORM);
  if (invisible || minified) {
    if (invisible)
      scale = MIN_SCALE;
    
    Matrix.scale3d(m, scale[0], scale[1], scale[2]);
    Matrix.translate3d(m, -BOUNDS._hw * 2, -BOUNDS._hh * 2, 0);
  }
  else {
    Matrix.rotate3d(m, rotate[0], rotate[1], rotate[2]);
    Matrix.scale3d(m, scale[0], scale[1], scale[2]);
    Matrix.translate3d(m, 
      pos.get(0) - (aabb._hw || 0),
      pos.get(1) - (aabb._hh || 0),
      getZ(body)
    );
  
//    m[4] = Math.atan(skew[1]); // skew X
//    m[1] = Math.atan(skew[0]); // skew Y
  }
  // TODO: skew Z
  
  return m;
//  return [
//    pos.get(0) - (aabb._hw || 0),
//    pos.get(1) - (aabb._hh || 0),
//    getZ(body) //pos.get(2) - (aabb._hd || 0);
//  ];
};

function getZ(body) {
//  if (body.geometry.name == 'point')
//    return -1;
//  else
//    return 0;
//  if (/Page/.test(getId(body))) {
//    if (Math.abs(body.state.pos.get(2)) > 15)
//      debugger;
//  }
    
  return body.state.pos.get(2);
};

function arrayEquals(a, b) {
  var i = a.length;
  if (b.length != i)
    return false;
  
  while (i--) {
    if (a[i] !== b[i])
      return false;
  }
  
  return true;
}

function renderBody(body) {
  var state = body.state,
      rendered = state.rendered,
      wasRendered = body.rendered(),
//      rotation = body.state.renderData.get('rotate'),
      isTranslated = body.state.rendered.isTranslated,
//      isRotated = !arrayEquals(body.state.rotation, body.state.rendered.rotation)), // is only for rendering, so it will be reflected in styleChanged (until we get rotation into physics)
      opacityChanged = !wasRendered || body.state.renderData.isChanged('opacity'), 
      styleChanged = opacityChanged || body.state.renderData.isChanged(),
      style = styleChanged && body.state.renderData.getChanges(), //true),
      styleArrays = body.state.renderData.encoded,
      styleArray,
      transform,
      rx, ry, rz;
        
  if (!wasRendered || styleChanged || isTranslated) {
    if (!style)
      style = {};
    
    styleArray = styleArrays.pop();
    if (!styleArray)
      styleArray = newStyleArray();
    
    if (!wasRendered) {
      body.rendered(true);
    }

    rendered.angular.pos = state.angular.pos;
    rendered.pos.clone(state.pos);
    
//    transform.scale = body.state.renderData.get('scale');
//    transform.transform = getTranslation(body);
//    if (isRotated) {
//      transform.rotate = body.state.rendered.rotation = body.state.rotation;
//      transform.rotate.unit = 'deg';
//    }
    
//    style.transform = calcTransform(body);
    if (styleChanged) {
      Physics.util.extend(body.state.rendered.renderData, style);
//      delete style.skew;
//      delete style.scale;
//      delete style.rotate;
      
//      if (opacityChanged) {
//        if (body.state.renderData.get('opacity') == 0)
//          Matrix.multiply(style.transform, MIN_SCALE_TRANSFORM);
////          transform.scale = MIN_SCALE;
//      }
      
      body.state.renderData.clearChanges();
    }
      
    style.transform = calcTransform(body);
//    if (transform.translate || transform.scale || transform.rotate)
//      style.transform = transform;
    
    return toStyleArray(style, styleArray);
  }
};

function isCurrentlyDragging() {
  return IS_DRAGGING;
};

function getDistanceConstraints(body, armed) {
  var constraints = constrainer._distanceConstraints,
      constraint,
      filtered = [],
      i = constraints.length;
  
  while (i--) {
    constraint = constraints[i];
    if (!constraint.isDisabled() && (body == constraint.bodyA || body == constraint.bodyB)) {
      if (!armed || (armed && constraint.isArmed()))
        filtered.push(constraint);
    }
  }
  
  return filtered;

};

function hasDistanceConstraint(body, armed) {
  var constraints = constrainer._distanceConstraints,
      constraint,
      i = constraints.length;
  
  while (i--) {
    constraint = constraints[i];
    if (!constraint.isDisabled() && (body == constraint.bodyA || body == constraint.bodyB)) {
      if (!armed || (armed && constraint.isArmed()))
        return true;
    }
  }
  
  return false;
};

function hasDragConstraint(body) {
  if (!body)
    return false;
  
  var i = DRAG_CONSTRAINTS.length;
  while (i--) {
    if (DRAG_CONSTRAINTS[i].bodyA == body)
      return true;
  }
  
  return false;
};

function initWorld(_world, stepSelf) {
  IDENTITY_TRANSFORM = Matrix.identity();
  MIN_SCALE_TRANSFORM = Matrix.identity();
  MIN_SCALE_TRANSFORM[0] = MIN_SCALE_TRANSFORM[5] = 0.0001;
  
  world = _world;
  integrator = Physics.integrator('verlet', { drag: CONSTANTS.drag });
  world.integrator(integrator);
  
  constrainer = Physics.behavior('verlet-constraints');
  world.addBehavior(constrainer);

  railroad = Physics.behavior('rails');
  world.addBehavior(railroad);

//  boxer = Physics.behavior('box-constraint-manager');
//  world.addBehavior(boxer);

  if (stepSelf)
    Physics.util.ticker.subscribe(API.step);
  
  Physics.util.extend(Physics.util, {
    once: function(func) { // from underscore
      var ran = false, memo;
      return function() {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
      };
    },
    extendArray: function(target, source) {
      var i = source.length;
      while (i--) {
        target[i] = source[i];
      }
    },
    removeFromTo: function(array, fromIdx, toIdx) {
      var howMany = toIdx - fromIdx;
      for (var i = fromIdx, len = array.length - howMany; i < len; i++) {
        array[i] = array[toIdx++];
      }
  
      array.length = len;
      return array;
    },
    pick: function(obj) {
      var copy = {};
      var keys = concat.apply(ArrayProto, slice.call(arguments, 1)),
          key,
          i = keys.length;
      
      while (i--) {
        key = keys[i];
        if (key in obj) 
          copy[key] = obj[key];
      }
      
      return copy;
    },
    negate: function(fn, context) {
      return function() {
        return !fn.apply(context || this, arguments);
      }
    },
    bindAll: function(context /*, fns */) {
      var fn;
      for (var i = 1; i < arguments.length; i++) {
        fn = arguments[i];
        context[fn] = context[fn].bind(context);
      }
    },
    clamp: function(val, low, high) {
      return Math.max(Math.min(val, high), low);
    },
    truncate: function(x, places) {
      var tmp = Math.pow(10, places);
      return (x * tmp | 0) / tmp;
    },
    now: Physics.util.now || (typeof performance == 'undefined' ? Date.now.bind(Date) : performance.now.bind(performance)),
    loop: function(arr, iterator, reverse) {
      if (reverse) {
        var i = arr.length;
        while (i--) {
          iterator(arr[i]);
        }
      }
      else {
        for (var i = 0, l = arr.length; i < l; i++) {
          iterator(arr[i]);
        }
      }
    },
    unique: function(arr) {
      var seen = [];
      arr.forEach(function(value, index) {
        if (seen.indexOf(value) == -1) {
          seen[seen.length] = value;
        }
      });
      
      return seen;
    }
  });

  DRAG_ANCHOR = Physics.body('point', {
    x: 0, 
    y: 0,
    mass: 100000
  });
  
  world.subscribe('drag', function(data) {
    var bodies = data.bodies,
        body,
        i = bodies.length;
  
    while (i--) {
      body = bodies[i];
      if (!hasDragConstraint(body)) {
        DRAG_CONSTRAINTS.push(constrainer.distanceConstraint(body, DRAG_ANCHOR, 0.99, body.state.pos.dist(DRAG_ANCHOR.state.pos)));
      }
    }
    
    IS_DRAGGING = true;
    DRAG_ANCHOR.fixed = true;
    DRAG_ANCHOR.state.pos.vadd(data.vector);
  });

  world.subscribe('dragend', function(data) {
    IS_DRAGGING = false;
    var scratch = Physics.scratchpad(),
        v = scratch.vector().clone(data.vector).mult( 1 / 500 ),
        i = DRAG_CONSTRAINTS.length,
        cst;
    
//    log("DRAG END: " + v.norm());
    while (i--) {
      cst = DRAG_CONSTRAINTS[i];
      constrainer.remove(cst);
      cst.bodyA.accelerate(v);
    }

    DRAG_CONSTRAINTS.length = 0;
    DRAG_ANCHOR.stop();
    DRAG_ANCHOR.fixed = false;
    scratch.done();
//    world.subscribe('integrate:positions', killDrag, this, 1000);
  });

//  function killDrag() {
//    IS_DRAGGING = false;
//    DRAG_FINISH_PENDING = false;
//    world.unsubscribe('integrate:positions', killDrag);
//    var i = DRAG_CONSTRAINTS.length;
//    while (i--) {
//      constrainer.remove(DRAG_CONSTRAINTS[i]); 
//    }
//    
//    DRAG_ANCHOR.stop();
//    DRAG_CONSTRAINTS.length = 0;
//  };
  
//  world.subscribe('drag', function(data) {
//    var bodies = data.bodies,
//        body,
//        tracker,
//        i = bodies.length;
//  
////    log('DRAG ' + data.vector.toString());
//    while (i--) {
//      body = bodies[i];
//      body.fixed = true;
//      body.state.pos.vadd(data.vector);
//      body.stop();
//    }
//    
//    i = DRAG_TRACKERS.length;
//    while (i--) {
//      tracker = DRAG_TRACKERS[i];
//      if (tracker.canTrack(data)) {
//        tracker.body.state.pos.vadd(data.vector);
//        if (tracker.isTrackingPosition()) {
//          tracker.body.fixed = true;
//          tracker.body.stop();
//        }
//      }
//    }
//  }, null, 100);
//
//  world.subscribe('dragend', function(data) {
//    var stop = data.stop,
//        bodies = data.bodies,
//        body,
//        tracker,
//        scratch = Physics.scratchpad(),
//        v = scratch.vector().clone(data.vector).mult( 1 / 10 ),
//        i = bodies.length;
//      
////    log('DRAGEND ' + data.vector.toString());
//    while (i--) {
//      body = bodies[i];
//      body.fixed = false;
//      if (stop)
//        body.stop();
//      else
//        body.state.vel.clone(v);
//    }
//    
//    i = DRAG_TRACKERS.length;
//    while (i--) {
//      tracker = DRAG_TRACKERS[i];
//      if (tracker.canTrack(data)) {
//        tracker.body.state.pos.vadd(data.vector);
//        if (tracker.isTrackingPosition()) {
//          tracker.body.fixed = false;
//          if (stop)
//            tracker.body.stop();
//          else
//            tracker.body.state.vel.clone(v);
//        }
//      }
//    }
//    
//    scratch.done();
//  }, null, 100);
  
//  world.subscribe('integrate:velocities', function(data) {
//    var i = airDragBodies.length,
//        body;
//    
//    while (i--) {
//      body = airDragBodies[i];
//      if (!body.fixed) {
//        body.state.vel.mult(body.options.drag);
//        body.state.old.vel.clone(body.state.vel);
//      }
//    }   
//  });
//  
//  world.subscribe('remove:body', function(data) {
//    removeTrackers(data.body);
//    removeDragTracker(data.body);
//  });
  
  world.subscribe('add:body', function(data) {
    var body = data.body,
        renderData = body.options.renderData,
        id = getId(body),
        prop;
    
//    if (id) {
//      body._id = getId(body);
//      if (world.getBodies().filter(function(b) {return getId(b) == id}).length > 1)
//        debugger;
//    }

    if (renderData) {
      for (prop in renderData) {
        body.state.renderData.set(prop, renderData[prop], null, true); // silent
      }          
    }
    
    if (body.options.style) {
      API.style(body, body.options.style);
      Physics.util.extend(body.state.rendered.renderData, body.options.style); // this is initial style, already set
      body.state.renderData.clearChanges(); // this is initial style, already set
    }

//    if (body.options.drag)
//      airDragBodies.push(body);
    
//    if (body.geometry.name == 'point' && body.options.render)
//      body.state.renderData.set('opacity', 1);
//    
//    body.state.beforeAction = {};
//    body.state.renderDataBeforeAction = {};
  });

//  world.subscribe('remove:body', function(data) {
//    var idx = airDragBodies.indexOf(data.body);
//    if (~idx)
//      airDragBodies.splice(idx, 1);
//  });

  Physics.util.ticker.start();
  DIR_MAP.up = DIR_Y_POS = Physics.vector(0, -1);
  DIR_MAP.down = DIR_Y_NEG = Physics.vector(0, 1);
  DIR_MAP.left = DIR_X_NEG = Physics.vector(-1, 0);
  DIR_MAP.right = DIR_X_POS = Physics.vector(1, 0);
  DIR_MAP['in'] = DIR_Z_POS = Physics.vector(0, 0, 1);
  DIR_MAP.out = DIR_Z_NEG = Physics.vector(0, 0, -1);
};

function getId(body) {
  return body.options._id;
};

function getRailBody(bodyId) {
  return getBody('rail-' + bodyId);
};

function getBoxBody(bodyId) {
  return getBody('box-' + bodyId);
};

function getContainer(bodyId) {
  var container = getBody(bodyId).options.container;
  return container && getBody(container);
};

function getZSpace(bodyId) {
  var container = getContainer(bodyId),
      perspective = container && container.state.renderData.get('perspective');
  
  return perspective ? parseFloat(perspective) : 0;
};

function getBody(bodyId) {
  return typeof bodyId == 'string' ? getBodies(bodyId)[0] : bodyId;
}

/**
 * @param map - if true, returns a map from id to body, otherwise an array 
 */
function getBodies(/* ids, map */) {
  var args = arguments,
      makeMap = typeof arguments[arguments.length - 1] == 'boolean' && arguments[arguments.length - 1] == true,
      layoutManager,
      bodies,
      bodiesArrays = [world.getBodies()],
      body,
      id,
      filtered = makeMap ? {} : [],
      i;
    
  if (args[0] instanceof Array)
    args = args[0];
  
  i = layoutManagers.length;
  while (i--) {
    layoutManager = layoutManagers[i];
    bodiesArrays.push(layoutManager.getBricks());
  }

  for (var j = 0; j < bodiesArrays.length; j++) {
    bodies = bodiesArrays[j];
    i = bodies.length;
    while (i--) {
      body = bodies[i];
      if ((id = getId(body)) && ~indexOf.call(args, id)) {
        if (makeMap)
          filtered[id] = body;
        else
          filtered.push(body);
      }
    }
  }
    
  return filtered;
};



/**
 * Event system hack - these proxy to PubSub.prototype.subscribe/unsubscribe
**/

function subscribe(topic, handlerName, scope, priority) {
  var _subscribe = this.subscribe,
      _unsubscribe = this.unsubscribe;
    
  if (Physics.util.isObject(topic)) {
    for ( var t in topic ){                    
      this.subscribe( t, topic[ t ], handlerName, scope );
    }
    
    return;
  };
  
  function proxy(data) {
    postMessage({
      topic: topic,
      handler: handlerName,
      data: data
    });
  };

  if (!this._workerSubscribers)
    this._workerSubscribers = {};
    
  if (!this._workerSubscribers[topic])
    this._workerSubscribers[topic] = [];
  
  this._workerSubscribers[topic].push(handlerName); // store by name
  _subscribe.call(this, topic, proxy, scope, priority);
};

function unsubscribe(topic, handlerName) {
  var _unsubscribe = this.unsubscribe;
  if (!this._workerSubscribers)
    throw "I never subscribed to events";
    
  var subscribed = this._workerSubscribers[topic],
    idx;
    
  if (!subscribed)
    throw "I never subscribed to this topic";
    
  idx = subscribed.indexOf(handlerName);
  if (~idx)
    _unsubscribed.call(this, subscribed.splice(idx, 1));
};

function getRectVertices(width, height) {
  return [
    {x: 0, y: 0},
    {x: width, y: 0},
    {x: width, y: height},
    {x: 0, y: height}
  ];
};

/** END Event system hack **/

// START LAYOUT MANAGER
//(function(root) {
  var defaultSlidingWindowOptions = {
//    maximumVelocity: 10,
    minPagesInSlidingWindow: 3, // should depend on size of visible area of the list, speed of device, RAM
    maxPagesInSlidingWindow: 6, // should depend on size of visible area of the list, speed of device, RAM
    averageBrickScrollDim: 50,
    averageBrickNonScrollDim: 50,  
    averageBricksPerScrollDim: 5,  
    averageBricksPerNonScrollDim: 3,  
    minBricks: 10,
    maxBricks: 10,
    bricksPerPage: 10,
    defaultAddDelta: 1, // 1 page worth of bricks
//    numBricks: 0,
    gutterWidthHorizontal: 0,
    gutterWidthVertical: 0,
//    lastObtainedRange: {
//      from: 0,
//      to: 0
//    },
//    lastRequestedRange: {
//      from: 0,
//      to: 0
//    },
    slidingWindowDimension: 0,
    horizontal: false
//    ,
//    edgeConstraintStiffness: CONSTANTS.constraintStiffness
  };
  
  function updateBrick(brick, data) {
    var width, height, 
        aabb;
    
    if (data.hasOwnProperty('vertices'))
      brick.geometry.setVertices(data.vertices);
    else if (data.hasOwnProperty('width') || data.hasOwnProperty('height')) {
      aabb = getAABB(brick);
      width = data.hasOwnProperty('width') ? data.width : aabb._hw * 2;
      height = data.hasOwnProperty('height') ? data.height : aabb._hh * 2;
      brick.geometry.setVertices(getRectVertices(width, height));
    }
    
    if (data.hasOwnProperty('mass'))
      brick.mass = data.mass;
    
    brick.recalc();
  };

  /**
   * Layout Manager (supports sliding window, uses masonry to lay out bricks)
   */
  function LayoutManager(id, options, callbackId) {
    this.id = id;
    this._callbackId = callbackId;
    if (options.hasOwnProperty('gutterWidth'))
      options.gutterWidthHorizontal = options.gutterWidthVertical = options.gutterWidth;
    
    Physics.util.extend(this, Physics.util.clone(defaultSlidingWindowOptions, true), options);
    this.options = Physics.util.pick(options, 'minPagesInSlidingWindow', 'maxPagesInSlidingWindow');

    this.masonryOptions = {};
    this.init();
  };
  
  LayoutManager.prototype = {
    // TODO: sleep / wake sliding window
    _sleeping: false,
    _waiting: false,
    _eventSeq: 0,
    constraints: null,
  //  _waiting: false,
    init: function() {
      var self = this,
          masonryOptions = this.masonryOptions,
          doSlidingWindow = this.slidingWindow,
          constantsEvent;
      
      this.reset();
      this._listeners = {};
      this.scrollbarId = this.scrollbar;
      if (this.scrollbarId)
        this.scrollbar = getBody(this.scrollbarId);
      
      if (this.horizontal) {
        this.dirHead = DIR_X_NEG;
        this.dirTail = DIR_X_POS;
        this.axis = 'x';
        this.orthoAxis = 'y';
        this.axisIdx = 0;
        this.orthoAxisIdx = 1;
        this.aabbAxisDim = '_hw';
        this.aabbOrthoAxisDim = '_hh';
      }
      else {
        this.dirHead = DIR_Y_POS;
        this.dirTail = DIR_Y_NEG;
        this.axis = 'y';
        this.orthoAxis = 'x';
        this.axisIdx = 1;
        this.orthoAxisIdx = 0;
        this.aabbAxisDim = '_hh';
        this.aabbOrthoAxisDim = '_hw';
      }
        
      if (this.scrollbar)
        this.scrollbarRail = API.addRail(this.scrollbar, this.axis == 'x' ? 1 : 0, this.axis == 'y' ? 1 : 0);

      this._rangeChangeListeners = [];
      this.constraints = [];
      
//      if (this.flexigroup) {
////        this.flexigroup = masonryOptions.flexigroup = getBody(this.flexigroup);
//        var options = {};
//        options.lock = {};
//        options.lock[this.orthoAxis] = 0;
//        options[this.axis] = -BOUNDS[this.aabbAxisDim] * 5;
//        options[this.orthoAxis] = BOUNDS[this.aabbOrthoAxisDim];
//        this.flexigroup = API.addBody('point', Physics.util.extend({
//          _id: this.container
//        }, this.container.options, options));
//      }

      if (this.flexigroup) {
        this.constrainer = Physics.behavior('verlet-constraints');
        world.addBehavior(this.constrainer);
        
        this.flexigroupOffset = -100000;
        this.flexigroupId = this.flexigroup;
        masonryOptions.flexigroup = this.flexigroup = getBody(this.flexigroupId);
        this.flexigroup.hidden = true;
        this.flexigroup.mass = 10000;
        this.flexigroup.state.pos.setComponent(this.axisIdx, this.flexigroupOffset);
        this.flexigroup.state.pos.setComponent(this.orthoAxisIdx, this.bounds[this.aabbOrthoAxisDim]);
        this._subscribe('remove:body', this._onRemoveBody);
      }
      else {
        this.flexigroupOffset = 0;
        this.containerId = this.container;
        this.container = getBody(this.containerId);
      }
  
      this.offsetBody = this.flexigroup || this.container;
      this._initialOffsetBodyPos = Physics.vector(this.offsetBody.state.pos);
      this._lastOffset = Physics.vector(this.offsetBody.state.pos);
      this.headEdge = Physics.body('point', {
        _id: Physics.util.uniqueId('headEdge'),
        fixed: true,
        x: this._lastOffset.get(0),
        y: this._lastOffset.get(1),
        mass: 1
      });
  
      this.log("SET HEAD EDGE TO " + this.headEdge.state.pos.get(this.axisIdx));
      this.headEdgeConstraint = API.distanceConstraint(this.offsetBody, this.headEdge, this.getSpringStiffness(), 0, this.dirHead);
      this.headEdgeConstraint.damp(this.getSpringDamping());
//      this.headEdgeConstraint.breakOn(Physics.util.negate(this.shouldArmHead.bind(this.headEdgeConstraint, this))); // pass in self as first param
//      this.headEdgeConstraint.breakOn(function() {
//        return self.offsetBody.state.pos.dist(self.headEdge.state.pos) < 1 && self.offsetBody.state.vel.norm() < 0.1;
//      });
      
      // this one doesn't work because if we're not at range 0-X, we don't know where the head edge should be yet
//      this.headEdgeConstraint.armOnDistance(Infinity, this.dirHead); // no matter how far out of bounds we are, we should snap back
  //    this.headEdgeConstraint.breakOnDistance(50, DIR_Y_NEG);
      if (this.bounds)
        this.setBounds(this.bounds); // convert to Physics AABB
      
      this._calcSlidingWindowDimensionRange();
      Physics.util.extend(masonryOptions, Physics.util.pick(this, 'bounds', 'horizontal', 'oneElementPerRow', 'oneElementPerCol', 'gutterWidthHorizontal', 'gutterWidthVertical'));
      if (this.oneElementPerRow || this.oneElementPerCol)
        this.averageBrickNonScrollDim = this.pageNonScrollDim;
        
//      if (doSlidingWindow) {
//        this._subscribe('integrate:velocities', this._onIntegrateVelocities, this, -Infinity); // lowest priority
        this._subscribe('integrate:positions', this._onIntegratePositions, 1); // lowest priority
//        this._onIntegratePositions = Physics.util.throttle(this._onIntegratePositions.bind(this), 30);
//        this._onIntegrateVelocities = Physics.util.throttle(this._onIntegrateVelocities.bind(this), 30);
//        Physics.util.bindAll(this, '_onIntegratePositions'); //, '_onIntegrateVelocities');
//        this._onIntegratePositions = this._onIntegratePositions.bind(this);
//        this._onIntegrateVelocities = this._onIntegrateVelocities.bind(this);        
//      }
      
      this.mason = new Mason(masonryOptions);
      if (this.bricks) {
        this.range.to = this.bricks.length;
        this.addBricks(this.bricks);
        delete this.bricks; // let mason keep track
      }
      
//      var dirSign,
//          lastSign,
//          timesCrossedThreshold,
//          MAX_BOUNCES = 1;
//  
//      function resetConstraint() {
//        dirSign = lastSign = null;
//        timesCrossedThreshold = 0;
//      };
//      
//      resetConstraint();
      // TODO: subscribe/unsubscribe on arm/break

//      world.subscribe('constants.springDamping', function() {
//        this.headEdgeConstraint.damp(CONSTANTS.springDamping);
//        if (this.tailEdgeConstraint)
//          this.tailEdgeConstraint.damp(CONSTANTS.springDamping);
//      }, this);
//
//      world.subscribe('constants.springStiffness', function() {
//        this.headEdgeConstraint.stiffness = CONSTANTS.springStiffness;
//        if (this.tailEdgeConstraint)
//          this.tailEdgeConstraint.stiffness = CONSTANTS.springStiffness;
//      }, this);

      constantsEvent = (this.scrollerType ? this.scrollerType + ':' : '') + 'constants';
      this._subscribe(constantsEvent, this._onConstantEvent);
      this._subscribe('beforeRender', this._onBeforeRender);
      this._subscribe('postRender', this._onPostRender);
      
      if (this.jiggle)
        this._subscribe('sleep:' + this.id, this._onSleep);
      
      if (this.squeeze) 
        API.squashAndStretch(this.offsetBody, this.offsetBody);
      
      if (this.tilt) // TODO: make sure only one thing is rotating the container
        API.rotateWhenMoving(this.offsetBody, getContainer(this.offsetBody), this.axisIdx, this.orthoAxisIdx, this.tilt, this.gradient);
      
      this._initialized = true;
      this.enableEdgeConstraints();
      this['continue']();
    },
    
    _onSleep: function() {
      var bricks = this.mason.bricks,
          brick,
          i = this.mason.bricks.length;
      
      while (i--) {
        brick = bricks[i];
        brick.state.renderData.set('rotate', ZERO_ROTATION); // TODO: when 3d rotation comes to physics, use the actual physical rotation
      }
    },
    
    _onConstantEvent: function(data) {
      var name = data.name,
          value = data.value;
      
      this[name] = value;
      
      switch (name) {
      case 'springDamping':
        this.headEdgeConstraint.damp(value);
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.damp(value);
        
        break;
      case 'springStiffness':
        this.headEdgeConstraint.stiffness = value;
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.stiffness = value;
        
        break;
      case 'drag':
        
        break;
//      case 'drag':
//        var bricks = this.mason.bricks,
//            i = bricks.length,
//            brick;
//        
//        while (i--) {
//          brick = bricks[i];
//          if (!brick.options.hasOwnProperty('drag'))
//            airDragBodies.push(bricks[i]);
//            
//          brick.options.drag = value;
//        }
//
//        if (!this.container.options.hasOwnProperty('drag'))
//          airDragBodies.push(this.container);
//
//        this.container.options.drag = value;
//        break;
      }
    },
    
    _onBeforeRender: function() {
      var bricks = this.mason.bricks,
          brick,
          i = bricks.length;
      
      if (this._sleeping) {
        while (i--) {
          brick = bricks[i];
          API.completePendingActions(brick);
          world.removeBody(brick);
        }
        
        if (this.scrollbar)
          world.removeBody(this.scrollbar);

        return;
      }
      else if (!this._transitioning) {
        while (i--) {
          this.beforeRender(bricks[i]);
        }          
      }
    },
    
    _onPostRender: function() {
      if (this._sleeping && this.numBricks()) {
        world.remove(this.mason.bricks);
        return;
      }        
    },
    
    _onRemoveBody: function(data) {
      var body = data.body;
      if (this.getBricks().indexOf(body) == -1)
        return;
      
      var csts = this.constraints,
          i = csts.length;
      
      while (i--) {
        c = csts[i];
        if (body == c.bodyA) {
//              constrainer.remove(c);
          Physics.util.removeFromTo(csts, i, i + 1);
          break;
        }
      }
    },
    
    _subscribe: function(event, handler, priority) {
      var orig = handler,
          handlers = this._listeners[event] = this._listeners[event] || [];
      
      this.log("SUBSCRIBE: " + event);
      handler = handler.bind(this);
      handler._orig = orig;
      world.subscribe(event, handler, null, priority);      
      handlers.push(handler);
    },
    
    _once: function(event, handler, priority) {
      var self = this;
      var proxy = Physics.util.once(function() {
        handler.apply(this, arguments);
        log("1. UNSUBSCRIBE");
        self._unsubscribe(event, proxy);
      });
      
      this._subscribe(event, proxy, priority);
    },

    _unsubscribe: function(event, handler) {
//      if (onNextTick) {
        var self = this;
//        setTimeout(function() {
//          self.log("UNSUBSCRIBE: " + event);
          self._doUnsubscribe(event, handler);
//        }, 1);
//      }
//      else
//        self._doUnsubscribe(event, handler);
    },
    
    _doUnsubscribe: function(event, handler) {
      var handlers = this._listeners[event],
          unsubscribed = false,
          i = handlers && handlers.length;
      
      if (!i)
        return;
      
      while (i--) {
        var hi = handlers[i];
        if (handler && (handler == hi || handler == hi._orig)) {
          world.unsubscribe(event, hi);
          handlers.splice(i, 1);
          unsubscribed = true;
          break;
        }
        else {
          world.unsubscribe(event, hi);
          handlers.length--;
          unsubscribed = true;
        }
      }
    },
    
    breakHeadEdgeConstraint: function(data) {
  //    resetConstraint();
  //    if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) < this.headEdge.state.pos.get(this.axisIdx))
//      if (!this.shouldArmHead()) {
        var scratchpad = Physics.scratchpad(),
            dist = scratchpad.vector().clone(this.headEdgeConstraint.bodyB.state.pos).vsub(this.headEdgeConstraint.bodyA.state.pos).proj(this.dirHead);
        
        scratchpad.done();
//        this.log("BREAKING HEAD EDGE CONSTRAINT, dist: " + dist);
        this.headEdgeConstraint['break']();
//      }
    },

    breakTailEdgeConstraint: function(data) {
  //    resetConstraint();
  //    if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) < this.headEdge.state.pos.get(this.axisIdx))
//      if (!this.shouldArmTail()) {
//        this.log("BREAKING TAIL EDGE CONSTRAINT");
        this.tailEdgeConstraint['break']();
//      }
    },

    getScrollVelocity: function() {
      return this.offsetBody.state.vel.norm();
    },
    
    beforeRender: function(body) {
      this.calcOpacity(body);
    },

    calcOpacity: function(body) {
//      if (body.state.renderData.isChanged('opacity'))
//        return;
//      
//      var opacity = 1;
      var opacity;
      if (body.geometry.name == 'point') // HACK for now, as we use points to represent all kinds of shapes for now
        opacity = MAX_OPACITY;
      else if (hasMovedSinceLastRender(body)) {
        var overlap = getOverlapArea(body, BOUNDS, body.geometry._area, BOUNDS_AREA);
//        return overlap / body.geometry._area;
//        opacity = overlap > 0 ? 1 : 0;
        if (overlap > 0)
          opacity = MAX_OPACITY;
        else {
          if (body.state.renderData.get('opacity') >= MAX_OPACITY) {
            if (overlap < -1000)//-2 * Math.max(BOUNDS._hw, BOUNDS._hh))
              opacity = 0;
          }
          else {
            if (overlap > -700)
              opacity = MAX_OPACITY;
          }
        }
      }
      
      if (typeof opacity != 'undefined')
        body.state.renderData.set('opacity', opacity);
    },

    hasActionsPending: function() {
      return hasActionsPending(this.container) || hasActionsPending(this.offsetBody);
    },
    
    cancelPendingActions: function() {
      if (this.container) API.cancelPendingActions(this.container);
      if (this.offsetBody) API.cancelPendingActions(this.offsetBody);
    },
    
    checkEdgeConstraints: function() {
//      this.log("Checking edge constraints");
      if (this.hasActionsPending())
        return;
      
//      if (hasDragConstraint(this.container) || hasDragConstraint(this.offsetBody))
//        return;

      this.checkHeadConstraint();
      this.checkTailConstraint();
    },
    
    checkHeadConstraint: function() {
//      this.log("Checking head edge constraints");
      if (!this.headEdgeConstraint || this.range.from != 0)
        return;
      
      var scratchpad = Physics.scratchpad(),
          c = this.headEdgeConstraint,
          dist = scratchpad.vector().clone(c.bodyB.state.pos).vsub(c.bodyA.state.pos).proj(this.dirHead);
      
      scratchpad.done();
      c[dist > 0 ? 'arm' : 'break']();
    },
    
    checkTailConstraint: function() {
      if (!this.tailEdgeConstraint || this.range.to != this.getKnownLimit())
        return;
        
      var scratchpad = Physics.scratchpad(),
          c = this.tailEdgeConstraint,
          dist = scratchpad.vector().clone(c.bodyB.state.pos).vsub(c.bodyA.state.pos).proj(this.dirTail);
      
      scratchpad.done();
      c[dist > 0 ? 'arm' : 'break']();
    },

    getKnownLimit: function() {
      return this.brickLimit == Infinity ? this.lastBrickSeen : this.brickLimit;
    },
    
    tiltBricksInertially: function() {
      if (!this.numBricks())
        return;
      
      var minDelta = 0.0001,
          maxDelta = 0.001,
          angles = [0, 0, 0],
          v = Physics.util.truncate(this.offsetBody.state.vel.get(this.axisIdx), 3),
          rotation = this.mason.bricks[0].state.renderData.get('rotate'),
          r = rotation[this.orthoAxisIdx],
          newR = v ? -sign(v) * Math.log(Math.abs(v + sign(v))) / 50 : 0,
          bricks = this.mason.bricks,
          i = bricks.length;
      
      newR = Math.max(
        Math.min(newR, r + maxDelta, Math.PI / 4),
        r - maxDelta,
        -Math.PI / 4
      ); // don't allow r to change too fast
      
      if (Math.abs(newR) < minDelta) {
        if (r == 0)
          return;
        else
          newR = 0;
      }
      else if (Math.abs(newR - r) < minDelta)
        return;

//      log("ROTATION: " + newR + " for VELOCITY: " + v);
      Physics.util.extend(angles, rotation);
      angles[this.orthoAxisIdx] = newR;
//      rotateBody.state.renderData.set('rotate', angles);
      
      while (i--) {
        brick = this.mason.bricks[i];
        brick.state.renderData.set('rotate', angles);
      }      
    },
    
//    tiltBricksInertially: function() {
//      var containerRail = getRailBody(getId(this.offsetBody)),
//          railPos = containerRail.state.pos,
//          viewport = this.getViewport(),
//          perspective = getZSpace(this.offsetBody),
////          scaleRatio = Math.min(this.bounds._hw / aabb._hw, this.bounds._hh / aabb._hh),
//          // scaleRatio = perspective / (perspective - translateZ) --> translateZ = perspective - perspective / scaleRatio
////          z = perspective - (perspective / scaleRatio),
//          z = perspective, // - this.offsetBody.state.pos.get(2),
//          bricks = this.mason.bricks,
//          brick,
//          brickX,
//          brickY,
//          i = bricks.length,
////          destCoords = [null, null, z],
//          scratch = Physics.scratchpad(),
//          normal = scratch.vector(),
//          tmp = scratch.vector(),
//          destination = scratch.vector().clone(railPos),
//          rotate = [0, 0, 0];
//
//      while (i--) {
//        brick = bricks[i];
//        brickX = this.offsetBody.state.pos.get(0) + brick.state.pos.get(0);
//        brickY = this.offsetBody.state.pos.get(1) + brick.state.pos.get(1);
//        normal.set(-this.bounds._hw + brickX, this.bounds._hh - brickY, z);
//        rotate[0] = -tmp.clone(normal).setComponent(0, 0).angle3d(DIR_Z_POS);
//        rotate[1] = tmp.clone(normal).setComponent(1, 0).angle3d(DIR_Z_POS);
////        rotate[0] = -tmp.clone(normal).setComponent(0, 0).angle3d(DIR_Z_POS);
////        rotate[1] = -tmp.clone(normal).setComponent(1, 0).angle3d(DIR_Z_POS);
////        rotata[2] = ?
//        brick.state.renderData.set('rotate', rotate);
//      }      
//
//      scratch.done();
//    },

    getBrick: function(id) {
      var brick = getBody(id),
          bricks,
          i;
      
      if (brick)
        return brick;

      // we may have the brick, but it might not be participating in the world yet
      bricks = this.mason.bricks;
      i = bricks.length;
      while (i--) {
        brick = bricks[i];
        if (getId(brick) == id)
          return brick;
      }
      
      return null;
    },

    attachHeader: function(header, acceleration) {
      header = getBody(header);
      var self = this,
          up = Physics.vector(DIR_Y_POS),
          down = Physics.vector(DIR_Y_NEG),
          vel,
          a,
          initialPos = Physics.vector(header.state.pos);
      
      function onIV() {        
        a = null;
        vel = self.offsetBody.state.vel.get(self.axisIdx);
        if ((self.headEdge.state.pos.dist(self.offsetBody.state.pos) < self.bounds[self.aabbAxisDim] * 2) ||
            (self.tailEdge && self.tailEdge.state.pos.dist(self.offsetBody.state.pos) < self.bounds[self.aabbAxisDim] * 2)) {
          if (!header.state.pos.equals(initialPos))
            a = down;
        }
        else {
          if (vel > 0.1)
            a = down;
          else if (vel < -0.1)
            a = up;
        }
        
        if (a) {
          a.normalize();
          if (vel && sign(vel) != sign(a.get(self.axisIdx)))
            a.mult(Math.abs(vel))
          else
            a.mult(acceleration);
          
          header.accelerate(a);
        }
      };
      
      world.subscribe('integrate:velocities', onIV);
      world.subscribe('remove:body', function onremove(data) {
        if (data.body == header || data.body == self.offsetBody) {
          world.unsubscribe('remove:body', onremove);
          world.unsubscribe('integrate:velocities', onIV);
        }
      });    
    },

//    zoomInTo1: function(options) {
//      // TODO: record state to enable zoomOutFrom
//      var self = this,
//          body = this.getBrick(options.body),
//          cancelCallback = options.oncancel,
//          completeCallback = options.oncomplete,
//          aabb = getAABB(body),
//          containerRail = getRailBody(getId(this.offsetBody)),
//          railPos = containerRail.state.pos,
//          viewport = this.getViewport(),
//          perspective = getZSpace(this.offsetBody),
//          scaleRatio = Math.min(this.bounds._hw / aabb._hw, this.bounds._hh / aabb._hh),
//          // scaleRatio = perspective / (perspective - translateZ) --> translateZ = perspective - perspective / scaleRatio
//          z = perspective - (perspective / scaleRatio),
//          destCoords = [0, 0],
//          bodyX = this.offsetBody.state.pos.get(0) + body.state.pos.get(0),
//          bodyY = this.offsetBody.state.pos.get(1) + body.state.pos.get(1),// + aabb._hh,
//          scratch = Physics.scratchpad(),
//          destination = scratch.vector().clone(railPos),
//          accelerationMultiplier,
//          accAction,
//          brickAction,
//          oncomplete,
//          scratch = Physics.scratchpad(),
//          tmp = scratch.vector();
//      
//      this.offsetBody.fixed = true;
//      this.disableEdgeConstraints();
//      destCoords[0] = -(-this.bounds._hw + bodyX);   // negate because we're moving the world not the camera 
//      destCoords[1] = -(-this.bounds._hh + bodyY);   // negate because we're moving the world not the camera
//      accelerationMultiplier = destination.set.apply(destination, destCoords).vsub(railPos).norm() / 1000;
//      options.a *= accelerationMultiplier;
//      scratch.done();
//      
//      accAction = API.accelerateTo(Physics.util.extend({
//        a: options.a,
//        body: containerRail,
//        x: destCoords[0], 
//        y: destCoords[1] 
//      }));
//
//      oncomplete = accAction.oncomplete;
//      accAction.oncomplete = function() {
//        oncomplete.apply(this, arguments);
//        API.flyTo(Physics.util.extend({}, options, {
//          body: containerRail,
//          duration: 1000,
//          z: 2000
//        }));        
//
//        API.flyTo(Physics.util.extend({}, options, {
//          body: body,
//          duration: 1000,
//          z: -1000 - perspective / scaleRatio
//        }));        
//      };
//      
////      brickAction = API.flyTo(Physics.util.extend({}, options, {
////        body: body,
////        z: z,
////        trackAction: {
////          body: containerRail,
////          action: accAction
////        }
////      }));
//
//      scratch.done();
//      return accAction;
//    },

    zoomInTo: function(options) {
      // TODO: record state to enable zoomOutFrom
      var self = this,
          body = this.getBrick(options.body),
          cancelCallback = options.oncancel,
          completeCallback = options.oncomplete,
          oncomplete,
          duration,
          aabb = getAABB(body),
          containerRail = getRailBody(getId(this.offsetBody)),
          railPos = containerRail.state.pos,
          viewport = this.getViewport(),
          perspective = getZSpace(this.offsetBody),
          scaleRatio = Math.min(this.bounds._hw / aabb._hw, this.bounds._hh / aabb._hh),
          // scaleRatio = perspective / (perspective - translateZ) --> translateZ = perspective - perspective / scaleRatio
          z = perspective - (perspective / scaleRatio),
          destCoords = [null, null, z],
          bodyX,
          bodyY,
          scratch = Physics.scratchpad(),
          destination = scratch.vector().clone(railPos),
          accelerationMultiplier,
          accAction,
          scratch = Physics.scratchpad(),
          tmp = scratch.vector();
      
      bodyX = body.state.pos.get(0);
      bodyY = body.state.pos.get(1);// + aabb._hh,
      if (!this.flexigroup) {
        bodyX += this.offsetBody.state.pos.get(0); 
        bodyY += this.offsetBody.state.pos.get(1);// + this.gutterWidthVertical * scaleRatio; // HACK: not sure why it's off-center vertically
      }
      
      this.offsetBody.fixed = true;
      this.disableEdgeConstraints();
      destCoords[0] = -(-this.bounds._hw + bodyX);   // negate because we're moving the world not the camera 
      destCoords[1] = -(-this.bounds._hh + bodyY);   // negate because we're moving the world not the camera
      accelerationMultiplier = destination.set.apply(destination, destCoords).vsub(railPos).norm() / 1000;
      options.a *= accelerationMultiplier;
      scratch.done();
      
      if (options.flyThrough) {
        duration = options.duration || 1000;
        accAction = API.accelerateTo({
          a: options.a,
          body: containerRail,
          x: destCoords[0], 
          y: destCoords[1] 
        });

        oncomplete = accAction.oncomplete;
        accAction.oncomplete = function() {
          oncomplete.apply(this, arguments);
          API.flyTo(Physics.util.extend({}, options, {
            body: containerRail,
            duration: duration,
            z: 2000
          }));        

          API.flyTo(Physics.util.extend({}, options, {
            body: body,
            duration: duration,
            z: -1000 - perspective / scaleRatio
          }));        
        }; 
      }
      else {
        accAction = API[options.snap ? 'snapTo' : 'accelerateTo'](Physics.util.extend(options, {
          body: containerRail,
          x: destCoords[0], 
          y: destCoords[1], 
          z: destCoords[2]
        }));
      }
      
//      tmp.set.apply(tmp, destCoords);
//      API.rotateToAndBack({
//        body: containerRail,
//        forceFollow: 1,
//        y: Math.PI / 2,
//        trackAction: {
//          body: containerRail,
//          action: accAction
//        }
//      });
      
      scratch.done();
      return accAction;
    },

    restoreZoom: function(bodyId, time, callback) {
      if (!this.restoreDestination)
        throw "restore information missing";

      var self = this,
          containerRail = getRailBody(getId(this.offsetBody)),
          scaleAction,
          flyAction,
          dest = [null, 0, 0],
          finished = 2;
      
      function finish() {
        if (--finished == 0) {
//          self._transitioning = false;
          self.offsetBody.fixed = false;
          self.enableEdgeConstraints();
          doCallback(callback);
        }
      };

      dest[this.orthoAxisIdx] = containerRail.state.pos.get(1) / this.offsetBody.state.renderData.get('scale')[1];
//      this._transitioning = true;
      scaleAction = API.scale(containerRail, 1, 1, time, finish);
      flyAction = API.flyTo(containerRail, dest[0], dest[1], dest[2], time, null, finish);
      scaleAction.ratio = flyAction.ratio.bind(scaleAction); // synchronize the two actions
    },
    
    flyToTopCenter: function(bodyId, speed, opacity, callback) {
      var body = this.getBrick(bodyId),
//          railBody = getRailBody(getId(body)),
          pos = body.state.pos,
          viewport = this.getViewport(),
          dest = [0, 0, 0];
      
      dest[this.axisIdx] = viewport.min;
      dest[this.orthoAxisIdx] = this.bounds._pos.get(this.orthoAxisIdx) - this.bounds._hw + body.geometry._aabb._hw;
      API.flyTo(body, dest[0], dest[1], dest[2], speed, opacity, callback);
//      API.scale(body, 2, 2, 2000);
    },
    
    destroy: function(animate, callback) {
      var self = this,
          bricks = this.mason.bricks,
          l = bricks.length,
          destroyed = false;
      
      function doDestroy() {
        if (!destroyed) {
          log("DESTROYING: " + self.id);
          destroyed = true;
          delete layoutManagers[self.id];
          if (l)
            world.remove(bricks);
          
          for (var event in self._listeners) {
            log("2. UNSUBSCRIBE");
            self._unsubscribe(event);
          }

          if (callback)
            doCallback(callback);
        }
      }
      
      if (this.scrollbar)
        world.removeBody(this.scrollbar);
      if (this.constrainer)
        world.removeBehavior(this.constrainer);
      
      if (!animate || !l)
        return doDestroy();
      
      if (this.pop)
        this.popOut(bricks, 1000, 'random', doDestroy);
      else if (this.fade)
        this.fadeOut(bricks, 1000, 'random', doDestroy);
      
    },
    
    transition: function(bricks, totalTime, action, callback) {
      var l,
          style = action.style,
          time = 0,
          timeInc,
          brick;
      
      bricks = bricks || this.mason.bricks;
      l = bricks.length;
      
      if (style == 'sequential') {
        if (totalTime)
          timeInc = totalTime / l;
        else {
          timeInc = 200;
          totalTime = timeInc * l;
        }
      }
      
      for (var i = 0; i < l; i++) {
        brick = bricks[i];
        switch (style) {
        case 'sequential':
          time += timeInc;
          break;
        case 'random':
          time = Math.random() * 3000;
          break;
        case 'simultaneous':
          time = totalTime;
          break;
        }
        
        if (i == l - 1)
          action.fn(brick, time, callback);
        else
          action.fn(brick, time);
      }
    },
    
    getVisibleBricks: function(bricks) {
      brick = bricks || this.mason.bricks;
      var scrollDim,
          scrollAxisPos,
          minScrollAxisPos,
          maxScrollAxisPos,
          viewport = this.getViewport(2),
          axisDimProp = this.aabbAxisDim;
          axisIdx = this.axisIdx;
  
      return bricks.filter(function(b) {
        scrollDim = getAABB(b)[axisDimProp];
        scrollAxisPos = b.state.pos.get(axisIdx);
        minScrollAxisPos = scrollAxisPos - scrollDim;
        maxScrollAxisPos = scrollAxisPos + scrollDim;
        return maxScrollAxisPos > viewport.min && minScrollAxisPos < viewport.max;
      });
    },

    popIn: function(bricks, time, style, callback) {
      var scaleInfo = {
        x: 1,
        y: 1,
        duration: time
      };
      
      this.transition(bricks, time, {
        style: style,
        fn: function(brick, time, callback) {
          scaleInfo.duration = time;
          scaleInfo.body = brick;
          scaleInfo.oncomplete = callback;
          API.scale(scaleInfo);
        }
      }, callback)
    },
    
    popOut: function(bricks, time, style, callback) {
      this.transition(bricks, time, {
        style: style,
        fn: function(brick, time, callback) {
          API.scale(brick, MIN_SCALE[0], MIN_SCALE[1], time, callback);
        }
      }, callback)
    },
    
//    fadeIn: function(bricks, time, style, callback) {
//      var _style = {
//        property: 'opacity',
//        end: MAX_OPACITY,
//        duration: time
//      };
//      
//      this.transition(bricks, time, {
//        style: style,
//        fn: function(brick, time, callback) {
//          API.animateStyle(brick, _style, callback);
//        }
//      }, callback)
//    },
//
//    fadeOut: function(bricks, time, style, callback) {
//      var _style = {
//        property: 'opacity',
//        end: 0,
//        duration: time
//      };
//      
//      this.transition(bricks, time, {
//        style: style,
//        fn: function(brick, time, callback) {
//          API.animateStyle(brick, _style, callback);
//        }
//      }, callback)
//    },
    
    getSpringStiffness: function() {
      return this.hasOwnProperty('springStiffness') ? this.springStiffness : CONSTANTS.springStiffness;
    },

    getSpringDamping: function() {
      return this.hasOwnProperty('springDamping') ? this.springDamping : CONSTANTS.springDamping;
    },

//    setSpringStiffness: function(value) {
//      return this.springStiffness = value;
//    },
//
//    setSpringDamping: function() {
//      return this.springDamping = value;
//    },

    log: function() {
      var args = slice.call(arguments);
      args[0] = this.containerId + " " + args[0];
      log.apply(null, args);
    },
    
    updateBricks: function(data, skipResize) {
      var bricks = this.mason.bricks,
          brick,
          brickId,
          update,
          i = bricks.length,
          j;
      
      while (i--) {
        brick = bricks[i];
        brickId = getId(brick);
        j = data.length;
        while (j--) {
          update = data[j];
          if (update._id == brickId) {
            updateBrick(brick, update);
          }
        }
      }
      
      if (!skipResize)
        this.mason.resize();
    },
    
    _getInfo: function() {
      return Physics.util.pick(this, 'minBricks', 'maxBricks', 'minSlidingPagesInWindow', 'maxSlidingPagesInWindow', 'bricksPerPage');
    },
    
//    requestMore: function(n, atTheHead) {
//      setTimeout(this._requestMore.bind(this, n, atTheHead), 100);
//    },
    
    requestMore: function(n, atTheHead) {
      this._requestMoreTimePlaced = Physics.util.now();
      if (this._waiting)
        return;
      
      if (atTheHead) {
        if (this.range.from == 0)
          debugger;
      }
      else {
        if (this.range.to == this.brickLimit)
          debugger;
      }
      
      this._waiting = true;
      triggerEvent(this._callbackId, {
        type: 'more',
        quantity: n, 
        head: atTheHead,
        info: this._getInfo()
      });
    },

//    requestLess: function(head, tail) {
//      setTimeout(this._requestLess.bind(this, head, tail), 100);
//    },
    
    requestLess: function(head, tail) {
      if (this._waiting)
        return;
      
      this._requestLessTimePlaced = Physics.util.now();
      this._waiting = true;
      triggerEvent(this._callbackId, {
        type: 'less',
        head: head,
        tail: tail,
        info: this._getInfo()
      });
    },

    prefetch: function(n, atTheHead) {
      triggerEvent(this._callbackId, {
        type: 'prefetch',
        head: atTheHead,
        quantity: n || this.bricksPerPage
      });
    },
  
    setBounds: function(bounds) {
//      if (this.bounds && this.bounds._pos) {
//        var offsetHeadX = bounds[0] - this.bounds._pos._[0], 
//            offsetHeadY = bounds[1] - this.bounds._pos._[1],
//            offsetTailX = bounds[2] - this.bounds._pos._[0] - this.pageWidth, 
//            offsetTailY = bounds[3] - this.bounds._pos._[1] - this.pageHeight;
//        
//        this.headEdge.state.pos.add(offsetHeadX, offsetHeadY);
//        if (this.tailEdge)
//          this.tailEdge.state.pos.add(offsetTailX, offsetTailY);
//      }
      
      this.bounds = Physics.aabb.apply(Physics, bounds);
      
  //    this.pageOffset = [this.bounds._pos.get(0) - this.bounds._hw, 
  //                       this.bounds._pos.get(1) - this.bounds._hh];
      
      this.pageWidth = Math.abs(this.bounds._hw * 2);
      this.pageHeight = Math.abs(this.bounds._hh * 2);
      this.log("Page Height: " + this.pageHeight);
      this.pageArea = this.pageWidth * this.pageHeight;
      if (!this.options.minPagesInSlidingWindow) {
        if (this.pageArea < 400 * 400)
          this.minPagesInSlidingWindow = 7;
        else if (this.pageArea < 800 * 800)
          this.minPagesInSlidingWindow = 7;
        else
          this.minPagesInSlidingWindow = 7;
      }
      
      if (!this.options.maxPagesInSlidingWindow) {
        this.maxPagesInSlidingWindow = this.minPagesInSlidingWindow * 2;
      }
      
      this.pageScrollDim = this.horizontal ? this.pageWidth : this.pageHeight;
      this.pageNonScrollDim = this.horizontal ? this.pageHeight : this.pageWidth;  
    },
    
    getDistanceFromHeadToTail: function() {
      var head = this.headEdge.state.pos.get(this.axisIdx),
          tail = this.tailEdge ? this.tailEdge.state.pos.get(this.axisIdx) : this.slidingWindowBounds.max;
          
      return Math.abs(tail - head) + this.pageScrollDim;
    },
    
    _updateScrollbar: function(force) {
//      if (this.scrollbar && this.scrollable) {
        var viewport = this.getViewport(),
            viewportDim = viewport.max - viewport.min,
            slidingWindow = this.slidingWindowBounds,
            slidingWindowDimension = this.slidingWindowDimension,
            limit = this.getKnownLimit(),
            dim = Math.max(6, Math.round(this.pageScrollDim * (this.pageArea / this.averageBrickArea) / limit - 4)),
            aabb = getAABB(this.scrollbar),
//            oldVel = Math.abs(this.scrollbar.state.old.vel.get(this.axisIdx)),
//            vel = Math.abs(this.scrollbar.state.vel.get(this.axisIdx)),
            state = this.scrollbar.state,
            pos = state.pos,
            oldPos = state.old.pos,
            vel = Physics.util.truncate(pos.get(this.axisIdx) - oldPos.get(this.axisIdx), 3),
            currentOpacity = this.scrollbar.state.renderData.get('opacity'),
            axisVal,
            orthoAxisVal,
            opacity,
            percentOffset;
        
        this.scrollbar.state.renderData.set(this.horizontal ? 'width' : 'height', dim); //, 'px');
        if (this.scrollbarRail.railBody.state.pos.get(2) == 0)
          this.scrollbarRail.railBody.state.pos.setComponent(2, 1);

        percentOffset = (this.range.from + ((viewport.min - slidingWindow.min) / slidingWindowDimension) * (this.range.to - this.range.from)) / limit; // estimate which tiles we're looking at
        if (this.flexigroup)
          axisVal = viewportDim * percentOffset;
        else
          axisVal = viewport.min + viewportDim * percentOffset;
        
        if (axisVal != pos.get(this.axisIdx))
          pos.setComponent(this.axisIdx, axisVal);
          
        orthoAxisVal = this.bounds._pos.get(this.orthoAxisIdx) + this.bounds[this.aabbOrthoAxisDim] - aabb[this.aabbOrthoAxisDim] * 2;
        if (orthoAxisVal != pos.get(this.orthoAxisIdx)) {
          this.scrollbarRail.railBody.state.pos.setComponent(this.orthoAxisIdx, orthoAxisVal);
          this.scrollbarRail.railBody.stop();
        }
        
//        pos._[this.axisIdx] = viewport.min + viewportDim * percentOffset;
//        pos._[this.axisOrthoIdx] = this.bounds._pos.get(this.orthoAxisIdx) + this.bounds[this.aabbOrthoAxisDim] - aabb[this.aabbOrthoAxisDim] * 2;
//        pos.set.apply(pos, pos._);
        opacity = Math.max(Math.min(MAX_OPACITY, Math.abs(vel), currentOpacity + OPACITY_INC),
                                                                      currentOpacity - OPACITY_INC/2);
        
        if (Math.abs(opacity - currentOpacity) > 0.01) {
//          log("Velocity: " + vel + ", Opacity: " + opacity);
          this.scrollbar.state.renderData.set('opacity', opacity);
        }
//      }
    },

//    _onIntegrateVelocities: function(data) {
//      if (!this._sleeping && !this._transitioning && !this.headEdgeConstraint.isArmed() && (!this.tailEdgeConstraint || this.tailEdgeConstraint.isArmed())) {
//        var axisVel = this.offsetBody.state.vel.get(this.axisIdx);
//        if (Math.abs(axisVel) > this.maxVelocity) {
//          this.log("Capping velocity at: " + this.maxVelocity);
//          this.offsetBody.state.vel.setComponent(this.axisIdx, this.maxVelocity * sign(axisVel));
//        }
//      }
//    },

    _onIntegratePositions: function() {
      if (this._sleeping || this._transitioning)
        return;

      this.checkEdgeConstraints();
      if (this.scrollbar) 
        this._updateScrollbar();
      
      if (this.tilt)
        this.tiltBricksInertially();
      
//      this.offsetBody.state.renderData.set('perspective-origin-y', (-offset|0) + 'px');
      if (this._waiting)
        return;      

      var offset = this.offsetBody.state.pos.get(this.axisIdx),
          lastOffset = this._lastOffset.get(this.axisIdx),
          diff = offset - lastOffset,
          absDiff = Math.abs(diff);

      if (this.headEdgeConstraint.isArmed() || (this.tailEdgeConstraint && this.tailEdgeConstraint.isArmed()))
        this.offsetBody.state.vel.mult(1 - CONSTANTS.drag); // extra drag
      
      if (this.slidingWindow && absDiff > 50) {
//        if (this._waiting && absDiff < 100)
//          return;
        
        this._lastScrollDirection = diff < 0 ? 'tail' : 'head';
        this._lastOffset.clone(this.offsetBody.state.pos);
        this['continue']();
      }
    },
  
    enableEdgeConstraints: function() {
      log("Enabling edge constraints for " + this.id);
      this.enableHeadConstraint();
      this.enableTailConstraint();
    },
    
    enableHeadConstraint: function() {
      this.disableHeadConstraint(); // clean up any listeners we have attached
      if (this.headEdgeConstraint) {
        log("Enabling head edge constraint for " + this.id);
//        this.headEdgeConstraint.armOn(this.shouldArmHead); // pass in self as first param
        this.headEdgeConstraint.enable();
//        this._subscribe('drag', this.breakHeadEdgeConstraint, 10);
//        this._subscribe('dragend', this.breakHeadEdgeConstraint, 10);
      }
    },
    
    enableTailConstraint: function() {
      this.disableTailConstraint(); // clean up any listeners we have attached
      if (this.tailEdgeConstraint) {
        log("Enabling tail edge constraint for " + this.id);
//        this.tailEdgeConstraint.armOn(this.shouldArmTail); // pass in self as first param
        this.tailEdgeConstraint.enable();
//        this._subscribe('drag', this.breakTailEdgeConstraint, 10);          
//        this._subscribe('dragend', this.breakTailEdgeConstraint, 10);          
      }
    },
  
    disableEdgeConstraints: function() {
      log("Disabling edge constraints for " + this.id);
      this.disableHeadConstraint();
      this.disableTailConstraint();
    },
    
    disableHeadConstraint: function() {
      if (this.headEdgeConstraint) {
        log("Disabling head edge constraint for " + this.id);
        log("3. UNSUBSCRIBE");
//        this._unsubscribe('drag', this.breakHeadEdgeConstraint);
//        this._unsubscribe('dragend', this.breakHeadEdgeConstraint);
//        this.headEdgeConstraint['break']();
        this.headEdgeConstraint.disable();
      }      
    },
    
    disableTailConstraint: function() {
      if (this.tailEdgeConstraint) {
        log("Disabling tail edge constraint for " + this.id);
        log("4. UNSUBSCRIBE");
//        this._unsubscribe('drag', this.breakTailEdgeConstraint);
//        this._unsubscribe('dragend', this.breakTailEdgeConstraint);
//        this.tailEdgeConstraint['break']();
        this.tailEdgeConstraint.disable();
      }
    },
    
    checkHeadEdge: function() {
//      if (this.range.from == 0) {
      if (this.slidingWindow) {
        // head and tail edge swim around
        var coords = new Array(2);
        coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
//        coords[this.axisIdx] = Math.max(this.headEdge.state.pos.get(this.axisIdx), -this.slidingWindowBounds.min);
        coords[this.axisIdx] = -this.slidingWindowBounds.min + this.flexigroupOffset;
        this.headEdge.state.pos.set(coords[0], coords[1]);
      }
//      }
    },

    getTailEdgeCoords: function() {
      var coords = new Array(2);  
      coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
      if (this.slidingWindow) {
        // head and tail edge swim around
//        this.log("Setting tail edge for sliding window layout");
        if (this.range.from == 0 && this.range.to == this.brickLimit && this.slidingWindowDimension < this.pageScrollDim)
          coords[this.axisIdx] = this.headEdge.state.pos.get(this.axisIdx);
        else
          coords[this.axisIdx] = -this.slidingWindowBounds.max + this.pageScrollDim + this.flexigroupOffset; // - this.pageOffset[this.axisIdx];
      }
      else {
//        this.log("Setting tail edge for non-sliding window layout");
        // tail edge depends only on size of the layout and the size of the paint bounds
        if (this.slidingWindowDimension < this.pageScrollDim)
          coords[this.axisIdx] = this.headEdge.state.pos.get(this.axisIdx);
        else {
//          this.log("SW Dim = " + this.slidingWindowDimension + ", pageScrollDim = " + this.pageScrollDim);
          coords[this.axisIdx] = -this.slidingWindowDimension + this.pageScrollDim + this.flexigroupOffset; // NOT the same as in above IF statement
        }
      }
      
      return coords;
    },
    
    checkTailEdge: function() {
      if (this.numBricks() && this.range.to >= this.brickLimit) {
        var self = this,
            coords = this.getTailEdgeCoords();
        
        if (!this.tailEdge) {
          this.tailEdge = Physics.body('point', {
            _id: Physics.util.uniqueId('tailEdge'),
            fixed: true,
            x: coords[0],
            y: coords[1],
            mass: 1
          });
          
          this.tailEdgeConstraint = API.distanceConstraint(this.offsetBody, this.tailEdge, this.getSpringStiffness(), 0, this.dirTail);
          this.tailEdgeConstraint.damp(this.getSpringDamping());
          this.enableTailConstraint();
          this.tailEdgeConstraint['break']();
//          this.tailEdgeConstraint.breakOn(Physics.util.negate(this.shouldArmTail.bind(this.tailEdgeConstraint, this))); // pass in self as first param

          // this one doesn't work because if we're not at range X-LastIndex, we don't know where the tail edge should be yet
//          this.tailEdgeConstraint.armOnDistance(Infinity, this.dirTail); // no matter how far out of bounds we are, we should snap back
//          this.tailEdgeConstraint.breakOnDistance(50, DIR_Y_POS);
        }
        else
          this.tailEdge.state.pos.set(coords[0], coords[1]);
        
        this.tailEdgeConstraint.enable();
        this.log("SET TAIL EDGE TO " + coords[this.axisIdx]);
      }
//      else {
//        if (this.tailEdge) {
//          this.tailEdgeConstraint['break']();
//          this.tailEdgeConstraint.disable();
//          API.removeConstraint(this.tailEdgeConstraint);
//        }
//      }
    },
    
//    setLimit: function(len) {
//      this.log("SETTING BRICK LIMIT: " + len);
////      this._waiting = false;
//      this.brickLimit = len;
//      this.checkTailEdge();
////      this.adjustSlidingWindow();
//    },
    
    /**
     * @param reverse - if true, will place bricks in the direction from tail to head
     * @TODO - reload a subset of bricks and as a result any bricks before and after them 
     */
    reload: function(reverse) {
      var viewport = this.getViewport(),
          multiplier = reverse ? 1 : -1,
          edge = (reverse ? viewport.max : viewport.min) | 0,
          offset;
      
      if (this.flexigroup)
        this.removeFlexigroupConstraints();
      
      log("Reloading layout: " + this.containerId + (reverse ? " tail to head" : ""));
      if (this.slidingWindow) {
        offset = {};
        offset[this.axis] = edge; //Math.max(edge + multiplier * this.pageScrollDim, 0);
        offset[this.orthoAxis] = 0;
        this.mason.option('fromBottom', reverse);
        this.mason.reload(offset);
      }
      else {
        this.mason.option('fromBottom', false);
        this.mason.reload();
      }
      
//        while (i--) {
//          brick = bricks[i];
//          this.constraints.push(API.distanceConstraint(brick, this.flexigroup, stiffness, brick.state.pos.dist(flexiPos), this.dirHead));
//        }
      if (this.flexigroup)
        this.constrainToFlexigroup(this.mason.bricks, reverse);
      
//      this.offsetBody.stop();
      // TODO: redo rails for bricks
    },

    setLimit: function(limit) {
      this.brickLimit = limit; //this.lastBrickSeen || 0;
      this.log("SETTING BRICK LIMIT: " + this.brickLimit);
      this.checkTailEdge();
    },

    unsetLimit: function() {
      this.brickLimit = Infinity;
      if (this.tailEdge) {
        this.disableTailConstraint();
        API.removeConstraint(this.tailEdgeConstraint);
        world.removeBody(this.tailEdge);
        delete this.tailEdgeConstraint;
        delete this.tailEdge;
      }
      
      this.log("UNSETTING BRICK LIMIT");
    },

    reset: function() {
      this.unsetLimit();
      var numBricks = this.numBricks();
      if (numBricks)
        this.removeBricks(numBricks);
      
      this.lastBrickSeen = 0;
      if (!this.range)
        this.range = {};
      
      this.range.from = this.range.to = 0;
      
      if (!this.slidingWindowBounds)
        this.slidingWindowBounds = {};
      
      this.slidingWindowBounds.min = this.slidingWindowBounds.max = 0;
//      if (this.mason && !this._sleeping && !this._waiting)
//        this._adjustSlidingWindow();
      if (numBricks) {
        this.offsetBody.stop(this._initialOffsetBodyPos);
//        return this.requestLess(0, numBricks);
      }
      
      if (this._initialized) {
        if (this.headEdge)
          this.headEdge.state.pos.clone(this._initialOffsetBodyPos);
        this._updateScrollbar(true);
        this._adjustSlidingWindow();
      }
    },
    
    resize: function(bounds, updatedBricks, callback) {
      if (this._sleeping) {
        this._resizeArgs = arguments;
        return;
      }
      
      this._resizeArgs = null;
//      this._waiting = false;
      if (bounds)
        this.setBounds(bounds);
      
      if (updatedBricks)
        this.updateBricks(updatedBricks, true);

      log(this.containerId + ": Disabling edge constraints (temporarily) on resize");
      this.disableEdgeConstraints();
      this.mason.setBounds(this.bounds);
      if (this.numBricks()) {
        // TODO: find brick X currently in view so we can re-find it after masonry reload
        var cols = this.mason.cols,
            newCols;
        
        this.mason._getColumns();
        newCols = this.mason.cols;
        if (cols != newCols || updatedBricks) {
          this.reload(this.lastDirection == 'head' ? true : false);
//          this.mason.reload();
        }
        // TODO: reposition around brick X
      }
      
      this.recalc();
      this.checkHeadEdge();
      this.checkTailEdge();
      log(this.containerId + ": Enabling edge constraints on reset");
      this.enableEdgeConstraints();
      
      if (callback)
        doCallback(callback);
      
      if (!this._waiting)
        this._adjustSlidingWindow();
//      this['continue']();
    },
    
    recalc: function() {
      var gutterWidthH = this.mason.option('gutterWidthHorizontal'),
          gutterWidthV = this.mason.option('gutterWidthVertical'),
          aabb,
          avgWidth = 0,
          avgHeight = 0,
          bricks = this.mason.bricks,
          numBricks = this.numBricks(),
          viewport = this.getViewport(),
          i = numBricks;
      
      Physics.util.extend(this.slidingWindowBounds, this.mason.getContentBounds());
      this.slidingWindowDimension = this.slidingWindowBounds.max - this.slidingWindowBounds.min;
      this.scrollable = this.slidingWindowDimension > viewport.max - viewport.min;
      
      // TODO: prune unused props
//      this.numBricks = bricks.length;
      if (numBricks) {
        while (i--) {
          aabb = getAABB(bricks[i]);
          avgWidth += aabb._hw;
          avgHeight += aabb._hh;
        };
        
        this.averageBrickWidth = avgWidth * 2 / numBricks + gutterWidthH;
        this.averageBrickHeight = avgHeight * 2 / numBricks + gutterWidthV;
        this.averageBrickScrollDim = this.horizontal ? this.averageBrickWidth : this.averageBrickHeight;
        this.averageBrickNonScrollDim = this.horizontal ? this.averageBrickHeight : this.averageBrickWidth;
        this.averageBricksPerScrollDim = this.pageScrollDim / this.averageBrickScrollDim;
        this.averageBricksPerNonScrollDim = this.pageNonScrollDim / this.averageBrickNonScrollDim;
        this.averageBrickArea = this.averageBrickWidth * this.averageBrickHeight;
        this.bricksPerPage = Math.max(2, this.pageArea / this.averageBrickArea | 0);
        this.minBricks = this.minPagesInSlidingWindow * this.bricksPerPage | 0;
        this.maxBricks = this.maxPagesInSlidingWindow * this.bricksPerPage | 0;
      }
      
  //    this.bricksPerPageWidth = width / this.averageBrickWidth;
  //    this.bricksPerpageHeight = height / this.averageBrickHeight;
      this._calcSlidingWindowDimensionRange();
    },
    
    _calcSlidingWindowDimensionRange: function() {
      this.minSlidingWindowDimension = this.pageScrollDim * this.minPagesInSlidingWindow;
      this.maxSlidingWindowDimension = this.pageScrollDim * this.maxPagesInSlidingWindow;
//      var slidingWindowDim = Math.max(this.slidingWindowDimension, (this.maxSlidingWindowDimension + this.minSlidingWindowDimension) / 2);
//      this.slidingWindowInsideBuffer = slidingWindowDim / 2; // how far away the viewport is from the closest border of the sliding window before we start to fetch more resources
      this.slidingWindowInsideBuffer = this.minSlidingWindowDimension; // - this.getViewportDimension();
      this.slidingWindowOutsideBuffer = this.slidingWindowInsideBuffer - this.getViewportDimension();
//      this.slidingWindowOutsideBuffer = Math.max(slidingWindowDim / 5, this.slidingWindowInsideBuffer / 2); // how far away the viewport is from the closest border of the sliding window before we need to adjust the window
    },
    
    getViewportDimension: function() {
      var v = this.getViewport();
      return v.max - v.min;
    },
    
    getViewport: function(scale) {
      if (!this.viewport)
        this.viewport = {};
      
      this.viewport.min = this._initialOffsetBodyPos.get(this.axisIdx) - this.offsetBody.state.pos.get(this.axisIdx);
      this.viewport.max = this.viewport.min + this.pageScrollDim;
      if (!scale)
        return this.viewport;
      else {
        var vDim = this.viewport.max - this.viewport.min;
        return {
          min: this.viewport.min - vDim * scale / 2,
          max: this.viewport.max + vDim * scale / 2
        }
      }
    },

    getBricks: function() {
      return this.mason.bricks || [];
    },
    
    numBricks: function() {
      return this.mason ? this.mason.bricks.length : 0;
    },

    constrainToFlexigroup: function(bricks, prepend) {
      bricks = bricks || this.mason.bricks;
      var brick,
          pos,
          flexiPos = this.flexigroup.state.pos,
          range = 20,
          idx,
          limit = this.brickLimit == Infinity ? 500 : this.brickLimit,
          baseStiffness = 0.08,
          l = bricks.length;
      
    //  this.removeFlexigroupConstraints();
      
      for (var i = 0; i < l; i++) {
        brick = bricks[i];
    ////    pos = brick.state.pos;
    //    if (this.horizontal)
    //      brick._rail = API.addRail(brick, 1, 0);
    //    else
    //      brick._rail = API.addRail(brick, 0, 1);
        
    //    stiffness = 0.07 + Math.random() * 0.1;
    //    stiffness = 0.08 - 0.00025 * (this.mason.bricks.length - l/2 + i);
        if (limit < Infinity) {
          if (prepend)
            idx = this.range.from - l + i;
          else
            idx = this.range.to + i;
          
          stiffness = baseStiffness - Math.min(Math.pow((idx - limit / 2) / limit, 4), 0.05);
        }
        else
          stiffness = baseStiffness;
        
        this.constraints.push(this.constrainer.distanceConstraint(brick, this.flexigroup, stiffness, brick.state.pos.dist(flexiPos), this.dirHead));
      }
      
    //  for (var i = 0, n = this.numBricks(); i < n; i++) {
    //    brick = this.mason.bricks[i];
    //    stiffness = 0.08 - Math.min(Math.pow((i - n/2) / n, 4), 0.05);
    //    this.constraints.push(API.distanceConstraint(brick._rail.railBody, this.flexigroup, stiffness, brick._rail.railBody.state.pos.dist(flexiPos), this.dirHead));
    //  }
    },
    
    removeFlexigroupConstraints: function() {
      this.constraints.length = 0;
      this.constrainer._distanceConstraints.length = 0;
//      bricks = bricks || this.mason.bricks;
//      var csts = this.constraints,
//          i = csts.length;
//      
//      while (i--) {
//        c = csts[i];
//        if (~bricks.indexOf(c.bodyA)) {
////          constrainer.remove(c);
//          Physics.util.removeFromTo(csts, i, i + 1);
//        }
//      }
    },
    
    addBricks: function(optionsArr, prepend) {
      this.log("Bricks took " + (Physics.util.now() - this._requestMoreTimePlaced) + "ms to arrive");
      this.lastDirection = prepend ? 'head' : 'tail';
      this.checkRep();
      var numBefore = this.numBricks(),
          bricks = [],
          brick,
          rail,
          viewport = this.getViewport(),
          viewportDim = BOUNDS[this.aabbAxisDim] * 2,
          viewportOrthoDim = BOUNDS[this.aabbOrthoAxisDim] * 2,
          coords = new Array(3),
          destX, destY, destZ,
          options;
      
      this.scrolled = this.scrolled || viewport.min != 0;
      log("ADDING BRICKS: " + optionsArr.map(function(b) { return parseInt(b._id.match(/\d+/)[0])}).sort(function(a, b) {return a - b}).join(","));
      for (var i = 0, l = optionsArr.length; i < l; i++) {
        options = optionsArr[i];
        if (!this.flexigroup)
          options.frame = this.container;
        
        fixRectVertices(options.vertices);
//        if (!options.hasOwnProperty('drag') && this.hasOwnProperty('drag'))
//          options.drag = this.drag;
        
//        options.z = -1;
        brick = Physics.body('convex-polygon', options);
//        if (this.flexigroup) {
//          pos = brick.state.pos;
//          if (this.horizontal)
//            brick = API.addRail(brick, pos.get(0) - range / 2, pos.get(1), pos.get(0) + range / 2, pos.get(1));
//          else
//            brick = API.addRail(brick, pos.get(0), pos.get(1) - range / 2, pos.get(0), pos.get(1) + range / 2);
//        }
        
        bricks[i] = brick;
      }

      if (!numBefore) {
        this.mason.bricks = bricks;
        this.reload();
      }
      else
        this.mason[prepend ? 'prepended' : 'appended'](bricks);
      
      if (this.flexigroup)
        this.constrainToFlexigroup(bricks, prepend);
      
      if (prepend)
        this.range.from -= l;
      else {
        this.range.to += l;
        this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
        this.brickLimit = Math.max(this.brickLimit, this.lastBrickSeen);
      }
      
      if (this.scrolled) // only be fancy on the first page
        world.add(bricks);
      else if (this.fly) {
        var fix = function(brick) {
          brick.fixed = true;
          brick.state.renderData.set('transform-origin', '0% 0%');
        };
        
        var scrollAxisPos,
            changeOpacity = this.animateOpacity,
            args;
        
        for (var i = 0; i < l; i++) {
          brick = bricks[i];
          scrollAxisPos = brick.state.pos.get(this.axisIdx);
          if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
            destAxis = brick.state.pos.get(this.axisIdx);
            destOrthoAxis = brick.state.pos.get(this.orthoAxisIdx);
            destZ = brick.state.pos.get(2);
            coords[this.axisIdx] = destAxis + (Math.random() * viewportDim * 2 - viewportDim);
            coords[this.orthoAxisIdx] = destOrthoAxis + (Math.random() * viewportOrthoDim * 2 - viewportOrthoDim);
            coords[2] = destZ + (Math.random() * viewportDim * 2 - viewportDim);
            brick.stop(coords[0], coords[1]);
            brick.fixed = false;
            brick.state.renderData.set('transform-origin', '50% 50%');
            args = [brick, null, null, null, 1, changeOpacity ? 1 : null, fix.bind(null, brick)];
            args[this.axisIdx + 1] = destAxis;
            args[this.orthoAxisIdx + 1] = destOrthoAxis;
            args[3] = destZ;
//            this.log("Flying brick " + brick.options._id + " in");
            API.flyTo.apply(API, args);
          }
          
          world.addBody(brick);
        }
      }
      else if (this.pop) {
        var time = 0,
            random = this.pop == 'random' ? true : false,
            visibleBricks = this.getVisibleBricks(bricks);

        world.add(bricks);
        minify(visibleBricks);
        this.popIn(visibleBricks, 
                   random ? bricks.length * 200 : 1000, 
                   this.pop);
        
//        for (var i = 0; i < l; i++) {
//          brick = bricks[i];
//          scrollAxisPos = brick.state.pos.get(this.axisIdx);
//          if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
//            brick.state.renderData.set('scale', MIN_SCALE);
//            if (random)
//              time = Math.random() * 3000;
//            else
//              time += 200;
//            
//            API.scale(brick, 1, 1, time);
////            API.opacity(brick, 1, time/10);
//          }
//          
//          world.addBody(brick);
//        }        
      }
      else if (this.fade) {
        var time = 0,
            random = this.fade == 'random' ? true : false;
        
        for (var i = 0; i < l; i++) {
          brick = bricks[i];
          scrollAxisPos = brick.state.pos.get(this.axisIdx);
          if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
            brick.state.renderData.set('opacity', 0);
            if (random)
              time = Math.random() * 3000;
            else
              time += 200;
            
            API.opacity(brick, 1, time);
          }
          
          world.addBody(brick);
        }        
      }
      else
        world.add(bricks);
      
//      Physics.util.extend(this.lastObtainedRange, this.range); 
      this.recalc();
      if (prepend)
        this.checkHeadEdge();
      else
        this.checkTailEdge();
      
      this.log("ADDED " + l + " BRICKS TO THE " + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
      this.printState();
      //    log("ACTUAL TOTAL AFTER ADD: " + this.numBricks());
      if (this.scrollbar && this.scrollable && this.brickLimit == Infinity) // if we know the total number of bricks we'll ever have, no need to signal by flashing addition of bricks the scrollbar
        this.scrollbar.state.renderData.set('opacity', MAX_OPACITY);
      
      this.checkRep();
      this['continue']();
    },

    printState: function() {
//      this.log("STATE: " + this.mason.bricks.map(function(b) { return parseInt(b._id.match(/\d+/)[0])})/*.sort(function(a, b) {return a - b})*/.join(","));
      this.log("CURRENT RANGE: " + this.range.from + "-" + this.range.to);
    },
    
    checkRep: function() {
      if (!DEBUG)
        return;
      
      var bounds = this.mason.getContentBounds();
      if (this.range.to < this.range.from)
        throw "range integrity lost - range is of a negative length";
      if (this.range.to - this.range.from !== this.mason.bricks.length)
        throw "range integrity lost - saved range doesn't have the same length as the number of bricks in the layout";
      if (isNaN(bounds.min) || isNaN(bounds.max))
        throw "one of sliding window bounds is NaN";
    },
    
    removeBricks: function(n, fromTheHead) {
      if (n == 0)
        return;
      
      this.checkRep();
      var bricks = fromTheHead ? this.mason.bricks.slice(0, n) : this.mason.bricks.slice(this.numBricks() - n),
          brick,
          id,
          i;
      
      if ((i = bricks.length) == 0) {
        debugger;
        return;
      }

      this._once('postRender', function doRemove() {
        world.remove(bricks);
      });
      
      while (i--) {
        brick = bricks[i];
        API.completePendingActions(brick);
        id = getId(brick);
        if (id)
          brick.state.renderData.set('opacity', 0);
      }
      
//      if (n == bricks.length)
//        this.mason.reset();
//      else
    
//      this.mason[fromTheHead ? 'removedFromHead' : 'removedFromTail'](bricks);
//      this.mason.removed(bricks);
      this.mason[fromTheHead ? 'removedFromHead' : 'removedFromTail'](n, bricks);
      
      if (fromTheHead) {
        this.log("REMOVING BRICK RANGE " + this.range.from + '-' + (this.range.from+n));
        this.range.from += n;
      }
      else {
        this.log("REMOVING BRICK RANGE " + (this.range.to-n) + '-' + this.range.to);
        this.range.to -= n;
      }
      
      this.log("REMOVED BRICKS: " + bricks.map(function(b) { return parseInt(getId(b).match(/\d+/)[0])}).sort(function(a, b) {return a - b}).join(","));
      this.printState();
//      this.log("REMOVING " + n + " BRICKS FROM THE " + (fromTheHead ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
  //    log("ACTUAL TOTAL AFTER REMOVE: " + this.numBricks());
      this.recalc();
      this.checkRep();
  //    if (readjust)
  //      this.adjustSlidingWindow();
    },
    
    sleep: function() {
      this.log("putting Mason to sleep");
      world.publish('sleep:' + this.id);
      this._sleeping = this._waiting = true;
      
      // will remove bricks on 'beforeRender'
      log(this.containerId + ": Disabling edge constraints (temporarily) on sleep");
      this.disableEdgeConstraints();
    },

    'continue': function() {
//      if (this._sleeping || this._waiting) {
        this._sleeping = this._waiting = false;
        this._adjustSlidingWindow();
//      }
//      else
//        debugger;
    },
    
    saveState: function(brick) {
      this._saved = true;
      if (!this.savedContainerRailPos)
        this.savedContainerRailPos = Physics.vector();

//      if (!this.savedContainerRenderData)
//        this.savedContainerRenderData = this.offsetBody.state.renderData.toJSON(true);

      this.savedContainerRailPos.clone(getRailBody(getId(this.offsetBody)).state.pos);
//      this.savedContainerRailPos.clone(containerRail.state.pos);
      if (brick) {
        this.savedBrick = this.getBrick(brick);
        this.savedBrickPos = Physics.vector(this.savedBrick.state.pos);
      }
    },

    loadState: function() {
      if (!this._saved)
        return;
      
      this._saved = false;
      var containerRail = getRailBody(getId(this.offsetBody));
      containerRail.state.renderData.set('scale', UNSCALED);
      containerRail.stop(this.savedContainerRailPos);

      if (this.savedContainerRenderData) {
        for (var p in this.savedContainerRenderData) {
          this.offsetBody.state.renderData.set(p, this.savedContainerRenderData[p]);
        }
      }

      if (this.savedBrickPos) {
        this.savedBrick.stop(this.savedBrickPos);
        this.savedBrickPos = this.savedBrick = null;
      }
      
      this.offsetBody.fixed = false;
      this.enableEdgeConstraints();
    },
    
    startTransition: function() {
      this._transitioning = true;
//      this.tilter.pause();
    },

    endTransition: function() {
      this._transitioning = false;
//      this.tilter.unpause();
    },
    
    wake: function() {
      // reposition bricks if necessary
      this.log("waking up Mason");
      world.publish('wake:' + this.id);
      if (this._sleeping && this.numBricks()) {        
        world.add(this.mason.bricks);
        if (this.scrollbar)
          world.addBody(this.scrollbar);
      }
      
      log(this.containerId + ": Enabling edge constraints on wake");
      this.enableEdgeConstraints();
      this['continue']();
    },
    
    getHeadDiff: function() {
      var favor = this.lastDirection == 'head' ? 0.75 : 1.25;
      return Math.max(this.getViewport().min - this.slidingWindowBounds.min, 0) * favor; // + favor
    },

    getTailDiff: function() {
      var favor = this.lastDirection == 'tail' ? 0.75 : 1.25;
      return Math.max(this.slidingWindowBounds.max - this.getViewport().max, 0) * favor; // + favor
    },

    /**
     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
     */
    _adjustSlidingWindow: function() {
      if (!this.slidingWindow)
        return;
      
      if (this._resizeArgs)
        return this.resize.apply(this, this._resizeArgs);
      
      var slidingWindow = this.slidingWindowBounds,
          viewport = this.getViewport(),
          range = Physics.util.clone(this.range),
          numBricks = this.numBricks(),
          scrollingTowardsHead = this._lastScrollDirection == 'head',
  //        favor = this.minSlidingWindowDimension * 0.25 * (scrollingTowardsHead ? -1 : 1),
          maxPrepend = this.range.from,
          maxAppend = Math.max(this.brickLimit - this.range.to, 0),
          canAdd,
          defaultAddDelta = Math.max(this.defaultAddDelta * this.bricksPerPage | 0, 4), //Math.max(Math.ceil(this.bricksPerPage / 2), 4),
          defaultRemoveDelta = Math.max(this.bricksPerPage / 3 | 0, 1), //Math.max(Math.ceil(this.bricksPerPage / 2), 4),
          headDiff,
          tailDiff;
  
      maxPrepend = Math.min(maxPrepend, this.maxBricks);
      maxAppend = Math.min(maxAppend, this.maxBricks);
      canAdd = !!(maxPrepend || maxAppend);
      headDiff = this.getHeadDiff();
      tailDiff = this.getTailDiff();
      
  //    if (scrollingTowardsHead) {
  //      headDiff *= (1 - favor);
  //      tailDiff *= (1 + favor);
  //    }
  //    else {
  //      headDiff *= (1 + favor);
  //      tailDiff *= (1 - favor);
  //    }
      ////////////////////////////////////////////////////////                     <--------->                        (SLIDING WINDOW MIN SIZE)
      ////////////////////////////////////////////////////////    <----------------------------------------->         (SLIDING WINDOW MAX SIZE)
      ////////////////////////////////////////////////////////               <---------------------->                 (SLIDING WINDOW CURRENT SIZE)
      ////////////////////////////////////////////////////////   |----|                                               (VIEWPORT)
      if (this.range.from > 0 && numBricks && viewport.max <= slidingWindow.min) { 
        // sliding window is completely below viewport
        // remove all bricks and request new ones
        this.log("DECISION: sliding window is completely below viewport, removing all bricks");
        this.removeBricks(numBricks);
        
        // TODO: uncomment this and implement resetting of mason to new viewport position
//        var diff = this.bricksPerPage * (slidingWindow.min - viewport.min) / this.pageScrollDim;
//        diff = Math.min(this.range.from, diff);
//        this.range.from -= diff; 
//        this.range.to -= diff; 
        
        Physics.util.extend(range, this.range); // reclone
        return this.requestLess(0, numBricks);
//        return this.requestMore(Math.min(maxPrepend, defaultAddDelta), true);
//        range.from -= Math.min(maxPrepend, defaultAddDelta);
//        return this.requestNewRange(range);
      }
      ////////////////////////////////////////////////////////                                          |----|        (VIEWPORT)
      else if (this.range.to < this.brickLimit && numBricks && viewport.min >= slidingWindow.max) { 
        // sliding window is completely above viewport
        // remove all bricks and request new ones
        this.log("DECISION: sliding window is completely above viewport, removing all bricks");
        this.removeBricks(numBricks, true);
        Physics.util.extend(range, this.range); // reclone
//        range.to += Math.min(maxAppend, defaultAddDelta);
//        return this.requestNewRange(range);
        return this.requestLess(numBricks, 0);
      }
      ////////////////////////////////////////////////////////
      else if (canAdd && this.slidingWindowDimension < this.minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // grow window
        if (maxPrepend && (headDiff < tailDiff || !maxAppend)) {
          this.log("DECISION: growing sliding window towards the " + HEAD_STR);
//          range.from -= Math.min(maxPrepend, defaultAddDelta);
          return this.requestMore(Math.min(maxPrepend, defaultAddDelta), true);
        }
//        else if (tailDiff <= headDiff && maxAppend > 0)
        else if (maxAppend) {
          this.log("DECISION: growing sliding window towards the " + TAIL_STR);
//          range.to += Math.min(maxAppend, defaultAddDelta);
          return this.requestMore(Math.min(maxAppend, defaultAddDelta));
        }
        else {
          this.log("DECISION: UH OH, SLIDING WINDOW IS CONFUSED!");
          debugger;
        }
        
//        return this.requestNewRange(range);
      }
      else if (this.slidingWindowDimension > this.maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // shrink window
        this.log("Sliding window too big: " + this.slidingWindowDimension + ", max is: " + this.maxSlidingWindowDimension);
        var toRemove, 
            fromTheHead,
            range = Physics.util.extend({}, this.range);
        
        while ((numBricks = this.numBricks()) && this.slidingWindowDimension > this.maxSlidingWindowDimension) {
          toRemove = Math.min(defaultRemoveDelta, numBricks);
          fromTheHead = headDiff > tailDiff;
          this.log("DECISION: shrinking sliding window by " + toRemove + " at the " + (fromTheHead ? HEAD_STR : TAIL_STR));
          this.removeBricks(toRemove, fromTheHead);
          headDiff = this.getHeadDiff();
          tailDiff = this.getTailDiff();
        }
        
        return this.requestLess(this.range.from - range.from, range.to - this.range.to);
//        return this.requestNewRange();
      }
      // grow the window in the direction where it has the least padding, if necessary
      else if (maxAppend && tailDiff < this.slidingWindowInsideBuffer) {
        if (tailDiff < this.slidingWindowOutsideBuffer) {
          var toAdd = Math.min(maxAppend, defaultAddDelta);
//          range.to += toAdd;
          this.log("DECISION: growing sliding window by " + toAdd + " at the " + TAIL_STR);
//          return this.requestNewRange(range);
          return this.requestMore(toAdd);
        }
//        else {
//          if (this.brickLimit == Infinity) {
//            var toAdd = Math.min(maxAppend, defaultAddDelta);
//            this.log("DECISION: prefetching " + toAdd + " items");
//            this.prefetch(toAdd, false); // add sth similar for head
//          }
//          else
//            this.log("DECISION: not doing anything to sliding window");
//        }
//        else if (this.brickLimit - range.to < this.bricksPerPage * 2) /// doesn't make any sense because if brick limit is set, we already have all those resources in the main thread, no need to fetch them from anywhere
//          this.prefetch();
      }
      else if (maxPrepend && range.from > 0 && headDiff < this.slidingWindowInsideBuffer) {
        var toAdd = Math.min(maxPrepend, defaultAddDelta);
        this.log("DECISION: growing sliding window by " + toAdd + " at the " + HEAD_STR);
        return this.requestMore(toAdd, true);
      }
    },

    requestRange: function(from, to, atTheHead) {
      if (this._waiting)
        return;
      
      this._waiting = true;
      from = Math.max(0, from);
      to = Math.min(this.brickLimit == Infinity ? this.lastBrickSeen : this.brickLimit, to);
      this.removeBricks(this.numBricks());
      this.range.from = this.range.to = atTheHead ? to : from;
      triggerEvent(this._callbackId, {
        type: 'range',
        from: from,
        to: to,
        info: this._getInfo()
      });
    },
    
    home: function() {
      this.log("JUMPING HOME");
      if (this.range.from != 0)
        this.requestRange(0, this.bricksPerPage, true);
      
      log(this.containerId + ": Disabling edge constraints (temporarily) on jump to HOME");
      this.disableEdgeConstraints();
      this.cancelPendingActions();
      this.offsetBody.stop(this.headEdge.state.pos);
      log(this.containerId + ": Enabling edge constraints on jump to HOME");
      this.enableEdgeConstraints();
    },
    
    end: function() {
      this.log("JUMPING TO THE END");
      var coords = this.getTailEdgeCoords(),
          end = this.brickLimit == Infinity ? this.lastBrickSeen : this.brickLimit;
      
      if (this.range.to != end)
        this.requestRange(end - this.bricksPerPage, end);
      
      log(this.containerId + ": Disabling edge constraints (temporarily) on jump to END");
      this.disableEdgeConstraints();
      this.cancelPendingActions();
      this.offsetBody.stop(coords[0], coords[1]);
      this.enableEdgeConstraints();
      log(this.containerId + ": Enabling edge constraints on jump to END");
    },

    snapBy: function(x, y) {
      var body =  this.offsetBody, 
          pos = body.state.pos;
      
      x = x || 0;
      y = y || 0;
      return this.snapTo(pos.get(0) + x, pos.get(1) + y);
    },

    snapTo: function(x, y) {
      var body =  this.offsetBody, 
          pos = body.state.pos;
      
      x = typeof x == 'undefined' ? pos.get(0) : x;
      y = typeof y == 'undefined' ? pos.get(1) : y;
      
      y = Math.min(y, this.headEdge.state.pos.get(1));
      if (this.tailEdge)
        y = Math.max(y, this.tailEdge.state.pos.get(1));
      
      this.breakHeadEdgeConstraint();
      this.breakTailEdgeConstraint();
      API.cancelPendingActions(body);
      API.snapTo({
        body: body,
        stiffness: 0.03,
        damping: 0.5,
        drag: 0.1,
        x: x, 
        y: y, 
        z: pos.get(2)
      });
    },

    page: function(numPages) {
      var coords = this.getTailEdgeCoords(),
          body = this.offsetBody,
          pos = body.state.pos,
          pageHeight = 2 * BOUNDS.halfHeight(),
          currentPage = Math.round(-pos.get(1) / pageHeight),
          newPage = Math.max(currentPage + numPages, 0),
          newY = Math.min(pageHeight * newPage, -coords[1]);
      
      this.breakHeadEdgeConstraint();
      this.breakTailEdgeConstraint();
      API.cancelPendingActions(body);
      log("New Page: " + newPage);
      log("New Y: " + newY);
      log("Tail edge: " + coords[1]);
      API.snapTo({
        body: body,
        stiffness: 0.03,
        damping: 0.5,
        drag: 0.1,
        x: pos.get(0), 
        y: -newY, 
        z: pos.get(2)
      });
    }
  }
  
//  root.LayoutManager = LayoutManager;
//})(self);
  
// END LAYOUT MANAGER

/*
* API
*/

var API = {
  chain: function() {
    ArrayProto.forEach.call(arguments, executeRPC);
  },
  
  step: function(time, dt) {
    LAST_STEP_TIME = time;
    LAST_STEP_DT = dt;
    world.step(time, dt);
    // only render if not paused
    if ( RERENDER && !world.isPaused() ) {
//      log("RERENDERING");
      render();
    }
  },
  
  echo: function(callbackId) {
    doCallback(callbackId);
  },

  teleportLeft: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, LEFT.state.pos.get(0));
    body.state.pos.setComponent(2, LEFT.state.pos.get(2));
    body.stop();
  },

  teleportRight: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, RIGHT.state.pos.get(0));
    body.state.pos.setComponent(2, RIGHT.state.pos.get(2));
    body.stop();
  },

  teleportCenterX: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, ORIGIN.state.pos.get(0));
    body.state.pos.setComponent(2, ORIGIN.state.pos.get(2));
    body.stop();
  },

  teleportCenterY: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(1, ORIGIN.state.pos.get(1));
    body.state.pos.setComponent(2, ORIGIN.state.pos.get(2));
    body.stop();
  },

  setPosition: function(bodyId, x, y, z) {
    updateVector(getBody(bodyId)['pos'], x, y, z);
  },

  setVelocity: function(bodyId, x, y, z) {
    updateVector(getBody(bodyId)['vel'], x, y, z);
  },

  setAcceleration: function(bodyId, x, y, z) {
    updateVector(getBody(bodyId)['acc'], x, y, z);
  },

  cancelPendingActions: function(body, type, cancelType) {
    body = getBody(body);
    var actions = body._actions,
        action,
        i = actions && actions.length;
    
    if (i) {
      while (actions.length && i--) {
        action = actions[i];
        if (!type || action.type == type)
          action.cancel(cancelType);
      }
    }
  },

  completePendingActions: function(body, type) {
    body = getBody(body);
    var actions = body._actions,
        action,
        i = actions && actions.length;
    
    if (i) {
      while (actions.length && i--) {
        action = actions[i];
        if (!type || action.type == type)
          action.complete();
      }
    }
  },

  style: function(bodyId, style) {
    var body = getBody(bodyId);
    for (var prop in style) {
      body.state.renderData.set(prop, style[prop]);
    }
  },
  
  animateStyle: function(options) {
    var body = getBody(options.body),
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        unit = options.unit,
        prop = options.property,
        startValue = options.hasOwnProperty('start') ? options.start : body.state.renderData.get(prop),
        endValue = options.end,
        clear = options.clear,
        duration = options.duration,
        type = options.type,
        steps = Math.ceil(duration / WORLD_CONFIG.timestep),
        step = 0,
        factor,
        val,
        onstep,
        action;
    
    if (clear == 'cancel')
      API.cancelPendingActions(body);
    else if (clear == 'complete')
      API.completePendingActions(body);
    
    if (isNumberUnit(unit, startValue, type)) {
      if (typeof startValue == 'string')
        startValue = parseFloat(startValue.replace(unit, ''));
      if (typeof endValue == 'string')
        endValue = parseFloat(endValue.replace(unit, ''));
    }
    
    function cleanUp(cancelType) {
      completeCallback = null;
      if (cancelType == 'revert')
        body.state.renderData.set(prop, startValue, unit);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      if (!action || action.ratio() < 1)
        onstep(1);
      
      doCallback(completeCallback);
      cleanUp();
      body.state.renderData.set(prop, endValue, unit);
    };
        
    function onstep(ratio) {
      if (type == 'boolean' && ratio !== 1) {
        // set new value on action completion, essentially this is just a delayed setValue
        return;
      }
      
      val = startValue + ratio * (endValue - startValue);
      body.state.renderData.set(prop, val, unit);
      if (action && ratio == 1)
        action.complete();
    };
    
    action = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'animateStyle',
      name: getId(body) + ' ' + prop + ' from ' + startValue + ' to ' + endValue + ' in ' + duration + 'ms',
      onstep: onstep,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
    
    addAction(body, action);
    action.start();
    return action;
  },
  
//  revert: function(bodyId, action, time, callback) {
//    var body = getBody(bodyId),
//        renderDataBeforeAction = body.state.renderDataBeforeAction[action],
//        stateBeforeAction = body.state.beforeAction[action];
//    
//    // TODO: time, callback
//    if (stateBeforeAction) {
//      Physics.util.extend(body.state, stateBeforeAction);
//      delete body.state.beforeAction[action];
//    }
//    
//    if (renderDataBeforeAction) {
//      for (var prop in renderDataBeforeAction) {
//        body.state.renderData.set(prop, renderDataBeforeAction[prop]);
//      }
//      
//      delete body.state.renderDataBeforeAction[action];
//    }
//    
//  },  

  scale: function(options) {
    var body = getBody(options.body),
        i,
        currentScale,
        x = options.x,
        y = options.y,
        duration = options.duration,
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        originalScale = body.state.renderData.get('scale').slice(),
        goalScale = [typeof x == 'number' ? x : originalScale[0],
                     typeof y == 'number' ? y : originalScale[1],
                     1],
        scaleAction;
    
    if (arrayEquals(originalScale, goalScale)) {
      debugger;
      doCallback(callback);
      return;
    }
    
    function onstep(ratio) {
//      step++;
//      factor = step / steps;
      i = currentScale.length;
      while (i--) {
        if (ratio == 1)
          currentScale[i] = goalScale[i];
        else
          currentScale[i] = originalScale[i] + ratio * (goalScale[i] - originalScale[i]);
      }
      
//        log('scaling ' + body._id + ' to ' + currentScale.toString());
      body.state.renderData.set('scale', currentScale);
//      if (step >= steps)
      if (scaleAction && ratio == 1)
        scaleAction.complete();
    };

    currentScale = originalScale.slice();
    if (!duration)
      return oncomplete();
    
    function cleanUp(cancelType) {
//      body.state.renderData.set('scale', goalScale);
      completeCallback = null;
      if (cancelType == 'revert')
        body.state.renderData.set('scale', originalScale);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      if (!scaleAction || scaleAction.ratio() < 1)
        onstep(1);
      
      doCallback(completeCallback);
      cleanUp();
    };
    
    scaleAction = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'scale',
      name: 'scale ' + getId(body) + ' to ' + goalScale.toString(),
      onstep: onstep,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
    
    addAction(body, scaleAction);
    scaleAction.start();
    return scaleAction;
  },

  accelerateLeft: function(options) {
    options.x = LEFT.state.pos.get(0);
    options.z = LEFT.state.pos.get(2);
    API.accelerateTo(options);
  },

  accelerateRight: function(options) {
    options.x = RIGHT.state.pos.get(0);
    options.z = RIGHT.state.pos.get(2);
    API.accelerateTo(options);
  },

  accelerateCenter: function(options) {
    options.x = ORIGIN.state.pos.get(0);
    options.z = ORIGIN.state.pos.get(2);
    API.accelerateTo(options);
  },
  
  accelerateBy: function(options) {
    options.x = body.state.pos.get(0) + (options.x || 0);
    options.y = body.state.pos.get(1) + (options.y || 0);
    options.z = body.state.pos.get(2) + (options.z || 0);
    return API.accelerateTo(options);
  },

  /**
   * Acceleration to a target with air resistance:
   * vt = mg / b
   * a = (b / m) * (vt - v)   where a is acceleration
   *                                g is gravity
   *                                v is velocity 
   *                                vt is terminal velocity
   *                                b is the coefficient of air resistance
   *                                m is mass
   *                                
   * Equations of motion for free fall with air resistance taken from:                               
   * http://phys.csuchico.edu/kagan/204A/lectureslides/slides15.pdf
   */
  accelerateTo: function(options) {
    var body = getBody(options.body),
        m = body.mass,
        g = options.a,
        a,
        _drag = typeof options.drag == 'undefined' ? 0.1 : options.drag,
        dragCoeff,
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        initialPosition = Physics.vector(body.state.pos),
        destination = updateVector(Physics.vector(body.state.pos), options.x, options.y, options.z),
        initialDistance = body.state.pos.dist(destination),
        acceleration = Physics.vector(),
        dir = Physics.vector(),
//        thresh = Math.min(10, initialDistance / 5),
        lastDistance = initialDistance,
        distance = initialDistance,
        atmosphereRadius = options.atmosphereRadius || initialDistance,
        vInDir,
        thresh = 1,
        flyAction,
        boundsDim;

    function onIntegratePositions(ratio) {
      distance = body.state.pos.dist(destination);
      if (distance > thresh) {
        lastDistance = distance;
        boundsDim = Math.min(BOUNDS._hw, BOUNDS._hh);
//        dragCoeff = 0.1 * _drag * Math.pow((boundsDim - Math.min(distance, boundsDim)) / boundsDim, 2);
//        dragCoeff = 1 - _drag * Math.pow((boundsDim - Math.min(distance, boundsDim)) / boundsDim, 2);
        if (distance < atmosphereRadius)
          dragCoeff = 1 - _drag * Math.pow((initialDistance - distance) / initialDistance, 2);
        else
          dragCoeff = 1;
//        dir.clone(destination).vsub(body.state.pos).normalize();
//        vInDir = body.state.vel.proj(dir);
//        a = g - dragCoeff * vInDir / m;
        a = g * dragCoeff;
//        a = Physics.util.clamp(a, -vInDir, 2 * g);
//        acceleration.clone(dir).mult(a);
        acceleration.clone(destination).vsub(body.state.pos).normalize().mult(a);
        body.accelerate(acceleration);        
      }
      else {
        if (distance)
          log("Completing action ahead of schedule by distance: " + distance + ", initial distance: " + initialDistance);
        
        flyAction.complete();
      }
    };

    function cleanUp(cancelType) {
      completeCallback = null;
      if (cancelType == 'stop')
        body.stop();
      else if (cancelType == 'revert')
        body.stop(initialPosition);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      body.stop(destination);
      doCallback(completeCallback);
      cleanUp();
    };

    delete options.trackAction; // fly action cannot track another action, as it doesn't use "ratio" for input  
    flyAction = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'accelerate',
      name: 'accelerating ' + getId(body) + ' to ' + destination.toString() + ' at ' + a + 'px/ms^2',
      onIntegratePositions: onIntegratePositions,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
      
    flyAction.ratio = function() {
      if (flyAction.state() == 'completed')
        return 1;
      else
        return (initialDistance - distance) / initialDistance;
    };
    
    API.cancelPendingActions(body, 'accelerate', CancelType.unhandle);
    addAction(body, flyAction);
    flyAction.start();
    return flyAction;
  },

  flyTo: function(options) {
    var body = getBody(options.body),
        a = options.a,
        _drag = typeof options.drag == 'undefined' ? 0.1 : options.drag,
        dragMultiplier,
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        initialPosition = Physics.vector(body.state.pos),
        destination = updateVector(Physics.vector(body.state.pos), options.x, options.y, options.z),
        initialDistance = body.state.pos.dist(destination),
        lastDistance = initialDistance,
        distance = initialDistance,
        pos = Physics.vector(),
        thresh = 1,
        flyAction;

    function onIntegratePositions(ratio) {
      distance = body.state.pos.dist(destination);
      if (distance < thresh)
        flyAction.complete();
      else
        body.stop(pos.clone(destination).vsub(initialPosition).mult(ratio).vadd(initialPosition));
    };

    function cleanUp(cancelType) {
      completeCallback = null;
      if (cancelType == 'stop')
        body.stop();
      else if (cancelType == 'revert')
        body.stop(initialPosition);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      body.stop(destination);
      doCallback(completeCallback);
      cleanUp();
    };

    flyAction = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'fly',
      name: 'flying ' + getId(body) + ' to ' + destination.toString() + ' at ' + a + 'px/ms^2',
      onIntegratePositions: onIntegratePositions,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
      
    API.cancelPendingActions(body, 'fly', CancelType.unhandle);
    addAction(body, flyAction);
    flyAction.start();
    return flyAction;
  },

  rotateBy: function(options) {
    var body = getBody(options.body),
        originalRotation = body.state.renderData.get('rotate');
    
    options.x = originalRotation[0] + (options.x || 0);
    options.y = originalRotation[1] + (options.y || 0);
    options.z = originalRotation[2] + (options.z || 0);
    return API.rotateTo(options);
  },

  rotateTo: function(options) {
    var body = getBody(options.body),
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        x = options.x,
        y = options.y,
        z = options.z,
        originalRotation = body.state.renderData.get('rotate'),
        originalX = originalRotation[0],
        originalY = originalRotation[1],
        originalZ = originalRotation[2],
        rotation = originalRotation.slice(),
        action;
    
    function onIntegratePositions(ratio) {
      if (x !== undefined)
        rotation[0] = originalX + (x - originalX) * ratio;
      if (y !== undefined)
        rotation[1] = originalY + (y - originalY) * ratio;
      if (z !== undefined)
        rotation[2] = originalZ + (z - originalZ) * ratio;
        
      body.state.renderData.set('rotate', rotation);
      if (action && ratio == 1)
        action.complete();
    };
    
    function cleanUp(cancelType) {
      completeCallback = null;
      if (cancelType == 'revert')
        body.state.renderData.set('rotate', originalRotation);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      if (!action || action.ratio() < 1)
        onIntegratePositions(1);
      
      doCallback(completeCallback);
      cleanUp();
    };
    
    action = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'rotate',
      name: 'rotate ' + getId(body) + ' to ' + x + ", " + y + ", " + z,
      onIntegratePositions: onIntegratePositions,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
    
    API.cancelPendingActions(body, 'rotate', CancelType.unhandle);
    addAction(body, action);
    action.start();
    return action;
  },
  
  rotateToAndBack: function(options) {
    var body = getBody(options.body),
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        x = options.x,
        y = options.y,
        z = options.z,
        originalRotation = body.state.renderData.get('rotate'),
        originalX = originalRotation[0],
        originalY = originalRotation[1],
        originalZ = originalRotation[2],
        rotation = originalRotation.slice();
    
    function onIntegratePositions(ratio) {
      if (ratio > 0.5)
        ratio = 1 - ratio;
      if (x !== undefined)
        rotation[0] = originalX + (x - originalX) * ratio;
      if (y !== undefined)
        rotation[1] = originalY + (y - originalY) * ratio;
      if (z !== undefined)
        rotation[2] = originalZ + (z - originalZ) * ratio;
        
      body.state.renderData.set('rotate', rotation);
    };
    
    function cleanUp(cancelType) {
      completeCallback = null;
      if (cancelType == 'revert')
        body.state.renderData.set('rotate', originalRotation);
      
      doCallback(cancelCallback);
    };
    
    function oncomplete() {
      cancelCallback = null;
      if (!action || action.ratio() < 1)
        onIntegratePositions(1);
      
      doCallback(completeCallback);
      cleanUp();
    };
    
    action = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'rotate',
      name: 'rotate ' + getId(body) + ' to ' + x + ", " + y + ", " + z,
      onIntegratePositions: onIntegratePositions,
      oncomplete: oncomplete,
      oncancel: cleanUp
    }));
    
    API.cancelPendingActions(body, 'rotate', CancelType.unhandle);
    addAction(body, action);
    action.start();
    return action;    
  },

  rotateFromTo: function(options) {
    var body = getBody(options.body),
        rotation = body.state.renderData.get('rotate').slice(),
        from = options.from;
    
    rotation[0] = from.hasOwnProperty('x') ? from.x : rotation[0];
    rotation[1] = from.hasOwnProperty('y') ? from.y : rotation[1];
    rotation[2] = from.hasOwnProperty('z') ? from.z : rotation[2];
    body.state.renderData.set('rotate', rotation);
    Physics.util.extend(options, options.to);
    delete options.to;
    return API.rotateTo(options);
  },

  teleport: function(bodyId /*[, another body's id] or [, x, y, z]*/) {
    var body = getBody(bodyId),
        anchor,
        destination;
    
    if (typeof arguments[1] == 'string') {
      anchor = getBody(arguments[1]);
      if (anchor == LEFT || anchor == RIGHT || anchor == ORIGIN) // only teleport along X axis
        destination = Physics.vector(body.state.pos).setComponent(0, anchor.state.pos.get(0));
      else
        destination = anchor.state.pos;
    }
    else {
      var args = slice.call(arguments, 1);
      args.unshift(Physics.vector(body.state.pos));
      destination = updateVector.apply(null, args);
    }
    
    log("Teleporting " + bodyId + " to " + destination.toString());
    body.stop(destination);
  },

//  /**
//   * @options {
//   *   body: {String} bodyId,
//   *   pages: {Number} pages down to go (up is negative)
//   *   
//   * }
//   */
//  page: function(options) {
//    var body = getBody(options.body),
//        pos = body.state.pos,
//        pageHeight = 2 * BOUNDS.halfHeight(),
//        currentPage = Math.floor(-pos.get(1) / pageHeight),
//        newPage = Math.max(currentPage + options.pages, 0),
//        newY = pageHeight * newPage;
//    
//    log("New Page: " + newPage);
//    log("New Y: " + newY);
//    API.snapTo({
//      body: body,
////      a: options.a || 0.02,
////      drag: 0.9,
////      atmosphereRadius: 
//      stiffness: 0.03,
//      damping: 0.5,
//      drag: 0.1,
//      x: pos.get(0), 
//      y: -newY, 
//      z: pos.get(2)
//    });
//  },
  
  snapTo: function(options) {
    var self = this,
        body = getBody(options.body),
        completeCallback = options.oncomplete,
        cancelCallback = options.oncancel,
        stiffness = options.stiffness,
        damping = options.damping,
        initialPosition = Physics.vector(body.state.pos),
        destination = updateVector(Physics.vector(body.state.pos), options.x, options.y, options.z),
        initialDistance = initialPosition.dist(destination),
        drag = options.drag || 0,
        distance,
        anchor = Physics.body('point', Physics.util.extend(destination.values(), {
          fixed: true
        })),
        distThresh = options.distanceThreshold || 3,
        velThresh = options.velocityThreshold || 0.1,
        accThresh = options.accelerationThreshold || 0.1,
        constraint, // only snap along one axis
        snapAction;
  
    if (typeof stiffness == 'undefined')
      stiffness = CONSTANTS.springStiffness;

    if (typeof damping == 'undefined')
      damping = CONSTANTS.springDamping;

//    log("Snapping " + bodyId + " " + anchorId + " over a distance of " + (body.state.pos.get(distanceAxis) - constraintEndpoint) + ", with spring stiffness " + springStiffness + " and springDamping " + springDamping);
  //  world.publish(PUBSUB_SNAP_CANCELED); // finish (fast-forward or cancel?) any current snaps
  //  world.subscribe(PUBSUB_SNAP_CANCELED, endSnap);
  //  world.subscribe('step', checkStopped);
    
    function onIntegrateVelocities() {
      if (body.state.pos.dist(destination) < distThresh && body.state.vel.norm() < velThresh && body.state.acc.norm() < accThresh) {
        snapAction.complete();
      }
      else {
//        if (drag) {
          body.state.vel.mult(1 - drag);
//        }
      }
    };
  
    function cleanUp(cancelType) {
      if (cancelType == 'stop')
        body.stop();
      else if (cancelType == 'revert')
        body.stop(initialPosition);
      
      completeCallback = null;
      self.removeConstraint(constraint);
      world.removeBody(anchor);
      doCallback(cancelCallback);
    };
    
    function endSnap() {
      cancelCallback = null;
//      log("Snapping " + bodyId + " took " + (Physics.util.now() - startTime) + " milliseconds");
  //    world.unsubscribe(PUBSUB_SNAP_CANCELED, endSnap);
      body.stop(destination);
//      coords[orthoAxis] = body.state.pos.get(orthoAxis);
//      body.state.pos.set.apply(body.state.pos, coords);
//      body.state.vel.zero();
//      body.state.acc.zero();
      doCallback(completeCallback);
      cleanUp();
    };
    
    world.addBody(anchor);
    
    constraint = this.distanceConstraint(body, anchor, stiffness, 0);
    constraint.damp(damping);
    
    snapAction = new Action(Physics.util.extend(getActionOptions(options), {
      type: 'snap',
      name: 'snap ' + getId(body) + ' to ' + destination.toString(),
      onIntegrateVelocities: onIntegrateVelocities,
      oncomplete: endSnap,
      oncancel: cleanUp
    }));
    
    snapAction.ratio = function() {
      if (snapAction.state() == 'completed')
        return 1;
      else {
        distance = body.state.pos.dist(destination);
        return (initialDistance - distance) / initialDistance;
      }
    };
    
    API.cancelPendingActions(body, 'snap', CancelType.stop);
    addAction(body, snapAction);
    snapAction.start();
    return snapAction;
  },
  
  /**
   * @param bodyId {String}               id of body to snap
   * @param anchordId {String}            id of anchor to snap to
   * @param springStiffness {Number 0-1}
   * @param springDamping {Number 0-1}
   */
  snap: function(bodyId, anchorId, springStiffness, springDamping, callback) {
    springStiffness = springStiffness == null ? CONSTANTS.springStiffness : springStiffness;
    springDamping = springDamping == null ? CONSTANTS.springDamping : springDamping;
    var self = this,
//        snapId = Physics.util.uniqueId('snap'),
        startTime = Physics.util.now(),
        body = getBody(bodyId),
        anchor = getBody(anchorId),
        distanceAxis = anchorId == 'left' || anchorId == 'right' || anchorId == 'center' ? 0 : 1,
        orthoAxis = distanceAxis ^ 1, // flip bit
        coords = new Array(3),
        constraintEndpoint = coords[distanceAxis] = anchor.state.pos.get(distanceAxis),
        constraint = this.distanceConstraint(body, anchor, springStiffness, 0, distanceAxis == 0 ? DIR_MAP.right : DIR_MAP.down), // only snap along one axis
        snapAction;
    
    log("Snapping " + bodyId + " " + anchorId + " over a distance of " + (body.state.pos.get(distanceAxis) - constraintEndpoint) + ", with spring stiffness " + springStiffness + " and springDamping " + springDamping);
    constraint.damp(springDamping);
//    world.publish(PUBSUB_SNAP_CANCELED); // finish (fast-forward or cancel?) any current snaps
//    world.subscribe(PUBSUB_SNAP_CANCELED, endSnap);
//    world.subscribe('step', checkStopped);
    
    function checkStopped() {
      if (Math.abs(body.state.pos.get(distanceAxis) - constraintEndpoint) < 10 && body.state.vel.norm() < 0.1 && body.state.acc.norm() < 0.1) {
        snapAction.complete();
      }
    };

    function cleanUp() {
      self.removeConstraint(constraint);      
    };
    
    function endSnap() {
      log("Snapping " + bodyId + " took " + (Physics.util.now() - startTime) + " milliseconds");
//      world.unsubscribe(PUBSUB_SNAP_CANCELED, endSnap);
      coords[orthoAxis] = body.state.pos.get(orthoAxis);
      body.state.pos.set.apply(body.state.pos, coords);
      body.state.vel.zero();
      body.state.acc.zero();      
      cleanUp();
      if (callback)
        doCallback(callback);
    };
    
    snapAction = new Action(Physics.util.extend(getActionOptions(options), {
//      track: getAction(options.trackAction), // can't track another action because it doesn't use "ratio" as input
      type: 'snap',
      onstep: checkStopped,
      oncomplete: endSnap,
      oncancel: cleanUp
    }));
    
    addAction(body, snapAction);
    snapAction.start();
    return snapAction;
  },
  
  removeBodies: function(/* ids */) {
    getBodies.apply(null, arguments).map(world.removeBody.bind(world));
  },
  
  removeBody: function(id) {
    this.removeBodies.call(this, id);
  },

//  benchBodies: function(/* ids */) {
//    Physics.util.extend(benchedBodies, getBodiesMap.apply(null, arguments));
//  },
//  
//  unbenchBodies: function(/* ids */) {
//    var i = arguments.length,
//        id,
//        body;
//    
//    while (i--) {
//      id = arguments[i];
//      body = benchedBodies[id];
//      if (body)
//        world.addBody(body);
//    }
//  },

  addBody: function(type, options) {
    var body = Physics.body(type, options);
    world.addBody(body);
    return body;
  },

  drag: function drag(dragVector, ids) {
    var v,
        bodies = typeof ids == 'string' ? getBodies(ids) : getBodies.apply(null, ids);

    if (bodies.length) {
      v = Physics.vector(dragVector[0], dragVector[1]);
//      log("DRAG: " + v.toString());
      world.publish({
        topic: 'drag', 
        vector: v,
        bodies: bodies
      });
    }
  },

  dragend: function dragend(dragVector, ids, stop) {
    var v,
        bodies = typeof ids == 'string' ? getBodies(ids) : getBodies.apply(null, ids);
    
    if (bodies.length) {
      v = Physics.vector(dragVector[0], dragVector[1]);
//      log("DRAG END: " + v.toString());
      world.publish({
        topic: 'dragend', 
        stop: stop,
        vector: v,
        bodies: bodies
      });
    }
  },

//  squashAndStretch: function(movingBody, squeezeBody) {
//    movingBody = getBody(movingBody);
//    squeezeBody = getBody(squeezeBody);
//    var scale = [1, 1, 1],
//        vel,
//        velMag;
//    
//    world.subscribe('integrate:positions', function scale() {
////      scale[0] = scale[1] = scale[2] = 1;
//      for (var i = 0; i < 3; i++) {
//        vel = Physics.util.truncate(movingBody.state.vel.get(i), 3);
//        velMag = Math.abs(vel);
//        if (velMag > 0.001) {
//          Physics.util.extend(scale, squeezeBody.state.renderData.get('scale'));
//          scale[i] = Physics.util.clamp(1 + (Math.pow(velMag + 1, 1/2) - 1) * sign(vel), 0.5, 2);
//        }
//        else
//          scale[i] = 1;
//      }
//      
//      squeezeBody.state.renderData.set('scale', scale);
//    });
//    
//    world.subscribe('remove:body', function unsub(data) {
//      if (data.body == movingBody || data.body == squeezeBody) {
//        world.unsubscribe('remove:body', unsub);
//        world.unsubscribe('integrate:positions', scale);
//      }
//    });
//  },

   squashAndStretch: function(movingBody, squeezeBody, multiplier) {
     movingBody = getBody(movingBody);
     squeezeBody = getBody(squeezeBody);
     multiplier = multiplier || 1;
     var scaleVals = [1, 1, 1],
         max = 1,
         min = 1,
         maxDelta = 0.05,
         acc,
         accMag;
    
    world.subscribe('integrate:velocities', function scale() {
      if (IS_DRAGGING || movingBody.fixed)
        return;
      
      Physics.util.extend(scaleVals, squeezeBody.state.renderData.get('scale'));
      for (var i = 0; i < 3; i++) {
        acc = Physics.util.truncate(movingBody.state.old.acc.get(i), 3);
//        acc = Physics.util.truncate(Math.abs(movingBody.state.vel.get(i)) - Math.abs(movingBody.state.old.vel.get(i)), 3);
        accMag = Math.abs(acc) * multiplier;
        if (accMag > 0.001) {
//          scaleVals[i] = Physics.util.clamp(1 + (Math.pow(accMag + 1, 1/2) - 1) * sign(acc), // squeeze for deceleration, stretch for acceleration 
          scaleVals[i] = Physics.util.clamp(1 + acc * multiplier, // squeeze for deceleration, stretch for acceleration 
                                            scaleVals[i] - maxDelta, 
                                            Math.min(scaleVals[i] + maxDelta, 1)); // don't stretch to more than original scale
          
          if (scaleVals[i] < min) {
            min = scaleVals[i];
            log("NEW SCALE MIN: " + min);
          }
          
          if (scaleVals[i] > max) {
            max = scaleVals[i];
            log("NEW SCALE MAX: " + max);
          }
        }
        else
          scaleVals[i] = 1;
      }
      
      squeezeBody.state.renderData.set('scale', scaleVals);
    });
    
//    world.subscribe('beforeRender', function beforeRender() {
//      log("RENDERING SCALE: " + scale[0]);
//      squeezeBody.state.renderData.set('scale', scale);
//    });
    
    world.subscribe('remove:body', function unsub(data) {
      if (data.body == movingBody || data.body == squeezeBody) {
        world.unsubscribe('remove:body', unsub);
        world.unsubscribe('integrate:velocities', scale);
        world.unsubscribe('beforeRender', beforeRender);
      }
    });
  },

  rotateWhenMoving: function(movingBody, rotateBody, moveAxis, rotateAxis, direction, doGradient) {
    movingBody = getBody(movingBody);
    rotateBody = getBody(rotateBody);
    var minIncDelta = 0.001,
        minDecDelta = 0.0001,
        maxIncDelta = 0.005, // don't need it yet
        maxDecDelta = 0.0003,
        decDelta,
//        minAngle = -Math.PI / 4
//        maxAngle = Math.PI / 4,
        angles = [0, 0, 0],
        coeff,
        v,
        rotation,
        r,
        newR,
        bgPosition = [],
        _parseFloat = parseFloat.bind(self),
        thresh = 1,
        paused = false;
    
    world.subscribe('integrate:positions', function rotate() {
      if (IS_DRAGGING || movingBody.fixed || paused)
        return;
      
      coeff = CONSTANTS.tilt;
      v = Physics.util.truncate(movingBody.state.vel.get(moveAxis), 3);
      switch (direction) {
      case 'both':
        break;
      case 'backward':
        coeff *= -1;
        /* fall through */
      case 'forward':
        v = Math.abs(v);
        break;
      }
      
      rotation = rotateBody.state.renderData.get('rotate');
      r = rotation[rotateAxis];
      if (Math.abs(v) < thresh || hasDistanceConstraint(movingBody, true)) {
        decDelta = Math.max(Math.abs(r) / 30, maxDecDelta) * sign(r);
        newR = r < 0 ? Math.min(r - decDelta, 0) : Math.max(r - decDelta, 0); // gradually kill tilt. If it's being pulled by a constraint, we don't want the tilt to go nuts first one way then the other
      }
      else {
        newR = -sign(v) * coeff * Math.log(Math.abs(v + sign(v)) - thresh) / 10;
//        if (Math.abs(newR) < Math.abs(r))
        newR = getNextValue(r, newR, maxDecDelta, maxIncDelta, minDecDelta, minIncDelta);
      }
      
      if (Math.abs(newR) < minDecDelta) {
        if (r == 0)
          return;
        else
          newR = 0;
      }

      if (doGradient) {
        Physics.util.extend(bgPosition, rotateBody.state.renderData.get('background-position').match(/\d+/ig));
        bgPosition[rotateAxis ^ 1] = Physics.util.clamp(50 + 10 * 100 * newR | 0, 0, 100) + '%';
        rotateBody.state.renderData.set('background-position', bgPosition.join(' '));
      }
      
      Physics.util.extend(angles, rotation);
      angles[rotateAxis] = newR;
      rotateBody.state.renderData.set('rotate', angles);
    });
    
    world.subscribe('remove:body', function unsub(data) {
      if (data.body == movingBody || data.body == rotateBody) {
        world.unsubscribe('remove:body', unsub);
        world.unsubscribe('integrate:positions', rotate);
      }
    });
    
//    return {
//      pause: function() {
//        pause = true;
//      },      
//      unpause: function() {
//        pause = false;
//      }
//    };
  },
  
//  skewWhenMoving: function(movingBody, skewBody, axis) {
//    movingBody = getBody(movingBody);
//    skewBody = getBody(skewBody);
//    
////    var minDelta = 0.0001,
////        maxDelta = 0.001,
//    var minVel = 1,
//        maxSkew = Math.PI / 4, // don't use a skew value past 45 degrees, it looks bad
//        oldSkew,
//        newSkew = [0, 0, 0],
//        angle,
//        rescale = false,
//        newScale = [1, 1, 1],
//        doScaleX = !axis || axis == 'x',
//        doScaleY = !axis || axis == 'y',
//        v,
//        vMag,
//        vx,
//        vy,
//        skewX,
//        skewY
//    
//    world.subscribe('integrate:positions', function skew() {
//      if (IS_DRAGGING || movingBody.fixed)
//        return;
//      
//      v = movingBody.state.vel;
//      vMag = v.norm();
//      vx = Physics.util.truncate(v.get(0), 3);
//      vy = Physics.util.truncate(v.get(1), 3);
//      oldSkew = skewBody.state.renderData.get('skew');
//      scale = skewBody.state.renderData.get('scale');
//      Physics.util.extend(newSkew, oldSkew);
//      Physics.util.extend(newScale, scale);      
//      angle = Math.atan2(vy, vx);
//      if (vMag > minVel) {
//        rescale = true;
//        
//        // If the X velocity is greater, stretch in X, squash in Y. And vice versa
//        if (Math.abs(vx) > Math.abs(vy)) {
//          newScale[0] = 1 + ((0.5 - Math.abs(Math.cos(angle) * Math.sin(angle))) * Math.abs((vx / 10)));
//          newScale[1] = 1 / newScale[0];
//        }
//        else {
//          newScale[1] = 1 + ((0.5 - Math.abs(cos(angle) * sin(angle))) * Math.abs((vy / 10)));
//          newScale[0] = 1 / newScale[1];
//        }
//
//        if (!doScaleX)
//          newScale[0] = scale[0];
//        
//        if (!doScaleY)
//          newScale[1] = scale[1];
//
//        skewX = -maxSkew * Math.sin(angle) * Math.cos(angle) * vMag / 10;
//        Physics.util.clamp(skewX, -maxSkew, maxSkew);
//      }
//      else {
//        skewX = 0;
//        if (newScale[0] != 0 || newScale[1] != 0 || newScale[2] != 0) {
//          newScale[0] = newScale[1] = newScale[2] = 1;
//          rescale = true;
//        }
//      }
//
//      if (newSkew[0] != skewX) {
//        newSkew[0] = skewX;
//  //      newSkew[1] = skewY;
//        skewBody.state.renderData.set('skew', newSkew);
//      }
//      
//      if (rescale) {
//        skewBody.state.renderData.set('scale', newScale);
//        rescale = false;
//      }
//    });
//    
//    world.subscribe('remove:body', function unsub(data) {
//      if (data.body == movingBody || data.body == skewBody) {
//        world.unsubscribe('remove:body', unsub);
//        world.unsubscribe('integrate:positions', skew);
//      }
//    });
//  },
//
//  trackDrag: function(body, type, bodies) {
//    body = getBody(body);
//    if (bodies)
//      bodies = getBodies(bodies);
//    
//    getDragTracker(body) || new DragTracker(body, type, bodies);
//  },
//
//  untrackDrag: function(body) {
//    removeDragTracker(getBody(body));
//  },
//
//  track: function(bodyA, bodyB, props) {
//    bodyA = getBody(bodyA);
//    bodyB = getBody(bodyB);
//    var tracker = getTracker(bodyA, bodyB) || new Tracker(bodyA, bodyB),
//        i = props.length;
//    
//    while (i--) {
//      tracker.track(props[i]);
//    }
//  },
//
//  untrack: function(bodyA, bodyB, props) {
//    bodyA = getBody(bodyA);
//    bodyB = getBody(bodyB);
//    var tracker = getTracker(bodyA, bodyB),
//        i = props.length;
//    
//    if (tracker) {
//      while (i--) {
//        tracker.track(props[i]);
//      }
//    }
//  },

  removeRail: function(railId) {
    railroad.remove(railId);
  },

  addRail: function(body, x1, y1, x2, y2) {
    body = getBody(body);
    z = body.state.pos.get(2);
    if (typeof x2 != 'undefined')
      return railroad.rail(body, Physics.vector(x1, y1, z), Physics.vector(x2, y2, z));
    else
      return railroad.rail(body, Physics.vector(x1, y1, z));
  },
  
//  box: function(body, width, height, x, y) {
//    body = getBody(body);
//    if (!body)
//      throw "No body found to box in";
//    
////    if (typeof x == 'undefined')
////      x = width == Infinity ? 0 : width / 2;
////    
////    if (typeof y == 'undefined')
////      y = height == Infinity ? 0 : height / 2;
//    
//    if (arguments.length == 5)
//      boxer.box(body, width, height, Physics.vector(x, y));
//    else
//      boxer.box(body, width, height);
//  },
  
  removeConstraint: function(cstOrId) {
    log("Removing constraint");
    var numConstraints = constrainer._distanceConstraints.length;
    constrainer.remove(cstOrId);
    if (numConstraints != constrainer._distanceConstraints.length + 1)
      log("Failed to remove constraint");
  },
  
  distanceConstraint: function(bodyA, bodyB, stiffness, targetLength, dir) {
    bodyA = getBody(bodyA);
    bodyB = getBody(bodyB);
    return constrainer.distanceConstraint(bodyA, bodyB, stiffness, typeof targetLength == 'number' ? targetLength : bodyA.state.pos.dist(bodyB.state.pos), dir);
  },
  
  updateBounds: updateBounds,
  
  layout: {
    init: function(id, options, callbackId) {
      if (typeof Mason == 'undefined')
        importScripts('lib/jquery.masonry.js');
    
      proxiedObjects[id] = layoutManagers[id] = new LayoutManager(id, options, callbackId);
    }
  },
  
  set: function(scrollerType, constantName, value) {
    if (arguments.length == 2) {
      value = constantName;
      constantName = scrollerType;
    }
      
    var prefix = scrollerType ? scrollerType + ':' : '';
    CONSTANTS[constantName] = value;
    
    if (constantName !== 'degree') {
      world.publish({
        topic: prefix + "constants",
        name: constantName,
        value: value
      });
    }
    
    switch (constantName) {
    case 'degree':
      for (var id in CONSTANTS) {
        if (/^_/.test(id)) {
          world.publish({
            topic: prefix + "constants:" + id.slice(1)
          })
        }
      }
      
      break;
    case 'drag':
//      if (arguments.length == 2)
        integrator.options.drag = arguments[arguments.length - 1];
//      else {
//        world.publish({
//          topic: prefix + "constants:drag",
//          drag: value
//        });
//      }
      
      break;
    default:
      world.publish({
        topic: prefix + 'constants:' + constantName
      });
      
      break;
//    case 'springDamping':
//      world.publish({
//        topic: prefix + 'constants:springDamping'
//      });
//      
//      break;
//      
//    case 'springStiffness':
//      world.publish({
//        topic: prefix + 'constants:springStiffness'
//      });
//      
//      break;
    }
  },
  
  recycle: recycle,
  render: render
};

/**
 * Specific to CSS transforms
 */
var Matrix = {
  _recycled: [],
  recycle: function(m) {
    if (Matrix._recycled.length > 100)
      Matrix._recycled.length = 20;
    
    Matrix._recycled.push(m);
  },
  getNewMatrix: function() {
    var m = Matrix._recycled.pop() || [],
        i = arguments.length;
    
    if (i) {
      while (i--) {
        m[i] = arguments[i];
      }
    }
    
    return m;
  },
  toString: function(a) {
    var str = "";
    for (var i = 0; i < a.length; i++) {
      str += a[i];
      if (i % 4 == 3)
        str += "\n";
      else
        str += ", ";
    }
    
    return str;
  },
  identity: function() {
    return Matrix.getNewMatrix(
      1, 0, 0, 0, 
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ); // use one array to save garbage, as opposed to nested arrays
  },
  scale: function(a, s) {
    var i = a.length;
    while (i--) {
      a[i] *= s;
    }
    
    return Matrix;
  },
  scaleX: function(a, s) {
    return Matrix.scale3d(a, s, 1, 1);
  },
  scaleY: function(a, s) {
    return Matrix.scale3d(a, 1, s, 1);
  },
  scaleZ: function(a, s) {
    return Matrix.scale3d(a, 1, 1, s);
  },
  scale3d: function(a, x, y, z) {
    if (x == 1 && y == 1 && z == 1)
      return a;
    
    var i = Matrix.identity();
    i[0] = x;
    i[5] = y;
    i[10] = z;
    return Matrix.multiply(a, i);
  },
  translateX: function(a, d) {
    return Matrix.translate3d(a, d, 0, 0);
  },
  translateY: function(a, d) {
    return Matrix.translate3d(a, 0, d, 0);
  },
  translateZ: function(a, d) {
    return Matrix.translate3d(a, 0, 0, d);
  },
  translate3d: function(a, x, y, z) {
    if (!x && !y && !z)
      return a;
    
    var i = Matrix.identity(),
        result;
    
    i[12] = x;
    i[13] = y;
    i[14] = z;
    result = Matrix.multiply(a, i);
    Matrix.recycle(i);
    return result;
  },
  
  multiply: function(a, b) {
    var result = Matrix.getNewMatrix(),
        q,
        r,
        cellResult;
    
    for (var idx = 0; idx < 16; idx++) {
      cellResult = 0;
      q = idx / 4 | 0;
      r = idx % 4;
      for (var i = 0; i < 4; i++) {
        cellResult += a[i + q * 4] * b[i * 4 + r]; 
      }
      
      result[idx] = cellResult;
    }
    
    Physics.util.extendArray(a, result);
    Matrix.recycle(result);
    return Matrix;
  },
  rotateX: function(a, rad) {
    if (rad == 0)
      return a;
    
    var tmp = Matrix.getNewMatrix(
        1, 0, 0, 0,
        0, Math.cos(rad), Math.sin(-rad), 0,
        0, Math.sin(rad), Math.cos(rad), 0,
        0, 0, 0, 1
      ),
      result = Matrix.multiply(a, tmp);
    
    Matrix.recycle(tmp);
    return result;
  },
  rotateY: function(a, rad) {
    if (rad == 0)
      return a;
      
    var tmp = Matrix.getNewMatrix(
        Math.cos(rad), 0, Math.sin(rad), 0,
        0, 1, 0, 0,
        Math.sin(-rad), 0, Math.cos(rad), 0,
        0, 0, 0, 1
      ),
      result;
    
    result = Matrix.multiply(a, tmp);
    Matrix.recycle(tmp);
    return result;
  },
  rotateZ: function(a, rad) {
    if (rad == 0)
      return a;
    
    var tmp = Matrix.getNewMatrix(
        Math.cos(rad), Math.sin(-rad), 0, 0,
        Math.sin(rad), Math.cos(rad), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ), 
      result = Matrix.multiply(a, tmp);
    
    Matrix.recycle(tmp);
    return result;
  },
  rotate3d: function(a, xRad, yRad, zRad) {
    Matrix.rotateX(a, xRad);
    Matrix.rotateY(a, yRad);
    Matrix.rotateZ(a, zRad);
    return Matrix;
  },
  clone: function(a /* matrix or values list */) {
    if (arguments.length == 2) {
      var source = arguments[1],
          i = source.length;
      
      while (i--) {
        a[i] = source[i];
      }
    }
    else {
      for (var i = 1; i < arguments.length; i++) {
        a[i - 1] = arguments[i];
      }
    }
  }
}