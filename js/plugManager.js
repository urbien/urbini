define('plugManager', ['globals', 'underscore', 'events', 'utils', 'modelLoader', 'collections/ResourceList'], function(G, _, Events, U, ModelLoader, ResourceList) {
  var PLUGS_PREFIX = 'plugs:',
      scriptActions = ['create', 'edit'],
      CACHE = {};

  var plugTools = {
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
      
      ModelLoader.getModels([propType]).done(function() {
        var propModel = U.getModel(propType);     // Recipe in the example
        if (!propModel) {
          debugger; // should never happen
          return;
        }
        
        var backlinkProp = propModel.properties[backlinkName]; 
        if (!backlinkProp) {
          log('error', 'class {0} doesn\'t have a property {1}'.format(propType, backlinkName)); 
          return;
        }
        
        var backlinkType = U.getTypeUri(backlinkProp.range);
        ModelLoader.getModels(backlinkType).done(function() { 
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
            fn = preparePlug(fn, subPlug);
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
  };
  

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("plugManager");
    G.log.apply(G, args);
  };

  // from http://www.bennadel.com/blog/1929-Using-The-WITH-Keyword-With-Javascript-s-Function-Constructor.htm
  function FunctionProxy(sourceCode) {
    
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
  };

  function initPlug(plug) {
    this.plugs = this.plugs || U.toObject(this.scriptActions);
    var cause = plug.causeDavClassUri;
    var effect = plug.effectDavClassUri;
    var scripts = {};
    _.each(scriptActions, function(action) {        
      scripts[action] = plug['on' + action.camelize(true)];
    });
    
    for (var action in scripts) {
      var script = scripts[action];
      if (script) {
        script = U.removeJSComments(script).trim();
        if (!script.length)
          continue;
        
        script = buildScript(script); //, plug.causeDavClassUri, plug.causeDavClassUri);
//          script = new Function(script.startsWith("function") ? script.slice(script.indexOf("{") + 1, script.lastIndexOf("}")) : script); //, plug.causeDavClassUri, plug.causeDavClassUri);
        if (script === null)
          log('error', 'bad custom on{0} script'.format(action), plug.app, cause);
        else {
          var scriptPlusGoodies = preparePlug(script, plug);
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
  };

  function buildScript(script) {
    if (typeof script === 'function') {
      debugger; 
      return script;
    }
    
    var proxy = FunctionProxy(script.trim());
    proxy.proxy = true;
    return proxy;
  };

  function setupPlugs(plugs) {
    if (!plugs)
      return;
    
    _.extend(CACHE, plugs);
//      _.extend(C.plugs, plugs);
//        Voc.savePlugsToStorage(plugs);
    for (var type in plugs) {
      var typePlugs = plugs[type];
      for (var i = 0; i < typePlugs.length; i++) {
        initPlug(typePlugs[i]);
      }
    }
  };
  
  function initPlugs(type) {
    // TODO: turn off plugs as needed, instead of this massacre
    _.each(this.scriptActions, function(action) {
      Events.off(action + ':' + type);
    });
    
    var plugs = CACHE[type];
    if (!plugs) {
      plugs = G.localStorage.get(PLUGS_PREFIX + type);
      if (plugs)
        plugs = JSON.parse(plugs);
    }
    
    if (!plugs)
      return;
  
    _.each(plugs, function(plug) {
      initPlug(plug);
    });
  };

  function fetchPlugs(models) {
    if (!models) {
      var modelPrefix = ModelLoader.getModelStoragePrefix() + G.DEV_PACKAGE_PATH + G.currentApp.appPath;
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
      setupPlugs(data.plugs);
    });
  };
  
  function preparePlug(plugFn, plug) {
    return function(res) {
      return executePlug(plugFn, plug, res);
    }
  };
  
  /**
   * prepackage all the built in plug functions like "each" with the resources and models needed for a given operation
   */
  function getPlugToolSuite(cause, causeModel, effect, effectModel, plug) {
    var plugTools = {};
    var context = {cause: cause, causeModel: causeModel, effect: effect, effectModel: effectModel, plug: plug};
    _.each(plugTools, function(fn, name) {
      plugTools[name] = function() {
        fn.apply(context, arguments); // give fn access to cause, causeModel, effect, effectModel
      };
    });
    
    return plugTools;
  };
  
  /**
   * @param plug a function that takes in two parameters: from and to, a.k.a. cause and effect
   */
  function executePlug(plugFn, plug, cause) {
    var effectType = plug.effectDavClassUri;
    var type = effectType.slice(effectType.lastIndexOf("/") + 1).camelize();
    var effect = {};

    ModelLoader.getModels(effectType).done(function() {
      var effectModel =  U.getModel(effectType),
          causeModel = U.getModel(plug.causeDavClassUri),
          toolSuite = getPlugToolSuite(cause, causeModel, effect, effectModel, plug);
      
      var goAhead; 
      try {
        if (plugFn.proxy)
          goAhead = plugFn.apply(toolSuite).call({}, cause, effect);
        else
          goAhead = plugFn.call({}, cause, effect);
      } catch (err) {
        nukePlug(plug, plugFn);
        return;
      }
      
      if (goAhead === false)
        return;
              
//      if (!_.size(effect))
//        return;
      
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
//      effect.cause = cause._uri;
      res.save(effect, {'$returnMade': false, sync: false});
    }).fail(function() {
      debugger;
    });
  };

  function nukePlug(plug, plugFn) {
    var causeType = plug.causeDavClassUri;
    CACHE[causeType] = _.filter(CACHE[causeType], function(h) {
      return h._uri != plug._uri;
    });
    
    if (plugFn == null) {
      initPlugs(causeType);
      return;
    }
    
    _.each(scriptActions, function(action) {        
      Events.off(action + ':' + causeType, plugFn);
    });
  };

  function savePlugsToStorage(plugs) {
    if (!localStorage || !_.size(plugs))
      return;
  
    var ls = G.localStorage;
    for (var type in plugs) {
      var typePlugs = plugs[type];
      typePlugs = typeof typePlugs === 'string' ? JSON.parse(typePlugs) : typePlugs;
      var key = PLUGS_PREFIX + type;
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
  };

  var PlugManager = {
    fetchPlugs: fetchPlugs
  };
  
  _.extend(PlugManager, Backbone.Events);
  
  Events.on('initPlugs', initPlugs);
  Events.on('newPlugs', setupPlugs);
  Events.on('newPlugs', savePlugsToStorage);
  Events.on('newPlug', function(plug) {
    var plugs = {};
    plug = U.isModel(plug) ? plug.toJSON() : plug;
    var type = plug.causeDavClassUri;
    plugs[type] = [plug];
//    C.savePlugs(plugs);
    setupPlugs(plugs);
  });

  return PlugManager;
});