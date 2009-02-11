/***********************************************
* Global variables
************************************************/
var frameLoaded = new Array();
var xcookie;

/***********************************************
* String extension
************************************************/
String.prototype.startsWith = function (s){
  var reg = new RegExp("^" + s);
  return reg.test(this);
}
String.prototype.endsWith = function(s){
  var reg = new RegExp(s + "$");
  return reg.test(this);
}
function trim(s) {
  while (s.substring(0,1) == ' ') {
    s = s.substring(1,s.length);
  }
  while (s.substring(s.length-1,s.length) == ' ') {
    s = s.substring(0,s.length-1);
  }
  return s;
}

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
  return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
  return this.replace(/\s+$/,"");
}
// removes tags
String.prototype.plainText = function() {
  return this.replace(/<\/?[^>]+(>|$)/g, " ");
}

/***********************************************
* Browser detection
************************************************/
var Browser = {};
var agent = navigator.userAgent

Browser.w3c  = (document.getElementById)                            ? true : false;
Browser.ns4  = (document.layers)                                    ? true : false;

Browser.ie   = (typeof ActiveXObject != 'undefined')                ? true : false;
Browser.ie4  = (Browser.ie && !this.w3c)                              ? true : false;
Browser.ie5  = (Browser.ie && this.w3c)                               ? true : false;
Browser.ie7  = (Browser.ie && !window.opera && window.XMLHttpRequest) ? true : false;
// less than ie7
Browser.lt_ie7  = Browser.ie && !Browser.ie7;


Browser.opera = typeof opera != 'undefined'                         ? true : false;
Browser.opera8 = false;
Browser.opera9 = false;

if (Browser.opera ) {
  var versionindex = agent.indexOf("Opera") + 6;
  var ver = agent.substring(versionindex);
  var v = parseFloat(ver);
  if (v > 8 && v < 8.5) {
    Browser.opera8 = true; // opera 8 (before 8.5) has some issues with
                          // XmlHttpRequest
  }
  if (v >= 9)
    Browser.opera9 = true;
}
Browser.android = agent.indexOf("Android") != -1 ? true: false;


// e62: Opera 8.65: Mozilla/4.0 (compatible; MSIE 6.0; Symbian OS; Series 60/0618.06.17; 9730) Opera 8.65 [en-US] UP.Link/6.3.0.0.0

// e62: s60 browser
// Mozilla/5.0 (SymbianOS/9.2; U; [en]; Series60/3.1 Nokia3250/1.00 )
// Profile/MIDP-2.0 Configuration/CLDC-1.1; AppleWebKit/413 (KHTML, like Gecko)
// Safari/413

if (document.attachEvent && !Browser.opera) {
  Browser.ie55 = true; // need better test since this one will include 5+ as well
}

Browser.gecko     = (agent.indexOf("Gecko") != -1 && agent.indexOf("Safari") == -1 && agent.indexOf("Konqueror") == -1) ? true : false;
Browser.firefox3  = (agent.indexOf("Firefox/3.")) != -1 ? true : false;
Browser.safari    = (agent.indexOf("Safari") != -1) ? true : false;
Browser.webkit    = (agent.indexOf("WebKit") != -1) ? true : false;
Browser.s60Browser = (Browser.webkit && navigator.userAgent.indexOf("Series60/3.1") != -1 || navigator.userAgent.indexOf("Symbian") != -1) ? true : false;
Browser.maemo     = (Browser.w3c && agent.indexOf("Maemo") >= 0) ? true : false;
Browser.penBased  = Browser.maemo || Browser.s60Browser ? true : false;
Browser.joystickBased = Browser.s60Browser ? true : false;
Browser.mobileSafari = agent.indexOf("Mobile") != -1 && agent.indexOf("Safari") != -1;
Browser.iPhone    = Browser.mobileSafari && agent.indexOf("iPhone") != -1;
Browser.iPod      = Browser.mobileSafari && agent.indexOf("iPod") != -1;
var mobileCookie  = readCookie('mobile_mode');
Browser.mobile    = Browser.android || Browser.mobileSafari || Browser.s60Browser || (mobileCookie != null && trim(mobileCookie) == 'true') ? true : false; //screen.width < 600;
Browser.chrome    = (agent.indexOf("Chrome")) != -1 ? true : false;

