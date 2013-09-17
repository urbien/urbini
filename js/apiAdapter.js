define('apiAdapter', ['globals', 'underscore'], function(G, _) {
  
  function getOAuthVersion(oauthVersion) {
    if (typeof oauthVersion == 'string') {
      try {
        oauthVersion = parseInt(oauthVersion);
      } catch (err) {
      }
    }
    
    if (oauthVersion !== 1 && oauthVersion !== 2)
      throw errMsg;
    
    return oauthVersion;
  };
  
  /**
   * @param consumer - the app's API account
   */
  function API(consumer, provider) {
    this.consumer = consumer;
    this.provider = provider;
  };
  
  _.extend(API.prototype, {
    getUrl: function(type, endpoint, params, authenticated) {
      var params = {
        $url: endpoint
      };
      
      if (authenticated)
        return endpoint + '?' + $.param(params);
      else {
        params.$auth = 'simple';
        return G.apiUrl + encodeURIComponent(type) + '?' + $.param(params);
      }
    },

    isAuthorized: function(oauthVersion) {
      oauthVersion = getOAuthVersion(oauthVersion);
      var access = this.access || G.dataAccesses.where({
        appAccount: this.consumer._uri
      }, true);
      
      if (access)
        return false;
      
      switch (oauthVersion) {
      case 1:
        return access.get('tokenSecret'); // && access.get('expires') > +new Date();
      case 2:        
        return access.get('accessToken') && access.get('expires') > +new Date();
      default:
        throw "Only OAuth 1.0a and OAuth 2 are supported";
      }
    },
    
    oauth: function(type, redirectUri) {
      debugger;
      var params = {};
      if (type) {
        params.type = type;
      }
      else {
        params.app = this.provider.get('app');
      }
      
      if (redirectUri)
        params.$returnUri = redirectUri;
      
//      oauthVersion = getOAuthVersion(oauthVersion);
//      window.location.href = G.apiUrl + 'oauth' + oauthVersion + '?' + $.param(params);

      window.location.href = G.apiUrl + 'oauth?' + $.param(params);

//      var self = this,
//          authDfd = $.Deferred(),
//          access = this.access || G.dataAccesses.where({
//            appAccount: this.consumer._uri
//          }, true),
//          accessToken = access && access.get('accessToken'),
//          expires = access && access.get('expires'),
//          popup;
//
//      if (access && (!expires || expires > +new Date()))
//        return authDfd.resolve().promise();
//      
//      var authParams = {
//            response_type: 'token',
//            client_id: this.consumer.clientId, // TODO: get actual prop name, dev may have renamed it
//            redirect_uri: G.appUrl, // catch in "list" route and close popup
//            state: U.getHash() + '&' + $.param({
//              provider: this.provider._uri
//            })
//          },
//          cbName = 'onOAuthComplete' + G.nextId(),
//          accessModelDfd = $.Deferred(),
//          accessModel;
//      
//      if (!access) {
//        var accessType = 'model/social/AppOAuth{0}Access'.format(version);
//        Voc.getModels(accessType).done(function() {
//          accessModel = U.getModel(accessType);
//          if (!access) {
//            access = new accessModel({
//              appAccount: self.consumer.getUri()
//            });
//          }
//          
//          accessModelDfd.resolve();
//        });
//      }
      
// // OAuth 2 Implicit flow      
//      accessModelDfd.promise().done(function() {
//        var authUrl,
//            scope;
//        
//        scope = access.get('scope');
//        if (scope)
//          authParams.scope = scope;
//        
//        authUrl = this.provider.authorizationEndpoint + '?' + $.param(authParams);
//        window[cbName] = function(authInfo) {
//          debugger;
//          !popup.closed && popup.close();
//          window[cbName] = null;
//          if (authInfo.expires_in)
//            authInfo.expires = +new Date() + (authInfo.expires_in * 1000);
//          
//          access.set({
//            accessToken: authInfo.access_token,
//            refreshToken: authInfo.refresh_token,
//            expires: authInfo.expires
//          });
//          
//          access.save();
//          self.access = access;
//          authDfd.resolve();
//        };
//        
//        popup = window.open(authUrl);
//      });
//      
//      return authDfd.promise();
    },
    
    jsonp2request: function(url, method) {
      debugger;
      if (!this.access)
        throw new Error("You must authenticate the user first");
      
      method = (method || 'GET').toUpperCase();
      return $.Deferred(function(defer) {
        // if using $.ajax, need to use form $.ajax({dataType: 'jsonp', url: url + '&callback=?'}
        var cb = '__urbienJSONPCallback' + G.nextId();
        window[cb] = function() {
          delete window[cb];
          defer.resolve.apply(defer, arguments);
        };
        
        url += (url.indexOf("?") == -1 ?  "?" : '&') + $.param({
          access_token: accessToken,
          callback: cb
        });
        
        if (/^http\:/.test(url))
          url = 'https' + url.slice(4);
        
        U.ajax({
          url: url
        }, 'appJSONPRequest');
      }).promise();
    }
  });
  
  return API;
});
