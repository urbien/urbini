//'use strict';
define('views/RightMenuButton', [
  'globals',
  'underscore', 
  'events',
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {
  var MenuPanel,
      RightMenuPanel;
  
  return BasicView.extend({
    tagName: 'li',
    id: 'rightMenuBtn',
    templateName: 'rightMenuButtonTemplate',
    events: {
      'click': 'leftMenu',
      'hold': 'rightMenu'
    },
    
    pageEvents: {
      'click': 'hidePanels'
    },

    hideLeftPanel: function() {
      if (this.leftMenuPanel) {
//      this.leftMenuPanel.destroy();
        this.leftMenuEl.style.visibility = 'hidden';
//      this.leftMenuPanel = null;
      }
    },

    hideRightPanel: function() {
      if (this.rightMenuPanel) {
//      this.rightMenuPanel.destroy();
        this.rightMenuEl.style.visibility = 'hidden';
  //      this.rightMenuPanel = null;
      }
    },
    
    hidePanels: function(e) {
//      if (e && e.currentTarget == this.el)
//        return;
      
      this.hideLeftPanel();
      this.hideRightPanel();
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'leftMenu', 'rightMenu', 'hidePanels');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      this.viewId = options.viewId;
      this.isChat = /^chat/.test(this.hash);
      return this;
    },
    
    _leftMenu: function(e) {
      var self = this;
      var p = this.leftMenuEl; //$('#' + this.viewId);
      // HACK
      var tagName = (p  &&  p.tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

//      if (!this.initialLeftMenuStyle)
//        this.initialLeftMenuStyle = p[0].style;
      if (this.leftMenuPanel)
        this.leftMenuEl.style.visibility = 'visible';
      else {
        this.leftMenuPanel = new MenuPanel({viewId: this.viewId, model: this.model, tagName: tagName, parentView: this.getPageView()});
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
      var self = this;
      Events.stopEvent(e);
      if (MenuPanel)
        return this._leftMenu.apply(this, arguments);
      else {
        U.require('views/MenuPanel', function(mp) {
          MenuPanel = mp;
          self.leftMenu(e);
        });
      }
      
      return this;
    },
    
    _rightMenu: function(e) {
      var self = this;
      var p = this.rightMenuEl; //$('#' + this.viewId + 'r');
      // HACK
      var tagName = (p && p.tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

//      if (!this.initialRightMenuStyle)
//        this.initialRightMenuStyle = p[0].style;

      if (this.rightMenuPanel)
        this.rightMenuEl.style.visibility = 'visible';
      else {
        this.rightMenuPanel = new RightMenuPanel({viewId: this.viewId, model: this.model, tagName: tagName, parentView: this.getPageView()});
        this.rightMenuPanel.render();
        this.rightMenuPanel.on('destroyed', function del() {
          self.rightMenuPanel.off('destroyed', del);
          self.hideRightPanel();
          delete self.rightMenuPanel;
        });
      }
    },
    
    rightMenu: function(e) {
      if (G.currentUser.guest)
        return;
      
      var self = this;
      Events.stopEvent(e);
      if (RightMenuPanel)
        return this._rightMenu.apply(this, arguments);
      else {
        U.require('views/RightMenuPanel', function(rmp) {
          RightMenuPanel = rmp;
          self.rightMenu(e);
        });
      }
      
      return this;
    },
    
    refresh: function() {
      if (this.isChat) {
        var num = this.pageView.getNumParticipants();
        this.menuBadge.innerHTML = num || '';
        this.menuBadge.style.display = num ? '' : 'none';
      }
    },
    
    render: function(options) {
      this.html(this.template({viewId: this.viewId}));
      this.menuBadge = this.$('.menuBadge')[0];
      if (!this.rendered) {
        this.leftMenuEl = this.pageView.el.querySelector('#' + this.viewId);
        this.rightMenuEl = this.pageView.el.querySelector('#' + this.viewId + 'r');
      }
      
      this.finish();
      
      if (this.isChat) {
        this.pageView.on('chat:newParticipant', this.refresh, this);
        this.pageView.on('chat:participantLeft', this.refresh, this);
        this.refresh();
      }
      else
        this.menuBadge.style.display = 'none';
      
      return this;
    }
  },
  {
    displayName: 'RightMenuButton'
  });
});