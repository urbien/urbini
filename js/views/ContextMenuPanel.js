//'use strict';
define('views/ContextMenuPanel', [
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/MenuPanel'
], function(G, U, Events, Voc, MenuPanel) {
  function isCreatorOrAdmin(res) {
    return (G.currentUser._uri == G.currentApp.creator  ||  U.isUserInRole(U.getUserRole(), 'admin', res));
  };

  return MenuPanel.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'grab', 'release', 'chat', 'physics');
      MenuPanel.prototype.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      var type = this.modelType;
      this.makeTemplate('rightMenuP', 'template', type);
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', type);
      this.makeTemplate('menuHeaderTemplate', 'headerTemplate', type);
      this.viewId = options.viewId + 'r';
      this.isPanel = true;
//      this.listenToOnce(Events, 'pageChange', this.destroy);
    },
    events: {
      'click [data-grab]'        : 'grab',
      'click [data-release]'     : 'release',
//      'click #edit': 'edit',
      'click #add'               : 'add',
      'click #delete'            : 'delete',
//      'click #subscribe'         : 'subscribe',
      'click .chattee'           : 'chat',
      'click #urbien123'         : 'home',
      'click #physics123'        : 'physics',
//      'click #login'             : 'login',
      'click [data-href]'        : MenuPanel.clickDataHref
//        ,
//      'click'                    : 'click'
//      'click #logout': 'logout',
    },

    home: function(e) {
      Events.stopEvent(e);
      Events.trigger('navigate', G.serverName + '/app/UrbienApp');
    },

    physics: function(e) {
      Events.stopEvent(e);

      var physics = this.getPageView().el.querySelector('.physicsConstants'),
          style = physics.style;

      if (style.display == 'none')
        style.removeProperty('display');
      else
        style.display = 'none';

      G.triggerEvent(window, "viewportdimensions");
      this.hide();
    },

//    click: function(e) {
//      var t = e.target,
//          $t;
//
//      if (t.nodeName == 'A')
//        return;
//
//      $t = $(t).closest('[data-href]');
//      if ($t.length)
//        Events.trigger('navigate', $t[0].$data('href'));
//
////      if (!t)
////        return;
////
////      var href = $(t).attr('href') || $(t).attr('link') || $(t).attr("data-href");
////      var idx = href.lastIndexOf('#');
////      href = idx == -1 ? href : href.slice(idx + 1);
////
//////      if (G.isBB()) {
//////        Events.stopEvent(e);
//////        window.location.replace(G.appUrl + '#' + href);
//////        window.location.reload(true);
//////        return;
//////      }
//////      else
////        this.router.navigate(href, {trigger: true});
//    },

    release: function(e) {
      Events.stopEvent(e);
      var target = e.target;
//      var li = target;
//      var foundLi = false;
//      while (li && li.tagName && !(foundLi = li.tagName.toLowerCase() == 'li'))
//        li = li.parentNode;
//
//      if (!foundLi)
//        return;
//
//      li.parentNode.removeChild(li);
      var uri = target.$data('release');
      var grabbed = G.currentUser.grabbed;
      var item = U.isTempUri(uri) ? grabbed.where({_oldUri: uri})[0] : grabbed.get(uri);
      item && item.cancel();
      grabbed.splice(grabbed.indexOf(item), 1);

      this.refresh();
    },

    grab: function(e) {
      Events.stopEvent(e);
      var self = this,
          target = e.target,
          grabParams = target.$data('grab'),
          grabType = G.commonTypes.Grab;

      Voc.getModels(grabType).done(function(grabModel) {
        var grab = new grabModel(grabParams ? _.getParamMap(grabParams) : {});
        grab.save(null, {
          success: function() {
            var grabbed = G.currentUser.grabbed;
            if (!grabbed.get(grab))
              grabbed.add(grab);

            self.refresh();
          },
          error: function() {
            debugger;
          }
        });
      });

      return this;
    },

