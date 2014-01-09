//'use strict';
define('views/ListPage', [
  'globals',
  'events', 
  'utils',
  'error',
  'vocManager',
  'views/BasicPageView',
  'views/ResourceListView', 
  'views/Header',
  'lib/fastdom'
], function(G, Events, U, Errors, Voc, BasicPageView, ResourceListView, Header, Q) {
  var MapView,
      SPECIAL_INTERSECTIONS = [G.commonTypes.Handler, G.commonTypes.Friend, U.getLongUri1('model/social/NominationForConnection') /*, commonTypes.FriendApp*/];
  
  return BasicPageView.extend({
//    viewType: 'collection',
    template: 'resource-list',
    clicked: false,
    autoFinish: false,
    _draggable: false,
    _scrollbar: false, 
    style: {
      'background-color': 'white'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'submit', 'swipeleft', 'click', 'swiperight', 'setMode', /*'orientationchange',*/ 'onFilter');
      BasicPageView.prototype.initialize.apply(this, arguments);
      this.mode = options.mode || G.LISTMODES.DEFAULT;
//      this.options = _.pick(options, 'checked', 'props');
      this.viewId = options.viewId;
      
      var self = this;
      var rl = this.collection;
      var filtered = this.filteredCollection = rl.clone();
      var readyDfd = $.Deferred();
      
      var commonParams = {
        model: filtered,
        parentView: this
      };
      
      var hash = window.location.hash;      
      var vocModel = this.vocModel;
      var type = vocModel.type;
      this.makeTemplate(this.template, 'template', type);
      var viewMode = vocModel.viewMode;
      var isList = this.isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isChooser = hash  &&  hash.indexOf('#chooser/') == 0;  
      var isMasonry = this.isMasonry = !isChooser  &&  U.isMasonryModel(vocModel); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
      var isOwner = !G.currentUser.guest  &&  G.currentUser._uri == G.currentApp.creator;
      this.isSpecialIntersection = _.contains(SPECIAL_INTERSECTIONS, type);
      /*
      if (!this.isSpecialIntersection) {
        if (U.isA(this.vocModel, "Intersection")) {
          var af = U.getCloneOf(this.vocModel, 'Intersection.aFeatured');
          var bf = U.getCloneOf(this.vocModel, 'Intersection.bFeatured');
          if (af.length  &&  bf.length)
            this.isSpecialIntersection = true;
        }
      }
      */
      var isGeo = this.isGeo = this.isGeo(); // && _.any(rl.models, function(m) {return !_.isUndefined(m.get('latitude')) || !_.isUndefined(m.get('shapeJson'))});
      var params = hash ? _.getParamMap(hash) : null;
      var isMV = this.isMV = params  &&  params['$multiValue'] != null;

      var showAddButton;
      if (!this.vocModel.adapter  &&  !isChooser  &&  !isMV) {
        var isMessage = U.isA(this.vocModel, 'GenericMessage');
        if (!isMessage) {
          if (!isChooser  ||  this.vocModel['skipAccessControl']) {
            showAddButton = type.endsWith('/App')                      || 
                            U.isAnAppClass(type)                       ||
                            vocModel.properties['autocreated']         ||
                            vocModel.skipAccessControl                 ||
                            U.isUserInRole(U.getUserRole(), 'siteOwner');
            if (!showAddButton) {
              var p = U.getContainerProperty(vocModel);
              if (p && params[p])
                showAddButton = true;
            }
          }
    //                           (vocModel.skipAccessControl  &&  (isOwner  ||  U.isUserInRole(U.getUserRole(), 'siteOwner'))));
          if (showAddButton) { 
            if (U.isAssignableFrom(this.vocModel, "Assessment"))
              showAddButton = false;
            else if (U.isA(this.vocModel, "Reference")  &&  this.vocModel.type.toLowerCase().indexOf("/voc/dev/" + G.currentApp.appPath.toLowerCase()) == -1)  
              showAddButton = false;
          }
          else if (isOwner  &&  !isChooser) {
            Voc.getModels("model/social/App").done(function() {
              var m = U.getModel("App");
              var arr = U.getPropertiesWith(m.properties, [{name: "backLink"}, {name: 'range', values: type}], true);
              if (arr  &&  arr.length  &&  !arr[0].readOnly /*&&  U.isPropEditable(null, arr[0], userRole)*/)  
                showAddButton = true;
            });
          }
          var idx;
          if (!isChooser  &&  !showAddButton  &&  hash  &&  (idx = hash.indexOf('?')) != -1) {
            var s = hash.substring(idx + 1).split('&');
            if (s && s.length > 0) {
              for (var i=0; i<s.length; i++) {
                var p = s[i].split('=');
                var prop = vocModel.properties[p[0]];
                if (!prop  ||  !prop.containerMember) 
                  continue;
                var type = U.getLongUri1(prop.range);
                var cM = U.getModel(type);
                if (!cM) {
                  var rType = U.getTypeUri(decodeURIComponent(p[1]));
                  if (rType)
                    cM = U.getModel(rType);
                  if (!cM)
                    continue;
                }
                var blProps = U.getPropertiesWith(cM.properties, 'backLink');
                var bl = [];
                for (var p in blProps) {
                  var b = blProps[p];
                  if (!b.readOnly  &&  U.getLongUri1(b.range) == vocModel.type)
                    bl.push(b);
                }
                if (bl.length > 0)
                  showAddButton = true;
              }
            }
          }
        }
      }
      
      this.headerButtons = {
        back: true,
        add: showAddButton,
//        aroundMe: isGeo,
        mapIt: isGeo,
//        menu: true,
        rightMenu: true, //!G.currentUser.guest,
        login: G.currentUser.guest
      };

      this.header = new Header(_.extend({
        buttons: this.headerButtons,
        viewId: this.cid
      }, commonParams));
      
      this.addChild(this.header);
      
      var isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));
      var meta = vocModel.properties;
      var isComment = this.isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(vocModel, U.getLongUri1('model/portal/Comment'));

      this.isEdit = (params  &&  params['$editList'] != null); // || U.isAssignableFrom(vocModel, G.commonTypes.CloneOfProperty);
      this.listContainer = isMV ? '#mvChooser' : (isModification || isMasonry ? '#nabs_grid' : (isComment) ? '#comments' : (this.isEdit ? '#editRlList' : '#sidebar'));
      var listViewType;
      if (this.isSpecialIntersection)
        listViewType = 'IntersectionListView';
      else if (this.isComment)
        listViewType = 'CommentListView';
//      else if (isMasonry || isModification)
//        listViewType = 'MasonryListView';
      else
        listViewType = 'ResourceListView';
      
      this.ready = readyDfd.promise();
      U.require('views/' + listViewType).done(function(listViewCl) {
        self.listView = new listViewCl(_.extend({mode: self.mode, displayMode: isMasonry || isModification ? 'masonry' : 'vanillaList'}, self.options, commonParams));
        self.addChild(self.listView);
        readyDfd.resolve();
      });
      
      this.canSearch = !this.isSpecialIntersection; // for now - search + photogrid results in something HORRIBLE, try it if you're feeling brave
      
      // setup filtering
//      this.listenTo(filtered, 'endOfList', function() {
//        self.pageView.trigger('endOfList');
//      });
//      
//      this.listenTo(filtered, 'reset', function() {
//        self.pageView.trigger('newList');
//      });      
    },
    
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw new Error('this view doesn\'t have a mode ' + mode);
      
      this.mode = mode;
      if (this.listView)
        this.listView.setMode(mode);
    },
    
    events: {
      'click'            : 'click',
//      'click #nextPage'  : 'getNextPage',
      'click #homeBtn'   : 'home',
      'submit'            : 'submit',
      'click #filter'    : 'focusFilter',
      'change #filter'    : 'onFilter'
    },
    
