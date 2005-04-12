/**
 * Popup system.
 * Supports menu, dynamicaly generated listboxes, tooltips.
 * Supports row selection (one or many) in menu, listbox.
 * Support stacking up one popup on top of another (e.g.
 */

/**
 * Utility that discovers the html element which generated the event
 */
function getTargetElement(evt) {
  var elem;
  var elem1 = evt.target;
  if (evt.target) {
    if (evt.currentTarget && (evt.currentTarget != elem1)) {
      if (elem1.tagName.toLowerCase() == 'input' && elem1.type.toLowerCase() == 'checkbox')
        elem = elem1;
      else
        elem = evt.currentTarget;
    }
    else
      elem = elem1;
  }
  else {
    elem = evt.srcElement;
  }
  return elem;
}

Popup.currentDivs          = new Array(); // distinct divs that can be open at the same time (since they have different canvases)
Popup.popups               = new Array(); // pool of all popups with different divId(s)
Popup.openTimeoutId        = null; // timeout after which we need to open the delayed popup
Popup.lastClickTime        = null; // last time user clicked on anything
Popup.lastOpenTime         = null; // moment when last popup was opened
Popup.delayedPopupOpenTime = null; // moment when delayed popup was requested
Popup.tooltipPopup         = null;
Popup.DarkMenuItem  = '#dee6e6';
Popup.LightMenuItem = '';

Popup.HIDDEN  =  'hidden';
Popup.VISIBLE =  'visible';
if (document.layers) {
  Popup.HIDDEN  = 'hide';
  Popup.VISIBLE = 'show';
}

/**
 * returns iframe that serves as a canvas for this popup (overlaying the underlying form fields)
 */
Popup.getCanvas = function (frameRef) {
  var defaultCanvas = 'popupIframe';
  var iframe;
  if (frameRef)
    iframe         = frameRef;
  else {
    iframe         = document.getElementById(defaultCanvas);
    if (!iframe)
      throw new Error("document structure invalid: iframe '" + defaultCanvas + "' is missing");
  }
  return iframe;
}

Popup.allowTooltip = function (target) {
  var noOpenPopups = true;
  for (var i in Popup.popups) {
    var popup = Popup.popups[i];
    if (popup.isOpen() &&         // if popup is already open then we need only tooltips in it (and not the tooltips on areas outside popup)
        !popup.isTooltip()) {     //    but if open popup is a tooltip - ignore it
      noOpenPopups = false;
      if (popup.contains(target))
        return true;
      else
        continue;
    }
  }
  if (noOpenPopups) // if no open popups - allow tooltip
    return true;
  else
    return false;
}

/**
 * Static function.
 * returns a Popup by divId if exists, otherwise - null
 */
Popup.getPopup = function (divId) {
  var popup = Popup.popups[divId];
  if (popup)
    return popup;
  else
    return null;
}

/**
 * Open popup after delay
 */
Popup.openAfterDelay = function (divId, offsetX, offsetY) {
  if ( (Popup.lastOpenTime   && (Popup.lastOpenTime  > Popup.delayedPopupOpenTime)) ||
       (Popup.lastClickTime  && (Popup.lastClickTime > Popup.delayedPopupOpenTime)) ||
       (keyPressedTime       && (keyPressedTime      > Popup.delayedPopupOpenTime))
      ) {
    return; // do not open delayed popup if other popup was already opened during the timeout
  }
  var popup = Popup.getPopup(divId);
  if (popup) {
    popup.open1(offsetX, offsetY);
  }
}

/**
 * Static function.
 * Opens a menu with a specified DIV and places it on the screen relative to hotspot (IMG, link, etc).
 * Note: uses frameRef to draw this DIV on top of the iframe in order to block underlying form fields (which otherwise would show through).
 */
Popup.open = function (divId, hotspotRef, frameRef, offsetX, offsetY, delay, contents) {
  var divRef = document.getElementById(divId);
  var popup = Popup.getPopup(divId);
  if (popup == null)
    popup = new Popup(divRef, hotspotRef, frameRef, contents);
  else
    popup.reset(hotspotRef, frameRef, contents);

  if (delay) {
    popup.openDelayed(offsetX, offsetY, delay);
    return;
  }
  return popup.open1(offsetX, offsetY);
}

Popup.delayedClose0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.delayedClose();
}

Popup.close0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.close();
}

/**
 *  Loads the popup into the div from the iframe
 */
Popup.load = function (divId) {
  if (!popupFrameLoaded) {
//    if (timeoutCount++ < 20)
//      setTimeout(loadPopup, 100);
//    else
//      alert("Warning: server did not return listbox data - check connection to server");
    setTimeout("Popup.load('" + divId + "')", 100);
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

  var popup = Popup.getPopup(divId);
  popup.setInnerHtml(body.innerHTML)
  window.onDivLoad = popupFrame.onDivLoad;  
  window.onDivLoad();
  //body.onDivLoad();
  var div = popup.div;

  var tables = div.getElementsByTagName('table');
  if (popup.firstRow() == null) {
    alert("Warning: server did not return listbox data - check connection to server");
    return;
  }
  replaceTooltips(div);

  var addToTableName = "";
  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }

  hideResetRow(div, currentFormName, originalProp);
  popup.open1(0, 16);
  loadedPopups[div.id] = div;
}

/**
 * Close popup if mouse cursor is out
 */
Popup.closeIfOut0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.closeIfOut();
}

