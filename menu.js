

/**
 * Popup system.
 * Supports menu, dynamicaly generated listboxes, tooltips.
 * Supports row selection (one or many) in menu, listbox.
 * Support stacking up one popup on top of another (e.g.
 */

var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

String.prototype.startsWith = function(s) {
  var n = s.length;
  var m = this.length;
  if (m < n)
    return false;
  for (var i=0; i<n; i++) {
    if (this.charAt(i) != s.charAt(i))
      return false;
  }
  return true;
};

/**
 *  Since Internet Explorer does not define the Node interface constants,
 *  which let you easily identify the type of node, one of the first things to do
 *  in a DOM script for the Web is to make sure you define one yourself, if it's missing.
 */
if (!window['Node']) {
  window.Node = new Object();
  Node.ELEMENT_NODE = 1;
  Node.ATTRIBUTE_NODE = 2;
  Node.TEXT_NODE = 3;
  Node.CDATA_SECTION_NODE = 4;
  Node.ENTITY_REFERENCE_NODE = 5;
  Node.ENTITY_NODE = 6;
  Node.PROCESSING_INSTRUCTION_NODE = 7;
  Node.COMMENT_NODE = 8;
  Node.DOCUMENT_NODE = 9;
  Node.DOCUMENT_TYPE_NODE = 10;
  Node.DOCUMENT_FRAGMENT_NODE = 11;
  Node.NOTATION_NODE = 12;
}

// add contains function if it is missing
if (window.Node && Node.prototype && !Node.prototype.contains) {
  Node.prototype.contains = function (arg) {
    return !!(this.compareDocumentPosition(arg) & 16);
  };
}
Popup.currentDivs          = new Array(); // distinct divs that can be open at the same time (since they have different canvases)
Popup.popups               = new Array(); // pool of all popups with different divId(s)
Popup.openTimeoutId        = null; // timeout after which we need to open the delayed popup
Popup.delayedPopup         = null; // the delayed popup
Popup.lastClickTime        = null; // last time user clicked on anything
Popup.lastOpenTime         = null; // moment when last popup was opened
Popup.delayedPopupOpenTime = null; // moment when delayed popup was requested
Popup.tooltipPopup         = null;
Popup.DarkMenuItem  = '#AABFCD'; //'#95B0C3'; //'#dee6e6';
Popup.LightMenuItem = '';
Popup.autoCompleteDefaultTimeout = 200;
Popup.isShiftRequired		= null;

Popup.HIDDEN  =  'hidden';
Popup.VISIBLE =  'visible';
if (document.layers) {
  Popup.HIDDEN  = 'hide';
  Popup.VISIBLE = 'show';
}
Popup.w3c  = (document.getElementById)                                ? true : false;
Popup.ns4  = (document.layers)                                        ? true : false;
Popup.ie4  = (document.all && !this.w3c)                              ? true : false;
Popup.ie5  = (document.all && this.w3c)                               ? true : false;
Popup.opera = typeof opera != 'undefined'                             ? true : false;
if (document.attachEvent && !Popup.opera) {
  Popup.ie55 = true; // need better test since this one will include 5+ as well
}
Popup.ns6  = (Popup.w3c && navigator.appName.indexOf("Netscape")>=0 ) ? true : false;

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
};

Popup.allowTooltip = function (target) {
  var noOpenPopups = true;
  for (var i=0; i<Popup.popups.length; i++) {
    var popup = Popup.popups[i];
    if (typeof popup == 'undefined')
      continue;
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
};

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
};

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
  Popup.delayedPopup = null;
  var popup = Popup.getPopup(divId);
  if (popup) {
    popup.open1(offsetX, offsetY);
  }
};

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
};

Popup.delayedClose0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.delayedClose();
};

// part of delayed close after the timeout
Popup.delayedClose1 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;

  if (!popup.delayedCloseIssued) // delayed close canceled
    return;
  popup.close();
};

Popup.close0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.close();
};

/**
 *  Loads the ajax popup into the div
 */
Popup.load = function (div, hotspot, content) {
  var frameId     = 'popupFrame';
  var frameBodyId = 'popupFrameBody';

  //content exists if we used ajax via httpRequest, otherwise we need not extract content from iframe
  if (!content) {
    if (!frameLoaded[frameId]) {
      setTimeout(function () {Popup.load(div, hotspot)}, 50);
      return;
    }
    frameLoaded[frameId] = false;

    // now it is loaded
    var popupFrame = frames[frameId];
    var body = popupFrame.document.getElementById(frameBodyId);
    if (!body) {
      alert("Warning: server did not return listbox data - check connection to server");
      return;
    }
    var redirect = popupFrame.document.getElementById('$redirect'); // redirect to login page
    if (redirect) {
      document.location.href = redirect.href;
      return;
    }
    content = body.innerHTML;
  }

  var popup = Popup.getPopup(div.id);
  popup.setInnerHtml(content);
  var div = popup.div;

  var tables = div.getElementsByTagName('table');
  if (popup.firstRow() == null) {
    alert("Warning: server did not return listbox data - check connection to server");
    return;
  }

  ///
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  ///

  var addToTableName = "";
  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }

  hideResetRow(div, currentFormName, originalProp);
  popup.open1(0, 16);
  loadedPopups[div.id] = div;
};

/**
 * Close popup if mouse cursor is out
 */
Popup.closeIfOut0 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;
  popup.closeIfOut();
};

function Popup(divRef, hotspotRef, frameRef, contents) {
  if (!divRef)
    throw new Error("divRef parameter is null");
  if (typeof difRef == 'string')
    throw new Error("div parameter must be an object, not a string");
  if (!divRef.id)
    throw new Error("divRef parameter has no id: " + difRef);
  if (!hotspotRef)
    throw new Error("hotspotRef parameter is null");
  if (typeof hotspotRef == 'string')
    throw new Error("hotspot parameter must be an object, not a string");

  this.div            = divRef;     // div for this popup
  this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup (to cover input elements on the page below popup)
  this.hotspot        = hotspotRef; // hotspot that triggered this popup
  this.contents       = contents;
  this.isTooltipFlag  = contents ? true : false;

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
  this.delayedCloseIssued = false;
  this.initialized    = false;      // it is not yet initialized - event handlers not added
  var self = this;

  // add to the list of popups
  Popup.popups[divRef.id] = this;

  this.reset = function (hotspotRef, frameRef, contents) {
    this.hotspot        = hotspotRef;
    this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup (to cover input elements on the page below popup)
    this.contents       = contents;
    this.isTooltipFlag  = contents ? true : false;
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
    for (var i=0; i<nodes.length; i++) {
      if (nodes[i] == target)
        return true;
    }
  }

  this.isTooltip = function () {
    return self.isTooltipFlag;
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
    if (self.isTooltip()) {
      self.setInnerHtml(self.contents);
    }

    self.setVisible(offsetX, offsetY);
    self.popupClosed = false;

    self.deselectRow();

    self.setCurrentDiv();
    self.setFocus();
    if (!self.initialized) {
      self.interceptEvents();
      initListBoxes(self.div);
      interceptLinkClicks(self.div);
      //if (!self.isTooltip())
      var anchors = self.div.getElementsByTagName('a');
      replaceTooltips(self.div, anchors);
      self.initilized = true;
    }

    if (self.isTooltip()) {
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

  this.setInnerHtml = function (text) {
    setInnerHtml(self.div, text);
  }

  /**
   * Open delayed popup: initialize a delayed popup and quit
   */
  this.openDelayed = function (offsetX, offsetY, delay) {
    Popup.lastOpenTime         = new Date().getTime();
    Popup.delayedPopupOpenTime = new Date().getTime();

    // detected re-entering into the popup - thus clear a delayed close
    self.delayedCloseIssued = false;
    if (self.closeTimeoutId != null) {
      clearTimeout(self.closeTimeoutId);
      self.closeTimeoutId = null;
    }

    if (Popup.openTimeoutId) {                  // clear any prior delayed popup open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
    //Popup.openTimeoutId = setTimeout(function () {Popup.openAfterDelay(self.div.id, offsetX, offsetY, delay)});
    var exeStr = "Popup.openAfterDelay('" + self.div.id + "', " + offsetX + ", " + offsetY + ")";
    Popup.openTimeoutId = setTimeout(exeStr, delay);
    Popup.delayedPopup = self;
  }

  /**
   * Show popup
   */
  this.setVisible = function (offsetX, offsetY) {
    return setDivVisible(self.div, self.iframe, self.hotspot, offsetX, offsetY);
  }

  /**
   * Hide popup
   */
  this.setInvisible = function () {
    return setDivInvisible(self.div, self.iframe);
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
      self.setInvisible();
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
    if (timeout == null)
      timeout = 600;
    self.delayedCloseIssued = true;
    self.closeTimeoutId = setTimeout(function() {Popup.delayedClose1(divId)}, timeout);
  }

  /**
   * Intercept events generated within the popup
   */
  this.interceptEvents = function () {
    var div     = self.div;
    var hotspot = self.hotspot;
    //var isMenu  = div.id.indexOf('menudiv_') == 0 ? true false;

    if (Popup.ie55) { // IE 5.5+ - IE's event bubbling is making mouseout unreliable
      addEvent(div,     'mouseenter',  self.popupOnMouseOver, false);
      addEvent(div,     'mouseleave',  self.popupOnMouseOut,  false);
      addEvent(hotspot, 'mouseleave',  self.popupOnMouseOut,  false);
    }
    else {
      addEvent(div,     'mouseover', self.popupOnMouseOver, false);
      addEvent(div,     'mouseout',  self.popupOnMouseOut,  false);
      addEvent(hotspot, 'mouseout',  self.popupOnMouseOut,  false);
    }
    var firstRow = self.firstRow();
    if (firstRow == null)
      return; // popup structure without rows

    var tables = div.getElementsByTagName('table');
    if (!tables || !tables[1]) {
      return;
    }
    var table = tables[1];
    if (!table)
      return;
    //popup contains rows that can be selected
    if (document.all) { // IE - some keys (like backspace) work only on keydown
      addEvent(div,  'keydown',   self.popupRowOnKeyPress,  false);
    }
    else {              // Mozilla - only keypress allows to call e.preventDefault() to prevent default browser action, like scrolling the page
      addEvent(div,  'keypress',  self.popupRowOnKeyPress,  false);
    }
    var elem = firstRow;
    var n = self.rowCount();
    var cur = null;

    for (var i=0; i<n; i++, elem = self.nextRow()) {
      if (cur == elem)
        continue;
      var popupItem = new PopupItem(elem, i);
      self.items[popupItem.id];
      // avoid per-row onClick handler if table has its own
      if (!table.onclick) {
        addEvent(elem, 'click',     self.popupRowOnClick,     false);
        var anchors = elem.getElementsByTagName('a');
        if (anchors  &&  anchors.length != 0) {
          var anchor = anchors[0];
          if (anchor.onclick) {
            anchor.onclick1 = anchor.onclick;
            anchor.onclick = '';
          }
          var href = anchor.href;
          //anchors[0].href = 'javascript:;';
          elem.setAttribute('href', href);
          //anchors[0].disabled = true;
        }
      }
      addEvent(elem, 'mouseover', self.popupRowOnMouseOver, false);
      addEvent(elem, 'mouseout',  self.popupRowOnMouseOut,  false);
      cur = elem;
    }
  }

  /*
   * set keyboard focus on this popup
   */
  this.setFocus = function () {
    // make popup active for key input
    var as = self.div.getElementsByTagName('a');
    if (!as)
      return;
    var a = as[0];
    if(!a)
      return;

    if (a.href == 'about:blank') { // special dummy A tag just to be able to set focus (if does not exist - no need to focus)
      if (document.all) { // simple in IE
        if (self.div.focus)
          try { self.div.focus(); } catch(e) {};
      }
      else {                // hack for Netscape (using an empty anchor element to focus on)
        if (a.focus) {
          try { a.focus(); } catch(e) {};
        }
      }
    }
  }

  /**
   * Popup's on mouseover handler
   */
  this.popupOnMouseOver = function (e) {
    e = getDocumentEvent(e); if (!e) return;
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }
    var target = getTargetElement(e);
    if (!target)
      return;

// Packages.java.lang.System.out.println('mouseOver: target.tagName: ' + target.tagName + ', target.id: ' + target.id + ', div: ' + self.div.id);
    // detected re-entering into the popup - thus clear a timeout
    self.delayedCloseIssued = false;
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
    e = getDocumentEvent(e); if (!e) return;
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }

    var target = getMouseOutTarget(e);
    if (!target)
      return true;
//Packages.java.lang.System.out.println('mouseout: target.tagName: ' + target.tagName + ', target.id: ' + target.id + ', div: ' + self.div.id);
    self.delayedClose(600);
    return true;
  }

  //***************************************** row functions ****************************
  /**
   * This handler allows to use arrow keys to move through the menu and Enter to choose the menu element.
   */
  this.popupRowOnKeyPress = function(e) {
    e = getDocumentEvent(e); if (!e) return;
    // in IE for some reason same event comes two times
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }

    var currentDiv = self.getCurrentDiv();
    var characterCode = getKeyCode(e); // code typed by the user
    var target;
    var tr = self.currentRow;
    if (!tr)
      return stopEventPropagation(e);

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
        return stopEventPropagation(e);
      case 27:  //esc
        if (currentDiv)
          Popup.close0(currentDiv.id);
        return stopEventPropagation(e);
      case 13:  //enter
        self.popupRowOnClick1(e, tr);
        return stopEventPropagation(e);
      default:
      case 8:   //backspace
        if (currentDiv) {
          //var form = getFormNode(self.currentRow);
          var form = document.forms[currentFormName];
          if (form) {
            var inputField = form.elements[originalProp];
            setKeyboardFocus(inputField);
            autoComplete1(e, inputField);
            if (characterCode == 8) {
              // problem with IE - move line below to another place
              inputField.value = inputField.value.substring(0, inputField.value.length - 1);
            }
          }
        }
        return stopEventPropagation(e);
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

    return stopEventPropagation(e);
  }

  /**
   *  Reacts to clicks inside the popup
   */
  this.popupRowOnClick = function (e) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);
    var tr = getTrNode(target);
    if (!tr)
      return stopEventPropagation(e);
