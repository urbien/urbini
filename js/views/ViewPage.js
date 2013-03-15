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
//      this.resource.on('change', this.render, this);
      this.template = this.makeTemplate('resource');
      this.TAG = "ViewPage";
      this.router = G.Router || Backbone.History;
      this.viewId = options.viewId;
      
      var res = this.resource;
      var commonParams = {
        model: res,
        parentView: this
      }
      
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      
      this.buttons = {
        left: [BackButton],
        right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton],
        log: [LoginButtons]
      };

      this.header = new Header(_.extend(commonParams, {
        buttons: this.buttons,
        viewId: this.cid,
        el: $('#headerDiv', this.el)
      }, _.pick(this, ['doTry', 'doPublish', 'testPlug', 'forkMe', 'enterTournament'])));

      var viewType, viewDiv;
      if (res.isA('Intersection')) {
        viewType = 'views/PhotogridView';
        this.imgDiv = 'div#resourceImageGrid';
      }
      else {
        viewType = 'views/ResourceImageView';
        this.imgDiv = 'div#resourceImage';
      }
      
      var self = this;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      U.require(viewType, function(viewMod) {
        self.imageView = new viewMod(_.extend(commonParams, {el: $(this.imgDiv, self.el), arrows: false}));
        self.readyDfd.resolve();
//        renderDfd.done(self.imageView.finalize);
      });

      this.cpMain = new ControlPanel(_.extend(commonParams, {el: $('div#mainGroup', this.el), isMainGroup: true}));
      this.view = new ResourceView(_.extend(commonParams, {el: $('ul#resourceView', this.el)}));
      this.cp = new ControlPanel(_.extend(commonParams, {el: $('ul#cpView', this.el), isMainGroup: false}));
      
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
            var friends = new ResourceList(null, {
              params: {
                $or: U.getQueryString({friend1: uri, friend2: uri}, {delimiter: '||'})
              },
              model: U.getModel(friendType),
              title: U.getDisplayName(res) + "'s " + U.getPlural(friendName)
            });
            
            friends.fetch({
              success: function() {
                if (friends.size()) {
                  var pHeader = self.$('div#photogridHeader');
                  var h3 = pHeader.find('h3');
                  h3[0].innerHTML = friends.title;
                  pHeader.removeClass('hidden');
                  self.photogrid = new PhotogridView({model: friends, parentView: self, el: self.$('div#photogrid', self.el), source: uri});
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
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.get('_uri')), {trigger: true});
      return this;
    },
    
    render: function() {
      var self = this, args = arguments;
      this.ready.done(function() {
        self.renderHelper.apply(self, args);
      })
    },
    
    renderHelper: function (eventName) {
      G.log(this.TAG, "render");
      var res = this.resource;
      var json = res.toJSON();
      json.viewId = this.cid;
      this.$el.html(this.template(json));

      var commonTypes = G.commonTypes;
      if (!G.currentUser.guest) {
        var user = G.currentUser._uri;
        if (U.isAssignableFrom(res.vocModel, commonTypes.App)) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          var lastPublished = res.get('lastPublished');
          if (user == appOwner  &&  !lastPublished || res.get('lastModifiedWebClass') > lastPublished)
            this.doPublish = true;
          
          var noWebClasses = !res.get('lastModifiedWeblass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = !this.hasPublish && (res.get('lastModifiedWeblass') < res.get('lastPublished'));
          if (/*res.get('_uri')  != G.currentApp._uri  &&  */ (noWebClasses ||  wasPublished)) {
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
      
      
      var self = this;
      this.photogridReady.done(function() {        
        self.assign({
          'div#photogridHeader': self.photogrid
        });
      });

      var views = {
        '#headerDiv'           : this.header,
        'ul#resourceView'      : this.view,
        'ul#cpView'            : this.cp,
        'div#mainGroup'        : this.cpMain
      };
      
      views[this.imgDiv] = this.imageView; 
      this.assign(views);
      
//      this.imageView.render();
//      this.header.render();
//      this.header.$el.trigger('create');
//      this.cpMain.render();
//      this.view.setElement($('ul#resourceView', this.el)).delegateEvents().render();
//      this.cp.render();
      if (G.currentUser.guest) {
        this.$('#edit').hide();
      }

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
//      renderDfd.resolve();
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