//    windowEvents: {
//      'orientationchange' : 'orientationchange',
//      'resize'            : 'orientationchange'
//    },
    
    focusFilter: function(e) {
      // HACK - JQM does sth weird to prevent focus when we're not using their listfilter widget
      this.filter.focus();
    },
    
    onFilter: Q.debounce(function(e, data) {
      var filtered = this.filteredCollection,
          collection = this.collection,
          value = e.target.value,
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
    }, 50),

//    orientationchange: function(e) {
////      var isChooser = window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;  
////      var isMasonry = this.isMasonry = !isChooser  &&  U.isMasonryModel(this.vocModel); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
//      if (this.isMasonry) {
//        Events.stopEvent(e);
//        Events.trigger('refresh', {model: this.model}); //, checked: checked});
//      } 
//    },
    submit: function(e) {
//      Events.stopEvent(e);
//      var isEdit = (this.action === 'edit');
//      if (p && p.mode == G.LISTMODES.CHOOSER) {
      Events.stopEvent(e);
      var checked = this.$('input:checked');
      var editList = this.$('input[data-formel]');
      if (checked.length) {
        Events.trigger('choseMulti', this.hashParams.$multiValue, this.model, checked);
        return;
      }
      Errors.errDialog({msg: 'Choose first and then submit', delay: 100});
      return;
/*
      if (!editList) { 
        Errors.errDialog({msg: 'Choose first and then submit', delay: 100});
        return;
      }
      
      for (var i=0; i<editList.length; i++) {
        var name = editList[i].name;
        var idx = name.indexOf('.$.');
        var uri = name.substring(0, idx);
        var propName = name.substring(idx + 3);
        
        var props = {propName: editList[i].value};
        var res = this.collection.models[i];
        res.save(props, {
          sync: !U.canAsync(this.vocModel),
          success: function(resource, response, options) {
            res.lastFetchOrigin = null;
          },
          error: function(resource, response, options) {
            var a = 'here we are';
          }
        });
      }  
      this.router.navigate(hash, {trigger: true, replace: true});
      */
//      this.redirect({trigger: true, replace: true, removeFromView: true});
    }, 
    home: function() {
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    
//    getNextPage: function() {
//      if (this.isActive())
//        this.listView && this.listView.getNextPage();
//    },
  //  nextPage: function(e) {
  //    Events.trigger('nextPage', this.resource);    
  //  },
//    tap: Events.defaultTapHandler,
    
    click: function(e) {
      this.clicked = true;
      var buyLink;
      var tryLink;
      
//      var tId = e.target.id;
//      if (tId && tId == 'mvSubmit') {
//        var form = $(e.target).closest('form');
//        if (form) {
//          Events.stopEvent(e);
//          form.submit();
//          return true;
//        }
//      }
      if (!U.isA(this.vocModel, 'Buyable') || ((buyLink = $(e.target).closest($('#buyLink'))).length == 0  &&  (tryLink = $(e.target).closest($('#tryLink'))).length == 0)) {
//        Events.defaultClickHandler(e);
        return true;
      }

      Events.stopEvent(e);
      
      var uri = buyLink.length ? $(buyLink[0]).attr('href') :  $(tryLink[0]).attr('href');
      var models = this.model.models;
      var res = $.grep(models, function(item) {
        return item.getUri() == uri;
      })[0];
      if (!buyLink.length) {
        Events.trigger('chooser', {model: res, buy: true});
        return;
      }
      var newRes = new this.vocModel();
      var p = U.getCloneOf(this.vocModel, 'Buyable.template');
      var props = {};
      props[p[0]] = uri;
      newRes.save(props, {
        success: function(resource, response, options) {
          res.lastFetchOrigin = null;
          self.redirect(res, {trigger: true, replace: true, forceFetch: true});
        }
      });
    },

    render: function() {
      var args = arguments,
          self = this;
      
      this.addContainerBodyToWorld(); // not draggable
      return this.ready.done(function() {
        Q.write(self.renderHelper, self, args);
      });
    },

    renderHelper: function() {
      var self = this,
          tmpl_data = this.getBaseTemplateData(),
          views = {
            '#headerDiv': this.header
          },
          filter;
      
//      this.$el.attr("data-scrollable", "true");
      tmpl_data.isMasonry = this.isMasonry;
      this.html(this.template(tmpl_data));
      
      views[this.listContainer] = this.listView;
      this.assign(views);
        
      if (!this.mapView && this.isGeo) {
        Events.once('mapIt', function() {          
          U.require('views/MapView', function(MV) {
            MapView = MV;
            self.mapView = new MapView({
              model: self.filteredCollection,
              parentView: self
            });
            self.addChild(self.mapView);
            self.assign('#mapHolder', self.mapView);  
          });
        });
      }      

//      this.mapReady && this.mapReady.done(function() {
//      }.bind(this));
      
      if (!this.isMV)
        this.$('#mv').$hide();
      if (!this.isEdit)
        this.$('#editRlForm').$hide();
//      if (this.isSpecialIntersection) {
//        this.listView.$el.addClass('grid-listview');
//        this.listView.$el.find('ul').removeClass('grid-listview');
//      }
      this.$('#sidebarDiv').$css('clear', 'both');
      if (G.theme.backgroundImage) { 
        this.$('#sidebarDiv').$css('background-image', 'url(' + G.theme.backgroundImage +')');
      }
      if (!this.isMasonry)
        this.$('#sidebarDiv').$css('overflow-x', 'visible');

      this.filter = this.$('#filter')[0];
      if (this.filter) {
        this.filter.on('keydown', function(e) {
          self.filter.dispatchEvent(new Event('change', {
            view: self.filter,
            bubbles: false,
            cancelable: true
          }));
        });
      }
      
//      this.addToWorld(null, true);
      this.finish();
      return this;
    }
  }, {
    displayName: 'ListPage'
  });
});
