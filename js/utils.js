//'use strict';
define([
  'globals',
  'underscore',
  'backbone',
  'templates',
  'jquery',
  'cache',
  'events'
], function(G, _, Backbone, Templates, $, C, Events) {
  var ArrayProto = Array.prototype, slice = ArrayProto.slice;
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

  String.prototype.splitCamelCase = function(capitalFirst) {
      // insert a space before all caps
    var split = this.replace(/([A-Z])/g, ' $1');
      // uppercase the first character
    return capitalFirst ? split.replace(/^./, function(str){ return str.toUpperCase(); }) : split;
  };

  String.prototype.endsWith = function(str) {
    return this.slice(this.length - str.length) === str;
  };
  
  // extends jQuery to check if selected collection is empty or not
  $.fn.exist = function(){
    return this.length > 0 ? this : false;
  };

  var U = {
    TAG: 'Utils',
    require: function(modules, callback, context) {
      modules = $.isArray(modules) ? modules : [modules];
      var mods = [], newModNames = [], newModFullNames = [];
      for (var i = 0; i < modules.length; i++) {
        var fullName = modules[i], name = fullName;
        if (!fullName)
          G.log(U.TAG, 'error', 'match undefined 1');
        var moduleViaPlugin = fullName.match(/\!(.*)$/);
        if (moduleViaPlugin) {
          name = moduleViaPlugin[1]; 
        }
        
        var mod = C.modCache[name];
        if (!mod) {
          mod = C.modCache[name] = $.Deferred();
          newModFullNames.push(fullName);
          newModNames.push(name);
        }
        
        mods.push(mod);
      }
      
      if (newModNames.length) {
        G.loadBundle(newModNames, function() {
          require(newModFullNames, function() {
            for (var i = 0; i < newModNames.length; i++) {
              C.modCache[newModNames[i]].resolve(arguments[i]);
            }          
          });
        });
      }
      
      return $.when.apply($, mods).then(function() {
        callback && callback.apply(context, arguments);
      }).promise();
    },
    
    ajax: function(options) {
      var hasWebWorkers = G.hasWebWorkers;
      var opts = _.clone(options);
      opts.type = opts.method || opts.type;
      // TODO: remove
      if (opts.url.indexOf('backboneModel') >= 0 && opts.type !== 'POST')
        debugger;
        
      opts.dataType = opts.dataType || 'JSON';
      var useWorker = hasWebWorkers && !opts.sync;
      return new $.Deferred(function(defer) {
        if (opts.success) defer.done(opts.success);
        if (opts.error) defer.fail(opts.error);
        if (useWorker) {
          G.log(U.TAG, 'xhr', 'webworker', opts.url);
          var workerPromise = G.getXhrWorkerPromise();
          workerPromise.done(function(xhrWorker) {          
            xhrWorker.onmessage = function(event) {
              var xhr = event.data;
              var code = xhr.status;
              if (code === 304) {
  //              debugger;
                defer.reject(xhr, "unmodified", "unmodified");
              }
              else if (code > 399 && code < 600) {
                var text = xhr.responseText;
                if (text && text.length) {
                  try {
                    defer.reject(xhr, JSON.parse(xhr.responseText), opts);
                    return;
                  } catch (err) {
                  }
                }
                  
                defer.reject(xhr, "error", opts);
              }
              else {
                defer.resolve(xhr.data, xhr.status, xhr);
              }
            };
            
            xhrWorker.onerror = function(err) {
  //            debugger;
              defer.reject({}, "error", err);
            };
            
            defer.always(function() {
              G.recycleXhrWorker(xhrWorker);
            });
  
            xhrWorker.postMessage(_.pick(opts, ['type', 'url', 'data', 'dataType', 'headers']));
          });
        }
        else {
          G.log(U.TAG, 'xhr', '$.ajax', opts.url);
          $.ajax(_.pick(opts, ['timeout', 'type', 'url', 'headers', 'data', 'dataType'])).then(function(data, status, jqXHR) {
//            debugger;
            if (status != 'success') {
              defer.reject(jqXHR, status, opts);
              return;
            }
            
            if (jqXHR.status === 200) {
              defer.resolve(data, status, jqXHR);
              return;
            }
            
            if (data && data.error) {
              defer.reject(jqXHR, data.error, opts);
              return;
            }
            
            defer.reject(jqXHR, {code: jqXHR.status}, opts);                  
          }, 
          function(jqXHR, status, err) {
//            debugger;
            var text = jqXHR.responseText;
            var error;
            if (text && text.length) {
              try {
                error = JSON.parse(text).error;
              } catch (err) {
              }
            }
            
            error = error || {code: jqXHR.status, details: err};
            defer.reject(jqXHR, error, opts);
          });
        }
      }).promise();
    },
    
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
    
    getTypes: function(vocModel) {
      vocModel = U.isCollection(vocModel) || U.isModel(vocModel) ? vocModel.vocModel : vocModel;
      return _.union(vocModel.type, vocModel.superClasses || []);
    },
    
    getUserRole: function() {
      return G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
    },
    
    isUserInRole: function(userRole, ar, res) {
      if (userRole == 'guest')
        return false;
      if (userRole == 'admin')
        return true;
      var vocModel = res && res.constructor;
      var me = G.currentUser._uri;
      var resUri;
      if (U.isCollection(res))
        resUri = null; //res.models[0].getUri();
      else  
        resUri = res.getUri();
      var iAmRes = me === resUri;
      var roles = typeof ar === 'array' ? ar : ar.split(",");
      for (var i = 0; i < roles.length; i++) {
        var r = roles[i].trim();
        if (_.contains(['siteOwner'], r)  &&  userRole == r) 
          return true;
        else if (r === 'owner') {
          continue; // TODO: implement this
        }
        else {
          if (r === 'self') { 
            if (iAmRes) return true;
          }
          else if (r.endsWith('self')){
            r = r.split('==');
            var pName = r[0].trim();
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
      if (!hash)
        G.log(U.TAG, 'error', 'match undefined 0');
      
      if (hash.startsWith('templates')) {
//        hash = U.decode(hash.slice(10));
        return G.commonTypes.Jst;
      }
      
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
    
//    /**
//     * @param prop
//     * @param iProp sth like "Submission.submittedBy"
//     */
//    isCloneOf: function(prop, iPropName) {//, vocModel) {
//      var cloneOf = prop.cloneOf;
//      return _.contains(cloneOf.split(','), iPropName);
//      var subPropertyOf = prop.subPropertyOf;
//      if (cloneOf) {
//        cloneOf = cloneOf.split(',');
//        for (var i = 0; i < cloneOf.length; i++) {
//          if (cloneOf[i] === iPropName)
//            return true;
//        }
//      }
//      else if (subPropertyOf && vocModel) // This only works if we have all superclass props on subclass
//        return U.isCloneOf(vocModel[U.getLongUri1(subPropertyOf)], slice.call(arguments, 1));
//      
//      return false;
//    },
    
    isCreatable: function(type, userRole) {
      if (G.currentUser.guest)
        return false;
      
      if (type.startsWith(G.defaultVocPath + 'system/designer/'))
        return true;
      
      userRole = userRole || U.getUserRole();
      var urbienModel = U.getModel(G.commonTypes.Urbien);
      var backlinks = U.getPropertiesWith(urbienModel.properties, [{name: "backLink"}, {name: 'range', values: [type, type.slice(type.indexOf('/voc/') + 5)]}]);
      if (!_.size(backlinks))
        return false;
      
      for (var blName in backlinks) {
        var blProp = backlinks[blName];
        if (!U.isPropEditable(U.mimicResource(G.currentUser), blProp, userRole))
          return false;
      }
      
      return true;
    },
    
    mimicResource: function(json) {
      return {
        get: function(prop) {
          return json[prop];
        },
        getUri: function() {
          return json._uri;
        }
      }
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
      
      var resExists = !!res.getUri();
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
      return prop && !prop.backLink && prop.range && prop.range.indexOf('/') != -1 && !U.isInlined(prop);
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
      var size = _.size(results);
      return size === 1 ? results[U.getFirstProperty(results)] : size === 0 ? [] : results;
    },
    
    isCloneOf: function(prop, iPropName, vocModel) {
      if (typeof prop === 'string')
        prop = vocModel.properties[prop];
      
      return prop.cloneOf && _.any(prop.cloneOf.split(','), function(name) {
        return name == iPropName;
      });
    },
    
    getLongUri1: function(uri, vocModel) {
      if (!uri) {
        G.log(U.TAG, 'error', 'null passed to getLongUri1');
        return uri;
      }

      for (var pattern in U.uriPatternMap) {
        var fn = U.uriPatternMap[pattern];
        var match = uri.match(fn.regExp);
        if (match && match.length) {
          return fn(uri, match, vocModel);
        }
      }
      
      if (uri == '_me') {
        if (G.currentUser.guest)
          throw new Error("user is not logged in");
        else
          return G.currentUser._uri;
      }
      
      G.log(U.TAG, 'info', 'couldnt derive long uri for ' + uri);
      return uri;
//      throw new Error("couldn't parse uri: " + uri);
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
        var vocModel = U.getModel(typeName);
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
      if (!uri || model.properties._shortUri == 'unsupported')
        return uri;
        
      var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
      if (!uri) {
        G.log(U.TAG, 'error', 'match undefined 3');
        console.trace();
      }

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
//      var m = U.getModel(superCl);
//      return m ? U.isA(m, leftOver) : impl;
    },
    
    getPackagePath: function(type) {
//      if (type == 'Resource' || type.endsWith('#Resource'))
//        return 'packages';
      
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
    
    //U.toQueryString: function(params) {
    //  var qStr = '';
    //  _.forEach(params, function(val, key) { // yes, it's backwards, not function(key, val), underscore does it like this for some reason
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
     *         if getQueryParams(params, model), return filtered map of query params that are model properties
     *         if getQueryParams(collection), return map of query params from collection.params that correspond to collection's model's properties
     */
    getQueryParams: function() {
      var args = arguments, model, collection, params, url;
      model = collection = params = url = args.length && args[0];
      if (!url || typeof url === 'string') {
        params = U.getParamMap(url || window.location.href);
        return args.length > 1 ? U.getQueryParams(params, slice.call(args, 1)) : params;
      }

      if (U.isCollection(model)) { // if it's a collection
        params = collection.params;
        model = collection.model;
      }
      else if (model instanceof Backbone.Model) {
        return {};
      }
      else {
        if (args.length > 1)
          model = typeof args[1] === 'function' ? args[1] : args[1].constructor;
        else {
          return U.filterObj(params, function(name, val) {
            if (!name)
              G.log(U.TAG, 'error', 'match undefined 4');

            return name.match(/^[a-zA-Z]+/);
          });
//          throw new Error('missing parameter "model"');
        }
      }
      
      var filtered = {};
      var meta = model.properties;
      var whereParams = U.whereParams;
      for (var p in params) {
        if (meta[p] || whereParams[p])
          filtered[p] = params[p];
      }
  
      return filtered;
    },
    
    filterInequalities: function(params, vocModel) {
      var query = $.param(params);
      var parsed = U.parseAPIQuery(query, '&');
      var filtered = {};
      _.each(parsed, function(clause) {
        if (clause.op === '==')
          filtered[clause.name] = clause.value;
      });
      
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
        if (nv.length == 2)
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
    
   getCurrentAppProps: function(meta) {
      var app = U.getArrayOfPropertiesWith(meta, "app"); // last param specifies to return array
      if (!app  ||  !app.length) 
        return null;
//    var appGroups;
      var currentAppProps;
      for (var j=0; j<app.length; j++) {
        var appNames = app[j].app;
        var s = appNames.split(',');
        for (var i=0; i<s.length; i++) {
  //        var a;
  //        if (!appGroups) 
  //          appGroups = {};
  //        a = appGroups[s[i]];
  //        if (!a)
  //          appGroups[s[i]] = [];
  //        a = appGroups[s[i]];
  //        a.push(app[j].shortName);
          if (s[i] == G.appName) {
            if (!currentAppProps)
              currentAppProps = [];
            currentAppProps.push(app[j].shortName);      
          }
        }
      }
      return currentAppProps;
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
    
    /**
     * @params (resource or resource.attributes, [model or model.properties])
     */
    getDisplayName: function(resource, vocModel) {
      var dn = U.getValue(resource, 'davDisplayName');
      if (dn)
        return dn;
      
      var meta;
      if (typeof vocModel === 'function') {
        meta = vocModel.properties;
      }
      else {
        meta = vocModel;
        vocModel = resource.vocModel || null;
        meta = meta || vocModel && vocModel.properties;
      }
        
      var dnProps = U.getDisplayNameProps(meta);
      var dn = '';
      if (!dnProps  ||  dnProps.length == 0) {
        var uri = U.getValue(resource, '_uri');
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
            value = U.getValue(resource, shortName);
        
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

    getTemplate: function() {
      return Templates.get.apply(Templates, arguments);
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
      return (tmpl) ? U.template(_.template(tmpl)) : null;
    },
    /// String prototype extensions
    
    getQueryString: function(paramMap, options) {
      options = options || {};
      if (!options.sort) {
        var result = $.param(paramMap);
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
      var date = U.getFormattedDate(now + time).toLowerCase();
      if (date === 'just now')
        return 'none';
      else if (date.startsWith("in "))
        return date.slice(3);
      else if (date.endsWith(" ago"))
        return date.slice(0, date.length - 4);
      else if (date === 'tomorrow')
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
      var day_diff = diff / 86400;
      day_diff = day_diff >= 0 ? Math.floor(day_diff) : Math.ceil(day_diff);
          
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
        return str;
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
      return _.map(data instanceof Backbone.Collection ? data.models : [data], function(m) {return m.getUri()});
    },
    
    isCollection: function(res) {
      return res instanceof Backbone.Collection;
    },

    isModel: function(res) {
      return res instanceof Backbone.Model;
    },

    getInlineResourceModel: function(type) {
      return C.shortNameToInline[type] || C.typeToInline[type];      
    },

    getEnumModel: function(type) {
      return C.shortNameToEnum[type] || C.typeToEnum[type];      
    },
    
    getModel: function() {
      var arg0 = arguments[0];
      var argType = U.getObjectType(arg0);
      switch (argType) {
      case '[object String]':
        var model = C.shortNameToModel[arg0] || C.typeToModel[arg0];
        if (model != null)
          return model;
        
        if (arg0.indexOf('/') != -1) {
          var longUri = U.getLongUri1(arg0);
          if (longUri !== arg0)
            return U.getModel(longUri);
        }
        
        return null;
//            throw new Error("invalid argument, please provide a model shortName, type uri, or an instance of Resource or ResourceList");            
      case '[object Object]':
        return arg0.vocModel; //U.isCollection(arg0) ? arg0.model : arg0.constructor;
      default:
        throw new Error("invalid argument, please provide a model shortName, type uri, or an instance of Resource or ResourceList");
      }
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
    
    getValueDisplayName: function(res, propName) {
      var prop = res.vocModel.properties[propName];
      return prop && (U.isResourceProp(prop) ? res.get(propName + '.displayName') : res.get(propName));
    },
    
    makeOrGroup: function() {
      return slice.call(arguments).join('||');
    },
    
//    isAllowed: function(action, type) {
//      if (!U.isAnAppClass(type))
//        return true; // for now
//      
//      if (action === 'edit')
//        return true; // for now;
//      
//      var app = type.slice(type.indexOf(''));
//    },
    
    /**
     * @param className: class name or uri
     */
    isAssignableFrom: function(model, className) {
      model = U.isModel(model) || U.isCollection(model) ? model.vocModel : model;
      if (model.type == className ||  model.shortName == className || U.isA(model, className))
        return true;
      
      var supers = model.superClasses;
      return _.any(supers, function(s) {return s == className || s.endsWith("/" + className)});
      
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
//        m = U.getModel(subClassOf);
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
      if (prop.code) {
        val = '<textarea id="{0}" data-code="{1}" name="code" readonly="readonly" onfocus="this.blur()">{2}</textarea>'.format(G.nextId() + propName, prop.code, prop.code === 'html' ? U.htmlEscape(val) : val);
//        val = '<div id="{0}_numbers" style="float: left; width: 2em; margin-right: .5em; text-align: right; font-family: monospace; color: #CCC;"></div>'.format(propName) 
//            + '<pre>{0}</pre>'.format(prop.code === 'html' ? U.htmlEscape(val) : val);
      }
      
      var displayName = res.get(propName + '.displayName');
      if (displayName)
        val = {value: val, displayName: displayName};
      else
        val = {value: val};
      
      var propTemplate = Templates.getPropTemplate(prop);
//      if (propTemplate == 'stringPT'  &&  prop.maxSize  &&  prop.maxSize > 1000)
//        propTemplate = 'longStringPT';
      var rules = {};
      if (prop.code)
        rules['data-code'] = prop.code;
      
      rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      return {name: U.getPropDisplayName(prop), value: U.template(propTemplate)(val), shortName: prop.shortName, rules: rules};
    },
    
    makePageUrl: function() {
      return G.pageRoot + '#' + U.makeMobileUrl.apply(this, arguments);
    },
    
    getAppPathFromTitle: function(title) {
      return title.replace(/-/g, '_').replace(/[^a-z_1-9eA-Z]/g, '');
    },
    
    /**
     * @return the value of the app's App._appPath property, sth like AppName
     */
    getAppPath: function(type) {
      var sIdx = type.lastIndexOf('/');
      return type.slice(type.lastIndexOf('/', sIdx - 1) + 1, sIdx);
    },

    /**
     * @return the value of the app's App._name property, sth like urbien/voc/dev/AppName 
     */
    getAppName: function(type) {
      return 'urbien/voc/dev' + type.slice(type.lastIndexOf('/'));
    },

    makeMobileUrl: function(action, typeOrUri, params) {
      action = action || 'list';
      if (U.isModel(action))
        return U.makeMobileUrl('view', action.getUri());
        
      if (U.isModel(typeOrUri))
        typeOrUri = typeOrUri.getUri();
      else if (U.isCollection(typeOrUri)) {
        var col = typeOrUri;
        typeOrUri = col.vocModel.type;
        params = _.extend({}, col.params, params);
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
      
//      var encOptions = {delimiter: '&amp;'};
      url += encodeURIComponent(typeOrUri);
      if (_.size(params))
        url += '?' + U.getQueryString(params); //, encOptions);
      
      return url;
    },
    
    makeEditProp: function(res, prop, val, formId) {
      var p = prop.shortName;
      val = typeof val === 'undefined' ? res.get(p) : val;
      var propTemplate = Templates.getPropTemplate(prop, true, val);
      if (typeof val === 'undefined')
        val = {};
      else {
        val = U.getTypedValue(res, p, val);
        var dn = res.get(p + '.displayName');
        if (dn)
          val = {value: val, displayName: dn};
        else
          val = {value: val};
      }
      
      var isEnum = propTemplate === 'enumPET';      
      if (isEnum) {
        var facet = prop.facet;
        var eCl = U.getEnumModel(U.getLongUri1(facet));
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
      if (prop.multiValue)
        val.multiValue = true;
      var rules = prop.multiValue  &&  !val.value ? {} : {"data-formEl": true};
      if (prop.required)
        rules.required = 'required';
      if (prop.maxSize)      
        rules.maxlength = prop.maxSize;
      if (prop.code)
        rules['data-code'] = prop.code;
      
      if (U.isDateProp(prop))
        rules['data-date'] = true;
      else if (U.isTimeProp(prop))
        rules['data-duration'] = true;
      else if (U.isEnumProp(prop))
        rules['data-enum'] = true;
            
//      val.classes = classes.join(' ');
      val.rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      if (prop.comment)
        val.comment = prop.comment;
      var propInfo = {value: U.template(propTemplate)(val)};
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
//      return model instanceof Backbone.Model ? 'view/' + U.encode(model.getUri()) : model instanceof Backbone.Collection ? model.model.shortName : G.homePage;
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
     * @param res Resource (Backbone.Model) instance or model
     * @param prop name of the property
     * @param property value 
     */
    getTypedValue: function(res, prop, value) {
      var vocModel = res.vocModel || res;
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

    getFirstValue: function(obj) {
      for (var name in obj) {
        return obj[name];
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
         
    /**
     * @param name: name or resource
     */
    getPlural: function(name) {
      if (U.isModel(name) || U.isCollection(name)) {
        var pName = name.vocModel.pluralName;
        if (pName)
          return pName;
        
        name = name.displayName;
      }
      
      for (var i = 0; i < U.plural.length; i++) {
        var regex          = U.plural[i][0];
        var replace_string = U.plural[i][1];
        if (regex.test(name)) {
          return name.replace(regex, replace_string);
        }
      }
      
      return name + 's';
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
    
    getHash: function(decode) {
      var match = (window || this).location.href.match(/#(.*)$/);
      var hash = match ? match[1] : '';      
      return decode ? decodeURIComponent(hash) : hash;
    },
    
    prepForSync: function(item, vocModel, preserve) {
      preserve = preserve || [];
      var props = vocModel.properties;
      var filtered = U.filterObj(item, function(key, val) {
        if (/\./.test(key))
          return false;
        var prop = props[key];
        return prop && !U.isSystemProp(key) && 
            (_.contains('backLink', preserve) || !prop.backLink) && 
            (U.isResourceProp(prop) || (_.contains('readOnly', preserve) || !prop.readOnly)) && // sometimes if it's readOnly, we still need it - like if it's a backlink
            /^[a-zA-Z]+[^\.]*$/.test(key);  // is writeable, starts with a letter and doesn't contain a '.'
      }); 
      
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
      
      if (!date)
        G.log(U.TAG, 'error', 'match undefined 5');
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
    isTempResource: function(res) {
      return U.isTempUri(res.getUri());
    },
    isTempUri: function(uri) {
      return uri && uri.indexOf("?__tempId__=") != -1;
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
    },
    
    DEFAULT_WHERE_OPERATOR: '==',
    whereParams: {
      $or: '||', 
      $like: '&', 
      $in: ',', 
      $and: '&'
    },
    
    parseAPIClause: function(clause, vocModel) {
      var name, opVal, op, val, numArgs = arguments.length;
      switch (numArgs) {
      case 1:
        clause = clause.split('=');
        name = decodeURIComponent(clause[0]);
        opVal = decodeURIComponent(clause[1]);
        break;
      case 2:
        name = clause;
        opVal = arguments[1];
        break;
      case 3:
        name = arguments[0];
        op = arguments[1];
        val = arguments[2];
        break;
      }
        
      if (numArgs != 3) {
        if (!opVal)
          G.log(U.TAG, 'error', 'match undefined 6');

        opVal = opVal.match(/^([>=<!]{0,2})(.+)$/);
        if (!opVal || opVal.length != 3)
          return null;
      
        op = opVal[1] || U.DEFAULT_WHERE_OPERATOR;
        val = opVal[2];
      }
      
      if (op === '!')
        op = '!=';
      else if (op === '=')
        op = '==';
        
      if (name.startsWith('$')) {
//        var whereParam = U.filterObj(U.whereParams, function(param, delimiter) {
//          return name.startsWith(param);
//        });
//        
//        if (_.size(whereParam)) {
//          whereParam = U.getFirstProperty(whereParam);
//          var subClause = val.split('=');
//          if (subClause.length == 2 && subClause[0] === whereParam) {
//            debugger;
//            subClause = U.parseAPIQuery(subClause[1], U.whereParams[whereParam]);
//            var sVal = {};
//            sVal[whereParam] = subClause;
//            val = sVal;
//          }
//        }
//        else 
        if (name.startsWith('$this.')) {
          debugger;
          name = name.slice(6);
        }
      }
        
      return {
        ___query___: true,
        name: name, 
        op: op || U.DEFAULT_WHERE_OPERATOR, 
        value: val
      };
    },

    parseAPIQuery: function(query, delimiter) {
      var result = [];
      var type = U.getObjectType(query);
      switch (type) {
        case '[object Object]':
          var q = [];
          for (var p in query) {
            var one = {};
            one[p] = query[p];
            q.push($.param(one));
          }
          
          query = q;
          break;
        case '[object String]':
          query = query.split(delimiter || '&');
          break;
        default:
          throw new Error('query must be either a query string or a parameter map');
      }
      
      for (var i = 0; i < query.length; i++) {
        var clause = U.parseAPIClause(query[i]);
        if (!clause) {
          G.log(U.TAG, 'error', 'bad query: ' + query[i]);          
          return null;
        }
        
        result.push(clause);
      }
      
      return result;
    },
    
    buildValueTester: function(params, vocModel) {
      var rules = [], meta = vocModel.properties;
      var query = U.parseAPIQuery(params);
      _.each(query, function(clause) {
        var param = clause.name;
        switch (param) {
        case '$or':
        case '$and':
          var chainFn = param === '$or' ? _.any : _.all;
          var subq = U.parseAPIQuery(clause.value, U.whereParams[param]);
          var tests = _.map(subq, function(subClause) {
            switch (subClause.name) {
              case '$or':
              case '$and':
              case '$in':
                var prms = {};
                prms[subClause.name] = subClause.value;
                return U.buildValueTester(prms, vocModel);
            }
            
            if (subClause.name.startsWith('$')) {
              debugger;
              return function() {return true};
            }
            
            return U.makeTest(meta[subClause.name], subClause.op, subClause.value);
          });
          
          rules.push(function(val) {
            return chainFn(tests, function(test) {
              return test(val);
            });
          });
          
          break;
        case '$in':
          var or = {};
          var values = clause.value.split(',');
          var propName = values[0];
          var prop = meta[propName];
          if (!prop) {
            debugger;
            return function() {return true};
          }
          
          values = values.slice(1);
          var chain = [];
          for (var i = 1; i < values.length; i++) {
            var test = U.makeTest(prop, U.DEFAULT_WHERE_OPERATOR, values[i]);
            chain.push(test);
          }
          
          rules.push(function(val) {
            return _.any(chain, function(test) {
              return test(val);
            });
          });
          
          break;
        case '$like':
          var nameVal = clause.value.split(',');
          var propName = nameVal[0];
          var prop = meta[propName];
          if (!prop) {
            debugger;
            return function() {return true};
          }
          
          var value = nameVal[1].toLowerCase();
          var chain = [];
          rules.push(function(res) {
            var val = res[propName];
            return val && val.toLowerCase().indexOf(value) != -1;
          });
          
          break;
        default:
          if (param.startsWith('$'))
            break;
          
          var prop = meta[param];
          if (!prop || U.getObjectType(clause) !== '[object Object]') {
            G.log(U.TAG, 'info', 'couldnt find property {0} in class {1}'.format(param, vocModel.type));
            return function() {
              return true;
            }
          }
          
          rules.push(U.makeTest(meta[param], clause.op, clause.value));          
          break;
        }
      });
      
      return function(val) {
        for (var i = 0; i < rules.length; i++) {
          if (!rules[i](val))
            return false;
        }
        
        return true;
      }
    },
    
    makeTest: function(prop, op, bound) {
      if (arguments.length == 1) {
        op = prop.op;
        bound = prop.value;
        prop = prop.name;
      }
      
      if (!prop)
        return function() {return true};
        
      if (U.isResourceProp(prop) && bound === '_me') {
        if (G.currentUser.guest) {
          Events.trigger('req-login'); // exit search?
          return function() {return true};
        }
        else
          bound = G.currentUser._uri;
      }

      var range = prop.range;
      var name = prop.shortName;
      var falsy = function(res) {
        return U.isFalsy(U.getValue(res, name), range);
      }
      var truthy = function(res) {
        return !U.isFalsy(U.getValue(res, name), range);
      }
      
      if (bound === 'null')
        return (op === '==') ^ U.isFalsy(bound, range) ? truthy : falsy; // XOR
      
      switch (range) {        
        case 'boolean':
          return (op === '==') ^ U.isFalsy(bound, range) ? truthy : falsy; // XOR
        case 'date':
        case 'dateTime':
        case 'ComplexDate':
          try {
            bound = U.parseDate(bound);
          } catch (err) {
            G.log(U.TAG, 'error', "couldn't parse date bound: " + bound);
            return function() {return true};
          }
          // fall through to default
        default: {
          return function(res) {
            try {
              return new Function("a", "b", "return a {0} b".format(op))(U.getValue(res, name), bound);
            } catch (err){
              return false;
            }
          };
        }
      }
    },

    template: function(templateName, type, context) {
      var template;
      if (typeof templateName === 'string') {
        template = Templates.get(templateName, type);
        if (!template)
          return null;
        
        template = _.template(U.removeHTMLComments(template));
      }
      else
        template = templateName;
      
      context = context || this;
      return function(json) {
        json = json || {};
        if (!_.has(json, 'U'))
          json.U = U;
        if (!_.has(json, 'G'))
          json.G = G;
        if (!_.has(json, '$'))
          json.$ = $;
        
        return template.call(context, json);
      };
    },
    
    getOrderByProps: function(collection) {
      var orderBy = collection.params.$orderBy;
      if (orderBy)
        return [orderBy];
        
      var props = U.getPropertiesWith(meta, [{name: "sortAscending"}]);
      if (props) {
        props = U.filterObj(props, function(name, prop) {
          return !prop.backLink;
        });
        
        if (props)
          return _.keys(props);
      }
      
      return null;
    },
    
    synchronousTypes: [
      'aspects/commerce/Transaction', 
      'commerce/coupon/Deposit', 
      'model/social/AppInstall',
      'model/social/PushoverAccess'
    ],
    
    canAsync: function(type) {
//      if (true)
//        return true; // till we decide if this is really necessary
      
      if (typeof type !== 'string')
        type = type.type; // if it's vocModel
      
      if (type.startsWith('http://'))
        type = type.slice(type.indexOf('voc/') + 4);
      
      return !_.contains(U.synchronousTypes, type);
    },
    
    pipe: function(defer1, defer2) {
      defer1.done(defer2.resolve).fail(defer2.reject);
      return defer2.promise();
    },
    
    trim: function(text, length) {
      if (!text)
        return '';
      
      if (text.length < length)
        return text;
      
      return text.slice(0, length) + '...';
    },

    fixResourceJSON: function(item, vocModel) {
      var meta = vocModel.properties;
      for (var p in item) {
        if (!/_/.test(p) && !meta[p])
          delete item[p];
      }
    },
    
    /**
     * @param from - attributes object
     * @param to - attributes object
     * @prop - string name of property
     * 
     * given prop is sth like 'submittedBy', copies props like submittedBy.displayName, submittedBy.thumb from "from" to "to" 
     */
    copySubProps: function(from, to, prop) {
//      if (from.davDisplayName)
//        to[prop + '.displayName'] = from.davDisplayName;
//      
//      var type = U.getTypeUri(from._uri);
//      var model = U.getModel(type);
//      if (model) {
//        var ir = 'ImageResource'; 
//        if (U.isA(model, ir)) {
//          var iProps = _.map(['smallImage', 'mediumImage'], function(ip) {return '{0}.{1}'.format(ir, ip)});
//          var imgProps = U.getCloneOf(model, iProps);
//          if (imgProps.length) {
//            _.each(imgProps, function(imgProp) {              
//              var resProp = '{0}.{1}'.format(prop, imgProp);
//              var val = from[resProp];
//              if (val)
//                to[resProp] = val;
//            });
//          }
//        }
//      }
      
      var start = prop + '.';
      for (var p in from) {
        if (p.startsWith(start))
          to[p] = from[p];
      }
    },
    
    __htmlCommentRegex: /\<![ \r\n\t]*--(([^\-]|[\r\n]|-[^\-])*)--[ \r\n\t]*\>/,
    __htmlCommentRegexGM: /\<![ \r\n\t]*--(([^\-]|[\r\n]|-[^\-])*)--[ \r\n\t]*\>/gm,
    __jsCommentRegex: /(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/,
    __jsCommentRegexGM: /(?:\/\*(?:[\s\S]*?)\*\/)|(?:\/\/(?:.*)$)/gm,
    getHTMLComments: function(str) {
      var matches = str.match(U.__htmlCommentRegex);
      return matches && matches.slice(1);
    },
    removeHTMLComments: function(str) {
      return str.replace(U.__htmlCommentRegexGM, '');
    },

    getJSComments: function(str) {
      var matches = str.match(U.__jsCommentRegex);
      return matches && matches.slice(1);
    },

    removeJSComments: function(str) {
      return str.replace(U.__jsCommentRegexGM, '');
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
    
    getRequiredCodemirrorModes: function(vocModel) {
      var codeProps = U.getPropertiesWith(vocModel.properties, 'code');
      var scriptTypes = [];
      var codemirrorModes = [];
      for (var cp in codeProps) {
        var code = codeProps[cp].code;
        switch (code) {
          case 'html':
            codemirrorModes.push('codemirrorXMLMode');
            codemirrorModes.push('codemirrorHTMLMode');
            break;
          case 'css':
            codemirrorModes.push('codemirrorCSSMode');
            break;
          case 'js':
            codemirrorModes.push('codemirrorJSMode');
            break;
        }
      }
      
      codemirrorModes = _.uniq(codemirrorModes);
      return codemirrorModes;
    },
    
    getListParams: function(resource, backlinkProp) {
      var params = {};
      params[backlinkProp.backLink] = resource.getUri();
      if (backlinkProp.where)
        _.extend(params, U.getQueryParams(backlinkProp.where));
      if (backlinkProp.whereOr)
        params.$or = backlinkProp.whereOr;
      
      return params;
    },
    
    getChanges: function(prev, now) {
      var changes = {};
      for (var prop in now) {
        if (!prev || prev[prop] !== now[prop]) {
          if (typeof now[prop] == "object") {
            var c = U.getChanges(prev[prop], now[prop]);
            if (! _.isEmpty(c) ) // underscore
              changes[prop] = c;
          } else {
            changes[prop] = now[prop];
          }
        }
      }
      
      return changes;
    },

    getClassDisplayName: function(uri) {
      if (typeof uri === 'string') {
        uri = U.getTypeUri(uri);
        var model = U.getModel(uri);
        if (model)
          return model.displayName;
        else
          return U.getClassName(uri).splitCamelCase();
      }
      else
        return uri.displayName;
    },
    
    removeHTML: function(str) {
      return str.replace(/(<([^>]+)>)/ig, '');
    },
    DEFAULT_HTML_PROP_VALUE: '<!-- put your HTML here buddy -->',
    DEFAULT_JS_PROP_VALUE: '/* put your JavaScript here buddy */',
    DEFAULT_CSS_PROP_VALUE: '/* put your CSS here buddy */'
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
