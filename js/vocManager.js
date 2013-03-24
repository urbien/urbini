//'use strict';
define([
  'globals',
  'utils', 
  'error', 
  'events', 
  'models/Resource', 
  'collections/ResourceList',
  'cache'
], function(G, U, Errors, Events, Resource, ResourceList, C) {
  Backbone.Model.prototype._super = function(funcName){
    return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
  };
  
  // from http://www.bennadel.com/blog/1929-Using-The-WITH-Keyword-With-Javascript-s-Function-Constructor.htm
  var FunctionProxy = function(sourceCode) {
    
   // When executing the Function constructor, we are going
   // to wrap the source code in a WITH keyword block that
   // allows the THIS context to extend the local scope of
   // the function.
   //
   // NOTE: This works without a nested self-executing
   // function. I put it in there simply because it makes me
   // feel a little more comfortable with the use of the
   // WITH keyword.
    var args = U.slice.call(arguments, 1);
    args[args.length] = "with (this) {" +
      "return " + sourceCode + ";" +
    "};";
 
    return Function.apply({}, args);
  }

  G.classUsage = _.map(G.classUsage, U.getTypeUri);
//  G.shortNameToModel.Resource = Resource;
//  G.typeToModel.Resource = Resource;
  var Voc = {
//    packages: {Resource: Resource},
//    scriptContext: {},
//    unsavedModels: [],
//    changedModels: [],
//    newModels: [],
    mightBeStale: {},
    models: [],
    getModels: function(models, options) {
      options = options || {};
      if (!models) {
        // if no models specified, get the base app models
        models = _.clone(G.modelsMetadata);
        var c = Voc.currentModel = U.getCurrentType();
        if (c && !models[c])
          models[c] = {};
            
        // In case we were offline and had to settle for stale models from localStaleage
        if (!options.overwrite) {
          models = U.filterObj(models, function(type, info) {
            return !U.getModel(type);
          });
        }
      }
      else {
        switch (U.getObjectType(models)) {
        case '[object String]':
          models = U.toObject([U.getLongUri1(models)]);
          break;
        case '[object Array]':
          models = U.toObject(_.map(models, U.getLongUri1));
          break;
        case '[object Object]':
          break;
        default:
          throw new Error("invalid format for 'models' parameter: " + JSON.stringify(models));
        }
      }
      
      if (!G.hasLocalStorage)
        return Voc.fetchModels(models, options);
        
      var missingOrStale = {},
          mightBeStale = {infos: {}, models: {}},
          willLoad = [];
      
      var force = options.force;
      for (var type in models) {
        if (force) {
          missingOrStale[type] = {};
          continue;
        }
        
        var info = models[type];
        // check if we have any timestamp info on this model
        if (!info.lastModified) {
          info = models[type] = G.modelsMetadata[type] || G.linkedModelsMetadata[type] || info;
        }
        
        var jModel = Voc.getModelFromLS(type);
        if (!jModel) {
          missingOrStale[type] = {};
          continue;
        }
        
        try {
          jModel = JSON.parse(jModel);
        } catch (err) {
          debugger;
          G.localStorage.del(type);
          missingOrStale[type] = {};
          continue;
        }
        
        if (info.lastModified) {
          var lm = Math.max(info.lastModified, G.lastModified);
          if (lm > jModel.lastModified)
            missingOrStale[type] = {};
          else
            willLoad.push(jModel);
        }
        else {
          // can't do this right away because we need to know that we actually have it in localStorage
          mightBeStale.infos[type] = {
            lastModified: jModel.lastModified
          };
          
          mightBeStale.models[type] = jModel;
        }
      }
      
//      _.extend(Voc.mightBeStale, mightBeStaleModels);
      return $.Deferred(function(defer) {
        if (G.online)
          return Voc.__fetchAndLoadModels(missingOrStale, mightBeStale, willLoad, options).done(defer.resolve).fail(defer.reject);
          
        Events.once('online', function(online) {
          Voc.__fetchAndLoadModels(missingOrStale, mightBeStale, [], _.extend({}, options, {sync: false, overwrite: true}));
        });
        
        Voc.loadModels(_.union(willLoad, _.values(mightBeStale.models))).done(defer.resolve).fail(defer.reject);
      }).promise();
    },
        
    __fetchAndLoadModels: function(missingOrStale, mightBeStale, willLoad, options) {
      return $.Deferred(function(defer) {
        var need = _.extend({}, missingOrStale, mightBeStale.infos);
        $.when(Voc.fetchModels(need, options), Voc.loadModels(willLoad)).then(function(data) {
          G.checkVersion(data);
          if (!data) {
            // missingOrStale should be empty
            if (_.size(missingOrStale)) {
              debugger;
              defer.reject();
              return;
//              throw new Error("missing needed models: " + JSON.stringify(_.map(missingOrStale, function(m) {return m.type || m})));
            }
            
            return Voc.loadModels(mightBeStale.models).done(defer.resolve).fail(defer.reject);            
          }
          
          var mz = data.models || [];
          G.lastModified = data.lastModified;
          G.classUsage = _.union(G.classUsage, _.map(data.classUsage, U.getTypeUri));
          var more = data.linkedModelsMetadata;
          if (more) {
            _.extend(G.linkedModelsMetadata, U.mapObj(more, function(type, meta) {
              return [U.getLongUri1(type), meta];
            }));
          }
          
          if (data.classMap)
            _.extend(G.classMap, data.classMap);
          
          var newModels = [],
              loadedTypes = [];
          
          for (var i = 0; i < mz.length; i++) {
            var newModel = mz[i];
            newModel.lastModified = newModel.lastModified ? Math.max(G.lastModified, newModel.lastModified) : G.lastModified;            
            loadedTypes.push(newModel.type);
            U.pushUniq(newModels, newModel);
          }
          
          var notStale = _.filter(_.values(mightBeStale.models), function(model) {
            return !_.contains(loadedTypes, model.type);
          });
          
          var changedModels = _.union(newModels, notStale),
              changedTypes = _.union(loadedTypes, _.map(notStale, function(model) {return model.type}));
          
          Voc.models = _.union(Voc.models, changedModels);
          Voc.loadModels(changedModels).done(defer.resolve).fail(defer.reject);          
          setTimeout(function() {
            Voc.saveModelsToStorage(newModels);
          }, 100);
          
          Voc.setupPlugs(data.plugs);
          if (changedTypes.length)
            Events.trigger('modelsChanged', changedTypes);
          
        }, defer.reject);
      }).promise();
    },

    fetchModels: function(models, options) {
      return $.Deferred(function(defer) {
        var numModels = _.size(models);
        if (!numModels)
          return defer.resolve();

        if (!G.online) {
          defer.rejectWith(this, [null, {type: 'offline'}, options]);
          return;
        }

        var c = Voc.currentModel;
        var urgent = options.sync && numModels > 1 && c && !U.getModel(c) && c;
        if (urgent) {
          Voc.fetchModels(urgent, options).done(function(data) {
            defer.resolve(data);
            models = U.filterObj(models, function(type, model) {
              return type !== urgent;
            });
              
            Voc.fetchModels(models, options);
          }).fail(defer.reject);
        }
        
        var modelsCsv = JSON.stringify(models);
        var ajaxSettings = _.extend({
          url: G.modelsUrl, 
          data: {models: modelsCsv}, 
          type: 'POST', 
          timeout: 5000
        }, _.pick(options, 'sync'));
        
        U.ajax(ajaxSettings).done(function(data, status, xhr) {
          if (!data) {
            defer.rejectWith(this, [xhr, status, options]);
            return;
          }
          
          if (data.error) {
            defer.rejectWith(this, [xhr, data.error, options]);
            return;
          }
          
          defer.resolve(data);
        }).fail(function(xhr, err, aOpts) {
          if (xhr.status === 304) {
            defer.resolve();
            return;
          }
          else
            defer.reject.apply(this, arguments);
        });
      }).promise();
    },    
    
    setupPlugs: function(plugs) {
      if (plugs) {
        _.extend(C.plugs, plugs);
        Voc.savePlugsToStorage(plugs);
        for (var type in plugs) {
          var typePlugs = plugs[type];
          for (var i = 0; i < typePlugs.length; i++) {
            Voc.initPlug(typePlugs[i], type);
          }
        }
      }
    },
    
    fetchModelsForLinkedResources: function(model) {
      var isResource = typeof model !== 'function';
      var ctr = isResource ? model.constructor : model;
      var props = {};
      for (var name in ctr.properties) {
        if (!isResource || model.get(name))
          props[name] = ctr.properties[name];
      }
      
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = model.get(name + 'Count') || model.get(name).count;
          if (!count)
            return null;
        }
        
        var range = prop && prop.range;
        range = range && (range.indexOf('/') == -1 || range.indexOf('/Image') != -1 ? null : U.getTypeUri(range));
        if (range && G.classMap)
          range = G.classMap[range] || range;
        
        return !range ? null : isResource ? range : _.contains(G.classUsage, range) ? range : null;
      })), function(m) {
        // no need to reload known types
        return m && !U.getModel(m);
      }); 
  
      var linkedModels = {};
