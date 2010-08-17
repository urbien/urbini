// helps to select from 2 modes: date / period
// if there is no "toInp" then DatePicker
function startCalendar(parentDiv, callback, fromInp, toInp) {
  if (typeof parentDiv == 'string')
    parentDiv = document.getElementById(parentDiv);

  // scedule; no toolbar with buttons
  var isCalendarNavigation = (parentDiv.id == "calendar_navigation");

  if (parentDiv.innerHTML.length == 0) {
    var html = 
      "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"; 
      
      // TR 1st date header ---
      if (isCalendarNavigation == false) {
        html +=
        "<tr><td class=\"header\">" +
				"<table><tr>" +
				"<td class=\"icon_btn\" onclick=\"ListBoxesHandler.onBackBtn(1);\"><img src=\"../images/skin/iphone/back_arrow.png\" /></td>" + //&#9664;
				"<td class=\"icon_btn\" onclick=\"DatePicker.onDateClear();\"> <img src=\"../images/skin/iphone/clear.png\" /></td>" +
				"<td width=\"100%\"></td>" +
				"<td class=\"icon_btn\" onclick=\"ListBoxesHandler.onDatesList();\"> <img src=\"../images/skin/iphone/list_bullets.png\" /></td>" +
				"</tr></table>" +
        
				"</td></tr>" +

        // TR 2nd period header ---
        "<tr><td class=\"header\">" +
					"<table><tr>" +
					"<td class=\"icon_btn\" onclick=\"PeriodPicker.onDoneBtn();\"><img src=\"../images/skin/iphone/back_arrow.png\" /></td>" + // &#9664;&#9642;
					"<td class=\"icon_btn\" onclick=\"Filter.onPeriodReset();\"><img src=\"../images/skin/iphone/clear.png\" /></td>" +					
					"<td width=\"100%\"></td>" +
					"<td class=\"icon_btn\" onclick=\"PeriodPicker.onFromBtn(this);\" style=\"background-color: " + PeriodPicker.BLUE_BG + "\"><span class=\"icon_btn_symb\">&#9616;&#9664;</span></td>" + // <img src=\"../images/skin/iphone/from.png\" />
					"<td class=\"icon_btn\" onclick=\"PeriodPicker.onToBtn(this);\"><span class=\"icon_btn_symb\">&#9654;&#9612;</span></td>" + //	<img src=\"../images/skin/iphone/to.png\" />			
					"<td class=\"icon_btn\" onclick=\"ListBoxesHandler.onDatesList();\"><img src=\"../images/skin/iphone/list_bullets.png\" /></td>" +
					"</tr></table>" +
				"</td></tr>";
      }
      
    html +=
      "<tr><td id=\"calendar_container\"></td></tr>" +
    "</table>";
    
    parentDiv.innerHTML = html;
  }
  
  var calCont = getChildById(parentDiv, "calendar_container");

	var table = parentDiv.getElementsByTagName("table")[0];  
  var trs = table.rows;
  if (!toInp) {
    if (!isCalendarNavigation) {
      trs[0].style.display = "";
      trs[1].style.display = "none";
    }
    DatePicker.show(calCont, fromInp, callback);
  }
  else {
    if (!isCalendarNavigation) {
      trs[0].style.display = "none";
      trs[1].style.display = "";
    }
    PeriodPicker.show(calCont, fromInp, toInp, callback);
  }
  
}


/**********************************************************
* DatePicker
* structure of html is inserted in menu.js
***********************************************************/
var DatePicker = {
	input : null,
  isEuropeanFormat : null,
  callback : null,
  
  show : function(calCont, input, callback) {
    this.input = input;
    this.callback = callback;
 
    var dateFormat = input.getAttribute("date_format");
    if (dateFormat.toLowerCase().indexOf('m') == 0) 
      this.isEuropeanFormat = false; // m-d-Y
    else
      this.isEuropeanFormat = true; // d-m-Y

    var dateTmp = getDateFromText(input.value, this.isEuropeanFormat);
    if (dateTmp != null)
      iPhoneCalendar.show(calCont, this.onSelection, dateTmp);
    else
      iPhoneCalendar.show(calCont, this.onSelection);
  },
  
  onSelection : function(date) {
    var $t = DatePicker;
    $t._setValue(getTextFromDate(date, $t.isEuropeanFormat));
  },
  
  onDateClear : function() {
    DatePicker._setValue("");
  },
  
  _setValue : function(value) {
		FieldsWithEmptyValue.setValue(this.input, value);
    if (this.callback)
	  this.callback(this.input);
    else  
      ListBoxesHandler.onBackBtn(1);
  }
}

