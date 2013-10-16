'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/ResourceListItemView',
  'views/PhotogridView',
  'collections/ResourceList',
  'lib/fastdom'
], function(G, U, Events, BasicView, ResourceListItemView, PhotogridView, ResourceList, Q) {
  var $wnd = $(window),
      doc = document;

  function label(item) {
    item._label = item._label || _.uniqueId('label');
  }
  
  return BasicView.extend({
//    _listItemViews: [],
//    _pageReqNum: 0,
    _pages: [],
    _adjustmentQueued: false,
    _slidingWindowInsideBuffer: 1200, // px, should depend on size of visible area of the list, speed of device, RAM
    _slidingWindowOutsideBuffer: 800, // px, should depend on size of visible area of the list, speed of device, RAM
//    _slidingWindowBuffer: 800, // px, should depend on size of visible area of the list, speed of device, RAM
    _minSlidingWindowDimension: 3000, // px, should depend on size of visible area of the list, speed of device, RAM
    _pageOffset: 0,
    _pagesInSlidingWindow: 4,
    _pagesCurrentlyInSlidingWindow: 0,
    _elementsPerPage: 10,
    _displayedCollectionRange: {
      from: 0,
      to: 0
    },
    _horizontal: false,

    initialize: function(options) {
      _.bindAll(this, 'render', 'getNextPage', 'refresh', 'onScroll', 'adjustSlidingWindow', 'setMode', 'appendPages', 'onResourceChanged', 'getNewSize', '_viewportSizeChanged'); //, 'onScrollerSizeChanged');
      BasicView.prototype.initialize.call(this, options);
      options = options || {};
      if (options.axis)
        this._horizontal = options.axis == 'X';
      
      this.mode = options.mode || G.LISTMODES.DEFAULT;
      var type = this.modelType;
      this.makeTemplate('fileUpload', 'fileUploadTemplate', type);
      var commonTypes = G.commonTypes;
      this.isPhotogrid = this.type == 'photogrid'; //this.parentView.isPhotogrid;
      if (this.isPhotogrid)
        this.displayPerPage = 5;
  
      var vocModel = this.vocModel;
      this.mvProp = this.hashParams.$multiValue;
      this.isMultiValueChooser = !!this.mvProp;
      if (this.mvProp) {
        this.mvVals = [];
        var pr = '$' + this.mvProp;
        var s = this.hashParams[pr];
        s = s.split(',');
        for (var i = 0; i < s.length; i++)
          this.mvVals.push(s[i].trim());
      }
  
      this.isEdit = this.hashParams['$editList'];
      return this;    
    },

    events: {
      'resize': '_viewportSizeChanged',
      'orientationchange': '_viewportSizeChanged'
    },
    
    pageEvents: {
      'scrollo.resourceListView': 'onScroll'
    },
    
    _viewportSizeChanged: function() {
//      this._bounds = this.el.getBoundingClientRect();
    },
    
    onScroll: _.throttle(function(e, info) {
      if (this.isActive())
        this.adjustSlidingWindow();
    }, 20),
    
    setHorizontal: function() {
      this._horizontal = true;
    },
    
    setVertical: function() {
      this._horizontal = true;
    },
    
    getAxis: function() {
      return this._horizontal ? 'X' : 'Y';
    },

    render: function() {
      if (this.rendered)
        return this.refresh();
      
      // setup filtering
      var col = this.filteredCollection = this.collection.clone();
      this.listenTo(col, 'endOfList', function() {
        this.pageView.trigger('endOfList');
      }.bind(this));
      
      this.listenTo(col, 'reset', function() {
        this.pageView.trigger('newList');
      }.bind(this));
      
//      _.each(['updated', 'added', 'reset'], function(event) {
//        this.stopListening(col, event);
//        this.listenTo(col, event, function(resources) {
//          resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//          var options = {
//            resources: resources
//          };
//          
//          options[event] = true;
//          this.refresh(options);
//        }.bind(this));
//      }.bind(this));
//      
//      this._visibleArea = {
//        top: 0,
//        bottom: window.innerHeight,
//        left: 0,
//        right: window.innerWidth
//      };
      
      this._viewportSizeChanged();
      this.imageProperty = U.getImageProperty(this.collection);
      this.dummies = this.getDummies();
      this.setupSearchAndFilter();
      this.adjustSlidingWindow();
    },
  
    /**
     * re-render the elements in the sliding window
     */
    refresh: function() {
      // TODO: remove all the elements in the sliding window and repaint them
      debugger;
      return this.removePages(this._pagesInSlidingWindow, true)
                        .then(this.appendPages.bind(this, this._pagesInSlidingWindow))
                        .then(this.adjustSlidingWindow);
    },
    
    getDimensionDiff: function(from, to) {
      return (to.tail - to.head) - (from.tail - from.head); 
    },
    
    getHeadPosition: function($el) {
      var pos = $el.position();
      return this._horizontal ? pos.left : pos.top;
    },

//    getTailPosition: function($el) {
//      var pos = $el.position();
//      return this._horizontal ? pos.left : pos.top;
//    },

    getHeadAndTail: function(offset) {
      return this._horizontal ? {
        head: offset.left,
        tail: offset.right
      } : {
        head: offset.top,
        tail: offset.bottom
      }
    },

    dimension: function($el, value) {
      var method = this._horizontal ? 'width' : 'height';
      if (arguments.length == 2 && $el.hasClass('dummy'))
        this.log('setting dummy {0} to {1}'.format(method, value));
      
      return arguments.length == 1 ? $el[method]() : $el[method](value);
    },
    
    /**
     * @return a promise to adjust the sliding window
     */
    adjustSlidingWindow: function() {
//      this.log('SLIDING WINDOW', 'checking...');
      if (this._adjustmentQueued)
        return this._slidingWindowPromise;
      
      var promise = this._slidingWindowPromise;
      if (promise && promise.state() == 'pending') {
        this._adjustmentQueued = true;
        return promise;
      }
      
      var result = this._adjustSlidingWindow();
      if (result == false)
        return G.getResolvedPromise();
      else
        this._slidingWindowPromise = result;
      
      label(result);
      this._slidingWindowPromise.always(function() {
        if (this._adjustmentQueued) {
          this._adjustmentQueued = false;
          setTimeout(this.adjustSlidingWindow, 0);
        }
      }.bind(this));
      
      return this._slidingWindowPromise;
    },
    
    /**
     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
     */
    _adjustSlidingWindow: function() { // debounce this
//      var viewport = this.getHeadAndTail(this._visibleArea),
      if (!this.isActive())
        return G.getRejectedPromise();
      
      var viewport = this.getHeadAndTail(this.getVisibleArea(true)),
          viewportHeight = viewport.tail - viewport.head,
          slidingWindow = this.getSlidingWindow(), // should be relative to this view, i.e. head==0 means we're at the top/left of the page
          n = 1,
          diff; 
  
      if (slidingWindow.tail - slidingWindow.head < this._minSlidingWindowDimension) {
        var growAtTheHead;
//        if (this._pagesCurrentlyInSlidingWindow < this._pagesInSlidingWindow) {
        if (this._pageOffset < this._pagesInSlidingWindow / 2) {
          growAtTheHead = false;
//          n = this._pagesInSlidingWindow - this._pagesCurrentlyInSlidingWindow;
        }
        else
          growAtTheHead = viewport.head - slidingWindow.head > slidingWindow.tail - viewport.tail;
          
        return this._growSlidingWindow(n, growAtTheHead).done(this.adjustSlidingWindow);
      }
      else if ((diff = slidingWindow.tail - viewport.tail) < this._slidingWindowOutsideBuffer) {
//        diff = diff < 0 ? -diff + this._slidingWindowOutsideBuffer : diff;
//        n = Math.ceil(diff / viewportHeight);
        return this.page(n).done(this.adjustSlidingWindow); 
      }
      else if (this._pageOffset && (diff = viewport.head - slidingWindow.head) < this._slidingWindowOutsideBuffer) {
//        diff = diff < 0 ? -diff + this._slidingWindowOutsideBuffer : diff;
//        n = Math.ceil(diff / viewportHeight);
        return this.page(n, true).done(this.adjustSlidingWindow);
      }
//      else if (this._pageOffset && (diff = viewport.head - slidingWindow.head) < this._slidingWindowInsideBuffer) {
//        return this.scrollVisibility
//      }

      return false;
    },
    
    getDummies: function() {
      var dummies = this.$el.children('.dummy');
      return {
        head: dummies.filter('.head'),
        tail: dummies.filter('.tail')
      }
    },

    _toCollectionRange: function(fromPage, toPage) {
      var from = fromPage * this._elementsPerPage,
          range = {
            from: from, 
            to: Math.max(from, toPage * this._elementsPerPage)
          };
      
      if (isNaN(range.from) || isNaN(range.to))
        debugger;
      
      return range;
    },

    appendPages: function(n, force) {
      return this.addPages(n, false, force);
    },

    prependPages: function(n, force) {
      return this.addPages(n, true, force);
    },

    /** 
    * shorten the dummy div below this page by this page's height/width (if there's a dummy div to shorten)
    * @param force - will add as much as it can, including a half page
    * @return a promise
    */
    addPages: function(n, atTheHead, force) {
//      this.log('SLIDING WINDOW', 'adding pages' + (atTheHead ? ' at the head' : ''));
      n = n || 1;
      var col = this.filteredCollection,
//          sizes = this._slidingWindowAddRemoveInfo,
          colRange, $dummy, dummyDim, page, frag, info, dfd, promise, slidingWindowBefore, slidingWindowAfter, postRenderResult;

      if (atTheHead) {
        var from = Math.max(this._pageOffset - n, 0);
        if (from == this._pageOffset) {
          debugger;
          return G.getRejectedPromise();
        }
        
        colRange = this._toCollectionRange(from, this._pageOffset);
      }
      else {
        var from = this._pageOffset + this._pagesCurrentlyInSlidingWindow;
        colRange = this._toCollectionRange(from, from + n);
      }

      if (colRange.to > col.length) {
        if (force) {
          // settle for loading an incomplete page
          colRange.to = col.length;
        }
        else {
          var numToFetch = Math.max(colRange.to - col.length, this._elementsPerPage);
          return this.getNextPage(numToFetch).then(this.addPages.bind(this, n, atTheHead), this.addPages.bind(this, n, atTheHead, true));
        }
      }
      
      if (colRange.from >= colRange.to)
        return G.getRejectedPromise();
            
      dfd = $.Deferred();
      promise = dfd.promise();
      function finish() {
        Q.nonDom(dfd.resolve);
      };
      
      label(promise);
      dfd.done(function() {
        this._pagesCurrentlyInSlidingWindow += n;
        if (atTheHead)
          this._pageOffset = Math.max(this._pageOffset - n, 0);
      }.bind(this));
      
      $dummy = this.dummies[atTheHead ? 'head' : 'tail'];
      frag = doc.createDocumentFragment();
      info = {
        isFirstPage: !this._pagesCurrentlyInSlidingWindow, 
        frag: frag,
        total: colRange.to - colRange.from,
        appended: []
      };
      
      page = $('<div class="listPage" id="{0}" />'.format(G.nextId())); // style="visibility:hidden;" ?
      this._pages[atTheHead ? 'unshift' : 'push'](page);

      this.preRender(info);
      for (var i = colRange.from, to = colRange.to; i < to; i++) {
        (function(i) {
//          Q.nonDom(function renderOneListItem() {
          Q.defer(i - colRange.from, 'nonDom', function renderOneListItem() {
            var res = col.models[i],
                liView = this.renderItem(res, atTheHead),
                el = liView.el;
            
            info.appended.push(el);
            this.postRenderItem(el, info);
            this.listenTo(res, 'change', this.onResourceChanged);
          }, this);
        }.bind(this))(i);
      }

      Q.defer(colRange.to - colRange.from + 1, 'read', function getDummyDim() {
//      Q.read(function getDummyDim() {
        dfd.notify();
        dummyDim = this.dimension($dummy) || 0;
        slidingWindowBefore = this.getSlidingWindow();                
        Q.write(function insertPage() {
//          console.log("PAGER", "ADDING PAGE");
          page.append(frag);
          page[atTheHead ? 'insertAfter' : 'insertBefore']($dummy);
          postRenderResult = this.postRender(info);
          // on next frame
          Q.read(function calcNewDummyDim() {
//            slidingWindowAfter = this.getSlidingWindow();
            var newDim = dummyDim;
            if (colRange.from == 0)
              newDim = 0;
            else if (dummyDim > 0)
              newDim = Math.max(dummyDim - page.height(), 0);
            
            function cleanup() {
              if (_.isPromise(postRenderResult))
                postRenderResult.always(finish);
              else
                finish();
            };
            
            if (newDim != dummyDim) {
              Q.write(function setNewDummyDim() {
//                console.log("PAGER", "UPDATING {0} DUMMY SIZE".format(atTheHead ? "HEAD" : "TAIL"));
                this.dimension($dummy, newDim);
                cleanup();
              }, this);
            }
            else
              cleanup();
            
          }, this);
        }, this);
      }, this);

      return promise;
    },
    
    getNewSize: function() {
      this.trigger('invalidateSize');
      this.pageView.trigger('invalidateSize');
    },

//    calcAddRemoveSize: function(n, grow, growingHead) {
//      var dummies = this.dummies,
//          numChildren = this._listItemViews.length,
//          numChildrenToAbort = n * this._elementsPerPage,
//          childViews,
//          removedViews,
//          first,
//          last,
//          head,
//          tail;
//
//      if (!grow) {
//        var splitIdx = growingHead ? numChildren - numChildrenToAbort : numChildrenToAbort,
//            left = this._listItemViews.slice(0, splitIdx),
//            right = this._listItemViews.slice(splitIdx);
//            
//        removedViews = growingHead ? right : left;
//        this._listItemViews = growingHead ? left : right;
//      }
//      
//      if (removedViews && removedViews.length) {
//        first = removedViews[0].$el;
//        last = _.last(removedViews).$el;
//        head = this.getHeadPosition(first);
//        tail = this.getHeadPosition(last) + this.dimension(last);
//      }
//      else
//        head = tail = 0;
//          
//      this._slidingWindowAddRemoveInfo = {
//        head: this.dimension(dummies.head),
//        tail: this.dimension(dummies.tail),
//        removedPageSize: Math.abs(tail - head),
//        removedViews: removedViews,
//        slidingWindow: this.getSlidingWindow()
//      };
//    },
      
    /**
     * Moves sliding window down, appending "n" pages and removing "n" pages from the head
     */
    page: function(n, up) {
      n = n || 1;
//      this._pageReqNum++;
//      console.log("PAGING", up ? "UP" : "DOWN", "START");
      // append a new page, remove the first page, move visibility down a page
//      this.calcAddRemoveSize(n, false);
      var add = this[up ? 'prependPages' : 'appendPages'](n),
          remove;
      
      add.progress(function() {
        remove = this.removePages(n, !up);
      }.bind(this));
      
      return $.when(add, remove).then(function() {
//        console.log("PAGING", up ? "UP" : "DOWN", "END");
        this.getNewSize();
      }.bind(this));
    },
    
    getListItems: function() {
      return this.$el.children().not('div.dummy');
    },

    /**
     * @return offsets on all sides of the sliding window
     */
    getSlidingWindow: function() {
      var children = this.getListItems(),
          first = children[0],
          last = _.last(children);
      
      if (first) {
        first = $(first);
        last = $(last);
        return {
          head: this.getHeadPosition(first),
          tail: this.getHeadPosition(last) + this.dimension(last)
        };
      }
      else {
        var head = this.getHeadPosition(this.$el);
        return {
          head: head,
          tail: head
        }
      }
    },

    /**
     * grows the sliding window by "n" pages, from the top/left if head==true, otherwise from the bottom/right
     * @return a promise
     */
    _growSlidingWindow: function(n, head) {
//      this.log('SLIDING WINDOW', 'growing sliding window');
      n = n || 1;
//      this.calcAddRemoveSize(n, true, head);
      return $.Deferred(function(defer) {
        var promise;
        if (head)
          promise = this.prependPages(n);
        else
          promise = this.appendPages(n);
        
        promise.done(function() {
          this._pagesInSlidingWindow = Math.max(this._pagesCurrentlyInSlidingWindow, this._pagesInSlidingWindow);
          this.getNewSize();
          defer.resolve();
        }.bind(this)).fail(defer.reject);
      }.bind(this)).promise();
    },
  
//    /**
//     * Removes "pages" from the DOM and replaces the lost space by creating/padding a dummy div with the height/width of the removed section
//     * The reason we keep dummy divs on both sides of the sliding window and not just at the top is to preserve the integrity of the scroll bar, which would otherwise revert back to 0 if you scrolled back up to the top of the page
//     */
//    removePages: function(n, fromTheHead) {
////      this.log('SLIDING WINDOW', 'removing pages');
//      var first,
//          last,
//          head,
//          tail,
//          removedViews,
//          $dummy,
//          dummyDim,
//          removedPageDim,
////          ,
////      var sizes = this._slidingWindowAddRemoveInfo,
////          $dummy = fromTheHead ? this.dummies.head : this.dummies.tail,
////          removedViews = sizes.removedViews,
//          dfd = $.Deferred();
//
//      dfd.done(function() {
//        this._pagesCurrentlyInSlidingWindow -= n;
//        if (fromTheHead)
//          this._pageOffset += n;
//      }.bind(this));
//
//      $dummy = this.dummies[fromTheHead ? 'head' : 'tail'];
//      dummyDim = this.dimension($dummy);
//      
//      var cutIdx = fromTheHead ? n * this._elementsPerPage : this._listItemViews.length - n * this._elementsPerPage;
//      removedViews = fromTheHead ? this._listItemViews.slice(0, cutIdx) : this._listItemViews.slice(cutIdx);
//      this._listItemViews = fromTheHead ? this._listItemViews.slice(cutIdx) : this._listItemViews.slice(0, cutIdx);
//      
//      first = removedViews[0].$el;
//      last = _.last(removedViews).$el;
//      head = this.getHeadPosition(first);
//      tail = this.getHeadPosition(last) + this.dimension(last);
//      removedPageDim = Math.abs(tail - head);
//
////      Q.start(function() {        
//        for (var i = 0, len = removedViews.length; i < len; i++) {
//          var view = removedViews[i];
//          this.stopListening(view.resource);
//          view.destroy(); // destroy uses animationQueue
//        }
//        
//        if (!$.contains(this.el, $dummy[0]))
//          this.$el[fromTheHead ? 'prepend' : 'append']($dummy);
//        
//        if (fromTheHead)
//          this._pageOffset += n;
//          
////        this.dimension($dummy, sizes[fromTheHead ? 'head' : 'tail'] + sizes.removedPageSize);
//        this.dimension($dummy, Math.abs(tail - head));
//        dfd.resolve();
////      }, this);
//      
//      return dfd.promise();
//    },

    /**
     * Removes "pages" from the DOM and replaces the lost space by creating/padding a dummy div with the height/width of the removed section
     * The reason we keep dummy divs on both sides of the sliding window and not just at the top is to preserve the integrity of the scroll bar, which would otherwise revert back to 0 if you scrolled back up to the top of the page
     */
    removePages: function(n, fromTheHead) {
//      this.log('SLIDING WINDOW', 'removing pages');
      var first,
          last,
          head,
          tail,
          removedViews = [],
          removedPages,
          splitIdx,
          $dummy,
          dummyDim,
          removedPageDim,
//          ,
//      var sizes = this._slidingWindowAddRemoveInfo,
//          $dummy = fromTheHead ? this.dummies.head : this.dummies.tail,
//          removedViews = sizes.removedViews,
          dfd = $.Deferred();

      dfd.done(function() {
        this._pagesCurrentlyInSlidingWindow -= n;
        if (fromTheHead) {
          this.log('PAGE OFFSET: ', this._pageOffset + n);
          this._pageOffset += n;
        }
      }.bind(this));

      splitIdx = fromTheHead ? n : this._pages.length - n;
      removedPages = fromTheHead ? this._pages.slice(0, splitIdx) : this._pages.slice(splitIdx);
      this._pages = fromTheHead ? this._pages.slice(splitIdx) : this._pages.slice(0, splitIdx);      
      $dummy = this.dummies[fromTheHead ? 'head' : 'tail'];
      Q.read(function() {
        for (var i = 0, len = removedPages.length; i < len; i++) {
          var $page = removedPages[i],
              children = $page.find('[data-viewid]');
          
          for (var j = 0, numChildren = children.length; j < numChildren; j++) {
            var child = children[j],
                cid = child.dataset.viewid,
                childView;
            
            if (cid) {
              childView = this.children[cid];
              if (childView)
                removedViews.push(childView);
            }
          }
        }

        dummyDim = this.dimension($dummy) || 0;        
        removedPageDim = _.reduceRight(removedPages, function(memo, page) { 
          return memo + page.height() 
        }, 0);
      }, this);

      Q.write(function removePagesFromDOM() {        
//        console.log("PAGER", "REMOVING PAGES");
        for (var i = 0, len = removedPages.length; i < len; i++) {
          removedPages[i].remove();
        }
        
//        this.dimension($dummy, sizes[fromTheHead ? 'head' : 'tail'] + sizes.removedPageSize);
//        console.log("PAGER", "UPDATING {0} DUMMY SIZE".format(fromTheHead ? "HEAD" : "TAIL"));
        this.dimension($dummy, dummyDim + removedPageDim);
        Q.nonDom(dfd.resolve);
      }, this);

      Q.defer(5, 'nonDom', function destroyChildren() {
        for (var i = 0, len = removedViews.length; i < len; i++) {
          var view = removedViews[i];
          this.stopListening(view.resource);
          Q.defer(i + 1, 'nonDom', view.destroy, view); // destroy uses animationQueue
        }
      }, this);
      
      return dfd.promise();
    },

    onResourceChanged: function(res) { // attach/detach when sliding window moves
      var itemView = this.getViewByResource(res);
      if (itemView) {
        itemView.refresh(); // or maybe remove and reappend?
        this.adjustSlidingWindow();
        // expect an extra reflow here
      }
    },

//    getNextPage: function(numResourcesToFetch) {
//      if (this._isPaging)
//        return this._pagingPromise;
//      
////      if (Math.random() < 0.5) {
////        return $.Deferred(function() {          
////          setTimeout(getNextPage)
////        });
////      }
//      
//      var models = [],
//          mock = this.collection.models[0],
//          uriBase = mock.getUri();
//          
//      for (var i = 0; i < numResourcesToFetch; i++) {
//        models.push(new mock.vocModel(_.defaults({
//          _uri: uriBase + G.nextId()
//        }, mock.toJSON())));
//      }
//      
//      this.collection.add(models);
//      return G.getResolvedPromise();
//    },
    
    getNextPage: function(numResourcesToFetch) {
      if (this._isPaging)
        return this._pagingPromise;
      
      var col = this.filteredCollection,
          before = col.length,
          defer = $.Deferred(),
          nextPagePromise,
          nextPageUrl;
      
      nextPagePromise = col.getNextPage({
        params: {
          $limit: numResourcesToFetch
        },
        success: function() {
          if (col.length > before)
            defer.resolve();
          else {
            if (!col.isFetching(nextPageUrl)) // we've failed to fetch anything from the db, wait for the 2nd call to success/error after pinging the server
              defer.reject();
          }
        },
        error: function() {
          if (!col.isFetching(nextPageUrl))
            defer.reject();
        }
      });
      
      if (nextPagePromise)
        nextPageUrl = nextPagePromise._url;
      
      this._isPaging = true;
      this._pagingPromise = defer.promise().done(function() {
        this._isPaging = false;
      }.bind(this)); // if we fail to page, then keep isPaging true to prevent more paging
      
      this._pagingPromise._range = 'from: ' + before + ', to: ' + (before + numResourcesToFetch);
      return this._pagingPromise;
    },
   
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw "this view doesn't have a mode " + mode;
      
      this.mode = mode;
    },

    /**
     * @return view for rendered list item
     */
    renderItem: function(res, prepend) {
      // TODO: do
      var viewName = 'listItem' + G.nextId(),
          commonParams = {
            resource: res,
            parentView: this
          },
          liView;
          
      if (this.isEdit) {
        liView = new ResourceListItemView(_.extend({editCols: this.hashParams['$editCols'], edit: true}, commonParams));
      }
      else if (this.isMultiValueChooser) {
//        var params = hash ? _.getParamMap(hash) : {};
//        var mvProp = params.$multiValue;
        var isListed =  _.contains(this.mvVals, res.get('davDisplayName'));
  //      var isChecked = defaultUnchecked === isListed;
        liView = new ResourceListItemView({
          mv: true, 
          tagName: 'div', 
          className: "ui-controlgroup-controls", 
          mvProp: this.mvProp, 
          checked: isListed,
          resource: res,
          parentView: this
        });
      }
      else {
        var swatch = res.get('swatch') || (G.theme  &&  (G.theme.list  ||  G.theme.swatch));
        if (this.imageProperty != null)
          liView = new ResourceListItemView(_.extend({ imageProperty: this.imageProperty, parentView: this, swatch: swatch}, commonParams))
        else
          liView = new ResourceListItemView(_.extend({swatch: swatch}, commonParams));
      }
      
      this.addChild(liView, prepend);
      liView.render({force: true});
      return liView;
    },
    
//    addChild: function(view, prepend) {
//      BasicView.prototype.addChild.call(this, view);
//      this._listItemViews[prepend ? 'unshift' : 'push'](view);
//      view.once('destroyed', function() {
//        var idx = this._listItemViews.indexOf(view);
//        if (~idx) {
//          debugger; // should only happen if a view was destroyed other than due to sliding window management
//          this._listItemViews.splice(idx, 1);
//        }
//      }.bind(this));
//    },

    preRender: function(info) {
      // override me
    },

    /**
     * called after a batch of items are appended to the dom. Info contains the following info: {
     *   isFirstPage: {Boolean},
     *   appended: {Array} appended elements
     * }
     */
    postRender: function(info) {
      // override me
      // init/refresh listview
//      if (this.rendered) {
//        this.$el.trigger('create');
//        if (!this.isMultiValueChooser && this.$el.hasClass('ui-listview'))
//          this.$el.listview('refresh');
//        
//        this.trigger('refreshed');
//      }
    },
    
    postRenderItem: function(el, info) {
      // override me
      info.frag.appendChild(el);
    },
    
    setupSearchAndFilter: function() {
      this.$filteredUl = this.parentView.$('ul[data-filter="true"]');
      this.$filteredUl.on('listviewbeforefilter', _.debounce(this.onFilter.bind(this), 150));
    },
    
    onFilter: function(e, data) {
      var filtered = this.filteredCollection,
          collection = this.collection,
          $input = $(data.input),
          value = $input.val(),
          resourceMatches,
          numResults;
      
      if (!value) {
        filtered.reset(collection.models, {params: collection.params});
        return;
      }
      
      resourceMatches = _.filter(collection.models, function(res) {
        var dn = U.getDisplayName(res);
        return dn && dn.toLowerCase().indexOf(value.toLowerCase()) != -1;
      });

      filtered.reset(resourceMatches, {
        params: _.extend({
          '$like': 'davDisplayName,' + value
        }, collection.params)
      });
      
      numResults = filtered.size();
      if (numResults < this.displayPerPage) {
        var numOriginally = collection.size(),
            indicatorId = this.showLoadingIndicator(3000), // 3 second timeout
            hideIndicator = this.hideLoadingIndicator.bind(this, indicatorId);
        
        filtered.fetch({
          forceFetch: true,
          success: hideIndicator,
          error: hideIndicator
        });
      }            
    },
    
    hasMasonry: function() {
      return this.type == 'masonry';
    }
  }, {
    displayName: 'ResourceListView'
  });
});
