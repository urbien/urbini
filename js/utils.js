define([
  'cache!underscore', 
  'cache!templates' 
], function(_, Templates) {
/**
 * for functions that have a parameter "base," base should have serverName, sqlUri, shortNameToModel. If base is not passed in, window.Lablz will be used 
 **/

  String.prototype.trim = function(){
    return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
  };
  
  String.prototype.startsWith = function(str) {
    return (this.match("^"+str)==str);
  };
  
  String.prototype.toCamelCase = function(str) {
    return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  };
  
  String.prototype.endsWith = function(str) {
    return (this.match(str+"$")==str);
  };
  
  var U = {
    makeProp: function(prop, val) {
      var cc = prop.colorCoding;
      if (cc) {
        cc = U.getColorCoding(cc, val);
        if (cc) {
          if (cc.startsWith("icons"))
            val = "<img src=\"" + cc + "\" border=0>&#160;" + val;
          else
            val = "<span style='color:" + cc + "'>" + val + "</span>";
        }
      }
      
      var propTemplate = Templates.getPropTemplate(prop);
      val = val.displayName ? val : {value: val};
      return {name: prop.label || prop.displayName, value: _.template(Templates.get(propTemplate))(val)};
    },
    
    makePropEdit: function(prop, val) {
      var propTemplate = Templates.getPropTemplate(prop, true);
      val = val.displayName ? val : {value: val};
      val.shortName = prop.displayName.toCamelCase();
      return {name: prop.displayName, value: _.template(Templates.get(propTemplate))(val)};
    },
    
    isPropVisible: function(res, prop) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel)
        return false;
      
      var userRole = Lablz.currentUser ? Lablz.currentUser.role || 'contact' : 'guest';
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      if (ar) {
        if (userRole == 'guest')
          return false;
        
        var roles = ar.split(",");
        for (var i = 0; i < roles.length; i++) {
          var r = roles[i].trim();
          if (r == 'admin')
            return false;
          else if (r == 'siteOwner')
            return userRole == 'siteOwner';
          else {
            // TODO: implement this
            
            return false;
          }
        }
      }
      
      return true;
    },
    
    getFirstUppercaseCharIdx: function(str) {
    	for (var i = 0; i < str.length; i++) {
    		var c = str.charAt(i);
    		if (c.search(/^[a-z]+$/i) == 0 && c == c.toUpperCase())
    			return i;
    	}
    	
    	return -1;
    },
    
    getPrimaryKeys: function(model) {
      var keys = [];
      for (var p in model.myProperties) {
        if (_.has(model.myProperties[p], 'primary'))
          keys.push(p);
      }
      
      return keys;
    //  return _.filter(model.properties, 
    //      function(prop) {
    //        prop.annotations && _.contains(prop.annotations, '@k');
    //      });
    },
    
    getCloneOf: function(meta, cloneOf) {
      var keys = [];
        for (var p in meta) {
        if (_.has(meta[p], "cloneOf")  &&  meta[p]['cloneOf'].indexOf(cloneOf) != -1) {
          keys.push(p);
        }
      }
      
      return keys;
    },
    
    getLongUri: function(uri, hint) {
      var type = hint && hint.type;
      var pk = hint && hint.primaryKeys;
      var snm = hint && hint.shortNameToModel;
      var serverName = Lablz.serverName;
      var sqlUri = Lablz.sqlUri;
      if (uri.indexOf('http') == 0) {
        // uri is either already of the right form: http://urbien.com/sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000 or of form http://www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
        if (uri.indexOf('?') == -1) // type uri
          return uri;
        
        if (uri.indexOf(serverName + "/" + sqlUri) == 0)
          return uri;
        
        type = typeof type == 'undefined' ? U.getTypeUri(uri, hint) : type;
        return uri.indexOf("http://www.hudsonfog.com") == -1 ? uri : serverName + "/" + sqlUri + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
      }
      else if (uri.indexOf('/') == -1) {
        // uri is of form Tree?id=32000 or just Tree
        type = typeof type == 'undefined' ? U.getTypeUri(uri, hint) : type;
        if (!type)
          return null;
        
        var qIdx = uri.indexOf('?');
        return U.getLongUri(type + (qIdx == -1 ? '' : uri.slice(qIdx)), {type: type});
      }
      else if (uri.indexOf('sql') == 0) {
        // uri is of form sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
        return serverName + "/" + uri;
      }
      else if (uri.charAt(0).toUpperCase() == uri.charAt(0)) {
        // uri is of form Tree/32000
        var typeName = U.getType(uri);
        type = U.getTypeUri(typeName, hint);
        if (!type)
          return null;
        
        var sIdx = uri.indexOf("/");
        var longUri = uri.slice(0, sIdx) + "?";
        var primaryKeys = hint.primaryKeys || U.getPrimaryKeys(snm && snm[typeName]);
//        var model = snm[typeName];
//        if (!model)
//          return uri;
//        
//        var primaryKeys = U.getPrimaryKeys(model);
        if (!primaryKeys  ||  primaryKeys.length == 0)
          longUri += "id=" + encodeURIComponent(uri.slice(sIdx + 1));
        else {
          var vals = uri.slice(sIdx + 1).split('/');
          if (vals.length != primaryKeys.length)
            throw new Error('bad uri "' + uri + '" for type "' + type + '"');
          
          for (var i = 0; i < primaryKeys.length; i++) {
            longUri += primaryKeys[i] + "=" + vals[i]; // shortUri primary keys are already encoded
          }      
        }
        
        return U.getLongUri(longUri, {type: type});
      }
      else 
        return uri;
    },
    
    validateEmail: function(email) { 
      return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    },
    
    getTypeUri: function(typeName, hint) {
      return hint.type || hint.shortNameToModel[typeName] && hint.shortNameToModel[typeName].type;
    },
    
    getType: function(uri) {
      var qIdx = uri.indexOf("?");
      if (qIdx != -1) {
        if (uri.indexOf('http://') == 0)
          return uri.slice(uri.lastIndexOf("/", qIdx) + 1, qIdx);
        else
          return uri.slice(0, qIdx);
      }
      
      var idx = U.getFirstUppercaseCharIdx(uri);
      if (idx == -1)
        return null;
        
      var end = uri.slice(idx).search(/[^a-zA-Z]/);
      return end == -1 ? uri.slice(idx) : uri.slice(idx, idx + end);
    },
    
    getClassName: function(type) {
      var sIdx = type.lastIndexOf("/");
      return sIdx == -1 ? type : type.slice(sIdx + 1);
    },
    
    getShortUri: function(uri, model) {
      if (model.properties._shortUri == 'unsupported')
        return uri;
        
      var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
      var nameAndId = uri.match(regex);
      return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
    },
    
    isA: function(model, interfaceName) {
      return _.contains(model.interfaces, interfaceName);
    },
    
    getPackagePath: function(type) {
      if (type == 'Resource' || type.endsWith('#Resource'))
        return 'packages';
      
      var start = "http://www.";
      var path = type.startsWith(start) ? type.slice(start.length, type.lastIndexOf("/")) : !type.startsWith('hudsonfog') ? 'hudsonfog/voc/' + type : type;
      path = path.replace(".com", "");
      path = path.replace(/\//g, '.');
      var lastDIdx = path.lastIndexOf('.');
      var c = path.charAt(lastDIdx + 1);
      if (c == c.toUpperCase())
        path = path.slice(0, lastDIdx);
        
      return 'packages.' + path;
    },
    
    addPackage: function(packages, path) {
      path = path.split(/\./);
      var current = packages;
      path = path[0] == 'packages' ? path.slice(1) : path;
      for (var i = 0; i < path.length; i++) {
        if (!_.has(current, path[i])) {
          var pkg = {};
          current[path[i]] = pkg;
          current = pkg;
        }
        else
          current = current[path[i]];
      }
      
      return current;
    },
    
    getObjectType: function(o) {
      return Object.prototype.toString.call(o);
    },
    
    getColorCoding: function(cc, val) {
    //  getting the color for value. Sample colorCoding annotation: @colorCoding("0-2000 #FF0054; 2000-6000 #c8fd6a; 6001-1000000 #00cc64")
      val = val.replace(',', '');
      var v = parseFloat(val);
      cc = cc.split(';');
      for (var i = 0; i < cc.length; i++) {
        var r2c = cc[i].trim();
        r2c = r2c.split(/[ ]/);
        var r = r2c[0].split(/[-]/);
        r[1] = parseFloat(r[1]);
        if (v > r[1])
          continue;
        
        if (v > parseFloat(r[0]))
          return r2c[1];
      }
      
      return null;
    },
    
    getGridCols: function(model) {
      var m = model;
      var mConstructor = m.constructor;
      var cols = mConstructor.gridCols;
      cols = cols && cols.split(',');
      var resourceLink;
      var rows = {};
      var i = 0;
      if (cols) {
        _.each(cols, function (col) {
          col = col.trim();
          var prop = mConstructor.properties[col];
          var val = m.get(col);
          if (!val)
            return;
          
          var nameVal = U.makeProp(prop, val);
          rows[nameVal.name] = {value: nameVal.value};
          rows[nameVal.name].idx = i++;
          rows[nameVal.name].propertyName = col;
          if (prop.resourceLink)
            rows[nameVal.name].resourceLink = true;
    //        resourceLink = nameVal.value;
    //      else
        });
      }  
      
      return rows;
    },
    
    /**
     * to be used for model constructors, not instances
     */
    
    defaultModelProps: ['__super__', 'prototype', 'extend'],
    toJSON: function(obj) {
      var staticProps = {};
      for (var prop in obj) {
        if (typeof obj[prop] != 'function' && _.has(obj, prop) && !_.contains(U.defaultModelProps, prop)) {
          var o = obj[prop];
          staticProps[prop] = typeof o == 'object' ? U.toJSON(o) : o;
        }
      }
      
      return staticProps;
    },
    
    wrap: function(object, method, wrapper) {
      var fn = object[method];
      return object[method] = function() {
        return wrapper.apply(this, [ fn.bind(this) ].concat(Array.prototype.slice.call(arguments)));
      };
    },
    
    /**
     * Array that stores only unique elements
     */
    UArray: function() {
    //  this.handlers = {};
    //  this.on = function(method, handler) {
    //    this.handlers[method] = this.handlers[method] || [];
    //    this.handlers[method].push(handler);
    //  };
    //  this.removeHandler = function(method, handler) {
    //    return this.handlers[method] && this.handlers[method].remove(handler);
    //  };
    //  this.handler = function(method) { 
    //    if (this.handlers[method] && this.handlers[method].length) {
    //      _.each(this.handlers[method], function(m) {m()});
    //    }
    //  };
    },
    
    union: function(o1, o2) {
      var type1 = U.getObjectType(o1);
      var type2 = U.getObjectType(o2);
        
      var c = type1.indexOf('Array') == -1 && !(o1 instanceof U.UArray) ? [c] : o1.slice();    
      if (type2.indexOf('Array') == -1 && !(o2 instanceof U.UArray))
        return c.push(o2);
      
      var self = this;
      _.each(o2, function(i) {c.push(i);});
      return c;
    },   

    endsWith: function(string, pattern) {
      var d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    },
    
    //U.toQueryString: function(queryMap) {
    //  var qStr = '';
    //  _.forEach(queryMap, function(val, key) { // yes, it's backwards, not function(key, val), underscore does it like this for some reason
    //    qStr += key + '=' + encodeURIComponent(val) + '&';
    //  });
    //  
    //  return qStr.slice(0, qStr.length - 1);
    //};
    
    replaceParam: function(url, name, value, sort) {
      if (!url)
        return name + '=' + encodeURIComponent(value);
      
      url = url.split('?');
      var qs = url.length > 1 ? url[1] : url[0];
      var q = U.getQueryParams(qs);
      q[name] = value;
      q = sort ? U.getQueryString(q, sort) : $.param(q);
      return url.length == 1 ? q : [url[0], q].join('?');
    },
    
    getQueryParams: function(url) {
      return U.getParamMap(url || window.location.href);
    },
    
    getHashParams: function() {
      var h = window.location.hash;
      if (!h) 
        return {};
      
      var chopIdx = h.indexOf('?');
      chopIdx = chopIdx == -1 ? 1 : chopIdx + 1;
        
      return h ? U.getParamMap(h.slice(chopIdx)) : {};
    },
    
    getParamMap: function(str, delimiter) {
      var qIdx = str.indexOf('?');
      if (qIdx != -1)
        str = str.slice(qIdx + 1);
        
      var map = {};
      _.each(str.split(delimiter || "&"), function(nv) {
        nv = nv.split("=");
        map[U.decode(nv[0])] = U.decode(nv[1]);
      });
      
      return map;
    },
    
    getPropertiesWith: function(list, annotation) {
      return _.filter(list, function(item) {
          return item[annotation] ? item : null;
        });
    },
    
    /// String prototype extensions
    
    getQueryString: function(paramMap, sort) {
      if (!sort)
        return $.param(paramMap);
      
      var keys = [];
      for (var i in paramMap) {
        if (paramMap.hasOwnProperty(i)) {
          keys.push(i);
        }
      }
      
      var qs = '';
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        keys[i] = keys[i] + '=' + encodeURIComponent(paramMap[keys[i]]);
      }
      
      return keys.join('&');
    },
    
    getFormattedDate: function(time) {
      var date = new Date(parseFloat(time));
      //(time || "").replace(/-/g,"/").replace(/[TZ]/g," "));
      var diff = (((new Date()).getTime() - date.getTime()) / 1000);
      var day_diff = Math.floor(diff / 86400);
          
      if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
        return;
          
      return day_diff == 0 && (
        diff < 60 && "just now" ||
        diff < 120 && "a minute ago" ||
        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
        diff < 7200 && "an hour ago" ||
        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
        day_diff == 1 && "Yesterday" ||
        day_diff < 7 && day_diff + " days ago" ||
        day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
    },
    
    decode: function(str) {
      return decodeURIComponent(str).replace(/\+/g, ' ');
    },
    
    toHTMLElement: function(html) {
      return $(html)[0];
    },
    
    getShortName: function(uri) {
      return uri.slice(uri.lastIndexOf('/') + 1); // if lastIndexOf is -1, return original string
    },
    
    addToFrag: function(frag, html) {
      frag.appendChild(U.toHTMLElement(html));
    },
    
    getUris: function(model) {
      if (model instanceof Backbone.Collection)
        return _.map(model.models, function(model) {return model.get('_uri')});
      else
        return [model.get('_uri')];
    },
    
    hasImages: function(models) {
      var m = models[0];
      var meta = m.__proto__.constructor.properties;
      var cloneOf;
      var hasImgs = this.isA(m.constructor, 'ImageResource')  &&  meta != null  &&  (cloneOf = U.getCloneOf(meta, 'ImageResource.mediumImage')).length != 0;
      if (!hasImgs)
        return false;
      hasImgs = false;
      for (var i = 0; !hasImgs  &&  i < models.length; i++) {
        var m = models[i];
        if (m.get(cloneOf))
          hasImgs = true;
      }
      return hasImgs;
    },
    
    deepExtend: function(obj) {
      _.each(Array.prototype.slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop])
            U.deepExtend(obj[prop], source[prop]);
          else
            obj[prop] = source[prop] || obj[prop];
        }
      });
    },
    /**
     * given obj and path x.y.z, will return obj.x.y.z; 
     */
    leaf: function(obj, path, separator) {
      if (typeof obj == 'undefined' || !obj)
        return null; 
     
      separator = separator || '.';
      var dIdx = path.indexOf(separator);
      return dIdx == -1 ? obj[path] : U.leaf(obj[path.slice(0, dIdx)], path.slice(dIdx + separator.length), separator);
    },
    
    isAssignableFrom: function(model, className, type2Model) {
      if (U.isA(model, className))
        return true;
//      var type2Model = Lablz.typeToModel;
      var m = model;
      while (true) {
        var subClassOf = m.subClassOf;
        if (!subClassOf.startsWith(Lablz.DEFAULT_VOC_BASE))
          subClassOf = Lablz.DEFAULT_VOC_BASE + subClassOf;
        
        if (m.shortName == className  ||  m.type == className)
          return true;
        if (m.subClassOf == 'Resource')
          return false;
        m = type2Model[subClassOf];
      }
      return false;
    }

  //,
  //  getGMTDate: function(time) {
  //  var d = time ? new Date(time) : new Date();
  //  d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
  //  return d;
  ////  var d = (time && new Date(time)) || new Date();
  ////  return d.getTime() + d.getTimezoneOffset() * 60000;
  //}
    
  };
  
  U.UArray.prototype.length = 0;
  (function() {
    var methods = ['push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join', 'clone', 'concat'];
    for (var i = 0; i < methods.length; i++) { 
      (function(name) {
        U.UArray.prototype[name] = function() {
          return Array.prototype[name].apply(this, arguments);
        };
      })(methods[i]);
    }
  })();
  
  U.wrap(U.UArray.prototype, 'concat',
    function(original, item) {
      var type = Object.prototype.toString.call(item);
      if (type.indexOf('Array') == -1)
        this.push(item);
      else {
        var self = this;
        _.each(item, function(i) {self.push(i);});
      }
    }
  );
  
  U.wrap(U.UArray.prototype, 'push',
    function(original, item) {
  //    try {
        if (_.contains(this, item))
          return this;
        else
          return original(item);
  //    } finally {
  //      this.handler('push');
  //    }
    }
  );

  Lablz.U = U;
  return U;
});