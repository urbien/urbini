//'use strict';
define('events', [
  'globals',
  'underscore',
  'backbone'
], function(G, _, Backbone) {
  var rclick = /^(dbl)?click/,
      rtouch = /^touch([a-zA-Z]+)$/;
  
  var Events = _.extend({
//    REQUEST_LOGIN: 'req-login',
//    LOGOUT: 'logout',
    TAG: 'Events.js',
    stopEvent: function(e) {
      if (!e)
        return;
      
      e.preventDefault();
      e.stopImmediatePropagation();
      e._stoppedImmediatePropagation = true;
      e._stoppedPropagation = true;
      if (e.type == 'tap')
        G.disableClick();
    },
    getEventName: function(event) {
//      if (!G.browser.touch)
//        return event;
//      if (event == 'resize')
//        return 'debouncedresize';
//      if (event == 'orientationchange')
//        return 'debouncedorientationchange';
      
      var match = event.match(rclick),
          newEvent;
      
      if (match) {
        var dbl = match[1] || '';
        newEvent = 'tap' + event.slice(dbl ? 8 : 5);
        return dbl + newEvent;
      }
//      else if (!G.browser.touch && (match = event.match(rtouch))) {
//        debugger;
//        return 'mouse' + (match[1] == 'start' ? 'down' : match[1] == 'end' ? 'up' : 'move');
//      }
      
      return event;
    }
  }, Backbone.Events);


  (function(doc) {
    //Set the name of the hidden property and the change event for visibility
    var hidden, visibilityChange; 
    if (typeof doc.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof doc.mozHidden !== "undefined") {
      hidden = "mozHidden";
      visibilityChange = "mozvisibilitychange";
    } else if (typeof doc.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof doc.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    } else {
      return;
    }
  
    doc.addEventListener(visibilityChange, function() {
      Events.trigger('visibility:' + (doc[hidden] ? 'hidden' : 'visible'));
    }, false);
  })(document);

  G.Events = Events;
  return Events;
});
