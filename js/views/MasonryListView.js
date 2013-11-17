'use strict';
define('views/MasonryListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/ResourceMasonryItemView',
  'collections/ResourceList',
//  'views/mixins/Masonry',
  'jqueryMasonry',
  '@widgets',
  'jqueryImagesLoaded'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceList, Masonry, $m) {
  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.nab';

  return ResourceListView.extend({
//    mixins: [Masonry],
    className: 'masonry',
    autoFinish: false, // we want to say we finished rendering after the masonry is done doing its magic, which may happen async
    type: 'masonry',
    _elementsPerPage: Math.round(window.innerWidth / 100 * window.innerHeight / 100) + 3,
    events: {
      'refresh': 'refresh'
//        ,
//      'page_show': 'reloadMasonry'
    },
    
    windowEvents: {
      'resize': 'resizeMasonry',
      'orientationchange': 'resizeMasonry'
    },
    
    initialize: function(options) {
      var self = this;
      _.bindAll(this, 'reloadMasonry');
      ResourceListView.prototype.initialize.apply(this, arguments);      
//      this.listenTo(Events, 'pageChange', function(prev, current) {
//        if (self.pageView == current && self.rendered) {
////          self.$el.imagesLoaded(function() {
//            self.masonry('reload');
////          });
//        }
//      });
    },
    
    resizeMasonry: function() {
      this.masonry.resize();
    },
    
    _updateConstraints: function() {
      ResourceListView.prototype._updateConstraints.call(this);
      if (this._viewportDim) {
        if (G.browser.mobile && this._viewportDim < 500)
          this._elementsPerPage = 4;
        else
          this._elementsPerPage = 20;
      }
    },    

    masonry: function() {
//      this.$el[MASONRY_FN].apply(this.$el, arguments);
      this.masonry[MASONRY_FN].apply(this.masonry, arguments);
      this.trigger('invalidateSize');
      this.pageView.trigger('invalidateSize');
    },
    
//    getListItems: function() {
//      return this.$(ITEM_SELECTOR);
//      return this.$el.children();
//    },

    getPageTag: function() {
      return 'div';
    },

    preinitializeItem: function(res) {
      return ResourceMasonryItemView.preinitialize({
        vocModel: this.vocModel,
        className: 'nab nabBoard',
        parentView: this
      });
    },
    
    renderItem: function(res, info) {
      var liView = this.addChild(new this._preinitializedItem({
        resource: res
      }));
      
      liView.render(this._itemRenderOptions);
      return liView;
    },
    
    reloadMasonry: function(e) {
      if (!this.rendered) 
        return;
      
      var ww = G.viewport.width;
      var brickW = (G.viewport.height > ww  &&  ww < 420) ? 272 : 205;
      var w = $(this.$el.find('.nab')).attr('width');
      if (!w) {
        w = $(this.$el.find('.nab')).css('width');
        if (w)
          w = w.substring(0, w.length - 2);
      }

      var imgP = U.getImageProperty(this.collection);
      if (imgP) {
        var prop = this.vocModel.properties[imgP];
        brickW = prop.imageWidth || prop.maxImageDimension;
      }
      if (w < brickW  ||  w > brickW + 20) 
        this.refresh({orientation: true});
      else
        this.masonry.reload();
//        this._reloadMasonry();
      this.centerMasonry(this);
    },

    getElementsPerPage: function() {
      var dimensions = this._pageDimensions;
      return dimensions.width * dimensions.height / (150 * 150) | 0; 
    },

    getSlidingWindow: function() {
      var head = this.dummies.headPosition,
          headDim = this.dummies.headDimension,
          slidingWindow = {
            head: head + headDim
          };
      
      if (typeof head !== 'number')
        head = this.dummies.headPosition = this.getHeadPosition(this.dummies.head);
      
      var lastPage = this.dummies.tail.previousSibling;
      if (lastPage == this.dummies.head)
        slidingWindow.tail = slidingWindow.head;
      else {
        slidingWindow.tail = _.max(lastPage.childNodes, function(child) {
          return (parseInt(child.style.top, 10) || 0) + child.offsetHeight;
        });
      }
      
      return slidingWindow;      
    },
    
    preRender: function() {
      return ResourceListView.prototype.preRender.apply(this, arguments);      
    },
    
    postRender: function(info) {
      var self = this,
          appended = info.added.slice(),
          numAppended = appended.length,
          updated = info.updated.slice(),
          numUpdated = _.size(updated);
      
      if (this.rendered) {
        if (numAppended || numUpdated) {
          this.$el.imagesLoaded(function() {
            if (numAppended) 
              self.masonry.appended(appended);
            if (numUpdated)
              self.masonry.reload();
            
            self.trigger('refreshed');
          });
        }
      }
      else {
        this.$el.imagesLoaded(function() {
          self.masonry = new Masonry({
            itemSelector: ITEM_SELECTOR
          }, self.el);
   
          self.centerMasonry(self);
          self.finish();
        });
      }
    },

    refresh: function() {
//      var refreshResult = ResourceListView.prototype.refresh.apply(this, arguments);
//      if (_.isPromise(refreshResult))
//        return refreshResult.then(this.reloadMasonry);
//      else {
//        this.reloadMasonry();
//        return refreshResult;
//      }
      this.masonry.reload();
      this.centerMasonry();
    },
    
    centerMasonry: function(list) {
      var l = _.filter(list.$el.find('.nab'), function(a) {
          return $(a).css('top') == '0px';
        }),
        len = l.length;
      
      if (len) {
        var w = $(l[0]).css('width');
        w = w.substring(0, w.length - 2);
        len = l.length * w;
//        len += l.length * 18;
        var d = (($(window).width() - len) / 2) - 10;
        var style = list.$el.attr('style'); 
        var left = list.$el.css('left');
        if (left)
          list.$el.css('left', d + 'px');
        else
          list.$el.attr('style', style + 'left: ' + d + 'px;');
      }
    }
  }, {
    displayName: "MasonryListView",
    _itemView: ResourceMasonryItemView
  });
});