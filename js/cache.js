define(['globals', 'jquery', 'events'], function(G, $, Events) {
  var cache = C = {
    // Models
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
      return C.Resources[resource.getUri()] = resource;
    },
    getResource: function(uri) {
      return C.Resources[uri] || C.searchCollections(uri);
    },
    getResourceList: function(typeUri, query) {
      return (C.ResourceLists[typeUri] = C.ResourceLists[typeUri] || {})[query];
    },
    cacheResourceList: function(list) {
      var qs = list._query || $.param(list.queryMap);
      var typeUri = list.vocModel.type;
      return (C.ResourceLists[typeUri] = C.ResourceLists[typeUri] || {})[qs || typeUri] = list;
    },
    /**
     * search a collection map for a collection with a given model
     * @return {collection: collection, model: model}, where collection is the first one found containing a model where model.get('_uri') == uri, or null otherwise
     * @param uri: uri of a model
     */
    searchCollections: function(collections, uri) {
      if (arguments.length == 1) // if just uri is passed in, search all available collections
        collections = C.ResourceLists;
      else
        collections = [collections];
      
      for (var i = 0; i < collections.length; i++) {
        var collectionsByQuery = collections[i];
        for (var query in collectionsByQuery) {
          var m = collectionsByQuery[query].get(uri);
          if (m) 
            return {collection: collectionsByQuery[query], model: m};
        }
      }
      
      return null;
    },
    
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
  };
  
  Events.on('newResourceList', C.cacheResourceList);
  Events.on('newResource', function(resource) {
    C.cacheResource(resource);
    for (var colType in C.ResourceLists) {
      var cols = C.ResourceLists[colType];
      for (var colQuery in cols) {
        var col = cols[colQuery];
        if (col.belongsInCollection(resource)) {
          col.add(resource, {refresh: true});
        }
      }
    }
  });


  return cache;
});