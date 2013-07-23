//'use strict';
define('resourceManager', [
  'globals',
  'utils', 
  'events', 
  'cache',
  'vocManager',
  'collections/ResourceList',
  '__domReady__'
].concat(Lablz.dbType == 'none' ? [] : ['taskQueue', 'indexedDB', 'idbQueryBuilder']), function(G, U, Events, C, Voc, ResourceList, __domReady__, TaskQueue, IndexedDBModule, QueryBuilder) {
  function getFileSystemPath(item, prop) {
    return U.getPath(item._uri) + '/' + prop;
  };
  
  var storeFilesInFileSystem = G.hasBlobs && G.hasFileSystem && G.browser.chrome,
      Blob = window.Blob,
      FileSystem,
      useWebSQL = G.dbType == 'shim',//window.webkitIndexedDB && window.shimIndexedDB;
      NO_DB = G.dbType == 'none',
      RESOLVED_PROMISE = $.Deferred().resolve().promise(),
      REJECTED_PROMISE = $.Deferred().reject().promise(),
      REF_STORE = {
        name: 'ref',
        options: {
          keyPath: '_id'
        },
        indices: {
          _uri: {unique: true, multiEntry: false},
          _dirty: {unique: false, multiEntry: false},
          _tempUri: {unique: false, multiEntry: false}, // unique false because it might not be set at all
          _problematic: {unique: false, multiEntry: false}
      //      ,
      //      _alert: {unique: false, multiEntry: false}      
        }
      },
      
      REF_STORE_PROPS = _.keys(REF_STORE.indices).concat(REF_STORE.options.keyPath),
      
      MODULE_STORE = {
        name: 'modules',
        options: {
          keyPath: 'url'
        }
      },
      
      REQUIRED_STORES = [REF_STORE, MODULE_STORE],
      
      /**
       * data is considered old 3 minutes after it has last been fetched from the server
       */
      MAX_DATA_AGE = 180000,
      IDB = IndexedDBModule.getIDB(G.serverName, {
        defaultStoreOptions: {keyPath: '_uri', autoIncrement: false},
        defaultIndexOptions: {unique: false, multiEntry: false},
        filePropertyName: '_filePath',
        getFileSystemPath: getFileSystemPath
      });
  
  
  useWebSQL && window.shimIndexedDB.__useShim();

  function isStale(timestamp, now) {
    return !timestamp || (now || G.currentServerTime()) - timestamp > MAX_DATA_AGE;
  };
  
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, data, options) {
    options = options || {};
    if (_.contains(['patch', 'create'], method)) {
      if (options.sync || NO_DB) {
        if (!G.online) {
          options.error && options.error(null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options);
          return;
        }
        else {
          Backbone.defaultSync.apply(this, arguments);
        }
      }
      else {
        var dfd = RM.saveItem(data, options);
        if (options.success)
          dfd.done(options.success);
        else if (options.error)
          dfd.fail(options.error);
      }
      
      return;
    }
    
    if (data.detached)
      return;
    
    var isUpdate, filter, isFilter, start, end, params, numRequested, stale, save, numNow, shortPage, collection, resource, lastFetchedOn,
    defaultSuccess = options.success, 
    defaultError = options.error,
    forceFetch = options.forceFetch || data._dirty,
    now = G.currentServerTime(),
    isCollection = U.isCollection(data),
    vocModel = data.vocModel,
    fetchFromServer = function(isUpdate, timeout) {
      if (!isCollection && U.isTempUri(data.getUri())) {
        options.error && options.error(data, {code: 204}, options);
        return;
      }
      
      RM.fetchResources(method, data, options, isUpdate, timeout, lastFetchedOn);
    };
    
    if (!isCollection && U.isTempUri(data.getUri()))
      forceFetch = false;
      
    data._dirty = 0;
    if (isCollection)
      collection = data;
    else {
      collection = data.collection;
      resource = data;
    }
    
    if (isCollection) {
      lastFetchedOn = collection.models.length && collection.models[0].loaded && RM.getLastFetched(data, now);
      params = collection.params;
      filter = U.getQueryParams(collection);
      isFilter = !!filter;
      if (isCollection && options.from) {
        start = params.$offset; // not a jQuery thing
        options.start = start = start && parseInt(start);
      }
      else
        options.start = start = 0;

      numRequested = params.$limit ? parseInt(params.$limit) : collection.perPage;
      start = start || 0;
      options.end = end = start + numRequested;
      numNow = collection.models.length;
      shortPage = !!(numNow && numNow < collection.perPage);
      isUpdate = options.isUpdate = numNow >= end || shortPage;
      if (isUpdate) {
        if (forceFetch)
          return fetchFromServer(isUpdate, 100);
        if (isStale(lastFetchedOn, now))
          return fetchFromServer(isUpdate, 100); // shortPage ? null : lf); // if shortPage, don't set If-Modified-Since header
        else if (numNow) {
          defaultSuccess(null, 'success', {status: 304});
          return; // no need to fetch from db on update
        }
      }
      else if (start < numNow) {
        return; // no need to refetch from db, we already did
      }
    }
    else {      
      lastFetchedOn = RM.getLastFetched(resource);
      isUpdate = options.isUpdate = resource.loaded || resource.collection;
      if (isUpdate) {
        if (forceFetch)
          return fetchFromServer(isUpdate, 100);
        
        var ts = RM.getLastFetchedTimestamp(resource, now);
        if (isStale(ts, now))
          return fetchFromServer(isUpdate, 100);
        else  
          return;
      }
    }
    
    var luri = window.location.hash;
    var key = luri &&  luri.indexOf('#make') == 0 ? null : data.getKey && data.getKey();
    if (!key) {
      if (G.online)
        fetchFromServer(isUpdate, 0);
      
      return;
    }
    
    var dbReqOptions = {key: key, data: data};
    if (isCollection) {
      dbReqOptions.from = options.from,
      dbReqOptions.perPage = collection.perPage;
      dbReqOptions.filter = isFilter && filter;
    }
    else
      dbReqOptions.uri = key;

    var dbPromise = RM.getItems(dbReqOptions);
    if (dbPromise.state() == 'rejected') {
      if (G.online)
        fetchFromServer(isUpdate, 0);
      else
        options.sync && options.error && options.error(data, {type: 'offline'}, options);
      
      return;
    }
    
    dbPromise.done(function(results) {
      if (!results || (isCollection && !results.length))
        return fetchFromServer(isUpdate, 100);
    
      options.sync = false;
      // simulate a normal async network call
      data.lastFetchOrigin = 'db';
      G.log(RM.TAG, 'db', "got resources from db: " + vocModel.type);
      results = U.getObjectType(results) === '[object Object]' ? [results] : results;
      var resp = {data: results, metadata: {offset: start}};
      var numBefore = isCollection && collection.models.length;
      defaultSuccess(resp, 'success', null); // add to / update collection

      if (!isCollection) {
        if (forceFetch)
          return fetchFromServer(isUpdate, 0);
        
        isUpdate = options.isUpdate = true;
        var lf = RM.getLastFetched(results, now);
        if (isStale(lf, now))
          fetchFromServer(isUpdate, 100);
        
        return;
      }
      
      if (forceFetch) {
        return fetchFromServer(isUpdate, 0);
      }
      
      var numAfter = collection.models.length;
      if (!isUpdate && numAfter === numBefore) // db results are useless
        return fetchFromServer(isUpdate, 100);
      
      var lf = RM.getLastFetched(results, now);
      if (isStale(lf, now))
        return fetchFromServer(isUpdate, 100);
    }).fail(function(e) {
      if (e) 
        G.log(RM.TAG, 'error', "Error fetching data from db: " + e);
      fetchFromServer(isUpdate, 0);
    }).progress(function(db, event) {
      error = error;
    });
  };
  
  var RM;
  var ResourceManager = RM = {
    TAG: 'Storage',
    fetchResources: function(method, data, options, isUpdate, timeout, lastFetchedOn) {
        if (!G.online) {
        options.error && options.error(null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options);
          return;
        }
      
  //      if (!forceFetch && isUpdate) // && !shortPage)
        if (isUpdate && !options.forceFetch) {
          lastFetchedOn = lastFetchedOn || RM.getLastFetched(data);
          RM.setLastFetched(lastFetchedOn, options);
        }
  
        if (timeout) {
        var self = this, args = arguments;
          setTimeout(function() {
            RM._fetchHelper.apply(self, args);
          }, timeout);
        }
        else
        RM._fetchHelper.apply(this, arguments);
    },
    
    _fetchHelper: function(method, data, options) {
      if (options.sync || !G.hasWebWorkers)
        return RM.defaultSync(method, data, options);
        
      U.ajax({url: options.url, type: 'GET', headers: options.headers}).always(function() {
        data.lastFetchOrigin = 'server';
      }).done(function(data, status, xhr) {
        options.success(data, status, xhr);
      }).fail(function(xhr, status, msg) {
//        if (xhr.status === 304)
//          return;
//        
        G.log(RM.TAG, 'error', 'failed to get resources from url', options.url, msg);
        options.error(null, xhr, options);
      });      
    },
        
    defaultSync: function(method, data, options) {
      if (options.sync)
        options.timeout = 10000;
      
      var tName = 'sync ' + options.url;
      G.startedTask(tName);
      var success = options.success;
      options.success = function() {
        G.finishedTask(tName);
        data.lastFetchOrigin = 'server';
        success.apply(data, arguments);
      }
      
      return Backbone.defaultSync(method, data, options);
    },
    
    getLastFetchedTimestamp: function(resOrJson) {
      return U.getValue(resOrJson, '_lastFetchedOn') || U.getValue(resOrJson, 'davGetLastModified');
    },
    
    getLastFetched: function(obj, now) {
      now = now || G.currentServerTime();
      if (!obj) 
        return now;
      
      var ts,
          type = U.getObjectType(obj).toLowerCase();
      
      switch (type) {
        case '[object array]':
          ts = _.reduce(obj, function(memo, next)  {
            return Math.min(memo, RM.getLastFetchedTimestamp(next) || 0);
          }, Infinity);
          break;
        case '[object object]':
          ts = RM.getLastFetchedTimestamp(obj);
          break;
        case '[object number]':
          ts = obj;
          break;
      }

      return ts || 0;
    },
  
    setLastFetched: function(lastFetchedOn, options) {
      if (lastFetchedOn) {
        var ifMod = {"If-Modified-Since": new Date(lastFetchedOn).toUTCString()};
        options.headers = options.headers ? _.extend(options.headers, ifMod) : ifMod;
      }
    },
  
  
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
            
        // is a model store, not one of the required stores
        if (U.getEnumModel(type) || U.getInlineResourceModel(type))
          continue;
        
        var vocModel = U.getModel(type);
        if (!vocModel)
          throw new Error("missing model for " + type + ", it should have been loaded before store create operation was queued");
        
        indices = U.toObject(U.getIndexNames(vocModel) || []);
        IDB.createObjectStore(type, null, indices);
      }

      return IDB.start();
    },
    
    put: function(storeName, items) {
      return IDB.put(storeName, items);
    },
    
    addItems: function(items, classUri) {
      items = [].slice.call(items);
      return $.Deferred(function(defer) {
        if (!items || !items.length)
          return defer.reject();
        
        if (!classUri) {
          var first = items[0];
          if (U.isModel(first))
            classUri = first.vocModel.type;
          else
            classUri = U.getTypeUri(items[0]._uri);
        }
        
        if (!U.getModel(classUri)) {
          return Voc.getModels(classUri).done(function() {
            RM.addItems(items, classUri).done(defer.resolve).fail(defer.reject);
          }).fail(defer.reject);
        }
        
        if (!IDB.hasStore(classUri)) {
          RM.upgrade([classUri]).done(function() {
            RM.addItems(items, classUri).then(defer.resolve, defer.reject);
          });
          
          return;
        }
                
        var vocModel = U.getModel(classUri);
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          items[i] = U.isModel(item) ? item.toJSON() : item;
        }
        
        RM.put(classUri, items).then(defer.resolve, defer.reject);
      }).promise();      
    }, //.async(100),
    
