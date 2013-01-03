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
//  var MBI = null; // singleton instance
//  var Index = idbq.Index;
//  var MB = ModelsBase = function() {
//    if (MBI != null)
//      throw new Error("Can't instantiate more than one modelsBase module");
//    
//    this.initialize();
//  };
//  
//  MB.prototype = {};
//  MB.prototype.initialize = function() {
  Backbone.defaultSync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    var now = G.currentServerTime();
    var isCol = model instanceof Backbone.Collection;
    var vocModel = isCol ? model.model : model.constructor;
    var lastFetchedOn = isCol ? model._lastFetchedOn : (model.collection && model.collection._lastFetchedOn) || model.get('_lastFetchedOn');
    options.headers = options.headers || {};
    
    var filterPrms = isCol && U.getQueryParams(model); // if there are model-specific filter parameters to the API        
    var isFilter = filterPrms && _.size(filterPrms);
    var shortPage = isCol && model._lastFetchedOn && !isFilter && model.models.length < model.perPage;
    var stale = false;
    
    // if it's a short page of a basic RL (no filter), we should fetch just in case there are new resources
    var offset = 0;
    if (isCol && options && options.startAfter) {
      var q = U.getQueryParams(options.url);
      offset = q['$offset'];
      offset = offset ? parseInt(offset) : 0;
    }
    
    var end = offset + model.perPage;
    if (isCol) {
      if (!shortPage && end <= model.models.length && lastFetchedOn) {
        var stalest;
        if (offset) {
          var end = Math.min(offset + model.perPage, model.models.length);
          for (var i = offset; i < end; i++) {
            var m = model.models[i];
            if (m._lastFetchedOn)
              stalest = stalest ? Math.min(stalest, m.get('_lastFetchedOn')) : m._lastFetchedOn;
          }
        }
        
        lastFetchedOn = lastFetchedOn && stalest ? Math.min(stalest, lastFetchedOn) : lastFetchedOn || stalest;
        if (!lastFetchedOn || isStale(lastFetchedOn, now))
          stale = true;
        else if (!options.sync)
          return;
      
        RM.setLastFetched(lastFetchedOn, options);
      }
    }
    else
      RM.setLastFetched(lastFetchedOn, options);
    
    var defSuccess = options.success;
    var defErr = options.error;
    var save;
    if (isCol) {
      save = function(results) {
        if (!results.length)
          return false;
        
        // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
        // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
        // An alternative is to override Backbone.Collection.reset() method and do some magic there.
    //    if (!(model instanceof Backbone.Collection))
    //      return;
        
        var toAdd = [];
        var skipped = [];
        var now = G.currentServerTime();
        for (var i = 0; i < results.length; i++) {
          var r = results[i];
          r._lastFetchedOn = now;
          var longUri = U.getLongUri(r._uri, {type: model.type, shortNameToModel: Voc.shortNameToModel});
          var saved = model.get(longUri);
          var ts;
          if (saved)
            ts = saved.get(tsProp) || 0;
          
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
            else
              model.add(new vocModel(toAdd[i]));
          }
          
        }
        
        setTimeout(function() {          
          RM.addItems(results);
        }, 100);

        return !!toAdd.length;
      }
    }

    var saveOptions = _.extend(_.clone(options), {
      success: function(resp, status, xhr) {
        var code = xhr.status;
        var err = function() {
          G.log(RM.TAG, 'error', code, options.url);
          defErr && defErr(resp && resp.error || {code: code}, status, xhr);            
        }
        
        if (isCol)
          model._lastFetchedOn = now;
        
        switch (code) {
          case 200:
            break;
          case 304:
            var ms = isCol ? model.models.slice(offset, offset + model.perPage) : [model];
            _.each(ms, function(m) {
              m.set({'_lastFetchedOn': now}, {silent: true});
            });
            
            setTimeout(function() {
              RM.addItems(ms);
            }, 100);

            return;
          default:
            err();
            return;
        }
        
        if (resp && resp.error) {
          err();
          return;
        }
        
        data = isCol ? resp.data : resp.data[0];
        var modified;
        if (isCol) {
//            model._lastFetchedOn = now;
          var offset1 = resp.metadata && resp.metadata.offset || 0;
          modified = _.map(model.models.slice(offset1), function(model) {return model.get('_uri')});
        }
        else {
          modified = model.get('_uri');
        }
        
        save && save(data);
        defSuccess && defSuccess(resp, status, xhr);
        Events.trigger('refresh', model, modified);
      }
    });
    
    var runDefault = function() {
      return RM.defaultSync(method, model, saveOptions);
    };
    
    if (method !== 'read' || options.noDB)
      return runDefault();

    var key, now, timestamp, refresh;
    var dbSuccess = function(results) {
      // provide data from indexedDB instead of a network call
      if (!results || (results instanceof Array && !results.length)) {
        return runDefault();
      }

      options.sync = false;
      // simulate a normal async network call
//        setTimeout(function() {
        model.lastFetchOrigin = 'db';
        G.log(RM.TAG, 'db', "got resources from db: " + (model.type || vocModel.type));
        var resp = {data: results, metadata: {offset: offset}};
        defSuccess(resp, 'success', null);
        
//          if (isCol && (results.length < model.perPage || _.any(results, function(m)  {return isStale(m._lastFetchedOn, now); })) {
        if (isCol && _.any(results, function(m)  {return isStale(m._lastFetchedOn, now); })) {
          return runDefault();
        }
//        }, 0);    
    }
    
    var dbError = function(e) {
      if (e) G.log(RM.TAG, 'error', "Error fetching data from db: " + e);
      runDefault();
    }
    
    // only override sync if it is a fetch('read') request
    key = this.getKey && this.getKey();
    var dbReqOptions = {key: key, success: dbSuccess, error: dbError, model: model};
    if (model instanceof Backbone.Collection) {
      dbReqOptions.startAfter = options.startAfter,
      dbReqOptions.perPage = model.perPage;
      dbReqOptions.filter = isFilter && filterPrms;
    }
    else
      dbReqOptions.uri = key;
    
    // only fetch from db on regular resource list or propfind, with no filter
    var dbHasGoodies;
    if (!key || !(dbHasGoodies = RM.getItems(dbReqOptions))) {
      if (G.online)
        runDefault();
      else if (!dbHasGoodies) {
        options.sync && options.error && options.error(model, {type: 'offline'}, options);
      }
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
    isStale: function(ts, now) {
      if (!ts) return true;
      now = now || G.currentServerTime();
      var age = now - ts;
      var stale = age > 180000;
      if (stale)
        G.log(RM.TAG, 'info', 'data is stale at: ' + age + ' millis old');
      
      return stale;
    },
  
    setLastFetched: function(lastFetchedOn, options) {
      if (lastFetchedOn) {
        _.extend(options.headers, {"If-Modified-Since": new Date(lastFetchedOn).toUTCString()});        
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
    
    onblocked: function(e) {
      G.log(RM.TAG, ['error', 'db'], "db blocked: " + e);
    },
    
    defaultOptions: {keyPath: '_uri'},
    openDB: function(options, success, error) {
      var modelsChanged = false;
      G.log(RM.TAG, 'db', "opening db");
      var request = indexedDB.open("lablz");
    
      request.onblocked = function(event) {
        alert("Please close all other tabs with this site open!");
      };
    
      request.onabort = RM.onabort;
    
      var onsuccess;
      request.onsuccess = onsuccess = function(e) {
        G.log(RM.TAG, 'db', 'open db onsuccess');
        RM.db = e.target.result;
        var db = RM.db;
        db.onversionchange = function(event) {
          G.log(RM.TAG, 'db', 'closing db - onversionchange');
          db.close();
          alert("A new version of this page is ready. Please reload!");
        };    
     
        modelsChanged = !!Voc.changedModels.length || !!Voc.newModels.length;
        RM.VERSION = G.userChanged || modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
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
          req.onblocked = RM.onblocked;
          req.onsuccess = function(e2) {
            G.log(RM.TAG, 'db', 'db.setVersion onsuccess');
            if (G.userChanged)
              RM.updateStores(reset) && (G.userChanged = false);
            else if (modelsChanged)
              RM.updateStores();
            
            e2.target.transaction.oncomplete = function() {
//              G.recordCheckpoint("done upgrading db");
              G.log(RM.TAG, 'db', 'db.setVersion transaction.oncomplete');
              if (success)
                success();
            };
          };      
        }
        else {
          G.log(RM.TAG, 'db', 'upgrading db (via onupgradeneeded, using FF are ya?)');
//          G.recordCheckpoint("upgrading db");
          db.close();
          var subReq = indexedDB.open("lablz", RM.VERSION);
          subReq.onsuccess = request.onsuccess;
          subReq.onerror = request.onerror;
          subReq.onupgradeneeded = request.onupgradeneeded;
        }
      };
      
      request.onupgradeneeded = function(e) {
//        G.recordCheckpoint("db, onupgradeneeded callback");
        G.log(RM.TAG, 'db', 'onupgradeneeded callback');
        RM.db = e.target.result;
        if (G.userChanged) {
          G.log(RM.TAG, 'db', "clearing db");
          RM.updateStores(reset) && (G.userChanged = false);
        }
        else if (modelsChanged) {
          G.log(RM.TAG, 'db', "updating db stores");
          RM.updateStores();
        }
        
        e.target.transaction.oncomplete = function() {
//          G.recordCheckpoint("done upgrading db");
          G.log(RM.TAG, 'db', "onupgradeneeded transaction.oncomplete");
          if (success)
            success();
        };
      };      
      
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
        if (db.objectStoreNames.contains(name)) {
          if (reset || _.contains(toDel, name)) {
            try {
              G.log(RM.TAG, 'db', 'deleting object store: ' + name);
              db.deleteObjectStore(name);
              G.log(RM.TAG, 'db', 'deleted object store: ' + name);
              deleted.push(name);
            } catch (err) {
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
          G.log(RM.TAG, ['error', 'db'], '2. failed to create table ' + name + ': ' + err);
          return;
        }
        
      }
      
//      deleted.length && G.log(RM.TAG, 'db', '2. deleted tables: ' + deleted.join(","));
//      created.length && G.log(RM.TAG, 'db', '2. created tables: ' + created.join(","));
    },
    
    addItems: function(items, classUri) {
      if (!items || !items.length)
        return;
      
      var db = RM.db;
      if (!db)
        return;
      
      var className;
      if (classUri)
        className = classUri.slice(classUri.lastIndexOf("/") + 1);
      else if (items[0] instanceof Backbone.Model)
        className = items[0].constructor.shortName;
      else
        className = U.getClassName(items[0]._uri);
      
      if (!db.objectStoreNames.contains(className)) {
        G.log(RM.TAG, 'db', 'closing db for upgrade');
        db.close();
        G.log(this.TAG, "db", "2. newModel: " + className);
        U.pushUniq(Voc.newModels, classUri);
        RM.openDB(null, function() {
          RM.addItems(items, classUri);
        });
        
        return;
      }
      
      G.log(RM.TAG, 'db', 'starting readwrite transaction for store', className);
//      G.recordCheckpoint('starting readwrite transaction for store: ' + className);
      var trans = db.transaction([className], IDBTransaction.READ_WRITE);
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
      
//      G.log(RM.TAG, 'db', "added some " + className + " to db");
    },
    
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
    
//    this.getDataAsync = function(options) {
//      var uri = options.key;
//      var type = U.getClassName(uri);
//      if (uri.endsWith(type))
//        return RM.getItems(options);
//      else if (type == null) {
//        if (error) error();
//        return false;
//      }
//      
//      var name = U.getClassName(type);
//      var db = RM.db;
//      if (!db || !db.objectStoreNames.contains(name))
//        return false;
//      
//      G.log(RM.TAG, 'db', 'starting readonly transaction for store', name);
//      var trans = db.transaction([name], IDBTransaction.READ_ONLY);
//      trans.oncomplete = function(e) {
//        G.log(RM.TAG, 'db', 'finished readonly transaction for store', name);
//      };
//      
//      var store = trans.objectStore(name);
//      var request = store.get(uri);
//      request.onsuccess = function(e) {
//        G.log(RM.TAG, 'db', "store.get().onsuccess");
//        if (options.success) {            
//          options.success(e.target.result)
//        }
//      };
//      
//      request.onerror = function(e) {
//        G.log(RM.TAG, 'db', "store.get().onerror");
//        if (error)
//          error(e);
//        
//        RM.onerror(e);
//      }
//      
//      return true;
//    };
    
    operatorMap: {
      '=': 'eq',
      '!=': 'neq',
      '<': 'lt',
      '>': 'gt',
      '>=': 'gteq',
      '<=': 'lteq',
      'IN:': 'oneof'
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
      if (!db || !db.objectStoreNames.contains(name))
        return false;
      
      G.log(RM.TAG, 'db', 'starting readonly transaction for store', name);
      var trans = db.transaction([name], IDBTransaction.READ_ONLY);
      trans.oncomplete = function(e) {
        G.log(RM.TAG, 'db', 'finished readonly transaction for store', name);
      };
      
      var store = trans.objectStore(name);
//      var lowerBound;
//      if (startAfter)
//        lowerBound = IDBKeyRange.lowerBound(startAfter, true);
      
      // Get everything in the store;
      var results = [];
      var cursorRequest;
      var query;
      var orderBy, asc;
      if (model.queryMap) {
        orderBy = model.queryMap['$orderBy'];
        asc = U.isTrue(model.queryMap['$asc']);
      }
      
      if (orderBy && !store.indexNames.contains(orderBy)) {
        return false;          
      }

      if (filter) {
        // check if we have all the props indexed
        if (filter && !_.all(filter, function(val, name) {return _.contains(store.indexNames, name)}))
          return false;

        var defOp = 'eq';
        for (var name in filter) {
          var op = defOp, val;
          var opVal = filter[name].match(/^(IN=|[>=<!]{0,2})(.+)$/);
          switch (opVal.length) {
            case 2: {
              val = filter[name];
              break;
            }
            case 3: {
              if (opVal[1])
                op = RM.operatorMap[opVal[1]];
              
              val = opVal[2];
              break;
            }
            default: {
              G.log(RM.TAG, 'error', 'couldn\'t parse filter', filter);
              return false;
            }
          }
            
          if (!op || !val)
            return false;
          
          val = U.getTypedValue(model, name, val);
          var subQuery = Index(name)[op](val);// Index(name)[op].apply(this, op === 'oneof' ? val.split(',') : [val]);
          query = query ? query.and(subQuery) : subQuery;
        }        
      }

      var dbReq;
      if (filter || orderBy) {
        var bound = startAfter ? (orderBy == '_uri' ? startAfter : model.get(startAfter).get(orderBy)) : null;
        query = query ? query.sort(orderBy, !asc) : Index(orderBy, asc ? IDBCursor.NEXT : IDBCursor.PREV).all(bound);
        dbReq = query.getAll(store);
      }
      else if (uri)
        dbReq = store.get(uri);
      else
        dbReq = startAfter ? store.openCursor(IDBKeyRange.lowerBound(startAfter, true)) : store.openCursor();
        
      dbReq.onsuccess = function(e) {
//        G.log(RM.TAG, 'db', 'read via cursor onsuccess');
        var result = e.target.result;
        if (result) {
          if (filter || orderBy)
            return success(result);
          else if (uri)
            return success([result]);
        
          results.push(result.value);
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
      
      RM.openDB(null, success, error);
    }
    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  }
  
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