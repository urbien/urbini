
// gloabal variable contains Fixed Color object.
var fixedClrPE = null;

// gloabal function to get a color.
function getFixedColor(formName, valueFldName, selectFldName, verifiedFldName, buttonName, labelId, frameDivId, titleStr)
{
	if(fixedClrPE == null)
		fixedClrPE = new FixedColor();
		
	var valueFldObj = document.forms[formName].elements[valueFldName]; 
	var selectFldObj = document.forms[formName].elements[selectFldName];
	var verifiedFldObj = document.forms[formName].elements[verifiedFldName];
	var buttonObj = document.images[buttonName];
	var labelObj = document.getElementById(labelId);
	var frameObj = document.getElementById(frameDivId);

	fixedClrPE.launch(valueFldObj, selectFldObj, verifiedFldObj, buttonObj, labelObj, frameObj, titleStr);
}
	
// class FixedColor	
function FixedColor()
{
	var PALETTE_WIDTH  = 130;
	var PALETTE_HEIGHT = 80;
	var PE_PADDING = 3;
	var CLOSE_TIMEOUT = 500; //ms
	
	var clrPickerDiv = null;
	var valueFldObj	 = null;
	var selectFldObj = null;
	var verifiedFldObj = null;
	var buttonObj    = null;
	var labelObj    = null;
	var frameObj    = null;
	var titleStr	= null;
	
	var oldDocOnMouseUp = null;
	var oldOnKeyUp = null;
	var skipClose = false;
	var timerid;

	this.launch = function(valueFldObjIn, selectFldObjIn, verifiedFldObjIn, buttonObjIn, labelObjIn, frameObjIn, titleStrIn)
	{
		valueFldObj  = valueFldObjIn;
		selectFldObj = selectFldObjIn;
		verifiedFldObj = verifiedFldObjIn;
		buttonObj = buttonObjIn;
		labelObj = labelObjIn;
		frameObj = frameObjIn;
		titleStr = titleStrIn
		
		frameObj.align = "left";
		frameObj.innerHTML = this.getPaletteContent();
		frameObj.style.borderWidth = "1px";
		frameObj.style.borderColor = "#777";
		frameObj.style.borderStyle= "solid";
		frameObj.style.backgroundColor = "#FFF";
		
		this.show();
	}
	
	this.show = function()
	{
		frameObj.style.position = "absolute";
		var pos = this.getFcPosition(buttonObj);
		frameObj.style.left = pos[0] + 'px';
		frameObj.style.top  = pos[1] + 'px';
		frameObj.style.display = "block";
		frameObj.style.visibility = "visible";
		
		// append listeners
		frameObj.onmouseout = this.frameOut;
		frameObj.onmouseover = this.frameIn;
		
		frameObj.onmouseup = this.frameClick;
		
		oldDocOnMouseUp = document.onmouseup;
		document.onmouseup = this.close;

		oldOnKeyUp = document.onkeyup;
		document.onkeyup = this.onFcKeyUp;
	}
	
	this.getFcPosition = function(refObj)
	{
		//var offsetX = offsetY = 0;
		var x = 0; var y = 0;
		var refX = 0; var refY = 0;
		var refWidth = 0; var refHeight = 0;
		var margin = 3;

		var scrollXY = getScrollXY();
		var scrollX = scrollXY[0];
		var scrollY = scrollXY[1];

		var screenXY = getWindowSize();
		var screenX = screenXY[0];
		var screenY = screenXY[1];

		var coords = getElementCoords(refObj);
		var refX = coords.left;
		var refY  = coords.top;

		var distanceToLeftEdge = refX - scrollX;
		var distanceToBottomEdge = screenY + scrollY - refY;

		// horizontal alignment
		if(distanceToLeftEdge < PALETTE_WIDTH)
			x = refX - distanceToLeftEdge;
		else
			x = refX - PALETTE_WIDTH;
		if(x < 0) 
			x = 0;
			
		// vertical alignment
		if(distanceToBottomEdge < PALETTE_HEIGHT)
			y = refY - PALETTE_HEIGHT - margin;
		else
			y = refY + refObj.height + margin;
		if(y < 0)
			y = 0;
		return [x, y];
	}

	this.setColor = function(color) {
		var decClr = parseInt(color, 16);
		valueFldObj.style.backgroundColor = "#" + color;
		valueFldObj.style.color =  "#" + color;
		//valueFldObj.value = decClr; // color
		selectFldObj.value = decClr;
		verifiedFldObj.value = 'y';
		labelObj.style.display = "block";
		this.close();
	}	
	
	this.onFcKeyUp = function(evt) {
		evt = (evt) ? evt : event;
		var charCode = (evt.charCode) ? evt.charCode : ((evt.keyCode) ? evt.keyCode : 
			((evt.which) ? evt.which : 0));
		if (charCode == 27)
			fixedClrPE.close();
	}
	
	this.frameClick = function() {
		//stopEventPropagation(event);
		skipClose = true;
	}

	// OUTSIDE the frame
	this.frameOut = function(event) {
		var related;
		if (window.event)
			related = window.event.toElement;
		else
			related = event.relatedTarget;

		if (frameObj != related && !contains(frameObj, related))
			timerid = setInterval("fixedClrPE.suspendedClose()", CLOSE_TIMEOUT);
	}

	// INSIDE the frame
	this.frameIn = function(event) {
		var related;
		if (window.event)
			related = window.event.toElement;
		else
			related = event.relatedTarget;

		if (frameObj == related || contains(frameObj, related))
			clearInterval(timerid);
	}

	function contains(a, b) {
		// Return true if node a contains node b.

		while (b.parentNode)
			if ((b = b.parentNode) == a)
			return true;
		return false;
	}

	this.suspendedClose = function() {
		clearInterval(timerid);
		this.close();
	}
	
	this.close = function()	{
		if(skipClose) {
			skipClose = false;
			return;
		}
	
		frameObj.style.visibility = "hidden";
		document.onmouseup = oldDocOnMouseUp;
		document.onkeyup = oldOnKeyUp;
	}
	
	// html code to insert into the frame.
	this.getPaletteContent = function()
	{
		var title = "<div class='menuTitle' style='margin:\"1px\"'>" + titleStr + "</div>";
		var palette =
			'<table cellpadding="0" cellspacing="1" border="1" align="left" id="myID">'   			+ '<tr>'
			+ '	<td id="#FFFFFF" bgcolor="#FFFFFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFFFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCCCC" bgcolor="#FFCCCC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCCCC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCC99" bgcolor="#FFCC99" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCC99\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFFF99" bgcolor="#FFFF99" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFF99\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFFFCC" bgcolor="#FFFFCC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFFCC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#99FF99" bgcolor="#99FF99" width="10" height="10" onmouseup="fixedClrPE.setColor(\'99FF99\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#99FFFF" bgcolor="#99FFFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'99FFFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CCFFFF" bgcolor="#CCFFFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CCFFFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CCCCFF" bgcolor="#CCCCFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CCCCFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCCFF" bgcolor="#FFCCFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCCFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#CCCCCC" bgcolor="#CCCCCC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CCCCCC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF6666" bgcolor="#FF6666" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF6666\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF9966" bgcolor="#FF9966" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF9966\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFFF66" bgcolor="#FFFF66" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFF66\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFFF33" bgcolor="#FFFF33" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFF33\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#66FF99" bgcolor="#66FF99" width="10" height="10" onmouseup="fixedClrPE.setColor(\'66FF99\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#33FFFF" bgcolor="#33FFFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'33FFFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#66FFFF" bgcolor="#66FFFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'66FFFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#9999FF" bgcolor="#9999FF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'9999FF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF99FF" bgcolor="#FF99FF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF99FF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#C0C0C0" bgcolor="#C0C0C0" width="10" height="10" onmouseup="fixedClrPE.setColor(\'C0C0C0\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF0000" bgcolor="#FF0000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF0000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF9900" bgcolor="#FF9900" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF9900\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCC66" bgcolor="#FFCC66" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCC66\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFFF00" bgcolor="#FFFF00" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFFF00\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#33FF33" bgcolor="#33FF33" width="10" height="10" onmouseup="fixedClrPE.setColor(\'33FF33\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#66CCCC" bgcolor="#66CCCC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'66CCCC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#33CCFF" bgcolor="#33CCFF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'33CCFF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#6666CC" bgcolor="#6666CC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'6666CC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CC66CC" bgcolor="#CC66CC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CC66CC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#999999" bgcolor="#999999" width="10" height="10" onmouseup="fixedClrPE.setColor(\'999999\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CC0000" bgcolor="#CC0000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CC0000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FF6600" bgcolor="#FF6600" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FF6600\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCC33" bgcolor="#FFCC33" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCC33\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#FFCC00" bgcolor="#FFCC00" width="10" height="10" onmouseup="fixedClrPE.setColor(\'FFCC00\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#33CC00" bgcolor="#33CC00" width="10" height="10" onmouseup="fixedClrPE.setColor(\'33CC00\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#00CCCC" bgcolor="#00CCCC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'00CCCC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#3366FF" bgcolor="#3366FF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'3366FF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#6633FF" bgcolor="#6633FF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'6633FF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CC33CC" bgcolor="#CC33CC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CC33CC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#666666" bgcolor="#666666" width="10" height="10" onmouseup="fixedClrPE.setColor(\'666666\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#990000" bgcolor="#990000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'990000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CC6600" bgcolor="#CC6600" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CC6600\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#CC9933" bgcolor="#CC9933" width="10" height="10" onmouseup="fixedClrPE.setColor(\'CC9933\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#999900" bgcolor="#999900" width="10" height="10" onmouseup="fixedClrPE.setColor(\'999900\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#009900" bgcolor="#009900" width="10" height="10" onmouseup="fixedClrPE.setColor(\'009900\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#339999" bgcolor="#339999" width="10" height="10" onmouseup="fixedClrPE.setColor(\'339999\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#3333FF" bgcolor="#3333FF" width="10" height="10" onmouseup="fixedClrPE.setColor(\'3333FF\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#6600CC" bgcolor="#6600CC" width="10" height="10" onmouseup="fixedClrPE.setColor(\'6600CC\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#993399" bgcolor="#993399" width="10" height="10" onmouseup="fixedClrPE.setColor(\'993399\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#333333" bgcolor="#333333" width="10" height="10" onmouseup="fixedClrPE.setColor(\'333333\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#660000" bgcolor="#660000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'660000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#993300" bgcolor="#993300" width="10" height="10" onmouseup="fixedClrPE.setColor(\'993300\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#996633" bgcolor="#996633" width="10" height="10" onmouseup="fixedClrPE.setColor(\'996633\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#666600" bgcolor="#666600" width="10" height="10" onmouseup="fixedClrPE.setColor(\'666600\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#006600" bgcolor="#006600" width="10" height="10" onmouseup="fixedClrPE.setColor(\'006600\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#336666" bgcolor="#336666" width="10" height="10" onmouseup="fixedClrPE.setColor(\'336666\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#000099" bgcolor="#000099" width="10" height="10" onmouseup="fixedClrPE.setColor(\'000099\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#333399" bgcolor="#333399" width="10" height="10" onmouseup="fixedClrPE.setColor(\'333399\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#663366" bgcolor="#663366" width="10" height="10" onmouseup="fixedClrPE.setColor(\'663366\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '<tr>'
			+ '	<td id="#000000" bgcolor="#000000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'000000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#330000" bgcolor="#330000" width="10" height="10" onmouseup="fixedClrPE.setColor(\'330000\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#663300" bgcolor="#663300" width="10" height="10" onmouseup="fixedClrPE.setColor(\'663300\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#663333" bgcolor="#663333" width="10" height="10" onmouseup="fixedClrPE.setColor(\'663333\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#333300" bgcolor="#333300" width="10" height="10" onmouseup="fixedClrPE.setColor(\'333300\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#003300" bgcolor="#003300" width="10" height="10" onmouseup="fixedClrPE.setColor(\'003300\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#003333" bgcolor="#003333" width="10" height="10" onmouseup="fixedClrPE.setColor(\'003333\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#000066" bgcolor="#000066" width="10" height="10" onmouseup="fixedClrPE.setColor(\'000066\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#330099" bgcolor="#330099" width="10" height="10" onmouseup="fixedClrPE.setColor(\'330099\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '	<td id="#330033" bgcolor="#330033" width="10" height="10" onmouseup="fixedClrPE.setColor(\'330033\');" onmouseover="this.style.cursor=\'pointer\';"></td>'
			+ '</tr>'
			+ '</table>';
		
		return title + palette;
	}
}