var currentCell;
var currentCellBackground;
var lastCellClickTime;
var count = 0;
function schedule(e) {
  e = getDocumentEvent(e);
  var target = getEventTarget(e);
//  alert("schedule1");
  if (target == null)
    return stopEventPropagation(e);
  var imgSrc;

  // remove reassign icon
  var tId = target.id;
  if (currentCell && tId != currentCell.id)
    schReassign.removeIcon(div);

  var className = target.className;
  if (!className || className.length == 0) {
    var lTarget = target.tagName.toLowerCase();
    if (lTarget == 'img')
      imgSrc = target.src;
    else if (lTarget == 'a')
      return;
    if (lTarget != 'td')
      target = getTdNode(target);
  }
  else if (className == 'g')
    return stopEventPropagation(e);
  else if (className == "aea" || className == "bea") {
    showAlert('expiredAlert');
    return stopEventPropagation(e);
  }
  var tdId = target.id;
  if (!tdId) {
    var reqT = getTrNode(target);
    if (!reqT  ||  !reqT.id || reqT.id != 'requests')
      return;
    target = getTdNode(reqT);
    tdId = target.id;
  }
  className = target.className;
  var isAssignedCell = tdId.indexOf('ap.') == 0;
  if (!isAssignedCell && className != 'a' && className != 'b' && className != 'ci') {
// alert(target.className + " " + target.id);
    return stopEventPropagation(e);
  }

  var newCellClickTime = new Date().getTime();
  if (lastCellClickTime != null) {
// Packages.java.lang.System.out.println('prev-lastCellClickTime = ' +
// lastCellClickTime);
//    Packages.java.lang.System.out.println('newCellClickTime - lastCellClickTime ' + (newCellClickTime - lastCellClickTime) + '; newCellClickTime = ' +  newCellClickTime + "; lastCellClickTime = " + lastCellClickTime);
    if ((newCellClickTime - lastCellClickTime) < 500)
      return stopEventPropagation(e);
    if (!currentCell || tdId != currentCell.id)
      lastCellClickTime = newCellClickTime;
  }
  else
    lastCellClickTime = newCellClickTime;
// Packages.java.lang.System.out.println('lastCellClickTime = ' +
// lastCellClickTime);
  var calendarImg = "<img src='icons/blank.gif' width='16' height='16' /><img src='icons/calendar.gif' title='Change employee availability' width='16' height='16' />";
  var schedImg = "<img src='icons/classes/TreatmentProcedure.gif' title='Schedule procedure' width='16' height='16' align='left' /><img src='icons/calendar.gif' title='Change employee availability' width='16' height='16' align='right' />";

  if (!currentCell) {
    currentCell = target;
    currentCellBackground = currentCell.style.backgroundColor;
    currentCell.style.backgroundColor = "#D7D8FB";
    if (!isAssignedCell) {
      if (currentCell.className == 'b')
        currentCell.innerHTML = calendarImg;
      else
        currentCell.innerHTML = schedImg;
    }
    else {
      currentCell.style.height = '100px';
      currentCell.style.width = '100px';
      var childNodes = currentCell.childNodes;
      var div;
      for (var i=0; !div && i<childNodes.length; i++) {
        if (childNodes[i].tagName && childNodes[i].tagName.toLowerCase() == 'div')
          div = childNodes[i];
      }
      div.style.whiteSpace = 'normal';
      schReassign.addIcon(div);
    }
//    if (className != 'ci')
      return;
  }
  else if (tdId != currentCell.id) {
    if (currentCell.id.indexOf("ap.") != 0)
      currentCell.innerHTML = '';
    else {
      var div;
      var childNodes = currentCell.childNodes;
      for (var i=0; !div && i<childNodes.length; i++) {
        if (childNodes[i].tagName && childNodes[i].tagName.toLowerCase() == 'div')
          div = childNodes[i];
      }
      div.style.whiteSpace = 'nowrap';
      currentCell.style.height = '1px';
    }
    currentCell.style.backgroundColor = currentCellBackground;
    currentCell = target;
    if (!isAssignedCell) {
      if (currentCell.className == 'b')
        currentCell.innerHTML = calendarImg;
      else
        currentCell.innerHTML = schedImg;
    }
    else {
      currentCell.style.height = '100px';
      var div;
      var childNodes = currentCell.childNodes;
      for (var i=0; !div && i<childNodes.length; i++) {
        if (childNodes[i].tagName && childNodes[i].tagName.toLowerCase() == 'div')
          div = childNodes[i];
      }
      div.style.whiteSpace = 'normal';
    }
    currentCellBackground = currentCell.style.backgroundColor;
    currentCell.style.backgroundColor = "#D7D8FB";
    var contentDiv = currentCell.getElementsByTagName("div")[0];
    if(contentDiv)
      schReassign.addIcon(contentDiv);

//    if (className != 'ci')
      return;
  }
  var idx1 = tdId.indexOf(".") + 1;
  var idx = tdId.indexOf(":");

  if (className == "b") {
    if (imgSrc == null || idx == -1)
      return;
    var calendarIdx = parseInt(tdId.substring(idx1, idx));
    var duration = parseInt(tdId.substring(idx + 1));
    openPopup(null, calendarIdx, target, e, duration);
  }
  else if (className == "a") {
    if (imgSrc == null || idx == -1)
      return;
    var duration = parseInt(tdId.substring(idx + 1));
    var calendarIdx = parseInt(tdId.substring(idx1, idx));
    if (imgSrc.indexOf('calendar.gif') != -1) {
      // calendarIdx < 0 in cases when employee does not have its calendar
      if (calendarIdx < 0) {
        calendarIdx = calendarIdx * -1;
        openPopup1(parseInt(tdId.substring(idx1 + 1)), 'changeAlert', target, e, duration);
      }
      else
        openPopup(calendarIdx, calendarIdx, target, e, duration);
    }
    else  {
      if (calendarIdx < 0)
        calendarIdx = calendarIdx * -1;
      openPopup(calendarIdx, calendarIdx, target, e, duration);
// openPopup1(parseInt(tdId.substring(1)), 'changeAlert', target, e, duration);
    }
  }
  else if (className == "ci") {
//    alert("schedule2");
//    Packages.java.lang.System.out.println("schedule2");
    calendarCell = target;
    addCalendarItem(this, e, parseInt(tdId.substring(idx1)));
  }
}

