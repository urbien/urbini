<div>
<form action="dashBoardT" id="dashBoardT" method="get" name="dashBoardFormT">
  <script type="text/javascript" src="dashboards/wz_dragdrop.js"></script>
  <script src="dashboards/dashboard.js" language="JavaScript" type="text/javascript"></script>
  
  <input type="Hidden" name="location" id="location" value=""></input>
  <input type="Hidden" id="itemToAdd" value=""></input>
  
  <table style="height:100%; width:100%" border="0">
    <tr>
      <td>
        <div id="panel1">.  <div id='lyr_-2012318119|_localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug' style='position:absolute;left:100px;top:50px; width:300px;height:200px;border : 1px solid #D3D3D3; padding-right : 5px; padding-left : 5px;	padding-bottom : 5px;'>
    <img src="icons/dashboards/close.gif" onclick="removeBoard(this.parentNode.id, 'panel1');" style="cursor:pointer;overflow: auto;" width="11" height="11" />
    <div style='overflow: auto;background-color:#ffffff;border : 1px solid #D3D3D3;width:95%;height:180px'>
      <bookmark uri="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug" />    </div>
  </div>
</div>
      </td>
      <td>
        <div id="panel2">.  <div id='lyr_-1743051755|_localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug' style='position:absolute;left:100px;top:50px; width:300px;height:200px;border : 1px solid #D3D3D3; padding-right : 5px; padding-left : 5px;	padding-bottom : 5px;'>
    <img src="icons/dashboards/close.gif" onclick="removeBoard(this.parentNode.id, 'panel1');" style="cursor:pointer;overflow: auto;" width="11" height="11" />
    <div style='overflow: auto;background-color:#ffffff;border : 1px solid #D3D3D3;width:95%;height:180px'>
      <bookmark uri="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug" />    </div>
  </div>
</div>
      </td>
      <td>
        <div id="panel3">.  <div id='lyr_-67418747|_localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug' style='overflow: auto;position:absolute;left:100px;top:50px; width:300px;height:200px;border : 1px solid #D3D3D3; padding-right : 5px; padding-left : 5px;	padding-bottom : 5px;'>
    <img src="icons/dashboards/close.gif" onclick="removeBoard(this.parentNode.id, 'panel1');" style="cursor:pointer" width="11" height="11" />
    <div style='overflow: auto;background-color:#ffffff;border : 1px solid #D3D3D3;width:95%;height:180px'>
      <bookmark uri="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug" />    </div>
  </div>
</div>
      </td>
    </tr>
    <tr valign="bottom">
      <td id="addRemovePanel" align="center">
        Add Content to Left Column 
        <select onchange="setItemToAdd(this.value)">
          <option value="">
            Select content
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 1
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 2
          </option>
        </select>
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel1')"></img>
        <input type="Hidden" id="panel1URIs" name="panel1URIs" value=""></input>
      </td>
      <td align="center">
        Add Content to Middle Column 
        <select onchange="setItemToAdd(this.value)">
          <option value="">
            Select content
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 1
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 2
          </option>
        </select>
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel2')"></img>
        <input type="Hidden" id="panel2URIs" name="panel2URIs" value=""></input>
      </td>
      <td align="center">
        Add Content to Right Column 
        <select onchange="setItemToAdd(this.value)">
          <option value="">
            Select content
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 1
          </option>
          <option value="localSearchResults.html?-$action=explore&amp;type=http://www.hudsonfog.com/voc/software/crm/Bug">
            Heading 2
          </option>
        </select>
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel3')"></img>
        <input type="Hidden" id="panel3URIs" name="panel3URIs" value=""></input>
      </td>
    </tr>
  </table>

  <script type="text/javascript" src="dashboards/dB.js"></script>
 <script type="text/javascript" language="JavaScript">
    makeBoardsAlligned(); 
    makeAddRemovePanelAlligned();
    setPanelsURIsLists();
  </script>
 <input type="Hidden" value="false" id="isClosePanel" name="isClosePanel"></input>

 <iframe id="dashboardIframe" name="dashboardIframe" style="display:none" width="400" height="300" frameborder="1"></iframe>
</form>

<form action="dashBoard" id="dashBoard" method="get" name="dashBoardForm">
  <input type="Hidden" name="location" value=""></input>
  <input type="Hidden" name="panel1URIs" value=""></input>
  <input type="Hidden" name="panel2URIs" value=""></input>
  <input type="Hidden" name="panel3URIs" value=""></input>
  <input type="Hidden" name="isClosePanel" value="false"></input>
</form>
</div>