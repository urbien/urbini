//'use strict';
define('app', [
 'globals',
 'backbone',
 'templates', 
 'utils', 
 'events',
 'error',
 'cache',
 'vocManager',
 'resourceManager',
 'router',
 'collections/ResourceList'
 ], function(G, Backbone, Templates, U, Events, Errors, C, Voc, RM, Router, ResourceList) {
//  var Chrome;
  Backbone.emulateHTTP = true;
  Backbone.emulateJSON = true;
  var pushEndpointType = G.commonTypes.PushEndpoint,
      pushChannelType = G.commonTypes.PushChannel;
  
  Backbone.View.prototype.close = function() {
    this.$el.detach();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
  };  
  
  // provide a promise-based interface to the SimplePush API
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
  
        var templatesDfd = $.Deferred(),
            templatesPromise;

        var accountsDfd = $.Deferred(),
            accountsPromise = accountsDfd.promise();

        function getAppAccounts() {
          var consumers = G.currentApp.dataConsumerAccounts || [],
              providers = G.currentApp.dataProviders || [],
              accesses = G.currentApp.dataAccesses || [],
              providerType = "model/social/AppProviderAccount",
              consumerType = "model/social/AppConsumerAccount",
              accessType = "model/social/AppConsumerAccount";
          
          var models = [];
          if (providers.length)
            models.push(providerType);
          if (consumers.length)
            models.push(consumerType);
          if (accesses.length)
            models.push(accessType);
          
          if (!models.length) {
            accountsDfd.resolve();
            return accountsPromise;
          }
          
          Voc.getModels(models).done(function() {
            if (providers.length) {
              G.currentApp.dataProviders = new ResourceList(providers, {
                model: U.getModel(providerType)
              });
            };

            if (consumers.length) {
              G.currentApp.dataConsumerAccounts = new ResourceList(consumers, {
                model: U.getModel(consumerType),
                params: {
                  $in: 'provider,' + _.pluck(providers, '_uri').join(',')
                }
              });
            };

            if (accesses.length) {
              G.currentApp.dataAccesses = new ResourceList(accesses, {
                model: U.getModel(accessType), 
                params: {
                  $not: $param({
                    $in: 'appAccount,' + _.pluck(consumers, '_uri').join(',')
                  })
                }
              });
            }
            
            accountsDfd.resolve();
          });
          
          return accountsPromise;
        };
        
        function getTemplates() {
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

        var viewsDfd = $.Deferred(),
            viewsPromise = viewsDfd.promise();
            
        function getViews() {
          var jsType = G.commonTypes.JS,
              jsModel = U.getModel(jsType),
              viewsBl = G.currentApp.views;
          
          if (viewsBl && viewsBl.count) {
            var viewsRL = G.views = new ResourceList(null, {
              model: jsModel,
              params: {
                forResource: G.currentApp._uri
              }
            });
            
            viewsRL.fetch({
              success: function() {
                viewsRL.each(function(view) {
                  debugger;
//                  switch(view.moduleType) {
//                    case 'View':
//                      break;
//                    case 'Adapter':
//                      break;
//                  }
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
        getAppAccounts().always(loadModels);
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
        
        $.when(viewsPromise, templatesPromise).then(defer.resolve); // the last item on the menu
      }).promise();
    },
    
    startApp: function() {
      return $.Deferred(function(dfd) {        
        if (App.started)
          return dfd.resolve();
        
        App.setupModuleCache();
        App.setupLoginLogout();
        App.setupRTCCallMonitor();
        
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
        App.setupPushNotifications();
//        if (G.inWebview) {
//          App.replaceGetUserMedia();
//          Events.on('messageToApp', function(msg) {
//            App.sendMessageToApp(msg);
//          });
//        }
      }.bind(this), 100);
    },
    
//    replaceGetUserMedia: function() {
//      navigator.getUserMedia = function(options, success, error) {
//        Events.once('messageFromApp:getUserMedia:success', function(e) {
//          success(e.blobURL);
//        });
//        
//        Events.once('messageFromApp:getUserMedia:error', function(e) {
//          error(e.error);
//        });
//
//        Events.trigger('messageToApp', {
//          type: 'getUserMedia',
//          id: G.nextId(),
//          mediaConstraints: options  
//        });
//      };
//    },
//
//    _registerSimplePushChannels: function(channels) {
//      channels = _.isArray(channels) ? channels : [channels];
//      return $.when.apply($, _.map(channels, App._registerSimplePushChannels));
//    },
//    
//    _unregisterPushEndpoint: function(endpoint) {
//      return SimplePush.unregister();
//    },

    _registerPushEndpoint: function(endpoint, channel) {
      var props = {
        endpoint: endpoint,
        channelName: channel,
        appInstall: G.currentAppInstall,
        browser: G.browser.name.capitalizeFirst()
      };
      
      return $.Deferred(function(defer) {        
        var spModel = U.getModel(pushEndpointType), 
            pushEndpoint = new spModel(props);
        
        pushEndpoint.save(null, {
          success: function() {
            defer.resolve(pushEndpoint);
          },
          error: function(originalModel, err, opts) {
            debugger;
          }
        });
      }).promise();
    },
    
//    _subscribeToNotifications: function(endpoints) {
//      endpoints = _.isArray(endpoints) ? endpoints : [endpoints];
//      SimplePush.onMessage(function(message) {
//        var pushEndpoint = message.pushEndpoint;
//        var storedEndpoint = _.filter(endpoints, function(e) {
//          return e.endpoint === pushEndpoint;
//        })[0];
//        
//        if (!storedEndpoint) {
//          debugger; // this shouldn't happen, but i guess we can fetch the endpoint at this junction
//          return;
//        }
//        
//        var action = endpoint.get('action');
//        if (!action)
//          return;
//        
//        var actionRes = C.getResource(action);
//        var gotModel = Voc.getModels(actionType), 
//            gotAction = $.Deferred();
//        
//        gotModel.done(function() {
//          if (!actionRes) {
//            /// get resource
//            var actionModel = U.getModel(actionType);
//            actionRes = new actionModel({
//              _uri: action
//            });
//            
//            actionRes.fetch({
//              success: function() {
//                gotAction.resolve(actionRes);
//              },
//              error: defer.reject
//            });
//          }
//          else
//            gotAction.resolve(actionRes);
//        });
//        
//        gotAction.done(function(actionRes) {
//          debugger;
//          // run action
//        });
//      });
//    },

    setupPushNotifications: function() {
      if (G.currentUser.guest)
        return;
      
      if (!G.currentAppInstall) { // TODO: should really check if resource has _allow == true
        Events.on('appInstall', function(appInstall) {
          if (appInstall.get('allow'))
            App.setupPushNotifications();
        });
        
        return;
      }
      
      Events.on('newPushEndpoint', this._registerPushEndpoint);
      var req = G.inWebview ? 'chrome' : G.inFirefoxOS ? 'firefox' : null;
      if (!req)
        return;
      
      $.when(U.require(req), Voc.getModels(pushEndpointType)).done(function(browserMod) {
        console.log('SETTING UP PUSH NOTIFICATIONS');
        browserMod._setup();
        Events.on('messageFromApp:reload', function() {
          window.location.reload();
        });
        
        Events.on('messageFromApp:back', function() {
          window.history.back();
        });
        
        Events.on('messageFromApp:forward', function() {
          window.history.forward();
        });

        Events.on('messageFromApp:home', function() {
          window.location.href = window.location.href.split('#')[0];
        });

        Events.on('messageFromApp:navigate', function(url) {
          window.location.href = url;
        });

//        browserMod.onpush(function() {
//          
//        });
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
        options = _.extend({online: 'Login via a Social Net', offline: 'You are currently offline, please get online and try again'}, options);
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
        debugger;
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
    
    setupMisc: function() {
      Events.on('location', function(position) {
        var prev = G.currentUser.location;
        if (prev)
          G.currentUser.previousLocation = prev;
        
        G.currentUser.location = position;        
      });
    },
    
    setupRTCCallMonitor: function() {
      G.callInProgress = null;
      Events.on('newRTCCall', function(rtcCall) {
        if (G.callInProgress)
          Events.trigger('endRTCCall', G.callInProgress);
        
        G.callInProgress = rtcCall;
      });

      Events.on('updateRTCCall', function(id, update) {
        var call = G.callInProgress;
        if (call && call.id == id)
          _.extend(call, update);
      });

      Events.on('endRTCCall', function(rtcCall) {
        if (G.callInProgress == rtcCall)
          G.callInProgress = null;
      });
      
      Events.on('localVideoMonitor:on', function(stream) {
        G.localVideoMonitor = stream;
      });
      
      Events.on('localVideoMonitor:off', function() {
        G.localVideoMonitor = null;
      });
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