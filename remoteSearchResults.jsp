<html>
<include name="include/commonHeader" />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="90%" />
  </colgroup>
  <tr>
    <td width="10%"> </td> 
    <td width="90%"> </td> 
  </tr>
<tr  valign="top">
  <td valign="top" width="10%">
    <include name="include/commonLeft" />
  </td>

  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><language/>|<print image="images/printerIcon.gif"/>|<saveInExcel image="images/excel.gif"/></span></td>
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
    
    <form name="tablePropertyList" method="POST" action="remoteSearchResults.html">
      <tablePropertyList />
      <br></br>
      <center><input type="submit" name="submit" value="locate"></input></center>
      <input type="hidden" name="action" value="searchDatabase"></input>
      <br></br>
    </form>
  </td>
</tr></table>
</td></tr></table>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
<include name="include/commonFooter" />
</html>

