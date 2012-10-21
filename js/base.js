var Lablz = {};
var packages = {};

// START ///////////// Models //////////////// START ///
packages.Resource = Backbone.Model.extend({
  dateLastUpdated: 0,
  idAttribute: "_uri",
  _setUri: function() {
    var uri = this.get('_uri');
    var primaryKeys = Utils.getPrimaryKeys(this.__proto__.constructor);
    uri = Utils.getLongUri(uri, this.type, primaryKeys);
    this.set('_uri', uri);
    return this;
  },
  initialize: function() {
    _.bindAll(this, '_setUri', 'getKey', 'parse', 'updateRecord', 'url'); // fixes loss of context for 'this' within methods
//    if (this.__proto__.constructor.timestamp)
//      this.bind('change', checkTimestamp);
    this.bind('change', this.updateRecord);
    var type = this.__proto__.constructor.type || this.get('type');
    if (!type)
      return this;
    
    if (type.indexOf) {
      this.type = type;
      this.className = type.substring(type.lastIndexOf("/") + 1);
    }
    else {
      this.className = type.name;
      this.type = type._uri;
    }
    
    this.urlRoot = Lablz.apiUrl + this.className;
    this._setUri();
  },  
  url: function() {
    return Lablz.apiUrl + this.className + "?_uri=" + encodeURIComponent(this.get('_uri'));
  },
  getKey: function() {
    return this.get('_uri');
  },
  parse: function (response) {
    if (this.lastFetchOrigin == 'db')
      return response;
    
    if (!response || response.error)
      return {};

    if (response._uri)
      return response;
    
    return response.data[0];
  },
  validate: function(attrs) {
    for (var name in attrs) {
      var validated = packages.Resource.validateProperty(name, attrs[name]);
      if (validated !== true)
        return validated instanceof String ? error : "Please enter a valid " + name;
    }
  },
  updateRecord: function() {
    Lablz.indexedDB.addItem(this);
  }
  
//  ,
//  fetch: function(options) {
//  
//    return Backbone.Model.prototype.fetch.call(this, options);
//  }
},
{
  type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
  shortName: "Resource",
  displayName: "Resource",
  myProperties: {
    davDisplayName: {type: "string"},
    _uri: {type: "string"}
  },
  validateProperty: function(name, value) {
    var meta = properties[name];
    if (!meta)
      return true;
    
    var type = meta.type;
    if (type == 'email')
      return Utils.validateEmail(value) || false;
//    else if (type == 'tel')
//      return Utils.validateTel(value) || false;
      
    // check annotations
    var anns = meta.annotations;
    for (var i = 0; i < anns.length; i++) {
      var error;
      switch (anns[i]) {
        case "@r":
          error = value == null && (name + " is required");
          break;
      }
      
      if (typeof error != 'undefined')
        return error;
    }
    
    return true;
  }
});

packages.Resource.properties = _.clone(packages.Resource.myProperties);

Lablz.ResourceList = Backbone.Collection.extend({
  initialize: function(models, options) {
    if (!models && !options.model)
      throw new Error("resource list must be initialized with options.model or an array of models");
    
    _.bindAll(this, 'getKey', 'parse'); //, 'onAdd'); //, 'fetch'); // fixes loss of context for 'this' within methods
    this.model = options.model || models[0].model;
    this.bind('add', this.onAdd, this);
//    this.model = metadata.model;
    this.type = this.model.type;
    this.className = this.model.shortName || this.model.className;
    this.url = Lablz.apiUrl + this.className;
    console.log("init " + this.className + " resourceList");
  },
  getKey: function() {
    return this.type;
  },
  parse: function(response) {
    if (!response || response.error)
      return [];
    
    return response instanceof Array ? response : response.data;
  }
//  ,
//  onAdd: function(item) {
//    if (this.lastFetchOrigin == 'db')
//      return;
//    
//    var timestampProp = this.model.timestamp;
//    if (!timestampProp)
//      return;
//    
//    var existing = this.where({_uri: item.get('_uri')});
//    if (!existing || !existing.length)
//      return;
//    
//    var dateModified = item[timestampProp];
//    if (dateModified && (!this.has(timestampProp) || dateModified > this.get(timestampProp))) {
//      this.remove(existing);
//      Lablz.indexedDB.addItem(item);
//    }
//  }
});

// END ///////////// Models //////////////// END ///


// START ///////////// Backbone sync override //////////////// START ///

Lablz.defaultSync = function(method, model, options) {
  model.lastFetchOrigin = 'server';
  Backbone.defaultSync(method, model, options);
};

