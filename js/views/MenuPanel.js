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
      this.groupHeaderTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.TAG = 'MenuPanel';
      Events.on("mapReady", this.showMapButton);
      this.viewId = options.viewId;
    },
    tabs: {},
    events: {
      'click': 'click',
      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe'
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
      this.router.navigate('view/' + U.encode(this.resource.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
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
      if (this.tabs[text]) {
        var href = $(t).attr('href') || $(t).attr('link');
        var idx = href.lastIndexOf('#');
        var href = idx == -1 ? href : href.slice(idx + 1)
        if (this.tabs[text] == href) {
          e.originalEvent.preventDefault();
          this.router.navigate(href, {trigger: true, replace: true, destinationTitle: text});
          return;
        }
      }
      var link = $(t).attr('link');
      if (link) {
        $(t).removeAttr('link');
        $(t).attr('href', link);
      }
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
          t.mobileUrl = t.hash;
          U.addToFrag(frag, self.menuItemTemplate(t));
//          self.tabs[t.title] = t.mobileUrl;
        });
      }
      
      var params = {lastDeployed: '!null'};
      if (!G.currentUser.guest) {
        params.creator = '_me';
        debugger;
        params = {'$or': U.getQueryString(params, {delimiter: '||'})};
      }
      
      U.addToFrag(frag, this.menuItemTemplate({title: 'App gallery', pageUrl: G.pageRoot + '#' + encodeURIComponent('model/social/App') + "?" + $.param(params) }));        
      
      this.buildActionsMenu(frag);      
      if (this.resource  &&  U.isA(this.vocModel, 'ModificationHistory', G.typeToModel)) {
        var ch = U.getCloneOf(this.vocModel, 'ModificationHistory.allowedChangeHistory');
        if (!ch  ||  ch.length == 0)
          ch = U.getCloneOf(this.vocModel, 'ModificationHistory.changeHistory');
        if (ch  &&  ch.length != 0  && !this.vocModel.properties[ch[0]].hidden) { 
          var cnt = res.get(ch[0]) && res.get(ch[0]).count;
          if (cnt  &&  cnt > 0) 
            U.addToFrag(frag, this.menuItemTemplate({title: "Activity", pageUrl: G.pageRoot + '#' + encodeURIComponent('system/changeHistory/Modification') + '?forResource=' + encodeURIComponent(this.resource.get('_uri'))}));
        }
      }
      if (!G.currentUser.guest) {
        U.addToFrag(frag, self.groupHeaderTemplate({value: 'Account'}));

        pageUrl = 'view/profile';
        var title = 'Profile';
        U.addToFrag(frag, this.menuItemTemplate({title: title, pageUrl: pageUrl, image: G.currentUser.thumb}));
        self.tabs[title] = pageUrl;

        U.addToFrag(frag, this.menuItemTemplate({title: "Logout", pageUrl: G.serverName + '/j_security_check?j_signout=true&returnUri=' + encodeURIComponent(G.pageRoot) }));
      }
      U.addToFrag(frag, this.menuItemTemplate({title: "Home", pageUrl: G.serverName + '/' + G.pageRoot, icon: 'home'}));

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
    
    edit: function() {
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
