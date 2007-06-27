<div>
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
    <tr valign="top"><td width="100%">
    <form action="proppatch" name="siteResourceList" method="POST">
      <siteResourceList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="-$action" value="createResources" />
      <input type="hidden" name="-create"  value="1"/>
      <center><input type="submit" name="submit"/></center>
    </form>
    </td>
    <td width="10%" id="rightPanelPropertySheet" valign="top" align="left">
      <br/>
      <menuBar id="menuBar1">
      <!--menu toolbar="filterLocalCreateList" type="onpage" title="false"/-->
      <include name="commonFilterParallelCreateList.jsp" />
      </menuBar>
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
    <menuBar id="menuBar1">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
      <img src="icons/icon_divider.gif" align="middle" border="0"></img>

      <!-- Auto-generated menus -->
      <menu toolbar="toolbar1"/>
      <menu toolbar="transport"/>
      <menu toolbar="search"/>
      <menu toolbar="filterLocalCreateList"/>
      <menu toolbar="toolbar2"/>
      <menu toolbar="support"         allow="admin"/>
      <menu toolbar="personalization"/>


      <print image="icons/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
      <pdaToPc image="icons/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="editList.html" name="siteResourceList" method="POST">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <input type="hidden" name="-$action" value="createResources" />
      <div align="right"><measurement/></div>
      <input type="submit" name="submit"/>
      <input type="hidden" name="create" value="1"/>
    </form>
    </td></tr>
    </table>
    </menuBar>
</td></tr></table>
<br />

<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
</div>
<br/>

</div>

