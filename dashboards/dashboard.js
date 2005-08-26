    function selectItemToAddToDashboard(panel){
      if(document.getElementById('itemToAdd').value == "") {
        alert("nothing to add. Please, select the panel you'd like to add.");
        return;
      }
      /*
      if(document.getElementById(panel+'URIs').value.indexOf(document.getElementById('itemToAdd').value+";")>=0) {
        alert("nothing to add. The panel is already present in this column.");
        return;
      }
      */
      document.getElementById("dashBoard").target = '';
      setPanelsClearURIsLists();
      document.getElementById('location').value = window.location; 
      document.getElementById('panelToUpdate').value = panel; 
      document.getElementById(panel + 'URIs').value += document.getElementById('itemToAdd').value + ";"; 
      dashBoardForm.submit();
    }
 
    function setItemToAdd(value) {
      document.getElementById('itemToAdd').value = value;
    }
    
    function setPanelsURIsLists() {
      document.getElementById('panel1URIs').value = replaceAllRecursion(getURIsListForPanel('panel1'), "amp;amp;", "&");
      document.getElementById('panel2URIs').value = replaceAllRecursion(getURIsListForPanel('panel2'), "amp;amp;", "&");
      document.getElementById('panel3URIs').value = replaceAllRecursion(getURIsListForPanel('panel3'), "amp;amp;", "&");
    }
    
    function setPanelsClearURIsLists() {
      document.getElementById('panel1URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel1'), "amp;amp;", "&");
      document.getElementById('panel2URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel2'), "amp;amp;", "&");
      document.getElementById('panel3URIs').value = replaceAllRecursion(getClearURIsListForPanel('panel3'), "amp;amp;", "&");
    }
    
    function getURIsListForPanel(panelName) {
      var s = "";
      if(panelName == "panel1") {
        for(i=0;i<aElts[0].length;i++)
          //s += aElts[0][i].name.substring(11,aElts[0][i].name.length) + ";";
          //s += aElts[0][i].name.substring(aElts[0][i].name.indexOf("|_")+2,aElts[0][i].name.length) + ";";
          s += aElts[0][i].name + ";";
        return s;
      }
      if(panelName == "panel2") {
        for(i=0;i<aElts[1].length;i++)
          s += aElts[1][i].name + ";";
        return s;
      }
      if(panelName == "panel3") {
        for(i=0;i<aElts[2].length;i++)
          //s += aElts[2][i].name.substring(aElts[2][i].name.indexOf("|_")+2,aElts[2][i].name.length) + ";";
          s += aElts[2][i].name + ";";
        return s;
      }
    }
    
    function getClearURIsListForPanel(panelName) {
      var s = "";
      if(panelName == "panel1") {
        for(i=0;i<aElts[0].length;i++)
          s += aElts[0][i].name.substring(aElts[0][i].name.indexOf("|_")+2,aElts[0][i].name.length) + ";";
        return s;
      }
      if(panelName == "panel2") {
        for(i=0;i<aElts[1].length;i++)
          s += aElts[1][i].name.substring(aElts[1][i].name.indexOf("|_")+2,aElts[1][i].name.length) + ";";
        return s;
      }
      if(panelName == "panel3") {
        for(i=0;i<aElts[2].length;i++)
          s += aElts[2][i].name.substring(aElts[2][i].name.indexOf("|_")+2,aElts[2][i].name.length) + ";";
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