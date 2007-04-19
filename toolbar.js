/****************************************************
* FormPopup
* flag param values: 1) "NO_CANCEL" 2) "USE_SUBMIT_BTN" (instead ok)
*****************************************************/
// return parameter name is its a name in the form 
function FormPopup(innerFormHtml, flag) {
	var HIDE_ICON = "icons/hide.gif";
	var i_am = this;
	this.div = null;
	this.formDiv = null;
	this.headerDiv = null;
	this.buttonsDiv = null;
	this.callback = null;
	this.cancelCallback = null;
	this.initValues = null;
	this.is_opened = false;
	
	this.create = function(innerFormHtml, flag) {
		this.div = document.createElement('div');
		this.div.style.visibility = "hidden";
		var ua = navigator.userAgent.toLowerCase();
		var isGecko = (ua.indexOf("gecko") != -1);

		this.div.style.position = "absolute";
		this.div.style.backgroundColor = "#fff";
		this.div.style.borderStyle = "solid";
		this.div.style.borderWidth = 1;
		this.div.style.borderColor = "#999";
		this.div.style.padding = 5;

    // 1. header
    this.headerDiv = this.createHeader();
    this.div.appendChild(this.headerDiv);

		// 2. content
		this.formDiv = document.createElement('div');
		this.formDiv.innerHTML = innerFormHtml;
		this.div.appendChild(this.formDiv);

    // 3. "controll" buttons
		if(flag == "USE_SUBMIT_BTN")
		  this.useSubmitButton();
		else {
		  this.buttonsDiv = this.createButtons(flag); 
		  this.div.appendChild(this.buttonsDiv);
		}
	}
	// appends the hide icon (for now)
	this.createHeader = function() {
	  var headerDiv = document.createElement('div');
		headerDiv.align = "right";
		headerDiv.innerHTML = "<a><img src=" + HIDE_ICON + " style=\"cursor:pointer;\"></a>";
    var anchor = headerDiv.getElementsByTagName("a")[0];
    anchor.onclick = this._oncancel;
		return headerDiv;
	}
	// ok, cancel
	this.createButtons = function(flag) {
		var btnDiv = document.createElement('div');
		btnDiv.align = "center";
		btnDiv.style.paddingTop = 10;
		
		var html = 
		  '<table>'
			  + ' <tr>'
				  + ' <td>'
					  + ' <input type="button" value="Ok" style="width:70; font-family:verdana; font-size:12px" />'
				  + ' </td>';
				
				if(flag != "NO_CANCEL") { // cancel btn
				  html += ' <td>'
					    + ' <input type="button" value="Cancel" style="width:70; font-family:verdana; font-size:12px" />'
				    + ' </td>';
				}
				
			html += ' </tr>'
		'</table>';
		
		btnDiv.innerHTML = html;
		var btns = btnDiv.getElementsByTagName('input');
		btns[0].onclick = this._onok; // Ok
		if(btns[1])
		  btns[1].onclick = this._oncancel; // Cancel
		return btnDiv;
	}
	this.useSubmitButton = function() {
    // The following is commented out. - Not to hide a dialog on invalid data
    // var form = this.formDiv.getElementsByTagName("form")[0];
    // addEvent(form, "submit", this.hide, false);
	}
	this.changeContent = function(innerFormHtml) {
	  this.formDiv.innerHTML = innerFormHtml;
	}
	this.getFormDiv = function() {
	  return this.formDiv;
	}
	this.getForm = function(formIdx) {
	  formIdx = formIdx || 0;
	  var forms = this.formDiv.getElementsByTagName("form");
	  if(formIdx < forms.length)
	    return forms[formIdx];
	  return null;
	}
	
	// not required parameter cancelCallback
	this.show = function(obj, alignment, callback, parentDlg, cancelCallback) {
		this.callback       = callback;
    this.cancelCallback = cancelCallback;
    
		PopupHandler.showRelatively(obj, alignment, this.div, false, parentDlg, cancelCallback);
		
		// store init values to restore on closing
		if(this.initValues == null)
			this.initValues = this._handleControlsValue();
		// set focus on 1st input
		var input = this.formDiv.getElementsByTagName('input')[0];
		if(input) {
		  try {
		    input.focus();
		  } catch(e){};
		}
		
		 this.is_opened = true;
	}

	this._onok = function() {
		var retArr = i_am._handleControlsValue();
		var retVal = i_am.callback(retArr);
		
		// not close if callback returns false
		if(typeof retVal != 'undefined' && retVal == false)
		  return;
		
		i_am.hide();
		i_am.is_opened = false;
	}
	this._oncancel = function() {
	  if(i_am.cancelCallback) {
	    i_am.cancelCallback();
	  }
	  i_am.hide();  
	}

	this.hide = function() {
		PopupHandler.hide();
		i_am.is_opened = false;
		// restore values
		i_am._handleControlsValue(i_am.initValues);
	}
	this.isOpened = function() {
	  return this.is_opened;
	}
	// get or set values of the controls
	// uses attribute - name.
	this._handleControlsValue = function(setArr) {
		var getArr;
		var toGet = false;
		if(typeof setArr == 'undefined') {
			toGet = true;
			getArr = new Array();	
		}
		
		var inpCol = i_am.formDiv.getElementsByTagName("input");
		// inputs - only "text" realized
		for(var i = 0; i < inpCol.length; i++) {
			var inp = inpCol[i];
			var type = inp.getAttribute("type");
			var name = inp.getAttribute("name");
			if(type == "text" || type == "hidden") {
				if(toGet)
					getArr[name] = inp.value;
				else
					inp.value = setArr[name];
			}
		}
		// selects; returns text value
		var selectCol = i_am.formDiv.getElementsByTagName("select");
		for(i = 0; i < selectCol.length; i++) {
			var select = selectCol[i];
			var options = select.options;
			var name = select.getAttribute("name");
				if(toGet)
					getArr[name] = options[select.selectedIndex].value;
				else {
					for(var i = 0; i < options.length; i++)
						if(options[i].value == setArr[name])
							options[i].selected = true;		
				}
		}
	
		if(toGet)
			return getArr;
	}
	// constructor ---
	flag = flag || "";
	this.create(innerFormHtml, flag);
}


