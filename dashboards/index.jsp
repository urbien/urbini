<div>
<form action="dashBoardT" id="dashBoardT" method="get" name="dashBoardFormT">
  <script type="text/javascript" src="dashboards/wz_dragdrop.js"></script>
  <script src="dashboards/dashboard.js" language="JavaScript" type="text/javascript"></script>
  
  <input type="Hidden" name="location" id="location" value="" />
  <input type="Hidden" id="itemToAdd" value="" />
  
  <table style="height:100%; width:100%" border="0">
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
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel1')" />
        <input type="Hidden" id="panel1URIs" name="panel1URIs" value="" />
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
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel2')" />
        <input type="Hidden" id="panel2URIs" name="panel2URIs" value="" />
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
        <img src="icons/add-medium.gif" onclick="selectItemToAddToDashboard('panel3')" />
        <input type="Hidden" id="panel3URIs" name="panel3URIs" value="" />
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
</div>