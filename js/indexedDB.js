define('indexedDB', ['globals', 'underscore', 'events', 'utils', 'queryIndexedDB', 'taskQueue', 'cache'], function(G, _, Events, U, idbq, TaskQueue, C) {  
  var instance,
      FileSystem,
      fileSystemPromise,
      filePropertyName,
      fileTypePropertyName,
      useFileSystem,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      fileMap = {},
      READ_ONLY = 0,
      READ_WRITE = 1;
//      ,
//      defaultStoreOptions = {keyPath: prepPropName('_uri'), autoIncrement: false},
//      defaultIndexOptions = {unique: false, multiEntry: false};

  function Store(name, options, indices) {
    this.name = name;
    this.options = _.clone(options);
    if (this.options.keyPath)
      this.options.keyPath = prepPropName(options.keyPath);
    
    this.indices = [];
    for (var prop in indices) {
      this.indices.push(new Index(prop, indices[prop]));
    }    
  }
  
  function Index(property, options) {
    this.property = prepPropName(property);
    this.options = _.clone(options);
  }

  function isFileOrFilePath(item) {
    if (item instanceof Array)
      return _.any(item, isFileOrFilePath);
    
    for (var prop in item) {
      var val = item[prop];
      if (val && (val instanceof Blob || val[filePropertyName]))
        return true; 
    }
    
    return false;
  }

  function getFileSystemPath(item, prop, blob) {
//    var displayName = item[prop + '.displayName'];
//    if (!displayName && blob && blob.type)
//      displayName = blob.type.split('/')[1];

    var type = blob.type;
    return U.getPath(item._uri) + '/' + prop + (type ? '.' + type.slice(type.indexOf('/') + 1) : '');
  }        

  function _getFileSystem(items) {
//    items = !items ? null : _.isArray(items) ? items : [items];
    if (!items || (useFileSystem && !FileSystem && isFileOrFilePath(items))) { // HACK
      return (fileSystemPromise = U.require('fileSystem').done(function(fs) { 
        FileSystem = fs;
      }));
    }
    else
      return RESOLVED_PROMISE;
  }
  
  function getFileSystem(items) {    
    return FileSystem ? fileSystemPromise :  _getFileSystem(items);
  }

  function _saveFile(item, _item, prop, val) {
    var isUserCreation = !U.isCompositeProp(prop),
        contentType = val.type,
        uri,
        getFilePath;
    
    if (!isUserCreation) {
      uri = item[prop.split('.')[0]];
      if (uri) {
        var cached = fileMap[uri];
        if (cached) {
          if (_.isPromise(cached))
            getFilePath = cached;
          else
            getFilePath = U.resolvedPromise(cached);
        }
      }
    }
    
    if (!getFilePath) {
      // to avoid collisions while attempting to write the same file, we keep a promise in fileMap until we get the actual file handle
      getFilePath = fileMap[uri] = FileSystem.writeFile({
        blob: val,
        filePath: getFileSystemPath(item, prop, val)
      }).then(function(fileEntry) {
        return fileMap[uri] = fileEntry.fullPath;
      });
    }
    
    return getFilePath.done(function(filePath) {
      var placeholder = _item[prepPropName(prop)] = item[prop] = {};
      placeholder[filePropertyName] = filePath;
      placeholder[fileTypePropertyName] = contentType;
      
      var resource = C.getResource(item._uri);
      if (resource)
        resource.set(prop, placeholder, {silent: true});
    }).fail(function() {
      debugger;
    });
  }
  
//  function _convertImage(item, _item, prop, val) {
//    return $.Deferred(function(defer) {
//      var img = new Image;
//      img.src = val;
//      img.onload = function() {
//        var dataUrl = U.imageToDataURL(img);
//        prop = prop + '.dataUrl';
//        _item[prepPropName(prop)] = dataUrl;
//        defer.resolve();
//        
//        var resource = C.getResource(item._uri);
//        if (resource)
//          resource.set(prop, dataUrl, {silent: true});
//      };
//      
//      img.onerror = defer.reject.bind(defer);
//    }).promise();
//  }

  function _prep(item) {
    var promises = [],
        _item = item; // for now we don't need a new object
    
    delete item.__tasks__; // HACK
    for (var prop in item) {
      var val = item[prop];
      
      if (useFileSystem && val instanceof Blob)
        promises.push(_saveFile(item, _item, prop, val));
//      else if (/model/portal/Image\?/.test(val) && !item[prop + '.dataUrl'])
//        promises.push(_convertImage(item, _item, prop, val));
//      else
//        _item[prepPropName(prop)] = val;
    }

    if (promises.length) {
      return $.when.apply($, promises).then(function() {
        defer.resolve(_item);
      }, function() {
        debugger;
        defer.resolve(_item);          
      });
    }
    else 
      return U.resolvedPromise(_item);
  }
  
  function prep(items) {
    items = _.isArray(items) ? items : [items];
    return getFileSystem(items).then(function() {
      return $.when.apply($, _.map(items, _prep));
    }).then(function() {
      return _.toArray(arguments);
    });
  }

  function setPropertyValue(obj, propName, propValue) {
    obj[propName] = propValue;
  };
  
  function queueParse() {
    for (var i = 0; i < arguments.length; i++) {
      arguments[i].__tasks__ = [parse];
    }
  };
  
  function _parse(_items) {
    var promises,
        returnObj,
        parsed,
        i;
        
    if (!_items)
      return U.resolvedPromise(_items);
    
    promises = [];
    returnObj = U.getObjectType(_items) === '[object Object]';
    if (returnObj)
      _items = [_items];

    i = _items.length;
    while (i--) {
      _item = _items[i];
      for (var prop in _item) {
        var val = _item[prop];
        if (val  &&  filePropertyName  &&  val[filePropertyName]) {
          var parsedPropName = parsePropName(prop);
          var method = FileSystem && U.isCompositeProp(parsedPropName) ? 'readAsFile' : 'readAsBlob';
          promises.push(FileSystem[method](val[filePropertyName], val[fileTypePropertyName]).done(setPropertyValue.bind(null, _item, parsedPropName)));
        }
//        else
//          _item[parsedPropName] = val;
      }
    }
    
    parsed = returnObj ? _items[0] : _items;
    if (promises.length) {
      return $.whenAll.apply($, promises).then(function() {        
        return parsed;
      });
    }
    else
      return U.resolvedPromise(parsed);
  };

  function parse(_items) {
    if (!_items)
      return RESOLVED_PROMISE;
    
    var fsPromise = getFileSystem(_items);
    if (fsPromise.state() == 'resolved')
      return _parse(_items);
    else
      return fsPromise.then(_parse(_items));
  }
  
  function log() {
    var args = _.toArray(arguments);
    args.unshift("indexedDB", "db");
    G.log.apply(G, args);
  }
  
  function prepPropName(propName) {
//    return '_' + propName;
    return propName;
  }

  function parsePropName(propName) {
//    return propName.startsWith('_') ? propName.slice(1) : propName;
    return propName;
  }

  function getIDB(name, options) {
    return instance || (instance = new IDB(name, options));
  }
  
  function IDB(name, options) {
    var self = this;
    this.name = name;
    _.extend(this, options);
    filePropertyName = this.filePropertyName;
    fileTypePropertyName = this.fileTypePropertyName;
    useFileSystem = !!filePropertyName;
    this.stores = {};
    this._clearStoreMonitors();
    this.setDefaultStoreOptions(options.defaultStoreOptions || {});
    this.setDefaultIndexOptions(options.defaultIndexOptions || {});
    this.taskQueue = new TaskQueue("indexedDB");
//    this.defaultStoreOptions = defaultStoreOptions
    for (var fn in IDB.prototype) {
      this[fn] = this[fn].bind(this);
    }
  }
  
  IDB.prototype.onOpen = function(cb) {
    switch (this._openPromise.state()) {
    case 'resolved':
      return this._openPromise.done(cb);
      break;
    default:
      return this._openPromise.then(cb);
    }
  };
  
  IDB.prototype._clearStoreMonitors = function() {
    this.storesToMake = [];
    this.storesToKill = [];
  };
  
  IDB.prototype._queueTask = function(name, taskFn, isBlocking, priority, preventTimeout) {
    log('db', 'queueing task', name);
//    var originalTaskFn = taskFn;
//    taskFn = function(defer) {
//      var promise = originalTaskFn.apply(this, arguments);
//      if (promise !== defer.promise() && _.isPromise(promise))
//        promise.then(defer.resolve, defer.reject);
//    };
    
    return this.taskQueue.queueTask.apply(this.taskQueue, arguments);
  };
  
  IDB.prototype.setDefaultStoreOptions = function(options) {
    this.defaultStoreOptions = _.clone(options);
  };
  
  IDB.prototype.setDefaultIndexOptions = function(options) {
    this.defaultIndexOptions = options;
  };

  function doUpgrade(versionTrans) {
    var currentStores = instance.getStoreNames(),
        toMake = instance.storesToMake,
        toDelete = instance.storesToKill,
        doDelete = toDelete.length;
    
    instance._wasEmpty = !currentStores.length;
    
    // Delete stores instead of just clearing them, because indices may have changed
    for (var i = 0, len = toDelete.length; i < len; i++) {
      var storeName = toDelete[i];
      if (instance.hasStore(storeName)) {
        try {
          versionTrans.deleteObjectStore(storeName);
          delete instance.stores[storeName];
          log('db', 'cleared object store: ' + storeName);
        } catch (err) {
          debugger;
          log(['error', 'db'], '2. failed to delete object store {0}: {1}'.format(storeName, err));
        }
      }
    }
    
    if (doDelete && _.intersects(instance.storesToKill, _.pluck(instance.storesToMake, 'name'))) {
      // run delete and create separately to make sure stores are deleted before they are recreated 
      // this hack is for the benefit of WebSQL
      // obviously this crap shouldn't be this high in the abstraction level, as this module shouldn't need to care about WebSQL, so better move it to IndexedDBShim
      console.log("restarting indexedDB to delete stores");
      instance.storesToKill = [];
      instance.restart(instance.getVersion() + 2); 
      return;
    }
    
    for (var i = 0, len = toMake.length; i < len; i++) {
      var storeObj = toMake[i],
          storeName = storeObj.name,
          store;
      
      // don't remake an existing store
      if (_.contains(currentStores, storeName))
        continue;
      
      try {
        store = versionTrans.createObjectStore(storeName, storeObj.options);
        if (!store) {
          debugger;
          continue;
        }
        
        instance.stores[storeObj.name] = storeObj;
        log('db', 'created object store: ' + storeName);
        _.each(storeObj.indices, function(index) {
          store.createIndex(index.property, index.options);
          log('db', 'created index {0} for store {1}'.format(index.property, storeName));
        });
      } catch (err) {
        debugger;
        log(['error', 'db'], '2. failed to create object store {0}: {1}'.format(storeName, err));
      }
    }
    
    instance._clearStoreMonitors();
  }

  /**
   * @param name - name of the store or a Store object
   * @param options - store options, or null if 'name' is a Store object. Defaults to {keyPath: '_uri', autoIncrement: false} if unspecified.
   * @param indices - an array of index config objects. Defaults to {unique: false, multiEntry: false} if unspecified.
   */
  IDB.prototype.createObjectStore = function(name, options, indices) {
    var store;
    if (name instanceof Store) {
      store = name;
      if (this.isStoreBeingCreated(store.name))
        return this;
    }
    else if (typeof name == 'string') {
      if (this.isStoreBeingCreated(name))
        return this;
        
      if (this.defaultIndexOptions) {
        for (var prop in indices) {
          indices[prop] = _.defaults(indices[prop] || {}, this.defaultIndexOptions || {});
//          if (prop == '_uri')
//            indices[prop].unique = true;
        }
      }
      
      store = new Store(name, _.defaults(options || {}, this.defaultStoreOptions || {}), indices);
    }

    this.storesToMake.push(store);
    return this;
  };

  /**
   * Deletes and creates the store anew
   */
  IDB.prototype.recreateObjectStore = function(storeName) {
    var store = this.stores[storeName];
    if (!store)
      throw "Object store {0} doesn't exist, can't recreate it".format(storeName);
    
    this.deleteObjectStore(storeName);
    this.createObjectStore(store);
  };

  IDB.prototype.isStoreBeingCreated = function(name) {
    return !!_.find(this.storesToMake, function(store) {
      return store.name == name;
    });
  };
  
  /**
   * @param stores - an array of store config objects. See IDB.createObjectStore doc for store config object example
   */
  IDB.prototype.createObjectStores = function(stores) {
    _.each(stores, this.createObjectStore);
    return this;
  };

  IDB.prototype.deleteObjectStore = function(storeName, reason) {
//    log('deleting object store, not recommended unless you want to recreate it with new object store options. If you just want to reset the store, use clearObjectStore');
    if (!_.contains(this.storesToKill, storeName))
      this.storesToKill.push(storeName);
    
    return this;
  };
  
  /**
   * @param storeName - the name of the object stores to delete from the database
   */
  IDB.prototype.clearObjectStore = function(storeName, reason) {
    var self = this;
    this._queueTask('clearing object store {0}. {1}'.format(storeName, reason || ''), function() {
      return self.$idb.objectStore(storeName, READ_WRITE).clear();
    }, true);
    
    return this;
  };

  IDB.prototype.clearObjectStores = function(storeNames) {
    _.each(storeNames, this.clearObjectStore);
    return this;
  };

  /**
   * @param storeNames - the names of the object stores to delete from the database
   */
  IDB.prototype.deleteObjectStores = function(storeNames) {
    log('deleting object stores, not recommended unless you want to recreate it with new object store options. If you just want to reset the store, use clearObjectStore');
    _.each(storeNames, this.deleteObjectStore);
    return this;
  };
  
  IDB.prototype.getVersion = function() {
    return this.dbVersion; //this.db ? this.db.version : null;
  };

  IDB.prototype.start = function() {
    var upgradeNeeded = this.storesToMake.length || this.storesToKill.length;
    if (this.isOpen() && !upgradeNeeded)
      return RESOLVED_PROMISE;
    else {
      var version = this.getVersion();
      if (version && upgradeNeeded)
        version++;
      
      return this.restart(version);
    }    
  };

  IDB.prototype.getStoreNames = function() {
    var names = this.db && this.db.objectStoreNames;
    return names ? _.toArray(names._items || names) : [];
  };

  IDB.prototype.hasStore = function(storeName) {
    return this.getStoreNames().indexOf(storeName) !== -1;
  };
  
  function deleteAndReopen() {
//    this.db = null;
    return this.$idb.deleteDatabase().then(this.open);
  }
  
  IDB.prototype.wipe = function(filter, doDeleteStores) {
    if (!this.isOpen())
      return this.onOpen(this.wipe.bind(this, filter, doDeleteStores));
    
    if (this._wasEmpty)
      return RESOLVED_PROMISE;
    
    if (!filter)
      return this._queueTask('deleting IndexedDB {0}'.format(this.name), deleteAndReopen.bind(this), true);
    
    var cleanMethod = doDeleteStores ? this.deleteObjectStores : this.clearObjectStores;
    cleanMethod(_.filter(this.getStoreNames(), filter));
//    this.storesToKill = this.storesToKill.concat(_.filter(this.getStoreNames(), filter));
    return this.start();
  };
  
  IDB.prototype.isOpen = function() {
    return !!this.db;
  };
  
  IDB.prototype.open = function(version) {
    if (this._openDfd && this._openDfd.state() == 'pending') {
      debugger;
//      this._openDfd.reject();
      return this._openPromise;
    }
    
    var self = this,
        settings = {
          upgrade: doUpgrade
        };
    
    if (version)
      settings.version = version;

    this._openDfd = $.Deferred();
    this._openPromise = this._openDfd.promise();
    log("1. opening indexedDB");
    this.$idb = $.indexedDB(this.name, settings);
    this.$idb.done(function onopen(db, event) {
      log("opened indexedDB");
      self.db = db;
      self.dbVersion = db.version;
      if (!self.storesToMake.length) { // first open is special
        self.storesToMake = self.storesToMake.filter(function(store) {
          return !self.hasStore(store.name);
        });
              
        if (self.storesToMake.length) {
          self.db.close();
          settings.version = db.version + 1;
          self.$idb = $.indexedDB(self.name, settings);
          self.$idb.done(onopen);
          return;
        }
      }
      
      self._openDfd.resolve();
      Events.trigger('dbOpen');
    });
    
    return this._openPromise;
  };
  
  function restart(version) {
    version = version || this.getVersion();
    if (this.db) {
      this.db.close();
//      this.db = null;
    }
    
    return this.open(version);
  }
  
  IDB.prototype.restart = function(version, reason) {
    var prefix = this.db ? 're' : '', 
        name = '{0}starting IndexedDB {1}. {2}'.format(prefix, this.name, reason || ''),
        alreadyQueued = this.taskQueue.getQueued(name);
    
    return alreadyQueued || this._queueTask(name, restart.bind(this, version), true, false, true /* doesn't time out */);
  };

  IDB.prototype.close = function() {
    if (this.db) {
      this.db.close();
      delete this.db;
    }

    if (this._openDfd.state() == 'pending')
      this._openDfd.reject();
    
    delete this._openDfd;
    delete this._openPromise;
//    this._resetOpenPromise();
  };

//  IDB.prototype._resetOpenPromise = function() {
//    if (!this._openDfd || this._openDfd.state() != 'pending') {
//      this._openDfd = $.Deferred();
//      this._openPromise = this._openDfd.promise();
//    }
//  };
  
  function get(storeName, primaryKey) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;
      
    var resultDfd = $.Deferred(),
        resultPromise = resultDfd.promise(),
        transPromise = this.$idb.transaction([storeName], READ_ONLY).progress(function(trans) {
          log('started transaction to get ' + primaryKey);
          trans.objectStore(storeName).get(primaryKey).done(resultDfd.resolve).fail(resultDfd.reject);          
        });
    
    return $.when(resultPromise, transPromise).then(function(result) {
      log('returning result for ' + primaryKey);
      if (result instanceof Array)
        result = result[0];
      
      if (result) {
        queueParse(result);
        return result;
      }
      else
        return G.getRejectedPromise();
    });
  };

  IDB.prototype.get = function(storeName, uri) {
    return this._queueTask('get item {0} from store {1}'.format(uri, storeName), get.bind(this, storeName, uri));    
  };
  
  function getAllKeys(storeName) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;

    var resultDfd = $.Deferred(),
        transPromise = this.$idb.transaction([storeName], READ_ONLY).progress(function(trans) {
          trans.objectStore(storeName).getAllKeys().then(resultDfd.resolve, resultDfd.reject);
        });
    
    return resultDfd.promise();
  };

  IDB.prototype.getAllKeys = function(storeName) {
    return this._queueTask('get all keys from store {0}'.format(storeName), getAllKeys.bind(this, storeName));    
  };

  function getAll(storeName) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;

    var resultDfd = $.Deferred(),
        transPromise = this.$idb.transaction([storeName], READ_ONLY).progress(function(trans) {
          trans.objectStore(storeName).getAll().then(resultDfd.resolve, resultDfd.reject);
        });
    
    return resultDfd.promise();
  };

  IDB.prototype.getAll = function(storeName) {
    return this._queueTask('get all rows from store {0}'.format(storeName), getAll.bind(this, storeName));    
  };

  var queryRunMethods = ['getAll', 'getAllKeys'];
  function wrapQuery(query) {
    if (!query.betweeq && !query._queryFunc)
      return query;
    
    for (var fn in query) {
      if (typeof query[fn] == 'function') {
        if (_.contains(queryRunMethods, fn))
          wrapQueryRunMethod(query, fn);
        else
          wrapQueryBuildingMethod(query, fn);
      }
    }
    
    return query;
  }

  function wrapQueryBuildingMethod(query, fn) {
    var backup = query[fn];

    query[fn] = function() {
      var subQuery = backup.apply(query, arguments);
      return wrapQuery(subQuery);
    };
    
    if (fn == 'sort') {
      var backup2 = query[fn];
      query[fn] = function(column, reverse) {
        var args = _.toArray(arguments);
        args[0] = prepPropName(args[0]);
        return backup2.apply(query, args);
      }
    }
  }
  
  function wrapQueryRunMethod(query, fn) {
    var backup = query[fn];
    if (backup._wrapped)
      return;
    
    query[fn] = function(storeName) {
      if (!instance.hasStore(storeName))
        return REJECTED_PROMISE;

//      var args = _.toArray(arguments),
//          taskName = 'querying object store {0} by indices {1}'.format(storeName, _.now());
//      
//      return instance._queueTask(taskName, function(defer) {
//        console.debug("running task: " + taskName, query, fn, storeName);
//        var a = args.slice();
//        a[0] = instance.$idb.objectStore(a[0], READ_ONLY);
//        var intermediate = backup.apply(query, args);
//        setTimeout(function() {
//          if (intermediate.state() == 'pending' || defer.state() == 'pending')
//            debugger;
//        }, 5000);
//
//        intermediate.done(function(results) {
//          console.log("almost done with task: " + taskName);
//          if (results)
//            queueParse.apply(null, results);
//          else 
//            results = [];
//          
//          defer.resolve(results);
//        }).fail(defer.reject);
//      });
      
      // alternate implementation, not necessary now that _getAll in jquery-indexeddb makes sure transaction is complete before returning results
      var args = _.toArray(arguments),
          storeName = args[0],
          results;
      
      return instance._queueTask('querying object store {0} by indices'.format(storeName), function(defer) {
        instance.$idb.transaction([storeName], READ_ONLY).progress(function(trans) {
          args[0] = trans.objectStore(storeName);
          backup.apply(query, args).done(function(_results) {
            results = _results;
            if (results)
              queueParse.apply(null, results);
            else 
              results = [];            
          }).fail(defer.reject);
        }).done(function() {
          defer.resolve(results);
        }).fail(defer.reject);
      });

    };
    
    query[fn]._wrapped = true;
  }

  IDB.prototype.queryByIndex = function(indexNameOrQuery) {
    var query = typeof indexNameOrQuery == 'string' ? idbq.Index(prepPropName(indexNameOrQuery)) : indexNameOrQuery;
    wrapQuery(query);
    return query;
  };

