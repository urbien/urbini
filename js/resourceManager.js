define([
  'globals',
  'utils', 
  'events', 
  'taskQueue',
  'vocManager',
  'queryIndexedDB'
], function(G, U, Events, TaskQueue, Voc, idbq) {
  var useWebSQL = typeof window.webkitIndexedDB !== 'undefined' && window.shimIndexedDB;
  useWebSQL && window.shimIndexedDB.__useShim();
//  var useWebSQL = typeof window.webkitIndexedDB === 'undefined' && window.shimIndexedDB;
//  useWebSQL && window.shimIndexedDB.__useShim();
//  var useWebSQL = true;
//  window.shimIndexedDB.__useShim();
//  var IDBCursor = $.indexedDB.IDBCursor;
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
    
    var isUpdate, filter, isFilter, start, end, qMap, numRequested, stale, save, fetchFromServer, numNow, shortPage, collection, resource,      
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
          return RM.defaultSync(method, data, options);
        
        G.ajax({type: 'JSON', url: options.url, method: 'GET', headers: options.headers})
          .done(function(data, status, xhr) {
            debugger;
            options.success(data, status, xhr);
          }).fail(function(xhr, status, msg) {
            if (xhr.status === 304)
              return;
            
            debugger;
            G.log(RM.TAG, 'error', 'failed to get resources from url', options.url, msg);
            options.error(null, xhr, options);
          });        
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
      else if (start < numNow) {
        return; // no need to refetch from db, we already did
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
    
    defaultOptions: {keyPath: '_uri', autoIncrement: false},
    DB_NAME: "lablz",
    runTask: function() {
      return this.taskQueue.runTask.apply(this.taskManager, arguments);
    },
    taskQueue: new TaskQueue("DB"),
    
    /**
     * Check if we need to delete any stores. Creation of stores happens on demand, deletion happens when models change
     */
    updateDB: function() {
      return $.Deferred(function(defer) {
//        debugger;
        var toKill = _.clone(Voc.changedModels);
        Voc.changedModels.length = 0;
//        Voc.newModels.length = 0;
        if (RM.db) {
          toKill = _.filter(toKill, function(m) {
            return RM.db.objectStoreNames.contains(m);
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
    
    /**
     * If you want to upgrade, pass in a version number, or a store name, or an array of store names to create
     */
    openDB: function(options) {
      if (G.userChanged) {
        G.log(RM.TAG, 'db', 'user changed, deleting database');
        var dbPromise = $.indexedDB(RM.DB_NAME).deleteDatabase().done(function(crap, event) {
          G.userChanged = false;
          G.log(RM.TAG, 'db', 'deleted database, opening up a fresh one');
          RM.openDB(options);
        }).fail(function(error, event) {
          RM.openDB(options).done(dbPromise.resolve).fail(dbPromise.reject); // try again?
          G.log(RM.TAG, 'db', 'failed to delete database');
        }).progress(function(db, event) {
          RM.upgradeDB(options).done(dbPromise.resolve).fail(dbPromise.reject);;
        });
        
        return dbPromise;
      }

      options = options || {};
      var version = options.version, toMake = options.toMake || [], toKill = options.toKill || [];
//      toKill = _.union(toKill, Voc.changedModels); // , Voc.newModels);
      var modelsChanged = function() {
        return !!(toKill.length || toMake.length);
      }
      
//      if (toKill && toKill.length)
//        debugger;
      
      if (!version) {
        if (RM.db) {
          var currentVersion = isNaN(RM.db.version) ? 0 : parseInt(RM.db.version);
          version = modelsChanged() ? currentVersion + 1 : currentVersion;
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
//          transaction.onupgradecomplete(function() {
//            debugger;
//            dbPromise.resolve();
//          });
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

//        if (toKill && toKill.length)
//          debugger;

        // Queue up upgrade
        RM.upgradeDB(_.extend(options, {version: version, msg: "upgrade to kill stores: " + toKill.join(",") + ", make stores: " + toMake.join()}));
        dbPromise.resolve();
      }).fail(function(error, event) {
        G.log(RM.TAG, ['db', 'error'], error, event);
        dbPromise.reject();
      }).progress(function(db, event) {
        switch (event.type) {
          case 'blocked':
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
      var extras = U.getPositionProps(vocModel);
      var cols = _.union(_.values(extras), _.map((vc + ',' + gc).split(','), function(c) {
        return c.trim().replace('DAV:displayname', 'davDisplayName')
      }));
      
      var props = vocModel.properties;
      cols = _.filter(cols, function(c) {
        var p = props[c];
        return p && !p.backLink;
      })
      
      return cols;
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
        if (G.typeToEnum[type] || G.typeToInline[type])
          continue;
        
        var vocModel = G.typeToModel[type];
        if (!vocModel) {
          G.log(RM.TAG, 'db', 'missing model for', type, 'not creating store');
          continue;
        }
        
        try {
          if (RM.db && RM.db.objectStoreNames.contains(type))
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
      
//      var updated = _.intersection(Voc.changedModels, _.union(toKill, toMake));
//      if (!updated.length)
//        return;
//      
//      debugger;
//      Voc.changedModels = _.difference(Voc.changedModels, updated);
//      var stillUnsaved = [], toSave = [];
//      for (var i = 0; i < Voc.unsavedModels.length; i++) {
//        var m = Voc.unsavedModels[i];
//        if (updated.indexOf(m.type) == -1)
//          stillUnsaved.push(m);
//        else
//          toSave.push(m);
//      }
//      
//      Voc.saveModelsToStorage(toSave);
//      Voc.unsavedModels = stillUnsaved;
    },
    
    addItems: function(items, classUri) {
      if (!items || !items.length)
        return;
      
      if (!RM.db) {
        var args = arguments;
        setTimeout(function() {RM.addItems.apply(RM, arguments)}, 1000);
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
        RM.upgradeDB({toMake: [classUri], msg: "Upgrade to make store: " + classUri}).done(function() {
          RM.addItems(items, classUri);
        });
        
        return;
      }
      
      RM.runTask(function() {
        return $.Deferred(function(defer) {
          var vocModel = G.typeToModel[classUri];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item = U.isModel(item) ? item.toJSON() : item;
            items[i] = U.flattenModelJson(item, vocModel);
          }
          
          G.log(RM.TAG, "db", 'Starting addItems Transaction');
          RM.$db.transaction(classUri, IDBTransaction.READ_WRITE).promise().done(function() {
            G.log(RM.TAG, "db", 'Transaction completed, all data inserted');
            defer.resolve();
          }).fail(function(err, e){
            defer.reject();
            G.log(RM.TAG, ['db', 'error'], 'Transaction NOT completed, data not inserted', err, e);
          }).progress(function(transaction) {
            var store = transaction.objectStore(classUri);
            for (var i = 0; i < items.length; i++) {
              store.put(items[i]);
            }
          });
        }).promise()
      }, {name: "Add Items"});
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
      var request = store["delete"](uri);
    
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
      if (orderBy && orderBy !== 'distance' && !_.contains(indexNames, orderBy))
        return false;
      
      if (!_.all(_.keys(filter), function(name) {return _.contains(indexNames, name);}))
        return false;

      var positionProps = U.getPositionProps(vocModel);
      var latLonQuery;
      if (_.size(positionProps)) {
        var radius = positionProps.radius && filter[positionProps.radius];
        radius = isNaN(radius) ? G.defaults.radius : parseFloat(radius); // km
          
        var latProp = positionProps.latitude, lonProp = positionProps.longitude;
        var lat = filter[latProp], lon = filter[lonProp];
        if (/^-?\d+/.test(lat)) {
          var latRadius = radius / 110; // 1 deg latitude is roughly 110 km 
          lat = parseFloat(lat);
          latLonQuery = Index(latProp).gteq(lat - latRadius).and(Index(latProp).lteq(lat + latRadius));
        }
        if (/^-?\d+/.test(lon)) {
          var lonRadius = radius / 85; // 1 deg longitude is roughly 85km at latitude 40 deg, otherwise this is very inaccurate  
          lon = parseFloat(lon);          
          latLonQuery = Index(lonProp).gteq(lon - lonRadius).and(Index(lonProp).lteq(lon + lonRadius));
        }
        
        delete filter[latProp]; 
        delete filter[lonProp];
      }
      
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
      
      if (latLonQuery)
        query = query.and(latLonQuery);
      
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
        var bound = opVal[1];
        rules.push(RM.makeTest(vocModel.properties[name], op, bound));
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
//        var store = $.indexedDB('lablz').objectStore(type, IDBTransaction.READ_ONLY);
        var results = [];
        var store = RM.$db.objectStore(type, IDBTransaction.READ_ONLY);
        if (uri)
          return store.get(uri).promise();

        var query = RM.buildDBQuery(store, data, filter);
        if (query) {
          G.log(RM.TAG, "db", 'Starting getItems Transaction, query via index(es)');
          var qDefer = $.Deferred();
          query.getAll(store).done(qDefer.resolve).fail(function() {
            G.log(RM.TAG, "db", 'couldn\'t query via index(es), time for plan B');
            queryWithoutIndex().promise().done(qDefer.resolve).fail(qDefer.reject);
          });
          
          return qDefer.promise();
        }
        else
          return queryWithoutIndex().promise();
      }, {name: "Get Items"});
    },

    upgradeDB: function(options) {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {
          if (RM.db && options) {
            var toMake = options.toMake;
            if (toMake && toMake.length) {
              toMake = _.filter(toMake, function(m) {
                return !RM.db.objectStoreNames.contains(m);
              });
            }
          }
          
          RM.openDB(options).done(defer.resolve).fail(defer.reject);
        }).promise();
      }, {name: options && options.msg || "upgradeDB", sequential: true});      
    },
    
    restartDB: function() {
      return RM.runTask(function() {
        return $.Deferred(function(defer) {
//          $(document).ready(function() {
            RM.openDB().done(defer.resolve).fail(defer.reject);
//          }); 
        }).promise();
      }, {name: "restartDB", sequential: true});
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