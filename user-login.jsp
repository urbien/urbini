<HTML>
<include name="include/commonHeader.html" />
<include name="script.html" />

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft.html" />
  </td>
  <td valign="top" align="middle">

<br />

<include name="login.html" />
  <!--userLogin html="new-user.html" title="I am not a member, register me please" /-->

<form name="loginform" action="j_security_check" method="POST">
  <input type="hidden" name="j_username" value="" />
  <input type="hidden" name="j_password" value="" />
  <returnUri />
</form>

<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<include name="include/commonFooter.html" />
</BODY>

</HTML>