<div>
<form method="post" action="j_security_check">
<table cellpadding="0" border="0" cellspacing="0" width="%1">
  <tr>
    <td class="xl" colspan="2"><text text="passwordsDoNotMatch"/></td>
  </tr>

  <tr>
    <td align="right">Fog ID:</td>
    <td><input type="text" class="xxs" name="j_username" size="15" /></td>
  </tr>
  <tr>
    <td align="right">Password:</td>
    <td><input type="password" class="xxs" name="j_password" size="15" />  </td>
  </tr>

  <tr>
    <td align="right">Retype password:</td>
    <td><input type="password" class="xxs" name="j_password_reenter" size="15" /> </td>
  </tr>

  <tr>
    <td></td>
    <td><input type="submit" name="s" value=" Register me please " /></td>
  </tr>
  <tr>
    <td></td>
    <td class="xs">
      <userLogin html="user-login.html" title="I have already registered, let me in, please" />
      <input type="hidden"   name="j_register" value="x" />
    </td>
  </tr>
</table>
<returnUri />  <challenge />
</form>
</div>