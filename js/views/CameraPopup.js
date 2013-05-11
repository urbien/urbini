//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  var recIndex = 0;
  var Whammy, Recorder;
  var URL = window.URL || window.webkitURL;

  var requestAnimationFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame || window.oRequestAnimationFrame;

  var cancelAnimationFrame = window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame ||
      window.msCancelAnimationFrame || window.oCancelAnimationFrame;
  
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  
  return BasicView.extend({
    template: 'cameraPopupTemplate',
    tagName: 'li',
    id: '#addBtn',
    events: {
      'click #camVideo'         : 'stop',
      'click canvas'            : 'start',
      'click #cameraSubmitBtn'  : 'submit',
      'click #cameraShootBtn'   : 'startOrStop',
      'click #cameraCancelBtn'  : 'destroy',
      'resize'                  : 'onresize',
      'orientationchange'       : 'onorientationchange'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'start', 'stop', 'reset', 'drawVideoFrame_');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      this.prop = options.prop;
      var prop = this.vocModel.properties[this.prop];
      this.isVideo = prop.range.endsWith('model/portal/Video');
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      if (this.isVideo)
        U.require(['lib/whammy', 'lib/recorder', 'lib/recorderWorker']).done(function(W, R) {
          Whammy = W;
          Recorder = R;
          this.readyDfd.resolve();
        }.bind(this));
      else
        this.readyDfd.resolve();

      Events.on('pageChange', function() {
        if (!this.pageView.isActive())
          this.destroy();
      }, this);
      
      this.autoFinish = false;
      return this;
    },
    destroy: function() {
      this.video && this.video.pause();
      this.audio && this.audio.pause();
      this.stream && this.stream.stop(); // turn off webcam
      this.$el && this.$el.empty() && this.$el.remove();
      this.remove();
    },
    submit: function(e) {
      Events.stopEvent(e);
//      var data = ('mozGetAsFile' in canvas) ?
//                 canvas.mozGetAsFile('webcam.png') :
//                 canvas.toDataURL('image/png'); //.replace(/^data:image\/(png|jpg);base64,/, '');
      var data;
      if (this.isVideo) {
        data = {
          video: this.webmBlob,
          audio: this.audioBlob
        }
      }
      else 
        data = this.canvas.toDataURL('image/png');
      
      this.trigger(this.isVideo ? 'video' : 'image', {
        prop: this.prop, 
        data: data,
        width: this.$canvas.width(),
        height: this.$canvas.height()
      });
      
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
      if (this.isVideo)
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
      this.ctx = canvas.getContext('2d');
      this.frames = [];
      this.rafId = requestAnimationFrame(this.drawVideoFrame_);
      
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
      if (this.state == 'previewing')
        this.takepicture();
      
      if (this.hasAudio) {
        // stop audio recording
        this.audioRecorder.stop();
      }
      
//      this.audioRecorder.getBuffers( drawWave );
      this.setstate('reviewing');
    },
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, arguments);
      }.bind(this));
    },
    renderHelper: function(options) {    
//      var popupHtml = this.template({
//        style: "width:{0};height:{1}".format(width, height)
//      });
      
      this.$el.html(this.template({
        video: this.isVideo
      }));
      var doc = document;
//      var page = this.getPageView();
//      var width = page.innerWidth();
//      var height = page.innerHeight();
//      var ratio = width/height;
//      if (ratio > 4/3)
//        width = height * 4/3;
//      else
//        height = width * 3/4;
     
      $('#cameraPopup').remove();
      $(doc.body).append(this.el);
      this.$popup = $('#cameraPopup');
      this.setElement(this.$popup[0]);

      this.$popup.trigger('create');
      this.$popup.popup().popup("open");
//      this.$popup.on('popupafterclose', this.destroy, this);
      
      // video
      var streaming     = false;
      this.$video       = this.$('#camVideo');
      this.video        = this.$video[0];
      this.video.muted  = true;

      this.$videoPrevDiv = this.$('#camVideoPreview');
      this.videoPrevDiv = this.$videoPrevDiv[0];
      this.$canvas      = this.$('#canvas');
      this.canvas       = this.$canvas[0];
      this.$shootBtn    = this.$('#cameraShootBtn');
      this.$submitBtn   = this.$('#cameraSubmitBtn');
      this.width        = this.innerWidth(); //width - this.padding();
      this.height       = 0;
      this.rafId        = null;
      this.frames       = null;
      this.initialShootBtnText = this.initialShootBtnText || this.$shootBtn.find('.ui-btn-text').text();
        
      // audio
      if (this.isVideo && AudioContext) {
        this.hasAudio = true;
        this.audioContext = new AudioContext();
        this.audioInput = null;
        this.realAudioInput = null;
        this.inputPoint = null;
        this.audioRecorder = null;
        this.recIndex = 0;
      }
      
      this.setstate('previewing');
      navigator.getMedia(
        {
          video: true,
          audio: this.hasAudio
        },
        function(stream) {
          this.stream = stream; // need to set this.stream to ensure this.destroy() has access to it to stop it
          if (!this.$('#camVideo').length) {
            // popup was canceled already
            this.destroy();
            return;
          }
          
          this.startVideo(stream);
          this.startAudio(stream);
        }.bind(this),
        function(err) {
          U.alert({
            msg: "If you change your mind, enable this app to use your camera before trying again"
          });
          
          this.destroy();
        }.bind(this)
      );

//      var media_events = {};
//      media_events["loadstart"] = 0;
//      media_events["progress"] = 0;
//      media_events["suspend"] = 0;
//      media_events["abort"] = 0;
//      media_events["error"] = 0;
//      media_events["emptied"] = 0;
//      media_events["stalled"] = 0;
//      media_events["loadedmetadata"] = 0;
//      media_events["loadeddata"] = 0;
//      media_events["canplay"] = 0;
//      media_events["canplaythrough"] = 0;
//      media_events["playing"] = 0;
//      media_events["waiting"] = 0;
//      media_events["seeking"] = 0;
//      media_events["seeked"] = 0;
//      media_events["ended"] = 0;
//      media_events["durationchange"] = 0;
//      media_events["timeupdate"] = 0;
//      media_events["play"] = 0;
//      media_events["pause"] = 0;
//      media_events["ratechange"] = 0;
//      media_events["volumechange"] = 0;
      
      
      var video = this.video, 
          $video = $(video);
      var checkSize = function(e) {
        if (video.videoWidth) {
          this.setDimensions();
          this.$shootBtn.removeClass('ui-disabled');
          _.each(G.media_events, function(e) {
            $video.off(e, checkSize);
          });
        }
      }.bind(this);
          
      _.each(G.media_events, function(e) {
        $video.one(e, checkSize);
      });
      
      this.finish();
      return this;
    },
    
    startVideo: function(stream) {
      if (navigator.mozGetUserMedia) {
        this.video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        this.video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
      }
    },
    
    startAudio: function(stream) {
      if (!this.hasAudio)
        return;
      
      this.inputPoint = this.audioContext.createGainNode();

      // Create an AudioNode from the stream.
      this.realAudioInput = this.audioContext.createMediaStreamSource(stream);
      this.audioInput = this.realAudioInput;
      this.audioInput.connect(this.inputPoint);
      this.audioRecorder = new Recorder(this.inputPoint);
    },

    setDimensions: function() {
      if (!this.video.videoWidth)
        return;
        
      var $window = $(window),
          wWidth = $window.width(),
          wHeight = $window.height(),
          vWidth = this.video.videoWidth,
          vHeight = this.video.videoHeight;
      
      this.$canvas.attr('width', vWidth);
      this.$canvas.attr('height', vHeight);
      var $popup = this.$el.parent();
      $popup.css('top', Math.round(wHeight / 2 - vHeight / 2));
      $popup.css('left', Math.round(wWidth / 2 - vWidth / 2));
    },
    
