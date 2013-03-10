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
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      options = options || {};
      this.constructor.__super__.initialize.apply(this, arguments);
      this.source = options.source;
      this.template = this.makeTemplate('photogridTemplate');
      if (this.collection) {
        this.collection.on('add', this.render, this);
        this.collection.on('sync', this.render, this);
      }
      
      this.isTrigger = this.vocModel.type === G.commonTypes.Handler;
      return this;
    },
    render: function(options) {
      if (this.resource)
        this.renderResource.apply(this, arguments);
      else if (this.collection)
        this.renderCollection.apply(this, arguments);
    },
    renderResource: function(options) {
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return this;
      
      if (!this.resource.isA('ImageResource') && !this.resource.isA('Intersection')) 
        return this;
      
      var json = this.resource.attributes;
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
          return;
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
          uri: json[p],
          title: U.getDisplayName(this.resource),
          width: json.originalWidth,
          height: json.originalHeight,
          metaW: metaP['imageWidth'],
          metaH: metaP['imageHeight'],
          metaDim: metaP['maxImageDimension']
        });
      } 
      else {
        if (U.isA(vocModel, 'Intersection')) { 
          var propsA = U.getCloneOf(vocModel, 'Intersection.aFeatured');
          var propsB = U.getCloneOf(vocModel, 'Intersection.bFeatured');
          if (!propsA.length || !propsB.length)
            return;
          
          var props = {a: propsA[0], b: propsB[0]};
          _.each(['a', 'b'], function(p) {
            var prop = props[p];
            var metaP = meta[prop];
            var imageData = {
              uri: json[prop],
              title: json[U.getCloneOf(vocModel, 'Intersection.{0}'.format(p))[0] + '.displayName'],
              width: json[U.getCloneOf(vocModel, 'Intersection.{0}OriginalWidth'.format(p))[0]],
              height: json[U.getCloneOf(vocModel, 'Intersection.{0}OriginalHeight'.format(p))[0]],            
              metaW: metaP['imageWidth'],
              metaH: metaP['imageHeight'],
              metaDim: metaP['maxImageDimension']
            };
            
            if (self.isTrigger) {
              if (p === 'a') {
                imageData.note = 'Model: ' + json['cause.displayName'];
                imageData.superscript = 'Trigger';
              }
              else {
                imageData.note = 'Model: '+ json['effect.displayName'];
                imageData.superscript = 'Result';
              }
            }
            
            images.push(imageData);
          });          
        }
      }
      
      if (!images.length) 
        return this;

//      if (isTrigger) {
//        images.splice(1, 0, {
//          target: this.getTestTriggerUrl(),
//          title: 'Test this Trigger!',
//          icon: 'bolt'
//        });
//      }
      
      var frag = document.createDocumentFragment();
      var isHorizontal = ($(window).height() < $(window).width());
      var maxW = $(window).width(); // - 3;
      var maxH = $(window).height() - 50;

      var items = [], i = 0;
      _.each(images, function(image) {
        if (image.uri) {
          if (image.uri.indexOf('Image/') == 0)
            image.uri = image.uri.slice(6);    
        }
        
        var w;
        var h;
        if (image.width > maxW) {
          var ratio;
          ratio = maxW / image.width;
          w = maxW;
          image.height = image.height * ratio;
        }
        else if (image.width  &&  image.width != 0) {
          w = image.width;
        }
        
        if (image.height  &&  image.height > maxH) {
          var ratio = maxH / image.height;
          w = w * ratio;
        }

        var note = image.note || 'description placeholder';  
        items.push({image: image.uri, icon: image.icon, target: image.target || '', title: image.title, superscript: image.superscript, note: note});
      });
      
      this.finishRender(items);
      return this;  
    },
    
    renderCollection: function(options) {
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      if (!meta)
        return;
      
      if (!this.collection.isA('ImageResource')) 
        return;
      
      var isIntersection = U.isA(vocModel, 'Intersection');
      var targetProp, imgProp,                      // if it's a regular resource 
          intersectionA, intersectionB, imgA, imgB; // if it's an intersection
      
      if (isIntersection) {
        intersectionA = U.getCloneOf(vocModel, 'Intersection.a')[0];
        intersectionB = U.getCloneOf(vocModel, 'Intersection.b')[0];
        imgA = U.getCloneOf(vocModel, 'Intersection.aThumb')[0];
        imgB = U.getCloneOf(vocModel, 'Intersection.bThumb')[0];
      }
      else {
        var props = U.getCloneOf(vocModel, 'ImageResource.smallImage');
        if (!props.length)
          return;
        else
          targetProp = props[0];
      }
      
      var isHorizontal = ($(window).height() < $(window).width());
      var items = [];
      var i = 0;
      var source = this.source;
      var commonTypes = G.commonTypes;
      var vocModel = vocModel;
      var isFriendApp = U.isAssignableFrom(vocModel, commonTypes.FriendApp);
      var triggerType = commonTypes.Handler;
      this.collection.each(function(resource) {
        var target, image, title;
        if (isIntersection) {
          var a = resource.get(intersectionA), 
              b = resource.get(intersectionB);
          if (a === source) {
            target = b;
            image = resource.get(imgB);
            title = resource.get(intersectionB + '.displayName');
          }
          else {
            target = a;
            image = resource.get(imgA);
            title = resource.get(intersectionA + '.displayName');
          }
            
          if (!image && !title)
            return;
          
          if (isFriendApp) {
            var and1 = $.param({
              fromApp: a,
              toApp: b
            });

            var and2 = $.param({
              fromApp: b,
              toApp: a
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
        
        if (target.indexOf('Image/') == 0)
          target = propVal.slice(6);

        items.push({image: image, target: target, title: title, superscript: ++i, note: 'description placeholder'});
      });
      
      if (items.length == 0)
        return;
      
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
      this.$el.trigger('create');
      this.$el.removeClass('hidden');      
      var btns = this.$('.ui-btn');
      switch (items.length) {
        case 1:
          btns.css('float', 'middle');
          break;        
        case 2:
          $(btns[1]).css('float', 'right');
          break;
        case 3:
          debugger;
          $(btns[2]).css('float', 'right');
          $(btns[1]).css('float', 'center');
          break;
      }
    }
  });
});
