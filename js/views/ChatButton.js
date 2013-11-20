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
      ToggleButton.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      return this;
    },
    refresh: function() {
      if (!this.isChat) { // we're on another page that links to this chat, we want to know how many messages we missed
        var hash = this.hash;
        if (/\?/.test(hash))
          hash = hash.slice(0, hash.indexOf('?'));

        var self = this;
        // HACK
        var cachedChatView = _.compact(_.map(['Private', 'Public', 'Lobby'], function(type) {
          var cache = self.router[type + 'ChatViews'];
          return cache && cache[hash]; 
        }))[0];
        
        var unread = cachedChatView && cachedChatView.getNumUnread();
        this.menuBadge = this.$('.menuBadge')[0];
        this.menuBadge.innerHTML = unread || '';
        this.menuBadge[unread ? '$show' : '$hide']();
      }
    },
    
    events: {
      'click': 'click'
    },
    
    click: function(e) {
      if (this.isChat) {
        Events.stopEvent(e);
        this.pageView.trigger('chat:on');
      }
    },
    
    render: function(options) {      
      var res = this.model;
      this.isChat = U.isChatPage();
      var uri, url;
      if (!this.isChat) {
        uri = this.resource ? res.getUri() : res.getUrl();
        url = U.makePageUrl('chat', uri);
      }
      
      this.html(this.template({
        url: url
      }));
      
      this.finish();
      if (this.isChat)
        this.$menuBadge.$hide();
      else
        this.refresh();
      
      return this;
    }
  }, {
    displayName: 'ChatButton'
  });
});