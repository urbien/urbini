<HTML>
<include name="include/commonHeader.html" />
<!--include name="script.html" /-->

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft.html" />
  </td>
  <td valign="top" align="middle">

<br />

<form name="loginform" action="j_security_check" method="POST">
  
<table border="0" cellpadding="0" cellspacing="0" width="256" cols="2">
  <tr>
    <td align="RIGHT">User ID:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Text" name="j_username" size="10" maxlength="20"/></td>
  </tr>
  <tr><td align="RIGHT">  
    Password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password"  size="10" maxlength="10"/></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value=" Log On "/>
    </td>
  </tr>
</table>
  <returnUri />
</form>

<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<include name="include/commonFooter.html" />
</BODY>

</HTML>