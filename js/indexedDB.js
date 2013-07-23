define('indexedDB', ['globals', 'underscore', 'utils', 'queryIndexedDB', 'taskQueue'], function(G, _, U, idbq, TaskQueue) {
  

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
      REJECTED_PROMISE = $.Deferred().reject().promise(),
      RESOLVED_PROMISE = $.Deferred().resolve().promise()
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
      return val && (val instanceof Blob || val[self.filePropertyName]) 
    });
  };
  
  function _getFileSystem(items) {
    var self = this;
    items = !items ? null : _.isArray(items) ? items : [items];
    if (!items || (this.useFileSystem && !FileSystem && _.any(items, isFileOrFilePath ))) { // HACK
      return (fileSystemPromise = U.require('fileSystem').then(function(fs) { 
        FileSystem = fs;
      }));
    }
    else
      return RESOLVED_PROMISE;
  }
  
  function getFileSystem(items) {    
    return fileSystemPromise || _getFileSystem(items);
  };

  function _prep(item) {
    var self = this,
        defer = $.Deferred(),
        promise = defer.promise(),
        dfds = [],
        _item = {};
    
    for (var prop in item) {
      var val = item[prop];
      var dbPropName = prepPropName(prop);
      if (self.useFileSystem && val instanceof Blob) {
        var dfd = FileSystem.writeFile({
          blob: val,
          filePath: self.getFileSystemPath(item, prop)
        }).done(function(fileEntry) {
          var placeholder = _item[dbPropName] = item[prop] = {};
          placeholder[self.filePropertyName] = fileEntry.fullPath;
          
          var resource = C.getResource(item._uri);
          if (resource)
            resource.set(prop, placeholder, {silent: true});
        });
        
        dfds.push(dfd);
      }
      else
        _item[dbPropName] = val;
    }

    $.when.apply($, dfds).then(function() {
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
    var self = this,
        filePropName = self.filePropertyName,
        dfds,
        returnObj,
        items;
        
    if (!_items)
      return defer.resolve(_items).promise();
    
    dfds = [];
    returnObj = U.getObjectType(_items) === '[object Object]';
    if (returnObj)
      _items = [_items];
    
    items = _.map(_items, function(_item) {
      var item = {};
      _.each(_item, function(val, prop) {
        var parsedPropName = parsePropName(prop);
        var val = _item[prop];  
        if (val  &&  val[filePropName]) {
          var dfd = $.Deferred();
          FileSystem.readAsBlob(val[self.filePropertyName]).done(function(blob) {
            item[parsedPropName] = blob;
            dfd.resolve();
          }).fail(dfd.reject);
          
          dfds.push(dfd);
        }
        else
          item[parsedPropName] = val;
      });
      
      return item;
    });
    
    return $.whenAll.apply($, dfds).then(function() {        
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
    args.unshift("indexedDB");
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
    this.useFileSystem = !!this.filePropertyName;
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
    var originalTaskFn = taskFn;
    taskFn = function(defer) {
      var promise = originalTaskFn.apply(this, arguments);
      if (promise !== defer.promise() && U.isPromise(promise))
        promise.then(defer.resolve, defer.reject);
    };
    
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
        currentStores = this.getStoreNames();
    
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
    
    _.each(this.storesToMake, function(storeObj) {
      var storeName = storeObj.name,
          store;
      
      // don't remake an existing store, unless we just deleted it
      if (_.contains(currentStores, storeName) && !_.contains(self.storesToKill, storeName))
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

  /**
   * @param storeName - the name of the object stores to delete from the database
   */
  IDB.prototype.deleteObjectStore = function(storeName) {
    if (this.storesToKill.indexOf(storeName) == -1)
      this.storesToKill.push(storeName);
    
    return this;
  };

  /**
   * @param storeNames - the names of the object stores to delete from the database
   */
  IDB.prototype.deleteObjectStores = function(storeNames) {
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
  
  IDB.prototype.wipe = function(filter, reason) {
    if (!this.isOpen())
      return this.onOpen(U.partialWith(this.wipe, this, filter, reason));
    
    if (!filter)
      return this._queueTask('wiping IndexedDB {0}. {1}'.format(this.name, reason || ''), this.$idb.deleteDatabase, true);
    
    this.storesToKill = this.storesToKill.concat(_.filter(this.getStoreNames(), filter));
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
    return this._queueTask('restarting IndexedDB {0}. {1}'.format(this.name, reason || ''), U.partialWith(restart, this, version), true);
  };

  function get(storeName, primaryKey) {
    if (!this.hasStore(storeName))
      return REJECTED_PROMISE;
      
    var self = this
    return this.$idb.objectStore(storeName).get(primaryKey).then(function(item) {
      return parse.call(self, item);
    });
  };
  
  IDB.prototype.get = function(storeName, uri) {
    return this._queueTask('get item {0} from store {1}'.format(uri, storeName), U.partialWith(get, this, storeName, uri));    
  };

  var queryRunMethods = ['getAll', 'getAllKeys'];
  function wrapQuery(query) {
    var self = this;
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
          return parse.call(self, results);
        });
      });
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

    var store = this.$idb.objectStore(storeName, IDBTransaction.READ_ONLY),
        results = [],
        orderBy = options.orderBy,
        asc = options.asc,
        limit = options.limit,
        filter = options.filter,
        from = options.from,
        direction = U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
        promises = [];
    
    filter = filter || alwaysTrue;
    return $.Deferred(function(defer) {
      log("db", 'Starting getItems Transaction, query with valueTester');
      function processItem(item) {
        if (defer.state() !== 'pending')
          return;
        
        var parsePromise = parse.call(self, item.value).done(function(val) {
          if (filter(val)) {
            results.push(val);
            if (results.length == limit)
              defer.resolve(results);
          }
        });
        
        promises.push(parsePromise);
      };
          
      store.each(processItem, from && IDBKeyRange.lowerBound(from, true), direction).always(function() {
        log("db", 'Finished getItems Transaction, got {0} items'.format(results.length));
        $.when.apply($, promises).always(function() {              
          defer.resolve(results);
        });
      });
    }).promise();
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
    return this._queueTask('search for items in object store {0}'.format(storeName), U.partialWith(search, this, storeName, options));
  };

  function put(storeName, items) {
    var self = this,
        storeDfd = $.Deferred(),
        storePromise = storeDfd.promise();

    if (typeof storeName == 'string') {
      self.$idb.transaction(storeName, IDBTransaction.READ_WRITE).progress(function(trans) {
        storeDfd.resolve(trans.objectStore(storeName));
      }).fail(storeDfd.reject);
    }
    else if (storeName.createIndex) {
      storeDfd.resolve(storeName);
    }
    
    return prep.call(this, items).then(function(items) {
      return storePromise.then(function(store) {
        return $.whenAll.apply($, _.map(items, function(item) {
          return store.put(item);
        }));
      });
    });
  };
  
  IDB.prototype.put = function(storeName, items) {
    items = _.isArray(items) ? items : [items];
    return this._queueTask('saving items to object store {0}'.format(storeName), U.partialWith(put, this, storeName, items));
  };

  function del(storeName, primaryKeys) {
    log('db', 'deleting items', primaryKeys.join(', '));
    return this.$idb.objectStore(storeName, IDBTransaction.READ_WRITE).progress(function(trans) {
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
    return this._queueTask('deleting items from object store {0}'.format(storeName), U.partialWith(del, this, storeName, items));
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
  
  return {
    getIDB: getIDB
  };
});
