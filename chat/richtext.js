// Cross-Browser Rich Text Editor
// http://www.kevinroth.com/rte/demo.htm

//init variables
var isRichText = false;
var rng;
var currentRTE;
var allRTEs = "";

var isIE;
var isGecko;
var isSafari;
var isKonqueror;

var imagesPath;
var includesPath;
var cssFile;

var textChanged = false;

function addEvent(obj, evType, fn, useCapture) {
  if (obj.addEventListener) { // NS
   obj.addEventListener(evType, fn, useCapture);
   return true;
 } else if (obj.attachEvent) { // IE
     var r = obj.attachEvent("on" + evType, fn);
     return r;
   } else {
       alert("You need to upgrade to a newer browser. Error: 'handler could not be attached'");
     }
}

function initRTE(imgPath, incPath, css, rte) {
	//set browser vars
	var ua = navigator.userAgent.toLowerCase();
	isIE = ((ua.indexOf("msie") != -1) && (ua.indexOf("opera") == -1) && (ua.indexOf("webtv") == -1));
	isGecko = (ua.indexOf("gecko") != -1);
	isSafari = (ua.indexOf("safari") != -1);
	isKonqueror = (ua.indexOf("konqueror") != -1);

	//check to see if designMode mode is available
	if (document.getElementById && document.designMode && !isSafari && !isKonqueror) {
		isRichText = true;
	}

	if (!isIE) document.captureEvents(Event.MOUSEOVER | Event.MOUSEOUT | Event.MOUSEDOWN | Event.MOUSEUP);
	document.onmouseover = raiseButton;
	document.onmouseout  = normalButton;
	document.onmousedown = lowerButton;
	document.onmouseup   = raiseButton;

	//set paths vars
	imagesPath = imgPath;
	includesPath = incPath;
	cssFile = css;

	var divRTEcontainerObj = document.getElementById(rte+'dv');// div that contains RTE inside
  if(divRTEcontainerObj && divRTEcontainerObj.innerHTML) divRTEcontainerObj.innerHTML = '';
  if (isRichText && divRTEcontainerObj) divRTEcontainerObj.innerHTML = '<style type="text/css">@import "' + includesPath + 'rte.css";</style>';

	//for testing standard textarea, uncomment the following line
	//isRichText = false;
}

function writeRichText(rte, html, width, height, buttons, readOnly, minimized, isChat) {
	if (isRichText) {
		if (allRTEs.length > 0) allRTEs += ";";
		allRTEs += rte;
		writeRTE(rte, html, width, height, buttons, readOnly, minimized, isChat);
	} else {
		writeDefault(rte, html, width, height, buttons, readOnly);
	}
}

function writeDefault(rte, html, width, height, buttons, readOnly) {
	if (!readOnly) {
		document.writeln('<textarea name="' + rte + '" id="' + rte + '" style="width: ' + width + 'px; height: ' + height + 'px;">' + html + '</textarea>');
	} else {
		document.writeln('<textarea name="' + rte + '" id="' + rte + '" style="width: ' + width + 'px; height: ' + height + 'px;" readonly>' + html + '</textarea>');
	}
}

function raiseButton(e) {
	if (isIE) {
		var el = window.event.srcElement;
	} else {
		var el= e.target;
	}

	try{
    className = el.className;
	  if (className == 'rteImage' || className == 'rteImageLowered') {
		  el.className = 'rteImageRaised';
	  }
  }catch(ex){}
}

function normalButton(e) {
	if (isIE) {
		var el = window.event.srcElement;
	} else {
		var el= e.target;
	}

	className = el.className;
	if (className == 'rteImageRaised' || className == 'rteImageLowered') {
		el.className = 'rteImage';
	}
}

function lowerButton(e) {
	if (isIE) {
		var el = window.event.srcElement;
	} else {
		var el= e.target;
	}

	className = el.className;
	if (className == 'rteImage' || className == 'rteImageRaised') {
		el.className = 'rteImageLowered';
	}
}

// inserts smile icon to the cursor position
function insertSmile(rte, smile)
{
	var oRTE = frames[rte];
	oRTE.focus();
    oRTE.document.execCommand('InsertImage', false, smile);
	oRTE.focus();
}

