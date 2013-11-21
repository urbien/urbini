define('frameWatch', ['underscore'], function() {
  var raf = window.raf,
      caf = window.caf,
      taskCounter = 0,
      listeners = {},
      lastFrameStart,
      lastFrameDuration,
      frameId;
  
  function invoke(listener) {
    if (listener.length == 1)
      return listener[0]();
    else if (listener.length == 2)
      listener[0].call(listener[1]);
    else
      listener[0].apply(listener[1], listener[2]);
  }
  
  function subscribe(fn /*, ctx, args */) {
    var id = taskCounter++;
    listeners[id] = arguments;
    arguments._taskId = id;
    if (frameId === undefined) {
      frameId = raf(publish);
      lastFrameStart = _.now();
    }
    
    return arguments;
  }
  
  function unsubscribe(id) {
    try {
      if (listeners[id]) {
        delete listeners[id];
        return true;
      }
    } finally {
      if (!_.size(listeners) && frameId !== undefined) {
//          caf(frameId);
        frameId = undefined;
      }
    }
  }

  function publish() {
    if (typeof frameId != 'undefined') {
      var now = _.now();
      lastFrameDuration = now - lastFrameStart;
      lastFrameStart = now;
      frameId = raf(publish);
      for (var id in listeners) {
        invoke(listeners[id]);
      }
    }
  }
  
  return {
    _getRawTasks: function() {
      return listeners;
    },
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    lastFrameDuration: function() {
      return lastFrameDuration;
    },
    isRunning: function() {
      return frameId !== undefined;
    },
    getTask: function(id) {
      return listeners[id];
    }
  }
});