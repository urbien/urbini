//'use strict';
define('vocManager', [
  'globals',
  'utils', 
  'error', 
  'events', 
  'models/Resource', 
  'collections/ResourceList',
  'modelLoader',
  'plugManager',
  'cache',
  'apiAdapter'
], function(G, U, Errors, Events, Resource, ResourceList, ModelLoader, PlugManager, C, API) {
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };

  G.classUsage = _.map(G.classUsage, U.getTypeUri);
  function ModelRequestCollector() {
    var dfd, promise, collected;
    this.reset = function() {
      dfd = $.Deferred();
      promise = dfd.promise();
      collected = [];
    };

    this.appendRequest = function(models, options) {
      delete options.wait;
      _.extend(collected, normalizeModels(models, options));
      return promise;
    };
    
    this.execute = function(options) {
      delete options.go;
      return ModelLoader.getModels(collected, options).always(this.reset);
    };
    
    this.getModels = function(models, options) {
      return ModelLoader.getModels(normalizeModels(models, options), options);
    };
    
    this.reset();
  };
  
  function normalizeModels(models, options) {
    if (!models) {
      // if no models specified, get the base app models
      models = _.clone(G.modelsMetadata);
      var currentModel = U.getModelType();
      if (currentModel && !models[currentModel])
        models[currentModel] = {};
    }
    else {
      switch (U.getObjectType(models)) {
      case '[object String]':
        models = U.toObject([U.getLongUri1(models)]);
        break;
      case '[object Array]':
        models = U.toObject(_.map(models, U.getLongUri1));
        break;
      case '[object Object]':
        break;
      default:
        throw new Error("invalid format for 'models' parameter: " + JSON.stringify(models));
      }
    }
    
    if (!options.overwrite) {
      models = U.filterObj(models, function(type, info) {
        return !U.getModel(type);
      });
    }
    
    return models;
  };
      
  function fetchLinkedAndReferredModels(list) {
    var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
    if (!resources.length)
      return;
    
    var model = resources[0].vocModel;
    var linkedModels = Voc.detectLinkedModels(resources[0]);
    var referredModels = Voc.detectReferredModels(list);
    var models = _.union(linkedModels || [], referredModels || []);
    if (_.size(models))
      Voc.getModels(models, {sync: false});
  };
  
  var Voc = {
    modelReqCollector: new ModelRequestCollector(),
//    models: [],
    getModels: function(models, options) {
      options = options || {};
      if (options.wait)
        return this.modelReqCollector.appendRequest(models, options);
      else if (options.go)
        this.modelReqCollector.execute(options);
      else
        return this.modelReqCollector.getModels(models, options);
    },
    storeModels: function(models, storageType) {
      ModelLoader.storeModels(models, storageType);
    },
    detectLinkedModels: function(res) {
      var isResource = U.isModel(res);
      var model = isResource ? res.vocModel : res;
      var props = {};
      var meta = model.properties;
      for (var name in meta) {
        if (!isResource || res.get(name))
          props[name] = meta[name];
      }
      
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = res.get(name + 'Count') || res.get(name).count;
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
        return m && !U.getModel(m);
      }); 
  
      var linkedModels = [];
      var l = G.linkedModelsMetadata;
      for (var type in l) {
        var idx = tmp.indexOf(type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
          linkedModels.push(type);
        }
      }
      
      return linkedModels;
    },
    
    fetchLinkedAndReferredModels: function(listOrRes) {
      G.whenNotRendering(U.partial(fetchLinkedAndReferredModels, listOrRes));
    },

    detectReferredModels: function(list) {      
      var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
      var model = resources[0].vocModel;
      var meta = model.properties;
      
      var tmp = [];
      var cache = C.typeToModel;
      var modelsToFetch = [];

      for (var propName in meta) {
        var p = meta[propName]; 
//        if (p.backLink) {
//          var type = G.defaultVocPath + p.range;
//          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
//            modelsToFetch.push(type);
//        }
//        else
          !U.isInlined(p)  &&  p.range  &&  !p.backLink  &&  p.range.indexOf('/') != -1  &&  p.range.indexOf('/Image') == -1  &&  tmp.push(propName);
      }
      
      if (!tmp.length)
        return;
      
      for (var i=0; i<resources.length; i++) {
        var res = resources[i];
        for (var j = 0; j < tmp.length; j++) {
          var uri = res.get(tmp[j]);
          if (!uri || typeof uri === 'pbject') // could be a file upload
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !_.has(cache, type))
            modelsToFetch.push(type);
        }  
      }  
      
      return modelsToFetch;
    },

    contactKey: "com.fog.security.contact",
    checkUser: function() {
      if (!G.hasLocalStorage)
        return; // TODO: use indexedDB
      
      var p = G.localStorage.get(Voc.contactKey);
      p = p && JSON.parse(p);
      var c = G.currentUser;
      var userChanged = !p && !c.guest || p && !c.guest && p._uri != c._uri || p && c.guest;
      if (userChanged) {
        Events.trigger('userChanged');
        if (c.guest) {
          G.localStorage.del(Voc.contactKey);
        }
        else {
          // no need to clear localStorage, it's only used to store models, which can be shared
          G.localStorage.put(Voc.contactKey, JSON.stringify(c));
        }
         
//        var plugTypes = G.localStorage.nukePlugs(); // keep for now, plugs are small and non-user-specific
        if (!c.guest) {
          PlugManager.fetchPlugs(); //plugTypes);
        }
      }
    }
    
  };
  
  _.extend(Voc, Backbone.Events);
  
  Events.on('appInstall', function(appInstall) {
    if (!appInstall.get('allow'))
      return;
   
    var user = G.currentUser;
    var installed = user.installedApps = user.installedApps || {};
    var app = C.getResource(appInstall.get('application'));
    var jApp = app ? app.toJSON() : {};
    jApp.install = appInstall.getUri();
    jApp.allowed = true;
    var appPath = app ? app.get('appPath') : U.getAppPathFromTitle(appInstall.get('application.displayName'));
    installed[appPath] = jApp;
    
    if (!U.isTempResource(appInstall)) {
      PlugManager.fetchPlugs({appInstall: appInstall.getUri()});
    }
  });
  
  Events.on('VERSION', function() {
    G.localStorage.clean();
  });
  
  Events.on('VERSION:Models', function(init) {
    G.log(Voc.TAG, 'info', 'nuking models from LS');
    G.localStorage.clean(function(key) {
      return key.startsWith(ModelLoader.getModelStoragePrefix());
    });
    
    if (!init) {
      var currentModels = _.keys(G.modelsMetadata);
      Voc.getModels(currentModels, {force: true, overwrite: true});
    }
  });

  Events.on('publishingApp', function(app) {
    var wClsDfd = new $.Deferred();
    var modifiedWCls;
    var lastPublished = app.get('lastPublished') || 0;
    Voc.getModels(G.commonTypes.WebClass).done(function() {        
      modifiedWCls = new ResourceList(null, {
        model: U.getModel(G.commonTypes.WebClass),
        params: {
          modified: '>=' + lastPublished,
          parentFolder: app.getUri()
        }
      });
      
      modifiedWCls.fetch({
        success: function() {
          wClsDfd.resolve();
        },
        error: function() {
          debugger;
          wClsDfd.reject();
        }
      });
    });
    
    Events.once('publishedApp', function(app) {
      // check if maybe the app didn't get published for some reason
      if (app.get('lastPublished') <= lastPublished) 
        return;
   
      wClsDfd.promise().done(function() {   
        var modifiedWClUris = modifiedWCls.pluck('davClassUri');
        Voc.getModels(modifiedWClUris, {force: true}).done(function() {
          G.log(Voc.TAG, 'info', 'reloaded models: ' + modifiedWClUris);
        });
      });
    });
  });
  
  Events.on('newResources', function(resources) {
    var actualTypes = {};
    _.each(resources, function(resource) {
      if (resource._changingModel)
        return;
      
      var uri = resource.getUri(),
          type = resource.vocModel.type,
          actualType = U.getTypeUri(uri);
      
      if (actualType && type != actualType) {
        var byType = actualTypes[actualType] = actualTypes[actualType] || [];
        byType.push(resource);
      }        
    });
    
    if (_.size(actualTypes)) {
      Voc.getModels(_.keys(actualTypes)).done(function() {
        for (var type in actualTypes) {
          var actualModel = U.getModel(type);
          var sadResources = actualTypes[type];
          _.each(sadResources, function(resource) {                
            resource.setModel(actualModel);
          });
        }
      });
    }
  });
  
  Events.on('newResourceList', function(list) {
    _.each(['updated', 'added', 'reset'], function(event) {
      Voc.stopListening(list, event);
      Voc.listenTo(list, event, function(resources) {
        G.log(Voc.TAG, 'ajax', 'fetching linked/referred models for list:', list.query);
        Voc.fetchLinkedAndReferredModels(resources || list.models);
      });
    });
  });

  Events.on('newResource', function(res) {
    if (!res.collection)
      Voc.fetchLinkedAndReferredModels([res]);
  });

  Events.on('newPlugs', Voc.savePlugsToStorage);
  
  Events.on('getModels', function(models, dfd) {
    Voc.getModels(models).then(dfd.resolve, dfd.reject);
  });
  
  return (G.Voc = Voc);
});