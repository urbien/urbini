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
	if (imgName) {
            poptext.left = docjslib_getImageXfromLeft(imgName);
            poptext.top = docjslib_getImageYfromTop(imgName) + docjslib_getImageHeight(imgName) + 2;
	}
	if (poptext.display == "none" || poptext.display == "") {
		//poptext.display = "inline";
		DivSetVisible(true, divName);
	} else {
		//poptext.display = "none";
		DivSetVisible(false, divName);
	}
	if (document.getElementById("menudiv_Email") != null &&
            document.getElementById("menudiv_Email").style.display == "inline"
        ) {
	  document.getElementById("emailForm").subject.value = document.title;
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
		document.forms["emailForm"].elements["subject"].value = document.title;
	}
	if (document.getElementById("menudiv_Schedule") != null &&
            document.getElementById("menudiv_Schedule").style.display == "inline"
           ) {
		document.forms["scheduleForm"].elements["name"].value = document.title;
	}
}

function menuClose1(div) {
	
	poptext = document.getElementById(div).style;
	if (poptext.display == "inline") {
		poptextLeft = docjslib_getImageXfromLeft(div);
		poptextTop = docjslib_getImageYfromTop(div);
		poptextWidth = docjslib_getImageWidth(div);
		poptextHeight = docjslib_getImageHeight(div);
		if (xMousePos < poptextLeft || xMousePos > poptextLeft + poptextWidth ||
                yMousePos < poptextTop || yMousePos > poptextTop + poptextHeight) {
			//poptext.display = "none";
			DivSetVisible(false, div);
		} else {
			timeoutId = setTimeout("menuClose1('" + div + "')", 100);
		}
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

function DivSetVisible(state, divn)
  {
   var DivRef = document.getElementById(divn);
   var IfrRef = document.getElementById('DivShim');
   if(state)
   {
    DivRef.style.display = "inline";
    istyle=IfrRef.style;
    istyle.width = DivRef.offsetWidth;
    istyle.height = DivRef.offsetHeight;
    istyle.top = DivRef.style.top;
    istyle.left = DivRef.style.left;
    //istyle.zIndex = DivRef.style.zIndex-1;
    istyle.display = "inline";
   }
   else
   {
    DivRef.style.display = "none";
    IfrRef.style.display = "none";
   }
  }

function smartPopup(propName, url) {
alert("SMARTPOPUP in session: " + propName);
  var smartPopupFrame = frames[propName];
  smartPopupFrame.location.href = url;
  menuOpenClose(propName, propName + "_filter");
}