// ****************************************************
// AJAX
// ****************************************************
// AJAX request.
// Request content from the server to be loaded into a specified div.
// Uses XMLHttpRequest when possible and hidden iframe otherwise.
//
// Basic ajax technique is described here:
// http://keelypavan.blogspot.com/2006/01/using-ajax.html
// http://developer.apple.com/internet/webcontent/xmlhttpreq.html
var lastRequest;
function postRequest(event, url, parameters, div, hotspot, callback, noCache) {
  if (url == null)
    throw new Error('postRequest url parameter is null');
  if (url == 'about:blank')
    throw new Error('postRequest url parameter is: ' + url);
  url = trim(url);
  if (url.length == 0)
    throw new Error('postRequest url parameter is empty');
  this.XMLHTTP = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
  this.newActiveXObject = function(axarray) {
    // IE5 for the mac claims to support window.ActiveXObject, but throws an
    // error when it's used
    if (navigator.userAgent.indexOf('Mac') >= 0 && navigator.userAgent.indexOf("MSIE") >= 0) {
      alert('we are sorry, you browser does not support AJAX, please upgrade or switch to another browser');
      return null;
    }

    var returnValue;
    for (var i = 0; i < axarray.length; i++) {
      try {
        returnValue = new ActiveXObject(axarray[i]);
        break;
      }
      catch (ex) {
      }
    }
    return returnValue;
  };

  function callInProgress() {
    if (!lastRequest)
      return false;
    switch (lastRequest.readyState) {
      // states that indicate request was not completed yet
      case 1: case 2: case 3:
        return true;
      break;
  // Case 4 and 0
      default:
        return false;
      break;
    }
  }

  var frameId = 'popupFrame';
  var iframe  = document.getElementById('popupIframe');
  var http_request;

  // visual cue that click was made, using the tooltip
  var addLineItem = document.location.href.indexOf('addLineItem.html?') != -1;
  if (typeof loadingCueStart != 'undefined')
    loadingCueStart(event, hotspot);

  if (typeof XMLHttpRequest != 'undefined' && window.XMLHttpRequest) { // Mozilla,
                                                                        // Safari,...
    try {
      http_request = new XMLHttpRequest();
      if (!Browser.opera8 && !Browser.s60Browser) { // not Opera 8.0
        if (typeof(http_request.overrideMimeType) != 'undefined' && http_request.overrideMimeType) {
          http_request.overrideMimeType('text/xml');
        }
      }
    } catch(e) {}
  }

  if (!http_request && window.ActiveXObject) { // IE
    http_request = this.newActiveXObject(this.XMLHTTP);
  }

  if (!http_request && window.createRequest) { // IceBrowser
    try {
      http_request = window.createRequest();
    } catch (e) {}
  }

  if (!http_request) {
    throw new Error('Cannot create XMLHTTP instance, using iframe instead');
    frameLoaded[frameId] = false;
    var iframe = frames[frameId];
    iframe.document.body.innerHTML = '<form method=post action=dummy id=ajaxForm><input type=submit name=n value=v></input> </form>';
    var ajaxForm = iframe.document.getElementById('ajaxForm');
    ajaxForm.action = url;
    ajaxForm.submit();
    // line below is an alternative simpler method to submitting a form - but
    // fails in IE if URL is too long
    // iframe.location.replace(url); // load data from server into iframe
    timeoutCount = 0;
    setTimeout(function () {Popup.load(event, div)}, 50);
    return;
  }

  if (callInProgress(lastRequest)) {
    // lastRequest.abort();
    // alert("please wait till your last request is processed");
    return;
  }
  this.lastRequest = http_request;
  var clonedEvent = cloneEvent(event);
  http_request.onreadystatechange = function() {
    var status;
    if (http_request.readyState != 4) // ignore for now: 0-Unintialized,
                                      // 1-Loading, 2-Loaded, 3-Interactive
      return;
//    Boost.log('got back on postrequest for ' + url);
    if (typeof loadingCueFinish != 'undefined')
      loadingCueFinish();
    var location;
    try {
      status = http_request.status;
      var responseXML = http_request.responseXML;
      if (responseXML && responseXML.baseURI)
        url = responseXML.baseURI;
    }
    catch (e) { // hack since mozilla sometimes throws NS_ERROR_NOT_AVAILABLE
                // here
      // deduce status
      alert("error occured when submitting request to the server: " + e);
      if (location)
        status = 302;
      else if (http_request.responseText.length > 10)
        status = 200;
      else
        status = 400;
    }
//    Boost.log('got back on postrequest, status ' + status);
    if (status == 200 && url.indexOf('FormRedirect') != -1) { // POST that did not cause redirect - it means it had a problem - repaint dialog with err msg
      frameLoaded[frameId] = true;
      openAjaxStatistics(event, http_request);
//      if (div)
//        Boost.view.setProgressIndeterminate(false);

      callback(clonedEvent, div, hotspot, http_request.responseText, url);
    }
    else if (status == 200) {
      frameLoaded[frameId] = true;
      openAjaxStatistics(event, http_request);
      //Boost.view.setProgressIndeterminate(false);
      if (callback)
        callback(clonedEvent, div, hotspot, http_request.responseText, url);
    }
    else if (status == 302) {
      try {location = http_request.getResponseHeader('Location');} catch(exception) {}
      if (!location)
        return;
      var repaintDialog = location.indexOf('-inner=')    != -1;   // painting a dialog
      if (repaintDialog) {
        hotspot = null; // second time do not show 'loading...' popup
        // stay on current page and resubmit request using URL from Location header
        var urlParts = location.split('?');
        postRequest(clonedEvent, urlParts[0], urlParts[1], div, hotspot, callback);
      }
      else {
        //alert('reloading page, status = ' + status);
        document.location = location;  // paint full page
      }
    }
    else if (status == 202) {
      try {location = http_request.getResponseHeader('Location');} catch(exception) {}
      if (!location) {
        var response = responseXML.documentElement;
        if (!response) {
          var responseText = http_request.responseText;
          var iframe = frames[frameId];
          iframe.document.body.innerHTML = http_request.responseText;
          response = iframe.document;
        }
        location = response.getElementById('$redirect').getAttribute('href');
        if (!location)
          return;
      }

      if (location == url) {
//        Boost.log("recursive redirect to " + url);
        return;
      }

      var paintInPage;
      if (Browser.mobile)
        paintInPage = true;
      if (!paintInPage) {
        try { paintInPage = http_request.getResponseHeader('X-Paint-In-Page');} catch (exc) {}
//        Boost.log('got back on postrequest, paintinpage ' + paintInPage);
      }
      if (paintInPage && paintInPage == 'false') {
        document.location = location;  // reload full page
      }
      else {
        // adding a new item to the resource list (like in bar or retail)
        var repaintDialog = location.indexOf('-addItems=') != 1;
        if (repaintDialog) {
          hotspot = null; // second time do not show 'loading...' popup
          // stay on current page and resubmit request using URL from Location header
          var urlParts = location.split('?');
          postRequest(clonedEvent, urlParts[0], urlParts[1], div, hotspot, callback);
        }
        else {
          document.location = location;  // reload full page
        }
      }
    }
    else {
//      Boost.log('AJAX request status(' + status + ', ' + url + ')');
      openAjaxStatistics(event, http_request);
      //Boost.view.setProgressIndeterminate(false);
      callback(clonedEvent, div, hotspot, http_request.responseText, url);
    }
  };
  if (!Browser.opera8  && !Browser.s60Browser) {
    try {
      http_request.open('POST', url, true);
    }
    catch (err) {
//      Boost.log("error in ajax request open(): " + url + '?' + parameters);
      callback(clonedEvent, div, hotspot, "", url);
      return;
    }

    // browser does not allow Referer to be sent - so we send X-Referer and on
    // server make it transparent to apps
    // http_request.setRequestHeader("Referer", document.location.href);
    try {
      http_request.setRequestHeader("X-Referer",     document.location.href);
    }
    catch (err1) {
//      Boost.log('ajax request - X-Referer header could not be set: ' + url + '?' + parameters);
    }
    http_request.setRequestHeader("X-Ajax",       "y");
    if (Browser.android)
      http_request.setRequestHeader("X-Accept-Boost", "menu-button");
    http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    // cookie is inherited by widget and now needs to be set on request to not to be forced to login
    if (xcookie) {
      opera.postError('postRequest' + xcookie);
      http_request.setRequestHeader("X-Cookie",   xcookie);
    }
    if(typeof noCache != 'undefined' && noCache == true) // for widgets
      http_request.setRequestHeader("Cache-Control","no-cache");

    if (parameters && !Browser.webkit) { // webkit considers setting this header a security risk
      http_request.setRequestHeader("Content-length", parameters.length);
    }
    // below 2 line commented - made IE wait with ~1 minute timeout
    // http_request.setRequestHeader("Connection", "close");
    if (div)
//      Boost.view.setProgressIndeterminate(true);
    if (parameters)
      parameters += '&X-Ajax=y'; // webkit does not send custom headers
    else
      parameters = 'X-Ajax=y';
    if (Browser.android) {
      parameters += '&X-Accept-Boost=menu-button';
    }
    http_request.send(parameters);
  }
  // use GET due to Browser bugs
  // - s60 browser post comes with 0 bytes body on popup (although ok on dialog :-/ )
  // - opera 8.0 does not support setRequestHeaders()
  else {
    var url1;
    var extras = 'X-Referer=' + encodeURIComponent(document.location.href) + '&X-Ajax=y';
    var hasQ = url.indexOf('?') != -1;
    if (hasQ)
      url1 = url + '&';
    else
      url1 = url + '?';
    if (parameters && parameters.length != 0)
      url1 += parameters + '&' + extras;
    else
      url1 += extras;
    http_request.open('GET', url1, true);
    if (div)
      Boost.view.setProgressIndeterminate(true);
    http_request.send('');
  }
}

