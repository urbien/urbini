//var Lablz = Lablz || {files: [], modules: {}, Utils: {}};
//Array.prototype.remove = function(from, to) {
//  var rest = this.slice((to || from) + 1 || this.length);
//  this.length = from < 0 ? this.length + from : from;
//  return this.push.apply(this, rest);
//};  

Lablz.getModuleKey = function(fileName) {
  var ext = fileName.slice(fileName.lastIndexOf('.') + 1);
  return [ext, fileName].join('/'); 
};

Lablz.Utils = Lablz.Utils || {};
Lablz.Utils.leaf = function(obj, path, separator) {
  if (typeof obj == 'undefined' || !obj)
    return null;
  
  separator = separator || '.';
  var dIdx = path.indexOf(separator);
  return dIdx == -1 ? obj[path] : Lablz.Utils.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
};

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
    jqueryMobile: ['jquery', 'jqmConfig'],
    leafletMarkerCluster: ['leaflet'],
    maps: ['underscore', 'leaflet', 'leafletMarkerCluster']
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
                                                 
    var leaf = Lablz.Utils.leaf;
    var pruned = [];
    if (localStorage && localStorage.length) {
      for (var ext in bundle) {
        Lablz.modules[ext] = {};
        var b = bundle[ext];
        for (var i = 0; i < b.length; i++) {
          var name = b[i];
          var fileName = name + '.' + ext;
          var key = Lablz.getModuleKey(fileName);
          var saved = localStorage.getItem(key);
          if (saved) {
            try {
              saved = JSON.parse(saved);
            } catch (err) {
              localStorage.removeItem(key);
              continue;
            }
            
            var dateSaved = saved.modified;
            var modified = leaf(Lablz.files[ext], fileName, '/').modified;
            if (modified <= dateSaved) {
              Lablz.modules[ext][fileName] = saved.text;
              continue;
            }
          }
          
          pruned.push(name);
        }
        
        bundle[ext] = pruned;
        pruned = [];
      }
    }
    
    for (var ext in bundle) {
      bundle[ext] = bundle[ext].join(',');
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
            for (var ext in resp) {
              Lablz.modules[ext] = {};
              for (var name in resp[ext]) {
                Lablz.modules[ext][name] = resp[ext][name];
              }
            }
          }
        }
        
        require([
         'cache!app' 
        ], function(App) {
            App.initialize();
        });
      }
    });
  });
});
