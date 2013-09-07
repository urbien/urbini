//'use strict';
define('error', [
  'globals',
  'utils',
  'events'
], function(G, U, Events) {

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("Errors", "error");
    G.log.apply(G, args);
  };
  
  var BackboneSyncErrHandlers = {
    "401": function(mode, resp, options) {
      //Events.trigger('back');
      log('error', 'requesting user-login');
      if (options.sync) {
        Events.trigger('req-login', {onDismiss: function() {
          Events.trigger('back');
        }});
      }
    },
    "304": function() {
    },
    "404": function(model, resp, options) {
      if (options.sync)
        Events.trigger('back');
//      log("error", 'no results');
//      var errMsg = resp.details;
//      if (!errMsg) {
//        if (originalModel) { 
//          if (U.isModel(originalModel)) {
//            errMsg = "The item you're looking for doesn't exist";
//          }
//          else if (U.isCollection(originalModel)) {// && originalModel.params.length == 0)))
//            errMsg = "No results were found for your query";
//          }
//        }
//      }
//      
//      errMsg = errMsg || Errors.not_found;
//      Errors.errDialog({msg: errMsg, delay: 1000});  
    },
    "default": function(model, resp, options) {
      if (!options.sync)
        return;
      
      switch (resp.type || resp.statusText) {
        case 'offline':
        case 'timeout':
          debugger;
          Events.trigger('back');
          Errors.errDialog({msg: resp.details || Errors[G.online ? type : 'offline'], delay: 1000});
          break;
        case 'error':
        case 'abort':
        default: 
          Events.trigger('back');
          Errors.errDialog({msg: resp.details || Errors.not_found, delay: 1000});
      }
    }
  };
  
  BackboneSyncErrHandlers["204"] = BackboneSyncErrHandlers["404"];
  
  function defaultBackboneErrorHandler(errorHandler, model, resp, options) {
    var code = resp.code || resp.status,
        type = resp.type || resp.statusText,
        keepGoing;
    
    if (options.sync)
      keepGoing = (BackboneSyncErrHandlers[code + ""] || BackboneSyncErrHandlers["default"]).call(null, model, resp, options);
    
    if (errorHandler && keepGoing !== false)
      errorHandler.call(null, model, resp, options);
  };

  function defaultXHRErrorHandler(errorHandler, xhr, status, err) {
    debugger;
  };
  
  var Errors = {
    TAG: "Errors",
    msgs: {
      not_found: "The page you're looking for is probably in a parallel universe",
      login: "Please login, then we'll show you the top secret information you're looking for",
      unauthorized: "You are unauthorized to view this information",
      offline: 'Your device is currently offline. Please come back to the 21st century, we miss you!',
      timeout: 'Slow internet connection, please try again'
    },
    getBackboneErrorHandler: function(errorHandler) {
      return U.partial(defaultBackboneErrorHandler, errorHandler);
    },
    getXHRErrorHandler: function(errorHandler) {
      return U.partial(defaultXHRErrorHandler, errorHandler);
    },
    errDialog: function(options) {
      U.alert(options); // maybe give some indication that it's an error?
    }
  };
  
  function errDialogFunction(msg) {
    return function() {
      Errors.errDialog({msg: msg});
    }
  };

  // create some shortcuts for error dialogs, such as Errors.offline();
  for (var m in Errors.msgs) {
    Errors[m] = errDialogFunction(Errors.msgs[m]);
  }

  return Errors;
});
