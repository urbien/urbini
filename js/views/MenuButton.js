//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  var MenuPanel;
  return BasicView.extend({
    TAG: 'MenuButton',
    tagName: 'li',
    id: '#menuBtn',
    templateName: 'menuButtonTemplate',
    events: {
      'click': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.templateName, 'template', this.vocModel.type);
      this.viewId = options.viewId;
      return this;
    },
    menu: function(e) {
      Events.stopEvent(e);
      U.require('views/MenuPanel', function(MenuPanel) {
        var menuPanel = new MenuPanel({viewId: this.viewId, model: this.model, parentView: this.getPageView()});
        menuPanel.render();        
      }, this);

      return this;
    },
    
    render: function(options) {
      if (!this.template)
        return this;
      
      var newAlerts = G.currentUser.newAlertsCount;
      this.$el.html(this.template({viewId: this.viewId, newAlerts: newAlerts}));
      return this;
    }
  });
});