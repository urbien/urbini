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
      var llen = document.links.length;
      for (i=0;i<llen; i++) { 
        addEvent(document.links[i], 'click', onClick, false);
      }       
    }
   
    /**
     * Registered to receive control on a click on any link.
     * Adds control key modifier as param to url, e.g. _ctrlKey=y 
     */
    function onClick(e) {
      var url;
      var p;
      var target;

      e = (e) ? e : ((window.event) ? window.event : null);
      if (!e)
        return;

      target = getTargetElement(e);
/*
      p = target.parentNode;
      if (p.tagName.indexOf("smart_") == 0) {
        onClickListBox(e);
        return;
      }
*/
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
          url = getTargetAnchor(e);

          bottomFrame.location.href = url + "&pda=T&hideComments=y&hideMenu=y&hideNewComment=y&hideHideBlock=y";
// do not do it here - let iframe do it upon loading
//            document.getElementById('pane2').innerHTML = bottomFrame.document.body.innerHTML; //firstChild.nodeValue
          return false;
        }
      }
      else
        return;
      url = getTargetAnchor(e);
      if (p) {
        if (!url) {
          alert("onClick(): can't process control key modifier since event currentTarget is null: " + url);
          return;
        }
        else if(!url.href || url.href == null) {
          alert("onClick(): can't process control key modifier since event currentTarget.href is null: " + url.href);
          return;
        }
        addUrlParam(url, p, target);
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


    // cross-browser - getCurrentTarget 
    function getTargetElement(evt) {
      var elem;
      if (evt.target) {
        if (evt.currentTarget && (evt.currentTarget != evt.target))
          elem = evt.currentTarget;
        else
          elem = evt.target;
      } 
      else {
        elem = evt.srcElement;
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
               elem.id) {                           // and those that have ID
         //    addEvent(elem, 'keypress', autoComplete,              false);
         //    addEvent(elem, 'keydown',  autoCompleteOnKeyDown,     false);
         //    addEvent(elem, 'focus',    autoCompleteOnFocus,       false);
         //    addEvent(elem, 'blur',     autoCompleteOnBlur,        false);
         //    addEvent(elem, 'mouseout', autoCompleteOnMouseout,    false);
             //addEvent(elem, 'change',   onFormFieldChange, false);
             //addEvent(elem, 'blur',     onFormFieldChange, false);
             //addEvent(elem, 'click',    onFormFieldClick,  false);
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
       alert("modified: elem.name: " + elem.name + ", initialValue: " + initialValue);           
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

