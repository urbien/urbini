var ArrayProto = Array.prototype,
		indexOf = ArrayProto.indexOf,
    concat = ArrayProto.concat,
		slice = ArrayProto.slice,
		benchedBodies = {},
//		JUST_HIDDEN = [],
		world,
		integrator,
		CONSTANTS,
		WORLD_CONFIG = {
      positionRenderResolution: 1,
      angleRenderResolution: 0.001,
      timestep: 1000 / 60,
      maxIPF: 6
    },
		constrainer,
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
		DIR_UP,
		DIR_DOWN,
    DIR_LEFT,
    DIR_RIGHT,
    DIR_MAP = {
      left: null,
      right: null,
      up: null,
      down: null
    },
    RERENDER = false,
    MAX_OPACITY = 0.999999,
		HEAD_STR = "head (top / left)",
		TAIL_STR = "tail (bottom / right)";

function index(obj, i) {
	return obj[i];
};

// resolve string path to object, e.g. 'Physics.util' to Physics.util
function leaf(obj, path, separator) {
	return path.split(separator||'.').reduce(index, obj);
};

function sign(number) {
  return number ? number < 0 ? -1 : 1 : 0;
};

self.console = self.console || {
  log: function() {
  //  DEBUG && console && console.log.apply(console, arguments);
    DEBUG && postMessage({
      topic: 'log',
      args: slice.call(arguments)
    });
  },

  debug: function() {
  //  DEBUG && console && console.debug.apply(console, arguments);
    DEBUG && postMessage({
      topic: 'debug',
      args: slice.call(arguments)
    });
  }
};

self.log = console.log.bind(console);
self.debug = console.debug.bind(console);

this.onmessage = function(e){
//  try {
    _onmessage(e);
//  } catch (err) {
//    debugger;
//  }
};

function _onmessage(e) {
	if (!world) {
	  importScripts(e.data.physicsJSUrl, e.data.masonryUrl);
	  DEBUG = e.data.debug;
	  CONSTANTS = e.data.constants;
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
          CONSTANTS['_' + c] = val;
        });
	    }
	  });
	  
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
  
  if (callbackId)
    args.push(callbackId);
  
  method.apply(obj, args);
}

function doCallback(callbackId, data) {
  postMessage({
    topic: 'callback',
    id: callbackId,
    data: data
  });
};

function triggerEvent(callbackId, data) {
  postMessage({
    topic: 'event',
    id: callbackId,
    data: data
  });
};

function updateBounds(minX, minY, maxX, maxY) {
  RENDERED_SINCE_BOUNDS_CHANGE = false;
  BOUNDS = Physics.aabb.apply(Physics, arguments);
  BOUNDS_AREA = (maxX - minX) * (maxY - minY);
	var leftX = minX - (maxX - minX),
	    leftY = minY,
	    rightX = maxX,
	    rightY = minY;
	
	if (!LEFT) {
    LEFT = Physics.body('point', {
      fixed: true,
      hidden: true,
      x: leftX,
      y: leftY
    });

    RIGHT = Physics.body('point', {
      fixed: true,
      hidden: true,
      x: rightX,
      y: rightY
    });
    
    ORIGIN = Physics.body('point', {
      fixed: true,
      hidden: true,
      x: minX,
      y: minY
    });
    
    LEFT._id = 'left';
    RIGHT._id = 'right';
    ORIGIN._id = 'center';
    world.add(LEFT);
    world.add(RIGHT);
    world.add(ORIGIN);
	}
	else {
    ORIGIN.state.pos.set(minX, minY);
	  LEFT.state.pos.set(leftX, leftY);
    RIGHT.state.pos.set(rightX, rightY);
	}
};

