<div>
<include name="dashboards/dblist.jsp" />
<script src="dashboards/dashboard.js" language="JavaScript" type="text/javascript"></script>
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

  <hr color="#75BDFF" />	
  <div id="db_list_div" style="visibility:hidden; margin-left:15px;">
	<span style="color:#75BDFF;">go to a dashboard:</span>
	<select id="db_list" class="input" style="width:200px">
		<option>select dashboard --</option>
	</select>
  </div>

  <table cellpadding="15" border="0">
    <tr>
      <td>
          <font color="#75BDFF">edit the dashboard</font> <a href="javascript:editDashboard();" style="align:right"><img src="images/EditMode.gif" border="0" /></a>
      </td>
      <td>
      	<div id="startDashboard">
      	  <input type="button" id="startDashboard_button" class="button1" value="set as a start dashboard" onclick= "javascript: setAsStartDashboard();"/>
      	</div>
      </td>
      <td>
      	<span style="color:#75BDFF;">a new dashboard:</span>
        <input type="text" id="fileName" class="input" value="" size="35" />
        <input type="button" id="create" class="button1" value="create" onclick="createNewDashboard();" />
      </td>
    </tr>
  </table>
  
</div>
