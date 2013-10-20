define('views/HorizontalListItemView', [
  'globals',
  'underscore',
  'utils',
  'events',
  'views/BasicView',
  'lib/fastdom',
  'jqueryMasonry'
], function(G, _, U, Events, BasicView, Q) {
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
      this.showArrows = options.arrows !== false;
    },
    
    events: {
    },
    
    refresh: function() {
      this.render();
    },
    
    render: function(options) {
      var source = this.source,
          vocModel = this.vocModel,
          meta = vocModel.meta,
          resource = this.resource,
          isFriendApp = this.doesModelSubclass(G.commonTypes.FriendApp),
          isIntersection = this.doesModelImplement('Intersection'),
          cloned = this.clonedProperties,
          imgProp = this.imageProperty,
          intersection = this.intersectionProp,
          superscript,
          target, 
          image, 
          title, 
          caption,
          plugs,
          intersection,
          targetProp,
          imgProp;
      
      if (isIntersection) {        
        var iValues = {
            a: resource.get(intersection.a), 
            b: resource.get(intersection.b)
          },
          side = iValues.a === source ? 'b' : 'a';
        
        imgProp = imgProp[side];
        image = resource.get(imgProp);
        if (!image)
          return false;
        
        target = iValues[side];
//        if (_.contains(uris, target)) // we don't want to display 2 friend resources representing two sides of a friendship
//          return;

        target = U.getLongUri1(target);
//        uris.push(target);
        title = resource.get(intersection[side] + '.displayName');
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
      }
      else {
        var props = cloned['ImageResource.smallImage'];
        if (!props.length)
          return this;
        else
          targetProp = props[0];
        
        target = U.makePageUrl(resource);
        image = resource.get(imgProp);
        title = resoure.get(title);
      }
      
      if (typeof target == 'undefined') 
        return;

      plugs = resource.get('plugs') || {count: undefined};
      superscript = isFriendApp ? plugs.count : undefined;
      image = image && image.indexOf('Image/') == 0 ? image.slice(6) : image;
      return this.doRender(options, {
        imageProperty: imgProp,
        image: image, 
        target: target, 
        title: title, 
        superscript: superscript, 
        caption: caption, 
        titleLink: '#'
      });
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
        Intersection: ['a', 'b', 'aFeatured', 'bFeatured']
      },
      superclasses: [G.commonTypes.FriendApp]
    },
    preinitialize: function(options) {
      var preinitData = this.preinitData,
          vocModel = options.vocModel,
          meta = vocModel.properties,
          preinit = BasicView.preinitialize.apply(this, arguments),
          cloned = preinit.prototype.clonedProperties,
          intersection = cloned.Intersection,
          imageProperty = U.getImageProperty(vocModel),
          more = {};
          
//      if (imageProperty) {
//        more.imageProperty = imageProperty;
//        if (more.imageProperty)
//          more.maxImageDimension = meta[imageProperty].maxImageDimension;
//      }
      
      more.displayNameProps = U.getDisplayNameProps(meta);
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