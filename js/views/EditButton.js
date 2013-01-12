define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events' 
], function(G, $, __jqm__, _, Backbone, Templates, Events) {
  return Backbone.View.extend({
//    template: 'editButtonTemplate',
    events: {
      'click #edit': 'edit'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit');
//      this.template = _.template(Templates.get(this.template));
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      var hash = window.location.hash.slice(1);
      (G.Router || Backbone.history).navigate('edit' + hash.slice(hash.indexOf('/')), {trigger: true});
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