<html>
<include name="include/commonHeader"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="90%" />
  </colgroup>
  <tr>
    <td width="10%"> </td> 
    <td width="90%"> </td> 
  </tr>
<tr><td valign="top">
<include name="include/commonLeft"/>
</td>
<td valign="top" align="middle">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top"><span class="xs"><language/>|<print image="images/printerIcon.gif"/></span></td>
      <td valign="top" align="right"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
<tr valign="top"><td colspan="2">
<form name="tablePropertyList" method="POST" action="FormRedirect">
  <tablePropertyList />
  <br></br>
  <center><input type="submit" name="submit" value="search"></input></center>
  <input type="hidden" name="action" value="searchLocal"></input>
  <br></br>
  <showSetProperties />
</form>
</td></tr></table></td></tr></table>

<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter"/>
</html>
