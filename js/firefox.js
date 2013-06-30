define('firefox', ['globals', 'jquery', 'Events', 'utils', 'cache'], function(G, $, Events, U, C) {
  var gManifestName = "/manifest.webapp";
  function onpush(message) {
    debugger;
    console.log('got push message');
    var endpoints = C.getResourceList(U.getModel(G.commonTypes.PushEndpoint)),
        endpoint = message.endpoint;
    
    if (!endpoints || !endpoints.length) {
      debugger;
      return;
    }
    
    var match = endpoints.where({
      endpoint: endpoint
    }, true);
    
    if (!match) {
      debugger;
      return;
    }
    
    if (/^https?\:/.test(match.channelName))
      window.location.href = match.channelName;
    else
      Events.trigger('navigate', match.channelName);
    
//    firefox.notifications.create('Client Waiting', "There's a client waiting to be assisted in the lobby", 'icon_128.png', {
//      onclick: function() {
//        console.log('push message notification clicked');
//        Events.trigger('navigate', G.tabs[0].hash);
//      },
//      onclose: function() {
//        console.log('push message notification closed');
//      }
//    });
  };
  
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
  
  var firefox = {
    _setup: function() {
      Events.on('messageFromApp:push', onpush);
      var installedApps = G.currentUser.installedApps,
          currentApp = G.currentApp,
          channelId = G.pushChannelId,
          appInstall = G.currentAppInstall,
          channels = G.currentApp.pushChannels,
          endpointList = new ResourceList(G.currentUser.pushEndpoints, {
            model: U.getModel(G.commonTypes.PushEndpoint),
            query: $.param({
              appInstall: appInstall
            })
          });
      
      if (!pushChannels || !pushChannels.length) 
        return;
      
      for (var i = 0; i < pushChannels.length; i++) {
        var channel = pushChannels[i].channel;
        if (endpointList.where({endpoint: channel}).length) {
          console.log('PUSH ENDPOINT ALREADY EXISTS FOR CHANNEL:', channel);
          return;
        }
        else {
          firefox.push.register(function(endpoint) {
            Events.trigger('newPushEndpoint', endpoint, channel);
          }, function() {
            console.log("FAILED TO REGISTER PUSH CHANNEL");
          });
        }
      }

      firefox.setMessageHandler('push', onpush);
      firefox.setMessageHandler('push-register', function(e) {
        debugger;
        if (!G.currentUser.guest)
          firefox._setup();
      });

      Events.trigger('newPushEndpoint', channelId);
    },
    mozNotification: {
      /**
       * example: create('This is the title', 'These are the details', '/icon_128.png', {
       *   onclose: function() {
       *     console.log("notification closed");
       *   },
       *   onclick: function() {
       *     console.log("notification clicked");
       *   }
       * })
       */
      createNotification: function(title, desc, iconURL, callbacks) {
        var args = arguments;
        if (callbacks) {
          for (var cbName in callbacks) {
            callbacks[cbName] = createCallbackEvent(callbacks[cbName]);
          }
        }
          
        [].unshift.call(args, this._path);
        U.rpc.apply(this._path, args);
      }
    },
    push: {
      register: function(success, error) {
        U.rpc.call(this._path, createCallbackEvent(success || function() {}), createCallbackEvent(error || function() {}));
      },
      unregister: function(endpoint) {
        U.rpc.call(this._path, endpoint, createCallbackEvent(success || function() {}), createCallbackEvent(error || function() {}));
      },
      registrations: function() {
        U.rpc.call(this._path, createCallbackEvent(success || function() {}), createCallbackEvent(error || function() {}));        
      }
    },
    setMessageHandler: function(messageType, callback) {
      U.rpc.call(this._path, messageType, createCallbackEvent(callback));      
    }
  };
  
  
  setPaths(firefox);
  
  // TESTING //
//  console.log("creating notification");
//  firefox.mozNotification.createNotification("Hello Mark", "This is for your eyes only", "icon_128.png", {
//    onclose: function() {
//      console.log("closed notification");
//    },
//    onclick: function() {
//      console.log("clicked notification");
//    }
//  });
  // END TESTING //
  return firefox;
});
