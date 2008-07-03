/**************** addEvent *****************/
function addEvent(obj, evType, fn, useCapture) {
  if (obj.getAttribute) {
	  var handler = obj.getAttribute('handler_' + evType);
	  if (handler && handler == fn) {
	    //alert("Error: duplicate " + evType + " event handler " + fn + " for " + obj.tagName + " with id " + obj.id);
	    return;
	  }
	  obj.setAttribute('handler_' + evType, fn);
	}
  if (obj.addEventListener) { // NS
    obj.addEventListener(evType, fn, useCapture);
    return true;
  }
  else if (obj.attachEvent) { // IE
    var r = obj.attachEvent("on" + evType, fn);
    return r;
  }
  else {
    alert("You need to upgrade to a newer browser. Error: 'event handler could not be be added'");
  }
}

/**
 * Popup system. Supports menu, dynamicaly generated listboxes, tooltips.
 * Supports row selection (one or many) in menu, listbox. Support stacking up
 * one popup on top of another (e.g.
 */

var keyPressedImgId;
var keyPressedElement;
var autoCompleteTimeoutId;
var keyPressedTime;

/**
 * Since Internet Explorer does not define the Node interface constants, which
 * let you easily identify the type of node, one of the first things to do in a
 * DOM script for the Web is to make sure you define one yourself, if it's
 * missing.
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
Popup.currentDivs          = new Array(); // distinct divs that can be open at
                                          // the same time (since they have
                                          // different canvases)
Popup.popups               = new Array(); // pool of all popups with different
                                          // divId(s)
Popup.openTimeoutId        = null; // timeout after which we need to open the
                                    // delayed popup
Popup.delayedPopup         = null; // the delayed popup
Popup.lastClickTime        = null; // last time user clicked on anything
Popup.lastOpenTime         = null; // moment when last popup was opened
Popup.delayedPopupOpenTime = null; // moment when delayed popup was requested
Popup.tooltipPopup         = null;
Popup.DarkMenuItem  = '#AABFCD'; // '#95B0C3'; //'#dee6e6';
Popup.LightMenuItem = '';
Popup.autoCompleteDefaultTimeout = 200;

Popup.HIDDEN  =  'hidden';
Popup.VISIBLE =  'visible';
if (document.layers) {
  Popup.HIDDEN  = 'hide';
  Popup.VISIBLE = 'show';
}


// for forced position of popup
Popup.POS_LEFT_TOP = 'left_top';

/**
 * returns iframe that serves as a canvas for this popup (overlaying the
 * underlying form fields)
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
    if (popup.isOpen() &&         // if popup is already open then we need only
                                  // tooltips in it (and not the tooltips on
                                  // areas outside popup)
        !popup.isTooltip()) {     // but if open popup is a tooltip - ignore it
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
 * Static function. returns a Popup by divId if exists, otherwise - null
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
Popup.openAfterDelay = function (event, divId, offsetX, offsetY) {
  // alert('event.clientX: ' + event.clientX + ', offsetX: ' + offsetX + ',
  // divId: ' + divId);
  if ( (Popup.lastOpenTime   && (Popup.lastOpenTime  > Popup.delayedPopupOpenTime)) ||
       (Popup.lastClickTime  && (Popup.lastClickTime > Popup.delayedPopupOpenTime)) ||
       (keyPressedTime       && (keyPressedTime      > Popup.delayedPopupOpenTime))
      ) {
    return; // do not open delayed popup if other popup was already opened
            // during the timeout
  }
  Popup.delayedPopup = null;
  var popup = Popup.getPopup(divId);
  if (popup) {
    popup.open1(event, offsetX, offsetY);
  }
};

/**
 * Static function. Opens a menu with a specified DIV and places it on the
 * screen relative to hotspot (IMG, link, etc). Note: uses frameRef to draw this
 * DIV on top of the iframe in order to block underlying form fields (which
 * otherwise would show through).
 */
Popup.open = function (event, divId, hotspotRef, frameRef, offsetX, offsetY, delay, contents) {
  var divRef = document.getElementById(divId);
  var popup = Popup.getPopup(divId);
  if (popup == null)
    popup = new Popup(divRef, hotspotRef, frameRef, contents);
  else
    popup.reset(hotspotRef, frameRef, contents);

  if (delay) {
    popup.openDelayed(event, offsetX, offsetY, delay);
    return;
  }
  return popup.open1(event, offsetX, offsetY);
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
 * Loads the ajax popup into the div
 */
Popup.load = function (event, div, hotspot, content) {
  var frameId     = 'popupFrame';
  var frameBodyId = 'popupFrameBody';

  // content exists if we used ajax via httpRequest, otherwise we need not
  // extract content from iframe
  if (!content) {
    if (!frameLoaded[frameId]) {
      setTimeout(function () {Popup.load(event, div, hotspot)}, 50);
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
    var redirect = popupFrame.document.getElementById('$redirect'); // redirect
                                                                    // to login
                                                                    // page
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

  // /
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
  // /

  var addToTableName = "";
  if (originalProp.indexOf("_class") != -1) {
    var field = propName + "_class";
    if (document.forms[currentFormName].elements[field].value == "")
      addToTableName = "_class";
  }

  hideResetRow(div, currentFormName, originalProp);
  popup.open1(event, 0, 16);
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
  this.iframe         = Popup.getCanvas(frameRef); // iframe beneath this popup
                                                    // (to cover input elements
                                                    // on the page below popup)
  this.hotspot        = hotspotRef; // hotspot that triggered this popup
  this.contents       = contents;
  this.isTooltipFlag  = contents ? true : false;

  this.resourceUri    = null;       // popup was activated for one of the
                                    // properties of the Resource in resource
                                    // list (RL). resourceUri is this resource's
                                    // URI.

  // this.originalProp = null; // Resource property for which popup was
  // activated
  // this.propName = null; // same, but encoded - has extra info such as HTML
  // form name, interface name, etc.
  // this.formName = null; // name of the HTML form which element generated last
  // event in the popup
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

  this.open1 = function (event, offsetX, offsetY) {
    var hotspot = getEventTarget(event);
    var hotspotDim = getElementCoords(hotspot, event);
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
// opening the same popup at the same place? - just quit
        if (self.div.id == curDivId &&
            self.hotspotDim.equals(hotspotDim) &&
            (offsetX1 == offsetX && offsetY1 == offsetY) &&
             self.div.style == 'visible') {
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
    // alert('visible');
    self.setVisible(event, offsetX, offsetY, hotspotDim);
    self.popupClosed = false;

    self.deselectRow();

    self.setCurrentDiv();
    self.setFocus();
    if (!self.initialized) {
      self.interceptEvents();
      FormProcessor.initForms(self.div);
      self.initilized = true;
    }
    // alert('end popup init');
    if (self.isTooltip()) {
      Popup.tooltipPopup = self;
      // fit tooltip height
      makeDivAutosize(self.div, true);
      // vary delay based on the amount of text user must read
      var delay = self.contents.length / 35 * 1000;
      if (delay < 500) delay = 1000;
      else if (delay < 1000) delay = 2000;
      self.delayedClose(delay);
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
  this.openDelayed = function (event, offsetX, offsetY, delay) {
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
    var clonedEvent = cloneEvent(event);
    Popup.openTimeoutId = setTimeout(function () {Popup.openAfterDelay(clonedEvent, self.div.id, offsetX, offsetY)}, delay);
    Popup.delayedPopup = self;
  }

  /**
   * Show popup
   */
  this.setVisible = function (event, offsetX, offsetY, hotspotDim) {
    return setDivVisible(event, self.div, self.iframe, self.hotspot, offsetX, offsetY, hotspotDim);
  }

  /**
   * Hide popup
   */
  this.setInvisible = function () {
    return setDivInvisible(self.div, self.iframe);
  }

  /**
   * close popup uncoditionally and immediately with no regard to mouse position
   */
  this.close = function () {
    // if (self.popupClosed)
    // return;
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
    // var isMenu = div.id.indexOf('menudiv_') == 0 ? true false;
    if (div.getAttribute) {
      var isProcessed = div.getAttribute('eventHandlersAdded');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return;
      div.setAttribute('eventHandlersAdded', 'true');
    }

    if (!Browser.penBased && !Browser.joystickBased) {
      if (Browser.ie55) { // IE 5.5+ - IE's event bubbling is making mouseout unreliable
        addEvent(div,     'mouseenter',  self.popupOnMouseOver, false);
        addEvent(div,     'mouseleave',  self.popupOnMouseOut,  false);
        addEvent(hotspot, 'mouseleave',  self.popupOnMouseOut,  false);
      }
      else {
        addEvent(div,     'mouseover', self.popupOnMouseOver, false);
        addEvent(div,     'mouseout',  self.popupOnMouseOut,  false);
        addEvent(hotspot, 'mouseout',  self.popupOnMouseOut,  false);
      }
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

    // popup contains rows that can be selected
    if (Browser.ie) { // IE - some keys (like backspace) work only on keydown
      addEvent(div,  'keydown',   self.popupRowOnKeyPress,  false);
    }
    else {          // Mozilla - only keypress allows to call e.preventDefault() to prevent default browser action, like scrolling the page
      addEvent(div,  'keypress',  self.popupRowOnKeyPress,  false);
    }

    var n = self.rowCount();
    var elems = tables[1].getElementsByTagName("tr");
    for (var i=0; i<n; i++) {
      var elem = elems[i];
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
          addCurrentDashboardAndCurrentTab(anchor);
          var href = anchor.href;

          // anchors[0].href = 'javascript:;';
          elem.setAttribute('href', href);
          // anchors[0].disabled = true;
        }
      }
      addEvent(elem, 'mouseover', self.popupRowOnMouseOver, false);
      addEvent(elem, 'mouseout',  self.popupRowOnMouseOut,  false);
    }
    // reset
    self.currentRow = null;
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
    if (typeof getDocumentEvent == 'undefined') return; // js is not yet fully interpreted by the browser
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

// Packages.java.lang.System.out.println('mouseOver: target.tagName: ' +
// target.tagName + ', target.id: ' + target.id + ', div: ' + self.div.id);
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
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }

    var target1 = getEventTarget(e);
    if (target1.tagName.toLowerCase() == 'input')
      return true;

    var target = getMouseOutTarget(e);
    if (!target)
      return true;
// Packages.java.lang.System.out.println('mouseout: target.tagName: ' +
// target.tagName + ', target.id: ' + target.id + ', div: ' + self.div.id);
    self.delayedClose(600);
    return true;
  }

  // ***************************************** row functions
  // ****************************
  /**
   * This handler allows to use arrow keys to move through the menu and Enter to
   * choose the menu element.
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

    var target = getEventTarget(e);
    if (target.tagName.toLowerCase() == 'input')
      return true;

    var tr = self.currentRow;
    if (!tr)
      return stopEventPropagation(e);

    switch (characterCode) {
      case 38:  // up arrow
      case 40:  // down arrow
        break;
      case 9:   // tab
        if (currentDiv) {
          var form = document.forms[currentFormName];
          if (form) {
            var inputField = form.elements[originalProp];
            try { inputField.focus(); } catch(e) {};
          }
          Popup.close0(currentDiv.id);
        }
        return stopEventPropagation(e);
      case 27:  // esc
        if (currentDiv)
          Popup.close0(currentDiv.id);
        return stopEventPropagation(e);
      case 13:  // enter
        self.popupRowOnClick1(e, tr, target);
        return stopEventPropagation(e);
      case 8:   // backspace or "C" in S60
        if(Browser.s60Browser) {
           if (currentDiv)
              Popup.close0(currentDiv.id);
            return stopEventPropagation(e);
        }
        else {
          if (currentDiv) {
            // var form = getFormNode(self.currentRow);
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
   * Reacts to clicks inside the popup
   */
  this.popupRowOnClick = function (e) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);
    var tr = getTrNode(target);
    if (!tr)
      return stopEventPropagation(e);
/*
 * // in both IE and Mozilla on menu click (if menu has onClick handler) onclick
 * event comes one more time var isProcessed =
 * tr.getAttribute('eventProcessed'); if (isProcessed != null && (isProcessed ==
 * 'true' || isProcessed == true)) { tr.setAttribute('eventProcessed', 'false');
 * return stopEventPropagation(e); }
 *  // in IE on menu click (if menu has onClick handler) this same event comes
 * yet another time if (e.getAttribute) { var isProcessed =
 * e.getAttribute('eventProcessed'); if (isProcessed != null && (isProcessed ==
 * 'true' || isProcessed == true)) return stopEventPropagation(e); }
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
    if (target.tagName.toLowerCase() == 'a')
      return;
    if (tr)  
      var anchors = tr.getElementsByTagName('A');
    if (anchors  &&  anchors.length != 0) {
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id);
      }
      var anchor = anchors[0];
      var trg = anchor.getAttribute('target');
      if (trg) {
        var url = anchor.getAttribute('href');
        window.open(url, trg, "width=600, height=600, top=20, left=20, menubar=no,"
           + "status=0, location=no, toolbar=no, scrollbars=1 status=no, resizable=yes");
        stopEventPropagation(e);
        return true;
      }

      if (anchor.id.startsWith('-inner'))       // display as on-page dialog
        return onClickDisplayInner(e, anchor);
      if (anchor.onclick1) {
        anchor.onclick1(e);
      }
      else {
        var href = tr.getAttribute('href', href);
         if (href) {
           stopEventPropagation(e)
          document.location.href = href;
         }
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

    // var form = getFormNode(tr);
    var form = document.forms[currentFormName];
    if (form == null) {
      throw new Error("not found html form for TR: " + tr.id);
    }
    var table  = tr.parentNode;
    var table1 = table.parentNode;

    var propertyShortName = table1.id.substring("table_".length);
    var idx = propertyShortName.lastIndexOf('_');
    propertyShortName = propertyShortName.substring(0, idx);
    var idx = propertyShortName.indexOf(".", 1);
    var prop = null;
    var pLen = propertyShortName.length;
    if (idx == -1) {
      idx = propertyShortName.indexOf("_class");
      if (idx != -1)
        prop = propertyShortName.substring(0, pLen - 6);
      else
        prop = propertyShortName;
    }
    else {
      if (propertyShortName.indexOf(".type") == idx) {
        if (idx + 5 != pLen)
          prop = propertyShortName.substring(0, idx);
        else
          prop = propertyShortName;
      }
      else
        prop = propertyShortName.substring(0, idx);
    }
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
      formFieldVerified.value = 'y'; // value was modified and is verified
                                      // since it is not typed but is chosen
                                      // from the list
    }

    // row clicked corresponds to a property with range 'interface', meaning
    // that
    // we need to open a list of classes that implement this interface
    if (originalProp.indexOf('_class') != -1) {
      var img = tr.getElementsByTagName('img')[0];
      var imgId  = prop + "_class_img";
      if (img) {
        document.getElementById(imgId).src   = img.src;
        document.getElementById(imgId).title = img.title;
      }
      formFieldClass.value = tr.id; // property value corresponding to a
                                    // listitem
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id)
      }
      this.listboxOnClick1(e, currentImgId);
      return true;
    }

    var select;
    var isViewCols = currentFormName.indexOf("viewColsList") == 0  ||
                     currentFormName.indexOf("gridColsList") == 0  ||
                     currentFormName.indexOf("filterColsList") == 0;
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
        else if (currentFormName.indexOf("gridColsList") == 0) {
          arr["-gridCols"] = "-gridCols";
          arr[".-gridCols"] = ".-gridCols";
          arr["-curGridCols"] = "-curGridCols";
        }
        else {
          arr["-filterCols"] = "-filterCols";
          arr[".-filterCols"] = ".-filterCols";
          arr["-curFilterCols"] = "-curFilterCols";
        }
        params = FormProcessor.getFormFilters(form, allFields, arr);
        var formAction = form.elements['-$action'].value;
        var baseUriO = document.getElementsByTagName('base');
        var baseUri = "";
        if (baseUriO) {
          baseUri = baseUriO[0].href;
          if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
            baseUri += "/";
        }
        var url = baseUri + "l.html?" + params;
        document.location.replace(url);
        return;
      }
      else {
        if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate
                                                                                  // rollup
          chosenTextField.value = '';
          var targetImg = self.hotspot;
          if(targetImg.tagName.toLowerCase() == 'a')
            targetImg = targetImg.getElementsByTagName('img')[0];
          if(typeof targetImg != 'undefined')
            targetImg.src = "icons/checkbox.gif";
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
          if (prop.length > 8  &&  prop.indexOf("_groupBy") == prop.length - 8)  { // ComplexDate
                                                                                    // rollup
            chosenTextField.value = tr.id;
            var dateImg = tr.getElementsByTagName('img');
            var targetImg = this.hotspot;
            if(targetImg.tagName.toLowerCase() == 'a')
              targetImg = targetImg.getElementsByTagName('img')[0];
            if(typeof targetImg != 'undefined')
              targetImg.src = dateImg[0].src;
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
          selectItems.value = tr.id; // property value corresponding to a
                                      // listitem
// else if (t == "checkbox")
// selectItems.value = tr.id; // property value corresponding to a listitem
      }
      else {
        selectItems.value = '';
        // go over selected items and count all checked
        var hiddenSelectedItem;
        for (var i=0; i<selectItems.length; i++) {
          if (selectItems[i].type.toLowerCase() == "hidden") {
            hiddenSelectedItem = selectItems[i];
            selectItems[i].value = '';
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
            if (sValue == tr.id) { // check that item was selected by clicking
                                    // on popup row not explicitely on checkbox
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
          else {
            var checkSubscribe = form.elements[prop + '_subscribe'];
            if (checkSubscribe)
              checkSubscribe.checked = true;
            if (nmbChecked == 1) {
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
    }

    // close popup
    idx = prop.indexOf(".type");

    var divId = (idx != -1  &&  prop.length == idx + 5) ? prop.substring(0, idx) + "_" + currentFormName : prop + "_" + currentFormName;
    if (currentResourceUri != null) {
      if (divId.indexOf(".") == 0)
        divId = currentResourceUri + ".$" + divId;
      else
        divId = currentResourceUri + ".$." + divId;
    }
    var div = document.getElementById(divId);
    if (deleteCurrentDiv && currentDiv)
      loadedPopups[currentDiv.id] = null;
    // if checkbox was clicked, then do not close popup so that user can check
    // checboxes, if needed
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
    // if checkbox was clicked, then do not close popup so that user can check
    // checboxes, if needed
    if (!checkboxClicked)
      Popup.close0(div.id);
    clearOtherPopups(div);
    if (checkboxClicked)
      return true;
    else
      return false;
  }

  this.popupRowOnMouseOver = function (e) {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    // in IE for some reason same event comes two times
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return false;
      e.setAttribute('eventProcessed', 'true');
    }
    // self.setFocus();
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
    if (typeof getDocumentEvent == 'undefined') return;
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
        // alert(elem.id);
        elem.style.backgroundColor = Popup.DarkMenuItem;
      }
    }
  }

  this.nextRow = function () {
    var cur = self.currentRow;
    if (self.currentRow == null) {
      self.currentRow = self.firstRow();
      // if (cur == self.currentRow)
      // a = 1;
      return self.currentRow;
    }

    var next = self.currentRow.nextSibling;
    if (next == null) {
      self.currentRow = self.firstRow();
      // if (cur == self.currentRow)
      // a = 1;
      return self.currentRow;
    }

    // The following is needed to work around FireFox and other Netscape-based
    // browsers. They will return a #text node for nextSibling instead of a TR.
    // However, the next TR sibling is the one we're after.
    var exitIfBusted = 0;
    var nextTr = next;
    while (nextTr.nodeName && nextTr.nodeName.toUpperCase() != 'TR') {
      nextTr = nextTr.nextSibling;
      if (nextTr == null) {
        self.currentRow = self.firstRow();
        // if (cur == nextTr)
        // a = 1;
        return self.currentRow;
      }
      exitIfBusted++;
      if (exitIfBusted > 10) {
        throw new Error('could not locate next row for ' + self.currentRow.id);
        return null;
      }
    }
    next = nextTr;
    if (next.id.indexOf('divider') == -1 && next.id.indexOf("_$calendar") == -1) {
      self.currentRow = next;
      // if (cur == next)
      // a = 1;
      return next;
    }
    else {
      self.currentRow = next;
      next = self.nextRow();
      // if (cur == next)
      // a = 1;
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
      // self.deselectRow();
      self.currentRow = self.lastRow();
      // self.selectRow();
      return self.currentRow;
    }

    if (prev.tagName && prev.tagName.toUpperCase() == 'TR' && prev.id.indexOf('divider') == -1 && prev.id.indexOf("_$calendar") == -1) {
      // self.deselectRow();
      self.currentRow = prev;
      // self.selectRow();
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
      if (!self.isHeaderRow(trs[i]) && trs[i].style.display != 'none')
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

    for (var i = trs.length - 1; i >= 0; i--) {
      if (!self.isHeaderRow(trs[i]) && trs[i].style.display != 'none')
        break;
    }
    return trs[i];
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
   * Returns popup item by its name. Usually popup item corresponds to a row in
   * popup.
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
  this.seq       = seq;        // sequence number of this item from the top of
                                // popup

  this.checked   = false;      // item may be checked (true) or not (false)
  this.selected  = false;      // item may be currently selected (highlighted)
                                // or not
  this.onChosen  = null;       // event handler that receives control when user
                                // clicked on this popup element or pressed
                                // Enter
  this.onOver    = null;       // event handler that receives control when this
                                // popup element is selected (highlighted)
  this.onOut     = null;       // event handler that receives control when this
                                // popup element is unselected (becomes passive)
  this.onCheck   = null;       // event handler that receives control when item
                                // is checked
  this.onUncheck = null;       // event handler that receives control when item
                                // is unchecked
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
// defined in JAVA because menu.js is loaded at the page bottom
/* var innerUrls = new Array(); */
var innerListUrls = new Array();

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
  // alert(intLessLeft + "," + intLessTop + ", " + x + ", " + y);
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

/*
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
*/
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


/***********************************************
* FormProcessor - helps to handle data of a form
************************************************/
var FormProcessor = {
  // variables ----
  formInitialValues : new Array(),
  
  // methods ----
  initForms : function(div) {
    if (Browser.mobile)
      return;

    var forms;
    if (div)
      forms = div.getElementsByTagName('form');
    else
      forms = document.forms;
    
    for (var i = 0; i < forms.length; i++) {
      var form = forms[i];
      var initialValues = new Array(form.elements.length);
      //formInitialValues[form.name] = initialValues;
      if (form.id != 'filter')
        continue;
      this._storeInitialValues(form);
      ListBoxesHandler.init(form);
      addEvent(form, 'submit', this.onSubmit, false);
    }

    this.uiFocus();
  },
  
  uiFocus : function(div) {
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
          if(ExecJS.isObjectTotallyVisible(u)) {
            try {
              u.focus(); // in IE (at least in IE6) first focus() is lost for some
                        // reason - we are forced to issue another focus()
              u.focus();
            }catch(e){};
          }
          return true;
        }
      }
    }
    if (firstField && div != document) {
      if(ExecJS.isObjectTotallyVisible(firstField)) {
        try {
          firstField.focus();
          firstField.focus(); // second time for IE
        }catch(e){};
      }
    }
    return false;
  },

  // prevents submision of not changed data
  onSubmit : function(e) {
    e = getDocumentEvent(e);
    if (!e)
      return;
  //  Boost.log('popupOnSubmit');
    /*
    if (e.eventProcessed)
      return stopEventPropagation(e);
    else
      e.eventProcessed = true;
    */
    // prevent duplicate events (happens only in IE)
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }
    else if (e.eventProcessed) {
      return stopEventPropagation(e);
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
    if(RteEngine)
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
  // var action = form.attributes['action'];
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

    var params = "submit=y"; // HACK: since target.type return the value of &type
                              // instead of an input field's type property
    var p1 = FormProcessor.getFormFilters(form, allFields);
    if (p1)
      params += p1;
    var submitButtonName  = null;
    var submitButtonValue;
  /*
  * var t = target.attributes['type']; if (t.toUpperCase() == 'SUBMIT') { if
  * (target.attributes['name'] == "Clear") url += "&clear=Clear"; else if
  * (currentFormName == "horizontalFilter") url += "&submit=y"; else if
  * (currentFormName == "rightPanelPropertySheet") url += "&submitFilter=y"; }
  * else url += "&submit=y";
  */

  /*
  * // figure out the name and the value of the Submit button for (i=0; i<form.elements.length;
  * i++) { var elem = form.elements[i]; if (elem.type.toUpperCase() == 'SUBMIT') {
  * submitButtonName = elem.name; submitButtonValue = elem.value; } }
  *
  * if (!submitButtonName) return true; var hasQ = url.indexOf('?') != -1; if
  * (!hasQ) url += '?' + submit; else url += '&' + submit;
  */

    params += '&$form=' + form.name;

    // url += '&$selectOnly=y';

    if (allFields == false) {
      var type = form.type;
      if (type)
        params += "&type=" + type.value;

      params += "&-$action=" + formAction;
    }
    if (form.uri)
      params += "&uri=" + encodeURIComponent(form.uri.value);

    if (isCancel)
      params += "&cancel=y";

    /* do not allow to submit form while current submit is still being processed */
    if (form.name.indexOf("tablePropertyList") != -1) { // is it a data entry
                                                        // form?
      var wasSubmitted = form.getAttribute("wasSubmitted");
      if (wasSubmitted) {
        alert("Can not submit the same form twice");
        return stopEventPropagation(e);
      }
      form.setAttribute("wasSubmitted", "true");
      // form.submit.disabled = true; // weird, but the form would not get
      // submitted if disabled

      // this solution for duplicate-submit does not work in firefox 1.0 & mozilla
      // 1.8b - fakeOnSubmit get control even on first form submit
      // it has another drawback - page must be reloaded for the form to be
      // submitted second time - while previous solution works with back/forward
      /*
      * if (form.onsubmit == fakeOnSubmit) { alert("Already submitted - please
      * wait"); return false; } form.onsubmit = fakeOnSubmit;
      */
    }
    for (var j = 0; j < form.elements.length; j++) {
      var elem = form.elements[j];
      var atts = elem.getAttribute('onSubmit');
      if (atts) {
        if (!elem.getAttribute('onSubmitFixed')) {
          var s = atts.replace(/\(this\)/, ''); // e.g. replace setTime(this) into setTime

          if (trim(s).startsWith('function'))
            elem.onsubmit = eval(s);
          else
            elem.onsubmit = eval('function (event) {' + s + '}');
          elem.setAttribute('onSubmitFixed', 'true');
        }
        elem.onsubmit();
      }
    }

  // submit as GET with all parameters collected manually
  // form.method = 'GET';
  // document.location.href = url;
  // return stopEventPropagation(event);
    form.method = 'POST';
    if (!action)
      form.action = "FormRedirect";

    if (pane2  &&  pane2.contains(form))  {   // dialog?
      setDivInvisible(pane2, dialogIframe);
    }

    // if current form is inner dialog - submit as AJAX request
    // upon AJAX response we will be able to choose between repainting the dialog
    // or the whole page
    if (pane2  &&  pane2.contains(form))  {   // inner dialog?
      postRequest(e, url, params, pane2, getTargetElement(e), showDialog);
      return stopEventPropagation(e);
    }
    else {
      return true; // tell browser to go ahead and continue processing this
                    // submit request
    }
  },
  
  /**
  * Helper function - gathers the parameters (from form elements) to build a URL
  * If allFields is true - we are in a Filter panel - need to take into account
  * all input fields Otherwise - it is a Data Entry mode, i.e. - take only fields
  * that were modified by the user
  */
  getFormFilters : function(form, allFields, exclude) {
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
      type = type.toLowerCase();
      if (type == "submit")
        continue;
      if (!allFields) {
        if (!this.wasFormFieldModified(field))
          continue;
      }
      else {
        if (!value)
          continue;
  // if (currentFormName != "horizontalFilter") {
        if (value == ''  ||  value == "All")
          continue;
        if (type == "checkbox" || type == "radio" ) {
          if (field.checked == false)
            continue;
          }
          if (value.indexOf(" --", value.length - 3) != -1)
            continue;
        }
  // }
      if (name == "type")
        p += "&" + name + "=" + value;
      else
        p += "&" + name + "=" + encodeURIComponent(value);
    }
    return p;
  },
  
  _storeInitialValues : function(form) {
    var initialValues = new Array();
    for (var j = 0; j < form.elements.length; j++) {
      var elem = form.elements[j];
      initialValues[elem.name] = elem.value;
    }
    this.formInitialValues[form.name] = initialValues;
  },
  
  // returns true if the field was modified since the page load
  wasFormFieldModified : function(elem) {
    var initialValue = this.getFormFieldInitialValue(elem);
    if (initialValue == null)
      return true; // assume it was modified if no info exists
    if (elem.value == initialValue) {
      //alert("not modified: elem.name: " + elem.name + ", initialValue: " + initialValue);
      return false;
    }
    else {
      //alert("modified: elem.name: " + elem.name + ", initialValue: " + initialValue);
      return true;
    }
  }, 
  // returns value of the field saved right after the page load (does not support multiple selections)
  getFormFieldInitialValue : function(elem, attribute) {
    var formValues = this.formInitialValues[elem.form.name];
    if (formValues) {
      if (attribute)
        return formValues[elem.name + '.attributes.' + attribute];
      else
        return formValues[elem.name];
    }
  }

}



