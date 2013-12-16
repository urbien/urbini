define('underscoreMixins', ['_underscore'], function(_) {
  var ArrayProto = Array.prototype,
      concat = ArrayProto.concat,
      slice = ArrayProto.slice,
      indexOf = ArrayProto.indexOf,
      __htmlCommentRegex = /\<![ \r\n\t]*--(([^\-]|[\r\n]|-[^\-])*)--[ \r\n\t]*\>/,
      __htmlCommentRegexGM = /\<![ \r\n\t]*--(([^\-]|[\r\n]|-[^\-])*)--[ \r\n\t]*\>/gm,
      __jsCommentRegex = /(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/,
      __jsCommentRegexGM = /(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm;


  String.prototype.toTitleCase = function() {
    return this.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
  }

  String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
  };

  String.prototype.trim = function(){
    return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
  };
  
  String.prototype.startsWith = function(str) {
//    return (this.match("^"+str)==str);
    return this.slice(0, str.length) === str;
  };
  
  String.prototype.camelize = function(capitalFirst) {
    return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return capitalFirst || index != 0 ? letter.toUpperCase() : letter.toLowerCase();
    }).replace(/\s+/g, '');
  };

  String.prototype.splitAndTrim = function(delimiter) {
    return _.map(this.split(delimiter), function(str) {
      return str.replace(/\s/g, '');
    });
  };
  
  String.prototype.uncamelize = function(capitalFirst) {
    var str = this.replace(/[A-Z]/g, ' $&').toLowerCase();
    return capitalFirst ? str.slice(0, 1).toUpperCase() + str.slice(1) : str; 
  };

  String.prototype.capitalizeFirst = function() {
    return this.slice(0, 1).toUpperCase() + this.slice(1);
  };
  
  String.prototype.splitCamelCase = function(capitalFirst) {
      // insert a space before all caps
    var split = this.replace(/([A-Z])/g, ' $1');
      // uppercase the first character
    return capitalFirst ? split.replace(/^./, function(str){ return str.toUpperCase(); }) : split;
  };

  String.prototype.endsWith = function(str) {
    return this.slice(this.length - str.length) === str;
  };

  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
  
  _.extend(Array, {
    copy: function (from, to) {
      var i = from.length;
      while (i--) {
        to[i] = from[i];
      }
    },
    prepend: function(arr, more) {
      var orgLen = arr.length,
          addLen = more.length;
          
      arr.length = orgLen + addLen;
      while (orgLen--) {
        arr[orgLen + addLen] = arr[orgLen];
      }
      
      while (addLen--) {
        arr[addLen] = more[addLen];
      }    
    },
    remove: function(array /* items */) {
      for (var i = 1, len = arguments.length; i < len; i++) {
        var arg = arguments[i];
        if (_.isArray(arg)) {
          for (var j = 0, argLen = arg.length; j < argLen; j++) {
            Array.remove(array, arg[j]);
          }
        }
        else {
          var idx = indexOf.call(array, arg);
          if (~idx) {
            Array.removeFromTo(array, idx, idx + 1);
//            for (var j = idx, arrLen = array.length - 1; j < arrLen; j++) {
//              array[j] = array[j + 1];
//            }
//            
//            array.length = arrLen;
          }
        }
      }
      
      return array;
    },

//    removeFromTo: function(array, from, to) {
//      var rest = array.slice((to || from) + 1 || array.length);
//      array.length = from < 0 ? array.length + from : from;
//      return array.push.apply(array, rest);
//    },

    removeFromTo: function(array, fromIdx, toIdx) {
      var howMany = toIdx - fromIdx;
      for (var i = fromIdx, len = array.length - howMany; i < len; i++) {
        array[i] = array[toIdx++];
      }

      array.length = len;
      return array;
    },

    last: function(array) {
      return Array.peek(array);
    },

    peek: function(array) {
      return array[array.length - 1];
    }    
  });  

  
  function index(obj, i) {
    return obj[i];
  };

  function _leaf(obj, path, separator) {
    return path.split(separator).reduce(index, obj);
  }

  _.mixin({
//    partial: function(fn) {
////      var args = slice.call(arguments, 1);
////      return function() {
////        return fn.apply(null, args.concat(_.toArray(arguments)));
////      };
//      var args = slice.call(arguments, 1);
//      args.unshift(null);
//      return fn.bind.apply(fn, args);
//    },
//    
//    partialWith: function(fn, context) {
////      var args = slice.call(arguments, 2);
////      return function() {
////        return fn.apply(context, args.concat(_.toArray(arguments)));
////      };
//    },
    
    negate: function(fn, context) {
      return function() {
        return !fn.apply(context || this, arguments);
      }
    },
    
    isPromise: function(obj) {
      return obj && typeof obj.then == 'function';
    },
    
    index: index,
    setProperty: function(obj, prop, val) {
      obj[prop] = val;
    },
    
    deepExtend: function(obj) {
      var parentRE = /#{\s*?_\s*?}/,
          slice = Array.prototype.slice;
     
      for (var i = 1, num = arguments.length; i < num; i++) {
        var source = arguments[i];
        for (var prop in source) {
          if (_.has(source, prop)) {
            if (_.isUndefined(obj[prop]) || _.isFunction(obj[prop]) || _.isNull(source[prop])) {
              obj[prop] = _.clone(source[prop]);
            }
            else if (_.isString(source[prop]) && parentRE.test(source[prop])) {
              if (_.isString(obj[prop])) {
                obj[prop] = source[prop].replace(parentRE, obj[prop]);
              }
            }
            else if (_.isArray(obj[prop]) || _.isArray(source[prop])){
              if (!_.isArray(obj[prop]) || !_.isArray(source[prop])){
                throw 'Error: Trying to combine an array with a non-array (' + prop + ')';
              } else {
                obj[prop] = _.reject(_.deepExtend(obj[prop], source[prop]), function (item) { return _.isNull(item);});
              }
            }
            else if (_.isObject(obj[prop]) || _.isObject(source[prop])){
              if (!_.isObject(obj[prop]) || !_.isObject(source[prop])){
                throw 'Error: Trying to combine an object with a non-object (' + prop + ')';
              } else {
                obj[prop] = _.deepExtend(obj[prop], source[prop]);
              }
            } else {
              obj[prop] = source[prop];
            }
          }
        }
      }
      
      return obj;
    },
    
    leaf: function(obj, path, separator) {
      if (typeof obj == 'undefined' || !obj)
        return undefined;

      separator = separator || '.'; 
      var lastSep = path.lastIndexOf(separator),
          parent,
          child;
      
      if (lastSep == -1)
        return obj[path];
      else {
        try {
          parent = _leaf(obj, path.slice(0, lastSep), separator);
          child = parent[path.slice(lastSep + separator.length)];
        } catch (err) {
          return undefined;
        }        
      }
      
      if (typeof child == 'function')
        return child.bind(parent);
      else
        return child;
    },
    
//    deepExtend: function(obj) {
//      _.each(slice.call(arguments, 1), function(source) {
//        for (var prop in source) {
//          if (obj[prop])
//            _.deepExtend(obj[prop], source[prop]);
//          else
//            obj[prop] = source[prop] || obj[prop];
//        }
//      });
//    },
   
    getObjectType: function(o) {
      return Object.prototype.toString.call(o);
    },

//    deepExtend: function(obj, source) {
////      _.each(slice.call(arguments, 1), function(source) {
//      for (var i = 1, num = arguments.length; i < num; i++) {
//        var source = arguments[i];
//        for (var p in source) {
//          var val = source[p], 
//              org = obj[p];
//          
//          if (_.has(source, p) && !_.has(obj, p)) {
//            obj[p] = val && _.getObjectType(val) == '[object Object]' ? _.deepExtend({}, val) : val;
//            continue;
//          }
//            
//          if (_.isObject(val) && _.isObject(org))
//            _.deepExtend(org, val);
//          else
//            obj[p] = val;
//        }
//        
//        return obj;
//      }
////      });
//    },

    validatePhone: function(phone) {
      return /^(\+?\d{0,3})\s*((\(\d{3}\)|\d{3})\s*)?\d{3}(-{0,1}|\s{0,1})\d{2}(-{0,1}|\s{0,1})\d{2}$/.test(phone);
    },
    
    validateZip: function(zip) {
      return /^\d{5}|\d{5}-\d{4}$/.test(zip);
    },
    
    validateEmail: function(email) { 
      return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    },
    
    getParamMap: function(str, delimiter) {
      var map = {};
      if (!str)
        return map;
      var qIdx = str.indexOf('?');
      if (qIdx != -1)
        str = str.slice(qIdx + 1);
        
      _.each(str.split(delimiter || "&"), function(nv) {
        nv = nv.split("=");
        if (nv.length == 2)
          map[_.decode(nv[0])] = _.decode(nv[1]);
      });
      
      return map;
    },    
    
    encode: function(str) {
      return encodeURIComponent(str);
    },
    
    decode: function(str) {
      return decodeURIComponent(str.replace(/\+/g, '%20'));
    },

    pushUniq: function(arr) {
      var items = concat.apply([], slice.call(arguments, 1));
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (!_.contains(arr, item))
          arr.push(item);
      }
    },
   
    getFirstProperty: function(obj) {
      for (var name in obj) {
        return name;
      }
    },

    getFirstValue: function(obj) {
      for (var name in obj) {
        return obj[name];
      }
    },
   
    randomString: function(length) {
      var random = (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '');
      return length ? random.slice(0, length) : random;
    },
   
    wipe: function(obj) {
      for (var p in obj) {
        if (obj.hasOwnProperty(p))
          delete obj[p];
      }
    },

    clearProperties: function(obj) {
      for (var p in obj) {
        if (obj.hasOwnProperty(p))
          obj[p] = undefined;
      }
    },

    /** 
     * From http://eloquentjavascript.net/chapter6.html
     */
    "<": function(a, b){return a < b;},
    ">": function(a, b){return a > b;},
    "<=": function(a, b){return a <= b;},
    ">=": function(a, b){return a >= b;},
    "+": function(a, b){return a + b;},
    "==": function(a, b){return a == b;},
    "!=": function(a, b){return a != b;},
    "===": function(a, b){return a === b;},
    "!": function(a){return !a;},
    "!=": function(a, b){return a != b;},
    "!==": function(a, b){return a !== b;},
      /* and so on */  
    
    getHTMLComments: function(str) {
      var matches = str.match(__htmlCommentRegex);
      return matches && matches.slice(1);
    },
    removeHTMLComments: function(str) {
      return str.replace(__htmlCommentRegexGM, '');
    },

    getJSComments: function(str) {
      var matches = str.match(__jsCommentRegex);
      return matches && matches.slice(1);
    },

    removeJSComments: function(str) {
      return str.replace(__jsCommentRegexGM, '');
    },

    htmlEscape: function(str) {
      return String(str)
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
    },
  
    htmlUnescape: function(value){
        return String(value)
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    },
    
    /**
     * extends to[methodName] to first call from[methodName] and only then itself
     */
    extendMethod: function(to, from, methodName) {
      if (!_.isUndefined(from[methodName])) {
        var original = to[methodName];
        if (!original)
          to[methodName] = from[methodName];
        else {
          to[methodName] = function() {
            var originalReturn = original.apply(this, arguments);
            from[methodName].apply(this, arguments);
            return originalReturn;
          };
        }
      }
    },
  
    now: window.performance ? window.performance.now.bind(window.performance) : Date.now.bind(Date)
  });
  
  return _;
});