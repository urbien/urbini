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

function copyToClipboard(text2copy) {
  var FLASHCOPIER_ID = 'flashcopier';
  if (window.clipboardData) {
    window.clipboardData.setData("Text",text2copy);
  } else {
    if(!document.getElementById(FLASHCOPIER_ID)) {
      var flashcopier = document.createElement('div');
      flashcopier.id = FLASHCOPIER_ID;
      document.body.appendChild(flashcopier);
    }
    if(typeof flashcopier == 'undefined')
      var flashcopier = document.getElementById(FLASHCOPIER_ID);
    flashcopier.innerHTML = '';
    var divinfo = '<embed src="_clipboard.swf" FlashVars="clipboard='+escape(text2copy)+'" width="0" height="0" type="application/x-shockwave-flash"></embed>';
    flashcopier.innerHTML = divinfo;
  }
}
/*************************************************
*	RteEngine
**************************************************/
var RteEngine = {

	// RTE types description
	simpleRTE : {
		autoClose:true,
		isFewFonts:true,
		buttons:{
			style:true,	font:true, decoration:true,	align:true,	dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, smile:false, line: true, table:false, supsub:true, reundo:true, html:true
		}
	},
	chatRTE : {
		autoClose:false,
		isFewFonts:true,
		buttons:{
			style:false, font:true, decoration:true, align:true, dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, smile:true, line: true, table:false, supsub:false, reundo:true, html:false
		}
	},
	advancedRTE : {
		autoClose:false,
		isFewFonts:false,
		buttons:{
			style:true,	font:true, decoration:true,	align:true,	dent:true,
			list:true, text_color: true, bg_color: true, link: true,
			image: true, smile:false, line: true, table:true, supsub:true, reundo:true, html:true
		}
	},
	// ----------------------------

	IMAGES_FOLDER : "images/wysiwyg/",
	STYLES : [{name:"Paragraph", value:"<p>"}, {name:"Heading 1", value:"<h1>"}, {name:"Heading 2", value:"<h2>"}, {name:"Heading 3", value:"<h3>"}, {name:"Heading 4", value:"<h4>"},
		{name:"Heading 5", value:"<h5>"}, {name:"Heading 6", value:"<h6>"}, {name:"Address", value:"<address>"}, {name:"Formatted", value:"<pre>"}],
	FONTS : ["arial", "arial black", "comic sans ms", "courier", "courier new", "georgia", "helvetica", "impact", "palatino", "times new roman", "trebuchet ms", "verdana"],
	FONTS_FEW : ["arial", "arial black", "comic sans ms", "courier new", "helvetica", "times new roman", "verdana"],
	FONT_SIZE : ["8pt", "10pt", "12pt", "14pt", "18pt", "24pt", "36pt"],

  IMG_ATTRIBS_TO_DELETE : ["className", "class", "handler_mouseout", "handler_mouseover",
     "onclick", "allow", "tooltip", "id", "title", "align"],

	rteArr : new Array(), // objects
	uploadForm : null,

	// POPUPs; globals for all rte objects --
	stylePopup : null,
	fontPopup : null,
	fewFontPopup : null, // short list of fonts
	sizePopup : null,
	smilePopup : null,
	textColorPopup : null,
	textColorPopup : null,
	bgColorPopup : null,
	linkPopup : null,
	imagePopup : null,
	imagePastePopup : null,
	tablePopup : null,

  toUseTArea : false,

  curRteId : -1,
  
	//register the RTEs.
	register : function(iframeId, rteDataFieldId, rtePref) {
    iframeObj = document.getElementById(iframeId);

		if(typeof rtePref == 'undefined')
			rtePref = this.simpleRTE;

		if(iframeObj.id	== "")
			iframeObj.id = new Date().getTime();

		var rteObj = null;
		if(this.toUseTArea == false) {
		  try {
			  rteObj = new Rte(iframeObj, rteDataFieldId, rtePref);
		  }catch(e) {	this.toUseTArea = true;}
		}
    
    if(this.toUseTArea)
  	  rteObj = new TArea(iframeObj, rteDataFieldId, rtePref);

		if(rteObj != null)
			this.rteArr.push(rteObj);
	},

	// put RTE data into a hidden field
	// keepRte means that RTE object is keeping for further use.
	// by default the RTE object will be removed from  RteEngine.
	putRteDataOfForm : function(formObj, keepRte) {
		var iframes;
		if(this.toUseTArea == false)
		  iframes = formObj.getElementsByTagName('iframe');
		else
		  iframes = formObj.getElementsByTagName('textarea');
		  
		for(var i = 0; i < iframes.length; i++) {
			var idx = RteEngine.getRteIndex(iframes[i])
			if(idx != -1) {
				RteEngine.rteArr[idx].putRteData();

				// delete rte from the RteEngine
				if(typeof keepRte == 'undefined' || keepRte == false) {
					RteEngine.rteArr.splice(idx, 1);
				}
			}
		}
	},
	// param: obj is rte-object or its id
	getRteIndex : function(obj) {
	  var id;
	  if(typeof obj == "string")
	    id = obj;
	  else
      id = obj.id;
 
		for(var i = 0; i < this.rteArr.length; i++) {
			if(this.rteArr[i].getId() == id)
				return i;
		}
		return -1; // iframe is not a RTE
	},
	getRteById : function(id) {
	  var index = this.getRteIndex(id);
	  if(index == -1)
	    return null;
	  return this.rteArr[index];
	},
	// close all disactived except in html preview mode
	closeAllDisactived : function(activeId) {
		for(var i = 0; i < this.rteArr.length; i++)
			if(this.rteArr[i].iframeObj.id != activeId)
				this.rteArr[i].onlosefocus();
	},

	getHostUrl : function() {
		var url = window.location.protocol + "//" + window.location.host + "/";
		return url;
	},

	// launch popups (create a popup on 1st demand) --------
	launchStylePopup : function(btnObj, callback) {
		if(this.stylePopup == null)
			this.createStylePopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2'); // hack: detects if it's in a 'pane2' dialog
		this.stylePopup.show(btnObj, 'left', callback, parentDlg);
		return this.stylePopup.div;
	},
	launchFontPopup : function(btnObj, callback, isFewFonts) {
		if(typeof isFewFonts != 'undefined' && isFewFonts == true) {
			return	this._launchFewFontPopup(btnObj, callback);
		}
		if(this.fontPopup == null)
			this.createFontPopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.fontPopup.show(btnObj, 'left', callback, parentDlg);
		return this.fontPopup.div;
	},
	_launchFewFontPopup : function(btnObj, callback) {
		if(this.fewFontPopup == null)
			this.createFewFontPopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.fewFontPopup.show(btnObj, 'left', callback, parentDlg);
		return this.fewFontPopup.div;
	},
	launchSizePopup : function(btnObj, callback) {
		if(this.sizePopup == null)
			this.createSizePopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.sizePopup.show(btnObj, 'left', callback, parentDlg);
		return this.sizePopup.div;
	},
	launchSmilePopup : function(btnObj, callback) {
		if(this.smilePopup == null)
			this.createSmilePopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.smilePopup.show(btnObj, 'right', callback, parentDlg);
		return this.smilePopup.div;
	},
	launchTextColorPopup : function(btnObj, callback, chosenTextClr) {
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		PalettePopup.show(btnObj, 'right', callback, parentDlg, null, chosenTextClr);
		return PalettePopup.div;
	},
	launchBgColorPopup : function(btnObj, callback, chosenBgClr) {
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		PalettePopup.show(btnObj, 'right', callback, parentDlg, null, chosenBgClr);
		return PalettePopup.div;
	},
	launchLinkPopup : function(btnObj, callback, cancelCallback) {
		if(this.linkPopup == null)
			this.createLinkPopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.linkPopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.linkPopup.div;
	},
	launchImagePopup : function(btnObj, callback, rteId, cancelCallback) {
		if(this.imagePopup == null)
			this.createImagePopup();
		else {
		  var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
        + "Enter image URL or select your local image.</div>"
		    + ImageUploader.getUploadImageFormContent("RteEngine.onImageFormSubmit(event)", "insert");
		  this.imagePopup.changeContent(innerFormHtml);
		}	
	  
	  this.curRteId = rteId;
	  
	  var form = this.imagePopup.getForm();
	  ImageUploader.putRteIdInForm(form, rteId);		
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.imagePopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.imagePopup.div;
	},
	launchImagePastePopup : function(rteId) {
		if(this.imagePastePopup == null)
			this.createImagePastePopup();
		else { // need to "reload" form content, because input file is read-only
		  var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
        + "You pasted image that requires uploading.<br />Press \"Ctrl\" + \"V\" and then submit.</div>"
		    + ImageUploader.getUploadImageFormContent("RteEngine.onImagePasteFormSubmit(event)", "submit");
		  this.imagePastePopup.changeContent(innerFormHtml);
	  }
	  
	  this.curRteId = rteId;
	  
 	  var form = this.imagePastePopup.getForm();
	  ImageUploader.putRteIdInForm(form, rteId);		

    var rteObj = this.getRteById(rteId);
    var rteIframe = rteObj.getIframe();
 		var parentDlg = getAncestorById(rteIframe, 'pane2'); // hack: detects if it's in a 'pane2' dialog
    this.imagePastePopup.show(rteIframe, "inside", null, parentDlg, this.onCanceledUploadPastedImage);
		
		return this.imagePastePopup.div;
	},
	launchTablePopup : function(btnObj, callback, cancelCallback) {
		if(this.tablePopup == null)
			this.createTablePopup();
		var parentDlg = getAncestorById(btnObj.div, 'pane2');
		this.tablePopup.show(btnObj, 'center', callback, parentDlg, cancelCallback);
		return this.tablePopup.div;
	},

	// create popup --------------
	// possible the style popup should be unique for each RTE (documend)
	// on this moment it uses 1st RTE onject
	createStylePopup : function() {
		this.stylePopup = new List();
		var len = this.STYLES.length;
		for(var i = 0; i < len; i++) {
		
  		var itemDiv;	
  		var userAgent = navigator.userAgent.toLowerCase();
	  	 // Opera & Safari do not want to work with font directly
	  	if(userAgent.indexOf('opera') != -1 || userAgent.indexOf('safari') != -1 )
		  	itemDiv = document.createElement('div');
			else
			  itemDiv = document.createElement(this.STYLES[i].value);
			
			itemDiv.style.margin = 0;
			itemDiv.innerHTML = this.STYLES[i].name;
			this.stylePopup.appendItem(itemDiv);
		}
	},
	createFontPopup : function() {
		var FONT_SIZE = 14;
		this.fontPopup = new List();
		var len = this.FONTS.length;
		for(var i = 0; i < len; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = this.FONTS[i];
			itemDiv.style.fontFamily = this.FONTS[i];
			itemDiv.style.fontSize = FONT_SIZE;
			this.fontPopup.appendItem(itemDiv);
		}
	},
	createFewFontPopup : function() {
		var FONT_SIZE = 14;
		this.fewFontPopup = new List();
		var len = this.FONTS_FEW.length;
		for(var i = 0; i < len; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = this.FONTS_FEW[i];
			itemDiv.style.fontFamily = this.FONTS_FEW[i];
			itemDiv.style.fontSize = FONT_SIZE;
			this.fewFontPopup.appendItem(itemDiv);
		}
	},
	createSizePopup : function() {
		this.sizePopup = new List();
		for(var i = 0; i < this.FONT_SIZE.length; i++) {
			var itemDiv = document.createElement('div');
			itemDiv.innerHTML = "<NOBR><span style='font-size:" + this.FONT_SIZE[i] + ";'>" + (i + 1) + "</span>"
				+ " (" + this.FONT_SIZE[i] + ")</NOBR>";
			this.sizePopup.appendItem(itemDiv);
		}
		this.sizePopup.setWidth(50);
	},
	createSmilePopup : function() {
		var SMILES_AMT = 30;
		var PADDING = 5;
		var SMILE_SIZE = 19;
		this.smilePopup = new List(5);
		for(var i = 0; i < SMILES_AMT; i++) {
			var itemDiv = document.createElement('div');
			var imgPath = this.IMAGES_FOLDER + "smiles/" + (i + 1) + ".gif";
			itemDiv.innerHTML =
			  "<img src=" + imgPath + " width=" + SMILE_SIZE + " height=" + SMILE_SIZE + ">";

			itemDiv.style.padding = PADDING;
			this.smilePopup.appendItem(itemDiv);
		}
	},

	createLinkPopup : function() {
		var innerFormHtml = '<table style="font-family:verdana; font-size:12px" cellpadding="4" cellspacing="0" border="0">'
			+ ' <tr>'
			+ ' <td align="left">Enter URL:</td>'
			+ ' </tr><tr>'
			+ ' <td><input name="url" type="text" id="url" value="" size="35"></td>'
			+ ' </tr><tr>'
  		+ ' <td><input name="is_blank" type="checkbox" id="is_blank">load into a new window</td>'
      + ' </tr>'
			+ '</table>';
		this.linkPopup = new FormPopup(innerFormHtml);
	},
	createImagePopup : function() {
		var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
    + "Enter image URL or select your local image.</div>"
		+ ImageUploader.getUploadImageFormContent("RteEngine.onImageFormSubmit(event)", "insert");
		this.imagePopup = new FormPopup(innerFormHtml, "USE_SUBMIT_BTN");
	},
  createImagePastePopup : function() {
  	var innerFormHtml = "<div style=\"font-family:verdana; font-size:12px\">"
    + "You pasted image that requires uploading.<br />Press \"Ctrl\" + \"V\" and then submit.</div>"
		+ ImageUploader.getUploadImageFormContent("RteEngine.onImagePasteFormSubmit(event)", "submit");
		this.imagePastePopup = new FormPopup(innerFormHtml, "USE_SUBMIT_BTN");
  },
	createTablePopup : function() {
		var innerFormHtml = this.getInsertTableHtml();
		this.tablePopup = new FormPopup(innerFormHtml);
	},
  
  // create END --------------------------------
	getInsertTableHtml : function() {
		var tblInsertHtml = '<table style="font-family:verdana; font-size:12px" cellpadding="4" cellspacing="0" border="0">'
			+ ' <tr>'
			+ ' <td align="left">Table width:</td>'
			+ ' <td><input name="width" type="text" id="width" value="90" size="4"></td>'
			+ ' <td align="left">'
				+ ' <select name="widthType" id="widthType">'
					+ ' <option value="px">pixels</option>' // value="pixels"
					+ ' <option value="%" selected>percent</option>' //value="percent"
					+ ' </select>'
				+ ' </td>'
			+ ' <tr>'
			+	' <td align="left">Rows:</td>'
			+	' <td><input name="rows" type="text" id="rows" value="2" size="4"></td>'
			+ ' </tr>'
			+	' <td align="left">Columns:</td>'
			+ ' <td><input name="columns" type="text" id="columns" value="2" size="4"></td>'
			+ ' </tr>'
			+ ' <tr>'
			+ ' </tr>'
			+ ' <tr>'
				+ ' <td align="left">Border thickness:</td>'
				+ ' <td><input name="border" type="text" id="border" value="1" size="4"></td>'
				+ ' <td align="left">pixels</td>'
			+ ' </tr>'
			+ ' <tr>'
				+ ' <td align="left">Cell padding:</td>'
				+ ' <td><input name="padding" type="text" id="padding" value="0" size="4"></td>'
				+ ' </tr>'
				+ ' <tr>'
				+ ' <td>Cell spacing:</td>'
				+' <td><input name="spacing" type="text" id="0" value="0" size="4"></td>'
			+ ' </tr>'
		+ ' </table>';

		return tblInsertHtml;
	},
	
	// ------------------------------------------
	// onPasteHandler - (entersepts image paste only)
	onPasteHandler : function(rteId) {
    var rteObj = RteEngine.getRteById(rteId);
    if(rteObj == null)
      return;

    var rteDoc = rteObj.getDocument();
    
    var imgUrlsArr = rteObj.getImgUrlsArray();
    this.currentImgUrlsArr = imgUrlsArr;
    
    var images = rteDoc.getElementsByTagName("img");
    if(images.length == 0)
      return;
 
    // loop all images
    for(var i = 0; i < images.length; i++) {
      var src = images[i].src;
      // 1. skip already loaded and waiting for responce images
      if(ImageUploader.isImageHandled(imgUrlsArr, src))
        continue;
      
      // remove inserted image attributes
      for(var atrIdx = 0; atrIdx < this.IMG_ATTRIBS_TO_DELETE.length; atrIdx++) {
        images[i].removeAttribute(this.IMG_ATTRIBS_TO_DELETE[atrIdx]);
      }
      
      // skip web-images
      if(ImageUploader.isImageLocal(images[i]) == false)
        continue;

      // 2. check if it is copy of already loaded image
      var uplUrlOfCopy = ImageUploader.getUploadedUrlOfCopy(imgUrlsArr, src);
      if(uplUrlOfCopy != null) {
        images[i].src = uplUrlOfCopy;
        continue;
      } 

      // 3. required uploading
      // 3.2 copy to clipboard
      src = decodeURI(src); // IE
      
      var ua = navigator.userAgent.toLowerCase();
      var isGecko = (ua.indexOf("gecko") != -1);
      if(src.indexOf("file:///") == 0 && !isGecko) // IE
        src = src.substr(8);
      
      copyToClipboard(src);
      // 3.2.3 show the dialog
      this.launchImagePastePopup(rteId);
    }
  },
  
  onImageFormSubmit : function() {
  	var imgUrl = null;
	  var form = RteEngine.imagePopup.getForm();
	  imgUrl = ImageUploader.getImageUrlFromForm(form);
	  if(imgUrl == null)
	    return false;
	    
	  RteEngine.imagePopup.hide();
	  var rteObj = RteEngine.getRteById(RteEngine.curRteId);

	  // insert image
	  var encImgUrl = encodeURI(imgUrl);
	  rteObj.setImage(encImgUrl);

	  // web-image, thus not upload.
	  if(ImageUploader.isImageLocal(imgUrl) == false) {
	    return false;
	  }
	  
	  // mark image as waiting
	  var urlPairsArr = rteObj.getImgUrlsArray();
	  ImageUploader.markImageAsWaiting(urlPairsArr, encImgUrl);
	  
    ImageUploader.onHdnDocLoad(RteEngine.curRteId, encImgUrl);
	  
	  return true;
	},
	onImagePasteFormSubmit : function() {
	  var imgUrl = null;
	  var form = RteEngine.imagePastePopup.getForm();
	  imgUrl = ImageUploader.getImageUrlFromForm(form);
	  if(imgUrl == null)
	    return false;
	
	  copyToClipboard(" ");
    RteEngine.imagePastePopup.hide();
	  
	  // not upload web-image
	  if(ImageUploader.isImageLocal(imgUrl) == false)
	    return false;
	  
	  // mark image as waiting
	  var rteObj = RteEngine.getRteById(RteEngine.curRteId);
	  var urlPairsArr = rteObj.getImgUrlsArray();
	  ImageUploader.markImageAsWaiting(urlPairsArr, imgUrl);
	  
	  ImageUploader.onHdnDocLoad(RteEngine.curRteId, imgUrl);

	  return true;
	}, 
  onCanceledUploadPastedImage : function() {
    var rteObj = RteEngine.getRteById(RteEngine.curRteId);
    rteObj.onUndo(); // does not work with IE!
  }

}