//  function search1(storeName, options) {
//    if (!this.hasStore(storeName))
//      return REJECTED_PROMISE;
//
////    var trans = this.$idb.transaction([storeName], READ_ONLY),
//    var results = [],
//        orderBy = options.orderBy,
//        asc = options.asc,
//        limit = options.limit,
//        filter = options.filter,
//        from = options.from,
//        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
//        promises = [],
//        done = false,
//        dfd = $.Deferred(),
//        overallPromise = dfd.promise(),
//        transPromise,
//        start = _.now(),
//        processingTime = 0,
//        waitingTime = 0,
//        now,
//        tmp;
//
////    filter = filter || G.trueFn;    
////    transPromise = trans.progress(function(trans) {
////      var store = trans.objectStore(storeName);
//    this.$idb.objectStore(storeName, READ_ONLY).each(
//      function processItem(item) {
////        var t = _.now();
//        tmp = _.now();
//        if (now)
//          waitingTime += tmp - now;
//        
//        now = tmp;
//        if (done)
//          return false; // ends the cursor transaction
//        
//        var promise = parse(item.value).done(function(val) {
//          if (!filter || filter && filter(val)) {
//            results.push(val);
//            if (results.length >= limit)
//              done = true;
//          }      
//          
////          processingTime += (_.now() - t);
//        });
//    
//        if (promise.state() == 'pending')
//          promises.push(promise);
//        else {
//          if (done)
//            return false;
//        }
//      }, 
//      from && IDBKeyRange.lowerBound(from, true), 
//      direction
//    ).fail(function() {
//      debugger;
//      dfd.reject();
//    }).done(function() {
//      log('Getting {0} items from DB objectStore {1} took {2}ms, processing time: {3}, waiting time: {4}'.format(results.length + promises.length, storeName, _.now() - start | 0, processingTime | 0, waitingTime | 0));
//      if (promises.length) {
//        $.when.apply($, promises).done(function() {
//          dfd.resolve(results);
//        }).fail(dfd.reject);
//      }
//      else
//        dfd.resolve(results);
//    });
//    
//    return overallPromise; 
//  };

