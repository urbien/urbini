// -----------------------
// -- CityList Functions --
// -----------------------

function DisplayCityLink(sCityField, sStateField, sURL, sDMA) {
	DisplayCityListPopupHREF(sCityField, sStateField, sURL, sDMA);
	document.write ('<font face=arial,helvetica size=1><b>City&nbsp;List</b></font></a>');
}


function DisplayCityListPopupHREF(sCityField, sStateField, sURL, sDMA) {
	document.write ('<a href=# onClick="ListCities(\'' + sCityField + '\',\'' + sStateField + '\',\'' + sURL + '\',\'' + sDMA + '\'); return false">');
}


function ListCities(sCityField, sStateField, sURL, sDMA) {
	var url= sURL + '&c=' + sCityField + '&s=' + sStateField  + '&gtyp=' + sDMA
	var sStateField = eval('document.' + sStateField)
	var state = sStateField.options[sStateField.selectedIndex].value

	if (sDMA == "") {
		if ((state == "ALL, US") || (state == "") || (state == "---")) {
			alert("Please choose a state first.")
			sStateField.options.focus()
		}
		else {
			self.open(url,'wndGeoPicker','width=420,height=550,scrollbars=yes,resizable=yes,toolbar=0,menubar=0,status=0,location=0')
		}
	}
	else {
		self.open(url,'wndGeoPicker','width=420,height=550,scrollbars=yes,resizable=yes,toolbar=0,menubar=0,status=0,location=0')	
	}
}