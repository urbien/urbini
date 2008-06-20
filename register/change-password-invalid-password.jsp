<div>
<form name="loginform" action="j_security_check" method="POST">

<table border="0" cellpadding="0" cellspacing="0" width="256" cols="2">
  <tr>
    <td class="xl" colspan="2"><text text="invalidPassword"/><br/></td>
  </tr>

  <tr>
    <td align="RIGHT"><text text="userId"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><userId/></td>
  </tr>
  <tr><td align="RIGHT">
    Enter your old password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password" class="xxs" size="10" maxlength="50" /></td>
  </tr>
  <tr><td align="RIGHT">
    Enter your new password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password_new"  class="xxs" size="10" maxlength="50" /></td>
  </tr>
  <tr><td align="RIGHT">
    Re-Enter your new password:<img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password_reenter" class="xxs"  size="10" maxlength="50" /></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value="submitChanges" />
      <input type="hidden" name="j_password_change" value="x" />
    </td>
  </tr>
</table>
  <returnUri />   <challenge />
</form>

<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</div>