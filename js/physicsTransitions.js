define('physicsTransitions', ['globals', 'utils', 'domUtils', 'lib/fastdom', 'physicsBridge'], function(G, U, DOM, Q, Physics) {
  var _oppositeDir = {
      left: 'right',
      right: 'left',
      up: 'down',
      down: 'up'
    },
    currentTransition,
    queued,
    slideDefaultSettings = {
      acceleration: 0.03,
      drag: 0.3 // inversely proportional to distance^2 from the target (the closer, the more drag)
    },
    snapDefaultSettings = {
      stiffness: 0.2,
      damping: 0.55,
      drag: 0.8
    },
    zoomInToDefaultSettings = {
      fadeDuration: 500,
      acceleration: 0.01,
      drag: 0.3,
      stiffness: 0.06,
      damping: 0.3,
      snap: true
    },
    rotateAndZoomInToDefaultSettings = {
      rotateDuration: 1000,
      fadeDuration: 500,
      angle: Math.PI / 2,
      acceleration: 0.01,
      drag: 0.1
    },
    isDesktop = G.browser.mobile;

  function getOppositeDir(dir) {
    return _oppositeDir[dir];
  }

  function cancelPendingActions(view, chain) {
    chain.push({
      method: 'cancelPendingActions',
      args: [view.getContainerRailBodyId()]
    },
    {
      method: 'cancelPendingActions',
      args: [view.getContainerBodyId()]
    });
  };

  function fadeThroughBackground(from, to, time) {
    fadeTo(from, 0, time / 2);
    return fadeTo(to, DOM.maxOpacity, time);
  };

  function crossfade(from, to) {
  //  if (self.options.render)
  //    options.to.render();

//    if (!self.isRunning())
//      return;

    var dfd = $.Deferred();
    var opacityChain = [
      {
        method: 'animateStyle',
        args: [{
          body: self.from.getContainerBodyId(),
          property: 'opacity',
          start: DOM.maxOpacity,
          end: 0,
          duration: time,
          oncomplete: dfd.resolve,
          oncancel: dfd.reject
        }]
      },
      {
        method: 'animateStyle',
        args: [{
          body: self.to.getContainerBodyId(),
          property: 'opacity',
          start: 0,
          end: DOM.maxOpacity,
          duration: time,
          oncomplete: dfd.resolve,
          oncancel: dfd.reject
        }]
      }
    ];

    Physics.there.chain(opacityChain);
    return dfd.promise();
  };

  function fadeTo(id, opacity, time) {
    var dfd = $.Deferred();
    Physics.there.animateStyle({
      body: id,
      property: 'opacity',
//          start: DOM.maxOpacity,
      end: opacity,
      duration: time,
      oncomplete: dfd.resolve,
      oncancel: dfd.reject
    });

    return dfd.promise();
  };

  function switchZIndex(from, to) {
    Physics.there.chain(
      {
        method: 'style',
        args: [from, {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [to, {
          'z-index': 1000
        }]
      }
    );
  };

  function Transition(options) {
    var self = this;

    this.options = options;
    this.from = options.from;
    this.to = options.to;
    this.dfd = $.Deferred();
    this.promise = this.dfd.promise();
    this.promise.always(function() {
      self._complete = self.promise.state() == 'resolved';
      self._failed = self.promise.state() == 'rejected';
    });

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
        });
      }

      Physics.disableDrag();
      if (this.from)
        this.from.el.$trigger('page_beforehide');

      this.to.el.$trigger('page_beforeshow');
      this.transition.apply(this, arguments);
      Physics.there.chain(this.chain);
      if (this.options.render) {
//        setTimeout(function() {
//          self.options.to.render();
//        }, 1);
        this.options.to.render();
      }

      return this.promise.always(function() {
        Physics.enableDrag();
        if (self.promise.state() == 'resolved' && self.from) {
          self.from.turnOffPhysics();
//          self.from.$el.trigger('page_hide');
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

  function Immediate(options) {
    options = _.extend({}, options);
    Transition.apply(this, arguments);
  };

  Immediate.prototype = Object.create(Transition.prototype);
  Immediate.prototype.transition = function() {
    var toDir = this.options.direction,
        fromDir = getOppositeDir(toDir),
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        fromId = this.from.getContainerBodyId(),
        toId = this.to.getContainerBodyId();

    this.chain.push(
      {
        method: 'style',
        args: [fromId, {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [toId, {
          'z-index': 1000
        }]
      },
      {
        method: 'teleport' + toDir.capitalizeFirst(),
        args: [fromRailId]
      },
      {
        method: 'teleportCenterX',
        args: [toRailId]
      },
      {
        method: 'style',
        args: [fromRailId, {
          opacity: 0
        }]
      },
      {
        method: 'style',
        args: [toRailId, {
          opacity: DOM.maxOpacity
        }]
      }
    );

    this.dfd.resolve();
  };

  function Slide(options) {
    options = _.extend({}, options, slideDefaultSettings);
    Transition.apply(this, arguments);
  };

  Slide.prototype = Object.create(Transition.prototype);
  Slide.prototype.transition = function() {
    var toDir = this.options.direction,
        fromDir = getOppositeDir(toDir),
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        fromId = this.from.getContainerBodyId(),
        toId = this.to.getContainerBodyId(),
//        duration = this.options.duration;
        a = this.options.acceleration,
        accFromActionId = _.uniqueId('accAction'),
        styleFromActionId = _.uniqueId('styleAction'),
        accToActionId = _.uniqueId('accAction'),
        styleToActionId = _.uniqueId('styleAction');

    if (!this.to._visited || DOM.getTranslation(this.to.el).X == 0) {
      this.to._visited = true;
      this.chain.push({
        method: 'teleport' + fromDir.capitalizeFirst(),
        args: [toRailId, fromDir]
      });
    }

    cancelPendingActions(this.from, this.chain);
    cancelPendingActions(this.to, this.chain);
    this.chain.push(
      {
        method: 'style',
        args: [fromId, {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [toId, {
          'z-index': 1000
        }]
      },
      {
        method: 'accelerate' + toDir.capitalizeFirst(),
        args: [{
          actionId:  accFromActionId,
          body: fromRailId,
          oncomplete: this.dfd.resolve,
          oncancel: this.dfd.reject,
          a: a / 2,
          drag: this.options.drag
        }]
      },
      {
        method: 'accelerateCenter',
        args: [{
          actionId: accToActionId,
          body: toRailId,
          a: a,
          drag: this.options.drag
        }]
      },
//      {
//        method: 'rotateFromTo',
//        args: [{
//          body: toRailId,
//          forceFollow: 1, // follow tracked action even if it goes backwards, but only once
//          from: {
//            y: Math.PI / 16 * (fromDir == 'left' ? -1 : 1)
//          },
//          to: {
//            y: 0
//          },
//          trackAction: {
//            body: toRailId,
//            action: accToActionId
//          }
//        }]
//      },
//      {
//        method: 'rotateToAndBack',
//        args: [{
//          body: toRailId,
//          y: -Math.PI / 8,
//          trackAction: {
//            body: toRailId,
//            action: accToActionId
//          }
//        }]
//      },
//      {
//        method: 'rotateBy',
//        args: [{
//          body: toRailId,
//          x: Math.PI,
//          y: Math.PI,
//          trackAction: {
//            body: toRailId,
//            action: accToActionId
//          }
//        }]
//      },
      // the animateStyle actions track the accelerate action of the "to" view to synchronize with arrival at the destination
      {
        method: 'animateStyle',
        args: [{
          actionId: styleFromActionId,
          body: fromRailId,
          trackAction: {
            body: toRailId,
            action: accToActionId
          },
          property: 'opacity',
          end: 0
        }]
      },
      {
        method: 'animateStyle',
        args: [{
          actionId: styleToActionId,
          trackAction: {
            body: toRailId,
            action: accToActionId
          },
          body: toRailId,
          property: 'opacity',
          end: DOM.maxOpacity
        }]
      }
    );
  };

  Slide.prototype.interrupt = function() {
//    // maybe doing nothing is ok too
//    var chain = [];
//
//    cancelPendingActions(this.from, chain);
//    cancelPendingActions(this.to, chain);
//    Physics.there.chain(chain);
//    this.dfd.reject();
  };

//Slide.prototype.reverse = function() {
//var from = this.from;
//this.from = this.to;
//this.to = this.from;
//return Transition.run.call(this);
//var options = _.clone(this.options);
//options.direction = oppositeDir(options.direction);
//return new Slide(this.to, this.from, options);
//};

  function Snap(options) {
    options = _.extend({}, options, snapDefaultSettings);
    Transition.apply(this, arguments);
  };

  Snap.prototype = Object.create(Transition.prototype);
  Snap.prototype.transition = function() {
    var self = this,
        toDir = this.options.direction,
        fromDir = getOppositeDir(toDir),
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        options = this.options,
        duration = options.duration,
        stiffness = options.stiffness,
        damping = options.damping,
        drag = options.drag,
//        finished = 2,
        isFinished = false,
        toSnapId = _.uniqueId('snapAction'),
        fromSnapId = _.uniqueId('snapAction');

//    options.springStiffness = 0.8;
//    options.springDamping = Math.min(0.99, Physics.constants.springDamping);

    function finish() {
//      if (--finished == 0) {
      if (!isFinished) {
        isFinished = true;
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
          'z-index': 1000
        }]
      },
      {
        method: 'snapTo',
        args: [{
          actionId: fromSnapId,
          body: fromRailId,
          x: G.viewport.width * (toDir == 'left' ? -1 : 1),
          z: -10,
          stiffness: stiffness / 2,
          damping: damping,
          drag: drag,
          oncomplete: finish,
          oncancel: this.dfd.reject
        }]
      },
      {
        method: 'snapTo',
        args: [{
          actionId: toSnapId,
          body: toRailId,
          x: 0,
          z: 0,
          stiffness: stiffness,
          damping: damping,
          drag: drag,
          oncomplete: finish,
          oncancel: this.dfd.reject
        }]
      },
      {
        method: 'animateStyle',
        args: [{
          trackAction: {
            body: toRailId,
            action: toSnapId
          },
          forceFollow: true,
          body: fromRailId,
          property: 'opacity',
          end: 0
        }]
      },
      {
        method: 'animateStyle',
        args: [{
          trackAction: {
            body: toRailId,
            action: toSnapId
          },
          forceFollow: true,
          body: toRailId,
          property: 'opacity',
          end: DOM.maxOpacity
        }]
      }
    );
  };

  Snap.prototype.interrupt = function() {
//    // maybe doing nothing is ok too
//    var chain = [];
//
//    cancelPendingActions(this.from, chain);
//    cancelPendingActions(this.to, chain);
//    Physics.there.chain(chain);
//    this.dfd.reject();
  };

//  function Via(options) {
//    Transition.apply(this, arguments);
//    this.mason = options.via.parentView.mason;
//  };
//
//  Via.prototype = Object.create(Transition.prototype);
//  Via.prototype.transition = function() {
//    var self = this,
//        fromRailId = this.from.getContainerRailBodyId(),
//        toRailId = this.to.getContainerRailBodyId(),
//        fromId = this.from.getContainerBodyId(),
//        toId = this.to.getContainerBodyId(),
//        via = this.options.via,
//        bodyId = via.getBodyId(),
//        time = 1000;
//
//    function doCrossfade() {
////      if (self.options.render)
////        options.to.render();
//
//      if (self.isRunning()) {
////        fadeTo(self.from.getContainerBodyId(), 0, time).done(function() {
////          if (self.isRunning()) {
////            fadeTo(self.to.getContainerBodyId(), 0, time).done(self.dfd.resolve).fail(self.dfd.reject);
////          }
////        }).fail(self.dfd.reject);
//        var fadePromise = fadeThroughBackground(fromId, toId, time * 2).progress(function() {
//          if (!self.isRunning())
//            fadePromise.cancel();
//        }).done(function() {
//          if (self.isRunning())
//            switchZIndex(fromId, toId);
//
//          self.dfd.resolve();
//        })
//      }
//
////      var opacityChain = [
////        {
////          method: 'animateStyle',
////          args: [self.to.getContainerBodyId(), {
////            property: 'opacity',
////            start: 0,
////            end: DOM.maxOpacity,
////            duration: time
////          }, self.dfd.resolve]
////        },
////        {
////          method: 'animateStyle',
////          args: [self.from.getContainerBodyId(), {
////            property: 'opacity',
////            start: DOM.maxOpacity,
////            end: 0,
////            duration: time
////          }]
////        }
////      ];
////
////      Physics.there.chain(opacityChain);
//    };
//
//    this.chain.push(
//      {
//        object: this.mason.id,
//        method: 'saveState',
//        args: [this.options.via.getRailBodyId()]
//      },
//      {
//        object: this.mason.id,
//        method: 'isolate',
//         args: [bodyId, 'pop', time * 2, 'simultaneous' /*callback*/]
//      },
//      {
//        object: this.mason.id,
//        method: 'flyToTopCenter',
//        args: [bodyId, 0.5, null, doCrossfade]
//      },
//      {
//        method: 'style',
//        args: [bodyId, {
//          'text-align': 'center',
//          'border': '1px solid black'
//        }]
//      },
//      {
//        method: 'animateStyle',
//        args: [{
//          body: bodyId,
//          property: 'width',
////          start: via.el.$outerWidth(),
//          end: G.viewport.width,
//          unit: 'px',
//          duration: time
//        }]
//      },
////      {
////        method: 'animateStyle',
////        args: [bodyId, {
////          property: 'height',
////          start: via.el.$outerHeight(),
////      //    end: 50,
////          end: G.viewport.height,
////          unit: 'px',
////          duration: time
////        }]
////      },
//      {
//        method: 'teleportCenterX',
//        args: [toRailId]
//      }
//    );
//
//    this.promise.done(this.cleanup.bind(this));
//  };
//
//  Via.prototype.cleanup = function() {
//    Physics.there.chain(
//      {
//        object: this.mason.id,
//        method: 'loadState',
//        args: [this.from.getContainerRailBodyId()]
//      },
//      {
//        method: 'cancelPendingActions',
//        args: [this.from.getContainerRailBodyId()]
//      },
//      {
//        method: 'cancelPendingActions',
//        args: [this.to.getContainerRailBodyId()]
//      },
//      {
//        method: 'cancelPendingActions',
//        args: [this.from.getContainerBodyId()]
//      },
//      {
//        method: 'cancelPendingActions',
//        args: [this.to.getContainerBodyId()]
//      }
//    );
//  };
//
//  Via.prototype.interrupt = function() {
//    this.dfd.reject();
//    this.cleanup();
//  };

  function ZoomInTo(options) {
  //  if (options.render)
  //    options.to.render();

    options = _.extend({}, options, zoomInToDefaultSettings);
    this.mason = options.via.parentView.mason;
    Transition.apply(this, arguments);
  };

  ZoomInTo.prototype = Object.create(Transition.prototype);
  ZoomInTo.prototype.transition = function() {
    var self = this,
        fromRailId = this.from.getContainerRailBodyId(),
        toRailId = this.to.getContainerRailBodyId(),
        fromId = this.from.getContainerBodyId(),
        toId = this.to.getContainerBodyId(),
        via = this.options.via,
        fromImg = via.el.querySelector('img'),
        toImgInfo = this.from.getViewPageInfo(),
        imgBodyId = _.uniqueId('img-body'),
        bodyId = via.getBodyId(),
        fadeDuration = this.options.fadeDuration;
        a = this.options.acceleration;

    function doCrossfade() {
      if (self.isRunning()) {
        fadeThroughBackground(fromId, toId, fadeDuration * 2).done(self.dfd.resolve).fail(self.dfd.reject);
      }
    };

    if (fromImg && toImgInfo) {
      fromImg.position = 'absolute';
      this.chain.push(
        {
          method: 'addBody',
          args: ['convex-polygon', {
            _id: imgBodyId,
            rel: bodyId,
            x: 0,
            y: 0,
            vertices: Physics.getRectVertices(fromImg.width || fromImg.$outerWidth(), fromImg.height || fromImg.$outerHeight())
          }]
        }
//        ,
//        {
//          method: 'snapBy',
//          args: [imgBodyId, {
//            _id: imgBodyId,
//            rel: bodyId,
//            x: 0,
//            y: 0,
//            vertices: Physics.getRectVertices(fromImg.width || fromImg.$outerWidth(), fromImg.height || fromImg.$outerHeight())
//          }]
//        },
      );
    }

    this.chain.push(
      {
        object: this.mason.id,
        method: 'startTransition',
        args: [this.from.getContainerRailBodyId()]
      },
      {
        object: this.mason.id,
        method: 'saveState',
        args: [this.options.via.getBodyId()]
      },
      {
        object: this.mason.id,
        method: 'zoomInTo',
         args: [{
           body: bodyId,
           // snap variant
           snap: this.options.snap,
           stiffness: this.options.stiffness,
           damping: this.options.damping,
           drag: this.options.drag,
           // acceleration variant
           a: a,
           oncomplete: doCrossfade,
           oncancel: this.dfd.reject
         }]
      },
      {
        method: 'style',
        args: [toRailId, {
          'z-index': 1
        }]
      },
      {
        method: 'style',
        args: [fromRailId, {
          'z-index': 1000
        }]
      },
      {
        method: 'teleportCenterX',
        args: [toRailId]
      }
    );

    this.promise.done(this.cleanup.bind(this));
  };

  ZoomInTo.prototype.interrupt = function() {
    this.dfd.reject();
    this.cleanup();
  };

  ZoomInTo.prototype.cleanup = function() {
    var chain = [];
    cancelPendingActions(this.from.listView, chain);
    cancelPendingActions(this.from, chain);
    cancelPendingActions(this.to, chain);
    chain.push(
      {
        object: this.mason.id,
        method: 'loadState',
        args: [this.from.getContainerRailBodyId()]
      },
      {
        object: this.mason.id,
        method: 'endTransition',
        args: [this.from.getContainerRailBodyId()]
      }
    );

    if (this.promise.state() == 'resolved') {
      chain.push({
        object: this.mason.id,
        method: 'sleep',
        args: [this.from.getContainerRailBodyId()]
      });
    }

    Physics.there.chain(chain);
  };

  ZoomInTo.prototype.interrupt = function() {
    this.dfd.reject();
    this.cleanup();
  };

//  function RotateAndZoomInTo(options) {
//  //  if (options.render)
//  //    options.to.render();
//
//    options = _.extend({}, options, rotateAndZoomInToDefaultSettings);
//    this.mason = options.via.parentView.mason;
//    Transition.apply(this, arguments);
//  };
//
//  RotateAndZoomInTo.prototype = Object.create(Transition.prototype);
//  RotateAndZoomInTo.prototype.transition = function() {
//    var self = this,
//        fromRailId = this.from.getContainerRailBodyId(),
//        toRailId = this.to.getContainerRailBodyId(),
//        fromId = this.from.getContainerBodyId(),
//        toId = this.to.getContainerBodyId(),
//        via = this.options.via,
//        bodyId = via.getBodyId(),
//        fadeDuration = this.options.fadeDuration,
//        rotateDuration = this.options.rotateDuration,
//        a = this.options.acceleration,
//        brickId = this.options.via.getBodyId(),
//        angle = this.options.angle;
//
//    function doCrossfade() {
//      if (self.isRunning()) {
//        fadeThroughBackground(fromId, toId, fadeDuration * 2).done(self.dfd.resolve).fail(self.dfd.reject);
//      }
//    };
//
//    function zoomIn() {
//      Physics.there.chain(
//        {
//          object: this.mason.id,
//          method: 'zoomInTo',
//           args: [{
//             body: bodyId,
//  //           snap: true,
//             a: a,
//             drag: this.options.drag,
//             oncomplete: doCrossfade,
//             oncancel: this.dfd.reject
//           }]
//        },
//        {
//          method: 'style',
//          args: [toRailId, {
//            'z-index': 1
//          }]
//        },
//        {
//          method: 'style',
//          args: [fromRailId, {
//            'z-index': 1000
//          }]
//        },
//        {
//          method: 'teleportCenterX',
//          args: [toRailId]
//        }
//      );
//    };
//
//    this.chain.push({
//      object: this.mason.id,
//      method: 'startTransition',
//      args: [fromRailId]
//    },
//    {
//      object: this.mason.id,
//      method: 'saveState',
//      args: [brickId]
//    },
////    {
////      method: 'style',
////      args: [this.from.listView.getContainerBodyId(), {
////        'transform-origin': '0% 100%'
////      }]
////    },
//    {
//      method: 'rotateBy',
//      args: [{
//        body: this.from.listView.getContainerBodyId(),
//        x: -angle,
//        duration: rotateDuration,
//        oncomplete: zoomIn.bind(this),
//        oncancel: this.dfd.reject
//      }]
//    },
//    {
//      method: 'flyTo',
//      args: [{
//        body: brickId,
//        z: 100,
//        duration: rotateDuration
//      }]
//    },
//    {
//      method: 'rotateBy',
//      args: [{
//        body: brickId,
//        x: angle,
//        duration: rotateDuration,
//        oncancel: this.dfd.reject
//      }]
//    });
//
//    this.promise.done(this.cleanup.bind(this));
//  };
//
//  RotateAndZoomInTo.prototype.interrupt = function() {
//    this.dfd.reject();
//    this.cleanup();
//  };
//
//  RotateAndZoomInTo.prototype.cleanup = function() {
//    var chain = [];
//    cancelPendingActions(this.from.listView, chain);
//    cancelPendingActions(this.from, chain);
//    cancelPendingActions(this.to, chain);
//    chain.push(
//      {
//        object: this.mason.id,
//        method: 'loadState',
//        args: [this.from.getContainerRailBodyId()]
//      },
//      {
//        object: this.mason.id,
//        method: 'endTransition',
//        args: [this.from.getContainerRailBodyId()]
//      }
//    );
//
//    if (this.promise.state() == 'resolved') {
//      chain.push({
//        object: this.mason.id,
//        method: 'sleep',
//        args: [this.from.getContainerRailBodyId()]
//      });
//    }
//
//    Physics.there.chain(chain);
//  };
//
//  RotateAndZoomInTo.prototype.interrupt = function() {
//    this.dfd.reject();
//    this.cleanup();
//  };

  var Transitions = {
    immediate: function(options) {
      return new Immediate(options);
    },

    slide: function(options) {
      return new Slide(options);
    },

    snap: function(options) {
      return new Snap(options);
    },

    zoomInTo: function(options) {
      return new ZoomInTo(options);
    }
//    ,
//
//    rotateAndZoomInTo: function(options) {
//      return new RotateAndZoomInTo(options);
//    }
//
//    ,
//
//    via: function(options) {
//      return new Via(options);
//    }
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
//      if (options.render)
//        to.render();

      if (options.render)
        options.to.render();

//      var dfd = $.Deferred();
//      Q.write(function() {
        Physics.there.style(to.getContainerBodyId(), {
          opacity: DOM.maxOpacity,
          'z-index': 1000
        });

//        dfd.resolve();
//      });
//
//      return dfd.promise();
      return G.getResolvedPromise();
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
  };
});
