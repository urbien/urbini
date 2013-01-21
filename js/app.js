define('app', [
  'globals',
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates', 
  'cache!utils', 
  'cache!events',
  'cache!vocManager',
  'cache!resourceManager',
  'cache!router'
], function(G, __jqm__, _, Backbone, Templates, U, Events, Voc, RM, Router) {  
  Backbone.View.prototype.close = function() {
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
  
  /* Backbone.validateAll.js - v0.1.0 - 2012-08-29
  * http://www.gregfranko.com/Backbone.validateAll.js/
  * Copyright (c) 2012 Greg Franko; Licensed MIT */
  Backbone.Model.prototype._validate = function(attrs, options) {
    options = options || {};
    if (options.silent || options.skipValidation || !this.validate) {
      return true;
    }
    
    if (options.validateAll !== false) {
      attrs = _.extend({}, this.attributes, attrs);
    }
    
    var error = this.validate(attrs, options);
    if (!error) {
      if (options.validated)
        options.validated(this, options);
      
      return true;
    }
    if (options && options.error) {
      options.error(this, error, options);
    } else {
      this.trigger('error', this, error, options);
    }
    
    return false;
  };

  var App = {
    initialize: function() {
      var error = function(e) {
        G.log('init', 'error', "failed to init app, not starting");
        throw new Error('failed to load app');
      };
      
      Templates.loadTemplates();
      Voc.checkUser();
      Voc.loadStoredModels();
    //  setTimeout(function() {RM.loadStoredModels({all: true})}, 100);
      if (!Voc.changedModels.length && !Voc.newModels.length) {
        RM.restartDB(App.startApp, error);
        return;
      }
    
      Voc.fetchModels(null, {success: function() {
        !RM.db && RM.restartDB(App.startApp, error) || App.startApp();
      }, error: error, sync: true});
    },
    
    startApp: function() {
      if (App.started)
        return;
      
      G.app = App;
      App.started = true;
      var models = G.models;
      G.Router = new Router();
      Backbone.history.start();
      
      _.each(G.tabs, function(t) {t.mobileUrl = U.getMobileUrl(t.pageUrl)});
//      G.homePage = G.homePage || G.tabs[0].mobileUrl;
//      if (!window.location.hash) {
//        G.Router.navigate(G.homePage, {trigger: true});
//      }
    }
  };
  
  return App;
});