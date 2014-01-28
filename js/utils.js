//'use strict';
define('utils', [
  'globals',
  'underscore',
  'backbone',
  'templates',
  'cache',
  'events',
  'domUtils',
//  '@widgets',
  'lib/fastdom'
], function(G, _, Backbone, Templates, C, Events, DOM, Q) {
  var ArrayProto = Array.prototype,
      slice = ArrayProto.slice,
      concat = ArrayProto.concat,
      Blob = window.Blob,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      xhrHistory = [],
      doc = document,
      compiledTemplates = {},
      HAS_PUSH_STATE = G.support.pushState,
      RECYCLED_OBJECTS = [],
      RECYCLED_ARRAYS = [],
      FRAGMENT_SEPARATOR = HAS_PUSH_STATE ? '/' : '#',
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      $w;

  window._setInterval(function() { // TODO: make this less stupid
    for (var templateName in compiledTemplates) {
      _.wipe(compiledTemplates[templateName]);
    }
  }, 120000);
  
  function log() {
    var args = slice.call(arguments);
    args.unshift('Utils');
    G.log.apply(G, args);
  };

  function isFileUpload(prop, val) {
    return prop.range && /model\/portal\/(Image|Video)/.test(prop.range) && typeof val === 'object';
  }
  
  
//  Array.prototype.remove = function() {
//    var what, a = arguments, L = a.length, ax;
//    while (L && this.length) {
//      what = a[--L];
//      while ((ax = this.indexOf(what)) !== -1) {
//        this.splice(ax, 1);
//      }
//    }
//    
//    return this;
//  };
//
//  Array.prototype.last = Array.prototype.peek = function() {
//    return this.length ? this[this.length - 1] : null;
//  };
  function simplifyPosition(position) {
    var coords = position.coords;
    return {
      latitude: coords.latitude, 
      longitude: coords.longitude,
      timestamp: position.timestamp
    };
  };
  
  var U = {
    /**
     * if the modules are in pre-defined bundles, wait till they're loaded, otherwise request the modules directly (in bulk)
     */
    require: function(modules, callback) {
      var dfd = $.Deferred(),
          promise = dfd.promise(),
          args = arguments;
      
      G.onModulesLoaded(modules).done(function() {
        U.pipePromise(require.apply(require, args), dfd);
      });
      
      return promise;
    },    
    
    getImage: function(url, format) {
//      var dfd = $.Deferred(),
//          promise = dfd.promise(),
//          worker;
//      
//      promise.always(function() {
//        if (worker)
//          G.recycleXhrWorker(worker);
//      });
//
//      G.getXhrWorker().done(function(_worker) {
//        worker = _worker;
//        worker.onmessage = function(e) {
//          dfd.resolve(e.data);
//        };
//        
//        worker.onerror = dfd.reject.bind(dfd);
//        worker.postMessage({
//          command: 'getImage',
//          config: {
//            url: url,
//            format: format
//          }
//        });
//      });
//      
//      return promise;

      return $.Deferred(function(defer) {        
        if (!/^http:/.test(url))
          url = G.serverName + (/^\//.test(url) ? '' : '/') + url; 
      
        G.sendXhr({
          url: url,
          responseType: 'blob',
          success: defer.resolve.bind(defer),
          error: defer.reject.bind(defer)
        });
          
//        var req = new XMLHttpRequest();
//        req.overrideMimeType('text/plain; charset=x-user-defined')
//        req.open('GET', url, false);
//        req.responseType = format == 'dataUrl' ? 'arraybuffer' : 'blob';
//        req.send(null);
//        var data = req.mozResponseArrayBuffer || req.response;
//        if (format == 'dataUrl')
//          data = data && arrayBufferDataUri(data);
//        
//        postMessage(data);
      }).promise();
    },
    
//    ajax: function(options) {
//      var dfd = $.Deferred(), 
//          promise = dfd.promise();
//      
//      G.whenNotRendering(function() {
//        G.animationQueue.queueTask(function() {
//          U._ajax(options).then(dfd.resolve, dfd.reject);            
//        });
//      });
//      
//      return promise;
//    },
    /**
     * success handler is passed (resp, status, xhr)
     * error handler is passed (xhr, errObj, options), where errObj.code is the HTTP status code, and options is the original 'options' parameter passed to the ajax function
     */
    ajax: function(options) {
      var hasWebWorkers = G.hasWebWorkers,
          opts = _.clone(options),
          useWorker = hasWebWorkers && options.async !== false, // && !opts.sync,
          worker;
          
      opts.crossDomain = true;
      opts.type = opts.method || opts.type;
      opts.dataType = opts.dataType || 'JSON';
      opts.headers = opts.headers || {};
      opts.headers['X-Referer'] = G.appUrl;
      return new $.Deferred(function(defer) {
        // recycling the worker needs to be the first order of business when this promise if resolved/rejected 
        defer.always(function() {
          if (worker)
            G.recycleXhrWorker(worker);
        });

        var data = opts.data;
        var blobProps = U.getBlobValueProps(data);
        if (data && Blob && _.size(blobProps)) {
          if (useWorker) {
            var attachmentsUrlProp = U.getCloneOf(resource.vocModel, "FileSystem.attachmentsUrl")[0];
            if (!attachmentsUrlProp) {
              debugger;
              Events.trigger('error', {
                resource: resource,
                error: "{0} don't support an attachments".format(getPlural(resource.vocModel.displayName))
              });
              
              return;
            }
            
            fd.append('location', G.serverName + '/wf/' + resource.get(attachmentsUrlProp));
            fd.append('type', resource.vocModel.type);
          }
          else
            opts.data = U.toFormData(data, opts);
        }

        // start repeat url check - see if we're calling a url we already called before
        var _url = opts.url + (_.size(opts.data) ? '?' + $.param(opts.data) : '');
        if (_.contains(xhrHistory, _url))
          console.log('ajax', 'calling this url again!', _url);
        else
          xhrHistory.push(_url);
        
        // end repeat url check
        
        if (opts.success) defer.done(opts.success);
        if (opts.error) defer.fail(opts.error);
        
        if (opts.url == null || opts.url.slice(opts.url.length - 'null'.length) == 'null')
            debugger;

        if (useWorker) {
          log('xhr', 'webworker', opts.url);
          G.getXhrWorker().done(function() {
            worker = arguments[0];
            worker.onmessage = function(event) {
              var xhr = event.data,
                  resp = xhr.data,
                  code = xhr.status,
                  headers = xhr.responseHeaders,
                  error;
              
//              Events.trigger('garbage', resp);
              if (headers.length) {
                var h = headers.splitAndTrim(/\n/);
                headers = {};
                _.each(h, function(pair) {
                  if (pair) {
                    var cIdx = pair.indexOf(':');
                    headers[pair.slice(0, cIdx)] = pair.slice(cIdx + 1);
                  }
                });
              }
              else
                headers = {};
              
              xhr.getResponseHeader = function(name) {
                return headers[name];
              };
              
//              if (code === 304) {
//  //              debugger;
//                defer.reject(xhr, "unmodified", "unmodified");
//              }
              
              if (code > 399 && code < 600) {
                error = resp;
                if (error)
                  error.code = _.isUndefined(error.code) ? code : error.code;
                else
                  error = {code: code};
              }
              
              if (error) {
                xhr.responseJson = error;
                defer.reject(xhr, error, opts);
              }
              else
                defer.resolve(resp, code, xhr);
            };
            
            worker.onerror = function(err) {
              defer.reject({}, err, opts);
            };
            
            var msgOpts = _.pick(opts, ['type', 'url', 'data', 'dataType', 'headers']);
            worker.postMessage({
              command: 'xhr',
              config: msgOpts
            }); //TODO: when we figure out transferrable objects, add parameter: [msgOpts]
          });
        }
        else {
          log('xhr', '$.ajax', opts.url);
          $.ajax(_.pick(opts, ['timeout', 'type', 'url', 'headers', 'data', 'dataType', 'processData', 'contentType'])).then(function(data, status, jqXHR) {
            var error;
            if (jqXHR.status > 399) {
              debugger;
              defer.reject(
                jqXHR, 
                (jqXHR.responseJson = U.getJSON(data) || {code: jqXHR.status}), 
                opts
              );
            }
            else if (jqXHR.status < 400)
              defer.resolve(data, status, jqXHR);
          }, 
          function(jqXHR, textStatus, err) {
//            debugger;
            defer.reject(
              jqXHR, 
              (jqXHR.responseJson = U.getJSON(jqXHR.responseText) || {code: jqXHR.status, details: err}), 
              opts
            );
          });
        }
      }).promise();
    },
    
    getJSON: function(strOrJson) {
      if (typeof strOrJson == 'string') {
        try {
          strOrJson = JSON.parse(strOrJson);
        } catch (err) {
          return;
        }
      }
      
      return strOrJson;
    },
    
    isPropVisible: function(res, prop, userRole) {
      var visible;
      if (_.has(prop, '_visible')) 
        visible = prop._visible;
      else {
        // cache it
        visible = prop._visible = !(prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.virtual || prop.parameter || prop.propertyGroupList || U.isSystemProp(prop));
      }
      
      if (!visible)
        return;
      
      userRole = userRole || U.getUserRole();
      if (userRole == 'admin')
        return true;
      
      var ar = prop.allowRoles;
      return ar ? U.isUserInRole(userRole, ar, res) : true;
    },

    isAnAppClass: function(type) {
      return type.indexOf("/voc/dev/" + G.currentApp.appPath) != -1;
    },
    
    getTypes: function(vocModel) {
      vocModel = U.isCollection(vocModel) || U.isModel(vocModel) ? vocModel.vocModel : vocModel;
      return _.union(vocModel.type, vocModel.superClasses || []);
    },
    
    getUserRole: function() {
      return G.currentUser.role;
    },
    
    isUserInRole: function(userRole, ar, res) {
      if (userRole == 'guest')
        return false;
      if (userRole == 'admin')
        return true;
      var vocModel = res && res.constructor;
      var me = G.currentUser._uri;
      var resUri;
      if (res) {
        if (U.isCollection(res))
          resUri = null; //res.models[0].getUri();
        else  
          resUri = res.getUri();
      }
      
      var iAmRes = me === resUri;
      var roles = typeof ar === 'array' ? ar : ar.split(",");
      for (var i = 0; i < roles.length; i++) {
        var r = roles[i].trim();
        if (_.contains(['siteOwner'], r)  &&  userRole == r) 
          return true;
        else if (r === 'owner') {
          continue; // TODO: implement this
        }
        else {
          if (r === 'self') { 
            if (iAmRes) return true;
          }
          else if (res && r.endsWith('self')){
            r = r.split('==');
            var pName = r[0].trim();
            var selfUser = res.get(pName);
            if (me == selfUser) 
              return true;
            var prop = vocModel.properties[pName];
            if (prop && U.isCloneOf(prop, 'Submission.submittedBy'))
              return true;
          }
          
          // TODO: implement this          
        }
      }
      
      return false;
    },
    
    getModelType: function(hash) {
      hash = hash || U.getHash();
      if (!hash.length)
        return null;
      
      hash = hash.split('?')[0];
//      if (!hash)
//        log('error', 'match undefined 0');
      
      if (hash.startsWith('templates'))
        return G.commonTypes.Jst;
      else if (hash.startsWith('home'))
        return null;
      
      var route = U.getRoute(hash),
          type;
      
      hash = decodeURIComponent(hash);
      if (route) {
        var sqlIdx = hash.indexOf(G.sqlUri);
        if (sqlIdx == -1)
          type = hash.slice(route.length + 1);
        else
          type = 'http://' + hash.slice(sqlIdx + G.sqlUri.length + 1);
        
        var qIdx = type.indexOf('?');
        if (qIdx != -1)
          type = type.slice(0, qIdx);
      }
      else
        type = hash;

      if (type === 'profile')
        return G.currentUser.guest ? G.commonTypes.Urbien : U.getTypeUri(G.currentUser._uri);
            
      return U.getTypeUri(type);
    },
    
    /**
     * Given a subproperty and a superproperty, get the combined annotations
     */
    extendAnnotations: function(subProp, superProp, superModel) {
      superProp = U.filterObj(superProp, function(name, val) {return !val.notinheritable});
      for (var annotation in subProp) {        
        var oldAnn = superProp[annotation];        
        var newAnn = subProp[annotation];
        if (_.isUndefined(oldAnn))
          superProp[annotation] = newAnn;
        else {
          if (['cloneOf', 'subPropertyOf'].indexOf(annotation) != -1)
            superProp[annotation] = oldAnn + ',' + newAnn;
          else
            superProp[annotation] = newAnn;
        }
      }
      
      if (superProp.primary && !subProp.primary)
        delete superProp.primary;
      
      return superProp;
    },
    
//    /**
//     * @param prop
//     * @param iProp sth like "Submission.submittedBy"
//     */
//    isCloneOf: function(prop, iPropName) {//, vocModel) {
//      var cloneOf = prop.cloneOf;
//      return _.contains(cloneOf.split(','), iPropName);
//      var subPropertyOf = prop.subPropertyOf;
//      if (cloneOf) {
//        cloneOf = cloneOf.split(',');
//        for (var i = 0; i < cloneOf.length; i++) {
//          if (cloneOf[i] === iPropName)
//            return true;
//        }
//      }
//      else if (subPropertyOf && vocModel) // This only works if we have all superclass props on subclass
//        return U.isCloneOf(vocModel[U.getLongUri1(subPropertyOf)], slice.call(arguments, 1));
//      
//      return false;
//    },
    
    isCurrentUserGuest: function() {
      return G.currentUser.guest;
    },

    getCurrentUserUri: function() {
      return G.currentUser._uri;
    },

    getCurrentUrlInfo: function() {
      return G.currentHashInfo;
    },

    isCreatable: function(type, userRole) {
      if (G.currentUser.guest)
        return false;
      
      if (type.startsWith(G.defaultVocPath + 'system/designer/'))
        return true;
      
      userRole = userRole || U.getUserRole();
      var urbienModel = U.getModel(G.commonTypes.Urbien);
      var backlinks = U.getPropertiesWith(urbienModel.properties, [{name: "backLink"}, {name: 'range', values: [type, type.slice(type.indexOf('/voc/') + 5)]}]);
      if (!_.size(backlinks))
        return false;
      
      for (var blName in backlinks) {
        var blProp = backlinks[blName];
        if (!U.isPropEditable(U.mimicResource(G.currentUser), blProp, userRole))
          return false;
      }
      
      return true;
    },
    
    mimicResource: function(json) {
      return {
        get: function(prop) {
          return json[prop];
        },
        getUri: function() {
          return json._uri;
        }
      }
    },
    
    isPropEditable: function(res, prop, userRole) {
      if (prop.avoidDisplaying || prop.avoidDisplayingInControlPanel || prop.readOnly || prop.virtual || prop.propertyGroupList || prop.autoincrement || prop.formula || U.isSystemProp(prop))
        return false;
      
      var isEdit = !!res.get('_uri');
      
      if (prop.avoidDisplayingInEdit  &&  isEdit || (res.get(prop.shortName) && prop.immutable))
        return false;
      if (prop.avoidDisplayingOnCreate  &&  !isEdit)
        return false;

      userRole = userRole || U.getUserRole();
      if (userRole == 'admin' || userRole == 'siteOwner')
        return true;
      
      var allowedToRole = !_.any(['allowRoles', 'allowRolesToEdit'], function(p) {        
        var roles = prop[p];
        if (roles && !U.isUserInRole(userRole, roles, res))
          return true;
      });
      
      if (!allowedToRole)
        return false;
      
      if (isEdit && prop.primary)
        return false;

      return true;
    },   
    
    isResourceProp: function(prop) {
      return prop && !prop.backLink && prop.range && prop.range.indexOf('/') != -1 && !U.isInlined(prop);
    },
//    getSortProps: function(model) {
//      var meta = this.model.__proto__.constructor.properties;
//      meta = meta || this.model.properties;
//      if (!meta)
//        return null;
//      
//      var list = _.toArray(meta);
//      return U.getPropertiesWith(list, "sortAscending");
//    },
//
    getFirstUppercaseCharIdx: function(str) {
    	for (var i = 0; i < str.length; i++) {
    		var c = str.charAt(i);
    		if (c.search(/^[a-z]+$/i) == 0 && c == c.toUpperCase())
    			return i;
    	}
    	
    	return -1;
    },
    
    getPrimaryKeys: function(model) {
      var keys = {};
      for (var p in model.properties) {
        var prop = model.properties[p];
        if (_.has(prop, 'primary'))
          keys[prop.pkIndex] = p;
      }
      
      return _.values(keys);
    },

    getPropCloneOf: function(prop) {
      var clones = prop.cloneOf;
      return clones && _.map(prop.cloneOf.split(','), function(c) { return c.trim() });
    },
    
    getCloneOf: function(model) {
      var cloneOf = concat.apply(ArrayProto, slice.call(arguments, 1)),
          results = {},
          meta = model.properties;
      
      for (var i = 0; i < cloneOf.length; i++) {
        var iProp = cloneOf[i];
        var vals = model[iProp];
        if (!vals) {
          vals = [];
          for (var j=0; j<2; j++) {
            for (var p in meta) {
              var prop = meta[p];
              if (!_.has(prop, "cloneOf")) 
                continue;
               
              var clones = U.getPropCloneOf(prop);
              for (var k=0; k<clones.length; k++) {
                if (clones[k] == iProp) { 
                  vals.push(p);
                  break;
                }
              }
            }
            
            if (vals.length)
              break;
          }
        }
        
        if (vals.length)
          results[iProp] = model[iProp] = vals; // cache it on the model
      }
      
      var size = _.size(results);
      return size === 1 ? results[_.getFirstProperty(results)] : size === 0 ? [] : results;
    },
    
    isCloneOf: function(prop, iPropName, vocModel) {
      if (typeof prop === 'string')
        prop = vocModel.properties[prop];
      
      return _.any(U.getPropCloneOf(prop), _['=='].bind(_, iPropName));
    },
    
//    getLongUri1: function(uri, vocModel) {
//      console.log("getLongUri1 in: " + uri);
//      var out = U._getLongUri1(uri, vocModel);
//      console.log("getLongUri1 in: " + out);
//      return out;
//    },
    
    getLongUri1: function(uri, vocModel) {
      if (!uri) {
        log('error', 'null passed to getLongUri1');
        return uri;
      }

      var patterns = U.uriPatternMap;
      for (var i = 0, len = patterns.length; i < len; i++) {
        var pattern = patterns[i],
            regex = pattern.regex,
            onMatch = pattern.onMatch,
            match = uri.match(regex);
        
        if (match && match.length)
          return onMatch(uri, match, vocModel);
      }
      
      if (uri == '_me') {
        if (G.currentUser.guest)
          throw new Error("user is not logged in");
        else
          return G.currentUser._uri;
      }
      
      log('info', 'couldnt derive long uri for ' + uri);
      return uri;
//      throw new Error("couldn't parse uri: " + uri);
    },

    getTypeUri: function(typeName, hint) {
      if (typeName.indexOf('/') != -1) {
        
        var type;
        if (typeName.startsWith('http://'))
          type = typeName;
        else {
          if (("http://" + typeName).startsWith(G.DEV_PACKAGE_PATH))
            type = "http://" + typeName;
          else
            type = G.defaultVocPath + typeName;
        }
        var sqlIdx = type.indexOf(G.sqlUri);
        if (sqlIdx != -1)
          type = 'http://' + type.slice(sqlIdx + G.sqlUri.length + 1);
        
        var qIdx = type.indexOf('?');
        return qIdx == -1 ? type : type.slice(0, qIdx);
      }
      else {
        if (typeName == 'Class')
          return 'http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Class';
        var vocModel = U.getModel(typeName);
        return (hint && hint.type) || (vocModel && vocModel.type);
      }
    },
    
    getClassName: function(uri) {
      if (uri.startsWith(G.apiUrl))
        uri = decodeURIComponent(uri.slice(G.apiUrl.length));
      var qIdx = uri.indexOf("?");
      if (qIdx != -1) {
        if (uri.indexOf('http://') == 0)
          return uri.slice(uri.lastIndexOf("/", qIdx) + 1, qIdx);
        else
          return uri.slice(0, qIdx);
      }
      var slashIdx = uri.lastIndexOf("/");
      if (slashIdx != -1)
        return uri.slice(slashIdx + 1);
      var idx = U.getFirstUppercaseCharIdx(uri);
      if (idx == -1)
        return null;
        
      var end = uri.slice(idx).search(/[^a-zA-Z]/);
      return end == -1 ? uri.slice(idx) : uri.slice(idx, idx + end);
    },
    
//    getClassName: function(type) {
//      var sIdx = type.lastIndexOf("/");
//      return sIdx == -1 ? type : type.slice(sIdx + 1);
//    },
    
    getShortUri: function(uri, model) {
      if (!uri || model.properties._shortUri == 'unsupported')
        return uri;
        
      var regex = /www\.hudsonfog\.com\/[a-zA-Z\/]*\/([a-zA-Z]*)\?id=([0-9]*)/;
//      if (!uri) {
//        log('error', 'match undefined 3');
//        console.trace();
//      }

      var nameAndId = uri.match(regex);
      return nameAndId && nameAndId.length == 3 ? nameAndId[1] + '/' + nameAndId[2] : uri;
    },
   
    isAll: function(model, interfaceNames) {
      return U.isA(model, interfaceNames, "AND");
    },
    
    isOneOf: function(model, interfaceNames) {
      return U.isA(model, interfaceNames, "OR");
    },
    
    isA: function(model, interfaceNames, op) {
      if (!model)
        return false;
      
      var OR = op === 'OR';
      interfaceNames = typeof interfaceNames === 'string' ? [interfaceNames] : interfaceNames;
      var intersection = _.intersection(_.map(model.interfaces, U.getClassName), interfaceNames);
      if (OR && intersection.length || !OR && intersection.length === interfaceNames.length)
        return true;
      else
        return false;
      
//      var leftOver = _.difference(interfaceNames, intersection);      
//      var superCl = model._super;
//      if (!superCl || superCl.endsWith('#Resource'))
//        return false;
//      
//      var m = U.getModel(superCl);
//      return m ? U.isA(m, leftOver) : impl;
    },
    
    $or: function() {
      if (arguments.length == 1)
        return U.getQueryString(arguments[0], '||');
      
      return _.map(slice.call(arguments), function(arg) {
        return U.$or(arg);
      }).join('||');
    },
    
    $and: function() {
      if (arguments.length == 1)
        return $.param(arguments[0]);
      
      return _.map(slice.call(arguments), function(arg) {
        return U.$and(arg);
      }).join('&');      
    },
    
    getSocialNetFontIcon: function(net) {
      var icon;
      if (net == 'Google')
        icon = 'google-plus';
      else
        icon = net.toLowerCase();
      
      return icon + '-sign';
    },
    
    countdown: function(seconds) {
      var minutes = parseInt(seconds / 60),
          dfd = $.Deferred(),
          promise = dfd.promise();
      
      seconds = seconds % 60;
      var interval = setInterval(function() {
        if (seconds == 0) {
          if (minutes == 0) {
//            element.innerHTML = "0 seconds";
            clearInterval(interval);
            dfd.resolve();
            return;
          } else {
            minutes--;
            seconds = 60;
          }
        }
        
//        if (minutes > 0) {
//          var minute_text = minutes + (minutes > 1 ? ' minutes' : ' minute');
//        } else {
//          var minute_text = '';
//        }
//        
//        var second_text = seconds > 1 ? 'seconds' : 'second';
//        element.innerHTML = minute_text + ' ' + seconds + ' ' + second_text;
        seconds--;
        dfd.notify(seconds);
      }, 1000);
      
      
      promise.cancel = function() {
        debugger;
        clearInterval(interval);
        dfd.reject();
//        el.innerHTML = '';
      };
      
      return promise;
    },

    _socialSignupHome: G.serverName + '/social/socialsignup', ///m/' + G.currentApp.appPath,
    buildSocialNetOAuthUrl: function(options) {
      options = options || {};
      var net = options.net, 
          action = options.action, 
          returnUri = options.returnUri,
          returnUriHash = options.returnUriHash,
          params = {
            actionType: action,
//            returnUri: returnUri,
//            returnUriHash: returnUriHash,
            socialNet: net.socialNet,
            appPath: G.currentApp.appPath
          },
          state;

      if (returnUriHash)
        params.returnUriHash = returnUriHash;
      else if (returnUri) {
        returnUri = !returnUriHash && (returnUri || window.location.href);
        params.returnUri = returnUri;
      }
      
      state = U.getQueryString(params, {sort: true}); // sorted alphabetically
      if (action === 'Disconnect') {
        return U._socialSignupHome + '?' + state;
      };
      
      var params;
      if (net.oAuthVersion == 1) {
        params.episode = 1;
      }
      else {
        params = {
          scope: net.settings,
          display: 'touch', // 'page', 
          state: state, 
          redirect_uri: U._socialSignupHome, 
          response_type: 'code', 
          client_id: net.appId || net.appKey
        };
      }
      
      return net.authEndpointMobile + '?' + U.getQueryString(params, {sort: true}); // sorted alphabetically
    },
    
    getPackagePath: function(type) {
//      if (type == 'Resource' || type.endsWith('#Resource'))
//        return 'packages';
      
      var start = "http://www.";
      var path = type.startsWith(start) ? type.slice(start.length, type.lastIndexOf("/")) : !type.startsWith('hudsonfog') ? 'hudsonfog/voc/' + type : type;
      path = path.replace(".com", "");
      path = path.replace(/\//g, '.');
      var lastDIdx = path.lastIndexOf('.');
      var c = path.charAt(lastDIdx + 1);
      if (c == c.toUpperCase())
        path = path.slice(0, lastDIdx);
        
      return 'packages.' + path;
    },
    
    addPackage: function(packages, path) {
      path = path.split(/\./);
      var current = packages;
      path = path[0] == 'packages' ? path.slice(1) : path;
      for (var i = 0; i < path.length; i++) {
        if (!_.has(current, path[i])) {
          var pkg = {};
          current[path[i]] = pkg;
          current = pkg;
        }
        else
          current = current[path[i]];
      }
      
      return current;
    },
    
    getObjectType: function(o) {
      return Object.prototype.toString.call(o);
    },
    
    getColorCoding: function(cc, val) {
    //  getting the color for value. Sample colorCoding annotation: @colorCoding("0-2000 #FF0054; 2000-6000 #c8fd6a; 6001-1000000 #00cc64")
      var v;
      if (typeof val === 'string') {
        val = val.replace(',', '');
        v = parseFloat(val);
      }
      else
        v = val;
      
      cc = cc.split(';');
      for (var i = 0; i < cc.length; i++) {
        var r2c = cc[i].trim();
        r2c = r2c.split(/[ ]/);
        var r = r2c[0].split(/[-]/);
        r[1] = parseFloat(r[1]);
        if (v > r[1])
          continue;
        
        if (v > parseFloat(r[0]))
          return r2c[1];
      }
      
      return null;
    },
    
    getPropsRanged: function(vocModel, range) {
      var meta = vocModel.properties,
          props = [];
      
      for (var p in meta) {
        var prop = meta[p];
        if (prop.range && range.endsWith(prop.range))
          props.push(p);
      }
      
      return props;
    },
    
    splitRequestFirstHalf: '$gridCols,$images,$displayNameElm,$alwaysReturnToClient',  // change these together
    setSplitRequest: function(vocModel) {        // change these together
      var meta = vocModel.properties,
          gridCols = U.getGridColsMeta(vocModel),
          imageProps = U.getPropsRanged(vocModel, G.commonTypes.Image), //U.getClonedProps(vocModel, 'ImageResource'),
          displayNameProps = U.getDisplayNameProps(vocModel),
          firstHalf,
          secondHalf;
              
      firstHalf = _.union(gridCols, imageProps, _.keys(U.systemProps), displayNameProps);
      if (!firstHalf.length) {
        vocModel.splitRequest = false;
        return;
      }

      if (U.isA(vocModel, 'ImageResource')) {
        secondHalf = _.filter(_.difference(_.keys(meta), firstHalf), function(p) {
          var prop = meta[p];
          if (prop && prop.cloneOf && prop.cloneOf.match(/,?ImageResource\.[a-zA-Z]+,?/))
            return false;
          
          return true;
        });
      }
      
      vocModel.splitRequest = secondHalf && secondHalf.length > 3;
    },

    getViewColsMeta: function(vocModel) {
      return this.getColsMeta(vocModel, 'view');
    },
    
    getGridColsMeta: function(vocModel) {
      return this.getColsMeta(vocModel, 'grid');
    },

    getColsMeta: function(vocModel, colsType) {
      colsType = colsType || 'grid';
      var colsProp = colsType + 'Cols';
      var cols = vocModel[colsProp];
      if (_.isArray(cols))
        return cols;
      
      cols = cols && cols.split(',');
      return vocModel[colsProp] = _.uniq(_.map(cols, function(c) {return c.trim()}));
    },
    
    getCols: function(res, colsType, isListView) {
      var vocModel = res.vocModel;
      var cols = this.getColsMeta(vocModel, colsType);
      return U.makeCols(res, cols, isListView);
    },
    
    makeCols: function(res, cols, isListView) {
      if (!cols)
        return null;
      
      var vocModel = res.vocModel;
      var resourceLink;
      var rows = {};
      var total = 0;
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i].trim();
        if (col == '')
        var prop = vocModel.properties[col];
        if (!prop)
          return;
        
        var val = res.get(col);
        if (!val) {
          var pGr = prop.propertyGroupList;
          if (pGr) {
            var s = U.getPropDisplayName(prop);
            var nameVal = {name: s, value: pGr};
            rows[s] = {value : pGr};  
            rows[s].propertyName = col;  
            rows[s].idx = total++;
          }
          
          continue;
        }
        
        var nameVal = U.makeProp(res, prop, val);
        var nvn = nameVal.name;
        rows[nvn] = {value: nameVal.value};
        rows[nvn].idx = total++;
        rows[nvn].propertyName = col;
        if (prop.resourceLink)
          rows[nvn].resourceLink = true;
  //        resourceLink = nameVal.value;
  //      else
      }
      
      return total == 0 ? null : rows;
    },

    
    isMasonry: function(vocModel) {
      var meta = vocModel.properties;
      var isMasonry = U.isA(vocModel, 'ImageResource')  &&  _.size(U.getCloneOf(vocModel, 'ImageResource.mediumImage', 'ImageResource.bigMediumImage', 'ImageResource.bigImage'));
      if (!isMasonry  &&  U.isAll(vocModel, 'Reference', 'ImageResource'))
        return true;
      if (!U.isA(vocModel, 'Intersection')) 
        return isMasonry;
      var href = window.location.href;
      var qidx = href.indexOf('?');
      var a = U.getCloneOf(vocModel, 'Intersection.a')[0];
      if (qidx == -1) {
        isMasonry = _.size(U.getCloneOf(vocModel, 'Intersection.aThumb', 'Intersection.aFeatured'));
      }
      else {
        var b = U.getCloneOf(vocModel, 'Intersection.b')[0];
        var p = href.substring(qidx + 1).split('=')[0];
        var delegateTo = (p == a) ? b : a;
        isMasonry = _.size(U.getCloneOf(vocModel, 'Intersection.bThumb', 'Intersection.bFeatured'));
      }
      
      return isMasonry;
    },
    
    getContainerProperty: function(vocModel) {
      var params = window.location.hash.split('?');
      if (params.length == 1)
        return null;
      
      params = params[1].split('&');
      var meta = vocModel.properties;
      for (var i=0; i<params.length; i++) {
        var s = params[i].split('=')[0];
        p = meta[s];
        if (!p)
          p = meta[s];
        if (p  &&  (p.containerMember || p.notifyContainer))
          return p.shortName;
      }
      
      return null;
    },
    
    /**
     * to be used for model constructors, not instances
     */
    
    defaultModelProps: ['__super__', 'prototype', 'extend'],
    toJSON: function(obj) {
      var staticProps = {};
      for (var prop in obj) {
        if (typeof obj[prop] != 'function' && _.has(obj, prop) && !_.contains(U.defaultModelProps, prop)) {
          var o = obj[prop];
          staticProps[prop] = typeof o == 'object' ? U.toJSON(o) : o;
        }
      }
      
      return staticProps;
    },
    
    replaceParam: function(url, name, value, sort) {
      if (!url)
        return name + '=' + _.encode(value);
      
      if (_.isObject(name)) {
        var newUrl = url,
            params = name,
            sort = value;
        
        for (var p in params) {
          if (_.has(params, p)) {
            newUrl = U.replaceParam(newUrl, p, params[p], value);
          }
        }
        
        return newUrl;
      }
        
      url = url.split('?');
      var qs = url.length > 1 ? url[1] : url[0];
      var q = U.getQueryParams(qs);
      if (value)
        q[name] = value;
      else
        delete q[name];
      
      if (!_.size(q))
        return url[0];
      
      q = sort ? U.getQueryString(q, {sort: sort}) : $.param(q);
      return url.length == 1 ? q : [url[0], q].join('?');
    },
   
    /**
     * @return if getQueryParams(url), return map of query params, 
     *         if getQueryParams(url, model), return map of query params that are model properties
     *         if getQueryParams(params, model), return filtered map of query params that are model properties
     *         if getQueryParams(collection), return map of query params from collection.params that correspond to collection's model's properties
     */
    getQueryParams: function() {
      var args = arguments, model, collection, params, url;
      model = collection = params = url = args.length && args[0];
      if (!url || typeof url === 'string') {
        params = _.getParamMap(url || window.location.href);
        return args.length > 1 ? U.getQueryParams.apply(U, [params].concat(slice.call(args, 1))) : params;
      }

      if (U.isCollection(model)) { // if it's a collection
        params = collection.params;
        model = collection.model;
      }
      else if (model instanceof Backbone.Model) {
        return {};
      }
      else {
        if (args.length > 1)
          model = typeof args[1] === 'function' ? args[1] : args[1].constructor;
        else {
          return U.filterObj(params, function(name, val) {
//            if (!name)
//              log('error', 'match undefined 4');

            return name.match(/^[a-zA-Z]+/);
          });
//          throw new Error('missing parameter "model"');
        }
      }
      
      var filtered = {};
      var meta = model.properties;
      var whereParams = U.whereParams;
      for (var p in params) {
        var pStart = p;
        if (/\./.test(p))
          pStart = p.slice(0, p.indexOf('.')); // might be a composite prop like tagUses.(http://www.hudsonfog.com/voc/model/aha/OnlineResource)taggable.ahasCount=>0
        
        if (meta[pStart] || whereParams[pStart]) {
//        if (meta[p] || whereParams[p])
          filtered[p] = params[p];
        }
      }
  
      return filtered;
    },
    
    filterInequalities: function(params, vocModel) {
      if (!_.size(params))
        return params;
      
      var query = $.param(params);
      var parsed = U.parseAPIQuery(query, '&');
      var filtered = {};
      _.each(parsed, function(clause) {
        if (clause.op === '==')
          filtered[clause.name] = clause.value;
      });
      
      return filtered;
    },
    
    getHashParams: function(hash) {
      hash = hash || U.getHash();
//      if (!hash) {
//        var h = window.location.href;
//        var hashIdx = h.indexOf('#');
//        if (hashIdx === -1) 
//          return {};
//          
//        hash = h.slice(hashIdx + 1);
//      }
      
      var chopIdx = hash.indexOf('?');
      if (chopIdx == -1)
        return {};
        
      return hash ? _.getParamMap(hash.slice(chopIdx + 1)) : {};
    },
    
//    getPropertiesWith: function(list, annotation) {
//      return _.filter(list, function(item) {
//        return item[annotation] ? item : null;
//      });
//    },
    
    getArrayOfPropertiesWith: function(props, annotations) {
      return U.getPropertiesWith(props, {name: annotations}, true);
    },
    
   getCurrentAppProps: function(meta) {
      var app = U.getArrayOfPropertiesWith(meta, "app"); // last param specifies to return array
      if (!app  ||  !app.length) 
        return null;
//    var appGroups;
      var currentAppProps;
      for (var j=0; j<app.length; j++) {
        var appNames = app[j].app;
        var s = appNames.split(',');
        for (var i=0; i<s.length; i++) {
  //        var a;
  //        if (!appGroups) 
  //          appGroups = {};
  //        a = appGroups[s[i]];
  //        if (!a)
  //          appGroups[s[i]] = [];
  //        a = appGroups[s[i]];
  //        a.push(app[j].shortName);
          if (s[i] == G.appName) {
            if (!currentAppProps)
              currentAppProps = [];
            currentAppProps.push(app[j].shortName);      
          }
        }
      }
      return currentAppProps;
    },
    getPropertiesWith: function(props, annotations, returnArray) {
      var type = U.getObjectType(annotations);
      switch (type) {
        case '[object String]':
          annotations = [{name: annotations}];
          break;
        case '[object Object]':
          annotations = [annotations];
          break;
      }
        
      var filtered = U.filterObj(props, function(name, val) {
        for (var i = 0; i < annotations.length; i++) {
          var a = annotations[i];
          var annotationVal = props[name][a.name];
          var values = typeof a.value === 'undefined' ? a.values : [a.value];
          if (typeof values === 'undefined') {
            if (typeof annotationVal === 'undefined') 
              return false;
          }
          else if (values.indexOf(annotationVal) === -1) 
            return false;
        }
        
        return true;
      });
      
      return returnArray ? _.toArray(filtered) : filtered;
    },
    
    getBacklinks: function(meta, returnArray) {
      return U.getPropertiesWith(meta, "backLink", returnArray);
    },
    
    areQueriesEqual: function(q1, q2) {
      var p1 = _.getParamMap(q1);
      var p2 = _.getParamMap(q2);
      return _.isEqual(p1, p2);
    },
    
    getDisplayNameProps: function(vocModel) {
      var meta = vocModel.properties;
      var keys = [];
      for (var p in meta) {
        if (_.has(meta[p], "displayNameElm")) 
          keys.push(p);
      }
      
      return keys;
    },
    
    /**
     * @params (resource or resource.attributes, [model or model.properties])
     */
    getDisplayName: function(resource, vocModel) {
      if (resource instanceof Backbone.Model && !resource.isLoaded())
        return resource.vocModel.displayName;
            
      var dn = U.getValue(resource, 'davDisplayName');
      if (dn) {
        if (dn == 'null')
          dn = '* Not Specified *';

        return dn;
      }
      var meta;
      if (typeof vocModel === 'function') {
        meta = vocModel.properties;
      }
      else {
        meta = vocModel;
        vocModel = resource.vocModel || null;
        meta = meta || vocModel && vocModel.properties;
      }
        
      var dnProps = U.getDisplayNameProps(vocModel);
      var dn = '';
      if (!dnProps  ||  dnProps.length == 0) {
        var uri = U.getValue(resource, '_uri');
        if (!uri)
          return vocModel.displayName;
        var s = uri.split('?');
        s = decodeURIComponent(s[1]).split('&');
        for (var i=0; i<s.length; i++) {
          if (i)
            dn += ' ';
          dn += s[i].split('=')[1]; 
        }
        return dn;
      }
      var first = true;
      for (var i=0; i<dnProps.length; i++) {
        var shortName = dnProps[i],
            prop = meta[shortName],
            value = U.getValue(resource, shortName);
        
        if (value  &&  typeof value != 'undefined') {
          if (first)
            first = false;
          else
            dn += ' ';
          
          if (U.isResourceProp(prop)) {
            // get displayName somehow, maybe we need to move cached resources to G, instead of Router
            if (resource) {
              var rdn = U.getValue(resource, shortName + '.displayName');
              if (rdn)
                dn += rdn;
            }
          }
          else {
            dn += value.displayName ? value.displayName : value;
          }
        }
      }
      
      return (dn || vocModel.displayName).trim();
    },

    getTemplate: function() {
      return Templates.get.apply(Templates, arguments);
    },
    
    getTypeTemplate: function(id, resource) {
      var t = G.template;
      if (!t) 
        return null;
      
      var vocModel = resource.vocModel;
      var dataType = vocModel.shortName; 
      
      var appTemplates = Templates.get(G.appName);
      if (!appTemplates) {
        var elts = $('script[type="text/template"]', $(t));
        appTemplates = {};
        for (var i = 0; i < elts.length; i++) 
          appTemplates[$(elts[i]).attr('data-type') + '-' + elts[i].id] = elts[i].innerHTML;

        Templates.templates[G.appName] = appTemplates;
      } 
      
      var key = dataType + '-' + id;
      var tmpl = appTemplates[key];
      return (tmpl) ? U.template(_.template(tmpl)) : null;
    },
    /// String prototype extensions
    
    getQueryString: function(paramMap, options) {
      options = options || {};
      if (!options.sort) {
        var result = $.param(paramMap);
        return options.delimiter ? result.replace(/\&/g, options.delimiter) : result;
      }
      
      var keys = [];
      for (var p in paramMap) {
        if (typeof paramMap[p] !== 'undefined') {
          keys.push(p);
        }
      }
      
      var qs = '';
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        keys[i] = keys[i] + '=' + _.encode(paramMap[keys[i]]);
      }
      
      return keys.join(options.delimiter || '&');
    },

    getFormattedDuration: function(time) {
      if (time <= 0)
        return "none";
      
      var now = G.currentServerTime();
      var date = U.getFormattedDate(now + time * 1000).toLowerCase();
      if (date === 'just now')
        return 'none';
      else if (date.startsWith("in "))
        return date.slice(3);
      else if (date.endsWith(" ago"))
        return date.slice(0, date.length - 4);
      else if (date === 'tomorrow')
        return '1 day';
      else
        throw new Error("couldn't parse time");
      
//      if (time < 86400) {
//        return time < 0 && "none" || 
//          time < 60 && (time + " seconds") ||
//          time < 120 && "A minute or so" ||
//          time < 3600 && Math.floor( time / 60 ) + " minutes" ||
//          time < 7200 && "an hour" ||
//          Math.floor( time / 3600 ) + " hours";
//      }
//      
//      var days = Math.floor(time / 86400);
//      if (days == 1)
//        return "1 day";
//      else if (days < 7)
//        return days + " days";
//      else if (days < 365) {
//        var w = Math.round(days / 7);
//        return (w == 1) ? "a week" : w + " weeks";
//      }
//      else {
//        var years = Math.round( day_diff / 365 );
//        var rest = (day_diff % 365);
//        var date = '';
//        if (years == 1)
//          date += 'a year';
//        else
//          date += years + " years";
//        return (rest == 0) ? date : date + ' and ' + U.getFormattedDate(now - (rest * 86400 * 1000));  
//      }
    },

    getFormattedDate1: function(time) {
      var d = new Date(time);

      var date = d.getDate();
      date = date < 10 ? "0"+date : date;

      var mon = d.getMonth()+1;
      mon = mon < 10 ? "0"+mon : mon;

      var year = d.getFullYear()

      return (mon + "/" + date + "/" + year);
    },
    getFormattedDate: function(time, pieceOfDate) {
//      var date = new Date(parseFloat(time));
      //(time || "").replace(/-/g,"/").replace(/[TZ]/g," "));
      var now = G.currentServerTime();
      var diff = ((now - parseFloat(time)) / 1000);
      var day_diff = diff / 86400;
      day_diff = day_diff >= 0 ? Math.floor(day_diff) : Math.ceil(day_diff);
          
      if (isNaN(day_diff))
        return null;
          
      var future = diff < 0;
      var absDiff = Math.abs(diff);
      var absDayDiff = Math.abs(day_diff);
      var pre = future ? "In " : "";
      var post = future ? "" : " ago";
      
      if (day_diff == 0) {
        var str = (absDiff < 60 && "just now" ||
                absDiff < 120 && "a minute" ||
                absDiff < 3600 && Math.floor( absDiff / 60 ) + " minutes" ||
                absDiff < 7200 && "an hour" ||
                absDiff < 86400 && Math.floor( absDiff / 3600 ) + " hours");
        
        if (absDiff >= 60)
          str = pre + str + post;
        return str;
      }
      else if (absDayDiff == 1)
        return future ? "Tomorrow" : "Yesterday";
      else {
        var str;
        if (absDayDiff < 7) 
          str = (absDayDiff == 1) ? "a day" : absDayDiff + " days"; 
        else if (absDayDiff < 30) {
          var w = Math.round( absDayDiff / 7 );
          str = (w == 1) ? "a week" : w + " weeks";
        }
        else if (absDayDiff < 365) {
          var m = Math.round( absDayDiff / 30 );
          str = (m == 1) ? "a month" : m + " months";
        }
        else {
          var years = Math.round( absDayDiff / 365 );
          var rest = (day_diff % 365);
          var date = '';
          if (years == 1)
            date += 'a year';
          else
            date += years + " years";
          
          str = (rest == 0  ||  pieceOfDate) ? date : date + ' and ' + U.getFormattedDate(now - (rest * 86400 * 1000), true);
        }
        
//        var ret = '';
//        if (str.indexOf('In') == -1)
//          ret += pre;
//        ret += str;
//        if (str.indexOf(' ago') == -1)
//          ret += post;
        
        pre = future && !str.startsWith(pre) && !pieceOfDate ? pre : '';
        post = future || str.endsWith(post) || pieceOfDate ? '' : post;
        return  pre + str + post;
      }
      
//      var years;
//      return day_diff == 0 && (
//        diff < 60 && "just now" ||
//        diff < 120 && "a minute ago" ||
//        diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
//        diff < 7200 && "an hour ago" ||
//        diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
//        day_diff == 1 && "Yesterday" ||
//        day_diff < 7 && day_diff + " days ago" ||
//        day_diff < 365 && Math.round( day_diff / 7 ) + " weeks ago" || 
//        day_diff > 365 && (years = Math.round( day_diff / 365 )) + " years and " + U.getFormattedDate(now + (day_diff % 365));  
    },
    
    getShortName: function(uri) {
      return uri.slice(uri.lastIndexOf('/') + 1); // if lastIndexOf is -1, return original string
    },
    
    addToFrag: function(frag, html) {
      var els = DOM.parseHTML(html),
          l = els.length;
      
      for (var i = 0; i < l; i++) {
        frag.appendChild(els[i]);
      }
    },
    
    getUris: function(data) {
      return _.map(data instanceof Backbone.Collection ? data.models : [data], function(m) {return m.getUri()});
    },
    
    isCollection: function(res) {
      return res instanceof Backbone.Collection;
    },

    isModel: function(res) {
      return res instanceof Backbone.Model;
    },

    getInlineResourceModel: function(type) {
      return C.getInlineResourceModel(type) || C.getInlineResourceModel(U.getTypeUri(type));      
    },

    getEnumModel: function(type) {
      return C.getEnumModel(type) || C.getEnumModel(U.getTypeUri(type));      
    },

    getResource: function(uri) {
      return C.getResource(uri);
    },

    getResourceList: function(model, query) {
      return C.getResourceList(model, query);
    },

    getModel: function(type) {
      var arg0 = arguments[0];
      var argType = Object.prototype.toString.call(arg0);
      switch (argType) {
      case '[object String]':
        var model = C.getModel(arg0);
        if (model != null)
          return model;
        
        if (arg0.indexOf('/') != -1) {
          var longUri = U.getLongUri1(arg0);
          if (longUri !== arg0)
            return C.getModel(longUri);
        }
        
        return null;
  //          throw new Error("invalid argument, please provide a model shortName, type uri, or an instance of Resource or ResourceList");            
      case '[object Object]':
        return arg0.vocModel; //U.isCollection(arg0) ? arg0.model : arg0.constructor;
      default:
        throw new Error("invalid argument, please provide a model shortName, type uri, or an instance of Resource or ResourceList");
      }
    },
    
    getModelImageProperty: function(vocModel) {
      var meta = vocModel.properties;
      var cloneOf;
      var aCloneOf;
      var bCloneOf;
      var hasImgs;
//      var isIntersection = !hasImgs  &&  this.isA(vocModel, 'Intersection'); 
      var isIntersection = this.isA(vocModel, 'Intersection'); 
      var isResourceView = window.location.hash  &&  (window.location.hash.indexOf('#view/') == 0  ||  window.location.hash.indexOf('#edit/') == 0);
      if (isIntersection) {
        if (isResourceView) {
          aCloneOf = U.getCloneOf(vocModel, 'Intersection.aFeatured')[0]  ||  U.getCloneOf(vocModel, 'Intersection.aThumb')[0];
          bCloneOf = U.getCloneOf(vocModel, 'Intersection.bFeatured')[0]  ||  U.getCloneOf(vocModel, 'Intersection.bThumb')[0];
        }
        else {
          aCloneOf = U.getCloneOf(vocModel, 'Intersection.aThumb')[0]  ||  U.getCloneOf(vocModel, 'Intersection.aFeatured')[0];
          bCloneOf = U.getCloneOf(vocModel, 'Intersection.bThumb')[0]  ||  U.getCloneOf(vocModel, 'Intersection.bFeatured')[0];
        }
        if (aCloneOf)
          return aCloneOf;
        if (bCloneOf)
          return bCloneOf;
      }
      
      if (U.isA(vocModel, 'ImageResource')) {
        var isMasonry = !isResourceView  &&  U.isMasonry(vocModel)  &&  U.isMasonryModel(vocModel);
        var cloneOfTmp = isMasonry ? U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0]  ||  U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0] 
                                   : (isResourceView  ?  U.getCloneOf(vocModel, 'ImageResource.bigMediumImage')[0] || U.getCloneOf(vocModel, 'ImageResource.bigImage')[0] : U.getCloneOf(vocModel, 'ImageResource.smallImage')[0] || U.getCloneOf(vocModel, 'ImageResource.mediumImage')[0]);
        if (cloneOfTmp) {
          if (isMasonry) {
            var viewport = G.viewport;
            var ww = viewport.width - 40;
            if (ww < viewport.height) {
              if (ww <= 340) 
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium320')[0];
              else  if (ww <= 380) 
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium360')[0];
              else if (ww <= 420)  //  &&  ww <= 400) {
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium400')[0];
            }
            else {
              if (ww > 460  &&  ww <= 630)
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.masonry533_h')[0];
              else if (ww > 630  &&  ww <= 660)
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.masonry680_h')[0];
            }
          }
          else if (isResourceView) {
            var ww = $(window).width();
            if (ww < $(window).height()) {
              if (ww <= 340) 
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium320')[0];
              else  if (ww <= 380) 
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium360')[0];
              else if (ww <= 420)  //  &&  ww <= 400) {
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.bigMedium400')[0];
            }
            else {
              if (ww > 460  &&  ww <= 630)
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.masonry533_h')[0];
              else if (ww > 630  &&  ww <= 660)
                cloneOf = U.getCloneOf(vocModel, 'ImageResource.masonry680_h')[0];
            }
            
          }
          if (!cloneOf)
            cloneOf = cloneOfTmp;          
        }
        if (cloneOf)
          return cloneOf;
      }
      
      if (U.isA(vocModel, 'Reference'))
        return U.getCloneOf(vocModel, 'Reference.resourceImage')[0];
    },
    
    getImageProperty: function(resOrCol) {
      var isCol = U.isCollection(resOrCol),
          isModel = U.isModel(resOrCol),
          vocModel = isModel || isCol ? U.getModel(resOrCol) : resOrCol;
          
      return this.getModelImageProperty(vocModel);
//          modelImageProp = this.getModelImageProperty(vocModel),
//          models; 
//          
//      if (modelImageProp) {
//        var models = isCol ? resOrCol.models : isModel ? [resOrCol] : null;
//        if (models && models.length) {
//          cloneOf = cloneOf && cloneOf[0];
//          var isIntersection = U.isA(vocModel, 'Intersection');
//          for (var i = 0; !hasImgs  &&  i < models.length; i++) {
//            if (models[i].get(cloneOf))
//              return cloneOf;
//          }
//        }
//      }
//      
//      return modelImageProp;
    },
    
    getPropDisplayName: function(prop) {
      return prop.displayName || (prop.displayName = prop.label || prop.shortName.uncamelize(true));
    },
    
    getValueDisplayName: function(res, propName) {
      var prop = res.vocModel.properties[propName];
      return prop && ((U.isResourceProp(prop) || prop.multiValue) ? res.get(propName + '.displayName') : res.get(propName));
    },
    
    makeOrGroup: function() {
      return slice.call(arguments).join('||');
    },
    
    /**
     * @param className: class name or uri
     */
    isAssignableFrom: function(model, className) {
      if (!model)
        return false;
      
      if (/\//.test(className))
        className = U.getTypeUri(className);
      
      model = U.isModel(model) || U.isCollection(model) ? model.vocModel : model;
      if (model.type == className ||  model.shortName == className || U.isA(model, className))
        return true;
      
      var supers = model.superClasses;
      return _.any(supers, function(s) {return s == className || s.endsWith("/" + className)});
      
//      var m = model;
//      while (true) {
//        var subClassOf = m.subClassOf;
//        if (!subClassOf.startsWith(G.DEFAULT_VOC_BASE))
//          subClassOf = G.DEFAULT_VOC_BASE + subClassOf;
//        
//        if (m.shortName == className  ||  m.type == className)
//          return true;
//        if (m.subClassOf == 'Resource')
//          return false;
//        
//        m = U.getModel(subClassOf);
//      }
    },

    getValue: function(modelOrJson, prop) {
      if (U.isModel(modelOrJson))
        return modelOrJson.get(prop);
      else
        return modelOrJson[prop];
    },

    colorLuminance: function(hex, lum) {
      // validate hex string
      hex = String(hex).replace(/[^0-9a-f]/gi, '');
      if (hex.length < 6) {
        hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      }
      lum = lum || 0;

      // convert to decimal and change luminosity
      var rgb = "#", c, i;
      for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i*2,2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00"+c).substr(c.length);
      }

      return rgb;
    },   
    colorLuminanceRGB: function(rgb, lum) {
      // validate hex string
      var idx1 = rgb.indexOf('(');
      var idx2 = rgb.indexOf(')');
      var rgbA = rgb.substring(idx1 + 1, idx2).split(',');
      if (!rgbA)
        return null;
      lum = lum || 0;

      // convert to decimal and change luminosity
      var rgba = "#", c, i;
      for (i = 0; i < 3; i++) {
        c = parseInt(rgbA[i].trim());
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgba += ("00"+c).substr(c.length);
      }

      return rgba;
    },   
    makeProp: function(res, prop, value) {
//      var res = info.resource;
      var vocModel = res.vocModel;
      var propName = prop.shortName; //info.propName;
      var val = value || U.getValue(res, propName);
      val = typeof val !== 'undefined' ? U.getTypedValue(res, propName, val) : val;
      var isDisplayName = prop.displayNameElm;
      
      var cc = prop.colorCoding;
      if (!prop.code) {
        if (cc) {
          cc = U.getColorCoding(cc, val);
          if (cc) {
            if (cc.startsWith("icons"))
              val = "<img src='" + cc + "' border='0'>&#160;" + val;
            else
              val = "<span style='color:" + cc + "'>" + val + "</span>";
          }
        }
        else if (val && prop.range == 'string') {
          var href = window.location.hash;
          var isView = href.startsWith("#view/");

          if (isDisplayName)
            val = "<span>" + val + "</span>";
//            val = "<span style='font-size: 18px;font-weight:normal;'>" + val + "</span>";
          else if (!isView  &&  prop.maxSize > 1000) {
            var color = G.theme.descColor; 
            /*
            if (!color) {
              color = $('[data-role="page"]').css('color');
              if (color) {
                if (color.indexOf('rgb') == -1)
                  color = U.colorLuminance(color, 0.7);
                else
                  color = U.colorLuminanceRGB(color, 0.7);
              }
              else  
                color = U.colorLuminance('#000', 0.7);
              G.theme.descColor = color;
            } 
            */ 
//            var dColor = G.theme.descriptionColor;
            if (color) {
              if (color.charAt(0) != '#')
                color = '#' + color;
              val = '<div class="u-desc" style="color: ' + color + ';">' + val + '</div>';
            }
            else
              val = '<div class="u-desc">' + val + '</div>';
          }
          else if (prop.facet  &&  prop.facet == 'href')
            val = "<a href='" + val + "'>" + U.getDisplayName(res, vocModel) + "</a>";
          else if (prop.facet  &&  prop.facet == 'tags') {
            var s = val.split(',');
            val = '';
            for (var i=0; i < s.length; i++) {
              var t = s[i].trim();
              if (i)
                val += '<br/>';
              
              var params = {};
              params ['tagUses.tag.tag'] = t;
              params ['tagUses.tag.application'] = vocModel.type;
              var uri = U.makeMobileUrl('list', vocModel.type, params);
              
              val += "<a href='" + G.serverName + '/' + G.pageRoot + '#' + uri + "'>" + t + "</a>";
            }
          }
          else if (prop.facet != 'emailAddress')
            val = "<span>" + val + "</span>";
        }
        else if (prop.range == 'enum') {
          val = "<span>" + val + "</span>";
        }  
      }
      
      val = val || res.get(propName) || '';        
      if (prop.code) {
        val = '<textarea id="{0}" data-code="{1}" name="code" readonly="readonly" onfocus="this.blur()">{2}</textarea>'.format(G.nextId() + propName, prop.code, prop.code === 'html' ? _.htmlEscape(val) : val);
//        val = '<div id="{0}_numbers" style="float: left; width: 2em; margin-right: .5em; text-align: right; font-family: monospace; color: #CCC;"></div>'.format(propName) 
//            + '<pre>{0}</pre>'.format(prop.code === 'html' ? _.htmlEscape(val) : val);
      }
      
      var displayName = res.get(propName + '.displayName');
      if (displayName) {
        val = (prop.multiValue) ? {value: displayName} : {value: val, displayName: displayName};
      }
      else
        val = {value: val, prop: prop, model: this.vocModel};
      
      var propTemplate = Templates.getPropTemplate(prop);
//      if (propTemplate == 'stringPT'  &&  prop.maxSize  &&  prop.maxSize > 1000)
//        propTemplate = 'longStringPT';
      var rules = {};
      if (prop.code)
        rules['data-code'] = prop.code;
      
      rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      return {name: U.getPropDisplayName(prop), value: U.template(propTemplate)(val), shortName: prop.shortName, rules: rules};
    },
    
    makePageUrl: function() {
      return G.pageRoot + FRAGMENT_SEPARATOR + U.makeMobileUrl.apply(this, arguments);
    },
    
    getAppPathFromTitle: function(title) {
      return title ? title.replace(/-/g, '_').replace(/[^a-z_1-9eA-Z]/g, '') : null;
    },
    
    /**
     * @return given the value of the app's App._appPath property, sth like AppName
     */
    getAppPath: function(type) {
      var parts = type.split('/');
      return parts[parts.length - 2];
    },

    /**
     * @return the value of the app's App._name property, sth like urbien/voc/dev/AppName 
     */
    getAppName: function(type) {
      return 'urbien/voc/dev' + type.slice(type.lastIndexOf('/'));
    },

    makeMobileUrl: function(action, typeOrUri, params) {
      if (arguments.length == 1) {
        typeOrUri = action;
        action = 'list';
      }
      
      action = action || 'list';
      if (U.isModel(action))
        return U.makeMobileUrl('view', action.getUri());
        
      if (U.isModel(typeOrUri))
        typeOrUri = typeOrUri.getUri();
      else if (U.isCollection(typeOrUri)) {
        var col = typeOrUri;
        typeOrUri = col.vocModel.type;
        params = _.extend({}, col.params, params);
      }
        
      var url = '';
//      switch (action) {
//        case 'list':
//          break;
//        default: 
//          url += action + '/';
//          break;
//      }
      
//      var encOptions = {delimiter: '&amp;'};
      url = action + '/' + (HAS_PUSH_STATE ? typeOrUri : encodeURIComponent(typeOrUri));
      if (_.size(params))
        url += '?' + U.getQueryString(params); //, encOptions);
      
      return url;
    },
    
    makeEditProp: function(res, prop, val, formId) {
      var p = prop.shortName;
      val = typeof val === 'undefined' ? res.get(p) : val;
      
      var propTemplate = Templates.getPropTemplate(prop, true, val),
          isEnum = propTemplate === 'enumPET',      
          isImage = prop.range.endsWith('model/portal/Image'),
          isVideo = prop.range.endsWith('model/portal/Video'),
          isAudio = prop.range.endsWith('model/portal/Audio');
      
      if (typeof val === 'undefined')
        val = {};
      else {
        var dn = val.displayName || res.get(p + '.displayName');
        var value = val.value || val;
        val = {
          value: U.getTypedValue(res, p, value)
        }
          
        if (dn)
          val.displayName = dn;
      }
      
      val.isImage = isImage;
      val.isAudio = isAudio;
      val.isVideo = isVideo;
      
      if (isEnum) {
        var facet = prop.facet;
        var eCl = U.getEnumModel(U.getLongUri1(facet));
        if (!eCl)
          throw new Error("Enum {0} has not yet been loaded".format(facet));
        
        var valLength = _.pluck(eCl.values, "displayName").join('').length;
//        propTemplate = 'scrollEnumPET';
        propTemplate = 'longEnumPET';
//        propTemplate = valLength < 25 ? 'shortEnumPET' : 'longEnumPET';
        val.options = eCl.values;
      }
      
      val.value = val.value || '';
      if (prop.range == 'resource') 
        val.uri = val.value;
      else if (isImage) {
        var isDataUrl = val.value.startsWith('data:');
        if (isDataUrl) {
          val.img = val.value;
          val.displayName = val.displayName || 'camera shot';
        }
        else if (U.isCloneOf(prop, 'ImageResource.originalImage')) {
          var cOf = U.getCloneOf(res.vocModel, "ImageResource.smallImage");
          if (!cOf  ||  cOf.length == 0) {
            cOf = U.getCloneOf(res.vocModel, "ImageResource.mediumImage");
            if (!cOf  ||  cOf.length == 0)
              cOf = U.getCloneOf(res.vocModel, "ImageResource.bigImage");
          }
          if (cOf && cOf.length == 1) 
            val.img = res.get(cOf[0]);
        }
        
        if (!val.img)
          val.img = val.value;
        U.clipImage(res, val, {width: 50, height: 50});        
        if (!val.displayName) {
          var ix = val.value.lastIndexOf('/');
          val.displayName = val.value.substring(ix + 1);
        }
      }
      
      if (!prop.skipLabelInEdit)
        val.name = U.getPropDisplayName(prop);
      
      val.shortName = prop.shortName;
      val.id = (formId || G.nextId()) + '.' + prop.shortName;
      val.prop = prop;
//      val.comment = prop.comment;
      var facet = prop.facet;
      if (facet) {
        if (facet.endsWith('emailAddress'))
          val.type = 'email';
        else if (facet.toLowerCase().endsWith('phone'))
          val.type = 'tel';
      }
//      if (prop.comment)
//        val.comment = prop.comment;
      
//      var classes = [];
      if (prop.multiValue)
        val.multiValue = true;
      var rules = prop.multiValue  &&  !val.value ? {} : {"data-formEl": true};
      if (prop.required)
        rules.required = 'required';
      if (prop.maxSize)      
        rules.maxlength = prop.maxSize;
      if (prop.code)
        rules['data-code'] = prop.code;
      
      if (U.isDateProp(prop)) {
        rules['data-date'] = true;
//        if (val.value)
//          val.val /= 1000; // seconds
      }
      else if (U.isTimeProp(prop)) {
        rules['data-duration'] = true;
//        if (val.value)
//          val.value /= 1000; // seconds
      }
      else if (U.isEnumProp(prop))
        rules['data-enum'] = true;
            
//      val.classes = classes.join(' ');
      val.rules = U.reduceObj(rules, function(memo, name, val) {return memo + ' {0}="{1}"'.format(name, val)}, '');
      if (prop.comment)
        val.comment = prop.comment;
      
      var propInfo = {
        value: U.template(propTemplate)(val),
        prop: prop
      };
      
      if (prop.comment)
        propInfo.comment = prop.comment;
      return propInfo;
    },
    
    clipImage: function(res, val, dimensions) {
      var vocModel = res.vocModel;
      var oW = U.getCloneOf(vocModel, 'ImageResource.originalWidth');
      var oH;
      if (oW)
        oH = U.getCloneOf(vocModel, 'ImageResource.originalHeight');
      
      var rOh = res.get(oH);
      var rOw = res.get(oW);
      if (oW  &&  oH  &&  rOw  &&  rOh) {
        var dw = 80, dh = 80;
        if (dimensions)
          dw = dimensions.width, dh = dimensions.height;
        var dim = U.fitToFrame(dw, dh, rOw / rOh);
        val.width = dim.w;
        val.height = dim.h;
        val.top = oW > oH ? dim.y : dim.y + (rOh - rOw) / 2;
        val.right = dim.w - dim.x;
        val.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (rOh - rOw) / 2;
        val.left = dim.x;
      }
    },
    
    reduceObj: function(obj, func, memo, context) {
      var initial = arguments.length > 2;
      _.each(_.keys(obj), function(name, index, list) {
        if (!initial) {
          memo = func(name, obj[name]);
          initial = true;
        } else {
          memo = func.call(context, memo, name, obj[name], index, list);
        }
      });
      
      return memo;
    },
    
    getPageUrl: function(mobileUrl) {
      return G.pageRoot + '#' + mobileUrl;
    },
    
