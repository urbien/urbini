define('taskQueue', ['globals', 'underscore'], function(G, _, $idb) {
  
  var STATE_BLOCKED = 'blocked',
      STATE_PAUSED = 'paused',
      STATE_OPEN = 'open';
  
  function PriorityQueue() {
    var queue = [];
    return {
      /**
       * @task Task object
       */
      push: function(task) {
        queue.push(task);
        queue.sort(function(a, b) {
          var priorityDiff = a.priority - b.priority;
          if (priorityDiff)
            return priorityDiff;
          else
            return a.blocking ? -1 : b.blocking ? 1 : 0;
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
    
//    window.taskQueue = this;
    
    var tq = this,
        queue = this.queue = new PriorityQueue(),
        running = this.running = [];
    
    // state machine methods
    _.extend(tq, {
      pause: function() {
        if (tq.state !== STATE_OPEN)
          debugger;
        
        tq.state = STATE_PAUSED;
      },
      block: function() {
        if (tq.state === STATE_BLOCKED)
          debugger;
        
        tq.state = STATE_BLOCKED;
      },
      open: function() {
        if (tq.state === STATE_PAUSED)
          debugger;
        
        tq.state = STATE_OPEN;
      },
      isOpen: function () {
        return tq.state === STATE_OPEN;
      },
      isPaused: function() {
        return tq.state === STATE_PAUSED;
      },
      isBlocked: function() {
        return tq.state === STATE_BLOCKED;
      }
    });
    // end state machine methods

    tq.open();
    tq.name = name;
    
    function checkForDisaster(task) {
      if (task.blocking) {
        if (running.length)
          throw "About to run a blocking task {0} alongside other tasks: {1}!".format(task.name, _.pluck(running, name).join(', '));
      }
      else {
        var runningBlockingTask = _.find(tq.running, function(t) { return t.blocking }); 
        if (runningBlockingTask)
          throw "About to run a non-blocking task {0} alongside a blocking task: {1}!".format(task.name, runningBlockingTask.name);
      }
    }
    
    function runTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      checkForDisaster(task);
      if (task.blocking)
        tq.block();

      try {
        if (task.queueTime)
          log('taskQueue', 'Task {0} delayed by {1}ms'.format(task.name, _.now() - task.queueTime));
          
        task.run();
      } catch (err) {
        debugger;
        log('error', 'task crashed: ', task.name);
        task.reject(err);
      }
      
      var promise = task.promise();
      running.push(task);
      promise.always(function() {
        var resolved = promise.state() === 'resolved';
        log(resolved? 'taskQueue' : 'error', 'Task {0}: {1}'.format(resolved ? 'completed' : 'failed', task.name), arguments[0] || '');
        running.splice(running.indexOf(task), 1);
        if (tq.isBlocked())
          tq.open();
        
        next(); 
      });
      
      if (!task.blocking)
        next();
      
      return promise;
    }
    
    function push(task) {
      if (!running.length)
        debugger;
      
      task.queueTime = _.now();
      queue.push(task);
    }
    
    function queueTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      var qLength = queue.length();
      log('taskQueue', 'Checking task:', task.name);
      var blocking = task.blocking;
      if (tq.isBlocked() || tq.isPaused()) {
        log('taskQueue', 'queueing {0}blocking task: {1}'.format(task.blocking ? '' : 'non-' , task.name));
        push(task);
      }      
      else if (task.blocking) {
        if (running.length) {
          tq.pause();
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
      if (tq.isBlocked() || !queue.length())
        return;
      
      var task = queue.peek();
      if (task.blocking) {
        if (!running.length)
          runTask(queue.pop());
      }
      else if (!tq.isPaused())
        runTask(queue.pop());
    }
    
    return {
      debug: function(debug) {
        tq.debug = debug;
      },
      queueTask: queueTask,
      newTask: function() {
        return Task.apply(null, arguments);
      },
      getRunning: function(name) {
        var running = _.compact(_.map(running, function(task) {
          return task.name == name ? task.promise() : null;
        }));
        
        return running.length ? $.whenAll.apply($, running) : null;
      },
      getQueued: function(name) {
        var queued = _.compact(_.map(queue.getRawQueue(), function(task) {
          return task.name == name ? task.promise() : null;
        }));
        
        return queued.length ? $.whenAll.apply($, queued) : null;
      }
    }
  }
  
  function Task(name, taskFn, blocking, priority) {
    if (!(this instanceof Task))
      return new Task(name, taskFn, blocking, priority);
    
    var self = this,
        defer = $.Deferred(),
        promise = defer.promise(), 
        started = false;
        
    this.name = name;
    this.priority = priority || 0;
    this.blocking = blocking || false;
    this.run = function() {
      log('taskQueue', 'Running task:', this.name);
      started = true;
      var otherPromise = taskFn.call(defer, defer);
      if (otherPromise && typeof otherPromise.then == 'function')
        otherPromise.always(defer.resolve);
        
      setTimeout(function() {
        if (defer.state() === 'pending') {
//          debugger;
          log('taskQueue', 'Task timed out: ' + self.name);
          defer.reject();
        }
      }, 4000); // + Math.random() * 5000);
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
  
  return TaskQueue;
});