function setTime() {
  this.value = new Date().getTime();
}

/**
 * *********************************************** Helper functions
 * **************************************
 */
function getKeyCode(e) {
  if( typeof( e.keyCode ) == 'number') {
      // IE, NS 6+, Mozilla 0.9+, Safari 3
      return e.keyCode;
  } else if( typeof( e.charCode ) == 'number') {
      // also NS 6+, Mozilla 0.9+
      return e.charCode;
  } else if( typeof( e.which ) == 'number') {
      // NS 4, NS 6+, Mozilla 0.9+, Opera
      return e.which;
  } else {
      // TOTAL FAILURE, WE HAVE NO WAY OF OBTAINING THE KEY CODE
      throw new Error("can't detect the key pressed");
  }
}

function clearOtherPopups(div) {
// alert("div=" + div.id + ", loadedPopups.length=" + openedPopups.length)
  for (var p in loadedPopups) {
    if (p == null)
      continue;
    if (p != div)
      loadedPopups[p] = null;
  }
}

/*
 * function getFormNode(elem) { var f = elem.parentNode; if (!f) return null; if
 * (!f.tagName) return null; if (f.tagName.toUpperCase() == "FORM") return f;
 * else return getFormNode(f); }
 */
function getTrNode(elem) {
  var e;

  var elem_ = elem;

  // IE workaround for menu item's extra mouseover events coming from FORM elements
  if (elem.length > 1) {
    var elem1;
    while ( (elem1 = elem_.previousSibling) != null) { // OPTIONS elements in TD
      elem_ = elem1;
      if (elem_.tagName.toUpperCase() == 'TD') {
        elem_ = elem_.parentNode;
        break;
      }
    }
    if (elem1 == null) { // SELECT element in TD
      elem_ = elem_.parentNode;
      if (elem_.tagName.toUpperCase() == 'TD')
        elem_ = elem_.parentNode;
      else {
        //alert(elem.tagName + ': ' + elem.id + ', elem_: ' + elem_.tagName + ', elem.parentNode: ' + elem.parentNode.tagName);
        return null;
      }
    }
  }
  // end IE workaround

  if (elem_.tagName.toUpperCase() == 'TR')
    return elem_;
  e = elem_.parentNode;
  if (e) {
    if (e == elem_) // if parent of the array element is self - get parent of array
      e = elem.parentNode;
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
    //alert('getDivNode(): element is array: ' + elem + ', its first element is: ' + elem_);
  }
  if (elem_.tagName.toUpperCase() == 'DIV')
    return elem;
  e = elem_.parentNode;
  if (e) {
    if (e == elem)
      e = elem.parentNode; // if parent of the array element is self - get
                            // parent of array itself
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
    throw new Error("form not found: " + form);
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
  else if (currentFormName  &&  (currentFormName.indexOf("viewColsList") == 0  ||  currentFormName.indexOf("gridColsList") == 0  ||  currentFormName.indexOf("filterColsList") == 0)) {
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
    throw new Error("form not found: " + form);
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
// originalForm.elements[shortPropName + "_select"][len].value = id;
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

/** ********************************* Menu ********************************** */
/* Opens the menu when needed, e.g. on click, on enter
 */
function menuOnClick(e, target) {
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

  addCurrentDashboardAndCurrentTab(target);
  var divId = 'menudiv_' + title;
  var divRef = document.getElementById(divId); // this is a menu item without
                                                // popup, exit
  if (!divRef)
    return true;
  var popup = Popup.open(e, divId, target, null, 0, 19);
  return stopEventPropagation(e);
}

function addCurrentDashboardAndCurrentTab(target) {
  if(target.tagName.toLowerCase() == "img")
    return;
  var a = target.href;
  if (!a || a == 'about:blank')
    return;
  var hasQuestion    = a.indexOf('?') != -1;
  // Fixed for DUDE
  if (!hasQuestion || a.indexOf('/tail?') != -1 || a.indexOf("/createResourceList?")  || a.indexOf("/createParallelResourceList?"))
    return;
  // Check if this is blog entry with contents
  var idx =  a.indexOf('&-ulId=');
  if (idx != -1) {
    var idx0 = a.indexOf('#', idx);
    if (idx0 != -1) {
      var idx1 = a.indexOf('&', idx + 1);
      if (idx1 == -1  ||  idx0 < idx1)
        return;
    }
  }
  var addDashboardId = a.indexOf('-d=') == -1;
  if (addDashboardId) {
    var div = document.getElementById('dashboardCredentials');
    if (!div)
      return;
    var s = div.innerHTML.split(';');
    if (s  &&  s.length > 0) {
      if (hasQuestion) {
        if (addDashboardId  &&  s[0]) {
          a += '&-d=' + s[0];
          if (s.length > 1)
            a += '&-t=' + s[1];
        }
      }
      else {
        if (addDashboardId && s[0]) {
          a += '?-d=' + s[0];
          if (s.length > 1) {
            a += '&-t=' + s[1];
          }
        }
      }
      target.href = a;
    }
  }
}
function resizeWindow(event) {
//  return true;
  if (!event)
    return;
  var e = getDocumentEvent(event);
  if (e.getAttribute) {
    var isProcessed = e.getAttribute('eventProcessed');
    if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
      return stopEventPropagation(e);
    e.setAttribute('eventProcessed', 'true');
  }
  var div = document.getElementsByTagName('body');
//  var div = document.getElementById('mobile');
//  alert('resize: div = ' + div);
//  if (div) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var sw = screen.width;
    var sh = screen.height;

    /*
    alert("w = " + w + "; h = " + h + "; sw = " + sw + "; sh = " + sh);
    if (w > h)  {// landscape
//      body.style.height = sh + 'px';
//      body.style.width  = sw + 'px';
      window.resizeTo(sh, sw);
    }
    else {
//      body.style.height = sw + 'px';
//      body.style.width  = sh + 'px';
      window.resizeTo(sw, sh);
    }
//    window.moveTo(0, 0);
*/

//  }
  return true;
}
/*
 * Shows form to choose properties to watch on.
 */
function limitNumberOfAlerts(e) {
  if (!e)
    return;
  var div = document.getElementById('subscribe');
  var divN = document.getElementById('subscribeNote');
  if (div) {
    if (div.className) {
      if (div.className == 'hdn') {
        div.className = '';
        if (divN)
          divN.className = ''
      }
      else {
        div.className = 'hdn';
        if (divN)
          divN.className = 'hdn'
      }
    }
    else {
      div.className = 'hdn';
      if (divN)
        divN.className = 'hdn'
    }
  }
  return stopEventPropagation(e);
}

/********************************************************
* Tooltip
*********************************************************/
var Tooltip = {
  TOOLTIP_ATTR : "tooltip",
  PROCESSED_FLAG : "tooltip_processed",
  init : function() {
    if (Popup.penBased) // pen-based devices have problem with tooltips
      return;
	  addEvent(document.body, "mouseover", this.onMouseOver, false);
		addEvent(document.body, "mouseout", this.onMouseOut, false);
  },
  onMouseOver : function(e) {
    var thisObj = Tooltip;

    var target = getEventTarget(e);
    if(!thisObj.isProcessed(target))
      thisObj.processTooltip(target);

    var tooltipText = target.getAttribute(thisObj.TOOLTIP_ATTR);
    var toShow = !(advancedTooltip.isShiftRequired() && !e.shiftKey);

    if(tooltipText != null) {
      if(toShow) { //  && Popup.allowTooltip()
        thisObj.showTooltip(e, target, tooltipText);
      }
      else
        thisObj.showInStatus(tooltipText);
    }
  },

  onMouseOut : function(e) {
    if (typeof getDocumentEvent == 'undefined') return;
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
    if (Popup.delayedPopup && Popup.delayedPopup.isTooltip()) {
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
    return stopEventPropagation(e);
  },

  processTooltip : function(obj) {
    var titleText = obj.title;
    obj.title = '';
    var parentA = obj.parentNode;
    if (parentA && parentA.tagName.toLowerCase() == 'a') {
      if(titleText.length != 0)
        titleText += '<br><i><small>' + parentA.title + '</small></i>';
      else
       titleText = parentA.title;
      parentA.title = '';
    }
    if(titleText != null && titleText.length != 0)
      obj.setAttribute(this.TOOLTIP_ATTR, titleText);
    obj.setAttribute(this.PROCESSED_FLAG, "y");
  },
  isProcessed : function(obj) {
    return (obj.getAttribute(this.PROCESSED_FLAG) != null);
  },
  showTooltip : function(e, target, tooltipText) {
    var divId    = 'system_tooltip';
    var iframeId = 'tooltipIframe';
    var tooltipDiv = document.getElementById(divId);
    if (!tooltipDiv) {
      return false; // in FF for some reason if page not fully loaded this div is
                    // not yet defined
    }
    var ifrRef = document.getElementById(iframeId);
    if (!ifrRef)
      throw new Error("document must contain iframe '" + iframeId + "' to display enhanced tooltip");
    Popup.open(e, divId, target, ifrRef, 20, 25, 1000, tooltipText); // open with
  },
  showInStatus : function(tooltipText) {
    var plainTooltipText = tooltipText.replace(/<\/?[^>]+(>|$)/g, " ")
    window.status = plainTooltipText;
  },
  closeTooltip : function() {
    if(Popup.tooltipPopup != null)
      Popup.tooltipPopup.close();
    if(Popup.openTimeoutId != null) {
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }
  }
}


/**************************************
* ListBoxesHandler
***************************************/
var ListBoxesHandler = {
  init : function(form) {
    for (var j = 0; j < form.elements.length; j++) {
      var elem = form.elements[j];
      if (elem.type && elem.type.toUpperCase() == 'TEXT' &&  // only on TEXT
                                                              // fields
          elem.id) {                                         // and those that

        addEvent(elem, 'keydown',    this.autoCompleteOnKeyDown,     false);
        addEvent(elem, 'focus',      this.autoCompleteOnFocus,       false);
        addEvent(elem, 'blur',       this.autoCompleteOnBlur,        false);
        addEvent(elem, 'mouseout',   this.autoCompleteOnMouseout,    false);
        // addEvent(elem, 'change', onFormFieldChange, false);
        // addEvent(elem, 'blur', onFormFieldChange, false);
        // addEvent(elem, 'click', onFormFieldClick, false);
      }
      else if (elem.type && elem.type.toUpperCase() == 'TEXTAREA') {
        var rows = elem.attributes['rows'];
        var cols = elem.attributes['cols'];
        
        /* // IS IT USED?!
        if (rows)
          initialValues[elem.name + '.attributes.rows'] = rows.value;
        if (cols)
          initialValues[elem.name + '.attributes.cols'] = cols.value;
        */
        
        if (!elem.value || elem.value == '') {
          elem.setAttribute('rows', 1);
          elem.setAttribute('cols', 10);
          // elem.attributes['cols'].value = 10;
          addEvent(elem, 'focus', this.textAreaOnFocus,  false);
          addEvent(elem, 'blur',  this.textAreaOnBlur,   false);
        }
      }
      else  {
          // alert(elem.name + ", " + elem.type + ", " + elem.id + ", " +
          // elem.valueType);
      }
    }
  },
  // key events handlers ----
  autoCompleteOnKeyDown : function(e) {
    e = getDocumentEvent(e); if(!e) return;
    return ListBoxesHandler.autoComplete(e);
  },
  
  autoCompleteOnFocus : function(e) {
    var target = getTargetElement(e);
    if (!target)
      return;

    if (target.internalFocus) {
      target.internalFocus = false;
      return true;
    }

    // prevent issuing select() if we got onfocus because browser window was
    // minimized and then restored
    if (target.value != target.lastText)
      target.select();
    return true;
  },
  
  autoCompleteOnBlur : function(e) {
    var target = getTargetElement(e);
    if (!target)
      return;
    target.lastText = target.value;
  },
  autoCompleteOnMouseout : function(e) {
    if (typeof getMouseOutTarget == 'undefined') return;
    var target = getMouseOutTarget(e);
    if (!target)
      return true;

    var img = document.getElementById(keyPressedImgId);
    if (!img)
      return true;

    if (currentDiv) {
      Popup.delayedClose0(currentDiv.id);
    }
  },
  
  textAreaOnFocus : function(e) {
    var target = getTargetElement(e);
    var rows = FormProcessor.getFormFieldInitialValue(target, 'rows');
    if (rows)
      target.setAttribute('rows', rows);
    else
      target.setAttribute('rows', 1);
    var cols = FormProcessor.getFormFieldInitialValue(target, 'cols');
    if (!cols) {
      target.setAttribute('cols', 10);
      cols = 10;
    }
    var c = target.getAttribute('cols');
    if (c) {
      target.setAttribute('cols', cols);
      target.style.width = "96%";
    }
  },

  textAreaOnBlur : function(e) {
    var target = getTargetElement(e);
    if (!target.value || target.value == '') {
      target.setAttribute('rows', 1);
      target.setAttribute('cols', 10);
      target.style.width = null;
    }
  },
  
  // AUTOCOMPLETE ----
  /**
  * Show popup for the text entered in input field (by capturing keyPress
  * events). Show popup only when the person stopped typing (timeout). Special
  * processing for Enter: - in Filter mode - let it submit the form. - in Data
  * Entry mode - on Enter show popup immediately, and close popup if hit Enter
  * twice.
  */
  autoComplete : function(e) {
    e = getDocumentEvent(e); if (!e) return;
    var target = getTargetElement(e);
    return this.autoComplete1(e, target);
  },

  autoComplete1 : function(e, target) {
    if (!target)
      return;
    keyPressedTime = new Date().getTime();
    var form = target.form;
    var characterCode = getKeyCode(e); // code typed by the user

    var propName  = target.name;
    var formName  = form.name; //target.id;
    var propName1 = propName;
    var idx = propName.indexOf(".", 1);
    if (idx != -1)
      propName1 = propName1.substring(0, idx);

    var fieldVerified = form.elements[propName1 + '_verified'];
    var selectItems   = form.elements[propName1 + '_select'];
    var fieldClass    = form.elements[propName1 + '_class'];
    if (characterCode == 13) { // enter
      if (!fieldVerified) { // show popup on Enter only in data entry mode
                            // (indicated by the presence of _verified field)
        // if (autoCompleteTimeoutId) clearTimeout(autoCompleteTimeoutId);
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
    if (!hotspot) // no image - this is not a listbox and thus needs no
                  // autocomplete
      return true;
    keyPressedElement   = target;
    var currentPopup = Popup.getPopup(divId);
  
    var isAuto = target.getAttribute("autocomplete");
    
    // for a stage of openning of a listbox (currentPopup == null)
    // handle arrow down as click on listbox icon.
    if(isAuto != null && isAuto == "off" && currentPopup == null && characterCode != 40)
      return;

  /*
  * !!!!!!!!!!!!! this below did not work to clear the previous popup if
  * (currentDiv) { var p = Popup.getPopup(currentDiv); if (p) p.close(); }
  */
    switch (characterCode) {
    case 38:  // up arrow
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.deselectRow();
        currentPopup.prevRow();
        currentPopup.selectRow();
      }
      else {
        this.listboxOnClick1(e, keyPressedImgId, keyPressedElement.value);
        // Popup.open(e, divId, hotspot, null, 0, 16);
      }
      return stopEventPropagation(e);
    case 40:  // down arrow
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.deselectRow();
        currentPopup.nextRow();
        currentPopup.selectRow();
      }
      else {
        this.listboxOnClick1(e, keyPressedImgId, keyPressedElement.value);
        // Popup.open(e, divId, hotspot, null, 0, 16);
      }
      return stopEventPropagation(e);
    case 37:  // left arrow
    case 39:  // right arrow
    case 33:  // page up
    case 34:  // page down
    case 36:  // home
    case 35:  // end
      return true;
    case 27:  // esc
      if (currentPopup && currentPopup.isOpen()) {
        currentPopup.close();
      }
      return stopEventPropagation(e);
    case 16:  // shift
    case 17:  // ctrl
    case 18:  // alt s
    case 20:  // caps lock
      return true;
    case 127: // ctrl-enter
    case 13:  // enter
      if (currentPopup && currentPopup.isOpen()) {
        // listboxOnClick1(keyPressedImgId, keyPressedElement.value);
        currentPopup.popupRowOnClick1(e, null, target);
        return stopEventPropagation(e); // tell browser not to do submit on
                                          // 'enter'
      }
    case 9:   // tab
      if (currentDiv)
        currentPopup.close();
      return true;
    case 8:   // backspace or "C" in S60
      if(Browser.s60Browser) {
        if (currentPopup && currentPopup.isOpen()) {
            currentPopup.close(); // the same like esc
          }
          return stopEventPropagation(e);
      }
    case 46:  // delete
      break;
    }
    if (currentPopup)
      currentPopup.close();

    // for numeric value - do not perform autocomplete (except arrow down, ESC,
    // etc.)
    var ac = target.getAttribute('autocomplete');
    if (ac && ac == 'off')
      return true;
    keyPressedElement.style.backgroundColor='#ffffff';
    if (fieldVerified) fieldVerified.value = 'n'; // value was modified and is not
                                                  // verified yet (i.e. not chose
                                                  // from the list)
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
        selectItems.value   = '';  // value was modified and is not verified yet
                                    // (i.e. not chose from the list)
    }
    e = cloneEvent(e);

    var checkSubscribe = form.elements[propName + "_subscribe"];
    if (checkSubscribe)
      checkSubscribe.checked = true;
    var f = function() { ListBoxesHandler.autoCompleteTimeout(e, keyPressedTime); };
    autoCompleteTimeoutId = setTimeout(f, Popup.autoCompleteDefaultTimeout);
    // make property label visible since overwritten inside the field
    var filterLabel = document.getElementById(propName1 + "_span");
    if (filterLabel) {
      filterLabel.style.display = '';
      filterLabel.className = 'xs';
    }
    if (currentPopup)
      clearOtherPopups(currentPopup.div);
    return true;
  }, 

  autoCompleteTimeout : function(e, invocationTime) {
    if (keyPressedTime > invocationTime) {
      return;
    }
    if (!keyPressedImgId)
      return;

    var hotspot = document.getElementById(keyPressedImgId);
    if (!hotspot) {
      return true;
    }

    if (keyPressedElement.value.length == 0) // avoid showing popup for empty
      return;
    this.listboxOnClick1(e, keyPressedImgId, keyPressedElement.value);
  },
  
  // Opens the popup when icon is clicked
  listboxOnClick : function(e, target) {
    this.listboxOnClick1(e, target.id);
    stopEventPropagation(e);
  },

  // Opens the popup when needed, e.g. on click, on enter, on autocomplete
  listboxOnClick1 : function(e, imgId, enteredText, enterFlag) {
    if (Popup.openTimeoutId) {                  // clear any prior delayed popup
                                                // open
      clearTimeout(Popup.openTimeoutId);
      Popup.openTimeoutId = null;
    }

    var propName1 = imgId.substring(0, imgId.length - "_filter".length);   // cut
                                                                            // off
                                                                            // "_filter"
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
    /*
    * 'viewColsList' for does not have input fields where to set focus.
    * form.elements[originalProp] returns list of viewCols properties to choose
    * from to display in RL
    */
    if (!isGroupBy  &&  form  &&  currentFormName != "viewColsList"  &&  currentFormName != "gridColsList"  && originalProp.indexOf("_class") == -1) {
      var chosenTextField = form.elements[originalProp];
      if (chosenTextField && chosenTextField.focus) {
        chosenTextField.focus();
        // insertAtCursor(chosenTextField, '');
        // setCaretToEnd(chosenTextField);
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
    // currentDiv = document.getElementById(divId);

    var div = loadedPopups[divId];
    var hotspot = document.getElementById(imgId);

    // Use existing DIV from cache (unless text was Enter-ed - in which case
    // always redraw DIV)
    if (!enteredText && div != null) {
      hideResetRow(div, currentFormName, originalProp);
      Popup.open(e, divId, hotspot, null, 0, 16);
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
  // if (formAction != "showPropertiesForEdit" && formAction != "mkResource") {
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
  // else if (currentFormName.indexOf("horizontalFilter") == 0)
  // allFields = true;
        params += FormProcessor.getFormFilters(form, allFields);
      /*
      * } else { url = url + "&type=" + form.elements['type'].value +
      * "&-$action=" + formAction; var s = getFormFiltersForInterface(form,
      * propName); if (s) url = url + s; var uri = form.elements['uri']; if (uri) {
      * if (formAction == "showPropertiesForEdit") url = url + "&uri=" +
      * encodeURIComponent(uri.value); else url = url + "&$rootFolder=" +
      * encodeURIComponent(uri.value); } }
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
    div.removeAttribute('eventHandlersAdded');
    postRequest(e, url, params, div, hotspot, Popup.load);
  }

}

// handle anchors with help of BODY's event
function onLinkClick(e) {
  e = getDocumentEvent(e);
  if (!e)
    return;

  var anchor = getTargetAnchor(e);
  if (!anchor || !anchor.id)
    return;

  var id = anchor.id;
  var idLen = id.length;

  if (id.startsWith("-inner.")) {
    onClickDisplayInner(e, anchor);
  }
  else if (id.startsWith('menuLink_')) {
    menuOnClick(e, anchor);  
  }
  else if (id.indexOf("_filter", idLen - "_filter".length) != -1) {
    ListBoxesHandler.listboxOnClick(e, anchor);
  }
  else if (id.indexOf("_boolean", idLen - "_boolean".length) != -1  ||
        id.indexOf("_boolean_refresh", idLen - "_boolean_refresh".length) != -1) {
    changeBoolean(e, anchor);
  }
  else
    onClick(e, anchor);
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
  if (propName.indexOf("list.") == 0) {
// var strippedProp = propName.substring(5);
// var ul = document.getElementById(strippedProp);
    var ul = document.getElementById(propName);

    if (!ul) {
      var strippedProp = propName.substring(5);
      r = displayInner(e, innerListUrls[strippedProp]);
    }
    else {
      var li = ul.getElementsByTagName("li");
      r = displayInner(e, decodeURL(li[0].innerHTML));
    }
  }
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
 * Registered to receive control on a click on any link. Adds control key
 * modifier as param to url, e.g. _ctrlKey=y
 */
function onClick(e, link) {
  detectClick = true;
  var p;

  // add current dashboard ID and current tab ID to url if they are not there
  var a = link.href;
  addCurrentDashboardAndCurrentTab(link);
  if     (e.ctrlKey) {
    p = '_ctrlKey=y';
  }
  else if(e.shiftKey) {
    p = '_shiftKey=y';
  }
/*
 * else if(e.altKey) { p = '_altKey=y'; var frameId = 'bottomFrame'; var
 * bottomFrame = frames[frameId]; // show content in a second pane // if
 * (bottomFrame) { removeModifier(link, '_shiftKey=y'); removeModifier(link,
 * '_ctrlKey=y'); removeModifier(link, '_altKey=y'); return displayInner(e,
 * link.href); } }
 */
  if (p) {
    removeModifier(link, '_shiftKey=y');
    removeModifier(link, '_ctrlKey=y');
    removeModifier(link, '_altKey=y');
    addUrlParam(link, p, null);

    var rc = stopEventPropagation(e);
    document.location.href = link.href;
    return rc;
  }
  else if (link.id  &&  link.id.startsWith('-inner')) {      // display as on-page dialog
    return onClickDisplayInner(e, link);
  }

  var idx = link.href.indexOf("&-ulId=");

  if (idx == -1)
    return true;
  var idx1 = link.href.indexOf("&", idx + 1);
  var ulId;
  if (idx1 == -1)
    ulId = link.href.substring(idx + 7);
  else
    ulId = link.href.substring(idx + 7, idx1);
  var ul = document.getElementById(ulId);
  if (ul) {
    var li = ul.getElementsByTagName("li");
    if (li) {
      var qs = li[0].innerHTML;
      if (qs.length > 0)
        link.href += "&-paging=" + encodeURIComponent(decodeURL(qs));
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

// ********************* helper functions ********************************

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
/* Get X,Y when not tracking mouse */
function getCoordinates(obj) {

    var xy = getObjectUpperLeft(obj);

    /* Adjust position for screen right and bottom screen edge */
    var x = fitWindowWidth(xy.x);
    var y = fitWindowHeight(xy.y);

    return {Xoffset: x, Yoffset: y};
}

function getMouseEventCoordinates(e) {
  var posx = 0;
  var posy = 0;

  var sc = getScrollXY();
  if (e.pageX || e.pageY) {
    // alert('e.pageY: ' + e.pageY);
    posx = e.pageX;
    posy = e.pageY;
  }
  else if (e.clientX || e.clientY) {
    // alert('e.clientY: ' + e.clientY);
    posx = e.clientX + sc[0];
    posy = e.clientY + sc[1];
  }
  // in case if event object is "empty".
  if(e.screenX == 0 && e.screenY == 0) {
    var target = getEventTarget(e);
    posx = findPosX(target);
    posy = findPosY(target);
  }

  // posx and posy contain the mouse position relative to the document
  return {x:posx, y:posy};
}

function fitWindowWidth(tipX) {
    /*
     * Determine best page X that keeps object in window. If object doesn't fit
     * adjust to left edge ot window. Compare object X coordinate to max X not
     * going out of window and use left most. Then check object X is not past
     * left most visible page coordinate.
     */

    /* Don't go past right edge of window */

    var rightMaxX = getRightPagePos() - (box.offsetWidth + 16); // 16 for
                                                                // scrollbar

    tipX = (rightMaxX < tipX) ? rightMaxX : tipX;

    /* But, don't go past left edge of window either */
    var leftMinX = getLeftPagePos();
    tipX = (tipX < leftMinX) ? leftMinX : tipX;

    return tipX;
}// eof fitWindowWidth

function getRightPagePos() {
    /*
     * Determine page offset at right of screen (it's different than window
     * width) Here the pixles the page has been scrolled left is added to window
     * width
     */
    var nRight;

    if (typeof window.srcollX != "undefined") {
        // "NN6+ FireFox, Mozilla etc."
        nRight = window.innerWidth + window.scrollX;
    }
    else if (typeof window.pageXOffset != "undefined") {
        // NN4 code still in NN6 + but scrollX was added
        nRight = window.innerWidth + window.pageXOffset;
    }
    else if (document.documentElement && document.documentElement.clientWidth){
        // document.compatMode == "CSS1Compat" that is IE6 standards mode"
        nRight = document.documentElement.clientWidth + document.documentElement.scrollLeft;
    }
    else if (document.body && document.body.clientWidth) {
        // document.compatMode != "CSS1Compat" that is quirks mode IE 6 or IE <
        // 6 and Mac IE
        nRight = document.body.clientWidth + document.body.scrollLeft;
    }

    return nRight;
}// eof getRightPagePos

function getLeftPagePos() {
    var nLeft;

    if (typeof window.srcollX != "undefined") {
        // "NN6+ FireFox, Mozilla etc."
        nLeft = window.scrollX;
    }
    else if (typeof window.pageXOffset != "undefined") {
        // NN4 code still in NN6 + but scrollX was added
        nLeft = window.pageXOffset;
    }
    else if (document.documentElement && document.documentElement.scrolLeft){
        // document.compatMode == "CSS1Compat" that is IE6 standards mode"
        nLeft = document.documentElement.scrollLeft;
    }
    else if (document.body && document.body.scrollLeft) {
        // document.compatMode != "CSS1Compat" that is quirks mode IE 6 or IE <
        // 6 and Mac IE
        nLeft = document.body.scrollLeft;
    }

    return nLeft;
}// eof getLeftPagePos

function fitWindowHeight(tipY) {
    /*
     * Compare calculated max acceptable page offset to toolTip X and return
     * smallest
     */

    /* Don't go below bottom of window. Put above target if moved. */
    var bottomMaxY = getBottomPagePos() - (box.offsetHeight);
    tipY = (bottomMaxY < tipY ) ? tipY - (Yoffset + box.offsetHeight) : tipY;

    /* But, don't go past the top of window either */
    var topMinY = getTopPagePos();
    tipY = (tipY < topMinY) ? topMinY : tipY;

    return tipY
}// eof fitWindowHeight

function getBottomPagePos() {
    /*
     * Determine page offset at bottom of screen (it's different than window
     * height) Here the pixles the page has been scrolled up is added to window
     * height
     */
    var nBottom;

    if (typeof window.scrollY != "undefined" ) {
        // NN6+ FireFox, Mozilla etc.
        nBottom = window.innerHeight + window.scrollY;
    }
    else if (typeof window.pageYOffset != "undefined") {
        // NN4 still in NN6 + but NN6 and Mozilla added scrollY
        nBottom = window.innerHeight + window.pageYOffset;
    }
    else if (document.documentElement && document.documentElement.clientHeight){
        // document.compatMode == "CSS1Compat" that is IE6 standards mode
        nBottom = document.documentElement.clientHeight + document.documentElement.scrollTop;
    }
    else if (document.body && document.body.clientHeight) {
        // document.compatMode != "CSS1Compat" that is quirks mode IE 6 or IE <
        // 6 and Mac IE
        nBottom = document.body.clientHeight + document.body.scrollTop;
    }
    return nBottom;
}// eof getBottomPagePos

function getTopPagePos() {
    var nTop;

    if (typeof window.scrollY != "undefined" ) {
        // NN6+ FireFox, Mozilla etc.
        nTop= window.scrollY;
    }
    else if (typeof window.pageYOffset != "undefined") {
        // NN4 still in NN6 + but NN6 and Mozilla added scrollY
        nTop = window.pageYOffset;
    }
    else if (document.documentElement && document.documentElement.scrollTop){
        // document.compatMode == "CSS1Compat" that is IE6 standards mode
        nTop = document.documentElement.scrollTop;
    }
    else if (document.body && document.body.scrollTop) {
        // document.compatMode != "CSS1Compat" that is quirks mode IE 6 or IE <
        // 6 and Mac IE
        nTop = document.body.scrollTop;
    }
    return nTop;
}// eof getTopPagePos
function getBaseUri() {
  var baseUriO = document.getElementsByTagName('base');
  var baseUri = "";
  if (baseUriO) {
    baseUri = baseUriO[0].href;
    if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
      baseUri += "/";
  }
  return baseUri;
}
/*-------------------------------------- end tootip coordinates -------------------*/
/**
 * function that adds a title (taken from page HEAD) of current page to a url
 * that is passed as a parameter
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
// finalUrl = urlStr.substring(0, idx1 + 1) + 'plain/' + urlStr.substring(idx1 +
// 1);
  }

  var idx = finalUrl.indexOf('?');
  if (idx == -1) {
    idx = finalUrl.length;
    finalUrl += '?';
  }
  else
    finalUrl += '&';
  finalUrl += "-inner=y"; // "hideComments=y&hideMenuBar=y&hideNewComment=y&hideHideBlock=y&-inner=y";

  var hotspot = getEventTarget(e);
  var url    = finalUrl;
  var params = null;
// if (finalUrl.length > 2000) {
    url    = finalUrl.substring(0, idx);
    params = finalUrl.substring(idx + 1);
// }

  var div = document.getElementById('pane2');
  postRequest(e, url, params, div, hotspot, showDialog);
  // bottomFrame.location.replace(finalUrl);
  // var timeOutFunction = function () { showDialog(div, hotspot); };
  // setTimeout(timeOutFunction, 50);

  return stopEventPropagation(e);
}

/**
 * copies html loaded via ajax into a div
 */
function showDialog(event, div, hotspot, content) {
  var frameId = 'popupFrame';
  if (!content) {
    if (!frameLoaded[frameId]) {
      var timeOutFunction = function () { showDialog(event, div, hotspot) };
      setTimeout(timeOutFunction, 50);
      return;
    }
    frameLoaded[frameId] = false;

    // -------------------------------------------------
    var frameBody = frames[frameId].document.body;
    var frameDoc  = frames[frameId].document;
    var frameBody = frameDoc.body;
    var d = frameDoc.getElementById("corePageContent");
    if (d)
      frameBody = d;

    content = frameBody.innerHTML;
  }

  var re = eval('/' + div.id + '/g');
  content = content.replace(re, div.id + '-removed');  // prevent pane2 from appearing 2 times in the document
  var re = eval('/' + frameId + '/g');
  content = content.replace(re, frameId + '-removed'); // prevent dialogIframe from appearing 2 times in the document
  setInnerHtml(div, content);
  showDialog1(event, div, hotspot);
}

function showDialog1(event, div, hotspot) {
  var iframe = document.getElementById('dialogIframe');

  if(FullScreenPopup.show(div, hotspot) == false)
    setDivVisible(event, div, iframe, hotspot, 16, 16);

  FormProcessor.initForms(div);
  // execute JS code of innerHTML
  ExecJS.runDivCode(div);
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
                  // " 'controlname' : '" + fromDateField + "' "
                  "};" +

                  "var _init_to = { " +
                  "      'formname' : '" + formName + "', " +
                  "      'dataformat' : 'M-d-Y', " +
                  "      'replace' : true, " +
                  "      'selected', new Date(), " +
                  "      'watch', true, " +
                  // " 'controlname' : '" + toDateField + "' "
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
  else if (typeof elm.innerText != "undefined") {             // proprietary:
                                                              // IE4+
    text = elm.innerText;
  }
  return text;
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

function swapNodes(node1, node2) {
  if(node1.swapNode) {
    node1.swapNode(node2);
    return;
  }
  var parent1 = node1.parentNode;
  var parent2 = node2.parentNode;
  var nextSibling1 = node1.nextSibling;
  var nextSibling2 = node2.nextSibling;

  if(nextSibling1)
    parent1.insertBefore(node2, nextSibling1);
  else
    parent1.appendChild(node2);

  if(nextSibling2)
    parent2.insertBefore(node1, nextSibling2);
  else
    parent2.appendChild(node1);
}



// *********************************** Icon/Image effects
// **************************************
var lowOpacity  = 60;
var highOpacity = 100;
var browserDetect;
var timeouts = new Array();

function unfadeOnMouseOut(e) {
  var target = getMouseOutTarget(e);
  if (!target) {
    target = getTargetElement(e);
    // alert("unfade canceled for: " + target + ", id: " + target.id + ",
    // target.tagName: " + target.tagName);
    return false;
  }

  return unfade(target);
}

function unfadeOnMouseOver(e) {
  var target = getMouseOverTarget(e);
  if (!target) {
    target = getTargetElement(e);
    // alert("unfade canceled for: " + target + ", id: " + target.id + ",
    // target.tagName: " + target.tagName);
    //alert("unfade canceled: e.target: " + e.target + ", e.srcElement: " + e.srcElement + ", e.currentElement: " + e.currentElement);
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
  // alert("highlighting: " + target.id);
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
  var param = FormProcessor.getFormFilters(form, true);
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
  if (typeof elem_.tagName == 'undefined')
    return null;
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
  Popup.open(e, 'gallery', hotspot1, null, 0, 19);
  return true;
}

function showLargeImage(e, current, largeImageUrl) {
  var div = document.getElementById('gallery');
  var img = document.getElementById('galleryImage');
  if(!div || !img)
    return;

  makeDivAutosize(div);

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

	  hotspot1 = target;
	  hotspot1.forcedPosition = Popup.POS_LEFT_TOP;
	  addEvent(img, 'load',  largeImageOnLoad,  false);
	  img.src = "";
	  img.src = largeImageUrl;
	  return true;
  }

  img.src = "";

  if (div.style.display == "block") {
    div.style.display = "none";
    // img.src always has host in it; largeImageUrl not always that is why using
    // indexOf
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
	  titleObj.noWrap = true;
  }

  hotspot1 = current;
  hotspot1.forcedPosition = Popup.POS_LEFT_TOP;
  addEvent(img, 'load',  largeImageOnLoad,  false);
  img.src = largeImageUrl;
  return true;
}

// makes div / container to fit to content size.
function makeDivAutosize(div, fitHeightOnly) {
  var stl = div.style;
  if(typeof fitHeightOnly == 'undefine')
    fitHeightOnly = false;
  if(Browser.ie) { // IE
    stl.height = "1px";
    if(!fitHeightOnly)
      stl.width = "1px";
  }
  else if(stl.width != "auto") {
    stl.height = "auto";
    if(!fitHeightOnly)
      stl.width = "auto";
  }
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

// iframe.style.display = "none";

  var anchor = a[0].href;
  return addAndShow1(anchor, e);
}

var calendarCell; // last cell on which user clicked
var lastPopupRowTD = null;


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
 * iframeWindow.location.replace(newUri); // load data from server into iframe //
 * window.open(newUri); // return; setTimeout(addAndShowWait, 50);
 */
    var div = document.createElement('div');
    div.style.display = "none";
    postRequest(event, newUri, params, div, hotspot, addAndShowWait);
    return stopEventPropagation(event);
  } catch (er) {
    alert(er);
  }
}

function cancelItemAndWait(event) {
  var divId = "resourceList_div";
  var divCopyTo = document.getElementById(divId);
  var elms = divCopyTo.getElementsByTagName('a');
  var currentItem;
  var currentItemA;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id  &&  elms[j].id == 'currentItem') {
      currentItemA = elms[j];
      currentItem = elms[j].href;
      break;
    }
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

  elms = divCopyTo.getElementsByTagName('tr');
  var currentTr;
  var resultsTr;
  var totalsTr;

  var newCurrentTr;
  var headerRow;
  var recsNmb;
  for (var j=0; j<elms.length; j++) {
    var tr = elms[j];
    if (!tr.id)
      continue;
    if (tr.id == 'results') {
      var tds = tr.childNodes;
      for (var i=0; i<tds.length; i++) {
        if (tds[i].id && tds[i].id == 'results') {
          var r = tds[i].innerHTML;
          var idx = r.indexOf('-');
          var idx1 = r.indexOf('<', idx);
          var recs = r.substring(idx + 1, idx1);
          recsNmb = parseInt(recs) - 1;
          if (recsNmb == 0)
            resultsTr = tr;
          else {
            var newInnerHTML = r.substring(0, idx + 1) + recsNmb;
            idx = r.indexOf(recs, idx1);

            newInnerHTML += r.substring(idx1, idx) + recsNmb;
            tds[i].innerHTML = newInnerHTML;
          }
        }
      }
    }
    else if (tr.id == 'header')
      headerRow = j;
    else if (tr.id == currentItem) {
      currentTr = tr;
      if (recsNmb) {
        if (elms.length > j + 2)
          newCurrentTr = elms[j + 1];
        else if (j - 1 != headerRow)
          newCurrentTr = elms[j - 1];
      }
    }
    else if (tr.id == 'totals') {
      totalsTr = tr;
      if (recsNmb == 0)
        break;
      var tds = tr.getElementsByTagName('td');
      var curTrTds = currentTr.getElementsByTagName('td');
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
          // since first cell of Total tr has colspan=2, the column # in
          // resources TR that referes to the same property will reside in # + 1
          // column
          var curTotal = extractTotalFrom(curTrTds[i + 1].innerHTML);

          total -= curTotal;
          total = Math.round(total * 100)/100;
          var totS = '' + total;
          var itot = totS.indexOf(".");
          if (itot == -1)
            totS += ".00";
          else if (itot == totS.length - 2)
            totS += "0";
          tds[i].innerHTML = tot.substring(0, startDigit) + totS;
        }
      }
    }
  }
  if (newCurrentTr) {
    newCurrentTr.style.backgroundColor = '#F5ABE6';
    var a = newCurrentTr.getElementsByTagName('a');
    var h = a[0].href;
    var idx = h.indexOf('&uri=');
    var idx1 = h.indexOf('&', idx + 1);
    var uri;
    if (idx1 == -1)
      uri = decodeURIComponent(h.substring(idx + 5));
    else
      uri = decodeURIComponent(h.substring(idx + 5, idx1));
    if (uri.indexOf('/hosts/') != -1) {
      idx = h.indexOf('/v.html');
      idx1 = uri.indexOf('/', 7);
      uri = h.substring(0, idx) + uri.substring(idx1);
    }
    currentItemA.href = newCurrentTr.id; //uri;
  }
  var tbody  = currentTr.parentNode;
  tbody.removeChild(currentTr);
  if (recsNmb == 0) {
    tbody = resultsTr.parentNode;
    tbody.removeChild(resultsTr);
    tbody = totalsTr.parentNode;
    tbody.removeChild(totalsTr);
  }
}

function addAndShowWait(event, body, hotspot, content, url, noInsert, isReplace)	{
  var frameId = "resourceList";
  if (!noInsert) {
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
  }
  var divCopyTo = document.getElementById(frameId + "_div");
  if (!divCopyTo) {
    throw new Error("Warning: target div not found: " + frameId + "_div");
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
      // alert(currentItem);
      break;
    }
  }
  // Find tr that needed to be inserted in the list
  var elms = body.getElementsByTagName('tr');
  var currentTR;
  var curResultsTR;
  var found;
  for (var j=0; j<elms.length; j++) {
    if (elms[j].id) {
      if (elms[j].id == currentItem) {
        currentTR = elms[j];
        found = true;
      }
      else if (elms[j].id == "results")
        curResultsTR = elms[j];
    }
    else if (noInsert) {
      if (!found)
        currentTR = elms[j];
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
          tbody.removeChild(elms[j]);
          // copyTableRow(tbody, rowIndex, currentTR);
          if (j == elms.length)
            tbody.appendChild(currentTR);
          else {
            // alert(currentTR.id + ', ' + elms[j].innerHTML);
            tbody.insertBefore(currentTR, elms[j]);
          }
        }
        else
          elms[j].style.backgroundColor = '';
        break;
      }
    }
  }

// divCopyTo.innerHTML = body.innerHTML;
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
          if (idx == -1) {
// tds[i].innerHTML = curResultsTR.innerHTML;
            continue;
          }
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
          // since first cell of Total tr has colspan=2, the column # in
          // resources TR that referes to the same property will reside in # + 1
          // column
          var curTotal = extractTotalFrom(curTrTds[i + 1].innerHTML);
          total += curTotal;
          if (oldCurrentTR) {
            var oldTotal = extractTotalFrom(oldCurTrTds[i + 1].innerHTML);
            total -= oldTotal;
          }
          total = Math.round(total * 100)/100;
          var totS = '' + total;
          var itot = totS.indexOf(".");
          if (itot == -1)
            totS += ".00";
          else if (itot == totS.length - 2)
            totS += "0";
          tds[i].innerHTML = tot.substring(0, startDigit) + totS;
        }
      }
    }
    else if (!oldCurrentTR  &&  tr.id == 'header') {
      headerTR = tr;
      headerTRidx = j;
      var tbody  = tr.parentNode;
      var trElms = tbody.childNodes;
      var pos = 1;
      var trNmb = 0;
      var headerIdx = 0;
      for (var ii=0; ii<trElms.length; ii++) {
        var tagName = trElms[ii].tagName;
        if (!tagName ||  tagName.toLowerCase() != 'tr')
          continue;
        else if (headerIdx  && pos == 1)
          pos = ii;
        else if (trElms[ii].id == 'header')
          headerIdx++;
        trNmb++;
      }
      // var newTr = document.importNode(currentTR, true);
// copyTableRow(tbody, pos, currentTR);
      if (pos == trNmb || pos == 0) {
        tbody.appendChild(currentTR);
      }
      else {
        tbody.insertBefore(currentTR, trElms[pos]);
      }
    }
  }
  // This is the first element in RL. That means that 'Total' line was not
  // formed
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
  // resourceListEdit(divCopyTo);
  var anchors = divCopyTo.getElementsByTagName('a');
  for (var i=0; i<anchors.length; i++)
    addBooleanToggle(anchors[i]);
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
  var params = FormProcessor.getFormFilters(form, true);
  var url = "FormRedirect?JLANG=en" + params; // HACK: since form.action returns
                                              // the value of '&action='
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
  return stopEventPropagation(e);
}
// Close neiboghring bookmark and update main Bookmark
function closeDiv(e, hideDivId) {
  e = getDocumentEvent(e);

  var elm = getTargetElement(e);
  var div = document.getElementById(hideDivId);
  if (!elm) {
    hideDiv(e, hideDivId);
    return stopEventPropagation(e);
  }
  a = elm;
  if (elm.tagName.toLowerCase() != 'a')
    a = elm.parentNode;
  var url = a.href;
  if (url == 'about:blank') {
    var widget = hideDivId.substring("widget_".length);
    if (isNaN(widget))
      hideDiv(e, hideDivId);
    else {
      var bookmarkBase = document.getElementById('bookmarkBlock');
      var uri = bookmarkBase.innerHTML + widget;
      postRequest(e, 'delete', 'uri=' + encodeURIComponent(uri), div, elm, closeDivCallback);
    }

    return stopEventPropagation(e);
  }
  var ret = stopEventPropagation(e);
  var idx = url.indexOf('?');
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, closeDivCallback);

  function closeDivCallback(e, div) {
    hideDiv(e, div.id);
    hideDiv(e, div.id + '_back');
    var idx = hideDivId.lastIndexOf('=');
    // find tr in dashboard menu that corresponds to deleted widget and hide it
    var tr = document.getElementById('dm_' + hideDivId.substring(idx + 1));
    if (tr) {
      tr.style.visibility = Popup.HIDDEN;
      tr.style.display = "none";
    }
  }
  return ret;
}