function openAjaxStatistics(event, http_request) {
  if(!event)
    return;
  var target = event.target;
  if (!target || !target.tagName || target.tagName.toUpperCase() != 'IMG' || target.id.indexOf('codeBehindThePage') == -1)
    return;

  var tdSql = document.getElementById("ajax_sql");
  var logMarker = http_request.getResponseHeader("X-Request-Tracker");
  var tdCache = document.getElementById("ajax_cache");
  if (tdSql  && logMarker || tdCache) {
    var tr = document.getElementById("ajax_title");
    tr.style.visibility = "visible";
    tr.style.display = 'table-row';
  }
  else
    return;
  var a;
  if (tdSql  &&  logMarker) {
    var sql = http_request.getResponseHeader("X-Sql-Statistics");
    a = tdSql.childNodes[0];
    var ahref = a.href;
    var idx = ahref.indexOf("?LOG_MARKER=");
    var idx1 = ahref.indexOf("&", idx1);
    ahref = ahref.substring(0, idx + 12) + logMarker + ahref.substring(idx1);
    a.href = ahref;

    var idx = sql.indexOf("=");
    var idx1 = sql.indexOf(";");
    var hits = sql.substring(idx + 1, idx1);
    idx = sql.indexOf("=", idx1);
    var time = parseInt(sql.substring(idx + 1))/1000000;
    a.innerHTML = hits + ' SQLs/' + Math.round((time * 100)/100) + 'ms';
    var tr = getTrNode(tdSql);
    tr.style.visibility = "visible";
    tr.style.display = 'table-row';
  }
  if (tdCache) {
    var cache = http_request.getResponseHeader("X-Cache-Statistics");
    a = tdCache.childNodes[0];
    var idx = cache.indexOf("=");
    var idx1 = cache.indexOf(";");
    var hits = cache.substring(idx + 1, idx1);
    idx = cache.indexOf("=", idx1);
    var time = parseInt(cache.substring(idx + 1))/1000000;
    if (!time  &&  !hits)
      return;
    a.innerHTML = hits + ' cache hits/' + Math.round((time * 100)/100) + 'ms speed-up';

    var tr = getTrNode(tdCache);
    tr.style.visibility = "visible";
    tr.style.display = 'table-row';
  }
}

