define([
  'jquery',
  'backbone',
  'underscore',
  'templates',
  'jqueryMobile'
], function($, Backbone, _, Templates) {
  return Backbone.View.extend({
    template: 'backButtonTemplate',
    events: {
      'click #back': 'back'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'back');
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    back: function(e) {
      e.preventDefault();
      App.backClicked = true;
      window.history.back();
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