// Add assignment to schedule page without repainting the page
function addAssignment(event, body, hotspot, content)  {
  setInnerHtml(body, content);
//  alert("addAssignment1");
//  Packages.java.lang.System.out.println("addAssignment1");

  var errDiv = document.getElementById('div_err');
  if (errDiv)
    errDiv.innerHTML = '';
  var bdivs = body.getElementsByTagName("div");
  try {
    for (var i=0; i<bdivs.length; i++) {
      if (bdivs[i].id  &&  bdivs[i].id == 'div_err'  &&  bdivs[i].innerHTML) {
        setInnerHtml(errDiv, bdivs[i].innerHTML);
        return;
      }
    }
    var tbodies = body.getElementsByTagName("tbody");
    var curTR;
    for (var i=0; i<tbodies.length; i++) {
      var id = tbodies[i].id;
      if (id  &&  id == 'newAssignment') {
        curTR = tbodies[i].getElementsByTagName("tr")[0];
        break;
      }
    }
    if (!curTR)
      return;
    var trCopyTo = document.getElementById(curTR.id);
    if (!trCopyTo) {
      throw new Error("Warning: target TR not found: " + curTR.id);
      return;
    }
    var newTd = curTR.getElementsByTagName("td")[0];

    var tdId = newTd.id;
    var tdIdx = tdId.lastIndexOf('.');
    var emplIdx = parseInt(tdId.substring(tdIdx + 1));

    var tds = trCopyTo.getElementsByTagName("td");
    var oldTbody = trCopyTo.parentNode;

    var n = tds.length;
  // var oldTd = tds[emplIdx];
    var oldTd;
    for (var i=1; i<n  &&  !oldTd; i++) {
      var tId = tds[i].id;
      if (tId  &&  (tId.indexOf('.' + emplIdx + ':') != -1 || tId.indexOf('.-' + emplIdx + ':') != -1))
        oldTd = tds[i];
    }
    rowspan = parseInt(newTd.rowSpan);

    var nodes = oldTbody.childNodes;
    var rowIdx = 0;
    var ridx = 0;
    var rows = [];
    for (; rowIdx<nodes.length; rowIdx++) {
      var node = nodes[rowIdx];
      if (!node.tagName || node.tagName.toLowerCase() != 'tr')
        continue;
      if (node.id && node.id == trCopyTo.id) {
        for (++rowIdx; rowIdx<nodes.length; rowIdx++) {
          var node = nodes[rowIdx];
          if (!node.tagName || node.tagName.toLowerCase() != 'tr')
            continue;
          row = node;
          rows[ridx++] = rowIdx;
          break;
        }
        break;
      }
    }
    tds = row.getElementsByTagName("td");
    // Each row can have different number of tds since some of them due to
    // rowspan > 1 removed
    var first;
    for (var j=1; j<rowspan; j++, rowIdx++) {
      var nn = tds.length;
      for (var i=1; i<nn; i++) {
        var tId = tds[i].id;
        if (tId  &&  (tId.indexOf('.' + emplIdx + ':') != -1 || tId.indexOf('.-' + emplIdx + ':') != -1)) {
          row.removeChild(tds[i]);
//          alert('remove td from row: ' + row.id);
          break;
        }
      }
      if (row == nodes[rowIdx])
        rowIdx++;
      for (; rowIdx<nodes.length; rowIdx++) {
        var node = nodes[rowIdx];
        if (!node.tagName || node.tagName.toLowerCase() != 'tr')
          continue;

//        alert(row.id);
        row = node;
        rows[ridx++] = rowIdx;
        break;
      }
      tds = row.getElementsByTagName("td");
    }
    oldTd.rowSpan = newTd.rowSpan;


    oldTd.id = newTd.id;
    oldTd.innerHTML = newTd.innerHTML;
//    oldTd.childNodes[0].style.whiteSpace = 'normal';
    var oldClassName = oldTd.className;
    var style = oldTd.childNodes[0].style;
    if (style)
      style.whiteSpace = 'normal';
    else
      oldTd.childNodes[0].style = 'white-space:normal';
    if (newTd.className)
      oldTd.className = newTd.className;
    else {
      if (oldTd.className)
        oldTd.className = '';
      if (newTd.style)
        oldTd.setAttribute('style', newTd.style.cssText);
    }
    currentCell = oldTd;
    currentCellBackground = newTd.style.backgroundColor;
    currentCell.style.backgroundColor = "#D7D8FB";
//    oldTd.childNodes[0].whiteSpace = 'normal';

    tds = trCopyTo.getElementsByTagName("td");
    for (var j=0; j<rowspan; j++) {
      for (var i=0; i<tds.length; i++) {
        if (tds[i].className == 'a' || tds[i].className == 'b')
          tds[i].className = 'g';
      }
      row = nodes[rows[j]];
      tds = row.getElementsByTagName("td");
    }

  // currentCell = oldTd;

    addEvent(oldTd, 'click', newTd.onclick, false);
//    if (oldClassName == 'ci')
//      return;
  /*
   * var newDivs = body.getElementsByTagNam("div"); var divCopyFr; for (var i=0;
   * i<newDivs.length && !divCopyFr; i++) { if (newDivs[i].id && newDivs[i].id ==
   * 'resourceList_div') divCopyFr = newDivs[i]; } if (divCopyFr) {
   * addAndShowWait(event, divCopyFr) }
   */
    var divs = body.getElementsByTagName('div');
    for (var i=0; i<divs.length; i++) {
      if (divs[i].id  &&  divs[i].id == 'resourceList_div') {
        if (oldClassName == 'ci')
          addAndShowWait(event, divs[i], hotspot, content, null, true, true);
        else
          addAndShowWait(event, divs[i], hotspot, content, null, true);
        break;
      }
    }
  } finally  {
    lastPopupRowTD = null;
  }
}



