//'use strict';
define('views/PublishButton', [
  'globals',
  'underscore', 
  'utils',
  'events',
  'vocManager',
  'views/BasicView',
  'cache'
], function(G, _, U, Events, Voc, BasicView, C) {
  var SPECIAL_BUTTONS = ['enterTournament', 'forkMe', 'publish', 'doTry', 'testPlug', 'installApp']; //, 'resetTemplate'];
  return BasicView.extend({
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
      var type = this.vocModel.type;
      this.makeTemplate(this.template, 'template', type);
      
      _.each(SPECIAL_BUTTONS, function(btnName) {
        var tName = '{0}BtnTemplate'.format(btnName);
        this.makeTemplate(tName, tName, type);        
      }.bind(this));
      
//      this.makeTemplate('tryButtonTemplate', 'tryTemplate', this.vocModel.type);
//      this.makeTemplate('forkButtonTemplate', 'forkTemplate', this.vocModel.type);
//      this.makeTemplate('testPlugTemplate', 'testPlugTemplate', this.vocModel.type);
//      this.makeTemplate('enterTournamentTemplate', 'enterTournamentTemplate', this.vocModel.type);
//      this.makeTemplate('resetTemplateButtonTemplate', 'resetTemplateTemplate', this.vocModel.type);
      return this;
    },
    
    installApp: function() {
      U.require('firefox').done(function(Firefox) {
        Firefox.install();
      });
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
      Voc.getModels(effect).done(function() {
        var effectModel = U.getModel(effect);
        var params = {};
        params.plugin = res.getUri();
        if (!G.currentUser.guest) {
          var submittedBy = U.getCloneOf(effectModel, 'Submission.submittedBy');
          if (submittedBy.length) {
            submittedBy = submittedBy[0];
            params[submittedBy] = '_me';
          }
        }
        
        var effectList = U.makeMobileUrl('list', effect, params);
        this.router.navigate(U.makeMobileUrl('make', cause, {$returnUri: effectList}), {trigger: true});
      }.bind(this));
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
      this.listenTo(Events, 'goodToPublish', function() {
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
            var error = U.getJSON(xhr.responseText);
            var msg = error && error.details;
            msg = msg || 'App could not be published';
            Events.trigger('error', {resource: res, error: msg});
          }
        });  
      });
      
      var appUrl = U.makePageUrl('view', res);
      this.listenTo(Events, 'cannotPublish', function(badBoys) {
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
        
        Events.trigger('error', {resource: res, errors: errs, persist: true, info: 'Please fix these errors and re-publish'});
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
        var event = e;
        var self = this;
        Voc.getModels('http://www.hudsonfog.com/voc/commerce/urbien/TournamentEntry', {sync: true}).done(function() {
          debugger;
          self.enterTournament.call(self, event);
        });
        
        return;
      }
      
      var params = _.getParamMap(window.location.hash);
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
      var self = this;
      this.el.$empty();
      if (options) {
        var params = this.hashParams,
            btns = _.keys(_.pick(options, SPECIAL_BUTTONS)),
            html = '';
        
        btns.forEach(function(btnName) {
          html += self['{0}BtnTemplate'.format(btnName)]();
        });

        this.html(html);
        this.$el.trigger('create');
      }
      else if (this.template) {
        this.html(this.template({wasPublished: !!this.resource.get('lastPublished')}));
        this.$el.trigger('create');
      }
      
      // TODO: figure out why click on Try button doesn't arrive in handler without this hack
      SPECIAL_BUTTONS.forEach(function(bName) {
        var btn = self.el.querySelector('#{0}'.format(bName));
        if (btn)
          btn.addEventListener('click', self[bName]);
      });
      
      return this;
    }
  },
  {
    displayName: 'PublishButton'
  });
});