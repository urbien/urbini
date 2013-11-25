//'use strict';
define('views/CameraPopup', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  var recIndex = 0,
      Whammy, 
      Recorder,
      URL = window.URL || window.webkitURL,
      AudioContext = /*window.AudioContext ||*/ window.webkitAudioContext; // firefox doesn't have audioContext.createMediaStreamSource

  return BasicView.extend({
    template: 'cameraPopupTemplate',
    tagName: 'div',
    autoFinish: false,
    events: {
//      'click #camVideo'         : 'stop',
//      'click canvas'            : 'start',
      'click #cameraSubmitBtn'  : 'submit',
      'click #cameraShootBtn'   : 'startOrStop',
      'click #cameraCancelBtn'  : 'destroy'
    },
    
    windowEvents: {
      'resize'                   : 'onresize',
      'orientationchange'        : 'onorientationchange'
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'start', 'stop', 'reset', 'drawVideoFrame_', 'checkVideoSize');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      this.prop = options.prop;
      var prop = this.vocModel.properties[this.prop],
          self = this;
      
      _.each(['Video', 'Audio', 'Image'], function(type) {
        self['is' + type] = prop.range.endsWith('model/portal/' + type);
      });
      
      if (this.isVideo) {
        this.videoWidth = 320;
        this.videoHeight = 240;
      }
      
      this.hasAudio = !!AudioContext && (this.isVideo || this.isAudio);
      this.hasVideo = this.isVideo || this.isImage;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      var req = this.hasAudio || this.isVideo ? ['lib/recorder', 'lib/recorderWorker'] : [];
      if (this.isVideo) {
        req.unshift('lib/whammy');
      }
      
      if (this.isVideo || this.hasAudio) {
        U.require(req).done(function(W, R) {
          if (this.isVideo) {
            Whammy = W;
            Recorder = R;
          }
          else
            Recorder = W;
          this.readyDfd.resolve();
        }.bind(this));
      }
      else
        this.readyDfd.resolve();

      this.listenTo(Events, 'pageChange', function() {
        if (!this.pageView.isActive())
          this.destroy();
      }, this);
      
      return this;
    },
    destroy: function() {
      this.destroyed = true;
      this.video && this.video.pause();
      this.audio && this.audio.pause();
      this.stream && this.stream.stop(); // turn off webcam
      BasicView.prototype.destroy.call(this);
//      this.$el && this.$el.empty() && this.$el.remove();
//      this.remove();
    },
    submit: function(e) {
      Events.stopEvent(e);
      var data;
      if (this.isVideo) {
        data = {
//          video: this.videoUrl,
//          audio: this.audioUrl
          video: this.webmBlob,
          audio: this.audioBlob
        }
      }
      else if (this.hasAudio) {
        data = {
          audio: this.audioBlob
        }
      }
      else 
        data = this.canvas.toDataURL('image/png');
      
      var result = {
        prop: this.prop,
        data: data
      };
      
      if (!this.isAudio) {
        result.width = this.canvas.width;
        result.height = this.canvas.height;
      }
      
      this.trigger(this.isVideo ? 'video' : this.isAudio ? 'audio' : 'image', result);
      this.destroy();
    },
    reset: function(e) {
      Events.stopEvent(e);
      if (this.state === 'reviewing') {
        this.setstate('previewing');
      }
    },
    startOrStop: function(e) {
      Events.stopEvent(e);
      var previewing = this.state === 'previewing';
      if (this.isVideo || this.isAudio)
        this[previewing || this.state === 'reviewing' ? 'record' : 'stop'](e); 
      else
        this[previewing ? 'stop' : 'start'](e); 
    },
//    play: function(e) {
//      Events.stopEvent(e);
//      this.setstate('playing');      
//    },
    record: function(e) {
      Events.stopEvent(e);
      this.startTime = +new Date();
      this.setstate('recording');
      if (this.isVideo) {
        this.ctx = this.canvas.getContext('2d');
        if (this.frames)
          this.frames.length = 0;
        else
          this.frames = [];
        
        this.rafId = requestAnimationFrame(this.drawVideoFrame_);
      }
      
      // start audio recording
      if (!this.hasAudio)
        return;
      
      this.audioRecorder.clear();
      this.audioRecorder.record();
    },
    start: function(e) {
      Events.stopEvent(e);
      this.reshoot();
    },
    stop: function(e) {
      Events.stopEvent(e);
      this.stopTime = +new Date();
      if (this.isImage && this.state == 'previewing')
        this.takepicture();
      
      if (this.hasAudio) {
        // stop audio recording
        this.audioRecorder.stop();
      }
      
//      this.audioRecorder.getBuffers( drawWave );
      this.setstate('reviewing');
    },
    render: function() {
      var self = this,
          args = arguments;
      
      this.ready.done(function() {
        self.renderHelper.apply(self, arguments);
      });
    },
    renderHelper: function(options) {    
      this.html(this.template({
        video: this.isVideo,
        audio: this.isAudio,
        image: this.isImage
      }));
      
      var doc = document;
      $('#cameraPopup').remove();
      this.$('#cameraCancelBtn')[0].addEventListener('click', this.destroy);
      $(doc.body).append(this.el);

      this.popup = $('#cameraPopup');
      this.setElement(this.popup);

      var cp = $(this.popup).trigger('create');
      if (G.isJQM())
        cp.popup().popup("open");
      else {
        this.el.parentNode.style['position'] = "absolute";
        this.el.parentNode.style['top'] = '20%';
        this.el.parentNode.style['width'] = '100%';
      }
      var streaming     = false;
      this.previewDiv = this.$('#camPreview')[0];
      if (this.hasVideo) {
        // video
        this.video       = this.$('#camVideo')[0];
        this.video.muted  = true;
  
        this.canvas      = this.$('#canvas')[0];
        this.canvas.width = this.videoWidth;
        this.canvas.height = this.videoHeight;
      }
      
      this.shootBtn    = this.$('#cameraShootBtn')[0];
      this.submitBtn   = this.$('#cameraSubmitBtn')[0];
      this.rafId        = null;
      this.frames       = null;
      this.initialShootBtnText = this.initialShootBtnText || (G.isJQM() ? this.shootBtn.getElementsByClassName('ui-btn-text')[0].innerText : this.shootBtn.innerText);
        
      // audio
      if (this.hasAudio) {
        this.audioContext = new AudioContext();
        this.audioInput = null;
        this.realAudioInput = null;
        this.inputPoint = null;
        this.audioRecorder = null;
        this.recIndex = 0;
      }
      
      var videoConstraints = this.isVideo ? {
        mandatory: {
          minWidth: this.videoWidth,
          minHeight: this.videoHeight,
          maxWidth: this.videoWidth,
          maxHeight: this.videoHeight
        }
      } : this.hasVideo ? true : false;
      
      this.setstate('previewing');
      navigator.getMedia(
        {
          video: videoConstraints,
          audio: this.hasAudio
        }
        ,
        function(stream) {
          this.stream = stream; // need to set this.stream to ensure this.destroy() has access to it to stop it
//          if (!this.$('#camVideo').length) {
          if (this.destroyed) {
            // popup was canceled already
            this.destroy();
            return;
          }
          
          if (this.hasVideo)
            this.startVideo(stream);
          if (this.hasAudio)
            this.startAudio(stream);
        }.bind(this),
        function(err) {
          U.alert({
            msg: "If you change your mind, enable this app to use your camera before trying again"
          });
          
          this.destroy();
        }.bind(this)
      );

      var video = this.video, 
          $video = $(video);
      
      this.finish();
      return this;
    },
    
    startVideo: function(stream) {
      if (navigator.mozGetUserMedia) {
        this.video.mozSrcObject = stream;
      } else {
        this.video.src = window.URL ? window.URL.createObjectURL(stream) : stream;
      }
      
      this.checkVideoSize();
    },
    
    checkVideoSize: function() { // in Firefox, videoWidth is not available on any events...annoying
      if (!this.video.videoWidth) {
        setTimeout(this.checkVideoSize, 100);
        return;
      }
      
      this.shootBtn.classList.remove('ui-disabled');
      this.adjustPopup();
    },
    
    startAudio: function(stream) {
      if (!this.hasAudio)
        return;
      
      if (G.browser.chrome)
        stream = new window.MediaStream(stream.getAudioTracks());
        
      this.inputPoint = this.audioContext.createGainNode();

      // Create an AudioNode from the stream.
      this.realAudioInput = this.audioContext.createMediaStreamSource(stream);
      this.audioInput = this.realAudioInput;
      this.audioInput.connect(this.inputPoint);
      this.audioRecorder = new Recorder(this.inputPoint);
      this.shootBtn.classList.remove('ui-disabled');
    },

    adjustPopup: function() {
//      var vWidth = this.video.videoWidth,
//          vHeight = this.video.videoHeight,
//          viewport = G.viewport,
//          wWidth = viewport.width,
//          wHeight = viewport.height;
//      
//      var popup = this.el.parentNode;
//      var offset = $(document).scrollTop();
//      $popup.css('top', Math.round(wHeight / 2 - vHeight / 2) + offset);
//      $popup.css('left', Math.round(wWidth / 2 - vWidth / 2));
    },
    
    onresize: function(e) {
      this.adjustPopup();
    },
    onorientationchange: function(e) {
      this.adjustPopup();
    },
    takepicture: function() {
//      this.canvas.width = this.width;
//      this.canvas.height = this.finalheight;
      if (!this.isVideo) {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
      }
//      var img = new Image();
//      img.src = 'mozfest.png';
//      console.log(img);
//      canvas.getContext('2d').drawImage(img, 0, 450-104, 640, 104);
    },

    reshoot: function() {
      this.setstate(this.isVideo || this.isAudio ? 'recording' : 'previewing');
    },

    setstate: function(newstate) {
      var prevState = this.state;
      this.state = newstate;
      var camCl = this.isVideo ? 'ui-icon-circle' : 'ui-icon-camera',
          stopCl = 'ui-icon-stop',
          repeatCl = 'ui-icon-repeat',
          videoOn, 
          shootBtnText,
          colorCl,
          shootBtnGuts;
//          reviewing = this.state === 'reviewing',
//          recording = this.state === 'recording',
//          videoOn = recording || this.state === 'previewing',
//          shootRemoveCl = recording ? camCl : videoOn ? repeatCl : camCl,
//          shootAddCl = recording ? stopCl : videoOn ? camCl : repeatCl;

//      this.video.muted = false;
      switch (this.state) {
        case 'reviewing':
          shootAddCl = repeatCl;
          shootBtnText = 'Redo';
          break;
        case 'previewing':
          videoOn = true;
          shootAddCl = videoOn ? camCl : repeatCl;
          colorCl = 'red';
          shootBtnText = this.isVideo || this.isAudio ? 'Record' : 'Shoot';
          break;
        case 'recording':
//          this.video.muted = true;
          videoOn = this.isVideo;
          shootAddCl = stopCl;
          shootBtnText = 'Stop';
          break;
      }
      
      colorCl = colorCl || 'black';
      if (this.isVideo || this.isImage) {
        this.video[videoOn ? '$show' : '$hide']();
        this.canvas[videoOn ? '$hide' : '$show']();
      }
      
      if (this.rendered) {
        if (this.isVideo || this.isAudio) {
          this.shootBtn.getElementsByClassName('ui-btn-text')[0].html(shootBtnText);
        }
        else {
          this.shootBtn.getElementsByClassName('ui-btn-text')[0].html(videoOn ? this.initialShootBtnText : 'Redo');
        }
        
        _.each([camCl, repeatCl, stopCl, 'red', 'black'], function(cl) {          
          shootBtnGuts = shootBtnGuts && shootBtnGuts.length ? shootBtnGuts : this.shootBtn.$('.' + cl);
          shootBtnGuts.classList.remove(cl);
        }.bind(this));
        
        $(this.shootBtn).button();
        shootBtnGuts.classList.add(shootAddCl);
        this.submitBtn[videoOn ? '$addClass' : '$removeClass']('ui-disabled');
        this.shootBtn.classList.remove('ui-disabled');
      }

//      if (shootBtnGuts && colorCl)
//        shootBtnGuts.addClass(colorCl);
      
      if (this.isVideo || this.isAudio) {
        if (this.state === 'reviewing') {
          if (this.isVideo) {
            cancelAnimationFrame(this.rafId);
            this.video.pause();
            this.embedVideoPreview();
          	this.exportAudioForDownload();
            this.canvas.$hide();
            this.video.$hide();
          }
          else
            this.exportAudioForDownload();
        }
        else {
          if (this.isVideo) {
            this.previewDiv.$hide();
            this.video.play();
          }
        }
      }
      
//      if (!this.rendered) {
//        this.$popup.resize();
//      }
    },
    
    exportAudioForDownload: function() {
      if (!this.hasAudio)
        return;
      
      this.audioRecorder.exportWAV(function(blob) {
        if (typeof blob === 'string')
          console.log(blob);
        else {
//          Recorder.forceDownload( blob, "myRecording" + G.nextId() + ".wav" );
          this.audioBlob = blob;
          this.setupAudioPreview();
//          Recorder.forceDownload(blob, "myRecording" + ((this.recIndex < 10) ? "0" :"") + this.recIndex + ".wav" );
        }
      }.bind(this));
    },
    
    setupAudioPreview: function(opt_url) {
      if (!this.hasAudio)
        return;
      
      var url = opt_url || null;
      var audio = this.$('#camPreview audio')[0];
      if (!audio) {
        audio = document.createElement('audio');
        if (this.isAudio) {
          audio.controls = true;
        }
        else {
          audio.controls = false;
          audio.width = 0;
          audio.height = 0;
        }
        
        this.previewDiv.appendChild(audio);
        this.audioPrev = this.$('#camPreview audio')[0];
      } else {
        window.URL.revokeObjectURL(audio.src);
      }
  
      if (!url) {
        url = window.URL.createObjectURL(this.audioBlob);
      }
      
      this.audioUrl = url;
      audio.src = url;
      if (this.isVideo) {
        var vid = this.videoPrev;
        vid.addEventListener('play', function() {
          // play audio
          audio.play();
        });
        
        vid.addEventListener('pause', function() {
          // pause audio
          audio.pause();
        });
      }
    },
    
    embedVideoPreview: function(opt_url) {
      var url = opt_url || null;
      var video = this.$('#camPreview video')[0] || null;
//      var downloadLink = $('#camPreview a[download]') || null;

      if (!video) {
        video = document.createElement('video');
        video.controls = true;
        video.style.width = this.videoWidth + 'px';
        video.style.height = this.videoHeight + 'px';
        this.previewDiv.appendChild(video);
        this.videoPrev = this.$('#camPreview video')[0];
      } else {
        window.URL.revokeObjectURL(video.src);
      }

//       https://github.com/antimatter15/whammy
      if (!url) {
        this.frames = _.filter(this.frames, function(f) {
          return f !== "data:,";
        });
        
        var framesPerSecond = Math.round(this.frames.length / ((this.stopTime - this.startTime) / 1000));
//        if (G.navigator.isFirefox) {
//          var encoder = new Whammy.Video(framesPerSecond);
//          this.frames.forEach(function(dataURL, i) {
//            encoder.add(dataURL);
//          });
//          
//          this.webmBlob = encoder.compile();
//        }
//        else {
          this.webmBlob = Whammy.fromImageArray(this.frames, framesPerSecond);
//        }
        
        url = window.URL.createObjectURL(this.webmBlob);
      }

      this.videoUrl = url;
      video.src = url;
//      downloadLink.href = url;
      var style = this.previewDiv.style;
      style.width = this.videoWidth;
      style.height = this.videoHeight;
      this.previewDiv.$show();
    },

    drawVideoFrame_: function(time) {
      this.rafId = requestAnimationFrame(this.drawVideoFrame_);

      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      // Read back canvas as webp.
      var url = this.canvas.toDataURL('image/webp', 1); // image/jpeg is way faster :(
      this.frames.push(url);
    }

  },
  {
    displayName: 'CameraPopup'
  });
});