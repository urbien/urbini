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

    function interceptLinkClicks() {
      //addEvent(document, 'keydown', onKeyDown, false);
      //addEvent(document, 'keyup',   onKeyUp,   false);

      var llen = document.links.length;
      for (i=0;i<llen; i++) {
        addEvent(document.links[i], 'click',   onClick,   false);
      }
    }

    var detectClick;
    function onKeyDown(e) {
      detectClick = false;
    }
    function onKeyUp(e) {
      if (detectClick) {
        return false;
      }
    }

    /**
     * Registered to receive control on a click on any link.
     * Adds control key modifier as param to url, e.g. _ctrlKey=y
     */
    function onClick(e) {
      detectClick = true;
      var url;
      var p;
      var target;

      e = (e) ? e : ((window.event) ? window.event : null);
      if (!e)
        return;

      target = getTargetElement(e);
      url = getTargetAnchor(e);
      if (!url)
        return;

      removeModifier(url, '_shiftKey=y');
      removeModifier(url, '_ctrlKey=y');
      removeModifier(url, '_altKey=y');
      urlStr = url.href;

      if     (e.ctrlKey) {
        p = '_ctrlKey=y';
      }
      else if(e.shiftKey) {
        p = '_shiftKey=y';
      }
      else if(e.altKey) {
        p = '_altKey=y';
        var frameId = 'bottomFrame';
        var bottomFrame = frames[frameId];
        // show content in a second pane
        //
        if (bottomFrame) {
          var finalUrl = urlStr;
          var idx = urlStr.indexOf('.html');
          if (idx != -1) {
            var idx1 = urlStr.lastIndexOf('/', idx);
            finalUrl = urlStr.substring(0, idx1 + 1) + 'plain/' + urlStr.substring(idx1 + 1);
          }

          bottomFrame.location.replace(finalUrl + "&hideComments=y&hideMenu=y&hideNewComment=y&hideHideBlock=y");
          e.cancelBubble = true;
          e.returnValue = false;
          if (e.preventDefault)  e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
          return false;
        }
      }

      if (p) {
        if (!url) {
          alert("onClick(): can't process control key modifier since event currentTarget is null: " + url);
          return;
        }
        else if(!url.href || url.href == null) {
          alert("onClick(): can't process control key modifier since event currentTarget.href is null: " + url.href);
          return;
        }
        addUrlParam(url, p, null);
        document.location.href = url.href;
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.preventDefault)  e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
      }
    }

    function addUrlParam(url, param, target) {
      if (!url)
        return;
      if (!url.href)
        return;
      if (url.href.indexOf('?') == -1) {
        url.href = url.href + '?' + param;
        if (target)
          url.target = target;
      }
      else {
        url.href = url.href + '&' + param;
        if (target)
          url.target = target;
      }
    }

    // cross-browser - getCurrentTarget
    function getTargetAnchor(evt) {
      var elem;
      if (evt.target) {
        if (evt.currentTarget && (evt.currentTarget != evt.target))
          elem = evt.currentTarget;
        else
          elem = evt.target;
      }
      else {
        elem = evt.srcElement;
        elem = getANode(elem);

      }
      return elem;
    }

    function getANode(elem) {
      var e;

      if (elem.tagName.toUpperCase() == 'A') {
        if (elem.href)
          return elem;
        else
          return null;
      }

      e = elem.parentNode;
      if (e)
        return getANode(e);
      else
        return null;
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

    //***** Add smartlistbox handlers
    function addHandlers() {
      addEvent(window, 'load', function() {setTimeout(interceptLinkClicks, 0);}, false);
      if (typeof replaceAllTooltips != 'undefined')
        addEvent(window, 'load', function() {setTimeout(replaceAllTooltips,  0);}, false);
      //addEvent(window, 'unload', function() {java.lang.System.out.println("unload");}, false);

      /* this function supposed to fix a problem (with above functions) on Mac IE5
       * but it fails on Win IE6 ... so may be somebody can figure it out - see source of info:
       * http://simon.incutio.com/archive/2004/05/26/addLoadEvent
       */
      /*function addLoadEvent(func) {
          var oldonload = window.onload;
          if (typeof window.onload != 'function') {
            window.onload = func;
          }
          else {
            window.onload = function() {
              oldonload();
              func();
            }
          }
        }
      */

      if (window.parent != window)
        return;
      initMenus();
      // add handler to smartlistbox images
      if (typeof listboxOnClick != 'undefined') {
        var images = document.images;
        for (i=0; i<images.length; i++) {
          var image = images[i];
          if (image.id.indexOf("_filter", image.id.length - "_filter".length) == -1)
            continue;
          addEvent(image, 'click', listboxOnClick, false);
        }
      }

      // 1. add handler to autocomplete filter form text fields
      // 2. save initial values of all fields
      if (typeof autoComplete == 'undefined')
        return;
      var forms = document.forms;
      formInitialValues = new Array(forms.length);
      for (i=0; i<forms.length; i++) {
        var form = forms[i];
        var initialValues = new Array(form.elements.length);
        formInitialValues[form.name] = initialValues;
        if (form.id != 'filter')
          continue;
        addEvent(form, 'submit', popupOnSubmit, false);
        for (j=0; j<form.elements.length; j++) {
          var elem = form.elements[j];
          initialValues[elem.name] = elem.value;

          if (!elem.type || elem.type.toUpperCase() == 'TEXT' &&  // only on TEXT fields
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
      addEvent(window, 'load', function() {setTimeout(resourceListEdit,  0);}, false);
    }

    function resourceListEdit() {
      var elements = document.getElementsByTagName('img');
      llen = elements.length;
      for (i=0;i<llen; i++) {
        var elem = elements[i];
        if (elem.id  &&  elem.id.indexOf("_boolean", elem.id.length - "_boolean".length) != -1) {
          addEvent(elem, 'click', markedAsRead, false);
          elem.style.cursor = 'pointer';
        }
      }
    }

    function markedAsRead(e) {
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
      tooltipMouseOut0(target);           // remove and ...
      tooltipMouseOver0(target);          // repaint the tooltip on this boolean icon
    }

    var formInitialValues;
    addHandlers();