/*
    // in both IE and Mozilla on menu click (if menu has onClick handler) onclick event comes one more time
    var isProcessed = tr.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true)) {
      tr.setAttribute('eventProcessed', 'false');
      return stopEventPropagation(e);
    }

    // in IE on menu click (if menu has onClick handler) this same event comes yet another time
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
    }
*/

    var ret = self.popupRowOnClick1(e, tr, target);
    return ret;
  }

  this.popupRowOnClick1 = function (e, tr, target) {
    // prevent duplicate events (happens only in IE)
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }

    Popup.lastClickTime = new Date().getTime();
    var currentDiv = self.getCurrentDiv();
    if (!tr)
      tr = self.currentRow;
    if (self.isHeaderRow(tr)) // skip clicks on menu header
      return;

    //
    // if there is a link on this row - follow it
    //
    var anchors = tr.getElementsByTagName('A');
    if (anchors  &&  anchors.length != 0) {
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id);
      }
      var anchor = anchors[0];
      var trg = anchor.getAttribute('target');
      if (trg)
        return true;

      if (anchor.id.startsWith('-inner'))       // display as on-page dialog
        return onClickDisplayInner(e, anchor);
      if (anchor.onclick1) {
        anchor.onclick1(e);
      }
      else {
        var href = tr.getAttribute('href', href);
         if (href)
          document.location.href = href;
      }

      return false;
    }

    if (!tr.id)
      return;

    if (tr.id && tr.id == '$noValue')
      return;
    var isCalendar = tr.id.indexOf("_$calendar") != -1 ? true: false;
    if (isCalendar)
      return true;

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
    var idx = propertyShortName.indexOf(".", 1);
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

    var chosenTextField = form.elements[originalProp];
    var len = chosenTextField.length;
    var verified = prop + "_verified";
    if (currentResourceUri)
      verified = currentResourceUri + ".$" + verified;
    var fieldLabel = document.getElementById(prop + "_span");

    var iclass = prop + "_class";
    var formFieldClass    = form.elements[iclass];
    var formFieldVerified = form.elements[verified];

    var checkboxClicked = (target && target.tagName.toLowerCase() == 'input' && target.type.toLowerCase() == 'checkbox');
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
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id)
      }
      listboxOnClick1(currentImgId);
      return true;
    }

    var select;
    var isViewCols = currentFormName.indexOf("viewColsList") == 0  ||  currentFormName.indexOf("filterColsList") == 0;
    if (isViewCols)
      select = prop;
    else
      select = prop + "_select";
    if (currentResourceUri)
      select = currentResourceUri + ".$" + select;

    var formField = form.elements[select];
    var selectItems = form.elements[select];
    if (tr.id.indexOf('$clear') == 0) {
      if (isViewCols) {
        // form url based on parameters that were set
        var formAction = form.elements['-$action'].value;
        var allFields = true;
        if (formAction == "showproperties")
          allFields = false;
        var params;
        var arr = new Array(3);
        if (currentFormName.indexOf("viewColsList") == 0) {
          arr["-viewCols"] = "-viewCols";
          arr[".-viewCols"] = ".-viewCols";
          arr["-curViewCols"] = "-curViewCols";
        }
        else {
          arr["-filterCols"] = "-filterCols";
          arr[".-filterCols"] = ".-filterCols";
          arr["-curFilterCols"] = "-curFilterCols";
        }
        params = getFormFilters(form, allFields, arr);
        var formAction = form.elements['-$action'].value;
        var baseUriO = document.getElementsByTagName('base');
        var baseUri = "";
        if (baseUriO) {
          baseUri = baseUriO[0].href;
          if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
            baseUri += "/";
        }
        var url = baseUri + "localSearchResults.html?" + params;
        document.location.replace(url);
        return;
      }
      else {
        if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate rollup
          chosenTextField.value = '';
          self.hotspot.src = "icons/checkbox.gif";
          return closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked);
        }

        var isTablePropertyList = currentFormName.indexOf("tablePropertyList") == 0;
        if (len > 1) {
          if (!isTablePropertyList)
            chosenTextField[0].value   = tr.id.substring(6);
          else
            chosenTextField[0].value   = '';
        }
        else {
          if (!isTablePropertyList)
            chosenTextField.value   = tr.id.substring(6);
          else
            chosenTextField.value   = '';
        }
        if (chosenTextField.style)
          chosenTextField.style.backgroundColor = '';
      }
      formField.value         = '';
      if (formFieldClass)
        formFieldClass.value  = '';

      // hide property label that is displayed on top of the text field
      if (fieldLabel)
        fieldLabel.style.display    = "none";
      if (formFieldVerified)
        formFieldVerified.value = 'n';
      if (selectItems) {
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "checkbox")
            selectItems[i].checked = false;
          else
            selectItems[i].value = null;
        }
      }
      if (currentDiv)
        loadedPopups[currentDiv.id] = null;
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
      if (!isViewCols) {
	      if (len > 1) {
	        chosenTextField[0].value = val.substring(idx + 1);
	        if (chosenTextField[0].style)
	          chosenTextField[0].style.backgroundColor = '#ffffff';
	      }
	      else {
          if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate rollup
            chosenTextField.value = tr.id;
            var dateImg = tr.getElementsByTagName('img');
            this.hotspot.src = dateImg[0].src;
            return closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked);
          }
          else
            chosenTextField.value = val.substring(idx + 1);
          if (chosenTextField.style)
            chosenTextField.style.backgroundColor = '#ffffff';
        }
        var fr = form.elements[originalProp + "_From"];
        var to = form.elements[originalProp + "_To"];
        if (fr)
          fr.value = '';
        else if (to)
          to.value = '';
      }
      // show property label since label inside input field is now overwritten
      if (currentFormName.indexOf('rightPanelPropertySheet') == 0) {
        if (fieldLabel)
          fieldLabel.style.display = '';
      }
      var nmbChecked = 0;
      var selectedItem;
      var selectedIdx = 0;

      if (!selectItems.length) {
        var t = selectItems.type.toLowerCase();
        if (t == "hidden")
          selectItems.value = tr.id; // property value corresponding to a listitem
//        else if (t == "checkbox")
//          selectItems.value = tr.id; // property value corresponding to a listitem
      }
      else {
        selectItems.value = '';
        // go over selected items and count all checked
        var hiddenSelectedItem;
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "hidden") {
            hiddenSelectedItem = selectItems[i];
            selectItems[i].value = null;
            continue;
          }
          if (!selectItems[i].checked) {
            var sValue = selectItems[i].value;
            var sidx = sValue.indexOf("displayname__");
            if (sidx != -1) {
              sidx = sValue.indexOf("=");
              var s = "";
              var first = true;
              while (true) {
                var sidx1 = sValue.indexOf("&amp;", sidx);
                if (!first)
                  s += ' ';
                else
                  first = false;
                if (sidx1 == -1) {
                  s += sValue.substring(sidx + 1);
                  break;
                }
                else {
                  s += sValue.substring(sidx + 1, sidx1);
                  sidx = sValue.indexOf("=", sidx1 + 3);
                  if (sidx == -1)
                    break;
                }
              }
              sValue = s;
            }
            if (sValue == tr.id) { // check that item was selected by clicking on popup row not explicitely on checkbox
              if (!checkboxClicked)              // mark row's checkbox
                selectItems[i].checked = true;
            }
          }
          if (selectItems[i].checked == true) {
            selectedItem = selectItems[i];
            selectedIdx = i;
            nmbChecked++;
          }
        }
        if (!isViewCols) {
          if (nmbChecked == 0) {
            if (fieldLabel) {
              fieldLabel.style.display    = "none";
              var textContent = getTextContent(fieldLabel);
              if (textContent) {
                var idx = textContent.indexOf("\r");
                if (idx != -1)
                  textContent = textContent.substring(0, idx);
                chosenTextField.value = textContent + " --";
              }
            }
            else
              chosenTextField.value = "";
          }
          else if (nmbChecked == 1) {
            if (hiddenSelectedItem != null)
              hiddenSelectedItem.value = selectedItem.value;
            var trNode = getTrNode(selectedItem);
            var items = trNode.getElementsByTagName('td');
            var val = items[2].innerHTML;
            var idx = val.lastIndexOf(">");

            if (len > 1)
              chosenTextField[0].value = val.substring(idx + 1);
            else
              chosenTextField.value = val.substring(idx + 1);
          }
          else {
            if (hiddenSelectedItem != null)
              hiddenSelectedItem.value = selectedItem.value;
            chosenTextField.value = '<...>';
          }
        }
      }
    }

    // close popup
    var divId = prop + "_" + currentFormName;
    if (currentResourceUri != null) {
      if (divId.indexOf(".") == 0)
        divId = currentResourceUri + ".$" + divId;
      else
        divId = currentResourceUri + ".$." + divId;
    }
    var div = document.getElementById(divId);
    if (deleteCurrentDiv && currentDiv)
      loadedPopups[currentDiv.id] = null;
    // if checkbox was clicked, then do not close popup so that user can check checboxes, if needed
    if (!checkboxClicked)
      Popup.close0(div.id);
    clearOtherPopups(div);
    if (checkboxClicked)
      return true;
    else
      return false;
  }

  function closePopup(prop, currentDiv, deleteCurrentDiv, checkboxClicked) {
    // close popup
    var divId = prop + "_" + currentFormName;
    if (currentResourceUri != null) {
      if (divId.indexOf(".") == 0)
        divId = currentResourceUri + ".$" + divId;
      else
        divId = currentResourceUri + ".$." + divId;
    }
    var div = document.getElementById(divId);
    if (deleteCurrentDiv && currentDiv)
      loadedPopups[currentDiv.id] = null;
    // if checkbox was clicked, then do not close popup so that user can check checboxes, if needed
    if (!checkboxClicked)
      Popup.close0(div.id);
    clearOtherPopups(div);
    if (checkboxClicked)
      return true;
    else
      return false;
  }

  this.popupRowOnMouseOver = function (e) {
    e = getDocumentEvent(e); if (!e) return;
    // in IE for some reason same event comes two times
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return false;
      e.setAttribute('eventProcessed', 'true');
    }
    //self.setFocus();
    var target = getTargetElement(e);
    var tr = getTrNode(target);

    if (!tr)
      return true;

    if (self.isHeaderRow(tr))
      return true;

    self.deselectRow();

    // darken new current row
    self.currentRow = tr;
    self.selectRow();
    return true;
  }

  this.popupRowOnMouseOut = function (e) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getMouseOutTarget(e);
    if (!target)
      return true;

    // in IE for some reason same event comes two times
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return false;
      e.setAttribute('eventProcessed', 'true');
    }

    var tr = getTrNode(target);
    if (!tr)
      return true;

    self.deselectRow();
    self.currentRow = null;
    return true;
  }

  this.deselectRow = function () {
    if (self.currentRow == null)
      return;

    if (self.currentRow.tagName && self.currentRow.tagName.toLowerCase() == 'tr') {
      var tds = self.currentRow.getElementsByTagName('td');
      for (var i=0; i<tds.length; i++) {
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
      for (var i=0; i<tds.length; i++) {
        var elem = tds[i];
        //alert(elem.id);
        elem.style.backgroundColor = Popup.DarkMenuItem;
      }
    }
  }

  this.nextRow = function () {
    var cur = self.currentRow;
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      //if (cur == self.currentRow)
      //  a = 1;
      return self.currentRow;
    }

    var next = self.currentRow.nextSibling;

    if (next == null) {
      self.currentRow = self.firstRow();
      //if (cur == self.currentRow)
      //  a = 1;
      return self.currentRow;
    }

    //  The following is needed to work around FireFox and other Netscape-based
    //  browsers.  They will return a #text node for nextSibling instead of a TR.
    //  However, the next TR sibling is the one we're after.
    var exitIfBusted = 0;
    var nextTr = next;
    while (nextTr.nodeName && nextTr.nodeName.toUpperCase() != 'TR') {
      nextTr = nextTr.nextSibling;
      if (nextTr == null) {
        self.currentRow = self.firstRow();
        //if (cur == nextTr)
        //  a = 1;
        return self.currentRow;
      }
      exitIfBusted++;
      if (exitIfBusted > 10) {
        alert('could not locate next row for ' + self.currentRow.id);
        return null;
      }
    }
    next = nextTr;
    if (next.id.indexOf('divider') == -1 && next.id.indexOf("_$calendar") == -1) {
      self.currentRow = next;
      //if (cur == next)
      //  a = 1;
      return next;
    }
    else {
      self.currentRow = next;
      next = self.nextRow();
      //if (cur == next)
      //  a = 1;
      return next;
    }
  }

  this.prevRow = function () {
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      if (self.currentRow == null)
        return null;
      return self.prevRow();
    }

    var prev = self.currentRow.previousSibling;

    if (prev == null || self.isHeaderRow(prev)) {
      //self.deselectRow();
      self.currentRow = self.lastRow();
      //self.selectRow();
      return self.currentRow;
    }

    if (prev.tagName && prev.tagName.toUpperCase() == 'TR' && prev.id.indexOf('divider') == -1 && prev.id.indexOf("_$calendar") == -1) {
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
    if (tr && tr.className == 'menuTitle')
      return true;
    else
      return false;
  }

  /**
   * return first row in popup
   */
  this.firstRow = function() {
    var tables = self.div.getElementsByTagName('table');
    if (!tables || !tables[1] || tables[1].id.startsWith('-not-menu') || (tables[2] && tables[2].id.startsWith('-not-menu')) )
      return null;
    var trs = tables[1].getElementsByTagName('tr');
    if (trs == null)
      return null;

    for (var i=0; i<trs.length; i++) {
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
var innerUrls = new Array();
var innerListUrls = new Array();

var frameLoaded = new Array();

function reposition(div, x, y) {
  var intLessTop  = 0;
  var intLessLeft = 0;
  var elm = div.offsetParent;

  // absolute elements become relative to a container with position:relative
  // so must decrease top, left
  while (elm && elm.offsetParent != null) {
    intLessTop  += elm.offsetTop;
    intLessLeft += elm.offsetLeft;
    elm = elm.offsetParent;
  }
  //alert(intLessLeft + "," + intLessTop + ", " + x + ", " + y);
  div.style.left = x - intLessLeft + 'px';
  div.style.top  = y - intLessTop  + 'px';
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
 *  Opens the popup when needed, e.g. on click, on enter, on autocomplete
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
  var isGroupBy;
  if (originalProp.length > 8  &&  originalProp.indexOf("_groupBy") == originalProp.length - 8)
    isGroupBy = true;
  /* 'viewColsList' for does not have input fields where to set focus.
   *  form.elements[originalProp] returns list of viewCols properties to choose from to display in RL
   */
  if (!isGroupBy  &&  form  &&  currentFormName != "viewColsList"  && originalProp.indexOf("_class") == -1) {
    var chosenTextField = form.elements[originalProp];
    if (chosenTextField && chosenTextField.focus) {
      chosenTextField.focus();
      //insertAtCursor(chosenTextField, '');
      //setCaretToEnd(chosenTextField);
    }
  }
  var idx = -1;

  var divId;
  var isInterface;
  if (currentFormName.indexOf("siteResourceList") == 0) {
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
    idx = propName1.indexOf(".", 1);
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
    div = document.getElementById(divId);
    if (popup == null)
      popup = new Popup(div, hotspot);
    else
      popup.reset(hotspot);
  }

  // form url based on parameters that were set
  var formActionElm = form.elements['-$action'];
  var formAction = formActionElm.value;
  var baseUriO = document.getElementsByTagName('base');
  var baseUri = "";
  if (baseUriO) {
    baseUri = baseUriO[0].href;
    if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
      baseUri += "/";
  }
  var url = baseUri + "smartPopup";

  var params = "prop=" + encodeURIComponent(propName);
  if (currentFormName.indexOf("siteResourceList") == 0) {
    params += "&editList=1&uri=" + encodeURIComponent(currentResourceUri) + "&type=" + form.elements['type'].value;
  }
  else {
//    if (formAction != "showPropertiesForEdit" && formAction != "mkResource") {
      /* Add full text search criteria to filter */
      if (form.id && form.id == 'filter') {
        var fullTextSearchForm = document.forms['searchForm'];
        if (fullTextSearchForm) {
          var criteria = fullTextSearchForm.elements['-q'];
          if (criteria  &&  criteria.value.indexOf('-- ') == -1) {
            var textSearchForType = fullTextSearchForm.elements['-cat'];
            if (textSearchForType  &&  textSearchForType.value == 'on') {
              var textSearchInFilter = form.elements['-q'];
              if (textSearchInFilter) {
                textSearchInFilter.value = criteria.value;
                var textSearchInFilterForType = form.elements['-cat'];
                if (textSearchInFilterForType)
                   textSearchInFilterForType.value = 'on';
              }
            }
          }
        }
      }
      var allFields = true;
      if (formAction != "searchLocal" && formAction != "searchParallel") {
        if (enterFlag)
          allFields = false;
      }
//      else if (currentFormName.indexOf("horizontalFilter") == 0)
//        allFields = true;
      params += getFormFilters(form, allFields);
    /*
    }
    else {
      url = url + "&type=" + form.elements['type'].value + "&-$action=" + formAction;
      var s = getFormFiltersForInterface(form, propName);
      if (s)
        url = url + s;
      var uri = form.elements['uri'];
      if (uri) {
        if (formAction == "showPropertiesForEdit")
          url = url + "&uri=" + encodeURIComponent(uri.value);
        else
          url = url + "&$rootFolder=" + encodeURIComponent(uri.value);
      }
    }
    */
  }
  params += "&$form=" + currentFormName;
  params += "&" + propName + "_filter=y";
  if (!enterFlag)
    params += "&$selectOnly=y";
  if (enteredText  &&  params.indexOf("&" + propName + "=" + encodeURIComponent(enteredText)) == -1)
    params += "&" + propName + "=" + encodeURIComponent(enteredText);
  if (isInterface) {
    var classValue = form.elements[propName + "_class"].value;
    if (classValue != null && classValue.length != 0)
      params += "&" + propName + "_class=" + classValue;
  }

  // request listbox context from the server via ajax
  postRequest(url, params, div, hotspot, Popup.load);
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
  for (var i=0; i<fields.length; i++) {
    field = fields[i];
    var value = field.value;
    var name  = field.name;
    var type  = field.type;

    if (!type || !name || !value)
      continue;
    if (type.toUpperCase() == "SUBMIT")
      continue;

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
  for (var i=0;i<trs.length; i++) {
    var elem = trs[i];
    removeEvent(elem, 'click',     popupRowOnClick,     false);
    removeEvent(elem, 'mouseover', popupRowOnMouseOver, false);
    removeEvent(elem, 'mouseout',  popupRowOnMouseOut,  false);
  }
}

/**
 * Dummy function to help prevent duplicate form submits
 */
function fakeOnSubmit() {
  return false;
}
/*
 * Receives control on form submit events
 */
function popupOnSubmit(e) {
  e = getDocumentEvent(e); if (!e) return;
  // prevent duplicate events (happens only in IE)
  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
    e.setAttribute('eventProcessed', 'true');
  }

  var target = getTargetElement(e);
  var form = target;
  var buttonName = form.getAttribute("buttonClicked");
  var button = form.elements[buttonName];
  var pane2        = document.getElementById('pane2');
  var dialogIframe = document.getElementById('dialogIframe');

  var isCancel = button && button.name.toUpperCase() == 'CANCEL';
  if (isCancel) {    // cancel button clicked?
    if (pane2  &&  pane2.contains(form))  {   // inner dialog?
      setDivInvisible(pane2, dialogIframe);
      return stopEventPropagation(e);
    }
  }

  // put rte data in the hidden field(s)
  RteEngine.putRteDataOfForm(form);

  /* Add full text search criteria to filter */
  var fullTextSearchForm = document.forms['searchForm'];
  if (fullTextSearchForm) {
    if (form.id && form.id == 'filter') {
      var criteria = fullTextSearchForm.elements['-q'];
      if (criteria  &&  criteria.value.indexOf('-- ') == -1) {
        var textSearchForType = fullTextSearchForm.elements['-cat'];
        if (textSearchForType  &&  textSearchForType.value == 'on') {
          var textSearchInFilter = form.elements['-q'];
          if (textSearchInFilter) {
            textSearchInFilter.value = criteria.value;
            var textSearchInFilterForType = form.elements['-cat'];
            if (textSearchInFilterForType)
               textSearchInFilterForType.value = 'on';
          }
        }
      }
    }
  }
//  var action = form.attributes['action'];
  var action = form.action;
  // form url based on parameters that were set
  var url;
  if (action) {
    url = action;
  }
  else
    url = "FormRedirect"; // HACK: if form.action is empty

  var formAction = form.elements['-$action'].value;
  var allFields = true;
  if (formAction != "searchLocal" && formAction != "searchParallel" && formAction != "mkResource")
    allFields = false;
  else if (currentFormName && currentFormName.indexOf("horizontalFilter") == 0)
    allFields = true;

  var params = "submit=y"; // HACK: since target.type return the value of &type instead of an input field's type property
  var p1 = getFormFilters(form, allFields);
  if (p1)
    params += p1;
  var submitButtonName  = null;
  var submitButtonValue;
/*
  var t = target.attributes['type'];
  if (t.toUpperCase() == 'SUBMIT') {
    if (target.attributes['name'] == "Clear")
      url += "&clear=Clear";
    else if (currentFormName == "horizontalFilter")
      url += "&submit=y";
    else if (currentFormName == "rightPanelPropertySheet")
      url += "&submitFilter=y";
  }
  else
    url += "&submit=y";
*/

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

  params += '&$form=' + form.name;

  //url += '&$selectOnly=y';

  if (allFields == false)
    params += "&type=" + form.type.value + "&-$action=" + formAction;
  if (form.uri)
    params += "&uri=" + encodeURIComponent(form.uri.value);

  if (isCancel)
    params += "&cancel=y";

  /* do not allow to submit form while current submit is still being processed */
  if (form.name.indexOf("tablePropertyList") != -1) { // is it a data entry form?
    var wasSubmitted = form.getAttribute("wasSubmitted");
    if (wasSubmitted) {
      alert("Can not submit the same form twice");
      return stopEventPropagation(e);
    }
    form.setAttribute("wasSubmitted", "true");
    //form.submit.disabled = true; // weird, but the form would not get submitted if disabled

    // this solution for duplicate-submit does not work in firefox 1.0 & mozilla 1.8b - fakeOnSubmit get control even on first form submit
    // it has another drawback - page must be reloaded fro the form to be submitted second time - while previous solution works with back/forward
    /*
    if (form.onsubmit == fakeOnSubmit) {
      alert("Already submitted - please wait");
      return false;
    }
    form.onsubmit = fakeOnSubmit;
    */
  }
  for (j=0; j<form.elements.length; j++) {
    var elem = form.elements[j];
    var atts = elem.getAttribute('onSubmit');
    if (atts) {
      var s = atts.replace(/\(this\)/, ''); // e.g. replace setTime(this) into setTime
      elem.onSubmit = eval(s);
      elem.onSubmit();
    }
  }

// submit as GET with all parameters collected manually
//  form.method   = 'GET';
//  document.location.href = url;
//  return stopEventPropagation(event);
  form.method = 'POST';
  if (!action)
    form.action = "FormRedirect";

  if (pane2  &&  pane2.contains(form))  {   // dialog?
    setDivInvisible(pane2, dialogIframe);
  }

  // if current form is inner dialog - submit as AJAX request
  // upon AJAX response we will be able to choose between repainting the dialog or the whole page
  if (pane2  &&  pane2.contains(form))  {   // inner dialog?
    postRequest(url, params, pane2, getTargetElement(e), showDialog);
    return stopEventPropagation(e);
  }
  else
    return true; // tell browser to go ahead and continue processing this submit request
}

function setTime() {
  this.value = new Date().getTime();
}

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
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
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
  var idx = propName.indexOf(".", 1);
  if (idx != -1)
    propName1 = propName1.substring(0, idx);

  var fieldVerified = form.elements[propName1 + '_verified'];
  var selectItems   = form.elements[propName1 + '_select'];
  var fieldClass    = form.elements[propName1 + '_class'];
  if (characterCode == 13) { // enter
    if (!fieldVerified) { // show popup on Enter only in data entry mode (indicated by the presence of _verified field)
      //if (autoCompleteTimeoutId) clearTimeout(autoCompleteTimeoutId);
      return true;
    }
  }
  var divId;
  if (fieldClass)
    divId = propName + "_class_" + formName;
  else
    divId = propName + "_" + formName;

  keyPressedImgId     = divId + "_filter";
  var hotspot = document.getElementById(keyPressedImgId);
  if (!hotspot) // no image - this is not a listbox and thus needs no autocomplete
    return true;
  keyPressedElement   = target;
  var currentPopup = Popup.getPopup(divId);
/*
  !!!!!!!!!!!!! this below did not work to clear the previous popup
  if (currentDiv) {
    var p = Popup.getPopup(currentDiv);
    if (p)
      p.close();
  }
*/

  switch (characterCode) {
   case 38:  //up arrow
     if (currentPopup && currentPopup.isOpen()) {
       currentPopup.deselectRow();
       currentPopup.prevRow();
       currentPopup.selectRow();
     }
     else {
       listboxOnClick1(keyPressedImgId, keyPressedElement.value);
       //Popup.open(divId, hotspot, null, 0, 16);
     }
     return stopEventPropagation(e);
   case 40:  //down arrow
     if (currentPopup && currentPopup.isOpen()) {
       currentPopup.deselectRow();
       currentPopup.nextRow();
       currentPopup.selectRow();
     }
     else {
       listboxOnClick1(keyPressedImgId, keyPressedElement.value);
       //Popup.open(divId, hotspot, null, 0, 16);
     }
     return stopEventPropagation(e);
   case 37:  //left arrow
   case 39:  //right arrow
   case 33:  //page up
   case 34:  //page down
   case 36:  //home
   case 35:  //end
     return true;
   case 27:  //esc
     if (currentPopup && currentPopup.isOpen()) {
       currentPopup.close();
     }
     return stopEventPropagation(e);
   case 16:  //shift
   case 17:  //ctrl
   case 18:  //alt  s
   case 20:  //caps lock
     return true;
   case 127: //ctrl-enter
   case 13:  //enter
     if (currentPopup && currentPopup.isOpen()) {
       //listboxOnClick1(keyPressedImgId, keyPressedElement.value);
       currentPopup.popupRowOnClick1(e);
       return stopEventPropagation(e); // tell browser not to do submit on 'enter'
     }
   case 9:   //tab
     if (currentDiv)
       currentPopup.close();
     return true;
   case 8:   //backspace
   case 46:  //delete
     break;
  }
  if (currentPopup)
    currentPopup.close();

  // for numeric value - do not perform autocomplete (except arrow down, ESC, etc.)
  if (target.valueType && target.valueType.toUpperCase() == 'NUMERIC') {
    return true;
  }
  keyPressedElement.style.backgroundColor='#ffffff';
  if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not verified yet (i.e. not chose from the list)
  if (selectItems) {
    var len = selectItems.length;
    if (len) {
      for (var i=0; i<selectItems.length; i++) {
        if (selectItems[i].type.toLowerCase() == "checkbox")
          selectItems[i].checked = false;
        else
          selectItems[i].value = '';
      }
    }
    else
      selectItems.value   = '';  // value was modified and is not verified yet (i.e. not chose from the list)
  }
  autoCompleteTimeoutId = setTimeout("autoCompleteTimeout(" + keyPressedTime + ")", Popup.autoCompleteDefaultTimeout);
  // make property label visible since overwritten inside the field
  var filterLabel = document.getElementById(propName1 + "_span");
  if (filterLabel)
    filterLabel.style.display = '';
  if (currentPopup)
    clearOtherPopups(currentPopup.div);
  return true;
}

function autoCompleteOnFocus(e) {
  var target = getTargetElement(e);
  if (!target)
    return;

  if (target.internalFocus) {
    target.internalFocus = false;
    return true;
  }

  // prevent issuing select() if we got onfocus because browser window was minimized and then restored
  if (target.value != target.lastText)
    target.select();
  return true;
}

function autoCompleteOnBlur(e) {
  var target = getTargetElement(e);
  if (!target)
    return;

  target.lastText = target.value;
}

function autoCompleteOnMouseout(e) {
  var target = getMouseOutTarget(e);
  if (!target)
    return true;

  var img = document.getElementById(keyPressedImgId);
  if (!img)
    return true;

  if (currentDiv) {
    Popup.delayedClose0(currentDiv.id);
  }
}

/**
 * This onKeyDown handler is needed since some browsers do not capture certain special keys on keyPress.
 */
function autoCompleteOnKeyDown(e) {
  e = getDocumentEvent(e); if(!e) return;
  return autoComplete(e);
}

function autoCompleteTimeout(invocationTime) {
  if (keyPressedTime > invocationTime) {
    return;
  }
  if (!keyPressedImgId)
    return;

  var hotspot = document.getElementById(keyPressedImgId);
  if (!hotspot) {
    return true;
  }

  if (keyPressedElement.value.length == 0) // avoid showing popup for empty fields
    return;
  listboxOnClick1(keyPressedImgId, keyPressedElement.value);

  //var divId = keyPressedImgId.substring(0, keyPressedImgId.length() - '_filter'.length());
  //Popup.open(divId, hotspot, null, 0, 16);
}


function textAreaOnFocus(e) {
  var target = getTargetElement(e);
  var rows = getFormFieldInitialValue(target, 'rows');
  if (rows)
    target.attributes['rows'].value = rows;
  else
    target.attributes['rows'].value = 1;
  var cols = getFormFieldInitialValue(target, 'cols');
  if (!cols) {
    target.setAttribute('cols', 10);
    cols = 10;
  }
  var c = target.attributes['cols'];
  if (c) {
    c.value = cols;
    target.style.width = "96%";
  }
}

function textAreaOnBlur(e) {
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
      throw new Error("can't detect the key pressed");
  }
}