// "base class" of controls like ToolbarButton and DropdownList
function CtrlBase() {
  CtrlBase.prototype.changeOpacity = function(obj, level) {
	  try {
		  if(typeof obj.style.MozOpacity != 'undefined')
			  obj.style.MozOpacity = level;
		  else
			  obj.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(opacity=' + level + ')';
	  }
	  catch(e){}
  }
}
/****************************************************
* ToolbarButton class
* callback: for overflowed case a button without a submenu should return false. 
*****************************************************/
ToolbarButton.prototype = new CtrlBase();
function ToolbarButton(index, callback, isToggle, icon, iconWidth, left, top, toolbar, title, titlePressed)
{
  var i_am = this;
	this.div = null;
	
	this.index = index;
	this.callback = callback;
	this.isToggle = isToggle;
	this.icon = icon;
	this.toolbar = toolbar;
	this.title = title;
	this.titlePressed = null;
	
	this.left = left;
	this.top = top;
	this.width = null;
	this.height = null;

	this.isPressed = false;
	this.isDisabled = false;
	
	this.isOverflowed = false;
	
	this.create = function(iconWidth) { // create Button
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.left = this.left;
		this.div.style.top = this.top;
		this.div.style.backgroundColor = "buttonface";
		this.div.style.padding = this.toolbar.BTN_PADDING;
		this.div.style.cursor = "pointer";
		this.div.style.borderWidth = "1px";
		this.div.style.borderStyle = "solid";
		this.div.title = this.title;
		
		var innerHTML = '<img src = "' + icon + '" border="0"'
			+' width=' + iconWidth + ' height=' + this.toolbar.iconHeight + '>';
		
		this.div.innerHTML = innerHTML;
		// register of handlers
		this.div.onmouseover = this.onMouseOver;
		this.div.onmouseout = this.onMouseOut;
		this.div.onmousedown = this.onMouseDown;
		this.div.onmouseup = this.onMouseUp;

		this.width = iconWidth + 2 * this.toolbar.BTN_PADDING;
		this.height = this.toolbar.iconHeight + 2 * this.toolbar.BTN_PADDING;
	}
	
	this.enable = function() {
		this.changeOpacity(this.div, 1.0);
		this.isDisabled = false; 
	}
	
	this.disable = function() {
		this.changeOpacity(this.div, 0.3);
		this.isDisabled = true;  
	}
	// mouse handlers ---------------	
	this.onMouseOver = function() {
		if(i_am.isDisabled) return;
		if(i_am.isPressed)  return;
		
		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "ButtonHighlight";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "ButtonShadow";
	}
	
	this.onMouseOut = function() {
		if(i_am.isDisabled) return;
		if(i_am.isPressed)  return;
		
		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "buttonface";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "buttonface";
	}	
	
	this.onMouseDown = function() {
		if(i_am.isDisabled)
			return;

		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "ButtonShadow";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "ButtonHighlight";
		if(i_am.isToggle) {
			i_am.isPressed = !i_am.isPressed;
			if(i_am.isPressed) {
				i_am.div.style.backgroundColor = "buttonhighlight";
				if(i_am.titlePressed != null)
					i_am.div.title = i_am.titlePressed;
			}
			else {
				i_am.div.style.backgroundColor = "buttonface";
				i_am.onMouseOut();
				if(i_am.titlePressed != null)
					i_am.div.title = i_am.title;
			}
			i_am.callback(i_am.isPressed);
		}
		else
			i_am.div.style.backgroundColor = "buttonhighlight";
	}	
	
	this.onMouseUp = function(e) {
		if(i_am.isDisabled) return;
		if(i_am.isToggle)	return;
		
		i_am.div.style.backgroundColor = "buttonface";
		i_am.onMouseOut();
		
		// closePopup used only in the overflow pupup
		// for a buttons that do not call a (sub)popup
		var closePopup = i_am.callback(i_am.isPressed);
		if(i_am.isOverflowed && closePopup)
			PopupHandler.hide();
		
	}

	// press toggle button without callback execution.
	// used for GUI initialization	
	this.pressToggleButton = function() {
		this.isPressed = true; //!i_am.isPressed;
		this.div.style.borderLeftColor = i_am.div.style.borderTopColor = "ButtonShadow";
		this.div.style.borderRightColor = i_am.div.style.borderBottomColor = "ButtonHighlight";
		this.div.style.backgroundColor = "buttonhighlight";
	}

	// constructor's body
	this.create(iconWidth);
	this.onMouseOut(); // draw "invisible" borders 
	if(typeof titlePressed != 'undefined')
		this.titlePressed = titlePressed;	
}
/*********************************************
* PALETTE gloabal object
**********************************************/
var PalettePopup = {
	div : null,
	noClrCell : null,
	callback : null,
	hotspotIdx : -1, // index of control calling the palette (-1 on hidden palette)
	chosenDiv : null, // highlights last chosen color
	CHOSEN_DIV_ID : "chosen_div_id",
	
	//show
	// noColorTitle is a text to show in noClrCell
	show : function(hotspot, alignment, callback, parentDlg, noColorTitle, chosenClr) {
		if(this.div == null)
			this.create();
 
    // close the palette on calling of the same control.
    if(this.hotspotIdx == hotspot.index && this.div.style.visibility == "visible" ) {
      PopupHandler.hide(false);
      this.hotspotIdx = -1;
      return;
    }
    
    this.hotspotIdx = hotspot.index;
    
    // 1. show or hide no color cell
		if(typeof noColorTitle != 'undefined' && noColorTitle != null) {
		  this.noClrCell.innerHTML = noColorTitle;
		  this.noClrCell.style.display = "";
		}
		else
 		  this.noClrCell.style.display = "none";

    // 2. highlight last chosen color
    this.setChosenColor(chosenClr);
    
    // 3. launch
		this.callback = callback;
  	PopupHandler.showRelatively(hotspot, alignment, this.div, true, parentDlg);
	},
	create : function() {
		this.div = document.createElement('div');
		var divStyle = this.div.style
		divStyle.visibility = "hidden";
		divStyle.position = "absolute";
		divStyle.backgroundColor = "#fff";
		divStyle.borderStyle = "solid";
		divStyle.borderWidth = 1;
		divStyle.borderColor = "#999";
		divStyle.padding = 1;

		this.div.innerHTML = this.getPaletteStr();
		this.noClrCell = getChildById(this.div, "noClr");
		
		this.chosenDiv = document.createElement('div');
		this.chosenDiv.id = this.CHOSEN_DIV_ID;
		var chDivStyle = this.chosenDiv.style;
		chDivStyle.width  = 17;
		chDivStyle.height = 17;
		chDivStyle.borderWidth = "1px";
		chDivStyle.borderStyle = "dashed";
	},
	
	setChosenColor : function(chosenClr) {
    if(typeof chosenClr == 'undefined' || chosenClr == null) {
      this.chosenDiv.style.display = "none";
      return;
    }

    var chosenClr_LC = chosenClr.toLowerCase();
	  cells = this.div.getElementsByTagName("td");
	  for(var i = 0; i < cells.length; i++) {
	    var bgClr = cells[i].getAttribute("bgcolor");
	    
	    if(bgClr == chosenClr || bgClr == chosenClr_LC) {
	      // 1. detect brightness of the cell
	      if(bgClr.indexOf("#") == 0)
	        bgClr = bgClr.substr(1);
	      
	      bgClrInt = parseInt(bgClr , 16);
	      var r = (bgClrInt >> 16) & 0xff;
        var g = (bgClrInt >> 8 ) & 0xff;
        var b = (bgClrInt      ) & 0xff;
	      
	      var brightness = r + g + b; // max - 765
	      // 2. set border color
	      if(brightness > 475)
	        this.chosenDiv.style.borderColor = "#000";
	      else
	        this.chosenDiv.style.borderColor = "#fff";
	        
	      // 3. append chosenDiv
	      cells[i].appendChild(this.chosenDiv);
 	      this.chosenDiv.style.display = "block";
	    }
	  }
	},
	_onmouseover : function(obj) {
		obj.style.cursor = 'pointer';
	},
	_onclick : function(color) {
		PopupHandler.hide();
		PalettePopup.callback(color);
	},
	getPaletteStr : function() {
		var palette =
			'<table cellpadding="0" cellspacing="1" border="0">' + '<tr>'
			+ '	<td bgcolor="#FFFFFF" onclick="PalettePopup._onclick(\'#FFFFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCCCC" onclick="PalettePopup._onclick(\'#FFCCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCC99" onclick="PalettePopup._onclick(\'#FFCC99\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFFF99" onclick="PalettePopup._onclick(\'#FFFF99\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFFFCC" onclick="PalettePopup._onclick(\'#FFFFCC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#99FF99" onclick="PalettePopup._onclick(\'#99FF99\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#99FFFF" onclick="PalettePopup._onclick(\'#99FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CCFFFF" onclick="PalettePopup._onclick(\'#CCFFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CCCCFF" onclick="PalettePopup._onclick(\'#CCCCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCCFF" onclick="PalettePopup._onclick(\'#FFCCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></div></td>'
			+ '</tr>'                                                                                                                     
			+ '<tr>'                                                                                                                      
			+ '	<td bgcolor="#CCCCCC" onclick="PalettePopup._onclick(\'#CCCCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF6666" onclick="PalettePopup._onclick(\'#FF6666\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF9966" onclick="PalettePopup._onclick(\'#FF9966\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFFF66" onclick="PalettePopup._onclick(\'#FFFF66\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFFF33" onclick="PalettePopup._onclick(\'#FFFF33\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#66FF99" onclick="PalettePopup._onclick(\'#66FF99\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#33FFFF" onclick="PalettePopup._onclick(\'#33FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#66FFFF" onclick="PalettePopup._onclick(\'#66FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#9999FF" onclick="PalettePopup._onclick(\'#9999FF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF99FF" onclick="PalettePopup._onclick(\'#FF99FF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#C0C0C0" onclick="PalettePopup._onclick(\'#C0C0C0\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF0000" onclick="PalettePopup._onclick(\'#FF0000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF9900" onclick="PalettePopup._onclick(\'#FF9900\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCC66" onclick="PalettePopup._onclick(\'#FFCC66\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFFF00" onclick="PalettePopup._onclick(\'#FFFF00\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#33FF33" onclick="PalettePopup._onclick(\'#33FF33\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#66CCCC" onclick="PalettePopup._onclick(\'#66CCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#33CCFF" onclick="PalettePopup._onclick(\'#33CCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#6666CC" onclick="PalettePopup._onclick(\'#6666CC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CC66CC" onclick="PalettePopup._onclick(\'#CC66CC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#999999" onclick="PalettePopup._onclick(\'#999999\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CC0000" onclick="PalettePopup._onclick(\'#CC0000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FF6600" onclick="PalettePopup._onclick(\'#FF6600\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCC33" onclick="PalettePopup._onclick(\'#FFCC33\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#FFCC00" onclick="PalettePopup._onclick(\'#FFCC00\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#33CC00" onclick="PalettePopup._onclick(\'#33CC00\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#00CCCC" onclick="PalettePopup._onclick(\'#00CCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#3366FF" onclick="PalettePopup._onclick(\'#3366FF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#6633FF" onclick="PalettePopup._onclick(\'#6633FF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CC33CC" onclick="PalettePopup._onclick(\'#CC33CC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#666666" onclick="PalettePopup._onclick(\'#666666\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#990000" onclick="PalettePopup._onclick(\'#990000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CC6600" onclick="PalettePopup._onclick(\'#CC6600\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#CC9933" onclick="PalettePopup._onclick(\'#CC9933\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#999900" onclick="PalettePopup._onclick(\'#999900\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#009900" onclick="PalettePopup._onclick(\'#009900\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#339999" onclick="PalettePopup._onclick(\'#339999\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#3333FF" onclick="PalettePopup._onclick(\'#3333FF\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#6600CC" onclick="PalettePopup._onclick(\'#6600CC\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#993399" onclick="PalettePopup._onclick(\'#993399\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#333333" onclick="PalettePopup._onclick(\'#333333\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#660000" onclick="PalettePopup._onclick(\'#660000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#993300" onclick="PalettePopup._onclick(\'#993300\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#996633" onclick="PalettePopup._onclick(\'#996633\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#666600" onclick="PalettePopup._onclick(\'#666600\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#006600" onclick="PalettePopup._onclick(\'#006600\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#336666" onclick="PalettePopup._onclick(\'#336666\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#000099" onclick="PalettePopup._onclick(\'#000099\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#333399" onclick="PalettePopup._onclick(\'#333399\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#663366" onclick="PalettePopup._onclick(\'#663366\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#000000" onclick="PalettePopup._onclick(\'#000000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#330000" onclick="PalettePopup._onclick(\'#330000\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#663300" onclick="PalettePopup._onclick(\'#663300\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#663333" onclick="PalettePopup._onclick(\'#663333\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#333300" onclick="PalettePopup._onclick(\'#333300\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#003300" onclick="PalettePopup._onclick(\'#003300\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#003333" onclick="PalettePopup._onclick(\'#003333\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#000066" onclick="PalettePopup._onclick(\'#000066\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#330099" onclick="PalettePopup._onclick(\'#330099\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '	<td bgcolor="#330033" onclick="PalettePopup._onclick(\'#330033\');" onmouseover="PalettePopup._onmouseover(this);" width="17" height="17"></td>'
			+ '</tr>'
			// no color row - empty string returns
			+ '</tr>'
			+ '<tr>'
			+ '<td id="noClr" colspan="10" onclick="PalettePopup._onclick(\'\');" onmouseover="PalettePopup._onmouseover(this);" align="center"style="font-size:11px; font-name:arial;"></td>';
			+ '</tr>';
			
			+ '</table>';
		return palette;
	}
}

