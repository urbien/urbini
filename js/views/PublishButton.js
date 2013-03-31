//'use strict';
define([
  'globals',
  'underscore', 
  'utils',
  'events',
  'vocManager',
  'views/BasicView',
  'cache'
], function(G, _, U, Events, Voc, BasicView, C) {
  var SPECIAL_BUTTONS = ['enterTournament', 'forkMe', 'publish', 'doTry', 'testPlug']; //, 'resetTemplate'];
  return BasicView.extend({
    TAG: 'PublishButton',
    template: 'publishBtnTemplate',
//    events: {
//      'click #publish': 'publish',
//      'click #tryTheApp': 'doTry',
//      'click #enterTournament': 'enterTournament',
//      'click #forkMe': 'forkMe',
//      'click #testAppPlug': 'testPlug',
//      'click #resetTemplate': 'resetTemplate'
//    },
    initialize: function(options) {
      _.bindAll.apply(_, [this, 'render'].concat(SPECIAL_BUTTONS));
      this.constructor.__super__.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
      
      _.each(SPECIAL_BUTTONS, function(btnName) {
        var tName = '{0}BtnTemplate'.format(btnName);
        this.makeTemplate(tName, tName, this.vocModel.type);        
      }.bind(this));
      
//      this.makeTemplate('tryButtonTemplate', 'tryTemplate', this.vocModel.type);
//      this.makeTemplate('forkButtonTemplate', 'forkTemplate', this.vocModel.type);
//      this.makeTemplate('testPlugTemplate', 'testPlugTemplate', this.vocModel.type);
//      this.makeTemplate('enterTournamentTemplate', 'enterTournamentTemplate', this.vocModel.type);
//      this.makeTemplate('resetTemplateButtonTemplate', 'resetTemplateTemplate', this.vocModel.type);
      return this;
    },
//    resetTemplate: function(e) {
//      // toggle from "Reset to default" to "Undo Reset"
//      var btn = e.currentTarget;
//      var $btn = $(btn);
//      var newTitle;
//      if (!this.oldTitle) {
//        this.oldTitle = btn.innerText;
//        newTitle = 'Undo reset';
//      }
//      else {
//        newTitle = this.oldTitle;
//        this.oldTitle = null;
//      }
//      
//      var textarea = $('[data-code="html"]')[0];
//      var codemirror = $.data(textarea, 'codemirror');
//      this.templateCache = this.templateCache || {};
//      var prevText = this.templateCache[textarea.id] || this.getTemplate(this.resource.get('templateName'));
//      this.templateCache[textarea.id] = codemirror.getValue();
//      codemirror.setValue(prevText);
//      $btn.find('.ui-btn-text').text(newTitle);
//    },
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
    doTry: function(e) {
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
      
      this.showLoadingIndicator();
      Events.on('goodToPublish', function() {
        Events.trigger('publishingApp', res);        
        res.save(props, {
          sync: true,
          success: function(resource, response, options) {
            res.set({'lastPublished': +new Date()});
            Events.trigger('publishedApp', res);
            self.hideLoadingIndicator();
            self.router.navigate(U.getHash(), {trigger: true, replace: true, forceFetch: true});
          },
          error: function(model, xhr, options) {
            self.hideLoadingIndicator();
            var error = xhr && xhr.responseText;
            if (error) {
              try {
                error = JSON.parse(error).error;
              } catch (err) {
                error = null;
              }
            }
            
            var msg = error && error.details;
            msg = msg || 'App could not be published';
            Events.trigger('error', res, msg);
          }
        });  
      });
      
      var appUrl = U.makePageUrl('view', res);
      Events.on('cannotPublish', function(badBoys) {
        self.hideLoadingIndicator();
        var errs = [];
        _.each(badBoys, function(badBoy) {
          var displayName = badBoy.name || badBoy.label;
          var classUri = U.getTypeUri(badBoy._uri);
          if (!displayName) {
            displayName = classUri;
            displayName = displayName.slice(displayName.lastIndexOf('/') + 1);
          }
          
          displayName = U.getClassDisplayName(classUri) + ' ' + displayName;
          errs.push({
            link: U.makePageUrl('edit', badBoy._uri, {$returnUri: appUrl}),
            msg: displayName + ': ' + badBoy._error.details,
            icon: 'ban-circle'
          });
        });
        
        Events.trigger('error', res, {errors: errs, persist: true, info: 'Please fix these errors and re-publish'});
      });
      
      Events.trigger('preparingToPublish', res);
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
    
    forkMe: function(e) {
      Events.stopEvent(e);
      var res = this.resource;
      this.router.navigate(U.makeMobileUrl('make', 'model/social/App', {forkedFrom: res.getUri()}), {trigger: true});
    },

    render: function(options) {
      if (options) {
        var btns = _.keys(_.pick(options, SPECIAL_BUTTONS));
        _.each(btns, function(btnName) {
          var bOptions = {};
          if (options.enterTournament) {
            var params = U.getParamMap(window.location.href);
            bOptions.name = params['-tournamentName'];
          }
          
          this.$el.html(this['{0}BtnTemplate'.format(btnName)]());
//          var html = this['{0}BtnTemplate'.format(btnName)]();
//          this.setElement($(html));
          this.$el.trigger('create');
        }.bind(this));
      }
      else if (this.template) {
        this.$el.html(this.template());
        this.$el.trigger('create');
      }
      
      // TODO: figure out why click on Try button doesn't arrive in handler without this hack
      _.each(SPECIAL_BUTTONS, function(bName) {        
        this.$('#{0}'.format(bName)).click(this[bName]);
      }.bind(this));
      
      return this;
    }
  });
});