function clearOtherPopups(div) {
//alert("div=" + div.id + ", loadedPopups.length=" + openedPopups.length)
  var i;
  for (var i=0; i < loadedPopups.length; i++) {
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

  var elem_ = elem;
  if (elem.length > 1) {
    elem_ = elem[0];
    if (elem_.length > 1)
      alert('getTrNode(): element is array: ' + elem_ + ', its first element is: ' + elem_[0]);
  }
  if (elem_.tagName.toUpperCase() == 'TR')
    return elem_;
  e = elem_.parentNode;
  if (e) {
    if (e == elem_)
      e = elem.parentNode; // if parent of the array element is self - get parent of array
    return getTrNode(e);
  }
  else
    return null;
}

function getDivNode(elem) {
  var e;

  var elem_ = elem;
  if (elem.length > 1) {
    elem_ = elem[0];
    alert('getDivNode(): element is array: ' + elem + ', its first element is: ' + elem_);
  }
  if (elem_.tagName.toUpperCase() == 'DIV')
    return elem;
  e = elem_.parentNode;
  if (e) {
    if (e == elem)
      e = elem.parentNode; // if parent of the array element is self - get parent of array itself
    return getDivNode(e);
  }
  else
    return null;
}

function getDocumentNode(obj) {
  while (obj.parentNode) {
    obj = obj.parentNode;
    if (obj.location && obj.location.href)
      return obj;
  }
  return null;
}


/**
 * Helper function - gathers the parameters (from form elements) to build a URL
 * If allFields is true - we are in a Filter panel - need to take into account all input fields
 * Otherwise - it is a Data Entry mode, i.e. - take only fields that were modified by the user
 */
function getFormFilters(form, allFields, exclude) {
  var p = "";
  var fields = form.elements;

  for (var i=0; i<fields.length; i++) {
    var field = fields[i];
    var value = field.value;
    var name  = field.name;
    if (exclude &&  exclude[name])
      continue;
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
//      if (currentFormName != "horizontalFilter") {
      if (value == ''  ||  value == "All")
        continue;
      if (type.toLowerCase() == "checkbox" ) {
        if (field.checked == false)
          continue;
        }
        if (value.indexOf(" --", value.length - 3) != -1)
           continue;
      }
//    }
    if (name == "type")
      p += "&" + name + "=" + value;
    else
      p += "&" + name + "=" + encodeURIComponent(value);
  }
  return p;
}

function chooser(element) {
  var propName = element.name;
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  var form       = element.form.elements['$form'].value;
  var editList   = element.form.elements['$wasEditList'];
  var isHrefChange = element.form.id == "tree";
  var value    = element.value;
  var id       = element.id;

  if (!id)
    id = value;

  // need to find the first form with this name in parent window
  var originalForm;
  var l = window.opener.document.forms.length;
  for (var i=0; i<l; i++) {
    var forms = window.opener.document.forms;
    if (forms[i].name.indexOf(form) == 0) {
      originalForm = forms[i];
      break;
    }
  }
  if (!originalForm) {
    alert("form not found: " + form);
    return;
  }

  if (editList) {
    var uri = element.form.elements['$rUri'].value;
    if (propName.indexOf(".") == 0)
      propName = propName.substring(1);
    if (shortPropName.indexOf(".") == 0)
      shortPropName = shortPropName.substring(1);

    originalForm.elements[uri + ".$." + propName].value                    = value;
    originalForm.elements[uri + ".$." + shortPropName + "_select"].value   = id;
    originalForm.elements[uri + ".$." + shortPropName + "_verified"].value = "y";
  }
  else if (currentFormName  &&  (currentFormName.indexOf("viewColsList") == 0  ||  currentFormName.indexOf("filterColsList") == 0)) {
    originalForm.elements[shortPropName].value   = id;
  }
  else {
    if (isHrefChange) {
      var aa = window.opener.document.getElementById("a_" + shortPropName);
      var idx = id.lastIndexOf("/");
      aa.innerHTML = id.substring(idx + 1);
      idx = id.lastIndexOf("=");
      aa.href = id.substring(idx + 1);
    }
    originalForm.elements[propName].value                    = value;
    originalForm.elements[shortPropName + "_select"].value   = id;
    originalForm.elements[shortPropName + "_verified"].value = "y";
  }
}

