/* 
 * Popup Menu system 
 */ 
var MenuArray = new Array();

function menuOpenClose(divName, imgName) {
	for (i = 0; i < MenuArray.length; i++) {
		if (document.getElementById(MenuArray[i]) == null) {
			continue;
		}
		if (MenuArray[i] != divName) {
			poptext = document.getElementById(MenuArray[i]).style;
			if (poptext.display == "inline") {
				//poptext.display = "none";
				DivSetVisible(false, divName);
			}
		}
	}
	poptext = document.getElementById(divName).style;
	if (poptext.display == "none" || poptext.display == "") {
		//poptext.display = "inline";
		DivSetVisible(true, divName);
		if (imgName) {
     	var divRef = document.getElementById(divName);
			divRef.style.left=0;
			divRef.style.top=0;
      var left = docjslib_getImageXfromLeft(imgName);
      var top = docjslib_getImageYfromTop(imgName) + docjslib_getImageHeight(imgName);
			var screenX = document.body.clientWidth;
			var screenY = document.body.clientHeight;

    	//Find out how close to the corner of the window
    	var rightedge=document.body.clientWidth-left;
    	var bottomedge=document.body.clientHeight-top;

    	//if the horizontal distance isn't enough to accomodate the width of the context menu
    	if (rightedge<divRef.offsetWidth)
				//move the horizontal position of the menu to the left by its width
				left=screenX-divRef.offsetWidth;

			//same concept with the vertical position
			if (bottomedge<divRef.offsetHeight)
				top=document.body.scrollTop+document.body.offsetHeight-divRef.offsetHeight;

			poptext.left = left;
			poptext.top = top;
		}
	} else {
		//poptext.display = "none";
		DivSetVisible(false, divName);
	}
	if (document.getElementById("menudiv_Email") != null &&
            document.getElementById("menudiv_Email").style.display == "inline"
        ) {
	  var e = document.getElementById("emailForm");
	  if (e) e.subject.value = document.title;
	}
	if (document.getElementById("menudiv_Schedule") != null &&
            document.getElementById("menudiv_Schedule").style.display == "inline"
          ) {
		document.getElementById("scheduleForm").name.value = document.title;
	}
}

var closeTimeoutId;
var openTimeoutId;

function menuOpen(div, link) {
  openTimeoutId = setTimeout("menuOpen1('" + div + "', '" + link + "')", 600);
}

function menuOpen1(div, link) {
	poptext = document.getElementById(div).style;
	if (poptext.display == "none" || poptext.display == "") {
		linkLeft = docjslib_getImageXfromLeft(link);
		linkTop = docjslib_getImageYfromTop(link);
		linkWidth = docjslib_getImageWidth(link);
		linkHeight = docjslib_getImageHeight(link);

		if (xMousePos < linkLeft || xMousePos > linkLeft + linkWidth ||
                yMousePos < linkTop || yMousePos > linkTop + linkHeight) {
			return;
		}
	} else {
		return;
      }

	if (openTimeoutId != null) {
        clearTimeout(openTimeoutId);
        openTimeoutId = null;
      }
	if (closeTimeoutId != null) {
        clearTimeout(closeTimeoutId);
        closeTimeoutId = null;
      }
	for (i = 0; i < MenuArray.length; i++) {
		if (document.getElementById(MenuArray[i]) == null) {
			continue;
		}
		if (MenuArray[i] != div) {
			poptext = document.getElementById(MenuArray[i]).style;
			if (poptext.display == "inline") {
				poptext.display = "none";
			}
		}
	}
	poptext = document.getElementById(div).style;
      poptext.left = docjslib_getImageXfromLeft(link);
      poptext.top = docjslib_getImageYfromTop(link) + docjslib_getImageHeight(link) + 2;
	if (poptext.display == "none" || poptext.display == "") {
		poptext.display = "inline";
	}

	if (document.getElementById("menudiv_Email") != null &&
      document.getElementById("menudiv_Email").style.display == "inline"
           ) {
		var e = document.forms["emailForm"];
		if (e) e.elements["subject"].value = document.title;
	}
	if (document.getElementById("menudiv_Schedule") != null &&
      document.getElementById("menudiv_Schedule").style.display == "inline"
           ) {
    var s = document.forms["scheduleForm"];
    if (s) s.elements["name"].value = document.title;
	}
}