//    setDimensions: function() {
//      var vWidth = this.width, vHeight;
//      if (!this.video.videoWidth) {
////        vWidth = this.page.innerWidth() - this.padding();
//        vHeight = Math.round(this.width * 3 / 4);
//      }
//      else {
//        vWidth = this.video.videoWidth;
//        vHeight = this.video.videoHeight;
//      }
//      
////      if (vWidth / vHeight > 4/3)
////        vWidth = Math.round(vHeight * 4/3);
////      else
////        vHeight = Math.round(vWidth * 3/4);
////      
////      this.finalheight = Math.round(vHeight / (vWidth / this.width));
////      this.$video.attr('width', this.width);
////      this.$video.attr('height', this.finalheight);
////      this.$canvas.attr('width', this.width);
////      this.$canvas.attr('height', this.finalheight);
////      this.width = vWidth;
//      this.height = vHeight;
//      this.$video.attr('width', vWidth);
//      this.$video.attr('height', vHeight);
//      this.$canvas.attr('width', vWidth);
//      this.$canvas.attr('height', vHeight);
//    },
    onresize: function(e) {
      this.setDimensions();
    },
    onorientationchange: function(e) {
      this.setDimensions();
    },
    takepicture: function() {
//      this.canvas.width = this.width;
//      this.canvas.height = this.finalheight;
      if (!this.isVideo)
        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.width, this.height);
