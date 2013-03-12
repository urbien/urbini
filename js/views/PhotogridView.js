//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  '/../styles/jqm-grid-listview.css'
], function(G, $, _, U, Events, BasicView) {
  return BasicView.extend({
    TAG: "PhotogridView",
    initialize: function(options) {
      _.bindAll(this, 'render', 'finalize'); // fixes loss of context for 'this' within methods
      options = options || {};
      this.constructor.__super__.initialize.apply(this, arguments);
      this.source = options.source;
      this.template = this.makeTemplate('photogridTemplate');
      if (this.collection) {
        this.collection.on('add', this.render, this);
        this.collection.on('sync', this.render, this);
      }
      
      this.isTrigger = this.vocModel.type === G.commonTypes.Handler;
      this.linkToIntersection = options.linkToIntersection;
      return this;
    },
    render: function(options) {
      if (this.resource)
        return this.renderResource.apply(this, arguments);
      else if (this.collection)
        return this.renderCollection.apply(this, arguments);
    },
    renderResource: function(options) {
      var res = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      if (!res.isA('ImageResource') && !res.isA('Intersection')) 
        return this;
      
      var json = res.toJSON();
      if (U.isAssignableFrom(vocModel, U.getLongUri1('media/publishing/Video'))) {
        var v = json.videoHtml5 || json.description;  
        if (v) {
          var frag = document.createDocumentFragment();
          var video = '<div style="margin-top: -15px; margin-left: ' + padding + 'px;">' + v + '</div>';
          U.addToFrag(frag, video);
          if (json.videoHtml5)
            delete json['videoHtml5'];
          else
            delete json['description'];
          this.$el.html(frag);
          return this;
        }
      }
      
//      var props = U.getCloneOf(meta, 'ImageResource.mediumImage')
      var props = U.getCloneOf(vocModel, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(vocModel, 'ImageResource.originalImage');
      
      var images = [], self = this;
      if (props.length) {
        var p = props[0];
        var metaP = meta[p];
        images.push({
          image: json[p],
          title: U.getDisplayName(res),
          width: json.originalWidth,
          height: json.originalHeight,
          metaW: metaP['imageWidth'],
          metaH: metaP['imageHeight'],
          metaDim: metaP['maxImageDimension'],
          caption: this.getCaption()
        });
      } 
      else {
        if (U.isA(vocModel, 'Intersection')) {
          var iProps = {a: U.getCloneOf(vocModel, 'Intersection.a')[0], b: U.getCloneOf(vocModel, 'Intersection.b')[0]};
          if (!iProps.a || !iProps.b || !json[iProps.a] || !json[iProps.b])
            return;
          
          var imgProps = {a: U.getCloneOf(vocModel, 'Intersection.aFeatured')[0], b: U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]};
          if (!imgProps.a || !imgProps.b)
            return;
          
          var resUri = res.getUri();
          _.each(['a', 'b'], function(p) {
            var target = self.linkToIntersection ? resUri : json[U.getCloneOf(vocModel, 'Intersection.{0}'.format(p))[0]];
            if (!target)
              return;
            
            var imgProp = imgProps[p];
            var metaP = meta[imgProp];
            var image = json[imgProp];
            if (image && image.indexOf('Image/') == 0)
              image = image.slice(6);    

            var imageData = {
              image: image,
              target: U.makePageUrl('view', target),
              title: json[U.getCloneOf(vocModel, 'Intersection.{0}'.format(p))[0] + '.displayName'],
              width: json[U.getCloneOf(vocModel, 'Intersection.{0}OriginalWidth'.format(p))[0]],
              height: json[U.getCloneOf(vocModel, 'Intersection.{0}OriginalHeight'.format(p))[0]],            
              metaW: metaP['imageWidth'],
              metaH: metaP['imageHeight'],
              metaDim: metaP['maxImageDimension']
            };
            
            if (self.isTrigger) {
              if (p === 'a') {
                imageData.caption = json['cause.displayName'];
                imageData.superscript = 'Cause';
              }
              else {
                imageData.caption = json['effect.displayName'];
                imageData.superscript = 'Effect';
              }
              
              imageData.caption = U.makeHeaderTitle(U.getValueDisplayName(res, 'cause'), U.getValueDisplayName(res, 'effect')) 
            }
            else
              imageData.caption = self.getCaption(iProps[p])
            
            if (p === 'b')
              imageData['float'] = 'right';
            else
              imageData['hasArrow'] = 'true';
            images.push(imageData);
          });
          
//          if (self.isTrigger) {
//            images.splice(1, 0, {
//              image: 'images/bolt2.png',
//              target: U.makePageUrl('view', res)
////              ,
////              title: 'Trigger',
////              caption: U.makeHeaderTitle(U.getValueDisplayName(res, 'cause'), U.getValueDisplayName(res, 'effect')),
////              superscript: 'Trigger'
//            });
//          }
        }
      }
      
      if (!images.length) 
        return;

//      if (isTrigger) {
//        images.splice(1, 0, {
//          target: this.getTestTriggerUrl(),
//          title: 'Test this Trigger!',
//          icon: 'bolt'
//        });
//      }
      
//      var frag = document.createDocumentFragment();
//      var isHorizontal = ($(window).height() < $(window).width());
//      var maxW = $(window).width(); // - 3;
//      var maxH = $(window).height() - 50;      
//      var items = [], i = 0;
//      _.each(images, function(image) {
//        if (image.uri) {
//          if (image.uri.indexOf('Image/') == 0)
//            image.uri = image.uri.slice(6);    
//        }
//        
//        var w;
//        var h;
//        if (image.width > maxW) {
//          var ratio;
//          ratio = maxW / image.width;
//          w = maxW;
//          image.height = image.height * ratio;
//        }
//        else if (image.width  &&  image.width != 0) {
//          w = image.width;
//        }
//        
//        if (image.height  &&  image.height > maxH) {
//          var ratio = maxH / image.height;
//          w = w * ratio;
//        }
//
//        items.push(_.extend(image, {target: image.target || ''}));
//      });
//      
//      this.finishRender(items);
      this.finishRender(images);
      return this;  
    },
    
    renderCollection: function(options) {
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      if (!this.collection.isA('ImageResource')) 
        return this;
      
      var isIntersection = U.isA(vocModel, 'Intersection');
      var targetProp, imgProp,                      // if it's a regular resource 
          intersection; // if it's an intersection
      
      if (isIntersection) {
        intersection = {a: U.getCloneOf(vocModel, 'Intersection.a')[0], b: U.getCloneOf(vocModel, 'Intersection.b')[0]};
        imgProp = {a: U.getCloneOf(vocModel, 'Intersection.aThumb')[0], b: U.getCloneOf(vocModel, 'Intersection.bThumb')[0]};
      }
      else {
        var props = U.getCloneOf(vocModel, 'ImageResource.smallImage');
        if (!props.length)
          return this;
        else
          targetProp = props[0];
      }
      
      var self = this;
      var isHorizontal = ($(window).height() < $(window).width());
      var items = [];
      var i = 0;
      var source = this.source;
      var commonTypes = G.commonTypes;
      var vocModel = vocModel;
      var isFriendApp = U.isAssignableFrom(vocModel, commonTypes.FriendApp);
      var triggerType = commonTypes.Handler;
      this.collection.each(function(resource) {
        var target, image, title, caption;
        if (isIntersection) {
          var iValues = {a: resource.get(intersection.a), b: resource.get(intersection.b)};
          var side = iValues.a === source ? 'b' : 'a';
          target = iValues[side];
          image = resource.get(imgProp[side]);
          title = resource.get(intersection[side] + '.displayName');
          if (isFriendApp) {
            caption = U.makeHeaderTitle(U.getValueDisplayName(resource, 'friend1'), U.getValueDisplayName(resource, 'friend2'));
          }
          else
            caption = self.getCaption(resource, intersection[side]);
//          if (a === source) {
//            target = b;
//            image = resource.get(imgB);
//            title = resource.get(intersectionB + '.displayName');
//            caption = self.getCaption(resource, intersectionB);
//          }
//          else {
//            target = a;
//            image = resource.get(imgA);
//            title = resource.get(intersectionA + '.displayName');
//            caption = self.getCaption(resource, intersectionB);
//          }
            
          if (!image && !title)
            return;
          
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
          else
            target = U.makePageUrl('view', target);
        }
        else {
          target = U.makePageUrl(resource);
          image = resource.get(imgProp);
          title = resoure.get(title);
        }
        
        if (typeof target == 'undefined') 
          return;

        var plugsCount = resource.get('plugs').count;
        image = image && image.indexOf('Image/') == 0 ? image.slice(6) : image;
        items.push({image: image, target: target, title: title, superscript: ++i, caption: caption, titleLink: '#', plugsCount: plugsCount});
      });
      
      switch (items.length) {
        case 0:
          return this;
        case 1:
          items[0]['float'] = 'center';
          break;
        case 2:
          items[1]['float'] = 'right';
          break;
      }
      this.finishRender(items);
      return this;
    },

    getTestTriggerUrl: function() {
      var res = this.resource;
      var cause = res.get('causeDavClassUri');
      var effect = res.get('effectDavClassUri');
      var params = {};
      params.plugin = res.getUri();
      if (!G.currentUser.guest) {
        var vocModel = res.vocModel;
        var submittedBy = U.getCloneOf(vocModel, 'Submission.submittedBy');
        if (submittedBy.length) {
          submittedBy = submittedBy[0];
          params[submittedBy] = '_me';
        }
      }
      
      var effectList = U.makeMobileUrl('list', effect, params);
      return U.makePageUrl('make', cause, {$returnUri: effectList});
    },
    
    finishRender: function(items) {
      this.$el.html(this.template({items: items}));
      if (this.rendered) {
        this.$el.trigger('create');
        this.$el.trigger('refresh');
      }
      else {
        this.$el.trigger('create');
        this.rendered = true;
      }
      this.$el.removeClass('hidden');
      this.finalize();
      var self = this;
      Events.on('changePage', function(view) {
        if (view == self || self.isChildOf(view))
          self.finalize();
      });
    },
    
    finalize: function() {
//      var btns = this.$('.ui-btn');
//      switch (btns.length) {
//        case 1:
//          btns.css('float', 'center');
//          break;        
//        case 2:
//          $(btns[1]).css('float', 'right');
//          break;
////        case 3:
////          debugger;
////          $(btns[2]).css('float', 'right');
////          $(btns[1]).css('float', 'center');
////          break;
//      }     
    },
    
    getCaption: function(resource, prop) {
      var res = arguments.length <= 1 ? (resource && U.isModel(resource) ? resource : this.resource) : resource;
      prop = prop ? prop : res ? null : res;
      var vocModel = res.vocModel;
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
        
//        return ''; // var range = prop.range || prop.facet; return range.slice(range.lastIndexOf('/')) + 1;
      }
      
      return ' ';          
    }
  });
});
