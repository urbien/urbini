define([
  'globals',
//  'cache!events',
  'cache!underscore', 
  'cache!backbone',
  'cache!jqueryMobile'
], function(G,  _, Backbone) {
  var Error = {
    not_found: "The page you're looking for is probably in a parallel universe",
    login: "Please login, then we'll show you the top secret information you're looking for",
    offline: 'Your device is currently offline. Please come back to the 21st century, we miss you!',
    timeout: 'Slow internet connection, please try again',
    getDefaultErrorHandler: function(errorHandler) {
      var id = G.nextId();
      return function(originalModel, err, options) {
        var code = err.code || err.status;
        var type = err.type || err.statusText;
//        var defaultDestination = G.app && G.app.router.previousHash;
        if (options.sync) {
          window.history.back();
          var router = G.app && G.app.router || Backbone.history;
          switch (code) {
          case 401: 
            console.log('redirecting to user-login');
//            window.location.href = G.serverName + "/register/user-login.html?-mobile=y&errMsg=This+page+is+restricted,+please+login&returnUri=" + encodeURIComponent(window.location.href);
//            window.history.back();
            Error.errDialog({msg: Error.login, delay: 1000});
            return;
          case 404:
            console.log('no results');
            var errMsg = err.details;
            if (!errMsg) {
              if (originalModel && (originalModel instanceof Backbone.Model || originalModel instanceof Backbone.Collection)) // && originalModel.queryMap.length == 0)))
                errMsg = "No results were found for your query";
  //              router.navigate(defaultDestination || originalModel.shortName || originalModel.constructor.shortName, {trigger: true, replace: true, errMsg: "No results were found for your query"});
              else
                errMsg = Error.not_found;
            }
//              router.navigate(defaultDestination || G.homePage, {trigger: true, replace: true, errMsg: Error.not_found});            
            Error.errDialog({msg: errMsg, delay: 1000});
            return;
          default:
            switch (type) {
              case 'offline':
              case 'timeout':
//                Events.trigger('error', err.details ? err : _.extend(err, {details: Error.OFFLINE}));
//                router.navigate(defaultDestination, {trigger: true, replace: true, errMsg: err.details || Error[G.online ? type : 'offline']});
                Error.errDialog({msg: err.details || Error[G.online ? type : 'offline'], delay: 1000});
                break;
              case 'error':
              case 'abort':
              default: 
//                router.navigate(G.homePage, {trigger: true, replace: true, errMsg: err && err.details || Error.not_found});
                Error.errDialog({msg: err.details || Error.not_found, delay: 1000});
            }
            return;
          }
        }
        
        if (errorHandler)
          errorHandler.apply(this, arguments);
      }
    },
    errDialog: function(options) {
      var msg = options.msg;
      setTimeout(function() {
        $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, msg, !options.spinner);
        if (!options.nofade)
          setTimeout($.mobile.hidePageLoadingMsg, Math.min(1500, msg.length * 50));
      }, options.delay || 0);
    }
  };
  
  return Error;
});
