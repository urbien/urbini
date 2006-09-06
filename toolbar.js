/****************************************************
* FormPopup
*****************************************************/
// return parameter name is its a name in the form 
function FormPopup(innerFormHtml, parentElt) {
	var i_am = this;
	this.div = null;
	this.formDiv = null;
	this.buttonsDiv = null;
	this.callback = null;
	
	this.create = function(innerFormHtml, parentElt) {
		this.div = document.createElement('div');
		this.div.style.visibility = "hidden";
		this.div.style.position = "absolute";
		this.div.style.backgroundColor = "#fff";
		this.div.style.borderStyle = "solid";
		this.div.style.borderWidth = 1;
		this.div.style.borderColor = "#999";
		this.div.style.padding = 5;
		
		this.formDiv = document.createElement('div');
		this.formDiv.innerHTML = innerFormHtml;
		
		this.buttonsDiv = this.createButtons(); 
		this.div.appendChild(this.formDiv);
		this.div.appendChild(this.buttonsDiv);
		parentElt.appendChild(this.div);
	}
	
	// ok, cancel
	this.createButtons = function() {
		var btnDiv = document.createElement('div');
		btnDiv.align = "center";
		btnDiv.style.paddingTop = 10;
		btnDiv.innerHTML = 
		'<table>'
			+ ' <tr>'
				+ ' <td>'
					+ ' <input type="button" value="Ok" style="width:70; font-family:verdana; font-size:12px" />'
				+ ' </td>'
				+ ' <td>'
					+ ' <input type="button" value="Cancel" style="width:70; font-family:verdana; font-size:12px" />'
				+ ' </td>'
			+ ' </tr>'
		'</table>';
		
		var btns = btnDiv.getElementsByTagName('input');
		btns[0].onclick = this._onok; // Ok
		btns[1].onclick = this._hide; // Cancel
		return btnDiv;
	}
	
	this.show = function(btnObj, alignment, callback, parentDlg) {
		this.callback = callback;
		PopupHandler.showRelatively(btnObj.div, alignment ,this.div, false, parentDlg);
		
		//var inputs = this.formDiv.getElementsByTagName('input');
		//inputs[0].focus();
	}

	this._onok = function() {
		var retArr = new Array();
		var inpCol = i_am.formDiv.getElementsByTagName("input");
		// inputs - only "text" realized
		for(var i = 0; i < inpCol.length; i++) {
			var inp = inpCol[i];
			var type = inp.getAttribute("type");
			var name = inp.getAttribute("name");
			if(type == "text") {
				retArr[name] = inp.value;
			}
		}
		// selects
		var selectCol = i_am.formDiv.getElementsByTagName("select");
		for(i = 0; i < selectCol.length; i++) {
			var sel = selectCol[i];
			var name = sel.getAttribute("name");
				retArr[name] = inp.value;
			}
		i_am.callback(retArr);
		i_am._hide();
	}
	
	this._hide = function() {
		PopupHandler.hide();
	}

	// constructor ---
	parentElt = parentElt || document.body;
	this.create(innerFormHtml, parentElt);
}

