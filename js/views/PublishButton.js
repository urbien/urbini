//'use strict';
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
      'click #publish': 'publish',
      'click #try': 'tryApp',
      'click #fork': 'forkApp'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'publish', 'tryApp');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get(this.template));
      this.tryTemplate = _.template(Templates.get('tryButtonTemplate'));
      this.forkTemplate = _.template(Templates.get('forkButtonTemplate'));
      return this;
    },
    tryApp: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      window.location.href = G.serverName + '/app/' + res.get('appPath');      
//      this.router.navigate('app/' + res.get('appPath'), {trigger: true});
    },
    publish: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      var props = {publish: true};
      var self = this;
      res.save(props, {
        sync: true,
        success: function(resource, response, options) {
//          if (response.error) {
//            onSaveError(resource, response, options);
//            return;
//          }
//          
//          $('.formElement').attr('disabled', false);
//          self.router.navigate(U.getHash(), {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
        window.location.reload();
        }
//      ,
//        queryString: 'publish=true'
//        error: onSaveError
      });
      return this;
    },
    forkApp: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
//      window.location.href = G.serverName + '/app/' + res.get('appPath');      
      this.router.navigate('make/model%2Fsocial%2FApp?basedOnTemplate='  + encodeURIComponent(res.get('_uri')), {trigger: true});
    },

    render: function(options) {
      if (options) {
        if (options.forkMe) {
          this.$el.html(this.forkTemplate());
          this.$el.trigger('create');
        }
        if (options  &&  options.tryApp) {
          this.$el.html(this.tryTemplate());
          this.$el.trigger('create');
        }
      }
      else if (this.template) {
        this.$el.html(this.template());
        this.$el.trigger('create');
      }
      return this;
    }
  });
});