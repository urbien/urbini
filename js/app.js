define('app', [
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates', 
  'cache!utils', 
  'cache!error', 
  'cache!events',
  'cache!indexedDBShim', 
  'cache!modelsBase', 
  'cache!router'
], function(G, $, __jqm__, _, Backbone, Templates, U, Error, Events, __idbShim__, MB, Router) {  
  Backbone.View.prototype.close = function() {
    this.remove();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
  
  var App = {
    initialize: function() {
      var error = function(e) {
        G.log('init', 'error', "failed to init app, not starting");
        throw new Error('failed to load app');
      };
      
      Templates.loadTemplates();
      MB.checkUser();
      MB.loadStoredModels();
    //  setTimeout(function() {MB.loadStoredModels({all: true})}, 100);
      if (!MB.changedModels.length && !MB.newModels.length) {
        MB.updateTables(App.startApp, error);
        return;
      }
    
      MB.fetchModels(null, {success: function() {    
        MB.updateTables(App.startApp, error);
      }, sync: true});
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
      G.homePage = G.homePage || G.tabs[0].mobileUrl;
      if (!window.location.hash) {
//        G.Router.navigate(G.homePage, {trigger: true});
      }
    }
  };
  
  return App;
});