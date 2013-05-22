(function(root, $) {
  var ArrayProto = Array.prototype,
    slice = ArrayProto.slice,
    moduleMap = {}, 
    defineMap = {}, 
    require,
    domReady = $.Deferred(function(defer) {$(defer.resolve)}).promise(),
    doc = document,
    head = doc.getElementsByTagName('head')[0],
    body = doc.getElementsByTagName('head')[0],
    isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
//    readyRegExp = /^(complete|loaded)$/,
    extRegExp = /\.(jsp|html|htm|css|jsp|js)$/,
    currentlyAddingScript = null,
//    useInteractive = false,
    config = {
      baseUrl: ''
    };
    
    
  function toUrl(name) {
    var paths = config.paths;
    var url = config.baseUrl + ((paths && paths[name]) || name);
    return url.match(extRegExp) ? url : url + '.js';
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
    
  /**
  * @param name - name of the module - currently required
  **/
  function define(name, deps, cb) {
    switch (arguments.length) {
      // case 1: // TODO: allow anonymous define modules
        // cb = name;
        // name = deps = null;
        // break;
        throw new Error("this loader library doesn't support anonymous 'define' statements (yet)");
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
        
    var url = toUrl(name);
    var dfd = moduleMap[url] = moduleMap[url] || $.Deferred();
    defineMap[name] = true;
    require(deps, function() {
      dfd.resolve(cb.apply(root, arguments));
    });
  }
  
  /**
  * feel free to override, but make sure to return a Promise
  **/ 
  function load(name) {
    return $.Deferred(function(defer) {
      var url = require.toUrl(name);
      currentlyAddingScript = name;
      var node = document.createElement('script');
      node.type = config.scriptType || 'text/javascript';
      node.charset = 'utf-8';
      node.async = true;

      //node.setAttribute('data-requirecontext', context.contextName);
      //node.setAttribute('data-requiremodule', name);

      var success = function(evt) {
        currentlyAddingScript = null;
        var node = evt.currentTarget || evt.srcElement;

        //Remove the listeners once here.
        removeListener(node, success, 'load', 'onreadystatechange');
        removeListener(node, defer.reject, 'error');
        defer.resolve();
      };
      
      if (node.attachEvent &&!(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !isOpera) {
//        useInteractive = true;
        node.attachEvent('onreadystatechange', success);
      } else {
        node.addEventListener('load', success, false);
        node.addEventListener('error', defer.reject, false);
      }
      
      node.src = url;
      head.appendChild(node);
    }).promise();
  }
  
  function require(modules, cb) {
    modules = modules ? ($.isArray(modules) ? modules : [modules]) : [];
    var promise, prereqs = [];
    $.each(modules, function(idx, name) {
      if (name === '__domReady__') {
        prereqs.push(domReady);
        return;
      }
      
      var url = toUrl(name);
      var dfd = moduleMap[url];
      if (!dfd) {
        dfd = moduleMap[url] = $.Deferred();
        require.load(name).then(function() {
          if (dfd.state() === 'resolved')
            return;
          
          if (arguments.length) {
            return dfd.resolve.apply(dfd, arguments);
          }
          
          var shim = config.shim && config.shim[name],
              deps = shim && (shim.deps || shim),
              exports = shim && shim.exports;
            
          if (shim) { // non AMD
            require(deps, function() {
              if (exports)
                dfd.resolve(root[exports]);
              else
                dfd.resolve();
            });
          }
          else if (!defineMap[name]) { // non AMD, no deps
            dfd.resolve();
          }
          
        }, dfd.reject);        
      }

      var prereq = dfd.promise();
      prereq._name = name;
      prereqs.push(prereq);
    });
    
    promise = $.when.apply($, prereqs);
    if (cb) {
      promise.done(function() {
        cb.apply(root, arguments);
      });
    }
    
    return promise;
  }
  
  require.config = function(cfg) {
    $.extend(config, cfg);
  };
  
  define.amd = {
    jQuery: true
  };  
  
  require.load = load;
  require.toUrl = toUrl;
  root.require = require;
  root.define = define;
  var main = $('[data-main]')[0];
  if (main) {
    main = main.dataset.main + '.js';
    var idx = main.lastIndexOf('/');
    if (idx>=0) {
      config.baseUrl = main.slice(0, idx + 1);
    }
    
    var s = doc.createElement('script'); 
    s.type = 'text/javascript';
    s.charset = 'utf-8';
    s.async = true;
    s.src = main; 
    head.appendChild(s);
  }
})(window, jQuery, undefined);