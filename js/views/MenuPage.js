define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!templates',
  'cache!views/Header',
  'cache!views/BackButton',
  'cache!views/LoginButtons',
  'cache!views/ResourceView',
  'cache!jqueryMobile'
], function(G, $, _, Backbone, U, Events, Templates, Header, BackButton, LoginButtons, ResourceView, __jqm__) {
  return Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'edit', 'buildActionsMenu', 'buildActionsMenuForList', 'buildActionsMenuForRes', 'swipeleft', 'swiperight');
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('menu'));
      this.menuItemTemplate = _.template(Templates.get('menuItemTemplate'));
      this.groupHeaderTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.router = G.app.router || Backbone.history;
      this.TAG = 'MenuPage';
      Events.on("mapReady", this.showMapButton);
    },
    tabs: {},
    events: {
      'click': 'click',
      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe',
      'swipeleft': 'swipeleft',
      'swiperight': 'swiperight'
    },
    swipeleft: function() {
      G.log(this.TAG, 'events', "swipeleft");
      window.history.back();
//      var m = this.model;
//      var newHash = m instanceof Backbone.Model ? 'view/' + U.encode(m.get('_uri')) : m instanceof Backbone.Collection ? m.model.shortName : G.homePage;
//      this.router.navigate(newHash, {trigger: true, replace: true});
    },
    swiperight: function() {
      G.log(this.TAG, 'events', "swiperight");
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('view/' + U.encode(this.model.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
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
      
      if (this.tabs[text]) {
        var href = t.href.slice(t.href.lastIndexOf('#') + 1)
        if (this.tabs[text] == href) {
          e.originalEvent.preventDefault();
          this.router.navigate(href, {trigger: true, replace: true, destinationTitle: text});
          return;
        }
      }
    },
//    tap: Events.defaultTapHandler,
    render:function (eventName) {
      G.log(this.TAG, "render");
      var self = this;
      this.$el.html(this.template(this.model.toJSON()));      
      this.buttons = {
        left: [BackButton, LoginButtons],
        right: []
      };
      
      this.header = new Header({
        model: this.model, 
        pageTitle: '', //this.model.get('davDisplayName'), 
        buttons: this.buttons,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');
      var ul = this.$('#menuItems');
      var frag = document.createDocumentFragment();
      if (G.tabs) {
        U.addToFrag(frag, self.groupHeaderTemplate({value: G.appName}));
        _.each(G.tabs, function(t) {
          t.mobileUrl = t.mobileUrl || U.getMobileUrl(t.pageUrl);
          U.addToFrag(frag, self.menuItemTemplate(t));
          self.tabs[t.title] = t.mobileUrl;
        });
      }
      
      this.buildActionsMenu(frag);
      if (!G.currentUser.guest) {
        U.addToFrag(frag, self.groupHeaderTemplate({value: 'Account'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Profile', mobileUrl: 'view/profile'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Logout', pageUrl: 'j_security_check?j_signout=true&amp;returnUri=' + G.pageRoot}));
      }
      
      ul.append(frag);
      
      this.rendered = true;
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      var m = this.model;      
      return this;
    },
    
    buildActionsMenu: function(frag) {
      U.addToFrag(frag, this.groupHeaderTemplate({value: 'Actions'}));
      if (this.model instanceof Backbone.Collection)
        this.buildActionsMenuForList(frag);
      else
        this.buildActionsMenuForRes(frag);
      
      U.addToFrag(frag, this.menuItemTemplate({title: 'Subscribe', mobileUrl: '', id: 'subscribe'}));
    },
    
    buildActionsMenuForList: function(frag) {
      var m = this.model.model;
      var cMojo = m.classMojoMultiplier;
      var user = G.currentUser;
      if (!user.guest && typeof cMojo !== 'undefined' && user.totalMojo > cMojo)
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + U.encode(m.shortName), id: 'add'}));
    },
    
    buildActionsMenuForRes: function(frag) {
      var m = this.model;
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
    
    delete: function() {
      alert('deleted...not really though');
    },
    
    subscribe: function() {
      alert('subscribed...not really though');
    }
  });
});
