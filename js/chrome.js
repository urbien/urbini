define('chrome', ['globals', 'underscore', 'events', 'utils', 'collections/ResourceList'], function(G, _, Events, U, ResourceList) {
  
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

  function onMessageFromApp(e) {
    if (e.origin.indexOf('chrome-extension://') != 0)
      return;
    
    U.rpc('log', 'got message', e.data);
    console.debug('message from app:', e);
    G.appWindow = G.appWindow || e.source;
    G.appOrigin = G.appOrigin || e.origin;
    var data = e.data,
        type = data.type,
        args = data.args || [];
    
    delete data.type;
    args.unshift('messageFromApp:' + type);
    Events.trigger.apply(Events, args);
    switch (type) {
      case 'visibility':
        Events.trigger('visible', data.visible);
        break;
      default:
        return;
    }
  };
  
  function onpush(msg) {
    var subchannelId = msg.subchannelId,
        payload = msg.payload,
        id = G.nextId() + '',
        ringtone;
    
    console.log('got push message', JSON.stringify(msg));
    U.vibrate([1000, 500, 1000]);
    ringtone = U.createAudio({
      src: 'ringtone.mp3'
    });
    
    ringtone.play();
    chrome.notifications.create(id, {
      type: 'basic',
      title: "Client Waiting",
      message: "There's a client waiting to be assisted in the lobby",
      iconUrl: 'icon_128.png'
    });
    
    chrome.notifications.onClicked(function(notificationId) {
      console.log('clicked notification, id:', notificationId);
      if (notificationId == id) {
        chrome.notifications.clear(id);
        U.rpc('focus');
        Events.trigger('navigate', G.tabs[0].hash);
        ringtone.remove();
      }
    });
    
    chrome.notifications.onClosed(function(notificationId) {
      console.log('closed notification, id:', notificationId);
      if (notificationId == id) {
        ringtone.remove();
      }
    })
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
      },
      onClicked: function(callback) {
        U.rpc(this._path, createCallbackEvent(callback));        
      },
      onDisplayed: function(callback) {
        U.rpc(this._path, createCallbackEvent(callback));        
      },
      onClosed: function(callback) {
        U.rpc(this._path, createCallbackEvent(callback));        
      }
    },
    _setup: function() {      
      Events.on('messageFromApp:push', onpush);
      var installedApps = G.currentUser.installedApps,
          currentApp = G.currentApp,
          channelId = G.pushChannelId,
          appInstall = G.currentAppInstall,      
          endpointList = new ResourceList(G.currentUser.pushEndpoints, {
            model: U.getModel(G.commonTypes.PushEndpoint),
            query: $.param({
              appInstall: appInstall
            })
          });
      
      if (endpointList.where({endpoint: channelId}).length) {
        console.log('PUSH ENDPOINT ALREADY EXISTS');
        return;
      }
      
      Events.trigger('newPushEndpoint', channelId);
    }
  };
  
  setPaths(chrome);
  window.addEventListener('message', onMessageFromApp);
  return chrome;
});