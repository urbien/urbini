//'use strict';
define([
  'globals',
  'utils',
  'error',
  'events'
], function(G, U, Error, Events) {
  var willSave = function(res, prop, val) {
    var prev = res.get(prop);
    if (U.isNully(prev))
      return !U.isNully(val);
    else if (prev !== val && prev.toString() !== val)
      return true;
    
    return false;
  }

  var Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(options) {
      _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', 'fetch', 'set', 'remove', 'onchange', 'onsync', 'cancel', 'incBLs'); // fixes loss of context for 'this' within methods
      if (options && options._query)
        this.urlRoot += "?" + options._query;
      
      this.on('cancel', this.remove);
      this.on('change', this.onchange);
      this.on('sync', this.onsync);
      this.on('incBLs', this.incBLs);
      this.vocModel = this.constructor;
      if (this.getUri())
        this.subscribeToUpdates();
      
//      var type = this.vocModel.type;
//      if (type.startsWith('http://urbien.com/voc/dev/')) {
////        Events.trigger('installApp', );
//      }
    },
    
    /**
     * increment backlinks that a newly made resource fits under
     */
    incBLs: function(backlinkedResource) {
      var res = backlinkedResource;
      // check which backlinks this fits under and increment them
    },
    onsync: function() {
//      debugger;
    },
    subscribeToUpdates: function() {
      if (this.subscribedToUpdates)
        return;
      
      var resUri = this.getUri();
      if (!resUri)
        return;
      
      var self = this;
      
      // the reason we need this little nasty instead of using model.set from elsewhere 
      // is because that elsewhere is in the land of syncing the db with the server and 
      // has no idea which resource the data it just got belongs to. Another option would
      // be to have a central cache of resources by uri (like in G.Router), and look up 
      // the resource there and use model.set
      var callback = function(data) {
        var uri = self.getUri();
        if (data._oldUri === uri) {
          Events.off('synced.' + uri, callback);
          Events.on('synced.' + data._uri, callback);
//          self.trigger('uriChanged', {oldUri: uri, newUri: data._uri});
        }
        
        self.set(data);
      }
      
      Events.on('synced.' + resUri, callback);
      this.subscribedToUpdates = true;
    },
    cancel: function(options) {
      var props = this.vocModel.properties;
      var canceled = U.getCloneOf(this.vocModel, 'Cancellable.cancelled');
      if (!canceled.length)
        throw new Error("{0} can not be canceled because it does not have a 'canceled' property".format(U.getDisplayName(this)));
      
      canceled = canceled[0];
      var props = {};
      props[canceled] = true;
      var self = this;
//      this.save(props, options);
      var success = options.success;
      options.success = function(resource, response, options) {
        success && success.apply(this, arguments);
        if (!response.error)          
          self.trigger('cancel');
      }

      this.save(props, options);
    },
    onchange: function(e) {
      if (this.lastFetchOrigin !== 'server')
        return;
      
      Events.trigger('resourcesChanged', [this]);
    },
    remove: function() {
      this.collection && this.collection.remove(this);
    },
    url: function() {
      var uri = this.get('_uri');
      var type = this.vocModel.type;
      var retUri = G.apiUrl + encodeURIComponent(type) + "?$blCounts=y&$minify=y&$mobile=y";
      if (uri)
//      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
        return retUri + "&_uri=" + U.encode(uri);
      var action = this.get('action');
      if (action != 'make') 
        return retUri;
      var params = this.get('params');
      if (params) {
        params.$action = 'make';
        retUri += '&' + U.getQueryString(params);
//        retUri += '&$action=make';
//        for (var p in params) 
//          retUri += '&' + p +'=' + encodeURIComponent(params[p]);
      }  
      return retUri;
    },
    isNew: function() {
      return Backbone.Model.prototype.isNew.apply(this) || U.isTempUri(this.getUri());
    },
    saveUrl: function(attrs) {
      var type = this.vocModel.type;
      var isNew = this.isNew();
      return G.apiUrl + (isNew ? 'm/' : 'e/') + encodeURIComponent(type);
    },
    getKey: function() {
      return U.getLongUri1(this.get('_uri'));
    },
    getUri: function() {
      return this.get('_uri');
    },
    parse: function (resp) {
      var lf;
      if (this.lastFetchOrigin) {
        if (this.lastFetchOrigin === 'db') {
          if (this.loaded)
            return resp;
        }
        else
          lf = G.currentServerTime();
      }
      
      if (!resp || resp.error)
        return null;

      if (!resp.data) {
        this.loaded = true;
        return resp;
      }
        
      var uri = resp._uri;
      if (!uri) {      
        resp = resp.data[0];
        uri = resp._uri;
      }
      resp._shortUri = U.getShortUri(uri, this.constructor);
      var primaryKeys = U.getPrimaryKeys(this.constructor);
      resp._uri = U.getLongUri1(resp._uri, {type: this.constructor.type, primaryKeys: primaryKeys});
      if (lf)
        resp._lastFetchedOn = lf;
      
      this.loaded = true;
      return resp;
    },
    
    set: function(props, options) {
      if (!this.subscribedToUpdates && this.getUri())
        this.subscribeToUpdates();
      
      var self = this;
      if (!options || !options.silent) {
        props = U.filterObj(props, function(name, val) {
          return willSave(self, name, val);
        })
        
        if (!_.size(props))
          return;
      }
      
      return Backbone.Model.prototype.set.apply(this, [props].concat(U.slice.call(arguments, 1)));
    },
    
    validate: function(attrs, options) {
      if (this.lastFetchOrigin !== 'edit')
        return;
      
      var errors = {};
      var props = options.validateAll ? this.vocModel.properties : attrs;
      var values = attrs;
      for (var name in props) {
        var error = this.validateProperty(attrs, name, options);
        if (error !== true)
          errors[name] = typeof error === 'string' ? error : "Please enter a valid " + U.getPropDisplayName(props[name]);
      }
      
      if (_.size(errors))
        return errors;
    },
    
    validateProperty: function(attrs, name, options) {
      var prop = this.constructor.properties[name];
      if (!prop || prop.readOnly || prop.backLink || prop.virtual || prop.propertyGroupList)
        return true;
      
      var value = attrs[name];
      if (U.isNully(value)) {
        if (options.validateAll && prop.required && U.isPropEditable(this, prop)) {
          if (!prop.writeJS && !prop.formulaJS && !prop.formula && !U.isCloneOf(prop, 'Submission.submittedBy'))
            return U.getPropDisplayName(prop) + ' is a required field';
        }
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
        else { 
          var val = U.getTypedValue(this, name, value);
          if (val == null || val !== val) // test for NaN
            return false;
        }
      }
      else {
        val = U.getTypedValue(this, name, value);
        if (val == null || val !== val) // test for NaN
          return false;
        else
          attrs[name] = val;
      }
        
      var cloneOf = prop.cloneOf;
      if (cloneOf) {
        if (/^Address1?\.postalCode1?$/.test(cloneOf))
          return U.validateZip(value) || 'Please enter a valid Postal Code';
      }
      
      
      return true;
    },
    isAll: function(interfaceNames) {
      return U.isAll(this.vocModel, interfaceNames);
    },
    isOneOf: function(interfaceNames) {
      return U.isOneOf(this.vocModel, interfaceNames);
    },
    isA: function(interfaceName) {
      return U.isA(this.vocModel, interfaceName);
    },
    fetch: function(options) {
      var self = this;
      options = options || {};
      options.error = options.error || Error.getDefaultErrorHandler();
      options.url = this.url();
      return Backbone.Model.prototype.fetch.call(this, options);
    },

    save: function(attrs, options) {
      options = _.extend({silent: true, patch: true}, options || {});
      var data = attrs || options.data || this.attributes;
      if (options.sync) {
        data = U.prepForSync(data, this.vocModel, ['parameter']);
        
//        item = U.prepForSync(item, vocModel);
        data.$returnMade = options.$returnMade !== false;
        var isNew = this.isNew();
        if (!isNew)
          data._uri = this.getUri();
        else
          delete data._uri;
  
        var self = this;
//        var qs = U.getQueryString(data);
//        if (options.queryString)
//          qs += '&' + options.queryString;
        
        options = _.extend({url: this.saveUrl(attrs), silent: true, patch: true}, options, {data: data});
        var success = options.success, error = options.error;
        options.success = function(resource, response, opts) {
          success && success.apply(this, arguments);
          if (response.error)
            return;
          
          Events.trigger('resourcesChanged', [self]);
          var method = isNew ? 'create.' : 'edit.';
          if (!G.currentUser.guest) {
            var json = self.toJSON();
            json._type = self.vocModel.type;
            Events.trigger(method + self.vocModel.type, json);
            var sup = self.vocModel;
            while (sup = sup.superClass) {
              Events.trigger(method + sup.type, self);
            }
            
            // TODO: fix this hack, or move this to some place where we handle resources by type
            var handlerModel = G.shortNameToModel.Handler;
            if (handlerModel && self.vocModel.type === handlerModel.type)
              Events.trigger("newHandler", self);
          }
        };
        
        options.error = function(originalModel, err, opts) {
          var code = err.code || err.status;
          if (code === 409 && err.error) {
            var conflict = err.error.conflict;
            if (conflict) { // conflict is the json for the conflicting resource
              // TODO: handle this case
              debugger;
//              return;
            }
          }
          
          options.error.apply(this, arguments);
        };
      }
      
      return Backbone.Model.prototype.save.call(this, data, options);

      
//      if (options.sync) {
//        return Backbone.Model.prototype.save.call(this, attrs, options);
//      }
//      else {
//        res.set(attrs, options);
//      }
    }

//    save: function(attrs, options) {
//      options = options || {};
//      var data = U.flattenModelJson(options.data || attrs || this.attributes, this.vocModel);
//      var isNew = this.isNew();
//      if (options.$returnMade !== false)
//        data.$returnMade = 'y';
//      if (!isNew)
//        data._uri = this.getUri();
//
//      var self = this;
//      var qs = U.getQueryString(data);
//      if (options.queryString)
//        qs += '&' + options.queryString;
//      options = _.extend({url: this.saveUrl(attrs), silent: true, patch: true}, options, {data: qs});
//      
//      var success = options.success;
//      options.success = function(resource, response, opts) {
//        success && success.apply(this, arguments);
//        if (response.error)
//          return;
//        
//        Events.trigger('resourcesChanged', [self]);
//        var method = isNew ? 'add.' : 'edit.';
//        if (!G.currentUser.guest) {
//          var json = self.toJSON();
//          json._type = self.vocModel.type;
//          Events.trigger(method + self.vocModel.type, json);
//          var sup = self.vocModel;
//          while (sup = sup.superClass) {
//            Events.trigger(method + sup.type, self);
//          }
//        }
//      };
//      
////      var error = options.error;
////      options.error = function(reosurce, xhr, options) {
////        
////        error && error.apply(this, arguments);
////      }
//      
//      return Backbone.Model.prototype.save.call(this, attrs, options);
  },
  {
    type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
    shortName: "Resource",
    displayName: "Resource",
    properties: {
      davDisplayName: {range: "string"},
      davGetLastModified: {range: "long"},
      _uri: {range: "Resource"},
      _shortUri: {range: "Resource"}
    },
    displayName: 'Resource'
  });
  
  return Resource;
});
