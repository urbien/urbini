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
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=http%3a%2f%2f127.0.0.1%2fhudsonfog%2fsql%2fwww.hudsonfog.com%2fvoc%2fmodel%2fcompany%2fContact%3fname%3dHudsonFog%26role%3dadmin%26lastName%3dKovnatsky%26firstName%3dEugene">
            Contact Kovnatsky Eugene 
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dcontact%26lastName%3DGrobman%26firstName%3DJacob&amp;type=http://www.hudsonfog.com/voc/model/company/Contact&amp;-$origAction=searchLocal&amp;%24order=http://www.hudsonfog.com/voc/software/crm/Bug/opened&amp;asc=-1&amp;-servletLocation=&amp;origFile=/localSearchResults.html&amp;-$origType=http://www.hudsonfog.com/voc/software/crm/Bug&amp;-$pUri=assignedTo">
            Contact Grobman Jacob
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dadmin%26lastName%3DKatsnelson%26firstName%3DEllen&amp;type=http://www.hudsonfog.com/voc/model/company/Contact">
            Contact Katsnelson Ellen
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
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=http%3a%2f%2f127.0.0.1%2fhudsonfog%2fsql%2fwww.hudsonfog.com%2fvoc%2fmodel%2fcompany%2fContact%3fname%3dHudsonFog%26role%3dadmin%26lastName%3dKovnatsky%26firstName%3dEugene">
            Contact Kovnatsky Eugene 
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dcontact%26lastName%3DGrobman%26firstName%3DJacob&amp;type=http://www.hudsonfog.com/voc/model/company/Contact&amp;-$origAction=searchLocal&amp;%24order=http://www.hudsonfog.com/voc/software/crm/Bug/opened&amp;asc=-1&amp;-servletLocation=&amp;origFile=/localSearchResults.html&amp;-$origType=http://www.hudsonfog.com/voc/software/crm/Bug&amp;-$pUri=assignedTo">
            Contact Grobman Jacob
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dadmin%26lastName%3DKatsnelson%26firstName%3DEllen&amp;type=http://www.hudsonfog.com/voc/model/company/Contact">
            Contact Katsnelson Ellen
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
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=http%3a%2f%2f127.0.0.1%2fhudsonfog%2fsql%2fwww.hudsonfog.com%2fvoc%2fmodel%2fcompany%2fContact%3fname%3dHudsonFog%26role%3dadmin%26lastName%3dKovnatsky%26firstName%3dEugene">
            Contact Kovnatsky Eugene 
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dcontact%26lastName%3DGrobman%26firstName%3DJacob&amp;type=http://www.hudsonfog.com/voc/model/company/Contact&amp;-$origAction=searchLocal&amp;%24order=http://www.hudsonfog.com/voc/software/crm/Bug/opened&amp;asc=-1&amp;-servletLocation=&amp;origFile=/localSearchResults.html&amp;-$origType=http://www.hudsonfog.com/voc/software/crm/Bug&amp;-$pUri=assignedTo">
            Contact Grobman Jacob
          </option>
          <option value="readOnlyProperties.html?-$action=showproperties&amp;uri=/hosts/hudsonfog/sql/www.hudsonfog.com/voc/model/company/Contact%3Fname%3DHudsonFog%26role%3Dadmin%26lastName%3DKatsnelson%26firstName%3DEllen&amp;type=http://www.hudsonfog.com/voc/model/company/Contact">
            Contact Katsnelson Ellen
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