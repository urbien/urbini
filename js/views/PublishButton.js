'use strict';
define([
  'globals',
  'underscore', 
  'templates',
  'utils',
  'events',
  'views/BasicView'
], function(G, _, Templates, U, Events, BasicView) {
  return BasicView.extend({
    template: 'publishButtonTemplate',
    events: {
      'click #publish': 'publish'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'publish');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      return this;
    },
    publish: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      var props = {deploy: true};
      var self = this;
      res.save(props, {
        success: function(resource, response, options) {
//          if (response.error) {
//            onSaveError(resource, response, options);
//            return;
//          }
//          
//          $('.formElement').attr('disabled', false);
          self.router.navigate(window.location.href, {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
        },
        queryString: 'deploy=true'
//        error: onSaveError
      });
      return this;
    },
    render: function() {
      if (this.template) {
        this.$el.html(this.template());
        this.$el.trigger('create');
      }
      return this;
    }
  });
});