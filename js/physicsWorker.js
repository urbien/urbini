var ArrayProto = Array.prototype,
		indexOf = ArrayProto.indexOf,
    concat = ArrayProto.concat,
		slice = ArrayProto.slice,
		benchedBodies = {},
		world,
		constrainer,
		LEFT,
		RIGHT,
    ORIGIN,
		BOUNDS,
    BODIES = {},
		GROUPS = {},
		MEMBER_CONSTRAINT_STIFFNESS = 0.3,
		DEFAULT_CONSTRAINT_STIFFNESS = 0.01,
    SNAP_TO_EDGE_CONSTRAINT_STIFFNESS = 0.1,
    PUBSUB_SNAP_CANCELED = 'snap-canceled',
		proxiedObjects,
		masons = {},
		DEBUG = true,
		DIR_UP,
		DIR_DOWN,
		touchFollowers = [];

function index(obj, i) {
	return obj[i];
};

// resolve string path to object, e.g. 'Physics.util' to Physics.util
function leaf(obj, path, separator) {
	return path.split(separator||'.').reduce(index, obj);
}

function log() {
  DEBUG && console.log.apply(console, arguments);
}

function debug() {
  DEBUG && console.debug.apply(console, arguments);
}

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
		world = Physics( function(world, Physics) {
			initWorld(world);
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
  		x = (pos.get(0) - (aabb._hw || 0)).toFixed(10);
      y = (pos.get(1) - (aabb._hh || 0)).toFixed(10);
      z = (pos.get(2) - (aabb._hd || 0)).toFixed(10);
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

function initWorld(_world) {
	world = _world;
	world.add(Physics.integrator('verlet', { drag: 0.02 }));
	
	Physics.util.ticker.subscribe(function( time, dt ){
		world.step( time );
		// only render if not paused
		if ( !world.isPaused() ) {
			render();
		}
	});
	
	world.subscribe('drag', function(data) {
		var bodies = data.bodies,
  			body,
  			i = bodies.length;
			
		while (i--) {
			body = bodies[i];
			body.state.pos.vadd(data.vector);
			body.state.vel.zero();
      body.state.acc.zero();
		}
	});

	world.subscribe('dragend', function(data) {
		var stop = data.stop,
		    bodies = data.bodies,
  			body,
  			i = bodies.length;
			
		while (i--) {
			body = bodies[i];
			if (stop) {
			  body.state.vel.zero();
        body.state.acc.zero();
			}
			else
			  body.state.vel.clone( data.vector.mult( 1 / 10 ) );
		}
	});
	
	Physics.util.ticker.start();
	DIR_UP = Physics.vector(0, -1);
  DIR_DOWN = Physics.vector(0, 1);
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


// START MASONRY
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
    horizontal: false,
    edgeConstraintStiffness: SNAP_TO_EDGE_CONSTRAINT_STIFFNESS
  };
  
  function Masonry(id, slidingWindowOptions, callbackId) {
    this.id = id;
    this._callbackId = callbackId;
    Physics.util.extend(this, Physics.util.clone(defaultSlidingWindowOptions, true), slidingWindowOptions);
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
   * Masonry layout, sliding window
   */
  Masonry.prototype = {
    // TODO: sleep / wake sliding window
    _sleeping: false,
    _waiting: false,
    _eventSeq: 0,
  //  _waiting: false,
    init: function() {
      var self = this,
          masonryOptions = this.masonryOptions,
          doSlidingWindow = this.slidingWindow,
          dirDown = Physics.vector(0, 1);
      
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
        y: this._lastOffset.get(1)
      });
  
      this.headEdge._id = Physics.util.uniqueId('headEdge');
      log("SET TOP EDGE TO " + this.headEdge.state.pos.get(1));
      this.headEdgeConstraint = API.distanceConstraint(this.offsetBody, this.headEdge, this.edgeConstraintStiffness, 0);
  //    this.headEdgeConstraint.breakOnDistance(100, dirDown); // only break the constraint if the vector from the slidingWindow point to the fixed edge is pointing down
  //    this.headEdgeConstraint.breakOnGrabbed(this.offsetBody);
      world.subscribe('drag', function(data) {
        if (~data.bodies.indexOf(self.offsetBody) && self.offsetBody.state.pos.get(self.axisIdx) < self.headEdge.state.pos.get(self.axisIdx))
          self.headEdgeConstraint['break']();
      });
      
  //    this.headEdgeConstraint.armOnDistance(50, DIR_DOWN);
      this.headEdgeConstraint.armOnDistance(Infinity, DIR_UP); // no matter how far out of bounds we are, we should snap back
  //    if (!doSlidingWindow)
  //      this.brickLimit = 1; // hack for now
      
      if (this.bounds)
        this.setBounds(this.bounds); // convert to Physics AABB
      
      this._calcSlidingWindowDimensionRange();
      Physics.util.extend(masonryOptions, pick(this, 'bounds', 'horizontal', 'oneElementPerRow', 'oneElementPerCol', 'gutterWidth'));
      if (this.horizontal) {
        this.axisIdx = 0;
        this.orthoAxisIdx = 1;
      }
      else {
        this.axisIdx = 1;
        this.orthoAxisIdx = 0;
      }
        
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
      
      this.adjustSlidingWindow();
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
      
      range = this._capRange(range || this.range);
      if (this.lastRequestedRange.from == range.from && this.lastRequestedRange.to == range.to) {
        log("IGNORING DUPLICATE RANGE REQUEST");
        return;
      }
      
      log("CURRENT RANGE: " + this.lastRequestedRange.from + '-' + this.lastRequestedRange.to + ", REQUESTING RANGE: " + range.from + '-' + range.to);
      this._waiting = true;
      this.lastRequestedRange = Physics.util.extend({}, range);
      triggerEvent(this._callbackId, {
        type: 'range',
        eventSeq: this._eventSeq++, 
        range: range, 
        info: this._getInfo()
      });
    },
    
    prefetch: function(n) {
      triggerEvent(this._callbackId, {
        type: 'prefetch',
        num: n || this.bricksPerPage
      });
    },
  
    setBounds: function(bounds) {
      this.bounds = Physics.aabb.apply(Physics, bounds);
  //    this.pageOffset = [this.bounds._pos.get(0) - this.bounds._hw, 
  //                       this.bounds._pos.get(1) - this.bounds._hh];
      
      this.pageWidth = this.bounds._hw * 2;
      this.pageHeight = this.bounds._hh * 2;
      this.pageArea = this.pageWidth * this.pageHeight;
      this.pageScrollDim = this.horizontal ? this.pageWidth : this.pageHeight;
      this.pageNonScrollDim = this.horizontal ? this.pageHeight : this.pageWidth;  
    },
    
    _onmove: function() {
      if (this._sleeping || this._waiting)
        return;
      
      var offset = this.offsetBody.state.pos.get(this.axisIdx),
          lastOffset = this._lastOffset.get(this.axisIdx),
          diff = offset - lastOffset;
      
      if (Math.abs(diff) > 50) {
        this._lastScrollDirection = diff < 0 ? 'tail' : 'head';
        this._lastOffset.clone(this.offsetBody.state.pos);
        this.adjustSlidingWindow();
      }
    },
  
    enableEdgeConstraints: function() {
      if (this.headEdgeConstraint)
        this.headEdgeConstraint.enable();
      if (this.tailEdgeConstraint)
        this.tailEdgeConstraint.enable();
    },
  
    disableEdgeConstraints: function() {
      if (this.headEdgeConstraint)
        this.headEdgeConstraint.disable();
      if (this.tailEdgeConstraint)
        this.tailEdgeConstraint.disable();
    },
    
  //  checkEdges: function() {
  //    this.checkHeadEdge();
  //    this.checkTailEdge();
  //  },
    
    checkHeadEdge: function(force) {
  //    if (force || this.range.from == 0) {
        var coords = new Array(2);
        coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
        coords[this.axisIdx] = -this.slidingWindowBounds.min;
        this.headEdge.state.pos.set(coords[0], coords[1]);
  //    }
    },

    getTailEdgeCoords: function() {
      var coords = new Array(2);  
      coords[this.orthoAxisIdx] = this.headEdge.state.pos.get(this.orthoAxisIdx);
      if (this.slidingWindowDimension < this.pageHeight)
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
          var dirUp = Physics.vector(0, -1);
          this.tailEdge = Physics.body('point', {
            fixed: true,
            x: coords[0],
            y: coords[1]
          });
          
          this.tailEdge._id = Physics.util.uniqueId('tailEdge');
          this.tailEdgeConstraint = API.distanceConstraint(this.offsetBody, this.tailEdge, this.edgeConstraintStiffness, 0);
  //        this.tailEdgeConstraint.breakOnDistance(100, dirUp); // only break the constraint if the vector from the slidingWindow point to the fixed edge is pointing down
  //        this.tailEdgeConstraint.breakOnGrabbed(this.offsetBody);
          world.subscribe('drag', function(data) {
            if (~data.bodies.indexOf(self.offsetBody) && self.offsetBody.state.pos.get(self.axisIdx) > self.tailEdge.state.pos.get(self.axisIdx))
              self.tailEdgeConstraint['break']();
          });
  
  //        this.tailEdgeConstraint.armOnDistance(50); 
  //        this.tailEdgeConstraint.armOnDistance(50, DIR_UP);
          this.tailEdgeConstraint.armOnDistance(Infinity, DIR_DOWN); // no matter how far out of bounds we are, we should snap back
  //        this.tailEdgeConstraint.arm();
        }
        else
          this.tailEdge.state.pos.set(coords[0], coords[1]);
        
        log("SET BOTTOM EDGE TO " + coords[this.axisIdx]);
      }
    },
    
    setLimit: function(len) {
      this._waiting = false;
      this.brickLimit = len;
      this.checkTailEdge();
      this.adjustSlidingWindow();
    },
    
    resize: function(bounds, updatedBricks) {
      if (this._sleeping) {
        this._resizeOnWake = true;
        return;
      }
      
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
      this.adjustSlidingWindow();
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
      var head = this._initialOffsetBodyPos.get(this.axisIdx) - this.offsetBody.state.pos.get(this.axisIdx);
      return {
        min: head,
        max: head + this.pageScrollDim
      }
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
  //  addBricks: function(head, tail) {
  //    this._waiting = false;
  //    var headLength = head ? head.length : 0,
  //        tailLength = tail ? tail.length : 0,
  //        options;
  //
  //    if (headLength) {
  //      head = this.brickify(head);
  //      head.reverse();
  //      this.mason.prepended(head);
  //      this.leash(head);
  //    }
  //    
  //    if (tailLength) {      
  //      tail = toBricks(tail);
  //      this.mason.appended(tail);
  //      this.leash(tail);
  //    }
  //    
  //    this.range.from -= headLength;
  //    this.range.to += tailLength;
  //    
  //    log("ADDING " + headLength + " BRICKS TO THE HEAD");
  //    log("ADDING " + tailLength + " BRICKS TO THE TAIL" + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
  ////    log("ACTUAL TOTAL AFTER ADD: " + this.mason.bricks.length);
  //    this.recalc();
  //    this.checkTailEdge();
  //    this.adjustSlidingWindow();
  ////    if (readjust)
  ////      this.adjustSlidingWindow();
  //  },
  
    addBricks: function(optionsArr, prepend) {
      this._waiting = false;
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
      else
        this.range.to += l;

      this.lastBrickSeen = Math.max(this.range.to, this.lastBrickSeen || 0);
      
      log("ADDING " + l + " BRICKS TO THE " + (prepend ? "HEAD" : "TAIL") + " FOR A TOTAL OF " + (this.range.to - this.range.from));
  //    log("ACTUAL TOTAL AFTER ADD: " + this.mason.bricks.length);
      this.recalc();
      
      if (prepend)
        this.checkHeadEdge();
      else
        this.checkTailEdge();
      
      this.adjustSlidingWindow();
  //    if (readjust)
  //      this.adjustSlidingWindow();
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
      this.mason.removed(bricks);
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
  
    wake: function() {
      this._sleeping = this._waiting = false;
      if (this.numBricks)
        world.add(this.mason.bricks);
      
      if (this._resizeOnWake)
        this.resize();
      else
        this.adjustSlidingWindow();
    },
    
  //  _queueSlidingWindowCheck: function() {
  //    clearTimeout(this._slidingWindowTimeout);
  //    this._slidingWindowTimeout = setTimeout(this.adjustSlidingWindow);
  //  },
    
    /**
     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
     */
    adjustSlidingWindow: function() {
      if (!this.slidingWindow)
        return;
      
      clearTimeout(this._slidingWindowTimeout);
      if (this._sleeping || this._waiting)
        return false;
      
      var slidingWindow = this.slidingWindowBounds,
          viewport = this.getViewport(),
          range = Physics.util.clone(this.range),
          scrollingTowardsHead = this._lastScrollDirection == 'head',
  //        favor = this.minSlidingWindowDimension * 0.25 * (scrollingTowardsHead ? -1 : 1),
          maxPrepend = this.range.from,
          maxAppend = Math.max(this.brickLimit - this.range.to, 0),
          defaultDelta = Math.ceil(this.bricksPerPage / 2),
          headDiff,
          tailDiff;
  
  //    if (!viewport) {// || !this._initializedDummies) {
  //      this._slidingWindowTimeout = setTimeout(this.adjustSlidingWindow, 50);
  //      return false;
  //    }
      
      maxPrepend = Math.min(maxPrepend, this.maxBricks);
      maxAppend = Math.min(maxAppend, this.maxBricks);
      headDiff = Math.max(viewport.min - slidingWindow.min, 0); // + favor
      tailDiff = Math.max(slidingWindow.max - viewport.max, 0); // + favor
      
  //    if (scrollingTowardsHead) {
  //      headDiff *= (1 - favor);
  //      tailDiff *= (1 + favor);
  //    }
  //    else {
  //      headDiff *= (1 + favor);
  //      tailDiff *= (1 - favor);
  //    }
      
      if (this.numBricks && viewport.max <= slidingWindow.min) { 
        // sliding window is completely below viewport
        // remove all bricks and request new ones
        this.removeBricks(this.numBricks);
        Physics.util.extend(range, this.range); // reclone
        range.from -= defaultDelta;
        return this.requestNewRange(range);
      }
      else if (this.numBricks && viewport.min >= slidingWindow.max) { 
        // sliding window is completely above viewport
        // remove all bricks and request new ones
        this.removeBricks(this.numBricks, true);
        Physics.util.extend(range, this.range); // reclone
        range.to += defaultDelta;
        return this.requestNewRange(range);
      }
      else if (this.slidingWindowDimension < this.minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // grow window
        if (headDiff < tailDiff && maxPrepend > 0)
          range.from -= Math.min(maxPrepend, defaultDelta);
        else if (tailDiff <= headDiff && maxAppend > 0)
          range.to += Math.min(maxAppend, defaultDelta);
        else
          return;
        
        return this.requestNewRange(range);
      }
      else if (this.slidingWindowDimension > this.maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        // shrink window
        var fromTheHead = headDiff > tailDiff;
  //      ,
  //          scrollDimDiff = Math.abs(headDiff - tailDiff),
  //          toRemove = scrollDimDiff * this.averageBricksPerNonScrollDim / this.averageBrickScrollDim | 0,
        
        var toRemove = Math.min(defaultDelta, this.numBricks);
  //      if (fromTheHead)
  //        range.from += toRemove;
  //      else
  //        range.to -= toRemove;
  //        
        this.removeBricks(toRemove, fromTheHead);
        return this.requestNewRange();
      }
      // grow the window in the direction where it has the least padding, if necessary
      else if (maxAppend > 0 && tailDiff < this.slidingWindowInsideBuffer) {
        if (tailDiff < this.slidingWindowOutsideBuffer) {
          range.to += Math.min(maxAppend, defaultDelta);
          return this.requestNewRange(range);
        }
        else if (this.brickLimit - range.to < this.bricksPerPage * 2)
          this.prefetch();
      }
      else if (range.from > 0 && headDiff < this.slidingWindowOutsideBuffer) {
        range.from -= Math.min(maxPrepend, defaultDelta, this.numBricks);
        return this.requestNewRange(range);
      }
        
  //    if (range.from != this.range.from || range.to != this.range.to)
  //      this.requestNewRange(range);
    },
    
    _capRange: function(range) {
      if (range.from < 0 || range.to < 0)
        debugger;
      
      range.from = Math.max(0, range.from);
      range.to = Math.min(range.to, this.brickLimit);
      return range;
    },
    
    home: function() {
      this.requestNewRange({
        from: 0,
        to: this.bricksPerPage
      });
      
      this.offsetBody.state.pos.clone(this.headEdge.state.pos);
    },
    
    end: function() {
      var end = Math.min(this.brickLimit, this.lastBrickSeen);
      this.requestNewRange({
        from: Math.max(end - this.bricksPerPage, 0),
        to: end
      });
      
      this.offsetBody.state.pos.set.call(this.offsetBody.state.pos, this.getTailEdgeCoords);      
    }
  }
  
//  root.Masonry = Masonry;
//})(self);
  
// END MASONRY

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
  echo: function(callbackId) {
    doCallback(callbackId);
  },

  teleport: function(bodyId /*[, another body's id] or [, x, y, z]*/) {
    var body = getBodies(bodyId)[0],
        posLock = body.state.pos.unlock();
    
    if (typeof arguments[1] == 'string')
      body.state.pos.clone(getBodies(arguments[1])[0]);
    else
      body.state.pos.set(arguments[1], arguments[2], arguments[3]);
    
    if (posLock)
      body.state.pos.lock(posLock);
  },

  /**
   * @param idFrom id of body to snap
   * @param id of anchor to snap to
   */
  snap: function(bodyId, anchorId) {
    var self = this,
        body = getBodies(bodyId)[0],
        posLock = body.state.pos.unlock(),
        anchor = getBodies(anchorId)[0],
        constraint = this.distanceConstraint(body, anchor, 0.01, 0, Physics.vector(1, 0)); // only snap along X axis
    
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
			  bodies = getBodies.apply(null, ids);
		
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
			  bodies = getBodies.apply(null, ids);
		
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
	
	masonry: {
    init: function(id, options, callbackId) {
      if (typeof Mason == 'undefined')
        importScripts('lib/jquery.masonry.js');
    
	    proxiedObjects[id] = new Masonry(id, options, callbackId);
    }
  }
}