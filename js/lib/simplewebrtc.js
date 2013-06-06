//;define('lib/simplewebrtc', ['lib/socket.io'], 
(function (window) {

var logger = {
    log: function (){},
    warn: function (){},
    error: function (){}
};

// normalize environment
var RTCPeerConnection = null,
    getUserMedia = null,
    attachMediaStream = null,
    reattachMediaStream = null,
    webRTCSupport = true,
    isChrome = false;

if (navigator.mozGetUserMedia) {
    logger.log("This appears to be Firefox");

    // The RTCPeerConnection object.
    RTCPeerConnection = mozRTCPeerConnection;

    // The RTCSessionDescription object.
    RTCSessionDescription = mozRTCSessionDescription;

    // The RTCIceCandidate object.
    RTCIceCandidate = mozRTCIceCandidate;

    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        element.mozSrcObject = stream;
        element.play();
    };

    reattachMediaStream = function(to, from) {
        to.mozSrcObject = from.mozSrcObject;
        to.play();
    };

    // Fake get{Video,Audio}Tracks
    MediaStream.prototype.getVideoTracks = function() {
        return [];
    };

    MediaStream.prototype.getAudioTracks = function() {
        return [];
    };
} else if (navigator.webkitGetUserMedia) {
    isChrome = true;

    // The RTCPeerConnection object.
    RTCPeerConnection = webkitRTCPeerConnection;
    
    MediaStream = webkitMediaStream;

    // Get UserMedia (only difference is the prefix).
    // Code from Adam Barth.
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        element.autoplay = true;
        element.src = webkitURL.createObjectURL(stream);
    };

    reattachMediaStream = function(to, from) {
        to.src = from.src;
    };

    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }

    // New syntax of getXXXStreams method in M26.
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };
    }
} else {
    webRTCSupport = false;
    throw new Error("Browser does not appear to be WebRTC-capable");
}


// emitter that we use as a base
function WildEmitter() {
    this.callbacks = {};
}

// Listen on the given `event` with `fn`. Store a group name if present.
WildEmitter.prototype.on = function (event, groupName, fn) {
    var hasGroup = (arguments.length === 3),
        group = hasGroup ? arguments[1] : undefined,
        func = hasGroup ? arguments[2] : arguments[1];
    func._groupName = group;
    (this.callbacks[event] = this.callbacks[event] || []).push(func);
    return this;
};

// Adds an `event` listener that will be invoked a single
// time then automatically removed.
WildEmitter.prototype.once = function (event, fn) {
    var self = this;
    function on() {
        self.off(event, on);
        fn.apply(this, arguments);
    }
    this.on(event, on);
    return this;
};

// Unbinds an entire group
WildEmitter.prototype.releaseGroup = function (groupName) {
    var item, i, len, handlers;
    for (item in this.callbacks) {
        handlers = this.callbacks[item];
        for (i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i]._groupName === groupName) {
                handlers.splice(i, 1);
                i--;
                len--;
            }
        }
    }
    return this;
};

// Remove the given callback for `event` or all
// registered callbacks.
WildEmitter.prototype.off = function (event, fn) {
    var callbacks = this.callbacks[event],
        i;

    if (!callbacks) return this;

    // remove all handlers
    if (arguments.length === 1) {
        delete this.callbacks[event];
        return this;
    }

    // remove specific handler
    i = callbacks.indexOf(fn);
    callbacks.splice(i, 1);
    return this;
};

// Emit `event` with the given args.
// also calls any `*` handlers
WildEmitter.prototype.emit = function (event) {
    var args = [].slice.call(arguments, 1),
        callbacks = this.callbacks[event],
        specialCallbacks = this.getWildcardCallbacks(event),
        i,
        len,
        item;

    if (callbacks) {
        for (i = 0, len = callbacks.length; i < len; ++i) {
            callbacks[i].apply(this, args);
        }
    }

    if (specialCallbacks) {
        for (i = 0, len = specialCallbacks.length; i < len; ++i) {
            specialCallbacks[i].apply(this, [event].concat(args));
        }
    }

    return this;
};

// Helper for for finding special wildcard event handlers that match the event
WildEmitter.prototype.getWildcardCallbacks = function (eventName) {
    var item,
        split,
        result = [];

    for (item in this.callbacks) {
        split = item.split('*');
        if (item === '*' || (split.length === 2 && eventName.slice(0, split[1].length) === split[1])) {
            result = result.concat(this.callbacks[item]);
        }
    }
    return result;
};


