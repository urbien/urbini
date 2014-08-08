//'use strict';
define('views/CancelButton', [
  'underscore',
  'utils',
  'events',
  'globals',
  'views/BasicView'
], function(_, U, Events, G, BasicView) {
  return BasicView.extend({
    templateName: 'cancelButtonTemplate',
    tagName: 'li',
    className: 'cancelBtn',
    style: {
      'text-align': 'center'
    },
    events: {
      'click': 'cancel'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'cancel');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    cancel: function(e) {
      Events.stopEvent(e);
      this.getPageView().trigger('userCanceled');
      return this;
    },
    render: function(options) {
      this.html(this.template());
      return this;
    }
  }, {
    displayName: 'CancelButton'
  });
});
