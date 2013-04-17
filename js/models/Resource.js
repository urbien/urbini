//'use strict';
define([
  'globals',
  'utils',
  'error',
  'events',
  'cache'
], function(G, U, Error, Events, C) {
  var commonTypes = G.commonTypes;
  var APP_TYPES = _.values(_.pick(commonTypes, 'WebProperty', 'WebClass'));
  
  var willSave = function(res, meta, propName, val) {
    var prev = res.get(propName);
    var prop = meta[propName];
    var isBool = prop && prop.range === 'boolean';
    var falsyFunc = isBool ? U.isFalsy : U.isNully;
    if (falsyFunc(prev))
      return !falsyFunc(val);
    else if (prev !== val && prev.toString() !== val)
      return true;
    
    return false;
  }

  var Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(atts, options) {
      _.bindAll(this, 'get', 'getKey', 'parse', 'getUrl', 'validate', 'validateProperty', 'fetch', 'set', 'remove', 'onchange', 'onsynced', 'cancel', 'updateCounts'); // fixes loss of context for 'this' within methods
//      if (options && options._query)
//        this.urlRoot += "?" + options._query;
      
      options = options || {};
      this.on('cancel', this.remove);
      this.on('change', this.onchange);
      this.on('sync', this.onsync);
      this.setModel(null, {silent: true});
      this.subscribeToUpdates();
      this.resourceId = G.nextId();
      this.detached = options.detached; // if true, this resource will not be persisted to the database, nor will it be fetched from the server
      if (this.detached)
        this.loaded = true;
      
      if (this.isNew())
        this.setDefaults(options.query);
      
      if (atts) {
        this.parse(atts);
        // if no model based props are set, means we didn't "load" this resource yet
        if (!_.any(_.keys(atts), function(key) {return /^[a-zA-Z]/.test(key)})) {
          this.loaded = false;
        }
      }
      
      if (this.getUri() && !options.silent)
        Events.trigger('newResource', this);
      else if (this.vocModel.type === commonTypes.Jst) {
        Events.trigger('newTemplate', this);
      }
      
      if (commonTypes.App == this.type) {
        Events.on('saved', function(resource, options) {
          var types = U.getTypes(resource.vocModel);
          if (_.intersection(types, APP_TYPES).length) {
//            debugger; // maybe check if the changes concern this app, or another
            this.set({'lastModifiedWebClass': +new Date()});
          }
        }.bind(this));
      }
      
      this.unsavedChanges = this.isNew() ? this.toJSON() : {};
    },
    
    setModel: function(vocModel, options) {
      if (vocModel && vocModel === this.vocModel)
        return;
      
      vocModel = vocModel || this.constructor;
      this.constructor = this.vocModel = vocModel;
      var uri = this.getUri();
      this.type = (uri && U.getTypeUri(uri)) || vocModel.type;
      if (!options || !options.silent)
        this.trigger('modelChanged');
    },
    
    get: function(propName) {
      var val = this.attributes.hasOwnProperty(propName) ? this.attributes[propName] : undefined;
      var vocModel = this.vocModel;
      if (!vocModel)
        return val;
      
      var prop = vocModel.properties[propName];
      if (prop && !prop.backLink && U.isResourceProp(prop))
        return val && U.getLongUri1(val);
      else
        return val;
    },
    
    setDefaults: function(query) {
      var vocModel = this.vocModel,
          query = U.getQueryParams(query); // will default to current url's query if query is undefined
          defaults = U.filterInequalities(U.getQueryParams(query, vocModel));

      if (this.isA('Submission')) {
        var currentUser = G.currentUser;
        if (!currentUser.guest) {
          var submittedBy = U.getCloneOf(vocModel, "Submission.submittedBy")[0];
          if (submittedBy && !this.get(submittedBy)) {
            defaults[submittedBy] = currentUser._uri;
            U.copySubProps(currentUser, defaults, submittedBy);
          }
        }
      }
      
      if (!U.isAssignableFrom(this.vocModel, commonTypes.Jst)) { // templates.js is responsible for templates
        var codeProps = U.getPropertiesWith(this.vocModel.properties, 'code');
        for (var cp in codeProps) {
          if (this.get(cp))
            continue;
          
          var code = codeProps[cp].code;
          var defVal = U['DEFAULT_{0}_PROP_VALUE'.format(code.toUpperCase())];
          if (defVal)
            defaults[cp] = defVal;
        }
      }
    
      this.set(defaults, {silent: true})
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
      Events.on('synced:' + resUri, this.onsynced);
      Events.on('updateBacklinkCounts:' + resUri, this.updateCounts);
      this.subscribedToUpdates = true;
    },
    onsynced: function(data, newModel) {
      if (!data) {
        this.trigger('sync');
        return;
      }

      var uri = this.getUri();
      var oldUri = data._oldUri;
      if (oldUri) {
//        var oldType = U.getTypeUri(oldUri);
//        var newType = U.getTypeUri(uri);
//        if (oldType != newType) {
//          debugger;
//          // change vocModel
//        }
        
        Events.off('synced:' + oldUri, this.onsynced);
        Events.on('synced:' + uri, this.onsynced);
        Events.off('updateBacklinkCounts:' + oldUri, this.updateCounts);
        Events.on('updateBacklinkCounts:' + uri, this.updateCounts);
      }
      
      if (newModel)
        this.setModel(newModel);
      
      this.id = oldUri; // HACK for remove from collection to work correctly;
      if (oldUri && this.collection)
        this.collection.remove(oldUri);
      
      this.set(data);
      
      if (oldUri && this.collection)
        this.collection.add(this);
      
      this.id = uri;
      this.url = this.getUrl();
      this.trigger('sync');
    },
    cancel: function(options) {
      options = options || {};
      var props = this.vocModel.properties;
      var canceled = U.getCloneOf(this.vocModel, 'Cancellable.cancelled');
      if (!canceled.length)
        throw new Error("{0} can not be canceled because it does not have a 'canceled' property".format(U.getDisplayName(this)));
      
      this.set(canceled[0], true, {userEdit: true});
      var self = this;
//      this.save(props, options);
      var success = options.success;
      options.success = function(resource, response, options) {
        if (!response || !response.error)          
          this.trigger('cancel');
        
        success && success.apply(this, arguments);
      }.bind(this);

      this.save(null, options);
    },
    onchange: function(e) {
//      Events.trigger('newResource', this);
      if (this.lastFetchOrigin !== 'server')
        return;
      
      Events.trigger('updatedResources', [this]);
    },
    remove: function() {
      this.collection && this.collection.remove(this);
    },
    'delete': function() {
      Events.trigger('delete', this);
      this.remove();
    },
    getUrl: function() {
      var uri = this.getUri();
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
      return Backbone.Model.prototype.isNew.apply(this) || U.isTempUri(this.getUri()) || !this._previousAttributes._uri || U.isTempUri(this._previousAttributes._uri);
    },
    saveUrl: function(attrs) {
      var type = this.vocModel.type;
      var isNew = this.isNew();
      return G.apiUrl + (isNew ? 'm/' : 'e/') + encodeURIComponent(type);
    },
    getKey: function() {
      return U.getLongUri1(this.getUri());
    },
    getUri: function() {
      return this.get('_uri');
    },
    parse: function(resp) {
      if (!this.vocModel)
        this.setModel();
      
      resp = this.parseHelper.call(this, resp);
      if (resp) {
        var meta = this.vocModel.properties;
        var unsaved = this.getUnsavedChanges();
        // don't overwrite changes the user has made but hasn't saved yet
        if (_.size(unsaved) && this.lastFetchOrigin !== 'edit') {
          _.each(resp, function(val, key) {
            if (_.has(unsaved, key)) {
              if (/^_/.test(key))
                return;
              
              delete resp[key];
            }
          }.bind(this));
        }
      }
      
      return resp;
    },
    parseHelper: function (resp) {
      var lf;
      switch (this.lastFetchOrigin) {
        case 'db':
          if (this.loaded)
            return resp;
        case 'edit':
          break;
        default:
          lf = G.currentServerTime();
          break;          
      }
      
      if (!resp || resp.error)
        return null;

      if (!resp.data) {
        this.loaded = true;
        return resp;
      }
        
      var uri = resp._uri || resp.uri;
      if (!uri) {      
        resp = resp.data[0];
        uri = resp._uri || resp.uri;
      }

      resp._shortUri = U.getShortUri(uri, this.vocModel);
      var primaryKeys = U.getPrimaryKeys(this.vocModel);
      resp._uri = U.getLongUri1(resp._uri, {type: this.type, primaryKeys: primaryKeys});
      if (lf)
        resp._lastFetchedOn = lf;
      
      if (!this.loaded) {
        var vocModel = this.vocModel;
        var meta = vocModel.properties;
        for (var p in resp) {
          var prop = meta[p], val = resp[p];
          if (prop && val && prop.displayInline && prop.backLink && val._list) {
            Events.trigger('inlineResourceList', this, prop, val._list);
//            this.inlineLists = this.inlineLists || {};
//            this.inlineLists[prop.shortName] = val._list;
            delete val._list; // we don't want to store a huge list of json objects under one resource in indexedDB
          }
        }
      }
      
      this.loaded = true;
      return resp;
    },
    
    setInlineList: function(propName, list) {
      this.inlineLists = this.inlineLists || {};
      this.inlineLists[propName] = list;
      this.trigger('inlineList', propName);
    },
    
    clear: function() {
      this.unsavedChanges = {};
      Backbone.Model.prototype.clear.apply(this, arguments);
    },
    
    set: function(key, val, options) {
      if (!this.subscribedToUpdates && this.getUri())
        this.subscribeToUpdates();
      
      if (key == null)
        return true;
      
      // Handle both `"key", value` and `{key: value}` -style arguments.
      var props;
      if (_.isObject(key)) {
        props = key;
        options = val;
      } else {
        (props = {})[key] = val;
      }
      
      if (!_.size(props))
        return true;
      
      var vocModel = this.getModel();
      var meta = vocModel.properties;
      var self = this;
      options = options || {};
      if (!options.silent && !options.unset) {
        props = U.filterObj(props, function(name, val) {
          return willSave(self, meta, name, val);
        })
        
        if (!_.size(props))
          return true;
      }
      
      if (!options.sync) {
        var displayNameChanged = false;
        for (var shortName in props) {
          if (/\./.test(shortName))
            continue;
          
          var prop = meta[shortName];
          if (!prop)
            continue;
          
          var val = props[shortName];
          if (!val)
            continue;
          
          if (prop.displayNameElm) {
            displayNameChanged = true;
          }
          
          var sndName = shortName + '.displayName';
          if (props[sndName])
            continue;
          
          if (U.isResourceProp(prop)) {
            var res = C.getResource(val);
            if (res) {
              props[sndName] = U.getDisplayName(res);
            }
          }
        }
        
        if (this.loaded && displayNameChanged) {
          var displayNameProps = _.defaults({}, props, this.attributes);
          delete displayNameProps.davDisplayName;
          var newDisplayName = U.getDisplayName(displayNameProps, this.vocModel);
          if (newDisplayName)
            props.davDisplayName = newDisplayName;
        }
      }
      
      if (options.userEdit)
        this.lastFetchOrigin = 'edit';
        
      var result = Backbone.Model.prototype.set.call(this, props, options);
      if (result) {
        if (options.userEdit) {
          _.extend(this.unsavedChanges, props);
//          options.silent = options.silent !== false;
        }
        
        if (props._error)
          this.trigger('error' + this.getUri(), props._error);
        
        return result;
      }
    },
    
    getModel: function() {
      return this.constructor; // this.vocModel is not available till initialize is called
    },
    
    validate: function(attrs, options) {
      if (this.lastFetchOrigin !== 'edit')
        return;
      
      options = options || {};
      var errors = {};
      var props = options.validateAll ? _.extend({}, this.attributes, attrs) : attrs;
      for (var name in props) {
        var error = this.validateProperty(props, name, options);
        if (error !== true)
          errors[name] = typeof error === 'string' ? error : "Please enter a valid " + U.getPropDisplayName(props[name]);
      }
      
      if (_.size(errors))
        return errors;
    },
    
    validateProperty: function(attrs, name, options) {
      if (name.startsWith('_'))
        return true;
      
      var prop = this.vocModel.properties[name];
      if (!prop || prop.readOnly || prop.backLink || prop.virtual || prop.propertyGroupList)
        return true;
      
      var value = attrs[name];
      var isNully = U.isNully(value);
      var propName = U.getPropDisplayName(prop);
      if (isNully) {
        if (options.validateAll && prop.required && U.isPropEditable(this, prop) && !(this.isNew() && prop.avoidDisplayingOnCreate)) {
          if (!prop.writeJS && !prop.formulaJS && !prop.formula && !U.isCloneOf(prop, 'Submission.submittedBy'))
            return propName + ' is a required field';
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
        facet = facet.slice(facet.lastIndexOf('/') + 1);
        if (facet.endsWith('emailAddress'))
          return U.validateEmail(value) || 'Please enter a valid email';
        else if (facet.toLowerCase().endsWith('phone'))
          return U.validatePhone(value) || 'Please enter a valid phone number';
        else { 
          var val = U.getTypedValue(this, name, value);
          if (val == null || val !== val) { // test for NaN
            return isNully ? 'Please fill out this field' : U.invalid[facet] || 'Invalid value';
          }
        }
      }
      else {
        val = U.getTypedValue(this, name, value);
        if (val == null || val !== val) { // test for NaN
          return isNully ? 'Please fill out this field' : U.invalid[prop.range] || 'Invalid value';
        }
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
      options.url = this.getUrl();
      return Backbone.Model.prototype.fetch.call(this, options);
    },
    
    triggerPlugs: function(options) {
      if (!G.currentUser.guest && !options.fromDB) {
        var isNew = this.isNew();
        var method = isNew ? 'create:' : 'edit:';
        var json = this.toJSON();
//        json._type = this.vocModel.type;
        Events.trigger(method + this.vocModel.type, json);
//        var sup = this.vocModel;
//        while (sup = sup.superClass) {
//          Events.trigger(method + sup.type, this);
//        }
        
        // TODO: fix this hack, or move this to some place where we handle resources by type
        var plugModel = U.getModel('Handler');
        if (plugModel && this.vocModel.type === plugModel.type)
          Events.trigger("newPlug", this.toJSON());
      }
    },

    notifyContainers: function(isNew) {
      isNew = isNew || this.isNew();
      var meta = this.vocModel.properties;
      var props = this.attributes;
      for (var p in props) {
        var prop = meta[p];
        if (prop && (prop.containerMember || prop.notifyContainer)) {
          var val = props[p];
          if (!val) // might have gotten unset
            continue;
          
          Events.trigger('updateBacklinkCounts:' + U.getLongUri1(val), this, isNew);
        }
      }
    },
    
    updateCounts: function(res, isNew) {
      if (!isNew)
        return; // for now
      
      var resUri = res.getUri();
      var resJSON;
      var blVocModel = res.vocModel;
      var meta = U.getPropertiesWith(this.vocModel.properties, "backLink");
      var props = this.attributes;
      var blRanges = U.getTypes(blVocModel);
      var atts = {};
      for (var bl in meta) {
        var blProp = meta[bl];
        if (!blProp)
          continue;
        
        var range = U.getTypeUri(blProp.range);
        if (!_.contains(blRanges, range))
          continue;
        
        if (blProp.where) {
          var testFunction = U.buildValueTester(blProp.where, blVocModel);
          if (!testFunction || !testFunction(res))
            continue;
        }
        
        if (blProp.whereOr) {
          debugger;
          var where = {$or: blProp.whereOr};
          var testFunction = U.buildValueTester($.param(where), blVocModel);
          if (!testFunction || !testFunction(res))
            continue;
        }
        
        var blVal = _.clone(props[bl]) || {};
        if (_.has(blVal, 'count'))
          blVal.count++;
        else
          blVal.count = 1;
        
        if (blProp.displayInline) {
          this.inlineLists = this.inlineLists || {};
          var list;
          if (!(list = this.inlineLists[bl])) {
//            list = new ResourceList([res], {model: res.vocModel, params: U.getListParams(res, blProp)});
            if (blVal._list)
              Events.trigger('inlineResourceList', this, blProp, blVal._list);
            
            return;
          }
          
          if (!list.get(resUri)) {
            list.add(res);
            blVal._list = blVal._list || [];
            blVal._list.push(res);
          }
        }
          
        atts[bl] = blVal;
      }
      
      this.set(atts, {skipValidation: true});
    },
    
//    handleTypeBased: function(data) {
//      var isNew = this.isNew();
//      var vocModel = this.vocModel;
//      var type = vocModel.type;
//      var commonTypes = G.commonTypes;
//      switch (type) {
//        case commonTypes.WebProperty:
//          if (!isNew)
//            return true;
//          
//          switch (data.propertyType) {
//            
//          }
//        default:
//          return true;
//      }
//      
//      options = _.extend(options || {}, {skipTypeBased: true});
//      this.save(data, options);
//      return false;
//    },
    
    clearErrors: function(data) {
//      delete data._problematic;
      this.unset('_error');
    },
    
    getUnsavedChanges: function() {
      return _.clone(this.unsavedChanges);
    },
    
    save: function(attrs, options) {
      this.loaded = true;
      options = _.extend({patch: true, silent: true}, options || {});
      attrs = attrs || {};
      var isNew = this.isNew();
      if (isNew)
        data = _.extend({}, this.attributes, attrs);
      else
        data = _.extend({}, this.getUnsavedChanges(), attrs);
      
      this.clearErrors();
//      if (!options.skipTypeBased) {
//        if (!this.handleTypeBased(data, options)) // delayed execution
//          return
//      }
      
      var vocModel = this.vocModel;
      var isAppInstall = U.isAssignableFrom(vocModel, commonTypes.AppInstall);
      var isTemplate = U.isAssignableFrom(vocModel, commonTypes.Jst);
      var isApp = U.isAssignableFrom(vocModel, commonTypes.App);
      
      var saved;
      if (!options.sync) {
        saved = Backbone.Model.prototype.save.call(this, data, options);
//        G.cacheResource(this);
        if (isAppInstall)
          Events.trigger('appInstall', this);
        else if (isTemplate)
          Events.trigger('templateUpdate:' + this.get('templateName'), this);
        
        this.triggerPlugs(options);
        this.notifyContainers();
        if (isNew) {
          Events.trigger('newResource', this);
        }
        
        Events.trigger('saved', this, options);
        this.unsavedChanges = {};
      }
      else {
        data = U.prepForSync(data, vocModel, ['parameter']);
        if (_.size(data) == 0) {
          if (!isNew) {
            if (options.error)
              options.error(this, {code: 304, details: "unmodified"}, options);
            
            return; 
          }
        }
        
        data.$returnMade = options.$returnMade !== false;
        var isNew = this.isNew();
        if (!isNew)
          data._uri = this.getUri();
        else
          delete data._uri;
  
        var self = this;
        options = _.extend({url: this.saveUrl(attrs), silent: true, patch: true}, options, {data: data});
        var success = options.success, error = options.error;
        options.success = function(resource, response, opts) {
          if (response && response.error)
            return;
          
          // trigger this first because "success" may want to redirect to mkresource for some app-related model
          if (isAppInstall)
            Events.trigger('appInstall', self);
          else if (isTemplate)
            Events.trigger('templateUpdate:' + self.get('templateName'), self);
//          else if (isNew && isApp)
//            Events.trigger('newApp', self);
          
          success && success.apply(this, arguments);
//          G.cacheResource(self);
          Events.trigger('updatedResources', [self]);
          if (self.isNew()) // was a synchronous mkresource operation
            Events.trigger('newResource', self);
//          else if (isNew) { // completed sync with db
//          }
          
          
          self.triggerPlugs(options);
          if (!options.fromDB) {
            self.notifyContainers();
          }
          
          Events.trigger('saved', self, options);
          
          // if we're performing a synchronized save (for example for a money transaction), without going through the database. Otherwise we want to keep accumulating unsavedChanges
          if (!options.fromDB) 
            this.unsavedChanges = {};
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
          
          error && error.apply(this, arguments);
        };
        
        saved = Backbone.Model.prototype.save.call(this, data, options);
      }
   
      // if fromDB is true, we are syncing this resource with the server, the resource has not actually changed
      if (!options.fromDB) { 
//        G.log(Resource.TAG, 'events', U.getDisplayName(this), 'changed');
        this.trigger('change', this, options);
      }
      
      if (saved)
        this.detached = false;
      
      return saved;
      
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
//        Events.trigger('updatedResources', [self]);
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
//    type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
//    shortName: "Resource",
//    displayName: "Resource",
    properties: {
      davDisplayName: {range: "string"},
      davGetLastModified: {range: "long"},
      _uri: {range: "Resource"},
      _shortUri: {range: "Resource"}
    }
  });
  
  return Resource;
});
