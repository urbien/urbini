define([
  'globals',
  'utils',
  'jquery',
  'events'
], function(G, U, $, Events) {
  var Errors = {
    msgs: {
      not_found: "The page you're looking for is probably in a parallel universe",
      login: "Please login, then we'll show you the top secret information you're looking for",
      unauthorized: "You are unauthorized to view this information",
      offline: 'Your device is currently offline. Please come back to the 21st century, we miss you!',
      timeout: 'Slow internet connection, please try again',
    },
    getDefaultErrorHandler: function(errorHandler) {
      var id = G.nextId();
      return function(originalModel, err, options) {
        var code = err.code || err.status;
        var type = err.type || err.statusText;
//        var defaultDestination = G.Router.previousHash;
        if (options.sync) {
          window.history.back();
          switch (code) {
          case 401: 
            G.log(Events.TAG, 'error', 'requesting user-login');
            Events.trigger(Events.REQUEST_LOGIN, G.currentUser.guest ? Errors.login : Errors.unauthorized);
            return;
          case 404:
            console.log('no results');
            var errMsg = err.details;
            if (!errMsg) {
              if (originalModel && (U.isModel(originalModel) || U.isCollection(originalModel))) // && originalModel.queryMap.length == 0)))
                errMsg = "No results were found for your query";
  //              router.navigate(defaultDestination || originalModel.shortName || originalModel.constructor.shortName, {trigger: true, replace: true, errMsg: "No results were found for your query"});
            else
                errMsg = Errors.not_found;
            }
//              router.navigate(defaultDestination || G.homePage, {trigger: true, replace: true, errMsg: Error.not_found});            
            Errors.errDialog({msg: errMsg, delay: 1000});
            return;
          default:
            switch (type) {
              case 'offline':
              case 'timeout':
//                Events.trigger('error', err.details ? err : _.extend(err, {details: Errors.OFFLINE}));
//                router.navigate(defaultDestination, {trigger: true, replace: true, errMsg: err.details || Errors[G.online ? type : 'offline']});
                Errors.errDialog({msg: err.details || Errors[G.online ? type : 'offline'], delay: 1000});
                break;
              case 'error':
              case 'abort':
              default: 
//                router.navigate(G.homePage, {trigger: true, replace: true, errMsg: err && err.details || Errors.not_found});
                Errors.errDialog({msg: err.details || Errors.not_found, delay: 1000});
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
      // TODO: fix this so we don't have to use alert

//      alert(msg);
      setTimeout(function() {
        $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, msg, !options.spinner);
        if (!options.nofade)
          setTimeout($.mobile.hidePageLoadingMsg, Math.max(1500, msg.length * 50));
      }, options.delay || 0);
    }
  };
  
  function errDialogFunction(msg) {
    return function() {
      Errors.errDialog({msg: msg});
    }
  };
  
  var msgs = Errors.msgs;
  for (var m in msgs) {
    Errors[m] = errDialogFunction(msgs[m]);
  }
  
  return Errors;
});
