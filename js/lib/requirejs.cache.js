/**
 * AMD-cache, a loader plugin for AMD loaders.
 *
 * Available via the MIT or new BSD license.
 *
 * Copyright (c) 2011 Jens Arps
 *
 * The xhr code is taken from the RequireJS text plugin:
 *
 * @license RequireJS text 0.26.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * see: http://github.com/jrburke/requirejs for details
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
//        cache.get(url, function(content) {
          onLoad(content);
//          onLoad.fromText(content);
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
            cached = JSON.parse(cached);
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

        var loadedCached = cached;
        if (loadedCached) {
          cached = cache.prependUrl(cached, url);
          try {
            if (isCSS)
              cache.appendCSS(cached, onLoad);
            else
              onLoad.fromText(cached);
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
            onLoad();
          });
        } 
        else {
          cache.save(url, text, 100);
          onLoad.fromText(text);
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
      if (typeof callback != 'undefined')
        style.onload = callback;
      
      style.innerHTML = text;
      document.getElementsByTagName('head')[0].appendChild(style);
    },
    
    leaf: function(obj, path, separator) {
      path = cache.getCanonicalPath(path);
      if (typeof obj == 'undefined' || !obj)
        return null;
      
      separator = separator || '.';
      var dIdx = path.indexOf(separator);
      return dIdx == -1 ? obj[path] : cache.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
    }
    
//    injectScript: function(content, callback) {
//      var script = document.createElement('script');
//      script.type = "text/javascript";
//      script.src = content;
//      script.charset = "utf-8";
//      script.async = true;
////      var scriptContent = document.createTextNode(content);
////      script.appendChild(scriptContent);
////      (document.body || document.getElementsByTagName("head")[0]).appendChild(script);
//
////      script.async = true;
////      callback();
//      if (callback) {
//        script.onreadystatechange = script.onload = function() {
//          var state = script.readyState;
//          if (!state || /loaded|complete/.test(state)) {
//            callback();
//          }
//        };
//      }
//      
//      document.getElementsByTagName("head")[0].appendChild(script);
////      setTimeout(callback, 1000);
//    }
    
//    addScript: function(src, text, callback) {
//      var s = document.createElement('script');
//      s.type = 'text/javascript';
//      s.charset = 'utf-8';
//      if (src)
//        s.src = src;
//      if (text)
//        s.innerHTML = text;
//      
//      s.async = true;
//      s.onreadystatechange = s.onload = function() {
//        var state = s.readyState;
//        if (!callback.done && (!state || /loaded|complete/.test(state))) {
//          callback.done = true;
//          callback();
//        }
//      };
//
//      // use body if available. more safe in IE
//      (document.body || document.getElementsByTagName("head")[0]).appendChild(s);
//    }
  };

  return cache;
});

}());
