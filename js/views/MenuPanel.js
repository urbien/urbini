//'use strict';
define([
  'globals',
  'utils',
  'events',
  'templates',
  'views/BasicView'
], function(G, U, Events, Templates, BasicView) {
  return BasicView.extend({
//    role: 'data-panel',
//    id: 'menuPanel',
//    theme: 'd',
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'edit', 'buildActionsMenu', 'buildActionsMenuForList', 'buildActionsMenuForRes');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.template = _.template(Templates.get('menuP'));
      this.menuItemTemplate = _.template(Templates.get('menuItemTemplate'));
      this.homeMenuItemTemplate = _.template(Templates.get('homeMenuItemTemplate'));
      this.groupHeaderTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.menuItemNewAlertsTemplate = _.template(Templates.get('menuItemNewAlertsTemplate'));
      this.TAG = 'MenuPanel';
      Events.on("mapReady", this.showMapButton);
      this.viewId = options.viewId;
    },
    tabs: {},
    events: {
      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe',
      'click #logout': 'logout',
      'click #home123': 'home',
      'click': 'click'

//      'swipeleft': 'swipeleft',
//      'swiperight': 'swiperight'
    },
//    swipeleft: function() {
//      G.log(this.TAG, 'events', "swipeleft");
//      window.history.back();
//    },
//    swiperight: function() {
//      G.log(this.TAG, 'events', "swiperight");
//    },
    edit: function(e) {
      Events.stopEvent(e);
      this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, replace: true});
      return this;
    },
    logout: function(e) {
      Events.stopEvent(e);
      Events.trigger('logout');
      return;
    },
    home: function(e) {
  //    this.router.navigate(G.homePage, {trigger: true, replace: false});
      Events.stopEvent(e);
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    click: function(e) {
      var t = e.target;
      var text = t.innerHTML;
      while (t && t.nodeName.toLowerCase() != 'a') {
        t = t.parentNode;
      }
      
      if (typeof t === 'undefined' || !t)
        return;
      text = text.replace(/(<([^>]+)>)/ig, '').trim();
      var href = $(t).attr('href') || $(t).attr('link');
      var idx = href.lastIndexOf('#');
      var href = idx == -1 ? href : href.slice(idx + 1)
          
      if (this.tabs[text]) {
        if (this.tabs[text] == href) {
          e.originalEvent.preventDefault();
          this.router.navigate(href, {trigger: true, destinationTitle: text});
          return;
        }
      }
      
      this.router.navigate(href, {trigger: true});
//      var link = $(t).attr('link');
//      if (link) {
//        $(t).removeAttr('link');
//        $(t).attr('href', link);
//      }
    },
//    tap: Events.defaultTapHandler,
    render:function (eventName) {
      G.log(this.TAG, "render");

      var mi = $('#' + this.viewId).find('ul');
      if (mi  &&  mi.length != 0) {
        $('#' + this.viewId).panel("open");
        return;
      }
      var self = this;
      var res = this.resource || this.collection;
      var json = res.attributes;
      this.$el.html(this.template(json));      

      var ul = this.$('#menuItems');
      var frag = document.createDocumentFragment();
      if (G.tabs) {
//        U.addToFrag(frag, self.menuItemTemplate({title: 'Home', icon: 'home', pageUrl: G.pageRoot}));
//        U.addToFrag(frag, self.groupHeaderTemplate({value: G.appName}));
        _.each(G.tabs, function(t) {
//          t.mobileUrl = t.mobileUrl || U.getMobileUrl(t.pageUrl);
          t.pageUrl = t.hash;
          U.addToFrag(frag, self.menuItemTemplate(t));
//          self.tabs[t.title] = t.mobileUrl;
        });
      }
      
      var params = {lastPublished: '!null'};
      if (!G.currentUser.guest) {
        params.creator = '_me';
        params.webClassesCount = 'null';
        params = {'$or': U.getQueryString(params, {delimiter: '||'})};
      }
      
      params.dashboard = '!=null';
      var hash = window.location.hash;
      hash = hash && hash.slice(1);
      
//      var url = encodeURIComponent('model/social/App') + "?" + $.param(params);
      if (!hash  ||  hash != url) {
        U.addToFrag(frag, this.menuItemTemplate({title: 'App gallery', pageUrl: U.makePageUrl('list', 'model/social/App', params) }));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Theme gallery', pageUrl: U.makePageUrl('list', 'model/social/Theme', {isTemplate: true}) }));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Idea gallery', pageUrl: U.makePageUrl('list', 'model/social/AppIdea') }));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Connection ideas gallery', pageUrl: U.makePageUrl('list', 'model/social/NominationForConnection')}));
      }
      
      this.buildActionsMenu(frag);      
      if (this.resource  &&  U.isA(this.vocModel, 'ModificationHistory', G.typeToModel)) {
        var ch = U.getCloneOf(this.vocModel, 'ModificationHistory.allowedChangeHistory');
        if (!ch  ||  !ch.length)
          ch = U.getCloneOf(this.vocModel, 'ModificationHistory.changeHistory');
        if (ch  &&  ch.length  && !this.vocModel.properties[ch[0]].hidden) { 
          var cnt = res.get(ch[0]) && res.get(ch[0]).count;
          if (cnt  &&  cnt > 0) 
            U.addToFrag(frag, this.menuItemTemplate({title: "Activity", pageUrl: U.makePageUrl('list', 'system/changeHistory/Modification', {forResource: this.resource.getUri()})}));
        }
      }
      if (!G.currentUser.guest) {
        U.addToFrag(frag, self.groupHeaderTemplate({value: 'Account'}));
        U.addToFrag(frag, this.menuItemTemplate({title: "My Apps", mobileUrl: U.makeMobileUrl('list', "model/social/App", {creator: '_me'})}));
        if (G.currentUser._uri == G.currentApp.creator) {
          var uri = U.getLongUri1(G.currentApp._uri);
          pageUrl = U.makePageUrl('edit', uri);
          var title = 'Edit ' + G.currentApp.title;
          var img = G.currentApp.smallImage;
          if (!img) 
            U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl}));
          else {
            if (typeof G.currentApp.originalWidth != 'undefined' &&
                typeof G.currentApp.originalHeight != 'undefined') {
              
//              this.$el.addClass("image_fitted");
              
//              var dim = U.fitToFrame(60, 60, G.currentApp.originalWidth / G.currentApp.originalHeight);
//              var width = dim.w;
//              var height = dim.h;
//              var top = dim.y;
//              var right = dim.w - dim.x;
//              var bottom = dim.h - dim.y;
//              var left = dim.x;
//              U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, width: width, height: height, top: top, right: right, bottom: bottom, left: left, cssClass: 'menu_image_fitted'}));
              U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img, cssClass: 'menu_image_fitted'}));
            }
            else
              U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: img}));
          }
        }

        var mobileUrl = 'view/profile';
        if (!hash  ||  hash != mobileUrl) {
          var title = 'Profile';
//          var dim = U.fitToFrame(60, 60, G.currentUser.originalWidth / G.currentUser.originalHeight);
//          var width = dim.w;
//          var height = dim.h;
//          var top = dim.y;
//          var right = dim.w - dim.x;
//          var bottom = dim.h - dim.y;
//          var left = dim.x;
//
          
//          U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: G.currentUser.thumb, width: width, height: height, top: top, right: right, bottom: bottom, left: left, cssClass: 'menu_image_fitted'}));
          U.addToFrag(frag, this.menuItemTemplate({title: title, mobileUrl: mobileUrl, image: G.currentUser.thumb, cssClass: 'menu_image_fitted' }));
          self.tabs[title] = U.getPageUrl(mobileUrl);
  
        }
        if (G.currentUser.newAlertsCount) {
//          pageUrl = encodeURIComponent('model/workflow/Alert') + '?sender=_me&markedAsRead=false';
          U.addToFrag(frag, this.menuItemNewAlertsTemplate({title: 'Notifications', newAlerts: G.currentUser.newAlertsCount, pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {sender: '_me', markedAsRead: false}) }));
        }
        
        U.addToFrag(frag, this.menuItemTemplate({title: "Logout", id: 'logout', pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) }));
      }

      U.addToFrag(frag, this.homeMenuItemTemplate({title: "Home", icon: 'home'}));
      ul.append(frag);
      
      this.rendered = true;
      var p = $('#' + this.viewId);
      p.append(this.$el);
      p.panel("open");
      this.$('#menuItems').listview();
      
