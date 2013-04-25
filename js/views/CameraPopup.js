//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  return BasicView.extend({
    template: 'cameraPopupTemplate',
    tagName: 'li',
    id: '#addBtn',
    events: {
      'click video'             : 'stop',
      'click canvas'            : 'start',
      'click #cameraSubmitBtn'  : 'submit',
      'click #cameraShootBtn'   : 'startOrStop'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'start', 'stop', 'reset');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      this.prop = options.prop;
      return this;
    },
    destroy: function() {
      this.video && this.video.pause();
      this.$el.empty();
      this.$el.remove();
    },
    submit: function(e) {
      Events.stopEvent(e);
      var data = ('mozGetAsFile' in canvas) ?
                 canvas.mozGetAsFile('webcam.png') :
                 canvas.toDataURL('image/png'); //.replace(/^data:image\/(png|jpg);base64,/, '');

      this.trigger('image', {
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
        this.setstate('playing');
      }
    },
    startOrStop: function(e) {
      Events.stopEvent(e);
      if (this.$shootBtn.find('.ui-btn-text').text() === 'Shoot')
        this.stop(e);
      else
        this.start(e);
    },
    start: function(e) {
      Events.stopEvent(e);
      this.reshoot();
    },
    stop: function(e) {
      Events.stopEvent(e);
      if (this.state == 'playing')
        this.takepicture();
      
      this.setstate('reviewing');
    },
    render: function(options) {
      this.$el.html(this.template());
      var doc = document;
      $('#cameraPopup').remove();
      var popupHtml = this.template();
      $(doc.body).append(popupHtml);
      var $popup = $('#cameraPopup');
      this.setElement($popup[0]);
//      if (onDismiss) {
//        $popup.find('[data-cancel]').click(function() {
//          onDismiss();
//        });
//      }
        
      $popup.trigger('create');
      $popup.popup().popup("open");

      var streaming     = false;
      this.$video       = this.$('#camVideo');
      this.video        = this.$video[0];
      this.$canvas      = this.$('#canvas');
      this.canvas       = this.$canvas[0];
      this.$shootBtn    = this.$('#cameraShootBtn');
      this.$submitBtn   = this.$('#cameraSubmitBtn');
      this.width        = this.innerWidth();
      this.height       = 0;
      this.finalheight  = 0;
      
      this.setstate('playing');
      this.$shootBtn.addClass('ui-disabled');
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
      
      /* Event Handlers */
      this.video.addEventListener('canplay', function(ev) {
        if (!streaming) {
          this.finalheight = this.video.videoHeight / (this.video.videoWidth / this.width);
          this.$video.attr('width', this.width);
          this.$video.attr('height', this.finalheight);
          this.$canvas.attr('width', this.width);
          this.$canvas.attr('height', this.finalheight);
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
//          setstate('playing');
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
      
      return this;
    },
    takepicture: function() {
      this.canvas.width = this.width;
      this.canvas.height = this.finalheight;
      this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.width, this.finalheight);
//      var img = new Image();
//      img.src = 'mozfest.png';
//      console.log(img);
//      canvas.getContext('2d').drawImage(img, 0, 450-104, 640, 104);
    },

    reshoot: function() {
      this.setstate('playing');
    },

//    initiateupload: function() {
//      if (state === 'reviewing') {
//        this.setstate('uploading');
//        upload();
//      }
//    },
//
//    upload: function() {
//      debugger;
//      var head = /^data:image\/(png|jpg);base64,/,
//          fd = new FormData(),toSend,
//          xhr = new XMLHttpRequest(),
//          links = '',
//          data = '';
//
//      setstate('uploading');
//      data = ('mozGetAsFile' in canvas) ?
//             canvas.mozGetAsFile('webcam.png') :
//             canvas.toDataURL('image/png').replace(head, '');
//      fd.append('image', data);
//      fd.append('key', API_KEY);
//      xhr.open('POST', 'http://api.imgur.com/2/upload.json');
//      xhr.addEventListener('error', function(ev) {
//        console.log('Upload Error :');
//      }, false);
//      xhr.addEventListener('load', function(ev) {
//        try {
//          var links = JSON.parse(xhr.responseText).upload.links;
//          urlfield.value = links.imgur_page;
//          urllink.href = links.imgur_page;
//          setstate('uploaded');
//        } catch(e) {
//          console.log('Upload Error :' + e);
//        }
//      }, false);
//      xhr.send(fd);
//    },

    setstate: function(newstate) {
      this.state = newstate;
      var camCl = 'ui-icon-camera',
          repeatCl = 'ui-icon-repeat',
          play = this.state === 'playing',
          shootRemoveCl = play ? repeatCl : camCl,
          shootAddCl = play ? camCl : repeatCl;

      this.$video[play ? 'show' : 'hide']();
      this.$canvas[play ? 'hide' : 'show']();
      this.$shootBtn.find('.ui-btn-text').html(play ? 'Shoot' : 'Reshoot');
      this.$shootBtn.find('.' + shootRemoveCl).removeClass(shootRemoveCl).addClass(shootAddCl);
      this.$shootBtn.button();
      this.$submitBtn[play ? 'addClass' : 'removeClass']('ui-disabled');
      this.$shootBtn.removeClass('ui-disabled');
    }
  },
  {
    displayName: 'CameraPopup'
  });
});