var schReassign = {
  TITLE_TEXT : "reassign procedure",
  HIGHLIGHT_BG_COLOR : "#0d0",
  contentDiv : null,
  iconDiv : null,
  tbody : null,
  srcCell : null,
  curTargetCell : null,
  isActivated : false,

  init : function() {
    this.iconDiv = document.createElement('div');
    this.iconDiv.align = "right";
    this.iconDiv.style.width = "100%";

    var html = "<a title=\"" + this.TITLE_TEXT + "\"";
    html += "href=\"javascript: ;\" onclick=\"schReassign.activate(event);\">";
    html += "<img src=\"../icons/integrate.gif\" style=\"cursor:pointer;\"></a>";
    this.iconDiv.innerHTML = html;

    this.tbody = document.getElementById("schedule");
    if(!this.tbody) throw('Not found "schedule" tbody');

    // add handlers
    addEvent(this.tbody, 'mouseover', this._onmouseover, false);
    addEvent(this.tbody, 'mouseout', this._onmouseout, false);
    addEvent(this.tbody, 'click', this._onclick, false);
    addEvent(document, 'click', this._onwindowclick, false);
    addEvent(document, 'keyup', this._onkeyup, false);
  },

  addIcon : function(contentDiv) {
    if (this.isCellCurrent(contentDiv) == false)
      return;
    this.contentDiv = contentDiv;
    if(this.iconDiv == null) {
      this.init();
    }
    this.contentDiv.insertBefore(this.iconDiv, contentDiv.firstChild);
    this.srcCell = this.contentDiv.parentNode;
  },
  removeIcon : function() {
    if(this.iconDiv == null || this.iconDiv.parentElement == null)
      return;
    this.contentDiv.removeChild(this.iconDiv);
  },

  activate : function(e) {
    this.isActivated = true;
    e = getDocumentEvent(e);
    stopEventPropagation(e)
  },
  disactivate : function() {
    this.tbody.style.cursor = "";
    if(schReassign.curTargetCell)
      schReassign.curTargetCell.style.backgroundColor = "";
    schReassign.curTargetCell = null;
    this.isActivated = false;
  },

  // event handlers
  _onmouseover : function(e) {
    if (typeof getEventTarget == 'undefined') return;
    if(schReassign.isActivated == false)
      return;

    var target = getEventTarget(e);

    if(target.tagName.toLowerCase() != "td") {
      target = getAncestorByTagName(target, "td")
    }

    // 1. source cell
    if(schReassign.srcCell.id == target.id) {
      schReassign.tbody.style.cursor = "";
      return;
    }

    // 2. the same target
    if(schReassign.curTargetCell != null) {
      if(schReassign.curTargetCell.id == target.id)
        return;
    }
    // 3. new target
    var className = target.className;
    // alowed target
    if(className == "a") {
      schReassign.curTargetCell = target;
      target.style.backgroundColor = "#0d0";
      schReassign.tbody.style.cursor = "crosshair";
    }
    // forbidden target
    else {
      schReassign.tbody.style.cursor = "not-allowed";
    }
  },
  _onclick : function(e) {
    if(schReassign.isActivated == false)
        return;
    if(schReassign.curTargetCell != null) {
      if(schReassign.curTargetCell.id != schReassign.srcCell.id) {
        schReassign.moveProcedure(e, schReassign.srcCell, schReassign.curTargetCell);
        schReassign.disactivate();
      }
    }

    // prevents _onwindowclick handler
    e = getDocumentEvent(e);
    stopEventPropagation(e)
  },

  _onmouseout : function() {
    if (typeof schReassign == 'undefined') return;
    if(schReassign.isActivated == false)
      return;
    if(schReassign.curTargetCell)
      schReassign.curTargetCell.style.backgroundColor = "";
    schReassign.curTargetCell = null;
  },
  _onwindowclick : function(e) {
    if(schReassign.isActivated == false)
      return;
    schReassign.disactivate();
  },
  _onkeyup : function(e) {
  	e = getDocumentEvent(e);
		var charCode = (e.charCode) ? e.charCode : ((e.keyCode) ? e.keyCode :
			((e.which) ? e.which : 0));
		if (charCode == 27) // escape
		    schReassign.disactivate();
  },
  isCellCurrent : function(cellObj) {
    if (cellObj == null)
      return false;
    var anchors = cellObj.getElementsByTagName('a');
    for (var i = 0; i < anchors.length; i++) {
      if (anchors[i].href  &&  anchors[i].href.indexOf("ticket?") != -1)
        return true;
    }
    return false;
  },
  //
  moveProcedure : function(event, srcCell, targetCell) {
    var srcId = srcCell.id;
    var idx1 = srcId.indexOf(".") + 1;
    var idx = srcId.indexOf(".", idx1);
    var idx2 = srcId.indexOf(":", idx);
    if (idx2 == -1)
      idx2 = srcId.length;
    if (srcId.charAt(idx + 1) == "-")
      idx++;
    var employeeIdx = srcId.substring(idx + 1, idx2);
    var calendarSteps = srcId.substring(idx, idx1);
    var employee = employees[parseInt(employeeIdx)];
    var anchors = srcCell.getElementsByTagName('a');
    if (!anchors)
      throw new Error("moveProcedure: not found assignment info in: " + srcId);

    var targetId = targetCell.id;
    var calendarRow = getTrNode(targetCell); // get tr on which user clicked in popup
    if (!calendarRow)
      throw new Error("moveProcedure: popup row not found for: " + targetId);

    var anchor = "ticket?availableDuration="; // anchors[0].href; // url of the
    idx = targetId.indexOf(":");
    anchor += targetId.substring(idx + 1);
    idx1 = targetId.indexOf(".") + 1;
    if (targetId.charAt(idx1) == "-")
      idx1++;

    var newEmployeeIdx = targetId.substring(idx1, idx);
    // first <a> could be with 'reassign procedure' that is for reassigning procedure to different time or employee
    anchor += "&" + forEmployee + "=" + employees[parseInt(newEmployeeIdx)] + '&' + calendarRow.id;
    var srcAnchor;
    for (var i=0; !srcAnchor  &&  i<anchors.length; i++) {
      if (anchors[i].href  &&  anchors[i].href.indexOf("ticket?") != -1)
        srcAnchor = anchors[i].href;
    }
    idx = srcAnchor.indexOf("&uri=");
    if (idx == -1)
      throw new Error("moveProcedure: not found assignment info in: " + srcId);
    anchor += srcAnchor.substring(idx);

//    var newEmployee = employees[parseInt(newEmployeeIdx)];
//    anchor += "&.forEmployee_verified=y&.forEmployee_select=" + encodeURIComponent(newEmployee);
    // --- collect parameters common to all calendar items on the page
    var pageParametersDiv = document.getElementById('pageParameters');
    if (!pageParametersDiv)
      throw new Error("addCalendarItem: pageParameters div not found for: " + anchor);
    var pageParams = pageParametersDiv.getElementsByTagName('a');
    if (!pageParams || pageParams.length == 0)
      throw new Error("addCalendarItem: pageParameters are empty for: " + anchor);
    for (var i=0; i<pageParams.length; i++)
      anchor += '&' + pageParams[i].id;


    var idx = anchor.indexOf("?");
    var div = document.createElement('div');
    var ret = stopEventPropagation(event);
    postRequest(event, anchor.substring(0, idx), anchor.substring(idx + 1), div, targetCell, addAssignment);

    return ret;
  }
}


