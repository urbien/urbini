//'use strict';
define('app', [
  'globals',
  'backbone',
  'cache!jqueryMobile',
  'templates', 
  'utils', 
  'events',
  'error',
  'vocManager',
  'resourceManager',
  'router'
], function(G, Backbone, jqm, Templates, U, Events, Errors, Voc, RM, Router) {
  Backbone.emulateHTTP = true;
  Backbone.emulateJSON = true;
//  _.extend(Backbone.History.prototype, {
//
//    // react to a back/forward button, or an href click.  a "soft" route
//   checkUrl: function(e) {
//      var current = this.getFragment();
//      if (current == this.fragment && this.iframe)
//          current = this.getFragment(this.getHash(this.iframe));
//      if (current == this.fragment) return false;
//      if (this.iframe) this.navigate(current);
//      // CHANGE: tell loadUrl this is a soft route
//      this.loadUrl(undefined, true) || this.loadUrl(this.getHash(), true);
//    },
//
//    // this is called in the whether a soft route or a hard Router.navigate call
//    loadUrl: function(fragmentOverride, soft) {
//      var fragment = this.fragment = this.getFragment(fragmentOverride);
//      var matched = _.any(this.handlers, function(handler) {
//        if (handler.route.test(fragment)) {
//          // CHANGE: tell Router if this was a soft route
//          handler.callback(fragment, soft);
//          return true;
//        }
//      });
//      return matched;
//    }
//  });
  
  Backbone.View.prototype.close = function() {
    this.$el.detach();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
  
  /* Backbone.validateAll.js - v0.1.0 - 2012-08-29
  * http://www.gregfranko.com/Backbone.validateAll.js/
  * Copyright (c) 2012 Greg Franko; Licensed MIT */
  Backbone.Model.prototype._validate = function(attrs, options) {
    options = options || {};
    if (options.silent || options.skipValidation || !this.validate) {
      return true;
    }
    
    if (options.validateAll !== false) {
      attrs = _.extend({}, this.attributes, attrs);
    }
    
    var error = this.validate(attrs, options);
    if (!error) {
      if (options.validated)
        options.validated(this, options);
      
      return true;
    }
    if (options && options.error) {
      options.error(this, error, options);
    } else {
      this.trigger('error', this, error, options);
    }
    
    return false;
  };

  function extendMetadataKeys() {
    var extended = {};
    var metadata = G.modelsMetadata;
    if (metadata) {
      for (var type in metadata) {
        extended[U.getLongUri1(type)] = metadata[type];
      }
      
      G.modelsMetadata = extended;
    }
    else
      G.modelsMetadata = {};
    
    metadata = G.linkedModelsMetadata;
    if (metadata) {
      extended = {};
      for (var type in metadata) {
        extended[U.getLongUri1(type)] = metadata[type];
      }
    
      G.linkedModelsMetadata = extended;
    }
    else
      G.linkedModelsMetadata = {};
  }
  
  var App = {
    TAG: 'App',
    initialize: function() {
//      var error = function(e) {
//        G.log('init', 'error', "failed to init app, not starting");
//        throw new Error('failed to load app');
//      };
      
      
      var self = this;
      self.doPreStartTasks().always(function() {
        self.startApp().always(function() {
          self.doPostStartTasks();
        });
      });
//      Voc.loadStoredModels();
//      if (!Voc.changedModels.length) {// && !Voc.newModels.length) {
//        RM.restartDB().always(App.startApp);
//        return;
//      }
//
//      this.prepModels();
    },

    doPreStartTasks: function() {
      return $.Deferred(function(defer) {
        Templates.loadTemplates();
        extendMetadataKeys();
        App.setupWorkers();
        App.setupNetworkEvents();
        Voc.checkUser();
        Voc.loadEnums();
        var waitTime = 50;
        var loadModels = function() {
          Voc.getModels().done(function() {
            if (RM.db)
              defer.resolve();
            else
              RM.restartDB().always(defer.resolve);
          }).fail(function()  {
            if (G.online) {
              Errors.timeout();
              setTimeout(function() {
                loadModels();
                waitTime *= 2;
              }, waitTime);
            }
            else {
              Errors.offline();
              Events.on('online', loadModels);
            }
          });          
        };
        
        loadModels();
      }).promise();
    },
    
//    prepModels: function() {
//      var self = this;
//      var error = function(xhr, err, options) {
////        debugger;
//        if (!G.online) {
//          Errors.offline();
//        }
//        else if (xhr) {
//          if (xhr.status === 0) {
//            if (G.online)
//              self.prepModels(); // keep trying
//            else {
//  //            window.location.hash = '';
//  //            window.location.reload();
//              Errors.offline();
//            }
//          }
//        }
//        else if (err) {
//          throw new Error('failed to load app: ' + JSON.stringify(err));            
//        }
//        else {
//          throw new Error('failed to load app');
//        }
//      };
//      
//      Voc.getModels(null, {sync: true}).done(function() {
//        if (RM.db)
//          self.startApp();
//        else
//          RM.restartDB().always(App.startApp);
//      }).fail(error);
//    },
    
    startApp: function() {
      return $.Deferred(function(dfd) {        
        if (App.started)
          return dfd.resolve();
        
        App.setupModuleCache();
        App.setupLoginLogout();
        
        G.app = App;
        App.started = true;
        if (window.location.hash == '#_=_') {
  //        debugger;
          G.log(App.TAG, "info", "hash stripped");
          window.location.hash = '';
        }
        
        G.Router = new Router();
        Backbone.history.start();
        dfd.resolve();
//        setTimeout(RM.sync, 1000);
      }).promise();
    },
    
    doPostStartTasks: function() {
      for (var type in G.typeToModel) {
        Voc.initCustomHandlers(type);
      }
      
      RM.sync();
    },
    
    setupLoginLogout: function() {
      Events.on('req-login', function(options) {
        options = _.extend({online: 'Login through a Social Net', offline: 'You are currently offline, please get online and try again'}, options);
        if (!G.online) {
          Errors.offline();
          return;
        }

        _.each(G.socialNets, function(net) {
          var state = U.getQueryString({socialNet: net.socialNet, returnUri: options.returnUri || window.location.href, actionType: 'Login'}, {sort: true}); // sorted alphabetically
          var params = net.oAuthVersion == 1 ?
            {
              episode: 1, 
              socialNet: net.socialNet,
              actionType: 'Login'
            }
            : 
            {
              scope: net.settings,
              display: 'page', 
              state: state, 
              redirect_uri: G.serverName + '/social/socialsignup', 
              response_type: 'code', 
              client_id: net.appId || net.appKey
            };
            
          net.icon = net.icon || G.serverName + '/icons/' + net.socialNet.toLowerCase() + '-mid.png';
          net.url = net.authEndpointMobile + '?' + U.getQueryString(params, {sort: true}); // sorted alphabetically
        });
        
        var popupTemplate = _.template(Templates.get('loginPopupTemplate'));
        var $popup = $('.ui-page-active #login_popup');
        var html = popupTemplate({nets: G.socialNets, msg: options.online});
        if ($popup.length == 0) {
          $(document.body).append(html);
          $popup = $('#login_popup');
        }
          
        $popup.trigger('create');
        $popup.popup().popup("open");
        return false; // prevents login button highlighting
      });
      
      var defaults = {returnUri: ''}; //encodeURIComponent(G.serverName + '/' + G.pageRoot)};
      Events.on('logout', function(options) {
        options = _.extend({}, defaults, options);
        var url = G.serverName + '/j_security_check?j_signout=true';
        $.get(url, function() {
            // may be current page is not public so go to home page (?)
          window.location.hash = options.returnUri;
          window.location.reload();
        });        
      });
    },
    
    setupModuleCache: function() {
      G.require = function(modules, callback, context) {
        modules = $.isArray(modules) ? modules : [modules];
        var mods = [], newModNames = [], newModFullNames = [];
        for (var i = 0; i < modules.length; i++) {
          var fullName = modules[i], name = fullName;
          var moduleViaPlugin = fullName.match(/\!(.*)$/);
          if (moduleViaPlugin) {
            name = moduleViaPlugin[1]; 
          }
          
          var mod = G.modCache[name];
          if (!mod) {
            mod = G.modCache[name] = $.Deferred();
            newModFullNames.push(fullName);
            newModNames.push(name);
          }
          
          mods.push(mod);
        }
        
        if (newModNames.length) {
          G.loadBundle(newModNames, function() {
            require(newModFullNames, function() {
              for (var i = 0; i < newModNames.length; i++) {
                G.modCache[newModNames[i]].resolve(arguments[i]);
              }          
            });
          });
        }
        
        return $.when.apply(null, mods).then(function() {
          callback.apply(context, arguments);
        }).promise();
      }
    },
    
    setupWorkers: function() {
      var hasWebWorkers = G.hasWebWorkers;
      Backbone.ajax = G.ajax = function(options) {
        var opts = _.clone(options);
        opts.type = opts.method || opts.type;
        opts.dataType = opts.dataType || 'JSON';
        var useWorker = hasWebWorkers && !opts.sync;
        return new $.Deferred(function(defer) {
          if (opts.success) defer.done(opts.success);
          if (opts.error) defer.fail(opts.error);
          if (useWorker) {
            G.log(App.TAG, 'xhr', 'webworker', opts.url);
            var xhrWorker = G.getXhrWorker();          
            xhrWorker.onmessage = function(event) {
              var xhr = event.data;
              if (xhr.status === 304) {
//                debugger;
                defer.reject(xhr, "unmodified", "unmodified");
              }
              else
                defer.resolve(xhr.data, xhr.status, xhr);
            };
            
            xhrWorker.onerror = function(err) {
//              debugger;
              defer.reject({}, "error", err);
            };
            
            defer.always(function() {
              G.recycleWebWorker(xhrWorker);
            });

            xhrWorker.postMessage(_.pick(opts, ['type', 'url', 'data', 'dataType', 'headers']));
          }
          else {
            G.log(App.TAG, 'xhr', '$.ajax', opts.url);
            $.ajax(_.pick(opts, ['timeout', 'type', 'url', 'headers', 'data', 'dataType'])).then(function(data, status, jqXHR) {
//              debugger;
              if (status != 'success') {
                defer.reject(jqXHR, status, opts);
                return;
              }
              
              if (jqXHR.status === 200) {
                defer.resolve(data, status, jqXHR);
                return;
              }
              
              if (data && data.error) {
                defer.reject(jqXHR, data.error, opts);
                return;
              }
              
              defer.reject(jqXHR, {code: jqXHR.code}, opts);                  
            }, 
            function(jqXHR, status, err) {
//              debugger;
              var text = jqXHR.responseText;
              var error;
              try {
                error = JSON.parse(text).error;
              } catch (err) {
                error = {code: jqXHR.status, details: err};
              }
              
              defer.reject(jqXHR, error, opts);
            });
          }
        }).promise();
      }
    },
    
    setupNetworkEvents: function() {
      G.connectionListeners = [];
      var fn = G.setOnline;
      G.setOnline = function(online) {
        fn.apply(this, arguments);
        Events.trigger(online ? 'online' : 'offline');
      };      
    }
  };
  
  return App;
});