define('views/HorizontalListItemView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'lib/fastdom',
  'vocManager',
  'jqueryMasonry'
], function(G, _, U, Events, BasicView, fd, Voc, Q) {
  function getCaption(res, prop) {
    var vocModel = res.vocModel;
    prop = prop ? prop : res ? null : res;
    if (prop) {
      var val = U.getValueDisplayName(res, prop);
      if (val)
        return val;
    }
    else {
      if (res.isA("Submission")) {
        var descProp = U.getCloneOf(res.vocModel, 'Submission.description');
        for (var i = 0; i < descProp.length; i++) {
          var val = U.trim(res.get(descProp[i]), 30);
          if (val)
            return val;
        }
        
        var byProp = U.getCloneOf(res.vocModel, 'Submission.submittedBy')[0];
        var val = U.getValueDisplayName(res, byProp);
        if (val)
          return val;
      }
    }
    
    return ' '; // non-empty to get the nice overlay          
  }
  
  var SIV = BasicView.extend({
    tagName: 'div',
    template: 'horizontalListItem',
    className: 'thumb-gal-item',
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      this.resource.on('change', this.refresh, this);      
      this.isTrigger = this.vocModel.type === G.commonTypes.Handler;
//      this.bothSides = options.bothSides;
      this.showArrows = options.arrows !== false;
    },
    
    events: {
    },
    
    refresh: function() {
      this.render();
    },
    
//    renderIntersectionSides: function(options) {
//      var json = this.resource.attributes,
//          cloned = this.clonedProperties,
//          intersection = cloned.Intersection,          
//          iProps = {
//            a: resource.get(intersection.a), 
//            b: resource.get(intersection.b)
//          };
//      
//      if (!iProps.a || !iProps.b || !json[iProps.a] || !json[iProps.b])
//        return false;
//      
//      var imgProps = {a: U.getCloneOf(vocModel, 'Intersection.aFeatured')[0], b: U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]};
//      if (!imgProps.a || !imgProps.b)
//        return false;
//      
//      var resUri = res.getUri();
//      var data1 = this._getXSideData(options, 'a');
//      var data2 = this._getXSideData(options, 'b');
//      
//      var html = this.template(data1) + this.template(data2);
//      if (options.renderToHtml)
//        this._html = html;
//      else
//        this.$el.html(html)
//        
//      return this;           
//    },
//    
//    _getXSideData: function(options, side) {
//      var json = this.resources.attributes,
//          vocModel = this.vocModel,
//          meta = vocModel.properties,
//          iProps = this.clonedProperties.Intersection,
//          sidePropName = iProps[side],
////          sideProp = meta[sidePropName],
//          target = this.linkToIntersection ? resUri : json[sidePropName];
//
//      if (!target)
//        return;
//      
//      target = U.getLongUri1(target);
//      var imgProp = iProps[side + 'Featured'];
//      var metaP = meta[imgProp];
//      var image = json[imgProp];
//      if (image && image.indexOf('Image/') == 0)
//        image = image.slice(6);    
//
//      var imageData = {
//        imageProperty: imgProp,
//        image: image,
//        _uri: json[iProps[p]],
//        target: U.makePageUrl('view', target),
//        title: json[sidePropName + '.displayName'],
//        width: json[side + 'OriginalWidth'],
//        height: json[side + 'OriginalHeight'],            
//        metaW: metaP['imageWidth'],
//        metaH: metaP['imageHeight'],
//        metaDim: metaP['maxImageDimension']
//      };
//      
//      if (vocModel.type == G.commonTypes.Handler) {
//        if (side === 'a') {
//          imageData.caption = json['cause.displayName'];
//          imageData.superscript = 'Cause';
//        }
//        else {
//          imageData.caption = json['effect.displayName'];
//          imageData.superscript = 'Effect';
//        }
//      }
//      else {
//        imageData.caption = this.getCaption(iProps[side]);
//      }
//      
////      if (side === 'b')
////        imageData['float'] = 'right';
////      else if (this.showArrows)
////        imageData['arrow'] = resUri;
//      
//      return imageData;
//    },
    
    render: function(options) {
//      if (options.bothSides)
//        return renderIntersectionSides(options);
      
      var source = options.source || this.source,
          cloneOf = options.cloneOf,
          vocModel = this.vocModel,
          meta = vocModel.meta,
          resource = this.resource,
          isFriendApp = this.doesModelSubclass(G.commonTypes.FriendApp),
          isIntersection = this.doesModelImplement('Intersection'),
          cloned = this.clonedProperties,
          clonedI = cloned.Intersection || {},
          clonedIR = cloned.ImageResource || {},
          imgProp = this.imageProperty,
//          intersectionSide = options.intersection,
          intersection = this.intersectionProp,
          superscript,
          target, 
          image,
          width,
          height,
          top, right, bottom, left, 
          title, 
          caption,
          plugs,
          intersection,
          targetProp,
          rect,
          oW, 
          oH,
          maxDim,
          imgProp;
          
      if (isIntersection) {
        var a = aa = intersection.a;
        if(Object.prototype.toString.call(aa) === '[object Array]') {
          for (var i=0; i<aa.length  &&  a == aa; i++)
            if (resource.get(aa[i]))
              a = aa[i];
        }
          
        var b = bb = intersection.b;
        if(Object.prototype.toString.call(bb) === '[object Array]') {
          for (var i=0; i<bb.length  &&  b == bb; i++)
            if (resource.get(bb[i]))
              b = b[i];
        }
        
        var iValues = {
            a: resource.get(a), 
            b: resource.get(b)
          },
          side = cloneOf ? cloneOf.substring(cloneOf.length - 1) : (iValues.a === source ? 'b' : 'a');

        var iProp = side == 'a' ? a : b; 
        imgProp = imgProp[side];
        image = resource.get(imgProp);
        if (!image)
          return false;
        
        target = iValues[side];
//        if (_.contains(uris, target)) // we don't want to display 2 friend resources representing two sides of a friendship
//          return;

        target = U.getLongUri1(target);
//        uris.push(target);
        title = resource.get(iProp + '.displayName');
        if (isFriendApp)
          caption = ' ';
        else
          caption = getCaption(resource, intersection[side]);
        
        if (caption == title)
          caption = ' ';
        
        if (!image && !title)
          return;
        
        if (this.linkToIntersection)
          target = U.makePageUrl('view', resource);
        else {
          if (isFriendApp) {
            var and1 = $.param({
              fromApp: iValues.a,
              toApp: iValues.b
            });

            var and2 = $.param({
              fromApp: iValues.b,
              toApp: iValues.a
            });

            target = U.makePageUrl('list', triggerType, {
              $or: U.makeOrGroup($.param({$and: and1}), $.param({$and: and2}))
            });
          }
          else {
            target = U.makePageUrl('view', target);
          }
        }
        if (typeof target == 'undefined') 
          return;
        oW = clonedI[side + 'OriginalWidth'];
        oH = clonedI[side + 'OriginalHeight'];

        var range = this.vocModel.properties[iProp].range;
        var m = U.getModel(U.getLongUri1(range));
        var meta = m.properties;
        
        var iProp = this.vocModel.properties[this.imageProperty[side]];
        var imgP = iProp  &&  iProp.cloneOf  &&  iProp.cloneOf.indexOf('Featured') == -1 ? meta[U.getCloneOf(m, 'ImageResource.smallImage')] : meta[U.getCloneOf(m, 'ImageResource.mediumImage')]; 
        
        if (isIntersection) 
          maxDim = imgP && imgP.maxImageDimension;
      }
      else {
        var props = clonedIR.smallImage;
        if (!props.length)
          return this;
        else
          targetProp = props[0];
        
        target = U.makePageUrl(resource);
        image = resource.get(imgProp);
        title = resoure.get(title);
        oW = clonedIR.originalWidth;
        oH = clonedIR.originalHeight;
        maxDim = this.imageProperty['maxImageDimention'] || this.imageProperty['imageWidth']; 
      }
      
      if (typeof target == 'undefined') 
        return false;

      plugs = resource.get('plugs') || {count: undefined};
      superscript = isFriendApp ? plugs.count : undefined;
      image = image && image.indexOf('Image/') == 0 ? image.slice(6) : image;

      var props =  {
          imageProperty: imgProp,
          image: image, 
          target: target, 
          title: title, 
          superscript: superscript, 
          caption: caption, 
          titleLink: '#'
      };
      
      
      
      maxDim = maxDim || 200;
      if (oH  &&  oW) {
        rect = this.clipRect(resource, image, oW, oH, maxDim);
              _.extend(props, {top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right});
      }
      return this.doRender(options, props);
    },

    clipRect: function(m, image, oW, oH, maxDim) {
      var w, h;
      var rect = {};
      if (!oH  &&  !oW) {
        var idx = image.lastIndexOf(".");
        var dashIdx = image.indexOf('-', idx);
        if (dashIdx) {
          var u1 = image.indexOf('_', idx);
          var u2 = image.indexOf('_', dashIdx);
          if (u1 != -1  &&  u2  != -1) {
            w = image.substring(u1 + 1, dashIdx);
            h = image.substring(dashIdx + 1, u2);
            var isNumber = !isNaN(parseFloat(w)) && isFinite(w)  && !isNaN(parseFloat(h)) && isFinite(h);
            if (!isNumber)
              w = 0; h = 0;
          }
        }
      }
      
      if (oW  &&  oH) {
        var w = m.get(oW), 
            h = m.get(oH);
        if (w  &&  h) {
          var clip = U.clipToFrame(140, 140, w, h, maxDim);
          if (clip) {
            rect.top = clip.clip_top;
            rect.right = clip.clip_right;
            rect.bottom = clip.clip_bottom;
            rect.left = clip.clip_left;
          }
          else {
            var dim = U.fitToFrame(80, 80, m.get(oW) / m.get(oH));
            rect.width = dim.w;
            rect.height = dim.h;
            rect.top = oW > oH ? dim.y : dim.y + (m.get(oH) - m.get(oW)) / 2;
            rect.right = dim.w - dim.x;
            rect.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (m.get(oH) - m.get(oW)) / 2;
            rect.left = dim.x;
          }
        }
      }
      else if (w  &&  h) {
        var clip = U.clipToFrame(dim, dim, w, h, dim);
        if (clip) {
          rect.top = clip.clip_top;
          rect.right = clip.clip_right;
          rect.bottom = clip.clip_bottom;
          rect.left = clip.clip_left;
        }
      }
      return rect;
    },
    
    doRender: function(options, tmpl_data) {
      var html = this.template(tmpl_data);
      if (options && options.renderToHtml)
        this._html = '<{0} class="{1}"><div class="thumb-inner">{2}</div></{0}>'.format(this.tagName, this.className, html);
      else
        this.$el.template(html);
    }    
  }, {
    displayName: 'HorizontalListItemView',
    preinitData: {
      interfaceProperties: {
        ImageResource: ['smallImage'],
        Intersection: ['a', 'b', 'aFeatured', 'bFeatured', 'aOriginalWidth', 'aOriginalHeight', 'bOriginalWidth', 'bOriginalHeight']
      },
      superclasses: [G.commonTypes.FriendApp]
    },
    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          preinit = BasicView.preinitialize.apply(this, arguments),
          cloned = preinit.prototype.clonedProperties,
          intersection = cloned.Intersection,
          imageProperty = U.getImageProperty(vocModel),
          more = {};
          
      more.displayNameProps = U.getDisplayNameProps(vocModel);
      if (intersection) {
        more.intersectionProp = {
          a: intersection.a, 
          b: intersection.b
        };
          
        more.imageProperty = {
          a: intersection.aFeatured, 
          b: intersection.bFeatured
        };
      }
      else
        this.imageProperty = imageProperty;

      return preinit.extend(more);
    }
  });

  return SIV;
});