//'use strict';
define('views/BackButton', [
  'underscore', 
  'utils',
  'events', 
  'globals',
  'views/BasicView' 
], function(_, U, Events, G, BasicView) {
  return BasicView.extend({
    templateName: 'backButtonTemplate',
    tagName: 'li',
    id: 'back',
    events: {
      'click': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    back: function(e) {
      Events.stopEvent(e);
      Events.trigger('back', 'Back button in header pressed');
      return this;
    },
    render: function(options) {
      this.html(this.template());      
      return this;
    }
  }, {
    displayName: 'BackButton'
  });
});