//'use strict';
define([
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/Header',
//  'views/BackButton',
//  'views/LoginButton',
//  'views/AroundMeButton',
//  'views/MenuButton',
  'views/ResourceView',
//  'views/ResourceImageView',
//  'views/PhotogridView',
  'views/ControlPanel'
], function(G, U, Events, BasicView, Header, /*BackButton, LoginButton, AroundMeButton, MenuButton,*/ ResourceView, /*ResourceImageView,*/ ControlPanel) {
  return BasicView.extend({
    TAG: 'ViewPage',
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'swipeleft', 'swiperight', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
//      this.resource.on('change', this.render, this);
      this.makeTemplate('resource', 'template', this.vocModel.type);
      this.TAG = "ViewPage";
      this.router = G.Router || Backbone.History;
      this.viewId = options.viewId;
      
      var res = this.resource;
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      
//      this.buttons = {
//        left: [BackButton],
//        right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton],
//        log: [LoginButton]
//      };

      var commonTypes = G.commonTypes;
      this.buttons = {
        back: true,
        aroundMe: isGeo,
        menu: true,
        rightMenu: !G.currentUser.guest,
        login: G.currentUser.guest
      };

      var params = U.getParamMap(window.location.hash);
      var isApp = this.isApp = U.isAssignableFrom(res, commonTypes.App);
      var isAbout = this.isAbout = (isApp  &&  !!params['$about']  &&  !!res.get('description')) || !!params['$fullScreen'];
      var commonParams = {
        model: res,
        parentView: this,
        isAbout: isAbout
      }
        
      this.addChild('header', new Header(_.extend({
        buttons: this.buttons,
        viewId: this.cid
      }, commonParams)));

      if (!isAbout) {
        var viewType, viewDiv;
        if (res.isA('Intersection')) {
          viewType = 'views/PhotogridView';
          this.imgDiv = 'div#resourceImageGrid';
        }
        else {
          viewType = 'views/ResourceImageView';
          this.imgDiv = 'div#resourceImage';
        }
      }
      
      var self = this;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      if (viewType) {
      U.require(viewType, function(viewMod) {
        self.addChild('imageView', new viewMod(_.extend({el: $(this.imgDiv, self.el), arrows: false}, commonParams)));
        self.readyDfd.resolve();
//        renderDfd.done(self.imageView.finalize);
      });
      }

//      this.cpMain = new ControlPanel(_.extend(commonParams, {el: $('div#mainGroup', this.el), isMainGroup: true}));
      if (!isAbout) {
        this.addChild('cpMain', new ControlPanel(_.extend({isMainGroup: true}, commonParams)));
        this.addChild('cp', new ControlPanel(_.extend({isMainGroup: false}, commonParams)));
      }  
      
      this.addChild('view', new ResourceView(commonParams));
      this.photogridDfd = $.Deferred();
      this.photogridReady = this.photogridDfd.promise();
      var commonTypes = G.commonTypes;
      var isApp = U.isAssignableFrom(res, commonTypes.App);
      var isUrbien = U.isAssignableFrom(res, commonTypes.Urbien);
      if (isApp || isUrbien) {
        var uri = res.getUri();
        var friendType, friendName;
        if (isApp) {
          friendType = commonTypes.FriendApp;
          friendName = 'Connection'
        }
        else {
          friendType = commonTypes.Friend;
          friendName = 'Friend';
        }

        U.require(['collections/ResourceList', 'vocManager', 'views/PhotogridView'], function(ResourceList, Voc, PhotogridView) {
          Voc.getModels(friendType).done(function() {              
            self.friends = new ResourceList(null, {
              params: {
                $or: U.getQueryString({friend1: uri, friend2: uri}, {delimiter: '||'})
              },
              model: U.getModel(friendType),
              title: 'Friends' //U.getDisplayName(res) + "'s " + U.getPlural(friendName)
            });
            
            self.friends.fetch({
              success: function() {
                if (self.friends.size()) {
                  self.addChild('photogrid', new PhotogridView({model: self.friends, parentView: self, source: uri, swipeable: true}));
                  self.photogridDfd.resolve();
  //                var header = $('<div data-role="footer" data-theme="{0}"><h3>{1}</h3>'.format(G.theme.photogrid, friends.title));
  //                header.insertBefore(self.photogrid.el);
                }
              }
            });
          });        
        });
      }
      
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
//      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },
    swipeleft: function(e) {
      // open backlinks
      G.log(this.TAG, 'events', 'swipeleft');
    },
    swiperight: function(e) {
      // open menu
      G.log(this.TAG, 'events', 'swiperight');
    },
    home: function() {
//      this.router.navigate(G.homePage, {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
//      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.getUri()), {trigger: true});
      return this;
    },
    
    render: function(options) {
      var res = this.resource;
      var json = res.toJSON();
      json.viewId = this.cid;
      this.$el.html(this.template(json));      
      var self = this;
      this.photogridReady.done(function() {        
        var pHeader = self.$('div#photogridHeader');
        var h3 = pHeader.find('h3');
        h3[0].innerHTML = self.friends.title;
        pHeader.removeClass('hidden');
        self.assign({
          'div#photogrid': self.photogrid
        });
      });

      var viewTag = this.isAbout  &&  this.isApp ? 'div#about' : 'ul#resourceView';
      var views = {
        '#headerDiv'           : this.header
      };
      
      views[viewTag] = this.view;
      if (this.cp)
        views['ul#cpView'] = this.cp;
      if (this.cpMain)
        views['div#mainGroup'] = this.cpMain;
      
      this.assign(views);
      this.ready.done(function() {
        this.assign(this.imgDiv, this.imageView);
      }.bind(this));
      
      if (!this.isAbout) {
        if (G.currentUser.guest) {
          this.$('#edit').hide();
        }
      }       
     
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
//      renderDfd.resolve();
//      this.restyle();
      
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
