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
      this.makeTemplate('messageBarTemplate', 'messageTemplate', this.modelType);
    },
    
    events: {
      'vclick .closeparent': 'checkMessageList'
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
        messageList = [{
          message: message
        }]
      }
      
      if (messageList)
        this.renderList(messageList);
      else {
        this.log('error', 'nothing to render');
        return;
      }
      
//      var persistByDefault = !!(this.hashParams['-info'] || this.hashParams['-errMsg']);
//      if (options.persist === false || (_.isUndefined(options.persist) && !persistByDefault)) {
//        setTimeout(function() {        
//          $(errDiv).fadeOut(2000, function() {
//            errDiv.html("");
//          });
//        }, length * 80);
//      }
      
      this.$el.trigger('create');
//      errDiv.show();
      
      _.extend(this, _.pick(options, 'persist'));
      if (!this.persist) {
        var self = this,
            msgLength = _.reduce(message ? [message] : _.pluck(messageList, 'message'), function(total, msg) { return total + msg.length * 80 }, 0);
        
        setTimeout(function() {
          self.$el.fadeOut(2000, self.destroy);
        }, msgLength);        
      }
      
      return this;
    },

    renderOne: function(message) {
      this.$el.html(this.messageTemplate({
        'class': this.type + 'MessageBar',
        message: message
      }));
      
    },
    
    renderList: function(messages) {
      this.$el.html(this.messageListTemplate({
        'class': this.type + 'MessageBar',
        messages: messages
      }));
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