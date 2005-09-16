<div>
<form action="dashBoardT" id="dashBoardT" method="get" name="dashBoardFormT">
  <script type="text/javascript" src="dashboards/wz_dragdrop.js"></script>
  <script src="dashboards/dashboard.js" language="JavaScript" type="text/javascript"></script>
  
  <input type="Hidden" name="location" id="location" value="" />
  <input type="Hidden" id="itemToAdd" value="" />

  <table style="height:100%; width:100%" border="0" id="dashboardsTable">
    <tr>
      <td>
        <div id="panel1">.</div>
      </td>
      <td>
        <div id="panel2">.</div>
      </td>
      <td>
        <div id="panel3">.</div>
      </td>
    </tr>
    <tr valign="bottom">
      <td id="addRemovePanel" align="center">
        Add Content to Left Column 
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel1')" style="cursor:pointer" />
        <input type="Hidden" id="panel1URIs" name="panel1URIs" value="" />
        <br/>
        <BookmarksList/>
      </td>
      <td align="center">
        Add Content to Middle Column 
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel2')" style="cursor:pointer" />
        <input type="Hidden" id="panel2URIs" name="panel2URIs" value="" />
        <br />
        <BookmarksList/>
      </td>
      <td align="center">
        Add Content to Right Column 
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel3')" style="cursor:pointer" />
        <input type="Hidden" id="panel3URIs" name="panel3URIs" value="" />
        <br/>
        <BookmarksList/>
      </td>
    </tr>
  </table>
  
  <script type="text/javascript" src="dashboards/dB.js"></script>
  <script type="text/javascript" language="JavaScript">
    makeBoardsAlligned(); 
    makeAddRemovePanelAlligned();
    setPanelsURIsLists();
  </script>
 <input type="Hidden" value="false" id="isClosePanel" name="isClosePanel" />

 <iframe id="dashboardIframe" name="dashboardIframe" style="display:none"></iframe>
</form>

<form action="dashBoard" id="dashBoard" method="get" name="dashBoardForm">
  <input type="Hidden" name="location" id="dashBoardLocation" value="" />
  <input type="Hidden" name="panel1URIs" id="dashBoardPanel1URIs" value="" />
  <input type="Hidden" name="panel2URIs" id="dashBoardPanel2URIs" value="" />
  <input type="Hidden" name="panel3URIs" id="dashBoardPanel3URIs" value="" />
  <input type="Hidden" name="isClosePanel" id="dashBoardIsClosePanel" value="false" />
</form>

  <div align="right" style="width:100%">
    <font color="#75BDFF">View readonly</font> <a href="javascript:window.location = (window.location+'').replace('Edit.html','.html');" style="align:right"><img src="images/readOnlyMode.gif" border="0" title="View readonly"/></a>
  </div>
</div>