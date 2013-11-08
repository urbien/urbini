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
    
    windowEvents: {
      'click': 'clickElsewhere'
    },
    
    clickElsewhere: function(e) {
      if (e.currentTarget == this.el)
        return;
      
      if (this.leftMenuPanel) {
        this.leftMenuPanel.destroy();
        this.$leftMenuEl[0].style.visibility = 'hidden';
        this.leftMenuPanel = null;
      }
      
      if (this.rightMenuPanel) {
        this.rightMenuPanel.destroy();
        this.$rightMenuEl[0].style.visibility = 'hidden';
        this.rightMenuPanel = null;
      }
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'leftMenu', 'rightMenu', 'clickElsewhere');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      this.viewId = options.viewId;
      this.isChat = /^chat/.test(this.hash);
      return this;
    },
    
    _leftMenu: function(e) {
      var p = this.$leftMenuEl; //$('#' + this.viewId);
      // HACK
      var tagName = (p  &&  p[0].tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

//      if (!this.initialLeftMenuStyle)
//        this.initialLeftMenuStyle = p[0].style;
      
      this.leftMenuPanel = new MenuPanel({viewId: this.viewId, model: this.model, tagName: tagName, parentView: this.getPageView()});
      this.leftMenuPanel.render();
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
      var p = this.$rightMenuEl; //$('#' + this.viewId + 'r');
      // HACK
      var tagName = (p  &&  p[0].tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

//      if (!this.initialRightMenuStyle)
//        this.initialRightMenuStyle = p[0].style;
      
      this.rightMenuPanel = new RightMenuPanel({viewId: this.viewId, model: this.model, tagName: tagName, parentView: this.getPageView()});
      this.rightMenuPanel.render();        
    },
    
    rightMenu: function(e) {
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
        var $menuBadge = this.$('.menuBadge');
        $menuBadge.html(num || '');
        $menuBadge[num ? 'show' : 'hide']();
      }
    },
    
    render: function(options) {
      this.$el.html(this.template({viewId: this.viewId}));
      if (!this.rendered) {
        this.$leftMenuEl = this.pageView.$('#' + this.viewId);
        this.$rightMenuEl = this.pageView.$('#' + this.viewId + 'r');
      }
      
      this.finish();
      
      if (this.isChat) {
        this.pageView.on('chat:newParticipant', this.refresh, this);
        this.pageView.on('chat:participantLeft', this.refresh, this);
        this.refresh();
      }
      else {
        this.$('.menuBadge').hide();
      }
      
      return this;
    }
  },
  {
    displayName: 'RightMenuButton'
  });
});