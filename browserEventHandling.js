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

    function interceptClicks() {
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

      e = (e) ? e : ((window.event) ? window.event : null);
      if (e) {
        if     (e.ctrlKey)  p = '_ctrlKey=y';
        else if(e.shiftKey) p = '_shiftKey=y';
        else if(e.altKey)   p = '_altKey=y';

        url = getTargetElement(e);
        if (p) {
          if (!url) {
            alert("onClick(): can't process control key modifier since event currentTarget is null: " + url);
            return;
          }
          else if(!url.href) {
            alert("onClick(): can't process control key modifier since event currentTarget.href is null: " + url.href);
            return;
          }
          addUrlParam(url, p);
        }
      }
    }
     
    function addUrlParam(url, param) {
      if (!url)
        return;
      if (!url.href)
        return;
      if (url.href.indexOf('?') == -1) 
        url.href = url.href + '?' + param;
      else
        url.href = url.href + '&' + param;
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
        elem = getANode(elem);

//        if (!elem.href) {
//          elem = elem.parentNode;
//          if (!elem.href) {
//            elem = elem.parentNode;
//            alert("2:" + elem.href);
//          }
//          else
//            alert("1:" + elem.href);
//        }
//        else
//          alert("2:" + elem.href);
      }
      return elem;
    }  

    function getANode(elem) { 
      var e;
      if (elem.href) 
        return elem;

      e = elem.parentNode;
      if (e)
        return getANode(e);
      else
        return null;
    }

    addEvent(window, 'load', function() {setTimeout(interceptClicks, 0);}, false);

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

