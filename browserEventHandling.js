    // cross-browser - getCurrentTarget
    function getTargetElement(evt) {
      var elem;
      if (evt.target) {
        if (evt.currentTarget && (evt.currentTarget != evt.target)) {
          if (evt.target.tagName && evt.target.tagName.toLowerCase() == 'input' && evt.target.type.toLowerCase() == 'checkbox')
            elem = evt.target;
          else
            elem = evt.currentTarget;
        }
        else
          elem = evt.target;
      }
      else {
        elem = evt.srcElement;
      }
      return elem;
    }

    /*
     * Cross-browser method of adding event handlers.
     * If useCapture is true - handler is registered for 'capture phase', otherwise for 'bubbling phase'.
     * Although IE6- does not support capture - so we always pass false.
     */
    function addEvent(obj, evType, fn, useCapture) {
      if (obj.getAttribute) {
	      var handler = obj.getAttribute('handler_' + evType);
	      if (handler && handler == fn) {
	        //alert("Error: duplicate " + evType + " event handler " + fn + " for " + obj.tagName + " with id " + obj.id);
	        return;
	      }
	      obj.setAttribute('handler_' + evType, fn);
	    }
      if (obj.addEventListener) { // NS
       obj.addEventListener(evType, fn, useCapture);
       return true;
      }
      else if (obj.attachEvent) { // IE
        var r = obj.attachEvent("on" + evType, fn);
        return r;
      }
      else {
        alert("You need to upgrade to a newer browser. Error: 'event handler could not be be added'");
      }
    }

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
        alert("You need to upgrade to a newer browser. Error: 'event handler could not be removed'");
      }
    }

    // returns true if the field was modified since the page load
    function wasFormFieldModified(elem) {
      var initialValue = getFormFieldInitialValue(elem);
      if (initialValue == null)
        return true; // assume it was modified if no info exists
      if (elem.value == initialValue) {
        //alert("not modified: elem.name: " + elem.name + ", initialValue: " + initialValue);
        return false;
      }
      else {
        //alert("modified: elem.name: " + elem.name + ", initialValue: " + initialValue);
        return true;
      }
    }
    // returns value of the field saved right after the page load (does not support multiple selections)
    function getFormFieldInitialValue(elem, attribute) {
      if (formInitialValues) {
        var formValues = formInitialValues[elem.form.name];
        if (formValues) {
          if (attribute)
            return formValues[elem.name + '.attributes.' + attribute];
          else
            return formValues[elem.name];
        }
      }
      return null;
    }

    //***** upon iframe loading inform the parent
    function onLoadPopup() {
      if (parent && parent.frameLoaded)
        parent.frameLoaded[window.name] = true;
    }

    //***** Add smartlistbox handlers
    function addHandlers() {
//      Packages.java.lang.System.out.println('onLoad 0: ' + new Date());
      if (window.parent != window) {
        onLoadPopup();
        return;
      }
//      Packages.java.lang.System.out.println('onLoad 1: ' + new Date());
      interceptLinkClicks();
//      Packages.java.lang.System.out.println('onLoad 2: ' + new Date());
      initListBoxes(null);
//      Packages.java.lang.System.out.println('onLoad 3: ' + new Date());
      uiFocus();
      addEventOnSchedule()
//      Packages.java.lang.System.out.println('onLoad 4: ' + new Date());
//      if (typeof searchHighlighting != 'undefined')
//        searchHighlighting();
//      if (typeof replaceAllTooltips != 'undefined')
//        replaceAllTooltips();
		// initialize the drag & drop engine.
		  dragobject.initialize();
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

    function addBooleanToggle(elem) {
      if (!elem)
        return;
      var elemId  = elem.id;
      if (!elemId)
	      return;

      var elemLen = elemId.length;
      if (elemId.indexOf("_boolean",         elemLen - "_boolean".length) != -1  ||
          elemId.indexOf("_boolean_refresh", elemLen - "_boolean_refresh".length) != -1) {
        addEvent(elem, 'click', changeBoolean, false);
        elem.style.cursor = 'pointer';
      }
    }

    /**
     * Change boolean value (in non-edit mode)
     */
    function changeBoolean(e) {
      var target;

      e = (e) ? e : ((window.event) ? window.event : null);
      if (!e)
        return;
      target = getTargetElement(e);
      var url = 'editProperties.html?submitUpdate=Submit+changes&User_Agent_UI=n&uri=';
      var bIdx = target.id.indexOf("_boolean");
      var rUri = target.id.substring(0, bIdx);
      var idx = rUri.lastIndexOf("_");
      var propShort = rUri.substring(idx + 1);
      rUri = rUri.substring(0, idx);
      var bUri = null;
      idx = rUri.indexOf(".$.");
      if (idx != -1) {
        bUri = rUri.substring(idx + 3);
        rUri = rUri.substring(0, idx);
      }
      var tooltip = target.getAttribute('tooltip');
      var pValue;
      if (tooltip  &&  tooltip.length != 0  &&  tooltip == "Yes")
        pValue = "No";
      else
        pValue = "Yes";
      target.setAttribute('tooltip', pValue);
      if (pValue == "Yes")
        target.src = target.getAttribute('yesIcon');
      else
        target.src = target.getAttribute('noIcon');
      url += encodeURIComponent(rUri) + "&" + propShort + "=" + pValue;
      if (bUri != null)
        url += "&bUri=" + encodeURIComponent(bUri);

      var listboxFrame = frames["popupFrame"];
      popupFrameLoaded = false;

      if (target.id.indexOf("_boolean_refresh") != -1) {
        var locationUrl = document.location.href;
        url += "&$returnUri=" + encodeURIComponent(locationUrl);
        document.location.replace(url);
      }
      else
        listboxFrame.location.replace(url); // load data from server into iframe
      if (Popup.tooltipPopup) {
        Popup.tooltipPopup.close();
        Popup.tooltipPopup = null;
      }
      //tooltipMouseOut0(target);           // remove and ...
      //tooltipMouseOver0(target);          // repaint the tooltip on this boolean icon
    }

    var formInitialValues;
    addEvent(window, 'load', function() {setTimeout(addHandlers,  10);}, false);

