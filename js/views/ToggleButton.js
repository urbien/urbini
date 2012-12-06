define([
  'jquery',
  'underscore',
  'backbone',
  'templates',
  'events',
  'jqueryMobile'
], function($, _, Backbone, Templates, Events) {
  return Backbone.View.extend({
    btnId: null,
    initialize: function(options) {
      _.bindAll(this, 'setStyle', 'resetStyle');
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
      if (!this.btnId) {
        console.log("Toggle button is missing btnId property");
        return this;
      }
      
      this.$('#' + this.btnId)[this.active ? 'addClass' : 'removeClass']('ui-btn-active');
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else
        this.$el.html(this.template());
      
      this.resetStyle();
      return this;
    }
  });
});
