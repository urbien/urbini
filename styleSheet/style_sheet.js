
function StyleSheet(parentDivIn, sampleDivIn, frameObjIn, fieldNameIn)
{
	var IMAGES_FOLDER = "./styleSheet/images/";
	var FONT_ARR = new Array("arial", "arial black", "comic sans ms", "courier", "courier new", "georgia", "helvetica", "impact", "palatino", "times new roman", "trebuchet ms", "verdana");
	var FONT_SIZE_ARR = new Array("9px", "10px", "12px", "14px", "16px", "20px", "24px", "30px", "35px");
	
	var BORDER_ARR = new Array("dotted", "dashed", "solid", /*"double",*/ /*"groove",*/ /*"ridge",*/ "inset", /*"window-inset",*/ "outset");
	var BORDER_WIDTH = new Array("0px", "1px", "2px", "3px");
	
	var i_am = this;
	var parentDiv = parentDivIn;
	var toolBar;
	var sampleDiv = sampleDivIn; // the div to show a stylea of a sample
	this.frameObj  = frameObjIn;
	this.fieldName = fieldNameIn;
	this.fieldObj = null;
	
	this.fontFamilyList = null;
	this.fontSizeList = null;
	this.borderStyleList = null;
	this.borderWidthList = null;

	this.fontPaletteDiv = null;
	this.backgroundPaletteDiv = null;
	this.borderPaletteDiv = null;
	
	this.borderColor; // used to store the value when borderColor is unseted on "inset" and "outset" border styles.
	
	// create
	this.create = function() {
		// init not initialized Sample's properties
		this.initSampleProperties();

		// 1. create the toolbar.
		toolBar = new Toolbar(parentDiv, this);
		// 2. create control objects.
		// font family
		this.fontFamilyList = this.createFontList(toolBar);
		// font size
		this.fontSizeList = this.createFontSizeList(toolBar);
		
		// bold
		var boldBtn = toolBar.appendButton(this.onBoldBtn, true, IMAGES_FOLDER + "bold.gif", "bold");
		if(sampleDiv.style.fontWeight.toLowerCase() == "bold")
			boldBtn.pressToggleButton()
		// italic
		var italicBtn = toolBar.appendButton(this.onItalicBtn, true, IMAGES_FOLDER + "italic.gif", "italic");
		if(sampleDiv.style.fontStyle.toLowerCase() == "italic")
			italicBtn.pressToggleButton()

		// font color
		var fontClrBtn = toolBar.appendButton(this.onFontColor, false, IMAGES_FOLDER + "font_color.gif", "font color");
		// background color
		var bgClrBtn = toolBar.appendButton(this.onBackgroundColor, false, IMAGES_FOLDER + "background_color.gif", "background color");
		// border width
		this.borderWidthList = this.createBorderWidthList(toolBar);
		// border style
		this.borderStyleList = this.createBorderList(toolBar);
		// border color
		var borderClrBtn = toolBar.appendButton(this.onBorderColor, false, IMAGES_FOLDER + "border_color.gif", "border color");
		
		// create palettes
		this.createFontPalette(fontClrBtn);
		this.createBackgroundPalette(bgClrBtn);
		this.createBorderPalette(borderClrBtn);

		// set parent div width
		parentDiv.style.width = toolBar.div.clientWidth;
		// alighnment of the sample.
		this.centeringSampleDiv();
	}
	
	this.createFontList = function(toolBar) {
		var FONT_SIZE = 14;
		var FONT_FIELD_WIDTH = 120;
		var ddList = toolBar.appendDropdownList(FONT_FIELD_WIDTH, "font:", this.onFontFamily);
		for(var i = 0; i < FONT_ARR.length; i++) {
			var divTmp = document.createElement('div');
			divTmp.innerHTML = FONT_ARR[i];
			divTmp.style.fontFamily = FONT_ARR[i];
			divTmp.style.fontSize = FONT_SIZE;
			ddList.appendItem(divTmp);
		}
		// set current item in the list
		var curFont = sampleDiv.style.fontFamily.toLowerCase();
		var curIdx = this.getMemberArrayIdx(FONT_ARR, curFont);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);

		return ddList;
	}
	
	this.createFontSizeList = function(toolBar) {
		var FONT_FIELD_WIDTH = 50;
		var ddList = toolBar.appendDropdownList(FONT_FIELD_WIDTH, "size:", this.onFontSize);
		for(var i = 0; i < FONT_SIZE_ARR.length; i++) {
			var divTmp = document.createElement('div');
			divTmp.innerHTML = FONT_SIZE_ARR[i];
			ddList.appendItem(divTmp);
		}
		// set current item in the list
		var curFontSize = sampleDiv.style.fontSize.toLowerCase();
		var curIdx = this.getMemberArrayIdx(FONT_SIZE_ARR, curFontSize);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);

		return ddList;
	}
	
	this.createBorderWidthList = function(toolBar) {
		var BORDER_FIELD_WIDTH = 90;
		var ddList = toolBar.appendDropdownList(BORDER_FIELD_WIDTH, "border:", this.onBorderWidth);
		var innerStr;
		for(var i = 0; i < BORDER_WIDTH.length; i++) {
			var divTmp = document.createElement('div');
			if(i == 0)
				innerStr = "none";
			else
				innerStr = "<div style='width:99% height:0; margin-bottom:5; margin-top:5; border-style:solid; border-width:0; border-bottom-width:"
				+ BORDER_WIDTH[i] + ";'></div>";
			divTmp.innerHTML = innerStr;
			divTmp.style.paddingTop = divTmp.style.paddingBottom = 1;
			ddList.appendItem(divTmp);
		}
		
		// set current item in the list
		var curBorderWidth = sampleDiv.style.borderWidth.toLowerCase();
		// FF returns 4 words for each side. Extract 1st only.
		var firstSpace = curBorderWidth.indexOf(" ");
		if(firstSpace != -1)
			curBorderWidth = curBorderWidth.substring(0, firstSpace);

		var curIdx = this.getMemberArrayIdx(BORDER_WIDTH, curBorderWidth);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);
		else {
			sampleDiv.style.borderWidth = 0;
			ddList.setSelectedItem(0);
		}

		return ddList;
	}

	this.createBorderList = function(toolBar) {
		var BORDER_FIELD_WIDTH = 90;
		var ddList = toolBar.appendDropdownList(BORDER_FIELD_WIDTH, "border style:", this.onBorderStyle);
		for(var i = 0; i < BORDER_ARR.length; i++) {
			var divTmp = document.createElement('div');
			var divInnerTmp = document.createElement('div');
			
			divTmp.style.borderStyle = BORDER_ARR[i];
			divTmp.style.width = 90;
			divTmp.style.height = 11;
			divTmp.style.borderWidth = 2;
			divTmp.style.borderStyle = BORDER_ARR[i];
			ddList.appendItem(divTmp);
		}
		
		// set current item in the list
		var curBorderStyle = sampleDiv.style.borderStyle.toLowerCase();
		// FF returns 4 words for each side. Extract 1st only.
		var firstSpace = curBorderStyle.indexOf(" ");
		if(firstSpace != -1)
			curBorderStyle = curBorderStyle.substring(0, firstSpace);
			
		var curIdx = this.getMemberArrayIdx(BORDER_ARR, curBorderStyle);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);

		return ddList;
	}

	this.createFontPalette = function(fontClrBtn) {
		this.fontPaletteDiv = document.createElement('div');
		this.fontPaletteDiv.style.position = "absolute"
		this.fontPaletteDiv.style.backgroundColor = "#fff";
		this.fontPaletteDiv.style.visibility = "hidden";
		this.fontPaletteDiv.innerHTML = this.getPaletteContent();
		var tdCol = this.fontPaletteDiv.getElementsByTagName("td");
		for(var i = 0; i < tdCol.length; i++) {
			eval("this._fontClr" + i + " = function() {i_am.setFontColor('" + tdCol[i].bgColor + "');}");
			tdCol[i].onmouseup = eval("this._fontClr" + i);
		}
		
		toolBar.div.appendChild(this.fontPaletteDiv);
		
		var left = fontClrBtn.left + fontClrBtn.width - this.fontPaletteDiv.clientWidth;
		var top = fontClrBtn.top + fontClrBtn.height + 7;
		this.fontPaletteDiv.style.left = left;
		this.fontPaletteDiv.style.top = top;

	}

	this.createBackgroundPalette = function(bgClrBtn) {
		this.backgroundPaletteDiv = document.createElement('div');
		this.backgroundPaletteDiv.style.position = "absolute"
		this.backgroundPaletteDiv.style.backgroundColor = "#fff";
		this.backgroundPaletteDiv.style.visibility = "hidden";
		this.backgroundPaletteDiv.innerHTML = this.getPaletteContent();
		var tdCol = this.backgroundPaletteDiv.getElementsByTagName("td");
		for(var i = 0; i < tdCol.length; i++) {
			eval("this._bgClr" + i + " = function() {i_am.setBackgroundColor('" + tdCol[i].bgColor + "');}");
			tdCol[i].onmouseup = eval("this._bgClr" + i);
		}
		
		toolBar.div.appendChild(this.backgroundPaletteDiv);
		
		var left = bgClrBtn.left + bgClrBtn.width - this.backgroundPaletteDiv.clientWidth;
		var top = bgClrBtn.top + bgClrBtn.height + 7;
		this.backgroundPaletteDiv.style.left = left;
		this.backgroundPaletteDiv.style.top = top;
	}

	this.createBorderPalette = function(borderClrBtn) {
		this.borderPaletteDiv = document.createElement('div');
		this.borderPaletteDiv.innerHTML = this.getPaletteContent();
		this.borderPaletteDiv.style.position = "absolute"
		this.borderPaletteDiv.style.backgroundColor = "#fff";
		this.borderPaletteDiv.style.visibility = "hidden";

		var tdCol = this.borderPaletteDiv.getElementsByTagName("td");
		for(var i = 0; i < tdCol.length; i++) {
			eval("this._borderClr" + i + " = function() {i_am.setBorderColor('" + tdCol[i].bgColor + "');}");
			tdCol[i].onmouseup = eval("this._borderClr" + i);
		}
		
		// append the palette
		toolBar.div.appendChild(this.borderPaletteDiv);
		
		var left = borderClrBtn.left + borderClrBtn.width - this.borderPaletteDiv.clientWidth;
		var top = borderClrBtn.top + borderClrBtn.height + 7;
		this.borderPaletteDiv.style.left = left;
		this.borderPaletteDiv.style.top = top;
	}

	this.centeringSampleDiv = function() {
		sampleDiv.style.left = (parentDiv.clientWidth - sampleDiv.clientWidth) / 2;
		var top = toolBar.getHeight() + 
			(parentDiv.clientHeight - toolBar.getHeight() - sampleDiv.clientHeight) / 2;
		sampleDiv.style.top = top;
	}

	this.initSampleProperties = function() {
		sampleDiv.innerHTML = "Sample text";
		sampleDiv.style.position = "absolute";
		// 1. font family
		if(sampleDiv.style.fontFamily == "")
			sampleDiv.style.fontFamily = FONT_ARR[0];
		// 2. font size
		if(sampleDiv.style.fontSize == "")
			sampleDiv.style.fontSize = FONT_SIZE_ARR[5];
		if(sampleDiv.style.fontSize == "12pt")
			sampleDiv.style.fontSize = FONT_SIZE_ARR[5];
		// 3. bold
		if(sampleDiv.style.fontWeight == "")
			sampleDiv.style.fontWeight = "normal";
		// 4. italic
		if(sampleDiv.style.fontStyle == "")
			sampleDiv.style.fontStyle = "normal";
		// 5. font color
		if(sampleDiv.style.color == "")
			sampleDiv.style.color = "#000000";
		// 6. background color
		if(sampleDiv.style.backgroundColor == "")
			sampleDiv.style.backgroundColor = "#ffffff";
		// 7. border style
		if(sampleDiv.style.borderStyle == "")
			sampleDiv.style.borderStyle = BORDER_ARR[2];
		// 8. border width
		if(sampleDiv.style.borderWidth == "")
			sampleDiv.style.borderWidth = 0;
		// 9. border color
		// for bordy style "inset", "outset", borderColor should be unsetted.
		if(sampleDiv.style.borderColor == "")
			sampleDiv.style.borderColor = "#000000";
		
		// PADDING
		sampleDiv.style.padding = "5px";
		// no need in height
		sampleDiv.style.height = "";
		
		sampleDiv.style.visibility = "visible";
	}

	this.getStyleString = function() {
		var style = "";
		// 1. font family
		style += "font-family: " + sampleDiv.style.fontFamily + "; ";
		// 2. font size
		style += "font-size: " + sampleDiv.style.fontSize + "; ";
		// 3. bold
		style += "font-weight: " + sampleDiv.style.fontWeight + "; ";
		// 4. italic
		style += "font-style: " + sampleDiv.style.fontStyle + "; ";
		// 5. font color
		style += "color: " + sampleDiv.style.color + "; ";
		// 6. background color
		style += "background-color: " + sampleDiv.style.backgroundColor + "; ";
		// 7. border style
		style += "border-style: " + sampleDiv.style.borderStyle + "; ";
		// 8. border width
		style += "border-width: " + sampleDiv.style.borderWidth + "; ";
		// 9. border color
		style += "border-color: " + sampleDiv.style.borderColor + "; ";

		// PADDING
		style += "padding-left:1%;";
		style += "padding-right:1%;";
		
		return style;
	}

	// HANDLERS ---------------------------
	this.onFontFamily = function(fontIdx) {
		sampleDiv.style.fontFamily = FONT_ARR[fontIdx];
		i_am.centeringSampleDiv();
		i_am.putStyleStrInField();
	}

	this.onFontSize = function(fontSizeIdx) {
		sampleDiv.style.fontSize = FONT_SIZE_ARR[fontSizeIdx];
		i_am.centeringSampleDiv();
		i_am.putStyleStrInField();
	}
	
	this.onBoldBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontWeight = "bold";
		}
		else {
			sampleDiv.style.fontWeight = "normal";
		}
		i_am.putStyleStrInField();
	}
	
	this.onItalicBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontStyle = "italic";
		}
		else {
			sampleDiv.style.fontStyle = "normal";
		}
		i_am.putStyleStrInField();
	}
	
	this.onFontColor = function() {
		if(i_am.fontPaletteDiv.style.visibility == "visible")
			return;
		i_am.fontPaletteDiv.style.visibility = "visible";
		toolBar.popupHandler(i_am.fontPaletteDiv, false);
		
	}
	
	this.onBackgroundColor = function() {
		if(i_am.backgroundPaletteDiv.style.visibility == "visible")
			return;
		i_am.backgroundPaletteDiv.style.visibility = "visible";
		toolBar.popupHandler(i_am.backgroundPaletteDiv, false);
	}
	
	this.onBorderStyle = function(styleIdx) {
		// on border style: "inset" and "outset", to unset border color.
		if(BORDER_ARR[styleIdx].indexOf("inset") != -1 ||
				 BORDER_ARR[styleIdx].indexOf("outset") != -1) {
			if(sampleDiv.style.borderColor != "")
				i_am.borderColor = sampleDiv.style.borderColor;

			sampleDiv.style.borderColor = "";
			sampleDiv.style.borderStyle = BORDER_ARR[styleIdx];
		}
		else {
			if(sampleDiv.style.borderColor == "") {
				sampleDiv.style.borderColor = i_am.borderColor;
			}
			sampleDiv.style.borderStyle = BORDER_ARR[styleIdx];
		}
		i_am.putStyleStrInField();
	}

	this.onBorderWidth = function(widthIdx) {
		sampleDiv.style.borderWidth = BORDER_WIDTH[widthIdx];
		i_am.putStyleStrInField();
	}

	this.onBorderColor = function() {
		if(i_am.borderPaletteDiv.style.visibility == "visible")
			return;
		i_am.borderPaletteDiv.style.visibility = "visible";
		toolBar.popupHandler(i_am.borderPaletteDiv, false);
	}

	// "setters" -------------------------
	this.setFontColor = function(colorStr) {
		sampleDiv.style.color = colorStr;
		i_am.fontPaletteDiv.style.visibility = "hidden";
		i_am.putStyleStrInField();
	}
	
	this.setBackgroundColor = function(colorStr) {
		sampleDiv.style.backgroundColor = colorStr;
		i_am.backgroundPaletteDiv.style.visibility = "hidden";
		i_am.putStyleStrInField();
	}
	
	this.setBorderColor = function(colorStr) {
		if(sampleDiv.style.borderStyle.indexOf("inset") != -1 ||
					sampleDiv.style.borderStyle.indexOf("outset") != -1) {
			i_am.borderColor = colorStr;
		}
		else {
			sampleDiv.style.borderColor = colorStr;
		}
		i_am.borderPaletteDiv.style.visibility = "hidden";
		i_am.putStyleStrInField();
	}
	
	// UNREMARK !!!!!!!!!!!!!!!!!!
	this.putStyleStrInField = function() {
	/*
		var fieldObj = this.frameObj[this.fieldName];
		if(fieldObj != null) // IE
			fieldObj.value = this.getStyleString();
		else { // FF !
			formName = this.frameObj.id;
			document.forms[formName].elements[this.fieldName].value = this.getStyleString() ;
		}
		*/
	}
	
	// --------------------------------------------
	this.getMemberArrayIdx = function(array, value) {
		for(var i = 0; i < array.length; i++) {
			if(array[i] == value)
				return i;
		}
		return null;
	}
	
	this.getPaletteContent = function()
	{
		var palette =
			'<table cellpadding="0" cellspacing="1" border="1" align="left">' + '<tr>'//
			+ '	<td bgcolor="#FFFFFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCCCC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCC99" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFFF99" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFFFCC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#99FF99" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#99FFFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CCFFFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CCCCFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCCFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#CCCCCC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF6666" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF9966" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFFF66" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFFF33" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#66FF99" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#33FFFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#66FFFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#9999FF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF99FF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#C0C0C0" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF0000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF9900" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCC66" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFFF00" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#33FF33" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#66CCCC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#33CCFF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#6666CC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CC66CC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#999999" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CC0000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FF6600" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCC33" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#FFCC00" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#33CC00" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#00CCCC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#3366FF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#6633FF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CC33CC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#666666" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#990000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CC6600" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#CC9933" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#999900" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#009900" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#339999" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#3333FF" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#6600CC" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#993399" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#333333" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#660000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#993300" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#996633" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#666600" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#006600" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#336666" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#000099" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#333399" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#663366" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#000000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#330000" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#663300" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#663333" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#333300" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#003300" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#003333" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#000066" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#330099" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td bgcolor="#330033" width="10" height="10" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '</table>';
		
		return palette;
	}


	// constructor's body -----------------------
	this.create();
	this.putStyleStrInField();
}
