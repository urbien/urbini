//'use strict';
define([
  'events', 
  'views/ToggleButton', 
  'views/BasicView' 
], function(Events, ToggleButton, BasicView) {
  return ToggleButton.extend({
    TAG: 'MapItButton',
    template: 'mapItButtonTemplate',
    tagName: 'li',
    id: 'mapIt',
    events: {
      'click': 'mapIt'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'mapIt');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      return this;
    },
    mapIt: function(e) {
      this.active = !this.active;
      Events.trigger('mapIt', {active: this.active});
      this.resetStyle();
      return this;
    }
  });
});