function writeRTE(rte, html, width, height, buttons, readOnly, minimized, isChat) {
  if (readOnly) buttons = false;

	var divRTEcontainerObj = document.getElementById(rte+'dv');// div that contains RTE inside
  //divRTEcontainerObj.innerHTML = '';
  var rteHtmlStructure = divRTEcontainerObj.innerHTML;
  
  //adjust minimum table widths
	if (isIE) {
		if (buttons && (width < 600)) width = 600;
		var tablewidth = width;
	} else {
		if (buttons && (width < 500)) width = 500;
		var tablewidth = width + 4;
	}
  // ---- start------ building of the RTE structure. First the RTE panel is built.
	if (buttons == true) {
		if(minimized)
		  rteHtmlStructure += '<table align="center" class="rteBack" style="display:none" cellpadding=0 cellspacing=0 id="Buttons1_' + rte + '" width="100%">';
		 else rteHtmlStructure += '<table align="center" class="rteBack" cellpadding=0 cellspacing=0 id="Buttons1_' + rte + '" width="100%">';
		 rteHtmlStructure += '	<tr align="center" style="white-space : nowrap; word-spacing : 0px; 	white-space : nowrap;">';
		 rteHtmlStructure += '		<td width="100%" cellpadding=0 cellspacing=0 valign="top" align="center" id="Buttons1_td' + rte + '">';
		 if( !isChat ) {
       rteHtmlStructure += '			<select style="width:75px;vertical-align : top;" id="formatblock_' + rte + '" onchange="Select(\'' + rte + '\', this.id);">';
		   rteHtmlStructure += '				<option value="">[Style]</option>';
		   rteHtmlStructure += '				<option value="<p>">Paragraph</option>';
		   rteHtmlStructure += '				<option value="<h1>">Heading 1 <h1></option>';
		   rteHtmlStructure += '				<option value="<h2>">Heading 2 <h2></option>';
		   rteHtmlStructure += '				<option value="<h3>">Heading 3 <h3></option>';
		   rteHtmlStructure += '				<option value="<h4>">Heading 4 <h4></option>';
		   rteHtmlStructure += '				<option value="<h5>">Heading 5 <h5></option>';
		   rteHtmlStructure += '				<option value="<h6>">Heading 6 <h6></option>';
		   rteHtmlStructure += '				<option value="<address>">Address <ADDR></option>';
		   rteHtmlStructure += '				<option value="<pre>">Formatted <pre></option>';
		   rteHtmlStructure += '			</select>';
     
       rteHtmlStructure += '			<select style="width:113px;vertical-align : top;" id="fontname_' + rte + '" onchange="Select(\'' + rte + '\', this.id)">';
		   rteHtmlStructure += '				<option value="Font" selected>[Font]</option>';
		   rteHtmlStructure += '				<option value="Arial, Helvetica, sans-serif">Arial</option>';
		   rteHtmlStructure += '				<option value="Courier New, Courier, mono">Courier New</option>';
		   rteHtmlStructure += '				<option value="Times New Roman, Times, serif">Times New Roman</option>';
		   rteHtmlStructure += '				<option value="Verdana, Arial, Helvetica, sans-serif">Verdana</option>';
		   rteHtmlStructure += '			</select>';
     
		   rteHtmlStructure += '			<select style="width:57px;vertical-align : top;" unselectable="on" id="fontsize_' + rte + '" onchange="Select(\'' + rte + '\', this.id);">';
		   rteHtmlStructure += '				<option value="Size">[Size]</option>';
		   rteHtmlStructure += '				<option value="1">1</option>';
		   rteHtmlStructure += '				<option value="2">2</option>';
		   rteHtmlStructure += '				<option value="3">3</option>';
		   rteHtmlStructure += '				<option value="4">4</option>';
		   rteHtmlStructure += '				<option value="5">5</option>';
		   rteHtmlStructure += '				<option value="6">6</option>';
		   rteHtmlStructure += '				<option value="7">7</option>';
		   rteHtmlStructure += '			</select>';
     }
		 rteHtmlStructure += '			<select style="width:95px;vertical-align : top;" unselectable="on" id="smile_' + rte + '" onchange="insertSmile(\''+rte+'\',this.value);this.selectedIndex = 0;">';
		 rteHtmlStructure += '				<option value="Smile" selected>[Smile]</option>';
		 rteHtmlStructure += '				<option value="images/smileys/smiley.gif">smiley&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- :)</option>';
		 rteHtmlStructure += '				<option value="images/smileys/wink.gif">wink&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - ;)</option>';
		 rteHtmlStructure += '				<option value="images/smileys/sad.gif">sad&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - :(</option>';
		 rteHtmlStructure += '				<option value="images/smileys/laughting.gif">laughting - :D</option>';
		 rteHtmlStructure += '			</select>';
		 rteHtmlStructure += '		  <img align="absmiddle" class="rteImage" src="' + imagesPath + 'bold1.gif" width="13" height="13" alt="Bold" title="Bold" onClick="FormatText(\'' + rte + '\', \'bold\', \'\')">';
		 rteHtmlStructure += '		  <img align="absmiddle" class="rteImage" src="' + imagesPath + 'italic1.gif" width="13" height="13" alt="Italic" title="Italic" onClick="FormatText(\'' + rte + '\', \'italic\', \'\')">';
		 rteHtmlStructure += '		  <img align="absmiddle" class="rteImage" src="' + imagesPath + 'underline1.gif" width="13" height="13" alt="Underline" title="Underline" onClick="FormatText(\'' + rte + '\', \'underline\', \'\')">';
		 rteHtmlStructure += '		  <img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">';
		 if( !isChat ) {
       rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'left_just1.gif" width="13" height="13" alt="Align Left" title="Align Left" onClick="FormatText(\'' + rte + '\', \'justifyleft\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'centre1.gif" width="13" height="13" alt="Center" title="Center" onClick="FormatText(\'' + rte + '\', \'justifycenter\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'right_just1.gif" width="13" height="13" alt="Align Right" title="Align Right" onClick="FormatText(\'' + rte + '\', \'justifyright\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'justifyfull1.gif" width="13" height="13" alt="Justify Full" title="Justify Full" onclick="FormatText(\'' + rte + '\', \'justifyfull\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">';
  		 rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'hr1.gif" width="13" height="13" alt="Horizontal Rule" title="Horizontal Rule" onClick="FormatText(\'' + rte + '\', \'inserthorizontalrule\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">';
       rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'numbered_list1.gif" width="13" height="13" alt="Ordered List" title="Ordered List" onClick="FormatText(\'' + rte + '\', \'insertorderedlist\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'list1.gif" width="13" height="13" alt="Unordered List" title="Unordered List" onClick="FormatText(\'' + rte + '\', \'insertunorderedlist\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'outdent1.gif" width="13" height="13" alt="Outdent" title="Outdent" onClick="FormatText(\'' + rte + '\', \'outdent\', \'\')">';
		   rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'indent1.gif" width="13" height="13" alt="Indent" title="Indent" onClick="FormatText(\'' + rte + '\', \'indent\', \'\')">';
		 }

     rteHtmlStructure += '		<span id="forecolor_' + rte + '">';
		 rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'textcolor1.gif" width="13" height="13" alt="Text Color" title="Text Color" onClick="FormatText(\'' + rte + '\', \'forecolor\', \'\')"></span>';

		 rteHtmlStructure += '		<span id="hilitecolor_' + rte + '"><img align="absmiddle" class="rteImage" src="' + imagesPath + 'bgcolor1.gif" width="13" height="13" alt="Background Color" title="Background Color" onClick="FormatText(\'' + rte + '\', \'hilitecolor\', \'\')"></span>';
		 rteHtmlStructure += '		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">';
		 rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'hyperlink1.gif" width="13" height="13" alt="Insert Link" title="Insert Link" onClick="FormatText(\'' + rte + '\', \'createlink\')">';
		 rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'image1.gif" width="13" height="13" alt="Add Image" title="Add Image" onClick="AddImage(\'' + rte + '\')">';
	   if( !isChat ) {
       rteHtmlStructure += '		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'readOnly.gif" width="13" height="13" alt="view source" title="view source" onclick="var chk = document.getElementById(\'chkSrc' + rte + '\'); if(chk.checked==true)chk.checked=false; else chk.checked=true; toggleHTMLSrc(\'' + rte + '\');">';
       rteHtmlStructure += '		<span id="table_' + rte + '"><img class="rteImage" align="absmiddle" src="' + imagesPath + 'insert_table1.gif" width="15" height="13" alt="Insert Table" title="Insert Table" onClick="dlgInsertTable(\'' + rte + '\', \'table\', \'\')"></span>';
     }

		rteHtmlStructure += '		</td>';
		rteHtmlStructure += '	</tr>';
		rteHtmlStructure += '</table>';
		if(minimized) rteHtmlStructure += '<br>';
	}
  // ---- finish------ building of the RTE structure. First the RTE panel is built.
  
  rteHtmlStructure += '<textarea id="txtArea' + rte + '" width="' + width + 'px" readonly style="display:none"></textarea>';

  //View Source checkbox
	if (!readOnly) rteHtmlStructure += '<br /><input type="checkbox" id="chkSrc' + rte + '" onclick="toggleHTMLSrc(\'' + rte + '\');" style="display:none" />';
	
  // ---- start ------- define a color palette table --------------
  rteHtmlStructure += '<table cellpadding="0" cellspacing="1" border="1" align="center" id="cp' + rte + '" style="visibility:hidden; display: none; position: absolute; width:130; height:80">';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#FFFFFF" bgcolor="#FFFFFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCCCC" bgcolor="#FFCCCC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCC99" bgcolor="#FFCC99" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFFF99" bgcolor="#FFFF99" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFFFCC" bgcolor="#FFFFCC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#99FF99" bgcolor="#99FF99" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#99FFFF" bgcolor="#99FFFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CCFFFF" bgcolor="#CCFFFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CCCCFF" bgcolor="#CCCCFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCCFF" bgcolor="#FFCCFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#CCCCCC" bgcolor="#CCCCCC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF6666" bgcolor="#FF6666" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF9966" bgcolor="#FF9966" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFFF66" bgcolor="#FFFF66" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFFF33" bgcolor="#FFFF33" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#66FF99" bgcolor="#66FF99" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#33FFFF" bgcolor="#33FFFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#66FFFF" bgcolor="#66FFFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#9999FF" bgcolor="#9999FF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF99FF" bgcolor="#FF99FF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#C0C0C0" bgcolor="#C0C0C0" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF0000" bgcolor="#FF0000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF9900" bgcolor="#FF9900" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCC66" bgcolor="#FFCC66" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFFF00" bgcolor="#FFFF00" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#33FF33" bgcolor="#33FF33" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#66CCCC" bgcolor="#66CCCC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#33CCFF" bgcolor="#33CCFF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#6666CC" bgcolor="#6666CC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CC66CC" bgcolor="#CC66CC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#999999" bgcolor="#999999" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CC0000" bgcolor="#CC0000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FF6600" bgcolor="#FF6600" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCC33" bgcolor="#FFCC33" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#FFCC00" bgcolor="#FFCC00" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#33CC00" bgcolor="#33CC00" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#00CCCC" bgcolor="#00CCCC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#3366FF" bgcolor="#3366FF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#6633FF" bgcolor="#6633FF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CC33CC" bgcolor="#CC33CC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#666666" bgcolor="#666666" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#990000" bgcolor="#990000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CC6600" bgcolor="#CC6600" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#CC9933" bgcolor="#CC9933" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#999900" bgcolor="#999900" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#009900" bgcolor="#009900" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#339999" bgcolor="#339999" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#3333FF" bgcolor="#3333FF" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#6600CC" bgcolor="#6600CC" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#993399" bgcolor="#993399" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#333333" bgcolor="#333333" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#660000" bgcolor="#660000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#993300" bgcolor="#993300" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#996633" bgcolor="#996633" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#666600" bgcolor="#666600" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#006600" bgcolor="#006600" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#336666" bgcolor="#336666" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#000099" bgcolor="#000099" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#333399" bgcolor="#333399" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#663366" bgcolor="#663366" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
	rteHtmlStructure += '<tr>';
	rteHtmlStructure += '	<td id="#000000" bgcolor="#000000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#330000" bgcolor="#330000" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#663300" bgcolor="#663300" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#663333" bgcolor="#663333" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#333300" bgcolor="#333300" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#003300" bgcolor="#003300" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#003333" bgcolor="#003333" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#000066" bgcolor="#000066" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#330099" bgcolor="#330099" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '	<td id="#330033" bgcolor="#330033" width="10" height="10" onclick="self.parent.setColor(this.id);" onmouseout="this.style.border=\'1px solid gray\';" onmouseover="this.style.border=\'1px dotted white\';"><img width="1" height="1"></td>';
	rteHtmlStructure += '</tr>';
  rteHtmlStructure += '</table>';
  // ---- finish ------- define a color palette table --------------
  
  divRTEcontainerObj.innerHTML = rteHtmlStructure; // write html structure to the div that will contain RTE.
  enableDesignMode(rte, html, readOnly, minimized, isChat); // Enable iframe design mode 
  // the RTE panel must be visible. THat is why the div that containes it must have correct height (the height of the RTE panel)
  if(isChat)
    divRTEcontainerObj.style.height = document.getElementById("Buttons1_" + rte).offsetHeight + 5;
}

// switch RTE iframe design mode on. THis function also loads the content (any value) to RTE.
function enableDesignMode(rte, html, readOnly, minimized, isChat) {
  var frameHtml = "<html id=\"" + rte + "\">\n";
	frameHtml += "<head>\n";
	//to reference your stylesheet, set href property below to your stylesheet path and uncomment
	if (cssFile.length > 0) {
		frameHtml += "<link media=\"all\" type=\"text/css\" href=\"" + cssFile + "\" rel=\"stylesheet\">\n";
	} else {
		frameHtml += "<style>\n";
		frameHtml += "body {\n";
		frameHtml += "	background: #FFFFFF;\n";
		frameHtml += "	margin: 0px;\n";
		frameHtml += "	padding: 0px;\n";
		frameHtml += "}\n";
		frameHtml += "</style>\n";
	}
	frameHtml += "</head>\n";
	frameHtml += "<body>\n";
	frameHtml += html + "\n";
	frameHtml += "</body>\n";
	frameHtml += "</html>";

	document.getElementById('Buttons1_' + rte).style.display = 'inline'; 
  if (document.all) { // Internet Explorer (IE) case
		var oRTE = frames[rte].document;
		if (!readOnly) oRTE.designMode = "On";
		
		if(!minimized && !isChat){ // this is not chat and RTE is not minimized
                   // In this section click and keyup events are added to the RTE iframe using addEvent function so that
                   // onclick RTE area must suit the entered text. click event makes the RTE input text area as big as the text inside,
                   // but not bigger than 330 px (The height is set to 330px in this case).
                   // keyup event is used to check the height of the RTE area and the text inside of it the  so that the area must be as big
                   // as the text inside but not more than 330px. This event is hadled when the used types anything inside the area.
		  addEvent(frames[rte].document, 'click', function() {
                                                frames[rte].document.body.style.margin = 0; // set RTE margin to 0 so that there is no space between RTE's iframe left border and the entered text
                                                document.getElementById('Buttons1_' + rte).style.display = 'inline'; // show RTE panel
                                                if(frames[rte].document.body.scrollHeight >= 330) 
                                                  document.getElementById(rte).style.height = 330; 
                                                 else
                                                   if(this.attachEvent)
                                                     document.getElementById(rte).style.height = frames[rte].document.body.scrollHeight+20;
                                                    else 
                                                      document.getElementById(rte).style.height = frames[rte].document.body.offsetHeight+10;
                                                if(rte == 'notes') // if rte is 'notes' RTE on the page then RTE's iframe is a floating iframe that i smoved to the necessary place.
                                                                   // this section is used to make the feeling that the floated iframe is integrated to the page (elseway when the iframe grows - it overlaps the page below it)
                                                                   // that is why the RteIframe div becomes resized when the iframe is resized ( when it's height is changed )
                                                  document.getElementById('RteIframe').style.height = document.getElementById(rte).offsetHeight;
                                              }, false);
		  addEvent(frames[rte].document, 'keyup', function() {
                                                textChanged = true;
                                                if(document.getElementById(rte+'content'))
                                                  document.getElementById(rte+'content').value = frames[rte].document.body.innerHTML;
                                                frames[rte].document.body.style.margin = 0; // set RTE margin to 0 so that there is no space between RTE's iframe left border and the entered text
                                                document.getElementById('Buttons1_' + rte).style.display = 'inline'; // show RTE panel
                                                if(frames[rte].document.body.scrollHeight >= 330) 
                                                  document.getElementById(rte).style.height = 330; 
                                                 else 
                                                   if(this.attachEvent)
                                                     document.getElementById(rte).style.height = frames[rte].document.body.scrollHeight+20;
                                                    else 
                                                      document.getElementById(rte).style.height = frames[rte].document.body.offsetHeight+10;
                                                 if(rte == 'notes')// if rte is 'notes' RTE on the page then RTE's iframe is a floating iframe that i smoved to the necessary place.
                                                                   // this section is used to make the feeling that the floated iframe is integrated to the page (elseway when the iframe grows - it overlaps the page below it)
                                                                   // that is why the RteIframe div becomes resized when the iframe is resized ( when it's height is changed )
                                                   document.getElementById('RteIframe').style.height = document.getElementById(rte).offsetHeight;
                                              },false);
      // Show rte with the text inside and set correct RTE sizes 
      // THis must happen after 300 ms to let iframe initiated on the page.
      // This is an IE specific. FF is fine.
      html = replaceAllRecursion(html,"\n","<br>");
      html = replaceAllRecursion(html,"\r","");
      setTimeout("frames['"+rte+"'].document.body.innerHTML = '"+html+"';" +
                 "frames['"+rte+"'].focus();" +
                 "frames['"+rte+"'].document.body.style.margin = 0;" +
                 "if(frames['"+rte+"'].document.body.scrollHeight >= 330)"+
                 "  document.getElementById('"+rte+"').style.height = 330;"+ 
                 " else"+
                 "   document.getElementById('"+rte+"').style.height = frames['"+rte+"'].document.body.scrollHeight+20;",300);
		}
	} else { // FireFox (FF) case
    if (document.getElementById(rte) == null) {
      //gecko may take some time to enable design mode.
      //Keep looping until able to set.
      if (isGecko) {
        setTimeout("enableDesignMode('" + rte + "', '" + html + "', " + readOnly + ", " + minimized + ");", 10);
      }
      else { // should not have happened - do not know what to do
        return false;
      }
    }
    else {
	    if (!readOnly) document.getElementById(rte).contentDocument.designMode = "on";
			try {
        frames[rte].document.body.innerHTML = html;
				var oRTE = document.getElementById(rte).contentWindow.document;
        frames[rte].focus();
				if (isGecko && !readOnly) {
					//attach a keyboard handler for gecko browsers to make keyboard shortcuts work
					oRTE.addEventListener("keypress", kb_handler, true);
					if(!minimized && !isChat) { // the RTE is not minimized (i.e. RTE panell is not displayed and RTE area width="40px" height="30px") and this is not chat RTE
                          // In this section click and keyup events are added to the RTE iframe using addEvent function so that
                          // onclick RTE area must suit the entered text. click event makes the RTE input text area as big as the text inside,
                          // but not bigger than 330 px (The height is set to 330px in this case).
                          // keyup event is used to check the height of the RTE area and the text inside of it the  so that the area must be as big
                          // as the text inside but not more than 330px. This event is hadled when the used types anything inside the area.
					  addEvent(frames[rte].document, 'click', function() {
                                                      frames[rte].document.body.style.margin = 0; // set RTE margin to 0 so that there is no space between RTE's iframe left border and the entered text
                                                      if(frames[rte].document.body.scrollHeight >= 330) 
                                                        document.getElementById(rte).style.height = 330; 
                                                       else if(frames[rte].document.body.offsetHeight > 20)
                                                         if(this.attachEvent)
                                                           document.getElementById(rte).style.height = frames[rte].document.body.scrollHeight+20;
                                                          else 
                                                            document.getElementById(rte).style.height = frames[rte].document.body.offsetHeight+20;
                                                         else document.getElementById(rte).style.height = 40;   
                                                      if(rte == 'notes' || (rte == 'description' && window.location.toString().indexOf('readOnlyProperties.html')>0)) 
                                                                   // if rte is 'notes' RTE on the page then RTE's iframe is a floating iframe that i smoved to the necessary place.
                                                                   // this section is used to make the feeling that the floated iframe is integrated to the page (elseway when the iframe grows - it overlaps the page below it)
                                                                   // that is why the RteIframe div becomes resized when the iframe is resized ( when it's height is changed )
                                                                   // THere is another specification when 'description' RTE is used for writing comment but not description on the edit page f.e.
                                                                   // THat is why window.location is checked.
                                                        document.getElementById('RteIframe').style.height = document.getElementById(rte).offsetHeight; 
                                                    }, false);
					  addEvent(frames[rte].document, 'keyup', function() {
                                                      textChanged = true; 
                                                      if(document.getElementById(rte+'content'))
                                                        document.getElementById(rte+'content').value = frames[rte].document.body.innerHTML;
                                                      frames[rte].document.body.style.margin = 0; // set RTE margin to 0 so that there is no space between RTE's iframe left border and the entered text
                                                      if(frames[rte].document.body.offsetHeight >= 330) 
                                                        document.getElementById(rte).style.height = 330; 
                                                       else if(frames[rte].document.body.offsetHeight > 20)
                                                         if(this.attachEvent)
                                                           document.getElementById(rte).style.height = frames[rte].document.body.scrollHeight+10;
                                                          else 
                                                            document.getElementById(rte).style.height = frames[rte].document.body.offsetHeight+20;
                                                        else document.getElementById(rte).style.height = 40;
                                                      if(rte == 'notes' || (rte == 'description' && window.location.toString().indexOf('readOnlyProperties.html')>0))
                                                                   // if rte is 'notes' RTE on the page then RTE's iframe is a floating iframe that i smoved to the necessary place.
                                                                   // this section is used to make the feeling that the floated iframe is integrated to the page (elseway when the iframe grows - it overlaps the page below it)
                                                                   // that is why the RteIframe div becomes resized when the iframe is resized ( when it's height is changed )
                                                                   // THere is another specification when 'description' RTE is used for writing comment but not description on the edit page f.e.
                                                                   // THat is why window.location is checked.
                                                        document.getElementById('RteIframe').style.height = document.getElementById(rte).offsetHeight;
                                                    },false);
            frames[rte].document.body.style.margin = 0;
            // set correct RTE size when RTE is initiated. The RTE size must be "suitable" to it's content.
            document.getElementById(rte).style.height = 10; // hack - some height value must be set to make FF initiate all iframe variables like offsetHeight
            if(frames[rte].document.body.offsetHeight >= 330) 
              document.getElementById(rte).style.height = 330; 
             else if(frames[rte].document.body.offsetHeight > 20)
                    document.getElementById(rte).style.height = frames[rte].document.body.offsetHeight + 20;
              else document.getElementById(rte).style.height = 40;
            if(html == '' || window.location.toString().indexOf('readOnlyProperties.html')>0) { // if no content could be loaded to RTE then the height must be 40px
              document.getElementById(rte).style.height = 40;
              document.getElementById(rte).style.width = 10;
              // FF needs any time to load correct Buttons1_ rte panel width value
              setTimeout("document.getElementById('"+rte+"').style.width = document.getElementById('Buttons1_"+rte+"').offsetWidth;",300); 
            }
					}
				}
			} catch (e) {
				alert("Error preloading content.");
			}
    }
	}
}

// recursive function that looks for all URLs in RTE to replace them with link
// image and the title (title is a link itself).
function processURLs(stringWithUrl) { 
  return   stringWithUrl;
  var httpPresent = false;
  firstEntrance = -1;

  var firstEntrance_1 = stringWithUrl.indexOf('http:\/\/');
  var firstEntrance_2 = stringWithUrl.indexOf('www.');

  if(firstEntrance_1==-1 && firstEntrance_2==-1) return stringWithUrl;

  if(firstEntrance_1!=-1 && firstEntrance_2==-1) {firstEntrance = firstEntrance_1; httpPresent = true;}
    else
	  if(firstEntrance_1==-1 && firstEntrance_2!=-1) firstEntrance = firstEntrance_2;
	    else
		  if(firstEntrance_1 < firstEntrance_2) {firstEntrance = firstEntrance_1; httpPresent = true;}
		    else
			  if(firstEntrance_2 < firstEntrance_1) firstEntrance = firstEntrance_2;

  if(firstEntrance != -1)
  {
	  var urlLink = "";
	  var idexOfTheEndOfTheUrl = firstEntrance;
	  for(;idexOfTheEndOfTheUrl < stringWithUrl.length;idexOfTheEndOfTheUrl++)
	  {
		  if(stringWithUrl.charAt(idexOfTheEndOfTheUrl)==' ' || stringWithUrl.charAt(idexOfTheEndOfTheUrl)=='<' || stringWithUrl.charAt(idexOfTheEndOfTheUrl)=='"' || stringWithUrl.charAt(idexOfTheEndOfTheUrl)=="'")
		  {
			  if(stringWithUrl.charAt(idexOfTheEndOfTheUrl-1)=='.')
				  idexOfTheEndOfTheUrl=idexOfTheEndOfTheUrl-1;
			  break;
		  }
    }

    if(stringWithUrl.charAt(idexOfTheEndOfTheUrl-1)=='.')
	  idexOfTheEndOfTheUrl--;

	  urlLink += stringWithUrl.substring(0,firstEntrance);

    if(stringWithUrl.substring(firstEntrance-6,firstEntrance)=='href="' || stringWithUrl.substring(firstEntrance-6,firstEntrance)=='title=' || stringWithUrl.substring(firstEntrance-5,firstEntrance)=='src="' || stringWithUrl.substring(firstEntrance-7,firstEntrance)=='title="') {
      if(!httpPresent)
        urlLink_href='http:\/\/' + stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
       else
         urlLink_href=stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
      urlLink += urlLink_href;
	}
	else {
    if(!httpPresent)
      urlLink_href='http:\/\/' + stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
     else
       urlLink_href=stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
	   var chkURL = urlLink.substring(urlLink.length-2, urlLink.length);
	   if(chkURL!='">') {
	     urlLink +="<a href='"+urlLink_href+"'><img src='/images/wysiwyg/hyperlink.gif' title=\""+urlLink_href+"\" width='24' height='24' border='0'></a>";
	   }
	   else {
	     urlLink = urlLink.substring(0,urlLink.length-1);
	     urlLink += " target='_blank'><img src='/images/wysiwyg/hyperlink.gif' title=\""+urlLink_href+"\" width='24' height='24' border='0'>";
     }
	}

	var restUrl = stringWithUrl.substring(idexOfTheEndOfTheUrl, stringWithUrl.length);
  return urlLink + processURLs(restUrl);
  }
}

// this function is called when there are a lot of RTEs on the page. 
// It uses allRTEs variable to get the list of names into the array. 
// Then updateRTE() is called for every RTE.
function updateRTEs() { 
	var vRTEs = allRTEs.split(";");
	for (var i = 0; i < vRTEs.length; i++) {
		//---- Replacing of all urls with link image not to make the page too wide cuz of long url
		var frame = frames[vRTEs[i]];
		if (!frame)
        continue;
		frames[vRTEs[i]].document.body.innerHTML = processURLs(frames[vRTEs[i]].document.body.innerHTML);
		//alert(frames[vRTEs[i]].document.body.innerHTML);
		updateRTE(vRTEs[i]);
	}
}

// "updates RTE". RTE is created together with the hidden HTML object (<input type="Hidden">). This hidden field
// has the same name RTE has (to submit form with the needed RTE content) but it has another 
// id (to get correct access to it via getElementById).
// Forms can not get directly design mode iframe content when submitting it. That is why hidden field with the same
// name is created. THis function copies the RTE content to the hidden field.
function updateRTE(rte) {
  if(!textChanged){
	  if(document.getElementById(rte+'content'))
	    document.getElementById('hdn' + rte).value = document.getElementById(rte+'content').value;
	  return;
	}
  // if there is textarea for RTE to contain it's content for BACK/FORWARD browsers buttons preserving
  // then the content of RTE is copied to this textarea
  if(document.getElementById(rte+'content'))
    document.getElementById(rte+'content').value = frames[rte].document.body.innerHTML;

	if (!isRichText) return;
	 
	//set message value
	var oHdnMessage = document.getElementById('hdn' + rte);
	var oRTE = document.getElementById(rte);
	var readOnly = false;

	//check for readOnly mode
	if (document.all) {
		if (frames[rte].document.designMode != "On") readOnly = true;
	} else {
		if (document.getElementById(rte).contentDocument.designMode != "on") readOnly = true;
	}

	if (isRichText && !readOnly) {
	//if (!readOnly) {
		//if viewing source, switch back to design view
		if (document.getElementById("chkSrc" + rte).checked) {
			document.getElementById("chkSrc" + rte).checked = false;
			toggleHTMLSrc(rte);
		}

		if (oHdnMessage.value == null) oHdnMessage.value = "";
		if (document.all) {
			oHdnMessage.value = frames[rte].document.body.innerHTML;
		} else {
			oHdnMessage.value = oRTE.contentWindow.document.body.innerHTML;
		}

		//if there is no content (other than formatting) set value to nothing
		if (stripHTML(oHdnMessage.value.replace("&nbsp;", " ")) == ""
			&& oHdnMessage.value.toLowerCase().search("<hr") == -1
			&& oHdnMessage.value.toLowerCase().search("<img") == -1) oHdnMessage.value = "";
		//fix for gecko
		if (escape(oHdnMessage.value) == "%3Cbr%3E%0D%0A%0D%0A%0D%0A") oHdnMessage.value = "";
		//oHdnMessage.value = escape(oHdnMessage.value);
	}
}

// switch "view source" mode on/off.
// iframe in design mode will containe it's innerText if "view source" is on.
function toggleHTMLSrc(rte) {
	var oRTE;
	if (document.all) {
		oRTE = frames[rte].document;
	} else {
		oRTE = document.getElementById(rte).contentWindow.document;
	}

	if (document.getElementById("chkSrc" + rte).checked) {
		document.getElementById("Buttons1_" + rte).style.visibility = "visible";
		var inHTML = oRTE.body.innerHTML;
		if (document.all) {
			oRTE.body.innerText = oRTE.body.innerHTML;
		} else {
			var htmlSrc = oRTE.createTextNode(oRTE.body.innerHTML);
			oRTE.body.innerHTML = "";
			oRTE.body.appendChild(htmlSrc);
		}
		document.getElementById('txtArea' + rte).value = inHTML;
		document.getElementById('txtArea' + rte).style.height = document.getElementById(rte).style.height;
		document.getElementById('txtArea' + rte).style.width = document.getElementById(rte).style.width;
		document.getElementById(rte).style.display = 'none';
		document.getElementById('txtArea' + rte).style.display = 'inline';
	} else {
		document.getElementById("Buttons1_" + rte).style.visibility = "visible";
		document.getElementById('txtArea' + rte).style.display = 'none';
		document.getElementById(rte).style.display = 'inline';
		if (document.all) {
			//fix for IE
			var output = escape(oRTE.body.innerText);
			output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
			output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
			
			oRTE.body.innerHTML = unescape(output);
		} else {
			var htmlSrc = oRTE.body.ownerDocument.createRange();
			htmlSrc.selectNodeContents(oRTE.body);
			oRTE.body.innerHTML = htmlSrc.toString();
            document.getElementById(rte).contentDocument.designMode = 'on';
		}
	}
}

//Function to format text in the text box
function FormatText(rte, command, option) {
	var oRTE;
	if (document.all) {
		oRTE = frames[rte];

		//get current selected range
		var selection = oRTE.document.selection;
		if (selection != null) {
			rng = selection.createRange();
		}
	} else {
		oRTE = document.getElementById(rte).contentWindow;

		//get currently selected range
		var selection = oRTE.getSelection();
		rng = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
	}

	try {
		if ((command == "forecolor") || (command == "hilitecolor")) {
			//save current values
			parent.command = command;
			currentRTE = rte;

			// position and show color palette
      // OffsetLeft is defined in document.getElementById('cp' + rte).style.left 
      // OffsetTop  is defined in document.getElementById('cp' + rte).style.top
			buttonElement = document.getElementById(command + '_' + rte);
			// Ernst de Moor: Fix the amount of digging parents up, in case the RTE editor itself is displayed in a div.
			document.getElementById('cp' + rte).style.left = getOffsetLeft(buttonElement, 4) - 50 + "px";
			document.getElementById('cp' + rte).style.top = getOffsetTop(buttonElement, 17) - 80 + "px";
			if (document.getElementById('cp' + rte).style.visibility == "hidden") {
				document.getElementById('cp' + rte).style.visibility = "visible";
				document.getElementById('cp' + rte).style.display = "inline";
			} else {
				document.getElementById('cp' + rte).style.visibility = "hidden";
				document.getElementById('cp' + rte).style.display = "none";
			}
		} else if (command == "createlink") {
			var szURL = prompt("Enter a URL:", "");
			try {
				//ignore error for blank urls
				oRTE.document.execCommand("Unlink", false, null);
				oRTE.document.execCommand("CreateLink", false, szURL);
			} catch (e) {
				//do nothing
			}
		} else {
			oRTE.focus();
		  	oRTE.document.execCommand(command, false, option);
			oRTE.focus();
		}
	} catch (e) {
		alert(e);
	}
}
function replaceAllRecursion(str, replStr, replWithStr)
{
  if(str.indexOf(replStr)>=0)
    return replaceAllRecursion(str.replace(replStr, replWithStr), replStr, replWithStr)
   else
	return str;
}

//Function to set color
function setColor(color) {
	var rte = currentRTE;
	var oRTE;
	if (document.all) {
		oRTE = frames[rte];
	} else {
		oRTE = document.getElementById(rte).contentWindow;
	}

	var parentCommand = parent.command;
	if (document.all) {
		//retrieve selected range
		var sel = oRTE.document.selection;
		if (parentCommand == "hilitecolor") parentCommand = "backcolor";
		if (sel != null) {
			var newRng = sel.createRange();
			newRng = rng;
			newRng.select();
		}
	}
	oRTE.focus();
	oRTE.document.execCommand(parentCommand, false, color);
	oRTE.focus();
	document.getElementById('cp' + rte).style.visibility = "hidden";
	document.getElementById('cp' + rte).style.display = "none";
}

//Function to add image
function AddImage(rte) {
	var oRTE;
	if (document.all) {
		oRTE = frames[rte];

		//get current selected range
		var selection = oRTE.document.selection;
		if (selection != null) {
			rng = selection.createRange();
		}
	} else {
		oRTE = document.getElementById(rte).contentWindow;

		//get currently selected range
		var selection = oRTE.getSelection();
		rng = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
	}

	imagePath = prompt('Enter Image URL:', 'http://');
	if ((imagePath != null) && (imagePath != "")) {
		oRTE.focus();
		oRTE.document.execCommand('InsertImage', false, imagePath);
		oRTE.focus();
	}
}

//function to perform spell check
function checkspell() {
	try {
		var tmpis = new ActiveXObject("ieSpell.ieSpellExtension");
		tmpis.CheckAllLinkedDocuments(document);
	}
	catch(exception) {
		if(exception.number==-2146827859) {
			if (confirm("ieSpell not detected.  Click Ok to go to download page."))
				window.open("http://www.iespell.com/download.php","DownLoad");
		} else {
			alert("Error Loading ieSpell: Exception " + exception.number);
		}
	}
}

// Fix the amount of digging parents up, in case the RTE editor itself is displayed in a div.
function getOffsetTop(elm, parents_up) {
	var mOffsetTop = elm.offsetTop;
	var mOffsetParent = elm.offsetParent;

	if(!parents_up) {
		parents_up = 10000; // arbitrary big number
	}
	while(parents_up>0 && mOffsetParent) {
		mOffsetTop += mOffsetParent.offsetTop;
		mOffsetParent = mOffsetParent.offsetParent;
		parents_up--;
	}

	return mOffsetTop;
}

// Ernst de Moor: Fix the amount of digging parents up, in case the RTE editor itself is displayed in a div.
function getOffsetLeft(elm, parents_up) {
	var mOffsetLeft = elm.offsetLeft;
	var mOffsetParent = elm.offsetParent;

	if(!parents_up) {
		parents_up = 10000; // arbitrary big number
	}
	while(parents_up>0 && mOffsetParent) {
		mOffsetLeft += mOffsetParent.offsetLeft;
		mOffsetParent = mOffsetParent.offsetParent;
		parents_up--;
	}

	return mOffsetLeft;
}

function Select(rte, selectname) {
	var oRTE;
	if (document.all) {
		oRTE = frames[rte];

		//get current selected range
		var selection = oRTE.document.selection;
		if (selection != null) {
			rng = selection.createRange();
		}
	} else {
		oRTE = document.getElementById(rte).contentWindow;

		//get currently selected range
		var selection = oRTE.getSelection();
		rng = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
	}

	var idx = document.getElementById(selectname).selectedIndex;
	// First one is always a label
	if (idx != 0) {
		var selected = document.getElementById(selectname).options[idx].value;
		var cmd = selectname.replace('_' + rte, '');
		oRTE.focus();
		oRTE.document.execCommand(cmd, false, selected);
		oRTE.focus();
		document.getElementById(selectname).selectedIndex = 0;
	}
}

function kb_handler(evt) {
	var rte = evt.target.id;

	//contributed by Anti Veeranna (thanks Anti!)
	if (evt.ctrlKey) {
		var key = String.fromCharCode(evt.charCode).toLowerCase();
		var cmd = '';
		switch (key) {
			case 'b': cmd = "bold"; break;
			case 'i': cmd = "italic"; break;
			case 'u': cmd = "underline"; break;
		};

		if (cmd) {
			FormatText(rte, cmd, true);
			//evt.target.ownerDocument.execCommand(cmd, false, true);
			// stop the event bubble
			evt.preventDefault();
			evt.stopPropagation();
		}
 	}
}

function docChanged (evt) {
	alert('changed');
}

function stripHTML(oldString) {
	var newString = oldString.replace(/(<([^>]+)>)/ig,"");

	//replace carriage returns and line feeds
   newString = newString.replace(/\r\n/g," ");
   newString = newString.replace(/\n/g," ");
   newString = newString.replace(/\r/g," ");

	//trim string
	newString = trim(newString);

	return newString;
}

function trim(inputString) {
   // Removes leading and trailing spaces from the passed string. Also removes
   // consecutive spaces and replaces it with one space. If something besides
   // a string is passed in (null, custom object, etc.) then return the input.
   if (typeof inputString != "string") return inputString;
   var retValue = inputString;
   var ch = retValue.substring(0, 1);

   while (ch == " ") { // Check for spaces at the beginning of the string
      retValue = retValue.substring(1, retValue.length);
      ch = retValue.substring(0, 1);
   }
   ch = retValue.substring(retValue.length-1, retValue.length);

   while (ch == " ") { // Check for spaces at the end of the string
      retValue = retValue.substring(0, retValue.length-1);
      ch = retValue.substring(retValue.length-1, retValue.length);
   }

	// Note that there are two spaces in the string - look for multiple spaces within the string
   while (retValue.indexOf("  ") != -1) {
		// Again, there are two spaces in each of the strings
      retValue = retValue.substring(0, retValue.indexOf("  ")) + retValue.substring(retValue.indexOf("  ")+1, retValue.length);
   }
   return retValue; // Return the trimmed string back to the user
}

function dlgInsertTable(rte, command) {
	//function to open/close insert table dialog
	//save current values
	parent.command = command;
	currentRTE = rte;
	InsertTable = popUpWin(includesPath + 'insert_table.htm', 'InsertTable', 360, 180, '');
}

function popUpWin (url, win, width, height, options) {
	var leftPos = (screen.availWidth - width) / 2;
	var topPos = (screen.availHeight - height) / 2;
	options += 'width=' + width + ',height=' + height + ',left=' + leftPos + ',top=' + topPos;
	return window.open(url, win, options);
}

function insertHTML(html) {
	//function to add HTML -- thanks dannyuk1982
	var rte = currentRTE;

	var oRTE;
	if (document.all) {
		oRTE = frames[rte];
	} else {
		oRTE = document.getElementById(rte).contentWindow;
	}

	oRTE.focus();
	if (document.all) {
		var oRng = oRTE.document.selection.createRange();
		oRng.pasteHTML(html);
		oRng.collapse(false);
		oRng.select();
	} else {
		oRTE.document.execCommand('insertHTML', false, html);
	}
}
