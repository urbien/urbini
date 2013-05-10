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
  $(function() {
    var $allVideos = $("iframe[src^='http://player.vimeo.com'], iframe[src^='http://www.youtube.com'], object, embed"),
        $fluidEl = $("figure");
          
    $allVideos.each(function() {
      $(this)
        // jQuery .data does not work on object/embed elements
        .attr('data-aspectRatio', this.height / this.width)
        .removeAttr('height')
        .removeAttr('width');
    });
    
    $(window).resize(function() {
      var newWidth = $fluidEl.width();
      $allVideos.each(function() {
        var $el = $(this);
        $el.width(newWidth)
           .height(newWidth * $el.attr('data-aspectRatio'));
      });
    
    }).resize();
  });
  
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
  
  function getTime() {
    var now = new Date();
    var hours = now.getHours();
    var ampm = hours < 12 ? 'AM' : 'PM';
    hours = hours % 12;
    return '{0}:{1}'.format(toDoubleDigit(hours), toDoubleDigit(now.getMinutes()) + ampm);
  }
  
  var WebRTC;
  
//  var headID = document.getElementsByTagName("head")[0];         
//  var newScript = document.createElement('script');
//  newScript.type = 'text/javascript';
//  newScript.src = 'http://simplewebrtc.com/latest.js';
//  headID.appendChild(newScript);
//  
//    var headID = document.getElementsByTagName("head")[0];         
//    var newScript = document.createElement('script');
//    newScript.type = 'text/javascript';
//    newScript.src = 'https://raw.github.com/muaz-khan/WebRTC-Experiment/master/RTCMultiConnection/RTCMultiConnection-v1.2.js';
//    headID.appendChild(newScript);
  
//  var userId = G.currentUser._uri;
//  
//  userId = userId && U.getParamMap(userId).id
//  function configWebRTC() {
//    var createRoom = WebRTC.prototype.createRoom,
//        joinRoom = WebRTC.prototype.joinRoom;
//
//    WebRTC.prototype.createPrivateRoom = function(name, cb) {
//      this.roomIsPrivate = true;
//      createRoom.apply(this, arguments);
//    }
//
//    WebRTC.prototype.joinRoom = function(name) {
//      if (!name.startsWith('private:')) {      
//        joinRoom.apply(this, arguments);
//      }
//      else {
//        if (G.currentUser.guest || !_.contains(name.slice(8).split(':'), userId)) {
//          throw new Error("Oops! This is a private room, you can't join without an invitation");
//          var participants = ;
//        }
//      }
//    };
//    
//    WebRTC.prototype.inviteToRoom = function(name) {
//      if (!this.participants)
//        
//    };
//  }
  
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'restyleVideoDiv', '_toggleVideo', 'onAppendedLocalVideo'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.autoVideo = options.autoVideo;
      this.hasVideo = this.autoVideo || options.video;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      var req = ['lib/socket.io', 'lib/DataChannel'];
//      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];
      if (this.hasVideo)
        req.push('lib/simplewebrtc');
      
      U.require(req).done(function(io, dc, simpleWebRTC) {
        WebRTC = window.WebRTC || simpleWebRTC;
        this.readyDfd.resolve();
      }.bind(this));
      
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
      
      var chatView = this;
      this.pageView.on('video:off', this.endVideoCall, this);
      this.pageView.on('video:on', this.startVideoChat, this);
      this.pageView.once('chat:on', this.startTextChat, this);
