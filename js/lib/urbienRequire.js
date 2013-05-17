(function(root, $) {
  var ArrayProto = Array.prototype,
    slice = ArrayProto.slice,
    moduleMap = {}, 
  require,
    initDefer = $.Deferred(function(defer) {$(defer.resolve)}),
    doc = document,
    head = doc.getElementsByTagName('head')[0],
    body = doc.getElementsByTagName('head')[0],
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
    readyRegExp = /^(complete|loaded)$/,
  currentlyAddingScript = null,
  config = {};
    
    
  function getUrl(name) {
    var paths = config.paths;
    var url = (config.baseUrl || '') + ((paths && paths[name]) || name);
    return /\.[a-zA-Z]+$/.test(url) ? url : url + '.js';
  }

  function removeListener(node, func, name, ieName) {
    //Favor detachEvent because of IE9
    //issue, see attachEvent/addEventListener comment elsewhere
    //in this file.
    if (node.detachEvent && !isOpera) {
      //Probably IE. If not it will throw an error, which will be
      //useful to know.
      if (ieName) {
        node.detachEvent(ieName, func);
      }
    } else {
      node.removeEventListener(name, func, false);
    }
  }
  
  function resolve(defer) {
    var args = slice.call(arguments, 1);
    initDefer.done(function() {
      defer.resolve.apply(defer, args);
    });
  };
  
  /**
  * @param name - name of the module - currently required
  **/
  var define = function(name, deps, cb) {
  switch (arguments.length) {
    // case 1: // TODO: allow anonymous define modules
      // cb = name;
      // name = deps = null;
      // break;
    case 2:
      cb = deps;
      deps = null;
      break;
  }

  // if (!name) {
    // var node = currentlyAddingScript; // || getInteractiveScript();
    // if (node)
      // name = node.getAttribute('data-requiremodule');
    // else
      // debugger;
  // }
      
  return require(deps).done(function() {
    var url = getUrl(name);
    moduleMap[url].resolve(cb.apply(root, arguments));
  });
  }
  
  /**
  * feel free to override, but make sure to return a Promise
  **/ 
  function load(name, url) {
    return $.Deferred(function(defer) {
      var node = document.createElement('script');
      node.type = config.scriptType || 'text/javascript';
      node.charset = 'utf-8';
      node.async = true;

      //node.setAttribute('data-requirecontext', context.contextName);
      //node.setAttribute('data-requiremodule', name);

      var success = function(evt) {
        var node = evt.currentTarget || evt.srcElement;

        //Remove the listeners once here.
        removeListener(node, success, 'load', 'onreadystatechange');
        removeListener(node, defer.reject, 'error');
        defer.resolve();
      };
      
      if (node.attachEvent &&!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
        useInteractive = true;
        node.attachEvent('onreadystatechange', success);
      } else {
        node.addEventListener('load', success, false);
        node.addEventListener('error', defer.reject, false);
      }
      
      node.src = url;
      head.appendChild(node);
    }).promise();
  }
  
  // var id = 0;
  function require(modules, cb) {
    modules = modules ? ($.isArray(modules) ? modules : [modules]) : [];
    var promise, prereqs = [];
    $.each(modules, function(idx, name) {
      var url = getUrl(name);
      var dfd = moduleMap[url];
      if (!dfd) {
      dfd = moduleMap[url] = $.Deferred(function(dfd) {
        require.load(name, url).then(function() {
          var shim = config.shim && config.shim[name],
              deps = shim && shim.deps;
            
          if (shim) { // non AMD - don't wait for them to resolve their dependencies
            if (deps)
              require(deps, dfd.resolve);
            else
              moduleMap[url].resolve() && dfd.resolve();
          }
            else
              moduleMap[url].promise().then(dfd.resolve, dfd.reject); // wait for the define call to resolve dependencies
        }, dfd.reject);
      });
    }
        
      prereqs.push(dfd.promise());
    });
    
    promise = $.when.apply($, prereqs);
  // promise._promiseId = id++;
  if (cb) {
    promise.done(function() {
      cb.apply(root, arguments);
    });
  }
  
  return promise;
  }
  
  require.config = function(cfg) {
  config = cfg;
  };
  
  require.load = load;
  root.require = require;
  root.define = define;
  var main = $('[data-main]')[0].dataset.main;
  var s = d.createElement('script'); 
  s.type = 'text/javascript';
  s.charset = 'utf-8';
  s.async = true;
  s.src = main; 
  $('head').append(s);
})(window, jQuery, undefined);
