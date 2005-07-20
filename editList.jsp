<div>
<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs">
        <menu toolbar="toolbar1"        activate="onMouseOver"/>
        <menu toolbar="transport"       activate="onMouseOver"/>
        <menu toolbar="search"          activate="onMouseOver"/>
        <menu toolbar="toolbar2"        activate="onMouseOver"/>
        <menu toolbar="support"         activate="onMouseOver" allow="admin"/>
        <menu toolbar="personalization" activate="onMouseOver"/>

        <print image="icons/printerIcon.gif"/>
        <saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="icons/pda.gif"/></span>
      </td>
      <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr><td valign="top" colspan="2">  
    <form action="editList.html?update=1" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <br/>
      <readOtherSiteInfo />
      <addNewResource html="mkResource.html" /> 
      <continueUpdateCheckout />
      <!--showSetProperties /-->
      <input type="hidden" name="-$action" value="updateResources"/>
    </form>
  </td>
    <!--td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST">
      <table border="1" cellpadding="3" cellspacing="0">
      <tr><td align="middle" class="title">
        <input type="submit" name="submit"  class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
        <input type="hidden" name="-$action" value="list"></input>
      </td></tr></table>   
    </form>
  </td-->
</tr></table>
  </td>
</tr></table>
</pda>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"> <td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="support"         allow="admin"/>
        <menu toolbar="personalization"/>


      <span class="xs"><print image="icons/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="icons/pda.gif"/></span><changePassword/><userLogOff html="user-login.html"/></td>
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
</div>

<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</div>

