define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone' 
], function(G, $, __jqm__, _, Backbone) {
  var Events = _.extend({}, Backbone.Events);
  Events.TAG = 'Events.js';
  Events.defaultTapHandler = function(e) {
    G.log(this.TAG || Events.TAG, 'events', 'tap');
    var event = e.originalEvent;
    var el = event.target;
    var $el = $(el);
    if ($el.prop('tagName') != 'A')
      return true;
    
    event.preventDefault();
    var href = $el.prop('href');
    (G.app && G.app.router || Backbone.history).navigate(href.slice(href.indexOf('#') + 1), true);
  };

  Events.defaultClickHandler = function(e) {
    G.log(this.TAG || Events.TAG, 'events', 'tap');
    var event = e.originalEvent;
    var el = event.target;
    var $el = $(el);
    if ($el.prop('tagName') != 'A')
      return true;
  
    event.preventDefault();
    var href = $el.prop('href');
    (G.app && G.app.router || Backbone.history).navigate(href.slice(href.indexOf('#') + 1), true);
  };
  
  return Events;
});