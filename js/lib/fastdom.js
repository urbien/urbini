
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
      FRAME_SIZE = 16,
      FRAME_END = 12,
      getNow = window.performance ? performance.now.bind(performance) : Date.now.bind(Date),
      modeOrder = ['nonDom', 'read', 'write'],
      numModes = modeOrder.length;
  
  /**
   * Creates a fresh
   * FastDom instance.
   *
   * @constructor
   */
  function FastDom() {
    this.timestamps = [];
    this.lastId = 0;
    this.jobs = {};
    this.mode = null;
    this.pending = false;
    this.queue = {};
    for (var i = 0; i < modeOrder.length; i++) {
      this.queue[modeOrder[i]] = [];
    }
  }

  for (var i = 0; i < modeOrder.length; i++) {
    (function(i) {
      var mode = modeOrder[i];
      FastDom.prototype[mode] = function(fn, ctx) {
        var job = this.add(mode, fn, ctx);
        this.queue.read.push(job.id);
        this.request(mode);
        return job.id;
      }
    })(i);
  }
  
  FastDom.prototype.debug = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('FASTDOM');
    console.log.apply(console, args);
  };

  FastDom.prototype.log = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('FASTDOM');
    console.log.apply(console, args);
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
      caf(job.timer);
      return;
    }

    var list = this.queue[job.type];
    var index = list.indexOf(id);
    if (~index) list.splice(index, 1);
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
    raf(this.frame.bind(this));

    // Set flag to indicate
    // a frame has been scheduled
    this.pending = true;
  };

  /**
   * Generates a unique
   * id for a job.
   *
   * @return {Number}
   * @api private
   */
  FastDom.prototype.uniqueId = function() {
    return ++this.lastId;
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
      lastJob = this.run(this.jobs[id]);
      var numTimestamps = this.timestamps.length;
      this.debug('JOB: ', lastJob, 'TOOK: ', this.timestamps[numTimestamps - 1] - this.timestamps[numTimestamps - 2]);
    }
    
    if (postpone) {
      this.log('POSTPONING: ', this.mode, 'FRAME TOOK: ', this._frameTime);
      // postpone to next frame, keep the current mode
      raf(this.frame.bind(this));
      return false;
    }
  };

  FastDom.prototype.time = function() {
    var now = getNow();
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
    this.pending = false;
    this.frameStart = this.time();
    
    var idx = this.mode ? modeOrder.indexOf(this.mode) : 0;
    for (var i = idx; i < numModes; i++) {
      this.mode = modeOrder[i];
      if (this.flush(this.queue[this.mode]) == false) // postponed to next frame
        return;
    }
    
    this.mode = null;
  };

  /**
   * Defers the given job
   * by the number of frames
   * specified.
   *
   * @param  {Number}   frames
   * @param  {Function} fn
   * @api public
   */
  FastDom.prototype.defer = function(frames, fn, ctx) {
    if (frames < 0) return;
    var job = this.add('defer', fn, ctx);
    var self = this;

    (function wrapped() {
      if (!(frames--)) {
         self.run(job);
         return;
      }

      job.timer = raf(wrapped);
    })();

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
  FastDom.prototype.add = function(type, fn, ctx) {
    var id = this.uniqueId();
    return this.jobs[id] = {
      id: id,
      fn: fn,
      ctx: ctx,
      type: type
    };
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
    var ctx = job.ctx || this;

    // Clear reference to the job
    delete this.jobs[job.id];

    // Call the job in
    try { job.fn.call(ctx); } catch(e) {
      this.onError(e);
    }
    
    this.time();
    return job;
  };

  return new FastDom();
})