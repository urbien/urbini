<div>
<div nonPda="T">

<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr  class="keywordsearch" valign="top">
    <td valign="top" width="80%"  class="keywordsearch">

   <table width="100%" cellspacing="0" cellpadding="1" border="0"><tr><td width="70%">
    <menu toolbar="toolbar1"  activate="onMouseOver"/>
    <menu toolbar="transport" activate="onMouseOver"/>
    <menu toolbar="search"    activate="onMouseOver"/>
    <menu toolbar="toolbar2"  activate="onMouseOver"/>
    <menu toolbar="toolbar3"  activate="onMouseOver"/>
    <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/>
    <print image="images/printerIcon.gif"/>
    <saveInExcel allow="owner" image="images/excel.gif"/>
    <pdaToPc image="images/pda.gif"/>
    <showHideWindows/>
    </td>
    <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
     <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
      <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
    </form>
    </tr></table></td>
  </tr>
</table>
<br/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td valign="top" width="110%">  
    <!--form action="list.html" name="siteResourceList"-->
      <div align="left"><backLink /></div>
      <tree/>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <br/>
      <readOtherSiteInfo />
      <addNewResource html="mkResource.html" /> 
      <edit html="list.html"/>
      <!--showSetProperties /-->
    <!--/form-->
  </td>
    <td width="10%" valign="top" align="left" bgcolor="eeeeee">
      <menu toolbar="filterList" type="onpage" title="false"/>
  </td>
</tr></table>
  </td>
</tr></table>
</div>

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
        <menu toolbar="filterList"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="toolbar3"/>

      <span class="xs"><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <tree/>
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

