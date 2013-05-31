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
      _.extend(this, _.pick(options, 'autoVideo'));
      this.isWaitingRoom = U.isWaitingRoom();
      this.isPrivate = U.isPrivateChat();
      this.isAgent = this.hashParams['-agent'] === 'y';
      this.isClient = this.isWaitingRoom && !this.isAgent;
      this.hasVideo = this.autoVideo || this.isPrivate; // HACK, waiting room might not have video
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];      
      U.require(req).done(this.readyDfd.resolve);
      
      this.makeTemplate('chatViewTemplate', 'template', this.modelType);
      this.makeTemplate('chatMessageTemplate', 'messageTemplate', this.modelType);
      
      this.roomName = this.getRoomName();
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
        self.$localVids && self.$localVids[method]();
        self.$remoteVids && self.$remoteVids[method]();
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
      return this.myInfo._userid;
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
        
      this.$('#chatCaptureButton').button().button('disable');
      this.ready.done(function() {
        if (this.isWaitingRoom && this.isClient)
          this.startLocalVideo();
        else if (G.localVideoMonitor)
          this.attachLocalVideoMonitor(G.localVideoMonitor);
        
//        if (this.resource)
//          this.loadResourceUI();
        
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

    _attachLocalVideoMonitor: function(stream) {
      var $localMonitors = this.$('#localVideoMonitor');
      if ($localMonitors.find('video').length)
        return;
      
      var video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      if (navigator.mozGetUserMedia) {
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
      }
      
//      video.play();
      var self = this;
      $localMonitors.append(video);
      Events.on('localVideoMonitor:on', function() {
        self.playRingtone();
      });
      
      Events.on('localVideoMonitor:off', function() {
        stream && stream.stop();
        $localMonitors.html("");
        self.stopRingtone();
      });
    },
    
    attachLocalVideoMonitor: function(stream) {
      if (this.isActivePage())
        return this._attachLocalVideoMonitor(stream);
      
      var self = this;
      Events.once('pageChange', function() {
        self._attachLocalVideoMonitor(stream);
      });
    },
    
    startLocalVideo: function() {
      var chatView = this;
      navigator.getMedia({
          video: true,
          audio: false
        },
        function(stream) {
          chatView.attachLocalVideoMonitor(stream);
          Events.trigger('localVideoMonitor:on', stream);
        },
        function(err) {
          U.alert({
            msg: "If you change your mind, enable this app to use your camera before trying again"
          });
          
          chatView.endChat();
        }
      );
    },
    
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

//        this.pageView.trigger('video:off');
      }
      
      if (this.rtcCall)
        Events.trigger('endRTCCall', this.rtcCall);
      
//      // HACK: need to figure out why sometimes videos don't get removed
//      this.$('#remoteVideos video').each(function() {
//        if (this.videoWidth < 10)
//          $(this).remove();
//      });
//      // END HACK
      
      delete this.userIdToInfo[userid];
//      if (!_.size(this.userIdToInfo)) {
//        this.disableChat();
//        this.endChat();
//      }
    
      this._updateParticipants();
      var dfd = this._otherRequestPromises[userid];
      if (dfd) {
        dfd.resolve()
        delete this._otherRequestPromises[userid];
      }
      
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
    
    _sendMessage: function(e) {
      e && Events.stopEvent(e);
      var msg = this.chatInput.value;
      if (!msg || !msg.length)
        return;

      this.sendMessage({message: msg});
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
      var reqId = this.myId + '_' + G.nextId(),
          self = this,
          msg = {
            request: _.extend({
              id: reqId
            }, options)
          };
      
      if (to)
        msg.to = to;
      
      this.chat.send(msg);
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
        
        session: this.hasVideo ? (G.navigator.isFirefox ? RTCSession.AudioVideo : RTCSession.AudioVideoData) : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
//        session: {
//          video: this.hasVideo,
//          audio: this.hasVideo || this.hasAudio,
//          data: !this.waitingRoom
//        },
        //session: this.hasVideo ? RTCSession.AudioVideoData : this.hasAudio ? RTCSession.AudioData : RTCSession.Data,
        onopen: function(from) {
//          debugger;
            // to send text/data or file
//          chatView._checkChannels();
          chatView.sendUserInfo({
            justEntered: !chatView.connected
          });
          
          if (chatView.isWaitingRoom && chatView.isClient) {
            chatView.request({
              title: 'Hi, can someone help me please?',
              type: 'service'
            }).done(function(responseData) {
              // request has been granted
              chatView.leave();
              var from = responseData.from;
              var privateRoom = responseData.response.privateRoom;
              Events.trigger('navigate', U.makeMobileUrl('chatPrivate', privateRoom), {replace: true, transition: 'none'});
            }).progress(function(responseData) {
              // request has been denied by responseData.from, or anonymously if responseData.from is undefined
              debugger;
            });
          }
          
          chatView.connected = true;
          chatView.enableChat();
        },  
    
        // error to open data ports
        onerror: function(event) {
          debugger;
        },
        
        // data ports suddenly dropped, or chat creator left
        onclose: function(event) {
//          if (!_.size(chatView.userIdToInfo)) {
//            chatView.endChat(true);
//          }
        },
          
        onmessage: function(data, extra) {
//          debugger;
          if (extra.extra)
            debugger;
          // send direct message to same user using his user-id
//          chatView._checkChannels();
          if (chatView.isDisabled())
            chatView.enableChat();
          
          var from = extra._userid;
          data.from = from;
          var userInfo = chatView.getUserInfo(from);
//          G.log(chatView.TAG, 'chat', 'message from {0}: {1}'.format(extra._userid, JSON.stringify(data)));
          var isPrivate = !!data.to;
          if (data.userInfo) {
            userInfo = data.userInfo;
            chatView.addParticipant(userInfo);
          }
          else if (isPrivate && data.to !== chatView.myId) // private message for data.to
            return;            
          
          if (data.response) {
            chatView.handleResponse(data);
            return;
          }
          else if (data.request) {
            var req = data.request;
            switch (req.type) {
              case 'info':
                chatView.sendUserInfo();
                break;
              case 'service':
                if (chatView.isAgent) {
                  var $dialog = chatView.showRequestDialog(data);
                  var dfd = chatView._otherRequestPromises[req.id] = $.Deferred();
                  dfd.done(function() {
                    delete chatView._otherRequestPromises[req.id];
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
              this.chat.send({
                to: userid,
                request: {
                  type: 'info'
                }
              });
              
              debugger;
              return; // TODO: append message after getting info
            }
            
            chatView.addMessage({
              senderIcon: userInfo.icon,
              sender: userInfo.name,
              message: data.message,
              'private': isPrivate,
              self: false,
              time: +new Date() //getTime()
            });
            
            if (!chatView.isActive())
              chatView.unreadMessages++;
          }
        },
          
        onleave: function(data, extra) {
//          debugger;
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
          
          chatView.onAppendedLocalVideo(video, data.stream);
        },
        
        onRemoteStream: function(data) {
//          debugger;
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
          var title = chatView.getPageTitle();
          chatView.rtcCall = {
            connection: chatView.chat,
            url: window.location.href,
            title: 'Call in progress' + (title ? ': ' : '') + title
          };
          
          Events.trigger('newRTCCall', chatView.rtcCall);
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
//          debugger;
          this.isNewSessionOpened = this.joinedARoom = false;
        }
//        ,
//        transmitRoomOnce: true
      }
      
//      this.chat = new RTCMultiConnection(this.roomName);//, this.chatSettings);
      this.chat = new RTCMultiConnection(this.roomName, this.chatSettings);
//      _.extend(this.chat, this.chatSettings);
        
      var create = this.hashParams['-create'] === 'y';
      Events.trigger('navigate', U.replaceParam(U.getHash(), '-create', null), {repalce: true, trigger: false}); // don't create room on refresh (assume you're refreshing cause you lost the connection)
      this.chat.openNewSession(create);
      this.enableChat();
      
      $(window).unload(function() {
        chatView.endChat();
      });
      
      if (this.hasVideo)
        this.pageView.trigger('video:on');

//      this.chat.open();
    },
    
    leave: function() {
      this.chat && this.chat.leave();
    },
    
    endChat: function(onclose) {
      if (this.chat) {
        if (!onclose && this.connected)
          this.leave();
        
        this.chatSession = null;
//        this.chat = null;
      }
      
      if (this.hasVideo) {
        this._videoOn = false;
        this.$('video').each(function() {
          this.pause();
        }).remove();
        
        this.$localVids && this.$localVids.empty();
        this.$remoteVids && this.$remoteVids.empty();
        this.localStream && this.localStream.stop();
      }
    },

    onAppendedLocalVideo: function(video, localStream) {
      this.localStream = localStream;
      this.checkVideoSize(video);
      var $local = this.$localVids.find('video');
      if ($local.length > 1) { // HACK to get rid of accumulated local videos if such exist (they shouldn't)
        for (var i = 0; i < $local.length; i++) {
          var v = $local[i];
          if (v !== video)
            $(v).remove();
        }
      }

//      $("#localVideoMonitor video").animate({left:video.left, top:video.top, width:video.width, height:video.height}, 1000, function() {        
        Events.trigger('localVideoMonitor:off');
        video.muted = true;
        video.controls = false;
        video.play();
        $(video).addClass('localVideo');
        this.$localVids.show();
        this.restyleVideos();
//      });
        
      this.monitorVideoHealth(video);
    },

    monitorVideoHealth: function(video) {
      var $video = $(video);
      _.each(["suspend", "abort", "error", "ended"], function(event) {
        video.addEventListener(event, function() {
          debugger;
          var isLocal = $video.parents('#localVideo');
          $video.remove();
        });
      });
    },
    
    onAppendedRemoteVideo: function(video) {
      this.checkVideoSize(video);
      video.controls = false;
      video.play();
      $(video).addClass('remoteVideo');
      this.$remoteVids.show();
      this.restyleVideos();
      this.monitorVideoHealth(video);
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
//      this.$localVids.drags();
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
        this.chat.send({
          response: response
        });
        
        this.leave(); // leave waitingRoom
        Events.trigger('navigate', U.makeMobileUrl('chatPrivate', response.privateRoom, {'-create': 'y'}), {replace: true});   
      }
      else {
        this.chat.send({
          response: response
        });
      }
//        chatView.pageView.trigger('video:on');
    },
    
    showRequestDialog: function(data) {
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
      $popup.find('[data-cancel]').click(function() {
        Events.stopEvent(e);
        chatView.chat.send({
          response: {
            granted: false,
            request: request.id
          }
        });
      });
      
      $popup.find('[data-ok]').click(function(e) {
        Events.stopEvent(e);
        chatView.engageClient(data);
      });
  
      $popup.trigger('create');
      $popup.popup().popup("open");
      return $popup;
    }
  },
  {
    displayName: 'Chat'
  });
});
  