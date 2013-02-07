define(['globals', 'underscore', 'jquery'], function(G, _, $) {
  var TaskQueue = function(name) {
    if (!(this instanceof TaskQueue))
      return new TaskQueue(name);
    
    var q = this;
    q.name = name;
    this.nonseq = [];
    this.seqQueue = [];
    this.runningTasks = [];
    this.blocked = false;

    var runNonSeq = function(force) {
      var dfd = $.when.apply(null, _.map(_.pluck(q.nonseq, "deferred"), function(m) {
        return m.promise();
      })).promise();
      
      _.map(q.nonseq, function(t) {
        q.runTask(t.task, {name: t.name, force: force}).done(function() {
          t.deferred.resolve();
        }).fail(function() {
          t.deferred.reject();
        });                
      });
      
      q.nonseq.length = 0;
      return dfd;
    }
    
    /**
     * @param sequential - if true, this task will wait till all other running tasks are done, then when it runs, no tasks will be allowed to run till its finished
     * @param yield - if true, when it's time to run this SEQUENTIAL task, if there are non-sequential tasks queued up, it will let them run first  
     */
    this.runTask = function(task, options) {
      var options = options || {},
          sequential = options.sequential,
          force = options.force,
          yield = options.yield,
          name = options.name,
          promise;
      
      if (!sequential) {
        if (q.blocked && !force) {
          G.log(q.TAG, 'db', q.name, 'Waiting for sequential task to finish, queueing non-sequential task:', name);
          var dfd = $.Deferred();
          q.nonseq.push({task: task, name: name, deferred: dfd});
          return dfd.promise();
        }
        else {
          G.log(q.TAG, 'db', q.name, 'Running non-sequential task:', name);
          promise = task();
          q.runningTasks.push(promise);
          promise.always(function() {
            G.log(q.TAG, 'db', q.name, 'Finished non-sequential task:', name);
            q.runningTasks.remove(this);
          }); 
        }
      
        return promise;
      }
      
      // Sequential task - need to wait for all currently running tasks to finish
      // and block any new tasks from starting until this one's done
      if (q.blocked) {
        if (!q.runningTasks.length) {
          G.log(q.TAG, 'db', q.name, 'A sequential finished but failed to report');
          q.blocked = false;
          debugger;
        }
        else {
          G.log(q.TAG, 'db', q.name, 'Waiting for sequential task to finish, queueing sequential task', name);
          var dfd = new $.Deferred();
          q.seqQueue.push({task: task, name: name, deferred: dfd, yield: yield});
          return dfd.promise();
        }
      }
     
      G.log(q.TAG, 'db', q.name, 'Waiting for non-sequential tasks to finish to run sequential task:', name);
      q.blocked = true;
      var defer = $.Deferred();
      $.when.apply(null, q.runningTasks).done(function() { // not sure if it's kosher to change runningTasks while this is running
        var redefer = yield ? [runNonSeq(true)] : []; // if non-yielding, then run right away, otherwise force queued up non-sequentials to run first
        $.when.apply(null, redefer).always(function() {
          G.log(q.TAG, 'db', q.name, 'Running sequential task:', name);
          var taskPromise = task();
          taskPromise.name = name;
          q.runningTasks.push(taskPromise);
          taskPromise.always(function() {
            q.runningTasks.remove(taskPromise);
            G.log(q.TAG, 'db', q.name, 'Finished sequential task:', name);
            var qLength = q.seqQueue.length;
            q.blocked = false; // unblock to allow next task to start;
            if (qLength) {
              var next = q.seqQueue.shift();
              var dfd = next.deferred;
              q.runTask(next.task, {name: next.name, sequential: true, yield: next.yield}).done(dfd.resolve).fail(dfd.reject);
            }
            else {
              if (q.nonseq.length) {
                runNonSeq();
              }
            }
            
            defer.resolve();
          });
        });
      });
      
      return defer.promise();
    }
  }
  
  TaskQueue.prototype.TAG = "TaskQueue";
  return TaskQueue;
});