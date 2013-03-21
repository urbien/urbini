//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'vocManager',
  'views/BasicView'
], function(G, _, U, Events, Voc, BasicView) {
  return BasicView.extend({
    template: 'publishButtonTemplate',
    events: {
      'click #publish': 'publish',
      'click #tryTheApp': 'tryApp',
      'click #enterTournament': 'enterTournament',
      'click #fork': 'forkApp',
      'click #testAppPlug': 'testPlug'
    },
    initialize: function(options) {
      _.bindAll(this, 'render', 'publish', 'tryApp', 'testPlug', 'forkApp', 'enterTournament');
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type, true);
      this.makeTemplate('tryButtonTemplate', 'tryTemplate', this.vocModel.type, true);
      this.makeTemplate('forkButtonTemplate', 'forkTemplate', this.vocModel.type, true);
      this.makeTemplate('testPlugTemplate', 'testPlugTemplate', this.vocModel.type, true);
      this.makeTemplate('enterTournamentTemplate', 'enterTournamentTemplate', this.vocModel.type, true);
      return this;
    },
    testPlug: function(e) {
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
          self.router.navigate(hash, {trigger: true, replace: true, forceFetch: true});
//        window.location.reload();
        }
//      ,
//        queryString: 'publish=true'
//        error: onSaveError
      });
      return this;
    },
    enterTournament: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      
      var model = U.getModel('TournamentEntry');
      if (model != null) 
        resource = new model();
      else {
        Voc.fetchModels('http://www.hudsonfog.com/voc/commerce/urbien/TournamentEntry', 
          {success: function() {
            self.view.apply(self, [path]);
          },
          sync: true}
        );
        resource = new (U.getModel('TournamentEntry'))();
      }
      var params = U.getParamMap(window.location.hash);
      var props = {tournament: params['-tournament'], entry: res.getUri()};
      var self = this;
      resource.save(props, {
        sync: true,
        success: function(resource, response, options) {
          var uri = window.location.hash;
          var idx = uri.indexOf('?');
          
          self.router.navigate(uri.substring(1, idx + 1) + '-info=' + encodeURIComponent("You successfully added '" + U.getDisplayName(self.resource) + "'"), {trigger: true, replace: true, forceFetch: true});
        }
      });
      return this;
    },
    
    forkApp: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      this.router.navigate(U.makeMobileUrl('make', 'model/social/App', {forkedFrom: res.getUri()}), {trigger: true});
    },

    render: function(options) {
      if (options) {
        if (options.forkMe) {
          this.$el.html(this.forkTemplate());
          this.$el.trigger('create');
        }
        if (options.doTry) {
          this.$el.html(this.tryTemplate());
          this.$el.trigger('create');
        }
        if (options.testPlug) {
          this.$el.html(this.testPlugTemplate());
          this.$el.trigger('create');
        }
        if (options.enterTournament) {
          var params = U.getParamMap(window.location.href);
          this.$el.html(this.enterTournamentTemplate({name: params['-tournamentName']}));
          this.$el.trigger('create');
        }
      }
      else if (this.template) {
        this.$el.html(this.template());
        this.$el.trigger('create');
      }
      
      this.$('#tryTheApp').click(this.tryApp);
      return this;
    }
  });
});