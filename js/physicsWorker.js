var ArrayProto = Array.prototype,
		indexOf = ArrayProto.indexOf,
    concat = ArrayProto.concat,
		slice = ArrayProto.slice,
		benchedBodies = {},
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
    PUBSUB_SNAP_CANCELED = 'snap-canceled',
		proxiedObjects,
		layoutManagers = {},
		DEBUG,
		DIR_UP,
		DIR_DOWN,
    DIR_LEFT,
    DIR_RIGHT,
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

function _onmessage(e){
	if (!world) {
	  importScripts(e.data.physicsJSUrl, e.data.masonryUrl);
	  DEBUG = e.data.debug;
	  CONSTANTS = e.data.constants;
		world = Physics( WORLD_CONFIG, function(world, Physics) {
			initWorld(world, e.data.stepSelf);
		});
		
		proxiedObjects = {
			world: world,
			Physics: Physics
		};
		
		return;
	}
	
	var obj = e.data.object ? leaf(proxiedObjects, e.data.object) : API,
  		method = leaf(obj, e.data.method),
  		args = e.data.args || [],
  		callbackId = e.data.callback,
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
};

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
	BOUNDS = Physics.aabb.apply(Physics, arguments);
	var leftX = minX - (maxX - minX),
	    leftY = minY,
	    rightX = maxX,
	    rightY = minY;
	
	if (!LEFT) {
    LEFT = Physics.body('point', {
      fixed: true,
      x: leftX,
      y: leftY
    });

    RIGHT = Physics.body('point', {
      fixed: true,
      x: rightX,
      y: rightY
    });
    
    ORIGIN = Physics.body('point', {
      fixed: true,
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

function render() {
	var bodies = world.getBodies(),
  		body,
  		transforms = {},
  		transform,
  		update = false;

	for (var i = 0; i < bodies.length; i++) {
		body = bodies[i];
		if (body._id) {
			transform = renderBody(body);
			if (transform) {
				update = true;
//				if (/container/.test(body._id))
//				  log(body._id + ": " + transform.translate[0] + ", " + transform.translate[1]);
				
				transforms[body._id] = transform;
			}
		}
	}

	if (update) {
		postMessage({
			topic: 'render',
			bodies: transforms
		});	
	}
}

function renderBody(body) {
	var state = body.state,
  		pos = state.pos,
  		angle = state.angular.pos,
  		rendered = state.rendered,
  		wasRendered = body.rendered(),
  		isTranslated = pos.dist(rendered.pos) > world._opts.positionRenderResolution,
  		isRotated = Math.abs(angle - rendered.angular.pos) > world._opts.angleRenderResolution,
  		transform = {},
  		aabb,
  		x, y, z,
  		rx, ry, rz;
				
	if (!wasRendered || isTranslated || isRotated) {
		if (!wasRendered) {
			if (body.options.lock) // lock on first render
  			body.state.pos.lock(body.options.lock);
			
			body.rendered(true);
		}
		
		rendered.angular.pos = angle;
		rendered.pos.clone(pos);
		
		if (isTranslated) {
		  aabb = body.geometry._aabb;
  		x = pos.get(0) - (aabb._hw || 0);
      y = pos.get(1) - (aabb._hh || 0);
      z = pos.get(2) - (aabb._hd || 0);
      transform.translate = [x, y, z];
		}
		
		if (isRotated)
		  transform.rotate = [rx, ry, rz];

		/*
		// compute translation matrix * z rotation matrix
		// TODO: adjust for 3d (x, y rotation matrices, z translation)
		var cosC = Math.cos(angle),
				sinC = Math.sin(angle),
				sinNC = Math.sin(-angle),
//				transform = 'matrix3d(',
				aabb = body.geometry._aabb,
				x = pos.get(0) - (aabb._hw || 0),
				y = pos.get(1) - (aabb._hh || 0);
			
		// 4 rows of the transform matrix
//		transform += cosC + ', ' + sinNC + ', 0, 0, ';
//		transform += sinC + ', ' + cosC + ', 0, 0, ';
//		transform += '0, 0, 1, 0, ';
//		transform += (x * cosC + y * sinC) + ', ' + (x * sinNC + y * cosC) + ', 0, 1)';
		transform = [cosC, sinNC, 0, 0, 
		        sinC, cosC, 0, 0, 
		        0, 0, 1, 0,
		        x * cosC + y * sinC, x * sinNC + y * cosC, 0, 1];
		 */
		
//    log("Translation: " + transform[12] + ", " + transform[13]);
		if (transform.translate || transform.rotate)
		  return transform;
		else if (!wasRendered) {
		  return {
		    translate: [0, 0, 0],
        rotate: [0, 0, 0]
		  }
		}
	}
};

function initWorld(_world, stepSelf) {
	world = _world;
	integrator = Physics.integrator('verlet', { drag: CONSTANTS.drag });
	world.add(integrator);
	
	if (stepSelf)
	  Physics.util.ticker.subscribe(API.step);
	
	world.subscribe('drag', function(data) {
		var bodies = data.bodies,
  			body,
  			i = bodies.length;
			
		while (i--) {
			body = bodies[i];
			body.fixed = true;
			body.state.pos.vadd(data.vector);
			stopBody(body);
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
		  if (!stop)
			  body.state.vel.clone( data.vector.mult( 1 / 10 ) );
		}
	}, null, 100);
	
	Physics.util.ticker.start();
	DIR_UP = Physics.vector(0, -1);
  DIR_DOWN = Physics.vector(0, 1);
  DIR_LEFT = Physics.vector(-1, 0);
  DIR_RIGHT = Physics.vector(1, 0);
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
    numBricks: 0,
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
    lastRequestedRange: {
      from: 0,
      to: 0
    },
    slidingWindowDimension: 0,
    horizontal: false
//    ,
//    edgeConstraintStiffness: CONSTANTS.constraintStiffness
  };
  
  function LayoutManager(id, options, callbackId) {
    this.id = id;
    this._callbackId = callbackId;
    Physics.util.extend(this, Physics.util.clone(defaultSlidingWindowOptions, true), options);
    this.masonryOptions = {};
    this.init();
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
        this.axisIdx = 0;
        this.orthoAxisIdx = 1;
      }
      else {
        this.dirHead = DIR_UP;
        this.dirTail = DIR_DOWN;
        this.axisIdx = 1;
        this.orthoAxisIdx = 0;
      }
        
      this._rangeChangeListeners = [];
      this.container = getBodies(this.container)[0];
      if (this.flexigroup)
        this.flexigroup = masonryOptions.flexigroup = getBodies(this.flexigroup)[0];
  
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
      log("SET TOP EDGE TO " + this.headEdge.state.pos.get(this.axisIdx));
      this.headEdgeConstraint = API.distanceConstraint(this.offsetBody, this.headEdge, CONSTANTS.springStiffness, 0);
      this.headEdgeConstraint.damping = CONSTANTS.springDamping;
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
        if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) < this.headEdge.state.pos.get(this.axisIdx))
          this.headEdgeConstraint['break']();
      }, this, 10);
      
      world.subscribe('springDamping', function(data) {
        this.headEdgeConstraint.damping = data.value;
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.damping = data.value;
      }, this);

      world.subscribe('springStiffness', function(data) {
        this.headEdgeConstraint.stiffness = data.value;
        if (this.tailEdgeConstraint)
          this.tailEdgeConstraint.stiffness = data.value;
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
        world.subscribe('integrate:positions', this._onmove, this, -Infinity); // lowest priority
        this._onmove = Physics.util.throttle(this._onmove.bind(this), 30);
      }
      
      this.mason = new Mason(masonryOptions);
      if (this.bricks) {
        this.range.to = this.bricks.length;
        this.addBricks(this.bricks);
        delete this.bricks; // let mason keep track
      }
      
      this['continue']();
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
//      if (this.lastRequestedRange.from == range.from && this.lastRequestedRange.to == range.to) { // TODO: if we received less bricks than we wanted, then a repeat request is not out of the question
////        log("REQUESTING SAME RANGE AGAIN...what's the holdup?");
////        if (this.range.from == this.lastRequestedRange.from && this.range.to == this.lastRequestedRange.to) {
//          log("IGNORING DUPLICATE RANGE REQUEST: " + this.lastRequestedRange.from + '-' + this.lastRequestedRange.to);
//          return;
////        }
//      }
      
      log("CURRENT RANGE: " + this.lastRequestedRange.from + '-' + this.lastRequestedRange.to + ", REQUESTING RANGE: " + range.from + '-' + range.to);
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
      
      this.pageWidth = this.bounds._hw * 2;
      this.pageHeight = this.bounds._hh * 2;
      this.pageArea = this.pageWidth * this.pageHeight;
      if (this.pageArea < 400 * 400)
        this.minPagesInSlidingWindow = 3;
      else if (this.pageArea < 800 * 800)
        this.minPagesInSlidingWindow = 5;
      else
        this.minPagesInSlidingWindow = 7;
      
      this.maxPagesInSlidingWindow = this.minPagesInSlidingWindow * 2;
      this.pageScrollDim = this.horizontal ? this.pageWidth : this.pageHeight;
      this.pageNonScrollDim = this.horizontal ? this.pageHeight : this.pageWidth;  
    },
    
    _onmove: function() {
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
      if (this.range.from == 0) {
        var coords = new Array(2);
        coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
        coords[this.axisIdx] = -this.slidingWindowBounds.min;
        this.headEdge.state.pos.set(coords[0], coords[1]);
      }
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
          this.tailEdgeConstraint = API.distanceConstraint(this.offsetBody, this.tailEdge, CONSTANTS.springStiffness, 0);
          this.tailEdgeConstraint.damping = CONSTANTS.springDamping;
          this.tailEdgeConstraint['break']();
          this.tailEdgeConstraint.armOnDistance(Infinity, this.dirTail); // no matter how far out of bounds we are, we should snap back
//          this.tailEdgeConstraint.breakOnDistance(50, DIR_UP);
          world.subscribe('drag', function(data) {
            if (~data.bodies.indexOf(this.offsetBody) && this.offsetBody.state.pos.get(this.axisIdx) > this.tailEdge.state.pos.get(this.axisIdx))
              this.tailEdgeConstraint['break']();
          }, this, 10);          
        }
        else
          this.tailEdge.state.pos.set(coords[0], coords[1]);
        
        log("SET BOTTOM EDGE TO " + coords[this.axisIdx]);
      }
    },
    
    setLimit: function(len) {
      log("SETTING BRICK LIMIT: " + len);
//      this._waiting = false;
      this.brickLimit = len;
      this.checkTailEdge();
//      this.adjustSlidingWindow();
    },
    
    resize: function(bounds, updatedBricks) {
      if (this._sleeping) {
        this._resizeArgs = arguments;
        return;
      }
      
      this._resizeArgs = null;
      this._waiting = false;
      if (bounds)
        this.setBounds(bounds);
      
      if (updatedBricks)
        this.updateBricks(updatedBricks, true);
      
      this.disableEdgeConstraints();
      this.mason.setBounds(this.bounds);
      if (this.numBricks) {
        // TODO: find brick X currently in view so we can re-find it after masonry reload
        this.mason.reload();
        // TODO: reposition around brick X
      }
      
      this.recalc();
      this.checkHeadEdge(true); // force adjustment
      this.checkTailEdge();
      this.enableEdgeConstraints();
      this['continue']();
    },
    
    recalc: function() {
      var gutterWidth = this.mason.option('gutterWidth'),
          bricks = this.mason.bricks,
          aabb,
          avgWidth = 0,
          avgHeight = 0,
          i = bricks.length;
      
      while (i--) {
        aabb = bricks[i].aabb();
        avgWidth += aabb.halfWidth;
        avgHeight += aabb.halfHeight;
      };
      
      Physics.util.extend(this.slidingWindowBounds, this.mason.getContentBounds());
      this.slidingWindowDimension = this.slidingWindowBounds.max - this.slidingWindowBounds.min;
      
      // TODO: prune unused props
      this.numBricks = bricks.length;
      if (this.numBricks) {
        this.averageBrickWidth = avgWidth * 2 / this.numBricks + gutterWidth;
        this.averageBrickHeight = avgHeight * 2 / this.numBricks + gutterWidth;
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
//  //    log("ACTUAL TOTAL AFTER ADD: " + this.mason.bricks.length);
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
//  //    log("ACTUAL TOTAL AFTER ADD: " + this.mason.bricks.length);
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

    addBricks: function(optionsArr, prepend) {
      var bricks = [],
          l = optionsArr.length,
          options;
      
      for (var i = 0; i < l; i++) {
        options = optionsArr[i];
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
      
      this.recalc();
      if (prepend)
        this.checkHeadEdge();
      else
        this.checkTailEdge();
      
      log("ADDING " + l + " BRICKS TO THE " + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
      //    log("ACTUAL TOTAL AFTER ADD: " + this.mason.bricks.length);
      this['continue']();
    },

    removeBricks: function(n, fromTheHead) {
      if (n == 0)
        return;
      
      var bricks = fromTheHead ? this.mason.bricks.slice(0, n) : this.mason.bricks.slice(this.numBricks - n),
          el;
      
      if (bricks.length == 0) {
        debugger;
        return;
      }
      
      world.remove(bricks);
//      if (n == bricks.length)
//        this.mason.reset();
//      else
        this.mason[fromTheHead ? 'removedFromHead' : 'removedFromTail'](bricks);
//      this.mason.removed(bricks);
      
      if (fromTheHead)
        this.range.from += n;
      else
        this.range.to -= n;
      
      log("REMOVING " + n + " BRICKS FROM THE " + (fromTheHead ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
  //    log("ACTUAL TOTAL AFTER REMOVE: " + this.mason.bricks.length);
      this.recalc();
  //    if (readjust)
  //      this.adjustSlidingWindow();
    },
    
    sleep: function() {
      this._sleeping = this._waiting = true;
      if (this.numBricks)
        world.remove(this.mason.bricks);
    },

    'continue': function() {
      this._sleeping = this._waiting = false;
      Physics.util.extend(this.lastRequestedRange, this.range);
      this._adjustSlidingWindow();
    },
    
    wake: function() {
      if (this._sleeping && this.numBricks)
        world.add(this.mason.bricks);
      
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
      if (this.range.from > 0 && this.numBricks && viewport.max <= slidingWindow.min) { 
        // sliding window is completely below viewport
        // remove all bricks and request new ones
        log("DECISION: sliding window is completely below viewport, removing all bricks");
        this.removeBricks(this.numBricks);
        
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
      else if (this.range.to < this.brickLimit && this.numBricks && viewport.min >= slidingWindow.max) { 
        // sliding window is completely above viewport
        // remove all bricks and request new ones
        log("DECISION: sliding window is completely above viewport, removing all bricks");
        this.removeBricks(this.numBricks, true);
        Physics.util.extend(range, this.range); // reclone
        range.to += Math.min(maxAppend, defaultAddDelta);
        return this.requestNewRange(range);
      }
      ////////////////////////////////////////////////////////
      else if (canAdd && this.slidingWindowDimension < this.minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // grow window
        if (maxPrepend && (headDiff < tailDiff || !maxAppend)) {
          log("DECISION: growing sliding window towards the " + HEAD_STR);
          range.from -= Math.min(maxPrepend, defaultAddDelta);
        }
//        else if (tailDiff <= headDiff && maxAppend > 0)
        else if (maxAppend) {
          log("DECISION: growing sliding window towards the " + TAIL_STR);
          range.to += Math.min(maxAppend, defaultAddDelta);
        }
        else {
          log("DECISION: UH OH, SLIDING WINDOW IS CONFUSED!");
          debugger;
        }
        
        return this.requestNewRange(range);
      }
      else if (this.slidingWindowDimension > this.maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // shrink window
        var toRemove, fromTheHead;
        while (this.numBricks && this.slidingWindowDimension > this.maxSlidingWindowDimension) {
          
          toRemove = Math.min(defaultRemoveDelta, this.numBricks);
          fromTheHead = headDiff > tailDiff;
          log("DECISION: shrinking sliding window by " + toRemove + " at the " + (fromTheHead ? HEAD_STR : TAIL_STR));
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
          log("DECISION: growing sliding window by " + toAdd + " at the " + TAIL_STR);
          return this.requestNewRange(range);
        }
        else
          log("DECISION: not doing anything to sliding window");
//        else if (this.brickLimit - range.to < this.bricksPerPage * 2) /// doesn't make any sense because if brick limit is set, we already have all those resources in the main thread, no need to fetch them from anywhere
//          this.prefetch();
      }
      else if (range.from > 0 && headDiff < this.slidingWindowOutsideBuffer) {
        var toAdd = Math.min(maxPrepend, defaultAddDelta);
        range.from -= toAdd;
        log("DECISION: growing sliding window by " + toAdd + " at the " + HEAD_STR);
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
      log("JUMPING HOME");
//      this.requestNewRange({
//        from: 0,
//        to: this.bricksPerPage
//      });
      
      this.disableEdgeConstraints();
      stopBody(this.offsetBody, this.headEdge.state.pos);
      this.enableEdgeConstraints();
    },
    
    end: function() {
      log("JUMPING TO THE END");
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
      
  step: function(time, dt) {
    world.step(time);
    // only render if not paused
    if ( !world.isPaused() ) {
      render();
    }
  },
  echo: function(callbackId) {
    doCallback(callbackId);
  },

  teleport: function(bodyId /*[, another body's id] or [, x, y, z]*/) {
    var body = getBodies(bodyId)[0],
//        posLock = body.state.pos.unlock(),
        destination;
    
    if (typeof arguments[1] == 'string') {
      destination = getBodies(arguments[1])[0].state.pos;
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
   * @param idFrom id of body to snap
   * @param id of anchor to snap to
   */
  snap: function(bodyId, anchorId) {
    log("Snapping " + bodyId + " " + anchorId);
    var self = this,
        body = getBodies(bodyId)[0],
        posLock = body.state.pos.unlock(),
        anchor = getBodies(anchorId)[0],
        constraint = this.distanceConstraint(body, anchor, CONSTANTS.springStiffness, 0, anchorId == 'left' ? DIR_LEFT : DIR_RIGHT); // only snap along X axis
    
    constraint.damping = CONSTANTS.damping;
    world.publish(PUBSUB_SNAP_CANCELED); // finish (fast-forward or cancel?) any current snaps
    world.subscribe(PUBSUB_SNAP_CANCELED, endSnap);
    world.subscribe('step', checkStopped);
    
    function checkStopped() {
      if (body.state.vel.norm() < 0.1 && body.state.acc.norm() < 0.1) {
        endSnap();
      }
    }
    
    function endSnap() {
      world.unsubscribe(PUBSUB_SNAP_CANCELED, endSnap);
      world.unsubscribe('step', checkStopped);
      self.removeConstraint(constraint);
      body.state.pos.clone(anchor.state.pos);
      body.state.vel.zero();
      body.state.acc.zero();
      if (posLock)
        body.state.pos.lock(posLock);
    };
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
		var body = Physics.body(type, options);
		if (id)
			body._id = id;
		
		world.add( body );
		return body;
	},

	drag: function drag(dragVector, ids) {
		var v,
			  bodies = typeof ids == 'string' ? getBodies(ids) : getBodies.apply(null, ids);

		if (bodies.length) {
			v = Physics.vector();
			v._ = dragVector;
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
			v = Physics.vector();
			v._ = dragVector;
			world.publish({
				topic: 'dragend', 
				stop: stop,
				vector: v,
				bodies: bodies
			});
		}
	},
	
	removeConstraint: function(cstOrId) {
	  if (typeof cstOrId == 'string')
	    cstOrId = getBodies(cstOrId)[0];
	  
	  constrainer.remove(cstOrId);
	},
	
	distanceConstraint: function(bodyAOrId, bodyBOrId, stiffness, targetLength) {
		if (!constrainer) {
			constrainer = Physics.behavior('verlet-constraints');
			world.add(constrainer);
		}
		
		bodyAOrId = typeof bodyAOrId == 'string' ? getBodies(bodyAOrId)[0] : bodyAOrId;
		bodyBOrId = typeof bodyBOrId == 'string' ? getBodies(bodyBOrId)[0] : bodyBOrId;
		return constrainer.distanceConstraint(bodyAOrId, bodyBOrId, stiffness, typeof targetLength == 'number' ? targetLength : ab[0].state.pos.dist(ab[1].state.pos));
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
    case 'drag':
      integrator.options.drag = value;
      break;
    case 'springDamping':
      world.publish({
        topic: 'springDamping',
        value: value
      });
      
      break;
      
    case 'springStiffness':
      world.publish({
        topic: 'springStiffness',
        value: value
      });
      
      break;
    }
  }
}