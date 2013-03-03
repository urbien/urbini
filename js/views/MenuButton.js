//'use strict';
define([
  'globals',
  'underscore', 
  'templates',
  'utils',
  'events',
  'views/BasicView'
], function(G, _, Templates, U, Events, BasicView) {
  var MenuPanel;
  return BasicView.extend({
    template: 'menuButtonTemplate',
    events: {
      'click #menuBtn': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = this.makeTemplate(this.template);
      this.viewId = options.viewId;
      return this;
    },
    menu: function(e) {
      Events.stopEvent(e);
      G.require('views/MenuPanel', function(MenuPanel) {
        var menuPanel = new MenuPanel({viewId: this.viewId, model: this.model});
        menuPanel.render();        
      }, this);

      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      var newAlerts = G.currentUser.newAlertsCount;
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template({viewId: this.viewId, newAlerts: newAlerts}));
      else
        this.$el.html(this.template());
      
      return this;
    }
  });
});