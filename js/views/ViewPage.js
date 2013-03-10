//'use strict';
define([
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'views/Header',
  'views/BackButton',
  'views/LoginButtons',
  'views/AroundMeButton',
  'views/MenuButton',
  'views/ResourceView',
//  'views/ResourceImageView',
//  'views/PhotogridView',
  'views/ControlPanel'
], function(G, U, Events, BasicView, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, ResourceView, /*ResourceImageView,*/ ControlPanel) {
  return BasicView.extend({
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'swipeleft', 'swiperight', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.model.on('change', this.render, this);
      this.template = this.makeTemplate('resource');
      this.TAG = "ViewPage";
      this.router = G.Router || Backbone.History;
      this.viewId = options.viewId;
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
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.get('_uri')), {trigger: true});
      return this;
    },
//    tap: function() {
//      G.log(this.TAG, 'events');
//      return Events.defaultTapHandler.apply(this, arguments);
//    },
//    click: Events.defaultClickHandler,  
//    click: function(e) {
//      clicked = true;
//      Events.defaultClickHandler(e);  
//    },

    render:function (eventName) {
      var res = this.resource;
      var commonParams = {
        model: res,
        parentView: this
      }
      
      G.log(this.TAG, "render");
      var json = res.attributes;
      json.viewId = this.cid;
      this.$el.html(this.template(json));
      
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton], // no need MapItButton? nope
          log: [LoginButtons]
      };
      
      var commonTypes = G.commonTypes;
      if (!G.currentUser.guest) {
        var user = G.currentUser._uri;
        if (U.isAssignableFrom(res.vocModel, commonTypes.App)) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          if (user == appOwner  &&  (res.get('lastPublished')  &&  res.get('lastModifiedWebClass') > res.get('lastPublished')))
            this.doPublish = true;
          
          var noWebClasses = !res.get('lastModifiedWeblass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = !this.hasPublish && (res.get('lastModifiedWeblass') < res.get('lastPublished'));
          if (res.get('_uri')  != G.currentApp._uri  &&  (noWebClasses ||  wasPublished)) {
            this.doTry = true;
            this.forkMe = true;
          }
        }

        else if (U.isAssignableFrom(res.vocModel, commonTypes.Handler)) {
//          var plugOwner = U.getLongUri1(res.get('submittedBy') || user);
//          if (user == plugOwner)
            this.testPlug = true;            
        }
        else {
          var params = U.getParamMap(window.location.hash);
          if (U.isAssignableFrom(res.vocModel, U.getLongUri1("media/publishing/Video"))  &&  params['-tournament'])
            this.enterTournament = true;
        }
      }
      
      this.header = new Header(_.extend(commonParams, {
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        el: $('#headerDiv', this.el)
      }, _.pick(this, ['doTry', 'doPublish', 'testPlug', 'forkMe', 'enterTournament']))).render();
      
      this.header.$el.trigger('create');
      var viewType, viewDiv;
      if (res.isA('Intersection')) {
        viewType = 'views/PhotogridView';
        viewDiv = 'div#resourceImageGrid';
      }
      else {
        viewType = 'views/ResourceImageView';
        viewDiv = 'div#resourceImage';
      }
      
      var self = this;
      U.require(viewType, function(viewMod) {        
        self.imageView = new viewMod(_.extend(commonParams, {el: $(viewDiv, self.el)}));
        self.imageView.render();
      });
      
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
            var friends = new ResourceList(null, {
              params: {
                $or: U.getQueryString({friend1: uri, friend2: uri}, {delimiter: '||'})
              },
              model: U.getModel(friendType),
              title: U.getDisplayName(res) + "'s" + U.getPlural(friendName)
            });
            
            friends.fetch({
              success: function() {
                if (friends.size()) {
                  var pHeader = self.$('div#photogridHeader');
                  var h3 = pHeader.find('h3');
                  h3[0].innerHTML = friends.title;
                  pHeader.removeClass('hidden');
                  self.photogrid = new PhotogridView({model: friends, parentView: self, el: self.$('div#photogrid', self.el), source: uri});
                  self.photogrid.render();
  //                var header = $('<div data-role="footer" data-theme="{0}"><h3>{1}</h3>'.format(G.theme.photogrid, friends.title));
  //                header.insertBefore(self.photogrid.el);
                }
              }
            });
          });        
        });
      }
      
      this.view = new ResourceView(_.extend(commonParams, {el: $('ul#resourceView', this.el)}));
      this.view.render();
      this.cp = new ControlPanel(_.extend(commonParams, {el: $('ul#cpView', this.el)}));
      this.cp.render();
      if (G.currentUser.guest) {
        this.$('#edit').hide();
      }
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
