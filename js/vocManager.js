//'use strict';
define('vocManager', [
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

  function getOAuthVersion(oauthVersion) {
    if (typeof oauthVersion == 'string') {
      try {
        oauthVersion = parseInt(oauthVersion);
      } catch (err) {
      }
    }
    
    if (oauthVersion !== 1 && oauthVersion !== 2)
      throw errMsg;
    
    return oauthVersion;
  };
  
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
        var c = Voc.currentModel = U.getModelType();
        if (c && !models[c])
          models[c] = {};            
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
      
      if (!options.overwrite) {
        models = U.filterObj(models, function(type, info) {
          return !U.getModel(type);
        });
      }

      if (!G.hasLocalStorage)
        return Voc.__fetchModels(models, options);
        
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
        
        var storedInfo = Voc.getModelMetadataFromLS(type);
        if (!storedInfo) {
          missingOrStale[type] = {};
          continue;
        }
        
        try {
          storedInfo = JSON.parse(storedInfo);
        } catch (err) {
          debugger;
          Voc.deleteModelFromLS(type);
          missingOrStale[type] = {};
          continue;
        }
        
        if (info.lastModified) {
          var lm = Math.max(info.lastModified, G.lastModified);
          if (lm > storedInfo.lastModified)
            missingOrStale[type] = {};
          else {
            var jModel = Voc.getModelFromLS(type);
            if (jModel)
              willLoad.push(jModel);
            else
              missingOrStale[type] = {};
          }
        }
        else {
          // can't do this right away because we need to know that we actually have it in localStorage
          var jModel = Voc.getModelFromLS(type);
          if (jModel) {
            mightBeStale.infos[type] = {
              lastModified: storedInfo.lastModified
            };
          
            mightBeStale.models[type] = jModel;
          }
          else
            missingOrStale[type] = {};            
        }
      }
      
      var modelsDfd = $.Deferred(function(defer) {
        if (G.online)
          Voc.__fetchAndLoadModels(missingOrStale, mightBeStale, willLoad, options).done(defer.resolve).fail(defer.reject);
        else {
          Events.once('online', function(online) {
            Voc.__fetchAndLoadModels(missingOrStale, mightBeStale, [], _.extend({}, options, {sync: false, overwrite: true}));
          });
          
          Voc.loadModels(_.union(willLoad, _.values(mightBeStale.models))).done(defer.resolve).fail(defer.reject);
        }
      });
      
      var modelsPromise = modelsDfd.promise();
      modelsDfd.__modelsDeferredId = G.nextId();
      modelsPromise.__modelsPromiseId = G.nextId();
      return modelsPromise;
    },
        
    __fetchAndLoadModels: function(missingOrStale, mightBeStale, willLoad, options) {
      return $.Deferred(function(defer) {
        var need = _.extend({}, missingOrStale, mightBeStale.infos);
        $.when(Voc.__fetchModels(need, options), Voc.loadModels(willLoad, true)).then(function(data) {
          G.checkVersion(data);
          if (!data) {
            // missingOrStale should be empty
            if (_.size(missingOrStale)) {
              debugger;
              defer.reject();
              return;
//              throw new Error("missing needed models: " + JSON.stringify(_.map(missingOrStale, function(m) {return m.type || m})));
            }
            
            return Voc.loadModels(mightBeStale.models, true).done(defer.resolve).fail(defer.reject);            
          }
          
          var mz = data.models || [];
          G.lastModified = Math.max(data.lastModified, G.lastModified);
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

    __fetchModels: function(models, options) {
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
          Voc.__fetchModels(urgent, options).done(function(data) {
            defer.resolve(data);
            models = U.filterObj(models, function(type, model) {
              return type !== urgent;
            });
              
            Voc.__fetchModels(models, options);
          }).fail(defer.reject);
        }
        
        var modelsCsv = JSON.stringify(models);
        var ajaxSettings = _.extend({
          url: G.modelsUrl, 
          data: {models: modelsCsv}, 
          type: 'POST', 
          timeout: 10000
        }, _.pick(options, 'sync'));
        
        U.ajax(ajaxSettings).done(function(data, status, xhr) {
          if (xhr.status === 304)
            return defer.resolve();
          
          if (!data)
            return defer.rejectWith(this, [xhr, status, options]);
          
          if (data.error)
            return defer.rejectWith(this, [xhr, data.error, options]);
          
          defer.resolve(data);
        }).fail(defer.reject);
      }).promise();
    },    
    
    setupPlugs: function(plugs) {
      if (plugs) {
        _.extend(C.plugs, plugs);
        Voc.savePlugsToStorage(plugs);
        for (var type in plugs) {
          var typePlugs = plugs[type];
          for (var i = 0; i < typePlugs.length; i++) {
            Voc.initPlug(typePlugs[i]);
          }
        }
      }
    },
    
    detectLinkedModels: function(res) {
      var isResource = U.isModel(res);
      var model = isResource ? res.vocModel : res;
      var props = {};
      var meta = model.properties;
      for (var name in meta) {
        if (!isResource || res.get(name))
          props[name] = meta[name];
      }
      
      var tmp = _.filter(_.uniq(_.map(props, function(prop, name) {
        if (isResource && prop.backLink) {
          var count = res.get(name + 'Count') || res.get(name).count;
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
  
      var linkedModels = [];
      var l = G.linkedModelsMetadata;
      for (var type in l) {
        var idx = tmp.indexOf(type);
        if (idx != -1) {
          tmp.splice(idx, idx + 1);
          linkedModels.push(type);
        }
      }
      
      return linkedModels;
    },
    
    fetchLinkedAndReferredModels: function(list) {
      var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
      if (!resources.length)
        return;
      
      var model = resources[0].vocModel;
      var linkedModels = Voc.detectLinkedModels(resources[0]);
      var referredModels = Voc.detectReferredModels(list);
      var models = _.union(linkedModels || [], referredModels || []);
      if (_.size(models)) {
        Voc.getModels(models, {sync: false});
      }
    },

    detectReferredModels: function(list) {      
      var resources = U.isCollection(list) ? list.models : _.isArray(list) ? list : [list];
      var model = resources[0].vocModel;
      var meta = model.properties;
      
      var tmp = [];
      var cache = C.typeToModel;
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
        var res = resources[i];
        for (var j = 0; j < tmp.length; j++) {
          var uri = res.get(tmp[j]);
          if (!uri || typeof uri === 'pbject') // could be a file upload
            continue;
          
          var idx = uri.indexOf("?");
          var idx0 = uri.indexOf('/' + G.sqlUri + '/');
          if (idx0 == -1) // could be S3 Image uri
            continue;
          var type = 'http://' + uri.substring(idx0 + G.sqlUri.length + 2, idx);
          if (!_.contains(modelsToFetch, type)  &&  !_.has(cache, type))
            modelsToFetch.push(type);
        }  
      }  
      
      return modelsToFetch;
    },

    loadModel: function(m) {
      m = Resource.extend({}, m);
      if (m.adapter) {
        var currentApp = G.currentApp,
            consumers = currentApp.dataConsumerAccounts,
            providers = currentApp.dataProviders,
            consumer = consumers && consumers.where({
              app: currentApp._uri
            }, true),
            provider = providers && providers.where({
              app: m.app
            }, true);            


        if (!provider || !consumer)
          return delete m.adapter;
//        if (provider == null)
//          throw new Error("The app whose data you are trying to use does not share its data");          
//            
//        if (consumer == null)
//          throw new Error("This app is not configured to consume data from app '{0}'".format(provider.app));
          
        m.API = new API(consumer, provider);
        m.adapter = new Function('Events', 'Globals', 'ResourceList', 'Utils', 'Cache', 'API', "return " + m.adapter)(Events, G, ResourceList, U, C, m.API);
      }
      
      var type = m.type = U.getTypeUri(m.type);
      C.cacheModel(m);
      
      if (!m.enumeration && !m.alwaysInlined) {
        if (U.isAnAppClass(type)) {
          var meta = m.properties;
          for (var p in meta) {
            var prop = meta[p];
            if (prop.displayName) {
              var sn = prop.shortName;
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
      m.superClasses = _.map(m.superClasses, function(type) {
        if (/\//.test(type))
          return U.getLongUri1(type);
        else
          return G.defaultVocPath + 'system/fog/' + type;
      });
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
      _.each(this.scriptActions, function(action) {
        Events.off(action + ':' + type);
      });
      
      var plugs = C.plugs[type];
      if (!plugs) {
        plugs = G.localStorage.get(Voc.PLUGS_PREFIX + type);
        if (plugs)
          plugs = JSON.parse(plugs);
      }
      
      if (!plugs)
        return;
    
      _.each(plugs, function(plug) {
        Voc.initPlug(plug);
      });
    },
    
    scriptActions: ['create', 'edit'],
    initPlug: function(plug) {
      this.plugs = this.plugs || U.toObject(this.scriptActions);
      var cause = plug.causeDavClassUri;
      var effect = plug.effectDavClassUri;
      var scripts = {};
      _.each(Voc.scriptActions, function(action) {        
        scripts[action] = plug['on' + action.camelize(true)];
      });
      
      for (var action in scripts) {
        var script = scripts[action];
        if (script) {
          script = U.removeJSComments(script).trim();
          if (!script.length)
            continue;
          
          script = Voc.buildScript(script); //, plug.causeDavClassUri, plug.causeDavClassUri);
//          script = new Function(script.startsWith("function") ? script.slice(script.indexOf("{") + 1, script.lastIndexOf("}")) : script); //, plug.causeDavClassUri, plug.causeDavClassUri);
          if (script === null)
            G.log(Voc.TAG, 'error', 'bad custom on{0} script'.format(action), plug.app, cause);
          else {
            var scriptPlusGoodies = Voc.preparePlug(script, plug);
            var plugsForAction = this.plugs[action];
            var plugsForCause = plugsForAction[cause] = plugsForAction[cause] || {};
            var existingPlug = plugsForCause[effect];
            if (existingPlug)
              Events.off(action + ':' + cause, existingPlug);
              
            plugsForCause[effect] = scriptPlusGoodies;
            Events.on(action + ':' + cause, scriptPlusGoodies);
          }
        }          
      }
    },
    
    getInit: function() {
      var self = this;
      return function() { 
        self.__super__.initialize.apply(this, arguments); 
      }
    },

    loadModels: function(models, dontOverwrite) {
      return $.Deferred(function(defer) {
        models = models || Voc.models;      
        _.each(models, function(model) {
          if (!dontOverwrite || !C.typeToModel[model.type])
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
          return key.startsWith(modelPrefix) && key.slice(6);
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
    
      var enumModels = {};
      _.each(models, function(model) {
        var modelJson = U.toJSON(model);
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

    deleteModelFromLS: function(uri) {
      G.localStorage.del('metadata:' + uri);
      G.localStorage.del(type);
    },
    
    getModelStorageURL: function(uri) {
      return Voc.MODEL_PREFIX + uri;
    },

    getModelMetadataStorageURL: function(uri) {
      return Voc.MODEL_PREFIX + 'metadata:' + uri;
    },
    
    getModelMetadataFromLS: function(uri) {
      return G.localStorage.get(Voc.getModelMetadataStorageURL(uri));
    },

    getModelFromLS: function(uri) {
      var jModel = G.localStorage.get(Voc.getModelStorageURL(uri));
      try {
        return JSON.parse(jModel);
      } catch (err) {
        debugger;
        Voc.deleteModelFromLS(uri);
        return null;
      }
    },

    storeModel: function(modelJson) {
      setTimeout(function() {
        var type = modelJson.type;
        G.localStorage.putAsync(Voc.getModelMetadataStorageURL(type), {
          lastModified: modelJson.lastModified
        });
        
        G.localStorage.putAsync(Voc.getModelStorageURL(type), JSON.stringify(modelJson));
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
  
  _.extend(Voc, Backbone.Events);
  
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
      return key.startsWith(Voc.MODEL_PREFIX);
    });
    
    if (!init) {
      var currentModels = _.keys(G.modelsMetadata);
      Voc.getModels(currentModels, {force: true, overwrite: true});
    }
  });

  Events.on('publishingApp', function(app) {
    var wClsDfd = new $.Deferred();
    var modifiedWCls;
    var lastPublished = app.get('lastPublished') || 0;
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
        var modifiedWClUris = modifiedWCls.pluck('davClassUri');
        Voc.getModels(modifiedWClUris, {force: true}).done(function() {
          G.log(Voc.TAG, 'info', 'reloaded models: ' + modifiedWClUris);
        });
      });
    });
  });
  
  Events.on('newResources', function(resources) {
    var actualTypes = {};
    _.each(resources, function(resource) {
      if (resource._changingModel)
        return;
      
      var uri = resource.getUri();
      var type = resource.vocModel.type;
      var actualType = U.getTypeUri(uri);
      if (actualType && type != actualType) {
        var byType = actualTypes[actualType] = actualTypes[actualType] || [];
        byType.push(resource);
      }        
    });
    
    if (_.size(actualTypes)) {
      Voc.getModels(_.keys(actualTypes)).done(function() {
        for (var type in actualTypes) {
          var actualModel = U.getModel(type);
          var sadResources = actualTypes[type];
          _.each(sadResources, function(resource) {                
            resource.setModel(actualModel);
          });
        }
      });
    }
  });
  
  Events.on('newResourceList', function(list) {
    _.each(['updated', 'added', 'reset'], function(event) {
      Voc.stopListening(list, event);
      Voc.listenTo(list, event, function(resources) {
        G.log(Voc.TAG, 'ajax', 'fetching linked/referred models for list:', list.query);
        Voc.fetchLinkedAndReferredModels(resources || list.models);
      });
    });
  });

  var APIs = {};
  /**
   * @param consumer - the app's API account
   */
  function API(consumer, provider) {
    this.consumer = consumer;
    this.provider = provider;
  };
  
  _.extend(API.prototype, {
    getUrl: function(type, endpoint, params, authenticated) {
      var params = {
        $url: endpoint
      };
      
      if (authenticated)
        return endpoint + '?' + $.param(params);
      else {
        params.$auth = 'simple';
        return Globals.apiUrl + encodeURIComponent(this.type) + '?' + $.param(params);
      }
    },

    isAuthorized: function(oauthVersion) {
      oauthVersion = getOAuthVersion(oauthVersion);
      var access = this.access || G.dataAccesses.where({
        appAccount: this.consumer._uri
      }, true);
      
      if (access)
        return false;
      
      switch (oauthVersion) {
      case 1:
        return access.get('tokenSecret'); // && access.get('expires') > +new Date();
      case 2:        
        return access.get('accessToken') && access.get('expires') > +new Date();
      default:
        throw "Only OAuth 1.0a and OAuth 2 are supported";
      }
    },
    
    oauth: function(oauthVersion, type, redirectUri) {
      debugger;
      var params = {};
      if (type) {
        params.type = type;
      }
      else {
        params.app = this.provider.get('app');
      }
      
      if (redirectUri)
        params.$returnUri = redirectUri;
      
      oauthVersion = getOAuthVersion(oauthVersion);
      window.location.href = G.apiUrl + 'oauth' + oauthVersion + '?' + $.param(params);
      
//      var self = this,
//          authDfd = $.Deferred(),
//          access = this.access || G.dataAccesses.where({
//            appAccount: this.consumer._uri
//          }, true),
//          accessToken = access && access.get('accessToken'),
//          expires = access && access.get('expires'),
//          popup;
//
//      if (access && (!expires || expires > +new Date()))
//        return authDfd.resolve().promise();
//      
//      var authParams = {
//            response_type: 'token',
//            client_id: this.consumer.clientId, // TODO: get actual prop name, dev may have renamed it
//            redirect_uri: G.appUrl, // catch in "list" route and close popup
//            state: U.getHash() + '&' + $.param({
//              provider: this.provider._uri
//            })
//          },
//          cbName = 'onOAuthComplete' + G.nextId(),
//          accessModelDfd = $.Deferred(),
//          accessModel;
//      
//      if (!access) {
//        var accessType = 'model/social/AppOAuth{0}Access'.format(version);
//        Voc.getModels(accessType).done(function() {
//          accessModel = U.getModel(accessType);
//          if (!access) {
//            access = new accessModel({
//              appAccount: self.consumer.getUri()
//            });
//          }
//          
//          accessModelDfd.resolve();
//        });
//      }
      
// // OAuth 2 Implicit flow      
//      accessModelDfd.promise().done(function() {
//        var authUrl,
//            scope;
//        
//        scope = access.get('scope');
//        if (scope)
//          authParams.scope = scope;
//        
//        authUrl = this.provider.authorizationEndpoint + '?' + $.param(authParams);
//        window[cbName] = function(authInfo) {
//          debugger;
//          !popup.closed && popup.close();
//          window[cbName] = null;
//          if (authInfo.expires_in)
//            authInfo.expires = +new Date() + (authInfo.expires_in * 1000);
//          
//          access.set({
//            accessToken: authInfo.access_token,
//            refreshToken: authInfo.refresh_token,
//            expires: authInfo.expires
//          });
//          
//          access.save();
//          self.access = access;
//          authDfd.resolve();
//        };
//        
//        popup = window.open(authUrl);
//      });
//      
//      return authDfd.promise();
    },
    
    jsonp2request: function(url, method) {
      debugger;
      if (!this.access)
        throw new Error("You must authenticate the user first");
      
      method = (method || 'GET').toUpperCase();
      return $.Deferred(function(defer) {
        // if using $.ajax, need to use form $.ajax({dataType: 'jsonp', url: url + '&callback=?'}
        var cb = '__urbienJSONPCallback' + G.nextId();
        window[cb] = function() {
          delete window[cb];
          defer.resolve.apply(defer, arguments);
        };
        
        url += (url.indexOf("?") == -1 ?  "?" : '&') + $.param({
          access_token: accessToken,
          callback: cb
        });
        
        if (/^http\:/.test(url))
          url = 'https' + url.slice(4);
        
        U.ajax({
          url: url
        });
      }).promise();
    }
  });
  
  return (G.Voc = Voc);
});