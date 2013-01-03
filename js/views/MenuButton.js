define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!utils',
  'cache!events' 
], function(G, $, __jqm__, _, Backbone, Templates, U, Events) {
  return Backbone.View.extend({
    template: 'menuButtonTemplate',
    events: {
      'click #menuBtn': 'menu'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'menu');
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    menu: function(e) {
      e.preventDefault();
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