/*********************************************
* Metrics util functions
**********************************************/
/**
 * the source of this function and getScrollXY is:
 * http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize1() {
  var myWidth = 0, myHeight = 0;
  myHeight = (Browser.ie5 || Browser.ie4) ? document.body.clientHeight : window.innerHeight;
  myWidth  = (Browser.ie5 || Browser.ie4) ? document.body.clientWidth  : window.innerWidth;
  return [ myWidth, myHeight ];
}

/**
 * the source of this function and getScrollXY is:
 * http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize_no_viewport() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    // Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement &&
      ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    // IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    // IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
  return [ myWidth, myHeight ];
}

function getWindowSize() {
  var widthPlusScrollbar;
  var heightPlusScrollbar;

  if (typeof window.innerWidth != "undefined") {
    widthPlusScrollbar = window.innerWidth ;
    heightPlusScrollbar = window.innerHeight ;
  }
  else if (document.documentElement && typeof document.documentElement.offsetWidth != "undefined" && document.documentElement.offsetWidth != 0) {
    widthPlusScrollbar  = document.documentElement.offsetWidth ;
    heightPlusScrollbar = document.documentElement.offsetHeight ;
  }
  else if (d.body && typeof d.body.offsetWidth != "undefined") {
    widthPlusScrollbar  = document.body.offsetWidth ;
    heightPlusScrollbar = document.body.offsetHeight ;
  };
/*
 * if (d.documentElement && typeof d.documentElement.clientWidth != "undefined" &&
 * d.documentElement.clientWidth != 0) { //d.documentElement.clientWidth/Height
 * is currently not supported by Gecko; see bugzilla bug file 156388 on that.
 * d.FormName.WidthMinusScrollbar.value = d.documentElement.clientWidth +
 * 2*parseInt(d.documentElement.currentStyle.borderWidth,10) ;
 * d.FormName.HeightMinusScrollbar.value = d.documentElement.clientHeight +
 * 2*parseInt(d.documentElement.currentStyle.borderWidth,10) ; } else if (d.all &&
 * d.body && typeof d.body.clientWidth != "undefined") { //
 * d.styleSheets[0].rules[1].style.borderWidth,10 should work for MSIE 4
 * d.FormName.WidthMinusScrollbar.value = d.body.clientWidth +
 * 2*parseInt(d.body.currentStyle.borderWidth,10) ;
 * d.FormName.HeightMinusScrollbar.value = d.body.clientHeight +
 * 2*parseInt(d.body.currentStyle.borderWidth,10); } else if (d.body && typeof
 * d.body.clientWidth != "undefined") { d.FormName.WidthMinusScrollbar.value =
 * d.body.clientWidth ; d.FormName.HeightMinusScrollbar.value =
 * d.body.clientHeight ; };
 */
  return [ widthPlusScrollbar, heightPlusScrollbar ];

}

function getScrollXY() {
  var scrOfX = 0, scrOfY = 0;
  if( typeof( window.pageYOffset ) == 'number' ) {
    // Netscape compliant
    scrOfY = window.pageYOffset;
    scrOfX = window.pageXOffset;
  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
    // DOM compliant
    scrOfY = document.body.scrollTop;
    scrOfX = document.body.scrollLeft;
  } else if( document.documentElement &&
      ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
    // IE6 standards compliant mode
    scrOfY = document.documentElement.scrollTop;
    scrOfX = document.documentElement.scrollLeft;
  }
  return [ scrOfX, scrOfY ];
}