/****************************************************
*	ToolbarButton class
*****************************************************/
function ToolbarButton(index, callback, isToggle, icon, iconSize, title, left, top, toolbar)
{
	var i_am = this;
	this.div = null;
	
	this.index = index;
	this.callback = callback;
	this.isToggle = isToggle;
	this.icon = icon;
	this.title = title;
	this.toolbar = toolbar;
	
	this.left = left;
	this.top = top;
	this.width = null;
	this.height = null;

	this.isPressed = false;
	
	this.create = function(iconSize) { // create Button
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
		
		this.div.innerHTML = '<img src = "' + icon + '" border="0"'
			+ ' width=' + iconSize + ' height=' + iconSize + '>'; // width = height

		// register of handlers
		this.div.onmouseover = this.onMouseOver;
		this.div.onmouseout = this.onMouseOut;
		this.div.onmousedown = this.onMouseDown;
		this.div.onmouseup = this.onMouseUp;

		this.width = this.height = iconSize + 2 * this.toolbar.BTN_PADDING;
		
		this.toolbar.div.appendChild(this.div);
	}
	
	this.findButtonSize = function() {
	}

	this.onMouseOver = function() {
		if(i_am.isPressed)
			return;
		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "ButtonHighlight";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "ButtonShadow";
	}
	
	this.onMouseOut = function() {
		if(i_am.isPressed)
			return;
		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "buttonface";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "buttonface";
	}	
	
	this.onMouseDown = function() {
		i_am.div.style.borderLeftColor = i_am.div.style.borderTopColor = "ButtonShadow";
		i_am.div.style.borderRightColor = i_am.div.style.borderBottomColor = "ButtonHighlight";
		if(i_am.isToggle) {
			i_am.isPressed = !i_am.isPressed;
			if(i_am.isPressed) {
				i_am.div.style.backgroundColor = "buttonhighlight";
			}
			else {
				i_am.div.style.backgroundColor = "buttonface";
				i_am.onMouseOut();
			}
			i_am.callback(i_am.isPressed);
		}
		else
			i_am.div.style.backgroundColor = "buttonhighlight";
	}	
	
	this.onMouseUp = function(e) {
		if(i_am.isToggle)
			return;
		
		i_am.div.style.backgroundColor = "buttonface";
		i_am.onMouseOut();
		i_am.callback(i_am.isPressed);
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
	this.create(iconSize);
	this.onMouseOut(); // draw "invisible" borders 	
}

/*********************************************
* PALETTE gloabal object
**********************************************/
var PalettePopup = {
	div : null,
	callback : null,
	//show 
	show : function(hotspot, alignment, callback, parentDlg) {
		if(this.div == null)
			this.create();
		
		this.callback = callback;
		PopupHandler.showRelatively(hotspot.div, alignment, this.div, true, parentDlg);
	},
	create : function() {
		this.div = document.createElement('div');
		this.div.style.visibility = "hidden";
		this.div.style.position = "absolute";
		this.div.style.backgroundColor = "#fff";
		this.div.style.borderStyle = "solid";
		this.div.style.borderWidth = 1;
		this.div.style.borderColor = "#999";
		this.div.style.padding = 1;

		this.div.innerHTML = this.getPaletteStr();
		document.body.appendChild(this.div);
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
			'<table width=130; height=80 cellpadding="0" cellspacing="1" border="0" align="left">' + '<tr>'
			+ '	<td bgcolor="#FFFFFF" onclick="PalettePopup._onclick(\'#FFFFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCCCC" onclick="PalettePopup._onclick(\'#FFCCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCC99" onclick="PalettePopup._onclick(\'#FFCC99\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFFF99" onclick="PalettePopup._onclick(\'#FFFF99\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFFFCC" onclick="PalettePopup._onclick(\'#FFFFCC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#99FF99" onclick="PalettePopup._onclick(\'#99FF99\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#99FFFF" onclick="PalettePopup._onclick(\'#99FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CCFFFF" onclick="PalettePopup._onclick(\'#CCFFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CCCCFF" onclick="PalettePopup._onclick(\'#CCCCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCCFF" onclick="PalettePopup._onclick(\'#FFCCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#CCCCCC" onclick="PalettePopup._onclick(\'#CCCCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF6666" onclick="PalettePopup._onclick(\'#FF6666\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF9966" onclick="PalettePopup._onclick(\'#FF9966\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFFF66" onclick="PalettePopup._onclick(\'#FFFF66\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFFF33" onclick="PalettePopup._onclick(\'#FFFF33\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#66FF99" onclick="PalettePopup._onclick(\'#66FF99\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#33FFFF" onclick="PalettePopup._onclick(\'#33FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#66FFFF" onclick="PalettePopup._onclick(\'#66FFFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#9999FF" onclick="PalettePopup._onclick(\'#9999FF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF99FF" onclick="PalettePopup._onclick(\'#FF99FF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#C0C0C0" onclick="PalettePopup._onclick(\'#C0C0C0\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF0000" onclick="PalettePopup._onclick(\'#FF0000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF9900" onclick="PalettePopup._onclick(\'#FF9900\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCC66" onclick="PalettePopup._onclick(\'#FFCC66\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFFF00" onclick="PalettePopup._onclick(\'#FFFF00\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#33FF33" onclick="PalettePopup._onclick(\'#33FF33\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#66CCCC" onclick="PalettePopup._onclick(\'#66CCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#33CCFF" onclick="PalettePopup._onclick(\'#33CCFF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#6666CC" onclick="PalettePopup._onclick(\'#6666CC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CC66CC" onclick="PalettePopup._onclick(\'#CC66CC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#999999" onclick="PalettePopup._onclick(\'#999999\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CC0000" onclick="PalettePopup._onclick(\'#CC0000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FF6600" onclick="PalettePopup._onclick(\'#FF6600\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCC33" onclick="PalettePopup._onclick(\'#FFCC33\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#FFCC00" onclick="PalettePopup._onclick(\'#FFCC00\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#33CC00" onclick="PalettePopup._onclick(\'#33CC00\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#00CCCC" onclick="PalettePopup._onclick(\'#00CCCC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#3366FF" onclick="PalettePopup._onclick(\'#3366FF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#6633FF" onclick="PalettePopup._onclick(\'#6633FF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CC33CC" onclick="PalettePopup._onclick(\'#CC33CC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#666666" onclick="PalettePopup._onclick(\'#666666\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#990000" onclick="PalettePopup._onclick(\'#990000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CC6600" onclick="PalettePopup._onclick(\'#CC6600\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#CC9933" onclick="PalettePopup._onclick(\'#CC9933\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#999900" onclick="PalettePopup._onclick(\'#999900\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#009900" onclick="PalettePopup._onclick(\'#009900\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#339999" onclick="PalettePopup._onclick(\'#339999\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#3333FF" onclick="PalettePopup._onclick(\'#3333FF\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#6600CC" onclick="PalettePopup._onclick(\'#6600CC\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#993399" onclick="PalettePopup._onclick(\'#993399\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#333333" onclick="PalettePopup._onclick(\'#333333\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#660000" onclick="PalettePopup._onclick(\'#660000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#993300" onclick="PalettePopup._onclick(\'#993300\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#996633" onclick="PalettePopup._onclick(\'#996633\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#666600" onclick="PalettePopup._onclick(\'#666600\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#006600" onclick="PalettePopup._onclick(\'#006600\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#336666" onclick="PalettePopup._onclick(\'#336666\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#000099" onclick="PalettePopup._onclick(\'#000099\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#333399" onclick="PalettePopup._onclick(\'#333399\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#663366" onclick="PalettePopup._onclick(\'#663366\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td bgcolor="#000000" onclick="PalettePopup._onclick(\'#000000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#330000" onclick="PalettePopup._onclick(\'#330000\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#663300" onclick="PalettePopup._onclick(\'#663300\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#663333" onclick="PalettePopup._onclick(\'#663333\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#333300" onclick="PalettePopup._onclick(\'#333300\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#003300" onclick="PalettePopup._onclick(\'#003300\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#003333" onclick="PalettePopup._onclick(\'#003333\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#000066" onclick="PalettePopup._onclick(\'#000066\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#330099" onclick="PalettePopup._onclick(\'#330099\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '	<td bgcolor="#330033" onclick="PalettePopup._onclick(\'#330033\');" onmouseover="PalettePopup._onmouseover(this);" width="10" height="10"></td>'
			+ '</tr>'
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
	var HIGHLIGHTED_BACKGROUND = "#eee";
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
// default parameters: colAmt: 1; parentElt: document.body;
function List(colAmt, parentElt) {
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
		
		this.div.appendChild(this.table);
		parentElt.appendChild(this.div);
	}
	this.show = function(hotspot, alignment, callback, parentDlg) {
		this.callback = callback;
		PopupHandler.showRelatively(hotspot.div, alignment, this.div, true, parentDlg);
	}	
	this.appendItem = function(innerDiv) {
		if(this.itemsArr == null)
			this.itemsArr = new Array();

		var idx = this.itemsArr.length;
		if(this.isFirstRowItem(idx)) {
			this.curRow = document.createElement("tr");
			this.tablebody.appendChild(this.curRow);
		}

		this.itemsArr[idx] = new ListItem(idx, innerDiv, this);
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
		PopupHandler.hide();
		this.callback(itemIdx);
	}
	this.getItemObject = function(idx) {
		return this.itemsArr[idx];
	}
	this.getSelectedItem = function(idx) {
		return this.selectedItemIdx;
	}
	
	// list's "constructor" --
	parentElt = parentElt || document.body;
	this.create(parentElt);
}

/****************************************************
*	DropdownList class
* current realization: 
* the dropdown list contains a unique list objet
* probably better to make tha list global, so to share it.
*****************************************************/
function DropdownList(index, callback, left, top, fieldWidth, title, toolbarIn) {
	var FONT_FAMILY = "verdana";
	var FONT_SIZE = "12px";
	var IMAGES_FOLDER = "images/wysiwyg/";
	var FIELD_HEIGHT = 27;
	var ARROW_BUTTON_WIDTH = 16;
	var DECREASE_BTN = 2;
	var ARROW_BUTTON_HEIGHT = FIELD_HEIGHT - DECREASE_BTN;

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
	
	// create -----------------
	this.create = function() {
		// 1. create the list
		var listTop = this.top + FIELD_HEIGHT + 1;
		this.list = new List(1, document.body); //this.toolbar.div

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

		//debugger
		if(this.div.clientHeight != FIELD_HEIGHT)
			this.div.style.height = 2*FIELD_HEIGHT - this.div.clientHeight;
		
		// 3. button to open list
		// 3.1 create button & button image
		this.buttonDiv = document.createElement('div');
		this.buttonDiv.style.position = "absolute";
		this.buttonDiv.style.left = this.left + this.fieldWidth + 3;
		this.buttonDiv.style.top = this.top + DECREASE_BTN / 2;
				
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
	
	// arrow button handlers
	this.onMouseOverBtn = function() {
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button_over.gif";
	}
	this.onMouseOutBtn = function() {
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
	}
	this.onMouseDownBtn = function() {
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button_pressed.gif";
	}
	this.onMouseUpBtn = function() {
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
		var top = i_am.top + i_am.div.clientHeight + 1;
		//var parentDlg = getAncestorById(i_am.div, 'pane2'); // hack: detects if it's in a 'pane2' dialog 
		i_am.list.show(i_am, 'left', i_am.setSelectedItem); // , parentDlg
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
	
	// constructor's body
	this.create();
}

/****************************************************
*	Toolbar class
*****************************************************/
function Toolbar(parentDiv, masterObj, iconSize)
{
	var LEFT_PADDING = 10; // pix
	var RIGHT_PADDING = 10;
	var TOP_PADDING = 4;
	var BOTTOM_PADDING = 5;
	this.BTN_PADDING = 3;
	var BTN_GAP = 5;
	
	this.parentDiv = parentDiv;
	this.masterObj = masterObj;
	this.iconSize = iconSize;
	this.controlsArr = null;
	this.div = null;
	this.titlestrip = null;
	var lastBtnEdge = 0;
	
	this.width = 0;
	this.height = 0;
	
	this.create = function() {
		// 1. create title bar
		this.titlestrip = new Titlestrip(this.parentDiv, this);
		// 2. create, namely, toolbar
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.left = 0;
		this.div.style.top = this.titlestrip.height;
		this.div.style.width = this.width;
		this.div.style.height = this.height;
		this.div.style.backgroundColor = "buttonface";
		this.div.style.borderWidth = 0;
		
		this.parentDiv.appendChild(this.div);
	}
	
	this.appendDropdownList = function(fieldWidth, title, callback) {
		if(this.controlsArr == null)
			this.controlsArr = new Array();
		
		var idx = this.controlsArr.length;
		var left = (idx > 0) ? lastBtnEdge + BTN_GAP : LEFT_PADDING;
		this.controlsArr[idx] = new DropdownList(idx, callback, left, TOP_PADDING, fieldWidth, title, this);
		this.titlestrip.appendTitle(left, title);
		
		this.resize(idx);
		
		return this.controlsArr[idx];
	}
	
	this.appendButton = function(callback, isToggle, icon, title) {
		if(this.controlsArr == null)
			this.controlsArr = new Array();
		
		var idx = this.controlsArr.length;
		var left = (idx > 0) ? lastBtnEdge + BTN_GAP : LEFT_PADDING;
	//	debugger
		this.controlsArr[idx] = new ToolbarButton(idx, callback, isToggle, icon, this.iconSize, title, left, TOP_PADDING, this);
		this.resize(idx);
		
		return this.controlsArr[idx];
	}
	
	// resize toolbar according to new appended button
	this.resize = function(idx){
		obj = this.controlsArr[idx];
		var newHeight = obj.height + (TOP_PADDING + BOTTOM_PADDING);
		if(this.height < newHeight)
			this.height = newHeight
					
		if(idx == 0)
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
	
	this.getWidth = function() {
		return this.width;
	}
	
	this.getHeight = function() {
		return (this.height + this.titlestrip.height);
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
	// Toolbar constructor's body
	this.create();
}

/*****************************************
* PopupHandler
*****************************************/
var PopupHandler = {
	CLOSE_TIMEOUT : 500,
	popupDiv : null,
	//hotspot : null,
	oldOnKeyUp : null,
	oldOnClick : null,
	timerid  : 0,
	firstClick : true, // prevents a closing from button's onmouseup 

	// div is a popup
	// alignment: left, center, right
	showRelatively : function(hotspot, alignment, div, autohide, parentDlg) {
		var OFFSET_Y = 5;
		if(this.popupDiv != null) // only 1 popup can be opened concurrently
			this.hide();

		// set popup's parentDlg
		if(parentDlg != null)
			parentDlg.appendChild(div);

		var pos = this.findObjectPositio(hotspot, parentDlg);
		if(alignment == 'left')
			div.style.left = pos.left;
		else if(alignment == 'center') 
			div.style.left = pos.left - (div.clientWidth - hotspot.clientWidth) / 2;
		else  // right
			div.style.left = pos.left - (div.clientWidth - hotspot.clientWidth);

		div.style.top = pos.top + hotspot.clientHeight + OFFSET_Y;
		if(typeof autohide == 'undefined')
			autohide = true;
		this._show(div, autohide);
	},
	showAbsolutely : function(left, top, div, autohide) {
		if(this.popupDiv != null) // only 1 popup can be opened concurrently
			this.hide();

		div.style.left = left;
		div.style.top = top;
		if(typeof autohide == 'undefined')
			autohide = true;
		this._show(div, autohide);
	},
	_show : function(div, autohide) {
		this.popupDiv = div;
		if(autohide)
			this.setHandlers();
		
		this.firstClick = true;
		this.popupDiv.style.visibility = "visible";	
	},
	
	hide : function() {
		if(this.popupDiv == null)
			return;
		this.popupDiv.style.visibility = "hidden";
		// set back popup's parent a document.body 
		//debugger
		document.body.appendChild(this.popupDiv);
		this.resetHandlers();
	},
	suspendedHide : function() {
		clearInterval(PopupHandler.timerid);
		PopupHandler.hide();
	},
	
	// find position relative to the document.body (by default)
	// or relative to the some ancestor.
	findObjectPositio : function (obj, tillParent) {
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
			if (hotspot.x) curLeft += hotspot.x;
			if (hotspot.y) curTop += hotspot.y;
		}
		return {left: curLeft, top: curTop};
	},
	setHandlers : function() {
		this.oldOnKeyUp = document.onkeyup;
		this.oldOnClick = document.onclick;
		
		document.onkeyup = this._onkeyup;
		document.onclick = this._onclick;
		this.popupDiv.onmouseover = this._onmouseover;
		this.popupDiv.onmouseout  = this._onmouseout;
	},
	resetHandlers : function() {
		document.onkeyup = this.oldOnKeyUp;
		document.onclick = this.oldOnClick;
		this.popupDiv.onmouseover = null;
		this.popupDiv.onmouseout = null;
		this.popupDiv = null;
	},
	// handlers --
	_onkeyup : function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode : 
			((evt.which) ? evt.which : 0));
		if (charCode == 27)
			PopupHandler.hide();
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
	// Return true if node a contains node b.
	contains : function (a, b) {
		if(a == null || b == null)
			return false;
		while (b.parentNode)
			if ((b = b.parentNode) == a) return true;
		return false;
	}
}