//      this.pageView.once('chat:on', this.startTextChatViaMultiConnection, this);

      this.makeTemplate('genericDialogTemplate', 'videoDialog', this.modelType);
      this.on('active', function(active) {
        if (active)
          this.unreadMessages = 0;
        else
          this.endVideoCall();
      }.bind(this));
      
      this.autoFinish = false;
    },
    
    events : {
      'orientationchange': 'restyleVideoDiv',
      'resize': 'restyleVideoDiv',
      'click #chatSendButton': '_sendMessage',
//      'click #remoteVideos video': 'switchToChat',
//      'submit form#chatMessageForm': 'sendMessage',
//      'change #toggleVideoBtn': '_toggleVideo',
//      'change #toggleAudioBtn': 'toggleAudio',
//      'click #toggleVideoBtn': 'toggleVideo',
      'click #endVideoCall': 'endVideoCall'
    },

    getNumParticipants: function() {
      return this.participants.length;
    },

    getUserId: function() {
      return window.userid;
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
      this.disabled = true;
    },
    
    isDisabled: function() {
      return this.disabled;
    },

    removeParticipant: function(userid) {
      var whoLeft = this.getUserInfo(userid);
      delete this.userIdToInfo[userid];
      if (!_.size(this.userIdToInfo))
        this.disableChat();
    
      this._updateParticipants();
      this.pageView.trigger('chat:participantLeft', userid);
    },

    addParticipant: function(userid, userInfo) {
      var isUpdate = !!this.getUserInfo(userid);
      this.userIdToInfo[userid] = userInfo;
      this._updateParticipants();
      if (!isUpdate && userInfo.justEntered) {
        this.addMessage({
          message: '<i>{0} has entered the room</i>'.format(userInfo.name),
          time: getTime(),
          senderIcon: userInfo.icon,
          info: true,
          sender: userInfo.name
        });
      }
      
      userInfo.userid = userid;
      this.pageView.trigger('chat:newParticipant', userInfo);
    },
    
    _updateParticipants: function() {
      this.participants = _.keys(this.userIdToInfo);
    },
    
    _checkChannels: function() {
      if (_.filter(this.chat.channels, function(c) {return c.readyState === 'closed'}).length) {
        debugger;
      }
    },
    
    sendInfo: function(options) {
      this.chat.send({
        userInfo: _.extend({
          name: this.myName,
          icon: this.myIcon,
          uri: this.myUri
        }, options || {})
      });
    },

    requestInfo: function(userid) {
      var channel = this.chat.channels[userid];
      if (channel) {
        channel.send({
          request: {
            info: true
          }
        });
      }
    },

    requestVideo: function(userid) {
      var chat = userid ? this.chat.channels[userid] : this.chat;
      if (chat) {
        chat.send({
          request: {
            video: true
          }
        });
      }
    },

    getUserInfo: function(userid) {
      return this.userIdToInfo[userid];
    },

    _startTextChat: function() {
      if (this.chat)
        return;
      
      if (!this.rendered) {
        this.$messages = this.$('#messages');
        this.$sendMessageBtn = this.$('#chatSendButton');
        this.$chatInput = this.$("#chatMessageInput");
        this.chatInput = this.$chatInput[0];
      }
      
      var chatView = this;
      this.pageView.on('video:on', function() {
        chatView.requestVideo();
      });
      
      var i = 0;
      this.disableChat();
      var first = true;
      this.chat = new DataChannel(this.roomName, {
        onopen: function(from) {
            // to send text/data or file
          chatView._checkChannels();
          G.log(chatView.TAG, 'chat', 'connected with', from);
          chatView.sendInfo({
            justEntered: first
          });
          
          first = false;
          chatView.sendInfo();
          chatView.enableChat();
        },  
    
        // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
        // data ports suddenly dropped, or chat creator left
        onclose: function(event) {
          chatView._checkChannels();
          var chat = chatView.chat;
          if (!_.size(chat.channels)) {
            chat.leave();
            chat.open(chatView.roomName);
          }
        },
          
        onmessage: function(data, from) {
          // send direct message to same user using his user-id
          chatView._checkChannels();
          if (chatView.isDisabled())
            chatView.enableChat();
          
          var userInfo = chatView.getUserInfo(from);
          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(from, JSON.stringify(data)));
          var isPrivate = false;
          if (data.userInfo) {
            userInfo = data.userInfo;
            chatView.addParticipant(from, userInfo);
          }
          else if (data.response) {
            var res = data.response;
            if (_.has(res, 'video') && !res.video) {
              chatView.addMessage({
                senderIcon: userInfo.icon,
                message: chatView.myName + ' has declined to video chat',
                'private': true
              });
              
              chatView.pageView.trigger('video:off');
            }
          }
          else if (data.request) {
            var req = data.request;
            if (req.info) {
              chatView.sendInfo();
            }
            
            if (req.video && !chatView._videoOn) {
              $('#requestVideoDialog').remove();
              var popupHtml = chatView.videoDialog({
                id: 'requestVideoDialog',
                title: userInfo.name + ' would like to video chat with you',
                ok: 'Accept',
                cancel: 'Decline'
              });
              
              $(document.body).append(popupHtml);
              var $popup = $('#requestVideoDialog');
              $popup.find('[data-cancel]').click(function() {
                chatView.chat.channels[from].send({
                  response: {
                    video: false
                  }
                });
              });
              
              $popup.find('[data-ok]').click(function() {
                chatView.pageView.trigger('video:on');
              });
              
              $popup.trigger('create');
              $popup.popup().popup("open");
            }
            
            return;
          }
          else if (data.message) {
            if (!userInfo) {
              chatView.requestInfo(from);
              return; // TODO: append message afterward
            }
            
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: data.message,
              'private': data['private'],
              self: false,
              time: getTime()
            });
            
            if (!chatView.isActive())
              chatView.unreadMessages++;
          }
        },
          
        onleave: function(from) {
          // remove that user's photo/image using his user-id
          chatView._checkChannels();          
          var whoLeft = chatView.getUserInfo(from);
          if (whoLeft) {
            chatView.addMessage({
              message: '<i>{0} has left the room</i>'.format(whoLeft.name),
              time: getTime(),
              senderIcon: whoLeft.icon,
              info: true
            });
          }
          
          chatView.removeParticipant(from);
        },
        openSignalingChannel: function (config) {
          var channel = config.channel || this.channel || 'default-urbien-channel';
          var sender = window.userid;

          io.connect(SIGNALING_SERVER).emit('new-channel', {
            channel: channel,
            sender : sender
          });

          var socket = io.connect(SIGNALING_SERVER + '/' + channel);
          socket.channel = channel;
          socket.on('connect', function () {
              if (config.callback) config.callback(socket);
              if (config.onopen) config.onopen(socket);
          });

          socket.send = function (message) {
              socket.emit('message', {
                  sender: sender,
                  data  : message
              });
          };

          socket.on('message', config.onmessage);
          return socket;
        }
      });
      
      this.chat.__urbienId = G.nextId();
      