function getLeft(overlay){
  var totaloffset = overlay.offsetLeft;
  var parentEl = overlay.offsetParent;
  while (parentEl != null) {
    totaloffset = totaloffset + parentEl.offsetLeft;
    parentEl = parentEl.offsetParent;
  }
  return totaloffset;
}

function getTop(overlay, offsettype){
  var totaloffset = overlay.offsetTop;
  var parentEl = overlay.offsetParent;
  while (parentEl != null) {
    totaloffset = totaloffset + parentEl.offsetTop;
    parentEl = parentEl.offsetParent;
  }
  return totaloffset;
}

/*********************************************
* Events and event target util functions
**********************************************/
function getDocumentEvent(e) {
  if (e) return e;
  if (!window) return null;
  if (window.event)
    return window.event;
  else
    return null;
}
/**
 * Utility that discovers the actual html element which generated the event If
 * handler is on table and click was on td - it returns td
 */
function getEventTarget(e) {
  e = getDocumentEvent(e); if (!e) return null;
  var target = null;
  if (e.target) {
      target = e.target;
  }
  else {
    target = e.srcElement;
  }
  if(target == null)
    return null;
  // Konqueror: if event target contains text node,
  //they return the text node instead of the element node
  while (target.nodeType != 1) {
    target = target.parentNode;
  }
  return target;
}

/**
 * Utility that discovers the html element on which this event is firing If
 * handler is on table and click was on td - it returns table
 */
function getTargetElement(e) {
  e = getDocumentEvent(e); if (!e) return null;
  var elem;
  var elem1 = e.target;
  if (elem1) {
    if (e.currentTarget && (e.currentTarget != elem1)) {
      if (elem1.tagName && elem1.tagName.toLowerCase() == 'input' && elem1.type.toLowerCase() == 'checkbox')
        elem = elem1;
      else
        elem = e.currentTarget;
    }
    else
      elem = elem1;
  }
  else {
    elem = e.srcElement;
    if(elem.parentNode && elem.parentNode.tagName.toLowerCase() == "a")
      elem = elem.parentNode;
  }
  return elem;
}

// * Because of event bubbling mousing over the link inside a div will send a
// mouseout for the enclosing div
// * So we need to discard such events - return null in this case;
function getMouseOutTarget(e) {
  var tg = getTargetElement(e);
  return tg;

  /*
   * stopped running the code below since reltg.tagName gives permission
   * exception in FF (when mousing over the Filter area) if (!tg) return null;
   * var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement; // ignore
   * event if element to which mouse has moved is a child of a target element if
   * (!reltg) return tg; while (reltg != tg && reltg.tagName && reltg.tagName !=
   * 'BODY') reltg = reltg.parentNode; if (reltg == tg) return null; return tg;
   */
}

// * Because of event bubbling mousing over the link inside a div will send a
// mouseover for this div
// * So we need to discard such events - return null in this case;
function getMouseOverTarget(e) {
  var tg = getTargetElement(e);
  if (!tg)
    return null;
  return tg;

  /*
   * var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement; // ignore
   * event if element to which mouse has moved is a child of a target element if
   * (!reltg) return tg; while (reltg != tg && reltg.nodeName != 'BODY') reltg =
   * reltg.parentNode; if (reltg == tg) return null; return tg;
   */

  /*
   * // only interested in direct events, not those that bubble up if
   * (!tg.attachEvent && this && this.contains && this.contains(tg)) {
   * alert("canceling mouseover"); return null; } else return tg;
   */
}

// get link on which user clicked (it could be a A in TD or it could be A around
// IMG)
function getTargetAnchor(e) {
  var target = getEventTarget(e);//getTargetElement(e);
  return getAnchorForEventTarget(target);
}

function getAnchorForEventTarget(target) {
//  Boost.log('getAnchorForEventTarget: target.tagName: ' + target.tagName);
  /*
  if (target.tagName.toUpperCase() == 'A')
    return target;
  var anchors = target.getElementsByTagName('a');
  if (anchors && anchors[0])
    return anchors[0];

  return getANode(target);
  */
  return getAncestorByTagName(target, "a");
}

// use instead getAncestorByTagName(child, "a")
/*
function getAnchorForEventTarget1(target) {
//  Boost.log('getAnchorForEventTarget: target.tagName: ' + target.tagName);
  if (target.tagName.toUpperCase() == 'A')
    return target;

  var anchors = target.getElementsByTagName('a');
  if (anchors && anchors[0])
    return anchors[0];

  var name = target.tagName.toUpperCase();
  if (name == 'TD'  ||  name == 'DIV')
    return null;
  while (true) {
    var e = target.parentNode;
    if (!e)
      return null;
    name = e.tagName.toUpperCase()
    if (name == 'A')
      return e;
    if (e  &&  (name == 'TD' || name == 'DIV'))
      return getAnchorForEventTarget1(e);
  }
  return null;
}
*/

