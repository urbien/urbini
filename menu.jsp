<menuBar id="menuBar1">
<table width="100%" cellspacing="0" cellpadding="0" border="0" id="mainMenu">
  <tr class="dashboardLine">
    <td>
      <table width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr valign="top">
        <td width="85%" colspan="2">
	        <table>
	          <tr valign="top">
	            <td width="1%" class="dashboard_btn"><a href="javascript: ;" onclick="addOnClickToProfiling(event); PlainDlg.showPreloaded(event, 'viewSource', this);"><img src="icons/homePage-large.png" class="litxt" /><br/>Home</a></td><td><dashboardMenus/></td>
<!--
							<td class="dashboard_btn"><menu toolbar="calendarAndChart" /></td>
-->
	          </tr>
	        </table>
        </td>
        <td align="right" class="toprightpad">
	        <shoppingCart/>
	       </td>
	      </tr>
      </table>
    </td>
     <td align="right" class="toprightpad" id="user">
       <!--a href="help.html"> <img src="icons/help.png" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a-->
       <changePassword/><userLogOff html="user-login.html"/><registerNewUser/><!--myProfile property="unread" /-->
    </td>
  </tr>
  <tr class="menuLine">
    <td valign="middle" class="menuLine" colspan="2">
      <resourceTypeLabel/>
    </td>
  </tr>
  <!--tr>
    <td colspan="2" align="center" class="alphabeticIndex">
      <alphabeticIndex/>
    </td>
  </tr-->
</table>
</menuBar>
