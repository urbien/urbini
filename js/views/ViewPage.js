//'use strict';
define('views/ViewPage', [
  'globals',
  'utils',
  'events',
  'views/BasicPageView',
  'views/Header',
  'views/ResourceView',
  'views/ControlPanel',
  'lib/fastdom'
], function(G, U, Events, BasicPageView, Header, ResourceView, ControlPanel, Q) {
  var SOCIAL_LINKS_SELECTOR = '.socialLinks';

  return BasicPageView.extend({
    clicked: false,
//    style: {
//      overflow: 'visible' // because resourceViewHolder is absolutely positioned, so we can't use the size of the container (this view) as a natural boundary
//    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'home', 'edit', 'pageChange');
      BasicPageView.prototype.initialize.apply(this, arguments);
//      this.resource.on('change', this.render, this);
      var self = this,
          res = this.resource,
          isTradle = res.isAssignableFrom('commerce/trading/Tradle');

//      this.$el.on('page_show', function() {
//        setTimeout(self.pageChange, 1000);
//      });

      if (options.style)
        _.extend(this.style, options.style);

      this.makeTemplate('resource', 'template', this.vocModel.type);
      this.viewId = options.viewId;

      var commonTypes = G.commonTypes;
      this.headerButtons = ['back', 'rightMenu'];

      var params = _.getParamMap(window.location.hash);
      var isApp = this.isApp = U.isAssignableFrom(res, commonTypes.App);
      var isAbout = this.isAbout = (isApp  &&  !!params['$about']  &&  !!res.get('description')) || !!params['$fs'];
      var commonParams = this.commonChildViewParams = {
        model: res,
        parentView: this,
        isAbout: isAbout
      };

      this.header = new Header(_.extend({
        viewId: this.cid
      }, commonParams));

      this.addChild(this.header);


      if (!this.isAbout  &&  !isTradle) {
        var viewType, viewDiv;
        if (res.isA('Intersection')) {
          var aFeatured = U.getCloneOf(this.vocModel, 'Intersection.aFeatured')[0];
          var bFeatured = U.getCloneOf(this.vocModel, 'Intersection.bFeatured')[0];
//          if ((aFeatured  &&  res.get(aFeatured))  || (bFeatured  &&  res.get(bFeatured))) {
//            viewType = 'views/PhotogridView';
//            this.imgDiv = 'div#resourceImageGrid';
//          }
        }
        if (!this.imgDiv) {
          viewType = 'views/ResourceImageView';
          this.imgDiv = 'div#resourceImage';
        }
      }

      var self = this;
//      var readyDfd = $.Deferred();
//      this.ready = readyDfd.promise();
//      this.resource.fetch({
//        success: readyDfd.resolve,
//        error: readyDfd.reject
//      });

      this.imgReadyDfd = $.Deferred();
      this.imgReady = this.imgReadyDfd.promise();
      if (viewType) {
        U.require(viewType, function(viewMod) {
          self.imageView = new viewMod(_.extend({
            el: self.$(self.imgDiv)[0],
            arrows: false
          }, commonParams));

          self.addChild(self.imageView);
          self.imgReadyDfd.resolve();
//          self._onViewportDimensionsChanged();
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
        // this.cpMain = new ControlPanel(_.extend({isMainGroup: true}, commonParams));
        // this.addChild(this.cpMain);
        this.cp = new ControlPanel(_.extend({isMainGroup: false}, commonParams));
        this.addChild(this.cp);
      }

      this.isPurchasable = res.isOneOf(["ItemListing","Buyable"]);
//      if (this.isPurchasable) {
//        this.buyGroup = new ResourceView(_.extend({isBuyGroup: true}, commonParams));
//        this.addChild(this.buyGroup);
//      }
      this.isImageCover = U.isA(this.vocModel, 'ImageCover')  &&  U.getCloneOf(this.vocModel, 'ImageCover.coverPhoto');

      this.resourceView = new ResourceView(commonParams);
      this.addChild(this.resourceView);
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
      if (!options.mock && (isApp || isUrbien || isArtist  ||  isMovie)) {
        var uri = res.getUri();
        var friendType, friendName, title = 'Friends', friendProp; //, friend1 = 'friend1', friend2 = 'friend2';
        if (isApp) {
          friendType = commonTypes.FriendApp;
          friendName = 'Connection';
          friendProp = 'friend1';
        }
        else if (isUrbien) {
          friendType = commonTypes.Friend;
          friendName = 'Friend';
          friendProp = 'friend1';
        }
        else if (isArtist) {
//          friendType = 'http://urbien.com/voc/dev/Impress/ArtistImpression';
          friendType = 'http://urbien.com/voc/dev/ImpressBackup/ArtistImpression';
          friendName = 'ArtistImpression';
          title = 'Impressions';
//          friend1 = 'impression';
//          friend2 = 'artist';
          friendProp = isArtist ? 'artist' : 'impression';
        }
        else if (isMovie) {
  //        friendType = 'http://urbien.com/voc/dev/Impress/ArtistImpression';
          friendType = 'http://urbien.com/voc/dev/ImpressBackup/MovieImpression';
          friendName = 'MovieImpression';
          title = 'Impressions';
//          friend1 = 'impression';
//          friend2 = 'movie';
          friendProp = isMovie ? 'movie' : 'impression';
        }

        this.onload(function() {
          U.require(['collections/ResourceList', 'vocManager', 'views/HorizontalListView'], function(ResourceList, Voc, HorizontalListView) {
            Voc.getModels(friendType).done(function(friendModel) {
              var friendProps = {};
              friendProps[friendProp] = uri; //friendProps[friend2] = uri;
              self.friends = new ResourceList(null, {
//                params: {
//                  $or: U.getQueryString(friendProps, {delimiter: '||'})
//                },
                params: friendProps,
                model: friendModel,
                title: title //U.getDisplayName(res) + "'s " + U.getPlural(friendName)
              });

              self.friends.fetch({
                success: function() {
                  if (!self.photogrid && self.friends.size()) {
                    var photogridEl = self.el.$('.photogrid')[0];
                    photogridEl.$show();
                    self.photogrid = new HorizontalListView({
                      el: photogridEl,
                      model: self.friends,
                      parentView: self,
                      source: uri
                    });

//                    self.photogrid = new PhotogridView({model: self.friends, parentView: self, source: uri, swipeable: true});
                    self.addChild(self.photogrid);
                    self.photogridDfd.resolve();
    //                var header = $('<div data-role="footer" data-theme="{0}"><h3>{1}</h3>'.format(G.theme.photogrid, friends.title));
    //                header.insertBefore(self.photogrid.el);
                  }
                }
              });
            });

            if (self.resource.isAssignableFrom("model/workflow/Alert") && !self.resource.get('markedAsRead')) {
              self.resource.save({
                markedAsRead: true
              }, {
                userEdit: true
              });
            }
          });
        });
      }

      this.hasSocialLinks = isTradle && !G.currentUser.guest;
      if (this.hasSocialLinks) {
        self.socialLinksPromise = U.require('views/SocialLinksView', function(viewMod) {
          self.socialLinks = new viewMod(_.extend({
            el: self.$(SOCIAL_LINKS_SELECTOR)[0]
          }, commonParams));

          self.addChild(self.socialLinks);
        });
      }

      this.listenTo(Events, "mapReady", this.showMapButton);
      this.getFetchPromise().done(this.resource.fetchInlinedLists);
    },
//    _updateSize: function() {
//      try {
//        return this.resourceView._updateSize();
//      } finally {
//        _.extend(this, _.pick(this.resourceView, '_outerHeight', '_outerWidth', '_width', '_height', '_bounds'));
//      }
//    },
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
//                    self.photogrid = new PhotogridView({model: self.friends, parentView: self, source: uri, swipeable: true});
//                    self.addChild(self.photogrid);
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
      'page_show': function() { setTimeout(this.pageChange, 1000) },
      'click #edit': 'edit',
//      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight.viewPage': 'swiperight',
      'swipeleft.viewPage': 'swipeleft'
//        ,
//      'pagechange': 'pageChange'
    },

    pageChange: function(e) {
      if (this.hashParams.$tour) {
        var selector = '[' + this.hashParams.$tourSelector + ']';

        var elm = this.$(selector);
        var direction = this.hashParams.$tourD;
        if (!direction)
          direction = 'left';

        elm.classList.add('hint--' + direction + ' hint--always');
        elm.$data('hint', this.hashParams.$tourM);
      }
    },

    home: function() {
//      this.router.navigate(G.homePage, {trigger: true, replace: false});
      var here = window.location.href;
      Events.trigger('navigate', here.slice(0, here.indexOf('#')));
      return this;
    },

    edit: function(e) {
      Events.stopEvent(e);
//      e.preventDefault();
      this.router.navigate('edit/' + _.encode(this.resource.getUri()), {trigger: true});
      return this;
    },

    render: function(options) {
      options = options || {};
      if (!this.rendered && !options.mock)
        this.addToWorld(null, true); // auto-add view page brick

      var self = this,
          res = this.resource;
          viewTag = this.isAbout  &&  this.isApp ? '#about' : '#resourceView',
          views = {};

      this.html(this.template(this.getBaseTemplateData()));
      this.photogridPromise.done(function() {
        self.assign({
          '.photogrid': self.photogrid
        }, options);

        self.photogrid.onload(Q.write.bind(Q, function() {
          var pHeader = self.$('.thumb-gal-header')[0];
          var h3 = pHeader.querySelector('h3');
          if (h3)
            h3.innerHTML = self.friends.title;

          pHeader.classList.remove('hidden');
          self.getPageView().invalidateSize();
//          self.invalidateSize();
        }));
      });

//      this.chatPromise && this.chatPromise.done(function() {
//        var chatbox = self.$('div#chatbox');
//        self.assign({
//          'div#chatbox': self.chat
//        });
//      });

      if (!options.mock) {
        views[viewTag] = this.resourceView;
        if (this.cp)
          views['#cpView'] = this.cp;
        if (this.cpMain)
          views['#mainGroup'] = this.cpMain;
      }

//      var isGeo = this.isGeo();
//      this.headerButtons.aroundMe = isGeo;


      this.assign('.headerDiv', this.header, _.extend({buttons: this.headerButtons}, options));
      this.assign(views);
      this.imgReady.done(function() {
        self.assign(self.imgDiv, self.imageView, options);
      });

      if (this.hasSocialLinks) {
        this.socialLinksPromise.done(function() {
          self.assign(SOCIAL_LINKS_SELECTOR, self.socialLinks, options);
        });
      }

      if (!options.mock && this.isPurchasable && !this.buyGroup && this.el.querySelector('#buyGroup')) {
        this.getFetchPromise().done(function() {
          if (res.get('price') == null)
            return;

          var purchasesBLProp;
          self.buyGroup = new ResourceView(_.extend({isBuyGroup: true}, self.commonChildViewParams));
          self.addChild(self.buyGroup);

          if (res.isA("ItemListing"))
            purchasesBLProp = U.getCloneOf(self.vocModel, "ItemListing.ordersPlaced")[0];
          else if (res.isA("Buyable"))
            purchasesBLProp = U.getCloneOf(self.vocModel, "Buyable.orderItems")[0];

          if (purchasesBLProp) {
            self.isBuyGroup = true;
//            self.purchasesBLProp = purchasesBLProp;
//            views['div#buyGroup'] = self.buyGroup;
            self.assign('#buyGroup', self.buyGroup);
          }
          else
            self.isBuyGroup = false;
        });
      }

      if (!this.isAbout) {
        if (G.currentUser.guest) {
          this.$('#edit').$hide();
        }
      }

//      this.el.$data('theme', G.theme.swatch);
//      if (G.theme.backgroundImage)
//        this.$('#resourceViewHolder').$css('background-image', 'url(' + G.theme.backgroundImage +')');

      this.$('#chatbox').$hide();

//      this.onload(function() {
//        Q.write(function() {
//          if (!self.el.parentNode) {
//            document.body.appendChild(self.el);
//            self.addToWorld(null, true); // auto-add view page brick
//          }
//
//        });
//      });

      return this;
    },

//    _sizeProps: ['_outerHeight', '_outerWidth', '_width', '_height', '_bounds'],
//    _updateSize: function() {
//      if (!this.resourceView.rendered)
//        return BasicPageView.prototype._updateSize.apply(this, arguments);
//      else
//        return BasicPageView.prototype._updateSize.call(this, this.$('#resourceViewHolder')[0]);
//    },

    onLoadedImage: function(callback, context) {
      return this.imageView ? this.imageView.onload(callback, context) : G.getRejectedPromise();
    }
  }, {
    displayName: 'ViewPage'
  });
});
