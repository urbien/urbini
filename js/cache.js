define('cache', ['globals', 'underscore', 'events'], function(G, _, Events) {
  var shortNameToModel = {},
      typeToModel = {},
      shortNameToEnum = {},
      typeToEnum = {},
      shortNameToInline = {},
      typeToInline = {},
      modCache = {},
      resourceCache = ResourceCache(),
      viewCache = ViewCache(),
      // codemirror editors
      codemirrors = {},
      MAX_VIEWS_TO_CACHE = 6,
      AP = Array.prototype;

//  function CacheEntry(obj, permanent) {
//    this.permanent = permanent;
//  };
//  
//  CacheEntry.prototype.isPermanent = function() {
//    return permanent;
//  };
//      
//  function ResourceCacheEntry(resource, permanent) {
//    CacheEntry.apply(this, arguments);
//  };
//
//  function ResourceListCacheEntry(list, permanent) {
//    CacheEntry.apply(this, arguments);
//  };

  function ResourceCache() {
    var resourcesByUri = {},
//        resourcesByCid = {},
        lists = {};
    
//    var resources = [],
//        lists = [];
//    
//    function clean() {
//      resources = _.filter(resources, CacheEntry.prototype.isPermanent);
//      lists = _.filter(lists, CacheEntry.prototype.isPermanent);
//    };

    function cacheResource(resource) {
      var uri = resource.getUri();
      if (uri)
        resourcesByUri[uri] = resource;
      
//      resourcesByCid[resource.cid] = resource;
    };
    
    function uncacheResource(/* resource, cid or uri */) {
      var uri, 
//          cid,
          res = arguments[0];
      
      if (typeof res == 'object') {
        uri = res.getUri();
//        cid = res.cid;
        if (uri)
          delete resourcesByUri[uri];
//        if (cid)
//          delete resourcesByCid[cid]
      }
      else {
        res = resourcesByUri[res];// || resourcesByCid[res];
        return res && uncacheResource(res);
      }
    }
    
    function cacheList(list) {
      var qs = list.query, // || $.param(list.params);
          typeUri = list.vocModel.type;
      
      return (lists[typeUri] = lists[typeUri] || {})[qs || typeUri] = list;
    }

    function uncacheList(list) {
      var qs = list.query, // || $.param(list.params);
          typeUri = list.vocModel.type;
      
      var subCache = lists[typeUri];
      if (subCache)
        delete subCache[qs || typeUri];
    }

    /**
     * search a collection map for a collection with a given model
     * @return if filter function is passed in, return all resources that matched across all collections, otherwise return {collection: collection, resource: resource}, 
     *         where collection is the first one found containing a resource where resource.getUri() == uri, or null otherwise
     *         
     * @param uri: uri of a model, or filter function
     */
    function searchCollections(collections, uri) {
      var filter;
      if (arguments.length == 1) { // if just uri is passed in, search all available collections
        uri = collections;
        collections = lists;
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
            pushUniq(matches, col.filter(filter));
            continue;
          }
          else {
            resource = collectionsByQuery[query].get(uri);
            if (resource) {
              return {
                collection: collectionsByQuery[query], 
                resource: resource
              };
            }
          }
        }
      }
      
      return matches || null;
    }
    
    /**
     * @param atts: attributes that must be present on the resource we're searching for
     */
    function search(type, atts) {
      
      var tester = function(res) {
        for (var name in atts) {
          var value = atts[name];
          if (res.get(name) !== value)
            return false;
        }        
        
        return true;
      };
      
      for (var uri in resourcesByUri) {
        var res = resourcesByUri[uri];
        if (tester(res))
          return res;
      }
      
      for (var colType in lists) {
        var cols = lists[colType];
        for (var query in cols) {
          var col = cols[query], 
              resources = col.models;
          
          for (var i = 0; i < resources.length; i++) {
            var res = resources[i];
            if (tester(res))
              return res;
          }
        }
      }
      
      return null;
    }
    
    function getResource(uri) {
      switch (typeof uri) {
      case 'string':
        var res = resourcesByUri[uri];
        if (res)
          return res;
        
        var search = searchCollections(uri);
        return search && search.resource;
      case 'function':
        var filter = uri;
        var fromResCache = _.filter(resourcesByUri, filter);
        var fromColCache = searchCollections(lists, filter);
        return fromResCache.concat(fromColCache || []);
      }
    }
    
    function getList(model, query) {
      var typeUri = model.type;
      return (lists[typeUri] = lists[typeUri] || {})[query || typeUri];
    }

    Events.on('badList', function(list) {
      for (var colType in lists) {
        var cols = lists[colType];
        for (var query in cols) {
          if (cols[query] === list)
            delete cols[query];
        }
      }
    });

    Events.on('newResourceList', function(list) {
      // Checks the individually cached resources to see if they can be added to this list;
      // Maybe this should be in Resource.js, but having it for every resource and not just the "important" seems like a waste for now
      var added = [],
          listType = list.vocModel.type;
      
      for (var uri in resourcesByUri) {
        var res = resourcesByUri[uri];
        if (res.isAssignableFrom(listType))
          _.pushUniq(added, res);
      }
      
      if (added.length)
        list.filterAndAddResources([res]);
    });

    return {
      cacheResource: cacheResource,
      uncacheResource: uncacheResource,
      cacheList: cacheList,
      uncacheList: uncacheList,
      getResource: getResource,
      getList: getList
    };
  }
      
  function ViewCacheEntry(view, url) {
    var self = this,
        age = 0;
    
    return {
      age: function() {
        return age;
      },
      growOlder: function() {
        age++;
      },
      rejuvenate: function() {
        age = 0;
      },
      getUrl: function() {
        return url;
      },
      getView: function() {
        return view;
      }
    };
  }

  function simplifyUrl(url) {
    var qIdx = url.indexOf('?');
    if (qIdx == -1)
      return url;
    
    var base = url.slice(0, qIdx),
        qs = url.slice(qIdx + 1),
        match = qs.match(/&?-\w+=[^&]+&?/ig);
    
    if (!match)
      return url;
    
    qs = qs.replace(/&?-\w+=[^&]+&?/ig, '&').replace(/&+/ig, '&');
    if (/^&/.test(qs))
      qs = qs.slice(1);
    
    if (/&$/.test(qs))
      qs = qs.slice(0, qs.length - 1);
    
    return base + '?' + qs;
  };
  
  function ViewCache() {
    var cache = [];
    function getCachedView(url) {
      url = simplifyUrl(url || window.location.href);
      var cached = getCached(url);
      return cached ? cached.getView() : null;
    }

    function getCached(url) {
      url = simplifyUrl(url);
      return _.find(cache, function(entry) {
        return entry.getUrl() == url;
      });
    }
    
    function put(view, url) {
      url = simplifyUrl(url || window.location.href);
      var cached = getCached(url),
          entry;
      
      _.each(cache, function(entry) {
        entry.growOlder();
      });
      
      if (cached && cached.getView() === view) {
        cached.rejuvenate();
        return false;
      }
      
      entry = ViewCacheEntry(view, url, this);
      cache.push(entry);
      
      // let the turn of the event loop that caused cache update to finish first
      setTimeout(clean, 0);
    }
    
    function uncacheView(viewOrUrl, destroy) {
      for (var i = 0; i < cache.length; i++) {
        var entry = cache[i];
        if (entry.getUrl() == viewOrUrl || entry.getView() == viewOrUrl) {
          if (destroy)
            entry.getView().destroy();
          
          cache.splice(i, 1);
          return;
        }
      }
    }
    
    function overCapacity() {
      return cache.length > MAX_VIEWS_TO_CACHE; 
    }
    
    function clean() {
      if (overCapacity()) {
        cache.sort(function(entryA, entryB) {
          return entryA.age() - entryB.age();
        });
      
        while (overCapacity()) {
          var entry = Array.peek(cache),
              view = entry.getView();
          
          if (view.destroy) { // some views, like homePage, are indestructible :)
            cache.pop();
            view.destroy();
          }
        }
      }
    }
    
    function getViews() {
      return _.map(cache, function(entry) {
        return entry.getView();
      });
    }

    function getResources() {
      return _.compact(_.pluck(getViews(), 'resource'));
    }

    function addCollections(view, cols) {
      var res = view.resource,
          col = view.collection;
      
      if (res) {
        col = res.collection;
        if (col) {
          if (cols.indexOf(col) == -1)
            cols.push(col);
        }
        
        pushUniq(cols, res.getInlineLists());
      }
      else if (col) {
        pushUniq(cols, col);
      }
      
      for (var id in view.children) {
        var col = view.children[id].collection;
        if (col)
          pushUniq(cols, col);
      }
    }
    
    function getLists() {
      var cols = [],
          views = getViews(),
          i = views.length;
      
      while (i--) {        
        addCollections(views[i], cols);
      }
      
      return cols;
    }
    
    Events.on('pageChange', function(prev, current) {
      if (current.isCacheable())
        put(current);
    });
    
    Events.on('viewDestroyed', function(destroyedView) {
      if (destroyedView.isPageView()) {
        cache = _.filter(cache, function(entry) {
          return entry.getView() !== destroyedView;
        });
      }
      
      var resOrList = destroyedView.model,
          destroy = true;
      
      if (!resOrList || ((resOrList instanceof Backbone.Model) && resOrList.collection)) {
        // don't destroy resources that are in live collections
        return;
      }

      Events.once('saveModelFromUntimelyDeath.' + resOrList.cid, function() {
        destroy = false;
      });
      
      Events.trigger('preparingModelForDestruction', resOrList);
      Events.trigger('preparingModelForDestruction.' + resOrList.cid, resOrList);
      if (destroy)
        resOrList.selfDestruct();
    });
    
    return {
      uncacheView: uncacheView,
      getCachedView: getCachedView,
      getViews: getViews,
      getResources: getResources,
      getLists: getLists,
      remove: function(entry) {
        var idx = cache.indexOf(entry);
        if (idx != -1)
          Array.removeFromTo(cache, idx, idx + 1);
      }
    };
  }

  function cacheModel(model) {
    var snCache, typeCache;
    if (model.enumeration) {
      snCache = shortNameToEnum;
      typeCache = typeToEnum;
    }
    else if (model.alwaysInlined) {
      snCache = shortNameToInline;
      typeCache = typeToInline;
    }
    else {
      snCache = shortNameToModel;
      typeCache = typeToModel;
    }
    
    snCache[model.shortName] = model;
    typeCache[model.type] = model;
  }
  
  function findResource(lists, uri) {
    var res,
        col = _.find(lists, function(list) {
          return (res = list.get(uri));
        });
    
    return res;
  }
  
