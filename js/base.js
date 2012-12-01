window.Lablz = window.Lablz || {};
var packages = {};

Lablz.Error = {
  NOT_FOUND: "Oops! The page you're looking for doesn't exist.",
  getDefaultErrorHandler: function(errorHandler) {
    return function(originalModel, err, options) {
      if (options.sync) {
        switch (err.code) {
        case 401: 
          console.log('redirecting to user-login');
          window.location.href = Lablz.serverName + "/register/user-login.html?-mobile=y&errMsg=This+page+is+restricted,+please+login&returnUri=" + encodeURIComponent(window.location.href);
          return;
        case 404:
          console.log('no results');
          if (originalModel && (originalModel instanceof Backbone.Model || (originalModel instanceof Backbone.Collection))) // && originalModel.queryMap.length == 0)))
            Backbone.history.navigate((originalModel.shortName || originalModel.constructor.shortName), {trigger: true, replace: true, errMsg: "No results were found for your query"});
          else
            Backbone.history.navigate(Lablz.homePage, {trigger: true, replace: true, errMsg: Lablz.Error.NOT_FOUND});
          
          return;
        default:
          Backbone.history.navigate(Lablz.homePage, {trigger: true, replace: true, errMsg: err && err.details || Lablz.Error.NOT_FOUND});
          return;
        }
      }
      
      if (errorHandler)
        errorHandler.apply(this, arguments);
    }
  }    
};

// START ///////////// Models //////////////// START ///
packages.Resource = Backbone.Model.extend({
  idAttribute: "_uri",
  initialize: function(options) {
    _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', 'updateDB', 'fetch'); // fixes loss of context for 'this' within methods
    this.on('change', this.updateDB);
    this.on('aroundMe', this.constructor.getAroundMe);
    options._query && (this.urlRoot += "?" + options._query);
  },
  url: function() {
    return Lablz.apiUrl + this.constructor.shortName + "?_uri=" + encodeURIComponent(this.get('_uri'));
  },
  getKey: function() {
    return this.get('_uri');
  },
  parse: function (resp) {
    if (this.lastFetchOrigin == 'db')
      return resp;
    
    if (!resp || resp.error)
      return null;

    var uri = resp._uri;
    if (!uri) {      
      resp = resp.data[0];
      uri = resp._uri;
    }
    resp._shortUri = Utils.getShortUri(uri, this.constructor);
    var primaryKeys = Utils.getPrimaryKeys(this.constructor);
    resp._uri = Utils.getLongUri(resp._uri, this.constructor.type, primaryKeys);
    this.loaded = true;
    return resp;
  },
  validate: function(attrs) {
    for (var name in attrs) {
      var validated = this.validateProperty(name, attrs[name]);
      if (validated !== true)
        return validated instanceof String ? error : "Please enter a valid " + name;
    }
  },
  validateProperty: function(name, value) {
    var meta = this.constructor.properties[name];
    if (!meta)
      return true;
    
    var type = meta.type;
    if (type == 'email')
      return Utils.validateEmail(value) || false;
//    else if (type == 'tel')
//      return Utils.validateTel(value) || false;
      
    // check annotations
    var anns = meta.annotations;
    if (!anns)
      return true;
    
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
  },
  updateDB: function() {
    if (this.lastFetchOrigin != 'db' && !this.collection) // if this resource is part of a collection, the collection will update the db in bulk
      Lablz.indexedDB.addItem(this);
  },
  isA: function(interfaceName) {
    return Utils.isA(this.constructor, interfaceName);
  },
  fetch: function(options) {
    var self = this;
//    setTimeout(function() {
//      self.fetchModelsForLinkedResources.call(self.constructor);
//    }, 100);
    
    options = options || {};
    options.error = Lablz.Error.getDefaultErrorHandler(options.error);
    var success = options.success;
    options.success = function() {
      success && success.apply(self, arguments);
      self.fetchModelsForLinkedResources.call(self.constructor);
    };
    
    return Backbone.Model.prototype.fetch.call(this, options);
  }  
//  ,
//  loadMap: function() {
//    var url = url();
//    url += (url.indexOf("?") == -1 : "?" : "&") + "$map=y";
//  }
//  
//  ,
//  set: function(attrs, options) {
//    options = options || {};
////    options.silent = this.lastFetchOrigin == 'db';
//    return Backbone.Model.prototype.set.call(this, attrs, options);
//  },  
},
{
  type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
  shortName: "Resource",
  displayName: "Resource",
  myProperties: {
    davDisplayName: {type: "string"},
    _uri: {type: "resource"},
    _shortUri: {type: "resource"}
  },
  myInterfaces : {}
});

