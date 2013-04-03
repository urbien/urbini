//'use strict';
define([
  'globals',
  'utils', 
  'events', 
  'taskQueue',
  'cache',
  'vocManager',
  'queryIndexedDB'
], function(G, U, Events, TaskQueue, C, Voc, idbq) {
  var useWebSQL = window.webkitIndexedDB && window.shimIndexedDB;
  useWebSQL && window.shimIndexedDB.__useShim();
//  window.idbModules.DEBUG = G.minify === false;
  var parse = function(items) {
    return parseFromDB(items);
  },

  hasIndex = function(indexNames, name) {
    return _.contains(indexNames, prepPropNameForDB(name));
  },
  
  prepPropNameForDB = function(propName) {
    return '_' + propName;
  },
  
  parsePropNameFromDB = function(propName) {
    return propName.startsWith('_') ? propName.slice(1) : propName;
  },
    
  prepForDB = function(item) {
    var _item = {};
    for (var prop in item) {
      _item[prepPropNameForDB(prop)] = item[prop];
    }

    return _item;
  },
  
  parseFromDB = function(_items) {
    if (!_items)
      return _items;
    
    var returnObj = U.getObjectType(_items) === '[object Object]';
    if (returnObj)
      _items = [_items];
    
    var items = _.map(_items, function(_item) {
      var item = {};
      for (var prop in _item) {
        item[parsePropNameFromDB(prop)] = _item[prop];
      }
      
      return item;
    });
    
    return returnObj ? items[0] : items;
  },
  
  Index = idbq.Index,
  REF_STORE = {
    name: 'ref',
    indices: prepForDB({
      _uri: {unique: true, multiEntry: false},
      _dirty: {unique: false, multiEntry: false},
      _tempUri: {unique: false, multiEntry: false}, // unique false because it might not be set at all
      _problematic: {unique: false, multiEntry: false}
//      ,
//      _alert: {unique: false, multiEntry: false}      
    })
  };

  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, data, options) {
    options = options || {};
    if (_.contains(['patch', 'create'], method)) {
      if (options.sync) {
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
      
      data.lastFetchOrigin = 'server';
      RM.fetchResources(method, data, options, isUpdate, timeout, lastFetchedOn);
    }
    
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
      if (isCollection && options.startAfter) {
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
        if (RM.isStale(lastFetchedOn, now))
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
        if (RM.isStale(ts, now))
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
      dbReqOptions.startAfter = options.startAfter,
      dbReqOptions.perPage = collection.perPage;
      dbReqOptions.filter = isFilter && filter;
    }
    else
      dbReqOptions.uri = key;

    var dbPromise = RM.getItems(dbReqOptions);
    if (!dbPromise) {
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
        if (RM.isStale(lf, now)) {
          data.lastFetchOrigin = 'server';
          fetchFromServer(isUpdate, 100);
        }
        
        return;
      }
      
      if (forceFetch) {
        data.lastFetchOrigin = 'server';
        return fetchFromServer(isUpdate, 0);
      }
      
      var numAfter = collection.models.length;
      if (!isUpdate && numAfter === numBefore) // db results are useless
        return fetchFromServer(isUpdate, 100);
      
      var lf = RM.getLastFetched(results, now);
      if (RM.isStale(lf, now)) {
        data.lastFetchOrigin = 'server';
        return fetchFromServer(isUpdate, 100);
      }
    }).fail(function(e) {
      if (e) 
        G.log(RM.TAG, 'error', "Error fetching data from db: " + e);
      fetchFromServer(isUpdate, 0);
    }).progress(function(db, event) {
      error = error;
    });
  };
  
  Lablz.idbq = idbq;
  var RM;
  var ResourceManager = RM = {
    TAG: 'Storage',
    fetchResources: function(method, data, options, isUpdate, timeout, lastFetchedOn) {
        if (!G.online) {
        options.error && options.error(null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options);
          return;
        }
      
        data.lastFetchOrigin = 'server';
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
        
      U.ajax({url: options.url, type: 'GET', headers: options.headers}).done(function(data, status, xhr) {
        options.success(data, status, xhr);
      }).fail(function(xhr, status, msg) {
        if (xhr.status === 304)
          return;
        
        G.log(RM.TAG, 'error', 'failed to get resources from url', options.url, msg);
        options.error(null, xhr, options);
      });      
    },
    
    put: function(items, store) {
      if (U.getObjectType(items) === '[object Object]')
        items = [items];
      
      return $.when.apply($, _.map(items, function(item) {
        return store.put(prepForDB(item));
      }));
    },
    
    Index: function(propName) {
      return Index(prepPropNameForDB(propName));
    },
    
    createRefStore: function() {
      return $.Deferred(function(defer) {
        if (RM.db && RM.storeExists(REF_STORE.name)) {
          defer.resolve();
        }
        else {
          RM.upgradeDB({toMake: [REF_STORE.name]}).done(defer.resolve).fail(defer.reject);
        }
      }).promise();
    },
    useUpgradeNeeded: useWebSQL || !!window.IDBOpenDBRequest,
//    useUpgradeNeeded: !!window.IDBOpenDBRequest,
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
      
      return Backbone.defaultSync(method, data, options);
    },
  
    /**
     * is 3 minutes old
     */
    maxDataAge: 180000,
    
    isStale: function(ts, now) {
      return !ts || (now || G.currentServerTime()) - ts > RM.maxDataAge;
    },
    
    getLastFetchedTimestamp: function(resOrJson) {
      return U.getValue(resOrJson, '_lastFetchedOn') || U.getValue(resOrJson, 'davGetLastModified');
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
    db: null,
    VERSION: 1,
//    modelStoreOptions: {keyPath: 'type'},
    dbPaused: false,
    storeExists: function(name) {
      var db = RM.db;
      var names = db && db.objectStoreNames;
      if (!names)
        return false;
      
      return names._items ? _.contains(names._items, name) : names.contains(name);
    },
    
    defaultOptions: {keyPath: prepPropNameForDB('_uri'), autoIncrement: false},
    DB_NAME: "lablz",
    runTask: function() {
      return this.taskQueue.runTask.apply(this.taskQueue, arguments);
    },
    taskQueue: new TaskQueue("DB"),
    
    /**
     * Check if we need to delete any stores. Creation of stores happens on demand, deletion happens when models change
     */
    updateDB: function(types) {
      return $.Deferred(function(defer) {
        var toKill = _.clone(types);
        if (RM.db) {
          toKill = _.filter(toKill, function(m) {
            return RM.storeExists(m);
          });
          
          if (toKill.length)
            RM.upgradeDB({killStores: toKill, msg: "upgrade to kill stores: " + toKill.join(",")}).done(defer.resolve).fail(defer.reject);
          else
            defer.resolve();
        }
        else
          RM.openDB({killStores: toKill}).done(defer.resolve).fail(defer.reject);
      }).promise();
    },
    
    deleteDatabase: function() {
      G.log(RM.TAG, 'info', 'deleting db');
      return $.indexedDB(RM.DB_NAME).deleteDatabase().done(function() {
        G.log(RM.TAG, 'info', 'deleted db');
        RM.databaseCompromised = false;
        RM.db = null;
      });
    },
    
    /**
     * If you want to upgrade, pass in a version number, or a store name, or an array of store names to create
     */
    openDB: function(options) {
      if (G.databaseCompromised) {
        G.log(RM.TAG, 'db', 'user changed, deleting database');
        var dfd = $.Deferred();
        var dbPromise = RM.deleteDatabase().done(function(crap, event) {
          G.log(RM.TAG, 'db', 'deleted database, opening up a fresh one');
          RM.openDB(options).done(dfd.resolve).fail(dfd.reject);
        }).fail(function(error, event) {
          RM.openDB(options).done(dfd.resolve).fail(dfd.reject); // try again?
          G.log(RM.TAG, 'db', 'failed to delete database');
        }).progress(function(db, event) {
          RM.upgradeDB(options).done(dfd.resolve).fail(dfd.reject);;
        });
        
        return dfd;
      }

      options = options || {};
      var version = options.version, toMake = options.toMake || [], toKill = options.toKill || [];
      if (toMake.indexOf('http://www.hudsonfog.com/voc/model/crm/SupportIssue') != -1)
        debugger;
      
      if (RM.db && !RM.storeExists(REF_STORE.name))
        toMake.push(REF_STORE.name);
      
      var needUpgrade = function() {
        return !!(toKill.length || toMake.length) ;
      }
      
      if (!version) {
        if (RM.db) {
          var currentVersion = isNaN(RM.db.version) ? 0 : parseInt(RM.db.version);
          version = needUpgrade() ? currentVersion + 1 : currentVersion;
        }
      }

      var settings = {
        upgrade: function(transaction) {
          G.log(RM.TAG, "db", 'in upgrade function');
          if (!toMake.length && !toKill.length) {
            G.log(RM.TAG, "db", 'upgrade not necessary');
            return;
          }
          
          G.log(RM.TAG, "db", 'upgrading...');
          G.log(RM.TAG, 'db', 'db upgrade transaction onsuccess');
          newStores = RM.updateStores(transaction, toMake, toKill);
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
      var openPromise = RM.$db = $.indexedDB(RM.DB_NAME, settings);
      openPromise.done(function(db, event) {
        RM.db = db;
        var currentVersion = db ? isNaN(db.version) ? 1 : parseInt(db.version) : 1;
        if (!RM.storeExists(REF_STORE.name)) {
          toMake.push(REF_STORE.name);
          version = currentVersion + 1;
        }
        
        // user refreshed the page
        if (!RM.db && !version) { 
          if (needUpgrade()) {
            G.log(RM.TAG, "db", "current db version: " + currentVersion + ", upgrading");
            version = currentVersion + 1;
          }
          else 
            version = currentVersion;              
        }
        
        RM.VERSION = version = typeof version === 'number' ? Math.max(version, currentVersion) : currentVersion; // just in case we want it later on, don't know for what yet 
        if (currentVersion === version) {
          G.log(RM.TAG, 'db', "done prepping db");
          dbPromise.resolve();
          return;
        }

        // Queue up upgrade
        RM.upgradeDB(_.extend(options, {version: version, msg: "upgrade to kill stores: " + toKill.join(",") + ", make stores: " + toMake.join()}));
        dbPromise.resolve();
      }).fail(function(error, event) {
        debugger;
        G.log(RM.TAG, ['db', 'error'], error, event);
        dbPromise.reject();
      }).progress(function(db, event) {
        switch (event.type) {
          case 'blocked':
            G.log(RM.TAG, ['db', 'error'], "upgrading db - received blocked event, queueing up restartDB");
            dbPromise.reject();
            RM.restartDB();
            break;
          case 'upgradeneeded':
            break;
        }
        G.log(RM.TAG, 'db', event.type);
      });
      
      return dbPromise;
    },
    
    getIndexNames: function(vocModel) {
      var vc = vocModel.viewCols || '';
      var gc = vocModel.gridCols || '';
      var extras = U.getPositionProps(vocModel);
      var cols = _.union(_.values(extras), _.map((vc + ',' + gc).split(','), function(c) {
        return c.trim().replace('DAV:displayname', 'davDisplayName')
      }));
      
      var props = vocModel.properties;
      cols = _.filter(cols, function(c) {
        var p = props[c];
        return p && !p.backLink; // && !_.contains(SQL_WORDS, c.toLowerCase());
      }).concat('_uri');
      
      return _.map(cols, prepPropNameForDB);
    },
    
    updateStores: function(trans, toMake, toKill) {
      toKill = _.union(_.intersection(toMake, toKill), toKill);
      for (var i = 0; i < toKill.length; i++) {
        var type = toKill[i];
        if (RM.storeExists(type)) {
          try {
            trans.deleteObjectStore(type);
            G.log(RM.TAG, 'db', 'deleted object store: ' + type);
          } catch (err) {
            G.log(RM.TAG, ['error', 'db'], '2. failed to delete table ' + type + ': ' + err);
            return;
          }
        }
      }
      
      for (var i = 0; i < toMake.length; i++) {
        var type = toMake[i];
        if (type === REF_STORE.name) {
          var store = trans.createObjectStore(type, {keyPath: prepPropNameForDB('_id'), autoIncrement: true});
          var indices = REF_STORE.indices;
          for (var index in indices) {
            store.createIndex(index, indices[index]);
          }
          
          continue;
        }
        
        if (U.getEnumModel(type) || U.getInlineResourceModel(type))
          continue;
        
        var vocModel = U.getModel(type);
        if (!vocModel) {
//          G.log(RM.TAG, 'db', 'missing model for', type, 'not creating store');
          throw new Error("missing model for " + type + ", it should have been loaded before store create operation was queued");
        }
        
        try {
          if (RM.db && RM.storeExists(type))
            continue;
          
          var store = trans.createObjectStore(type, RM.defaultOptions);
          if (!store) {
            debugger;
            continue;
          }
          
          G.log(RM.TAG, 'db', 'created object store: ' + type);
          var indices = [];
          var indexNames = RM.getIndexNames(vocModel);
          for (var i = 0; i < indexNames.length; i++) {
            var pName = indexNames[i].trim();
            if (!pName.length)
              return;
            
//            G.log(RM.TAG, 'db', 'creating index', pName, 'for store', type);
            var index = store.createIndex(pName, {unique: false, multiEntry: false});
            G.log(RM.TAG, 'db', 'created index', pName, 'for store', type);
            indices.push(pName);
          }  
        } catch (err) {
          debugger;
          G.log(RM.TAG, ['error', 'db'], '2. failed to create table ' + type + ': ' + err);
          return;
        }
      }
    },
    
    addItems: function(items, classUri) {
      return $.Deferred(function(defer) {
        if (!items || !items.length) {
          defer.reject();
          return;
        }
        
        if (!RM.db) {
          var args = arguments;
          setTimeout(function() {
            RM.addItems.apply(RM, arguments).done(defer.resolve).fail(defer.reject);
          }, 1000);
          return;
        }
        
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
        
        if (!RM.storeExists(classUri)) {
          RM.upgradeDB({toMake: [classUri], msg: "Upgrade to make store: " + classUri}).done(function() {
            var addPromise = RM.addItems(items, classUri);
            if (addPromise)
              addPromise.done(defer.resolve).fail(defer.reject);
            else
              defer.reject();
          });
          
          return defer.promise();
        }
                
        RM.runTask(function() {
          var dfd = this; 
          var vocModel = U.getModel(classUri);
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item = U.isModel(item) ? item.toJSON() : item;
            items[i] = U.flattenModelJson(item, vocModel);
          }
          
          G.log(RM.TAG, "db", 'Starting addItems Transaction');
          RM.$db.transaction(classUri, 1).promise().done(function() {
            G.log(RM.TAG, "db", 'Transaction completed, all data inserted');
            dfd.resolve();
          }).fail(function(err, e){
            debugger;
            dfd.reject();
            G.log(RM.TAG, ['db', 'error'], 'Transaction NOT completed, data not inserted', err, e);
          }).progress(function(transaction) {
            var store = transaction.objectStore(classUri);
            RM.put(items, store);
//            for (var i = 0; i < items.length; i++) {
//              store.put(items[i]);
//            }
          });
        }, {name: "Add Items"}).done(defer.resolve).fail(defer.reject);
      }).promise();      
    }, //.async(100),
    
//    syncQueue: new TaskQueue("sync with server"),
    
    SYNC_TASK_NAME: 'sync with server',
    sync: function() {
      if (!RM.db || G.currentUser.guest)
        return;

      if (!G.online) {
        Events.once('online', RM.sync);
        return;
      }
        
      RM.runTask(function() {
//          RM.Index('__dirty').eq(1).getAll(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
        var defer = this; 
        RM.Index('_problematic').neq(1).getAll(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
          if (!results.length) {
            defer.resolve();
            return;
          }
          
          results = parse(results);
          var types = [];
          for (var i = 0; i < results.length; i++) {
            var r = results[i];
            U.pushUniq(types, U.getTypeUri(r._uri));
          }
          
          Voc.getModels(types, {sync: false}).done(function() {
            RM.syncResources(results).done(defer.resolve).fail(defer.reject);
          }).fail(function() {
            debugger;
            defer.reject();
          });            
        }).fail(function(error, event) {
          debugger;
          defer.reject(error, event);
        });
      }, {name: RM.SYNC_TASK_NAME, sequential: false, preventPileup: true});
    },

    saveToServer: function(updateInfo) {
      return $.Deferred(function(dfd) {
        var info = updateInfo,
            resource = info.resource, 
            ref = info.reference,
            refs = info.references,
            vocModel = resource.vocModel,
            type = vocModel.type;
        
        var atts = _.omit(ref, _.keys(REF_STORE.indices));
        atts.$returnMade = true;
        resource.save(atts, { // ref has only the changes the user made
          sync: true, 
          fromDB: true,
          success: function(model, data, options) {
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
            
            RM.$db.transaction([type, REF_STORE.name], 1).done(function() {
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
              RM.put(data, resStore);
              RM.put(ref, transaction.objectStore(REF_STORE.name, 1));
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
            else if (code == 304)
              return;
            
            var problem = xhr.responseText;
            if (problem) {
              try {
                problem = JSON.parse(problem);
                ref._error = problem.error;
              } catch (err) {
                problem = null;
              }
            }
            
            ref._error = ref._error || {code: -1, details: (ref._tempUri ? 'There was a problem with your edit' : 'There was a problem creating this resource')};
            var isMkResource = !ref._tempUri;
            var toSave;
            var errInfo = _.pick(ref, 'uri', '_error');
            resource.set(errInfo);
            
            if (isMkResource)
              toSave = _.extend(U.getQueryParams(atts, resource.vocModel), errInfo);
            else
              toSave = resource.toJSON(); //_.extend(resource.toJSON(), errInfo);
            
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
      }).promise();
    },
    
    syncResource: function(ref, refs) {
      return $.Deferred(function(dfd) {
        var uri = ref._uri,
            type = U.getTypeUri(uri),
            id = ref.id,
            vocModel = U.getModel(type),
            props = vocModel.properties;

        if (!RM.storeExists(type)) {
          debugger;
        }
        
        uri = ref._uri; // TODO: figure out why uri value gets lost
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
            var refStore = RM.$db.objectStore(REF_STORE.name, 1);
            RM.put(ref, refStore).done(function() {
              var resStore = RM.$db.objectStore(type, 1);
              resStore.get(uri).done(function(item) {
                RM.put(_.extend(parse(item), ref), resStore).always(dfd.resolve);
              }).fail(dfd.resolve);
            }).fail(dfd.resolve);
          }
          else {
            dfd.resolve();
            RM.sync(); // queue up another sync
          }
          
          return;
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
          if (!_.isEqual(ref, updatedRef)) {
            var idx = refs.indexOf(ref);
            refs[idx] = updatedRef;
          }
          
          dfd.resolve();
        });
      }).promise();
    },
    
    syncResources: function(refs) {
      return $.Deferred(function(defer) {
        var dfds = [];
        var q = new TaskQueue('syncing some refs');
        _.each(refs, function(ref) {
          if (ref._dirty) {
            var dfd = q.runTask(function() {
              return RM.syncResource(ref, refs).always(this.resolve);
            }, {sequential: true, name: 'sync ref: ' + ref._uri});
            
            dfds.push(dfd);
          }          
        });
        
        $.when.apply($, dfds).always(function() {
          defer.resolve();
        });
      }).promise();
    },
    
    isSyncPostponable: function(vocModel) {
      return vocModel && !U.isA(vocModel, "Buyable");
    },
    
    makeTempID: function() {
      return G.currentServerTime();
    },
    
    saveItem: function(item, options) {
      return $.Deferred(function(defer) {
        var vocModel = item.vocModel;
        if (!RM.isSyncPostponable(vocModel)) {
          item.save(undefined, _.extend(options, {sync: true}));
          defer.resolve();
          return;
        }
        
        var now = RM.makeTempID(),
            uri = item.getUri(),
            type = vocModel.type;
        
        var tempUri;
        if (!uri || item.detached) {
          tempUri = U.makeTempUri(type, now);
          item.set({'_uri': tempUri}, {silent: true});
        }
  
        var itemJson = tempUri ? item.toJSON() : item.getUnsavedChanges(),
            itemRef = _.extend({_id: now, _uri: uri || tempUri}, itemJson), 
            done = options.success,
            fail = options.error;
        
        var dfd;
        if (uri) {
          RM.Index('_uri').eq(uri).getAll(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
            results = parse(results);
            if (!results.length)
              RM.saveItemHelper(itemRef, item).done(defer.resolve).fail(defer.reject);
            else {
              var result = results[0];
              _.extend(result, itemJson);
              RM.saveItemHelper(result, item).done(defer.resolve).fail(defer.reject);
            }
          }).fail(function() {
            RM.saveItemHelper(itemRef, item).done(defer.resolve).fail(defer.reject);
          });
        }
        else if (tempUri) {
          itemRef._uri = tempUri;
          RM.saveItemHelper(itemRef, item).done(defer.resolve).fail(defer.reject);
        }        
      });
    },
    
//    saveItemHelper: function(itemRef, item) {
//      return $.Deferred(function(addDefer) {
//        var type = item.vocModel.type;
//        if (itemRef._dirty) {
//          // no need to save ref, it's already marked as dirty, just save the resource
//          RM.addItems([item], type).done(function() {
//            addDefer.resolve();
//            RM.sync();
//          }).fail(function() {
//            addDefer.reject();
//  //          RM.$db.objectStore("ref")["delete"](now);
//          });        
//        }
//        else {
//          itemRef._dirty = 1;
//          itemRef._problematic = 0;
//          var refStore = RM.$db.objectStore(REF_STORE.name);
//          RM.put(itemRef, refStore).done(function() {            
//            RM.addItems([item], type).done(function() {
//              addDefer.resolve();
//              RM.sync();
//            }).fail(function() {
//              addDefer.reject();
//              debugger;
//    //          RM.$db.objectStore("ref")["delete"](now);
//            });
//          }).fail(function() {
//            addDefer.reject();
//            debugger;
//          });
//        }
//      }).promise();
//    },

    saveItemHelper: function(itemRef, item) {
      return $.Deferred(function(addDefer) {
        var type = item.vocModel.type;
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
        var refStore = RM.$db.objectStore(REF_STORE.name);
        RM.put(itemRef, refStore).done(function() {            
          RM.addItems([item], type).done(function() {
            addDefer.resolve();
            RM.sync();
          }).fail(function() {
            addDefer.reject();
            debugger;
//            RM.$db.objectStore("ref")["delete"](now);
          });
        }).fail(function() {
          addDefer.reject();
          debugger;
        });
        
//        RM.$db.transaction(REF_STORE.name, 1).promise().done(function(transaction) {
//          debugger;
//        }).fail(function() {
//          debugger;
//        }).progress(function(transaction) {
//          var refStore = transaction.objectStore(REF_STORE.name);
//          refStore['delete'](itemRef._id).done(function() {
//            debugger;
//          }).fail(function() {
//            debugger;            
//          });
//          
//          RM.put(itemRef, refStore).done(function() {     
//            RM.addItems([item], type).done(function() {
//              addDefer.resolve();            
//              RM.sync();
//            }).fail(function() {
//              addDefer.reject();
//              debugger;
//            });
//          }).fail(function() {
//            addDefer.reject();
//            debugger;
//          });
//        });
      }).promise();
    },

    deleteItem: function(uri) {
      G.log(RM.TAG, 'db', 'deleting item', uri);
//      var type = U.getClassName(item._uri);
//      var name = U.getClassName(type);
      var type = item._uri || item.vocModel.type;
      var trans = RM.db.transaction([type], 1);
      var store = trans.objectStore(type);
      var request = store["delete"](uri);
    
      request.onsuccess = function(e) {
        G.log(RM.TAG, 'db', 'delete item onsuccess');
      };
    
      request.onerror = function(e) {
        G.log(RM.TAG, ['error', 'db'], "Error Deleting: ", e);
      };
    },
    
    buildOrQuery: function(orClause, vocModel, indexNames) {
      orClause = orClause.split('||');
      indexNames = indexNames || RM.getIndexNames(vocModel);
      
      var query;
      for (var i = 0; i < orClause.length; i++) {
        var part = orClause[i],
            pair = _.map(part.split('='), decodeURIComponent);
        
        if (pair.length != 2)
          return null;
        
        var name = pair[0], 
            val = pair[1], 
            subQuery;
        
        if (name === '$or') { // TODO: parse $and inside $or
          subQuery = RM.buildOrQuery(val, vocModel, indexNames);
        }
        else if (name === '$and') {
          subQuery = RM.buildSubQuery(name, val, vocModel, indexNames);
        }
        else if (name.startsWith('$')){
          debugger; // not supported yet...but what haven't be supported?
        }
        else {
          if (!hasIndex(indexNames, name))
            return null;
            
          subQuery = RM.buildSubQuery(name, val, vocModel, indexNames);
        }
        
        if (!subQuery)
          return null;
        
        query = query ? query.or(subQuery) : subQuery;
      }
      
      return query;
    },
    
    operatorMap: {
      '=': 'eq',
      '==': 'eq',
      '!': 'neq',
      '!=': 'neq',
      '<': 'lt',
      '>': 'gt',
      '>=': 'gteq',
      '<=': 'lteq',
      'IN:': 'oneof'
    },
    

    /**
     * @param val can be the value or a combination of operator and value, e.g. ">=7"
     */
    buildSubQuery: function(name, val, vocModel, indexNames) {
      var clause = U.parseAPIClause(name, val);
      if (!clause)
        return null;
      
      switch (name) {
      case '$or':
      case '$and':
        var query, qOp = name.slice(1);
        var apiQuery = U.parseAPIQuery(val, U.whereParams[name]);
        if (!apiQuery)
          return null;
        
        _.each(apiQuery, function(param) {
          var subq = RM.buildSubQuery(param.name, param.value, vocModel, indexNames);
          query = query ? query[qOp](subq) : subq;
        });
        
        return query;
      case '$in':
        var commaIdx = val.indexOf(',');
        name = val.slice(0, commaIdx);
        if (!hasIndex(indexNames, name))
          return null;
          
        val = val.slice(commaIdx + 1).split(',');
        return RM.Index(name).oneof.apply(null, val);
      case '$like':
        var commaIdx = val.indexOf(',');
        name = val.slice(0, commaIdx);
        if (!hasIndex(indexNames, name))
          return null;
        
        val = val.slice(commaIdx + 1);
        return RM.Index(name).betweeq(val, val + '\uffff');
      }
      
      
      var op = RM.operatorMap[clause.op];      
      var props = vocModel.properties;
      val = clause.value;
      var prop = props[name];
      if (prop && U.isResourceProp(prop) && val === '_me') {
        if (G.currentUser.guest)
          Events.trigger('req-login');
        else
          val = G.currentUser._uri;
      }

      val = U.getTypedValue(vocModel, name, val);
      return RM.Index(name)[op](val); // Index(name)[op].apply(this, op === 'oneof' ? val.split(',') : [val]);
    },
    
    buildDBQuery: function(data, filter) {
      if (U.isModel(data))
        return false;
      
      var query, orderBy, asc, 
          defOp = 'eq',
          collection = data,
          vocModel = collection.vocModel,
          meta = vocModel.properties,
          params = collection.params,
          filter = filter || U.getQueryParams(collection),
          orClause = params && params.$or;
      
      var indexNames = RM.getIndexNames(vocModel);
      if (params) {
        orderBy = params.$orderBy;
        asc = U.isTrue(params.$asc);
      }
      
      if (orderBy)
        orderBy = [meta[orderBy]];
      else {
        var ordered = U.getPropertiesWith(meta, "sortAscending");
        if (ordered.length) {
          orderBy = [];
          for (var p in ordered) {
            orderBy.push(ordered[p]);
          }
        }
      }
      
      if (!orderBy && !_.size(filter) && !orClause)
        return false;

      var neededIndices = _.filter(_.union(_.keys(filter), _.pluck(orderBy, 'shortName')), function(p) {return /^[a-zA-Z]+/.test(p)});
      if (!_.all(neededIndices, function(name) {return hasIndex(indexNames, name);}))
        return false;
//      if (orderBy && U.isCloneOf(orderBy, 'Distance.distance') && _.any(orderBy, function(p) {return !hasIndex(p.shortName)}))
//        return false;
//      
//      if (!_.all(_.keys(filter), function(name) {return hasIndex(indexNames, name);}))
//        return false;

      if (orClause) {
        orClause = RM.buildOrQuery(orClause, vocModel, indexNames);
        if (!orClause)
          return false; // couldn't parse it
        else {
          query = orClause;
          delete filter.$or;
        }
      }
      
      var positionProps = U.getPositionProps(vocModel);
      var latLonQuery, lat, lon, latProp, lonProp;
      if (_.size(positionProps) && _.size(_.pick(filter, _.values(positionProps)))) {
        var radius = positionProps.radius && filter[positionProps.radius];
        radius = isNaN(radius) ? G.defaults.radius : parseFloat(radius); // km
          
        latProp = positionProps.latitude, 
        lonProp = positionProps.longitude;
        lat = filter[latProp];
        lon = filter[lonProp];
        
        if (/^-?\d+/.test(lat)) {
          var latRadius = radius / 110; // 1 deg latitude is roughly 110 km 
          lat = parseFloat(lat);
          latLonQuery = RM.Index(latProp).betweeq(lat - latRadius, lat + latRadius);
        }
        if (/^-?\d+/.test(lon)) {
          var lonRadius = radius / 85; // 1 deg longitude is roughly 85km at latitude 40 deg, otherwise this is very inaccurate  
          lon = parseFloat(lon);          
          latLonQuery = RM.Index(lonProp).betweeq(lon - lonRadius, lon + lonRadius);
        }
        
        delete filter[latProp]; 
        delete filter[lonProp];
      }
      
      for (var name in filter) {
//        var name = modelParams[i];
        var subQuery = RM.buildSubQuery(name, filter[name], vocModel, indexNames);
        if (!subQuery)
          return false;
//        subQuery.setPrimaryKey('_uri');
        query = query ? query.and(subQuery) : subQuery;
      }
      
      if (latLonQuery)
        query = query ? query.and(latLonQuery) : latLonQuery;
      
      if (orderBy) {
        if (query) {  
          var distanceProp = positionProps.distance;
          for (var i = 0; i < orderBy.length; i++) {
            var oProp = orderBy[i].shortName;
            if (oProp === distanceProp) {
              query.sort(function(a, b) {
                debugger;
                // hackity hack - setting distance in sort function
                var ad = a[distanceProp] = U.distance([a[latProp], a[lonProp]], [lat, lon]);
                var bd = b[distanceProp] = U.distance([b[latProp], b[lonProp]], [lat, lon]);
                return ad - bd;
              });
            }
            else {
              query = query.sort(prepPropNameForDB(oProp), !asc);
            }
          }
        }
        else
          query = RM.Index(orderBy.shortName, asc ? IDBCursor.NEXT : IDBCursor.PREV).all();
        
//        }
//        else
//          query = query ? query.sort(orderBy, !asc) : RM.Index(orderBy, asc ? IDBCursor.NEXT : IDBCursor.PREV).all();
      }
      
      if (!_.isUndefined(params.$offset)) {
        query.setOffset(parseInt(params.$offset));
      }
      
      if (!_.isUndefined(params.$limit)) {
        query.setLimit(parseInt(params.$limit));
      }
      
      return query;
    },
    
    getItems: function(options) {
      var type = U.getTypeUri(options.key),
          uri = options.uri,
          isTemp = uri && U.isTempUri(uri),
          success = options.success,
          error = options.error,
          startAfter = options.startAfter,
          total = options.perPage,
          filter = options.filter,
          data = options.data,
          isCollection = U.isCollection(data),
          vocModel = data.vocModel;
      
      if (!RM.storeExists(type)) {
        // don't upgrade here, upgrade when we add items to the db
//        var dfd = $.Deferred();
//        var getModels = Voc.getModels(type).done(function() {
//          RM.runTask(function() {
//            
//          }).done(dfd.resolve).fail(dfd.reject);          
//        }).fail()
//        
//        return dfd.promise();
        return false;
      }

      function queryWithoutIndex() {
        return $.Deferred(function(defer) {
          G.log(RM.TAG, "db", 'Starting getItems Transaction, query with valueTester');
          var store = RM.$db.objectStore(type, 0),
              valueTester = data.belongsInCollection,
              results = [],
              params = data.params,
              orderBy = params.$orderBy,
              asc = params.$asc,
              limit = params.$limit,
              direction = U.isTrue(asc) ? IDBCursor.NEXT : IDBCursor.PREV,
              iterationPromise;
          
          var filterResults = function(item) {
            if (limit) {
              if (results.length == limit)
                return defer.resolve(results);
              else if (results.length > limit)
                return;
            }
            
            var val = parseFromDB(item.value);
            if (!valueTester || valueTester(val))
              results.push(val);
          };

              
          if (startAfter)
            iterationPromise = store.each(filterResults, IDBKeyRange.lowerBound(startAfter, true), direction);
          else
            iterationPromise = store.each(filterResults, null, direction);
          
          iterationPromise.always(function() {
            G.log(RM.TAG, "db", 'Finished getItems Transaction, got {0} itmes'.format(results.length));
            defer.resolve(results);
          });
        }).promise();
      }

      var queryWithIndex = function() {
        var qDefer = this; // we're inside a $.Deferred() as this function only gets run via RM.runTask();        
        var results = [];
//        if (isTemp) {
//          RM.$db.objectStore(REF_STORE.name, 0).index(prepPropNameForDB('_tempUri')).get(uri).done(function(result) {
//            debugger;
//            qDefer.resolve(result);
//          RM.Index('_tempUri').eq(uri).get(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
//            if (results.length) {
//              var item = results[0];
//              var realUri = item._uri;
//              if (realUri) {
//                RM.$db.objectStore(type, 0).get(realUri).done(function(realItem) {
//                  if (realItem)
//                    intDefer.resolve(realItem);
//                  else
//                    intDefer.resolve(item);
//                }).fail(intDefer.reject);
//                
//                return;
//              }
//            }
//            
//            RM.$db.objectStore(type, 0).get(uri).done(intDefer.resolve).fail(intDefer.reject);
//          }).fail(function() {
//            debugger;
//            intDefer.reject();
//          })
//          
//          return;// intDefer;
//        }
        
        var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
        if (uri) {
          store.get(uri).always(function(result) {
            if (result)
              qDefer.resolve(parse(result));
            else {
              if (!isTemp) {
                qDefer.resolve();
                return;
              }
              
              RM.Index('_tempUri').eq(uri).getAll(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
                if (results.length) {
                  uri = parse(results[0])._uri;
                  store.get(uri).always(function(result) {
                    if (result)
                      qDefer.resolve(parse(result));
                    else
                      qDefer.resolve();
                  });
                }
                else
                  qDefer.resolve();                    
              }).fail(function() {
                debugger;
                qDefer.resolve();
              });
            }
          });
//          if (isTemp) {
//            RM.$db.objectStore(REF_STORE.name, 0).index(prepPropNameForDB('_tempUri')).get(uri).done(function(result) {
//              
//            });
//          }
          
          return;
        }

        var query = RM.buildDBQuery(data, filter);
        if (query) {
          G.log(RM.TAG, "db", 'Starting getItems Transaction, query via index(es)');
          query.getAll(store).done(function(results) {
            qDefer.resolve(parse(results));
          }).fail(function() {
            G.log(RM.TAG, "db", 'couldn\'t query via index(es), time for plan B');
            queryWithoutIndex().done(qDefer.resolve).fail(qDefer.reject);
          });
          
//          return intDefer.promise();
        }
        else {
          queryWithoutIndex().done(qDefer.resolve).fail(qDefer.reject);
//          return queryWithoutIndex().promise();
        }
      }
      
      var taskOptions = {name: 'Get Items: ' + (data.getUrl || data.url)()};
      if (!isCollection)
        return RM.runTask(queryWithIndex, taskOptions);
      
      filter = filter || U.getQueryParams(data);
      var props = vocModel.properties;
      var temps = {};
      for (var key in filter) {
        var val = filter[key];
        if (U.isResourceProp(props[key]) && U.isTempUri(val)) {
          temps[key] = val;
        }
      }
      
      if (!_.size(temps))
        return RM.runTask(queryWithIndex, taskOptions);
      
      return RM.runTask(function() {
        var defer = this;        
        RM.Index('_tempUri').oneof(_.values(temps)).getAll(RM.$db.objectStore(REF_STORE.name, 0)).done(function(results) {
          if (results.length)
            defer.resolve(parse(results));
          else
            defer.reject();
        }).fail(function() {
          debugger;
          defer.reject();
        });
        
        defer.done(function(results) {
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
        }).always(function() {
//          debugger;
          RM.runTask(queryWithIndex, options);
        });

      }, taskOptions);
    },

    upgradeDB: function(options) {
      return RM.runTask(function() {
        if (RM.db && options) {
          var toMake = options.toMake;
          if (toMake && toMake.length) {
            toMake = _.filter(toMake, function(m) {
              return !RM.storeExists(m);
            });
          }
        }
        
        RM.openDB(options).done(this.resolve).fail(this.reject);
      }, {name: options && options.msg || "upgradeDB", sequential: true});      
    },
    
    restartDB: function() {
      return RM.runTask(function() {
        RM.openDB().done(this.resolve).fail(this.reject);
      }, {name: "restartDB", sequential: true});
    }

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  Events.on('modelsChanged', function(changedTypes) {
    var updatePromise = RM.updateDB(changedTypes);
//    if (options) {
//      options.success && updatePromise.done(options.success);
//      options.error && updatePromise.fail(options.error);
//    }
  });

  Events.on('updatedResources', function(resources) {
    setTimeout(function() {
      RM.addItems(resources);
    }, 100);
  });

  Events.on('userChanged', function() {
    RM.databaseCompromised = true;
  });

  Events.on('preparingToPublish', function(app) {
    var appUri = app.getUri();
    var commonTypes = G.commonTypes;
    var wClType = commonTypes.WebClass;
    var designerPkg = G.sqlUrl + '/www.hudsonfog.com/voc/system/designer/';
    var dfd = $.Deferred();
    dfd.promise().done(function() {
      Events.trigger('goodToPublish', app);
    }).fail(function(errors) {
      Events.trigger('cannotPublish', errors);      
    });
    
    RM.Index('parentFolder').eq(appUri).getAll(RM.$db.objectStore(wClType, 0)).done(function(webCls) {
      if (!webCls) {
        dfd.resolve();
        return;
      }
      
      webCls = parse(webCls);
      var webClUris = _.pluck(webCls, '_uri');
      // find all classes 
      var refStore = RM.$db.objectStore(REF_STORE.name);
      var isDesignObj = RM.Index('_uri').betweeq(designerPkg, designerPkg + '\uffff');
      var isBroken = RM.Index('_problematic').eq(1);
      isDesignObj.and(isBroken).getAll(refStore).done(function(results) {
        if (!results.length) {
          dfd.resolve();
          return;
        }
        
        results = parse(results);
        var badBoys = [];
        _.each(results, function(designerObj) {
          designerObj._error  = designerObj._error || {code: 400, details: 'Problems here. Help us out?'};
          if (webClUris.indexOf(designerObj._uri) >= 0 || webClUris.indexOf(designerObj.domain) >= 0) {
            badBoys.push(designerObj);
          }
        });
        
        if (!badBoys.length)
          dfd.resolve();
        else
          dfd.reject(badBoys);
      }).fail(function() {
        dfd.resolve();
      });
    }).fail(function(err, e){
      debugger;
      dfd.resolve();
    });
  });
  
  Events.on('VERSION:Models', function(init) {
    var dbOpen = RM.db;
    var settings = {sequential: true, preventPileup: true};
    RM.runTask(function() { // take over the queue
//      debugger;
      RM.taskQueue = new TaskQueue("DB");
      RM.runTask(function() {
        var defer = this;
        var dbPromise = RM.deleteDatabase().done(function(crap, event) {
          G.databaseCompromised = false;
          G.log(RM.TAG, 'db', 'deleted database, opening up a fresh one');
          if (dbOpen)
            RM.openDB().done(defer.resolve).fail(defer.reject);
          else
            defer.resolve();
        }).fail(function() {
          debugger;
          defer.reject();
        });
      }, settings);
    }, settings);
  });
  
  return (Lablz.ResourceManager = ResourceManager);
});