//    edit: function(e) {
//      Events.stopEvent(e);
//      this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, replace: true});
//      return this;
//    },
//    logout: function(e) {
//      Events.stopEvent(e);
//      Events.trigger('logout');
//      this.hide();
//      return;
//    },
//    click: function(e) {
//      var t = e.target;
//      var text = t.innerHTML;
//      while (t  &&  t.nodeName.toLowerCase() != 'a') {
//        if ($(t).attr("data-href"))
//          break;
//        t = t.parentNode;
//      }
//
//      if (typeof t === 'undefined' || !t)
//        return;
//
//      text = U.removeHTML(text).trim();
//      var href = $(t).attr('href') || $(t).attr('link') || $(t).attr("data-href");
//      var idx = href.lastIndexOf('#');
//      var href = idx == -1 ? href : href.slice(idx + 1)
//
//      if (this.tabs[text]) {
//        if (this.tabs[text] == href) {
//          e.originalEvent.preventDefault();
//          this.router.navigate(href, {trigger: true, destinationTitle: text});
//          return;
//        }
//      }
//
//      this.router.navigate(href, {trigger: true});
//    },
    refresh: function() {
      this.el.$empty();
      this.render();
    },

    chat: function(e) {
      Events.stopEvent(e);
      var userid = $(e.selectorTarget).find('[data-userid]').data('userid');
      var chatPageUrl = e.selectorTarget.$data('href');
      var qIdx = chatPageUrl.indexOf('?');
      if (userid) {
        this.pageView.sendMessage({
          channel: userid,
          message: '<i><a href="{0}">{1}</a></i>'.format(chatPageUrl, this.loc('wouldYouLikeToChatInPrivate'))
        })
      }

      var isWaitingRoom = this.hashParams['-waitingRoom'] == 'y';
      var redirectOptions = {
        trigger: true,
        replace: isWaitingRoom
      };

      if (isWaitingRoom)
        redirectOptions.transition = 'none';

      this.router.navigate(chatPageUrl.slice(chatPageUrl.indexOf('#') + 1), redirectOptions);
      this.hide();
    },

    renderChatParticipants: function() {
      this.el.$empty();

      this.html(this.template());
      var html = "";
      html += this.groupHeaderTemplate({value: this.loc("whosHere") });

      var myId = this.pageView.getUserId();
      var me = G.currentUser;
      var myName = me.davDisplayName;
      var participants = this.pageView.getParticipants();
//      participants[userid] = { // add self to list
//        userid: myId,
//        uri: me._uri,
//        name: myName,
//        icon: me.thumb
//      };

      for (var userid in participants) {
        var info = participants[userid];
        var uri = info.uri;
        if (!uri)
          return;

        var mobileUrl = U.makeMobileUrl('chat', '_{0}:{1}'.format(myId, userid), {
          $title: '{0}: {1} and {2}'.format(this.loc('privateChat'), info.name, myName)
        });

        //U.makeMobileUrl('chat', uri);
        var title = info.name;
        var img = info.icon;
        var common = {
          title: title,
          mobileUrl: mobileUrl,
          cssClass: 'chattee',
          data: {
            userid: userid
          }
        };

        if (!img) {
          html += this.menuItemTemplate(common);
        }
        else {
          var oW = info.oW;
          var oH = info.oH;
          if (oW  &&  oH) {

            this.el.classList.add("menu_image_fitted");

            var dim = U.fitToFrame(44, 44, oW / oH)
            width = dim.w;
            height = dim.h;
            top = dim.y;
            right = dim.w - dim.x;
            bottom = dim.h - dim.y;
            left = dim.x;
            html += this.menuItemTemplate(_.extend({image: img, width: width, height: height, top: top, bottom: bottom, right: right, left: left}, common));
          }
          else {
            html += this.menuItemTemplate(_.extend({image: img}, common));
          }
        }
      }

      var ul = this.$('#rightMenuItems')[0];
      ul.innerHTML = html;
//      var p = document.getElementById(this.viewId);
//      p.appendChild(this.el);

//      if (!G.isJQM())
//        this.el.style.visibility = 'visible';
//      else {
//      if (G.isJQM()) {
////        p.panel().panel("open");
//        this.$el.panel("open");
//        $(ul).listview();
//      }
    },

    render: function (eventName) {
      if (U.isChatPage()) {
        this.renderChatParticipants();
        return;
      }

//      if (G.isJQM()) {
//        var mi = this.el.querySelector('#rightMenuItems');
//        if (mi) {
//          this.$el.panel("open");
//  //        $('#' + this.viewId).panel().panel("open");
//          return;
//        }
//      }

      var self = this,
          res = this.model,
          model = this.vocModel,
          html = "";

      if (model) {
        var json = this.resource && res.toJSON();
  //      var isSuperUser = isCreatorOrAdmin(res);
        this.html(this.template(json));
        var title = this.loc(this.resource ? 'objProps' : 'listProps');
        html += this.groupHeaderTemplate({value: title, icon: 'gear'});
      }
      else
        this.html(this.template({}));

      var commentVerb = this.loc('commentVerb'),
          likeVerb = this.loc('likeVerb');

//        this.html(this.template({}));
      uri = U.makePageUrl('make', 'aspects/tags/Vote', {votable: G.currentApp._uri, '-makeId': G.nextId(), $title: U.makeHeaderTitle(likeVerb, G.currentApp.davDisplayName)});
      html += this.menuItemTemplate({title: likeVerb, pageUrl: uri, icon: 'heart', homePage: 'y'});

//        if (!G.currentUser.guest) {
//          var icons = _.map(['Facebook', 'Twitter', 'LinkedIn', 'Google'], function(n) { return '<i class="ui-icon-{0}"></i>'.format(U.getSocialNetFontIcon(n)) }).join(' ');
//          html += this.menuItemTemplate({title: icons, mobileUrl: U.makePageUrl('social', '', {}), homePage: 'y', social: true});
//        }

      uri = U.makePageUrl('make', 'model/portal/Comment', {$editCols: 'description', forum: G.currentApp._uri, '-makeId': G.nextId(), $title: U.makeHeaderTitle(commentVerb, G.currentApp.davDisplayName)});
      html += this.menuItemTemplate({title: commentVerb, pageUrl: uri, icon: 'comments', homePage: 'y'})
      var isAllowedToEdit = G.currentUser != 'guest'  &&  (G.currentUser._uri == G.currentApp.creator  ||  U.isUserInRole(U.getUserRole(), 'siteOwner'));
      if (isAllowedToEdit) {
        uri = U.makePageUrl('list', 'model/portal/Bookmark', {dashboard: U.getLongUri1(G.currentApp.dashboard), $edit: 'y', $title: U.makeHeaderTitle(this.loc('menu'), G.currentApp.davDisplayName)});
        html += this.menuItemTemplate({title: this.loc('editMenu'), pageUrl: uri, icon: 'gear', homePage: 'y'});
      }
      if (isAllowedToEdit  ||  (G.currentApp.webClasses && G.currentApp.webClasses.count)) {
        uri = U.makePageUrl('view', G.currentApp._uri);
        var title = this.loc(isAllowedToEdit ? 'editApp' : 'forkMe');
        var icon =  isAllowedToEdit ? 'wrench' : 'copy';
        html += this.menuItemTemplate({title: title, pageUrl: uri, icon: icon, homePage: 'y'});
      }
//        else
//          U.addToFrag(frag, this.menuItemTemplate({title: 'Profile', icon: 'user', mobileUrl: uri, image: G.currentUser.thumb, cssClass: 'menu_image_fitted', homePage: 'y'}));

//        if (G.pageRoot != 'app/UrbienApp') {
//          html += this.menuItemTemplate({title: this.loc("urbienHome"), icon: 'repeat', id: 'urbien123', mobileUrl: '#', homePage: 'y'});
//        }
//      }
//      else {
//      if (model) {
//      var isSuperUser = isCreatorOrAdmin(res);

//      var title = '<div class="gradientEllipsis">' + this.loc(this.resource ? 'objProps' : 'listProps') + '</div>';
//      html += this.headerTemplate({title: title, icon: 'gear'});
      if (this.model) {
        var isItemListing = res.isA("ItemListing");
        var isBuyable = res.isA("Buyable");
        if (isItemListing || isBuyable) {
          var licenseProp = U.getCloneOf(model, isItemListing ? 'ItemListing.license' : 'Buyable.license')[0];
          var license = res.get(licenseProp);
          if (license) {
            var ccEnum = U.getEnumModel('CCLicense');
            var licenseMeta = _.filter(ccEnum.values, function(val) {
              return val.displayName === license;
            })[0];

            if (licenceMeta) {
              html += this.menuItemTemplate({title: this.loc('license'), image: licenseMeta.icon});
            }
          }
        }

//        this.buildGrabbed(frag);
//        this.buildGrab(frag);
        html += this.buildActionsMenu();
        html += this.menuItemTemplate({title: this.loc("physics"), id: 'physics123'});
        if (this.resource  &&  U.isA(this.vocModel, 'ModificationHistory')) {
          var ch = U.getCloneOf(this.vocModel, 'ModificationHistory.allowedChangeHistory');
          if (!ch  ||  !ch.length)
            ch = U.getCloneOf(this.vocModel, 'ModificationHistory.changeHistory');
          if (ch  &&  ch.length  && !this.vocModel.properties[ch[0]].hidden) {
            var cnt = res.get(ch[0]) && res.get(ch[0]).count;
            if (cnt  &&  cnt > 0) {
              html += this.menuItemTemplate({title: this.loc("activity"), pageUrl: U.makePageUrl('list', 'system/changeHistory/Modification', {forResource: this.resource.getUri()})});
            }
          }
        }
      }

      if (G.pageRoot == 'app/Aha') {
        var browser = G.browser,
            os = G.inWebview ? 'ChromeOS' :
                  G.inFirefoxOS ? 'FxOS' :
                    browser.ios ? 'IOS' :
                      browser.android ? 'Android' : 'Desktop',

            browserName = browser.chrome ? 'Chrome' :
                            browser.firefox ? 'Firefox' :
                              browser.safari ? 'Safari' : '',

            pageTemplate = 'bookmarklet{0}{1}PageTemplate'.format(os, browserName);

        if (!U.getTemplate(pageTemplate)) {
          pageTemplate = 'bookmarklet{0}PageTemplate'.format(os);
          if (!U.getTemplate(pageTemplate)) {
            pageTemplate = 'bookmarklet{0}PageTemplate'.format(browserName);
            if (!U.getTemplate(pageTemplate)) {
              pageTemplate = null;
              this.log("error", "no template found for Aha bookmarklet page for OS: {0} and browser {1}".format(os, browserName));
            }
          }
        }

        if (pageTemplate) {
          var fragment = "static/?" + _.param({
            template: pageTemplate
          });

          html += this.menuItemTemplate({title: "Aha! Button", icon: 'bookmark', mobileUrl: fragment});
        }
      }

      var ul = this.ul = this.$('#rightMenuItems')[0];
      ul.$append(html);
//      var p = document.getElementById(this.viewId);
//      p.appendChild(this.el);

      if (!G.isJQM())
        this.el.style.visibility = 'visible';
//      else {
//
//        this.$el.panel().panel("open");
////      p.panel().panel("open");
//        $(ul).listview();
////      p.trigger("updatelayout")
//      }
//      if (!window.location.hash  ||  window.location.hash == '#')
//        $(this.el.parentElement).blurjs({source: '#homePage', radius: 10, overlay: 'rgba(48, 46, 46, 0.5)'});
      return this;
    },

    grabExists: function(grab) {
      var type = grab.grabClass;
      var filter = grab.filter;
      var grabsForType = G.currentUser.grabbed.where({
        grabClass: type
      });

      return _.filter(grabsForType, function(item) {
        return U.areQueriesEqual(item.get('filter'), filter);
      }).length;
    },

    buildGrab: function() {
      if (G.currentUser.guest)
        return;

      var grabType = G.commonTypes.Grab,
          res = this.resource,
          isList = !res,
          pageTitle = this.getPageTitle(),
          grabVerb = this.loc('grabVerb'), //$('.pageTitle').text();
          html = "";

      if (isList) {
        var grab = {
          filter: _.param(this.collection.params),
          grabClass: this.vocModel.type,
          title: pageTitle
        };

        if (this.grabExists(grab))
          return html;

        html += this.groupHeaderTemplate({value: grabVerb});
        html += this.menuItemTemplate({
          title: pageTitle,
          data: {
            grab: _.param(grab)
          }
        });

        return html;
      }

      var uri = res.getUri();
      if (U.isTempUri(uri))
        return html;

      var grab = {
        grabClass: this.vocModel.type,
        filter: _.param({SELF: uri}),
        title: pageTitle
      };

      var addedHeader = false;
      var meta = this.vocModel.properties;
      var resName = U.getDisplayName(res);
      if (!this.grabExists(grab)) {
        html += this.groupHeaderTemplate({value: grabVerb});
        addedHeader = true;
//        U.addToFrag(frag, this.menuItemTemplate({
//          title: resName,
//          data: {
//            grab: _.param(grab)
//          }
//        }));
        html += this.menuItemTemplate({
          title: resName,
          data: {
            grab: _.param(grab)
          }
        });
      }
      /*
      var backlinks = U.getBacklinks(meta);
      for (var bl in backlinks) {
        var blProp = backlinks[bl];
        var backlink = blProp.backLink;
        var qParams = {};
        qParams[backlink] = uri;
        var propName = U.getPropDisplayName(blProp);
        var grab = {
          grabClass: U.getTypeUri(blProp.range),
          filter: _.param(qParams),
          title: resName + ' - ' + propName
        };

        if (this.grabExists(grab))
          continue;

        if (!addedHeader) {
          U.addToFrag(frag, this.groupHeaderTemplate({value: 'Grab'}));
          addedHeader = true;
        }

        U.addToFrag(frag, this.menuItemTemplate({
          title: propName,
          data: {
            grab: _.param(grab)
          }
        }));
      }
      */

      return html;
    },

    buildGrabbed: function() {
      if (G.currentUser.guest)
        return;

      var grabbed = G.currentUser.grabbed, // maybe it should just be a regular collection, req'd after stuff loads
          html = "";

      if (grabbed  &&  grabbed.length) {
        html += this.groupHeaderTemplate({value: this.loc('grabbed')});
        grabbed.each(function(item) {
          html += this.menuItemTemplate({
            title: item.get('title'),
            data: {
              release: item.getUri()
            }
          });
        });
      }

      return html;
    },

    buildActionsMenu: function() {
      var html;
      if (this.resource)
        html = this.buildActionsMenuForRes();
      else
        html = this.buildActionsMenuForList();

      if (!G.currentUser.guest) {
        if (this.resource  &&  U.isA(this.vocModel, 'CollaborationPoint')  &&  !U.isAssignableFrom(this.vocModel, 'Contact')) {
          var submittedByProp = U.getCloneOf(this.vocModel, 'CollaborationPoint.submittedBy');
          var submittedBy = this.resource.get(submittedByProp);
          if (submittedBy  &&  submittedBy != G.currentUser.get('_uri')) {
            var cOf = U.getCloneOf(this.vocModel, 'CollaborationPoint.members');
            if (cOf  &&  cOf.length) {
              var loc = window.location.href;
              loc += (loc.indexOf('?') == -1 ? '?' : '&') + _.param({
                "-info": this.loc("youHaveSubscribedToNotificationsForThisResource")
              });

              if (!haveActions)
                html += this.buildActionsHeader();

              html += this.menuItemTemplate({title: this.get("follow"), id: 'follow', mobileUrl: U.makePageUrl('make', 'model/portal/MySubscription', {owner: '_me', forum: this.resource._uri, $returnUri: loc})});
            }
          }
        }

//        U.addToFrag(frag, this.menuItemTemplate({title: 'Follow', mobileUrl: '', id: 'subscribe'}));
      }

      var model = this.vocModel;
      var isSuperUser = isCreatorOrAdmin(res);
      if (isSuperUser) {
        html += this.groupHeaderTemplate({value: this.loc('pageAssets')});
        var wHash = U.getHash();
        var params = {};
        params.modelName = model.displayName;
        html += this.menuItemTemplate({title: this.loc('templates'), pageUrl: U.makePageUrl('templates', wHash, params)});
        html += this.menuItemTemplate({title: this.loc('plugs'), pageUrl: U.makePageUrl('list', G.commonTypes.Handler, {effectDavClassUri: model.type})});
      }

      if (!this.resource)
        return html;

      var res = this.resource;
      if (!isSuperUser)
        return html;

      if (U.isAssignableFrom(this.vocModel, 'App')  ||  U.isAssignableFrom(this.vocModel, 'WebClass')  ||  U.isAssignableFrom(this.vocModel, 'WebProperty'))
        return html;

      html += this.groupHeaderTemplate({value: this.loc('misc')});
      /*
      var uri = U.getLongUri1(G.currentApp._uri);

      pageUrl = U.makePageUrl('view', uri);
      var title = this.loc('editApp'); // + G.currentApp.title;
      var img = G.currentApp.smallImage;
      if (!img)
        html += this.menuItemTemplate({title: title, pageUrl: pageUrl});
      else {
        if (typeof G.currentApp.originalWidth != 'undefined' &&
            typeof G.currentApp.originalHeight != 'undefined') {

          var params = {
              title: title,
              pageUrl: pageUrl,
              image: img,
              cssClass: 'menu_image_fitted'
            };
          var w = G.currentApp.originalWidth, h = G.currentApp.originalHeight;
          var maxDim = 105; // for app
          if (w < h) {
            var r = 105 / w;
            maxDim = Math.floor(h * r);

          }
          var clip;
          if (w == h)
            clip = U.clipToFrame(47, 47, w, h, maxDim);
          else
            clip = U.clipToFrame(47, 47, w, h, maxDim, 80);

          if (clip) {
            params.top = clip.clip_top;
            params.clip_right = clip.clip_right;
            params.bottom = clip.clip_bottom;
            params.clip_left = clip.clip_left;
            params.right = clip.clip_left - 1;
          }

          html += this.menuItemTemplate(params);
//              U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, width: width, height: height, top: top, right: right, bottom: bottom, left: left, cssClass: 'menu_image_fitted'}));
//          html += this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, cssClass: 'menu_image_fitted'});
        }
        else
          html += this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img});
      }
*/
      return html;
    },

    buildActionsHeader: function() {
      return this.groupHeaderTemplate({value: this.loc('actions')});
    },

    buildActionsMenuForList: function() {
      var m = this.vocModel,
          loc = G.localize,
          cMojo = m.classMojoMultiplier,
          user = G.currentUser,
          html = "";

      if (!user.guest && typeof cMojo !== 'undefined' && user.totalMojo > cMojo) {
        html += this.buildActionsHeader();
        html += this.menuItemTemplate({title: this.loc('add'), mobileUrl: U.makeMobileUrl('make', m.type), id: 'add'});
      }

      return html;
    },

    buildActionsMenuForRes: function() {
      if (U.isAssignableFrom(this.vocModel, 'commerce/trading/Rule'))
        return; // can't edit or add rules from menu

      var m = this.resource,
          user = G.currentUser,
          edit = m.get('edit'),
          isMakeOrEditRequest =  window.location.hash.indexOf('#edit') != -1  ||  window.location.hash.indexOf('#make') != -1,
          html = "";

      if (!user.guest  &&  !isMakeOrEditRequest  &&  (!edit  ||  user.totalMojo > edit)) {
        var paintAdd;
        var paintEdit;
        if (!U.isAssignableFrom(this.vocModel, 'Contact'))
          paintAdd = true;
        if (!U.isAssignableFrom(this.vocModel, 'Contact')  ||  m.getUri() == user._uri)
          paintEdit = true;
        if (paintAdd || paintEdit) {
          html += this.buildActionsHeader();
          if (paintAdd)
            html += this.menuItemTemplate({title: this.loc('add'), mobileUrl: U.makeMobileUrl('make', m.vocModel.type), id: 'add'});
          if (paintEdit)
            html += this.menuItemTemplate({title: this.loc('edit'), mobileUrl: U.makeMobileUrl('edit', m.getUri()), id: 'edit'});
        }

        return html;
      }

      return html;
    },

