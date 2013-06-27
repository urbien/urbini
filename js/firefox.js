define('firefox', ['globals', 'jquery', 'Events', 'utils'], function(G, $, Events, U) {
  var gManifestName = "/manifest.webapp",
      registrations = [];

  function initPush() {
    debugger;
    if (!navigator.push)
      return;
    
    U.domReq(navigator.registrations()).done(function(regs) {
      registrations = regs;
      if (regs && regs.indexOf('default')) {
        attachPush();
        return;
      }
      
      U.domReq(navigator.register()).done(function(endpoint) {
        Events.trigger('newPushEndpoint', endpoint);
        attachPush();
      });
    }).fail(function(err) {
      debugger;
    });
    
    Events.on('logout', function() {
      debugger;
      for (var i = 0; i < registrations.length; i++) {
        navigator.push.unregister(registrations[i]);
      }
    });
    
    navigator.mozSetMessageHandler('push-register', function(e) {
      debugger;
      if (!G.currentUser.guest)
        initPush();
    });
  };
  
  function attachPush() {
    navigator.mozSetMessageHandler('push', onpush);
  };
  
  function onpush() {
    console.log('got push message');
    firefox.notifications.create('Client Waiting', "There's a client waiting to be assisted in the lobby", 'icon_128.png', {
      onclick: function() {
        console.log('push message notification clicked');
        Events.trigger('navigate', G.tabs[0].hash);
      },
      onclose: function() {
        console.log('push message notification closed');
      }
    });
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
      U.domReq(navigator.mozApps.getSelf()).done(function(result) {
        debugger;
        if (result) {
          // we're installed
          console.log('already installed');
          initPush();
        } else {
          // not installed
          U.domReq(navigator.mozApps.install(gManifestName)).done(function() {
            console.log("app installed successfully");
            initPush();
          }).fail(function(errObj) {
            console.log("Couldn't install app (" + errObj.code + ") " + errObj.message);
          });
        }
      }).fail(function(err) {
        console('Error checking installation status: ' + err.message);
      });
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
    }
  };
  
  setPaths(firefox);
  
  // TESTING //
  console.log("creating notification");
  firefox.mozNotification.createNotification("Hello Mark", "This is for your eyes only", "icon_128.png", {
    onclose: function() {
      console.log("closed notification");
    },
    onclick: function() {
      console.log("clicked notification");
    }
  });
  // END TESTING //
  return firefox;
});
