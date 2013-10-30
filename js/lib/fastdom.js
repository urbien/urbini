
/**
 * DOM-Batch
 *
 * Eliminates layout thrashing
 * by batching DOM read/write
 * interactions.
 *
 * @author Wilson Page <wilsonpage@me.com>
 */

define('lib/fastdom', ['globals'], function(G) {
  'use strict';
  var raf = window.raf,
      caf = window.caf,
      FPS = 45,
      FRAME_SIZE = 16,
      FRAME_END = 14,
      modeOrder = ['nonDom', 'read', 'write'],
      numModes = modeOrder.length,
      BYPASS = false;
  
  /**
   * Creates a fresh
   * FastDom instance.
   *
   * @constructor
   */
  function FastDom() {
    this.frameNum = 0;
    this.timestamps = [];
    this.lastId = 0;
    this.jobs = {};
    this.mode = null;
    this.pending = false;
    this.queue = {};
    for (var i = 0; i < modeOrder.length; i++) {
      this.queue[modeOrder[i]] = [];
    }
    
//    this.frame = this.frame.bind(this);
    for (var prop in this) {
      var val = this[prop];
      if (typeof val == 'function')
        this[prop] = val.bind(this);
    }
  }

  for (var i = 0; i < modeOrder.length; i++) {
    (function(i) {
      var mode = modeOrder[i];
      
      /**
       * @param options - {
       *   throttle: {Boolean} whether this function should be limited to running once per frame,
       *   first: {Boolean} used in combination with 'throttle,' if true will run the first function call, otherwise the last
       * }
       */
      FastDom.prototype[mode] = function(fn, ctx, args, options) {
        var jobs = this.jobs;
        if (options && options.throttle) {
          var first = options.first;
          for (var id in jobs) {
            var jFn = jobs[id].fn;
            if (fn === jFn) {
              if (first)
                return;
              else
                this.clear(id);
            }
          }
        }

        var job = this.add(mode, fn, ctx, args, options);
        this.queue[mode].push(job.id);
        this.request(mode);
        return job.id;
      }
    })(i);
  }
  
  var FrameWatch = window.FrameWatch = (function() {
    var listeners = [],
        frameId;
    
    function subscribe(callback) {
      listeners.push(callback);
      if (frameId === undefined)
        frameId = raf(publish);
    }
    
    function unsubscribe(callback) {
      Array.remove(listeners, callback);
      if (!listeners.length && frameId !== undefined) {
        caf(frameId);
        frameId = undefined;
      }
    }

    function publish() {
      frameId = raf(publish);
      for (var i = listeners.length - 1; i > -1; i--) {
        listeners[i]();
      }
    }
    
    return {
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      isRunning: function() {
        return frameId !== undefined;
      }
    }
  })();
  
  FastDom.prototype.debug = function() {
    if (!G.DEBUG)
      return;
    
    var args = Array.prototype.slice.call(arguments);
    args.unshift('FASTDOM', 'FRAME', this.frameNum);
    console.debug.apply(console, args);
  };

  FastDom.prototype.log = function() {
//    if (!G.DEBUG)
//      return;
    
    var args = Array.prototype.slice.call(arguments);
//    args.unshift('FASTDOM');
    args.unshift('FASTDOM', 'FRAME', this.frameNum);
    G.log.apply(G, args);
//    console.log.apply(console, args);
  };

  FastDom.prototype.nextFramePromise = function() {
    if (this.mode == null && !this.pending)
      return G.getResolvedPromise();
      
    if (!this._nextFramePromise || this._nextFramePromise.state() != 'pending') {
      this._nextFrameDeferred = $.Deferred();
      this._nextFramePromise = this._nextFrameDeferred.promise();
    }
    
    return this._nextFramePromise;
  };
  
  /**
   * Removes a job from the queue
   *
   * @param  {Number} id
   * @api public
   */
  FastDom.prototype.clear = function(id) {
    var job = this.jobs[id];
    if (!job) return;

    // Clear reference
    delete this.jobs[id];

    // Defer jobs are cleared differently
    if (job.type === 'defer') {
//      if (job.timer)
//        caf(job.timer);
//      else if (job.timeout)
//        clearTimeout(job.timeout);
//      
      return;
    }

    var list = this.queue[job.type];
    var index = list.indexOf(id);
    if (~index) 
      list.splice(index, 1);
  };

  /**
   * Makes the decision as to
   * whether a the frame needs
   * to be scheduled.
   *
   * @param  {String} type
   * @api private
   */
  FastDom.prototype.request = function(type) {
    if (BYPASS)
      return;
    
    var mode = this.mode;

    // If there is already a frame
    // scheduled, don't schedule another one
    if (this.pending) return;
    
    // If we are currently in mode X, we don't
    // need to scedule a new frame as this
    // job will be emptied from the queue
    if (mode === type) return;

    // If we are doing nonDom work, we don't need to schedule
    // a new frame and this read job will be run
    // after the nonDom queue has been emptied in the
    // currently active frame.
    if (mode === 'nonDom' && type === 'read') return;

    // If we are reading we don't need to schedule
    // a new frame and this write job will be run
    // after the read queue has been emptied in the
    // currently active frame.
    if (mode === 'read' && type === 'write') return;

    // Schedule frame (preserving context)
    this.scheduleFrame();

//    // Set flag to indicate
//    // a frame has been scheduled
//    this.pending = true;
  };

  FastDom.prototype.postponeFrame = function() {
    this.pending = false;
    this.scheduleFrame();
  };

  FastDom.prototype.scheduleFrame = function() {
    if (this.pending) { // sanity check, to make sure we're not running the queue in two callbacks
      debugger;
      return;
    }
    
    this.pending = true;
    raf(this.frame);
  };

  FastDom.prototype.startFrame = function() {
    this.frameNum++;
    this.pending = false;
    this.frameStart = this.time();
  }
  
  /**
   * Generates a unique
   * id for a job.
   *
   * @return {Number}
   * @api private
   */
  FastDom.prototype.uniqueId = function() {
    return ++this.lastId + ''; // so we can use for-in loops, which will convert it to string anyway (and cause trouble if we expect an int elsewhere)
  };

  FastDom.prototype.isOutOfTime = function() {
    return (this._frameTime = _.last(this.timestamps) - this.frameStart) >= FRAME_END;
  };
  
  /**
   * Calls each job in
   * the list passed.
   *
   * If a context has been
   * stored on the function
   * then it is used, else the
   * current `this` is used.
   *
   * @param  {Array} list
   * @api private
   */
  FastDom.prototype.flush = function(list) {
    var id,
        postpone,
        lastJob;
    
    while (!(postpone = this.isOutOfTime()) && (id = list.shift())) {
      lastJob = this.jobs[id];
      if (!lastJob)
        continue;
      
      this.run(lastJob);
      var numTimestamps = this.timestamps.length;
//      this.debug('JOB: ', lastJob, 'TOOK: ', this.timestamps[numTimestamps - 1] - this.timestamps[numTimestamps - 2]);
    }
    
    if (postpone && !this.pending) {
      this.log('POSTPONING: ', this.mode, 'FRAME TOOK: ', this._frameTime);
      // postpone to next frame, keep the current mode
      this.postponeFrame();
      return false;
    }
  };

  FastDom.prototype.time = function() {
    var now = window.performance.now();
    this.timestamps.push(now);
    if (this.timestamps.length > 50)
      this.timestamps = this.timestamps.slice(0, 10);
    
    return now;
  };
  
  /**
   * Runs any read jobs followed
   * by any write jobs.
   *
   * @api private
   */
  FastDom.prototype.frame = function() {
    var postponed = false;
    if (this._nextFrameDeferred)
      this._nextFrameDeferred.resolve();
    
    // Set the pending flag to
    // false so that any new requests
    // that come in will schedule a new frame
    this.startFrame();
    
    var idx = this.mode ? modeOrder.indexOf(this.mode) : 0;
    for (var i = idx; i < numModes; i++) {
      this.mode = modeOrder[i];
      if (this.flush(this.queue[this.mode]) == false) // postponed to next frame
        return;
    }
    
//    this.log('------------------END OF FRAME----------------------');
    this.mode = null;
  };

//  FastDom.prototype.defer = function(frames, type, fn, ctx, args, options) {
//    if (frames < 0) return;
//    var job = this.add('defer', this[type].bind(this, fn, ctx, args, options)); // use regular queueing mechanism
//    job.timeout = setTimeout(this.run.bind(this, job), 1000 / 60 * frames);
//    return job.id;
//  }
  
  /**
   * Defers the given job
   * by the number of frames
   * specified.
   *
   * @param  {Number}   frames
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.defer = function(frames, type, fn, ctx, args, options) {
    if (BYPASS) {
      this[type](fn, ctx, args, options);
      return;
    }
    
    if (frames < 0) return;
    var self = this;
    var job = this.add('defer', this[type].bind(this, fn, ctx, args, options)); // use regular queueing mechanism
    
    FrameWatch.subscribe(function wrapped() {
      if (!(frames--)) {
        FrameWatch.unsubscribe(wrapped);
        self.run(job);
        return;
      }
    });

    return job.id;
  };

  /**
   * Adds a new job to
   * the given queue.
   *
   * @param {Array}   list
   * @param {Function} fn
   * @param {Object}   ctx
   * @returns {Number} id
   * @api private
   */
  FastDom.prototype.add = function(type, fn, ctx, args, options) {
    var id = this.uniqueId();
    var job = this.jobs[id] = {
      id: id,
      type: type,
      fn: fn,
      ctx: ctx,
      args: args,
      options: options
    };
    
    if (BYPASS)
      this.run(job);
    
    return job;
  };

  FastDom.prototype.queueLength = function() {
    var total = 0;
    for (var type in this.queue) {
      if (type !== 'defer')
        total += this.queue[type].length;
    }
    
    return total;
  };
  
  FastDom.prototype.whenIdle = function(type, fn, ctx, args, options) {
    if (BYPASS || this.queueLength() == 0)
      this[type](fn, ctx, args, options);
    else
      this.defer(5, 'nonDom', this.whenIdle.bind(this, type, fn, ctx, args, options));
  };
  
  /**
   * Called when a callback errors.
   * Overwrite this if you don't
   * want errors inside your jobs
   * to fail silently.
   *
   * @param {Error}
   */
  FastDom.prototype.onError = function() {};

  /**
   * Runs a given job.
   * @param  {Object} job
   * @api private
   */
  FastDom.prototype.run = function(job) {
//    var ctx = job.ctx || this;

    // Clear reference to the job
    delete this.jobs[job.id];

    // Call the job in
    try { 
      var args = job.args,
          ctx = job.ctx;
    
      if (args) {
        if (_.isArray(args))
          job.fn.apply(ctx, args);
        else
          job.fn.call(ctx, args);
      }
      else if (ctx)
        job.fn.call(ctx);
      else
        job.fn();
    } catch(e) {
      debugger;
      this.onError(e);
    }
    
    this.time();
    return job;
  };

  return window.fastdom = new FastDom();
})