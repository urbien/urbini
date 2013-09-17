//'use strict';
define('models/Resource', [
  'globals',
  'underscore',
  'utils',
  'error',
  'events',
  'cache'
], function(G, _, U, Errors, Events, C) {
  var commonTypes = G.commonTypes,
      APP_TYPES = _.values(_.pick(commonTypes, 'WebProperty', 'WebClass'));
  
  function willSave(res, meta, propName, val) {
    var prev = res.get(propName);
    var prop = meta[propName];
    var isBool = prop && prop.range === 'boolean';
    var falsyFunc = isBool ? U.isFalsy : U.isNully;
    if (falsyFunc(prev))
      return !falsyFunc(val);
    else if (prev !== val && prev.toString() !== val)
      return true;
    
    return false;
  };

  function log() {
    var args = _.toArray(arguments);
    args.unshift("Resource");
    G.log.apply(G, args);
  };
  
  function hasNonMetaProps(atts) {  // we have some real props here, not just meta props
    return atts && _.any(_.keys(atts), function(key) {
      return /^[a-zA-Z]/.test(key)
    });
  };
  
  var Resource = Backbone.Model.extend({
    idAttribute: "_uri",
    initialize: function(atts, options) {
      _.bindAll(this, 'get', 'parse', 'getUrl', 'validate', 'validateProperty', 'fetch', 'set', 'remove', 'cancel', 'updateCounts'); // fixes loss of context for 'this' within methods
//      if (options && options._query)
//        this.urlRoot += "?" + options._query;
      
      options = options || {};
      var self = this;
      
      this.setModel(null, {silent: true});
      this.subscribeToUpdates();
      this.resourceId = G.nextId();
      this.detached = options.detached; // if true, this resource will not be persisted to the database, nor will it be fetched from the server
//      if (this.detached)
//        this._load();
      
      if (this.isNew())
        this.setDefaults();
      
      if (atts) {
        this.parse(atts);
        // if no model based props are set, means we didn't "load" this resource yet
//        if (!_.any(_.keys(atts), function(key) {return /^[a-zA-Z]/.test(key)})) {
//          this.loaded = false;
//        }
      }
      
      if (this.loaded)
        this.announceNewResource(options);
      else if (this.vocModel.type === commonTypes.Jst) {
        Events.trigger('newTemplate', this);
      }
      
      if (commonTypes.App == this.type) {
        Events.on('saved', function(res) {
          var types = U.getTypes(res.vocModel);
          if (_.intersection(types, APP_TYPES).length) {
//            debugger; // maybe check if the changes concern this app, or another
            this.set({'lastModifiedWebClass': +new Date()});
          }
        }.bind(this));
      }
      
      this.on('saved', function() {
        Events.trigger.apply(Events, ['saved', this].concat(_.toArray(arguments)));
      });
      
      this._resetUnsavedChanges();
      this.on('cancel', this.remove);
      this.on('change', this.onchange);
      this.on('load', this.announceNewResource);      
      this.on('inlineResources', function(resources) {        
        Events.trigger('inlineResources', self, resources);
      });
      
      this.on('inlineBacklinks', function(backlinks) {        
        Events.trigger('inlineBacklinks', self, backLinks);
      });

//      this.checkIfLoaded();
    },
    
    _load: function(options) {
      if (!this.loaded) {
        this.loaded = true;
        this.trigger('load');
      }
    },
    
    onload: function(cb) {
      this.on('load', cb);
    },
    
    announceNewResource: function(options) {
      options = options || {};
      if (options.silent || options.partOfUpdate)
        return;
      
      Events.trigger('newResource:' + this.type, this);
      Events.trigger('newResource', this);
    },
    
    setModel: function(vocModel, options) {
      if (vocModel && vocModel === this.vocModel)
        return;
      
      vocModel = vocModel || this.constructor;
      this.constructor = this.vocModel = vocModel;
      this.properties = vocModel.properties;
      var uri = this.getUri();
      this.type = (uri && U.getTypeUri(uri)) || vocModel.type;
      if (!options || !options.silent)
        this.trigger('modelChanged');
      
//      var adapter = this.vocModel.adapter;
//      if (adapter) {
//        this.getUrl = adapter.getUrl || this.getUrl;
//        this.parse = adapter.parse || this.parse;
//      }
    },
    
    get: function(propName) {
      var val,
          vocModel = this.vocModel,
          meta = vocModel && vocModel.properties;
      
      if (/^[A-Z]{1}[a-zA-Z]*\./.test(propName)) { // is sth like ImageResource.originalImage
        var clone = U.getCloneOf(vocModel, propName);
        if (clone && clone.length)
          val = this.get(clone[0]);
        else
          val = null;
//        val = U.getClonedPropertyValue(this, propName);
      }
      else
        val = this.attributes.hasOwnProperty(propName) ? this.attributes[propName] : undefined;
        
      if (!vocModel)
        return val;
      
      var prop = vocModel.properties[propName];
      if (prop && !prop.backLink && U.isResourceProp(prop)) {
        if (val) {
          if (prop.range.endsWith('model/portal/Video'))
            return val;
          else if (prop.range.endsWith('model/portal/Image') && /^(http|https|ftp):\/\//.test(val))
            return val;
          else
            return val.startsWith('data:') ? val : U.getLongUri1(val);
        }
        else
          return val;
      }
      else
        return val;
    },
    
    setDefaults: function() {
      var vocModel = this.vocModel,
          defaults = {};
//          ,
//          query = U.getQueryParams(query), // will default to current url's query if query is undefined
//          defaults = U.filterInequalities(U.getQueryParams(query, vocModel));

      if (this.isA('Submission')) {
        var currentUser = G.currentUser;
        if (!currentUser.guest) {
          var submittedBy = U.getCloneOf(vocModel, "Submission.submittedBy")[0];
          if (submittedBy && !this.get(submittedBy)) {
            defaults[submittedBy] = currentUser._uri;
            U.copySubProps(currentUser, defaults, submittedBy);
          }
        }
        
        if (this.isNew()) {
          var dateSubmitted = U.getCloneOf(vocModel, "Submission.dateSubmitted")[0];
          if (dateSubmitted && !this.get(dateSubmitted)) {
            defaults[dateSubmitted] = +new Date();
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
    
      if (U.isA(this.vocModel, 'Intersection')) { 
        var aProp = U.getCloneOf(vocModel, "Intersection.a")[0];
        var bProp = U.getCloneOf(vocModel, "Intersection.b")[0];
        
        var resA = C.getResource(defaults[aProp]);
        var resB = C.getResource(defaults[bProp]);
        if (resA != null  &&  resB != null) {
          var mA = resA.vocModel;
          var mB = resB.vocModel;
          var rA = mA.adapter ? mA.adapter : null;
          var rB = mB.adapter ? mB.adapter : null;
          if (rA  ||  rB) {
            var m = rA ? mA : mB;
            if (U.isA(m, 'ImageResource')) {
              var res = rA ? resA : resB;
                
              var thumb = U.getCloneOf(m, "ImageResource.smallImage")[0];
              if (thumb) {
                var img = res.get(thumb);
                if (img) {
                  var p = rA ? U.getCloneOf(vocModel, "Intersection.aThumb")[0] : U.getCloneOf(vocModel, "Intersection.bThumb")[0];
                  defaults[p] = img;
                }
              }
              var featured = U.getCloneOf(m, "ImageResource.mediumImage")[0];
              if (featured) {
                var img = res.get(featured);
                if (img) {
                  var p = rA ? U.getCloneOf(vocModel, "Intersection.aFeatured")[0] : U.getCloneOf(vocModel, "Intersection.bFeatured")[0];
                  defaults[p] = img;
                }
              }
              var oW = U.getCloneOf(m, "ImageResource.originalWidth")[0];
              if (oW) {
                var img = res.get(oW);
                if (img) {
                  var p = rA ? U.getCloneOf(vocModel, "Intersection.aOriginalWidth")[0] : U.getCloneOf(vocModel, "Intersection.bOriginalWidth")[0];
                  defaults[p] = img;
                }
              }
              var oH = U.getCloneOf(m, "ImageResource.originalHeight")[0];
              if (oH) {
                var img = res.get(oH);
                if (img) {
                  var p = rA ? U.getCloneOf(vocModel, "Intersection.aOriginalHeight")[0] : U.getCloneOf(vocModel, "Intersection.bOriginalHeight")[0];
                  defaults[p] = img;
                }
              }
            }
          }
        }
      }
      
      this.set(defaults, {silent: true});
    },
    
    subscribeToUpdates: function() {
      if (this.subscribedToUpdates)
        return;
      
      var resUri = this.getUri();
      if (!resUri)
        return;
      
      Events.on('updateBacklinkCounts:' + resUri, this.updateCounts);
      this.subscribedToUpdates = true;
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
    remove: function() {
      this.collection && this.collection.remove(this);
    },
    'delete': function() {
      this.trigger('delete', this);
      this.remove();
    },
    getUrl: function() {
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.getUrl)
        return adapter.getUrl.call(this);
      
      var uri = this.getUri();
      var type = this.vocModel.type;
      var retUri = G.apiUrl + encodeURIComponent(type) + "?$blCounts=y&$minify=y&$mobile=y";
      if (uri)
//      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
        return retUri + "&_uri=" + _.encode(uri);
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
      return Backbone.Model.prototype.isNew.apply(this) || U.isTempUri(this.getUri()); // || !this._previousAttributes._uri || U.isTempUri(this._previousAttributes._uri);
    },
    saveUrl: function(attrs) {
      var type = this.vocModel.type;
      var isNew = this.isNew();
      return G.apiUrl + (isNew ? 'm/' : 'e/') + encodeURIComponent(type);
    },
    
    updateUri: function(uri, options) {
      this.set('_uri', uri, {
        silent: options.silent
      });
      
      this.checkIfLoaded();
    },
    
    getUri: function() {
      var uri = this.get('_uri');
      if (!uri && this.vocModel) {
        uri = U.buildUri(this);
        if (uri) {
          this.trigger('uriChanged', uri);
//          this.attributes['_uri'] = uri; // HACK?
//          this.checkIfLoaded();
        }
      }
      
      return uri;
    },
    parse: function(resp, options) {
      options = options || {};
      if (!this.vocModel)
        this.setModel();
      
      if (this.lastFetchOrigin === 'db' || !hasNonMetaProps(resp))
        return resp;
      
      if (!options.parse && this.lastFetchOrigin !== 'server')
        return resp;
      
      var adapter = this.vocModel.adapter;
      if (adapter && adapter.parse) {
        var parsed = adapter.parse.call(this, resp);
        if (!parsed._uri)
          parsed._uri = U.buildUri(parsed, this.vocModel);
        
        this.loadInlined(parsed);
//        this.checkIfLoaded();
        return parsed;
      }
      
      resp = this.preParse.call(this, resp);
      if (resp && !options.overwriteUserChanges) {
        var meta = this.vocModel.properties;
        var unsaved = this.getUnsavedChanges();
        // don't overwrite changes the user has made but hasn't saved yet
        if (_.size(unsaved) && this.lastFetchOrigin !== 'edit') {
          for (var key in resp) {
            if (_.has(unsaved, key)) {
              if (/^_/.test(key))
                continue;
              
              delete resp[key];
            }
          }
        }
        
        var sideEffects = resp._sideEffects;
        if (sideEffects) {
          delete resp._sideEffects;
          Events.trigger('sideEffects', this, sideEffects);
        }
      }
      
      return resp;
    },
    
    preParse: function (resp) {
      var lf = this.lastFetchOrigin != 'edit' && G.currentServerTime();
      if (!resp)
        return null;
        
      var primaryKeys = U.getPrimaryKeys(this.vocModel);
      resp._uri = U.getLongUri1(resp._uri || resp.uri, this.vocModel || { type: this.type, primaryKeys: primaryKeys });
      resp._shortUri = U.getShortUri(resp._uri, this.vocModel);
      if (lf)
        resp._lastFetchedOn = lf;
      
      if (!this.loaded)
        this.loadInlined(resp);
      
      return resp;
    },
    
    loadInlined: function(atts) {
      var meta = this.vocModel.properties,
          resources = {},
          backLinks = {};
      
      for (var p in atts) {
        var prop = meta[p],
            backLink = prop && prop.backLink,
            val = atts[p],
            uri = this.getUri(),
            list = null,
            res = null;
        
        if (prop && val) {
          list = backLink && (_.isArray(val) ? val : val._list);
          res = U.isResourceProp(prop) && typeof val == 'object' && val;
        }

        if (res) {
          delete atts[p];
//          Events.trigger('anonymousResource', this, prop, res);
          resources[p] = {
            property: prop,
            resource: res
          };
        }
        else if (list) {
//          this.inlineLists = this.inlineLists || {};
//          this.inlineLists[prop.shortName] = val._list;
          if (val._list)
            delete val._list; // we don't want to store a huge list of json objects under one resource in indexedDB
          else {
            for (var i = 0; i < list.length; i++) {
              var item = list[i];
              item[backLink] = item[backLink] || uri;
            }
            
            atts[p] = {count: val.length};
          }
          
          if (list.length) {
//            Events.trigger('newBackLink', this, prop, list);
            backLinks[p] = {
              prop: prop,
              list: list
            };
          }
        }
      }
      
      if (_.size(resources))
        this.trigger('inlineResources', resources);
      
      if (_.size(backLinks))
        this.trigger('inlineBacklinks', backLinks);
    },
    
    setInlineList: function(propName, list) {
      this.inlineLists = this.inlineLists || {};
      this.inlineLists[propName] = list;
      this.trigger('inlineList', propName);
    },

    getInlineList: function(propName) {
      return this.inlineLists ? this.inlineLists[propName] : undefined;
    },

    getInlineLists: function() {
      return _.values(this.inlineLists || {});
    },

    _resetUnsavedChanges: function() {
      this.unsavedChanges = this.isNew() ? this.toJSON() : {};
    },
    
    clear: function() {
      this._resetUnsavedChanges();
      Backbone.Model.prototype.clear.apply(this, arguments);
    },
    
    set: function(key, val, options) {
      var self = this,
          uri = this.getUri(),
          props,
          vocModel,
          meta,
          displayNameChanged,
          imageType;
      
      if (!this.subscribedToUpdates && uri)
        this.subscribeToUpdates();
      
      if (key == null)
        return true;
      
      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (_.isObject(key)) {
        props = key;
        options = val;
      } else {
        (props = {})[key] = val;
      }
      
      if (!_.size(props))
        return true;
      
      vocModel = this.getModel();
      meta = vocModel.properties;
      options = options || {};
      _.defaults(options, {
        perPropertyEvents: false
      });
      
      if (!options.silent && !options.unset) {
        props = U.filterObj(props, function(name, val) {
          return willSave(self, meta, name, val);
        })
        
        if (!_.size(props))
          return true;
      }
      
//      var uriChanged;
      
      displayNameChanged = false;
      imageType = G.commonTypes.Image;
      for (var shortName in props) {
        var val = props[shortName],
            isResourceProp;
        
        if (!val)
          continue;
        
//        if (shortName == '_uri' && val !== uri)
//          uriChanged = true;
        
        var prop = meta[shortName];
        if (!prop)
          continue;
        
        if (!prop.backLink)
          props[shortName] = U.getFlatValue(prop, val);
        
        isResourceProp = U.isResourceProp(prop);
        if (isResourceProp) {
          if (imageType.endsWith(prop.range)) {
            delete self.attributes[shortName + '.blob'];
            delete self.attributes[shortName + '.uri'];
          }
        }
        
        if (!options.sync) {
          if (/\./.test(shortName))
            continue;
          
          if (prop.displayNameElm) {
            displayNameChanged = true;
          }
          
          var sndName = shortName + '.displayName';
          if (props[sndName])
            continue;
          
          if (isResourceProp) {
            var res = C.getResource(val);
            if (res) {
              props[sndName] = U.getDisplayName(res);
            }
            
            if (U.isTempUri(val)) {
              Events.once('synced:' + val, function(data) {
                self.set(shortName, data._uri);
                if (self.getUri())
                  self.save();
              });
            }
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
      
      if (options.userEdit)
        this.lastFetchOrigin = 'edit';

//      for (var p in props) {
//        var prop = meta[p];
//        props[p] = U.getFlatValue(prop, props[p]);
//      }
      
      var result = Backbone.Model.prototype.set.call(this, props, options);
      if (result) {
//        this._resetEditableProps();
        if (options.userEdit)
          _.extend(this.unsavedChanges, props);
        
        if (props._error)
          this.trigger('error' + this.getUri(), props._error);
        
        this.checkIfLoaded();        
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
          return _.validateEmail(value) || 'Please enter a valid email';
        else if (facet.toLowerCase().endsWith('phone'))
          return _.validatePhone(value) || 'Please enter a valid phone number';
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
          return _.validateZip(value) || 'Please enter a valid Postal Code';
      }
      
      return true;
    },
    isAll: function(interfaceNames) {
      return U.isAll(this.vocModel, interfaceNames);
    },
    isOneOf: function(interfaceNames) {
//      interfaceNames = [].concat.apply([], [].slice.call(arguments));
      return U.isOneOf(this.vocModel, interfaceNames);
    },
    isA: function(interfaceName) {
      return U.isA(this.vocModel, interfaceName);
    },
    isAssignableFrom: function(interfaceName) {
      return U.isAssignableFrom(this, interfaceName);
    },
    _updateLastFetched: function() {
      this.set('_lastFetchedOn', G.currentServerTime(), {silent: true});
    },
    fetch: function(options) {
      options = options || {};
      var self = this,
          adapter = this.vocModel.adapter,
          error = options.error || Errors.getBackboneErrorHandler(),
          success = options.success || function() {};
      
//      if (adapter) {
//        auth = adapter.requiredAuthorization && adapter.requiredAuthorization() || 'simple';
//        var auth = 
//        if (auth != 'simple')
//          return this.vocModel.API.oauth(parseInt(auth.slice(5)));
//      }
      
      options.error = function(model, err, options) {
        var code = err.code || err.status;
        log('error', 'failed to fetch resource:', err);
        error.apply(this, arguments);
      };
      
      options.success = function(resp, status, xhr) {
        if (self.lastFetchOrigin != 'server')
          return update();
        
        var code = xhr.status;
        function err() {
          debugger;
          log('error', code, options.url);
          error(self, resp || {code: xhr.status}, options);            
        };
        
        function update() {
          if (self.set(self.parse(resp, options), options)) { 
            if (success) 
              success(resp, status, xhr);
            
            return true;
          }
        };

        switch (code) {
          case 200:
            self._updateLastFetched();
            if (update()) {
              self.trigger('sync', self, resp, options);
              Events.trigger('updatedResources', [self]);
            }

            break;
          case 304:
            self._updateLastFetched();
            return;
          default:
            err();
            return;
        }        
      };
      
      try {
        options.url = this.getUrl();
      } catch (err) {
        // can only sync from db
//        return options.error(this, {code: 404, details: err.message}, options);
      }
      
      return this.sync('read', this, options);
//      return Backbone.Model.prototype.fetch.call(this, options);
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
        var plugModel = C.getModel('Handler');
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
        if (U.isResourceProp(prop)) {
//        if (prop && (prop.containerMember || prop.notifyContainer)) { // let's just notify all, it's cheap
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
          try {
            var testFunction = U.buildValueTester(blProp.where, blVocModel);
          } catch (err) {
            log('error', err); // for example, the where clause might assume a logged in user
          }
          
          if (!testFunction || !testFunction(res))
            continue;
        }
        
        if (blProp.whereOr) {
          debugger;
          var where = {$or: blProp.whereOr};
          try {
            var testFunction = U.buildValueTester($.param(where), blVocModel);
          } catch (err) {
            log('error', err); // for example, the where clause might assume a logged in user
          }
          
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
    
    checkIfLoaded: function() {
      if (!this.loaded && this.getUri() && hasNonMetaProps(this.attributes))
        this._load();
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

    _save: function(data, options) {
      var self = this,
          uri = this.getUri(),
          vocModel = this.vocModel,
          isAppInstall = U.isAssignableFrom(vocModel, commonTypes.AppInstall),
          isTemplate = U.isAssignableFrom(vocModel, commonTypes.Jst),
          success = options.success,
          isNew = this.isNew();
      
      if (isAppInstall)
        Events.trigger('appInstall', this);
      else if (isTemplate)
        Events.trigger('templateUpdate:' + this.get('templateName'), this);
      
      if (isNew)
        this.checkIfLoaded();
      
//      Events.trigger('cacheResource', this);
      options.success = function() {
        success && success.apply(self, arguments);        
        self.trigger('saved', self, options);
        if (uri)
          Events.trigger('savedEdit', self, options);
        else
          Events.trigger('savedMake', self, options);
        
        self.triggerPlugs(options);
        self.notifyContainers();      
      };
      
      var result = Backbone.Model.prototype.save.call(this, data, options);
      this._resetUnsavedChanges();
      return result;
    },
    
    _sync: function(data, options) {
      var self = this,
          vocModel = this.vocModel,
          isAppInstall = U.isAssignableFrom(vocModel, commonTypes.AppInstall),
          isTemplate = U.isAssignableFrom(vocModel, commonTypes.Jst),
          isApp = U.isAssignableFrom(vocModel, commonTypes.App),
          isNew = this.isNew(),
          tempUri = isNew && this.getUri(),
          success = options.success, 
          error = options.error;

      data = this.prepForSync(data);
      if (_.size(data) == 0) {
        if (!isNew) {
          if (options.success)
            options.success(this, {code: 304, details: "unmodified"}, options);
          
          return; 
        }
      }
      
      if (!isNew)
        data._uri = this.getUri();
      else
        delete data._uri;

      options = _.extend({
        url: this.saveUrl(data), 
        silent: false, 
        patch: true, 
        resource: this
      }, options, {
        data: data
      });
      
      options.success = function(resource, response, opts) {
        if (!opts.fromDB)
          this._resetUnsavedChanges(); // if we're performing a synchronized save (for example for a money transaction), without going through the database. Otherwise we want to keep accumulating unsavedChanges

        if (isAppInstall)
          Events.trigger('appInstall', this);
        else if (isTemplate)
          Events.trigger('templateUpdate:' + this.get('templateName'), this);
        
        if (!opts.fromDB) { // was a direct sync, didn't go through _save first 
          if (isNew)
            Events.trigger('savedMake', this, opts);
          else
            Events.trigger('savedEdit', this, opts);
        }

        success && success.apply(this, arguments);
        // trigger this first because "success" may want to redirect to mkresource for some app-related model
        
        Events.trigger('updatedResources', [this]);
        if (this.isNew()) // was a synchronous mkresource operation
          this.checkIfLoaded();
        else if (isNew) { 
          // completed sync with db
        }
        
        this.triggerPlugs(options);
        if (!opts.fromDB)
          this.notifyContainers();
        
        this.trigger('syncedWithServer');
        Events.trigger('synced:' + (tempUri || this.getUri()), this);
      }.bind(this);
      
      options.error = function(originalModel, xhr, opts) {
        var code = xhr.code || xhr.status,
            errorObj = xhr.responseJson;
        
        if (code === 409) {
          var conflict = errorObj.conflict;
          if (!isNew) {
            this.lastFetchOrigin = 'server';
            this.set(this.parse(conflict, {overwriteUserChanges: true}));
            Events.trigger('messageBar', 'error', {
              message: errorObj.details || "Uh oh. Seems someone (maybe you) has made edits that trump yours. We've loaded theirs so you're good to go. Please re-edit and re-submit.",
              persist: true
            });
          }
          else {
//            Events.trigger('navigate', new this.vocModel(conflict));
            Events.trigger('cacheResource', new this.vocModel(conflict));
            Events.trigger('messageBar', 'error', {
              message: errorObj.details || "Uh oh. Seems whatever you're making <a href='{0}'>already exists</a>.".format(U.makePageUrl('view', conflict._uri)),
              persist: true
            });
          }
        }
        
        if (error)
          error.apply(this, arguments);
      }.bind(this);

      return Backbone.Model.prototype.save.call(this, data, options);
    },
    
    save: function(attrs, options) {
      options = _.defaults(options || {}, {patch: true, silent: false});
      attrs = attrs || {};
      var isNew = this.isNew(),
          data,
          saved;
      
      if (isNew)
        data = _.extend({}, this.attributes, attrs);
      else
        data = _.extend({}, this.getUnsavedChanges(), attrs);
      
      this.clearErrors();      
      if (!options.sync) {
        saved = this._save(data, options);
      }
      else {
        saved = this._sync(data, options);
      }
   
      // if fromDB is true, we are syncing this resource with the server, the resource has not actually changed
      if (!options.fromDB && !options.silent) { 
//        log('events', U.getDisplayName(this), 'changed');
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
    },
    
    unset: function(attr, options) {
      var result = Backbone.Model.prototype.unset.apply(this, arguments);
      if (options && options.remove) {
        delete this.attributes[attr];
        delete this.unsavedChanges[attr];
      }
      
      return result;
    },
    
    prepForSync: function(item) {
      var props = this.vocModel.properties;
      var filtered = U.filterObj(item, function(key, val) {
        if (key == 'interfaceClass.properties') // HACK
          return true;
        
        if (/^\$/.test(key)) // is an API param like $returnMade
          return true;
        
//        if (typeof val === 'undefined') // you sure?
//          return false;
        
        if (window.Blob && val instanceof window.Blob)
          return true;
        
        if (/\./.test(key)) // if it has a '.' in it, it's not writeable
          return false;        
        
        if (val._filePath) // placeholder for local filesystem file, meaningless to the server
          return false;
        
        var prop = props[key];
        return prop && !U.isSystemProp(key); 
      }); 
      
//      return U.flattenModelJson(filtered, vocModel, preserve);
      filtered.davGetLastModified = this.get('davGetLastModified');
      return filtered;
    },
    
    _getPropertiesForEdit: function(urlInfo) {
      var isMake = !this.getUri(),
          model = this.vocModel,
          params = urlInfo ? urlInfo.getParams() : {},
          editProps = params['$editCols'] && params['$editCols'].splitAndTrim(','),
          mkResourceCols = isMake && model['mkResourceCols'];
          
      if (!editProps) {
        propsForEdit = model.propertiesForEdit;
        if (isEdit)
          editProps = propsForEdit && propsForEdit.splitAndTrim(',');
        else {
          if (mkResourceCols)
            editProps = mkResourceCols.splitAndTrim(',');
          else if (model.type.endsWith(G.commonTypes.WebProperty))
            editProps = ['label', 'propertyType'];
          else if (model.type.endsWith('system/designer/Connection'))
            editProps = ['fromApp', 'connectionType', 'effect'];
          else if (U.isAssignableFrom(vocModel, 'Comment'))
            editProps = propsForEdit;
        }  
      }
      
      return editProps;
    },

//    _resetEditableProps: function() {
//      U.wipe(this._editableProps);
//      delete this._editablePropsUrlInfo;
//    },
    
    _isPropMutable: function(prop, editablePropsInfo) {
      var p = prop && prop.shortName,
          backlinks = editablePropsInfo.backlinks,
          appProps = editablePropsInfo.appProps;
      
      return p && prop && !prop.app && (!appProps || !appProps[p]) && !_.has(backlinks, p) && U.isPropEditable(this, prop, U.getUserRole());
    },
    
    getEditableProps: function(urlInfo) {
//      if (this._editableProps && _.size(this._editableProps))
//        return this._editableProps;
      
      var isEdit = !!this.getUri();
      
      urlInfo = urlInfo || U.getUrlInfo(U.makeMobileUrl(isEdit ? 'edit' : 'make', this.getUri(), this.attributes));
      var self = this,
          model = this.vocModel,
          meta = model.properties,
          isMake = !isEdit,
          propGroups = U.getArrayOfPropertiesWith(meta, "propertyGroupList"),
          backlinks = this.vocModel._backlinks = U.getPropertiesWith(meta, "backLink"),
          reqParams = urlInfo.getParams(),
//          currentAtts = U.filterObj(isMake ? res.attributes : res.changed, U.isModelParameter),
          editProps = reqParams['$editCols'] && reqParams['$editCols'].splitAndTrim(','),
          mkResourceCols = isMake && this.vocModel['mkResourceCols'],
          userRole = U.getUserRole(),
          collected = [],
          result = {
            appProps: U.getCurrentAppProps(meta),
            backlinks: backlinks,
            groups: propGroups,
            props: {
              grouped: [],
              ungrouped: []
            }
          },
          ungrouped = result.props.ungrouped;
      
      if (!editProps) {
        propsForEdit = model.propertiesForEdit;
        if (propsForEdit)
          propsForEdit = propsForEdit.splitAndTrim(',');
        if (isEdit)
          editProps = propsForEdit;
        else {
          if (mkResourceCols)
            editProps = mkResourceCols.splitAndTrim(',');
          else if (model.type.endsWith(G.commonTypes.WebProperty))
            editProps = ['label', 'propertyType'];
          else if (model.type.endsWith('system/designer/Connection'))
            editProps = ['fromApp', 'connectionType', 'effect'];
          else if (U.isAssignableFrom(model, 'Comment'))
            editProps = propsForEdit;
        }  
      }

      if (editProps || !propGroups.length)
        propGroups = result.groups = null;
      else {
        propGroups.sort(function(a, b) {
          return a.shortName === 'general' ? -1 : a.index - b.index;
        });
      }
      
      function alreadyHave(p) {
        return _.contains(collected, p) || (reqParams[p] && (!editProps || !_.has(editProps, p)));
      }
      
      if (propGroups) {
        for (var i = 0; i < propGroups.length; i++) {
          var grProp = propGroups[i],
              props = grProp.propertyGroupList.splitAndTrim(","), // TODO: send it as an array from the server
              grouped = result.props.grouped,
              group = {
                shortName: grProp.shortName,
                prop: grProp,
                props: []
              },
              grProps = group.props = [];
          
          for (var j = 0; j < props.length; j++) {
            var p = props[j],
                prop = meta[p];
            
            if (this._isPropMutable(prop, result)) {
              grProps.push(p);
              collected.push(p);
            }
          }
          
          if (grProps.length)
            grouped.push(group);
        }
        
        var reqd = U.getPropertiesWith(meta, [{
            name: "required", 
            value: true
          }, {
            name: "readOnly", 
            values: [undefined, false]
          }]);
        
        for (var p in reqd) {
          if (alreadyHave(p))
            continue;
          
          var prop = meta[p];
          if (this._isPropMutable(prop, result)) {
            ungrouped.push(p);
            collected.push(p);
          }
        }
      }
      
//      for (var p in reqParams) {
//        if (_.contains(collected, p))
//          continue;
//        
//        var prop = meta[p];
//        if (this._isPropMutable(prop, result)) {
//          ungrouped.push(p);
//          collected.push(p);
//        }
//      }
      
      if (!propGroups) {
        for (var p in meta) {
          if (alreadyHave(p))
            continue;
          
          var prop = meta[p];
          if (this._isPropMutable(prop, result) && (!editProps || _.contains(editProps, p))) {
            ungrouped.push(p);
            collected.push(p);            
          }
        }        
      }      
      
//      this._editablePropsUrlInfo = urlInfo;
//      this._editableProps = result;
      return result;
    },
    
    isFetching: function() {
      return !this._fetchPromise || this._fetchPromise.state() !== 'pending';
    }
//    ,
//    getMiniVersion: function() {
//      var res = this,
//          miniMe = {
//            displayName: U.getDisplayName(this),
//            _uri: this.getUri()
//          },
//          vocModel = this.vocModel,
//          meta = vocModel.properties,
//          viewCols = vocModel.viewCols || '';
//          
//      
//      if (this.isA("ImageResource")) {
//        miniMe.image = this.get('ImageResource.mediumImage') || this.get('ImageResource.bigImage')  || this.get('ImageResource.bigImage');
//      }
//      
//      _.each(viewCols.split(','), function(p) {
//        p = p.trim();
//        var prop = meta[p], 
//            val = res.get(p);
//        
//        if (prop && typeof val !== 'undefined')
//          miniMe[U.getPropDisplayName(prop)] = val;
//      });
//      
//      return miniMe;
//    }
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
  
//  function EditableProps(res) {
//  };
//
//  var props = ['groups', 'backlinks', 'props'];
//  EditableProps.prototype.refresh = function() {
//    
//  };
  
  return Resource;
});
