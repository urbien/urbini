chrome.app.runtime.onLaunched.addListener(function() {
  // Do the normal setup steps every time the app starts, listen for events.
  // setupPush();
  chrome.app.window.create('index.html', {
    'bounds': {
      'width': 640,
      'height': 480
    }
  });
});