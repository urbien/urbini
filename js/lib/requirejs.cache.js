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

    get: function (url, callback) {
      var xhr = cache.createXhr();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function (evt) {
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
          callback(xhr.responseText);
        }
      };
      xhr.send(null);
    },

    prependUrl: function(content, url) {
      return content.indexOf('// @sourceURL') == 0 ? content : '// @sourceURL = ' + url + '\r\n' + content;
    },
    
    load: function (name, req, load, config) {
      console.log('cache!' + name);
      var now = new Date().getTime();
      var cached, url = req.toUrl(name);
      var type = url.slice(0, url.indexOf('/'));
      var inMemory = Lablz.modules[type] && Lablz.modules[type][url];
      var loadedCached = false;
      if (inMemory || hasLocalStorage) {
        if (inMemory) {
          cached = Lablz.modules[type][url];
          setTimeout(function() {
            localStorage.setItem(url, JSON.stringify({modified: now, text: cached}));
          }) 
        }
        else if (hasLocalStorage) { // in build context, this will be false, too
          cached = localStorage.getItem(url);
          cached = cached && JSON.parse(cached).text;
        }

        var loadedCached = cached !== null;
        if (loadedCached) {
          cached = cache.prependUrl(cached, url);
          try {
            console.log('cache! eval\'ing ' + name);
            load.fromText(name, cached);
          } catch (err) {
            loadedCached = false;
          }
        } 
      }
      
      if (!loadedCached) {
        req([name], function (content) {
          load(content);
          console.log('cache! loaded ' + name + ', content is null: ' + (content == null));
        });
      }
    }
  };

  return cache;
});

}());