// Event object does not survive (all coordinates become 0) despite a js closure
// mechanism
// This happens on setTimeout or on postRequest.
// So we are forced to clone the event object.
// Unfortunately generic event clone() caused FF to throw exception in
// postRequest.
// Thus the needs for this specific clone.
function cloneEvent(eventObj) {
  if(!eventObj)
    return;
  if(typeof eventObj.cloned != 'undefined' && eventObj.cloned == true)
    return eventObj;

  var e = new Object();
  if (typeof eventObj.latitude != 'undefined') {
    e.latitude  = eventObj.latitude;
    e.longitude = eventObj.longitude;
    e.cloned = true;
    return e;
  }

  e.screenX = eventObj.screenX;
  e.screenY = eventObj.screenY;
  e.pageX   = eventObj.pageX;
  e.pageY   = eventObj.pageY;
  e.clientX = eventObj.clientX;
  e.clientY = eventObj.clientY;
  e.srcElement = getTargetElement(eventObj);
  e.target  = eventObj.target;
  e.cloned = true;
  try {
    if (typeof eventObj.type == 'string')
      e.type    = eventObj.type; // strangly in FF it is xpobject sometimes
                                  // (looks like only under Venckman debugger)
    else
      e.type = 'click';
  } catch(exc) {
    e.type = 'click';
  }
  return e;
}

function stopEventPropagation(e) {
  if (!e)
    return true;
  try {
    if (e.cloned)
      return false;
    e.cancelBubble = true;
    e.returnValue  = false;
    if (e.preventDefault)  e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.setAttribute)    e.setAttribute('eventProcessed', 'true');
    e.eventProcessed = true;
    if (Browser.s60Browser) {
      var anchor = getTargetAnchor(e);
      if (anchor && anchor.href == "about:blank")
         anchor.href = "javascript: return false;";
    }
  }
  catch (e) {
  }
  return false;
}

/*********************************************
* DOM util functions
**********************************************/
function getNextSibling(obj) {
  do obj = obj.nextSibling;
  while (obj && obj.nodeType != 1);
  return obj;
}

function getPreviousSibling(obj) {
  do obj = obj.previousSibling;
  while (obj && obj.nodeType != 1);
  return obj;
}


function insertAfter(parent, newElement, referenceElement) {
  parent.insertBefore(newElement, referenceElement.nextSibling);
}
// returns a child of any nesting.
function getChildById(parent, id) {
	return getChildByAttribute(parent, "id", id);
}
function getChildByClassName(parent, className) {
	return getChildByAttribute(parent, "className", className);
}
function getChildByAttribute(parent, atribName, attribValue) {
	if(!parent)
	  return null;
	if(parent[atribName] == attribValue)
		return parent;
	var children = parent.childNodes;
	var len = children.length;
	if(len == 0)
		return null;
	for(var i = 0; i < len; i++) {
		if(children[i].childNodes.length != 0) {
			var reqChild = null;
			if((reqChild = getChildByAttribute(children[i], atribName, attribValue)) != null)
				return reqChild;
		}
		if(children[i][atribName] == attribValue)
			return children[i];
	}
	return null;
}

// return "parent" if it is of required tagName
function getChildByTagName(parent, tagName) {
	if(!parent)
	  return null;
  tagName = tagName.toLowerCase();
	if(parent.tagName.toLowerCase() == tagName)
		return parent;

	var children = parent.childNodes;
	var len = children.length;
	if(len == 0)
		return null;
	for(var i = 0; i < len; i++) {
		if(children[i].childNodes.length != 0) {
			var reqChild = null;
			if((reqChild = getChildByTagName(children[i], tagName)) != null)
				return reqChild;
		}
		if(children[i].tagName && children[i].tagName.toLowerCase() == tagName)
			return children[i];
	}
	return null;
}

function getAncestorById(child, id) {
  return getAncestorByAttribute(child, "id", id);
}
function getAncestorByClassName(child, className) {
  return getAncestorByAttribute(child, "className", className);
}
// attribValue - string or array of strings
function getAncestorByAttribute(child, attribName, attribValue) {
	if(!child)
	  return null;
	var isArray = (typeof attribValue != 'string')

	if(isArray) {
	  for(var i = 0; i < attribValue.length; i++)
	    if(child[attribName] == attribValue[i])
		    return child;
	}
	else {
	  if(child[attribName] == attribValue)
		  return child;
  }

	var parent;
	while((parent = child.parentNode) != null) {
		if(isArray) {
  	  for(var i = 0; i < attribValue.length; i++)
  	    if(parent[attribName] == attribValue[i])
			    return parent;
		}
		else {
		  if(parent[attribName] == attribValue)
			  return parent;
		}

		child = parent;
	}
	return null;
}
// return "child" if it is of required tagName
function getAncestorByTagName(child, tagName) {
  tagName = tagName.toLowerCase();
	if(child.tagName.toLowerCase() == tagName)
		return child;
	var parent;
	while((parent = child.parentNode) != null) {
		if(parent.tagName && parent.tagName.toLowerCase() == tagName)
			return parent;
		child = parent;
	}
	return null;
}

