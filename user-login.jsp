<HTML>

<body onload="document.loginform.j_username.focus();"/>
<include name="hashScript.html"/>
<br />
<center>
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">
  
<table border="0" cellpadding="0" cellspacing="3" width="256" cols="2">
  <tr>
    <td align="RIGHT"><text text="userId"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Text" class="xxs" name="j_username" size="10" maxlength="50"/></td>
  </tr>
  <tr><td align="RIGHT">  
    <text text="password"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" class="xxs" name="j_password"  size="10" maxlength="50"/></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value="logOn"/>
    </td>
  </tr>
</table>
  <returnUri />
  <challenge />
</form>
</center>

</HTML>