//      var img = new Image();
//      img.src = 'mozfest.png';
//      console.log(img);
//      canvas.getContext('2d').drawImage(img, 0, 450-104, 640, 104);
    },

    reshoot: function() {
      this.setstate(this.isVideo ? 'recording' : 'previewing');
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
          shootBtnText = this.isVideo ? 'Record' : 'Shoot';
          break;
        case 'recording':
//          this.video.muted = true;
          videoOn = this.isVideo;
          shootAddCl = stopCl;
          shootBtnText = 'Stop';
          break;
      }
      
      colorCl = colorCl || 'black';
      this.$video[videoOn ? 'show' : 'hide']();
      this.$canvas[videoOn ? 'hide' : 'show']();
      
      if (this.rendered) {
        if (this.isVideo) {
          this.$shootBtn.find('.ui-btn-text').html(shootBtnText);
        }
        else {
          this.$shootBtn.find('.ui-btn-text').html(videoOn ? this.initialShootBtnText : 'Redo');
        }
        
        _.each([camCl, repeatCl, stopCl, 'red', 'black'], function(cl) {          
          shootBtnGuts = shootBtnGuts && shootBtnGuts.length ? shootBtnGuts : this.$shootBtn.find('.' + cl);
          shootBtnGuts.removeClass(cl);
        }.bind(this));
        
        this.$shootBtn.button();
        shootBtnGuts.addClass(shootAddCl);
        this.$submitBtn[videoOn ? 'addClass' : 'removeClass']('ui-disabled');
        this.$shootBtn.removeClass('ui-disabled');
      }

//      if (shootBtnGuts && colorCl)
//        shootBtnGuts.addClass(colorCl);
      
      if (this.isVideo) {
        if (this.state === 'reviewing') {
          cancelAnimationFrame(this.rafId);
          this.video.pause();
          this.embedVideoPreview();
          this.exportAudioForDownload();
          this.$canvas.hide();
          this.$video.hide();
        }
        else {
          this.video.play();
          this.$videoPrev && this.$videoPrev.hide();
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
          this.audioBlob = blob;
          this.syncAudioVideo();
//          Recorder.forceDownload(blob, "myRecording" + ((this.recIndex < 10) ? "0" :"") + this.recIndex + ".wav" );
        }
      }.bind(this));
    },
    
    syncAudioVideo: function(opt_url) {
      if (!this.hasAudio)
        return;
      
      var url = opt_url || null;
      var audio = this.$('#camVideoPreview audio')[0] || null;
//    var downloadLink = $('#camVideoPreview a[download]') || null;

      if (!audio) {
        audio = document.createElement('audio');
        audio.controls = false;
        audio.width = 0;
        audio.height = 0;
        this.videoPrevDiv.appendChild(audio);
        this.$audioPrev = this.$('#camVideoPreview audio');
        this.audioPrev = this.$audioPrev[0];
      } else {
        window.URL.revokeObjectURL(audio.src);
      }
  
      if (!url) {
        url = URL.createObjectURL(this.audioBlob);
      }
      
      audio.src = url;
      var vid = this.videoPrev;
      vid.addEventListener('play', function() {
        // play audio
        audio.play();
      });
      
      vid.addEventListener('pause', function() {
        // pause audio
        audio.pause();
      });
    },
    
    embedVideoPreview: function(opt_url) {
      var url = opt_url || null;
      var video = this.$('#camVideoPreview video')[0] || null;
//      var downloadLink = $('#camVideoPreview a[download]') || null;

      if (!video) {
        video = document.createElement('video');
//        video.autoplay = true;
        video.controls = true;
//        video.loop = true;
        //video.style.position = 'absolute';
        //video.style.top = '70px';
        //video.style.left = '10px';
        video.style.width = this.canvas.width + 'px';
        video.style.height = this.canvas.height + 'px';
        this.videoPrevDiv.appendChild(video);
        this.$videoPrev = this.$('#camVideoPreview video');
        this.videoPrev = this.$videoPrev[0];
        
//        downloadLink = document.createElement('a');
//        downloadLink.download = 'capture.webm';
//        downloadLink.textContent = '[ download video ]';
//        downloadLink.title = 'Download your .webm video';
//        var p = document.createElement('p');
//        p.appendChild(downloadLink);
//
//        $('#video-preview').appendChild(p);

      } else {
        window.URL.revokeObjectURL(video.src);
      }

      // https://github.com/antimatter15/whammy
      // var encoder = new Whammy.Video(1000/60);
      // frames.forEach(function(dataURL, i) {
      //   encoder.add(dataURL);
      // });
      // var webmBlob = encoder.compile();

      if (!url) {
        this.frames = _.filter(this.frames, function(f) {
          return f !== "data:,";
        });
        
        var framesPerSecond = Math.round(this.frames.length / ((this.stopTime - this.startTime) / 1000));
        this.webmBlob = Whammy.fromImageArray(this.frames, framesPerSecond);
        url = URL.createObjectURL(this.webmBlob);
      }

      video.src = url;
//      downloadLink.href = url;
      this.$videoPrev.show();
    },

    drawVideoFrame_: function(time) {
      this.rafId = requestAnimationFrame(this.drawVideoFrame_);

      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

//      document.title = 'Recording...' + Math.round((Date.now() - startTime) / 1000) + 's';

      // Read back canvas as webp.
      var url = this.canvas.toDataURL('image/webp', 1); // image/jpeg is way faster :(
      this.frames.push(url);
    }

  },
  {
    displayName: 'CameraPopup'
  });
});