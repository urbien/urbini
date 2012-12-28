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
  'cache!queryIndexedDB',
  'cache!indexedDBShim'
], function(G, $, __jqm__, _, Backbone, U, Error, Events, Resource, ResourceList, idbq) {
  var MBI = null; // singleton instance
  
  var MB = ModelsBase = function() {
    if (MBI != null)
      throw new Error("Can't instantiate more than one modelsBase module");
    
    this.initialize();
  };
  
  MB.prototype = {};
  MB.prototype.initialize = function() {
    Lablz.idbq = idbq;
    this.TAG = 'Storage';
    this.packages = {'Resource': Resource};
    
    Backbone.Model.prototype._super = function(funcName){
      return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
    };
    
    Backbone.defaultSync = Backbone.sync;
    this.defaultSync = function(method, model, options) {
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
//        G.log(MBI.TAG, 'sync', jqXHR, status);
//        return (err || Error.getDefaultErrorHandler()).apply(this, [model, {type: status}]);
//      });
      
      return req;
    };
    
    /**
     * is 3 minutes old
     */
    isStale = function(ts, now) {
      if (!ts) return true;
      now = now || G.currentServerTime();
      var age = now - ts;
      var stale = age > 180000;
      if (stale)
        G.log(MBI.TAG, 'info', 'data is stale at: ' + age + ' millis old');
      
      return stale;
    };
    
    var setLastFetched = function(lastFetchedOn, options) {
      if (lastFetchedOn) {
        _.extend(options.headers, {"If-Modified-Since": new Date(lastFetchedOn).toUTCString()});        
      }
    };
    
    var tsProp = "davGetLastModified";
    Backbone.sync = function(method, model, options) {
      var now = G.currentServerTime();
      var isCol = model instanceof Backbone.Collection;
      var lastFetchedOn = isCol ? model._lastFetchedOn : (model.collection && model.collection._lastFetchedOn) || model.get('_lastFetchedOn');
      options.headers = options.headers || {};
      
      var isFilter = isCol && _.filter(_.keys(model.queryMap), function(p) {return p.charAt(0)!='$'}).length; // if there are model-specific filter parameters to the API
      var shortPage = isCol && model._lastFetchedOn && !isFilter && model.models.length < model.perPage;
      var stale = false;
      
      // if it's a short page of a basic RL (no filter), we should fetch just in case there are new resources
      if (isCol && !shortPage && lastFetchedOn) {
        var stalest;
        if (options && options.startAfter) {
          var q = U.getQueryParams(options.url);
          var offset = q['$offset'] || 0;
          for (var i = offset; i < model.models.length; i++) {
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
      
        setLastFetched(lastFetchedOn, options);
      }
      else if (!isCol)
        setLastFetched(lastFetchedOn, options);
      
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
          for (var i = 0; i < results.length; i++) {
            var r = results[i];
            var longUri = U.getLongUri(r._uri, {type: model.type, shortNameToModel: MBI.shortNameToModel});
            var saved = model.get(longUri);
            var ts = saved && saved.get(tsProp);
            if (typeof ts === "undefined")
              ts = 0;
            var newLastModified = r[tsProp];
            if (typeof newLastModified === "undefined") 
              newR = 0;
            if (!newLastModified || newLastModified > ts) {
              toAdd.push(r);
            }
            
            r._lastFetchedOn = now;
          }
          
          var modified = [];
          if (toAdd.length) {
            for (var i = 0; i < toAdd.length; i++) {
              toAdd[i]._uri = U.getLongUri(toAdd[i]._uri, {shortNameToModel: MBI.shortNameToModel});
              var existing = model.get(toAdd[i]._uri);
              if (existing) {
                existing.set(toAdd[i]);
                modified.push(toAdd[i]._uri);
              }
              else
                model.add(new model.model(toAdd[i]));
            }
            
          }
          
          setTimeout(function() {          
            MBI.addItems(results, model.type);
          }, 100);
          
          return !!toAdd.length;
        }
      }

      var saveOptions = _.extend(_.clone(options), {
        success: function(resp, status, xhr) {
          var code = xhr.status;
          var err = function() {
            G.log(MBI.TAG, 'error', code, options.url);
            defErr && defErr(resp && resp.error || {code: code}, status, xhr);            
          }
          
          switch (code) {
            case 200:
              break;
            case 304:
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
            model._lastFetchedOn = now;
            var offset = resp.metadata && resp.metadata.offset || 0;
            modified = _.map(model.models.slice(offset), function(model) {return model.get('_uri')});
          }
          else {
            model.set({'_lastFetchedOn': now}, {silent: true});            
            modified = model.get('_uri');
          }
          
          save && save(data);
          defSuccess && defSuccess(resp, status, xhr);
          Events.trigger('refresh', model, modified);
        }
      });
      
      var runDefault = function() {
        return MBI.defaultSync(method, model, saveOptions);
      };
      
      if (method !== 'read' || options.noDB)
        return runDefault();

      var key, now, timestamp, refresh;
      var dbSuccess = function(results) {
        // provide data from indexedDB instead of a network call
        if (!results || (results instanceof Array && !results.length)) {
          return runDefault();
        }

        // simulate a normal async network call
        setTimeout(function(){
          model.lastFetchOrigin = 'db';
//          if (success) {
            G.log(MBI.TAG, 'db', "got resources from db");
            defSuccess(results, 'success', null);
//          }
          
          if (!isFilter && isCol && (results.length < model.perPage || _.any(results, function(m)  {return isStale(m._lastFetchedOn, now); }))) {
            return runDefault();
          }
        }, 0);    
      }
      
      var dbError = function(e) {
        if (e) G.log(MBI.TAG, 'error', "Error fetching data from db: " + e);
        runDefault();
      }
      
      // only override sync if it is a fetch('read') request
      key = this.getKey && this.getKey();
      var dbReqOptions = {key: key, success: dbSuccess, error: dbError, syncOptions: options};
      if (model instanceof Backbone.Collection) {
        dbReqOptions.startAfter = options.startAfter,
        dbReqOptions.perPage = model.perPage;
      }
      
      // only fetch from db on regular resource list or propfind, with no filter
      var dbHasGoodies;
      if (!key || isFilter || !(dbHasGoodies = MBI.getDataAsync(dbReqOptions))) {
        if (G.online)
          runDefault();
        else if (!dbHasGoodies) {
//          runDefault();
          options.sync && options.error && options.error(model, {type: 'offline'}, options);
        }
      }
      
//      else
//        options.sync = false; // meaning if we fail to get resources from the server, we let user see the ones in the db
    };

    this.models = []; // new U.UArray();
    this.changedModels = []; // new U.UArray();
    this.newModels = []; // new U.UArray();
    this.models.push(this.packages.Resource);
    this.shortNameToModel = {'Resource': this.packages.Resource};
    this.typeToModel = {};

    this.fetchModels = function(models, options) {
      models = models || _.union(MBI.changedModels, MBI.newModels);
      options = options || {};
      var success = options.success;
      var error = options.error || Error.getDefaultErrorHandler();

      if (models.length) {
        models = models.join ? models : [models];
        var snm = MBI.shortNameToModel;
        var now = G.currentServerTime();
        models = _.map(models, function(m) {
          var model = snm[U.getShortName(m)];
          if (model) {
            var lm = model.lastModified;
            if (now - lm < 360000) // consider model stale after 1 hour
              return null;
            
            var info = {uri: m};
            if (lm)
              info.lastModified = lm;
            
            return info;
          }
          else
            return m;
        }).filter(function (m) {return m}); // filter out nulls
      }
      
      if (!models.length) {
        if (success)
          success({fetched: 0});
        
        return;
      }
      
      if (!G.online) {
        if (error)
          error(null, {type: 'offline'}, options);
        
        return;
      }
      
      var modelsCsv = JSON.stringify(models);
      G.startedTask("ajax models");
      $.ajax({
        url: G.serverName + "/backboneModel", 
        type: 'POST',
        data: {"models": modelsCsv},
        timeout: 5000,
        complete: function(jqXHR, status) {
          if (status != 'success') {
            G.log(MBI.TAG, 'error', "couldn't fetch models");
            var errArgs = [null, {type: status}, options];
            return error.apply(this, errArgs);
          }
            
          var data;
          try {
            data = JSON.parse(jqXHR.responseText);
          } catch (err) {
            G.log(MBI.TAG, 'error', "couldn't eval JSON from server. Requested models: " + modelsCsv);
            error(null, null, options);            
            return;
          }
          
          if (data.error) {
            error(null, data.error, options);
            return;
          }
          
          var mz = data.models;
          var pkg = data.packages;
          if (pkg)
            U.deepExtend(MBI.packages, pkg);
          
          G.classUsage = _.union(G.classUsage, data.classUsage);          
          G.linkedModels = data.linkedModels; //_.union(G.linkedModels, data.linkedModels);
          
          var newModels = [];
          for (var i = 0; i < mz.length; i++) {
            var p = mz[i].path;
            var lastDot = p.lastIndexOf('.');
            var path = p.slice(0, lastDot);
            var name = p.slice(lastDot + 1);
            var sup = mz[i].sPath;
            
            // mz[i].p and mz[i].s are the private and static members of the Backbone.Model being created
            var m = U.leaf(MBI.packages, path)[name] = U.leaf(MBI.packages, sup).extend(mz[i].p, mz[i].s);
            U.pushUniq(newModels, m);
          }
          
          for (var i = 0; i < newModels.length; i++) {
            U.pushUniq(MBI.models, newModels[i]); // preserve order of MBI.models
          }
          
          MBI.initModels();
          if (success)
            success();
          
          G.finishedTask("ajax models");
          
          setTimeout(function() {MBI.saveModelsToStorage(newModels)}, 0);
          setTimeout(MBI.fetchLinkedModels, 0);
        }
      });
    };

    this.fetchLinkedModels = function() {
      var linked = G.linkedModels;
      if (!linked)
        return;
      
      MBI.loadStoredModels(linked);
      var numModels = MBI.models.length;
      var success = function() {
        if (!(MBI.models.length - numModels))
          return;
        
        MBI.initModels();
        MBI.saveModelsToStorage(MBI.models.slice(numModels));
      }
    };

    this.updateDB = function(res) {
//      var self = this;
      if (res.lastFetchOrigin != 'db' && !res.collection) // if this resource is part of a collection, the collection will update the db in bulk
        setTimeout(function() {MBI.addItem(res)}, 100);
    };
    
//    varRinde rInit = Resource.initialize;
//    Resource.initialize = function() {
//      rInit.apply(this, arguments);
//      this.on('change', MBI.updateDB);
//    };

    this.initModel = function(m) {
      if (MBI.shortNameToModel[m.shortName])
        return;
      
      m.lastModified = new Date().getTime();
      MBI.shortNameToModel[m.shortName] = m;
      MBI.typeToModel[m.type] = m;
      m.prototype.parse = Resource.prototype.parse;
      m.prototype.validate = Resource.prototype.validate;
      var superProps = m.__super__.constructor.properties;
      m.properties = superProps ? _.extend(_.clone(superProps), m.myProperties) : _.clone(m.myProperties);
      var superInterfaces = m.__super__.constructor.interfaces;
      m.interfaces = superInterfaces ? _.extend(_.clone(superInterfaces), m.myInterfaces) : _.clone(m.myInterfaces);
      m.prototype.initialize = MBI.getInit.apply(m);
    };
    
    this.getInit = function() {
      var self = this;
      return function() { 
        self.__super__.initialize.apply(this, arguments); 
        this.on('change', MBI.updateDB);
      }
    };
    
    this.initModels = function(models) {
      models = models || MBI.models;
      for (var i = 0; i < models.length; i++) {
        var m = models[i];
    //    if (MBI.shortNameToModel[m.shortName])
    //      continue;
        if (m.shortName != 'Resource')
          delete MBI.shortNameToModel[m.shortName];
        
        MBI.initModel(m);
      }
    };
    
    this.contactKey = "com.fog.security.contact";
    this.checkUser = function() {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      var p = localStorage.getItem(MBI.contactKey);
      var c = G.currentUser;
      if (p && !c.guest && JSON.parse(p)._uri != c._uri) {
        // no need to clear localStorage, it's only used to store models, which can be shared
        if (c.guest)
          G.currentUser = {_reset: true, guest: true};
        else {
          localStorage.setItem(MBI.contactKey, JSON.stringify(c));
          G.userChanged = true;
        }
        
        MBI.newModels = _.filter(_.keys(MBI.shortNameToModel), function(name) {return name != 'Resource'});
        return;
      }
    };
    
    this.saveModelsToStorage = function(models) {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      var models = models || MBI.models;
      if (!models.length)
        return;
    
      var now = new Date().getTime();
      _.each(models, function(model) {
        var modelJson = U.toJSON(model);
        modelJson._lastModified = now;
        modelJson._super = model.__super__.constructor.type;
        if (!model.type.endsWith('#Resource'))
          MBI.storeModel(model, modelJson);
      });  
    };
    
    this.initStoredModels = function(models) {
      var filtered = _.filter(models, function(model) {
        if (model.subClassOf != null || model.type.endsWith("#Resource"))
          return true;
        else {
          U.pushUniq(MBI.changedModels, model.type);
          return false;
        }
      });
      
      if (!filtered.length)
        return models;
      
      var unloaded = [];
      var snm = MBI.shortNameToModel;

//      var loadOne = function(m, superName, sUri) {
//        var pkgPath = U.getPackagePath(m.type);
//        var sPath = U.getPackagePath(sUri);
//        var pkg = U.addPackage(MBI.packages, pkgPath);
//        if (snm[m.shortName])
//          delete snm[m.shortName];
//        
//        var model = pkg[m.shortName] = U.leaf(MBI, (sPath ? sPath + '.' : '') + superName).extend({}, m);
//        MBI.initModel(model);        
//      };
//      
//      var loadModelChain = function(model) {
//        if (!G.hasLocalStorage)
//          return;
//        
//        var sup = model.subClassOf;
//        if (!sup)
//          return;
//        
//        if (sup == 'Resource') {
//          loadOne(model, sup, sup);
//          return true;
//        }
//          
//        sup = sup.startsWith('http') ? sup : 'http://www.hudsonfog.com/voc/' + sup;
//        var sModel = MBI.getModelFromLS(sup);
//        if (!sModel)
//          return;
//        
//        loadModelChain(JSON.parse(sModel));
//        loadOne(model, U.getType(sup), sup);
//      };
      
      _.each(filtered, function(m) {
        var sUri = m.subClassOf;
        var sIdx = sUri.lastIndexOf('/');
        var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
        if (!snm[superName]) {
          unloaded.push(m.type);
//          loadModelChain(m);
          return;
        }
        
//        loadOne(m, superName, sUri);
        var pkgPath = U.getPackagePath(m.type);
        var sPath = U.getPackagePath(sUri);
        var pkg = U.addPackage(MBI.packages, pkgPath);
        if (snm[m.shortName])
          delete snm[m.shortName];
        
        var model = pkg[m.shortName] = U.leaf(MBI, (sPath ? sPath + '.' : '') + superName).extend({}, m);
        MBI.initModel(model);        
      });
      
      
      return unloaded;
    };
    
    this.getModelFromLS = function(uri) {
      return localStorage.getItem('model:' + uri);
    };
    
    this.storeModel = function(model, modelJson) {
      localStorage.setItem('model:' + model.type, JSON.stringify(modelJson));
    };
    
    this.loadStoredModels = function(options) {
    //  var ttm = MBI.typeToModel;
      if (G.userChanged)
        return;

      var r = options && options.models ? {models: _.clone(options.models)} : {models: _.clone(G.models)};
      var hash =  window.location.hash && window.location.hash.slice(1);
      var added;
//      var willLoadCurrentModel = false;
      if (hash) {
        var qIdx = hash.indexOf('?');
        if (qIdx != -1)
          hash = hash.slice(0, qIdx);
        
        var type;
        if (hash.startsWith('http'))
          type = decodeURIComponent(hash);
        else if (hash.startsWith('view/http')) {
          type = decodeURIComponent(hash.slice(5)).replace("sql/", "");
          
          qIdx = type.indexOf('?');
          if (qIdx != -1)
            type = type.slice(0, qIdx);
        }
        else
          type = U.getType(hash);
        
        type = type && type.startsWith(G.serverName) ? 'http://' + type.slice(G.serverName.length + 1) : type;
        if (type && !_.filter(r.models, function(m) {return (m.type || m).endsWith(type)}).length) {
          r.models.push(type);
          added = type;
        }
      }
      
      if (!G.hasLocalStorage) {
        if (r) {
          _.forEach(r.models, function(model) {
            G.log(MBI.TAG, 'db', "1. newModel: " + model.shortName);
            U.pushUniq(MBI.newModels, model.type);
          });
        }
        
        return; // TODO: use indexedDB
      }

      var extraModels = [];
      for (var i = 0; i < r.models.length; i++) {
        var model = r.models[i];
        var uri = model.type || model;
        if (!uri || !(uri = U.getLongUri(uri, {shortNameToModel: MBI.shortNameToModel}))) {
          r.models[i] = null;
          continue;
        }
        
        var jm = MBI.getModelFromLS(uri);
        if (!jm) {
          U.pushUniq(MBI.newModels, uri);
          r.models[i] = null;
          continue;
        }
        
        jm = JSON.parse(jm);
        if (model !== added) {
          r.models[i] = _.extend(jm, model);
          continue;
        }
        
        r.models[i] = null;
        var sup;
        extraModels.push(jm);
        while ((sup = jm.subClassOf) != 'Resource') {
          sup = sup.startsWith('http') ? sup : G.defaultVocPath + sup;
          var m = MBI.getModelFromLS(sup);
          if (m) {
            jm = JSON.parse(m);
            extraModels.push(jm);
          }
        }
      }
      
      r.models = _.filter(r.models, function(m) {return !!m}); // filter out nulls
      while (extraModels.length) {
        r.models.push(extraModels.pop());
      }
      
      var toLoad = [];
      var baseDate = r.lastModified || G.lastModified;
      _.each(r.models, function(model) {
//        var exists = false;
        var d = baseDate || model.lastModified;
        if (d) {
          var date = (baseDate && model.lastModified) ? Math.max(baseDate, model.lastModified) : d;
//          var stored = localStorage.getItem('model:' + uri);
//          if (stored) {
//            exists = true;
//            stored = JSON.parse(stored);
            var storedDate = model._lastModified;
            if (storedDate && storedDate >= date) {
              toLoad.push(model);
              return;
            }
//          }
        }
        
        U.pushUniq(MBI.changedModels, model.type);
        return;
      });
      
      if (toLoad.length) {
        var unloaded = MBI.initStoredModels(toLoad);
        _.each(unloaded, function (m) {
          U.pushUniq(MBI.changedModels, m);
        });
      }
    };

    /////////////////////////////////////////// START IndexedDB stuff ///////////////////////////////////////////
    this.db = null;
    this.VERSION = 1;
    this.modelStoreOptions = {keyPath: 'type'};
    this.paused = false;
    
    this.onerror = function(e) {
      G.userChanged = true;
      MBI.db && MBI.db.close();
      MBI.open();
      G.log(MBI.TAG, ['error', 'db'], "db error: " + JSON.stringify(e));
    };
    
    this.onabort = function(e) {
      G.log(MBI.TAG, ['error', 'db'], "db abort: " + e);
    };
    
//    this.reset = function() {
//      var db = MBI.db;
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
//          db.createObjectStore(name, MBI.defaultOptions);
//          created.push(name);
//        }
//      })
//      
//      deleted.length && G.log(MBI.TAG, 'db', '1. deleted tables: ' + deleted.join(','));
//      created.length && G.log(MBI.TAG, 'db', '1. created tables: ' + created.join(','));
//      G.userChanged = false;
//    }
    
    this.onblocked = function(e) {
      G.log(MBI.TAG, ['error', 'db'], "db blocked: " + e);
    };
    
    this.defaultOptions = {keyPath: '_uri'};
    this.open = function(options, success, error) {
      var modelsChanged = false;
      var request = indexedDB.open("lablz");
    
      request.onblocked = function(event) {
        alert("Please close all other tabs with this site open!");
      };
    
      request.onabort = MBI.onabort;
    
      var onsuccess;
      request.onsuccess = onsuccess = function(e) {
        MBI.db = e.target.result;
        var db = MBI.db;
        db.onversionchange = function(event) {
          db.close();
          alert("A new version of this page is ready. Please reload!");
        };    
    
        modelsChanged = !!MBI.changedModels.length || !!MBI.newModels.length;
        MBI.VERSION = G.userChanged || modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
        if (db.version == MBI.VERSION) {
          if (success)
            success();
          
          return;
        }
        
        if (db.setVersion) {
          G.log(MBI.TAG, 'db', 'in old setVersion. User changed: ' + G.userChanged + '. Changed models: ' + (MBI.changedModels.join(',') || 'none') + ', new models: ' + (MBI.newModels.join(',') || 'none')); // deprecated but needed for Chrome
          
          // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
          var req = db.setVersion(MBI.VERSION);
          // onsuccess is the only place we can create Object Stores
          req.onerror = MBI.onerror;
          req.onblocked = MBI.onblocked;
          req.onsuccess = function(e2) {
            G.log(MBI.TAG, 'db', 'upgrading db');
            if (G.userChanged)
              MBI.updateStores(reset) && (G.userChanged = false);
            else if (modelsChanged)
              MBI.updateStores();
            
            e2.target.transaction.oncomplete = function() {
              G.log(MBI.TAG, 'db', 'upgraded db');
              if (success)
                success();
            };
          };      
        }
        else {
          db.close();
          var subReq = indexedDB.open("lablz", MBI.VERSION);
          subReq.onsuccess = request.onsuccess;
          subReq.onerror = request.onerror;
          subReq.onupgradeneeded = request.onupgradeneeded;
        }
      };
      
      request.onupgradeneeded = function(e) {
        console.log ("upgrading db");
        MBI.db = e.target.result;
        var db = MBI.db;
        if (G.userChanged) {
          G.log(MBI.TAG, 'db', "clearing db");
          MBI.updateStores(reset) && (G.userChanged = false);
        }
        else if (modelsChanged) {
          G.log(MBI.TAG, 'db', "updating stores");
          MBI.updateStores();
        }
        
        e.target.transaction.oncomplete = function() {
          G.log(MBI.TAG, 'db', "upgraded db");
          if (success)
            success();
        };
      };      
      
      request.onerror = function(e) {
        if (error)
          error(e);
        
        MBI.onerror(e);
      };  
    };
    
    this.updateStores = function(reset) {
      var db = MBI.db;
      var toDel = _.union(MBI.changedModels, MBI.newModels);
      var models = _.union(toDel, _.map(G.linkedModels, function(m){return m.type}));
      if (reset)
        models = _.union(models, G.models, G.linkedModels);

      models = _.filter(models, function(m) {
        return _.contains(G.classUsage, m);
      });

      toDel = _.map(toDel, U.getType);
      models = _.map(models, U.getType);
//      models = _.map(models, function(uri) {
//        var sIdx = uri.lastIndexOf("/");
//        return sIdx == -1 ? uri : uri.slice(sIdx + 1);
//      });
      
      MBI.changedModels.length = 0;
      MBI.newModels.length = 0;
      if (!models.length)
        return;
      
      var deleted = [];
      var created = [];
      for (var i = 0; i < models.length; i++) {
        var name = models[i];
        if (db.objectStoreNames.contains(name)) {
          if (reset || _.contains(toDel, name)) {
            try {
              db.deleteObjectStore(name);
              deleted.push(name);
            } catch (err) {
              G.log(MBI.TAG, ['error', 'db'], '2. failed to delete table ' + name + ': ' + err);
              return;
            }
          }          
          else
            continue;
        }
        

        try {
          var store = db.createObjectStore(name, MBI.defaultOptions);
          var m = MBI.shortNameToModel[name];
          if (m) {
            var indices = [];
            var vc = m.viewCols;
            vc = vc ? vc.split(',') : [];
            _.each(vc, function(pName) {
              pName = pName.trim();
              store.createIndex(pName, pName, {unique: false});              
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
          G.log(MBI.TAG, ['error', 'db'], '2. failed to create table ' + name + ': ' + err);
          return;
        }
        
      }
      
      deleted.length && G.log(MBI.TAG, 'db', '2. deleted tables: ' + deleted.join(","));
      created.length && G.log(MBI.TAG, 'db', '2. created tables: ' + created.join(","));
    }
    
    this.addItems = function(items, classUri) {
      if (!items || !items.length)
        return;
      
      var db = MBI.db;
      if (!db)
        return;
      
      var className = classUri.slice(classUri.lastIndexOf("/") + 1);
      if (!db.objectStoreNames.contains(className)) {
        db.close();
        G.log(this.TAG, "db", "2. newModel: " + className);
        U.pushUniq(MBI.newModels, classUri);
        MBI.open(null, function() {
          MBI.addItems(items, classUri);
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
          G.log(MBI.TAG, ['error', 'db'], "Error adding item to db: ", e);
        };
      });
      
      G.log(MBI.TAG, 'db', "added some " + className + " to db");
    };
    
    this.addItem = function(item, classUri) {
      MBI.addItems([item instanceof Backbone.Model ? item.toJSON() : item], classUri || item.constructor.type);
    }
    
    this.deleteItem = function(uri) {
      var type = U.getType(item._uri);
      var name = U.getClassName(type);
      var db = MBI.db;
      var trans = db.transaction([type], IDBTransaction.READ_WRITE);
      var store = trans.objectStore(type);
      var request = store.delete(uri);
    
      request.onsuccess = function(e) {
    //    MBI.getItems(type);
      };
    
      request.onerror = function(e) {
        G.log(MBI.TAG, ['error', 'db'], "Error Deleting: ", e);
      };
    };
    
    this.getDataAsync = function(options) {
      var uri = options.key;
      var type = U.getType(uri);
      if (U.endsWith(uri, type))
        return MBI.getItems(options);
      else if (type == null) {
        if (error) error();
        return false;
      }
      
      var name = U.getClassName(type);
      var db = MBI.db;
      if (!db || !db.objectStoreNames.contains(name))
        return false;
      
      var trans = db.transaction([name], IDBTransaction.READ_ONLY);
      var store = trans.objectStore(name);
      var request = store.get(uri);
      request.onsuccess = function(e) {
        if (options.success) {
          if (e.target.result && e.target.result.value)
            options.syncOptions.sync = false;
            
          options.success(e.target.result)
        }
      };
      
      request.onerror = function(e) {
        if (error)
          error(e);
        
        MBI.onerror(e);
      }
      
      return true;
    }
    
    this.getItems = function(options) {
      // var todos = document.getElementById("todoItems");
      // todos.innerHTML = "";
      var type = options.key;
      var success = options.success;
      var error = options.error;
      var startAfter = options.startAfter;
      var total = options.perPage;
    
      var name = U.getClassName(type);
      var db = MBI.db;
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
          if (!total || results.length < total) {
            result.continue();
            return;
          }
        }
        
        if (success) {
          if (results.length)
            options.syncOptions.sync = false;

          success(results);
        }
      };
    
      cursorRequest.onerror = function (e) {
        if (error)
          error(e);
        
        MBI.onerror(e);
      }
      
      return true;
    };

    this.updateTables = function(success, error) {
    //  MBI.checkSysInfo();
    //  MBI.loadAndUpdateModels();
      MBI.paused = true;
      if (MBI.db)
        MBI.db.close();
      
      var s = success;
      success = function() {
        MBI.paused = false;
        if (s) s();
      }
      
      MBI.open(null, success, error);
    };

    this.fetchModelsForLinkedResources = function(model) {
      model = model || model.constructor;
      var tmp = []; // new U.UArray();
      _.forEach(model.properties, function(p) {
        p.range && tmp.push(p.range);
      });
      
      var linkedModels = [];
      var l = G.linkedModels;
      for (var i = 0; i < l.length; i++) {
        // to preserve order
        if (_.contains(tmp, l[i].type)) {
          var m = l[i];
          var j = i;
          var supers = [];
          while (j > 0 && l[j].superName == l[--j].shortName) {
            var idx = linkedModels.indexOf(l[j]);
            if (idx != -1) {
              linkedModels.remove(idx, idx);
            }
            
            supers.push(l[j]);
          }
          
          if (supers.length) {
            var s;
            while (!!(s = supers.pop())) {
              linkedModels.push(s);
            }
          }
          
          linkedModels.push(l[i]);
        }
      }
      
      if (linkedModels.length) {
//        linkedModels = _.uniq(linkedModels);
        MBI.loadStoredModels({models: linkedModels});
        MBI.fetchModels(null, {sync: false});
      }
    };

    //////////////////////////////////////////////////// END indexedDB stuff ///////////////////////////////////////////////////////////
  }
  
  MB.getInstance = function() {
    if (MBI === null) {
      Lablz.MBI = MBI = new MB();
    }
    
    return MBI;
  };
    
  return ModelsBase.getInstance();
});