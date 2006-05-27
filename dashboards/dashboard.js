    var numberOfcolumns = 3;
    
    addEvent(window, 'resize', function() {makeBoardsAlligned();}, false);
    
    function selectItemToAddToDashboard(panel){
      // alert must be done if nothing was selected to add
      if(document.getElementById('itemToAdd').value == "") {
        alert("nothing to add. Please, select the panel you'd like to add.");
        return;
      }
      // since new board is added then target must be ampty
      document.getElementById("dashBoard").target = '';

      // panel1URIs, panel2URIs, panel3URIs contain the list of id's of the divs according to the panel (column of boards).
      // This ids contain the URI of the board that is displayed together with the random int number gererated on the server side.
      // setPanelsClearURIsLists() cleans this lists and leave just URI's of the boards that must be displayed
      setPanelsClearURIsLists();

      document.getElementById('location').value = window.location;

      // corresponding panel(i)URIs value must be appended by the URI that must be added to this column.
      document.getElementById(panel + 'URIs').value = document.getElementById('itemToAdd').value + ";" + document.getElementById(panel + 'URIs').value; 

      //alert(document.dashBoard.panel1URIs.value);
      // submit dashboard form
/*
      document.dashBoard.panel1URIs.value = document.getElementById('panel1URIs').value;
      document.dashBoard.panel2URIs.value = document.getElementById('panel2URIs').value;
      document.dashBoard.panel3URIs.value = document.getElementById('panel3URIs').value;
      document.dashBoard.location.value = document.getElementById('location').value;
      document.dashBoard.isClosePanel.value = document.getElementById('isClosePanel').value;
*/
      document.getElementById('dashBoardPanel1URIs').value = document.getElementById('panel1URIs').value;
      document.getElementById('dashBoardPanel2URIs').value = document.getElementById('panel2URIs').value;
      document.getElementById('dashBoardPanel3URIs').value = document.getElementById('panel3URIs').value;
      document.getElementById('dashBoardLocation').value = document.getElementById('location').value;
      document.getElementById('dashBoardIsClosePanel').value = document.getElementById('isClosePanel').value;

      //dashBoardForm.submit();
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
      document.getElementById('location').value = window.location; 
      document.getElementById('isClosePanel').value = 'true';
      
      document.getElementById('dashBoardPanel1URIs').value = document.getElementById('panel1URIs').value;
      document.getElementById('dashBoardPanel2URIs').value = document.getElementById('panel2URIs').value;
      document.getElementById('dashBoardPanel3URIs').value = document.getElementById('panel3URIs').value;
      document.getElementById('dashBoardLocation').value = document.getElementById('location').value;
      document.getElementById('dashBoardIsClosePanel').value = document.getElementById('isClosePanel').value;
      //dashBoardForm.submit();
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
        
    