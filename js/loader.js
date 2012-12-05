require.config({
  paths: {
    jquery: 'lib/jquery',
    jqmConfig: 'jqm-config',
    jqueryMobile: 'lib/jquery.mobile',
    underscore: 'lib/underscore',
    backbone: 'lib/backbone',
    indexedDBShim: 'lib/IndexedDBShim',
    leaflet: 'lib/leaflet',
    leafletMarkerCluster: 'lib/leaflet.markercluster'
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
    jqueryMobile: ['jquery','jqmConfig'],
    maps: ['leaflet', 'leafletMarkerCluster'],
    leafletMarkerCluster: ['leaflet']
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