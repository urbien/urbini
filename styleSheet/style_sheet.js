
function StyleSheet(parentDivIn, sampleDivIn, formObjIn, fieldNameIn)
{
	var IMAGES_FOLDER = "images/wysiwyg/";
	var FONT_ARR = ["arial", "arial black", "comic sans ms", "courier", "courier new", "georgia", "helvetica", "impact", "palatino", "times new roman", "trebuchet ms", "verdana"];
	var FONT_SIZE_ARR = ["9px", "10px", "12px", "14px", "16px", "20px", "24px", "30px", "35px"];
	
	var BORDER_APPLY_TO = [{name:"none", valueHtml:"", valueScr:""}, {name:"all", valueHtml:"border", valueScr:"border"},{name:"left", valueHtml:"border-left", valueScr:"borderLeft"},
	  {name:"top", valueHtml:"border-top", valueScr:"borderTop"}, {name:"right", valueHtml:"border-right", valueScr:"borderRight"}, {name:"bottom", valueHtml:"border-bottom", valueScr:"borderBottom"}];
	var BORDER_STYLE = ["dotted", "dashed", "solid", /*"double",*/ /*"groove",*/ /*"ridge",*/ "inset", /*"window-inset",*/ "outset"];
	var BORDER_WIDTH = ["1px", "2px", "3px", "10px"];
	
	var i_am = this;
	var parentDiv = parentDivIn;
	var toolBar = null;
	var sampleDiv = sampleDivIn; // the div to show a stylea of a sample
	var styleViewDiv = null;
	this.formObj  = formObjIn;
	this.fieldName = fieldNameIn;
	this.fieldObj = null;
	
	this.fontFamilyList = null;
	this.fontSizeList = null;
	
	this.borderApplyToList = null;
	this.borderWidthList = null;
	this.borderStyleList = null;

	this.fontPaletteDiv = null;
	this.backgroundPaletteDiv = null;
	this.borderPaletteDiv = null;
	
	//this.borderColor; // used to store the value when borderColor is unseted on "inset" and "outset" border styles.
	this.borderDesc = {"applyToIdx" : 0, "width" : "", "color" : "", "style" : ""};
	
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
		// border apply to
		this.borderApplyToList = this.createBorderApplyTo(toolBar);
		// border width
		this.borderWidthList = this.createBorderWidthList(toolBar);
		// border style
		this.borderStyleList = this.createBorderStyleList(toolBar);
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
		//div.style.borderColor = "#ccc";
		
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
	// border
	this.createBorderApplyTo = function(toolBar) {
   	var BORDER_FIELD_WIDTH = 60;
  	var ddList = toolBar.appendDropdownList(BORDER_FIELD_WIDTH, "border:", this.onBorderApplyTo);
		
		for(var i = 0; i < BORDER_APPLY_TO.length; i++) {
			var divTmp = document.createElement('div');
			divTmp.innerHTML = BORDER_APPLY_TO[i].name;
			ddList.appendItem(divTmp);
		}
		
		// set current item in the list
		ddList.setSelectedItem(this.borderDesc.applyToIdx);
		return ddList;
  }
  // border width (1)
	this.createBorderWidthList = function(toolBar) {
		var BORDER_FIELD_WIDTH = 60;
		var ddList = toolBar.appendDropdownList(BORDER_FIELD_WIDTH, "width:", this.onBorderWidth);
		var innerStr;
		for(var i = 0; i < BORDER_WIDTH.length; i++) {
			var divTmp = document.createElement('div');
			innerStr = "<div style='width:99% height:0; border-style:solid; border-width:0; border-bottom-width:"
				+ BORDER_WIDTH[i] + ";'></div>";
			divTmp.style.paddingTop = divTmp.style.paddingBottom = 8;

			divTmp.innerHTML = innerStr;
			ddList.appendItem(divTmp);
		}
		// set current item in the list
		var curIdx = this.getMemberArrayIdx(BORDER_WIDTH, this.borderDesc.width);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);
		else
			ddList.setSelectedItem(0);

		return ddList;
	}
  // border style (2)
	this.createBorderStyleList = function(toolBar) {
		var BORDER_FIELD_WIDTH = 60;
		var ddList = toolBar.appendDropdownList(BORDER_FIELD_WIDTH, "style:", this.onBorderStyle);
		for(var i = 0; i < BORDER_STYLE.length; i++) {
			var divTmp = document.createElement('div');
			var divInnerTmp = document.createElement('div');
			
			divTmp.style.borderStyle = BORDER_STYLE[i];
			divTmp.style.width = 50;
			divTmp.style.height = 12;
			divTmp.style.borderWidth = 2;
			divTmp.style.marginTop = 2;
			divTmp.style.borderStyle = BORDER_STYLE[i];
			ddList.appendItem(divTmp);
		}
		// set current item in the list
/*
		var curBorderStyle = sampleDiv.style.borderStyle.toLowerCase();
		// FF returns 4 words for each side. Extract 1st only.
		var firstSpace = curBorderStyle.indexOf(" ");
		if(firstSpace != -1)
			curBorderStyle = curBorderStyle.substring(0, firstSpace);
*/			
		var curIdx = this.getMemberArrayIdx(BORDER_STYLE, this.borderDesc.style);
		if(curIdx != null)
			ddList.setSelectedItem(curIdx);
		else
		  ddList.setSelectedItem(2);

		return ddList;
	}

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
		
		// 6. borders
		this.initBorderDesc();
		
		// PADDING
		sampleDiv.style.padding = "5px";
		// no need height
		sampleDiv.style.height = "";
		
		sampleDiv.style.visibility = "visible";
	}
	
	this.initBorderDesc = function() {
    var stl = sampleDiv.style;
    var applyToIdx = 0; // init: no borders
    var bordersAmt = 0;
    // 1. apply to
    // check: left (idx 2), top, right, bottom 
    for(var i = 2; i < BORDER_APPLY_TO.length; i++) {
      if(stl[BORDER_APPLY_TO[i].valueScr].length != 0) {
        applyToIdx = i;
        bordersAmt++;
      }
    }
    if(bordersAmt > 1)
       this.borderDesc.applyToIdx = 1; // all b0rders
    else if(bordersAmt == 1)
      this.borderDesc.applyToIdx = applyToIdx;
    
    // 2. width
    var widthName = BORDER_APPLY_TO[applyToIdx].valueScr + "Width";
    this.borderDesc.width = stl[widthName];
    
    // 3. color
    var colorName = BORDER_APPLY_TO[applyToIdx].valueScr + "Color";
    this.borderDesc.color = stl[colorName];
    
    // 4. style
    var styleName = BORDER_APPLY_TO[applyToIdx].valueScr + "Style";
    this.borderDesc.style = stl[styleName];
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
		if(sampleDiv.style.backgroundColor != "")
		  style += "background-color: " + sampleDiv.style.backgroundColor + "; ";
		// border
		var brdStl = this.getBorderStyleStr();
		if(brdStl.length != 0) {
      var applyTo = BORDER_APPLY_TO[this.borderDesc.applyToIdx].valueHtml;
		  style += applyTo + ": " + brdStl + "; "
		}
		return style;
	}
  
  this.getBorderStyleStr = function() {
  	var brdStlStr = "";
  	if(this.borderDesc.applyToIdx != 0) {
	    var applyTo = BORDER_APPLY_TO[this.borderDesc.applyToIdx].valueScr;
	    if(typeof this.borderDesc.width != 'undefined')
	      brdStlStr += this.borderDesc.width + " ";
 	    if(typeof this.borderDesc.color != 'undefined')
        brdStlStr += this.borderDesc.color + " ";
	    if(typeof this.borderDesc.style != 'undefined')
	      brdStlStr += this.borderDesc.style;
	  }
	  return brdStlStr;
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
		var parentDlg = getAncestorById(i_am.fontClrBtn.div, 'pane2'); //'pane2' dialog 
		PalettePopup.show(i_am.fontClrBtn, 'right', i_am.setFontColor, parentDlg);
	}
	
	this.onBackgroundColor = function() {
		var parentDlg = getAncestorById(i_am.bgClrBtn.div, 'pane2'); //'pane2' dialog 
		PalettePopup.show(i_am.bgClrBtn, 'right', i_am.setBackgroundColor, parentDlg, "no background");
	}
	
  // borders --
  this.onBorderApplyTo = function(applyToIdx) {
    i_am.borderDesc.applyToIdx = applyToIdx;
    i_am._setBorders();
  }
  // border width:
	this.onBorderWidth = function(widthIdx) {
		//sampleDiv.style.borderWidth = BORDER_WIDTH[widthIdx];
		i_am.borderDesc.width = BORDER_WIDTH[widthIdx];
		i_am._setBorders();
	}
	// border style
	this.onBorderStyle = function(styleIdx) {
		//sampleDiv.style.borderStyle = BORDER_STYLE[styleIdx];
		i_am.borderDesc.style = BORDER_STYLE[styleIdx];
		i_am._setBorders();
	}
	// border color
	this.onBorderColor = function() {
		var parentDlg = getAncestorById(i_am.borderClrBtn.div, 'pane2'); //'pane2' dialog 
		PalettePopup.show(i_am.borderClrBtn, 'right', i_am.setBorderColor, parentDlg);
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
	 // if(colorStr.length == 0)
	 //   sampleDiv.style.backgroundColor = "transparent";
	 // else
	    sampleDiv.style.backgroundColor = colorStr;
		i_am.putStyleStr();
	}
	
	this.setBorderColor = function(colorStr) {
		//sampleDiv.style.borderColor = colorStr;
		i_am.borderDesc.color = colorStr;
		i_am._setBorders();
	}
	this._setBorders = function() {
    // reset
    sampleDiv.style.border = "";
    var brdStlStr = this.getBorderStyleStr();
    if(brdStlStr.length != 0) {
      var applyTo = BORDER_APPLY_TO[this.borderDesc.applyToIdx].valueScr;
      sampleDiv.style[applyTo] =  brdStlStr;
    }
	  i_am.putStyleStr();
	}

	
	this.putStyleStr = function() {
		// 1. set into styleViewDiv
		var styleStr = this.getStyleString();
		styleViewDiv.innerHTML = styleStr;

		// 2. set into a form's field
		var fieldObj = this.formObj[this.fieldName];
		if(fieldObj != null) // IE
			fieldObj.value = styleStr;
		else { // FF !
			formName = this.formObj.id;
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
