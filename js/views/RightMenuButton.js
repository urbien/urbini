//'use strict';
define('views/RightMenuButton', [
  'globals',
  'underscore', 
  'events',
  'views/BasicView'
], function(G, _, Events, BasicView) {
  return BasicView.extend({
    tagName: 'li',
    id: '#rightMenuBtn',
    templateName: 'rightMenuButtonTemplate',
    events: {
      'click': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.modelType);
      this.viewId = options.viewId;
      this.isChat = /^chat/.test(this.hash);
      return this;
    },
    
    menu: function(e) {
      Events.stopEvent(e);
      require('views/RightMenuPanel', function(RightMenuPanel) {
        var menuPanel = new RightMenuPanel({viewId: this.viewId, model: this.model, parentView: this.getPageView()});
        menuPanel.render();        
      }.bind(this));

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