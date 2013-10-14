//'use strict';
define('views/MenuPanel', [
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
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.tagName = options.tagName;
      var type = this.modelType;
      this.makeTemplate('menuP', 'template', type);
      this.makeTemplate('menuItemTemplate', 'menuItemTemplate', type);
      this.makeTemplate('homeMenuItemTemplate', 'homeMenuItemTemplate', type);
      this.makeTemplate('propGroupsDividerTemplate', 'groupHeaderTemplate', type);
      this.makeTemplate('menuItemNewAlertsTemplate', 'menuItemNewAlertsTemplate', type);
//      this.makeTemplate('filterTemplate', 'filterTemplate', type);
      this.viewId = options.viewId;
      this.isPanel = true;
    },
    tabs: {},
    events: {
      'click #edit'      : 'edit',
//      'click #add': 'add',
//      'click #delete': 'delete',
//      'click #subscribe': 'subscribe',
      'click #logout'    : 'logout',
      'click #home123'   : 'home',
      'click #urbien123' : 'home',
      'click'            : 'click'
    },
    edit: function(e) {
      Events.stopEvent(e);
      this.router.navigate(U.makeMobileUrl('edit', this.resource.getUri()), {trigger: true, replace: true});
      return this;
    },
    logout: function(e) {
      Events.stopEvent(e);
      G.log(this.TAG, "Recording step for tour: selector: #logout");
      Events.trigger('logout');
      return;
    },
    home: function(e) {
      Events.stopEvent(e);
      var here = window.location.href;
      var t = e.target;
      while (t.tagName.toLowerCase() != 'li') 
        t = t.parentNode;
      
      G.log(this.TAG, "Recording step for tour: selector = 'id'; value = '" + t.id + "'");
      if (t.id == 'home123') 
        window.location.href = here.slice(0, here.indexOf('#'));
      else 
        window.location.href = G.serverName + '/app/UrbienApp';
      
      return this;
    },
    click: function(e) {
      var t = e.target;
      var text = t.innerHTML;
      while (t  &&  t.nodeName.toLowerCase() != 'a') {
        if ($(t).attr("data-href"))
          break;
        t = t.parentNode;
      }
      
      if (typeof t === 'undefined' || !t)
        return;
      
      text = U.removeHTML(text).trim();
      var attr;
      if ($(t).attr('href'))
        attr = 'href';
      else if ($(t).attr('link'))
        attr = 'link';
      else
        attr = 'data-href';
      
      var href = $(t).attr(attr); //$(t).attr('href') || $(t).attr('link') || $(t).attr("data-href");
      G.log(this.TAG, "Recording step for tour: selector = '" + attr + "'; value = '" + href + "'");
      
      
      var idx = href.lastIndexOf('#');
      href = idx == -1 ? href : href.slice(idx + 1);
          
      if (this.tabs[text]) {
        if (this.tabs[text] == href) {
          e.originalEvent.preventDefault();
          this.router.navigate(href, {trigger: true, destinationTitle: text});
          return;
        }
      }
      if (href.indexOf("Alert?") != -1) 
        G.currentUser.newAlertsCount = 0;

      var hash = window.location.hash;
      if (hash  &&  href == hash.substring(1)) {
        var menu = this.$el.closest('[data-role="panel"]');
//        menu.hide('slow');
        menu.panel('close');
        return;
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
      var mi = $('#' + this.viewId).find('ul#menuItems');
      if (mi  &&  mi.length != 0) {
//        $('#' + this.viewId).panel().panel("open");
        $('#' + this.viewId).panel("open");
        return;
      }
      var self = this;
      var res = this.model;
      var json = this.resource && res.toJSON();
      
      if (!res)
        this.$el.html(this.template({}));      
      else
        this.$el.html(this.template(json));      

      var ul = this.$('#menuItems');
      var frag = document.createDocumentFragment();

      if (!G.currentUser.guest) {
        var mobileUrl = 'view/profile';
        if (!hash  ||  hash != mobileUrl) {
          var title = this.loc('profile');
          U.addToFrag(frag, this.menuItemTemplate({title: title, mobileUrl: mobileUrl, image: G.currentUser.thumb, cssClass: 'menu_image_fitted' }));
          self.tabs[title] = U.getPageUrl(mobileUrl);
        } 
      }
      if (G.tabs) {
        var tabs = _.clone(G.tabs);
//        U.addToFrag(frag, self.menuItemTemplate({title: 'Home', icon: 'home', pageUrl: G.pageRoot}));
//        U.addToFrag(frag, self.groupHeaderTemplate({value: G.appName}));
        _.each(tabs, function(t) {
//          t.mobileUrl = t.mobileUrl || U.getMobileUrl(t.pageUrl);
          t.pageUrl = t.hash;
          U.addToFrag(frag, self.menuItemTemplate(t))
//          self.tabs[t.title] = t.mobileUrl;
        });
        
        tabs = null;
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
        U.addToFrag(frag, self.groupHeaderTemplate({value: this.loc('account')}));
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
                
        var user = G.currentUser;
        var installed = user.installedApps;
        if (_.size(installed)) {
//          // get the _uri values of all the apps, cut out their primary key appId, make a small csv. Url hashes can be arbirarily long? 
//          var $in = 'appId,' + _.map(_.pluck(_.toArray(installed), '_uri'), function(uri) {
//            return uri.slice(uri.indexOf('=') + 1);
//          }).join(',');
          
          var $in = '_uri,' + _.pluck(_.toArray(installed), 'application').join(',');
          
          // Apps I installed
          U.addToFrag(frag, this.menuItemTemplate({title: this.loc("myApps"), mobileUrl: U.makeMobileUrl('list', "model/social/App", {$in: $in, $myApps: 'y'})}));          
        }
        
        // Apps I created
//        U.addToFrag(frag, this.menuItemTemplate({title: "My Apps", mobileUrl: U.makeMobileUrl('list', "model/social/App", {creator: '_me'})}));

//        if (user.newAlertsCount) {
          U.addToFrag(frag, this.menuItemNewAlertsTemplate({title: this.loc('notifications'), newAlerts: user.newAlertsCount, pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {to: '_me'/*, markedAsRead: false*/}) }));
//        }
        /*
        if (user.alertsCount) {
          var loc = window.location.href;
          loc += (loc.indexOf('?') == -1 ? '?' : '&') + '$clearAlerts=y' + "&-info=" + encodeURIComponent("Notifications were successfully deleted");
          U.addToFrag(frag, this.menuItemTemplate({title: 'Clear Notifications', pageUrl: lo }));
//        U.addToFrag(frag, this.menuItemTemplate({title: 'Clear Notifications', pageUrl: U.makePageUrl('list', 'model/workflow/Alert', {sender: '_me', $clear: 'true', $returnUri: window.location.href}) }));
        }
        */
        U.addToFrag(frag, this.menuItemTemplate({title: this.loc("logout"), id: 'logout', pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) }));
      }

//      U.addToFrag(frag, this.homeMenuItemTemplate({title: "App Home", icon: 'repeat', id: 'home123'}));
      if (window.location.hash.length > 0)
        U.addToFrag(frag, this.menuItemTemplate({title: this.loc("appHome"), icon: 'repeat', id: 'home123'}));
      
      if (G.pageRoot != 'app/UrbienApp') {
//        U.addToFrag(frag, this.homeMenuItemTemplate({title: "Urbien Home", icon: 'repeat', id: 'urbien123'}));
        U.addToFrag(frag, this.menuItemTemplate({title: this.loc("urbienHome"), icon: 'repeat', id: 'urbien123', mobileUrl: '#'}));
      }
      
      ul.append(frag);      
      var p = $('#' + this.viewId);
      p.append(this.$el);
      if (p  &&  p[0].tagName.toLowerCase() == 'section') 
        p.css('visibility', 'visible');
      else {
        p.panel("open");
        this.$('#menuItems').listview();
      }
//      p.panel().panel("open");
//      this.$('#menuItems').listview();
      
      return this;
    }
  }, 
  {
    displayName: 'MenuPanel'
  });
});
