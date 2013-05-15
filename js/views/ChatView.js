//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  // fluid width video http://css-tricks.com/NetMag/FluidWidthVideo/demo.php
  var serverName = G.serverName;
  if (/^http\:\/\/.+\//.test(serverName))
    serverName = serverName.slice(0, serverName.indexOf('/', 7));
  
  var SIGNALING_SERVER = serverName + ':8889';
  function getGuestName() {
    return 'Guest' + Math.round(Math.random() * 1000);
  }
  
  function toDoubleDigit(digit) {
    return digit = digit < 10 ? '0' + digit : digit;
  }

  function getTimeString(date) {
    date = new Date(date);
    var hours = date.getHours();
    var ampm = hours < 12 ? 'AM' : 'PM';
    hours = hours % 12;
    return '{0}:{1}'.format(toDoubleDigit(hours), toDoubleDigit(date.getMinutes()) + ampm);
  }
  
//  function getTime() {
//    var now = new Date();
//    var hours = now.getHours();
//    var ampm = hours < 12 ? 'AM' : 'PM';
//    hours = hours % 12;
//    return '{0}:{1}'.format(toDoubleDigit(hours), toDoubleDigit(now.getMinutes()) + ampm);
//  }
  
  var WebRTC;  
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'restyleVideoDiv', 'onAppendedLocalVideo', 'onAppendedRemoteVideo'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.autoVideo = options.autoVideo;
      this.hasVideo = this.autoVideo || options.video;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];      
      U.require(req).done(this.readyDfd.resolve);
      
      this.makeTemplate('chatViewTemplate', 'template', this.modelType);
      this.makeTemplate('chatMessageTemplate', 'messageTemplate', this.modelType);
      
      this.roomName = this.getRoomName();
      this.unreadMessages = 0;
      this.participants = [];
      this.userIdToInfo = {};      
      var me = G.currentUser;
      if (me) {
        this.myName = me.davDisplayName || getGuestName();
        this.myIcon = me.thumb || 'icons/male_thumb.jpg';
        this.myUri = me._uri;
      }
      else {
        this.myName = getGuestName();
      }

      this.myId = Math.round(Math.random() * +new Date());
      this.myInfo = {
        name: this.myName,
        icon: this.myIcon,
        uri: this.myUri,
        _userid: this.myId
      }

      var chatView = this;
      this.pageView.on('video:off', this.endChat, this);
      this.pageView.on('video:on', this.startChat, this);
      this.pageView.once('chat:on', this.startChat, this);

      this.makeTemplate('genericDialogTemplate', 'videoDialog', this.modelType);
      this.on('active', function(active) {
        if (active) {
          this.unreadMessages = 0;
          if (this.rendered) {
//            this.chat.openNewSession = function() {};
            window.location.reload();
//            this.restartChat();
          }
        }
        else
          this.endChat();
      }.bind(this));

      this.autoFinish = false;
    },
    
    events : {
      'orientationchange': 'restyleVideoDiv',
      'resize': 'restyleVideoDiv',
      'click #chatSendButton': '_sendMessage',
      'click #endChat': 'endChat'
    },

    getNumParticipants: function() {
      return this.participants.length;
    },

    getUserId: function() {
      return this.myInfo._userid;
    },
    
    getParticipants: function() {
      return _.clone(this.userIdToInfo);
    },
    
    getNumUnread: function() {
      return this.unreadMessages;
    },
    
    getRoomName: function() {
      var name;
      if (this.resource) {
        var shortUri = U.getShortUri(this.resource.getUri(), this.vocModel);
        if (shortUri.startsWith(G.sqlUrl))
          shortUri = shortUri.slice(G.sqlUrl.length);
        
        name = shortUri;
      }
      else {
        name = this.hash.slice(5);
        name = decodeURIComponent(/\?/.test(name) ? name.slice(0, name.indexOf('?')) : name);
      }
      
      return name.replace(/[^a-zA-Z0-9]/ig, '');
    },
    
    render: function() {
      this.$el.html(this.template({
        video: this.hasVideo
      }));

      this.$el.trigger('create');
      this.$('div#localVideo').hide();
//      this.$('#toggleVideoBtn').checkboxradio().checkboxradio('disable');

      if (!this.rendered) {
        this.pageView.trigger('chat:on');
        if (this.autoVideo)
          this.pageView.trigger('video:on');
      }
        
      this.ready.done(function() {        
        this.finish();
      }.bind(this));
    },
    
