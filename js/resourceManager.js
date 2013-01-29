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
  var useWebSQL = window.webkitIndexedDB && window.shimIndexedDB;
  useWebSQL && window.shimIndexedDB.__useShim();
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
          var xhr = event.data;
          options.success(xhr.data, 'success', xhr);
        };
        
        xhrWorker.onerror = function(err) {
          console.log(JSON.stringify(err));
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
      if (!results || !results.length)
        return fetchFromServer();
    
      options.sync = false;
      // simulate a normal async network call
      data.lastFetchOrigin = 'db';
      G.log(RM.TAG, 'db', "got resources from db: " + vocModel.type);
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
    useUpgradeNeeded: useWebSQL || !!window.IDBOpenDBRequest,
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
//      return now - ts;
//      var staleness = age - RM.maxDataAge;
//      if (staleness > 0)
//        G.log(RM.TAG, 'info', 'data is stale at: ' + age + ' millis old');
//      
//      return staleness;
    },
  
    setLastFetched: function(lastFetchedOn, options) {
      if (lastFetchedOn) {
        var ifMod = {"If-Modified-Since": new Date(lastFetchedOn).toUTCString()};
        options.headers = options.headers ? _.extend(options.headers, ifMod) : ifMod;
      }
    },
  
    updateDB: function(res) {
//      var self = this;
      if (res.lastFetchOrigin != 'db' && !res.collection) // if this resource is part of a collection, the collection will update the db in bulk
        setTimeout(function() {RM.addItem(res)}, 100);
    },
  
//    varRinde rInit = Resource.initialize;
//    Resource.initialize = function() {
//      rInit.apply(this, arguments);
//      this.on('change', RM.updateDB);
//    };


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
//    indexExists: function(store, name) {
//      debugger;
//      var names = store.getIndexNames();
//      return _.contains(names._items ? names._items : names, name);
//    },
//    onerror: function(e) {
//      G.userChanged = true;
////      G.recordCheckpoint("closing db due to error");
//      RM.db && RM.db.close();
//      RM.openDB();
//      G.log(RM.TAG, ['error', 'db'], "db error: " + JSON.stringify(e));
//    },
//    
//    onabort: function(e) {
//      G.log(RM.TAG, ['error', 'db'], "db abort: " + e);
//    },
//    
//    this.reset = function() {
//      var db = RM.db;
//      var rModels = _.filter(_.union(G.models, G.linkedModels), function(m) {return _.contains(G.classUsage, m)});
//      var rModels = _.map(rModels, function(m) {
//        return (m.type || m.uri).slice(m.type.lastIndexOf('/') + 1)
//      });
//      
//      var deleted = [];
//      var created = [];
//      _.each(db.objectStoreNames, function(name) {            
//        db.deleteObjectStore(name);
//        deleted.push(name);
//        if (_.contains(rModels, name)) {
//          db.createObjectStore(name, RM.defaultOptions);
//          created.push(name);
//        }
//      })
//      
//      deleted.length && G.log(RM.TAG, 'db', '1. deleted tables: ' + deleted.join(','));
//      created.length && G.log(RM.TAG, 'db', '1. created tables: ' + created.join(','));
//      G.userChanged = false;
//    }
    
    deleteDatabase: function(callback) {
      G.log(RM.TAG, ['error', 'db'], "db blocked, deleting database");
//      if (confirm('delete database?'))
        window.webkitIndexedDB.deleteDatabase(RM.DB_NAME).onsuccess = callback;
    },
    
    defaultOptions: {keyPath: '_uri', autoIncrement: false},
//    storeIsReady: function(store) {
//      var readyState = store.__ready;
//      return _.isUndefined(readyState.createObjectStore) || readyState.createObjectStore &&  _.isUndefined(readyState.createIndex) || readyState.createIndex;
//    },
    
