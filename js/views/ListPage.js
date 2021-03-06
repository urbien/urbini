//'use strict';
define('views/ListPage', [
  'globals',
  'events',
  'utils',
  'error',
  'vocManager',
  'collections/ResourceList',
  'views/BasicPageView',
  'views/Header',
  'lib/fastdom',
  'domUtils'
], function(G, Events, U, Errors, Voc, ResourceList, BasicPageView, Header, Q, DOM) {
  var MapView,
      SPECIAL_INTERSECTIONS = [G.commonTypes.Handler, G.commonTypes.Friend, U.getLongUri1('model/social/NominationForConnection') /*, commonTypes.FriendApp*/],
      CAN_SHOW_ADD_BUTTON = true;

  function getLinearGradient(r, g, b) {
    var rgb = r + ',' + g + ',' + b;
    return 'linear-gradient(to bottom, rgba({0},1) 0%, rgba({0},0.15) 25%, rgba({0},0) 50%, rgba({0},0.15) 75%, rgba({0},1) 100%)'.format(rgb);
  };

  return BasicPageView.extend({
//    viewType: 'collection',
    template: 'resource-list',
    clicked: false,
    _autoFetch: false,
    autoFinish: false,
    _draggable: false,
    _scrollbar: false,
    attributes: {
      'data-action': 'list'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'submit', 'swipeleft', 'click', 'swiperight', 'setMode'/*, 'orientationchange', '_buildMockViewPage', '_getViewPageImageInfo'*/);
      BasicPageView.prototype.initialize.apply(this, arguments);
      this.mode = options.mode || G.LISTMODES.DEFAULT;
//      this.options = _.pick(options, 'checked', 'props');
      this.viewId = options.viewId;

      var self = this;
      var rl = this.collection;
      var filtered = this.filteredCollection = rl.clone();

      var commonParams = {
        model: filtered,
        parentView: this
      };

      var vocModel = this.vocModel;
      var type = vocModel.type;
      this.makeTemplate(this.template, 'template', type);
      var viewMode = vocModel.viewMode;
      var isList = this.isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isChooser = this._hashInfo.route == 'chooser';
      var isMasonry = this.isMasonry = !isChooser  &&  U.isMasonryModel(vocModel); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel);
//      var isOwner = !G.currentUser.guest  &&  G.currentUser._uri == G.currentApp.creator;
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
      var params = this.hashParams;
      var isMV = this.isMV = params['$multiValue'] != null;
      var meta = vocModel.properties;

      var showAddButtonPromise =  (!(!isChooser  ||  isMV)) ? G.getResolvedPromise() : this.detectAddButton(params);
      showAddButtonPromise = showAddButtonPromise.then(function() {
        if (self.hashParams.$indicator) {
          self.headerButtons = ['cancel', 'save'];
          self.el.$data('action', 'make');
        }
        else {
          self.headerButtons = ['back', 'search'];
          if (self.showAddButton)
            self.headerButtons.push('add');
  
          self.headerButtons.push('rightMenu');
        }
        self.header = new Header(_.extend({
          buttons: self.headerButtons,
          viewId: self.cid,
          hasFilter: true
        }, commonParams));
  
        self.addChild(self.header);
      });

      var isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));
      var isComment = this.isComment = !isModification  &&  !isMasonry &&  /*U.isA(vocModel, 'Note');*/U.isAssignableFrom(vocModel, U.getLongUri1('model/portal/Comment'));

      var isKYCDocument = G.currentApp.appPath == 'KYC'  &&  U.isAssignableFrom(this.model, 'model/portal/SharedFile') && !isChooser; 
      // For KYC we need to be able to choose several documents for verification
      this.isEdit = isKYCDocument || (params  &&  params['$editList'] != null); // || U.isAssignableFrom(vocModel, G.commonTypes.CloneOfProperty);

      this.listContainer = isMV ? '#mvChooser' : (isModification || isMasonry ? '#nabs_grid' : (isComment) ? '#comments' : (this.isEdit || isKYCDocument ? '#editRlList' : '#sidebar'));
      var listViewType;
      if (this.isSpecialIntersection)
        listViewType = 'IntersectionListView';
      else if (this.isComment)
        listViewType = 'CommentListView';
//      else if (isMasonry || isModification)
//        listViewType = 'MasonryListView';
      else
        listViewType = 'ResourceListView';

      var getListView = U.require('views/' + listViewType).then(function(listViewCl) {
        self.listViewCl = listViewCl;
        self.listViewOptions = _.extend({mode: self.mode, displayMode: isMasonry || isModification ? 'masonry' : 'vanillaList'}, self.options, commonParams);
        self.listView = new listViewCl(self.listViewOptions);
        self.addChild(self.listView);
      });

      this.ready = $.when(showAddButtonPromise, getListView);
      this.canSearch = !this.isSpecialIntersection; // for now - search + photogrid results in something HORRIBLE, try it if you're feeling brave

      // setup filtering
//      this.listenTo(filtered, 'endOfList', function() {
//        self.pageView.trigger('endOfList');
//      });
//
//      this.listenTo(filtered, 'reset', function() {
//        self.pageView.trigger('newList');
//      });

//      this.onload(this.buildMockViewPage, this);
    },
    
    detectAddButton: function(params) {
      if (!CAN_SHOW_ADD_BUTTON ||  this.vocModel.adapter  ||  U.isA(this.vocModel, 'GenericMessage') || U.isAssignableFrom(this.vocModel, 'SharedFile')) 
        return G.getResolvedPromise();

      var promise,
          self = this,
          wasContainer,
          isChooser = this._hashInfo.route == 'chooser',
          type = this.vocModel.type,
          isMV = this.isMV = params['$multiValue'] != null,
          isOwner = !G.currentUser.guest  &&  G.currentUser._uri == G.currentApp.creator;
      

      if (this.vocModel['skipAccessControl']) {
        this.showAddButton = type.endsWith('/App')                      ||
                        U.isAnAppClass(this.vocModel)                       ||
                        this.vocModel.properties['autocreated'];
//                            U.isUserInRole(U.getUserRole(), 'siteOwner');
        if (!this.showAddButton) {
          var p = U.getContainerProperty(this.vocModel);
          if (!p)
            this.showAddButton = (isMV  &&  !G.currentUser.guest) || U.isUserInRole(U.getUserRole(), 'siteOwner');
          else if (params[p]) {
            var range = this.vocModel.properties[p].range;
            promise = Voc.getModels(range).then(function() {
              var m = U.getModel(range);
              var bp = U.getPropertiesWith(m.properties, 'backLink');
              for (var cp in bp) {
                var prop = bp[cp];
                if (prop.range == self.vocModel.type  &&  !prop.readOnly) {
                  this.showAddButton = true;
                  break;
                }
              }
            });
          }
        }
      }
      
      if (!promise)
        promise = G.getResolvedPromise();
      
      return promise.then(function() {
        if (self.showAddButton) {
          if (U.isAssignableFrom(self.vocModel, "Assessment"))
            self.showAddButton = false;
          else if (U.isA(self.vocModel, "Reference")  &&  U.isAnAppClass(self.vocModel))
            self.showAddButton = false;
          else if (U.isA(self.vocModel, "Intersection")) {
            self.showAddButton = false;
            // Check if there are other then cloneOf properties
            for (var p in meta) {
              var prop = meta[p];
              if (prop.autoincrement  ||  p.charAt(0) == '_'  ||  p == 'davDisplayName'  ||  p == 'davGetLastModified')
                continue;
              if (prop.cloneOf  &&  prop.cloneOf.indexOf('Intersection.') == 0)
                continue;
              self.showAddButton = true;
              break;
            }
          }
        }
        else if (isOwner  &&  !isChooser) {
          return Voc.getModels("model/social/App").then(function() {
            var m = U.getModel("App");
            var arr = U.getPropertiesWith(m.properties, [{name: "backLink"}, {name: 'range', values: type}], true);
            if (arr  &&  arr.length  &&  !arr[0].readOnly /*&&  U.isPropEditable(null, arr[0], userRole)*/)
              self.showAddButton = true;
          });
        }
      }).then(function() {
        if (isChooser  ||  self.showAddButton  ||  !_.size(params)) return;

        for (var p in params) {
          var prop = self.vocModel.properties[p],
              val = params[p];

          if (!prop  ||  !prop.containerMember)
            continue;
          wasContainer = true;
          var rType = U.getTypeUri(decodeURIComponent(val));
          return Voc.getModels(rType).then(function(cM) {
            var blProps = U.getPropertiesWith(cM.properties, 'backLink');
            for (var p in blProps) {
              var b = blProps[p];
              if (!b.readOnly  &&  U.getLongUri1(b.range) == self.vocModel.type) {
                self.showAddButton = true;
                break;
              }
            }
          });
        }
      }).then(function() {
        if (!wasContainer  &&  !G.currentUser.guest  &&  U.isAssignableFrom(self.vocModel, 'AccessControl'))
          self.showAddButton = true;
      });
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
      'click #homeBtn'    : 'home',
      'submit'            : 'submit',
      'click .add'        : 'add'
    },

    myEvents: {
      'userSaved': 'submit',
      'userCanceled': 'cancelMulti'
    },

    add: function(e) {
      Events.stopEvent(e);
//      Events.trigger('back');
//      window.history.back();
      var colParams = U.getQueryParams(this.collection),
          meta = this.vocModel.properties;

      colParams = colParams ? _.clone(colParams) : {};
      colParams['-makeId'] = G.nextId();
      var params = _.getParamMap(window.location.href);
      if (params['$type']) {
        var forClass = U.isA(this.vocModel, "Referenceable") ? U.getCloneOf(this.vocModel, 'Referenceable.forClass') : (U.isA(this.vocModel, "Reference") ? U.getCloneOf(this.vocModel, 'Reference.forClass') : null);
        if (forClass  &&  forClass.length)
          colParams[forClass[0]] = params['$type'];
      }
      if (!U.isAssignableFrom(this.vocModel, 'Intersection')) {
        Events.trigger('navigate', U.makeMobileUrl('make', this.vocModel.type, colParams));
        return this;
      }

      var a = U.getCloneOf(this.vocModel, 'Intersection.a')[0];
      var b = U.getCloneOf(this.vocModel, 'Intersection.b')[0];
      var aUri = colParams[a];
      var bUri = colParams[b];
      if (!aUri  &&  !bUri) {
        Events.trigger('navigate', U.makeMobileUrl('make', this.vocModel.type, colParams));
        return this;
      }

      var title = this.hashParams['$title'] || this.getPageTitle(),
          prop = meta[aUri ? b : a],
          params = _.extend({
            $propA: a,
            $propB: b,
            $forResource: aUri || bUri,
            $type: this.vocModel.type,
            $title: title
          }, U.getWhereParams(prop));

      Events.trigger('navigate', U.makeMobileUrl('chooser', prop.range, params));
      return this;
    },

    cancelMulti: function(e) {
      e && Events.stopEvent(e);
      Events.trigger('back', 'canceled multi chooser');
    },