/***********************************************
* ImageUploader
*
* only local user's images need to be loaded
************************************************/
var ImageUploader = {
  // image uploading (insertion) dialog
  FORM_NAME         : "image_uploading",
  ACTION_URL        : "mkresource", // TODO:
  FILE_INPUT_NAME   : "file",
  RTE_ID_INPUT_NAME : "rte_id",

  HDN_IFRAME_NAME   : "hiddenIframe",
  WAIT_FLAG : "waiting",
  
  newImgPair : null,
  
  getUploadImageFormContent : function(submitCallbackName, submitBtnText) {
    var forms = document.forms;
    var resourceUri;
    for (var i=0; i<forms.length; i++) {
      if(forms[i].name  &&  forms[i].name.indexOf('tablePropertyList$') == 0
          && forms[i].elements['uri']) {
        resourceUri = forms[i].elements['uri'].value;
        break;
      }
    }
    
    var formStr = "<form name=\"" + this.FORM_NAME + "\""
      + " target=\"" + this.HDN_IFRAME_NAME + "\""
      + " method=\"post\""
      + " enctype=\"multipart/form-data\""
      + " action=\"" + this.ACTION_URL + "\""
      + " onsubmit=\"return " + submitCallbackName + "\""
      + ">"
      
      + " <table><tr><td>" 
      + " <input type=\"file\" name=\"" + this.FILE_INPUT_NAME + "\""
      + " id=\"" + this.FILE_INPUT_NAME + "\" size=\"40\"  style=\"margin-top:20px;\">"
      
      + " <input type=\"hidden\" name=\"" + this.RTE_ID_INPUT_NAME + "\""
      + " id=\"" + this.RTE_ID_INPUT_NAME + "\">"
      + " </td></tr>"
      + " <tr><td align=\"center\">"
      + " <input type=\"submit\" value=\"" + submitBtnText + "\">"

      + " <input type=\"hidden\" name=\"-$action\" value=\"upload\">"
      + " <input type=\"hidden\" name=\"uri\" value=\""
      + resourceUri      
      + "\">"

      + " </td></tr><table>"
    + " </form>";
    return formStr;
  },
  putRteIdInForm : function(form, rteId) {
    var rteIdEnc = encodeURIComponent(rteId);
    var inpObj = getChildById(form, this.RTE_ID_INPUT_NAME); 
    inpObj.value = rteIdEnc;
  },
  getImageUrlFromForm : function(form) {
    //var flInp = getChildById(form, this.FILE_INPUT_NAME);
    var value = form[ImageUploader.FILE_INPUT_NAME].value;
    if(value.length == 0) {
      alert("The field is empty!");
      return null;
    }
    return value;    
  },
  
  // mark image as waiting on the server response
  markImageAsWaiting : function(urlPairsArr, originalUrl) {
    var pair = new ImageUploader.UrlPair(originalUrl, ImageUploader.WAIT_FLAG);
    urlPairsArr.push(pair);
  },
  
  // callback on the server response.
  onHdnDocLoad : function(rteId, originalUrl) {
    var frameId = ImageUploader.HDN_IFRAME_NAME;
    if (!frameLoaded[frameId]) {
      var timeOutFunction = function () { ImageUploader.onHdnDocLoad(rteId, originalUrl) };
      setTimeout(timeOutFunction, 50);
      return;
    }
    frameLoaded[frameId] = false;
    // -------------------------------------------------
    var frameBody = frames[frameId].document.body;
    var frameDoc  = frames[frameId].document;
    var frameBody = frameDoc.body;
    var d = frameDoc.getElementById("location");
    if (d)
      frameBody = d;

    uploadedUrl = frameBody.innerHTML;
    uploadedUrl = decodeURI( uploadedUrl );

    // 2. replace url with the uploaded one.  
    // 2.1 get rte object
    var rteObj = RteEngine.getRteById(rteId);
    if(rteObj == null)
      return; // this RTE was canceled.
      // TODO: SUBMISION should be suspended while uploading.

    // 2.2 uploade URL to the images array
    var imgUrlsArr = rteObj.getImgUrlsArray();
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].originalUrl == originalUrl) {
        imgUrlsArr[i].uploadedUrl = uploadedUrl;
      }
    }
    // 2.3 replace URL of the image in the document
    var rteDoc = rteObj.getDocument();
    var images = rteDoc.getElementsByTagName("img");
    originalUrl = originalUrl.toLowerCase();
    for(var i = 0; i < images.length; i++) {
      var src = images[i].src.toLowerCase();
      var decSrc = decodeURI(src);
      if(src.indexOf(originalUrl) != -1 ||
          decSrc.indexOf(originalUrl) != -1) {
        images[i].src = uploadedUrl;
      }
    }
  },
  
  // image object or its src
  isImageLocal : function(imgObj) {
    var src;
    if(typeof imgObj == 'string')
      src = imgObj;
    else
      src = imgObj.src;
    
    src = src.toLowerCase();
    if(src.indexOf("http") == 0)
      return false;
    else if(src.indexOf("file") == 0)
      return true;
    else if(src.indexOf(":") == 1) // c:
      return true; 

    return false;
  },

  // UrlPair -------------
  UrlPair : function(originalUrl, uploadedUrl) {
    this.originalUrl = originalUrl;
    this.uploadedUrl = uploadedUrl;
  },
  // uploaded or waiting on response
  isImageHandled : function(imgUrlsArr, imgUrl) {
    var isUploaded = this.isImageUploaded(imgUrlsArr, imgUrl);
    var isWaiting = this.isImageWaitingResponse(imgUrlsArr, imgUrl);
    return (isUploaded && isWaiting);
  },
  isImageUploaded : function(imgUrlsArr, src) {
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].uploadedUrl == src)
        return true;
    }
    return false;
  },
  isImageWaitingResponse : function(imgUrlsArr, src) {
    for(var i = 0; i < imgUrlsArr.length; i++) {
      if((imgUrlsArr[i].originalUrl == src) &&
          imgUrlsArr[i].uploadedUrl == this.WAIT_FLAG)
        return true;
    }
    return false;
  },

  getUploadedUrlOfCopy : function(imgUrlsArr, imgUrl) {
  for(var i = 0; i < imgUrlsArr.length; i++) {
      if(imgUrlsArr[i].originalUrl == imgUrl)
        return imgUrlsArr[i].uploadedUrl;
    }
    return null;
  }
}