//    switchToChat: function(e) {
//      this.pageView.trigger('video:fadeOut');
//    },
    
    enableChat: function() {
      this.$('#chatSendButton').button('enable');
      var $input = this.$('#chatMessageInput');
      $input.removeClass('ui-disabled');
      $input[0].value = '';
      this.disabled = false;
    },
    
    disableChat: function() {
      this.$('#chatSendButton').button().button('disable');
      var $input = this.$('#chatMessageInput');
      $input.addClass('ui-disabled');
      $input[0].value = 'Chat room is empty...';
      this.$remoteVids && this.$remoteVids.empty();
      this.disabled = true;
    },
    
    isDisabled: function() {
      return this.disabled;
    },

    removeParticipant: function(userid) {
      var whoLeft = this.getUserInfo(userid);
      if (whoLeft.media) {
        this.$('video[src="{0}"]'.format(whoLeft.blobURL)).remove().each(function() {
          this.pause();
          $(this).remove();
        });
      }
      
//      // HACK: need to figure out why sometimes videos don't get removed
//      this.$('#remoteVideos video').each(function() {
//        if (this.videoWidth < 10)
//          $(this).remove();
//      });
//      // END HACK
      
      delete this.userIdToInfo[userid];
      if (!_.size(this.userIdToInfo))
        this.disableChat();
    
      this._updateParticipants();
      this.pageView.trigger('chat:participantLeft', userid);
    },

    addParticipant: function(userInfo) {
      var userid = userInfo._userid;
      var isUpdate = !!this.getUserInfo(userid);
      this.userIdToInfo[userid] = userInfo;
      this._updateParticipants();
      if (!isUpdate && userInfo.justEntered) {
        this.addMessage({
          message: '<i>{0} has entered the room</i>'.format(userInfo.name),
          time: +new Date(), //getTime(),
          senderIcon: userInfo.icon,
          info: true,
          sender: userInfo.name
        });
      }
      
      this.pageView.trigger('chat:newParticipant', userInfo);
    },
    
    _updateParticipants: function() {
      this.participants = _.keys(this.userIdToInfo);
    },
    
//    _checkChannels: function() {
//      if (_.filter(this.chat.channels, function(c) {return c.readyState === 'closed'}).length) {
//        debugger;
//      }
//    },
    
    sendUserInfo: function(options) {
      this.chat.send({
        userInfo: _.extend(_.pick(this.myInfo, ['_userid', 'name', 'icon', 'uri']), options || {})
      });
    },

