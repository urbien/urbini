define('appAuth', ['globals', 'underscore', 'utils'], function(G, _, U) {
  var AppAuth = {
    getAppInstallationState: function(type) {
      var appPath,
          className,
          typeBased = !!type,
          user = G.currentUser,
          state = {
            guest: user.guest
          };
      
      if (state.guest)
        return state;
      
      if (type) {
        if (!U.isAnAppClass(type)) {
          state.allowed = state.installed = true;
          return state;
        }
      } 

      appPath = G.currentApp.appPath.toLowerCase();      
      var appPathInstallationKey = user.installedApps && _.filter(_.keys(user.installedApps), function(path) {return path.toLowerCase() === appPath});
      var appInfo = appPathInstallationKey && appPathInstallationKey.length && user.installedApps[appPathInstallationKey[0]];
      if (appInfo) {
        state.installed = true;
        state.allowed = appInfo.allowed;
      }

      return state;      
    },
    
    /**
     * @return promise to return a list of FriendApp objects that represent apps that 'app' follows
     */
    getFollows: function(app) {
      return $.Deferred(function(defer) {        
        var followsList = new ResourceList(null, {
          model: U.getModel(friendAppType), 
          params: {friend1: app.getUri()}
        }); // FriendApp list representing apps that 'app' follows
        
        followsList.fetch({
          sync: true, 
          success: U.partial(defer.resolve, followsList).bind(defer),
          error: defer.reject
        });
      }).promise();
    },
    
    requestInstall: function(app) {
      var self = this, 
          commonTypes = G.commonTypes,
          appType = commonTypes.App,
          friendAppType = commonTypes.FriendApp,
          appPath = U.getValue(app, 'appPath').toLowerCase();
          appUri = U.getValue(app, '_uri'),
          user = G.currentUser;
      
      Voc.getModels([appType, friendAppType], {sync: true}).done(function() {
        var installOptions = {
            $returnUri: window.location.href
          },
          followsList, 
          fetchFollows;
          
        
        var appPromise = $.Deferred(function(defer) {
          var appModel = U.getModel(appType);
          app = C.getResource(appUri);
          if (app) {
            defer.resolve(app);
            return;
          }
          
          app = new appModel({_uri: appUri});
          app.fetch({sync: true, success: defer.resolve, error: defer.reject});
        }).promise();

        appPromise.done(function() {
          installOptions.application = app.getUri();
        });
        
        $.when(self.getFollows(app), fetchApp).done(function(followsList) {
          var installedAppUris = _.pluck(user.installedApps, '_uri');
          followsList = followsList.filter(function(friend) {
            var target = friend.get('friend2');
            return _.contains(installedAppUris, target);
          });
          
          var followsNames = _.pluck(followsList, 'davDisplayName');
          var followsCSV = followsNames.join(', ');
          var appName = U.getDisplayName(app);
          var title = self._getInstallTitle(appName);
          var redirectOptions = {
            $returnUri: U.getHash(), 
            $title: title, 
            allow: true,
            appPlugs: followsCSV
          };
          
          if (typeBased) {
            var terms = self._getInstallTerms(className, appName, followsNames);
            if (terms) {
              redirectOptions['-info'] = terms;
            }
          }

          self.navigate(U.makeMobileUrl('make', 'model/social/AppInstall', _.extend(installOptions, redirectOptions)), {trigger: true, replace: true}); // check all appPlugs by default
        }).fail(function() {
          debugger;
        });
      }).fail(function() {
        debugger;
        Errors.getDefaultErrorHandler().apply(this, arguments);
      });
    },
    
//    isAppConfigured: function(app) {
//      var appPath = U.getValue(app, 'appPath');
//      var userAccType = 'http://urbien.com/voc/dev/{0}/UserAccount'.format(appPath);
//      var type = U.getModelType();
//      if (type === userAccType)
//        return true;
//      
//      var accountModel = U.getModel(userAccType);
//      if (!accountModel)
//        return true;
//      
//      if (!_.size(_.omit(accountModel.properties, 'davDisplayName', 'davGetLastModified', '_uri', '_shortUri', 'id', 'app', 'user')))
//        return true;
//      
////      var existing = C.getResource(function(res) {
////        return res.vocModel == accountModel;
////      });
////      
////      if (existing && existing.length)
////        return true;
//
//      debugger;
//      var userAccounts = new ResourceList(null, {model: accountModel, params: {
//        user: G.currentUser._uri,
//        app: U.getValue(app, '_uri')
//      }});
//      
//      var redirectOptions = {
//        $returnUri: window.location.href, 
//        '-info': 'Configure your app below', 
//        $title: appPath + ' config'          
//      };
//
//      var self = this;
//      var error = function(uAccs, xhr, options) {
////      switch (xhr.status) {
////      case 404:
//        debugger;
//        self.navigate(U.makeMobileUrl('make', accountModel.type, redirectOptions), {trigger: true});            
////      }
//      };
//      
//      var success = function(resp, status, options) {
//        var acc = userAccounts.models && userAccounts.models[0];
//        if (acc)
//          self.navigate(U.makeMobileUrl('edit', userAccounts.models[0], redirectOptions), {trigger: true});
//        else
//          error(userAccounts, status, options);
//      }
//      
//      userAccounts.fetch({
//        success: _.once(success),
//        error: _.once(error)
//      });
//
//      return false;
//    },
    
    _getInstallTitle: function(appName, edit) {
      if (edit)
        return 'Allow app {0}'.format(appName);
      else
        return 'Install app {0}'.format(appName);
    },

    _getInstallTerms: function(className, appName, appPlugs, edit) {
      if (edit)
        return 'Edit your inter-app connections here';
      else {
        var msg = 'Do you allow app {0} to be added to your profile'.format(appName);
        if (appPlugs.length)
          return '{0} and connect to app{1}? You can always disconnect apps on their app pages and/or remove them from profile.'.format(className, (appPlugs.length === 1 ? ' ' : 's ') + appPlugs.join(', '));
        else
          return '{0}?'.format(msg);
      }
    }
  };
  
  return AppAuth;
});