/**********************************
* Rte - single rte elemnt.
* toInit used for IE and to prevent initialization before document complitly loaded
***********************************/
function Rte(iframeObj, dataFieldId, rtePref) {
	var i_am = this;
	this.iframeObj = iframeObj;
	this.dataFieldId = dataFieldId;
	this.rtePref = rtePref;
	this.window = null; // window of the iframe
	this.document = null; // document of the iframe
	this.toolbar = null;
	this.parentDiv = this.iframeObj.parentNode;
	this.dataField = null; // hidden field to transfer data
	this.curRange = null;
	this.isSourceView = false;
	this.initFrameHeight = null;

  // only if isChanged == true, the content is copied into data field to submit
  this.isChanged = false;

	this.isIE = false;
	this.isOpera = false;
	this.isNetscape = false;

	this.skipClose = false;
	this.FFhacked = false;
  this.br_appended = false; // FF: when RTE is empty it does not show caret.
  
	this.currentPopup = null; // prevents closing on popup opening
	this.openedAtTime = 0;    // hack: prevents simultaneous openning and toolbar button execution

	// buttons objects
	this.styleBtn = null;
	this.fontBtn = null;
	this.sizeBtn = null;
	this.textColorBtn = null;
	this.bgColorBtn = null;
	this.smileBtn = null;
	this.linkBtn = null;
	this.imageBtn = null;
	this.tableBtn = null;
	this.htmlBtn = null;

  this.chosenTextClr = null; // last chosen colors
  this.chosenBgClr   = null; 
  
  this.imgUrlsArr = new Array(); // pairs of url: 1)orig; 2)uploaded
  
	this.isInitialized = false;

	// init
	this.init = function() {
		if(this.isInitialized)
			return;
		else
			this.isInitialized = true;

		// browser detection
		this.browserDetection();

		// set text and edit mode
		this.window = this.iframeObj.contentWindow;
		this.document = this.window.document;
		if(typeof this.document.designMode == 'undefined') {
		  alert("designMode is not surpported");
		  throw "designMode is not surpported";
		}
	  this.document.designMode = "On";

		this.initFrameHeight = this.iframeObj.clientHeight;
		this.initContent();

		// create toolbar if it is not autoClose
		// else create it on 1st click in - (onfocus handler)
		if(!this.rtePref.autoClose) {
				this.toolbar = this.createToolbar();
				this.iframeObj.style.marginTop = this.toolbar.getHeight() + 1;
		}
		// set handlers
		this.setHandlers();
	  
	  if(this.isNetscape) // turn on Mozila's spellcheck
      this.document.body.spellcheck = true;
    
    if(typeof Popup != 'undefined' && Popup.iPhone)
      this.document.body.style.webkitUserModify = "read-write";
    
    // load css of the parent page
    this.loadCSS();
	}
	this.browserDetection = function() {
		if(Popup.ie)
			this.isIE = true;
		else if(Popup.opera)
			this.isOpera = true;
		else if(Popup.gecko)
		  this.isNetscape = true;
	}
	this.setHandlers = function() {
		addEvent(this.iframeObj, "deactivate", this._ondeactivate, false);
		addEvent(this.document, 'keyup', this._onkeyup, false);
		// IE: paste
		addEvent(this.document.body, 'paste', this._onpaste, false);


		if(this.rtePref.autoClose) {
      addEvent(document, 'click', this.onlosefocus, false);

      if(Popup.ie)
		    addEvent(this.iframeObj, 'focus', this.onfocus, false);
			else if(Popup.safari)
			  addEvent(this.window, 'focus', this.onfocus, false);
			else // FF, Opera
			  addEvent(this.document, 'focus', this.onfocus, false);
		}
	}
  this.loadCSS = function() {
		var cssFiles = ['../styles/common.css', '../styles/properties.css'];
		for(var i = 0; i < cssFiles.length; i++) {
		  if(this.document.createStyleSheet) {
        this.document.createStyleSheet(cssFiles[i]);
      }
      else {
        var newSS=document.createElement('link');
        newSS.rel='stylesheet';
        newSS.type='text/css';
        newSS.href=escape(cssFiles[i]);
        this.document.getElementsByTagName("head")[0].appendChild(newSS);
      } 
    }
  }
	this.createToolbar = function() {
		// 1.
		var toolBar = new Toolbar(this.parentDiv, this, 18);
		// 2. add buttons
		if(this.rtePref.buttons.style) // style
			this.styleBtn = toolBar.appendButton(this.onStyle, false, RteEngine.IMAGES_FOLDER + "style.gif", "style");
		if(this.rtePref.buttons.font) { // font + size
			this.fontBtn = toolBar.appendButton(this.onFont, false, RteEngine.IMAGES_FOLDER + "font.gif", "font");
			this.sizeBtn = toolBar.appendButton(this.onSize, false, RteEngine.IMAGES_FOLDER + "size.gif", "size");
		}
		if(this.rtePref.buttons.decoration) { // bold + italic + underline
			toolBar.appendButton(this.onBold, false, RteEngine.IMAGES_FOLDER + "bold.gif", "bold");
			toolBar.appendButton(this.onItalic, false, RteEngine.IMAGES_FOLDER + "italic.gif", "italic");
			toolBar.appendButton(this.onUnderline, false, RteEngine.IMAGES_FOLDER + "underline.gif", "underline");
		}
		if(this.rtePref.buttons.supsub) { // superscript + subscript
			toolBar.appendButton(this.onSuperscript, false, RteEngine.IMAGES_FOLDER + "superscript.gif", "superscript");
			toolBar.appendButton(this.onSubscript, false, RteEngine.IMAGES_FOLDER + "subscript.gif", "subscript");
		}
		if(this.rtePref.buttons.align) { // align: left + centre + right + justifyfull
			toolBar.appendButton(this.onAlignLeft, false, RteEngine.IMAGES_FOLDER + "align_left.gif", "align left");
			toolBar.appendButton(this.onAlignCenter, false, RteEngine.IMAGES_FOLDER + "align_center.gif", "align center");
			toolBar.appendButton(this.onAlignRight, false, RteEngine.IMAGES_FOLDER + "align_right.gif", "align right");
			toolBar.appendButton(this.onAlignJustify, false, RteEngine.IMAGES_FOLDER + "justifyfull.gif", "justify");
		}
		if(this.rtePref.buttons.dent) { // outdent + indent
			toolBar.appendButton(this.onOutdent, false, RteEngine.IMAGES_FOLDER + "outdent.gif", "outdent");
			toolBar.appendButton(this.onIndent, false, RteEngine.IMAGES_FOLDER + "indent.gif", "indent");
		}
		if(this.rtePref.buttons.list) { // list: ordered + unordered
			toolBar.appendButton(this.onOrderedList, false, RteEngine.IMAGES_FOLDER + "list_num.gif", "ordered list");
			toolBar.appendButton(this.onUnorderedList, false, RteEngine.IMAGES_FOLDER + "list_bullet.gif", "unordered list");
		}
		if(this.rtePref.buttons.text_color)  // text color
			this.textColorBtn = toolBar.appendButton(this.onTextColor, false, RteEngine.IMAGES_FOLDER + "font_color.gif", "text color");
		if(this.rtePref.buttons.bg_color)  // background color
			this.bgColorBtn = toolBar.appendButton(this.onBackgroundColor, false, RteEngine.IMAGES_FOLDER + "background_color.gif", "background color");
		if(this.rtePref.buttons.link) // hyperlink
			this.linkBtn = toolBar.appendButton(this.onLink, false, RteEngine.IMAGES_FOLDER + "hyperlink.gif", "hyperlink");
		if(this.rtePref.buttons.image) // image
			this.imageBtn = toolBar.appendButton(this.onImage, false, RteEngine.IMAGES_FOLDER + "image.gif", "image");
		if(this.rtePref.buttons.smile) // smile
			this.smileBtn = toolBar.appendButton(this.onSmile, false, RteEngine.IMAGES_FOLDER + "smile.gif", "smile");
		if(this.rtePref.buttons.line) // line
			toolBar.appendButton(this.onHorizontalRule, false, RteEngine.IMAGES_FOLDER + "hr.gif", "horizontal line");
		if(this.rtePref.buttons.table) // table
			this.tableBtn = toolBar.appendButton(this.onTable, false, RteEngine.IMAGES_FOLDER + "table.gif", "table");
		if(this.rtePref.buttons.reundo) { // redo + undo
			toolBar.appendButton(this.onUndo, false, RteEngine.IMAGES_FOLDER + "undo.gif", "undo");
			toolBar.appendButton(this.onRedo, false, RteEngine.IMAGES_FOLDER + "redo.gif", "redo");
		}
		if(this.rtePref.buttons.html) // html
			this.htmlBtn = toolBar.appendButton(this.onSource, true, RteEngine.IMAGES_FOLDER + "html.gif", "html view mode", "edit mode");
		return toolBar;
	}

	// interface function which be called by the toolbar
	// "onOverflowBtn"
	this.onOverflowBtn = function() {
		this.skipClose = true;
	}
	this.initContent = function() {
		var text = this.getDataField().value;
		// hack. FF does not show caret in empty RTE
		if(this.isNetscape && text.length == 0) {
		  text = "<br>";
		  this.br_appended = true;
		}

		this.putContent(text);
	}
	// putContent
	this.putContent = function(text) {
		var frameHtml = "<html>\n";
		frameHtml += "<head>";
		if(this.isIE)
		  frameHtml += "<link href='styles/common.css' type='text/css' rel='stylesheet'>";
		frameHtml += "</head>";
		frameHtml += "<body>";
		frameHtml += text + "";
		frameHtml += "</body>";
		frameHtml += "</html>";

		this.document.open();
		this.document.write(frameHtml);
		this.document.close();
	}
	// it used for a non standart command like a table insert.
	this.insertHTML = function(html) {
		try {
			this.document.execCommand('insertHTML', false, html);
		}
		catch(e) { // for IE
			if(this.curRange == null)
				return;
			this.curRange.pasteHTML(html);
			this.curRange.collapse(false);
			this.curRange.select();
		}
		this.skipClose = true;
	}
	// not source view & (hack:) not immediate execution that autoclose the RTE
	this.isAllowedToExecute = function() {
		if(this.isSourceView)
			return false;
		var curTime = new Date().getTime();
		if(curTime - this.openedAtTime < 500) // 500 ms
			return false;

		return true;
	}
	this.getHtmlContent = function() {
	  var content = "";
		if(this.isSourceView) {
				if(typeof this.document.body.innerText == 'undefined')
					content =  this.document.body.textContent;
				else
					content =  this.document.body.innerText;
			}
		else
			content =  this.document.body.innerHTML;
		// hack. remove <br> appended in initContent()
		if(this.isNetscape && this.br_appended) {
  		var brIdx = content.lastIndexOf("<br>")
	    content = content.slice(0, brIdx);
		}

		return content;
	}
	this.getId = function() {
    return this.iframeObj.id;
  }
  this.getIframe = function() {
    return this.iframeObj;
  }
  this.getDocument = function() {
    return this.document;
  }
  this.getImgUrlsArray = function() {
    return this.imgUrlsArr;
  }
  this.getWidth = function() {
    return this.iframeObj.offsetWidth;  
  }
  
	this.getDataField = function() {
		if(this.dataField == null) {
			this.dataField = getChildById(this.parentDiv, this.dataFieldId);
		    if (this.dataField == null)
		      throw new Error("form field " + this.dataFieldId + " not found");
		}
		return this.dataField;
	}
	this.putRteData = function() {
	  if(this.isChanged == false)
	    return;
		var text = this.getHtmlContent();
		// some html cleanup
		// 1. remove ending space.
		text = trim(text);
		// 2. remove new line that FF surrounds the text
		text = text.replace(/^\n/, "");
		text = text.replace(/\n$/, "");
		// 3. convert all tags to lower case
		// IE (Opera) returns in uppercase; FF in lower case. It can change RTE resource.
		var upTags = text.match(/<.[A-Z]*.>/g);
		if(upTags != null) {
		  for(var i = 0; i < upTags.length; i++)
        text = text.replace(upTags[i], upTags[i].toLowerCase());
		}

		// set value in hidden data field.
		this.getDataField().value = text;
	}

	// handlers --------------
	this.onfocus = function() {
	  if(i_am.toolbar == null)
	    i_am.toolbar = i_am.createToolbar();

    if(i_am.toolbar.isVisible())
      return;
    
		i_am.iframeObj.style.marginTop = i_am.toolbar.getHeight() + 1;
		i_am.fitHeightToVisible();
		i_am.toolbar.show();
		// prevents from more than 1 opened RTE.
		RteEngine.closeAllDisactived(i_am.iframeObj.id);
		i_am.openedAtTime = new Date().getTime();
	}
	// "closes" an active RTE
	this.onlosefocus = function(e) {
		if(!i_am.isAllowedToExecute()) // not source view & not immediate execution
			return;
		if(i_am.currentPopup != null && i_am.currentPopup.style.visibility == "visible")
			return;

		if(i_am.skipClose) {
			i_am.skipClose = false;
			return;
		}

		// FF: prevents toolbar close on scrolling
    if(e && e.target && e.target.nodeName == "HTML")
      return;

		i_am.iframeObj.style.height = i_am.initFrameHeight;
		i_am.iframeObj.style.marginTop = 0;
    if (i_am.toolbar)
		  i_am.toolbar.hide();
		
		i_am.iframeObj.setAttribute("scrolling", "no");   
	}

	// IE's hack
	// to store the current range to which to apply the command
	this._ondeactivate = function() {
		i_am.curRange = i_am.document.selection.createRange();
	}
	this._onkeyup = function(e) {
		i_am.fitHeightToVisible();

		// FF onpaste
		e = getDocumentEvent(e);
    if((e.ctrlKey && e.keyCode == 86) // e.DOM_VK_V
         || (e.shiftKey && e.keyCode == 45)) /* e.DOM_VK_INSERT */ {
     RteEngine.onPasteHandler(i_am.iframeObj.id); 
    }
    // except navigation keys
    if(e.keyCode < 33 || e.keyCode > 40)
      i_am.isChanged = true;
	}

	this.fitHeightToVisible = function() {
		// apply it if no scrolling
		if(this.iframeObj.scrolling != 'no')
			return;
		var docH = i_am.document.body.scrollHeight;
		if(docH < i_am.initFrameHeight)
			return;

    // FF: limit max RTE height
    // IE & Opera: failed to turn on a scrollbar in JS.
    // So, on this moment, in IE & Opera no height limitation. 
		var frmH = i_am.iframeObj.clientHeight;
		var maxHeight = getWindowSize()[1] * 0.9;
		if(docH > maxHeight && this.isNetscape) {
		  i_am.iframeObj.setAttribute("scrolling", "auto"); 
		  i_am.iframeObj.style.height = maxHeight;
		}
		else {
		  if(frmH != docH)
			  i_am.iframeObj.style.height = docH;
   		  i_am.iframeObj.setAttribute("scrolling", "no"); 
		}
	}
  
  this._onpaste = function(e) {
     var execCode = "RteEngine.onPasteHandler('" + i_am.iframeObj.id + "')"
     setTimeout(execCode, 1);
     i_am.isChanged = true;
  }
  
	// --------------------------------------
	// 1
	this.onStyle = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchStylePopup(i_am.styleBtn, i_am.setStyle);
	}
	// 2
	this.onFont = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchFontPopup(i_am.fontBtn, i_am.setFont, i_am.rtePref.isFewFonts);
	}
	// 3
	this.onSize = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchSizePopup(i_am.sizeBtn, i_am.setSize);
	}
	// 4
	this.onSmile = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchSmilePopup(i_am.smileBtn, i_am.setSmile);
	}
	// 5
	// return true - to close the overflow popup if the button is overflowed.
	this.onBold = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("bold", null, true);
		return true;
	}
	// 6
	this.onItalic = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("italic", null, true);
		return true;
	}
	// 7
	this.onUnderline = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("underline", null, true);
		return true;
	}
	// 8
	this.onAlignLeft = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyleft", null, true);
		return true;
	}
	// 9
	this.onAlignCenter = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifycenter", null, true);
		return true;
	}
	// 10
	this.onAlignRight = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyright", null, true);
		return true;
	}
	// 11
	this.onAlignJustify = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("justifyfull", null, true);
		return true;
	}
	// 12
	this.onHorizontalRule = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("inserthorizontalrule", null, true);
		return true;
	}
	// 13
	this.onOrderedList = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("insertorderedlist", null, true);
		return true;
	}
	// 14
	this.onUnorderedList = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("insertunorderedlist", null, true);
		return true;
	}
	// 15
	this.onOutdent = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("outdent", null, true);
		return true;
	}
	// 16
	this.onIndent = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("indent", null, true);
		return true;
	}
	// 17
	this.onTextColor = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchTextColorPopup(i_am.textColorBtn, i_am.setTextColor,  i_am.chosenTextClr);
	}
	// 18
	this.onBackgroundColor = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchBgColorPopup(i_am.bgColorBtn, i_am.setBackgroundColor, i_am.chosenBgClr);
	}
	// 19
	this.onLink = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchLinkPopup(i_am.linkBtn, i_am.setLink, i_am.cancelLink);
	}
	// 20
	this.onImage = function() {
		if(!i_am.isAllowedToExecute())
			return;
		
		i_am.currentPopup = RteEngine.launchImagePopup(i_am.imageBtn, i_am.setImage, i_am.iframeObj.id, i_am.cancelImage);
	}
	// 21
	this.onTable = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.currentPopup = RteEngine.launchTablePopup(i_am.tableBtn, i_am.setTable, i_am.cancelImage);
	}
	this.onSuperscript = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("superscript", null, true);
		return true;
	}
	this.onSubscript = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("subscript", null, true);
		return true;
	}
	this.onRedo = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("redo", null, true);
		return true;
	}
	this.onUndo = function() {
		if(!i_am.isAllowedToExecute())
			return;
		i_am.performCommand("undo", null, true);
		return true;
	}
	// 0
	this.onSource = function(pressed) {
		var html;
		if(i_am.document.importNode) { // FF --
			if(pressed) {
				html = document.createTextNode(i_am.document.body.innerHTML);
				i_am.document.body.innerHTML = "";
				html = i_am.document.importNode(html,false);
				i_am.document.body.appendChild(html);
				i_am.document.designMode = "Off";
			}
			else {
				html = i_am.document.body.ownerDocument.createRange();
				html.selectNodeContents(i_am.document.body);
				i_am.document.body.innerHTML = html.toString();
				i_am.document.designMode = "On";
			}
		}
		else {
			if(pressed) { // IE --
				var iHTML = i_am.document.body.innerHTML;

				i_am.document.designMode = "Off";
				i_am.putContent(iHTML); // hack: restore the document after designMode = "Off"
				i_am.document.body.innerText = iHTML;
			}
			else {
				var iText = i_am.document.body.innerText;
				//i_am.document.body.innerHTML = iText;
				i_am.document.designMode = "On";
				
				i_am.putContent(iText);
			}
		}
		i_am.isSourceView = pressed;

		if(i_am.isSourceView)
			i_am.toolbar.disableAllControls(i_am.htmlBtn);
		else
			i_am.toolbar.enableAllControls();

		// prevent a closing
		i_am.skipClose = true;
		return true;
	}

	// "setters" (on selection in a popup) ----------
	// 1
	this.setStyle = function(idx) {
		var value = RteEngine.STYLES[idx].value;
		i_am.performCommand("formatblock", value);
		return true;
	}
	// 2
	this.setFont = function(idx) {
		if(i_am.rtePref.isFewFonts)
			var value = RteEngine.FONTS[idx];
		else
			var value = RteEngine.FONTS_FEW[idx];
		i_am.performCommand("fontname", value);
		return true;
	}
	// 3
	this.setSize = function(idx) {
		var value = idx + 1;
		i_am.performCommand("fontsize", value);
		return true;
	}
	// 4
	this.setSmile = function(idx) {
		var hostUrl = RteEngine.getHostUrl();
		var imgPath = hostUrl + RteEngine.IMAGES_FOLDER + "smiles/" + (idx + 1) + ".gif";
		i_am.insertHTML("<img src=" + imgPath + ">");
	}
	// 5
	this.setTextColor = function(color) {
		i_am.performCommand("forecolor", color);
		i_am.chosenTextClr = color;
		return true;
	}
	// 6
	this.setBackgroundColor = function(color) {
		if(i_am.performCommand("hilitecolor", color) == false) { // FF
			i_am.performCommand("backcolor", color) // IE
		}
		i_am.chosenBgClr = color;
		return true;
	}
	// 7
	this.setLink = function(params) {
		if(params.url.length == 0)
		  return;
		var url = params.url
		if(params.is_blank)
		  url += "__blank";
		
		i_am.performCommand("createlink", url);
		
		if(params.is_blank) {
		  var links = i_am.document.body.getElementsByTagName("a");
		  for(var i = 0; i < links.length; i++) {
		    if(links[i].href == url) {
		      links[i].setAttribute("target", "_blank");
		      links[i].href = links[i].href.replace(/__blank$/, "");
		    }
		  }
		}

		return true;
	}
	// 8
	this.setImage = function(url) { // params  // params.url
		if(url.length != 0)
			i_am.performCommand("insertimage", url);
		return true;
	}
	// 9
	this.setTable = function(params) {
	// names of parameters are from the corresponding form
		var html =
		'<table width=' + params.width + params.widthType
		+ ' cellpadding=' + params.padding + ' cellspacing=' + params.spacing
		+ ' border=' + params.border + '> ';

		for(var r = 0; r < params.rows; r++) {
			html += ' <tr>';
			for(var c = 0; c < params.columns; c++)
				html += ' <td></td>';
			html += ' </tr>';
		}
		html += ' </table>';

		i_am.insertHTML(html);
	}
	// cancel ------------------------------
	this.cancelLink = function() {
	  i_am.skipClose = true;
	}
	this.cancelImage = function() {
    i_am.skipClose = true;
	}
	this.cancelTable = function() {
    i_am.skipClose = true;
	}
		
	// -------------------------------------
	// execute a command
	this.performCommand = function(command, value, skipClose) {
		this.window.focus();
		if(this.isSourceView)
			return;
		try {
		var performed = false;
		if(this.curRange != null) { // for IE
			this.curRange.select();
			performed = this.curRange.execCommand(command, false, value);
		}
		if(performed == false)
			this.document.execCommand(command, false, value);
		}catch(e) {
			return false;
		}
		this.window.focus();

	  this.skipClose = true;
	  this.isChanged = true;
		return true;
	}

	// constructor body --
	this.init();
}