//    requestInfo: function(userid) {
//      var channel = this.chat.channels[userid];
//      if (channel) {
//        channel.send({
//          request: {
//            info: true
//          }
//        });
//      }
//    },

    getUserInfo: function(userid) {
      return this.userIdToInfo[userid];
    },

    addMessage: function(info) {
      info.time = getTimeString(info.time || +new Date());
      var height = $(document).height();
      var atBottom = this.atBottom();
      this.$messages.append(this.messageTemplate(info));
      if (atBottom)
        this.scrollToBottom();
    },
    
    sendMessage: function(message) {
      var text = message.message;
      var channel = message.channel;
//      if (channel) {
//        var chatChannel = this.chat.channels[channel];
//        if (chatChannel) {
//          chatChannel.send({
//            'private': true,
//            message: text,
//            time: +new Date()//getTime()
//          });
//        }
//        else {
//          // bad
//        }
//      }
//      else {
        this.chat.send({
          message: text,
          time: +new Date() // getTime()
        });
//      }
      
      this.addMessage({
        sender: 'Me', //this.myName,
        senderIcon: this.myIcon,
        message: text,
        self: true,
        time: +new Date(), //getTime(),
        'private': !!channel
      });
    },
    
    _sendMessage: function(e) {
      e && Events.stopEvent(e);
      var msg = this.chatInput.value;
      if (!msg || !msg.length)
        return;

      this.sendMessage({message: msg});
      this.chatInput.value = '';
    },

    startChat: function() {
      var args = arguments, self = this;
      this.ready.done(function() {
        self._startChat.apply(self, args);
      });
    },
    
    openChat: function() {
      this.chat.open(this.roomName, {
        _userid: this.myInfo._userid
      });
    },
    
    restartChat: function() {
      this.chat = new RTCMultiConnection(this.roomName, this.chatSettings);
      this.chat.openNewSession(false);
    },
    
    _startChat: function(options) {
      if (this.chat)
        return;
      
      this._videoOn = this.hasVideo;
      if (!this.rendered) {
        this.$messages = this.$('#messages');
        this.$sendMessageBtn = this.$('#chatSendButton');
        this.$chatInput = this.$("#chatMessageInput");
        this.chatInput = this.$chatInput[0];
        this.$chatInput.bind("keydown", function(event) {
          // track enter key
          var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
          if (keycode == 13) { // keycode for enter key
            chatView.$sendMessageBtn.trigger('click');
          }
        });
        
        this.$localVids = this.$('div#localVideo');
        this.$remoteVids = this.$('div#remoteVideos');
      }
      
      
      var chatView = this;
      var i = 0;
      this.disableChat();
      this.connected = false;
//      var session = {
//        audio: this.hasAudio || this.hasVideo,
//        video: this.hasVideo,
//        data: true
//      }
      
      this.chatSettings = {
        channel: this.roomName,
//        session: session,
        session: this.hasVideo ? RTCSession.AudioVideoData : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
        onopen: function(from) {
            // to send text/data or file
//          chatView._checkChannels();
          chatView.sendUserInfo({
            justEntered: !chatView.connected
          });
          
          chatView.connected = true;
          chatView.enableChat();
        },  
    
        // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
        // data ports suddenly dropped, or chat creator left
        onclose: function(event) {
//          var chat = chatView.chat;
          if (!_.size(chatView.userIdToInfo)) {
            chatView.endChat(true);
//            if (chatView.isActive()) {
//              chatView.restartChat();
//            }
          }
        },
          
        onmessage: function(data, extra) {
          if (extra.extra)
            debugger;
          // send direct message to same user using his user-id
//          chatView._checkChannels();
          if (chatView.isDisabled())
            chatView.enableChat();
          
          var userInfo = chatView.getUserInfo(extra._userid);
//          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(extra._userid, JSON.stringify(data)));
          var isPrivate = false;
          if (data.userInfo) {
            userInfo = data.userInfo;
            chatView.addParticipant(userInfo);
          }
          else if (data.response) {
            // nothing here yet
          }
          else if (data.request) {
            var req = data.request;
            if (req.info) {
              chatView.sendUserInfo();
            }
            
            return;
          }
          else if (data.message) {
            if (!userInfo) {
//              chatView.requestInfo(extra._userid);
              debugger;
              return; // TODO: append message afterward
            }
            
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: data.message,
              'private': data['private'],
              self: false,
              time: +new Date() //getTime()
            });
            
            if (!chatView.isActive())
              chatView.unreadMessages++;
          }
        },
          
        onleave: function(data, extra) {
          // remove that user's photo/image using his user-id
          extra = extra._userdid ? extra : extra.extra ? extra.extra : extra;
//          chatView._checkChannels();          
          var whoLeft = chatView.getUserInfo(extra._userid);
          if (whoLeft) {
            chatView.addMessage({
              message: '<i>{0} has left the room</i>'.format(whoLeft.name),
              time: +new Date(), //getTime(),
              senderIcon: whoLeft.icon,
              sender: whoLeft.name,
              info: true
            });
            
            chatView.removeParticipant(whoLeft._userid);
          }
        },
        openSignalingChannel: function (config) {
          var channel = config.channel || this.channel || 'default-urbien-channel';  
          io.connect(SIGNALING_SERVER).emit('new-channel', {
            channel: channel,
            sender : chatView.myId
          });
  
          var socket = io.connect(SIGNALING_SERVER + '/' + channel);
          socket.channel = channel;
          socket.on('connect', function () {
              if (config.callback) config.callback(socket);
//              if (config.onopen) config.onopen(socket);
          });
  
          socket.send = function (message) {
            socket.emit('message', {
              sender: chatView.myId,
              data  : message
            });
          };
  
          socket.on('message', config.onmessage);
          return socket;
        },

        onstream: function(data) {
          if (data.extra && data.extra.extra)
            debugger;
          
          var method = data.type === 'local' ? 'onLocalStream' : 'onRemoteStream';
          this[method].apply(this, arguments);
        },
        
        onLocalStream: function(data){
          var $videos = chatView.$localVids.find('video');
          var video = data.mediaElement;
          if ($videos.length)
            $videos.replaceWith(video);
          else
            chatView.$localVids.append(video);
          
          chatView.onAppendedLocalVideo(video);
        },
        
        onRemoteStream: function(data) {
          var userid = data.extra._userid,
              userInfo = userid && chatView.getUserInfo(userid),
              media = data.mediaElement,
              stream = data.stream,
              existing = chatView.$remoteVids.find('video[src="{0}"]'.format(data.blobURL));
          
          if (userInfo) {
            userInfo.media = media;
            userInfo.stream = stream;
            userInfo.blobURL = data.blobURL;
          }
          
          if (existing.length)
            existing.replaceWith(media);
          else
            chatView.$remoteVids.append(media);
          
          chatView.onAppendedRemoteVideo(media);
        },
        
        onNewSession: function(session) {
          if (!chatView.isActive())
            return false;
          
          if (chatView.chatSession && chatView.chatSession.sessionid == session.sessionid)
            return false;

          chatView.chatSession = session;
          this.joinedARoom = true;
          this.join(session, chatView.myInfo);
        },
        
        openNewSession: function(isOpenNewSession) {
          if (isOpenNewSession) {
            if (this.isNewSessionOpened || chatView.chatSession) 
              return;
            
            this.isNewSessionOpened = true;

            if (!this.joinedARoom) { 
              chatView.openChat();
            }
          }

          this.connect();
          setTimeout(function () {
            chatView.chat && chatView.chat.openNewSession(true);
          }, 5000);
        },
        reset: function() {
          this.isNewSessionOpened = this.joinedARoom = false;
        }
