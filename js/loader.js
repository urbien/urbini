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

  
                    
requirejs.exec = function(text) {
//  console.log("evaling/injecting", text.slice(text.lastIndexOf('@ sourceURL')));
  // Script Injection
  var nav = Lablz.navigator;
  if (nav.isChrome || nav.isSafari)
    Lablz.inject(text);
  else if (nav.isFirefox)
    return window.eval(text);
  else // Safari
    return window.eval(text);
//  return eval(text);
  
//  return Lablz.inject(text);
  
  // Indirect Eval
//  try {
//    return window.eval.call({}, text);
//  } catch (err) {
//    // Safari will throw err: "The "this" value passed to eval must be the global object from which eval originated" 
//    return window.eval(text);
//  }
  // Direct Eval
//  return eval(text);
}
                    
//'use strict';
define('globals', function() {
  /**
   * @param constantTimeout: if specified, this will always be the timeout for this function, otherwise the first param of the returned async function will be the timeout
   */
  
  var doc = document,
      head = document.getElementsByTagName('head')[0],
      body = document.getElementsByTagName('body')[0];
  
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

  var loadModule = function(text, url, contextOrOnLoad, name) {
    var context,
        onLoad,
        ext = url.match(/\.[a-zA-Z]+$/g)[0];
    
    if (ext === '.jsp')
      onLoad = contextOrOnLoad;
    else
      context = contextOrOnLoad;
      
    switch (ext) {
      case '.css':
//        if (G.minify !== true)
        text += '\r\n/*//@ sourceURL=' + url + '*/';
//        text = G.addMinFlag(text);
        G.appendCSS(text);
        G.log(G.TAG, 'cache', 'cache.get: ' + url);
        context.completeLoad(name); // pseudonym for onLoad
        G.log(G.TAG, 'cache', 'end cache.get: ' + url);
        break;
      case '.html':
      case '.jsp':
//        debugger;
        G.log(G.TAG, 'cache', 'cache.get: ' + url);
        onLoad(text);
        G.log(G.TAG, 'cache', 'end cache.get: ' + url);
        break;
      default:
//        text += '\n//@ sourceURL=' + url.slice(0, -2) + 'min.js';
//        if (G.minify !== true) {
          if (G.navigator.isIE) text += '/*\n'; // see http://bugs.jquery.com/ticket/13274#comment:6
          text += '\n//@ sourceMappingURL=' + url + '.map';
          text += '\n//@ sourceURL=' + url;
          if (G.navigator.isIE) text += '*/\n';
//        }
//        text = G.addMinFlag(text);
        requirejs.exec(text);
        context.completeLoad(name); // JQM hack
        break;
    }        
  };

  var orgRJSLoad = requirejs.load;
  requirejs.load = function (context, name, url, config) {
    var completeLoad = context.completeLoad,
        url = G.getCanonicalPath(url),
        config = config || (context && context.config) || {},
        cached;

    if (name === 'jqueryMobile') {
      orgRJSLoad.apply(this, arguments);
      return;
    }
        
    if (/\.(jsp|css|html)\.js$/.test(url))
      url = url.replace(/\.js$/, '');
        
    // TODO: unhack
//    if (name == 'jqueryMobile') {
//      localRequire([name], function(mod) {
//        G.log(G.TAG, 'cache', 'Loading jq: ' + url);
//        completeLoad(mod);
//        G.log(G.TAG, 'cache', 'End loading jq: ' + url);
//      });
//      
//      return;
//    }
    
    var isText = ext = name.match(/\.[a-zA-Z]+$/g);
    if (ext)
      ext = ext[0].slice(1).toLowerCase();
      
    var mCache = G.modules;
    var inMemory = mCache && mCache[url];
    var loadedCached = false;
    if (inMemory) {// || hasLocalStorage) {
      var loadSource = inMemory ? 'memory' : 'LS';
//      if (inMemory) {
        cached = mCache[url];
//      }
//      else if (hasLocalStorage) { // in build context, this will be false, too
//        try {
//          G.log(G.TAG, 'cache', "loading from localStorage: " + url);
//          cached = G.localStorage.get(url);
//          cached = cached && JSON.parse(cached);
//        } catch (err) {
//          G.log(G.TAG, ['error', 'cache'], "failed to parse cached file: " + url);
//          G.localStorage.del(url);
//          cached = null;
//        }
//        
//        if (cached) {
//          var timestamp = G.files[name];
//          if (timestamp && timestamp <= cached.modified)
//            cached = cached.text;
//          else {
//            G.localStorage.del(url);
//            cached = null;
//          }
//        }
//      }

      var loadedCached = cached;
      if (loadedCached) {            
        try {
          G.log(G.TAG, 'cache', 'Loading from', loadSource, url);
          loadModule(cached, url, context, name);
          G.log(G.TAG, 'cache', 'End loading from', loadSource, url);
        } catch (err) {
//          debugger;
          G.log(G.TAG, ['error', 'cache'], 'failed to load ' + url + ' from', loadSource, err);
          G.localStorage.del(url);
          loadedCached = false;
        }
      } 
    }
    
    if (loadedCached)
      return;
    
    /// use 'sendXhr' instead of 'req' so we can store to localStorage
    G.loadBundle(name, function() {
      if (G.modules[url])
        loadModule(G.modules[url], url, context, name);
      else
        G.log(G.TAG, ['error', 'cache'], 'failed to load module', name);
    });        
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

define('cache', function() {
    var cache = {
      TAG: 'cache',
      load: function (name, req, onLoad, config) {
        // hack for jsp, otherwise define callback function will not get jsp text
        if (name === 'jqueryMobile') {
          req([name], function() {
            onLoad(name);
          });
        }
        else
          requirejs.load(onLoad, name, req.toUrl(name), config);
      }
    };

    return cache;
  });

  G.serverName = (function() {     
    var s = doc.getElementsByTagName('base')[0].href;
    return s.match("/$") ? s.slice(0, s.length - 1) : s;
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
        if(['QuotaExceededError', 'QUOTA_EXCEEDED_ERR', 'NS_ERROR_DOM_QUOTA_REACHED'].indexOf(e.name) != -1) {
          // reset to make space
          ls.reset(force && function() {
            ls.put(key, value)
          });
        } else {
          debugger;
          G.hasLocalStorage = false;
          G.log(G.TAG, "Local storage write failure: ", e);
        }
      }
    },
    
    reset: function(after) {
//      debugger;
      var resetting = this.resetting;
      this.resetting = true;
      G.storedModelTypes = [];
      for (var i = localStorage.length - 1; i > -1; i--) {
        var key = localStorage.key(i);
        if (key.indexOf('model:') == 0)
          G.localStorage.del(key);
      }
      
      
      if (after) 
        after();
      
      if (!resetting)
        G.Voc && G.Voc.saveModelsToStorage();
    },
    
    nukeScripts: function() {
      var start = new Date().getTime();
      var length = localStorage.length;
      console.log("nuking scripts, localStorage has", length, "keys", start);
//      var cache = {};
//      for (var i = length - 1; i > -1; i--) {
//        var key = localStorage.key(i);
//        if (!/\.(?:js|css|jsp)$/.test(key))
//          cache[key] = G.localStorage.get(key);
//      }
//      
//      localStorage.clear();
//      for (var key in cache) {
//        G.localStorage.put(key, cache[key]);
//      }
//      
//      delete cache;
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
    
    nukeHandlers: function() {
      var length = localStorage.length;
      for (var i = length - 1; i > -1; i--) {
        var key = localStorage.key(i);
        if (/^handlers/.test(key))
          G.localStorage.del(key);
      }
    }
  };
  
  function testCSS(prop) {
    return prop in document.documentElement.style;
  }
  
  
  G.localStorage.putAsync = G.localStorage.put.async(100);
  G.localStorage.resetAsync = G.localStorage.reset.async(100);
  var n = G.navigator = {
    isOpera: !!(window.opera && window.opera.version),  // Opera 8.0+
    isFirefox: testCSS('MozBoxSizing'),                 // FF 0.8+
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    // At least Safari 3+: "[object HTMLElementConstructor]"
    isIE: /*@cc_on!@*/false || testCSS('msTransform')  // At least IE6
  };
  
  n.isChrome = !n.isSafari && testCSS('WebkitTransform');  // Chrome 1+
    
  var moreG = {
//    isJQM: function(url) {
//      return /^jquery\.mobile.*\.js$/.test(url);
//    },
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
    webWorkers: {},
    customHandlers: {},
    defaults: {
      radius: 15 // km
    },
    modelsMetadataMap: {},
    oldModelsMetadataMap: {}, // map of models which we don't know latest lastModified date for
    shortNameToModel: {},
    typeToModel: {},
    shortNameToEnum: {},
    typeToEnum: {},
    shortNameToInline: {},
    typeToInline: {},
    modCache: {},
    usedModels: {},
    LISTMODES: {LIST: 'LIST', CHOOSER: 'CHOOSER', DEFAULT: 'LIST'},
    classMap: G.classMap || {},
    sqlUrl: G.serverName + '/' + G.sqlUri,
    modelsUrl: G.serverName + '/backboneModel',  
    defaultVocPath: 'http://www.hudsonfog.com/voc/',
    timeOffset: G.localTime - G.serverTime,
    currentServerTime: function() {
      return new Date().getTime() - G.timeOffset;
    },
    hasLocalStorage: hasLocalStorage,
    hasWebWorkers: typeof window.Worker !== 'undefined',
//    xhrWorker: G.serverName + '/js/xhrWorker.js',
    getXhrWorker: function() {
      G.xhrWorker = G.xhrWorker || new Worker(G.serverName + '/js/xhrWorker.js');
      return G.xhrWorker;
    },
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
      ON: G.minify === false,
      DEFAULT: {on: false},
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
        tasks: {
          on: false,
          color: '#88FFFF',
          bg: '#000'
        },
        db: {
          on: true,
          color: '#FFFFFF',
          bg: '#000'
        },
        render: {
          on: false,
          color: '#AA00FF',
          bg: '#DDD'
        },
        events: {
          on: false,
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
      if (!G.trace.ON || !console || !console.log)
        return;
      
      var types = typeof type == 'string' ? [type] : type;
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
//      var h = d.getUTCHours();
//      var m = d.getUTCMinutes();
//      var s = d.getUTCSeconds();
//      var ms = d.getUTCMilliseconds();
//      [h,m,s,ms].join(':')
        console.log((css ? '%c ' : '') + txt + new Array(Math.max(100 - txt.length, 0)).join(" ") + d.toUTCString().slice(17, 25) + ':' + d.getUTCMilliseconds(), css ? 'background: ' + (trace.bg || '#FFF') + '; color: ' + (trace.color || '#000') : '');        
      }
    },
    
    keys: function(obj) {
      var keys = [];
      for (var key in obj) { 
        if (obj.hasOwnProperty(key)) { 
          keys[keys.length] = key;
        }
      }
      
      return keys;
    },
    
    asyncLoop: function(obj, process, timeout, context) {
      var isArray = obj.length === +obj.length;
      var keys = isArray ? obj : G.keys(obj);
      if (!keys.length) 
        return;
      
      context = context || this;
      timeout = timeout || 100;
      setTimeout(function helper() {
        var key = keys.shift();
        var args = [key];
        if (!isArray)
          args.push(obj[key]);
          
        process.apply(context, args);
        if (keys.length) { 
          setTimeout(helper, timeout);
        }
      }, timeout);
    },

    appendCSS: function(text) {
      var style = doc.createElement('style');
      style.type = 'text/css';
      style.textContent = text; // iphone 2g gave innerhtml and appendchild the no_modification_allowed_err 
      head.appendChild(style);
    },
    
    appendHTML: function(html, element) {
      var div = doc.createElement('div');
      div.id = G.nextId();
      div.innerHTML = html;
      (element || body).appendChild(div);
    },
    
//    inject: function(module, text, callback) {
//      var d = document;
//      var script = d.createElement("script");
//      var id = "script" + (new Date).getTime();
//      var root = d.documentElement;
//      script.type = "text/javascript";
////      script.innerHtml = text;
//      try {
//        script.appendChild(d.createTextNode(text));
//      } catch(e) {
//        script.text = text; // IE
//      }
//      
//      var parent = d.head || d.body;
//      parent.appendChild(script);
//      parent.removeChild(script);
//      callback(text);
//    },
//    inject: function(module, text, callback) {
//      var d = document;
//      var script = d.createElement("script");
//      var id = "script" + (new Date).getTime();
//      var root = d.documentElement;
//      script.type = "text/javascript";
////      script.innerHtml = text;
//      try {
//        script.appendChild(d.createTextNode(text));
//      } catch(e) {
//        script.text = text; // IE
//      }
//      
//      var parent = d.head || d.body;
//      parent.appendChild(script);
//      parent.removeChild(script);
//      callback(module);
//    },

    getCanonicalPath: function(path, separator) {
      separator = separator || '/';
      var parts = path.split(separator);
      var stack = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part == '..')
          stack.pop();
        else
          stack.push(part);
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
      var noTS = bType === '[object String]';
      if (noTS) {
        var name = bundle;
        bundle = {def: [{}]};
        bundle.def[0][name] = G.files[name];
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
            for (var n in info) {
              name = n;
              break;
            }
            
            timestamp = info[name];
          }
          
          var ext = name.match(/\.[a-zA-Z]+$/g);
          if (!ext || ['.css', '.html', '.js', '.jsp'].indexOf(ext[0]) == -1)
            name += '.js';

          info = {};
          var path = G.getCanonicalPath(require.toUrl(name));
          info[path] = timestamp; // || G.modules(G.bundles, path)[path];
          modules.push(info);
        }
      }
      
      if (!hasLocalStorage)
        return modules;
      
      var minify = G.minify,
          def = G.minifyByDefault;

      var pruned = [];
      for (var i = 0; i < modules.length; i++) {
        var dmInfo = modules[i];
        var url;
        for (var n in dmInfo) {
          url = n;
          break;
        }
        
        var saved = G.localStorage.get(url);
        if (saved) {
          try {
            saved = JSON.parse(saved);
          } catch (err) {
            pruned.push(url);
            G.localStorage.del(url);
            continue;
          }
          
          var dateSaved = saved.modified;
          var dateModified = dmInfo[url];
          if (dateModified <= dateSaved) {
            var text = saved.text;
            var skip = false;
            if (G.isMinifiable(url)) {
              if (((minify===true || (typeof minify ==='undefined' && def)) && !G.isMinified(url, text)) || 
                  ((minify===false || (typeof minify ==='undefined' && !def)) && G.isMinified(url, text))) {
                // wrong minification mode on this file
                skip = true;
              }
            }
            
            if (!skip) {
              G.modules[url] = text;
              continue;
            }
          }
          else {
            if (!info)
              G.log('init', 'error', 'no info found for file: ' + url);
              
            G.localStorage.del(url);
          }
        }
        
        pruned.push(url);
      }
    
      return pruned;
    },
    
    loadBundle: function(bundle, callback, async) {
      var pruned = G.pruneBundle(bundle);
      if (!pruned.length) {
        G.log('init', 'cache', 'bundle was cached', bundle);
        if (callback) 
          callback();
        
        return;
        
      }
      
      data = {modules: pruned.join(',')};
      if (typeof G.minify !== 'undefined')
        data.minify = G.minify;
      
      var useWorker = G.hasWebWorkers && async;
      var getBundleReq = {
        url: G.serverName + "/backboneFiles", 
        method: 'POST',
        data: data
      };
      
      var complete = function(resp) {
        if (useWorker) {
          if (resp.status == 304)
            callback && callback();
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
      
        if (hasLocalStorage) {
          setTimeout(function() {
            G.asyncLoop(newModules, function(url, module) {
              G.localStorage.put(url, G.prepForStorage(module, G.serverTime));
            }, 100, this);
//            for (var url in newModules) {
//              G.localStorage.putAsync(100, url, G.prepForStorage(newModules[url], G.serverTime), false, true); // don't force, but do async
//              G.localStorage.put(url, G.prepForStorage(newModules[url], G.serverTime), false); // don't force
//            }
          }, 100);
        }
        
        if (callback) callback();
      }

      if (useWorker) {
        var xhrWorker = G.getXhrWorker();
        xhrWorker.onmessage = function(event) {
          G.log(G.TAG, 'xhr', 'fetched', getBundleReq.data.modules);
          complete(event.data);
        };
        
        xhrWorker.onerror = function(err) {
          G.log(G.TAG, 'error', JSON.stringify(err));
        };
        
        getBundleReq.type = 'JSON';
        xhrWorker.postMessage(getBundleReq);  
      }
      else {      
        getBundleReq.success = complete; 
        G.sendXhr(getBundleReq);
      }        
    },
    
    prepForStorage: function(text, date) {
      return JSON.stringify({modified: date, text: text});
    },
    
    setCookie: function(name, value, exdays) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + exdays);
      var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
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
//      if (context) {
//        if (script.attachEvent && !(script.attachEvent.toString && script.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
//          script.attachEvent('onreadystatechange', context.onScriptLoad);
//        } else {
//          script.addEventListener('load', context.onScriptLoad, false);
//          script.addEventListener('error', context.onScriptError, false);
//        }
//      }

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
//      script.src = src;
//      var root = doc.documentElement;      
//      root.insertBefore(script, root.firstChild);
//      root.removeChild(script);
//      callback();
    }
        

