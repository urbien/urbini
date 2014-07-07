define('views/MessageBar', [
  'globals',
  'events', 
  'utils',
  'vocManager',
  'views/BasicView'
], function(G, Events, U, Voc, BasicView) {
  return BasicView.extend({
    tagName: 'span',
    className: 'messageList',
    initialize: function(options) {
      _.bindAll(this, 'render', 'checkMessageList');
      BasicView.prototype.initialize.apply(this, arguments);
      
      options = options || {};
      _.extend(this, options);
      
      
      this.makeTemplate('messageListTemplate', 'messageListTemplate', this.modelType);
//      this.makeTemplate('messageBarTemplate', 'messageTemplate', this.modelType);
    },
    
    events: {
      'click .closeparent': 'checkMessageList'
    },
    
    checkMessageList: function(e) {
      if (this.el.children.length <= 1)
        this.destroy();
    },
    
    render: function(options) {
      options = options || {};
      var message = options.message,
          messageList = options.messages;

      if (message) {
        message = typeof message === 'object' ? message : {
          message: message
        };
        
        messageList = [message];
      }
      
      if (messageList)
        this.renderList(messageList);
      else {
        this.log('error', 'nothing to render');
        return;
      }
      
//    if (G.isJQM())
//    this.$el.trigger('create');
      
      _.extend(this, _.pick(options, 'persist'));
      if (!this.persist) {
        var self = this,
            msgLength = _.reduce(_.pluck(messageList, 'message'), function(total, msg) { return total + msg.length * 80 }, 0);
        
        if (msgLength < 3000)
          msgLength = 3000;
        
        setTimeout(function() {
          if (self.el)
            self.el.$fadeTo(0, 2000, self.destroy);
        }, msgLength);        
      }
      
      return this;
    },

    renderList: function(messages) {
      var self = this,
          messageBars;
      
      messages = _.map(messages, function(msg) {
        return _.has(msg, 'id') ? msg : _.extend({id: 'messageBarComponent' + G.nextId()}, msg);
      });
      
      this.html(this.messageListTemplate({
        'class': this.type + 'MessageBar',
        messages: messages
      }));
      
      this.$('.headerMessageBar').$forEach(function(bar) {
        var id = bar.id,
            events = _.find(messages, function(msg) { return msg.id == id }).events || {},
            onremove = events.remove;
        
        bar.$onremove(function(e) {
//          window.dispatchEvent(new Event("resize"));
          self.trigger('messageBarRemoved', e);
          if (onremove)
            onremove.apply(this, arguments);
        });
        
        for (var event in events) {
          if (event !== 'remove')
            bar.$on(event, events[event]);
        }
      });
    },
    
    destroy: function() {
      var self = this,
          glued = U.filterObj(this.hashParams, function(p) { return /^\-glued/.test(p) }),
          hash = this.hash;
          
      this.$('.headerMessageBar').$forEach(function(bar) {
        if (!bar)
          return;
        
        var txt = bar.textContent.trim();
        for (var p in glued) {
          bar.$remove();
          if (txt == glued[p])
            hash = U.replaceParam(hash, p, null);
        }
      });
      
      if (hash != this.hash)
        Events.trigger('navigate', hash, {trigger: false, replace: true});
      
      BasicView.prototype.destroy.apply(this, arguments);
    }
  }, {
    displayName: 'MessageBar'
  });
});