define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!error',
  'cache!indexedDBShim'
  'cache!utils',
  'cache!resourceManager',
], function(G, $, __jqm__, _, Backbone, Error, __idbShim__, U, MB) {
  DB = {};
  DB.db = null;
  DB.VERSION = 1;
  DB.modelStoreOptions = {keyPath: 'type'};
  DB.paused = false;
  
  DB.onerror = function(e) {
    G.currentUser._reset = true;
    DB.db && DB.db.close();
    DB.open();
    console.log("db error: " + e);
  };
  
  DB.onabort = function(e) {
    console.log("db abort: " + e);
  };
  
  DB.reset = function() {
    var db = DB.db;
    var rModels = G.models && _.map(G.models, function(model) {return model.shortName}) || [];
    var deleted = [];
    var created = [];
    _.each(db.objectStoreNames, function(name) {            
      db.deleteObjectStore(name);
      deleted.push(name);
      if (_.contains(rModels, name)) {
        db.createObjectStore(name, DB.defaultOptions);
        created.push(name);
      }
    })
    
    deleted.length && console.log('1. deleted tables: ' + deleted.join(','));
    created.length && console.log('1. created tables: ' + created.join(','));
    G.currentUser._reset = false;
  }
  
  DB.onblocked = function(e) {
    console.log("db blocked: " + e);
  };
  
  DB.defaultOptions = {keyPath: '_uri'};
  DB.open = function(options, success, error) {
    var modelsChanged = false;
    var request = indexedDB.open("lablz");
  
    request.onblocked = function(event) {
      alert("Please close all other tabs with this site open!");
    };
  
    request.onabort = DB.onabort;
  
    var onsuccess;
    request.onsuccess = onsuccess = function(e) {
      DB.db = e.target.result;
      var db = DB.db;
      db.onversionchange = function(event) {
        db.close();
        alert("A new version of this page is ready. Please reload!");
      };    
  
  //    var userChanged = false;
  //    if (!db.objectStoreNames.contains('sysinfo')) {
  //      userChanged = true;
  //    }
      
      modelsChanged = !!MB.changedModels.length || !!MB.newModels.length;
      DB.VERSION = G.currentUser._reset || modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
      if (db.version == DB.VERSION) {
        if (success)
          success();
        
        return;
      }
      
      if (db.setVersion) {
        console.log('in old setVersion. User changed: ' + G.currentUser._reset + '. Changed models: ' + (G.changedModels.join(',') || 'none') + ', new models: ' + (G.newModels.join(',') || 'none')); // deprecated but needed for Chrome
        
        // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
        var req = db.setVersion(DB.VERSION);
        // onsuccess is the only place we can create Object Stores
        req.onerror = DB.onerror;
        req.onblocked = DB.onblocked;
        req.onsuccess = function(e2) {
          console.log('upgrading db');
          if (G.currentUser._reset)
            DB.reset();
          
          if (modelsChanged)
            DB.updateStores();
          
          e2.target.transaction.oncomplete = function() {
            console.log('upgraded db');
            if (success)
              success();
          };
        };      
      }
      else {
        db.close();
        var subReq = indexedDB.open("lablz", DB.VERSION);
        subReq.onsuccess = request.onsuccess;
        subReq.onerror = request.onerror;
        subReq.onupgradeneeded = request.onupgradeneeded;
      }
    };
    
    request.onupgradeneeded = function(e) {
      console.log ("upgrading db");
      DB.db = e.target.result;
      var db = DB.db;
      if (G.currentUser._reset) {
        console.log("clearing db");
        DB.reset();
      }
      
      if (modelsChanged) {
        console.log("updating stores");
        DB.updateStores();
      }
      
      e.target.transaction.oncomplete = function() {
        console.log ("upgraded db");
        if (success)
          success();
      };
    };      
    
    request.onerror = function(e) {
      if (error)
        error(e);
      
      DB.onerror(e);
    };  
  };
  
  //DB.loadModels = function(success, error) {
  //  var models = [];
  //  var db = DB.db;
  //  var mStore = DB.modelStoreName;
  //  var transaction = db.transaction([mStore], "readonly");
  //  var store = transaction.objectStore(mStore);
  //  var cursorRequest = store.openCursor();
  //  cursorRequest.onsuccess = function(e) {
  //    var result = e.target.result;
  //    if (result) {
  //      models.push(result.value);
  //      result.continue();
  //      return;
  //    }
  //    else
  //      success && success();
  //    
  ////    if (true) {
  ////      console.log("got models from db");
  ////      success && success();
  ////      return;
  ////    }
  ////    
  ////    for (var i = 0; i < models.length; i++) {
  ////      var m = models[i];
  ////      var pkgPath = Utils.getPackagePath(m.type);
  ////      Utils.addPackage(pkgPath);
  ////      var superCl = 
  ////      MB.shortNameToModel[m.shortName] = Backbone.Model.extend(
  ////          {
  ////            initialize: function() { 
  ////              _.bindAll(this, 'parse'); // fixes loss of context for 'this' within methods
  ////              eval('packages.' + pkgPath + '.__super__.initialize.apply(this, arguments)');
  //////              packages.hudsonfog.voc.commerce.trees.TreeSpecies.__super__.initialize.apply(this, arguments); 
  ////            } 
  ////          },
  ////          m
  ////      );
  ////    }
  //    
  //  };
  //
  //  cursorRequest.onerror = function (e) {
  //    error && error(e);
  //    
  //    DB.onerror(e);
  //  }
  //}
  
  DB.updateStores = function() {
    var db = DB.db;
    var models = Utils.union(MB.changedModels, MB.newModels);
    models = _.map(models, function(uri) {
      var sIdx = uri.lastIndexOf("/");
      return sIdx == -1 ? uri : uri.slice(sIdx + 1);
    });
    
    MB.changedModels.length = 0;
    MB.newModels.length = 0;
    var deleted = [];
    var created = [];
    for (var i = 0; i < models.length; i++) {
      var name = models[i];
      if (db.objectStoreNames.contains(name)) {
        try {
          db.deleteObjectStore(name);
          deleted.push(name);
        } catch (err) {
          console.log('2. failed to delete table ' + name + ': ' + err);
          return;
        }
        
      }
  
      try {
        db.createObjectStore(name, DB.defaultOptions);
        created.push(name);
      } catch (err) {
        console.log('2. failed to create table ' + name + ': ' + err);
        return;
      }
      
    }
    
    deleted.length && console.log('2. deleted tables: ' + deleted.join(","));
    created.length && console.log('2. created tables: ' + created.join(","));
  }
  
  DB.addItems = function(items, classUri) {
    if (!items || !items.length)
      return;
    
    var db = DB.db;
    if (!db)
      return;
    
    var className = classUri.slice(classUri.lastIndexOf("/") + 1);
    if (!db.objectStoreNames.contains(className)) {
      db.close();
      console.log("2. newModel: " + className);
      MB.newModels.push(classUri);
      DB.open(null, function() {
        DB.addItems(items, classUri);
      });
      
      return;
    }
    
    var trans = db.transaction([className], IDBTransaction.READ_WRITE);
    var store = trans.objectStore(className);
    _.each(items, function(item) {
      var request = store.put(item);
      request.onsuccess = function(e) {
  //      console.log("Added item to db: ", e);
      };
    
      request.onerror = function(e) {
        console.log("Error adding item to db: ", e);
      };
    });
    
    console.log("added some " + className + " to db");
  };
  
  DB.addItem = function(item, classUri) {
    DB.addItems([item instanceof Backbone.Model ? item.toJSON() : item], classUri || item.constructor.type);
  }
  
  DB.deleteItem = function(uri) {
    var type = Utils.getType(item._uri);
    var name = Utils.getClassName(type);
    var db = DB.db;
    var trans = db.transaction([type], IDBTransaction.READ_WRITE);
    var store = trans.objectStore(type);
    var request = store.delete(uri);
  
    request.onsuccess = function(e) {
  //    DB.getItems(type);
    };
  
    request.onerror = function(e) {
      console.log("Error Deleting: ", e);
    };
  };
  
  DB.getDataAsync = function(options) {
    var uri = options.key;
    var type = Utils.getType(uri);
    if (Utils.endsWith(uri, type))
      return DB.getItems(options);
    else if (type == null) {
      if (error) error();
      return false;
    }
    
    var name = Utils.getClassName(type);
    var db = DB.db;
    if (!db || !db.objectStoreNames.contains(name))
      return false;
    
    var trans = db.transaction([name], IDBTransaction.READ_ONLY);
    var store = trans.objectStore(name);
    var request = store.get(uri);
    request.onsuccess = function(e) {
      if (options.success)
        options.success(e.target.result)
    };
    
    request.onerror = function(e) {
      if (error)
        error(e);
      
      DB.onerror(e);
    }
    
    return true;
  }
  
  DB.getItems = function(options) {
    // var todos = document.getElementById("todoItems");
    // todos.innerHTML = "";
    var type = options.key;
    var success = options.success;
    var error = options.error;
    var startAfter = options.startAfter;
    var total = options.perPage;
  
    var name = Utils.getClassName(type);
    var db = DB.db;
    if (!db || !db.objectStoreNames.contains(name))
      return false;
    
    var trans = db.transaction([name], IDBTransaction.READ_ONLY);
    var store = trans.objectStore(name);
  
    var lowerBound;
    if (startAfter)
      lowerBound = IDBKeyRange.lowerBound(startAfter, true);
    
    // Get everything in the store;
    var results = [];
    var cursorRequest = lowerBound ? store.openCursor(lowerBound) : store.openCursor();
    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if (result) {
        results.push(result.value);
        if (results.length < total) {
          result.continue();
          return;
        }
      }
      
      if (success)
        success(results);
    };
  
    cursorRequest.onerror = function (e) {
      if (error)
        error(e);
      
      DB.onerror(e);
    }
    
    return true;
  };

  DB.updateTables = function(success, error) {
  //  G.checkSysInfo();
  //  G.loadAndUpdateModels();
    DB.paused = true;
    if (DB.db)
      DB.db.close();
    
    var s = success;
    success = function() {
      DB.paused = false;
      if (s) s();
    }
    
    DB.open(null, success, error);
  };

  return DB;
});