function Popup(divRef, hotspotRef, frameRef, contents) {
  if (typeof difRef == 'string')
    throw new Error("div parameter must be an object, not a string");
  if (typeof hotspotRef == 'string')
    throw new Error("hostspot parameter must be an object, not a string");

  this.div            = divRef;     // div for this popup
  this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup (to cover input elements on the page below popup)
  this.hotspot        = hotspotRef; // hotspot that triggered this popup
  this.contents       = contents;
  this.resourceUri    = null;       // popup was activated for one of the properties of the Resource in resource list (RL). resourceUri is this resource's URI.

  //this.originalProp   = null;       // Resource property for which popup was activated
  //this.propName       = null;       //   same, but encoded - has extra info such as HTML form name, interface name, etc.
  //this.formName       = null;       // name of the HTML form which element generated last event in the popup
  this.closeTimeoutId = null;       // timeout after which we need to close this popup
  this.offsetX        = null;       // position at which we have opened last time
  this.offsetY        = null;       // ...
  this.popupClosed    = true;
  this.items          = new Array(); // items of this popup (i.e. menu rows)
  this.currentRow     = null;       // currently selected row in this popup

  var self = this;

  // add to the list of popups
  Popup.popups[divRef.id] = this;

  this.reset = function (hotspotRef, frameRef, contents) {
    this.hotspot        = hotspotRef;
    this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup (to cover input elements on the page below popup)
    this.contents       = contents;
  }

  /**
   * Get current div. One div per canvas since a canvas may hold only one div.
   */
  this.getCurrentDiv = function (iframe) {
    var iframeId;
    if (iframe)
      iframeId = iframe.id;
    else
      iframeId = self.iframe.id;

    return Popup.currentDivs[iframeId];
  }

  this.setCurrentDiv = function () {
    Popup.currentDivs[self.iframe.id] = self.div;
  }

  this.unsetCurrentDiv = function () {
    Popup.currentDivs[self.iframe.id] = null;
  }

  this.contains = function (target) {
    var nodes = self.div.childNodes;
    for (var i in nodes) {
      if (nodes[i] == target)
        return true;
    }
  }

  this.isTooltip = function () {
    return contents != null;
  }

  this.open1 = function (offsetX, offsetY) {
    var hotspotDim = getElementCoords(self.hotspot);
    if (Popup.tooltipPopup) {
      Popup.tooltipPopup.close();
      Popup.tooltipPopup = null;
    }

    var currentDiv = self.getCurrentDiv();
    if (currentDiv) {
      var curDivId = currentDiv.id;
      var currentPopup = Popup.getPopup(curDivId);

      if (currentPopup) {
        var offsetX1 = currentPopup.offsetX;
        var offsetY1 = currentPopup.offsetY;
        currentPopup.close();
//      opening the same popup at the same place? - just quit
        if (self.div.id == curDivId &&
            self.hotspotDim.equals(hotspotDim) &&
            (offsetX1 == offsetX && offsetY1 == offsetY)) {
          return;
        }
      }
    }
    self.hotspotDim = hotspotDim;
    self.offsetX = offsetX; // save position at which we have opened last time
    self.offsetY = offsetY;
    Popup.lastOpenTime = new Date().getTime();  // mark when we opened this popup
    if (Popup.openTimeoutId) {                  // clear any delayed popup open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
    if (self.contents)
      self.setInnerHtml(self.contents)
    self.setVisible(offsetX, offsetY);
    self.popupClosed = false;
    self.deselectRow();

    self.setCurrentDiv();
    self.interceptEvents();

    // make popup active for key input
    if (self.div.focus) {// simple in IE
      try { self.div.focus(); } catch(e) {};
    }
    else {                // hack for Netscape (using an empty anchor element to focus on)
      var as = self.div.getElementsByTagName('a');

      if (as && as[0]) {
        if (as[0].focus) {
          try { as[0].focus(); } catch(e) {};
        }
      }
    }
    if (contents) {
      Popup.tooltipPopup = self;
      self.delayedClose(20000);
    }
    else
      Popup.tooltipPopup = null;
    return self;
  }

  this.isOpen = function() {
    return !(self.popupClosed);
  }

  this.moveTo = function (x, y) {
    if (Popup.ns4)
      self.div.moveTo(x, y);
    else {
      self.div.style.left = x + 'px';
      self.div.style.top  = y + 'px';
    }
  }

  this.setInnerHtml = function (text) {
    if (Popup.ns4) {
      self.div.document.open();
      self.div.document.write(text);
      self.div.document.close();
    }
    else {
      //  hack to remove current div dimensions, otherwise div will not auto-adjust to the text inserted into it (hack needed at least in firefox 1.0)
      self.div.style.width  = null;
      self.div.style.height = null;
      // insert text
      self.div.innerHTML = text;
    }
  }

  /**
   * Open delayed popup: initialize a delayed popup and quit
   */
  this.openDelayed = function (offsetX, offsetY, delay) {
    Popup.lastOpenTime = new Date().getTime();
    Popup.delayedPopupOpenTime = new Date().getTime();

    if (Popup.openTimeoutId) {                  // clear any prior delayed popup open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }

    Popup.openTimeoutId = setTimeout(
        "Popup.openAfterDelay('" +
        self.div.id  + "', " +
        offsetX      + ", " +
        offsetY      + ")"
        , delay);
  }

  /**
   * Show popup
   */
  this.setVisible = function (offsetX, offsetY) {
    var div      = self.div;
    var iframe   = self.iframe;
    var hotspot  = self.hotspot;

    var istyle   = iframe.style;
    istyle.visibility   = Popup.HIDDEN;
    div.style.visibility = Popup.HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'

    if (!hotspot) {
      var t = "t";
    }
    else {
      var scrollXY = getScrollXY();
      var scrollX = scrollXY[0];
      var scrollY = scrollXY[1];

      var coords = getElementCoords(hotspot);
      var left = coords.left;
      var top  = coords.top;

      var screenXY = getWindowSize();
      var screenX = screenXY[0];
      var screenY = screenXY[1];

      // Find out how close to the corner of the window
      var distanceToRightEdge  = screenX + scrollX - left;
      var distanceToBottomEdge = screenY + scrollY - top;

      // first position the div box in the top left corner in order to measure its dimensions
      // (otherwise, if position coirrectly and only then measure dimensions - the width/height will get cut off at the scroll boundary - at least in firefox 1.0)
      div.style.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
      self.moveTo(0, 0);
      var divCoords = getElementCoords(div);
      div.style.display    = 'none';   // must hide it again to avoid screen flicker

      // move box to the left of the hostspot if the distance to window border isn't enough to accomodate the whole div box
      var margin = 25;
      if (distanceToRightEdge < divCoords.width + margin) {
        left = screenX - divCoords.width + scrollX; // move horizontal position of the menu to the left by its width
        if (left - margin > 0) left -= margin; // adjust for a scrollbar;
      }
      else { // apply user requested offset only if no adjustment
        if (offsetX)
          left = left + offsetX;
      }

      // adjust position of the div box vertically - using the same approach as above
      if (distanceToBottomEdge < divCoords.height + margin) {
        top = (scrollY + screenY) - divCoords.height;
        if (top - margin > 0) top -= margin; // adjust for a scrollbar;
      }
      else { // apply user requested offset only if no adjustment
        if (offsetY)
          top = top + offsetY;
      }

      self.moveTo(left, top); // move the div box to the adjusted position
    }

    // by now the width of the box got cut off at scroll boundary - fix it (needed at least for firefox 1.0)
    div.style.width  = divCoords.width  + 'px';
    div.style.height = divCoords.height + 'px';

    //  Make position/size of the underlying iframe same as div's position/size
    istyle.top     = div.style.top;
    istyle.left    = div.style.left;
    istyle.width   = div.style.width;
    istyle.height  = div.style.height;

    // hack for Opera (at least at ver. 7.54) - somehow iframe is always on top of div - no matter how hard we try to set zIndex
    // so we have to live without iframe in Opera
    var opera = navigator.userAgent.indexOf("Opera") != -1;
    if (!opera)
      istyle.visibility  = Popup.VISIBLE;
    istyle.display       = 'inline';
    div.style.display    = 'inline';
    div.style.visibility = Popup.VISIBLE; // finally make div visible
  }

  /**
   * Hide popup
   */
  this.setInvisible = function () {
    var div      = self.div;
    var iframe   = self.iframe;

    if (div.style)
      div.style.display    = "none";
    if (iframe && iframe.style)
      iframe.style.display = "none";
  }

  /**
   *  close popup uncoditionally and immediately with no regard to mouse position
   */
  this.close = function () {
    //if (self.popupClosed)
    //  return;
    self.popupClosed = true;
    var div      = self.div;
    var divStyle = div.style;
    if (divStyle.display == "inline") {
      this.setInvisible();
      self.closeTimeoutId = null;
    }
    self.unsetCurrentDiv();
  }

  /**
   * [Delayed] Close popup
   */
  this.delayedClose = function (timeout) {
    var div   = self.div;
    var divId = div.id;

    if (!timeout)
      timeout = 600;
    self.closeTimeoutId = setTimeout("Popup.close0('" + divId + "')", timeout);
  }

  /**
   * Intercept events generated within the popup
   */
  this.interceptEvents = function () {
    var div     = self.div;
    var hotspot = self.hotspot;
    //var isMenu  = div.id.indexOf('menudiv_') == 0 ? true false;

    addEvent(div,     'mouseover', self.popupOnMouseOver, false);
    addEvent(div,     'mouseout',  self.popupOnMouseOut,  false);
    addEvent(hotspot, 'mouseout',  self.popupOnMouseOut,  false);

    var firstRow = self.firstRow();
    if (firstRow == null)
      return; // incorrect popup structure

    var tables = div.getElementsByTagName('table');
    if (!tables || !tables[1]) {
      return;
    }
    var table = tables[1];
    if (!table)
      return;

    //popup contains rows that can be selected
    if (document.all) // IE - works only on keydown
      addEvent(div,  'keydown',   self.popupRowOnKeyPress,  false);
    else              // Mozilla - only keypress allows to call e.preventDefault() to suppress browser's scrolling in popup
      addEvent(div,  'keypress',  self.popupRowOnKeyPress,  false);

    var elem = firstRow;
    var n = self.rowCount();
    for (var i=0; i<n; i++) {
      var popupItem = new PopupItem(elem, i);
      self.items[popupItem.id];
      addEvent(elem, 'click',     self.popupRowOnClick,     false);
      addEvent(elem, 'mouseover', self.popupRowOnMouseOver, false);
      addEvent(elem, 'mouseout',  self.popupRowOnMouseOut,  false);
      elem = self.nextRow();
    }
  }

  /**
   * Popup's on mouseover handler
   */
  this.popupOnMouseOver = function (e) {
    var target;

    e = (e) ? e : ((window.event) ? window.event : null);

    if (!e)
      return;

    target = getTargetElement(e);
    if (!target)
      return;

    // detect re-enter into the popup - thus clear a timeout
    if (self.closeTimeoutId != null) {
       clearTimeout(self.closeTimeoutId);
       self.closeTimeoutId = null;
    }
    return true;
  }

  /**
   * Popup's and hotspot's on mouseout handler
   */
  this.popupOnMouseOut = function (e) {
    var target;

    e = (e) ? e : ((window.event) ? window.event : null);

    if (!e)
      return;

    target = getTargetElement(e);
    if (!target)
      return;
//window.status("mouseout: " + target.id);
    self.delayedClose(600);
    return true;
  }

  //***************************************** row functions ****************************
  /**
   * This handler allows to use arrow keys to move through the menu and Enter to choose the menu element.
   */
  this.popupRowOnKeyPress = function(e) {
    e = (e) ? e : ((window.event) ? window.event : null);
    if (!e)
      return;

    var currentDiv = self.getCurrentDiv();
    var characterCode = getKeyCode(e); // code typed by the user
    var target;
    var tr = self.currentRow;
    if (!tr)
      return;

    switch (characterCode) {
      case 38:  //up arrow
      case 40:  //down arrow
        break;
      case 9:   //tab
        if (currentDiv) {
          var form = document.forms[currentFormName];
          if (form) {
            var inputField = form.elements[originalProp];
            try { inputField.focus(); } catch(e) {};
          }
          Popup.close0(currentDiv.id);
        }
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.preventDefault)  e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
      case 27:  //esc
        if (currentDiv)
          Popup.close0(currentDiv.id);
        return false;
      case 13:  //enter
        self.popupRowOnClick1(tr);
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
      default:
      case 8:   //backspace
        if (currentDiv) {
          //var form = getFormNode(self.currentRow);
          var form = document.forms[currentFormName];
          if (form) {
            var inputField = form.elements[originalProp];
            internalFocus = true;
            try { inputField.focus(); } catch(e) {};
            autoComplete1(e, inputField);
            if (characterCode == 8) {
              inputField.value = inputField.value.substring(0, inputField.value.length - 1);
            }
          }
        }
        e.cancelBubble = true;
        e.returnValue = false;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return false;
    }

    if (characterCode == 40) {       // down arrow
      self.deselectRow();
      self.nextRow();
      self.selectRow();
    }
    else if (characterCode == 38) {  // up arrow
      self.deselectRow();
      self.prevRow();
      self.selectRow();
    }

    e.cancelBubble = true;
    e.returnValue = false;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    return false;
  }

  /**
   *  Reacts to clicks inside the popup
   */
  this.popupRowOnClick = function (e) {
    var tr;
    var target;

    e = (e) ? e : ((window.event) ? window.event : null);

    if (!e)
      return;

    target = getTargetElement(e);
    tr = getTrNode(target);
    if (!tr)
      return;

    var ret = self.popupRowOnClick1(tr, target);
    return ret;
  }

  this.popupRowOnClick1 = function (tr, target) {
    Popup.lastClickTime = new Date().getTime();
    var currentDiv = self.getCurrentDiv();
    if (self.isHeaderRow(tr)) // skip clicks on menu header
      return;

    if (tr.id == '$noValue')
      return;

    // if there is a link on this row - follow it
    var anchors = tr.getElementsByTagName('a');
    if (anchors  &&  anchors.length != 0) {
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id);
      }
      //if (anchors[0].click)
      //  anchors[0].click();
      location.href = anchors[0].href;
      return true;
    }

    //var form = getFormNode(tr);
    var form = document.forms[currentFormName];
    if (form == null) {
      alert("not found html form for TR: " + tr.id);
    }
    var table  = tr.parentNode;
    var table1 = table.parentNode;

    var propertyShortName = table1.id.substring("table_".length);
    var idx = propertyShortName.lastIndexOf('_');
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

    var isInput = (target && target.tagName.toLowerCase() == 'input');
    var deleteCurrentDiv = false;
    if (formFieldVerified) {
      if (formFieldVerified.value == 'n')
        deleteCurrentDiv = true;
      formFieldVerified.value = 'y'; // value was modified and is verified since it is not typed but is chosen from the list
    }

    // row clicked corresponds to a property with range 'interface', meaning that
    // we need to open a list of classes that implement this interface
    if (originalProp.indexOf('_class') != -1) {
      var img = tr.getElementsByTagName('img')[0];
      var imgId  = prop + "_class_img";
      if (img) {
        document.getElementById(imgId).src   = img.src;
        document.getElementById(imgId).title = img.title;
      }
      formFieldClass.value = tr.id; // property value corresponding to a listitem
      loadedPopups[currentDiv.id] = null;
      Popup.close0(currentDiv.id)
      listboxOnClick1(currentImgId);
      return true;
    }

    var select = prop + "_select";
    if (currentResourceUri)
      select = currentResourceUri + ".$." + select;

    formField = form.elements[select];
    var selectItems = form.elements[select];
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
      if (chosenTextField.style)
        chosenTextField.style.backgroundColor = '';

      formField.value         = '';
      if (formFieldClass)
        formFieldClass.value  = '';

      // hide property label that is displayed on top of the text field
      if (fieldLabel)
        fieldLabel.style.display    = "none";
      if (formFieldVerified)
        formFieldVerified.value = 'n';
      if (selectItems) {
        for (i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "checkbox")
            selectItems[i].checked = false;
          else
            selectItems[i].value = null;
        }
      }
      if (currentDiv) loadedPopups[currentDiv.id] = null;
      var imgId  = prop + "_class_img";
      var img = document.getElementById(imgId);
      if (img) {
        document.getElementById(imgId).src = "icons/blank.gif";
        document.getElementById(imgId).title = "";
      }
    }
    else  {
      var items = tr.getElementsByTagName('td');
      var val = items[2].innerHTML;
      var idx = val.lastIndexOf(">");
      if (len > 1)
        chosenTextField[0].value = val.substring(idx + 1);
      else
        chosenTextField.value = val.substring(idx + 1);
      if (chosenTextField.style)
        chosenTextField.style.backgroundColor = '#ffffff';
      // show property label since label inside input field is now overwritten
      if (currentFormName == 'rightPanelPropertySheet') {
        if (fieldLabel)
          fieldLabel.style.display = '';
      }
      var nmbChecked = 0;
      var selectedItem;
      var selectedIdx = 0;

      if (!selectItems.length && selectItems.type.toLowerCase() == "hidden")
        formField.value = tr.id; // property value corresponding to a listitem
      else {
        formField.value = '';
        for (i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "hidden") {
            selectItems[i].value = null;
            continue;
          }
          if (selectItems[i].value == tr.id) {
            if (!isInput)
              selectItems[i].checked = true;
          }
          if (selectItems[i].checked == true) {
            selectedItem = selectItems[i];
            selectedIdx = i;
            nmbChecked++;
          }
        }
        if (nmbChecked == 0) {
          if (fieldLabel) {
            fieldLabel.style.display    = "none";
            var textContent = fieldLabel.textContent;
            var idx = textContent.indexOf("\r");
            if (idx != -1)
              textContent = textContent.substring(0, idx);
            chosenTextField.value = textContent + " --";
          }
          else
            chosenTextField.value = "";
        }
        else if (nmbChecked == 1) {
          var trNode = getTrNode(selectedItem);
          var items = trNode.getElementsByTagName('td');
          var val = items[2].innerHTML;
          var idx = val.lastIndexOf(">");

          if (len > 1)
            chosenTextField[0].value = val.substring(idx + 1);
          else
            chosenTextField.value = val.substring(idx + 1);
        }
        else
          chosenTextField.value = '<...>';
      }
    }
    // close popup (unless checkbox was clicked, then do not close to let user set other checboxes if needed)
    if (!isInput) {
      var divId = prop + "_" + currentFormName;
      if (currentResourceUri != null)
        divId = currentResourceUri + ".$." + divId;
      var div = document.getElementById(divId);
      if (deleteCurrentDiv == true)
        loadedPopups[currentDiv.id] = null;
      Popup.close0(div.id);
      clearOtherPopups(div);
    }
    return false;
  }

  this.popupRowOnMouseOver = function (e) {
    var tr;
    var target;
    e = (e) ? e : ((window.event) ? window.event : null);

    if (!e)
      return;

    target = getTargetElement(e);
    tr = getTrNode(target);

    if (!tr)
      return;

    if (self.isHeaderRow(tr))
      return;

    self.deselectRow();

    // darken new current row
    self.currentRow = tr;
    self.selectRow();
    return true;
  }

  this.popupRowOnMouseOut = function (e) {
    var tr;
    var target;

    e = (e) ? e : ((window.event) ? window.event : null);

    if (!e)
      return;

    target = getTargetElement(e);
    tr = getTrNode(target);
    if (!tr)
      return;

    self.deselectRow();
    self.currentRow = null;
    /*
    var tds = tr.getElementsByTagName('td');
    for (i=0; i<tds.length; i++) {
      var elem = tds[i];
      elem.style.backgroundColor='';
    }
    */
    return true;
  }

  this.deselectRow = function () {
    if (self.currentRow == null)
      return;

    if (self.currentRow.tagName && self.currentRow.tagName.toLowerCase() == 'tr') {
      var tds = self.currentRow.getElementsByTagName('td');
      for (i=0; i<tds.length; i++) {
        var elem = tds[i];
        elem.style.backgroundColor = Popup.LightMenuItem;
      }
    }
  }

  this.selectRow = function () {
    if (self.currentRow == null)
      return;

    if (self.currentRow.id == '$noValue')
      return;

    if (self.currentRow.tagName && self.currentRow.tagName.toLowerCase() == 'tr') {
      var tds = self.currentRow.getElementsByTagName("td");
      for (i=0; i<tds.length; i++) {
        var elem = tds[i];
        //alert(elem.id);
        elem.style.backgroundColor = Popup.DarkMenuItem;
      }
    }
  }

  this.nextRow = function () {
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      //self.selectRow();
      return self.currentRow;
    }

    var next = self.currentRow.nextSibling;

    if (next == null) {
      //self.deselectRow();
      self.currentRow = self.firstRow();
      //self.selectRow();
      return self.currentRow;
    }

    if (next.tagName && next.tagName.toUpperCase() == 'TR' && next.id != 'divider') {
      //self.deselectRow();
      self.currentRow = next;
      //self.selectRow();
      return next;
    }
    else {
      self.currentRow = next;
      return self.nextRow();
    }
  }

  this.prevRow = function () {
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      return self.prevRow();
    }

    var prev = self.currentRow.previousSibling;

    if (prev == null || self.isHeaderRow(prev)) {
      //self.deselectRow();
      self.currentRow = self.lastRow();
      //self.selectRow();
      return self.currentRow;
    }

    if (prev.tagName && prev.tagName.toUpperCase() == 'TR' && prev.id != 'divider') {
      //self.deselectRow();
      self.currentRow = prev;
      //self.selectRow();
      return prev;
    }
    else {
      self.currentRow = prev;
      return self.prevRow();
    }
  }

  this.isHeaderRow = function (tr) {
    //if (tr && tr.id == '$classLabel')
    if (tr && (tr.previousSibling == null || tr.id == '$classLabel'))
      return true;
    else
      return false;
  }

  /**
   * return first row in popup
   */
  this.firstRow = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1])
      return null;

    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;

    for (i=0; i<trs.length; i++) {
      if (!self.isHeaderRow(trs[i]))
        break;
    }
    return trs[i];
  }

  /**
   * return last row in popup
   */
  this.lastRow = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1])
      return null;

    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;

    return trs[trs.length - 1];
  }

  /**
   * return number of rows in popup
   */
  this.rowCount = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1])
      return null;

    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;
    return trs.length;
  }

  /**
   * Returns popup item by its name. Usually popup item corresponds to a row in popup.
   */
  this.getPopupItem = function(itemName) {
    return self.items[itemName];
  }

}