//      // if someone already created a channel; to join it: use "connect" method
//      channel.connect('channel-name');
      
      this.$chatInput.bind("keydown", function(event) {
        // track enter key
        var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
        if (keycode == 13) { // keycode for enter key
          chatView.$sendMessageBtn.trigger('click');
        }
      });
    },
    
    addMessage: function(info) {
      info.time = info.time || getTime();
      var height = $(document).height();
      var atBottom = this.atBottom();
      this.$messages.append(this.messageTemplate(info));
      if (atBottom)
        this.scrollToBottom();
    },
    
    sendMessage: function(message) {
      var text = message.message;
      var channel = message.channel;
      if (channel) {
        var chatChannel = this.chat.channels[channel];
        if (chatChannel) {
          chatChannel.send({
            'private': true,
            message: text,
            time: getTime()
          });
        }
        else {
          // bad
        }
      }
      else {
        this.chat.send({
          message: text,
          time: getTime()
        });
      }
      
      this.addMessage({
        sender: 'Me', //this.myName,
        senderIcon: this.myIcon,
        message: text,
        self: true,
        time: getTime(),
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
//      this.restyle();
    },

//    startTextChatViaMultiConnection: function(options) {
//      if (!this.rendered) {
//        this.$messages = this.$('#messages');
//        this.$sendMessageBtn = this.$('#chatSendButton');
//        this.$chatInput = this.$("#chatMessageInput");
//        this.chatInput = this.$chatInput[0];
//        this.$localVids = this.$('div#localVideo');
//        this.$remoteVids = this.$('div#remoteVideos');
//      }
//      
//      var chatView = this;
//      var i = 0;
//      this.disableChat();
//      var settings = {
//        channel: this.roomName,
////        session: this.hasVideo ? RTCSession.AudioVideoData : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
//        session: RTCSession.Data,
//        onopen: function(from) {
//            // to send text/data or file
//          debugger;
//          chatView._checkChannels();
//          G.log(chatView.TAG, 'chat', 'connected with', from);
//          chatView.sendInfo();
//          chatView.enableChat();
//        },  
//    
//        // error to open data ports
//        onerror: function(event) {
//          debugger;
//        },
//        
//        // data ports suddenly dropped, or chat creator left
//        onclose: function(event) {
//          debugger;
//          chatView._checkChannels();
//          var chat = chatView.chat;
//          if (!_.size(chat.channels)) {
//            chat.leave();
//            chat.open(chatView.roomName);
//          }
//        },
//          
//        onmessage: function(data, from) {
//          debugger;
//          // send direct message to same user using his user-id
//          chatView._checkChannels();
//          if (chatView.isDisabled())
//            chatView.enableChat();
//          
//          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(from, JSON.stringify(data)));
//          var isPrivate = false;
//          if (data.userInfo) {
//            var userInfo = data.userInfo;
//            var isUpdate = !!chatView.getUserInfo(from);
//            chatView.addParticipant(from, userInfo);
//            if (!isUpdate) {
//              chatView.addMessage({
//                message: userInfo.name + ' has entered the room',
//                time: getTime(),
//                senderIcon: userInfo.icon,
//                info: true
//              });
//            }
//          }
//          else if (data.request) {
//            if (data.request.info) {
//              chatView.sendInfo();
//            }
//            
//            return;
//          }
//          else if (data.message) {
//            var userInfo = chatView.getUserInfo(from);
//            if (!userInfo) {
//              chatView.requestInfo(from);
//              return; // TODO: append message afterward
//            }
//            
//            chatView.addMessage({
//              senderIcon: userInfo.icon,
//              sender: userInfo.name,
//              message: data.message,
//              'private': data['private'],
//              self: false,
//              time: getTime()
//            });
//            
//            if (!chatView.isActive())
//              chatView.unreadMessages++;
//          }
//        },
//          
//        onleave: function(from) {
//          // remove that user's photo/image using his user-id
//          debugger;
//          chatView._checkChannels();          
//          var whoLeft = chatView.getUserInfo(from);
//          if (whoLeft) {
//            chatView.addMessage({
//              message: whoLeft.name + ' has left the room',
//              time: getTime(),
//              senderIcon: whoLeft.icon,
//              info: true
//            });
//          }
//          
//          chatView.removeParticipant(from);
//        },
//        
//        onLocalStream: function(stream){
//          var $videos = chatView.$localVids.find('video');
//          if ($videos.length)
//            $videos.replaceWith(stream.mediaElement);
//          else
//            chatView.$localVids.append(stream.mediaElement);
//          
//          chatView.appendedLocalVideo(stream.mediaElement);
//        },
//        
//        onRemoteStream: function(stream){
//          var existing = chatView.$remoteVids.find('video[src="{0}"]'.format(stream.blobURL));
//          if (existing.length)
//            existing.replaceWith(stream.mediaElement);
//          else
//            chatView.$remoteVids.append(stream.mediaElement);
//        },
//        
//        onNewSession: function(session) {
//          console.log('session name', session.sessionid);
//          console.log('user name', session.userid);
//        },
//        
//        openSignalingChannel: function (config) {
//          var channel = config.channel || this.channel || 'default-urbien-channel';
//          var sender = Math.round(Math.random() * 60535) + 5000;
//
//          io.connect(SIGNALING_SERVER).emit('new-channel', {
//            channel: channel,
//            sender : sender
//          });
//
//          var socket = io.connect(SIGNALING_SERVER + '/' + channel);
//          socket.channel = channel;
//          socket.on('connect', function () {
//              if (config.callback) config.callback(socket);
//          });
//
//          socket.send = function (message) {
//              socket.emit('message', {
//                  sender: sender,
//                  data  : message
//              });
//          };
//
//          socket.on('message', config.onmessage);
//          return socket;
//        }
//      }
//      
//      this.chat = new RTCMultiConnection(this.roomName, settings);
////      this.chat.openSignalingChannel = settings.openSignalingChannel;
//      this.chat.open(this.roomName);
////      this.chat.open({
////        extra: {
////          username: this.myName
////        }
////      });
//    },
    
//    toggleVideo: function() {
//      var $checkbox = this.$('#toggleVideoBtn');
//      if ($checkbox[0].checked)
//        $checkbox.attr("checked", false);
//      else
//        $checkbox.attr("checked", true);
//      
//      $checkbox.checkboxradio("refresh");
//    },
    
    _toggleVideo: function(e) {
      if (e.currentTarget.checked) {
        this._videoOn = true;
        this.startVideoChat();
//        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Stop Video');
      }
      else {
        this._videoOn = false;
//        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Start Video');
        if (this.webrtc) {
          this.endVideoCall();
        }
      }
    },
    
    stopVideo: function() {
//      this.$('video').each(function() {
//        this.pause();
//      });
      
      this._videoOn = false;
      if (this.webrtc) {
        this.webrtc.leaveRoom();
        var stream = this.webrtc.localStream;
        // turn off webcam
        stream && stream.stop();
//        this.webrtc.connection.disconnect();
//        this.webrtc.connection.emit('disconnect');
      }
      
      this.$localVids && this.$localVids.empty();
//      this.webrtc = null;
    },
    
    endVideoCall: function() {
      this.stopVideo();
      this.$remoteVids && this.$remoteVids.empty();
    },
    
//    startTextChat1: function() {
//      if (!this.rendered) {
//        this.$messages = this.$('#messages');
//        this.$sendMessageBtn = this.$('#chatSendButton');
//        this.$chatInput = this.$("#chatMessageInput");
//        this.chatInput = this.$chatInput[0];
//        this.userIdToInfo = {};      
//        var me = G.currentUser;
//        if (me) {
//          this.myName = me.davDisplayName || getGuestName();
//          this.myIcon = me.thumb || 'icons/male_thumb.jpg';
//          this.myUri = me._uri;
//        }
//        else {
//          this.myName = getGuestName();
//        }
//      }
//      
//      var chatView = this;
//      var i = 0;
//      this.disableChat();
//      var chat = this.chat = new WebRTC({
//        autoRequestMedia: false,
//        url: SIGNALING_SERVER
//      });
//      
//      chat.on('readyToText', function () {
//        chat.joinRoom(chatView.roomName);
//      });
//    },
    onAppendedLocalVideo: function(video) {
      this.monitorVideoSize(video);
      var $local = this.$localVids.find('video');
      if ($local.length > 1) {
        for (var i = 1; i < $local.length; i++)
          $local[i].remove();
      }
        
      $local.prop('muted', true).addClass('localVideo');
      this.$localVids.show();
      this.restyleVideos();
    },

    startTextChat: function() {
      var args = arguments, self = this;
      this.ready.done(function() {
        self._startTextChat.apply(self, args);
      });
    },
      
    startVideoChat: function() {
      var args = arguments, self = this;
      this.ready.done(function() {
        self._startVideoChat.apply(self, args);
      });
    },

    _startVideoChat: function() {
      if (this._videoOn)
        return;
      
      this._videoOn = true;
      var chatView = this;
      this.$localVids = this.$('div#localVideo');
      this.$remoteVids = this.$('div#remoteVideos');
//      this.endVideoCall();
      
      var exists = !!this.webrtc;
      var webrtc = this.webrtc = this.webrtc || new WebRTC({
        localVideo: {
          _el: 'localVideo', // the id/element dom element that will hold "our" video
          muted: true
        },
        remoteVideos: {
          _el: 'remoteVideos' // the id/element dom element that will hold remote videos
        },
        // immediately ask for camera access
        autoRequestMedia: true,
        url: SIGNALING_SERVER.replace('8889', '8888')
      });
      
//      var webrtc = this.webrtc = new WebRTC({
//        localVideoEl: 'localVideo', // the id/element dom element that will hold "our" video
//        remoteVideosEl: 'remoteVideos', // the id/element dom element that will hold remote videos
//        autoRequestMedia: true  // immediately ask for camera access
//      });
      
      // we have to wait until it's ready
      if (exists) {
        webrtc.startLocalVideo();
        this.$localVids.show();
        return;
      }
      
      var hash = this.hash;
      webrtc.on('appendedLocalVideo', function (video) {
        chatView.onAppendedLocalVideo(video);
      });

      webrtc.on('videoAdded', function (video) {
        chatView.monitorVideoSize(video);
//        $(video).prop('muted', true)
        chatView.restyleVideos();
      });

      webrtc.on('videoRemoved', function (video) {
        var $remote = chatView.$remoteVids.find('video');
        if (!$remote.length)
          chatView.$localVids.removeClass('myVideo-overlay')
          
        chatView.restyleVideos();
      });

      webrtc.on('readyToCall', function () {
        webrtc.joinRoom(chatView.roomName);
      });
    },

    monitorVideoSize: function(video) {
      var chatView = this;
      var $video = $(video);
      var checkSize = function(e) {
        if (video.videoWidth) {
//          if ($video.parents('#remoteVideos').length)
//            $('<icon style="font-size:20px;position:absolute;top:0px;right:0px;color:#fff;" class="ui-icon-remove-circle"></icon>').insertAfter($video);          

          chatView.restyleVideoDiv();
          _.each(G.media_events, function(e) {
            $video.off(e, checkSize);
          });
        }
      };
          
      _.each(G.media_events, function(e) {
        $video.one(e, checkSize);
      });
    },
    
    restyleVideoDiv: function() {
      var $vc = this.$('.videoChat');
      var width = Math.min($vc.width(), this.innerWidth());
//      var height = _.reduce($vc.find('div#remoteVideos video'), function(memo, next)  {
//        return memo + $(next).height() + parseInt($(next).css('padding-top')) * 2;
//      }, 0);
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
//    ,
//    resizeVideos: function() {
//      var self = this;
////      var $locals = this.$localVids.find('video'),
////          $remotes = this.$remoteVids.find('video'),
////          numRemotes = $remotes.length,
////          numLocals = $remotes.length,
////          overlayVids = [];
////      if (numRemotes == 1) {
////        
////      }
////      
////      _.each([this.$localVids, this.$remoteVids], function($vidDiv) {        
////        var divWidth = $vidDiv.width();
////        $vidDiv.find('video').each(function() {
////          var $vid = $(this);
////          var width = $vid[0].videoWidth;
////          if (!width) {
////            var border = parseInt($vid.css("border-left-width"));
////            width = divWidth - 2 * (border || 0);
////          }
////          
////          $vid.width(Math.min(640, width));
////        });
////      });
//    }
  },
  {
    displayName: 'Chat'
  });
});
  