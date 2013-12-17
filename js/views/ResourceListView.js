'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'domUtils',
  'events',
  'views/BasicView',
//  'views/mixins/Scrollable',
  'views/ResourceMasonryItemView',
  'views/ResourceListItemView',
  'collections/ResourceList',
  'lib/fastdom',
  'vocManager',
  'physicsBridge'
], function(G, U, DOM, Events, BasicView, /*Scrollable, */ ResourceMasonryItemView, ResourceListItemView, ResourceList, Q, Voc, Physics) {
  var $wnd = $(window),
      doc = document,
      transformProp = DOM.prefix('transform'),
      DO_GROUP = true;

  var MASONRY_FN = 'masonry', // in case we decide to switch to Packery or some other plugin
      ITEM_SELECTOR = '.masonry-brick';

  var defaultSlidingWindowOptions = {
    // <MASONRY INITIAL CONFIG>
    slidingWindow: true,
    horizontal: false,
    minBricks: 10,
    maxBricks: 10,
    bricksPerPage: 10,
    averageBrickScrollDim: 80,
    averageBrickNonScrollDim: 80,  
//    minPagesInSlidingWindow: 6,
//    maxPagesInSlidingWindow: 12,
    gutterWidth: 10
    // </ MASONRY INITIAL CONFIG>      
  };
  
  return BasicView.extend({
    // CONFIG
    _draggable: true,
    _invisibleLayerThickness: 0, // in pages, 1 == 1 page, 2 == 2 pages, etc. (3 == 3 pages fool!)
    displayMode: 'vanillaList', // other options: 'masonry'
    // END CONFIG
    
//    _brickMarginH: null,
//    _brickMarginV: null,
//    _headOffset: 0,
//    _tailOffset: 0,
    _offsetLeft: 0, // updated after append to DOM
    _offsetTop: 0,  // updated after append to DOM
    _childEls: null,
    _outOfData: false,
    _adjustmentQueued: false,
    _hiddenBricksAtHead: 0,
    _hiddenBricksAtTail: 0,
    _failedToRenderCount: 0,
    _scrollable: false, // is set to true when the content is bigger than the container
//    _lastRangeEventSeq: -Infinity,
//    _lastPrefetchEventSeq: -Infinity,
    className: 'scrollable',
    stashed: [],

    initialize: function(options) {
      _.bindAll(this, 'render', 'fetchResources', 'refresh', 'setMode', 'onResourceChanged', '_onPhysicsMessage');
      options = options || {};
      BasicView.prototype.initialize.call(this, options);
      this.displayMode = options.displayMode || 'vanillaList';
//      this._masonryOptions = _.defaults({
//        gutterWidth: GUTTER_WIDTH
//      }, defaultMasonryOptions);
      
      this.options = _.extend({}, defaultSlidingWindowOptions); // for now
      if (this.displayMode == 'masonry') {
        this._itemClass = ResourceMasonryItemView;
      }
      else {
        this._itemClass = ResourceListItemView;
        this.options.oneElementPerRow = this.options.stretchRow = true;
        this.options.gutterWidth = 0;
      }
      
      this.transformIdx = this.options.horizontal ? 12 : 13;
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
//      
//      this._dimensions = {};

      this._displayedRange = {
        from: 0,
        to: 0
      };

      this.itemViewCache = [];
      this._childEls = [];
      this._spareEls = [];
      this._viewport = {
        head: 0,
        tail: G.viewport[this.options.horizontal ? 'width' : 'height']
      };
      
//      Physics.here.on('translate.' + this.axis.toLowerCase(), this.getBodyId(), this.onScroll);
      return this;
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
    
//    myEvents: {
//      'active': '_onActive'
//    },
//    
//    _onActive: function() {
//      return BasicView.prototype._onActive.apply(this, arguments);
//    },
    
//    windowEvents: {
//      'viewportwidthchanged': '_onWidthChanged'
//    },
    
    _onPhysicsMessage: function(event) {
      switch (event.type) {
        case 'range':
//          this._lastRangeEventSeq = event.eventSeq;
          return this._rangeChanged(event);
//        case 'prefetch':
//          return this._prefetch(event);
        default:
          throw "not implemented yet";
      }
    },
    
    _rangeChanged: function(data) {
      var currentRange = this._displayedRange,
//          expectedCurrentRange = data.currentRange,
          range = data.range,
          info = data.info;
      
//      if (!_.isEqual(currentRange, expectedCurrentRange))
//        debugger; // for testing, should never happen
      
      if (range.from == currentRange.from && range.to == currentRange.to) {
        // should never happen
        this.mason['continue']();
        return;
      }
      
      console.debug("CURRENT RANGE", currentRange, "NEW RANGE", range);
      _.extend(this.options, info);
      /////////////////////////////////////////////////////////////////////////////////////////////// <> = current range, || = new range
      ///////////////////////////////////////////////////////////////////////////////////////////////               <----------->
      if (range.to <= currentRange.from || range.from >= currentRange.to) {   
        // remove all                                                     /////////////////////////////  |-------|         OR         |-------|
        this._removeBricks(currentRange.from, currentRange.to);
        this._addBricks(range.from, range.to);
      }
      /////////////////////////////////////////////////////////////////////////////////////////////////  |---------------|
      else if (range.from <= currentRange.from && range.to <= currentRange.to) {
        this._removeBricks(range.to, currentRange.to);
        this._addBricks(range.from, currentRange.from);
      }
      /////////////////////////////////////////////////////////////////////////////////////////////////       |-----------------------|  //  we should really only add bricks to one side at a time
      else if (range.from < currentRange.from && range.to > currentRange.to) {
        if (currentRange.from - range.from > range.to - currentRange.to)
          this._addBricks(range.from, currentRange.from);
        else
          this._addBricks(currentRange.to, range.to);
      }
      /////////////////////////////////////////////////////////////////////////////////////////////////                |----|            // impossible (?) as we only get called if bricks need to be added
      else if (range.from > currentRange.from && range.to < currentRange.to) {
        this._removeBricks(currentRange.from, range.from);
        this._removeBricks(range.to, currentRange.to);
        this.mason['continue'](); // otherwise it'll wait forever
      }
      /////////////////////////////////////////////////////////////////////////////////////////////////                  |---------------|
      else if (range.from >= currentRange.from && range.to >= currentRange.to) {
        this._removeBricks(currentRange.from, range.from);
        this._addBricks(currentRange.to, range.to);
      }
      else
        debugger; /////////////////////////////////////////////////////////////////////////////////////   THIS SHOULD NEVER HAPPEN ///////////////////////////////////////////////////////////////
    },

//    _prefetch: function(data) {
//      debugger;
//      this.fetchResources(data.num);
//      this.mason['continue']();
//    },
    
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
              return G.getRejectedPromise();
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
      if (this._outOfData) {
        this._outOfData = false;
        if (this.mason) {
          this.mason.setLimit(this.collection.length); // - this._failedToRenderCount);
          this.mason['continue']();
        }
      }
//      this.adjustSlidingWindow();
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
      debugger;
//      this._outOfData = false;
//      this._displayedRange.from = this._displayedRange.to = 0;
//      this.el.$empty();
//      this.adjustSlidingWindow();
    },

    setHorizontal: function() {
      debugger;
      this.options.horizontal = true;
    },
    
    setVertical: function() {
      debugger;
      this.options.horizontal = true;
    },
    
    render: function() {
      var self = this,
          viewport = G.viewport,
          numEls;

      if (!this.mason)
        this.addToWorld(this.options);
            
//      numEls = this.getElementsPerViewport() * this._maxViewportsInSlidingWindow;
//      this.el.innerHTML = new Array(numEls).join("<div></div>");
//      this.el.$data(viewport); // set width/height to viewport's width/height
//      this._spareEls.push.apply(this._spareEls, this.el.childNodes);
      if (this.rendered)
        return this.refresh();
            
      this.imageProperty = U.getImageProperty(this.collection);
    },
  
    /**
     * re-render the elements in the sliding window
     */
    refresh: function() {
      debugger;
    },
        
    _hideBricks: function(head, tail) {
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
        
        this._hiddenBricksAtHead += numHidden;
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
        
        this._hiddenBricksAtTail += numHidden;
      }
    },
    
    _showAndHideBricks: function() {
      var invisibleLayer = this._invisibleLayerThickness;
      if (invisibleLayer) {
        var viewport = this.getViewport(),
            slidingWindow = this.getSlidingWindow(), // should be relative to this view, i.e. head==0 means we're at the top/left of the page
            slidingWindowDim = slidingWindow.tail - slidingWindow.head,
            headDiff = viewport.head - slidingWindow.head,
            tailDiff = slidingWindow.tail - viewport.tail,
            scrollingTowardsHead = this.getLastScrollDirection() == 'head',
            elSize = this.getAverageElementSize(),
            head,
            tail;
        
        this._showHiddenBricks();
        if (scrollingTowardsHead) {
          tail = tailDiff - invisibleLayer * elSize;
          tail = tail > 0 ? Math.min(invisibleLayer, tail / elSize | 0, this._childEls.length / 2 | 0) : 0;
        }
        else {
          head = headDiff - invisibleLayer * elSize;
          head = head > 0 ? Math.min(invisibleLayer, head / elSize | 0, this._childEls.length / 2 | 0) : 0;
        }
      
        if (head || tail)
          this._hideBricks(head, tail);
      }
    },
    
    _showHiddenBricks: function() {
      var numUnhidden = 0,
          childNodes = this._childEls,
          childNode;
      
      if (this.getLastScrollDirection() == 'head') {
        for (var i = 0; i < childNodes.length; i++) {
          childNode = childNodes[i];
          if (!childNode.dataset.hidden)
            break;
          
          childNode.style.removeProperty('visibility');
          delete childNode.dataset.hidden;
          numUnhidden++;
        }
        
        this._hiddenBricksAtHead -= numUnhidden;
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
        
        this._hiddenBricksAtTail -= numUnhidden;
      }
    },
        
    /** 
    * shorten the dummy div below this page by this page's height/width (if there's a dummy div to shorten)
    * @param force - will add as much as it can, including a half page
    * @return a promise
    */
    _addBricks: function(from, to, force) {
      if (from >= to) {
        this.mason['continue']();
        return;
      }
      
      var self = this,
          col = this.collection,
          displayed = this._displayedRange,
          preRenderPromise;
      
      if (to > col.length) {
        if (force) {
          // settle for loading an incomplete page
          to = col.length;
          if (to <= from) {
            // we're out of candy, no need to continue
//            this.mason['continue']();
            return;
          }
        }
        else {
//          if (this._outOfData) {
//            this.mason.setLimit(this.collection.length);
//            return;
//          }
          
          var numToFetch = to - col.length;
          return this.fetchResources(numToFetch).then(this._addBricks.bind(this, from, to, force), this._addBricks.bind(this, from, to, true));
        }
      }
                  
      preRenderPromise = this.preRender(from, to);
      if (_.isPromise(preRenderPromise))
        return preRenderPromise.then(this._doAddBricks.bind(this, from, to));
      else
        return this._doAddBricks(from, to);
    },

    _doAddBricks: function(from, to) {
      var self = this,
          el = this.el,
          childEls = this._childEls,
          childTagName = this._preinitializedItem.prototype.tagName || 'div',
          displayed = this._displayedRange,
          atTheHead = from < displayed.from,
          col = this.collection,
          failed = [],
          added = [],
          addedEls,
          childView;
      
      this.log("PAGER", "ADDING", to - from, "BRICKS AT THE", atTheHead ? "HEAD" : "TAIL", "FOR A TOTAL OF", this._displayedRange.to - this._displayedRange.from + to - from);
//      promise.done(function() {
//        self._recalcPaging();
//      });
//      
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

      for (var i = from; i < to; i++) {
        var res = col.models[i],
            liView = this.renderItem(res, atTheHead);

        if (liView == false) {
          this._failedToRenderCount++;
          failed.push(res);
        }
        else {
          this.listenTo(liView.resource, 'change', this.onResourceChanged);
          this.listenTo(liView.resource, 'saved', this.onResourceChanged);
          added.push(liView);
        }
      }        
      
      if (failed.length) {
        this.collection.remove(failed);        
        to -= failed.length;
//        this.stashed.push.apply(this.stashed, added);
//        return this._addBricks(to, to + failed.length);
      }
      
      if (added.length) {      
//          self.log("PAGER", "ADDING PAGE, FRAME", window.fastdom.frameNum);
        addedEls = added.map(function(c) { return c.el });
        if (atTheHead)
          Array.prepend(childEls, addedEls);
        else
          childEls.push.apply(childEls, addedEls);
        
        added.forEach(function(childView) {
          if (childView.postRender)
            childView.postRender();
         
          childView.el.style.opacity = 0;
          if (!childView.el.parentNode) {
            // need to append right away, otherwise we can't figure out its size
            el.appendChild(childView.el); // we don't care about its position in the list, as it's absolutely positioned
          }
    
  //        DOM.queueRender(view.el, DOM.opaqueStyle);
  
          Physics.here.once('render', childView.getBodyId(), function(childEl) {
            childEl.style.opacity = 1;
          });
        });
        
        return this.postRender(from, to, added);
      }       
      else {
        if (this._outOfData)
          this.mason.setLimit(this.collection.length);
        else
          return this._addBricks(to, to + failed.length);
      }
    },
    
    /**
     * Removes "pages" from the DOM and replaces the lost space by creating/padding a dummy div with the height/width of the removed section
     * The reason we keep dummy divs on both sides of the sliding window and not just at the top is to preserve the integrity of the scroll bar, which would otherwise revert back to 0 if you scrolled back up to the top of the page
     */
    _removeBricks: function(from, to) {
      if (from == to)
        return;
      
      var numToRemove = to - from,
          fromTheHead = from == this._displayedRange.from,
          childNodes = this._childEls,
          displayed = this._displayedRange,
          removedViews = [];

      this.log("PAGER", "REMOVING", to - from, "BRICKS FROM THE", fromTheHead ? "HEAD" : "TAIL", "FOR A TOTAL OF", this._displayedRange.to - this._displayedRange.from - (to - from));
      for (var i = fromTheHead ? 0 : childNodes.length - numToRemove, 
               end = fromTheHead ? numToRemove : childNodes.length; i < end; i++) {
        var childEl = childNodes[i],
            childView = this.children[childEl.dataset.viewid];

        removedViews.push(childView);
      }

      this.doRemove(removedViews);
      if (fromTheHead) {
        Array.removeFromTo(this._childEls, 0, numToRemove);
        displayed.from += removedViews.length;
      }
      else {
        this._childEls.length -= numToRemove;
        displayed.to -= removedViews.length;
      }

      if (displayed.from > displayed.to) {
        debugger;
        displayed.from = displayed.to;
      }
    },

    onResourceChanged: function(res) { // attach/detach when sliding window moves
      var itemView = this.findChildByResource(res);
      if (itemView) {
        itemView.render(); // or maybe remove and reappend?
        
//        this.adjustSlidingWindow();
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
          numMax = this.options.maxBricks,
          numToRecycle = numMax * 2 - numLeft,
          ids = [],
//          dfd = $.Deferred(),
          view;
      
      while (i--) {
        view = removedViews[i];
        this.stopListening(view.resource);
        view.undelegateAllEvents();
        DOM.queueRender(view.el, DOM.transparentStyle);
        ids.push(view.getBodyId());
      }

      if (numToRecycle == removedViews.length || numToRecycle / removedViews.length >= 0.9)
        this.recycleItemViews(removedViews);
      else if (numToRecycle > 0)
        this.recycleItemViews(removedViews.slice(0, numToRecycle));
      
//      this.mason._removeBricks(removedViews.map(BasicView.prototype.getBodyId), function() {
//        debugger;
//        dfd.resolve();
//      });
//      
//      return dfd.promise();
      this.pageView._bodies = _.difference(this.pageView._bodies, ids); // TODO: unyuck the yuck
    },
    
    fetchResources: function(numResourcesToFetch) {
      if (this._isPaging)
        return this._pagingPromise;
      else if (this._outOfData)
        return G.getRejectedPromise();
      
      numResourcesToFetch = Math.max(numResourcesToFetch || this.options.bricksPerPage, 5);
      var self = this,
          col = this.collection,
          before = col.length,
          defer = $.Deferred(),
          nextPagePromise,
          nextPageUrl;
      
      nextPagePromise = col.getNextPage({
        params: {
          $offset: col.length + this._failedToRenderCount,
          $limit: numResourcesToFetch
        },
        success: function() {
          if (col.length > before)
            defer.resolve();
          else {
            if (!nextPageUrl || !col.isFetching(nextPageUrl)) // we've failed to fetch anything from the db, wait for the 2nd call to success/error after pinging the server
              defer.reject();
            else
              self.log("fetching more list items from the server...");
          }
        },
        error: function() {
          if (!nextPageUrl || !col.isFetching(nextPageUrl))
            defer.reject();
//          else
//            debugger;
        }
      });
      
      if (nextPagePromise)
        nextPageUrl = nextPagePromise._url;
      
      this._isPaging = true;
      
      this._pagingPromise = defer.promise().always(function() {
        self._isPaging = false;
        if (defer.state() == 'rejected') {
          self._outOfData = true;
        }        
      }); 
      
      this._pagingPromise._range = 'from: ' + before + ', to: ' + (before + numResourcesToFetch);
//      this.log("Fetching next page: " + this._pagingPromise._range);
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
          preinitializer = this.getItemViewClass();
          
//      while (preinitializer && !preinitializer.preinitialize) {
//        preinitializer = preinitializer.__super__.constructor;
//      }
        
      if (this.isEdit) {
        params.editCols = this.hashParams['$editCols']; 
        params.edit = true;
      }
      else if (this.isMultiValueChooser) {
        params.mv = true;
        params.tagName = 'div';
        if (G.isJQM()) {
          params.className = "ui-controlgroup-controls";
        }
        else {
          params.className = G.isTopcoat() ? "topcoat-list__item" : (G.isBootstrap() ? "list-group-item" : "");
        }
        params.mvProp = this.mvProp;
      }
      else {
        this._defaultSwatch = G.theme  &&  (G.theme.list  ||  G.theme.swatch);
      }
      
      return preinitializer.preinitialize(params);
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
        if (this._spareEls.length)
          options.el = this._spareEls.shift();
        
        if (this._itemTemplateElement) {
          if (!options.el)
            options.el = this._itemTemplateElement.cloneNode(true);
          else {
            var childNodes = this._itemTemplateElement.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
              options.el.appendChild(childNodes[i].cloneNode(true));
            }
          }
        }
        
        viewName = 'listItem' + G.nextId();
        preinitializedItem = this._preinitializedItem;
        liView = new preinitializedItem(options);
        this.addChild(liView, prepend);      
      }
      
      liView.render({
        unlazifyImages: !this._scrollable
//        ,
//        style: {
//          opacity: 0
//        }
      });
      
      if (!this._itemTemplateElement && this.displayMode == 'masonry') // remove this when we change ResourceListItemView to update DOM instead of replace it
        this._itemTemplateElement = liView.el;
        
//      liView.el.dataset.indexInCollection = liView.resource.collection.indexOf(liView.resource);
      return liView;
    },
    
    preRender: function(from, to) {
      if (this._prerendered)
        return;
      
      // override me
      var self = this;
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
    
    toBricks: function(views, options) {
      var bricks = [], 
          view, 
          id, 
          el, 
          width, 
          height;
      
      for (var i = 0, l = views.length; i < l; i++) {
        view = views[i];
        el = view.el;
        id = view.getBodyId();
        width = el.$outerWidth(true);
        height = el.$outerHeight(true);
        bricks.push({
          _id: id,
          fixed: !options.flexigroup,
          lock: {
            x: options.gutterWidth / 5
          },
          mass: 0.1,
          vertices: [
            {x: 0, y: height},
            {x: width, y: height},
            {x: width, y: 0},
            {x: 0, y: 0}
          ],
          restitution: 0.3
        });
      };
      
      return bricks;
    },

    postRender: function(from, to, added) {
//      if (this.stashed.length) {
//        Array.prepend(added, this.stashed);
//        this.stashed.length = 0;
//      }
      
      var atTheHead = from < this._displayedRange.from,
          bricks = this.toBricks(added, this.options),
          i = bricks.length,
          bodies = this.pageView._bodies,
          displayed = this._displayedRange,
          view,
          id;
      
      while (i--) {
        view = added[i];
        id = view.getBodyId();
        bodies.push(id);
        Physics.here.addBody(view.el, id);
      }

      if (displayed.to - displayed.from == 0) {
        displayed.from = from;
        displayed.to = to;
      }
      else {
        this._displayedRange.from = Math.min(this._displayedRange.from, from);
        this._displayedRange.to = Math.max(this._displayedRange.to, to);
      }
      
      if (this._outOfData && this.collection.length == to)
        this.mason.setLimit(this.collection.length); // - this._failedToRenderCount);
      
      this.addBricksToWorld(bricks, atTheHead); // mason
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
