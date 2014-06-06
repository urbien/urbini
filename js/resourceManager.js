//'use strict';
define('resourceManager', [
  '__domReady__',
  'globals',
  'utils', 
  'events', 
  'cache',
  'vocManager',
  'collections/ResourceList',
  'lib/fastdom',
  'taskQueue', 
  'indexedDB', 
  'idbQueryBuilder',
  'synchronizer',
  'resourceSynchronizer', 
  'collectionSynchronizer'
], function(__domReady__, G, U, Events, C, Voc, ResourceList, Q, TaskQueue, IndexedDBModule, QueryBuilder, Synchronizer, ResourceSynchronizer, CollectionSynchronizer) {
      
  function getSynchronizer(method, data, options) {
    return U.isModel(data) ? new ResourceSynchronizer(method, data, options) : new CollectionSynchronizer(method, data, options);
  }

  var Blob = window.Blob,
      FileSystem,
      useWebSQL = G.dbType == 'shim',//window.webkitIndexedDB && window.shimIndexedDB;
      NO_DB = G.dbType == 'none',
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
//      REF_STORE = G.getRefStoreInfo(),
      MODULE_STORE,
      MODEL_STORE,
      REQUIRED_STORES,
      
      /**
       * data is considered old 3 minutes after it has last been fetched from the server
       */
      MAX_DATA_AGE = G.MAX_DATA_AGE,
      IDB = IndexedDBModule.getIDB(G.serverName, {
        defaultStoreOptions: {keyPath: '_uri', autoIncrement: false},
//        defaultStoreOptions: {keyPath: '_defaultIndex', autoIncrement: true},
        defaultIndexOptions: {unique: false, multiEntry: false},
        filePropertyName: G.storeFilesInFileSystem ? '_filePath' : null,
        fileTypePropertyName: G.storeFilesInFileSystem ? '_contentType' : null
      });
  
  
  useWebSQL && window.shimIndexedDB.__useShim();

  function isStale(timestamp, now) {
    return !timestamp || (now || G.currentServerTime()) - timestamp > MAX_DATA_AGE;
  }
  
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, data, options) {
    return getSynchronizer(method, data, options).sync();
  };   
  
  var RM;
  var ResourceManager = RM = {
    TAG: 'Storage', 
    init: _.once(function() {
      MODULE_STORE = G.getModulesStoreInfo();
      MODEL_STORE = G.getModelsStoreInfo();
      REQUIRED_STORES = G.getBaseObjectStoresInfo();
      Synchronizer.init();
      CollectionSynchronizer.init();
      ResourceSynchronizer.init();
    }),
  
    /////////////////////////////////////////// START IndexedDB stuff ///////////////////////////////////////////
    /**
     * Check if we need to delete any stores. Creation of stores happens on demand, deletion happens when models change
     */
    remakeObjectStores: function(types) {
      IDB.deleteObjectStores(types).createObjectStores(types).start();      
    },
    
    deleteDatabase: function() {
      return IDB.wipe(null, true).done(function() {
        G.log(RM.TAG, 'info', 'deleted db');
        RM.databaseCompromised = false;
      });
    },

    cleanDatabaseAndReopen: Q.debounce(function(del) {
      return RM.cleanDatabase(del).then(RM.openDB, RM.openDB);
    }, 2000, true),

    cleanDatabase: function(del) {
      return IDB.onOpen().then(function() {
        IDB.wipe(function(storeName) {
          return storeName != MODULE_STORE.name && 
                 storeName != MODEL_STORE.name;
        }, del);
      });
    },

    openDB: function() {
      for (var storeName in REQUIRED_STORES) {
        var info = REQUIRED_STORES[storeName];
        IDB.createObjectStore(info.name, info.options, info.indices);
      }
      
      return IDB.start();
    },

    upgrade: function(mk, del) {
      if (G.dbType === 'none')
        return REJECTED_PROMISE;
      
      if (!IDB.isOpen())
        return IDB.onOpen().then(this.upgrade.bind(this, mk, del));
      
      mk = mk || [];
      del = del || [];
      
      if (del.length)
        IDB.deleteObjectStores(del);
      
      for (var i = 0; i < mk.length; i++) {
        var type = mk[i],
            options,
            indices;

        if (type.startsWith('http')) {
          // is a model store, not one of the required stores
          if (U.getEnumModel(type) || U.getInlineResourceModel(type))
            continue;
          
          var vocModel = U.getModel(type);
          if (!vocModel)
            throw new Error("missing model for " + type + ", it should have been loaded before store create operation was queued");
          
          indices = U.toObject(U.getIndexNames(vocModel) || []);
        }
        else {
          for (var storeName in REQUIRED_STORES) {
            if (storeName == type) {
              options = REQUIRED_STORES[storeName].options;
              break;
            }
          }
        }
        
        IDB.createObjectStore(type, options, indices);
      }

      return IDB.start();
    },
    
    put: function(storeName, items) {
      return IDB.put(storeName, items);
    },
    
    sync: function() {
      ResourceSynchronizer.sync();
    },
    
    addItems: function(classUri, items) {
      if (arguments.length == 1) {
        items = classUri;
        classUri = null;
      }
      
      items = [].slice.call(items);
      if (!items || !items.length)
        return REJECTED_PROMISE;
      
      if (!classUri) {
        var first = items[0];
        if (U.isModel(first))
          classUri = first.vocModel.type;
        else
          classUri = U.getTypeUri(items[0]._uri);
      }
      
      if (classUri.startsWith('http') && !U.getModel(classUri)) {
        return Voc.getModels(classUri).then(function() {
          return RM.addItems(classUri, items);
        });
      }

      return Synchronizer.addItems(classUri, items);
    }, //.async(100),
    
//    syncQueue: new TaskQueue("sync with server"),
    
    SYNC_TASK_NAME: 'sync with server',
    checkDelete: function(res) {
      var canceled = U.getCloneOf(res.vocModel, 'Cancellable.cancelled');
      if (!canceled || !canceled.length || !res.get(canceled[0]))
        return;
      
      res['delete']();
    },    
    
    isSyncPostponable: function(vocModel) {
      return vocModel && !U.isA(vocModel, "Buyable");
    },    

    deleteItem: function(item) {
      var type = item.vocModel.type,
          uri = item.get('_uri'),
          REF_STORE = G.getRefStoreInfo();
      
      G.log(RM.TAG, 'db', 'deleting item', uri);
      IDB['delete'](type, uri);
      IDB.queryByIndex('_uri').eq(uri).getAll(REF_STORE.name).done(function(results) {
        IDB['delete'](REF_STORE.name, _.pluck(results || [], REF_STORE.options.keyPath));
      });      
    },
    
    getItem: function(type, uri) {
      if (!IDB.hasStore(type))
        return REJECTED_PROMISE;
      
      var REF_STORE = G.getRefStoreInfo();
      return IDB.get(type, uri).then(function(result) {
        if (result)
          return result;
        else if (!U.isTempUri(uri))
          return REJECTED_PROMISE;
        else
          return IDB.queryByIndex('_tempUri').eq(uri).getAll(REF_STORE.name);
      });
    },
    
    getItems: function(options) {
      if (NO_DB)
        return REJECTED_PROMISE;
      
      var type = U.getTypeUri(options.key),
          uri = options.uri;
      
      if (!IDB.hasStore(type))
        return REJECTED_PROMISE;
      
      if (uri)
        return this.getItem(type, uri);
        
      var filter = options.filter,
          data = options.data,
          props = data.vocModel.properties,
          temps = {},
          intermediateDfd,
          REF_STORE,
          query;
      
      // no searching by composite keys like user.name
      if (_.any(filter, function(val, key) {
        return /\./.test(key);
      })) {
        return REJECTED_PROMISE;
      }
            
      filter = filter || U.getQueryParams(data);
      for (var key in filter) {
        var val = filter[key];
        if (U.isResourceProp(props[key]) && U.isTempUri(val)) {
          temps[key] = val;
        }
      }
      
      if (_.isEmpty(temps)) {
        function search() {
          options = _.clone(options);
          options.filter = data.belongsInCollection;
          return IDB.search(type, options);
        }
        
        query = QueryBuilder.buildQuery(data, filter);
        if (query) {
          return IDB.queryByIndex(query).getAll(type).then(function(results) {
            return Q.wait(1).then(function() {  
              return results;
            });
          }, search);
        }
        else
          return search();
      }
      
      intermediateDfd = $.Deferred();
      REF_STORE = G.getRefStoreInfo();

      IDB.queryByIndex('_tempUri').oneof(_.values(temps)).getAll(REF_STORE.name).then(intermediateDfd.resolve, intermediateDfd.reject);
      return intermediateDfd.promise().then(function(results) {
        if (!results.length)
          return G.getRejectedPromise();
        
        var tempUriToRef = {};
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          if (r._uri) {
            tempUriToRef[r._tempUri] = r._uri;
          }
        }
        
        for (var key in temps) {
          var tempUri = temps[key];
          var ref = tempUriToRef[tempUri];
          if (ref) {
            filter[key] = ref._uri;
          }
        }
        
        debugger;
        return RM.getItems(options).then(Q.waitOne);
      });
    },
    
    restartDB: IDB.restart

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  Events.on('updatedResources', function(resources, type) {
    var i = resources.length;
    if (i) {
      var atts,
          val;
      
      //// HACK
      while (i--) {
        atts = resources[i].attributes;
        for (var p in atts) {
          val = atts[p];
          if (val && val._list)
            delete val._list;
        }
      }
      //// HACK (remove when you figure out why _list is not parsed and removed earlier
      
      Q.nonDom(RM.addItems.bind(RM, type, resources));
    }
  });

  Events.on('modelsChanged', function(changedTypes) {
    IDB.onOpen(function() {
      changedTypes = _.filter(changedTypes, function(t) {
        return IDB.hasStore(t);
      });
      
      if (changedTypes.length)
        RM.upgrade(changedTypes, changedTypes);  
//        RM.deleteObjectStores(changedTypes).createObjectStores(changedTypes).start();
    });
  });
  
  Events.on('userChanged', function() {
    RM.cleanDatabaseAndReopen();
  });

  Events.on('preparingToPublish', function(app) {
    var appUri = app.getUri(),
        commonTypes = G.commonTypes,
        wClType = commonTypes.WebClass,
        designerPkg = G.sqlUrl + '/www.hudsonfog.com/voc/system/designer/',
        REF_STORE = G.getRefStoreInfo();
    
    function notify(badBoys) {
      if (badBoys)
        Events.trigger('cannotPublish', errors)
      else
        Events.trigger('goodToPublish', app);
    };
    
    IDB.queryByIndex('parentFolder').eq(appUri).getAll(wClType).then(function(webCls) {
      if (!webCls)
        return;
      
      var webClUris = _.pluck(webCls, '_uri');
      // find all classes 
      var isDesignObj = IDB.queryByIndex('_uri').betweeq(designerPkg, designerPkg + '\uffff');
      var isBroken = IDB.queryByIndex('_problematic').eq(1);
      return isDesignObj.and(isBroken).getAll(REF_STORE.name);
    }).then(function(results) {
      if (!results.length)
        return;
      
      var badBoys = [];
      _.each(results, function(designerObj) {
        designerObj._error  = designerObj._error || {code: 400, details: 'Problems here. Help us out?'};
        if (webClUris.indexOf(designerObj._uri) >= 0 || webClUris.indexOf(designerObj.domain) >= 0) {
          badBoys.push(designerObj);
        }
      });
      
      return badBoys;
    }).always(notify);
  });

  Events.on('VERSION:Models', function(version) {
    RM.cleanDatabaseAndReopen().done(function() {      
      G.setVersion('Models', version);
      window.location.reload(); // otherwise pending reqs to database may fail and cause trouble, expecting object stores we just deleted
    });
  });
  
//  Events.on('VERSION', onVersionChange);
  Events.on('VERSION:DB', function(version, init) {
    RM.deleteDatabase().done(function() {
      Voc.storeModels();
      G.setVersion('DB', version);
      window.location.reload(); // otherwise pending reqs to database may fail and cause trouble, expecting object stores we just deleted
    });
  });
  
  Events.on('delete', function(res) {
    RM.deleteItem(res);
  });

  function getTypeToInfoMap(infos) {
    var isBLs = !!_.getFirstValue(infos).list,
        isResources = !isBLs;
    
    function getTypeUri(info) {
      var range;
      if (isBLs)
        range = info.prop && info.prop.range;
      else
        range = info.resource._uri ? U.getTypeUri(info.resource._uri) : info.prop.range;
      
      return U.getTypeUri(range); 
    };
    
    var typeToInfos = {};
    _.each(_.values(infos), function(info) {
      var type = getTypeUri(info);
      typeToInfos[type] = typeToInfos[type] || [];
      typeToInfos[type].push(info);
    });    
    
    return typeToInfos;
  }
  
  /**
   * @param resources - map of propName to info objects: {
   *  property: prop,
   *  resource: resource
   * }
   */
  Events.on('inlineResources', Q.defer.bind(Q, 5, 'nonDom', function(baseResource, resInfos) {
//    if (arguments.length == 1)
//      res = baseResource;
    
    var typeToResInfos = getTypeToInfoMap(resInfos);
    
//    var type = res._uri ? U.getTypeUri(res._uri) : prop.range;
    Voc.getModels(_.keys(typeToResInfos)).done(function() {
      var update = {};
      for (var type in typeToResInfos) {
        var resInfos = typeToResInfos[type],
            model = U.getModel(type);

        _.each(resInfos, function(resInfo) {
          var newRes = new model(resInfo.resource); // let it get cached
          if (resInfo.prop)
            update[propName] = newRes.getUri();
        });
      }
      
      baseResource.set(update);
    });
  }));

//  Events.on('inlineBacklinks', function(baseResource, backlinkInfos) {
//    Q.wait(1).done(function() {
//      var typeToBLInfos = getTypeToInfoMap(backlinkInfos);
//      Voc.getModels(_.keys(typeToBLInfos)).done(function() {
//        for (var type in typeToBLInfos) {
//          var blInfos = typeToBLInfos[type],
//              model = U.getModel(type);
//  
//          _.each(blInfos, function(info) {
//            var prop = info.prop,
//                propName = prop.shortName,
//                inline = prop.displayInline,
//                setting = inline ? '_settingInlineList' : '_settingBackLink';
//            
//            var currentlySetting = baseResource[setting] || [];
//            if (_.contains(currentlySetting, propName))
//              return;
//            else
//              currentlySetting.push(propName);
//            
//            var rl = new ResourceList(info.list, {
//              model: model, 
//              params: U.getListParams(baseResource, prop), 
//              parse: true
//            }); // get this cached
//            
//            if (inline)
//              baseResource.setInlineList(prop.shortName, rl);
//            
//            currentlySetting = U.copyArray(currentlySetting, propName);
//          });
//        }
//      });    
//    });
//  });

  Events.on('createObjectStores', function(stores, cb) {
    RM.upgrade(stores).then(cb);
  });
  
  /**
   * sometimes when resources get created or edited, other resources get created/edited in the process.
   * this handles updating those "side effect modificaitons"
   */
  Events.on('sideEffects', function(res, sideEffects) {
//    var isNew = res.isNew();
//    if (!isNew)
//      return; // TODO: notify that these resources changed
    
//    var types = [];
//    var typeToUris = {};
    var i = sideEffects.length;
    while (i--) {
      var uri = sideEffects[i],
          sideEffect = C.getResource(uri);
      
      if (sideEffect)
        sideEffect.fetch({ forceFetch: true });
    }
    
    
//    while (i--) {
//      var uri = sideEffects[i];
//      if (isNew) {
//        var type = U.getTypeUri(uri);
//        if (type == null)
//          sideEffects.splice(i, 1);
//        else {
//          var t = typeToUris[type] = typeToUris[type] || [];
//          t.push(uri);
//        }
//      }
//      else {
//        // TODO: notify that these resources changed
//      }
//    });
//    
//    require('collections/ResourceList').done(function(ResourceList) {
//      Voc.getModels(_.keys(typeToUris)).done(function() {
//        _.each(typeToUris, function(uris, type) {
//          var model = U.getModel(type);
//          new ResourceList(null, {model: model, _query: '$in=SELF,' + uris.join(',')}).fetch({
//            success: function() {
//              debugger;
//            }
//          });
//        });
//      });
//    });
  });
    
  return (Lablz.ResourceManager = ResourceManager);
});