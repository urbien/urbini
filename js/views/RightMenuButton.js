//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
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
      this.isChat = this.hash.startsWith('chat/');
      return this;
    },
    menu: function(e) {
      Events.stopEvent(e);
      U.require('views/RightMenuPanel', function(RightMenuPanel) {
        var menuPanel = new RightMenuPanel({viewId: this.viewId, model: this.model, parentView: this.getPageView()});
        menuPanel.render();        
      }, this);

      return this;
    },
    
    refresh: function() {
//      this.$el.empty();
//      this.render();
//      this.parentView.forceRerender();
      var num = this.pageView.getNumParticipants();
      var $menuBadge = this.$('.menuBadge');
      $menuBadge.html(num || '');
      $menuBadge[num ? 'show' : 'hide']();
    },
    
    render: function(options) {
      var num;
      if (this.isChat) {
        num = this.pageView.getNumParticipants();
        this.pageView.on('chat:newParticipant', this.refresh, this);
        this.pageView.on('chat:participantLeft', this.refresh, this);
      }
      
      this.$el.html(this.template({viewId: this.viewId, count: num}));
      this.finish();
      this.refresh();
      return this;
    }
  },
  {
    displayName: 'RightMenuButton'
  });
});