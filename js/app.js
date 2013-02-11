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
  Backbone.View.prototype.close = function() {
    this.remove();
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

  var App = {
    TAG: 'App',
    initialize: function() {
      var error = function(e) {
        G.log('init', 'error', "failed to init app, not starting");
        throw new Error('failed to load app');
      };
      
      Templates.loadTemplates();
      _.each(G.modelsMetadata, function(m) {m.type = U.getLongUri(m.type)});
      _.each(G.linkedModelsMetadata, function(m) {m.type = U.getLongUri(m.type)});
      App.setupWorkers();
      Voc.checkUser();
      Voc.loadStoredModels();
      if (!Voc.changedModels.length) {// && !Voc.newModels.length) {
        RM.restartDB().always(this.startApp);
        return;
      }

      this.prepModels();
    },
    
    prepModels: function() {
      var self = this;
      var error = function(info) {
//        debugger;
        if (info.status === 0) {
          if (G.online)
            self.prepModels(); // keep trying
          else {
//            window.location.hash = '';
//            window.location.reload();
            Errors.offline();
          }
        }
        else if (info.error) {
          throw new Error('failed to load app: ' + info.error.details);            
        }
        else {
          throw new Error('failed to load app');
        }
      };
      
      Voc.fetchModels(null, {
        success: function() {
          if (RM.db)
            self.startApp();
          else
            RM.restartDB().always(App.startApp);
        },
        error: error,
        sync: true
      });
    },
    
    startApp: function() {
      if (App.started)
        return;
      
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
    },
    
    setupLoginLogout: function() {
      Events.on('req-login', function(options) {
        options = _.extend({online: 'Login through a Social Net', offline: 'You are currently offline, please get online and try again'}, options);
        if (!G.online) {
          Errors.offline();
          return;
        }
        
        var here = window.location.href;
        _.each(G.socialNets, function(net) {
          var state = U.getQueryString({socialNet: net.socialNet, returnUri: here, actionType: 'Login'}, {sort: true}); // sorted alphabetically
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
          net.url = net.authEndpoint + '?' + U.getQueryString(params, {sort: true}); // sorted alphabetically
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
    
//    setupModuleCache: function() {
//      G.require = function(modules, callback, context) {
//        modules = $.isArray(modules) ? modules : [modules];
//        for (var i = 0; i < modules.length; i++) {
//          var m = modules[i];
//          if (!G.modCache[m]) {
//            G.modCache[m] = $.Deferred(function(defer) {
//              require([m], function(mod) {
//                defer.resolve(mod);
//              });
//            }).promise();
//          }
//          
//          modules[i] = G.modCache[m];
//        }
//        
//        return $.when.apply(null, modules).then(function() {
//          callback.apply(context, arguments);
//        }).promise();
//      }
//    }
    setupModuleCache: function() {
      G.require = function(modules, callback, context) {
        modules = $.isArray(modules) ? modules : [modules];
        var mods = [], newModNames = [];
        for (var i = 0; i < modules.length; i++) {
          var m = modules[i];
          if (!G.modCache[m]) {
            G.modCache[m] = $.Deferred();
            newModNames.push(m);
          }
          
          mods.push(G.modCache[m]);
        }
        
        if (newModNames.length) {
          require(newModNames, function() {
            for (var i = 0; i < newModNames.length; i++) {
              G.modCache[newModNames[i]].resolve(arguments[i]);
            }          
          });
        }
        
        return $.when.apply(null, mods).then(function() {
          callback.apply(context, arguments);
        }).promise();
      }
    },
    
    setupWorkers: function() {
      var hasWebWorkers = G.hasWebWorkers;
      G.ajax = function(options) {
        var opts = _.clone(options);
        var useWorker = hasWebWorkers && !opts.sync;
        return new $.Deferred(function(defer) {
          if (useWorker) {
            G.log(App.TAG, 'xhr', 'webworker', opts.url);
            var xhrWorker = G.getXhrWorker();          
            xhrWorker.onmessage = function(event) {
              var xhr = event.data;
              if (xhr.status === 304) {
                debugger;
                defer.reject(xhr, "unmodified");
              }
              else
                defer.resolve(xhr.data, xhr.status, xhr);
            };
            
            xhrWorker.onerror = function(err) {
              debugger;
              defer.reject({}, "error", err);
            };
            
            xhrWorker.postMessage(_.pick(opts, ['type', 'url', 'data', 'method']));
          }
          else {
            G.log(App.TAG, 'xhr', '$.ajax', opts.url);
            $.ajax(_.pick(opts, ['timeout', 'method', 'url', 'headers', 'data'])).then(function(data, status, jqXHR) {
//              debugger;
              if (status != 'success') {
                defer.reject(jqXHR, status, opts);
                return;
              }
              
              if (data.error) {
                debugger;
                defer.reject(jqXHR, data.error, opts);
              }
              else
                defer.resolve(data, status, jqXHR);
            }, 
            function(jqXHR, status, err) {
              debugger;
              defer.reject(jqXHR, {code: jqXHR.status, details: err}, opts);
            });
          }
        }).promise();
      }
    }
  };
  
  return App;
});