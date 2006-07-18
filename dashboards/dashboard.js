	// onLoading section -------------
    var numberOfcolumns = 3;
    var g_dbNames = new Array(); // contains filenames of dashboards
    addEvent(window, 'resize', function() {makeBoardsAlligned();}, false);
    addEvent(window, 'load', initDashboard, false);

    function selectItemToAddToDashboard(panel){
      // window.alert must be done if nothing was selected to add
      if(document.getElementById('itemToAdd').value == "") {
        window.alert("nothing to add. Please, select the panel you'd like to add.");
        return;
      }
      
      // since new board is added then target must be ampty
      document.getElementById("dashBoard").target = '';

      // panel1URIs, panel2URIs, panel3URIs contain the list of id's of the divs according to the panel (column of boards).
      // This ids contain the URI of the board that is displayed together with the random int number gererated on the server side.
      // setPanelsClearURIsLists() cleans this lists and leave just URI's of the boards that must be displayed
      setPanelsClearURIsLists();

      //document.getElementById('location').value = window.location;//getLocation();//window.location;

      // corresponding panel(i)URIs value must be appended by the URI that must be added to this column.
      document.getElementById(panel + 'URIs').value = document.getElementById('itemToAdd').value + ";" + document.getElementById(panel + 'URIs').value; 

      //window.alert(document.dashBoard.panel1URIs.value);
      // submit dashboard form
      document.getElementById('dashBoardPanel1URIs').value = document.getElementById('panel1URIs').value;
      document.getElementById('dashBoardPanel2URIs').value = document.getElementById('panel2URIs').value;
      document.getElementById('dashBoardPanel3URIs').value = document.getElementById('panel3URIs').value;
      document.getElementById('dashBoardIsClosePanel').value = document.getElementById('isClosePanel').value;

	  var params = getUrlParams();
      document.getElementById('dashBoardParseFile').value = params.parseFile; //document.getElementById('location').value;
	  document.getElementById('dashBoardSaveFile').value = params.saveFile;
	  document.getElementById('dashBoardHomeDashboard').value = params.homeDashboard;
      
      document.getElementById('dashBoard').submit();
    }
 
    // bookmark that must be added
    function setItemToAdd(value) {
      document.getElementById('itemToAdd').value = value;
    }
    
    // constructs panel(i)URIs values so that they will contain the id's of the boards that are displayed
    // id is something like this lyr_randomInt|_bookmarkURI
    function setPanelsURIsLists() {
      //for(i=1;i<numberOfcolumns;i++)
      //  document.getElementById('panel'+i+'URIs').value = replaceAllRecursion(getURIsListForPanel('panel'+i), "amp;amp;", "&");
      
      document.getElementById('panel1URIs').value = replaceAllRecursion(getURIsListForPanel('panel1'), "amp;amp;", "&");
      document.getElementById('panel2URIs').value = replaceAllRecursion(getURIsListForPanel('panel2'), "amp;amp;", "&");
      document.getElementById('panel3URIs').value = replaceAllRecursion(getURIsListForPanel('panel3'), "amp;amp;", "&");
      
    }

    // constructs panel(i)URIs values so that they will contain just the bookmarks URIs that must be displayed
    function setPanelsClearURIsLists() {
      document.getElementById('panel1URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel1'), "amp;amp;", "&");
      document.getElementById('panel2URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel2'), "amp;amp;", "&");
      document.getElementById('panel3URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel3'), "amp;amp;", "&");
    }
    
    // constructs panel(i)URIs values so that they will contain the id's of the boards that are displayed
    // id is something like this lyr_randomInt|_bookmarkURI
    function getURIsListForPanel(panelName) {
      var s = "";
      for(j=1;j<=numberOfcolumns;j++)
        if(panelName == "panel" + j) {
          for(i=0;i<aElts[j-1].length;i++)
            s += aElts[j-1][i].name + ";";
          return s;
        }
    }
    
    // constructs panel(i)URIs values so that they will contain just the bookmarks URIs that must be displayed
    function getClearURIsListForPanel(panelName) {
	  if(aElts == null)
		return null;	
      var s = "";
      for(j=1;j<=numberOfcolumns;j++)
        if(panelName == "panel" + j) {
          for(i=0;i<aElts[j-1].length;i++)
            s += aElts[j-1][i].name.substring(aElts[j-1][i].name.indexOf("|_")+2,aElts[j-1][i].name.length) + ";";
          return s;
        }
    }

    // "add" board panel must be in the bottom of the page
    function makeAddRemovePanelAlligned() {
      var maxHeight = 0;
      for(i=0;i<aElts.length;i++)
        for(j=0;j<aElts[i].length;j++) {
          //if(findPosY(aElts[i][j]) > maxHeight)
          if(aElts[i][j].y + document.getElementById('main' + aElts[i][j].name).offsetHeight > maxHeight)
            //maxHeight = findPosY(aElts[i][j]);
            maxHeight = aElts[i][j].y + document.getElementById('main' + aElts[i][j].name).offsetHeight;
        }
      if(maxHeight == 0) maxHeight = 50;
      document.getElementById('addRemovePanel').style.height = maxHeight - 20;// + 50;
      //fadeBoards(); // d&d bug: if draggable layer contains link directly under mouse cursor - link is clicked on drop
    }
    
    // function that removes board from the page
    function removeBoard(boardId, panelName) {
	  var boardTitleObj = document.getElementById(boardId);
      if(boardTitleObj == null)
			return;
      
      // 1. remove from the array of boards on the page
      remove(aElts, boardTitleObj, 10);
      var parentContainer = boardTitleObj.parentNode;

	  // 2. remove board as DOM object
	  // 2.1. remove the title.
	  parentContainer.removeChild(boardTitleObj);
	
	  // 2.2 remove the board body	
      var boarContainerObj = document.getElementById('main'+boardId);
	  // ' innerHTML = "" ' prevents from IE's crash.
	  boarContainerObj.innerHTML = "";
	  parentContainer.removeChild(boarContainerObj);
		
	 //	3.
	 // remove a board from a "list" of dragable DIVs
	 removeDragableObj(boardId);
	
    
	  document.getElementById(panelName+'URIs').value = document.getElementById(panelName+'URIs').value.replace(boardId + ';', ''); // remove board from the list of boards in the column (in the panel)
      makeBoardsAlligned();

      document.getElementById("dashBoard").target='dashboardIframe';
      setPanelsClearURIsLists();
      
      // "saveFile" & "parseFile" must be without suffix Edit!
      var loc = window.location.href.replace("Edit", "");
      document.getElementById('location').value = window.location; 
      document.getElementById('isClosePanel').value = 'true';
      
      document.getElementById('dashBoardPanel1URIs').value = document.getElementById('panel1URIs').value;
      document.getElementById('dashBoardPanel2URIs').value = document.getElementById('panel2URIs').value;
      document.getElementById('dashBoardPanel3URIs').value = document.getElementById('panel3URIs').value;
      document.getElementById('dashBoardParseFile').value = loc;
      document.getElementById('dashBoardIsClosePanel').value = document.getElementById('isClosePanel').value;
   	  // for existent dashboard, SaveFile is the same as ParseFile.
	  document.getElementById('dashBoardSaveFile').value = loc;

      document.getElementById('dashBoard').submit();
      
      document.getElementById('isClosePanel').value = 'false';
      document.getElementById("dashBoard").target=window;
    }
    
    function findPosY(obj) {
      var curtop = 0;
      if (obj.offsetParent) {
        while (obj.offsetParent) {
          curtop += obj.offsetTop;
          obj = obj.offsetParent;
        }
      }
      else if (obj.y)
        curtop += obj.y;
      return curtop;
    }
    
    function findPosX(obj) {
      var curleft = 0;
      if (obj.offsetParent) {
        while (obj.offsetParent) {
          curleft += obj.offsetLeft;
          obj = obj.offsetParent;
        }
      }
      else if (obj.x)
        curleft += obj.x;
      return curleft;
    }
    
    function replaceAllRecursion(str, replStr, replWithStr) {
	  if(str == null)
		return;	
      if(str.indexOf(replStr)>=0)
        return replaceAllRecursion(str.replace(replStr, replWithStr), replStr, replWithStr)
       else
	       return str;
    }
    
    function addEvent(obj, evType, fn){
 	    if (obj.addEventListener){
  	    obj.addEventListener(evType, fn, true);
	  	  return true;
		  } else if (obj.attachEvent){
  		    var r = obj.attachEvent("on"+evType, fn);
	  	    return r;
		  	 } else {
			      return false;
  			   }
    }
       
    // There are 2 possible variant    
    // 1. URL on existent dashboard; no parameter.    
    // 2. New dashboard.
    function getUrlParams() {
    	var NEW_CREATOR = "blankEdit";
	    var urlData = parseURL();
    
		// without "Edit" suffix
		var creatorPath = urlData.path.replace("Edit", "");
		// new path for case of creation and the same for already exist file
		var newPath = urlData.path.replace(NEW_CREATOR, urlData.name);
		newPath = newPath.replace("Edit", "");
		return {saveFile:newPath, parseFile: creatorPath, homeDashboard: urlData.homeDashboard};
    }
    
    function initDashboard() {
		// it ensures immediate allignment
		if(typeof makeBoardsAlligned != 'undefined') {
				makeBoardsAlligned(); 
				makeAddRemovePanelAlligned(); 
				setPanelsURIsLists();
		}
		// litbox
		initDbList();
    }
    
    // fillls in the dashboard list
    // the data are in a global variable/string dbListData.
    function initDbList() {
//alert("initDbList");
   		// (meanwhile here) set tile in FF.
   		var curDashUrl = unescape(window.location.href);
		document.title = curDashUrl;
		
		var dbList = document.getElementById("db_list");
		if(dbList == null)
			return;
		
		// check if there are 2 strings at list.
		if(typeof dbListData == 'undefined')
			return;
		
		var dbArr = dbListData.split(";"); // ";" - separator
		if(dbArr.length < 3) // <select> + 2 dashboards
			return;
		
		dbList.onchange = goToOtherDashboard;
		// add options to the list
		for(var i = 0; i < dbArr.length; i++) {
			if(dbArr[i].length > 0) {
				if(dbArr[i] == curDashUrl) // skip the current dashboard
					continue;
				var optObj = document.createElement("option");
				optObj.value = dbArr[i];
				
				g_dbNames[i] = getDashboardName(dbArr[i]);
				
				var textObj = document.createTextNode(g_dbNames[i]);
				optObj.appendChild(textObj);
				dbList.appendChild(optObj);
			}
		}
    }
	
	function isEditMode() {
		var loc =  window.location.href;
		if(loc.indexOf("Edit.html") != -1)
			return true;
		return false;
	}
	
	// returns filename (without extension!)
    function getDashboardName(fullPath) {
		if(typeof fullPath == 'undefined')
			fullPath = window.location.href;
		var start = fullPath.lastIndexOf("/") + 1;
		var end   = fullPath.lastIndexOf(".");
		
		if(start == -1 || end == -1 || start > end)
			return fullPath;
		
		return fullPath.substring(start, end);
    }
        
    function goToOtherDashboard() {
		var dbList = document.getElementById("db_list");
		var newLoc = dbList.options[dbList.selectedIndex].value;
		window.location = newLoc;
    }
    
    function editDashboard() {
		if(checkIfUserLogged() == false)
			return;
		window.location = (window.location+'').replace('.html','Edit.html');
    }
    
    function finishEdit() {
   		if(window.location.href.indexOf("blankEdit.html") != -1) {
			isConfirmed = window.confirm("Finish editing without added boards\nleads to the loss of the dashboard!");
			if(!isConfirmed)
				return;
		}
		
		var loc = "";
		var params = getUrlParams();
		if(params.saveFile.localeCompare(params.parseFile) != 0) {
		    // new file & not saved on the server. Then go to the index file.
			var flName = getDashboardName(params.saveFile);
			loc = params.saveFile.replace(flName, "index");
		}
		else
			loc = params.saveFile;
		
		window.location = loc;
	}
    
    function createDashboard(isHomeDashboard) {
		if(checkIfUserLogged() == false)
			return;
			
		var newFileName = document.getElementById("createDashboard").value;
		// check correct file name
		if(newFileName == null || newFileName.length == 0) {
			window.alert("Type a new dashboard name.");
			return;
		}
		if(checkDashboardName(newFileName) == false)
			return;

		if(checkIfDashboardNameIsNew(newFileName) == false)
			return;

		// remove an extension if it was typed
		if(newFileName.lastIndexOf(".htm") == -1) {
			if(newFileName.lastIndexOf(".html") == -1)
				newFileName.replace(".html", "");
			else
				newFileName.replace(".htm", "");
		}
		var curLocation = window.location.href;
		var idx = curLocation.lastIndexOf("/") + 1;
		var goLoc = curLocation.substring(0, idx) + "blankEdit.html?name=" + newFileName;
		if(isHomeDashboard)
			goLoc += "&homeDashboard=yes";
		
		window.location = goLoc;
	}

	function setAsHomeDashboard() {
		if(checkIfUserLogged() == false)
			return;
		if(checkIfDashboardIsSaved() == false)
			return;
			
		document.getElementById("homeDashboard_ctrl").style.visibility = "hidden";
		document.getElementById("homeDashboard_text").innerHTML = "processing...";
		
		var url = getServletUrl();
		var parameters = "saveFile=" + window.location.href;
		parameters += "&homeDashboard=yes";
		
		postRequest_dashboard(url, parameters, onSetAsHomeDashboard);
	}
	
	function onSetAsHomeDashboard(isOk) {
	    var obj = document.getElementById("homeDashboard_text");
	    if(obj == null)
			return;
		if(isOk) {
			obj.innerHTML = "it is a home dashboard";
		}
		else {
			obj.innerHTML = "faild to set as a home dashboard";
			obj.style.color = "#FF0000";
		}
	}

	function renameDashboard() {
		if(checkIfUserLogged() == false)
			return;
		if(checkIfDashboardIsSaved() == false)
			return;
	
		var renInp = document.getElementById("renameDashboard_input");
		var newName = renInp.value;
		// check correct file name
		if(newName == null || newName.length == 0) {
			window.alert("Type a new name of the dashboard.");
			return;
		}
		if(checkDashboardName(newName) == false)
			return;
		
		renInp.style.visibility = "hidden";
		document.getElementById("renameDashboard_ctrl").style.visibility = "hidden";
		document.getElementById("renameDashboard_text").innerHTML = "processing...";
		
		url = getServletUrl();
		var parameters = "saveFile=" + window.location.href;
		parameters += "&newName=" + newName;
		
		postRequest_dashboard(url, parameters, onRenameDashboard);
	}

	function onRenameDashboard(isOk) {
		var obj = document.getElementById("renameDashboard_text");
	    if(obj == null)
			return;
		if(isOk) {
			var newName = document.getElementById("renameDashboard_input").value;
			var oldLoc = window.location.href;
			var newloc = oldLoc.replace(getDashboardName(oldLoc), newName);
			// add Edit suffix, because this command in edit mode now.
			if(newloc.indexOf("Edit.html") == -1)
				newloc = newloc.replace(".html", "Edit.html");
				
			window.location = newloc;
		}
		else {
			obj.innerHTML = "faild to rename the dashboard";
			obj.style.color = "#FF0000";
		}
	}
	
	function deleteDashboard() {
		if(checkIfUserLogged() == false)
			return;
		if(checkIfDashboardIsSaved() == false)
			return;

		isConfirmed = window.confirm("To delete this dashboard?");
		if(!isConfirmed)
			return;
		
		document.getElementById("deleteDashboard_ctrl").style.visibility = "hidden";
		document.getElementById("deleteDashboard_text").innerHTML = "processing...";
		
		url = getServletUrl();
		var parameters = "saveFile=" + window.location.href;
		parameters += "&delete=yes";
		
		postRequest_dashboard(url, parameters, onDeleteDashboard);
	}
	
	function onDeleteDashboard(isOk, respText) {
		var obj = document.getElementById("deleteDashboard_text");
	    if(obj == null)
			return;
		if(isOk) {
			//window.alert("The dashboard is deleted.\nHome dashboard will be loaded.");
			obj.innerHTML = "Deleted. Home dashboard loading...";
			window.location = respText;
			 
		}
		else {
			obj.innerHTML = "faild to delete the  dashboard";
			obj.style.color = "#FF0000";
		}
	}

	function parseURL(url) {
		var retArr = new Array();
		var loc;
		if(typeof url != 'undefined')
			loc = url;
		else
			loc = window.location.href;
		
		var tmp1 = loc.split("?");
		retArr['path'] = tmp1[0];
		
		// required parameters
		if(typeof tmp1[1] != 'undefined') {
			var tmp2 = tmp1[1].split("&");
			for(var i = 0; i < tmp2.length; i++) {
				var tmp3 = tmp2[i].split("=");
				retArr[tmp3[0]] = tmp3[1];
			}
		}
		return retArr;
	}

	function getServletUrl() {
		var DASHBOARD_MAP = "dashBoard"; // for the servlet calling.
		var url = window.location.protocol + "//" + window.location.host;
		// give up folder and dashboard filename
		var tmp1 = window.location.pathname.split("/");
		for(var i = 0; i < tmp1.length - 2; i++)
			url += tmp1[i] + "/";
		url += DASHBOARD_MAP;
		
		return url;
	}

