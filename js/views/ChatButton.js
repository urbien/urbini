//'use strict';
define('views/ChatButton', [
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
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    refresh: function() {
      if (!this.isChat) { // we're on another page that links to this chat, we want to know how many messages we missed
        var hash = this.hash;
        if (/\?/.test(hash))
          hash = hash.slice(0, hash.indexOf('?'));

        var chatView = this.router.ChatViews[hash];
        var unread = chatView && chatView.getNumUnread();
        var $menuBadge = this.$('.menuBadge');
        $menuBadge.html(unread || '');
        $menuBadge[unread ? 'show' : 'hide']();
      }
    },
    render: function(options) {      
      var res = this.model;
      this.isChat = this.hash.startsWith('#chat/');
      var uri, url;
      if (!this.isChat) {
        uri = this.resource ? res.getUri() : res.getUrl();
        url = U.makePageUrl('chat', uri);
      }
      
      this.$el.html(this.template({
        url: url
      }));
      
      this.finish();
      if (this.isChat) {
        var chatPage = this.pageView;
        this.$el.on('click', function(e) {
          Events.stopEvent(e);
          chatPage.trigger('chat:on');
        });
        
        this.$('.menuBadge').hide();
      }
      else
        this.refresh();
      
      return this;
    }
  }, {
    displayName: 'ChatButton'
  });
});