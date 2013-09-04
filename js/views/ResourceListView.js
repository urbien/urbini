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
      _.bindAll(this, 'render', 'getNextPage', 'refresh', 'onScroll', /*'onAppend',*/ 'setMode'); // fixes loss of context for 'this' within methods
//      this.superInitialize(options);
      BasicView.prototype.initialize.call(this, options);
      options = options || {};
//      $wnd.on('scroll', this.onScroll);
//      Events.on('pageChange', this.onAppend);
//      this.$el.on('create', this.onAppend);
//      this.collection.on('reset', this.render, this);
//      this.collection.on('add', this.onadd, this);
//      this.collection.on('refresh', this.refresh);
//      this.collection.on('add', this.add, this);
//      this.options = _.pick(options, 'checked', 'props') || {};
      this.mode = options.mode || G.LISTMODES.DEFAULT;
      var type = this.modelType;
      this.makeTemplate('fileUpload', 'fileUploadTemplate', type);
      var commonTypes = G.commonTypes;
//      this.isPhotogrid = _.contains([commonTypes.Handler, commonTypes.FriendApp], type);
      this.isPhotogrid = this.type == 'photogrid'; //this.parentView.isPhotogrid;
      if (this.isPhotogrid)
        this.displayPerPage = 5;

//      // HACK
//      Events.on('pageChange', function(previousView, currentView) {
//        if (this.isActive())
//          this.alignBricks();
////          this.forceReloadMasonry();
//      }.bind(this));
//      // END HACK
      
      var vocModel = this.vocModel;
//      this.imageProperty = U.getImageProperty(this.collection);
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
//      this.isChooser = window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;
//      this.isMasonry = !this.isChooser  && !this.isPhotogrid &&  (_.any(['/Tournament', '/Theme', '/App', '/Coupon', '/Goal', '/Movie', '/ThirtyDayTrial', '/SolarBond'], function(end) {return type.endsWith(end)}) || U.isA(this.vocModel, "VideoResource")); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel);
//      this.isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));
      return this;
    },
    
//    onAppend: function() {
//      this.resumeScrollEventProcessing();
//    },
    
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
        liView = this.addChild(viewName, new ResourceListItemView(_.extend({editCols: this.hashParams['$editCols'], edit: true}, commonParams)));
      }
      else if (this.isMultiValueChooser) {
//        var params = hash ? U.getParamMap(hash) : {};
//        var mvProp = params.$multiValue;
        var isListed =  _.contains(this.mvVals, res.get('davDisplayName'));
  //      var isChecked = defaultUnchecked === isListed;
        liView = this.addChild('multiValue item' + G.nextId(), new ResourceListItemView({
          mv: true, 
          tagName: 'div', 
          className: "ui-controlgroup-controls", 
          mvProp: this.mvProp, 
          checked: isListed,
          resource: res,
          parentView: this
        }));
      }
      else {
        var swatch = res.get('swatch') || (G.theme  &&  (G.theme.list  ||  G.theme.swatch));
        if (this.imageProperty != null)
          liView = this.addChild(viewName, new ResourceListItemView(_.extend({ imageProperty: this.imageProperty, parentView: this, swatch: swatch}, commonParams)))
        else
          liView = this.addChild(viewName, new ResourceListItemView(_.extend({swatch: swatch}, commonParams)));
      }
      
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
//      var vocModel = this.vocModel;
//      var type = vocModel.type;
//      var isModification = this.isModification;
//      var meta = vocModel.properties;
      var canceled = U.getCloneOf(this.vocModel, 'Cancellable.cancelled')[0];
//      canceled = canceled.length ? canceled[0] : null;
      
//      var viewMode = vocModel.viewMode;
//      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
//      var isChooser = this.isChooser; //window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;  
//      var isMasonry = this.isMasonry; //this.isMasonry = !isChooser  && !this.isPhotogrid &&  (_.any(['/Tournament', '/Theme', '/App', '/Coupon', '/Goal', '/Movie', '/ThirtyDayTrial'], function(end) {return type.endsWith(end)}) || U.isA(this.vocModel, "VideoResource")); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
      
//      var isMasonry = !isList  &&  U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(vocModel, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(vocModel, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(vocModel, 'ImageResource.bigImage').length > 0);
//      if (!isMasonry  &&  !isModification  &&  U.isA(vocModel, 'Reference') &&  U.isA(vocModel, 'ImageResource'))
//        isMasonry = true;
//      if (isMasonry) {
//        var key = this.vocModel.shortName + '-list-item';
//        var litemplate = U.getTypeTemplate('list-item', rl);
//        if (litemplate)
//          isMasonry = false;
//      }
//      var isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(this.vocModel, U.getLongUri1('model/portal/Comment'));
//      var params = U.getParamMap(window.location.hash);
//      var isEdit = !isModification  &&  !isMasonry  &&  (params['$editList']); // || U.isAssignableFrom(vocModel, G.commonTypes.CloneOfProperty));

