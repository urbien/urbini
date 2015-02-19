define('resourceSynchronizer', [
  'globals',
  'underscore',
  'backbone',
  'utils',
  'events',
  'synchronizer',
  'vocManager',
  'taskQueue',
  'indexedDB'
], function(G, _, Backbone, U, Events, Synchronizer, Voc, TaskQueue, IndexedDBModule) {
  var NO_DB = G.dbType === 'none',
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      REF_STORE,
      REF_STORE_PROPS,
      serverSyncTimeout,
      syncQueue,
      SYNCING = false,
      SYNC_POSTPONED = 0;

  var backboneDefaultSync = Backbone.defaultSync || Backbone.sync;
//  function isSyncPostponable(vocModel) {
//    return vocModel && !U.isA(vocModel, "Buyable");
//  };

  function stripRefItem(ref) {
    var stripped = _.omit(ref, REF_STORE_PROPS);
    stripped._uri = ref._uri;
    return stripped;
  }

  ////////////// SYNCHRONIZER /////////////////

  function ResourceSynchronizer(data) {
    Synchronizer.apply(this, arguments);
  }

  ResourceSynchronizer.prototype = Object.create(Synchronizer.prototype);
  ResourceSynchronizer.constructor = ResourceSynchronizer;

  ResourceSynchronizer.prototype._preProcess = function() {
    if (this.data.detached)
      return false;

    var result = Synchronizer.prototype._preProcess.call(this),
        uri = this.data.getUri();

    if (this.data.isNew()) {
      this.info.isNew = true;
      this.info.isForceFetch = this.info.isUpdate = false;
    }

    return result;
  };

  ResourceSynchronizer.prototype._read = function() {
    if (!this._preProcess())
      return;

    if (!this.info.isNew && this._isUpdate() && !this.options.dbOnly) { // dbOnly means we want to fetch from db even if we've already fetched it before
      if (this._isForceFetch() || this._isStale())
        return this._delayedFetch();
    }

    return Synchronizer.prototype._read.apply(this, arguments);
  };

  ResourceSynchronizer.prototype._create = ResourceSynchronizer.prototype._patch = function() {
    this._preProcess();
    if (NO_DB || this._isSyncRequest()) {
      if (!G.online) {
        this._error(null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options);
        return;
      }
      else
        return backboneDefaultSync.call(this, this.method, this.data, this.options);
    }

    return this._saveItem().then(this._success, this._error);
  };

  ResourceSynchronizer.prototype._saveItem = function() {
    console.log("1. SAVE ITEM");
    var self = this,
        IDB = IndexedDBModule.getIDB(),
        item = this.data,
        options = this.options,
        vocModel = item.vocModel,
        uri = item.getUri(),
        type = vocModel.type,
        itemJson;

    if (!uri || item.detached) {
      debugger;
      return REJECTED_PROMISE;
    }

    itemJson = item.isNew() ? item.toJSON() : item.getUnsavedChanges();
    itemJson._uri = uri;

    if (!item.isNew() && item.get('davGetLastModified'))
      itemJson.davGetLastModified = item.get('davGetLastModified');

    function after() {
      return self._saveItemHelper(itemJson, item);
    };

    return IDB.get(REF_STORE.name, uri).then(function(result) {
      if (result) {
        _.extend(result, itemJson);
        itemJson = result;
      }

      return after();
    }, after);
  };

  ResourceSynchronizer.prototype._saveItemHelper = function(itemRef, item) {
    console.log("3. SAVE ITEM");
    var self = this,
        type = item.vocModel.type,
        dfd = $.Deferred(),
        IDB = IndexedDBModule.getIDB(),
        $idb = IDB.$idb,
        stores = [REF_STORE.name],
        andTypeStore = IDB.hasStore(type);

    if (andTypeStore)
      stores.push(type);

    itemRef._problematic = 0;
    IDB._queueTask({
      name: 'saving user changes',
      task: function() {
        // to ensure atomicity
        return $idb.transaction(stores, 1).progress(function(trans) {
          if (andTypeStore)
            trans.objectStore(type).put(stripRefItem(itemRef));

          trans.objectStore(REF_STORE.name).put(itemRef);
        })
      }
    }).done(function() {
      dfd.resolve();
      syncWithServer(100);
    }).fail(function() {
      debugger;
      dfd.reject();
    });

    return dfd.promise();
  };

  function put(storeName, items) {
    return IndexedDBModule.getIDB().put(storeName, items);
  }

  ResourceSynchronizer.prototype._getLastFetchedOn = function() {
    if (this.info && !_.isUndefined(this.info.lastFetchedOn))
      return this.info.lastFetchedOn;
    else
      return Synchronizer.getLastFetched(this.data, this._getNow());
  };

  ResourceSynchronizer.prototype._isUpdate = function() {
    return _.isUndefined(this.info.isUpdate) ? !!(this.data.isLoaded() || this.data.collection) : this.info.isUpdate;
  };

  ResourceSynchronizer.prototype._queryDB = function() {
    var self = this,
        IDB = IndexedDBModule.getIDB(),
        type = this.data.vocModel.type,
        uri = this.data.getUri(),
        tr,
        rr;

    if (!IDB.hasStore(type))
      return REJECTED_PROMISE;

    return IDB.$idb.transaction([type, REF_STORE.name], 0).progress(function(trans) {
      var refStore = trans.objectStore(REF_STORE.name),
          typeStore = trans.objectStore(type);

      refStore.get(uri).done(function(result) {
        rr = result;
      });

      typeStore.get(uri).done(function(result) {
        tr = result;
      });
    }).then(function() {
      return tr || rr;
    });
  };

  ResourceSynchronizer.prototype.canFetchFromServer = function() {
    return !this.data.isNew();
  },

  ResourceSynchronizer.prototype._onDBSuccess = function(result) {
    var isNew = this.info.isNew,
        dbOnly = this.options.dbOnly;

    if (!result) {
      if (isNew || dbOnly)
        return;
      else
        return this._fetchFromServer(100);
    }

    this._success(result, 'success', null); // add to / update collection
    if (isNew || dbOnly)
      return;

    if (this._isForceFetch())
      return this._fetchFromServer();

    this.info.isUpdate = this.options.isUpdate = true;
    var lastFetchedTS = Synchronizer.getLastFetched(result, this._getNow());
    if (this._isStale(lastFetchedTS, this._getNow()))
      return this._delayedFetch();
  };

  ResourceSynchronizer.prototype._getKey = function() {
    var urlInfo = U.getCurrentUrlInfo();
    if (this.info && !_.isUndefined(this.info.key))
      return this.info.key;
    else {
      var uri = this.data.getUri();
      return uri ? U.getLongUri1(uri, this.data.vocModel) : null;
    }
  };

  ResourceSynchronizer.sync = function() {
    syncWithServer();
  };

  function syncWithServer(delay) {
    console.log("1. SYNCING!");
    if (delay) {
      if (!serverSyncTimeout)
        serverSyncTimeout = setTimeout(syncWithServer, delay);

      return;
    }

    clearTimeout(serverSyncTimeout);
    serverSyncTimeout = null;

    if (NO_DB || G.currentUser.guest)
      return;

    if (!G.online) {
      Events.once('online', syncWithServer);
      return;
    }

    if (SYNCING) {
      SYNC_POSTPONED++;
      if (SYNC_POSTPONED < 5) {
        serverSyncTimeout = setTimeout(syncWithServer, 1000);
        return;
      }
    }

    SYNC_POSTPONED = 0;
    SYNCING = true;
    console.log("2. SYNCING!");
    var IDB = IndexedDBModule.getIDB(),
//        version = IDB.getVersion() || 0,
        types = [],
        self = this;

//    if (version <= 1)
//      return;

    var retry = function() {
      SYNCING = false;
      syncWithServer(2000);
    };

    IDB.queryByIndex('_problematic').eq(0).getAll(REF_STORE.name).done(function(results) {
      console.log("3. SYNCING!");
      if (!results || !results.length) {
        console.log("3.1 SYNCING - nothing to sync!");
        SYNCING = false;
        return;
      }

      for (var i = 0; i < results.length; i++) {
        _.pushUniq(types, U.getTypeUri(results[i]._uri));
      }

      Voc.getModels(types, {sync: false}).done(function() {
        console.log("4. SYNCING!");
        syncResources(results).always(function() {
          SYNCING = false;
        });
      }).fail(retry);
    }).fail(retry);
  }

  function syncResource(ref) {
    console.log("5. SYNCING!", ref._uri);
    var IDB = IndexedDBModule.getIDB(),
        uri = ref._uri,
        type = U.getTypeUri(uri),
        id = ref.id,
        vocModel = U.getModel(type),
        props = vocModel.properties,
        stores = [REF_STORE.name];

    if (!IDB.hasStore(type)) {
      // TODO figure out why it doesn't exist, queue create store
//      return IDB.createObjectStore(type).start();
      return Voc.getModels(type).done(function() {
        Events.trigger('createObjectStores', [type], syncWithServer);
      });

//      dfd.done(syncResource.bind(ref, refs));
//      return dfd.promise();
    }

    return IDB.get(type, uri).then(function(item) {
      if (item)
        stores.push(type);

      return IDB.$idb.transaction(stores, 1).progress(function(trans) {
        if (item)
          trans.objectStore(type).put(_.extend(item, stripRefItem(ref)));

        trans.objectStore(REF_STORE.name).put(ref);
      });
    }).then(function() {
      var resource = U.getResource(uri) || new vocModel(ref);
      return saveToServer(ref, resource);
    }, function() {
      debugger;
      syncWithServer(2000); // queue up another sync
    });
  }

  function syncResources(refs) {
//    syncQueue = syncQueue || new TaskQueue('syncing some refs');
//    refs = refs.filter(function(ref) { return ref._dirty });
    return $.whenAll.apply($, refs.map(function(ref) {
      return IndexedDBModule.getIDB()._queueTask({
        name: 'sync ref: ' + ref._uri,
//        timeout: false,
        task: function() {
          return syncResource(ref);
        }
      });
    }));
  }

  function saveToServer(ref, resource) {
    var IDB = IndexedDBModule.getIDB(),
        dfd = $.Deferred(),
        promise = dfd.promise(),
        vocModel = resource.vocModel,
        type = vocModel.type,
        atts = U.filterObj(ref, U.isNativeModelParameter),
        isNew = resource.isNew(),
        timeout = setTimeout(dfd.reject, 100000);

    promise.done(function() {
      clearTimeout(timeout);
    });

    resource.save(atts, { // ref has only the changes the user made
      sync: true,
      fromDB: true,
      success: function success(model, data, options) {
        if (checkDelete(model) || !data) {
          // probably it was canceled and deleted
//          ref = _.clone(ref);
//          ref._deleted = true;
//          dfd.resolve(ref);
          dfd.resolve();
          return;
        }

        if (!data._uri) {
          // TODO: handle errors
          debugger;
        }

        if (G.storeFilesInFileSystem) {
          var uploadProps = U.filterObj(atts, function(key, val) {return !!val._filePath});
          if (!_.isEmpty(uploadProps)) {
            var filesToDel = _.pluck(_.values(uploadProps), '_filePath');
            getFileSystem().done(function() {
              _.each(filesToDel, function(path) {
                FileSystem.deleteFile(path);
              });
            });
          }
        }

        dfd.resolve();
        var $idb = IDB.$idb;
        IDB._queueTask({
          name: 'update after sync',
          task: function() {
            // to ensure atomicity
            return $idb.transaction([type, REF_STORE.name], 1).progress(function(trans) {
              var typeStore = trans.objectStore(type),
                  refStore = trans.objectStore(REF_STORE.name);

              typeStore.put(data);
              refStore['delete'](ref._uri);
            });
          }
        }).done(function() {
          console.log("1. SYNCED ITEM");
        }).fail(function() {
          debugger;
//          dfd.reject();
        });
      },
      error: function(model, xhr, options) {
        var code = xhr.status || xhr.code;
        if (code < 200) { // timeout probably
          resource.clearErrors();
          dfd.resolve();
          return syncWithServer();
        }

        // for now
        console.debug("1. DELETING ITEM ON ERROR: ", xhr.responseJson);
        resource['delete']();
        dfd.resolve();

//        var problem = U.getJSON(xhr.responseText);
//        if (problem)
//          ref._error = problem;
//
//        var isMkResource = !ref._tempUri;
//        var toSave;
//        var errInfo = _.pick(ref, '_uri', '_error');
//        ref._error = ref._error || {code: -1, details: (isMkResource ? 'There was a problem creating this resource' : 'There was a problem with your edit')};
//        resource.set(errInfo);
//
//        if (isMkResource)
//          toSave = _.extend(U.getQueryParams(atts, resource.vocModel), errInfo);
//        else
//          toSave = resource.toJSON(); //_.extend(resource.toJSON(), errInfo);
//
//        resource.trigger('syncError', ref._error);
//        ref._problematic = 1;
//        $.whenAll(IDB.put(type, toSave), IDB.put(REF_STORE.name, ref)).then(function() {
//          dfd.resolve();
//        }, function() {
//          debugger;
//          dfd.reject();
//        });
      }
    });

    return promise;
  }

  function getRefTypes(refs) {
    return _.compact(_.pluck(refs, '_uri').map(U.getTypeUri));
  };

//  function updateTypeStores(updated) {
//    var IDB = IndexedDBModule.getIDB(),
//        hasStore = IDB.hasStore.bind(IDB),
//        stripped = updated.map(stripRefItem);
//
//    return Voc.getModels(getRefTypes(updated)).then(function() {
//      var typeToResources = {};
//      for (var i = 0; i < arguments.length; i++) {
//        // for each model, we want to make sure we store resources of its type in its store and all superclass stores
//        var model = arguments[i];
//        var types = U.getTypes(model).filter(hasStore);
//        if (!types.length)
//          continue;
//
//        var resources = stripped.filter(function(ref) {
//          return U.getTypeUri(ref._uri) == model.type;
//        });
//
//        for (var j = 0; j < types.length; j++) {
//          var type = types[i];
//          if (!typeToResources[type])
//            typeToResources[type] = [];
//
//          _.pushUniq(typeToResources[type], resources);
//        }
//      }
//
////      return $idb.transaction(_.keys(typeToResources)).oneof(_.pluck(items, '_uri')).getAll(storeName).then(function(results) {
////        debugger;
////        if (!results.length)
////          return;
////
////        return results.map(function(result) {
////          var res = _.find(resources, function(r) {
////            return r._uri == result._uri;
////          });
////
////          if (res)
////            return self.put(res);
////          else
////            return RESOLVED_PROMISE;
////        });
////      });
//
//
//      return _.map(typeToResources, function(resources, type) {
//        return IDB.updateOnly(type, resources);
//      });
//    });
//  }
//
//  /**
//   * writes "updated" to ref store and regular stores
//   * @updated refs with updated properties
//   */
//  function updateRefs(updated) {
//    if (!updated.length)
//      return RESOLVED_PROMISE;
//
//    debugger;
//    var IDB = IndexedDBModule.getIDB();
//    return $.whenAll(updateTypeStores(updated), IDB.put(REF_STORE.name, updated));
//  }

  function deleteRefs(refs) {
    if (!refs.length)
      return RESOLVED_PROMISE;

    Voc.getModels(getRefTypes(refs)).done(function() {
      for (var i = 0; i < refs.length; i++) {
        var uri = refs[i]._uri;
        Events.trigger('delete', uri, U.getModel(U.getTypeUri(uri)));
      }
    });
  }

  function checkDelete(res) {
    var canceled = U.getCloneOf(res.vocModel, 'Cancellable.cancelled')[0];
    if (canceled && res.get(canceled)) {
      res['delete']();
      return true;
    }
  }

  ResourceSynchronizer.init = function() {
    REF_STORE = G.getRefStoreInfo(),
    REF_STORE_PROPS = _.keys(REF_STORE.indices).concat(REF_STORE.options.keyPath);
    delete ResourceSynchronizer.init;
  };

  return ResourceSynchronizer;
});
