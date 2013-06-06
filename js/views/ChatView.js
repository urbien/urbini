//'use strict';
define('views/ChatView', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  // fluid width video http://css-tricks.com/NetMag/FluidWidthVideo/demo.php
  var SIGNALING_SERVER = 'http://' + G.serverName.match(/^http[s]?\:\/\/([^\/]+)/)[1] + ':8889';
  var nurseMeCallType = "http://urbien.com/voc/dev/NursMe1/Call"; // HACK for nursem
  var Voc, WebRTC;
  function getGuestName() {
    return 'Guest' + Math.round(Math.random() * 1000);
  }
  
  function toDoubleDigit(digit) {
    return digit = digit < 10 ? '0' + digit : digit;
  }

  function unbindVideoEvents(video) {
    var $video = $(video);
    _.each(G.media_events, function(e) {            
      $video.unbind(e);
    })
  }
  
  function getTimeString(date) {
    date = new Date(date);
    var hours = date.getHours();
    var ampm = hours < 12 ? 'AM' : 'PM';
    hours = hours % 12;
    return '{0}:{1}'.format(toDoubleDigit(hours), toDoubleDigit(date.getMinutes()) + ampm);
  }
  
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'restyleVideoDiv', 'onMediaAdded', 'onMediaRemoved', 'onDataChannelOpened', 'onDataChannelClosed', 'onDataChannelMessage', 'onDataChannelError'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.isWaitingRoom = U.isWaitingRoom();
      this.isPrivate = U.isPrivateChat();
      this.isAgent = this.hashParams['-agent'] === 'y';
      this.isClient = !this.isAgent;
      this.hasVideo = this.isPrivate || this.isClient; // HACK, waiting room might not have video
      this.config = {
        data: true,
        video: this.hasVideo ? {
          send: true,
          receive: true,
          preview: true
        } : false,
        audio: this.hasAudio ? {
          send: true,
          receive: true
        } : false,
        log: true,
        url: SIGNALING_SERVER
      };

      if (options.config)
        U.deepExtend(this.config, options.config);

      var vConfig = this.config.video,
          aConfig = this.config.audio;
      
      this.hasVideo = vConfig.send || vConfig.receive || vConfig.preview;
      this.hasAudio = aConfig.send || aConfig.receive;
      var readyDfd = $.Deferred();
      this.ready = readyDfd.promise();
//      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];      
      var req = ['lib/socket.io', 'lib/simplewebrtc'];      
      require(req).done(function(socketIO, rtcModule) {
        WebRTC = rtcModule;
        readyDfd.resolve();
      });
      
      this.makeTemplate('chatViewTemplate', 'template', this.modelType);
      this.makeTemplate('chatMessageTemplate', 'messageTemplate', this.modelType);
      
      this.roomName = this.getRoomName();
      this._myRequests = {};
      this._myRequestPromises = {};
      this._otherRequestPromises = {};
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

      this.myInfo = {
        name: this.myName,
        icon: this.myIcon,
        uri: this.myUri,
        isAgent: this.isAgent
      }

      var chatView = this;
      this.pageView.on('video:off', this.endChat, this);
      this.pageView.on('video:on', this.startChat, this);
      this.pageView.once('chat:on', this.startChat, this);

      this.makeTemplate('genericDialogTemplate', 'requestDialog', this.modelType);
//      this.on('active', function(active) {
//        if (active) {
//          this.unreadMessages = 0;
//          if (this.rendered) {
////            this.chat.openNewSession = function() {};
//            window.location.reload();
////            this.restartChat();
//          }
//        }
//        else
//          this.endChat();
//      }.bind(this));

      var self = this;
      this.on('active', function(active) {
        var method = active ? 'show' : 'hide';
        self.$localMedia && self.$localMedia[method]();
        self.$remoteMedia && self.$remoteMedia[method]();
      });
      
//      Events.on('endRTCCall', function(rtcCall) {
//        if (self.chat === rtcCall.connection)
//          self.endChat();
//      });
//
//      Events.on('pageChange', function() {
//        if (!self.isActive())
//          Events.trigger('localVideoMonitor:off');
//      });
      
      
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
      return this.chat.id;
    },
    
    getParticipants: function() {
      return _.clone(this.userIdToInfo);
    },
    
    getNumUnread: function() {
      return this.unreadMessages;
    },
    
    getNewPrivateRoomName: function() {
      return '_' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
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
      
      name = name.replace(/[^a-zA-Z0-9]/ig, '');
      if (this.isPrivate)
        name = 'p_' + name;
      else if (this.isWaitingRoom)
        name = 'l_' + name;
      
      return name;
    },
    
    render: function() {
      var vConfig = this.config.video;
      this.$el.html(this.template({
        video: this.hasVideo,
        audio: this.hasAudio
      }));

      this.$el.trigger('create');
      this.$('div#localMedia').hide();
//      this.$('#toggleVideoBtn').checkboxradio().checkboxradio('disable');

      if (!this.rendered)
        this.pageView.trigger('chat:on');
        
      this.$('#chatCaptureButton').button().button('disable');
      this.ready.done(function() {
        this.startChat();
        this.finish();
      }.bind(this));
    },
    
    playRingtone: function() {
      this.$('#ringtoneHolder').append("<audio id='ringtone' src='ringtone.mp3' loop='true' />");
      this.$('#ringtoneHolder').find('audio')[0].play();
    },

    stopRingtone: function() {
      this.$('#ringtoneHolder').find('audio').each(function() {
        this.pause();
        this.src = null;
      }).remove();
    },

