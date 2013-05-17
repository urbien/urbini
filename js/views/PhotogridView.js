//'use strict';
define('views/PhotogridView', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  '/../styles/jqm-grid-listview.css'
], function(G, _, U, Events, BasicView) {
  var SwipeView;
  function adjustSlide(images) {
    if (images.length === 2) {
      images[0]['float'] = 'left';
      images[1]['float'] = 'right';
    }
  };
  
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'finalize', 'goToIntersection', 'resize'); // fixes loss of context for 'this' within methods
      options = options || {};
      this.constructor.__super__.initialize.apply(this, arguments);
      this.source = options.source;
      this.makeTemplate('photogridTemplate', 'template', this.vocModel.type);
      if (this.collection) {
        this.collection.on('add', this.render, this);
        this.collection.on('sync', this.render, this);
      }
      
      this.isTrigger = this.vocModel.type === G.commonTypes.Handler;
      this.showArrows = options.arrows !== false;
      _.extend(this, _.pick(options, 'linkToIntersection', 'swipeable', 'height', 'itemsPerSlide'));
      
      var readyDfd = $.Deferred();
      if (this.swipeable) {
        var self = this;
        U.require('lib/swipeview').done(function(SV) {
          SwipeView = SV;
          readyDfd.resolve();
        }).fail(function() {
          self.swipeable = false;
          readyDfd.reject();
        });
      }
      else
        readyDfd.resolve();
      
      this.ready = readyDfd.promise();
      return this;
    },
    events: {
      'click [data-intersection]': 'goToIntersection',
      'orientationchange': 'resize',
      'resize': 'resize'
    },
    goToIntersection: function(e) {
      var intersection = e.currentTarget.dataset.intersection;
      if (intersection)
        this.router.navigate(U.makeMobileUrl('view', intersection), {trigger:true});
      else
        debugger;
    },
    render: function(options) {
      if (this.resource)
        this.renderResource.apply(this, arguments);
      else if (this.collection)
        this.renderCollection.apply(this, arguments);
      
      return this;
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
      
      if (U.isA(vocModel, 'Intersection')) {
        while (true) {
          var iProps = {a: U.getCloneOf(vocModel, 'Intersection.a')[0], b: U.getCloneOf(vocModel, 'Intersection.b')[0]};
          if (!iProps.a || !iProps.b || !json[iProps.a] || !json[iProps.b])
            break;
          
          var imgProps = {a: U.getCloneOf(vocModel, 'Intersection.aFeatured')[0], b: U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]};
          if (!imgProps.a || !imgProps.b)
            break;
          
          var resUri = res.getUri();
          _.each(['a', 'b'], function(p) {
            var target = self.linkToIntersection ? resUri : json[U.getCloneOf(vocModel, 'Intersection.{0}'.format(p))[0]];
  //          var target = json[U.getCloneOf(vocModel, 'Intersection.{0}'.format(p))[0]];
            if (!target)
              return;
            
            target = U.getLongUri1(target);
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
              
  //            imageData.caption = U.makeHeaderTitle(U.getValueDisplayName(res, 'cause'), U.getValueDisplayName(res, 'effect')) 
            }
            else {
              imageData.caption = self.getCaption(iProps[p]);
//              imageData.superscript = 'testing...';
            }
            
            if (p === 'b')
              imageData['float'] = 'right';
            else if (self.showArrows)
              imageData['arrow'] = resUri;
            
            images.push(imageData);
          });
          
          break;           
        }
      }
      
      if (!images.length) {
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
      }
      
      if (!images.length) 
        return;

      this.$el.html(this.template({items: images}));
      this.$el.removeClass('hidden');
      this.$el.trigger('create');
      return this;  
    },

    renderCollection: function() {
      var args = arguments;
      this.ready.always(function() {
        this.renderCollectionHelper.apply(this, args);
      }.bind(this));
    },

    renderCollectionHelper: function() {
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
        imgProp = {a: U.getCloneOf(vocModel, 'Intersection.aFeatured')[0], b: U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]};
      }
      else {
        var props = U.getCloneOf(vocModel, 'ImageResource.smallImage');
        if (!props.length)
          return this;
        else
          targetProp = props[0];
      }
      
      var self = this;
