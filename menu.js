/* 
 * Popup Menu system 
 */ 
var MenuArray = new Array();
var currentPopupRow;

var DarkMenuItem  = '#B6BDD2';
var LightMenuItem = '';  

var HIDDEN  =  'hidden';
var VISIBLE =  'visible';

if (document.layers) {
  HIDDEN  = 'hide';
  VISIBLE = 'show';	
}

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
	
	var divRef = document.getElementById(divName);
	poptext = divRef.style;
	if (poptext.display == "none" || poptext.display == "") {
		poptext.visibility = HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'
		poptext.display    = 'inline'; // must make it inline here - otherwise coords will not get set
		if (imgName) {
			divRef.style.left = 0;
			divRef.style.top  = 0;
			var left = docjslib_getImageXfromLeft(imgName);
			var top  = docjslib_getImageYfromTop(imgName) + docjslib_getImageHeight(imgName);
			var screenX = document.body.clientWidth;
			var screenY = document.body.clientHeight;
			// Find out how close to the corner of the window
			var rightedge  = document.body.clientWidth + document.body.scrollLeft - left;
			var bottomedge = document.body.clientHeight + document.body.scrollTop - top;

			// If the horizontal distance isn't enough to accomodate the width of the context menu
			if (rightedge < divRef.offsetWidth)
				left = screenX - divRef.offsetWidth + document.body.scrollLeft; // move horizontal position of the menu to the left by its width

			// Same concept with the vertical position
			if (bottomedge < divRef.offsetHeight)
				top = document.body.scrollTop+document.body.offsetHeight-divRef.offsetHeight;

			poptext.left = left;
			poptext.top  = top;
		}
    DivSetVisible(true, divName);
    poptext.visibility = VISIBLE; // finally make div visible
    deselectRow(currentPopupRow);
    currentPopupRow = firstRow(divRef);
	} 
	else {
		//poptext.display = "none";
		DivSetVisible(false, divName);
	}
	if (document.getElementById("menudiv_Email") != null &&
      document.getElementById("menudiv_Email").style.display == "inline") {
	  var e = document.getElementById("emailForm");
	  if (e) e.subject.value = document.title;
	}
	if (document.getElementById("menudiv_Schedule") != null &&
      document.getElementById("menudiv_Schedule").style.display == "inline") {
		var sf = document.getElementById("scheduleForm");
		if (sf) sf.name.value = document.title;
	}
}

var closeTimeoutId;
var openTimeoutId;

function menuOpen(div, link) {
  openTimeoutId = setTimeout("menuOpen1('" + div + "', '" + link + "')", 100);
}

function menuOpen1(div, link) {
	poptext = document.getElementById(div).style;
	if (poptext.display == "none" || poptext.display == "") {
		linkLeft = docjslib_getImageXfromLeft(link);
		linkTop = docjslib_getImageYfromTop(link);
		linkWidth = docjslib_getImageWidth(link);
		linkHeight = docjslib_getImageHeight(link);

		if (xMousePos < linkLeft || xMousePos > linkLeft + linkWidth ||
        yMousePos < linkTop  || yMousePos > linkTop  + linkHeight) {
			return;
		}
	} 
	else {
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
      document.getElementById("menudiv_Email").style.display == "inline") {
		var e = document.forms["emailForm"];
		if (e) e.elements["subject"].value = document.title;
	}
	if (document.getElementById("menudiv_Schedule") != null &&
      document.getElementById("menudiv_Schedule").style.display == "inline") {
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
    poptextLeft   = docjslib_getImageXfromLeft(div);
    poptextTop    = docjslib_getImageYfromTop(div);
    poptextWidth  = docjslib_getImageWidth(div);
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
    poptextLeft   = docjslib_getImageXfromLeft(div);
    poptextTop    = docjslib_getImageYfromTop(div);
    poptextWidth  = docjslib_getImageWidth(div);
    poptextHeight = docjslib_getImageHeight(div);
    DivSetVisible(false, div);
    currentDiv = null;
  }
}