/****************************************************
*	ListItem class
*	parent is the List
*****************************************************/
function ListItem(index, innerDiv, parent, noHighlight) 
{
	var HIGHLIGHTED_BACKGROUND = "#e0e0e0";
	var MARGIN = 2;
	var i_am = this;
	this.index = index;
	this.innerDiv = innerDiv;
	this.parent = parent;
	this.liObj = null;

	this.create = function() {
		// 1. create
		this.liObj = document.createElement('td');
		this.liObj.style.cursor = "pointer";

		this.liObj.style.backgroundColor = this.parent.LIST_BACKGROUND;
		
		// 2. set handlers
		this.liObj.onmouseover = this.onMouseOver;
		this.liObj.onmouseout = this.onMouseOut;
		this.liObj.onmouseup = this.onMouseUp;

		// 3. append
		this.liObj.appendChild(innerDiv);
		this.parent.curRow.appendChild(this.liObj);
	}
	
	this.getInnerDiv = function() {
		return this.innerDiv;
	}
	this.changeContent = function(html) {
	  this.innerDiv.innerHTML = html;
	}
	
	// mouse handlers
	this.onMouseOver = function() {
		i_am.liObj.style.backgroundColor = HIGHLIGHTED_BACKGROUND;
	}
	this.onMouseOut = function() {
		i_am.liObj.style.backgroundColor = i_am.parent.LIST_BACKGROUND;
	}
	this.onMouseUp = function(e) {
		i_am.liObj.style.backgroundColor = i_am.parent.LIST_BACKGROUND;
		i_am.parent.onItemSelection(i_am.index);
	}

	// constructor's body
	this.create();
}