function addBehavior(behavior, options) {
	world.add( Physics.behavior(behavior, options) );
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

function removeAction(body, action) {
  if (body._actions) {
    var idx = body._actions.indexOf(action);
    if (~idx)
      body._actions.splice(idx, 1);
  }
};

function Action(name, onstep) {
  var complete = false,
      canceled = false,
      started = false,
      _onstep = onstep,
      action;

  onstep = function() {
    if (!started) {
      started = true;
      log("Started action: " + name);
      if (action.onstart)
        action.onstart();
    }
    
    if (_onstep)
      _onstep();
  };
  
  return action = {
    name: name,
    start: function() {
      world.subscribe('step', onstep);
    },
    cancel: function() {
      if (!complete && !canceled) {
        canceled = true;
        log("Canceled action: " + this.name);
        world.unsubscribe('step', onstep)
        if (this.oncancel)
          this.oncancel.apply(null, arguments);
        
      }
    },
    complete: function() {
      if (!complete && !canceled) {
        complete = true;      
        log("Completed action: " + this.name);
        world.unsubscribe('step', onstep);
        if (this.oncomplete)
          this.oncomplete.apply(null, arguments);
        
      }
    }
  };
}

function addAction(body, action) { //, exclusive) {
//  if (exclusive)
  var oncomplete = action.oncomplete,
      oncancel = action.oncancel;
  
  API.cancelPendingActions(body);
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
  var aabb = body.aabb(),
      frame = body.options.frame,
      xOffset,
      yOffset;
  
  if (frame) {
    switch (frame.geometry.name) {
    case 'point':
      xOffset = frame.state.pos.get(0);
      yOffset = frame.state.pos.get(1);
      break;
    default:
      xOffset = frame.state.pos.get(0) - frame.geometry._aabb._hw;
      yOffset = frame.state.pos.get(1) - frame.geometry._aabb._hh;
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

function render() {
	var bodies = world.getBodies(),
  		body,
  		styles = {},
  		style,
  		update = false;

  for (var i = 0; i < bodies.length; i++) {
    body = bodies[i];
    if (!body.hidden && body._id) {
      body.state.rendered.isTranslated = isTranslationRenderable(body);
//      body.state.rendered.isRotated = isRotationRenderable(body);
    }
  };
  
	for (var i = 0; i < bodies.length; i++) {
		body = bodies[i];
		if (!body.hidden && body._id) {
			style = renderBody(body);
			if (style) {
				update = true;
				styles[body._id] = style;
			}
		}
	};

	RENDERED_SINCE_BOUNDS_CHANGE = true;
	RERENDER = !update;
	if (update) {
		postMessage({
			topic: 'render',
			bodies: styles
		});	
	}
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

function preRender(body) {
  calcOpacity(body);
};

function calcOpacity(body) {
  if (body.state.renderData.isChanged('opacity'))
    return;
  
//  var opacity = 1;
  var opacity;
  if (body.geometry.name == 'point') // HACK for now, as we use points to represent all kinds of shapes for now
    opacity = MAX_OPACITY;
  else if (hasMovedSinceLastRender(body)) {
    var overlap = getOverlapArea(body, BOUNDS, body.geometry._area, BOUNDS_AREA);
//    return overlap / body.geometry._area;
//    opacity = overlap > 0 ? 1 : 0;
    if (overlap > 0)
      opacity = MAX_OPACITY;
    else {
      if (body.state.renderData.get('opacity') >= MAX_OPACITY) {
        if (overlap < -2 * Math.max(BOUNDS._hw, BOUNDS._hh))
          opacity = 0;
      }
      else {
        if (overlap > -10)
          opacity = MAX_OPACITY;
      }
    }
  }
  
  if (typeof opacity != 'undefined')
    body.state.renderData.set('opacity', opacity);
};

function getTranslation(body) {
  var aabb = body.geometry._aabb,
      pos = body.state.pos;
  
  x = pos.get(0) - (aabb._hw || 0);
  y = pos.get(1) - (aabb._hh || 0);
  z = getZ(body); //pos.get(2) - (aabb._hd || 0);
  return [x, y, z];
};

function getZ(body) {
//  if (body.geometry.name == 'point')
//    return -1;
//  else
    return 0;
};

function renderBody(body) {
  preRender(body);
	var state = body.state,
  		rendered = state.rendered,
  		wasRendered = body.rendered(),
  		isTranslated = body.state.rendered.isTranslated,
	    opacityChanged = !wasRendered || body.state.renderData.isChanged('opacity'), 
	    styleChanged = opacityChanged || body.state.renderData.isChanged(),
  		style = styleChanged && body.state.renderData.toJSON(),
  		transform,
  		rx, ry, rz;
				
	if (!wasRendered || styleChanged || isTranslated /*|| isRotated*/) {
    transform = {};
    if (!style)
      style = {};
    
		if (!wasRendered)
			body.rendered(true);

		rendered.angular.pos = state.angular.pos;
		rendered.pos.clone(state.pos);
		
		if (isTranslated)
		  transform.translate = getTranslation(body);
		
    if (styleChanged) {
      Physics.util.extend(body.state.rendered.renderData, style);
      if (opacityChanged) {
        style.transform = transform;
        if (body.state.renderData.get('opacity') == 0)
          transform.scale = [0.0001, 0.0001, 1];
        else {
          transform.scale = [1, 1, 1];
          transform.translate = getTranslation(body);
        }
      }
      
      body.state.renderData.clearChanges();
    }
      
    if (transform.translate || transform.scale)
      style.transform = transform;
    
		return style;
	}
};

function initWorld(_world, stepSelf) {
	world = _world;
	integrator = Physics.integrator('verlet', { drag: CONSTANTS.drag });
	world.add(integrator);
	
	if (stepSelf)
	  Physics.util.ticker.subscribe(API.step);
	
	Physics.util.extend(Physics.util, {	  
	  now: Physics.util.now || (typeof performance == 'undefined' ? Date.now.bind(Date) : performance.now.bind(performance)),
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
	
	world.subscribe('drag', function(data) {
		var bodies = data.bodies,
  			body,
  			i = bodies.length;
			
		while (i--) {
			body = bodies[i];
			body.fixed = true;
			body.state.pos.vadd(data.vector);
			stopBody(body);
//      log("DRAGGING");
//			body.state.vel.zero();
//      body.state.acc.zero();
		}
	}, null, 100);

	world.subscribe('dragend', function(data) {
		var stop = data.stop,
		    bodies = data.bodies,
  			body,
  			i = bodies.length;
			
//		log('dragend vector: ' + data.vector.toString());
		while (i--) {
			body = bodies[i];
      body.fixed = false;
      stopBody(body);
//      log("DRAG END");
		  if (!stop)
			  body.state.vel.clone( data.vector.mult( 1 / 10 ) );
		}
	}, null, 100);
	
	Physics.util.ticker.start();
	DIR_MAP.up = DIR_UP = Physics.vector(0, -1);
	DIR_MAP.down = DIR_DOWN = Physics.vector(0, 1);
	DIR_MAP.left = DIR_LEFT = Physics.vector(-1, 0);
	DIR_MAP.right = DIR_RIGHT = Physics.vector(1, 0);
};

function stopBody(body, atPos) {
  var state = body.state,
      lock = body.state.pos.unlock();
  
//  body.fixed = true;
  
  if (atPos)
    state.pos.clone(atPos);
  
//  state.old.pos.clone(state.pos);
  state.acc.zero();
//  state.old.acc.zero();
  state.vel.zero();
//  state.old.vel.zero();

  if (lock)
    body.state.pos.lock(lock);
  
//  body.fixed = false;
};

function getBody(bodyId) {
  return typeof bodyId == 'string' ? getBodies(bodyId)[0] : bodyId;
}

function getBodies(/* ids */) {
	var bodies = world.getBodies(),
  		body,
  		filtered = [],
  		i = bodies.length;
		
	while (i--) {
		body = bodies[i];
		if (body._id && ~indexOf.call(arguments, body._id)) {
			filtered.push(body);
		}
	}
	
	return filtered;
};

function getBodiesMap(/* ids */) {
  var bodies = world.getBodies(),
      body,
      map = {},
      i = bodies.length;
    
  while (i--) {
    body = bodies[i];
    if (body._id && ~indexOf.call(arguments, body._id)) {
      map[body._id] = body;
    }
  }
  
  return map;
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


/** END Event system hack **/

function pick(obj) {
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
};


// START LAYOUT MANAGER
//(function(root) {
  var defaultSlidingWindowOptions = {
    minPagesInSlidingWindow: 3, // should depend on size of visible area of the list, speed of device, RAM
    maxPagesInSlidingWindow: 6, // should depend on size of visible area of the list, speed of device, RAM
    averageBrickScrollDim: 50,
    averageBrickNonScrollDim: 50,  
    averageBricksPerScrollDim: 5,  
    averageBricksPerNonScrollDim: 3,  
    minBricks: 10,
    maxBricks: 10,
    bricksPerPage: 10,
//    numBricks: 0,
    brickLimit: Infinity,
    gutterWidth: 0,
    slidingWindowBounds: {
      min: 0,
      max: 0
    },
    range: {
      from: 0,
      to: 0
    },
    lastObtainedRange: {
      from: 0,
      to: 0
    },
    lastRequestedRange: {
      from: 0,
      to: 0
    },
    slidingWindowDimension: 0,
    horizontal: false
//    ,
//    edgeConstraintStiffness: CONSTANTS.constraintStiffness
  };
  
  function updateBrick(brick, data) {
    var width, height, 
        geo = brick.geometry;
    
    if (data.hasOwnProperty('vertices'))
      brick.geometry.setVertices(data.vertices);
    else if (data.hasOwnProperty('width') || data.hasOwnProperty('height')) {
      width = data.hasOwnProperty('width') ? data.width : geo._aabb._hw * 2;
      height = data.hasOwnProperty('height') ? data.height : geo._aabb._hh * 2;
      brick.geometry.setVertices([
        {x: 0, y: height},
        {x: width, y: height},
        {x: width, y: 0},
        {x: 0, y: 0}
      ]);
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
    Physics.util.extend(this, Physics.util.clone(defaultSlidingWindowOptions, true), options);
    this.masonryOptions = {};
    this.init();
  };
  
  LayoutManager.prototype = {
    // TODO: sleep / wake sliding window
    _sleeping: false,
    _waiting: false,
    _eventSeq: 0,
  //  _waiting: false,
    init: function() {
      var self = this,
          masonryOptions = this.masonryOptions,
          doSlidingWindow = this.slidingWindow;
      
      if (this.horizontal) {
        this.dirHead = DIR_LEFT;
        this.dirTail = DIR_RIGHT;
        this.axis = 'x';
        this.orthoAxis = 'y';
        this.axisIdx = 0;
        this.orthoAxisIdx = 1;
      }
      else {
        this.dirHead = DIR_UP;
        this.dirTail = DIR_DOWN;
        this.axis = 'y';
        this.orthoAxis = 'x';
        this.axisIdx = 1;
        this.orthoAxisIdx = 0;
      }
        
      this._rangeChangeListeners = [];
      this.containerId = this.container;
      this.container = getBody(this.containerId);
      this.scrollbarId = this.scrollbar;
      if (this.scrollbarId)
        this.scrollbar = getBody(this.scrollbarId);
      
      if (this.flexigroup)
        this.flexigroup = masonryOptions.flexigroup = getBody(this.flexigroup);
  
      this.offsetBody = this.flexigroup || this.container;
      this._initialOffsetBodyPos = Physics.vector().clone(this.offsetBody.state.pos);
      this._lastOffset = Physics.vector().clone(this.offsetBody.state.pos);
      this.headEdge = Physics.body('point', {
        fixed: true,
        x: this._lastOffset.get(0),
        y: this._lastOffset.get(1),
        mass: 1
      });
  
      this.headEdge._id = Physics.util.uniqueId('headEdge');
      this.log("SET HEAD EDGE TO " + this.headEdge.state.pos.get(this.axisIdx));
      this.headEdgeConstraint = API.distanceConstraint(this.offsetBody, this.headEdge, CONSTANTS.springStiffness, 0, this.dirHead);
      this.headEdgeConstraint.damp(CONSTANTS.springDamping);
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
      world.subscribe('drag', function(data) {
//        resetConstraint();
//        if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) < this.headEdge.state.pos.get(this.axisIdx))
          this.headEdgeConstraint['break']();
      }, this, 10);
      
      world.subscribe('constants.springDamping', function() {
        this.headEdgeConstraint.damp(CONSTANTS.springDamping);
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.damp(CONSTANTS.springDamping);
      }, this);

      world.subscribe('constants.springStiffness', function() {
        this.headEdgeConstraint.stiffness = CONSTANTS.springStiffness;
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.stiffness = CONSTANTS.springStiffness;
      }, this);

      // TODO: subscribe/unsubscribe on arm/break
//      world.subscribe('step', function bounceCheck() {
//        dirSign = sign(this.headEdge.state.pos.get(this.axisIdx) - this.offsetBody.state.pos.get(this.axisIdx));
//        if (!lastSign) {
//          lastSign = dirSign;
//          return;
//        }
//        
//        if (lastSign != dirSign) {
//          timesCrossedThreshold++;
//          lastSign = dirSign;
//        }
//        else
//          return;
//          
//        if (timesCrossedThreshold > MAX_BOUNCES) {
//          stopBody(this.offsetBody, this.headEdge.state.pos);
//          resetConstraint();
//        }
//      }, this, 10);
      
      this.headEdgeConstraint.armOnDistance(Infinity, this.dirHead); // no matter how far out of bounds we are, we should snap back
//      this.headEdgeConstraint.breakOnDistance(50, DIR_DOWN);
      if (this.bounds)
        this.setBounds(this.bounds); // convert to Physics AABB
      
      this._calcSlidingWindowDimensionRange();
      Physics.util.extend(masonryOptions, pick(this, 'bounds', 'horizontal', 'oneElementPerRow', 'oneElementPerCol', 'gutterWidth'));
      if (this.oneElementPerRow || this.oneElementPerCol)
        this.averageBrickNonScrollDim = this.pageNonScrollDim;
        
      if (doSlidingWindow) {
        world.subscribe('integrate:positions', this._onstep, this, -Infinity); // lowest priority
        this._onstep = Physics.util.throttle(this._onstep.bind(this), 30);
      }
      
      this.mason = new Mason(masonryOptions);
      if (this.bricks) {
        this.range.to = this.bricks.length;
        this.addBricks(this.bricks);
        delete this.bricks; // let mason keep track
      }
      
      this['continue']();
    },
    
    log: function() {
      var args = slice.call(arguments);
      args[0] = this.containerId + " " + args[0];
      log.apply(null, args);
    },
    
    updateBricks: function(data, skipResize) {
      var bricks = this.mason.bricks,
          brick,
          update,
          i = bricks.length,
          j;
      
      while (i--) {
        brick = bricks[i];
        j = data.length;
        while (j--) {
          update = data[j];
          if (update._id == brick._id) {
            updateBrick(brick, update);
          }
        }
      }
      
      if (!skipResize)
        this.mason.resize();
    },
    
    _getInfo: function() {
      return {
        minBricks: this.minBricks,
        maxBricks: this.maxBricks
      };
    },
    
    requestNewRange: function(range) {
      if (this._waiting)
        return;
      
      range = range ? this._capRange(range) : this.range;
      if (this.lastRequestedRange.from == range.from && this.lastRequestedRange.to == range.to) { // TODO: if we received less bricks than we wanted, then a repeat request is not out of the question
//        log("REQUESTING SAME RANGE AGAIN...what's the holdup?");
//        if (this.range.from == this.lastRequestedRange.from && this.range.to == this.lastRequestedRange.to) {
          this.log("IGNORING DUPLICATE RANGE REQUEST: " + this.lastRequestedRange.from + '-' + this.lastRequestedRange.to);
          return;
//        }
      }
      
      this.log("CURRENT RANGE: " + this.lastRequestedRange.from + '-' + this.lastRequestedRange.to + ", REQUESTING RANGE: " + range.from + '-' + range.to);
      this._waiting = true;
      triggerEvent(this._callbackId, {
        type: 'range',
        eventSeq: this._eventSeq++, 
        range: range, 
        currentRange: this.lastObtainedRange,
        info: this._getInfo()
      });
      
      this.lastRequestedRange = Physics.util.extend({}, range);
    },
    
//    prefetch: function(n) {
//      triggerEvent(this._callbackId, {
//        type: 'prefetch',
//        num: n || this.bricksPerPage
//      });
//    },
  
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
      this.pageArea = this.pageWidth * this.pageHeight;
      if (this.pageArea < 400 * 400)
        this.minPagesInSlidingWindow = 7;
      else if (this.pageArea < 800 * 800)
        this.minPagesInSlidingWindow = 7;
      else
        this.minPagesInSlidingWindow = 7;
      
      this.maxPagesInSlidingWindow = this.minPagesInSlidingWindow * 2;
      this.pageScrollDim = this.horizontal ? this.pageWidth : this.pageHeight;
      this.pageNonScrollDim = this.horizontal ? this.pageHeight : this.pageWidth;  
    },
    
    getDistanceFromHeadToTail: function() {
      var head = this.headEdge.state.pos.get(this.axisIdx),
          tail = this.tailEdge ? this.tailEdge.state.pos.get(this.axisIdx) : this.slidingWindowBounds.max;
          
      return tail - head;
    },
    
    _updateScrollbar: function() {
      if (this.scrollbar) {
        var dim = Math.max(6, Math.round(this.pageScrollDim * (this.pageScrollDim / this.getDistanceFromHeadToTail()) - 4));
        this.scrollbar.style[this.horizontal ? 'width' : 'height'] = Math.max(6, Math.round(this.pageWidth * (this.pageWidth / this.getDistanceFromHeadToTail()) - 4)) + 'px';
        
//        _scrollbarNodes[axis].style[_transformProperty] = _translateRulePrefix + _transformPrefixes[axis] + (-position * _metrics.container[axis] / _metrics.content[axis]) + 'px' + _transformSuffixes[axis];
      }
    },
    
    _onstep: function() {
      if (this._sleeping || this._waiting)
        return;
      
      var offset = this.offsetBody.state.pos.get(this.axisIdx),
          lastOffset = this._lastOffset.get(this.axisIdx),
          diff = offset - lastOffset,
          absDiff = Math.abs(diff);

      if (absDiff > 50) {
//        if (this._waiting && absDiff < 100)
//          return;
        
        this._lastScrollDirection = diff < 0 ? 'tail' : 'head';
        this._lastOffset.clone(this.offsetBody.state.pos);
        this['continue']();
      }
    },
  
    enableEdgeConstraints: function() {
      if (this.headEdgeConstraint)
        this.headEdgeConstraint.enable();
      if (this.tailEdgeConstraint)
        this.tailEdgeConstraint.enable();
    },
  
    disableEdgeConstraints: function() {
      if (this.headEdgeConstraint) {
        this.headEdgeConstraint['break']();
        this.headEdgeConstraint.disable();
      }
      
      if (this.tailEdgeConstraint) {
        this.tailEdgeConstraint['break']();
        this.tailEdgeConstraint.disable();
      }
    },
    
    checkHeadEdge: function() {
//      if (this.range.from == 0) {
        var coords = new Array(2);
        coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
//        coords[this.axisIdx] = Math.max(this.headEdge.state.pos.get(this.axisIdx), -this.slidingWindowBounds.min);
        coords[this.axisIdx] = -this.slidingWindowBounds.min;
        this.headEdge.state.pos.set(coords[0], coords[1]);
//      }
    },

    getTailEdgeCoords: function() {
      var coords = new Array(2);  
      coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
      if (this.range.from == 0 && this.range.to == this.brickLimit && this.slidingWindowDimension < this.pageHeight)
        coords[this.axisIdx] = this.headEdge.state.pos.get(this.axisIdx);
      else
        coords[this.axisIdx] = -this.slidingWindowBounds.max + this.pageScrollDim; // - this.pageOffset[this.axisIdx];
      
      return coords;
    },
    
    checkTailEdge: function() {
      if (this.range.to >= this.brickLimit) {
        var self = this,
            coords = this.getTailEdgeCoords();
        
        if (!this.tailEdge) {
          this.tailEdge = Physics.body('point', {
            fixed: true,
            x: coords[0],
            y: coords[1],
            mass: 1
          });
          
          this.tailEdge._id = Physics.util.uniqueId('tailEdge');
          this.tailEdgeConstraint = API.distanceConstraint(this.offsetBody, this.tailEdge, CONSTANTS.springStiffness, 0, this.dirTail);
          this.tailEdgeConstraint.damp(CONSTANTS.springDamping);
          this.tailEdgeConstraint['break']();
          this.tailEdgeConstraint.armOnDistance(Infinity, this.dirTail); // no matter how far out of bounds we are, we should snap back
//          this.tailEdgeConstraint.breakOnDistance(50, DIR_UP);
          world.subscribe('drag', function(data) {
//            if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) > this.tailEdge.state.pos.get(this.axisIdx))
              this.tailEdgeConstraint['break']();
          }, this, 10);          
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
    
    setLimit: function(len) {
      this.log("SETTING BRICK LIMIT: " + len);
//      this._waiting = false;
      this.brickLimit = len;
      this.checkTailEdge();
//      this.adjustSlidingWindow();
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
      
      this.disableEdgeConstraints();
      this.mason.setBounds(this.bounds);
      if (this.numBricks()) {
        // TODO: find brick X currently in view so we can re-find it after masonry reload
//        var viewport = this.getViewport(),
//            offset = {};
//        
//        offset[this.axis] = viewport.min | 0;
//        offset[this.orthoAxis] = 0;
//        this.mason.reload(offset);
        this.mason.reload();
        // TODO: reposition around brick X
      }
      
      this.recalc();
      this.checkHeadEdge();
      this.checkTailEdge();
      this.enableEdgeConstraints();
      
      if (callback)
        doCallback(callback);
      
      if (!this._waiting)
        this._adjustSlidingWindow();
//      this['continue']();
    },
    
    recalc: function() {
      var gutterWidth = this.mason.option('gutterWidth'),
          aabb,
          avgWidth = 0,
          avgHeight = 0,
          bricks = this.mason.bricks,
          numBricks = this.numBricks(),
          i = numBricks;
      
      Physics.util.extend(this.slidingWindowBounds, this.mason.getContentBounds());
      this.slidingWindowDimension = this.slidingWindowBounds.max - this.slidingWindowBounds.min;
      
      // TODO: prune unused props
//      this.numBricks = bricks.length;
      if (numBricks) {
        while (i--) {
          aabb = bricks[i].aabb();
          avgWidth += aabb.halfWidth;
          avgHeight += aabb.halfHeight;
        };
        
        this.averageBrickWidth = avgWidth * 2 / numBricks + gutterWidth;
        this.averageBrickHeight = avgHeight * 2 / numBricks + gutterWidth;
        this.averageBrickScrollDim = this.horizontal ? this.averageBrickWidth : this.averageBrickHeight;
        this.averageBrickNonScrollDim = this.horizontal ? this.averageBrickHeight : this.averageBrickWidth;
        this.averageBricksPerScrollDim = this.pageScrollDim / this.averageBrickScrollDim;
        this.averageBricksPerNonScrollDim = this.pageNonScrollDim / this.averageBrickNonScrollDim;
        this.averageBrickArea = this.averageBrickWidth * this.averageBrickHeight;
        this.bricksPerPage = this.pageArea / this.averageBrickArea | 0;
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
      var slidingWindowDim = Math.max(this.slidingWindowDimension, (this.maxSlidingWindowDimension + this.minSlidingWindowDimension) / 2);
      this.slidingWindowInsideBuffer = slidingWindowDim / 2; // how far away the viewport is from the closest border of the sliding window before we start to fetch more resources
      this.slidingWindowOutsideBuffer = Math.max(slidingWindowDim / 5, this.slidingWindowInsideBuffer / 2); // how far away the viewport is from the closest border of the sliding window before we need to adjust the window
    },
    
    getViewport: function() {
      if (!this.viewport)
        this.viewport = {};
      
      this.viewport.min = this._initialOffsetBodyPos.get(this.axisIdx) - this.offsetBody.state.pos.get(this.axisIdx);
      this.viewport.max = this.viewport.min + this.pageScrollDim;
      return this.viewport;
    },
    
  //  brickify: function(optionsArr) {
  //    for (var i = 0; i < l; i++) {
  //      options = optionsArr[i];
  //      optionsArr[i] = API.addBody('convex-polygon', options, options._id);
  //    }
  //    
  //    return optionsArr;
  //  },
  //  
  //  leash: function(bricks) {
  //    if (this.flexigroup) {
  //      for (var i = 0, l = bricks.length; i < l; i++) {
  //        API.distanceConstraint(bricks[i]._id, this.flexigroup._id, 0.5);
  //      }
  //    }    
  //  },
//    
//    addBricks: function(head, tail) {
//      this._waiting = false;
//      var headLength = head ? head.length : 0,
//          tailLength = tail ? tail.length : 0,
//          options;
//  
//      if (headLength) {
//        head = this.brickify(head);
//        head.reverse();
//        this.mason.prepended(head);
//        this.leash(head);
//      }
//      
//      if (tailLength) {      
//        tail = toBricks(tail);
//        this.mason.appended(tail);
//        this.leash(tail);
//      }
//      
//      this.range.from -= headLength;
//      this.range.to += tailLength;
//      
//      log("ADDING " + headLength + " BRICKS TO THE HEAD");
//      log("ADDING " + tailLength + " BRICKS TO THE TAIL" + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
//  //    log("ACTUAL TOTAL AFTER ADD: " + this.numBricks());
//      this.recalc();
//      this.checkTailEdge();
//      this.adjustSlidingWindow();
//  //    if (readjust)
//  //      this.adjustSlidingWindow();
//    },

//    doAddBricks: function(optionsArr, prepend) {
//      this._waiting = false;
//      var bricks = [],
//          l = optionsArr.length,
//          options;
//      
//      for (var i = 0; i < l; i++) {
//        options = optionsArr[i];
//        bricks[i] = API.addBody('convex-polygon', options, options._id);
//      }
//      
//      if (prepend)
//        bricks.reverse();
//      
//      this.mason[prepend ? 'prepended' : 'appended'](bricks);
//      if (this.flexigroup) {
//        for (var i = 0; i < l; i++) {
//          API.distanceConstraint(bricks[i]._id, this.flexigroup._id, 0.5);
//        }
//      }
//      
//      if (prepend)
//        this.range.from -= l;
//      else
//        this.range.to += l;
//
//      this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
//      
//      log("ADDING " + l + " BRICKS TO THE " + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
//  //    log("ACTUAL TOTAL AFTER ADD: " + this.numBricks());
//    },
//
//    addBricks: function(head, tail) {
//      if (head)
//        this.doAddBricks(head, true);
//      if (tail) {
//        this.doAddBricks(tail);
//        this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
//      }
//      
//      this.recalc();
//      if (prepend)
//        this.checkHeadEdge();
//      else
//        this.checkTailEdge();
//      
//      this.adjustSlidingWindow();
//    },

    numBricks: function() {
      return this.mason.bricks.length;
    },
    
    addBricks: function(optionsArr, prepend) {
      var bricks = [],
          l = optionsArr.length,
          options;
      
      for (var i = 0; i < l; i++) {
        options = optionsArr[i];
        options.frame = this.container;
        bricks[i] = API.addBody('convex-polygon', options, options._id);
      }
      
      if (prepend)
        bricks.reverse();
      
      this.mason[prepend ? 'prepended' : 'appended'](bricks);
      if (this.flexigroup) {
        for (var i = 0; i < l; i++) {
          API.distanceConstraint(bricks[i]._id, this.flexigroup._id, 0.5);
        }
      }
      
      if (prepend)
        this.range.from -= l;
      else {
        this.range.to += l;
        this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
      }
      
      Physics.util.extend(this.lastObtainedRange, this.range); 
      this.recalc();
      if (prepend)
        this.checkHeadEdge();
      else
        this.checkTailEdge();
      
      this.log("ADDING " + l + " BRICKS TO THE " + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
      //    log("ACTUAL TOTAL AFTER ADD: " + this.numBricks());
      this['continue']();
    },

    removeBricks: function(n, fromTheHead) {
      if (n == 0)
        return;
      
      var bricks = fromTheHead ? this.mason.bricks.slice(0, n) : this.mason.bricks.slice(this.numBricks() - n),
          brick,
          id,
          i;
      
      if ((i = bricks.length) == 0) {
        debugger;
        return;
      }
      
      world.remove(bricks);
      while (i--) {
        brick = bricks[i];
        id = brick._id;
        if (id)
          brick.state.renderData.set('opacity', 0);
      }
      
//      if (n == bricks.length)
//        this.mason.reset();
//      else
        this.mason[fromTheHead ? 'removedFromHead' : 'removedFromTail'](bricks);
//      this.mason.removed(bricks);
      
      if (fromTheHead)
        this.range.from += n;
      else
        this.range.to -= n;
      
      this.log("REMOVING " + n + " BRICKS FROM THE " + (fromTheHead ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
  //    log("ACTUAL TOTAL AFTER REMOVE: " + this.numBricks());
      this.recalc();
  //    if (readjust)
  //      this.adjustSlidingWindow();
    },
    
    sleep: function() {
      this.log("putting Mason to sleep");
      this._sleeping = this._waiting = true;
      if (this.numBricks())
        world.remove(this.mason.bricks);
      
      this.disableEdgeConstraints();
    },

    'continue': function() {
      this._sleeping = this._waiting = false;
      Physics.util.extend(this.lastRequestedRange, this.range);
      this._adjustSlidingWindow();
    },
    
    wake: function() {
      this.log("waking up Mason");
      if (this._sleeping && this.numBricks())
        world.add(this.mason.bricks);
      
      this.enableEdgeConstraints();
      this['continue']();
    },
    
    getHeadDiff: function() {
      return Math.max(this.getViewport().min - this.slidingWindowBounds.min, 0); // + favor
    },

    getTailDiff: function() {
      return Math.max(this.slidingWindowBounds.max - this.getViewport().max, 0); // + favor
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
          defaultAddDelta = Math.max(this.bricksPerPage, 4), //Math.max(Math.ceil(this.bricksPerPage / 2), 4),
          defaultRemoveDelta = Math.max(this.bricksPerPage, 1), //Math.max(Math.ceil(this.bricksPerPage / 2), 4),
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
        range.from -= Math.min(maxPrepend, defaultAddDelta);
        return this.requestNewRange(range);
      }
      ////////////////////////////////////////////////////////                                          |----|        (VIEWPORT)
      else if (this.range.to < this.brickLimit && numBricks && viewport.min >= slidingWindow.max) { 
        // sliding window is completely above viewport
        // remove all bricks and request new ones
        this.log("DECISION: sliding window is completely above viewport, removing all bricks");
        this.removeBricks(numBricks, true);
        Physics.util.extend(range, this.range); // reclone
        range.to += Math.min(maxAppend, defaultAddDelta);
        return this.requestNewRange(range);
      }
      ////////////////////////////////////////////////////////
      else if (canAdd && this.slidingWindowDimension < this.minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // grow window
        if (maxPrepend && (headDiff < tailDiff || !maxAppend)) {
          this.log("DECISION: growing sliding window towards the " + HEAD_STR);
          range.from -= Math.min(maxPrepend, defaultAddDelta);
        }
//        else if (tailDiff <= headDiff && maxAppend > 0)
        else if (maxAppend) {
          this.log("DECISION: growing sliding window towards the " + TAIL_STR);
          range.to += Math.min(maxAppend, defaultAddDelta);
        }
        else {
          this.log("DECISION: UH OH, SLIDING WINDOW IS CONFUSED!");
          debugger;
        }
        
        return this.requestNewRange(range);
      }
      else if (this.slidingWindowDimension > this.maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // shrink window
        var toRemove, fromTheHead;
        while (numBricks && this.slidingWindowDimension > this.maxSlidingWindowDimension) {
          
          toRemove = Math.min(defaultRemoveDelta, numBricks);
          fromTheHead = headDiff > tailDiff;
          this.log("DECISION: shrinking sliding window by " + toRemove + " at the " + (fromTheHead ? HEAD_STR : TAIL_STR));
          this.removeBricks(toRemove, fromTheHead);
          headDiff = this.getHeadDiff();
          tailDiff = this.getTailDiff();
        }
        
        return this.requestNewRange();
      }
      // grow the window in the direction where it has the least padding, if necessary
      else if (maxAppend && tailDiff < this.slidingWindowInsideBuffer) {
        if (tailDiff < this.slidingWindowOutsideBuffer) {
          var toAdd = Math.min(maxAppend, defaultAddDelta);
          range.to += toAdd;
          this.log("DECISION: growing sliding window by " + toAdd + " at the " + TAIL_STR);
          return this.requestNewRange(range);
        }
        else
          this.log("DECISION: not doing anything to sliding window");
//        else if (this.brickLimit - range.to < this.bricksPerPage * 2) /// doesn't make any sense because if brick limit is set, we already have all those resources in the main thread, no need to fetch them from anywhere
//          this.prefetch();
      }
      else if (maxPrepend && range.from > 0 && headDiff < this.slidingWindowOutsideBuffer) {
        var toAdd = Math.min(maxPrepend, defaultAddDelta);
        range.from -= toAdd;
        this.log("DECISION: growing sliding window by " + toAdd + " at the " + HEAD_STR);
        return this.requestNewRange(range);
      }
        
  //    if (range.from != this.range.from || range.to != this.range.to)
  //      this.requestNewRange(range);
    },

    _capRange: function(range) {
      if (range.from < 0 || range.to < 0 || range.to < range.from)
        debugger;
      
      range.from = Math.max(0, range.from);
      range.to = Math.min(range.to, this.brickLimit);
      return range;
    },
    
    home: function() {
      this.log("JUMPING HOME");
//      this.requestNewRange({
//        from: 0,
//        to: this.bricksPerPage
//      });
      
      this.disableEdgeConstraints();
      stopBody(this.offsetBody, this.headEdge.state.pos);
      this.enableEdgeConstraints();
    },
    
    end: function() {
      this.log("JUMPING TO THE END");
      var end = Math.min(this.brickLimit, this.lastBrickSeen),
          coords = this.getTailEdgeCoords();
      
//      this.requestNewRange({
//        from: Math.max(end - this.bricksPerPage, 0),
//        to: end
//      });
      
      this.disableEdgeConstraints();
      stopBody(this.offsetBody, Physics.vector(coords[0], coords[1]));
      this.enableEdgeConstraints();
    }
  }
  
//  root.LayoutManager = LayoutManager;
//})(self);
  
// END LAYOUT MANAGER

/*
* API
*/

var API = {
  // almost verbatim from physicsjs
/*  add: function(thing) {
    var i = 0,
        len = arg && arg.length || 0,
        thing = len ? arg[ 0 ] : arg;
  
    if ( !thing )
      return;
  
    // we'll either cycle through an array
    // or just run this on the arg itself
    do {
        switch (thing.type){
          case 'behavior':
              this.addBehavior(thing);
          break; // end behavior

          case 'integrator':
              this.integrator(thing);
          break; // end integrator

          case 'renderer':
              this.renderer(thing);
          break; // end renderer

          case 'body':
              this.addBody(thing);
          break; // end body
          
          default:
              throw 'Error: failed to add item of unknown type "'+ thing.type +'" to world';
          // end default
      }  
    } while ( ++i < len && (thing = arg[ i ]) );    
  },
*/
      
  chain: function() {
    ArrayProto.forEach.call(arguments, executeRPC);
  },
  
  step: function(time, dt) {
    world.step(time);
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
    stopBody(body);
  },

  teleportRight: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, RIGHT.state.pos.get(0));
    stopBody(body);
  },

  teleportCenterX: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, ORIGIN.state.pos.get(0));
    stopBody(body);
  },

  teleportCenterY: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(1, ORIGIN.state.pos.get(1));
    stopBody(body);
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

  cancelPendingActions: function(body) {
    body = getBody(body);
    var actions = body._actions,
        i = actions && actions.length;
    
    if (i) {
      while (i--) {
        body._actions[i].cancel();
      }
    }
  },
  
  flyLeft: function(bodyId, speed, callback) {
    this.flyTo(bodyId, LEFT.state.pos.get(0), null, null, speed, callback);
  },

  flyRight: function(bodyId, speed, callback) {
    this.flyTo(bodyId, RIGHT.state.pos.get(0), null, null, speed, callback);
  },

  flyCenter: function(bodyId, speed, callback) {
    this.flyTo(bodyId, ORIGIN.state.pos.get(0), null, null, speed, callback);
  },
  
  flyBy: function(bodyId, x, y, z, speed, callback) {
    var body = getBody(bodyId);
    return this.flyTo(body, 
                      body.state.pos.get(0) + (x || 0),
                      body.state.pos.get(1) + (y || 0),
                      body.state.pos.get(2) + (z || 0),
                      speed,
                      callback);
  },
  
  flyTo: function(bodyId, x, y, z, speed, callback) {
    var body = getBody(bodyId),
        destination = updateVector(Physics.vector().clone(body.state.pos), x, y, z),
        posLock,
        distance,
        lastDistance = Infinity,
        flyAction = new Action(
          'fly ' + bodyId + ' to ' + destination.toString(),
          function onstep() {
            body.state.acc.zero();
            if ((distance = body.state.pos.dist(destination)) <= lastDistance && distance > 0) {
              lastDistance = distance;
              body.state.vel.clone(destination).vsub(body.state.pos).normalize().mult(speed);
            }
            else
              flyAction.complete();
          }
        );
    
    function cleanUp() {
      if (posLock)
        body.state.pos.lock(posLock);
    };
    
    function oncomplete() {
      body.state.pos.clone(destination);
      body.state.vel.zero();
      cleanUp();
      if (callback)
        doCallback(callback);
    };
    
    
    flyAction.oncomplete = oncomplete;
    flyAction.oncancel = cleanUp;
    flyAction.onstart = function() {
      posLock = body.state.pos.unlock();
    };
    
    addAction(body, flyAction);
    flyAction.start();
  },
  
  teleport: function(bodyId /*[, another body's id] or [, x, y, z]*/) {
    var body = getBody(bodyId),
//        posLock = body.state.pos.unlock(),
        anchor,
        destination;
    
    if (typeof arguments[1] == 'string') {
      anchor = getBody(arguments[1]);
      if (anchor == LEFT || anchor == RIGHT || anchor == ORIGIN) // only teleport along X axis
        destination = Physics.vector().clone(body.state.pos).setComponent(0, anchor.state.pos.get(0));
      else
        destination = anchor.state.pos;
    }
    else {
      destination = Physics.vector.apply(Physics.vector, slice.call(arguments, 1));
    }
    
//    if (posLock)
//      body.state.pos.lock(posLock);
    log("Teleporting " + bodyId + " to " + destination.toString());
    stopBody(body, destination);
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
        coords = new Array(2),
        constraintEndpoint = coords[distanceAxis] = anchor.state.pos.get(distanceAxis),
        constraint = this.distanceConstraint(body, anchor, springStiffness, 0, distanceAxis == 0 ? DIR_MAP.right : DIR_MAP.down), // only snap along one axis
        posLock,
        snapAction = new Action(
          'snap ' + bodyId + ' ' + anchorId,
          checkStopped,
          endSnap,
          cleanUp
        );
    
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
      if (posLock)
        body.state.pos.lock(posLock);
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
    
    snapAction.oncomplete = endSnap;
    snapAction.oncancel = cleanUp;
    snapAction.onstart = function() {
      posLock = body.state.pos.unlock();
    };
    
    addAction(body, snapAction);
    snapAction.start();
  },
  
	removeBodies: function(/* ids */) {
		getBodies.apply(null, arguments).map(world.removeBody.bind(world));
	},
	
	removeBody: function(id) {
		this.removeBodies.call(this, id);
	},

  benchBodies: function(/* ids */) {
    Physics.util.extend(benchedBodies, getBodiesMap.apply(null, arguments));
  },
  
  unbenchBodies: function(/* ids */) {
    var i = arguments.length,
        id,
        body;
    
    while (i--) {
      id = arguments[i];
      body = benchedBodies[id];
      if (body)
        world.addBody(body);
    }
  },

	addBody: function(type, options, id) {
//    log("ADDING BODY: " + id);
		var body = Physics.body(type, options);
		if (id)
			body._id = id;
		
    if (options.lock) // lock on first render
      body.state.pos.lock(options.lock);
    
		world.add( body );
		return body;
	},

	drag: function drag(dragVector, ids) {
		var v,
			  bodies = typeof ids == 'string' ? getBodies(ids) : getBodies.apply(null, ids);

		if (bodies.length) {
      v = Physics.vector().set(dragVector[0], dragVector[1]);
			log("DRAG: " + v.toString());
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
      v = Physics.vector().set(dragVector[0], dragVector[1]);
      log("DRAG END: " + v.toString());
			world.publish({
				topic: 'dragend', 
				stop: stop,
				vector: v,
				bodies: bodies
			});
		}
	},
	
	removeConstraint: function(cstOrId) {
    log("Removing constraint");
	  var numConstraints = constrainer._distanceConstraints.length;
	  constrainer.remove(cstOrId);
	  if (numConstraints != constrainer._distanceConstraints.length + 1)
	    log("Failed to remove constraint");
	},
	
	distanceConstraint: function(bodyA, bodyB, stiffness, targetLength, dir) {
		if (!constrainer) {
			constrainer = Physics.behavior('verlet-constraints');
			world.add(constrainer);
		}
		
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
  
  set: function(constantName, value) {
    CONSTANTS[constantName] = value;
    
    switch (constantName) {
    case 'degree':
      for (var id in CONSTANTS) {
        if (/^_/.test(id)) {
          world.publish({
            topic: 'constants.' + id.slice(1)
          })
        }
      }
      
      break;
    case 'drag':
      integrator.options.drag = value;
      break;
    case 'springDamping':
      world.publish({
        topic: 'constants.springDamping'
      });
      
      break;
      
    case 'springStiffness':
      world.publish({
        topic: 'constants.springStiffness'
      });
      
      break;
    }
  },
  
  render: render
}