//  function getModel(type) {
//    return typeToModel[type] || shortNameToModel[type];
//  };
  
  function pushUniq(arr, obj) {
    var items = AP.concat.apply(AP, AP.slice.call(arguments, 1));
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!_.contains(arr, item))
        arr.push(item);
    }
  }
  
  var Cache = {
    TAG: 'Cache',
    // Models
//    MODEL_PREFIX: 'model:',
//    ENUMERATIONS_KEY: 'enumerations',
    getCachedView: viewCache.getCachedView.bind(viewCache),
    getModel: function(type) {
      type = G.classMap[type] || type;
      return typeToModel[type] || shortNameToModel[type];
    },
    
    getInlineResourceModel: function(type) {
      return shortNameToInline[type] || typeToInline[type];
    },
    
    getEnumModel: function(type) {
      return shortNameToEnum[type] || typeToEnum[type];      
    },

    getResource: function(uri) {
      var res = resourceCache.getResource(uri);
      if (res)
        return res;
      
      res = _.find(viewCache.getResources(), function(r) {
        return r.getUri() == uri;
      });
      
      return res || findResource(viewCache.getLists(), uri);
    },
    
    getResourceList: function(model, query) {
      var type = model.type,
          list = resourceCache.getList(model, query);
      
      return list || _.find(viewCache.getLists(), function(list) {
        return list.type === type && (list._query == query || list.query == query); // either with special params or without (like $prop, $forResource, $blahBlah, -hello)
      });
    },
    
    // Plugs
//    plugs: {},
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

//    cachePlugs: function(plugs) {
//      _.extend(C.plugs, plugs);
//    },
    
    clearCache: function() {
      shortNameToModel = {};
      typeToModel = {};
      shortNameToEnum = {};
      typeToEnum = {};
      shortNameToInline = {};
      typeToInline = {};
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

  Events.on('uncacheView', viewCache.uncacheView);
  Events.on('cacheList', resourceCache.cacheList);
  Events.on('cacheResource', resourceCache.cacheResource);
//  Events.on('savedMake', resourceCache.updateResource);
  Events.on('uncacheList', resourceCache.uncacheList);
  Events.on('uncacheResource', resourceCache.uncacheResource);
  Events.on('delete', resourceCache.uncacheResource);
  Events.on('newModel', cacheModel);
  
  Events.on('savedMake', function(resource) {
    resourceCache.cacheResource(resource);
    var tempUri = resource.getUri();
    resource.on('syncedWithServer', function() {
//      resourceCache.uncacheResource(tempUri);
      resourceCache.cacheResource(resource);
    });
  });
//  Events.on('newPlugs', C.cachePlugs);
  
  return G.Cache = Cache;
});