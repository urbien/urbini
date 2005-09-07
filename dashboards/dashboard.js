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
      document.dashBoard.panel1URIs.value = document.getElementById('panel1URIs').value;
      document.dashBoard.panel2URIs.value = document.getElementById('panel2URIs').value;
      document.dashBoard.panel3URIs.value = document.getElementById('panel3URIs').value;
      document.dashBoard.location.value = document.getElementById('location').value;
      document.dashBoard.isClosePanel.value = document.getElementById('isClosePanel').value;
      dashBoardForm.submit();
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
        for(j=0;j<aElts[i].length;j++) 
          if(findPosY(aElts[i][j]) > maxHeight)
            maxHeight = findPosY(aElts[i][j]);
      document.getElementById('addRemovePanel').style.height = maxHeight + 250;
    }
    
    // function that removes board from the page
    function removeBoard(boardId, panelName) {
      remove(aElts,document.getElementById(boardId),10); // remove from the array of boards on the page
      document.getElementById(boardId).parentNode.removeChild(document.getElementById(boardId)); // remove board as html document object
      document.getElementById(panelName+'URIs').value = document.getElementById(panelName+'URIs').value.replace(boardId+';',''); // remove board from the list of boards in the column (in the panel)
      makeBoardsAlligned();

      document.getElementById("dashBoard").target='dashboardIframe';
      setPanelsClearURIsLists();
      document.getElementById('location').value = window.location; 
      document.getElementById('isClosePanel').value = 'true';
      
      document.dashBoard.panel1URIs.value = document.getElementById('panel1URIs').value;
      document.dashBoard.panel2URIs.value = document.getElementById('panel2URIs').value;
      document.dashBoard.panel3URIs.value = document.getElementById('panel3URIs').value;
      document.dashBoard.location.value = document.getElementById('location').value;
      document.dashBoard.isClosePanel.value = document.getElementById('isClosePanel').value;
      dashBoardForm.submit();
      
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