function menuClose1(div) {
  var d =document.getElementById(div);
  if (!d)
    return;
  poptext = d.style;
  if (poptext.display == "inline") {
    poptextLeft = docjslib_getImageXfromLeft(div);
    poptextTop = docjslib_getImageYfromTop(div);
    poptextWidth = docjslib_getImageWidth(div);
    poptextHeight = docjslib_getImageHeight(div);
    if (xMousePos < poptextLeft || xMousePos > poptextLeft + poptextWidth ||
        yMousePos < poptextTop || yMousePos > poptextTop + poptextHeight) {
        //poptext.display = "none";
      DivSetVisible(false, div);
      currentDiv = null;
    } else {
      timeoutId = setTimeout("menuClose1('" + div + "')", 100);
    }
  }
}

/* close div uncoditionally with no regard to mouse position */
function menuClose2(divElem) {
  poptext = divElem.style;
  var div = divElem.id;
  if (poptext.display == "inline") {
    poptextLeft = docjslib_getImageXfromLeft(div);
    poptextTop = docjslib_getImageYfromTop(div);
    poptextWidth = docjslib_getImageWidth(div);
    poptextHeight = docjslib_getImageHeight(div);
    DivSetVisible(false, div);
    currentDiv = null;
  }
}

function menuClose(div) {
  closeTimeoutId = setTimeout("menuClose1('" + div + "')", 100);
}

function onRecChange() {
  if (document.getElementById("scheduleForm").rec.value == 'week') {
    document.getElementById("titleDiv").innerHTML = 'Day:';
    document.getElementById("valueDiv").innerHTML = '<select name="weekDay" class="formMenuInput">' +
                         '<option value="Mon">Monday</option>' +
                         '<option value="Tue">Tuesday</option>' +
                         '<option value="Wed">Wednesday</option>' +
                         '<option value="Thu">Thursday</option>' +
                         '<option value="Fri">Friday</option>' +
                         '<option value="Sat">Saturday</option>' +
                         '<option value="Sun">Sunday</option>' +
                         '</select>';
  } else if (document.getElementById("scheduleForm").rec.value == 'month') {
    document.getElementById("titleDiv").innerHTML = 'Day:';
    document.getElementById("valueDiv").innerHTML = '<select name="day" class="formMenuInput">' +
                         '<option>01</option>' +
                         '<option>02</option>' +
                         '<option>03</option>' +
                         '<option>04</option>' +
                         '<option>05</option>' +
                         '<option>06</option>' +
                         '<option>07</option>' +
                         '<option>08</option>' +
                         '<option>09</option>' +
                         '<option>10</option>' +
                         '<option>11</option>' +
                         '<option>12</option>' +
                         '<option>13</option>' +
                         '<option>14</option>' +
                         '<option>15</option>' +
                         '<option>16</option>' +
                         '<option>17</option>' +
                         '<option>18</option>' +
                         '<option>19</option>' +
                         '<option>20</option>' +
                         '<option>21</option>' +
                         '<option>22</option>' +
                         '<option>23</option>' +
                         '<option>24</option>' +
                         '<option>25</option>' +
                         '<option>26</option>' +
                         '<option>27</option>' +
                         '<option>28</option>' +
                         '<option>29</option>' +
                         '<option>30</option>' +
                         '<option>31</option>' +
                         '</select>';
  } else {
    document.getElementById("titleDiv").innerHTML = '';
    document.getElementById("valueDiv").innerHTML = '';
  }
}

// Reference: http://www.webreference.com/js/column33/image.html