var calendarCell; // last cell on which user clicked
var lastPopupRowTD = null;

function addCalendarItem(popupRowAnchor, event, contactPropAndIdx) {
  var curCellClickTime = new Date().getTime();
//  Packages.java.lang.System.out.println('addCalendarItem: curCellClickTime - lastCellClickTime ' + (curCellClickTime - lastCellClickTime) + '; curCellClickTime = ' +  curCellClickTime + "; lastCellClickTime = " + lastCellClickTime);

  if ((curCellClickTime - lastCellClickTime) < 500)
    return stopEventPropagation(event);
//  alert("addCalendarItem1");
//  Packages.java.lang.System.out.println("addCalendarItem1");
  var td = getEventTarget(event);
  // --- extract parameters specific for popup row
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

  if (anchors != null  &&  anchors.length > 0) {
    // first <a> could be with 'reassign procedure' that is for reassigning procedure to different time or employee
    for (var i=0; !anchor  &&  i<anchors.length; i++) {
      if (anchors[i].href  &&  anchors[i].href.indexOf("ticket?") != -1)
        anchor = anchors[i].href;
    }
  }
  else {
    anchor = "ticket?availableDuration="; // anchors[0].href; // url of the
                                          // servlet that adds calendar items
    var tdId = calendarCell.id;
    var idx = tdId.indexOf(":");
    anchor += tdId.substring(idx + 1);
  }

// if (anchor.indexOf("?") != anchor.length - 1)
    anchor += "&";
  // popup row id format: employeeIdx.procedureIdx;procedureDuration
  var popupRowId = popupRow.id;
  var dotIdx = popupRowId.indexOf('.');
  if (dotIdx != -1)
    popupRowId = popupRowId.substring(dotIdx + 1);
  var ampIdx = popupRowId.indexOf(";");
  if (ampIdx != -1) {
    var procedureIdx = parseInt(popupRowId.substring(0, ampIdx));
    anchor += procedurePropName + "=" + procedures[procedureIdx];
    var duration = parseInt(popupRowId.substring(ampIdx + 1));
    anchor += "&duration=" + duration;
  }
  // --- extract parameters specific for calendar row (e.g. time slot) for a
  // cell on which user clicked
  // popupRow == calendarRow when click came from the schedule cell because
  // value corresponding to popup value already known.
  var contactId;
  if (popupRow == calendarRow) {
    contactId = forEmployee + "=" + employees[contactPropAndIdx] + '&' + calendarRow.id;
  }
  else  {
    anchor += '&' + calendarRow.id;
    var contactDiv = getDivNode(popupRow);
    // --- extract a contact corresponding to a poped up chooser
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

  // --- collect parameters common to all calendar items on the page
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
 * if (lastPopupRowAnchor == anchor) { alert("Please wait till previous request
 * is processed"); return stopEventPropagation(event); } lastPopupRowAnchor =
 * anchor;
 */
  // close menu popup
  Popup.close0(contactDivId);

  var idx = anchor.indexOf("?");
  var div = document.createElement('div');
//  Packages.java.lang.System.out.println("addCalendarItem2");
//  alert("addCalendarItem2");
  postRequest(event, anchor.substring(0, idx), anchor.substring(idx + 1), div, td, addAssignment);
  return se;
// return addAndShow1(anchor, event);
}

function addSimpleCalendarItem(event) {
  if ((new Date().getTime() - lastCellClickTime) < 500)
    return stopEventPropagation(event);
  var td = getEventTarget(event);
  var calendarRow = getTrNode(calendarCell);
  if (!calendarRow)
    throw new Error("addCalendarItem: calendar row not found for: " + anchor);
  // --- extract parameters specific for popup row
  var calendarTd = getTdNode(calendarCell);

  var popupRow = getTrNode(td); // get tr on which user clicked in popup
  if (!popupRow)
    throw new Error("addSimpleCalendarItem: popup row not found for: ");

  if (popupRow.className == 'menuTitle')
    return stopEventPropagation(event);
  var anchor = "mkresource?type=http://www.hudsonfog.com/voc/model/work/CalendarItem&submit=Please+wait&";
  var calendarRowId = calendarRow.id;
  var idx = calendarRowId.indexOf("=");
  calendarRowId = calendarRowId.substring(0, idx);
  var popupRowId = popupRow.id;
  var durationIdx = popupRowId.indexOf("=");
  var durationProp = popupRowId.substring(0, durationIdx);
  var minutes = parseInt(popupRowId.substring(durationIdx + 1));
  anchor += durationProp + "=inlined&" + durationProp + ".seconds=" + minutes + "&" + durationProp + ".durationType=" + encodeURIComponent("minute(s)");
  // --- extract a contact corresponding to a poped up chooser
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
// anchor += '&' + brParams[i].id;
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


  // --- collect parameters common to all calendar items on the page
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
// return addAndShow1(anchor, event);
}



/**
 * Executes ticket update on schedule page
 */
function submitUpdateTicket(e) {
  e = getDocumentEvent(e);
  var target = getEventTarget(e);
  if (target == null)
    return;
  while (target) {
    target = target.parentNode;
    if (target.tagName.toLowerCase() == 'td')
      break;
  }
  if (!target)
    return;
  var f = document.forms;
  var form;
  for (var i=0; i<f.length; i++) {
    if (!f[i].name  ||  f[i].name.indexOf('tablePropertyList') == -1)
      continue;
    form = f[i];
  }
  if (!form)
    return;
  var ret = stopEventPropagation(e);
  var p1 = getFormFilters(form, true);
  var div = document.createElement('div');
  if (form.action  &&  form.action == 'mkresource')
    postRequest(e, 'mkresource', p1, div, target, updateTicket);
  else
    postRequest(e, 'proppatch', p1, div, target, updateTicket);
  return ret;
}

function updateTicket(event, body, hotspot, content)  {
  setInnerHtml(body, content);

  var errDiv = document.getElementById('div_err');
  if (errDiv)
    errDiv.innerHTML = '';
  var bdivs = body.getElementsByTagName("div");
  for (var i=0; i<bdivs.length; i++) {
    if (bdivs[i].id  &&  bdivs[i].id == 'div_err'  &&  bdivs[i].innerHTML) {
      setInnerHtml(errDiv, bdivs[i].innerHTML);
      return;
    }
  }
  document.location.reload(true);
}



function addEventOnSchedule() {
  var table = document.getElementById("mainTable");
//  alert("addEventOnSchedule: " + table);
  if (table == null)
    return;
  addEvent(table, 'click', function(event) {schedule(event);}, false);
}