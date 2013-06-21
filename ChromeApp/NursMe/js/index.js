(function(window, doc) {
var bgPage,
  runtimeId,
	serverOrigin,
	appHome,
	webviewOrigin,
	tabId,
	isLoading = false,
	SHOW_BUTTONS = true,
    visibilityState,
    
    /* START HTML elements / JQuery objects */
    webview,
    $webview, 
    webviewWindow,
    $window = $(window), 
    controls,
    $controls,
    $locInput,
    locInput,
    $back,
    $forward,
    $home,
    $reload,
    $terminate,
    $locForm,
    $mediaHolder,
    /* END   HTML elements / JQuery objects */
    
    echo,
    channelId,
    userId,
    connection,
    webrtc,
    localStream,
    mediaConfig,
    dataChannelEvents = ['dataOpen', 'dataClose', 'dataError', 'dataMessage'],
    objectConstructor = {}.constructor,
    RPC = {
      startWebRTC: startWebRTC,
      setAttribute: function(sel, attribute, value) {
        $(sel).setAttribute(attribute, value);
      },
      showMedia: showMedia,
      hideMedia: hideMedia,
//      focus: function() {
//        chrome.tabs.update(tabId, {active: true}); // tabs are not available in packaged apps, only extensions
//      },
  	  notifications: {
    		/**
    		 * @param callback - a message type to send back when the notification has been created
    		*/
    		create: function(id, options, callback) {
    			if (callback) {
    				var eventName = callback;
    				callback = getCallback(eventName);
    			}
    			else
    			  callback = doNothing;
    			
    			leaf(chrome, this._path)(id, options, callback);
    		},
    		onButtonClicked: function(callbackEvent) {
    			var callback = getCallback(callbackEvent);
    			leaf(chrome, this._path).addListener(callback);
    		},
        onClicked: function(callbackEvent) {
          var callback = getCallback(callbackEvent);
          leaf(chrome, this._path).addListener(callback);
        },
        onDisplayed: function(callbackEvent) { 
          var callback = getCallback(callbackEvent);
          leaf(chrome, this._path).addListener(callback);
        },
        onClosed: function(callbackEvent) {
          var callback = getCallback(callbackEvent);
          leaf(chrome, this._path).addListener(callback);
        }
  	  }
    };

  chrome.runtime.getBackgroundPage(function(page) {
    bgPage = page;
    channelId = bgPage.channelId;
    tabId = bgPage.tabId;
    if (!channelId) {
      bgPage.addEventListener('gotChannelId', function(id) {
        channelId = id;
      });
    }
    
    runtimeId = bgPage.runtimeId;
  });
    
  chrome.runtime.onMessage.addListener(
    function(msg, sender, sendResponse) {
      if (sender.id == runtimeId) {
        if (msg.type === 'push')
          postMessage(msg);
        
        sendResponse({"result": "OK"});
      } else {
        sendResponse({"result": "Sorry, you're not on the whitelist, message ignored"});
      }
    }
  );
  
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  window.onresize = doLayout;
  setPaths(RPC);

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

    $webview.width(webviewWidth + 'px');
    $webview.height(webviewHeight + 'px');
    $webview.css('z-index', 1);

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
      return;
    }

    locInput.value = event.url;

    back.disabled = !webview.canGoBack();
    forward.disabled = !webview.canGoForward();
  }

  function handleLoadStart(event) {
    webviewWindow = webviewWindow || webview.contentWindow;
    doc.body.classList.add('loading');
    isLoading = true;

    resetExitedState();
    if (!event.isTopLevel)
      return;

    locInput.value = event.url;
  }
  
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
    if (SHOW_BUTTONS) { 
      $back = $('#back');
      $forward = $('#forward');
      $reload = $('#reload');
      $home = $('#home');
      $terminate = $('#terminate');
      $controls = $('#controls');
      controls = $controls[0];
      $locInput = $('#location');
      locInput = $locInput[0];
      $locForm = $('#location-form');
      
      $back.click(function() {
        webview.back();
      });

      $forward.click(function() {
        webview.forward();
      });

      $home.click(function() {
        navigateTo(appHome);
      });

      $reload.click(function() {
        if (isLoading) {
          webview.stop();
        } else {
          webview.reload();
        }
      });
      
      $reload.bind(
        'webkitAnimationIteration',
        function() {
          if (!isLoading) {
            doc.body.classList.remove('loading');
          }
        }
      );

      $terminate.click(function() {
        webview.terminate();
      });

      $locForm.submit(function(e) {
        e.preventDefault();
        navigateTo(locInput.value);
      });
    }
    else
      $('#controls').remove();
    
    $webview = $('#webview');
    webview = $webview[0];
    appHome = webview.src;
    serverOrigin = appHome.slice(0, appHome.indexOf('/', 8)); // cut off http(s)://
    webviewOrigin = serverOrigin + "/*";
    
    $mediaHolder = $('#media');
    
    $mediaHolder.click(function() {
      hideMedia();
    });
    
    doLayout();

    window.addEventListener('message', function(e) {
      var origin = e.origin;
      if (origin !== serverOrigin)
        return;
        
      var data = e.data,
        type = data.type,
        rpc = /^rpc:/.test(type) ? type.slice(4) : null;
        
      if (rpc) {
		var dotIdx = rpc.lastIndexOf('.');
		var parent = dotIdx == -1 ? RPC : leaf(RPC, rpc.slice(0, dotIdx));
		var fn = parent[rpc.slice(dotIdx + 1)];
        fn.apply(parent, data.args || []);
        return;
      };
    });

    $webview.bind('exit', handleExit);
    $webview.bind('loadstart', handleLoadStart);
    $webview.bind('loadstop', handleLoadStop);
    $webview.bind('loadabort', handleLoadAbort);
    $webview.bind('loadredirect', handleLoadRedirect);
    $webview.bind('loadcommit', handleLoadCommit);
    $webview.bind('loadstop', sendChannelId);
    $webview.bind('permissionrequest', handlePermissionRequest);
    $window.focus(changeVisibility).blur(changeVisibility);
  };

    // var changeVisibility = _.debounce(function(e) {
    function changeVisibility(e) {
	  var newState = e.type === 'blur' ? 'hidden' : 'visible',
		  prev = visibilityState;
		
      if (newState === visibilityState)
		return;	  
		
	  visibilityState = newState;
      console.log("page has become", newState);
	  if (webrtc) {
		  var webRTCEvent = newState === 'hidden' ? 'sleep' : 'wake';
		  if (webrtc.sessionReady)
			webrtc._emit(webRTCEvent);
	      else {
		    webrtc.on('ready', function() {
			  webrtc._emit(webRTCEvent);
			});
		  }
	  }
	}
    // }, 2000, true);

  /**
   *  send this on every loadstop, as we have a one page app and it needs channelId every time the page is reloaded
  **/
  function sendChannelId(e) {
    if (channelId)
      _sendChannelId(channelId);
    else {
      bgPage.addEventListener('gotChannelId', function(e) {
        _sendChannelId(e.channelId);
      });
    }
  };

  function handlePermissionRequest(e) {
    debugger;
    var allowed = false;
    if (e.permission==='pointerLock' || e.permission==='media' || e.permission==='geolocation') {
      allowed = true;
      e.request.allow();
    } else {
      e.request.deny();
    }
    
    console.log("["+e.target.id+"] permissionrequest: permission="+e.permission+" "+ (allowed?"allowed":"DENIED"));
  };

  function _sendChannelId(channelId) {
    postMessage({
      type: 'channelId',
      channelId: channelId
    });    
  }
  
  function postMessage(msg) {
    webviewWindow.postMessage(msg, webviewOrigin);
  };
  
  function forwardWebRTCEvent(eventName) {
    webrtc.on(eventName, function(event, conversation) {
    _forwardWebRTCEvent(eventName, event, conversation);
    });
  }
  
  function _forwardWebRTCEvent(eventName) {
    var args = [],
      msg = {
        type: 'webrtc:' + eventName,
        args: args
      };
    
    for (var i = 1; i < arguments.length; i++) {
      args.push(shallowCopy(arguments[i]));
    }
      
    postMessage(msg);
  };
  
  function startWebRTC(config) {
    webrtc = RPC.webrtc = new WebRTC(config);
    mediaConfig = webrtc.config;
    conversations = webrtc.pcs;
    forwardWebRTCEvent('ready');      
    forwardWebRTCEvent('readyToCall');
    forwardWebRTCEvent('userid');
    webrtc.on('mediaAdded', function(info, conversation) {
      if (info.type == 'remote')
        $('#localMedia video').addClass('overlay');
      else
        localStream = info.stream;

      showMedia();
      _forwardWebRTCEvent('mediaAdded', info, conversation);
    });

    webrtc.on('mediaRemoved', function(info, conversation) {
      if (info.type == 'remote') {
        if (!$('#remoteMedia video').length) {
          $('#localMedia video').removeClass('overlay');
        }
      }

      _forwardWebRTCEvent('mediaAdded', info, conversation);
    });

    forwardWebRTCEvent('mediaRemoved');
    
    if (webrtc.config.data !== false) {
      forwardWebRTCEvent('dataOpen');
      forwardWebRTCEvent('dataClose');
      forwardWebRTCEvent('dataError');
      forwardWebRTCEvent('dataMessage');
    }
    
    if (haslocalMedia() && localStream && !localStream.ended) {
      webrtc.startLocalMedia(localStream);
    }
  }
  
  function stopWebRTC() {
    if (webrtc)
      webrtc.leaveRoom();
  }
  
  function haslocalMedia() {
    var vConfig = mediaConfig && mediaConfig.video;
    return !vConfig || vConfig.preview || vConfig.send;
  };
  
  function hideMedia() {
    $webview.fadeTo(600, 1);
    $controls && $controls.fadeTo(600, 1);
    $mediaHolder.fadeTo(600, 0, function() {
      $mediaHolder.css('z-index', 0);
      $webview.css('z-index', 1);
      if ($controls) {
		$controls.css('z-index', 1);
		$mediaHolder.find('video').css('top', controls.offsetHeight);
	  }
    });
  }

  function showMedia() {
    $mediaHolder.fadeTo(600, 1);
	if ($controls)
	  $mediaHolder.find('video').css('top', 0);
    $webview.fadeTo(600, 0, function() {
      $mediaHolder.css('z-index', 1);
      $webview.css('z-index', 0);
      if ($controls)
		$controls.css('z-index', 0);
    });
  }
  
  chrome.runtime.onSuspend.addListener(function() {
    stopWebRTC();
  });
})(window, document);