// Show/hide all neiboghring bookmarks and update main Bookmark
function showHideAll(e, divId) {
  e = getDocumentEvent(e);

  var a = getTargetElement(e);
  var elm = a.firstChild;
  var showAll = elm.src.indexOf('show.gif') != -1;

  var url = a.href;
  var idx = url.indexOf('?');
  var div = document.getElementById(divId);
  var href = document.location.href;
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, showHideCallback);

  function showHideCallback() {
    var idx = href.indexOf("&-showAll=");
    if (idx != -1) {
      var idx1 = href.indexOf("&", idx + 1);
      var isShowAll = href.charAt(idx + 10) == 'y';
      var href1 = href.substring(0, idx + 10);
      if (isShowAll)
        href1 += "n";
      else
        href1 += "y";
      if (idx1 != -1)
        href1 += href.substring(idx1);
      href = href1;
    }
    else
      href += "&-showAll=y";
    document.location.href = href;
  }
  return stopEventPropagation(e);
}
// Minimize/restore neiboghring bookmark and update main Bookmark
function minimizeRestoreDiv(e, hideDivId, property) {
  e = getDocumentEvent(e);

  var elm = getTargetElement(e);
  var div = document.getElementById(hideDivId);
  if (!elm) {
    minMax(e, hideDivId);
    return stopEventPropagation(e);
  }
  var a;
  if (elm.tagName.toLowerCase() == 'a')
    a = elm;
  else
    a = elm.parentNode;
  var url = a.href;
  if (url == 'about:blank') {
    minMax(e, hideDivId);
    return stopEventPropagation(e);
  }
  var idx = url.indexOf('?');
  var propParam = '&.' + property + '=';
  var idx1 = url.indexOf(propParam);
  if (idx1 != -1) {
    var pos = idx1 + propParam.length;
    if (url.charAt(pos) == '-')
      a.href = url.substring(0, pos) + '%2B' + url.substring(pos + 1);
    else
      a.href = url.substring(0, pos) + '-' + url.substring(pos + 3);
  }
  var ret = stopEventPropagation(e);
  postRequest(e, url.substring(0, idx), url.substring(idx + 1), div, elm, minMaxAndFlip);
  return ret;
}
// Dummy callback that is called after updating main boolmark
function hideDiv(e, hideDivId) {
  var div = document.getElementById(hideDivId);
  if (!div)
    return;
  div.style.visibility = Popup.HIDDEN;
  div.style.display = "none";
  return stopEventPropagation(e);
}

