define([
  'globals',
  'cache!underscore', 
  'cache!templates',
  'cache!utils',
  'cache!events',
  'cache!views/MenuPanel',
  'cache!views/BasicView'
], function(G, _, Templates, U, Events, MenuPanel, BasicView) {
  return BasicView.extend({
    template: 'menuButtonTemplate',
    events: {
      'click #menuBtn': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      this.viewId = options.viewId;
      return this;
    },
    menu: function(e) {
      Events.stopEvent(e);
      var menuPanel = new MenuPanel({viewId: this.viewId, model: this.model});
      menuPanel.render();
////      Events.trigger('back');
////      window.history.back();
//      this.router.navigate('menu/' + U.encode(window.location.hash.slice(1)), {trigger: true, replace: false});
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template({viewId: this.viewId}));
      else
        this.$el.html(this.template());
      
      return this;
    }
  });
});