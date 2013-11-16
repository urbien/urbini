//'use strict';
define('events', [
  'globals',
  'underscore',
  'backbone'
], function(G, _, Backbone) {
  var hammerMap = {
    click: 'tap'
  }
  
  var Events = _.extend({
//    REQUEST_LOGIN: 'req-login',
//    LOGOUT: 'logout',
    TAG: 'Events.js',
    stopEvent: function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    getEventName: function(event) {
//      if (!G.browser.touch)
//        return event;
      
      var match = event.match(/^(dbl)?click/),
          newEvent;
      
      if (match) {
        var dbl = match[1] || '';
        newEvent = 'tap' + event.slice(dbl ? 8 : 5);
        return dbl + newEvent;
      }
      
      return event;
//      return hammerMap[event] || event;
    }
  }, Backbone.Events);

  // <debug>
  if (G.DEBUG)
    G.Events = Events;
  // </debug>
  
  return Events;
});
