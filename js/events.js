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
      if (!e)
        return;
      
      e.preventDefault();
      e.stopImmediatePropagation();
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
      
      var match = event.match(/^(dbl)?click/),
          newEvent;
      
      if (match) {
        var dbl = match[1] || '';
        newEvent = 'tap' + event.slice(dbl ? 8 : 5);
        return dbl + newEvent;
      }
      
      return event;
    }
  }, Backbone.Events);

  G.Events = Events;
  return Events;
});