function chooser1(element) {
  var propName = element.name;
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  var form     = element.form.elements['$form'].value;
  var editList = element.form.elements['$wasEditList'];
  var value    = element.value;
  var id       = element.id;

  if (!id)
    id = value;

  // need to find the first form with this name in parent window
  var originalForm;
  var l = window.opener.document.forms.length;
  for (var i=0; i<l; i++) {
    var forms = window.opener.document.forms;
    if (forms[i].name == form) {
      originalForm = forms[i];
      break;
    }
  }
  if (!originalForm) {
    alert("form not found: " + form);
    return;
  }

  if (editList) {
    var uri = element.form.elements['$rUri'].value;
    originalForm.elements[uri + ".$." + propName].value                    = value;
    originalForm.elements[uri + ".$." + shortPropName + "_select"].value   = id;
    originalForm.elements[uri + ".$." + shortPropName + "_verified"].value = "y";
  }
  else {
    var selectItems = originalForm.elements[shortPropName + "_select"];
    var len = selectItems.length;
    var tr = getTrNode(selectItems[len - 1]);
    var table = tr.parentNode;
    var newRow = tr.cloneNode(true);
    newRow.id = id;
    table.appendChild(newRow);
    selectItems[len].value = id;
    selectItems[len].checked = true;
    var nmbOfSelected = 0;
    for (var i=0; i<len; i++) {
      if (selectItems[i].checked) {
        nmbOfSelected++;
        if (nmbOfSelected > 1)
          break;
      }
    }
    if (nmbOfSelected > 1)
      originalForm.elements[propName].value                        = "<...>";
    else
      originalForm.elements[propName].value                        = value;
//    originalForm.elements[shortPropName + "_select"][len].value  = id;
    originalForm.elements[shortPropName + "_verified"].value     = "y";
    if (originalForm.elements[propName].style)
      originalForm.elements[propName].style.backgroundColor = '#ffffff';
    if (currentFormName.indexOf('rightPanelPropertySheet') == 0) {
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
  for (var i=0; i<trs.length; i++) {
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
function initMenus(menuBarId) {
  var element = document.getElementById(menuBarId);
  if (!element)
    throw new Error('menuBar not found: ' + menuBarId);
  var menuLinks = element.getElementsByTagName('A');
  var l = menuLinks.length;
  for (var i=0; i<l; i++) {
    var m = menuLinks[i];
    var id = m.id;
    if (id && id.startsWith('menuLink_')) {
      addEvent(m, 'click',     menuOnClick, false);
      replaceTooltip(element, m);
    }
/*
    if (m.className  &&  m.className.indexOf('fade', m.className.length - 4) != -1) {
      if (m.attachEvent) { // hack for IE use 'traditional' event handling model - to avoid event bubbling and make IE set 'this' to the element that fired the event
        //m.onmouseover = unfadeOnMouseOver;
        //m.onmouseout  = fadeOnMouseOut;
      }
      else {
        //addEvent(m, 'mouseover', unfadeOnMouseOver, false);
        //addEvent(m, 'mouseout',  fadeOnMouseOut,    false);
      }
    }
*/
  }
/*
  // fading of td elements with id ending with 'fade'
  menuLinks = document.getElementsByTagName('td');
  l = menuLinks.length;
  for (var i=0; i<l; i++) {
    var m = menuLinks[i];
    if (m.id  &&  m.id.indexOf('fade', m.id.length - 4) != -1) {
      if (m.attachEvent) { // hack for IE use 'traditional' event handling model - to avoid event bubbling and make IE set 'this' to the element that fired the event
        //m.onmouseover = fadeOnMouseOver;
        //m.onmouseout  = unfadeOnMouseOut;
      }
      else {
        //addEvent(m, 'mouseover', fadeOnMouseOver, false);
        //addEvent(m, 'mouseout',  unfadeOnMouseOut,    false);
      }
    }
  }
*/
}

/**
 *  Opens the menu when needed, e.g. on click, on enter
 */
function menuOnClick(e) {
  var target = getTargetElement(e);
  if (!target)
    return;
  e = getDocumentEvent(e); if (!e) return;
  // in IE for some reason same event comes two times
  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
  }

  var id = target.id;
  var title;
  if (id.indexOf('menuLink_') == 0)
    title = id.substring('menuLink_'.length);
  else
    title = id.substring('menuicon_'.length);
  var divId = 'menudiv_' + title;
  var divRef = document.getElementById(divId); // this is a menu item without popup, exit
  if (!divRef)
    return true;
  var popup = Popup.open(divId, target, null, 0, 19);
  return stopEventPropagation(e);
}


/*********************************** Tooltips ************************************/
function replaceTooltips(div, elements) {
  if (!elements)
    return;
  var llen = elements.length;
  for (var i=0; i<llen; i++) {
    var elem = elements[i];
    replaceTooltip(div, elem);
  }
}

function replaceTooltip(div, elem) {
  if (elem == null)
    return;
  if (div) {
    if (div.style != null)
      elem.style.zIndex = div.style.zIndex; // inherit zIndex - otherwise hotspot has no zIndex which we need to inherit further in setDivVisible
  }
  if (elem.getAttribute('title')) {
    if (Popup.ie55) { // IE 5.5+ - IE's event bubbling is making mouseout unreliable
      addEvent(elem, 'mouseenter',  tooltipOnMouseOver,   false);
      addEvent(elem, 'mouseleave',  tooltipOnMouseOut,    false);
    }
    else {
      addEvent(elem, 'mouseover',   tooltipOnMouseOver,   false);
      addEvent(elem, 'mouseout',    tooltipOnMouseOut,    false);
    }
  }
}
/*
function replaceAllTooltips() {
  var llen;
  var elements;
  elements = document.getElementsByTagName('img');
  replaceTooltips0(null, elements);
  elements = document.getElementsByTagName('span');
  replaceTooltips0(null, elements);
  elements = document.getElementsByTagName('a');
  replaceTooltips0(null, elements);
  elements = document.getElementsByTagName('input');
  replaceTooltips0(null, elements);
  elements = document.getElementsByTagName('tt');
  replaceTooltips0(null, elements);
}
*/
function tooltipOnMouseOver0(target, toShow) {
  //Packages.java.lang.System.out.println('tooltip mouseover: ' + target.tagName + ', ' + target.id);
  if (!Popup.allowTooltip(target)) {
    return true; // ignore this tooltip and return true to allow mouseover processing to continue
  }
  var tooltip = target.getAttribute('tooltip'); // using getAttrbute() - as workaround for IE5.5 custom attibutes bug
  var tooltipText;
  if (!tooltip) {
    tooltip = target.getAttribute('title');

    if (!tooltip) // no title attribute - get out of here
      return true;
    tooltipText = tooltip;
	if (tooltipText == '')
      return true;
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
  else
    tooltipText = tooltip;

  if(toShow == false) {// if requered shift was not pressed
	var plainTooltipText = tooltipText.replace(/<\/?[^>]+(>|$)/g, " ")
	window.status = plainTooltipText;
	return false;
  }

  var divId    = 'system_tooltip';
  var iframeId = 'tooltipIframe';
  var tooltipDiv = document.getElementById(divId);
  if (!tooltipDiv) {
    //throw new Error("document must contain div '" + divId + "' to display enhanced tooltip: " + tooltipText);
    return false; // in FF for some reason if page not fully loaded this div is not yet defined
  }
  //if (tooltipDiv.style.width != '') {
  //  alert(tooltipDiv.style.width);
  //}
  var ifrRef = document.getElementById(iframeId);
  if (!ifrRef)
    throw new Error("document must contain iframe '" + iframeId + "' to display enhanced tooltip");
  Popup.open(divId, target, ifrRef, 20, 25, 1000, tooltipText); // open with delay
  return false;
}

function tooltipOnMouseOver(e) {
  e = getDocumentEvent(e); if (!e) return;

  initShiftPref();
  var toShow = !(Popup.isShiftRequired && !e.shiftKey);

  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
    e.setAttribute('eventProcessed', 'true');
  }
  var target = getTargetElement(e);
  if (!tooltipOnMouseOver0(target, toShow))
    return stopEventPropagation(e);
  else
    return true;
}

function tooltipOnMouseOut(e) {
  e = getDocumentEvent(e); if (!e) return;
  window.status = "";
  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
    e.setAttribute('eventProcessed', 'true');
  }
  var target = getMouseOutTarget(e);
  if (!target)
    return true;
  var popup = Popup.getPopup('system_tooltip');
  if (popup && popup.isOpen())
    return true;
  //Packages.java.lang.System.out.println('tooltip mouseout: ' + target.tagName + ', ' + target.id);
  if (Popup.delayedPopup && Popup.delayedPopup.isTooltip()) {
    clearTimeout(Popup.openTimeoutId);
    Popup.openTimeoutId = null;
  }
  return stopEventPropagation(e);
}

function shiftPrefSwitch() {
	Popup.isShiftRequired = !Popup.isShiftRequired;
	var tooltip = Popup.getPopup('system_tooltip');
	tooltip.delayedClose();

	var shiftDiv = document.getElementById("shift_pref");
	shiftDiv.innerHTML = "done";
	// set cookie
	var sValue = Popup.isShiftRequired ? "yes" : "no";
	var expiresData = new Date();
  expiresData.setTime(expiresData.getTime() + (1000 * 86400 * 365));
  document.cookie = "shift_pressed=" + escape(sValue)
       + "; expires=" + expiresData.toGMTString();
}

function initShiftPref() {
	if(Popup.isShiftRequired == null) {
		var aCookie = document.cookie.split("; ");
		var bValue = false;
		for (var i=0; i < aCookie.length; i++) {
			// a name/value pair (a crumb) is separated by an equal sign
			var aCrumb = aCookie[i].split("=");
			if (aCrumb[0] == "shift_pressed") {
				if(unescape(aCrumb[1]) == "yes")
					bValue = true;
				break;
			}
		}
		Popup.isShiftRequired = bValue;
	}

	var shiftDiv = document.getElementById("shift_pref");
	if(Popup.isShiftRequired)
		shiftDiv.innerHTML = "show tooltips always";
	else
		shiftDiv.innerHTML = "show tooltips only when shift pressed";
	shiftDiv.style.visibility = "visible";
}

//************************************* intercept all clicks ***********************************
function interceptLinkClicks(div) {
  //addEvent(document, 'keydown', onKeyDown, false);
  //addEvent(document, 'keyup',   onKeyUp,   false);
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
    if (id && id.startsWith('menuLink_')) // menu clicks are processed by their own event handler
      continue;
    if (id && id.startsWith("-inner."))
      addEvent(anchor, 'click',  onClickDisplayInner,   false);
    else
      addEvent(anchor, 'click',  onClick,   false);
    replaceTooltip(doc, anchor);
  }
}


function schedule(table, e) {
  e = getDocumentEvent(e);
  var target = getEventTarget(e);
  if (target == null || target.className == null)
    return;

  var className = target.className;
  var tdId = target.id;
  var idx1 = tdId.indexOf(".") + 1;
  var idx = tdId.indexOf(":");
  if (className == "b") {
    if (idx == -1)
      return;
    var calendarIdx = parseInt(tdId.substring(idx1, idx));
    var duration = parseInt(tdId.substring(idx + 1));
    openPopup(null, calendarIdx, target, e, duration);
  }
  else if (className == "a") {
    if (idx == -1)
      return;
    var duration = parseInt(tdId.substring(idx + 1));

    if (tdId.indexOf("-") == -1) {
      var calendarIdx = parseInt(tdId.substring(idx1, idx));
      openPopup(calendarIdx, calendarIdx, target, e, duration);
    }
    else  {
      var calendarIdx = parseInt(tdId.substring(idx1 + 1, idx));
      openPopup1(parseInt(tdId.substring(idx1 + 1)), 'changeAlert', target, e, duration);
//      openPopup1(parseInt(tdId.substring(1)), 'changeAlert', target, e, duration);
    }
  }
  else if (className == "ci") {
    calendarCell = target;
    addCalendarItem(this, event, parseInt(tdId.substring(idx1)));
  }
  else if (className == "aea")
    showAlert('expiredAlert');
}

function addEventOnSchedule() {
  var table = document.getElementById("mainTable");
  if (table == null)
    return;
  addEvent(table, 'dblclick', function(event) {schedule(table, event);}, false);
}
function initListBoxes(div) {
  var images;
  var doc;
  if (div) {
    images = div.getElementsByTagName('img');
    doc = div;
  }
  else {
    images = document.images;
    doc = document;
  }
  for (var i=0; i<images.length; i++) {
    var image = images[i];
    if (image.id.indexOf("_filter", image.id.length - "_filter".length) != -1)
      addEvent(image, 'click', listboxOnClick, false); // add handler to smartlistbox images
    else
      addBooleanToggle(image);
    replaceTooltip(doc, image);
  }

  // 1. add handler to autocomplete filter form text fields
  // 2. save initial values of all fields
  if (typeof autoComplete == 'undefined')
    return;
  var forms;
  if (div)
    forms = div.getElementsByTagName('form');
  else
    forms = document.forms;
  formInitialValues = new Array(forms.length);
  for (var i=0; i<forms.length; i++) {
    var form = forms[i];
    var initialValues = new Array(form.elements.length);
    formInitialValues[form.name] = initialValues;
    if (form.id != 'filter')
      continue;
    addEvent(form, 'submit', popupOnSubmit, false);
    for (j=0; j<form.elements.length; j++) {
      var elem = form.elements[j];
      replaceTooltip(doc, elem);
      initialValues[elem.name] = elem.value;
      if (elem.type && elem.type.toUpperCase() == 'TEXT' &&  // only on TEXT fields
          elem.id) {                                         // and those that have ID
        if (document.all) // in IE - some keys (like backspace) work only on keydown
          addEvent(elem, 'keydown',  autoCompleteOnKeyDown,     false);
        else
          addEvent(elem, 'keypress', autoComplete,              false);
        addEvent(elem, 'focus',      autoCompleteOnFocus,       false);
        addEvent(elem, 'blur',       autoCompleteOnBlur,        false);
        addEvent(elem, 'mouseout',   autoCompleteOnMouseout,    false);
        //addEvent(elem, 'change',   onFormFieldChange, false);
        //addEvent(elem, 'blur',     onFormFieldChange, false);
        //addEvent(elem, 'click',    onFormFieldClick,  false);
      }
      else if (elem.type && elem.type.toUpperCase() == 'TEXTAREA') {
        var rows = elem.attributes['rows'];
        var cols = elem.attributes['cols'];
        if (rows)
          initialValues[elem.name + '.attributes.rows'] = rows.value;
        if (cols)
          initialValues[elem.name + '.attributes.cols'] = cols.value;
        if (!elem.value || elem.value == '') {
          elem.setAttribute('rows', 1);
          elem.setAttribute('cols', 10);
          //elem.attributes['cols'].value = 10;
          addEvent(elem, 'focus', textAreaOnFocus,  false);
          addEvent(elem, 'blur',  textAreaOnBlur,   false);
        }
      }
      else  {
         //         alert(elem.name + ", " + elem.type + ", " + elem.id + ", " + elem.valueType);
      }
    }
  }
}

function uiFocus(div) {
  if (!div)
    div = document;

  var fields = div.getElementsByTagName('input');
  var firstField;

  for (var i=0; i<fields.length; i++) {
    var u = fields[i];
    if (u && u.type && u.type != 'hidden') {
      if (!firstField) {
        firstField = u;
      }
      if (u.id && (u.id == 'uiFocus' || u.id.indexOf('_uiFocus') != -1)) {
        u.focus(); // in IE (at least in IE6) first focus() is lost for some reason - we are forced to issue another focus()
        u.focus();
        return true;
      }
    }
  }
  if (firstField && div != document) {
    firstField.focus();
    firstField.focus(); // second time for IE
  }
  return false;
}

function onClickDisplayInner(e, anchor) {
  if (!anchor)
    anchor = getTargetAnchor(e);
  if (!anchor || !anchor.id)
    return;
  e = getDocumentEvent(e); if (!e) return;
  // in IE for some reason same event comes two times
  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
  }

  var propName = anchor.id.substring(7);
  var r;
  if (propName.indexOf("list.") == 0)
    r = displayInner(e, innerListUrls[propName.substring(5)]);
  else {
    var a = anchor.href;
    if (a != 'about:blank')
      r = displayInner(e, a);
    else {
      var ul = document.getElementById(propName);
      if (!ul)
        r = displayInner(e, innerUrls[propName]);
      else {
        var li = ul.getElementsByTagName("li");
        r = displayInner(e, decodeURL(li[0].innerHTML));
      }
    }
  }
  return r;
}

/**
 * Registered to receive control on a click on any link.
 * Adds control key modifier as param to url, e.g. _ctrlKey=y
 */
function onClick(e) {
  detectClick = true;
  var p;

  var target = getTargetElement(e);
  var link = getTargetAnchor(e);
  if (!link || !link.href || link.href == null)
    return;

  if     (e.ctrlKey) {
    p = '_ctrlKey=y';
  }
  else if(e.shiftKey) {
    p = '_shiftKey=y';
  }
/*
  else if(e.altKey) {
    p = '_altKey=y';
    var frameId = 'bottomFrame';
    var bottomFrame = frames[frameId];
    // show content in a second pane
    //
    if (bottomFrame) {
      removeModifier(link, '_shiftKey=y');
      removeModifier(link, '_ctrlKey=y');
      removeModifier(link, '_altKey=y');
      return displayInner(e, link.href);
    }
  }
*/
  if (p) {
    removeModifier(link, '_shiftKey=y');
    removeModifier(link, '_ctrlKey=y');
    removeModifier(link, '_altKey=y');
    addUrlParam(link, p, null);

    document.location.href = link.href;
    return stopEventPropagation(e);
  }
  else {
    if (link.id.startsWith('-inner')) {      // display as on-page dialog
      return onClickDisplayInner(e, link);
    }
  }
  return true;
}

/**
 * remove modifier, like ctrl_y
 */
