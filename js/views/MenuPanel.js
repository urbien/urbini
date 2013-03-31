//'use strict';
define([
  'globals',
  'utils',
  'events',
  'vocManager',
  'views/BasicView'
], function(G, U, Events, Voc, BasicView) {
  return BasicView.extend({
//    role: 'data-panel',
//    id: 'menuPanel',
//    theme: 'd',
    TAG: 'MenuPanel',
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'edit', 'buildActionsMenu', 'buildActionsMenuForList', 'buildActionsMenuForRes');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.makeTemplate('menuP', 'template', this.vocModel.type);
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', this.vocModel.type);
      this.makeTemplate('homeMenuItemTemplate', 'homeMenuItemTemplate', this.vocModel.type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', this.vocModel.type);
      this.makeTemplate('menuItemNewAlertsTemplate', 'menuItemNewAlertsTemplate', this.vocModel.type);
//      this.makeTemplate('filterTemplate', 'filterTemplate', this.vocModel.type);
      this.TAG = 'MenuPanel';
      Events.on("mapReady", this.showMapButton);
      this.viewId = options.viewId;
      this.isPanel = true;
    },
    tabs: {},
    events: {
      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe',
      'click #logout': 'logout',
      'click #home123': 'home',
      'click #urbien123': 'home',
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
      if (e.target.id == 'home123')
        window.location.href = here.slice(0, here.indexOf('#'));
      else
        window.location.href = G.serverName + '/app/UrbienApp';
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
      var mi = $('#' + this.viewId).find('ul');
      if (mi  &&  mi.length != 0) {
        $('#' + this.viewId).panel("open");
        return;
      }
      var self = this;
      var res = this.model;
      var json = this.resource && res.toJSON();
      this.$el.html(this.template(json));      

      var ul = this.$('#menuItems');
      var frag = document.createDocumentFragment();

      if (!G.currentUser.guest) {
        var mobileUrl = 'view/profile';
        if (!hash  ||  hash != mobileUrl) {
          var title = 'Profile';
          U.addToFrag(frag, this.menuItemTemplate({title: title, mobileUrl: mobileUrl, image: G.currentUser.thumb, cssClass: 'menu_image_fitted' }));
          self.tabs[title] = U.getPageUrl(mobileUrl);
        } 
      }
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
//        params.webClassesCount = 'null';
        params = {'$or': U.getQueryString(params, {delimiter: '||'})};
      }
      
      params.dashboard = '!=null';
      var hash = window.location.hash;
      hash = G.pageRoot + hash;
      
//      var url = encodeURIComponent('model/social/App') + "?" + $.param(params);
      if (G.pageRoot != 'app/UrbienApp') {
        U.addToFrag(frag, this.homeMenuItemTemplate({title: "Urbien Home", icon: 'home', id: 'urbien123'}));
        ul.append(frag);
      }
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
      this.buildActionsMenu(frag);      
      if (this.resource  &&  U.isA(this.vocModel, 'ModificationHistory')) {
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
        
        var isCreatorOrAdmin = (G.currentUser._uri == G.currentApp.creator  ||  U.isUserInRole(U.getUserRole(), 'admin', res));
//        var isCreatorOrAdmin = (G.currentUser._uri == G.currentApp.creator  ||  (this.resource  &&  U.isUserInRole(U.getUserRole(), 'admin', res)) || (this.collection &&  this.collection.models.length  &&  U.isUserInRole(U.getUserRole(), 'admin', res.models[0])));
        if (this.resource && isCreatorOrAdmin) {
          var uri = U.getLongUri1(G.currentApp._uri);
          pageUrl = U.makePageUrl('view', uri);
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
          
//          var myChildren = this.children;
//          var currentViewChildren = G.Router.currentView.children;
//          var templatesUsed = _.union([], _.map(children, function(child, name) {
//            return this.templates;
//          }));
        }
        
        if (isCreatorOrAdmin) { //  &&  this.vocModel.type.indexOf('/dev/') != -1) {
          var wHash = U.getHash(true);
          var params = {};
          params.modelName = this.vocModel.displayName;
          U.addToFrag(frag, this.menuItemTemplate({title: 'Edit page', pageUrl: U.makePageUrl('templates', wHash, params)}));
        }
        
        var user = G.currentUser;
        var installed = user.installedApps;
        if (_.size(installed)) {
//          // get the _uri values of all the apps, cut out their primary key appId, make a small csv. Url hashes can be arbirarily long? 
//          var $in = 'appId,' + _.map(_.pluck(_.toArray(installed), '_uri'), function(uri) {
//            return uri.slice(uri.indexOf('=') + 1);
//          }).join(',');
          
          var $in = '_uri,' + _.pluck(_.toArray(installed), '_uri').join(',');
          
          // Apps I installed
          U.addToFrag(frag, this.menuItemTemplate({title: "My Apps", mobileUrl: U.makeMobileUrl('list', "model/social/App", {$in: $in, $myApps: 'y'})}));          
        }
        
        // Apps I created
//        U.addToFrag(frag, this.menuItemTemplate({title: "My Apps", mobileUrl: U.makeMobileUrl('list', "model/social/App", {creator: '_me'})}));

        if (user.newAlertsCount) {
//          pageUrl = encodeURIComponent('model/workflow/Alert') + '?sender=_me&markedAsRead=false';
          U.addToFrag(frag, this.menuItemNewAlertsTemplate({title: 'Notifications', newAlerts: user.newAlertsCount, pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {sender: '_me', markedAsRead: false}) }));
        }
        
        U.addToFrag(frag, this.menuItemTemplate({title: "Logout", id: 'logout', pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) }));
      }

      U.addToFrag(frag, this.homeMenuItemTemplate({title: "Home", icon: 'home', id: 'home123'}));
      ul.append(frag);
      
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
        U.addToFrag(frag, this.menuItemTemplate({title: 'Edit', mobileUrl: 'edit/' + U.encode(m.getUri()), id: 'edit'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Delete', mobileUrl: '', id: 'delete'}));
      }
    },
    
    add: function() {
    },
    
    "delete": function() {
      alert('deleted...not really though');
    },
    
    subscribe: function() {
      Events.stopEvent(e);
      var self = this;
      Voc.getModels("model/portal/MySubscription").done(function() {
        var m = U.getModel("model/portal/MySubscription");
        var res = new m();
        var props = {forum: self.resource.getUri(), owner: G.currentUser._uri};
        res.save(props, {
          sync: true,
          success: function(resource, response, options) {
            var rUri = self.resource.getUri();
            var uri = 'view/' + encodeURIComponent(rUri) + '?-info=' + encodeURIComponent("You were successfully subscribed to " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName'));
            self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true, removeFromView: true});
          },
          error: function(resource, xhr, options) {
            var code = xhr ? xhr.code || xhr.status : 0;
            switch (code) {
            case 401:
              Events.trigger('req-login');
//              Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
//              Events.on(401, msg || 'You are not unauthorized to make these changes');
              break;
            case 404:
              debugger;
              Errors.errDialog({msg: msg || 'Item not found', delay: 100});
              break;
            case 409:
              debugger;
              var rUri = self.resource.getUri();
              var uri = 'view/' + encodeURIComponent(rUri) + '?-info=' + encodeURIComponent("You've already been subscribed to " + self.vocModel.displayName + ' ' + self.resource.get('davDisplayName'));
              self.router.navigate(uri, {trigger: true, replace: true, forceFetch: true, removeFromView: true});
//              Errors.errDialog({msg: msg || 'The resource you\re attempting to create already exists', delay: 100});
              break;
            default:
              Errors.errDialog({msg: msg || xhr.error && xhr.error.details, delay: 100});
//              debugger;
              break;
            }
          }
        });
//        self.redirect.apply(self, args);
      }).fail(function() {
        self.router.navigate(U.makeMobileUrl('view', uri), options);
      });

      alert('subscribed...not really though');
    }
    
  }, 
  
  
  {
    displayName: 'MenuPage'
  });
});
