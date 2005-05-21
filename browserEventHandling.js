    // cross-browser - getCurrentTarget
    function getTargetElement(evt) {
      var elem;
      if (evt.target) {
        if (evt.currentTarget && (evt.currentTarget != evt.target)) {
          if (evt.target.tagName.toLowerCase() == 'input' && evt.target.type.toLowerCase() == 'checkbox')
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
     * Generic cross-browser method of adding event handlers
     * taken from: http://www.scottandrew.com/weblog/jsjunk#events
     */
    function addEvent(obj, evType, fn, useCapture) {
      if (obj.addEventListener) { // NS
       obj.addEventListener(evType, fn, useCapture);
       return true;
      } else if (obj.attachEvent) { // IE
        var r = obj.attachEvent("on" + evType, fn);
        return r;
      } else {
        alert("You need to upgrade to a newer browser. Error: 'handler could not be attached'");
      }
    }
    function removeEvent(obj, evType, fn, useCapture) {
      if (obj.removeEventListener) {
        obj.removeEventListener(evType, fn, useCapture);
        return true;
      } else if (obj.detachEvent) {
        var r = obj.detachEvent("on" + evType, fn);
        return r;
      } else {
        alert("You need to upgrade to a newer browser. Error: 'handler could not be removed'");
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

    /**
     * remove modifier, like ctrl_y
     */
    function removeModifier(url, param) {
      var urlStr = url.href;
      var idx = urlStr.indexOf(param);
      if (idx == -1)
        return url;

      var len = param.length;
      if (urlStr.charAt(idx - 1) == '&') {
        idx--;
        len++;
      }

      var uBefore = urlStr.substring(0, idx);
      var uAfter  = urlStr.substring(idx + len);
      urlStr = uBefore + uAfter;
      url.href = urlStr;
      // alert('before='+uBefore + ', after=' + uAfter);
    }

    //***** upon iframe loading inform the parent 
    function onLoadPopup() {
      parent.frameLoaded[window.name] = true;
    }
    
    //***** Add smartlistbox handlers
    function addHandlers() {
      setTimeout(interceptLinkClicks, 0);
      if (window.parent != window) {
        setTimeout(onLoadPopup, 0);
        return;
      }
      if (typeof replaceAllTooltips != 'undefined')
        setTimeout(replaceAllTooltips, 0);
      setTimeout(initMenus, 0);      
      setTimeout("initListBoxes(null)", 0);
      setTimeout(resourceListEdit, 0);
    }

    function resourceListEdit() {
      var elements = document.getElementsByTagName('img');
      llen = elements.length;
      for (var i=0;i<llen; i++) {
        var elem = elements[i];
        if (elem.id  &&  elem.id.indexOf("_boolean", elem.id.length - "_boolean".length) != -1) {
          addEvent(elem, 'click', changeBoolean, false);
          elem.style.cursor = 'pointer';
        }
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
      var url = 'editProperties.html?submit=Submit+changes&User_Agent_UI=n&uri=';

      var rUri = target.id.substring(0, target.id.length - "_boolean".length);
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
      listboxFrame.location.replace(url); // load data from server into iframe
      if (Popup.tooltipPopup) {
        Popup.tooltipPopup.close();
        Popup.tooltipPopup = null;
      }
      //tooltipMouseOut0(target);           // remove and ...
      //tooltipMouseOver0(target);          // repaint the tooltip on this boolean icon
    }

    function initListBoxes(div) {
      // add handler to smartlistbox images
      if (typeof listboxOnClick == 'undefined')
        return;

      var images;
      if (div)
        images = div.getElementsByTagName('img');
      else
        images = document.images;
      for (var i=0; i<images.length; i++) {
        var image = images[i];
        if (image.id.indexOf("_filter", image.id.length - "_filter".length) == -1)
          continue;
        addEvent(image, 'click', listboxOnClick, false);
      }

      // 1. add handler to autocomplete filter form text fields
      // 2. save initial values of all fields
      if (typeof autoComplete == 'undefined')
        return;
      var forms;
      if (div)
        forms = div.getElementsByTagName('form');
      else
        forms = document.forms;
      formInitialValues = new Array(forms.length);
      for (var i=0; i<forms.length; i++) {
        var form = forms[i];
        var initialValues = new Array(form.elements.length);
        formInitialValues[form.name] = initialValues;
        if (form.id != 'filter')
          continue;
        addEvent(form, 'submit', popupOnSubmit, false);
        for (j=0; j<form.elements.length; j++) {
          var elem = form.elements[j];
          initialValues[elem.name] = elem.value;

          if (elem.type && elem.type.toUpperCase() == 'TEXT' &&  // only on TEXT fields
              elem.id  && !elem.valueType) {                      // and those that have ID
            addEvent(elem, 'keypress', autoComplete,              false);
            addEvent(elem, 'keydown',  autoCompleteOnKeyDown,     false);
            addEvent(elem, 'focus',    autoCompleteOnFocus,       false);
            addEvent(elem, 'blur',     autoCompleteOnBlur,        false);
            addEvent(elem, 'mouseout', autoCompleteOnMouseout,    false);
            //addEvent(elem, 'change',   onFormFieldChange, false);
            //addEvent(elem, 'blur',     onFormFieldChange, false);
            //addEvent(elem, 'click',    onFormFieldClick,  false);
          }
          else if (elem.type && elem.type.toUpperCase() == 'TEXTAREA') {
            var rows = elem.attributes['rows'];
            var cols = elem.attributes['cols'];
            if (rows)
              initialValues[elem.name + '.attributes.rows'] = rows.value;
            if (cols)
              initialValues[elem.name + '.attributes.cols'] = cols.value;
            if (!elem.value || elem.value == '') {
              elem.setAttribute('rows', 1);
              elem.setAttribute('cols', 10);
              //elem.attributes['cols'].value = 10;
              addEvent(elem, 'focus', textAreaOnFocus,  false);
              addEvent(elem, 'blur',  textAreaOnBlur,   false);
            }
          }
        }
      }
    }

    var formInitialValues;
    addEvent(window, 'load', function() {setTimeout(addHandlers,  200);}, false);
    