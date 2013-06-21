// from: https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-sample-app
// This function gets called in the packaged app model on launch.
var mark = true,
	myWin,
	runtimeId = chrome.runtime.id;

function runApp() {
	// Do the normal setup steps every time the app starts, listen for events.
	// setupPush();
	chrome.app.window.create('index.html', {
		'bounds': {
			'width': 1024,
			'height': 768
		}
	}, function(window) {
	  myWin = window;
	});
	
	chrome.pushMessaging.getChannelId(true, function(message) {
	  channelId = message.channelId;
	  var evt = document.createEvent("Event");
	  evt.initEvent("gotChannelId", true, true); 
	  evt.channelId = channelId;
	  window.dispatchEvent(evt);
    chrome.pushMessaging.onMessage.addListener(onPushMessage);
//    setInterval(function() {
//      onPushMessage({
//        subchannelId: '0',
//        payload: '1'
//      });
//    }, 10000);
	});
}

chrome.app.runtime.onLaunched.addListener(function() {
	runApp();
});

chrome.app.runtime.onRestarted.addListener(function() {
	runApp();
});

function onPushMessage(msg) {
  console.debug('got push msg', msg);
  chrome.runtime.sendMessage(runtimeId, {
    type: 'push',
    args: [msg]
  });
};


// This function gets called in the packaged app model on install.
// Typically on install you will get the channelId, and send it to your
// server which will send Push Messages.
// chrome.runtime.onInstalled.addListener(function() {
	// firstTimePushSetup();
	 // console.log("Push Messaging Sample Client installed!");
// });

// When a Push Message arrives, show it as a text notification (toast)
function showPushMessage(payload, subChannel) {
	var notification = window.webkitNotifications.createNotification(
		'icon.png', 
		'Push Message',
		"Push message for you! " + payload + " [" + subChannel + "]"
	);
	notification.show();
}
