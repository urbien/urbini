define('chrome', ['globals', 'underscore', 'events', 'utils'], function(G, _, Events, U) {
  
  /**
   * @param eventName the event to listen to and upon receiving which to call the "callback" 
   * @param callback the function to call when the event is received
   * @param persistent if true, will allow callback to be called repeatedly 
  **/
  function createCallbackEvent(eventName, callback, context, persistent) {
    if (arguments.length == 1) {
      callback = eventName;
      eventName = null;
    }
    
    eventName = eventName || 'callbackEvent' + G.nextId();
    context = context || callback;
    
    Events[persistent ? 'on' : 'once']('messageFromApp:' + eventName, function() {
      callback.apply(context, arguments);
    });
    
    return eventName;
  };
  
  function setPaths(obj) {
    for (var pkgName in obj) {
      var pkg = obj[pkgName];
      pkg._path = (obj._path ? obj._path + '.' : '') + pkgName;
      switch (typeof pkg) {
        case 'function':
          obj[pkgName] = pkg.bind(pkg);
          break;
        case 'object':
          setPaths(pkg);
          break;
      }
    }
  };
  
  var chrome = {
    notifications: {
      create: function(id, options, callback) {
        var args = arguments;
        if (callback)
          callback = createCallbackEvent(callback);
          
        [].unshift.call(args, this._path);
        U.rpc.apply(this._path, args);
      },
      onButtonClicked: function(callback) {
        U.rpc(this._path, createCallbackEvent(callback));        
      }
    }
  };
  
  setPaths(chrome);
  return chrome;
});