/*****************************************************************
* check functions
******************************************************************/
    function checkIfUserLogged() {
		if(document.getElementById('loggedContact').href == null) {
		    window.alert('You have to log in before making this operation.');
			return false;
		}
		return true;
    }

    function checkDashboardName(name) {
		var forbidden = [":", ";", "/", "&", "?"];
		for(var i = 0; i < forbidden.length; i++) {
			if(name.indexOf(forbidden[i]) != -1) {
				window.alert('Sorry, the dasboard name may not contain:\n":", ";", "/", "&", "?"');
				return false;
			}
		}
		return true;
    }

	function checkIfDashboardNameIsNew(name) {
		for(i = 0; i < g_dbNames.length; i++) {
			if(name == g_dbNames[i]) {
				window.alert("The dashboard with this name is already exist.");
				return false;
			}
		}
		return true;
	}
	
	function checkIfDashboardIsSaved() {
		if(window.location.href.indexOf("blankEdit.html") != -1) {
			window.alert("You have to add, at least, one board\nbefore performance of this command.");
			return false;			
		}
		return true;		
	}
	
/************************************************
* ajax
* returns true in 1st param of the -callback- function
* format of callback(isOk, responseText, responseXML);	
*************************************************/
function postRequest_dashboard(url, parameters, callback) {
	var http_request;

	// create XMLHttpRequest object
	this.createXMLHttpObj = function() {	
		if (typeof XMLHttpRequest != 'undefined' && window.XMLHttpRequest) { // Mozilla, Safari,...
			try {
			http_request = new XMLHttpRequest();
			if (http_request.overrideMimeType) {
				http_request.overrideMimeType('text/xml');
			}
			} catch(e) {}
		}

		if (!http_request && window.ActiveXObject) { // IE
			http_request = this.newActiveXObject();
		}

		if (!http_request && window.createRequest) { // IceBrowser
			try {
			http_request = window.createRequest();
			} catch (e) {}
		}

		if (!http_request) {
			window.alert('Cannot create XMLHTTP instance, using iframe instead');
			frameLoaded[frameId] = false;
			var iframe = frames[frameId];
			iframe.document.body.innerHTML = '<form method=post action=dummy id=ajaxForm><input type=submit name=n value=v></input> </form>';
			var ajaxForm = iframe.document.getElementById('ajaxForm');
			ajaxForm.action = url;
			ajaxForm.submit();
			// line below is an alternative simpler method to submitting a form - but fails in IE if URL is too long
			// iframe.location.replace(url); // load data from server into iframe
			return;
		}
	}

	// newActiveXObject - auxiliary func.
	this.newActiveXObject = function() {
		var xmlHttpArr = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
		var returnValue = null;
		//  IE5 for the mac claims to support window.ActiveXObject, but throws an error when it's used
		if (navigator.userAgent.indexOf('Mac') >= 0 && navigator.userAgent.indexOf("MSIE") >= 0) {
		window.alert('we are sorry, you browser does not support AJAX, please upgrade or switch to another browser');
		return null;
		}
		for (var i = 0; i < xmlHttpArr.length; i++) {
		try {
			returnValue = new ActiveXObject(xmlHttpArr[i]);
			break;
		}
		catch (ex) {
		}
		}
		return returnValue;
	};
	
	// send request
	this.sendRequest = function() {
		http_request.onreadystatechange = this._onreadystatechange;
		http_request.open('POST', url, true);

		// browser does not allow Referer to be sent - so we send X-Referer and on server make it transparent to apps
		//http_request.setRequestHeader("Referer",      document.location.href);
		http_request.setRequestHeader("X-Referer",     document.location.href);
		http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		// below 2 line commented - made IE wait with ~1 minute timeout
		if (parameters) {
			http_request.setRequestHeader("Content-length", parameters.length);
		}

		http_request.send(parameters);
	}

	// onreadystatechange 
	this._onreadystatechange = function() {
		if (http_request.readyState != 4)
			return;
		
		var status;
		var responseText = null;
		var responseXML = null;
		try {
			status = http_request.status;
			responseText = http_request.responseText;
			responseXML = http_request.responseXML;
			if (responseXML && responseXML.baseURI)
				url = responseXML.baseURI;
		}
		catch (e) { // hack since mozilla sometimes throws NS_ERROR_NOT_AVAILABLE here
			// deduce status
			var location = http_request.getResponseHeader('Location');
			if (location)
				status = 302;
			else if (http_request.responseText.length > 10)
				status = 200;
			else
				status = 400;
		}
		
		// finish. call a callback function.
		callback((status == 200), http_request.responseText, http_request.responseXML);
	};

	// "constructor" body ---------------
	this.createXMLHttpObj();
	this.sendRequest();
}