function showDiv1(e, showDivId) {
  activateDiv(e, showDivId);
  displayDiv(e, showDivId);
}

function activateDiv(e, showDivId) {
  var div = document.getElementById(showDivId);
  if (!div)
    return;
  div.style.display = "block";
}

function displayDiv(e, showDivId) {
  var div = document.getElementById(showDivId);
  if (!div)
    return;
  div.style.visibility = Popup.VISIBLE;
}

function minMaxAndFlip(e, div) {
  var hideDivId = div.id;
  if (hideDivId.indexOf('_min') != -1) {
    var showDivId = hideDivId.substring(0, hideDivId.length - 4);
    hideDiv(e, showDivId + "_back");
    activateDiv(e, showDivId);
    displayDiv(e, showDivId);
  }
  else
    hideDiv(e, hideDivId + "_back");
  minMax(e, hideDivId);
  return stopEventPropagation(e);
}

function minMax(e, divId) {
  e = getDocumentEvent(e);
  if (!e)
    return;
  var elm = getTargetElement(e);
  if (!elm)
    return;
  if (elm.tagName.toLowerCase() == 'a') {
    var elms = elm.childNodes;
    for (var i=0; i<elms.length; i++) {
      if (elms[i].tagName.toLowerCase() == 'img') {
        elm = elms[i];
        break;
      }
    }
  }
  var div = document.getElementById(divId);
  div.className = '';
  if (elm.src.indexOf('minimize.gif') != -1) {
    div.style.visibility = Popup.HIDDEN;
    div.style.display = "none";
    elm.src = 'icons/restore.gif';
  }
  else {
    div.style.visibility = Popup.VISIBLE;
    div.style.display = '';
    elm.src = 'icons/minimize.gif';
  }
}

function showTab(e, td, hideDivId, unhideDivId) {
  e = getDocumentEvent(e);

  var isViewAll = td.id == 'viewAll';
  var hasPrefix;
  if (hideDivId  &&  hideDivId.length != 0) {
    var tokens = hideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.HIDDEN;
      div.style.display = "none";
      var tdId;
      if (tok.charAt(0) == 'i') {
        tdId = tok.substring(5);
        hasPrefix = true;
      }
      else
        tdId = tok.substring(4);
      var hideTD = document.getElementById(tdId);
      if (hideTD) {
        var ht = hideTD.getElementsByTagName("table");
        if (ht.length != 0  &&  ht[0].className == "currentCpTabs")
          ht[0].className = "cpTabs";
        if (!isViewAll  &&  tt != null) {
          tt = document.getElementById('cp_' + tdId);
          if (tt != null)
            tt.className = "currentTabTitleHidden";
        }
      }
    }
    var tt;
    if (hasPrefix)
      tt = document.getElementById('cp_i_' + td.id);
    else
      tt = document.getElementById('cp_' + td.id);
    if (tt)
      tt.className = "currentTabTitleHidden";
  }
  var divId;
  if (hasPrefix)
    divId = 'idiv_' + td.id;
  else
    divId = 'div_' + td.id;

  var curDiv = document.getElementById(divId);
  curDiv.style.visibility = Popup.VISIBLE;
  curDiv.style.display = 'inline';

  var t = td.getElementsByTagName("table");
  if (t.length != 0  &&  t[0].className == "cpTabs")
    t[0].className = "currentCpTabs";
/*
 * if (isViewAll && tokens) { var tr = document.getElementById(tokens.length +
 * 'cp'); if (tr != null) tr.className = "currentTabTitle"; }
 */
  if (unhideDivId  &&  unhideDivId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.VISIBLE;
      div.style.display = 'inline';
      var tdId;
      if (tok.charAt(0) == 'i') {
        tdId = tok.substring(5);
        hasPrefix = true;
      }
      else
        tdId = tok.substring(4);
      var uTD = document.getElementById(tdId);
      if (uTD) {
        var uTable = uTD.getElementsByTagName("table");
        if (uTable.length != 0  &&  uTable[0].className == "currentCpTabs")
          uTable[0].className = "cpTabs";
        var controlPanelId = (hasPrefix) ? 'icp' : 'cp';
        if (uTD.id == controlPanelId  &&  uTD.className == 'currentTabTitleHidden')
          uTD.className = 'controlPanel';
        if (isViewAll) {
          var tt;
          if (hasPrefix)
            tt = document.getElementById('cp_i_' + tdId);
          else
            tt = document.getElementById('cp_' + tdId);
          tt.className = "currentTabTitle";
        }
      }
    }

  }
  ExecJS.runDivCode(curDiv);
  if(typeof ImageAnnotations != 'undefined')
    ImageAnnotations.onTabSelection(curDiv);

  resizeIframeOnTabSelection(curDiv); // IE

  return stopEventPropagation(e);
}
var curSpan;
function showTabLabel(label) {
  if (curSpan)
    curSpan.style.display = 'none';
  var span = document.getElementById(label);
  if (span)
    span.style.display = 'inline';
  curSpan = span;
}
// IE specific function. (Tab in a dialog)
function resizeIframeOnTabSelection(tabDiv) {
  var dialogIframe = document.getElementById('dialogIframe');
  if(dialogIframe && dialogIframe.style.visibility == "visible") {
    var div = getAncestorById(tabDiv, "pane2");
    if(!div)
      return;

    var SHADOW_WIDTH = 11;
    var istyle = dialogIframe.style;
    var contentObj = getChildById(div, "dataEntry");
    if (contentObj == null)
      contentObj = getChildById(div, "resourceList");
    if (contentObj != null) {
      istyle.width   = contentObj.clientWidth  - SHADOW_WIDTH + 'px';
      istyle.height  = contentObj.clientHeight - SHADOW_WIDTH + 'px';
    }
  }
}

