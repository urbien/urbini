// add onload functions only if inside iframe
if (window.parent != window) {
  function onLoadPopup() {
    parent.frameLoaded[window.name] = true;
  }
  addEvent(window, 'load', function() {setTimeout(onLoadPopup, 0);}, false);
}
