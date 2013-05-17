//'use strict';
define('views/ChatPage', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  'views/ChatView',
  'views/Header'
], function(G, _, U, Events, BasicView, ChatView, Header) {
  var BTN_ACTIVE_CLASS = 'ui-btn-active';
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'toggleChat', 'videoFadeIn', 'videoFadeOut', 'chatFadeIn', 'chatFadeOut'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      _.extend(this, _.pick(options, 'autoVideo', 'private'));
      
      this.hasVideo = this['private'];
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest,
        rightMenu: true,
        video: this.hasVideo
      };

      var res = this.model;
      var headerOptions = {
        viewId: this.cid,
        parentView: this,
        buttons: this.headerButtons,
        model: res
      };
      
      var pageTitle = options.title;
      if (pageTitle)
        headerOptions.pageTitle = pageTitle;
      
      this.addChild('header', new Header(headerOptions));
  
      var params = U.getHashParams();
//      this.video = params['-video'] !== 'n';
      this.video = this.hash.startsWith('chat/_');
      this.autoVideo = params['-autoVideo'] === 'y';
      
      var type = this.vocModel ? this.vocModel.type : null;
      this.makeTemplate('chatPageTemplate', 'template', type);
      this.addChild('chatView', new ChatView(_.extend({parentView: this}, _.pick(this, 'video', 'autoVideo', 'model'))));
      
      this.on('chat:on', this.chatFadeIn, this);
      this.on('chat:off', this.chatFadeOut, this);
      this.on('video:on', this.videoFadeIn, this);
      this.on('video:fadeIn', this.videoFadeIn, this);
      this.on('video:fadeOut', this.videoFadeOut, this);

      var chatPage = this, chatView = this.chatView;
      // forward these methods to ChatView
      _.each(['getParticipants', 'getNumParticipants', 'getNumUnread', 'getRoomName', 'sendMessage', 'getUserId'], function(method) {
        chatPage[method] = function() {
          return chatView[method].apply(chatView, arguments);
        }
      });      
    },
    
    events: {
      'click #videoChat': 'toggleChat',
      'click #textChat': 'toggleChat',
      'click input': 'chatFadeIn'
    },

    toggleChat: function(e) {
      if (_.isUndefined(this._videoSolid))
        this._videoSolid = $('#videoChat').css('opacity') == 1;
      
      if (this._videoSolid)
        this.chatFadeIn();
      else if (this.chatView._videoOn)
        this.videoFadeIn();        
    },
    
    videoFadeIn: function(e) {
//      if (!this.chatView._videoOn)
//        this.trigger('video:on');
        
      this._videoSolid = true;
      if (this._chatSolid)
        this.trigger('chat:off');
      
      this.$('#videoChat').fadeTo(600, 1).css('z-index', 10);
    },

    videoFadeOut: function(e) {
      this._videoSolid = false;
      if (!this._chatSolid)
        this.trigger('chat:on');
      
      this.$('#videoChat').fadeTo(600, 0.2).css('z-index', 0);
    },

    chatFadeIn: function(e) {
      this._chatSolid = true;
      if (this._videoSolid)
        this.trigger('video:fadeOut');
      
      this.$('#textChat').fadeTo(600, 1).css('z-index', 10);
    },

    chatFadeOut: function(e) {
      this._chatSolid = false;
      if (!this._videoSolid && this.chatView._videoOn)
        this.trigger('video:fadeIn');
      
      this.$('#textChat').fadeTo(600, 0.2).css('z-index', 0);
    },
    
    render: function() {
      this.$el.html(this.template({
        viewId: this.cid
      }));

      this.assign({
        'div#headerDiv' : this.header,
        'div#chatDiv': this.chatView
      });
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
    }
  }, {
    displayName: 'ChatPage'
  });
});