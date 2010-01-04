function initStyleSheet(parentDivId, sampleDivId, formName, fieldName) {
  new StyleSheet(parentDivId, sampleDivId, formName, fieldName);
}

function StyleSheet(parentDivId, sampleDivId, formName, fieldName)
{
	var IMAGES_FOLDER = "images/wysiwyg/";
	
	var FONT = [{"name":"arial", "value":"arial"}, {"name":"arial black", "value":"arial black"}, {"name":"comic sans ms", "value":"comic sans ms"},
	 {"name":"courier", "value":"courier"}, {"name":"courier new", "value":"courier new"}, {"name":"georgia", "value":"georgia"}, {"name":"helvetica", "value":"helvetica"}, {"name":"impact", "value":"impact"},
	 {"name":"palatino", "value":"palatino"}, {"name":"times new roman", "value":"times new roman"}, {"name":"trebuchet ms", "value":"trebuchet ms"}, {"name":"verdana", "value":"verdana"}, {"name":"<i>default</i>", "value":""}];
	
	var FONT_SIZE = [{"name":"9px", "value":"9px"}, {"name":"10px", "value":"10px"}, {"name":"12px", "value":"12px"}, {"name":"14px", "value":"14px"},
	  {"name":"16px", "value":"16px"}, {"name":"20px", "value":"20px"}, {"name":"24px", "value":"24px"}, {"name":"30px", "value":"30px"}, {"name":"35px", "value":"35px"}, {"name":"<i>default</i>", "value":""}];
	
	var BORDER_APPLY_TO = [{name:"none", valueHtml:"", valueScr:""}, {name:"all", valueHtml:"border", valueScr:"border"},{name:"left", valueHtml:"border-left", valueScr:"borderLeft"},
	  {name:"top", valueHtml:"border-top", valueScr:"borderTop"}, {name:"right", valueHtml:"border-right", valueScr:"borderRight"}, {name:"bottom", valueHtml:"border-bottom", valueScr:"borderBottom"}];
	
	var BORDER_STYLE = [{"name":"dotted", "value":"dotted"}, {"name":"dashed", "value":"dashed"}, {"name":"solid", "value":"solid"}, {"name":"inset", "value":"inset"}, {"name":"outset", "value":"outset"}];
	
	var BORDER_WIDTH = [{"name":"1px", "value":"1px"}, {"name":"2px", "value":"2px"}, {"name":"3px", "value":"3px"}, {"name":"10px", "value":"10px"}, {"name":"<i>default</i>", "value":""}];
	
	var i_am = this;
	var parentDiv = document.getElementById(parentDivId);
	var toolBar = null;
	var sampleDiv = document.getElementById(sampleDivId);
	var styleViewDiv = null;
	this.formObj = document.forms[formName];
	this.fieldName = fieldName;
	this.fieldObj = null;
	
  this.fontBtn = null;
  this.fontPopup = null;
  this.sizeBtn = null;
  this.sizePopup = null;

	this.borderApplyToList = null;
	this.borderWidthList = null;
	this.borderStyleList = null;

	this.fontPaletteDiv = null;
	this.backgroundPaletteDiv = null;
	this.borderPaletteDiv = null;
	
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
		this.fontBtn = toolBar.appendButton(this.onFontFamily, false, IMAGES_FOLDER + "font.gif", "font");
		this.sizeBtn = toolBar.appendButton(this.onFontSize, false, IMAGES_FOLDER + "size.gif", "size");

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


// NOTE: 	the following is commented out temporary.
// 				It Required fitting of the toolbar for Touch UI.

/*
		// border width
		this.borderWidthList = this.createBorderWidthList(toolBar);
		// border style
		this.borderStyleList = this.createBorderStyleList(toolBar);
		// border color
		this.borderClrBtn = toolBar.appendButton(this.onBorderColor, false, IMAGES_FOLDER + "border_color.gif", "border color");
		// CSS view
		var styleViewBtn = toolBar.appendButton(this.onStyleView, true, IMAGES_FOLDER + "properties.gif", "CSS view");
*/


		// 4. set parent div width
		parentDiv.style.width = "99%"; //toolBar.getWidth();
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
	
	this.launchFontFamilyPopup = function(btnObj, callback) {
		if(this.fontPopup == null)
			this.createFontPopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.fontPopup.show(btnObj, 'left', callback, parentDlg);
		return this.fontPopup.div;
	}
	this.launchFontSizePopup = function(btnObj, callback) {
		if(this.sizePopup == null)
			this.createSizePopup();
		var parentDlg = getParentDialog(btnObj.div);
		this.sizePopup.show(btnObj, 'left', callback, parentDlg);
		return this.sizePopup.div;
	}
	this.createFontPopup = function() {
		this.fontPopup = new MyDropdownList();
		var len = FONT.length;
		for(var i = 0; i < len; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = FONT[i].value;
			itemDiv.style.fontFamily = FONT[i].name;
			itemDiv.style.fontSize = "14px";
			this.fontPopup.appendItem(itemDiv);
		}
	}
	this.createSizePopup = function() {
		this.sizePopup = new MyDropdownList();
		for(var i = 0; i < FONT_SIZE.length; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = "<NOBR><span style='font-size:" + FONT_SIZE[i].value + ";'>" + (i + 1) + "</span>"
				+ " (" + FONT_SIZE[i].name + ")</NOBR>";
			this.sizePopup.appendItem(itemDiv);
		}
		this.sizePopup.setWidth(50);
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
			  if(BORDER_WIDTH[i].value != "") {
			  innerStr = "<div style='width:99% height:0; border-style:solid; border-width:0; border-bottom-width:"
				  + BORDER_WIDTH[i].name + ";'></div>";
			  divTmp.style.paddingTop = divTmp.style.paddingBottom = 8;
      }
      else
        innerStr = BORDER_WIDTH[i].name;
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
			var style = divTmp.style;
			
			style.borderStyle = BORDER_STYLE[i].value;
			style.width = 50;
			style.height = 12;
			style.borderWidth = 2;
			style.marginTop = 2;
			  
			ddList.appendItem(divTmp);
		}
		// set current item in the list
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
/*
		// 1. font family
		if(sampleDiv.style.fontFamily == "")
			sampleDiv.style.fontFamily = FONT[0];
		// 2. font size
		if(sampleDiv.style.fontSize == "")
			sampleDiv.style.fontSize = FONT_SIZE[5];
		if(sampleDiv.style.fontSize == "12pt")
			sampleDiv.style.fontSize = FONT_SIZE[5];
		// 3. bold
		if(sampleDiv.style.fontWeight == "")
			sampleDiv.style.fontWeight = "normal";
		// 4. italic
		if(sampleDiv.style.fontStyle == "")
			sampleDiv.style.fontStyle = "normal";
		// 5. font color
		if(sampleDiv.style.color == "")
			sampleDiv.style.color = "#000000";
	*/	
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
       this.borderDesc.applyToIdx = 1; // all borders
    else if(bordersAmt == 1)
      this.borderDesc.applyToIdx = applyToIdx;
    
    // no borders
    if(applyToIdx == 0)
      return;
      
    // 2. width
    var widthName = BORDER_APPLY_TO[applyToIdx].valueScr + "Width";
    if(stl[widthName] != 'medium') // ignore default value 'medium'
      this.borderDesc.width = stl[widthName];
    
    // 3. color
    var colorName = BORDER_APPLY_TO[applyToIdx].valueScr + "Color";
    this.borderDesc.color = stl[colorName];
    
    // 4. style
    var styleName = BORDER_APPLY_TO[applyToIdx].valueScr + "Style";
    if(stl[styleName] != 'none') // ignore default value 'none'
      this.borderDesc.style = stl[styleName];
	}

	this.getStyleString = function() {
		var style = "";
		// 1. font family
		if(sampleDiv.style.fontFamily != "")
		  style += "font-family: " + sampleDiv.style.fontFamily + "; ";
		// 2. font size
		if(sampleDiv.style.fontSize != "")
		  style += "font-size: " + sampleDiv.style.fontSize + "; ";
		// 3. bold
		if(sampleDiv.style.fontWeight != "")
		  style += "font-weight: " + sampleDiv.style.fontWeight + "; ";
		// 4. italic
		if(sampleDiv.style.fontStyle != "")
		  style += "font-style: " + sampleDiv.style.fontStyle + "; ";
		// 5. font color
		if(sampleDiv.style.color != "")
		  style += "color: " + sampleDiv.style.color + "; ";
		// 6. background color
		if(sampleDiv.style.backgroundColor != "")
		  style += "background-color: " + sampleDiv.style.backgroundColor + "; ";
		// border
		var brdStl = this.getBorderStyleStr();
		if(brdStl.length != "") {
      var applyTo = BORDER_APPLY_TO[this.borderDesc.applyToIdx].valueHtml;
		  style += applyTo + ": " + brdStl + "; "
		}
		return style;
	}
  
  this.getBorderStyleStr = function() {
  	var brdStlStr = "";
  	if(this.borderDesc.applyToIdx != 0) {
	    var applyTo = BORDER_APPLY_TO[this.borderDesc.applyToIdx].valueScr;
	    
	    if(this.borderDesc.width != "")
	      brdStlStr += this.borderDesc.width;
	      
 	    if(this.borderDesc.color != "")
        brdStlStr += ((brdStlStr.length != 0) ? " " : "") + this.borderDesc.color + " ";
	    
	    if(this.borderDesc.style != "")
	      brdStlStr += ((brdStlStr.length != 0) ? " " : "") + this.borderDesc.style;
	  }
	  return brdStlStr;
  }
  
	// HANDLERS ---------------------------
	this.onFontFamily = function() {
		i_am.launchFontFamilyPopup(i_am.fontBtn, i_am.setFontFamily);
	}

	this.onFontSize = function() {
		i_am.launchFontSizePopup(i_am.fontBtn, i_am.setFontSize);
	}
	
	this.onBoldBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontWeight = "bold";
		}
		else {
			sampleDiv.style.fontWeight = "";//"normal";
		}
		i_am.putStyleStr();
	}
	
	this.onItalicBtn = function(isPressed) {
		if(isPressed) {
			sampleDiv.style.fontStyle = "italic";
		}
		else {
			sampleDiv.style.fontStyle = "";//"normal";
		}
		i_am.putStyleStr();
	}
	
	this.onFontColor = function() {
		var parentDlg = getParentDialog(i_am.fontClrBtn.div);
		PalettePopup.show(i_am.fontClrBtn, 'right', i_am.setFontColor, parentDlg, "default");
	}
	
	this.onBackgroundColor = function() {
		var parentDlg = getParentDialog(i_am.bgClrBtn.div); 
		PalettePopup.show(i_am.bgClrBtn, 'right', i_am.setBackgroundColor, parentDlg, "default");
	}
	
  // borders --
  this.onBorderApplyTo = function(applyToIdx) {
    // switch borders controls only if none ("0") involved.
    var toswitchBorderCtrls = false;
    if(i_am.borderDesc.applyToIdx == 0 || applyToIdx == 0)
      toswitchBorderCtrls = true;
      
    i_am.borderDesc.applyToIdx = applyToIdx;
    i_am._setBorders();
    
    if(toswitchBorderCtrls)
      i_am.switchBorderCtrls();
  }
  
  this.switchBorderCtrls = function() {
    applyToIdx = this.borderDesc.applyToIdx;
    if(this.borderApplyToList != null) {
	    var ctrl = this.borderApplyToList;
 	    // 1) width 2) style 3) brd clr
 	    for(var i = 0; i < 3; i++) {
	      ctrl = toolBar.getNextControlObj(ctrl);
 	      if(ctrl == null)
 	        break;
      
        if(BORDER_APPLY_TO[applyToIdx].valueScr == "")
	        ctrl.disable();
	      else
 	        ctrl.enable();
	    }
	  }
  
  }   

  // border width:
	this.onBorderWidth = function(widthIdx) {
		i_am.borderDesc.width = BORDER_WIDTH[widthIdx].value;
		i_am._setBorders();
	}
	// border style
	this.onBorderStyle = function(styleIdx) {
		i_am.borderDesc.style = BORDER_STYLE[styleIdx].value;
		i_am._setBorders();
	}
	// border color
	this.onBorderColor = function() {
		var parentDlg = getParentDialog(i_am.borderClrBtn.div); 
		PalettePopup.show(i_am.borderClrBtn, 'right', i_am.setBorderColor, parentDlg, "default");
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
	this.setFontFamily = function(idx) {
		sampleDiv.style.fontFamily = FONT[idx].value;
		i_am.centeringSampleDiv();
		i_am.putStyleStr();
	}
	this.setFontSize = function(idx) {
		sampleDiv.style.fontSize = FONT_SIZE[idx].value;
		i_am.centeringSampleDiv();
		i_am.putStyleStr();
	}

	this.setFontColor = function(colorStr) {
		sampleDiv.style.color = colorStr;
		i_am.putStyleStr();
	}
	
	this.setBackgroundColor = function(colorStr) {
	  if(colorStr.length == 0) // "no background"
	    sampleDiv.style.backgroundColor = "transparent";
	  else
	    sampleDiv.style.backgroundColor = colorStr;
		i_am.putStyleStr();
	}
	
	this.setBorderColor = function(colorStr) {
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
		if (this.formObj) {
		  var fieldObj = this.formObj[this.fieldName];
		  if(fieldObj == null) // IE
		    throw new Error("style sheet editor: missed field " + this.fieldName);
  		  
		  fieldObj.value = styleStr;
		}
	}
	
	// --------------------------------------------
	this.getMemberArrayIdx = function(array, value) {
		for(var i = 0; i < array.length; i++) {
			if(array[i].value == value)
				return i;
		}
		return null;
	}
	// constructor's body -----------------------
	this.create();
	this.switchBorderCtrls();
	this.putStyleStr();
}

// flag that menu.js was parsed
g_loadedJsFiles["style_sheet.js"] = true;