//      $('#menuItems').listview();
      return this;
    },
    
    buildActionsMenu: function(frag) {
      U.addToFrag(frag, this.groupHeaderTemplate({value: 'Actions'}));
      if (this.resource)
        this.buildActionsMenuForRes(frag);
      else
        this.buildActionsMenuForList(frag);
      
      U.addToFrag(frag, this.menuItemTemplate({title: 'Follow', mobileUrl: '', id: 'subscribe'}));
    },
    
    buildActionsMenuForList: function(frag) {
      var m = this.vocModel;
      var cMojo = m.classMojoMultiplier;
      var user = G.currentUser;
      if (!user.guest && typeof cMojo !== 'undefined' && user.totalMojo > cMojo)
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + U.encode(m.shortName), id: 'add'}));
    },
    
    buildActionsMenuForRes: function(frag) {
      var m = this.resource;
      var user = G.currentUser;
      var edit = m.get('edit');
      if (!user.guest  &&  edit  &&  user.totalMojo > edit) {
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + U.encode(m.constructor.shortName), id: 'add'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Edit', mobileUrl: 'edit/' + U.encode(m.get('_uri')), id: 'edit'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Delete', mobileUrl: '', id: 'delete'}));
      }
    },
    
    add: function() {
    },
    
    "delete": function() {
      alert('deleted...not really though');
    },
    
    subscribe: function() {
      alert('subscribed...not really though');
    }
  }, {
    displayName: 'MenuPage'
  });
});
