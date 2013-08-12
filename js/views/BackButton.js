//'use strict';
define('views/BackButton', [
  'underscore', 
  'utils',
  'events', 
  'views/BasicView' 
], function(_, U, Events, BasicView) {
  return BasicView.extend({
    templateName: 'backButtonTemplate',
    tagName: 'li',
    id: 'back',
    events: {
      'click': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    back: function(e) {
      Events.stopEvent(e);
      Events.trigger('back');
      return this;
    },
    render: function(options) {
      this.$el.html(this.template());      
      return this;
    }
  }, {
    displayName: 'BackButton'
  });
});