<div>

<div nonPda="T">

<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
    <td valign="top" width="100%" class="keywordsearch">
<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr><td width="80%">
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
</tr></table>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr valign="top">
      <td width="110%" colspan="2">
        <div align="left"><backLink /></div>
        <taskTreeControl/>
        <siteResourceList />
        <div align="right"><measurement/></div>
        <br/>
        <addNewResource html="mkResource.html"/> 
        <delete/> 
        <edit html="localSearchResults.html"/>
        <reloadDocuments/>
        <createResources/><br/>
        <setAsHomePage />
        <!--showSetProperties /-->
        <br/><pieChart/>
        <script language="JavaScript">
          var horizontalFilter_FIELDS = new Array();
        </script>
        <form name="horizontalFilter" method="POST" action="FormRedirect"><!-- onsubmit="clearUnModifiedFields(horizontalFilter_FIELDS)"-->
          <br/>
          <horizontalFilter />
        </form>
      </td>
      <td width="5%" id="rightPanelPropertySheet" valign="top" align="left">
        <br/>
        <menu toolbar="filterLocal" type="onpage" title="false"/>
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
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="toolbar3"/>
        <menu toolbar="calendarAndChart"/>
      
        <print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/>
        <showHideWindows/>
      </td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <taskTreeControl/>
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
<script language="JavaScript">
  var horizontalFilter_FIELDS = new Array();
</script>
<form name="horizontalFilter" method="POST" action="FormRedirect"><!-- onsubmit="clearUnModifiedFields(horizontalFilter_FIELDS)"-->
  <br/>
    <horizontalFilter />
</form>
</div>
<br/>


<!--div align="left"><span class="xs"><hudsonFog /></span></div-->      <!-- link to Portal page for current category -->

</div>
