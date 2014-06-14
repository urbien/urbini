define('resourceSynchronizer', [
  'globals', 
  'underscore', 
  'backbone', 
  'utils', 
  'events',
  'synchronizer', 
  'vocManager', 
  'taskQueue', 
  'indexedDB', 
  'cache'
], function(G, _, Backbone, U, Events, Synchronizer, Voc, TaskQueue, IndexedDBModule, C) {  
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
  
  function makeTempID() {
    return G.currentServerTime();
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
    
    if (U.isTempUri(uri)) {
      this.info.tempUri = uri;
      this.info.isForceFetch = this.info.isUpdate = false;
    }
    
    return result;
  };
  
  ResourceSynchronizer.prototype._read = function() {
    if (!this._preProcess())
      return;

    if (!this.info.tempUri && this._isUpdate() && !this.options.dbOnly) { // dbOnly means we want to fetch from db even if we've already fetched it before
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
//    console.log("1. SAVE ITEM");
    var self = this,
        IDB = IndexedDBModule.getIDB(),
        item = this.data,
        options = this.options,
        vocModel = item.vocModel,
        tempId = makeTempID(),
        uri = item.getUri(),
        type = vocModel.type,
        tempUri,
        itemJson,
        itemRef;
    
    if (!uri || item.detached) {
      tempUri = U.makeTempUri(type, tempId);
      item.set({'_uri': tempUri}, {silent: true});
    }

    itemJson = tempUri ? item.toJSON() : item.getUnsavedChanges();
    itemRef = _.extend({
      _id: tempId, 
      _uri: uri || tempUri
    }, itemJson); 
    
    if (!item.isNew() && item.get('davGetLastModified'))
      itemRef.davGetLastModified = item.get('davGetLastModified');
          
    if (tempUri) {
      itemRef._uri = tempUri;
      return this._saveItemHelper(itemRef, item);
    }
    
    function found(results) {
      var result = results[0];
      if (!result._dirty) {
        // if result._dirty == 0, we've already synced this resource to the server, so we should overwrite any resource-specific properties it has, and keep only the meta-props
        result = _.pick(result, REF_STORE_PROPS);
      }
        
//      console.log("2.a SAVE ITEM");
      _.extend(result, itemJson);      
      return self._saveItemHelper(result, item);            
    }
    
    function notFound() {
//      console.log("2.b SAVE ITEM");
      return self._saveItemHelper(itemRef, item);            
    }
    
    return IDB.queryByIndex('_uri').eq(uri).getAll(REF_STORE.name).then(function(results) {
      if (results && results.length)
        return found(results);
      else
        return notFound();
    }, notFound);
  };  
  
  ResourceSynchronizer.prototype._saveItemHelper = function(itemRef, item) {
//    console.log("3. SAVE ITEM");
    var self = this,
        type = item.vocModel.type;
    
    // a mkresource went awry, not sure if we need to do anything special as opposed to edit
    
//      var toKill;
//      if (itemRef._problematic && !itemRef._tempUri) {
      // (either way it will try to sync again after these latest changes by the user)
      
//        // a mkresource went awry, nuke the old one save the new one
//        debugger;
//        toKill = itemRef._id;
//        itemRef._id = U.makeTempID();
//        tempUri = U.makeTempUri(type, now);
//        item.set({'_uri': tempUri});
//      }
//    var IDB = IndexedDBModule.getIDB();
    itemRef._dirty = 1;
    itemRef._problematic = 0;
//    return $.whenAll(
//      IDB.put(REF_STORE.name, itemRef), 
//      Synchronizer.addItems(type, [item])
//    ).then(function() {
//      console.log("5. SAVE ITEM");
//      syncWithServer(100);
//    }, function() {
//      debugger;
//    });
    return put(REF_STORE.name, itemRef).then(function() {
//      console.log("4. SAVE ITEM");
      return Synchronizer.addItems(type, [item]).then(function() {
//        console.log("5. SAVE ITEM");
        syncWithServer();
      }, function() {
        debugger;
      });
    }, function() {
      debugger;
    });
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
    return _.isUndefined(this.info.isUpdate) ? !!(this.data.loaded || this.data.collection) : this.info.isUpdate;
  };

  ResourceSynchronizer.prototype._queryDB = function() {
    var self = this,
        IDB = IndexedDBModule.getIDB(),
        type = this.data.vocModel.type,
        uri = this.data.getUri();
    
    if (!IDB.hasStore(type))
      return REJECTED_PROMISE;
    
//    return IDB.get(type, this.data.getUri()).then(function(result) {
    return IDB.queryByIndex('_uri').eq(uri).getAll(type).then(function(results) {
      if (results && results.length)
        return results[0];
      else if (!U.isTempUri(uri))
        return REJECTED_PROMISE;
      else
        return IDB.queryByIndex('_tempUri').eq(uri).getAll(REF_STORE.name).then(function(results) {
          return results && results[0];
        });
    });
  };
  
  ResourceSynchronizer.prototype.canFetchFromServer = function() {
    return !this.data.isNew();
  },
  
  ResourceSynchronizer.prototype._onDBSuccess = function(result) {
    var isTemp = !!this.info.tempUri,
        dbOnly = this.options.dbOnly;
    
    if (!result) {
      if (isTemp || dbOnly)
        return;
      else
        return this._fetchFromServer(100);
    }
    
    this._success(result, 'success', null); // add to / update collection
    if (isTemp || dbOnly)
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
      Events.once('online', function() {
        syncWithServer();
      });
      
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
        version = IDB.getVersion() || 0,
        types = [],
        self = this;
    
    if (version <= 1)
      return;

    var retry = function() {
      SYNCING = false;
      syncWithServer(2000);
    };
    
    IDB.queryByIndex('_problematic').eq(0).and(IDB.queryByIndex('_dirty').eq(1)).getAll(REF_STORE.name).done(function(results) {
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
  
  function syncResource(ref, refs) {
    console.log("5. SYNCING!", ref._uri);
    var IDB = IndexedDBModule.getIDB(),
        uri = ref._uri,
        type = U.getTypeUri(uri),
        id = ref.id,
        vocModel = U.getModel(type),
        props = vocModel.properties;

    if (!IDB.hasStore(type)) {
      Voc.getModels(type);
//      Events.trigger('modelsChanged', type);
//      if (vocModel.superClasses.length)
//        type = vocModel.superClasses[0];
//      
//      if (!IDB.hasStore(type))
        return REJECTED_PROMISE;
    }
    
    if (!U.isTempUri(uri) && _.isEmpty(_.omit(ref, REF_STORE_PROPS))) {
      ref._dirty = 0;
      return put(REF_STORE.name, ref);
    }
    
    var updated = false, 
        tempUriRefs = {};
    
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
          tempUriRefs[p] = val;
        }
      }
    }
    
    var promise;
    if (!_.isEmpty(tempUriRefs)) {
      promise = IDB.queryByIndex('_tempUri').oneof(_.values(tempUriRefs)).getAll(REF_STORE.name).then(function(results) {
        if (!results)
          return;
        
        _.each(results, function(result) {
          var tempUri = result._tempUri;
          for (var prop in tempUriRefs) {
            if (tempUri == tempUriRefs[prop]) {
              ref[prop] = result._uri;
              delete tempUriRefs[prop];
              updated = true;
            }
          }
        });
      });
    }
    else
      promise = RESOLVED_PROMISE;
      
    return promise.then(function() {
      var after = !_.isEmpty(tempUriRefs) ? REJECTED_PROMISE : RESOLVED_PROMISE;
      if (updated) {
        return put(REF_STORE.name, ref).then(function() {
          return IDB.get(type, uri);
        }).then(function(item) {
          return put(type, _.extend(item, ref));
        }).then(function() {
          return after;
        });
      }
      else
        return after;
    }).then(function() {
      var resource = C.getResource(uri) || new vocModel(ref),
          info = {
            resource: resource, 
            reference: ref, 
            references: refs
          };
      
      return saveToServer(info).then(function(updatedRef) {
        if (updatedRef && !_.isEqual(ref, updatedRef)) {
//          if (updatedRef._tempUri)
//            Events.trigger('uriChanged', updatedRef._tempUri, updatedRef._uri);
          
          var idx = refs.indexOf(ref);
          if (~idx) {
            if (updatedRef._deleted)
              refs.splice(idx, 1);
            else
              refs[idx] = updatedRef;
          }
        }
      });
    }, function() {
//      debugger;
      syncWithServer(2000); // queue up another sync      
    });
  }
  
  function syncResources(refs) {
    var self = this;
    syncQueue = syncQueue || new TaskQueue('syncing some refs');
    
    return $.whenAll.apply($, _.map(refs, function(ref) {
      if (ref._dirty) {
        return syncQueue.queueTask('sync ref: ' + ref._uri, function() {
          return syncResource(ref, refs);
        });
      }          
      else
        return RESOLVED_PROMISE;
    }));
  }

  function saveToServer(updateInfo) {
    var IDB = IndexedDBModule.getIDB(),
        dfd = $.Deferred(),
        promise = dfd.promise(),
        info = updateInfo,
        resource = info.resource, 
        ref = info.reference,
        refs = info.references,
        vocModel = resource.vocModel,
        type = vocModel.type,
        atts = _.omit(ref, REF_STORE_PROPS),
        isNew = resource.isNew();
    
//    atts.$returnMade = true;
    resource.save(atts, { // ref has only the changes the user made
      sync: true, 
      fromDB: true,
      success: function success(model, data, options) {
        if (checkDelete(model) || !data) {
          // probably it was canceled and deleted
          ref = _.clone(ref);
          ref._deleted = true;
          dfd.resolve(ref);
          return;
        }
        
        if (!data._uri) {
          // TODO: handle errors
          debugger;
          dfd.resolve();
        }
        
        var oldUri = ref._uri,
            newUri = data._uri,
            tempUri = ref._tempUri,
            oldType = U.getTypeUri(oldUri),
            newType = U.getTypeUri(newUri);
        
        if (oldType !== newType) {
          Voc.getModels(newType).done(function(newModel) {
            resource.setModel(newModel);
          });
        }
          
        ref = {
          _uri: newUri, 
          _dirty: 0, 
          _id: ref._id
        };
        
        tempUri = tempUri || (oldUri !== newUri && oldUri);
        if (tempUri)
          ref._tempUri = tempUri;
        
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

        $.whenAll(IDB.put(type, data), IDB.put(REF_STORE.name, ref)).then(function() {          
          if (newUri !== oldUri) {
            data._oldUri = oldUri;
            return IDB['delete'](type, oldUri);
          }
        }).then(function() {
          dfd.resolve(ref);
        }, dfd.reject);
      },
      error: function(model, xhr, options) {
        var code = xhr.status || xhr.code; 
        if (code < 200) { // timeout probably
          resource.clearErrors();
          return syncWithServer();
        }
        
        debugger;
        // for now
        resource['delete']();
        
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
  
  function checkDelete(res) {
    var canceled = U.getCloneOf(res.vocModel, 'Cancellable.cancelled')[0];
    if (canceled && res.get(canceled))
      res['delete']();
  }

  ResourceSynchronizer.init = function() {    
    REF_STORE = G.getRefStoreInfo(),
    REF_STORE_PROPS = _.keys(REF_STORE.indices).concat(REF_STORE.options.keyPath);
    delete ResourceSynchronizer.init;
  };
  
  return ResourceSynchronizer;
});