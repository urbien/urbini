define([
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!error'
], function($, _, Backbone, U, Error) {
  Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(options) {
      _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', 'fetch'); // fixes loss of context for 'this' within methods
//      this.on('change', this.updateDB);
//      this.on('aroundMe', this.constructor.getAroundMe);
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
      resp._uri = U.getLongUri(resp._uri, {type: this.constructor.type, primaryKeys: primaryKeys});
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
//        self.fetchModelsForLinkedResources.call(self.constructor);
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
  return Resource;
});
