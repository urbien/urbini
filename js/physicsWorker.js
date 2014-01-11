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
    airDragBodies = [],
		constrainer,
		ZERO_ROTATION = [0, 0, 0],
		UNSCALED = [1, 1, 1],
    MIN_SCALE = [0.0001, 0.0001, 1],
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

self.log = function() {
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
	  importScripts(e.data.physicsJSUrl, e.data.masonryUrl);
	  DEBUG = e.data.debug;
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
            val /= 2;
          
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
  
//  log("RPC " + method + (args ? args.join(",") : ''));
  if (callbackId)
    args.push(callbackId);
  
  method.apply(obj, args);
}

function doCallback(callbackId, data) {
  if (typeof callbackId == 'function')
    callbackId(data);
  else {
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
  return Physics.vector().clone(LEFT).vsub(fromPos).set(v.get(0), 0).normalize();
};

function vectorToRight(fromPos) {
  return Physics.vector().clone(RIGHT).vsub(fromPos).set(v.get(0), 0).normalize();
};

function vectorToCenter(fromPos) {
  return Physics.vector().clone(ORIGIN).vsub(fromPos).set(v.get(0), 0).normalize();
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
      fixed: true,
      hidden: true,
      x: leftX,
      y: leftY,
      z: -back
    });

    RIGHT = Physics.body('point', {
      fixed: true,
      hidden: true,
      x: rightX,
      y: rightY,
      z: -back
    });
    
    ORIGIN = Physics.body('point', {
      fixed: true,
      hidden: true,
      x: minX,
      y: minY,
      z: 0
    });
    
    LEFT._id = 'left';
    RIGHT._id = 'right';
    ORIGIN._id = 'center';
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

