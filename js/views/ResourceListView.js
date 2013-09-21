'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/ResourceListItemView',
  'views/PhotogridView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, BasicView, ResourceListItemView, PhotogridView, ResourceList, $m) {
  var $wnd = $(window);
  var RLV = BasicView.extend({
    displayPerPage: 10, // for client-side paging
    page: 0,
//    changedViews: [],
//    skipScrollEvent: false,
    prevScrollPos: 0,
    loadIndicatorTimerId: null, // show loading indicator with delay 0.5 sec!
    initialize: function (options) {
      _.bindAll(this, 'render', 'getNextPage', 'refresh', 'onScroll', /*'onAppend',*/ 'setMode', 'checkIfNeedMore'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.call(this, options);
      options = options || {};
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
    
    onadd: function(resources, options) {
      if (options && options.refresh) {
        debugger;
        options.resources = resources;
        this.refresh(options);
      }
    },
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw 'this view doesn\'t have a mode ' + mode;
      
      this.mode = mode;
    },
  
    events: {
      'scroll': 'onScroll'
    },
    
    getListItems: function() {
      return this.$('li');
    },

    renderItem: function(res) {
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
      
      this.addChild(liView);
      liView.render({force: true});
      return liView;
    },
    
    refresh: function(options) {
      options = options || {};
      if (options.partOfUpdate)
        return;
      
      var modified = options.resources;
      var isAdd = options.added;
//      var isUpdate = options.updated;
//      var isReset = options.reset;
      var orientationChange = options.orientation;
      
      G.log(this.TAG, 'refreshing ResourceListView');
      modified = modified ? (_.isArray(modified) ? modified : [modified]) : null;
      var modifiedUris = modified && _.map(modified, function(m) {
        return m.getUri();
      });
      
      var rl = this.filteredCollection;
      var resources = rl.models;
      var canceled = U.getCloneOf(this.vocModel, 'Cancellable.cancelled')[0];
      var hash = window.location.hash;      
      var lis = this.getListItems(); //isModification || isMasonry ? this.$('.nab') : this.isPhotogrid ? this.$('tr') : this.$('li');
      var curNum = lis.length;
      var num = Math.min(resources.length, (this.page + 1) * this.displayPerPage);

      var i = 0;
      var nextPage = false;
      var frag;
      if (isAdd || !modified && !orientationChange) {
        i = curNum;
        if (curNum == num) {
          this.postRender({});
          return this;
        }
        
        if (curNum > 0)
          nextPage = true;
      }

      if (!nextPage) {
        lis = lis.detach();
        frag = document.createDocumentFragment();
      }
      
//      var defaultUnchecked = params.$checked !== 'y';
        
//      var renderDfd = this.isPhotogrid ? $.Deferred() : null;
      var info = {
            isFirstPage: !nextPage,
            frag: frag,
            total: num,
            appended: []
          },
          updated = [];
      
      this.imageProperty = U.getImageProperty(this.collection);
      this.preRender(info);

      for (; i < num; i++) {
        var res = resources[i],        
            uri = res.getUri(),
            liView,
            el;
        
        if (canceled && res.get(canceled))
          continue;
        
        
        info.index = i;        
        info.updated = _.contains(modifiedUris, uri);
        if (i >= lis.length || info.updated)
          liView = this.renderItem(res, info);          
        if (liView) {
          el = liView.el;
          var detachedLi = lis[i],
              viewId = detachedLi && detachedLi.dataset.viewId,
              child = viewId && this.getChildViews()[viewId];
          
          if (child) {
            debugger;
            child.destroy();
          }
        }
        else
          el = lis[i];
        
        if (info.updated)
          updated.push(el);
        else
          info.appended.push(el);
        
        this.postRenderItem(el, info);
      };
      
      info.updated = updated;
      if (!nextPage)
        this.html(frag);
      
      this.postRender(info);
      return this;
    },

    preRender: function(info) {
      // override me
    },

    postRender: function(info) {
      if (this.rendered) {
        this.$el.trigger('create');
        if (!this.isMultiValueChooser && this.$el.hasClass('ui-listview'))
          this.$el.listview('refresh');
        
        this.trigger('refreshed');
      }
    },
    
    postRenderItem: function(el, info) {
      if (!info.isFirstPage) {
        this.$el.append(el);
      }
      else {
        info.frag.appendChild(el);
      }
    },
    
//    forceReloadMasonry: function() {
//      if (this.rendered)
//        this.$el.masonry('reload');
//    },
    
    getNextPage: function() {
      if (!this.rendered)
        return;
      
//      console.debug(printStackTrace());
      if (this._pagingPromise && this._pagingPromise.state() === 'pending')
        return this._pagingPromise;
      
      var self = this,
          rl = this.filteredCollection,
          before = rl.models.length,
          displayedBefore = this.getListItems().length,
          requested = (this.page + 2) * this.displayPerPage; // page starts at 0, 'requested' is the number of items that will be displayed after the next page is loaded 
            
//      if (this._requested == requested)
//        debugger;
//      
//      this._requested = requested;
//      
//      Events.stopListening(self, 'refreshed');
//      Events.listenTo(self, 'refreshed', function() {          
//        if (self.scrolledToNextPage())
//          return self.getNextPage();
//      });

      this._pagingPromise = $.Deferred(function(defer) {
        this._paging = true;
        if (!self.rendered || !before || requested <= displayedBefore)
          return defer.reject();
        
        self.page++;
        if (before >= requested) {
          self.refresh({
            resources: rl.models.slice(requested), 
            added: true
          });
          
          return defer.resolve();
        }
  
        rl.getNextPage({
          success: function(resp, status, xhr) {
            if (self.collection.models.length <= before)
              defer.reject();
            else
              defer.resolve();
          },
          error: defer.reject
        });
      }).promise();
      
      this._pagingPromise.done(function() {
        self.trigger('invalidateSize');
        self.pageView.trigger('invalidateSize');
        self.once('refreshed', self.checkIfNeedMore.bind(self, displayedBefore));
      }).always(function() {
        self._paging = false;
//        self.hideLoadingIndicator();
      });

      return this._pagingPromise;
    },
    
    checkIfNeedMore: function(displayedBefore) {
      if (!this.scrolledToNextPage()) // we've got our buffer back
        return;
      else if (this.getListItems().length > displayedBefore) // we loaded some, but we need more
        return this.getNextPage();
      else
        this.checkIfNeedMore(displayedBefore); // the items we loaded haven't been added to the DOM yet 
    },
        
    render: function(e) {
      if (!this.rendered) {
        this.numDisplayed = 0;
        var col = this.filteredCollection = this.collection.clone();
        this.listenTo(this.filteredCollection, 'endOfList', function() {
          this.pageView.trigger('endOfList');
        }.bind(this));
        
        this.listenTo(this.filteredCollection, 'reset', function() {
          this.pageView.trigger('newList');
        }.bind(this));
        
        _.each(['updated', 'added', 'reset'], function(event) {
          this.stopListening(col, event);
          this.listenTo(col, event, function(resources) {
            resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
            var options = {
              resources: resources
            };
            
            options[event] = true;
            this.refresh(options);
          }.bind(this));
        }.bind(this));
        
        this.setupSearchAndFilter();
//        var wasRendered = this.rendered;
//        this.rendered = true;
      }
      
//      this.rendered = true;
      this.refresh({added: true, force: true});
      
//      var collection = this.collection;
//      var filtered = this.filteredCollection;
//      var colModel = collection.vocModel;
//      if (!wasRendered)

      return this;
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
    },
    
    // endless page function
    onScroll: function(e) {
      if (!this.isActive())
        return;
      
      
//      var self = this;
      // order is important, because view.getNextPage() may return immediately if we have some cached rows
      // if scrollTop is near to zero then it is "initial" next page retriving not by a user
//      if ($wnd.scrollTop() > 20) {  
//        this.skipScrollEvent = true; 
////        this.loadIndicatorTimerId = setTimeout(function() { self.showLoadingIndicator(); }, 500);      
//      }

      if (this.scrolledToNextPage(e))
        this.getNextPage();      
    },
    
    scrolledToNextPage: function(e) {
//      var scrollTop = U.getScrollPosition(this.$el, e).scrollTop;
      var scrollTop = $wnd.scrollTop();
      try {
        if (this.prevScrollPos > scrollTop) return;
      } finally {
        this.prevScrollPos = scrollTop;
      }

//      if (this.prevScrollPos > $wnd.scrollTop()) {
//        this.prevScrollPos = $wnd.scrollTop();
//        return;
//      }
//      
//      this.prevScrollPos = $wnd.scrollTop();
      
      // get next page
      // 1) masonry: 2.5 screen height to bottom
      // 2) list view: 1 screen height to bottom
      var factor = this.hasMasonry() ? 3.5 : 2;         
      if ($m.activePage.height() > scrollTop + $wnd.height() * factor)
        return;
      
//      if (this.pageView.el.offsetHeight > scrollTop + window.innerHeight * factor)
//        return;
      
      return true;
    },
    
    resumeScrollEventProcessing: function () {
//      this.skipScrollEvent = false;
      this.hideLoadingIndicator();
    }
  }, {
    displayName: 'ResourceListView'
  });
  
  return RLV;
});
