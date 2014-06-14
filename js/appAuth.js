define('appAuth', ['globals', 'underscore', 'utils', 'events', 'error', 'vocManager', 'cache', 'collections/ResourceList'], function(G, _, U, Events, Errors, Voc, C, ResourceList) {
  var COMMON_TYPES = G.commonTypes,
      FRIEND_APP_TYPE = COMMON_TYPES.Friend,
      APP_TYPE = COMMON_TYPES.App;
  
  var AppAuth = {
//    getAppInstallationState: function(type) {
//      var appPath,
//          user = G.currentUser,
//          state = {
//            guest: !user._uri
//          };
//      
//      if (state.guest)
//        return state;
//      
////      if (type) {
////        if (!U.isAnAppClass(type)) {
////          state.allowed = state.installed = true;
////          return state;
////        }
////      } 
//
//      appPath = G.currentApp.appPath.toLowerCase();      
//      var appPathInstallationKey = user.installedApps && _.filter(_.keys(user.installedApps), function(path) {return path.toLowerCase() === appPath});
//      var appInfo = appPathInstallationKey && appPathInstallationKey.length && user.installedApps[appPathInstallationKey[0]];
//      if (appInfo) {
//        state.installed = true;
//        state.allowed = appInfo.allow;
//      }
//
//      return state;      
//    },
    
    /**
     * @return promise to return a list of FriendApp objects that represent apps that 'app' follows
     */
    getFollows: function(app) {
      return $.Deferred(function(defer) {        
        var followsList = new ResourceList(null, {
          model: U.getModel(FRIEND_APP_TYPE), 
          params: {
            friend1: U.getValue(app, '_uri')
          }
        }); // FriendApp list representing apps that 'app' follows
        
        followsList.fetch({
          sync: true, 
          success: function() {
            defer.resolve(followsList);
          },
          error: defer.reject
        });
      }).promise();
    },
    
    requestInstall: function(app, typeModel) {
      var self = this, 
          commonTypes = G.commonTypes,
          appPath = U.getValue(app, 'appPath').toLowerCase(),
          appUri = U.getValue(app, '_uri'),
          user = G.currentUser,
          installOptions = {
              $returnUri: window.location.href,
              application: appUri
          },
          installedAppUris = _.pluck(user.installedApps, 'application'),
          followsList, 
          fetchFollows;
      
      Voc.getModels([APP_TYPE, FRIEND_APP_TYPE], {sync: true}).then(function() {
        var appPromise = $.Deferred(function(defer) {
          var appModel = U.getModel(APP_TYPE);
          app = C.getResource(appUri);
          if (app) {
            defer.resolve(app);
            return;
          }
          
          app = new appModel({_uri: appUri});
          app.fetch({sync: true, success: function() {
            defer.resolve(app);
          }, error: defer.reject});
        }).promise();

        return $.whenAll(self.getFollows(app), appPromise);
      }).then(function(followsList, app) {
        followsList = followsList.filter(function(friend) {
          var target = friend.get('friend2');
          return _.contains(installedAppUris, target);
        });
        
        var followsNames = _.pluck(followsList, 'davDisplayName'),
            followsCSV = followsNames.join(', '),
            redirectOptions = {
              $returnUri: U.getHash() || 'home/',
              $title: G.localize('allowApp', { appName: U.getDisplayName(app) }),
              '-gluedInfo': G.localize('doYouGrantAppAccessToProfileAndFriends'),
              allow: true,
              appPlugs: followsCSV
            };
        
//        if (typeModel) {
//          var terms = self._getInstallTerms(typeModel.displayName, appName, followsNames);
//          if (terms) {
//            redirectOptions['-info'] = terms;
//          }
//        }

        Events.trigger('navigate', U.makeMobileUrl('make', 'model/social/AppInstall', _.extend(installOptions, redirectOptions)), {trigger: true, replace: true}); // check all appPlugs by default
      }).fail(function() {
        debugger;
        Errors.getXHRErrorHandler().apply(this, arguments);
      });
    }
    
//    _getInstallTitle: function(appName/*, edit*/) {
//      return 'Allow app {0}'.format(appName);
//    },
//
//    _getInstallTerms: function(className, appName, appPlugs/*, edit*/) {
////      if (edit)
////        return 'Edit your inter-app connections here';
////      else {
//        var msg = 'Do you allow app {0} to be added to your profile'.format(appName);
//        if (appPlugs.length)
//          return '{0} and connect to app{1}? You can always disconnect apps on their app pages and/or remove them from profile.'.format(className, (appPlugs.length === 1 ? ' ' : 's ') + appPlugs.join(', '));
//        else
//          return '{0}?'.format(msg);
////      }
//    }
  };
  
  return AppAuth;
});