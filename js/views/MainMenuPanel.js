//'use strict';
define('views/MainMenuPanel', [
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/BasicView',
  'views/MenuPanel',
  'domUtils'
], function(G, U, Events, Voc, BasicView, MenuPanel, DOM) {
  return MenuPanel.extend({
//    role: 'data-panel',
//    id: 'menuPanel',
//    theme: 'd',
//    style: (function() {
//      var style = {};
//      style[DOM.prefix('transform')] = DOM.positionToMatrix3DString(0, 0, -100);
//      return style;
//    })(),
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'hide');
      MenuPanel.prototype.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      var type = this.modelType;
      this.makeTemplate('menuP', 'template', type);
      this.makeTemplate('homeMenuItemTemplate', 'homeMenuItemTemplate', type);
      this.makeTemplate('menuItemNewAlertsTemplate', 'menuItemNewAlertsTemplate', type);
    },
    tabs: {},
    events: {
//      'click #edit'      : 'edit',
//      'click #add': 'add',
//      'click #delete': 'delete',
//      'click #subscribe': 'subscribe',
      'click #login'     : 'login',
      'click #logout'    : 'logout',
      'click #home123'   : 'home',
      'click #urbien123' : 'home',
      'click'            : 'click',
      'click .launchQuickstart': 'launchQuickstart',
      'click [data-href]': BasicView.clickDataHref
    },

//    edit: function(e) {
//      Events.stopEvent(e);
//      this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, replace: true});
//      return this;
//    },
    login: function(e) {
      Events.stopEvent(e);
      Events.trigger('req-login', {
        dismissible: true
      });

      this.hide();
    },

    logout: function(e) {
      Events.stopEvent(e);
//      G.log(this.TAG, "Recording step for tour: selector: #logout");
      Events.trigger('logout');
      this.hide();
      return;
    },
    
    home: function(e) {
      Events.stopEvent(e);
      if (e.selectorTarget.id == 'home123')
        Events.trigger('navigate', 'home/');
      else
        Events.trigger('navigate', G.serverName + '/app/UrbienApp');

      this.hide();
      return this;
    },

    launchQuickstart: function(e) {
      Events.stopEvent(e);
      this.getPageView().showQuickstart();
    },

    click: function(e) {
      var t = e.target,
          $t,
          hashIdx,
          href,
          text = U.removeHTML(t.innerHTML).trim();

      if ((href = this.tabs[text]) != null) {
        this.hide();
        Events.stopEvent(e);
        Events.trigger('navigate', U.replaceParam(href, '$title', text));
        return;
      }

//      if (!href)
//        return;
//
//      debugger; // we should really get rid of this block
//      if (href.indexOf("Alert?") != -1)
//        G.currentUser.newAlertsCount = 0;
//
//      Events.stopEvent(e);
//      Events.trigger('navigate', href);
    },
//    tap: Events.defaultTapHandler,
    render:function (eventName) {
//      if (G.isJQM()) {
//        var mi = this.el.$('#menuItems')[0];
//        if (mi) {
//  //        $('#' + this.viewId).panel().panel("open");
//          this.$el.panel("open");
//          return;
//        }
//      }

      var self = this;
      var resOrCol = this.model;
      var json = this.resource && resOrCol.toJSON();

      if (!resOrCol)
        this.html(this.template());
      else
        this.html(this.template(json));

      var ul = this.ul = this.$('#menuItems')[0];
      var html = "";

      if (G.currentUser.guest)
        html += this.menuItemTemplate({title: this.loc('login'), icon: 'user', mobileUrl: 'view/profile', homePage: 'y', id: 'login'});
      else {
        var mobileUrl = 'view/profile';
        if (!hash  ||  hash != mobileUrl) {
          var params = {
            title: this.loc('profile'),
            mobileUrl: mobileUrl
          };

          var w = G.currentUser.originalWidth, h = G.currentUser.originalHeight;
          var maxDim = 100; // for profile
          if (G.currentUser.thumb) {
            params.image = G.currentUser.thumb;
            params.cssClass = 'menu_image_fitted';
          }
          if (w  &&  h) {
            if (w < h) {
              var r = 100 / w;
              maxDim = Math.floor(h * r);

            }

            var clip = U.clipToFrame(47, 47, w, h, maxDim);
            if (clip) {
              params.top = clip.clip_top;
              params.clip_right = clip.clip_right;
              params.bottom = clip.clip_bottom;
              params.clip_left = clip.clip_left;
              params.right = ((100 - 42)/2);
            }
          }
          html += this.menuItemTemplate(params);
//          U.addToFrag(frag, this.menuItemTemplate(params));
        }
      }

      if (G.tabs) {
        var tabs = _.clone(G.tabs);
        for (var name in tabs) {
          var t = tabs[name];
          t.pageUrl = t.hash;
//          U.addToFrag(frag, this.menuItemTemplate(t));
          html += this.menuItemTemplate(t);
        }
      }

      if (this.resource && U.isAssignableFrom(this.vocModel, 'commerce/trading/Tradle')) {
        html += this.menuItemTemplate({
          title: this.loc("embed"), 
          id: 'embed', 
          pageUrl: G.serverName + '/widget/embed.html?-embed=y&uri=' + encodeURIComponent(resOrCol.getUri()) 
        });
      }

      var params = {lastPublished: '!null'};
      if (!G.currentUser.guest) {
        params.creator = '_me';
//        params.webClassesCount = 'null';
        params = {'$or': U.getQueryString(params, {delimiter: '||'})};
      }

      params.dashboard = '!=null';
      var hash = window.location.hash;
      hash = G.pageRoot + hash;

//      var url = encodeURIComponent('model/social/App') + "?" + _.param(params);
/*
      var url = U.makePageUrl('list', 'model/social/App', params);
      if (!hash  ||  hash != url)
        U.addToFrag(frag, this.menuItemTemplate({title: 'App gallery', pageUrl: url }));
      url = U.makePageUrl('list', 'model/social/Theme', {isTemplate: true});
      if (!hash  ||  hash != url)
        U.addToFrag(frag, this.menuItemTemplate({title: 'Theme gallery', pageUrl: url }));
      url = U.makePageUrl('list', 'model/social/AppIdea');
      if (!hash  ||  hash != url)
        U.addToFrag(frag, this.menuItemTemplate({title: 'Idea gallery', pageUrl: url }));
      url = U.makePageUrl('list', 'model/social/NominationForConnection');
      if (!hash  ||  hash != url)
        U.addToFrag(frag, this.menuItemTemplate({title: 'Connection ideas gallery', pageUrl: url}));
*/

      if (!G.currentUser.guest) {
        html += self.groupHeaderTemplate({value: this.loc('account')});
//        U.addToFrag(frag, self.groupHeaderTemplate({value: this.loc('account')}));

//        var mobileUrl = 'view/profile';
//        if (!hash  ||  hash != mobileUrl) {
//          var title = 'Profile';
////          var dim = U.fitToFrame(60, 60, G.currentUser.originalWidth / G.currentUser.originalHeight);
////          var width = dim.w;
////          var height = dim.h;
////          var top = dim.y;
////          var right = dim.w - dim.x;
////          var bottom = dim.h - dim.y;
////          var left = dim.x;
////
//
////          U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: G.currentUser.thumb, width: width, height: height, top: top, right: right, bottom: bottom, left: left, cssClass: 'menu_image_fitted'}));
//          U.addToFrag(frag, this.menuItemTemplate({title: title, mobileUrl: mobileUrl, image: G.currentUser.thumb, cssClass: 'menu_image_fitted' }));
//          self.tabs[title] = U.getPageUrl(mobileUrl);
//
//        }

        var isCreatorOrAdmin = (G.currentUser._uri == G.currentApp.creator  ||  U.isUserInRole(U.getUserRole(), 'admin', resOrCol));
//        var isCreatorOrAdmin = (G.currentUser._uri == G.currentApp.creator  ||  (this.resource  &&  U.isUserInRole(U.getUserRole(), 'admin', res)) || (this.collection &&  this.collection.models.length  &&  U.isUserInRole(U.getUserRole(), 'admin', res.models[0])));

        var user = G.currentUser;
        var installed = user.installedApps;
        if (_.size(installed) > 1) {
//          // get the _uri values of all the apps, cut out their primary key appId, make a small csv. Url hashes can be arbirarily long?
//          var $in = 'appId,' + _.map(_.pluck(_.toArray(installed), '_uri'), function(uri) {
//            return uri.slice(uri.indexOf('=') + 1);
//          }).join(',');

          var $in = '_uri,' + _.pluck(_.toArray(installed), 'application').join(',');

          // Apps I installed
//          U.addToFrag(frag, this.menuItemTemplate({title: this.loc("myApps"), mobileUrl: U.makeMobileUrl('list', "model/social/App", {$in: $in, $myApps: 'y'})}));
          html += this.menuItemTemplate({title: this.loc("myApps"), mobileUrl: U.makeMobileUrl('list', "model/social/App", {$in: $in, $myApps: 'y'})})
        }

        // Apps I created
//        U.addToFrag(frag, this.menuItemTemplate({title: "My Apps", mobileUrl: U.makeMobileUrl('list', "model/social/App", {creator: '_me'})}));

//        if (user.newAlertsCount) {
//          U.addToFrag(frag, this.menuItemNewAlertsTemplate({title: this.loc('notifications'), newAlerts: user.newAlertsCount, pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {to: '_me'/*, markedAsRead: false*/}) }));
          html += this.menuItemNewAlertsTemplate({title: this.loc('notifications'), newAlerts: user.newAlertsCount, pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {to: '_me', '$orderBy': 'dateReceived', '$asc': 0 /*, markedAsRead: false*/}) });
//        }
        /*
        if (user.alertsCount) {
          var loc = window.location.href;
          loc += (loc.indexOf('?') == -1 ? '?' : '&') + '$clearAlerts=y' + "&-info=" + encodeURIComponent("Notifications were successfully deleted");
          U.addToFrag(frag, this.menuItemTemplate({title: 'Clear Notifications', pageUrl: lo }));
//        U.addToFrag(frag, this.menuItemTemplate({title: 'Clear Notifications', pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {sender: '_me', $clear: 'true', $returnUri: window.location.href}) }));
        }
        */
//        U.addToFrag(frag, this.menuItemTemplate({title: this.loc("logout"), id: 'logout', pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) }));
        html += this.menuItemTemplate({title: this.loc("logout"), id: 'logout', pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) });
      }

//      U.addToFrag(frag, this.homeMenuItemTemplate({title: "App Home", icon: 'repeat', id: 'home123'}));
      if (G.currentHashInfo.route != 'home') {
//        U.addToFrag(frag, this.menuItemTemplate({title: this.loc("appHome"), icon: 'repeat', id: 'home123'}));
        html += this.menuItemTemplate({title: this.loc("home"), icon: 'home', id: 'home123'});
      }

      ul.innerHTML = html;
//      ul.appendChild(frag);
//      var p = document.getElementById(this.viewId);
//      p.appendChild(this.el);
//      if (!G.isJQM())
//        this.el.style.visibility = 'visible';
//      else {
//      if (G.isJQM()) {
//        this.$el.panel().panel("open");
//        $(ul).listview();
////        $(this.$('#menuItems')).listview();
//      }
//      p.panel().panel("open");
//      this.$('#menuItems').listview();
//      if (U.isMasonry(this.vocModel))
//        this.$el.blurjs({source: '#nabs_grid', radius: 5});

      return this;
    }
  },
  {
    displayName: 'MainMenuPanel'
  });
});
