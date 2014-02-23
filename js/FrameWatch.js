define('FrameWatch', ['underscore'], function() {
  var raf = window.raf,
      caf = window.caf,
      taskCounter = 0,
      listeners = {},
      numListeners = 0,
      tickListeners = [],
      lastFrameStart,
      lastFrameDuration,
//      frameNumber = 0,
//      lastFrameNumber,
      frameId;
  
  function invoke(listener) {
    if (listener.length == 1)
      return listener[0]();
    else if (listener.length == 2)
      listener[0].call(listener[1]);
    else
      listener[0].apply(listener[1], listener[2]);
  }
  
  function listenToTick(fn) {
    tickListeners.push(fn);
    start();
  };

  function stopListeningToTick(fn) {
    Array.remove(tickListeners, fn);
  };

  function start() {
    if (frameId === undefined) {
      frameId = raf(publish);
      lastFrameStart = _.now();
    }
  }
  
  function subscribe(fn /*, ctx, args */) {
    var id = taskCounter++;
    listeners[id] = arguments;
    numListeners++;
    arguments._taskId = id;
    start();
    
    return arguments;
  }
  
  function unsubscribe(id) {
    if (listeners[id]) {
      delete listeners[id];
      numListeners--;
      return true;
    }
  }

  function publish() {
    if (frameId === undefined)
      return;
    
//    frameNumber++;
    var now = _.now(),
        numTickListeners = tickListeners.length;
    
    lastFrameDuration = now - lastFrameStart;
    lastFrameStart = now;
    for (var i = 0; i < numTickListeners; i++) {
      tickListeners[i](lastFrameDuration);
    }
    
    for (var id in listeners) {
      invoke(listeners[id]);
    }
    
    if (!(numListeners + tickListeners.length)) {
      //      caf(frameId);
      frameId = undefined;
    }
    else {
      // may have gotten canceled during the invocation of the listeners
      frameId = raf(publish);
    }
      
//    lastFrameNumber = frameNumber;
  }
  
  return {
    _getRawTasks: function() {
      return listeners;
    },
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    listenToTick: listenToTick,
    stopListeningToTick: stopListeningToTick,
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