/**********************************************************
* PeriodPicker
* structure of html is inserted in menu.js
***********************************************************/
var PeriodPicker = {
  CALENDAR_DELAY : 1200,
  BLUE_BG : "#1c7fe5",
	
  calCont : null, // calendar parent div
  fromInp : null,
  toInp : null,
  callback : null,
  
  fromDate : null,
  toDate : null,
  
  toBtn : null,
  
  isEuropeanFormat : false,
  
  timerId : null,
  
  show : function(calCont, fromInp, toInp, doneCallback) {
    this.calCont = calCont;
    this.fromInp = fromInp;
    this.toInp = toInp;
    this.callback = doneCallback;
		this.curInp = fromInp; // helps to set value form list of dates

    var dateFormat = fromInp.getAttribute("date_format");
    if (dateFormat.toLowerCase().indexOf('m') == 0) 
      this.isEuropeanFormat = false; // m-d-Y
    else
      this.isEuropeanFormat = true; // d-m-Y

    var fromDateTmp = getDateFromText(this.fromInp.value, this.isEuropeanFormat);
    if (fromDateTmp != null)
      iPhoneCalendar.show(this.calCont, this.fromCallback, fromDateTmp);
    else
      iPhoneCalendar.show(this.calCont, this.fromCallback);
  },
  
  // buttons click handlers ---
  onFromBtn : function(fromBtn) {
    clearTimeout(this.timerId);
    var fromDateTmp = this.fromDate;
    if (fromDateTmp == null) 
      fromDateTmp = getDateFromText(this.fromInp.value, this.isEuropeanFormat);
    iPhoneCalendar.show(this.calCont, this.fromCallback, fromDateTmp);
    
		fromBtn.style.backgroundColor = this.BLUE_BG;
    var toBtn = getNextSibling(fromBtn);
		toBtn.style.backgroundColor = "transparent";
		
		this.curInp = this.fromInp;
  },
	
  onToBtn : function(toBtn) {
    clearTimeout(this.timerId);
    var toDateTmp = this.toDate;
    if (toDateTmp == null) 
      toDateTmp = getDateFromText(this.toInp.value, this.isEuropeanFormat);
    iPhoneCalendar.show(this.calCont, this.toCallback, toDateTmp);
  
    this.toBtn = toBtn;
		this.toBtn.style.backgroundColor = this.BLUE_BG;
    var fromBtn = getPreviousSibling(this.toBtn);
		fromBtn.style.backgroundColor = "transparent";
		
		this.curInp = this.toInp;
  },
  
  onDoneBtn : function() {
    var $t = PeriodPicker;
    clearTimeout($t.timerId);
    
    // set input value
    if ($t.fromDate != null)
      $t.fromInp.value = getTextFromDate($t.fromDate, $t.isEuropeanFormat);
    if ($t.toDate != null)
      $t.toInp.value = getTextFromDate($t.toDate, $t.isEuropeanFormat);
    
    // callback
    $t.callback($t.fromInp, $t.toInp);

    // reset buttons state
    if ($t.toBtn != null) {
			$t.toBtn.style.backgroundColor = "transparent";
      var fromBtn = getPreviousSibling($t.toBtn);
			fromBtn.style.backgroundColor = $t.BLUE_BG;
    }

		$t._reset();
  },
  
	// value set thru list of dates
	onSetThruList : function() {
		var curInp = this.curInp;
		this._reset();
		return curInp;
	},
	
  // callbacks -----------------------------
  fromCallback : function(dateObj) {
    var $t = PeriodPicker;
    $t.fromDate = dateObj;
    $t.timerId = setTimeout($t.onDoneBtn, $t.CALENDAR_DELAY);
  },
  toCallback : function(dateObj) {
    var $t = PeriodPicker;
    $t.toDate = dateObj;
    $t.timerId = setTimeout($t.onDoneBtn, $t.CALENDAR_DELAY);
  },

  // interface function
  getInputs : function() {
    return [ this.fromInp, this.toInp ];
  },
	_reset : function() {
		this.fromDate = null;
    this.toDate = null;
    this.isEuropeanFormat = false;
    this.toBtn = null;
    this.fromInp = null;
    this.toInp = null;
		this.curInp = null;
	}
}

