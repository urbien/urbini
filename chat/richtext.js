// Cross-Browser Rich Text Editor
// http://www.kevinroth.com/rte/demo.htm
// Written by Kevin Roth (kevin@NOSPAMkevinroth.com - remove NOSPAM)

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

function initRTE(imgPath, incPath, css) {
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

	if (isRichText) document.writeln('<style type="text/css">@import "' + includesPath + 'rte.css";</style>');

	//for testing standard textarea, uncomment the following line
	//isRichText = false;
}

function writeRichText(rte, html, width, height, buttons, readOnly) {
	if (isRichText) {
		if (allRTEs.length > 0) allRTEs += ";";
		allRTEs += rte;
		writeRTE(rte, html, width, height, buttons, readOnly);
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

	className = el.className;
	if (className == 'rteImage' || className == 'rteImageLowered') {
		el.className = 'rteImageRaised';
	}
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

function insertSmile(rte, smile)
{
	var oRTE = frames[rte];
	oRTE.focus();
    oRTE.document.execCommand('InsertImage', false, smile);
	oRTE.focus();
}

function writeRTE(rte, html, width, height, buttons, readOnly) {
	if (readOnly) buttons = false;

	//adjust minimum table widths
	if (isIE) {
		if (buttons && (width < 600)) width = 600;
		var tablewidth = width;
	} else {
		if (buttons && (width < 500)) width = 500;
		var tablewidth = width + 4;
	}

	if (buttons == true) {
		document.writeln('<table class="rteBack" cellpadding=0 cellspacing=0 id="Buttons1_' + rte + '" width="' + tablewidth + '">');
		document.writeln('	<tr style="white-space : nowrap; word-spacing : 0px; 	white-space : nowrap;">');
		document.writeln('		<td width="100%" cellpadding=0 cellspacing=0 style="" valign="top">');
		document.writeln('			<select style="width:75px;vertical-align : top;" id="formatblock_' + rte + '" onchange="Select(\'' + rte + '\', this.id);">');
		document.writeln('				<option value="">[Style]</option>');
		document.writeln('				<option value="<p>">Paragraph</option>');
		document.writeln('				<option value="<h1>">Heading 1 <h1></option>');
		document.writeln('				<option value="<h2>">Heading 2 <h2></option>');
		document.writeln('				<option value="<h3>">Heading 3 <h3></option>');
		document.writeln('				<option value="<h4>">Heading 4 <h4></option>');
		document.writeln('				<option value="<h5>">Heading 5 <h5></option>');
		document.writeln('				<option value="<h6>">Heading 6 <h6></option>');
		document.writeln('				<option value="<address>">Address <ADDR></option>');
		document.writeln('				<option value="<pre>">Formatted <pre></option>');
		document.writeln('			</select>');
		document.writeln('			<select style="width:115px;vertical-align : top;" id="fontname_' + rte + '" onchange="Select(\'' + rte + '\', this.id)">');
		document.writeln('				<option value="Font" selected>[Font]</option>');
		document.writeln('				<option value="Arial, Helvetica, sans-serif">Arial</option>');
		document.writeln('				<option value="Courier New, Courier, mono">Courier New</option>');
		document.writeln('				<option value="Times New Roman, Times, serif">Times New Roman</option>');
		document.writeln('				<option value="Verdana, Arial, Helvetica, sans-serif">Verdana</option>');
		document.writeln('			</select>');
		document.writeln('			<select style="width:60px;vertical-align : top;" unselectable="on" id="fontsize_' + rte + '" onchange="Select(\'' + rte + '\', this.id);">');
		document.writeln('				<option value="Size">[Size]</option>');
		document.writeln('				<option value="1">1</option>');
		document.writeln('				<option value="2">2</option>');
		document.writeln('				<option value="3">3</option>');
		document.writeln('				<option value="4">4</option>');
		document.writeln('				<option value="5">5</option>');
		document.writeln('				<option value="6">6</option>');
		document.writeln('				<option value="7">7</option>');
		document.writeln('			</select>');
		document.writeln('			<select style="width:95px;vertical-align : top;" unselectable="on" id="smile_' + rte + '" onchange="insertSmile(\''+rte+'\',this.value);this.selectedIndex = 0;">'); //frames.' + rte + '.document.body.innerHTML+=\'<img width=17 height=17 src=\'+this.value+\'>\';this.selectedIndex = 0;
		document.writeln('				<option value="Smile" selected>[Smile]</option>');
		document.writeln('				<option value="images/smileys/smiley.gif">smiley&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- :)</option>');
		document.writeln('				<option value="images/smileys/wink.gif">wink&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - ;)</option>');
		document.writeln('				<option value="images/smileys/sad.gif">sad&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - :(</option>');
		document.writeln('				<option value="images/smileys/laughting.gif">laughting - :D</option>');
		document.writeln('			</select>');

/*
		document.writeln('		<td width="100%">');
		document.writeln('		</td>');
		document.writeln('	</tr>');
		document.writeln('</table>');
		document.writeln('<table class="rteBack" cellpadding="0" cellspacing="0" id="Buttons2_' + rte + '" width="' + tablewidth + '">');
		document.writeln('	<tr>');
*/		
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'bold1.gif" width="13" height="13" alt="Bold" title="Bold" onClick="FormatText(\'' + rte + '\', \'bold\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'italic1.gif" width="13" height="13" alt="Italic" title="Italic" onClick="FormatText(\'' + rte + '\', \'italic\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'underline1.gif" width="13" height="13" alt="Underline" title="Underline" onClick="FormatText(\'' + rte + '\', \'underline\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'left_just1.gif" width="13" height="13" alt="Align Left" title="Align Left" onClick="FormatText(\'' + rte + '\', \'justifyleft\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'centre1.gif" width="13" height="13" alt="Center" title="Center" onClick="FormatText(\'' + rte + '\', \'justifycenter\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'right_just1.gif" width="13" height="13" alt="Align Right" title="Align Right" onClick="FormatText(\'' + rte + '\', \'justifyright\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'justifyfull1.gif" width="13" height="13" alt="Justify Full" title="Justify Full" onclick="FormatText(\'' + rte + '\', \'justifyfull\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'hr1.gif" width="13" height="13" alt="Horizontal Rule" title="Horizontal Rule" onClick="FormatText(\'' + rte + '\', \'inserthorizontalrule\', \'\')">');
///*
		document.writeln('		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'numbered_list1.gif" width="13" height="13" alt="Ordered List" title="Ordered List" onClick="FormatText(\'' + rte + '\', \'insertorderedlist\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'list1.gif" width="13" height="13" alt="Unordered List" title="Unordered List" onClick="FormatText(\'' + rte + '\', \'insertunorderedlist\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'outdent1.gif" width="13" height="13" alt="Outdent" title="Outdent" onClick="FormatText(\'' + rte + '\', \'outdent\', \'\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'indent1.gif" width="13" height="13" alt="Indent" title="Indent" onClick="FormatText(\'' + rte + '\', \'indent\', \'\')">');
		document.writeln('		<span id="forecolor_' + rte + '">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'textcolor1.gif" width="13" height="13" alt="Text Color" title="Text Color" onClick="FormatText(\'' + rte + '\', \'forecolor\', \'\')"></span>');
		document.writeln('		<span id="hilitecolor_' + rte + '"><img class="rteImage" src="' + imagesPath + 'bgcolor1.gif" width="13" height="13" alt="Background Color" title="Background Color" onClick="FormatText(\'' + rte + '\', \'hilitecolor\', \'\')"></span>');
		document.writeln('		<img align="absmiddle" class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="13" border="0" alt="">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'hyperlink1.gif" width="13" height="13" alt="Insert Link" title="Insert Link" onClick="FormatText(\'' + rte + '\', \'createlink\')">');
		document.writeln('		<img align="absmiddle" class="rteImage" src="' + imagesPath + 'image1.gif" width="13" height="13" alt="Add Image" title="Add Image" onClick="AddImage(\'' + rte + '\')">');
//*/		
		//if (!readOnly) document.writeln('<td><input type="checkbox" id="chkSrc' + rte + '" onclick="toggleHTMLSrc(\'' + rte + '\');" />&nbsp;View Source</td>');
		if (isIE) {
			document.writeln('		<img  align="absmiddle"class="rteImage" src="' + imagesPath + 'spellcheck1.gif" width="13" height="13" alt="Spell Check" title="Spell Check" onClick="checkspell()">');
		}
		document.writeln('		</td>');
		//if (!readOnly) document.writeln('<td><input type="checkbox" id="chkSrc' + rte + '" onclick="toggleHTMLSrc(\'' + rte + '\');" />&nbsp;View Source</td>');
//		document.writeln('		<td><img class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="20" border="0" alt=""></td>');
//		document.writeln('		<td><img class="rteImage" src="' + imagesPath + 'cut.gif" width="25" height="24" alt="Cut" title="Cut" onClick="FormatText(\'' + rte + '\', \'cut\')"></td>');
//		document.writeln('		<td><img class="rteImage" src="' + imagesPath + 'copy.gif" width="25" height="24" alt="Copy" title="Copy" onClick="FormatText(\'' + rte + '\', \'copy\')"></td>');
//		document.writeln('		<td><img class="rteImage" src="' + imagesPath + 'paste.gif" width="25" height="24" alt="Paste" title="Paste" onClick="FormatText(\'' + rte + '\', \'paste\')"></td>');
//		document.writeln('		<td><img class="rteVertSep" src="' + imagesPath + 'blackdot.gif" width="1" height="20" border="0" alt=""></td>');
//		document.writeln('		<td><img class="rteImage" src="' + imagesPath + 'undo.gif" width="25" height="24" alt="Undo" title="Undo" onClick="FormatText(\'' + rte + '\', \'undo\')"></td>');
//		document.writeln('		<td><img class="rteImage" src="' + imagesPath + 'redo.gif" width="25" height="24" alt="Redo" title="Redo" onClick="FormatText(\'' + rte + '\', \'redo\')"></td>');
		//document.writeln('		<td width="100%"></td>');
		document.writeln('	</tr>');
		document.writeln('</table>');
	}
	document.writeln('<iframe id="' + rte + '" name="' + rte + '" width="' + width + 'px" height="' + height + 'px" src="'+document.domain+'"></iframe>');
	if (!readOnly) document.writeln('<br /><input type="checkbox" id="chkSrc' + rte + '" onclick="toggleHTMLSrc(\'' + rte + '\');" />&nbsp;View Source');
	document.writeln('<iframe width="154" height="104" id="cp' + rte + '" src="' + includesPath + 'palette.htm" marginwidth="0" marginheight="0" scrolling="no" style="visibility:hidden; display: none; position: absolute;"></iframe>');
	document.writeln('<input type="hidden" id="hdn' + rte + '" name="' + rte + '" value="">');
	//!!Error!!document.getElementById('hdn' + rte).value = html;
	enableDesignMode(rte, html, readOnly);
}

function enableDesignMode(rte, html, readOnly) {
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
	//frameHtml += "<body onload=\"" + rte + ".document.body.innerHTML = parent.document.getElementById('" + rte + "content').value;alert(parent.document.getElementById('" + rte + "content').value);setTimeout('alert(parent.document.getElementById(\\'" + rte + "content\\').value)',3000)\">\n";
	frameHtml += "<body>\n";
	//frameHtml += "<body onload=\"alert(parent.document.getElementById('" + rte + "content').value);\">\n";
	frameHtml += html + "\n";
	frameHtml += "</body>\n";
	frameHtml += "</html>";

	if (document.all) {
	//alert(window.parent.frames[rte].document);
	//alert(frames[rte].domain);
	//alert(document.domain);
//	frames[rte].domain = document.domain;
		var oRTE = frames[rte].document;
		oRTE.open();
		oRTE.write(frameHtml);
		oRTE.close();
		if (!readOnly) oRTE.designMode = "On";
	} else {
		try {
			if (!readOnly) document.getElementById(rte).contentDocument.designMode = "on";
			try {
				var oRTE = document.getElementById(rte).contentWindow.document;
				oRTE.open();
				oRTE.write(frameHtml);
				oRTE.close();
				if (isGecko && !readOnly) {
					//attach a keyboard handler for gecko browsers to make keyboard shortcuts work
					oRTE.addEventListener("keypress", kb_handler, true);
				}
			} catch (e) {
				alert("Error preloading content.");
			}
		} catch (e) {
			//gecko may take some time to enable design mode.
			//Keep looping until able to set.
			if (isGecko) {
			    //var s = replaceAll(html, "'", "\\\\'");
				//var s = replaceAll(html, "'", "&#39;");
				//var s = replaceAll(html, "'", "aaaaaaaaaaaaaaaaaaaaaaaa");
				s = html;
				//setTimeout("enableDesignMode('" + rte + "', '" + html + "', " + readOnly + ");", 10);
				setTimeout("enableDesignMode('" + rte + "', '" + s + "', " + readOnly + ");", 10);
			} else {
				return false;
			}
		}
	}
}

function updateRTEs() {
    //alert(allRTEs);
	var vRTEs = allRTEs.split(";");
	for (var i = 0; i < vRTEs.length; i++) {
	    //alert("updateRTE("+vRTEs[i]+");");
		//alert(frames[RTEs[i]].document);
		updateRTE(vRTEs[i]);
		//if(document.getElementById(vRTEs[i]+'content'))document.getElementById(vRTEs[i]+'content').value = ;
		//alert(frames[RTEs[i]].document.body.innerHTML);
		//alert(document.getElementById(vRTEs[i]).document.body.innerHTML);
		
		//alert(vRTEs[i]);
	}
}

function updateRTE(rte) {
    if(document.getElementById(rte+'content'))document.getElementById(rte+'content').value = frames[rte].document.body.innerHTML;
	
    //alert(frames[rte].document.body.innerHTML);
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
	}
}

function toggleHTMLSrc(rte) {
	//contributed by Bob Hutzel (thanks Bob!)
	var oRTE;
	if (document.all) {
		oRTE = frames[rte].document;
	} else {
		oRTE = document.getElementById(rte).contentWindow.document;
	}

	if (document.getElementById("chkSrc" + rte).checked) {
	    //document.getElementById("Buttons1_" + rte).style.visibility = "hidden";
		document.getElementById("Buttons1_" + rte).style.visibility = "visible";
		//document.getElementById("Buttons2_" + rte).style.visibility = "hidden";
		if (document.all) {
			oRTE.body.innerText = oRTE.body.innerHTML;
		} else {
			var htmlSrc = oRTE.createTextNode(oRTE.body.innerHTML);
			oRTE.body.innerHTML = "";
			oRTE.body.appendChild(htmlSrc);
		}
	} else {
		document.getElementById("Buttons1_" + rte).style.visibility = "visible";
		//document.getElementById("Buttons2_" + rte).style.visibility = "visible";
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

			//position and show color palette
			buttonElement = document.getElementById(command + '_' + rte);
			// Ernst de Moor: Fix the amount of digging parents up, in case the RTE editor itself is displayed in a div.
			document.getElementById('cp' + rte).style.left = getOffsetLeft(buttonElement, 4) - 40 + "px";
			//document.getElementById('cp' + rte).style.top = (getOffsetTop(buttonElement, 4) + buttonElement.offsetHeight + 4) + "px";
			document.getElementById('cp' + rte).style.top = (getOffsetTop(buttonElement, 6) + buttonElement.offsetHeight + 4) + "px";
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








// Ernst de Moor: Fix the amount of digging parents up, in case the RTE editor itself is displayed in a div.
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