function WebRTC(opts) {
    var options = opts || {};
    var self = this,
        config = this.config = {
            url: 'http://signaling.simplewebrtc.com:8888',
            log: false,
            data: true,
            audio: {
              send: true,
              receive: true
            },
            video: {
              send: true,
              receive: true,
              preview: true
            },
            local: null,
            remote: null,
            autoRequestMedia: false,
            // makes the entire PC config overridable
            peerConnectionConfig: {
                iceServers: isChrome ? [{"url": "stun:stun.l.google.com:19302"}] : [{"url":"stun:124.124.124.2"}]
            },
            peerConnectionContraints: {
                optional: isChrome ? [{RtpDataChannels: true}] : [{DtlsSrtpKeyAgreement: true}]
            }
        },
        item,
        connection;

    // check for support
    if (!webRTCSupport) {
        console.error('Your browser doesn\'t seem to support WebRTC');
    }

    // set options
    for (item in options) {
        this.config[item] = options[item] || this.config[item];
    }

    config.mediaConstraints = config.mediaConstraints || {
        audio: this.config.audio.send,
        video: this.config.video.send || this.config.video.preview ? {
            mandatory: {
  //            maxWidth: 320,
  //            maxHeight: 180
            },
            optional: []
        } : false
    }

    // log if configured to
    if (this.config.log) logger = console;

    // where we'll store our peer connections
    this.pcs = {};

    // our socket.io connection
    connection = this.connection = io.connect(this.config.url, {
      'force new connection': true  // otherwise the 2nd instance of WebRTC will fail to connect
    });

    connection.on('connect', function () {
        self.emit('ready', connection.socket.sessionid);
        self.sessionReady = true;
        self.testReadiness();
    });

    connection.on('message', function (message) {
        var existing = self.pcs[message.from];
        if (existing) {
            existing.handleMessage(message);
        } else {
            // create the conversation object
            self.pcs[message.from] = new Conversation({
              id: message.from,
              parent: self,
              initiator: false
            });
            
            self.pcs[message.from].handleMessage(message);
        }
    });

    connection.on('joined', function (info) {
        logger.log('got a joined', info);
        // first 'joined' event carries my own id (as my own 'joined' event is the first one I can receive), all subsequent ones carry ids of other people who joined
        if (!self.id || info.id == self.id) {
          self.id = info.id;
          return;
        }
          
        if (!self.pcs[info.id])
          self.startCall(info.id);
    });
    
    connection.on('left', function (room) {
        var conv = self.pcs[room.id];
        if (conv)
          conv.end();
    });

    WildEmitter.call(this);

    // log events
    this.on('*', function (event, val1, val2) {
        logger.log('event:', event, val1, val2);
    });

    // auto request if configured
    if (this.config.autoRequestMedia) this.startLocalMedia();
}

WebRTC.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: WebRTC
    }
});

WebRTC.prototype.getEl = function (idOrEl) {
    if (typeof idOrEl == 'string') {
        return document.getElementById(idOrEl);
    } else {
        return idOrEl;
    }
};

// this accepts either element ID or element
// and either the video or audio tag itself or a container
// that will be used to put the video or audio tag into.
WebRTC.prototype.getLocalVideoContainer = function () {
    var local = this.config.local;
    if (!local)
      throw new Error('no local media container or element specified');
    
    var el = this.getEl(this.config.local._el);
    if (el && el.tagName === 'VIDEO') {
        return el;
    } else {
        var media = document.createElement('video');
        var options = this.config.local;
        if (options) {
          for (var opt in options) {
            if (!/_/.test(opt))
              media[opt] = options[opt];
          }
        }
        
        el.appendChild(media);
        return media;
    }
};

WebRTC.prototype.getRemoteMediaContainer = function () {
    return this.getEl(this.config.remote._el);
};

WebRTC.prototype.startCall = function (id) {
    this.pcs[id] = new Conversation({
        id: id,
        parent: this,
        initiator: true
    });
    
    this.pcs[id].start();
};

WebRTC.prototype.createRoom = function (name, cb) {
    if (arguments.length === 2) {
        this.connection.emit('create', name, cb);
    } else {
        this.connection.emit('create', name);
    }
};

WebRTC.prototype.joinRoom = function (name) {
    this.connection.emit('join', name);
    this.roomName = name;
};

