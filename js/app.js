//'use strict';
define('app', [
  'globals',
  'backbone',
//  'fileCache!jqueryMobile',
  'jqueryMobile',
  'templates', 
  'utils', 
  'events',
  'error',
  'cache',
  'vocManager',
  'resourceManager',
  'router',
  'collections/ResourceList',
  'lib/push'
], function(G, Backbone, jqm, Templates, U, Events, Errors, C, Voc, RM, Router, ResourceList) {
  Backbone.emulateHTTP = true;
  Backbone.emulateJSON = true;
  
  Backbone.View.prototype.close = function() {
    this.$el.detach();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
  
  // provide a promise-based interface to the SimplePush API
  var SimplePush = {}, endpointType = 'model/social/SimplePushNotificationEndpoint';
  _.each(['register', 'unregister', 'registrations'], function(method) {
    SimplePush[method] = function() {
      var args = arguments;
      return $.Deferred(function(defer) {
        var req = navigator.push[method];
        req.onsuccess = function(e) {
          defer.resolve(e.target.result);
        };
        
        req.onerror = function() {
          defer.reject.apply(defer, arguments);
        };
      }).promise();
    }
  });
  
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
          Events.trigger('appStart');
          self.doPostStartTasks();
        });
      });
    },

    doPreStartTasks: function() {
      return $.Deferred(function(defer) {        
        var modelsDfd = $.Deferred(),
            dbDfd = $.Deferred(),
            grabDfd = $.Deferred();

        var startDB = function() {
          if (RM.db)
            dbDfd.resolve();
          else
            RM.restartDB().always(dbDfd.resolve);
        };
        
        var loadModels = function() {
          Voc.getModels().done(function() {
            startDB();
            App.initGrabs().done(grabDfd.resolve).fail(grabDfd.reject);
            modelsDfd.resolve();
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
  
        var templatesDfd = $.Deferred();
        var getTemplates = function() {
          var jstType = G.commonTypes.Jst;
          var jstModel = U.getModel(jstType);
          var templatesBl = G.currentApp.templates;
          if (templatesBl && templatesBl.count) {
            var templatesRL = G.appTemplates = new ResourceList(null, {
              model: jstModel,
              params: {
                forResource: G.currentApp._uri
              }
            });
            
            templatesRL.fetch({
              success: function() {
                templatesRL.each(function(template) {
                  Templates.addCustomTemplate(template);
                });
                
                templatesDfd.resolve();
              },
              error: function() {
                templatesDfd.resolve();
              }
            });
          }
          else
            templatesDfd.resolve();
        }; 

        var viewsDfd = $.Deferred();
        var getViews = function() {
          var jsType = G.commonTypes.JS;
          var jsModel = U.getModel(jsType);
          var viewsBl = G.currentApp.views;
          if (viewsBl && viewsBl.count) {
            var viewsRL = G.appViews = new ResourceList(null, {
              model: jsModel,
              params: {
                forResource: G.currentApp._uri
              }
            });
            
            viewsRL.fetch({
              success: function() {
                viewsRL.each(function(view) {
                  debugger;
                });
                
                viewsDfd.resolve();
              },
              error: function() {
                viewsDfd.resolve();
              }
            });
          }
          else
            viewsDfd.resolve();
        }; 

        //// START detect app install for current app /////
        var currentApp = G.currentApp._uri;
        var app = _.filter(G.currentUser.installedApps, function(app) {
          return app._uri === currentApp;
        })[0];
        
        G.currentAppInstall = app && app.install;
        //// END detect app install for current app /////
        
        App.setupWorkers();
        App.setupCleaner();
        loadModels();
        G.checkVersion();
        Templates.loadTemplates();
        extendMetadataKeys();
        App.setupNetworkEvents();
        Voc.checkUser();
        Voc.loadEnums();
        var waitTime = 50;
        dbDfd.done(function() {
          getTemplates();
          getViews();
        });
        
        $.when(viewsDfd, templatesDfd).then(defer.resolve); // the last item on the menu
      }).promise();
    },
    
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
//      for (var type in C.typeToModel) {
//        Voc.initPlugs(type);
//      }
      
      setTimeout(function() { 
        RM.sync();
        App.setUpSimplePush();
      }.bind(this), 100);
    },

    _registerSimplePushChannel: function(channels) {
      channels = _.isArray(channels) ? channels : [channels];
      return $.when.apply($, _.map(channels, App._registerSimplePushChannels));
    },
    
    _unregisterSimplePushEndpoint: function(endpoint) {
      return SimplePush.unregister();
    },

    _registerSimplePushChannels: function(channel) {
      return $.Deferred(function(defer) {        
        var getSPModel = Voc.getModels(spType);
        $.when(SimplePush.register(), getSPModel).done(function(endpoint) {
          var spModel = U.getModel(spType);
          var simplePushAppEndpoint = new spModel({
            endpoint: endpoint,
            channel: channel.channel,
            appInstall: G.currentAppInstall
          });
          
          simplePushAppEndpoint.save(null, {
            success: function() {
              defer.resolve(simplePushAppEndpoint);
            },
            error: function(originalModel, err, opts) {
              debugger;
              var code = err.code || err.status;
              if (code === 409) {
//                  defer.resolve(endpoint);
                simplePushAppEndpoint.fetch({
                  success: function() {
                    defer.resolve(simplePushAppEndpoint);
                  },
                  error: defer.resolve // resolve so we can use $.when
                })
              }
              else
                defer.resolve(); // resolve so we can use $.when
            }
          });
        });
      }).promise();
    },
    
    _subscribeToNotifications: function(endpoints) {
      endpoints = _.isArray(endpoints) ? endpoints : [endpoints];
      navigator.mozSetMessageHandler('push', function(message) {
        var pushEndpoint = message.pushEndpoint;
        var storedEndpoint = _.filter(endpoints, function(e) {
          return e.endpoint === pushEndpoint;
        })[0];
        
        if (!storedEndpoint) {
          debugger; // this shouldn't happen, but i guess we can fetch the endpoint at this junction
          return;
        }
        
        var action = endpoint.get('action');
        if (!action)
          return;
        
        var actionRes = C.getResource(action);
        var gotModel = Voc.getModels(actionType), 
            gotAction = $.Deferred();
        
        gotModel.done(function() {
          if (!actionRes) {
            /// get resource
            var actionModel = U.getModel(actionType);
            actionRes = new actionModel({
              _uri: action
            });
            
            actionRes.fetch({
              success: function() {
                gotAction.resolve(actionRes);
              },
              error: defer.reject
            });
          }
          else
            gotAction.resolve(actionRes);
        });
        
        gotAction.done(function(actionRes) {
          debugger;
          // run action
        });
      });
    },
    
    setUpSimplePush: function() {
      var installedApps = G.currentUser.installedApps,
          currentApp = G.currentApp;
          
      if (!G.hasSimplePush || G.currentUser.guest || installedApps.length || !G.currentAppInstall)
        return;
      
      var channels = G.notificationChannels || [];
      if (!channels.length)
        return;
      
      $.when(
        SimplePush.registrations(), 
        Voc.getModels()
      ).done(function(registrations) {
        var endpointList = new ResourceList(G.currentUser.notificationEndpoints, {
          model: U.getModel(endpointType),
          query: $.param({
            appInstall: appInstall
          })
        });
        
        var toRegister = _.filter(channels, function(channel) {
          return endpointList.where({
            channel: channel
          }).length;
        });
        
        if (toRegister.length) {
          App._registerSimplePushChannels(channels).done(function(endpoints) {
            endpoints = _.compact(endpoints);  // nuke all that failed to load
//            var endpointsList = new ResourceList(endpoints);
            App._subscribeToNotifications(endpointsList);
          });
        }
        
        if (navigator.mozSetMessageHandler)
          navigator.mozSetMessageHandler('push-register', App.setUpSimplePush);
      });
    },
    
    initGrabs: function() {
      return $.Deferred(function(defer) {
        if (G.currentUser.guest)
          return defer.resolve();
        
        G.currentUser.grabbed = new ResourceList(G.currentUser.grabbed, {
          model: U.getModel(G.commonTypes.Grab),
          params: {
            submittedBy: G.currentUser._uri
          }
        });
      }).promise();
    },
    
//    getGrabs: function() {
//      if (G.currentUser.guest)
//        return;
//      
//      var grabType = G.commonTypes.Grab;
//      Voc.getModels(grabType).done(function() {          
//        var grabsRL = G.currentUser.grabbed = new ResourceList(null, {
//          model: U.getModel(grabType),
//          params: {
//            submittedBy: G.currentUser._uri,
//            canceled: false
//          }
//        });
//        
//        grabsRL.fetch({
//          success: function() {
////            debugger;
//          },
//          error: function() {
////            debugger;
//          }
//        });
//      });
//    },
    
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
        
        var onDismiss = options.onDismiss || function() { Events.trigger('back') }; //G.Router._backOrHome;
        $('#login_popup').remove();
        var popupHtml = U.template('loginPopupTemplate')({nets: G.socialNets, msg: options.online, dismissible: false});
        $(document.body).append(popupHtml);
        var $popup = $('#login_popup');
        if (onDismiss) {
          $popup.find('[data-cancel]').click(function() {
            onDismiss();
          });
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
          G.log(App.TAG, 'info', 'nuking', ext, 'from LS');
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