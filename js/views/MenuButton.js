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
//      G.log(this.TAG, "Recording step for tour: selector = 'id'; value = 'menuBtn'");
      U.require('views/MenuPanel', function(MenuPanel) {
        var p = this.$('#' + this.viewId);
        // HACK
        var tagName = (p  &&  p[0].tagName.toLowerCase() == 'section') ? 'nav' : 'div'; 

        var menuPanel = new MenuPanel({viewId: this.viewId, model: this.model, tagName: tagName, parentView: this.getPageView()});
        menuPanel.render();        
      }.bind(this));

      return this;
    },

    refresh: function() {
      var num = G.currentUser.newAlertsCount;
      var menuBadge = this.$('.menuBadge')[0];
      menuBadge.innerHTML = num || '';
      menuBadge.style.display = num ? '' : 'none';
    },

    render: function(options) {
      this.html(this.template({viewId: this.viewId}));
      this.finish();
      this.refresh();
      if (options.width)
        this.el.$css('width', options.width + '%');
      
      // when user profile gets updated, call this.refresh 
      return this;
    }
  },
  {
    displayName: 'MenuButton'
  });
});