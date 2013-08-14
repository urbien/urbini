//'use strict';
define('events', [
  'globals', 
  'underscore',
  'backbone'
], function(G, _, Backbone) {
  var Events = _.extend({
//    REQUEST_LOGIN: 'req-login',
//    LOGOUT: 'logout',
    TAG: 'Events.js',
    stopEvent: function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    getEventName: function(event) {
      switch(event) {
      case 'click':
        return 'click'; // or click?
      default:
        return event;
      }
    }
  }, Backbone.Events);
  
  if (G.DEBUG)
    G.Events = Events;
  
  return Events;
});
