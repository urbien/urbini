var Browser = {};

var agent = navigator.userAgent

Browser.w3c  = (document.getElementById)                            ? true : false;
Browser.ns4  = (document.layers)                                    ? true : false;

Browser.ie   = (typeof ActiveXObject != 'undefined')                ? true : false;
Browser.ie4  = (Browser.ie && !this.w3c)                              ? true : false;
Browser.ie5  = (Browser.ie && this.w3c)                               ? true : false;
Browser.ie7  = (Browser.ie && typeof window.XMLHttpRequest != 'undefined') ? true : false;

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

Browser.gecko  = (agent.indexOf("Gecko") != -1 && agent.indexOf("Safari") == -1 && agent.indexOf("Konqueror") == -1) ? true : false;
Browser.safari  = (agent.indexOf("Safari") != -1) ? true : false;
Browser.webkit  = (agent.indexOf("WebKit") != -1) ? true : false;
Browser.s60Browser = (Browser.webkit && navigator.userAgent.indexOf("Series60/3.1") != -1 || navigator.userAgent.indexOf("Symbian") != -1) ? true : false;
Browser.maemo= (Browser.w3c && agent.indexOf("Maemo") >= 0) ? true : false;
Browser.penBased = Browser.maemo || Browser.s60Browser ? true : false;
Browser.joystickBased = Browser.s60Browser ? true : false;
Browser.mobileSafari = agent.indexOf("Mobile") != -1 && agent.indexOf("Safari") != -1;
Browser.iPhone = Browser.mobileSafari && agent.indexOf("iPhone") != -1;
Browser.iPod = Browser.mobileSafari && agent.indexOf("iPod") != -1;
var mobileCookie = readCookie('mobile_mode');
Browser.mobile = Browser.android || Browser.mobileSafari || Browser.s60Browser || (mobileCookie != null && trim(mobileCookie) == 'true') ? true : false; //screen.width < 600;



// returns a child of any nesting.
function getChildById(parent, id) {
	return getChildByAttribute(parent, "id", id);
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
function getAncestorById(child, id) {
  return getAncestorByAttribute(child, "id", id);
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
function getAncestorByTagName(child, tagName) {
  tagName = tagName.toLowerCase();
	if(child.tagName == tagName)
		return child;
	var parent;
	while((parent = child.parentNode) != null) {
		if(parent.tagName.toLowerCase() == tagName)
			return parent;
		child = parent;
	}
	return null;
}

// ************************************* intercept all clicks
// ***********************************
function interceptLinkClicks(div) {
  if (Browser.mobile)
    return;
  var anchors;
  var doc;
  if (div) {
    anchors = div.getElementsByTagName('A');
    doc = div;
  }
  else {
    anchors = document.links;
    doc = document;
  }
  var llen = anchors.length;
  for (var i=0;i<llen; i++) {
    var anchor = anchors[i];
    var id = anchor.id;
    if (id && id.startsWith('menuLink_')) // menu clicks are processed by their
                                          // own event handler
      continue;
    if (anchor.className == 'webfolder')
      continue;
    if(anchor.href.indexOf("A_CALENDARS") != -1) // links of the Calendar's days
      continue;

    if (id && id.startsWith("-inner."))
      addEvent(anchor, 'click',  onClickDisplayInner,   false);
    else
      addEvent(anchor, 'click',  onClick,   false);
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

function trim(s) {
  while (s.substring(0,1) == ' ') {
    s = s.substring(1,s.length);
  }
  while (s.substring(s.length-1,s.length) == ' ') {
    s = s.substring(0,s.length-1);
  }
  return s;
}