Backbone.defaultSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  var defSuccess = options.success;
  var saveOptions = _.extend(_.clone(options), {
      success: function(resp, status, xhr) {
        if (resp.error) {
          console.log("Error in sync: " + resp.error.code + ", " + resp.error.details);
          return;
        }
        
        var item = model instanceof Backbone.Collection ? resp.data : resp.data[0];
        if (defSuccess)
          defSuccess(item, status, xhr);
        
        save(item);
      }
  });
  
  var save = function(results) {
    if (model instanceof Backbone.Collection) {
      var tsProp = model.model.timestamp;
      var toAdd = new Lablz.ResourceList(null, {model: model.model});
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        if (!tsProp || !r[tsProp] || r[tsProp] > model.get(r._uri)[tsProp]) {
          toAdd.add(new model.model(r));
        }
      }
      
      if (toAdd.length)
        Lablz.indexedDB.addCollection(toAdd);      
    }
    else
      Lablz.indexedDB.addItem(model);
  }
  
  var runDefault = function() {
    return Lablz.defaultSync(method, model, saveOptions);
  }
  
  if (method !== 'read')
    return runDefault();
    
  var key, now, timestamp, refresh;
  var success = function(results) {
//      refresh = options.forceRefresh;
//      if (refresh || !timestamp || ((now - timestamp) > this.constants.maxRefresh)) {
//        // make a network request and store result in local storage
//        var success = options.success;
//        options.success = function(resp, status, xhr) {
//          // check if this is an add request in which case append to local storage data instead of replace
//          if(options.add && resp.values) {
//            // clone the response
//            var newData = JSON.parse(JSON.stringify(resp));
//            // append values
//            var prevData = $storage.get(key);
//            newData.values = prevData.values.concat(resp.values);
//            // store new data in local storage
//            $storage.set(key, newData);
//          } else {
//            // store resp in local storage
//            $storage.set(key, resp);
//          }
//  //        var now = new Date().getTime();
//          $storage.set(key + ":_uri", uri);
//          success(resp, status, xhr);
//        };
//        // call normal backbone sync
//        Backbone.defaultSync(method, model, options);
//      } else {
      // provide data from local storage instead of a network call
    if (!results || !results.length) {
      runDefault();
      return;
    }

    // simulate a normal async network call
    setTimeout(function(){
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (success) {
          console.log("got resources from db");
          success(resp, status, xhr);
        }
        
        return runDefault();
      }
      
      model.lastFetchOrigin = 'db';
      options.success(results, 'success', null);
    }, 0);    
  }
  
  var error = function(e) {
    if (e) console.log("Error fetching data from db: " + e);
    runDefault();      
  }
  
  // only override sync if it is a fetch('read') request
  key = this.getKey();
  if (!key || !Lablz.indexedDB.getDataAsync(key, success, error))
    runDefault();
}

// END ///////////// Backbone sync override //////////////// END ///


// START ///////////// Templates and Backbone convenience //////////////// START ///

Backbone.Model.prototype._super = function(funcName){
  return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
};

Lablz.templates = {
  "string": "stringTemplate",
  "int": "intTemplate",
  "email": "emailTemplate",
  "date": "dateTemplate",
  "uri": "uriTemplate",
  "Money": "moneyTemplate",
  "ComplexDate": "complexDateTemplate",
  "image": "imageTemplate"
};

Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
  if (this.onClose){
    this.onClose();
  }
}

Lablz.models = [packages.Resource];
Lablz.shortNameToModel = {};
Lablz.initModels = function() {
  for (var i = 0; i < Lablz.models.length; i++) {
    var m = Lablz.models[i];
    Lablz.shortNameToModel[m.shortName] = m;
    m.prototype.parse = m.prototype.constructor.__super__.parse;
    m.prototype.validate = m.prototype.constructor.__super__.validate;
    m.prototype.constructor.properties = _.extend(_.clone(m.prototype.constructor.myProperties), m.prototype.constructor.__super__.constructor.properties);
  }
};

// END ///////////// Templates and Backbone convenience //////////////// END ///


// START ///////////// IndexedDB stuff //////////////// START ///

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

if ('webkitIndexedDB' in window) {
  window.IDBTransaction = window.webkitIDBTransaction;
  window.IDBKeyRange = window.webkitIDBKeyRange;
}

//Lablz.resourceType = "Urbien";
Lablz.indexedDB = {};
Lablz.indexedDB.db = null;
Lablz.DB_VERSION = 1;

Lablz.indexedDB.onerror = function(e) {
  console.log("db error: " + e);
};