function menuClose(div, timeout) {
  if (!timeout)
    timeout = 600;
  closeTimeoutId = setTimeout("menuClose1('" + div + "')", timeout);
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

function DivSetVisible(makeVisible, divn) {
   var DivRef = document.getElementById(divn);
   var IfrRef = document.getElementById('DivShim');
   if(makeVisible) {
     DivRef.style.display = "inline";
     // Make position/size of iframe same as div's position/size
     istyle=IfrRef.style;
     istyle.display = "inline";
     istyle.width  = DivRef.offsetWidth;
     istyle.height = DivRef.offsetHeight;
     istyle.top    = DivRef.style.top;
     istyle.left   = DivRef.style.left;
     //istyle.zIndex = DivRef.style.zIndex-1;
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
var currentResourceUri = null;
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
  var form = getFormNode(target);
  onClickPopup1(imgId, form);      
}
  
/**
 *  Opens the popup when needed, e.g. on click, on enter
 */
function onClickPopup1(imgId, form, enteredText, enterFlag) {
  var propName1 = imgId.substring(0, imgId.length - "_filter".length);   // cut off "_filter"
  var idx = propName1.lastIndexOf('_');
  if (idx == -1)
    return;
  currentFormName = propName1.substring(idx + 1);
  propName1 = propName1.substring(0, propName1.length - (currentFormName.length + 1));  

  var d = currentDiv;
  if (currentDiv) {    
    menuClose2(currentDiv);
  }
  if (imgId == currentImgId && d != null)
    return;
  currentImgId  = imgId;
    
  originalProp = propName1;
  var idx = -1;
  
  var divId;
  if (currentFormName == "siteResourceList") {
    idx = propName1.indexOf(".$.");
    var idx1 = propName1.indexOf(".", idx + 3);
    propName = propName1.substring(0, idx1);
    divId = propName + "_" + currentFormName;
    propName = propName.substring(idx + 3, idx1);
    currentResourceUri = propName1.substring(0, idx);
  }
  else {
    idx = propName1.indexOf(".");
    if (idx != -1) {
      propName = propName1.substring(0, idx);
      divId = propName + "_" + currentFormName;
    }
    else {
      idx = propName1.indexOf("_class");
      if (idx == -1)  {
        propName = propName1;
        divId = propName + "_" + currentFormName;
      }
      else {
        propName = propName1.substring(0, idx);
        if (document.forms[currentFormName].elements[propName + "_class"].value == "") 
          divId = propName + "_class_" + currentFormName;
        else {
          divId = propName + "_" + currentFormName;
          originalProp = propName + propName1.substring(propName.length + "_class".length);
        }
      }
    }
  } 
  currentDiv = document.getElementById(divId);
  var div = openedPopups[divId];
  
  // Use existing DIV from cache (unless text was Enter-ed - in which case always redraw DIV)
  if (!enteredText && div != null) { 
    menuOpenClose(divId, imgId);
    if (currentDiv.focus)
      currentDiv.focus();
    else {
      var elm = document.getElementById(currentDiv.id + "_$focus_link"); 
      if (elm) {
        elm.focus();
      }  
    }  
    return;
  }
  
  // form url based on parameters that were set
  var url;

  url = "smartPopup?pUri=" + encodeURIComponent(propName);
  if (currentFormName == "siteResourceList") {
    url += "&editList=1&uri=" + encodeURIComponent(currentResourceUri);
  }
  var formAction = form.elements['action'].value;
  var allFields = true;
  if (formAction != "searchLocal" && formAction != "searchParallel") {
    if (enterFlag)
      allFields = false;
  }
  var params = getFormFilters(form, allFields);
  if (params)
    url = url + params;

  url += "&$form=" + currentFormName;
  url += "&" + propName + "_filter=y"; 
  if (!enterFlag)  
    url += "&$selectOnly=y";
  if (enteredText)
    url += "&" + propName + "=" + encodeURIComponent(enteredText);
  // request listbox context from the server and load it into a 'popupFrame' iframe
//alert("url = " + url);
  var onClickPopupFrame = frames["popupFrame"];
  popupFrameLoaded = false;
  onClickPopupFrame.location.href = url; // load data from server into iframe
                                         // iframe onLoad will copy content into popupDiv
  setTimeout(loadPopup, 100);
}

/**
 *  Loads the popup into the div from the iframe
 */
function loadPopup() {
  if (!popupFrameLoaded) {
    setTimeout(loadPopup, 100);
    return;
  }  

  var popupFrame = frames['popupFrame'];
  if (currentDiv) {
    var body = popupFrame.document.getElementById('popupFrameBody');
    if (body) {
      currentDiv.innerHTML = body.innerHTML;
    }
  }

  menuOpenClose(currentDiv.id, currentImgId);
  interceptPopupEvents(currentDiv);
  openedPopups[currentDiv.id] = currentDiv;
     
  if (currentDiv.focus)
    currentDiv.focus();
  else {
    var elm = document.getElementById(currentDiv.id + "_$focus_link"); 
    if (elm) {
      //alert("t2");
      elm.focus();
    }  
  }  
     
}

function interceptPopupEvents(div) {
  var addToTableName = "";

  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }
  var tableId = "table_" + propName + addToTableName + "_" + currentFormName;
//alert("propName = " + propName);  
//alert("tableId = " + tableId);
  var table   = document.getElementById(tableId);
  var img     = document.getElementById(currentImgId);

  addEvent(div,  'mouseover', popupOnMouseOver, false);
  addEvent(div,  'mouseout',  popupOnMouseOut,  false);
  addEvent(img,  'mouseout',  popupOnMouseOut,  false);
  if (document.all) // IE - works only on keydown
    addEvent(div,  'keydown',   popupRowOnKeyPress,  false);
  else              // Mozilla - only keypress allows to call e.preventDefault() to suppress browser's scrolling in popup
    addEvent(div,  'keypress',  popupRowOnKeyPress,  false);

  var trs = table.getElementsByTagName("tr");
  for (i=0;i<trs.length; i++) {
    var elem = trs[i];
    addEvent(elem, 'click',     popupRowOnClick,     false);
    addEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    addEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
    //addEvent(elem, 'keypress',  popupRowOnKeyPress,  false);
  }
}

function getFormFilters(form, allFields) {
  var p = "";
  var fields = form.elements;
  
  for (i=0; i<fields.length; i++) {
    var field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;
    if (!type || !name)
      continue;
    if (type.toUpperCase() == "SUBMIT") 
      continue;
    if (allFields == false) {
      if (!wasFormFieldModified(field)) 
        continue;
    }  
    else {
      if (!value || value == '')
        continue;

      if (type.toUpperCase() == "CHECKBOX" && name != "on") 
        continue;
      if (value == "All")
        continue;
      if (value.indexOf("-- ") == 0 && value.indexOf(" --", value.length - 3) != -1) 
        continue;
    }
          
    p += "&" + name + "=" + encodeURIComponent(value);
//    addEvent(elem, 'keypress',  popupRowOnKeyPress,  false);
//    addEvent(elem, 'keydown',   popupRowOnKeyPress,  false);
  }
  return p;
}

/*
 * Receives control on form submit events
 */
function popupOnSubmit(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e) 
    return;

  target = getTargetElement(e);
  var form = target;
  
  var action = form.attributes['action'];
  // form url based on parameters that were set
  var url = "FormRedirect?JLANG=en"; // HACK: since form.action returns the value of '&action='

  var formAction = form.elements['action'].value;
  var allFields = true;
  if (formAction != "searchLocal" && formAction != "searchParallel")
    allFields = false;
    
  var params = getFormFilters(form, allFields);
  var submitButtonName  = null;
  var submitButtonValue;
/*
  var t = target.attributes['type'];
  if (t.toUpperCase() == 'SUBMIT') {
    if (target.attributes['name'] == "Clear")
      url += "&clear=Clear";      
    else
      url += "&submit=y";
  }
  else 
    url += "&submit=y";
*/
  url += "&submit=y"; // HACK: since target.type return the value of &type instead of an input field's type property
/*
  // figure out the name and the value of the Submit button
  for (i=0; i<form.elements.length; i++) {
    var elem = form.elements[i];
    if (elem.type.toUpperCase() == 'SUBMIT') {
      submitButtonName  = elem.name;
      submitButtonValue = elem.value;
    }  
  }  

  if (!submitButtonName)
    return true;
  var hasQ = url.indexOf('?') != -1;
  if (!hasQ)
    url += '?' + submit;
  else  
    url += '&' + submit;
*/
  
  if (params)
    url = url + params;   
  url += '&$form=' + form.name;

  //url += '&$selectOnly=y';
  url += "&type=" + form.type.value + "&action=" + formAction;
  if (form.uri) 
    url += "&uri=" + encodeURIComponent(form.uri.value);

  form.method   = 'GET';
  form.onsubmit = null;

  if (document.all || document.getElementById) {
//    form.submit.disabled = true; // HACK: for some reason can not disable this button - the form would not get submitted
    form.submit.value = 'Please wait';
    form.submit.style.cursor = 'wait'; 
    var cancel;
    if (form.cancel)
      cancel = form.cancel;
    else if (form.clear)  
      cancel = form.clear;
    else if (form.clear_)  
      cancel = form.clear_;
    cancel.style.visibility = HIDDEN; 
  }
  
  document.location.href = url;
  return false; 
}

