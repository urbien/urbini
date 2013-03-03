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
      'click #fork': 'forkApp',
      'click #testHandler': 'testHandler'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'publish', 'tryApp', 'testHandler', 'forkApp');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = this.makeTemplate(this.template);
      this.tryTemplate = this.makeTemplate('tryButtonTemplate');
      this.forkTemplate = this.makeTemplate('forkButtonTemplate');
      this.testHandlerTemplate = this.makeTemplate('testHandlerTemplate');
      return this;
    },
    testHandler: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      var cause = res.get('causeDavClassUri');
      var effect = res.get('effectDavClassUri');
//      window.location.href = G.serverName + '/app/' + res.get('appPath');
      var params = {};
      params.plugin = res.getUri();
      if (!G.currentUser.guest) {
        var vocModel = res.vocModel;
        var submittedBy = U.getCloneOf(vocModel, 'Submission.submittedBy');
        if (submittedBy.length) {
          submittedBy = submittedBy[0];
          params[submittedBy] = '_me';
        }
      }
      
      var effectList = U.makeMobileUrl('list', effect, params);
      this.router.navigate(U.makeMobileUrl('make', cause, {$returnUri: effectList}), {trigger: true});
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
//          debugger;
          var query = U.getQueryParams();
          var hash = window.location.href;
          hash = hash.slice(hash.indexOf('#') + 1);
          if (_.size(query))
            hash = hash.slice(0, hash.indexOf('?'));
          
          query.$nonce = new Date().getTime();
          hash = hash + '?' + $.param(query);
          self.router.navigate(hash, {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
//        window.location.reload();
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
      this.router.navigate(U.makeMobileUrl('make', 'model/social/App', {basedOnTemplate: res.getUri()}), {trigger: true});
    },

    render: function(options) {
      if (options) {
        if (options.forkMe) {
          this.$el.html(this.forkTemplate());
          this.$el.trigger('create');
        }
        if (options.tryApp) {
          this.$el.html(this.tryTemplate());
          this.$el.trigger('create');
        }
        if (options.testHandler) {
          this.$el.html(this.testHandlerTemplate());
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