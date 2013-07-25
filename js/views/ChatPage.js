//'use strict';
define('views/ChatPage', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'cache',
  'vocManager',
  'views/BasicView',
  'views/Header'
], function(G, _, U, Events, C, Voc, BasicView, Header) {
  // To avoid shortest-path interpolation.
  var BTN_ACTIVE_CLASS = 'ui-btn-active',
      SIGNALING_SERVER = 'http://' + G.serverName.match(/^http[s]?\:\/\/([^\/]+)/)[1] + ':8889',
      nurseMeCallType = "http://urbien.com/voc/dev/NursMe1/Call", // HACK for nursMe
      isNursMe = true, //G.pageRoot.toLowerCase() == 'app/nursme1';
      doc = document, 
      browser = G.browser,
      D3Widgets,
      WebRTC,
      webrtcMethods = ['joinRoom', 'leaveRoom', 'emit', '_emit', 'send', '_send', 'startLocalMedia'];

  function getGuestName() {
    return 'Guest' + Math.round(Math.random() * 1000);
  };

  function toLocationString(location) {
    var str = '';
    for (var key in location) {
      var val = location[key];
      if (key == 'time')
        continue;
      if (key === 'accuracy')
        val += '%';
      
      str += '{0}: {1} <br />'.format(key.capitalizeFirst(), val);
    }
    
    return str;
  };
  
  function toDoubleDigit(digit) {
    return digit = digit < 10 ? '0' + digit : digit;
  };

  function unbindVideoEvents(video) {
    var $video = $(video);
    _.each(G.media_events, function(e) {            
      $video.unbind(e);
    })
  };
  
  function getTimeString(date) {
    date = new Date(date);
    var hours = date.getHours();
    var ampm = hours < 12 ? 'AM' : 'PM';
    hours = hours % 12;
    return '{0}:{1}'.format(toDoubleDigit(hours), toDoubleDigit(date.getMinutes()) + ampm);
  };

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'toggleChat', 'videoFadeIn', 'videoFadeOut', 'chatFadeIn', 'chatFadeOut', 'resize', 'restyleGoodies', 'pagehide', 'enableChat', 'disableChat',
                      'onMediaAdded', 'onMediaRemoved', 'onDataChannelOpened', 'onDataChannelClosed', 'onDataChannelMessage', 'onDataChannelError', 'shareLocation', 
                      'setUserId', 'requestLocation', 'onclose', '_switchToApp'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};      
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest,
//        rightMenu: true,
        video: this.isPrivate
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

