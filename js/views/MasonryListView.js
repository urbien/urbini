'use strict';
define('views/MasonryListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/ResourceMasonryItemView',
  'collections/ResourceList',
  'jqueryMasonry',
  '@widgets',
  'lib/fastdom'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceList, Mason, $m, Q) {
  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.masonry-brick';

  function getTop(child) {
    return parseInt(child.style.top, 10) || 0;
  }

  function getBottom(child) {
    return getTop(child) + child.offsetHeight;
  }

  function getBricks(pages) {
    var els = [];
    for (var i = 0; i < pages.length; i++) {
      els.push.apply(els, pages[i].childNodes);
    }
    
    return els;
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

    getPageTag: function() {
      return 'div';
    },

    preinitializeItem: function(res) {
      return ResourceMasonryItemView.preinitialize({
        vocModel: this.vocModel,
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

    _getSlidingWindowOffset: function(head) {
      if (!this._pages.length)
        return 0;

      if (head)
        return getTop(_.min(this._pages[0].childNodes, getTop));
      else
        return getBottom(_.max(this._pages[0].childNodes, getBottom));
    },
    
    getElementsPerPage: function() {
      if (this._pages.length) {
        this._optimizedElementsPerPage = true;
        var viewportDim = this.getViewport().height,
            sw = this.getSlidingWindow(),
            swDim = sw.tail - sw.head;
//            page = this._pages[0],
//            pageDim = getBottom(_.max(page.childNodes, getBottom)) - getTop(_.min(page.childNodes, getTop)),
//            numEls = page.childElementCount;
//
//        return Math.ceil(numEls * viewportDim / pageDim);
        return Math.ceil(this.masonry.bricks.length / (swDim / viewportDim));
      }
      else {
        var dimensions = this._containerDimensions;
        return Math.min(dimensions.width * dimensions.height / (200 * 200) | 0, 15);
      }
    },

    getSlidingWindow: function() {
      if (_.size(this._cachedSlidingWindow)) // we don't create a new object when we invalidate, we just wipe the properties on it
        return this._cachedSlidingWindow;
      
      if (!this.masonry) {
        return {
          head: 0,
          tail: 0
        };
      }
      
      var bounds = this.masonry.getBounds();
      return (this._cachedSlidingWindow = {
        head: bounds.min,
        tail: bounds.max
      });
    },    
   
    doRemovePages: function(pages, fromTheHead) {
      ResourceListView.prototype.doRemovePages.apply(this, arguments);
      this.masonry.removedBricks(getBricks(pages));
    },

    preRender: function() {
      return ResourceListView.prototype.preRender.apply(this, arguments);      
    },
    
    postRender: function(info) {
      if (!this.rendered) {
        this.masonry = new Mason({
          itemSelector: ITEM_SELECTOR
//          ,
//          containerStyle: {
//            position: 'relative'
//          }
        }, this.el);
 
        this.centerMasonry(this);
        this.finish();
        return;
      }
      
//      var removedFromTop = info.removedFromTop.length && info.removedFromTop.slice(),      // need this while using imagesLoaded (async)    
//          removedFromBottom = info.removedFromBottom.length && info.removedFromBottom.slice(),      // need this while using imagesLoaded (async)    
      var prepended = info.prepended.length && info.prepended.slice(),// need this while using imagesLoaded (async)
          appended = info.appended.length && info.appended.slice(),   // need this while using imagesLoaded (async)
          hasUpdated = !!_.size(info.updated),
          dfd = $.Deferred();
      
      if (hasUpdated || prepended || appended) {
        Q.read(function() { // because appended/prepended read brick offsetWidth/offsetHeight
          if (hasUpdated)
            this.masonry.reload();
          else {
            if (appended) {
              var bricks = getBricks(appended);
  //            console.log("APPENDED", appended.length, "PAGES, id:", this._slidingWindowOpInfo.id, _.pluck(appended, 'id').join(', '));
              this.masonry.appended(bricks, null, true);
            }
            if (prepended) {
              var bricks = getBricks(prepended);
              bricks.reverse();
  //            console.log("PREPENDED", prepended.length, "PAGES, id:", this._slidingWindowOpInfo.id, _.pluck(appended, 'id').join(', '));
              this.masonry.prepended(bricks, null, true);
            }
          }
          
          this.trigger('refreshed');
          dfd.resolve();
        }, this);
      }
      
      return dfd.promise();
//      this._slidingWindowOpInfo.removed = false;
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