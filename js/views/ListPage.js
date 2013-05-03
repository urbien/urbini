//'use strict';
define([
  'globals',
  'events', 
  'utils',
  'error',
  'views/BasicView',
  'views/ResourceListView', 
  'views/Header' 
], function(G, Events, U, Errors, BasicView, ResourceListView, Header) {
  var MapView;
  return BasicView.extend({
    template: 'resource-list',
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'submit', 'swipeleft', 'click', 'swiperight', 'pageshow', 'pageChanged', 'setMode', 'orientationchange');
      this.constructor.__super__.initialize.apply(this, arguments);
      Events.on('pageChange', this.pageChanged);
      this.mode = options.mode || G.LISTMODES.DEFAULT;
//      this.options = _.pick(options, 'checked', 'props');
      this.viewId = options.viewId;
      
      var rl = this.collection;
      var self = this;
      
      var commonParams = {
        model: rl,
        parentView: this
      };
      
      var hash = window.location.hash;
      var json = this.json = rl.toJSON();      
      json.viewId = this.cid;
      var vocModel = this.vocModel;
      var type = vocModel.type;
      this.makeTemplate(this.template, 'template', type);
      var viewMode = vocModel.viewMode;
      var isList = this.isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isChooser = hash  &&  hash.indexOf('#chooser/') == 0;  
      var isMasonry = json.isMasonry = this.isMasonry = !isChooser  &&  (vocModel.type.endsWith('/Tournament') || vocModel.type.endsWith('/Theme') || vocModel.type.endsWith('/App') || 
                                                        vocModel.type.endsWith('/Goal')             ||  
                                                        vocModel.type.endsWith('/Movie')            ||
                                                        U.isA(this.vocModel, "VideoResource")       || 
                                                        vocModel.type.endsWith('/ThirtyDayTrial')); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
      var isOwner = !G.currentUser.guest  &&  G.currentUser._uri == G.currentApp.creator;
      this.isPhotogrid = _.contains([G.commonTypes.Handler/*, commonTypes.FriendApp*/], type);
      /*
      if (!this.isPhotogrid) {
        if (U.isA(this.vocModel, "Intersection")) {
          var af = U.getCloneOf(this.vocModel, 'Intersection.aFeatured');
          var bf = U.getCloneOf(this.vocModel, 'Intersection.bFeatured');
          if (af.length  &&  bf.length)
            this.isPhotogrid = true;
        }
      }
      */
      var isGeo = this.isGeo = this.isGeo(); // && _.any(rl.models, function(m) {return !_.isUndefined(m.get('latitude')) || !_.isUndefined(m.get('shapeJson'))});
      if (isGeo) {
        this.mapReadyDfd = $.Deferred();
        this.mapReady = this.mapReadyDfd.promise();
        U.require(['views/MapView'], function(MV) {
          MapView = MV;
          this.addChild('mapView', new MapView(commonParams));
          this.mapReadyDfd.resolve();
        }, this);
      }      

      var showAddButton = (!isChooser  &&  type.endsWith('/App')) || U.isAnAppClass(type) || (vocModel.skipAccessControl  &&  (isOwner  ||  (rl.models.length  &&  U.isUserInRole(U.getUserRole(), 'siteOwner', rl.models[0]))));
      if (showAddButton  &&  U.isA(this.vocModel, "Reference"))
        showAddButton = false;
      var idx;
      if (!showAddButton && hash  &&  (idx = hash.indexOf('?')) != -1) {
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

      this.headerButtons = {
        back: true,
        add: showAddButton,
        aroundMe: isGeo,
        mapIt: isGeo,
        menu: true,
        rightMenu: !G.currentUser.guest,
        login: G.currentUser.guest
      };

      this.addChild('header', new Header(_.extend({
        buttons: this.headerButtons,
        viewId: this.cid
      }, commonParams)));
      
      
      var models = rl.models;
      var isModification = U.isAssignableFrom(vocModel, U.getLongUri1('system/changeHistory/Modification'));

      var meta = vocModel.properties;
      var isComment = this.isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(vocModel, U.getLongUri1('model/portal/Comment'));

      var params = hash ? U.getParamMap(hash) : null;
      var isMV = this.isMV = params  &&  params['$multiValue'] != null;
      this.isEdit = (params  &&  params['$editList'] != null); // || U.isAssignableFrom(vocModel, G.commonTypes.CloneOfProperty);
      this.listContainer = isMV ? '#mvChooser' : (isModification || isMasonry ? '#nabs_grid' : (isComment) ? '#comments' : (this.isEdit ? '#editRlList' : '#sidebar'));
      this.addChild('listView', new ResourceListView(_.extend({mode: this.mode}, commonParams , this.options)));
      this.canSearch = !this.isPhotogrid; // for now - search + photogrid results in something HORRIBLE, try it if you're feeling brave
    },
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw new Error('this view doesn\'t have a mode ' + mode);
      
      this.mode = mode;
      if (this.listView)
        this.listView.setMode(mode);
    },
    events: {
      'click': 'click',
      'click #nextPage': 'getNextPage',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft',
      'pageshow': 'pageshow',
      'submit': 'submit',
      'orientationchange': 'orientationchange',
      'resize': 'orientationchange'
    },
    swipeleft: function(e) {
      // open backlinks
    },
    swiperight: function(e) {
//      // open menu
//      var menuPanel = new MenuPanel({viewId: this.cid, model: this.model});
//      menuPanel.render();
////      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(1)), {trigger: true, replace: false});
    },
    orientationchange: function(e) {
      var isChooser = window.location.hash  &&  window.location.hash.indexOf('#chooser/') == 0;  
      var isMasonry = this.isMasonry = !isChooser  &&  (this.vocModel.type.endsWith('/Tournament')                  || 
                                                        this.vocModel.type.endsWith('/Theme')                       || 
                                                        this.vocModel.type.endsWith('/Goal')                        ||
                                                        U.isA(this.vocModel, "VideoResource")                       ||
                                                        this.vocModel.type.endsWith('/Movie')                       ||
                                                        this.vocModel.type.endsWith('/App')                         || 
//                                                        vocModel.type.endsWith('/NominationForConnecttion')    || 
                                                        this.vocModel.type.endsWith('/ThirtyDayTrial')); //  ||  vocModel.type.endsWith('/Vote'); //!isList  &&  U.isMasonry(vocModel); 
      if (isMasonry) {
        Events.stopEvent(e);
        Events.trigger('refresh', {model: this.model}); //, checked: checked});
      } 
    },
    submit: function(e) {
//      Events.stopEvent(e);
//      var isEdit = (this.action === 'edit');
//      if (p && p.mode == G.LISTMODES.CHOOSER) {
      Events.stopEvent(e);
      var checked = this.$('input:checked');
      var editList = this.$('input:[data-formel]');
      if (checked.length) {
        Events.trigger('chooser:' + U.getQueryParams().$multiValue, {model: this.model, checked: checked});
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
    pageshow: function(e) {
      G.log(this.TAG, 'events', 'pageshow');
/*
*      if (this.isMasonry)
*        $('#nabs_grid', this.$el).masonry();
*/
    },
    pageChanged: function(view) {
//      G.log(this.TAG, 'events', 'pageChanged');
//      this.visible = (this == view || this.listView == view);
//      this.listView && (this.listView.visible = this.visible);
    },
    home: function() {
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    getNextPage: function() {
      if (this.isActive())
        this.listView && this.listView.getNextPage();
    },
  //  nextPage: function(e) {
  //    Events.trigger('nextPage', this.resource);    
  //  },
//    tap: Events.defaultTapHandler,
    click: function(e) {
      clicked = true;
      var buyLink;
      var tryLink;
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
          if (response.error) {
            onSaveError(resource, response, options);
            return;
          }
          
          res.lastFetchOrigin = null;
          self.redirect(res, {trigger: true, replace: true, forceFetch: true});
        }
      });
    },
    
    render: function() {
      var json = this.json;
      this.$el.html(this.template(json));
      var views = {
        '#headerDiv': this.header
      };
      
      views[this.listContainer] = this.listView;
      this.assign(views);
        
      this.mapReady && this.mapReady.done(function() {
        this.assign('#mapHolder', this.mapView);  
      }.bind(this));
      
      if (!this.$el.parentNode)  
        $('body').append(this.$el);
      if (!this.isMV)
        $('form#mv').hide();
      if (!this.isEdit)
        $('form#editRlForm').hide();
      if (this.isPhotogrid) {
        this.listView.$el.addClass('grid-listview');
//        this.listView.$el.find('ul').removeClass('grid-listview');
      }
      
      if (G.theme.backgroundImage) { 
        this.$('#sidebarDiv').css('background-image', 'url(' + G.theme.backgroundImage +')');
      }
      return this;
    }
  }, {
    displayName: 'ListPage'
  });
});