//    getUpgradeFunction: function(state, callback) {
//      return function(e) {
//        var res = e.target.result;
//        if (res instanceof IDBDatabase)
//          RM.db = res;
//        
//        var needsUpdate = G.userChanged || state.modelsChanged;
//        if (!needsUpdate) {
//          // unclear how it ever gets here, but it does
//          return;
//        }
//        
//        var newStores = [];
//        var numCallbacks = 1;
//        var numCalledBack = 0;
//        e.target.transaction.oncomplete = function() {
//          numCalledBack++;
//          if (callback && numCalledBack >= numCallbacks) {
//            G.log(RM.TAG, 'db', 'db upgrade transaction.oncomplete');
//            callback();
//            callback = null;
//          }
////          if (callback) {// && finishedUpdate)
////            if (!useWebSQL)
////              callback();
////            else if (_.all(newStores, RM.storeIsReady))
////              callback() && (callback = null);
////          }
//        };
//        
//        var finishedUpdate = false;
//        G.log(RM.TAG, 'db', 'db upgrade transaction onsuccess');
//        if (G.userChanged) {
//          G.userChanged = false;
//          newStores = RM.updateStores(true);
//        }
//        else if (state.modelsChanged) {
//          state.modelsChanged = false;
//          newStores = RM.updateStores();
//        }
//        
//        if (!newStores || !newStores.length)
//          callback && callback();
//        else if (useWebSQL) {
//          numCallbacks = _.reduce(newStores, function(a, b) {
//            return a + (!_.isUndefined(b.__ready.createObjectStore) ? 1 : 0) + (!_.isUndefined(b.__ready.createIndex) ? b.indexNames.length : 0) 
//          }, 0);
//        }
//      }
//    },
    
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
      runTask: function(task, sequential) {
        var promise, self = RM.taskManager;
        if (!sequential) {
          if (self.blocked) {
            self.nonseq.push(task);
          }
          else {
            promise = task();
            promise._lablzId = G.nextId();
            self.runningTasks.push(promise);
            promise.done(function() {
              self.runningTasks.remove(promise);
            }); 
          }
        
          return promise;
        }
        
        // Sequential task - need to wait for all currently running tasks to finish
        // and block any new tasks from starting until this one's done
        if (self.blocked) {
          var dfd = new $.Deferred();
          self.seqQueue.push({task: task, deferred: dfd});
          return dfd.promise();
        }
        
        self.blocked = true;
        var defer = $.Deferred();
        $.when.apply(null, self.runningTasks).done(function() { // not sure if it's kosher to change runningTasks while this is running
          var taskPromise = task();
          taskPromise.always(function() {
            var qLength = self.seqQueue.length;
            self.blocked = false; // unblock to allow next task to start;
            if (qLength) {
              var next = self.seqQueue.shift();
              var dfd = next.deferred;
              self.runTask(next.task, true).done(dfd.resolve).fail(dfd.reject);
            }
            else {
              if (self.nonseq.length) {
                _.map(self.nonseq, self.runTask);
                self.nonseq.length = 0;
              }
            }
    
            defer.resolve();
          });
        });
        
        return defer.promise();
      }
    },
    
    state: {
      modelsChanged: false
    },
    
    openDB: function(version) {
      
      var settings = {
        upgrade: function(transaction) {          
          G.log(RM.TAG, "db", 'in upgrade function');
          var needsUpdate = G.userChanged || RM.state.modelsChanged;
          if (!needsUpdate) {
            G.log(RM.TAG, "db", 'upgrade not necessary');
            // unclear how it ever gets here, but it does
            return;
          }
          
          G.log(RM.TAG, "db", 'upgrading...');
          var newStores = [];
//          var numCallbacks = 1;
//          var numCalledBack = 0;
//          e.target.transaction.oncomplete = function() {
//            numCalledBack++;
//            if (numCalledBack >= numCallbacks) {
//              G.log(RM.TAG, 'db', 'db upgrade transaction.oncomplete');
//            }
//          };
          
          var finishedUpdate = false;
          G.log(RM.TAG, 'db', 'db upgrade transaction onsuccess');
          if (G.userChanged) {
            G.userChanged = false;
            newStores = RM.updateStores(transaction, true);
          }
          else if (RM.state.modelsChanged) {
            RM.state.modelsChanged = false;
            newStores = RM.updateStores(transaction);
          }
          
//          if (!newStores || !newStores.length) {
//          }
//          else if (useWebSQL) {
//            numCallbacks = _.reduce(newStores, function(a, b) {
//              return a + (!_.isUndefined(b.__ready.createObjectStore) ? 1 : 0) + (!_.isUndefined(b.__ready.createIndex) ? b.indexNames.length : 0) 
//            }, 0);
//          }        
        }
      };
      
      if (typeof version !== 'undefined')
        settings.version = version;

      if (RM.db) {
        G.log(RM.TAG, "db", 'closing db');
        RM.db.close();
      }
      
      G.log(RM.TAG, "db", 'opening db');
      var dbPromise = RM.$db = $.indexedDB('lablz', settings);
      dbPromise.done(function(db, event) {
        RM.db = db;
        RM.state.modelsChanged = !!Voc.changedModels.length || !!Voc.newModels.length;
        if (!RM.state.modelsChanged) {
          for (var type in G.usedModels) {
            if (!RM.storeExists(type)) {
              RM.state.modelsChanged = true;
              G.log(RM.TAG, 'db', 'need table for model:', type)
              break;
            }
          }
        }
        
        RM.VERSION = G.userChanged || RM.state.modelsChanged ? (isNaN(RM.db.version) ? 1 : parseInt(RM.db.version) + 1) : RM.db.version;
        if (RM.db.version == RM.VERSION) {
          G.log(RM.TAG, 'db', "done prepping db");
          return;
        }

        RM.runTask(function() {
          return $.Deferred(function(defer) {
            RM.openDB(RM.VERSION).done(defer.resolve);
          }).promise();
        }, true);
      }).fail(function(error, event) {
        G.log(RM.TAG, ['db', 'error'], error, event);
      }).progress(function(db, event) {
//        debugger;
        G.log(RM.TAG, 'db', event.type);
      });
      
      return dbPromise;
    },
    
