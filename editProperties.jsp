<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top" width="95%">
<center>
<table width="98%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
  <td valign="top" width="100%" class="keywordsearch">
   <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="90%">
    <menu toolbar="toolbar1"  activate="onMouseOver"/>
    <menu toolbar="transport" activate="onMouseOver"/>
    <menu toolbar="search"    activate="onMouseOver"/>
    <menu toolbar="toolbar2"  activate="onMouseOver"/>
    <menu toolbar="toolbar3"  activate="onMouseOver"/>
    <pdaToPc image="images/pda.gif"/>
    </td>
    <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
      <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
    </form>
    </tr></table></td>
  </tr>
</table></center></td></tr></table>
<br/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td colspan="2">
     <font color="red"><center><b><errorMessage /></b></center></font>
   
    <form name="tablePropertyList" method="post" id="filter" >
      <tablePropertyList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="action" value="showPropertiesForEdit"></input>
      <br></br>
      <center>
        <input type="submit" name="submit" value="Submit changes"></input>
        &#160;&#160;<input type="submit" name="cancel" value="  Cancel  "></input>
      </center>
    </form>
   </td>
   </tr>
   </table>
</td></tr></table>
<div align="left"><span class="xs"><hudsonFog /></span></div>
</div>
