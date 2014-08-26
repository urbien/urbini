//'use strict';
define('views/HomePage', [
  'globals',
  'events',
  'utils',
  'views/BasicPageView',
  'domUtils'
], function(G, Events, U, BasicPageView, DOM) {
  return BasicPageView.extend({
    TAG: 'HomePage',
    _paged: true,
    autoFinish: false,
    first: true,
    viewId: 'viewHome',
    style: {
      opacity: DOM.maxOpacity,
      display: 'block'
    },
    initialize: function(options) {
      _.bindAll(this, 'render'); //, 'rightMenu', 'leftMenu'); //, 'pagehide', 'pagebeforeshow');
      BasicPageView.prototype.initialize.apply(this, arguments);
      return this;
    },

    events: {
//      'tap #hpRightPanel'   : 'leftMenu',
//      'hold #hpRightPanel'  : 'rightMenu',
//      'tap #installApp'    : 'installApp'
      'click .cta': 'getStarted'
    },

    getStarted: function(e) {
      Events.stopEvent(e);
      var t = e.selectorTarget;
      if (t.tagName == 'A' && t.href && t.href != '#') {
        Events.trigger('navigate', t.href);
        return;
      }

      if (G.currentApp.appPath == 'Tradle') {
        Events.trigger('navigate', U.makeMobileUrl('make', 'commerce/trading/Tradle', {
          owner: '_me'
        }));

        return;
      }

      if (G.currentUser.guest) {
        Events.trigger('req-login', {
          dismissible: true
        });

        return;
      }
      else {
        if (this.menuBtnEl)
          this.menuBtnEl.$trigger('tap');
        else
          Events.trigger('navigate', U.makeMobileUrl('view', 'profile'));
      }
    },

    installApp: function(e) {
      Events.stopEvent(e);
      if (G.hasFFApps) {
        U.require('firefox').done(function(Firefox) {
          Firefox.install();
        });
      }
    },

//    click: function(e) {
//      if (!this.rendered)
//        this._lastClick = e;
//    },
//
//    rightMenu: function(e) {
//      var id = e.target.id,
//          self = this;
//
//      if (!id)
//        return;
//      if (!id.startsWith('hpRightPanel'))
//        return;
//      Events.stopEvent(e);
//      U.require(["views/ContextMenuPanel"]).done(function(MP) {
//        self.menuPanel = new MP({
//          viewId: 'viewHome'
//        });
//
//        self.addChild(self.menuPanel);
//        self.menuPanel.render();
//      });
//    },
//    leftMenu: function(e) {
////      var id = e.target.id,
////          self = this;
////
////      if (!id)
////        return;
////      if (!id.startsWith('hpRightPanel'))
////        return;
////      if (!this.el.querySelector('#hpLeftPanel'))
////        return this.rightMenu(e);
//////      if (!this.$('#' + this.viewId).length)
//////        return;
////
////      Events.stopEvent(e);
////      U.require(["views/MainMenuPanel"]).done(function(MP) {
////        self.menuPanel = new MP({viewId: 'viewHome'});
////        self.addChild(self.menuPanel);
////        self.menuPanel.render();
////      });
//
//    },

    render: function(options) {
    //   var self = this;
    //   return U.require('views/RightMenuButton').done(function(rmb) {
    //     MenuButton = rmb;
    //     self.renderHelper(options);
    //     self.finish();
    //   });
    // },

    // renderHelper: function(options) {
      var self = this;

      if (!this.rendered) {
        this.addToWorld(null, true);
//      this.$el.trigger('page_beforeshow');

        // only allow tap and hold events, click muddies the waters
        // this.menuBtnEl = this.el.$('#hpRightPanel')[0];
        // this.menuBtn = new MenuButton({
        //   el: this.menuBtnEl,
        //   pageView: this,
        //   viewId: this.viewId,
        //   homePage: true
        // });

        // this.menuBtn.render();
//        menuBtnEl.$on('click', function(e) {
//          e.preventDefault();
//        });
      }
//      var item = $('#homePage');
//      item.css('display', 'block');
//      if (!item || item.length == 0) {
//        var itemS = G.haslocalStorage  &&  G.localStorage.get('homePage');
//        if (itemS) {
//          $(itemS).css('display:none');
//          $(itemS).appendTo('body');
////          $(itemS).appendTo('#page');
//        }
//      }

//      if (this.$el.attr("data-stretch"))
//        this.$el.anystretch();

      this.first = false;
      if (this.rendered)
        return;

      if (navigator.mozApps) {
        G.firefoxAppInstalled.done(function() {
          self.removeInstallBtn();
        });
      }
      else
        this.removeInstallBtn();

      document.title = G.currentApp.title;
      return this;
    },

    removeInstallBtn: function() {
      this.$('#installApp').$remove();
    },

    _updateSize: function() {
      var outerWidth = this.el.$outerWidth(),
          height = this.el.$outerHeight(),
          outerHeight = this.el.scrollHeight;

      if (outerWidth != this._outerWidth || outerHeight != this._outerHeight || this._width == outerWidth || this._height != height) {
        this._outerWidth = outerWidth;
        this._outerHeight = outerHeight;
        this._width = outerWidth;
        this._height = height;
        this._bounds[0] = this._bounds[1] = 0;
        this._bounds[2] = this._width;
        this._bounds[3] = this._height;
        return true;
      }

      return doUpdate;
    }
  }, {
    displayName: 'HomePage'
  });
});