//  function search(storeName, options) {
//    if (!this.hasStore(storeName))
//      return REJECTED_PROMISE;
//
////    var trans = this.$idb.transaction([storeName], READ_ONLY),
//    var results = [],
//        orderBy = options.orderBy,
//        asc = options.asc,
//        limit = options.limit,
//        filter = options.filter,
//        from = options.from,
//        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
//        promises = [],
//        done = false,
//        dfd = $.Deferred(),
//        overallPromise = dfd.promise(),
//        transPromise,
//        start = _.now(),
//        processingTime = 0,
//        waitingTime = 0,
//        now,
//        tmp;
//
////    filter = filter || G.trueFn;    
////    transPromise = trans.progress(function(trans) {
////      var store = trans.objectStore(storeName);
//    this.$idb.objectStore(storeName, READ_ONLY).each(
//      function processItem(item) {
////        var t = _.now();
//        tmp = _.now();
//        if (now)
//          waitingTime += tmp - now;
//        
//        now = tmp;
//        if (done)
//          return false; // ends the cursor transaction
//        
//        var promise = parse(item.value).done(function(val) {
//          if (!filter || filter && filter(val)) {
//            results.push(val);
//            if (results.length >= limit)
//              done = true;
//          }      
//          
////          processingTime += (_.now() - t);
//        });
//    
//        if (promise.state() == 'pending')
//          promises.push(promise);
//        else {
//          if (done)
//            return false;
//        }
//      }, 
//      from && IDBKeyRange.lowerBound(from, true), 
//      direction
//    ).fail(function() {
//      debugger;
//      dfd.reject();
//    }).done(function() {
//      log('Getting {0} items from DB objectStore {1} took {2}ms, waiting time: {3}'.format(results.length + promises.length, storeName, _.now() - start | 0, waitingTime | 0));
//      if (promises.length) {
//        $.when.apply($, promises).done(function() {
//          dfd.resolve(results);
//        }).fail(dfd.reject);
//      }
//      else
//        dfd.resolve(results);
//    });
//    
//    return overallPromise; 
//  };

