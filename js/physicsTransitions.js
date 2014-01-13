define('physicsTransitions', ['globals', 'utils', 'domUtils', 'lib/fastdom', 'physicsBridge'], function(G, U, DOM, Q, Physics) {
  var _oppositeDir = {
      left: 'right',
      right: 'left',
      up: 'down',
      down: 'up'
    },
    currentTransition,
    queued;
  
  function getOppositeDir(dir) {
    return _oppositeDir[dir]; 
  }
  
  function Transition(options) {
    var self = this;
    
    this.from = options.from;
    this.to = options.to;
    this.dfd = $.Deferred();
    this.promise = this.dfd.promise();
    this.promise.always(function() {
      self._complete = self.promise.state() == 'resolved';
      self._failed = self.promise.state() == 'rejected';
    });
    
    this.options = options;
    this.chain = [];
    this.id = _.uniqueId('transition');

    _.proxyPromise(this, this.promise);
  };
  
  Transition.prototype = {
    run: function() {
      var self = this;
      
      if (this.from) {
        this.chain.push({
          method: 'style',
          args: [this.from.getContainerBodyId(), {
            'z-index': 1
          }]
        },
        {
          method: 'cancelPendingActions',
          args: [this.from.getContainerRailBodyId()]
        });
      }
      
      Physics.disableDrag();
      if (this.from)
        this.from.$el.trigger('page_beforehide');
        
      this.to.$el.trigger('page_beforeshow');
      this.transition.apply(this, arguments);
      Physics.there.chain(this.chain);
      return this.promise.always(function() {
        Physics.enableDrag();
        if (self.promise.state() == 'resolved' && self.from) {
          self.from.turnOffPhysics();
          self.from.$el.trigger('page_hide');
          Physics.there.style(self.from.getContainerBodyId(), {
            opacity: 0
          });
        }
      });
    },
    transition: function() {
      throw "override this";
    },
    isCompleted: function() {
      return this._complete;
    },
    isFailed: function() {
      return this._failed;
    },
    isRunning: function() {
      return !this._complete && !this._failed;
    },
    reverse: null,
    interrupt: null
  };
  
  function Slide(options) {
    Transition.apply(this, arguments);
  };
  
  Slide.prototype = Object.create(Transition.prototype);
  Slide.prototype.transition = function() {
    var fromDir = getOppositeDir(this.options.direction),
        toDir = this.options.direction,
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId();
    
    if (!this.to._visited || DOM.getTranslation(this.to.el).X == 0) {
      this.to._visited = true;
      this.chain.push({
        method: 'teleport' + fromDir.capitalizeFirst(), 
        args: [toRailId, fromDir]
      });
    }
    
    this.chain.push({
        method: 'cancelPendingActions',
        args: [toRailId]
      }, 
      {
        method: 'style',
        args: [this.from.getContainerBodyId(), {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [this.to.getContainerBodyId(), {
          'z-index': 1000
        }]
      },
      {
        method: 'fly' + toDir.capitalizeFirst(), 
        args: [fromRailId, 1, 0, this.dfd.resolve]
      },
      {
        method: 'flyCenter', 
        args: [toRailId, 2, DOM.maxOpacity]
      }
    );        
  };
  
  Slide.prototype.interrupt = function() {
    // maybe doing nothing is ok too
    this.dfd.reject();
    Physics.there.chain(
      {
        method: 'cancelPendingActions',
        args: [this.from.getContainerRailBodyId()]
      },
      {
        method: 'cancelPendingActions',
        args: [this.to.getContainerRailBodyId()]
      }
    );
  };

  function Snap(options) {
    Transition.apply(this, arguments);
    this.stiffness = options.springStiffness || 0.8;
    this.damping = options.springDamping || 0.99;
  };
  
  Snap.prototype = Object.create(Transition.prototype);
  Snap.prototype.transition = function() {    
    var self = this,
        fromDir = getOppositeDir(this.options.direction),
        toDir = this.options.direction,
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        options = this.options,
        finished = 2;
    
//    options.springStiffness = 0.8;
//    options.springDamping = Math.min(0.99, Physics.constants.springDamping);
    
    function finish() {
      if (--finished == 0) {
        Physics.there.style(self.from.getContainerBodyId(), {
          opacity: 0
        });
        
        self.dfd.resolve();
      }
    }
    
    if (!this.to._visited || DOM.getTranslation(this.to.el).X == 0) {
      this.to._visited = true;
      this.chain.push({
        method: 'teleport' + fromDir.capitalizeFirst(), 
        args: [this.to.getContainerRailBodyId(), fromDir]
      });
    }
    
    this.chain.push({
        method: 'cancelPendingActions',
        args: [toRailId]
      }, 
      {
        method: 'style',
        args: [this.from.getContainerBodyId(), {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [this.to.getContainerBodyId(), {
          'z-index': 1000,
          opacity: 1
        }]
      },
//      {
//        method: 'snap', 
//        args: [fromRailId, toDir, options.springStiffness, options.springDamping, finish]
//      },
//      {
//        method: 'snap', 
//        args: [toRailId, 'center', options.springStiffness, options.springDamping, finish]
//      }
      {
        method: 'snapTo', 
        args: [fromRailId, G.viewport.width * (toDir == 'left' ? -1 : 1), null, -10, this.stiffness, this.damping, finish]
      },
      {
        method: 'snapTo', 
        args: [toRailId, 0, null, 0, this.stiffness, this.damping, finish]
      }
    );        
  };
  
  Snap.prototype.interrupt = function() {
//    // maybe doing nothing is ok too
//    this.dfd.reject();
//    Physics.there.chain(
//      {
//        method: 'cancelPendingActions',
//        args: [this.from.getContainerRailBodyId()]
//      },
//      {
//        method: 'cancelPendingActions',
//        args: [this.to.getContainerRailBodyId()]
//      }
//    );
  };
  
  function Via(options) {
    Transition.apply(this, arguments);
    this.mason = this.options.via.parentView.mason;
  };

  Via.prototype = Object.create(Transition.prototype);
  Via.prototype.transition = function() {
    var self = this,
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        via = this.options.via,
        bodyId = via.getBodyId(),
        time = 1000;
    
    function crossfade() {
      if (!self.isRunning())
        return;
      
      var opacityChain = [
        {
          method: 'animateStyle',
          args: [self.to.getContainerBodyId(), {
            property: 'opacity',
            start: 0, 
            end: DOM.maxOpacity, 
            time: time
          }, self.dfd.resolve]
        },
        {
          method: 'animateStyle',
          args: [self.from.getContainerBodyId(), {
            property: 'opacity',
            start: DOM.maxOpacity, 
            end: 0, 
            time: time
          }]
        }
      ];
      
      Physics.there.chain(opacityChain);
    };
    
    this.chain.push(
      {
        object: this.mason.id,
        method: 'saveState' 
      },
      {
        object: this.mason.id,
        method: 'isolate',
         args: [bodyId, 'pop', time * 2, 'simultaneous' /*callback*/]
      },
      {
        object: this.mason.id,
        method: 'flyToTopCenter',
        args: [bodyId, 1, null, crossfade]
      },
      {
        method: 'style',
        args: [bodyId, {
          'text-align': 'center',
          'border': '1px solid black'
        }]
      },            
      {
        method: 'animateStyle',
        args: [bodyId, {
          property: 'width',
//          start: via.el.$outerWidth(),
          end: G.viewport.width,
          unit: 'px',
          time: time
        }]
      },
//      {
//        method: 'animateStyle',
//        args: [bodyId, {
//          property: 'height',
//          start: via.el.$outerHeight(),
//      //    end: 50,
//          end: G.viewport.height,
//          unit: 'px',
//          time: time
//        }]
//      },
      {
        method: 'teleportCenterX', 
        args: [toRailId]
      }                       
    );
    
    this.promise.done(this.cleanup.bind(this));
  };

  Via.prototype.cleanup = function() {
    Physics.there.chain(
      {
        object: this.mason.id,
        method: 'loadState',
        args: [this.from.getContainerRailBodyId()]
      },
      {
        method: 'cancelPendingActions',
        args: [this.from.getContainerRailBodyId()]
      },
      {
        method: 'cancelPendingActions',
        args: [this.to.getContainerRailBodyId()]
      },
      {
        method: 'cancelPendingActions',
        args: [this.from.getContainerBodyId()]
      },
      {
        method: 'cancelPendingActions',
        args: [this.to.getContainerBodyId()]
      }
    );    
  };
  
  Via.prototype.interrupt = function() {
    this.dfd.reject();
    this.cleanup();
  };

//  Slide.prototype.reverse = function() {
//    var from = this.from;
//    this.from = this.to;
//    this.to = this.from;
//    return Transition.run.call(this);
//    var options = _.clone(this.options);
//    options.direction = oppositeDir(options.direction);
//    return new Slide(this.to, this.from, options);
//  };

  var Transitions = {
    slide: function(options) {
      return new Slide(options);
    },
    
    snap: function(options) {
      return new Snap(options);
    },
    
    via: function(options) {
      return new Via(options);
    }    
  };

  function switchRoles(fromView, toView, chain) {
    chain = chain || [];
    chain.push({
      method: 'style',
      args: [fromView.getContainerBodyId(), {
        'z-index': 1
      }]
    },
    {
      method: 'cancelPendingActions',
      args: [fromView.getContainerBodyId()]
    }, {
      method: 'style',
      args: [toView.getContainerBodyId(), {
        'z-index': 1000
      }]
    });
    
    if (!toView._visited || DOM.getTranslation(toView.el).X == 0) {
      toView._visited = true;
      chain.unshift({
        method: 'teleport' + fromDir.capitalizeFirst(), 
        args: [to, fromDir]
      });
    }

    return chain;
  };
  
  function doTransition(options) {
    var from = options.from,
        to = options.to;
    
    if (!from) {
      var dfd = $.Deferred();
      Q.write(function() {
        Physics.there.style(to.getContainerBodyId(), {
          opacity: 1,
          'z-index': 1000
        });
        
        dfd.resolve();
      });
      
      return dfd.promise();
    }
    
    if (currentTransition) {
      if (currentTransition.isRunning()) {
        if (currentTransition.reverse && currentTransition.from == to && currentTransition.to == from)
          return currentTransition.reverse();
        else if (currentTransition.interrupt) {
          currentTransition.interrupt();
        }
        else {
          queued = options;
          currentTransition.done(function() {
            if (queued == options)
              doTransition(queued);
          });
          
          return; // TODO: SHOULD RETURN PROMISE
        }
      }
    }
    
    transition = currentTransition = Transitions[options.transition](options);
    return transition.run();
  };
  
  return {
    transition: doTransition
  }
});