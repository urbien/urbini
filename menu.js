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
if (window.Node && Node.prototype && !Node.prototype.contains)
{
  Node.prototype.contains = function (arg) {
    return !!(this.compareDocumentPosition(arg) & 16)
  }
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
if (document.attachEvent) {
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
}

Popup.allowTooltip = function (target) {
  var noOpenPopups = true;
  for (var i=0; i<Popup.popups.length; i++) {
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
  Popup.delayedPopup = null;
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

// part of delayed close after the timeout
Popup.delayedClose1 = function (divId) {
  var popup = Popup.getPopup(divId);
  if (!popup)
    return;

  if (!popup.delayedCloseIssued) // delayed close canceled
    return;
  popup.close();
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
Popup.load = function (divId, frameId) {
  var frameId     = 'popupFrame';
  var frameBodyId = 'popupFrameBody';

  if (!frameLoaded[frameId]) {
    setTimeout("Popup.load('" + divId + "')", 50);
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
  var redirect = popupFrame.document.getElementById('$redirect');
  if (redirect) {
    document.location.href = redirect.href;
    return;
  }
///
  var idx = propName.indexOf(".", 1);
  var shortPropName = propName;
  if (idx != -1)
    shortPropName = propName.substring(0, idx);
///
  var popup = Popup.getPopup(divId);
  popup.setInnerHtml(body.innerHTML);

  // filter calendar
/*
  if (popupFrame.CAL_INIT_From)
    new calendar(popupFrame.CAL_INIT_From, CAL_TPL1, shortPropName + '_From');
  if (popupFrame.CAL_INIT_To)
    new calendar(popupFrame.CAL_INIT_To, CAL_TPL1, shortPropName + '_To');
  // data entry calendar
  if (popupFrame.CAL_INIT)
    new calendar(popupFrame.CAL_INIT, CAL_TPL1, shortPropName);
*/
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
    if (self.div.id != 'pane2')
      self.interceptEvents();
    self.setFocus();
    initListBoxes(self.div);
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
    self.delayedCloseIssued = true;
    self.closeTimeoutId = setTimeout("Popup.delayedClose1('" + divId + "')", timeout);
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
      return; // incorrect popup structure

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
    for (var i=0; i<n; i++) {
      var popupItem = new PopupItem(elem, i);
      self.items[popupItem.id];
      addEvent(elem, 'click',     self.popupRowOnClick,     false);
      var anchors = elem.getElementsByTagName('a');
      if (anchors  &&  anchors.length != 0) {
        if (anchors[0].onclick) {
          anchors[0].onclick1 = anchors[0].onclick;
          anchors[0].onclick = '';
        }
        var href = anchors[0].href;
        //anchors[0].href = 'javascript:;';
        elem.setAttribute('href', href);
        //anchors[0].disabled = true;
      }

      addEvent(elem, 'mouseover', self.popupRowOnMouseOver, false);
      addEvent(elem, 'mouseout',  self.popupRowOnMouseOut,  false);
      elem = self.nextRow();
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
    var target = getTargetElement(e);
    if (!target)
      return;

    // detected re-entering into the popup - thus clear a timeout
    self.delayedCloseIssued = false;
    if (self.closeTimeoutId != null) {
      self.delayedCloseIssued = false;

      clearTimeout(self.closeTimeoutId);
      self.closeTimeoutId = null;
    }
    return true;
  }

  /**
   * Popup's and hotspot's on mouseout handler
   */
  this.popupOnMouseOut = function (e) {
    var target = getMouseOutTarget(e);
    if (!target)
      return true;

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

    // if there is a link on this row - follow it
    var anchors = tr.getElementsByTagName('a');
    if (anchors  &&  anchors.length != 0) {
      if (currentDiv) {
        loadedPopups[currentDiv.id] = null;
        Popup.close0(currentDiv.id);
      }
      var trg = anchors[0].getAttribute('target');
      if (trg)
        return true;

      if (anchors[0].onclick1) {
        anchors[0].onclick1(e);
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
    if (next.tagName && next.tagName.toUpperCase() == 'TR' && next.id != 'divider' && next.id.indexOf("_$calendar") == -1) {
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

    if (prev.tagName && prev.tagName.toUpperCase() == 'TR' && prev.id != 'divider' && prev.id.indexOf("_$calendar") == -1) {
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

var frameLoaded = new Array();

var rteUpdated = 'false';
var allRTEs = '';

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
    if (popup == null) {
      div = document.getElementById(divId);
      popup = new Popup(div, hotspot);
    }
    else
      popup.reset(hotspot);
  }

  // form url based on parameters that were set

  var formAction = form.elements['-$action'].value;
  var baseUriO = document.getElementsByTagName('base');
  var baseUri = "";
  if (baseUriO) {
    baseUri = baseUriO[0].href;
    if (baseUri  &&  baseUri.lastIndexOf("/") != baseUri.length - 1)
      baseUri += "/";
  }
  var url = baseUri + "smartPopup?prop=" + encodeURIComponent(propName);
  if (currentFormName.indexOf("siteResourceList") == 0) {
    url += "&editList=1&uri=" + encodeURIComponent(currentResourceUri) + "&type=" + form.elements['type'].value;
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
      var params = getFormFilters(form, allFields);
      if (params)
        url = url + params;
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
  url += "&$form=" + currentFormName;
  url += "&" + propName + "_filter=y";
  if (!enterFlag)
    url += "&$selectOnly=y";
  if (enteredText  &&  url.indexOf("&" + propName + "=" + encodeURIComponent(enteredText)) == -1)
    url += "&" + propName + "=" + encodeURIComponent(enteredText);
  if (isInterface) {
    var classValue = form.elements[propName + "_class"].value;
    if (classValue != null && classValue.length != 0)
      url += "&" + propName + "_class=" + classValue;
  }

  // request listbox context from the server and load it into a 'popupFrame' iframe
  frameLoaded["popupFrame"] = false;
  var listboxFrame = frames["popupFrame"];
  listboxFrame.location.replace(url); // load data from server into iframe
  timeoutCount = 0;
  setTimeout("Popup.load('" + divId + "')", 50);
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
  try{if(rteUpdated == 'false'){updateRTEs(); rteUpdated = 'true';}}catch(ex){}
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e);
  var form = target;
  var buttonName = form.getAttribute("buttonClicked");
  var button = form.elements[buttonName];
  var pane2       = document.getElementById('pane2');
  var bottomFrame = document.getElementById('bottomFrame');

  var isCancel = button && button.name.toUpperCase() == 'CANCEL';
  if (isCancel) {    // cancel button clicked?
    if (pane2  &&  pane2.contains(form))  {   // inner frame?
      setDivInvisible(pane2, bottomFrame);
      return stopEventPropagation(e);
    }
  }

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
    if (action.indexOf("?") == -1)
      url += "?";
  }
  else
    url = "FormRedirect?"; // HACK: since form.action returns the value of '&action='

  var formAction = form.elements['-$action'].value;
  var allFields = true;
  if (formAction != "searchLocal" && formAction != "searchParallel")
    allFields = false;
  else if (currentFormName && currentFormName.indexOf("horizontalFilter") == 0)
    allFields = true;

  var params = getFormFilters(form, allFields);
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
  url += "submit=y"; // HACK: since target.type return the value of &type instead of an input field's type property
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

  if (isCancel)
    url += "&cancel=y";
  /* do not allow to submit form while current submit is still being processed */
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

  if (pane2  &&  pane2.contains(form))  {   // inner frame?
    setDivInvisible(pane2, bottomFrame);
  }

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
  keyPressedElement.style.backgroundColor='#ffffff';
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
  if (target.valueType && target.valueType.toUpperCase() == 'NUMERIC')
    return true;

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
      throw Error("can't detect the key pressed");
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
  if (elem.length > 1)
    elem_ = elem[0];
  if (elem_.tagName.toUpperCase() == 'TR')
    return elem;
  e = elem_.parentNode;
  if (e) {
    if (e == elem)
      e = elem.parentNode; // if parent of the array element is self - get parent of array itself
    return getTrNode(e);
  }
  else
    return null;
}

function getDivNode(elem) {
  var e;

  var elem_ = elem;
  if (elem.length > 1)
    elem_ = elem[0];
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
function initMenus() {
  var menuLinks = document.getElementsByTagName('A');
  var l = menuLinks.length;
  for (var i=0; i<l; i++) {
    var m = menuLinks[i];
    if (m.id.indexOf('menuLink_') == 0) {
      addEvent(m, 'click',     menuOnClick, false);
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
function replaceTooltips0(elements) {
  var llen;
  llen = elements.length;
  for (var i=0;i<llen; i++) {
    var elem = elements[i];
    if (elem.attributes['title']) {
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
  if (!divRef)
    return;
  var elements;
  elements = divRef.getElementsByTagName('img');
  replaceTooltips0(elements);
}

function tooltipOnMouseOver0(target) {
  if (!Popup.allowTooltip(target)) {
    return true; // ignore this tooltip and return true allow mouseover processing to continue
  }
  var tooltip = target.getAttribute('tooltip'); // using getAttrbute() - as workaround for IE5.5 custom attibutes bug
  var tooltipText;
  if (!tooltip) {
    tooltip = target.getAttribute('title');

    if (!tooltip) // no title attribute - get out of here
      return true;
    tooltipText = tooltip;
    //window.status = tooltipText;
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
  else
    tooltipText = tooltip;

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
  var target = getTargetElement(e);
  if (!tooltipOnMouseOver0(target))
    return stopEventPropagation(e);
  else
    return true;
}

function tooltipOnMouseOut(e) {
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
}

//************************************* intercept all clicks ***********************************
function interceptLinkClicks(div) {
  //addEvent(document, 'keydown', onKeyDown, false);
  //addEvent(document, 'keyup',   onKeyUp,   false);
  if (!div)
    div = document;

  var anchors = div.getElementsByTagName('A');
  var llen = anchors.length;
  for (var i=0;i<llen; i++) {
    var anchor = anchors[i];
    var id = anchor.id;
    if (id.indexOf('menuLink_') == 0) // menu clicks are processed by their own event handler
      continue;
    if (id && id.indexOf("-inner.") == 0) {
      var propName = id.substring(7);
      addEvent(anchor, 'click',  onClickDisplayInner,   false);
    }
    else
      addEvent(anchor, 'click',   onClick,   false);
  }
}

function onClickDisplayInner (e) {
  var anchor = getTargetAnchor(e);
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
  var r = displayInner(e, innerUrls[propName]);
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
  var url = getTargetAnchor(e);
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
      return displayInner(e, url.href);
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
  return stopEventPropagation(e);
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
function getTargetAnchor(e) {
  e = getDocumentEvent(e); if (!e) return;
  var elem;
  if (e.target) {
    if (e.currentTarget && (e.currentTarget != e.target))
      elem = e.currentTarget;
    else
      elem = e.target;
  }
  else {
    elem = e.srcElement;
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

function displayInner(e, urlStr) {
  e = getDocumentEvent(e); if (!e) return;
  var target = getTargetElement(e); if (!target) return;
  var anchor = target;
  if (target.tagName.toUpperCase() != 'A')
    anchor = getTargetAnchor(e);

  var frameId = 'bottomFrame';
  var bottomFrame = frames[frameId];
  // show content in a second pane
  //
  if (!bottomFrame)
    return null;

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
    finalUrl = urlStr.substring(0, idx1 + 1) + 'plain/' + urlStr.substring(idx1 + 1);
  }

  finalUrl += "&hideComments=y&hideMenu=y&hideNewComment=y&hideHideBlock=y&-inner=y";
  stopEventPropagation(e);

  bottomFrame.location.replace(finalUrl);
  var hotspotId = target.id ? target.id : anchor ? anchor.id : null;
  var timeOutFunction = "copyInnerHtml('" + frameId  + "', '" + 'pane2' + "', '" + hotspotId + "')";
  setTimeout(timeOutFunction, 50);

  return false;
}

/**
 *  copies doc loaded to iframe into a div
 */
function copyInnerHtml(frameId, divId, hotspotId) {
  if (!frameId)
    frameId = 'bottomFrame';
  if (!divId)
    divId = 'pane2';
  if (!frameLoaded[frameId]) {
    setTimeout( "copyInnerHtml('" + frameId  + "', '" + divId + "', '" + hotspotId + "')", 50);
    return;
  }
  frameLoaded[frameId] = false;
  var hotspot = document.getElementById(hotspotId);
  var iframe = document.getElementById(frameId);

  //-------------------------------------------------
  var div = document.getElementById(divId);
  var frameBody = frames[frameId].document.body;
  var frameDoc  = frames[frameId].document;
  var frameBody = frameDoc.body;
  var d = frameDoc.getElementById("corePageContent");
  if (d)
    frameBody = d;
  // if there is div RteIframe with iframe in it than innerHTML of this div must be set to ""
  // because the copying of the iframe from the hidden iframe to the parent page causes problems with
  // FireFox back button - it becomes necessary to click 3 and more times to go to the previous page
  if(frames[frameId].document.getElementById('RteIframe'))
    frames[frameId].document.getElementById('RteIframe').innerHTML = "";
  if(frames[frameId].document.getElementById('footerRteIframeDivNotes'))
    frames[frameId].document.getElementById('footerRteIframeDivNotes').innerHTML = "";

  // the size of the floating iframes must be set to 0. Size and position (window offsetLeft and offsetTop) will be set on textarea's onclick
  var rteNotes = document.getElementById('notes');
  if (rteNotes) {
    rteNotes.style.width = 0;
    rteNotes.style.height = 0;
    rteNotes.style.left = 0;
    rteNotes.style.top = 0;
    rteNotes.style.display = 'none';
  }
  // the size of the floating iframes must be set to 0. Size and position (window offsetLeft and offsetTop) will be set on textarea's onclick
  // this happens if this is description RTE and this RTE is in the pane2 div (the same - it is on the readOnlyProperties.html page)
  var rteDescription = document.getElementById('description');
  if(rteDescription && parent.window.location.toString().indexOf('readOnlyProperties.html')>0) {
    rteDescription.style.width = 0;
    rteDescription.style.height = 0;
    rteDescription.style.left = 0;
    rteDescription.style.top = 0;
    rteDescription.style.display = 'none';
  }

  var frameBodyText = frameBody.innerHTML;
  var re = eval('/' + divId + '/g');
  frameBodyText = frameBodyText.replace(re, divId + '-removed'); // prevent pane2 from appearing 2 times in the document
  var re = eval('/' + frameId + '/g');
  var frameBodyText1 = frameBodyText.replace(re, frameId + '-removed'); // prevent bottomFrame from appearing 2 times in the document
  if (frameBodyText1 != frameBodyText) {
    frameBodyText = frameBodyText1;
  }
  setInnerHtml(div, frameBodyText, frames[frameId]);
  setDivVisible(div, iframe, hotspot, 16, 16);
  initListBoxes(div);
  uiFocus(div);
}

/**
 *  shows doc loaded into iframe
 * Problem with this approach - in javascript functions document. points to main document, not ifrane
 */
function copyInnerHtml_iframe_only(frameId, divId, hotspotId) {
  if (!frameId)
    frameId = 'bottomFrame';
  if (!divId)
    divId = 'pane2';
  if (!frameLoaded[frameId]) {
    setTimeout( "copyInnerHtml('" + frameId  + "', '" + divId + "', '" + hotspotId + "')", 50);
    return;
  }
  frameLoaded[frameId] = false;
  var hotspotRef = document.getElementById(hotspotId);
  var bottomFrameRef = document.getElementById(frameId);
  var frameDoc  = frames[frameId].document;
  var d = frameDoc.getElementById("corePageContent");
  setIframeVisible(bottomFrameRef, d, hotspotRef, 16, 16);
  initListBoxes(d);
  return;
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

function setInnerHtml(div, text, frame) {
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
    replaceTooltips(div);
    //window.parent.focus();
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
 * Utility that discovers the html element which generated the event
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
var lastPopupRowAnchor = null;

function addCalendarItem(popupRowAnchor, event, contactPropAndIdx) {
  if (lastPopupRowAnchor) {
    alert("Please wait till previous request is processed");
    return stopEventPropagation(event);
  }
  lastPopupRowAnchor = popupRowAnchor;

  var calendarRow = getTrNode(calendarCell);
  if (!calendarRow)
    throw Error("addCalendarItem: calendar row not found for: " + anchor);

  var anchors = calendarCell.getElementsByTagName('a')
  if (!anchors)
    throw Error("addCalendarItem: calendar row has no anchor");

  var anchor = anchors[0].href; // url of the servlet that adds calendar items

  //--- extract parameters specific for popup row
  var popupRow = getTrNode(popupRowAnchor); // get tr on which user clicked in popup
  if (!popupRow)
    throw Error("addCalendarItem: popup row not found for: " + anchor);

  if (anchor.indexOf("?") != anchor.length - 1)
    anchor += "&";
  anchor += popupRow.id;

  //--- extract parameters specific for calendar row (e.g. time slot) for a cell on which user clicked
  // popupRow == calendarRow when click came from the schedule cell because value corresponding to popup value already known.
  var contactId;
  if (popupRow == calendarRow) {
    var pos = contactPropAndIdx.indexOf("=");
    contactId = contactPropAndIdx.substring(0, pos + 1) + employees[contactPropAndIdx.substring(pos + 1)];
  }
  else  {
    anchor += '&' + calendarRow.id;
    var contactDiv = getDivNode(popupRow);
    //--- extract a contact corresponding to a poped up chooser
    if (!contactDiv)
      throw Error("addCalendarItem: contactDiv not found for: " + anchor);
    if (!contactDiv.id) {
      while (contactDiv  &&  !contactDiv.id) {
        var parentNode = contactDiv.parentNode;
        while (parentNode  &&  (parentNode.tagName.toUpperCase() != 'DIV' || !parentNode.id))
          parentNode = parentNode.parentNode;
        if (!parentNode)
          throw Error("addCalendarItem: contactDiv not found for: " + anchor);
        contactDiv = parentNode;
      }
    }
    contactId = contactDiv.id;
  }
  anchor += '&' + contactId;

  //--- collect parameters common to all calendar items on the page
  var pageParametersDiv = document.getElementById('pageParameters');
  if (!pageParametersDiv)
    throw Error("addCalendarItem: pageParameters div not found for: " + anchor);
  var pageParams = pageParametersDiv.getElementsByTagName('a');
  if (!pageParams || pageParams.length == 0)
    throw Error("addCalendarItem: pageParameters are empty for: " + anchor);
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
    throw Error("showExpired: blockReleaseParameters div not found for: " + anchor);
  var brParams = blockReleaseDiv.getElementsByTagName('a');
  if (!brParams || brParams.length == 0)
    throw Error("showExpired: blockReleaseParameters are empty for: " + anchor);
  for (var i=0; i<brParams.length; i++) {
    var alertId = brParams[i].id;
    if (alertId.indexOf(alertName + "=") == 0) {
      alert(alertId.substring(alertName.length + 1))
      break;
    }
  }
}

function addSimpleCalendarItem(popupRowAnchor, event) {
  var calendarRow = getTrNode(calendarCell);
  if (!calendarRow)
    throw Error("addCalendarItem: calendar row not found for: " + anchor);
  //--- extract parameters specific for popup row
  var calendarTd = getTdNode(calendarCell);

  var popupRow = getTrNode(popupRowAnchor); // get tr on which user clicked in popup
  if (!popupRow)
    throw Error("addSimpleCalendarItem: popup row not found for: ");

  var anchor = "mkResource.html?-$action=mkResource&type=http://www.hudsonfog.com/voc/model/work/CalendarItem&submit=Please+wait&";
  var calendarRowId = calendarRow.id;
  var idx = calendarRowId.indexOf("=");
  calendarRowId = calendarRowId.substring(0, idx);
  anchor += popupRow.id; // + "&.start_verified=y&.start_select=" + calendarRowId.substring(0, idx);
  //--- extract a contact corresponding to a poped up chooser
  var contactDiv = getDivNode(popupRow);
  if (!contactDiv)
    throw Error("addCalendarItem: contactDiv not found for: " + anchor);
  if (!contactDiv.id) {
    while (contactDiv  &&  !contactDiv.id) {
      var parentNode = contactDiv.parentNode;
      while (parentNode  &&  (parentNode.tagName.toUpperCase() != 'DIV' || !parentNode.id))
        parentNode = parentNode.parentNode;
      if (!parentNode)
        throw Error("addCalendarItem: contactDiv not found for: " + anchor);
      contactDiv = parentNode;
    }
  }
  anchor += '&' + contactDiv.id;
  var blockReleaseDiv = document.getElementById('blockReleaseParameters');
  if (!blockReleaseDiv)
    throw Error("addCalendarItem: blockReleaseParameters div not found for: " + anchor);
  var brParams = blockReleaseDiv.getElementsByTagName('a');
  if (!brParams || brParams.length == 0)
    throw Error("addCalendarItem: blockReleaseParameters are empty for: " + anchor);
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
    if (value  &&  value == 'available')
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
    throw Error("addCalendarItem: pageParameters div not found for: " + anchor);
  var pageParams = pageParametersDiv.getElementsByTagName('a');
  if (!pageParams || pageParams.length == 0)
    throw Error("addCalendarItem: pageParameters are empty for: " + anchor);
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
  var iframeId = "resourceList";
  var iframe = document.getElementById(iframeId);
  try {
    var iframeWindow = frames[iframeId];
    var newUri;
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
          anchor += "&" + shortProp + "_select=" + encCurrentItem + "&" + shortProp + "_verified=y";
          anchor += "&-currentItem=" + encCurrentItem;
        }
      }
    }

    if (anchor.indexOf("$returnUri=") == -1) {
       var div = document.getElementById(iframeId + "_div");
      var tag = div.getElementsByTagName('a');
      if (tag.length) {
        var retUri = tag[0].href;
        newUri = anchor + "&$returnUri=" + encodeURIComponent(retUri + "&-addItems=y");
      }
      else
        newUri = anchor;
    }
    else
      newUri = anchor;

    iframeWindow.location.replace(newUri); // load data from server into iframe
//    window.open(newUri);
//    return;
    setTimeout(addAndShowWait, 50);
    return stopEventPropagation(event);
  } catch (er) {
    alert(er);
  }
}

function addAndShowWait()	{
  var frameId = "resourceList";
  var frameBodyId = "siteResourceList";
  if (!frameLoaded[frameId]) {
    setTimeout(addAndShowWait, 50);
    return;
  }
  frameLoaded[frameId] = false;
  var l = document.location;
  var iframe = document.getElementById(frameId);
  var iframeWindow = frames[frameId];
  var body = iframeWindow.document.getElementById(frameBodyId);
  if (!body) {
    alert("Warning: server did not return resource list data - check connection to server");
    return;
  }

  var divCopyTo = document.getElementById(frameId + "_div");
  if (!divCopyTo) {
    alert("Warning: target div not found: " + frameId + "_div");
    return;
  }
  divCopyTo.innerHTML = body.innerHTML;
  resourceListEdit(divCopyTo);
  interceptLinkClicks(divCopyTo);
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

function openPopup1(divId1, alertName, hotSpot, e) {
  if (e.ctrlKey)  // ctrl-enter
    showAlert(alertName);
  else
    openPopup(divId1, null, hotSpot, e);
}

function openPopup(divId1, divId2, hotSpot, e, maxDuration) {
  if (e.ctrlKey)  {// ctrl-enter
    if (!maxDuration) {
      Popup.open(divId2, hotSpot);
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
      var anchor = tr.getElementsByTagName('a');
      var s = anchor[0].innerHTML;
      var idx = s.indexOf(" ");
      s = s.substring(0, idx);
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
    if (divId1)
      Popup.open(divId1, hotSpot);
  }
  calendarCell = hotSpot;
  return false;
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
  anchor += "&.forum_select=" + encodeURIComponent(forum) + "&.title=" + encodeURIComponent(title) + "&$returnUri="+ encodeURIComponent("localSearchResults.html?-addItems=y&-noRedirect=y&" + href.substring(idx + 1));

  return addAndShow1(anchor, e);
}
var receipts = [];
function printReceipt(url) {
  var thisReceipt = receipts[url];
  if (thisReceipt  &&  thisReceipt.length) {
    var appl = document.applets[0];
    appl.open();
    for (i=0; i<thisReceipt.length; i++)
      appl.println(thisReceipt[i]);
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
// insertAtCursor(document.formName.fieldName, ‘this value’);
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
  reposition(div, 0, 0);
  var divCoords = getElementCoords(div);
  var margin = 40;
  //alert(screenX + "," + screenY + ", " + scrollX + "," + scrollY + ", " + left + "," + top + ", " + divCoords.width + "," + divCoords.height);
  // cut popup dimensions to fit the screen
  //var mustCutDimension = div.id == 'pane2' ? false: true;
  var mustCutDimension = true;
  if (mustCutDimension) {
    var fixed = false;
    if (divCoords.width > screenX - margin) {
      div.style.width = screenX - margin + 'px';
      fixed = true;
      //alert("divCoords.width = " + divCoords.width + ", " + "screenX = " + screenX);
    }
    if (divCoords.height > screenY - margin) {
      div.style.height = screenY - margin + 'px';
      fixed = true;
      //alert("divCoords.height = " + divCoords.height + ", " + "screenY = " + screenY);
    }
    if (fixed) { // recalc coords and add scrolling if we fixed dimensions
      div.style.overflow = "auto";
      divCoords = getElementCoords(div);
    }
  }
  div.style.display    = 'none';   // must hide it again to avoid screen flicker

  // move box to the left of the hotspot if the distance to window border isn't enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX -  scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
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
    if (top - margin > 0)
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

  var zIndex = hotspot ? hotspot.style.zIndex : 1; // this relative zIndex allows stacking popups on top of each other
  div.style.zIndex = zIndex + 2;
  istyle.zIndex    = zIndex + 1;

  // hack for Opera (at least at ver. 7.54) and Konqueror
  //  somehow iframe is always on top of div - no matter how hard we try to set zIndex
  // so we have to live without iframe
  //var opera     = navigator.userAgent.indexOf("Opera") != -1;
  //var konqueror = navigator.userAgent.indexOf("Konqueror") != -1;
  div.style.display    = 'inline';
  //istyle.display       = 'inline';
  reposition(div,    left, top); // move the div box to the adjusted position
  reposition(iframe, left, top); // place iframe under div
  //if (!opera && !konqueror) {
  if (document.all) { // only IE has a problem with form elements 'showing through' the popup
    istyle.visibility  = Popup.VISIBLE;
  }
  div.style.visibility = Popup.VISIBLE; // finally make div visible
}

function setDivInvisible(div, iframe) {
  if (div.style)
    div.style.display    = "none";
  if (iframe && iframe.style)
    iframe.style.display = "none";
}

/**
 * Show iframe
 */
setIframeVisible = function (iframe, div, hotspot, offsetX, offsetY) {
  var istyle = iframe.style;
  istyle.visibility    = Popup.HIDDEN;

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

  istyle.display    = 'inline'; // must first make it 'inline' - otherwise div coords will be 0
  reposition(iframe, 0, 0);

  var divCoords = getElementCoords(div);
  var margin = 40;

  // move box to the left of the hotspot if the distance to window border isn't enough to accomodate the whole div box
  if (distanceToRightEdge < divCoords.width + margin) {
    left = (screenX -  scrollX) - divCoords.width; // move menu to the left by its width and to the right by scroll value
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
    if (top - margin > 0)
      top -= margin; // adjust for a scrollbar;
  }
  else { // apply user requested offset only if no adjustment
    if (offsetY)
      top = top + offsetY;
  }
  // move the div box to the adjusted position
  reposition(iframe, left, top);
  istyle.width  = divCoords.width   + 'px';
  istyle.height = divCoords.height  + 'px';


  istyle.zIndex     = hotspot.style.zIndex + 1;
  istyle.display    = 'inline';
  istyle.visibility = Popup.VISIBLE; // finally make it visible
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

