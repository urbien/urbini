//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  var WebRTC;
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
      var req = ['lib/socket.io', 'lib/DataChannel'];
      if (this.hasVideo)
        req.push('lib/simplewebrtc');
      
      U.require(req).done(function(io, DC, simpleWebRTC) {
        WebRTC = simpleWebRTC;
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
        this.startTextChat();
        this.hasVideo && this.startVideoChat();
      }
    },
    
    startTextChat: function() {
      var channel = new DataChannel('default-channel', {
        // to create/open a new channel
  //      channel.open(encodeURIComponent(this.hash));
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
  //        channel.channels[userid].send('cool!');
        },
        
        onleave: function(userid) {
          // remove that user's photo/image using his user-id
          debugger;
        }
//        ,
//        openSignalingChannel: function(config) {
//        
//          var socket = io.connect('http://signaling.simplewebrtc.com:8888');
//          socket.channel = config.channel || this.channel || 'default-channel';
//          socket.on('message', config.onmessage);
//          
//          socket.send = function (data) {
//            socket.emit('message', data);
//          };
//          
//          if (config.onopen) setTimeout(config.onopen, 1);
//          return socket;
//        }
      });
      
//      channel.open('urbien-channel');
//      channel.connect('urbien-channel');
    
//      // if soemone already created a channel; to join it: use "connect" method
//      channel.connect('channel-name');
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
        debugger;
      });
      
      webrtc.on('readyToCall', function () {
        // you can name it anything
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
  