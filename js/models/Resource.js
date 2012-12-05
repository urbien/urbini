// needs Lablz.apiUrl, Lablz.requiredModels
define([
  'jquery',
  'backbone',
  'underscore',
  'utils',
  'localStorageModule',
  'modelsBase',
  'error'
], function($, Backbone, _, U, LS, MB, Error) {
  Resource = Backbone.Model.extend({
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
      resp._shortUri = U.getShortUri(uri, this.constructor);
      var primaryKeys = U.getPrimaryKeys(this.constructor);
      resp._uri = U.getLongUri(resp._uri, this.constructor.type, primaryKeys);
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
        return U.validateEmail(value) || false;
//      else if (type == 'tel')
//        return U.validateTel(value) || false;
        
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
      var self = this;
      if (this.lastFetchOrigin != 'db' && !this.collection) // if this resource is part of a collection, the collection will update the db in bulk
        setTimeout(function() {storage.addItem(self)}, 100);
    },
    isA: function(interfaceName) {
      return U.isA(this.constructor, interfaceName);
    },
    fetch: function(options) {
      var self = this;
      options = options || {};
//      options.data = options.data || {};
//      options.data.lastFetchedOn = this.lastFetchedOn;
      options.error = Error.getDefaultErrorHandler(options.error);
      var success = options.success;
      options.success = function() {
        success && success.apply(self, arguments);
        self.fetchModelsForLinkedResources.call(self.constructor);
      };
      
      return Backbone.Model.prototype.fetch.call(this, options);
    }  
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
  
  Resource.properties = _.clone(Resource.myProperties);
  Resource.interfaces = _.clone(Resource.myInterfaces);
  Resource.prototype.fetchModelsForLinkedResources = function() {
    var tmp = new U.UArray();
    _.forEach(this.properties, function(p) {
      p.range && tmp.push(p.range);
    });
    
    var linkedModels = [];
    var l = Lablz.requiredModels.linkedModels;
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
//      linkedModels = _.uniq(linkedModels);
      LS.loadStoredModels({models: linkedModels});
      MB.fetchModels(null, {sync: false});
    }
  };
  
  return Resource;
});
