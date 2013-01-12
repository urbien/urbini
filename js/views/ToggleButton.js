define([
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events',
  'cache!views/BasicView'
], function($, __jqm__, _, Backbone, Templates, Events, BasicView) {
  return BasicView.extend({
    btnId: null,
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
