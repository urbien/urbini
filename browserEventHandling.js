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

   /* load bottomFrame iframe into a pane2 */
   function loadPane2() {
     loadDiv('bottomFrame', 'pane2');
   }

   function loadPopup() {
     var popupDivId = parent.popupDivId;
     loadDiv('popupFrame', popupDivId);
     parent.popupFrameLoaded = true;
   }

   function loadDiv(frameId, divId) {    
     var bottomFrame = window.parent.frames[frameId];
     var pane2       = window.parent.document.getElementById(divId);
//alert("pane2 = " + pane2.tagName);
     if (pane2) {
       var body = bottomFrame.document.body;
       if (body) {
         pane2.innerHTML = body.innerHTML;
//alert("pane2.innerHtml = " + pane2.innerHtml);
       }
     }
   }

//alert("window.name = " +  window.name);
   // add only if inside iframe
   if (window.parent != window) {
//alert("window.name = " +  window.name);
     if (window.name == "bottomFrame")
       addEvent(window, 'load', function() {setTimeout(loadPane2, 0);}, false);

     else if (window.name == "popupFrame")  
       addEvent(window, 'load', function() {setTimeout(loadPopup, 0);}, false);
     
//       addEvent(window, 'load', function() {setTimeout(showPopup, 0); setTimeout(interceptAllClicks, 0);}, false);
   }
