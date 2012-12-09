define([
  'cache!jquery',
  'cache!underscore',
  'cache!backbone'
], function($, _, Backbone) {
  var Events = _.extend({}, Backbone.Events);
  Events.defaultTapHandler = function(e) {
  //  console.log("got tap event");
    var event = e.originalEvent;
    var el = event.target;
    var $el = $(el);
    if ($el.prop('tagName') != 'A')
      return true;
    
    event.preventDefault();
    var href = $el.prop('href');
    Backbone.history.navigate(href.slice(href.indexOf('#') + 1), true);
  };

  Events.defaultClickHandler = function(e) {
  //  console.log("got click event");
    var event = e.originalEvent;
    var el = event.target;
    var $el = $(el);
    if ($el.prop('tagName') != 'A')
      return true;
  
    event.preventDefault();
    var href = $el.prop('href');
    Backbone.history.navigate(href.slice(href.indexOf('#') + 1), true);
  };
  
  return Events;
});