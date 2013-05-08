//'use strict';
define([
  'underscore', 
  'utils',
  'events', 
  'views/ToggleButton' 
], function(_, U, Events, ToggleButton) {
  return ToggleButton.extend({
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
      var hash = this.hash;
      if (/\?/.test(hash))
        hash = hash.slice(0, hash.indexOf('?'));
      
      this.isChat = this.hash.startsWith('chat/');
      var unread, uri, url;
      if (!this.isChat) {
        chatView = this.router.ChatViews[hash];
        unread = chatView && chatView.getNumUnread();
        uri = this.resource ? res.getUri() : res.getUrl();
        url = U.makePageUrl('chat', uri);
      }
      
      this.$el.html(this.template({
        url: url,
        unreadMessages: unread
      }));
      
      if (this.isChat) {
        var chatPage = this.pageView;
        this.$el.on('click', function(e) {
          Events.stopEvent(e);
          chatPage.trigger('toggleTextChat');
        });
      }
      
      return this;
    }
  }, {
    displayName: 'ChatButton'
  });
});