/**
 *  Reacts to clicks inside the popup
 */
function popupRowOnClick(e) {
  var tr;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  tr = getTrNode(target);
  if (!tr)
    return;
    
  return popupRowOnClick1(tr);  
 }
 
 function popupRowOnClick1(tr) {
  //alert("popupRowOnClick1: " + tr.id);           
  if (tr.previousSibling == null) // skip clicks on menu header (it is a first tr - has no prev sibling)
    return;

  var form = getFormNode(tr);

  var table  = tr.parentNode;
  var table1 = table.parentNode;
  
  var propertyShortName = table1.id.substring("table_".length);
  var idx = propertyShortName.lastIndexOf('_');
  var formName = propertyShortName.substring(idx + 1);
  propertyShortName = propertyShortName.substring(0, idx);
  var idx = propertyShortName.indexOf(".");
  var prop = null;

  if (idx == -1) {
    idx = propertyShortName.indexOf("_class");
    if (idx != -1)
      prop = propertyShortName.substring(0, propertyShortName.length - 6); 
    else
      prop = propertyShortName; 
  }
  else 
    prop = propertyShortName.substring(0, idx);

  var formField;
  var chosenTextField = form.elements[originalProp];
  var verified = prop + "_verified";
  if (currentResourceUri)
    verified = currentResourceUri + ".$." + verified;
  
  var iclass = prop + "_class";    
  var formFieldClass    = form.elements[iclass];
  var formFieldVerified = form.elements[verified];
  if (formFieldVerified) 
    formFieldVerified.value = 'y'; // value was modified and is verified since it is not typed but is chosen from the list

  if (originalProp.indexOf("_class") == -1) {
    var select = prop + "_select";
    if (currentResourceUri)
      select = currentResourceUri + ".$." + select;

    formField = form.elements[select];

    var items = tr.getElementsByTagName('td');
    if (tr.id == '$more') {
      var anchors = tr.getElementsByTagName('a');
      document.location.href = anchors[0].href;
      return false;
    }

    if (tr.id == '$clear') {
      var currentLabel = chosenTextField.value;
      var initialLabel = getFormFieldInitialValue(chosenTextField);
      // reset to initial value
      if (currentLabel != initialLabel) {
        chosenTextField.value   = initialLabel;
        formField.value         = getFormFieldInitialValue(formField);
        if (formFieldClass)
          formFieldClass.value  = getFormFieldInitialValue(formFieldClass);
      }
      // reset to no-value
      else {
        chosenTextField.value   = '';
        formField.value         = '';
        if (formFieldClass)
          formFieldClass.value  = '';
      }
      if (formFieldVerified) 
        formFieldVerified.value = 'n';
      openedPopups[currentDiv.id] = null;
      var imgId  = prop + "_class_img";
      var img = document.getElementById(imgId);
      if (img) {
        document.getElementById(imgId).src = "icons/blank.gif";
        document.getElementById(imgId).title = "";
      }
    }
    else  {
      var val = items[1].innerHTML;
      var idx = val.lastIndexOf(">");
      chosenTextField.value = val.substring(idx + 1);
      formField.value = tr.id; // property value corresponding to a listitem
    }
    if (chosenTextField.style)
      chosenTextField.style.backgroundColor='#ffffff';
  }
  else {
    var img = tr.getElementsByTagName("img")[0];    
    var imgId  = prop + "_class_img";
    if (img) {
      document.getElementById(imgId).src   = img.src;
      document.getElementById(imgId).title = img.title;
    }
    formFieldClass.value = tr.id; // property value corresponding to a listitem
    openedPopups[currentDiv.id] = null;
    menuClose2(currentDiv)
    onClickPopup1(currentImgId, form);
    return true;
  }
  var divId = prop + "_" + formName;
  if (currentResourceUri != null)
    divId = currentResourceUri + ".$." + divId;
  var div = document.getElementById(divId);
  menuClose2(div);
  clearOtherPopups(div);
  return false;
}