function hideShowControlPanel(hide) {
  var td = document.getElementById('cp');
  if (!td)
    return;
  if (hide)
    td.style.display = 'none';
  else
    td.style.display = '';
  td = document.getElementById('cpTabs');
  if (!td)
    return;
  if (hide)
    td.style.display = 'none';
  else
    td.style.display = '';
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
  var etarget = getEventTarget(e);
  var isCalendar = etarget.tagName.toLowerCase() == 'img'  &&  etarget.src.indexOf('calendar.gif') != -1;

// alert('divId1=' + divId1 + ', divId2=' + divId2 + ', hotSpot=' + hotSpot + ',
// e=' + e + ', maxDuration=' + maxDuration);
  if (isCalendar  ||  e.ctrlKey)  // ctrl-enter
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
  var etarget = getEventTarget(e);
  var isCalendar = etarget.tagName.toLowerCase() == 'img'  &&  etarget.src.indexOf('calendar.gif') != -1;


// alert('divId1=' + divId1 + ', divId2=' + divId2 + ', hotSpot=' + hotSpot + ',
// e=' + e + ', maxDuration=' + maxDuration);
  if (isCalendar  ||  e.ctrlKey)  {// ctrl-enter
    if (!maxDuration) {
      Popup.open(e, divId2, hotSpot);
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
// var anchor = tr.getElementsByTagName('a');
// var s = anchor[0].innerHTML;
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
    Popup.open(e, divId2, hotSpot);
  }
  else {
    if (divId1 != null) {
      var target = getTdNode(hotSpot);
      if (!currentCell || currentCell != target)
        schedule(e);
      else
        Popup.open(e, 'e.' + divId1, hotSpot);
    }
  }
  calendarCell = hotSpot;
  return stopEventPropagation(e);
// return false;
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

function inReplyTo(event, tr, shortPropName, value) {
  tr.style.backgroundColor = '#F5ABE6';
  $t = Mobile;
  if (!$t.currentUrl)
    return;
  var currentDiv = $t.getCurrentPageDiv();
  var forms = currentDiv.getElementsByTagName('form');
  if (!forms)
    return;
  var form;
  for (var i=0; i<forms.length  &&  !form; i++) {
    var f = forms[i];
    if (f.id  &&  f.id.startsWith('tablePropertyList_'))
      form = f;
  }
  if (!form)
    return;

  form.elements["." + shortPropName].value = value;
  var anchors = currentDiv.getElementsByTagName('a');
  if (!anchors)
    return;
  var aa;
  for (var i=0; i<anchors.length  &&  !aa; i++) {
    var a = anchors[i];
    if (a.id  &&  a.id == 'currentItem')
      aa = a;
  }
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
  //  document.forms['tablePropertyList'].elements["'." + shortPropName + "_select'"] = value;
//  document.forms['tablePropertyList'].elements["'." + shortPropName + "_verified'"] = 'y';
}

function addAndShowItems(tr, e) {
  e = getDocumentEvent(e);
  if (!e)
    return stopEventPropagation(e);
  var anchor = "mkresource?type=http://www.hudsonfog.com/voc/model/portal/Comment&submit=Please+wait&.forum_verified=y&";
  var form = document.getElementById('filter');
  var forum = form.elements[".forum_select"].value;
  var title = form.elements[".title"].value;
  var href = document.location.href;
  var idx = href.indexOf("?");
  anchor += "&.forum_select=" + encodeURIComponent(forum) + "&.title=" + encodeURIComponent(title) + "&$returnUri=";

  var idx1 = href.indexOf("-currentItem=");

  if (idx1 == -1)
    anchor += encodeURIComponent("l.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1));
  else {
    var idx2 = href.indexOf("&", idx1);
    anchor += encodeURIComponent("l.html?-addItems=y&-noRedirect=y&-currentItem=" + encodeURIComponent(forum) + "&" + href.substring(idx + 1, idx1) + href.substring(idx2));
  }

  return addAndShow1(anchor, e);
}
function printReceipt(url) {
  var curUL = document.getElementById(url);
  if (!curUL)
    return;

  var li = curUL.getElementsByTagName("li");
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
// if (divs[i].id == "div_Vodka")
// alert(divs[i].style.display + "; " + divs[i].style.visibility);

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
  // IE support
  if (document.selection) {
    myField.focus();
    sel = document.selection.createRange();
    sel.text = myValue;
  }
  // MOZILLA/NETSCAPE support
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
 * In the form that has several submit buttons - this is the way we detect which
 * one was clicked
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

// helps set right div size after setDivVisible calling
// it needs only if target called twice.
// the dialog contains a table with ID = dataEntry
var isResizedOneTime = false;
function onDlgContentResize(e){
  e = getDocumentEvent(e); if (!e) return;
  if(isResizedOneTime == false) {
    isResizedOneTime = true;
    return;
  }
  var target = getEventTarget(e);
  var dlgDiv = getAncestorById(target, "pane2");
  if(!dlgDiv)
    return;

  dlgDiv.style.width  = target.offsetWidth;
  dlgDiv.style.height = target.offsetHeight;

  var iframe = document.getElementById('dialogIframe');
  if(!iframe || iframe.style.display == 'none')
    return;
  var SHADOW_WIDTH = 11;
  iframe.style.width  = target.offsetWidth - SHADOW_WIDTH;
  iframe.style.height = target.offsetHeight - SHADOW_WIDTH;

}
function setDivVisible(event, div, iframe, hotspot, offsetX, offsetY, hotspotDim) {
  if (Browser.mobile) {
    div.style.left = 0 + 'px';
    div.style.top  = 0 + 'px';
    div.style.width = screen.width;
    div.position = 'fixed';
    div.style.visibility = Popup.VISIBLE;
  }
  // "hack" resize dialog if its contents resized (twice calls of onresize)
  var tbl = getChildById(div, "dataEntry");
  if(tbl) {
    tbl.onresize = onDlgContentResize;
    isResizedOneTime = false;
  }

  var istyle   = iframe.style;
  if (Browser.ie)
    istyle.visibility    = Popup.HIDDEN;
  div.style.visibility = Popup.HIDDEN;   // mark hidden - otherwise it shows up as soon as we set display = 'inline'
  var scrollXY = getScrollXY();
  var scrollX = scrollXY[0];
  var scrollY = scrollXY[1];

  var left = 100;
  var top  = 100;

  if (hotspotDim) {
    left = hotspotDim.left;
    top  = hotspotDim.top;
  }
  else if (event || hotspot) {
    var coords = getElementPosition(hotspot, event);
    left = coords.left;
    top  = coords.top;
  }

  var screenXY = getWindowSize();
  var screenX = screenXY[0];
  var screenY = screenXY[1];

  // Find out how close hotspot is to the edges of the window
  var distanceToRightEdge  = screenX + scrollX - left;
  var distanceToBottomEdge = screenY + scrollY - top;

  // first position the div box in the top left corner in order to measure its dimensions
  // (otherwise, if position correctly and only then measure dimensions - the
  // width/height will get cut off at the scroll boundary - at least in firefox 1.0)
  div.style.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
  reposition(div,    0, 0);
  var divCoords = getElementDimensions(div);
  var margin = 40;
  // cut popup dimensions to fit the screen
  var mustCutDimension = (div.id == 'pane2' || Browser.joystickBased) ? false: true;
  // var mustCutDimension = false;
  if (mustCutDimension) {
    var xFixed = false;
    var yFixed = false;
    if (divCoords.width > screenX - margin * 2) {
      div.style.width = screenX - margin * 2 + 'px';
      xFixed = true;
    }
    if (divCoords.height > screenY - margin * 2) { // * 2 <- top & bottom margins
      div.style.height = screenY - margin * 2 + 'px';
      yFixed = true;
    }
    // recalc coords and add scrolling if we fixed dimensions
    if (typeof div.style.overflowX == 'undefined') {
      if (xFixed || yFixed) {
        div.style.overflow = "auto";
        divCoords = getElementDimensions(div);
      }
    }
    else {
      if (typeof div.style.overflowX != 'undefined') {
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
        divCoords = getElementDimensions(div);
      // reset position of the scrolls (it could be scrolled from prev. using)
      div.scrollLeft = 0;
      div.scrollTop  = 0;
    }
  }
  div.style.display    = 'none';   // must hide it again to avoid screen flicker
  // move box to the left of the hotspot if the distance to window border isn't
  // enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX + scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
    if (left - margin > 0)
      left -= margin;   // adjust for a scrollbar
    if (left < scrollX) // but not over the left edge
      left = scrollX + 1;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetX)
      left = left + offsetX;
  }

  // now adjust vertically - so we fit inside the viewport
  if (distanceToBottomEdge < divCoords.height + margin) {
    top = (screenY + scrollY) - divCoords.height;
    if ((top - scrollY)- margin > 0)
      top -= margin;   // adjust for a scrollbar
    if (top < scrollY) // but not higher then top of viewport
      top = scrollY + 1;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetY)
      top = top + offsetY;
  }

  // by now the width of the box got cut off at scroll boundary - fix it (needed
  // at least for firefox 1.0)
  div.style.width  = divCoords.width  + 'px';
  div.style.height = divCoords.height + 'px';

  var zIndex = 1;
  if (hotspot) {
    var z = hotspot.style.zIndex; // this relative zIndex allows stacking popups on top of each other
    if (z != null && z != '')
      zIndex = z;
  }
  div.style.zIndex = zIndex + 2;
  if (Browser.ie) {
    // for listboxes in Dialog - makes iframe under a listbox.
    var par = getAncestorById(div, 'pane2');
    if(par && iframe.id == 'popupIframe') {
      par.appendChild(iframe);
    }
    istyle.zIndex  = zIndex + 1;
  }


  // hack for Opera (at least at ver. 7.54) and Konqueror
  // somehow iframe is always on top of div - no matter how hard we try to set zIndex
  // so we have to live without iframe
  // var opera = navigator.userAgent.indexOf("Opera") != -1;
  // var konqueror = navigator.userAgent.indexOf("Konqueror") != -1;
  div.style.display    = 'inline';
  // commented out temporarily since listbox in dialog is not visible
  // this unfortunately will cause a problem with popup over form fields

  // Make position/size of the underlying iframe same as div's position/size
  var iframeLeft = left;
  var iframeTop = top;
  if(Browser.ie) {
    istyle.width     = divCoords.width  + 'px';
    istyle.height    = divCoords.height + 'px';
    // to make dialog shadow visible (without iframe background).
    if(div.id == 'pane2') {
      var SHADOW_WIDTH = 11;
      var contentObj = getChildById(div, "dataEntry");
      if (contentObj == null)
        contentObj = getChildById(div, "resourceList");
      if (contentObj != null) {
        istyle.width   = contentObj.clientWidth  - SHADOW_WIDTH + 'px';
        istyle.height  = contentObj.clientHeight - SHADOW_WIDTH + 'px';
      }
    }
    // to make tooltip shadow visible;
    if(div.id == 'system_tooltip') {
      var ttContent = getChildById(div, "tt_frame");
      istyle.width   = ttContent.clientWidth;
      istyle.height  = ttContent.clientHeight;
      iframeLeft += 20;
      iframeTop += 20;
    }
  }

  if (Browser.ie) // only IE has a problem with form elements 'showing through' the popup
    istyle.display = 'inline';
  reposition(div,    left, top); // move the div box to the adjusted position
  reposition(iframe, iframeLeft, iframeTop); // place iframe under div
  // if (!opera && !konqueror) {
  if (Browser.ie) // only IE has a problem with form elements 'showing through' the popup
      istyle.visibility  = Popup.VISIBLE;
  div.style.visibility = Popup.VISIBLE; // finally make div visible

  // used to close divs on "C" and for dialogs
  closingOnEsc.ready(div);
}

function setDivInvisible(div, iframe) {
  // release a popup (menu) belongs to the hidding div
  if(typeof PopupHandler != 'undefined')
    PopupHandler.checkHidingDiv(div);

  if (div.style)
    div.style.display    = "none";
  if (iframe && iframe.style)
    iframe.style.display = "none";

  // return popupIframe to body from a dialog (see setDivVisible)
  var popupIframe = getChildById(div, 'popupIframe');
  if(popupIframe)
    document.body.appendChild(popupIframe);
}

function doConfirm(msg) {
  /*
   * if (document.deleteConfirmation == msg) return; document.deleteConfirmation =
   * msg;
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
  loc = "delete?-$action=deleteAndExplore&del-yes=y&" + loc.substring(idx + 1);
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
/*
 * Creates absolute URI from base + uri. Fixing IE ignoring of base tag uri
 */
function rel(uri) {
  if (Browser.ie) {
    var b = document.getElementsByTagName('base');
    if (b  &&  b[0]  &&  b[0].href) {
      if (b[0].href.substr(b[0].href.length-1) == '/' && uri.charAt(0) == '/')
        uri = uri.substr(1);
      uri = b[0].href + uri;
    }
  }
  document.location.href = uri;
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

function loadingCueStart(e, hotspot) {
  if (!hotspot)
    return;
  var ttDiv = document.getElementById("system_tooltip");
  if (ttDiv) {
  var ttIframe = document.getElementById("tooltipIframe");
  var loadingMsg = "<div style='vertical-align: middle; font-size: 14px; color:#000000; background-color:rgb(255,252,184);'><b> loading . . . </b></div>";

  advancedTooltip.hideOptionsBtn();
  Popup.open(e, ttDiv.id, hotspot, ttIframe, 0, 0, 0, loadingMsg);
}
}

function loadingCueFinish() {
  if (Popup.tooltipPopup)
    Popup.tooltipPopup.close();
    advancedTooltip.showOptionsBtn();
}

// ******************************************** end AJAX
// ************************************************

// ****************************** form operations from forms.js
// *****************************************
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

function hideShowDivOnClick(divId, imgId){// , plusImg, minusImg) {
  div = document.getElementById(divId);
  img = document.getElementById(imgId);
  if (div.style.display == 'none') {
    div.style.display = 'block';
    img.style.display = 'none';
  }
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
  // If the height of the div content is less then 40px,
  // then the height of the div is set to the height of the div content and "more>>" link is disabled.
  if(divRef.offsetHeight < 40 && document.all) {
    document.getElementById(div).style.height=divRef.offsetHeight;
    return;
  }
  var h = Math.floor(screen.availHeight/divider);
  divRef.style.height = h;
  divRef.style.overflow = "hidden";
  if (spanRef != null && moreRef != null) {
    if (spanRef.offsetHeight > divRef.offsetHeight) {
      moreRef.style.display = "block";
    }
    else { // div must have "minimized view". Then the user clicks on "more>>"
            // link and the style of the div is changed
           // from (overflow:hidden) to (display:inline; overflow:visible).
            // This is done in (function displayFullText(div, moreDiv))
      // moreRef.style.display = "none";
      divRef.style.height = 4 * 1.33 + 'em'; // 4 rows //spanRef.offsetHeight;
      // divRef.style.overflow = "visible";
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

/** *********************** Form fields adding/removing ****************** */
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
  form.elements['.nameOnCard'].value = name;
  form.elements['.number'].value = accountNumber;
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
  form.elements['.cardholderVerificationCode'].value = "";
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

/*******************************************************************************
 * drag & drop engine
 * dragHandler implements: 1)getDragBlock 2)onStartDrag, 3) onDrag, 4) onStopDrag
 ******************************************************************************/
var DragEngine = {
	
	dragBlock : null,
	dialogIframe : null, //IE: prevents dialog from underlaid <select>
	dragHandler : null,
  // offset of left and top edges relative to "caught point"
	offsetX: null, offsetY: null,
  dragapproved : 0,
  // dragable objects with the following className  
 	classNameArr : ["dragable", "tabs", "tabs_current"],
	
	initialize: function(){
		addEvent(document, 'mousedown', this.startDrag, false);
		addEvent(document, 'mouseup', this.stopDrag, false);
		addEvent(document, 'mousemove', this.drag, false);
		this.dialogIframe = document.getElementById('dialogIframe');
	},

	startDrag: function(e){
		var thisObj = DragEngine;
		var evtobj = window.event ? window.event : e;
		var caughtObj = window.event ? event.srcElement : e.target;
		var titleObj = null;

		if((titleObj =  getAncestorById(caughtObj, "titleBar")) == null &&
		    (titleObj =  getAncestorByAttribute(caughtObj, "className", thisObj.classNameArr)) == null )
		  return;
    // possible to define handler as Attribute in html
		var dragHandlerStr = titleObj.getAttribute("draghandler");
		// or by class name here
		if(dragHandlerStr == null || dragHandlerStr.length == 0) {
  	  if(titleObj.className == "tabs" || titleObj.className == "tabs_current") {
  	    thisObj.dragHandler = TabSwap;
  	    thisObj.dragBlock = thisObj.dragHandler.getDragBlock(titleObj, caughtObj);
  	  }
  	  else // the dialog 'pane2'
  	    thisObj.dragBlock = getAncestorById(titleObj, 'pane2');
		}
		else {
  	  thisObj.dragHandler = eval(dragHandlerStr);
		  if(thisObj.dragHandler)
		    thisObj.dragBlock = thisObj.dragHandler.getDragBlock(titleObj, caughtObj);
		}

		if(!thisObj.dragBlock)
		  return;

		// warning: IE sends 2 events
		if(thisObj.dragHandler && thisObj.dragHandler.onStartDrag)
		  thisObj.dragHandler.onStartDrag(thisObj.dragBlock);

		if (evtobj.preventDefault)
			evtobj.preventDefault();

	  thisObj.dragapproved = 1;
	},
	
	drag: function(e){
  	var thisObj = DragEngine;

	  if(thisObj.dragapproved != 1)
	    return;

		var evtobj = window.event ? window.event : e;
		var scrollXY = getScrollXY();
		
		// FF3(!)/FF2 onmousedown returns wrong coordinates
		if (thisObj.offsetX == null) {
      thisObj.offsetX = evtobj.clientX - findPosX(thisObj.dragBlock) + scrollXY[0];
      thisObj.offsetY = evtobj.clientY - findPosY(thisObj.dragBlock) + scrollXY[1];
    }
		
		var x = evtobj.clientX - thisObj.offsetX + scrollXY[0];
		var y = evtobj.clientY - thisObj.offsetY + scrollXY[1];

		var allowToMove; // 2D array
		if(thisObj.dragBlock && thisObj.dragHandler && thisObj.dragHandler.onDrag) {
		    if(thisObj.dragBlock.style.position == 'absolute')
  		    allowToMove = thisObj.dragHandler.onDrag(thisObj.dragBlock, x, y);
		    else
  	      allowToMove = thisObj.dragHandler.onDrag(thisObj.dragBlock, evtobj.clientX, evtobj.clientY);
  	}

		if(thisObj.dragapproved == 1){
			if(typeof allowToMove == 'undefined' || allowToMove[0] == true)
			  thisObj.dragBlock.style.left = x;
			if(typeof allowToMove == 'undefined' || allowToMove[1] == true)
			  thisObj.dragBlock.style.top  = y;

			if(thisObj.dialogIframe != null && thisObj.dragBlock.id == 'pane2' &&
			     thisObj.dialogIframe.style.visibility == 'visible') {
			  thisObj.dialogIframe.style.left = x;
 			  thisObj.dialogIframe.style.top = y;
			}

			return false;
		}
	},
	stopDrag: function(e) {
  	var thisObj = DragEngine;
  	if(thisObj.dragHandler && thisObj.dragHandler.onStopDrag) {
		  thisObj.dragHandler.onStopDrag(e, thisObj.dragBlock);
		  thisObj.dragHandler = null;
		}

		thisObj.dragapproved = 0;
		thisObj.offsetX = null;
		thisObj.offsetY = null;
	}
}
// initialize the drag & drop engine in addHandlers function

// ***********************************************************************************

/**
 * check the checkbox if property related to it has changed value (used in Watch
 * and Subscribe)
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

function getAnchorForTarget(e) {
  var target = getEventTarget(e);
  if (target.tagName.toUpperCase() == 'A')
    return target;
  var anchors = target.getElementsByTagName('a');
  if (anchors && anchors[0])
    return anchors[0];

  return getANode(target);
}
/**
 * Change boolean value (in non-edit mode)
 */
function changeBoolean(e, target) {
  var url = 'proppatch';
  var params = 'submitUpdate=Submit+changes&User_Agent_UI=n&uri=';
  var bIdx = target.id.indexOf("_boolean");
  var rUri = target.id.substring(0, bIdx);
  var idx = rUri.lastIndexOf("_");
  var propShort = rUri.substring(idx + 1);
  rUri = rUri.substring(0, idx);
  var bUri = null;
  idx = rUri.indexOf(".$.");
  var isCurrentItem;
  if (idx != -1) {
    bUri = rUri.substring(idx + 3);
    rUri = rUri.substring(0, idx);
    if (rUri == '$currentItem') {
      var a = document.getElementById("currentItem");
      if (a) {
        rUri = a.href;
        isCurrentItem =  true;
      }
    }
  }

  var pValue;
  if (isCurrentItem)
    pValue = "Yes";
  else {
    var nodes = target.childNodes;

    var node;
    for (var i=0; i<nodes.length  &&  !node; i++) {
      if (nodes[i].tagName  &&  nodes[i].tagName.toLowerCase() == 'img')
        node = nodes[i];
    }

    var tooltip = node.getAttribute('tooltip');
    if (tooltip  &&  tooltip.length != 0  &&  tooltip == "Yes")
      pValue = "No";
    else
      pValue = "Yes";
    node.setAttribute('tooltip', pValue);

    if (node) {
      if (pValue == "Yes")
        node.src = target.getAttribute('yesIcon');
      else
        node.src = target.getAttribute('noIcon');
    }
  }
  params += encodeURIComponent(rUri) + "&" + propShort + "=" + pValue;
  if (bUri != null)
    params += "&bUri=" + encodeURIComponent(bUri);

  var listboxFrame = frames["popupFrame"];
  popupFrameLoaded = false;

  if (document.location.href.indexOf('addLineItems.html') != -1) {
    var div = document.createElement('div');
    div.style.display = "none";
    postRequest(e, url, params + "&-addItems=y", div, target, cancelItemAndWait);
    return;
  }
  if (target.id.indexOf("_boolean_refresh") != -1) {
    var locationUrl = document.location.href;
    url +=  "?" + params + "&$returnUri=";
    var idx = locationUrl.indexOf("&errMsg=");
    if (idx == -1)
      url += encodeURIComponent(locationUrl);
    else {
      url += encodeURIComponent(locationUrl.substring(0, idx));
      idx = locationUrl.indexOf("&", idx + 1);
      if (idx != -1)
        url += encodeURIComponent(locationUrl.substring(idx));
    }
    document.location.replace(url);
  }
  else
    listboxFrame.location.replace(url + "?" + params); // load data from server
                                                        // into iframe
  if (Popup.tooltipPopup) {
    Popup.tooltipPopup.close();
    Popup.tooltipPopup = null;
  }
  // tooltipMouseOut0(target); // remove and ...
  // tooltipMouseOver0(target); // repaint the tooltip on this boolean icon
  return stopEventPropagation(e);
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
        //alert(oNode.style.cssText);
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

function cloneNode(oNode) {
  var oNew;

  if(oNode.nodeType == 3) {
    oNew = document.createTextNode(oNode.nodeValue);
  }
  else {
    oNew = document.createElement(oNode.nodeName);
    if (oNode.nodeName == 'form') {
      oNew.innerHTML = oNode.innerHTML;
      return;
    }
    for(var i = 0; i < oNode.attributes.length; i++) {
      var aName = oNode.attributes[i].name;

      if (oNode.nodeName == 'form') {
        if (aName == 'action') {
          oNew.action = oNode.action;
          continue;
        }
        if (aName == 'method') {
          oNew.method = oNode.method;
          continue;
        }
      }

      if (aName != 'style') {
//        Boost.log('cloneNode: ' + aName + ' = ' + oNode.attributes[i].value + '; tag = ' + oNew.tagName);
        oNew.setAttribute(aName, oNode.attributes[i].value);
      }
    }
    oNew.setAttribute('style', oNode.style.cssText);
  }

  if (oNode.hasChildNodes()) {
    for (var oChild = oNode.firstChild; oChild; oChild = oChild.nextSibling) {
//      Boost.log('cloneNode: found child node:  ' + oChild.tagName);
      var next = cloneNode(oChild);
      oNew.appendChild(next);
    }
  }

  return oNew;
}

function submitUpdate(formName) {
  var f = document.forms[formName];
  if(RteEngine)
    RteEngine.putRteDataOfForm(f);
  f.elements['submitUpdate'].value = 'Submit changes';
  f.submit();
  return false;
}

function getTopDivForTab(e, divId) {
  var target = getTargetElement(e);
  var pDiv;
  while (true) {
    pDiv = getDivNode(target)
    if (pDiv.id  &&  (pDiv.id == 'pane2' || pDiv.id == 'corePageContent'))
      break;
    else
      target = getDivNode(pDiv.parentNode);
  }
  var divs = pDiv.getElementsByTagName('div');
  for (var i=0; i<divs.length; i++) {
    var d = divs[i];
    if (d.id  &&  d.id == divId)
      return d;
  }
  return;
}

/**
 * clone data object
 */
function clone (o, deep) {
  var objectClone = new Object();
  for (var property in o) {
    var value = o[property];
    if (typeof value == 'function') { // skip functions
      continue;
    }
    if (!deep)
      objectClone[property] = value;
    else if (typeof value == 'object')
      objectClone[property] = clone(value, deep);
    else
      objectClone[property] = value;
  }
  return objectClone;
}

function setCssStyle(elem, newStyle) {
  if ( typeof( elem.style.cssText ) != 'undefined' )
    elem.style.cssText = newStyle;
  else
    elem.setAttribute('style', newStyle);
}

// auxiliary "class":
// 1) for phone - need catch event of document if arrow kes were pressed
// 2) closes dialogs for PC and phone
var closingOnEsc = {
  div : null,
  initialized : false,
  init : function() {
    addEvent(document, 'keydown', this._onkeydown,  false);
    this.initialized = true;
  },
  ready : function(div) {
    this.div = div;
    if(this.initialized == false)
      this.init();
    // append handlers to textarea and inputs - to close on "esc" inside there
    if(div.id == 'pane2') {
      inputs = div.getElementsByTagName('input');
      for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].className == 'input') {// GUI inputs
          addEvent(inputs[i], 'keydown', this._onkeydown,  false);
        }
      }
      var tAreas = div.getElementsByTagName('textarea');
      for(var i = 0; i < tAreas.length; i++)
          addEvent(tAreas[i], 'keydown', this._onkeydown,  false);
    }
  },
  _onkeydown : function(e) {
    e = e || event;
    var div = closingOnEsc.div;
    if(div == null || div.style.visibility == 'hidden')
      return;
   	var charCode = (e.charCode) ? e.charCode : ((e.keyCode) ? e.keyCode : ((e.which) ? e.which : 0));
		if(Browser.s60Browser) {
		  if(charCode != 8)
		    return;
		}
		else if(charCode != 27)
		  return;
    // 1. dialog
    if(div.id == 'pane2')
      hideInnerDiv(e);
    // 2. popup
    else if(div.className == 'popMenu') {
      Popup.close0(div.id)
   }

    div = null;
    stopEventPropagation(e);
    return false;
  }
}

/*************************************************
* advancedTooltip - allows to tune a tooltip
* 1) shift preferences
**************************************************/
var advancedTooltip = {
  tooltip : null,
  options : {isShiftRequired : false},
  optList : null,
  // button image object and size
  optBtn : {obj: null, width: 13, height: 17},
 // initialized : false,

  init : function() {
    if (Browser.mobile)
      return;

    //if(this.initialized)
     // return;

    this.tooltip = document.getElementById('system_tooltip');
    if(!this.tooltip)
      return;
    if(typeof MyDropdownList == 'undefined')
      return;
    this.optList = new MyDropdownList();
    var itemDiv = document.createElement('div');
    this.optList.appendItem(itemDiv);
    this.optBtn.obj = getChildById(this.tooltip, "opt_btn");
    this.initShiftPref();

    this.tooltip.appendChild(this.optList.div);
    this.initialized = true;
  },
  initMenu : function() {

  },
  onOptionsBtn : function() {
    if (Browser.mobile)
      return;

    if(this.optList == null)
      this.init();
    this.updateOptListItem(0);
    var ttContent = getChildById(this.tooltip, "tt_inner");
    advancedTooltip.optList.show(advancedTooltip.optBtn,
                    'left', advancedTooltip.onOptListItemSelect, ttContent);
  },
  onOptListItemSelect : function(idx) {
    if (Browser.mobile)
      return;

    advancedTooltip.optList.hide();
    if(idx == 0)
      advancedTooltip.shiftPrefSwitch();
  },
  showOptionsBtn : function()  {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();
    if(this.optBtn.obj)
      this.optBtn.obj.style.display = "";
  },
  hideOptionsBtn : function()  {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();
    if (this.optBtn.obj)
      this.optBtn.obj.style.display = "none";
  },
  // shift pref --------------------------------
  isShiftRequired : function() {
    if (Browser.mobile)
      return;

    if(!this.tooltip)
      this.init();
    return this.options.isShiftRequired;
  },
  initShiftPref : function () {
    if (Browser.mobile)
      return;

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
		  this.options.isShiftRequired = bValue;
	  }
    this.updateOptListItem(0);
  },
  shiftPrefSwitch : function () {
    if (Browser.mobile)
      return;

    this.options.isShiftRequired = !this.options.isShiftRequired;
	  // set cookie
	  var sValue = this.options.isShiftRequired ? "yes" : "no";
	  var expiresData = new Date();
    expiresData.setTime(expiresData.getTime() + (1000 * 86400 * 365));
    document.cookie = "shift_pressed=" + escape(sValue)
        + "; expires=" + expiresData.toGMTString();

    var tooltipObj = Popup.getPopup('system_tooltip');
	  if(tooltipObj)
	    tooltipObj.delayedClose();
  },
  // ------------
  updateOptListItem : function(idx) {
    if(idx == 0) {
      if(this.options.isShiftRequired)
        this.optList.changeItemContent(idx, "<span style='font-size:12px;'>show always</span>");
      else
        this.optList.changeItemContent(idx, "<span style='font-size:12px;'>show when shift pressed</span>");
    }
    this.optList.setWidth = 200;
  }
}

function addSpellcheck() {
  var ua = navigator.userAgent.toLowerCase();
	var isGecko = (ua.indexOf("gecko") != -1);
  if(!isGecko)
    return;
  document.body.spellcheck = true;
}
/**********************************************************
* ImageAnnotations utilizes PhotoNotes.
***********************************************************/
var ImageAnnotations = {
  notesEngine : null,
  container : null,
  addNoteBtn : null,
  imgUrl : "",
  _isEditMode : false,
  initialized : false,
  // initial function
  init : function(imgUrl, notesDataArr) {
    this.container = document.getElementById('PhotoContainer');
    if(!this.container)
      return;

    this.imgUrl = imgUrl;
    if(this.notesEngine == null) {
      if(typeof PhotoNoteContainer == 'undefined')
        return;
      this.notesEngine = new PhotoNoteContainer(this.container);
    }

    this.addNoteBtn = getChildById(this.container, 'add_note');

    if(typeof notesDataArr != 'undefined' && notesDataArr != null) {
      // append stored notes
      for(var i = 0; i < notesDataArr.length; i++)
        this.addNote(notesDataArr[i]);
     }
     this.initialized = true;
  },

  addNote : function(noteData) {
    if(!noteData) {
      noteData = {left:10, top:10, width:50, height:50, text:"note",resId:null};
    }
    var size = new PhotoNoteRect(noteData.left , noteData.top, noteData.width, noteData.height);
    var note = new PhotoNote(noteData.text, 1, size);

    // unique ID of annotation resource
    note.resId = noteData.resId;
    note.onsave = this.onsave;
    note.ondelete = this.ondelete;

    this.notesEngine.AddNote(note);
    //note.SetEditable(true);
    note.DisableNote();
  },
  onTabSelection : function(selectedDiv) {
    if(ImageAnnotations.initialized == false)
      return;

    if(selectedDiv.id == "div_Edit")
      ImageAnnotations.setEditMode(true);
    else
      ImageAnnotations.setEditMode(false);
  },

  setEditMode : function(isEditMode) {
    this._isEditMode = isEditMode;
    if(isEditMode) {
      this.addNoteBtn.style.visibility = "visible";
    }
    else {
      this.addNoteBtn.style.visibility = "hidden";
      this.notesEngine.switchToViewMode();
    }
  },

  onsave : function(note) {
    var url = ImageAnnotations.getServletUrl();
    var rect = note.rect;

    var parameters = "";
    var isNew = (typeof note.resId == 'undefined' || note.resId == null)
    if(isNew)
      parameters += "action=mkResource";
    else
      parameters += "action=update";

    parameters += "&imageUrl=" + encodeURIComponent(ImageAnnotations.imgUrl);
    parameters += "&left=" + rect.left + "&top=" + rect.top;
    parameters += "&width=" + rect.width + "&height=" + rect.height;
    parameters += "&text=" + note.text;
    if(!isNew)
      parameters += "&resId=" + note.resId;

    postRequest(null, url, parameters, null, null, ImageAnnotations.onsaveCallback);
    return 1;
  },
  // a1, a2, a3 - parameters that are not used here
  onsaveCallback : function(a1, a2, a3, responseText) {
    //alert(responseText);
  },

  ondelete : function(note) {
    if(typeof note.resId == 'undefined' || note.resId == null) // not stored note
      return true;
    var url = ImageAnnotations.getServletUrl();
    var parameters = "action=delete";
    //parameters += "&imageUrl=" + ImageAnnotations.imgUrl;
    parameters += "&resId=" + note.resId;
    postRequest(null, url, parameters, null, null, ImageAnnotations.ondeleteCallback);
    return true;
  },

  ondeleteCallback : function(a1, a2, a3, responseText) {

  },

  getServletUrl : function () {
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
    var url = baseUri + "imageAnnotation";

		return url;
	},

	isEditMode : function() {
	  return this._isEditMode;
	}
}
/*******************************************************
* dictionary handler
********************************************************/
var dictionaryHandler = {
  init : function() {
    addEvent(document, "mouseup", this._onmouseup, false);
  },
  // to handle the event if "Alt" key was pressed
  _onmouseup : function(e) {
    e = e || event;
    if(e.altKey == false)
      return;
    var range;
    var selText = "";
    var hotspot = document.body;
    if (window.getSelection) { // FF, Opera, Safari
      var selection = window.getSelection();
      selText = selection.toString();
      range = selection.getRangeAt(0);
      hotspot = range.startContainer.parentNode;
    }
    else if (document.selection) { // IE
      if(document.selection.type != 'Text')
        return;
      range = document.selection.createRange();
      selText = range.text;
      hotspot = range.parentElement();
    }
    selText = trim(selText);
    if(selText != "") {
      var len = selText.length;
      if (selText.charAt(len - 1) == ')') {
        var idx = selText.lastIndexOf('(');
        if (idx != -1) {
          var s = selText.substring(idx + 1, len - 1);
          if (s == 's')
            selText = selText.substring(0, idx);
          else {
            try {
              var num = parseInt(s);
              if (!isNaN(num))
                selText = trim(selText.substring(0, idx));
            } catch (e) {
            }
          }
        }
      }

      dictionaryHandler.translate(e, hotspot, selText);
    }
  },
  translate : function(e, hotspot, text) {
    var baseUriO = document.getElementsByTagName('base');
    var baseUri = "";
    if (baseUriO) {
      baseUri = baseUriO[0].href;
      if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
        baseUri += "/";
    }
    var url = encodeURI(baseUri + "mkResource.html");
    var params = "&$browser=y"
               + "&displayProps=yes"
               + "&type=http://www.hudsonfog.com/voc/model/portal/Translation"
               + "&-inner=y"
               + "&.source=" + encodeURIComponent(text);

    var div = document.getElementById("pane2");
    postRequest(e, url, params, div, hotspot, this.onTranslationCallback);
  },
  onTranslationCallback : function(clonedEvent, div, hotspot, responseText) {
    showDialog(clonedEvent, div, hotspot, responseText); //test //"<div><h1>TEST</h1></div>"
  }

}
/*
var hideMenu;
function showMenu(e, divId) {
  e = getDocumentEvent(e);
  if (hideMenu) {
    var div = document.getElementById(divId);
    div.style.visibility = Popup.HIDDEN;
    div.style.display = "none";
    hideMenu = false;
  }
  else {
    div = document.getElementById(divId);
    div.style.visibility = Popup.VISIBLE;
    div.style.display = 'inline';
    hideMenu = true;
  }
  return stopEventPropagation(e);
}

function switchMenuMode(e, userUri) {
  e = getDocumentEvent(e);
  if (!e)
    return;
  var elm = getTargetElement(e);
  if (!elm)
    return;
  var uri = 'proppatch';
  var params = '-$action=showPropertiesForEdit&submitUpdate=y&uri=' + encodeURIComponent(userUri);
  if (elm.src.indexOf('showHideMenu.gif') != -1)
    params +='&.dashboardMode=false';
  else
    params +='&.dashboardMode=true';

  var div = document.getElementById('menuBar1');

  var ret = stopEventPropagation(e);
  var href = document.location.href;
  postRequest(e, uri, params, div, elm, menuCallback);
  function menuCallback(e) {
    document.location.href = href + '&-changeMenuMode=y';
  }
  return ret;
}
*/

/*******************************************************
* Dashboard
********************************************************/
var Dashboard = {
  MIN_COLUMN_WIDTH : 50,

  PH_BACK_COLOR : "#eee",
  PH_BORDER : "1px dashed #f00",
  DASHBOARD_ID : "dashboard",

  dragBlock : null,
  placeholderDiv : null,
  isDragMode : false,

  widgetsMap : null,
  freeSpacesMap : null,
  tabHeadersMap : null,

  targetTab : null,

  prevY : 0,
  prevX : 0,
  isDirUp : true,

  prevWidgetOld : null,
  isWidgetMoved : false,
  
  oldWidgetIdx : -1,

  // drag interface functions -----
  getDragBlock : function(dragHandleObj) {
    if(OperaWidget.isWidget()) // it means that we are not in our dashboard.
      return null;

    var widgetDiv = getAncestorByAttribute(dragHandleObj, "className", "widget");
    if(widgetDiv && this.widgetsMap == null) {
      this.initDashboardMap(widgetDiv);
      addEvent(document, "keyup", this.onEsc, false);
    }

    return widgetDiv;
  },
  initDashboardMap : function(theWidget) {
    var dashboard = getAncestorById(theWidget, this.DASHBOARD_ID);
    // 1. widgets
    var divs = dashboard.getElementsByTagName("div");
    this.widgetsMap = new Array();
    for(var i = 0; i < divs.length; i++) {
      if(divs[i].className == "widget") {
        var widgetRect = new Dashboard.WidgetRect(divs[i]);
        this.widgetsMap.push(widgetRect);
      }
    }
    // 2. free spaces
    var cols = dashboard.rows[0].cells;
    this.freeSpacesMap = new Array();
    for(var i = 0; i < cols.length; i++) {
      var freeSpaceRect = new Dashboard.FreeSpaceRect(cols[i], this.widgetsMap);
      this.freeSpacesMap.push(freeSpaceRect);
      // set min column width on case if the column has no widgets.
      if(typeof cols[i].style.minWidth != 'undefined')
        cols[i].style.minWidth = this.MIN_COLUMN_WIDTH
      else
        cols[i].style.width = this.MIN_COLUMN_WIDTH;
    }
    // 3. tab "Header"
    // suppose that position of tab header is constant
    this.tabHeadersMap = new Array();
    var tables = document.body.getElementsByTagName('table');
    for(var i = 0; i < tables.length; i++) {
      if(tables[i].className == 'tabs') {
        var tabHeader = new Dashboard.TabHeaderRect(tables[i]);
        this.tabHeadersMap.push(tabHeader);
      }
    }
  },
  updateDashboardMap : function() {
    // 1. widgets
    for(var i = 0; i < this.widgetsMap.length; i++)
        this.widgetsMap[i].update();
    // 2. free spaces
    for(var i = 0; i < this.freeSpacesMap.length; i++)
        this.freeSpacesMap[i].update();
  },

  onStartDrag : function(dragBlock) {
    this.dragBlock = dragBlock;
    this.isDragMode = true;
    this.isWidgetMoved = false;
    this.oldWidgetIdx = this.getWidgetIndex(dragBlock);

    if(this.placeholderDiv == null)
      this.createPlaceholder();

    var width = dragBlock.offsetWidth;
    var height = dragBlock.offsetHeight;

    var phStyle = this.placeholderDiv.style;
    var dbStyle = dragBlock.style;

//    phStyle.width   = width;
    phStyle.height  = height;
    phStyle.display = "block";

    var x = findPosX(dragBlock);
    var y = findPosY(dragBlock);
    dbStyle.width = width;
    dbStyle.left  = x;
    dbStyle.top   = y;
    dbStyle.position = "absolute";

    this.prevWidgetOld = this.getPrevSibling(dragBlock);
    this.prevY = y;
    this.prevX = x;

    swapNodes(dragBlock, this.placeholderDiv);
  },
  onDrag : function(dragBlock, x, y) {
    if(this.isDragMode == false)
      return;

    // 1. preparing
    // 1.1 "cross-hair" point
    var chX = x + Math.ceil(dragBlock.offsetWidth / 2);
    var chY = y + 15;

    // 1.2
    this.isDirUp = this.detectDirection(y);
    // 1.3 get target widget under "cross-hair" point
    var targetWidget = this.detectTargetWidget(chX, chY, dragBlock.id);
    // 1.4 detect "free space" if targetWidget == null
    var targetFreespace = null;
    if(targetWidget == null)
      targetFreespace = this.detectTargetFreespace(chX, chY);

    // 2. move placeholder if need
    var moved = false;
    if(targetWidget) {
      var isSameColumn = Dashboard.areWidgetsInTheSameColumn(targetWidget, Dashboard.placeholderDiv);

      // 2.1 swap horizontal
      if(isSameColumn == false) {
        this.swapHorizontal(targetWidget);
        moved = true;
      }
      else if(this.needVerticalSwap(targetWidget)){
      // 2.2 swap vertical
        this.swapVertical(targetWidget);
        moved = true;
      }
    }
    // 2.3 free space
    else if(targetFreespace)
      this.setInFreeSpace(targetFreespace);

    if(moved)
      this.updateDashboardMap();

    // 3. over Tab
    this.targetTab = this.detectTargetTabHeader(chX, y);
    var phStyle =  this.placeholderDiv.style;
    if(this.targetTab) {
      if(phStyle.display == 'none') {
        for(var i = 0; i < this.tabHeadersMap.length; i++)
          this.tabHeadersMap[i].setBackgroundAndBorder("", "");
      }
      else {
        phStyle.display = 'none';
      }
      this.targetTab.setBackgroundAndBorder(this.PH_BACK_COLOR, this.PH_BORDER);
    } // 3.2 out without drop.
    else if(phStyle.display == 'none') {
      phStyle.display = '';
      for(var i = 0; i < this.tabHeadersMap.length; i++)
        this.tabHeadersMap[i].setBackgroundAndBorder("", "");
    }

    // check if widget was moved from the place
    if(Math.abs(this.prevX - x) > 2 || Math.abs(this.prevY - y) > 2)
      this.isWidgetMoved = true;
  },

  onStopDrag : function(e, dragBlock) {
    if(this.isDragMode == false)
      return;
    this.isDragMode = false;
    if(!dragBlock)
      return;

    this.compliteGuiDrag(dragBlock);

    // if widget was not moved then maximize it
    // not used now
    /*
    if(this.isWidgetMoved == false) {
      this.maximizeWidget(dragBlock);
        return;
    }
    */

    // 1. move on another tab
    if(this.targetTab) {
      this.targetTab.setBackgroundAndBorder("", "");
      this.onReleaseOverTab(e, dragBlock, this.targetTab.table);
    }

    // 2. move on other place in the current tab
    // 2.1 check if a widget was moved   
    if (this.oldWidgetIdx == this.getWidgetIndex(dragBlock))
      return;
    // 2.2 store changed on server
    var prevWidgetNew = this.getPrevSibling(dragBlock);
    this.onWidgetMovement(e, dragBlock, this.prevWidgetOld, prevWidgetNew);
  },
  onMaximizeWidget : function(maxIconObj) {
    widgetDiv = getAncestorByAttribute(maxIconObj, "className", "widget");
    if (!widgetDiv) // on failed html
      widgetDiv = getAncestorByAttribute(maxIconObj, "className", "propertySheet");
    this.maximizeWidget(widgetDiv);
  },
  maximizeWidget : function(widgetDiv) {
    if (!widgetDiv)
      return;
    var maxLink = getChildById(widgetDiv, "w_maximize");
    if(!maxLink)
      return;
    window.location = maxLink.href;
  },
  compliteGuiDrag : function(dragBlock) {
    var dbStyle = dragBlock.style;

    this.placeholderDiv.style.display = "none";
    dbStyle.position = "";
    dbStyle.width = "100%";
    swapNodes(dragBlock, this.placeholderDiv);
    this.updateDashboardMap();
  },
  // stops drag action
  onEsc : function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode :
			((evt.which) ? evt.which : 0));
		if (charCode == 27) {
		  var thisObj = Dashboard;
		  thisObj.isDragMode = false;
			thisObj.compliteGuiDrag(thisObj.dragBlock);
		}
	},
  //--------------------------
  createPlaceholder : function() {
    this.placeholderDiv = document.createElement("div");
    var phStyle = this.placeholderDiv.style;
    phStyle.display = "none";
    phStyle.width  = "100%";
    phStyle.margin = 0;
    phStyle.backgroundColor = this.PH_BACK_COLOR;
    phStyle.border = this.PH_BORDER;
    document.body.appendChild(this.placeholderDiv);
  },

  swapVertical : function(targetWidget) {
    swapNodes(targetWidget, Dashboard.placeholderDiv);
  },
  swapHorizontal : function(targetWidget) {
    var parent = targetWidget.parentNode;
    this.placeholderDiv.style.width = targetWidget.offsetWidth;
    parent.insertBefore(this.placeholderDiv, targetWidget);
  },
  setInFreeSpace : function(targetFreespace) {
    var colObj = targetFreespace.getColumn();
    colObj.appendChild(this.placeholderDiv);
  },

  needVerticalSwap : function(targetWidget) {
    var needSwap = false;
    var isWidgetUpper = this.isWidgetUpper(targetWidget);

    if(this.isDirUp == null)
      return false;
    if((isWidgetUpper && this.isDirUp) ||
      (!isWidgetUpper && !this.isDirUp)) {
        needSwap = true;
    }
    return needSwap;
  },

  detectDirection : function(y)  {
    var isDirUp = null;
    if(this.prevY > y)
      isDirUp = true;
    else if(this.prevY < y)
      isDirUp = false;

    this.prevY = y;
    return isDirUp;
  },
  detectTargetWidget : function(chX, chY, dragWidgetId) {
    var targetWidget = null;
    for(var i = 0; i < this.widgetsMap.length; i++) {
      var widgetId = this.widgetsMap[i].getWidgetId();
      if(widgetId != dragWidgetId &&
          this.isPointIn(chX, chY, this.widgetsMap[i])) {
        targetWidget = this.widgetsMap[i].getWidgetDiv();
      }
    }
    return targetWidget;
  },

  detectTargetFreespace : function(midX, midY) {
    var targetFreespace = null;
    for(var i = 0; i < this.freeSpacesMap.length; i++) {
      if(this.isPointIn(midX, midY, this.freeSpacesMap[i])) {
        targetFreespace = this.freeSpacesMap[i];
      }
    }
    return targetFreespace;
  },
  detectTargetTabHeader : function(midX, y) {
    var targetTabHeader = null;
    for(var i = 0; i < this.tabHeadersMap.length; i++) {
      if(this.isPointIn(midX, y, this.tabHeadersMap[i])) {
        targetTabHeader = this.tabHeadersMap[i];
      }
    }
    return targetTabHeader;
  },
  areWidgetsInTheSameColumn : function(widget1, widget2) {
    var parentTD_ID_1 = widget1.parentNode.id;
    var parentTD_ID_2 = widget2.parentNode.id;
    if(parentTD_ID_1 == parentTD_ID_2) {
      return true;
    }
    return false;
  },
  isPointIn : function(x, y, rect) {
    if(rect.left < x &&
      rect.right > x &&
      rect.top < y &&
      rect.bottom > y)
        return true;
      return false;
  },
  // relative to the placeholder
  isWidgetUpper : function(widget) {
    var prev = this.getPrevSibling(this.placeholderDiv); //.previousSibling;
   // while(prev && prev.nodeType != 1) // skip whitespaces
   //   prev = prev.previousSibling;

    if(prev && prev.id == widget.id) {
      return true;
    }
    return false;
  },
  getWidgetIndex : function(widget) {
    var dashboard = getAncestorById(widget, this.DASHBOARD_ID);
    if (!dashboard)
      return;
    var divs = dashboard.getElementsByTagName("div");
    var idx = 0;
    for (var i = 0; i < divs.length; i++) {
      if (divs[i].className == "widget") {
        if (widget.id == divs[i].id) {
          return idx;
        }
        idx++;
      }
    }
    return -1;
  },
  getPrevSibling : function(widgetDiv) {
    var prev = widgetDiv.previousSibling;
    while(prev && prev.nodeType != 1) // skip whitespaces
      prev = prev.previousSibling;

    return prev;
  },
  // WidgetRect subclass --
  WidgetRect : function(widgetDiv) {
    this.widgetDiv = widgetDiv;
    this.left;
    this.top;
    this.right;
    this.bottom;

    this.update = function() {
      this.left   = findPosX(this.widgetDiv);
      this.top    = findPosY(this.widgetDiv);
      this.right  = this.widgetDiv.offsetWidth + this.left;
      this.bottom = this.widgetDiv.offsetHeight + this.top;
    }
    this.getWidgetDiv = function() {
      return this.widgetDiv;
    }
    this.getWidgetId = function() {
      return this.widgetDiv.id;
    }
    this.getColumnId = function() {
      return this.widgetDiv.parentNode.id;
    }
    // "constructor"
    this.update();
  },

  FreeSpaceRect : function(column, widgetsMap) {
    this.column     = column;
    this.widgetsMap = widgetsMap;
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;

    this.update = function() {
      // 1. whole column
      this.left   = findPosX(this.column);
      this.top    = findPosY(this.column);
      this.right  = this.column.offsetWidth + this.left;
      this.bottom = this.column.offsetHeight + this.top;
      // 2. exclude children's widgets
      for(var i = 0; i < this.widgetsMap.length; i++) {
        if(this.column.id == this.widgetsMap[i].getColumnId()) {
          this.top = Math.max(this.top, widgetsMap[i].bottom);
        }
      }
    },
    this.getColumn = function() {
      return this.column;
    }
    // "constructor"
    this.update();
  },
  TabHeaderRect : function(table) {
    this.table = table;
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;

    this.init = function() {
      this.left   = findPosX(this.table);
      this.top    = findPosY(this.table);
      this.right  = this.table.offsetWidth  + this.left;
      this.bottom = this.table.offsetHeight + this.top;
    }
    this.setBackgroundAndBorder = function(background, border) {
      this.table.style.backgroundColor = background;
      this.table.style.border = border;
    }
    this.init();
  },

  // call a server handler --
  onWidgetMovement : function(e, widget, prevWidgetOld, prevWidgetNew) {
    var ret = stopEventPropagation(e);
    var wLen = 'widget_'.length;

    var widgetUri = widget.id.substring(wLen);
    if (!isNaN(widgetUri)) {
      var bookmarkBase = document.getElementById('bookmarkBlock');
      widgetUri = bookmarkBase.innerHTML + widgetUri;
    }
    var td = getTdNode(widget);
    if(td == null)
      return;
    var newCol = parseInt(td.id.substring('col_'.length));

    var params = 'uri=' + encodeURIComponent(widgetUri) + '&-drag=y&submitUpdate=y&previousInColumn_verified=y&.dashboardColumn=' + newCol;
    if (prevWidgetNew) {
      var newPrevUri = prevWidgetNew.id.substring(wLen);
      if (!isNaN(newPrevUri)) {
        var bookmarkBase = document.getElementById('bookmarkBlock');
        newPrevUri = bookmarkBase.innerHTML + newPrevUri;
      }

      params += '&.previousInColumn_select=' + encodeURIComponent(newPrevUri);
    }
    // set self as prev widget to know that this is the top of the column (till remove prop implemented)
    else
      params += '&.previousInColumn_select=' + encodeURIComponent(widgetUri);
    var target = getTargetElement(e);
    postRequest(e, 'proppatch', params, widget, td, callback);
    function callback() {
    }
    return ret;
  },

  onReleaseOverTab : function(e, widget, table) {
    var elms = table.getElementsByTagName('a');
    var a;
    for (var i=0; i<elms.length; i++) {
      if (!elms[i].id || elms[i].id.indexOf('tab_') != 0)
        continue;
      a = elms[i];
      break;
    }
    var ret = stopEventPropagation(e);
    if (!a)
      return ret;
    var tab = a.id.substring(4);
    var wLen = 'widget_'.length;
    var widgetUri = widget.id.substring(wLen);
    // Trying to drag backlink widget
    if (widgetUri.indexOf("http") == -1) {
      if (!isNaN(widgetUri)) {
        var bookmarkBase = document.getElementById('bookmarkBlock');
        widgetUri = bookmarkBase.innerHTML + widgetUri;
      }
      else {
        widgetUri = null;
        elms = widget.getElementsByTagName('a');
        for (var i=0; i<elms.length; i++) {
          if (!elms[i].id || elms[i].id.indexOf('widget_') != 0)
            continue;
          widgetUri = elms[i].id.substring(wLen);
          if (!isNaN(widgetUri)) {
            var bookmarkBase = document.getElementById('bookmarkBlock');
            widgetUri = bookmarkBase.innerHTML + widgetUri;
          }
          break;
        }
        // bookmark for this widget was not yet created
        if (widgetUri == null) {
          var f = document.getElementById("pref_" + widget.id.substring(wLen));
          if (f) {
            formId = f.id;
            // create backlink bookmark and move it to Tab
            submitWidgetPreferences(e, formId, tab);
            return ret;
          }
        }
      }
    }
    if (widgetUri == null)
      return ret;
    var href = a.href;
    var params = 'uri=' + encodeURIComponent(widgetUri) + '&submitUpdate=y&.parent_verified=y&.parent_select=' + encodeURIComponent(tab);

    postRequest(e, 'proppatch', params, widget, a, callback);
    return ret;

    function callback(event, widget) {
      var hideDivId = widget.id;

      hideDiv(event, hideDivId);
      var idx = widgetUri.lastIndexOf('=');
      var bookmarkId;

      // sidebar widget that is not bookmark yet
      if (idx != -1)
        bookmarkId = widgetUri.substring(idx + 1);

      var tr = document.getElementById('dm_' + bookmarkId);

      idx = tab.lastIndexOf('=');
      var tbody = document.getElementById('menu_' + tab.substring(idx + 1));
      var elms = tbody.getElementsByTagName('tr');
      // Copying widget from one dashboard to another.
      if (tr) {
        var tbodyP = tr.parentNode;
        tbodyP.removeChild(tr);

        if (elms)
          tbody.insertBefore(tr, elms[0]);
        else
          tbody.appendChild(tr);
        return;
      }
      // Copying widget from sidebar to dashboard
      var newTr = document.createElement('tr');
      newTr.setAttribute('id', 'dm_' + bookmarkId);

      var cellI = document.createElement('td');
      cellI.setAttribute('class', 'menuItemIcon');
      newTr.appendChild(cellI);

      var icons = widget.getElementsByTagName('img');
      for (var i=0; i<icons.length; i++) {
        if (icons[i].className  &&  icons[i].className == 'widgetIcon') {
          cellI.appendChild(icons[i]);
          break;
        }
      }
      var cell = document.createElement('td');
      cell.setAttribute('class', 'menuItem');
      newTr.appendChild(cell);
      var aMenu = document.createElement('a');
      cell.appendChild(aMenu);
      aMenu.setAttribute('href', 'l.html?-max=y&-bookmark=' + encodeURIComponent(widgetUri));
      var titles = widget.getElementsByTagName('span');
      for (var i=0; i<titles.length; i++) {
        if (titles[i].className  &&  titles[i].className == 'widgetTitle') {
          aMenu.appendChild(titles[i]);
          break;
        }
      }

      var cellE = document.createElement('td');
      cellE.setAttribute('class', 'menuExpand');
      newTr.appendChild(cellE);
      if (elms)
        tbody.insertBefore(newTr, tbody.rows[0]);
      else
        tbody.appendChild(newTr);

      var errDiv = document.getElementById('errorMessage');
      if (!errDiv)
        return;
      var errIcon = errDiv.getElementsByTagName('img');
      errIcon[0].src = 'icons/info-msg.gif';
      var errMsg = errDiv.getElementsByTagName('span');
      errMsg[0].innerHTML = 'Drag-and-drop was successful';
      errDiv.style.visibility = Popup.VISIBLE;
      errDiv.style.display = 'inline';
//      errDiv.innerHTML = "<table border='0' width='100%' class='commentevent'><tr><td valign='bottom' align='center' width='70'><img src='icons/info-msg.gif' width='64' /></td><td><span class='info'>Drag-and-drop was successful</span></td><td valign='top'><img src='icons/hide.gif' width=16 height=16 onclick='hideDiv(event, \"errorMessage\");'/></td></tr></table>";
    }
  }
}

var WidgetFlip = {
//PREFERENCE BUTTON ANIMATION (- the pref flipper fade in/out)

//mouseexit() is the opposite of mousemove() in that it preps the preferences flipper
//to disappear.  It adds the appropriate values to the animation data structure and sets the animation in motion.

  flipShown : false,    // a flag used to signify if the flipper is currently shown or not.

  // A structure that holds information that is needed for the animation to run.
  fading : {duration:0, starttime:0, end:1.0, now:0.0, start:0.0, firstElement:null, timer:null},
  currentWidgetId : null,
  flipImg : null,
  mousemove : function (e, divId)  {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;
    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }
    if (this.flipShown)
      return;
    // if the preferences flipper is not already showing...
    if (this.fading.timer != null) {     // reset the fading timer value, in case a value was left behind
      if (this.currentWidgetId  &&  this.currentWidgetId != divId)
        this.hideflip(e, this.currentWidgetId);
      clearInterval (this.fading.timer);
      this.fading.timer  = null;
    }


    this.currentWidgetId = divId;
    var div = document.getElementById(divId);
    this.showflip(e, div);

    var starttime = (new Date).getTime() - 13;    // set it back one frame
    this.fading.duration = 500;                       // fading time, in ms
    this.fading.starttime = starttime;                    // specify the start time
    this.fading.timer = setInterval ("WidgetFlip.fade();", 13);   // set the fading function
    this.fading.start = this.fading.now;                     // beginning opacity (not ness. 0)
    this.fading.end = 1.0;                           // final opacity
    this.fade();                                // begin fading
    this.flipShown = true;                           // mark the flipper as animated

  },

//   mouseexit() is the opposite of mousemove() in that it preps the preferences flipper
//   to disappear.  It adds the appropriate values to the fading data structure and sets the fading in motion.

  mouseexit : function (e, divId)  {
    if (typeof getDocumentEvent == 'undefined') return;
    e = getDocumentEvent(e); if (!e) return;

    if (e.getAttribute) {
      var isProcessed = e.getAttribute('eventProcessed');
      if (isProcessed != null && (isProcessed == 'true' || isProcessed == true))
        return stopEventPropagation(e);
      e.setAttribute('eventProcessed', 'true');
    }
    if (!this.flipShown)
      return;
    // fade in the flip widget
    if (this.fading.timer != null) {
      clearInterval (this.fading.timer);
      if (this.currentWidgetId  &&  this.currentWidgetId != divId)
        this.hideflip(e, this.currentWidgetId);
      this.fading.timer  = null;
    }

    this.currentWidgetId = divId;
    var starttime = (new Date).getTime() - 13;

    this.fading.duration = 500;
    this.fading.starttime = starttime;
    var div = document.getElementById(divId);
    this.fading.timer = setInterval ("WidgetFlip.fade();", 13);
    this.fading.start = this.fading.now;
    this.fading.end   = 0.0;
    this.fade();
    this.flipShown = false;

  },

  showBackside : function(event, divId) {
    downloadWidget.storeFrontsideSize(divId);
    hideDiv(event, divId);
    activateDiv(event, divId + "_back");
    OperaWidget.resizeOnBackside();
    displayDiv(event, divId + "_back");
  },

  /**
   * fades widget flip image.
   */
  fade : function ()  {
    if(this.flipImg == null)
      return;
    var time = (new Date).getTime();
    var elapsedTime = this.getElapsedTime(time - this.fading.starttime, this.fading.duration);

    if (elapsedTime >= this.fading.duration) {
      clearInterval (this.fading.timer);
      this.fading.timer = null;
      this.fading.now = this.fading.end;
    }
    else {
      var ease = 0.5 - (0.5 * Math.cos(Math.PI * elapsedTime / this.fading.duration));
      this.fading.now = this.getNextFadingNumber(this.fading.start, this.fading.end, ease);
    }
    changeOpacity(this.flipImg, this.fading.now);
    if(this.flipShown == false && this.fading.now == this.fading.end)
      this.hideflip();

  },

  getElapsedTime : function (elapsed, duration)  {
    return elapsed < 0 ? 0 : (elapsed > duration ? duration : elapsed);
  },

  getNextFadingNumber : function (start, end, ease)  {
    return start + (end - start) * ease;
  },

  enterflip : function (event)  {
    if(this.flipImg == null)
      return;
    var baseUri = getBaseUri();
    this.flipImg.src = baseUri + "images/flip_hover.png";
  },

  exitflip : function (event)  {
    if(this.flipImg == null)
      return;

    var baseUri = getBaseUri();
    this.flipImg.src = baseUri + "images/flip.png";
  },

  showflip : function (event, div) {
    if(this.flipShown)
      return;
    var baseUri = getBaseUri();
    this.flipImg = getChildByAttribute(div, "className", "widgetIcon");
    if(this.flipImg == null)
      return;
    if(/_hover.png$/.test(this.flipImg.src))
      return;

    var trueSrc = this.flipImg.getAttribute("true_src");
    if(trueSrc == null)
      this.flipImg.setAttribute("true_src", this.flipImg.src);

    this.flipImg.src = baseUri + "images/flip.png";
    this.flipShown = true;
  },

  hideflip : function (event, divId) {
    if(this.flipImg == null)
      return;
    this.flipShown = false;
    this.flipImg.src = this.flipImg.getAttribute("true_src");
    changeOpacity(this.flipImg, 1.0);
  }
}

/*
 * submits preferences form on the back of the widget and repaints widget
 * tab - is passed only when there need to create bookmark for sidebar widget before
 * moving it to different Tab
 */
function submitWidgetPreferences(event, formId, tab) {
  var ret = stopEventPropagation(event);
  if (formId.indexOf("pref_") == -1)
    return ret;
  var form = document.getElementById(formId);
  if (!form)
    return ret;
  var refersh = form.elements['.refresh'].value;

  var param = FormProcessor.getFormFilters(form, true) + '&submitUpdate=y';
  if (param.charAt(0) == '&')
    param = param.substring(1);
  var url = form.action;
  Debug.setMode(true);
  Debug.log('submitWidgetPreferences: url = ' + url + "; param = " + param);

  var divId =  (formId.indexOf("_http") != -1) ? 'widget_' + formId.substring(5) : 'div_' + formId.substring(5);

  var widgetDiv = document.getElementById(divId);

  var elm = getEventTarget(event); //getTargetElement(event);
//  var div = document.createElement('div');
//  div.style.display = "none";
//  postRequest(event, url, param, div, elm, refreshWidget);
  if (OperaWidget.isWidget()) {
    OperaWidget.resizeOnFrontside();
    // 'formId.substring(5)' - widget type url
    OperaWidget.savePreferencesStr(param);
    WidgetRefresher.updateWidgetByUrl(formId.substring(5));
    return ret;
  }
  else {
    if (tab)
      postRequest(event, url, param, widgetDiv, elm, doCopyToTab);
    else {
      postRequest(event, url, param, widgetDiv, elm, WidgetRefresher.refresh);
      return ret;
    }
  }
  // After sidebar bookmark was created move it to Tab
  function doCopyToTab(event, widget, hotspot, contents) {
    widget.innerHTML = contents;

    var a = document.getElementById('tab_' + tab);
    if (!a)
      return;
    var table;
    var t = a.parentNode;
    while (!table) {
      if (!t) {
        alert('Failed to copy widget in tab')
        return;
      }
      if (t.tagName.toLowerCase() == 'table')
        table = t;
      else
        t = t.parentNode;
    }

    Dashboard.onReleaseOverTab(event, widget, table);
  }
}
function callback(event, widget) {
  hideDiv(event, widget.id);
}

var WidgetRefresher = {
  widgetsArr : new Array(), // member structure { timerId, bookmarkUrl }
  hdnDoc : null, // helps to load refreshed document
  setInterval : function(divId, intervalSeconds) {

    Debug.setMode(true);
    //Debug.log('divId = ' + divId);

    // 1. prepare new "widget member" or stop old one.
    if(typeof this.widgetsArr[divId] == 'undefined')
      this.widgetsArr[divId] = new Object();
    else
      clearInterval(this.widgetsArr[divId].timerId);

    // 2. Find the boorkmark url that is a part of "outer" div widget div
    // divId is an widget content div
    var obj = document.getElementById(divId);
    if(!obj)
      return;
   	while(obj != null) {
		  if(obj.id.indexOf("widget_") == 0) {
		    widgetDiv = obj;
		    break;
		  }
		  obj = obj.parentNode;
	  }
	  if(obj.id.length == 0)
	    return;

	  var widgetDivId = obj.id;
	  this.widgetsArr[divId].bookmarkUrl = widgetDivId.substr(7);

    // 4. launch widget refresh loop.
    var interval;
    // OperaWidget
    if(OperaWidget.isWidget()) {
      OperaWidget.init(widgetDivId);
      interval = OperaWidget.getRefreshInterval();
      if(interval < 0) {
        if(intervalSeconds > 0)
          interval = intervalSeconds * 1000;
        else
          interval = 15 * 60000; // set default
      }
    }
    // our dashboard
    else {
      if(intervalSeconds < 0)
        return; // no update
      interval = intervalSeconds * 1000;
    }
    var timerId = setInterval("WidgetRefresher._onInterval(\"" + divId + "\")", interval);
    this.widgetsArr[divId].timerId = timerId;
  },
  updateWidgetByUrl : function(url) {
    for(i in this.widgetsArr) {
      if(this.widgetsArr[i].bookmarkUrl == url) {
        this._onInterval(i);
        break;
      }
    }
  },
  _onInterval : function(divId) {
    var url = getBaseUri() + "widget/div/oneWidget.html";
    var bookmarkUrl = WidgetRefresher.widgetsArr[divId].bookmarkUrl;
    var params = "-$action=explore&-refresh=y&-grid=y&-featured=y&uri=" + encodeURIComponent(bookmarkUrl);

//    var params = "-$action=explore&-export=y&-grid=y&-featured=y&uri=" + encodeURIComponent(bookmarkUrl);

    var cookieDiv = document.getElementById("ad_session_id");
//    opera.postError(cookieDiv);
    if (cookieDiv) {
      xcookie = cookieDiv.innerHTML;
//      opera.postError(cookie);
//      if (xcookie)
//        document.cookie = escape(cookie);
    }

/*
    var encryptedPassword = widget.preferenceForKey(this.PREFS_STR_KEY_NAME);
    if (!encryptedPassword) {
      var pDiv = document.getElementById('publicKey');
      if (pDiv)
        var publicKey = widget.preferenceForKey(this.PREFS_STR_KEY_NAME);

    }
*/
    var divToRefresh;
    // refresh whole the widget including backside
    var widgetDivId = "widget_" + bookmarkUrl;
    divToRefresh = document.getElementById(widgetDivId);

    Debug.setMode(true);
    Debug.log('_onInterval: url = ' + url + "; params = " + params);

    postRequest(null, url, params, divToRefresh, null, WidgetRefresher.refresh, true);
  },
  // called by postRequest
  refresh : function(event, div, hotSpot, content)  {
    div.innerHTML = content;
    if(OperaWidget.isWidget())
      OperaWidget.onWidgetRefresh();
  }
}

function changeSkin(event) {
  var e = getDocumentEvent(event);
  if (!e)
    return;

//  var target = getTargetElement(e);
  var target = getEventTarget(event); //getTargetElement(event);
  var value = target.value;
  var t = target;
  while (true) {
    var parent = t.parentNode;
    if (!parent)
      break;
    if (parent.tagName.toLowerCase() == 'div') {
      var div = parent;
      if (div.id   &&  div.id == 'skin') {
        div.className = value;
        break;
      }
    }
    t = parent;
  }
}

function addthis_click(event, addthis_title) {
  var e = getDocumentEvent(event);
  if (!e)
    return;

  var target = getTargetElement(e);

  window.open(target.href, addthis_title, 'scrollbars=yes,menubar=no,width=620,height=520,resizable=yes,toolbar=no,location=no,status=no,screenX=200,screenY=100,left=200,top=100');
  return stopEventPropagation(event);
}


var OperaWidget = {
  CONTENT_KEY_NAME   : "content",
  PREFS_STR_KEY_NAME : "prefs_str",
  MAX_WND_WIDTH : 600,
  MAX_WND_HEIGHT : 600,
  BACKSIDE_WIDTH  : 305,
  BACKSIDE_HEIGHT : 190,
  widgetDiv : null,
  frontDiv : null,
  backDiv : null,
  prefForm : null,
  widgetWidth  : 0,
  widgetHeight : 0,
  refreshInterval : -1, // default

  init : function(widgetDivId) {
    if(typeof widget == 'undefined')
      return;
    // 1. widget div
    this.widgetDiv = document.getElementById(widgetDivId);
    if(!this.widgetDiv)
      return;
    // 2. front & back children divs
    this.frontDiv = getChildByAttribute(this.widgetDiv, "className", "front");
    var backId =  this.frontDiv.id + "_back";
    this.backDiv = getChildById(this.widgetDiv, backId);
    // 3. restore content from pref
/*
    var content = widget.preferenceForKey(this.CONTENT_KEY_NAME);
    if(typeof content != 'undefined' && content.length != 0) {
      content = content.replace(/\r|\n|\r\n|\s/g, " ");
      this.widgetDiv.innerHTML = content;
    }
*/
    // 3. fitWindowSize does not work on this moment!
    //this.fitWindowSize();
    Debug.setMode(true);
    Debug.log('OperaWidget.init');
    this.resizeOnFrontside();

    // 6. init prefs on the back
    this.applyPrefs();
    // 5.
    this.processWidth();
    // 6.
    resizeHandle.init();
  },

  onWidgetRefresh : function() {
    this.frontDiv = getChildByAttribute(this.widgetDiv, "className", "front");
    var backId =  this.frontDiv.id + "_back";
    this.backDiv = getChildById(this.widgetDiv, backId);
    Debug.setMode(true);
    Debug.log('onWidgetRefresh');
    this.processWidth();
    resizeHandle.init();
    this.applyPrefs();
    this.saveContent();
    this.resizeOnFrontside();
  },
  // stores min size and makes width = 100%
  processWidth : function() {
    this.minWidth = this.widgetDiv.offsetWidth;
    this.minHeight = this.widgetDiv.offsetHeight;
    var parentTable = getAncestorByTagName(this.widgetDiv, "table");
    parentTable.width = "100%";
    // set cellpadding = 0
    parentTable.cellpadding = 0;
  },

  resizeOnFrontside : function() {
    if(typeof widget == 'undefined')
      return;
    //if(this.widgetWidth == 0 || this.widgetHeight == 0)
    //  return;
    //window.resizeTo(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);
    //sizeWidget(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);
    //displayDiv(null, this.frontDiv.id);
    //var divCoords = getElementDimensions(this.frontDiv);
    //activateDiv(null, this.frontDiv.id);
    //Debug.setMode(true);
    //Debug.log('frontSide: width = ' + divCoords.width + '; height = ' + divCoords.height);
    //Debug.log('frontSide: width = ' + this.frontDiv.clientWidth + '; height = ' + this.frontDiv.clientHeight);

    //sizeWidget(divCoords.width, divCoords.height + 100);
    //window.resizeTo(divCoords.width, divCoords.height);
  },

  resizeOnBackside : function() {
    if(typeof widget == 'undefined')
      return;
    /*
    var wndSize = getWindowSize();
    this.widgetWidth  = wndSize[0];
    this.widgetHeight = wndSize[1];

    window.resizeTo(this.BACKSIDE_WIDTH, this.BACKSIDE_HEIGHT);
    */
    /*
    window.resizeTo(this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT);

    var divCoords = getElementDimensions(this.backDiv);
    Debug.setMode(true);
    Debug.log('backside: width = ' + divCoords.width + '; height = ' + divCoords.height);
    Debug.log('backside: width = ' + this.backDiv.clientWidth + '; height = ' + this.backDiv.clientHeight);

    window.resizeTo(divCoords.width, divCoords.height);
    */
  },
  saveContent : function() {
    if(typeof widget == 'undefined')
      return;
    var content = this.widgetDiv.innerHTML;
    widget.setPreferenceForKey(content, this.CONTENT_KEY_NAME);
  },
  savePreferencesStr : function(preferencesStr) {
    widget.setPreferenceForKey(preferencesStr, this.PREFS_STR_KEY_NAME);
  },
  // 1) restores backside values 2) applies chosen skin
  applyPrefs : function() {
    Debug.restoreLog();
    var prefsStr = widget.preferenceForKey(this.PREFS_STR_KEY_NAME);
    if(typeof prefsStr == 'undefined' || prefsStr.length == 0)
      return;
    // get pref form (on each refresh)
    forms = widgetDiv.getElementsByTagName("form");
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].id) {
        var idx = forms[i].id.indexOf('pref_');
        if (idx == 0) {
          this.prefForm = forms[i];
          break;
        }
      }
    }
    if (this.prefForm == null)
      throw new Error("form pref_ not found");

    //***********************************************
    //* restore form fields from preferences
    //*
    // parameters to calculate refresh in milliseconds.
    var intervalNumber = 15;       // key: "refresh.seconds"
    var intervalType = "minute(s)"; // key: "refresh.durationType"
    var skinName = "";

    var prefPairs = prefsStr.split('&');
    for(var i = 0; i < prefPairs.length; i++) {
      var pair = prefPairs[i].split('=');
      if(typeof pair[1] == 'undefined')
        continue;

      // set <input> values
      if(typeof this.prefForm[pair[0]] != 'undefined')
        this.prefForm[pair[0]].value = decodeURIComponent(pair[1]);

      // interval values
      if(pair[0] == "refresh.seconds")
        intervalNumber = pair[1];
      if(pair[0] == "refresh.durationType")
        intervalType = pair[1];

      if(pair[0] == ".skin")
        skinName = pair[1];
    }
    // 2. calculate refreshInterval
    this.calculateRefreshInterval(intervalNumber, intervalType);
    // 3. restore skin
    var skinDiv = getChildById(widgetDiv, 'skin');
    if(skinDiv)
      skinDiv.className = skinName;

    var pKey = this.prefForm['publicKey'];
    if (!pKey) {
      var pDiv = document.getElementById('publicKey');
      if (pDiv) {
        this.prefForm['publicKey'].value = pDiv.innderHTML;
      }
    }
  },

  calculateRefreshInterval : function(intervalNumber, intervalType) {
      var refreshInterval = 1;
      refreshInterval *= intervalNumber;
      if(intervalType.indexOf("minute(s)") == 0) {
        refreshInterval *= 1000 * 60;
      }
      else if(intervalType == "hour(s)")
        refreshInterval *= 1000 * 360;
      else if(intervalType == "day(s)")
        refreshInterval *= 1000 * 360 * 24;
      else if(intervalType == "week(s)")
        refreshInterval *= 1000 * 360 * 24 * 7;
      else if(intervalType == "month(s)")
        refreshInterval *= 1000 * 360 * 24 * 30;
      else if(intervalType == "years(s)")
        refreshInterval *= 1000 * 360 * 24 * 360;

      this.refreshInterval = refreshInterval;
  },
  getWidgetDiv : function() {
    return this.widgetDiv;
  },
  getWidgetFrontDiv : function() {
    return this.frontDiv;
  },
  getRefreshInterval : function() {
    return this.refreshInterval;
  },
  getMinSize : function() {
    return [this.minWidth, this.minHeight];
  },
  getMaxSize : function() {
    return [this.MAX_WND_WIDTH, this.MAX_WND_HEIGHT];
  },

  isWidget : function() {
    if(typeof widget != 'undefined')
      return true;
    return false;
  }
}