function docjslib_getImageWidth(imgID) {
  return document.getElementById(imgID).offsetWidth;
}
function docjslib_getImageHeight(imgID) {
  return document.getElementById(imgID).offsetHeight;
}
var NS4 = document.layers;
function docjslib_getImageXfromLeft(imgID) {
  if (NS4) return document.getElementById(imgID).x
  else return docjslib_getRealLeft(imgID);
}
function docjslib_getImageYfromTop(imgID) {
  if (NS4) return document.getElementById(imgID).y
  else return docjslib_getRealTop(imgID);
}
function docjslib_getRealLeft(imgElem) {
  xPos = document.getElementById(imgElem).offsetLeft;
  tempEl = document.getElementById(imgElem).offsetParent;
  while (tempEl != null) {
    xPos += tempEl.offsetLeft;
    tempEl = tempEl.offsetParent;
  }
  return xPos;
}
function docjslib_getRealTop(imgElem) {
  yPos = document.getElementById(imgElem).offsetTop;
  tempEl = document.getElementById(imgElem).offsetParent;
  while (tempEl != null) {
    yPos += tempEl.offsetTop;
    tempEl = tempEl.offsetParent;
  }
  return yPos;
}

function menu_onmouseover(itemcode) {
  document.getElementById(itemcode + 'td1').style.backgroundColor='#B6BDD2';
  document.getElementById(itemcode + 'td2').style.backgroundColor='#B6BDD2';
  document.getElementById(itemcode + 'td3').style.backgroundColor='#B6BDD2';
}

function menu_onmouseout(itemcode) {
  document.getElementById(itemcode + 'td1').style.backgroundColor='';
  document.getElementById(itemcode + 'td2').style.backgroundColor='';
  document.getElementById(itemcode + 'td3').style.backgroundColor='';
}


// Set Netscape up to run the "captureMousePosition" function whenever
// the mouse is moved. For Internet Explorer and Netscape 6, you can capture
// the movement a little easier.
if (document.layers) { // Netscape
  document.captureEvents(Event.MOUSEMOVE);
  document.onmousemove = captureMousePosition;
} else if (document.all) { // Internet Explorer
  document.onmousemove = captureMousePosition;
} else if (document.getElementById) { // Netcsape 6
  document.onmousemove = captureMousePosition;
}
// Global variables
xMousePos = 0; // Horizontal position of the mouse on the screen
yMousePos = 0; // Vertical position of the mouse on the screen

function captureMousePosition(e) {
  if (document.layers) {
    // When the page scrolls in Netscape, the event's mouse position
    // reflects the absolute position on the screen. innerHight/Width
    // is the position from the top/left of the screen that the user is
    // looking at. pageX/YOffset is the amount that the user has 
    // scrolled into the page. So the values will be in relation to
    // each other as the total offsets into the page, no matter if
    // the user has scrolled or not.
    xMousePos = e.pageX;
    yMousePos = e.pageY;
  } else if (document.all) {
    // When the page scrolls in IE, the event's mouse position 
    // reflects the position from the top/left of the screen the 
    // user is looking at. scrollLeft/Top is the amount the user
    // has scrolled into the page. clientWidth/Height is the height/
    // width of the current page the user is looking at. So, to be
    // consistent with Netscape (above), add the scroll offsets to
    // both so we end up with an absolute value on the page, no 
    // matter if the user has scrolled or not.
    xMousePos = window.event.x+document.body.scrollLeft;
    yMousePos = window.event.y+document.body.scrollTop;
  } else if (document.getElementById) {
    // Netscape 6 behaves the same as Netscape 4 in this regard 
    xMousePos = e.pageX;
    yMousePos = e.pageY;
  }
}

function DivSetVisible(state, divn) {
   var DivRef = document.getElementById(divn);
   var IfrRef = document.getElementById('DivShim');
   if(state) {
     DivRef.style.display = "inline";
     istyle=IfrRef.style;
     istyle.width  = DivRef.offsetWidth;
     istyle.height = DivRef.offsetHeight;
     istyle.top    = DivRef.style.top;
     istyle.left   = DivRef.style.left;
     //istyle.zIndex = DivRef.style.zIndex-1;
     istyle.display = "inline";
   }
   else {
     DivRef.style.display = "none";
     IfrRef.style.display = "none";
   }
  }