//      var isHorizontal = ($(window).height() < $(window).width());
      var images = [];
      var i = 0;
      var source = this.source;
      var commonTypes = G.commonTypes;
      var vocModel = vocModel;
      var isFriendApp = U.isAssignableFrom(vocModel, commonTypes.FriendApp);
      var triggerType = commonTypes.Handler;
      var uris = [];
      this.collection.each(function(resource) {
        var target, image, title, caption;
        if (isIntersection) {
          var iValues = {a: resource.get(intersection.a), b: resource.get(intersection.b)};
          var side = iValues.a === source ? 'b' : 'a';
          target = iValues[side];
          if (_.contains(uris, target)) // we don't want to display 2 friend resources representing two sides of a friendship
            return;

          target = U.getLongUri1(target);
          uris.push(target);
          image = resource.get(imgProp[side]);
          title = resource.get(intersection[side] + '.displayName');
          if (isFriendApp) {
//            caption = U.makeHeaderTitle(U.getValueDisplayName(resource, 'friend1'), U.getValueDisplayName(resource, 'friend2'));
            caption = ' ';
          }
          else
            caption = self.getCaption(resource, intersection[side]);
          if (caption == title)
            caption = ' ';
          if (!image && !title)
            return;
          
          if (self.linkToIntersection)
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
        }
        else {
          target = U.makePageUrl(resource);
          image = resource.get(imgProp);
          title = resoure.get(title);
        }
        
        if (typeof target == 'undefined') 
          return;

        var plugs = resource.get('plugs') || {count: undefined};
        superscript = isFriendApp ? plugs.count : undefined; //++i;
        image = image && image.indexOf('Image/') == 0 ? image.slice(6) : image;
        images.push({image: image, target: target, title: title, superscript: superscript, caption: caption, titleLink: '#'});
      });
      
      switch (images.length) {
        case 0:
          return this;
        case 2:
          images[1]['float'] = 'right';
          break;
      }
      
      this.images = images;
      this.renderSwipeview();
    },
    resize: function() {
      if (this.swipeable)
        this.renderSwipeview();
    },
    renderSwipeview: function(images) {
      images = images || this.images;
      if (!images)
        return this;
      
      this.$el.empty();
      if (!images.length)
        return this;
      
      var prevItemsPerSlide = this.itemsPerSlide;
      var prevNumImages = this.numImages;
      this.numImages = images.length;
      
      var width = this.innerWidth();
      var padding = 20;
      var itemWidth = 250;
      var itemsPerSlide;
      if (width < 298) {
        itemsPerSlide = 1;
        itemWidth = 140;
      }
      /* 1st breakpoint is 444px. 3 column layout with small icons. Tiles 140x140 pixels at the breakpoint. */
      else if (width < 438) {
        itemsPerSlide = 2;
        itemWidth = 140;
      }
      /* 1st breakpoint is 520px. 2 column layout with small icons. Tiles 250x250 pixels at the breakpoint. */
      else if (width < 494) {
        itemsPerSlide = 3;
        itemWidth = 140;
      }
      /* 2nd breakpoint is 298px. 2 column layout. Tiles 2500x250 pixels at the breakpoint. */
      else if (width < 768) {
        itemsPerSlide = 2;
      }
      /* 3rd breakpoint is 768px. 3 column layout. Tiles 250x250 pixels at the breakpoint. */
      else if (width < 1020) {
        itemsPerSlide = 3;
      }
      /* 4th breakpoint. 4 column layout. Tiles will be 250x250 pixels again at the breakpoint. */
      else {
        itemsPerSlide = 4;
      }

      if (!this.swipeable || itemsPerSlide >= images.length) {
        this.$el.html(this.template({items: images}));
        this.$el.removeClass('hidden');
        this.$el.trigger('create');
        return this;
      }

      this.itemsPerSlide = itemsPerSlide;      
      this.height = itemWidth;
      itemWidth -= padding; // HACK, from CSS
      itemWidth += 'px';
      for (var i = 0; i < images.length; i++) {
//        var firstOrLast = i === 0 || i === images.length - 1;
        var img = images[i];
        img.width = img.height = itemWidth;
//        if (!firstOrLast && margin)
//          img.margin = margin;
      }
      
      var slides = [];
      var i = 0, j = images.length - itemsPerSlide + 1;
      for (; i < j; i += itemsPerSlide) {
        var slide = images.slice(i, i + itemsPerSlide);
        adjustSlide(slide);
        slides.push(this.template({items: slide}));
      }
      
      var leftOver = images.length % itemsPerSlide;
      if (leftOver) {
//        var extra = _.map(images.slice(0, itemsPerSlide - leftOver).concat(images.slice(images.length - leftOver)), _.clone);
//        var extra = images.slice(0, itemsPerSlide - leftOver).concat(images.slice(images.length - leftOver));
//        var extra = images.slice(images.length - itemsPerSlide);
        var extra = images.slice(images.length - leftOver);
        adjustSlide(extra);
        slides.push(this.template({items: extra})); // to wrap around        
      }

      this.$el.removeClass('hidden');      
      // HACK? Need this otherwise SwipeView can't figure out the width and height of this element
      this.$el.css('height', (this.height || 250) + 'px');
      if (!this.el.clientWidth) {
        var args = arguments, self = this;
        setTimeout(function() {
          self.renderSwipeview.apply(self, args);
        }, 100);
        
        return;
      }      
      // END HACK
      
      var el,
        i,
        page,
        doc = document;
  
      var self = this;
      var prevSlide = 0; 
      if (this.carousel) {
        prevSlide = this.carousel.page;
        this.carousel.destroy();
      }
      
      var carousel = this.carousel = new SwipeView(this.el, {
        numberOfPages: slides.length,
        hastyPageFlip: false,
        width: 100
      });

      // Load initial data
      for (i=0; i<3; i++) {
        page = i==0 ? slides.length-1 : Math.min(slides.length, i) - 1;
        el = doc.createElement('span');
        el.innerHTML = slides[page];
        carousel.masterPages[i].appendChild(el);
      }
      
      carousel.onFlip(function (flipEvent) {
//        if (!flipEvent.unique)
//          return;
        
        var el,
        upcoming,
        i;

        for (i=0; i<3; i++) {
          upcoming = carousel.masterPages[i].dataset.upcomingPageIndex;
          
          if (upcoming != carousel.masterPages[i].dataset.pageIndex) {
            el = carousel.masterPages[i].querySelector('span');
            el.innerHTML = slides[upcoming];
            $(el).find('ul[data-role="listview"]').each(function() {
              $(this).listview();
            });
          }
        }
      });  
  
      
      if (prevSlide) {
        var numSlidesBefore = Math.ceil(prevNumImages / prevItemsPerSlide);
        prevSlide = prevSlide % numSlidesBefore;
        var leftOver = prevSlide * prevItemsPerSlide;
        var currentPage = Math.floor(leftOver / this.itemsPerSlide);
        this.carousel.goToPage(currentPage);
      }
      
      this.$el.trigger('create');
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
      this.$el.removeClass('hidden');
      this.$el.trigger('create');
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
      }
      
      return ' '; // non-empty to get the nice overlay          
    }
  },
  {
    displayName: 'PhotogridView'
  });
});
