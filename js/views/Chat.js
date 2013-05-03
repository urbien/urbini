//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
//  var WebRTC;
  
//  var headID = document.getElementsByTagName("head")[0];         
//  var newScript = document.createElement('script');
//  newScript.type = 'text/javascript';
//  newScript.src = 'http://simplewebrtc.com/latest.js';//
//  headID.appendChild(newScript);
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
      _.bindAll(this, 'render', 'resizeVideo'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.hasVideo = options.video;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
//      var req = ['lib/socket.io', 'lib/DataChannel'];
      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];
      if (this.hasVideo)
        req.push('lib/simplewebrtc');
      
      U.require(req).done(function(io, DC, simpleWebRTC) {
        WebRTC = window.WebRTC || simpleWebRTC;
        this.readyDfd.resolve();
      }.bind(this));
      
      this.makeTemplate('chatTemplate', 'template', this.vocModel.type);
      this.autoFinish = false;
    },
    events : {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo'
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
        this.startChat();
//        this.startTextChat();
//        this.hasVideo && this.startVideoChat();
      }
    },
    
//    startTextChat: function() {
//      var chatView = this;
//      var i = 0;
//      var channel = new DataChannel('urbien-channel', {
//        onopen: function(userId) {
//            // to send text/data or file
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
//          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, message));
//          if (i++ < 10)
//            channel.send(message + i);
//  //        channel.channels[userid].send('cool!');
//        },
//          
//        onleave: function(userid) {
//          // remove that user's photo/image using his user-id
//          debugger;
//        }
////        ,
////        openSignalingChannel: function(config) {
////        
////          var socket = io.connect('http://signaling.simplewebrtc.com:8888');
////          socket.channel = config.channel || this.channel || 'default-channel';
////          socket.on('message', config.onmessage);
////          
////          socket.send = function (data) {
////            socket.emit('message', data);
////          };
////          
////          if (config.onopen) setTimeout(config.onopen, 1);
////          return socket;
////        }
//      });
//      
////      channel.open('urbien-channel');
////      channel.connect('urbien-channel');
//    
////      // if soemone already created a channel; to join it: use "connect" method
////      channel.connect('channel-name');
//    },

    startChat: function(options) {
      var chatView = this;
      var i = 0;
//      var channel = new RTCMultiConnection('urbien', {
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
//  //        channel.channels[userid].send('cool!');
//        },
//          
//        onleave: function(userid) {
//          // remove that user's photo/image using his user-id
//          debugger;
//        },
//        
//        onstream: function(stream){
//          debugger;
////          var video = stream.mediaElement;
////
////          // it is extra data passed from remote peer
////          if (stream.type === 'remote') {
////            var extra = stream.extra;
////            video.poster = extra.username;
////          }
//          if (stream.type === 'local') {
//            mainVideo.src = stream.blobURL;
//          }
//  
//          if (stream.type === 'remote') {
//            document.body.appendChild(stream.mediaElement);
//          }
//        }
//      });
      
      var channelName = 'urbien';
      var settings = {
        channel: channelName,
        session: this.hasVideo ? RTCSession.AudioVideo : this.hasAudio ? RTCSession.Audio : RTCSession.Data,
        onopen: function(userId) {
            // to send text/data or file
          debugger;
          channel.send('first msg');        
        },  
    
          // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
          // data ports suddenly dropped
        onclose: function(event) {
          debugger;
        },
          
        onmessage: function(message, userid) {
          // send direct message to same user using his user-id        
          debugger;
          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(userid, message));
          if (i++ < 10)
            channel.send(message + i);
    //        channel.channels[userid].send('cool!');
        },
          
        onleave: function(userid) {
          // remove that user's photo/image using his user-id
          debugger;
        },
        
        onstream: function(stream){
    //      // it is extra data passed from remote peer
    //      if (stream.type === 'remote') {
    //        var extra = stream.extra;
    //        video.poster = extra.username;
    //      }
          
          if (stream.type === 'local') {
            var local = chatView.$('div#localVideo');
            var localVideos = local.find('video');
            if (localVideos.length)
              localVideos.replaceWith(stream.mediaElement);
            else
              local.append(stream.mediaElement);
          }
    
          if (stream.type === 'remote') {
            var existing = chatView.$('div#remoteVideos video[src="{0}"]'.format(stream.blobURL));
            if (existing.length)
              existing.replaceWith(stream.mediaElement);
            else
              chatView.$('div#remoteVideos').append(stream.mediaElement);
          }
        }
      }
      
      var channel = new RTCMultiConnection(channelName, settings);
      channel.open();
    },

    startVideoChat: function() {
      var webrtc = new WebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: 'remoteVideos',
        // immediately ask for camera access
        autoRequestMedia: true
      });
      
      // we have to wait until it's ready
      var hash = this.hash;
      webrtc.on('readyToCall', function () {
        // you can name it anything
        debugger;
        webrtc.joinRoom(hash);
        self.$('div#localVideo video')[0].muted = true;
      });
    },
    
    resizeVideo: function() {
      
    }
  },
  {
    displayName: 'Chat'
  });
});
  