function removeModifier(url, param) {
  var urlStr = url.href;
  var idx = urlStr.indexOf(param);
  if (idx == -1)
    return url;

  var len = param.length;
  if (urlStr.charAt(idx - 1) == '&') {
    idx--;
    len++;
  }

  var uBefore = urlStr.substring(0, idx);
  var uAfter  = urlStr.substring(idx + len);
  urlStr = uBefore + uAfter;
  url.href = urlStr;
  // alert('before='+uBefore + ', after=' + uAfter);
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

// get link on which user clicked (it could be a A in TD or it could be A around IMG)
function getTargetAnchor(e) {
  var target = getTargetElement(e);
  if (target.tagName.toUpperCase() == 'A')
    return target;
  var anchors = target.getElementsByTagName('a');
  if (anchors && anchors[0])
    return anchors[0];

  return getANode(target);
}

function getANode(elem) {
  var e;

  if (elem.tagName && elem.tagName.toUpperCase() == 'A') {
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

//********************* helper functions ********************************

/**
 * the source of this function and getScrollXY is: http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize1() {
  var myWidth = 0, myHeight = 0;
  myHeight = (Popup.ie5 || Popup.ie4) ? document.body.clientHeight : window.innerHeight;
  myWidth  = (Popup.ie5 || Popup.ie4) ? document.body.clientWidth  : window.innerWidth;
  return [ myWidth, myHeight ];
}

/**
 * the source of this function and getScrollXY is: http://www.howtocreate.co.uk/tutorials/index.php?tut=0&part=16
 */
function getWindowSize_no_viewport() {
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
  if (d.documentElement && typeof d.documentElement.clientWidth != "undefined" && d.documentElement.clientWidth != 0) {
    //d.documentElement.clientWidth/Height is currently not supported by Gecko; see bugzilla bug file 156388 on that.
    d.FormName.WidthMinusScrollbar.value  = d.documentElement.clientWidth  + 2*parseInt(d.documentElement.currentStyle.borderWidth,10) ;
    d.FormName.HeightMinusScrollbar.value = d.documentElement.clientHeight + 2*parseInt(d.documentElement.currentStyle.borderWidth,10) ;
  }
  else if (d.all && d.body && typeof d.body.clientWidth != "undefined") {
    // d.styleSheets[0].rules[1].style.borderWidth,10 should work for MSIE 4
    d.FormName.WidthMinusScrollbar.value = d.body.clientWidth + 2*parseInt(d.body.currentStyle.borderWidth,10) ;
    d.FormName.HeightMinusScrollbar.value = d.body.clientHeight + 2*parseInt(d.body.currentStyle.borderWidth,10);
  }
  else if (d.body && typeof d.body.clientWidth != "undefined") {
    d.FormName.WidthMinusScrollbar.value = d.body.clientWidth ;
    d.FormName.HeightMinusScrollbar.value = d.body.clientHeight ;
  };
*/
  return [ widthPlusScrollbar, heightPlusScrollbar ];

}
function getScrollXY1() {
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

function getScrollXY() {
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
function addPageTitleToUrl(e) {
  var target = getTargetElement(e);
  if (!target)
    return;
  var tr = getTrNode(target);
  if (!tr)
    return;

  tr.setAttribute('eventProcessed', 'true');
  var aa = tr.getElementsByTagName("a");
  if (!aa)
    return;
  a = aa[0];

  var idx = a.href.indexOf('?');
  var delim = idx != -1 ? '&' : '?';

  var title = document.title;
  if (title)
    title = encodeURIComponent(title);
  var ret = displayInner(e, a.href + delim + 'title=' + title);
  return ret;
}

var xmlEntities = [];
xmlEntities['quot'] = '"';
xmlEntities['amp'] = '&';
xmlEntities['lt'] = '<';
xmlEntities['gt'] = '>';
xmlEntities['apos'] = "'";
xmlEntities['34'] = '"';
xmlEntities['38'] = '&';
xmlEntities['60'] = '<';
xmlEntities['62'] = '>';
xmlEntities['39'] = "'";

function decodeURL(str) {
  var buf = '';
  for (var i = 0; i < str.length; ++i) {
    var ch = str.charAt(i);
    if (ch != '&') {
      buf += ch;
      continue;
    }
    var semi = str.indexOf(';', i + 1);
    if (semi == -1) {
      buf += ch;
      continue;
    }
    var entityName = str.substring(i + 1, semi);
    var entityValue;
    if (entityName.charAt(0) == '#')
      entityValue = entityName.substring(1);
    else {
      var e = xmlEntities[entityName];
      if (e == null)
        entityValue = -1;
      else
        entityValue = e;
    }
    if (entityValue == -1) {
      buf += '&' + entityName + ';';
    } else {
      buf += entityValue;
    }
    i = semi;
  }
  return buf;
}



function displayInner(e, urlStr) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e); if (!target) return;
  var anchor = getTargetAnchor(e);

  var finalUrl;
  if (urlStr)
    finalUrl = urlStr;
  else {
    if (!anchor)
      return;
    urlStr = anchor.href;
  }
  var idx = urlStr.indexOf('.html');
  if (idx != -1) {
    var idx1 = urlStr.lastIndexOf('/', idx);
    finalUrl = urlStr.substring(0, idx1 + 1) + urlStr.substring(idx1 + 1);
//    finalUrl = urlStr.substring(0, idx1 + 1) + 'plain/' + urlStr.substring(idx1 + 1);
  }

  finalUrl += "&hideComments=y&hideMenuBar=y&hideNewComment=y&hideHideBlock=y&-inner=y";
  stopEventPropagation(e);

  var hotspot = target ? target : anchor;
  var url    = finalUrl;
  var params = null;
//  if (finalUrl.length > 2000) {
    var idx = finalUrl.indexOf('?');
    url    = finalUrl.substring(0, idx);
    params = finalUrl.substring(idx + 1);
//  }
  var div = document.getElementById('pane2');
  postRequest(url, params, div, hotspot, showDialog);
  //bottomFrame.location.replace(finalUrl);
  //var timeOutFunction = function () { showDialog(div, hotspot); };
  //setTimeout(timeOutFunction, 50);

  return false;
}

/**
 *  copies html loaded via ajax into a div
 */
function showDialog(div, hotspot, content) {
  var frameId = 'popupFrame';
  if (!content) {
    if (!frameLoaded[frameId]) {
      var timeOutFunction = function () { showDialog(div, hotspot) };
      setTimeout(timeOutFunction, 50);
      return;
    }
    frameLoaded[frameId] = false;

    //-------------------------------------------------
    var frameBody = frames[frameId].document.body;
    var frameDoc  = frames[frameId].document;
    var frameBody = frameDoc.body;
    var d = frameDoc.getElementById("corePageContent");
    if (d)
      frameBody = d;

    content = frameBody.innerHTML;
  }

  var re = eval('/' + div.id + '/g');
  content = content.replace(re, div.id + '-removed');  // prevent pane2        from appearing 2 times in the document
  var re = eval('/' + frameId + '/g');
  content = content.replace(re, frameId + '-removed'); // prevent dialogIframe from appearing 2 times in the document
  setInnerHtml(div, content);

  var iframe = document.getElementById('dialogIframe');
  setDivVisible(div, iframe, hotspot, 16, 16);
  initListBoxes(div);
  uiFocus(div);
  var anchors = div.getElementsByTagName('A');
  replaceTooltips(div, anchors);

  // execute JS code of innerHTML
  execJS.runDivCode(div);
}

function stopEventPropagation(e) {
  try {
    e.cancelBubble = true;
    e.returnValue  = true;
    if (e.preventDefault)  e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.setAttribute)    e.setAttribute('eventProcessed', 'true');
  }
  catch (e) {
  }
  return false;
}

function setInnerHtml(div, text) {
// write in child with id = "content" if it exists.
  var contentDiv = getChildById(div, "content");
  if(contentDiv != null)
	div = contentDiv;

  if (Popup.ns4) {
    div.document.open();
    div.document.write(text);
    div.document.close();
  }
//  else if (Popup.ns6) {
//    var r = div.ownerDocument.createRange();
//    r.selectNodeContents(div);
//    r.deleteContents();
//    var df = r.createContextualFragment(text);
//    div.appendChild(df);
//  }
  else {
    div.innerHTML = '';
    //  hack to remove current div dimensions, otherwise div will not auto-adjust to the text inserted into it (hack needed at least in firefox 1.0)
    div.style.width  = null;
    div.style.height = null;
    // insert html fragment
    div.innerHTML = text;
  }
}

/**
 * Used in FrequencyPropertyEditor (e.g. for Scheduled Report)
 */
function showRecurrencePanel(formName, propertyName) {
  var form     = document.forms[formName];
  var elements = form.elements[propertyName + '_recur'];

  if (elements[0].checked == true) {
    document.getElementById('frequencyStartEndBlock').style.display = 'none';
  }
  else {
    document.getElementById('frequencyStartEndBlock').style.display = 'inline';
  }
  for (var i=0; i<5; i++) {
    if (elements[i].checked == true) {
      for (var j=0; j<5; j++) {
        if (j != i) {
          document.getElementById(elements[j].value + 'Block').style.display = 'none';
        }
      }
      document.getElementById(elements[i].value + 'Block').style.display = 'inline';
      return;
    }
  }
}

/**
 *
 */
function initCalendarsFromTo(div, formName, fromDateField, toDateField) {
  var contents =  "<script>" +
                  "var _init_from = { " +
                  "      'formname' : '" + formName + "', " +
                  "      'dataformat' : 'M-d-Y', " +
                  "      'replace' : true, " +
                  "      'selected', new Date(), " +
                  "      'watch', true, " +
                  //"      'controlname' : '" + fromDateField + "' "
                  "};" +

                  "var _init_to = { " +
                  "      'formname' : '" + formName + "', " +
                  "      'dataformat' : 'M-d-Y', " +
                  "      'replace' : true, " +
                  "      'selected', new Date(), " +
                  "      'watch', true, " +
                  //"      'controlname' : '" + toDateField + "' "
                  "};" +

                  "var from    = new calendar(_init_from, CAL_TPL1, " + "fromDateField);" +
                  "var to      = new calendar(_init_to,   CAL_TPL1, " + "toDateField);" +
                  "</script>";
  div.setInnerHtml(contents);
}


/**
 * cross-browser way to get text inside tag (like inside span)
 */
function getTextContent(elm) {
  var text = null;

  if (!elm)
    throw new Error("parameter is null");

  if (typeof elm.textContent != "undefined") {                // W3C DOM Level 3
    text = elm.textContent;
  }
  else if (elm.childNodes && elm.childNodes.length) {         // W3C DOM Level 2
    var t = '';
    for (var i = elm.childNodes.length; i--;) {
      var o = elm.childNodes[i];
      if (o.nodeType == 1 || o.nodeType == 3) { // ELEMENT_NODE or TEXT_NODE
        if (o.nodeValue)
          t = o.nodeValue + t;
      }
      else
        t = getTextContent(o) + t;
    }
    text = t == '' ? null : t;
  }
  else if (typeof elm.innerText != "undefined") {             // proprietary: IE4+
    text = elm.innerText;
  }
  return text;
}

/**
 * Utility that discovers the actual html element which generated the event
 * If handler is on table and click was on td - it returns td
 */
function getEventTarget(e) {
  e = getDocumentEvent(e); if (!e) return null;
  if (e.target)
    return e.target;
  else
    return e.srcElement;
}

/**
 * Utility that discovers the html element on which this event is firing
 * If handler is on table and click was on td - it returns table
 */
function getTargetElement(e) {
  e = getDocumentEvent(e); if (!e) return null;
  var elem;
  var elem1 = e.target;
  if (e.target) {
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
  }

  return elem;
}

//* Because of event bubbling mousing over the link inside a div will send a mouseout for the enclosing div
//* So we need to discard such events - return null in this case;
function getMouseOutTarget(e) {
  var tg = getTargetElement(e);
  return tg;

  /* stopped running the code below since reltg.tagName gives permission exception in FF (when mousing over the Filter area)
  if (!tg)
    return null;
  var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement; // ignore event if element to which mouse has moved is a child of a target element
  if (!reltg)
    return tg;
  while (reltg != tg && reltg.tagName && reltg.tagName != 'BODY')
    reltg = reltg.parentNode;
  if (reltg == tg)
    return null;
  return tg;
  */
}

//* Because of event bubbling mousing over the link inside a div will send a mouseover for this div
//* So we need to discard such events - return null in this case;
function getMouseOverTarget(e) {
  var tg = getTargetElement(e);
  if (!tg)
    return null;
  return tg;

  /*
  var reltg = (e.relatedTarget) ? e.relatedTarget : e.toElement; // ignore event if element to which mouse has moved is a child of a target element
  if (!reltg)
    return tg;
  while (reltg != tg && reltg.nodeName != 'BODY')
    reltg = reltg.parentNode;
  if (reltg == tg)
    return null;
  return tg;
  */

  /*
  // only interested in direct events, not those that bubble up
  if (!tg.attachEvent && this && this.contains && this.contains(tg)) {
    alert("canceling mouseover");
    return null;
  }
  else
    return tg;
  */
}

function checkAll(formName) {
  var form = document.forms[formName];
  var fields = form.elements;
  var checkAll = form.elements["-checkAll"];
  var isChecked = checkAll.checked == true;
  for (var i=0; i<fields.length; i++) {
    var type  = fields[i].type;
    if (type  &&  type.toUpperCase() == "CHECKBOX") {
      if (isChecked)
        fields[i].checked = true;
      else
        fields[i].checked = false;
    }
  }
}

function checkAllInGroup(e, divId) {
  var div = document.getElementById(divId);
  var fields = div.getElementsByTagName('input');

  var groupField = getTargetElement(e);
  var isChecked  = groupField.checked;
  for (var i=1; i<fields.length; i++) {
    var type  = fields[i].type;
    if (type  &&  type.toUpperCase() == "CHECKBOX") {
      if (isChecked)
        fields[i].checked = true;
      else
        fields[i].checked = false;
    }
  }
}

// returns a child of any nesting.
function getChildById(parent, id) {
	if(parent.id == id)
		return parent;
	var children = parent.childNodes;
	var len = children.length;
	if(len == 0)
		return null;
	for(var i = 0; i < len; i++) {
		if(children[i].childNodes.length != 0) {
			var reqChild = null;
			if((reqChild = getChildById(children[i], id)) != null)
				return reqChild;
		}
		if(children[i].id == id)
			return children[i];
	}
	return null;
}

function getAncestorById(child, id) {
	if(child.id == id)
		return child;
	var parent;
	while((parent = child.parentNode) != null) {
		if(parent.id == id)
			return parent;
		child = parent;
	}
	return null;
}

//*********************************** Icon/Image effects **************************************
var lowOpacity  = 60;
var highOpacity = 100;
var browserDetect;
var timeouts = new Array();

function unfadeOnMouseOut(e) {
  var target = getMouseOutTarget(e);
  if (!target) {
    target = getTargetElement(e);
    //alert("unfade canceled for: " + target + ", id: " + target.id + ", target.tagName: " + target.tagName);
    return false;
  }

  return unfade(target);
}

function unfadeOnMouseOver(e) {
  var target = getMouseOverTarget(e);
  if (!target) {
    target = getTargetElement(e);
    //alert("unfade canceled for: " + target + ", id: " + target.id + ", target.tagName: " + target.tagName);
    alert("unfade canceled: e.target: " + e.target + ", e.srcElement: " + e.srcElement + ", e.currentElement: " + e.currentElement);
    return false;
  }

  return unfade(target);
}

function fadeOnMouseOver(e) {
  var target = getMouseOverTarget(e);
  if (!target)
    return true;

  return fade(target);
}

function fadeOnMouseOut(e) {
  var target = getMouseOutTarget(e);
  if (!target)
    return false;

  return fade(target);
}

function unfade(target) {
  if (!target)
    return false;

  if (!target.id || target.id == '')
    return false;
  //alert("highlighting: " + target.id);
  browserDetect = target.filters? "ie" : typeof target.style.MozOpacity=="string"? "mozilla" : "";

  var timeout = timeouts[target.id];
  if (timeout) {
    clearTimeout(timeout);
    timeouts[target.id] = null;
  }
  timeout = setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
  timeouts[target.id] = timeout;
}


function fade(target) {
  if (!target)
    return false;

  if (!target.id || target.id == '')
    return false;

  browserDetect = target.filters? "ie" : typeof target.style.MozOpacity=="string"? "mozilla" : "";
  var timeout = timeouts[target.id];
  if (timeout) {
    clearTimeout(timeout);
    timeouts[target.id] = null;
  }
  timeout = setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
  timeouts[target.id] = timeout;
}

function incrementallyChangeOpacity(targetId, fade) {
  var target = document.getElementById(targetId);
  if (target == null)
    return;
  var targetOpacity = fade ? lowOpacity : highOpacity;
  var opacityChangeStep = 10.0;

  if (browserDetect == "mozilla") {
    targetOpacity  = fade ? lowOpacity / 100.0 : (highOpacity - 1) / 100.0;
    opacityChangeStep /= 100.0;
    if (target.style.MozOpacity == null || isNaN(parseFloat(target.style.MozOpacity))) {
      target.style.MozOpacity = fade ? (highOpacity - 1) / 100.0 : lowOpacity / 100.0;
    }

    if (fade) {
      if (target.style.MozOpacity > targetOpacity) {
        target.style.MozOpacity = parseFloat(target.style.MozOpacity) - opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
      }
    }
    else {
      if (target.style.MozOpacity < targetOpacity) {
        target.style.MozOpacity = parseFloat(target.style.MozOpacity) + opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
      }
    }
  }
  else if (browserDetect == "ie") {
    if (target.filters == null || target.filters.alpha == null)
      return;
    if (target.filters.alpha.opacity == null) {
      target.filters.alpha.opacity = fade ? highOpacity : lowOpacity;
    }
    if (fade) {
      if (target.filters.alpha.opacity > targetOpacity ) {
        target.filters.alpha.opacity -= opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', true)", 50);
      }
    }
    else {
      if (target.filters.alpha.opacity < targetOpacity) {
        target.filters.alpha.opacity += opacityChangeStep;
        setTimeout("incrementallyChangeOpacity('" + target.id + "', false)", 50);
      }
    }
  }
}

function createUrlForBacklink(formName, prop) {
  var form = document.forms[formName];
  var url = "smartPopup?";

  var formAction = form.elements['-$action'].value;
  if (!formAction)
    url += "-$action=" + formAction;
  var url = "smartPopup?urlForBacklink=y&prop=" + prop;
  var param = getFormFilters(form, true);
  url += param + "&type=" + form.elements['type'].value;
  document.location.href = url; // load data from server into iframe
}

function changeCurrentStyle(target, idName) {
  var curActiveImg = document.getElementById(idName);
  curActiveImg.id='';
  target.id = idName;

  var td = getTdNode(curActiveImg);
  td.className = 'box';
  var td1 = getTdNode(target);
  td1.className = 'redbox';
  var a = document.getElementById('a_currentImage');
  td1 = getTdNode(td1);
  var thisA = td1.getElementsByTagName('a');
  if (thisA  &&  thisA.length)
    a.href = thisA[0].href;
}

function getTdNode(elem) {
  var e;
  var elem_ = elem;
  if (elem.length > 1)
    elem_ = elem[0];
  if (elem_.tagName.toUpperCase() == 'TD')
    return elem;
  e = elem_.parentNode;
  if (e)
    return getTdNode(e);
  else
    return null;
}

var hotspot1;

function largeImageOnLoad(e) {
  Popup.open('gallery', hotspot1, null, 0, 19);
  return true;
}

function showLargeImage(e, current, largeImageUrl) {
  if (!largeImageUrl) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);

    var thumbnailUrl = target.src;
    var idx = thumbnailUrl.lastIndexOf('.');
    var file = thumbnailUrl.substring(0, idx);
    var ext  = thumbnailUrl.substring(idx);
    var idx1 = file.lastIndexOf('_');
    var file1 = file.substring(0, idx);
    largeImageUrl = file1 + '_image' + ext;

	  var div = document.getElementById('gallery');
	  var img = document.getElementById('galleryImage');
	  hotspot1 = target;
	  addEvent(img, 'load',  largeImageOnLoad,  false);
	  img.src = "";
	  img.src = largeImageUrl;
	  return true;
  }

  var div = document.getElementById('gallery');
  var img = document.getElementById('galleryImage');
  img.src = "";

  if (div.style.display == "block") {
    div.style.display = "none";
    // img.src always has host in it; largeImageUrl not always that is why using indexOf
    if (img.src.indexOf(largeImageUrl) == img.src.length - largeImageUrl.length) {
      img.src = "";
      return false;
    }
  }
  // se the title text
  var titleObj = getChildById(gallery, "titleBar");
  if(titleObj != null) {
	var idx1 = largeImageUrl.lastIndexOf("/");
	var idx2 = largeImageUrl.indexOf("_image", idx1); // always suffix "_image"
	var fileName = largeImageUrl.substring(idx1 + 1, idx2);
	titleObj.innerHTML = fileName;
  }


  hotspot1 = current;
  addEvent(img, 'load',  largeImageOnLoad,  false);
  img.src = largeImageUrl;
  return true;
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

function hide(target) {
  if (typeof target == 'string')
    target = document.getElementById(target);
  target.style.display = "none";
  return false;
}

function addAndShow(td, e) {
  e = getDocumentEvent(e);
  if (!e)
    return stopEventPropagation(e);

  var a = td.getElementsByTagName("a");

//	  iframe.style.display    = "none";

  var anchor = a[0].href;
  return addAndShow1(anchor, e);
}

var calendarCell; // last cell on which user clicked
var lastPopupRowTD = null;

function addCalendarItem(popupRowAnchor, event, contactPropAndIdx) {
  var td = getEventTarget(event);
  //--- extract parameters specific for popup row
  var popupRow = getTrNode(td); // get tr on which user clicked in popup
  if (!popupRow)
    throw new Error("addCalendarItem: popup row not found for: " + anchor);
  if (popupRow.className == 'menuTitle')
    return stopEventPropagation(event);
  if (lastPopupRowTD) {
    alert("Please wait till previous request is processed");
    return stopEventPropagation(event);
  }

  lastPopupRowTD = td;

  var calendarRow = getTrNode(calendarCell);
  if (!calendarRow)
    throw new Error("addCalendarItem: calendar row not found for: " + anchor);

  var anchors = calendarCell.getElementsByTagName('a')
  var anchor;
  if (anchors != null  &&  anchors.length > 0)
    anchor = anchors[0].href;
  else {
    anchor = "ticket?availableDuration="; //anchors[0].href; // url of the servlet that adds calendar items
    var tdId = calendarCell.id;
    var idx = tdId.indexOf(":");
    anchor += tdId.substring(idx + 1);
  }

//  if (anchor.indexOf("?") != anchor.length - 1)
    anchor += "&";

  var popupRowId = popupRow.id;
  var ampIdx = popupRowId.indexOf("&");
  var procedureIdx = parseInt(popupRowId.substring(0, ampIdx));
  var duration = parseInt(popupRowId.substring(ampIdx + 1));
  anchor += procedurePropName + "=" + procedures[procedureIdx] + "&duration=" + duration;

  //--- extract parameters specific for calendar row (e.g. time slot) for a cell on which user clicked
  // popupRow == calendarRow when click came from the schedule cell because value corresponding to popup value already known.
  var contactId;
  if (popupRow == calendarRow) {
    contactId = forEmployee + "=" + employees[contactPropAndIdx.substring(pos + 1)];
  }
  else  {
    anchor += '&' + calendarRow.id;
    var contactDiv = getDivNode(popupRow);
    //--- extract a contact corresponding to a poped up chooser
    if (!contactDiv)
      throw new Error("addCalendarItem: contactDiv not found for: " + anchor);
    if (!contactDiv.id) {
      while (contactDiv  &&  !contactDiv.id) {
        var parentNode = contactDiv.parentNode;
        while (parentNode  &&  (parentNode.tagName.toUpperCase() != 'DIV' || !parentNode.id))
          parentNode = parentNode.parentNode;
        if (!parentNode)
          throw new Error("addCalendarItem: contactDiv not found for: " + anchor);
        contactDiv = parentNode;
      }
    }
    var contactDivId = contactDiv.id;
    var cidx = contactDivId.indexOf(".");
    contactId = forEmployee + "=" + employees[parseInt(contactDivId.substring(cidx + 1))];
  }
  anchor += '&' + contactId;

  //--- collect parameters common to all calendar items on the page
  var pageParametersDiv = document.getElementById('pageParameters');
  if (!pageParametersDiv)
    throw new Error("addCalendarItem: pageParameters div not found for: " + anchor);
  var pageParams = pageParametersDiv.getElementsByTagName('a');
  if (!pageParams || pageParams.length == 0)
    throw new Error("addCalendarItem: pageParameters are empty for: " + anchor);
  for (var i=0; i<pageParams.length; i++)
    anchor += '&' + pageParams[i].id;

  var se = stopEventPropagation(event);
/*
  if (lastPopupRowAnchor == anchor) {
    alert("Please wait till previous request is processed");
    return stopEventPropagation(event);
  }
  lastPopupRowAnchor = anchor;
*/

  document.location.href = anchor;
  return se;
//  return addAndShow1(anchor, event);
}

function showAlert(alertName) {
  var blockReleaseDiv = document.getElementById('blockReleaseParameters');
  if (!blockReleaseDiv)
    throw new Error("showExpired: blockReleaseParameters div not found for: " + anchor);
  var brParams = blockReleaseDiv.getElementsByTagName('a');
  if (!brParams || brParams.length == 0)
    throw new Error("showExpired: blockReleaseParameters are empty for: " + anchor);
  for (var i=0; i<brParams.length; i++) {
    var alertId = brParams[i].id;
    if (alertId.indexOf(alertName + "=") == 0) {
      alert(alertId.substring(alertName.length + 1))
      break;
    }
  }
}

function addSimpleCalendarItem(event) {
  var td = getEventTarget(event);
  var calendarRow = getTrNode(calendarCell);
  if (!calendarRow)
    throw new Error("addCalendarItem: calendar row not found for: " + anchor);
  //--- extract parameters specific for popup row
  var calendarTd = getTdNode(calendarCell);

  var popupRow = getTrNode(td); // get tr on which user clicked in popup
  if (!popupRow)
    throw new Error("addSimpleCalendarItem: popup row not found for: ");

  if (popupRow.className == 'menuTitle')
    return stopEventPropagation(event);
  var anchor = "mkResource.html?-$action=mkResource&type=http://www.hudsonfog.com/voc/model/work/CalendarItem&submit=Please+wait&";
  var calendarRowId = calendarRow.id;
  var idx = calendarRowId.indexOf("=");
  calendarRowId = calendarRowId.substring(0, idx);
  var popupRowId = popupRow.id;
  var durationIdx = popupRowId.indexOf("=");
  var durationProp = popupRowId.substring(0, durationIdx);
  var minutes = parseInt(popupRowId.substring(durationIdx + 1));
  anchor += durationProp + "=inlined&" + durationProp + ".seconds=" + minutes + "&" + durationProp + ".durationType=" + encodeURIComponent("minute(s)");
  //--- extract a contact corresponding to a poped up chooser
  var contactDiv = getDivNode(popupRow);
  if (!contactDiv)
    throw new Error("addCalendarItem: contactDiv not found for: " + anchor);
  if (!contactDiv.id) {
    while (contactDiv  &&  !contactDiv.id) {
      var parentNode = contactDiv.parentNode;
      while (parentNode  &&  (parentNode.tagName.toUpperCase() != 'DIV' || !parentNode.id))
        parentNode = parentNode.parentNode;
      if (!parentNode)
        throw new Error("addCalendarItem: contactDiv not found for: " + anchor);
      contactDiv = parentNode;
    }
  }
  var contactDivId = contactDiv.id;
  var idx = contactDivId.indexOf(".");
  var employeeIdx = parseInt(contactDivId.substring(idx + 1));
  anchor += '&' + employeeCalendarItem + "_select=" + resourceCalendars[employeeIdx];
  var blockReleaseDiv = document.getElementById('blockReleaseParameters');
  if (!blockReleaseDiv)
    throw new Error("addCalendarItem: blockReleaseParameters div not found for: " + anchor);
  var brParams = blockReleaseDiv.getElementsByTagName('a');
  if (!brParams || brParams.length == 0)
    throw new Error("addCalendarItem: blockReleaseParameters are empty for: " + anchor);
  for (var i=0; i<brParams.length; i++) {
    if (brParams[i].id.indexOf(".propToSet=") == -1) {
//      anchor += '&' + brParams[i].id;
      continue;
    }

    var idx1 = brParams[i].id.indexOf(".propToSet=");
    var idx2 = brParams[i].id.indexOf("&", idx1);
    var propToSet = brParams[i].id.substring(idx1 + 11, idx2);
    var value = calendarTd.className;
    var v = 'Available';
    if (value  &&  value == 'a')
      v = 'Busy';
    anchor += '&' + brParams[i].id.substring(0, idx1) + brParams[i].id.substring(idx2) + '&.' + propToSet + '=' + v;
    var idx = brParams[i].id.indexOf("=frequency");
    var frequencyPropName = brParams[i].id.substring(0, idx);
    idx = frequencyPropName.lastIndexOf("&");
    frequencyPropName = frequencyPropName.substring(idx + 1);
    var start = calendarRowId.substring(0, idx);
    idx = start.indexOf("+");
    var startDate = start;
    if (idx != -1)
      startDate = start.substring(0, idx);
    anchor += "&" + frequencyPropName + "_recur=once&" + frequencyPropName + "_start_once=" + startDate;
    if (idx != -1) {
      var idx1 = start.indexOf(":", idx);
      if (idx1 != -1) {
        anchor += "&" + frequencyPropName + "_hour_once=" + start.substring(idx + 1, idx1) +
                  "&" + frequencyPropName + "_min_once=" + start.substring(idx1 + 1);
      }
    }
  }


  //--- collect parameters common to all calendar items on the page
  var pageParametersDiv = document.getElementById('pageParameters');
  if (!pageParametersDiv)
    throw new Error("addCalendarItem: pageParameters div not found for: " + anchor);
  var pageParams = pageParametersDiv.getElementsByTagName('a');
  if (!pageParams || pageParams.length == 0)
    throw new Error("addCalendarItem: pageParameters are empty for: " + anchor);
  for (var i=0; i<pageParams.length; i++) {
    if (pageParams[i].id.indexOf("type=") == 0)
      continue;
    anchor += '&' + pageParams[i].id;
  }

  document.location.href = anchor;
  return stopEventPropagation(event);
//  return addAndShow1(anchor, event);
}

function addAndShow1(anchor, event) {
  var hotspot = getTargetElement(event);
  var iframeId = "resourceList";
  var iframe = document.getElementById(iframeId);
  try {
    var iframeWindow = frames[iframeId];
    var newUri = anchor;
    var q = anchor.indexOf('?');
    var params;
    if (q != -1) {
      params = anchor.substring(q + 1) + "&";
      newUri = anchor.substring(0, q);
    }
    else
      params = "";
    params += "hideComments=y&hideMenuBar=y&hideNewComment=y&hideHideBlock=y";  // skip all navigation blocks

    var aa = document.getElementById("currentItem");
    if (aa) {
      var currentItem = aa.href;
      if (currentItem.indexOf("about") == -1) {
        var idx = anchor.indexOf("-propToSet=");
        var idx1 = anchor.indexOf("&", idx);
        if (idx != -1) {
          var shortProp;
          if (idx1 == -1)
            shortProp = "." + anchor.substring(idx + 11);
          else
            shortProp = "." + anchor.substring(idx + 11, idx1);
          var encCurrentItem = encodeURIComponent(currentItem);
          params += "&" + shortProp + "_select=" + encCurrentItem + "&" + shortProp + "_verified=y";
          params += "&-currentItem=" + encCurrentItem;
        }
      }
    }

    if (params.indexOf("$returnUri=") == -1) {
       var div = document.getElementById(iframeId + "_div");
      var tag = div.getElementsByTagName('a');
      if (tag.length) {
        var retUri = tag[0].href;
        params += "&$returnUri=" + encodeURIComponent(retUri + "&-addItems=y");
      }
    }
/*
    iframeWindow.location.replace(newUri); // load data from server into iframe
//    window.open(newUri);
//    return;
    setTimeout(addAndShowWait, 50);
*/
    var div = document.createElement('div');
    div.style.display = "none";
    postRequest(newUri, params, div, hotspot, addAndShowWait);
    return stopEventPropagation(event);
  } catch (er) {
    alert(er);
  }
}

function addAndShowWait(body, hotspot, content)	{
  var frameId = "resourceList";
  var body;
  if (!content) {
    var frameBodyId = "siteResourceList";
    if (!frameLoaded[frameId]) {
      setTimeout(addAndShowWait, 50);
      return;
    }
    frameLoaded[frameId] = false;
    var l = document.location;
    var iframe = document.getElementById(frameId);
    var iframeWindow = frames[frameId];
    body = iframeWindow.document.getElementById(frameBodyId);
    if (!body) {
      alert("Warning: server did not return resource list data - check connection to server");
      return;
    }
  }
  else {
    setInnerHtml(body, content);
  }
  var divCopyTo = document.getElementById(frameId + "_div");
  if (!divCopyTo) {
    alert("Warning: target div not found: " + frameId + "_div");
    return;
  }
  var divs = divCopyTo.getElementsByTagName("div");
  var eDiv;
  for (var i=0; i<divs.length; i++) {
    if (divs[i].id && divs[i].id == 'errorMessage') {
      divs[i].innerHTML = '';
      eDiv = divs[i];
      break;
    }
  }
  var bdivs = body.getElementsByTagName("div");
  for (var i=0; i<bdivs.length; i++) {
    if (bdivs[i].id && bdivs[i].id == 'errorMessage') {
      if (bdivs[i].innerHTML) {
        eDiv.innerHTML = bdivs[i].innerHTML;
        return;
      }
    }
  }

  // Find new 'currentItem' anchor and substitute old one with new
  var elms = body.getElementsByTagName('a');
  var currentItem;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      currentItem = elms[j].href;
      break;
    }
  }
  // Find tr that needed to be inserted in the list
  var elms = body.getElementsByTagName('tr');
  var currentTR;
  var resultsTR;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == currentItem) {
      currentTR = elms[j];
      break;
    }
  }
  // Find TR in previous list that was current and change style of the row
  elms = divCopyTo.getElementsByTagName('a');
  var oldCurrentItem;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      oldCurrentItem = elms[j].href;
      elms[j].href = currentItem;
      break;
    }
  }
  var oldCurrentTR;
  elms = divCopyTo.getElementsByTagName('tr');
  if (oldCurrentItem) {
    for (var j=0; j<elms.length; j++) {
      if (elms[j].id  &&  elms[j].id == oldCurrentItem) {
        if (oldCurrentItem == currentItem) {
          var tbody  = elms[j].parentNode;
          oldCurrentTR = elms[j];

          var rowIndex = elms[j].rowIndex;
          tbody.removeChild(elms[j]);
          //copyTableRow(tbody, rowIndex, currentTR);
          if (j == elms.length)
            tbody.appendChild(currentTR);
          else
            tbody.insertBefore(currentTR, elms[j]);
        }
        else
          elms[j].style.backgroundColor = '';
        break;
      }
    }
  }