//    windowEvents: {
//      'orientationchange' : 'orientationchange',
//      'resize'            : 'orientationchange'
//    },

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
      e && Events.stopEvent(e);
      var checked = this.listView.$('input:checked');
      if (checked.length) {
        if (!this.checkKYC(checked))
          Events.trigger('choseMulti', this.hashParams.$multiValue, this.filteredCollection, checked);
        return;
      }

      U.alert("Please choose at least one");
//      Errors.errDialog({msg: 'Choose first and then submit', delay: 100});
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
    
    checkKYC: function(checked) {
      if (G.currentApp.appPath != 'KYC'  ||  !U.isAssignableFrom(this.model, 'model/portal/SharedFile')) 
        return false;
      if (this.hashParams.$validVerifier) {
        if (this.resource)      
          U.permission(this.resource, this.hashParams);
        else {                  // route: chose Org, check docs to verify, submit
          var self = this;
          var arr = [];
          for (var i=0; i<checked.length; i++) 
            arr.push(checked[i].value);
          
          this.collection.models.forEach(function(resource) {
            if (arr.indexOf(resource.getUri()) != -1) 
              U.permission(resource, self.hashParams, true);
          })
        }
      }
      else {  // route: chose docs, choseOrg
        var docs = '';
        for (var i=0; i<checked.length; i++) {
          if (docs.length)
            docs += ',';
          docs += checked[i].value;
        } 
        var params = {
            $doc: docs,
            $title: 'Choose the verifying organization'
          }
        Events.trigger('navigate', U.makeMobileUrl('list', (G.currentApp.appPath == 'KYC') ? 'dev/kyc/FinancialOrganization' : 'dev/scm/Validator', params));
      }
      return true;
    },
    
    home: function() {
      var here = window.location.href;
      Events.trigger('navigate', here.slice(0, here.indexOf('#')));
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
      if (!U.isA(this.vocModel, 'Buyable') || (!(buyLink = e.target.$closest('#buyLink')) || buyLink.length == 0)  &&  (!(tryLink = e.target.$closest('#tryLink')) || tryLink.length == 0)) {
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
        userEdit: true,
        success: function(resource, response, options) {
          res._setLastFetchOrigin(null);
          self.redirect(res, {trigger: true, replace: true, forceFetch: true});
        }
      });
    },

    render: function() {
      var args = arguments,
          self = this;

      return this.ready.done(function() {
        Q.write(self.renderHelper, self, args);
      });
    },

    renderHelper: function() {
      var self = this,
          tmpl_data = this.getBaseTemplateData(),
          views = {
            '.headerDiv': this.header
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
//      if (G.theme.backgroundImage) {
//        this.$('#sidebarDiv').$css('background-image', 'url(' + G.theme.backgroundImage +')');
//      }
      if (!this.isMasonry)
        this.$('#sidebarDiv').$css('overflow-x', 'visible');

      this.filter = this.$('.filter')[0];
      if (this.filter) {
        this.$on(this.filter, 'keydown', function(e) {
          self.filter.$trigger('change', {
            view: self.filter,
            bubbles: false,
            cancelable: true
          });
        });
      }

//      this.addToWorld(null, true);
      this.finish();
      return this;
    },

    doFilter: function(filterParams) {
      if (filterParams.type != this.vocModel.type) {
        this.collection.destroy();
        this.filteredCollection.destroy();
        this.stopListening(this.collection);
        this.stopListening(this.filteredCollection);

        this.vocModel = U.getModel(filterParams.type);
        this.collection = new ResourceList(null, {
          model: this.vocModel,
          params: _.clone(filterParams.params)
        });

        this.filteredCollection = this.collection.clone();
        this.listView.setCollection(this.filteredCollection);
      }

      this.listView.doFilter(filterParams);
    }

//    ,
//    buildMockViewPage: function() {
//      var self = this,
//          imgRes;
//
//      if (!this.mockViewPage && U.isA(this.vocModel, 'ImageResource'))
//        $.when(U.require('views/ViewPage'), this.getFetchPromise()).done(function(ViewPage) {
//          if (imgRes = self.collection.find(function(res) { return !!res.get('ImageResource.mediumImage') }))
//            self._buildMockViewPage(ViewPage, imgRes);
//        });
//    },
//
//    _buildMockViewPage: function(ViewPage, imgRes) {
//      var self = this,
//          img,
//          vpInfo;
//
//      this.mockViewPage = new ViewPage({
//        style: {
//          opacity: DOM.maxOpacity
//        },
//        mock: true,
//        model: imgRes
//      });
//
//      this.mockViewPage.render({
//        mock: true,
//        force: true
//      });
//
//      this.mockViewPage.onLoadedImage(function() {
//        img = this.mockViewPage.$('#resourceImage img')[0];
//        this._viewPageImg = img;
//        if (img)
//          this._getViewPageImageInfo();
//        else
//          debugger; // should never happen
//      }, this);
//    },
//
//    _getViewPageImageInfo: function() {
//      var offset = this._viewPageImg.$offset();
//      if (!offset.top)
//        return setTimeout(this._getViewPageImageInfo, 50);
//
//      this.viewPageInfo = {
//        imageTop: offset.top,
//        imageLeft: offset.left
//      };
//
//      this.mockViewPage.destroy();
//    },
//
//    getViewPageInfo: function() {
//      return this.viewPageInfo;
//    }
  }, {
    displayName: 'ListPage'
  });
});
