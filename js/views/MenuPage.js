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
      _.bindAll(this, 'render', 'tap', 'click', 'edit', 'buildActionsMenu', 'buildActionsMenuForList', 'buildActionsMenuForRes');
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('menu'));
      this.menuItemTemplate = _.template(Templates.get('menuItemTemplate'));
      this.groupHeaderTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
      'click #add': 'add',
      'click #delete': 'delete',
      'click #subscribe': 'subscribe'
    },
    edit: function(e) {
      e.preventDefault();
      Backbone.history.navigate('view/' + encodeURIComponent(this.model.get('_uri')) + "?-edit=y", {trigger: true, replace: true});
      return this;
    },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render:function (eventName) {
      console.log("render menuPage");
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
          t.mobileUrl = U.getMobileUrl(t.pageUrl);
          U.addToFrag(frag, self.menuItemTemplate(t));
        });
      }
      
      this.buildActionsMenu(frag);
      U.addToFrag(frag, self.groupHeaderTemplate({value: 'Profile'}));
      U.addToFrag(frag, this.menuItemTemplate({title: 'Take me to me', mobileUrl: 'profile'}));

      ul.append(frag);
      
      this.rendered = true;
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      var m = self.model;
      this.$el.live('swipeleft', function(event) {
        var newHash = m instanceof Backbone.Model ? 'view/' + encodeURIComponent(m.get('_uri')) : m instanceof Backbone.Collection ? m.model.shortName : G.homePage;
        Backbone.history.navigate(newHash, {trigger: true, replace: true});
      });
      
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
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + encodeURIComponent(m.shortName), id: 'add'}));
    },
    
    buildActionsMenuForRes: function(frag) {
      var m = this.model;
      var user = G.currentUser;
      if (!user.guest && m.edit && user.totalMojo > m.edit) {
        U.addToFrag(frag, this.menuItemTemplate({title: 'Add', mobileUrl: 'make/' + encodeURIComponent(m.constructor.shortName), id: 'add'}));
        U.addToFrag(frag, this.menuItemTemplate({title: 'Edit', mobileUrl: 'edit/' + encodeURIComponent(m.get('_uri')), id: 'edit'}));
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
