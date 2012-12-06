define([
  'underscore',
  'backbone',
  'templates',
  'events',
  'views/ToggleButton'
], function(_, Backbone, Templates, Events, ToggleButton) {
  return ToggleButton.extend({
    btnId: 'mapIt',
    template: 'mapItButtonTemplate',
    events: {
      'click #mapIt': 'mapIt'
    },
    initialize: function(options) {
      this.constructor.__super__.initialize.apply(this, arguments);
      
      _.bindAll(this, 'render', 'mapIt');
      this.template = _.template(Templates.get(this.template));
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
