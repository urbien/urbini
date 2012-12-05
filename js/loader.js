//require.config({
//  paths: {
//    jquery: 'lib/jquery',
//    jqueryMobile: 'lib/jquery-mobile',
//    jqmConfig: 'lib/jqm-config',
//    underscore: 'lib/underscore',
//    backbone: 'lib/backbone'
//  }
//
//});
//
//require([
//  'app'
//], function(App){
//  // The "app" dependency is passed in as "App"
//  App.initialize();
//});


require.config({
  baseUrl: "/js/",
  paths: {
    jquery: 'lib/jquery',
    jqmConfig: 'lib/jqm-config',
    jqueryMobile: 'lib/jquery.mobile',
    underscore: 'lib/underscore',
    backbone: 'lib/backbone',
    indexedDBShim: 'lib/IndexedDBShim',
//    templates: '../templates'
  },
  shim: {
    underscore: {
      exports: "_"
    },
    backbone: {
      //These script dependencies should be loaded before loading
      //backbone.js
      deps: ['jquery','underscore'],
      //Once loaded, use the global 'Backbone' as the
      //module value.
      exports: 'Backbone'
    },
    jqmConfig: ['jquery'],
    jqueryMobile: ['jquery','jqmConfig']
  }
});

require([
  'jquery',
  'app',
  'jqueryMobile'
], function($, App) {
  $(function(){
    App.initialize();
  });
});