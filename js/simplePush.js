define('simplePush', [
  'globals',
  'underscore',
  'utils'
], function(G, _, U) {
  var SimplePush = {}, 
      spType = G.commonTypes.SimplePushAppEndpoint,
      endpointType = G.commonTypes.PushEndpoint,
      browser = G.browser;
  
  // FOR TESTING //
  if (true) {
    var channel = U.randomString();
    _.extend(SimplePush, {
      register: function() {
        return $.Deferred(function(defer) {
          defer.resolve(channel);
        }).promise();
      },
      unregister: function() {
        return $.Deferred(function(defer) {
          defer.resolve();
        }).promise();      
      },
      registrations: function() {
        return $.Deferred(function(defer) {
          defer.resolve([channel]);
        }).promise();        
      }
    });
  
    return SimplePush;
  }
  
  if (browser.mozilla) {
    if (!_.has(navigator, 'push'))
      return null;
    
    _.each(['register', 'unregister', 'registrations'], function(method) {
      SimplePush[method] = function() {
        var args = arguments;
        return $.Deferred(function(defer) {
          var req = navigator.push[method];
          req.onsuccess = function(e) {
            defer.resolve(e.target.result);
          };
          
          req.onerror = function() {
            defer.reject.apply(defer, arguments);
          };
        }).promise();
      }
    });
    
    _.extend(SimplePush, {
      onMessage: function(callback) {
        navigator.mozSetMessageHandler('push', callback);
      }
//    ,
//      getMessageEndpoint: function(message) {
//        return message.pushEndpoint; 
//      }
    });
  }
  else {
    if (!_.has(window, 'chrome') || !_.has(window.chrome, 'pushMessaging'))
      return null;
    
    _.extend(SimplePush, {      
      register: function() {
        return $.Deferred(function(defer) {
          chrome.pushMessaging.getChannelId(
            false, // don't force login
            defer.resolve // will resolve with channelId
          );
        }).promise();
      },
      
      registrations: function() {
        var regPromise = SimplePush.register(),
            dfd = $.Deferred();
        
        regPromise.done(function(channelId) {
          dfd.resolve([channelId]);
        }).fail(dfd.reject);
      },
      
      /**
       * will call callback with message (http://developer.chrome.com/dev/extensions/pushMessaging.html#event-onMessage):
       * {
       *   subchannelId: (integer),
       *   payload: ( string )
       * }
       */
      onMessage: function(callback) {
        chrome.pushMessaging.onMessage.addListener(callback);
      },
      
      unregister: function() {}
//      ,
//      
//      getMessageEndpoint: function(message) {
//        return message.subchannelId; 
//      }
    });    
  }

  return SimplePush;
});