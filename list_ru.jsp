<html>
<include name="include/commonHeader_ru.uhtml" />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="80%" />
    <col width="10%" />
  </colgroup>
<tr>
  <td width="10%"></td>
  <td width="80%"></td>
  <td width="10%"></td>
</tr>
<tr>
  <td colspan="2"><span class="xs"><language/>|<print image="images/printerIcon.gif"/></span></td>
  <td align="right"><userLogOff html="user-login.html"/></td>
</tr>
<tr>
  <td valign="top" width="10%">
    <include name="include/commonLeft_ru.uhtml" />
  </td>
  <td valign="top" align="middle">
    <div align="left"><siteHistory/></div>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html" /> 
      <showSetProperties />
    </form>
  </td>
  <td valign="top" align="left" width="10%" bgcolor="eeeeee">
    <!--include name="searchText.jsp" /-->
    <form name="tablePropertyList" method="POST" action="FormRedirect">
      <tablePropertyList />
      <br></br>
      <center><input type="submit" name="submit" value="search"></input></center>
      <input type="hidden" name="action" value="searchLocal"></input>
      <br></br>
      <!--showSetProperties /-->
    </form>
  </td>
</tr></table>
<br />
<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
<include name="include/commonFooter_ru.uhtml" />
</html>