// workaround for widget resize bug in Apple dashboard
// http://blog.keilly.com/2007/05/widget-resize.html
function sizeWidget(x,y) {
  if (typeof opera != 'undefined') {
    window.resizeTo(x,y);
    return;
  }
  if (x == window.innerWidth && y == window.innerHeight)
    return;

  // size limiting code
  if (x <= 200)
    x = 200;
  if (x >= 440)
    x = 440;
  if (y <= 130)
    y = 130;
  if (y >= 340)
    y = 340;

    // prevent vertical resize bug
  if (y > 130 && y < 340 && y != window.innerHeight && x == window.innerWidth)
    window.resizeTo(x + 1, y);

  // finally the original resize
  window.resizeTo(x,y);
}

var downloadWidget = {
  sizesArr : new Array(), // member struct: {width, height}
  storeFrontsideSize : function(div){
    if(div == null)
      return;
    if (typeof div == 'string')
      div = document.getElementById(div);
    if(div == null)
      return;
    var size = new Object();
    size.width = div.offsetWidth;
    size.height = div.offsetHeight;
    this.sizesArr[div.id] = size;
  },
  doit : function(imgObj, url) {
    var obj = imgObj;
    // find parent backside div
    var id;

    while(obj != null) {
      id =  obj.id;
		  if (obj.className == "hdn" && id.indexOf("_back") != -1) {
		    widgetDiv = obj;
		    break;
		  }
		  obj = obj.parentNode;
	  }
    // key in sizesArr array is ID of frontsize, so without "_back" (5 letters)
    var key = id.substr(0, id.length - 5);

    // temporary hack; margin = windowSize - sivSize
    var MARGIN_X = 9;
    var MARGIN_Y = 9;
    url += "&-widthFront="  + (this.sizesArr[key].width + MARGIN_X);
    url += "&-heightFront=" + (this.sizesArr[key].height + MARGIN_Y);

    document.location = url;
//    var cookie = window.getElementById('-cookie');
//    alert(cookie);
  }
}