Lablz.indexedDB.defaultOptions = {keyPath: '_uri'};
Lablz.indexedDB.open = function(storeNames, options, success, error) { // optional params: "storeName" to create, "options" to create it with
  var request = indexedDB.open("lablz");

  request.onblocked = function(event) {
    alert("Please close all other tabs with this site open!");
  };
  
  request.onsuccess = function(e) {
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    db.onversionchange = function(event) {
      db.close();
      alert("A new version of this page is ready. Please reload!");
    };    
      
    var newStoreNames = [];
    storeNames = storeNames instanceof String ? [storeNames] : storeNames;
    for (var i = 0; i < storeNames.length; i++) {
      if (!db.objectStoreNames.contains(storeNames[i]))
        newStoreNames.push(storeNames[i])
    }
    
    Lablz.DB_VERSION = newStoreNames.length == 0 ? db.version : db.version + 1;

    if (db.version == Lablz.DB_VERSION) {
      if (success)
        success();
      
      return;
    }
    
    if (db.setVersion) {
      console.log("in old setVersion: "+ db.setVersion); // deprecated but needed for Chrome
      
      // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
      var req = db.setVersion(Lablz.DB_VERSION);
      // onsuccess is the only place we can create Object Stores
      req.onerror = Lablz.indexedDB.onerror;
      req.onsuccess = function(e) {
        for (var i = 0; i < newStoreNames.length; i++) {
          var name = newStoreNames[i];
          if (db.objectStoreNames.contains(name))
            db.deleteObjectStore(name);
  
          db.createObjectStore(name, options || Lablz.indexedDB.defaultOptions);
        }
        
        e.target.transaction.oncomplete = function() {
          if (success)
            success();
        };
      };      
    }
    else {
      db.close();
      var subReq = indexedDB.open("lablz", Lablz.DB_VERSION);
      subReq.onsuccess = request.onsuccess;
      subReq.onerror = request.onerror;
      subReq.onupgradeneeded = request.onupgradeneeded;
    }
  };
  
  request.onupgradeneeded = function(e) {
    console.log ("going to upgrade our DB!");
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    var newStoreNames = [];
    storeNames = storeNames instanceof String ? [storeNames] : storeNames;
    for (var i = 0; i < storeNames.length; i++) {
      if (!db.objectStoreNames.contains(storeNames[i]))
        newStoreNames.push(storeNames[i])
    }
    
    for (var i = 0; i < newStoreNames.length; i++) {

      var name = newStoreNames[i];
      if (db.objectStoreNames.contains(name))
        db.deleteObjectStore(name);

      db.createObjectStore(name, options || Lablz.indexedDB.defaultOptions);
    }
    
    e.target.transaction.oncomplete = function() {
//      Lablz.indexedDB.getItems(storeName);
      if (success)
        success();
    };
    
  }
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  };
};

Lablz.indexedDB.addCollection = function(collection) {
  if (!collection || !collection.length)
    return;
  
  var name = collection.className;
  var db = Lablz.indexedDB.db;
  if (!db)
    return;
  
  if (!db.objectStoreNames.contains(name)) {
    db.close();
    Lablz.indexedDB.open(name, null, function() {Lablz.indexedDB.addCollection(collection)});
    return;
  }
  
  var trans = db.transaction([name], "readwrite");
  var store = trans.objectStore(name);
  collection.each(function(item) {
    var request = store.put(item.toJSON());
  
    request.onsuccess = function(e) {
  //    Lablz.indexedDB.getItems(type);
    };
  
    request.onerror = function(e) {
      console.log("Error Adding: ", e);
    };
  });
};

Lablz.indexedDB.addItem = function(itemModel, success, error) {
//  var type = Utils.getType(itemModel.get('_uri'));
  var name = itemModel.className;
  var db = Lablz.indexedDB.db;
  if (!db.objectStoreNames.contains(name)) {
    db.close();
    Lablz.indexedDB.open(name, null, function() {Lablz.indexedDB.addItem(itemModel)});
    return;
  }

  var trans = db.transaction([name], "readwrite");
  var store = trans.objectStore(name);
  var request = store.put(itemModel.toJSON());

  request.onsuccess = function(e) {
    if (success) success(e);
  };

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
    if (error) error(e);
  };
};

Lablz.indexedDB.deleteItem = function(uri) {
  var type = Utils.getType(item._uri);
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);
  var request = store.delete(uri);

  request.onsuccess = function(e) {
//    Lablz.indexedDB.getItems(type);
  };

  request.onerror = function(e) {
    console.log("Error Deleting: ", e);
  };
};

Lablz.indexedDB.getDataAsync = function(uri, success, error) {
  var type = Utils.getType(uri);
  if (type == uri)
    return Lablz.indexedDB.getItems(type, success, error);
  
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);
  var request = store.get(Utils.getShortUri(uri));
  request.onsuccess = function(e) {
    if (success)
      success(e.target.result)
  };
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
}

Lablz.indexedDB.getItems = function(type, success, error) {
  // var todos = document.getElementById("todoItems");
  // todos.innerHTML = "";

  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);

  // Get everything in the store;
  var results = [];
  var cursorRequest = store.openCursor();
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if (result) {
      results.push(result.value);
      result.continue();
    }
    else {
      if (success)
        success(results);
    }
  };

  cursorRequest.onerror = function (e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
};

// END ///////////// IndexedDB stuff //////////////// END ///
