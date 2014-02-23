//'use strict';
define('app', [
 'globals',
 'underscore',
 'backbone',
 'backboneMixins',
 'templates', 
 'utils', 
 'events',
 'error',
 'cache',
 'modelLoader',
 'vocManager',
 'resourceManager',
 'collections/ResourceList',
 'physicsBridge'
 ], function(G, _, Backbone, __bbMxns__, Templates, U, Events, Errors, C, ModelLoader, Voc, ResourceManager, ResourceList, Physics) {
//  var Chrome;
  var Router;
  Backbone.emulateHTTP = true;
  Backbone.emulateJSON = true;
  var pushEndpointType = G.commonTypes.PushEndpoint,
      pushChannelType = G.commonTypes.PushChannel,
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise();
//  ,
//      modelsNeededImmediately = [];
  
  Backbone.View.prototype.close = function() {
    this.$el.detach();
    this.unbind();
    if (this.onClose){
      this.onClose();
    }
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
  
  function loadCurrentModel(dfd, waitTime) {
    var self = this,
        currentType = U.getModelType(),
        waitTime = waitTime || 50,
        promise;
    
    if (!currentType)
      return RESOLVED_PROMISE;
    
    dfd = dfd || $.Deferred();
    promise = dfd.promise();

    Voc.getModels(currentType).then(dfd.resolve, function()  {
      if (G.online) {
        Errors.timeout();
        setTimeout(function() {
          loadCurrentModel(dfd, waitTime * 2);
        }, waitTime);
      }
      else {
        Errors.offline();
        Events.once('online', loadCurrentModel.bind(null, dfd));
      }
    }); 
    
    return promise;
  } 

//  function buildLocalizationContext() {
//    G.localizationContext = {
//      user: G.currentUser,
//      app: G.currentApp
//    };
//  };
  
  function getAppAccounts() {
    var currentApp = G.currentApp,
        consumers = currentApp.dataConsumerAccounts || [],
        providers = currentApp.dataProviders || [],
        accesses = currentApp.dataAccesses || [],
        providerType = "model/social/AppProviderAccount",
        consumerType = "model/social/AppConsumerAccount",
        accessType = "model/social/AppDataShareAccess1",
        models = [];
    
    if (providers.length)
      models.push(providerType);
    if (consumers.length)
      models.push(consumerType);
    if (accesses.length)
      models.push(accessType);
    
    if (!models.length)
      return RESOLVED_PROMISE;
    
//    var needed = _.union(models, modelsNeededImmediately);
    return Voc.getModels(models).then(function() {
      if (providers.length) {
        currentApp.dataProviders = new ResourceList(providers, {
          model: U.getModel(providerType)
        });
      }

      if (consumers.length) {
        currentApp.dataConsumerAccounts = new ResourceList(consumers, {
          model: U.getModel(consumerType),
          params: {
            $in: 'provider,' + _.pluck(providers, '_uri').join(',')
          }
        });
      }

      if (accesses.length) {
        currentApp.dataAccesses = new ResourceList(accesses, {
          model: U.getModel(accessType), 
          params: {
            $not: $param({
              $in: 'appAccount,' + _.pluck(consumers, '_uri').join(',')
            })
          }
        });
      }
    });
  }

  function getTemplates() {
    var currentApp = G.currentApp,
        jstType = G.commonTypes.Jst,
        jstModel = U.getModel(jstType),
        templatesBl = currentApp.templates,
        templatesRL;
    
    if (!templatesBl || !templatesBl.count)
      return RESOLVED_PROMISE;
      
    templatesRL = G.appTemplates = new ResourceList(null, {
      model: jstModel,
      params: {
        forResource: currentApp._uri
      }
    });
    
    return $.Deferred(function(defer) {      
      templatesRL.fetch({
        params: {
          $select: '$all'
        },
        success: function() {
          templatesRL.each(function(template) {
            Templates.addCustomTemplate(template);
          });
          
          defer.resolve();
        },
        error: defer.resolve
      });
    }).promise();
  } 

  function getViews() {
    var jsType = G.commonTypes.JS,
        jsModel = U.getModel(jsType),
        viewsBl = G.currentApp.views,
        viewsRL;
    
    if (!viewsBl || !viewsBl.count)
      return RESOLVED_PROMISE;
    
    viewsRL = G.views = new ResourceList(null, {
      model: jsModel,
      params: {
        forResource: G.currentApp._uri
      }
    });

    return $.Deferred(function(defer) {      
      viewsRL.fetch({
        params: {
          $select: '$all'
        },
        success: function() {
          viewsRL.each(function(view) {
            debugger;
  //            switch(view.moduleType) {
  //              case 'View':
  //                break;
  //              case 'Adapter':
  //                break;
  //            }
          });
          
          defer.resolve();
        },
        error: defer.resolve
      });
    }).promise(); 
  }
  
  function initGrabs() {
    if (G.currentUser.guest)
      return RESOLVED_PROMISE;
      
    return Voc.getModels(G.commonTypes.Grab, {debounce: 3000}).then(function() {
      G.currentUser.grabbed = new ResourceList(G.currentUser.grabbed, {
        model: U.getModel(G.commonTypes.Grab),
        params: {
          submittedBy: G.currentUser._uri
        }
      });
    });
  }
  
  function setupPackagedApp() {
    if (navigator.mozApps) {
      var dfd = $.Deferred(),
          promise = G.firefoxAppInstalled = dfd.promise(),
          check = navigator.mozApps.checkInstalled(G.firefoxManifestPath);
      
      check.onsuccess = function() {
        if (check.result)
          Events.trigger('firefoxAppInstalled', check.result);
      };
      
      Events.once('firefoxAppInstalled', dfd.resolve.bind(dfd));
    }
  }
  
  function setupPushNotifications() {
    if (G.currentUser.guest)
      return;
    
    if (!G.currentAppInstall) { // TODO: should really check if resource has _allow == true
      Events.on('appInstall', function(appInstall) {
        if (appInstall.get('allow'))
          setupPushNotifications();
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

//      browserMod.onpush(function() {
//        
//      });
    });
  }

//  function setupAvailibilityMonitor(dont) {
//    function run(fn, context) {
//      if (context)
//        fn.call(context);
//      else
//        fn();
//    }
//    
//    if (dont) {
//      // run everything right away
//      G.whenNotRendering = run;
//      return;
//    }
//    
//    var dfd, promise;
//    
//    function reset() {
//      var oldDfd = dfd,
//          oldPromise = promise;
//      
//      dfd = $.Deferred();
//      promise = dfd.promise();
//      
//      if (oldDfd)
//        Events.off('pageChange', oldDfd.resolve);
//      
//      Events.once('pageChange', dfd.resolve);
//      if (oldPromise && oldPromise.state() === 'pending')
//        promise.then(oldDfd.resolve);
//
//    }
//    
//    reset();
//    Events.on('changingPage', reset);
//    G.whenNotRendering = function(fn, context) {
//      return promise.then(run.bind(null, fn, context));
//    };
//  }
  
  function hashToResourceOrList(hash) {
    var hashInfo = U.getUrlInfo(hash),
        type = hashInfo.getType(),
        uri = hashInfo.getUri();
      
    if (!type)
      return G.getRejectedPromise();
      
    return Voc.getModels(type, {debounce: 3000}).then(function(model) {
      var data;
      switch (hashInfo.route) {
        case "chooser": 
        case "list":
          data = new ResourceList(null, {
            model: model, 
            params: hashInfo.getParams()
          });
          
          if (data.isBroken()) // for example, the user needs to be logged in for this list to be fetchable
            data = null;
          
          break;
        case "view":
        case "edit":
        case "chat": 
        case "chatPrivate": 
        case "chatLobby":
          if (uri) {
            data = new model({
              _uri: uri
            });
          }
          
          break;          
      }
      
      return data ? data : G.getRejectedPromise();
    });
  }
  
  function prefetchResources() {
    var tabs = G.tabs,
        promises;
    
    if (!G.currentUser.guest)
      tabs = tabs.concat({hash: 'view/profile'});
      
    promises = _.map(tabs, function(tab) {
      var promise = hashToResourceOrList(tab.hash);
      if (promise.state() == 'rejected')
        return G.getRejectedPromise();
      
      return promise.then(function(data) {
        var fetchDfd = $.Deferred(),
            isList = U.isCollection(data);
        
        Events.trigger('cache' + (U.isModel(data) ? 'Resource' : 'List'), data);
        data.fetch({
          params: {
            $select: '$all'
          },
          success: function() {
            if (!data.isFetching())
              fetchDfd.resolve();
          },
          error: function() {
            fetchDfd.reject();
          }
        });
        
        return fetchDfd.promise();
      });
    });
    
//    if (Voc.isDelayingModelsFetch())
//      Voc.getModels(null, {go: true});    
  }
  
  function doPostStartTasks() {
    Voc.getModels();
    initGrabs();
    setupPushNotifications();
    ResourceManager.sync();
    if (U.getUrlInfo().route == 'home')
      prefetchResources();
    
  //    if (G.inWebview) {
  //      App.replaceGetUserMedia();
  //      Events.on('messageToApp', function(msg) {
  //        App.sendMessageToApp(msg);
  //      });
  //    }
  }
  
  function prepDB() {
    var requiredStores = {    
      modules: {
        name: 'modules',
        options: {
          keyPath: 'url'
        }
      },
      models: {
        name: 'models',
        options: {
          keyPath: 'url'
        }      
      },
      ref: {
        name: 'ref',
        options: {
          keyPath: '_id'
        },
        indices: {
          _uri: {unique: true, multiEntry: false},
          _dirty: {unique: false, multiEntry: false},
          _tempUri: {unique: false, multiEntry: false}, // unique false because it might not be set at all
          _problematic: {unique: false, multiEntry: false}
          //      ,
          //      _alert: {unique: false, multiEntry: false}      
        }
      }
    }; 
    
    G.getBaseObjectStoresInfo = function() {
      return _.clone(requiredStores);
    };
    
    for (var storeName in requiredStores) {
      G['get' + storeName.capitalizeFirst() + 'StoreInfo'] = U.getPropFn(requiredStores, storeName, true);
    }
    
    ModelLoader.init('indexedDB');
    ResourceManager.init();
  }
  
//  function setupHashMonitor() {
//    $(window).on('hashchange')
//  };

  function localize() {
    var locale = G.modules['locale/{0}.lol'.format(G.language)] || G.modules['locale/en.lol'];
    return $.Deferred(function(defer) {      
      var ctx = window.L20n.getContext({
        delimiter: {
          start: '((',
          end: '))'
        }
      });
      
      ctx.addResource(locale);
      ctx.freeze();
      G.localizationContext = document.l10n = ctx;
      G.localize = function() {
        return ctx.get.apply(ctx, arguments);
      };
      
      ctx.ready(defer.resolve.bind(defer));
      ctx.addEventListener('error', function(err) {
        if (err instanceof L20n.Compiler.Error) {
          // do something
          debugger;
        }
      });
    }).promise();
  }
  
  function setupUser() {
    G.currentUser.role = G.currentUser.guest ? 'guest' : G.currentUser.role || 'contact';
  }
  
  function setupWidgetLibrary() {
    if (G.isJQM()) {
      var jqmEvents = ['pagebeforecreate', 'pagecreate', 'pagebeforechange', 'pagechange'],
          jqmTransitionEvents = ['pagebeforehide', 'pagehide', 'pagebeforeshow', 'pageshow'],
          $doc = $(document);
      
      function fwdEvent(page_event) {
        return function(e) {
          e.target.dispatchEvent(new Event(page_event));
        }
      }
      
      for (var i = 0, len = jqmEvents.length; i < len; i++) {
        var pageevent = jqmEvents[i],
            page_event = 'page_' + pageevent.slice(4);
            
        $doc.on(pageevent, fwdEvent(page_event));        
      }
      
      for (var i = 0, len = jqmTransitionEvents.length; i < len; i++) {
        var pageevent = jqmTransitionEvents[i],
            page_event = 'page_' + pageevent.slice(4);
            
        $doc.on(page_event, fwdEvent(pageevent));        
      }
    }
  }
  
//  function setupScrollMonitor() {
//    Events.on('scrollVelocity', function(velocity) {
//      G._setScrollVelocity(velocity || 0);
//    });
//
//    Events.on('viewportDestination', function(x, y, timeToDestination) {
//      G._setViewportDestination(x, y, timeToDestination || 0);
//    });
//  }
  
  function doPreStartTasks() {
//    setupHashMonitor();
//    setupScrollMonitor();
    ModelLoader.loadEnums();
    setupWidgetLibrary();
    setupPackagedApp();
    setupUser();
//    setupAvailibilityMonitor();
    setupCleaner();
    prepDB();
    var localized = localize();
    var modelsViewsTemplatesAndDB = $.Deferred();
    ResourceManager.openDB().done(function() {
      return getAppAccounts().done(function() {
        loadCurrentModel().done(function() {
          $.whenAll.apply($, getTemplates(), getViews()).done(modelsViewsTemplatesAndDB.resolve);
        });
      });
    });
      
    setupWorkers();
//    buildLocalizationContext();
//        getAppAccounts().always(loadModels);
    Voc.checkUser();
    G.checkVersion();
    if (G.coverImage) {
      G.coverImage.color = G.lightColor = U.colorLuminance("#" + G.coverImage.lightColor.toString(16), 0.4);
      G.coverImage.background = G.darkColor = "#" + G.coverImage.darkColor.toString(16);
    }
    else {
      G.lightColor = '#eeeeee';
      G.darkColor = '#757575';
    }
    Templates.loadTemplates();
    extendMetadataKeys();
    setupNetworkEvents();
//    if (G.browser.mobile)
//      G.removeHoverStyles();
    
    Physics.init();
    return $.whenAll(modelsViewsTemplatesAndDB.promise(), localized, require(['@widgets', 'router']).done(function($w, r) {
      Router = r;
    }));
  }
  
  
  function setupCleaner() {
    G.checkVersion = function(data) {
      var init = data === true,
          newV = data ? data.VERSION : G.getVersion(),
          oldV = G.getVersion(!data) || newV; // get old
      
      if (oldV.All && newV.All > oldV.All) {
        G.setVersion(newV);
//        for (var key in newV) {
//          Events.trigger('VERSION:' + key, init);
//        }
        
        Events.trigger('VERSION', init);
        return;
      }
      
      for (var key in newV) {
        var setVersion = false;
        if (oldV[key] && newV[key] > oldV[key]) {
          if (!setVersion) {
            G.setVersion(newV);
            setVersion = true;
          }
          
          Events.trigger('VERSION:' + key, init);              
        }
      }
    };

    var fileTypes = ['js', 'css', 'jsp'];
    _.each(fileTypes, function(ext) {
      Events.on("VERSION:" + ext.toUpperCase(), function() {
        G.log(App.TAG, 'info', 'nuking', ext, 'from LS');
        var keys = _.keys(localStorage);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (key.endsWith(ext))
            G.localStorage.del(key);
        }
      });
    });
    
    Events.on("VERSION", function() {
      G.log(App.TAG, 'info', 'nuking all cached files from LS');
      var keys = _.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (/\.[a-zA-Z]+$/.test(key))
          G.localStorage.del(key);
      }        
    });
    
//    Events.on('viewDestroyed', function(view) {
//      setTimeout(function() {
//        _.wipe(view);
//      }, 0);
//    });
  }
  
  function setupMisc() {
    Events.on('location', function(position) {
      var prev = G.currentUser.location;
      if (prev)
        G.currentUser.previousLocation = prev;
      
      G.currentUser.location = position;        
    });
  }
  
  function setupRTCCallMonitor() {
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
  }
  
  function setupWorkers() {
    Backbone.ajax = U.ajax;
  }
  
  function setupNetworkEvents() {
    G.connectionListeners = [];
    var fn = G.setOnline;
    G.setOnline = function(online) {
      fn.apply(this, arguments);
      Events.trigger(online ? 'online' : 'offline');
    };      
  }
  
  function startApp() {
    Events.trigger('startingApp');
    return $.Deferred(function(dfd) {        
      if (App.started)
        return dfd.resolve();
      
      setupLoginLogout();
      setupRTCCallMonitor();
      setupMisc();
      
      G.app = App;
      App.started = true;
      if (window.location.hash == '#_=_') {
//        debugger;
        G.log(App.TAG, "info", "hash stripped");
        window.location.hash = '';
      }

      App.router = new Router();
//      if (G.support.pushState) {
//        Backbone.history.start({
//          pushState: true, 
//          root: G.appUrl.slice(G.appUrl.indexOf('/', 8))
//        });
//      }
//      else
        Backbone.history.start();
      
      dfd.resolve();
    }).promise();
  }
      
//  replaceGetUserMedia: function() {
//    navigator.getUserMedia = function(options, success, error) {
//      Events.once('messageFromApp:getUserMedia:success', function(e) {
//        success(e.blobURL);
//      });
//      
//      Events.once('messageFromApp:getUserMedia:error', function(e) {
//        error(e.error);
//      });
//
//      Events.trigger('messageToApp', {
//        type: 'getUserMedia',
//        id: G.nextId(),
//        mediaConstraints: options  
//      });
//    };
//  },
//
//  _registerSimplePushChannels: function(channels) {
//    channels = _.isArray(channels) ? channels : [channels];
//    return $.when.apply($, _.map(channels, App._registerSimplePushChannels));
//  },
//  
//  _unregisterPushEndpoint: function(endpoint) {
//    return SimplePush.unregister();
//  },

  function _registerPushEndpoint(endpoint, channel) {
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
  }
  
//  _subscribeToNotifications: function(endpoints) {
//    endpoints = _.isArray(endpoints) ? endpoints : [endpoints];
//    SimplePush.onMessage(function(message) {
//      var pushEndpoint = message.pushEndpoint;
//      var storedEndpoint = _.filter(endpoints, function(e) {
//        return e.endpoint === pushEndpoint;
//      })[0];
//      
//      if (!storedEndpoint) {
//        debugger; // this shouldn't happen, but i guess we can fetch the endpoint at this junction
//        return;
//      }
//      
//      var action = endpoint.get('action');
//      if (!action)
//        return;
//      
//      var actionRes = C.getResource(action);
//      var gotModel = Voc.getModels(actionType), 
//          gotAction = $.Deferred();
//      
//      gotModel.done(function() {
//        if (!actionRes) {
//          /// get resource
//          var actionModel = U.getModel(actionType);
//          actionRes = new actionModel({
//            _uri: action
//          });
//          
//          actionRes.fetch({
//            success: function() {
//              gotAction.resolve(actionRes);
//            },
//            error: defer.reject
//          });
//        }
//        else
//          gotAction.resolve(actionRes);
//      });
//      
//      gotAction.done(function(actionRes) {
//        debugger;
//        // run action
//      });
//    });
//  },
  
//  getGrabs: function() {
//    if (G.currentUser.guest)
//      return;
//    
//    var grabType = G.commonTypes.Grab;
//    Voc.getModels(grabType).done(function() {          
//      var grabsRL = G.currentUser.grabbed = new ResourceList(null, {
//        model: U.getModel(grabType),
//        params: {
//          submittedBy: G.currentUser._uri,
//          canceled: false
//        }
//      });
//      
//      grabsRL.fetch({
//        success: function() {
////          debugger;
//        },
//        error: function() {
////          debugger;
//        }
//      });
//    });
//  },
  
  function setupLoginLogout() {
    Events.on('req-login', function(options) {
      options = _.extend({online: 'Login via a Social Net', offline: 'You are currently offline, please get online and try again'}, options);
      var onDismiss;
      if (!G.online) {
        Errors.offline();
        return;
      }

      var existingPopup = $('#login_popup');
      if (existingPopup.length) {
//        existingPopup.popup().popup('open').parent().css({'z-index': 10000000});
//        return;
        existingPopup.remove();
      }
      
      var returnUri = options.returnUri || window.location.href,
          returnUriHash = options.returnUriHash;
      
      var signupUrl = "{0}/social/socialsignup".format(G.serverName);
      if (returnUri.startsWith(signupUrl)) {
        G.log(App.TAG, 'error', 'avoiding redirect loop and scrapping returnUri -- 1');
        returnUri = G.pageRoot;
      }
      
      var nets = _.map(G.socialNets, function(net) {
        return {
          name: net.socialNet,
          url: U.buildSocialNetOAuthUrl({
            net: net,
            action: 'Login', 
            returnUri: returnUri,
            returnUriHash: returnUriHash
          })
        };
      });
      
      if (!options.dismissible) {
        onDismiss = options.onDismiss || function() { 
          Events.trigger('back'); 
        };
      }
        
//      existingPopup.remove();
      var popupHtml = U.template('loginPopupTemplate')({nets: nets, msg: options.online, dismissible: false});
      $(document.body).append(popupHtml);
      var $popup = $('#login_popup');
      if (onDismiss) {
        $popup.find('[data-cancel]').click(onDismiss);
      }
//      if (!G.currentApp.widgetLibrary  ||  G.currentApp.widgetLibrary == 'Jquery Mobile') {
      if (G.isJQM()) {
        $popup.trigger('create');
        $popup.popup().popup("open");
        $popup.parent().css('z-index', 1000000);
      }  
      else {
        $popup.css('left', (G.viewport.width - 255) / 2);
      }
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
  }
  
  var App = {
    TAG: 'App',
    started: false,
    initialize: function() {            
      var self = this;
      doPreStartTasks().always(function() {
//        G.whenNotRendering(doPostStartTasks);
        doPostStartTasks();
        startApp().always(function() {
          Events.trigger('appStart');
        });
      });
    }
  };
  
  if (G.DEBUG)
    G.App = App;
  

  return App;
});