// from: https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-sample-app
// This function gets called in the packaged app model on launch.
var myWin,
	appName = 'NurseMe',
	serverOrigin = 'http://urbien.com',
	webviewOrigin = serverOrigin + "/*";

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
}

chrome.app.runtime.onLaunched.addListener(function() {
	runApp();
});

chrome.app.runtime.onRestarted.addListener(function() {
	runApp();
});

// chrome.runtime.onConnect.addListener(function(p) {
// port = p;
// console.log(port);
// port.onMessage.addListener(function(msg) {
// debugger;
// console.log("msg", msg);
// });
// });

// function postMessage(msg) {
// debugger;
// port && port.postMessage(msg);
// }

// window.addEventListener('message', function(e) {
// debugger;
// console.log("received message", e);
// });

// This function gets called in the packaged app model on install.
// Typically on install you will get the channelId, and send it to your
// server which will send Push Messages.
// chrome.runtime.onInstalled.addListener(function() {
	// firstTimePushSetup();
	 // console.log("Push Messaging Sample Client installed!");
// });

// This function gets called in the packaged app model on shutdown.
// You can override it if you wish to do clean up at shutdown time.
chrome.runtime.onSuspend.addListener(function() {
	console.log("Shutting down", appName);
});

// This should only be called once on the instance of chrome where the app
// is first installed for this user.  It need not be called every time the
// Push Messaging Client App starts.
// function firstTimePushSetup() {
	// Start fetching the channel ID (it will arrive in the callback).
	// chrome.pushMessaging.getChannelId(true, channelIdCallback);
// }

// Register for push messages.
// This should be called every time the Push Messaging App starts up.
// function setupPush() {

	// Begin listening for Push Messages.
	// chrome.pushMessaging.onMessage.addListener(messageCallback);
	// console.log('called addListener');

	// We can ensure that adding the listener took effect as intended.
	// var listeners = chrome.pushMessaging.onMessage.hasListeners();
	// console.log('hasListeners returned ' + listeners + ' after calling addListener');
// }

// Unregister for Push Messages (only call if you have previously
// called setupPush).
// function takedownPush() {
	// chrome.pushMessaging.onMessage.removeListener(messageCallback);
	// console.log('called removeListener');
// }

// This callback recieves the Push Message from the push server.
// function messageCallback(message) {
	// console.log("push messaging callback seen");
	// console.log("payload is "                 + message.payload);
	// console.log("subChannel is "              + message.subchannelId);
	// showPushMessage(message.payload, message.subchannelId.toString());
// }

// When the channel ID callback is available, this callback recieves it.
// The push client app should communicate this to the push server app as
// the 'address' of this user and this app (on all instances of Chrome).
// function channelIdCallback(message) {
	// debugger;
	// myWin.postMessage({
		// type: 'channelId',
		// channelId: message.channelId
	// }, webviewOrigin);
// }

// When a Push Message arrives, show it as a text notification (toast)
function showPushMessage(payload, subChannel) {
	var notification = window.webkitNotifications.createNotification(
		'icon.png', 
		'Push Message',
		"Push message for you! " + payload + " [" + subChannel + "]"
	);
	notification.show();
}