//        ,
//        transmitRoomOnce: true
      }
      
      this.chat = new RTCMultiConnection(this.roomName, this.chatSettings);
      this.chat.openNewSession(false);
//      this.chat.open();
    },
    
    endChat: function(onclose) {
      if (this.chat) {
        if (!onclose && this.connected)
          this.chat.leave();
        this.chatSession = null;
      }
      
      if (this.hasVideo) {
        this._videoOn = false;
        this.$('video').each(function() {
          this.pause();
        }).remove();
        
        this.$localVids && this.$localVids.empty();
        this.$remoteVids && this.$remoteVids.empty();
      }
    },

    onAppendedLocalVideo: function(video) {
      this.checkVideoSize(video);
      var $local = this.$localVids.find('video');
      if ($local.length > 1) { // HACK to get rid of accumulated local videos if such exist (they shouldn't)
        for (var i = 0; i < $local.length; i++) {
          var v = $local[i];
          if (v !== video)
            $(v).remove();
        }
      }
        
      $local.prop('muted', true).prop('controls', false).addClass('localVideo');
      this.$localVids.show();
      this.restyleVideos();
    },

    onAppendedRemoteVideo: function(video) {
      this.checkVideoSize(video);
      $(video).prop('controls', false).addClass('remoteVideo');
      this.$remoteVids.show();
      this.restyleVideos();
    },

    checkVideoSize: function(video) { // in Firefox, videoWidth is not available on any events...annoying
      var chatView = this;
      if (!video.videoWidth) {
        setTimeout(function() {
          chatView.checkVideoSize(video);
        }, 100);
        
        return;
      }
      
      this.restyleVideoDiv();
    },
    
    restyleVideoDiv: function() {
      var $vc = this.$('.videoChat');
      var width = Math.min($vc.width(), this.innerWidth());

      var height = $vc.height();
      $vc.css('margin-top', -(height / 2) + 'px');
      $vc.css('margin-left', -(width / 2) + 'px');
    },
    
    restyleVideos: function() {
      var chatView = this,
          $locals = chatView.$localVids;
      
      var numRemotes = chatView.$remoteVids.find('video').length;
      if (numRemotes == 1 && !chatView.$localVids.hasClass('myVideo-overlay'))
        $locals.addClass('myVideo-overlay');
//      else
//        $locals.removeClass('myVideo-overlay');
      
      this.restyleVideoDiv();
    }
  },
  {
    displayName: 'Chat'
  });
});
  