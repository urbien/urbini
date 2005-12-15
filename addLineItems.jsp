<div>
<div nonPda="T">
<font color="red"><b><errorMessage /></b></font>
<hideBlock id="hideBlock">
<watchNote/>
</hideBlock>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td width="110%" colspan="2"><!--br/-->
		<form name="categoryTextSearch">
		  <searchHistory/>
		  <categoryTextSearch />
		  <resourcesSearch resourcesUri="/sql/text/search/resources" />
		  <filesSearch filesUri="text/search/files" />
		</form>
    <taskTreeControl/>
    <table width="100%" cellspacing="10" cellpadding="0" border="0">
    <tr valign="top">
	    <td width="70%"><mkResourceForLineItems/></td>
	    <td width="30%"><div id="resourceList_div"><siteResourceList/></div></td>
    <tr>
    <tr itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem">
      <td width="70%">
        <table width="100%" cellspacing="5" cellpadding="0" border="0">
        <tr>
          <td align="center" class="categoryButton" onClick="document.location.href='plain/Recall_Orders.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/hospitality/spa/Booking&amp;status_select=Checked+In&amp;status_verified=y&amp;settled_select=false&amp;settled_verified=y&amp;$order=http://www.hudsonfog.com/voc/hospitality/spa/Booking/checkInTime&amp;-asc=-1&amp;-grid=1&amp;-inRow=2'">Recall orders</td>
        </tr>
        </table>
      </td>
      <td></td>
    </tr>
    <iframe id="resourceList" name="resourceList" style="display:none;" scrolling="no" frameborder="0" src="about:blank"> </iframe>
    </table>
    <div align="right"><measurement/></div>
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
    <menuBar>
    <tr valign="top">
      <td valign="top">
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterLocal"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="support" allow="admin"/>
        <menu toolbar="personalization"/>

        <menu toolbar="calendarAndChart"/>

        <print image="icons/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
        <showHideWindows/>
        <pdaToPc image="icons/pda.gif"/><changePassword/><userLogOff html="user-login.html"/>
      </td>

      <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
        <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
      </form>

    </tr>
    </menuBar>
    <tr valign="top"><td colspan="2">
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
<form name="horizontalFilter" id="filter" method="POST">
  <br/>
    <horizontalFilter />
</form>
</div>
<br/>

<script src="browserEventHandling.js" language="JavaScript" type="text/javascript"></script>

</div>