//    loadResourceUI: function() {
//      if (this.backlinks)
//        return;
//      
//      var chatView = this;
//      require(['views/ControlPanel']).done(function(ControlPanel) {
//        var $bl = chatView.$('#inChatBacklinks');
//        chatView.addChild('backlinks', new ControlPanel({
//          isMainGroup: true,
//          model: chatView.resource,
//          el: $bl[0]
//        }));
//        
//        chatView.backlinks.render();
//        $bl.css('z-index', 100).drags();
//      });
//    },
//
//    _attachLocalVideoMonitor: function(stream) {
//      debugger;
//      var $localMonitors = this.$('#localVideoMonitor');
//      if ($localMonitors.find('video').length)
//        return;
//      
//      var video = document.createElement('video');
//      video.autoplay = true;
//      video.muted = true;
//      if (navigator.mozGetUserMedia) {
//        video.mozSrcObject = stream;
//      } else {
//        var vendorURL = window.URL || window.webkitURL;
//        video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
//      }
//      
////      video.play();
//      var self = this;
//      $localMonitors.append(video);
//      Events.on('localVideoMonitor:on', function() {
//        self.playRingtone();
//      });
//      
//      Events.on('localVideoMonitor:off', function() {
////        stream && stream.stop();
//        $localMonitors.html("");
//        self.stopRingtone();
//      });
//    },
//    
//    attachLocalVideoMonitor: function(stream) {
//      if (this.isActivePage())
//        return this._attachLocalVideoMonitor(stream);
//      
//      var self = this;
//      Events.once('pageChange', function() {
//        self._attachLocalVideoMonitor(stream);
//      });
//    },
//    
//    startLocalVideo: function() {
//      var chatView = this;
//      navigator.getMedia({
//          video: true,
//          audio: true
//        },
//        function(stream) {
//          chatView.attachLocalVideoMonitor(stream);
//          Events.trigger('localVideoMonitor:on', stream);
//        },
//        function(err) {
//          U.alert({
//            msg: "If you change your mind, enable this app to use your camera before trying again"
//          });
//          
//          chatView.endChat();
//        }
//      );
//    },
//    
//    switchToChat: function(e) {
//      this.pageView.trigger('video:fadeOut');
//    },
    
    enableChat: function() {
      this.$('#chatSendButton').button('enable');
      var $input = this.$('#chatMessageInput');
      if ($input.length) {
        $input.removeClass('ui-disabled');
        $input[0].value = '';
      }
      
      this.disabled = false;
    },
    
    disableChat: function() {
      this.$('#chatSendButton').button().button('disable');
      var $input = this.$('#chatMessageInput');
      if ($input.length) {
        $input.addClass('ui-disabled');
        $input[0].value = 'Chat room is empty...';
      }
      
      this.$remoteMedia && this.$remoteMedia.empty();
      this.disabled = true;
    },
    
    isDisabled: function() {
      return this.disabled;
    },

    removeParticipant: function(userid, options) {
      options = options || {
        data: true,
        stream: true
      };
      
      var whoLeft = this.getUserInfo(userid) || {};
      if (whoLeft) {
        if (options.stream) {          
          delete whoLeft.stream;
          delete whoLeft.blobURL;
        }
        
        if (options.data) {
          for (var prop in this.myInfo) {
            delete whoLeft[prop];
          }
        }
      }
      
//      if (whoLeft.stream) {
//        debugger;
//        this.$('video[src="{0}"]'.format(whoLeft.blobURL)).remove().each(function() {
//          unbindVideoEvents(this);
//          this.pause();
//          $(this).remove();
//        });
//
//        this.pageView.trigger('video:off');
//      }
      
      if (!_.size(whoLeft)) {
//        var conv = this.chat.pcs[userid];
//        if (conv)
//          conv.end();
        
        delete this.userIdToInfo[userid];
        this._updateParticipants();
        var dfd = this._otherRequestPromises[userid];
        if (dfd) {
          dfd.resolve()
          delete this._otherRequestPromises[userid];
        }
        
        this.pageView.trigger('chat:participantLeft', userid);
      }
      
      if (options.stream && this.rtcCall)
        Events.trigger('endRTCCall', this.rtcCall);      
    },

    addParticipant: function(userInfo) {
      var userid = userInfo.id;
      var existing = this.getUserInfo(userid);
      var isUpdate = !!existing                  && 
          ((userInfo.stream && !existing.stream) || // we already opened the data channel, but haven't gotten the remote stream yet
          (userInfo.uri && !existing.uri));         // we already got the remote stream, but haven't opened the data channel yet
      
      if (isUpdate)
        _.extend(existing, userInfo);
      else
        this.userIdToInfo[userid] = userInfo;
      
      this._updateParticipants();
      if (userInfo.justEntered) {
        this.addMessage({
          message: '<i>{0} has entered the room</i>'.format(userInfo.name),
          time: +new Date(), //getTime(),
          senderIcon: userInfo.icon,
          info: true,
          sender: userInfo.name
        });
      }
      
      if (!isUpdate)
        this.pageView.trigger('chat:newParticipant', userInfo);
    },
    
    _updateParticipants: function() {
      this.participants = _.keys(this.userIdToInfo);
    },
    
    sendUserInfo: function(options) {
      this.chat.send({
        userInfo: _.extend(this.myInfo, options || {})
      });
    },

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
    
    sendPrivateMessage: function(to, data) {
      data['private'] = true;
      data.time = data.time || +new Date();
      this.chat.sendData(to, data);
    },

    sendPublicMessage: function(data) {
      data.time = data.time || +new Date();
      this.chat.broadcastData(data);
    },

    sendMessage: function(message) {
      var text = message.message;
//      var channel = message.channel;
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
        time: +new Date()
//      , //getTime(),
//        'private': !!channel
      });
    },
    
    _sendMessage1: function(e) {
      e && Events.stopEvent(e);
      var msg = this.chatInput.value;
      if (!msg || !msg.length)
        return;

      this.sendMessage({
        message: msg
      });
      
      this.chatInput.value = '';
    },

    _sendMessage: function(e) {
      e && Events.stopEvent(e);
      var msg = this.chatInput.value;
      if (!msg || !msg.length)
        return;

      this.sendPublicMessage({message: msg});
      this.addMessage({
        sender: 'Me', //this.myName,
        senderIcon: this.myIcon,
        message: msg,
        self: true
      });
      
      this.chatInput.value = '';
    },

    handleResponse: function(data) {
      var reqId = this.getRequestId(data);
      var dfd = this._myRequestPromises[reqId] || this._otherRequestPromises[reqId];
      if (dfd) {
        if (data.response.granted)
          dfd.resolve(data);
        else
          dfd.notifyWith(data);
      }
    },
    
    getRequestId: function(data) {
      return data.response ? data.response.request : data.request.id;
    },
    
    request: function(options, to) {
      var reqId = G.nextId(),
          self = this,
          msg = {
            request: _.extend({
              id: reqId
            }, options)
          };
      
      if (to)
        msg.to = to;
      
      this._myRequests[reqId] = msg.request;
      if (to)
        this.sendPrivateMessage(to, msg);
      else
        this.sendPublicMessage(msg);
      
      var dfd = $.Deferred();
      dfd.done(function() {
        delete self._myRequestPromises[reqId];
      });
      
      this._myRequestPromises[reqId] = dfd;
      return dfd.promise();
    },
    
    startChat: function() {
      var args = arguments, self = this;
      this.ready.done(function() {
        self._startChat.apply(self, args);
      });
    },
    
