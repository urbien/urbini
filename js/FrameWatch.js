define('FrameWatch', ['underscore'], function() {
  var raf = window.raf,
      caf = window.caf,
      taskCounter = 0,
//      listeners = {},
//      numListeners = 0,
      tickListeners = [],
      lastFrameStart,
      lastFrameDuration,
//      frameNumber = 0,
//      lastFrameNumber,
      frameNum,
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
    var idx = tickListeners.indexOf(fn);
    if (~idx) {
      Array.removeFromTo(tickListeners, idx, idx + 1);
      return true;
    }
    
    return false;
  };

  function hasTickListener(fn) {
    return tickListeners.indexOf(fn) != -1;
  };

  function start() {
    if (frameId === undefined) {
      frameId = raf(publish);
      lastFrameStart = _.now();
    }
  }
  
//  function subscribe(fn /*, ctx, args, taskId */) {
//    var id = arguments[3] || taskCounter++;
//    listeners[id] = arguments;
//    numListeners++;
//    arguments._taskId = id;
//    start();
//    
//    return arguments;
//  }
//  
//  function unsubscribe(id) {
//    if (listeners[id]) {
//      delete listeners[id];
//      numListeners--;
//      return true;
//    }
//  }

  function publish() {
    if (frameId === undefined)
      return;
    
    var now = _.now(),
        id,
        i = tickListeners.length;
//        ,
//        listenerIds = Object.keys(listeners),
//        numListeners = listenerIds.length;

    if (isNaN(frameNum))
      frameNum = 0;
    else
      frameNum++;
    
    lastFrameDuration = now - lastFrameStart;
    lastFrameStart = now;
    while (i--) {
      tickListeners[i](lastFrameDuration);
    }
//    for (i = 0, numTickListeners = tickListeners.length; i < numTickListeners; i++, numTickListeners = tickListeners.length) {
//      tickListeners[i](lastFrameDuration);
//    }
    
//    for (i = 0; i < numListeners; i++) {
//      invoke(listeners[listenerIds[i]]);  
//    }
//    
//    for (id in listeners) {
//      invoke(listeners[id]);
//    }
    
//    if (!(numListeners + tickListeners.length)) {
    if (!tickListeners.length) {
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
//    _getRawTasks: function() {
//      return listeners;
//    },
//    subscribe: subscribe,
//    unsubscribe: unsubscribe,
    listenToTick: listenToTick,
    stopListeningToTick: stopListeningToTick,
    hasTickListener: hasTickListener,
    getFrameNumber: function() {
      return frameNum;
    },
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