//      if (!isComment  &&  !isMasonry  &&  !isList) {
//        if (U.isA(vocModel, 'Intersection')) {
//          var href = window.location.href;
//          var qidx = href.indexOf('?');
//          var a = U.getCloneOf(meta, 'Intersection.a')[0];
//          var aprop;
//          if (qidx == -1) {
//            aprop = models[0].get(a);
//            isMasonry = (U.getCloneOf(meta, 'Intersection.aThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.aFeatured')[0]) != null;
//          }
//          else {
//            var b = U.getCloneOf(meta, 'Intersection.b')[0];
//            var p = href.substring(qidx + 1).split('=')[0];
//            var delegateTo = (p == a) ? b : a;
//            isMasonry = (U.getCloneOf(meta, 'Intersection.bThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.bFeatured')[0]) != null;
//          }
//        }
//      }
      var hash = window.location.hash;
//      var params = hash ? U.getParamMap(hash) : {};
//      var mvProp = params.$multiValue;
//      var isMultiValueChooser = !!this.mvProp;
      
      var lis = this.getListItems(); //isModification || isMasonry ? this.$('.nab') : this.isPhotogrid ? this.$('tr') : this.$('li');
      var curNum = lis.length;
//      var num = Math.min(resources.length, (this.page + 1) * this.displayPerPage);
      var num = Math.min(resources.length, (this.page + 1) * this.displayPerPage);

      var i = 0;
      var nextPage = false;
      var frag;
      if (isAdd || !modified && !orientationChange) {
        i = curNum;
        if (curNum == num) {
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
      };
    
      var updated = [];
      this.imageProperty = U.getImageProperty(this.collection);
      this.preRender(info);
      for (; i < num; i++) {
        var res = resources[i],        
            uri = res.getUri(),
            liView = null;
        
        if (canceled && res.get(canceled))
          continue;
        
        info.index = i;        
        
        info.updated = _.contains(modifiedUris, uri);
        if (i >= lis.length || info.updated) {
          liView = this.renderItem(res, info);
          
//          var viewName = 'liView' + i;
//          if (this.isPhotogrid) {
//            liView = this.addChild(viewName, new PhotogridView(_.extend({tagName: 'div', linkToIntersection: true}, commonParams)));
//          }
//          else if (isMultiValueChooser) {
//            var isListed =  _.contains(mvVals, res.get('davDisplayName'));
////            var isChecked = defaultUnchecked === isListed;
//            liView = this.addChild(viewName, new ResourceListItemView(_.extend({mv: true, tagName: 'div', className: "ui-controlgroup-controls", mvProp: mvProp, checked: isListed}, commonParams)));
//          }
//          else if (isMasonry  ||  isModification) 
////            liView = new ResourceMasonryItemView({model:res, className: 'pin', tagName: 'li', parentView: this});
////          else if (isModification)
//            liView = this.addChild(viewName, new ResourceMasonryItemView(_.extend({className: 'nab nabBoard'}, commonParams)));
//          else if (isComment)
//            liView = this.addChild(viewName, new CommentListItemView(commonParams));
//          else if (isEdit) 
//            liView = this.addChild(viewName, new ResourceListItemView(_.extend({editCols: params['$editCols'], edit: true}, commonParams)));
//          else {
//            var swatch = res.get('swatch') || (G.theme  &&  (G.theme.list  ||  G.theme.swatch));
//            if (this.imageProperty != null)
//              liView = this.addChild(viewName, new ResourceListItemView(_.extend({ imageProperty: imageProperty, parentView: this, swatch: swatch}, commonParams)))
//            else
//              liView = this.addChild(viewName, new ResourceListItemView(_.extend({swatch: swatch}, commonParams)));
//          }

//          var rendered = liView.render({force: true});
          if (!liView.rendered)
            continue;

//          var liEl = liView.el;
//          if (liEl && this.isPhotogrid) {
//            var row = $("<tr></tr>")[0];
//            var cell = $("<td></td>")[0];
//            cell.appendChild(liEl);
//            row.appendChild(cell);
//            table.appendChild(row);
//            if (i < num - 1)
//              table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
//          }
//          else {
//          }
        }
//        else if (!nextPage)
//          frag.appendChild(lis[i]);
        
        var el = liView ? liView.el : lis[i];
        if (info.updated)
          updated.push(el);
        else
          info.appended.push(el);

        this.postRenderItem(el, info);
      }
         
      info.updated = updated;

//      if (isChooser) {
//        var params = U.getParamMap(window.location.href, '&');
//        var prop = params['$prop'];
//        var forResource = params['forResource'];
//        if (prop  &&  forResource) {
//          var type = U.getTypeUri(forResource);      
//          var cModel = U.getModel(type);
//          /*
//          if (U.isCloneOf(cModel.properties[prop], "ImageResource.originalImage", cModel)) { 
//            var rules = ' data-formEl="true"';
//            var location = this.hashParams['$location'];
//            var returnUri = this.hashParams['$returnUri'];
//            U.addToFrag(frag, this.fileUploadTemplate({name: prop, forResource: forResource, rules: rules, type: type, location: location, returnUri: returnUri }));
////            frag.appendChild(this.fileUploadTemplate({name: prop, rules: rules, forResource: forResource}));
//          }
//          */
//        }
//      }
      
      delete info.index;
      if (!nextPage)
        this.$el.html(frag);
      
      this.postRender(info);  
//      if (!isComment)
//        this.$el.prevObject.find('#comments').css('display', 'none');
//
//      this.$el.html(frag);
//      this.renderMany(this.model.models.slice(0, lis.length));
//      var self = this;
      
//      this.restyle();
      
//      this.$el.trigger('create');
//      if (this.$el.hasClass('ui-listview'))
//        this.$el.trigger('refresh');

//      if (this.isPhotogrid) {
//        var dim = 0;
//        var grids = $('.gridblock');
//        for (var i = 0; i < grids.length; i++) {
//          var div = $(grids[i]);
//          var img = div.find('img');
//          if (img) {
//            dim = Math.max(img.height(), img.width());
//            break;
//          }
//        }
//        
//        if (dim) {
//          for (var i = 0; i < grids.length; i++) {          
//            var div = $(grids[i]);
//            div.css('height', dim + 20);
//          }
//        }
//      }
      
//      if (renderDfd)
//        renderDfd.resolve();
      return this;
      
//      else {
//        //Element has not been initiliazed
//        this.$el.listview().listview('refresh');
//        this.initializedListView = true;
//      }

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
        self.once('refreshed', U.partialWith(self.checkIfNeedMore, self, displayedBefore));
      }).always(function() {
        self._paging = false;
        self.hideLoadingIndicator();
      });

      return this._pagingPromise;
    },
    
    checkIfNeedMore: function(displayedBefore) {
      var self = this;
//      clearTimeout(self._pagingTimeout);
//      this._pagingTimeout = setTimeout(function() {          
        if (!self.scrolledToNextPage()) // we've got our buffer back
          return;
        else if (self.getListItems().length > displayedBefore) // we loaded some, but we need more
          return self.getNextPage();
        else
          self.checkIfNeedMore(displayedBefore); // the items we loaded haven't been added to the DOM yet 
//      }, 100);
    },
        
