var tabShow=0;
function hidepoptext() {
	poptext = textdiv.style;
	if (tabShow == 1) {
		poptext.visibility = "hidden";
		tabShow = 0;
		return;
	}
	if (tabShow == 0) {
		if (tabShow1 == 1) {
			hidepoptext1();
		}
		else if (tabShow2 == 1) {
			hidepoptext2();
		}
		else if (tabShow3 == 1) {
			hidepoptext3();
		}			
		else if (tabShow4 == 1) {
			hidepoptext4();
		}
		poptext.visibility = "visible";
		tabShow = 1;
	}
}

var tabShow1=0;
function hidepoptext1() {
	poptext1 = textdiv1.style;
	if (tabShow1 == 1) {
		poptext1.visibility = "hidden";
		tabShow1 = 0;
		return;
	}
	if (tabShow1 == 0) {
		if (tabShow == 1) {
			hidepoptext();
		}
		else if (tabShow2 == 1) {
			hidepoptext2();
		}
		else if (tabShow3 == 1) {
			hidepoptext3();
		}			
		else if (tabShow4 == 1) {
			hidepoptext4();
		}
		poptext1.visibility = "visible";
		tabShow1 = 1;
	}
}

var tabShow2=0;
function hidepoptext2() {
	poptext2 = textdiv2.style;
	if (tabShow2 == 1) {
		poptext2.visibility = "hidden";
		tabShow2 = 0;
		return;
	}
	if (tabShow2 == 0) {
		if (tabShow == 1) {
			hidepoptext();
		}
		else if (tabShow1 == 1) {
			hidepoptext1();
		}
		else if (tabShow3 == 1) {
			hidepoptext3();
		}			
		else if (tabShow4 == 1) {
			hidepoptext4();
		}
		poptext2.visibility = "visible";
		tabShow2 = 1;
	}
}

var tabShow3=0;
function hidepoptext3() {
	poptext3 = textdiv3.style;
	if (tabShow3 == 1) {
		poptext3.visibility = "hidden";
		tabShow3 = 0;
		return;
	}
	if (tabShow3 == 0) {
		if (tabShow == 1) {
			hidepoptext();
		}
		else if (tabShow1 == 1) {
			hidepoptext1();
		}
		else if (tabShow2 == 1) {
			hidepoptext2();
		}
		else if (tabShow4 == 1) {
			hidepoptext4();
		}
		poptext3.visibility = "visible";
		tabShow3 = 1;
                document.emailForm.subject.value = document.title;
	}
}

var tabShow4=0;
function hidepoptext4() {
	poptext4 = textdiv4.style;
	if (tabShow4 == 1) {
		poptext4.visibility = "hidden";
		tabShow4 = 0;
		return;
	}
	if (tabShow4 == 0) {
		if (tabShow == 1) {
			hidepoptext();
		}
		else if (tabShow1 == 1) {
			hidepoptext1();
		}
		else if (tabShow2 == 1) {
			hidepoptext2();
		}
		else if (tabShow3 == 1) {
			hidepoptext3();
		}
		poptext4.visibility = "visible";
		tabShow4 = 1;
                document.scheduleForm.name.value = document.title;
	}
}

function onRecChange() {
  if (document.scheduleForm.rec.value == 'week') {
    document.getElementById("titleDiv").innerHTML = '<b>Day:</b>';
    document.getElementById("valueDiv").innerHTML = '<select name="weekDay">' +
                         '<option value="Mon">Monday</option>' +
                         '<option value="Tue">Tuesday</option>' +
                         '<option value="Wed">Wednesday</option>' +
                         '<option value="Thu">Thursday</option>' +
                         '<option value="Fri">Friday</option>' +
                         '<option value="Sat">Saturday</option>' +
                         '<option value="Sun">Sunday</option>' +
                         '</select>';
  } else if (document.scheduleForm.rec.value == 'month') {
    document.getElementById("titleDiv").innerHTML = '<b>Day:</b>';
    document.getElementById("valueDiv").innerHTML = '<select name="day">' +
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
