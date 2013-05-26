//'use strict';
define('error', [
  'globals',
  'utils',
  'events'
], function(G, U, Events) {
  var Errors = {
    TAG: "Errors",
    msgs: {
      not_found: "The page you're looking for is probably in a parallel universe",
      login: "Please login, then we'll show you the top secret information you're looking for",
      unauthorized: "You are unauthorized to view this information",
      offline: 'Your device is currently offline. Please come back to the 21st century, we miss you!',
      timeout: 'Slow internet connection, please try again'
    },
    getDefaultErrorHandler: function(errorHandler) {
      var defaultErrorHandler = function(originalModel, err, options) {
        if (!err)
          debugger;
        
        var code = err.code || err.status;
        var type = err.type || err.statusText;
        if (options.sync) {
          switch (code) {
          case 204:
            if (originalModel && U.isModel(originalModel))
              return defaultErrorHandler(originalModel, _.extend(err, {code: 404}), options);
            
            return;
          case 401: 
//            Events.trigger('back');
            G.log(Errors.TAG, 'error', 'requesting user-login');
            Events.trigger('req-login', {onDismiss: function() {
              Events.trigger('back');
            }});
            
            return;
          case 404:
            Events.trigger('back');
            G.log(Errors.TAG, "error", 'no results');
            var errMsg = err.details;
            if (!errMsg) {
              if (originalModel) { 
                if (U.isModel(originalModel)) {
                  errMsg = "The item you're looking for doesn't exist";
                }
                else if (U.isCollection(originalModel)) {// && originalModel.params.length == 0)))
                  errMsg = "No results were found for your query";
                }
              }
            }
            
            errMsg = errMsg || Errors.not_found;
            Errors.errDialog({msg: errMsg, delay: 1000});
            return;
          default:
            switch (type) {
              case 'offline':
              case 'timeout':
                Events.trigger('back');
                Errors.errDialog({msg: err.details || Errors[G.online ? type : 'offline'], delay: 1000});
                break;
              case 'error':
              case 'abort':
              default: 
                Events.trigger('back');
                Errors.errDialog({msg: err.details || Errors.not_found, delay: 1000});
            }
            return;
          }
        }
        
        if (errorHandler)
          errorHandler.apply(this, arguments);
      };
      
      return defaultErrorHandler;
    },
    errDialog: function(options) {
      U.alert(options);
//      var msg = options.msg;
      // TODO: fix this so we don't have to use alert

//      alert(msg);
//      setTimeout(function() {
//        $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, msg, !options.spinner);
//        if (!options.nofade)
//          setTimeout($.mobile.hidePageLoadingMsg, Math.max(1500, msg.length * 50));
//      }, options.delay || 0);
      
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