// Write to the debug div or log console.
var Debug = {
  logPref: 'log',
  debugMode: false,

  log: function(str) {
    if (this.debugMode) {
      if (window.widget) {
        alert(str);
        /*
        var div = document.getElementById('debugDiv');
        if (!div) {
          var div = document.createElement('div');
          div.setAttribute('id', 'debugDiv');
        }
        div.appendChild(document.createTextNode(str));
        div.appendChild(document.createElement("br"));
        div.scrollTop = div.scrollHeight;
        var s = widget.preferenceForKey(this.logPref);
        widget.setPreferenceForKey(s + '<br>' + str, this.logPref);
        */
      }
      else {
        if (typeof console != 'undefined')
          console.log(str);
        else if (typeof opera != 'undefined')
          opera.postError(str);
      }
    }
  },

  restoreLog: function(str) {
    return;
    if (this.debugMode) {
      if (window.widget) {
        var div = document.getElementById('debugDiv');
        if (!div) {
          var div = document.createElement('div');
          div.setAttribute('id', 'debugDiv');
        }
        var s = widget.preferenceForKey(this.logPref);
        if (s)
          div.innerHTML = s;
      }
    }
  },

  setMode: function(active) {
    var m = this.debugMode;
    this.debugMode = active;
    if (window.widget) {
      var d = document.getElementById('debugDiv');
      if (!d)
        return;
      if (active)
        d.style.display = 'block';
      else
        d.style.display = 'none';
    }
    return m;
  }
}

