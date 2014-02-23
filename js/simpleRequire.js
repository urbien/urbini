(function($) {
  var ArrayProto = Array.prototype,
    slice = ArrayProto.slice,
    root = this,
    moduleMap = {}, 
    defineMap = {}, 
    require,
    domReady = $.Deferred(function(defer) {$(defer.resolve)}).promise(),
    doc = document,
    head = doc.getElementsByTagName('head')[0],
    body = doc.getElementsByTagName('head')[0],
    isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
//    readyRegExp = /^(complete|loaded)$/,
    extRegExp = /\.(jsp|html|htm|css|jsp|lol|js)$/,
    currentlyAddingScript = null,
//    useInteractive = false,
    config = {
      baseUrl: ''
    };
    

  function getRealName(name) {
    var paths = config.paths;
    return paths && paths[name] || name;
  }

  function toUrl(name) {
    var paths = config.paths;
    var url = config.baseUrl + getRealName(name);
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
  * TODO: allow anonymous define modules
  **/
  function define(name, deps, cb) {
    if (typeof name !== 'string')
      throw new Error("this loader library doesn't support anonymous 'define' statements (yet)");
    
    if (arguments.length == 2) {
      cb = deps;
      deps = null;
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
    
    function _define() {
      dfd.resolve(cb.apply(root, arguments));
    }
    
    if (deps && deps.length)
      require(deps, _define);
    else
      _define();
    
//    require(deps, function() {
//      dfd.resolve(cb.apply(root, arguments));
//    });
  }
  
  /**
  * feel free to override, but make sure to return a Promise
  **/ 
  function load(name, url) {
    return $.Deferred(function(defer) {
      url = url || require.toUrl(name);
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
        var shim = config.shim && config.shim[name],
            deps = shim && (shim.deps || shim),
            exports = shim && shim.exports;
          
        if (shim) {// non AMD
          require(deps).done(function() {
            require.load(name).done(function() {
              if (exports)
                dfd.resolve(root[exports]);
              else
                dfd.resolve();
            }).fail(dfd.reject);
          }).fail(dfd.reject);
        }
        else {
          require.load(name).done(function() {
            if (dfd.state() == 'pending') {
              if (arguments.length) 
                dfd.resolve.apply(dfd, arguments);
              else if (!defineMap[name]) // will be resolved via define
                dfd.resolve();
            }
          }).fail(dfd.reject);
        }
      }

      var prereq = dfd.promise();
      prereq._name = name;
      prereqs.push(prereq);
    });
    
    promise = $.when.apply($, prereqs);
    var called = false;
    if (cb) {
      promise.done(function() {
        if (!called) {
          called = true;
          cb.apply(root, arguments);
        }
      });
    }
    
    return promise;
  }
  
  require.config = function(cfg) {
    $.extend(config, cfg);
  };
  
  require.getConfig = function() {
    return config;
  };
  
  define.amd = {
    jQuery: true
  };  
  
  require.load = load;
  require.toUrl = toUrl;
  require.getRealName = getRealName;
  root.require = require;
  root.define = define;
  var main = $('[data-main]');
  if (main.length) {
    main = main.data('main') + '.js';
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
});