var popupFrameLoaded = false;
var originalProp = null;
var propName = null;
var openedPopups = new Array();
var currentDiv = null;
var currentImgId = null;
var currentFormName = null;

/**
 *  Opens the popup when icon is clicked
 */
function onClickPopup(e) {
  target = getTargetElement(e);
  if (!target)
    return;
  if (target.tagName != "IMG")  
    return;
  var imgId = target.id;
  currentImgId = imgId;
  var propName1 = imgId.substring(0, imgId.length - "_filter".length);  
  var form = getFormNode(target);
  currentFormName = form.name;
  propName1 = propName1.substring(0, propName1.length - (form.name.length + 1));  

  if (currentDiv)
    menuClose2(currentDiv);
  
  originalProp = propName1;
  var idx = propName1.indexOf(".");
  if (idx != -1)
    propName = propName1.substring(0, idx);
  else
    propName = propName1;

  var divId = propName + "_" + form.name;
  currentDiv = document.getElementById(divId);
  var div = openedPopups[divId];
  if (div != null) {
    menuOpenClose(divId, imgId);
    return;
  }

  // form url based on parameters that were set
  var url;
  //url = "http://127.0.0.1/hudsonfog/smartPopup?pUri=http://www.hudsonfog.com/voc/software/crm/Bug/affectedComponent&selectOnly=y&affectedComponent_filter=y&action=explore&file=/localSearchResults.html&type=http://www.hudsonfog.com/voc/software/crm/Bug&$form=" + currentFormName;
  url = "smartPopup?pUri=" + propName;
  var params = getFormFilters(form);
  url = url + params;
  url = url + "&$form=" + form.name;
  url = url + "&" + propName + "_filter=y&$selectOnly=y";
  // request listbox context from the server and load it into a 'popupFrame' iframe
  var onClickPopupFrame = frames["popupFrame"];
  popupFrameLoaded = false;
  onClickPopupFrame.location.href = url; // load data from server into iframe
                                         // iframe onLoad will copy content into popupDiv
  setTimeout(loadPopup, 100);
}

function loadPopup() {
  if (!popupFrameLoaded) {
    setTimeout(loadPopup, 100);
    return;
  }  

  var bottomFrame = frames['popupFrame'];
  if (currentDiv) {
    var body = bottomFrame.document.body;
    if (body) {
      currentDiv.innerHTML = body.innerHTML;
    }
  }

  menuOpenClose(currentDiv.id, currentImgId);
  interceptPopupEvents(currentDiv);
//alert("openedPopups=" + currentDiv.id);
  openedPopups[currentDiv.id] = currentDiv;
}