/*****************************************************
* List - (without a field in a toolbar)
* use it as a popup.
******************************************************/
// width - needs for dropdown list
// default parameters: colAmt: 1;
function List(colAmt) {
	var FONT_FAMILY = "verdana";
	var FONT_SIZE = "12px";
	this.LIST_BACKGROUND = "#ffffff";
	var LIST_BORDER_COLOR = "#999";

	this.div = null;
	this.table = null;
	this.tablebody = null;
	this.curRow = null;
	
	this.colAmt = colAmt || 1;
	this.itemsArr = null;

	this.create = function(parentElt) {
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.visibility = "hidden";

		this.div.style.backgroundColor = this.LIST_BACKGROUND;
		this.div.style.borderStyle = "solid";
		this.div.style.borderWidth = 1;
		this.div.style.borderColor = LIST_BORDER_COLOR;
		this.div.style.overflow = "visible";
		
		this.table = document.createElement('table');
		this.table.style.fontFamily = FONT_FAMILY;
		this.table.style.fontSize = FONT_SIZE;
		//	this.table.cellPadding = 10;	//	this.table.cellSpacing = 0; 
		this.tablebody = document.createElement("tbody");
		this.table.appendChild(this.tablebody);
		
		
		this.div.onmouseup = function(e) {e = e || event; e.cancelBubble = true;}
		
		
		this.div.appendChild(this.table);
	}
	this.show = function(hotspot, alignment, callback, parentDlg) {
		this.callback = callback;
    if(this.div.style.visibility == "visible") {
      PopupHandler.hide(false);
      return;
    }
		PopupHandler.showRelatively(hotspot, alignment, this.div, true, parentDlg);
	}
	this.hide = function() {
	  PopupHandler.hide();
	}	
	this.appendItem = function(innerDiv) {
		if(this.itemsArr == null)
			this.itemsArr = new Array();
		
		innerDiv.style.position = "static";
		var idx = this.itemsArr.length;
		if(this.isFirstRowItem(idx)) {
			this.curRow = document.createElement("tr");
			this.tablebody.appendChild(this.curRow);
		}
		this.itemsArr[idx] = new ListItem(idx, innerDiv, this);
	}
	this.changeItemContent = function(idx, html) {
	  this.itemsArr[idx].changeContent(html);
	}
	
	// needs for dropdown menu
	this.setWidth = function(width) {
		this.table.width = width;
	}
	// for multycolumn list
	this.isMultyColumn = function(idx) {
		if(this.colAmt > 1)
			return true;
		else
			return false;
	}
	this.isFirstRowItem = function(idx) { 
		if(this.colAmt > 1) { 
			if(idx % this.colAmt == 0)
				return true;
			else
				return false;	
		}
		return true;
	}

	// onItemSelection
	this.onItemSelection = function(itemIdx) {
		if(this.callback != null) {
			this.callback(itemIdx);
			this.hide(); // PopupHandler.hide();
		}
	}
	this.getItemObject = function(idx) {
		return this.itemsArr[idx];
	}
	this.getSelectedItem = function(idx) {
		return this.selectedItemIdx;
	}
	
	// list's "constructor" --
	this.create();
}

