(function(window, doc) {
  var bgPage,
  runtimeId,
//  connected = false,
  serverOrigin,
  appHome,
  iframeOrigin,
  tabId,
  isLoading = false,
  SHOW_BUTTONS = true,
//  visibilityState,

  /* START HTML elements / JQuery objects */
  iframe,
  controls,
  locInput,
  back,
  forward,
  home,
  reload,
//  terminate,
  locForm,
  /* END   HTML elements / JQuery objects */

//  echo,
  channelId,
  objectConstructor = {}.constructor,
  RPC = {
    log: function() {
      var args = [].slice.call(arguments);
      args.unshift('FROM IFRAME:');
      logger.log.apply(logger, args);
    },
    setUrl: function(url) {
      locInput.value = url;
    },
    setAttribute: function(sel, attribute, value) {
      $(sel).setAttribute(attribute, value);
    },
    mozNotification: {
      /**
       * @param callbacks = {
       *   onclose: a message type to send back when the notification has been closed    (optional)
       *   onclick: a message type to send back when the notification has been clicked   (optional)
       * }
       */
      createNotification: function(title, desc, iconURL, callbacks) {
        console.log("creating notification", title, desc, iconURL, JSON.stringify(callbacks));
        var dotIdx = this._path.lastIndexOf('.');
        var parent = leaf(navigator, this._path.slice(0, dotIdx));
        var fn = parent[this._path.slice(dotIdx + 1)];

//        var notification = leaf(navigator, this._path)(title, desc, iconURL);
        var notification = fn.apply(parent, [].slice.call(arguments, 0, 2));
        if (callbacks) {
          for (var cbName in callbacks) {            
            notification[cbName] = getCallback(cbName);
          }
        }
        
        notification.show();
      }
    },
    push: {
      register: getHandler(navigator.push, 'register'),
      unregister: getHandler(navigator.push, 'unregister'),
      registrations: getHandler(navigator.push, 'registrations')
    },
    setMessageHandler: function(messageType, callbackEvent) {
      navigator.mozSetMessageHandler(messageType, getCallback(callbackEvent));
    }
  },
  $ = function() {
    return document.querySelector.apply(document, arguments);
  },
  _installed = false,
  installed = function() {
    _installed = true;
    ready();
  },
  logger = console;

  navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia;
  window.onresize = doLayout;
  
  setPaths(RPC);
  install();
  
  function install() {
    var getSelf = navigator.mozApps.getSelf();
    getSelf.onsuccess = function() {
      if (getSelf.result) {
        // we're installed
        logger.log('already installed');
        installed();
      } else {
        // not installed
        var installReq = navigator.mozApps.install('/manifest.webapp');
        installReq.onsuccess = function() {
          logger.log("app installed successfully");
          installed();
        };
        
        installReq.onerror = function(errObj) {
          logger.log("Couldn't install app (" + errObj.code + ") " + errObj.message);
        };
      }
    }
    
    getSelf.onerror = function(err) {
      console('Error checking installation status: ' + err.message);
    };    
  };

  /**
   * iframe onload event
   */
  function iframeLoaded() {
    ready();
  };
  
  function ready() {
    if (iframe && _installed) {
      postMessage({
        type: 'ready'
      });
    }
  }

  function isDefined(obj) {
    return typeof obj !== 'undefined';
  }

  
  function getHandler(obj, method) {
    return function() {
      return handleDomReqRPC.apply(null, [obj, method].concat([].slice.call(arguments)));
    }
  };

  function handleDomReqRPC(obj, method) {
    debugger;
    var args = arguments,
        fn = obj[method],
        successEvent = args[args.length - 2],
        errorEvent = args[args.length - 1];
    
    args = [].slice.call(args, 2, args.length - 2);
    logger.log('calling ' + method + ' with ' + args.length + ' args');
    var req = fn.apply(obj, args);
    req.onsuccess = function(e) {
      logger.log('SUCCESS: ' + method, e.target.result);
      getCallback(successEvent)(e.target.result);
    };
    
    req.onerror = function(err) {
      logger.log('ERROR: ' + method, err);
      getCallback(errorEvent)(err);
    };
    
    setTimeout(function() {      
      if (req.readyState != 'done') {
        // fake it
        req.onsuccess({
          target: {
            result: 'fakeEndpoint' + +new Date()
          }
        });
      }
    }, 5000);
  };

  function doNothing() {};

  function has(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  function setPaths(obj) {
    for (var pkgName in obj) {
      var pkg = obj[pkgName];
      pkg._path = (obj._path ? obj._path + '.' : '') + pkgName;
      switch (typeof pkg) {
      case 'function':
        obj[pkgName] = pkg.bind(pkg);
        break;
      case 'object':
        setPaths(pkg);
        break;
      }
    }
  };

  function shallowCopy(obj) {
    if (obj == null || typeof obj !== 'object')
      return obj;

    var copy = {};
    for (var prop in obj) {
      if (has(obj, prop)) {
        var val = obj[prop];
        if (val == null)
          continue;
        else if (val instanceof HTMLElement) {
          obj[prop] = {
              id: val.id,
              attributes: val.attributes
          };

          continue;
        }
        else if (typeof val !== 'object')
          copy[prop] = val;
        else if (val.constructor === objectConstructor) {
          // don't copy "real" objects, only objects that are primitive json
          var canCopy = true;
          for (var subProp in val) {
            if (typeof val[subProp] === 'function') {
              canCopy = false;
              break;
            }
          }

          if (canCopy)
            copy[prop] = shallowCopy(val);
        }
      }
    }

    return copy;
  }

  function index(obj, i) {
    return obj[i];
  };

  function leaf(obj, path, separator) {
    if (typeof obj == 'undefined' || !obj)
      return null;

    return path.split(separator || '.').reduce(index, obj);
  };

  function getCallback(eventName) {
    return function() {
      var args = [].slice.call(arguments);
      for (var i = 0; i < args.length; i++) {
        args[i] = shallowCopy(args[i]);
      }

      postMessage({
        type: eventName,
        args: args
      });
    }
  };

  function navigateTo(url) {
    resetExitedState();
    postMessage({
      type: 'navigate',
      args: [url]
    })
  }

  function doLayout() {
    if (!iframe)
      return;
    
    var controlsHeight = controls ? controls.offsetHeight : 0;
    var windowWidth = doc.documentElement.clientWidth;
    var windowHeight = doc.documentElement.clientHeight;
    var iframeWidth = windowWidth;
    var iframeHeight = windowHeight - controlsHeight;

    iframe.style.width = iframeWidth + 'px';
    iframe.style.height = iframeHeight + 'px';

    // var sadiframe = $('#sad-iframe');
    // sadiframe.style.width = iframeWidth + 'px';
    // sadiframe.style.height = iframeHeight * 2/3 + 'px';
    // sadiframe.style.paddingTop = iframeHeight/3 + 'px';
  }

  function handleExit(event) {
    logger.log(event.type);
    doc.body.classList.add('exited');
    if (event.type == 'abnormal') {
      doc.body.classList.add('crashed');
    } else if (event.type == 'killed') {
      doc.body.classList.add('killed');
    }

    navigateTo(appHome); 
  }

  function resetExitedState() {
    doc.body.classList.remove('exited');
    doc.body.classList.remove('crashed');
    doc.body.classList.remove('killed');
  }

  function handleLoadCommit(event) {
    resetExitedState();
    if (!event.isTopLevel) {
      locInput.value = iframe.src;
      return;
    }

    locInput.value = event.url || iframe.src;

//    back.disabled = !iframe.canGoBack();
//    forward.disabled = !iframe.canGoForward();
  }

  function handleLoadStart(event) {
    doc.body.classList.add('loading');
    isLoading = true;

    resetExitedState();
    if (!event.isTopLevel) {
      locInput.value = iframe.src;
      return;
    }
    
//    var url = event.url,
//        parsed = parseUrl(url);
//    
//    if (!parsed.params) {
//      url += '?-iframe=y';
//      navigateTo(url);
//      return false;
//    }
//    else if (parsed.params && !parsed.params['-iframe']) {
//      url += '&-webiew=y';
//      navigateTo(url);
//      return false;
//    }
    
    locInput.value = event.url;
  }

//  function parseUrl(url) {
//    var a = document.createElement('a');
//    a.href = url;
//    var q = a.search;
//    if (q) {
//      q = q.split('&');      
//      a.params = {};
//      q.forEach(function(keyVal) {
//        keyVal = keyVal.split('=').map(decodeURIComponent);
//        a.params[keyVal[0]] = keyVal[1];
//      });
//    }
//    
//    return a;
//  }

  function handleLoadStop(event) {
    // We don't remove the loading class immediately, instead we let the animation
    // finish, so that the spinner doesn't jerkily reset back to the 0 position.
    isLoading = false;
  }

  function handleLoadAbort(event) {
    logger.log('  loadAbort');
    logger.log('  url: ' + event.url);
    logger.log('  isTopLevel: ' + event.isTopLevel);
    logger.log('  type: ' + event.type);
  }

  function handleLoadRedirect(event) {
    resetExitedState();
    if (!event.isTopLevel) {
      return;
    }

    locInput.value = event.newUrl;
  }

  window.onload = function() {
//    debugger;
//    var getMedia = navigator.getUserMedia || navigator.mozGetUserMedia;
//    if (getMedia) {
//      logger.log('HAS GETUSERMEDIA');
//      (navigator.getUserMedia || navigator.mozGetUserMedia)({audio: true, video: true}, function(stream) {
//        logger.log('GOT MEDIA', stream);
//      }, function() {
//        logger.log('DIDNT GET MEDIA');
//      });
//    }
//    else
//      logger.log('DOESNT HAVE GETUSERMEDIA');
    
    controls = $('#controls');
    iframe = $('#iframe');
    if (SHOW_BUTTONS) { 
      back = $('#back');
      forward = $('#forward');
      reload = $('#reload');
      home = $('#home');
//      terminate = $('#terminate');
      locInput = $('#location');
      locInput.value = iframe.src;
      locForm = $('#location-form');

      back.onclick = function() {
        postMessage({
          type: 'back'
        });
      };

      forward.onclick = function() {
        postMessage({
          type: 'forward'
        });
      };

      home.onclick = function() {
        postMessage({
          type: 'home'
        });
      };

      reload.onclick = function() {
        postMessage({
          type: 'reload'
        });
      };

//      reload.addEventListener(
//          'webkitAnimationIteration',
//          function() {
//            if (!isLoading) {
//              doc.body.classList.remove('loading');
//            }
//          }
//      );
//
//      terminate.onclick = function() {
//        iframe.terminate();
//      };

      locForm.onsubmit = function(e) {
        e.preventDefault();
        navigateTo(locInput.value);
      };
    }
    else
      controls.parentNode.removeChild(controls);

    appHome = iframe.src;
    serverOrigin = appHome.slice(0, appHome.indexOf('/', 8)); // cut off http(s)://
    iframeOrigin = serverOrigin + "/*";
    doLayout();

    window.addEventListener('message', function(e) {
      var origin = e.origin;
      if (origin !== serverOrigin)
        return;

      var data = e.data,
          type = data.type,
          rpc = /^rpc:/.test(type) ? type.slice(4) : null;

      logger.log("message from iframe: ", JSON.stringify(data));
      if (rpc) {
        var dotIdx = rpc.lastIndexOf('.');
        var parent = dotIdx == -1 ? RPC : leaf(RPC, rpc.slice(0, dotIdx));
        var fn = parent[rpc.slice(dotIdx + 1)];
        fn.apply(parent, data.args || []);
        return;
      };
    });

    iframe.addEventListener('exit', handleExit);
    window.addEventListener('focus', changeVisibility); // maybe use focusin/focusout?
    window.addEventListener('blur', changeVisibility);
    ready();
  };

  // var changeVisibility = _.debounce(function(e) {
  function changeVisibility(e) {
//    var newState = e.type === 'blur' ? 'hidden' : 'visible',
//        prev = visibilityState;
//
//    if (newState === visibilityState)
//      return;   
//
//    visibilityState = newState;
    var visible = e.type != 'blur';
    postMessage({
      type: 'visibility',
      visible: visible
    });
    
//    logger.log("page has become", visible ? 'visible' : 'hidden');
  }
  // }, 2000, true);

//  function handlePermissionRequest(e) {
//    if (e.url.indexOf(serverOrigin) != 0) {
//      e.request.deny();
//      return;
//    }
//    
//    var allowed = false;
//    if (e.permission === 'pointerLock' || e.permission ==='media' || e.permission === 'geolocation') {
//      allowed = true;
//      e.request.allow();
//    } else {
//      e.request.deny();
//    }
//
//    logger.log("["+e.target.id+"] permissionrequest: permission="+e.permission+" "+ (allowed?"allowed":"DENIED"));
//  };

  function postMessage(msg) {
    logger.log("sending msg to iframe", JSON.stringify(msg));
    iframe.contentWindow.postMessage(msg, iframeOrigin);
  };
  
  window.App = {
    iframeLoaded: iframeLoaded
  };
  
})(window, document);
