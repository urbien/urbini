define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!utils',
  'cache!events',
  'cache!views/BasicView'
], function(G, $, _, U, Events, BasicView) {
  return BasicView.extend({
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
      console.log("refresh resource");
      return this;
    },
    render: function(options) {
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      if (!U.isA(this.vocModel, 'ImageResource')) 
        return this;
  //      var props = U.getCloneOf(meta, 'ImageResource.mediumImage')
      var props = U.getCloneOf(meta, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(meta, 'ImageResource.originalImage');
      if (!props.length) 
        return this;
      var json = this.resource.toJSON();
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

      var oWidth = json['originalWidth'];
      var oHeight = json['originalHeight'];

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
      else if (oWidth != 0) {
        w = oWidth;
      }
      if (oHeight > maxH) {
        var ratio = maxH / oHeight;
        w = w * ratio;
      }
  //    if (w > maxW - 30)  // padding: 15px
  //      w = maxW - 30;
      var iTemplate = "<img src='" + decodeURIComponent(propVal) +"' width='" + w + "'>";
      var li;

      var padding = 15 - (maxW - w) / 2;
      padding = -padding;
      li = '<div style="margin-left: ' + padding + 'px;"><a href="' + G.pageRoot + '#view/' + U.encode(this.resource.get('_uri')) + '">' + iTemplate + '</a></div>';
      U.addToFrag(frag, li);
      this.$el.html(frag);
      return this;
    }
  });
});