//    openChat: function() {
//      this.chat.open(this.roomName, {
//        _userid: this.myInfo._userid
//      });
//    },
//    
//    restartChat: function() {
//      this.chat = new RTCMultiConnection(this.roomName, this.chatSettings);
//      this.chat.openNewSession(false);
//    },
    
    _startChat: function(options) {
      if (this.chat)
        return;
      
      var self = this,
          roomName = this.getRoomName(),
          config = this.config,
          aConfig = config.audio,
          vConfig = config.video;
      
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
            self.$sendMessageBtn.trigger('click');
          }
        });
        
        this.$localMedia = this.$('div#localMedia');
        this.$remoteMedia = this.$('div#remoteMedia');
      }
      
      var i = 0;
      this.disableChat();
      this.connected = false;
      var cachedStream = G.localVideoMonitor;
      if (this.hasVideo || this.hasAudio) {
        _.extend(this.config, {
          local: !vConfig.preview && !vConfig.send ? null : { // no such thing as local audio
            _el: self.$localMedia[0],
            autoplay: true,
            muted: true
          },
          remote: !vConfig.receive && !aConfig.receive ? null : {
            _el: self.$remoteMedia[0],
            autoplay: true
          },
          autoRequestMedia: (vConfig.preview || vConfig.send || aConfig.send) && !cachedStream
        });
      }
      
      var webrtc = this.chat = new WebRTC(this.config),
          conversations = webrtc.pcs;
      
      webrtc.on(this.hasVideo || this.hasAudio ? 'readyToCall' : 'readyToText', _.once(function() {
        webrtc.joinRoom(roomName);
      }));

      webrtc.on('mediaAdded', this.onMediaAdded);
      webrtc.on('mediaRemoved', this.onMediaRemoved);

      // Data channel events
      if (this.config.data !== false) {
        webrtc.on('open', this.onDataChannelOpened);
        webrtc.on('close', this.onDataChannelClosed);
        webrtc.on('message', this.onDataChannelMessage);
        webrtc.on('error', this.onDataChannelError);
      }
      
      if (this.hasVideo && cachedStream)
        webrtc.startLocalMedia(cachedStream);
      
      $(window).unload(function() {
        self.endChat();
      });
      
      if (this.hasVideo)
        this.pageView.trigger('video:on');
    },

    onDataChannelOpened: function(event, conversation) {
      var info = _.clone(this.myInfo),
          self = this;
      
      if (!this.connected) {
        this.connected = true;
        info.justEntered = true;
      }
      
      this.sendPrivateMessage(conversation.id, {
        userInfo: info
      });
      
      if (this.isWaitingRoom && this.isClient) {
        this.request({
          title: 'Hi, can someone help me please?',
          type: 'service'
        }).done(function(responseData) {
          // request has been granted
          self.leave();
          var from = responseData.from;
          var privateRoom = responseData.response.privateRoom;
          Events.trigger('navigate', U.makeMobileUrl('chatPrivate', privateRoom), {replace: true, transition: 'none'});
        }).progress(function(responseData) {
          // request has been denied by responseData.from, or anonymously if responseData.from is undefined
//          debugger;
        });
      }
      
      this.connected = true;
      this.enableChat();
    },

    onDataChannelClosed: function(event, conversation) {
//      debugger;
      var channel = event.target,
          whoLeftId = conversation.id;
          whoLeft = this.getUserInfo(whoLeftId);
          
      if (whoLeft) {
        if (this.isPrivate && this.isClient)
          this.endCall();
      
        if (!whoLeft.name)
          debugger;
        else {
          this.addMessage({
            message: '<i>{0} has left the room</i>'.format(whoLeft.name),
            time: +new Date(), //getTime(),
            senderIcon: whoLeft.icon,
            sender: whoLeft.name,
            info: true
          });
        }
        
        this.removeParticipant(whoLeftId, {
          data: true
        });
      }
    },
    
    onDataChannelMessage: function(event, conversation) {
      var channel = event.target,
          data = JSON.parse(event.data),
          from = conversation.id,
          userInfo;
      
      if (this.isDisabled())
        this.enableChat();
      
      data.from = from;
      var userInfo = this.getUserInfo(from);
//      G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(extra._userid, JSON.stringify(data)));
      var isPrivate = !!data['private'];
      if (data.userInfo) {
        userInfo = data.userInfo;
        userInfo.id = from;
        this.addParticipant(userInfo);
      }        
      else if (data.response) {
        this.handleResponse(data);
        return;
      }
      else if (data.request) {
        var req = data.request;
        switch (req.type) {
          case 'info':
            this.sendUserInfo();
            break;
          case 'service':
            if (userInfo && this.isAgent) {
              var $dialog = this.showRequestDialog(data);
              var dfd = this._otherRequestPromises[req.id] = $.Deferred();
              dfd.done(function() {
                delete this._otherRequestPromises[req.id];
                if ($dialog.parent())
                  $dialog.popup('close'); // check if it's not closed already
              });
            }
            
            break;
        }
        
        return;
      }
      else if (data.message) {
        if (!userInfo) {
          debugger;
          this.request({
            type: 'info'
          }, from);
          
          debugger;
          return; // TODO: append message after getting info
        }
        
        this.addMessage({
          senderIcon: userInfo.icon,
          sender: userInfo.name,
          message: data.message,
          'private': isPrivate,
          self: false,
          time: +new Date() //getTime()
        });
        
        if (!this.isActive())
          this.unreadMessages++;
      }
    },
    
    onDataChannelError: function(event) {
      debugger;
      var channel = event.target;
    },
    
    onMediaAdded: function(info, conversation) {
      if (info.type == 'local') {
        if (this.isWaitingRoom) // local media can only be video
          Events.trigger('localVideoMonitor:on', info.stream);
        
        this.processLocalMedia.apply(this, arguments);
      }
      else {
        this.processRemoteMedia.apply(this, arguments);
      }
    },
    
    /** 
     * local media can only be video
     */
    processLocalMedia: function(info, conversation) {
      var video = info.media;
      this.localStream = info.stream;
      this.pageView.trigger('video:on');
      this.checkVideoSize(video);
      var $local = this.$localMedia.find('video');
      if ($local.length > 1) { // HACK to get rid of accumulated local videos if such exist (they shouldn't)
        for (var i = 0; i < $local.length; i++) {
          var v = $local[i];
          if (v !== video)
            $(v).remove();
        }
      }

//      $("#localVideoMonitor video").animate({left:video.left, top:video.top, width:video.width, height:video.height}, 1000, function() {        
        video.muted = true;
        video.controls = false;
        video.play();
        $(video).addClass('localVideo');
        this.$localMedia.show();
        this.restyleVideos();
//      });
        
      if (!this.isWaitingRoom)
        Events.trigger('localVideoMonitor:off');
      
      this.monitorVideoHealth(video);
    },

    processRemoteMedia: function(info, conversation) {
      var self = this,
          media = info.media,
          stream = info.stream;

      var alreadyStreaming = U.filterObj(this.userIdToInfo, function(id, info) {
        return !!info.stream;
      });
      
      for (var id in alreadyStreaming) {
        this.removeParticipant(id, {
          stream: true
        });
      }
      
      this.addParticipant({
        id: conversation.id,
        stream: stream,
        blobURL: media.src || media.mozSrcObject
      });
      
      media.controls = false;
      this.$remoteMedia.show();
      if (media.tagName === 'VIDEO') {
        this.pageView.trigger('video:on');
        this.checkVideoSize(media);
        $(media).addClass('remoteVideo');
        this.restyleVideos();
        this.monitorVideoHealth(media);
      }
      else {
        // audio only
        media.width = 0;
        media.height = 0;
      }
      
      media.play();
    },

    onMediaRemoved: function(info, conversation) {
      if (info.type == 'local') {
        debugger;
      }
      else {
        this.removeParticipant(conversation.id, {
          stream: true
        });
      }
    },
    
