<html>

<siteTitle />

<div nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <colgroup>
        <col width="90%" /> 
        <col width="10%" />
      </colgroup>
      <tr valign="top">
        <td valign="top" width="90%">
          <span class="xs">
          <menu toolbar="toolbar1"/>
          <img src="icons/icon_divider.gif" align="middle" border="0"></img>
          <menu toolbar="transport"/>
          <img src="icons/icon_divider.gif" align="middle" border="0"></img>
          <menu toolbar="search"/>
          <menu toolbar="toolbar3"/>
          <img src="icons/icon_divider.gif" align="middle" border="0"></img>
          <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span></td>
        <td valign="bottom" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
      </tr>

      <tr valign="top">
      <td>
        <form action="list.html" name="siteResourceList">
          <div align="left"><backLink /></div>
          <siteResourceList />
          <div align="right"><measurement/></div>
          <addNewResource html="mkResource.html"/> 
          <reloadDocuments/>
          <createResources/>
          <showSetProperties />
        </form>
        <br/><pieChart/>
        <form name="horizontalFilter" method="POST" action="FormRedirect">
          <br/>
          <horizontalFilter />
        </form>
      </td>
      <td valign="top" align="left" bgcolor="eeeeee">
        <menu toolbar="filterLocal" type="onpage" title="false"/>
      </td>
      </tr>
    </table>
  </td>
</tr>
</table>
<br />
</div>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
        <menu toolbar="transport"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
        <menu toolbar="toolbar3"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>
      
      <span class="xs"></span><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
      <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <createResources/>
      <div align="right"><measurement/></div>
    </form>
    </td></tr>
    </table>
</td></tr></table>
<br />

<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
<form name="horizontalFilter" method="POST" action="FormRedirect">
  <br/>
    <horizontalFilter />
</form>
</div>
<br/>


<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

