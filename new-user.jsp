<HTML>
<include name="include/commonHeader" />
<include name="registerScript.html" />

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft" />
  </td>
  <td valign="top" align="middle">

<br />

<include name="register.html" />
<form name="loginform" action="j_security_check" method="POST">
  <input type="hidden" name="j_username" value="" />
  <input type="hidden" name="j_password" value="" />
  <input type="hidden" name="j_password_reenter" value="" />
  <input type="hidden"   name="j_register" value="x" />
  <returnUri />
</form>
</td></tr></table>
<include name="include/commonFooter" />
</BODY>

</HTML>