function render() {
	var bodies = world.getBodies(),
  		body,
  		styles = {},
  		style,
  		update = false;

	world.publish({
	  topic: 'preRender'
	});
	
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
	
	world.publish({
    topic: 'postRender'
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
  var aabb = getAABB(body),
      pos = body.state.pos;
  
  return [
    pos.get(0) - (aabb._hw || 0),
    pos.get(1) - (aabb._hh || 0),
    getZ(body) //pos.get(2) - (aabb._hd || 0);
  ];
};

function getZ(body) {
//  if (body.geometry.name == 'point')
//    return -1;
//  else
//    return 0;
//  if (/Page/.test(body._id)) {
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
  		isTranslated = body.state.rendered.isTranslated,
      isRotated = body.state.rotation && (!body.state.rendered.rotation || !arrayEquals(body.state.rotation, body.state.rendered.rotation)),
	    opacityChanged = !wasRendered || body.state.renderData.isChanged('opacity'), 
	    styleChanged = opacityChanged || body.state.renderData.isChanged(),
  		style = styleChanged && body.state.renderData.toJSON(),
  		transform,
  		rx, ry, rz;
				
	if (!wasRendered || styleChanged || isTranslated || isRotated) {
    transform = {};
    if (!style)
      style = {};
    
		if (!wasRendered) {
			body.rendered(true);
		}

		rendered.angular.pos = state.angular.pos;
		rendered.pos.clone(state.pos);
		
		transform.scale = body.state.renderData.get('scale');
		transform.translate = getTranslation(body);		
		if (isRotated) {
		  transform.rotate = body.state.rendered.rotation = body.state.rotation;
      transform.rotate.unit = 'deg';
		}

    if (styleChanged) {
      Physics.util.extend(body.state.rendered.renderData, style);
      if (opacityChanged) {
        style.transform = transform;
        if (body.state.renderData.get('opacity') == 0)
          transform.scale = MIN_SCALE;
      }
      
      body.state.renderData.clearChanges();
    }
      
    if (transform.translate || transform.scale || transform.rotate)
      style.transform = transform;
    
		return style;
	}
};

function initWorld(_world, stepSelf) {
	world = _world;
	integrator = Physics.integrator('verlet', { drag: CONSTANTS.drag });
	world.integrator(integrator);
	
	if (stepSelf)
	  Physics.util.ticker.subscribe(API.step);
	
	Physics.util.extend(Physics.util, {	  
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
	
	world.subscribe('drag', function(data) {
		var bodies = data.bodies,
  			body,
  			i = bodies.length;
	
//		log('DRAG ' + data.vector.toString());
		while (i--) {
			body = bodies[i];
			body.fixed = true;
			body.state.pos.vadd(data.vector);
			stopBody(body);
		}
	}, null, 100);

	world.subscribe('dragend', function(data) {
		var stop = data.stop,
		    bodies = data.bodies,
  			body,
  			v = data.vector.mult( 1 / 10 ),
  			i = bodies.length;
			
//		log('DRAGEND ' + data.vector.toString());
		while (i--) {
			body = bodies[i];
      body.fixed = false;
      stopBody(body);
		  if (!stop)
			  body.state.vel.clone(v);
		}
	}, null, 100);
	
	world.subscribe('integrate:velocities', function() {
	  var i = airDragBodies.length,
	      body;
	  
	  while (i--) {
	    body = airDragBodies[i];
	    if (!body.fixed) {
  	    body.state.vel.mult(body.options.drag);
        body.state.old.vel.clone(body.state.vel);
	    }
	  }	  
	});
	
	world.subscribe('add:body', function(data) {
	  var body = data.body;
	  if (body.options._id) {
	    body._id = body.options._id;
	    if (world.getBodies().filter(function(b) {return b._id == data.body._id}).length > 1)
	      debugger;
	  }
	    
    if (body.options.lock)
      body.state.pos.lock(body.options.lock);

	  if (body.options.drag)
	    airDragBodies.push(body);
	  
	  if (body.geometry.name == 'point' && body.options.render)
	    body.state.renderData.set('opacity', 1);
	  
	  body.state.beforeAction = {};
    body.state.renderDataBeforeAction = {};
	});

	world.subscribe('remove:body', function(data) {
	  var idx = airDragBodies.indexOf(data.body);
    if (~idx)
      airDragBodies.splice(idx, 1);
  });

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
  
  if (atPos) {
    if (atPos instanceof Physics.vector)
      state.pos.clone(atPos);
    else
      state.pos.set.apply(state.pos, atPos);
  }
  
  state.old.pos.clone(state.pos);
  state.acc.zero();
  state.old.acc.zero();
  state.vel.zero();
  state.old.vel.zero();

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

function getRectVertices(width, height) {
  return [
    {x: 0, y: 0},
    {x: width, y: 0},
    {x: width, y: height},
    {x: 0, y: height}
  ];
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
    Physics.util.extend(this, Physics.util.clone(defaultSlidingWindowOptions, true), options);
    this.options = pick(options, 'minPagesInSlidingWindow', 'maxPagesInSlidingWindow');
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
          doSlidingWindow = this.slidingWindow,
          constantsEvent;
      
      this.reset();
      this._listeners = {};
      if (this.horizontal) {
        this.dirHead = DIR_LEFT;
        this.dirTail = DIR_RIGHT;
        this.axis = 'x';
        this.orthoAxis = 'y';
        this.axisIdx = 0;
        this.orthoAxisIdx = 1;
        this.aabbAxisDim = '_hw';
        this.aabbOrthoAxisDim = '_hh';
      }
      else {
        this.dirHead = DIR_UP;
        this.dirTail = DIR_DOWN;
        this.axis = 'y';
        this.orthoAxis = 'x';
        this.axisIdx = 1;
        this.orthoAxisIdx = 0;
        this.aabbAxisDim = '_hh';
        this.aabbOrthoAxisDim = '_hw';
      }
        
      this._rangeChangeListeners = [];
      this.scrollbarId = this.scrollbar;
      if (this.scrollbarId)
        this.scrollbar = getBody(this.scrollbarId);
      
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
        this.flexigroupId = this.container;
        this.flexigroup = getBody(this.flexigroupId);
      }
      else {
        this.containerId = this.container;
        this.container = getBody(this.containerId);
      }
  
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
      this.headEdgeConstraint = API.distanceConstraint(this.offsetBody, this.headEdge, this.getSpringStiffness(), this.flexigroup ? null : 0, this.dirHead);
      this.headEdgeConstraint.damp(this.getSpringDamping());
      this.headEdgeConstraint.armOnDistance(Infinity, this.dirHead); // no matter how far out of bounds we are, we should snap back
  //    this.headEdgeConstraint.breakOnDistance(50, DIR_DOWN);
      if (this.bounds)
        this.setBounds(this.bounds); // convert to Physics AABB
      
      this._calcSlidingWindowDimensionRange();
      Physics.util.extend(masonryOptions, pick(this, 'bounds', 'horizontal', 'oneElementPerRow', 'oneElementPerCol', 'gutterWidth', 'gutterWidthHorizontal', 'gutterWidthVertical'));
      if (this.oneElementPerRow || this.oneElementPerCol)
        this.averageBrickNonScrollDim = this.pageNonScrollDim;
        
      if (doSlidingWindow) {
        this._subscribe('integrate:positions', this._onstep, this, -Infinity); // lowest priority
        this._onstep = Physics.util.throttle(this._onstep.bind(this), 30);
      }
      
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
      this._subscribe('drag', function(data) {
//        resetConstraint();
//        if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) < this.headEdge.state.pos.get(this.axisIdx))
          this.headEdgeConstraint['break']();
      }, 10);
      
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
      this._subscribe(constantsEvent, function(data) {
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
//        case 'drag':
//          var bricks = this.mason.bricks,
//              i = bricks.length,
//              brick;
//          
//          while (i--) {
//            brick = bricks[i];
//            if (!brick.options.hasOwnProperty('drag'))
//              airDragBodies.push(bricks[i]);
//              
//            brick.options.drag = value;
//          }
//
//          if (!this.container.options.hasOwnProperty('drag'))
//            airDragBodies.push(this.container);
//
//          this.container.options.drag = value;
//          break;
        }
      }, this);

      this._subscribe('preRender', function() {
        var bricks = this.mason.bricks,
            brick,
            i = bricks.length;
        
        if (this._sleeping) {
          if (i) {
            while (i--) {
              brick = bricks[i];
              API.completePendingActions(brick);
              world.removeBody(brick);
            }
          }
          
          if (this.scrollbar)
            world.removeBody(this.scrollbar);

          return;
        }
        else {
          while (i--) {
            preRender(bricks[i]);
          }
          
          if (this.jiggle)
            this.tiltBricksInertially();
          
          if (this.scrollbar)
            this._updateScrollbar();
        }
      }, this);
      
      this._subscribe('postRender', function() {
        if (this._sleeping && this.mason.bricks.length) {
          world.remove(this.mason.bricks);
          return;
        }        
      });
      
      if (this.jiggle) {
        this._subscribe('sleep:' + this.id, function() {
          var bricks = this.mason.bricks,
              brick,
              i = this.mason.bricks.length;
          
          while (i--) {
            bricks[i].state.rotation = ZERO_ROTATION;
          }
        });
      }
      
      this['continue']();
    },
    
    _subscribe: function(event, handler, priority) {
      world.subscribe(event, handler, this, priority);
      var handlers = this._listeners[event] = this._listeners[event] || [];
      handlers.push(handler);
    },

    _unsubscribe: function(event, handler) {
      var handlers = this._listeners[event],
          i = handlers.length;
      
      while (i--) {
        if (handler) {
          if (handler == handlers[i]) {
            world.unsubscribe(event, handler);
            handlers.splice(i, 1);
            break;
          }
        }
        else {
          world.unsubscribe(event, handlers[i]);
          handlers.length--;
        }
      }
    },
    
    tiltBricksInertially: function() {
      var vel = this.offsetBody.state.pos.get(this.axisIdx) - this.offsetBody.state.old.pos.get(this.axisIdx),
          thresh = 1,
          absVel = Math.sqrt(Math.abs(vel)),
          rotation = absVel > thresh ? ((absVel - thresh) * 100000 | 0) / 100000 : 0,
          rArr = [null, null, 0],
          brick,
          i = this.mason.bricks.length;

      rotation = Math.min(rotation, 5);
      rotation *= sign(vel);
      rArr[this.orthoAxisIdx] = rotation;
      rArr[this.axisIdx] = 0;
      
      while (i--) {
        brick = this.mason.bricks[i];
        brick.state.rotation = rArr;
      }      
    },

    center: function(bodyId, time, callback) {
      var self = this,
          body = this.getBrick(bodyId),
          aabb = getAABB(body),
          fixed = body.fixed,
          posLock,
          pos = body.state.pos,
          orgX = pos.get(0),
          orgY = pos.get(1),
          steps = Math.ceil(time / WORLD_CONFIG.timestep),
          step = 0,
          x, 
          y,
          factor,
          renderData = body.state.renderData,
//          viewportOffsetX = this.offsetBody.state.offset.get(0),
//          viewportOffsetY = this.offsetBody.state.offset.get(1),
          boundsScrollDim = BOUNDS[this.aabbAxisDim] * 2,
          viewportDim,
          goalPos = [null, null, 0],
          centerAction;
      
      body.state.beforeAction['center'] = {
        pos: Physics.vector().clone(pos)
      };
      
      centerAction = new Action(
        'center' + body.options._id,
        function onstep() {
          viewport = self.getViewport();
          scale = body.state.renderData.get('scale') || UNSCALED,
          bodyAxisHalfDim = aabb[self.aabbAxisDim] * scale[self.axisIdx],
          bodyOrthoHalfDim = aabb[self.aabbOrthoAxisDim] * scale[self.orthoAxisIdx],
          goalPos[self.orthoAxisIdx] = boundsScrollDim / 2;
          viewportDim = viewport.max - viewport.min;
          goalPos[self.axisIdx] = (viewport.max + viewport.min - (boundsScrollDim - viewportDim)) / 2; // in case things are moving while we're centering, we should recalculate this every time
          if (step++ >= steps)
            centerAction.complete();
          else {
            factor = step / steps;
            x = orgX + factor * (goalPos[0] - orgX);
            y = orgY + factor * (goalPos[1] - orgY);
//            log('centering ' + body._id + ' to ' + x + ', ' + y);
//            log('centering: step size: ' + factor * (goalPos[0] - pos.get(0)) + ', ' + factor * (goalPos[1] - pos.get(1)));
            pos.set(x, y);
          }
        }
      );
      
      function cleanUp() {
        pos.set.apply(pos, goalPos);
        body.fixed = fixed;
        if (posLock)
          body.state.pos.lock(posLock);
      };
      
      function oncomplete() {
        cleanUp();
        if (callback)
          doCallback(callback);
      };
      
      centerAction.oncomplete = oncomplete;
      centerAction.oncancel = cleanUp;
      centerAction.onstart = function() {
        posLock = body.state.pos.unlock();
        stopBody(body);
        body.fixed = false;
      };

      addAction(body, centerAction);
      centerAction.start();
    },
    
    getBrick: function(bodyId) {
      if (typeof bodyId != 'string')
        return bodyId;
      
      var bricks = this.mason.bricks,
          brick,
          i = bricks.length;
      
      while (i--) {
        brick = bricks[i];
        if (brick._id == bodyId)
          return brick;
      }
      
      return null;
    },

    isolate: function(bodyId, type, time, callback) {
      var body = this.getBrick(bodyId),
          bricks = this.mason.bricks.slice();

      bricks.splice(bricks.indexOf(body), 1);
      this[(type || 'pop') + 'Out'].call(this, bricks, time);
    },    

    flyToTopCenter: function(bodyId, speed, opacity, callback) {
      var body = this.getBrick(bodyId),
          pos = body.state.pos,
          viewport = this.getViewport(),
          dest = [0, 0, 0];
      
      dest[this.axisIdx] = viewport.min;
      dest[this.orthoAxisIdx] = this.bounds._pos.get(this.orthoAxisIdx);
      API.flyTo(body, dest[0], dest[1], 0, speed, opacity, callback);
    },
    
    maximize: function(bodyId, time, callback) {
      var body = this.getBrick(bodyId),
          aabb = getAABB(body),
          originalScale = body.state.renderData.get('scale') || UNSCALED,
          vWidth = BOUNDS._hw * 2,
          vHeight = BOUNDS._hh * 2,
          bodyWidth = aabb._hw * 2 * originalScale[0],
          bodyHeight = aabb._hh * 2 * originalScale[1],
          bricks = this.mason.bricks.slice();

      bricks.splice(bricks.indexOf(body), 1);
      if (this.pop)
        this.popOut(bricks, time);
      else if (this.fade)
        this.fadeOut(bricks, time);
      
      body.state.beforeAction['maximize'] = {
        pos: Physics.vector().clone(body.state.pos)
      };
      
      body.state.renderDataBeforeAction['maximize'] = {
        scale: originalScale.slice()          
      };

      API.scale(body, vWidth / bodyWidth, vHeight / bodyHeight, time/*, callback*/); // one callback is enough
      this.center(body, time, callback);
    },    
    
//    maximize1: function(bodyId, time, callback) {
//      var self = this,
//          body = getBody(bodyId),
//          pos = body.state.pos,
//          steps = time / WORLD_CONFIG.timestep,
//          step = 0,
//          factor,
//          originalScale = body.state.renderData.get('scale') || UNSCALED,
//          renderData = body.state.renderData,
////          viewportOffsetX = this.offsetBody.state.offset.get(0),
////          viewportOffsetY = this.offsetBody.state.offset.get(1),
//          vWidth = BOUNDS._hw * 2,
//          vHeight = BOUNDS._hh * 2,
//          boundsScrollDim = BOUNDS[this.aabbAxisDim] * 2,
//          bodyWidth = body.geometry._aabb._hw * 2 * originalScale[0],
//          bodyHeight = body.geometry._aabb._hh * 2 * originalScale[1],
//          goalPos = [null, null, 0],
//          goalScale,
//          maximizeAction;
//      
//      goalPos[self.orthoAxisIdx] = boundsScrollDim / 2;
//      goalScale = [vWidth / bodyWidth, vHeight / bodyHeight, 1];
//      maximizeAction = new Action( // maybe use scaleAction internally
//        'maximize' + body.options._id,
//        function onstep() {
//          viewport = self.getViewport();
//          goalPos[self.axisIdx] = (viewport.max - viewport.min) / 2; // in case things are moving while we're maximizing, we should recalculate this every time
//          if (step++ >= steps)
//            maximizeAction.complete();
//          else {
//            factor = step / steps;
//            i = currentScale.length;
//            while (i--) {
//              currentScale[i] = originalScale[i] + factor * (goalScale[i] - originalScale[i]);
//            }
//           
//            pos.set(pos.get(0) + factor * (goalPos[0] - pos.get(0)), 
//                    pos.get(1) + factor * (goalPos[1] - pos.get(1)));
//            
//            renderData.set('scale', currentScale);
//          }
//        }
//      );
//      
//      function cleanUp() {
//        body.state.renderData.set('scale', goalScale);
//        pos.set.apply(pos, goalPos);
//      };
//      
//      function oncomplete() {
//        cleanUp();
//        if (callback)
//          doCallback(callback);
//      };
//      
//      maximizeAction.oncomplete = oncomplete;
//      maximizeAction.oncancel = cleanUp;
//      addAction(body, maximizeAction);
//      maximizeAction.start();
//    },    

    destroy: function(animate, callback) {
      var self = this,
          bricks = this.mason.bricks,
          l = bricks.length,
          destroyed = false;
      
      function doDestroy() {
        if (!destroyed) {
          destroyed = true;
          delete layoutManagers[self.id];
          if (l)
            world.remove(bricks);
          
          for (var event in self._listeners) {
            self._unsubscribe(event);
          }
          
          if (callback)
            doCallback(callback);
        }
      }
      
      if (!animate || !l)
        return doDestroy();
      
      if (this.pop)
        this.popOut(bricks, doDestroy);
      else if (this.fade)
        this.fadeOut(bricks, doDestroy);
      
      if (this.scrollbar)
        world.removeBody(this.scrollbar);
    },
    
    actionOut: function(bricks, totalTime, action, actionFn, callback) {
      var random = this[action] == 'random' ? true : false,
          runCallback = function() {
            if (callback) {
              callback();
              callback = null;
            }
          },
          time = 0,
          timeInc,
          viewport = this.getViewport(2),
          brick,
          scrollAxisPos;
      
      bricks = bricks || this.mason.bricks;
      if (totalTime)
        timeInc = totalTime / bricks.length;
      else
        timeInc = 200;
      
      for (var i = 0, l = bricks.length; i < l; i++) {
        brick = bricks[i];
        scrollAxisPos = brick.state.pos.get(this.axisIdx);
        if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
          if (random)
            time = Math.random() * 3000;
          else
            time += timeInc;
          
          actionFn(brick, time, runCallback);
//          API.scale(brick, MIN_SCALE[0], MIN_SCALE[1], time, runCallback);
        }
      }              
    },
    
    popOut: function(bricks, time, callback) {
      this.actionOut(bricks, time, 'pop', function(brick, time, callback) {
        API.scale(brick, MIN_SCALE[0], MIN_SCALE[1], time, callback);
      }, callback);
      
//      var random = this.pop == 'random' ? true : false,
//          runCallback = function() {
//            if (callback) {
//              callback();
//              callback = null;
//            }
//          },
//          time = 0,
//          viewport = this.getViewport(),
//          brick,
//          scrollAxisPos;
//      
//      bricks = bricks || this.mason.bricks;
//      for (var i = 0, l = bricks.length; i < l; i++) {
//        brick = bricks[i];
//        scrollAxisPos = brick.state.pos.get(this.axisIdx);
//        if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
//          if (random)
//            time = Math.random() * 3000;
//          else
//            time += 200;
//          
//          API.scale(brick, MIN_SCALE[0], MIN_SCALE[1], time, runCallback);
//        }
//      }        
    },
    
    fadeOut: function(bricks, time, callback) {
      this.actionOut(bricks, time, 'fade', function(brick, time, callback) {
        API.opacity(brick, 0, time, callback);
      }, callback);
      
//      var random = this.fade == 'random' ? true : false,
//          runCallback = function() {
//            if (callback) {
//              callback();
//              callback = null;
//            }
//          },
//          time = 0,
//          viewport = this.getViewport(),
//          brick,
//          scrollAxisPos;      
//
//      bricks = bricks || this.mason.bricks;
//      for (var i = 0, l = bricks.length; i < l; i++) {
//        brick = bricks[i];
//        scrollAxisPos = brick.state.pos.get(this.axisIdx);
//        if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
//          if (random)
//            time = Math.random() * 3000;
//          else
//            time += 200;
//          
//          API.opacity(brick, 0, time, runCallback);
//        }
//      }
    },
    
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
    
    requestMore: function(n, atTheHead) {
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

    requestLess: function(head, tail) {
      if (this._waiting)
        return;
      
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
    
    _updateScrollbar: function() {
      if (this.scrollbar && this.scrollable) {
        var viewport = this.getViewport(),
            viewportDim = viewport.max - viewport.min,
            slidingWindow = this.slidingWindowBounds,
            slidingWindowDimension = this.slidingWindowDimension,
            limit = this.brickLimit == Infinity ? this.lastBrickSeen : this.brickLimit,
            dim = Math.max(6, Math.round(this.pageScrollDim * (this.pageArea / this.averageBrickArea) / limit - 4)),
            aabb = getAABB(this.scrollbar),
            vel = this.scrollbar.state.vel.norm(),
            pos = this.scrollbar.state.pos,
            currentOpacity = this.scrollbar.state.renderData.get('opacity'),
            axisVal,
            orthoAxisVal, 
            opacity,
            percentOffset;
        
        opacity = Math.max(Math.min(MAX_OPACITY, Math.pow(vel, 0.33), currentOpacity + OPACITY_INC),
                                                                      currentOpacity - OPACITY_INC/2);
            
        percentOffset = (this.range.from + ((viewport.min - slidingWindow.min) / slidingWindowDimension) * (this.range.to - this.range.from)) / limit; // estimate which tiles we're looking at
        
        this.scrollbar.state.renderData.set(this.horizontal ? 'width' : 'height', dim + 'px');
        
        // ugly hack to avoid creating array each time
        axisVal = viewport.min + viewportDim * percentOffset;
        if (axisVal != pos.get(this.axisIdx))
          pos.setComponent(this.axisIdx, axisVal);
          
        orthoAxisVal = this.bounds._pos.get(this.orthoAxisIdx) + this.bounds[this.aabbOrthoAxisDim] - aabb[this.aabbOrthoAxisDim] * 2;
        if (orthoAxisVal != pos.get(this.orthoAxisIdx))
          pos.setComponent(this.orthoAxisIdx, orthoAxisVal);
        
        if (Math.abs(opacity - currentOpacity) > 0.01)
          this.scrollbar.state.renderData.set('opacity', opacity);
      }
    },
    
    _onstep: function() {
//      this.offsetBody.state.renderData.set('perspective-origin-y', (-offset|0) + 'px');
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
      if (this.slidingWindow) {
        // head and tail edge swim around
        var coords = new Array(2);
        coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
//        coords[this.axisIdx] = Math.max(this.headEdge.state.pos.get(this.axisIdx), -this.slidingWindowBounds.min);
        coords[this.axisIdx] = -this.slidingWindowBounds.min;
        this.headEdge.state.pos.set(coords[0], coords[1]);
      }
//      }
    },

    getTailEdgeCoords: function() {
      var coords = new Array(2);  
      coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
      if (this.slidingWindow) {
        // head and tail edge swim around
        if (this.range.from == 0 && this.range.to == this.brickLimit && this.slidingWindowDimension < this.pageScrollDim)
          coords[this.axisIdx] = this.headEdge.state.pos.get(this.axisIdx);
        else
          coords[this.axisIdx] = -this.slidingWindowBounds.max + this.pageScrollDim; // - this.pageOffset[this.axisIdx];
      }
      else {
        // tail edge depends only on size of the layout and the size of the paint bounds
        if (this.slidingWindowDimension < this.pageScrollDim)
          coords[this.axisIdx] = this.headEdge.state.pos.get(this.axisIdx);
        else
          coords[this.axisIdx] = -this.slidingWindowDimension + this.pageScrollDim; // NOT the same as in above IF statement
      }
      
      return coords;
    },
    
    checkTailEdge: function() {
      if (this.numBricks() && this.range.to >= this.brickLimit) {
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
          this.tailEdgeConstraint = API.distanceConstraint(this.offsetBody, this.tailEdge, this.getSpringStiffness(), this.flexigroup ? null : 0, this.dirTail);
          this.tailEdgeConstraint.damp(this.getSpringDamping());
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
    
//    setLimit: function(len) {
//      this.log("SETTING BRICK LIMIT: " + len);
////      this._waiting = false;
//      this.brickLimit = len;
//      this.checkTailEdge();
////      this.adjustSlidingWindow();
//    },
    
    /**
     * @param reverse - if true, will place bricks in the direction from tail to head
     */
    reload: function(reverse) {
      var viewport = this.getViewport(),
          multiplier = reverse ? 1 : -1,
          edge = (reverse ? viewport.max : viewport.min) | 0,
          offset;
      
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
    },

    setLimit: function(limit) {
      this.brickLimit = limit; //this.lastBrickSeen || 0;
      this.log("SETTING BRICK LIMIT: " + this.brickLimit);
      this.checkTailEdge();
    },

    unsetLimit: function() {
      this.brickLimit = Infinity;
      if (this.tailEdge) {
        API.removeConstraint(this.tailEdgeConstraint);
        world.removeBody(this.tailEdge);
        delete this.tailEdgeConstraint;
        delete this.tailEdge;
      }
      
      this.log("UNSETTING BRICK LIMIT");
    },

    reset: function() {
      if (this.mason)
        this.removeBricks(this.numBricks());
      
      this.brickLimit = Infinity;
      this.lastBrickSeen = 0;
      if (!this.range)
        this.range = {};
      
      this.range.from = this.range.to = 0;
      
      if (!this.slidingWindowBounds)
        this.slidingWindowBounds = {};
      
      this.slidingWindowBounds.min = this.slidingWindowBounds.max = 0;
      if (this.mason && !this._sleeping && !this._waiting)
        this._adjustSlidingWindow();
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

    numBricks: function() {
      return this.mason.bricks.length;
    },
    
    addBricks: function(optionsArr, prepend) {
      this.lastDirection = prepend ? 'head' : 'tail';
      this.checkRep();
      var numBefore = this.numBricks(),
          bricks = [],
          brick,
          viewport = this.getViewport(),
          viewportDim = BOUNDS[this.aabbAxisDim] * 2,
          viewportOrthoDim = BOUNDS[this.aabbOrthoAxisDim] * 2,
          coords = new Array(3),
          destX, destY, destZ,
          l = optionsArr.length,
          options;
      
      this.biggestViewportMin = Math.max(viewport.min, this.biggestViewportMin || 0);
//      log("ADDING BRICKS: " + optionsArr.map(function(b) { return parseInt(b._id.match(/\d+/)[0])}).sort(function(a, b) {return a - b}).join(","));
      for (var i = 0; i < l; i++) {
        options = optionsArr[i];
        if (!this.flexigroup)
          options.frame = this.container;
//        if (!options.hasOwnProperty('drag') && this.hasOwnProperty('drag'))
//          options.drag = this.drag;
        
//        options.z = -1;
        bricks[i] = Physics.body('convex-polygon', options);
      }

      if (!numBefore) {
        this.mason.bricks = bricks;
        this.reload();
      }
      else
        this.mason[prepend ? 'prepended' : 'appended'](bricks);
      
      if (this.flexigroup) {
        var brick,
            flexigroupId = this.flexigroup._id,
            flexiPos = this.flexigroup.state.pos;
        
        for (var i = 0; i < l; i++) {
          brick = bricks[i];
          API.distanceConstraint(brick._id, this.flexigroup._id, 0.05, brick.state.pos.dist(flexiPos), this.dirHead);
        }
      }
      
      if (prepend)
        this.range.from -= l;
      else {
        this.range.to += l;
        this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
        this.brickLimit = Math.max(this.brickLimit, this.lastBrickSeen);
      }
      
      if (this.biggestViewportMin) // only be fancy on the first page
        world.add(bricks);
      else if (this.fly) {
        function fix(brick) {
          brick.fixed = true;
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
            stopBody(brick, coords);
            brick.fixed = false;
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
            random = this.pop == 'random' ? true : false;
            
        for (var i = 0; i < l; i++) {
          brick = bricks[i];
          scrollAxisPos = brick.state.pos.get(this.axisIdx);
          if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
            brick.state.renderData.set('scale', MIN_SCALE);
            if (random)
              time = Math.random() * 3000;
            else
              time += 200;
            
            API.scale(brick, 1, 1, time);
//            API.opacity(brick, 1, time/10);
          }
          
          world.addBody(brick);
        }        
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
//      this.printState();
      //    log("ACTUAL TOTAL AFTER ADD: " + this.numBricks());
      if (this.scrollbar && this.scrollable)
        this.scrollbar.state.renderData.set('opacity', MAX_OPACITY);
      
      this.checkRep();
      this['continue']();
    },

    printState: function() {
      this.log("STATE: " + this.mason.bricks.map(function(b) { return parseInt(b._id.match(/\d+/)[0])})/*.sort(function(a, b) {return a - b})*/.join(","));
    },
    
    checkRep: function() {
      if (!DEBUG)
        return;
      
      if (this.range.to < this.range.from)
        throw "range integrity lost - range is of a negative length";
      if (this.range.to - this.range.from !== this.mason.bricks.length)
        throw "range integrity lost - saved range doesn't have the same length as the number of bricks in the layout";
      var bounds = this.mason.getContentBounds();
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
      
      world.remove(bricks);
      while (i--) {
        brick = bricks[i];
        API.completePendingActions(brick);
        id = brick._id;
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
      
//      this.log("REMOVED BRICKS: " + bricks.map(function(b) { return parseInt(b._id.match(/\d+/)[0])}).sort(function(a, b) {return a - b}).join(","));
//      this.printState();
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
//      var bricks = this.mason.bricks,
//      this._waiting = true;
//      var self = this,
//          viewport = this.getViewport(),
//          bricks = this.mason.bricks,
//          brick,
//          scrollAxisPos,
//          i = bricks.length;
//      
//      while (i--) {
//        API.completePendingActions(bricks[i]);
//      }
//      
//      while (i--) {        
//        API.cancelPendingActions(bricks[i]);
//      }
//
//      function sleep() {
//        self._readyToSleep = true;
//      };
//      
//      i = bricks.length;
//      while (i--) {
//        brick = bricks[i];
//        scrollAxisPos = brick.state.pos.get(this.axisIdx);
//        if (scrollAxisPos > viewport.min && scrollAxisPos < viewport.max) {
//          API.flyTo(brick, null, null, -500, Math.max(1, Math.random() * 5), 0, sleep);
//        }
//      }
      
      // will remove bricks on prerender
      this.disableEdgeConstraints();
    },

    'continue': function() {
      this._sleeping = this._waiting = false;
//      Physics.util.extend(this.lastRequestedRange, this.range);
      this._adjustSlidingWindow();
    },
    
    saveState: function() {
      log("Saving " + this.id + "state");
      this._state = {};
      var bricks = this.mason.bricks,
          brick,
          id,
          i = bricks.length;
      
      while (i--) {
        brick = bricks[i];
        API.completePendingActions(brick);
        id = brick._id;
        this._state[id] = {
          pos: Physics.vector().clone(brick.state.pos),
          renderData: brick.state.renderData.toJSON(true)
        }
      }
    },
    
    loadState: function() {
      if (!this._state)
        return;
      
      var bricks = this.mason.bricks,
          brick,
          brickState,
          posLock,
          prop,
          id,
          i = bricks.length;
      
      while (i--) {
        brick = bricks[i];
        API.completePendingActions(brick);
        id = brick._id;
        brickState = this._state[id];
        if (brickState) {
          posLock = brick.state.pos.unlock();
          brick.state.pos.clone(brickState.pos);
          for (prop in brickState.renderData) {
            brick.state.renderData.set(prop, brickState.renderData[prop]);
          }
          
          if (posLock)
            brick.state.pos.lock(posLock);
        }
      }
      
      log("Loaded " + this.id + "state");
    },
    
    wake: function() {
      // reposition bricks if necessary
      this.log("waking up Mason");
      world.publish('wake:' + this.id);
      if (this._sleeping && this.numBricks()) {
//        var bricks = this.mason.bricks,
//            brick,
//            i = bricks.length;
//        
//        while (i--) {
//          brick = bricks[i];
//          brick.state.pos
//        }
        
        world.add(this.mason.bricks);
        if (this.scrollbar)
          world.addBody(this.scrollbar);

/*        var bricks = this.mason.bricks,
            brick,
            i = bricks.length;
        
        while (i--) {
          brick = bricks[i];
          if (brick.state.pos.get(2)) {
            API.flyTo(brick, null, null, 0, Math.max(1, Math.random() * 5), 1);
          }
        }
 */      
      }
      
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
        var toRemove, 
            fromTheHead,
            range = Physics.util.extend({}, this.range);
        
        while (numBricks && this.slidingWindowDimension > this.maxSlidingWindowDimension) {
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
        else {
//          if (this.brickLimit == Infinity) {
//            var toAdd = Math.min(maxAppend, defaultAddDelta);
//            this.log("DECISION: prefetching " + toAdd + " items");
//            this.prefetch(toAdd, false); // add sth similar for head
//          }
//          else
            this.log("DECISION: not doing anything to sliding window");
        }
//        else if (this.brickLimit - range.to < this.bricksPerPage * 2) /// doesn't make any sense because if brick limit is set, we already have all those resources in the main thread, no need to fetch them from anywhere
//          this.prefetch();
      }
      else if (maxPrepend && range.from > 0 && headDiff < this.slidingWindowOutsideBuffer) {
        var toAdd = Math.min(maxPrepend, defaultAddDelta);
//        range.from -= toAdd;
        this.log("DECISION: growing sliding window by " + toAdd + " at the " + HEAD_STR);
//        return this.requestNewRange(range);
        return this.requestMore(toAdd, true);
      }
        
  //    if (range.from != this.range.from || range.to != this.range.to)
  //      this.requestNewRange(range);
    },

//    _capRange: function(range) {
//      if (range.from < 0 || range.to < 0 || range.to < range.from)
//        debugger;
//      
//      range.from = Math.max(0, range.from);
//      range.to = Math.min(range.to, this.brickLimit);
//      return range;
//    },
    
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
    body.state.pos.setComponent(2, LEFT.state.pos.get(2));
    stopBody(body);
  },

  teleportRight: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, RIGHT.state.pos.get(0));
    body.state.pos.setComponent(2, RIGHT.state.pos.get(2));
    stopBody(body);
  },

  teleportCenterX: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(0, ORIGIN.state.pos.get(0));
    body.state.pos.setComponent(2, ORIGIN.state.pos.get(2));
    stopBody(body);
  },

  teleportCenterY: function(bodyId) {
    var body = getBody(bodyId);
    body.state.pos.setComponent(1, ORIGIN.state.pos.get(1));
    body.state.pos.setComponent(2, ORIGIN.state.pos.get(2));
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
      while (actions.length && i--) {
        actions[i].cancel();
      }
    }
  },

  completePendingActions: function(body) {
    body = getBody(body);
    var actions = body._actions,
        i = actions && actions.length;
    
    if (i) {
      while (actions.length && i--) {
        actions[i].complete();
      }
    }
  },

  opacity: function(bodyId, opacity, time, callback) {
    var body = getBody(bodyId),
        steps = Math.ceil(time / WORLD_CONFIG.timestep),
        step = 0,
        factor,
        goalOpacity = opacity,
        initialOpacity = body.state.renderData.get('opacity'),
        opacityAction;
    
    if (goalOpacity == initialOpacity)
      return;
    
    function cleanUp() {
      body.state.renderData.set('opacity', goalOpacity);
    };
    
    function oncomplete() {
      cleanUp();
      if (callback)
        doCallback(callback);
    };
    
    
    if (!time)
      return oncomplete();
      
    opacityAction = new Action(
      'opacity' + body.options._id + ' to ' + goalOpacity,
      function onstep() {
        if (step++ >= steps)
          opacityAction.complete();
        else {
          factor = step / steps;
          body.state.renderData.set('opacity', initialOpacity + factor * (goalOpacity - initialOpacity));
        }
      }
    );
  
    opacityAction.oncomplete = oncomplete;
    opacityAction.oncancel = cleanUp;
    addAction(body, opacityAction);
    opacityAction.start();
  },

  revert: function(bodyId, action, time, callback) {
    var body = getBody(bodyId),
        renderDataBeforeAction = body.state.renderDataBeforeAction[action],
        stateBeforeAction = body.state.beforeAction[action];
    
    // TODO: time, callback
    if (stateBeforeAction) {
      Physics.util.extend(body.state, stateBeforeAction);
      delete body.state.beforeAction[action];
    }
    
    if (renderDataBeforeAction) {
      for (var prop in renderDataBeforeAction) {
        body.state.renderData.set(prop, renderDataBeforeAction[prop]);
      }
      
      delete body.state.renderDataBeforeAction[action];
    }
    
  },  

  scale: function(bodyId, x, y, time, callback) {
    var body = getBody(bodyId),
        steps = Math.ceil(time / WORLD_CONFIG.timestep),
        step = 0,
        factor,
        i,
        originalScale = body.state.renderData.get('scale') || [1, 1, 1],
        currentScale = originalScale.slice(),
        goalScale = [typeof x == 'number' ? x : originalScale[0],
                     typeof y == 'number' ? y : originalScale[1],
                     1],
       scaleAction;
    
    if (!time)
      return oncomplete();
    
    function cleanUp() {
      body.state.renderData.set('scale', goalScale);
    };
    
    function oncomplete() {
      cleanUp();
      if (callback)
        doCallback(callback);
    };
    
    scaleAction = new Action(
      'scale' + body.options._id + ' to ' + goalScale.toString(),
      function onstep() {
        if (step++ >= steps)
          scaleAction.complete();
        else {
          factor = step / steps;
          i = currentScale.length;
          while (i--) {
            currentScale[i] = originalScale[i] + factor * (goalScale[i] - originalScale[i]);
          }
          
//          log('scaling ' + body._id + ' to ' + currentScale.toString());
          body.state.renderData.set('scale', currentScale);
        }
      }
    );
    
    scaleAction.oncomplete = oncomplete;
    scaleAction.oncancel = cleanUp;
    addAction(body, scaleAction);
    scaleAction.start();
  },
  
  flyLeft: function(bodyId, speed, opacity, callback) {
    this.flyTo(bodyId, LEFT.state.pos.get(0), null, LEFT.state.pos.get(2), speed, opacity, callback);
  },

  flyRight: function(bodyId, speed, opacity, callback) {
    this.flyTo(bodyId, RIGHT.state.pos.get(0), null, RIGHT.state.pos.get(2), speed, opacity, callback);
  },

  flyCenter: function(bodyId, speed, opacity, callback) {
    this.flyTo(bodyId, ORIGIN.state.pos.get(0), null, ORIGIN.state.pos.get(2), speed, opacity, callback);
  },
  
  flyBy: function(bodyId, x, y, z, speed, opacity, callback) {
    var body = getBody(bodyId);
    return this.flyTo(body, 
                      body.state.pos.get(0) + (x || 0),
                      body.state.pos.get(1) + (y || 0),
                      body.state.pos.get(2) + (z || 0),
                      speed,
                      opacity,
                      callback);
  },
  
  flyTo: function(bodyId, x, y, z, speed, opacity, callback) {
//    if (z > 0 || speed < 0)
//      debugger;
    
    var body = getBody(bodyId),
        fixed = body.fixed,
        changeOpacity = opacity != null,
        goalOpacity = opacity,
        destination = updateVector(Physics.vector().clone(body.state.pos), x, y, z),
        acceleration = Physics.vector(),
        initialDistance = body.state.pos.dist(destination),
        thresh = Math.min(speed * 100, initialDistance / 5),
        lastDistance = initialDistance,
        distance,
        posLock,
        flyAction = new Action(
          'fly ' + body.options._id + ' to ' + destination.toString(),
          function onstep() {
            body.state.acc.zero();
            if ((distance = body.state.pos.dist(destination)) && distance <= lastDistance || distance > thresh) {
              lastDistance = distance;
              if (changeOpacity) {
                opacity = distance / initialDistance;
                if (goalOpacity)
                  opacity = 1 - opacity;
                  
                opacity = Math.min(opacity, MAX_OPACITY);
                body.state.renderData.set('opacity', opacity);
              }

//              body.state.vel.clone(destination).vsub(body.state.pos).normalize().mult(speed);
//              body.state.vel.clone(destination).vsub(body.state.pos).normalize().mult(speed * Math.min(distance, 100) / 100);
              body.accelerate(acceleration.clone(destination).vsub(body.state.pos).mult(speed * Math.min(distance * distance, 300) / 2000 / 10000 )); // slow down when you get closer
            }
            else {
              if (distance > 10)
                log("Completing action ahead of schedule by distance: " + distance + ", thresh: " + thresh + ", initial distance: " + initialDistance);
              
              flyAction.complete();
            }
          }
        );
    
    function cleanUp() {
      body.fixed = fixed;
      if (posLock)
        body.state.pos.lock(posLock);
      
      if (changeOpacity)
        body.state.renderData.set('opacity', goalOpacity);
      
//      if (fixed) {
//        debugger;
//        body.fixed = true;
//      }
    };
    
    function oncomplete() {
      stopBody(body, destination);
      cleanUp();
      if (callback)
        doCallback(callback);
    };
    
    
    flyAction.oncomplete = oncomplete;
    flyAction.oncancel = cleanUp;
    flyAction.onstart = function() {
      posLock = body.state.pos.unlock();
      stopBody(body);
      body.fixed = false;
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
      var args = slice.call(arguments, 1);
      args.unshift(Physics.vector().clone(body.state.pos));
      destination = updateVector.apply(null, args);
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

	addBody: function(type, options) {
		var body = Physics.body(type, options);
		world.addBody(body);
		return body;
	},

	drag: function drag(dragVector, ids) {
		var v,
			  bodies = typeof ids == 'string' ? getBodies(ids) : getBodies.apply(null, ids);

		if (bodies.length) {
      v = Physics.vector().set(dragVector[0], dragVector[1]);
//			log("DRAG: " + v.toString());
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
//      log("DRAG END: " + v.toString());
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
			world.addBehavior(constrainer);
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
    case 'springDamping':
      world.publish({
        topic: prefix + 'constants:springDamping'
      });
      
      break;
      
    case 'springStiffness':
      world.publish({
        topic: prefix + 'constants:springStiffness'
      });
      
      break;
    }
  },
  
  render: render
}