(function(window, doc, undefined) {
var __started = new Date();

// http://stackoverflow.com/questions/13493084/jquery-deferred-always-called-at-the-first-reject
// use this when you want to wait till all the deferreds passed in are resolved or rejected (the built in $.when will fail out as soon as one of the child deferreds is rejected)
$.extend({
  whenAll: function() {
    var dfd = $.Deferred(),
        len = arguments.length,
        counter = 0,
        state = "resolved",
        resolveOrReject = function() {
            if(this.state() === "rejected"){
                state = "rejected";
            }
            counter++;
  
            if(counter === len) {
                dfd[state === "rejected"? "reject": "resolve"]();   
            }
  
        };
  
  
     $.each(arguments, function(idx, item) {
         item.always(resolveOrReject); 
     });
  
    return dfd.promise();    
  }
});

//'use strict';
define('globals', function() {
  /**
   * @param constantTimeout: if specified, this will always be the timeout for this function, otherwise the first param of the returned async function will be the timeout
   */

  var G = Lablz,
      browser = G.browser = $.browser;
  
  browser.chrome = $.browser.webkit && !!window.chrome;
  browser.safari = $.browser.webkit && !window.chrome;
  function addModule(text) {
  //  console.log("evaling/injecting", text.slice(text.lastIndexOf('@ sourceURL')));
    // Script Injection
    
    var idx = text.indexOf('//@ sourceURL');
    idx = idx == -1 ? 0 : idx;
    var length = idx ? 100 : text.length - idx;
//    Lablz.log(Lablz.TAG, 'module load', text.slice(idx, idx + length));
    
    if (G.minify) {
      if (browser.chrome) // || nav.isSafari)
        G.inject(text);
      else if (browser.mozilla)
        return window.eval(text);
  //      return window.eval.call({}, text);  
      else // Safari
        return window.eval(text);
    } 
    else
      return window.eval(text);
  }
  
  var $head = $('head'),
      head = $head[0],
      $body = $('body'),
      body = $body[0];
  
  Function.prototype.async = function(constantTimeout) {
    var self = this;
    return function() {
      var args = arguments;
      var timeout = constantTimeout || Array.prototype.shift.apply(args);
      setTimeout(function() {
        self.apply(self, args);
      }, timeout);
    }
  };

  G.localTime = new Date().getTime();
  G.online = !!navigator.onLine;
  
  window.addEventListener("offline", function(e) {
    // we just lost our connection and entered offline mode, disable eternal link
    G.setOnline(false);
  }, false);

  window.addEventListener("online", function(e) {
    // just came back online, enable links
    G.setOnline(true);
  }, false);

  // maybe we don't even need deferreds here, but if sth here ever becomes async with onload callbacks...
  function loadModule (name, url, text) {
    return $.Deferred(function(defer) {        
      var ext = url.match(/\.[a-zA-Z]+$/g)[0];
      var appcache = G.files.appcache;
        
      switch (ext) {
        case '.css':
          text += '\r\n/*//@ sourceURL=' + url + '*/';
          if (appcache[name])
            G.linkCSS(G.serverName + '/' + url);
          else
            G.appendCSS(text);
          
          G.log(G.TAG, 'cache', 'cache.get: ' + url);
          defer.resolve(name);
          G.log(G.TAG, 'cache', 'end cache.get: ' + url);
          break;
        case '.html':
        case '.jsp':
          G.log(G.TAG, 'cache', 'cache.get: ' + url);
//          onLoad(text);
          defer.resolve(text);
          G.log(G.TAG, 'cache', 'end cache.get: ' + url);
          break;
        default:
          if (browser.msie) 
            text += '/*\n'; // see http://bugs.jquery.com/ticket/13274#comment:6
          text += '\n//@ sourceMappingURL=' + url + '.map';
          text += '\n//@ sourceURL=' + url;
          if (browser.msie) 
            text += '*/\n';

          addModule(text);
          defer.resolve();
          break;
      }      
    }).promise();
  };

  var orgLoad = require.load;
  require.load = function (name) {
    var url = G.getCanonicalPath(require.toUrl(name));
    var args = arguments,
        self = this;
    
    return $.Deferred(function(defer) {
      if (name === 'globals')
        return defer.resolve(G);
      
      var cached;  
      if (/\.(jsp|css|html)\.js$/.test(url))
        url = url.replace(/\.js$/, '');
  
      var inAppcache = G.isInAppcacheBundle(url);
      if (inAppcache) {
        var path = G.requireConfig.paths[name];
        path = path || name;
        var realPath = G.files.appcache[path].fullName;
  //      var realPath = G.files[path].name;
        arguments[2] = url.replace(path, realPath);
        if (!/\.(jsp|css|html)$/.test(url)) {
          orgLoad.apply(self, args);
          return;
        }
      }
  
        
      var ext;
      var isText = ext = name.match(/\.[a-zA-Z]+$/g);
      if (ext)
        ext = ext[0].slice(1).toLowerCase();
        
      var mCache = G.modules;
      var cached = inAppcache || (mCache && mCache[url]);
      var loadedCached = false;
      if (cached) {// || hasLocalStorage) {
        var loadedCached = cached;
        if (loadedCached) {            
          try {
            G.log(G.TAG, 'cache', 'Loading from LS', url);
            loadModule(name, url, cached).done(defer.resolve);
            G.log(G.TAG, 'cache', 'End loading from LS', url);
          } catch (err) {
            debugger;
            defer.reject();
            G.log(G.TAG, ['error', 'cache'], 'failed to load', url, 'from local storage', err);
            G.localStorage.del(url);
            loadedCached = false;
          }
        } 
      }
      
      if (loadedCached)
        return;
      
      /// use 'sendXhr' instead of 'req' so we can store to localStorage
      G.loadBundle(name).done(function() {
        if (G.modules[url])
          loadModule(name, url, G.modules[url]).done(defer.resolve);
        else {
          G.log(G.TAG, ['error', 'cache'], 'failed to load module', name);
          defer.reject();
        }
      });        
    }).promise();
  };

  
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
   *    When define is called JS files listed in define and prepanded with '' get moved from memory to cache
   * 2. Loading from cache: listed in define call JS files that prepanded with '' will be first attempted to load from cache
   * 3. From server 
   */
  var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
      hasLocalStorage = (function(){
        var supported = false;
        try{
          supported = window && ("localStorage" in window) && ("getItem" in localStorage);
        }catch(e){}
        return supported;
      })();

//  define('fileCache', function() {
//    var cache = {
//      TAG: 'fileCache',
//      load: function (name, url) {
//        return $.Deferred(function(defer) {          
//          // hack for jsp, otherwise define callback function will not get jsp text
//          var url = G.getCanonicalPath(req.toUrl(name));
//          if (G.isInAppcacheBundle(url)) {
//            require([name], function() {
////              onLoad(name);
//              defer.resolve();
//            });
//          }
//          else
//            require.load(name, req.toUrl(name));
//        }).promise();
//      }
//    };
//
//    return cache;
//  });

  G.serverName = (function() {     
    var s = $('base')[0].href;
    return s.match("/$") ? s.slice(0, s.length - 1) : s;
  })();
  
  G.domain = (function() {
    return G.serverName.match(/([^\.\/]+\.com)/)[0];
  })();
  
  G.localStorage = {
    get: function(url) {
      var item = localStorage.getItem(url);
      return item;
    },
    del: function(key) {
      localStorage.removeItem(key);
    },
    put: function(key, value, force) {
      if (!G.hasLocalStorage)
        return false;

      var ls = G.localStorage;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
      value = Object.prototype.toString.call(value) === '[object String]' ? value : JSON.stringify(value);
      try {
//        G.localStorage.del(key);
        localStorage.setItem(key, value);
      } catch(e) {
        debugger;
        if (['QuotaExceededError', 'QUOTA_EXCEEDED_ERR', 'NS_ERROR_DOM_QUOTA_REACHED'].indexOf(e.name) != -1) {
          // clean to make space
          var appModelRegexp = G.appModelRegExp,
              thisAppModelRegexp = G.currentAppModelRegExp,
              numRemoved = ls.clean(function(key) {
                return appModelRegexp.test(key) && !thisAppModelRegexp.test(key);
              });
          
          if (!numRemoved) {
            ls.clean(function(key) {
              return /^model\:/.test(key);
            });
          }
          
          if (!ls.cleaning) { // TODO: unhack this garbage
            ls.cleaning = true;
            G.Voc && G.Voc.saveModelsToStorage();
          }
          
          force && ls.put(key, value);
          ls.cleaning = false;
        } else {
          debugger;
          G.hasLocalStorage = false;
          G.log(G.TAG, "Local storage write failure: ", e);
        }
      }
    },
    
    clean: function(test) {
      var cleaning = this.cleaning,
          numRemoved = 0;
      
      this.cleaning = true;
      for (var i = localStorage.length - 1; i > -1; i--) {
        var key = localStorage.key(i);
        if (!test || test(key)) {
          G.localStorage.del(key);
          numRemoved++;
        }
      }  
      
      return numRemoved;
    },
    
    nukeScripts: function() {
      var start = new Date().getTime();
      var length = localStorage.length;
      console.log("nuking scripts, localStorage has", length, "keys", start);
      for (var i = length - 1; i > -1; i--) {
        var key = localStorage.key(i);
        if (/\.(?:js|css|jsp)$/.test(key)) {          
          var start1 = new Date().getTime();
          G.localStorage.del(key);
          console.log("nuked", key, new Date().getTime() - start1);
        }
      }

      console.log("nuking scripts took", new Date().getTime() - start, "ms");
    },
    
    nukePlugs: function() {
      var length = localStorage.length;
      var types = [], plugs;
      for (var i = length - 1; i > -1; i--) {
        var key = localStorage.key(i);
        if (/^plugs/.test(key)) {
          types.push(key.slice(9));
          G.localStorage.del(key);
        }
      }
      
      return types;
    }
  };
  
  function testCSS(prop) {
    return prop in doc.documentElement.style;
  }
  
  
  G.localStorage.putAsync = G.localStorage.put.async(100);
  G.localStorage.cleanAsync = G.localStorage.clean.async(100);
  // browser and version detection: http://stackoverflow.com/questions/5916900/detect-version-of-browser
  
  function getSpinnerId(name) {
    return 'loading-spinner-holder-' + (name || '').replace(/[\.\ ]/g, '-');
  }

  function getMetadataURL(url) {
    return 'metadata:' + url;
  }

  var moreG = {
    _appStartDfd: $.Deferred(),
    onAppStart: function() {
      return G._appStartDfd.promise();
    },
    putCached: function(url, data, source) {
      return $.Deferred(function(defer) {        
        if (source === 'localStorage') {
          G.localStorage.put(url, data);
          defer.resolve();
        }
        else if (source === 'indexedDB') {
          G.onAppStart().done(function() {            
            G.ResourceManager.$db.objectStore('modules').put({
              url: url, 
              data: data
            }).done(defer.resolve).fail(defer.reject);
          });
        }
      }).promise();
    },
    getCached: function(url, source) {
      return $.Deferred(function(defer) {        
        if (source === 'localStorage') {
          var result = G.localStorage.get(url);
          if (result)
            defer.resolve(result);
          else
            defer.reject();
        }
        else if (source === 'indexedDB') {
          var RM = G.ResourceManager;
          if (!RM.storeExists('modules'))
            return defer.reject();
          
          var $db = RM && RM.$db;
          if (!$db)
            return defer.reject();
          
          RM.runTask(function() {
            defer.always(this.resolve);
            $db.objectStore('modules').get(url).done(function(result) {
              if (result)
                defer.resolve(result.data)
              else
                defer.reject();
            }).fail(defer.reject);
          });
        }
      }).promise();
    },
    isUsingDBShim: (function() {
      var using = browser.chrome || !window.indexedDB;
      if (using)
        console.debug('using indexeddb shim');
      return using;
    })(),
    media_events: ["loadstart", "progress", "suspend", "abort", "error", "emptied", "stalled", 
                    "loadedmetadata", "loadeddata", "canplay", "canplaythrough", "playing", "waiting", 
                    "seeking", "seeked", "ended", "durationchange", "timeupdate", "play", "pause", "ratechange", "volumechange"],
    nukeAll: function(reload) {
      var ls = localStorage;
      ls && ls.clear && ls.clear();
      if (G.ResourceManager) {
        G.ResourceManager.deleteDatabase().done(function() {          
          if (reload !== false)
            window.location.reload();
        });
      }
    },
    canWebcam: (function() {
      var m = (navigator.getMedia = (navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia));
      
//      m && m.bind(navigator);
      return !!m;
    })(),
    showSpinner: function(options) {
      options = options || {};
      if (typeof options === 'string')
        options = {name: options};
      
      var id = getSpinnerId(options.name);
      var cl = options.nonBlockingOverlay ? '' : 'spinner_bg';
      var color;
      if (G.tabs) {
        var t0 = G.tabs[0];
        if (t0)
          color = t0.color;
      }
      
      var style = ' style="z-index:1000;' + (color ? color + ';' : '') + '"';
      var innerHTML = '<div id="spinner_container"><div id="spinner"' + style + '>' + (options.content || '<i class="ui-icon-spinner icon-spin" style="font-size: 64px;"></i>') + '</div></div>';
      var $spinner = $('<div id="' + id + '" class="' + cl + '">' + innerHTML + '</div>');
      $body.append($spinner);
      if (options.timeout) {
        setTimeout(function() {
          G.hideSpinner(options.name);
        }, options.timeout);
      }
    },
    hideSpinner: function(name) {
      $('#' + getSpinnerId(name)).remove();
    },
    getVersion: function(old) {
      if (!old && G.VERSION)
        return G.VERSION;
      
      var v = G.localStorage.get((old ? 'OLD_' : '') + 'VERSION');
      try {
        v = JSON.parse(v);
      } catch (err) {
      }
      
      return v || {
        All: 0, 
        Models: 0, 
        JS: 0, 
        CSS: 0
      };
    },
    
    setVersion: function(version) {
      var oldV = G.VERSION;
      var newV = G.VERSION = version;
      G.localStorage.put("OLD_VERSION", JSON.stringify(oldV));
      G.localStorage.put("VERSION", JSON.stringify(newV));
    },
    
    DEV_PACKAGE_PATH: 'http://urbien.com/voc/dev/',
    isInAppcacheBundle: function(url) {
      var appcacheBundle = G.bundles.appcache;
      url = url.slice(url.indexOf('/') + 1);
      if (/\.js$/.test(url)) 
        url = url.slice(0, url.length - 3);
      
      return !!G.files.appcache[url];
    },
    setOnline: function(online) {
      G.online = online;
    }, // will fill out in app.js
    onModulesLoaded: function(modules) {
      var bundlePromises = [],
          missing = [],
          allBundles = G.bundles,
          baseUrlLength = require.getConfig().baseUrl.length,
          modules = typeof modules === 'string' ? [modules] : modules;
      
      _.each(modules, function(module) {
        var found = false,
            fullName = require.toUrl(module).slice(baseUrlLength);
        
        if (/\.js$/.test(fullName))
          fullName = fullName.slice(0, fullName.length - 3);
        
        for (var bName in G.bundles) {
          var bundle = G.bundles[bName];
          for (var type in bundle) {
            if (_.any(bundle[type], function(info) {
              return info.name == fullName;
            })) {
              found = true;
              bundle._deferred = bundle._deferred || $.Deferred();
              bundlePromises.push(bundle._deferred.promise());
              break;
            }
          }
          
          if (found)
            break;
        }
        
        if (!found)
          missing.push(fullName);
      });
      
      if (missing.length) {
        debugger; // shouldn't happen
        bundlePromises.push(G.loadBundle(missing));
      }
      
      return $.when.apply($, bundlePromises);
    },
    isMinifiable: function(url) {
      return /\.(js|css)$/.test(url);
    },
    isMinified: function(url, text) {
      if (!G.isMinifiable(url))
        return false;
      
//      if (/\.min\.(js|css)$/.test(url))
//        return true;
//      else
        return text.lastIndexOf('/*min*/') === text.length - 7;
    },

    storedModelTypes: [],
    minifyByDefault: true,
//    webWorkers: {},
    customPlugs: {},
    defaults: {
      radius: 2000 // km
    },
    modelsMetadataMap: {},
    oldModelsMetadataMap: {}, // map of models which we don't know latest lastModified date for
    LISTMODES: {LIST: 'LIST', CHOOSER: 'CHOOSER', DEFAULT: 'LIST'},
    classMap: G.classMap || {},
    appUrl: G.serverName + '/' + G.pageRoot,
    sqlUrl: G.serverName + '/' + G.sqlUri,
    modelsUrl: G.serverName + '/backboneModel',  
    defaultVocPath: 'http://www.hudsonfog.com/voc/',
    commonTypes: {
      App: 'model/social/App',
      Urbien: 'commerce/urbien/Urbien',
      Friend: 'model/company/Friend',
      FriendApp: 'model/social/FriendApp',
      Theme: 'model/social/Theme',
      WebClass: 'system/designer/WebClass',
      WebProperty: 'system/designer/WebProperty',
      CloneOfProperty: 'system/designer/CloneOfProperty',
      Handler: 'system/designer/Handler',
      Jst: 'system/designer/Jst',
      JS: 'system/designer/JS',
      Css: 'system/designer/Css',
      Grab: 'model/social/Grab',
      AppInstall: 'model/social/AppInstall',
      Transaction: 'aspects/commerce/Transaction'
    },
//    commonTypes: {
//      model: {
//        social: ['App', 'FriendApp', 'Theme', 'Grab', 'AppInstall'],
//        company: ['Friend'],
//      },
//      system: {
//        designer: ['WebProperty', 'CloneOfProperty', 'Handler', 'Jst', 'JS', 'Css', 'WebClass']
//      },
//      commerce: {
//        urbien: ['Urbien']
//      }
//    },
    timeOffset: G.localTime - G.serverTime,
    currentServerTime: function() {
      return new Date().getTime() - G.timeOffset;
    },
    hasLocalStorage: hasLocalStorage,
    hasFileSystem: !!(window.requestFileSystem || window.webkitRequestFileSystem),
    hasBlobs: typeof window.Blob !== 'undefined',
    hasWebWorkers: typeof window.Worker !== 'undefined',
    TAG: 'globals',
    checkpoints: [],
    tasks: {},
    recordCheckpoint: function(name, dontPrint) {
      G.checkpoints.push({name: name, time: new Date()});
      if (!dontPrint)
        G.printCheckpoint(G.checkpoints.length - 1);
    },
    startedTask: function(name) {
      G.tasks[name] = {start: new Date()};
    },
    finishedTask: function(name, dontPrint) {
      var task = G.tasks[name];
      if (!task) {
        G.log(G.TAG, 'tasks', name, 'finished but starting point was not recorded');        
        return;
      }
      
      task.end = new Date();
      if (!dontPrint)
        G.printTask(name);
    },
    printCheckpoint: function(i) {
      var c = G.checkpoints[i];
      var time = c.time.getTime();
      var passed = i ? time - G.checkpoints[i - 1].time.getTime() : 0;
      G.log(G.TAG, 'checkpoints', c.name, c.time.getTime(), 'time since last checkpoint: ' + passed);
    },
    printCheckpoints: function() {
      for (var i = 0; i < G.checkpoints.length; i++) {
        G.printCheckpoint(G.checkpoints[i]);
      }
    },
    printTask: function(name) {
      var t = G.tasks[name];
      var time = t.end - t.start;
      G.log(G.TAG, 'tasks', name + ' took ' + time + 'ms');
    },
    printTasks: function() {
      for (var name in G.tasks) {
        G.printTask(name);
      }
    },
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

    sendXhr: function (options) {
      var url = options.url;
      var method = (options.type || 'GET').toUpperCase();      
      var xhr = G.createXhr();      
      var params = options.data;
      xhr.open(method, url, true);
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
            options.error && options.error(err);
          } else {
            options.success && options.success(xhr.responseText);
          }
        }
      };
      
      if (method === 'POST') {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        var tmp = [];
        for (var name in params) {
          tmp.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
        }
        
        if (tmp.length)
          params = tmp.join('&');
      }
      
      xhr.send(params);
    },
  
    trace: {
      ON: true,
      DEFAULT: {on: true},
      types : {
        error: {
          on: true,
          color: '#FF0000',
          bg: '#333'
        },
        checkpoints: {
          on: false,
          color: '#FF88FF',
          bg: '#000'
        },
        xhr: {
          on: false,
          color: '#2288FF',
          bg: '#000'
        },
        tasks: {
          on: false,
          color: '#88FFFF',
          bg: '#000'
        },
        db: {
          on: false,
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
        history: {
          on: true,
          color: '#baFF66',
          bg: '#555'
        },
        cache: {
          on: false,
          color: '#CCCCCC',
          bg: '#555'
        }
      }
    },
    
    log: function(tag, type) {
      if (!G.trace.ON || !console || !console.log || !type)
        return;
      
      
      var types = typeof type == 'string' ? [type] : type;
//      if (types.indexOf('error') != -1)
//        debugger;
      
      for (var i = 0; i < types.length; i++) {
        var t = types[i];
        var trace = G.trace.types[t] || G.trace.DEFAULT;
        if (!trace.on)
          continue;
        
        var b = G.browser;
        var css = b && ((b.mozilla && parseInt(b.version.slice(0,2))) > 4 || b.chrome && parseInt(b.version.slice(0,2)) >= 24);
        var msg = Array.prototype.slice.call(arguments, 2);
        var msgStr = '';
        for (var i = 0; i < msg.length; i++) {
          msgStr += (typeof msg[i] === 'string' ? msg[i] : JSON.stringify(msg[i]));
          if (i < msg.length - 1) msgStr += ' ';
        }

        var txt = t + ' : ' + tag + ' : ' + msgStr + ' : ';
        var d = new Date(G.currentServerTime());
        console.log((css ? '%c ' : '') + txt + new Array(Math.max(100 - txt.length, 0)).join(" ") + d.toUTCString().slice(17, 25) + ':' + d.getUTCMilliseconds(), css ? 'background: ' + (trace.bg || '#FFF') + '; color: ' + (trace.color || '#000') : '');        
      }
    },
    
    linkCSS: function(url) {
      var link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url; 
//      link.setAttribute("rel", "stylesheet")
//      link.setAttribute("type", "text/css")
//      link.setAttribute("href", url);
      $head.append(link);
    },

    appendCSS: function(text) {
      var style = doc.createElement('style');
      style.type = 'text/css';
      style.textContent = text; // iphone 2g gave innerhtml and appendchild the no_modification_allowed_err 
      $head.append(style);
    },
    
    getCanonicalPath: function(path, separator) {
      separator = separator || '/';
      var parts = path.split(separator);
      var stack = [];
      $.each(parts, function(idx, part) {
        if (part == '..')
          stack.pop();
        else
          stack.push(part);
      });
      
      return stack.join(separator);
    },

    workers: {},
    workerQueues: {},
    isWorkerAvailable: function(worker) {
      return !worker.__lablzTaken;
    },
    
    captureWorker: function(worker) {
      worker.__lablzTaken = true;
      return worker;
    },
    
    /**
     * get a promise of a web worker
     */
    getXhrWorkerPromise: function(taskType) {
      taskType = taskType || 'main';
      return $.Deferred(function(dfd) {
        if (!G.workers[taskType]) {
          var xw = G.files.xhrWorker;
          G.workers[taskType] = new Worker('{0}/js/{1}.js'.format(G.serverName, xw.fullName || xw.name));
        }
        
        var w = G.workers[taskType];
        w._taskType = taskType;
        if (G.isWorkerAvailable(w)) {
          dfd.resolve(G.captureWorker(w));
        }
        else {
          G.workerQueues[taskType] = G.workerQueues[taskType] || [];
          G.workerQueues[taskType].push(dfd);
        }
      });
    },
    
    /**
     * when you're done with a worker, let it go with this method so that others can use it
     */
    recycleXhrWorker: function(worker) {
      worker.onerror = null;
      worker.onmessage = null;
      worker.__lablzTaken = false;
      var q = G.workerQueues[worker._taskType];
      if (q && q.length)
        q.shift().resolve(worker);
    },
    
    pruneBundle: function(bundle, options) {
      options = options || {};
      var source = options.source || 'localStorage';
      var pruneDfd = $.Deferred();
      var prunePromise = pruneDfd.promise();
      var modules = [];
      var appcache = G.files.appcache;
      var bType = Object.prototype.toString.call(bundle);
      var noTS = bType === '[object String]';
      if (noTS) {
        var info = {
          name: bundle
        }
        
        var timestamp = G.files[name];
        if (timestamp && timestamp.timestamp)
          info.timestamp = timestamp.timestamp;
        
        bundle = {def: [info]};
      }
      else if (Object.prototype.toString.call(bundle) === '[object Array]') {
        bundle = {def: bundle};
      }

      for (var type in bundle) {
        var bt = bundle[type];
        for (var i = 0; i < bt.length; i++) {
          var info = bt[i];
          var name, timestamp;
          if (typeof info === 'string')
            name = info, timestamp = G.files[name];
          else {
            name = info.name;
            timestamp = info.timestamp;
            
            // for some files, like xhrWorker, we need the full name (e.g. xhrWorker.min_en_18908809988.js)
//            if (timestamp.timestamp) { 
//              name = timestamp.name;
//              timestamp = timestamp.timestamp;
//            }
          }
          
          if (!name || appcache[name])
            continue;
          
//          var inAppcache = !!appcache[name];

          info = {};
          var path = G.getCanonicalPath(require.toUrl(name));
//          var ext = name.match(/\.[a-zA-Z]+$/g);
//          if (!ext || ['.css', '.html', '.js', '.jsp'].indexOf(ext[0]) == -1)
//            path += '.js';
          
          if (G.modules[path])
            continue;
          
          info[path] = timestamp; // || G.modules(G.bundles, path)[path];
//          if (inAppcache)
//            info.appcache = true;
          modules.push(info);
        }
      }
      
      if (!hasLocalStorage)
        source = 'indexedDB';
      
      if (!modules.length)
        pruneDfd.resolve(modules);
      
      var minify = G.minify,
          def = G.minifyByDefault;

      var pruned = [],
          cachedPromises = [];
      
      $.each(modules, function(i, dmInfo) {
        var url;
        for (var n in dmInfo) {
          url = n;
          break;
        }
        
        var cachedDfd = $.Deferred();
        cachedPromises.push(cachedDfd.promise());
        var metadataPromise = G.getCached(getMetadataURL(url), source);
        metadataPromise.done(function(metadata) {
          metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          var dateSaved = metadata.dateModified;
          var minified = metadata.minified;
          var dateModified = dmInfo[url];
          if (dateModified <= dateSaved) {
            var fetch = false;
            if (G.isMinifiable(url)) {
              if ((!minified && (minify===true || (typeof minify ==='undefined' && def))) || 
                  (minified && (minify===false || (typeof minify ==='undefined' && !def)))) {
                // wrong minification mode on this file
                fetch = true;
              }
            }

            if (!fetch) {
              G.getCached(url, source).done(function(text) {                
                G.modules[url] = text;
                cachedDfd.resolve();
              }).fail(function() {
                pruned.push(url);
                cachedDfd.resolve();
              }); //G.localStorage.get(url);
              
              return;
            }
          }
          else {
            if (!info)
              G.log('init', 'error', 'no info found for file: ' + url);
              
//            G.localStorage.del(url);
          }
          
          pruned.push(url);
          cachedDfd.resolve();
        }).fail(function() {          
          pruned.push(url);
          cachedDfd.resolve();
        });        
      });
    
      $.when.apply($, cachedPromises).done(function() {
        pruneDfd.resolve(pruned);
      });
      
      return prunePromise;
    },
    
    loadBundle: function(bundle, options) {
      var bundleDfd = $.Deferred(),
          bundlePromise = bundleDfd.promise(),
          options = options || {
            async: false
          },
          source = options.source = options.source || 'localStorage',
          async = options.async;
      
      G.pruneBundle(bundle, options).done(function(pruned) {
        if (!pruned.length) {
          G.log('init', 'cache', 'bundle was cached', bundle);
          bundleDfd.resolve();
          return bundlePromise;
        }
        
        var data = {modules: pruned.join(',')};
  //      if (typeof G.minify !== 'undefined')
  //        data.minify = G.minify;
        
        var useWorker = G.hasWebWorkers && async;
        var getBundleReq = {
          url: G.serverName + "/backboneFiles", 
          type: 'POST',
          data: data,
          dataType: 'JSON'
        };
        
        var complete = function(resp) {
          if (useWorker) {
            if (resp.status == 304)
              bundleDfd.resolve();
            else
              resp = resp.data;
          }
          else {
            try {
              resp = JSON.parse(resp);
            } catch (err) {
            }
          }
          
          var newModules = {};
          if (resp && !resp.error && resp.modules) {
            for (var i = 0; i < resp.modules.length; i++) {
              var m = resp.modules[i];
              for (var name in m) {
                var minIdx = name.indexOf('.min.js');
                var mName = minIdx == -1 ? name : name.slice(0, minIdx) + '.js';
                G.modules[mName] = newModules[mName] = m[name];
                break;
              }
            }
          }
        
//          if (hasLocalStorage) {
            setTimeout(function() {
              for (var url in newModules) {
                var text = newModules[url];
//                G.localStorage.put(url, text);
//                G.localStorage.put(getMetadataURL(url), {
//                  dateModified: G.serverTime,
//                  minified: G.isMinified(url, text)
//                });
                G.putCached(url, text, source);
                G.putCached(getMetadataURL(url), {
                  dateModified: G.serverTime,
                  minified: G.isMinified(url, text)
                }, source);
              }
            }, 100);
//          }
          
          bundleDfd.resolve();
        }
  
        if (useWorker) {
          var workerPromise = G.getXhrWorkerPromise();
          workerPromise.done(function(xhrWorker) {          
            xhrWorker.onmessage = function(event) {
              try {
                G.log(G.TAG, 'xhr', 'fetched', getBundleReq.data.modules);
                complete(event.data);
              } finally {
                G.recycleXhrWorker(this);
              }
            };
            
            xhrWorker.onerror = function(err) {
    //          debugger;
              try {
                G.log(G.TAG, 'error', JSON.stringify(err));
              } finally {
                G.recycleXhrWorker(this);
              }
              
              bundleDfd.reject(err);
            };
            
            xhrWorker.postMessage(getBundleReq);  
          });
        }
        else {      
          getBundleReq.success = complete; 
          G.sendXhr(getBundleReq);
        }
      });
      
      return bundlePromise;
    },
    
    setCookie: function(name, value, exdays) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + exdays);
      var c_value = escape(value) + ((exdays==null) ? "" : ";domain=." + G.domain + ";path=/;expires="+exdate.toUTCString());
      doc.cookie = name + "=" + c_value;
    },
    
    getCookie: function(name) {
      var i, x, y, cookies = doc.cookie.split(";");
      for (i = 0;i < cookies.length; i++) {
        var cookie = cookies[i];
        x = cookie.substr(0, cookie.indexOf("="));
        y = cookie.substr(cookie.indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g,"");
        if (x == name) {
          return unescape(y);
        }
      }
    },
    
    inject: function(text) {// , context) {
      var script = doc.createElement("script");
      script.type = "text/javascript";
      script.async = true;

      // Make sure that the execution of code works by injecting a script
      // tag with appendChild/createTextNode
      // (IE doesn't support this, fails, and uses .text instead)
      try {
        script.appendChild(doc.createTextNode(text));
      } catch (err) {
        script.text = text;
      }

      head.appendChild(script);
      head.removeChild(script);
    },
    
    requireConfig: {
      paths: {
        mobiscroll: 'lib/mobiscroll-datetime-min',
        simplewebrtc: 'lib/simplewebrtc',
        jqmConfig: 'jqm-config',
        jqueryMobile: 'lib/jquery.mobile-1.3.1',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        indexedDBShim: 'lib/IndexedDBShim',
        jqueryIndexedDB: 'lib/jquery-indexeddb',
        queryIndexedDB: 'lib/queryIndexedDB',
        codemirror: 'lib/codemirror',
        codemirrorCss: '../styles/codemirror.css',
        codemirrorJSMode: 'lib/codemirrorJSMode',
        codemirrorXMLMode: 'lib/codemirrorXMLMode',
        codemirrorHTMLMode: 'lib/codemirrorHTMLMode',
        codemirrorCSSMode: 'lib/codemirrorCSSMode',
        leaflet: 'lib/leaflet',
        leafletMarkerCluster: 'lib/leaflet.markercluster',
        jqueryImagesloaded: 'lib/jquery.imagesloaded',
        jqueryMasonry: 'lib/jquery.masonry',
        jqueryAnyStretch: 'lib/jquery.anystretch'
      },
      shim: {
        backbone: {
          deps: ['underscore'],
          exports: 'Backbone'
        },
        leafletMarkerCluster: ['leaflet'],
        mobiscroll: ['../styles/mobiscroll.datetime.min.css'],
        codemirrorJSMode: ['codemirror', 'codemirrorCss'],
        codemirrorCSSMode: ['codemirror', 'codemirrorCss'],
        codemirrorHTMLMode: ['codemirror', 'codemirrorCss', 'codemirrorXMLMode']
      }
    }
  }; 
  
  for (var prop in moreG) {
    G[prop] = moreG[prop];
  }
  
  var bundles = G.bundles;
  G.files = {appcache: {}};
  for (var when in bundles) {
    var bundle = bundles[when];
    for (var type in bundle) {
      var bt = bundle[type];
      for (var i = 0; i < bt.length; i++) {
        var info = bt[i];
        G.files[info.name] = info;
        if (when === 'appcache') {
          G.files.appcache[info.name] = info;
        }
      }
    }
  }  

  G.apiUrl = G.serverName + '/api/v1/';
  (function() {
    var path = window.location.pathname,
        appPath = path.slice(path.lastIndexOf('/') + 1);
        devVoc = G.DEV_PACKAGE_PATH.replace('/', '\/'),
        regex = devVoc + appPath + '\/[^\/]*$';
    
    G.appModelRegExp        = new RegExp('model:(metadata:)?' + devVoc);
    G.currentAppRegExp      = new RegExp(regex);
    G.currentAppModelRegExp = new RegExp('model:(metadata:)?' + regex);
  })();

  var c = G.commonTypes, d = G.defaultVocPath;
  for (var type in c) {
    c[type] = G.defaultVocPath + c[type];
  }
  
  
  // Determine whether we want the server to minify stuff
  // START minify
  var hash = window.location.href;
  var hashIdx = hash.indexOf('#');
  hash = hashIdx === -1 ? '' : hash.slice(hashIdx + 1);
  var qIdx = hash.indexOf('?');
  var set = false;
  var mCookie = G.serverName + '/cookies/minify';
  var minified = G.getCookie(mCookie);
  if (qIdx != -1) {    
    var hParams = hash.slice(qIdx + 1).split('&');
    for (var i = 0; i < hParams.length; i++) {
      var p = hParams[i].split('=');
      if (p[0] == '-min') {
        G.setCookie(mCookie, p[1], 100000);
        if (p[1] != minified) {
          minified = p[1];
        }
        
        break;
      }
    }
  }
  
  if (typeof minified === 'undefined')
    G.minify = G.minifyByDefault;
  else
    G.minify = minified === 'y' ? true : minified === 'n' ? false : undefined;
  
  require.config(G.requireConfig);   
  return G;
});