/****************************************************
*	DropdownList class
* current realization: 
* the dropdown list contains a unique list objet
* probably better to make tha list global, so to share it.
*****************************************************/
DropdownList.prototype = new CtrlBase();
function DropdownList(index, callback, left, top, fieldWidth, title, toolbarIn) {
	var FONT_FAMILY = "verdana";
	var FONT_SIZE = "12px";
	var IMAGES_FOLDER = "images/wysiwyg/";
	var FIELD_HEIGHT = 27;
	var ARROW_BUTTON_WIDTH = 20;
	var ARROW_BUTTON_HEIGHT = 20;

	var i_am = this;
	this.index = index; // index in the parent toolbar
	this.callback = callback;
	this.left = left;
	this.top = top;
	this.fieldWidth = fieldWidth; // equals to the list width
	this.title = title;
	this.toolbar = toolbarIn;
	this.width = null; // fieldWidth + ARROW_BUTTON_WIDTH
	this.height = null;
	
	this.div = null;
	this.itemCloneObj = null;
	
	this.buttonDiv = null;
	this.btnImg = null;
	
	this.listDiv = null;
	this.listObj = null;
	
	this.selectedItemIdx = 0;
	
	this.isOverflowed = false;
	
	this.isDisabled = false;
	
	// create -----------------
	this.create = function() {
		// 1. create the list
		var listTop = this.top + FIELD_HEIGHT + 1;
		this.list = new List();

		// 2. field - shows selected item
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.left = this.left;
		this.div.style.top = this.top;
		this.div.style.width = this.fieldWidth;
		this.div.style.height = FIELD_HEIGHT;
		this.div.style.fontFamily = FONT_FAMILY;
		this.div.style.fontSize = FONT_SIZE;
		this.div.style.paddingLeft = this.div.style.paddingRight = 4;
		this.div.style.paddingTop = this.div.style.paddingBottom = 3;
		this.div.style.backgroundColor = this.list.LIST_BACKGROUND;
		this.div.style.borderWidth = "1px";
		this.div.style.borderStyle = "solid";
		this.div.style.overflow = "visible";
		this.div.title = this.title;
		this.toolbar.div.appendChild(this.div);
		
		this.fieldWidth = this.div.clientWidth; // get real size of the field; for FF
		this.list.setWidth(this.fieldWidth);

		if(this.div.clientHeight != FIELD_HEIGHT)
			this.div.style.height = 2*FIELD_HEIGHT - this.div.clientHeight;
		
		// 3. button to open list
		// 3.1 create button & button image
		this.buttonDiv = document.createElement('div');
		this.buttonDiv.style.position = "absolute";
		this.buttonDiv.style.left = this.left + this.fieldWidth + 3;
		this.buttonDiv.style.top = this.top + (FIELD_HEIGHT - ARROW_BUTTON_HEIGHT)/2;
				
		this.btnImg = document.createElement('IMG');
		this.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
		this.btnImg.style.cursor = "pointer"
		
		this.btnImg.width = ARROW_BUTTON_WIDTH;
		this.btnImg.height = ARROW_BUTTON_HEIGHT;
		
		// 3.2 set arrow button handlers
		this.buttonDiv.onmouseover = this.onMouseOverBtn;
		this.buttonDiv.onmouseout = this.onMouseOutBtn;
		this.buttonDiv.onmousedown = this.onMouseDownBtn;
		this.buttonDiv.onmouseup = this.onMouseUpBtn
		// 3.3 append the arrow button 
		this.buttonDiv.appendChild(this.btnImg);
		this.toolbar.div.appendChild(this.buttonDiv);
		
		// 4.4
		this.width = this.fieldWidth + ARROW_BUTTON_WIDTH;
		this.height = this.div.clientHeight;
	}
	
	this.appendItem = function(itemDiv) {
		this.list.appendItem(itemDiv);
	}
	this.getItemObject = function(idx) {
		return this.list.getItemObject(idx);
	}
	this.getSelectedItem = function(idx) {
		return this.list.getItemObject(idx);
	}
	this.setSelectedItem = function(itemIdx) {
		i_am.selectedItemIdx = itemIdx;
	
		if(i_am.itemCloneObj != null)
			i_am.div.removeChild(i_am.itemCloneObj);
			
		i_am.itemCloneObj = i_am.getItemObject(itemIdx).getInnerDiv().cloneNode(true);
		i_am.div.appendChild(i_am.itemCloneObj);
		i_am.callback(itemIdx);
	}
	
	this.enable = function() {
		this.changeOpacity(this.div, 1.0);
		this.changeOpacity(this.buttonDiv, 1.0);
		this.isDisabled = false; 
	}
	
	this.disable = function() {
		this.changeOpacity(this.div, 0.3);
		this.changeOpacity(this.buttonDiv, 0.3);
		this.isDisabled = true;  
	}

	// arrow button handlers
	this.onMouseOverBtn = function() {
	  if(i_am.isDisabled)
	    return;
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button_over.gif";
	}
	this.onMouseOutBtn = function() {
		  if(i_am.isDisabled)
	    return;
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
	}
	this.onMouseDownBtn = function() {
	  if(i_am.isDisabled)
	    return;
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button_pressed.gif";
	}
	this.onMouseUpBtn = function() {
	  if(i_am.isDisabled)
	    return;
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
		var top = i_am.top + i_am.div.clientHeight + 1;
		
		var parentDlg = getAncestorById(i_am.div, 'pane2'); // hack: detects if it's in a 'pane2' dialog 
		i_am.list.show(i_am, 'left', i_am.setSelectedItem, parentDlg);
	}
	// constructor's body
	this.create();
}

