/*
	>>> THIS IS CALENDAR TEMPLATE FILE <<<
	
	Variable defined here (CAL_TPL) should be passed to calendar constructor
	as second parameter.
	

	Notes:

	- Same template structure can be used for multiple
	calendar instances.
	- When specifying not numeric values for HTML tag attributes make sure you
	put them in apostrophes

*/

var CAL_TPL1 = {

	// >>> Localization settings <<<
	
	
	// months as they appear in the selection list
	'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

	// week day titles as they appear on the calendar
	'weekdays':  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

	// day week starts from (normally 1-Mo or 0-Su)
	'weekstart': 0,
	
	// width of popup window (for Netscape 4.x only)
	'w': 190, 
	// height of popup window (for Netscape 4.x only)
	'h': 180,
	
	// >>> Navbar settings <<<

	// in year selection box how many years to list relatively to current year
	'yearsbefore': 4,
	'yearsafter': 4,
		
	// >>> Appearence settings (HTML tags attributes) <<<

	// outer table (TABLE)
	'outertable': {
		'cellpadding': 0,
		'cellspacing': 0,
		'border': 0,
		'bgcolor' : '#999999',
		'class' : 'calOuterTable',
		'width': 180
	},
	// month & year navigation table (TABLE)
	'navtable': {
		'cellpadding': 0,
		'cellspacing': 0,
		'border': 0,
		'width': '100%'
	},
	// today icon cell (TD); if omited no today button will be displayed
	'todaycell': {
		'width': 20
	},
	// time navigation table (TABLE)
	'timetable': {
		'cellpadding': 0,
		'cellspacing': 1,
		'border': 0,
		'align': 'center',
		'class': 'calTimetable'
	},
	// pixel image (IMG)
	// for modal mode only
	'pixel': {
		'src': 'calendar/img/pixel.gif',
		'width': 1,
		'height': 1,
		'border' : 0		
	},
	// icon image to open the calendar instance (IMG), 
	// not for on-page mode
	'caliconshow': {
		'src': 'calendar/img/cal.gif',
		'width': 16,
		'height': 16,
		'border' : 0,
		'alt': 'click to select date from the calendar'
	},
	// icon image to close the calendar instance (IMG)
	// for modal mode only
	'caliconhide': {
		'src': 'calendar/img/no_cal.gif'
	},
	// input text field to store the date & time selected (INPUT type="text")
	'datacontrol': {
		'width': 10,
		'maxlength': 100,
		'class': 'xxs'
	},
	// hour, minute & second selectors (SELECT)
	'timeselector': {
		'class': 'calCtrl'
	},
	// today icon image (IMG); if omited no today button will be displayed
	'todayimage': {
		'src': 'calendar/img/today.gif',
		'width': 10,
		'height': 20,
		'border': 0,
		'alt': 'reset to today'
	},
	// month scroll icon cell (TD)
	'monthscrollcell': {
		'width' : 10
	},
	// next hour image (IMG)
	'hourplusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to next hour'
	},
	// previous hour image (IMG)
	'hourminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to previous hour'
	},
	// next minute image (IMG)
	'minplusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to next minute'
	},
	// previous minute image (IMG)
	'minminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to previous minute'
	},
	// next second image (IMG)
	'secplusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border' : 0,
		'alt': 'scroll to next second'
	},
	// previous second image (IMG)
	'secminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border' : 0,
		'alt': 'scroll to previous second'
	},
	// next month image (IMG)
	'monthplusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to next month'
	},
	// previous month image (IMG)
	'monthminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to previous month'
	},
	// year scroll icon cell (TD)
	'yearscrollcell': {
		'width': 10
	},
	// next year image (IMG)
	'yearplusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border' : 0,
		'alt': 'scroll to next year'
	},
	// previous year image (IMG)
	'yearminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border' : 0,
		'alt': 'scroll to previous year'
	},
	// next AM/PM image (IMG)
	'applusimage': {
		'src': 'calendar/img/plus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to AM'
	},
	// previous AM/PM image (IMG)
	'apminusimage': {
		'src': 'calendar/img/minus.gif',
		'width': 10,
		'height': 10,
		'border': 0,
		'alt': 'scroll to PM'
	},
	// inactive next image (IMG)
	'displusimage': {
		'src': 'calendar/img/plus_dis.gif',
		'width': 10,
		'height': 10,
		'border': 0
	},
	// inactive previous image (IMG)
	'disminusimage': {
		'src': 'calendar/img/minus_dis.gif',
		'width': 10,
		'height': 10,
		'border': 0
	},
	// month selector cell (TD)
	'monthselectorcell': {
		'width': '50px',
		'align': 'right'
	},
	// hour, minute & second scroll icon cell (TD)
	'timescrollcell': {
		'width': 10
	},
	// time selector cell (TD)
	'timeselectorcell': {
		'width': '50px',
		'align': 'right'
	},
	// month selector (SELECT)
	'monthselector': {
		'class': 'calCtrl'
	},
	// year selector cell (TD)
	'yearselectorcell': {
		'align': 'right'
	},
	// year selector (SELECT)
	'yearselector': {
		'class': 'calCtrl'
	},
	// cell containing calendar grid (TD)
	'gridcell': {},
	// calendar grid (TABLE)
	'gridtable': {
		'cellpadding': 2,
		'cellspacing': 1,
		'border': 0,
		'width': '100%'
	},
	// weekday title cell (TD)
	'wdaytitle': {
		'width': 20,
		'class': 'calWTitle'
	},
	// other month day text (A/SPAN)
	'dayothermonth': {
		'class': 'calOtherMonth'
	},
	// forbidden day text (A/SPAN)
	'dayforbidden': {
		'class': 'calForbDate'
	},
	// default day text (A/SPAN)
	'daynormal': {
		'class': 'calThisMonth'
	},
	// today day text (SPAN)
	'daytodaycell': {
		'style': 'border: dotted 2 red; width: 100%; margin: 0px;'
	},
	// selected day cell (TD)
	'dayselectedcell': {
		'align': 'center',
		'valign': 'middle',
		'class': 'calDayCurrent'
	},
	// wekend day cell (TD)
	'dayweekendcell': {
		'align': 'center',
		'valign': 'middle',
		'class': 'calDayWeekend'
	},
	// holiday day cell (TD)
	'daymarkedcell': {
		'align': 'center',
		'valign': 'middle',
		'class': 'calDayHoliday'
	},
	// working day cell (TD)
	'daynormalcell': {
		'align': 'center',
		'valign': 'middle',
		'class': 'calDayWorking'
	}
};