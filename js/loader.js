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

Lablz.loadBundle = function(pre, callback) {
  var leaf = Lablz.Utils.leaf;
  var pruned = [];
  if (localStorage && localStorage.length) {
    for (var ext in pre) {
      Lablz.modules[ext] = {};
      var b = pre[ext];
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
            Lablz.modules[ext][key] = saved.text;
            continue;
          }
        }
        
        pruned.push(name);
      }
      
      pre[ext] = pruned;
      pruned = [];
    }
  }
  
  for (var ext in pre) {
    pre[ext] = pre[ext].join(',');
  }
  
  $.ajax({
    url: Lablz.serverName + "/backboneFiles", 
    type: 'POST',
    data: pre,
    complete: function(jqXHR, status) {
      if (status == 'success') {
        var resp;
        try {
          resp = JSON.parse(jqXHR.responseText);
        } catch (err) {
        }
        
        if (resp && !resp.error) {
          for (var ext in resp) {
            Lablz.modules[ext] = Lablz.modules[ext] || {};
            for (var name in resp[ext]) {
              Lablz.modules[ext][name] = resp[ext][name];
            }
          }
        }
      }
      
      callback && callback();
    }
  }); 
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
  },
  shim: {
    leafletMarkerCluster: ['leaflet']
  }
});

require([
  'cache!jquery'
], function($) {
  $(function() {
    $(document).bind("mobileinit", function () {
      console.log('mobileinit');
      $.mobile.ajaxEnabled = false;
      $.mobile.linkBindingEnabled = false;
      $.mobile.hashListeningEnabled = false;
      $.mobile.pushStateEnabled = false;
      $.support.touchOverflow = true;
      $.mobile.touchOverflowEnabled = true;
      $.mobile.loadingMessageTextVisible = true;
        
        // Remove page from DOM when it's being replaced
  //                $('div[data-role="page"]').live('pagehide', function (event, ui) {
  //                    $(event.currentTarget).remove();
  //                });
    });

    var bundle = listBundle = viewBundle = baseBundle = {
      pre: {
        js: [/*'lib/jquery',*/ 'lib/jquery.mobile', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
           'views/ResourceView', 'views/Header', 'views/BackButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
           /*'views/ResourceMasonryModItemView',*/ 'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 'modelsBase', 'router', 'app'], 
        css: ['lib/jquery.mobile', 'lib/jquery.mobile.theme', 'lib/jquery.mobile.structure', 'styles', 'common-template-m']
      },
      post: {
        js: ['views/ResourceMasonryModItemView'],
        css: []
      },
    };
               
    var pre = bundle.pre;
    Lablz.loadBundle(pre, function() {
      require([
       'cache!app' 
      ], function(App) {          
          App.initialize();
      });
    });
  });
});
