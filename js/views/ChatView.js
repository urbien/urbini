//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  var SIGNALING_SERVER = 'http://urbien.com:8080';
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
      _.bindAll(this, 'render', 'resizeVideo', 'resurrectTextChat', '_toggleVideo'); // fixes loss of context for 'this' within methods
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
      
      U.require(req).done(function(io, DC, simpleWebRTC) {
        WebRTC = window.WebRTC || simpleWebRTC;
        this.readyDfd.resolve();
      }.bind(this));
      
      this.makeTemplate('chatViewTemplate', 'template', this.modelType);
      this.makeTemplate('chatMessageTemplate', 'messageTemplate', this.modelType);
      
      this.roomName = this.getRoomName();
      this.unreadMessages = 0;
      this.participants = [];
      this.autoFinish = false;
      
      this.on('active', function(active) {
        if (active)
          this.unreadMessages = 0;
        else
          this.endVideoCall();
      }.bind(this));
    },
    
    events : {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo',
      'click #chatSendButton': '_sendMessage',
//      'submit form#chatMessageForm': 'sendMessage',
      'change #toggleVideoBtn': '_toggleVideo',
//      'change #toggleAudioBtn': 'toggleAudio',
//      'click #toggleVideoBtn': 'toggleVideo',
      'click #endVideoCall': 'endVideoCall'
    },

    getNumParticipants: function() {
      return this.participants.length + 1;
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
      var hash = this.hash.slice(this.hash.indexOf('/') + 1); // cut off chat/
      if (/\?/.test(hash))
        hash = hash.slice(0, hash.indexOf('?'));
      
      var name = hash.replace(/[^a-zA-Z0-9]/ig, '');
      return 'urbien-' + name;
    },
    
    render: function() {
//      var args = arguments;
//      this.ready.done(function() {
//        this.renderHelper.apply(this, arguments);
//        this.finish();
//      }.bind(this));
//    },
//    
//    renderHelper: function(options) {    
      this.$el.html(this.template({
        video: this.hasVideo
      }));

      this.$el.trigger('create');
      this.$('#toggleVideoBtn').checkboxradio().checkboxradio('disable');

      this.ready.done(function() {        
        if (!this.rendered) {
  //        this.startChat();
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
    
    addParticipant: function(userid, data) {
      this.userIdToInfo[userid] = data;
      this.participants = _.keys(this.userIdToInfo);
      this.numberOfParticipants = this.participants.length;
      this.pageView.trigger('newParticipant', userid, data);
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
      }
      
      var chatView = this;
      var i = 0;
      this.disableChat();
      this.chat = new DataChannel(this.roomName, {
        onopen: function(userId) {
            // to send text/data or file
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
          var chat = chatView.chat;
          if (!_.size(chat.channels)) {
            chat.leave();
            chat.open(chatView.roomName);
          }
        },
          
        onmessage: function(data, userid) {
          // send direct message to same user using his user-id
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
          var whoLeft = chatView.getUserInfo(userid);
          if (whoLeft) {
            chatView.addMessage({
              message: whoLeft.name + ' has left the room',
              time: getTime(),
              senderIcon: whoLeft.icon,
              info: true
            });
            
            delete chatView.userIdToInfo[userid];
            if (!_.size(chatView.userIdToInfo))
              chatView.disableChat();
          }
          
          chatView.parentView.trigger('participantLeft', userid);
        }
//        ,
//        openSignalingChannel: function(config) {
//          var socket = io.connect(SIGNALING_SERVER);
//          socket.channel = chatView.roomName;
//          socket.on('message', function() {
//            config.onmessage && config.onmessage.apply(this, arguments);
//          });
//
//          socket.send = function (data) {
//            socket.emit('message', data);
//          };
//
//          if (config.onopen) setTimeout(config.onopen, 1);
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

//    startChat: function(options) {
//      var chatView = this;
//      var i = 0;
//      var channelName = 'urbien';
//      var settings = {
//        channel: channelName,
//        session: this.hasVideo ? RTCSession.AudioVideo : this.hasAudio ? RTCSession.Audio : RTCSession.Data,
//        onopen: function(userId) {
//            // to send text/data or file
//          debugger;
//          channel.send('first msg');        
//        },  
//    
//          // error to open data ports
//        onerror: function(event) {
//          debugger;
//        },
//        
//          // data ports suddenly dropped
//        onclose: function(event) {
//          debugger;
//        },
//          
//        onmessage: function(message, userid) {
//          // send direct message to same user using his user-id        
//          debugger;
//          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, message));
//          if (i++ < 10)
//            channel.send(message + i);
//    //        channel.channels[userid].send('cool!');
//        },
//          
//        onleave: function(userid) {
//          // remove that user's photo/image using his user-id
//          debugger;
//        },
//        
//        onstream: function(stream){
//    //      // it is extra data passed from remote peer
//    //      if (stream.type === 'remote') {
//    //        var extra = stream.extra;
//    //        video.poster = extra.username;
//    //      }
//          
//          if (stream.type === 'local') {
//            var local = chatView.$('div#localVideo');
//            var localVideos = local.find('video');
//            if (localVideos.length)
//              localVideos.replaceWith(stream.mediaElement);
//            else
//              local.append(stream.mediaElement);
//          }
//    
//          if (stream.type === 'remote') {
//            var existing = chatView.$('div#remoteVideos video[src="{0}"]'.format(stream.blobURL));
//            if (existing.length)
//              existing.replaceWith(stream.mediaElement);
//            else
//              chatView.$('div#remoteVideos').append(stream.mediaElement);
//          }
//        }
//      }
//      
//      var channel = new RTCMultiConnection(channelName, settings);
//      channel.open();
//    },
    
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
        // you can name it anything
        var local = chatView.$('div#localVideo video');
        if (local.length > 1) {
          for (var i = 1; i < local.length; i++)
            local[i].remove();
        }
          
        local.prop('muted', true);
        chatView.resizeVideo();
      });
      
      webrtc.on('readyToCall', function () {
        webrtc.joinRoom(chatView.roomName);
      });
    },
    
    resizeVideo: function() {
      _.each(['div#localVideo', 'div#remoteVideos'], function(div) {        
        var $vidDiv = this.$(div);
        var $vid = $vidDiv.find('video');
        if (!$vid.length)
          return;
        
        var border = parseInt($vid.css("border-left-width"));
        $vid.width(Math.min(640, $vidDiv.width() - 2 * (border || 0)));
      });
    }
  },
  {
    displayName: 'Chat'
  });
});
  