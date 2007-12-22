<menuBar id="menuBar1">
<table width="100%" cellspacing="0" cellpadding="0" border="0" id="mainMenu" class="toppad">
  <tr align="center">
    <td>
    		<dashboardMenus/>
        <menu toolbar="calendarAndChart"    />
	      <!--chat                          /-->
        <include name="searchText.jsp"/>
    </td>
    <td align="right">
       <a href="http://lablz.com"><logo src="icons/logo.gif" srcLarge="icons/logo-large.gif" /></a>
       <img allow="admin" id="menuLink_codeBehindThePage" title="View Source&lt;br&gt; This page is based solely on the declarative code that you can inspect by clicking on the links in popup" class="cursor" src="icons/codeBehindThePage.gif" onclick="menuOnClick(event)" align="top"/>
    </td>
  </tr>
  <tr>
    <td valign="middle" class="menuLine">
      <resourceTypeLabel/>
    </td>
    <td align="right" class="menuLine">
       <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a>
       <changePassword/><userLogOff html="user-login.html"/><registerNewUser/><myProfile property="unread" />
    </td>
  </tr>
  <tr>
    <td colspan="2" align="middle">
      <alphabeticIndex/>
    </td>
  </tr>
</table>
</menuBar>
