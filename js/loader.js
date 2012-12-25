/**
 * AMD-cache, a loader plugin for AMD loaders.
 *
 * Available via the MIT or new BSD license.
 *
 * Redesigned from cache plugin by Jens Arps by adding preloading, support for css, timestamps and more.
 *
 * The xhr code is taken from the RequireJS text plugin:
 *
 */
/**
 * Three sources of JS file loading
 * 1. Listed in loader in baseBundle JS files are first loaded into memory by loader.js.
 *    When define is called JS files listed in define and prepanded with 'cache!' get moved from memory to cache
 * 2. Loading from cache: listed in define call JS files that prepanded with 'cache!' will be first attempted to load from cache
 * 3. From server 
 */

define('globals', function() {
  var G = Lablz;
  G.online = !!navigator.onLine;
  window.addEventListener("offline", function(e) {
    // we just lost our connection and entered offline mode, disable eternal link
    G.online = false;
  }, false);

  window.addEventListener("online", function(e) {
    // just came back online, enable links
    G.online = true;
  }, false);
  
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
      hasLocalStorage = (function(){
        var supported = false;
        try{
          supported = window && ("localStorage" in window) && ("getItem" in localStorage);
        }catch(e){}
        return supported;
      })();

  define('cache', ['module'], function (module) {
    var masterConfig = (module.config && module.config()) || {};
    var cache = {
      TAG: 'cache',
      prependUrl: function(content, url) {
        return content + '\r\n//@ sourceURL=' + url;
      },
      
      prepForStorage: function(text) {
        return JSON.stringify({modified: new Date().getTime(), text: text});
      },
          
      load: function (name, req, onLoad, config) {
        if (config.isBuild) {
          onLoad();
          return;
        }
            
        var cached,
            url = G.getCanonicalPath(req.toUrl(name));
        
        // TODO: unhack
        if (name == 'jqueryMobile') {
          req([name], function(content) {
            G.log(cache.TAG, 'cache', 'Loading jq: ' + url);
            onLoad(content);
            G.log(cache.TAG, 'cache', 'End loading jq: ' + url);
          });
          
          return;
        }
        
        var isText = ext = name.match(/\.[a-zA-Z]+$/g);
        if (ext)
          ext = ext[0].slice(1).toLowerCase();
          
        var now = new Date().getTime();
        var mCache = config.cache;
        var inMemory = mCache && mCache[url];
        var loadedCached = false;
        if (inMemory || hasLocalStorage) {
          var loadSource = inMemory ? 'memory' : 'LS';
          if (inMemory) {
            cached = mCache[url];
          }
          else if (hasLocalStorage) { // in build context, this will be false, too
            try {
              cached = localStorage.getItem(url);
              cached = cached && JSON.parse(cached);
            } catch (err) {
              G.log(cache.TAG, ['error', 'cache'], "failed to parse cached file: " + url);
              cached = null;
            }
            
            if (cached) {
              var fileInfo = G.leaf(config.expirationDates, url, '/');
              var modified = fileInfo && fileInfo.modified;
              if (modified && modified <= cached.modified)
                cached = cached.text;
              else {
                localStorage.removeItem(url);
                cached = null;
              }
            }
          }

          var loadedCached = cached;
          if (loadedCached) {
            cached = cache.prependUrl(cached, url);
            
            try {
              G.log(cache.TAG, 'cache', 'Loading from', loadSource, url);
              switch (ext) {
                case 'css':
                  G.appendCSS(cached, function() {
                    G.log(cache.TAG, 'cache', 'cache.get: ' + url);
                    onLoad();
                    G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
                  });
                  break;
                case 'html':
                case 'jsp':
                  G.log(cache.TAG, 'cache', 'cache.get: ' + url);
//                  G.appendHTML(cached);
                  onLoad(cached);
                  G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
                  break;
                default:
                  onLoad.fromText(cached);
                  break;
              }
              G.log(cache.TAG, 'cache', 'End loading from', loadSource, url);
            } catch (err) {
              G.log(cache.TAG, 'cache', 'failed to load ' + url + ' from', loadSource, err);
              loadedCached = false;
            }
          } 
        }
        
        if (loadedCached)
          return;
        
        /// use 'get' instead of 'req' so we can store to localStorage
        G.get(url, function(text) {
          switch(ext) {
            case 'css':
              G.appendCSS(text, function() {
                cache.save(url, text, 100);
                G.log(cache.TAG, 'cache', 'cache.get: ' + url);
                onLoad();
                G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
              });
              break;
            case 'html':
            case 'jsp':
              G.log(cache.TAG, 'cache', 'cache.get: ' + url);
//              G.appendHTML(text);
              onLoad(text);
              G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
              break;
            default:
              cache.save(url, text, 100);
              G.log(cache.TAG, 'cache', 'cache.get: ' + url);
              onLoad.fromText(text);
              G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
              break;
          } 
        });
      },
      
      save: function(url, text, delay) {
        var put = function() {
          localStorage.setItem(url, cache.prepForStorage(text));      
        }
        
        if (delay)
          setTimeout(put, delay);
        else
          put();
      },
      
//      getCanonicalPath: function(path, separator) {
//        separator = separator || '/';
//        var parts = path.split(separator);
//        var stack = [];
//        for (var i = 0; i < parts.length; i++) {
//          if (parts[i] == '..')
//            stack.pop();
//          else
//            stack.push(parts[i]);
//        }
//        
//        return stack.join(separator);
//      },      
//      leaf: function(obj, path, separator) {
//        path = cache.getCanonicalPath(path);
//        if (typeof obj == 'undefined' || !obj)
//          return null;
//        
//        separator = separator || '.';
//        var dIdx = path.indexOf(separator);
//        return dIdx == -1 ? obj[path] : cache.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
//      }    
    };

    return cache;
  });

  var moreG = {
    sqlUri: 'sql',
    modules: {},
    id: 0,
    nextId: function() {
      return G.id++;
    },
    createXhr: function () {
      //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
      var xhr, i, progId;
      if (typeof XMLHttpRequest !== "undefined") {
        return new XMLHttpRequest();
      } else {
        for (i = 0; i < 3; i++) {
          progId = progIds[i];
          try {
            xhr = new ActiveXObject(progId);
          } catch (e) {}

          if (xhr) {
            progIds = [progId];  // so faster next time
            break;
          }
        }
      }

      if (!xhr) {
        throw new Error("createXhr(): XMLHttpRequest not available");
      }

      return xhr;
    },

    get: function (url, callback, errback) {
      var xhr = G.createXhr();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function (evt) {
        var status, err;
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          status = xhr.status;
          if (status > 399 && status < 600) {
            //An http 4xx or 5xx error. Signal an error.
            err = new Error(url + ' HTTP status: ' + status);
            err.xhr = xhr;
            errback(err);
          } else {
            callback(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    },
  
    trace: {
      error: {
        on: true,
        color: '#FF0000',
        bg: '#333'
      },
      db: {
        on: true,
        color: '#FFFFFF',
        bg: '#000'
      },
      render: {
        on: true,
        color: '#AA00FF',
        bg: '#DDD'
      },
      events: {
        on: true,
        color: '#baFF00',
        bg: '#555'
      },
      cache: {
        on: false,
        color: '#CCCCCC',
        bg: '#555'
      }
    },
    
    log: function(tag, type) {
      var types = typeof type == 'string' ? [type] : type;
      for (var i = 0; i < types.length; i++) {
        var t = types[i];
        var trace = G.trace[t] || {on: true};
        if (!trace.on)
          continue;
        
        var b = G.browser;
        var css = b && ((b.mozilla && parseInt(b.version.slice(0,2))) > 4 || b.chrome && parseInt(b.version.slice(0,2)) >= 24);
        var msg = Array.prototype.slice.call(arguments, 2);
        var msgStr = '';
        for (var i = 0; i < msg.length; i++) {
          msgStr += (typeof msg[i] == 'string' ? msg[i] : JSON.stringify(msg[i]));
          if (i < msg.length - 1) msgStr += ' ';
        }

        console.log((css ? '%c ' : '') + t + ' : ' + tag + ' : ' + msgStr, css ? 'background: ' + (trace.bg || '#FFF') + '; color: ' + (trace.color || '#000') : '');        
      }
    },
    
    appendCSS: function(text, callback) {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.textContent = text; // iphone 2g gave innerhtml and appendchild the no_modification_allowed_err 
      document.getElementsByTagName('head')[0].appendChild(style);
      callback();
    },
    
    appendHTML: function(html, element) {
      var div = document.createElement('div');
      div.id = G.nextId();
      div.innerHTML = html;
      (element || document.getElementsByTagName('body')[0]).appendChild(div);
    },

    getCanonicalPath: function(path, separator) {
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
    },

    leaf: function(obj, path, separator) {
      path = G.getCanonicalPath(path);
      if (typeof obj == 'undefined' || !obj)
        return null;
      
      separator = separator || '.';
      var dIdx = path.indexOf(separator);
      return dIdx == -1 ? obj[path] : G.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
    },

    pruneBundle: function(bundle) {
      var modules = [];
      for (var type in bundle) {
        for (var i = 0; i < bundle[type].length; i++) {
          var name = bundle[type][i];
          var ext = name.match(/\.[a-zA-Z]+$/g);
          if (!ext || ['.css', '.html', '.js', '.jsp'].indexOf(ext[0]) == -1)
            name += '.js';
          
          modules.push(G.getCanonicalPath(require.toUrl(name)));
        }
      }
      
      if (!localStorage || !localStorage.length)
        return modules;
      
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
          var info = G.leaf(G.files, url, '/');
          if (info && info.modified <= dateSaved) {
            G.modules[url] = saved.text;
            continue;
          }
          else {
            if (!info)
              G.log('init', 'error', 'no info found for file: ' + url);
              
            localStorage.removeItem(url);
          }
        }
        
        pruned.push(url);
      }
    
      return pruned;
    },
    
    loadBundle: function(bundle, callback) {
      var pruned = G.pruneBundle(bundle);
      if (!pruned.length) {
        G.log('init', 'cache', 'bundle was cached', bundle);
        if (callback) 
          callback();
        
        return;
        
      }
      
      G.get(G.serverName + "/backboneFiles?modules=" + pruned.join(','), 
        function(text) {
          var resp;
          try {
            resp = JSON.parse(text);
          } catch (err) {
          }
          
          if (resp && !resp.error && resp.modules) {
            for (var i = 0; i < resp.modules.length; i++) {
              var m = resp.modules[i];
              for (var name in m) {
                var minIdx = name.indexOf('.min.js');
                G.modules[minIdx == -1 ? name : name.slice(0, minIdx) + '.js'] = m[name];
                break;
              }
            }
          }
        
          if (localStorage) {
            setTimeout(function() {
              var now = new Date().getTime();
              for (var url in G.modules) {
                localStorage.setItem(url, JSON.stringify({modified: new Date().getTime(), text: G.modules[url]}));
              }
            }, 100);
          }
          
          if (callback) callback();
        });
    }
  }; 
  
  for (var prop in moreG) {
    G[prop] = moreG[prop];
  }
  
  G.serverName = (function() {     
    var s = document.getElementsByTagName('base')[0].href;
    return s.match("/$") ? s.slice(0, s.length - 1) : s;
  })();
  
  G.apiUrl = G.serverName + '/api/v1/';


  require.config({
    paths: {
//      cache: 'lib/requirejs.cache',
      jquery: 'lib/jquery',
      jqmConfig: 'jqm-config',
      jqueryMobile: 'lib/jquery.mobile-1.2.0',
      underscore: 'lib/underscore',
      backbone: 'lib/backbone',
      indexedDBShim: 'lib/IndexedDBShim',
      leaflet: 'lib/leaflet',
      leafletMarkerCluster: 'lib/leaflet.markercluster',
      jqueryImagesloaded: 'lib/jquery.imagesloaded',
      jqueryMasonry: 'lib/jquery.masonry'
    },
    shim: {
      leafletMarkerCluster: ['leaflet'],
      jqueryMasonry: ['jquery'],
      jqueryImagesloaded: ['jquery']
    },
    cache: G.modules,
    expirationDates: G.files
  });

   G.baseBundle = {
     pre: {
     // Javascript
       js: ['lib/jquery', 'jqm-config', 'lib/jquery.mobile', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'lib/jquery.masonry', 'lib/jquery.imagesloaded', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
        'views/ResourceView', 'views/ControlPanel', 'views/Header', 'views/BackButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
        /*'views/ResourceMasonryItemView',*/ 'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 'modelsBase', 'router', 'app'],
       // CSS
       css: ['../lib/jquery.mobile.css', '../lib/jquery.mobile.theme.css', '../lib/jquery.mobile.structure.css', '../lib/jqm-icon-pack-fa.css', '../styles/styles.css', '../styles/common-template-m.css'],
       html: ['../templates.jsp']
     },
     post: {
       // Javascript
       js: ['views/ResourceMasonryItemView', 'views/CommentListItemView', 'views/MenuPage', 'leaflet', 'leafletMarkerCluster', 'maps'],
       // CSS
       css: ['../styles/leaflet/leaflet.css', '../styles/leaflet/MarkerCluster.Default.css'] //$.browser.msie ? '../styles/leaflet/MarkerCluster.Default.ie.css' : '../styles/leaflet/MarkerCluster.Default.css']
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

   return Lablz;
});

require(['globals'], function(G) {
//  if (localStorage) {
//    G = G;
//    localStorage.setItem();
//  }
  
  G.loadBundle(G.baseBundle.pre, function() {
    var css = G.baseBundle.pre.css.slice();
    for (var i = 0; i < css.length; i++) {
      css[i] = 'cache!' + css[i];
    }
    
    require(['cache!jquery', 'cache!jqmConfig', 'cache!app'].concat(css), function($, jqm, App) {
      G.browser = $.browser;
      App.initialize();
      setTimeout(function() {
        G.loadBundle(G.baseBundle.post, function() {
          console.log('loaded post bundle');
        });
      }, 100);
    });
  });
})
