<HTML>

<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/>
<center>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">

<br />
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">
<table cellpadding="0" border="0" cellspacing="0" width="356">
  <tr>
    <td class="xl" colspan="2" align="middle"><text text="Invalid user ID or password"/><br/><br/></td>
  </tr>
  <tr>
    <td align="right"><text text="User ID:"/></td>
    <td><input type="text" class="xxs" name="j_username" size="10" /></td>
  </tr>
  <tr>
    <td align="right"><text text="Password:"/></td>
    <td><input type="password" class="xxs" name="j_password" size="10" />  </td>
  </tr>
  <tr>
    <td></td>
    <td><br/><input type="submit" name="s" value="logOn" />  </td>
  </tr>
</table>
<returnUri />
<challenge />
</form>
</td></tr></table>
</center>
</body>

</HTML>