//    /**
//     * build view/list/etc. hash for model, defaults to homePage if model is null
//     */
//    buildHash: function(model) {
//      return model instanceof Backbone.Model ? 'view/' + _.encode(model.getUri()) : model instanceof Backbone.Collection ? model.model.shortName : G.homePage;
//    },
//    
//    apiParamMap: {'-asc': '$asc', '$order': '$orderBy', '-limit': '$limit', 'recNmb': '$offset'},
//    paramsToSkip: ['hideFltr'],
//    getMobileUrl: function(url) {
//      var orgParams = U.getQueryParams(url);
//      if (url.startsWith('v.html'))
//        return 'view/' + _.encode(U.getLongUri1(orgParams.uri));
//      
//      // sample: l.html?-asc=-1&-limit=1000&%24order=regular&-layer=regular&-file=/l.html&-map=y&type=http://www.hudsonfog.com/voc/commerce/urbien/GasStation&-%24action=searchLocal&.regular=&.regular=%3e2000
//      var type = orgParams.type;
////      type = type.startsWith(G.defaultVocPath) ? type.slice(G.defaultVocPath.length) : type;
//      delete orgParams.type;
//      var ignoredParams = '';
//      var params = {};
//      _.forEach(_.keys(orgParams), function(p) {
//        if (_.contains(U.paramsToSkip, p))
//          return;
//        
//        var apiParam = U.apiParamMap[p];
//        if (typeof apiParam !== 'undefined') {
//          var val = orgParams[p];
//          if (apiParam == '$limit')
//            val = Math.max(parseInt(val, 10), 50);
//          
//          params[apiParam] = val;
//          return;
//        }
//        
//        if (p.startsWith('-')) {
//          ignoredParams += p + ',';
//          return;
//        }
//        
//        var val = orgParams[p];
//        if (typeof val === 'undefined' || val === '')
//          return;
//        
//        var matches = p.match(/^\.?([a-zA-Z_]+)(_select|_To|_From)$/);
//        if (matches && matches.length > 1) {
//          var pType = matches.length >=3 ? matches[2] : null;
//          if (pType) {
//            if (pType == '_From')
//              val = '>=' + val; // to make the query string look like "start=>=today", with <=today encoded of course            
//            else if (pType == '_To')
//              val = '<=' + val; // to make the query string look like "end=<=today", with <=today encoded of course
//          }
//          
//          params[matches[1]] = val;
//        }
//        else {
//          if (!p.match(/^[a-zA-Z]/) || p.endsWith('_verified')) // starts with a letter
//            return;
//          
//          params[p] = val;
//        }
//      });
//      
////      if (ignoredParams)
////        console.log('ignoring url parameters during regular to mobile url conversion: ' + ignoredParams);
//      
//      return (url.toLowerCase().startsWith('mkresource.html') ? 'make/' : '') + encodeURIComponent(type) + (_.size(params) ? '?' + $.param(params) : '');
//    },
    
    primitiveTypes: {
//      uri: 'system/primitiveTypes',
      dates: ['date', 'dateTime', 'ComplexDate'],
      floats: ['float', 'double', 'Percent', 'm', 'm2', 'km', 'km2', 'g', 'kg'], 
      ints: ['int', 'long', 'Duration', 'ComplexDate', 'dateTime', 'date']
    },
    
    /**
     * @param res Resource (Backbone.Model) instance or model
     * @param prop name of the property
     * @param property value 
     */
    getTypedValue: function(res, prop, value) {
      var vocModel = res.vocModel || res;
      var p = U.primitiveTypes;
      var prop = vocModel.properties[prop];
      var range = prop.range || prop.facet;
      var isNumber = !isNaN(value);
      if (range === 'boolean')
        return typeof value === 'boolean' ? value : value === 'true' || value === 'Yes' || value === '1' || value === 1; 
      else if (p.dates.indexOf(range) != -1)
        return U.parseDate(value);
      else if (p.floats.indexOf(range) != -1)
        return parseFloat(value);
      else if (p.ints.indexOf(range) != -1)
        return parseInt(value);
//      else if (p.floats.indexOf(range) != -1)
//        return !isNumber ? null : parseFloat(value);
//      else if (p.ints.indexOf(range) != -1)
//        return !isNumber ? null : parseInt(value);
//      else if (range.startsWith(p.uri)) {
//        range = range.slice(pt.length + 1);
//        if (p.floats.indexOf(range) != -1)
//          return parseFloat(value);
//        else if (p.ints.indexOf(range) != -1)
//          return parseInt(value);
//        else
//          return value;        
//      }
      
      if (range == 'ComplexDate' || range ==  'dateTime') {
        try {
          if (isNaN(value))
            return parseInt(value);
          else
            return value;
        } catch (err) {
          // TODO: check if it's valid, like 'today', etc.
          return value; 
        }
      }
      else if (range == 'Money')
        return isNaN(value) ? parseFloat(value) : value;

//    var hIdx = range.indexOf('#');
//    if (hIdx != -1) {
//      range = range.slice(hIdx + 1);
//      switch (range) {
//      case 'string':
//        return value;
//      case 'int':
//      case 'long':
//      case 'date':
//        return parseInt(value);
//      case 'float':
//      case 'double':
//        return parseFloat(value);
//      case 'boolean':
//        return ['true', '1', 'yes'].indexOf(value.toLowerCase()) != -1;
//      default:
//        throw new Error('unsupported property range: ' + range);  
//      }
//    }

      return value;
    },
    
    isTrue: function(val) {
      if (_.isUndefined(val) || val == null)
        return false;
      
      if (typeof val === 'string')
        return ['1', 'true', 'yes'].indexOf(val.toLowerCase()) != -1;
      else
        return !!val;
    },
    
    /**
     * like _.filter, but func takes in both key and value 
     * @return obj with keys and values such that for each [key, val] pair, func(key, val) is truthy;
     */
    filterObj: function(obj, func) {
      var filtered = {};
      for (var key in obj) {
        if (_.has(obj, key)) {
          var val = obj[key];
          if (func(key, val))
            filtered[key] = val;
        }
      }
      
      return filtered;
    },
    
