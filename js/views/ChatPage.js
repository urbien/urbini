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
      
      this.autoVideo = options.autoVideo || this.hashParams['-autoVideo'] === 'y';
      this.isWaitingRoom = U.isWaitingRoom();
      this.isPrivate = U.isPrivateChat();
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest,
        rightMenu: true,
        video: this.isPrivate
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
  
//      this.video = params['-video'] !== 'n';
      this.video = this.isPrivate;
      
      var type = this.vocModel ? this.vocModel.type : null;
      this.makeTemplate('chatPageTemplate', 'template', type);
      this.addChild('chatView', new ChatView(_.extend({parentView: this}, _.pick(this, 'autoVideo', 'model'))));
      
      var readyDfd = $.Deferred();
      this.ready = readyDfd.promise();
//      var self = this;
//      if (this.resource) {
//        require(['views/ControlPanel']).done(function(ControlPanel) {
//          self.addChild('backlinks', new ControlPanel({
//            isMainGroup: true,
//            model: self.resource
//          }));
//          
//          readyDfd.resolve();
//        });
//      }
//      else
        readyDfd.resolve();

      this.on('chat:on', this.chatFadeIn, this);
      this.on('chat:off', this.chatFadeOut, this);
      this.on('video:on', this.videoFadeIn, this);
      this.on('newRTCCall', this.videoFadeIn, this);
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
      var args = arguments, self = this;
      this.ready.done(function() {
        self.renderHelper.apply(self, args);
      });
    },
    
    renderHelper: function() {
      this.$el.html(this.template({
        viewId: this.cid
      }));

      this.assign({
        'div#headerDiv' : this.header,
        'div#chatDiv': this.chatView
//        ,
//        'div#inChatBacklinks': this.backlinks 
      });

      var self = this;
      if (this.resource) {
        require(['views/ControlPanel']).done(function(ControlPanel) {
          var $bl = self.$("div#inChatBacklinks");
          self.addChild('backlinks', new ControlPanel({
            isMainGroup: true,
            model: self.resource,
            el: $bl[0]
          }));
          
          self.backlinks.render();
          self.restyle();
//          self.assign('div#inChatBacklinks', self.backlinks);
//          readyDfd.resolve();
          $bl.css('z-index', 100).drags();
        });
      }
//      else

//      if (this.resource)
//        this.loadResourceUI();      

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
    }
  }, {
    displayName: 'ChatPage'
  });
});