//  function search(storeName, options) {
//    if (!this.hasStore(storeName))
//      return REJECTED_PROMISE;
//
//    var trans = this.$idb.transaction([storeName], READ_ONLY),
//        results = [],
//        orderBy = options.orderBy,
//        asc = options.asc,
//        limit = options.limit,
//        filter = options.filter,
//        from = options.from,
//        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
//        promises = [],
//        done = false,
//        dfd = $.Deferred(),
//        overallPromise = dfd.promise(),
//        transPromise,
//        start = _.now(),
//        processingTime = 0,
//        waitingTime = 0,
//        now,
//        tmp,
//        keys;
//
//    if (filter === G.trueFn)
//      filter = null;
//    
//    transPromise = trans.progress(function(trans) {      
//      now = _.now();
//      function processItem(item) {
////        var t = _.now();
//        tmp = _.now();
//        if (now)
//          waitingTime += tmp - now;
//        
//        now = tmp;
//        if (done)
//          return false; // ends the cursor transaction
//        
//        var promise = parse(item.value).done(function(val) {
//          if (!filter || filter && filter(val)) {
//            results.push(val);
//            if (results.length >= limit)
//              done = true;
//          }      
//          
////          processingTime += (_.now() - t);
//        });
//    
//        if (promise.state() == 'pending')
//          promises.push(promise);
//        else {
//          if (done)
//            return false;
//        }
//      };
//      
//      trans.objectStore(storeName).each(processItem, from && IDBKeyRange.lowerBound(from, true), direction);
//    }).fail(function() {
//      debugger;
//      dfd.reject();
//    }).done(function() {
//      log('Getting {0} items from DB objectStore {1} took {2}ms, waiting time: {3}'.format(results.length + promises.length, storeName, _.now() - start | 0, waitingTime | 0));
//      if (promises.length) {
//        $.when.apply($, promises).done(function() {
//          dfd.resolve(results);
//        }).fail(dfd.reject);
//      }
//      else
//        dfd.resolve(results);
//    });
//    
//    return overallPromise; 
//  };

  function search(storeName, options) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;

    var trans = this.$idb.transaction([storeName], READ_ONLY),
        results = [],
        orderBy = options.orderBy,
        asc = options.asc,
        limit = options.limit,
        filter = options.filter,
        from = options.from,
        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
        promises = [],
        done = false,
        dfd = $.Deferred(),
        overallPromise = dfd.promise(),
        transPromise,
        start = _.now(),
        processingTime = 0,
        waitingTime = 0,
