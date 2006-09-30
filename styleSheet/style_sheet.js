
function StyleSheet(parentDivIn, sampleDivIn, frameObjIn, fieldNameIn)
{
	var IMAGES_FOLDER = "images/wysiwyg/";//"./styleSheet/images/";
	var FONT_ARR = new Array("arial", "arial black", "comic sans ms", "courier", "courier new", "georgia", "helvetica", "impact", "palatino", "times new roman", "trebuchet ms", "verdana");
	var FONT_SIZE_ARR = new Array("9px", "10px", "12px", "14px", "16px", "20px", "24px", "30px", "35px");
	
	var BORDER_ARR = new Array("dotted", "dashed", "solid", /*"double",*/ /*"groove",*/ /*"ridge",*/ "inset", /*"window-inset",*/ "outset");
	var BORDER_WIDTH = new Array("0px", "1px", "2px", "3px");
	
	var i_am = this;
	var parentDiv = parentDivIn;
	var toolBar = null;
	var sampleDiv = sampleDivIn; // the div to show a stylea of a sample
	var styleViewDiv = null;
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
	
	this.fontClrBtn = null;
	this.bgClrBtn = null;
	this.borderClrBtn = null;

	// create
	this.create = function() {
		// init not initialized Sample's properties
		this.initSampleProperties();
		
		// 1. create style view div
		styleViewDiv = this.creteStyleViewDiv();
		// 2. create the toolbar.
		toolBar = new Toolbar(parentDiv, this, 18, true);
		// 3. create the toolbar's control objects.
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

		// font color //
		this.fontClrBtn = toolBar.appendButton(this.onFontColor, false, IMAGES_FOLDER + "font_color.gif", "font color");
		// background color
		this.bgClrBtn = toolBar.appendButton(this.onBackgroundColor, false, IMAGES_FOLDER + "background_color.gif", "background color");
		// border width
		this.borderWidthList = this.createBorderWidthList(toolBar);
		// border style
		this.borderStyleList = this.createBorderList(toolBar);
		// border color
		this.borderClrBtn = toolBar.appendButton(this.onBorderColor, false, IMAGES_FOLDER + "border_color.gif", "border color");
		// CSS view
		var styleViewBtn = toolBar.appendButton(this.onStyleView, true, IMAGES_FOLDER + "properties.gif", "CSS view");

		// 4. set parent div width
		parentDiv.style.width = toolBar.getWidth();
		// alighnment of the sample.
		this.centeringSampleDiv();
	}
	
	this.creteStyleViewDiv = function() {
		var div = document.createElement('div');
		div.style.position = "absolute";
		div.style.overflow = "auto";
		div.style.fontFamily = "Arial";
		div.style.fontSize = "12px";
		
		div.style.borderStyle = "solid";
		div.style.borderWidth = 1;
		div.style.borderColor = "#ccc";
		
		div.style.visibility = "hidden";
		parentDiv.appendChild(div);
		
		return div;
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
			if(i == 0) {
				innerStr = "none";
				divTmp.style.paddingTop = divTmp.style.paddingBottom = 4;
			}
			else {
				innerStr = "<div style='width:99% height:0; border-style:solid; border-width:0; border-bottom-width:"
					+ BORDER_WIDTH[i] + ";'></div>";
				divTmp.style.paddingTop = divTmp.style.paddingBottom = 8;
			}
			divTmp.innerHTML = innerStr;
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
			divTmp.style.width = 80;
			divTmp.style.height = 12;
			divTmp.style.borderWidth = 2;
			divTmp.style.marginTop = 2;
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
/*
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
*/
/*
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
*/
/*
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
*/
	this.centeringSampleDiv = function() {
		// different sample centering on styleViewDiv option.
		if(styleViewDiv.style.visibility == "hidden") {
			sampleDiv.style.left = (parentDiv.clientWidth - sampleDiv.clientWidth) / 2;
		}
		else {
			sampleDiv.style.left = (parentDiv.clientWidth / 2 - sampleDiv.clientWidth) / 2;
		}
		
		var top = toolBar.getHeight() + (parentDiv.clientHeight - toolBar.getHeight() - sampleDiv.clientHeight) / 2;
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

		return style;
	}

	// HANDLERS ---------------------------
	this.onFontFamily = function(fontIdx) {
		sampleDiv.style.fontFamily = FONT_ARR[fontIdx];
		i_am.centeringSampleDiv();
		i_am.putStyleStr();
	}

	this.onFontSize = function(fontSizeIdx) {
		sampleDiv.style.fontSize = FONT_SIZE_ARR[fontSizeIdx];
		i_am.centeringSampleDiv();
		i_am.putStyleStr();
	}
	
	this.onBoldBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontWeight = "bold";
		}
		else {
			sampleDiv.style.fontWeight = "normal";
		}
		i_am.putStyleStr();
	}
	
	this.onItalicBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontStyle = "italic";
		}
		else {
			sampleDiv.style.fontStyle = "normal";
		}
		i_am.putStyleStr();
	}
	
	this.onFontColor = function() {
		PalettePopup.show(i_am.fontClrBtn, 'right', i_am.setFontColor);
	}
	
	this.onBackgroundColor = function() {
		PalettePopup.show(i_am.bgClrBtn, 'right', i_am.setBackgroundColor);
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
		i_am.putStyleStr();
	}

	this.onBorderWidth = function(widthIdx) {
		sampleDiv.style.borderWidth = BORDER_WIDTH[widthIdx];
		i_am.putStyleStr();
	}

	this.onBorderColor = function() {
		PalettePopup.show(i_am.borderClrBtn, 'right', i_am.setBorderColor);
	}

	this.onStyleView = function(isPressed) {
		if(isPressed) {
			var halfWidth = parentDiv.clientWidth / 2;
			styleViewDiv.style.width = halfWidth - 10;
			styleViewDiv.style.left = halfWidth + 5;
			
			styleViewDiv.style.top = toolBar.getHeight() + 5; // 5 is a margin
			styleViewDiv.style.height = parentDiv.clientHeight - toolBar.getHeight() - 10;
			styleViewDiv.style.visibility = "visible";
		}
		else 
			styleViewDiv.style.visibility = "hidden";
		
		i_am.centeringSampleDiv();
	}

	// "setters" -------------------------
	this.setFontColor = function(colorStr) {
		sampleDiv.style.color = colorStr;
		i_am.putStyleStr();
	}
	
	this.setBackgroundColor = function(colorStr) {
		sampleDiv.style.backgroundColor = colorStr;
		i_am.putStyleStr();
	}
	
	this.setBorderColor = function(colorStr) {
		if(sampleDiv.style.borderStyle.indexOf("inset") != -1 ||
					sampleDiv.style.borderStyle.indexOf("outset") != -1) {
			i_am.borderColor = colorStr;
		}
		else {
			sampleDiv.style.borderColor = colorStr;
		}
		i_am.putStyleStr();
	}
	
	this.putStyleStr = function() {
		// 1. set into styleViewDiv
		var styleStr = this.getStyleString();
		styleViewDiv.innerHTML = styleStr;

		// 2. set into a form's field
		var fieldObj = this.frameObj[this.fieldName];
		if(fieldObj != null) // IE
			fieldObj.value = styleStr;
		else { // FF !
			formName = this.frameObj.id;
			document.forms[formName].elements[this.fieldName].value = this.getStyleString() ;
		}
	}
	
	// --------------------------------------------
	this.getMemberArrayIdx = function(array, value) {
		for(var i = 0; i < array.length; i++) {
			if(array[i] == value)
				return i;
		}
		return null;
	}
	// constructor's body -----------------------
	this.create();
	this.putStyleStr();
}