//    copyFrom: function(from, to, props) {
//      _.each(props || from, function(p) {
//        to[p] = from[p];
//      });
//    },
    
    /**
     * @return obj with keys and values remapped by func. 
     * @param func: takes in key, value, returns [newKey, newValue] or null if you want to remove it from the map 
     */
    mapObj: function(obj, func) {
      var mapped = {};
      for (var key in obj) {
        var val = obj[key];
        var pair = func(key, val);
        if (pair)
          mapped[pair[0]] = pair[1];
      }
      
      return mapped;
    },
    
    // https://gist.github.com/boo1ean/3878870
    plural: [
       [/(quiz)$/i,               "$1zes"  ],
       [/^(ox)$/i,                "$1en"   ],
       [/([m|l])ouse$/i,          "$1ice"  ],
       [/(matr|vert|ind)ix|ex$/i, "$1ices" ],
       [/(x|ch|ss|sh)$/i,         "$1es"   ],
       [/([^aeiouy]|qu)y$/i,      "$1ies"  ],
       [/(hive)$/i,               "$1s"    ],
       [/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
       [/sis$/i,                  "ses"    ],
       [/([ti])um$/i,             "$1a"    ],
       [/(buffal|tomat)o$/i,      "$1oes"  ],
       [/(bu)s$/i,                "$1ses"  ],
       [/(alias|status)$/i,       "$1es"   ],
       [/(octop|vir)us$/i,        "$1i"    ],
       [/(ax|test)is$/i,          "$1es"   ],
       [/s$/i,                    "s"      ],
       [/$/,                      "s"      ]
    ],
         
    /**
     * @param name: name or resource
     */
    getPlural: function(name) {
      if (U.isModel(name) || U.isCollection(name)) {
        var pName = name.vocModel.pluralName;
        if (pName)
          return pName;
        
        name = name.displayName;
      }
      
      for (var i = 0; i < U.plural.length; i++) {
        var regex          = U.plural[i][0];
        var replace_string = U.plural[i][1];
        if (regex.test(name)) {
          return name.replace(regex, replace_string);
        }
      }
      
      return name + 's';
    },
    // helps to fit images in listview (RL)
    // note: margins in DOM should be: -left and -top 
    fitToFrame : function(frmWidth, frmHeight, srcRation) {
      var frmRatio = frmWidth / frmHeight;
      var w, h, x = 0, y = 0;
      if (srcRation > frmRatio) { // long
        h = frmHeight; 
        w = Math.floor(h * srcRation); 
        x = Math.floor((w - frmWidth) / 2);
      } 
      else {
        w = frmWidth; 
        h = Math.floor(w / srcRation); 
        y = Math.floor((h - frmHeight) / 2);
      }
      return {x: x, y: y, w: w, h: h};
    },
    
    clipToFrame: function(frmWidth, frmHeight, oWidth, oHeight, maxDim, minDim) {
      if (!maxDim)
        return;
      if (oWidth < maxDim  &&  oHeight < maxDim)
        return {clip_top: 0, clip_right: oWidth, clip_bottom: oHeight, clip_left: 0, top: 0, left: 0};
      if (maxDim  &&  (maxDim > frmWidth)) {
        var mdW, mdH;
        if (minDim  &&  minDim >= frmWidth) {
          if (oWidth <= oHeight) {
            mdW = minDim; 
            var r = minDim /oWidth;
            mdH = Math.floor(oHeight * r); 
          }
          else {
            mdH = minDim; 
            var r = minDim /oHeight;
            mdW = Math.floor(oWidth * r); 
          }
        }
        else {
          if (oWidth >= oHeight) {
            mdW = maxDim; 
            var r = maxDim /oWidth;
            mdH = Math.floor(oHeight * r);
            if (mdH < frmHeight  &&  mdH < oHeight) {
              mdH = frmHeight;
              var r = frmHeight /oHeight;
              mdW = Math.floor(oWidth * r); 
            }
          }
          else {
            mdH = maxDim; 
            var r = maxDim /oHeight;
            mdW = Math.floor(oWidth * r); 
          }
        }
        var dW = mdW > frmWidth ? Math.floor((mdW - frmWidth) / 2) : 0;
        var dH = mdH > frmHeight ? Math.floor((mdH - frmHeight) / 2) : 0;    
        var t = dH, l = dW, r = mdW > frmWidth ? frmWidth + dW : mdW, b = mdH > frmHeight ? frmHeight + dH : mdH;
        return {clip_top: t, clip_right: r, clip_bottom: b, clip_left: l, top: (dH ? -dH : 0), left: (dW ? -dW : 0)};
        //return {clip_top: dH, clip_right: frmWidth + dW, clip_bottom: frmHeight + dH, clip_left: dW, top: (dH ? -dH : 0), left: (dW ? -dW : 0)};
      }
    },
    
    getHash: function(decode) {
      if (HAS_PUSH_STATE)
        return window.location.href.slice(G.appUrl.length + 1);
      else {
        var match = (window || this).location.href.match(/#(.*)$/),
            hash = match ? match[1] : '';
            
        return decode ? decodeURIComponent(hash) : hash;
      }  
    },
    
//    flattenModelJson: function(m, vocModel, preserve) {
//      var vocProps = vocModel.properties;
//      var flat = {};
//      for (var name in m) {
//        if (name.indexOf(".") != -1) {
//          flat[name] = m[name];
//          continue;
//        }
//          
//        var val = m[name];
//        var prop = vocProps[name];
//        if (!prop || 
//            (prop.parameter && !_.contains(preserve, 'parameter')) || 
//            (prop.virtual && !_.contains(preserve, 'virtual'))) { // || 
////            (isFileUpload(prop, val) && !_.contains(preserve, '_fileUpload')))
//          continue;
//        }
//        
//        flat[name] = U.getFlatValue(prop, val);
//      }
//      
//      return flat;
//    },
    
    getFlatValue: function(prop, val) {
      if (U.isNully(val))
        return null;
      
      var range = prop.range || '';
      if (typeof val !== 'object') {
        if (range.indexOf('/') != -1 && /^[a-z]+\/.*\?/.test(val)) // don't bother extending short uris like ShoppingList/32004, but do extend stuff like commerce/urbien/ShoppingList?id=32004
          return U.getLongUri1(val);
        
        return val;
      }      
      
      var value = val.value;
      if (value) {
        if (range.indexOf("/") === -1)
          return value;
        return typeof value !== 'string' ? value : value.indexOf('/') === -1 ? value : U.getLongUri1(value);
      }
      
      return val;
    },
    
    isNully: function(val) {
      return _.isUndefined(val) || val === null || val === '';
    },

    isFalsy: function(val, range) {
      if (U.isNully(val))
        return true;
      
      var primitives = U.primitiveTypes;
      var valType = typeof val; 
      if (range === 'boolean') {
        return valType === 'boolean' ? !val : valType === 'string' ? ['true', 'Yes', '1'].indexOf(val) === -1 : valType === 'number' ? val === 0 : !val;
      }
      else if (_.contains(primitives.ints, range)) {
        try {
          return !parseInt(val);
        } catch (err) {
          return true;
        }
      }
      else if (_.contains(primitives.floats, range)) {
        try {
          return !parseFloat(val);
        } catch (err) {
          return true;
        }
      }
      
      return val === 'null' || !val; // val could be an empty string
    },
    

    _dateProps: ['ComplexDate', 'date', 'dateTime'],
    _timeProps: ['Duration', 'years', 'hours', 'minutes', 'seconds'],
    isDateOrTimeProp: function(prop) {
      return U.isDateProp(prop) || U.isTimeProp(prop);
    },

    isEnumProp: function(prop) {
      return prop.range === 'enum';
    },
    
    isDateProp: function(prop) {
      return U.isXProp(prop, U._dateProps);
    },

    isTimeProp: function(prop) {
      return U.isXProp(prop, U._timeProps);
    },

    isXProp: function(prop, propShortNameSet) {
      if (!prop.range)
        return false;
      
      var range = prop.range;
      var lsIdx = range.lastIndexOf('/');
      range = lsIdx === -1 ? range : range.slice(lsIdx + 1);
      return _.contains(propShortNameSet, range);      
    },
    
    toDateParts: function(millis) {
      var date = millis ? new Date(millis) : new Date();
      return [date.getMonth(), date.getDate(), date.getFullYear()];//, date.getMonth(), date.getDate()];
    },
    
    millis: {
      second: 1000,
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000
    },
    
    parseDate: function(date) {
      if (!isNaN(date))
        return parseInt(date);
      
      try {
        var d = new Date(date);
        return d.getTime();
      } catch (err) {
      }
            
      var startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      startOfDay = startOfDay.getTime();
      switch (date) {
        case 'today':
          return startOfDay;
        case 'tomorrow':
          return startOfDay + U.millis.day;
        case 'yesterday':
          return startOfDay - U.millis.day;
        case 'day after tomorrow':
          return startOfDay + 2*U.millis.day;
      }
      
//      if (!date)
//        log('error', 'match undefined 5');
      var parsed = date.match(/(\d)* ?(second|minute|hour|day|week|month|year){1}s? ?(ago|ahead)/);
      if (!parsed)
        throw new Error('couldn\'t parse date: ' + date);
      
      var num = parsed[1] ? parseInt(parsed[1]) : 0;
      var length = U.millis[parsed[2]];
      var multiplier = parsed[3] === 'ago' ? -1 : 1;
      return startOfDay + num * length * multiplier;
    },
    
    getPositionProps: function(vocModel) {
      var positionProps = {};
      if (U.isA(vocModel, "Locatable")) {
        var lat = U.getCloneOf(vocModel, "Locatable.latitude");
        if (lat.length) 
          positionProps.latitude = lat[0];
        var lon = U.getCloneOf(vocModel, "Locatable.longitude");
        if (lon.length) 
          positionProps.longitude = lon[0];
      }
      else if (U.isA(vocModel, "Shape")) {
        var lat = U.getCloneOf(vocModel, "Shape.interiorPointLatitude");
        if (lat.length) 
          positionProps.latitude = lat[0];
        var lon = U.getCloneOf(vocModel, "Shape.interiorPointLongitude");
        if (lon.length) 
          positionProps.longitude = lon[0];
      }
      
      if (U.isA(vocModel, "Distance")) {
        var radius = U.getCloneOf(vocModel, "Distance.radius");
        if (radius.length) 
          positionProps.radius = radius[0];
        var distance = U.getCloneOf(vocModel, "Distance.distance");
        if (distance.length)
          positionProps.distance = distance[0];
      }
      
      return positionProps;
    },
    
    makeHeaderTitle: function(pre, post) {
      return pre === post ? pre : pre + "&#160;<span style='padding: 0 7px;' class='ui-icon-caret-right'></span>&#160;" + post;
    },
//    removeUnquotedWhitespace: function(text) {
//      qStack = [];
//      sqStack = [];
//      qqStack = [];
//      qsqStask = [];
//      var newText = '';
//      for (var i in text) {
//        switch (i) {
//        case '\''
//        }
//      }
//    },
//    pick: function(obj) {
//      var type = U.getObjectType(obj);
//      switch (type) {
//      case '[object Object]':
//        return _.pick.apply(null, arguments);
//      case '[object Array]':
//        var keys = concat.apply([], slice.call(arguments, 1));
//        var arrCopy = [];
//        for (var i = 0; i < obj.length; i++) {
//          var item = obj[i], copy = {};
//          for (var j = 0; j < keys.length; j++) {
//            var key = keys[j];
//            if (key in item) 
//              copy[key] = item[key];
//          }
//          
//          arrCopy.push(copy);
//        }
//        
//        return arrCopy;
//      }
//    },
    systemProps: {davDisplayName: {range: 'string', readOnly: true}, davGetLastModified: {range: 'long', readOnly: true}},
    isSystemProp: function(p) {
      p = typeof p === 'string' ? p : p.shortName;
      return /^\_/.test(p) || !!U.systemProps[p];
    },
    imageResourceProps: ['ImageResource.originalImage', 'ImageResource.smallImage', 'ImageResource.mediumImage', 'ImageResource.bigImage', 'ImageResource.bigMediumImage'],
    inlinedPropRegex: /model\/company\/Money|system\/primitiveTypes\/Duration|system\/fog\/ComplexDate$/,
    isInlined: function(prop) {
      return (prop.range && U.inlinedPropRegex.test(prop.range)) || (prop.facet && U.inlinedPropRegex.test(prop.facet));
    },
    isTempResource: function(res) {
      return U.isTempUri(res.getUri());
    },
    isTempUri: function(uri) {
      return uri && uri.indexOf("?__tempId__=") != -1;
    },
    buildUri: function(atts, model) {
      if (U.isModel(atts)) {
        model = atts.vocModel;
        atts = atts.attributes;
      }

      var primaryKeys = U.getPrimaryKeys(model),
          keyVals = _.pick(atts, primaryKeys);
      
      if (_.size(keyVals) != primaryKeys.length)
        return null;
      
      for (var key in keyVals) {
        if (typeof keyVals[key] == 'undefined')
          return null;
      }
      
      return U.makeUri(model.type, keyVals);
    },
    makeTempUri: function(type, id) {
      return U.makeUri(type, {
        __tempId__: typeof id === 'undefined' ? G.currentServerTime : id
      })
    },
    makeUri: function(type, params) {
      return G.sqlUrl + '/' + type.slice(7) + '?' + (typeof params == 'string' ? params : $.param(params));
    },
    sq: function(a) {
      return a * a;
    },
    getEarthRadius: function() {
      return G.isMetric === false ? 3961 : 6373;
    },
    distance: function(aCoords, bCoords) {
      var lat1 = aCoords[0], lat2 = bCoords[0], lon1 = aCoords[1], lon2 = bCoords[1];
      dlon = lon2 - lon1;
      dlat = lat2 - lat1;
      var a = U.sq(Math.sin(dlat/2)) + Math.cos(lat1) * Math.cos(lat2) * U.sq(Math.sin(dlon/2)); 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return U.getEarthRadius() * c;
          
//      var x = aCoords[0] - bCoords[0];
//      var y = aCoords[1] - bCoords[1];
//      return Math.sqrt(x*x + y*y);
    },
    
    concat: concat,
    copyArray: function(arr /* skip */) {
      var copy = [],
          skip = concat.apply(ArrayProto, slice.call(arguments, 1));
      
      for (var i in arr) {
        var val = arr[i];
        if (skip.indexOf(val) == -1)
          copy.push(val);
      }
      
      return copy;
    },

//    remove: function(array, item) {
//      var what, a = arguments, L = a.length, ax;
//      while (L && this.length) {
//        what = a[--L];
//        while ((ax = this.indexOf(what)) !== -1) {
//          this.splice(ax, 1);
//        }
//      }
//      return this;
//    },
    
    toObject: function(arr) {
      var obj = {};
      for (var i = 0; i < arr.length; i++) {
        obj[arr[i]] = {};
      }
      
      return obj;
    },
    
    toArray: function(obj) {
      var arr = [];
      for (var prop in obj) {
        if (_.has(obj, prop)) {
          var piece = {};
          piece[prop] = obj[prop];
          arr.push(piece);
        }
      }
      
      return arr;
    },
    
    DEFAULT_WHERE_OPERATOR: '==',
    whereParams: {
      $or: '||', 
      $like: '&', 
      $in: ',', 
      $and: '&'
    },
    
    parseAPIClause: function(clause, vocModel) {
      var name, opVal, op, val, numArgs = arguments.length;
      switch (numArgs) {
      case 1:
        clause = clause.split('=');
        name = decodeURIComponent(clause[0]);
        opVal = decodeURIComponent(clause[1]);
        break;
      case 2:
        name = clause;
        opVal = arguments[1];
        break;
      case 3:
        name = arguments[0];
        op = arguments[1];
        val = arguments[2];
        break;
      }
        
      if (numArgs != 3) {
        if (opVal) {
          opVal = opVal.match(/^([>=<!]{0,2})(.+)$/);
          if (!opVal || opVal.length != 3)
            return null;
          
          op = opVal[1] || U.DEFAULT_WHERE_OPERATOR;
          val = opVal[2];
        }
        else {
          op = U.DEFAULT_WHERE_OPERATOR;
          val = '';
        }
      }
      
      if (op === '!')
        op = '!=';
      else if (op === '=')
        op = '==';
        
      if (name.startsWith('$')) {
//        var whereParam = U.filterObj(U.whereParams, function(param, delimiter) {
//          return name.startsWith(param);
//        });
//        
//        if (_.size(whereParam)) {
//          whereParam = _.getFirstProperty(whereParam);
//          var subClause = val.split('=');
//          if (subClause.length == 2 && subClause[0] === whereParam) {
//            debugger;
//            subClause = U.parseAPIQuery(subClause[1], U.whereParams[whereParam]);
//            var sVal = {};
//            sVal[whereParam] = subClause;
//            val = sVal;
//          }
//        }
//        else 
        if (name.startsWith('$this.')) {
          debugger;
          name = name.slice(6);
        }
      }
        
      return {
        name: name, 
        op: op || U.DEFAULT_WHERE_OPERATOR, 
        value: val
      };
    },

    parseAPIQuery: function(query, delimiter) {
      var result = [];
      var type = U.getObjectType(query);
      switch (type) {
        case '[object Object]':
          var q = [];
          for (var p in query) {
            var one = {};
            one[p] = query[p];
            q.push($.param(one));
          }
          
          query = q;
          break;
        case '[object String]':
          query = query.split(delimiter || '&');
          break;
        default:
          throw new Error('query must be either a query string or a parameter map');
      }
      
      for (var i = 0; i < query.length; i++) {
        var clause = U.parseAPIClause(query[i]);
        if (!clause) {
          log('error', 'bad query: ' + query[i]);          
          return null;
        }
        
        result.push(clause);
      }
      
      return result;
    },
    
    buildValueTester: function(params, vocModel) {
      var rules = [], meta = vocModel.properties;
      var query = U.parseAPIQuery(params);
      _.each(query, function(clause) {
        var param = clause.name;
        switch (param) {
        case '$or':
        case '$and':
          var chainFn = param === '$or' ? _.any : _.all;
          var subq = U.parseAPIQuery(clause.value, U.whereParams[param]);
          var tests = _.map(subq, function(subClause) {
            switch (subClause.name) {
              case '$or':
              case '$and':
              case '$in':
                var prms = {};
                prms[subClause.name] = subClause.value;
                return U.buildValueTester(prms, vocModel);
            }
            
            if (subClause.name.startsWith('$')) {
              debugger;
              return function() {return true};
            }
            
            return U.makeTest(meta[subClause.name], subClause.op, subClause.value);
          });
          
          rules.push(function(val) {
            return chainFn(tests, function(test) {
              return test(val);
            });
          });
          
          break;
        case '$in':
          var or = {};
          var values = clause.value.split(',');
          var propName = values[0];
          var prop = meta[propName];
          if (!prop) {
            debugger;
            return function() {return true};
          }
          
          values = values.slice(1);
          var chain = [];
          for (var i = 1; i < values.length; i++) {
            var test = U.makeTest(prop, U.DEFAULT_WHERE_OPERATOR, values[i]);
            chain.push(test);
          }
          
          rules.push(function(val) {
            return _.any(chain, function(test) {
              return test(val);
            });
          });
          
          break;
        case '$like':
          var nameVal = clause.value.split(',');
          var propName = nameVal[0];
          var prop = meta[propName];
          if (!prop) {
            debugger;
            return function() {return true};
          }
          
          var value = nameVal[1].toLowerCase();
          var chain = [];
          rules.push(function(res) {
            var val = res[propName];
            return val && val.toLowerCase().indexOf(value) != -1;
          });
          
          break;
        default:
          if (param.startsWith('$'))
            break;
          
          var prop = meta[param];
          if (!prop || U.getObjectType(clause) !== '[object Object]') {
            log('info', 'couldnt find property {0} in class {1}'.format(param, vocModel.type));
            return function() {
              return true;
            }
          }
          
          rules.push(U.makeTest(meta[param], clause.op, clause.value));          
          break;
        }
      });
      
      return function(val) {
        for (var i = 0; i < rules.length; i++) {
          if (!rules[i](val))
            return false;
        }
        
        return true;
      }
    },
    
    makeTest: function(prop, op, bound) {
      if (arguments.length == 1) {
        op = prop.op;
        bound = prop.value;
        prop = prop.name;
      }
      
      if (!prop)
        return function() {return true};
        
      if (U.isResourceProp(prop) && bound === '_me') {
        if (G.currentUser.guest) {
//          Events.trigger('req-login'); // exit search?
//          return function() {
//            return false;
//          };
          throw G.Errors.Login;
        }
        else
          bound = G.currentUser._uri;
      }

      var range = prop.range;
      var name = prop.shortName;
      var falsy = function(res) {
        return U.isFalsy(U.getValue(res, name), range);
      }
      var truthy = function(res) {
        return !U.isFalsy(U.getValue(res, name), range);
      }
      
      if (bound === 'null')
        return (op === '==') ^ U.isFalsy(bound, range) ? truthy : falsy; // XOR
      
      switch (range) {        
        case 'boolean':
          return (op === '==') ^ U.isFalsy(bound, range) ? truthy : falsy; // XOR
        case 'date':
        case 'dateTime':
        case 'ComplexDate':
          try {
            bound = U.parseDate(bound);
          } catch (err) {
            log('error', "couldn't parse date bound: " + bound);
            return function() {return true};
          }
          // fall through to default
        default: {
          return function(res) {
            try {
              return new Function("a", "b", "return a {0} b".format(op))(U.getValue(res, name), bound);
            } catch (err){
              return false;
            }
          };
        }
      }
    },

    _reservedTemplateKeywords: ['U', 'G', '$', 'loc'],
    template: function(templateName, type, context) {
      var template,
          typeKey = type || '',
          subCache = compiledTemplates[templateName] = compiledTemplates[templateName] || {},
          templateFn = subCache[typeKey];
      
      if (templateFn)
        return context ? templateFn.bind(context) : templateFn;
      
      if (typeof templateName === 'string') {
        template = Templates.get(templateName, type);
        if (!template)
          return null;
        
        template = _.template(_.removeHTMLComments(template).trim());
      }
      else
        template = templateName;

//      return subCache[typeKey] = template;
      return subCache[typeKey] = function(json, unlazifyImages) {
        if (_.any(U._reservedTemplatedKeywords, _.has.bind(_, json)))
          throw "Invalid data for template, keywords [{0}] are reserved".format(U._reservedTemplateKeywords.join(', '));
        
        json = json || {};
        json.U = U;
        json.G = G;
        json.$ = $;
        json.loc = G.localize;
        
        var html = template.call(this, json);
        return unlazifyImages ? DOM.unlazifyImagesInHTML(html) : html;
      };
    },
    
    getOrderByProps: function(collection) {
      var orderBy = collection.params.$orderBy;
      if (orderBy)
        return [orderBy];
        
      var props = U.getPropertiesWith(meta, [{name: "sortAscending"}]);
      if (props) {
        props = U.filterObj(props, function(name, prop) {
          return !prop.backLink;
        });
        
        if (props)
          return _.keys(props);
      }
      
      return null;
    },
    
    synchronousTypes: [
      'aspects/commerce/Transaction', 
      'commerce/coupon/Deposit', 
      'model/social/AppInstall',
      'model/social/PushoverAccess'
    ],
    
    canAsync: function(type) {
//      if (true)
//        return true; // till we decide if this is really necessary
      
      if (typeof type !== 'string')
        type = type.type; // if it's vocModel
      
      if (type.startsWith('http://'))
        type = type.slice(type.indexOf('voc/') + 4);
      
      return !_.contains(U.synchronousTypes, type);
    },
    
    pipePromise: function(promiseOrDeferred, deferred) {
      promiseOrDeferred.done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    
    trim: function(text, length) {
      if (!text)
        return '';
      
      if (text.length < length)
        return text;
      
      return text.slice(0, length) + '...';
    },

    fixResourceJSON: function(item, vocModel) {
      var meta = vocModel.properties;
      for (var p in item) {
        if (!/_/.test(p) && !meta[p])
          delete item[p];
      }
    },
    
    /**
     * @param from - attributes object
     * @param to - attributes object
     * @prop - string name of property
     * 
     * given prop is sth like 'submittedBy', copies props like submittedBy.displayName, submittedBy.thumb from "from" to "to" 
     */
    copySubProps: function(from, to, prop) {
//      if (from.davDisplayName)
//        to[prop + '.displayName'] = from.davDisplayName;
//      
//      var type = U.getTypeUri(from._uri);
//      var model = U.getModel(type);
//      if (model) {
//        var ir = 'ImageResource'; 
//        if (U.isA(model, ir)) {
//          var iProps = _.map(['smallImage', 'mediumImage'], function(ip) {return '{0}.{1}'.format(ir, ip)});
//          var imgProps = U.getCloneOf(model, iProps);
//          if (imgProps.length) {
//            _.each(imgProps, function(imgProp) {              
//              var resProp = '{0}.{1}'.format(prop, imgProp);
//              var val = from[resProp];
//              if (val)
//                to[resProp] = val;
//            });
//          }
//        }
//      }
      
      var start = prop + '.';
      for (var p in from) {
        if (p.startsWith(start))
          to[p] = from[p];
      }
    },
    
    getRequiredCodemirrorModes: function(vocModel) {
      var codeProps = U.getPropertiesWith(vocModel.properties, 'code');
      var scriptTypes = [];
      var codemirrorModes = [];
      for (var cp in codeProps) {
        var code = codeProps[cp].code;
        switch (code) {
          case 'html':
            codemirrorModes.push('codemirrorXMLMode');
            codemirrorModes.push('codemirrorHTMLMode');
            break;
          case 'css':
            codemirrorModes.push('codemirrorCSSMode');
            break;
          case 'js':
            codemirrorModes.push('codemirrorJSMode');
            break;
        }
      }
      
      codemirrorModes = _.uniq(codemirrorModes);
      return codemirrorModes;
    },
    
    getListParams: function(resource, backlinkProp) {
      var params = {};
      params[backlinkProp.backLink] = resource.getUri();
      if (backlinkProp.where)
        _.extend(params, U.getQueryParams(backlinkProp.where));
      if (backlinkProp.whereOr)
        params.$or = backlinkProp.whereOr;
      
      return params;
    },
    
    getChanges: function(prev, now) {
      var changes = {};
      for (var prop in now) {
        if (!prev || prev[prop] !== now[prop]) {
          if (typeof now[prop] == "object") {
            var c = U.getChanges(prev[prop], now[prop]);
            if (! _.isEmpty(c) ) // underscore
              changes[prop] = c;
          } else {
            changes[prop] = now[prop];
          }
        }
      }
      
      return changes;
    },

    getClassDisplayName: function(uri) {
      if (typeof uri === 'string') {
        uri = U.getTypeUri(uri);
        var model = U.getModel(uri);
        if (model)
          return model.displayName;
        else
          return U.getClassName(uri).splitCamelCase();
      }
      else
        return uri.displayName;
    },
    
    removeHTML: function(str) {
      return str.replace(/(<([^>]+)>)/ig, '');
    },
    DEFAULT_HTML_PROP_VALUE: '<!-- put your HTML here buddy -->',
    DEFAULT_JS_PROP_VALUE: '/* put your JavaScript here buddy */',
    DEFAULT_CSS_PROP_VALUE: '/* put your CSS here buddy */',
    alert: function(options) {
      setTimeout(function() {
        U.require('@widgets').done(function($m) {          
          var msg = typeof options === 'string' ? options : options.msg;
          $m.showPageLoadingMsg($m.pageLoadErrorMessageTheme, msg, !options.spinner);
          if (!options.persist)
            setTimeout($m.hidePageLoadingMsg, Math.max(1500, msg.length * 50));
        });
      }, options.delay || 0);
    },
    
    /**
     * @param options: specify id, header, title, img, ok, cancel, details 
     * @example 
     *    U.dialog({
     *      id: 'chatRequestDialog',
     *      header: 'Chat Invitation',
     *      title: 'Chat with me?',
     *      details: 'you will not regret it...',
     *      ok: 'Accept',         // pass true to get default string 'Ok', or false to not have a button
     *      cancel: 'Decline',    // pass true to get default string 'Cancel', or false to not have a button
     *      img: 'http://urbien.com/path/to/img'
     *    });
     *  
     */
    dialog: function(options) {
      var id = options.id = options.id || 'dialog' + G.nextId(),
          existing = doc.getElementById(id);
      
      existing && existing.$remove();
      var dialogHtml = U.template('genericDialogTemplate')(_.defaults(options, {
        ok: true,
        cancel: true
      }));
      
      (G.activePage || doc.body).$append(dialogHtml);
      var dialog = doc.getElementById(id);
      if (G.isJQM())
        $(dialog).trigger('create').popup().popup("open");
      else
        dialog.style['zIndex'] = 1000000;
      if (options.onok)
        dialog.$('[data-cancel]').$on('click', options.oncancel);
      if (options.onok)
        dialog.$('[data-ok]').$on('click', options.onok);
      
      return dialog;
    },
        
    deposit: function(params) {
      return $.Deferred(function(defer) {
        var trType = G.commonTypes.Transaction;
        U.require('vocManager').done(function(Voc) {          
          Voc.getModels(trType).done(function() {
            var transactionModel = U.getModel(trType);
            var transaction = new transactionModel(params);
            transaction.save(null, {
              sync: !U.canAsync(trType),
              success: function() {
                defer.resolve(transaction);
              },
              error: function(trans, err, options) {
                var err = err.responseText || err;
                if (typeof err === 'string') {
                  try {
                    err = JSON.parse(err);
                  } catch (e) {}
                }
                
                defer.reject(err);
              }
            });
          });
        });
      }).promise();;
    },
    
    /**
     * @param title - title in the header of the popup 
     * @param options - choices, each in the form of 
     * {
     *   href: 'http://.....some/url', 
     *   text: 'Link text'
     * } 
     */
    optionsDialog: function(title, options) {
      var id = 'optionsDialog' + G.nextId();
      $('#' + id).remove();
      _.each(options, function(option) {
        option.id = option.id || 'option' + G.nextId();
      });
      
      var dialogHtml = U.template('genericOptionsDialogTemplate')({
        id: id,
        title: title,
        options: options
      });

      var dialog = (G.activePage || doc.body).$append(dialogHtml).$('#' + id);
      _.each(options, function(option) {
        if (option.action) {
          dialog.$('#' + option.id).$on('click', option.action);
        }
      });
      
      if (G.isJQM()) {
        $(dialog).trigger('create').popup().popup("open");
      }
    },
    
    getPath: function(uri) {
      var path = uri.match(/(hudsonfog\.com|urbien\.com)\/voc\/([^\?]*)/)[2]; // starting from hudsonfog.com/voc/
      var params = _.getParamMap(uri);
      for (var param in params) {
        path += '/' + encodeURIComponent(params[param]);
      }
      
      return path;
    },
    
    toFormData: function(data, opts) {
      var fd = new FormData();      
      var resource = opts.resource;
      var vocModel = resource.vocModel;
      var blobbed = false;
      for (var prop in data) {
        var val = data[prop];
        if (!(val instanceof Blob)) {
          fd.append(prop, val);
          continue;
        }
        
        if (!blobbed) {
          blobbed = true;
          var attachmentsUrlProp = U.getCloneOf(vocModel, "FileSystem.attachmentsUrl")[0];
          if (!attachmentsUrlProp)
            continue;
          
//          if (data._uri) {
//            fd.append('_uri', data._uri);
//            fd.append('uri', data._uri);
//          }
          
//          fd.append('type', vocModel.type);
          fd.append('enctype', "multipart/form-data");
          fd.append('-$action', 'upload');
          fd.append('location', G.serverName + '/wf/' + resource.get(attachmentsUrlProp));
          _.extend(opts, {
            processData: false,
            contentType: false
          });
          
          _.each(['dataType', 'emulateJSON', 'emulateHTTP'], function(option) {
            delete opts[option];
          });
        }
          
        fd.append(prop, val, prop);
      }
      
      return fd;
    },
    getBlobValueProps: function(data) {
      return U.filterObj(data, function(key, val) { return val instanceof Blob });
    },
    getExternalFileUrl: function(uri) {
      var params = _.getParamMap(uri);
      if (params.url)
        return G.serverName + '/' + params.url;
      else
        return uri;
    },
    _chatRoutes: {
      'private': 'chatPrivate',
      'public': 'chat',
      'lobby': 'chatLobby'
    },
    isChatPage: function(hash) {
      return /^chat/.test(hash || U.getHash());
    },
    isPrivateChat: function() {
      return U.getHash().startsWith('chatPrivate');
    },
    isWaitingRoom: function() {
      return U.getHash().startsWith('chatLobby');
    },
    getRoute: function(hash) {
      hash = hash || U.getHash();
      var match = hash.match(/^([a-zA-Z]+)\//);
      return match ? match[1] : '';
//      var match = (hash || U.getHash()).match(/^view|menu|edit|make|chooser|templates|(chat)([a-zA-Z]+)?/);
//      return match ? match[0] : '';
    },
    getRouteAction: function(route) {
      return route ? (route.startsWith('chat') ? 'chat' : route) : 'list';
    },

    toModelLatLon: function(coords, model) {
      var lat, lon, modelLatLon = {};
      if (model) {
        lat = U.getCloneOf(model, 'Locatable.latitude')[0],
        lon = U.getCloneOf(model, 'Locatable.longitude')[0];
        if (!lat && !lon)
          return null;
      }
      
      if (lat)
        modelLatLon[lat] = coords.latitude;
      if (lon)
        modelLatLon[lon] = coords.longitude;
      
      return modelLatLon;
    },

    getCurrentLocation: function(options, watch) {
      var dfd = $.Deferred(),
          promise = dfd.promise();
      
      var watchId = navigator.geolocation[watch ? 'watchPosition' : 'getCurrentPosition'](function(position) {
        position = simplifyPosition(position);
        Events.trigger('location', position);
        if (watch)
          dfd.notify(position);
        else
          dfd.resolve(position);
      }, dfd.reject, _.defaults(options || {}, {
        enableHighAccuracy: false,
        maximumAge: 2000,
        timeout: 5000
      }));
      
      if (watch) {
        _.extend(promise, {
          cancel: function() {
            navigator.geolocation.clearWatch(watchId);
          }
        });
      }
      
      return promise;
    },
    
    /**
     * sends a remote procedure call to the packaged app code
     */
    rpc: function(method) {
//      log('app', method);
      var args = slice.call(arguments, 1),
          msg = {
            type: 'rpc:' + method
          };
      
      if (args && args.length)
        msg.args = args;
      
      Events.trigger('messageToApp', msg);
    },
    
    domReq: function(req) {
      return $.Deferred(function(defer) {
        req.onsuccess = function(e) {
          defer.resolve(e.target.result);
        };
        
        req.onerror = function() {
          defer.reject.apply(defer, arguments);
        };
      }).promise();
    },

    createAudio: function(options) {
      var audio = doc.createElement('audio');
      
      options = options || {};
      options.id = options.id || 'audio' + G.nextId();
      audio.$attr(options);
      G.activePage.appendChild(audio);
      return audio;
    },
    
    vibrate: (function() {
      var vib = navigator.vibrate || navigator.mozVibrate || navigator.webkitVibrate || function() {};
      return vib;
    })(),
    
    isMetaParameter: function(param) {
      return /^[$-_]+/.test(param);
    },

    isNativeModelParameter: function(param) {
      return !U.isMetaParameter(param) && !/\./.test(param);
    },

    isModelParameter: function(param) {
      return !U.isMetaParameter(param);
    },

    isCompositeProp: function(prop) {
      return /\./.test(prop);
    },
    
    getCompositeProps: function(props) {
      var filtered = {};
      for (var p in props) {
        if (U.isCompositeProp(p)) 
          filtered[p] = props[p];
      }
      
      return filtered;
    },
    
    getImageAttribute: function(res, prop) {
      return (res.cid || (res.get && res.getUri()) || res._uri || res) + '.' + prop;
    },

    parseImageAttribute: function(value) {
      var idAndProp = value.split('.');
      return {
        id: idAndProp[0],
        prop: idAndProp[1]
      };
    },
    
    getUrlInfo: function(hash) {
      return new UrlInfo(hash);
    },

    getPropFn: function(obj, prop, clone) {
      return function() {
        var val = obj[prop];
        if (typeof val === 'object' && clone)
          val = _.clone(val);
        
        return val;
      };
    },
    
    getIndexNames: function(vocModel) {
      var vc = U.getColsMeta(vocModel, 'view');
      var gc = U.getColsMeta(vocModel, 'grid');
      var extras = U.getPositionProps(vocModel);
      var cols = _.union(_.values(extras), gc, vc, '_uri');
      var dnIdx = cols.indexOf("DAV:displayname");
      if (~dnIdx)
        cols[dnIdx] = 'davDisplayName';
      
      var props = vocModel.properties;
      return _.filter(cols, function(c) {
        var p = props[c];
        return p && !p.backLink; // && !_.contains(SQL_WORDS, c.toLowerCase());
      });
    },

    isMasonryModel: function(vocModel) {
      var type = vocModel.type;
      return type.startsWith(G.defaultVocPath) && _.any(['Tournament', 'Theme', 'Goal', 'Coupon', 'VideoResource', 'Movie', 'App', 'ThirtyDayTrial', 'Tree', 'Urbien'], function(className) {
        return type.endsWith('/' + className);
      });
    },
    
    isIntersecting: function(rectA, rectB) {
//      var outOfTop = rectA.bottom - rectB.top,
//          outOfBottom = rectB.bottom - rectA.top,
//          outOfLeft = rectA.right - rectB.left,
//          outOfRight = rectB.right - rectA.left;
//      
//      if (outOfTop < 0)
//        console.log("Out of top by", -outOfTop);
//      else if (outOfBottom < 0)
//        console.log("Out of bottom by", -outOfBottom);
//      else if (outOfLeft < 0)
//        console.log("Out of left by", -outOfLeft);
//      else if (outOfRight < 0)
//        console.log("Out of right by", -outOfRight);
//      else
//        return true;
//      
//      return false;

      return rectA.bottom >= rectB.top 
          && rectA.top    <= rectB.bottom 
          && rectA.right  >= rectB.left 
          && rectA.left   <= rectB.right;
    },

    isRectPartiallyInViewport: function(rect, fuzz) {
      var viewport = G.viewport;
      fuzz = fuzz || 0; 
      return rect.bottom + fuzz >= 0 
          && rect.top - fuzz <= viewport.height 
          && rect.right + fuzz >= 0 
          && rect.left - fuzz <= viewport.width;
    },

    isRectInViewport: function(rect, fuzz) {
      fuzz = fuzz || 0; 
      return rect.top + fuzz >= 0 &&
             rect.left + fuzz >= 0 &&
             rect.bottom - fuzz <= (window.innerHeight || documentElement.clientHeight) && /*or $(window).height() */
             rect.right - fuzz <= (window.innerWidth || documentElement.clientWidth); /*or $(window).width() */
    },
    
//    isInViewport: function(element) {
//      var rect = element.getBoundingClientRect(),
//          documentElement = doc.documentElement;
//
//      return U.isRectInViewport(rect);
//    },
//    
//    isAtLeastPartiallyInViewport: function(element) {
//      if (element.offsetWidth === 0 || element.offsetHeight === 0) 
//        return false;
//      
//      var height = doc.documentElement.clientHeight,
//          rects = element.getClientRects();
//        
//      for (var i = 0, l = rects.length; i < l; i++) {
//        var r = rects[i];
//            in_viewport = r.top > 0 ? r.top <= height : (r.bottom > 0 && r.bottom <= height);
//            
//        if (in_viewport) 
//          return true;
//      }
//        
//      return false;
//    },
    
    getBacklinkCount: function(res, name) {
      return res.get(name + 'Count') || res.get(name).count;
    },
    
    createDataUrl: function(type, content) {
      return "data:{0};base64,{1}".format(type, window.btoa(content));
    },
    
    imageToDataURL: function(img) {
      // Create an empty canvas element
      var canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      // Copy the image contents to the canvas
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Get the data-URL formatted image
      // Firefox supports PNG and JPEG. You could check img.src to
      // guess the original format, but be aware the using "image/jpg"
      // will re-encode the image.
      var dataURL = canvas.toDataURL("image/png");
      return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    },
    
    resolvedPromise: function(/* what to resolve defer with */) {
      if (!arguments.length)
        return G.getResolvedPromise();
      else {
        var dfd = $.Deferred();
        return dfd.resolve.apply(dfd, concat.apply(ArrayProto, slice.call(arguments))).promise();
      }
    },
    
    rejectedPromise: function(/* what to reject defer with */) {
      if (!arguments.length)
        return G.getRejectedPromise();
      else {
        var dfd = $.Deferred();
        return dfd.reject.apply(dfd, concat.apply(ArrayProto, slice.call(arguments))).promise();
      }
    },
    
    getClonedProps: function(vocModel, iFace) {
      var meta = vocModel.properties,
          extractProp = new RegExp(',?\ *' + iFace + '\.([^,\ ]+)', 'g'),
          cloned = [];
          
      for (var name in meta) {
        var prop = meta[name],
            cloneOf = prop && prop.cloneOf,
            match;
        
        if (!cloneOf)
          continue;
        
        while (match = extractProp.exec(cloneOf)) {
          cloned.push(match[1]);
        }
      }
      
      return _.uniq(cloned);
    },
    
    parsePropsList: function(propsStr, vocModel) {
      var props = propsStr.splitAndTrim(','),
          actualProps = [],
          meta = vocModel.properties;
      
      for (var i in props) {
        var prop = props[i];
        if (!/^\$/.test(prop)) {
          actualProps.push(prop);
          continue;
        }
        
        switch (prop) {
        case '$viewCols':
        case '$gridCols':
          actualProps.push.apply(actualProps, U.getColsMeta(vocModel, prop.slice(1, 5)));
          break;
        case '$images':
          actualProps.push.apply(actualProps, U.getClonedProps(vocModel, 'ImageResource'));
          break;
        }
      }
      
      return actualProps;
    },
    
    getKeyEventCode: function(e) {
      return e.keyCode ? e.keyCode : 
                  e.which ? e.which : e.charCode;
    },
    
    cloneTouch: function(touch) {
      return {
        X: touch.clientX,
        Y: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY
      }
    },
    
    logFunctions: function(obj /*, function names, leave blank to log all functions on obj */) {
      var fns = arguments.length > 1 ? _.rest(arguments) : _.functions(obj);
      _.each(fns, function(fnName) {
        if (!_.has(obj, fnName))
          throw "not a function: " + fnName;
        
        var fn = obj[fnName];
        if (typeof fn == 'function') {
          obj[fnName] = function() {
            log(this.TAG || this.constructor.displayName || "", "FUNCTION LOG:", fnName, '(', _(arguments).map(function(arg) {return "'" + arg + "'"}).join(', '), ')');
            return fn.apply(this, arguments);
          };
        }
      });
    },
    
    toTimedFunction: function(obj, name, thresh) {
      var fn = obj[name];
      return function() {
        var now = _.now(),
            frame = window.fastdom.frameNum;
        
        try {
          return fn.apply(this, arguments);
        } finally {
          var time = _.now() - now;
          if (!thresh || time > thresh)
            console.log("function", name, "took", time, "millis", window.fastdom.frameNum - frame, "frames");
        }
      };
    },
    
    dataURLToBlob: function(dataURL) {
      var BASE64_MARKER = ';base64,',
          contentType,
          parts,
          raw;
      
      if (dataURL.indexOf(BASE64_MARKER) === -1) {
        parts = dataURL.split(',');
        contentType = parts[0].split(':')[1];
        raw = parts[1];

        return new Blob([raw], {type: contentType});
      }

      parts = dataURL.split(BASE64_MARKER);
      contentType = parts[0].split(':')[1];
      raw = window.atob(parts[1]);
      var rawLength = raw.length;
      var uInt8Array = new Uint8Array(rawLength);

      for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      return new Blob([uInt8Array.buffer], {type: contentType});
    },
    
    array: function() {
      if (RECYCLED_ARRAYS.length)
        return RECYCLED_ARRAYS.pop();
      
      return [];
    },

    object: function() {
      if (RECYCLED_OBJECTS.length)
        return RECYCLED_OBJECTS.pop();
      
      return {};
    },

    recycleContents: function(array) {
      for (var i = 0, len = array.length; i < len; i++) {
        U.recycle(array[i]);
      }
    },
    
    recycle: function() {
      for (var i = 0, len = arguments.length; i < len; i++) {
        var obj = arguments[i];
        if (_.isArray(obj)) {
          obj.length = 0;
          RECYCLED_ARRAYS.push(obj);
        }
        else if (_.isObject(obj)) {
          _.wipe(obj);
          RECYCLED_OBJECTS.push(obj);
        }
      }
    },
    
    clone: function(obj) {
      if (_.isArray(obj)) {
        var arr = U.array();
        arr.push.apply(arr, obj);
        return arr;
      }
      else if (_.isObject(obj)) {
        var newObj = U.object();
        return _.extend(newObj, obj);
      }
      else
        throw "Cloning unsupported";
    }
  };
  
  // No need to recalculate these every time
  var cachedOnObj = {
    isMasonry: '_isMasonry', 
    isMasonryModel: '_isMasonryModel', 
    getDisplayNameProps: '_displayNameProps', 
    getPrimaryKeys: '_primaryKeys', 
//    getModelImageProperty: '_imageProperty',
    getGridColsMeta: '_gridCols',
    getViewColsMeta: '_viewCols',
    isResourceProp: '_isResourceProp',
    getPropCloneOf: '_clonedProperties',
    getPositionProps: '_positionProperties',
    isInlined: '_isInlined',
    getIndexNames: '_indexNames'
  };
  
  _.each(cachedOnObj, function(propName, method) {    
    var origFn = U[method];
    U[method] = function(obj) {
      if (_.has(obj, propName))
        return obj[propName];
      
      return obj[propName] = origFn.apply(this, arguments);
    };
  });

  var urlInfoProps = ['route', 'uri', 'type', 'action', 'query', 'fragment', 'special'],
      urlInfoSpecial = ['params', 'sub'],
      allUrlInfoProps = _.union(urlInfoProps, urlInfoSpecial);
  
  function UrlInfo(hash) {
    if (typeof hash == 'string')
      this.initWithHash(hash);
    else {
      if (typeof hash === 'object')
        _.extend(this, hash || {});
    }
    
    var self = this;
    this.equals = function(urlInfo) {
      return this.toFragment() == urlInfo.toFragment();
    };
    
    this.toFragment = function() {
      if (this.fragment)
        return this.fragment;
      
      var base;
      if (this.route)
        base = this.route + '/' + encodeURIComponent(this.uri);
      else
        base = this.uri;
      
      if (!this.params)
        return base;
      
      return base + (base.indexOf("?") == -1 ? '?' : '&') + $.param(this.params || {});        
    };
    
    _.each(allUrlInfoProps, function(prop) {
      var cProp = prop.capitalizeFirst();
      self['get' + cProp] = function() {
        return self[prop];
      };
      
      self['set' + cProp] = function(val) {
        self[prop] = val;
        return self;
      };
    });
  };
  
  UrlInfo.prototype.initWithHash = function(hash) {
    var params = U.getHashParams(hash),
        qIdx = hash.indexOf("?"),
        route = U.getRoute(hash),
        subRoute,
        hashParts = hash.split('?'),
        type = U.getModelType(hash),
        query = hashParts[1] || '',
        uri,
        info,
        subInfo;

    if (HAS_PUSH_STATE && window.router.isResourceRoute(route)) {
      var uriParams = {};
      for (var param in params) {
        if (U.isMetaParameter(param)) {
          uriParams[param] = params[param];
          delete params[param];
        }
      }
      
      uri = hashParts[0].slice(route.length + 1) + '?' + $.param(uriParams);
    }
    else {
      uri = decodeURIComponent(route.length ? hashParts[0].slice(route.length + 1) : hashParts[0]);        
    }

    if (uri == 'profile') {
      this.special = 'profile';
      uri = G.currentUser._uri; // null if guest
    }

    if (!route)
      route = hash ? 'list' : 'home';
    
    if (route == 'templates') // template is a proxy route, it has another url as part of its url
      subInfo = new UrlInfo(uri);
    
    this.action = U.getRouteAction(route);
    this.route = route;
    this.sub = subInfo;
    if (uri)
      this.uri = uri.indexOf('/') == -1 ? uri : U.getLongUri1(uri);
    
    this.type = type;
    this.query = query;
    this.params = params;
    this.fragment = hash;
  };
  
  for (var p in U.systemProps) {
    var prop = U.systemProps[p];
    prop.shortName = p;
  }
  
  var patterns = U.uriPatternMap = [{
    // id=32001
    regex: /^[^\/\\\?]+\=/,
    onMatch: function(uri, matches, vocModel) {
      return U.makeUri(vocModel.type, matches.input);
    }
  }, 
  {
    // Tree/32000
    regex: /^[A-Z]+([^\?]*)$/,
    onMatch: function(uri, matches, vocModel) {
      if (!vocModel)
        throw new Error("Not enough information to create long uri");
      
      var parts = uri.split('/');
      var type = vocModel.type;
      var primaryKeys = U.getPrimaryKeys(vocModel);
      if (primaryKeys.length !== parts.length - 1)
        throw new Error("Incorrect number of primary keys in short uri: " + uri);
      
      var params = {};
      for (var i = 0; i < primaryKeys.length; i++) {
        params[primaryKeys[i]] = parts[i+1];
      }
      
      return U.makeUri(type, params);
    }
  },
  {
    // Tree?id=32000
    regex: /^[A-Z]+\?.*$/,
    onMatch: function(uri, matches, vocModel) {
      if (!vocModel)
        throw new Error("Not enough information to create long uri");
      
      return U.makeUri(type, uri.slice(uri.indexOf("?") + 1));
    }
  }, 
  {
    // wf/.... attachment url
    regex: /^wf\//,
    onMatch:  function(uri, matches, vocModel) {
      return G.serverNameHttp + '/' + uri;
    }
  },
  {
    // sql/...?...
    regex: /^sql\/.*/,
    onMatch: function(uri, matches, vocModel) {
      return G.serverNameHttp + '/' + uri;
    }
  },
  {
    // http://.../voc/... with query string or without
    regex: /^(http:\/\/)?(.*)\.com\/voc\/([^\?]+)\??(.*)/,
    onMatch: function(uri, matches, vocModel) {
      var sqlIdx = matches[2].indexOf(G.sqlUri);
      if (sqlIdx === -1) { // sth like http://www.hudsonfog.com/voc/commerce/urbien....
        if (matches[4]) // has query string
          return G.sqlUrl + '/' + (matches[1] ? uri.slice(7) : uri);
        else
          return uri;
      }
      else { // has sql
        return uri;
      }
    }
  },
  {  // commerce/urbien/Tree?...
    regex: /^([a-z]+[^\?]+)\??(.*)/,
    onMatch: function(uri, matches, vocModel) {
      if (matches[2])
        return G.sqlUrl + '/www.hudsonfog.com/voc/' + uri;
      else
        return G.defaultVocPath + uri;
    }
  }];
  
  U.invalid = {};
  (function() {
    var common = 'Please enter a';
    var i = U.invalid;
    i['int'] = common + 'n integer';
    i['float'] = i['double'] = common + ' number';
  })();

  if (window.URL)
    G._blankImgSrc = window.URL.createObjectURL(U.dataURLToBlob(G._blankImgSrc));

  return (Lablz.U = U);
});