var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

function autoCompleteOnFocus(e) {
  e = (e) ? e : ((window.event) ? window.event : null);

  if (!e) 
    return;

  var target;
  target = getTargetElement(e);
  if (!target)
    return;
    
  target.select();  
}

function autoCompleteOnBlur(e) {
  e = (e) ? e : ((window.event) ? window.event : null);

  if (!e) 
    return;
}

function autoCompleteOnMouseout(e) {
  e = (e) ? e : ((window.event) ? window.event : null);

  if (!e) 
    return;

  var target;
  target = getTargetElement(e);
  if (!target)
    return;
    
	var img = document.getElementById(keyPressedImgId);
	if (!img)
	  return true;

  if (currentDiv) {
    menuClose2(currentDiv);
  }  
}

function getKeyCode(e) {
	if( typeof( e.keyCode ) == 'number'  ) {
	    //IE, NS 6+, Mozilla 0.9+
	    return e.keyCode;
	} else if( typeof( e.charCode ) == 'number'  ) {
	    //also NS 6+, Mozilla 0.9+
	    return e.charCode;
	} else if( typeof( e.which ) == 'number' ) {
	    //NS 4, NS 6+, Mozilla 0.9+, Opera
	    return e.which;
	} else {
	    //TOTAL FAILURE, WE HAVE NO WAY OF OBTAINING THE KEY CODE
	    throw Error("can't detect the key pressed");
	}
}