//  divCopyTo.innerHTML = body.innerHTML;
  var totals;
  var oldResultsTR;
  var totalsTR;
  var resultsTR;
  var headerTR;
  var headerTRidx = 0;
  for (var j=0; j<elms.length; j++) {
    var tr = elms[j];
    if (!tr.id)
      continue;
    if (!oldCurrentTR  &&  tr.id == 'results') {
      var tds = tr.childNodes;
      resultsTR = tr;
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id == 'results') {
          var r = tds[i].innerHTML;
          var idx = r.indexOf('-');
          var idx1 = r.indexOf('<', idx);
          var recs = r.substring(idx + 1, idx1);
          var recsNmb = parseInt(recs) + 1;
          var newInnerHTML = r.substring(0, idx + 1) + recsNmb;
          idx = r.indexOf(recs, idx1);

          newInnerHTML += r.substring(idx1, idx) + recsNmb;
          tds[i].innerHTML = newInnerHTML;
        }
      }
    }
    else if (tr.id == 'totals') {
      totalsTR = tr;
      var tds = tr.getElementsByTagName('td');
      var curTrTds = currentTR.getElementsByTagName('td');
      var oldCurTrTds;
      if (oldCurrentTR)
        oldCurTrTds = oldCurrentTR.getElementsByTagName('td');
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id.indexOf('tot_') == 0) {
          var tot = tds[i].innerHTML;
          var startDigit = -1;
          for (var ii=0; ii<tot.length; ii++) {
            var ch = tot.charAt(ii);
            if (isDigit(ch)) {
              if (startDigit == -1)
                startDigit = ii;
            }
          }
          var total = extractTotalFrom(tot);
          // since first cell of Total tr has colspan=2, the column # in resources TR that referes to the same property will reside in # + 1 column
          var curTotal = extractTotalFrom(curTrTds[i + 1].innerHTML);
          total += parseFloat(curTotal);
          if (oldCurrentTR) {
            var oldTotal = extractTotalFrom(oldCurTrTds[i + 1].innerHTML);
            total -= oldTotal;
          }
//          total = Math.round(total * 100)/100;
          tds[i].innerHTML = tot.substring(0, startDigit) + total;
        }
      }
    }
    else if (!oldCurrentTR  &&  tr.id == 'header') {
      headerTR = tr;
      headerTRidx = j;
      var tbody  = tr.parentNode;
      var trElms = tbody.childNodes;
      var pos = 1;
      for (var ii=0; ii<trElms.length; ii++) {
        if (trElms[ii].id == 'header')
          break;
        else
          pos++;
      }
      //var newTr = document.importNode(currentTR, true);
//      copyTableRow(tbody, pos, currentTR);
      if (pos == trElms.length)
        tbody.appendChild(currentTR);
      else
        tbody.insertBefore(currentTR, trElms[pos]);
    }
  }
  // This is the first element in RL. That means that 'Total' line was not formed
  if (oldCurrentItem != currentItem && (!totalsTR || !resultsTR)) {
    var elms = body.getElementsByTagName('tr');
    for (var j=0; j<elms.length; j++) {
      var tr = elms[j];
      tbody = headerTR.parentNode;
      if (!totalsTR && tr.id == 'totals')
        tbody.appendChild(tr);
      else if (!resultsTR && tr.id == 'results') {
        var cells = tr.getElementsByTagName('td');
        var cellsNmb = cells.length;
        var headerCols = headerTR.getElementsByTagName('td').length;
        if (cellsNmb != headerCols)
          cells[0].colSpan = headerCols - cellsNmb + 1;
        tbody.insertBefore(tr, headerTR);
      }
    }
  }
  //resourceListEdit(divCopyTo);
  var images = divCopyTo.getElementsByTagName('img');
  for (var i=0; i<images.length; i++) {
    addBooleanToggle(images[i]);
  }
  interceptLinkClicks(divCopyTo);
}
function extractTotalFrom(tot) {
  var ii = 0;
  var dot = -1;
  var startDigit = -1;
  var endDigit = tot.length;
  for (; ii<tot.length; ii++) {
    var ch = tot.charAt(ii);
    if (isDigit(ch)) {
      if (startDigit == -1)
        startDigit = ii;
    }
    else if (startDigit == -1)
      continue;
    else if (dot != -1) {
      endDigit = ii;
      break;
    }
    else if (ch == '.')
      dot = ii;
  }
  var total = 0;
  if (startDigit != -1)
    total = parseFloat(tot.substring(startDigit, endDigit));
  return total;
}
function isDigit(num) {
  if (num.length > 1)
    return false;
  var string="1234567890";
  if (string.indexOf(num)!=-1)
    return true;
  return false;
}
function processTransaction(e) {
  var target = getTargetElement(e);
  if (!target)
    return;
  var form = target.form;
  var params = getFormFilters(form, true);
  var url = "FormRedirect?JLANG=en" + params; // HACK: since form.action returns the value of '&action='
  url += "&-applet=y";

  var w     = 400;
  var h     = 400;
  var top   = 100;
  var left  = 100;
  window.open(url, 'Transaction','width=' + w + ',height=' + h + ',top=' + top + ',left=' + left + ', menubar=no, status=0, location=no, toolbar=no, scrollbars=no, status=no, resizable=yes');
  return stopEventPropagation(e);
}

function showDiv(e, td, hideDivId) {
  e = getDocumentEvent(e);
  var div = document.getElementById(hideDivId);
  div.style.visibility = Popup.HIDDEN;
  div.style.display = "none";
  var divId = 'div_' + td.id;
  div = document.getElementById(divId);
  div.style.visibility = Popup.VISIBLE;
  div.style.display = 'inline';
}

function showTab(e, td, hideDivId, unhideDivId) {
  e = getDocumentEvent(e);

  var isViewAll = td.id == 'viewAll';
  if (hideDivId  &&  hideDivId.length != 0) {
    var tokens = hideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      div.style.visibility = Popup.HIDDEN;
      div.style.display = "none";
      var tdId = tok.substring(4);
      var hideTD = document.getElementById(tdId);
      var ht = hideTD.getElementsByTagName("table");
      if (ht.length != 0  &&  ht[0].className == "currentCpTabs")
        ht[0].className = "cpTabs";
      if (!isViewAll  &&  tt != null) {
        tt = document.getElementById('cp_' + tdId);
        if (tt != null)
          tt.className = "currentTabTitleHidden";
      }
    }
    var tt = document.getElementById('cp_' + td.id);
    if (tt != null)
      tt.className = "currentTabTitleHidden";
  }

  if (unhideDivId  &&  unhideDivId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var div = document.getElementById(tokens[i]);
      div.style.visibility = Popup.VISIBLE;
      div.style.display = 'inline';
      var tdId = tokens[i].substring(4);
      var uTD = document.getElementById(tdId);
      var uTable = uTD.getElementsByTagName("table");
      if (uTable.length != 0  &&  uTable[0].className == "currentCpTabs")
        uTable[0].className = "cpTabs";
      if (isViewAll) {
        var tt = document.getElementById('cp_' + tdId);
        tt.className = "currentTabTitle";
      }
    }

  }
  var divId = 'div_' + td.id;
  div = document.getElementById(divId);
  div.style.visibility = Popup.VISIBLE;
  div.style.display = 'inline';

  var t = td.getElementsByTagName("table");
  if (t.length != 0  &&  t[0].className == "cpTabs")
    t[0].className = "currentCpTabs";

  if (isViewAll) {
    var tr = document.getElementById(tokens.length + 'cp');
    if (tr != null)
      tr.className = "currentTabTitle";
  }

  execJS.runDivCode(div);

  return stopEventPropagation(e);
}

