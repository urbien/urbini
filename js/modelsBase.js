// needs Lablz.serverName

define([
  'jquery',
  'backbone',
  'underscore',
  'utils',
  'error',
  'localStorageModule',
  'dbModule',
  'models/Resource',
  'collections/ResourceList',
  'indexedDBShim'
], function($, Backbone, _, U, Error, LS, DB, Resource, ResourceList) {
  var MB = ModelsBase = {};
  MB.changedModels = new Utils.UArray();
  MB.newModels = new Utils.UArray();
  
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };
  
  Backbone.defaultSync = Backbone.sync;
  MB.defaultSync = function(method, model, options) {
    model.lastFetchOrigin = 'server';
    Backbone.defaultSync(method, model, options);
  };

  Backbone.sync = function(method, model, options) {
    var now = new Date().getTime();
    var stale = false;
    var lastFetchedOn = model instanceof Backbone.Model ? model._lastFetchedOn || (model.collection && model.collection._lastFetchedOn) : model._lastFetchedOn;
    if (!lastFetchedOn || now - lastFetchedOn > 60000)
      stale = true;

    options.headers = options.headers || {};
    if (stale && lastFetchedOn) {
      _.extend(options.headers, {"If-Modified-Since": new Date(lastFetchedOn).toUTCString()});
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
          var longUri = U.getLongUri(r._uri, model.type);
          var saved = model.get(longUri);
          saved = saved && saved.get(tsProp);
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
            toAdd[i]._uri = U.getLongUri(toAdd[i]._uri);
            var existing = model.get(toAdd[i]._uri);
            if (existing) {
              existing.set(toAdd[i]);
              modified.push(toAdd[i]._uri);
            }
            else
              model.add(new model.model(toAdd[i]));
          }
          
          setTimeout(function() {          
            DB.addItems(toAdd, model.type);
          }, 100);
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
        
        model._lastFetchedOn = new Date().getTime();
        var isCol = model instanceof Backbone.Collection;      
        data = isCol ? resp.data : resp.data[0];
        var modified;
        if (isCol) {
          var offset = resp.metadata && resp.metadata.offset || 0;
          modified = _.map(model.models.slice(offset), function(model) {return model.get('_uri')});
        }
        else {
          modified = model.get('_uri');
        }
        
        save && save(data);
        defSuccess && defSuccess(resp, status, xhr);
        Lablz.Events.trigger('refresh', model, modified);
      }
    });
      
    var runDefault = function() {
      return Lablz.defaultSync(method, model, saveOptions);
    }
    
    if (method !== 'read' || stale || options.noDB)
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
          
          if (stale)
            return runDefault();
          else
            return;
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
    
    if (!key || (model instanceof Backbone.Collection && key.indexOf("?") != -1) || !Lablz.indexedDB.getDataAsync(dbReqOptions)) // only fetch from db on regular resource list or propfind, with no filter
      runDefault();
    else
      options.sync = false; // meaning if we fail to get resources from the server, we let user see the ones in the db
  };

  MB.models = new U.UArray();
  MB.push(Resource);
  MB.shortNameToModel = {'Resource' : Resource};
  MB.typeToModel = {};

  MB.fetchModels = function(models, options) {
    models = models || U.union(Lablz.changedModels, Lablz.newModels);
    options = options || {};
    var success = options.success;
    var error = options.error || Error.getDefaultErrorHandler();

    if (models.length) {
      var now = new Date().getTime();
      models = models.join ? models : [models];
      var snm = Lablz.shortNameToModel;
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
    
    var modelsCsv = JSON.stringify(models);
    $.ajax({
      url: Lablz.serverName + "/backboneModel", 
      type: 'POST',
      data: {"models": modelsCsv},
      complete: function(jqXHR, status) {
        if (status != 'success') {
          console.log("couldn't fetch models");
//          alert("Oops! Couldn't initialize awesomeness!");
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
        
//        _.extend(packages, p);
        LS.initModels();
        if (success)
          success();
        
        setTimeout(LS.saveModelsToStorage, 0);
        setTimeout(MB.fetchLinkedModels, 0);
      }
    });
  };

  MB.fetchLinkedModels = function() {
    var linked = Lablz.requiredModels.linkedModels;
    if (!linked)
      return;
    
    LS.loadStoredModels(linked);
    var numModels = Lablz.models.length;
    var success = function() {
      if (!(Lablz.models.length - numModels))
        return;
      
      MB.initModels();
      LS.saveModelsToStorage();
    }
  };

  MB.initModel = function(m) {
    if (MB.shortNameToModel[m.shortName])
      return;
    
    m.lastModified = new Date().getTime();
    MB.shortNameToModel[m.shortName] = m;
    MB.typeToModel[m.type] = m;
    m.prototype.parse = Resource.prototype.parse;
    m.prototype.validate = Resource.prototype.validate;
    var superProps = m.__super__.constructor.properties;
    m.properties = superProps ? _.extend(_.clone(superProps), m.myProperties) : _.clone(m.myProperties);
    var superInterfaces = m.__super__.constructor.interfaces;
    m.interfaces = superInterfaces ? _.extend(_.clone(superInterfaces), m.myInterfaces) : _.clone(m.myInterfaces);
    m.prototype.initialize = Lablz.getInit.apply(m);
  };
  
  MB.initModels = function(models) {
    models = models || Lablz.models;
    for (var i = 0; i < models.length; i++) {
      var m = models[i];
  //    if (MB.shortNameToModel[m.shortName])
  //      continue;
      if (m.shortName != 'Resource')
        delete MB.shortNameToModel[m.shortName];
      
      MB.initModel(m);
    }
  };
  
  return ModelsBase;
});