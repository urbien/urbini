<html>
<!--style>
	a, A:link, a:visited, a:active
		{color: #0000aa; text-decoration: none; font-family: Tahoma, Verdana; font-size: 11px}
	A:hover
		{color: #ff0000; text-decoration: none; font-family: Tahoma, Verdana; font-size: 11px}
	p, tr, td, ul, li
		{color: #000000; font-family: Tahoma, Verdana; font-size: 11px}
	form
		{margin: 5px;}
	.header1, h1
		{color: #ffffff;  background: #4682B4; font-weight: bold; font-family: Tahoma, Verdana; font-size: 13px; margin: 0px; padding: 2px;}
	.header2, h2
		{color: #000000;  background: #DBEAF5; font-weight: bold; font-family: Tahoma, Verdana; font-size: 12px;}
	.cright
		{color: #ffffff;  background: #4682B4; font-family: Tahoma, Verdana; font-size: 11px; text-align: right;}
	.intd
		{color: #000000; font-family: Tahoma, Verdana; font-size: 11px; padding-left: 15px;}

</style-->
<!-- European format dd-mm-yyyy -->
<script language="JavaScript">

<include name="calendar/calendar1.html"/>
<!--script language="JavaScript" src="calendar1.js"-->

</script>

<siteTitle />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/></span></td>
      <td valign="top" align="right" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <!--div align="left"><siteHistory/></div-->
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <showSetProperties />
    </form>
    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit" value="filter"></input>
      <input type="submit" name="clear" value="clear"></input>
      <!--input type="hidden" name="action" value="searchLocal"></input-->
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" value="filter"></input>
      <input type="submit" name="clear" value="clear"></input>
      <input type="hidden" name="action" value="searchLocal"></input>
      </td></tr></table>   
      <!--br></br-->
      <!--showSetProperties /-->
    </form>
  </td>
</tr></table>
</td></tr></table>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

