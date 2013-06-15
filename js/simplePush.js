define('simplePush', [
  'globals',
  'underscore',
  'utils'
], function(G, _, U) {
  var SimplePush = {}, 
      browser = G.browser;
  
  if (browser.mozilla) {
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
      }
//      ,
//      
//      getMessageEndpoint: function(message) {
//        return message.subchannelId; 
//      }
    });    
  }

  return SimplePush;
});