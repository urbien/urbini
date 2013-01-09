define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!error', 
  'cache!events', 
  'cache!models/Resource', 
  'cache!collections/ResourceList',
  'cache!vocManager',
  'cache!indexedDBShim',
  'cache!queryIndexedDB'
], function(G, $, __jqm__, _, Backbone, U, Error, Events, Resource, ResourceList, Voc, __idbShim__, idbq) {
  var Index = idbq.Index;
  var tsProp = 'davGetLastModified';
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var isUpdate, filter, isFilter, start, end, qMap, numRequested, stale, dbSuccess, dbError, save, fetchFromServer, numNow, shortPage, 
    defaultSuccess = options.success, 
    defaultError = options.error,
    synchronous = options.sync,
    now = G.currentServerTime(),
    isCollection = model instanceof Backbone.Collection,
    collection = isCollection ? model : model.collection,
    vocModel = isCollection ? model.model : model.constructor;

    /**
     *  Save new data to DB, and update models currently in memory
     *  @params results: data to save
     */
    save = function(results) {
      if (!_.size(results))
        return false;
      
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // An alternative is to override Backbone.Collection.reset() method and do some magic there.
      
      var toAdd = [];
      var skipped = [];
      var now = G.currentServerTime();
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        r._lastFetchedOn = now;
        var longUri = U.getLongUri(r._uri, {type: model.type, shortNameToModel: Voc.shortNameToModel});
        var saved = isCollection ? model.get(longUri) : model;
        var ts = saved && saved.get(tsProp) || 0;
        
        var newLastModified = r[tsProp];
        if (typeof newLastModified === "undefined") 
          newR = 0;
        
        if (!newLastModified || newLastModified > ts)
          toAdd.push(r);
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }
      
      var modified = [];
      if (toAdd.length) {
        for (var i = 0; i < toAdd.length; i++) {
          toAdd[i]._uri = U.getLongUri(toAdd[i]._uri, Voc);
          var existing = model.get(toAdd[i]._uri);
          if (existing) {
            existing.set(toAdd[i]);
            modified.push(toAdd[i]._uri);
          }
          else {
            if (isCollection)
              model.add(new vocModel(toAdd[i]));
            else
              model.set(toAdd[i]);
          }
        }
        
      }
      
      toAdd.length && RM.addItems(toAdd);    
      return toAdd;
    }
    
    /**
     * handle successful fetch from server
     */
    options.success = function(resp, status, xhr) {
      model.lastFetchOrigin = 'server';
      var code = xhr.status;
      var err = function() {
        G.log(RM.TAG, 'error', code, options.url);
        defaultError(resp && resp.error || {code: code}, status, xhr);            
      }
      
      if (isCollection)
        collection._lastFetchedOn = now;
      
      switch (code) {
        case 200:
          break;
        case 204:
          defaultSuccess(resp, status, xhr);
          return;
        case 304:
          var ms = isCollection ? collection.models.slice(start, end) : [model];
          _.each(ms, function(m) {
            m.set({'_lastFetchedOn': now}, {silent: true});
          });
          
          return;
        default:
          err();
          return;
      }
      
      if (resp && resp.error) {
        err();
        return;
      }
      
      data = resp.data;
      var modified;
//      if (isCollection) {
////        var offset1 = resp.metadata && resp.metadata.offset || 0;
//        modified = _.map(data, function(model) {return model._uri});
//      }
//      else {
//        modified = model.get('_uri');
//      }
      
      var saved = save(data);
      defaultSuccess(resp, status, xhr);
      if (saved && saved.length)
        Events.trigger('refresh', model, _.map(saved, function(s) {return s._uri}));
    }
    
    var fetchFromServer = function(timeout, lastFetchedOn) {
      if (lastFetchedOn && isUpdate) // && !shortPage)
        RM.setLastFetched(lastFetchedOn, options);

      var f = function() {
        if (options.sync || !G.hasWebWorkers)
          return RM.defaultSync(method, model, options)
        
        var xhrWorker = new Worker(G.xhrWorker);
        xhrWorker.onmessage = function(event) {
          G.log(Voc.TAG, 'xhr', 'got resources', options.url);
          var xhr = event.data;
          options.success(xhr.data, 'success', xhr);
        };
        
        xhrWorker.onerror = function(err) {
          console.log(JSON.stringify(err));
        };
        
        if (!options.url)
          debugger;
        
        xhrWorker.postMessage({type: 'JSON', url: options.url, method: 'GET', headers: options.headers});
      };
      
      if (timeout)
        setTimeout(f, timeout);
      else
        f();
    }

    // provide data from indexedDB instead of a network call
    dbSuccess = function(results) {
      if (!results.length)
        return fetchFromServer();
    
      options.sync = false;
      // simulate a normal async network call
      model.lastFetchOrigin = 'db';
      G.log(RM.TAG, 'db', "got resources from db: " + vocModel.type);
      var resp = {data: results, metadata: {offset: start}};
      var numBefore = isCollection && collection.models.length;
      defaultSuccess(resp, 'success', null); // add to / update collection

      if (!isCollection) {
        isUpdate = true;
//        var timestamp = results[0]._lastFetchedOn;
        var lf = RM.getLastFetched(results, now);
        if (RM.isStale(lf, now))
          fetchFromServer(100, lf);
        
        return;
      }
      
      var numAfter = collection.models.length;
      if (!isUpdate && numAfter === numBefore) // db results are useless
        return fetchFromServer(100);
      
//      var stalest = _.reduce(results, function(memo, next)  {
//        return Math.min(memo, next._lastFetchedOn);
//      }, Infinity);
      
      var lf = RM.getLastFetched(results, now);
      if (RM.isStale(lf, now))
        return fetchFromServer(100, lf);
    }
  
    dbError = function(e) {
      if (e) G.log(RM.TAG, 'error', "Error fetching data from db: " + e);
      fetchFromServer();
    }

    if (isCollection) {
      lastFetchedOn = model._lastFetchedOn;
      
//      qMap = U.getQueryParams(options.url);
      qMap = model.queryMap;
      filter = U.getQueryParams(model);
      isFilter = !!filter;
      if (isCollection && options.startAfter) {
        start = qMap.$offset; // not a jQuery thing
        start = start && parseInt(start);
      }

      numRequested = qMap.$limit ? parseInt(qMap.$limit) : model.perPage;
      start = start || 0;
      end = start + numRequested;
      numNow = collection.models.length;
      shortPage = numNow && numNow < collection.perPage;
      isUpdate = numNow > end || shortPage;
      if (isUpdate) {
//        if (shortPage && RM.isStale(collection._lastFetchedOn, now))
//          return fetchFromServer(100); // if shortPage, don't set If-Modified-Since header
        
//        var stalest = _.reduce(collection.models, function(memo, next)  {
//          var date = next.get('_lastFetchedOn');
//          return Math.min(memo, date || 0);
//        }, Infinity);
        
        var lf = RM.getLastFetched(collection.models, now);
        if (RM.isStale(lf, now))
          return fetchFromServer(100, lf); // shortPage ? null : lf); // if shortPage, don't set If-Modified-Since header

//        var currentEnd = Math.min(end, numNow);
//        for (var i = start; i < currentEnd; i++) {
//          var m = collection.models[i];
//          var date = m.get('_lastFetchedOn');
//          if (date && (stale = RM.isStale(RM.getLastFetched(date, now))))
//            break;
//        }
      }
    }
    else {
      var ts = model.get('_lastFetchedOn');
      isUpdate = typeof ts !== 'undefined';
      if (RM.isStale(ts, now))
        return fetchFromServer(100, ts);
    }

    var key = this.getKey && this.getKey();
    if (!key) {
      if (G.online)
        fetchFromServer();
      
      return;
    }
    
    var dbReqOptions = {key: key, success: dbSuccess, error: dbError, model: model};
    if (model instanceof Backbone.Collection) {
      dbReqOptions.startAfter = options.startAfter,
      dbReqOptions.perPage = model.perPage;
      dbReqOptions.filter = isFilter && filter;
    }
    else
      dbReqOptions.uri = key;

    var dbHasGoodies = RM.getItems(dbReqOptions);
    if (!dbHasGoodies) {
      if (G.online)
        fetchFromServer();
      else
        options.sync && options.error && options.error(model, {type: 'offline'}, options);
      
      return;
    }
  };
  
  Lablz.idbq = idbq;
  var ResourceManager = RM = {
    TAG: 'Storage',
    packages: {'Resource': Resource},
    defaultSync: function(method, model, options) {
      model.lastFetchOrigin = 'server';
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
      var req = Backbone.defaultSync(method, model, options);
//      req.fail(function(jqXHR, status) {
//        G.log(RM.TAG, 'sync', jqXHR, status);
//        return (err || Error.getDefaultErrorHandler()).apply(this, [model, {type: status}]);
//      });
      
      return req;
    },
  
    /**
     * is 3 minutes old
     */
    maxDataAge: 180000,
    
    isStale: function(ts, now) {
      return (now || G.currentServerTime()) - ts > RM.maxDataAge;
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
  
    tsProp: "davGetLastModified",
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
    tableExists: function(name) {
      var db = RM.db;
      var names = db && db.objectStoreNames;
      return names && names.contains(name);
    },
    onerror: function(e) {
      G.userChanged = true;
//      G.recordCheckpoint("closing db due to error");
      RM.db && RM.db.close();
      RM.openDB();
      G.log(RM.TAG, ['error', 'db'], "db error: " + JSON.stringify(e));
    },
    
    onabort: function(e) {
      G.log(RM.TAG, ['error', 'db'], "db abort: " + e);
    },
    
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
    
    defaultOptions: {keyPath: '_uri'},
    getUpgradeFunction: function(state, callback) {
      return function(e) {
        G.log(RM.TAG, 'db', 'db upgrade transaction onsuccess');
        if (G.userChanged) {
          G.userChanged = false;
          RM.updateStores(true);
        }
        else if (state.modelsChanged) {
          state.modelsChanged = false;
          RM.updateStores();
        }
        
        RM.db = e.target.result;
        e.target.transaction.oncomplete = function() {
  //        G.recordCheckpoint("done upgrading db");
          G.log(RM.TAG, 'db', 'db upgrade transaction.oncomplete');
          if (callback)
            callback();
        };
      }
    },
    
    DB_NAME: "lablz",
    openDB: function(success, error) {
      var state = {
        modelsChanged: false
      };
      
      G.log(RM.TAG, 'db', "opening db");
      var request = indexedDB.open(RM.DB_NAME);
    
      request.onblocked = function(event) {
        alert("Please close all other tabs with this site open!");
      };
    
      request.onabort = RM.onabort;
    
      var onsuccess;
      var upgrade = RM.getUpgradeFunction(state, success);
      request.onsuccess = onsuccess = function(e) {
        G.log(RM.TAG, 'db', 'open db onsuccess');
        RM.db = e.target.result;
        var db = RM.db;
        db.onversionchange = function(event) {
          G.log(RM.TAG, 'db', 'closing db - onversionchange');
//          alert('version change');
          db.close();
//          window.location.reload();
          setTimeout(function() {alert("A new version of this page is ready. Please reload!");}, 5000);
        };    
     
        state.modelsChanged = !!Voc.changedModels.length || !!Voc.newModels.length;
        RM.VERSION = G.userChanged || state.modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
        if (db.version == RM.VERSION) {
          if (success)
            success();
          
//          G.recordCheckpoint("done prepping db");
          G.log(RM.TAG, 'db', "done prepping db");
          return;
        }
        
//          G.recordCheckpoint("upgrading db");
        G.log(RM.TAG, 'db', 'about to upgrade db');
        if (db.setVersion) {
          G.log(RM.TAG, 'db', 'in old setVersion. User changed: ' + G.userChanged + '. Changed models: ' + (Voc.changedModels.join(',') || 'none') + ', new models: ' + (Voc.newModels.join(',') || 'none')); // deprecated but needed for Chrome
          
          // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
          var req = db.setVersion(RM.VERSION);
          // onsuccess is the only place we can create Object Stores
          req.onerror = RM.onerror;
          req.onblocked = function(e) {
            RM.deleteDatabase(function() {
              RM.openDB.apply(options, success, error);
            });
          };
          
          req.onsuccess = upgrade;
        }
        else {
          G.log(RM.TAG, 'db', 'upgrading db (via onupgradeneeded, using FF are ya?)');
//          G.recordCheckpoint("upgrading db");
          db.close();
          var subReq = indexedDB.open(RM.DB_NAME, RM.VERSION);
          subReq.onsuccess = request.onsuccess;
          subReq.onerror = request.onerror;
          subReq.onupgradeneeded = request.onupgradeneeded;
        }
      };
      
      request.onupgradeneeded = upgrade;
//          function(e) {
//        G.recordCheckpoint("db, onupgradeneeded callback");
//        G.log(RM.TAG, 'db', 'onupgradeneeded callback');
//        RM.db = e.target.result;
//        if (G.userChanged) {
//          G.log(RM.TAG, 'db', "clearing db");
//          RM.updateStores(reset) && (G.userChanged = false);
//        }
//        else if (modelsChanged) {
//          G.log(RM.TAG, 'db', "updating db stores");
//          RM.updateStores();
//        }
//        
//        e.target.transaction.oncomplete = function() {
////          G.recordCheckpoint("done upgrading db");
//          G.log(RM.TAG, 'db', "onupgradeneeded transaction.oncomplete");
//          if (success)
//            success();
//        };
//      };      
      
      request.onerror = function(e) {
        G.log(RM.TAG, 'db', "error opening db");
        if (error)
          error(e);
        
        RM.onerror(e);
      };  
    },
    
    updateStores: function(reset) {
      var db = RM.db;
      var toDel = _.union(Voc.changedModels, Voc.newModels);
      var models = _.union(toDel, _.map(G.linkedModels, function(m){return m.type}));
      if (reset)
        models = _.union(models, G.models, G.linkedModels);

      models = _.filter(models, function(m) {
        if (Lablz.Router)
          if (Lablz.Router.currentModel)
            if (Lablz.Router.currentModel.type == m)
              return true;
            
        return _.contains(G.classUsage, m);
      });

      toDel = _.map(toDel, U.getClassName);
      models = _.map(models, U.getClassName);
//      models = _.map(models, function(uri) {
//        var sIdx = uri.lastIndexOf("/");
//        return sIdx == -1 ? uri : uri.slice(sIdx + 1);
//      });
      
      Voc.changedModels.length = 0;
      Voc.newModels.length = 0;
      if (!models.length)
        return;
      
      var deleted = [];
      var created = [];
      for (var i = 0; i < models.length; i++) {
        var name = models[i];
        if (Voc.shortNameToEnum[name])
          continue;
        
        if (RM.tableExists(name)) {
          if (reset || _.contains(toDel, name)) {
            try {
              G.log(RM.TAG, 'db', 'deleting object store: ' + name);
              db.deleteObjectStore(name);
              G.log(RM.TAG, 'db', 'deleted object store: ' + name);
              deleted.push(name);
            } catch (err) {
              debugger;
              G.log(RM.TAG, ['error', 'db'], '2. failed to delete table ' + name + ': ' + err);
              return;
            }
          }          
          else
            continue;
        }
        

        try {
          G.log(RM.TAG, 'db', 'creating object store: ' + name);
          var store = db.createObjectStore(name, RM.defaultOptions);
          G.log(RM.TAG, 'db', 'created object store: ' + name);
          var m = Voc.shortNameToModel[name];
          if (m) {
            var indices = [];
            var vc = m.viewCols;
            vc = vc ? vc.split(',') : [];
            _.each(vc, function(pName) {
              pName = pName.trim();
              G.log(RM.TAG, 'db', 'creating index', pName, 'for store', name);
              store.createIndex(pName, pName, {unique: false});              
              G.log(RM.TAG, 'db', 'created index', pName, 'for store', name);
              indices.push(pName);
            });

            // wrong, this is for backlink resources, not the class itself
//            _.each(m.properties, function(prop, pName) {
//              if (_.has(prop, 'sortAscending') && !_.contains(indices, pName)) {
//                store.createIndex(pName, pName, {unique: false});
//              }
//            });
          }
          
          created.push(name);
        } catch (err) {
          debugger;
          G.log(RM.TAG, ['error', 'db'], '2. failed to create table ' + name + ': ' + err);
          return;
        }
        
      }
      
//      deleted.length && G.log(RM.TAG, 'db', '2. deleted tables: ' + deleted.join(","));
//      created.length && G.log(RM.TAG, 'db', '2. created tables: ' + created.join(","));
    },
    
    /**
     * will write to the database asynchronously
     */
    addItems: function(items, classUri) {
      if (!items || !items.length)
        return;
      
      var db = RM.db;
      if (!db)
        return;
      
      var className, vocModel;
      if (classUri) {
        vocModel = Voc.typeToModel[classUri];
      }
      else {
        var first = items[0];
        if (first instanceof Backbone.Model)
          vocModel = first.constructor;
        else {
          className = U.getClassName(first._uri);
          vocModel = Voc.shortNameToModel[className];
        }
      }
      
      className = vocModel.shortName;
      classUri = vocModel.type;
      if (!RM.tableExists(className)) {
        G.log(RM.TAG, 'db', 'closing db for upgrade');
        db.close();
        G.log(this.TAG, "db", "2. newModel: " + className);
        U.pushUniq(Voc.newModels, classUri);
        RM.openDB(function() {
          setTimeout(function() {RM.addItems(items, classUri)}, 100);
        });
        
        return;
      }
      
      G.log(RM.TAG, 'db', 'starting readwrite transaction for store', className);
//      G.recordCheckpoint('starting readwrite transaction for store: ' + className);
      var trans;
      try {
        trans = db.transaction([className], IDBTransaction.READ_WRITE);
      } catch (err) {
        debugger;
        G.log(RM.TAG, ['error', 'db'], 'failed to start readwrite transaction for store', className, err);
        return false;
      }

      trans.oncomplete = function(e) {
        G.log(RM.TAG, 'db', 'finished readwrite transaction for store', className);
//        G.recordCheckpoint('finished readwrite transaction for store: ' + className);
      };
      
      var store = trans.objectStore(className);
      _.each(items, function(item) {
        var request = store.put(item instanceof Backbone.Model ? item.toJSON() : item);
        request.onsuccess = function(e) {
          G.log(RM.TAG, 'db', "Added item to db", item._uri);
        };
      
        request.onerror = function(e) {
          G.log(RM.TAG, ['error', 'db'], "Error adding item to db: ", e);
        };
      });
    }.async(100),
    
    addItem: function(item, classUri) {
      RM.addItems([item instanceof Backbone.Model ? item.toJSON() : item], classUri || item.constructor.type);
    },
    
    deleteItem: function(uri) {
      G.log(RM.TAG, 'db', 'deleting item', uri);
      var type = U.getClassName(item._uri);
      var name = U.getClassName(type);
      var db = RM.db;
      var trans = db.transaction([type], IDBTransaction.READ_WRITE);
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

    buildDBQuery: function(store, model, filter) {
      if (model instanceof Backbone.Model)
        return false;
      
      var query, orderBy, defOp = 'eq',
          qMap = model.queryMap,
          filter = filter || U.getQueryParams(model);
      
      if (qMap) {
        orderBy = qMap.$orderBy;
        asc = U.isTrue(qMap.$asc);
      }
      
      if (orderBy && !store.indexNames.contains(orderBy))
        return false;

      if (!_.all(_.keys(filter), function(name) {return _.contains(store.indexNames, name)}))
        return false;
      
      if (!orderBy && !_.size(filter))
        return false;
      
      for (var name in filter) {
//        var name = modelParams[i];
        var opVal = RM.parseOperatorAndValue(filter[name]);
        if (opVal.length != 2)
          return false;
        
        var op = RM.operatorMap[opVal[0]];
        var val = opVal[1];
        val = U.getTypedValue(model, name, val);
        var subQuery = Index(name)[op](val);// Index(name)[op].apply(this, op === 'oneof' ? val.split(',') : [val]);
        query = query ? query.and(subQuery) : subQuery;
      }
      
      if (orderBy) {
//        var bound = startAfter ? (orderBy == '_uri' ? startAfter : model.get(startAfter).get(orderBy)) : null;
        query = query ? query.sort(orderBy, !asc) : Index(orderBy, asc ? IDBCursor.NEXT : IDBCursor.PREV).all();
      }
      
      if (!_.isUndefined(qMap.$offset)) {
        query.setOffset(qMap.$offset);
      }
      
      if (!_.isUndefined(qMap.$limit)) {
        query.setLimit(qMap.$limit);
      }
      
      return query;
    },
    
    buildValueTesterFunction: function(params, model) {
      var rules = [];
      _.each(params, function(value, name) {
        var opVal = RM.parseOperatorAndValue(value);
        if (opVal.length != 2)
          return null;
        
        var op = opVal[0];
        var bound = U.getTypedValue(model, name, opVal[1]);
        rules.push(function(val) {
//          try {
//            return eval(val[name] + op + bound);
//          } catch (err){
//            return false;
//          }
          
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
      // var todos = document.getElementById("todoItems");
      // todos.innerHTML = "";
      var type = U.getClassName(options.key);
      var uri = options.uri;
      var success = options.success;
      var error = options.error;
      var startAfter = options.startAfter;
      var total = options.perPage;
      var filter = options.filter;
      var model = options.model;
//      var vocModel = model instanceof Backbone.Collection ? model.model : model.constructor;
    
      var name = U.getClassName(type);
      var db = RM.db;
      if (!RM.tableExists(name))
        return false;
      
      G.log(RM.TAG, 'db', 'starting readonly transaction for store', name);
      var trans;
      try {
        trans = db.transaction([name], IDBTransaction.READ_ONLY);
      } catch (err) {
        debugger;
        G.log(RM.TAG, ['error', 'db'], 'failed to start readonly transaction for store', name, err);
        return false;
      }
      
      trans.oncomplete = function(e) {
        G.log(RM.TAG, 'db', 'finished readonly transaction for store', name);
      };
      
      var store = trans.objectStore(name);
//      var lowerBound;
//      if (startAfter)
//        lowerBound = IDBKeyRange.lowerBound(startAfter, true);
      
      var query, dbReq, cursorRequest, valueTester, results = [];
      if (!uri) {
        query = RM.buildDBQuery(store, model, filter);
        if (!query)
          valueTester = RM.buildValueTesterFunction(filter, model);
      }
      
      if (query) {
        dbReq = query.getAll(store);
      }
      else {
        if (uri)
          dbReq = store.get(uri);
        else
          dbReq = startAfter ? store.openCursor(IDBKeyRange.lowerBound(startAfter, true)) : store.openCursor();
      }
      
      dbReq.onsuccess = function(e) {
//        G.log(RM.TAG, 'db', 'read via cursor onsuccess');
        var result = e.target.result;
        if (result) {
          if (query)
            return success(result);
          else if (uri)
            return success([result]);
          
          var val = result.value;
          if (valueTester && !valueTester(val)) {
            result['continue']();
            return;            
          }
          
          results.push(val);
          if (!total || results.length < total) {
            result['continue']();
            return;
          }
        }
        
        return success && success(results);
      };
    
      dbReq.onerror = function (e) {
        G.log(RM.TAG, 'db', 'read via cursor onerror', e);
        error && error(e);
//        RM.onerror(e);
      }
            
      return true;
    },

    updateTables: function(success, error) {
    //  MBI.checkSysInfo();
    //  MBI.loadAndUpdateModels();
      RM.dbPaused = true;
      if (RM.db) {
        G.log(RM.TAG, 'db', 'closing db');
        RM.db.close();
      }
      
      var s = success;
      success = function() {
        RM.dbPaused = false;
        if (s) s();
      }
      
      $(document).ready(function(){RM.openDB(success, error)});
    }

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  };
  
  
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