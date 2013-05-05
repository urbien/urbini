//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
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
      _.bindAll(this, 'render', 'resizeVideo', 'resurrectTextChat'); // fixes loss of context for 'this' within methods
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
      this.autoFinish = false;
    },
    
    events : {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo',
      'click #chatSendButton': 'sendMessage',
//      'submit form#chatMessageForm': 'sendMessage',
      'change #toggleVideoBtn': 'toggleVideo',
//      'change #toggleAudioBtn': 'toggleAudio',
//      'click #toggleVideoBtn': 'toggleVideo',
      'click #endVideoCall': 'endVideoCall'
    },
    
    getRoomName: function() {
      var hash = this.hash.slice(this.hash.indexOf('/') + 1); // cut off chat/
      if (/\?/.test(hash))
        hash = hash.slice(0, hash.indexOf('?'));
      
      var name = hash.replace(/[^a-zA-Z0-9]/ig, '');
      return name;
    },
    
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, arguments);
        this.finish();
      }.bind(this));
    },
    
    renderHelper: function(options) {    
      this.$el.html(this.template({
        video: this.hasVideo
      }));
      
      if (!this.rendered) {
//        this.startChat();
        this.startTextChat();
        if (this.autoVideo)
          this.startVideoChat();
        this.$el.trigger('create');
      }
    },
    
    enableChat: function() {
      this.$('#chatSendButton').button('enable');
      var $input = this.$('#chatMessageInput');
      $input.removeClass('ui-disabled');
      $input[0].value = '';
    },
    
    disableChat: function() {
      this.$('#chatSendButton').button().button('disable');
      var $input = this.$('#chatMessageInput');
      $input.addClass('ui-disabled');
      $input[0].value = 'Chat room is empty...';
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
          this.myName = me.davDisplayName || 'Anonymous';
          this.myIcon = me.thumb || 'icons/male_thumb.jpg';
        }
        else {
          this.myName = 'Anonymous';
        }
      }
      
      var chatView = this;
      var i = 0;
      this.disableChat();
      this.roomName = this.getRoomName();
      this.chat = new DataChannel(this.roomName, {
        onopen: function(userId) {
            // to send text/data or file
          G.log(chatView.TAG, 'chat', 'connected with', userId);
          this.send(JSON.stringify({
            name: chatView.myName,
            icon: chatView.myIcon
          }));
          
          chatView.enableChat();
        },  
    
        // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
        // data ports suddenly dropped, or chat creator left
        onclose: function(event) {
          var chat = chatView.chat;
          chat.leave();
          chat.open(chatView.roomName);
        },
          
        onmessage: function(message, userid) {
          // send direct message to same user using his user-id        
          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, message));
          var data;
          try {
            data = JSON.parse(message);
          } catch (err) {
          }
          
          if (data) {
            if (!chatView.userIdToInfo[userid]) {
              chatView.userIdToInfo[userid] = data;
              chatView.addMessage({
                message: data.name + ' has entered the room',
                time: getTime(),
                senderIcon: data.icon,
                info: true
              });
            }
          }
          else {
            var userInfo = chatView.userIdToInfo[userid];
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: message,
              self: false,
              time: getTime()
            });
          }
        },
          
        onleave: function(userid) {
          // remove that user's photo/image using his user-id
          var whoLeft = chatView.userIdToInfo[userid];
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
        }
    //    ,
    //    openSignalingChannel: function(config) {
    //    
    //      var socket = io.connect('http://signaling.simplewebrtc.com:8888');
    //      socket.channel = config.channel || this.channel || 'default-channel';
    //      socket.on('message', config.onmessage);
    //      
    //      socket.send = function (data) {
    //        socket.emit('message', data);
    //      };
    //      
    //      if (config.onopen) setTimeout(config.onopen, 1);
    //      return socket;
    //    }
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
      if (atBottom) {
        $('html, body').animate({
          scrollTop: $(document).height()
        }, 200);
      }
    },
    
    sendMessage: function(e) {
      e && Events.stopEvent(e);
      var msg = this.chatInput.value;
      if (!msg || !msg.length)
        return;
      
      this.chat.send(msg);
      this.addMessage({
        sender: 'Me', //this.myName,
        senderIcon: this.myIcon,
        message: msg,
        self: true,
        time: getTime()
      });
      
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

    toggleVideo: function(e) {
      if (e.currentTarget.checked) {
        this.startVideoChat();
//        this.$('#toggleVideoBtn').find('.ui-btn-text').html('Stop Video');
        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Stop Video');
      }
      else {
//        this.$('#toggleVideoBtn').find('.ui-btn-text').html('Send Video');
        this.$('label[for="toggleVideoBtn"]').find('.ui-btn-text').html('Send Video');
        if (this.webrtc) {
//          this.stopVideo();
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
        autoRequestMedia: true
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
        debugger;
        webrtc.joinRoom(hash);
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
  