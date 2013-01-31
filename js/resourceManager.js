define([
  'globals',
  'jquery', 
  'underscore', 
  'backbone', 
  'utils', 
  'events', 
  'vocManager',
  'queryIndexedDB'
], function(G, $, _, Backbone, U, Events, Voc, idbq) {
//  var useWebSQL = window.webkitIndexedDB && window.shimIndexedDB;
//  useWebSQL && window.shimIndexedDB.__useShim();
  var IDBCursor = $.indexedDB.IDBCursor;
//  var useWebSQL = false;
//  idbq.init();
  var Index = idbq.Index;
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, data, options) {
//    if (method === 'patch') {
//      options = options || {};
//      var success = options.success;
//      options.success = function() {
//        Events.trigger('refresh', data, data.get('_uri'));
//        setTimeout(function() {RM.addItem(data)}, 100);
//        success && success.apply(this, arguments);
//      }
//      
//      Backbone.defaultSync.apply(this, arguments);
//      return;
//    }
    if (method !== 'read') {
      Backbone.defaultSync.apply(this, arguments);
      return;
    }
    
    var isUpdate, filter, isFilter, start, end, qMap, numRequested, stale, dbSuccess, dbError, save, fetchFromServer, numNow, shortPage, collection, resource,      
    defaultSuccess = options.success, 
    defaultError = options.error,
    forceFetch = options.forceFetch,
    synchronous = options.sync,
    now = G.currentServerTime(),
    isCollection = U.isCollection(data),
    vocModel = data.vocModel;
    
    if (isCollection)
      collection = data;
    else {
      collection = data.collection;
      resource = data;
    }
    
    var fetchFromServer = function(timeout, lastFetchedOn) {
      data.lastFetchOrigin = 'server';
      if (!forceFetch && lastFetchedOn && isUpdate) // && !shortPage)
        RM.setLastFetched(lastFetchedOn, options);

      var fetchHelper = function() {
        if (options.sync || !G.hasWebWorkers)
          return RM.defaultSync(method, data, options)
        
        var xhrWorker = new Worker(G.xhrWorker);
        xhrWorker.onmessage = function(event) {
          G.log(RM.TAG, 'xhr', 'got resources', options.url);
          var resp = event.data;
          if (resp) {
            if (resp.error) {
              G.log(RM.TAG, 'Web Worker', JSON.stringify(error), resp.responseText);
              options.error(data, resp.error, options);
            }
            else
              options.success(resp.data, 'success', resp);
          }
          else {
            debugger;
            options.error(data, resp.error, options);
          }
        };
        
        xhrWorker.onerror = function(err) {
          G.log(RM.TAG, 'Web Worker', JSON.stringify(err));
        };
        
        xhrWorker.postMessage({type: 'JSON', url: options.url, method: 'GET', headers: options.headers});
      };
      
      if (timeout)
        setTimeout(fetchHelper, timeout);
      else
        fetchHelper();
    }


    if (isCollection) {
      lastFetchedOn = collection._lastFetchedOn;
      
      qMap = collection.queryMap;
      filter = U.getQueryParams(collection);
      isFilter = !!filter;
      if (isCollection && options.startAfter) {
        start = qMap.$offset; // not a jQuery thing
        options.start = start = start && parseInt(start);
      }
      else
        options.start = start = 0;

      numRequested = qMap.$limit ? parseInt(qMap.$limit) : collection.perPage;
      start = start || 0;
      options.end = end = start + numRequested;
      numNow = collection.resources.length;
      shortPage = !!(numNow && numNow < collection.perPage);
      isUpdate = numNow >= end || shortPage;
      if (isUpdate) {
        var lf = RM.getLastFetched(collection.resources, now);
        if (RM.isStale(lf, now))
          return fetchFromServer(100, lf); // shortPage ? null : lf); // if shortPage, don't set If-Modified-Since header
        else if (numNow) {
          defaultSuccess(null, 'success', {status: 304});
          return; // no need to fetch from db on update
        }
      }
    }
    else {
      isUpdate = resource.loaded || resource.collection;
      if (isUpdate) {
        var ts = resource.get('_lastFetchedOn');
        if (RM.isStale(ts, now))
          return fetchFromServer(100, ts);
        else
          return;
      }
    }

    var key = this.getKey && this.getKey();
    if (!key) {
      if (G.online)
        fetchFromServer();
      
      return;
    }
    
    var dbReqOptions = {key: key, data: data};
    if (isCollection) {
      dbReqOptions.startAfter = options.startAfter,
      dbReqOptions.perPage = collection.perPage;
      dbReqOptions.filter = isFilter && filter;
    }
    else
      dbReqOptions.uri = key;

    var dbPromise = RM.getItems(dbReqOptions);
    if (!dbPromise) {
      if (G.online)
        fetchFromServer();
      else
        options.sync && options.error && options.error(data, {type: 'offline'}, options);
      
      return;
    }
    
    dbPromise.done(function(results) {
      if (!results || (isCollection && !results.length))
        return fetchFromServer();
    
      options.sync = false;
      // simulate a normal async network call
      data.lastFetchOrigin = 'db';
      G.log(RM.TAG, 'db', "got resources from db: " + vocModel.type);
      results = U.getObjectType(results) === '[object Object]' ? [results] : results;
      var resp = {data: results, metadata: {offset: start}};
      var numBefore = isCollection && collection.resources.length;
      defaultSuccess(resp, 'success', null); // add to / update collection

      if (!isCollection) {
        if (forceFetch) {
          fetchFromServer(0);
          return;
        }
        
        isUpdate = true;
        var lf = RM.getLastFetched(results, now);
        if (RM.isStale(lf, now))
          fetchFromServer(100, lf);
        
        return;
      }
      
      if (forceFetch) {
        fetchFromServer(0);
        return;
      }
      
      var numAfter = collection.resources.length;
      if (!isUpdate && numAfter === numBefore) // db results are useless
        return fetchFromServer(100);
      
      var lf = RM.getLastFetched(results, now);
      if (RM.isStale(lf, now))
        return fetchFromServer(100, lf);
    }).fail(function(e) {
      if (e) 
        G.log(RM.TAG, 'error', "Error fetching data from db: " + e);
      fetchFromServer();
    }).progress(function(db, event) {
//      debugger;
      error = error;
    });
  };
  
  Lablz.idbq = idbq;
  var ResourceManager = RM = {
    TAG: 'Storage',
//    useUpgradeNeeded: useWebSQL || !!window.IDBOpenDBRequest,
    useUpgradeNeeded: !!window.IDBOpenDBRequest,
    defaultSync: function(method, data, options) {
      if (options.sync)
        options.timeout = 5000;
      
      var tName = 'sync ' + options.url;
      G.startedTask(tName);
      var success = options.success;
      options.success = function() {
        G.finishedTask(tName);
        success.apply(this, arguments);
      }
      
      var err = options.error;
      var req = Backbone.defaultSync(method, data, options);
//      req.fail(function(jqXHR, status) {
//        G.log(RM.TAG, 'sync', jqXHR, status);
//        return (err || Error.getDefaultErrorHandler()).apply(this, [data, {type: status}]);
//      });
      
      return req;
    },
  
    /**
     * is 3 minutes old
     */
    maxDataAge: 180000,
    
    isStale: function(ts, now) {
      return !ts || (now || G.currentServerTime()) - ts > RM.maxDataAge;
    },
    
    getLastFetched: function(obj, now) {
      now = now || G.currentServerTime();
      if (!obj) 
        return now;
      
      var ts;
      var type = U.getObjectType(obj).toLowerCase();
      switch (type) {
        case '[object array]':
          ts = _.reduce(obj, function(memo, next)  {
            next = next.get ? next.get('_lastFetchedOn') : next._lastFetchedOn;
            return Math.min(memo, next || 0);
          }, Infinity);
          break;
        case '[object object]':
          ts = obj.get ? obj.get('_lastFetchedOn') : obj._lastFetchedOn;
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
  
//    updateDB: function(res) {
////      var self = this;
//      if (res.lastFetchOrigin != 'db' && !res.collection) // if this resource is part of a collection, the collection will update the db in bulk
//        setTimeout(function() {RM.addItem(res)}, 100);
//    },
  
    /////////////////////////////////////////// START IndexedDB stuff ///////////////////////////////////////////
    db: null,
    VERSION: 1,
    modelStoreOptions: {keyPath: 'type'},
    dbPaused: false,
    storeExists: function(name) {
      var db = RM.db;
      var names = db && db.objectStoreNames;
      if (!names)
        return false;
      
      return names._items ? _.contains(names._items, name) : names.contains(name);
    },
    
    deleteDatabase: function(callback) {
      G.log(RM.TAG, ['error', 'db'], "db blocked, deleting database");
        window.webkitIndexedDB.deleteDatabase(RM.DB_NAME).onsuccess = callback;
    },
    
    defaultOptions: {keyPath: '_uri', autoIncrement: false},
    DB_NAME: "lablz",
    runTask: function() {
      return this.taskManager.runTask.apply(this.taskManager, arguments);
    },
    taskManager: {
      nonseq: [],
      seqQueue: [],
      runningTasks: [],
      blocked: false,
      /**
       * @param task function that returns a $.Deferred object when run
       */
      runTask: function(task, name, sequential) {
        var promise, self = RM.taskManager;
        if (!sequential) {
          if (self.blocked) {
            G.log(RM.TAG, 'db', 'Waiting for sequential task to finish, queueing non-sequential task:', name);
            self.nonseq.push({task: task, name: name});
          }
          else {
            G.log(RM.TAG, 'db', 'Running non-sequential task:', name);
            promise = task();
            promise._lablzId = G.nextId();
            self.runningTasks.push(promise);
            promise.always(function() {
              G.log(RM.TAG, 'db', 'Finished non-sequential task:', name);
              self.runningTasks.remove(promise);
            }); 
          }
        
          return promise;
        }
        
        // Sequential task - need to wait for all currently running tasks to finish
        // and block any new tasks from starting until this one's done
        if (self.blocked) {
          if (!self.runningTasks.length) {
            G.log(RM.TAG, 'db', 'A sequential finished but failed to report');
            self.blocked = false;
            debugger;
          }
          else {
            G.log(RM.TAG, 'db', 'Waiting for sequential task to finish, queueing sequential task', name);
            var dfd = new $.Deferred();
            self.seqQueue.push({task: task, name: name, deferred: dfd});
            return dfd.promise();
          }
        }
       
        G.log(RM.TAG, 'db', 'Waiting for non-sequential tasks to finish to run sequential task:', name);
        self.blocked = true;
        var defer = $.Deferred();
        $.when.apply(null, self.runningTasks).done(function() { // not sure if it's kosher to change runningTasks while this is running
          G.log(RM.TAG, 'db', 'Running sequential task:', name);
          var taskPromise = task();
          taskPromise.name = name;
          self.runningTasks.push(taskPromise);
          taskPromise.always(function() {
            self.runningTasks.remove(taskPromise);
            G.log(RM.TAG, 'db', 'Finished sequential task:', name);
            var qLength = self.seqQueue.length;
            self.blocked = false; // unblock to allow next task to start;
            if (qLength) {
              var next = self.seqQueue.shift();
              var dfd = next.deferred;
              self.runTask(next.task, next.name, true).done(dfd.resolve).fail(dfd.reject);
            }
            else {
              if (self.nonseq.length) {
                _.map(self.nonseq, function(t) {self.runTask(t.task, t.name)});
                self.nonseq.length = 0;
              }
            }
            
            defer.resolve();
          });
        });
        
        return defer.promise();
      }
    },
    
    /**
     * Check if we need to delete any stores. Creation of stores happens on demand, deletion happens when models change
     */
    updateDB: function() {
      return $.Deferred(function(defer) {
        var toKill = _.union(Voc.changedModels, Voc.newModels);
        Voc.changedModels.length = 0;
        Voc.newModels.length = 0;
        if (RM.db) {
          toKill = _.filter(toKill, function(m) {
            return RM.db.objectStoreNames.contains(m);
          });
          
          if (toKill.length)
            RM.upgradeDB({killStores: toKill, msg: "need to kill some stores, queueing db upgrade"}).done(defer.resolve).fail(defer.reject);
          else
            defer.resolve();
        }
        else
          RM.openDB({killStores: toKill}).done(defer.resolve).fail(defer.reject);
      }).promise();
    },
    
    /**
     * If you want to upgrade, pass in a version number, or a store name, or an array of store names to create
     */
    openDB: function(options) {
      options = options || {};
      var version = options.version, toMake = options.toMake || [], toKill = options.toKill || [];
      toKill = _.union(toKill, Voc.changedModels, Voc.newModels);
      var modelsChanged = function() {
        return !!(G.userChanged || toKill.length || toMake.length);
      }
      
      Voc.changedModels.length = 0;
      Voc.newModels.length = 0;

      if (!version) {
        if (RM.db) {
          var currentVersion = isNaN(RM.db.version) ? 0 : parseInt(RM.db.version);
          version = modelsChanged() ? currentVersion + 1 : currentVersion;
        }
      }

//      if (arguments.length) {
//        var a1 = arguments[0];
//        var type = U.getObjectType(a1);
//        switch (type) {
//          case '[object String]':
//            storesToCreate = [a1];
//            break;
//          case '[object Array]':
//            storesToCreate = a1;
//            break;
//          case '[object Number]':
//            version = a1;
//            break;
//        }
//      }
      
      var settings = {
        upgrade: function(transaction) {
          G.log(RM.TAG, "db", 'in upgrade function');
//          debugger;
          if (!G.userChanged && !toMake && !toKill) {
            G.log(RM.TAG, "db", 'upgrade not necessary');
            return;
          }
          
          G.log(RM.TAG, "db", 'upgrading...');
          G.log(RM.TAG, 'db', 'db upgrade transaction onsuccess');
          if (G.userChanged) {
            G.userChanged = false;
            newStores = RM.updateStores(transaction, toMake, toKill, true);
          }
          else {
            newStores = RM.updateStores(transaction, toMake, toKill);
          }
        }
      };
      
      if (typeof version !== 'undefined')
        settings.version = version;

      if (RM.db) {
        G.log(RM.TAG, "db", 'closing db');
        RM.db.close();
      }
      
      G.log(RM.TAG, "db", 'opening db');
      var dbPromise = $.Deferred();
      var openPromise = RM.$db = $.indexedDB('lablz', settings);
      openPromise.done(function(db, event) {
        var currentVersion = db ? isNaN(db.version) ? 1 : parseInt(db.version) : 1;
        if (!RM.db && !version) {
          if (modelsChanged()) {
            G.log(RM.TAG, "db", "current db version: " + currentVersion + ", upgrading");
            version = currentVersion + 1;
          }
          else 
            version = currentVersion;              
        }
        
        RM.db = db;
        RM.VERSION = version; // just in case we want it later on, don't know for what yet
        if (currentVersion === version) {
          G.log(RM.TAG, 'db', "done prepping db");
          dbPromise.resolve();
          return;
        }

        // Queue up upgrade
        RM.upgradeDB(_.extend(options, {version: version, msg: "opened db, userChanged: " + !!G.userChanged + ", stores to kill: " + toKill.join(",") + ", stores to make: " + toMake.join() + ", queueing db upgrade"}));
        dbPromise.resolve();
      }).fail(function(error, event) {
        debugger;
        G.log(RM.TAG, ['db', 'error'], error, event);
        dbPromise.reject();
      }).progress(function(db, event) {
        switch (event.type) {
          case 'blocked':
//            debugger;
            dbPromise.reject();
            RM.restartDB();
            break;
          case 'upgradeneeded':
//            debugger;
            break;
        }
        G.log(RM.TAG, 'db', event.type);
      });
      
      return dbPromise;
    },
    
    getIndexNames: function(vocModel) {
      var vc = vocModel.viewCols || '';
      var gc = vocModel.gridCols || '';
      var extras = [];
      if (U.isA(vocModel, "Locatable")) {
        var lat = U.getCloneOf(vocModel, "Locatable.latitude");
        if (lat.length) extras.push(lat[0]);
        var lon = U.getCloneOf(vocModel, "Locatable.longitude");
        if (lon.length) extras.push(lon[0]);
      }
      else if (U.isA(vocModel, "Shape")) {
        var lat = U.getCloneOf(vocModel, "Shape.interiorPointLatitude");
        if (lat.length) extras.push(lat[0]);
        var lon = U.getCloneOf(vocModel, "Shape.interiorPointLongitude");
        if (lon.length) extras.push(lon[0]);
      }
      
      var cols = _.union(extras, _.map((vc + ',' + gc).split(','), function(c) {
        return c.trim().replace('DAV:displayname', 'davDisplayName')
      }));
      
      return cols;
    },
    
    updateStores: function(trans, toMake, toKill, reset) {
//      var toKill = toKill || _.union(Voc.changedModels, Voc.newModels);
//      Voc.changedModels.length = 0;
//      Voc.newModels.length = 0;      
      for (var i = 0; i < toMake.length; i++) {
        var type = toMake[i];
        if (Voc.typeToEnum[type] || Voc.typeToInline[type])
          continue;
        
        if (RM.storeExists(type)) {
          if (reset || _.contains(toKill, type)) {
            try {
              trans.deleteObjectStore(type);
              G.log(RM.TAG, 'db', 'deleted object store: ' + type);
            } catch (err) {
              debugger;
              G.log(RM.TAG, ['error', 'db'], '2. failed to delete table ' + type + ': ' + err);
              return;
            }
          }          
          else
            continue;
        }

        try {
          var store = trans.createObjectStore(type, RM.defaultOptions);
          G.log(RM.TAG, 'db', 'created object store: ' + type);
          var m = Voc.typeToModel[type];
          var indices = [];
          var indexNames = RM.getIndexNames(vocModel);
          _.each(indexNames, function(pName) {
            pName = pName.trim();
            if (!pName.length)
              return;
            
            G.log(RM.TAG, 'db', 'creating index', pName, 'for store', type);
            var index = store.createIndex(pName, pName, {unique: false, multiEntry: false});
            G.log(RM.TAG, 'db', 'created index', pName, 'for store', type);
            indices.push(pName);
          });  
        } catch (err) {
          debugger;
          G.log(RM.TAG, ['error', 'db'], '2. failed to create table ' + type + ': ' + err);
          return;
        }
      }
    },
    
    addItems: function(items, classUri) {
      if (!items || !items.length)
        return;
      
      if (!RM.db) {
        var args = arguments;
        setTimeout(function() {addItems.apply(RM, arguments)}, 1000);
        return;
      }
      
      if (!classUri) {
        var first = items[0];
        if (U.isModel(first))
          classUri = first.vocModel.type;
        else
          classUri = U.getTypeUri(items[0].type._uri);
      }
      
      if (!RM.storeExists(classUri)) {
        RM.upgradeDB({toMake: [classUri], msg: "Need to make store: " + classUri + ", queueing db upgrade"}).done(function() {
          RM.addItems(items, classUri);
        });
        
        return;
      }
      
      RM.runTask(function() {
        return $.Deferred(function(defer) {
          var vocModel = Voc.typeToModel[classUri];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item = U.isModel(item) ? item.toJSON() : item;
            items[i] = U.flattenModelJson(item, vocModel);
          }
          
          G.log(RM.TAG, "db", 'Starting addItems Transaction');
          RM.$db.transaction(classUri, IDBTransaction.READ_WRITE).then(function() {
            G.log(RM.TAG, "db", 'Transaction completed, all data inserted');
            defer.resolve();
          }, function(err, e){
            defer.reject();
            G.log(RM.TAG, ['db', 'error'], 'Transaction NOT completed, data not inserted', err, e);
          }, function(transaction) {
            var store = transaction.objectStore(classUri);
            for (var i = 0; i < items.length; i++) {
              store.put(items[i]);
//              G.log(RM.TAG, "db", 'Storing', items[i]._uri);
            }
          });
        }).promise()
      }, "Add Items");
    }, //.async(100),
    
    addItem: function(item, classUri) {
      var isModel = U.isModel(item);
      classUri = classUri ? classUri : isModel ? item.vocModel.type : U.getTypeUri(item.type._uri);
      item = isModel ? item.toJSON() : item;
      return RM.addItems([item], classUri);
    },
    
    deleteItem: function(uri) {
      G.log(RM.TAG, 'db', 'deleting item', uri);
//      var type = U.getClassName(item._uri);
//      var name = U.getClassName(type);
      var type = item._uri || item.vocModel.type;
      var trans = RM.db.transaction([type], IDBTransaction.READ_WRITE);
      var store = trans.objectStore(type);
      var request = store.delete(uri);
    
      request.onsuccess = function(e) {
        G.log(RM.TAG, 'db', 'delete item onsuccess');
      };
    
      request.onerror = function(e) {
        G.log(RM.TAG, ['error', 'db'], "Error Deleting: ", e);
      };
    },
    
    DEFAULT_OPERATOR: '=',
    operatorMap: {
      '=': 'eq',
      '!=': 'neq',
      '<': 'lt',
      '>': 'gt',
      '>=': 'gteq',
      '<=': 'lteq',
      'IN:': 'oneof'
    },
    
    parseOperatorAndValue: function(str) {
      var op, val;
      var opVal = str.match(/^(IN=|[>=<!]{0,2})(.+)$/);
      switch (opVal.length) {
        case 2: {
          val = str;
          break;
        }
        case 3: {
          if (opVal[1])
            op = opVal[1]; // = RM.operatorMap[opVal[1]];
          
          val = opVal[2];
          break;
        }
        default: {
          G.log(RM.TAG, 'error', 'couldn\'t parse filter', str);
          return null;
        }
      }
      
      return [op || RM.DEFAULT_OPERATOR, val];
    },

    buildDBQuery: function(store, data, filter) {
      if (U.isModel(data))
        return false;
      
      var query, orderBy, 
          defOp = 'eq',
          collection = data,
          vocModel = collection.vocModel,
          qMap = collection.queryMap,
          filter = filter || U.getQueryParams(collection);
      
      if (qMap) {
        orderBy = qMap.$orderBy;
        asc = U.isTrue(qMap.$asc);
      }
      
      if (!orderBy && !_.size(filter))
        return false;
      
      var indexNames = RM.getIndexNames(vocModel);
      if (orderBy && !_.contains(indexNames, orderBy))
        return false;
      
      if (!_.all(_.keys(filter), function(name) {return _.contains(indexNames, name);}))
        return false;

      for (var name in filter) {
//        var name = modelParams[i];
        var opVal = RM.parseOperatorAndValue(filter[name]);
        if (opVal.length != 2)
          return false;
        
        var op = RM.operatorMap[opVal[0]];
        var val = opVal[1];
        val = U.getTypedValue(collection, name, val);
        var subQuery = Index(name)[op](val);// Index(name)[op].apply(this, op === 'oneof' ? val.split(',') : [val]);
        subQuery.setPrimaryKey('_uri');
        query = query ? query.and(subQuery) : subQuery;
      }
      
      if (orderBy) {
//        var bound = startAfter ? (orderBy == '_uri' ? startAfter : collection.get(startAfter).get(orderBy)) : null;
        query = query ? query.sort(orderBy, !asc) : Index(orderBy, asc ? IDBCursor.NEXT : IDBCursor.PREV).all();
      }
      
      if (!_.isUndefined(qMap.$offset)) {
        query.setOffset(parseInt(qMap.$offset));
      }
      
      if (!_.isUndefined(qMap.$limit)) {
        query.setLimit(parseInt(qMap.$limit));
      }
      
      return query;
    },
    
    makeTest: function(prop, op, bound) {
      var range = prop.range;
      var name = prop.shortName;
      switch (range) {        
        case 'boolean':
          var falsy = function(res) {
            return U.isFalsy(res[name], range);
          }
          var truthy = function(res) {
            return !U.isFalsy(res[name], range);
          }
          
          if (op === '==')
            return U.isFalsy(bound, range) ? falsy : truthy;
          else
            return U.isFalsy(bound, range) ? truthy : falsy;
        case 'date':
        case 'dateTime':
        case 'ComplexDate':
          try {
            bound = U.parseDate(bound);
          } catch (err) {
            return function() {return false};
          }
          // fall through to default
        default: {
          return function(res) {
            try {
              return new Function("a", "b", "return a {0} b".format(op))(res[name], bound);
            } catch (err){
              return false;
            }
            
            // TODO: test values correctly, currently fails to eval stuff like 134394343439<=today
            return true;
          };
        }
      }
    },
    
    buildValueTesterFunction: function(params, data) {
      var rules = [];
      _.each(params, function(value, name) {
        var opVal = RM.parseOperatorAndValue(value);
        if (opVal.length != 2)
          return null;
        
        var op = opVal[0];
        op = op === '=' ? '==' : op; 
//        var bound = U.getTypedValue(data, name, opVal[1]);
        var bound = opVal[1];
        rules.push(RM.makeTest(vocModel.properties[name], op, bound));
//        rules.push(function(val) {
//          try {
//            return eval('"' + val[name] + '"' + op + '"' + bound + '"');
//          } catch (err){
//            return false;
//          }
//          
//          // TODO: test values correctly, currently fails to eval stuff like 134394343439<=today
//          return true;
//        });
      });
      
      return function(val) {
        for (var i = 0; i < rules.length; i++) {
          if (!rules[i](val))
            return false;
        }
        
        return true;
      }
    },
    
    getItems: function(options) {
      var type = U.getTypeUri(options.key);
      var uri = options.uri;
      var success = options.success;
      var error = options.error;
      var startAfter = options.startAfter;
      var total = options.perPage;
      var filter = options.filter;
      var data = options.data;
      if (!RM.storeExists(type)) {
        // don't upgrade here, upgrade when we add items to the db
        return false;
      }

      function queryWithoutIndex() {
        return $.Deferred(function(defer) {            
          G.log(RM.TAG, "db", 'Starting getItems Transaction, query with valueTester');
          var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
          var valueTester = RM.buildValueTesterFunction(filter, data);
          var results = [];
          var filterResults = function(item) {
            var val = item.value;
            if (!valueTester || valueTester(val))
              results.push(val);
          };
          
          var direction = U.isTrue(data.queryMap.$asc) ? IDBCursor.NEXT : IDBCursor.PREV;
          var iterationPromise;
          if (startAfter)
            iterationPromise = store.each(filterResults, IDBKeyRange.lowerBound(startAfter, true), direction);
          else
            iterationPromise = store.each(filterResults, null, direction);
          
          iterationPromise.always(function() {
            G.log(RM.TAG, "db", 'Finished getItems Transaction, got {0} itmes'.format(results.length));
            defer.resolve(results);
          });
        });
      }

      return RM.runTask(function() {
        G.log(RM.TAG, "db", 'Starting getItems Transaction, query via index(es)');
//        var store = $.indexedDB('lablz').objectStore(type, IDBTransaction.READ_ONLY);
        var results = [];
        var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
        if (uri)
          return store.get(uri).promise();

        var query = RM.buildDBQuery(store, data, filter);
        if (query) {
          var qDefer = $.Deferred();
          query.getAll(store).done(qDefer.resolve).fail(function() {
            G.log(RM.TAG, "db", 'couldn\'t query via index(es), time for plan B');
            queryWithoutIndex().promise().done(qDefer.resolve).fail(qDefer.reject);
          });
          
          return qDefer.promise();
        }
        else
          return queryWithoutIndex().promise();
      }, "Get Items");
    },

    upgradeDB: function(options) {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {
          RM.openDB(options).done(defer.resolve).fail(defer.reject);
        }).promise();
      }, options && options.msg || "upgradeDB", true);      
    },
    
    restartDB: function() {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {
//          $(document).ready(function() {
            RM.openDB().done(defer.resolve).fail(defer.reject);
//          }); 
        }).promise();
      }, "restartDB", true);
    }

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  Events.on('modelsChanged', function(options) {
    var updatePromise = RM.updateDB();
    if (options) {
      options.success && updatePromise.done(options.success);
      options.error && updatePromise.fail(options.error);
    }
  });
  
  Events.on('resourcesChanged', function(toAdd) {
    setTimeout(function() {RM.addItems(toAdd)}, 100);
  });

  return (Lablz.ResourceManager = ResourceManager);
});