define('views/mixins/LazyImageLoader', ['globals', 'underscore', 'utils', 'events', 'lib/fastdom'], function(G, _, U, Events, Q) {
  var doc = document,
      docEl = doc.documentElement,
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      LAZY_ATTR = LAZY_DATA_ATTR.slice(5),
      DUMMY_IMG = G.blankImgDataUrl,
//      WIN_HEIGHT,
      // Vertical offset in px. Used for preloading images while scrolling
      IMG_OFFSET = 200;

  Events.on('viewportResize', function(viewport) {
    IMG_OFFSET = viewport.height * 2;
  });
  
//  function getImageInfo(offset, img) {
//    var resInfoStr = img.getAttribute('data-for'),
//        resInfo = resInfoStr && U.parseImageAttribute(resInfoStr),
//        rect = img.getBoundingClientRect(),
//        viewportDestination = G._getViewportDestination(),
//        viewpoer
//        info  = {
//          src: img.src,
//          realSrc: img.getAttribute(LAZY_DATA_ATTR),
//          inBounds: U.isRectPartiallyInViewport(rect, IMG_OFFSET),
//          inDoc: docEl.contains(img),
//          data: img.file || img.blob
//        };
//        
//    if (resInfo)
//      info['for'] = resInfo;
//    
//    return info;
//  }
  
  function inBounds(rect, viewport, adjustment) {
    return rect.bottom - adjustment.Y + IMG_OFFSET >= 0 
        && rect.top - adjustment.Y - IMG_OFFSET <= viewport.height 
        && rect.right - adjustment.X + IMG_OFFSET >= 0 
        && rect.left - adjustment.X - IMG_OFFSET <= viewport.width;
  }
  
  function cleanImage(img) {
    img.onload = null;
    img.removeAttribute('onload');
    // in IE < 8 we get an onerror event instead of an onload event
    img.onerror = null;
    img.removeAttribute('onerror');
    img.removeAttribute(LAZY_DATA_ATTR);
  };
  
  // Override image element .getAttribute globally so that we give the real src
  // does not works for ie < 8: http://perfectionkills.com/whats-wrong-with-extending-the-dom/
  // Internet Explorer 7 (and below) [...] does not expose global Node, Element, HTMLElement, HTMLParagraphElement
//  window['HTMLImageElement'] && overrideGetattribute();
//  function overrideGetattribute() {
//    var original = HTMLImageElement.prototype.getAttribute;
//    HTMLImageElement.prototype.getAttribute = function(name) {
//      if (name === 'src') {
//        var realSrc = original.call(this, LAZY_DATA_ATTR);
//        return realSrc || original.call(this, name);
//      } else {
//        // our own lazyloader will go through theses lines
//        // because we use getAttribute(LAZY_DATA_ATTR)
//        return original.call(this, name);
//      }
//    }
//  }
    
  return Backbone.Mixin.extend({
    _delayedImages: [],
    _delayedImagesCounts: [],
    _lazyImages: [],
    _loadQueue: [],
    _fetchQueue: [],
    _updateQueue: [],
    events: {
//      'imageOnload': '_queueImageLoad',
      'page_show': '_start',
      'page_hide': '_stop',
      'scrollocontent': '_queueImagesJob'
    },
    
    myEvents: {
      'viewportDestination': '_queueImagesJob'
    },
    
    initialize: function() {
      _.bindAll(this, '_showImages', '_queueImageLoad', '_queueImageFetch', '_queueImageUpdate', '_showAndHideImages');
    },

    _queueImagesJob: function() {
      if (this._showHideImagesTimer)
        clearTimeout(this._showHideImagesTimer);
      
      // debounce by at least 50 ms, otherwise scrolling will cause a flurry of calculations
      this._showHideImagesTimer = setTimeout(this._showAndHideImages, 50);      
    },
    
//    _onNewViewportDestination: function(x, y, timeToDestination) {
//      if (this._viewportArrivalTimer)
//        clearTimeout(this._viewportArrivalTimer);
//      
//      // debounce by at least 50 ms, otherwise scrolling will cause a flurry of calculations
//      this._viewportArrivalTimer = setTimeout(this._showAndHideImages, 50);
//    },
    
    _showAndHideImages: function() {
      this._showImages();
      this._hideOffscreenImages();
    },
    
    _start: function() { 
      if (!this._started) {
  //      this._lazyImages = getDummyImages(this.$el);
        this._showImages();
      }
    },

    _stop: function() {
      this._started = false;
      this._hideOffscreenImages();
    },

    /**
     * override this if you want to optimize it
     */
    _getWasLazyImages: function() {
      return this.el.getElementsByClassName('wasLazyImage');
    },

    /**
     * override this if you want to optimize it
     */
    _getLazyImages: function() {
      return _.filter(this.el.getElementsByClassName('lazyImage'), function(d) {
        return d.dataset[LAZY_ATTR] != DUMMY_IMG;
      });
    },
    
    _hideOffscreenImages: function() {
//      var offscreenImgs = this.el.querySelectorAll('img:not([src="{0}"])'.format(DUMMY_IMG));
      var offscreenImgs = this._getWasLazyImages(this.el),
          viewport = G.viewport,
          adjustment = this._getViewportAdjustmentForDestination();
          
      if (this.isActive()) {
        offscreenImgs = _.filter(offscreenImgs, function(img) {
          return !inBounds(img.getBoundingClientRect(), viewport, adjustment);
        });
      }
          
      if (offscreenImgs.length)
        U.HTML.lazifyImages(offscreenImgs);
    },

    _imageJobIds: [],
    _addImageJob: function(id) {
      this._imageJobIds[this._imageJobIds.length] = id;
    },

    _removeImageJob: function(id) {
      Array.remove(this._imageJobIds, id);
    },

    _hasImageJob: function(id) {
      return !!~this._imageJobIds.indexOf(id);
    },
    
    _clearImageJobs: function() {
//      if (this._imageJobIds.length)
//        console.log("CLEARING IMAGE JOB");
      
      this._imageJobIds.length = 0;
    },

    _showImages: function() {
      this._clearImageJobs();
      this._started = true;
      this._lazyImages = this._getLazyImages();
      if (this._lazyImages.length)
        this._loadImages(this._lazyImages);
    },
    
    _queueImageLoad: function(e) {
      this._loadQueue.push(e.target);
      this._processImageLoadQueue();
    },
    
    _processImageLoadQueue: function() {
      if (this.isActive())
        this._doProcessImageLoadQueue();
    },

    _doProcessImageLoadQueue: _.debounce(function() {
      var loadQueue = U.clone(this._loadQueue);
      this._loadQueue.length = 0;
      this._loadImages(loadQueue).always(U.recycle.bind(U, loadQueue));
    }, 100),

    _queueImageFetch: function(img) {
      this._fetchQueue.push(img);
      this._processImageFetchQueue();
    },
    
    _processImageFetchQueue: _.debounce(function() {
      this._fetchImages(this._fetchQueue);
    }, 100),

    _queueImageUpdate: function(img, props) {
      this._updateQueue.push(arguments);
      this._processImageUpdateQueue();
    },
    
    _processImageUpdateQueue: _.debounce(function() {
      this._updateImages(this._updateQueue);
      this._updateQueue.length = 0;
    }, 100),

    _delayImage: function(img) {
      var idx = this._delayedImages.indexOf(img);
      if (~idx) {
        var count = this._delayedImagesCounts[idx];
        if (count > 3) {
          this._delayedImages.splice(idx, 1);
          this._delayedImagesCounts.splice(idx, 1);
        }
        else
          this._delayedImagesCounts[idx]++;
      }
      else {
        this._delayedImages.push(img)
        this._delayedImagesCounts.push(0);
        this._loadDelayedImages();
      }
    },
    
    _loadDelayedImages: _.debounce(function() {
      if (!this._delayedImages.length)
        return;
      
      var self = this,
          counts = U.clone(this._delayedImagesCounts),
          delayedImages = U.clone(this._delayedImages),
          newCounts;
      
      this._delayedImages.length = 0;
      this._loadImages(delayedImages).always(function() {
        U.recycle(delayedImages);
        newCounts = self._delayedImagesCounts;
        for (var i = counts.length - 1; i >= 0; i--) {
          if (counts[i] == newCounts[i]) {
            self._delayedImages.splice(i, 1);
            self._delayedImagesCounts.splice(i, 1); 
          }
        }
        
        if (self._delayedImages.length)
          self._loadDelayedImages();
      });
    }, 100),
    
    _getViewportAdjustmentForDestination: function() {
      var viewportDestination = this._getViewportDestination(),
          position = U.CSS.getTranslation(this.el);
      
      return {
        X: position.X - viewportDestination.X,
        Y: position.Y - viewportDestination.Y
      }
    },
    
    _getImageInfos: function(imgs) {
      var infos = [],
          viewport = G.viewport,
          adjustment = this._getViewportAdjustmentForDestination();

      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i],
            resInfoStr = img.getAttribute('data-for'),
            resInfo = resInfoStr && U.parseImageAttribute(resInfoStr),
            realSrc = img.getAttribute(LAZY_DATA_ATTR),
            rect,
            info;
        
        if (realSrc) {
          rect = img.getBoundingClientRect();
          info = {
            src: img.src,
            realSrc: realSrc,
            inDoc: docEl.contains(img),
            data: img.file || img.blob,
            inBounds: inBounds(rect, viewport, adjustment)
          }
              
          if (resInfo)
            info['for'] = resInfo;
        }
        else {
          info = {
            src: DUMMY_IMG,
            realSrc: DUMMY_IMG
          }
        }
        
        infos[infos.length] = info;
      }
      
      return infos;
    },
    
    _loadImages: function(imgs) {
      console.log("LOADING LAZY IMAGES");
      if (!imgs.length)
        return G.getRejectedPromise();
      
      imgs = imgs.slice();
      var self = this,
          dfd = $.Deferred(),
          promise = dfd.promise(),
          loadImageJobId;
      
      loadImageJobId = Q.read(function() {
        if (!self._hasImageJob(loadImageJobId))
          return;
        
        var imgInfos = this._getImageInfos(imgs),
            toFetch = [],
            toFetchInfos = [],
            delayed = [];
            
        
        for (var i = imgs.length - 1; i >= 0; i--) {
          var img = imgs[i],
              info = imgInfos[i];
          
          if (info.src != DUMMY_IMG)
            continue;
          
//          if (!this._started)
//            this._start();
          
          if (!info.realSrc)
            continue;

          if (info.realSrc == DUMMY_IMG) {
            cleanImage(img);
            continue;
          }
          
          if (info.inDoc) {
            if (info.inBounds) {
              toFetch.push(img);
              toFetchInfos.push(info);
              continue;
            }
            
//            // wait till it's scrolled into the viewport
//            if (!_.contains(this._lazyImages, img))
//              this._lazyImages.push(img);
//              
//            // check on it a couple more times in case it's arriving in the viewport and we missed the load event
//            // TODO: check current velocity and/or current scroll destination to see if this image will be needed
////              if (velocity > 0 && )
//            this._delayImage(img);
          }
        }
        
        if (toFetch.length)
          this._fetchImages(toFetch, toFetchInfos);
        
        dfd.resolve();
//        this._loadQueue.length = 0;
      }, this);
      
      this._addImageJob(loadImageJobId); 
      return promise;
    },

    _updateImages: function(imagesData) {
      for (var i = 0, num = imagesData.length; i < num; i++) {
        this._updateImage.apply(this, imagesData[i]);
      }
    },

    _updateImage: function(img, info) {
      var self = this;
      var imgJobId = Q.write(function() {        
        if (!self._hasImageJob(imgJobId))
          return;
        
  //      this.log('imageLoad', 'lazy loading image: ' + info.realSrc);
        cleanImage(img);
        img.classList.remove('lazyImage');
        img.classList.add('wasLazyImage');
        if (_.has(info, 'width'))
          img.style.width = info.width;
        if (_.has(info, 'height'))
          img.style.height = info.height;
//        if (info.onerror)
//          img.onerror = info.onerror;
        if (info.data) {
          var src = URL.createObjectURL(info.data); // blob or file
          var onload = info.onload;
          img.onload = function() {
            try {
              return onload && onload.apply(this, arguments);
            } finally {
              URL.revokeObjectURL(src);
            }
          };
          
          img.src = src;
          if (info.realSrc)
            img.setAttribute(LAZY_DATA_ATTR, info.realSrc);
        }
        else if (info.realSrc) {
          if (info.onload)
            img.onload = info.onload; // probably store img in local filesystem
          img.src = info.realSrc;
        }
        
        _.wipe(info); // just in case it gets leaked...yea, that sounds bad
      });
      
      this._addImageJob(imgJobId);
    },
    
    _fetchImages: function(imgs, infos) {
      // do all DOM reads first, then writes
      imgs = imgs.slice();
      var self = this;
      var imgJobId = Q.read(function() {
        if (!self._hasImageJob(imgJobId))
          return;
        
        infos = infos || this._getImageInfos(imgs);
        for (var i = 0, num = imgs.length; i < num; i++) {
          var img = imgs[i],
              info = infos[i];
          
          this._fetchImage(imgs[i], infos[i]);
        }
        
        this._fetchQueue.length = 0;
      }, this);
      
      this._addImageJob(imgJobId);
    },

    _fetchImage: function(img, info) {
      var imgInfo, // { cid: {String} resource cid for the resource to which this image belongs, prop: {String} property name }
          res,
          prop,
          imgUri;
      
      Array.remove(this._lazyImages, img);      
      if (info.data) {
        this._queueImageUpdate(img, info);
        return;
      }
      
      if (!(imgInfo = info['for'])) {
        img.src = info.realSrc;
        return;
      }
      
      res = this.findResourceByCid(imgInfo.id) || this.findResourceByUri(imgInfo.id);
      prop = imgInfo.prop;
      
      if (res && prop && (imgUri = res.get(prop))) {
        var dataProp = prop + '.data',
            hasData = _.has(res.attributes, dataProp),
            data = hasData && res.get(dataProp);
        
        if (data) {
          var isBlob = data instanceof Blob,
              isFile = data instanceof File;
          
          res.unset(dataProp, { silent: true }); // don't keep the file/blob in memory
          if (typeof data == 'string') {
            info.src = data;
            this._queueImageUpdate(img, info);
  //            img.src = data;
          }
          else if (isBlob || isFile) {
            img[isBlob ? 'blob' : 'file'] = info.data = data; // do keep file/blob on the image
            this._queueImageUpdate(img, info);
          }
          else if (data._filePath) {
            U.require('fileSystem').done(function(FS) {
              FS.readAsFile(data._filePath, data._contentType).done(function(file) {
                img.file = info.data = file; // do keep file/blob on the image
                this._queueImageUpdate(img, info);
              }.bind(this));
            }.bind(this));
          }
          
          return;
        }
        else if (hasData) {
          res.fetch({
            dbOnly: true,
            success: this._queueImageFetch.bind(this, img),
            error: function() {
              debugger;
            }
          });
          
          return;
        }
       
        var realSrc = info.realSrc;
        if (!realSrc)
          return;
        
        info.onload = function() {
          U.getImage(realSrc, 'blob').done(function(blob) {
            if (!blob)
              return;
                  
//            blob.type = "image/" + realSrc.slice(realSrc.lastIndexOf('.') + 1);
            
            // save to resource
            var atts = {};
            atts[prop + '.uri'] = imgUri;
            atts[dataProp] = blob;
            res.set(atts, {
              silent: true
            });
            
            Events.trigger('updatedResources', [res]); // save the image to the db
          }).always(function() {
            info = null;
          });
        };
      }
      
      this._queueImageUpdate(img, info);
    }
  }, {
    displayName: 'LazyImageLoader'
  });
});