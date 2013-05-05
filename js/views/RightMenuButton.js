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
    
    render: function(options) {
      if (!this.template)
        return this;
      
      var isChat = this.hash.startsWith('chat/');
      var num;
      if (isChat)
        num = this.pageView.getNumParticipants();
      
      this.$el.html(this.template({viewId: this.viewId, count: num}));
      return this;
    }
  },
  {
    displayName: 'RightMenuButton'
  });
});