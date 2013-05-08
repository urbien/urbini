//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  'views/ChatView',
  'views/Header'
], function(G, $, _, U, Events, BasicView, ChatView, Header) {
  var BTN_ACTIVE_CLASS = 'ui-btn-active';
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'toggleVideo', 'toggleChat', 'videoFadeIn', 'videoFadeOut', 'chatOn', 'chatOff'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      _.extend(this, _.pick(options, 'autoVideo', 'private'));
      
//      this.readyDfd = $.Deferred();
//      this.ready = this.readyDfd.promise();
//      var req = ['lib/socket.io', 'lib/DataChannel'];
//      if (this.hasVideo)
//        req.push('lib/simplewebrtc');
//      
//      U.require(req).done(function(io, DC, simpleWebRTC) {
//        WebRTC = window.WebRTC || simpleWebRTC;
//        this.readyDfd.resolve();
//      }.bind(this));
      
      this.hasVideo = this['private'];
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest,
        rightMenu: true
//        ,
//        chat: true,
//        video: this.hasVideo
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
      
      this.on('chat:on', this.chatOn, this);
      this.on('chat:off', this.chatOff, this);
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
      'click #toggleVideoBtn': 'toggleVideo',
      'click #toggleChatBtn': 'toggleChat'
    },

    videoFadeIn: function(e) {
      if (!this.chatView._videoOn)
        this.trigger('video:on');
        
      this.$('#toggleVideoBtn').addClass('ui-btn-active');
      this._videoSolid = true;
      if (this._chatSolid)
        this.trigger('chat:off');
      
      this.$('#videoChat').fadeTo(600, 1).css('z-index', 10);
    },

    videoFadeOut: function(e) {
      this.$('#toggleVideoBtn').removeClass('ui-btn-active');
      this._videoSolid = false;
      if (!this._chatSolid)
        this.trigger('chat:on');
      
      this.$('#videoChat').fadeTo(600, 0.2).css('z-index', 0);
    },

    chatOn: function(e) {
      this.$('#toggleChatBtn').addClass('ui-btn-active');
      this._chatSolid = true;
      if (this._videoSolid)
        this.trigger('video:fadeOut');
      
      this.$('#textChat').fadeTo(600, 1).css('z-index', 10);
    },

    chatOff: function(e) {
      this.$('#toggleChatBtn').removeClass('ui-btn-active');
      this._chatSolid = false;
      if (!this._videoSolid && this.chatView._videoOn)
        this.trigger('video:fadeIn');
      
      this.$('#textChat').fadeTo(600, 0.2).css('z-index', 0);
    },
    
    toggleVideo: function(e) {
      Events.stopEvent(e);
      var btn = this.$('#toggleVideoBtn');
      var active = btn.hasClass(BTN_ACTIVE_CLASS);
      this.trigger(active ? 'video:fadeOut' : 'video:fadeIn');
      var method = active ? 'removeClass' : 'addClass';
      btn[method](BTN_ACTIVE_CLASS);
    },

    toggleChat: function(e) {
      Events.stopEvent(e);
      var btn = this.$('#toggleChatBtn');
      var active = btn.hasClass(BTN_ACTIVE_CLASS);
      this.trigger(active ? 'chat:off' : 'chat:on');
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
      
//      this.finish();
//      this.$el.trigger('create');
    }
  }, {
    displayName: 'ChatPage'
  });
});