/********   TArea used instead RTE if the last imposible to create   *********/
function TArea(iframeObj, dataFieldId, rtePref) {
	var i_am = this;

  this.textArea = null;
	this.iframeObj = iframeObj;
	this.dataFieldId = dataFieldId;
	this.parentDiv = this.iframeObj.parentNode;
	this.dataField = null; // hidden field to transfer data
  this.initHeight = null;

  // substitute iframe with a text area
  this.init = function() {
    this.textArea = document.createElement('textarea');
    this.textArea.style.width = "100%";
    this.textArea.style.height = this.iframeObj.clientHeight;
    this.initHeight = this.iframeObj.clientHeight;
    this.textArea.style.fontSize = "14px";
    this.textArea.id = this.iframeObj.id;

    // convert html into a plain text.
    // remove tags (alternative is to replace with " ")
    var text = this.getDataField().value;
    var plainText = text.replace(/<\/?[^>]+(>|$)/g, "")
    this.textArea.innerText = plainText;
    
    // set handlers
    addEvent(this.textArea, 'keyup', this._onkeyup, false);
		addEvent(this.textArea, 'focus', this.onfocus, false);
    addEvent(document, 'mouseup', this.onlosefocus, false);

    this.parentDiv.replaceChild(this.textArea, this.iframeObj);
  }
  this.getId = function() {
    return this.textArea.id;
  }
  this.getDataField = function() {
		if(this.dataField == null) {
			this.dataField = getChildById(this.parentDiv, this.dataFieldId);
		    if (this.dataField == null)
		      throw new Error("form field " + this.dataFieldId + " not found");
		}
		return this.dataField;
  }

  this.putRteData = function() {
		this.getDataField().value = this.textArea.value;
  }

  // focus
  this. onfocus = function() {
    i_am.fitHeightToVisible();
	  RteEngine.closeAllDisactived(i_am.iframeObj.id);
  }
  // losefocus
  this.onlosefocus = function(e) {
    i_am.textArea.style.height = i_am.initHeight;
  }

  // resize
  this._onkeyup = function(evt) {
		i_am.fitHeightToVisible();
	}

	this.fitHeightToVisible = function() {
		var scrlH = i_am.textArea.scrollHeight; // not work with Opera 8.54
		if(scrlH < i_am.initHeight)
			return;

		var taH = i_am.textArea.clientHeight;
		if(taH != scrlH) {
			i_am.textArea.height = scrlH;
		}
	}

  // constructor body
  this.init();
}
