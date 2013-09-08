define('views/MessageBar', [
  'globals',
  'events', 
  'utils',
  'vocManager',
  'views/BasicView'
], function(G, Events, U, Voc, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'checkMessageList');
      this.constructor.__super__.initialize.apply(this, arguments);
      
      options = options || {};
      _.extend(this, options);
      
      
      this.makeTemplate('messageListTemplate', 'messageListTemplate', this.modelType);
//      this.makeTemplate('messageBarTemplate', 'messageTemplate', this.modelType);
    },
    
    events: {
      'click .closeparent': 'checkMessageList'
    },
    
    checkMessageList: function(e) {
      var $messageList = this.$('#messageList');
      var messageList = $messageList[0];
      if (messageList && messageList.children.length <= 1)
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
      
      this.$el.trigger('create');
      _.extend(this, _.pick(options, 'persist'));
      if (!this.persist) {
        var self = this,
            msgLength = _.reduce(_.pluck(messageList, 'message'), function(total, msg) { return total + msg.length * 80 }, 0);
        
        if (msgLength < 3000)
          msgLength = 3000;
        
        setTimeout(function() {
          self.$el.fadeOut(2000, self.destroy);
        }, msgLength);        
      }
      
      return this;
    },

    renderList: function(messages) {
      var self = this;
      
      messages = _.map(messages, function(msg) {
        return _.has(msg, 'id') ? msg : _.extend({id: 'messageBarComponent' + G.nextId()}, msg);
      });
      
      this.$el.html(this.messageListTemplate({
        'class': this.type + 'MessageBar',
        messages: messages
      }));
      
      this.$('.headerMessageBar').each(function() {
        var id = this.id,
            events = _.find(messages, function(msg) { return msg.id == id }).events;
        
        if (events) {
          var $this = $(this),
              onremove = events.remove;
          
          events.remove = function(e) {
            self.trigger('messageBarRemoved', e);
            if (onremove)
              onremove.apply(this, arguments);
          };

          for (var event in events) {
            $this.on(event, events[event]);
          }
        }
      });
    }
//    ,
//    _updateInfoErrorBar: function(options) {
//      options = options || {};
//      var res = options.resource, col = options.collection;
//      if ((res && res !== this.model) || (col && col !== this.model))
//        return;
//
//      var page = options.page;
//      if (page && !this.isPageView(page))
//        return;
//      
////      if (typeof options === 'string') {
////        this.renderError({error: options});
////        return;
////      }
//
//      var error = options.error;
//      if (options.errors) {
//        error = this.errorListTemplate({
//          errors: options.errors
//        });
//      }
//      
//      this.renderError(_.extend({
//        error: error,
//        info: options.info,
//        withIcon: false
//      }, _.omit(options, 'errors')));
//    },    
  }, {
    displayName: 'MessageBar'
  });
});