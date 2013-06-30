(function(window, doc) {
  var bgPage,
  runtimeId,
//  connected = false,
  webviewPinger,
  serverOrigin,
  appHome,
  webviewOrigin,
  tabId,
  isLoading = false,
  SHOW_BUTTONS = true,
//  visibilityState,

  /* START HTML elements / JQuery objects */
  webview,
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
      console.log.apply(console, args);
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
        var notification = leaf(navigator, this._path)(title, desc, iconURL);
        if (callbacks) {
          for (var cbName in callbacks) {            
            notification[cbName] = getCallback(cbName);
          }
        }
        
        notification.show();
      }
    },
    register: getPushReqHandler(),
    unregister: getPushReqHandler(),
    registrations: getPushReqHandler(),
    setMessageHandler: function(messageType, callbackEvent) {
      navigator.mozSetMessageHandler(messageType, getCallback(event));
    }
  },
  $ = function() {
    return document.querySelector.apply(document, arguments);
  };

  navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia;
  window.onresize = doLayout;
  setPaths(RPC);
  install();
  
  function install() {
    var req = navigator.mozApps.getSelf();
    req.onsuccess = function() {
      if (req.result) {
        // we're installed
        console.log('already installed');
      } else {
        // not installed
        navigator.mozApps.install('/manifest.webapp');
        req.onsuccess = function() {
          console.log("app installed successfully");
          initPush();
        };
        
        req.onerror = function(errObj) {
          console.log("Couldn't install app (" + errObj.code + ") " + errObj.message);
        };
      }
    }
    
    req.onerror = function(err) {
      console('Error checking installation status: ' + err.message);
    };    
  };

  function getPushReqHandler(obj, method) {
    return function() {
      return handleDomReqRPC.apply(null, [obj[method], obj].concat(args));
    }
  };

  function handleDomReqRPC(fn, context) {
    var args = arguments,
        successEvent = args[args.length - 1],
        errorEvent = args[args.length - 1];
    
    args = [].slice.call(args, 2, args.length - 2);
    var req = fn.apply(context, args);
    req.onsuccess = function() {
      getCallback(successEvent)(req.result);
    };
    
    req.onerror = getCallback(errorEvent);
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
    webview.src = url;
  }

  function doLayout() {
    var controlsHeight = controls ? controls.offsetHeight : 0;
    var windowWidth = doc.documentElement.clientWidth;
    var windowHeight = doc.documentElement.clientHeight;
    var webviewWidth = windowWidth;
    var webviewHeight = windowHeight - controlsHeight;

    webview.style.width = webviewWidth + 'px';
    webview.style.height = webviewHeight + 'px';

    // var sadWebview = $('#sad-webview');
    // sadWebview.style.width = webviewWidth + 'px';
    // sadWebview.style.height = webviewHeight * 2/3 + 'px';
    // sadWebview.style.paddingTop = webviewHeight/3 + 'px';
  }

  function handleExit(event) {
    console.log(event.type);
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
      locInput.value = webview.src;
      return;
    }

    locInput.value = event.url || webview.src;

//    back.disabled = !webview.canGoBack();
//    forward.disabled = !webview.canGoForward();
  }

  function handleLoadStart(event) {
    doc.body.classList.add('loading');
    isLoading = true;

    resetExitedState();
    if (!event.isTopLevel) {
      locInput.value = webview.src;
      return;
    }
    
//    var url = event.url,
//        parsed = parseUrl(url);
//    
//    if (!parsed.params) {
//      url += '?-webview=y';
//      navigateTo(url);
//      return false;
//    }
//    else if (parsed.params && !parsed.params['-webview']) {
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
    console.log('  loadAbort');
    console.log('  url: ' + event.url);
    console.log('  isTopLevel: ' + event.isTopLevel);
    console.log('  type: ' + event.type);
  }

  function handleLoadRedirect(event) {
    resetExitedState();
    if (!event.isTopLevel) {
      return;
    }

    locInput.value = event.newUrl;
  }

  window.onload = function() {
    controls = $('#controls');
    webview = $('#iframe');
    if (SHOW_BUTTONS) { 
      back = $('#back');
      forward = $('#forward');
      reload = $('#reload');
      home = $('#home');
//      terminate = $('#terminate');
      locInput = $('#location');
      locInput.value = webview.src;
      locForm = $('#location-form');

      back.onclick = function() {
        webview.contentWindow.history.back();
      };

      forward.onclick = function() {
        webview.contentWindow.history.forward();
      };

      home.onclick = function() {
        navigateTo(appHome);
      };

      reload.onclick = function() {
        if (isLoading) {
//          webview.stop();
        } else {
          navigateTo(webview.src);
        }
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
//        webview.terminate();
//      };

      locForm.onsubmit = function(e) {
        e.preventDefault();
        navigateTo(locInput.value);
      };
    }
    else
      controls.parentNode.removeChild(controls);

    appHome = webview.src;
    serverOrigin = appHome.slice(0, appHome.indexOf('/', 8)); // cut off http(s)://
    webviewOrigin = serverOrigin + "/*";
    doLayout();

    window.addEventListener('message', function(e) {
      var origin = e.origin;
      if (origin !== serverOrigin)
        return;

      var data = e.data,
          type = data.type,
          rpc = /^rpc:/.test(type) ? type.slice(4) : null;

      console.log("message from iframe: ", JSON.stringify(data));
      if (rpc) {
        var dotIdx = rpc.lastIndexOf('.');
        var parent = dotIdx == -1 ? RPC : leaf(RPC, rpc.slice(0, dotIdx));
        var fn = parent[rpc.slice(dotIdx + 1)];
        fn.apply(parent, data.args || []);
        return;
      };
    });

    webview.addEventListener('exit', handleExit);
    webview.onload = function() {
      postMessage({
        type: 'ready'
      });
    };
    
    window.addEventListener('focus', changeVisibility); // maybe use focusin/focusout?
    window.addEventListener('blur', changeVisibility);
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
    
    console.log("page has become", visible ? 'visible' : 'hidden');
  }
  // }, 2000, true);

  function handlePermissionRequest(e) {
    if (e.url.indexOf(serverOrigin) != 0) {
      e.request.deny();
      return;
    }
    
    var allowed = false;
    if (e.permission === 'pointerLock' || e.permission ==='media' || e.permission === 'geolocation') {
      allowed = true;
      e.request.allow();
    } else {
      e.request.deny();
    }

    console.log("["+e.target.id+"] permissionrequest: permission="+e.permission+" "+ (allowed?"allowed":"DENIED"));
  };

  function postMessage(msg) {
    webview.contentWindow.postMessage(msg, webviewOrigin);
  };
})(window, document);