//        now,
//        tmp,
        keys,
        val;

    if (filter === G.trueFn)
      filter = null;
    
    transPromise = trans.progress(function(trans) {      
//      now = _.now();
      trans.objectStore(storeName).each(function processItem(item) {
  //      var t = _.now();
//        tmp = _.now();
//        if (now)
//          waitingTime += tmp - now;
//        
//        now = tmp;
        val = item.value;
        if (!filter || filter && filter(val)) {
          queueParse(val);
          results.push(val);
          if (results.length >= limit)
            return false; // stop cursor
        }
      }, from && IDBKeyRange.lowerBound(from, true), direction);
    }).fail(function() {
      debugger;
      dfd.reject();
    }).done(function() {
//      log('Getting {0} items from DB objectStore {1} took {2}ms, waiting time: {3}'.format(results.length + promises.length, storeName, _.now() - start | 0, waitingTime | 0));
      dfd.resolve(results);
//      if (promises.length) {
//        $.when.apply($, promises).done(function() {
//          dfd.resolve(results);
//        }).fail(dfd.reject);
//      }
//      else
//        dfd.resolve(results);
    });
    
    return overallPromise; 
  };

  
  /**
   * @storeName - name of the object store to query
   * @filterFn - ignore if you don't want any kind of filtration of results
   * @options - e.g. 
   * {
   *  orderBy: 'propertyName', 
   *  asc: true, 
   *  from: 'primary key of the resource you want as the lower bound for the search', 
   *  limit: 10, 
   *  filter: function(item) { 
   *    return !!item.happy 
   *  } 
   * }
   * 
   * @returns a JQuery Promise object
   */
  IDB.prototype.search = function(storeName, options) {
    return this._queueTask('{0} search for items in object store {1}'.format(G.nextId(), storeName), search.bind(this, storeName, options));
  };

  function put(storeName, items) {
    if (storeName.createIndex) {
      throw "Operation not supported at this time, please call 'put' with arguments storeName and items";
//      storeDfd.resolve(storeName);
    }
    
    // do them consecutively instead of in parallel because we don't want the db transaction to timeout in case prep() needs time to store stuff to the fileSystem
    // if prep doesn't involve saving files to the fileSystem, it's synchronous and takes very little time
    return prep(items).then(function(items) {      
      return instance.$idb.transaction(storeName, READ_WRITE).progress(function(trans) {
        var store = trans.objectStore(storeName);
        for (var i = 0, len = items.length; i < len; i++) {
          store.put(items[i]);
        }
//      }).done(function() {
//        if (G.DEBUG && storeName == 'ref')
//          console.debug('PUT:', items);
      }).fail(function() {
        debugger;
      })
    }).fail(function() {
      debugger;
    });
  }
  
  IDB.prototype.put = function(storeName, items) {
    items = _.isArray(items) ? items : [items];
    if (items.length)
      this._wasEmpty = false;
    
    return this._queueTask('saving items to object store {0}'.format(storeName), put.bind(this, storeName, items));
  };

  /** 
   * only update, don't insert
   */
  IDB.prototype.updateOnly = function(storeName, items) {
    debugger;
    var self = this;
    items = _.isArray(items) ? items : [items];
    return this.queryByIndex('_uri').oneof(_.pluck(items, '_uri')).getAll(storeName).then(function(results) {
      debugger;
      if (!results.length)
        return;
      
      return results.map(function(result) {
        var res = _.find(resources, function(r) {
          return r._uri == result._uri;
        });
        
        if (res)
          return self.put(res);
        else
          return RESOLVED_PROMISE;
      });
    });
  };

  function del(storeName, primaryKeys) {
    log('db', 'deleting items', primaryKeys.join(', '));
    return this.$idb.transaction([storeName], READ_WRITE).progress(function(trans) {
      var store = trans.objectStore(storeName);
      primaryKeys.forEach(function(primaryKey) {
        store['delete'](primaryKey).done(function() {
          log('db', 'deleted', primaryKey);
        });
      });      
    }).done(function() {
      primaryKeys.forEach(function(key) {
        Events.trigger('deleted', key);
      });
    });
  }

  IDB.prototype['delete'] = function(storeName, primaryKeys) {
    primaryKeys = _.isArray(primaryKeys) ? primaryKeys : [primaryKeys];
    return this._queueTask('deleting items from object store {0}'.format(storeName), del.bind(this, storeName, primaryKeys));
  };  

  function wrap($idbObj, idbOp, args) {
    var pipeDfd = $.Deferred(),
        promise = pipeDfd.promise();
    
    function wrapper(dfd) {
      $idbObj[idbOp].apply($idbObj, args).then(dfd.resolve, dfd.reject, dfd.notify);
      dfd.then(pipeDfd.resolve, pipeDfd.reject, pipeDfd.notify);
    };
    
    function wrap(promise, fn) {
      wrapper[fn] = function(cb) {
        debugger;
        promise[method](cb); 
      };
    };
    
    for (var fn in promise) {
      if (typeof promise[fn] === 'function') {
        wrap(promise, fn);
      }
    }
    
    return wrapper;
  }
  
  // Untested
  IDB.prototype.transaction = function(storeName, mode) {
    var wrapper = wrap(this.$idb, 'transaction', arguments);
    return this._queueTask('transaction against store {0}'.format(storeName), wrapper);
  };
  
  // Untested
  IDB.prototype.objectStore = function(storeName, mode) {
    var wrapper = wrap(this.$idb, 'objectStore', arguments);
    return this._queueTask('open object store {0}'.format(storeName), wrapper);
  };
    
  Events.on('visibility:hidden', function() {
    if (instance.isOpen()) {
      log('closing due to page being hidden');
      instance.close();
    }
  });

  Events.on('visibility:visible', function() {
    if (!instance.isOpen()) {
      log('opening on page becoming visible');
      instance.open(); // don't specify version as db may have been upgraded in another tab
    }
  });

//  _.toTimedFunction(IDB.prototype, 'search');
//  search = _.toTimedFunction(search);
//  _parse = _.toTimedFunction(_parse);
  return (Lablz.IDB = {
    getIDB: getIDB
  });
});
