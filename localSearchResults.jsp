<html>
<script language="JavaScript">
  <include name="calendar/calendar1.html"/>
</script>

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
      <td valign="top" width="90%"><img src="icons/icon.gif"/><span class="xs"><language/><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span></td>
      <td valign="top" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>

    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <reloadDocuments/>
      <showSetProperties />
    </form>
  <br/><pieChart/>

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

<pda pda="T">
<br/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top"><img src="icons/icon.gif"/><span class="xs"><language/><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
    </form>
    </td></tr>
    </table>
</td></tr></table>
<br />

<div>
    <div id="tabDiv2">
      <a href="javascript:hidepoptext2();"><img alt="Click here to close" src="images/popout_menu.gif" width="14" border="0" /></a>
    </div>

    <div id="textdiv2">

<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0">
      <tr><td align="middle" class="title">
        <input type="submit" name="submit"  class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
        <input type="hidden" name="action" value="searchLocal"></input>
      </td></tr></table>   
    </form>
</td></tr></table>
</div>
</div>
<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
</pda>
<br/>


<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

