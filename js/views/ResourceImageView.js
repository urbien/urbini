//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resizeVideo'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.twin = options.twin;
      
      var res = this.resource;
      this.isVideo = res.isA('VideoResource');
  
//      this._videoProp = U.getCloneOf(this.vocModel, "VideoResource.video")[0];
//      this.isLocalVideo = !!this._videoProp && res.get(this._videoProp);
//      if (this.isLocalVideo) {
//        this.template = this.makeTemplate('videoPlayerTemplate', 'template', this.vocModel.type);
//        this.videoDfd = $.Deferred();
//        this.videoPromise = this.videoDfd.promise();
//        if (this._videoProp && res.get(this._videoProp)) {
//          this.isVideo = true;
//          U.require(['lib/jplayer', 'lib/jplayer/jplayer.blue.monday.css'], function() {
//            this.videoDfd.resolve();
//          }.bind(this));
//        }
//      }
      
      return this;
    },
    events: {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo'
    },
    resizeVideo: function() {
      if (!this.isLocalVideo || !this.video)
        return;
      
      var padding = this.padding();
      var maxWidth = this.pageView.innerWidth() - padding;
      var maxHeight = this.pageView.innerHeight() - padding;
      
      var width = this.$video.width();
      var height = this.$video.height();
      if (!height) {
        if (!width)
          return;
        
        width = maxWidth;
      }
      
      var downscaleRatio = Math.max(width / maxWidth, height / maxHeight);
      width /= downscaleRatio;
      height /= downscaleRatio;
      width && this.$video.attr('width', width);
      width && this.$video.attr('height', height);
    },
    refresh: function() {
      G.log(this.TAG, "info", "refresh resource");
      return this;
    },
    render: function(options) {
      var res = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      if (!res.isA('ImageResource')) 
        return this;
      
      var props = U.getCloneOf(this.vocModel, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(this.vocModel, 'ImageResource.originalImage');
      
      var json = res.toJSON();
      var self = this;
      if (this.isVideo && !this.video) {
        if (this.hash.startsWith('edit/'))
          return this;
        
        if (!_.has(this, '_videoUrl')) {
          this._videoUrlProp = U.getCloneOf(this.vocModel, "VideoResource.videoUrl")[0];
          this._videoUrl = res.get(this._videoUrlProp);
          this.isLocalVideo = this._videoUrl && this._videoUrl.startsWith(G.serverName);
          this.template = this.makeTemplate('videoPlayerTemplate', 'template', this.vocModel.type);
        }
        
        if (this.isLocalVideo) {
//          this.videoDfd.done(function() {
          var info = {
            src: this._videoUrl,
            preload: 'auto'
          };
          
          if (props.length)
            info.poster = json[props[0]];

//          var maxHeight = this.pageView.innerHeight() - padding;
//          width && this.$video.attr('height', height);

          this.$el.html(this.template(info));
//          info.width = this.pageView.innerWidth() - this.padding();
          this.$video = this.$('video');
          this.video = this.$video[0];
          this.video.addEventListener('loadstart', function() {
            this.resizeVideo();
          }.bind(this));
          
//            var settings = {
//              m4v: json[self._videoprop]
//            };
//            
//            if (props.length) {
//              var poster = json[props[0]];
//              if (poster)
//                settings.poster = poster; 
//            }
//              
//            self.$("#jquery_jplayer_1").jPlayer({
//              ready: function () {
//                $(this).jPlayer("setMedia", settings);
//              },
//              supplied: "m4v"
//            });
//          }.bind(this));
        }
        else {
          var videoHtml5Prop = U.getCloneOf(this.vocModel, "VideoResource.videoHtml5");
          var descProp = U.getCloneOf(this.vocModel, "VideoResource.description");
          var videoHtml5 = videoHtml5Prop && json[videoHtml5Prop];
          var desc = descProp && json[descProp];
          
          var v = videoHtml5 || desc;
          if (v) {
            var frag = document.createDocumentFragment();
            var video = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;">' + v + '</div>';
            U.addToFrag(frag, video);
            if (videoHtml5)
              delete json[videoHtml5Prop];
            else
              delete json[descProp];
            
            this.$el.html(frag);
          }
        }
        
        return;
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

      var padding = w ? (15 - (maxW - w) / 2) : 0;
      padding = -padding;
      
      var mg = U.getPropertiesWith(meta, "mainGroup");
      if (mg == null  ||  mg.length == 0)
        li = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;"><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.getUri()) + '">' + iTemplate + '</a></div>';
      else
        li = '<div><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.getUri()) + '">' + iTemplate + '</a></div>';
      U.addToFrag(frag, li);
      this.$el.html(frag);
      return this;
    }
  },
  {
    displayName: 'ResourceImageView'
  });
});
