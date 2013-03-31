//'use strict';
define([
  'jquery', 
  'underscore', 
  'events',
  'views/BasicView'
], function($, _, Events, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'setStyle', 'resetStyle', 'isActive');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.active = (options && options.active) || (this.isActive && this.isActive());
      Events.on("changePage", this.resetStyle);
    },
    isActive: function() {
      return this.active;
    },
    resetStyle: function() {
      this.active = this.isActive();
      this.setStyle();
      return this;
    },
    setStyle: function() {
      if (!this.id) {
        console.log("Toggle button is missing 'id' property");
        return this;
      }
      
      this.$el.parent().find('#' + this.id)[this.active ? 'addClass' : 'removeClass']('ui-btn-active');
    },
    render: function(options) {
      if (!this.template)
        return this;
      
//      var html = this.template();
//      this.setElement($(html));
      this.$el.html(this.template());
      this.resetStyle();
      return this;
    }
  });
});
