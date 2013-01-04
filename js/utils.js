define([
  'globals',
  'cache!underscore',
  'cache!templates'
], function(G, _, Templates) {
  var ArrayProto = Array.prototype;
  var slice = ArrayProto.slice;
  String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
  }

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
  // extends jQuery to check if selected collection is empty or not
  $.fn.exist = function(){
    return this.length > 0 ? this : false;
  };

  var U = {
    TAG: 'Utils',
    isPropVisible: function(res, prop) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel)
        return false;
      
      var userRole = G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      return ar ? U.isUserInRole(userRole, ar) : true;
    },

    isUserInRole: function(userRole, ar) {
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
      return true;
    },
    isPropEditable: function(res, prop) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.readOnly)
        return false;
      
      var userRole = G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      var isVisible;
      if (ar) {
        isUserInRole = U.isUserInRole(userRole, ar);
        if (!isUserInRole)
          return false;
      }
      ar = prop.allowRolesToEdit;
      return ar ? U.isUserInRole(userRole, ar) : true;
    },
    
//    getSortProps: function(model) {
//      var meta = this.model.__proto__.constructor.properties;
//      meta = meta || this.model.properties;
//      if (!meta)
//        return null;
//      
//      var list = _.toArray(meta);
//      return U.getPropertiesWith(list, "sortAscending");
//    },
//
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
    },
    
    getCloneOf: function(meta, cloneOf) {
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "cloneOf")  &&  meta[p]['cloneOf'] == cloneOf) {
          keys.push(p);
        }
      }
      
      return keys;
    },
    
    getLongUri: function(uri, hint) {
      var type = hint && hint.type;
      var pk = hint && hint.primaryKeys;
      var snm = hint && hint.shortNameToModel;
      var serverName = G.serverName;
      var sqlUri = G.sqlUri;
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
        type = !type || type.indexOf('/') == -1 ? U.getTypeUri(uri, hint) : type;
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
        var typeName = U.getClassName(uri);
        type = U.getTypeUri(typeName, hint);
        if (!type || type == typeName)
          return null;
        
        var sIdx = uri.indexOf("/");
        var longUri = uri.slice(0, sIdx) + "?";
        var primaryKeys = hint.primaryKeys || (snm && snm[typeName] && U.getPrimaryKeys([typeName]));
//        var model = snm[typeName];
//        if (!model)
//          return uri;
//        
//        var primaryKeys = U.getPrimaryKeys(model);
        if (!primaryKeys  ||  primaryKeys.length == 0)
          longUri += "id=" + U.encode(uri.slice(sIdx + 1));
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
      if (typeName.indexOf('/') != -1) {
        var type = typeName.startsWith('http://') ? typeName : G.defaultVocPath + typeName;
        if (type.startsWith(G.sqlUrl))
          type = 'http://' + type.slice(G.sqlUrl.length + 1);
        
        var qIdx = type.indexOf('?');
        return qIdx == -1 ? type : type.slice(0, qIdx);
      }
      else
        return hint.type || hint.shortNameToModel[typeName] && hint.shortNameToModel[typeName].type;
    },
    
    getClassName: function(uri) {
      var qIdx = uri.indexOf("?");
      if (qIdx != -1) {
        if (uri.indexOf('http://') == 0)
          return uri.slice(uri.lastIndexOf("/", qIdx) + 1, qIdx);
        else
          return uri.slice(0, qIdx);
      }
      var slashIdx = uri.lastIndexOf("/");
      if (slashIdx != -1)
        return uri.slice(slashIdx + 1);
      var idx = U.getFirstUppercaseCharIdx(uri);
      if (idx == -1)
        return null;
        
      var end = uri.slice(idx).search(/[^a-zA-Z]/);
      return end == -1 ? uri.slice(idx) : uri.slice(idx, idx + end);
    },
    
