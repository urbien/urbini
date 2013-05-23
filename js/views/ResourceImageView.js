//'use strict';
define('views/ResourceImageView', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {

//  $(function() {
//    var $allVideos = $("iframe[src^='http://player.vimeo.com'], iframe[src^='http://www.youtube.com'], object, embed"),
//        $fluidEl = $("figure");
//          
//    $allVideos.each(function() {
//      $(this)
//        // jQuery .data does not work on object/embed elements
//        .attr('data-aspectRatio', this.height / this.width)
//        .removeAttr('height')
//        .removeAttr('width');
//    });
//    
//    $(window).resize(function() {
//      var newWidth = $fluidEl.width();
//      $allVideos.each(function() {
//        var $el = $(this);
//        $el.width(newWidth)
//           .height(newWidth * $el.attr('data-aspectRatio'));
//      });
//    
//    }).resize();
//  });  

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resizeVideo'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.twin = options.twin;
      
      var res = this.resource;
      this.isVideo = res.isA('VideoResource');
      this.isAudio = res.isA('AudioResource');
      this.isImage = res.isA('ImageResource');
      this.resource.on('change', this.refresh, this);
      return this;
    },
    events: {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo'
    },
    resizeVideo: function() {
//      if (!this.isLocalVideo || !this.video)
      if (!this.video)
        return;
      
      var v = this.video,
          width = v.videoWidth || this.$video.width(),
          height = v.videoHeight || this.$video.height(),
          preventOversize = !!width;
      
      if (width && height) {
//        this._resizeVideo(width, v.videoHeight, preventOversize);
        this._resizeVideo(width, height, preventOversize);
        return;
      }
    },

//    _getMaxDimensions: function() {
//      var maxWidth = this.pageView.innerWidth() - padding;
//      var maxHeight = this.pageView.innerHeight() - padding;
//      var downscaleRatio = Math.max(width / maxWidth, height / maxHeight, preventResizeOverOneHundredPercent ? 1 : 0);      
//    },
    
    _resizeVideo: function(width, height, preventResizeOverOneHundredPercent) {
      var padding = this.padding();
      var maxWidth = Math.min(this.pageView.innerWidth() - padding, 640);
      var maxHeight = Math.min(this.pageView.innerHeight() - padding, 480);
      width = width || maxWidth;
      height = height || maxHeight;
      var downscaleRatio = Math.max(width / maxWidth, height / maxHeight, false);
      this.$video.attr('width', Math.round(width / downscaleRatio));
      this.$video.attr('height', Math.round(height / downscaleRatio));
    },
    
    refresh: function() {
      G.log(this.TAG, "info", "refresh resource");
      this.$el.empty();
      this.render();
      return this;
    },
    
    _getVideoEl: function() {
      return this.isLocalVideo ? this.$('video') : this.$('iframe');
    },
    
    renderVideo: function() {
      if (this.hash.startsWith('edit/'))
        return this;
      
      var res = this.resource,
          self = this;
      
      if (!_.has(this, '_videoUrl')) {
        this._videoUrlProp = U.getCloneOf(this.vocModel, "VideoResource.videoUrl")[0];
        this._videoUrl = res.get(this._videoUrlProp);
        this.isLocalVideo = this._videoUrl && this._videoUrl.startsWith(G.serverName);
        this.template = this.makeTemplate('videoPlayerTemplate', 'template', this.vocModel.type);
      }
      
      if (this.isLocalVideo) {
//        this.videoDfd.done(function() {
        var info = {
          src: this._videoUrl,
          preload: 'auto'
//          autoplay: 'autoplay'
        };
        
        if (this.imageProps)
          info.poster = json[this.imageProp];

        this.$el.html(this.template(info));
      }
      else {
        var videoHtml5Prop = U.getCloneOf(this.vocModel, "VideoResource.videoHtml5");
        var descProp = U.getCloneOf(this.vocModel, "VideoResource.description");
        var videoHtml5 = videoHtml5Prop && json[videoHtml5Prop];
        var desc = descProp && json[descProp];
        
        var v = videoHtml5 || desc;
        if (v) {
          var frag = document.createDocumentFragment();
//          var video = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;">' + v + '</div>';
          var video = '<div class="video-container" align="center">' + v + '</div>';
          U.addToFrag(frag, video);
          if (videoHtml5)
            delete json[videoHtml5Prop];
          else
            delete json[descProp];
          
          this.$el.html(frag);
        }
      }
      
      this.$video = this._getVideoEl();
      this.video = this.$video[0];
      if (this.video) {
        if (this.video.tagName === 'VIDEO') {
          var checkSize = function(e) {
            if (self.video.videoWidth) {
              self.resizeVideo();
              _.each(G.media_events, function(e) {
                self.$video.off(e, checkSize);
              });
            }
          };
              
          _.each(G.media_events, function(e) {
            self.$video.one(e, checkSize);
          });
        }
        else {
          // iframe
          this.video.onload = this.resizeVideo;
        }
      }
      
      return this;
    },
    
    render: function(options) {
      if (!this.isImage && !(this.isVideo || this.isAudio))
        return this;
      
      var self = this;
      var res = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;

      var props = U.getCloneOf(this.vocModel, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(this.vocModel, 'ImageResource.originalImage');
      
      this.imageProp = props[0];
      var json = res.toJSON();
      var self = this;
      if (this.isVideo) {
        return this.renderVideo();
      }
      else if (this.isAudio) {
        var audio = U.getClonedPropertyValue(res, 'AudioResource.audio');
        if (audio) {
          this.template = this.makeTemplate('audioPlayerTemplate', 'template', this.modelType);
//          return imgUri == null ? null : 'http://' + serverName + imgUri.substring(imgUri.indexOf('Image') + 5);
          this.$el.html(this.template({
            sources: [U.getExternalFileUrl(audio)]
          }));
          
          return this;
        }
        else {
          // no audio, no player, fall back to imageresource
        }
      }
      
//      var props = U.getCloneOf(meta, 'ImageResource.mediumImage')
      var oWidth;
      var oHeight;
      if (props.length) {
        oWidth = json.originalWidth;
        oHeight = json.originalHeight;
      } 
      else {
        if (U.isA(this.vocModel, 'Intersection')) 
          props = U.getCloneOf(this.vocModel, 'Intersection.aFeatured');
        if (!props.length) 
          return this;
        oWidth = json.aOriginalWidth;
        oHeight = json.aOriginalHeight;
      }
      var p = props[0];
      var propVal = json[p];
      if (typeof propVal == 'undefined') 
        return this;
      var frag = document.createDocumentFragment();
      var isHorizontal = ($(window).height() < $(window).width());
  
      if (propVal.indexOf('Image/') == 0)
        propVal = propVal.slice(6);
  //          var iTemplate = this.makeTemplate('imagePT');
  //          li += '<div><a href="#view/' + U.encode(this.resource.getUri()) + '">' + iTemplate({value: decodeURIComponent(propVal)}) + '</a>';
  
      var maxW = $(window).width(); // - 3;
//      var maxH = $(window).height() - 50;

      var metaW = meta[p]['imageWidth'];
      var metaH = meta[p]['imageHeight'];
      var metaDim = meta[p]['maxImageDimension'];

      if (maxW > metaDim) {
        if (oWidth > oHeight)
          maxW = metaDim;
        else {
          maxW = (oWidth / oHeight) * metaDim;
        }
      }
      var w;
      var h;
      if (oWidth > maxW) {
        var ratio;
//        if (metaW  &&  metaW < maxW) {
//          w = metaW;         
//          ratio = metaW / oWidth;
//        }
//        else {
          ratio = maxW / oWidth;
          w = maxW;
//        }
        oHeight = oHeight * ratio;
      }
      else if (oWidth  &&  oWidth != 0) {
        w = oWidth;
      }
      /*
      if (oHeight  &&  oHeight > maxH) {
        var ratio = maxH / oHeight;
        w = w * ratio;
      }
      */
  //    if (w > maxW - 30)  // padding: 15px
  //      w = maxW - 30;
      var iTemplate = w ? "<img src='" + decodeURIComponent(propVal) +"' width='" + w + "' />"
                        : "<img src='" + decodeURIComponent(propVal) +"' />";
      var li;
/*
      if (G.canWebcam  &&  U.isAssignableFrom(this.vocModel, U.getLongUri1('commerce/urbien/Urbien'))  &&  this.resource.get('_uri') ==  G.currentUser._uri) {
        var cOf = U.getCloneOf(this.vocModel, "FileSystem.attachments");
        iTemplate += '<a href="#cameraPopup" class="cameraCapture" target="#" data-icon="camera" data-prop="'+ cOf[0] + '"></a>';
      }
*/
      
      var padding = w ? (15 - (maxW - w) / 2) : 0;
      padding = -padding;
      
      var mg = U.getPropertiesWith(meta, "mainGroup");
      if (mg == null  ||  mg.length == 0)
        li = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;"><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.getUri()) + '">' + iTemplate + '</a></div>';
      else
        li = '<div><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.getUri()) + '">' + iTemplate + '</a></div>';
      U.addToFrag(frag, li);
      this.$el[this.isAudio ? 'append' : 'html'](frag);
      return this;
    }
  },
  {
    displayName: 'ResourceImageView'
  });
});
