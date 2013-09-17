define('underscoreMixins', ['_underscore'], function(_) {
  var ArrayProto = Array.prototype,
      concat = ArrayProto.concat,
      slice = ArrayProto.slice;

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
    remove: function(array /* items */) {
      var items = concat.apply(ArrayProto, slice.call(arguments, 1));
      
      for (var i in items) {
        var item = items[i],
            idx = array.indexOf(item);
        
        if (idx != -1)
          array.splice(idx, 1);
      }
      
      return array;
    },

    // courtesy of John Resig
    removeFromTo: function(array, from, to) {
      var rest = array.slice((to || from) + 1 || array.length);
      array.length = from < 0 ? array.length + from : from;
      return array.push.apply(array, rest);
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
    partial: function(fn) {
      var args = slice.call(arguments, 1);
      return function() {
        return fn.apply(null, args.concat(_.toArray(arguments)));
      };
    },
    
    partialWith: function(fn, context) {
      var args = slice.call(arguments, 2);
      return function() {
        return fn.apply(context, args.concat(_.toArray(arguments)));
      };
    },
    
    negate: function(fn, context) {
      return function() {
        return !fn.apply(context || this, arguments);
      }
    },
    
    isPromise: function(obj) {
      return obj && typeof obj.then == 'function';
    },
    
    leaf: function(obj, path, separator) {
      if (typeof obj == 'undefined' || !obj)
        return undefined;

      separator = separator || '.'; 
      var lastSep = path.lastIndexOf(separator),
          parent,
          child;
      
      if (lastSep == -1)
        return obj;
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
   
    deepExtend: function(obj, source) {
      _.each(slice.call(arguments, 1), function(source) {
        for (var p in source) {
          if (_.has(source, p) && !_.has(obj, p)) {
            obj[p] = source[p];
            continue;
          }
            
          var val = source[p], 
              org = obj[p];
          
          if (_.isObject(val) && _.isObject(org))
            _.deepExtend(org, val);
          else
            obj[p] = val;          
        }
        
        return obj;
      });
    },

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
      return decodeURIComponent(str).replace(/\+/g, ' ');
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
   
    randomString: function() {
      return (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '');
    },
   
    wipe: function(obj) {
      for (var p in obj) {
        if (_.has(obj, p))
          delete obj[p];
      }
    },
    
    /** 
     * From http://eloquentjavascript.net/chapter6.html
     */
    "+": function(a, b){return a + b;},
    "==": function(a, b){return a == b;},
    "===": function(a, b){return a === b;},
    "!": function(a){return !a;},
    "!==": function(a, b){return a !== b;}
      /* and so on */  
  });
  
  return _;
});