require(['globals'], function(G) {
  G.startedTask("loading pre-bundle");
  var spinner = 'app init';
  G.showSpinner({name: spinner, timeout: 10000});
  
  var bundles = G.bundles,
      preBundle = bundles.pre,
      postBundle = bundles.post, 
      extrasBundle = bundles.extras,
      priorities = [],
      appcache = G.files.appcache;
  
  for (var type in preBundle) {
    var subBundle = preBundle[type];
    for (var i = 0; i < subBundle.length; i++) {
      var module = subBundle[i];
      if (module.hasOwnProperty('priority')) {
        subBundle.splice(i, 1);
//        if (appcache[module.name]) {
//          require([module.name]);
//          continue;
//        }
//        
        priorities.push(module);
      }
    }
  }

  if (priorities.length) {
    priorities.sort(function(a, b) {
      return b.priority - a.priority;
    });
    
    var pModules = [];
    for (var i = 0; i < priorities.length; i++) {
      pModules.push(priorities[i].name);
    }
    
//    require(pModules);
    require(pModules, function() {
      loadRegular();
    });
  }
  else
    loadRegular();

  function loadRegular() {
    G.loadBundle(preBundle).done(function() {
      var dfd = preBundle._deferred = preBundle._deferred || $.Deferred();
      dfd.resolve();
      G.finishedTask("loading pre-bundle");
      
      G.startedTask("loading modules");
      var css = preBundle.css.slice();
      for (var i = 0; i < css.length; i++) {
        var cssObj = css[i];
        css[i] = cssObj.name;
      }
      
      require('__domReady__').done(function() {
        require(['jqmConfig', 'events', 'app'].concat(css), function(jqmConfig, Events, App) {
          Events.on('appStart', G._appStartDfd.resolve);
          console.debug("Passed first require: " + (new Date().getTime() - __started) + ' millis');
          G.finishedTask("loading modules");
          G.browser = $.browser;
          App.initialize();
          G.startedTask('loading post-bundle');
          G.loadBundle(postBundle, {async: true}).done(function() {
            var dfd = postBundle._deferred = postBundle._deferred || $.Deferred();
            dfd.resolve();
            
            G.finishedTask('loading post-bundle');
            G.startedTask('loading extras-bundle');
            G.onAppStart().done(function() {            
              G.loadBundle(extrasBundle, {source: 'indexedDB', async: true}).done(function() {
                var dfd = extrasBundle._deferred = extrasBundle._deferred || $.Deferred();
                dfd.resolve();
              });
            });
          });
          
          if (window.location.hash.length < 2) {
            Events.once('appStart', function() {
              G.hideSpinner(spinner);
              console.debug("App start took: " + (new Date().getTime() - __started) + ' millis');
            });
          }
          else {
            Events.once('pageChange', function() {
              G.hideSpinner(spinner);
              console.debug("App start took: " + (new Date().getTime() - __started) + ' millis');
            });
          }
        });
      });
    })
  }
});
})(window, document, undefined);