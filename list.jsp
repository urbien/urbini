<div>
<div nonPda="T">

<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
  <td valign="top" width="100%" class="keywordsearch">
   <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="90%">
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
    <!--td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td-->
    <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
      <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
    </form>
    </tr></table></td>
  </tr>
</table>
<br/>
<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td width="110%" colspan="2">
    <div align="left"><backLink /></div>
    <font color="red"><b><errorMessage /></b></font>
    <taskTreeControl/>
    <siteResourceList />
    <div align="right"><measurement/></div>
    <br/>
    <readOtherSiteInfo />
    <addNewResource html="mkResource.html"/> 
    <edit html="localSearchResults.html"/><br/>
    <reloadDocuments/>
    <createResources/><br/>
    <setAsHomePage />
    <br/><pieChart/>
    <script language="JavaScript">
      var horizontalFilter_FIELDS = new Array();
	function disableSubmitButtonH(form) {
	  if (document.all || document.getElementById) {
            form.submit.disabled = true; 
            form.submit.value = 'Please wait';
            form.submit.style.cursor = 'wait'; 
            form.clear_.style.visibility = 'hidden'; 
          }
	}
    </script>
    <form name="horizontalFilter" id="filter" method="POST">
      <br/>
      <horizontalFilter />
    </form>
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
    <tr valign="top"> 
      <td valign="top">      
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterList"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="toolbar3"/>

        <span class="xs"><print image="images/printerIcon.gif"/>
        <saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="images/pda.gif"/>
        </span>
        <changePassword/><userLogOff html="user-login.html"/>
      </td>
      <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
        <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
      </form>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <taskTreeControl/>
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

