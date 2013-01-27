define('app', [
  'globals',
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates', 
  'cache!utils', 
  'cache!events',
  'cache!vocManager',
  'cache!resourceManager',
  'cache!router'
], function(G, __jqm__, _, Backbone, Templates, U, Events, Voc, RM, Router) {  
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
    initialize: function() {
      var error = function(e) {
        G.log('init', 'error', "failed to init app, not starting");
        throw new Error('failed to load app');
      };
      
      Templates.loadTemplates();
      Voc.checkUser();
      Voc.loadStoredModels();
      if (!Voc.changedModels.length && !Voc.newModels.length) {
        RM.restartDB(App.startApp, error);
        return;
      }
    
      Voc.fetchModels(null, {success: function() {
        RM.db ? App.startApp() : RM.restartDB(App.startApp, error);
      }, error: error, sync: true});
    },
    
    startApp: function() {
      if (App.started)
        return;
      
      G.app = App;
      App.started = true;
      var models = G.models;
      G.Router = new Router();
      Backbone.history.start();
      
      _.each(G.tabs, function(t) {t.mobileUrl = U.getMobileUrl(t.pageUrl);});
      App.setupLoginLogout();
//      G.homePage = G.homePage || G.tabs[0].mobileUrl;
//      if (!window.location.hash) {
//        G.Router.navigate(G.homePage, {trigger: true});
//      }
    },
    
    setupLoginLogout: function() {
      Events.on(Events.REQUEST_LOGIN, function(msg) {
        var here = window.location.href;
        _.each(G.socialNets, function(net) {
          var state = U.getQueryString({socialNet: net.socialNet, returnUri: here, actionType: 'Login'}, true); // sorted alphabetically
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
          net.url = net.authEndpoint + '?' + U.getQueryString(params, true); // sorted alphabetically
        });
        
        var popupTemplate = _.template(Templates.get('loginPopupTemplate'));
        var $popup = $('.ui-page-active #login_popup');
        var html = popupTemplate({nets: G.socialNets, msg: msg || 'Login through a Social Net'});
        if ($popup.length == 0) {
          $(document.body).append(html);
          $popup = $('#login_popup');
        }
          
        $popup.trigger('create');
        $popup.popup().popup("open");
        return false; // prevents login button highlighting
      });
      
      var defaults = {returnUri: ''}; //encodeURIComponent(G.serverName + '/' + G.pageRoot)};
      Events.on(Events.LOGOUT, function(options) {
        options = _.extend({}, defaults, options);
        var url = G.serverName + '/j_security_check?j_signout=true';
        $.get(url, function() {
            // may be current page is not public so go to home page (?)
          window.location.hash = options.returnUri;
          window.location.reload();
        });        
      });
    }
  };
  
  return App;
});