var MenuArray = new Array("textdiv", "textdiv1", "textdiv2", "textdiv3", "textdiv4",
                          "vesselsDiv", "wagonsDiv", "trainsDiv", "trucksDiv",
                          "warehousesDiv")
function menuOpenClose(divName) {
	for (i = 0; i < MenuArray.length; i++) {
		if (document.getElementById(MenuArray[i]) == null) {
			continue;
		}
		if (MenuArray[i] != divName) {
			poptext = document.getElementById(MenuArray[i]).style;
			if (poptext.visibility =="visible") {
				poptext.visibility = "hidden";
			}
		}
	}
	poptext = document.getElementById(divName).style;
	if (poptext.visibility == "hidden" || poptext.visibility == "") {
		poptext.visibility = "visible";
	} else {
		poptext.visibility = "hidden";
	}
	if (document.getElementById("textdiv3") != null &&
            document.getElementById("textdiv3").style.visibility == "visible"
           ) {
		document.getElementById("emailForm").subject.value = document.title;
	}
	if (document.getElementById("textdiv4") != null &&
            document.getElementById("textdiv4").style.visibility == "visible"
           ) {
		document.getElementById("scheduleForm").name.value = document.title;
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
