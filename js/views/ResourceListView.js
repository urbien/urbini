'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'domUtils',
  'events',
  'views/BasicView',
  'views/ResourceListItemView',
  'collections/ResourceList',
  'lib/fastdom',
  'vocManager'
], function(G, U, DOM, Events, BasicView, ResourceListItemView, ResourceList, Q, Voc) {
  var $wnd = $(window),
      doc = document;

  function label(item) {
    item._label = item._label || _.uniqueId('label');
  }

  function getDimensionName() {
    return this._horizontal ? 'width' : 'height';
  }

  function getOffsetDimensionName() {
    return this._horizontal ? 'offsetWidth' : 'offsetHeight';
  }

  function eatHeadTail(space, headSpace, tailSpace, pageSize, eatHeadFirst) {
//    var headPages = Math.round(headSpace / pageSize), // | 0,
//        tailPages = Math.round(tailSpace / pageSize), // | 0,
//        pages = Math.round(space / pageSize), // | 0,
    var headPages = headSpace / pageSize | 0,
        tailPages = tailSpace / pageSize | 0,
        pages = (space / pageSize | 0) - 1, // -1 is for safety, as page size is a guess
        pageDiff = Math.abs(headPages - tailPages),
        head = 0,
        tail = 0;
    
    pages -= pageDiff;
    if (headPages > tailPages)
      head += pageDiff;
    else
      tail += pageDiff;

    while (pages > 0) {
      pages--;
      if (eatHeadFirst)
        head++;
      else
        tail++;
        
      eatHeadFirst = !eatHeadFirst;
    }
    
    return {
      head: head,
      tail: tail
    }
  };
  
  return BasicView.extend({
//    viewType: 'collection',
    _itemRenderOptions: {
      force: true,
      renderToHtml: true,
      delegateEvents: false // delegate when we issue setElement
    },

    // CONFIG
    _invisibleLayerThickness: 0, // in pages, 1 == 1 page, 2 == 2 pages, etc. (3 == 3 pages fool!)
    _maxPagesInSlidingWindow: 12,
    _minPagesInSlidingWindow: 6,
    // END CONFIG
    
    _outOfData: false,
    _adjustmentQueued: false,
    _hiddenPagesAtHead: 0,
    _hiddenPagesAtTail: 0,
    _slidingWindowInsideBuffer: 0, // px, should depend on size of visible area of the list, speed of device, RAM
    _slidingWindowOutsideBuffer: 0, // px, should depend on size of visible area of the list, speed of device, RAM
    _minSlidingWindowDimension: null, // px, should depend on size of visible area of the list, speed of device, RAM
    _maxSlidingWindowDimension: null, // px, should depend on size of visible area of the list, speed of device, RAM
    _pagesCurrentlyInSlidingWindow: 0,
    _elementsPerPage: 0,
    _horizontal: false,
    _scrollable: false, // is set to true when the content is bigger than the container

    initialize: function(options) {
      _.bindAll(this, 'render', 'getNextPage', 'refresh', 'onScroll', 'adjustSlidingWindow', 'setMode', 'appendPages', 'onResourceChanged', 'getNewSize', '_onScrollerSizeChanged', '_onScrollerScrollable', '_queueSlidingWindowCheck'); //, 'onScrollerSizeChanged');
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
      
//      var self = this,
//          col = this.collection;
//      
//      _.each(['updated', 'added', 'reset'], function(event) {
//        self.stopListening(col, event);
//        self.listenTo(col, event, function(resources) {
//          resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//          var options = {
//            resources: resources
//          };
//          
//          options[event] = true;
//          if (event == 'reset')
//            self._resetPaging();
//          
//          self.refresh(options);
//        });
//      });      
      
      var viewport = G.viewport;
      this._pages = [];
      this._scrollerContainer = {};
      this._viewport = {};
      this._cachedSlidingWindow = {}; // sliding window dimensions 
      this._slidingWindowOpInfo = {   // can reuse this as sliding window operations never overlap
        id: G.nextId(),
        isFirstPage: false,
        html: [],
        prepended: [],
        appended: [],
        updated: [],
        removedFromTop: [],
        removedFromBottom: [],
        pageRange: {
          from: 0,
          to: 0
        },
        range: {
          from: 0,
          to: 0
        }
      };
      
      this._displayedCollectionRange = {
        from: 0,
        to: 0
      };

//      this.initDummies();
      this._onScrollerSizeChanged({
        target: this.el,
        content: viewport,
        container: viewport,
        scrollTop: 0,
        scrollLeft: 0
      });

      return this;
    },

    pageEvents: {
      'scrollo.resourceListView': 'onScroll',
      'scrollosize.resourceListView': '_onScrollerSizeChanged',
      'scrolloable.resourceListView': '_onScrollerScrollable'
    },

    modelEvents: {
      'reset': '_resetPaging',
      'added': '_onAddedResources'
//        ,
//      'updated': '_onUpdatedResources'
    },
    
    _onAddedResources: function(resources) {
      this._outOfData = false;
      this.adjustSlidingWindow();
    },

//    _onUpdatedResources: function(resources) {
//      debugger;
//      var i = resources.length,
//          res,
//          childView;
//      
//      while (i--) {
//        res = resources[i];
//        childView = this.findChildByResource(res);
//        if (childView)
//          childView.refresh();
//      }
//      
////      this.refresh();
//    },

    initDummies: function() {
      if (!this.el || this._initializedDummies)
        return;
      
      this._initializedDummies = true;
      this.empty();
      if (this.isDummyPadded()) {
        this.dummies = this.getDummies();
        if (!this.dummies.length) {
          this.html(this.makeDummies());
          this.dummies = this.getDummies();
        }
        
        if (this._horizontal) {
          this.dummies.head.style.display = 'inline-block';
          this.dummies.tail.style.display = 'inline-block';
        }
      }
    },
    
    _resetPaging: function() {
      this._outOfData = false;
      this._pages.length = 0;
//      this._pageOffset = 0;
      this._pagesCurrentlyInSlidingWindow = 0;
      this._displayedCollectionRange.from = this._displayedCollectionRange.to = 0;
      this.$('.listPage').$remove();
      this.adjustSlidingWindow();
    },
    
    _updateViewport: function(info) {
//            width = Math.min(window.innerWidth, content.width),
//            height = Math.min(window.innerHeight, content.height),
      var container = info.container,
          width = container.width,
          height = container.height,
          top = info.scrollTop,
          left = info.scrollLeft;
          
//      if (!this._viewport)
//        this._viewport = {};
      
      this._viewport.head = this._horizontal ? left : top;
      this._viewport.tail = this._horizontal ? left + width : top + height;
      this._viewport.width = width;
      this._viewport.height = height;
    },
    
    getViewport: function() {
      return this._viewport;
    },

    _onScrollerScrollable: function(e) {
      this._scrollable = true;
    },

    getPageDimension: function() {
      if (!this._pages.length)
        return 0;
      
      var sw = this.getSlidingWindow();
      return (sw.tail - sw.head) / this._pages.length;
    },
    
    getContainerDimension: function() {
      return this._containerDimensions[getDimensionName.call(this)];
    },
    
    getElementsPerPage: function() {
      if (this._pages.length) {
        this._optimizedElementsPerPage = true;
        
        var viewportDim = this.getViewport()[getDimensionName.call(this)],
            dimProp = getOffsetDimensionName.call(this),
            numEls = this._displayedCollectionRange.to - this._displayedCollectionRange.from,
            slidingWindow = this.getSlidingWindow(),
            elHeight = (slidingWindow.tail - slidingWindow.head) / numEls;
        
        return this._elementsPerPage = viewportDim / elHeight | 0; 
      }
      else
        return this._elementsPerPage = Math.min(this.getContainerDimension() / 50 | 0, 10);
    },
    
    _onScrollerSizeChanged: function(e) {
      var info = e.detail || e,
          dimProp = getDimensionName.call(this),
          pages = Math.max(this._minPagesInSlidingWindow, this._pagesCurrentlyInSlidingWindow),
          slidingWindow = this.getSlidingWindow(),
          slidingWindowDim = Math.max(this._minSlidingWindowDimension, slidingWindow.tail - slidingWindow.head),
          pageDimension;
      
      _.extend(this._scrollerContainer, info.container);
      this._containerDimensions = _.clone(info.container);
      pageDimension = info.container[dimProp];
      this._elementsPerPage = this.getElementsPerPage();
      this._updateViewport(info);
      this._minSlidingWindowDimension = pageDimension * pages; // px, should depend on size of visible area of the list, speed of device, RAM
      this._maxSlidingWindowDimension = pageDimension * this._maxPagesInSlidingWindow; // px, should depend on size of visible area of the list, speed of device, RAM
      this._slidingWindowInsideBuffer = slidingWindowDim / 2; // how far away the viewport is from the closest border of the sliding window before we start to fetch more resources
      this._slidingWindowOutsideBuffer = Math.max(slidingWindowDim / 5, this._slidingWindowInsideBuffer / 2); // how far away the viewport is from the closest border of the sliding window before we need to adjust the window

      this.adjustSlidingWindow();
    },
    
    _queueSlidingWindowCheck: function() {
//      resetTimeout(this._slidingWindowTimeout) || (this._slidingWindowTimeout = setTimeout(this.adjustSlidingWindow));
      setTimeout(this.adjustSlidingWindow); // async so that the first pages can be displayed before we add more
    },
    
    onScroll: Q.throttle(function(e) {
      if ((this.el == e.target || e.currentTarget.contains(this.el)) && this.isActive()) {
//        console.log("SCROLL EVENT: ", info.scrollTop);
        this._updateViewport(e.detail);
        this.adjustSlidingWindow();
      }
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
      
//      this._visibleArea = {
//        top: 0,
//        bottom: window.innerHeight,
//        left: 0,
//        right: window.innerWidth
//      };
      
//      this._viewportSizeChanged();
      this.imageProperty = U.getImageProperty(this.collection);
      this.adjustSlidingWindow();
    },
  
    isDummyPadded: function() {
      return true;
    },
    
    /**
     * re-render the elements in the sliding window
     */
    refresh: function() {
      this.adjustSlidingWindow();
      
      // TODO: remove all the elements in the sliding window and repaint them
//      if (this._refreshing)
//        return;
//      
//      var self = this,
//          pages = this._pagesCurrentlyInSlidingWindow;
//
//      if (!pages)
//        return;
//      
//      this._refreshing = true;
//      this._previousPagingOp = null;
//      return this.removePages(this._pagesCurrentlyInSlidingWindow)
//                        .then(function() {
//                          self._pagesCurrentlyInSlidingWindow = 0;
//                          return self.addPages(pages, false, true);
//                        })
//                        .done(function() {
//                          self._refreshing = false;
//                          self.adjustSlidingWindow();
//                        });
    },
    
    getDimensionDiff: function(from, to) {
      return (to.tail - to.head) - (from.tail - from.head); 
    },
    
    getHeadPosition: function(el) {
      return this._horizontal ? el.offsetLeft : el.offsetTop;
    },

    getTailPosition: function(el) {
      return this._horizontal ? el.offsetLeft + el.offsetWidth : el.offsetTop + el.offsetHeight;
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

    setDummyDimension: function(el, value) {
      if (el == this.dummies.head)
        this.dummies.headDimension = value;
      else if (el == this.dummies.tail)
        this.dummies.tailDimension = value;
      
      el.style[getDimensionName.call(this)] = value + 'px';
    },
    
    getDimension: function(el) {
      return el[getOffsetDimensionName.call(this)];
    },
    
    /**
     * @return a promise to adjust the sliding window
     */
    adjustSlidingWindow: function() {
      var self = this;
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
        self._cleanSlidingWindowOpInfo();
        if (self._adjustmentQueued) {
          self._adjustmentQueued = false;
          setTimeout(self.adjustSlidingWindow, 0);
        }
      });
      
      return this._slidingWindowPromise;
    },
    
    _cleanSlidingWindowOpInfo: function() {
      var info = this._slidingWindowOpInfo;
      for (var prop in info) {
        var val = info[prop];
        if (_.isArray(val))
          val.length = 0;
        else if (_.getObjectType(val) == '[object Object]')
          _.clearProperties(val);
      }
      
      info.id = G.nextId();
    },
    
    _hidePages: function(head, tail) {
      if (!this._pages.length)
        return;
      
//      Q.write(function() {
        var numHidden = 0,
            page;
        
        if (head) {
          while (head--) {
            page = this._pages[head];
            if (!page.dataset.hidden) {
              numHidden++;
              page.dataset.hidden = true;
            }
            
            page.style.visibility = 'hidden';
          }
          
          this._hiddenPagesAtHead += numHidden;
        }
         
        if (tail) {
          var lastPageIdx = this._pages.length - 1;
          while (tail--) {
            page = this._pages[lastPageIdx - tail];
            if (!page.dataset.hidden) {
              numHidden++;
              page.dataset.hidden = true;
            }
            
            page.style.visibility = 'hidden';
            numHidden++;
          }
          
          this._hiddenPagesAtTail += numHidden;
        }
//      }, this);
    },
    
    _showAndHidePages: function() {
      var invisibleLayer = this._invisibleLayerThickness;
      if (invisibleLayer) {
        var viewport = this.getViewport(),
            viewportDim = viewport && viewport.tail - viewport.head,
            slidingWindow = this.getSlidingWindow(), // should be relative to this view, i.e. head==0 means we're at the top/left of the page
            slidingWindowDim = slidingWindow.tail - slidingWindow.head,
            headDiff = viewport.head - slidingWindow.head,
            tailDiff = slidingWindow.tail - viewport.tail,
            scrollingTowardsHead = this.pageView.getLastScrollDirection() == 'head',
            pageDim = this.getPageDimension(),
            head,
            tail;
        
        this._showHiddenPages();
        if (scrollingTowardsHead) {
          tail = tailDiff - invisibleLayer * pageDim;
          tail = tail > 0 ? Math.min(invisibleLayer, tail / pageDim | 0, this._pages.length / 2 | 0) : 0;
        }
        else {
          head = headDiff - invisibleLayer * pageDim;
          head = head > 0 ? Math.min(invisibleLayer, head / pageDim | 0, this._pages.length / 2 | 0) : 0;
        }
      
        if (head || tail)
          this._hidePages(head, tail);
      }
    },
    
    _showHiddenPages: function() {
//      Q.write(function() {
        var numUnhidden = 0;
        if (this.pageView.getLastScrollDirection() == 'head') {
          for (i = 0; i < this._pages.length; i++) {
            var page = this._pages[i];
  //          if (page.style.visibility != 'hidden') // we've reached the visible part
            if (!page.dataset.hidden)
              break;
            
            page.style.removeProperty('visibility');
            delete page.dataset.hidden;
            numUnhidden++;
          }
          
          this._hiddenPagesAtHead -= numUnhidden;
        }
        else {
          i = this._pages.length;
          while (i--) {
            var page = this._pages[i];
  //          if (page.style.visibility != 'hidden') // we've reached the visible part
            if (!page.dataset.hidden)
              break;
            
            page.style.removeProperty('visibility');
            delete page.dataset.hidden;
            numUnhidden++;
          }
          
          this._hiddenPagesAtTail -= numUnhidden;
        }
//      }, this);
    },
    
    /**
     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
     */
    _adjustSlidingWindow: function() { // debounce this
//      var viewport = this.getHeadAndTail(this._visibleArea),
      if (!this.isActive())
        return G.getRejectedPromise();
      
      var self = this,
          n = 1,
          viewport = this.getViewport(),
          viewportDim,
          slidingWindow, // should be relative to this view, i.e. head==0 means we're at the top/left of the page
          slidingWindowDim,
          headDiff,
          tailDiff,
          invisibleLayer = this._invisibleLayerThickness,
          pageDim = this.getPageDimension(),
          scrollingTowardsHead = this.pageView.getLastScrollDirection() == 'head',
          canAppend = !this._outOfData || this._displayedCollectionRange.to != this.collection.length;

      if (!this._initializedDummies)
        this.initDummies();
  
      if (!viewport || !this._initializedDummies) {
        this._initSlidingWindowTimer = setTimeout(this.adjustSlidingWindow, 50);
        return false;
      }
      
//      if (this._pagesCurrentlyInSlidingWindow < this._minPagesInSlidingWindow)
//        return this._growSlidingWindow(n, scrollingTowardsHead).done(this._queueSlidingWindowCheck);
      
      viewportDim = viewport && viewport.tail - viewport.head;
      slidingWindow = this.getSlidingWindow(); // should be relative to this view, i.e. head==0 means we're at the top/left of the page
      slidingWindowDim = slidingWindow.tail - slidingWindow.head;
      headDiff = viewport.head - slidingWindow.head;
      tailDiff = slidingWindow.tail - viewport.tail;
      if (scrollingTowardsHead)
        headDiff -= pageDim * Math.min(this._minPagesInSlidingWindow / 4 | 0, 2); //this._minSlidingWindowDimension * 0.25;
      else 
        tailDiff -= pageDim * Math.min(this._minPagesInSlidingWindow / 4 | 0, 2); //this._slidingWindowOutsideBuffer / 2; //this._minSlidingWindowDimension * 0.25;
      
      if (canAppend && slidingWindowDim < this._minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        if (this._scrollable)
          n = Math.ceil((this._minSlidingWindowDimension - slidingWindowDim) / pageDim);
        
        return this.addPages(n, scrollingTowardsHead).done(this._queueSlidingWindowCheck); // n==1. Always grow by one page at a time (so the user doesn't have to wait to see the first few pages)
      }
      else if (slidingWindowDim > this._maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        var headDiff = viewport.head - slidingWindow.head,
            tailDiff = slidingWindow.tail - viewport.tail,
//            extraSpace = headDiff + tailDiff - 2 * this._slidingWindowOutsideBuffer;
            extraSpace = slidingWindowDim - this._minSlidingWindowDimension;
        
        var headTail = eatHeadTail(extraSpace, headDiff, tailDiff, pageDim, !scrollingTowardsHead);
        return this._shrinkSlidingWindow(headTail.head, headTail.tail).done(this._queueSlidingWindowCheck); // n==1. Always grow by one page at a time (so the user doesn't have to wait to see the first few pages)
      }
      else if (canAppend && tailDiff < this._slidingWindowInsideBuffer) {
        n = Math.ceil((this._slidingWindowInsideBuffer - tailDiff) / viewportDim);
        if (tailDiff < this._slidingWindowOutsideBuffer)
          return this.appendPages(n).done(this._queueSlidingWindowCheck);
//          return this.page(n).done(this._queueSlidingWindowCheck);
        else if (!this._outOfData && this.collection.length - this._displayedCollectionRange.to < this._elementsPerPage * 2)
          return this.getNextPage().done(this._queueSlidingWindowCheck);
        else
          return G.getResolvedPromise();
      }
      else if (this._displayedCollectionRange.from > 0 && headDiff < this._slidingWindowOutsideBuffer) {
//        diff = diff < 0 ? -diff + this._slidingWindowOutsideBuffer : diff;
        n = Math.ceil((this._slidingWindowInsideBuffer - headDiff) / viewportDim);
//        return this.page(n, true).done(this._queueSlidingWindowCheck);
        return this.prependPages(n).done(this._queueSlidingWindowCheck);
      }
      else
        this._showAndHidePages();
      
      return false;
    },

    getDummyTag: function() {
      return 'div';
    },
    
    makeDummies: function() {
      var tag = this.getDummyTag();
      return '<{0} class="dummy head"></{0}><{0} class="dummy tail"></{0}>'.format(tag);
    },
    
    getDummies: function() {
      var dummies = this.el.getElementsByClassName('dummy'),
          info = {
            headDimension: 0,
            tailDimension: 0
          };
      
      for (var i = 0; i < dummies.length; i++) {
        var dummy = dummies[i];
        if (dummy.classList.contains('head'))
          info.head = dummy;
        else
          info.tail = dummy;
      }
      
      return info;
    },

    _toCollectionRange: function(fromPage, toPage) {
      var from = fromPage * this._elementsPerPage,
          range = {
            from: from, 
            to: Math.max(from, toPage * this._elementsPerPage)
          };
      
//      if (isNaN(range.from) || isNaN(range.to))
//        debugger;
      
      return range;
    },

    appendPages: function(n, force) {
      var prev = this._previousPagingOp;
//      if (prev == 'prepend') {
//        this._previousPagingOp = 'grow';
//        return this._growSlidingWindow(1);
//      }
//        
//      this._previousPagingOp = 'append';
      return this.addPages(n, false, force);
    },

    prependPages: function(n, force) {
//      var prev = this._previousPagingOp;
//
//      if (prev == 'append') {
//        this._previousPagingOp = 'grow';
//        return this._growSlidingWindow(1, true);
//      }
//      
//      this._previousPagingOp = 'prepend';
      return this.addPages(n, true, force);
    },
    
    getPageTag: function() {
      return 'ul';
    },

    setPageAttributes: function(el) {
      el.id = 'listPage' + G.nextId();
    },
    
    getWidgetLibClasses: function() {
      if (_.has(this, '_widgetLibClasses'))
        return this._widgetLibClasses;
      
      var base = ['listPage'];
      if (G.isTopcoat())
        base.push('topcoat-list__container');
      else if (G.isBootstrap())
        base.push('list-group');
      
      return this._widgetLibClasses = base.join(" ");
    },
    
    /** 
    * shorten the dummy div below this page by this page's height/width (if there's a dummy div to shorten)
    * @param force - will add as much as it can, including a half page
    * @return a promise
    */
    addPages: function(n, atTheHead, force) {
//      this.log('SLIDING WINDOW', 'adding pages' + (atTheHead ? ' at the head' : ''));
      n = n || 1;
      var self = this,
          col = this.collection,
          elementsToAdd = n * this._elementsPerPage,
          displayed = this._displayedCollectionRange,
          info = this._slidingWindowOpInfo,
          colRange = info.range,
          pageRange = info.pageRange,
          preRenderPromise;
      
      if (atTheHead) {
        colRange.to = displayed.from;
        colRange.from = Math.max(displayed.from - elementsToAdd, 0);
      }
      else {
        colRange.from = displayed.to;
        colRange.to = colRange.from + elementsToAdd;
      }

      if (colRange.to > col.length) {
        if (force) {
          // settle for loading an incomplete page
          colRange.to = col.length;
          n = Math.ceil(colRange.to - colRange.from) / this._elementsPerPage; 
        }
        else {
          if (this._outOfData)
            return G.getRejectedPromise();
          
          var numToFetch = Math.max(colRange.to - col.length, this._elementsPerPage);
          return this.getNextPage(numToFetch).then(this.addPages.bind(this, n, atTheHead), this.addPages.bind(this, n, atTheHead, true));
        }
      }
      
      if (colRange.from >= colRange.to)
        return G.getRejectedPromise();
            
      var info = this._slidingWindowOpInfo;
      info.isFirstPage = !this._pagesCurrentlyInSlidingWindow; 
      
      preRenderPromise = this.preRender(info);
      if (_.isPromise(preRenderPromise))
        return preRenderPromise.then(this._addPages.bind(this, n, atTheHead, info));
      else
        return this._addPages(n, atTheHead, info);
    },

    _getDummy: function(head) {
      return this.dummies && this.dummies[head ? 'head' : 'tail'];
    },

    _getSlidingWindowOffset: function(head) {
      return this.dummies[(head ? 'head' : 'tail') + 'Dimension']
    },
    
    _addPages: function(n, atTheHead, info) {
      this.log("PAGER", "ADDING", n, "PAGES", atTheHead ? "AT THE HEAD" : "");
      var self = this,
          childTagName = this._preinitializedItem.prototype.tagName || 'div',
          pageTag = this.getPageTag(),
          pageClasses = this.getWidgetLibClasses() || '',
          displayed = this._displayedCollectionRange,
          colRange = info.range,
          col = this.collection,
          added = info[atTheHead ? 'prepended' : 'appended'],
          numRendered = 0,
          numPagesRendered = 0,
          pageEndTag = '</{0}>'.format(pageTag),
          stop = false,
          dfd = $.Deferred(),
          promise = dfd.promise(),
          dummy = this._getDummy(atTheHead),
          dummyDim = dummy && this._getSlidingWindowOffset(atTheHead),
          newDummyDim, 
          currentPageHtml = [],
          currentPageEl,
          postRenderResult, 
          finish;
      
      function finish() {
        if (self.isDummyPadded() && newDummyDim != dummyDim) {
          Q.write(function() {
            self.setDummyDimension(dummy, newDummyDim);
            dfd.resolve();
          });
        }
        else
          dfd.resolve();
      };
      
      label(promise);
      dfd.done(function() {
        self._invalidateCachedSlidingWindow();
        self._pagesCurrentlyInSlidingWindow += n;
        if (atTheHead) {
//          self._pageOffset = Math.max(self._pageOffset - n, 0);
          displayed.from -= numRendered;
        }
        else
          displayed.to += numRendered;
      });
      
      function renderOneListItem(resNum, isFirst, isLast) {
        var res = col.models[resNum],
            liView = this.renderItem(res, atTheHead);

//        if (atTheHead)
//          console.log("PREPENDING", U.getDisplayName(res));
        
        if (isFirst) {
          currentPageEl = doc.createElement(pageTag);
          currentPageEl.setAttribute('class', pageClasses);
          self.setPageAttributes(currentPageEl);
          currentPageHtml.length = 0;
//          currentPageHtml[currentPageHtml.length] = '<{0} class="listPage {1}" {2}>'.format(pageTag, pageClasses, pageAttributes);
        }
        
        if (liView !== false) {
          this.postRenderItem(liView._html, info);
          currentPageHtml[currentPageHtml.length] = liView._html;
          delete liView._html;
        }
        
        numRendered++;
        if (isLast && currentPageHtml.length) {
//          currentPageHtml[currentPageHtml.length] = pageEndTag;
          var html = currentPageHtml.join("");
          if (G.lazifyImages && !self._scrollable)
            html = DOM.unlazifyImagesInHTML(html);
            
          currentPageEl.innerHTML = html;            
          added.push(currentPageEl);
//            info.html[info.html.length] = html;
          numPagesRendered++;
        }
      }
      
      for (var i = 0, resNum = colRange.from; i < n; i++) {
        for (var j = 0, numEls = this._elementsPerPage; j < numEls; ++j && ++resNum) {
          if (resNum + 1 == colRange.to)
            stop = true;
          
          Q.nonDom(renderOneListItem, this, [resNum, j == 0, stop || j + 1 == numEls]);
          if (stop)
            break;
        }
        
        if (stop)
          break;
      }

      Q.defer(1, 'read', function getDummyDim() {
        dfd.notify(numPagesRendered);
        if (!self._optimizedElementsPerPage && self._pages.length)
          self.getElementsPerPage();
        
        if (!numRendered) {
          dfd.resolve();
          return;
        }
        
        Q.write(function insertPage() {
//          self.log("PAGER", "ADDING PAGE, FRAME", window.fastdom.frameNum);
//          var pages = info.added = $($.parseHTML(info.html.join(""), doc));
          var el = self.el,
              insertionPoint,
              i;
          
          if (atTheHead)
            insertionPoint = self.isDummyPadded() ? el.firstChild.nextSibling : el.firstChild;
          else
            insertionPoint = self.isDummyPadded() ? el.lastChild : null; 

          self._pages[atTheHead ? 'unshift' : 'push'].apply(self._pages, added);
          i = added.length;
          while (i--) {
            var page = added[i],
                childEls = page.childNodes.$filter(function(c) { return c.nodeType == 1 }); // filter out text nodes that creep in

            for (var j = 0; j < childEls.length; j++) {
              var childEl = childEls[j],
                  viewId = childEl.dataset.viewid;
              
              if (typeof viewId == 'undefined')
                continue;
              
              var child = self.children[viewId];
              self.listenTo(child.resource, 'change', self.onResourceChanged);
              self.listenTo(child.resource, 'saved', self.onResourceChanged);
              child.setElement(childEl);
              if (child.postRender)
                child.postRender();
            }
            
            el.insertBefore(page, insertionPoint);
            insertionPoint = page;
          }
          
          self._showAndHidePages();
          postRenderResult = self.postRender(info);
          
          // if dummy dimension changed, we will use it on the next frame (in the "finish" function)
          if (self.isDummyPadded()) {
            if (colRange.from == 0)
              newDummyDim = 0;
  //          else if (dummyDim > 0)
  //            newDummyDim = Math.max(dummyDim - self.getDimension(pages), 0);
            else if (dummyDim > 0) {
              newDummyDim = Math.max(dummyDim - _.reduceRight(added, function(memo, page) { 
                return memo + self.getDimension(page); 
              }, 0), 0);
            }
            else
              newDummyDim = dummyDim;
          }
          
          if (_.isPromise(postRenderResult))
            postRenderResult.always(finish);
          else
            finish();
        });
      });

      return promise;
    },
    
    getNewSize: function() {
//      this.trigger('invalidateSize');
      this.pageView.trigger('invalidateSize');
    },

    /**
     * Moves sliding window down, appending "n" pages and removing "n" pages from the head
     */
    page: function(n, up) {
      n = n || 1;
//      this._pageReqNum++;
      this.log("PAGING", up ? "UP" : "DOWN");
      // append a new page, remove the first page, move visibility down a page
//      this.calcAddRemoveSize(n, false);
      var self = this,
          add = this[up ? 'prependPages' : 'appendPages'](n),
          remove;
      
      add.progress(function(n) {
        if (n)
          remove = self.removePages(n, !up);
        else
          remove = G.getResolvedPromise();
      });
      
      add.done(this.getNewSize);
      return $.when(add, remove).then(this.getNewSize);
    },
    
    getListItems: function() {
      return _.filter(this.el.childNodes, function(node) {
        return !node.classList.contains('dummy');
      });
    },

    /**
     * @return offsets on all sides of the sliding window
     */
    getSlidingWindow: function() {
      if (_.size(this._cachedSlidingWindow)) // we don't create a new object when we invalidate, we just wipe the properties on it
        return this._cachedSlidingWindow;
      
      // override this if you're not using dummies
      if (!this.isDummyPadded())
        throw "not implemented yet, please override or implement";
      
      if (!this.rendered)
        return {head: 0, tail: 0};
      
      var head = this.dummies.headPosition;
      if (typeof head !== 'number')
        head = this.dummies.headPosition = this.getHeadPosition(this.dummies.head);
      
      return (this._cachedSlidingWindow = {
        head: head + this.dummies.headDimension,
        tail: this.getHeadPosition(this.dummies.tail)
      });
    },

    _invalidateCachedSlidingWindow: function() {
      _.wipe(this._cachedSlidingWindow, true);
    },
    
//    /**
//     * grows the sliding window by "n" pages, from the top/left if head==true, otherwise from the bottom/right
//     * @return a promise
//     */
//    _growSlidingWindow: function(n, head) {
//      if (!head && this._outOfData) //|| this._pagesCurrentlyInSlidingWindow + n > this._maxPagesInSlidingWindow)
//        return G.getRejectedPromise();
//      
//      this.log('PAGER', 'GROWING SLIDING WINDOW');
//      n = n || 1;
//      var self = this;
////      this.calcAddRemoveSize(n, true, head);
//      return $.Deferred(function(defer) {
//        var promise;
//        if (head)
//          promise = self.prependPages(n);
//        else
//          promise = self.appendPages(n);
//        
//        promise.done(function() {
////          self._pagesInSlidingWindow = Math.max(self._pagesCurrentlyInSlidingWindow, self._pagesInSlidingWindow);
////          console.log("GREW SLIDING WINDOW TO", self._pagesCurrentlyInSlidingWindow);
//          self.getNewSize();
//          defer.resolve();
//        }).fail(defer.reject);
//      }).promise();
//    },

    /**
     * shrinks the sliding window by "head" pages at the head and "tail" pages at the tal
     * @return a promise
     */
    _shrinkSlidingWindow: function(head, tail) {
      this.log('PAGER', 'SHRINKING SLIDING WINDOW');
      
      
      var self = this,
          dfd = $.Deferred(),
          invisibleLayer = this._invisibleLayerThickness,
          headPromise,
          tailPromise;
      
//      if (invisibleLayer) {
//        var invisibleHead = Math.min(invisibleLayer, head),
//            invisibleTail = Math.min(invisibleLayer, tail),
//            lastPageIdx = this._pages.length - 1;
//        
//        head -= invisibleHead;
//        tail -= invisibleTail;
//        
//        while (invisibleHead--) {
//          this._pages[head + invisibleHead].$hide();
//        }
//        
//        while (invisibleTail--) {
//          this._pages[lastPageIdx -(tail + invisibleTail)].$hide();
//        }
//      }
      
      
      headPromise = head ? this.removePages(head, true) : G.getResolvedPromise();
      tailPromise = tail ? this.removePages(tail) : G.getResolvedPromise();
      function done() {
        if (headPromise.state() != 'pending' && tailPromise.state() != 'pending') {
//          if (_.countBy(self._pages, function(p) { return p.style.display == 'none' })['true'] > 2)
//            debugger;
          
          self.getNewSize();
          dfd.resolve();
        }
      };
      
      headPromise.always(done);
      tailPromise.always(done);
      return dfd.promise();
    },

    /**
     * Removes "pages" from the DOM and replaces the lost space by creating/padding a dummy div with the height/width of the removed section
     * The reason we keep dummy divs on both sides of the sliding window and not just at the top is to preserve the integrity of the scroll bar, which would otherwise revert back to 0 if you scrolled back up to the top of the page
     */
    removePages: function(n, fromTheHead) {
      this.log("PAGER", "REMOVING", n, "PAGES FROM THE", fromTheHead ? "HEAD" : "TAIL");
      var self = this,
          info = this._slidingWindowOpInfo,
          displayed = this._displayedCollectionRange,
          removedViews = [],
          removedPages,
          first,
          last,
          head,
          tail,
          splitIdx,
          removedPageDim,
//          ,
//      var sizes = this._slidingWindowAddRemoveInfo,
//          $dummy = fromTheHead ? this.dummies.head : this.dummies.tail,
//          removedViews = sizes.removedViews,
          dfd = $.Deferred();

      dfd.done(function() {
        self._invalidateCachedSlidingWindow();
        self._pagesCurrentlyInSlidingWindow = Math.max(self._pagesCurrentlyInSlidingWindow - n, 0);
        if (fromTheHead) {
          displayed.from += removedViews.length;
//          self.log('PAGE OFFSET: ', this._pageOffset + n);
//          self._pageOffset += n;
        }
        else
          displayed.to -= removedViews.length;
        
        self._showAndHidePages();
      });

      if (fromTheHead)
        splitIdx = Math.min(n, this._pages.length - 1);
      else
        splitIdx = Math.max(this._pages.length - n, 0);
      
      removedPages = info[fromTheHead ? 'removedFromTop' : 'removedFromBottom'] = fromTheHead ? this._pages.slice(0, splitIdx) : this._pages.slice(splitIdx); // optimize
      if (fromTheHead)
        Array.removeFromTo(this._pages, 0, splitIdx);
      else
        this._pages.length = splitIdx;
      
      Q.defer(1, 'read', function() {
        for (var i = 0, len = removedPages.length; i < len; i++) {
          var page = removedPages[i],
              children = page.childNodes;
          
          for (var j = 0, numChildren = children.length; j < numChildren; j++) {
            var child = children[j],
                childView = self.children[child.dataset.viewid];
            
            removedViews.push(childView);
          }
        }

        removedPageDim = _.reduceRight(removedPages, function(memo, page) { 
          return memo + self.getDimension(page); 
        }, 0);
        
        Q.write(function removePagesFromDOM() {
          self.doRemovePages(removedPages, fromTheHead);
          for (var i = 0, len = removedViews.length; i < len; i++) {
            var view = removedViews[i];
            self.stopListening(view.resource);
            view.destroy();
          }
          
          if (self.isDummyPadded()) {
            self.log("PAGER", "UPDATING {0} DUMMY SIZE".format(fromTheHead ? "HEAD" : "TAIL"));
            self.setDummyDimension(self._getDummy(fromTheHead), self._getSlidingWindowOffset(fromTheHead) + removedPageDim);
          }
          
          dfd.resolve();
        });
      });

      return dfd.promise();
    },

    onResourceChanged: function(res) { // attach/detach when sliding window moves
      var itemView = this.findChildByResource(res);
      if (itemView) {
        itemView.render(); // or maybe remove and reappend?
        this.adjustSlidingWindow();
        // expect an extra reflow here
      }
    },

//    getFakeNextPage: function(numResourcesToFetch) {
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
//          mock = this.collection.models[4] || this.collection.models[0],
//          uriBase = mock.getUri(),
//          defer = $.Deferred(function(defer) {
//            setTimeout(defer.resolve, 1000);
//          });
//          
//      for (var i = 0; i < numResourcesToFetch; i++) {
//        models.push(new mock.vocModel(_.defaults({
//          _uri: uriBase + G.nextId()
//        }, mock.toJSON())));
//      }
//      
//      this.collection.add(models);
//      this._isPaging = true;
//      this._pagingPromise = defer.promise().done(function() {
//        this._isPaging = false;
//      }.bind(this)); // if we fail to page, then keep isPaging true to prevent more paging
//      
//      return this._pagingPromise;
//    },

    doRemovePages: function(pages) {
      var i = pages.length;
      while (i--) {
        pages[i].$remove();
      }
    },
    
    getNextPage: function(numResourcesToFetch) {
      if (this._isPaging)
        return this._pagingPromise;
      else if (this._outOfData)
        return G.getRejectedPromise();
      
      var self = this,
          col = this.collection,
          before = col.length,
          defer = $.Deferred(),
          nextPagePromise,
          nextPageUrl;
      
      nextPagePromise = col.getNextPage({
        params: {
          $limit: numResourcesToFetch || this._elementsPerPage
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
      
      // if we fail to page, then keep isPaging true to prevent more paging
      this._pagingPromise = defer.promise().always(function() {
        self._isPaging = false;
      }).fail(function() {
        self._outOfData = true;
      }); 
      
      this._pagingPromise._range = 'from: ' + before + ', to: ' + (before + numResourcesToFetch);
      return this._pagingPromise;
    },
   
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw "this view doesn't have a mode " + mode;
      
      this.mode = mode;
    },

    preinitializeItem: function(res) {
      var vocModel = res.vocModel,
          params = {
            parentView: this,
            vocModel: vocModel
          },
          preinitializer = this.constructor._itemView,
          view;
          
//      while (preinitializer && !preinitializer.preinitialize) {
//        preinitializer = preinitializer.__super__.constructor;
//      }
        
      if (this.isEdit) {
        params.editCols = this.hashParams['$editCols']; 
        params.edit = true;
        view = preinitializer.preinitialize(params);
      }
      else if (this.isMultiValueChooser) {
        params.mv = true;
        if (G.isJQM()) {
          params.tagName = 'div';
          params.className = "ui-controlgroup-controls";
        }
        else {
          params.className = G.isTopcoat() ? "topcoat-list__item" : (G.isBootstrap() ? "list-group-item" : "");

        }
        params.mvProp = this.mvProp;
        view = preinitializer.preinitialize(params);
      }
      else {
        this._defaultSwatch = G.theme  &&  (G.theme.list  ||  G.theme.swatch);
        view =preinitializer.preinitialize(params);
      }
      
      return view;
    },
    
    /**
     * @return view for rendered list item
     */
    renderItem: function(res, prepend) {
      var viewName = 'listItem' + G.nextId(),
          liView,
          preinitializedItem = this._preinitializedItem,
          options = {
//            createElement: false,
            delegateEvents: false,
            resource: res
          };
      
      if (this.isEdit) {
        liView = new preinitializedItem(options);
      }
      else if (this.isMultiValueChooser) {
        options.checked = _.contains(this.mvVals, res.get('davDisplayName'));
        liView = new preinitializedItem(options);
      }
      else {
        options.swatch = res.get('swatch') || this._defaultSwatch;
        liView = new preinitializedItem(options);
      }
      
      this.addChild(liView, prepend);      
      liView.render(this._itemRenderOptions);
      return liView;
    },
    
    preRender: function(info) {
      if (this._prerendered)
        return;
      
      // override me
      var self = this;
      var colRange = info.range;
      var from = colRange.from;
      var to = colRange.to;
      var ranges = [];
      var first = this.collection.models[from];
      var vocModel = first.vocModel;
      var meta = vocModel.properties;
      if (!this._preinitializedItem)
        this._preinitializedItem = this.preinitializeItem(first);
      
      if (U.isA(vocModel, 'Intersection')) {
        var ab = U.getCloneOf(vocModel, 'Intersection.a', 'Intersection.b'),
            a = ab['Intersection.a'],
            b = ab['Intersection.b'];
        
        if (a && !U.getModel(a = a[0]))
          ranges.push(meta[a].range);
        if (b && !U.getModel(b = b[0]))
          _.pushUniq(ranges, meta[b].range);
          
//        for (var i = from; i < to; i++) {
//          var resource = this.collection.models[i];
//          var range = model.properties[clonedI[side]].range;
//          var r = U.getLongUri1(range);
//          if (!U.getModel(r))
//            ranges.push(r);
//        }
        
        if (ranges.length) {
          return Voc.getModels(ranges).done(function() {
            self._prerendered = true;
          });
        }
      }

      this._prerendered = true;

//      .then(function() {
//        var m = U.getModel(r);
//        if (self.imageProperty.cloneOf == 'aFeatured' || self.imageProperty.cloneOf == 'bFeatured') {
//          p = m.properties[U.cloneOf(m, 'ImageResource.mediumImage')];
//          maxDim = m.properties[p].maxImageDimention || m.properties[p].imageWidth; 
//        }
//        else {
//          p = m.properties[U.cloneOf(m, 'ImageResource.smallImage')];
//          maxDim = m.properties[p].maxImageDimention || m.properties[p].imageWidth; 
//        }
//        
//        rect = self.clipRect(resource, image, oW, oH, maxDim);
//        _.extend(props, {top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right});
//        return self.doRender(options, props);
//      });
    },

    /**
     * called after a batch of items are appended to the dom. Info contains the following info: {
     *   isFirstPage: {Boolean},
     *   appended: {Array} appended elements
     * }
     */
    postRender: function(info) {
//      if (G.isTopcoat()) {
//        var items = this.getListItems();
//        for (var i = 0; i < items.length; i++) {
//          items[i].classList.add('topcoat-list__item');
//        }
//      }
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
//      info.frag.appendChild(el);
//      info.html += el;
    },
    
    hasMasonry: function() {
      return this.type == 'masonry';
    }
  }, {
    displayName: 'ResourceListView',
    _itemView: ResourceListItemView
  });
});
