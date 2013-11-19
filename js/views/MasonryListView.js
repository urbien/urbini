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
  '@widgets'
//  ,
//  'jqueryImagesLoaded'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceList, Mason, $m) {
  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.nab';

  function getTop(child) {
    return parseInt(child.style.top, 10) || 0;
  }

  function getBottom(child) {
    return getTop(child) + child.offsetHeight;
  }
  
  return ResourceListView.extend({
    className: 'masonry',
    autoFinish: false, // we want to say we finished rendering after the masonry is done doing its magic, which may happen async
    type: 'masonry',
    _elementsPerPage: 10,
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
      if (this.masonry)
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

    getHeadDummyInfo: function() {
      
      var head = getTop(_.max(el.childNodes, getTop)); // get the top offset of the child closest to the bottom the screen in the first page       
    },
    
    setDummyDimension: function(el, value) {
      // do nothing
    },
    
//    getDimension: function(el) {
//      var head = getTop(_.max(el.childNodes, getTop)); // get the top offset of the child closest to the bottom the screen in the first page 
//      var tail = getBottom(_.min(el.childNodes, getBottom)); // get the top offset of the child closest to the top of the screen in the last page
//      
//      return tail - head;
//    },
//    
//    _addPages: function(n, atTheHead, force) {
//      var self = this,
//          promise = ResourceListView.prototype._addPages.apply(this, arguments);
//          
//      if (atTheHead)
//        promise.done(this.masonry.reload.bind(this.masonry));
//      
//      return promise;
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
//      return 3;
      var dimensions = this._pageDimensions;
      return Math.min(dimensions.width * dimensions.height / (200 * 200) | 0, 15); 
    },

    getSlidingWindow: function() {
      if (!this.masonry) {
        return {
          head: 0,
          tail: 0
        };
      }
      
//      var slidingWindow = {},
//          lastPage = this.el.lastChild,
//          firstPage = this.el.firstChild;
//      
//      if (!firstPage || !firstPage.childElementCount)
//        slidingWindow.head = slidingWindow.tail = 0;
//      else {
//        slidingWindow.head = getTop(_.max(firstPage.childNodes, getTop)); // get the top offset of the child closest to the bottom the screen in the first page 
//        slidingWindow.tail = getBottom(_.min(lastPage.childNodes, getBottom)); // get the top offset of the child closest to the top of the screen in the last page
//      }
//      
//      return slidingWindow;
      var bounds = this.masonry.getBounds();
      return {
        head: bounds.min,
        tail: bounds.max
      };
    },    
   
    isDummyPadded: function() {
      return false;
    },

    doRemovePages: function(pages, fromTheHead) {
      this.masonry.remove(pages);
    },

    preRender: function() {
      return ResourceListView.prototype.preRender.apply(this, arguments);      
    },
    
    postRender: function(info) {
      var self = this;
      if (!this.rendered) {
//        this.$el.imagesLoaded(function() {
          self.masonry = new Mason({
            itemSelector: ITEM_SELECTOR
          }, self.el);
   
          self.centerMasonry(self);
          self.finish();
//        });

//        setTimeout(this._loadingDfd.resolve, 300);
//        return this._loadPromise;
          return;
      }
      
//      var removedFromTop = info.removedFromTop.length && info.removedFromTop.slice(),      // need this while using imagesLoaded (async)    
//          removedFromBottom = info.removedFromBottom.length && info.removedFromBottom.slice(),      // need this while using imagesLoaded (async)    
      var prepended = info.prepended.length && info.prepended.slice(),// need this while using imagesLoaded (async)
          appended = info.appended.length && info.appended.slice(),   // need this while using imagesLoaded (async)
          hasUpdated = !!_.size(info.updated);
      
      if (hasUpdated || prepended || appended) {
//        var dfd = $.Deferred();
//        this.$el.imagesLoaded(function() {
          if (hasUpdated)
            self.masonry.reload();
          else {
            if (appended) 
              self.masonry.appended(appended);
            if (prepended) {
              var bricks = [],
                  i = prepended.length;
              
              while (i--) {
                bricks.push.apply(bricks, prepended[i].childNodes);
              }
              
              bricks.reverse();
              self.masonry.prepended(bricks, null, true);
            }
          }
          
          self.trigger('refreshed');
//          dfd.resolve();
//        });
        
//        return dfd.promise();
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
//      var l = _.filter(list.$el.find('.nab'), function(a) {
//          return $(a).css('top') == '0px';
//        }),
//        len = l.length;
//      
//      if (len) {
//        var w = $(l[0]).css('width');
//        w = w.substring(0, w.length - 2);
//        len = l.length * w;
////        len += l.length * 18;
//        var d = (($(window).width() - len) / 2) - 10;
//        var style = list.$el.attr('style'); 
//        var left = list.$el.css('left');
//        if (left)
//          list.$el.css('left', d + 'px');
//        else
//          list.$el.attr('style', style + 'left: ' + d + 'px;');
//      }
    }
  }, {
    displayName: "MasonryListView",
    _itemView: ResourceMasonryItemView
  });
});