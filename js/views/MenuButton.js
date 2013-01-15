define([
  'globals',
  'cache!underscore', 
  'cache!templates',
  'cache!utils',
  'cache!events',
  'cache!views/BasicView'
], function(G, _, Templates, U, Events, BasicView) {
  return BasicView.extend({
    template: 'menuButtonTemplate',
    events: {
      'click #menuBtn': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    menu: function(e) {
      Events.stopEvent(e);
//      Events.trigger('back');
//      window.history.back();
      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(1)), {trigger: true, replace: false});
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else
        this.$el.html(this.template());
      
      return this;
    }
  });
});