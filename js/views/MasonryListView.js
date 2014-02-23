'use strict';
define('views/MasonryListView', [
  'globals',
  'utils',
  'events',
  'views/ResourceListView',
  'views/ResourceMasonryItemView',
  'views/ResourceListItemView',
  'collections/ResourceList',
  'jqueryMasonry',
  '@widgets',
  'lib/fastdom'
], function(G, U, Events, ResourceListView, ResourceMasonryItemView, ResourceListItemView, ResourceList, Mason, $m, Q) {
  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.nab';

  function getTop(child) {
    return parseInt(child.style.top, 10) || 0;
  }

  function getBottom(child) {
    return getTop(child) + child.offsetHeight;
  }

  function getBricks(views) {
    return views.map(function(view) {
      return view.el;
    });
  }
  
  return ResourceListView.extend({
    className: 'masonry',
    autoFinish: false, // we want to say we finished rendering after the masonry is done doing its magic, which may happen async
    type: 'masonry',
    _averageElementSize: 150,
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
//      _.bindAll(this, 'reloadMasonry');
      ResourceListView.prototype.initialize.apply(this, arguments);      
    },
    
    resizeMasonry: function() {
      if (this.masonry)
        this.masonry.resize();
    },
    
    preinitializeItem: function(res) {
      return ResourceMasonryItemView.preinitialize({
        vocModel: this.vocModel,
        parentView: this
      });
    },
    
    renderItem: function(res, info) {
      var liView = this.getCachedItemView(),
          options = {
            resource: res
          };
      
      if (liView) {
        console.log("RECYCLING LIST ITEM");
        liView.reset().initialize(options);
      }
      else {
        console.log("CREATING NEW LIST ITEM, TOTAL CHILD VIEWS:", _.size(this.children));
        liView = this.addChild(new this._preinitializedItem(options));
      }
      
      liView.render(this._itemRenderOptions);
      return liView;
    },
    
//    reloadMasonry: function(e) {
//      if (!this.rendered) 
//        return;
//      
//      var ww = G.viewport.width;
//      var brickW = (G.viewport.height > ww  &&  ww < 420) ? 272 : 205;
//      var w = $(this.$el.find('.nab')).attr('width');
//      if (!w) {
//        w = $(this.$el.find('.nab')).css('width');
//        if (w)
//          w = w.substring(0, w.length - 2);
//      }
//      
//      var imgP = U.getImageProperty(this.collection);
//      if (imgP) {
//        var prop = this.vocModel.properties[imgP];
//        brickW = prop.imageWidth || prop.maxImageDimension;
//      }
//      if (w < brickW  ||  w > brickW + 20) 
//        this.refresh({orientation: true});
//      else
//        this.masonry.reload();
////        this._reloadMasonry();
//      this.centerMasonry(this);
//    },

    calcElementsPerViewport: function() {
      var num;
      if (this._childEls.length) {
        this._calculatedElementsPerPage = true;
        var containersFitInWindow = this.getSlidingWindowDimension() / this.getContainerDimension(),
            numEls = this._childEls.length;

        num = Math.ceil(numEls / containersFitInWindow);
      }
      else
        num = Math.min(this.getContainerArea() / (200 * 200) | 0, 15);
      
      this._elementsPerViewport = num;
    },

    getSlidingWindowArea: function() {
      var otherDim = this._containerDimensions[this._horizontal ? 'height' : 'width'];
      return this.getSlidingWindowDimension() * otherDim; 
    },
    
    calcAverageElementSize: function() {
      if (!this._childEls.length)
        return;
      
//      this._averageElementSize = Math.sqrt(this.getSlidingWindowArea()) / Math.sqrt(this._childEls.length);
      this._averageElementSize = this.getSlidingWindowDimension() / this._childEls.length;
    },
    
    calcSlidingWindow: function() {
      var sw = this._slidingWindowRange;
      if (this.masonry) {
        var bounds = this.masonry.getBounds();
        sw.head = bounds.min;
        sw.tail = bounds.max;
      }
      else {
        sw.head = 0;
        sw.tail = this.getViewportDimension();
      }
    },    
   
    doRemove: function(childViews, fromTheHead) {
      ResourceListView.prototype.doRemove.apply(this, arguments);
      this.masonry.removedBricks(getBricks(childViews));
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
            var needsReset = this._offsets.length && (appended && appended.length == this._childEls.length  || 
                                                      prepended && prepended.length == this._childEls.length);

            if (needsReset) {
              debugger;
              this.masonry.setOffset(this._offsets[appended ? this._displayedCollectionRange.from : this._displayedCollectionRange.to]);
            }
              
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
//      this.centerMasonry();
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
    },
    
    calcElementsPerViewport: function() {
      var num;
      if (this._childEls.length) {
        this._calculatedElementsPerPage = true;
        var containersFitInWindow = this.getSlidingWindowDimension() / this.getContainerDimension(),
            numEls = this._childEls.length;

        num = Math.ceil(numEls / containersFitInWindow);
      }
      else
        num = Math.min(this.getContainerArea() / (200 * 200) | 0, 15);
      
      this._elementsPerViewport = num;
    },

    calcAverageElementSize: function() {
      if (!this._childEls.length)
        return;
      
//      this._averageElementSize = Math.sqrt(this.getSlidingWindowArea()) / Math.sqrt(this._childEls.length);
      this._averageElementSize = this.getSlidingWindowDimension() / this._childEls.length;
    },
    
    calcSlidingWindow: function() {
      var sw = this._slidingWindowRange;
      if (this.masonry) {
        var bounds = this.masonry.getBounds();
        sw.head = bounds.min;
        sw.tail = bounds.max;
      }
      else {
        sw.head = 0;
        sw.tail = this.getViewportDimension();
      }
    }
  }, {
    displayName: "MasonryListView",
    _itemView: ResourceMasonryItemView
  });
});