/**
 * Individual element in popup, usually represented by one row.
 */
function PopupItem(element, seq) {
  this.id        = element.id; // item id
  this.seq       = seq;        // sequence number of this item from the top of popup

  this.checked   = false;      // item may be checked (true) or not (false)
  this.selected  = false;      // item may be currently selected (highlighted) or not
  this.onChosen  = null;       // event handler that receives control when user clicked on this popup element or pressed Enter
  this.onOver    = null;       // event handler that receives control when this popup element is selected (highlighted)
  this.onOut     = null;       // event handler that receives control when this popup element is unselected (becomes passive)
  this.onCheck   = null;       // event handler that receives control when item is checked
  this.onUncheck = null;       // event handler that receives control when item is unchecked
}

var originalProp = null;
var propName = null;
var loadedPopups = new Array();
var div2frame = new Array();
var currentDiv = null;
var closeTimeoutId;
var currentImgId = null;
var currentFormName = null;
var currentResourceUri = null;

var internalFocus = false;
var popupFrameLoaded = false;

var rteUpdated = 'false';

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

/**
 *  Opens the popup when icon is clicked
 */
function listboxOnClick(e) {
  target = getTargetElement(e);
  if (!target)
    return;
  if (target.tagName != "IMG")
    return;
  var imgId = target.id;
  listboxOnClick1(imgId);
}

