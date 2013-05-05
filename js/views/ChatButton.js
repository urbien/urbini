//'use strict';
define([
  'underscore', 
  'utils',
  'events', 
  'views/BasicView' 
], function(_, U, Events, BasicView) {
  return BasicView.extend({
    templateName: 'chatButtonTemplate',
    tagName: 'li',
    id: 'chat',
    events: {
      'click': 'chat'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'chat');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType); // fall back to default template if there is none specific to this particular model
      return this;
    },
    chat: function(e) {
      Events.stopEvent(e);
      var res = this.model;
      var uri = this.resource ? res.getUri() : res.getUrl();
      this.router.navigate(U.makeMobileUrl('chat', uri), {trigger: true});
      return this;
    },
    render: function(options) {
      this.$el.html(this.template());
      return this;
    }
  }, {
    displayName: 'ChatButton'
  });
});