function autoCompleteOnKeyDown(e) {
  if( typeof( e.keyCode ) == 'number') {
    if (e.keyCode == 8 || e.keyCode == 127) { // backspace, ctrl-enter
      var flag = autoComplete(e);
      return flag;
    }  
    else if (e.keyCode == 9)                 // tab
      return autoComplete(e);
    else  
      return true;   
  }
}

/**
 * Show popup for the text entered in input field (by capturing keyPress events). 
 * Show popup only when the person stopped typing (timeout).
 * Special processing for Enter: 
 *   - in Filter mode     - let it submit the form.
 *   - in Data Entry mode - on Enter show popup immediately,
 *                          and close popup if hit Enter twice.
 */
function autoComplete(e) {
  keyPressedTime = new Date().getTime();
  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e) 
    return;

  var characterCode = getKeyCode(e); // code typed by the user
  var target;
  target = getTargetElement(e);
  if (!target)
    return;

  if (currentDiv)
    menuClose2(currentDiv);

  var form = target.form;
  switch (characterCode) {
    case 38:  //up arrow  
    case 40:  //down arrow
    case 37:  //left arrow
    case 39:  //right arrow
    case 33:  //page up  
    case 34:  //page down  
    case 36:  //home  
    case 35:  //end                  
    case 27:  //esc  
    case 16:  //shift  
    case 17:  //ctrl  
    case 18:  //alt  s
    case 20:  //caps lock

      return true;
    case 9:   //tab  
    case 8:   //backspace  
    case 46:  //delete
    case 127: //ctrl-enter
    case 13:  //enter  
      break;
  }     
  var propName  = target.name;
  var formName  = target.id;
  var propName1 = propName;
  var idx = propName.indexOf(".");
  if (idx != -1)
    propName1 = propName1.substring(0, idx);

  var fieldVerified = form[propName1 + '_verified'];

  if (characterCode == 13) { // enter
    if (!fieldVerified) { // show popup on Enter only in data entry mode (indicated by the presence of _verified field)
      return true;
    }
  }
  keyPressedImgId     = propName + "_" + formName + "_filter";
  keyPressedElement   = target;
  keyPressedElement.style.backgroundColor='#ffffff';
  
  if (characterCode == 13) { // open popup (or close it on second Enter)
    onClickPopup1(keyPressedImgId, keyPressedElement.form, keyPressedElement.value);
    return false;            // tell browser not to do submit on 'enter'
  }  
  else {
    if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not verified yet (i.e. not chose from the list)
    setTimeout("autoCompleteTimeout(" + keyPressedTime + ")", 600);
    clearOtherPopups(currentDiv);
    return true;
  }  
}

