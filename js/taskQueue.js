//'use strict';
define(['globals'], function(G) {
  var TaskQueue = function(name) {
    if (!(this instanceof TaskQueue))
      return new TaskQueue(name);
    
    var q = this;
    q.name = name;
    this.nonseq = [];
    this.seqQueue = [];
    this.runningTasks = [];
    this.blocked = false;

    var runNonSeq = function(tasks, force) {
      tasks = tasks || q.nonseq;
      var dfd = $.when.apply($, _.map(_.pluck(tasks, "deferred"), function(m) {
        return m.promise();
      })).promise();
      
      _.map(tasks, function(t) {
        q.runTask(t.task, {name: t.name, force: force}).done(function() {
          t.deferred.resolve();
        }).fail(function() {
          t.deferred.reject();
        });                
      });
      
      tasks.length = 0;
      return dfd;
    }
    
    this.hasMoreTasks = function() {
      return q.seqQueue.length > 0;
    }
    
    /**
     * @param sequential - if true, this task will wait till all other running tasks are done, then when it runs, no tasks will be allowed to run till its finished
     * @param yield - if true, when it's time to run this SEQUENTIAL task, if there are non-sequential tasks queued up, it will let them run first  
     */
    this.runTask = function(task, options) {
      var options = options || {},
          sequential = options.sequential,
          force = options.force,
          yields = options.yields,
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
          promise.name = name;
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
          q.seqQueue.push({task: task, name: name, deferred: dfd, yields: yields});
          return dfd.promise();
        }
      }
     
      G.log(q.TAG, 'db', q.name, 'Waiting for non-sequential tasks to finish to run sequential task:', name);
      q.blocked = true;
      var defer = $.Deferred();
      var yieldsFor = [];
      if (yields) {
        yieldsFor = q.nonseq.slice();
        q.nonseq.length = 0;
      }
      
      $.when.apply($, q.runningTasks).done(function() { // not sure if it's kosher to change runningTasks while this is running
//        var redefer = yields ? [runNonSeq(true)] : []; 
        $.when.apply($, yieldsFor.length ? [runNonSeq(yieldsFor, true)] : []).always(function() {  // if non-yielding, then run right away, otherwise force queued up non-sequentials to run first
          G.log(q.TAG, 'db', q.name, 'Running sequential task:', name);
          var taskPromise = task();
          taskPromise.name = name;
          q.runningTasks.push(taskPromise);
          taskPromise.always(function() {
            q.runningTasks.remove(taskPromise);
            G.log(q.TAG, 'db', q.name, 'Finished sequential task:', name);
            q.blocked = false; // unblock to allow next task to start;
            if (q.hasMoreTasks()) {
              var next = q.seqQueue.shift();
              var dfd = next.deferred;
              q.runTask(next.task, {name: next.name, sequential: true, yields: next.yields}).done(dfd.resolve).fail(dfd.reject);
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