packages.Resource.properties = _.clone(packages.Resource.myProperties);
packages.Resource.interfaces = _.clone(packages.Resource.myInterfaces);
packages.Resource.prototype.fetchModelsForLinkedResources = function() {
  var linkedModels = new Utils.UArray();
  _.forEach(this.properties, function(p) {
    p.range && linkedModels.push(p.range);
//    var r = p.range;
//    if (r && r.indexOf("http://www.hudsonfog.com/") == 0) {
//      var name = r.slice(r.lastIndexOf("/") + 1);
//      if (Lablz.shortNameToModel[name])
//        return;
//      
//      linkedModels.push(name);
//    }
  });
  
  linkedModels = _.filter(Lablz.requiredModels.linkedModels, function(model) {return _.contains(linkedModels, model.type)});
  if (linkedModels.length) {
    linkedModels = _.uniq(linkedModels);
    Lablz.loadStoredModels(linkedModels);
    Lablz.fetchModels();
  }
}


Lablz.ResourceList = Backbone.Collection.extend({
  page: 1,
  perPage: 30,
  displayPerPage: 7, // for client-side paging, not used currently
  offset: 0,
  firstPage: 1,
  offsetParam: "$offset",
  limitParam: "$limit",
  queryMap: {},
  initialize: function(models, options) {
    if (!models && !options.model)
      throw new Error("resource list must be initialized with options.model or an array of models");
    
    _.bindAll(this, 'getKey', 'parse', 'parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'setPerPage', 'pager', 'getUrl'); //, 'onAdd'); //, 'fetch'); // fixes loss of context for 'this' within methods
    this.model = options.model || models[0].model;
    this.on('add', this.onAdd, this);
    this.on('reset', this.onReset, this);
    this.on('aroundMe', this.model.getAroundMe);
//    this.model = metadata.model;
    this.type = this.model.type;
    this.shortName = this.model.shortName || this.model.shortName;
    this.displayName = this.model.displayName;
    this.baseUrl = Lablz.apiUrl + this.shortName;
    this.url = this.baseUrl;
    this.parseQuery(options._query);
    this.queryMap[this.limitParam] = this.perPage;
    
    console.log("init " + this.shortName + " resourceList");
  },
  getNextPage: function(options) {
    console.log("fetching next page");
    this.offset += this.perPage;
    this.pager(options);
  },
  getPreviousPage: function () {
    this.offset -= this.perPage;
    this.pager();
  },
  getPageAtOffset: function(offset) {
    this.offset = offset;
    this.pager();
  },
  pager: function(options) {
    this.page = Math.floor(this.offset / this.perPage) + 1; // first page is page 1 (not 0)
    options = options || {};
    options.startAfter = _.last(this.models).get('_uri');
    this.fetch(options);
  },
  setPerPage: function(perPage) {
    this.page = this.firstPage;
    this.perPage = perPage;
    this.pager();
  },
  getUrl: function() {
    return this.baseUrl + (this.queryMap ? "?" + $.param(this.queryMap) : '');
  },
  parseQuery: function(query) {
    if (!query)
      return;
    
    query = query.split("&");
    var qMap = this.queryMap = this.queryMap || {};
    for (var i = 0; i < query.length; i++) {
      var p = query[i].split("=");
      var name = p[0];
      var val = p[1];
      var q = query[i];
      if (q == this.offsetParam) {
        this.offset = parseInt(value); // offset is special because we need it for lookup in db
        this.page = Math.floor(this.offset / this.perPage) + 1;
      }
      else if (q.charAt(0) == '-')
        continue;
      else
        qMap[name] = decodeURIComponent(val);
    }
    
    this.url = this.getUrl();
  },
  getKey: function() {
    return this.url;
  },
  isA: function(interfaceName) {
    return Utils.isA(this.model, interfaceName);
  },
  parse: function(response) {
    if (!response || response.error)
      return [];
    
    if (response.data) {
      this.offset = response.metadata.offset;
      if (this.offset)
        console.log("received page, offset = " + this.offset);
      
      this.page = Math.floor(this.offset / this.perPage);
      response = response.data;
    }
    
    this.loaded = true;
    return response;
  },
  onReset: function(model) {
    console.log("resourceList onReset");
  },
  onAdd: function(model) {
//    console.log("resourceList onAdd");
  },
  fetchAll: function(options) { 
    return Backbone.Model.prototype.fetch.call(this, options);
  },
  fetch: function(options) {
    var self = this;
//    setTimeout(function() {
//      self.model.prototype.fetchModelsForLinkedResources.call(self.model);
//    }, 100);
    options = options || {};
    options.add = true;
    this.queryMap = this.queryMap || {};
    if (this.offset)
      this.queryMap[this.offsetParam] = this.offset;
      
    options.url = this.getUrl();
    options.error = Lablz.Error.getDefaultErrorHandler(options.error);
    var success = options.success;
    options.success = function() {
      success && success.apply(self, arguments);
      self.model.prototype.fetchModelsForLinkedResources.call(self.model);
    };

    return Backbone.Collection.prototype.fetch.call(this, options);
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

Lablz.MapModel = Backbone.Model.extend({
  initialize: function(options) {
    _.bindAll(this, 'parse', 'url', 'fetch'); // fixes loss of context for 'this' within methods
    this.model = options.model;
    var url = this.model.url;
    this.baseUrl = typeof url == 'function' ? url.apply(this) : url;
  },  
  parse: function(resp) {
    return resp.data && resp.data[0];
  },
  url: function() {
//    var base = this.get('url');
    return this.baseUrl + (this.baseUrl.indexOf("?") == -1 ? "?" : "&") + "$map=y";
  },
  fetch: function(options) {
    options = options || {};
    options.noDB = true;
    return Backbone.Model.prototype.fetch.call(this, options);
  }  
})

// END ///////////// Models //////////////// END ///


// START ///////////// Backbone sync override //////////////// START ///

Lablz.defaultSync = function(method, model, options) {
  model.lastFetchOrigin = 'server';
  Backbone.defaultSync(method, model, options);
};

Backbone.defaultSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  if (options.noDB) {
    Lablz.defaultSync.apply(this, arguments);
    return;
  }
  
  var defSuccess = options.success;
  var defErr = options.error;
  var save;
  if (model instanceof Backbone.Collection) {
    save = function(results) {
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // Alternative is to override Backbone.Collection.reset() method and do some magic there.
  //    if (!(model instanceof Backbone.Collection))
  //      return;
      
      var tsProp = model.model.timestamp; // model.model is the collection's model 
      var toAdd = [];
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var longUri = Utils.getLongUri(r._uri, model.type);
        var saved = model.get(longUri);
        saved = saved && saved.get(tsProp);
//        var saved = $.grep(model.models, function(o) {
//          return o.id == longUri;
//        })[0][tsProp];
        if (typeof saved === "undefined")
          saved = 0;
        var newLastModified = r[tsProp];
        if (typeof newLastModified === "undefined") 
          newR = 0;
        if (!tsProp || !newLastModified || newLastModified > saved) {
          toAdd.push(r); //new model.model(r));
        }
      }
      
      var modified = [];
      if (toAdd.length) {
        for (var i = 0; i < toAdd.length; i++) {
          toAdd[i]._uri = Utils.getLongUri(toAdd[i]._uri);
          var existing = model.get(toAdd[i]._uri);
          if (existing) {
            existing.set(toAdd[i]);
            modified.push(toAdd[i]._uri);
          }
          else
            model.add(new model.model(toAdd[i]));
        }
        
        Lablz.indexedDB.addItems(toAdd, model.type);
      }
    }
  }

  var saveOptions = _.extend(_.clone(options), {
    success: function(resp, status, xhr) {
      if (resp.error) {
        console.log("Error in sync: " + resp.error.code + ", " + resp.error.details);
        defErr && defErr(resp.error, status, xhr);
        return;
      }

      var isCol = model instanceof Backbone.Collection;
      data = isCol ? resp.data : resp.data[0];
      var modified;
      if (isCol) {
        var offset = resp.metadata && resp.metadata.offset || 0;
        modified = _.map(model.models.slice(offset), function(model) {return model.get('_uri')});
      }
      else
        modified = model.get('_uri');
      
      save && save(data);
      defSuccess && defSuccess(resp, status, xhr);
      Lablz.Events.trigger('refresh', model, modified);
    }
  });
    
  var runDefault = function() {
    return Lablz.defaultSync(method, model, saveOptions);
  }
  
  if (method !== 'read')
    return runDefault();
    
  var key, now, timestamp, refresh;
  var success = function(results) {
    // provide data from indexedDB instead of a network call
    if (!results || (results instanceof Array && !results.length)) {
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
  key = this.getKey && this.getKey();
  var dbReqOptions = {key: key, success: success, error: error};
  if (model instanceof Backbone.Collection) {
    dbReqOptions.startAfter = options.startAfter,
    dbReqOptions.perPage = model.perPage;
  }
  
  if (!key || key.indexOf("?") != -1 || !Lablz.indexedDB.getDataAsync(dbReqOptions)) // only fetch from db on regular resource list or propfind, with no filter
    runDefault();
  else
    options.sync = false; // meaning if we fail to get resources from the server, we let user see the ones in the db
}

// END ///////////// Backbone sync override //////////////// END ///


// START ///////////// Templates and Backbone convenience //////////////// START ///

Backbone.Model.prototype._super = function(funcName){
  return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
};

Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
  if (this.onClose){
    this.onClose();
  }
}

Lablz.models = new Utils.UArray();
Lablz.models.push(packages.Resource);
Lablz.shortNameToModel = {'Resource' : packages.Resource};
Lablz.typeToModel = {};

Lablz.initModel = function(m) {
  if (Lablz.shortNameToModel[m.shortName])
    return;
  
  Lablz.shortNameToModel[m.shortName] = m;
  Lablz.typeToModel[m.type] = m;
  m.prototype.parse = packages.Resource.prototype.parse;
  m.prototype.validate = packages.Resource.prototype.validate;
  var superProps = m.__super__.constructor.properties;
  m.properties = superProps ? _.extend(_.clone(superProps), m.myProperties) : _.clone(m.myProperties);
  var superInterfaces = m.__super__.constructor.interfaces;
  m.interfaces = superInterfaces ? _.extend(_.clone(superInterfaces), m.myInterfaces) : _.clone(m.myInterfaces);
  m.prototype.initialize = Lablz.getInit.apply(m);
};

Lablz.initModels = function(models) {
  models = models || Lablz.models;
  for (var i = 0; i < models.length; i++) {
    var m = models[i];
//    if (Lablz.shortNameToModel[m.shortName])
//      continue;
    if (m.shortName != 'Resource')
      delete Lablz.shortNameToModel[m.shortName];
    
    Lablz.initModel(m);
  }
};

Lablz.getInit = function() {
  var self = this;
  return function() { 
    self.__super__.initialize.apply(this, arguments); 
  }
}

// END ///////////// Templates and Backbone convenience //////////////// END ///


// START ///////////// IndexedDB stuff //////////////// START ///

if ('webkitIndexedDB' in window) {
  window.IDBTransaction = window.webkitIDBTransaction;
  window.IDBKeyRange = window.webkitIDBKeyRange;
}

//Lablz.resourceType = "Urbien";
Lablz.currentUser = {};
Lablz.indexedDB = {};
Lablz.indexedDB.db = null;
Lablz.DB_VERSION = 1;
Lablz.indexedDB.modelStoreOptions = {keyPath: 'type'};
Lablz.indexedDB.paused = false;

Lablz.indexedDB.onerror = function(e) {
  Lablz.currentUser._reset = true;
  Lablz.indexedDB.db && Lablz.indexedDB.db.close();
  Lablz.indexedDB.open();
  console.log("db error: " + e);
};

Lablz.indexedDB.onabort = function(e) {
  console.log("db abort: " + e);
};

Lablz.indexedDB.reset = function() {
  var db = Lablz.indexedDB.db;
  var rModels = Lablz.requiredModels && _.map(Lablz.requiredModels.models, function(model) {return model.shortName}) || [];
  var deleted = [];
  var created = [];
  _.each(db.objectStoreNames, function(name) {            
    db.deleteObjectStore(name);
    deleted.push(name);
    if (_.contains(rModels, name)) {
      db.createObjectStore(name, Lablz.indexedDB.defaultOptions);
      created.push(name);
    }
  })
  
  deleted.length && console.log('1. deleted tables: ' + deleted.join(','));
  created.length && console.log('1. created tables: ' + created.join(','));
  Lablz.currentUser._reset = false;
}

Lablz.indexedDB.onblocked = function(e) {
  console.log("db blocked: " + e);
};

Lablz.indexedDB.defaultOptions = {keyPath: '_uri'};
Lablz.indexedDB.open = function(options, success, error) {
  var modelsChanged = false;
  var request = indexedDB.open("lablz");

  request.onblocked = function(event) {
    alert("Please close all other tabs with this site open!");
  };

  request.onabort = Lablz.indexedDB.onabort;

  var onsuccess;
  request.onsuccess = onsuccess = function(e) {
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    db.onversionchange = function(event) {
      db.close();
      alert("A new version of this page is ready. Please reload!");
    };    

//    var userChanged = false;
//    if (!db.objectStoreNames.contains('sysinfo')) {
//      userChanged = true;
//    }
    
    modelsChanged = !!Lablz.changedModels.length || !!Lablz.newModels.length;
    Lablz.DB_VERSION = Lablz.currentUser._reset || modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
    if (db.version == Lablz.DB_VERSION) {
      if (success)
        success();
      
      return;
    }
    
    if (db.setVersion) {
      console.log('in old setVersion. User changed: ' + Lablz.currentUser._reset + '. Changed models: ' + (Lablz.changedModels.join(',') || 'none') + ', new models: ' + (Lablz.newModels.join(',') || 'none')); // deprecated but needed for Chrome
      
      // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
      var req = db.setVersion(Lablz.DB_VERSION);
      // onsuccess is the only place we can create Object Stores
      req.onerror = Lablz.indexedDB.onerror;
      req.onblocked = Lablz.indexedDB.onblocked;
      req.onsuccess = function(e2) {
        console.log('upgrading db');
        if (Lablz.currentUser._reset)
          Lablz.indexedDB.reset();
        
        if (modelsChanged)
          Lablz.indexedDB.updateStores();
        
        e2.target.transaction.oncomplete = function() {
          console.log('upgraded db');
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
    console.log ("upgrading db");
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    if (Lablz.currentUser._reset) {
      console.log("clearing db");
      Lablz.indexedDB.reset();
    }
    
    if (modelsChanged) {
      console.log("updating stores");
      Lablz.indexedDB.updateStores();
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
    
    Lablz.indexedDB.onerror(e);
  };  
};

//Lablz.indexedDB.loadModels = function(success, error) {
//  var models = [];
//  var db = Lablz.indexedDB.db;
//  var mStore = Lablz.indexedDB.modelStoreName;
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
////      Lablz.shortNameToModel[m.shortName] = Backbone.Model.extend(
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
//    Lablz.indexedDB.onerror(e);
//  }
//}

Lablz.indexedDB.updateStores = function() {
  var db = Lablz.indexedDB.db;
  var models = Utils.union(Lablz.changedModels, Lablz.newModels);
  models = _.map(models, function(uri) {
    var sIdx = uri.lastIndexOf("/");
    return sIdx == -1 ? uri : uri.slice(sIdx + 1);
  });
  
  Lablz.changedModels = [];
  Lablz.newModels = [];
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
      db.createObjectStore(name, Lablz.indexedDB.defaultOptions);
      created.push(name);
    } catch (err) {
      console.log('2. failed to create table ' + name + ': ' + err);
      return;
    }
    
  }
  
  deleted.length && console.log('2. deleted tables: ' + deleted.join(","));
  created.length && console.log('2. created tables: ' + created.join(","));
}

//Lablz.indexedDB.addModels = function(models) {
//  var mStore = Lablz.indexedDB.modelStoreName;
////  var snm = Lablz.shortNameToModel;
//  var db = Lablz.indexedDB.db;
//  var trans = db.transaction([mStore], "readwrite");
//  var store = trans.objectStore(mStore);
//  for (var i = 0; i < models.length; i++) {
//    addModel(models[i]);
//  }
//
//  function addModel(model) {
//    var request;
//    try {
//      request = store.put(model);
//    } catch (err) {
////      db.close();
//      return;
//    }
//    
//    request.onsuccess = function(e) {
//      console.log("Added model " + model.displayName + " to db: ", e);
//    };
//    
//    request.onerror = function(e) {
//      console.log("Error adding model " + model.displayName + " to db: ", e);
//    };    
//  }
//};

Lablz.indexedDB.addItems = function(items, classUri) {
  if (!items || !items.length)
    return;
  
  var db = Lablz.indexedDB.db;
  if (!db)
    return;
  
  var className = classUri.slice(classUri.lastIndexOf("/") + 1);
  if (!db.objectStoreNames.contains(className)) {
    db.close();
    console.log("2. newModel: " + className);
    Lablz.newModels.push(classUri);
    Lablz.indexedDB.open(null, function() {
      Lablz.indexedDB.addItems(items, classUri);
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

Lablz.indexedDB.addItem = function(item, classUri) {
  Lablz.indexedDB.addItems([item instanceof Backbone.Model ? item.toJSON() : item], classUri || item.constructor.type);
}

Lablz.indexedDB.deleteItem = function(uri) {
  var type = Utils.getType(item._uri);
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  var trans = db.transaction([type], IDBTransaction.READ_WRITE);
  var store = trans.objectStore(type);
  var request = store.delete(uri);

  request.onsuccess = function(e) {
//    Lablz.indexedDB.getItems(type);
  };

  request.onerror = function(e) {
    console.log("Error Deleting: ", e);
  };
};

Lablz.indexedDB.getDataAsync = function(options) {
  var uri = options.key;
  var type = Utils.getType(uri);
  if (Utils.endsWith(uri, type))
    return Lablz.indexedDB.getItems(options);
  
  else if (type == null) {
    if (error) error();
    return false;
  }
  
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name], IDBTransaction.READ_ONLY);
  var store = trans.objectStore(name);
  var request = store.get(Utils.getShortUri(uri, Lablz.shortNameToModel[name]));
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

Lablz.indexedDB.getItems = function(options) {
  // var todos = document.getElementById("todoItems");
  // todos.innerHTML = "";
  var type = options.key;
  var success = options.success;
  var error = options.error;
  var startAfter = options.startAfter;
  var total = options.perPage;

  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
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
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
};

// END ///////////// IndexedDB stuff //////////////// END ///

// START /////////// Local Storage //////////// START //
var contactKey = "com.fog.security.contact";
Lablz.checkUser = function() {
  if (!localStorage)
    return; // TODO: use indexedDB
  
  var p = localStorage.getItem(contactKey);
  var c = Lablz.currentUser;
  if ((p && !c) || (!p && c) || (p && c && JSON.parse(p)._uri != c._uri)) {
    // no need to clear localStorage, it's only used to store models, which can be shared
    if (c) {
      localStorage.setItem(contactKey, JSON.stringify(c));
      Lablz.currentUser._reset = true;
    }
    else
      Lablz.currentUser = {_reset: true};
    
    Lablz.newModels = _.filter(_.keys(Lablz.shortNameToModel), function(name) {return name != 'Resource'});
    return;
  }
}
  
Lablz.requiredModels = {};
Lablz.changedModels = new Utils.UArray();
Lablz.newModels = new Utils.UArray();
Lablz.saveModelsToStorage = function() {
  if (!localStorage)
    return; // TODO: use indexedDB
  
  if (!Lablz.models.length)
    return;

  var now = new Date().getTime();
  _.each(Lablz.models, function(model) {
    var modelJson = Utils.toJSON(model);
    modelJson._lastModified = now;
    modelJson._super = model.__super__.constructor.type;
    if (!model.type.endsWith('#Resource'))
      localStorage.setItem(model.type, JSON.stringify(modelJson));
  });  
}

Lablz.initStoredModels = function(models) {
  var filtered = _.filter(models, function(model) {
    if (model.subClassOf != null || model.type.endsWith("#Resource"))
      return true;
    else {
      Lablz.changedModels.push(model.type);
      return false;
    }
  });
  
  if (!filtered.length)
    return models;
  
  var unloaded = [];
  var snm = Lablz.shortNameToModel;
  _.each(filtered, function(m) {
    var sUri = m.subClassOf;
    var sIdx = sUri.lastIndexOf('/');
    var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
    if (!snm[superName]) {
      unloaded.push(m.type);
      return;
    }
    
    var pkgPath = Utils.getPackagePath(m.type);
    var sPath = Utils.getPackagePath(sUri);
    var pkg = Utils.addPackage(pkgPath);
    var model = pkg[m.shortName] = eval((sPath ? sPath + '.' : '') + superName).extend({}, m);
//    var model = eval(pkgPath + '.' + m.shortName + " = " + (sPath ? sPath + '.' : '') + superName + '.extend({},' + m + ');');
    Lablz.initModel(model);
  });
  
  return unloaded;
}

Lablz.loadStoredModels = function(models) {
//  var ttm = Lablz.typeToModel;
  if (Lablz.currentUser._reset)
    return;
  
  var r = models ? {models: models} : Lablz.requiredModels;
  if (!localStorage) {
    _.forEach(r.models, function(model) {
      console.log("1. newModel: " + model.shortName);
      Lablz.newModels.push(model.type);
    });
    
    return; // TODO: use indexedDB
  }
  
  var baseDate = r.lastModified || Lablz.requiredModels.lastModified;
  var toLoad = [];
  _.each(r.models, function(model) {
    var uri = model.type || model;
    if (!uri || !(uri = Utils.getLongUri(uri)))
      return;    
    
    var exists = false;
    var d = baseDate || model.lastModified;
    if (d) {
      var date = (baseDate && model.lastModified) ? Math.max(baseDate, model.lastModified) : d;
      var stored = localStorage.getItem(uri);
      if (stored) {
        exists = true;
        stored = JSON.parse(stored);
        var storedDate = stored._lastModified;
        if (storedDate && storedDate >= date) {
          toLoad.push(stored);
          return;
        }
      }
    }
    
    (exists ? Lablz.changedModels : Lablz.newModels).push(uri);
    return;
  });
  
  if (toLoad.length) {
    var unloaded = Lablz.initStoredModels(toLoad);
    _.each(unloaded, function (m) {Lablz.changedModels.push(m)});
  }
}

// END /////////// Local Storage //////////// END //

//Lablz.pageRoot = "app";
Lablz.serverName = (function() {     
  var baseUriO = document.getElementsByTagName('base');
  var baseUri = "";
  if (baseUriO)
    baseUri = baseUriO[0].href;
  
  var pIdx = baseUri.indexOf(Lablz.pageUrl);
  if (pIdx)
    baseUri = baseUri.slice(0, pIdx);
    
  return baseUri;
})();

Lablz.fetchModels = function(models, options) {
  models = models || Utils.union(Lablz.changedModels, Lablz.newModels);
  var success = options && options.success;
  var error = (options && options.error) || Lablz.Error.getDefaultErrorHandler();

//  if (!error)
  EndLessPage.onNextPageFetched();
  
  if (!models.length) {
    if (success)
      success({fetched: 0});
    return;
  }
  
  var modelsCsv = models.join ? models.join(",") : models;
  $.ajax(Lablz.serverName + "/backboneModel?type=" + encodeURIComponent(modelsCsv), {complete: 
    function(jqXHR, status) {
      if (status != 'success') {
        console.log("couldn't fetch models");
//        alert("Oops! Couldn't initialize awesomeness!");
        if (error)
          error(null, {code: 404, type: status, details: 'couldn\'t reach server'}, options);
        
        return;
      }
        
      try {
        eval(jqXHR.responseText);
      } catch (err) {
        console.log("couldn't eval response from server. Requested models: " + modelsCsv);
        if (error) {
          try {
            var jErr = JSON.parse(jqXHR.responseText);
            error(null, jErr.error, options);
            return;
          } catch (err1) {
            console.log("couldn't parse error response: " + jqXHR.responseText);
          }
          
          error(null, null, options);
        }
        
        return;
      }
      
//      _.extend(packages, p);
      Lablz.initModels();
      if (success)
        success();


      
      setTimeout(Lablz.saveModelsToStorage, 0);
      setTimeout(Lablz.fetchLinkedModels, 0);
    }
  });
}

Lablz.fetchLinkedModels = function() {
  var linked = Lablz.requiredModels.linkedModels;
  if (!linked)
    return;
  
  Lablz.loadStoredModels(linked);
  var numModels = Lablz.models.length;
  var success = function() {
    if (!(Lablz.models.length - numModels))
      return;
    
    Lablz.initModels();
    Lablz.saveModelsToStorage();
  }
}

Lablz.updateTables = function(success, error) {
//  Lablz.checkSysInfo();
//  Lablz.loadAndUpdateModels();
  Lablz.indexedDB.paused = true;
  if (Lablz.indexedDB.db)
    Lablz.indexedDB.db.close();
  
  var s = success;
  success = function() {
    Lablz.indexedDB.paused = false;
    if (s) s();
  }
  
  Lablz.indexedDB.open(null, success, error);
}


Lablz.locationError = function(error) {
  switch (error.code) { 
   case error.PERMISSION_DENIED:
     alert("Could not get position as permission was denied.");
     break;
   case error.POSITION_UNAVAILABLE:
     alert("Could not get position as this information is not available at this time.");
     break;
    case error.TIMEOUT:
      alert("Attempt to get position timed out.");
     break;
    default:
     alert("Sorry, an error occurred. Code: " + error.code + " Message: " + error.message);
     break;  
    }
}

Lablz.userLocation = {};

Lablz.Templates = { 
    // Hash of preloaded templates for the app
    templates: {},
    propTemplates: {
      "string": "stringPT",
      "boolean": "booleanPT",
      "int": "intPT",
      "float": "intPT",
      "double": "intPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/emailAddress": "emailPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/phone": "telPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/mobilePhone": "telPT",
      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPT",
      "http://www.hudsonfog.com/voc/system/primitiveTypes/Duration": "complexDatePT",
      "date": "datePT",
      "resource": "resourcePT",
      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPT",
      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePT",
      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePT"
    },

    propEditTemplates: {
      "string": "stringPET"
//      "boolean": "booleanPET",
//      "int": "intPET",
//      "float": "intPET",
//      "double": "intPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/emailAddress": "emailPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/phone": "telPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/mobilePhone": "telPET",
//      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPET",
//      "http://www.hudsonfog.com/voc/system/primitiveTypes/Duration": "complexDatePET",
//      "date": "datePET",
//      "resource": "resourcePET",
//      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPET",
//      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePET",
//      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePET"
    },

 
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var elts = $('script[type="text/template"]');
      for (var i = 0; i < elts.length; i++) {
        this.templates[elts[i].id] = elts[i].innerHTML;
      }
    },
 
    // Get template by name from hash of preloaded templates
    get: function(name) {
      return this.templates[name];
    },
    
    getPropTemplate: function(prop, edit) {
      var t = edit ? this.propEditTemplates : this.propTemplates;
      var f = 'http://www.hudsonfog.com/voc/system/fog/Property/facet';
      return (prop[f] && t[prop[f]]) || t[prop.range] || (edit ? t.string : t.resource);
    }
};