// helps to select from 2 modes: date / period
// if there is no "toInp" then DatePicker
function startCalendar(parentDiv, callback, fromInp, toInp) {
  if (typeof parentDiv == 'string')
    parentDiv = document.getElementById(parentDiv);
  
  // scedule; no toolbar with buttons
  var isCalendarNavigation = (parentDiv.id == "calendar_navigation");

  if (parentDiv.innerHTML.length == 0) {
    var html = 
      "<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"; 
      
      // TR 1st date header ---
      if (isCalendarNavigation == false) {
        html +=
        "<tr><td class=\"header\">" +
          
          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"Back\" onclick=\"ListBoxesHandler.em_onBackBtn(1);\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"List\" onclick=\"ListBoxesHandler.onDatesList();\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"Clear\" onclick=\"DatePicker.onDateClear();\"/>" +
          "</div>" +

        "</td></tr>" +

        // TR 2nd period header ---
        "<tr><td class=\"header\">" +
   
          "<div class=\"iphone_btn_blue\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"From\" onclick=\"PeriodPicker.onFromBtn(this);\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"To\" onclick=\"PeriodPicker.onToBtn(this);\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"List\" onclick=\"ListBoxesHandler.onDatesList();\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"Clear\" onclick=\"Filter.onPeriodReset();\"/>" +
          "</div>" +

          "<div class=\"iphone_btn\">" +
          "<div></div>" +
          "<input type=\"button\" value=\"Done\" onclick=\"PeriodPicker.onDoneBtn();\"/>" +
          "</div>" +
          
        "</td></tr>";
      }
      
    html +=
      "<tr><td id=\"calendar_container\"></td></tr>" +
    "</table>";
    
    parentDiv.innerHTML = html;
  }
  
  var calCont = getChildById(parentDiv, "calendar_container");
  
  var trs = parentDiv.getElementsByTagName("tr")
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

    var dateTmp = getDateFromText(input.value);
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
    this.input.value = "";
    if (this.callback)
      this.callback(value)
    else  
      ListBoxesHandler.em_onBackBtn(1);
  }
}

/**********************************************************
* PeriodPicker
* structure of html is inserted in menu.js
***********************************************************/
var PeriodPicker = {
  CALENDAR_DELAY : 1200,

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

    var dateFormat = fromInp.getAttribute("date_format");
    if (dateFormat.toLowerCase().indexOf('m') == 0) 
      this.isEuropeanFormat = false; // m-d-Y
    else
      this.isEuropeanFormat = true; // d-m-Y

    var fromDateTmp = getDateFromText(this.fromInp.value);
    if (fromDateTmp != null)
      iPhoneCalendar.show(this.calCont, this.fromCallback, fromDateTmp);
    else
      iPhoneCalendar.show(this.calCont, this.fromCallback);
  },
  
  // buttons click handlers ---
  onFromBtn : function(fromInp) {
    clearTimeout(this.timerId);
    var fromDateTmp = this.fromDate;
    if (fromDateTmp == null) 
      fromDateTmp = getDateFromText(this.fromInp.value);
    iPhoneCalendar.show(this.calCont, this.fromCallback, fromDateTmp);
    
    var fromBtn = fromInp.parentNode;
    fromBtn.className = "iphone_btn_blue";
    var toBtn = getNextSibling(fromBtn);
    toBtn.className = "iphone_btn";
  },
  onToBtn : function(toInp) {
    clearTimeout(this.timerId);
    var toDateTmp = this.toDate;
    if (toDateTmp == null) 
      toDateTmp = getDateFromText(this.toInp.value);
    iPhoneCalendar.show(this.calCont, this.toCallback, toDateTmp);
    
    this.toBtn = toInp.parentNode;
    this.toBtn.className = "iphone_btn_blue";
    var fromBtn = getPreviousSibling(this.toBtn);
    fromBtn.className = "iphone_btn";
  },
  
  onDoneBtn : function() {
    var $t = PeriodPicker;
    clearTimeout($t.timerId);
    
    // set input value
    if ($t.fromDate != null)
      $t.fromInp.value = getTextFromDate($t.fromDate, $t.isEuropeanFormat);
    if ($t.toDate != null)
      $t.toInp.value = getTextFromDate($t.toDate, $t.isEuropeanFormat);
    
    // reset buttons state
    if ($t.toBtn != null) {
      $t.toBtn.className = "iphone_btn";
      var fromBtn = getPreviousSibling($t.toBtn);
      fromBtn.className = "iphone_btn_blue";
    }
    
    // callback
    $t.callback($t.fromInp, $t.toInp);

    // reset inner content
    $t.fromDate = null;
    $t.toDate = null;
    $t.isEuropeanFormat = false;
    $t.toBtn = null;
    $t.fromInp = null;
    $t.toInp = null;

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
  }
}