function setInnerHtml(div, text) {
// write in child with id = "content" if it exists.
  var contentDiv = getChildById(div, "content");
  if(contentDiv != null)
	div = contentDiv;

  if (Browser.ns4) {
    div.document.open();
    div.document.write(text);
    div.document.close();
  }
// else if (Browser.ns6) {
// var r = div.ownerDocument.createRange();
// r.selectNodeContents(div);
// r.deleteContents();
// var df = r.createContextualFragment(text);
// div.appendChild(df);
// }
  else {
    div.innerHTML = '';
    // hack to remove current div dimensions, otherwise div will not auto-adjust
    // to the text inserted into it (hack needed at least in firefox 1.0)
    div.style.width  = null;
    div.style.height = null;
    // insert html fragment
    div.innerHTML = text;
  }
  
  // execute / download JS code containing in the div content.
  ExecJS.runDivCode(div);
}


function getElementStyle(elem) {
	if(typeof elem == 'string')
	  elem = document.getElementById(elem);
  // <html> dose not have style property
	if(elem.nodeType == 9)
	  return null;

	if (elem.currentStyle)
		return elem.currentStyle;
	else if (window.getComputedStyle)
		return document.defaultView.getComputedStyle(elem, null);
}

/*********************************************************
* ExecJS 
* helps to handle dialog and tab cases;
* checks ready state (IE) as well.
**********************************************************/
var ExecJS = {
  runCodeArr : new Array(),
  isWaitingOnReady : false,
  
  runCode : function(jsCode, refObjId, requiredJsFileName) {
    $t = ExecJS;
    
    // check if required JS file was loaded and parsed
    // ondemandloaded JS-file has requiredJsFileName = null
    var toWait = false;
    if (requiredJsFileName && typeof g_loadedJsFiles[requiredJsFileName] == 'undefined')
      toWait = true;
    
    if (toWait || typeof g_loadedJsFiles["common.js"] == 'undefined') {
      setTimeout( function() { ExecJS.runCode(jsCode, refObjId, requiredJsFileName) }, 100); 
      return;
    }
    
    if (refObjId)
      $t._runRelativeCode(jsCode, refObjId);
    else
      $t.eval(jsCode);
  },
  
  eval : function(jsCode) {
    try {
      window.eval(jsCode);
    }
    catch(e) {
      setTimeout( function() { ExecJS.eval(jsCode) }, 100);
    } 
  },
  
  // executes js code if refObjId is visible - [hidden tab].
  _runRelativeCode : function(jsCode, refObjId) {
    if(document.all && document.readyState != "complete") {
			if(this.isWaitingOnReady == false) {
			  addEvent(document, 'readystatechange', this._runOnDocumentReady, false);
			  this.isWaitingOnReady = true;
			}
			this.runCodeArr.push({"jsCode": jsCode, "refObjId": refObjId});
		}
		else {
      if(this.isObjectTotallyVisible(refObjId))
        this.eval(jsCode);
    }
  },

  // evaluates script blocks
  // contDiv is a div that contain JS code - [dialog].
  runDivCode : function(contDiv) {
    if(!contDiv)
      return;
    var scripts = contDiv.getElementsByTagName('script');
    for(var i = 0; i < scripts.length; i++) {
      if(typeof scripts[i].evaluated == 'undefined' || !scripts[i].evaluated) {
        // 1. external JS code
        var src = scripts[i].src;
        if (src && src.length != 0) {
          // the same code as in menu.onDemand.includeJS()
          var html_doc = document.getElementsByTagName('head')[0];
          var js = document.createElement('script');
          js.setAttribute('type', 'text/javascript');
          
          // suppress minify
          if(location.href.indexOf("-minify-js=n") != -1)
            fileName = fileName.replace("m.js", ".js")
            
          js.setAttribute('src', src);
          html_doc.appendChild(js);
        }
        // 2. inner JS block
        else {
          var parent = scripts[i].parentNode;
          // apply only to visible object
          if(this.isObjectTotallyVisible(parent)) {
            var evalStr = scripts[i].text || scripts[i].innerHTML;
            window.eval(evalStr);
            scripts[i].evaluated = true;
          }
        }
        
      }
    }
  },

  // checks on visibility all ancestors of the object
  // gets object or its id
  isObjectTotallyVisible : function(obj) {
    if(typeof obj == "string")
      obj = document.getElementById(obj);
    if(obj == null)
      return false;
	  var parent = obj;
	  while(parent != null) {
		  var stl = getElementStyle(parent);
		  if (stl != null) {
		    if (stl.visibility == 'hidden' || stl.display == 'none')
		      return false;
			}
		  parent = obj.parentNode;
		  obj = parent;
	  }
	  return true;
  },

  _runOnDocumentReady : function() {
    for(var i = 0; i < ExecJS.runCodeArr.length; i++) {
     if(ExecJS.isObjectTotallyVisible(ExecJS.runCodeArr[i].refObjId))
       window.eval(ExecJS.runCodeArr[i].jsCode);
    }
  }
}