//    ,
//    loadModule: function(type, name, caller, args) {
//      var self = this;
//      var path = '';
//      switch (type) {
//      case 'view':
//        path = 'views/';
//        break;
//      case 'resource':
//        path = 'resource/';
//        break;
//      case 'lib':
//        path = 'lib/';
//        break;
//      }
//      
//      if (typeof (eval(name)) === 'undefined') {
//        require(['' + path + name], function(v) {
//          eval(name + '=v;');
//          caller.apply(self, args);
//        });
//      }
//    }
//
//    ,
//    flattenObject: function(ob) {
//      var toReturn = {};
//      
//      for (var i in ob) {
//        if (!ob.hasOwnProperty(i)) 
//          continue;
//        
//        if ((typeof ob[i]) == 'object') {
//          var flatObject = G.flattenObject(ob[i]);
//          for (var x in flatObject) {
//            if (!flatObject.hasOwnProperty(x)) 
//              continue;
//            
//            toReturn[i + '.' + x] = flatObject[x];
//          }
//        } else {
//          toReturn[i] = ob[i];
//        }
//      }
//      
//      return toReturn;
//    }
  }; 
  
  for (var prop in moreG) {
    G[prop] = moreG[prop];
  }
  
  
  G.apiUrl = G.serverName + '/api/v1/';
  
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
//          G.localStorage.nukeScripts();
        }
        
        break;
      }
    }
  }
  
