//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  var URL = window.URL || window.webkitURL;

  var requestAnimationFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame || window.oRequestAnimationFrame;

  var cancelAnimationFrame = window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame ||
      window.msCancelAnimationFrame || window.oCancelAnimationFrame;
  
  return BasicView.extend({
    template: 'cameraPopupTemplate',
    tagName: 'li',
    id: '#addBtn',
    events: {
      'click #camVideo'         : 'stop',
      'click canvas'            : 'start',
      'click #cameraSubmitBtn'  : 'submit',
      'click #cameraShootBtn'   : 'startOrStop',
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
        U.require('lib/Whammy').done(this.readyDfd.resolve);
      else
        this.readyDfd.resolve();

      this.autoFinish = false;
      return this;
    },
    destroy: function() {
      this.video && this.video.pause();
      this.$el.empty();
      this.$el.remove();
    },
    submit: function(e) {
      Events.stopEvent(e);
//      var data = ('mozGetAsFile' in canvas) ?
//                 canvas.mozGetAsFile('webcam.png') :
//                 canvas.toDataURL('image/png'); //.replace(/^data:image\/(png|jpg);base64,/, '');
      var data = this.isVideo ? this.webmBlob : this.canvas.toDataURL('image/png');
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
      this.setstate('recording');
      this.ctx = canvas.getContext('2d');
      this.frames = [];
      this.rafId = requestAnimationFrame(this.drawVideoFrame_);
    },
    start: function(e) {
      Events.stopEvent(e);
      this.reshoot();
    },
    stop: function(e) {
      Events.stopEvent(e);
      if (this.state == 'previewing')
        this.takepicture();
      
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
      var $popup = $('#cameraPopup');
      this.setElement($popup[0]);

      $popup.trigger('create');
      $popup.popup().popup("open");

      var streaming     = false;
      this.$video       = this.$('#camVideo');
      this.video        = this.$video[0];
      this.$videoPrevDiv = this.$('#camVideoPreview');
      this.videoPrevDiv = this.$videoPrevDiv[0];
      this.$canvas      = this.$('#canvas');
      this.canvas       = this.$canvas[0];
      this.$shootBtn    = this.$('#cameraShootBtn');
      this.$submitBtn   = this.$('#cameraSubmitBtn');
      this.width        = this.innerWidth(); //width - this.padding();
      this.height       = 0;
      this.finalheight  = 0;
      this.rafId        = null;
      this.frames       = null;
      this.initialShootBtnText = this.initialShootBtnText || this.$shootBtn.find('.ui-btn-text').text();
        
      this.setstate('previewing');
      navigator.getMedia(
        {
          video: true,
          audio: false
        },
        function(stream) {
          if (navigator.mozGetUserMedia) {
            this.video.mozSrcObject = stream;
          } else {
            var vendorURL = window.URL || window.webkitURL;
            this.video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
          }
          
          this.video.play();
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
//      
//      _.each(media_events, function(event) {
//        this.video.addEventListener(event, function(ev) {
//          G.log(this.TAG, 'video event', event, 'videoWidth', this.video.videoWidth, 'videoHeight', this.video.videoHeight);
//        }.bind(this));
//      }.bind(this));
      
      /* Event Handlers */
      this.video.addEventListener('canplay', function(ev) {
        if (!streaming) {
          this.setDimensions();
          this.$shootBtn.removeClass('ui-disabled');
          streaming = true;
        }
      }.bind(this), false);

//      video.addEventListener('click', function(ev){
//        setstate('reviewing');
//        takepicture();
//      }, false);
//
//      startbutton.addEventListener('click', function(ev){
//        if (state === 'uploaded') {
//          setstate('previewing');
//        }
//        ev.preventDefault();
//      }, false);
//
//      uploadbutton.addEventListener('click', function(ev){
//        if (state === 'reviewing') {
//          setstate('uploading');
//          upload();
//        }
//        ev.preventDefault();
//      }, false)
      
      this.finish();
      return this;
    },
    setDimensions: function() {
      var vWidth, vHeight; 
      if (!this.video.videoWidth) {
        vWidth = this.getPageView().innerWidth() - this.padding();
        vHeight = Math.round(vWidth * 3 / 4);
      }
      else {
        vWidth = this.video.videoWidth;
        vHeight = this.video.videoHeight;
      }
      
      var limitingDimension = this.width 
      this.finalheight = Math.round(vHeight / (vWidth / this.width));
      this.$video.attr('width', this.width);
      this.$video.attr('height', this.finalheight);
      this.$canvas.attr('width', this.width);
      this.$canvas.attr('height', this.finalheight);
    },
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
        this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.width, this.finalheight);
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
          this.embedVideoPreview();
          this.$canvas.hide();
          this.$video.hide();
        }
        else {
          this.$videoPrev && this.$videoPrev.hide();
        }
      }
    },
    
    embedVideoPreview: function(opt_url) {
      var url = opt_url || null;
      var video = this.$('#camVideoPreview video')[0] || null;
//      var downloadLink = $('#camVideoPreview a[download]') || null;

      if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
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
        
        this.webmBlob = Whammy.fromImageArray(this.frames, 1000 / 60);
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