define('modelLoader', ['globals', 'underscore', 'events', 'utils', 'models/Resource', 'collections/ResourceList', 'apiAdapter', 'indexedDB'], function(G, _, Events, U, Resource, ResourceList, API, IndexedDBModule) {
  var MODEL_CACHE = [],
      MODEL_PREFIX = 'model:',
      ENUMERATIONS_KEY = 'enumerations',
      MODEL_STORE,
      IDB,
      preferredStorage,
      MODEL_PROMISES = {};

//  window.MODEL_PROMISES = MODEL_PROMISES;
  G.REQUIRED_OBJECT_STORES = G.REQUIRED_OBJECT_STORES || [];

  function ModelsPromise(models, options) {
    getModels(models, options);
    return makeModelsPromise(models);
  };
  
  function makeModelsPromise(types) {
    var modelToPromiseObj = {},
        promises = [],
        overallPromise;

    _.each(types, function(type) {      
      var promise = modelToPromiseObj[type] = MODEL_PROMISES[type].promise;
      promises.push(promise);
    });
    
    overallPromise = $.whenAll.apply($, promises);
    overallPromise.then(function() {
      if (!_.all([].slice.call(arguments)))
        debugger;
    });
    
    return _.extend(modelToPromiseObj, _.pick(overallPromise, 'promise', 'done', 'fail', 'then', 'always', 'state'));
  };
  
  function makeModelPromise(type) {
    var dfd = $.Deferred(),
        promise = dfd.promise(),
        existing = MODEL_PROMISES[type];
    
    MODEL_PROMISES[type] = {
      deferred: dfd,
      promise: promise
    };
    
    if (existing && existing.promise.state() == 'pending') {
      // whichever one finishes first
      existing.promise.then(dfd.resolve, dfd.reject);
      promise.then(existing.deferred.resolve, existing.deferred.reject);
    }
    
    return promise;
  };

  function getModelPromise(type) {
    var promiseInfo = MODEL_PROMISES[type];
    return promiseInfo && promiseInfo.promise;
  };

  function gotModel(model) {
    var promiseInfo = MODEL_PROMISES[model.type];
    if (promiseInfo)
      promiseInfo.deferred.resolve(model);
  };

  function didntGetModel(type) {
    var promiseInfo = MODEL_PROMISES[type];
    if (promiseInfo)
      promiseInfo.deferred.reject();
  };

  function sortModelsByStatus(types, options) {
    if (!IDB)
      IDB = IndexedDBModule.getIDB();
    
    var missingOrStale = {},
        mightBeStale = {infos: {}, models: {}},
        willLoad = [],
        force = options.force,
        promises = [],
        source = preferredStorage,
        isIDB = false;
    
    if (!IDB)
      source = 'localStorage';
    
    isIDB = source === 'indexedDB';
    function require(type) {
      missingOrStale[type] = {};
    };    

    _.each(types, function(type) {
      var requireType = U.partial(require, type);
      if (force) {
        requireType();
        return;
      }
      
      var getMetadata = U.partial(getModelMetadataFromStorage, type, source),
          getData = U.partial(getModelFromStorage, type, source),
          info = G.modelsMetadata[type] || G.linkedModelsMetadata[type] || {},
//          modelDfd = $.Deferred(),
//          modelPromise = modelDfd.promise();
          promise;
      
      // check if we have any timestamp info on this model      
      promise = getMetadata().then(function(storedInfo) {
        if (info.lastModified) {
          var lm = Math.max(info.lastModified, G.lastModified);
          if (lm > storedInfo.lastModified)
            return requireType();
          else {
            if (isIDB)
              return willLoad.push(storedInfo); //intermediateDfd.resolve(storedInfo);
            else {
              getData().then(function(jModel) {
                willLoad.push(jModel);
              }, requireType);
            }
          }
        }
        
        // can't do this right away because we need to know that we actually have it in localStorage
        return getData().then(function(jModel) {            
          if (jModel) {
            mightBeStale.infos[type] = {
              lastModified: storedInfo.lastModified
            };
          
            mightBeStale.models[type] = jModel;
          }
          else
            requireType();
        });
      }, requireType);
      
      promises.push(promise);
    });
    
    return $.Deferred(function(defer) {
      $.whenAll.apply($, promises).always(function() {
        defer.resolve({
          have: willLoad,
          need: missingOrStale,
          mightBeStale: mightBeStale,
          getAllTypes: function() {
            return _.union(_.pluck(willLoad, 'type'), _.keys(mightBeStale.infos), _.keys(missingOrStale));
          }
        });
      });
    }).promise();
  };
  
  function fetchModels(models, options) {
    var promise = $.Deferred(function(defer) {
      var numModels = _.size(models);
      if (!numModels)
        return defer.resolve();

      if (!G.online) {
        defer.rejectWith(this, [null, {type: 'offline'}, options]);
        return;
      }

//      var currentType = U.getModelType(),
//          urgent = /*options.sync && */ numModels > 1 && currentType && !U.getModel(currentType);
//          
//      if (urgent) {
//        fetchModels(currentType, options).done(function(data) {
//          defer.resolve(data);
//          models = U.filterObj(models, function(type, model) {
//            return type !== urgent;
//          });
//            
//          fetchModels(models, options);
//        }).fail(defer.reject);
//      }
      
      var modelsCsv = JSON.stringify(models);
      var ajaxSettings = _.extend({
        url: G.modelsUrl, 
        data: {models: modelsCsv}, 
        type: 'POST'
//          , 
//        timeout: 10000
      }, _.pick(options, 'sync'));
      
      U.ajax(ajaxSettings).done(function(data, status, xhr) {
        if (xhr.status === 304)
          return defer.resolve();
        
        if (!data)
          return defer.rejectWith(this, [xhr, status, options]);
        
        if (data.error)
          return defer.rejectWith(this, [xhr, data.error, options]);
        
        defer.resolve(data);
      }).fail(defer.reject);
    }).promise();
    
    promise.fail(function() {
      for (var type in models) {
        didntGetModel(type);
      }
    });
    
    return promise;
  };
  
  function getModels(models, options) {
    options = options || {};
    var promises = [],
        filtered,
        force = options.force,
        overallPromise;
        
    filtered = _.filter(models, function(type) {
      var promise = !force && getModelPromise(type);
      if (promise && promise.state() !== 'rejected') {
        promises.push(promise);
      }
      else {
        promises.push(makeModelPromise(type));
        return true;
      }
    });
    
    if (!filtered.length)
      return;
    if (!G.hasLocalStorage && G.dbType === 'none')
      fetchModels(filtered, options).then(parseAndLoadModels);
    else {
      sortModelsByStatus(filtered, options).then(function(modelsInfo) {
        if (G.online)
          fetchAndLoadModels(modelsInfo, options);
        else {
          Events.once('online', function(online) {
            var infoClone = _.clone(modelsInfo);
            infoClone.have = [];
            fetchAndLoadModels(infoClone, _.extend({}, options, {sync: false}));
          });
          
          var loading = _.union(modelsInfo.have || [], _.values(modelsInfo.mightBeStale.models));
          loadModels(loading, !force);
        }
      });
    }    
  };

  function fetchAndLoadModels(modelsInfo, options) {
    var mightBeStale = modelsInfo.mightBeStale || {},
        modelsToGet = _.extend({}, modelsInfo.need, mightBeStale.infos);
    
    $.when(fetchModels(modelsToGet, options), loadModels(modelsInfo.have, true)).then(function(data) {
      parseAndLoadModels(data, modelsInfo);
    });
    
    return makeModelsPromise(modelsInfo.getAllTypes());
  };
  
  function parseAndLoadModels(data, modelsInfo) {
    modelsInfo = modelsInfo || {};
    var mightBeStale = modelsInfo.mightBeStale || {};
    
    G.checkVersion(data);
    if (!data) {
      // "need" should be empty
      if (_.size(modelsInfo.need)) {
        debugger;
        defer.reject();
        return;
//              throw new Error("missing needed models: " + JSON.stringify(_.map(missingOrStale, function(m) {return m.type || m})));
      }
      
      return loadModels(mightBeStale.models, true);
    }
    
    var mz = data.models || [],
        more = data.linkedModelsMetadata;
    
    G.lastModified = Math.max(data.lastModified, G.lastModified);
    G.classUsage = _.union(G.classUsage, _.map(data.classUsage, U.getTypeUri));
    if (more) {
      _.extend(G.linkedModelsMetadata, U.mapObj(more, function(type, meta) {
        return [U.getLongUri1(type), meta];
      }));
    }
    
    if (data.classMap)
      _.extend(G.classMap, data.classMap);
    
    var newModels = [],
        loadedTypes = [];
    
    for (var i = 0; i < mz.length; i++) {
      var newModel = mz[i];
      newModel.lastModified = newModel.lastModified ? Math.max(G.lastModified, newModel.lastModified) : G.lastModified;            
      loadedTypes.push(newModel.type);
      U.pushUniq(newModels, newModel);
    }
    
    var notStale = _.filter(_.values(mightBeStale.models), function(model) {
      return !_.contains(loadedTypes, model.type);
    });
    
    var changedModels = _.union(newModels, notStale);
    for (var i = 0; i < changedModels.length; i++) {
      var model = changedModels[i],
          collisions = _.filter(MODEL_CACHE, function(m) {
            return m.type == model.type;
          });
      
      MODEL_CACHE.remove(collisions);
      MODEL_CACHE.push(model);
    }
    
    // new promise
    var promise = loadModels(changedModels); 
//      setTimeout(function() {
    G.whenNotRendering(function() {
      storeModels(newModels);
    });
//      }, 100);
    
//        Voc.setupPlugs(data.plugs);
    Events.trigger('newPlugs', data.plugs);
    if (newModels.length)
      Events.trigger('modelsChanged', _.pluck(newModels, 'type'));
    
    return promise;
  };

  function loadModels(models, preventOverwrite) {
    var models = models || MODEL_CACHE;
    _.each(models, function(model) {
      if (!preventOverwrite || !U.getModel(model.type))
        loadModel(model);
    });
  };

  function loadModel(m) {
    m = Resource.extend({}, m);
    if (m.interfaces) {
      m.interfaces = _.map(m.interfaces, function(i) {
        return U.getLongUri1(i);
      });
    }
    
    if (m.adapter) {
      var currentApp = G.currentApp,
          consumers = currentApp.dataConsumerAccounts,
          providers = currentApp.dataProviders,
          consumer = consumers && consumers.where({
            provider: m.app
          }, true),
          provider = providers && providers.where({
            app: m.app
          }, true);            


      if (!provider || !consumer)
        delete m.adapter;
      else {
        m.API = new API(consumer, provider);
        m.adapter = new Function('Events', 'Globals', 'ResourceList', 'Utils', 'Cache', 'API', "return " + m.adapter)(Events, G, ResourceList, U, C, m.API);
      }
      
//      if (provider == null)
//        throw new Error("The app whose data you are trying to use does not share its data");          
//          
//      if (consumer == null)
//        throw new Error("This app is not configured to consume data from app '{0}'".format(provider.app));
      
    }
    
    var type = m.type = U.getTypeUri(m.type),
        isCustomModel = U.isAnAppClass(type);
    
    Events.trigger('newModel', m);

    if (isCustomModel && !m.enumeration && !m.alwaysInlined) {
      var meta = m.properties;
      for (var p in meta) {
        var prop = meta[p];
//        if (prop.backLink) {
//          meta[prop.shortName + 'Count'] = {
//            range: "int",
//            avoidDisplaying: true,
//            readOnly: true
//          };
//        }
        
        if (prop.displayName) {
          var sn = prop.shortName;
          prop.altName = p;
          delete meta[p];
          meta[sn] = prop;
        }
      }
    }
    
    m.prototype.parse = Resource.prototype.parse;
    m.prototype.validate = Resource.prototype.validate;
    _.defaults(m.properties, Resource.properties);
    m.superClasses = _.map(m.superClasses, function(type) {
      if (/\//.test(type))
        return U.getLongUri1(type);
      else
        return G.defaultVocPath + 'system/fog/' + type;
    });
      
    _.extend(m.properties, U.systemProps);
    m.prototype.initialize = getInit.call(m);
    setTimeout(function() {
      Events.trigger('initPlugs', type);
    }, 1000);
    
    gotModel(m);
  };

  function getInit() {
    var self = this;
    return function() { 
      self.__super__.initialize.apply(this, arguments); 
    }
  };

  function loadEnums() {
    var enums = getEnumsFromStorage();
    if (!enums)
      return;
    
    enums = JSON.parse(enums);
    for (var type in enums) {
      makeModelPromise(type);
      loadModel(Backbone.Model.extend({}, enums[type]));
    }
  };

  function storeModels(models, storageType) {
    models = models || MODEL_CACHE;
    if (!models.length)
      return;
  
    storageType = storageType || preferredStorage;
    var notUsingLocalStorage = storageType == 'localStorage' && !G.hasLocalStorage;
    if (notUsingLocalStorage) {
      storageType = 'indexedDB';
    }
    else if (storageType == 'indexedDB' && G.dbType === 'none') {
      if (notUsingLocalStorage)
        return; // we're out of options
      else
        storage = 'localStorage';
    }
    
    var enumModels = {};
    _.each(models, function(model) {
      var modelJson = model; //U.toJSON(model);
      if (model.enumeration)
        enumModels[model.type] = modelJson;
      else
        storeModel(modelJson, storageType);
    });
    
    if (_.size(enumModels)) {
      var enums = getEnumsFromStorage();
      enums = enums ? JSON.parse(enums) : {};
      _.extend(enums, enumModels);
      storeEnums(enums, storageType);
    }
  };


  function getEnumsFromStorage() {
    return G.localStorage.get(ENUMERATIONS_KEY);
  };

  function storeEnums(enums) {
    setTimeout(function() {
      G.localStorage.putAsync(ENUMERATIONS_KEY, JSON.stringify(enums));
    }, 100);
  };

  function deleteModelFromStorage(uri) {
    G.localStorage.del('metadata:' + uri);
    G.localStorage.del(type);
  };
  
  function getModelStorageURL(uri) {
    return MODEL_PREFIX + uri;
  };

  function getModelMetadataStorageURL(uri) {
    return MODEL_PREFIX + 'metadata:' + uri;
  };
 
  function getModelMetadataFromStorage(uri, source) {
    if (source === 'indexedDB')
      return getModelFromStorage(uri, source);
          
    return getItemFromStorage(getModelMetadataStorageURL(uri), source);
  };

  function getModelFromStorage(uri, source) {
    return getItemFromStorage(getModelStorageURL(uri), source);
  };
  
  function getItemFromStorage(url, source) {
    return G.getCached(url, source, MODEL_STORE.name).then(function(data) {
      if (typeof data == 'string') {
        try {
          data = JSON.parse(data);
        } catch (err) {
          debugger;
          return null;
        }
      }
      
      return data;
    });    
  };

  function storeModel(modelJson, storageType) {
    var type = modelJson.type,
        data = {},
        metadata = {};
    
    if (storageType == 'localStorage') {
      metadata[getModelMetadataStorageURL(type)] = {
        lastModified: modelJson.lastModified
      };
      
      G.putCached(metadata, {
        storage: storageType
      });
    }
    
    data[getModelStorageURL(type)] = modelJson;
    G.putCached(data, {
      storage: storageType,
      store: MODEL_STORE.name
    });
    
//    setTimeout(function() {
//      var type = modelJson.type;
//      G.localStorage.putAsync(getModelMetadataStorageURL(type), {
//        lastModified: modelJson.lastModified
//      });
//      
//      G.localStorage.putAsync(getModelStorageURL(type), JSON.stringify(modelJson));
//      U.pushUniq(G.storedModelTypes, type);
//    }, 100);
  };

  var ModelLoader = {
    init: _.once(function(storageType) {
      preferredStorage = storageType || 'indexedDB';
      MODEL_STORE = G.getModelsStoreInfo();
    }),
    loadEnums: loadEnums,
    getModels: function(models, options) {
      return ModelsPromise(models, options);
    },
    getModelStoragePrefix: function() {
      return MODEL_PREFIX;
    },
    storeModels: storeModels
  };
  
  _.extend(ModelLoader, Backbone.Events);
  
  return ModelLoader;
});