/***************************************************
*	Titlestrip class
****************************************************/
function Titlestrip(parentDiv, toolbar)
{
	var HEIGHT = 25;
	var TOP_PADDING = 7;
	
	var FONT_FAMILY = "verdana";
	var FONT_SIZE = "12px";
	this.parentDiv = parentDiv;
	this.toolbar = toolbar;
	this.div = null;
	this.height = 0;
	
	this.create = function() {
		// 1. create div
		this.div = document.createElement('div');
		this.div.style.visibility = "hidden"; // make it visible only on title adding
		this.div.style.position = "absolute";
		this.div.style.left = 0;
		this.div.style.top = 0;
		this.div.style.width = "100%";
		this.div.style.height = HEIGHT;
		this.div.style.backgroundColor = "buttonface";
		this.div.style.borderWidth = 0;
		// 2. append to parent
		this.parentDiv.appendChild(this.div);
		
		// get "real" height
		this.height = this.div.clientHeight;
	}
	this.appendTitle = function(left, text) {
		var titleDivTmp = document.createElement('div');
		titleDivTmp.style.position = "absolute";
		titleDivTmp.style.left = left;
		titleDivTmp.style.top = TOP_PADDING;
		titleDivTmp.style.backgroundColor = "buttonface";
		titleDivTmp.style.fontFamily = FONT_FAMILY;
		titleDivTmp.style.fontSize = FONT_SIZE;
		titleDivTmp.innerHTML = text;
		this.div.appendChild(titleDivTmp);
		this.div.style.visibility = "visible";
		this.toolbar.onTitleVisible();
	}
	this.resize = function(width) {
		this.div.style.width = width;
	}
	this.isVisible = function() {
		if(this.div.style.visibility == "visible")
			return true;
		else
			return false;
	}
	
	// constructor's body
	this.create();
}

