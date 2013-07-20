'use strict';
define('views/ResourceListView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/ResourceMasonryItemView',
  'views/ResourceListItemView',
  'views/CommentListItemView',
  'views/PhotogridView',
  'collections/ResourceList',
  'jqueryMobile'
], function(G, U, Events, BasicView, ResourceMasonryItemView, ResourceListItemView, CommentListItemView, PhotogridView, ResourceList, $m) {
  var RLV = BasicView.extend({
    displayPerPage: 10, // for client-side paging
    page: null,
    changedViews: [],
//    skipScrollEvent: false,
    prevScrollPos: 0,
    loadIndicatorTimerId: null, // show loading indicator with delay 0.5 sec!
    initialize: function (options) {
      _.bindAll(this, 'render','swipe', 'getNextPage', 'refresh', 'changed', 'onScroll', 'onNewItemsAppend', 'setMode', 'orientationchange'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      $(window).on('scroll', this.onScroll);
      Events.on('pageChange', this.onNewItemsAppend);
      this.$el.on('create', this.onNewItemsAppend);
//      this.collection.on('reset', this.render, this);
//      this.collection.on('add', this.onadd, this);
//      this.collection.on('refresh', this.refresh);
//      this.collection.on('add', this.add, this);
//      this.options = _.pick(options, 'checked', 'props') || {};
      this.mode = options.mode || G.LISTMODES.DEFAULT;
      this.makeTemplate('fileUpload', 'fileUploadTemplate', this.vocModel.type);
      var commonTypes = G.commonTypes;
      var type = this.vocModel.type;
//      this.isPhotogrid = _.contains([commonTypes.Handler, commonTypes.FriendApp], type);
      this.isPhotogrid = this.parentView.isPhotogrid;
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
      this.isChooser = window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;
      this.isMasonry = !this.isChooser  && !this.isPhotogrid &&  (_.any(['/Tournament', '/Theme', '/App', '/Coupon', '/Goal', '/Movie', '/ThirtyDayTrial', '/SolarBond'], function(end) {return type.endsWith(end)}) || U.isA(this.vocModel, "VideoResource")); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel);
      this.isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));
      return this;
    },
    events: {
      'orientationchange': 'orientationchange',
      'resize': 'orientationchange'
    },
    
    orientationchange: function(e) {
//      alert ('here we are');
      
      if (!this.isMasonry)
        return;

      var o = ($(window).height() > $(window).width()) ? 'portrait' : 'landscape';
      Events.stopEvent(e);
      
      var prevWidth;
      if ($(window).height() > $(window).width()) {
        this.IMG_MAX_WIDTH = 272;
        prevWidth = 205;
      } 
      else {
        this.IMG_MAX_WIDTH = 205; // value of CSS rule: ".nab .anab .galleryItem_css3 img"      // resourceListView will call render on this element
        prevWidth = 272;
      }
      
      $('.nabBoard').attr('style', 'width:' + (this.IMG_MAX_WIDTH + 20) + 'px !important');
      $('.nab .anab .galleryItem_css3 img').attr('style', 'max-width:' + this.IMG_MAX_WIDTH + 'px !important');
      /*
      var img = $('.nab .anab .galleryItem_css3 img');
      for (var i=0; i<img.length; i++) {
        var width = img[i].width;
        var height = img[i].height;
        if (width > this.IMG_MAX_WIDTH) {
          ratio = this.IMG_MAX_WIDTH / width;
          img[i].attr('style', 'max-width:' + this.IMG_MAX_WIDTH + '; width:' +  this.IMG_MAX_WIDTH + '; height: ' + Math.floor(height * ratio));
        }
      }
      */
//    Events.trigger('refresh');
      this.refresh(null, {orientation: o});
      this.$el.masonry('reload');
    },
    onadd: function(resources, options) {
      if (options && options.refresh) {
        debugger;
        this.refresh(resources);
      }
    },
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw new Error('this view doesn\'t have a mode ' + mode);
      
      this.mode = mode;
    },
    
    refresh: function(modified, options) {
      options = options || {};
      if (options.partOfUpdate)
        return;
      
      options = options || {};
      var isAdd = options.added;
      var isUpdate = options.updated;
      var isReset = options.reset;
      var orientationChange = options.orientation;
      
      G.log(this.TAG, 'refreshing ResourceListView');
      modified = modified ? (_.isArray(modified) ? modified : [modified]) : null;
      var modifiedUris = modified && _.map(modified, function(m) {
        return m.getUri();
      });
      
      var rl = this.filteredCollection;
      var resources = rl.models;
      var vocModel = this.vocModel;
      var type = vocModel.type;
      var isModification = this.isModification;
      var meta = vocModel.properties;
      var canceled = U.getCloneOf(vocModel, 'Cancellable.cancelled');
      canceled = canceled.length ? canceled[0] : null;
      
      var viewMode = vocModel.viewMode;
      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isChooser = this.isChooser; //window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;  
      var isMasonry = this.isMasonry; //this.isMasonry = !isChooser  && !this.isPhotogrid &&  (_.any(['/Tournament', '/Theme', '/App', '/Coupon', '/Goal', '/Movie', '/ThirtyDayTrial'], function(end) {return type.endsWith(end)}) || U.isA(this.vocModel, "VideoResource")); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
      
//      var isMasonry = !isList  &&  U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(vocModel, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(vocModel, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(vocModel, 'ImageResource.bigImage').length > 0);
//      if (!isMasonry  &&  !isModification  &&  U.isA(vocModel, 'Reference') &&  U.isA(vocModel, 'ImageResource'))
//        isMasonry = true;
//      if (isMasonry) {
//        var key = this.vocModel.shortName + '-list-item';
//        var litemplate = U.getTypeTemplate('list-item', rl);
//        if (litemplate)
//          isMasonry = false;
//      }
      var isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(vocModel, U.getLongUri1('model/portal/Comment'));
      var params = U.getParamMap(window.location.hash);
      var isEdit = !isModification  &&  !isMasonry  &&  (params['$editList']); // || U.isAssignableFrom(vocModel, G.commonTypes.CloneOfProperty));

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
      var params = hash ? U.getParamMap(hash) : {};
      var mvProp = params.$multiValue;
      var isMultiValueChooser = !!mvProp;
      var mvVals = [];
      if (mvProp) {
        var pr = '$' + mvProp;
        var s = params[pr];
        s = s.split(',');
        for (var i=0; i<s.length; i++)
          mvVals.push(s[i].trim());
      }
      
      var lis = isModification || isMasonry ? this.$('.nab') : this.isPhotogrid ? this.$('tr') : this.$('li');
      var imageProperty = U.getImageProperty(rl);
      var curNum = lis.length;
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
      var table;
      if (this.isPhotogrid) {
        table = $('table#photogridList{0}'.format(this.cid));
        if (table.length) {
          table = table[0];
          table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
        }
        else
          table = $('<table id="photogridList{0}" width="100%"></table>'.format(this.cid))[0];
      }
        
//      var renderDfd = this.isPhotogrid ? $.Deferred() : null;
      for (; i < num; i++) {
        var res = resources[i];
        if (canceled && res.get(canceled))
          continue;
        
        var commonParams = {
          model: res,
          parentView: this
        };
        
        var uri = res.getUri();
        if (i >= lis.length || _.contains(modifiedUris, uri)) {
          var liView;
          var viewName = 'liView' + i;
          if (this.isPhotogrid) {
            liView = this.addChild(viewName, new PhotogridView(_.extend({tagName: 'div', linkToIntersection: true}, commonParams)));
          }
          else if (isMultiValueChooser) {
            var isListed =  _.contains(mvVals, res.get('davDisplayName'));
//            var isChecked = defaultUnchecked === isListed;
            liView = this.addChild(viewName, new ResourceListItemView(_.extend({mv: true, tagName: 'div', className: "ui-controlgroup-controls", mvProp: mvProp, checked: isListed}, commonParams)));
          }
          else if (isMasonry  ||  isModification) 
//            liView = new ResourceMasonryItemView({model:res, className: 'pin', tagName: 'li', parentView: this});
//          else if (isModification)
            liView = this.addChild(viewName, new ResourceMasonryItemView(_.extend({className: 'nab nabBoard'}, commonParams)));
          else if (isComment)
            liView = this.addChild(viewName, new CommentListItemView(commonParams));
          else if (isEdit) 
            liView = this.addChild(viewName, new ResourceListItemView(_.extend({editCols: params['$editCols'], edit: true}, commonParams)));
          else {
            var swatch = res.get('swatch') || (G.theme  &&  (G.theme.list  ||  G.theme.swatch));
            if (imageProperty != null)
              liView = this.addChild(viewName, new ResourceListItemView(_.extend({ imageProperty: imageProperty, parentView: this, swatch: swatch}, commonParams)))
            else
              liView = this.addChild(viewName, new ResourceListItemView(_.extend({swatch: swatch}, commonParams)));
          }

          var rendered = liView.render({force: true});
          if (rendered === false)
            continue;
          else
            rendered = rendered.el;
          
          if (rendered && this.isPhotogrid) {
            var row = $("<tr></tr>")[0];
            var cell = $("<td></td>")[0];
            cell.appendChild(rendered);
            row.appendChild(cell);
            table.appendChild(row);
            if (i < num - 1)
              table.appendChild($('<tr><td colspan="2"><hr /></td></tr>')[0]);
          }
          else {
            if (nextPage) {
              this.$el.append(rendered);
            }
            else {
              frag.appendChild(rendered);
            }
          }
        }
        else if (!nextPage)
          frag.appendChild(lis[i]);
      }
      
      if (frag && table)
        frag.appendChild(table);
      

      if (isChooser) {
        var params = U.getParamMap(window.location.href, '&');
        var prop = params['$prop'];
        var forResource = params['forResource'];
        if (prop  &&  forResource) {
          var type = U.getTypeUri(forResource);      
          var cModel = U.getModel(type);
          /*
          if (U.isCloneOf(cModel.properties[prop], "ImageResource.originalImage", cModel)) { 
            var rules = ' data-formEl="true"';
            var location = this.hashParams['$location'];
            var returnUri = this.hashParams['$returnUri'];
            U.addToFrag(frag, this.fileUploadTemplate({name: prop, forResource: forResource, rules: rules, type: type, location: location, returnUri: returnUri }));
//            frag.appendChild(this.fileUploadTemplate({name: prop, rules: rules, forResource: forResource}));
          }
          */
        }
      }
      
      if (!nextPage) {
        this.$el.html(frag);
      }
      if (!isComment)
        this.$el.prevObject.find('#comments').css('display', 'none');

//      this.$el.html(frag);
//      this.renderMany(this.model.models.slice(0, lis.length));
      var self = this;

      if (this.initializedListView) {
        if (isModification  ||  isMasonry  ||  isMultiValueChooser) {
          this.$el.trigger('create');
        }
        else {
          this.$el.trigger('create');
          this.$el.listview('refresh');
        }

        if (isMasonry || isModification)
          this.alignBricks();
      }
      else {
        // HACK
        Events.on('pageChange', function(previousView, currentView) {
          if (currentView !== this.pageView)
            return;
//        this.pageView.$el.on('pageshow', function() {
          if (isMasonry || isModification) {
            self.alignBricks();
          }
        }.bind(this));
        // END HACK
        
        this.initializedListView = true;
      }
      
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
    
    forceReloadMasonry: function() {
      if (this.rendered)
        this.$el.masonry('reload');
    },
    
    getNextPage: function() {
      if (!this.rendered)
        return this;
//      var before = this.model.models.length;
//
//      console.log("called getNextPage");
//      
//      // there is nothing to fetch, we've got them all
//      if (before < this.model.perPage)
//        return;
      
      var self = this;
      var rl = this.filteredCollection;
      var before = rl.models.length;
      if (!before)
        return;
      
//      var before = this.model.offset;
      this.page++;
      var requested = (this.page + 1) * this.displayPerPage;
//      var requested = this.page * this.displayPerPage;
      var after = function() {
//        var numShowing = (self.page + 1) * self.displayPerPage;
//        if (requested <= rl.models.length  ||  rl.models.length % self.displayPerPage > 0) {
//          self.refresh();
//        }
        // listview (not masonry) can resume to process events immediately
        if (!self.hasMasonry())
          self.skipScrollEvent = false;
        self.hideLoadingIndicator();
      };
      
      var error = function() { after(); };
//      if (requested <= rl.models.length && rl.models.length % this.displayPerPage > 0) {
//        this.refresh(rl);
//        return;
//      }
      if (before >= requested) {
        this.refresh(rl.models.slice(requested), {added: true});
        after();
        return;
      }

      rl.getNextPage({
        success: after,
        error: error
      });      
    },
    
//    tap: Events.defaultTapHandler,
//    click: Events.defaultClickHandler,
    swipe: function(e) {
      G.log(this.TAG, "info", "swipe");
    },
    
    changed: function(view) {
      this.changedViews.push(view);
    },
    
    render: function(e) {
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
          var options = {};
          options[event] = true;
          self.refresh(resources, options);
        });
      });
      
      var wasRendered = this.rendered;
      this.rendered = true;
      this.refresh(null, {added: true});
      
      var collection = this.collection;
      var filtered = this.filteredCollection;
      var colModel = collection.vocModel;
      if (!wasRendered) {
        this.parentView.$('ul[data-filter="true"]').on('listviewbeforefilter', _.debounce(function (e, data) {
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
        }, 150));
      }
  
      return this;
    },
  
    // endless page function
    onScroll: function() {
      if (!this.isActive())
        return;
      
      var $wnd = $(window);
      if ($wnd.scrollTop() > 20)
        this.skipScrollEvent = true;
        
//      if (this.skipScrollEvent) // wait for a new data portion
//        return;
      
      // scroll up - no need to fetch new portion of data
      if (this.prevScrollPos > $wnd.scrollTop()) {
        this.prevScrollPos = $wnd.scrollTop();
        return;
      }
      
      this.prevScrollPos = $wnd.scrollTop();
      
      // get next page
      // 1) masonry: 2.5 screen height to bottom
      // 2) list view: 1 screen height to bottom
      var factor = this.hasMasonry ? 3.5 : 2;   
      if ($m.activePage.height() > $wnd.scrollTop() + $wnd.height() * factor)
        return;
      
//      var self = this;
      // order is important, because view.getNextPage() may return immediately if we have some cached rows
      // if scrollTop is near to zero then it is "initial" next page retriving not by a user
//      if ($wnd.scrollTop() > 20) {  
//        this.skipScrollEvent = true; 
////        this.loadIndicatorTimerId = setTimeout(function() { self.showLoadingIndicator(); }, 500);      
//      }
      
      this.getNextPage();
    },
    
