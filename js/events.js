//'use strict';
define('events', [
  'underscore',
  'backbone'
], function(_, Backbone) {
  var hammerMap = {
    click: 'tap',
    dblclick: 'doubletap',
    mousedown: 'touch',
    mouseup: 'release',
    touchstart: 'touch',
    touchmove: 'drag',
    touchend: 'release'
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
      return hammerMap[event] || event;
    }
  }, Backbone.Events);

  // <debug>
  if (Lablz.DEBUG)
    Lablz.Events = Events;
  // </debug>
  
  return Events;
});
