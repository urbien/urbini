define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!error', 
  'cache!events', 
  'cache!models/Resource', 
  'cache!collections/ResourceList', 
  'cache!indexedDBShim',
  'cache!queryIndexedDB'
], function(G, $, __jqm__, _, Backbone, U, Error, Events, Resource, ResourceList, __idbShim__, idbq) {
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };

  Index = idbq.Index;
  G.classUsage = _.map(G.classUsage, U.getTypeUri);
  var Voc = {
    packages: {Resource: Resource},
    models: [],
    changedModels: [],
    newModels: [],
    models: [Resource],
    shortNameToModel: {Resource: Resource},
    typeToModel: {},
    shortNameToEnum: {},
    typeToEnum: {},
    fetchModels: function(models, options) {
      models = models ? (typeof models === 'string' ? [models] : models) : _.union(Voc.changedModels, Voc.newModels);      
      options = options || {};
      var success = options.success;
      var error = options.error || Error.getDefaultErrorHandler();
      
      function earlyExit() {
        if (success && !options.skipSuccessIfUpToDate)
          success({fetched: 0});
        
        return true;
      }
      
      if (!models.length)
        return earlyExit();
      
      var c = Voc.currentModel;
      var urgent = options.sync && models.length > 1 && c && !Voc.typeToModel[c] && c;
      if (urgent) {
        urgent = Voc.getStaleModels([urgent]);
        if (urgent.length) {
          urgent = urgent[0];
          options.success = function() {
            if (success)
              success();
            
            models = _.filter(models, function(m) {
              return (m.type || m) != urgent;
            });
            
            options.sync = false;
            options.success = success;
            setTimeout(function() {Voc.fetchModels(models, options)}, 100);
          }
          
          Voc.fetchModels(urgent, options);
          return;
        }
      }
      
      if (!models.length)
        return earlyExit();
      
      if (!G.online) {
        if (error)
          error(null, {type: 'offline'}, options);
        
        return;
      }
      
      models = Voc.getStaleModels(models);      
      var modelsCsv = JSON.stringify(models);
      G.startedTask("ajax models");
      var useWorker = G.hasWebWorkers && !options.sync;
      var complete = function() {
        var xhr = arguments[0];
        if (xhr.status == 304) {
          success && success({fetched: 0});
          return;
        }
        
        if (useWorker) {
          // XHR          
          data = xhr.data;
        }
        else {                                
          // $.ajax
          var status = arguments[1];
          if (status != 'success') {
            G.log(Voc.TAG, 'error', "couldn't fetch models");
            onErr(arguments[0].status);
            return;
          }
          
          var responseText = xhr.responseText;
          try {
            data = JSON.parse(responseText);
          } catch (err) {
            G.log(Voc.TAG, 'error', "couldn't eval JSON from server. Requested models: " + modelsCsv);
            error(null, null, options);            
            return;
          }
        }
        
        if (!data)
          debugger;
        
        if (data.error) {
          onErr(data.error.code);
          return;
        }
        
        var mz = data.models;
        var pkg = data.packages;
        if (pkg)
          U.deepExtend(Voc.packages, pkg);
        
        G.classUsage = _.union(G.classUsage, _.map(data.classUsage, U.getTypeUri));          
        G.linkedModels = _.map(data.linkedModels, function(m) {return _.extend(m, {type: U.getTypeUri(m.type)})}); //_.union(G.linkedModels, data.linkedModels);
        if (_.uniq(G.linkedModels).length != G.linkedModels.length)
          debugger;
        
        if (data.classMap)
          _.extend(G.classMap, data.classMap)
        
        var newModels = [];
        for (var i = 0; i < mz.length; i++) {
          var newModelJson = mz[i];
          var p = newModelJson.path;
          var lastDot = p.lastIndexOf('.');
          var path = p.slice(0, lastDot);
          var name = p.slice(lastDot + 1);
          var sup = newModelJson.sPath;
          
          // mz[i].p and mz[i].s are the private and static members of the Backbone.Model being created
          var newModel;
          if (newModelJson.s.enumeration)
            newModel = Backbone.Model.extend(newModelJson.p, newModelJson.s);
          else
            newModel = U.leaf(Voc.packages, path)[name] = U.leaf(Voc.packages, sup).extend(newModelJson.p, newModelJson.s);
          
          U.pushUniq(newModels, newModel);
        }
        
        for (var i = 0; i < newModels.length; i++) {
          U.pushUniq(Voc.models, newModels[i]); // preserve order of Voc.models
        }
        
        Voc.initModels();
        if (success)
          success();
        
        G.finishedTask("ajax models");
        
        setTimeout(function() {Voc.saveModelsToStorage(newModels)}, 0);
  //        setTimeout(Voc.fetchLinkedModels, 0);
      };
      
      var onErr = function(code) {
        return error.apply(this, [null, {type: code}, options]);
      }
      
      if (useWorker) {
        var xhrWorker = new Worker(G.xhrWorker);
        xhrWorker.onmessage = function(event) {
          G.log(Voc.TAG, 'xhr', 'got models', modelsCsv);
          complete(event.data);
        };
        
        xhrWorker.onerror = function(err) {
          G.log(Voc.TAG, 'xhr', JSON.stringify(err));
        };
        
        xhrWorker.postMessage({type: 'JSON', url: G.modelsUrl, data: {models: modelsCsv}, method: 'POST'});
      }
      else {
        $.ajax({
          url: G.modelsUrl, 
          type: 'POST',
          data: {"models": modelsCsv},
          timeout: 5000,
          complete: complete
        });
      }
    },
    
    getStaleModels: function(models) {
      var now = G.currentServerTime();
      return _.filter(_.map(models, function(m) {
        var model = Voc.snm[U.getShortName(m)];
        if (model) {
          var lm = model._dateStored ? model._dateStored : model.lastModified;
          if (lm && now - lm < 360000) // consider model stale after 1 hour
            return null;
          
          var info = {uri: m};
          if (lm)
            info.lastModified = lm;
          
          return info;
        }
        else
          return m;
      }), function (m) {return m}); // filter out nulls
    },

//    fetchLinkedModels: function() {
//      var linked = G.linkedModels;
//      if (!linked)
//        return;
//      
//      Voc.loadStoredModels(linked);
//      var numModels = Voc.models.length;
//      var success = function() {
//        if (!(Voc.models.length - numModels))
//          return;
//        
//        Voc.initModels();
//        Voc.saveModelsToStorage(Voc.models.slice(numModels));
//      }
//    },

    fetchModelsForLinkedResources: function(model) {
//    model = model.constructor || model;
      var isResource = typeof model !== 'function';
      var ctr = isResource ? model.constructor : model;
      var props = {};
      for (var name in ctr.properties) {
        if (!isResource || model.get(name))
          props[name] = ctr.properties[name];
      }
      
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = model.get(name + 'Count') || model.get(name).count;
          if (!count)
            return null;
        }
        
        var range = prop && prop.range;
        range = range && (range.indexOf('/') == -1 || range.indexOf('/Image') != -1 ? null : U.getTypeUri(range));
        if (range && G.classMap)
          range = G.classMap[range] || range;
        
        return !range ? null : isResource ? range : _.contains(G.classUsage, range) ? range : null;
      })), function(m) {
        // no need to reload known types
        return m && !Voc.typeToModel[m];
      }); 
  
      var linkedModels = [];
      var l = G.linkedModels;
      for (var i = 0; i < l.length; i++) {
        // to preserve order
        var idx = tmp.indexOf(l[i].type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
          linkedModels.push(l[i]);
        }
      }
      
      linkedModels = _.union(linkedModels, tmp); // maybe we were missing some in linkedModels
      if (linkedModels.length) {
  //      linkedModels = _.uniq(linkedModels);
        Voc.loadStoredModels({models: linkedModels, sync: false});
        Voc.fetchModels(null, {sync: false});
      }
    },

    fetchModelsForReferredResources: function(list) {
      var model = list.vocModel;
      var resources = list.resources;
      var meta = model.properties;
      
      var tmp = [];

      var l = _.keys(Voc.typeToModel);
      var modelsToFetch = [];

      for (var propName in meta) {
        var p = meta[propName]; 
//        if (p.backLink) {
//          var type = G.defaultVocPath + p.range;
//          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
//            modelsToFetch.push(type);
//        }
//        else
          p.range  &&  !p.backLink  &&  p.range.indexOf('/') != -1  &&  p.range.indexOf('/Image') == -1  &&  tmp.push(propName);
      }
      if (!tmp.length)
        return;
      
      for (var i=0; i<resources.length; i++) {
        for (var j=0; j<tmp.length; j++) {
          var o = resources[i].get(tmp[j]);
          var uri = o  &&  o.value;
          if (!uri)
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
            modelsToFetch.push(type);
        }  
      }  
      
      
      if (modelsToFetch.length) {
//        linkedModels = _.uniq(linkedModels);
        Voc.loadStoredModels({models: modelsToFetch});
        Voc.fetchModels(null, {sync: false});
      }
    },

    initModel: function(m) {
      if (Voc.shortNameToModel[m.shortName])
        return;
      
      m.type = U.getTypeUri(m.type);
  //    m.lastModified = new Date().getTime();
      var sn = m.shortName;
      if (m.enumeration) {
        Voc.shortNameToEnum[sn] = m;
        Voc.typeToEnum[m.type] = m;
        return;
      }
      else {
        Voc.shortNameToModel[sn] = m;
        Voc.typeToModel[m.type] = m;
      }
      
      m.prototype.parse = Resource.prototype.parse;
      m.prototype.validate = Resource.prototype.validate;
      var superProps = m.__super__.constructor.properties;
      var hidden = m.hiddenProperties ? m.hiddenProperties.replace(/\ /g, '').split(',') : [];
      m.properties = superProps ? _.extend(U.filterObj(superProps, function(name, prop) {return !_.contains(hidden, name)}), m.myProperties) : _.clone(m.myProperties);
      var superInterfaces = m.__super__.constructor.interfaces;
      m.interfaces = superInterfaces ? _.extend(_.clone(superInterfaces), m.myInterfaces) : _.clone(m.myInterfaces);
      m.prototype.initialize = Voc.getInit.apply(m);
    },
  
    getInit: function() {
      var self = this;
      return function() { 
        self.__super__.initialize.apply(this, arguments); 
        this.on('change', Voc.updateDB);
      }
    },
  
    initModels: function(models) {
      models = models || Voc.models;
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
    //    if (Voc.shortNameToModel[m.shortName])
    //      continue;
        if (m.shortName != 'Resource')
          delete Voc.shortNameToModel[m.shortName];
        
        Voc.initModel(m);
      }
    },
    
    contactKey: "com.fog.security.contact",
    checkUser: function() {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      var p = localStorage.getItem(Voc.contactKey);
      var c = G.currentUser;
      if (p && !c.guest && JSON.parse(p)._uri != c._uri) {
        // no need to clear localStorage, it's only used to store models, which can be shared
        if (c.guest)
          G.currentUser = {_reset: true, guest: true};
        else {
          G.localStorage.put(Voc.contactKey, JSON.stringify(c));
          G.userChanged = true;
        }
        
        Voc.newModels = _.filter(_.keys(Voc.shortNameToModel), function(name) {return name != 'Resource'});
        return;
      }
    },
    
    saveModelsToStorage: function(models) {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      var models = models || Voc.models;
      if (!models.length)
        return;
    
      var now = G.currentServerTime();
      var enumModels = {};
      _.each(models, function(model) {
        if (model.type.endsWith('#Resource'))
          return;
        
        var modelJson = U.toJSON(model);
        modelJson._dateStored = now;
        modelJson._super = model.__super__.constructor.type;
        if (model.enumeration)
          enumModels[model.type] = modelJson;
        else
          Voc.storeModel(modelJson);
      });
      
      if (_.size(enumModels)) {
        var enums = Voc.getEnumsFromLS();
        enums = enums ? JSON.parse(enums) : {};
        _.extend(enums, enumModels);
        Voc.storeEnumsInLS(enums);
      }
    },

    loadModel: function(modelJson, sUri, superName) {
      superName = superName || sUri.slice(sUri.lastIndexOf('/') + 1); 
      var pkgPath = U.getPackagePath(modelJson.type);
      var sPath = U.getPackagePath(sUri);
      var pkg = U.addPackage(Voc.packages, pkgPath);
      var sName = modelJson.shortName;
      if (Voc.snm[sName])
        delete Voc.snm[sName];
      
      var model = pkg[sName] = U.leaf(Voc, (sPath ? sPath + '.' : '') + superName).extend({}, modelJson);
      Voc.initModel(model);
    },

    getModelChain: function(model, have) {
      if (have)
        have[model.type] = model;
      
      if (!G.hasLocalStorage)
        return null;
      
      var sup = model.subClassOf;
      if (!sup)
        throw new Error('every model except Resource must be a subClassOf of another model');
      
      if (sup == 'Resource')
        return [model];
        
      sup = sup.startsWith('http') ? sup : 'http://www.hudsonfog.com/voc/' + sup;
      var savedSModel = have && have[sup];
      sModel = savedSModel || Voc.getModelFromLS(sup);
      if (!sModel)
        return null;
      
      sModel = savedSModel || JSON.parse(sModel);
      if (!savedSModel && have)
        have[sup] = sModel;
      
      var sChain = Voc.getModelChain(sModel, have);
      return sChain == null ? null : sChain.concat(model);
    },
    
    initStoredModels: function(models) {
      models = _.filter(models, function(model) {
        if (model.subClassOf != null || model.type.endsWith("#Resource"))
          return true;
        else {
          U.pushUniq(Voc.changedModels, model.type);
          return false;
        }
      });
      
      if (!models.length)
        return models;
      
      var unloaded = [];
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
        var sUri = m.subClassOf;
        var sIdx = sUri.lastIndexOf('/');
        var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
        if (!Voc.snm[superName]) {
          if (_.contains(unloaded, m))
            continue;
          
          var chain = Voc.getModelChain(m, null);
          if (chain) {
            var fresh = [], stale = [];
            Voc.filterExpired(null, chain, fresh, stale);
            if (stale.length)
              unloaded.push(m);
          }
          else
            unloaded.push(m);
          
          continue;
        }
        
        Voc.loadModel(m, sUri, superName);
      }
      
      return unloaded;
    },

    getEnumsFromLS: function() {
      return localStorage.getItem('enumerations');
    },

    storeEnumsInLS: function(enums) {
      setTimeout(function() {
        G.localStorage.putAsync('enumerations', JSON.stringify(enums));
      }, 100);
    },

    getModelFromLS: function(uri) {
      return localStorage.getItem('model:' + uri);
    },
    
    storeModel: function(modelJson) {
      setTimeout(function() {
        G.localStorage.putAsync('model:' + modelJson.type, JSON.stringify(modelJson));
      }, 100);
    },

    detectCurrentModel: function() {
      var hash =  window.location.hash && window.location.hash.slice(1);
      if (!hash)
        return;
      
      var qIdx = hash.indexOf('?');
      if (qIdx != -1)
        hash = hash.slice(0, qIdx);
      
      hash = decodeURIComponent(hash);
      var type;
      if (hash.match('^view|menu|edit|make')) {
        var sqlIdx = hash.indexOf(G.sqlUri);
        if (sqlIdx == -1)
          type = hash.slice(5);
        else
          type = 'http://' + hash.slice(sqlIdx + G.sqlUri.length + 1);
        
        qIdx = type.indexOf('?');
        if (qIdx != -1)
          type = type.slice(0, qIdx);
      }
      else
        type = hash;

      if (type === 'profile')
        return (G.currentUser.guest ? null : G.currentUser.type._uri);
            
      type = type.startsWith('http://') ? type : G.defaultVocPath + type;
      Voc.currentModel = type;
    },
    
    loadEnums: function() {
      var enums = Voc.getEnumsFromLS();
      if (!enums)
        return;
      
      enums = JSON.parse(enums);
      for (var type in enums) {
        Voc.initModel(Backbone.Model.extend({}, enums[type]));
      }
    },
    
    loadStoredModels: function(options) {
      Voc.detectCurrentModel();
      if (G.userChanged)
        return;

      var r = options && options.models ? {models: _.clone(options.models)} : {models: _.clone(G.models)};
      var models = r.models;
      var added = Voc.currentModel;
      if (added && !Voc.typeToModel[added] && !_.filter(models, function(m) {return (m.type || m).endsWith(added)}).length)
        models.push(added);

      if (!G.hasLocalStorage) {
        if (r) {
          _.forEach(models, function(model) {
            G.log(Voc.TAG, 'db', "1. newModel: " + model.shortName);
            U.pushUniq(Voc.newModels, model.type);
          });
        }
        
        return; // TODO: use indexedDB
      }
      
      if (!_.size(Voc.shortNameToEnum))
        Voc.loadEnums();
      
      var extraModels;
      var typeToJSON = {};
      var expanded = [];
      for (var i = models.length - 1; i > -1; i--) {
        var model = models[i];
        var uri = model.type || model;
        if (!uri || !(uri = U.getLongUri(uri, Voc)))
          continue;
        
        if (typeToJSON[uri] || Voc.typeToModel[uri])
          continue;
        
        var jm;
        if (model._dateStored)
          jm = model;
        else {
          jm = Voc.getModelFromLS(uri);
          if (!jm) {
            U.pushUniq(Voc.newModels, uri);
            continue;
          }
        
          jm = JSON.parse(jm);
        }
        
        if (jm) { 
//          if (jm.subClassOf == 'Resource' || typeToJSON[jm.subClassOf]) {
//            expanded.push(jm);
//            typeToJSON[jm.subClassOf] = jm;
//          }
//          else {
            var chain = Voc.getModelChain(jm, typeToJSON);
            if (chain)
              expanded = expanded.concat(chain);
            else
              Voc.newModels.push(jm.type);
//            for (var i = 0; i < expanded; i++) {
//              if (expanded)
//            }
//          }
//          
//          typeToJSON[uri] = jm;
        }
      }
      
      delete typeToJSON;
      
      var stale = []
      var fresh = [];
      Voc.filterExpired({lastModified: r.lastModified}, expanded, fresh, stale);
      _.each(stale, function(s) {U.pushUniq(Voc.changedModels, s)});
      
      if (fresh.length) {
        var unloaded = Voc.initStoredModels(fresh);
        _.each(unloaded, function (m) {
          U.pushUniq(Voc.changedModels, m);
        });
      }
    },
    
    filterExpired: function(info, models, fresh, stale) {
      var baseDate = (info && info.lastModified) || G.lastModified;
      _.each(models, function(model) {
//        var mInfo = _.filter(G.models, function(m) {return m.type == model.type});
        var d = baseDate || model.lastModified; //(mInfo.length && mInfo[0].lastModified);
        if (d) {
          var date = (baseDate && model.lastModified) ? Math.max(baseDate, model.lastModified) : d;
            var storedDate = model._dateStored;
            if (storedDate && storedDate >= date) {
              fresh.push(model);
              return;
            }
        }
        
        U.pushUniq(stale, model.type);
        return;
      });
    }
  };
  
  Voc.snm = Voc.shortNameToModel;
  return (Lablz.Voc = Voc);
});