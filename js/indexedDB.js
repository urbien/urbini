define('indexedDB', ['globals', 'underscore', 'utils', 'queryIndexedDB', 'taskQueue', 'cache', 'lib/fastdom'], function(G, _, U, idbq, TaskQueue, C, Q) {  
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

    var type = blob.type;
    return U.getPath(item._uri) + '/' + prop + (type ? '.' + type.slice(type.indexOf('/') + 1) : '');
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
    var promises = U.array(),
        _item = U.object();
    
    for (var prop in item) {
      var val = item[prop];
      
      if (useFileSystem && val instanceof Blob)
        promises.push(_saveFile(item, _item, prop, val));
//      else if (/model/portal/Image\?/.test(val) && !item[prop + '.dataUrl'])
//        promises.push(_convertImage(item, _item, prop, val));
      else
        _item[prepPropName(prop)] = val;
    }

    if (promises.length) {
      return $.when.apply($, promises).then(function() {
        U.recycle(promises);
        return _item;
      });
    }
    else
      return _item;
  };
  
  function _prepItems(items) {
    return $.when.apply($, _.map(items, _prep)).then(function() {
      return _.toArray(arguments);
    });
  }
    
  function prep(items) {
    items = _.isArray(items) ? items : [items];
    var getFS = getFileSystem(items);
    if (getFS.state() == 'pending')
      return getFS.then(_prepItems.bind(instance, items));
    else
      return _prepItems(items);
  };

  function _parse(_items) {
    var promises,
        returnObj,
        items;
        
    if (!_items)
      return U.resolvedPromise(_items);
    
    promises = U.array();
    returnObj = U.getObjectType(_items) === '[object Object]';
    if (returnObj)
      _items = [_items];

    for (var i = 0, len = _items.length; i < len; i++) {
      var _item = _items[i],
          item = _items[i] = U.object();
      
      for (var prop in _item) {
        var val = _item[prop];
            parsedPropName = parsePropName(prop),
            method = FileSystem && U.isCompositeProp(parsedPropName) ? 'readAsFile' : 'readAsBlob';
            
        if (val  &&  filePropertyName  &&  val[filePropertyName]) {
          var promise = FileSystem[method](val[filePropertyName], val[fileTypePropertyName]).done(function(data) {
            item[parsedPropName] = data;
          });
          
          promises.push(promise);
        }
        else
          item[parsedPropName] = val;
      }
    }
    
    function finish() {
      U.recycle(promises);
      return returnObj ? _items[0] : _items;
    }
    
    if (promises.length)
      return $.whenAll.apply($, promises).then(finish);
    else
      return finish();
  };

  function parse(_items) {
    if (!_items)
      return RESOLVED_PROMISE;
    
    var getFS = getFileSystem(_items);
    if (getFS.state() == 'pending')
      return getFS.then(_parse.bind(instance, _items));
    else
      return _parse(_items);
  }
  
  function alwaysTrue() {
    return true;
  }
  
  function log() {
    var args = _.toArray(arguments);
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
    var currentStores = instance.getStoreNames(),
        toMake = instance.storesToMake,
        toDelete = instance.storesToKill,
        doDelete = toDelete.length;
    
    instance._wasEmpty = !currentStores.length;
    
    // Commented out because decided to not delete stores, just clear them (key path never changes, so deleting all the items is better as it doesn't require a version change transaction)
    for (var i = 0, len = toDelete.length; i < len; i++) {
      var storeName = toDelete[i];
      if (instance.hasStore(storeName)) {
        try {
          versionTrans.deleteObjectStore(storeName);
          delete instance.stores[storeName];
          log('db', 'deleted object store: ' + storeName);
        } catch (err) {
          debugger;
          log(['error', 'db'], '2. failed to delete object store {0}: {1}'.format(storeName, err));
        }
      }
    }
    
    if (doDelete && _.intersection(instance.storesToKill, _.pluck(instance.storesToMake, 'name')).length) {
      // run delete and create separately to make sure stores are deleted before they are recreated 
      // this hack is for the benefit of WebSQL
      // obviously this crap shouldn't be this high in the abstraction level, as this module shouldn't need to care about WebSQL, so better move it to IndexedDBShim
      instance.storesToKill = [];
      instance.restart(instance.getVersion() + 2); 
      return;
    }
    
    for (var i = 0, len = toMake.length; i < len; i++) {
      var storeObj = toMake[i],
          storeName = storeObj.name,
          store;
      
      // don't remake an existing store, unless we just deleted it
      if (_.contains(currentStores, storeName)) // && !_.contains(instance.storesToKill, storeName))
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
          upgrade: doUpgrade
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
      
    var resultDfd = $.Deferred(),
        resultPromise = resultDfd.promise(),
        transPromise = this.$idb.transaction([storeName], IDBTransaction.READ_ONLY).progress(function(trans) {
          log('started transaction to get ' + primaryKey);
          trans.objectStore(storeName).get(primaryKey).done(function(item) {
            log('parsing result for ' + primaryKey);
            getResult(parse.call(instance, item), resultDfd.resolve, resultDfd.reject);
          });
        });
    
    // TODO: make this less wasteful, there are way too many deferreds here
    return $.when(resultPromise, transPromise).then(function(result) {
      return Q.nextFramePromise().then(function() {
        log('returning result for ' + primaryKey);
        if (result)
          return result;
        else
          return G.getRejectedPromise();
      });
    });
  };
  
  IDB.prototype.get = function(storeName, uri) {
    return this._queueTask('get item {0} from store {1}'.format(uri, storeName), get.bind(this, storeName, uri));    
  };

  var queryRunMethods = ['getAll', 'getAllKeys'];
  function wrapQuery(query) {
    for (var fn in query) {
      if (typeof query[fn] == 'function') {
        if (_.contains(queryRunMethods, fn))
          wrapQueryRunMethod.call(this, query, fn);
        else
          wrapQueryBuildingMethod.call(this, query, fn);
      }
    }
    
    return query;
  };

  function getResult(promiseOrResult, done, fail) {
    if (_.isPromise(promiseOrResult)) {
      if (done)
        promiseOrResult.done(done);
      if (fail)
        promiseOrResult.fail(fail);
      
      return promiseOrResult;
    }
    else
      return done(promiseOrResult);
  }
  
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
  
//  function returnOnNextFrame(results, dfd) {
//    return Q.nextFramePromise().then(function() {
//      if (dfd)
//        return dfd.resolve(results);
//      else
//        return results;
//    });
//  }

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
        backup.apply(query, args).done(function(results) {
          var promiseOrResult = parse.call(self, results);
          getResult(promiseOrResult, function(results) {
            Q.nextFramePromise().done(function() {
              defer.resolve(results);
            });
          });
        }).fail(defer.resolve);
        
        return defer.promise();
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
        results = U.array(),
        orderBy = options.orderBy,
        asc = options.asc,
        limit = options.limit,
        filter = options.filter,
        from = options.from,
        direction = asc == undefined || U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
        done = false,
        numQueued = 0,
        dfd = $.Deferred(),
        promise = dfd.promise(),
        store,
        finish = function() {
          return Q.nextFramePromise().then(function() {
            return results;
          });
        };

    promise.progress(function() {
      numQueued--;
    });
        
    function parseItem(item) {
      getResult(parse.call(self, item.value), postParse, dfd.reject);
    }
    
    function postParse(val) {
      if (!done && filter(val)) {
        results.push(val);
        if (results.length >= limit)
          done = true;
      }      
      
      dfd.notify();
    }
    
    filter = filter || alwaysTrue;    
    trans.progress(function(trans) {
      log("db", 'Starting getItems Transaction, query with valueTester');
      store = trans.objectStore(storeName);
      function processItem(item) {
        if (done)
          return false; // ends the cursor transaction

        numQueued++;
        Q.nonDom(parseItem, null, item);
      };
          
      store.each(processItem, from && IDBKeyRange.lowerBound(from, true), direction);
    }).done(function() {
      if (done || !numQueued)
        dfd.resolve();
      else {
        promise.progress(function() {
          if (done || !numQueued)
            dfd.resolve();
        });
      }
    }).fail(function() {
      debugger;
    });
    
    setTimeout(function() {
      if (dfd.state() == 'pending')
        debugger;
    }, 3000);

    setTimeout(function() {
      if (dfd.state() == 'pending')
        debugger;
    }, 10000);

    return promise.then(finish, finish);
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
    if (storeName.createIndex) {
      throw "Operation not supported at this time, please call 'put' with arguments storeName and items";
//      storeDfd.resolve(storeName);
    }
    
    // do them consecutively instead of in parallel because we don't want the db transaction to timeout in case prep() needs time to store stuff to the fileSystem
    // if prep doesn't involve saving files to the fileSystem, it's synchronous and takes very little time
    return prep(items).then(function(items) {      
      return instance.$idb.transaction(storeName, IDBTransaction.READ_WRITE).progress(function(trans) {
        var store = trans.objectStore(storeName);
        for (var i = 0, len = items.length; i < len; i++) {
          store.put(items[i]);
        }
      });
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
