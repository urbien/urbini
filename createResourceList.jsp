<html>
<siteTitle />

<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs">
        <menu toolbar="toolbar3" exclude="Support" activate="onMouseOver"/>
        <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span></td>
      <td valign="top" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>

    <tr valign="top"><td>
    <form action="editList.html" name="siteResourceList" method="POST">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="action" value="createResources" />
      <input type="hidden" name="create"  value="1"/>
      <input type="submit" name="submit"/>
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit"  class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      <input type="hidden" name="action" value="searchLocal"></input>
      <input type="hidden" name="action1" value="createResources"/>
      <input type="hidden" name="create"  value="1"/>
      </td></tr></table>   
    </form>
  </td>
</tr>

</table>
</td></tr>
</table>
</td></tr>
</table>
<br />
</pda>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
      <img src="icons/icon_divider.gif" align="middle" border="0"></img>

      <!-- Auto-generated menus -->
      <menu toolbar="toolbar1"/>
      <menu toolbar="transport"/>
      <menu toolbar="search"/>
      <menu toolbar="filterLocal"/>
      <menu toolbar="toolbar3"/>
      
      <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
      <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="editList.html" name="siteResourceList" method="POST">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <input type="hidden" name="action" value="createResources" />
      <div align="right"><measurement/></div>
      <input type="submit" name="submit"/>
      <input type="hidden" name="create" value="1"/>
    </form>
    </td></tr>
    </table>
</td></tr></table>
<br />

<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
</div>
<br/>


<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

