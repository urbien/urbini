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

      //urlStr = removeModifier(url, '_shiftKey=y');
      removeModifier(url, '_ctrlKey=y');
      //urlStr = removeModifier(url, '_altKey=y');
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
  
    addEvent(window, 'load', function() {setTimeout(interceptLinkClicks, 0);}, false);
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
    
   var formInitialValues;
   if (window.parent == window) {
     //initMenus();
     // add handler to smartlistbox images  
     if (typeof onClickPopup != 'undefined') {
       var images = document.images;
       for (i=0; i<images.length; i++) {
         var image = images[i];
         if (image.id.indexOf("_filter") == -1)
           continue;
         addEvent(image, 'click', onClickPopup, false);
       }  
     }
     
     // 1. add handler to autocomplete filter form text fields
     // 2. save initial values of all fields
     if (typeof autoComplete != 'undefined') {
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
                      
           if (elem.type.toUpperCase() == 'TEXT' && // only on TEXT fields 
               elem.id) {                                         // and those that have ID
             addEvent(elem, 'keypress', autoComplete,              false);
             addEvent(elem, 'keydown',  autoCompleteOnKeyDown,     false);
             addEvent(elem, 'focus',    autoCompleteOnFocus,       false);
             addEvent(elem, 'blur',     autoCompleteOnBlur,        false);
             addEvent(elem, 'mouseout', autoCompleteOnMouseout,    false);
             //addEvent(elem, 'change',   onFormFieldChange, false);
             //addEvent(elem, 'blur',     onFormFieldChange, false);
             //addEvent(elem, 'click',    onFormFieldClick,  false);
           }
           else if (elem.type.toUpperCase() == 'TEXTAREA') {
             initialValues[elem.name + '.attributes.rows'] = elem.attributes['rows'].value;
             initialValues[elem.name + '.attributes.cols'] = elem.attributes['cols'].value;
             if (!elem.value || elem.value == '') {
               elem.attributes['rows'].value = 1;
               elem.attributes['cols'].value = 10;
               addEvent(elem, 'focus', textAreaOnFocus,  false);
               addEvent(elem, 'blur',  textAreaOnBlur,   false);
             }  
           }
         }
       }  
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
   function getFormFieldInitialValue(elem) {
     if (formInitialValues) {
       var formValues = formInitialValues[elem.form.name];
       if (formValues) {
         var value = formValues[elem.name];
//         alert("formValues[" + elem.name + "]=" + formValues[elem.name]);         
         return value;
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
     //alert('before='+uBefore + ', after=' + uAfter);
   }

   
   /*********************************** Tootltips ************************************/
   function replaceTooltips(divRef) {
     var llen;
     var images;
     images = divRef.getElementsByTagName('img');
     llen = images.length;
     for (i=0;i<llen; i++) { 
       addEvent(images[i], 'mouseout',    tooltipMouseOut,    false);
       addEvent(images[i], 'mouseover',   tooltipMouseOver,   false);
     } 
   }

   function replaceAllTooltips() {
     var llen;
     var images;
     images = document.images;
     llen = document.images.length;
     for (i=0;i<llen; i++) { 
       addEvent(images[i], 'mouseout',    tooltipMouseOut,    false);
       addEvent(images[i], 'mouseover',   tooltipMouseOver,   false);
     } 
   }
   function tooltipMouseOver(e) {
     var p;
     var target;

     e = (e) ? e : ((window.event) ? window.event : null);
     if (!e)
       return;

     target = getTargetElement(e);
     var tooltip = target.attributes['tooltip'];
     var tooltipText;
     if (!tooltip) {
       tooltip = target.attributes['title'];
       if (tooltip) {
         tooltipText = tooltip.value;
         if (tooltipText == '')
           return true;
         target.setAttribute('tooltip', tooltipText);
         target.setAttribute('title', null);
         target.removeAttribute('title');
         var t = target.attributes['title'];
         target.title = '';
       }
     }
     else
       tooltipText = tooltip.value;
     if (tooltip) {
       var tooltipDiv = document.getElementById('system_tooltip');
       if (!tooltipDiv)
         return true;
       tooltipDiv.innerHTML = tooltipText;
       if (tooltipDiv.style.width != '') {
         alert(tooltipDiv.style.width);
       }  
       //setTimeout("setDivVisible1('" + tooltipDiv.id + "', '" + target + "', 7, 12)", 100);
       var ifrRef = document.getElementById('tooltipIframe');
       setDivVisible(tooltipDiv, target, 7, 12, ifrRef);
     } 
     e.cancelBubble = true;
     e.returnValue = false;
     if (e.preventDefault) e.preventDefault();         
     return false;
   }

   function tooltipMouseOut(e) {
     var tooltipDiv = document.getElementById('system_tooltip');
     var ifrRef = document.getElementById('tooltipIframe');
     
     setDivInvisible(tooltipDiv, ifrRef);
     return false;
   }

