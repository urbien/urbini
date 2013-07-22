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
          return a.blocking ? -1 : a.priority - b.priority;
        });
      },
      
      /**
       * @return Task object
       */
      pop: function() {
        return queue.splice(0, 1)[0];
      },
      
      length: function() {
        return queue.length;
      },
      
      getRawQueue: function() {
        return queue;
      }
    }
  };
  
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("taskQueue");
    G.log.apply(G, args);
  };
  
  function TaskQueue(name) {
    if (!(this instanceof TaskQueue))
      return new TaskQueue(name);
    
    window.taskQueue = this;
    
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
    };
    
    function runTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      log('Running task:', task.name);
//      task.notify();
      checkForDisaster(task);
      if (task.blocking)
        tq.block();

      var promise = task.run();
      running.push(task);
      promise.always(function() {
        log('Task completed:', task.name);
        running.splice(running.indexOf(task), 1);
        if (tq.isBlocked())
          tq.open();
        
        next(); 
      });
      
      if (!task.blocking)
        next();
      
      return promise;
    };
    
    function queueTask(task) {
      if (!(task instanceof Task))
        task = Task.apply(null, arguments);
      
      var qLength = queue.length();
      log('Checking task:', task.name);
      var blocking = task.blocking;
      if (tq.isBlocked() || tq.isPaused()) {
        log('queueing {0}blocking task: {1}'.format(task.blocking ? '' : 'non-' , task.name));
        queue.push(task);
        return task.promise();
      }
      
      if (task.blocking)
        tq.pause();
      
      runTask(task);
      return task.promise();
    };
    
    function next() {
      if (tq.isBlocked())
        return;
      
      if (queue.length())
        runTask(queue.pop());
    };
    
    function log() {
      if (!tq.debug)
        return;
      
      var args = [].slice.call(arguments);
      args.unshift("taskQueue");
      G.log.apply(G, args);
    };
    
    return {
      log: log,      
      debug: function(debug) {
        tq.debug = debug;
      },
      queueTask: queueTask,
      hasTask: function(name) {
        return _.any(this.queue.concat(this.running), function(t) { return t.name == name });
      },
      newTask: function() {
        return Task.apply(null, arguments);
      }
    }
  };
  
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
      log('running task:', this.name);
      started = true;
      taskFn.call(defer, defer);
      setTimeout(function() {
        if (defer.state() === 'pending') {
          debugger;
          log('Task timed out: ' + self.name);
          defer.reject();
        }
      }, 10000);
      
      return promise;
    };
    
    // allow task consumers to treat the task as a promise
    for (var fn in promise) {
      if (typeof promise[fn] == 'function') {
        this[fn] = promise[fn].bind(promise);
      }
    }
    
    this.isFinished = function() {
      return started && promise.state() == 'resolved';
    };
  };
  
  function test() {
    
  };
  
  return TaskQueue;
});