// needs Lablz.currentUser, Lablz.models, Lablz.newModels, Lablz.changedModels
define([
  'jquery',
  'backbone',
  'underscore',
  'utils',
  'error',
  'modelsBase'
], function($, Backbone, _, U, Error, MB) {
  return {
    checkUser: function() {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      var p = localStorage.getItem(contactKey);
      var c = Lablz.currentUser;
      if ((p && !c) || (!p && c) || (p && c && JSON.parse(p)._uri != c._uri)) {
        // no need to clear localStorage, it's only used to store models, which can be shared
        if (c) {
          localStorage.setItem(contactKey, JSON.stringify(c));
          Lablz.currentUser._reset = true;
        }
        else
          Lablz.currentUser = {_reset: true};
        
        Lablz.newModels = _.filter(_.keys(MB.shortNameToModel), function(name) {return name != 'Resource'});
        return;
      }
    },
    saveModelsToStorage: function() {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      if (!Lablz.models.length)
        return;
    
      var now = new Date().getTime();
      _.each(Lablz.models, function(model) {
        var modelJson = U.toJSON(model);
        modelJson._lastModified = now;
        modelJson._super = model.__super__.constructor.type;
        if (!model.type.endsWith('#Resource'))
          localStorage.setItem('model:' + model.type, JSON.stringify(modelJson));
      });  
    },
    initStoredModels: function(models) {
      var filtered = _.filter(models, function(model) {
        if (model.subClassOf != null || model.type.endsWith("#Resource"))
          return true;
        else {
          Lablz.changedModels.push(model.type);
          return false;
        }
      });
      
      if (!filtered.length)
        return models;
      
      var unloaded = [];
      var snm = MB.shortNameToModel;
    //  function load(m, superName) {
    //    var pkgPath = U.getPackagePath(m.type);
    //    var sPath = U.getPackagePath(m.subClassOf);
    //    var pkg = U.addPackage(pkgPath);
    //    var model = pkg[m.shortName] = eval((sPath ? sPath + '.' : '') + superName).extend({}, m);
    //    MB.initModel(model);
    //    return true;
    //  }
    //
    //  function getSuperName(m) {
    //    var sUri = m.subClassOf;
    //    var sIdx = sUri.lastIndexOf('/');
    //    return sIdx == -1 ? sUri : sUri.slice(sIdx + 1);    
    //  }
    //  
    //  function tryLoad(m) {
    //    var superName = getSuperName(m);
    //    if (snm[superName]) {
    //      load(m, superName);
    //      return true;
    //    }
    //    
    //    var supers = _.filter(filtered, function(model) {return model.type == m.subClassOf});
    //    if (supers.length && tryLoad(supers[0]))
    //      return load(m, superName);
    //    else
    //      return false;
    //  }
    //  
    //  for (var i = 0; i < filtered.length; i++) {
    //    var m = filtered[i];
    //    if (!tryLoad(m))
    //      unloaded.push(m.type);
    //  }
      
      _.each(filtered, function(m) {
        var sUri = m.subClassOf;
        var sIdx = sUri.lastIndexOf('/');
        var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
        if (!snm[superName]) {
          unloaded.push(m.type);
          return;
        }
        
        var pkgPath = U.getPackagePath(m.type);
        var sPath = U.getPackagePath(sUri);
        var pkg = U.addPackage(pkgPath);
        var model = pkg[m.shortName] = eval((sPath ? sPath + '.' : '') + superName).extend({}, m);
    //    var model = eval(pkgPath + '.' + m.shortName + " = " + (sPath ? sPath + '.' : '') + superName + '.extend({},' + m + ');');
        MB.initModel(model);
      });
      
      return unloaded;
    },
    loadStoredModels: function(options) {
    //  var ttm = Lablz.typeToModel;
      if (Lablz.currentUser._reset)
        return;
      
      var r = options && options.models ? {models: options.models} : Lablz.requiredModels;
      var hash = window.location.hash && window.location.hash.slice(1);
      if (hash) {
        var qIdx = hash.indexOf('?');
        if (qIdx != -1)
          hash = hash.slice(0, qIdx);
        
        var type;
        if (hash.startsWith('http'))
          type = decodeURIComponent(hash);
        else if (hash.startsWith('view/http')) {
          type = decodeURIComponent(hash.slice(5)).replace("sql/", "");
          
          qIdx = type.indexOf('?');
          if (qIdx != -1)
            type = type.slice(0, qIdx);
        }
        else
          type = U.getType(hash);
        
        type = type.startsWith(Lablz.serverName) ? 'http://' + type.slice(Lablz.serverName.length + 1) : type;
        
        if (type && !_.filter(r.models, function(m) {return (m.type || m).endsWith(type)}).length)
          r.models.push(type);
      }
      
      if (!localStorage) {
        if (r) {
          _.forEach(r.models, function(model) {
            console.log("1. newModel: " + model.shortName);
            Lablz.newModels.push(model.type);
          });
        }
        
        return; // TODO: use indexedDB
      }
      
      var toLoad = [];
    //  if (options && options.all) {
    //    for (var key in localStorage) {
    //      if (key.startsWith('model:') && !MB.shortNameToModel[key.slice(key.lastIndexOf('/') + 1)])
    //        toLoad.push(JSON.parse(localStorage.getItem(key)));
    //    }
    //  }
    //  else {
      var baseDate = r.lastModified || Lablz.requiredModels.lastModified;
      _.each(r.models, function(model) {
        var uri = model.type || model;
        if (!uri || !(uri = U.getLongUri(uri)))
          return;    
        
        var exists = false;
        var d = baseDate || model.lastModified;
        if (d) {
          var date = (baseDate && model.lastModified) ? Math.max(baseDate, model.lastModified) : d;
          var stored = localStorage.getItem('model:' + uri);
          if (stored) {
            exists = true;
            stored = JSON.parse(stored);
            var storedDate = stored._lastModified;
            if (storedDate && storedDate >= date) {
              toLoad.push(stored);
              return;
            }
          }
        }
        
        (exists ? Lablz.changedModels : Lablz.newModels).push(uri);
        return;
      });
    //  }
      
      if (toLoad.length) {
        var unloaded = Lablz.initStoredModels(toLoad);
        _.each(unloaded, function (m) {Lablz.changedModels.push(m)});
      }
    }
  }
});