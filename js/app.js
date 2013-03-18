//'use strict';
define('app', [
  'globals',
  'backbone',
  'fileCache!jqueryMobile',
  'templates', 
  'utils', 
  'events',
  'error',
  'cache',
  'vocManager',
  'resourceManager',
  'router'
], function(G, Backbone, jqm, Templates, U, Events, Errors, C, Voc, RM, Router) {
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
        App.setupWorkers();
        App.setupCleaner();
        G.checkVersion();
        Templates.loadTemplates();
        extendMetadataKeys();
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
        
        Events.on("event", function() {
          console.log("event");
        });

        Events.on("event:a", function() {
          console.log("event:a");
        });

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
      for (var type in C.typeToModel) {
        Voc.initPlugs(type);
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

        var returnUri = options.returnUri || window.location.href;
        var signupUrl = "{0}/social/socialsignup".format(G.serverName);
        if (returnUri.startsWith(signupUrl)) {
          debugger;
          G.log(App.TAG, 'error', 'avoiding redirect loop and scrapping returnUri -- 1');
          returnUri = G.pageRoot;
        }
        
        _.each(G.socialNets, function(net) {
          var state = U.getQueryString({socialNet: net.socialNet, returnUri: returnUri, actionType: 'Login'}, {sort: true}); // sorted alphabetically
          var params = net.oAuthVersion == 1 ?
            {
              episode: 1, 
              socialNet: net.socialNet,
              actionType: 'Login'
            }
            : 
            {
              scope: net.settings,
              display: 'touch', // 'page', 
              state: state, 
              redirect_uri: G.serverName + '/social/socialsignup', 
              response_type: 'code', 
              client_id: net.appId || net.appKey
            };
            
          net.icon = net.icon || G.serverName + '/icons/' + net.socialNet.toLowerCase() + '-mid.png';
          net.url = net.authEndpointMobile + '?' + U.getQueryString(params, {sort: true}); // sorted alphabetically
        });
        
        var onDismiss = options.onDismiss;
        $('#login_popup').remove();
        var popupHtml = U.template('loginPopupTemplate')({nets: G.socialNets, msg: options.online, dismissible: !onDismiss});
        $(document.body).append(popupHtml);
        var $popup = $('#login_popup');
        if (onDismiss)
          $popup.find('[data-cancel]').click(function() {
            onDismiss();
          });
        
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
   
    setupCleaner: function() {
      G.checkVersion = function(data) {
        var init = data === true;
        var newV = data ? data.VERSION : G.getVersion();
        var oldV = G.getVersion(!data) || newV; // get old
        if (newV.All > oldV.All) {
          G.setVersion(newV);
          for (var key in newV) {
            Events.trigger('VERSION:' + key, init);
          }
          
          return;
        }
        
        for (var key in newV) {
          var setVersion = false;
          if (newV[key] > oldV[key]) {
            if (!setVersion) {
              G.setVersion(newV);
              setVersion = true;
            }
            
            Events.trigger('VERSION:' + key, init);              
          }
        }
      };

      _.each(['.js', '.css', '.jsp'], function(ext) {
        Events.on("VERSION" + ext.toUpperCase(), function() {
          var keys = _.keys(localStorage);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.endsWith(ext))
              G.localStorage.del(key);
          }
        });
      });
    },
    
    setupModuleCache: function() {
//      var originalRequire = window.require;
//      window.require = function(modules, callback, context) {
    },
    
    setupWorkers: function() {
      Backbone.ajax = U.ajax;
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