var resizeHandle = {
  MIN_WIDTH_PLUS : 0,
  MIN_HEIGHT_PLUS : 0,
  widgetDiv : null,
  handleDiv : null,
  growboxInset : null,
  maxSize : null,
  minSize : null,

  init : function() {
    this.handleDiv = document.createElement('div');
    this.handleDiv.className = 'resize_handle';
    this.handleDiv.onmousedown = this.mouseDown;
    this.widgetDiv = OperaWidget.getWidgetFrontDiv();
    this.widgetDiv.appendChild(this.handleDiv);

    // try to prevent content offset
    addEvent(window, "scroll", this.onScroll, true);
    addEvent(document.body, "scroll", this.onScroll, true);

    this.restoreSize();
  },
  mouseDown : function(event) {
      var thisObj = resizeHandle;
      addEvent(document, "mousemove", thisObj.mouseMove, true);
      addEvent(document, "mouseup", thisObj.mouseUp, true);
      thisObj.growboxInset = {x:(window.innerWidth - event.x), y:(window.innerHeight - event.y)};
      event.stopPropagation();
      event.preventDefault();
  },
  mouseMove : function(event) {
      var thisObj = resizeHandle;
      var width = event.x + thisObj.growboxInset.x;
      var height = event.y + thisObj.growboxInset.y;

      if(this.maxSize == null)
        this.maxSize = OperaWidget.getMaxSize();
      if(this.minSize == null)
        this.minSize = OperaWidget.getMinSize();

      if(width > this.maxSize[0])
        width = this.maxSize[0];
      if(width < this.minSize[0] + this.MIN_WIDTH_PLUS)
        width = this.minSize[0] + this.MIN_WIDTH_PLUS;

      if(height > this.maxSize[1])
        height = this.maxSize[1];
      if(height < this.minSize[1] + this.MIN_HEIGHT_PLUS)
        height = this.minSize[1] + this.MIN_HEIGHT_PLUS;

      event.stopPropagation();
      event.preventDefault();

      window.resizeTo(width, height);

      var scroll = getScrollXY();
      widgetDiv.style.marginLeft = scroll[0];
      widgetDiv.style.marginTop = scroll[1];

      thisObj.handleDiv.style.bottom = 0;
      thisObj.handleDiv.style.right = 0;
  },
  mouseUp : function(event) {
    var thisObj = resizeHandle;
    removeEvent(document, "mousemove", thisObj.mouseMove, true)
    removeEvent(document, "mouseup", thisObj.mouseUp, true);
    event.stopPropagation();
    event.preventDefault();

    var scroll = getScrollXY();
    widgetDiv.style.marginLeft = scroll[0];
    widgetDiv.style.marginTop = scroll[1];

    thisObj.saveSize();
  },
  onScroll : function(event) {
    event.stopPropagation();
    event.preventDefault();
    return false;
  },
  saveSize : function() {
    var wndSize = getWindowSize();
    this.widgetWidth  = wndSize[0];
    this.widgetHeight = wndSize[1];

    widget.setPreferenceForKey(this.widgetWidth,  "width");
    widget.setPreferenceForKey(this.widgetHeight, "height");
  },
  restoreSize : function() {
    this.widgetWidth  = widget.preferenceForKey("width");
    this.widgetHeight = widget.preferenceForKey("height");

    if(!this.widgetWidth)
      return;
    window.resizeTo(this.widgetWidth, this.widgetHeight);
  }
}

var FullScreenPopup = {
  INTERVAL : 10, // ms
  STEPS_NUM : 7,

  wndWidth : null,
  contentDiv : null,
  div : null,
  step : 0,
  toShow : true,
  oldMarginLeft : null,

  submitBtn : null,

  show : function(div, hotspot) {
    if(!Browser.mobile)
      return false;

    this.div = div;
    // suppose that "mainskin" is always applicable
    this.contentDiv = document.getElementById("mainskin");
    this.oldMarginLeft = this.contentDiv.style.marginLeft;

    document.body.style.overflow = "hidden";

    var divStl = div.style;
    div.style.visibility = "visible";
    var wndSize = getWindowSize();
    this.wndWidth = wndSize[0];
    divStl.height = wndSize[1];
    divStl.top = 0;

    var zIndex = 1;
    if (hotspot) {
      var z = hotspot.style.zIndex;
      if (z != null && z != '')
        zIndex = z;
    }
    divStl.zIndex = zIndex + 2;
    this.toShow = true;
    this._prepareDialog();
    this._animate();
    return true;
  },
  hide : function(div) {
    if(typeof div != 'undefined') {
      if(typeof div == 'string')
        div = document.getElementById(div);
      this.div = div;
    }
    this.contentDiv.style.display = "";
    this.toShow = false;
    this._animate();
  },
  _prepareDialog : function() {
    if(this.div.id != 'pane2')
      return;
    this.submitBtn = getChildByAttribute(this.div, "name", "submit");
    if(this.submitBtn != null) {
      this.submitBtn.style.display = "none";
    }
    var cancelBtn = getChildByAttribute(this.div, "name", "cancel");
    if(cancelBtn != null)
      cancelBtn.style.display = "none";
  },
  // replace "dummy" submit image with submit button
  _prepareSubmitButton : function() {
    if(this.submitBtn == null)
      return;
    var submitImg = getChildById(this.div, "submit_img");
    if(submitImg == null)
      return;
    var x = findPosX(submitImg);
    var y = findPosY(submitImg);
    submitImg.style.display = "none";

    var sbStl = this.submitBtn.style;
    sbStl.position = "absolute";
    sbStl.left = x;
    sbStl.top  = y;
    sbStl.borderWidth = 0;
    sbStl.background = "url(images/skin/iphone/submit.png)";
    sbStl.width = 68;
    sbStl.height = 30;
    this.submitBtn.value = "";
    sbStl.display = "";
  },
  _animate : function() {
    var thisObj = FullScreenPopup;
    var divStl = thisObj.div.style;
    var cntDivStl = thisObj.contentDiv.style;
    var x;

    var delta = Math.floor(thisObj.wndWidth / thisObj.STEPS_NUM);

    if(thisObj.toShow) {
      if(thisObj.step == thisObj.STEPS_NUM)
        x = this.wndWidth;
      else
        x = thisObj.step * delta;
    }
    // to hide popup
    else {
      if(thisObj.step == thisObj.STEPS_NUM) {
        divStl.visibility = "hidden";
        x = thisObj.oldMarginLeft;
      }
      else
        x = thisObj.wndWidth - (thisObj.step * delta);
    }

    cntDivStl.marginLeft = x;

    divStl.left  = x - thisObj.div.clientWidth;
    divStl.width =  this.wndWidth;

    if(thisObj.step < thisObj.STEPS_NUM) {
      thisObj.step++;
      setTimeout("FullScreenPopup._animate();", thisObj.INTERVAL);
    }
    else { // stop animation
      if(thisObj.toShow) {
        cntDivStl.display = "none";
        thisObj._prepareSubmitButton();
      }
      else {
        // overflow "auto" did not work in Safari
        var wndSize = getWindowSize();
        if(wndSize[0] < document.body.scrollWidth ||
            wndSize[1] < document.body.scrollHeight)
          document.body.style.overflow = "scroll";
      }
      thisObj.step = 0;
    }
  }
}

// allows reorder table rows
var OrderRows = {
  BG_COLOR : "rgb(172, 210, 226)",
  tbody : null,
  tableTop : null,
  prevY : null,
  prevRowOld : null,
  dragRowIdxOld : null,

  getDragBlock : function(dragHandler) {
    var tr = getAncestorByTagName(dragHandler, "tr");
    return tr;
  },
  onStartDrag : function(dragRow) {
    this.tbody = getAncestorByTagName(dragRow, "tbody");
    this.tableTop = findPosY(this.tbody);
    this.prevRowOld = dragRow.previousSibling;
    dragRow.style.backgroundColor = this.BG_COLOR;

    this.dragRowIdxOld = dragRow.rowIndex;
  },
  onDrag : function(dragBlock, x, y) {
    this.isDirUp = this.detectDirection(y);
    var offsetY = y - this.tableTop;
    var targetRow = this.detectTargetRow(offsetY);
    if(targetRow) {
      var isTargetUpper = (targetRow.offsetTop < dragBlock.offsetTop);
      if((this.isDirUp && isTargetUpper) || (!this.isDirUp && !isTargetUpper))
        if(targetRow.rowIndex != dragBlock.rowIndex)
          swapNodes(targetRow, dragBlock);
    }
    return [false, true];
  },
  onStopDrag : function(e, dragRow) {
    dragRow.style.backgroundColor = "";
    if(this.dragRowIdxOld != dragRow.rowIndex)
      this.onRowMovement(dragRow, this.prevRowOld, dragRow.previousSibling);
  },
  detectDirection : function(y)  {
    var isDirUp = null;
    if(this.prevY > y)
      isDirUp = true;
    else if(this.prevY < y)
      isDirUp = false;

    this.prevY = y;
    return isDirUp;
  },
  detectTargetRow : function(offsetY) {
    var targetRow = null;
    var rows = this.tbody.rows;
    for (var i = 0; i < rows.length; i++) {
      if((offsetY > rows[i].offsetTop) &&
        (offsetY < rows[i].offsetTop + rows[i].offsetHeight))
      return rows[i];
    }
    return null;
  },
  onRowMovement : function(row, prevRowOld, prevRowNew) {

  }
}

// html (img) on disabled Flash
var FlashHandler = {
  emdCodeArr : null,
  embed : function(id, flashCode, htmlCode) {
    if (this.emdCodeArr == null) {
      this.emdCodeArr = new Array();
      if (!Browser.ie)
        addEvent(window, "load", this.onload, false);
    }
    this.emdCodeArr.push([id, flashCode, htmlCode]);
  },
  init : function() {
    if (Browser.ie)
      this.onload();
  },
  onload : function() {
    var thisObj = FlashHandler;
    
    if (thisObj.emdCodeArr == null)
      return;

    var isFlashAvailable = DetectFlashVer(8, 0, 0);
    
    for(var i = 0; i < thisObj.emdCodeArr.length; i++) {
      var div = document.getElementById(thisObj.emdCodeArr[i][0]);
      if(!div)
        continue;
      if (isFlashAvailable)
        div.innerHTML = thisObj.emdCodeArr[i][1];
      else
        div.innerHTML = thisObj.emdCodeArr[i][2];
    }
  }
}

function getCalendar() {
// calling function in the last file
  var FILES_TO_LOAD = ["calendar/calendar.css", "calendar/calendar.js"];
  getCalendar = null;

  var argsArr = new Array();
  for(var i = 0; i < arguments.length; i++) {
    if (i == 0) {
      var clonedEvent = cloneEvent(arguments[0]);
      argsArr.push(clonedEvent);
    }
    else
      argsArr.push(arguments[i]);
  }
  LoadOnDemand.doit(FILES_TO_LOAD, "getCalendar", argsArr);
}

function initStyleSheet() {
  var FILES_TO_LOAD = ["style_sheet/style_sheet.js"]; //"toolbar.js",
  initStyleSheet = null;
  LoadOnDemand.doit(FILES_TO_LOAD, "initStyleSheet", arguments);
}

// LoadOnDemand
var LoadOnDemand = {
  cbArr : new Array, // structure -> [name: , args: ]
  doit : function(files, callbackName, callbackArgs) {
    var callback = {name: callbackName, args: callbackArgs};
    this.cbArr.push(callback);

    if(typeof files == "string")
      files = new Array(files);
    for(var i = 0; i < files.length; i++) {
      if(/.css$/.test(files[i])) {
        this.includeCSS(files[i]);
      }
      else
        this.includeJS(files[i]);
    }
    setTimeout(this.listener, 100);
  },
  listener : function() {
    var thisObj = LoadOnDemand;
    for(var i = 0; i < thisObj.cbArr.length; i++) {
      var callback = eval(thisObj.cbArr[i].name);
      if(callback != null) {
        var idx = i;
        setTimeout(function() {callback.apply(null, LoadOnDemand.cbArr[idx].args); thisObj.cbArr.splice(idx, 1); }, 10);
      }
    }
    if(thisObj.cbArr.length != 0) {
      setTimeout(thisObj.listener, 50);
    }
  },
  includeJS : function(fileName) {
      var html_doc = document.getElementsByTagName('head')[0];
      var js = document.createElement('script');
      js.setAttribute('type', 'text/javascript');
      js.setAttribute('src', fileName);
      html_doc.appendChild(js);
      return false;
  },

  includeCSS : function(fileName) {
      var html_doc = document.getElementsByTagName('head')[0];
      var css = document.createElement('link');
      css.setAttribute('rel', 'stylesheet');
      css.setAttribute('type', 'text/css');
      css.setAttribute('href', fileName);
      html_doc.appendChild(css);
      return false;
  }

}

// TabSwap
var TabSwap = {
  PH_BACK_COLOR : "#eee",
  PH_BORDER : "1px dashed #f00",

  placeHolder : null,
  movedTab : null,
  tabsArr : null,
  isDragMode : false,
  prevX : -1,

  init : function() {
    this.placeHolder = document.createElement("div");
    var phStl = this.placeHolder.style;
    phStl.dispaly = "none";
    phStl.verticalAlign = "bottom";
    phStl.border = this.PH_BORDER;
    phStl.backgroundColor = this.PH_BACK_COLOR;

    document.body.appendChild(this.placeHolder);
    this.prepareTabs();
  },
  getDragBlock : function(dragHandleObj, caughtObj) {
	  // move a tab only caught by icon
	  if(caughtObj.className != 'iinp_move')
		  return null;

    // find moved tab
    var classNameArr = new Array();
    classNameArr.push("tabs");
    classNameArr.push("tabs_current");
    this.movedTab = getAncestorByAttribute(dragHandleObj, "className", classNameArr);

    if(this.placeHolder == null)
      this.init();

    return this.movedTab;
  },

  onStartDrag : function() {
    if(this.isDragMode == false) {
      this.isDragMode = true;
    }
    else
      return;
    var mtStl = this.movedTab.style;
    mtStl.verticalAlign = "top"; // for correct position
    mtStl.left = findPosX(this.movedTab);
    mtStl.top = findPosY(this.movedTab);
    mtStl.position = "absolute";
    var phStl = this.placeHolder.style;
    phStl.width = this.movedTab.offsetWidth;
    phStl.height = this.movedTab.offsetHeight;

    if(Browser.ie)
      phStl.display = "inline";
    else if(Browser.gecko)
      phStl.display = "-moz-inline-box";
    else
      phStl.display = "inline-block";
    swapNodes(this.movedTab, this.placeHolder);
  },
  onDrag : function(dragBlock, x, y) {
    if(!this.isDragMode)
      return;

    this.isDirLeft = this.detectDirection(x);
    var midX = x + Math.ceil(dragBlock.offsetWidth / 2);
    var targetTab = this.detectTargetTab(midX);
    if(targetTab) {
      var isTargetLefter = (targetTab.offsetLeft < dragBlock.offsetLeft);
      if((this.isDirLeft && isTargetLefter) || (!this.isDirLeft && !isTargetLefter)) {
        swapNodes(targetTab, this.placeHolder);
        this.updateAllTabRects();
      }
    }

    return [true, false];
  },
  onStopDrag : function(e, dragBlock) {
    if(!this.isDragMode)
      return;

    this.placeHolder.style.display = "none";
    var mtStl = this.movedTab.style
    mtStl.position = "static";
    mtStl.verticalAlign = "bottom";

    swapNodes(this.placeHolder, this.movedTab);
    this.prevX = -1;
    this.isDragMode = false;
  },
  detectDirection : function(x)  {
    var isDirLeft = null;
    if(this.prevX > x)
      isDirLeft = true;
    else if(this.prevX < x)
      isDirLeft = false;

    this.prevX = x;
    return isDirLeft;
  },

  detectTargetTab : function(x) {
    for (var i = 0; i < this.tabsArr.length; i++) {
      if (this.tabsArr[i].isInside(x)) {
        return this.tabsArr[i].tabObj;
      }
    }
    return null;
  },
  updateAllTabRects : function() {
    for (var i = 0; i < this.tabsArr.length; i++)
      this.tabsArr[i].update();
  },
  prepareTabs : function() {
    this.tabsArr = new Array();
    var tables = this.movedTab.parentNode.getElementsByTagName('table');
    var idx = 0;
    for (var i = 0; i < tables.length; i++)
      if (tables[i].className == "tabs" || tables[i].className == "tabs_current") {
        this.tabsArr[idx] = new TabSwap.TabRect(tables[i], idx);
        idx++;
      }
  },

  TabRect : function(tabObj, idx) {
    this.tabObj = tabObj;
    this.idx = idx;
    this.left;
    this.right;

    this.update = function() {
      this.left = findPosX(this.tabObj);
      this.right = this.left + this.tabObj.offsetWidth;
    }
    this.isInside = function(x) {
      if(this.tabObj.style.position == "absolute")
        return false;
      return (x > this.left && x < this.right);
    }
    this.update();
  }
}

function showMobileTab(e, hideDivId, unhideDivId) {
  e = getDocumentEvent(e);

  var hasPrefix;
  if (hideDivId  &&  hideDivId.length != 0) {
    var tokens = hideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.HIDDEN;
      div.style.display = "none";
    }
  }
  if (unhideDivId  &&  unhideDivId.length != 0) {
    var tokens = unhideDivId.split(',');
    var len = tokens.length;
    for(var i = 0; i < len; i++) {
      var tok = trim(tokens[i]);
      var div = document.getElementById(tok);
      if (!div)
        continue;
      div.style.visibility = Popup.VISIBLE;
      div.style.display = 'inline';
    }
  }
//  ExecJS.runDivCode(curDiv);
//  if(typeof ImageAnnotations != 'undefined')
//    ImageAnnotations.onTabSelection(curDiv);

//  resizeIframeOnTabSelection(curDiv); // IE

  return stopEventPropagation(e);
}

/*
function addBeforeProcessing(tableId, subject, event) {
  var table = document.getElementById(tableId);
  if (!table)
    return stopEventPropagation(event);
  var tbody = table.getElementsByTagName('tbody');
  if (!tbody || tbody.length == 0)
    return stopEventPropagation(event);
  var curItem = document.getElementById('currentItem');
  var curTr;
  var ctbody = tbody[0];
  var pos = 1;
  var afterTR;
  if (curItem == null) {
    var elms = ctbody.getElementsByTagName('tr');
    for (var i=0; i<elms.length  &&  curTr == null; i++) {
      if (elms[i].id.indexOf('http') == 0) {
        curTr = elms[i];
        afterTR = curTr;
//        pos = i + 1;
      }
    }
  }
  else {
    curTr = document.getElementById(curItem.href);
    var elms = ctbody.getElementsByTagName('tr');
    for (var i=0; i<elms.length; i++) {
      var id = elms[i].id;
      if (id && curTr.id == id) {
        if (i != elms.length) {
          afterTR = elms[i + 1];
          pos = i + 1;
        }
        else
          pos = -1;
        break;
      }
    }
  }
  if (curTr == null)
    return stopEventPropagation(event);
  var newTr = copyTableRow(ctbody, pos, curTr);
  elms = newTr.getElementsByTagName('td');

  elms[0].innerHTML = subject.value;
  for (var i=1; i<elms.length; i++)
    elms[i].innerHTML = "";
  if (pos == -1)
    ctbody.appendChild(newTr);
  else
    ctbody.insertBefore(newTros, curTr);
  return stopEventPropagation(event);
}
function addBeforeProcessing(tbodyId, subject, event) {
  var table = document.getElementById(tableId);
  if (!table)
    return stopEventPropagation(event);
  var tbody = table.getElementsByTagName('tbody');
  if (!tbody || tbody.length == 0)
    return stopEventPropagation(event);
  var ctbody = tbody[0];
  var afterTR;

  var curTr = document.getElementById('tr_empty');
  if (curTr == null)
    return stopEventPropagation(event);
  var newTr = copyTableRow(ctbody, 1, curTr);
  newTr.style.visibility = Popup.VISIBLE;
  newTr.style.display = "inline";
  newTr.id = 'newTr';
  var elms = newTr.getElementsByTagName('td');
  elms[0].innerHTML = subject.value;
  var date = new Date();
  elms[1].innerHTML = '<tt>' + date.getHours() + ':' + date.getMinutes() + '</tt>';
  ctbody.appendChild(newTr);

  var div = document.createElement('div');
  div.style.display = "none";
  var form = document.forms['tablePropertyList'];
  var params = getFormFilters(form, true);
  subject.value = '';

  var retCode = stopEventPropagation(event);
  postRequest(event, 'mkresource', params, div, newTr, updateTR);
  return retCode;
}
*/
