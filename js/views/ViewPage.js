//'use strict';
define('views/ViewPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header',
  'views/ResourceView',
  'views/ControlPanel'
], function(G, U, Events, BasicPageView, Header, ResourceView, ControlPanel) {
  return BasicPageView.extend({
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'edit', 'pageChange');
      this.constructor.__super__.initialize.apply(this, arguments);
//      this.resource.on('change', this.render, this);
      var self = this,
          res = this.resource;
      
      this.$el.on('pageshow', function() {
        setTimeout(self.pageChange, 1000);
      });
      
      this.makeTemplate('resource', 'template', this.vocModel.type);
      this.viewId = options.viewId;
      
      var commonTypes = G.commonTypes;
      this.headerButtons = {
        back: true,
        menu: true,
        rightMenu: !G.currentUser.guest,
        login: G.currentUser.guest,
        chat: res.isA("CollaborationPoint")
      };

      var params = U.getParamMap(window.location.hash);
      var isApp = this.isApp = U.isAssignableFrom(res, commonTypes.App);
      var isAbout = this.isAbout = (isApp  &&  !!params['$about']  &&  !!res.get('description')) || !!params['$fs'];
      var commonParams = {
        model: res,
        parentView: this,
        isAbout: isAbout
      }
        
      this.addChild('header', new Header(_.extend({
        viewId: this.cid
      }, commonParams)));

      if (!isAbout) {
        var viewType, viewDiv;
        if (res.isA('Intersection')) {
          var aFeatured = U.getCloneOf(this.vocModel, 'Intersection.aFeatured')[0];
          var bFeatured = U.getCloneOf(this.vocModel, 'Intersection.bFeatured')[0];
          if ((aFeatured  &&  res.get(aFeatured))  || (bFeatured  &&  res.get(bFeatured))) {
            viewType = 'views/PhotogridView';
            this.imgDiv = 'div#resourceImageGrid';
          }
        }
        if (!this.imgDiv) {
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

//      this.hasChat = U.isUserInRole(U.getUserRole(), 'admin', res);
//      if (this.hasChat && !this.chat) {
//        this.chatDfd = $.Deferred();
//        this.chatPromise = this.chatDfd.promise();
//        require('views/ChatView', function(chat) {
//          self.addChild('chat', new chat(_.extend({el: this.$('#chatbox'), video: true}, commonParams)));
//          self.chatDfd.resolve();
//        });
//      }
      
//      this.cpMain = new ControlPanel(_.extend(commonParams, {el: $('div#mainGroup', this.el), isMainGroup: true}));
      if (!isAbout) {
        this.addChild('cpMain', new ControlPanel(_.extend({isMainGroup: true}, commonParams)));
        this.addChild('cp', new ControlPanel(_.extend({isMainGroup: false}, commonParams)));
      }  
      
      this.isPurchasable = res.isOneOf(["ItemListing","Buyable"]);
      if (this.isPurchasable) 
        this.addChild('buyGroup', new ResourceView(_.extend({isBuyGroup: true}, commonParams)));
        
      this.addChild('view', new ResourceView(commonParams));
      this.photogridDfd = $.Deferred();
      this.photogridPromise = this.photogridDfd.promise();
      var commonTypes = G.commonTypes;
//      var inlineXBacklinks = U.getPropertiesWith(this.vocModel.properties, [{name: "displayInline", value: true}, {name: "backLink"}], true);
//      if (_.size(inlineXBacklinks)) {
//        this.doInlineBacklinks(inlineXBacklinks);
//      }
      
      var isApp = U.isAssignableFrom(res, commonTypes.App);
      var isUrbien = U.isAssignableFrom(res, commonTypes.Urbien);
      var isArtist = U.isAssignableFrom(res, U.getTypeUri('classifieds/movies/Artist')) || res.type.endsWith("/Artist");
      var isMovie = U.isAssignableFrom(res, U.getTypeUri('classifieds/movies/Movie')) || res.type.endsWith("/Movie");
      if (isApp || isUrbien || isArtist  ||  isMovie) {
        var uri = res.getUri();
        var friendType, friendName, title = 'Friends', friend1 = 'friend1', friend2 = 'friend2';
        if (isApp) {
          friendType = commonTypes.FriendApp;
          friendName = 'Connection'
        }
        else if (isUrbien) {
          friendType = commonTypes.Friend;
          friendName = 'Friend';
        }
        else if (isArtist) {
//          friendType = 'http://urbien.com/voc/dev/Impress/ArtistImpression';
          friendType = 'http://urbien.com/voc/dev/ImpressBackup/ArtistImpression';
          friendName = 'ArtistImpression';
          title = 'Impressions';
          friend1 = 'impression';
          friend2 = 'artist';
        }
        else if (isMovie) {
  //        friendType = 'http://urbien.com/voc/dev/Impress/ArtistImpression';
          friendType = 'http://urbien.com/voc/dev/ImpressBackup/MovieImpression';
          friendName = 'MovieImpression';
          title = 'Impressions';
          friend1 = 'impression';
          friend2 = 'movie';
        }

        this.onload(function() {          
          U.require(['collections/ResourceList', 'vocManager', 'views/PhotogridView'], function(ResourceList, Voc, PhotogridView) {
            Voc.getModels(friendType).done(function() {              
              var friendProps = {};
              friendProps[friend1] = friendProps[friend2] = uri;
              self.friends = new ResourceList(null, {
                params: {
                  $or: U.getQueryString(friendProps, {delimiter: '||'})
                },
                model: U.getModel(friendType),
                title: title //U.getDisplayName(res) + "'s " + U.getPlural(friendName)
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
        });
      }
      
      Events.on("mapReady", this.showMapButton);
    },
//    doInlineBacklinks: function(bls) {
//      var ranges = _.pluck(bls, "range");
//      this.inlineXBacklinks = [];
//      Voc.getModels(ranges).done(function() {
//        _.each(inlineXBacklinks, function(bl) {
//          var range = bl.range;
//          var model = U.getModel(U.getTypeUri(range));
//          if (U.isA(model, "Intersection")) {
//            bl._model = model;
//            self.inlineXBacklinks.push(bl);
//          }
//        });
//        
//        if (this.inlineXBacklinks.length) {
//          require(['collections/ResourceList', 'views/PhotogridView'], function(ResourceList, PhotogridView) {
//            _.each(self.inlineXBacklinks, function() {                
//              self.friends = new ResourceList(null, {
//                params: {
//                  $or: U.getQueryString({friend1: uri, friend2: uri}, {delimiter: '||'})
//                },
//                model: U.getModel(friendType),
//                title: 'Friends' //U.getDisplayName(res) + "'s " + U.getPlural(friendName)
//              });
//              
//              self.friends.fetch({
//                success: function() {
//                  if (self.friends.size()) {
//                    self.addChild('photogrid', new PhotogridView({model: self.friends, parentView: self, source: uri, swipeable: true}));
//                    self.photogridDfd.resolve();
//    //                var header = $('<div data-role="footer" data-theme="{0}"><h3>{1}</h3>'.format(G.theme.photogrid, friends.title));
//    //                header.insertBefore(self.photogrid.el);
//                  }
//                }
//              });
//            })
//          });
//        }
//      });
//    },
    events: {
      'vclick #edit': 'edit',
//      'click': 'click',
      'vclick #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
//        ,
//      'pagechange': 'pageChange'
    },
    pageChange: function(e) {
      if (this.hashParams.$tour) {
        var selector = '[' + this.hashParams.$tourSelector + ']';
        
        var elm = this.$el.find(selector);
        var direction = this.hashParams.$tourD;
        if (!direction)
          direction = 'left';
        elm.addClass('hint--' + direction + ' hint--always');
        elm.attr('data-hint', this.hashParams.$tourM);
      }
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

    render: function() {
      var res = this.resource;
      var json = res.toJSON();
      json.viewId = this.cid;
      this.$el.html(this.template(json));      
      var self = this;
      this.photogridPromise.done(function() {        
        var pHeader = self.$('div#photogridHeader');
        var h3 = pHeader.find('h3');
        h3[0].innerHTML = self.friends.title;
        pHeader.removeClass('hidden');
        self.assign({
          'div#photogrid': self.photogrid
        });
      });

//      this.chatPromise && this.chatPromise.done(function() {        
//        var chatbox = self.$('div#chatbox');
//        self.assign({
//          'div#chatbox': self.chat
//        });
//      });

      var viewTag = this.isAbout  &&  this.isApp ? 'div#about' : 'ul#resourceView';
      var views = {};
      views[viewTag] = this.view;
      if (this.cp)
        views['ul#cpView'] = this.cp;
      if (this.cpMain)
        views['div#mainGroup'] = this.cpMain;

      if (this.isPurchasable) 
        views['div#buyGroup'] = this.buyGroup;         
      
//      var isGeo = this.isGeo();
//      this.headerButtons.aroundMe = isGeo;
      
      
      this.assign('#headerDiv', this.header, {buttons: this.headerButtons});
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
      this.$el.attr("data-theme", G.theme.swatch);
      if (G.theme.backgroundImage) 
        this.$('#resourceViewHolder').css('background-image', 'url(' + G.theme.backgroundImage +')');

      this.$('#chatbox').css("display", "none");      
//      renderDfd.resolve();
//      this.restyle();
      
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