/**********************************************************
* iPhoneCalendar
* returns date as a Date object
***********************************************************/
var iPhoneCalendar = {
  
  MONTH_NAME : ["January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December"],
  DAY_NAME : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

  curDate : null,
  dayOfMonth : null,
  
  calendarDiv : null,
  header : null,
  box : null,
	cellsTable : null,
  cells : null,
  curCell : null,
  
  callback : null,
  
  // "oveloading"
  // 1. show(parentDiv, callback);
  // 2. show(parentDiv, callback, dateObj);
  // 3. show(parentDiv, callback, timestamp);
  // 4. show(parentDiv, callback, year, month, day);
  show : function(parentDiv, callback, initYearOrTimestampOrDateObj, initMonth, initDay) {
    if (this.calendarDiv == null)
      this._initCalendar();
    // 1.
    if (typeof initYearOrTimestampOrDateObj == "undefined")
      this.curDate = new Date();
    else if (typeof initMonth == "undefined" || typeof initDay == "undefined") {
      // 2.
      if (typeof initYearOrTimestampOrDateObj == "object")
        this.curDate = initYearOrTimestampOrDateObj;
      else  // 3.
        this.curDate = new Date(initYearOrTimestampOrDateObj);
    }
    else  { // 4.
      var initMonthIdx = initMonth - 1;
      this.curDate = new Date(initYearOrTimestampOrDateObj, initMonthIdx, initDay);
    }
    this.dayOfMonth = this.curDate.getDate();
    this.callback = callback;
    
    // insert calendar in parent div and draw its state.
    parentDiv.appendChild(this.calendarDiv);
    this.setCalendarState();
  },
  
  _initCalendar : function() {
    this.calendarDiv = document.createElement("div");
    this.calendarDiv.id ="iphone_calendar";
    
    this.header = document.createElement("div");
    this.header.className = "header";
    
    this.header.innerHTML = 
      "<div class=\"back_year\" onclick=\"iPhoneCalendar.onYearMove(-1);\">" +
      //"<img src=\"calendar/img/back_year.jpg\" />" +
			"&#9664;&#9616;" +
      "</div>" +
      
      "<div class=\"back\" onclick=\"iPhoneCalendar.onMonthMove(-1);\">" +
      //"<img src=\"calendar/img/back.jpg\" />" +
			"&#9664;" +
      "</div>" +

      "<div class=\"forward_year\" onclick=\"iPhoneCalendar.onYearMove(1);\">" +
      //"<img src=\"calendar/img/forward_year.jpg\" />" +
			"&#9612;&#9654;" +
      "</div>" +

      "<div class=\"forward\" onclick=\"iPhoneCalendar.onMonthMove(1);\">" +
      //"<img src=\"calendar/img/forward.jpg\" />" +
			"&#9654;" +
      "</div>" +

      "<div class=\"month_year\"></div>";
		
		// days table(=row)
		var daysTable = document.createElement("table");
		daysTable.cellPadding = 0;
		daysTable.cellSpacing = 0;
		daysTable.style.width = "100%";
		var daysTBody = document.createElement("tbody");
		var daysTr = document.createElement("tr");
		
		daysTBody.appendChild(daysTr);
		daysTable.appendChild(daysTBody);
    
		for (var dayIdx = 0; dayIdx < 7; dayIdx++) {
      var day = document.createElement("td");
      day.className = "day_name";
      day.innerHTML = this.DAY_NAME[dayIdx];

      daysTr.appendChild(day);
    }
		this.header.appendChild(daysTable);
    
		this.calendarDiv.appendChild(this.header);
    
    // cells of days -------------
    this.box = document.createElement("div");
    this.box.className = "box";
    
		this.cellsTable = document.createElement("table");
		this.cellsTable.cellPadding = 0;
		this.cellsTable.cellSpacing = 0;
		var tbody = document.createElement("tbody");
		
    this.cells = new Array();
    
    for (var verIdx = 0; verIdx < 6; verIdx++) {
			var tr = document.createElement("tr");
			
      for (var horIdx = 0; horIdx < 7; horIdx++) {
        var cell = document.createElement("td");
        this.cells.push(cell);
        
        cell.className = "cell";
        cell.onmousedown = this.onDayMouseDown;
        cell.onmouseup = this.onDayMouseUp;
				
				if (horIdx == 6)
					cell.style.borderRight = "none";

				tr.appendChild(cell);
      }
			tbody.appendChild(tr);
    } // for end
    
		this.cellsTable.appendChild(tbody);
		this.box.appendChild(this.cellsTable);
    this.calendarDiv.appendChild(this.box);
  },
  
  setCalendarState : function() {
    var firsDayIdx = this.getFirstDayOffset(this.curDate);
    var lastDayIdx = this.getDaysAmount(this.curDate) + firsDayIdx - 1;
    var curDayIdx = this.curDate.getDate() + firsDayIdx - 1;
    var prevMonthDaysAmount = this.getDaysAmount(this.curDate, -1);
    
    // 1. month & year title
    var monthYearDiv = this.header.childNodes[4];
    monthYearDiv.innerHTML = this.MONTH_NAME[this.curDate.getMonth()] +
      " " + this.curDate.getFullYear();
    
    // 2. days cells 
   for (var i = 0; i < 42; i++) { // 42 = 6 * 7
     // 2.1 this month
     if(i >= firsDayIdx && i <= lastDayIdx) {
       this.cells[i].innerHTML = (i - firsDayIdx + 1);
       this.cells[i].className = "cell";
     }
     // 2.2 previous month
     else if (i < firsDayIdx){
       this.cells[i].innerHTML = prevMonthDaysAmount - firsDayIdx + i + 1;
       this.cells[i].className = "cell_grayed";
     }
     // 2.2 next month
     else {
       this.cells[i].innerHTML = i - lastDayIdx;
       this.cells[i].className = "cell_grayed";
     }
   }
  
	// 3. show / hide last row(s)
	 var fiveth = "none";
	 var sixth = "none";
 
	 if (lastDayIdx > 27)
			fiveth = "";
	 if (lastDayIdx > 34)
	 	sixth = "";

	 this.cellsTable.rows[4].style.display = fiveth;
	 this.cellsTable.rows[5].style.display = sixth;
	 
   // 4. set current day
   this.curCell = this.cells[curDayIdx];
   this.curCell.className = "cell_current";
  },
  
  // event handlers ---
  onMonthMove : function(step) {
    var daysAmount = this.getDaysAmount(this.curDate, step);
    var dayToSet = Math.min(this.dayOfMonth, daysAmount);

    this.curDate = new Date(this.curDate.getFullYear(), this.curDate.getMonth() + step, dayToSet);
    this.setCalendarState();
  },
  
  onYearMove : function(step) {
    this.curDate.setFullYear(this.curDate.getFullYear() + step);
    this.setCalendarState();
  },
  
  onDayMouseDown : function() {
    var $t = iPhoneCalendar;
    // this here is target event
    var targetCell = this;

    if (targetCell.className == "cell_grayed")
      return;

    // change old selected cell state
    $t.curCell.className = "cell";
    
    // change new selected cell state  
    $t.curCell = targetCell;
    $t.curCell.className = "cell_current";
    
    // change this.curDate
    //var newMonthPos = $t.curCell.getAttribute("month");
    //var monthChange = newMonthPos - oldMonthPos;
    
    $t.curDate.setDate(targetCell.innerHTML); //new Date($t.curDate.getFullYear(), $t.curDate.getMonth() + monthChange, targetCell.innerHTML);
    $t.dayOfMonth = $t.curDate.getDate();
  },
 
  onDayMouseUp : function() {
    var $t = iPhoneCalendar;
    // this here is target event
    var targetCell = this;
    
    // allow to select grayed previous and nex month days
    if (targetCell.className == "cell_grayed")
      return;

    // check if up over down
    if ($t.curDate.getDate() != targetCell.innerHTML)
      return;
    
    $t.callback($t.curDate);
  },
  

  // Date util functions --------------------------------------
  // Note: JavaScript will overflow (or underflow) dates created with
  getFirstDayOffset : function(dateObj) {
    var d = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    return d.getDay();
  },
  getDaysAmount : function(dateObj, monthOffset) {/*year, monthIdx*/
    //var d = new Date(year, monthIdx + 1, 0);
    //return d.getDate();
    if (typeof monthOffset == 'undefined')
      monthOffset = 0;
    var d = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1 + monthOffset, 0);
    return d.getDate();
  }
}


  // utils -----------------------------
  // delimeter "-"
function getDateFromText(dateStr, isEuropeanFormat) {
  if (dateStr.length == 0) {
    return new Date();
  }
  
  var dateArr = dateStr.split("-");
  // not a date in format with "-" delimeter
  if (dateArr.length != 3)
    return null;

  var year = dateArr[2];
	var idx = year.indexOf(" ");  // " " delimeter of possible time
	if (idx != -1)
		year = year.substr(0, idx);
		
  if (isEuropeanFormat)  
    return new Date(year, dateArr[1] - 1, dateArr[0]);
  else     
    return new Date(year, dateArr[0] - 1, dateArr[1]);
}

function getTextFromDate(dateObj, isEuropeanFormat) {
  if (isEuropeanFormat)
    return dateObj.getDate() + "-" + (dateObj.getMonth() + 1) + "-" +
      dateObj.getFullYear(); 
  else     
    return (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + "-" +
      dateObj.getFullYear(); 
}