function autoCompleteTimeout(invocationTime) {
  if (keyPressedTime > invocationTime) {
    return;
  }
  if (!keyPressedImgId)
    return;

	var img = document.getElementById(keyPressedImgId);
	if (!img) {
	  return true;
	}  
	
	if (keyPressedElement.value.length == 0) // avoid showing popup for empty fields
	  return;
	onClickPopup1(keyPressedImgId, keyPressedElement.form, keyPressedElement.value);
}

/**
 * This onKeyDown handler is needed since some browsers do not capture certain special keys on keyPress.
 */
function autoCompleteOnKeyDown(e) {
  if( typeof( e.keyCode ) == 'number') {
    if (e.keyCode == 8 || e.keyCode == 127) { // backspace, ctrl-enter
      var flag = autoComplete(e);
      return flag;
    }  
    else if (e.keyCode == 9)                  // tab
      return autoComplete(e);
    else  
      return true;   
  }
}

/**
 * This handler allows to use arrow keys to move through the menu and Enter to choose the menu element.
 */
function popupRowOnKeyPress(e) {
  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e) 
    return;

  var characterCode = getKeyCode(e); // code typed by the user
  var target;
  var tr = currentPopupRow;
  if (!tr)
    return;

  switch (characterCode) {
    case 38:  //up arrow  
    case 40:  //down arrow
      break;
    case 27:  //esc  
      if (currentDiv)
        menuClose2(currentDiv);
      return false;  
    case 13:  //enter
      popupRowOnClick1(tr);
    	e.cancelBubble = true;
	    e.returnValue = false;
	    if (e.preventDefault) e.preventDefault();   
      return false;
    default:
      return true;  
  }     

  // down arrow
  if (characterCode == 40) {
    deselectRow(currentPopupRow);
    var nextTr = nextRow(tr);
	  currentPopupRow = nextTr;
    selectRow(currentPopupRow);
	} 
	// up arrow
	else if (characterCode == 38) {
	  deselectRow(currentPopupRow);
	  prevTr = prevRow(tr);
	  currentPopupRow = prevTr;
    selectRow(currentPopupRow);
	}
	e.cancelBubble = true;
	e.returnValue = false;
	if (e.preventDefault) e.preventDefault();
  return false;
}

