// needs Lablz.requiredModels
define([
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'templates',
  'router',
  'localStorageModule',
  'modelsBase',
  'dbModule',
  'error',
  'jqueryMobile',
  'jqmConfig'
], function($, _, Backbone, U, Templates, Router, LS, MB, DB, Error) {
  var App = {};
  App.initialize = function() {
    var error = function(e) {
      console.log("failed to init app, not starting: " + e);
    };
    
    Templates.loadTemplates();
    LS.checkUser();
    LS.loadStoredModels();
  //  setTimeout(function() {LS.loadStoredModels({all: true})}, 100);
    if (!MB.changedModels.length && !MB.newModels.length) {
      DB.updateTables(App.startApp, error);
      return;
    }
  
    MB.fetchModels(null, {success: function() {    
      DB.updateTables(App.startApp, error);
    }, sync: true});
  }
  
  App.startApp = function() {
    if (App.started)
      return;
    
    App.started = true;
    var models = Lablz.requiredModels.models;
    App.router = new Router();
    Backbone.history.start();
    
    App.homePage = Lablz.homePage || _.last(models).shortName;
    if (!window.location.hash) {
      Router.navigate(App.homePage, {trigger: true});
    }
  };
  
  $(document).ready(function () {
    console.log('document ready: ' + documentReadyCount++);
    init();      
  });
  
  return App;
});