<div>
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">

<table border="0" cellpadding="0" cellspacing="0" width="100%" cols="2">
  <colgroup>
  <col width="50%"/>
  <col width="50%"/>
  </colgroup>
  <tr>
    <td align="RIGHT"><text text="userId"/><img src="images/spacer.gif" border="0" width="5" /></td>
    <td><userId/></td>
  </tr>
  <tr><td align="RIGHT">
    <text text="enterOldPassword"/><img src="images/spacer.gif" border="0" width="5" /></td>
    <td><input type="Password" class="xxs" name="j_password"  size="10" maxlength="50" /></td>
  </tr>
  <tr><td align="RIGHT">
    <text text="enterNewPassword"/><img src="images/spacer.gif" border="0" width="5" /></td>
    <td><input type="Password" class="xxs" name="j_password_new"  size="10" maxlength="50" /></td>
  </tr>
  <tr><td align="RIGHT">
    <text text="reenterNewPassword"/><img src="images/spacer.gif" border="0" width="5" /></td>
    <td><input type="Password" class="xxs" name="j_password_reenter"  size="10" maxlength="50" /></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value=" Submit changes "  name="logonButton" />
      <input type="hidden" name="j_password_change" value="x" />
    </td>
  </tr>
</table>
  <returnUri />
  <challenge />
</form>

<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</div>