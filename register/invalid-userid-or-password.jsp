<HTML>

<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/>
<center>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">

<br />
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">
<table cellpadding="0" border="0" cellspacing="0" width="50%">
  <tr>
    <td class="xl" colspan="2"><text text="invalidUserIdOrPassword"/></td>
  </tr>
  <tr><td colspan="2"></td></tr>
  <tr>
    <td width="1%"><text text="userId"/></td>
    <td><input type="text" class="xxs" name="j_username" size="15" /></td>
  </tr>
  <tr>
    <td><text text="password"/></td>
    <td><input type="password" class="xxs" name="j_password" size="15" />  </td>
  </tr>
  <tr>
    <td colspan="2"><br/><input type="submit" name="s" value="logOn" />  </td>
  </tr>
</table>
<returnUri />
<challenge />
</form>
</td></tr></table>
</center>
</body>

</HTML>