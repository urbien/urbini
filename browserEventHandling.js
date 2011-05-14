	// Note: function addEvent was moved to Body to be able
	// to use it from embeded into a page JS code.

    function removeEvent(obj, evType, fn, useCapture) {
      if (obj.removeEventListener) {
        obj.removeEventListener(evType, fn, useCapture);
        return true;
      }
      else if (obj.detachEvent) {
        var r = obj.detachEvent("on" + evType, fn);
        return r;
      }
      else {
        alert("You need to upgrade to a newer browser. Error: event handler could not be removed");
      }
    }

    /*************************************
    * Initialization
    **************************************/
    // 1. initialization on DOM loaded.
    function onDomLoaded(event) {
      // 1.1 mobile
      if (typeof Mobile != 'undefined') {
        Browser.mobile = true;
        /* moved to onPageLoaded because of the applet initialization */
      }
      // 1.2. desktop
      else {
				setFooterOnPage();
				TabMenu.init();
				DragEngine.initialize();
        FlashHandler.init();
		    addSpellcheck();
		    DictionaryHandler.init();
		    Tooltip.init();

        if (typeof addEventOnSchedule != 'undefined') {
          addEventOnSchedule();
        }
      }

			// for both: mobile and desktop pages
			// note: mobile calls it for each "mobile page"
			FormProcessor.initForms();

		  // The URL bar is hidden when running on the iPhone.
		  if (navigator.userAgent.indexOf('iPhone') != -1) {
		    window.scrollTo(0, 1);
		  }
    }

    // 2. initialization on page loaded.
    function onPageLoaded(event) {
      // 2.1. mobile
      if (typeof Mobile != 'undefined') {
        Browser.mobile = true;
    
        BottomToolbar.init();
        Boost.init(event);
        Mobile.init(event);
		    MobilePageAnimation.init();
      }
      // 2.2. desktop
      else {
				// prevent exception while image uploading
				if (typeof WidgetRefresher != 'undefined')
					WidgetRefresher.init(); // requires more time - preloading
        /* other initializations in onDomLoaded */
      }
    }

    /*
    function resourceListEdit(div) {
      var elements;
      if (div)
        elements = div.getElementsByTagName('img');
      else
        elements = document.getElementsByTagName('img');
      llen = elements.length;
      for (var i=0;i<llen; i++) {
        var elem = elements[i];
        addBooleanToggle(elem);
      }
    }
    */

    
    /****************** assign onDomLoaded ****************/
    var agent = navigator.userAgent;
    var isGecko  = (agent.indexOf("Gecko") != -1 && agent.indexOf("Safari") == -1 && agent.indexOf("Konqueror") == -1);
    var versionindex = agent.indexOf("Opera") + 6;
    var ver = agent.substring(versionindex);
    var v = parseFloat(ver);
    var isOpera9 = (typeof opera != 'undefined') && (v >= 9);

    if (isOpera9 || isGecko) {
      document.addEventListener("DOMContentLoaded", onDomLoaded, false);
    }
    else if (typeof document.readyState != 'undefined') { // WebKit & IE
      var _timer = setInterval(function() {
          if (/loaded|complete/.test(document.readyState)) {
              clearInterval(_timer);
              onDomLoaded();
          }
      }, 10);
    }
    else {
      addEvent(window, 'load', onDomLoaded, false);
    }
       
      
    /****************** assign onPageLoaded ****************/
    addEvent(window, 'load', onPageLoaded, false);

