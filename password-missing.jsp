<HTML>
<body onload="document.loginform.j_username.focus();"/>
<include name="hashScript.html"/>
<br />
<center>
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">
<table cellpadding="0" border="0" cellspacing="0" width="50%">
  <tr>
    <td class="xl" colspan="2"><text text="missingPassword"/></td>
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
    <td></td>
    <!--td>
      <userLogin html="new-user.html" title="registerMe" />
   </td-->
  </tr>
  <tr>
    <td></td>
    <td><br/><input type="submit" name="s" value="logOn" />  </td>
  </tr>
</table>
<returnUri />
<challenge />
</form>

</HTML>