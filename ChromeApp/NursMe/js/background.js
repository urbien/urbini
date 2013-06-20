// from: https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-sample-app
// This function gets called in the packaged app model on launch.
var mark = false,
	myWin,
	serverOrigin = mark ? 'http://mark.obval.com' : 'http://urbien.com',
	runtimeId = chrome.runtime.id,
  appHome = serverOrigin + (mark ? '/urbien/app/NursMe' : '/app/NursMe1');

function runApp() {
	// Do the normal setup steps every time the app starts, listen for events.
	// setupPush();
	chrome.app.window.create('index.html', {
		'bounds': {
			'width': 1024,
			'height': 768
		}
	}, function(win) {
		myWin = win.contentWindow;
		myWin.addEventListener('message', function(e) {
			var origin = e.origin,
				data = e.data,
				type = data && data.type;
			
			if (!data || origin !== serverOrigin)
				return;
			
			console.debug("msg", e.data);
			switch (type) {
				default:
					return;
			}
			
		});
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
//    }, 5000);
	});
}

chrome.app.runtime.onLaunched.addListener(function() {
	runApp();
});

chrome.app.runtime.onRestarted.addListener(function() {
	runApp();
});

function onPushMessage(msg) {
  debugger;
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