/**********************************************************
* iPhoneCalendar
* returns date as a Date object
***********************************************************/
var iPhoneCalendar = {
  
  MONTH_NAME : ["January", "February", "March", "April", "May", "June", "July", "August",
    "September", "Octber", "November", "December"],
  DAY_NAME : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  FOUR_ROWS_HEIGHT : "176px",
  FIVE_ROWS_HEIGHT : "220px",
  SIX_ROWS_HEIGHT  : "264px",

  curDate : null,
  dayOfMonth : null,
  
  calendarDiv : null,
  header : null,
  box : null,
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
      "<img src=\"iphone_calendar/img/back_year.jpg\" />" +
      "</div>" +
      
      "<div class=\"back\" onclick=\"iPhoneCalendar.onMonthMove(-1);\">" +
      "<img src=\"iphone_calendar/img/back.jpg\" />" +
      "</div>" +

      "<div class=\"forward_year\" onclick=\"iPhoneCalendar.onYearMove(1);\">" +
      "<img src=\"iphone_calendar/img/forward_year.jpg\" />" +
      "</div>" +

      "<div class=\"forward\" onclick=\"iPhoneCalendar.onMonthMove(1);\">" +
      "<img src=\"iphone_calendar/img/forward.jpg\" />" +
      "</div>" +

      "<div class=\"month_year\"></div>";

    for (var dayIdx = 0; dayIdx < 7; dayIdx++) {
      var day = document.createElement("div");
      day.className = "day_name";
      day.innerHTML = this.DAY_NAME[dayIdx];
      if (dayIdx == 0 || dayIdx == 6) {
        day.style.width = "45px";
      }
      this.header.appendChild(day);
    }

    this.calendarDiv.appendChild(this.header);
    
    // -------------
    this.box = document.createElement("div");
    this.box.className = "box";
    
    this.cells = new Array();
    
    for (var verIdx = 0; verIdx < 6; verIdx++) {
      var horBorder = document.createElement("div");
      horBorder.className = "hor_border";
      this.box.appendChild(horBorder);
      
      for (var horIdx = 0; horIdx < 7; horIdx++) {
        var cell = document.createElement("div");
        this.cells.push(cell);
        
        cell.className = "cell";
        cell.onmousedown = this.onDayMouseDown;
        cell.onmouseup = this.onDayMouseUp;

        this.box.appendChild(cell);
        
        if (horIdx < 6) {
          var verBorder = document.createElement("div");
          verBorder.className = "ver_border";
          this.box.appendChild(verBorder);
        }
      }
    } // for end
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
   
   // 3. show / hide last row
   if (lastDayIdx <= 27)
     this.box.style.height = this.FOUR_ROWS_HEIGHT;
   else if (lastDayIdx > 34)
     this.box.style.height = this.SIX_ROWS_HEIGHT; 
   else
     this.box.style.height = this.FIVE_ROWS_HEIGHT
   
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
function getDateFromText(dateStr) {
  if (dateStr.length == 0) {
    return new Date();
  }
    
  var dateArr = dateStr.split("-");
  // not a date in format with "-" delimeter
  if (dateArr.length != 3)
    return null;
  
  if (this.isEuropeanFormat)  
    return new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);
  else     
    return new Date(dateArr[2], dateArr[0] - 1, dateArr[1]);
}

function getTextFromDate(dateObj, isEuropeanFormat) {
  if (isEuropeanFormat)
    return dateObj.getDate() + "-" + (dateObj.getMonth() + 1) + "-" +
      dateObj.getFullYear(); 
  else     
    return (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + "-" +
      dateObj.getFullYear(); 
}