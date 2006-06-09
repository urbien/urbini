
/****************************************************
*	ToolbarButton class
*****************************************************/
function ToolbarButton(index, callback, isToggle, icon, title, left, top, toolbarIn)
{
	var PADDING = 4; // px
	var i_am = this;
	this.div = null;
	
	this.index = index;
	this.callback = callback;
	this.isToggle = isToggle;
	this.icon = icon;
	this.title = title;
	this.toolbar = toolbarIn;
	
	this.left = left;
	this.top = top;
	this.width = null;
	this.height = null;

	this.isPressed = false;
	
	this.create = function() { // create Button
		this.div = document.createElement('div');
		this.div.style.position = "absolute";
		this.div.style.left = this.left;
		this.div.style.top = this.top;
		this.div.style.backgroundColor = "buttonface";
		this.div.style.padding = PADDING;
		this.div.style.cursor = "pointer";
		this.div.style.borderWidth = "1px";
		this.div.style.borderStyle = "solid";
		this.div.title = this.title;
		
		this.div.innerHTML = '<img src = "' + icon + '" border="0">';
		
		// register of handlers
		this.div.onmouseover = this.onMouseOver;
		this.div.onmouseout = this.onMouseOut;
		this.div.onmousedown = this.onMouseDown;
		this.div.onmouseup = this.onMouseUp;

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
	
	this.onMouseUp = function() {
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
	
	this.storeButtonSize = function() {
		this.width = this.div.clientWidth;
		this.height = this.div.clientHeight;
	}
	
	// constructor's body
	this.create();
	this.storeButtonSize();
	this.onMouseOut(); // draw "invisible" borders 	
}

/****************************************************
*	ListItem class
*****************************************************/
function ListItem(index, innerDiv, parentIn)
{
	var HIGHLIGHTED_BACKGROUND = "#eee";
	var HOR_MARGIN = 4;
	var VER_MARGIN = 2;
	var i_am = this;
	this.index = index;
	this.innerDiv = innerDiv;
	this.parent = parentIn;
	this.liObj = null;
	this.height = 0;

	this.create = function() {
		// 1. create
		this.liObj = document.createElement('li');
		this.liObj.style.cursor = "pointer";
		
		this.innerDiv.style.display = "block"
		this.innerDiv.style.width = "97%";
		//this.innerDiv.style.cursor = "pointer"; //
		
		this.liObj.style.backgroundColor = this.parent.LIST_BACKGROUND;
		//this.liObj.style.padding = 1;
		this.liObj.style.marginLeft = this.liObj.style.marginRight = HOR_MARGIN;
		this.liObj.style.marginTop = this.liObj.style.marginBottom = VER_MARGIN;
		// 2. set handlers
		this.liObj.onmouseover = this.onMouseOver;
		this.liObj.onmouseout = this.onMouseOut;
		this.liObj.onmouseup = this.onMouseUp;

		// 3. append
		this.liObj.appendChild(innerDiv);
		this.parent.listObj.appendChild(this.liObj);
		this.height = this.liObj.clientHeight + VER_MARGIN * 2;
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
	this.onMouseUp = function() {
		i_am.parent.onItemSelection(i_am.index);
	}

	// constructor's body
	this.create();
}

/****************************************************
*	DropdownList class
*****************************************************/
function DropdownList(index, callback, left, top, fieldWidth, title, toolbarIn)
{
	var FONT_FAMILY = "verdana";
	var FONT_SIZE = "12px";
	var IMAGES_FOLDER = "./styleSheet/images/";
	this.LIST_BACKGROUND = "#ffffff";
	var LIST_BORDER_COLOR = "#999";
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
	this.itemsArr = null;
	this.listHeight = 0;
	
	this.fieldDiv = null;
	this.itemCloneObj = null;
	
	this.buttonDiv = null;
	this.btnImg = null;
	
	this.listDiv = null;
	this.listObj = null;
	
	this.selectedItemIdx = 0;
	
	// create -----------------
	this.create = function() {
		// 1. field - shows selected item
		this.fieldDiv = document.createElement('div');
		this.fieldDiv.style.position = "absolute";
		this.fieldDiv.style.left = this.left;
		this.fieldDiv.style.top = this.top;
		this.fieldDiv.style.width = this.fieldWidth;
		this.fieldDiv.style.height = FIELD_HEIGHT;
		this.fieldDiv.style.fontFamily = FONT_FAMILY;
		this.fieldDiv.style.fontSize = FONT_SIZE;
		this.fieldDiv.style.paddingLeft = this.fieldDiv.style.paddingRight = 4;
		this.fieldDiv.style.paddingTop = this.fieldDiv.style.paddingBottom = 3;
		this.fieldDiv.style.backgroundColor = this.LIST_BACKGROUND;
		this.fieldDiv.style.borderWidth = "1px";
		this.fieldDiv.style.borderStyle = "solid";
		this.fieldDiv.style.overflow = "visible";
		this.fieldDiv.title = this.title;
		this.toolbar.div.appendChild(this.fieldDiv);
		
		this.fieldWidth = this.fieldDiv.clientWidth;// get real size of the field; for FF
		//debugger
		if(this.fieldDiv.clientHeight != FIELD_HEIGHT)
			this.fieldDiv.style.height = 2*FIELD_HEIGHT - this.fieldDiv.clientHeight;
		
		// 2. button to open list
		// 2.1 create button & button image
		this.buttonDiv = document.createElement('div');
		this.buttonDiv.style.position = "absolute";
		this.buttonDiv.style.left = this.left + this.fieldWidth + 3;
		this.buttonDiv.style.top = this.top + DECREASE_BTN / 2;
				
		this.btnImg = document.createElement('IMG');
		this.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
		this.btnImg.style.cursor = "pointer"
		
		this.btnImg.width = ARROW_BUTTON_WIDTH;
		this.btnImg.height = ARROW_BUTTON_HEIGHT;
		
		
		// 2.2 set arrow button handlers
		this.buttonDiv.onmouseover = this.onMouseOverBtn;
		this.buttonDiv.onmouseout = this.onMouseOutBtn;
		this.buttonDiv.onmousedown = this.onMouseDownBtn;
		this.buttonDiv.onmouseup = this.onMouseUpBtn
		// 2.3 append the arrow button 
		this.buttonDiv.appendChild(this.btnImg);
		this.toolbar.div.appendChild(this.buttonDiv);
		
		// 3. dropdown list
		// 3.1 create list div & list
		this.listDiv = document.createElement('div');
		this.listDiv.style.display = "block";//"none";
		this.listDiv.style.position = "absolute";
		this.listDiv.style.left = this.left;
		this.listDiv.style.top = this.top + FIELD_HEIGHT + 1;
		this.listDiv.style.width = this.fieldWidth;
		
		this.listDiv.style.height = 0; // instead display = "none" <- to calculate items height
		this.listDiv.style.visibility = "hidden";
		
		this.listDiv.style.fontFamily = FONT_FAMILY;
		this.listDiv.style.fontSize = FONT_SIZE;
		this.listDiv.style.backgroundColor = this.LIST_BACKGROUND;
		this.listDiv.style.borderStyle = "solid";
		this.listDiv.style.borderWidth = 1;
		this.listDiv.style.borderColor = LIST_BORDER_COLOR;
		//this.listDiv.style.overflow = "visible";
		
		this.listObj = document.createElement('ul');
		this.listObj.style.listStyleType = "none";
		this.listObj.style.margin = 0;
		this.listObj.style.padding = 0;
		
		// 3.2 set list handlers
		
		// 3.3 append the list
		this.listDiv.appendChild(this.listObj);
		this.toolbar.div.appendChild(this.listDiv);
		
		// 3.4
		this.width = this.fieldWidth + ARROW_BUTTON_WIDTH;
		this.height = this.fieldDiv.clientHeight;
	}
	
	this.appendItem = function(itemDiv) {
		if(this.itemsArr == null)
			this.itemsArr = new Array();
		
		var idx = this.itemsArr.length;
		this.itemsArr[idx] = new ListItem(idx, itemDiv, this);

		this.listHeight += this.itemsArr[idx].height;
	}
	
	this.getItemObject = function(idx) {
		return this.itemsArr[idx];
	}
	
	this.getSelectedItem = function(idx) {
		return this.selectedItemIdx;
	}
	
	this.setSelectedItem = function(itemIdx) {
		this.selectedItemIdx = itemIdx;
	
		if(this.itemCloneObj != null)
			this.fieldDiv.removeChild(this.itemCloneObj);
			
		this.itemCloneObj = this.itemsArr[itemIdx].getInnerDiv().cloneNode(true);
		this.fieldDiv.appendChild(this.itemCloneObj);
	}
	
	// onItemSelection
	this.onItemSelection = function(itemIdx) {
		this.setSelectedItem(itemIdx);
		this.listDiv.style.height = 0; // instead display = "none";
		this.listDiv.style.visibility = "hidden";
		this.callback(itemIdx);
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
		if(i_am.listDiv.style.visibility == "visible")
			return;
		
		i_am.btnImg.src = IMAGES_FOLDER + "arrow_button.gif";
		i_am.listDiv.style.top = i_am.top + i_am.fieldDiv.clientHeight + 1;
		
		i_am.listDiv.style.height = i_am.listHeight;
		i_am.listDiv.style.visibility = "visible";

		i_am.toolbar.popupHandler(i_am.listDiv, true);
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
function Toolbar(parentDiv, masterObj)
{
	var LEFT_PADDING = 15; // pix
	var RIGHT_PADDING = 15;
	var TOP_PADDING = 2;
	var BOTTOM_PADDING = 15;
	
	var BUTTONS_GAP = 10;
	this.parentDiv = parentDiv;
	this.masterObj = masterObj;
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
		var left = (idx > 0) ? lastBtnEdge + BUTTONS_GAP : LEFT_PADDING;
		this.controlsArr[idx] = new DropdownList(idx, callback, left, TOP_PADDING, fieldWidth, title, this);
		this.titlestrip.appendTitle(left, title);
		
		this.resize(idx);
		
		return this.controlsArr[idx];
	}
	
	this.appendButton = function(callback, isToggle, icon, title) {
		if(this.controlsArr == null)
			this.controlsArr = new Array();
		
		var idx = this.controlsArr.length;
		var left = (idx > 0) ? lastBtnEdge + BUTTONS_GAP : LEFT_PADDING;
		this.controlsArr[idx] = new ToolbarButton(idx, callback, isToggle, icon, title, left, TOP_PADDING, this);
		this.resize(idx);
		
		return this.controlsArr[idx];
	}
	
	// resize toolbar according to new appended button
	this.resize = function(idx){
		btnObj = this.controlsArr[idx];
		var newHeight = btnObj.height + (TOP_PADDING + BOTTOM_PADDING);
		if(this.height < newHeight)
			this.height = newHeight
					
		if(idx == 0)
			this.width = LEFT_PADDING + btnObj.width + RIGHT_PADDING;
		else
			this.width += BUTTONS_GAP + btnObj.width;	

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
	
	/*****************************************
	* popupHandler "inner class"
	*****************************************/
	this.popupHandler = function(popupDiv, isList)
	{
		var CLOSE_TIMEOUT = 500;
		
		// only 1 popup can be opened concurrently
		if(this.popupDiv != null)
			this.closePopup();
			
		this.popupDiv = popupDiv;
		this.isList = isList;
		this.oldOnKeyUp = null;
		this.timerid = 0;
		var i_am = this;
		
		this.firstClick = true; // 1st click comes from calling button. igore this event.
		
		this._onkeyup = function(evt) {
			evt = (evt) ? evt : event;
			var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode : 
				((evt.which) ? evt.which : 0));
			if (charCode == 27)
				i_am.closePopup();
		}
	
		this._onmouseup = function(evt) {
			if(i_am.firstClick)	{
				i_am.firstClick = false;
				return;
			}
			i_am.closePopup();
		}

		this._onmouseover = function(event) {
			var related;
			if (window.event) related = window.event.toElement;
			else related = event.relatedTarget;
			if (i_am.popupDiv == related || i_am.contains(i_am.popupDiv, related))
				clearInterval(i_am.timerid);
		}
		
		this._onmouseout = function(event) {
			var related;
			if (window.event) related = window.event.toElement;
			else related = event.relatedTarget;
			if (i_am.popupDiv != related && !i_am.contains(i_am.popupDiv, related))
				i_am.timerid = setInterval(i_am.suspendedClose, CLOSE_TIMEOUT);
		}
		
		this.contains = function (a, b) {// Return true if node a contains node b.
			while (b.parentNode)
				if ((b = b.parentNode) == a) return true;
			return false;
		}
		
		this.suspendedClose = function() {
			clearInterval(i_am.timerid);
			i_am.closePopup();
		}
		
		this.closePopup = function() {
			if(this.popupDiv == null)
				return;
				
			this.popupDiv.style.visibility = "hidden";
			if(this.isList)
				this.popupDiv.style.height = 0; // it is used in purpose to get size of list, for FF
				
			document.onkeyup = this.oldOnKeyUp;
			this.popupDiv.onmouseover = null;
			this.popupDiv.onmouseout = null;
			this.popupDiv = null;
			this.firstClick = true;
		}
		
		// constructor's body ----
		this.oldOnKeyUp = document.onkeyup;
		document.onkeyup = this._onkeyup;
		document.onclick = this._onmouseup;

		this.popupDiv.onmouseover = this._onmouseover;
		this.popupDiv.onmouseout = this._onmouseout;
		
	}
	
	
	// Toolbar constructor's body
	this.create();
}