//  G.minify = G.getCookie(mCookie) !== 'n';
  G.minify = minified === 'y' ? true : minified === 'n' ? false : undefined;
  // END minify
  
  require.config({
    paths: {
//      cache: 'lib/requirejs.cache',
//      mobiscroll: 'lib/mobiscroll-core',
//      mobiscrollDate: 'lib/mobiscroll-datetime',
//      mobiscrollJQM: 'lib/mobiscroll-jqm',
//      mobiscrollJQMW: 'lib/mobiscroll-jqmwidget',
      mobiscroll: 'lib/mobiscroll-datetime-min',
      jquery: 'lib/jquery',
      jqmConfig: 'jqm-config',
      jqueryMobile: 'lib/jquery.mobile-1.3.0-beta.1',
//      validator: 'lib/jquery.validate',
      underscore: 'lib/underscore',
      backbone: 'lib/backbone',
      indexedDBShim: 'lib/IndexedDBShim',
      jqueryIndexedDB: 'lib/jquery-indexeddb',
      queryIndexedDB: 'lib/queryIndexedDB',
//      priorityQueue: 'lib/priorityQueue',
      leaflet: 'lib/leaflet',
      leafletMarkerCluster: 'lib/leaflet.markercluster',
      jqueryImagesloaded: 'lib/jquery.imagesloaded',
      jqueryMasonry: 'lib/jquery.masonry'
    },
    shim: {
      leafletMarkerCluster: ['leaflet'],
      jqueryMasonry: ['jquery'],
//      validator: ['jquery'],
      jqueryImagesloaded: ['jquery'],
      mobiscroll: ['jquery', '../styles/mobiscroll.datetime.min.css'],
      jqueryIndexedDB: ['jquery', 'indexedDBShim'],
      indexedDBShim: ['taskQueue']
//          ,
//      mobiscrollDate: ['jquery', 'jqueryMobile', 'mobiscroll'],
//      mobiscrollJQM: ['jquery', 'jqueryMobile', 'mobiscroll'],
//      mobiscrollJQMW: ['jquery', 'jqueryMobile', 'mobiscroll']
//      mobiscroll: ['jquery', 'mobiscroll.core', 'mobiscroll.jqm', 'mobiscroll.jqmwidget', '../styles/mobiscroll.core.css', '../styles/mobiscroll.jqm.css']
//      mobiscroll: ['jquery', '../styles/mobiscroll.datetime.min.css']
    }
  });

   