function interceptPopupEvents(div) {
  var tableId = "table_" + propName + "_" + currentFormName;
//alert("tableId=" + tableId);
  var table = document.getElementById(tableId);

  addEvent(div, 'mouseover', popupOnMouseOver, false);
  addEvent(div, 'mouseout',  popupOnMouseOut,  false);

  var trs = table.getElementsByTagName("tr");
  for (i=0;i<trs.length; i++) {
    var elem = trs[i];
    addEvent(elem, 'click',     popupOnClick,        false);
    addEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    addEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

function getFormFilters(form) {
  var p = "";
  var fields = form.elements;
  for (i=0; i<fields.length; i++) {
    var field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;

    if (!type || !name || !value || value == "")
      continue;
    if (type.toUpperCase() == "SUBMIT") 
      continue;
    else if (type.toUpperCase() == "CHECKBOX" && name != "on") 
      continue;
    if (value.indexOf("-- ") == 0 && value.indexOf(" --", value.length - 3) != -1)
      continue;
          
    p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
}

/**
 *  Reacts to clicks inside the popup
 */
function popupOnClick(e) {
  var tr;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  tr = getTrNode(target);
  if (!tr)
    return;
  var form = getFormNode(target);
   
  var table = tr.parentNode;
  var table1 = table.parentNode;
  
  var propertyShortName = table1.id.substring("table_".length);
  propertyShortName = propertyShortName.substring(0, propertyShortName.length - (form.name.length + 1));
  var idx = propertyShortName.indexOf(".");
  var prop = null;
  if (idx == -1)
    prop = propertyShortName; 
  else
    prop = propertyShortName.substring(0, idx);

  var select = prop + "_select";
  var formField = form.elements[select];

  formField.value = tr.id; // property value corresponding to a listitem
  var chosenTextField = form.elements[originalProp];

  var items = tr.getElementsByTagName('td');
  var val = items[1].innerHTML;
  var idx = val.lastIndexOf(">");
  chosenTextField.value = val.substring(idx + 1);
  chosenTextField.style.backgroundColor='#ffffff';
  var divId = prop + "_" + form.name;
  var div = document.getElementById(divId);
  menuClose2(div);
  clearOtherPopups(div);
  return true;
}

function clearOtherPopups(div) {
//alert("div=" + div.id + ", openedPopups.length=" + openedPopups.length)    
  for (i in openedPopups) {
    var p = openedPopups[i];
    if (p == null)
      continue;
//alert("openedPopup=" + p.id)    
    if (p != div) {
      openedPopups[i] = null;
    }  
  }
}

function getFormNode(elem) {
  var form = elem.parentNode;
  if (form.tagName.toUpperCase() == "FORM") {
    return form;
  }  
  else
    return getFormNode(form);
}

var keysPressedSnapshot = "";
var keyPressedElement;
function autoComplete(e) {
  var target;
  e = (e) ? e : ((window.event) ? window.event : null);

  if (!e) 
    return;

  target = getTargetElement(e);
  if (!target)
    return;

  var form = target.form;
  if (form.name != "rightPanelPropertySheet")
    return true;

  keyPressedElement = target;
  keysPressedSnapshot = target.value + e.which;
//    alert("popupKeyPress, target=" + target.tagName + ", value: " + keysPressedSnapshot); 
  setTimeout(autoCompleteTimeout, 1000);
  return true;
}

function autoCompleteTimeout() {
  if (!keyPressedElement)
    return;
//  if (!keyPressedElement.hasFocus)
//    return;
//alert("autoCompleteTimeout, target=" + keyPressedElement.tagName);
  if (keysPressedSnapshot == keyPressedElement.value)
    alert("autoCompleteTimeout, target=" + keyPressedElement.tagName + ", value: " + keysPressedSnapshot); 
}

function popupOnMouseOver(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  if (!target)
    return;
  
  window.status=propName; 
  return true;
}

function popupOnMouseOut(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  if (!target)
    return;
  
  window.status='';
  
  if (currentDiv) 
    menuClose(currentDiv.id);
  return true;
}

function getTrNode(elem) { 
  var e;

  if (elem.tagName.toUpperCase() == 'TR')
    return elem;
  e = elem.parentNode;
  if (e)
    return getTrNode(e);
  else
    return null;
}

function popupRowOnMouseOver(e) {
  window.status='';
  var tr;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
//alert("target = " + target.tagName)
  tr = getTrNode(target);
  if (!tr)
    return;

  var tds = tr.getElementsByTagName("td");
  for (i=0; i<tds.length; i++) {
    var elem = tds[i];
    elem.style.backgroundColor='#B6BDD2';
  }
 
  return true;
}

function popupRowOnMouseOut(e) {
  window.status='';
  var tr;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  tr = getTrNode(target);
  if (!tr)
    return;

  var tds = tr.getElementsByTagName("td");
  for (i=0; i<tds.length; i++) {
    var elem = tds[i];
    elem.style.backgroundColor='';
  }
 
  return true;
}
