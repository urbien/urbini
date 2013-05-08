//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  var serverName = G.serverName;
  if (/^http\:\/\/.+\//.test(serverName))
    serverName = serverName.slice(0, serverName.indexOf('/', 7));
  
  var SIGNALING_SERVER = serverName + ':8888';
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
      _.bindAll(this, 'render', 'resizeVideos', 'resurrectTextChat', '_toggleVideo'); // fixes loss of context for 'this' within methods
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

      this.autoFinish = false;
      
      this.on('active', function(active) {
        if (active)
          this.unreadMessages = 0;
        else
          this.endVideoCall();
      }.bind(this));
    },
    
    events : {
      'orientationchange': 'resizeVideos',
      'resize': 'resizeVideos',
      'click #chatSendButton': '_sendMessage',
//      'submit form#chatMessageForm': 'sendMessage',
      'change #toggleVideoBtn': '_toggleVideo',
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
      this.$('#toggleVideoBtn').checkboxradio().checkboxradio('disable');

      this.ready.done(function() {        
        if (!this.rendered) {
//          this.startChat();
          this.startTextChat();
          if (this.hasVideo)
            this.$('#toggleVideoBtn').checkboxradio('enable');
          if (this.autoVideo)
            this.startVideoChat();
          
          this.finish();
        }
      }.bind(this));
    },
    
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

    addParticipant: function(userid, data) {
      this.userIdToInfo[userid] = data;
      this._updateParticipants();
      this.pageView.trigger('chat:newParticipant', userid, data);
    },
    
    _updateParticipants: function() {
      this.participants = _.keys(this.userIdToInfo);
    },
    
    _checkChannels: function() {
      if (_.filter(this.chat.channels, function(c) {return c.readyState === 'closed'}).length) {
        debugger;
      }
    },
    
    sendInfo: function() {
      this.chat.send({
        userInfo: {
          name: this.myName,
          icon: this.myIcon,
          uri: this.myUri
        }
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
    
    getUserInfo: function(userid) {
      return this.userIdToInfo[userid];
    },

    startTextChat: function() {
      if (!this.rendered) {
        this.$messages = this.$('#messages');
        this.$sendMessageBtn = this.$('#chatSendButton');
        this.$chatInput = this.$("#chatMessageInput");
        this.chatInput = this.$chatInput[0];
      }
      
      var chatView = this;
      var i = 0;
      this.disableChat();
      this.chat = new DataChannel(this.roomName, {
        onopen: function(userId) {
            // to send text/data or file
          chatView._checkChannels();
          G.log(chatView.TAG, 'chat', 'connected with', userId);
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
          
        onmessage: function(data, userid) {
          // send direct message to same user using his user-id
          chatView._checkChannels();
          if (chatView.isDisabled())
            chatView.enableChat();
          
          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, JSON.stringify(data)));
          var isPrivate = false;
          if (data.userInfo) {
            var userInfo = data.userInfo;
            var isUpdate = !!chatView.getUserInfo(userid);
            chatView.addParticipant(userid, userInfo);
            if (!isUpdate) {
              chatView.addMessage({
                message: userInfo.name + ' has entered the room',
                time: getTime(),
                senderIcon: userInfo.icon,
                info: true
              });
            }
          }
          else if (data.request) {
            if (data.request.info) {
              chatView.sendInfo();
            }
            
            return;
          }
          else if (data.message) {
            var userInfo = chatView.getUserInfo(userid);
            if (!userInfo) {
              chatView.requestInfo(userid);
              return; // TODO: append message afterward
            }
            
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: data.message,
              isPrivate: data.isPrivate,
              self: false,
              time: getTime()
            });
            
            if (!chatView.isActive())
              chatView.unreadMessages++;
          }
        },
          
        onleave: function(userid) {
          // remove that user's photo/image using his user-id
          chatView._checkChannels();          
          var whoLeft = chatView.getUserInfo(userid);
          if (whoLeft) {
            chatView.addMessage({
              message: whoLeft.name + ' has left the room',
              time: getTime(),
              senderIcon: whoLeft.icon,
              info: true
            });
          }
          
          chatView.removeParticipant(userid);
        }
//        ,
//        openSignalingChannel: function(config) {
//          var sender = window.userid;
//          var socket = io.connect(SIGNALING_SERVER);
//          socket.on('message', function() {
//            debugger;
//            config.onmessage.apply(this, arguments);
//          });
//          
//          socket.send = function(message) {
//            socket.emit('message', {
//              sender: sender,
//              data : message
//            });
////            debugger;
////            socket.emit('message', {
////              to: to,
////              type: type,
////              payload: payload
////            });
//          };
//
//          socket.on('connect', function () {
//            if (config.onopen) config.onopen(socket);
//          });
//  
////          socket.on('message', function (message) {
////            debugger;
////            socket.emit('message', message);
//////              var existing = self.pcs[message.from];
//////              if (existing) {
//////                  existing.handleMessage(message);
//////              } else {
//////                  // create the conversation object
//////                  self.pcs[message.from] = new Conversation({
//////                      id: message.from,
//////                      parent: self,
//////                      initiator: false
//////                  });
//////                  self.pcs[message.from].handleMessage(message);
//////              }
////          });
//  
//          socket.on('joined', function (room) {
//            debugger;
////              logger.log('got a joined', room);
////              if (!self.pcs[room.id]) {
////                  self.startVideoCall(room.id);
////              }
//          });
//          
//          socket.on('left', function (room) {
//            debugger;
//          });
//
//          return socket;
//        }
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
    
    resurrectTextChat: function() {
      this.startTextChat();
    },
    
    addMessage: function(info) {
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
            isPrivate: true,
            message: text
          });
        }
        else {
          // bad
        }
      }
      else {
        this.chat.send({
          message: text
        });
      }
      
      this.addMessage({
        sender: 'Me', //this.myName,
        senderIcon: this.myIcon,
        message: text,
        self: true,
        time: getTime(),
        isPrivate: !!channel
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

    startChat: function(options) {
      var chatView = this;
      var i = 0;
      var settings = {
        channel: this.roomName,
//        session: this.hasVideo ? RTCSession.AudioVideoData : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
        session: RTCSession.Data,
        onopen: function(userId) {
            // to send text/data or file
          debugger;
          chatView._checkChannels();
          G.log(chatView.TAG, 'chat', 'connected with', userId);
          chatView.sendInfo();
          chatView.enableChat();
        },  
    
        // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
        // data ports suddenly dropped, or chat creator left
        onclose: function(event) {
          debugger;
          chatView._checkChannels();
          var chat = chatView.chat;
          if (!_.size(chat.channels)) {
            chat.leave();
            chat.open(chatView.roomName);
          }
        },
          
        onmessage: function(data, userid) {
          debugger;
          // send direct message to same user using his user-id
          chatView._checkChannels();
          if (chatView.isDisabled())
            chatView.enableChat();
          
          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, JSON.stringify(data)));
          var isPrivate = false;
          if (data.userInfo) {
            var userInfo = data.userInfo;
            var isUpdate = !!chatView.getUserInfo(userid);
            chatView.addParticipant(userid, userInfo);
            if (!isUpdate) {
              chatView.addMessage({
                message: userInfo.name + ' has entered the room',
                time: getTime(),
                senderIcon: userInfo.icon,
                info: true
              });
            }
          }
          else if (data.request) {
            if (data.request.info) {
              chatView.sendInfo();
            }
            
            return;
          }
          else if (data.message) {
            var userInfo = chatView.getUserInfo(userid);
            if (!userInfo) {
              chatView.requestInfo(userid);
              return; // TODO: append message afterward
            }
            
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: data.message,
              isPrivate: data.isPrivate,
              self: false,
              time: getTime()
            });
            
            if (!chatView.isActive())
              chatView.unreadMessages++;
          }
        },
          
        onleave: function(userid) {
          // remove that user's photo/image using his user-id
          debugger;
          chatView._checkChannels();          
          var whoLeft = chatView.getUserInfo(userid);
          if (whoLeft) {
            chatView.addMessage({
              message: whoLeft.name + ' has left the room',
              time: getTime(),
              senderIcon: whoLeft.icon,
              info: true
            });
          }
          
          chatView.removeParticipant(userid);
        },
        
        onstream: function(stream){
          if (stream.type === 'local') {
            var local = chatView.$('div#localVideo');
            var localVideos = local.find('video');
            if (localVideos.length)
              localVideos.replaceWith(stream.mediaElement);
            else
              local.append(stream.mediaElement);
          }
    
          if (stream.type === 'remote') {
            debugger;
            var existing = chatView.$('div#remoteVideos video[src="{0}"]'.format(stream.blobURL));
            if (existing.length)
              existing.replaceWith(stream.mediaElement);
            else
              chatView.$('div#remoteVideos').append(stream.mediaElement);
          }
        },
        
        openSignalingChannel: function (config) {
          var channel = config.channel || this.channel || 'default-urbien-channel';
          var sender = Math.round(Math.random() * 60535) + 5000;

          io.connect(SIGNALING_SERVER).emit('new-channel', {
            channel: channel,
            sender : sender
          });

          var socket = io.connect(SIGNALING_SERVER + '/' + channel);
          socket.channel = channel;
          socket.on('connect', function () {
              if (config.callback) config.callback(socket);
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
      }
      
      this.chat = new RTCMultiConnection(this.roomName, settings);
      this.chat.open({
        extra: {
          username: this.myName
        }
      });
    },
    
    toggleVideo: function() {
      var $checkbox = this.$('#toggleVideoBtn');
      if ($checkbox[0].checked)
        $checkbox.attr("checked", false);
      else
        $checkbox.attr("checked", true);
      
      $checkbox.checkboxradio("refresh");
    },
    
    _toggleVideo: function(e) {
      if (e.currentTarget.checked) {
        this._videoOn = true;
        this.startVideoChat();
        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Stop Video');
      }
      else {
        this._videoOn = false;
        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Start Video');
        if (this.webrtc) {
          this.endVideoCall();
        }
      }
    },
    
    stopVideo: function() {
      this.$('video').each(function() {
        this.pause();
      });
      
      if (this.webrtc) {
        this.webrtc.leaveRoom();
        var stream = this.webrtc.localStream;
        stream && stream.stop(); // turn off webcam
      }
      
//      this.('#toggleVideoBtn').$checkbox.attr("checked", false).checkboxradio("refresh");
      this.$('div#localVideo').empty();
      this.webrtc = null;
    },
    
    endVideoCall: function() {
      this.stopVideo();
      this.$('div#remoteVideos').empty();
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

    startVideoChat: function() {
      this.endVideoCall();
      var chatView = this;
      var webrtc = this.webrtc = new WebRTC({
        localVideo: {
          _el: 'localVideo', // the id/element dom element that will hold "our" video
          muted: true
        },
        remoteVideos: {
          _el: 'remoteVideos' // the id/element dom element that will hold remote videos
        },
        // immediately ask for camera access
        autoRequestMedia: true,
        url: SIGNALING_SERVER
      });
      
//      var webrtc = this.webrtc = new WebRTC({
//        localVideoEl: 'localVideo', // the id/element dom element that will hold "our" video
//        remoteVideosEl: 'remoteVideos', // the id/element dom element that will hold remote videos
//        autoRequestMedia: true  // immediately ask for camera access
//      });
      
      // we have to wait until it's ready
      var hash = this.hash;
      webrtc.on('appendedLocalVideo', function () {
        var local = chatView.$('div#localVideo video');
        if (local.length > 1) {
          for (var i = 1; i < local.length; i++)
            local[i].remove();
        }
          
        local.prop('muted', true);
        chatView.resizeVideos();
      });

      webrtc.on('videoAdded', function (video) {
        var $video = chatView.$(video);
        $video.prop('muted', true);
        chatView.resizeVideos();
      });

      webrtc.on('readyToCall', function () {
        webrtc.joinRoom(chatView.roomName);
      });
    },
    
    resizeVideos: function() {
      var self = this;
      _.each(['div#localVideo', 'div#remoteVideos'], function(div) {        
        var $vidDiv = this.$(div);
        var $vid = $vidDiv.find('video');
        if ($vid.length) {
          var border = parseInt($vid.css("border-left-width"));
          $vid.width(Math.min(640, $vidDiv.width() - 2 * (border || 0)));
        }
      });      
    }
  },
  {
    displayName: 'Chat'
  });
});
  