//'use strict';
define('views/MenuButton', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'views/BasicView'
], function(G, _, U, Events, BasicView) {
  var MenuPanel;
  return BasicView.extend({
    tagName: 'li',
    id: 'menuBtn',
    templateName: 'menuButtonTemplate',
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
      G.log(this.TAG, "Recording step for tour: selector = 'id'; value = 'menuBtn'");
      U.require('views/MenuPanel', function(MenuPanel) {
        var menuPanel = new MenuPanel({viewId: this.viewId, model: this.model, parentView: this.getPageView()});
        menuPanel.render();        
      }.bind(this));

      return this;
    },

    refresh: function() {
      var num = G.currentUser.newAlertsCount;
      var $menuBadge = this.$('.menuBadge');
      $menuBadge.html(num || '');
      $menuBadge[num ? 'show' : 'hide']();
    },

    render: function(options) {
      this.$el.html(this.template({viewId: this.viewId}));
      this.finish();
      this.refresh();
      // when user profile gets updated, call this.refresh 
      return this;
    }
  },
  {
    displayName: 'MenuButton'
  });
});