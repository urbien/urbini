define('lib/animationQueue', ['globals', 'underscore'], function(G, _) {

  var raf = window.requestAnimationFrame,
      caf = window.cancelAnimationFrame,
      idleTimer,
      idleQueueTimer,
      Q;

  Q = window.Q = {
    isIdle: true,
    isRunning: false,
    queue: [],
    idleQueue: [],
    
//    runningQueue: [],
    /**
     *
     * @param fn
     * @param [scope]
     * @param [args]
     */
    start: function(fn, scope, args) {
      this.queue.push(arguments);
      if (this.isRunning)
        return;
  
      if (this.hasOwnProperty('idleTimer')) {
        clearTimeout(this.idleTimer);
        delete this.idleTimer;
      }

      if (this.hasOwnProperty('idleQueueTimer')) {
        clearTimeout(this.idleQueueTimer);
        delete this.idleQueueTimer;
      }

      this.isIdle = false;
      this.isRunning = true;
      this.doStart();
    },
  
    run: function() {
      if (!this.isRunning) {
        return;
      }
      
      if (!this.queue.length) {
        this.stop();
        return;
      }
  
      var queue = [];
      queue.push.apply(queue, this.queue); // http://jsperf.com/splice-vs-push
      this.queue.length = 0;
      
      for (i = 0, ln = queue.length; i < ln; i++) {
        this.invoke(queue[i]);
      }
  
      this.doIterate();
    },
  
    doStart: function() {
      this.animationFrameId = raf(this.run);
    },

    doIterate: function() {
      this.animationFrameId = raf(this.run);
    },

    doStop: function() {
      caf(this.animationFrameId);
    },
  
    stop: function() {
      if (!this.isRunning) {
        return;
      }
   
      this.doStop();
      this.isRunning = false;
      this.idleTimer = setTimeout(this.setIdle, 100);
    },

    onIdle: function(fn, scope, args) {
      var listeners = this.idleQueue,
          i, ln, listener;
  
      for (i = 0, ln = listeners.length; i < ln; i++) {
        listener = listeners[i];
        if (fn === listener[0] && scope === listener[1] && args === listener[2]) {
          return;
        }
      }
  
      listeners.push(arguments);
  
      if (this.isIdle) {
        this.processIdleQueue();
      }
    },
  
    unIdle: function(fn, scope, args) {
      var listeners = this.idleQueue,
          i, ln, listener;
  
      for (i = 0, ln = listeners.length; i < ln; i++) {
        listener = listeners[i];
        if (fn === listener[0] && scope === listener[1] && args === listener[2]) {
          listeners.splice(i, 1);
          return true;
        }
      }
  
      return false;
    },
  
    invoke: function(listener) {
      var fn = listener[0],
          scope = listener[1],
          args = listener[2];
  
      fn = (typeof fn == 'string' ? scope[fn] : fn);
  
      if (_.isUndefined(args))
        fn.call(scope);
      else if (_.isArray(args))
        fn.apply(scope, args);
      else
        fn.call(scope, args);
    },
  
    setIdle: function() {
      this.isIdle = true;
      this.processIdleQueue();
    },
  
    processIdleQueue: function() {
      if (!this.hasOwnProperty('idleQueueTimer')) {
        this.idleQueueTimer = setTimeout(this.processIdleQueueItem, 1);
      }
    },
  
    processIdleQueueItem: function() {
      delete this.idleQueueTimer;
  
      if (!this.isIdle) {
        return;
      }
  
      var listeners = this.idleQueue,
          listener;
  
      if (listeners.length > 0) {
        listener = listeners.shift();
        this.invoke(listener);
        this.processIdleQueue();
      }
    }
  };

  for (var prop in Q) {
    if (typeof Q[prop] == 'function')
      Q[prop] = Q[prop].bind(Q);
  }
  
  return Q;  
});