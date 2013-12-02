'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'domUtils',
  'events',
  'views/BasicView',
  'views/ResourceMasonryItemView',
  'views/ResourceListItemView',
  'collections/ResourceList',
  'jqueryMasonry',
  'lib/fastdom',
  'vocManager'
], function(G, U, DOM, Events, BasicView, ResourceMasonryItemView, ResourceListItemView, ResourceList, Mason, Q, Voc) {
  var $wnd = $(window),
      doc = document,
      transformProp = G.crossBrowser.css.transformLookup;

  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.masonry-brick';

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

  function label(item) {
    item._label = item._label || _.uniqueId('label');
  }

  function getOffsetDimensionName() {
    return this._horizontal ? 'offsetWidth' : 'offsetHeight';
  }

  function eatHeadTail(space, headSpace, tailSpace, elSize, totalEls, eatHeadFirst) {
    var headEls = headSpace / elSize | 0,
        tailEls = tailSpace / elSize | 0,
        els = Math.min((space / elSize | 0) - 1, totalEls), // -1 is for safety, as page size is a guess
        elsDiff = Math.abs(headEls - tailEls),
        head = 0,
        tail = 0;
    
    els -= elsDiff;
    if (headEls > tailEls)
      head += elsDiff;
    else
      tail += elsDiff;

    if (els > 0) {
      head += (eatHeadFirst ? els * 0.75 : els * 0.25) | 0;
      tail += (eatHeadFirst ? els * 0.25 : els * 0.75) | 0;
    }
    
    return {
      head: head,
      tail: tail
    }
  };
  
  return BasicView.extend({
    // CONFIG
    _invisibleLayerThickness: 0, // in pages, 1 == 1 page, 2 == 2 pages, etc. (3 == 3 pages fool!)
    _maxViewportsInSlidingWindow: 12,
    _minViewportsInSlidingWindow: 6,
    displayMode: 'vanillaList', // other options: 'masonry'
    // END CONFIG
    
//    _brickMarginH: null,
//    _brickMarginV: null,
//    _headOffset: 0,
//    _tailOffset: 0,
    _masonryOptions: null,
    _childEls: null,
    _outOfData: false,
    _adjustmentQueued: false,
    _hiddenElementsAtHead: 0,
    _hiddenElementsAtTail: 0,
    _slidingWindowInsideBuffer: 0, // px, should depend on size of visible area of the list, speed of device, RAM
    _slidingWindowOutsideBuffer: 0, // px, should depend on size of visible area of the list, speed of device, RAM
    _minSlidingWindowDimension: null, // px, should depend on size of visible area of the list, speed of device, RAM
    _maxSlidingWindowDimension: null, // px, should depend on size of visible area of the list, speed of device, RAM
//    _pagesCurrentlyInSlidingWindow: 0,
//    _elementsPerPage: 0,
    _elementsPerViewport: 0,
    _averageElementSize: 100,
    _horizontal: false,
    _scrollable: false, // is set to true when the content is bigger than the container

    initialize: function(options) {
      _.bindAll(this, 'render', 'fetchResources', 'refresh', 'onScroll', 'adjustSlidingWindow', 'setMode', 'onResourceChanged', 'getNewSize', '_onScrollerSizeChanged', 
                      '_onScrollerScrollable', '_queueSlidingWindowCheck'); //, 'onScrollerSizeChanged');
      options = options || {};
      BasicView.prototype.initialize.call(this, options);
      this.displayMode = options.displayMode || 'vanillaList';
      this._masonryOptions = {
        itemSelector: ITEM_SELECTOR
      };
      
      if (this.displayMode == 'masonry') {
        this._itemClass = ResourceMasonryItemView;
        this.calcElementsPerViewport = this.calcElementsPerViewportMasonry;
      }
      else {
        this._itemClass = ResourceListItemView;
        this._masonryOptions.oneElementPerRow = this._masonryOptions.stretchRow = true;
      }
      
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
      
//      this._offsets = [];
      this._containerDimensions = {};
      this._viewport = {};
      this._slidingWindowRange = {
//        invalid: true // sliding window dimensions
      };
      
      this._slidingWindowOpInfo = {   // can reuse this as sliding window operations never overlap
        id: G.nextId(),
//        isFirstPage: false,
        html: [],
        prepended: [],
        appended: [],
        updated: [],
        removedFromTop: [],
        removedFromBottom: [],
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
      this.itemViewCache = [];
      this._childEls = [];
      return this;
    },

    pageEvents: {
      'scrollo.resourceListView': 'onScroll',
      'scrollosize.resourceListView': '_onScrollerSizeChanged',
      'scrolloable.resourceListView': '_onScrollerScrollable'
    },
    
    modelEvents: {
      'reset': '_resetSlidingWindow',
      'added': '_onAddedResources'
//        ,
//      'updated': '_onUpdatedResources'
    },
    
    events: {
      'click': 'click'
    },
    
    windowEvents: {
      'viewportwidthchanged': '_onWidthChanged'
    },
    
    click: function(e) {
      var top = e.target,
          params = this.hashParams,
          parentView = this,
          self,
          type,
          isWebCl,
          isImplementor,
          cloned,
          viewId;

      while (top && top != this.el && !(viewId = top.dataset.viewid)) {
        top = top.parentNode;
      }
      
      if (!viewId)
        return;
      
      self = this.children[viewId]; // list item view
      if (self.mvProp) 
        return;
      
      Events.stopEvent(e);
      parentView = this;
      type = params['$type'];
      isWebCl = self.doesModelSubclass(G.commonTypes.WebClass);
      isImplementor = type && type.endsWith('system/designer/InterfaceImplementor');
      cloned = self.clonedProperties;
      
      if (self.doesModelSubclass('model/workflow/Alert')) {
        Events.stopEvent(e);
        var atype = self.resource.get('alertType');
        var action = atype  &&  atype == 'SyncFail' ? 'edit' : 'view';   
        Events.trigger('navigate', U.makeMobileUrl(action, self.resource.get('forum'), {'-info': self.resource.get('davDisplayName')}));//, {trigger: true, forceFetch: true});
        return;
      }
      if (self.doesModelSubclass('model/social/QuizQuestion')) {
        var title = _.getParamMap(window.location.hash).$title;
        if (!title)
          title = U.makeHeaderTitle(self.resource.get('davDisplayName'), pModel.displayName);
        var prm = {
            '-info': 'Please choose the answer', 
            $forResource: self.resource.get('_uri'), 
            $propA: 'question',
            $propB: 'answer',
            quiz: self.resource.get('quiz'),
            question: self.resource.get('_uri'),
//            user: G.currentUser._uri,
            $type: self.vocModel.properties['answers'].range,
            $title: self.resource.get('davDisplayName')
        };
        Events.trigger('navigate', U.makeMobileUrl('chooser', self.vocModel.properties['options'].range, prm)); //, {trigger: true, forceFetch: true});
        return;
      }

      // Setting values to TaWith does not work if this block is lower then next if()
      var p1 = params['$propA'];
      var p2 = params['$propB'];
      
      var t = type ? type : self.vocModel.type;
//      var self = this;
      Voc.getModels(t).then(function() {
        var type = t;
        var isIntersection = type ? U.isA(U.getModel(type), 'Intersection') : false;
        if (!isImplementor && parentView && parentView.mode == G.LISTMODES.CHOOSER) {
          if (!isIntersection  &&  (!p1  &&  !p2)) {
            debugger;
            Events.stopEvent(e);
            Events.trigger('chose', self.hashParams.$prop, self.model);
            return;
          }
        }
        var pModel = type ? U.getModel(type) : null;
        if (params  &&  type  &&   p1  &&  p2/*isIntersection*/) {
          Events.stopEvent(e);
          var rParams = {};
          var pRange = U.getModel(t).properties[p1].range;
          if (U.isAssignableFrom(self.vocModel, pRange)) {
            rParams[p1] = self.resource.get('_uri');
            rParams[p2] = params['$forResource'];
          }
          else {
            rParams[p1] = params['$forResource'];
            rParams[p2] = self.resource.get('_uri');
          }
          self.forResource = params['$forResource'];
          rParams.$title = self.resource.get('davDisplayName');
          if (self.doesModelSubclass(G.commonTypes.WebClass)) {
            if (type.endsWith('system/designer/InterfaceImplementor')) {
  //            Voc.getModels(type).done(function() {
                var m = new (U.getModel('InterfaceImplementor'))();
                var uri = self.resource.get('_uri');
                var props = {interfaceClass: uri, implementor: self.forResource};
                m.save(props, {
                  success: function() {
                    Events.trigger('navigate', U.makeMobileUrl('view', self.forResource)); //, {trigger: true, forceFetch: true});        
                  }
                });
  //            });
              return;
            }
            rParams[p2 + '.davClassUri'] =  self.resource.get('davClassUri');
          }
          else if (U.isAssignableFrom(pModel, 'model/study/QuizAnswer')) {
            var m = new pModel();
            m.save(rParams, {
              success: function() {
                Events.trigger('navigate', U.makeMobileUrl('view', self.forResource)); //, {trigger: true, forceFetch: true});        
              }
            });
            return;
          }
          
          Events.trigger('navigate', U.makeMobileUrl('make', type, rParams)); //, {trigger: true, forceFetch: true});
          return;
  //        self.router.navigate('make/' + encodeURIComponent(type) + '?' + p2 + '=' + encodeURIComponent(self.resource.get('_uri')) + '&' + p1 + '=' + encodeURIComponent(params['$forResource']) + '&' + p2 + '.davClassUri=' + encodeURIComponent(self.resource.get('davClassUri')) +'&$title=' + encodeURIComponent(self.resource.get('davDisplayName')), {trigger: true, forceFetch: true});
        }
        else if (isIntersection  &&  type.indexOf('/dev/') == -1) {
          var clonedI = cloned.Intersection;
          var a = clonedI.a;
          var b = clonedI.b;

          if (a  &&  b) {
            if (self.hashParams[a]) 
              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.get(b))); //, {trigger: true, forceFetch: true});
            else if (self.hashParams[b])
              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.get(a))); //, {trigger: true, forceFetch: true});
            else
              dfd.reject();
//            else
//              Events.trigger('navigate', U.makeMobileUrl('view', self.resource.getUri())); //, {trigger: true, forceFetch: true});
              
            return;
          } 
        }
        return G.getRejectedPromise();        
      }).then (
        function success () {

        },
        function fail () {
          var m = U.getModel(t); 
          if (U.isAssignableFrom(m, "aspects/tags/Tag")) {
            var params = _.getParamMap(window.location.href);
            var app = params.application;
            var appModel;
            var tag = params['tagUses.tag.tag'];
            var tag = params['tags'];
            var tt = self.resource.get('tag') || U.getDisplayName(self.resource);
            if (app) {
              for (var p in params) {
                if (m.properties[p])
                  delete params[p];
              }
              params.$title = tt;
    //          params['tagUses.tag.tag'] = '*' + self.resource.get('tag') + '*';
    //              params['tagUses.tag.application'] = app;
            }
            else { //if (tag  ||  tags) {
              app = self._hashInfo.type;
//              app = decodeURIComponent(app.substring(0, idx));
            }
            
            if (app) {
              appModel = U.getModel(app);
              if (appModel) {
                var tagProp = U.getCloneOf(appModel, 'Taggable.tags');
                if (tagProp  &&  tt != '* Not Specified *') {
                  params[tagProp] = '*' + tt + '*';
        
                  Events.trigger('navigate', U.makeMobileUrl('list', app, params));//, {trigger: true, forceFetch: true});
                  return;
                }
              }
            }
          }
          else if (U.isA(m, 'Reference')) {
            var forResource = U.getCloneOf(m, 'Reference.forResource')[0];
            var uri = forResource && self.resource.get(forResource);
            if (uri) {
              Events.trigger('navigate', U.makeMobileUrl('view', uri)); //, {trigger: true, forceFetch: true});
              return;
            }
          }
    
          var action = U.isAssignableFrom(m, "InterfaceImplementor") ? 'edit' : 'view';
          Events.trigger('navigate', U.makeMobileUrl(action, self.resource.getUri())); //, {trigger: true, forceFetch: true});
    //          else {
    //            var r = _.getParamMap(window.location.href);
    //            this.router.navigate('view/' + encodeURIComponent(r[pr[0]]), {trigger: true, forceFetch: true});
    //          }
        }
      );      
    },

    recycleItemViews: function(views) {
      Array.prepend(this.itemViewCache, views);
    },
    
    getCachedItemView: function() {
      return this.itemViewCache.pop();
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
    
    _resetSlidingWindow: function() {
      this._outOfData = false;
      this._displayedCollectionRange.from = this._displayedCollectionRange.to = 0;
      this.el.$empty();
      this.adjustSlidingWindow();
    },
    
    _updateContainerSize: function(info) {
      var container = info.container,
          width = container.width,
          height = container.height,
          top = info.scrollTop,
          left = info.scrollLeft;
      
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

    calcElementsPerViewport: function() {
      this._elementsPerViewport = this.getContainerDimension() / this.getAverageElementSize() | 0;
    },
    
    getElementsPerViewport: function() {
      return this._elementsPerViewport;
    },

    calcMaxElements: function() {
      this._maxElements = this._maxViewportsInSlidingWindow * this.getElementsPerViewport() | 0;
    },
    
    getMaxElements: function() {
      return this._maxElements;
    },

    calcMinElements: function() {
      this._minElements = this._minViewportsInSlidingWindow * this.getElementsPerViewport() | 0;
    },

    getMinElements: function() {
      return this._minElements;
    },

    calcAverageElementSize: function() {
      if (!this._childEls.length)
        return;

      this._averageElementSize = this.getSlidingWindowDimension() / this._childEls.length;      
    },
    
    getAverageElementSize: function() {
      return this._averageElementSize;
    },

    calcContainerArea: function() {
      this._containerArea = this._containerDimensions.width * this._containerDimensions.height;
    },
    
    getContainerArea: function() {
      return this._containerArea;
    },
    
    getContainerDimension: function() {
      return this._containerDimensions[this._horizontal ? 'width' : 'height'];
    },
    
    calcMinSlidingWindowDimension: function() {
      this._minSlidingWindowDimension = this.getAverageElementSize() * this.getMinElements();
    },

    getMinSlidingWindowDimension: function() {
      return this._minSlidingWindowDimension;
    },

    calcMaxSlidingWindowDimension: function() {
      this._maxSlidingWindowDimension = this.getAverageElementSize() * this.getMaxElements();
    },

    getMaxSlidingWindowDimension: function() {
      return this.getAverageElementSize() * this.getMaxElements();
    },

    _onScrollerSizeChanged: function(e) {
      var info = e.detail || e;
//          ,
//          dimProp = this._horizontal ? 'width' : 'height',
//          numEls = this.el ? this.el.childElementCount : 0,
//          slidingWindowDim,
//          elSize,
//          numElsDesired;
      
      _.extend(this._containerDimensions, info.container);
      this._updateContainerSize(info);
      this._recalcPaging();
      this.adjustSlidingWindow();
    },
    
    _onWidthChanged: function() {
      if (this._horizontal)
        return; // let onScrollerSizeChanged handle it
      
      this._containerDimensions.width = this.el.offsetWidth;
      this.masonry && this.masonry.resize();
      this._recalcPaging();
      this.adjustSlidingWindow();
    },    

    _queueSlidingWindowCheck: function() {
      resetTimeout(this._slidingWindowTimeout) || (this._slidingWindowTimeout = setTimeout(this.adjustSlidingWindow));
//      setTimeout(this.adjustSlidingWindow); // async so that the first pages can be displayed before we add more
    },
    
    onScroll: function(e) {
      if ((this.el == e.target || e.currentTarget.contains(this.el)) && this.isActive()) {
//        console.log("SCROLL EVENT: ", info.scrollTop);
        this._onScroll(e);
      }
    },

    _onScroll: function(e) {
      this._updateContainerSize(e.detail);
      this.adjustSlidingWindow();
    },
    
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
      this._onScrollerSizeChanged({
        target: this.el,
        content: G.viewport,
        container: G.viewport,
        scrollTop: 0,
        scrollLeft: 0
      });

      this.adjustSlidingWindow();
    },
  
    isDummyPadded: function() {
      return false; //true;
    },
    
    /**
     * re-render the elements in the sliding window
     */
    refresh: function() {
      this.adjustSlidingWindow();
    },
    
//    getHeadPosition: function(el) {
//      return this._horizontal ? el.offsetLeft : el.offsetTop;
//    },
//
//    getTailPosition: function(el) {
//      return this._horizontal ? el.offsetLeft + el.offsetWidth : el.offsetTop + el.offsetHeight;
//    },
//
//    getTailPosition: function($el) {
//      var pos = $el.position();
//      return this._horizontal ? pos.left : pos.top;
//    },
//
//    getHeadAndTail: function(offset) {
//      return this._horizontal ? {
//        head: offset.left,
//        tail: offset.right
//      } : {
//        head: offset.top,
//        tail: offset.bottom
//      }
//    },
//
//    getDimension: function(el) {
//      return el[getOffsetDimensionName.call(this)];
//    },
    
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
    
    _hideElements: function(head, tail) {
      var numHidden = 0,
          childNodes = this._childEls,
          childNode,
          i;
      
      if (!childNodes.length)
        return;
      
      if (head) {
        while (head--) {
          childNode = childNodes[head];
          if (!childNode.dataset.hidden) {
            numHidden++;
            childNode.dataset.hidden = true;
          }
          
          childNode.style.visibility = 'hidden';
        }
        
        this._hiddenElementsAtHead += numHidden;
      }
       
      if (tail) {
        var lastElIdx = childNodes.length - 1,
            idx;
        
        while (tail-- && (idx = lastElIdx - tail)) {
          childNode = childNodes[idx];
          if (!childNode.dataset.hidden) {
            numHidden++;
            chidlNode.dataset.hidden = true;
          }
          
          childNode.style.visibility = 'hidden';
          numHidden++;
        }
        
        this._hiddenElementsAtTail += numHidden;
      }
    },
    
    _showAndHideElements: function() {
      var invisibleLayer = this._invisibleLayerThickness;
      if (invisibleLayer) {
        var viewport = this.getViewport(),
            slidingWindow = this.getSlidingWindow(), // should be relative to this view, i.e. head==0 means we're at the top/left of the page
            slidingWindowDim = slidingWindow.tail - slidingWindow.head,
            headDiff = viewport.head - slidingWindow.head,
            tailDiff = slidingWindow.tail - viewport.tail,
            scrollingTowardsHead = this.pageView.getLastScrollDirection() == 'head',
            elSize = this.getAverageElementSize(),
            head,
            tail;
        
        this._showHiddenElements();
        if (scrollingTowardsHead) {
          tail = tailDiff - invisibleLayer * elSize;
          tail = tail > 0 ? Math.min(invisibleLayer, tail / elSize | 0, this._childEls.length / 2 | 0) : 0;
        }
        else {
          head = headDiff - invisibleLayer * elSize;
          head = head > 0 ? Math.min(invisibleLayer, head / elSize | 0, this._childEls.length / 2 | 0) : 0;
        }
      
        if (head || tail)
          this._hideElements(head, tail);
      }
    },
    
    _showHiddenElements: function() {
      var numUnhidden = 0,
          childNodes = this._childEls,
          childNode;
      
      if (this.pageView.getLastScrollDirection() == 'head') {
        for (var i = 0; i < childNodes.length; i++) {
          childNode = childNodes[i];
          if (!childNode.dataset.hidden)
            break;
          
          childNode.style.removeProperty('visibility');
          delete childNode.dataset.hidden;
          numUnhidden++;
        }
        
        this._hiddenElementsAtHead -= numUnhidden;
      }
      else {
        var i = childNodes.length;
        while (i--) {
          childNode = childNodes[i];
//          if (page.style.visibility != 'hidden') // we've reached the visible part
          if (!childNode.dataset.hidden)
            break;
          
          childNode.style.removeProperty('visibility');
          delete childNode.dataset.hidden;
          numUnhidden++;
        }
        
        this._hiddenElementsAtTail -= numUnhidden;
      }
    },
    
//    /**
//     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
//     */
//    _adjustSlidingWindow: function() { // debounce this
////      var viewport = this.getHeadAndTail(this._visibleArea),
//      clearTimeout(this._slidingWindowTimeout);
//      if (!this.isActive())
//        return G.getRejectedPromise();
//      
//      var self = this,
//          n,
//          maxEls,
//          minEls,
//          viewport = this.getViewport(),
//          viewportDim,
//          slidingWindow, // should be relative to this view, i.e. head==0 means we're at the top/left of the page
//          slidingWindowDim,
//          headDiff,
//          tailDiff,
//          invisibleLayer = this._invisibleLayerThickness,
//          elSize = this.getAverageElementSize(),
//          scrollingTowardsHead = this.pageView.getLastScrollDirection() == 'head',
//          canAppend = !this._outOfData || this._displayedCollectionRange.to != this.collection.length;
//
//      if (!viewport) {// || !this._initializedDummies) {
//        this._initSlidingWindowTimer = setTimeout(this.adjustSlidingWindow, 50);
//        return false;
//      }
//
//      slidingWindow = this.getSlidingWindow(); // should be relative to this view, i.e. head==0 means we're at the top/left of the page      
//      slidingWindowDim = slidingWindow.tail - slidingWindow.head;
//      maxEls = this.getMaxElements();
//      minEls = this.getMinElements();
//      
//      if (viewport.tail < slidingWindow.head) { // viewport is completely above sliding window
//        this._shrinkSlidingWindow(0, this._childEls.length);
//        var idx = this._findClosestOffset(viewport.tail);
//        this._displayedCollectionRange.from = this._displayedCollectionRange.to = idx;
//        return this.addElements(Math.min(maxEls, this._displayedCollectionRange.to), true).done(this._queueSlidingWindowCheck);
//      }
//      else if (viewport.head > slidingWindow.tail) { // viewport is completely below sliding window
//        this._shrinkSlidingWindow(this._childEls.length);
//        var idx = this._findClosestOffset(viewport.head);
//        this._displayedCollectionRange.from = this._displayedCollectionRange.to = idx;
//        return this.addElements(maxEls).done(this._queueSlidingWindowCheck);
//      }
//
//      n = this.getElementsPerViewport();
//      headDiff = viewport.head - slidingWindow.head;
//      tailDiff = slidingWindow.tail - viewport.tail;
//      
////      if (scrollingTowardsHead)
////        headDiff -= pageDim * Math.min(this._minElementsInSlidingWindow / 4 | 0, 2); //this._minSlidingWindowDimension * 0.25;
////      else 
////        tailDiff -= pageDim * Math.min(this._minElementsInSlidingWindow / 4 | 0, 2); //this._slidingWindowOutsideBuffer / 2; //this._minSlidingWindowDimension * 0.25;
//      var favor = this._minSlidingWindowDimension * 0.25;
//      if (scrollingTowardsHead) {
//        headDiff -= favor;
//        tailDiff += favor;
//      }
//      else { 
//        headDiff += favor;
//        tailDiff -= favor;
//      }
//      
//      if (canAppend && slidingWindowDim < this._minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
//        if (this._scrollable)
//          n = Math.ceil((this._minSlidingWindowDimension - slidingWindowDim) / elSize);
//        
//        n = Math.min(n, maxEls);
//        return this.addElements(n, scrollingTowardsHead).done(this._queueSlidingWindowCheck); // n==1. Always grow by one page at a time (so the user doesn't have to wait to see the first few pages)
//      }
//      else if (slidingWindowDim > this._maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
//        var headDiff = viewport.head - slidingWindow.head,
//            tailDiff = slidingWindow.tail - viewport.tail,
////            extraSpace = headDiff + tailDiff - 2 * this._slidingWindowOutsideBuffer;
////            extraHeadSpace = slidingWindowDim - (this._maxSlidingWindowDimension + this._minSlidingWindowDimension) / 2;
//            extraHeadSpace = scrollingTowardsHead ? headDiff - this._slidingWindowInsideBuffer : headDiff - this._slidingWindowOutsideBuffer,
//            extraTailSpace = scrollingTowardsHead ? headDiff - this._slidingWindowOutsideBuffer : headDiff - this._slidingWindowInsideBuffer,
//            extraSpace;
//        
//        extraHeadSpace = Math.max(extraHeadSpace, 0);
//        extraTailSpace = Math.max(extraTailSpace, 0);
//        extraSpace = extraHeadSpace + extraTailSpace;
////        var headTail = eatHeadTail(extraSpace, headDiff, tailDiff, elSize, this._childEls.length, !scrollingTowardsHead);
//        var headTail = eatHeadTail(extraSpace, extraHeadSpace, extraTailSpace, elSize, this._childEls.length, !scrollingTowardsHead);
//        headTail.head = Math.min(headTail.head, maxEls);
//        headTail.tail = Math.min(headTail.tail, maxEls);
//        this._shrinkSlidingWindow(headTail.head, headTail.tail);
//        this._queueSlidingWindowCheck(); // n==1. Always grow by one page at a time (so the user doesn't have to wait to see the first few pages)
//        return G.getResolvedPromise();
//      }
//      else if (canAppend && tailDiff < this._slidingWindowInsideBuffer) {
//        n = Math.ceil((this._slidingWindowInsideBuffer - tailDiff) / elSize);
//        n = Math.min(n, maxEls);
//        if (tailDiff < this._slidingWindowOutsideBuffer)
//          return this.addElements(n).done(this._queueSlidingWindowCheck);
////          return this.page(n).done(this._queueSlidingWindowCheck);
//        else if (!this._outOfData && this.collection.length - this._displayedCollectionRange.to < this._elementsPerViewport * 2)
//          return this.fetchResources().done(this._queueSlidingWindowCheck);
//        else
//          return G.getResolvedPromise();
//      }
//      else if (this._displayedCollectionRange.from > 0 && headDiff < this._slidingWindowOutsideBuffer) {
//        n = Math.ceil((this._slidingWindowInsideBuffer - headDiff) / elSize);
//        n = Math.max(this._displayedCollectionRange.from, Math.min(n, maxEls));
//        return this.addElements(n, true).done(this._queueSlidingWindowCheck);
//      }
//      else
//        this._showAndHideElements();
//      
//      return false;
//    },

    /**
     * determine if viewport is too close to one of the sliding window boundaries, in which case slide the sliding window, and grow it if it's too cramped
     */
    _adjustSlidingWindow: function() { // debounce this
//      var viewport = this.getHeadAndTail(this._visibleArea),
      clearTimeout(this._slidingWindowTimeout);
      if (!this.isActive())
        return G.getRejectedPromise();
      
      var self = this,
          n = Math.max(this.getElementsPerViewport() / 2 | 0, 3),
          maxEls = this.getMaxElements(),
          minEls = this.getMinElements(),
          viewport = this.getViewport(),
          slidingWindow, // should be relative to this view, i.e. head==0 means we're at the top/left of the page
          slidingWindowDim,
          headDiff,
          tailDiff,
          invisibleLayer = this._invisibleLayerThickness,
          elSize = this.getAverageElementSize(),
          scrollingTowardsHead = this.pageView.getLastScrollDirection() == 'head',
          favor = this._minSlidingWindowDimension * 0.25,
          canPrepend = this._displayedCollectionRange.from != 0,
          canAppend = !this._outOfData || this._displayedCollectionRange.to != this.collection.length;

      if (!viewport) {// || !this._initializedDummies) {
        this._initSlidingWindowTimer = setTimeout(this.adjustSlidingWindow, 50);
        return false;
      }
      
      slidingWindow = this.getSlidingWindow(); // should be relative to this view, i.e. head==0 means we're at the top/left of the page      
      slidingWindowDim = slidingWindow.tail - slidingWindow.head;
      
      headDiff = viewport.head - slidingWindow.head;
      tailDiff = slidingWindow.tail - viewport.tail;

      if (viewport.head == 0 && viewport.tail < slidingWindow.head) {
        this._shrinkSlidingWindow(0, this._childEls.length);
        this._displayedCollectionRange.from = this._displayedCollectionRange.to = 0;
        return this.addElements(this.getElementsPerViewport()).done(this._queueSlidingWindowCheck);
      }
      
      // grow / shrink window
      if (slidingWindowDim < this._minSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        if (scrollingTowardsHead && canPrepend || !scrollingTowardsHead && canAppend) {
          return this.addElements(n, scrollingTowardsHead).done(this._queueSlidingWindowCheck); // n==1. Always grow by one page at a time (so the user doesn't have to wait to see the first few pages)
        }
      }
      else if (slidingWindowDim > this._maxSlidingWindowDimension) { // should this be measured in pages or in pixels or viewports?
        var headShrink = 0,
            tailShrink = 0;
        
        if (headDiff > tailDiff)
          headShrink = n;
        else
          tailShrink = n;
        
        this._shrinkSlidingWindow(headShrink, tailShrink);
        this._queueSlidingWindowCheck();
        return G.getResolvedPromise();
      }
      
      // grow the window in the direction where it has the least padding, if necessary
      if (canAppend && tailDiff < this._slidingWindowInsideBuffer) {
        if (tailDiff < this._slidingWindowOutsideBuffer)
          return this.addElements(n).done(this._queueSlidingWindowCheck);
        else if (!this._outOfData && this.collection.length - this._displayedCollectionRange.to < this._elementsPerViewport * 2)
          return this.fetchResources().done(this._queueSlidingWindowCheck);
        else
          return G.getResolvedPromise();
      }
      else if (this._displayedCollectionRange.from > 0 && headDiff < this._slidingWindowOutsideBuffer) {
        return this.addElements(n, true).done(this._queueSlidingWindowCheck);
      }
      else
        this._showAndHideElements();
      
      return false;
    },
    
//    _findClosestOffset: function(_offset) {
//      // TODO: use binary search
//      var minIdx = 0,
//          diff,
//          minDiff = Infinity,
//          offset,
//          i = this._offsets.length;
//      
//      while (i--) {
//        offset = this._offsets[i];
//        if ((diff = Math.abs(offset - _offset)) < minDiff) {
//          minDiff = diff;
//          minIdx = i;
//        }
//      }
//      
//      return minIdx;
//    },
    
    /** 
    * shorten the dummy div below this page by this page's height/width (if there's a dummy div to shorten)
    * @param force - will add as much as it can, including a half page
    * @return a promise
    */
    addElements: function(elementsToAdd, atTheHead, force) {
      var self = this,
          col = this.collection,
          displayed = this._displayedCollectionRange,
          info = this._slidingWindowOpInfo,
          colRange = info.range,
          preRenderPromise;
      
      if (atTheHead) {
        colRange.to = Math.max(displayed.from, elementsToAdd); // in case we're currently displaying elements 5-7 and want to display the first 30
        colRange.from = Math.max(colRange.to - elementsToAdd, 0);
      }
      else {
        colRange.from = displayed.to;
        colRange.to = colRange.from + elementsToAdd;
      }

      if (colRange.to > col.length) {
        if (force) {
          // settle for loading an incomplete page
          colRange.to = col.length;
          elementsToAdd = colRange.to - colRange.from; 
        }
        else {
          if (this._outOfData)
            return G.getRejectedPromise();
          
          var numToFetch = Math.max(colRange.to - col.length, this.getElementsPerViewport());
          return this.fetchResources(numToFetch).then(this.addElements.bind(this, elementsToAdd, atTheHead), this.addElements.bind(this, elementsToAdd, atTheHead, true));
        }
      }
      
      if (colRange.from >= colRange.to)
        return G.getRejectedPromise();
            
      preRenderPromise = this.preRender(info);
      if (_.isPromise(preRenderPromise))
        return preRenderPromise.then(this._addElements.bind(this, elementsToAdd, atTheHead, info));
      else
        return this._addElements(elementsToAdd, atTheHead, info);
    },

    _addElements: function(elementsToAdd, atTheHead, info) {
      this.log("PAGER", "ADDING", elementsToAdd, "ELEMENTS", atTheHead ? "AT THE HEAD" : "");
      var self = this,
          childTagName = this._preinitializedItem.prototype.tagName || 'div',
          displayed = this._displayedCollectionRange,
          colRange = info.range,
          col = this.collection,
          added = info[atTheHead ? 'prepended' : 'appended'],
          stop = false,
          dfd = $.Deferred(),
          promise = dfd.promise(); 
      
      label(promise);
      promise.done(function() {
        self._recalcPaging();
        self.getNewSize();
      });
      
//      function renderOneListItem(resNum) {
//        var res = col.models[resNum],
//            liView = this.renderItem(res, atTheHead);
//
//        if (liView !== false) {
//          self.listenTo(liView.resource, 'change', self.onResourceChanged);
//          self.listenTo(liView.resource, 'saved', self.onResourceChanged);
//          added.push(liView);
//        }
//      }
//      
//      for (var i = colRange.from; i < colRange.to; i++) {
//        Q.write(renderOneListItem, this, [i]);
//      }

      Q.write(function() {        
        for (var i = colRange.from; i < colRange.to; i++) {
          var res = col.models[i],
              liView = this.renderItem(res, atTheHead);
  
          if (liView !== false) {
            this.listenTo(liView.resource, 'change', this.onResourceChanged);
            this.listenTo(liView.resource, 'saved', this.onResourceChanged);
            added.push(liView);
          }
        }
      }, this);
      
      if (atTheHead)
        displayed.from = colRange.from;
      else
        displayed.to = colRange.to;

      if (displayed.from > displayed.to)
        displayed.from = displayed.to;

      Q.defer(1, 'read', function getDummyDim() {
        if (!self._calculatedElementSize && self._childEls.length)
          self.getAverageElementSize();
        
        if (!added.length) {
          dfd.resolve();
          return;
        }
        
        Q.write(function insertPage() {
//          self.log("PAGER", "ADDING PAGE, FRAME", window.fastdom.frameNum);
          var el = self.el,
              childEls = self._childEls,
              addedEls = added.map(function(c) { return c.el }),
              i = added.length,
              childView;
          
          if (atTheHead)
            Array.prepend(childEls, addedEls);
          else
            childEls.push.apply(childEls, addedEls);
          
          while (i--) {
            childView = added[i];
            childView.postRender && childView.postRender();
            if (!childView.el.parentNode)
              el.appendChild(childView.el); // we don't care about its position in the list, as it's absolutely positioned 
          }
           
          self._showAndHideElements();
          var postRenderResult = self.postRender(info);
          if (_.isPromise(postRenderResult))
            postRenderResult.always(dfd.resolve);
          else
            dfd.resolve();
        });
      });

      return promise;
    },
    
    getNewSize: function() {
//      this.trigger('invalidateSize');
      this.pageView.trigger('invalidateSize');
    },

    getSlidingWindowDimension: function() {
      var sw = this.getSlidingWindow();
      return sw.tail - sw.head;
    },
    
//    /**
//     * @return offsets on all sides of the sliding window
//     */
//    getSlidingWindow: function() {
//      if (_.size(this._cachedSlidingWindow)) // we don't create a new object when we invalidate, we just wipe the properties on it
//        return this._cachedSlidingWindow;
//      
//      if (!this.rendered)
//        return {head: 0, tail: 0};
//      
//      var head = this.dummies.headPosition;
//      if (typeof head !== 'number')
//        head = this.dummies.headPosition = this.getHeadPosition(this.dummies.head);
//      
//      return (this._cachedSlidingWindow = {
//        head: head + this.dummies.headDimension,
//        tail: this.getHeadPosition(this.dummies.tail)
//      });
//    },

//    _invalidateCachedSlidingWindow: function() {
//      this._cachedSlidingWindow.invalid = true;
//      this._recalcDimensions();
//    },
    
    getSlidingWindow: function() {
      return this._slidingWindowRange;
    },
    
    _recalcPaging: function() {
      this.calcContainerArea();
      this.calcSlidingWindow();
      this.calcAverageElementSize();
      this.calcElementsPerViewport();
      this.calcMinElements();
      this.calcMaxElements();
//      numElsDesired = Math.max(this.getMinElements(), numEls);
      this.calcMinSlidingWindowDimension(); // px, should depend on size of visible area of the list, speed of device, RAM
      this.calcMaxSlidingWindowDimension(); // px, should depend on size of visible area of the list, speed of device, RAM
      var slidingWindowDim = Math.max(this.getSlidingWindowDimension(), (this._maxSlidingWindowDimension + this._minSlidingWindowDimension) / 2);
      this._slidingWindowInsideBuffer = slidingWindowDim / 2; // how far away the viewport is from the closest border of the sliding window before we start to fetch more resources
      this._slidingWindowOutsideBuffer = Math.max(slidingWindowDim / 5, this._slidingWindowInsideBuffer / 2); // how far away the viewport is from the closest border of the sliding window before we need to adjust the window
    },
    
    /**
     * shrinks the sliding window by "head" pages at the head and "tail" pages at the tal
     * @return a promise
     */
    _shrinkSlidingWindow: function(head, tail) {
      this.log('PAGER', 'SHRINKING SLIDING WINDOW');
      head && this.removeElements(head, true);
      tail && this.removeElements(tail);
      this.getNewSize();
    },

    /**
     * Removes "pages" from the DOM and replaces the lost space by creating/padding a dummy div with the height/width of the removed section
     * The reason we keep dummy divs on both sides of the sliding window and not just at the top is to preserve the integrity of the scroll bar, which would otherwise revert back to 0 if you scrolled back up to the top of the page
     */
    removeElements: function(numToRemove, fromTheHead) {
      this.log("PAGER", "REMOVING", numToRemove, "ELEMENTS FROM THE", fromTheHead ? "HEAD" : "TAIL");
      var childNodes = this._childEls,
          info = this._slidingWindowOpInfo,
          displayed = this._displayedCollectionRange,
          removedViews = [],
          removeFrom,
          removeTo;

      if (fromTheHead) {
        removeFrom = 0;
        removeTo = Math.min(numToRemove, childNodes.length);
      }
      else {
        removeFrom = Math.max(childNodes.length - numToRemove, 0);
        removeTo = childNodes.length;
      }
      
      for (var i = removeFrom; i < removeTo; i++) {
        var childEl = childNodes[i],
            childView = this.children[childEl.dataset.viewid];

        removedViews.push(childView);
      }

      if (fromTheHead)
        Array.removeFromTo(this._childEls, 0, numToRemove);
      else
        this._childEls.length -= numToRemove;
        
      this.doRemove(removedViews);
      this._recalcPaging();

      if (fromTheHead)
        displayed.from += removedViews.length;
      else
        displayed.to -= removedViews.length;
      
      if (displayed.from > displayed.to)
        displayed.from = displayed.to;
      
      this._showAndHideElements();
      return G.getResolvedPromise();
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
////          setTimeout(fetchResources)
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

    doRemove: function(removedViews) {
      var i = removedViews.length,
          numLeft = this._childEls.length,
          numMax = this.getMaxElements(),
          numToRecycle = numMax * 2 - numLeft,
          view;
      
      while (i--) {
        view = removedViews[i];
        this.stopListening(view.resource);
        view.undelegateAllEvents();
      }

      if (numToRecycle == removedViews.length || numToRecycle / removedViews.length >= 0.9)
        this.recycleItemViews(removedViews);
      else if (numToRecycle > 0)
        this.recycleItemViews(removedViews.slice(0, numToRecycle));
      
      this.masonry.removedBricks(getBricks(removedViews));
    },
    
    fetchResources: function(numResourcesToFetch) {
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
          $limit: numResourcesToFetch || this._elementsPerViewport
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

    getItemViewClass: function() {
      return this._itemClass;
    },
    
    preinitializeItem: function(res) {
      var vocModel = res.vocModel,
          params = {
            parentView: this,
            vocModel: vocModel
          },
          preinitializer = this.getItemViewClass(),
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
      var options = {
            delegateEvents: false,
            resource: res
          },
          liView = this.getCachedItemView(),
          viewName,
          preinitializedItem;
      
      if (this.isMultiValueChooser) {
        options.checked = _.contains(this.mvVals, res.get('davDisplayName'));
      }
      else if (!this.isEdit) {
        options.swatch = res.get('swatch') || this._defaultSwatch;
      }
      
      if (liView) {
//        console.log("RECYCLING LIST ITEM");
        liView.reset().initialize(options);
      }
      else {
//        console.log("CREATING NEW LIST ITEM, TOTAL CHILD VIEWS:", _.size(this.children));
        viewName = 'listItem' + G.nextId();
        preinitializedItem = this._preinitializedItem;
        liView = new preinitializedItem(options);
        this.addChild(liView, prepend);      
      }
      
      liView.render({
        unlazifyImages: !this._scrollable,
        style: {
          opacity: 0
        }
      });
      
      liView.el.dataset.index = liView.resource.collection.indexOf(liView.resource);
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
    },
    
    postRender: function(info) {
      if (!this.masonry) {
        this.masonry = new Mason(this._masonryOptions, this.el, this.finish);
        return;
      }
      
      var prepended = info.prepended.length && info.prepended.slice(),// need this while using imagesLoaded (async)
          appended = info.appended.length && info.appended.slice(),   // need this while using imagesLoaded (async)
          hasUpdated = !!_.size(info.updated),
          dfd = $.Deferred();
      
      if (hasUpdated || prepended || appended) {
        Q.read(function() { // because appended/prepended read brick offsetWidth/offsetHeight
          if (hasUpdated)
            this.masonry.reload(dfd.resolve);
          else {
//            var needsReset = this._offsets.length && (appended && appended.length == this._childEls.length  || 
//                                                      prepended && prepended.length == this._childEls.length);
//
//            if (needsReset) {
//              debugger;
//              this.masonry.setOffset(this._offsets[appended ? this._displayedCollectionRange.from : this._displayedCollectionRange.to]);
//            }
              
            if (appended) {
              var bricks = getBricks(appended);
  //            console.log("APPENDED", appended.length, "PAGES, id:", this._slidingWindowOpInfo.id, _.pluck(appended, 'id').join(', '));
              this.masonry.appended(bricks, dfd.resolve, true);
            }
            else if (prepended) {
              var bricks = getBricks(prepended);
              bricks.reverse();
  //            console.log("PREPENDED", prepended.length, "PAGES, id:", this._slidingWindowOpInfo.id, _.pluck(appended, 'id').join(', '));
              this.masonry.prepended(bricks, dfd.resolve, true);
            }
          }
          
          this.trigger('refreshed');
        }, this);
      }
      
      return dfd.promise();
//      this._slidingWindowOpInfo.removed = false;
    },
    
    getSlidingWindowArea: function() {
      var otherDim = this._containerDimensions[this._horizontal ? 'height' : 'width'];
      return this.getSlidingWindowDimension() * otherDim; 
    },
    
//    calcSlidingWindow: function() {
//      // override me
//      this._slidingWindowRange.head = this._headOffset;
//      this._slidingWindowRange.tail = this._tailOffset;
//    },    

    calcElementsPerViewportMasonry: function() {
      var num;
      if (this._childEls.length) {
        this._calculatedElementsPerPage = true;
        var containersFitInWindow = this.getSlidingWindowDimension() / this.getContainerDimension(),
            numEls = this._childEls.length;

        num = Math.ceil(numEls / containersFitInWindow);
      }
      else
        num = Math.min(this.getContainerArea() / (this._averageElementSize * this._averageElementSize) | 0, 15);
      
      this._elementsPerViewport = num;
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
        sw.tail = this.getContainerDimension();
      }
    },

    hasMasonry: function() {
      return this.type == 'masonry';
    }
  }, {
    displayName: 'ResourceListView'
//      ,
//    _itemView: ResourceListItemView
  });
});
