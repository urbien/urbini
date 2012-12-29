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
  'cache!indexedDBShim',
  'cache!queryIndexedDB'
], function(G, $, __jqm__, _, Backbone, U, Error, Events, Resource, ResourceList, __idbShim__, idbq) {
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
//            r._lastFetchedOn = now;
          }
          
          var modified = [];
          if (toAdd.length) {
            for (var i = 0; i < toAdd.length; i++) {
              toAdd[i]._uri = U.getLongUri(toAdd[i]._uri, MBI);
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
          
          if (isCol)
            model._lastFetchedOn = now;
          
          var ms = isCol ? model.models : [model];
          _.each(ms, function(m) {
            m.set({'_lastFetchedOn': now}, {silent: true});
          });              

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
//            model._lastFetchedOn = now;
            var offset = resp.metadata && resp.metadata.offset || 0;
            modified = _.map(model.models.slice(offset), function(model) {return model.get('_uri')});
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
            G.log(MBI.TAG, 'db', "got resources from db: " + (model.type || model.constructor.type));
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
    this.shortNameToModel = this.snm = {'Resource': this.packages.Resource};
    this.typeToModel = {};

    this.fetchModels = function(models, options) {
      models = models ? (typeof models === 'string' ? [models] : models) : _.union(MBI.changedModels, MBI.newModels);
      options = options || {};
      var success = options.success;
      var error = options.error || Error.getDefaultErrorHandler();

      if (models.length) {
        models = models.join ? models : [models];
        var now = G.currentServerTime();
        models = _.map(models, function(m) {
          var model = MBI.snm[U.getShortName(m)];
          if (model) {
            var lm = model._dateStored ? model._dateStored : model.lastModified;
            if (lm && now - lm < 360000) // consider model stale after 1 hour
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
      var useWorker = window.Worker && !options.sync;
      var complete = function() {
        var responseText;
        var data;
        if (useWorker) 
          // XHR
          data = arguments[0];
        else {                                
          // $.ajax
          responseText = arguments[0].responseText;
          var status = arguments[1];
          if (status != 'success') {
            G.log(MBI.TAG, 'error', "couldn't fetch models");
            var errArgs = [null, {type: status}, options];
            return error.apply(this, errArgs);
          }
          
          try {
            data = JSON.parse(responseText);
          } catch (err) {
            G.log(MBI.TAG, 'error', "couldn't eval JSON from server. Requested models: " + modelsCsv);
            error(null, null, options);            
            return;
          }
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
//        setTimeout(MBI.fetchLinkedModels, 0);
      };
      
      if (useWorker) {
        var xhr = new Worker(G.serverName + '/js/xhrWorker.js');
        xhr.onmessage = function(event) {
          if (typeof event.data === 'string')
            complete({error: {code: 404}});
          else
            complete(event.data);
        };
        xhr.onerror = function(err) {
          console.log(JSON.stringify(err));
        };
        
        xhr.postMessage({type: 'JSON', url: G.modelsUrl + '?models=' + encodeURIComponent(modelsCsv)});
      }
      else {
        $.ajax({
          url: G.modelsUrl, 
          type: 'POST',
          data: {"models": modelsCsv},
          timeout: 5000,
          complete: complete
        });
      }
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
      
//      m.lastModified = new Date().getTime();
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
    
      var now = G.currentServerTime();
      _.each(models, function(model) {
        if (model.type.endsWith('#Resource'))
          return;
        
        var modelJson = U.toJSON(model);
        modelJson._dateStored = now;
        modelJson._super = model.__super__.constructor.type;
        MBI.storeModel(model, modelJson);
      });  
    };

    this.loadModel = function(modelJson, sUri, superName) {
      superName = superName || sUri.slice(sUri.lastIndexOf('/') + 1); 
      var pkgPath = U.getPackagePath(modelJson.type);
      var sPath = U.getPackagePath(sUri);
      var pkg = U.addPackage(MBI.packages, pkgPath);
      var sName = modelJson.shortName;
      if (MBI.snm[sName])
        delete MBI.snm[sName];
      
      var model = pkg[sName] = U.leaf(MBI, (sPath ? sPath + '.' : '') + superName).extend({}, modelJson);
      MBI.initModel(model);
    };
    
    this.getModelChain = function(model) {
      if (!G.hasLocalStorage)
        return null;
      
      var sup = model.subClassOf;
      if (!sup)
        throw new Error('every model except Resource must be a subClassOf of another model');
      
      if (sup == 'Resource')
        return [model];
        
      sup = sup.startsWith('http') ? sup : 'http://www.hudsonfog.com/voc/' + sup;
      var sModel = MBI.getModelFromLS(sup);
      if (!sModel)
        return null;
      
      sModel = JSON.parse(sModel);
      var sChain = MBI.getModelChain(sModel);
      return sChain == null ? null : sChain.concat(model);
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
      _.each(filtered, function(m) {
        var sUri = m.subClassOf;
        var sIdx = sUri.lastIndexOf('/');
        var superName = sIdx == -1 ? sUri : sUri.slice(sIdx + 1);
        if (!MBI.snm[superName]) {
          if (_.contains(unloaded, m))
            return;
          
          var chain = MBI.getModelChain(m);
          if (chain) {
            var fresh = [], stale = [];
            MBI.filterExpired(null, chain, fresh, stale);
            if (stale.length)
              unloaded.push(m);
          }
          else
            unloaded.push(m);
          
          return;
        }
        
        MBI.loadModel(m, sUri, superName);
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
        if (type && !MBI.typeToModel[type] && !_.filter(r.models, function(m) {return (m.type || m).endsWith(type)}).length) {
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
      
      var extraModels;
      var types = {};
      var expanded = [];
      for (var i = 0; i < r.models.length; i++) {
        var model = r.models[i];
        var uri = model.type || model;
        if (!uri || !(uri = U.getLongUri(uri, MBI)))
          continue
        
        if (types[uri] || MBI.typeToModel[uri])
          continue;
        
        var jm;
        if (model._dateStored)
          jm = model;
        else {
          jm = MBI.getModelFromLS(uri);
          if (!jm) {
            U.pushUniq(MBI.newModels, uri);
//            r.models[i] = null;
            continue;
          }
        
          jm = JSON.parse(jm);
        }
        
        if (jm) { 
//          r.models[i] = jm;
          if (types[jm.subClassOf]) {
            expanded.push(jm);
          }
          else {
            expanded = expanded.concat(MBI.getModelChain(jm));
          }
          
          types[uri] = true;
        }
        
//        if (model === added) {
//          if (!_.contains(r.models, jm))
//            extraModels = MBI.getModelChain(jm);
//        }
//        else { 
//          r.models[i] = _.extend(jm, model);
//          continue;          
//        }
//        r.models[i] = null;
//        var sup;
//        extraModels.push(jm);
//        while ((sup = jm.subClassOf) != 'Resource') {
//          sup = sup.startsWith('http') ? sup : G.defaultVocPath + sup;
//          var m = MBI.getModelFromLS(sup);
//          if (m) {
//            jm = JSON.parse(m);
//            extraModels.push(jm);
//          }
//        }
      }
      
      delete types;
//      var types = [];
//      var expanded = [];
//      for (var i = 0; i < r.models; i++) {
//        
//      }
//      
//      r.models = _.compact(r.models); // filter out nulls
//      if (extraModels) {
//        while (extraModels.length) {
//          r.models.push(extraModels.pop());
//        }
//      }

      var stale = []
      var fresh = [];
      MBI.filterExpired({lastModified: r.lastModified}, expanded, fresh, stale);
      _.each(stale, function() {U.pushUniq(MBI.changedModels)});
      
      if (fresh.length) {
        var unloaded = MBI.initStoredModels(fresh);
        _.each(unloaded, function (m) {
          U.pushUniq(MBI.changedModels, m);
        });
      }
    };
    
    this.filterExpired = function(info, models, fresh, stale) {
      var baseDate = (info && info.lastModified) || G.lastModified;
      _.each(models, function(model) {
        var d = baseDate || model.lastModified;
        if (d) {
          var date = (baseDate && model.lastModified) ? Math.max(baseDate, model.lastModified) : d;
            var storedDate = model._dateStored;
            if (storedDate && storedDate >= date) {
              fresh.push(model);
              return;
            }
        }
        
        U.pushUniq(stale, model.type);
        return;
      });
    }

    /////////////////////////////////////////// START IndexedDB stuff ///////////////////////////////////////////
    this.db = null;
    this.VERSION = 1;
    this.modelStoreOptions = {keyPath: 'type'};
    this.paused = false;
    
    this.onerror = function(e) {
      G.userChanged = true;
//      G.recordCheckpoint("closing db due to error");
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
      G.log(MBI.TAG, 'db', "opening db");
      var request = indexedDB.open("lablz");
    
      request.onblocked = function(event) {
        alert("Please close all other tabs with this site open!");
      };
    
      request.onabort = MBI.onabort;
    
      var onsuccess;
      request.onsuccess = onsuccess = function(e) {
        G.log(MBI.TAG, 'db', 'open db onsuccess');
        MBI.db = e.target.result;
        var db = MBI.db;
        db.onversionchange = function(event) {
          G.log(MBI.TAG, 'db', 'closing db - onversionchange');
          db.close();
          alert("A new version of this page is ready. Please reload!");
        };    
     
        modelsChanged = !!MBI.changedModels.length || !!MBI.newModels.length;
        MBI.VERSION = G.userChanged || modelsChanged ? (isNaN(db.version) ? 1 : parseInt(db.version) + 1) : db.version;
        if (db.version == MBI.VERSION) {
          if (success)
            success();
          
//          G.recordCheckpoint("done prepping db");
          G.log(MBI.TAG, 'db', "done prepping db");
          return;
        }
        
//          G.recordCheckpoint("upgrading db");
        G.log(MBI.TAG, 'db', 'about to upgrade db');
        if (db.setVersion) {
          G.log(MBI.TAG, 'db', 'in old setVersion. User changed: ' + G.userChanged + '. Changed models: ' + (MBI.changedModels.join(',') || 'none') + ', new models: ' + (MBI.newModels.join(',') || 'none')); // deprecated but needed for Chrome
          
          // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
          var req = db.setVersion(MBI.VERSION);
          // onsuccess is the only place we can create Object Stores
          req.onerror = MBI.onerror;
          req.onblocked = MBI.onblocked;
          req.onsuccess = function(e2) {
            G.log(MBI.TAG, 'db', 'db.setVersion onsuccess');
            if (G.userChanged)
              MBI.updateStores(reset) && (G.userChanged = false);
            else if (modelsChanged)
              MBI.updateStores();
            
            e2.target.transaction.oncomplete = function() {
//              G.recordCheckpoint("done upgrading db");
              G.log(MBI.TAG, 'db', 'db.setVersion transaction.oncomplete');
              if (success)
                success();
            };
          };      
        }
        else {
          G.log(MBI.TAG, 'db', 'upgrading db (via onupgradeneeded, using FF are ya?)');
//          G.recordCheckpoint("upgrading db");
          db.close();
          var subReq = indexedDB.open("lablz", MBI.VERSION);
          subReq.onsuccess = request.onsuccess;
          subReq.onerror = request.onerror;
          subReq.onupgradeneeded = request.onupgradeneeded;
        }
      };
      
      request.onupgradeneeded = function(e) {
//        G.recordCheckpoint("db, onupgradeneeded callback");
        G.log(MBI.TAG, 'db', 'onupgradeneeded callback');
        MBI.db = e.target.result;
        if (G.userChanged) {
          G.log(MBI.TAG, 'db', "clearing db");
          MBI.updateStores(reset) && (G.userChanged = false);
        }
        else if (modelsChanged) {
          G.log(MBI.TAG, 'db', "updating db stores");
          MBI.updateStores();
        }
        
        e.target.transaction.oncomplete = function() {
//          G.recordCheckpoint("done upgrading db");
          G.log(MBI.TAG, 'db', "onupgradeneeded transaction.oncomplete");
          if (success)
            success();
        };
      };      
      
      request.onerror = function(e) {
        G.log(MBI.TAG, 'db', "error opening db");
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
              G.log(MBI.TAG, 'db', 'deleting object store: ' + name);
              db.deleteObjectStore(name);
              G.log(MBI.TAG, 'db', 'deleted object store: ' + name);
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
          G.log(MBI.TAG, 'db', 'creating object store: ' + name);
          var store = db.createObjectStore(name, MBI.defaultOptions);
          G.log(MBI.TAG, 'db', 'created object store: ' + name);
          var m = MBI.shortNameToModel[name];
          if (m) {
            var indices = [];
            var vc = m.viewCols;
            vc = vc ? vc.split(',') : [];
            _.each(vc, function(pName) {
              pName = pName.trim();
              G.log(MBI.TAG, 'db', 'creating index', pName, 'for store', name);
              store.createIndex(pName, pName, {unique: false});              
              G.log(MBI.TAG, 'db', 'created index', pName, 'for store', name);
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
      
//      deleted.length && G.log(MBI.TAG, 'db', '2. deleted tables: ' + deleted.join(","));
//      created.length && G.log(MBI.TAG, 'db', '2. created tables: ' + created.join(","));
    }
    
    this.addItems = function(items, classUri) {
      if (!items || !items.length)
        return;
      
      var db = MBI.db;
      if (!db)
        return;
      
      var className = classUri.slice(classUri.lastIndexOf("/") + 1);
      if (!db.objectStoreNames.contains(className)) {
        G.log(MBI.TAG, 'db', 'closing db for upgrade');
        db.close();
        G.log(this.TAG, "db", "2. newModel: " + className);
        U.pushUniq(MBI.newModels, classUri);
        MBI.open(null, function() {
          MBI.addItems(items, classUri);
        });
        
        return;
      }
      
      G.log(MBI.TAG, 'db', 'starting readwrite transaction for store', className);
//      G.recordCheckpoint('starting readwrite transaction for store: ' + className);
      var trans = db.transaction([className], IDBTransaction.READ_WRITE);
      trans.oncomplete = function(e) {
        G.log(MBI.TAG, 'db', 'finished readwrite transaction for store', className);
//        G.recordCheckpoint('finished readwrite transaction for store: ' + className);
      };
      
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
      
//      G.log(MBI.TAG, 'db', "added some " + className + " to db");
    };
    
    this.addItem = function(item, classUri) {
      MBI.addItems([item instanceof Backbone.Model ? item.toJSON() : item], classUri || item.constructor.type);
    }
    
    this.deleteItem = function(uri) {
      G.log(MBI.TAG, 'db', 'deleting item', uri);
      var type = U.getType(item._uri);
      var name = U.getClassName(type);
      var db = MBI.db;
      var trans = db.transaction([type], IDBTransaction.READ_WRITE);
      var store = trans.objectStore(type);
      var request = store.delete(uri);
    
      request.onsuccess = function(e) {
        G.log(MBI.TAG, 'db', 'delete item onsuccess');
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
      
      G.log(MBI.TAG, 'db', 'starting readonly transaction for store', name);
      var trans = db.transaction([name], IDBTransaction.READ_ONLY);
      trans.oncomplete = function(e) {
        G.log(MBI.TAG, 'db', 'finished readonly transaction for store', name);
      };
      
      var store = trans.objectStore(name);
      var request = store.get(uri);
      request.onsuccess = function(e) {
        G.log(MBI.TAG, 'db', "store.get().onsuccess");
        if (options.success) {
          if (e.target.result && e.target.result.value)
            options.syncOptions.sync = false;
            
          options.success(e.target.result)
        }
      };
      
      request.onerror = function(e) {
        G.log(MBI.TAG, 'db', "store.get().onerror");
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
      
      G.log(MBI.TAG, 'db', 'starting readonly transaction for store', name);
      var trans = db.transaction([name], IDBTransaction.READ_ONLY);
      trans.oncomplete = function(e) {
        G.log(MBI.TAG, 'db', 'finished readonly transaction for store', name);
      };
      
      var store = trans.objectStore(name);
    
      var lowerBound;
      if (startAfter)
        lowerBound = IDBKeyRange.lowerBound(startAfter, true);
      
      // Get everything in the store;
      var results = [];
      var cursorRequest = lowerBound ? store.openCursor(lowerBound) : store.openCursor();
      cursorRequest.onsuccess = function(e) {
        G.log(MBI.TAG, 'db', 'read via cursor onsuccess');
        var result = e.target.result;
        if (result) {
          results.push(result.value);
          if (!total || results.length < total) {
            result['continue']();
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
        G.log(MBI.TAG, 'db', 'read via cursor onerror', e);
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
      if (MBI.db) {
        G.log(MBI.TAG, 'db', 'closing db');
        MBI.db.close();
      }
      
      var s = success;
      success = function() {
        MBI.paused = false;
        if (s) s();
      }
      
      MBI.open(null, success, error);
    };

    this.fetchModelsForLinkedResources = function(model) {
//      model = model.constructor || model;
      var isResource = typeof model !== 'function';
      var ctr = isResource ? model.constructor : model;
      var props = {};
      for (var name in ctr.properties) {
        if (!isResource || model.get(name))
          props[name] = ctr.properties[name];
      }
      
      var knownTypes = _.keys(MBI.typeToModel);
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = model.get(name + 'Count') || model.get(name + '.COUNT()');
          if (!count)
            return null;
        }
        
        var range = prop && prop.range && (prop.range.indexOf('/') == -1 ? null : prop.range.startsWith('http') ? prop.range : G.defaultVocPath + prop.range);
        return !range ? null : isResource ? range : _.contains(G.classUsage, range) ? range : null;
      })), function(m) {return m && !_.contains(knownTypes, m)}); // no need to reload known types

//      var linked = _.filter(G.linkedModels, function(m) {
//        return _.contains(tmp, m.type);
//      });
//      
//      var l = G.linkedModels;
//      var need = [];
//      for (var i = 0; i < l.length; i++) {
//        if (!tmp.length)
//          break;
//        
//        var idx = tmp.indexOf(l[i].type);
//        if (idx != -1) {
//          need.push(l[i]);
//          tmp.remove(idx, idx);
//        }
//      }
//      
//      need = _.concat(need, tmp); // maybe we were missing some in linkedModels
      
      var linkedModels = [];
      var l = G.linkedModels;
      for (var i = 0; i < l.length; i++) {
        // to preserve order
        var idx = tmp.indexOf(l[i].type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
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
      
      linkedModels = _.union(linkedModels, tmp); // maybe we were missing some in linkedModels
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