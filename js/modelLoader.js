define('modelLoader', [
  'globals', 
  'underscore', 
  'events', 
  'utils', 
  'models/Resource', 
  'collections/ResourceList', 
//  'apiAdapter', 
  'indexedDB',
  'lib/fastdom',
  'cache'
], function(G, _, Events, U, Resource, ResourceList, /*API,*/ IndexedDBModule, Q, C) {
  var MODEL_CACHE = [],
      MODEL_PREFIX = 'model:',
      ENUMERATIONS_KEY = 'enumerations',
      ENUMS,
      MODEL_STORE,
      IDB,
      preferredStorage,
      MODEL_PROMISES = {},
      modelRequestCollector;

//  window.MODEL_PROMISES = MODEL_PROMISES;
  G.REQUIRED_OBJECT_STORES = G.REQUIRED_OBJECT_STORES || [];

  function normalizeModels(models, options) {
    if (!models) {
      // if no models specified, get the base app models
      models = _.keys(G.modelsMetadata);
      var currentModel = U.getModelType();
      if (currentModel && !_.contains(models, currentModel))
        models.push(currentModel);
    }
    else {
      switch (U.getObjectType(models)) {
      case '[object String]':
        models = [U.getLongUri1(models)];
        break;
      case '[object Array]':
        models = _.map(models, U.getLongUri1);
        break;
//      case '[object Object]':
//        break;
      default:
        throw new Error("invalid format for 'models' parameter: " + JSON.stringify(models));
      }
    }
    
    for (var i = 0, len = models.length; i < len; i++) {
      var uri = models[i],
          mapped = G.classMap[uri];
      
      if (mapped)
        models[i] = mapped;
    }
    
    return models;
  }
      
  function ModelRequestCollector() {
    var dfd, promise, collected = [];
    this.reset = function() {
      collected.length = 0;
      dfd = $.Deferred();
      promise = dfd.promise();
    };

    this.appendRequest = function(models, options) {
      _.each(models, function(model) {
        _.pushUniq(collected, model);
      });
      
      if (options.wait) {
        delete options.wait;
      }
      
      if (options.debounce) {
        // debounce, fetch in bulk
        if (this._fetchMoreModelsTimeout)
          clearTimeout(this._fetchMoreModelsTimeout);
        
        this._fetchMoreModelsTimeout = setTimeout(this.execute, options.debounce);
        delete options.debounce;
      }

      return promise.then(function() {
        var resultDfd = $.Deferred();
        return resultDfd.resolve.apply(resultDfd, _.map(models, U.getModel));
      });
    };
    
    this.execute = function(options) {
      if (options)
        delete options.go;
      
      _getModels(collected, options);
      return makeModelsPromise(collected).done(dfd.resolve).fail(dfd.reject).always(this.reset);
    };
    
    this.getModels = function(models, options) {
      _getModels(models, options);
      return makeModelsPromise(models);
    };
    
    this.length = function() {
      return collected.length;
    };
    
    _.bindAll(this, 'execute');
    this.reset();
  }

  function ModelsPromise(models, options) {
    models = normalizeModels(models, options);
    return getModels(models, options);
  }
  
  function makeModelsPromise(types) {
    var modelToPromiseObj = {},
        promises = [],
        overallPromise;

    _.each(types, function(type) {      
      var promise = /*modelToPromiseObj[type] =*/ getModelPromise(type) || makeModelPromise(type);
      promises.push(promise);
    });
    
    return $.whenAll.apply($, promises);
//    return _.extend(modelToPromiseObj, _.pick(overallPromise, 'promise', 'done', 'fail', 'then', 'always', 'state'));
  }
  
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
      existing.promise.done(dfd.resolve).fail(dfd.reject);
      promise.done(existing.deferred.resolve).fail(existing.deferred.reject);
    }
    
    return promise;
  }

  function getModelPromise(type) {
    var promiseInfo = MODEL_PROMISES[type];
    return promiseInfo && promiseInfo.promise;
  }

  function gotModel(model) {
    var promiseInfo = MODEL_PROMISES[model.type];
    if (promiseInfo)
      promiseInfo.deferred.resolve(model);
  }

  function didntGetModel(type) {
    var promiseInfo = MODEL_PROMISES[type];
    if (promiseInfo)
      promiseInfo.deferred.reject();
  }

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
    }    

    _.each(types, function(type) {
      var requireType = require.bind(null, type);
      if (force) {
        requireType();
        return;
      }
      
      var getMetadata = getModelMetadataFromStorage.bind(null, type, source),
          getData = getModelFromStorage.bind(null, type, source),
          info = G.modelsMetadata[type] || G.linkedModelsMetadata[type] || {},
//          modelDfd = $.Deferred(),
//          modelPromise = modelDfd.promise();
          promise;
      
      // check if we have any timestamp info on this model      
      promise = getMetadata().then(function(storedInfo) {
        var getDataPromise;
        if (info.lastModified) {
          var lm = Math.max(info.lastModified || 0, G.lastModified || 0);
          if (lm > storedInfo.lastModified)
            return requireType();
          else {
            if (isIDB)
              return willLoad.push(storedInfo); //intermediateDfd.resolve(storedInfo);
            else {
              getDataPromise = getData();
              getDataPromise.done(function(jModel) {
                willLoad.push(jModel);
              }).fail(requireType);
            }
          }
        }
        
        // can't do this right away because we need to know that we actually have it in localStorage
        return (getDataPromise || getData()).then(function(jModel) {            
          if (jModel) {
            mightBeStale.infos[type] = {
              lastModified: storedInfo.lastModified || 0
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
  }
  
  function fetchModels(models, options) {
    var promise = $.Deferred(function(defer) {
      if (_.isEmpty(models))
        return defer.resolve();

      if (!G.online)
        return defer.rejectWith(this, [null, {type: 'offline'}, options]);

      var modelsCsv = JSON.stringify(models),
          ajaxSettings = _.extend({
            url: G.modelsUrl, 
            data: {models: modelsCsv}, 
            type: 'POST'
          });
      
      U.ajax(ajaxSettings, 'fetchModels').done(function(data, status, xhr) {
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
  }
  
  function getModels(models, options) {
    options = options || {};
    if (options.wait || options.debounce)
      return modelRequestCollector.appendRequest(models, options);
    else if (options.go)
      return modelRequestCollector.execute(options);
    else
      return modelRequestCollector.getModels(models, options);
  }


  function _getModels(models, options) {
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
            fetchAndLoadModels(infoClone, _.extend({}, options));
          });
          
          var loading = _.union(modelsInfo.have || [], _.values(modelsInfo.mightBeStale.models));
          loadModels(loading, !force);
        }
      });
    }    
  }

  function fetchAndLoadModels(modelsInfo, options) {
    var mightBeStale = modelsInfo.mightBeStale || {},
        modelsToGet = _.extend({}, modelsInfo.need, mightBeStale.infos);
    
    $.when(fetchModels(modelsToGet, options), loadModels(modelsInfo.have, true)).then(function(data) {
      parseAndLoadModels(data, modelsInfo);
    });
    
    return makeModelsPromise(modelsInfo.getAllTypes());
  }
  
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
      
      return loadModels(_.values(mightBeStale.models), true);
    }
    
    var mz = data.models || [],
        more = data.linkedModelsMetadata;
    
    if (isNaN(data.lastModified) || isNaN(G.lastModified))
      debugger;
    
    G.lastModified = Math.max(data.lastModified || 0, G.lastModified || 0);
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
      _.pushUniq(newModels, newModel);
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
      
      collisions = U.copyArray(MODEL_CACHE, collisions);
      MODEL_CACHE.push(model);
    }
    
    // new promise
    var promise = loadModels(changedModels); 
//      setTimeout(function() {
//    G.whenNotRendering(function() {
      Q.defer(30, 'nonDom', storeModels.bind(null, newModels));
//    });
//      }, 100);
    
//        Voc.setupPlugs(data.plugs);
    Events.trigger('newPlugs', data.plugs);
    if (newModels.length) {
      promise.done(function() {        
        Events.trigger('modelsChanged', _.pluck(newModels, 'type'));
      });
    }
    
    return promise;
  }

  function loadModels(models, preventOverwrite) {
    var models = models || MODEL_CACHE;
    models.sort(function(a, b) {
      return a.enumeration ? -1 : 1;
    });
    
    for (var i = 0, len = models.length; i < len; i++) {
      var model = models[i];
      if (!preventOverwrite || !U.getModel(model.type)) {
        G.log('modelLoader', 'events', 'modelLoad', model.type);
        loadModel(model);
      }
    }
    
    return makeModelsPromise(_.pluck(models, 'type'));
  }

//  function loadModel(m, sync) {
////    if (sync)
//      _loadModel(m);
////    else
////      Q.whenIdle('nonDom', _loadModel, null, [m]);
//  }
  
  function loadModel(m) {
    if (m.enumeration)
      m = loadEnumModel(m);
    else
      m = loadNonEnumModel(m);

    if (m) {
      // model may not be ready for loading, we may need to wait for appProvider, appConsumer models to be loaded first
      Events.trigger('newModel', m);
      gotModel(m);
    }
  }

  function loadEnumModel(m) {
    return m;
  }
  
  function loadNonEnumModel(m) {
    if (!m.prototype)
      m = Resource.extend({}, m);
    
//    if (m.adapter)
//      setupAdapter(m);

    if (m.interfaces) {
      m.interfaces = _.map(m.interfaces, function(i) {
        if (i.indexOf('/') == -1)
          return 'http://www.hudsonfog.com/voc/system/fog/' + i;
        else
          return U.getLongUri1(i);
      });
    }
    
    var type = m.type = U.getTypeUri(m.type),
        isCustomModel = U.isAnAppClass(m);
    
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
    if (!m.enumeration) {
      _.defaults(m.properties, Resource.properties);
      _.extend(m.properties, U.systemProps);
    }
    
    m.superClasses = _.map(m.superClasses, function(type) {
      if (/\//.test(type))
        return U.getLongUri1(type);
      else
        return G.defaultVocPath + 'system/fog/' + type;
    });
      
    m.prototype.initialize = getInit.call(m);
//    Q.whenIdle('nonDom', function triggerInitPlugs() {
    Q.nonDom(function triggerInitPlugs() {
      Events.trigger('initPlugs', type);
    });
    
    return m;
  }
  
//  function setupAdapter(m) {
//    var appProviderType = U.getLongUri1("model/social/AppProviderAccount"),
//        appConsumerType = U.getLongUri1("model/social/AppConsumerAccount");
//    
//    if (!U.getModel(appProviderType) || !U.getModel(appConsumerType)) {
//      // wait till those models (and the associated resource lists - app.js getAppAccounts()) are initialized 
//      ModelLoader.getModels([appProviderType, appConsumerType]).done(loadModel.bind(null, m));
//      return;
//    }
//    
//    var currentApp = G.currentApp,
//        consumers = currentApp.dataConsumerAccounts,
//        providers = currentApp.dataProviders,
//        consumer = consumers && _.where({ // consumers could be an array of json objects, or a resourcelist
//          provider: m.app
//        }),
//        // HACK!!!!! //
////        provider = providers && providers.where({
////          app: m.app
////        }, true);      
//        provider = providers && providers.models[0];      
//        // END HACK //
//
//
//    if (!provider || !consumer)
//      delete m.adapter;
//    else {
//      m.API = new API(consumer, provider);
//      m.adapter = new Function('Events', 'Globals', 'ResourceList', 'Utils', 'Cache', 'API', "return " + m.adapter)(Events, G, ResourceList, U, C, m.API);
//    }
//    
////    if (provider == null)
////      throw new Error("The app whose data you are trying to use does not share its data");          
////        
////    if (consumer == null)
////      throw new Error("This app is not configured to consume data from app '{0}'".format(provider.app));
//  }
  
  function getInit() {
    var self = this;
    return function() { 
      self.__super__.initialize.apply(this, arguments); 
    }
  }

  function loadEnums() {
    var enums = getEnumsFromStorage();
    if (!enums)
      return;
    
    ENUMS = JSON.parse(enums);
    for (var type in ENUMS) {
      makeModelPromise(type);
      loadModel(ENUMS[type], true); // load enums synchronously
    }
  }

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
    for (var i = 0, len = models.length; i < len; i++) {
      var modelJson = models[i];
      if (modelJson.enumeration)
        enumModels[modelJson.type] = modelJson;
      else
        storeModel(modelJson, storageType);
    }
    
    if (_.size(enumModels)) {
//      var enums = getEnumsFromStorage();
//      enums = enums ? JSON.parse(enums) : {};
      if (!ENUMS)
        ENUMS = enumModels;
      else
        _.extend(ENUMS, enumModels);
      
      storeEnums(ENUMS, storageType);
    }
  }


  function getEnumsFromStorage() {
    return G.localStorage.get(ENUMERATIONS_KEY);
  }

  function storeEnums(enums) {
    G.localStorage.put(ENUMERATIONS_KEY, JSON.stringify(enums));
  }

  function deleteModelFromStorage(uri) {
    G.localStorage.del('metadata:' + uri);
    G.localStorage.del(type);
  }
  
  function getModelStorageURL(uri) {
    return MODEL_PREFIX + uri;
  }

  function getModelMetadataStorageURL(uri) {
    return MODEL_PREFIX + 'metadata:' + uri;
  }
 
  function getModelMetadataFromStorage(uri, source) {
    if (source === 'indexedDB')
      return getModelFromStorage(uri, source);
          
    return getItemFromStorage(getModelMetadataStorageURL(uri), source);
  }

  function getModelFromStorage(uri, source) {
    return getItemFromStorage(getModelStorageURL(uri), source);
  }
  
  function getItemFromStorage(url, source) {
    return G.getCached(url, source, MODEL_STORE.name).then(function(data) {
      if (typeof data == 'string') {
        try {
          data = JSON.parse(data);
        } catch (err) {
          debugger;
        }
      }
      
      if (!data || typeof data !== 'object')
        return G.getRejectedPromise();
      
      return data;
    });    
  }

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
    
    var tempData = U.filterObj(modelJson, U.isMetaParameter);
    _.each(_.keys(tempData), function(prop) {
      delete modelJson[prop];
    });
    
    data[getModelStorageURL(type)] = modelJson;
    G.putCached(data, {
      storage: storageType,
      store: MODEL_STORE.name
    }).always(function() {
      _.extend(modelJson, tempData);
    });
    
    
    
//    setTimeout(function() {
//      var type = modelJson.type;
//      G.localStorage.putAsync(getModelMetadataStorageURL(type), {
//        lastModified: modelJson.lastModified
//      });
//      
//      G.localStorage.putAsync(getModelStorageURL(type), JSON.stringify(modelJson));
//      _.pushUniq(G.storedModelTypes, type);
//    }, 100);
  }

  modelRequestCollector = new ModelRequestCollector();
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
    isDelayingFetch: function() {
      return !!modelRequestCollector.length();
    },
    storeModels: storeModels
  };
  
  _.extend(ModelLoader, Backbone.Events);
  return ModelLoader;
});