//    openDB1: function(success, error) {
//      var state = {
//        modelsChanged: false
//      };
//      
//      G.log(RM.TAG, 'db', "opening db");
//      var request = indexedDB.open(RM.DB_NAME);
//    
//      request.onblocked = function(event) {
//        alert("Please close all other tabs with this site open!");
//      };
//    
//      request.onabort = RM.onabort;
//    
//      var onsuccess;
//      var upgrade = RM.getUpgradeFunction(state, success);
//      request.onsuccess = onsuccess = function(e) {
//        G.log(RM.TAG, 'db', 'open db onsuccess');
//        RM.db = e.target.result;
//        RM.useUpgradeNeeded = RM.useUpgradeNeeded || !RM.db.setVersion;
////        var db = RM.db;
//        RM.db.onversionchange = function(event) {
//          G.log(RM.TAG, 'db', 'closing db - onversionchange');
////          alert('version change');
//          RM.db.close();
//          RM.openDB(success, error);
////          window.location.reload();
////          setTimeout(function() {alert("A new version of this page is ready. Please reload!");}, 5000);
//        };    
//     
//        state.modelsChanged = !!Voc.changedModels.length || !!Voc.newModels.length;
//        if (!state.modelsChanged) {
//          for (var type in G.usedModels) {
//            if (!RM.storeExists(type)) {
//              state.modelsChanged = true;
//              G.log(RM.TAG, 'db', 'need table for model:', type)
////              debugger;
//              break;
//            }
//          }
//        }
//        
//        RM.VERSION = G.userChanged || state.modelsChanged ? (isNaN(RM.db.version) ? 1 : parseInt(RM.db.version) + 1) : RM.db.version;
//        if (RM.db.version == RM.VERSION) {
//          if (success)
//            success();
//          
////          G.recordCheckpoint("done prepping db");
//          G.log(RM.TAG, 'db', "done prepping db");
//          return;
//        }
//        
////          G.recordCheckpoint("upgrading db");
//        G.log(RM.TAG, 'db', 'about to upgrade db');
//        if (RM.useUpgradeNeeded) { // detect whether we will use deprecated db.setVersion or upgradeneededevent
//          G.log(RM.TAG, 'db', 'upgrading db');
////          G.recordCheckpoint("upgrading db");
//          RM.db.close();
//          var subReq = indexedDB.open(RM.DB_NAME, RM.VERSION);
//          subReq.onsuccess = request.onsuccess;
//          subReq.onerror = request.onerror;
//          subReq.onupgradeneeded = request.onupgradeneeded;
//        }
//        else {
//          G.log(RM.TAG, 'db', 'in old setVersion. User changed: ' + G.userChanged + '. Changed models: ' + (Voc.changedModels.join(',') || 'none') + ', new models: ' + (Voc.newModels.join(',') || 'none')); // deprecated but needed for Chrome
//          
//          // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
//          var req = RM.db.setVersion(RM.VERSION);
//          // onsuccess is the only place we can create Object Stores
//          req.onerror = RM.onerror;
//          req.onblocked = function(e) {
//            RM.deleteDatabase(function() {
//              RM.openDB.apply(success, error);
//            });
//          };
//          
//          req.onsuccess = upgrade;
//        }
//      };
//      
//      request.onupgradeneeded = upgrade;
//      request.onerror = function(e) {
//        G.log(RM.TAG, 'db', "error opening db");
//        if (error)
//          error(e);
//        
//        RM.onerror(e);
//      };  
//    },
    
    updateStores: function(trans, reset) {
//      var db = RM.db;
      // previously we made stores for linked models as well, but we don't anymore because we don't know ahead of time which indices they will need
      
      var toDel = _.union(Voc.changedModels, Voc.newModels);
      var models = _.union(toDel, _.keys(G.usedModels)); //, _.map(G.linkedModels, function(m){return m.type}));
      if (reset)
        momdels = G.models;
//        models = _.union(models, G.models, G.linkedModels);

      models = _.filter(models, function(m) {
        if (!Voc.typeToModel[m])
          return false; // can't create indices
        
        var r = G.Router;
        if (r) {
          var c = r.currentModel;
          if (c) {
            if (c.type == m) {
              return true;
            }
          }
        }
            
        return _.contains(G.classUsage, m);
      });

      if (_.uniq(toDel).length != toDel.length)
        debugger;
      if (_.uniq(models).length != models.length)
        debugger;

//      toDel = _.map(toDel, U.getClassName);
//      models = _.map(models, U.getClassName);
      
      Voc.changedModels.length = 0;
      Voc.newModels.length = 0;
      if (!models.length)
        return;
      
      var newStores = [];
      var deleted = [];
      var created = [];
      for (var i = 0; i < models.length; i++) {
        var type = models[i];
        if (Voc.typeToEnum[type] || Voc.typeToInline[type])
          continue;
        
        if (RM.storeExists(type)) {
          if (reset || _.contains(toDel, type)) {
            try {
//              G.log(RM.TAG, 'db', 'deleting object store: ' + type);
              trans.deleteObjectStore(type);
              G.log(RM.TAG, 'db', 'deleted object store: ' + type);
              deleted.push(type);
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
//          G.log(RM.TAG, 'db', 'creating object store: ' + type);
          var store = trans.createObjectStore(type, RM.defaultOptions);
          newStores.push(store);
          G.log(RM.TAG, 'db', 'created object store: ' + type);
          var m = Voc.typeToModel[type];
          var indices = [];
          var vc = m.viewCols || '';
          var gc = m.gridCols || '';
          var cols = _.uniq(_.map((vc + ',' + gc).split(','), function(c) {return c.trim().replace('DAV:displayname', 'davDisplayName')}));
          _.each(cols, function(pName) {
            pName = pName.trim();
            if (!pName.length)
              return;
            
            G.log(RM.TAG, 'db', 'creating index', pName, 'for store', type);
            var index = store.createIndex(pName);              
            G.log(RM.TAG, 'db', 'created index', pName, 'for store', type);
            indices.push(pName);
          });  
          
          created.push(type);
        } catch (err) {
          debugger;
          G.log(RM.TAG, ['error', 'db'], '2. failed to create table ' + type + ': ' + err);
          return;
        }
      }
      
//      deleted.length && G.log(RM.TAG, 'db', '2. deleted tables: ' + deleted.join(","));
//      created.length && G.log(RM.TAG, 'db', '2. created tables: ' + created.join(","));
      
      return newStores;
    },
    
    addItems: function(items, classUri) {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {        
          if (!items || !items.length || !RM.db) {
            defer.resolve();
            return;
          }
          
          if (!classUri) {
            var first = items[0];
            if (U.isModel(first))
              classUri = first.vocModel.type;
            else
              classUri = U.getTypeUri(items[0].type._uri);
          }
          
          var vocModel = Voc.typeToModel[classUri];
          if (!RM.storeExists(classUri)) {
            defer.resolve();
            RM.runTask(function() {
              defer = $.Deferred(function(defer) {
                G.log(this.TAG, "db", "2. newModel: " + classUri);
                U.pushUniq(Voc.newModels, classUri);
                
                RM.openDB().done(defer.resolve);
    //            RM.openDB(function() {
    //              RM.addItems(items, classUri);
    //            });            
              });
              
              defer.done(function() {
                RM.addItems(items, classUri);
              });
              
              return defer.promise();
            }, true);
            
            return;
          }
  
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
      });
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
    //    RM.getItems(type);
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
          qMap = collection.queryMap,
          filter = filter || U.getQueryParams(collection);
      
      if (qMap) {
        orderBy = qMap.$orderBy;
        asc = U.isTrue(qMap.$asc);
      }
      
      if (!orderBy && !_.size(filter))
        return false;
      
      var vCols = U.getColsMeta(data.vocModel, 'grid');
      var gCols = U.getColsMeta(data.vocModel, 'view');
      var cols = _.union(vCols, gCols);
      if (orderBy && !_.contains(cols, orderBy))
        return false;
      
      if (!_.all(_.keys(filter), function(name) {return _.contains(cols, name);}))
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
        rules.push(function(val) {
          try {
//            return eval(val[name] + op + bound);
            return eval('"' + val[name] + '"' + op + '"' + bound + '"');
          } catch (err){
            return false;
          }
          
          // TODO: test values correctly, currently fails to eval stuff like 134394343439<=today
          return true;
        });
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
      if (!RM.storeExists(type))
        return false;

      function queryWithoutIndex() {
        return $.Deferred(function(defer) {            
          var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
          var valueTester = RM.buildValueTesterFunction(filter, data);
          var results = [];
          var filterResults = function(item) {
            var val = item.value;
            if (!valueTester || valueTester(val))
              results.push(val);
          };
          
          var direction = U.isTrue(data.queryMap.$asc) || IDBCursor.PREV;
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
        G.log(RM.TAG, "db", 'Starting getItems Transaction');
//        var store = $.indexedDB('lablz').objectStore(type, IDBTransaction.READ_ONLY);
        var results = [];
        var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
        if (uri)
          return store.get(uri);

        var query = RM.buildDBQuery(store, data, filter);
        if (query) {
          var qDefer = $.Deferred();
          query.getAll(store).done(qDefer.resolve).fail(function() {
            queryWithoutIndex().promise().done(qDefer.resolve).fail(qDefer.reject);
          });
          
          return qDefer.promise();
        }
        else
          return queryWithoutIndex().promise();
      });
      
//      G.log(RM.TAG, 'db', 'starting readonly transaction for store', type);
//      var trans;
//      try {
//        trans = RM.db.transaction([type], IDBTransaction.READ_ONLY);
//      } catch (err) {
//        debugger;
//        G.log(RM.TAG, ['error', 'db'], 'failed to start readonly transaction for store', type, err);
//        return false;
//      }
//      
//      trans.oncomplete = function(e) {
//        if (success && error) // neither success nor error were called
//          error(e);
//          
//        G.log(RM.TAG, 'db', 'finished readonly transaction for store', type);
//      };
//      
//      var store = trans.objectStore(type);      
//      var query, dbReq, cursorRequest, valueTester, results = [];
//      if (!uri) {
//        query = RM.buildDBQuery(store, data, filter);
//        if (!query)
//          valueTester = RM.buildValueTesterFunction(filter, data);
//      }
//      
//      if (query) {
//        dbReq = query.getAll(store);
//      }
//      else {
//        if (uri)
//          dbReq = store.get(uri);
//        else
//          dbReq = startAfter ? store.openCursor(IDBKeyRange.lowerBound(startAfter, true)) : store.openCursor();
//      }
//      
//      dbReq.onsuccess = function(e) {
////        G.log(RM.TAG, 'db', 'read via cursor onsuccess');
//        var result = e.target.result;
//        if (result) {
//          if (query) {
//            result = success(result);
//            success = null;
//            return result;
//          }
//          else if (uri) {
//            result = success([result]);
//            success = null;
//            return result;
//          }
//          
//          var val = result.value;
//          if (valueTester && !valueTester(val)) {
//            result['continue']();
//            return;            
//          }
//          
//          results.push(val);
//          if (!total || results.length < total) {
//            result['continue']();
//            return;
//          }
//        }
//        
//        return success && success(results);
//      };
//    
//      dbReq.onerror = function (e) {
//        G.log(RM.TAG, 'db', 'read via cursor onerror', e);
//        error && error(e);
//        error = null;
////        RM.onerror(e);
//      }
    },

    restartDB: function() {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {
//          $(document).ready(function() {
            RM.openDB().done(defer.resolve);
//          }); 
        }).promise();
      }, true);
    }

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  Events.on('modelsChanged', function(options) {
    RM.restartDB().done(options.success).fail(options.error);
  });
  
  Events.on('resourcesChanged', function(toAdd) {
    RM.addItems(toAdd);
  });

//  Events.on('canceled', function(toAdd) {
//    RM.addItems(toAdd);
//  });
//
//
//  MB.getInstance = function() {
//    if (RM === null) {
//      Lablz.RM = new RM();
//    }
//    
//    return RM;
//  };
  return (Lablz.ResourceManager = ResourceManager);
//  return ModelsBase.getInstance();
});