//      G.linkedModelsMetadataMap = {};
      var l = G.linkedModelsMetadata;      
      for (var type in l) {
        var idx = tmp.indexOf(type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
          linkedModels[type] = l[type];
        }
      }
      
      if (_.size(linkedModels)) {
        Voc.getModels(linkedModels, {sync: false});
      }
    },

    fetchModelsForReferredResources: function(list) {
      var model = list.vocModel;
      var resources = list.models;
      var meta = model.properties;
      
      var tmp = [];

      var l = _.keys(C.typeToModel);
      var modelsToFetch = [];

      for (var propName in meta) {
        var p = meta[propName]; 
//        if (p.backLink) {
//          var type = G.defaultVocPath + p.range;
//          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
//            modelsToFetch.push(type);
//        }
//        else
          !U.isInlined(p)  &&  p.range  &&  !p.backLink  &&  p.range.indexOf('/') != -1  &&  p.range.indexOf('/Image') == -1  &&  tmp.push(propName);
      }
      if (!tmp.length)
        return;
      
      for (var i=0; i<resources.length; i++) {
        for (var j=0; j<tmp.length; j++) {
          var o = resources[i].get(tmp[j]);
          var uri = o  &&  o.value;
          if (!uri)
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !_.contains(l, type))
            modelsToFetch.push(type);
        }  
      }  
      
      
      if (modelsToFetch.length)
        Voc.getModels(modelsToFetch, {sync: false});
    },

    loadModel: function(m) {
      m = Resource.extend({}, m);
      var type = m.type = U.getTypeUri(m.type);
      C.cacheModel(m);
      
      if (!m.enumeration && !m.alwaysInlined) {
        if (U.isAnAppClass(type)) {
          var meta = m.properties;
          for (var p in meta) {
            var prop = meta[p];
            if (prop.displayName) {
              var sn = prop.shortName = prop.displayName.camelize();
              prop.altName = p;
              delete meta[p];
              meta[sn] = prop;
            }
          }
        }
      }
      
      m.prototype.parse = Resource.prototype.parse;
      m.prototype.validate = Resource.prototype.validate;
      _.defaults(m.properties, Resource.properties);
      m.superClasses = _.map(m.superClasses, U.getLongUri1);
      _.extend(m.properties, U.systemProps);
      m.prototype.initialize = Voc.getInit.apply(m);
      setTimeout(function() {
        Voc.initPlugs(type);
      }, 1000);
    },
    
    preparePlug: function(plugFn, plug) {
      return function(res) {
        return Voc.executePlug(plugFn, plug, res);
      }
    },
    
    plugTools: {
      /**
       * @param fn should take in two arguments, from and to, with names corresponding to class names
       * @param backlink backlink property on a property of the newly created resource. 
       *        For example, the currently created resource may be RecipeShoppingList (a cross between a Recipe and a ShoppingList),
       *        and backlink may be recipe.ingredients, where recipe is a property of RecipeShoppingList. 
       *        This function can be used to mirror the ingredients backlink into ShoppingListItem resources
       */
      each: function(backlink, fn) {
        var cause = this.cause,
            effect = this.effect,
            causeModel = this.causeModel,
            effectModel = this.effectModel,  // ShoppingListItem in the example
            plug = this.plug,
            self = this;
        
        backlink = backlink.split('.');
        if (backlink.length != 2)
          return; // longer not supported yet, shorter can't be an existing backlink
        
        var propName = backlink[0],     // recipe in the example
            prop = causeModel.properties[propName],         // RecipeShoppingList model in the example
            propVal = cause[propName];   // recipe uri in the example
        
        if (!prop || !propVal)
          return;
        
        var propType = U.getTypeUri(prop.range),
            backlinkName = backlink[1]; // ingredients in the example
        
        Voc.getModels([propType]).done(function() {
          var propModel = U.getModel(propType);     // Recipe in the example
          if (!propModel) {
            debugger; // should never happen
            return;
          }
          
          var backlinkProp = propModel.properties[backlinkName]; 
          if (!backlinkProp) {
            G.log(Voc.TAG, 'error', 'class {0} doesn\'t have a property {1}'.format(propType, backlinkName)); 
            return;
          }
          
          var backlinkType = U.getTypeUri(backlinkProp.range);
          Voc.getModels(backlinkType).done(function() { 
            var backlinkModel = U.getModel(backlinkType); // Ingredient in the example
            if (!backlinkModel) {
              debugger; // should never happen
              return;
            }
            
            var params = {};
            params[backlinkProp.backLink] = propVal;         
            // backlinkProp.backLink is "recipe" in the example (the backlink being Recipe._ingredients). 
            // We want all ingredients where the value of the property Ingredient._recipe is our recipe  
            var backlinkCollection = new ResourceList(null, {model: backlinkModel, params: params});
            backlinkCollection.fetch().done(function() {
              var subPlug = _.extend({}, plug, {
                causeDavClassUri: backlinkType
              });
              
//              fn = Voc.buildScript(fn.toString(), backlinkType, effectModel.type);
              fn = Voc.preparePlug(fn, subPlug);
              var json = backlinkCollection.toJSON();
              for (var i = 0; i < json.length; i++) {
                fn(json[i]);
                if (self.aborted) // need to make sure this is our context
                  break;
              }
            }).fail(function() {
              debugger;
            });
          });
        });
      }
//    ,
//      
//      abort: function() {
//        this.aborted = true;
//      }
    },

    /**
     * prepackage all the built in plug functions like "each" with the resources and models needed for a given operation
     */
    getPlugToolSuite: function(cause, causeModel, effect, effectModel, plug) {
      var plugTools = {};
      var context = {cause: cause, causeModel: causeModel, effect: effect, effectModel: effectModel, plug: plug};
      _.each(Voc.plugTools, function(fn, name) {
        plugTools[name] = function() {
          fn.apply(context, arguments); // give fn access to cause, causeModel, effect, effectModel
        };
      });
      
      return plugTools;
    },
    
    nukePlug: function(plug, plugFn) {
      var causeType = plug.causeDavClassUri;
      C.plugs[causeType] = _.filter(C.plugs[causeType], function(h) {
        return h._uri != plug._uri;
      });
      
      if (plugFn == null) {
        Voc.initPlugs(causeType);
        return;
      }
      
      _.each(Voc.scriptActions, function(action) {        
        Events.off(action + ':' + causeType, plugFn);
      });
    },
    
    /**
     * @param plug a function that takes in two parameters: from and to, a.k.a. cause and effect
     */
    executePlug: function(plugFn, plug, cause) {
      var effectType = plug.effectDavClassUri;
      var type = effectType.slice(effectType.lastIndexOf("/") + 1).camelize();
      var effect = {};

      Voc.getModels(effectType).done(function() {
        var effectModel =  U.getModel(effectType),
            causeModel = U.getModel(plug.causeDavClassUri),
            toolSuite = Voc.getPlugToolSuite(cause, causeModel, effect, effectModel, plug);
        
        var goAhead; 
        try {
          if (plugFn.proxy)
            goAhead = plugFn.apply(toolSuite).call({}, cause, effect);
          else
            goAhead = plugFn.call({}, cause, effect);
        } catch (err) {
          Voc.nukePlug(plug, plugFn);
          return;
        }
        
        if (goAhead === false)
          return;
                
//        if (!_.size(effect))
//          return;
        
        // copy image props, if both are imageResources. Add more crap like this here (and then make them all separate methods
        if (U.isA(causeModel, "ImageResource") && U.isA(effectModel, "ImageResource")) {
          var propMap = {};
          for (var i = 0; i < U.imageResourceProps.length; i++) {
            var iProp = U.imageResourceProps[i];
            var to = U.getCloneOf(effectModel, iProp);
            if (!to || effect[to]) {
              fromTo = null;
              break;
            }
            
            var from = U.getCloneOf(causeModel, iProp);
            if (from)
              fromTo[from] = to;
          }
          
          if (fromTo) {
            for (var from in fromTo) {
              var to = fromTo[from];
              from = cause[from];
              if (from)
                effect[to] = from;
            }
          }
        }
        
        var res = new effectModel();
        effect.plugin = plug._uri;
//        effect.cause = cause._uri;
        res.save(effect, {'$returnMade': false, sync: false});
      }).fail(function() {
        debugger;
      });
    },
    
    buildScript: function(script) {
      if (typeof script === 'function') {
        debugger; 
        return script;
      }
      
      var proxy = FunctionProxy(script.trim());
      proxy.proxy = true;
      return proxy;
    },
    
    initPlugs: function(type) {
      // TODO: turn off plugs as needed, instead of this massacre
      Events.off('create.' + type);
      Events.off('edit.' + type);
      var plugs = C.plugs[type];
      if (!plugs) {
        plugs = G.localStorage.get(Voc.PLUGS_PREFIX + type);
        if (plugs)
          plugs = JSON.parse(plugs);
      }
      
      if (!plugs)
        return;
    
      _.each(plugs, function(plug) {
        Voc.initPlug(plug, type);
      });
    },
    
    scriptActions: ['create', 'edit'],
    
    initPlug: function(plug, type) {
      var scripts = {};
      _.each(Voc.scriptActions, function(action) {        
        scripts[action] = plug['on' + action.camelize(true)];
      });
      
      for (var action in scripts) {
        var script = scripts[action];
        if (script) {
          script = script.trim();
          script = Voc.buildScript(script); //, plug.causeDavClassUri, plug.causeDavClassUri);
//          script = new Function(script.startsWith("function") ? script.slice(script.indexOf("{") + 1, script.lastIndexOf("}")) : script); //, plug.causeDavClassUri, plug.causeDavClassUri);
          if (script === null)
            G.log(Voc.TAG, 'error', 'bad custom on{0} script'.format(action), plug.app, type);
          else
            Events.on(action + ':' + type, Voc.preparePlug(script, plug));
        }          
      }
    },
    
    getInit: function() {
      var self = this;
      return function() { 
        self.__super__.initialize.apply(this, arguments); 
      }
    },

    loadModels: function(models) {
      return $.Deferred(function(defer) {
        models = models || Voc.models;      
        _.each(models, function(model) {
          Voc.loadModel(model);
        });
        
        defer.resolve();
      }).promise();
    },
    
    contactKey: "com.fog.security.contact",
    checkUser: function() {
      if (!G.hasLocalStorage)
        return; // TODO: use indexedDB
      
      var p = G.localStorage.get(Voc.contactKey);
      p = p && JSON.parse(p);
      var c = G.currentUser;
      var userChanged = !p && !c.guest || p && !c.guest && p._uri != c._uri || p && c.guest;
      if (userChanged) {
        Events.trigger('userChanged')
        if (c.guest) {
          G.localStorage.del(Voc.contactKey);          
        }
        else {
          // no need to clear localStorage, it's only used to store models, which can be shared
          G.localStorage.put(Voc.contactKey, JSON.stringify(c));
        }
         
//        var plugTypes = G.localStorage.nukePlugs(); // keep for now, plugs are small and non-user-specific
        if (!c.guest) {
          Voc.fetchPlugs(); //plugTypes);
        }
      }
    },
    
    MODEL_PREFIX: 'model:',
    ENUMERATIONS_KEY: 'enumerations',
    PLUGS_PREFIX: 'plugs:',
    fetchPlugs: function(models) {
      if (!models) {
        var modelPrefix = Voc.MODEL_PREFIX + G.DEV_PACKAGE_PATH + G.currentApp.appPath;
        models = _.compact(_.map(_.keys(localStorage), function(key) {
          return key.startsWith(modelPrefix) && key.slice(7);
        }));
      }
      
      if (!_.size(models))
        return;
      
      var viaInstall = !!models.appInstall;
      var params = {plugsOnly: true};
      if (viaInstall)
        params = $.param(_.extend(params, models));
      else
        _.extend(params, {models: JSON.stringify(models)});
      
      U.ajax({type: 'POST', url: G.modelsUrl, data: params}).done(function(data, status, xhr) {
        G.checkVersion(data);
        Voc.setupPlugs(data.plugs);
      });
    },
    
    saveModelsToStorage: function(models) {
      if (!localStorage)
        return; // TODO: use indexedDB
      
      models = models || Voc.models;
      if (!models.length)
        return;
    
      var now = G.currentServerTime();
      var enumModels = {};
      _.each(models, function(model) {
//        if (model.type.endsWith('#Resource'))
//          return;
        
        var modelJson = U.toJSON(model);
        modelJson._dateStored = now;
//        if (model.superClass)
//          modelJson._super = model.superClass.type;
        if (model.enumeration)
          enumModels[model.type] = modelJson;
        else
          Voc.storeModel(modelJson);
      });
      
      if (_.size(enumModels)) {
        var enums = Voc.getEnumsFromLS();
        enums = enums ? JSON.parse(enums) : {};
        _.extend(enums, enumModels);
        Voc.storeEnumsInLS(enums);
      }
    },

    savePlugsToStorage: function(plugs) {
      if (!localStorage || !_.size(plugs))
        return;
    
      var ls = G.localStorage;
      for (var type in plugs) {
        var typePlugs = plugs[type];
        typePlugs = typeof typePlugs === 'string' ? JSON.parse(typePlugs) : typePlugs;
        var key = Voc.PLUGS_PREFIX + type;
        var current = ls.get(key);
        if (current) {
          current = JSON.parse(current);
          _.each(typePlugs, function(tPlug) {
            var uri = tPlug._uri;
            var matches = _.filter(current, function(oldPlug) {
              return oldPlug._uri == uri;
            });
            
            _.each(matches, function(match) {              
              current.remove(match);
            });
            
            current.push(tPlug);
          });
        }
        else
          current = typePlugs;
        
        ls.putAsync(key, JSON.stringify(current));
      }
    },

    getEnumsFromLS: function() {
      return G.localStorage.get(Voc.ENUMERATIONS_KEY);
    },

    storeEnumsInLS: function(enums) {
      setTimeout(function() {
        G.localStorage.putAsync(Voc.ENUMERATIONS_KEY, JSON.stringify(enums));
      }, 100);
    },

    getModelFromLS: function(uri) {
      return G.localStorage.get(Voc.MODEL_PREFIX + uri);
    },

    storeModel: function(modelJson) {
      setTimeout(function() {
        var type = modelJson.type;
        G.localStorage.putAsync(Voc.MODEL_PREFIX + type, JSON.stringify(modelJson));
        U.pushUniq(G.storedModelTypes, type);
      }, 100);
    },

    loadEnums: function() {
      var enums = Voc.getEnumsFromLS();
      if (!enums)
        return;
      
      enums = JSON.parse(enums);
      for (var type in enums) {
        Voc.loadModel(Backbone.Model.extend({}, enums[type]));
      }
    }    
  };
  
  Events.on('newPlug', function(plug) {
    var plugs = {};
    plug = U.isModel(plug) ? plug.toJSON() : plug;
    var type = plug.causeDavClassUri;
    plugs[type] = [plug];
//    C.savePlugs(plugs);
    Voc.setupPlugs(plugs);
  });

  Events.on('appInstall', function(appInstall) {
    if (!appInstall.get('allow'))
      return;
   
    var user = G.currentUser;
    var installed = user.installedApps = user.installedApps || {};
    var app = C.getResource(appInstall.get('application'));
    var jApp = app ? app.toJSON() : {};
    jApp.install = appInstall.getUri();
    jApp.allowed = true;
    var appPath = app ? app.get('appPath') : U.getAppPathFromTitle(appInstall.get('application.displayName'));
    installed[appPath] = jApp;
    
    if (!U.isTempResource(appInstall)) {
      Voc.fetchPlugs({appInstall: appInstall.getUri()});
    }
  });
  
  Events.on('VERSION:Models', function(init) {
//    debugger;
    G.log(Voc.TAG, 'info', 'nuking models from LS');

    G.localStorage.clean(function(key) {
      return _.any([Voc.MODEL_PREFIX], function(prefix) {
        return key.startsWith(prefix);
      });
    });
    
    if (!init) {
      var currentModels = _.keys(G.modelsMetadata);
      Voc.getModels(currentModels, {force: true, overwrite: true});
    }
  });

  Events.on('inlineResourceList', function(baseResource, prop, inlineResources) {
    var range = U.getTypeUri(prop.range);
    Voc.getModels(range).done(function() {
      var model = U.getModel(range);
      var rl = new ResourceList(inlineResources, {model: model, params: U.getListParams(baseResource, prop)}); // get this cached
//      _.each(inlineResources, function(res) {
//        new model(res);  // get those suckers in the cache
//      });
      
//      var rl = new ResourceList(inlineResources, {model: U.getModel(range)});
      baseResource.setInlineList(prop.shortName, rl);
    });
  });
  
  Events.on('publishingApp', function(app) {
    var wClsDfd = new $.Deferred();
    var modifiedWCls;
    var lastPublished = app.get('lastPublished');
    Voc.getModels(G.commonTypes.WebClass).done(function() {        
      modifiedWCls = new ResourceList(null, {
        model: U.getModel(G.commonTypes.WebClass),
        params: {
          modified: '>=' + lastPublished,
          parentFolder: app.getUri()
        }
      });
      
      modifiedWCls.fetch({
        success: function() {
          wClsDfd.resolve();
        },
        error: function() {
          debugger;
          wClsDfd.reject();
        }
      });
    });
    
    Events.once('publishedApp', function(app) {
      // check if maybe the app didn't get published for some reason
      if (app.get('lastPublished') <= lastPublished) 
        return;
      
      wClsDfd.promise().done(function() {   
        debugger;
        var modifiedWClUris = modifiedWCls.pluck('davClassUri');
        Voc.getModels(modifiedWClUris, {force: true}).done(function() {
          G.log(Voc.TAG, 'info', 'reloaded models: ' + modifiedWClUris);
        });
      });
    });
  });
  
  return (G.Voc = Voc);
});