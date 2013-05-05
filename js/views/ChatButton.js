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
    initialize: function(options) {
      _.bindAll(this, 'render'); //, 'chat');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType); // fall back to default template if there is none specific to this particular model
      return this;
    },
    render: function(options) {
      var res = this.model;
      var uri = this.resource ? res.getUri() : res.getUrl();
      var hash = this.hash;
      if (/\?/.test(hash))
        hash = hash.slice(0, hash.indexOf('?'));
      
      var chatView = this.router.ChatViews[hash];
      this.$el.html(this.template({
        url: U.makePageUrl('chat', uri),
        unreadMessages: chatView && chatView.getNumUnread()
      }));
      
      return this;
    }
  }, {
    displayName: 'ChatButton'
  });
});