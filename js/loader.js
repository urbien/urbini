//var Lablz = Lablz || {files: [], modules: {}, Utils: {}};
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};  

Lablz.getModuleKey = function(type, name) {
  return [type, name].join('/'); 
}

require.config({
  paths: {
    cache: 'lib/requirejs.cache',
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
  'cache!jquery'
], function($) {
  $(function() {
    var bundle = listBundle = viewBundle = baseBundle = {js: [/*'lib/jquery',*/ 'lib/jquery.mobile', 'jqm-config', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
      'viewsBase', 'views/Header', 'views/BackButton', 'views/LoginButtons', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
      'views/ResourceMasonryModItemView', 'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 
      'modelsBase', 'router', 'app'], css: ['lib/jquery.mobile', 'lib/jquery.mobile.theme', 'lib/jquery.mobile.structure', 'styles', 'common-template-m']};
                                                 
     // useless at the moment
//      var hash = window.location.hash;
//      var bundle;
//      if (hash && hash.startsWith('#view/'))
//        bundle = viewBundle;
//      else
//        bundle = listBundle;
    
//    Lablz.Utils.leaf = function(obj, path) {
//      var dIdx = path.indexOf('.');
//      return dIdx == -1 ? obj[path] : U.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + 1));
//    };

    if (localStorage) {
      for (var type in bundle) {
        var b = bundle[type];
        for (var i = 0; i < b.length; i++) {
          var name = b[i];
          var saved = localStorage.getItem(Lablz.getModuleKey(type, name));
          if (saved) {
            var dateSaved = saved.modified;
            var modified = leaf(Lablz.files[type], name, '/').modified;
            if (modified <= dateSaved) {
              b.remove(name);
              Lablz.modules[type][name] = saved;
            }
          }
        }
      }
    }
    
    for (var type in bundle) {
      bundle[type] = bundle[type].join(',');
    }
    
    $.ajax({
      url: Lablz.serverName + "/backboneFiles", 
      type: 'POST',
      data: bundle,
      complete: function(jqXHR, status) {
        if (status == 'success') {
          var resp;
          try {
            resp = JSON.parse(jqXHR.responseText);
          } catch (err) {
          }
          
          if (resp && !resp.error) {
            for (var type in resp) {
              Lablz.modules[type] = {};
              for (var name in resp[type]) {
                Lablz.modules[type][name] = resp[type][name];
              }
            }
          }
        }
        
        require([
         'cache!app'
        ], function(App) {
            App.initialize();
            setTimeout(function() {
              var now = new Date().getTime();
              for (var type in Lablz.modules) {
                for (var name in Lablz.modules[type]) {
                  localStorage.setItem(Lablz.getModuleKey(type, name), Lablz.modules[type][name]);
                }
              }
            }, 100);
        });
      }
    });
  });
});
