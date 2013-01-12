define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils',
  'cache!error'
], function(G, $, __jqm__, _, Backbone, U, Error) {
  var isNully = function(val) {
    return _.isUndefined(val) || val === null || val === '';
  };
  
  var willSave = function(res, prop, val) {
    var prev = res.get(prop);
    if (isNully(prev))
      return !isNully(val);
    else if (prev !== val && prev.toString() !== val)
      return true;
    
    return false;
  }

  var Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(options) {
      _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', 'fetch', 'set'); // fixes loss of context for 'this' within methods
//      this.on('change', this.updateDB);
//      this.on('aroundMe', this.constructor.getAroundMe);
      if (options && options._query)
        this.urlRoot += "?" + options._query;
      
      this.vocModel = this.constructor;
//      this.sync = this.constructor.sync;
    },
    url: function() {
      var uri = this.get('_uri');
      var type = this.constructor.type;
      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
      return G.apiUrl + encodeURIComponent(type) + "?$blCounts=y&$minify=y&_uri=" + U.encode(uri);
    },
    getKey: function() {
      return U.getLongUri(this.get('_uri'));
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
    
    set: function(props) {
      var self = this;
      props = U.filterObj(props, function(name, val) {
        return willSave(self, name, val);
      })
      
      return Backbone.Model.prototype.set.apply(this, [props].concat(U.slice.call(arguments, 1)));
    },
    
    validate: function(attrs, options) {
      if (this.lastFetchOrigin !== 'edit')
        return;
      
      var errors = {};
      var props = options.validateAll ? this.constructor.properties : attrs;
      var values = attrs;
      for (var name in props) {
        var error = this.validateProperty(name, attrs[name]);
        if (error !== true)
          errors[name] = typeof error === 'string' ? error : "Please enter a valid " + name;
      }
      
      if (_.size(errors))
        return errors;
    },
    
    validateProperty: function(name, value) {
      var prop = this.constructor.properties[name];
      if (!prop || prop.readOnly || prop.backLink || prop.virtual || prop.propertyGroupList)
        return true;
      
      if (value == null || value === '') {
        if (prop.required)
          return U.getPropDisplayName(prop) + ' is a required field';
        else
          return true;
      }
      else if (value === this.get(name))
        return true;
      
      if (prop.range === 'enum')
        return true;
      
      var facet = prop.facet;
      if (facet) {
        if (facet.endsWith('emailAddress'))
          return U.validateEmail(value) || 'Please enter a valid email';
        else if (facet.toLowerCase().endsWith('phone'))
          return U.validatePhone(value) || 'Please enter a valid phone number';
      }
        
      var cloneOf = prop.cloneOf;
      if (cloneOf) {
        if (/^Address1?\.postalCode1?$/.test(cloneOf))
          return U.validateZip(value) || 'Please enter a valid Postal Code';
      }

//      for (var name in prop) {
//        var error;
//        switch (name) {
//          case "required":
//            error = value == null && (name + " is required");
//            break;
//        }
//        
//        if (typeof error != 'undefined')
//          return error;
//      }
      
      return true;
    },
    isA: function(interfaceName) {
      return U.isA(this.constructor, interfaceName);
    },
    fetch: function(options) {
      var self = this;
      options = options || {};
      options.error = options.error || Error.getDefaultErrorHandler();
      options.url = this.url();
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
  }, {
    displayName: 'Resource'
  });
  
  Resource.properties = _.clone(Resource.myProperties);
  Resource.interfaces = _.clone(Resource.myInterfaces);  
  return Resource;
});
