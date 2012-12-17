define([
  'globals',
  'cache!underscore', 
  'cache!backbone' 
], function(G, _, Backbone) {
  return {
    NOT_FOUND: "Oops! The page you're looking for doesn't exist.",
    getDefaultErrorHandler: function(errorHandler) {
      return function(originalModel, err, options) {
        if (options.sync) {
          var router = G.app && G.app.router || Backbone.history;
          switch (err.code) {
          case 401: 
            console.log('redirecting to user-login');
            window.location.href = G.serverName + "/register/user-login.html?-mobile=y&errMsg=This+page+is+restricted,+please+login&returnUri=" + encodeURIComponent(window.location.href);
            return;
          case 404:
            console.log('no results');
            if (originalModel && (originalModel instanceof Backbone.Model || (originalModel instanceof Backbone.Collection))) // && originalModel.queryMap.length == 0)))
              router.navigate((originalModel.shortName || originalModel.constructor.shortName), {trigger: true, replace: true, errMsg: "No results were found for your query"});
            else
              router.navigate(G.homePage, {trigger: true, replace: true, errMsg: Error.NOT_FOUND});
            
            return;
          default:
            router.navigate(G.homePage, {trigger: true, replace: true, errMsg: err && err.details || Error.NOT_FOUND});
            return;
          }
        }
        
        if (errorHandler)
          errorHandler.apply(this, arguments);
      }
    }
  };
});
