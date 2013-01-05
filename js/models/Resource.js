define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!error'
], function(G, $, __jqm__, _, Backbone, U, Error) {
  var Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(options) {
      _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', 'fetch'); // fixes loss of context for 'this' within methods
//      this.on('change', this.updateDB);
//      this.on('aroundMe', this.constructor.getAroundMe);
      options._query && (this.urlRoot += "?" + options._query);
//      this.sync = this.constructor.sync;
    },
    url: function() {
      return G.apiUrl + this.constructor.shortName + "?$blCounts=y&_uri=" + U.encode(this.get('_uri'));
    },
    getKey: function() {
      return this.get('_uri');
    },
    parse: function (resp) {
      if (this.loaded && this.lastFetchOrigin == 'db')
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
          return typeof validated === 'string' ? error : "Please enter a valid " + name;
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
      options.error = options.error || Error.getDefaultErrorHandler();
      var success = options.success;
      options.success = function() {
        success && success.apply(self, arguments);
//        self.fetchModelsForLinkedResources.call(self.constructor);
      };
      
//      var jqXHR = Backbone.Model.prototype.fetch.apply(this, arguments);
//      if (options.sync)
//        jqXHR.timeout = 5000;
//      
//      return jqXHR;
      return Backbone.Model.prototype.fetch.apply(this, arguments);
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
