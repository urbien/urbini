'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  return BasicView.extend({
    TAG: "ResourceImageView",
    initialize: function(options) {
      _.bindAll(this, 'render','click'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      return this;
    },
    events: {
      'click': 'click'
    },
    click: Events.defaultClickHandler,
    refresh: function() {
      G.log(this.TAG, "info", "refresh resource");
      return this;
    },
    render: function(options) {
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      if (!this.resource.isA('ImageResource')) 
        return this;
  //      var props = U.getCloneOf(meta, 'ImageResource.mediumImage')
      var props = U.getCloneOf(this.vocModel, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(this.vocModel, 'ImageResource.originalImage');
      var oWidth;
      var oHeight;
      var json = this.resource.attributes;
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
  //          var iTemplate = _.template(Templates.get('imagePT'));
  //          li += '<div><a href="#view/' + U.encode(this.resource.get('_uri')) + '">' + iTemplate({value: decodeURIComponent(propVal)}) + '</a>';
  
      var maxW = $(window).width(); // - 3;
      var maxH = $(window).height() - 50;

      var metaW = meta[p]['imageWidth'];
      var metaH = meta[p]['imageHeight'];
      var metaDim = meta[p]['maxDimension'];

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
      if (oHeight  &&  oHeight > maxH) {
        var ratio = maxH / oHeight;
        w = w * ratio;
      }
  //    if (w > maxW - 30)  // padding: 15px
  //      w = maxW - 30;
      var iTemplate = w ? "<img src='" + decodeURIComponent(propVal) +"' width='" + w + "' />"
                        : "<img src='" + decodeURIComponent(propVal) +"' />";
      var li;

      var padding = w ? (15 - (maxW - w) / 2) : 0;
      padding = -padding;
      li = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;"><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.get('_uri')) + '">' + iTemplate + '</a></div>';
      U.addToFrag(frag, li);
      this.$el.html(frag);
      return this;
    }
  });
});