function showRows(e, td, hideRowsId, unhideRowsId) {
  e = getDocumentEvent(e);

  var isViewAll = td.id == 'viewAll';
  if (hideRowsId  &&  hideRowsId.length != 0) {
    var tokens = hideRowsId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var rowgroup = document.getElementById(tokens[i]);
      rowgroup.style.visibility = 'collapse';
      var tdId = tokens[i].substring(4);
      var hideTD = document.getElementById(tdId);
      var ht = hideTD.getElementsByTagName("table");
      if (ht.length != 0  &&  ht[0].className == "currentCpTabs")
        ht[0].className = "cpTabs";
      if (!isViewAll  &&  tt != null) {
        tt = document.getElementById('cp_' + tdId);
        if (tt != null)
          tt.className = "currentTabTitleHidden";
      }
    }
    var tt = document.getElementById('cp_' + td.id);
    if (tt != null)
      tt.className = "currentTabTitleHidden";
  }

  if (unhideRowsId  &&  unhideRowsId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var rowgroup = document.getElementById(tokens[i]);
      rowgroup.style.visibility = 'visible';
      var tdId = tokens[i].substring(4);
      var uTD = document.getElementById(tdId);
      var uTable = uTD.getElementsByTagName("table");
      if (uTable.length != 0  &&  uTable[0].className == "currentCpTabs")
        uTable[0].className = "cpTabs";
      if (isViewAll) {
        var tt = document.getElementById('cp_' + tdId);
        tt.className = "currentTabTitle";
      }
    }

  }
  var rowgroupId = 'div_' + td.id;
  rowgroup = document.getElementById(rowgroupId);
  rowgroup.style.visibility = Popup.VISIBLE;
  rowgroup.style.display = 'inline';

  var t = td.getElementsByTagName("table");
  if (t.length != 0  &&  t[0].className == "cpTabs")
    t[0].className = "currentCpTabs";

  if (isViewAll) {
    var tr = document.getElementById(tokens.length + 'cp');
    if (tr != null)
      tr.className = "currentTabTitle";
  }
  return stopEventPropagation(e);
}

function hideInnerDiv(e) {
  var pane2        = document.getElementById('pane2');
  var dialogIframe = document.getElementById('dialogIframe');
  setDivInvisible(pane2, dialogIframe);
  return stopEventPropagation(e);
}

function openPopup1(divId1, alertName, hotSpot, e) {
  if (e.ctrlKey)  // ctrl-enter
    showAlert(alertName);
  else
    openPopup(divId1, null, hotSpot, e);
}

function openPopup(divId1, divId2, hotSpot, e, maxDuration) {
  if (divId2 != null) {
    if (resourceCalendars[divId2] == null)
      divId2 = null;
    else
      divId2 = "a." + divId2;
  }
//  alert('divId1=' + divId1 + ', divId2=' + divId2 + ', hotSpot=' + hotSpot + ',  e=' + e + ', maxDuration=' + maxDuration);
  if (e.ctrlKey)  {// ctrl-enter
    if (!maxDuration) {
      Popup.open(divId2, hotSpot);
      return stopEventPropagation(e);
      return;
    }
    var div = document.getElementById(divId2);
    var tables = div.getElementsByTagName("table");
    var table;
    for (var i=0; i<tables.length && !table; i++) {
      if (tables[i].id  &&  tables[i].id.indexOf("table_") == 0)
        table = tables[i];
    }
    var trs = table.getElementsByTagName('tr');
    var trLen = trs.length;
    for (var i=1; i<trLen; i++) {
      var tr = trs[i];
//      var anchor = tr.getElementsByTagName('a');
//      var s = anchor[0].innerHTML;
      var s = tr.id;

      var idx = s.indexOf("=");
      s = s.substring(idx + 1);
      if (parseInt(s) > maxDuration) {
        tr.style.visibility = Popup.HIDDEN;
        tr.style.display = "none";
      }
      else {
        tr.style.visibility = Popup.VISIBLE;
        tr.style.display = "";
      }
    }
    Popup.open(divId2, hotSpot);
  }
  else {
    if (divId1 != null)
      Popup.open('e.' + divId1, hotSpot);
  }
  calendarCell = hotSpot;
  return stopEventPropagation(e);
//  return false;
}

function getDocumentEvent(e) {
  if (e) return e;
  if (!window) return null;
  if (window.event)
    return window.event;
  else
    return null;
}

function setCurrentItem (event, tr) {
  tr.style.backgroundColor = '#F5ABE6';
  var aa = document.getElementById('currentItem');
  if (!aa)
    return;
  if (aa.href != tr.id) {
    var elm = document.getElementById(aa.href);
    if (elm == null)
      return;
    var cName = elm.className;
    if (cName)
      elm.style.backgroundColor = '';
    else
      elm.style.backgroundColor = 'white';

    aa.href = tr.id;
  }
  var div = document.getElementById('keyboard');
  if (!div)
    return;

  var form = div.getElementsByTagName('form');
  var forum = form[0].elements['.forum_select'];
  forum.value = tr.id;
}

function addAndShowItems(tr, e) {
  e = getDocumentEvent(e);
  if (!e)
    return stopEventPropagation(e);
  var anchor = "mkResource.html?-$action=mkResource&type=http://www.hudsonfog.com/voc/model/portal/Comment&submit=Please+wait&.forum_verified=y&";
  var form = document.getElementById('filter');
  var forum = form.elements[".forum_select"].value;
  var title = form.elements[".title"].value;
  var href = document.location.href;
  var idx = href.indexOf("?");
  anchor += "&.forum_select=" + encodeURIComponent(forum) + "&.title=" + encodeURIComponent(title) + "&$returnUri=";

  var idx1 = href.indexOf("-currentItem=");

  if (idx1 == -1)
    anchor += encodeURIComponent("localSearchResults.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1));
  else {
    var idx2 = href.indexOf("&", idx1);
    anchor += encodeURIComponent("localSearchResults.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1, idx1) + href.substring(idx2));
  }

  return addAndShow1(anchor, e);
}
function printReceipt(url) {
  var tr = document.getElementById(url);
  if (!tr)
    return;
  var ul = tr.getElementsByTagName("ul");
  if (!ul)
    return;
  var li = ul[0].getElementsByTagName("li");
  if (li.length) {
    var appl = document.applets[0];
    appl.open();
    for (i=0; i<li.length; i++)
      appl.println(li[i].innerHTML);
    appl.close();
  }
}

var menuGroupDiv;
function showKeyboard() {
  var kdiv = document.getElementById('keyboard');
  if (!kdiv)
    return;
  var divs = document.getElementsByTagName('div');
  for (var i=0; i<divs.length; i++) {
//    if (divs[i].id == "div_Vodka")
//      alert(divs[i].style.display + "; " + divs[i].style.visibility);

    if (divs[i].style.display == 'none')
      continue;
    if (divs[i].id  &&  divs[i].id.indexOf('div_') == 0) {
      menuGroupDiv = divs[i];
      menuGroupDiv.style.display = 'none';
      break;
    }
  }
  kdiv.style.display = 'inline';
}

// usage:
// insertAtCursor(document.formName.fieldName, ?this value?);
function insertAtCursor(myField, myValue) {
  //IE support
  if (document.selection) {
    myField.focus();
    sel = document.selection.createRange();
    sel.text = myValue;
  }
  //MOZILLA/NETSCAPE support
  else if (myField.selectionStart || myField.selectionStart == '0') {
    var startPos = myField.selectionStart;
    var endPos = myField.selectionEnd;
    myField.value = myField.value.substring(0, startPos)
    + myValue
    + myField.value.substring(endPos, myField.value.length);
  }
  else {
    myField.value += myValue;
  }
}

function setCaretToEnd (el) {
  if (el.createTextRange) {
    var v = el.value;
    var r = el.createTextRange();
    r.moveStart('character', v.length);
    r.select();
  }
}

/**
 * In the form that has several submit buttons - this is the way we detect which one was clicked
 */
function saveButtonClicked(e) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
  if (!target)
    return true;
  var button = target;
  var form = target.form;
  form.setAttribute("buttonClicked", button.name);
  return true;
}

function setDivVisible(div, iframe, hotspot, offsetX, offsetY) {
  var istyle   = iframe.style;
  istyle.visibility    = Popup.HIDDEN;
  div.style.visibility = Popup.HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'
  var scrollXY = getScrollXY();
  var scrollX = scrollXY[0];
  var scrollY = scrollXY[1];

  var left = 100;
  var top  = 100;
  if (hotspot) {
    var coords = getElementCoords(hotspot);
    left = coords.left;
    top  = coords.top;
  }

  var screenXY = getWindowSize();
  var screenX = screenXY[0];
  var screenY = screenXY[1];

  // Find out how close to the corner of the window
  var distanceToRightEdge  = screenX + scrollX - left;
  var distanceToBottomEdge = screenY + scrollY - top;

  // first position the div box in the top left corner in order to measure its dimensions
  // (otherwise, if position coirrectly and only then measure dimensions - the width/height will get cut off at the scroll boundary - at least in firefox 1.0)
  div.style.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
  reposition(div,    0, 0);
  var divCoords = getElementCoords(div);
  var margin = 40;
  //alert(screenX + "," + screenY + ", " + scrollX + "," + scrollY + ", " + left + "," + top + ", " + divCoords.width + "," + divCoords.height);
  // cut popup dimensions to fit the screen
  var mustCutDimension = div.id == 'pane2' ? false: true;
  //var mustCutDimension = false;
  if (mustCutDimension) {
    var xFixed = false;
    var yFixed = false;
    if (divCoords.width > screenX - margin * 2) {
      div.style.width = screenX - margin * 2 + 'px';
      xFixed = true;
      //alert("divCoords.width = " + divCoords.width + ", " + "screenX = " + screenX);
    }
    if (divCoords.height > screenY - margin * 2) { // * 2 <- top & bottom margins
      div.style.height = screenY - margin * 2 + 'px';
      yFixed = true;
      //alert("divCoords.height = " + divCoords.height + ", " + "screenY = " + screenY);
    }
    // recalc coords and add scrolling if we fixed dimensions
    if (typeof div.style.overflowX == 'undefined') {
      if (xFixed || yFixed) {
        div.style.overflow = "auto";
        divCoords = getElementCoords(div);
      }
    }
    else {
	  if(typeof div.style.overflowX != 'undefined') {
		if (xFixed)
			div.style.overflowX = "auto";
		if (yFixed)
			div.style.overflowY = "auto";
	  }
	  else {
		if (xFixed || yFixed)
			div.style.overflow = "auto";
	  }
	  // get div size after scrolling appending
      if (xFixed || yFixed)
        divCoords = getElementCoords(div);
      // reset position of the scrolls (it could be scrolled from prev. using)
      div.scrollLeft = 0;
      div.scrollTop  = 0;
    }
  }
  div.style.display    = 'none';   // must hide it again to avoid screen flicker
  // move box to the left of the hotspot if the distance to window border isn't enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX + scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
    //alert("distanceToRightEdge = " + distanceToRightEdge + ", divCoords.width = " + divCoords.width + ", screenX = " + screenX + ", scrollX = " + scrollX);
    if (left - margin > 0)
      left -= margin; // adjust for a scrollbar;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetX)
      left = left + offsetX;
  }

  // adjust position of the div box vertically - using the same approach as above
  if (distanceToBottomEdge < divCoords.height + margin) {
    top = (screenY + scrollY) - divCoords.height;
//  alert("distanceToBottomEdge = " + distanceToBottomEdge + ", divCoords.height = " + divCoords.height + ", screenY = " + screenY + ", scrollY = " + scrollY);
    if (top < scrollY) {
      top = scrollY;
    }
    if ((top - scrollY)- margin > 0)
      top -= margin; // adjust for a scrollbar;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetY)
      top = top + offsetY;
  }

  // by now the width of the box got cut off at scroll boundary - fix it (needed at least for firefox 1.0)
  div.style.width  = divCoords.width  + 'px';
  div.style.height = divCoords.height + 'px';

  //  Make position/size of the underlying iframe same as div's position/size
  istyle.width     = divCoords.width  + 'px';
  istyle.height    = divCoords.height + 'px';

  var zIndex = 1;
  if (hotspot) {
    var z = hotspot.style.zIndex; // this relative zIndex allows stacking popups on top of each other
    if (z != null && z != '')
      zIndex = z;
  }
  div.style.zIndex = zIndex + 2;
  istyle.zIndex    = zIndex + 1;

  // hack for Opera (at least at ver. 7.54) and Konqueror
  //  somehow iframe is always on top of div - no matter how hard we try to set zIndex
  // so we have to live without iframe
  //var opera     = navigator.userAgent.indexOf("Opera") != -1;
  //var konqueror = navigator.userAgent.indexOf("Konqueror") != -1;
  div.style.display    = 'inline';
  // commented out temporarily since listbox in dialog is not visible
  // this unfortunately will cause a problem with popup over form fields
  //if (document.all)   // only IE has a problem with form elements 'showing through' the popup
  //  istyle.display       = 'inline';
  reposition(div,    left, top); // move the div box to the adjusted position
  reposition(iframe, left, top); // place iframe under div
  //if (!opera && !konqueror) {
  if (document.all)   // only IE has a problem with form elements 'showing through' the popup
    istyle.visibility  = Popup.VISIBLE;
  div.style.visibility = Popup.VISIBLE; // finally make div visible
}

function setDivInvisible(div, iframe) {
  // release a popup (menu) belongs to the hidding div
  PopupHandler.checkHidingDiv(div);
  if (div.style)
    div.style.display    = "none";
  if (iframe && iframe.style)
    iframe.style.display = "none";
}

function doConfirm(msg) {
  /*
  if (document.deleteConfirmation == msg)
    return;
  document.deleteConfirmation = msg;
  */
  var c = confirm(msg);
  if (!c)
    return;

  var loc = document.location.href;

  var idx = loc.lastIndexOf("-$action=");
  if (idx != -1) {
    idx1 = loc.indexOf("&", idx);
    if (idx1 != -1) {
      if (loc.charAt(idx - 1) == '?')
        loc = loc.substring(0, idx) + loc.substring(idx1 + 1);
      else
        loc = loc.substring(0, idx) + loc.substring(idx1);
    }
    else
      loc = loc.substring(0, idx);
  }
  idx = loc.indexOf("?");
  loc = "localSearchResults.html?-$action=deleteAndExplore&del-yes=y&" + loc.substring(idx + 1);
  idx = loc.indexOf("&errMsg=");
  if (idx == -1) {
    idx = loc.indexOf("?errMsg=");
    idx++;
  }

  var idx1 = loc.indexOf("&", idx + 7);
  if (idx1 == -1)
    loc = loc.substring(0, idx)
  else
    loc = loc.substring(0, idx) + loc.substring(idx1);
  document.location.replace(loc);
  return;
}

function setKeyboardFocus(element) {
  element.internalFocus = true;
  try {
    if (element.focus)
      element.focus();
  }
  catch (e) {
  }
}