//   var viewBundle = [
//     'views/Header', 
//     'views/BackButton', 
//     'views/LoginButtons', 
//     'views/AroundMeButton', 
//     'views/ResourceView', 
//     'views/ResourceImageView', 
//     'views/ViewPage' 
//   ];
//      
//   var listBundle = [
//     'views/ResourceListItemView', 
//     'views/ResourceListView', 
//     'views/Header', 
//     'views/BackButton', 
//     'views/AddButton', 
//     'views/LoginButtons', 
//     'views/AroundMeButton', 
//     'views/MapItButton', 
//     'views/ListPage' 
//   ];

   return Lablz;
});

require(['globals'], function(G) {
  G.startedTask("loading pre-bundle");
  G.files = {};
  for (var when in G.bundles) {
    var bundle = G.bundles[when];
    for (var type in bundle) {
      var bt = bundle[type];
      for (var i = 0; i < bt.length; i++) {
        var info = bt[i];
        for (var prop in info) {
          var val = info[prop];
          G.files[prop] = val;
        }
      }
    }
  }
  
//  G.files = G.flattenObject(G.bundles);
  G.loadBundle(G.bundles.pre, function() {
    G.finishedTask("loading pre-bundle");
    var css = G.bundles.pre.css.slice();
    for (var i = 0; i < css.length; i++) {
      var cssObj = css[i];
      for (var name in cssObj) {
//        css[i] = 'cache!' + name;
        css[i] = name;
        break;
      }
    }
    
    G.startedTask("loading modules");
    require(['jquery', 'jqmConfig', 'app'].concat(css), function($, jqmConfig, App) {
      G.finishedTask("loading modules");
      G.browser = $.browser;
      App.initialize();
      setTimeout(function() {
        G.startedTask('loading post-bundle');
        G.loadBundle(G.bundles.post, function() {
          G.finishedTask('loading post-bundle');
        }, true);
      }, 100);
    });
  });
})
