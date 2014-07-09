define('taskQueue', ['globals', 'underscore', 'events'], function(G, _, Events) {
  
  var STATE_BLOCKED = 'blocked',
      // paused means we're not running any new tasks because we just queued a blocking task and we're waiting for all currently running non-blocking tasks to finish before we can run it
      STATE_PAUSED = 'paused',  
      STATE_OPEN = 'open',
      taskQueues = [],
      DEFAULT_TIMEOUT = 10000;
  
  window.taskQueues = taskQueues;

  function PriorityQueue() {
    var queue = [];
    return {
      clear: function() {
        queue.length = 0;
      },
      /**
       * @task Task object
       */
      push: function(task) {
        queue.push(task);
        queue.sort(function(a, b) {
          var priorityDiff = a.getPriority() - b.getPriority();
          if (priorityDiff)
            return priorityDiff;
          else
            return a.isBlocking() ? -1 : b.isBlocking() ? 1 : 0;
        });
      },
      
      /**
       * @return Task object
       */
      pop: function() {
        return queue.splice(0, 1)[0];
      },

      peek: function() {
        return queue[0];
      },

      length: function() {
        return queue.length;
      },
      
      getRawQueue: function() {
        return queue;
      },
      
      has: function(name) {
        return _.contains(_.pluck(queue, 'name'), name);
      }
    }
  }
  
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("taskQueue");
    G.log.apply(G, args);
  }
  
  function TaskQueue(name) {
    if (!(this instanceof TaskQueue))
      return new TaskQueue(name);
    
    var tq = this,
        queue = this.queue = new PriorityQueue(),
        running = this.running = [];
    
    function reset() {
      queue.clear();
      running.length = 0;
      open();
    };
    
    // state machine methods
    function pause() {
      tq.state = STATE_PAUSED;
    };
    
    function block() {
      tq.state = STATE_BLOCKED;
    };
    
    function open() {
      if (tq.running.length && _.find(tq.running, function(t) { return t.isBlocking() }))
        debugger;
      
      tq.state = STATE_OPEN;
    };
    
    function isOpen() {
      return tq.state === STATE_OPEN;
    };
    
    function isPaused() {
      return tq.state === STATE_PAUSED;
    };
    
    function isBlocked() {
      return tq.state === STATE_BLOCKED;
    }
    // end state machine methods

    open();
    tq.name = name;
    
    function checkForDisaster(task) {
      if (task.isBlocking()) {
        if (running.length) {
          var conflicts = _.filter(running, function(t) { return t.state() == 'pending' });
          if (conflicts.length)
            debugger;
          
//          throw "About to run a blocking task {0} alongside other tasks: {1}!".format(task.getName(), _.map(running, function(t) { return t.getName() }).join(', '));
        }
      }
      else {
        var runningBlockingTask = _.find(tq.running, function(t) { return t.isBlocking() }); 
        if (runningBlockingTask) {
          var state = runningBlockingTask.state();
          if (state == 'pending')
            debugger;
//          throw "About to run a non-blocking task {0} alongside a blocking task: {1}!".format(task.getName(), runningBlockingTask.getName());
        }
      }
    }
    
    function runTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      checkForDisaster(task);
      if (task.isBlocking()) {
        if (running.length)
          debugger;
        
        block();
      }

      if (running.length) {
        if (task.isBlocking() || _.find(running, function(t) { return t.isBlocking() }))
          debugger;
      }

      try {
        if (task.queuedAt) {
          task.waited = _.now() - task.queuedAt;
          log('taskQueue', 'Task {0} delayed by {1}ms'.format(task.getName(), task.waited));
        }
          
        task.run();
      } catch (err) {
        log('error', 'task crashed: ', task.name);
        task.reject(err);
      }
      
      var promise = task.promise();
      running.push(task);
      promise.always(function() {
        var resolved = promise.state() === 'resolved';
        log(resolved? 'taskQueue' : 'error', 'Task {0}: {1}'.format(resolved ? 'completed' : 'failed', task.getName()));
        if (running.indexOf(task) == -1)
          debugger;
        else
          running.splice(running.indexOf(task), 1);
        
        if (isBlocked()) {
          if (running.length)
            debugger;
          
          open();
        }
        
        next(); 
      });
      
      if (!task.isBlocking())
        next();
      
      return promise;
    }
    
    function push(task) {
      task.queuedAt = _.now();
      queue.push(task);
    }
    
    function queueTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      var qLength = queue.length();
//      log('taskQueue', 'Checking task:', task.getName());
      if (!isOpen()) {
//        console.debug("Running", tq.running);
//        console.debug("Queue", tq.queue.getRawQueue());
        log('taskQueue', 'queue is ' + (isBlocked() ? 'blocked' : 'paused') + ', queueing {0}blocking task: {1}'.format(task.isBlocking() ? '' : 'non-' , task.getName()));
        push(task);
      }      
      else if (task.isBlocking()) {
        if (running.length) {
          pause();
          push(task);
        }
        else
          runTask(task);
      }
      else
        runTask(task);
      
      return task.promise();
    }
    
    function next() {
      if (isBlocked() || !queue.length())
        return;
      
      var task = queue.peek();
      if (task.isBlocking()) {
        if (!running.length)
          runTask(queue.pop());
      }
      else if (!isPaused())
        runTask(queue.pop());
    }
    
    var api = {
      debug: function(debug) {
        tq.debug = debug;
      },
      queueTask: queueTask,
      destroy: function() {
        Array.remove(taskQueues, tq);
      },
      reset: function() {
        queue.clear();
        running.length = 0;
        open();
      },
      newTask: function() {
        return Task.apply(null, arguments);
      },
      getRunning: function(name) {
        var running = _.compact(_.map(running, function(task) {
          return task.getName() == name ? task.promise() : null;
        }));
        
        return running.length ? $.whenAll.apply($, running) : null;
      },
      getQueued: function(name) {
        var queued = _.compact(_.map(queue.getRawQueue(), function(task) {
          return task.getName() == name ? task.promise() : null;
        }));
        
        return queued.length ? $.whenAll.apply($, queued) : null;
      },
      state: function() {
        return tq.state;
      }
    }
    
    taskQueues.push(api);
    return api;
  }
  
  /**
   * @param options 
   * {
   *   name: String, 
   *   taskFn: Function, 
   *   blocking: Boolean, 
   *   priority: Integer, 
   *   timeout: Long or Boolean (default timeout will be used if value is "true")
   * }
   */
  function Task(options) {
    if (typeof options == 'string')
      debugger;
    
    if (!(this instanceof Task))
      return new Task(options);
    
    var self = this,
        defer = $.Deferred(),
        promise = defer.promise(), 
        started = false,
        taskFn = options.task;

    this.options = _.defaults(options, {
      priority: 0,
      blocking: false,
      timeout: true
    });
    
    if (this.options.timeout === true)
      this.options.timeout = DEFAULT_TIMEOUT;
    
    this.run = function() {
//      log('taskQueue', 'Running task:', this.getName());
      started = true;
      var otherPromise = taskFn.call(defer, defer);
      if (otherPromise && typeof otherPromise.then == 'function')
        otherPromise.always(defer.resolve);
      
      this.monitorRunningTime();
    };
    
    // allow task consumers to treat the task as a promise
    for (var fn in promise) {
      if (typeof promise[fn] == 'function') {
        this[fn] = promise[fn].bind(promise);
      }
    }
    
    _.each(['reject', 'resolve', 'notify'], function(dFn) {
      self[dFn] = defer[dFn].bind(defer);
    });
    
    this.isFinished = function() {
      return started && promise.state() == 'resolved';
    };
  }
  
  Task.prototype = {
    getName: function() {
      return this.options.name;
    },
    isBlocking: function() {
      return this.options.blocking;
    },
    getPriority: function() {
      return this.options.priority;
    },
    monitorRunningTime: function() {
      if (_.has(this, 'runtime'))
        return;

      var self = this,
          runtime = 0,
          timeout = this.options.timeout,
          period = timeout || DEFAULT_TIMEOUT;
      
      this.timeoutMonitor = setInterval(function() {
        if (timeout) {
//          debugger;
          log('taskQueue', 'Task timed out: ' + self.getName());            
          self.reject();
        }
        else {
          runtime += period;
          log('taskQueue', 'Task ' + self.getName() + ' has taken: ' + runtime + 'millis so far');
        }
      }, period);
      
      this.always(function() {
        clearInterval(self.timeoutMonitor);
      });
    }
  };
  
  Events.on('clearTaskQueues', function() {
    for (var i = 0; i < taskQueues.length; i++) {
      taskQueues[i].reset();
    }
  });
  
  return TaskQueue;
});