/****************************************************
*	Toolbar class
*****************************************************/
function Toolbar(parentDiv, masterObj, iconHeight, noOverflow)
{
	var LEFT_PADDING = 10; // pix
	var RIGHT_PADDING = 10;
	var TOP_PADDING = 4;
	var BOTTOM_PADDING = 5;
	this.BTN_PADDING = 2;
	var BTN_GAP = 4
	
	var i_am = this;
	this.parentDiv = parentDiv;
	this.masterObj = masterObj;
	this.iconHeight = iconHeight;
	this.noOverflow = noOverflow;
	this.controlsArr = new Array();
	this.div = null;
	this.titlestrip = null;

	var lastBtnEdge = 0;
	
	this.width = 0;
	this.height = 0;
	
	// "overflow" --
	var OVF_ICON_WIDTH = 10;
	var OVF_POPUP_COL = 4;
	var OVF_BTN_TITLE = "more options";
	this.overflowBtn = null;
	this.overflowPopup = null;
	

	this.create = function() {
		// 1. create title bar
		this.titlestrip = new Titlestrip(this.parentDiv, this);
		// 2. create, namely, toolbar
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.left = 0;
		this.div.style.top = 0;
		this.div.style.width = this.width;
		this.div.style.height = this.height;
		this.div.style.backgroundColor = "buttonface";
		this.div.style.borderWidth = 0;

		this.parentDiv.appendChild(this.div);
	}
	// DropdownList is not support the overflow for now!
	this.appendDropdownList = function(fieldWidth, title, callback) {
		var idx = this.controlsArr.length;
		var left = (idx > 0) ? lastBtnEdge + BTN_GAP : LEFT_PADDING;
		this.controlsArr[idx] = new DropdownList(idx, callback, left, TOP_PADDING, fieldWidth, title, this);
		this.titlestrip.appendTitle(left, title);
		
		this.resize(this.controlsArr[idx]);
		
		return this.controlsArr[idx];
	}
	// optional parameters:
	// 1)titlePressed is for toggle button 2)iconWidth for icons with width != height
	this.appendButton = function(callback, isToggle, icon, title, titlePressed, iconWidth) {
		var idx = this.controlsArr.length;
		var left = (idx > 0) ? lastBtnEdge + BTN_GAP : LEFT_PADDING;
		var top = 0;
		
		iconWidth = iconWidth || this.iconHeight;
		this.controlsArr[idx] = new ToolbarButton(idx, callback, isToggle, icon, iconWidth, left, TOP_PADDING, this, title, titlePressed);

		// insert a button
		if(this.isOverflow(this.controlsArr[idx])) {
			if(this.overflowPopup == null)
				this.prepareToOverflow();
			this.overflowPopup.appendItem(this.controlsArr[idx].div);
			this.controlsArr[idx].isOverflowed = true;
		}
		else {
			this.div.appendChild(this.controlsArr[idx].div);
			this.resize(this.controlsArr[idx]);
		}
		return this.controlsArr[idx];
	}
	
	// resize toolbar according to new appended button
	this.resize = function(obj){ //idx
		//obj = this.controlsArr[idx];
		var newHeight = obj.height + (TOP_PADDING + BOTTOM_PADDING);
		if(this.height < newHeight)
			this.height = newHeight
					
		if(this.controlsArr.length == 1)
			this.width = LEFT_PADDING + obj.width + RIGHT_PADDING;
		else
			this.width += BTN_GAP + obj.width;	

		lastBtnEdge = this.width - RIGHT_PADDING;
						
		this.div.style.width = this.width;
		this.div.style.height = this.height;
		
		this.titlestrip.resize(this.width); // resize titlestrip
	}
	
	this.getControlObj = function(idx) {
		return this.controlsArr[idx];
	}
	this.getNextControlObj = function(obj) {
	  var idx = obj.index + 1;
	  if(typeof this.controlsArr[idx] != 'undefined')
		  return this.controlsArr[idx];
    return null;
	}
	this.getPrevControlObj = function(obj) {
	  var idx = obj.index - 1;
	  if(typeof this.controlsArr[idx] != 'undefined')
		  return this.controlsArr[idx];
    return null;
	}
	this.getWidth = function() {
		return this.width;
	}
	
	this.getHeight = function() {
		if(this.titlestrip.isVisible())
			return (this.height + this.titlestrip.height);
		else
			return this.height;
	}
	this.show = function() {
		this.div.style.visibility = "visible";
		//this.titlestrip.show();
	}
	this.hide = function() {
		this.div.style.visibility = "hidden";
		//this.titlestrip.hide();
	}
	this.onTitleVisible = function() {
		this.div.style.top = this.titlestrip.height;
	}
	
	this.enableAllControls = function() {
		for(var i = 0; i < this.controlsArr.length; i++)
			this.controlsArr[i].enable();
	}
	this.disableAllControls = function(excludeCtrl) {
		var exclIdx = -1;
		if(typeof excludeCtrl != 'undefined')
			exclIdx = excludeCtrl.index;
			
		for(var i = 0; i < this.controlsArr.length; i++)
			if(i != exclIdx)
				this.controlsArr[i].disable();
	}
	
		// "overflow" popup ----------------
	this.isOverflow = function(obj) {
		if(this.noOverflow)
			return false;
		if(this.overflowPopup != null)
			return true;
		if(this.parentDiv.offsetWidth == 0)
			return;
		// new toolbar width including new object (btn) and the overflow button
		var newTbWidth = lastBtnEdge + BTN_GAP + obj.width + BTN_GAP
			 + OVF_ICON_WIDTH + this.BTN_PADDING * 2 + RIGHT_PADDING;
		if(this.parentDiv.offsetWidth <= newTbWidth)
			return true;
		
		return false;
	}
	
	this.prepareToOverflow = function() {
		var idx = this.controlsArr.length;
		var left = lastBtnEdge + BTN_GAP;
		var icon = "images/wysiwyg/overflow.gif";
		// 1. create overflow button
		this.overflowBtn = new ToolbarButton(idx, this.showOverflowPopup, false, icon, OVF_ICON_WIDTH, left, TOP_PADDING, this, OVF_BTN_TITLE);
		this.div.appendChild(this.overflowBtn.div);
		this.resize(this.overflowBtn);
		// 2. create overflow list
		this.overflowPopup = new List(OVF_POPUP_COL);
	}
	
	this.showOverflowPopup = function(){
		// hack: detects if it's in a 'pane2' dialog 
		var parentDlg = getAncestorById(this.div, 'pane2');
		
		// "onOverflowBtn" - is an interface function
		if(typeof i_am.masterObj.onOverflowBtn != 'undefined')
			i_am.masterObj.onOverflowBtn();

		if(i_am.overflowPopup.div.parentNode != document.body)
			document.body.appendChild(i_am.overflowPopup.div);
		
		i_am.overflowPopup.show(i_am.overflowBtn, "right", null, parentDlg, false);
	}
	// END "overflow" --------

	
	// Toolbar constructor's body
	this.create();
}