// Cookie utility functions
function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  } else {
    var expires = "";
  }
  document.cookie = name+"="+value+expires+"; path=/";
}
function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ')
      c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0)
      return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function eraseCookie(name) {
  createCookie(name,"",-1);
}

function changeOpacity(obj, level) {
  if (!obj)
    return;  
	if(typeof obj.style.MozOpacity != 'undefined')
		obj.style.MozOpacity = level;
	else if(typeof obj.style.opacity != 'undefined')
		obj.style.opacity = level;
	else if(obj.style.filter != 'undefined')
		obj.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(opacity=' + level + ')';
}

function copyAttributes(oNode, oNew) {
  for(var i = 0; i < oNode.attributes.length; i++) {
    var a = oNode.attributes[i];
    if (a.value == null || a.value == 'null' || a.value == '')
      continue;
    if (a.name == 'style')
      continue;
    var value;
    if (a.value == 'false')
      value = false;
    else if (a.value == 'true')
      value = true;
    else
      value = a.value;
    if (a.name == 'disabled' && value == false)
      continue;
    oNew.setAttribute(a.name, a.value);
  }
  oNew.setAttribute('style', oNode.style.cssText);
  // oNew.style.cssText = oNode.style.cssText;
}

function copyTableRow(tbody, pos, oldTr) {
  var newTr = document.createElement('tr');
  var oldCells = oldTr.cells;
  for (var i=0; i<oldCells.length; i++) {
    var cell = document.createElement('td');
    copyAttributes(oldCells[i], cell);
    newTr.appendChild(cell);
  }
  if (pos == tbody.rows.length)
    tbody.appendChild(newTr);
  else
    tbody.insertBefore(newTr, tbody.rows[pos]);
  for (var i=0; i<oldCells.length; i++) {
    newTr.cells[i].innerHTML = oldCells[i].innerHTML;
  }
  copyAttributes(oldTr, newTr);
  return newTr;
}

function Dim() {
  this.left   = 0;
  this.top    = 0;
  this.width  = 0;
  this.height = 0;

  var self = this;

  this.equals = function (dim) {
    if (self.top   == dim.top   && self.left   == dim.left &&
        self.width == dim.width && self.height == dim.height)
      return true;
    else
      return false;

  }
}

function getElementPosition(elem, e) {
  // special position that is relative to the element
  if (elem  &&  typeof elem.forcedPosition != 'undefined') {
    var scrollXY = getScrollXY();
    if (elem.forcedPosition == Popup.POS_LEFT_TOP)
      return {left : scrollXY[0] + 10, top : scrollXY[1]};
  }

  var xy;
  if (e && !e.type.startsWith('key')) {
    xy = getMouseEventCoordinates(e);
  }
  else {
    xy = getObjectUpperLeft(elem);
  }
  return {left : xy.x, top : xy.y};
}

function getElementCoords(elem, e) {
  var dim = new Dim();
  var elemPos = getElementPosition(elem, e);
  dim.left = elemPos.left;
  dim.top  = elemPos.top;

  var d = getElementDimensions(elem);
  dim.width  = d.width;
  dim.height = d.height;
  return dim;
}

function getElementDimensions(elem) {
  var dim = new Dim();
  if (Browser.ns4) {
    dim.width  = (elem.document.width)  ? elem.document.width  : elem.clip.width;
    dim.height = (elem.document.height) ? elem.document.height : elem.clip.height;
  }
  else if (Browser.ie4) {
    dim.width  = (elem.style.pixelWidth)  ? elem.style.pixelWidth  : elem.offsetWidth;
    dim.height = (elem.style.pixelHeight) ? elem.style.pixelHeight : elem.offsetHeight;
  }
  else {
    dim.width  = (elem.style.width)  ? parseInt(elem.style.width)  : parseInt(elem.offsetWidth);
    dim.height = (elem.style.height) ? parseInt(elem.style.height) : parseInt(elem.offsetHeight);
  }
  return dim;
}

function getObjectUpperLeft(obj){
  /* For postioning in reference to link */

  var x = obj.offsetLeft;
  var y = obj.offsetTop;

  /*
   * Calculate page X,Y of upper left corner of element where toolTip is to be
   * shown
   */
  obj = obj.offsetParent;
  while (obj) {
      x += obj.offsetLeft;
      y += obj.offsetTop;

      if (typeof obj.clientLeft != "undefined" && obj.tagName != "BODY") {
              /*
               * MS IE doesn't include borders in offset values; these are
               * obtained with clientLeft and Top and added in
               */
              x += obj.clientLeft;
              y += obj.clientTop;
      }

      if (obj.tagName == "HTML") break; // KHTML KDE has an unidentified
                                        // object above html
      obj = obj.offsetParent;
  }// endwhile

  return {x:x, y:y};
}// eof getObjectUpperLeft

// flag that common.js was parsed
g_loadedJsFiles["common.js"] = true;