WebRTC.prototype.leaveRoom = function () {
    if (this.roomName) {
        this.connection.emit('leave', this.roomName);
        for (var pc in this.pcs) {
            this.pcs[pc].end();
        }
    }
};

WebRTC.prototype.testReadiness = function () {
    var self = this;
    var sessionid = self.connection.socket.sessionid;
    if (this.sessionReady) {
      this.emit('readyToText', sessionid);
      if (this.localStreamSent || !this.config.local) {
        // This timeout is a workaround for the strange no-audio bug
        // as described here: https://code.google.com/p/webrtc/issues/detail?id=1525
        // remove timeout when this is fixed.
        var sessionid = self.connection.socket.sessionid;
        setTimeout(function () {
            self.emit('readyToCall', sessionid);
        }, 1000);
      }
    }
};

WebRTC.prototype.startLocalMedia = function (element) {
    var self = this,
        config = this.config,
        vConfig = config.video,
        aConfig = config.audio;
    
    if (!vConfig.preview && !vConfig.send && !aConfig.send)
      throw new Error('You have disabled video preview, and video/audio broadcasting');
      
    if (element) {
      if (element instanceof MediaStream)
        return this.addMediaFromStream(element);
      else if (element.src || element.mozSrcObject)
        return;
    }
    
    getUserMedia(this.config.mediaConstraints, this.addMediaFromStream.bind(this), function () {
        throw new Error('Failed to get access to local media.');
    });
};

WebRTC.prototype.addMediaFromStream = function(stream) {
  var config = this.config,
      vConfig = config.video,
      aConfig = config.audio,
      media;
      
  if (vConfig.preview) {
    media = this.getLocalVideoContainer();
    attachMediaStream(media, stream);
  }
  
  this.localStream = this.localStreamSent = stream;
  if (!vConfig.send) { // video mute
    this.localStreamSent = new MediaStream(stream.getAudioTracks());
  }
  else if (!aConfig.send) { // audio mute
    this.localStreamSent = new MediaStream(stream.getVideoTracks());
  }
  
  this.testReadiness();
  if (media) {
    this.emit('mediaAdded', {
      type: 'local',
      media: media,
      stream: stream
    });
  }
}


WebRTC.prototype.broadcastData = function (data) {
  data = typeof data === 'string' ? data : JSON.stringify(data);
  for (var conv in this.pcs) {
    var channel = this.pcs[conv].channel;
    if (channel.readyState == 'open')
      channel.send(data);
  }
};

WebRTC.prototype.sendData = function (to, data) {
  this.pcs[to].channel.send(typeof data === 'string' ? data : JSON.stringify(data));
};

WebRTC.prototype.send = function (to, type, payload) {
    this.connection.emit('message', {
        to: to,
        type: type,
        payload: payload
    });
};

function Conversation(options) {
    this.options = options || {};
    for (var o in this.options) {
      this[o] = this.options[o];
    }
    
    var self = this;
        dataCallbacks = ['onopen', 'onclose', 'onmessage', 'onerror'],
        config = this.parent.config,
        vConfig = config.video,
        aConfig = config.audio;
        
        
    // Create an RTCPeerConnection via the polyfill (adapter.js).
    this.pc = new RTCPeerConnection(this.parent.config.peerConnectionConfig, this.parent.config.peerConnectionContraints);
    this.pc.onicecandidate = this.onIceCandidate.bind(this);
    if ((vConfig.send || aConfig.send)  && this.parent.localStreamSent)
      this.pc.addStream(this.parent.localStreamSent);
    
    if (vConfig.receive || aConfig.receive) {
      this.pc.onaddstream = this.handleRemoteStreamAdded.bind(this);
      this.pc.onremovestream = this.handleStreamRemoved.bind(this);
    }
    
    if (config.data) {
      this.channel = this.pc.createDataChannel(
          'RTCDataChannel',
          isChrome ? {
            reliable: false
          } : {}
      );
      
      if (!isChrome) 
        this.channel.binaryType = 'blob';  
      
      for (var i = 0; i < dataCallbacks.length; i++) {
        var cbName = dataCallbacks[i],
            event = cbName.slice(2);
        
        // proxy data channel events to parent, so that the user can attach event handlers directly to the WebRTC instance, e.g. WebRTC.on('open', onOpenDataChannel); 
        this.channel[cbName] = this.getDataChannelHandler(event);
      }
      
      this.pc.ondatachannel = this.handleDataChannelAdded.bind(this);
    }

    // for re-use
    this.mediaConstraints = {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: !!config.audio.receive,
            OfferToReceiveVideo: !!config.video.receive
        }
    };
    
    WildEmitter.call(this);

    // proxy events to parent
    this.on('*', function (name, value) {
        self.parent.emit(name, value, self);
    });
}

