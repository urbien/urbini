<div>
<include name="dashboards/dblist.jsp" />
  <table style="height:100%; width:100%" border="0">
    <tr valign="top" align="center">
      <td>
        <div id="panel1" style="overflow: visible;"></div>
      </td>
      <td>
        <div id="panel2" style="overflow: visible;"></div>
      </td>
      <td>
        <div id="panel3" style="overflow: visible;"></div>
      </td>
    </tr>
  </table>

  <hr color="#6699CC" />
  
  <script src="dashboards/dashboard.js" language="JavaScript" type="text/javascript"></script>
  <table cellpadding="10" border="0">
    <tr>
      <td align="center">
          <span class="dashboardGrayedTitle">edit</span> <a href="javascript: editDashboard();" style="align:right"><img src="icons/dashboards/edit_button.gif" border="0" /></a>
      </td>
      <td>
    	  <span id="homeDashboard_text" class="dashboardGrayedTitle">set as home dashboard</span> <a id="homeDashboard_ctrl" href="javascript: setAsHomeDashboard();" style="align:right"><img src="icons/dashboards/home_button.gif" border="0" /></a>
      </td>
	  <td>
        <span id="renameDashboard_text" class="dashboardGrayedTitle">rename as:</span>
        <input id="renameDashboard_input" type="text" class="input" value="" size="30" />
        <a id="renameDashboard_ctrl" href="javascript: renameDashboard();" style="align:right"><img src="icons/dashboards/rename_button.gif" border="0" /></a>
      </td>
      <td>
       	  <span id="deleteDashboard_text" class="dashboardGrayedTitle">delete</span> <a id="deleteDashboard_ctrl" href="javascript: deleteDashboard();" style="align:right"><img src="icons/dashboards/delete_button.gif" border="0" /></a>
      </td>
    </tr>
    <tr>
      <td colspan="2">
		  <span class="dashboardGrayedTitle">go to:</span>
			<select id="db_list" class="input" style="width:215px">
			  <option>select dashboard --</option>
			</select>
      </td>
      
      <td>
        <span class="dashboardGrayedTitle">create new:</span>
        <input type="text" id="createDashboard" class="input" value="" size="30" />
        <a href="javascript: createDashboard(false);" style="align:right"><img src="icons/dashboards/create_button.gif" border="0" /></a>
      </td>
      <td>
      </td>
    </tr>
    
  </table>
  
</div>
