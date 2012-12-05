define([
  'backbone'
], function(Backbone) {
  return {
    NOT_FOUND: "Oops! The page you're looking for doesn't exist.",
    getDefaultErrorHandler: function(errorHandler) {
      return function(originalModel, err, options) {
        if (options.sync) {
          switch (err.code) {
          case 401: 
            console.log('redirecting to user-login');
            window.location.href = Lablz.serverName + "/register/user-login.html?-mobile=y&errMsg=This+page+is+restricted,+please+login&returnUri=" + encodeURIComponent(window.location.href);
            return;
          case 404:
            console.log('no results');
            if (originalModel && (originalModel instanceof Backbone.Model || (originalModel instanceof Backbone.Collection))) // && originalModel.queryMap.length == 0)))
              Backbone.history.navigate((originalModel.shortName || originalModel.constructor.shortName), {trigger: true, replace: true, errMsg: "No results were found for your query"});
            else
              Backbone.history.navigate(Lablz.homePage, {trigger: true, replace: true, errMsg: Lablz.Error.NOT_FOUND});
            
            return;
          default:
            Backbone.history.navigate(Lablz.homePage, {trigger: true, replace: true, errMsg: err && err.details || Lablz.Error.NOT_FOUND});
            return;
          }
        }
        
        if (errorHandler)
          errorHandler.apply(this, arguments);
      }
    }
  };
});
