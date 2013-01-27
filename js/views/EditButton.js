define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events',
  'cache!views/BasicView'
], function(G, $, _, Backbone, Templates, Events, BasicView) {
  return BasicView.extend({
    template: 'editButtonTemplate',
    events: {
      'click #edit': 'edit'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
      var hash = window.location.hash.slice(1);
      (G.Router || Backbone.history).navigate('edit/' + encodeURIComponent(this.resource.get('_uri')), {trigger: true});
      return this;
    },
    render: function(options) {
      if (!this.template)
        return this;
      
      if (typeof options !== 'undefined' && options.append)
        this.$el.append(this.template());
      else
        this.$el.html(this.template());
      
      this.$('a').button();
      return this;
    }
  });
});