//    changed: function(view) {
//      this.changedViews.push(view);
//    },
    
    render: function(e) {
      if (!this.rendered) {
        this.numDisplayed = 0;
        var self = this;
        var col = this.filteredCollection = this.collection.clone();
        this.filteredCollection.on('endOfList', function() {
          this.pageView.trigger('endOfList');
        }.bind(this));
        
        this.filteredCollection.on('reset', function() {
          this.pageView.trigger('newList');
        }.bind(this));
        
        _.each(['updated', 'added', 'reset'], function(event) {
          self.stopListening(col, event);
          self.listenTo(col, event, function(resources) {
            resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
            var options = {
              resources: resources
            };
            
            options[event] = true;
            self.refresh(options);
          });
        });
        
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
      var self = this,
          collection = this.collection,
          filtered = this.filteredCollection;

      function onFilter(e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val();
        
        if (!value) {
          filtered.reset(collection.models, {params: collection.params});
          return;
        }
        
        var resourceMatches = _.filter(collection.models, function(res) {
          var dn = U.getDisplayName(res);
          return dn && dn.toLowerCase().indexOf(value.toLowerCase()) != -1;
        });

        filtered.reset(resourceMatches, {
          params: _.extend({
            '$like': 'davDisplayName,' + value
          }, collection.params)
        });
        
        var numResults = filtered.size();
        if (numResults < self.displayPerPage) {
          var numOriginally = collection.size();
          var indicatorId = self.showLoadingIndicator(3000); // 3 second timeout
          filtered.fetch({
            forceFetch: true,
            success: function() {
              self.hideLoadingIndicator(indicatorId);
            },
            error: function() {
              self.hideLoadingIndicator(indicatorId);
            }
          });
        }            
      };
      
      this.parentView.$('ul[data-filter="true"]').on('listviewbeforefilter', _.debounce(onFilter, 150));
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

      if (this.scrolledToNextPage())
        this.getNextPage();      
    },
    
    scrolledToNextPage: function() {
      if (this.prevScrollPos > $wnd.scrollTop()) {
        this.prevScrollPos = $wnd.scrollTop();
        return;
      }
      
      this.prevScrollPos = $wnd.scrollTop();
      
      // get next page
      // 1) masonry: 2.5 screen height to bottom
      // 2) list view: 1 screen height to bottom
      var factor = this.hasMasonry() ? 3.5 : 2;   
      if ($m.activePage.height() > $wnd.scrollTop() + $wnd.height() * factor)
        return;
      
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