//    getClassName: function(type) {
//      var sIdx = type.lastIndexOf("/");
//      return sIdx == -1 ? type : type.slice(sIdx + 1);
//    },
    
    getShortUri: function(uri, model) {
      if (model.myProperties._shortUri == 'unsupported')
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
    
//    wrap: function(object, method, wrapper) {
//      var fn = object[method];
//      return object[method] = function() {
//        return wrapper.apply(this, [ fn.bind(this) ].concat(slice.call(arguments)));
//      };
//    },
    
    /**
     * Array that stores only unique elements
     */
//    UArray: function() {
//    //  this.handlers = {};
//    //  this.on = function(method, handler) {
//    //    this.handlers[method] = this.handlers[method] || [];
//    //    this.handlers[method].push(handler);
//    //  };
//    //  this.removeHandler = function(method, handler) {
//    //    return this.handlers[method] && this.handlers[method].remove(handler);
//    //  };
//    //  this.handler = function(method) { 
//    //    if (this.handlers[method] && this.handlers[method].length) {
//    //      _.each(this.handlers[method], function(m) {m()});
//    //    }
//    //  };
//    },
//    
//    union: function(o1) {
//      var type1 = U.getObjectType(o1);
//      var args = slice.call(arguments, 1);
//      for (var i = 0; i < args.length; i++) {
//        var o2 = args[i];
//        var type2 = U.getObjectType(o2);
//          
//        var c = type1.indexOf('Array') == -1 && !(o1 instanceof U.UArray) ? [c] : o1.slice();    
//        if (type2.indexOf('Array') == -1 && !(o2 instanceof U.UArray))
//          return c.push(o2);
//        
//        var self = this;
//        _.each(o2, function(i) {c.push(i);});
//      }
//      return c;
//    },   

    endsWith: function(string, pattern) {
      var d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    },
    
    //U.toQueryString: function(queryMap) {
    //  var qStr = '';
    //  _.forEach(queryMap, function(val, key) { // yes, it's backwards, not function(key, val), underscore does it like this for some reason
    //    qStr += key + '=' + U.encode(val) + '&';
    //  });
    //  
    //  return qStr.slice(0, qStr.length - 1);
    //};
    
    replaceParam: function(url, name, value, sort) {
      if (!url)
        return name + '=' + U.encode(value);
      
      url = url.split('?');
      var qs = url.length > 1 ? url[1] : url[0];
      var q = U.getQueryParams(qs);
      q[name] = value;
      q = sort ? U.getQueryString(q, sort) : $.param(q);
      return url.length == 1 ? q : [url[0], q].join('?');
    },
    
    /**
     * @return if getQueryParams(url), return map of query params, 
     *         if getQueryParams(url, model), return map of query params that are model properties
     *         if getQueryParams(queryMap, model), return filtered map of query params that are model properties
     *         if getQueryParams(collection), return map of query params from collection.queryMap that correspond to collection's model's properties
     */
    getQueryParams: function() {
      var args = arguments;
      var collection = qMap = url = args.length && args[0];
      if (!url || typeof url === 'string') {
        qMap = U.getParamMap(url || window.location.href);
        return args.length > 1 ? U.getQueryParams(qMap, slice.call(args, 1)) : qMap;
      }
      
      var model;
      if (collection.models) { // if it's a collection
        qMap = collection.queryMap;
        model = collection.model;
      }
      else {
        if (args.length > 1)
          model = typeof args[1] === 'function' ? args[1] : args[1].constructor;
        else
          throw new Error('missing parameter "model"');
      }
      
      var filtered = {};
      for (var p in qMap) {
        if (model.properties[p])
          filtered[p] = qMap[p];
      }
  
      return filtered;
    },
    
    getHashParams: function() {
      var h = window.location.hash;
      if (!h) 
        return {};
      
      var chopIdx = h.indexOf('?');
      if (chopIdx == -1)
        return {};
        
      return h ? U.getParamMap(h.slice(chopIdx + 1)) : {};
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
    getDisplayNameProps: function(meta) {
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "displayNameElm")) 
          keys.push(p);
      }
      return keys;
    },

    
    /// String prototype extensions
    
    getQueryString: function(paramMap, sort) {
      if (!sort)
        return $.param(paramMap);
      
      var keys = [];
      for (var p in paramMap) {
        if (typeof paramMap[p] !== 'undefined') {
          keys.push(p);
        }
      }
      
      var qs = '';
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        keys[i] = keys[i] + '=' + U.encode(paramMap[keys[i]]);
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
    
    isCollection: function(resOrCol) {
      return typeof resOrCol.models !== 'undefined';
    },
    
    getModel: function(resOrCol) {
      return U.isCollection(resOrCol) ? resOrCol.model : resOrCol.constructor;
    },
    
    hasImages: function(resOrCol) {
      var isCol = U.isCollection(resOrCol);
      var models = isCol ? resOrCol.models : [resOrCol];
      if (!models.length)
        return false;
      
      var vocModel = U.getModel(resOrCol);
      var meta = vocModel.properties;
      var cloneOf;
      var hasImgs = this.isA(vocModel, 'ImageResource')  &&  meta != null  &&  (cloneOf = U.getCloneOf(meta, 'ImageResource.mediumImage')).length != 0;
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
      _.each(slice.call(arguments, 1), function(source) {
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
//      var type2Model = G.typeToModel;
      var m = model;
      while (true) {
        var subClassOf = m.subClassOf;
        if (!subClassOf.startsWith(G.DEFAULT_VOC_BASE))
          subClassOf = G.DEFAULT_VOC_BASE + subClassOf;
        
        if (m.shortName == className  ||  m.type == className)
          return true;
        if (m.subClassOf == 'Resource')
          return false;
        m = type2Model[subClassOf];
      }
      return false;
    },

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
      var propTemplate = U.getPropTemplate(prop, true);
      val = val.displayName ? val : {value: val};
      val.shortName = prop.displayName.toCamelCase();
      return {name: prop.displayName, value: _.template(Templates.get(propTemplate))(val)};
    },
    
//    /**
//     * build view/list/etc. hash for model, defaults to homePage if model is null
//     */
//    buildHash: function(model) {
//      return model instanceof Backbone.Model ? 'view/' + U.encode(model.get('_uri')) : model instanceof Backbone.Collection ? model.model.shortName : G.homePage;
//    },
    
    apiParamMap: {'-asc': '$asc', '$order': '$orderBy', '-limit': '$limit', 'recNmb': '$offset'},
    paramsToSkip: ['hideFltr'],
    getMobileUrl: function(url) {
      var orgParams = U.getQueryParams(url);
      if (url.startsWith('v.html'))
        return 'view/' + U.encode(U.getLongUri(orgParams.uri));
      
      // sample: l.html?-asc=-1&-limit=1000&%24order=regular&-layer=regular&-file=/l.html&-map=y&type=http://www.hudsonfog.com/voc/commerce/urbien/GasStation&-%24action=searchLocal&.regular=&.regular=%3e2000
      var type = orgParams.type;
//      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
      delete orgParams.type;
      var ignoredParams = '';
      var params = {};
      _.forEach(_.keys(orgParams), function(p) {
        if (_.contains(U.paramsToSkip, p))
          return;
        
        var apiParam = U.apiParamMap[p];
        if (typeof apiParam !== 'undefined') {
          var val = orgParams[p];
          if (apiParam == '$limit')
            val = Math.max(parseInt(val, 10), 50);
          
          params[apiParam] = val;
          return;
        }
        
        if (p.startsWith('-')) {
          ignoredParams += p + ',';
          return;
        }
        
        var val = orgParams[p];
        if (typeof val === 'undefined' || val === '')
          return;
        
        var matches = p.match(/^\.?([a-zA-Z_]+)(_select|_To|_From)$/);
        if (matches && matches.length > 1) {
          var pType = matches.length >=3 ? matches[2] : null;
          if (pType) {
            if (pType == '_From')
              val = '>=' + val; // to make the query string look like "start=>=today", with <=today encoded of course            
            else if (pType == '_To')
              val = '<=' + val; // to make the query string look like "end=<=today", with <=today encoded of course
          }
          
          params[matches[1]] = val;
        }
        else {
          if (!p.match(/^[a-zA-Z]/) || p.endsWith('_verified')) // starts with a letter
            return;
          
          params[p] = val;
        }
      });
      
      if (ignoredParams)
        console.log('ignoring url parameters during regular to mobile url conversion: ' + ignoredParams);
      
      return encodeURIComponent(type) + (_.size(params) ? '?' + $.param(params) : '');
    },
    
    pushUniq: function(arr, obj) {
      if (!_.contains(arr, obj))
        arr.push(obj);
    },
    
    encode: function(str) {
      return encodeURIComponent(str);
    },
    
    decode: function(str) {
      return decodeURIComponent(str).replace(/\+/g, ' ');
    },
    
    primitiveTypes: {uri: 'system/primitiveTypes', floats: ['float', 'double', 'Percent', 'm', 'm2', 'km', 'km2'], ints: ['int', 'long', 'Duration']},
    getTypedValue: function(model, prop, value) {
      if (model.collection)
        model = model.constructor;
      else if (model.models)
        model = model.model;
      
      var p = U.primitiveTypes;
      var prop = model.properties[prop];
      var range = prop.range || prop.facet;
      if (p.floats.indexOf('range') != -1)
        return parseFloat(value);
      else if (p.ints.indexOf('range') != -1)
        return parseInt(value);
      else if (range.startsWith(p.uri)) {
        range = range.slice(pt.length + 1);
        if (p.floats.indexOf(range) != -1)
          return parseFloat(value);
        else if (p.ints.indexOf(range) != -1)
          return parseInt(value);
        else
          return value;        
      }
      
      if (range == 'ComplexDate')
        return parseInt(value);
      else if (range == 'Money')
        return parseFloat(value);

//    var hIdx = range.indexOf('#');
//    if (hIdx != -1) {
//      range = range.slice(hIdx + 1);
//      switch (range) {
//      case 'string':
//        return value;
//      case 'int':
//      case 'long':
//      case 'date':
//        return parseInt(value);
//      case 'float':
//      case 'double':
//        return parseFloat(value);
//      case 'boolean':
//        return ['true', '1', 'yes'].indexOf(value.toLowerCase()) != -1;
//      default:
//        throw new Error('unsupported property range: ' + range);  
//      }
//    }

      return value;
    },
    
    isTrue: function(val) {
      if (_.isUndefined(val) || val == null)
        return false;
      
      if (typeof val === 'string')
        return ['1', 'true', 'yes'].indexOf(val.toLowerCase()) != -1;
      else
        return !!val;
    }
  };
  
  Lablz.U = U;
  return U;
});