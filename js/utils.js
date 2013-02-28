//'use strict';
define([
  'globals',
  'underscore',
  'backbone',
  'templates',
  'jquery'
], function(G, _, Backbone, Templates, $) {
  var ArrayProto = Array.prototype;
  ArrayProto.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    
    return this;
  };
  
  var slice = ArrayProto.slice;

  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
  
  String.prototype.repeat = function(num) {
    return new Array(num + 1).join(this);
  }

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

  String.prototype.uncamelize = function(capitalFirst) {
    var str = this.replace(/[A-Z]/g, ' $&').toLowerCase();
    return capitalFirst ? str.slice(0, 1).toUpperCase() + str.slice(1) : str; 
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
    isPropVisible: function(res, prop, userRole) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.virtual || prop.parameter || prop.propertyGroupList || U.isSystemProp(prop))
        return false;
      
      userRole = userRole || U.getUserRole();
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      return ar ? U.isUserInRole(userRole, ar, res) : true;
    },

    isAnAppClass: function(type) {
      return type.indexOf("/voc/dev/") != -1;
    },
    
    getUserRole: function() {
      return G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
    },
    
    isUserInRole: function(userRole, ar, res) {
      if (userRole == 'guest')
        return false;
      
      var vocModel = res && res.constructor;
      var me = G.currentUser._uri;
      var resUri = res.get('_uri');
      var iAmRes = me === resUri;
      var roles = typeof ar === 'array' ? ar : ar.split(",");
      for (var i = 0; i < roles.length; i++) {
        var r = roles[i].trim();
        if (_.contains(['admin', 'siteOwner'], r)) {
          if (userRole == r) return true;
        }
        else if (r === 'owner') {
          continue; // TODO: implement this
        }
        else {
          if (r === 'self') { 
            if (iAmRes) return true;
          }
          else if (r.endsWith('self')){
            r = r.split('==');
            var pName = r[0];
            var selfUser = res.get(pName);
            if (me == selfUser) 
              return true;
            var prop = vocModel.properties[pName];
            if (prop && U.isCloneOf(prop, 'Submission.submittedBy'))
              return true;
          }
          
          // TODO: implement this          
        }
      }
      
      return false;
    },
    
    getCurrentType: function() {
      var hash =  window.location.hash, 
          route, type;
      
      hash = hash && hash.slice(1); 
      if (!hash)
        return;

      var qIdx = hash.indexOf('?');
      if (qIdx != -1)
        hash = hash.slice(0, qIdx);
      
      hash = decodeURIComponent(hash);
      route = hash.match('^view|menu|edit|make|chooser');
      if (route) {
        var sqlIdx = hash.indexOf(G.sqlUri);
        if (sqlIdx == -1)
          type = hash.slice(route[0].length + 1);
        else
          type = 'http://' + hash.slice(sqlIdx + G.sqlUri.length + 1);
        
        qIdx = type.indexOf('?');
        if (qIdx != -1)
          type = type.slice(0, qIdx);
      }
      else
        type = hash;

      if (type === 'profile')
        return G.currentUser.guest ? null : U.getTypeUri(G.currentUser._uri);
            
      return U.getTypeUri(type);
    },
    
    /**
     * Given a subproperty and a superproperty, get the combined annotations
     */
    extendAnnotations: function(subProp, superProp, superModel) {
      superProp = U.filterObj(superProp, function(name, val) {return !val.notinheritable});
      for (var annotation in subProp) {        
        var oldAnn = superProp[annotation];        
        var newAnn = subProp[annotation];
        if (_.isUndefined(oldAnn))
          superProp[annotation] = newAnn;
        else {
          if (['cloneOf', 'subPropertyOf'].indexOf(annotation) != -1)
            superProp[annotation] = oldAnn + ',' + newAnn;
          else
            superProp[annotation] = newAnn;
        }
      }
      
      if (superProp.primary && !subProp.primary)
        delete superProp.primary;
      
      return superProp;
    },
    
    /**
     * @param prop
     * @param iProp sth like "Submission.submittedBy"
     */
    isCloneOf: function(prop, iPropName, vocModel) {
      var cloneOf = prop.cloneOf;
      var subPropertyOf = prop.subPropertyOf;
      if (cloneOf) {
        cloneOf = cloneOf.split(',');
        for (var i = 0; i < cloneOf.length; i++) {
          if (cloneOf[i] === iPropName)
            return true;
        }
      }
      else if (subPropertyOf && vocModel) // This only works if we have all superclass props on subclass
        return U.isCloneOf(vocModel[U.getLongUri1(subPropertyOf)], slice.call(arguments, 1));
      
      return false;
    },
    
    isPropEditable: function(res, prop, userRole) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.readOnly || prop.virtual || prop.propertyGroupList || prop.autoincrement)
        return false;
      
      var roles = prop.allowRoles;
      if (roles  &&  (roles.indexOf('self') == -1))
        return false;
      roles = prop.allowRolesToEdit;
      if (roles  &&  (roles.indexOf('self') == -1))
        return false;
      
      var resExists = !!res.get('_uri');
      if (resExists) { 
        if (prop.primary || prop.avoidDisplayingInEdit) // || prop.immutable)
          return false;
      }
      else {
        if (prop.avoidDisplayingOnCreate)
          return false;
      }

      userRole = userRole || U.getUserRole();
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRolesToEdit;
      return ar ? U.isUserInRole(userRole, ar, res) : true;
    },
    
    isResourceProp: function(prop) {
      return prop.range && prop.range.indexOf('/') != -1 && !U.isInlined(prop);
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
      var keys = {};
      for (var p in model.properties) {
        var prop = model.properties[p];
        if (_.has(prop, 'primary'))
          keys[prop.pkIndex] = p;
      }
      
      return _.values(keys);
    },
    
    getCloneOf: function(model) {
      cloneOf = ArrayProto.concat.apply(ArrayProto, slice.call(arguments, 1));
      var results = {};
      var meta = model.properties;
      for (var i = 0; i < cloneOf.length; i++) {
        var vals = [];
        var iProp = cloneOf[i];
        for (var j=0; j<2; j++) {
          for (var p in meta) {
            if (!_.has(meta[p], "cloneOf")) 
              continue;
            var clones = meta[p].cloneOf.split(",");
            for (var i=0; i<clones.length; i++) {
              if (clones[i].replace(' ', '') == iProp) { 
                vals.push(p);
                break;
              }
            }
          }
          
          if (vals.length)
            break;
          
          m = meta;
        }
        
        if (vals.length)
          results[iProp] = vals;
      }
      
      return _.size(results) === 1 ? results[U.getFirstProperty(results)] : results;
    },
    
    getLongUri1: function(uri, vocModel) {
      for (var pattern in U.uriPatternMap) {
        var fn = U.uriPatternMap[pattern];
        var match = uri.match(fn.regExp);
        if (match && match.length) {
          return fn(uri, match, vocModel);
          break;
        }
      }
      
      throw new Error("couldn't parse uri: " + uri);
    },
    
