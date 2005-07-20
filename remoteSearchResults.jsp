<div>
<div nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="95%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%">
        <span class="xs">
        <menu toolbar="toolbar1"        activate="onMouseOver"/>
        <menu toolbar="transport"       activate="onMouseOver"/>
        <menu toolbar="search"          activate="onMouseOver"/>
        <menu toolbar="toolbar2"        activate="onMouseOver"/>
        <menu toolbar="support"         activate="onMouseOver" allow="admin"/>
        <menu toolbar="personalization" activate="onMouseOver"/>

        <print image="icons/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/></span><pdaToPc image="images/pda.gif"/></td>
      <td valign="top" align="right" width="10%"><!--changePassword/><userLogOff html="user-login.html"/--></td>
    </tr>
    <tr valign="top"><td>
    <!--form action="list.html" name="siteResourceList"-->
<form name="categoryTextSearch"> 
  <searchHistory/>
  <categoryTextSearch />
  <resourcesSearch resourcesUri="/sql/text/search/resources" />
  <filesSearch filesUri="text/search/files" />
</form>
      <div align="left"><backLink /></div>
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <!--addNewResource html="mkResource.html"/> 
      <createResources/>
      <showSetProperties /-->
    <!--/form-->
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">
        <menu toolbar="filterParallel" type="onpage" title="false"/>
    </td>
</tr></table>
</td></tr></table>
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
        <pdaToPc image="images/pda.gif"/>
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
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</div>

