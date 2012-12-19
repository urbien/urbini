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
(function () {

var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
    hasLocalStorage = (function(){
      var supported = false;
      try{
        supported = window && ("localStorage" in window) && ("getItem" in localStorage);
      }catch(e){}
      return supported;
    })();

define(function () {
  var trace = false;
  var cache = {

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
      var xhr = cache.createXhr();
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
  
    prependUrl: function(content, url) {
      return content + '\r\n//@ sourceURL=' + url;
    },
    
    prepForStorage: function(text) {
      return JSON.stringify({modified: new Date().getTime(), text: text});
    },
        
    load: function (name, req, onLoad, config) {
      var cached,
      url = cache.getCanonicalPath(req.toUrl(name));
      
      // TODO: unhack
      if (name == 'jqueryMobile') {
        req([name], function(content) {
          if (trace) console.log('Loading jq: ' + url);
          onLoad(content);
          if (trace) console.log('End loading jq: ' + url);
        });
        
        return;
      }
      
      var isText = ext = name.match(/\.[a-zA-Z]+$/g);
      if (ext)
        ext = ext[0].slice(1).toLowerCase();
        
      var isCSS = ext == 'css';    
      var now = new Date().getTime();
      var mCache = config.cache;
      var inMemory = mCache && mCache[url];
      var loadedCached = false;
      if (inMemory || hasLocalStorage) {
        if (inMemory) {
          cached = mCache[url];
        }
        else if (hasLocalStorage) { // in build context, this will be false, too
          cached = localStorage.getItem(url);
          if (cached) {
            try {
              cached = JSON.parse(cached);
            } catch (err) {
              console.log("failed to parse cached file: " + url);
              cached = null;
            }
            
            if (cached) {
              var fileInfo = cache.leaf(config.expirationDates, url, '/');
              var modified = fileInfo && fileInfo.modified;
              if (modified && modified <= cached.modified)
                cached = cached.text;
              else {
                localStorage.removeItem(url);
                cached = null;
              }
            }
          }
        }

        var loadedCached = cached;
        if (loadedCached) {
          cached = cache.prependUrl(cached, url);
          try {
            if (trace) console.log('Loading from cache: ' + url);
            if (isCSS) {
              cache.appendCSS(cached, function() {
                if (trace) console.log('cache.get: ' + url);
                onLoad();
                if (trace) console.log('end cache.get: ' + url);
              });
            }
            else
              onLoad.fromText(cached);
            if (trace) console.log('End loading from cache: ' + url);
          } catch (err) {
            console.log('failed to load ' + url + ' from cache: ' + err);
            loadedCached = false;
          }
        } 
      }
      
      if (loadedCached)
        return;
      
      /// use 'get' instead of 'req' so we can store to localStorage
      cache.get(url, function(text) {
        if (isCSS) {
          cache.appendCSS(text, function() {
            cache.save(url, text, 100);
            if (trace) console.log('cache.get: ' + url);
            onLoad();
            if (trace) console.log('end cache.get: ' + url);
          });
        } 
        else {
          cache.save(url, text, 100);
          if (trace) console.log('cache.get: ' + url);
          onLoad.fromText(text);
          if (trace) console.log('end cache.get: ' + url);
          url = url;
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
    
    appendCSS: function(text, callback) {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = text;
      document.getElementsByTagName('head')[0].appendChild(style);
      callback();
    },
    
    leaf: function(obj, path, separator) {
      path = cache.getCanonicalPath(path);
      if (typeof obj == 'undefined' || !obj)
        return null;
      
      separator = separator || '.';
      var dIdx = path.indexOf(separator);
      return dIdx == -1 ? obj[path] : cache.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
    }    
  };

  return cache;
});

}());