//    resumeScrollEventProcessing: function () {
//      this.skipScrollEvent = false;
//      this.hideLoadingIndicator();
//    },

    // masonry bricks alignment
    onNewItemsAppend: function() {
      var hash = window.location.hash;
      if (hash.indexOf('make') == 1  ||  hash.indexOf('edit') == 1) {
//        this.resumeScrollEventProcessing();
        return;
      }
      // no masonry or masonry is hidden
      if (!this.hasMasonry() || this.$el.width() == 0) {
//        this.resumeScrollEventProcessing();
        return;
      }
      
      // masonry code works with DOM elements already inserted into a page
      // small timeout insures right bricks alignment
      var self = this;
      setTimeout(function() { 
        self.alignBricks(); 
      }, 50);
    },
    alignBricks: function(loaded) {
      // masonry is hidden
      var self = this;
      if (this.$el.width() == 0) {
        if (loaded) {
          this.$el.masonry('reload');
          return;
        }
        else {
          this.$el.load(function() {
            G.log(self.TAG, 'event', 'masonry on $el load');
            self.alignBricks(true);
          });
          return;
        }
      }
      
      var needToReload = false;
      // all bricks in masonry
      var $allBricks = $(this.$el.children());
      // new, unaligned bricks - items without 'masonry-brick' class
      var $newBricks = $allBricks.filter(function(idx, node) {
        var $next = $(node).next();
        var hasClass = $(node).hasClass("masonry-brick");
        
        // if current node does not have "masonry-brick" class but the next note has
        // then need to reload/reset bricks
        if ($next.length &&
            !hasClass && 
            $next.hasClass("masonry-brick"))
          needToReload = true;
        
        return !hasClass;
      });

      // if image(s) has width and height parameters then possible to align masonry
      // before inner images downloading complete. Detect it through image in 1st 'brick' 
      var img = $('img', $allBricks[0]);
//      var hasImgSize = (img.exist() && img.width.length > 0 && img.height.length > 0) ? true : false;
      var hasImgSize = (img.length && img.width() && img.height()) ? true : false;
      
      // 1. need to reload. happens on content refreshing from server
      if (needToReload) {
        this.$el.masonry('reload');
        if (hasImgSize) {
//          this.resumeScrollEventProcessing();
        }
        else  {
          this.$el.imagesLoaded( function(){ 
            self.$el.masonry('reload'); 
//            self.resumeScrollEventProcessing(); 
          });
        }
          
        return;
      }
      
      //  2. initial bricks alignment because there are no items with 'masonry-brick' class   
      if ($allBricks.length != 0 && $allBricks.length == $newBricks.length) {
        if (hasImgSize) {
          this.$el.masonry();
//          this.resumeScrollEventProcessing();
        }
        else {  
          this.$el.imagesLoaded( function(){ 
            self.$el.masonry(); 
//            self.resumeScrollEventProcessing(); 
          });
        }
        
        return;
      }
      
      // 3. nothing to align
      if ($newBricks.length == 0) {
        this.$el.masonry();
        return; // nothing to align
      }
     
      // 4. align new bricks, on next page, only
      // filter unaligned "bricks" which do not have calculated, absolute position 
      if (hasImgSize) {
        this.$el.masonry('appended', $newBricks);
//        this.resumeScrollEventProcessing();
      }
      else  
        this.$el.imagesLoaded( function(){ 
          self.$el.masonry('appended', $newBricks); 
//          self.resumeScrollEventProcessing(); 
        });
      
      this.$el.trigger('create');      
    },
    // checks if built masonry (or listview) in the view
    hasMasonry: function() {
      return this.$el.hasClass('masonry');
    }
  }, {
    displayName: 'ResourceListView'
  });
  
  return RLV;
});