/*****************************************
* PopupHandler
*****************************************/
var PopupHandler = {
	CLOSE_TIMEOUT : 500,
	popupDiv : null,
	parentDlg : null,
	oldOnKeyUp : null,
	oldOnClick : null,
	timerid  : 0,
	firstClick : true, // prevents a closing from button's onmouseup 
	
	isAutoHide : true,
	onHideCallback : null,
	
	// FF: use fixed position to overcome lack of caret in input fields.
	isGecko : null,
	x : 0,
	y : 0,
	oldOnScroll : null,

	overflowPopup : null,
	
	// div is a popup
	// alignment: left, center, right, inside
	// hotspot is a control object
	// onHideCallback - not required
	showRelatively : function(hotspot, alignment, div, autohide, parentDlg, onHideCallback) {
		var OFFSET_Y = 2;
		if(this.isGecko == null) {
		  var ua = navigator.userAgent.toLowerCase();
      this.isGecko = (ua.indexOf("gecko") != -1);
		}
		// only 1 popup can be opened concurrently, except the overflow popup
		if(this.popupDiv != null)
			this.hide(typeof hotspot.isOverflowed != 'undefined' && hotspot.isOverflowed);
		// above the overflow popup
		if(this.overflowPopup != null) { 
			div.style.zIndex = this.overflowPopup.style.zIndex + 1; 
		}
		// set popup's parentDlg
		if(parentDlg != null)
			parentDlg.appendChild(div);
		else // if(div.parentNode.id != 'body')
			document.body.appendChild(div);
		
		var relObj = hotspot.div || hotspot.obj || hotspot;
    
    var pos;
    if(this.isGecko)		
		  pos = this.findObjectPositio(relObj, document.body);
		else
  	  pos = this.findObjectPositio(relObj, parentDlg);

    // 1. inside ("hotspot" - here "container)
    if(alignment == 'inside') {
      var xDelta = Math.max((relObj.clientWidth - div.clientWidth) / 2, 0);
      this.x = pos.left + xDelta;
      
      var yDelta = Math.max((relObj.clientHeight - div.clientHeight) / 2, 0);
      this.y = pos.top + yDelta;
    }
    // 2. left
		else if(alignment == 'left')
			this.x = pos.left;
		// 3. center 	 
		else if(alignment == 'center') 
			this.x = pos.left - (div.clientWidth - hotspot.width) / 2;
		// 4. right
		else                           
			this.x = pos.left - (div.clientWidth - hotspot.width);
		
		if(alignment != 'inside')
		  this.y = pos.top + hotspot.height + OFFSET_Y;
		
		// check if to open popup above a hotspot. (take in account a scrolling)
		var screenHeight = getWindowSize()[1];
		if(screenHeight < this.y - getScrollXY()[1] + div.clientHeight)
			this.y = pos.top - div.clientHeight - OFFSET_Y;
		
		if(this.isGecko) {
			div.style.position = 'fixed';
			var scrl = getScrollXY();
			div.style.left = this.x - scrl[0];
			div.style.top = this.y - scrl[1];
		}
    else {
		  div.style.left = this.x;
		  div.style.top = this.y;
		}

		// set new div  data
		this.popupDiv = div;
		this.parentDlg = parentDlg;
		this.onHideCallback = onHideCallback;
		// make visible
		this._show(autohide);
	},
	_show : function(autohide) {
		if(typeof autohide == 'undefined' || autohide) 
			this.isAutoHide = true;
		else
			this.isAutoHide = false;
		this.setHandlers();
		
		this.firstClick = true;
		this.popupDiv.style.visibility = "visible";	
	},
	// not to hide the overflow popup
	hide : function(isOverflowed) {
		if(this.popupDiv == null)
			return;
			
		if(isOverflowed && this.overflowPopup == null) {
				this.overflowPopup = this.popupDiv;
		}
		else {
			this.popupDiv.style.visibility = "hidden";
  		document.body.appendChild(this.popupDiv);
			if(this.overflowPopup != null) {
				this.overflowPopup.style.visibility = "hidden";
	  		document.body.appendChild(this.overflowPopup);
				this.overflowPopup = null;
			}
		}
		this.resetHandlers();
	},
	suspendedHide : function() {
		clearInterval(PopupHandler.timerid);
		PopupHandler.hide();
	},
	// find position relative to the document.body (by default)
	// or relative to the some ancestor.
	findObjectPositio : function(obj, tillParent) {
		var curLeft = 0;
		var curTop = 0;
		tillParent = tillParent || document.body;
		if (obj.offsetParent) {
			while (tillParent != obj && obj.offsetParent) {
				curLeft += obj.offsetLeft;
				curTop += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}
		else {
			if (obj.x) curLeft = obj.x;
			if (obj.y) curTop = obj.y;
		}
		return {left: curLeft, top: curTop};
	},
	setHandlers : function() {
		if(this.isAutoHide) {
			this.oldOnKeyUp = document.onkeyup;
			this.oldOnClick = document.onclick;
			
			document.onclick = this._onclick;
			this.popupDiv.onmouseover = this._onmouseover;
			this.popupDiv.onmouseout  = this._onmouseout;
		}
    // to handle ESC in formPopups
  	document.onkeyup = this._onkeyup;

		// FF: fixed position
		if(this.isFixedPosition) {
			this.oldOnScroll = window.onscroll
			window.onscroll = this._onscroll;	
		}

		//window.onscroll
		//document.onkeyup = this.onscroll;
		//addEvent(document, 'scroll', this._onscroll, false);
	},
	resetHandlers : function() {
		if(this.isAutoHide) {
			document.onkeyup = this.oldOnKeyUp;
			document.onclick = this.oldOnClick;
			this.popupDiv.onmouseover = null;
			this.popupDiv.onmouseout = null;
		}
		if(this.isFixedPosition) {
			window.onscroll = this.oldOnScroll;
		}

		this.popupDiv = null;
	},
	
	checkHidingDiv : function(div) {
	  if(this.parentDlg == null)
	    return;
	  if(this.parentDlg.id == div.id)
	    this.hide();
	},
	
	// handlers --
	_onkeyup : function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode : 
			((evt.which) ? evt.which : 0));
		if (charCode == 27) {
			PopupHandler.hide();
      // used by popupform if it requires to handle ESC
		  if(PopupHandler.onHideCallback)
		    PopupHandler.onHideCallback();
		}
	},
	_onclick : function(evt) {
		if(PopupHandler.firstClick)	{
			PopupHandler.firstClick = false;
			return;
		}
		var evt = evt || window.event;
		var target = evt.target || evt.srcElement; 
		if (PopupHandler.contains(PopupHandler.popupDiv, target) == false )
			PopupHandler.hide();
	},
	_onmouseover : function(event) {
		var related;
		if (window.event) related = window.event.toElement;
		else related = event.relatedTarget;
		if (PopupHandler.popupDiv == related || PopupHandler.contains(PopupHandler.popupDiv, related))
			clearInterval(PopupHandler.timerid);
	},
	_onmouseout : function(event) {
		var related;
		if (window.event) related = window.event.toElement;
		else related = event.relatedTarget;
		if(related == null)
			return;
		if (PopupHandler.popupDiv != related && !PopupHandler.contains(PopupHandler.popupDiv, related)) {
			PopupHandler.timerid = setInterval(PopupHandler.suspendedHide, PopupHandler.CLOSE_TIMEOUT);
		}
	},
	// used for FF and position=fixed. It is a hack for cursor in <input> over iframe
	_onscroll : function(event) {
		var scrl = getScrollXY();
		PopupHandler.popupDiv.style.left = PopupHandler.x - scrl[0];
		PopupHandler.popupDiv.style.top = PopupHandler.y - scrl[1];
	},
	// Return true if node a contains node b.
	contains : function (a, b) {
		if(a == null || b == null)
			return false;
		while (b.parentNode)
			if ((b = b.parentNode) == a) return true;
		return false;
	}
}
