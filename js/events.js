define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone' 
], function(G, $, __jqm__, _, Backbone) {
  var Events = _.extend({
    TAG: 'Events.js',
    stopEvent: function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    defaultClickHandler: function(e) {
      G.log(this.TAG || Events.TAG, 'events', 'click');
      var event = e.originalEvent;
      var el = event.target;
      var $el = $(el);
      var p = $el;
      var foundLink = false;
      while (!(foundLink = p.prop('tagName') == 'A') && (p = p.parentNode)) {
      }
      
      if (!foundLink)
        return true;
      
      event.preventDefault();
      var href = $el.prop('href');
      return G.Router.navigate(href.slice(href.indexOf('#') + 1), true);
    },
  
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