//    syncQueue: new TaskQueue("sync with server"),
    
    SYNC_TASK_NAME: 'sync with server',
    sync: function() {
      if (NO_DB || G.currentUser.guest)
        return;

      if (!G.online) {
        Events.once('online', RM.sync);
        return;
      }
        
      var version = IDB.getVersion() || 0;
      if (version <= 1)
        return;
        
      function retry() {
        setTimeout(RM.sync, 2000);
      };
      
      IDB.queryByIndex('_problematic').neq(1).and(IDB.queryByIndex('_dirty').eq(1)).getAll(REF_STORE.name).done(function(results) {
        if (!results.length)
          return;
        
        var types = [];
        for (var i = 0; i < results.length; i++) {
          U.pushUniq(types, U.getTypeUri(results[i]._uri));
        }
        
        Voc.getModels(types, {sync: false}).done(function() {
          RM.syncResources(results);
        }).fail(retry);
      }).fail(retry);
    },

    checkDelete: function(res) {
      var canceled = U.getCloneOf(res.vocModel, 'Cancellable.cancelled');
      if (!canceled || !canceled.length || !res.get(canceled[0]))
        return;
      
      res['delete']();
    },
    
    saveToServer: function(updateInfo) {
      var dfd = $.Deferred(),
          promise = dfd.promise(),
          info = updateInfo,
          resource = info.resource, 
          ref = info.reference,
          refs = info.references,
          vocModel = resource.vocModel,
          type = vocModel.type,
          atts = _.omit(ref, REF_STORE_PROPS);
      
      atts.$returnMade = true;  
      resource.save(atts, { // ref has only the changes the user made
        sync: true, 
        fromDB: true,
        success: function(model, data, options) {
          if (!data) { // probably it was canceled and deleted
            RM.checkDelete(model);
            dfd.resolve();
            Events.trigger('synced:' + ref._uri, data, model);
            return;
          }
          
          if (RM.checkDelete(model)) {
            dfd.resolve();
            Events.trigger('synced:' + ref._uri, data, model);
            return;
          }
          
          if (!data._uri) {
            // TODO: handle errors
            debugger;
            dfd.resolve();
          }
          
          var oldUri = ref._uri,
              newUri = data._uri,
              tempUri = ref._tempUri;
        
          var oldType = U.getTypeUri(oldUri);
          var newType = U.getTypeUri(newUri);
          var changeModelDfd = $.Deferred();
          if (oldType !== newType) {
            Voc.getModels(newType).done(function() {
              changeModelDfd.resolve(U.getModel(newType));
            }).fail(changeModelDfd.reject);
          }
          else
            changeModelDfd.resolve(vocModel);
          
          ref = {
            _uri: newUri, 
            _dirty: 0, 
            _id: ref._id
          };
          
          tempUri = tempUri || (oldUri !== newUri && oldUri);
          if (tempUri)
            ref._tempUri = tempUri;
          
          if (storeFilesInFileSystem) {
            var uploadProps = U.filterObj(atts, function(key, val) {return !!val._filePath});
            if (_.size(uploadProps)) {
              var filesToDel = _.pluck(_.values(uploadProps), '_filePath');
              getFileSystem().done(function() {
                _.each(filesToDel, function(path) {
                  FileSystem.deleteFile(path);
                });
              });
            }
          }
          
          IDB.transaction([type, REF_STORE.name], 1).done(function() {
            changeModelDfd.always(function(newModel) {                
              Events.trigger('synced:' + oldUri, data, newModel);
            });
//              if (model.collection)
//                Events.trigger('refresh', newUri);
            
            dfd.resolve(ref);
          }).fail(function() {
            debugger;
          }).progress(function(transaction) {
            var resStore = transaction.objectStore(type, 1);
            RM.put(resStore, data);
            RM.put(transaction.objectStore(REF_STORE.name, 1), ref);
            if (newUri !== oldUri) {
              resStore["delete"](oldUri);
              data._oldUri = oldUri;
            }              
          }).always(dfd.resolve); // resolve in any case, so sync operation can conclude
        },
        error: function(model, xhr, options) {
          var code = xhr.status || xhr.code;
          if (code == 0) { // timeout
            RM.sync();
            return;
          }
//            else if (code == 304)
//              return;
          
          var problem = xhr.responseText;
          if (problem) {
            try {
              problem = JSON.parse(problem);
              ref._error = problem.error;
            } catch (err) {
              problem = null;
            }
          }
          
          ref._error = ref._error || {code: -1, details: (ref._tempUri ? 'There was a problem creating this resource' : 'There was a problem with your edit')};
          var isMkResource = !ref._tempUri;
          var toSave;
          var errInfo = _.pick(ref, '_uri', '_error');
          resource.set(errInfo);
          
          if (isMkResource)
            toSave = _.extend(U.getQueryParams(atts, resource.vocModel), errInfo);
          else
            toSave = resource.toJSON(); //_.extend(resource.toJSON(), errInfo);
          
          resource.trigger('syncError', ref._error);
          ref._problematic = 1;
//            if (status > 399 && status < 600) {
            RM.$db.transaction([type, REF_STORE.name], 1).fail(function() {
              debugger;
            }).progress(function(transaction) {
              RM.put(ref, transaction.objectStore(REF_STORE.name, 1));
              RM.put(toSave, transaction.objectStore(type, 1));
            }).always(dfd.resolve); // resolve in any case, so sync operation can conclude
//            }
//            else {
//              debugger;
//              dfd.resolve(); // resolve in any case, so sync operation can conclude
//            }
        }
      });
        
      return promise;
    },
    
    syncResource: function(ref, refs) {
      var uri = ref._uri,
          type = U.getTypeUri(uri),
          id = ref.id,
          vocModel = U.getModel(type),
          props = vocModel.properties,
          dfd = $.Deferred(),
          promise = dfd.promise();

      if (!IDB.hasStore(type)) {
        debugger;
        return REJECTED_PROMISE;
      }
      
      if (!U.isTempUri(uri) && !_.size(_.omit(ref, REF_STORE_PROPS))) {
        ref._dirty = 0;
        return RM.put(REF_STORE.name, ref);
      }
      
      var updated = false, notReady = false;
      for (var p in ref) {
        if (/^_/.test(p)) // ignore props that start with an underscore
          continue;
        
        var val = ref[p], 
            prop = props[p];
        
        // check if we have any props pointing to temp uris, and if we do, check if we already uris for those resources. If yes, replace the temp uri with the real one
        if (prop && U.isResourceProp(prop) && typeof val === 'string' && U.isTempUri(val)) {
          // if the tempUri to which this resource points has already been sync'd with the server, and has a regular uri, we want to update this resource's pointer 
          var match = _.filter(refs, function(r) {
            return r._tempUri === val && r._uri; 
          });
          
          if (match.length) {
            ref[p] = match[0]._uri;
            updated = true;
          }
          else {
            notReady = true;
            break;
          }
        }
      }
      
      if (notReady) {
        debugger;
        if (updated) {
          // not ready to sync with server, but we can update the item in its respective table
          RM.put(REF_STORE.NAME, ref).done(function() {
            RM.get(type, uri).done(function(item) {
              RM.put(type, _.extend(item, ref)).then(dfd.resolve, dfd.reject);
            }).fail(dfd.resolve);
          }).fail(dfd.resolve);
        }
        else {
          dfd.resolve();
          RM.sync(); // queue up another sync
        }
        
        return promise;
      }
      
      var isMkResource = U.isTempUri(uri);
      var method = isMkResource ? 'm/' : 'e/';
//          delete item._uri; // in case API objects to us sending it
      
      var existingRes = C.getResource(uri);
      var existed = !!existingRes;
      if (!existingRes)
        existingRes = new vocModel(ref);
      
      var info = {resource: existingRes, reference: ref, references: refs};
      RM.saveToServer(info).always(function(updatedRef) {
        if (updatedRef && !_.isEqual(ref, updatedRef)) {
          var idx = refs.indexOf(ref);
          refs[idx] = updatedRef;
        }
        
        dfd.resolve();
      });
      
      return promise;
    },
    
    syncResources: function(refs) {
      return $.Deferred(function(defer) {
        var dfds = [],
            q = new TaskQueue('syncing some refs');
        
        _.each(refs, function(ref) {
          if (ref._dirty) {
            var dfd = q.queueTask('sync ref: ' + ref._uri, function(dfd) {
              return RM.syncResource(ref, refs).then(dfd.resolve, dfd.reject);
            }, true);
            
            dfds.push(dfd);
          }          
        });
        
        $.whenAll.apply($, dfds).then(defer.resolve, defer.reject);
      }).promise();
    },
    
    isSyncPostponable: function(vocModel) {
      return vocModel && !U.isA(vocModel, "Buyable");
    },
    
    makeTempID: function() {
      return G.currentServerTime();
    },
    
    saveItem: function(item, options) {
      var defer = $.Deferred(),
          promise = defer.promise(),
          vocModel = item.vocModel,
          now = RM.makeTempID(),
          uri = item.getUri(),
          type = vocModel.type,
          tempUri;
      
      if (!uri || item.detached) {
        tempUri = U.makeTempUri(type, now);
        item.set({'_uri': tempUri}, {silent: true});
      }

      var itemJson = tempUri ? item.toJSON() : item.getUnsavedChanges(),
          itemRef = _.extend({_id: now, _uri: uri || tempUri}, itemJson), 
          done = options.success,
          fail = options.error;
      
      if (uri) {
        function found(results) {
          var result = results[0];
          _.extend(result, itemJson);
          RM.saveItemHelper(result, item).done(defer.resolve).fail(defer.reject);            
        };
        
        function notFound() {
          RM.saveItemHelper(itemRef, item).done(defer.resolve).fail(defer.reject);            
        };
        
        IDB.queryByIndex('_uri').eq(uri).getAll(REF_STORE.name).done(function(results) {
          if (results.length)
            found(results);
          else
            notFound();
        }).fail(notFound);
      }
      else if (tempUri) {
        itemRef._uri = tempUri;
        RM.saveItemHelper(itemRef, item).done(defer.resolve).fail(defer.reject);
      }        
      
      return promise;
    },
    
    saveItemHelper: function(itemRef, item) {
      var addDefer = $.Deferred(),
          promise = addDefer.promise(),
          type = item.vocModel.type;
      
      promise.done(RM.sync);
      itemRef._dirty = 1;
      // a mkresource went awry, not sure if we need to do anything special as opposed to edit
      
//        var toKill;
//        if (itemRef._problematic && !itemRef._tempUri) {
        // (either way it will try to sync again after these latest changes by the user)
        
//          // a mkresource went awry, nuke the old one save the new one
//          debugger;
//          toKill = itemRef._id;
//          itemRef._id = U.makeTempID();
//          tempUri = U.makeTempUri(type, now);
//          item.set({'_uri': tempUri});
//        }
      
      itemRef._problematic = 0;
      RM.put(REF_STORE.name, itemRef).done(function() {
        RM.addItems([item], type).done(function() {
          addDefer.resolve();
        }).fail(function() {
          debugger;
          addDefer.reject();
        });
      }).fail(function() {
        debugger;
        addDefer.reject();
      });
      
      return promise;
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
    setTimeout(function() {
      RM.addItems(resources);
    }, 100);
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