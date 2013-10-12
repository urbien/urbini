define('indexedDB', ['globals', 'underscore', 'utils', 'queryIndexedDB', 'taskQueue', 'cache', 'lib/fastdom'], function(G, _, U, idbq, TaskQueue, C, Q) {
  

// IndexedDB desired interface

//var IDB = new IDB(name).createObjectStores(stores).deleteObjectStores(stores).open();
//
//IDB.createObjectStores(toMake).deleteObjectStores(toKill).start();
//
//IDB.restart();
//IDB.clean();
//IDB.wipe();
//IDB.get(storeName, uri);
//IDB.get(storeName, query);
//IDB.put(storeName, uris);

  var instance,
      FileSystem,
      fileSystemPromise,
      filePropertyName,
      fileTypePropertyName,
      useFileSystem,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      fileMap = {};
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
  };

  function Index(property, options) {
    this.property = prepPropName(property);
    this.options = _.clone(options);
  };

  function isFileOrFilePath(item) {
    return _.any(item, function(val) { 
      return val && (val instanceof Blob || val[filePropertyName]); // || (typeof val === 'object' && isFileOrFilePath(val)); 
    });
  };

  function getFileSystemPath(item, prop, blob) {
//    var displayName = item[prop + '.displayName'];
//    if (!displayName && blob && blob.type)
//      displayName = blob.type.split('/')[1];
      
    return U.getPath(item._uri) + '/' + prop;
  };        

  function _getFileSystem(items) {
    items = !items ? null : _.isArray(items) ? items : [items];
    if (!items || (useFileSystem && !FileSystem && _.any(items, isFileOrFilePath))) { // HACK
      return (fileSystemPromise = U.require('fileSystem').then(function(fs) { 
        FileSystem = fs;
      }));
    }
    else
      return RESOLVED_PROMISE;
  }
  
  function getFileSystem(items) {    
    return FileSystem ? fileSystemPromise :  _getFileSystem(items);
  };

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

  function _convertImage(item, _item, prop, val) {
    return $.Deferred(function(defer) {
      var img = new Image;
      img.src = val;
      img.onload = function() {
        var dataUrl = U.imageToDataURL(img);
        prop = prop + '.dataUrl';
        _item[prepPropName(prop)] = dataUrl;
        defer.resolve();
        
        var resource = C.getResource(item._uri);
        if (resource)
          resource.set(prop, dataUrl, {silent: true});
      };
      
      img.onerror = defer.reject.bind(defer);
    }).promise();
  }

  function _prep(item) {
    var defer = $.Deferred(),
        promise = defer.promise(),
        promises = [],
        _item = {};
    
    for (var prop in item) {
      var val = item[prop];
      
      if (useFileSystem && val instanceof Blob)
        promises.push(_saveFile(item, _item, prop, val));
//      else if (/model/portal/Image\?/.test(val) && !item[prop + '.dataUrl'])
//        promises.push(_convertImage(item, _item, prop, val));
      else
        _item[prepPropName(prop)] = val;
    }

    $.when.apply($, promises).then(function() {
      defer.resolve(_item);
    }, function() {
      debugger;
      defer.resolve(_item);          
    });
    
    return promise;
  };
  
  function prep(items) {
    var self = this;
    items = _.isArray(items) ? items : [items];
    return getFileSystem(items).then(function() {
      return $.when.apply($, _.map(items, _prep.bind(self)));
    }).then(function() {
      return [].slice.call(arguments);
    });
  };
  
  function _parse(_items) {
    var promises,
        returnObj,
        items;
        
    if (!_items)
      return U.resolvedPromise(_items);
    
    promises = [];
    returnObj = U.getObjectType(_items) === '[object Object]';
    if (returnObj)
      _items = [_items];
    
    items = _.map(_items, function(_item) {
      var item = {};
      _.each(_item, function(val, prop) {
        var parsedPropName = parsePropName(prop),
            val = _item[prop],
            method = FileSystem && U.isCompositeProp(parsedPropName) ? 'readAsFile' : 'readAsBlob';
            
        if (val  &&  filePropertyName  &&  val[filePropertyName]) {
          var promise = FileSystem[method](val[filePropertyName], val[fileTypePropertyName]).done(function(data) {
            item[parsedPropName] = data;
          });
          
          promises.push(promise);
        }
        else
          item[parsedPropName] = val;
      });
      
      return item;
    });
    
    return $.whenAll.apply($, promises).then(function() {        
      return returnObj ? items[0] : items;
    });
  };
  
  function parse(_items) {
    if (!_items)
      return RESOLVED_PROMISE;
    
    var self = this;
    return getFileSystem(_items).then(function() {
      return _parse.call(self, _items);
    });
  }
  
  function alwaysTrue() {
    return true;
  }
  
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("indexedDB", "db");
    G.log.apply(G, args);
  };
  
  function prepPropName(propName) {
    return '_' + propName;
  };

  function parsePropName(propName) {
    return propName.startsWith('_') ? propName.slice(1) : propName;
  };

  function getIDB(name, options) {
    return instance || (instance = new IDB(name, options));
  };
  
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
    this._openDfd = $.Deferred();
    this._openPromise = this._openDfd.promise();
    
    for (var fn in IDB.prototype) {
      this[fn] = this[fn].bind(this);
    };
  };
  
  IDB.prototype.onOpen = function(cb) {
    return this._openPromise.then(cb);
  };

  IDB.prototype._clearStoreMonitors = function() {
    this.storesToMake = [];
    this.storesToKill = [];
  };
  
  IDB.prototype._queueTask = function(name, taskFn, isBlocking, priority) {
    log('db', 'queueing task', name);
//    var originalTaskFn = taskFn;
//    taskFn = function(defer) {
//      var promise = originalTaskFn.apply(this, arguments);
//      if (promise !== defer.promise() && _.isPromise(promise))
//        promise.then(defer.resolve, defer.reject);
//    };
    
    return this.taskQueue.queueTask(name, taskFn, isBlocking, priority);
  };
  
  IDB.prototype.setDefaultStoreOptions = function(options) {
    this.defaultStoreOptions = _.clone(options);
  };
  
  IDB.prototype.setDefaultIndexOptions = function(options) {
    this.defaultIndexOptions = options;
  };

  function doUpgrade(versionTrans) {
    var self = this,
        currentStores = this.getStoreNames(),
        doDelete = this.storesToKill.length;
    
    this._wasEmpty = !currentStores.length;
    
    // Commented out because decided to not delete stores, just clear them (key path never changes, so deleting all the items is better as it doesn't require a version change transaction)
    _.each(this.storesToKill, function(storeName) {
      if (self.hasStore(storeName)) {
        try {
          versionTrans.deleteObjectStore(storeName);
          delete self.stores[storeName];
          log('db', 'deleted object store: ' + storeName);
        } catch (err) {
          debugger;
          log(['error', 'db'], '2. failed to delete object store {0}: {1}'.format(storeName, err));
          return;
        }
      }
    });
    
    if (doDelete && _.intersection(this.storesToKill, _.pluck(this.storesToMake, 'name')).length) {
      // run delete and create separately to make sure stores are deleted before they are recreated 
      // this hack is for the benefit of WebSQL
      // obviously this crap shouldn't be this high in the abstraction level, as this module shouldn't need to care about WebSQL, so better move it to IndexedDBShim
      this.storesToKill = [];
      this.restart(this.getVersion() + 2); 
      return;
    }
    
    _.each(self.storesToMake, function(storeObj) {
      var storeName = storeObj.name,
          store;
      
      // don't remake an existing store, unless we just deleted it
      if (_.contains(currentStores, storeName)) // && !_.contains(self.storesToKill, storeName))
        return;
      
      try {
        store = versionTrans.createObjectStore(storeName, storeObj.options);
        if (!store) {
          debugger;
          return;
        }
        
        self.stores[storeObj.name] = storeObj;
        log('db', 'created object store: ' + storeName);
        _.each(storeObj.indices, function(index) {
          store.createIndex(index.property, index.options);
          log('db', 'created index {0} for store {1}'.format(index.property, storeName));
        });
      } catch (err) {
        debugger;
        log(['error', 'db'], '2. failed to create object store {0}: {1}'.format(storeName, err));
        return;
      }
    });
    
    this._clearStoreMonitors();
  }

  /**
   * @param name - name of the store or a Store object
   * @param options - store options, or null if 'name' is a Store object. Defaults to {keyPath: '_uri', autoIncrement: false} if unspecified.
   * @param indices - an array of index config objects. Defaults to {unique: false, multiEntry: false} if unspecified.
   */
  IDB.prototype.createObjectStore = function(name, options, indices) {
    var store;
    if (name instanceof Store)
      store = name;
    else if (typeof name == 'string') {
      if (this.defaultIndexOptions) {
        for (var prop in indices) {
          indices[prop] = _.defaults(indices[prop] || {}, this.defaultIndexOptions || {});
        }
      }
      
      store = new Store(name, _.defaults(options || {}, this.defaultStoreOptions || {}), indices);
    }

    if (!_.find(this.storesToMake, function(s) { return s.name === store.name }))
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
      return self.$idb.objectStore(storeName, IDBTransaction.READ_WRITE).clear();
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
    return this.db ? this.db.version : null;
  };

  IDB.prototype.start = function() {
    if (!this.storesToMake.length && !this.storesToKill.length)
      return RESOLVED_PROMISE;
    else {
      var version = this.getVersion();
      return this.restart(version && version + 1);
    }    
  };

  IDB.prototype.getStoreNames = function() {
    var names = this.db && this.db.objectStoreNames;
    return names ? [].slice.call(names._items || names) : [];
  };

  IDB.prototype.hasStore = function(storeName) {
    return this.getStoreNames().indexOf(storeName) !== -1;
  };
  
  function deleteAndReopen() {
    this.db = null;
    return this.$idb.deleteDatabase().then(this.open);
  };
  
  IDB.prototype.wipe = function(filter, doDeleteStores) {
    if (!doDeleteStores)
      debugger;
    
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
    var self = this,
        settings = {
          upgrade: doUpgrade.bind(this)
        };
    
    if (version)
      settings.version = version;
    
    this.$idb = $.indexedDB(this.name, settings);
    this.$idb.done(function(db, event) {
      self.db = db;
      self._openDfd.resolve();
    });
    
    return this.$idb;
  };
  
  function restart(version) {
    version = version || this.getVersion();
    this.db && this.db.close();
    return this.open(version);
  };
  
  IDB.prototype.restart = function(version, reason) {
    var prefix = this.db ? 're' : '', 
        name = '{0}starting IndexedDB {1}. {2}'.format(prefix, this.name, reason || ''),
        alreadyQueued = this.taskQueue.getQueued(name);
    
    return alreadyQueued || this._queueTask(name, restart.bind(this, version), true);
  };

  function get(storeName, primaryKey) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;
      
    var self = this,
        resultDfd = $.Deferred(),
        resultPromise = resultDfd.promise(),
        transPromise = this.$idb.transaction([storeName], IDBTransaction.READ_ONLY).progress(function(trans) {
          log('started transaction to get ' + primaryKey);
          trans.objectStore(storeName).get(primaryKey).then(function(item) {
            log('parsing result for ' + primaryKey);
            return parse.call(self, item).then(resultDfd.resolve, resultDfd.reject);
          });
        });
    
    return $.when(resultPromise, transPromise).then(function(result) {
      return Q.nextFramePromise().done(function() {
        log('returning result for ' + primaryKey);
        if (result)
          return result;
        else
          return $.Deferred().reject().promise();
      });
    });
  };
  
  IDB.prototype.get = function(storeName, uri) {
    return this._queueTask('get item {0} from store {1}'.format(uri, storeName), get.bind(this, storeName, uri));    
  };

  var queryRunMethods = ['getAll', 'getAllKeys'];
  function wrapQuery(query) {
    for (var fn in query) {
      if (_.contains(queryRunMethods, fn))
        wrapQueryRunMethod.call(this, query, fn);
      else
        wrapQueryBuildingMethod.call(this, query, fn);
    }
    
    return query;
  };

  function wrapQueryBuildingMethod(query, fn) {
    var self = this,
        backup = query[fn];

    query[fn] = function() {
      var subQuery = backup.apply(query, arguments);
      return wrapQuery.call(self, subQuery);
    };
    
    if (fn == 'sort') {
      var backup2 = query[fn];
      query[fn] = function(column, reverse) {
        arguments[0] = prepPropName(arguments[0]);
        return backup2.apply(query, arguments);
      }
    }
  };

  function wrapQueryRunMethod(query, fn) {
    var self = this,
        backup = query[fn];
    
    if (backup._wrapped)
      return;
    
    query[fn] = function(storeName) {
      if (!self.hasStore(storeName))
        return REJECTED_PROMISE;
      
      var args = arguments;
      return self._queueTask('querying object store {0} by indices'.format(storeName), function(defer) {
        args[0] = self.$idb.objectStore(args[0], IDBTransaction.READ_ONLY);
        return backup.apply(query, args).then(function(results) {
          return parse.call(self, results || []);
        });
      });
      
//      // alternate implementation, not necessary now that _getAll in jquery-indexeddb makes sure transaction is complete before returning results
//      var args = arguments,
//          storeName = args[0];
//      
//      return self._queueTask('querying object store {0} by indices'.format(storeName), function(defer) {
//        var trans = self.$idb.transaction([storeName], IDBTransaction.READ_ONLY),
//            parseDfd = $.Deferred(),
//            parsePromise = parseDfd.promise();
//        
//        return trans.progress(function() {
//          var store = trans.objectStore(storeName);
//          backup.apply(query, args).then(function(results) {
//            parsePromise = parse.call(self, results);
//          });
//        }).then(function() {
//          return parsePromise;
//        });
//      });

    };
    
    query[fn]._wrapped = true;
  };

  IDB.prototype.queryByIndex = function(indexNameOrQuery) {
    var self = this,
        query = typeof indexNameOrQuery == 'string' ? idbq.Index(prepPropName(indexNameOrQuery)) : indexNameOrQuery;

    wrapQuery.call(this, query);
    return query;
  };

  function search(storeName, options) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;

    var trans = this.$idb.transaction([storeName], IDBTransaction.READ_ONLY),
        results = [],
        orderBy = options.orderBy,
        asc = options.asc,
        limit = options.limit,
        filter = options.filter,
        from = options.from,
        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
        promises = [],
        done = false,
        finish = function() {
          return results;
        };

    filter = filter || alwaysTrue;    
    return trans.progress(function(trans) {
      log("db", 'Starting getItems Transaction, query with valueTester');
      var store = trans.objectStore(storeName);
      function processItem(item) {
        if (done)
          return false; // ends the cursor transaction
        
        var parsePromise = parse.call(self, item.value).done(function(val) {
          if (filter(val)) {
            results.push(val);
            if (results.length >= limit)
              done = true;
          }
        });
        
        promises.push(parsePromise);
      };
          
      store.each(processItem, from && IDBKeyRange.lowerBound(from, true), direction);
    }).fail(function() {
      debugger;
    }).then(function() {
      log("db", 'Finished getItems Transaction, got {0} items'.format(results.length));      
      return $.when.apply($, promises).then(Q.nextFramePromise);
    }).then(finish, finish);
  }
  
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
    return this._queueTask('search for items in object store {0}'.format(storeName), search.bind(this, storeName, options));
  };

  function put(storeName, items) {
    var self = this,
        storeDfd = $.Deferred(),
        storePromise = storeDfd.promise(),
        transPromise;

    if (storeName.createIndex) {
      throw "Operation not supported at this time, please call 'put' with arguments storeName and items";
//      storeDfd.resolve(storeName);
    }
    
    // do them consecutively instead of in parallel because we don't want the db transaction to timeout in case prep() needs time to store stuff to the fileSystem
    // if prep doesn't involve saving files to the fileSystem, it's synchronous and takes very little time
    return prep.call(this, items).then(function(items) {      
      return self.$idb.transaction(storeName, IDBTransaction.READ_WRITE).progress(function(trans) {
        var store = trans.objectStore(storeName);
        _.map(items, function(item) {
          return store.put(item);
        });
      }).fail(storeDfd.reject);
    });
  };
  
  IDB.prototype.put = function(storeName, items) {
    items = _.isArray(items) ? items : [items];
    if (items.length)
      this._wasEmpty = false;
    
    return this._queueTask('saving items to object store {0}'.format(storeName), put.bind(this, storeName, items));
  };

  function del(storeName, primaryKeys) {
    log('db', 'deleting items', primaryKeys.join(', '));
    return this.$idb.transaction([storeName], IDBTransaction.READ_WRITE).progress(function(trans) {
      var store = trans.objectStore(storeName);
      _.each(primaryKeys, function(primaryKey) {
        store['delete'](primaryKey).done(function() {
          log('db', 'deleted', primaryKey);
        });
      });      
    });
  };

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
  };
  
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
  
  return (Lablz.IDB = {
    getIDB: getIDB
  });
});
