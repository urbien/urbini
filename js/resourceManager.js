//'use strict';
define('resourceManager', [
  'globals',
  'utils', 
  'events', 
  'cache',
  'vocManager',
  'collections/ResourceList',
  '__domReady__'
].concat(Lablz.dbType == 'none' ? [] : [
  'taskQueue', 
  'indexedDB', 
  'idbQueryBuilder',
  'synchronizer',
  'resourceSynchronizer', 
  'collectionSynchronizer']), function(G, U, Events, C, Voc, ResourceList, __domReady__, TaskQueue, IndexedDBModule, QueryBuilder, Synchronizer, ResourceSynchronizer, CollectionSynchronizer) {
      
  function getSynchronizer(method, data, options) {
    return U.isModel(data) ? new ResourceSynchronizer(method, data, options) : new CollectionSynchronizer(method, data, options);
  };

  function getFileSystemPath(item, prop) {
    return U.getPath(item._uri) + '/' + prop;
  };
        
  var Blob = window.Blob,
      FileSystem,
      useWebSQL = G.dbType == 'shim',//window.webkitIndexedDB && window.shimIndexedDB;
      NO_DB = G.dbType == 'none',
      RESOLVED_PROMISE = $.Deferred().resolve().promise(),
      REJECTED_PROMISE = $.Deferred().reject().promise(),
      REF_STORE = G.REF_STORE,
      MODULE_STORE,
      MODEL_STORE,
      REQUIRED_STORES,
      
      /**
       * data is considered old 3 minutes after it has last been fetched from the server
       */
      MAX_DATA_AGE = G.MAX_DATA_AGE,
      IDB = IndexedDBModule.getIDB(G.serverName, {
        defaultStoreOptions: {keyPath: '_uri', autoIncrement: false},
        defaultIndexOptions: {unique: false, multiEntry: false},
        filePropertyName: G.storeFilesInFileSystem ? '_filePath' : null,
        getFileSystemPath: G.storeFilesInFileSystem ? getFileSystemPath : null
      });
  
  
  useWebSQL && window.shimIndexedDB.__useShim();

  function isStale(timestamp, now) {
    return !timestamp || (now || G.currentServerTime()) - timestamp > MAX_DATA_AGE;
  };
  
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, data, options) {
    return getSynchronizer(method, data, options).sync();
  };   
  
  var RM;
  var ResourceManager = RM = {
    TAG: 'Storage', 
    init: _.once(function() {
      MODULE_STORE = G.getModuleStoreInfo();
      MODEL_STORE = G.getModelStoreInfo();
      REQUIRED_STORES = G.getBaseObjectStoresInfo();
      Synchronizer.init();
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
      return IDB.wipe().done(function() {
        G.log(RM.TAG, 'info', 'deleted db');
        RM.databaseCompromised = false;
      });
    },

    cleanDatabaseAndReopen: _.debounce(function() {
      return RM.cleanDatabase().then(RM.openDB, RM.openDB);
    }, 2000, true),

    cleanDatabase: function() {
      return IDB.onOpen().then(function() {
        IDB.wipe(U.partial(U.op['!=='], MODULE_STORE.name));
      });
    },

    openDB: function() {
      _.each(REQUIRED_STORES, function(info) {
        IDB.createObjectStore(info.name, info.options, info.indices);
      });
      
      return IDB.start();
    },

    upgrade: function(mk, del) {
      if (G.dbType === 'none')
        return REJECTED_PROMISE;
      
      if (!IDB.isOpen())
        return IDB.onOpen().then(U.partialWith(this.upgrade, this, mk, del));
      
      mk = mk || [];
      del = del || [];
      
      if (del.length)
        IDB.deleteObjectStores(del);
      
      for (var i = 0; i < mk.length; i++) {
        var type = mk[i],
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
        
        IDB.createObjectStore(type, null, indices);
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
      debugger;
      var type = item.vocModel.type,
          uri = item.get('_uri');
      
      G.log(RM.TAG, 'db', 'deleting item', uri);
      IDB['delete'](type, uri);
      IDB.queryByIndex('_uri').eq(uri).getAll(REF_STORE.name).done(function(results) {
        IDB['delete'](REF_STORE.name, _.pluck(results || [], REF_STORE.options.keyPath));
      });      
    },
    
    getItem: function(type, uri) {
      if (!IDB.hasStore(type))
        return REJECTED_PROMISE;
      
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
          dfd = $.Deferred(),
          promise = dfd.promise(),
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
      
      if (!_.size(temps)) {
        function search() {
          options = _.clone(options);
          options.filter = data.belongsInCollection;
          return IDB.search(type, options);
        }
        
        query = QueryBuilder.buildQuery(data, filter);
        if (query) {
          return IDB.queryByIndex(query).getAll(type).then(function(results) {
            return results;
          }, search);
        }
        else
          return search();
      }
      
      var intermediateDfd = $.Deferred();
      IDB.queryByIndex('_tempUri').oneof(_.values(temps)).getAll(REF_STORE.name).then(intermediateDfd.resolve, intermediateDfd.reject);
      intermediateDfd.promise().done(function(results) {
        if (!results.length)
          return dfd.reject();
        
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
        
        RM.getItems(options).then(dfd.resolve, dfd.reject);
      }).fail(dfd.reject);
      
      return promise;
    },
    
    restartDB: IDB.restart

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  Events.on('updatedResources', function(resources) {
    G.whenNotRendering(function() {
      RM.addItems(resources);
    });
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
  
  Events.on('userChanged', RM.cleanDatabaseAndReopen);

  Events.on('preparingToPublish', function(app) {
    var appUri = app.getUri();
    var commonTypes = G.commonTypes;
    var wClType = commonTypes.WebClass;
    var designerPkg = G.sqlUrl + '/www.hudsonfog.com/voc/system/designer/';
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
    }).then(notify);
  });

  Events.on('VERSION:Models', RM.cleanDatabaseAndReopen);
  Events.on('VERSION', function(init) {
    RM.deleteDatabase().then(function() {
      Voc.storeModels();
    })
  });
  
  Events.on("saveToDB", function(resource) {
    
  });
  
  Events.on('delete', function(res) {
    RM.deleteItem(res);
  });

  Events.on('anonymousResource', function(baseResource, prop, res) {
    if (arguments.length == 1)
      res = baseResource;
    
    var type = res._uri ? U.getTypeUri(res._uri) : prop.range;
    Voc.getModels(type).done(function() {
      var model = U.getModel(type),
          newRes = new model(res); // let it get cached
      
      if (prop)
        baseResource.set(prop.shortName, newRes.getUri());
    });
  });

  Events.on('newBackLink', function(baseResource, prop, backLinkData) {
    var inline = prop.displayInline,
        setting = inline ? '_settingInlineList' : '_settingBackLink';
        range = U.getTypeUri(prop.range);
        
    if (baseResource[setting])
      return;
    
    baseResource[setting] = true;
    Voc.getModels(range).done(function() {
      var model = U.getModel(range);
//      _.map(backLinkData, function(res) { return new model(res); })
      var rl = new ResourceList(backLinkData, {model: model, params: U.getListParams(baseResource, prop), parse: true}); // get this cached
      if (inline)
        baseResource.setInlineList(prop.shortName, rl);
      
      RM.addItems(rl.models);
      baseResource[setting] = false;
    });
  });

  Events.on('createObjectStores', function(stores, cb) {
    RM.upgrade(stores).then(cb);
  });
  
//  /**
//   * sometimes when resources get created or edited, other resources get created/edited in the process.
//   * this handles updating those "side effect modificaitons"
//   */
//  Events.on('sideEffects', function(res, sideEffects) {
//    var isNew = res.isNew();
//    if (!isNew)
//      return; // TODO: notify that these resources changed
//    
//    var types = [];
//    var typeToUris = {};
//    _.each(sideEffects, function(uri) {
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
//  });
    
  return (Lablz.ResourceManager = ResourceManager);
});