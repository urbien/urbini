//'use strict';
define('views/SaveButton', [
  'underscore', 
  'utils',
  'events', 
  'globals',
  'views/BasicView' 
], function(_, U, Events, G, BasicView) {
  return BasicView.extend({
    templateName: 'saveButtonTemplate',
    tagName: 'li',
    id: 'save',
    events: {
      'click': 'save'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'save');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    save: function(e) {
      Events.stopEvent(e);
      this.getPageView().trigger('userSaved');
      return this;
    },
    render: function(options) {
      this.html(this.template());      
      return this;
    }
  }, {
    displayName: 'SaveButton'
  });
});