//    subscribe: function(e) {
//      Events.stopEvent(e);
//      var self = this;
//      Voc.getModels("model/portal/MySubscription").done(function(m) {
////        var m = U.getModel("model/portal/MySubscription");
//        var res = new m();
//        var props = {forum: self.resource.getUri(), owner: G.currentUser._uri};
//        res.save(props, {
//          sync: true,
//          success: function(resource, response, options) {
//            var rUri = self.resource.getUri();
//            var uri = U.getMobileUrl('view', rUri, {
//              '-info': this.loc('youAreNowSubscribedTo') + " " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName')
//            });
//
//            self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true, removeFromView: true});
//          },
//          error: function(resource, xhr, options) {
//            debugger;
//            var code = xhr ? xhr.code || xhr.status : 0,
//                error = U.getJSON(xhr.responseText);
//
//            switch (code) {
//            case 401:
//              Events.trigger('req-login', {
//                dismissible: false
//              });
//
////              Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
////              this.listenTo(Events, 401, msg || 'You are not unauthorized to make these changes');
//              break;
//            case 404:
//              debugger;
//              Errors.errDialog({msg: msg || this.loc('itemNotFound'), delay: 100});
//              break;
//            case 409:
//              debugger;
//              var rUri = self.resource.getUri();
//              var uri = U.makeMobileUrl('view', rUri, {
//                '-info': this.loc('youWereAlreadySubscribedTo') + " " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName')
//              });
//
//              self.router.navigate(uri, {replace: true, forceFetch: true, removeFromView: true});
////              Errors.errDialog({msg: msg || 'The resource you\re attempting to create already exists', delay: 100});
//              break;
//            default:
//              debugger;
//              Errors.errDialog({msg: msg || error && error.details, delay: 100});
////              debugger;
//              break;
//            }
//          }
//        });
////        self.redirect.apply(self, args);
//      }).fail(function() {
//        self.router.navigate(U.makeMobileUrl('view', uri), options);
//      });
//
//      this.loc('subscribed...not really though');
//      this.hide();
//    },

    add: function() {
    },

    "delete": function() {
      alert('deleted...not really though');
      this.hide();
    }
  },
  {
    displayName: 'ContextMenuPanel'
  });
});
