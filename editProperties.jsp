<html>
<include name="include/commonHeader.html"/>

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
  <td colspan="2"><span class="xs"><language/></span></td>
  <td align="right"><userLogOff html="user-login.html"/></td>
</tr>
<tr>
  <td valign="top" width="10%"><include name="include/commonLeft.html"/></td>
  <td valign="top" width="90%">
<form name="tablePropertyList" method="post" action="FormRedirect">
  <tablePropertyList />
  <div align="right"><measurement/></div>
  <input type="hidden" name="action" value="submitChanges"></input>
  <br></br>
  <center><input type="submit" name="submit" value="submitChanges"></input></center>
</form>
</td></tr></table>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter.html"/>
</html>
