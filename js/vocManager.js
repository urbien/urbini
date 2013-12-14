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
  'apiAdapter',
  'lib/fastdom'
], function(G, U, Errors, Events, Resource, ResourceList, ModelLoader, PlugManager, C, API, Q) {
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("VocManager");
    G.log.apply(G, args);
  };

  G.classUsage = _.map(G.classUsage, U.getTypeUri);
  var _fetchMoreModelsTimeout;
  function doFetchMoreModels() {
    Voc.getModels(null, {go: true});
  }
  
  function fetchLinkedAndReferredModels(list) {
    var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
    if (!resources.length)
      return;
    
    var model = resources[0].vocModel;
    var linkedModels = Voc.detectLinkedModels(resources[0]);
    var referredModels = Voc.detectReferredModels(list);
    var models = _.union(linkedModels || [], referredModels || []);
    if (_.size(models)) {
      log('ajax', 'fetching linked/referred models for {0}'.format(U.isCollection(list) ? 'list: ' + list.query : 
                                                                    resources.length > 1 ? 'resources' : 'resource: ' + resources[0].getUri()));
      Voc.getModels(models, {debounce: 3000});
    }
  };
  
  var Voc = {
    isDelayingModelsFetch: function() {
      return ModelLoader.isDelayingFetch();
    },
    
    getModels: function(models, options) {
      return ModelLoader.getModels(models, options);
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
          var count = U.getBacklinkCount(res, name);
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
      G.whenNotRendering(fetchLinkedAndReferredModels.bind(null, listOrRes));
    },

    detectReferredModels: function(list) {      
      var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
      var model = resources[0].vocModel;
      var meta = model.properties;
      
      var tmp = [];
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
          if (!uri || typeof uri === 'object') // could be a file upload
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !C.getModel(type))
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
   
    var uri = appInstall.get('_uri'),
        user = G.currentUser,
        installed = user.installedApps = user.installedApps || {},
        jApp = {
          application: appInstall.get('application'),
          install: uri,
          allow: true
        };
        
    installed[G.currentApp.appPath] = jApp;
    if (uri && !U.isTempUri(uri)) {
      PlugManager.fetchPlugs({appInstall: uri});
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
      Voc.getModels(currentModels, {force: true});
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
  
  Events.on('newResources', setTimeout.bind(window, function(resources) {
    var actualTypes = {};
    for (var i = 0, len = resources.length; i < len; i++) {
      var resource = resources[i];
      if (resource._changingModel)
        return;
      
      var uri = resource.getUri(),
          type = resource.vocModel.type,
          actualType = U.getTypeUri(uri);
      
      if (actualType && type != actualType && !U.isAssignableFrom(resource.vocModel, actualType)) {
        var byType = actualTypes[actualType] = actualTypes[actualType] || [];
        byType.push(resource);
      }        
    }
    
    if (!_.size(actualTypes))
      return;
    
    Voc.getModels(_.keys(actualTypes)).done(function() {
      for (var type in actualTypes) {
        var actualModel = U.getModel(type);
        var sadResources = actualTypes[type];
        for (var i = 0, len = sadResources.length; i < len; i++) {            
          sadResources[i].setModel(actualModel);
        }
      }
    });
  }, 500));
  
  Events.on('newResourceList', function(list) {
    _.each(['updated', 'added', 'reset'], function(event) {
      Voc.stopListening(list, event);
      Voc.listenTo(list, event, function(resources) {
        Voc.fetchLinkedAndReferredModels(resources || list.models);
      });
    });
  });

  Events.on('newResource', function(res) {
    if (!res.collection) {
      setTimeout(function() {
        Q.nonDom(fetchLinkedAndReferredModels.bind(Voc, ([res])));
      }, 1000);
    }
  });

//  Events.on('newPlugs', Q.defer.bind(Q, 30, 'nonDom', function() {
//    Q.defer(30, 'nonDom', Voc.savePlugsToStorage, Voc);
//  }));
  
  Events.on('getModels', function(models, dfd) {
    Voc.getModels(models).then(dfd.resolve, dfd.reject);
  });
  G.Voc = Voc;
  return Voc;
});