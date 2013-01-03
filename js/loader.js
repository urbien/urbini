/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

define('globals', function() {
  var G = Lablz;
  G.localTime = new Date().getTime();
  G.online = !!navigator.onLine;
  window.addEventListener("offline", function(e) {
    // we just lost our connection and entered offline mode, disable eternal link
    G.online = false;
  }, false);

  window.addEventListener("online", function(e) {
    // just came back online, enable links
    G.online = true;
  }, false);

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
//      prependUrl: function(content, url) {
//        return content + '\r\n//@ sourceURL=' + url;
//      },
      
      loadModule: function(text, url, onLoad) {
//        text = cache.prependUrl(text, url);
        text = text + '\r\n//@ sourceURL=' + url;
        var ext = url.match(/\.[a-zA-Z]+$/g);
        switch (ext[0]) {
          case '.css':
            G.appendCSS(text, function() {
              G.log(cache.TAG, 'cache', 'cache.get: ' + url);
              onLoad();
              G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
            });
            break;
          case '.html':
          case '.jsp':
            G.log(cache.TAG, 'cache', 'cache.get: ' + url);
  //          G.appendHTML(text);
            onLoad(text);
            G.log(cache.TAG, 'cache', 'end cache.get: ' + url);
            break;
          default:
            onLoad.fromText(text);
            break;
        }        
      },
          
      load: function (name, req, onLoad, config) {
        G.startedTask("load " + name);
        var ol = onLoad;
        var self = this;
        onLoad = function() {
          ol.apply(self, arguments);
          G.finishedTask("load " + name);
//          G.recordCheckpoint('finished loading ' + name);
        }
        
        var ft = ol.fromText;
        onLoad.fromText = function() {
          ft.apply(self, arguments);
          G.finishedTask("load " + name);
//          G.recordCheckpoint('finished loading ' + name);
        }
        
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
          
        var mCache = G.modules;
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
              var fileInfo = G.leaf(G.files, url, '/');
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
            try {
              G.log(cache.TAG, 'cache', 'Loading from', loadSource, url);
              cache.loadModule(cached, url, onLoad);
              G.log(cache.TAG, 'cache', 'End loading from', loadSource, url);
            } catch (err) {
              G.log(cache.TAG, 'cache', 'failed to load ' + url + ' from', loadSource, err);
              loadedCached = false;
            }
          } 
        }
        
        if (loadedCached)
          return;
        
        /// use 'sendXhr' instead of 'req' so we can store to localStorage
        G.loadBundle(name, function() {
          if (G.modules[url])
            cache.loadModule(G.modules[url], url, onLoad);
          else
            G.log(cache.TAG, ['error', 'cache'], 'failed to load module', name);
        });        
      },
      
      save: function(url, text, delay) {
        var put = function() {
          localStorage.setItem(url, G.prepForStorage(text, G.serverTime));      
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

  G.serverName = (function() {     
    var s = document.getElementsByTagName('base')[0].href;
    return s.match("/$") ? s.slice(0, s.length - 1) : s;
  })();
  
  var moreG = {
    sqlUrl: G.serverName + '/' + G.sqlUri,
    modelsUrl: G.serverName + '/backboneModel',  
    defaultVocPath: 'http://www.hudsonfog.com/voc/',
    timeOffset: G.localTime - G.serverTime,
    currentServerTime: function() {
      return new Date().getTime() - G.timeOffset;
    },
    hasLocalStorage: hasLocalStorage,
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
      G.tasks[name].end = new Date();
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
      var method = (options.method || 'GET').toUpperCase();      
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
      types : {
        error: {
          on: true,
          color: '#FF0000',
          bg: '#333'
        },
        checkpoints: {
          on: true,
          color: '#FF88FF',
          bg: '#000'
        },
        tasks: {
          on: true,
          color: '#88FFFF',
          bg: '#000'
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
      }
    },
    
    log: function(tag, type) {
      if (!G.trace.ON)
        return;
      
      var types = typeof type == 'string' ? [type] : type;
      for (var i = 0; i < types.length; i++) {
        var t = types[i];
        var trace = G.trace.types[t] || {on: true};
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

        var txt = t + ' : ' + tag + ' : ' + msgStr + ' : ';
        var d = new Date(G.currentServerTime());
//      var h = d.getUTCHours();
//      var m = d.getUTCMinutes();
//      var s = d.getUTCSeconds();
//      var ms = d.getUTCMilliseconds();
//      [h,m,s,ms].join(':')
        console.log((css ? '%c ' : '') + txt + new Array(Math.max(100 - txt.length, 0)).join(" ") + d.toUTCString().slice(17, 25) + ':' + d.getUTCMilliseconds(), css ? 'background: ' + (trace.bg || '#FFF') + '; color: ' + (trace.color || '#000') : '');        
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
      var bType = Object.prototype.toString.call(bundle);
      if (bType === '[object String]') {
        bundle = {def: [bundle]};
      }
      else if (Object.prototype.toString.call(bundle) === '[object Array]') {
        bundle = {def: bundle};
      }
      
      for (var type in bundle) {
        var bt = bundle[type];
        for (var i = 0; i < bt.length; i++) {
          var name = bt[i];
          var ext = name.match(/\.[a-zA-Z]+$/g);
          if (!ext || ['.css', '.html', '.js', '.jsp'].indexOf(ext[0]) == -1)
            name += '.js';
          
          modules.push(G.getCanonicalPath(require.toUrl(name)));
        }
      }
      
      if (!hasLocalStorage)
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
      
      G.sendXhr({
        url: G.serverName + "/backboneFiles", 
        method: 'POST',
        data: {modules: pruned.join(','), minify: G.minify},
        success: function(text) {
          var resp;
          try {
            resp = JSON.parse(text);
          } catch (err) {
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
        
          if (hasLocalStorage) {
            setTimeout(function() {
              for (var url in newModules) {
                localStorage.setItem(url, G.prepForStorage(newModules[url], G.serverTime));
              }
            }, 100);
          }
          
          if (callback) callback();
        }
      });
    },
    
    prepForStorage: function(text, date) {
      return JSON.stringify({modified: date, text: text});
    },
    
    setCookie: function(name, value, exdays) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + exdays);
      var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
      document.cookie = name + "=" + c_value;
    },
    
    getCookie: function(name) {
      var i, x, y, cookies = document.cookie.split(";");
      for (i = 0;i < cookies.length; i++) {
        x = cookies[i].substr(0, cookies[i].indexOf("="));
        y = cookies[i].substr(cookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g,"");
        if (x == name) {
          return unescape(y);
        }
      }
    },

    testIDBQ: function(storeName, q) {
      var query;
      for (var i = 0; i < q.length; i++) {
        var val = q[i];
        var subQuery = Lablz.idbq.Index(val.index)[val.op](val.bound);
        query = query ? query.and(subQuery) : subQuery;
      }
//    var query = q.reduce(function(memo, val) {
//      return memo.and(Lablz.idbq.Index(val.index)[val.op](val.bound));
//    });
      
      var store = Lablz.MBI.db.transaction([storeName], 'readonly').objectStore(storeName);
      var request = query.getAll(store);
      var goals;
      request.onsuccess = function (event) {
        goals = request.result;
        console.log(JSON.stringify(event.target.result));
      }
      
      request.onerror = function (event) {
        console.log("error: " + JSON.stringify(event));
      }
    }
  }; 
  
  for (var prop in moreG) {
    G[prop] = moreG[prop];
  }
  
  
  G.apiUrl = G.serverName + '/api/v1/';
  
  // Determine whether we want the server to minify stuff
  // START minify
  var hash = window.location.hash;
  var qIdx = hash.indexOf('?');
  var set = false;
  var mCookie = G.serverName + '/cookies/minify';
  if (qIdx != -1) {    
    var hParams = hash.slice(qIdx + 1).split('&');
    for (var i = 0; i < hParams.length; i++) {
      var p = hParams[i].split('=');
      if (p[0] == '-min') {
        G.setCookie(mCookie, p[1], 100000);
        break;
      }
    }
  }
  
  G.minify = G.getCookie(mCookie) === 'y';
  // END minify
  
  require.config({
    paths: {
//      cache: 'lib/requirejs.cache',
      jquery: 'lib/jquery',
      jqmConfig: 'jqm-config',
      jqueryMobile: 'lib/jquery.mobile-1.2.0',
      underscore: 'lib/underscore',
      backbone: 'lib/backbone',
      indexedDBShim: 'lib/IndexedDBShim',
      queryIndexedDB: 'lib/queryIndexedDB',
      leaflet: 'lib/leaflet',
      leafletMarkerCluster: 'lib/leaflet.markercluster',
      jqueryImagesloaded: 'lib/jquery.imagesloaded',
      jqueryMasonry: 'lib/jquery.masonry'
    },
    shim: {
      leafletMarkerCluster: ['leaflet'],
      jqueryMasonry: ['jquery'],
      jqueryImagesloaded: ['jquery'],
      queryIndexedDB: ['indexedDBShim']
    }
  });

   G.baseBundle = {
     pre: {
     // Javascript
       js: ['lib/jquery', 'jqm-config', 'lib/jquery.mobile', 'lib/underscore', 'lib/backbone', 'lib/IndexedDBShim', 'lib/queryIndexedDB', 'lib/jquery.masonry', 'lib/jquery.imagesloaded', 'templates', 'utils', 'error', 'events', 'models/Resource', 'collections/ResourceList', 
        'views/ResourceView', 'views/ControlPanel', 'views/Header', 'views/BackButton', 'views/MenuButton', 'views/LoginButtons', 'views/ToggleButton', 'views/AroundMeButton', 'views/ResourceImageView', 'views/MapItButton', 
        /*'views/ResourceMasonryItemView',*/ 'views/ResourceListItemView', 'views/ResourceListView', 'views/ListPage', 'views/ViewPage', 'vocManager', 'modelsBase', 'router', 'app'],
       // CSS
       css: ['../lib/jquery.mobile.css', '../lib/jquery.mobile.theme.css', '../lib/jquery.mobile.structure.css', '../lib/jqm-icon-pack-fa.css', '../styles/styles.css', '../styles/common-template-m.css'],
       html: ['../templates.jsp']
     },
     post: {
       // Javascript
       js: ['views/ResourceMasonryItemView', 'views/CommentListItemView', 'views/MenuPage', 'views/MapView', 'leaflet', 'leafletMarkerCluster', 'maps'],
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
  G.startedTask("loading pre-bundle");
  G.loadBundle(G.baseBundle.pre, function() {
    G.finishedTask("loading pre-bundle");
    var css = G.baseBundle.pre.css.slice();
    for (var i = 0; i < css.length; i++) {
      css[i] = 'cache!' + css[i];
    }
    
    G.startedTask("loading modules");
    require(['cache!jquery', 'cache!jqmConfig', 'cache!app'].concat(css), function($, jqmConfig, App) {
      G.finishedTask("loading modules");
      G.browser = $.browser;
      App.initialize();
      setTimeout(function() {
        G.startedTask('loading post-bundle');
        G.loadBundle(G.baseBundle.post, function() {
          G.finishedTask('loading post-bundle');
        });
      }, 100);
    });
  });
})
