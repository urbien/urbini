/* 
 * Popup Menu system 
 */ 
var DarkMenuItem  = '#dee6e6';
var LightMenuItem = '';  

var HIDDEN  =  'hidden';
var VISIBLE =  'visible';

if (document.layers) {
  HIDDEN  = 'hide';
  VISIBLE = 'show';	
}

var popupFrameLoaded = false;
var originalProp = null;
var propName = null;
var openedPopups = new Array();
var currentDiv = null;
var closeTimeoutId;
var currentPopupRow;
var currentImgId = null;
var currentFormName = null;
var currentResourceUri = null;
var internalFocus = false;

function menuOpenClose(divName, imgName) {
  if (currentDiv) {
    menuClose2(currentDiv);
    currentDiv = null;
  }  
  
  var img = document.getElementById(imgName);
  var divRef = document.getElementById(divName);
 
  setDivVisible(divRef, img);
  deselectRow(currentPopupRow);

  currentDiv = divRef;
  currentPopupRow = firstRow(divRef);

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

function menuClose1(divId) {
  var divRef =document.getElementById(divId);
  if (!divRef)
    return;

  //if (divRef != currentDiv) {
  //  return;
  //}  
  poptext = divRef.style;
  if (poptext.display == "inline") {
    poptextLeft   = docjslib_getImageXfromLeft(divRef);
    poptextTop    = docjslib_getImageYfromTop(divRef);
    poptextWidth  = docjslib_getImageWidth(divRef);
    poptextHeight = docjslib_getImageHeight(divRef);
    if (xMousePos < poptextLeft || xMousePos > poptextLeft + poptextWidth ||
        yMousePos < poptextTop || yMousePos > poptextTop + poptextHeight) {
        //poptext.display = "none";
      setDivInvisible(divRef);
      currentDiv = null;
    } else {
      timeoutId = setTimeout("menuClose1('" + divId + "')", 100);
    }
  }
}

/* close div uncoditionally with no regard to mouse position */
function menuClose2(divElem) {
  poptext = divElem.style;
  if (poptext.display == "inline") {
    poptextLeft   = docjslib_getImageXfromLeft(divElem);
    poptextTop    = docjslib_getImageYfromTop(divElem);
    poptextWidth  = docjslib_getImageWidth(divElem);
    poptextHeight = docjslib_getImageHeight(divElem);
    setDivInvisible(divElem);
    if (divElem == currentDiv)
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

function docjslib_getImageWidth(img) {
  return img.offsetWidth;
}
function docjslib_getImageHeight(img) {
  return img.offsetHeight;
}
var NS4 = document.layers;
function docjslib_getImageXfromLeft(img) {
  if (NS4) return img.x;
  else return docjslib_getRealLeft(img);
}
function docjslib_getImageYfromTop(img) {
  if (NS4) return img.y;
  else return docjslib_getRealTop(img);
}
function docjslib_getRealLeft(img) {
  xPos   = img.offsetLeft;
  tempEl = img.offsetParent;
  while (tempEl != null) {
    xPos   += tempEl.offsetLeft;
    tempEl  = tempEl.offsetParent;
  }
  return xPos;
}
function docjslib_getRealTop(img) {
  yPos   = img.offsetTop;
  tempEl = img.offsetParent;
  while (tempEl != null) {
    yPos  += tempEl.offsetTop;
    tempEl = tempEl.offsetParent;
  }
  return yPos;
}

function menu_onmouseover(itemcode) {
  document.getElementById(itemcode + 'td1').style.backgroundColor = DarkMenuItem;
  document.getElementById(itemcode + 'td2').style.backgroundColor = DarkMenuItem;
  document.getElementById(itemcode + 'td3').style.backgroundColor = DarkMenuItem;
  return true;
}

function menu_onmouseout(itemcode) {
  document.getElementById(itemcode + 'td1').style.backgroundColor = '';
  document.getElementById(itemcode + 'td2').style.backgroundColor = '';
  document.getElementById(itemcode + 'td3').style.backgroundColor = '';
  return true;
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

/*
function DivSetVisible(makeVisible, divn) {
   var DivRef = document.getElementById(divn);
   var IfrRef = document.getElementById('popupIframe');
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
*/

function setDivVisible(divRef, img, offsetX, offsetY, iframeRef) {
  var ifrRef;
  if (iframeRef)
    ifrRef = iframeRef;
  else
    ifrRef = document.getElementById('popupIframe');  
  var poptext = divRef.style;
  var istyle  = ifrRef.style;

  poptext.visibility = HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'
  poptext.display    = 'inline'; // must make it inline here - otherwise coords will not get set 

  if (img) {
    //divRef.style.left = document.body.scrollLeft;
    //divRef.style.top  = document.body.scrollTop;
    var left = docjslib_getImageXfromLeft(img);
    var top  = docjslib_getImageYfromTop(img) + docjslib_getImageHeight(img);
//alert('left='+left + ', top='+top);    
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
      top = (document.body.scrollTop+screenY)-divRef.offsetHeight;

    if (offsetX)
      left = left + offsetX;
    if (offsetY)
      top = top + offsetY;
    poptext.left = left;
    poptext.top  = top;
//alert('left='+left + ', top='+top);    
  }
  istyle.top     = divRef.style.top;
  istyle.left    = divRef.style.left;

  // Make position/size of iframe same as div's position/size
  
  istyle         = ifrRef.style;
  istyle.display = "inline";
  istyle.width   = divRef.offsetWidth;
  istyle.height  = divRef.offsetHeight;
  istyle.visibility  = VISIBLE;
  
  poptext.visibility = VISIBLE; // finally make div visible  
}

function setDivInvisible(div, iframeRef) {
  var ifrRef;
  if (iframeRef)
    ifrRef = iframeRef;
  else
    ifrRef = document.getElementById('popupIframe');  
  
  if (div && div.style)
    div.style.display    = "none";
  if (ifrRef && ifrRef.style)
    ifrRef.style.display = "none";
}

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
  var isInterface;
  if (currentFormName == "siteResourceList") {
    idx = propName1.indexOf(".$.");
    var idx1 = propName1.indexOf(".", idx + 3);
    if (idx1 == -1)
      propName = propName1;
    else
      propName = propName1.substring(0, idx1);
    divId = propName + "_" + currentFormName;
    if (idx1 == -1)
      propName = propName.substring(idx + 3);
    else
      propName = propName.substring(idx + 3, idx1);
    currentResourceUri = propName1.substring(0, idx);
  }
  else {
    currentResourceUri = null;
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
        isInterface = true;
        propName = propName1.substring(0, idx);
        var el = document.forms[currentFormName].elements[propName + "_class"];
        if (!el.value || el.value == "") 
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
    hideResetRow(div, currentFormName, originalProp);
    menuOpenClose(divId, imgId);
    // make popup active for key input 
    if (currentDiv.focus) {// simple in IE
      try { currentDiv.focus(); } catch(e) {};
    }  
    else {                // hack for Netscape (using an empty anchor element to focus on)
      var elm = document.getElementById(currentDiv.id + "_$focus_link"); 
      if (elm) {
        if (elm.focus) {
          try { elm.focus(); } catch(e) {};
        }  
      }  
    }  
    return;
  }
  
  // form url based on parameters that were set
  var url;
  var formAction = form.elements['-$action'].value;

  url = "smartPopup?prop=" + encodeURIComponent(propName);
  if (currentFormName == "siteResourceList") {
    url += "&editList=1&uri=" + encodeURIComponent(currentResourceUri) + "&type=" + form.elements['type'].value;
  }
  else { 
    if (formAction != "showPropertiesForEdit" && formAction != "mkresource") {
      var allFields = true;
      if (formAction != "searchLocal" && formAction != "searchParallel") {
        if (enterFlag)
          allFields = false;
      }
      else if (currentFormName == "horizontalFilter")
        allFields = true;
 
      var params = getFormFilters(form, allFields);
      if (params)
        url = url + params;
    }
    else {
      url = url + "&type=" + form.elements['type'].value + "&-$action=" + formAction;
      
    }  
  }
  url += "&$form=" + currentFormName;
  url += "&" + propName + "_filter=y"; 
  if (!enterFlag)  
    url += "&$selectOnly=y";
  if (enteredText)
    url += "&" + propName + "=" + encodeURIComponent(enteredText);
  if (isInterface) { 
    var classValue = form.elements[propName + "_class"].value;
    if (classValue != null && classValue.length != 0)
      url += "&" + propName + "_class=" + classValue;
  }
  
  // request listbox context from the server and load it into a 'popupFrame' iframe
  var onClickPopupFrame = frames["popupFrame"];
  popupFrameLoaded = false;
  onClickPopupFrame.location.replace(url); // load data from server into iframe
  timeoutCount = 0;
  setTimeout(loadPopup, 100);
}

var timeoutCount;
/**
 *  Loads the popup into the div from the iframe
 */
function loadPopup() {
  if (!popupFrameLoaded) {
//    if (timeoutCount++ < 20)
//      setTimeout(loadPopup, 100);
//    else
//      alert("Warning: server did not return listbox data - check connection to server");
    setTimeout(loadPopup, 100);
    return;
  }  

  var popupFrame = frames['popupFrame'];
  var body = popupFrame.document.getElementById('popupFrameBody');
  if (!body) {
    alert("Warning: server did not return listbox data - check connection to server");
    return;
  }  
  var redirect = popupFrame.document.getElementById('$redirect');
  if (redirect) {
    document.location.href = redirect.href;
    return;
  }
  if (currentDiv) {
    currentDiv.innerHTML = body.innerHTML;
  }
   
  var addToTableName = "";  
  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }
  
  //var tableId = "table_" + propName + addToTableName + "_" + currentFormName;
  //var table   = document.getElementById(tableId);  
  var tables = currentDiv.getElementsByTagName('table');
  if (!tables || !tables[1]) { 
    alert("Warning: server did not return listbox data - check connection to server");
    return;
  }
  var table = tables[1];
  
  var img = document.getElementById(currentImgId);
  hideResetRow(currentDiv, currentFormName, originalProp);
  menuOpenClose(currentDiv.id, currentImgId);
  interceptPopupEvents(img, currentDiv, table);
  replaceTooltips(currentDiv);
  openedPopups[currentDiv.id] = currentDiv;

  // make popup active for key input    
  if (currentDiv.focus) { // IE 
    try { currentDiv.focus(); } catch(e) {};
  }  
  else {                // Netscape
    var elm = document.getElementById(currentDiv.id + "_$focus_link"); 
    if (elm) {
      if (elm.focus) {
        try { elm.focus(); } catch(e) {};
      }  
    }  
  }  
}

function interceptPopupEvents(img, div, table) {
  addEvent(div,  'mouseover', popupOnMouseOver, false);
  addEvent(div,  'mouseout',  popupOnMouseOut,  false);
  addEvent(img,  'mouseout',  popupOnMouseOut,  false);
  if (document.all) // IE - works only on keydown
    addEvent(div,  'keydown',   popupRowOnKeyPress,  false);
  else              // Mozilla - only keypress allows to call e.preventDefault() to suppress browser's scrolling in popup
    addEvent(div,  'keypress',  popupRowOnKeyPress,  false);

  var trs = table.getElementsByTagName("tr");
  var k=0;
  for (i=0;i<trs.length; i++) {
    var elem = trs[i];
    addEvent(elem, 'click',     popupRowOnClick,     false);
    //if (k++<2)
    //  alert(elem.id);
    addEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    addEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

function removePopupRowEventHandlers(div) {
  var tables = div.getElementsByTagName('table');
  if (!tables || !tables[1]) 
    return;
  var table = tables[1];
  var trs = table.getElementsByTagName("tr");
  var k=0;
  for (i=0;i<trs.length; i++) {
    var elem = trs[i];
    removeEvent(elem, 'click',     popupRowOnClick,     false);
    //if (k++<2)
    //  alert(elem.id);
    removeEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    removeEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

/*
 * Receives control on form submit events
 */
function popupOnSubmit(e) {
  try{updateRTEs();}catch(ex){}
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e) 
    return;

  target = getTargetElement(e);
  var form = target;
  
  var action = form.attributes['-$action'];
  // form url based on parameters that were set
  var url = "FormRedirect?JLANG=en"; // HACK: since form.action returns the value of '&action='

  var formAction = form.elements['-$action'].value;
  var allFields = true;
  if (formAction != "searchLocal" && formAction != "searchParallel")
    allFields = false;
  else if (currentFormName == "horizontalFilter")
    allFields = true;
    
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
  
  if (allFields == false)
    url += "&type=" + form.type.value + "&-$action=" + formAction;
  if (form.uri) 
    url += "&uri=" + encodeURIComponent(form.uri.value);

  form.onsubmit = null;

  if (document.all || document.getElementById) {
//    form.submit.disabled = true; // HACK: for some reason can not disable this button - the form would not get submitted
    var submit = form.elements['submit'];
    submit.value = 'Please wait';
    submit.style.cursor = 'wait'; 
    var cancel;
    cancel = form.elements['cancel'];
    if (!cancel)
      cancel = form.elements['clear'];  
    if (!cancel)
      cancel = form.elements['horizontal_clear'];
    if (cancel) 
      cancel.style.visibility = HIDDEN; 
  }

// submit as GET with all parameters collected manually
//  form.method   = 'GET';  
//  document.location.href = url;
// 	e.cancelBubble = true;
//  e.returnValue = false;
//  if (e.preventDefault) e.preventDefault();
//  return false; 
  form.method = 'POST';
  form.action = "FormRedirect";
  return true;
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
    
  var ret = popupRowOnClick1(tr);
/*
  if (ret == false) {
    e.cancelBubble = true;
    e.returnValue = false;
    if (e.preventDefault) e.preventDefault();         
  }
*/  
  return ret;
}
 
 function popupRowOnClick1(tr) {
  //alert("popupRowOnClick1: " + tr.id);           
  if (tr.previousSibling == null) // skip clicks on menu header (it is a first tr - has no prev sibling)
    return;

  if (tr.id == '$noValue')
    return;

  // if there is a link on this row - follow it
  var anchors = tr.getElementsByTagName('a');
  if (anchors  &&  anchors.length != 0) {
    if (currentDiv) {
      openedPopups[currentDiv.id] = null;
      menuClose2(currentDiv);
    }  
    if (anchors[0].click)
      anchors[0].click();
	  return true;
  }
  
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
  var len = chosenTextField.length;
  var verified = prop + "_verified";
  if (currentResourceUri)
    verified = currentResourceUri + ".$." + verified;
  var fieldLabel = document.getElementById(prop + "_span");  
  
  var iclass = prop + "_class";    
  var formFieldClass    = form.elements[iclass];
  var formFieldVerified = form.elements[verified];
  
  var deleteCurrentDiv = false;
  if (formFieldVerified) {
    if (formFieldVerified.value == 'n')
      deleteCurrentDiv = true;
    formFieldVerified.value = 'y'; // value was modified and is verified since it is not typed but is chosen from the list
  }
  if (originalProp.indexOf("_class") == -1) {
    var select = prop + "_select";
    if (currentResourceUri)
      select = currentResourceUri + ".$." + select;

    formField = form.elements[select];
    if (tr.id.indexOf('$clear') == 0) {
      if (len > 1) {
        if (currentFormName != "tablePropertyList") 
          chosenTextField[0].value   = tr.id.substring(6);
        else 
          chosenTextField[0].value   = '';
      }
      else {
        if (currentFormName != "tablePropertyList") 
          chosenTextField.value   = tr.id.substring(6);
        else 
          chosenTextField.value   = '';
      }
      formField.value         = '';
      if (formFieldClass)
        formFieldClass.value  = '';
      
      // hide property label that is displayed on top of the text field
      if (fieldLabel)
        fieldLabel.style.display    = "none";
      if (formFieldVerified) 
        formFieldVerified.value = 'n';
      if (currentDiv) openedPopups[currentDiv.id] = null;
      var imgId  = prop + "_class_img";
      var img = document.getElementById(imgId);
      if (img) {
        document.getElementById(imgId).src = "icons/blank.gif";
        document.getElementById(imgId).title = "";
      }
    }
    else  {
      var items = tr.getElementsByTagName('td');
      var val = items[1].innerHTML;
      var idx = val.lastIndexOf(">");
      if (len > 1)
        chosenTextField[0].value = val.substring(idx + 1);
      else
        chosenTextField.value = val.substring(idx + 1);
      if (chosenTextField.style)
        chosenTextField.style.backgroundColor = '#ffffff';
      formField.value = tr.id; // property value corresponding to a listitem
      // show property label since label inside input field is now overwritten
      if (form.id == 'rightPanelPropertySheet') { 
        if (fieldLabel) 
          fieldLabel.style.display = '';
      }  
    }
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
  if (deleteCurrentDiv == true)
    openedPopups[currentDiv.id] = null;
  menuClose2(div);
  clearOtherPopups(div);
  return false;
}

var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

function autoCompleteOnFocus(e) {
  if (internalFocus) {
    internalFocus = false;
    return;
  }
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
    menuClose(currentDiv.id);
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
    else if (e.keyCode == 9)                  // tab
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
  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e) 
    return;

  var target;

  target = getTargetElement(e);
  return autoComplete1(e, target);
}

function autoComplete1(e, target) {
  if (!target)
    return;
  
  keyPressedTime = new Date().getTime();
  if (currentDiv)
    menuClose2(currentDiv);
  
  var form = target.form;
  var characterCode = getKeyCode(e); // code typed by the user  
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
    case 8:   //backspace  
    case 46:  //delete
    case 127: //ctrl-enter
    case 13:  //enter  
      break;
    case 9:   //tab
      if (currentDiv)
        menuClose2(currentDiv);
      return true;
  }     
  var propName  = target.name;
  var formName  = target.id;
  var propName1 = propName;
  var idx = propName.indexOf(".");
  if (idx != -1)
    propName1 = propName1.substring(0, idx);

  var fieldVerified = form.elements[propName1 + '_verified'];
  var fieldSelect   = form.elements[propName1 + '_select'];
  var fieldClass    = form.elements[propName1 + '_class'];
  if (characterCode == 13) { // enter
    if (!fieldVerified) { // show popup on Enter only in data entry mode (indicated by the presence of _verified field)
      if (autoCompleteTimeoutId) clearTimeout(autoCompleteTimeoutId);
      return true;
    }
  }
  if (fieldClass)
    keyPressedImgId     = propName + "_class_" + formName + "_filter";
  else
    keyPressedImgId     = propName + "_" + formName + "_filter";
  keyPressedElement   = target;
  keyPressedElement.style.backgroundColor='#ffffff';
  
  if (characterCode == 13) { // open popup (or close it on second Enter)
    onClickPopup1(keyPressedImgId, keyPressedElement.form, keyPressedElement.value);
    return false;            // tell browser not to do submit on 'enter'
  }  

  if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not verified yet (i.e. not chose from the list)
  if (fieldSelect)   fieldSelect.value = ''; // value was modified and is not verified yet (i.e. not chose from the list)
  autoCompleteTimeoutId = setTimeout("autoCompleteTimeout(" + keyPressedTime + ")", 600);
  // make property label visible since overwritten inside the field
  var filterLabel = document.getElementById(propName1 + "_span");
  if (filterLabel)
    filterLabel.style.display = '';
  clearOtherPopups(currentDiv);
  if (characterCode == 8)
    return false;
  else
    return true; 
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
    case 9:   //tab
      if (currentDiv) {
        var form = getFormNode(currentPopupRow);
        var inputField = form.elements[originalProp];
        try { inputField.focus(); } catch(e) {};
        menuClose2(currentDiv);
      }  
      e.cancelBubble = true;
      e.returnValue = false;
      if (e.preventDefault) e.preventDefault();         
      return false;
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
    case 8:   //backspace
      if (currentDiv) {
        var form = getFormNode(currentPopupRow);
        var inputField = form.elements[originalProp];
        internalFocus = true;
        try { inputField.focus(); } catch(e) {};
        autoComplete1(e, inputField);
        if (characterCode == 8) {
          inputField.value = inputField.value.substring(0, inputField.value.length - 1);
        }
      }  
      e.cancelBubble = true;
      e.returnValue = false;
      if (e.preventDefault) e.preventDefault();         
      return false;
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
    
  if (tr.id == '$noValue')
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
  
  if (!tr) {
    return;
  }  
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

function textAreaOnFocus(e) {
  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  var target = getTargetElement(e);
  var rows = getFormFieldInitialValue(target, 'rows');
  if (rows)
    target.attributes['rows'].value = rows;
  else
    target.attributes['rows'].value = 1;
  var cols = getFormFieldInitialValue(target, 'cols');
  if (!cols) {
    target.setAttributes('cols', 10);
    cols = 10;
  }  
  var c = target.attributes['cols'];
  if (c) {
    c.value = cols;
    target.style.width = "96%";
  }  
}

function textAreaOnBlur(e) {
  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  var target = getTargetElement(e);
  if (!target.value || target.value == '') {
    target.attributes['rows'].value = 1;
    target.attributes['cols'].value = 10;
    target.style.width = null;
  }  
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
  if (!f.tagName)
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
      if (!value)
        continue;
      if (currentFormName != "horizontalFilter") {
        if (value == ''  ||  value == "All")
          continue;
        if (type.toUpperCase() == "CHECKBOX" ) {
          if (field.checked == false)
            continue;
	      }
	      if (value.indexOf(" --", value.length - 3) != -1)
	         continue;
      }
    }
          
    p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
}

function chooser(element) {
  var propName = element.name;
  var idx = propName.indexOf(".");
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  var form     = element.form.elements['$form'].value;
  var editList = element.form.elements['$wasEditList'];
  var value    = element.value;
  var id       = element.id;
  
  if (!id)
    id = value;
    
  if (editList) {
    var uri = element.form.elements['$rUri'].value;
    window.opener.document.forms[form].elements[uri + ".$." + propName].value                    = value;
    window.opener.document.forms[form].elements[uri + ".$." + shortPropName + "_select"].value   = id;
    window.opener.document.forms[form].elements[uri + ".$." + shortPropName + "_verified"].value = "y";
  }
  else {
    window.opener.document.forms[form].elements[propName].value                    = value;
    window.opener.document.forms[form].elements[shortPropName + "_select"].value   = id;
    window.opener.document.forms[form].elements[shortPropName + "_verified"].value = "y";
  }
}

function hideResetRow(div, currentFormName, originalProp) {
  if (originalProp.indexOf("_class") != -1)
    return;
  var trs = div.getElementsByTagName('tr');
  var i;
  var found = false;
  
  var form = document.forms[currentFormName];
  if (form.elements[originalProp + "_class"])
    return;
  for (i=0; i<trs.length; i++) {
    if (trs[i].id.indexOf('$clear') == 0) {
      found = true;
      break;
    }
  }  

  if (!found)
    return;


  var tr = trs[i];

  var elem = form.elements[originalProp];
  
  var value;
  if (elem.length > 1)
    value = elem[0].value;
  else 
    value = elem.value;
  var valueIsSet = true;
	  
  if (!value || value == '')  
    valueIsSet = false;
  else if (value.indexOf(" --", value.length - 3) != -1)
    valueIsSet = false;

  if (valueIsSet) {
    tr.style.display    = '';
  }  
  else {
    tr.style.display    = "none";
  }  
}

/*********************************** Menu ***********************************/
function initMenus() {
  return;
  var menuIcons = document.getElementsByTagName('img');
  var l = menuIcons.length;
  for (i=0; i<l; i++) {
    var m = menuIcons[i];
    if (m.id.indexOf('menuicon_') == 0) { 
      addEvent(m, 'click', menuOnClick, false);
    }  
  }
  
  var menuDivs = document.getElementsByTagName('div');
  var l = menuDivs.length;
  var uniqueDivs = new Array();
  for (i=0; i<l; i++) {
    var div = menuDivs[i];
    if (div.id.indexOf('menudiv_') == 0) {
      if (uniqueDivs[div.id])
        continue;
      uniqueDivs[div.id] = div;
      var tables = div.getElementsByTagName('table');
      if (tables && tables[1]) {
        var imgId = 'menuicon_' + div.id.substring('menudiv_'.length);
        var img = document.getElementById(imgId);
        interceptPopupEvents(img, div, tables[1]);
      }  
    }  
  }
}

/**
 *  Opens the menu when needed, e.g. on click, on enter
 */
function menuOnClick(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
      
  if (!e) 
    return;

  target = getTargetElement(e);
  if (!target)
    return;
  
  var imgId = target.id;
  var d = currentDiv;
  if (currentDiv) {    
    menuClose2(currentDiv);
  }
  if (imgId == currentImgId && d != null)
    return;
  currentImgId  = imgId;
    
  var divId = 'menudiv_' + imgId.substring('menuicon_'.length);
  currentDiv = document.getElementById(divId);
  
  menuResetRow(currentDiv);
  menuOpenClose(divId, imgId);
  
  // make popup active for key input 
  if (currentDiv.focus) { // simple in IE
    try { currentDiv.focus(); } catch(e) {};
  }  
  else {                // hack for Netscape (using an empty anchor element to focus on)
    var elm = document.getElementById(currentDiv.id + "_$focus_link"); 
    if (elm) {
      if (elm.focus) {
        try { elm.focus(); } catch(e) {};
      }
    }  
  }  
}

function menuResetRow(div) {
  var trs = div.getElementsByTagName('tr');
  var i;
  var found = false;
  
  for (i=0; i<trs.length; i++) {
    trs[i].style.display = ''; // clear highlighted background in all rows
  }  
}

/*********************************** Tooltips ************************************/
function replaceTooltips0(elements) {
  var llen;
  llen = elements.length;
  for (i=0;i<llen; i++) {
    var elem = elements[i];
    if (elem.attributes['title']) {
      addEvent(elem, 'mouseout',    tooltipMouseOut,    false);
      addEvent(elem, 'mouseover',   tooltipMouseOver,   false);
    }
  } 
}

function replaceAllTooltips() {
  var llen;
  var elements;
  elements = document.getElementsByTagName('img');
  replaceTooltips0(elements);
  elements = document.getElementsByTagName('span');
  replaceTooltips0(elements);
  //elements = document.getElementsByTagName('a');
  //replaceTooltips0(elements);
  elements = document.getElementsByTagName('input');
  replaceTooltips0(elements);
  elements = document.getElementsByTagName('tt');
  replaceTooltips0(elements);
}

function replaceTooltips(divRef) {
  var elements;
  elements = divRef.getElementsByTagName('img');
  replaceTooltips0(elements);
}

function tooltipMouseOver0(target) {
  var tooltip = target.getAttribute('tooltip'); // using getAttrbute() - as workaround for IE5.5 custom attibutes bug
  var tooltipText;
  if (!tooltip) {
    tooltip = target.getAttribute('title');
    if (tooltip) {
      tooltipText = tooltip;
      if (tooltipText == '')
        return true;
      window.status = tooltipText;
      // merge tooltip on IMG with tooltip on its parent A tag 
      var parentA = target.parentNode;
      if (parentA && parentA.tagName.toUpperCase() == 'A') {
        var linkTooltip = parentA.getAttribute('title');
        if (linkTooltip) {
          var linkTooltipText = linkTooltip;
          if (linkTooltipText && linkTooltipText != '') {
            tooltipText += '<br><i><small>' + linkTooltipText + '</small></i>';
          }  
          parentA.title = '';
        }
       
      }
      target.setAttribute('tooltip', tooltipText);
      target.title = '';
    }
  }
  else
    tooltipText = tooltip;
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
  return false;
}

function tooltipMouseOver(e) {
  var p;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e)
    return;

  target = getTargetElement(e);
  if (!tooltipMouseOver0(target)) {
    e.cancelBubble = true;
    e.returnValue = false;
    if (e.preventDefault) e.preventDefault();
    return false;
  }  
  else
    return true;
}  

function tooltipMouseOut0(target) {    
  var tooltipDiv = document.getElementById('system_tooltip');
  var ifrRef = document.getElementById('tooltipIframe');
 
  setDivInvisible(tooltipDiv, ifrRef);
  return false;
}

function tooltipMouseOut(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e)
    return;
  target = getTargetElement(e);
  return tooltipMouseOut0(target);
}