/*
  
  
  
      var headerDfd = $.Deferred(),
          headerPromise = headerDfd.promise(),
          self = this;
          
      headerPromise.done(function() {
        self.addChild('header', new Header(headerOptions));
      });
      
      if (G.currentUser.guest)
        headerDfd.resolve();
      else {
        var utype = G.serverName + '/voc/dev/' + G.currentApp.appPath + '/Urbien1';
        Voc.getModels([utype]).done(function() {
          var Urbien1 = U.getModel(utype);

          var meta = Urbien1.properties;
          var mainGroup = U.getArrayOfPropertiesWith(meta, "mainGroup");
          if (!mainGroup  ||  !mainGroup.length)
            return headerDfd.resolve();
            
          var mainGroupArr = mainGroup[0]['propertyGroupList'].replace(/\s/g, '').split(",");
          mainGroupArr = mainGroupArr.sort(function(a, b) {return a.index < b.index});
          var mainBacklinks = [];
          for (var i=0; i<mainGroupArr.length; i++) {
            var p = mainGroupArr[i];
            var prop = meta[p];
            if (prop.backLink)
              mainBacklinks.push(p);
          }  
          
          if (!mainBacklinks.length)
            return headerDfd.resolve();
            
          self.user = new Urbien1({_uri: G.currentUser._uri});
          self.user.fetch({
            sync: true, 
            success: function() {
              ///////////
              headerDfd.resolve();
            },
            fail: function() {
              self.user = null;
              headerDfd.reject();
            }          
          });
        });
      }
      
      if (G.currentUser.guest) 
        this.addChild('header', new Header(headerOptions));
      else {
        var self = this;
        var dfd = $.Deferred(function(dfd) {
          var utype = G.serverName + '/voc/dev/' + G.currentApp.appPath + '/Urbien1';
          Voc.getModels([utype]).done(function() {
            var Urbien1 = U.getModel(utype);
  
            var meta = Urbien1.properties;
            var mainGroup = U.getArrayOfPropertiesWith(meta, "mainGroup");
            if (!mainGroup  ||  !mainGroup.length) {
              self.addChild('header', new Header(headerOptions));
              dfd.resolve();
            }
            else {
              var mainGroupArr = mainGroup[0]['propertyGroupList'].replace(/\s/g, '').split(",");
              mainGroupArr = mainGroupArr.sort(function(a, b) {return a.index < b.index});
              var mainBacklinks = [];
              for (var i=0; i<mainGroupArr.length; i++) {
                var p = mainGroupArr[i];
                var prop = meta[p];
                if (prop.backLink)
                  mainBacklinks.push(p);
              }  
              if (!mainBacklinks.length) { 
                self.addChild('header', new Header(headerOptions));
                dfd.resolve();
              }
              else {
                var userDfd = $.Deferred(), userPromise = userDfd.promise();
                self.user = new Urbien1({_uri: G.currentUser._uri});
                self.user.fetch({sync: true, forceFetch: false, 
                  success: function() {
                    ///////////
                    self.addChild('header', new Header(headerOptions));
                    userDfd.resolve();
                  },
                  fail: function() {
                    self.user = null;
                    userDfd.reject();
                  }          
                });
                $.when(userPromise).done(dfd.resolve);
              }
            }
          });
        }).promise();
      }
*/
//      this.video = params['-video'] !== 'n';
      this.video = this.isPrivate;
      
      var type = this.vocModel ? this.vocModel.type : null;
      this.isWaitingRoom = U.isWaitingRoom();
      this.isPrivate = U.isPrivateChat();
      this.isAgent = this.hashParams['-agent'] === 'y';
      this.isClient = !this.isAgent;
      this.textOnly = /^chat\//.test(this.hash) || !G.canWebcam;
      this.hasVideo = !this.textOnly && (this.isPrivate || this.isClient); // HACK, waiting room might not have video
      this.hasAudio = !this.textOnly && (this.hasVideo || this.isPrivate);
      this.config = {
        data: !(browser.mozilla && Math.floor(parseFloat(browser.version)) <= 23),
        video: {
          send: this.isPrivate || (this.isWaitingRoom && this.isClient),
          receive: !this.isWaitingRoom,
          preview: (!this.isWaitingRoom || this.isClient) && this.hasVideo
        },
        audio: {
          send: this.hasAudio,
          receive: !this.isWaitingRoom || this.isAgent
        },
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
      var self = this;
      var req = ['lib/socket.io', 'simplewebrtc'];
      U.require(req).done(function(socketIO, simpleWebRTC) {
        WebRTC = simpleWebRTC;
        readyDfd.resolve();
      });
      
      this.makeTemplate('chatPageTemplate', 'template', type);
      this.makeTemplate('chatMessageTemplate', 'messageTemplate', this.modelType);
      this.makeTemplate('chatResourceLinkMessageTemplate', 'resourceLinkMessageTemplate', this.modelType);
      
      var me = G.currentUser;
      if (me) {
        this.myName = me.davDisplayName || getGuestName();
        this.myIcon = me.thumb || 'icons/male_thumb.jpg';
        this.myUri = me._uri
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

      this.on('video:off', this.endChat, this);
      this.on('video:on', this.startChat, this);

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
      
      Events.on('localVideoMonitor:on', function() {
        if (self.isActive()) {
          self.playRingtone();
        }
      });

      Events.on('localVideoMonitor:off', function() {
        self.stopRingtone();
      });

      if (self.config.data !== false) {
        Events.on('messageForCall:resource', function(resInfo) {
          var msg = {
            message: {
              resource: resInfo
            }
          };
          
          self.sendMessage(msg);
          self.addMessage(msg);
        });

        Events.on('messageForCall:list', function(listInfo) {
          var msg = {
            message: {
              list: listInfo
            }
          };
          
          self.sendMessage(msg);
          self.addMessage(msg);
        });
      }

      this.on('video:on', this.videoFadeIn, this);
      this.on('video:on', this.enableTakeSnapshot, this);
      this.on('newRTCCall', this.videoFadeIn, this);
      Events.on('hangUp', this.endChat, this);

      this.autoFinish = false;
    },
    
    events: {
      'click'                             : '_switchToApp',
      'click #videoChat'                  : 'toggleChat',
      'click #textChat'                   : 'toggleChat',
      'click input'                       : 'chatFadeIn',
      'click #chatSendBtn'                : '_sendMessage',
//      'click #endChat'                    : 'endChat',
      'click #chatReqLocBtn'              : 'requestLocation',
      'click #chatShareLocBtn'            : 'shareLocation',
      'click #chatCaptureBtn'             : 'takeSnapshot',
      'resize'                            : 'resize',
      'orientationchange'                 : 'resize',
      'pagehide'                          : 'pagehide' 
    },
    pagehide: function(e, data) {
      G.log('Changing to page:' + window.location.href);
    },
    _switchToApp: _.debounce(function(e) {
      if (!this.isActive())
        return;
      
      var role = e.target.dataset.role;
    }, 100),
    switchToApp: function(e) {
      return !this._switchToApp(e);
    },
    toggleChat: function(e) {
      if (!this.rendered)
        return;

//      var el = e.target;
//      if ($(el).css('z-index') < 1000)
//        return;
      
      if (_.isUndefined(this._videoSolid))
        this._videoSolid = this.$videoChat.css('opacity') == 1;
      
      if (this._videoSolid)
        this.chatFadeIn();
      else if (this._videoOn)
        this.videoFadeIn();        
    },
    
    videoFadeIn: function(e) {
      if (!this.rendered)
        return;
        
      this._videoSolid = true;
      if (this._chatSolid)
        this.chatFadeOut();
      
      this.$videoChat.fadeTo(600, 1, this.restyleGoodies).css('z-index', 1001); // jquery mobile footer is z-index 1000
    },

    videoFadeOut: function(e) {
      if (!this.rendered)
        return;
      
      this._videoSolid = false;
      if (!this._chatSolid)
        this.chatFadeIn();
      
      this.$videoChat.fadeTo(600, 0.1, this.restyleGoodies).css('z-index', 1); // jquery mobile footer is z-index 1000
    },

    chatFadeIn: function(e) {
      if (!this.rendered)
        return;

      this._chatSolid = true;
      if (this._videoSolid)
        this.videoFadeOut();
      
      this.$textChat.fadeTo(600, 1).css('z-index', 1001);
      this.$videoChat.css('z-index', 0);
    },

    chatFadeOut: function(e) {
      if (!this.rendered)
        return;

      this._chatSolid = false;
      if (!this._videoSolid && this._videoOn)
        this.videoFadeIn();
      
      this.$textChat.fadeTo(600, 0.1).css('z-index', 1);
    },
    
    render: function() {      
      var self = this;
      this.$el.html(this.template({
        viewId: this.cid,
        video: this.hasVideo,
        audio: this.hasAudio
      }));
      
//      Events.on('visible', _.debounce(function(visible) {
//        debugger;
//        if (this.chat) {
//          var webRTCEvent = visible ? 'wake' : 'sleep';
//          if (this.chat.sessionReady)
//            this.chat._emit(webRTCEvent);
//          else {
//            this.chat.on('ready', function() {
//              this.chat._emit(webRTCEvent);
//            });
//          }
//        }
//        
//        console.log("page has become", newState);
//      }, 3000, true));
      
      this.assign({
        'div#headerDiv' : this.header
      });

//      this.$ringtone          = this.$('div#ringtoneHolder');
      this.$chatInput         = this.$('#chatMessageInput');
      this.$messages          = this.$('#messages');
      this.$sendMessageBtn    = this.$('#chatSendBtn');
      this.$snapshotBtn       = this.$('#chatCaptureBtn');
      this.$localMedia        = this.$('div#localMedia');
      this.$remoteMedia       = this.$('div#remoteMedia');
      this.$videoChat         = this.$('#videoChat');
      this.$textChat          = this.$('#textChat');
      
      this.$localMedia.hide();
      if (this.resource && this.isPrivate) {
        this.paintInChatBacklinks();
        this.paintConcentricStats('inChatStats', _.extend({animate: true}, this.getStats()));
      }

      if (this.isWaitingRoom && this.isClient) {
        Events.trigger('headerMessage', {
          info: 'Calling...'
        });
      }

      if (!this.rendered) { // only once
        this.disableTakeSnapshot();
        this.$chatInput.bind("keydown", function(event) {
          // track enter key
          var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
          if (keycode == 13) { // keycode for enter key
            self.$sendMessageBtn.trigger('click');
          }
        });
        
        this.startChat();
      }
      
      if (!this.$el.parentNode) 
        $(doc.body).append(this.$el);

      this.$('#header').css({
        'z-index': 1000,
        'opacity': 0.7
      });
      
      this.finish();
    },

    enableChat: function() {
      this.$sendMessageBtn.button().button('enable');
      if (this.$chatInput.length) {
        this.$chatInput.removeClass('ui-disabled');
      }
      
      this.disabled = false;
    },

    disableChat: function() {
      this.$sendMessageBtn.button().button('disable');
      if (this.$chatInput.length) {
        this.$chatInput.addClass('ui-disabled');
      }
      
      this.$remoteMedia && this.$remoteMedia.empty();
      this.disabled = true;
    },

    enableTakeSnapshot: function() {
      if (!this.$snapshotBtn)
        return;
      
      this.$snapshotBtn.button().button('enable');
      this.$('canvas').remove();
      this.$('video').unbind('play', this._addCanvasForVideo).bind('play', this._addCanvasForVideo);
    },    

    disableTakeSnapshot: function() {
      if (!this.$snapshotBtn)
        return;
      
      this.$snapshotBtn.button().button('disable');
      this.$('canvas').remove();
    },

    _addCanvasForVideo: function(e) {
      var video = e.target;
      if (!video.id)
        video.id = G.nextId();
      
      $('<canvas data-for="{0}" width="100%" height="0" style="position:absolute;top:0px;left;0px" />'.format(video.id)).insertAfter(this);
    },

    getStats: function() {
      var max = Math.min(document.width / 3, document.height / 3, 300),
          w = document.width || max,
          h = document.height || max,
          dim = Math.min(w, h, max);
      
      return {
        width: dim,
        height: dim,
        circles: [{
          percent: 150,
          text: 'Activity',
          fill: '#f00',
          opacity: 0.5
        },
        {
          percent: 85,
          text: 'Sleep',
          fill: '#0f0',
          opacity: 0.5
        }
//        ,
//        {
//          percent: 140,
//          text: 'Pain',
//          fill: '#00f',
//          opacity: 0.2
//        }
//        ,
//        {
//          degrees: 250,
//          text: 'Blah1',
//          fill: '#ff0',
//          opacity: 0.5
//        },
//        {
//          degrees: 100,
//          text: 'Blah2',
//          fill: '#f0f',
//          opacity: 0.5
//        }
        ]
      };
    },
    
    paintInChatBacklinks: function() {
      this.$('#inChatBacklinks').html("");
      var self = this;
      if (window.location.hash.startsWith("#chatLobby")  &&  !G.currentUser.guest) {
        var res = C.getResource(G.currentUser._uri);
        if (!res) {
          var utype = G.serverName + '/voc/dev/' + G.currentApp.appPath + '/Urbien1';
          var Urbien1 = U.getModel(utype);
          res = new Urbien1({_uri: G.currentUser._uri});
          res.fetch({sync: true, forceFetch: true});
          this.user = res;
        }
      }
      
      U.require(['views/ControlPanel']).done(function(ControlPanel) {
        var $bl = self.$("div#inChatBacklinks");
        $bl.drags();
        self.addChild('backlinks', new ControlPanel({
          isMainGroup: true,
          dontStyle: true,
          model: self.user ? self.user: self.resource,
          parentView: self
//          ,
//          el: $bl[0]
        }));
        
        self.assign('div#inChatBacklinks', self.backlinks);
        $bl.find('[data-role="button"]').button();
//        self.backlinks.render();
//        readyDfd.resolve();
//        .find('a').click(function() {
//          debugger;
//          return false; // Disable links inside the backlinks box
//        });;
      });
    },
   
    resize: function(e) {
      if (this.resource && this.isPrivate) {
        this.paintInChatBacklinks();
        this.paintConcentricStats('inChatStats', this.getStats());
        this.restyleGoodies();
      }
    },
    
    restyleGoodies: function() {
      if (!this.rendered)
        return;
      
      var $goodies = this.$('div#inChatGoodies'),
          $video = this.$('div#remoteMedia video');
//      ,
//          $bl = $goodies.find('#inChatBacklinks'),
//          $stats = $goodies.find('#inChatStats'),
//          $svg = $stats.find('svg');
//      
//      $bl.css({
//        top: '0px',
//        right: '0px'
//      });
//      
//      $stats.css({
//        top: $bl.height() + 'px',
//        right: '0px'
//      });
//      
//      $svg.css({
//        top: '0px',
//        right: '0px'
//      });

      if (!$video.length)
        $video = this.$('div#localMedia video');
      
      if ($video.length) {
        var vChatZ = this.$videoChat.css('z-index');
        vChatZ = isNaN(vChatZ) ? 1 : parseInt(vChatZ);
//        var extraOffset = vChatZ < 1000 ? this.pageView.$('[data-role="header"]').height() : 0;
        var extraOffset = 0;
        var offset = $video.offset();
        var goodiesWidth = Math.max($goodies.find('div#inChatBacklinks').width(), $goodies.find('svg').width());
        $goodies.css({top: offset.top + extraOffset, left: offset.left + $video.width() - goodiesWidth});
//        $goodies.css({top: offset.top + extraOffset});
      }
      else
        $goodies.css({top: 'auto', left: 'auto'});
      if (this._videoSolid)
        $goodies.css('z-index', 1002);
      else
        $goodies.css('z-index', -100);
    },

    paintConcentricStats: function(divId, options) {
      var self = this, args = arguments;
      U.require(['lib/d3', 'd3widgets'], function(_d3_, widgets) {
        D3Widgets = widgets;
        self._paintConcentricStats(divId, options);
      });      
    },
    
    /**
     * @param circles - array of circle objects, from innermost to outermost, a single circle object having the properties:
     * {
     *   degrees: 50, // value: 0 to 360, effect: a circle painted "degrees" degrees of the way around, starting from 12 o'clock, clockwise
     *   percent: 50, // value: 0 to 100, effect: a circle painted "percent" of the way around, starting from 12 o'clock, clockwise
     *   fill: #555, // circle color
     *   fill: #555, // circle color
     * }
     */
    _paintConcentricStats: function(divId, options) {
      var self = this;
      D3Widgets.concentricCircles(this.$('#' + divId), options).done(function() {
        self.$('#inChatStats svg').drags();
      });
    },
    
    playRingtone: function() {
//      this.$ringtone.append("<audio id='ringtone' src='ringtone.mp3' loop='true' />").find('audio')[0].play();
      this.ringtone = U.createAudio({
        src: 'ringtone.mp3',
        loop: true
      });
      
      this.ringtone.play();
    },

    stopRingtone: function() {
//      this.$ringtone.find('audio').each(function() {
//        this.pause();
//        this.src = null;
//      }).remove();
      if (this.ringtone)
        this.ringtone.remove();
    },
    
    isDisabled: function() {
      return this.disabled;
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
        var message, isNursMe = G.currentApp.appPath == 'NursMe1';
        if (this.isPrivate) {
          if (userInfo.isAgent)
            message = '<i>{0}{1} is ready to assist you</i>'.format(isNursMe ? 'Nurse ' : '', userInfo.name);
          else
            message = '<i>{0}{1} is ready to be assisted</i>'.format(isNursMe ? 'Patient ' : '', userInfo.name);
        }
        else if (!(this.isWaitingRoom && this.isClient))
          message = '<i>{0} has entered the room</i>'.format(userInfo.name);
        
        this.addMessage({
          message: message,
          time: +new Date(), //getTime(),
          senderIcon: userInfo.icon,
          info: true,
          sender: userInfo.name
        });
      }
      
      if (!isUpdate)
        this.trigger('chat:newParticipant', userInfo);
    },
    
    _updateParticipants: function() {
      this.participants = _.keys(this.userIdToInfo);
      if (!this.getNumParticipants())
        this.$chatInput.prop('placeholder', 'Chat room is empty...');
      else
        this.$chatInput.prop('placeholder', '');
    },
    
    sendUserInfo: function(options, to) {
      var msg = {
        userInfo: _.extend(this.myInfo, options || {})
      };
      
      this.chat.sendMessage(msg, to);
    },

    getUserInfo: function(userid) {
      return this.userIdToInfo[userid];
    },

    addMessage: function(info) {
      var message = info.message,
          resource = message && message.resource,
          list = message && message.list;

      _.defaults(info, {
        'private': false
      }, info.self !== false ? {
        sender: 'Me',
        senderIcon: this.myIcon,
        self: true
      } : {});

      info.time = getTimeString(info.time || +new Date());
      if (resource) {
        info.message = this.resourceLinkMessageTemplate({
          href: U.makePageUrl('view', resource._uri),
          text: resource.displayName
        });
      }
      else if (list) {
        info.message = this.resourceLinkMessageTemplate({
          href: U.makePageUrl(decodeURIComponent(list.hash)),
          text: list.title
        });
      }
      
//      info.time = getTimeString(info.time || +new Date());
      var height = $(doc).height();
      var atBottom = this.atBottom();
      this.$messages.append(this.messageTemplate(info));
      if (atBottom || true)
        this.scrollToBottom();
    },

    sendMessage: function() {
      var data = arguments[0];
      data.time = data.time || +new Date();
      this.chat.send.apply(this.chat, arguments);
    },
    
    _sendMessage: function(e) {
      e && Events.stopEvent(e);
      var msg = this.$chatInput.val();
      if (!msg || !msg.length)
        return;
      
      this.addMessage({
        message: msg
      });

      this.$chatInput.val('');
      if (!this.chat || !_.size(this.chat.pcs))
        return;      
      
      this.sendMessage({
        message: msg
      });            
    },
    
    sendFile: function(data, to) {
      this.chat.send({
        type: 'file',
        file: data
      }, to, {
        done: function() {        
        },
        progress: function() {
        }
      });            
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
      return data.response ? data.response.requestId : data.request.id;
    },

    request: function(type, to) {
      var reqId = this.myInfo.id + '_' + G.nextId(),
          self = this,
          msg = {
            request: {
              id: reqId,
              type: type
            }
          },
          request = msg.request;
      
      switch(type) {
      case 'service':
        request.title = 'Hi, can someone help me please?';
        break;
      case 'info':
      case 'location':
        request.title = 'May I ask your location?';
        break;
      }
      
      if (to)
        msg.to = to;
      
      this._myRequests[reqId] = msg.request;
      this.sendMessage(msg, to);      
      var dfd = $.Deferred();
      dfd.done(function() {
        delete self._myRequestPromises[reqId];
      });
      
      this._myRequestPromises[reqId] = dfd;
      var promise = dfd.promise();
      _.extend(promise, {
        accepted: promise.done,
        rejected: to ? promise.fail : promise.progress // if it's a public message, you get the opportunity to be rejected many times
      })
      
      return promise;
    },
    
    _grantRequest: function(request, response, from) {
      if (arguments.length == 2)
        from = response;
      
      this.sendMessage({
        response: _.extend(response || {}, {
          granted: true,
          requestId: request.id
        })
      }, 
      from);
    },
    
    grantRequest: function(request, from) {
      var self = this;
      
      switch(request.type) {
        case 'info':
          this._grantRequest(request, {
            userInfo: this.myInfo
          }, from);
          
          break;
        case 'service':
          this.stopRingtone();
          this.engageClient({
            request: request,
            from: from
          });
          
          break;
        case 'location':
          var dfd = $.Deferred();
          dfd.promise().done(function(location) {
            self._grantRequest(request, {
              location: location
            }, from);
            
            self._addLocationMessage(self.myInfo, location);
          });
          
          U.getCurrentLocation().done(dfd.resolve).fail(function(error) {
            var lastKnown = G.currentUser.location;
            if (lastKnown)
              dfd.resolve(lastKnown);
            else {
              alert('Unable to share your location');
              self.denyRequest(request, from, {
                message: 'User was unable to send location'
              });
            }
          });
          
          break;
      }
    },

    denyRequest: function(request, from, why) {
      debugger;
      var response = {
        granted: false,
        requestId: request.id
      }
      
      if (why)
        response.reason = why;
      
      switch(request.type) {
        case 'service':
          this.stopRingtone();
        default:
          this.sendMessage(response, from);
      }
    },
    
    _addLocationMessage: function(userInfo, location, msg) {
      var message =  "{0}'s location at {1}: <br />".format(userInfo.name, getTimeString(location.time)) + toLocationString(location),
          type = 'health/base/MedicalCenter';
      
      if (isNursMe) { // HACK
        message = '<a href="{0}"><strong>Medical centers near {1}</strong></a>'.format(U.makePageUrl('list', type, _.extend({
          '-item': userInfo.name, 
          $orderBy: 'distance', 
          $asc: 'y'
        }, _.pick(location, 'latitude', 'longitude'))), userInfo.name);
      }
      
      this.addMessage(_.defaults({
        message: message
      }, msg || {}, {
        time: +new Date(),
        'private': false,
        location: location,
        senderIcon: userInfo.icon,
        sender: userInfo.name,
        self: userInfo.id == this.myInfo.id
      }));
    },
    
    requestLocation: function(e) {
      this.request('location');
    },
    
    shareLocation: function(e) {
      var self = this,
          dfd = $.Deferred();
      
      dfd.done(function(position) {
        self.sendMessage({
          location: position
        });        
        
        self._addLocationMessage(self.myInfo, position);
      });
      
      U.getCurrentLocation().done(dfd.resolve).fail(function(error) {
        var lastKnown = G.currentUser.location;
        if (lastKnown)
          dfd.resolve(lastKnown);
        else
          dfd.reject(error);
      });
    },
    
    promiseToHandleRequest: function(req) {
      var self = this,
          dfd = this._otherRequestPromises[req.id] = $.Deferred(),
          promise = dfd.promise();
      
      promise.done(function() {
        delete self._otherRequestPromises[req.id];
      });
      
      return promise;
    },
    
    startChat: function() {
      this.initChat();
      var args = arguments, self = this;
      this.ready.done(function() {
        self._startChat.apply(self, args);
      });
    },

    _startChat: function(options) {
      if (this.chat)
        return;
      
      var self = this,
          roomName = this.getRoomName(),
          config = this.config,
          aConfig = config.audio,
          vConfig = config.video,
          webrtc;
      
      this._videoOn = this.hasVideo;
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

      try {
        webrtc = this.chat = new WebRTC(this.config);
      } catch (err) {
        U.alert(err.message);
        return;
      }
      
      webrtc.on('ready', function() {
        webrtc._emit('info', {
          uri: self.myUri,
          endpoint: G.pushChannelId,
          appUri: G.currentApp._uri,
          browser: browser.name
        })
      });
      
      webrtc.on('readyToCall', _.once(function() {
        webrtc.joinRoom(roomName);
        self.enableChat();
      }));

      webrtc.on('userid', this.setUserId);
      webrtc.on('mediaAdded', this.onMediaAdded);
      webrtc.on('mediaRemoved', this.onMediaRemoved);

      // Data channel events
      if (this.config.data !== false) {
        webrtc.on('dataOpen', this.onDataChannelOpened);
        webrtc.on('dataClose', this.onDataChannelClosed);
        webrtc.on('dataMessage', this.onDataChannelMessage);
        webrtc.on('dataError', this.onDataChannelError);
      }
      
      webrtc.on('close', this.onclose);
      if (this.hasVideo && cachedStream)
        webrtc.startLocalMedia(cachedStream);
      
      $(window).unload(function() {
        self.endChat();
      });
      
      if (this.hasVideo)
        this.trigger('video:on');
    },

    /**
     * conversation with peer ended
     */
    onclose: function(event, conversation) {
      var userid = conversation.id;
      
      delete this.userIdToInfo[userid];
      this._updateParticipants();
      var dfd = this._otherRequestPromises[userid];
      if (dfd) {
        dfd.resolve();
        delete this._otherRequestPromises[userid];
      }
      
      this.trigger('chat:participantLeft', userid);
    },
    
    onDataChannelOpened: function(event, conversation) {
      var info = _.clone(this.myInfo),
          self = this;
      
      if (!this.connected) {
        this.connected = true;
        info.justEntered = true;
      }
      
      this.sendMessage({
        userInfo: info
      }, conversation.id);
      
      if (this.isWaitingRoom && this.isClient) {
        this.request('service').accepted(function(responseData) {
          // request has been granted
          self.leave();
          var from = responseData.from;
          var privateRoom = responseData.response.privateRoom;
          Events.trigger('navigate', U.makeMobileUrl('chatPrivate', privateRoom), {replace: true, transition: 'none'});
        }).rejected(function(responseData) {
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
      }
    },
    
    onDataChannelMessage: function(data, conversation) {
      var self = this,
          from = conversation.id,
          userInfo;
      
      if (this.isDisabled())
        this.enableChat();
      
      data.from = from;      
      var userInfo = this.getUserInfo(from);
      var response = data.response;
      if (response) {
        this.handleResponse(data);
        data = response;
      }
      
      var location = data.location;
      var isPrivate = !!data['private'];
      var commonMsgPart = {
        time: data.time || +new Date(),
        'private': isPrivate,
        location: location,
        message: data.message,
        self: false
      };
      
      if (userInfo) {
        _.extend(commonMsgPart, {
          sender: userInfo.name,
          senderIcon: userInfo.icon
        })
      }
      
//      G.log(this.TAG, 'chat', 'message from {0}: {1}'.format(extra._userid, JSON.stringify(data)));
      if (data.userInfo) {
        userInfo = data.userInfo;
        userInfo.id = from;
        if (this.rtcCall && this.rtcCall.id === this.myInfo.id) {
          Events.trigger('updateRTCCall', this.myInfo.id, {
            title: 'Call in progress'
          });
        }

        this.addParticipant(userInfo);
      }
      else if (data.request) {
        var req = data.request;
        switch (req.type) {
          case 'info':
            this.grantRequest();
            break;
          case 'service':
            if (!this.isAgent)
              break;
            
            if (!userInfo) {
              debugger; // TODO: request userInfo and continue to handle request
              break;
            }
//              this.request('info')
            
            this.playRingtone();
            // fall through to throw up request dialog
          default:
            var $dialog = this.showRequestDialog(data);
            var promise = this.promiseToHandleRequest(req);
            promise.done(function() {
              if ($dialog.parent())
                $dialog.popup('close'); // check if it's not closed already
            });
            
            break;
        }
      }
      else if (data.file && data.type === 'file') {
        this.addMessage(commonMsgPart);        
      }
      else if (data.message) {
        if (!userInfo) {
          debugger;
          var args = arguments;
          this.request('info', from).accepted(function() {
            self.onDataChannelMessage.apply(self, args);
          });
          
          return; // TODO: append message after getting info
        }

        var msg = data.message,
            resource = msg.resource,
            list = msg.list;
        
        if (resource) {
          var type = U.getTypeUri(resource._uri);
          Voc.getModels(type).done(function() {
            var model = U.getModel(type);
            new model({
              _uri: resource._uri
            }).fetch();
          });
        }
        else if (list) {
          var type = U.getTypeUri(U.decode(list.hash));
          Voc.getModels(type).done(function() {
            new ResourceList(null, {
              model: U.getModel(type),
              _query: list.hash.split('?')[1]
            }).fetch();
          });          
        }
          
        this.addMessage(commonMsgPart);
        if (!this.isActive())
          this.unreadMessages++;
      }
      else if (location) {
        // no message, just location
        this._addLocationMessage(userInfo, location, commonMsgPart);
      }
      
      if (location && userInfo) {
        _.extend(userInfo, location);
      }
    },
    
    onDataChannelError: function(event) {
      debugger;
      var channel = event.target;
    },
    
    onMediaAdded: function(info) {
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
//      });
        
      if (!this.isWaitingRoom)
        Events.trigger('localVideoMonitor:off');
      
      this.monitorVideoHealth(video);
//      this.enableTakeSnapshot();
      this.restyleVideos();
      this.restyleGoodies();
      this.trigger('video:on');
    },

    processRemoteMedia: function(info, conversation) {
      this.stopRingtone();
      this.rtcCall = {
        id: this.myInfo.id,
        url: window.location.href,
        title: 'Call in progress'
      };
      
      Events.trigger('newRTCCall', this.rtcCall);
      var self = this,
          media = info.media,
          stream = info.stream;

      var alreadyStreaming = U.filterObj(this.userIdToInfo, function(id, info) {
        return !!info.stream;
      });
      
      var videoIds = _.map(_.keys(alreadyStreaming), function(id) { 
        return 'video#' + id; 
      });
      
      if (videoIds.length) {
        this.$(videoIds.join(',')).each(function() {
          if (browser.mozilla)
            this.mozSrcObject = null;
          else
            this.src = null;
          
          $(this).remove();
        });
      }
      
      this.addParticipant({
        id: conversation.id,
        stream: stream,
        blobURL: media.src || ''
      });
      
      media.controls = false;
      this.$remoteMedia.show();
      if (media.tagName === 'VIDEO') {
        this.checkVideoSize(media);
        $(media).addClass('remoteVideo');
        this.restyleVideos();
        this.monitorVideoHealth(media);
        this.restyleGoodies();
        this.trigger('video:on');
      }
      else {
        // audio only
        media.width = 0;
        media.height = 0;
      }
      
      media.play();
//      debugger;
      var userInfo = this.getUserInfo(conversation.id);
      var title = userInfo && userInfo.name || this.getPageTitle();
//      this.enableTakeSnapshot();
    },

    onMediaRemoved: function(info, conversation) {
      this.restyleGoodies();
      if (info.type == 'local') {
        //
      }
      else {
        if (info.stream)
          Events.trigger('endRTCCall', this.rtcCall);
        
        this.$('canvas#' + info.media.id).remove();
        this.restyleVideos();
      }
    },

    leave: function() {
  //    this.chat && this.chat.leave();
      if (this.chat) 
        this.chat.leaveRoom();
      
      this.stopRingtone();
    },
    
    initChat: function() {
      this.roomName = this.getRoomName();
      this._myRequests = {};
      this._myRequestPromises = {};
      this._otherRequestPromises = {};
      this.unreadMessages = 0;
      this.participants = [];
      this.userIdToInfo = {};            
      this._updateParticipants();
    },
  
    endChat: function(onclose) {
      this.leave();
      this.chat = null;
      this.$localMedia && this.$localMedia.empty();
      this.$remoteMedia && this.$remoteMedia.empty();
      if (this.hasVideo) {
        this._videoOn = false;
        this.$('video').each(function() {
          unbindVideoEvents(this);
          this.pause();
        }).remove();
        
        this.localStream && this.localStream.stop();
      }
      
      if (!this.isActive())
        this.onActive(this.startChat.bind(this));
    },
  
    takeSnapshot: function() {
      var self = this;
          snapshots = [];
      this.$('canvas').each(function() {
        var $this = $(this);
        var $video = self.$('video#' + $this.data('for'));
        if (!$video.length)
          return;
        
        var w = $video.width(),
            h = $video.height();
        
        $this.prop('width', w).prop('height', h);
        this.getContext('2d').drawImage($video[0], 0, 0, w, h);
        var url = this.toDataURL('image/webp', 1);
        $this.prop('width', '100%').prop('height', 0);
        snapshots.push(url);
  //      var img = new Image();
  //      img.src = url;
  //      console.log(img);
      });
      
      _.each(snapshots, function(shot) {
        self.sendFile(shot);
        
        self.addMessage({
          message: '<image src="{0}" />'.format(shot),
          time: +new Date(), //getTime(),
          senderIcon: this.myIcon,
          self: true,
          sender: 'Me'          
        });
      });
    },
    
    monitorVideoHealth: function(video) {
      var $video = $(video);
      _.each(["abort", "error", "ended", "pause"], function(event) {
        $video.bind(event, function() {
          if ((event.type || event) == "pause") {
            video.play();
            return;
          }
          
  //        var isLocal = $video.parents('#localVideo');
  //        $video.remove();
        });
      });
    },
    
    checkVideoSize: function(video) { // in Firefox, videoWidth is not available on any events...annoying
      var self = this;
      if (!video.videoWidth) {
        setTimeout(function() {
          self.checkVideoSize(video);
        }, 100);
        
        return;
      }
    },
    
    restyleVideos: function() {
      var $locals = this.$localMedia;
      var numRemotes = this.$remoteMedia.find('video').length;
      if (numRemotes == 1)
        $locals.addClass('myVideo-overlay');
      else
        $locals.removeClass('myVideo-overlay');
    },
    
    engageClient: function(data) {
      var request = data.request,
          from = data.from,
          userInfo = this.getUserInfo(from);
      
      if (!userInfo) { // user may have refreshed the page, or left or died and fell on the page with his head
        U.alert({
          msg: 'This client is no longer available'
        });
        
        return;
      }
      
      var userUri = userInfo.uri;
      var isServiceReq = this.isWaitingRoom && request.type == 'service';
      if (isServiceReq) {
        var privateRoom = userUri;
        this._grantRequest(request, {
          privateRoom: privateRoom
        }, from);
        
        this.leave(); // leave waitingRoom
        Events.trigger('navigate', U.makeMobileUrl('chatPrivate', privateRoom, {'-agent': 'y'}), {replace: true});   
      }
      else {
        debugger;
  //      this._grantRequest(request, {});
      }
    },
    
    showRequestDialog: function(data) {
      var self = this,
          request = data.request,
          userInfo = this.getUserInfo(data.from),
          id = 'chatRequestDialog';
          $popup = U.dialog({
            id: id,
            //      title: userInfo.name + ' is cold and alone and needs your help',
            header: request.type.capitalizeFirst() + ' Request',
            img: userInfo.icon,
            title: request.title,
            ok: 'Accept',
            cancel: 'Decline',
            oncancel: function(e) {
              self.denyRequest(request, data.from);
              $popup.parent() && $popup.popup('close');
              return false;
            },
            onok: function(e) {
              self.grantRequest(request, data.from);
              $popup.parent() && $popup.popup('close');
              return false;
            }
          });
          
      return $popup;
      
//      $('#' + id).remove();
//      
  //    $('.ui-page-active[data-role="page"]').find('div[data-role="content"]').append(popupHtml);
//      this.$el.append(popupHtml);
  //    $.mobile.activePage.append(popupHtml).trigger("create");
//      $popup = $('#' + id);
//      $popup.find('[data-cancel]').click(function(e) {
//        self.denyRequest(request, data.from);
//        $popup.parent() && $popup.popup('close');
//        return false;
//      });
//      
//      $popup.find('[data-ok]').click(function(e) {
//        self.grantRequest(request, data.from);
//        $popup.parent() && $popup.popup('close');
//        return false;
//      });
//  
//      $popup.trigger('create');
//      $popup.popup().popup("open");
//      return $popup;
    },
    
    makeCall: function() {
      var self = this,
          nurseInfo = this.userIdToInfo[U.getFirstProperty(this.userIdToInfo)];
      
      if (!nurseInfo)
        return;
      
      Voc.getModels(nurseMeCallType).done(function() {
        var callModel = U.getModel(nurseMeCallType);
        self.call = new callModel({
          complaint: 'stomach hurts',
          nurse: nurseInfo.uri
        });
        
        self.call.save();
      });
    },
    
    endCall: function() {
      var nurseInfo = this.userIdToInfo[U.getFirstProperty(this.userIdToInfo)];
      if (!nurseInfo || !this.call)
        return;
  
      this.call.save({
        end: +new Date()
      },
      {
        sync: true,
        success: function() {
          debugger;
        },
        error: function() {
          debugger;
        }
      });
    },
    
    getNumParticipants: function() {
      return this.participants.length;
    },

    getUserId: function() {
      return this.myInfo.id;
    },

    setUserId: function(id) {
      this.myInfo.id = id;
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
    }
  }, {
    displayName: 'ChatPage'
  });
});