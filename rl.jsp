<div>
<div nonPda="T">
<table id="resourceList" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td><pagingResources /></td>
</tr>
<tr  valign="top">
  <td valign="top" align="middle" width="110%">
    <tr valign="top"><td>
			<form name="categoryTextSearch">
			  <searchHistory/>
			  <categoryTextSearch />
			  <resourcesSearch resourcesUri="/sql/text/search/resources" />
			  <filesSearch filesUri="text/search/files" />
			</form>
      <taskTreeControl/>
      <parallelResourceList />
      <div align="right"><measurement/></div>
    </td>
<hideBlock>    
    <td valign="top" align="left" bgcolor="eeeeee">
      <include name="commonFilterParallel.jsp" />
      <!--menu toolbar="filterParallel" type="onpage" title="false"/-->
    </td>
</hideBlock>    
</tr></table>
</div>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top">
        <img src="icons/icon.gif" width="16" height="16" align="middle"/>
        <img src="icons/icon_divider.gif" align="middle" border="0"></img>

        <!-- Auto-generated menus -->
        <menu toolbar="toolbar1"/>
        <menu toolbar="transport"/>
        <menu toolbar="search"/>
        <menu toolbar="filterParallel"/>
        <menu toolbar="toolbar2"/>
        <menu toolbar="support"         allow="admin"/>
        <menu toolbar="personalization"/>

        <print image="icons/printerIcon.gif"/>
        <saveInExcel allow="owner" image="images/excel.gif"/>
        <pdaToPc image="icons/pda.gif"/>
        <changePassword/>
        <userLogOff html="user-login.html"/>
      </td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/>
      <showSetProperties />
    </form>
  </td></tr></table>
 </td></tr></table>

<br />
</div>
<br />
</div>

