define([
  'globals'
], function(G) {
  var Events = _.extend({
    REQUEST_LOGIN: 'req-login',
    LOGOUT: 'logout',
    TAG: 'Events.js',
    stopEvent: function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    defaultClickHandler: function(e) {
      G.log(this.TAG || Events.TAG, 'events', 'click');
//      var event = e.originalEvent;
      var el = e.target;
      var $el = $(el);
      var p = $el;
      var foundLink = false;
      while (!(foundLink = p.prop('tagName') == 'A') && (p = p.parentNode)) {
      }
      
      if (!foundLink)
        return true;
      
      var href = $el.attr('href') || $el.attr('link');
      if (href && href != '#') {
        Events.stopEvent(e);
        var hashIdx = href.indexOf('#');
        var fragment = hashIdx == -1 ? href : href.slice(hashIdx + 1);
        return G.Router.navigate(fragment, true);
      }
      else
        return true;
    }
  
  //  Events.defaultClickHandler = function(e) {
  //    G.log(this.TAG || Events.TAG, 'events', 'click');
  //    return Events.defaultTapHandler.apply(this, arguments);
  //    G.log(this.TAG || Events.TAG, 'events', 'click');
  //    var event = e.originalEvent;
  //    var el = event.target;
  //    var $el = $(el);
  //    if ($el.prop('tagName') != 'A')
  //      return true;
  //  
  //    event.preventDefault();
  //    var href = $el.prop('href');
  //    (G.Router || Backbone.history).navigate(href.slice(href.indexOf('#') + 1), true);
  //  };
  }, Backbone.Events);
  return Events;
});