/**
 *  Opens the popup when needed, e.g. on click, on enter
 */
function listboxOnClick1(imgId, enteredText, enterFlag) {
  if (Popup.openTimeoutId) {                  // clear any prior delayed popup open
    clearTimeout(Popup.openTimeoutId);
    Popup.openTimeoutId = null;
  }

  var propName1 = imgId.substring(0, imgId.length - "_filter".length);   // cut off "_filter"
  var idx = propName1.lastIndexOf('_');
  if (idx == -1)
    return;
  currentFormName = propName1.substring(idx + 1);
  var form = document.forms[currentFormName];
  propName1 = propName1.substring(0, propName1.length - (currentFormName.length + 1));
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
  //currentDiv = document.getElementById(divId);
window.status = divId;
  var div = loadedPopups[divId];
  var hotspot = document.getElementById(imgId);

  // Use existing DIV from cache (unless text was Enter-ed - in which case always redraw DIV)
  if (!enteredText && div != null) {
    hideResetRow(div, currentFormName, originalProp);
    Popup.open(divId, hotspot, null, 0, 16);
    return;
  }
  else {
    var popup = Popup.getPopup(divId);
    if (popup == null) {
      div = document.getElementById(divId);
      popup = new Popup(div, hotspot);
    }
    else
      popup.reset(hotspot);
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
      var s = getFormFiltersForInterface(form, propName);
      if (s)
        url = url + s;
      var uri = form.elements['uri'];
      if (uri)
        url = url + "&$rootFolder=" + encodeURIComponent(uri.value);
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
  var listboxFrame = frames["popupFrame"];
  popupFrameLoaded = false;
  listboxFrame.location.replace(url); // load data from server into iframe
  timeoutCount = 0;
  setTimeout("Popup.load('" + divId + "')", 100);

}
function getFormFiltersForInterface(form, propName) {

  var field = form.elements[propName];
  if (field == null) {
    field = form.elements[propName + "_select"];
    if (field == null)
      return null;
  }
  var trNode = getTrNode(field);
  var elem = trNode.getElementsByTagName("div");
  if (!elem)
    return null;
  var interfaceUri = null;
  if (elem.length) {
    for (var i=0; i<elem.length; i++) {
      if (elem[i].id && elem[i].id.indexOf("http://") == 0) {
        interfaceUri = elem[i].id;
        break;
      }
    }
    if (interfaceUri == null)
      return null;
  }
  else if (!elem.id || elem.id.indexOf("http://") != 0)
    return null;
  else
    interfaceUri = elem.id; 
  
  var p = "";
  var fields = form.elements;
  for (i=0; i<fields.length; i++) {
    field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;

    if (!type || !name || !value)
      continue;
    if (type.toUpperCase() == "SUBMIT")
      continue;
    if (name )
    var trNode = getTrNode(field);
    elem = trNode.getElementsByTagName("div");
    if (!elem)
      continue;
    if (elem.length) {
      for (var ii=0; ii<elem.length; ii++) {
        if (elem[ii].id && elem[ii].id == interfaceUri) {
          p += "&" + name + "=" + encodeURIComponent(value);
          break;
        }
      }
    }
    else if (elem.id  &&  elem.id == interfaceUri)
      p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
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
    removeEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    removeEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

/*
 * Receives control on form submit events
 */
function popupOnSubmit(e) {
  try{if(rteUpdated == 'false'){updateRTEs(); rteUpdated = 'true';}}catch(ex){}
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
      cancel.style.visibility = Popup.HIDDEN;
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


var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

//*************************************** AUTOCOMPLETE *********************************************
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
  var form = target.form;
  var characterCode = getKeyCode(e); // code typed by the user

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
  var divId;
  if (fieldClass)
    divId = propName + "_class_" + formName;
  else
    divId = propName + "_" + formName;

  keyPressedImgId     = divId + "_filter";
  keyPressedElement   = target;
  keyPressedElement.style.backgroundColor='#ffffff';
  var currentPopup = Popup.getPopup(divId);

  if (characterCode == 13) { // open popup (or close it on second Enter)
    listboxOnClick1(keyPressedImgId, keyPressedElement.value);
    return false;            // tell browser not to do submit on 'enter'
  }

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
       currentPopup.close();
     return true;
  }
  if (currentPopup)
    currentPopup.close();


  if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not verified yet (i.e. not chose from the list)
  if (fieldSelect)   fieldSelect.value   = '';  // value was modified and is not verified yet (i.e. not chose from the list)
  autoCompleteTimeoutId = setTimeout("autoCompleteTimeout(" + keyPressedTime + ")", 500);
  // make property label visible since overwritten inside the field
  var filterLabel = document.getElementById(propName1 + "_span");
  if (filterLabel)
    filterLabel.style.display = '';
  if (currentPopup)
    clearOtherPopups(currentPopup.div);
  if (characterCode == 8)
    return false;
  else
    return true;
}

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

/*
  var popup = Popup.getPopupByHotspot(keyPressedImgId);
  if (popup) {
    popup.delayedClose();
  }
 */
  if (currentDiv) {
    delayedClose0(currentDiv.id);
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
  listboxOnClick1(keyPressedImgId, keyPressedElement.value);
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

function clearOtherPopups(div) {
//alert("div=" + div.id + ", loadedPopups.length=" + openedPopups.length)
  for (i in loadedPopups) {
    var p = loadedPopups[i];
    if (p == null)
      continue;
//alert("openedPopup=" + p.id)
    if (p != div) {
      loadedPopups[i] = null;
    }
  }
}

/*
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
*/

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
        if (type.toLowerCase() == "checkbox" ) {
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

function chooser1(element) {
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
    var selectItems = window.opener.document.forms[form].elements[shortPropName + "_select"];
    var len = selectItems.length;
    var tr = getTrNode(selectItems[len - 1]);
    var table = tr.parentNode;
    var newRow = tr.cloneNode(true);
    newRow.id = id;
    table.appendChild(newRow);
    selectItems = window.opener.document.forms[form].elements[shortPropName + "_select"];
    selectItems[len].value = id;
    selectItems[len].checked = true;
    var nmbOfSelected = 0;
    for (var i=0; i<len; i++) {
      if (selectedItems[i].checked) {
        nmbOfSelected++;
        if (nmbOfSelected > 1)
          break;
      }
    }
    if (nmbOfSelected > 1)
      window.opener.document.forms[form].elements[propName].value                        = value;
    else
      window.opener.document.forms[form].elements[propName].value                        = "<...>";
//    window.opener.document.forms[form].elements[shortPropName + "_select"][len].value  = id;
    window.opener.document.forms[form].elements[shortPropName + "_verified"].value     = "y";
    if (window.opener.document.forms[form].elements[propName].style)
      window.opener.document.forms[form].elements[propName].style.backgroundColor = '#ffffff';
    if (currentFormName == 'rightPanelPropertySheet') {
      var filterLabel = window.opener.document.getElementById(shortPropName + "_span");
      if (filterLabel)
        filterLabel.style.display = '';
    }
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
  var menuIcons = document.getElementsByTagName('img');
  var l = menuIcons.length;
  for (i=0; i<l; i++) {
    var m = menuIcons[i];
    if (m.id.indexOf('menuicon_') == 0) {
      addEvent(m, 'click', menuOnClick, false);
    }
  }
/*
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
        var trs = tables[1].getElementsByTagName('tr');
        for (int j; i<trs.length; j++) {
          trs[i];

        }
      }
    }
  }
*/
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
  var divId = 'menudiv_' + imgId.substring('menuicon_'.length);
  var popup = Popup.open(divId, target, null, 0, 19);
  e.cancelBubble = true;
  e.returnValue = false;
  if (e.preventDefault)  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  return false;
}

/**
 * act on the first A tag inside a menu item's TD
 * this is needed to make the whole menu item row clickable (not just the A tag's text)
 */
/*
function menuItemOnClick(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);

  if (!e)
    return;

  target = getTargetElement(e);
  if (!target)
    return;

  var tds = target.getElementsByTagName('td');
  if (tds == null || tds.length < 2) {
    throw new Error("invalid menu structure: expected TR to contain at least two TDs");
  }
  var td = tds[1];
  var anchors = td.getElementsByTagName("a");
  if (anchors == null || anchors.length != 1) {
    throw new Error("invalid menu structure: expected second TD in TR to contain one A");
  }

  var anchor = anchors[0];
  location.href = anchor.href;
  e.cancelBubble = true;
  e.returnValue = false;
  if (e.preventDefault)  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  return false;
}
*/

/*********************************** Tooltips ************************************/
function replaceTooltips0(elements) {
  var llen;
  llen = elements.length;
  for (i=0;i<llen; i++) {
    var elem = elements[i];
    if (elem.attributes['title']) {
      //addEvent(elem, 'mouseout',    tooltipMouseOut,    false);
      addEvent(elem, 'mouseover',   tooltipMouseOver,   false); // method that will create a popup specific for this hotspot
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
  elements = document.getElementsByTagName('a');
  replaceTooltips0(elements);
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
  if (!Popup.allowTooltip(target)) {
    return false;
  }
  var tooltip = target.getAttribute('tooltip'); // using getAttrbute() - as workaround for IE5.5 custom attibutes bug
  var tooltipText;
  if (!tooltip) {
    tooltip = target.getAttribute('title');
    if (tooltip) {
      tooltipText = tooltip;
      window.status = tooltipText;
      if (tooltipText == '')
        return true;
      window.status = tooltipText;

      // merge tooltip on IMG with tooltip on its parent A tag
      var parentA = target.parentNode;
      if (parentA && parentA.tagName.toUpperCase() == 'A') {
        var linkTooltip = parentA.getAttribute('title');
        if (linkTooltip) {
          var linkTooltipText = linkTooltip;
          if (linkTooltipText && linkTooltipText != '' && tooltipText != linkTooltipText) {
            tooltipText += '<br><i><small>' + linkTooltipText + '</small></i>';
          }
          parentA.title = '';
        }

      }

      //tooltipText = "<table border=0 style='display: block' cellpadding=0 cellspacing=0><tr><td>" + tooltipText + "</td></tr></table>";
      //tooltipText = "<span id='tooltipspan' style='display:table-cell'>" + tooltipText + "</span>";
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
    //if (tooltipDiv.style.width != '') {
    //  alert(tooltipDiv.style.width);
    //}
    var ifrRef = document.getElementById('tooltipIframe');
    Popup.open(tooltipDiv.id, target, ifrRef, 20, 25, 1000, tooltipText); // open with delay
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
    if (e.preventDefault)  e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    return false;
  }
  else
    return true;
}
/*
function tooltipMouseOut(e) {
  var p;
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e)
    return;

  target = getTargetElement(e);

var tooltipDiv = document.getElementById('system_tooltip');
if (!tooltipDiv)
  return true;

}
*/
//************************************* intercept all clicks ***********************************
function interceptLinkClicks() {
  //addEvent(document, 'keydown', onKeyDown, false);
  //addEvent(document, 'keyup',   onKeyUp,   false);

  var llen = document.links.length;
  for (i=0;i<llen; i++) {
    addEvent(document.links[i], 'click',   onClick,   false);
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
      removeModifier(url, '_shiftKey=y');
      removeModifier(url, '_ctrlKey=y');
      removeModifier(url, '_altKey=y');
      displayInner(url.href);
      e.cancelBubble = true;
      e.returnValue = false;
      if (e.preventDefault)  e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      return false;
    }
  }

  if (!p)
    return true;

  if (!url) {
    alert("onClick(): can't process control key modifier since event currentTarget is null: " + url);
    return;
  }
  else if(!url.href || url.href == null) {
    alert("onClick(): can't process control key modifier since event currentTarget.href is null: " + url.href);
    return;
  }
  removeModifier(url, '_shiftKey=y');
  removeModifier(url, '_ctrlKey=y');
  removeModifier(url, '_altKey=y');
  addUrlParam(url, p, null);
  document.location.href = url.href;
  e.cancelBubble = true;
  e.returnValue = false;
  if (e.preventDefault)  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  return false;
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

function displayInner(urlStr) {
  var frameId = 'bottomFrame';
  var bottomFrame = frames[frameId];
  // show content in a second pane
  //
  if (!bottomFrame)
    return;
  
  var finalUrl = urlStr;
  var idx = urlStr.indexOf('.html');
  if (idx != -1) {
    var idx1 = urlStr.lastIndexOf('/', idx);
    finalUrl = urlStr.substring(0, idx1 + 1) + 'plain/' + urlStr.substring(idx1 + 1);
  }

  bottomFrame.location.replace(finalUrl + "&hideComments=y&hideMenu=y&hideNewComment=y&hideHideBlock=y#pane2");
  
  e.cancelBubble = true;
  e.returnValue = false;
  if (e.preventDefault)  e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  return false;
}

//********************* helper functions ********************************

/**
 * the source of this function and getScrollXY is: http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize() {
  var myWidth = 0, myHeight = 0;
  myHeight = (Popup.ie5 || Popup.ie4) ? document.body.clientHeight : window.innerHeight;
  myWidth  = (Popup.ie5 || Popup.ie4) ? document.body.clientWidth  : window.innerWidth;
  return [ myWidth, myHeight ];
}

/**
 * the source of this function and getScrollXY is: http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize1() {
  var myWidth = 0, myHeight = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    myWidth = window.innerWidth;
    myHeight = window.innerHeight;
  } else if( document.documentElement &&
      ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    myWidth = document.documentElement.clientWidth;
    myHeight = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    //IE 4 compatible
    myWidth = document.body.clientWidth;
    myHeight = document.body.clientHeight;
  }
  return [ myWidth, myHeight ];
}

function getScrollXY() {
  var scrOfX = 0, scrOfY = 0;

  if (Popup.ie5 || Popup.ie4) {
    scrOfX = document.body.scrollLeft;
    scrOfY = document.body.scrollTop;
  }
  else {
    scrOfX = window.pageXOffset;
    scrOfY = window.pageYOffset;
  }
  return [ scrOfX, scrOfY ];
}

function getScrollXY1() {
  var scrOfX = 0, scrOfY = 0;
  if( typeof( window.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrOfY = window.pageYOffset;
    scrOfX = window.pageXOffset;
  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
    //DOM compliant
    scrOfY = document.body.scrollTop;
    scrOfX = document.body.scrollLeft;
  } else if( document.documentElement &&
      ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrOfY = document.documentElement.scrollTop;
    scrOfX = document.documentElement.scrollLeft;
  }
  return [ scrOfX, scrOfY ];
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

Popup.w3c =(document.getElementById)                                ? true : false;
Popup.ns4 =(document.layers)                                        ? true : false;
Popup.ie4 =(document.all && !this.w3c)                              ? true : false;
Popup.ie5 =(document.all && this.w3c)                               ? true : false;
Popup.ns6 =(Popup.w3c && navigator.appName.indexOf("Netscape")>=0 ) ? true : false;

function getElementCoords(elem) {
  var dim = new Dim();

  if (Popup.ns4) {
    dim.width  = (elem.document.width)  ? elem.document.width  : elem.clip.width;
    dim.height = (elem.document.height) ? elem.document.height : elem.clip.height;
  }
  else if (Popup.ie4) {
    dim.width  = (elem.style.pixelWidth)  ? elem.style.pixelWidth  : elem.offsetWidth;
    dim.height = (elem.style.pixelHeight) ? elem.style.pixelHeight : elem.offsetHeight;
  }
  else {
    dim.width  = (elem.style.width)  ? parseInt(elem.style.width)  : parseInt(elem.offsetWidth);
    dim.height = (elem.style.height) ? parseInt(elem.style.height) : parseInt(elem.offsetHeight);
  }
  dim.left = findPosX(elem);
  dim.top  = findPosY(elem);

  return dim;
}

function getElementCoords1(elem) {
  var dim = new Dim();

  if (document.layers) {       // Netscape, use the event object passed to us.
    //dim.x      = e.pageX;
    //dim.y      = e.pageY;
    dim.width  = elem.width;
    dim.height = elem.height;
  }
  else if (document.all) {     // IE, use the common window.event object.
    //dim.x      = window.event.x;
    //dim.y      = window.event.y;
    dim.width  = elem.offsetWidth;
    dim.height = elem.offsetHeight;
  }

  dim.width  = elem.offsetWidth;
  dim.height = elem.offsetHeight;

  dim.left = findPosX(elem);
  dim.top  = findPosY(elem);
  return dim;
}

function findPosX(obj) {
  var curleft = 0;
  if (obj.offsetParent) {
    while (obj.offsetParent) {
      curleft += obj.offsetLeft;
      obj = obj.offsetParent;
    }
  }
  else if (obj.x)
    curleft += obj.x;
  return curleft;
}

function findPosY(obj) {
  var curtop = 0;
  if (obj.offsetParent) {
    while (obj.offsetParent) {
      curtop += obj.offsetTop;
      obj = obj.offsetParent;
    }
  }
  else if (obj.y)
    curtop += obj.y;
  return curtop;
}

/**
 * function that adds a title (taken from page HEAD) of current page to a url that is passed as a parameter
 */
function addPageTitleToUrl(tr) {
  var title = document.title;
  if (!title)
    return;

  var aa = tr.getElementsByTagName("a");
  if (!aa)
    return;
  a = aa[0];

  var idx = a.href.indexOf('?');
  if (idx != -1)
    a.href = a.href + "&title=" + encodeURIComponent(title) + "#";  // add hash to avoid page reloading
  else
    a.href = a.href + "?title=" + encodeURIComponent(title) + "#";
  displayInner(a.href);
}

/**
 * function that adds a title (taken from page HEAD) of current page to a url that is passed as a parameter
 */
function showPageInner(tr) {
  var title = document.title;
  if (!title)
    return;

  var aa = tr.getElementsByTagName("a");
  if (!aa)
    return;
  a = aa[0];

  var idx = a.href.indexOf('?');
  if (idx != -1)
    a.href = a.href + "&title=" + encodeURIComponent(title) + "#";  // add hash to avoid page reloading
  else
    a.href = a.href + "?title=" + encodeURIComponent(title) + "#";
}