//    getLongUri: function(uri, hint) {
//      var type, pk, snm;
//      if (hint) {
//        type = hint.type;
//        pk = hint.primaryKeys;
//      }
//      else
//        snm = G.shortNameToModel;
//      
//      var serverName = G.serverName;
//      var sqlUri = G.sqlUri;
//      if (uri.indexOf('http') == 0) {
//        // uri is either already of the right form: http://urbien.com/sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000 or of form http://www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
//        if (uri.indexOf('?') == -1) // type uri
//          return uri;
//        
//        if (uri.indexOf(serverName + "/" + sqlUri) == 0)
//          return uri;
//        
//        type = typeof type == 'undefined' ? U.getTypeUri(uri, hint) : type;
//        return uri.indexOf("http://www.hudsonfog.com") == -1 ? uri : serverName + "/" + sqlUri + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
//      }
//      
//      var sIdx = uri.indexOf('/');
//      var qIdx = uri.indexOf('?');
//      if (sIdx === -1) {
//        // uri is of form Tree?id=32000 or just Tree
//        type = !type || type.indexOf('/') == -1 ? U.getTypeUri(uri, hint) : type;
//        if (!type)
//          return null;
//        
//        return U.getLongUri1(type + (qIdx == -1 ? '' : uri.slice(qIdx)), {type: type});
//      }
//      
//      if (uri.indexOf('sql') == 0) {
//        // uri is of form sql/www.hudsonfog.com/voc/commerce/trees/Tree?id=32000
//        return serverName + "/" + uri;
//      }
//      else if (uri.charAt(0).toUpperCase() == uri.charAt(0)) {
//        // uri is of form Tree/32000
//        var typeName = U.getClassName(uri);
//        type = U.getTypeUri(typeName, hint);
//        if (!type || type == typeName)
//          return null;
//        
//        var sIdx = uri.indexOf("/");
//        var longUri = uri.slice(0, sIdx) + "?";
//        var primaryKeys = hint.primaryKeys || (snm && snm[typeName] && U.getPrimaryKeys([typeName]));
////        var model = snm[typeName];
////        if (!model)
////          return uri;
////        
////        var primaryKeys = U.getPrimaryKeys(model);
//        if (!primaryKeys  ||  primaryKeys.length == 0)
//          longUri += "id=" + U.encode(uri.slice(sIdx + 1));
//        else {
//          var vals = uri.slice(sIdx + 1).split('/');
//          if (vals.length != primaryKeys.length)
//            throw new Error('bad uri "' + uri + '" for type "' + type + '"');
//          
//          for (var i = 0; i < primaryKeys.length; i++) {
//            longUri += primaryKeys[i] + "=" + vals[i]; // shortUri primary keys are already encoded
//          }      
//        }
//        
//        return U.getLongUri1(longUri, {type: type});
//      }
//      else {
//        // uri is of form commerce/urbien/Tree or commerce/urbien/Tree?... or wf/Urbien/.....
//        if (qIdx !== -1)
//          return G.sqlUrl + '/www.hudsonfog.com/voc/' + uri;
//        
//        if (uri.startsWith('wf/'))
//          return G.serverName + '/' + uri;
//        else
//          return G.defaultVocPath + uri;
//      }
//    },

    phoneRegex: /^(\+?\d{0,3})\s*((\(\d{3}\)|\d{3})\s*)?\d{3}(-{0,1}|\s{0,1})\d{2}(-{0,1}|\s{0,1})\d{2}$/,
    validatePhone: function(phone) {
      return U.phoneRegex.test(phone);
    },
    
    validateZip: function(zip) {
      return /^\d{5}|\d{5}-\d{4}$/.test(zip);
    },
    
    validateEmail: function(email) { 
      return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test( email );
    },
    
    getTypeUri: function(typeName, hint) {
      if (typeName.indexOf('/') != -1) {
        var type = typeName.startsWith('http://') ? typeName : G.defaultVocPath + typeName;
        var sqlIdx = type.indexOf(G.sqlUri);
        if (sqlIdx != -1)
          type = 'http://' + type.slice(sqlIdx + G.sqlUri.length + 1);
        
        var qIdx = type.indexOf('?');
        return qIdx == -1 ? type : type.slice(0, qIdx);
      }
      else {
        if (typeName == 'Class')
          return 'http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Class';
        var vocModel = G.shortNameToModel[typeName];
        return (hint && hint.type) || (vocModel && vocModel.type);
      }
    },
    
    getClassName: function(uri) {
      if (uri.startsWith(G.apiUrl))
        uri = decodeURIComponent(uri.slice(G.apiUrl.length));
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
      if (model.properties._shortUri == 'unsupported')
        return uri;
        
      var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
      var nameAndId = uri.match(regex);
      return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
    },
   
    isAll: function(model, interfaceNames) {
      return U.isA(model, interfaceNames, "AND");
    },
    
    isOneOf: function(model, interfaceNames) {
      return U.isA(model, interfaceNames, "OR");
    },
    
    isA: function(model, interfaceNames, op) {
      var OR = op === 'OR';
      interfaceNames = typeof interfaceNames === 'string' ? [interfaceNames] : interfaceNames;
      var intersection = _.intersection(model.interfaces, interfaceNames);
      if (OR && intersection.length || !OR && intersection.length === interfaceNames.length)
        return true;
      else
        return false;
      
//      var leftOver = _.difference(interfaceNames, intersection);      
//      var superCl = model._super;
//      if (!superCl || superCl.endsWith('#Resource'))
//        return false;
//      
//      var m = G.typeToModel[superCl];
//      return m ? U.isA(m, leftOver) : impl;
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
      var v;
      if (typeof val === 'string') {
        val = val.replace(',', '');
        v = parseFloat(val);
      }
      else
        v = val;
      
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
    
    getColsMeta: function(vocModel, colsType) {
      colsType = colsType || 'grid';
      var cols = vocModel[colsType + 'Cols'];
      cols = cols && cols.split(',');
      return _.uniq(_.map(cols, function(c) {return c.trim()}));
    },
    
    getCols: function(res, colsType, isListView) {
      colsType = colsType || 'grid';
      var vocModel = res.vocModel;
      var cols = vocModel[colsType + 'Cols'];
      cols = cols && cols.split(',');
      var resourceLink;
      var rows = {};
      var i = 0;
      if (cols) {
        _.each(cols, function (col) {
          col = col.trim();
          var prop = vocModel.properties[col];
          if (!prop)
            return;
          
          var val = res.get(col);
          if (!val) {
            var pGr = prop.propertyGroupList;
            if (pGr) {
              var s = U.getPropDisplayName(prop);
              var nameVal = {name: s, value: pGr};
              rows[s] = {value : pGr};  
              rows[s].propertyName = col;  
              rows[s].idx = i++;
            }
            
            return;
          }
          
          var nameVal = U.makeProp({resource: res, prop: prop, value: val, isDisplayName: isListView ? prop.displayNameElm : undefined});
          var nvn = nameVal.name;
          rows[nvn] = {value: nameVal.value};
          rows[nvn].idx = i++;
          rows[nvn].propertyName = col;
          if (prop.resourceLink)
            rows[nvn].resourceLink = true;
    //        resourceLink = nameVal.value;
    //      else
        });
      }  
      
      return i == 0 ? null : rows;
    },
    
    isMasonry: function(vocModel) {
      var meta = vocModel.properties;
      var isMasonry = U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(vocModel, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(vocModel, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(vocModel, 'ImageResource.bigImage').length > 0);
      if (!isMasonry  &&  U.isA(vocModel, 'Reference') &&  U.isA(vocModel, 'ImageResource'))
        return true;
      if (!U.isA(vocModel, 'Intersection')) 
        return isMasonry;
      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = U.getCloneOf(vocModel, 'Intersection.a')[0];
      if (qidx == -1) {
        isMasonry = (U.getCloneOf(vocModel, 'Intersection.aThumb')[0]  ||  U.getCloneOf(vocModel, 'Intersection.aFeatured')[0]) != null;
      }
      else {
        var b = U.getCloneOf(vocModel, 'Intersection.b')[0];
        var p = href.substring(qidx + 1).split('=')[0];
        var delegateTo = (p == a) ? b : a;
        isMasonry = (U.getCloneOf(vocModel, 'Intersection.bThumb')[0]  ||  U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]) != null;
      }
      return isMasonry;
    },
    
    getContainerProperty: function(vocModel) {
      var params = window.location.hash.split('?');
      if (params.length == 1)
        return null;
      params = params[1].split('&');

      var meta = vocModel.properties;
      for (var i=0; i<params.length; i++) {
        var s = params[i].split('=')[0];
        p = meta[s];
        if (!p)
          p = meta[s];
        if (p  &&  (p.containerMember || p.notifyContainer))
          return p.shortName;
      }
      return null;
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
      q = sort ? U.getQueryString(q, {sort: sort}) : $.param(q);
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
      var model = collection = qMap = url = args.length && args[0];
      if (!url || typeof url === 'string') {
        qMap = U.getParamMap(url || window.location.href);
        return args.length > 1 ? U.getQueryParams(qMap, slice.call(args, 1)) : qMap;
      }

      if (U.isCollection(model)) { // if it's a collection
        qMap = collection.queryMap;
        model = collection.model;
      }
      else if (model instanceof Backbone.Model) {
        return {};
      }
      else {
        if (args.length > 1)
          model = typeof args[1] === 'function' ? args[1] : args[1].constructor;
        else {
          return U.filterObj(qMap, function(name, val) {
            return name.match(/^[a-zA-Z]+/);
          });
//          throw new Error('missing parameter "model"');
        }
      }
      
      var filtered = {};
      for (var p in qMap) {
        if (model.properties[p])
          filtered[p] = qMap[p];
      }
  
      return filtered;
    },
    
    getHashParams: function() {
      var h = window.location.href;
      var hashIdx = h.indexOf('#');
      if (hashIdx === -1) 
        return {};
      
      var chopIdx = h.indexOf('?', hashIdx);
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
    
//    getPropertiesWith: function(list, annotation) {
//      return _.filter(list, function(item) {
//        return item[annotation] ? item : null;
//      });
//    },
    
    getArrayOfPropertiesWith: function(props, annotations) {
      return U.getPropertiesWith(props, {name: annotations}, true);
    },
    
    getPropertiesWith: function(props, annotations, returnArray) {
      var type = U.getObjectType(annotations);
      switch (type) {
        case '[object String]':
          annotations = [{name: annotations}];
          break;
        case '[object Object]':
          annotations = [annotations];
          break;
      }
        
      var filtered = U.filterObj(props, function(name, val) {
        for (var i = 0; i < annotations.length; i++) {
          var a = annotations[i];
          var annotationVal = props[name][a.name];
          var values = typeof a.value === 'undefined' ? a.values : [a.value];
          if (typeof values === 'undefined') {
            if (typeof annotationVal === 'undefined') 
              return false;
          }
          else if (values.indexOf(annotationVal) === -1) 
            return false;
        }
        
        return true;
      });
      
      return returnArray ? _.toArray(filtered) : filtered;
    },
    
    getDisplayNameProps: function(meta) {
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "displayNameElm")) 
          keys.push(p);
      }
      return keys;
    },
    
    getDisplayName: function(resource, meta) {
      var dn = resource.get('davDisplayName');
      if (dn)
        return dn;
      
      var vocModel = resource.vocModel;
      if (!meta) 
        meta = vocModel.properties;
      
      var dnProps = U.getDisplayNameProps(meta);
      var dn = '';
      if (!dnProps  ||  dnProps.length == 0) {
        var uri = resource.get('_uri');
        if (!uri)
          return vocModel.displayName;
        var s = uri.split('?');
        s = decodeURIComponent(s[1]).split('&');
        for (var i=0; i<s.length; i++) {
          if (i)
            dn += ' ';
          dn += s[i].split('=')[1]; 
        }
        return dn;
      }
      var first = true;
      for (var i=0; i<dnProps.length; i++) {
        var shortName = dnProps[i],
            prop = meta[shortName],
            value = resource.get(shortName);
        
        if (value  &&  typeof value != 'undefined') {
          if (first)
            first = false;
          else
            dn += ' ';
          
          if (U.isResourceProp(prop)) {
            // get displayName somehow, maybe we need to move cached resources to G, instead of Router
          }
          else {
            dn += value.displayName ? value.displayName : value;
          }
        }
      }
      
      return (dn || vocModel.displayName).trim();
    },

    getTypeTemplate: function(id, resource) {
      var t = G.template;
      if (!t) 
        return null;
      
      var vocModel = resource.vocModel;
      var dataType = vocModel.shortName; 
      
      var appTemplates = Templates.get(G.appName);
      if (!appTemplates) {
        var elts = $('script[type="text/template"]', $(t));
        appTemplates = {};
        for (var i = 0; i < elts.length; i++) 
          appTemplates[$(elts[i]).attr('data-type') + '-' + elts[i].id] = elts[i].innerHTML;

        Templates.templates[G.appName] = appTemplates;
      } 
      
      var key = dataType + '-' + id;
      var tmpl = appTemplates[key];
      return (tmpl) ? _.template(tmpl) : null;
    },
    /// String prototype extensions
    
    getQueryString: function(paramMap, options) {
      options = options || {};
      if (!options.sort) {
        result = $.param(paramMap);
        return options.delimiter ? result.replace(/\&/g, options.delimiter) : result;
      }
      
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
      
      return keys.join(options.delimiter || '&');
    },

    getFormattedDuration: function(time) {
      if (time <= 0)
        return "none";
      
      var now = G.currentServerTime();
      var date = U.getFormattedDate(now + time);
      if (date.startsWith("In "))
        return date.slice(3);
      else if (date.endsWith(" ago"))
        return date.slice(0, date.length - 4);
      else if (date === 'Tomorrow')
        return '1 day';
      else
        throw new Error("couldn't parse time");
      
//      if (time < 86400) {
//        return time < 0 && "none" || 
//          time < 60 && (time + " seconds") ||
//          time < 120 && "A minute or so" ||
//          time < 3600 && Math.floor( time / 60 ) + " minutes" ||
//          time < 7200 && "an hour" ||
//          Math.floor( time / 3600 ) + " hours";
//      }
//      
//      var days = Math.floor(time / 86400);
//      if (days == 1)
//        return "1 day";
//      else if (days < 7)
//        return days + " days";
//      else if (days < 365) {
//        var w = Math.round(days / 7);
//        return (w == 1) ? "a week" : w + " weeks";
//      }
//      else {
//        var years = Math.round( day_diff / 365 );
//        var rest = (day_diff % 365);
//        var date = '';
//        if (years == 1)
//          date += 'a year';
//        else
//          date += years + " years";
//        return (rest == 0) ? date : date + ' and ' + U.getFormattedDate(now - (rest * 86400 * 1000));  
//      }
    },

    getFormattedDate: function(time, firstLevel) {
//      var date = new Date(parseFloat(time));
      //(time || "").replace(/-/g,"/").replace(/[TZ]/g," "));
      var now = G.currentServerTime();
      var diff = ((now - parseFloat(time)) / 1000);
      var day_diff = Math.floor(diff / 86400);
          
      if (isNaN(day_diff))
        return null;
          
      var future = diff < 0;
      var absDiff = Math.abs(diff);
      var absDayDiff = Math.abs(day_diff);
      var pre = future ? "In " : "";
      var post = future ? "" : " ago";
      
      if (day_diff == 0) {
        var str = (absDiff < 60 && "just now" ||
                absDiff < 120 && "a minute" ||
                absDiff < 3600 && Math.floor( absDiff / 60 ) + " minutes" ||
                absDiff < 7200 && "an hour" ||
                absDiff < 86400 && Math.floor( absDiff / 3600 ) + " hours");
        
        if (absDiff >= 60)
          str = pre + str + post;
      }
      else if (absDayDiff == 1)
        return future ? "Tomorrow" : "Yesterday";
      else {
        var str;
        if (absDayDiff < 7) 
          str = (absDayDiff == 1) ? "a day" : absDayDiff + " days"; 
        else if (absDayDiff < 30) {
          var w = Math.round( absDayDiff / 7 );
          str = (w == 1) ? "a week" : w + " weeks";
        }
        else if (absDayDiff < 365) {
          var m = Math.round( absDayDiff / 30 );
          str = (m == 1) ? "a month" : m + " months";
        }
        else {
          var years = Math.round( absDayDiff / 365 );
          var rest = (absDayDiff % 365);
          var date = '';
          if (years == 1)
            date += 'a year';
          else
            date += years + " years";
          str = (rest == 0  ||  firstLevel) ? date : date + ' and ' + U.getFormattedDate(now - (rest * 86400 * 1000));
        }
        
        var ret = '';
        if (str.indexOf('In') == -1)
          ret += pre;
        ret += str;
        if (str.indexOf(' ago') == -1)
          ret += post;
        return ret;
      }
      
//      var years;
//      return day_diff == 0 && (
//        diff < 60 && "just now" ||
//        diff < 120 && "a minute ago" ||
//        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
//        diff < 7200 && "an hour ago" ||
//        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
//        day_diff == 1 && "Yesterday" ||
//        day_diff < 7 && day_diff + " days ago" ||
//        day_diff < 365 && Math.round( day_diff / 7 ) + " weeks ago" || 
//        day_diff > 365 && (years = Math.round( day_diff / 365 )) + " years and " + U.getFormattedDate(now + (day_diff % 365));  
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
    
    getUris: function(data) {
      return _.map(data instanceof Backbone.Collection ? data.models : [data], function(m) {return m.get('_uri')});
    },
    
    isCollection: function(res) {
      return res instanceof Backbone.Collection;
    },

    isModel: function(res) {
      return res instanceof Backbone.Model;
    },

    getModel: function(resOrCol) {
      return U.isCollection(resOrCol) ? resOrCol.model : resOrCol.constructor;
    },
    
    getImageProperty: function(resOrCol) {
      var isCol = U.isCollection(resOrCol);
      var models = isCol ? resOrCol.models : [resOrCol];
      if (!models.length)
        return null;
      
      var vocModel = U.getModel(resOrCol);
      var meta = vocModel.properties;
      var cloneOf;
      var aCloneOf;
      var bCloneOf;
      var hasImgs;
      if (U.isA(vocModel, 'ImageResource')) {
        if ((cloneOf = U.getCloneOf(vocModel, 'ImageResource.smallImage')).length != 0)
          hasImgs = true;
        else  if ((cloneOf = U.getCloneOf(vocModel, 'ImageResource.mediumImage')).length != 0)
          hasImgs = true;

      }
      var isIntersection = !hasImgs  &&  this.isA(vocModel, 'Intersection'); 
      if (isIntersection) {
        aCloneOf = U.getCloneOf(vocModel, 'Intersection.aThumb')  ||  U.getCloneOf(vocModel, 'Intersection.aFeatured');
        bCloneOf = U.getCloneOf(vocModel, 'Intersection.bThumb')  ||  U.getCloneOf(vocModel, 'Intersection.bFeatured');
        if (aCloneOf.length != 0  &&  bCloneOf.length != 0) {
          aCloneOf = aCloneOf[0], bCloneOf = bCloneOf[0];
          hasImgs = true;
        }
      }
      if (!hasImgs  &&  U.isA(vocModel, 'Reference')) {
        if ((cloneOf = U.getCloneOf(vocModel, 'Reference.resourceImage')).length != 0)
          hasImgs = true;
      }
        
      if (!hasImgs)
        return null;
      
      cloneOf = cloneOf && cloneOf[0];
      hasImgs = false;
      for (var i = 0; !hasImgs  &&  i < models.length; i++) {
        var m = models[i];
        if (isIntersection  &&  (m.get(aCloneOf) || m.get(bCloneOf))) 
          return aCloneOf;
        if (m.get(cloneOf))
          return cloneOf;
      }
      
      return null;
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
    
    getPropDisplayName: function(prop) {
      return prop.displayName || prop.label || prop.shortName.uncamelize(true);
    },
    
    isAssignableFrom: function(model, className) {
      if (U.isA(model, className)  ||  model.shortName == className)
        return true;
      
      var supers = model.superClasses;
      return _.any(supers, function(s) {return s.endsWith("/" + className)});
      
//      var m = model;
//      while (true) {
//        var subClassOf = m.subClassOf;
//        if (!subClassOf.startsWith(G.DEFAULT_VOC_BASE))
//          subClassOf = G.DEFAULT_VOC_BASE + subClassOf;
//        
//        if (m.shortName == className  ||  m.type == className)
//          return true;
//        if (m.subClassOf == 'Resource')
//          return false;
//        
//        m = G.typeToModel[subClassOf];
//      }
    },

    getValue: function(modelOrJson, prop) {
      if (U.isModel(modelOrJson))
        return modelOrJson.get(prop);
      else
        return modelOrJson[prop];
    },
    
    makeProp: function(info) {
      var res = info.resource;
      var vocModel = res.vocModel;
      var propName = info.propName;
      var prop = info.prop || propName && vocModel && vocModel.properties[propName];
      propName = propName || prop.shortName;
      var val = info.value || U.getValue(res, propName);
      val = typeof val !== 'undefined' ? U.getTypedValue(res, propName, val) : val;
      var isDisplayName = info.isDisplayName || prop.displayNameElm;
      
      var cc = prop.colorCoding;
      if (cc) {
        cc = U.getColorCoding(cc, val);
        if (cc) {
          if (cc.startsWith("icons"))
            val = "<img src='" + cc + "' border='0'>&#160;" + val;
          else
            val = "<span style='color:" + cc + "'>" + val + "</span>";
        }
      }
      else if (isDisplayName  &&  prop.range == 'string') {
        val = "<span style='font-size: 18px;font-weight:normal;'>" + val + "</span>";
      }
      
      val = val || res.get(propName) || '';
      var displayName = res.get(propName + '.displayName');
      if (displayName)
        val = {value: val, displayName: displayName};
      else
        val = {value: val};
      
      var propTemplate = Templates.getPropTemplate(prop);
      return {name: U.getPropDisplayName(prop), value: _.template(Templates.get(propTemplate))(val), U: U, G: G};
    },
    
    makePageUrl: function(action, typeOrUri, params) {
      return G.pageRoot + '#' + U.makeMobileUrl.apply(this, arguments);
    },
    
    makeMobileUrl: function(action, typeOrUri, params) {
      action = action || 'list';
      if (U.isModel(typeOrUri))
        typeOrUri = typeOrUri.getUri();
      else if (U.isCollection(typeOrUri)) {
        var col = typeOrUri;
        typeOrUri = col.vocModel.type;
        params = _.extend({}, col.queryMap, params);
      }
        
      var url = '';
      switch (action) {
        case 'list':
          break;
        case 'make':
        case 'view':
        case 'edit':
        case 'chooser':
        default: 
          url += action + '/';
          break;
      }
      
      url += encodeURIComponent(typeOrUri);
      if (_.size(params))
        url += '?' + $.param(params);
      
      return url;
    },
    
    makeEditProp: function(res, prop, values, formId) {
      var p = prop.shortName;
      var val = values[p];
      var propTemplate = Templates.getPropTemplate(prop, true, val);
      if (typeof val === 'undefined')
        val = {};
      else {
        val = U.getTypedValue(res, p, val);
        if (values[p + '.displayName'])
          val = {value: val, displayName: values[p + '.displayName']};
        else
          val = {value: val};
      }
      
      var isEnum = propTemplate === 'enumPET';      
      if (isEnum) {
        var facet = prop.facet;
        var eCl = G.typeToEnum[U.getLongUri1(facet)];
        if (!eCl)
          throw new Error("Enum {0} has not yet been loaded".format(facet));
        
        var valLength = _.pluck(eCl.values, "displayName").join('').length;
//        propTemplate = 'scrollEnumPET';
        propTemplate = 'longEnumPET';
//        propTemplate = valLength < 25 ? 'shortEnumPET' : 'longEnumPET';
        val.options = eCl.values;
      }
      
      val.value = val.value || '';
      if (prop.range == 'resource') 
        val.uri = val.value;
      
      if (!prop.skipLabelInEdit)
        val.name = U.getPropDisplayName(prop);
      val.shortName = prop.shortName;
      val.id = (formId || G.nextId()) + '.' + prop.shortName;
      val.prop = prop;
//      val.comment = prop.comment;
      var facet = prop.facet;
      if (facet) {
        if (facet.endsWith('emailAddress'))
          val.type = 'email';
        else if (facet.toLowerCase().endsWith('phone'))
          val.type = 'tel';
      }
//      if (prop.comment)
//        val.comment = prop.comment;
      
//      var classes = [];
      var rules = prop.multiValue ? {} : {"data-formEl": true};
      if (prop.required)
        rules.required = 'required';
      if (prop.maxSize)      
        rules.maxlength = prop.maxSize;
      
      if (U.isDateProp(prop))
        rules['data-date'] = true;
      else if (U.isTimeProp(prop))
        rules['data-duration'] = true;
      else if (U.isEnumProp(prop))
        rules['data-enum'] = true;
      
//      val.classes = classes.join(' ');
      val.rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      _.extend(val, {U: U, G: G});
//      if (prop.comment)
//        val.comment = prop.comment;
      var propInfo = {value: _.template(Templates.get(propTemplate))(val), U: U, G: G};
      if (prop.comment)
        propInfo.comment = prop.comment;
      
      return propInfo;
    },
    
    reduceObj: function(obj, func, memo, context) {
      var initial = arguments.length > 2;
      _.each(_.keys(obj), function(name, index, list) {
        if (!initial) {
          memo = func(name, obj[name]);
          initial = true;
        } else {
          memo = func.call(context, memo, name, obj[name], index, list);
        }
      });
      
      return memo;
    },
    
    getPageUrl: function(mobileUrl) {
      return G.pageRoot + '#' + mobileUrl;
    },
    
//    /**
//     * build view/list/etc. hash for model, defaults to homePage if model is null
//     */
//    buildHash: function(model) {
//      return model instanceof Backbone.Model ? 'view/' + U.encode(model.get('_uri')) : model instanceof Backbone.Collection ? model.model.shortName : G.homePage;
//    },
//    
//    apiParamMap: {'-asc': '$asc', '$order': '$orderBy', '-limit': '$limit', 'recNmb': '$offset'},
//    paramsToSkip: ['hideFltr'],
//    getMobileUrl: function(url) {
//      var orgParams = U.getQueryParams(url);
//      if (url.startsWith('v.html'))
//        return 'view/' + U.encode(U.getLongUri1(orgParams.uri));
//      
//      // sample: l.html?-asc=-1&-limit=1000&%24order=regular&-layer=regular&-file=/l.html&-map=y&type=http://www.hudsonfog.com/voc/commerce/urbien/GasStation&-%24action=searchLocal&.regular=&.regular=%3e2000
//      var type = orgParams.type;
////      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
//      delete orgParams.type;
//      var ignoredParams = '';
//      var params = {};
//      _.forEach(_.keys(orgParams), function(p) {
//        if (_.contains(U.paramsToSkip, p))
//          return;
//        
//        var apiParam = U.apiParamMap[p];
//        if (typeof apiParam !== 'undefined') {
//          var val = orgParams[p];
//          if (apiParam == '$limit')
//            val = Math.max(parseInt(val, 10), 50);
//          
//          params[apiParam] = val;
//          return;
//        }
//        
//        if (p.startsWith('-')) {
//          ignoredParams += p + ',';
//          return;
//        }
//        
//        var val = orgParams[p];
//        if (typeof val === 'undefined' || val === '')
//          return;
//        
//        var matches = p.match(/^\.?([a-zA-Z_]+)(_select|_To|_From)$/);
//        if (matches && matches.length > 1) {
//          var pType = matches.length >=3 ? matches[2] : null;
//          if (pType) {
//            if (pType == '_From')
//              val = '>=' + val; // to make the query string look like "start=>=today", with <=today encoded of course            
//            else if (pType == '_To')
//              val = '<=' + val; // to make the query string look like "end=<=today", with <=today encoded of course
//          }
//          
//          params[matches[1]] = val;
//        }
//        else {
//          if (!p.match(/^[a-zA-Z]/) || p.endsWith('_verified')) // starts with a letter
//            return;
//          
//          params[p] = val;
//        }
//      });
//      
////      if (ignoredParams)
////        console.log('ignoring url parameters during regular to mobile url conversion: ' + ignoredParams);
//      
//      return (url.toLowerCase().startsWith('mkresource.html') ? 'make/' : '') + encodeURIComponent(type) + (_.size(params) ? '?' + $.param(params) : '');
//    },
    
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
    
    primitiveTypes: {
//      uri: 'system/primitiveTypes',
      dates: ['date', 'dateTime', 'ComplexDate'],
      floats: ['float', 'double', 'Percent', 'm', 'm2', 'km', 'km2', 'g', 'kg'], 
      ints: ['int', 'long', 'Duration', 'ComplexDate', 'dateTime', 'date']
    },
    
    /**
     * @param res Resource (Backbone.Model) instance
     * @param prop name of the property
     * @param property value 
     */
    getTypedValue: function(res, prop, value) {
      var vocModel = res.vocModel;
      var p = U.primitiveTypes;
      var prop = vocModel.properties[prop];
      var range = prop.range || prop.facet;
      var isNumber = !isNaN(value);
      if (range === 'boolean')
        return typeof value === 'boolean' ? value : value === 'true' || value === 'Yes' || value === '1' || value === 1; 
      else if (p.dates.indexOf(range) != -1)
        return U.parseDate(value);
      else if (p.floats.indexOf(range) != -1)
        return parseFloat(value);
      else if (p.ints.indexOf(range) != -1)
        return parseInt(value);
//      else if (p.floats.indexOf(range) != -1)
//        return !isNumber ? null : parseFloat(value);
//      else if (p.ints.indexOf(range) != -1)
//        return !isNumber ? null : parseInt(value);
//      else if (range.startsWith(p.uri)) {
//        range = range.slice(pt.length + 1);
//        if (p.floats.indexOf(range) != -1)
//          return parseFloat(value);
//        else if (p.ints.indexOf(range) != -1)
//          return parseInt(value);
//        else
//          return value;        
//      }
      
      if (range == 'ComplexDate' || range ==  'dateTime') {
        try {
          if (isNaN(value))
            return parseInt(value);
          else
            return value;
        } catch (err) {
          // TODO: check if it's valid, like 'today', etc.
          return value; 
        }
      }
      else if (range == 'Money')
        return isNaN(value) ? parseFloat(value) : value;

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
    },
    
    isArray: function(obj) {
      return U.getObjectType(obj) === '[object Array]';
    },

    isObject: function(obj) {
      return U.getObjectType(obj) === '[object Object]';
    },
    
    /**
     * like _.filter, but func takes in both key and value 
     * @return obj with keys and values such that for each [key, val] pair, func(key, val) is truthy;
     */
    filterObj: function(obj, func) {
      var filtered = {};
      for (var key in obj) {
        var val = obj[key];
        if (func(key, val))
          filtered[key] = val;
      }
      
      return filtered;
    },
    
    copyFrom: function(from, to, props) {
      _.each(props || from, function(p) {
        to[p] = from[p];
      });
    },
    
    /**
     * @return obj with keys and values remapped by func. 
     * @param func: takes in key, value, returns [newKey, newValue] or null if you want to remove it from the map 
     */
    mapObj: function(obj, func) {
      var mapped = {};
      for (var key in obj) {
        var val = obj[key];
        var pair = func(key, val);
        if (pair)
          mapped[pair[0]] = pair[1];
      }
      
      return mapped;
    },
    
    getFirstProperty: function(obj) {
      for (var name in obj) {
        return name;
      }
    },
    
    // https://gist.github.com/boo1ean/3878870
    plural: [
       [/(quiz)$/i,               "$1zes"  ],
       [/^(ox)$/i,                "$1en"   ],
       [/([m|l])ouse$/i,          "$1ice"  ],
       [/(matr|vert|ind)ix|ex$/i, "$1ices" ],
       [/(x|ch|ss|sh)$/i,         "$1es"   ],
       [/([^aeiouy]|qu)y$/i,      "$1ies"  ],
       [/(hive)$/i,               "$1s"    ],
       [/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
       [/sis$/i,                  "ses"    ],
       [/([ti])um$/i,             "$1a"    ],
       [/(buffal|tomat)o$/i,      "$1oes"  ],
       [/(bu)s$/i,                "$1ses"  ],
       [/(alias|status)$/i,       "$1es"   ],
       [/(octop|vir)us$/i,        "$1i"    ],
       [/(ax|test)is$/i,          "$1es"   ],
       [/s$/i,                    "s"      ],
       [/$/,                      "s"      ]
    ],
         
    getPlural: function(res) {
      var p = res.vocModel.pluralName;
      if (p)
        return p;
      
      p = res.displayName;
      for (var i = 0; i < U.plural.length; i++) {
        var regex          = U.plural[i][0];
        var replace_string = U.plural[i][1];
        if (regex.test(word)) {
          return word.replace(regex, replace_string);
        }
      }
      
      return p + 's';
    },
    // helps to fit images in listview (RL)
    // note: margins in DOM should be: -left and -top 
    fitToFrame : function(frmWidth, frmHeight, srcRation) {
      var frmRatio = frmWidth / frmHeight;
      var w, h, x = 0, y = 0;
      if (srcRation > frmRatio) { // long
        h = frmHeight; 
        w = Math.floor(h * srcRation); 
        x = Math.floor((w - frmWidth) / 2);
      } 
      else {
        w = frmWidth; 
        h = Math.floor(w / srcRation); 
        y = Math.floor((h - frmHeight) / 2);
      }
      return {x: x, y: y, w: w, h: h};
    },
    
    getHash: function() {
      var hash = window.location.hash;
      return hash.length ? hash.slice(1) : hash;
    },
    
    prepForSync: function(item, vocModel, preserve) {
      preserve = preserve || [];
      var props = vocModel.properties;
      var filtered = U.filterObj(item, function(key, val) {
        var prop = props[key];
        return !U.isSystemProp(key) && prop && (_.contains('backLink') || !prop.backLink) && (U.isResourceProp(prop) || (_.contains('readOnly') || !prop.readOnly)) && /^[a-zA-Z]+[^\.]*$/.test(key); // sometimes if it's readOnly, we still need it - like if it's a backlink
      }); // is writeable, starts with a letter and doesn't contain a '.'
      
      return U.flattenModelJson(filtered, vocModel, preserve);
    },
    
    flattenModelJson: function(m, vocModel, preserve) {
      var vocProps = vocModel.properties;
      var flat = {};
      for (var name in m) {
        if (name.indexOf(".") != -1) {
          flat[name] = m[name];
          continue;
        }
          
        var prop = vocProps[name];
        if (!prop || (prop.parameter && !_.contains(preserve, 'parameter')) || (prop.virtual && !_.contains(preserve, 'virtual')))
          continue;
        
        flat[name] = U.getFlatValue(prop, m[name]);
      }
      
      return flat;
    },
    
    getFlatValue: function(prop, val) {
      if (U.isNully(val))
        return null;
      
      var range = prop.range || '';
      if (typeof val !== 'object') {
        if (range.indexOf('/') != -1 && /^[a-z]+\//.test(val)) // don't bother extending short uris like ShoppingList/32004, but do extend stuff like commerce/urbien/ShoppingList?id=32004
          return U.getLongUri1(val);
        
        return val;
      }      
      
      var value = val.value;
      if (value) {
        if (range.indexOf("/") === -1)
          return value;
        return typeof value !== 'string' ? value : value.indexOf('/') === -1 ? value : U.getLongUri1(value);
      }
      
      return val;
    },
    
    isNully: function(val) {
      return _.isUndefined(val) || val === null || val === '';
    },

    isFalsy: function(val, range) {
      if (U.isNully(val))
        return true;
      
      var primitives = U.primitiveTypes;
      var valType = typeof val; 
      if (range === 'boolean') {
        return valType === 'boolean' ? !val : valType === 'string' ? ['true', 'Yes', '1'].indexOf(val) === -1 : valType === 'number' ? val === 0 : !val;
      }
      else if (_.contains(primitives.ints, range)) {
        try {
          return !parseInt(val);
        } catch (err) {
          return true;
        }
      }
      else if (_.contains(primitives.floats, range)) {
        try {
          return !parseFloat(val);
        } catch (err) {
          return true;
        }
      }
      
      return val === 'null' || !val; // val could be an empty string
    },
    

    _dateProps: ['ComplexDate', 'date', 'dateTime'],
    _timeProps: ['Duration', 'years', 'hours', 'minutes', 'seconds'],
    isDateOrTimeProp: function(prop) {
      return U.isDateProp(prop) || U.isTimeProp(prop);
    },

    isEnumProp: function(prop) {
      return prop.range === 'enum';
    },
    
    isDateProp: function(prop) {
      return U.isXProp(prop, U._dateProps);
    },

    isTimeProp: function(prop) {
      return U.isXProp(prop, U._timeProps);
    },

    isXProp: function(prop, propShortNameSet) {
      if (!prop.range)
        return false;
      
      var range = prop.range;
      var lsIdx = range.lastIndexOf('/');
      range = lsIdx === -1 ? range : range.slice(lsIdx + 1);
      return _.contains(propShortNameSet, range);      
    },
    
    toDateParts: function(millis) {
      var date = millis ? new Date(millis) : new Date();
      return [date.getMonth(), date.getDate(), date.getFullYear()];//, date.getMonth(), date.getDate()];
    },
    
    millis: {
      second: 1000,
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000
    },
    
    parseDate: function(date) {
      if (!isNaN(date))
        return parseInt(date);
      
      try {
        var d = new Date(date);
        return d.getTime();
      } catch (err) {
      }
            
      var startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      startOfDay = startOfDay.getTime();
      switch (date) {
        case 'today':
          return startOfDay;
        case 'tomorrow':
          return startOfDay + U.millis.day;
        case 'yesterday':
          return startOfDay - U.millis.day;
        case 'day after tomorrow':
          return startOfDay + 2*U.millis.day;
      }
      
      var parsed = date.match(/(\d)* ?(second|minute|hour|day|week|month|year){1}s? ?(ago|ahead)/);
      if (!parsed)
        throw new Error('couldn\'t parse date: ' + date);
      
      var num = parsed[1] ? parseInt(parsed[1]) : 0;
      var length = U.millis[parsed[2]];
      var multiplier = parsed[3] === 'ago' ? -1 : 1;
      return startOfDay + num * length * multiplier;
    },
    
    getPositionProps: function(vocModel) {
      var positionProps = {};
      if (U.isA(vocModel, "Locatable")) {
        var lat = U.getCloneOf(vocModel, "Locatable.latitude");
        if (lat.length) 
          positionProps.latitude = lat[0];
        var lon = U.getCloneOf(vocModel, "Locatable.longitude");
        if (lon.length) 
          positionProps.longitude = lon[0];
      }
      else if (U.isA(vocModel, "Shape")) {
        var lat = U.getCloneOf(vocModel, "Shape.interiorPointLatitude");
        if (lat.length) 
          positionProps.latitude = lat[0];
        var lon = U.getCloneOf(vocModel, "Shape.interiorPointLongitude");
        if (lon.length) 
          positionProps.longitude = lon[0];
      }
      
      if (U.isA(vocModel, "Distance")) {
        var radius = U.getCloneOf(vocModel, "Distance.radius");
        if (radius.length) 
          positionProps.radius = radius[0];
        var distance = U.getCloneOf(vocModel, "Distance.distance");
        if (distance.length)
          positionProps.distance = distance[0];
      }
      
      return positionProps;
    },

    parseWhere: function(where) {
                    // nuke whitespace outside of single and double quotes
      where = where.replace(/\s+(?=([^']*'[^']*')*[^']*$)/g, '')
                    // convert to API params
                   .replace(/==/g, '=')
                   .replace(/(>=|<=)/, '=$1')
                    // replace self with user uri
                   .replace(/\'self\'|\\"self\\"|\\\'self\\\'|\\\"self\\\"/g, G.currentUser._uri);
                       
      // TODO: support OR
      where = where.split(/&&/);
      var params = {};
      for (var i = 0; i < where.length; i++) {
        // TODO: support <=, >=, etc.
        var pair = where[i].split('=');
        params[pair.shift()] = pair.join('=');
      }
      
      return params;
    },
    
    makeHeaderTitle: function(pre, post) {
      return pre + "&nbsp;&nbsp;<span class='ui-icon-caret-right'></span>&nbsp;&nbsp;" + post;
    },
//    removeUnquotedWhitespace: function(text) {
//      qStack = [];
//      sqStack = [];
//      qqStack = [];
//      qsqStask = [];
//      var newText = '';
//      for (var i in text) {
//        switch (i) {
//        case '\''
//        }
//      }
//    },
    pick: function(obj) {
      var type = U.getObjectType(obj);
      switch (type) {
      case '[object Object]':
        return _.pick.apply(null, arguments);
      case '[object Array]':
        var keys = ArrayProto.concat.apply(ArrayProto, slice.call(arguments, 1));
        var arrCopy = [];
        for (var i = 0; i < obj.length; i++) {
          var item = obj[i], copy = {};
          for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            if (key in item) 
              copy[key] = item[key];
          }
          
          arrCopy.push(copy);
        }
        
        return arrCopy;
      }
    },
    systemProps: {davDisplayName: {range: 'string', readOnly: true}, davGetLastModified: {range: 'long', readOnly: true}},
    isSystemProp: function(p) {
      p = typeof p === 'string' ? p : p.shortName;
      return /^\_/.test(p) || !!U.systemProps[p];
    },
    imageResourceProps: ['ImageResource.originalImage', 'ImageResource.smallImage', 'ImageResource.mediumImage', 'ImageResource.bigImage', 'ImageResource.bigMediumImage'],
    inlinedPropRegex: /model\/company\/Money|system\/primitiveTypes\/Duration|system\/fog\/ComplexDate$/,
    isInlined: function(prop) {
      return (prop.range && U.inlinedPropRegex.test(prop.range)) || (prop.facet && U.inlinedPropRegex.test(prop.facet));
    },
    isTempUri: function(uri) {
      return uri.indexOf("?__tempId__=") != -1;
    },
    makeTempUri: function(type, id) {
      return G.sqlUrl + '/' + type.slice(7) + '?__tempId__=' + (typeof id === 'undefined' ? G.currentServerTime : id);
    },
    sq: function(a) {
      return a * a;
    },
    getEarthRadius: function() {
      return G.isMetric === false ? 3961 : 6373;
    },
    distance: function(aCoords, bCoords) {
      var lat1 = aCoords[0], lat2 = bCoords[0], lon1 = aCoords[1], lon2 = bCoords[1];
      dlon = lon2 - lon1;
      dlat = lat2 - lat1;
      var a = U.sq(Math.sin(dlat/2)) + Math.cos(lat1) * Math.cos(lat2) * U.sq(Math.sin(dlon/2)); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return U.getEarthRadius() * c;
          
//      var x = aCoords[0] - bCoords[0];
//      var y = aCoords[1] - bCoords[1];
//      return Math.sqrt(x*x + y*y);
    },
    slice: slice,
//    remove: function(array, item) {
//      var what, a = arguments, L = a.length, ax;
//      while (L && this.length) {
//        what = a[--L];
//        while ((ax = this.indexOf(what)) !== -1) {
//          this.splice(ax, 1);
//        }
//      }
//      return this;
//    },
    
    toObject: function(arr) {
      var obj = {};
      for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = {};
      }
      
      return obj;
    }
//    ,
    
//    getProp: function(meta, name) {
//      var org = meta[name];
//      if (org)
//        return org;
//      
//      var alt = U.getAltName(meta, name);
//      return alt ? meta[alt] : null;
//    },
//    
//    getAltName: function(props, name) {
//      var alt = U.filterObj(meta, function(prop) {
//        return prop.altName == name;
//      });
//      
//      return _.size(alt) ? U.getFirstProperty(alt) : null;
//    }
//    
//    ,
//    intersectObjects: function(array) {
//      var rest = slice.call(arguments, 1);
//      return _.filter(_.uniq(array), function(item) {
//        return _.every(rest, function(other) {
//          return _.any(other, function(element) { return _.isEqual(element, item); });
//        });
//      });
//    }
  };

  for (var p in U.systemProps) {
    var prop = U.systemProps[p];
    prop.shortName = p;
  }
  
  var patterns = U.uriPatternMap = {};
  // Tree/32000
  patterns[/^[A-Z]+([^\?]*)$/] = function(uri, matches, vocModel) {
    if (!vocModel)
      throw new Error("Not enough information to create long uri");
    
    var parts = uri.split('/');
    var type = vocModel.type;
    var primaryKeys = U.getPrimaryKeys(vocModel);
    if (primaryKeys.length !== parts.length - 1)
      throw new Error("Incorrect number of primary keys in short uri: " + uri);
    
    var params = {};
    for (var i = 0; i < primaryKeys.length; i++) {
      params[primaryKeys[i]] = parts[i+1];
    }
    
    return G.sqlUrl + "/" + type.slice(7) + '?' + $.param(params);
  };
  // Tree?id=32000
  patterns[/^[A-Z]+\?.*$/] = function(uri, matches, vocModel) {
    if (!vocModel)
      throw new Error("Not enough information to create long uri");
    
    return G.sqlUrl + "/" + type.slice(7) + uri.slice(uri.indexOf("?"));
  };
  // wf/.... attachment url
  patterns[/^wf\//] =  function(uri, matches, vocModel) {
    return G.serverName + '/' + uri;
  };
  // sql/...?...
  patterns[/^sql\/.*/] = function(uri, matches, vocModel) {
    return G.serverName + '/' + uri;
  };
  // http://.../voc/... with query string or without
  patterns[/^http:\/\/([^\?]+)\??(.*)/] = function(uri, matches, vocModel) {
    var sqlIdx = matches[1].indexOf(G.sqlUri);
    if (sqlIdx === -1) { // sth like http://www.hudsonfog.com/voc/commerce/urbien....
      if (matches[2]) // has query string
        return G.sqlUrl + '/' + uri.slice(7);
      else
        return uri;
    }
    else { // has sql
      return uri;
    }
  };
  // commerce/urbien/Tree?...
  patterns[/^([a-z]+[^\?]+)\??(.*)/] = function(uri, matches, vocModel) {
    if (matches[2])
      return G.sqlUrl + '/www.hudsonfog.com/voc/' + uri;
    else
      return G.defaultVocPath + uri;
  };
  
  for (var pattern in patterns) {
    var fn = patterns[pattern];
    fn.regExp = new RegExp(pattern.slice(1, pattern.length - 1));
  }
  
  U.invalid = {};
  (function() {
    var common = 'Please enter a';
    var i = U.invalid;
    i['int'] = common + 'n integer';
    i['float'] = i['double'] = common + ' number';
  })();
  
  return (Lablz.U = U);
});