//**************************************************** AJAX ******************************************
// AJAX request.
// Request content from the server to be loaded into a specified div.
// Uses XMLHttpRequest when possible and hidden iframe otherwise.
//
// Basic ajax technique is described here:
//   http://keelypavan.blogspot.com/2006/01/using-ajax.html
//   http://developer.apple.com/internet/webcontent/xmlhttpreq.html
function postRequest(url, parameters, div, hotspot, callback) {
  this.XMLHTTP = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
  this.newActiveXObject = function(axarray) {
    //  IE5 for the mac claims to support window.ActiveXObject, but throws an error when it's used
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
    if (!this.lastRequest)
      return false;
    switch (this.lastRequest.readyState) {
      // states that indicate request was not completed yet
      case 1: case 2: case 3:
        return true;
      break;
  //     Case 4 and 0
      default:
        return false;
      break;
    }
  }

  var frameId = 'popupFrame';
  var iframe  = document.getElementById('popupIframe');
  var http_request;

  // visual cue that click was made, using the tooltip
  loadingCueStart(hotspot);

  if (typeof XMLHttpRequest != 'undefined' && window.XMLHttpRequest) { // Mozilla, Safari,...
    try {
      http_request = new XMLHttpRequest();
      if (http_request.overrideMimeType) {
        http_request.overrideMimeType('text/xml');
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
    alert('Cannot create XMLHTTP instance, using iframe instead');
    frameLoaded[frameId] = false;
    var iframe = frames[frameId];
    iframe.document.body.innerHTML = '<form method=post action=dummy id=ajaxForm><input type=submit name=n value=v></input> </form>';
    var ajaxForm = iframe.document.getElementById('ajaxForm');
    ajaxForm.action = url;
    ajaxForm.submit();
    // line below is an alternative simpler method to submitting a form - but fails in IE if URL is too long
    // iframe.location.replace(url); // load data from server into iframe
    timeoutCount = 0;
    setTimeout(function () {Popup.load(div)}, 50);
    return;
  }

  if (callInProgress(this.lastRequest))
    this.lastRequest.abort();
  this.lastRequest = http_request;

  http_request.onreadystatechange = function() {
    var status;
    if (http_request.readyState == 4) {
      loadingCueFinish();
      var location;
      try {
        status = http_request.status;
        location = http_request.getResponseHeader('Location');
        var responseXML = http_request.responseXML;
        if (responseXML && responseXML.baseURI)
          url = responseXML.baseURI;
      }
      catch (e) { // hack since mozilla sometimes throws NS_ERROR_NOT_AVAILABLE here
        // deduce status
        if (location)
          status = 302;
        else if (http_request.responseText.length > 10)
          status = 200;
        else
          status = 400;
      }

      if (status == 200 && url.indexOf('FormRedirect') != -1) { // POST that did not cause redirect - it means it had a problem - repaint dialog with err msg
        frameLoaded[frameId] = true;
        callback(div, hotspot, http_request.responseText);
      }
      else if (status == 200) {
        frameLoaded[frameId] = true;
        callback(div, hotspot, http_request.responseText);
      }
      else if (status == 302) {
        if (!location)
          return;
        var repaintDialog = location.indexOf('-inner=')    != -1;   // painting a dialog
        if (repaintDialog) {
          hotspot = null; // second time do not show 'loading...' popup
          postRequest(location, parameters, div, hotspot, callback); // stay on current page and resubmit request using URL from Location header
        }
        else
          document.location = location;  // reload current page - usually happens at login due to timeout
      }
      else if (status == 322) {
        if (!location)
          return;
        var repaintDialog = location.indexOf('-addItems=') != 1;    // adding a new item to the resource list (like in bar or retail)
        if (repaintDialog) {
          hotspot = null; // second time do not show 'loading...' popup
          postRequest(location, parameters, div, hotspot, callback); // stay on current page and resubmit request using URL from Location header
        }
        else
          document.location = location;  // reload current page - usually happens at login due to timeout
      }
    }
    else {
      // other ajax states that we ignore for now: 0-Unintialized, 1-Loading, 2-Loaded, 3-Interactive
    }
  };

  http_request.open('POST', url, true);

  // browser does not allow Referer to be sent - so we send X-Referer and on server make it transparent to apps
  //http_request.setRequestHeader("Referer",      document.location.href);
  http_request.setRequestHeader("X-Referer",     document.location.href);
  http_request.setRequestHeader("X-Ajax",       "y");
  http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  // below 2 line commented - made IE wait with ~1 minute timeout
  if (parameters) {
    http_request.setRequestHeader("Content-length", parameters.length);
  }
  //http_request.setRequestHeader("Connection", "close");
  http_request.send(parameters);
}

function loadingCueStart(hotspot) {
  if (!hotspot)
    return;
  var ttDiv = document.getElementById("system_tooltip");
  var ttIframe = document.getElementById("tooltipIframe");
  var loadingMsg = "<img src='icons/classes/Duration.gif' style='vertical-align: middle;'><span style='vertical-align: middle; font-size: 14px; color:#000000; margin:2; padding:7px;'><b> loading . . . </b></span>";

  var shiftDiv = document.getElementById("shift_pref");
  shiftDiv.style.visibility = "hidden";

  Popup.open(ttDiv.id, hotspot, ttIframe, 0, 0, 0, loadingMsg);
}

function loadingCueFinish() {
  if (Popup.tooltipPopup)
    Popup.tooltipPopup.close();
}

//******************************************** end AJAX ************************************************

//****************************** form operations from forms.js *****************************************
//
//
var textAreas = new Array();
function FormField(fieldRef, isModified) {
  this.fieldRef = fieldRef;
  this.isModified = isModified;
  this.modifiedByUser = true;
}

function clearUnModifiedFields(formFields) {
  for (var i = 0; i < formFields.length; i++) {
    if (formFields[i].isModified == false) {
      formFields[i].fieldRef.value = '';
    }
  }
}

function onFormFieldClick(fieldProp, fieldRef) {
  fieldProp.modifiedByUser = true;
  if (fieldProp.isModified == true)
    return;
  fieldRef.select();
}

function onFormFieldChange(fieldProp, fieldRef, oldValue) {
  if (fieldProp.modifiedByUser == false)
    return;
  fieldProp.isModified = true;
  newValue = fieldRef.value;
  if (newValue != null && newValue != '')
    newValue = trim(newValue);
  if (newValue == null || newValue == '') {
    fieldRef.value = oldValue;
    fieldProp.isModified = false;
    fieldProp.modifiedByUser = false;
  }
}

function hideShowDivOnClick(divId, imgId){//, plusImg, minusImg) {
  div = document.getElementById(divId);
  img = document.getElementById(imgId);
  if (div.style.display == 'none') {
    div.style.display = 'block';
    img.style.display = 'none';
  }
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

/* used to show full text in a long text property, like Demand.description */
function displayFullText(div, moreDiv) {
  document.getElementById(div).style.overflow = 'visible';
  document.getElementById(div).style.display = 'inline';
  document.getElementById(moreDiv).style.display = 'none';
}
function setTextHeight(div, divider) {
  if (window.screen) {
    var divRef = document.getElementById(div);
    var spanRef = document.getElementById(div + '_span');
    var moreRef = document.getElementById(div + '_more');
  }
  if(divRef.offsetHeight < 40 && document.all) {                       // If the height of the div content is less then 40px,
    document.getElementById(div).style.height=divRef.offsetHeight;     // then the height of the div is set to the height
    displayFullText(div, div+"_more");                                 // of the div content and "more>>" link is disabled.
    return;
  }
  var h = Math.floor(screen.availHeight/divider);
  divRef.style.height = h;
  divRef.style.overflow = "hidden";
  if (spanRef != null && moreRef != null) {
    if (spanRef.offsetHeight > divRef.offsetHeight) {
      moreRef.style.display = "block";
    }
    else { // div must have "minimized view". Then the user clicks on "more>>" link and the style of the div is changed
           // from (overflow:hidden) to (display:inline; overflow:visible). This is done in (function displayFullText(div, moreDiv))
      //moreRef.style.display = "none";
      divRef.style.height = 4 * 1.33 + 'em'; // 4 rows //spanRef.offsetHeight;
      //divRef.style.overflow = "visible";
    }
  }
}
function setTextHeightAll(divider) {
  for (var i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null)
      setTextHeight(textAreas[i], divider);
  }
}
function textAreaExists(textAreaName) {
  for (var i = 0; i < textAreas.length; i++) {
    if (textAreas[i] != null && textAreaName == textAreas[i])
      return true;
  }
  return false;
}

/*************************  Form fields adding/removing *******************/
function addField(form, fieldType, fieldName, fieldValue) {
  if (document.getElementById) {
    var input = document.createElement('INPUT');
      if (document.all) { // what follows should work
                          // with NN6 but doesn't in M14
        input.type = fieldType;
        input.name = fieldName;
        input.value = fieldValue;
      }
      else if (document.getElementById) { // so here is the
                                          // NN6 workaround
        input.setAttribute('type', fieldType);
        input.setAttribute('name', fieldName);
        input.setAttribute('value', fieldValue);
      }
    form.appendChild(input);
  }
}
function getField (form, fieldName) {
  if (!document.all)
    return form[fieldName];
  else  // IE has a bug not adding dynamically created field
        // as named properties so we loop through the elements array
    for (var e = 0; e < form.elements.length; e++)
      if (form.elements[e].name == fieldName)
        return form.elements[e];
  return null;
}
function removeField (form, fieldName) {
  var field = getField (form, fieldName);
  if (field && !field.length)
    field.parentNode.removeChild(field);
}
function toggleField (form, fieldName, value) {
  var field = getField (form, fieldName);
  if (field)
    removeField (form, fieldName);
  else
    addField (form, 'hidden', fieldName, value);
}

function processCreditCardTracks(inputField) {
  var tracks = inputField.value;
  var form = inputField.form;

  var startIdx = tracks.indexOf('%B');
  if (startIdx == -1) {
    return;
  }
  var endIdx = tracks.indexOf('?>');
  if (endIdx == -1) {
    return;
  }
  tracks = tracks.substring(startIdx + 1, endIdx);

  var middleIdx = tracks.indexOf('?;');
  if (middleIdx == -1) {
    var track1 = tracks;
  } else {
    var track1 = tracks.substring(0, middleIdx);
    var track2 = tracks.substring(middleIdx + 2, tracks.length);
  }
  var splitArray = track1.split('^');
  var accountNumber = splitArray[0].substring(1);
  accountNumber = removeSpaces(accountNumber);
  var name = splitArray[1];
  var names = name.split('/');
  name = names[1] + ' ' + names[0];
  var yearMonth = splitArray[2];
  var year = yearMonth.substring(0, 2);
  var month = yearMonth.substring(2, 4);
  form.elements['nameOnCard'].value = name;
  form.elements['number'].value = accountNumber;
  form.elements['expirationDate___Month'].selectedIndex = parseInt(month, 10);
  var years = form.elements['expirationDate___Year'];
  var len = years.length;
  for (var i=0; i<len; i++) {
    if (years.options[i].value.indexOf(year) == 2) {
      years.selectedIndex = i;
      break;
    }
  }
  form.elements['.track1'].value = track1;
  form.elements['.track2'].value = track2;
  form.elements['cardholderVerificationCode'].value = "";
  return true;
}

function removeSpaces(str) {
  if (str.indexOf(' ') == -1)
    return str;
  var buf = "";
  for (var i = 0, l = str.length; i < l; i++) {
    var c = str.charAt(i);
    if (c == ' ')
      continue;
    buf += c;
  }
  return buf;
}
//******************************************************* from forms.js *************************************

/**************************************
*	drag & drop engine
***************************************/
var dragobject = {
	z: 0, x: 0, y: 0, offsetx : null, offsety : null, targetobj : null, dragapproved : 0,
	initialize: function(){
		addEvent(document, 'mousedown', this.drag, false);
		addEvent(document, 'mouseup', this.stopDrag, false);
		addEvent(document, 'mousemove', this.moveit, false);
	},
	drag: function(e){
		var evtobj = window.event? window.event : e;
		var dragObj = window.event? event.srcElement : e.target;
		var titleObj = null;
		if( (titleObj =  getAncestorById(dragObj, "titleBar")) != null ) {
			this.dragapproved = 1;

		var dragContainerStr = titleObj.getAttribute("dragcontainer");
		if(dragContainerStr == null || dragContainerStr.length == 0)
			dragContainerStr = 'pane2'; // apply a default
		this.targetobj = document.getElementById(dragContainerStr);
		if (isNaN(parseInt(this.targetobj.style.left))) {this.targetobj.style.left = 0;}
		if (isNaN(parseInt(this.targetobj.style.top)))  {this.targetobj.style.top = 0;}
		this.offsetx = parseInt(this.targetobj.style.left);
		this.offsety = parseInt(this.targetobj.style.top);
		this.x = evtobj.clientX
		this.y = evtobj.clientY
		if (evtobj.preventDefault)
			evtobj.preventDefault();
		}
	},
	moveit: function(e){
		var evtobj=window.event? window.event : e
		if (this.dragapproved == 1){
			this.targetobj.style.left = this.offsetx + evtobj.clientX - this.x + "px"
			this.targetobj.style.top  = this.offsety + evtobj.clientY - this.y + "px"
			return false;
		}
	},
	stopDrag: function() {
		this.dragapproved = 0;
	}
}
// initialize the drag & drop engine in addHandlers function

// ***********************************************************************************

/**
 * check the checkbox if property related to it has changed value
 * (used in Watch and Subscribe)
 *
 * The checkbox must be first checkbox in the same TR
 */
function setRelatedCheckbox(e) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
  var tr = getTrNode(target);
  if (!tr)
    return stopEventPropagation(e);

  var inputs = tr.getElementsByTagName('input');
  if (inputs && inputs.length != 0) {
    for (var i=0;  i <inputs.length; i++) {
      if (inputs[i].type.toLowerCase() == "checkbox")
        inputs[i].checked = false;
    }
  }
}


// execJS **************************************************************
// helps to handle dialog and tab cases; checks ready state (IE) as well.
var execJS = {
  runCodeArr : new Array(),
  isWaitingOnReady : false,

  // executes js code if refObjId is visible - [hidden tab].
  runRelativeCode : function(jsCode, refObjId) {
    if(document.all && document.readyState != "complete") {
			if(this.isWaitingOnReady == false) {
			  addEvent(document, 'readystatechange', this._runOnDocumentReady, false);
			  this.isWaitingOnReady = true;
			}
			this.runCodeArr.push({"jsCode": jsCode, "refObjId": refObjId});
		}
		else {
      if(this.isObjectTotallyVisible(refObjId))
        window.eval(jsCode);
    }
  },

  // evaluates script blocks of the div with className = "execJS"
  // contDiv is a div that contain JS code - [dialog].
  runDivCode : function(contDiv) {
    var scripts = contDiv.getElementsByTagName('script');
    for(var i = 0; i < scripts.length; i++) {
      if(scripts[i].className == "execJS" && scripts[i].text != "") {
        window.eval(scripts[i].text);
        scripts[i].text = ""; // prevents multiple execution for a tab.
      }
    }
  },

  // checks on visibility all ancestors of the object
  // gets object or its id
  isObjectTotallyVisible : function(objId) {
    var obj = document.getElementById(objId);
	  var parent = obj;
	  while(parent != null) {
		  if(typeof parent.style != 'undefined' && parent.style.visibility == 'hidden')
			  return false;
		  parent = obj.parentNode;
		  obj = parent;
	  }
	  return true;
  },

  _runOnDocumentReady : function() {
    for(var i = 0; i < execJS.runCodeArr.length; i++) {
      if(execJS.isObjectTotallyVisible(execJS.runCodeArr[i].refObjId))
        window.eval(execJS.runCodeArr[i].jsCode);
      }
   }


}
// ***************************************

/**
 * toogle booleans
 */
function addBooleanToggle(elem) {
  if (!elem)
    return;
  var elemId  = elem.id;
  if (!elemId) {
    return;
  }

  var elemLen = elemId.length;
  if (elemId.indexOf("_boolean",         elemLen - "_boolean".length) != -1  ||
      elemId.indexOf("_boolean_refresh", elemLen - "_boolean_refresh".length) != -1) {
    addEvent(elem, 'click', changeBoolean, false);
    elem.style.cursor = 'pointer';
  }
}

/**
 * Change boolean value (in non-edit mode)
 */
function changeBoolean(e) {
  var target;

  e = (e) ? e : ((window.event) ? window.event : null);
  if (!e)
    return;
  target = getTargetElement(e);
  var url = 'editProperties.html?submitUpdate=Submit+changes&User_Agent_UI=n&uri=';
  var bIdx = target.id.indexOf("_boolean");
  var rUri = target.id.substring(0, bIdx);
  var idx = rUri.lastIndexOf("_");
  var propShort = rUri.substring(idx + 1);
  rUri = rUri.substring(0, idx);
  var bUri = null;
  idx = rUri.indexOf(".$.");
  if (idx != -1) {
    bUri = rUri.substring(idx + 3);
    rUri = rUri.substring(0, idx);
  }
  var tooltip = target.getAttribute('tooltip');
  var pValue;
  if (tooltip  &&  tooltip.length != 0  &&  tooltip == "Yes")
    pValue = "No";
  else
    pValue = "Yes";
  target.setAttribute('tooltip', pValue);
  if (pValue == "Yes")
    target.src = target.getAttribute('yesIcon');
  else
    target.src = target.getAttribute('noIcon');
  url += encodeURIComponent(rUri) + "&" + propShort + "=" + pValue;
  if (bUri != null)
    url += "&bUri=" + encodeURIComponent(bUri);

  var listboxFrame = frames["popupFrame"];
  popupFrameLoaded = false;

  if (target.id.indexOf("_boolean_refresh") != -1) {
    var locationUrl = document.location.href;
    url += "&$returnUri=" + encodeURIComponent(locationUrl);
    document.location.replace(url);
  }
  else
    listboxFrame.location.replace(url); // load data from server into iframe
  if (Popup.tooltipPopup) {
    Popup.tooltipPopup.close();
    Popup.tooltipPopup = null;
  }
  //tooltipMouseOut0(target);           // remove and ...
  //tooltipMouseOver0(target);          // repaint the tooltip on this boolean icon
}

if (!document.importNode) {
  document.importNode = function(oNode, bImportChildren) {
    var oNew;

    if(oNode.nodeType == 3) {
      oNew = document.createTextNode(oNode.nodeValue);
    }
    else {
      oNew = document.createElement(oNode.nodeName);
      for(var i = 0; i < oNode.attributes.length; i++) {
        if (oNode.attributes[i].name != 'style')
          oNew.setAttribute(oNode.attributes[i].name, oNode.attributes[i].value);
      }
      if (oNode.style.cssText) {
        alert(oNode.style.cssText);
        oNew.setAttribute('style', oNode.style.cssText);
      }
    }

    if (bImportChildren && oNode.hasChildNodes()) {
      for (var oChild = oNode.firstChild; oChild; oChild = oChild.nextSibling) {
        oNew.appendChild(document.importNode(oChild, true));
      }
    }

    return oNew;
  }
}

function cloneNode(to, oNode) {
  var oNew;

  if(oNode.nodeType == 3) {
    oNew = document.createTextNode(oNode.nodeValue);
  }
  else {
    oNew = document.createElement(oNode.nodeName);
    for(var i = 0; i < oNode.attributes.length; i++) {
      if (oNode.attributes[i].name != 'style')
        oNew.setAttribute(oNode.attributes[i].name, oNode.attributes[i].value);
    }
    oNew.setAttribute('style', oNode.style.cssText);
  }

  if (oNode.hasChildNodes()) {
    for (var oChild = oNode.firstChild; oChild; oChild = oChild.nextSibling) {
      var next = cloneNode(oNew, oChild);
      oNew.appendChild(next);
    }
  }

  return oNew;
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
    alert(a.name + ': ' + a.value)
  }
  oNew.setAttribute('style', oNode.style.cssText);
  //oNew.style.cssText = oNode.style.cssText;
}

function copyTableRow(tbody, pos, oldTr) {
  var newTr = document.createElement('tr');
  var oldCells = oldTr.cells;
  for (var i=0; i<oldCells.length; i++) {
    var cell = document.createElement('td');
    newTr.appendChild(cell);
  }
  if (pos == tbody.rows.length)
    tbody.appendChild(newTr);
  else
    tbody.insertBefore(newTr, tbody.rows[pos]);
  for (var i=0; i<oldCells.length; i++) {
    //alert(oldCells[i].innerHTML);
    newTr.cells[i].innerHTML = oldCells[i].innerHTML;
  }
  copyAttributes(oldTr, newTr);
}