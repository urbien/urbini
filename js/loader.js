Lablz.Utils = Lablz.Utils || {};
Lablz.Utils.getCanonicalPath = function(path, separator) {
  separator = separator || '/';
  var parts = path.split(separator);
  var stack = [];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] == '..')
      stack.pop();
    else
      stack.push(parts[i]);
  }
  
  return stack.join(separator);
}

Lablz.Utils.leaf = function(obj, path, separator) {
  path = Lablz.Utils.getCanonicalPath(path);
  if (typeof obj == 'undefined' || !obj)
    return null;
  
  separator = separator || '.';
  var dIdx = path.indexOf(separator);
  return dIdx == -1 ? obj[path] : Lablz.Utils.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
};

Lablz.pruneBundle = function(bundle) {
  var modules = [];
  for (var type in bundle) {
    for (var i = 0; i < bundle[type].length; i++) {
      var name = bundle[type][i];
      var ext = name.match(/\.[a-zA-Z]+$/g);
      if (!ext || ['.css', '.html', '.js'].indexOf(ext[0]) == -1)
        name += '.js';
      
      modules.push(Lablz.Utils.getCanonicalPath(require.toUrl(name)));
    }
  }
  
  if (!localStorage || !localStorage.length)
    return modules;
  
  var leaf = Lablz.Utils.leaf;
  var pruned = [];
  for (var i = 0; i < modules.length; i++) {
    var url = modules[i];
    var saved = localStorage.getItem(url);
    if (saved) {
      try {
        saved = JSON.parse(saved);
      } catch (err) {
        pruned.push(url);
        localStorage.removeItem(url);
        continue;
      }
      
      var dateSaved = saved.modified;
      var modified = leaf(Lablz.files, url, '/').modified;
      if (modified <= dateSaved) {
        Lablz.modules[url] = saved.text;
        continue;
      }
      else
        localStorage.removeItem(url);
    }
    
    pruned.push(url);
  }

  return pruned;
}

Lablz.loadBundle = function(bundle, callback) {
  var pruned = Lablz.pruneBundle(bundle);
  if (!pruned.length) {
    console.log("everything was cached, ")
    if (callback) 
      callback();
    
    return;
    
  }
  
  $.ajax({
    url: Lablz.serverName + "/backboneFiles", 
    type: 'POST',
    data: {modules: pruned.join(',')},
    complete: function(jqXHR, status) {
      if (status == 'success') {
        var resp;
        try {
          resp = JSON.parse(jqXHR.responseText);
        } catch (err) {
        }
        
        if (resp && !resp.error && resp.modules) {
          for (var i = 0; i < resp.modules.length; i++) {
            var m = resp.modules[i];
            for (var name in m) {
              var minIdx = name.indexOf('.min.js');
              Lablz.modules[minIdx == -1 ? name : name.slice(0, minIdx) + '.js'] = m[name];
              break;
            }
          }
        }
      }
      
      if (localStorage) {
        setTimeout(function() {
          var now = new Date().getTime();
          for (var url in Lablz.modules) {
            localStorage.setItem(url, JSON.stringify({modified: new Date().getTime(), text: Lablz.modules[url]}));
          }
        }, 100);
      }
      
      if (callback) callback();
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
  },
  cache: Lablz.modules,
  expirationDates: Lablz.files
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

    var baseBundle = {
      pre: {
      // Javascript
        js: [/*'lib/jquery',*/ 'lib/jquery.mobile', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
         'views/ResourceView', 'views/Header', 'views/BackButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
         /*'views/ResourceMasonryModItemView',*/ 'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 'modelsBase', 'router', 'app'],
        // CSS
        css: ['../lib/jquery.mobile.css', '../lib/jquery.mobile.theme.css', '../lib/jquery.mobile.structure.css', '../lib/jqm-icon-pack-fa.css', '../styles/styles.css', '../styles/common-template-m.css']
      },
      post: {
        // Javascript
        js: ['views/ResourceMasonryModItemView', 'lib/leaflet', 'lib/leaflet.markercluster', 'maps'],
        // CSS
        css: ['../styles/leaflet/leaflet.css', $.browser.msie ? '../styles/leaflet/MarkerCluster.Default.ie.css' : '../styles/leaflet/MarkerCluster.Default.css']
      }
    };
    
    var viewBundle = [
      'cache!views/Header', 
      'cache!views/BackButton', 
      'cache!views/LoginButtons', 
      'cache!views/AroundMeButton', 
      'cache!views/ResourceView', 
      'cache!views/ResourceImageView', 
      'cache!views/ViewPage' 
    ];

    var listBundle = [
      'cache!views/ResourceListItemView', 
      'cache!views/ResourceListView', 
      'cache!views/Header', 
      'cache!views/BackButton', 
      'cache!views/LoginButtons', 
      'cache!views/AroundMeButton', 
      'cache!views/MapItButton', 
      'cache!views/ListPage' 
    ];

    Lablz.loadBundle(baseBundle.pre, function() {
      var css = baseBundle.pre.css.slice();
      for (var i = 0; i < css.length; i++) {
        css[i] = 'cache!' + css[i];
      }
      
      require(['cache!app'].concat(css), function(App) {
        App.initialize();
        setTimeout(function() {
          Lablz.loadBundle(baseBundle.post, function() {
            console.log('loaded post bundle');
          });
        }, 100);
      });
    });
  });
});
