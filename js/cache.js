define(['globals', 'underscore', 'events'], function(G, _, Events) {
  var C;
  var C = cache = {
    // Models
//    MODEL_PREFIX: 'model:',
//    ENUMERATIONS_KEY: 'enumerations',
    shortNameToModel: {},
    typeToModel: {},
    shortNameToEnum: {},
    typeToEnum: {},
    shortNameToInline: {},
    typeToInline: {},
    modCache: {},

//    usedModels: {},

    // Resources and ResourceLists
    Resources: {},
    ResourceLists: {},
    
    // codemirror editors
    codemirrors: {},
    
    cacheModel: function(model) {
      var snCache, typeCache;
      if (model.enumeration) {
        snCache = C.shortNameToEnum;
        typeCache = C.typeToEnum;
      }
      else if (model.alwaysInlined) {
        snCache = C.shortNameToInline;
        typeCache = C.typeToInline;
      }
      else {
        snCache = C.shortNameToModel;
        typeCache = C.typeToModel;
      }
      
      snCache[model.shortName] = model;
      typeCache[model.type] = model;
    },
    cacheResource: function(resource) {
      var uri = resource.getUri();
      if (uri)
        C.Resources[uri] = resource;
    },
    getResource: function(uri) {
      switch (typeof uri) {
      case 'string':
        var res = C.Resources[uri];
        if (res)
          return res;
        
        var search = C.searchCollections(uri);
        return search && search.resource;
      case 'function':
        var filter = uri;
        var fromResCache = _.filter(C.Resources, filter);
        var fromColCache = searchCollections(C.ResourceLists, filter);
        return fromResCache.concat(fromColCache || []);
      }
    },
    getResourceList: function(model, query) {
      var typeUri = model.type;
      return (C.ResourceLists[typeUri] = C.ResourceLists[typeUri] || {})[query || typeUri];
    },
    cacheResourceList: function(list) {
      var qs = list.query; // || $.param(list.params);
//      if (qs) // taken care of in ResourceList
//        qs = U.getQueryString(U.getQueryParams(qs, list.vocModel), true);
        
      var typeUri = list.vocModel.type;
      return (C.ResourceLists[typeUri] = C.ResourceLists[typeUri] || {})[qs || typeUri] = list;
    },
    /**
     * search a collection map for a collection with a given model
     * @return if filter function is passed in, return all resources that matched across all collections, otherwise return {collection: collection, resource: resource}, 
     *         where collection is the first one found containing a resource where resource.getUri() == uri, or null otherwise
     *         
     * @param uri: uri of a model, or filter function
     */
    searchCollections: function(collections, uri) {
      var filter;
      if (arguments.length == 1) { // if just uri is passed in, search all available collections
        uri = collections;
        collections = C.ResourceLists;
      }
      else {
        filter = typeof uri === 'function' && uri;
        collections = [collections];
      }
      
      var matches = [];
      for (var type in collections) {
        var collectionsByQuery = collections[type];
        for (var query in collectionsByQuery) {
          var resource;
          var col = collectionsByQuery[query];
          if (filter) { 
            matches = _.union(matches, col.filter(filter));
            continue;
          }
          else {
            resource = collectionsByQuery[query].get(uri);
            if (resource)
              return {collection: collectionsByQuery[query], resource: resource};
          }
        }
      }
      
      return matches || null;
    },
    
    /**
     * @param atts: attributes that must be present on the resource we're searching for
     */
    search: function(type, atts) {
      var tester = function(res) {
        for (var name in atts) {
          var value = atts[name];
          if (res.get(name) !== value)
            return false;
        }        
        
        return true;
      };
      
      for (var uri in C.Resources) {
        var res = C.Resources[uri];
        if (tester(res))
          return res;
      }
      
      for (var colType in C.ResourceLists) {
        var cols = C.ResourceLists[colType];
        for (var query in cols) {
          var col = cols[query], resources = col.models;
          for (var i = 0; i < resources.length; i++) {
            var res = resources[i];
            if (tester(res))
              return res;
          }
        }
      }
      
      return null;
    },
    
    // Plugs
    plugs: {},
//    PLUGS_PREFIX: 'plugs:',
//    savePlugs: function(plugs) {
//      for (var type in plugs) {
//        C.plugs[type] = C.plugs[type] || plugs[type];
//      }
//      
//      if (!G.hasLocalStorage)
//        return;
//      
//      for (var type in plugs) {
//        G.localStorage.putAsync(C.PLUGS_PREFIX + type, plugs[type]);
//      }
//    },

    clearCache: function() {
      C.shortNameToModel = {};
      C.typeToModel = {};
      C.shortNameToEnum = {};
      C.typeToEnum = {};
      C.shortNameToInline = {};
      C.typeToInline = {};
//      Voc.models = [];
//      Voc.mightBeStale = {};
    }
//    ,
//    
//    getCodemirror: function(uri, propName) {
//      var resEditors = C.codemirrors[uri];
//      return resEditors && resEditors[propName];
//    }
  };

  Events.on('badList', function(list) {
    for (var colType in C.ResourceLists) {
      var cols = C.ResourceLists[colType];
      for (var query in cols) {
        if (cols[query] === list)
          delete cols[query];
      }
    }
  });

  Events.on('newResourceList', function(list) {
    C.cacheResourceList(list);
    var listType = list.vocModel.type;
//    if (listType === G.commonTypes.Jst)
//      C.templatesList = list;
    
    for (var uri in C.Resources) {
      var res = C.Resources[uri];
      if (res.vocModel.type == listType && !list.get(uri) && list.belongsInCollection(res)) {
        list.add(res);
      }
    }
  });
  
  Events.on('newResource', C.cacheResource);
  return G.Cache = cache;
});