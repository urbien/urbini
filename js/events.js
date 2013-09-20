//'use strict';
define('events', [
  'underscore',
  'backbone'
], function(_, Backbone) {
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
        return 'click'; // or vclick?
      default:
        return event;
      }
    }
  }, Backbone.Events);

  // <debug>
  if (Lablz.DEBUG)
    Lablz.Events = Events;
  // </debug>
  
  return Events;
});