//    initChat1: function() {
//      this.chatSettings = {
//          channel: this.roomName,
////          session: session,
//          
//          session: this.hasVideo ? (G.navigator.isFirefox ? RTCSession.AudioVideo : RTCSession.AudioVideoData) : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
////          session: {
////            video: this.hasVideo,
////            audio: this.hasVideo || this.hasAudio,
////            data: !this.waitingRoom
////          },
//          //session: this.hasVideo ? RTCSession.AudioVideoData : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
//          onopen: function(from) {
////            debugger;
//              // to send text/data or file
////            chatView._checkChannels();
//            chatView.sendUserInfo({
//              justEntered: !chatView.connected
//            });
//            
//            if (chatView.isWaitingRoom && chatView.isClient) {
//              chatView.request({
//                title: 'Hi, can someone help me please?',
//                type: 'service'
//              }).done(function(responseData) {
//                // request has been granted
//                chatView.leave();
//                var from = responseData.from;
//                var privateRoom = responseData.response.privateRoom;
//                Events.trigger('navigate', U.makeMobileUrl('chatPrivate', privateRoom, {'-create': 'y'}), {replace: true, transition: 'none'});
//              }).progress(function(responseData) {
//                // request has been denied by responseData.from, or anonymously if responseData.from is undefined
////                debugger;
//              });
//            }
//            
//            chatView.connected = true;
//            chatView.enableChat();
//          },  
//      
//          // error to open data ports
//          onerror: function(event) {
//            debugger;
//          },
//          
//          // data ports suddenly dropped, or chat creator left
//          onclose: function(event) {
//            if (chatView.isPrivate && chatView.isClient && G.pageRoot.toLowerCase() == 'app/nursme1')
//              chatView.endCall();
////            if (!_.size(chatView.userIdToInfo)) {
////              chatView.endChat(true);
////            }
//          },
//            
//          onmessage: function(data, extra) {
////            debugger;
//            if (extra.extra)
//              debugger;
//            // send direct message to same user using his user-id
////            chatView._checkChannels();
//            if (chatView.isDisabled())
//              chatView.enableChat();
//            
//            var from = extra._userid;
//            data.from = from;
//            var userInfo = chatView.getUserInfo(from);
////            G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(extra._userid, JSON.stringify(data)));
//            var isPrivate = !!data.to;
//            if (data.userInfo) {
//              userInfo = data.userInfo;
//              chatView.addParticipant(userInfo);
//            }
//            else if (isPrivate && data.to !== chatView.myId) // private message for data.to
//              return;            
//            
//            if (data.response) {
//              chatView.handleResponse(data);
//              return;
//            }
//            else if (data.request) {
//              var req = data.request;
//              switch (req.type) {
//                case 'info':
//                  chatView.sendUserInfo();
//                  break;
//                case 'service':
//                  if (userInfo && chatView.isAgent) {
//                    var $dialog = chatView.showRequestDialog(data);
//                    var dfd = chatView._otherRequestPromises[req.id] = $.Deferred();
//                    dfd.done(function() {
//                      delete chatView._otherRequestPromises[req.id];
//                      if ($dialog.parent())
//                        $dialog.popup('close'); // check if it's not closed already
//                    });
//                  }
//                  
//                  break;
//              }
//              
//              return;
//            }
//            else if (data.message) {
//              if (!userInfo) {
//                this.chat.send({
//                  to: userid,
//                  request: {
//                    type: 'info'
//                  }
//                });
//                
//                debugger;
//                return; // TODO: append message after getting info
//              }
//              
//              chatView.addMessage({
//                senderIcon: userInfo.icon,
//                sender: userInfo.name,
//                message: data.message,
//                'private': isPrivate,
//                self: false,
//                time: +new Date() //getTime()
//              });
//              
//              if (!chatView.isActive())
//                chatView.unreadMessages++;
//            }
//          },
//            
//          onleave: function(data, extra) {
////            debugger;
//            // remove that user's photo/image using his user-id
//            extra = extra._userdid ? extra : extra.extra ? extra.extra : extra;
////            chatView._checkChannels();          
//            var whoLeft = chatView.getUserInfo(extra._userid);
//            if (chatView.isPrivate && chatView.isClient && G.pageRoot.toLowerCase() == 'app/nursme1')
//              chatView.endCall();
//
//            if (whoLeft) {
//              chatView.addMessage({
//                message: '<i>{0} has left the room</i>'.format(whoLeft.name),
//                time: +new Date(), //getTime(),
//                senderIcon: whoLeft.icon,
//                sender: whoLeft.name,
//                info: true
//              });
//              
//              chatView.removeParticipant(whoLeft._userid);
//            }
//          },
//          
//          openSignalingChannel: function (config) {
//            var channel = config.channel || this.channel || 'default-urbien-channel';  
//            io.connect(SIGNALING_SERVER).emit('new-channel', {
//              channel: channel,
//              sender : chatView.myId
//            });
//    
//            var socket = io.connect(SIGNALING_SERVER + '/' + channel);
//            socket.channel = channel;
//            socket.on('connect', function () {
//              if (config.callback) config.callback(socket);
////                if (config.onopen) config.onopen(socket);
//            });
//    
//            socket.send = function (message) {
//              socket.emit('message', {
//                sender: chatView.myId,
//                data  : message
//              });
//            };
//    
//            socket.on('message', config.onmessage);
//            return socket;
//          },
//
//          onstream: function(data) {
//            if (data.extra && data.extra.extra)
//              debugger;
//            
//            var method = data.type === 'local' ? 'onLocalStream' : 'onRemoteStream';
//            this[method].apply(this, arguments);
//          },
//          
//          onLocalStream: function(data){
//            var $videos = chatView.$localMedia.find('video');
//            var video = data.mediaElement;
//            if ($videos.length)
//              $videos.replaceWith(video);
//            else
//              chatView.$localMedia.append(video);
//            
//            chatView.onAppendedLocalVideo(video, data.stream);
//          },
//          
//          onRemoteStream: function(data) {
////            debugger;
//            var userid = data.extra._userid,
//                userInfo = userid && chatView.getUserInfo(userid),
//                media = data.mediaElement,
//                stream = data.stream,
//                existing = chatView.$remoteMedia.find('video[src="{0}"]'.format(data.blobURL));
//            
//            if (userInfo) {
//              userInfo.media = media;
//              userInfo.stream = stream;
//              userInfo.blobURL = data.blobURL;
//            }
//            
//            if (existing.length)
//              existing.replaceWith(media);
//            else
//              chatView.$remoteMedia.append(media);
//            
//            chatView.onAppendedRemoteVideo(media);
//            var title = chatView.getPageTitle();
//            chatView.rtcCall = {
//              connection: chatView.chat,
//              url: window.location.href,
//              title: 'Call in progress' + (title ? ': ' : '') + title
//            };
//            
//            Events.trigger('newRTCCall', chatView.rtcCall);
//            
//            // HACK for NursMe
//            if (chatView.isPrivate && chatView.isClient && G.pageRoot.toLowerCase() == 'app/nursme1')
//              chatView.makeCall();
//          },
//          
//          onNewSession: function(session) {
//            if (!chatView.isActive())
//              return false;
//            
//            if (chatView.chatSession && chatView.chatSession.sessionid == session.sessionid)
//              return false;
//
//            chatView.chatSession = session;
//            this.joinedARoom = true;
//            this.join(session, chatView.myInfo);
//          },
//          
//          openNewSession: function(isOpenNewSession) {
//            if (isOpenNewSession) {
//              if (this.isNewSessionOpened || chatView.chatSession) 
//                return;
//              
//              this.isNewSessionOpened = true;
//
//              if (!this.joinedARoom) { 
//                chatView.openChat();
//              }
//              
//              return;
//            }
//
//            this.connect();
//            setTimeout(function () {
//              chatView.chat && chatView.chat.openNewSession(true);
//            }, 5000);
//          },
//          reset: function() {
////            debugger;
//            this.isNewSessionOpened = this.joinedARoom = false;
//          }
//          ,
//          _stream: G.localVideoMonitor
////          ,
////          transmitRoomOnce: true
//        }
//        
////        this.chat = new RTCMultiConnection(this.roomName);//, this.chatSettings);
//        this.chat = new RTCMultiConnection(this.roomName, this.chatSettings);
////        _.extend(this.chat, this.chatSettings);
//          
//        var create = false;//this.hashParams['-create'] === 'y' || (this.isWaitingRoom && this.isAgent);
//        if (create) {
//          var orgHash = U.getHash(),
//              hash = U.replaceParam(orgHash, {'-create': null});
//          
//          if (hash != orgHash)
//            Events.trigger('navigate', hash, {replace: true, trigger: false}); // don't create room on refresh (assume you're refreshing cause you lost the connection)
//        }
//        
//        this.chat.openNewSession(create);
//        this.enableChat();
//        
//        $(window).unload(function() {
//          chatView.endChat();
//        });
//        
//        if (this.hasVideo)
//          this.pageView.trigger('video:on');
//    },
    
    leave: function() {
//      this.chat && this.chat.leave();
      this.chat && this.chat.leaveRoom();
    },

    endChat: function(onclose) {
      this.leave();
      this.chat = null;
      if (this.hasVideo) {
        this._videoOn = false;
        this.$('video').each(function() {
          unbindVideoEvents(this);
          this.pause();
        }).remove();
        
        this.$localMedia && this.$localMedia.empty();
        this.$remoteMedia && this.$remoteMedia.empty();
        this.localStream && this.localStream.stop();
      }
    },

    monitorVideoHealth: function(video) {
      var $video = $(video), chatView = this;
      _.each(["suspend", "abort", "error", "ended", "pause"], function(event) {
        $video.bind(event, function() {
          if ((event.type || event) == "pause") {
            video.play();
            return;
          }
          
          var isLocal = $video.parents('#localVideo');
          $video.remove();
        });
      });
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
//      this.$localMedia.drags();
    },
    
    restyleVideos: function() {
      var chatView = this,
          $locals = chatView.$localMedia;
      
      var numRemotes = chatView.$remoteMedia.find('video').length;
      if (numRemotes == 1 && !chatView.$localMedia.hasClass('myVideo-overlay'))
        $locals.addClass('myVideo-overlay');
//      else
//        $locals.removeClass('myVideo-overlay');
      
      this.restyleVideoDiv();
    },
    
    engageClient: function(data) {
      var request = data.request,
          from = data.from,
          userInfo = this.getUserInfo(from),
          userUri = userInfo.uri,
          response = {
            granted: true,
            request: request.id
          };
        
      var isServiceReq = this.isWaitingRoom && request.type == 'service';
      if (isServiceReq) {
        response.privateRoom = userUri;
        this.sendPrivateMessage(from, {
          response: response
        });
        
        // give the client time to setup the room 
//        setTimeout(function() {          
          this.leave(); // leave waitingRoom
          Events.trigger('navigate', U.makeMobileUrl('chatPrivate', response.privateRoom, {'-agent': 'y'}), {replace: true});   
//        }.bind(this), 1000);
      }
      else {
        this.chat.send({
          response: response
        });
      }
//        chatView.pageView.trigger('video:on');
    },
    
    showRequestDialog: function(data) {
      this.playRingtone();
      var request = data.request;
      var userInfo = this.getUserInfo(data.from);
      var chatView = this;
      var id = 'chatRequestDialog';
      $('#' + id).remove();
      var popupHtml = this.requestDialog({
        id: id,
//        title: userInfo.name + ' is cold and alone and needs your help',
        header: 'Service Request',
        img: userInfo.icon,
        title: request.title,
        ok: 'Accept',
        cancel: 'Decline'
      });
      
//      $('.ui-page-active[data-role="page"]').find('div[data-role="content"]').append(popupHtml);
      this.$el.append(popupHtml);
//      $.mobile.activePage.append(popupHtml).trigger("create");
      var $popup = $('#' + id);
      $popup.find('[data-cancel]').click(function(e) {
        Events.stopEvent(e);
        chatView.stopRingtone();
        chatView.sendPrivateMessage(data.from, {
          response: {
            granted: false,
            request: request.id
          }
        });
      });
      
      $popup.find('[data-ok]').click(function(e) {
        chatView.stopRingtone();
        Events.stopEvent(e);
        chatView.engageClient(data);
      });
  
      $popup.trigger('create');
      $popup.popup().popup("open");
      return $popup;
    },
    
    makeCall: function() {
      var self = this,
          nurseInfo = this.userIdToInfo[U.getFirstProperty(this.userIdToInfo)];
      
      if (!nurseInfo)
        return;
      
      require('vocManager').done(function(V) {
        Voc = V;
        Voc.getModels(nurseMeCallType).done(function() {
          var callModel = U.getModel(nurseMeCallType);
          self.call = new callModel({
            complaint: 'stomach hurts',
            nurse: nurseInfo.uri
          });
          
          self.call.save();
        });
      });
    },
    
    endCall: function() {
      var nurseInfo = this.userIdToInfo[U.getFirstProperty(this.userIdToInfo)];
      if (!nurseInfo || !this.call)
        return;
      
      self.call.save({
        end: +new Date()
      });
    }
  },
  {
    displayName: 'Chat'
  });
});
  