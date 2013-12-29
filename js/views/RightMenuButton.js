//'use strict';
define('views/RightMenuButton', [
  'globals',
  'underscore', 
  'events',
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {
  var MainMenuPanel,
      RightMenuPanel;
  
  return BasicView.extend({
    tagName: 'li',
    id: 'rightMenuBtn',
    templateName: 'rightMenuButtonTemplate',
    events: {
      'tap': 'leftMenu',
      'hold': 'rightMenu'
    },
    
    pageEvents: {
      'tap': 'hidePanels'
    },

    hideLeftPanel: function() {
      if (this.leftMenuPanel) {
//      this.leftMenuPanel.destroy();
//        this.leftMenuEl.style.visibility = 'hidden';
//      this.leftMenuPanel = null;
        this.leftMenuPanel.hide();
      }
    },
    hideRightPanel: function() {
      if (this.rightMenuPanel) {
//      this.rightMenuPanel.destroy();
//        this.rightMenuEl.style.visibility = 'hidden';
  //      this.rightMenuPanel = null;
        this.rightMenuPanel.hide();
      }
    },
    
    hidePanels: function(e) {
//      if (e && e.currentTarget == this.el)
//        return;
      
      this.hideLeftPanel();
      this.hideRightPanel();
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'leftMenu', 'rightMenu', 'hidePanels');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      this.viewId = options.viewId;
      this.isChat = /^chat/.test(this.hash);
      return this;
    },
    
   refresh: function() {      
      this.findMenuBadge();
      if (this.menuBadge) {
        var num = this.isChat ? this.pageView.getNumParticipants() : G.currentUser.newAlertsCount;
        this.menuBadge.innerHTML = num || '';
        this.menuBadge.style.display = num ? '' : 'none';
      }
    },

   _leftMenu: function(e) {
      var self = this;
//      var p = this.leftMenuEl; //$('#' + this.viewId);
//      // HACK
//      var tagName = (p  &&  p.tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

//      if (!this.initialLeftMenuStyle)
//        this.initialLeftMenuStyle = p[0].style;
      if (this.leftMenuPanel) {
        if (G.isJQM())
          $(this.leftMenuEl).panel('open');
        this.leftMenuPanel.show();
//        this.leftMenuEl.style.visibility = 'visible';
      }
      else {
        this.leftMenuPanel = new MainMenuPanel({viewId: this.viewId, model: this.model, el: this.leftMenuEl, parentView: this.getPageView()});
        this.leftMenuPanel.render();
        this.leftMenuPanel.on('destroyed', function del() {
          self.leftMenuPanel.off('destroyed', del);
          self.hideLeftPanel();
          delete self.leftMenuPanel;
        });
      }
      
      return this;
    },
    
    leftMenu: function(e) {
      Events.stopEvent(e);
      var self = this;
      if (MainMenuPanel)
        return this._leftMenu(e);
      else {
        U.require('views/MainMenuPanel', function(mp) {
          MainMenuPanel = mp;
          self._leftMenu(e);
        });
      }
      
      return this;
    },
    
    _rightMenu: function(e) {
//      var p = this.rightMenuEl; //$('#' + this.viewId + 'r');
//      // HACK
//      var tagName = (G.isBB()  ||  G.isBootstrap()) ? 'nav' : 'div'; 
//      if (!this.initialRightMenuStyle)
//        this.initialRightMenuStyle = p[0].style;

      if (this.rightMenuPanel) {
        if (G.isJQM())
          $(this.rightMenuEl).panel('open');
        this.rightMenuPanel.show();
//        this.rightMenuEl.style.visibility = 'visible';
      }
      else {
        var self = this;
        this.rightMenuPanel = new RightMenuPanel({viewId: this.viewId, model: this.model, el: this.rightMenuEl, parentView: this.getPageView()});
        this.rightMenuPanel.render();
        this.rightMenuPanel.on('destroyed', function del() {
          self.rightMenuPanel.off('destroyed', del);
          self.hideRightPanel();
          delete self.rightMenuPanel;
        });
      }
    },
    
    rightMenu: function(e) {
      Events.stopEvent(e);
      if (G.currentUser.guest)
        return;
      
      if (RightMenuPanel)
        return this._rightMenu(e);
      else {
        var self = this;
        U.require('views/RightMenuPanel', function(rmp) {
          RightMenuPanel = rmp;
          self._rightMenu(e);
        });
      }
      
      return this;
    },
    
    findMenuBadge: function() {
      if (!this.menuBadge)
        this.menuBadge = (G.isBootstrap() ? this.$('.badge') : G.isTopcoat() ? this.$('.topcoat-notification') : this.$('.menuBadge'))[0];
    },
    
    render: function(options) {
      this.html(this.template({viewId: this.viewId}));
      this.findMenuBadge();
      if (!this.rendered) {
        this.leftMenuEl = this.pageView.$('#' + this.viewId)[0];
        this.rightMenuEl = this.pageView.$('#' + this.viewId + 'r')[0];

        // only allow tap and hold events, click muddies the waters
        this.el.addEventListener('click', function(e) {
//          e.preventDefault();
          Events.stopEvent(e);
        });
      }
      
      
      if (this.isChat) {
        this.listenTo(this.pageView, 'chat:newParticipant', this.refresh, this);
        this.listenTo(this.pageView, 'chat:participantLeft', this.refresh, this);
      }
      
      this.finish();
      this.refresh();
      return this;
    }
  },
  {
    displayName: 'RightMenuButton'
  });
});