Conversation.prototype = Object.create(WildEmitter.prototype, {
    constructor: {
        value: Conversation
    }
});

Conversation.prototype.getDataChannelHandler = function(event) {
  var self = this,
      defaultHandler = self['on' + event];
  
  return function(e) {    
    var args = [].slice.call(arguments);
    logger.log.apply(logger, ['event', event].concat(args));
    if (defaultHandler && defaultHandler.apply(self, arguments) == false)
      return;
    
    self.emit.apply(self, [event].concat(args)); // set Conversation instance as the context
  }
}

Conversation.prototype.handleMessage = function (message) {
    switch (message.type) {    
      case 'offer':
        logger.log('setting remote description');
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        this.answer();
        break;
      case 'answer':
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        break;
      case 'candidate':
        logger.log('message.payload', message.payload);
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.payload.label,
          candidate: message.payload.candidate
        });
        this.pc.addIceCandidate(candidate);
        break;
      default:
        debugger;
        break;
    }
};

Conversation.prototype.send = function (type, payload) {
  this.parent.send(this.id, type, payload);
};

Conversation.prototype.sendData = function (data) {
  this.channel.send(data);
};

Conversation.prototype.onIceCandidate = function (event) {
    if (this.closed) return;
    if (event.candidate) {
        this.send('candidate', {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
      logger.log("End of candidates.");
    }
};

Conversation.prototype.start = function () {
    var self = this;
    this.pc.createOffer(function (sessionDescription) {
        logger.log('setting local description');
        self.pc.setLocalDescription(sessionDescription);
        logger.log('sending offer', sessionDescription);
        self.send('offer', sessionDescription);
    }, null, this.mediaConstraints);
};

Conversation.prototype.end = function () {
//    debugger;
    if (this.channel && this.channel.readyState !== 'closed')
      this.channel.close();
  
    if (this.pc.signalingState !== 'closed')
      this.pc.close();
    
    this.handleStreamRemoved();
    this.handleDataChannelRemoved();
};

Conversation.prototype.answer = function () {
    var self = this;
    logger.log('answer called');
    this.pc.createAnswer(function (sessionDescription) {
        logger.log('setting local description');
        self.pc.setLocalDescription(sessionDescription);
        logger.log('sending answer', sessionDescription);
        self.send('answer', sessionDescription);
    }, null, this.mediaConstraints);
};

Conversation.prototype.handleDataChannelAdded = function (event) {
  debugger;
  var channel = event.channel;
//  if (!isChrome)
//    channel.binaryType = 'blob';  
};

Conversation.prototype.handleRemoteStreamAdded = function (event) {
    var stream = this.stream = event.stream,
        tag = stream.getVideoTracks().length ? 'video' : 'audio'
        el = document.createElement(tag),
        container = this.parent.getRemoteMediaContainer(),
        options = this.remote;
    
    el.id = this.id;
    if (options) {
      for (var opt in options) {
        if (!/_/.test(opt))
          el[opt] = options[opt];
      }
    }

    attachMediaStream(el, stream);
    if (container) 
      container.appendChild(el);
    
    this.emit('mediaAdded', {
      type: 'remote',
      media: el,
      stream: stream
    });
};

Conversation.prototype.handleDataChannelRemoved = function () {
  this.cleanup();
};

Conversation.prototype.handleStreamRemoved = function () {
    var media = document.getElementById(this.id),
        container = this.parent.getRemoteMediaContainer();
    
    this.stream = null;
    if (media) {
      if (container) container.removeChild(media);
      
      this.emit('videoRemoved', {
        type: 'remote',
        media: media
      });
    }
    
    this.cleanup();
};

// if media stream and data channel have both been closed, remove the peerConnection
Conversation.prototype.cleanup = function() {
  if (this.stream)
    return;
  
  var me = this.parent.pcs[this.id];
  if (!me || (me.channel && me.channel.readyState == 'open'))
    return;
  
  delete this.parent.pcs[this.id];
  this.closed = true;
}

// expose WebRTC
if (typeof define === 'function' && define.amd) {
  define('lib/simplewebrtc', function() {
    return WebRTC;
  });
}
else
  window.WebRTC = WebRTC;

})(window)
//return WebRTC;
//
//});