function deselectRow(tr) {
  if (!tr)
    return;
  var tds = tr.getElementsByTagName("td");  
  for (i=0; i<tds.length; i++) {
    var elem = tds[i];
    elem.style.backgroundColor = LightMenuItem;
  } 
}

function selectRow(tr) {
  if (!tr)
    return;
  var tds = tr.getElementsByTagName("td");  
  for (i=0; i<tds.length; i++) {
    var elem = tds[i];
    elem.style.backgroundColor = DarkMenuItem;
  } 
}

function nextRow(tr) {
  var next = tr.nextSibling;

  if (next == null) {
    var table = tr.parentNode;
    var trs = table.getElementsByTagName("tr");  
    return trs[1]; // skip [0] tr since it is a header
  }

  if (next.tagName && next.tagName.toUpperCase() == 'TR') 
    return next;
  else  
    return nextRow(next);    	    
}	  

function prevRow(tr) {
  var prev = tr.previousSibling;

  if (prev == null || isFirstRow(prev)) {
    var table = tr.parentNode;
    var trs = table.getElementsByTagName("tr");  
    return trs[trs.length - 1];
  }
  
  if (prev.tagName && prev.tagName.toUpperCase() == 'TR') 
    return prev;
  else  
    return prevRow(prev);    	    
}	  

function isFirstRow(tr) {
  if (tr && tr.id == '$classLabel')
    return true;
  else
    return false;  
}

function firstRow(div) {
  var tables = div.getElementsByTagName("table");  
  var trs;
  for (i=0; i<tables.length; i++) {
    trs = tables[i].getElementsByTagName("tr");
    if (trs && isFirstRow(trs[0]))
      break; 
  }
  if (!trs)
    return;
  return trs[1];
}

function popupOnMouseOver(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  if (!target)
    return;
  
	if (closeTimeoutId != null) {
     clearTimeout(closeTimeoutId);
     closeTimeoutId = null;
  }  
  window.status = propName; 
  
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

function popupRowOnMouseOver(e) {
  var tr;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  tr = getTrNode(target);
  if (!tr)
    return;
  if (isFirstRow(tr))
    return;

  if (currentPopupRow)
    deselectRow(currentPopupRow);

  // darken new current row
  currentPopupRow = tr;
  selectRow(currentPopupRow);
  return true;
}

function popupRowOnMouseOut(e) {
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

/************************************************* Helper functions ***************************************/
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
  var f = elem.parentNode;
  if (!f)
    return null;
  if (f.tagName.toUpperCase() == "FORM")
    return f;
  else
    return getFormNode(f);
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

/**
 * Helper function - gathers the parameters (from form elements) to build a URL
 * If allFields is true - we are in a Filter panel - need to take into account all input fields
 * Otherwise - it is a Data Entry mode, i.e. - take only fields that were modified by the user
 */
function getFormFilters(form, allFields) {

  var p = "";
  var fields = form.elements;
  for (i=0; i<fields.length; i++) {
    var field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;

    if (!type || !name)
      continue;
    if (type.toUpperCase() == "SUBMIT") 
      continue;
    if (!allFields) {
      if (!wasFormFieldModified(field))
        continue;
    }  
    else {
      if (!value || value == '')
        continue;

      if (type.toUpperCase() == "CHECKBOX" && name != "on") 
        continue;
      if (value.indexOf("-- ") == 0 && value.indexOf(" --", value.length - 3) != -1)
        continue;
    }
          
    p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
}

