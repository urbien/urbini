<HTML>
<include name="include/commonHeader" />

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft" />
  </td>
  <td valign="top" align="middle">

<br />
<form method="post" action="j_security_check">
<table cellpadding="0" border="0" cellspacing="0" width="50%">
  <tr>
    <td class="xl" colspan="2"><text text="userIdMissing" /></td>
  </tr>
  <tr><td colspan="2"></td></tr>
  <tr>
    <td><text text="userId"/></td>
    <td><input type="text" class="xxs" name="j_username" size="15" /></td>
  </tr>
  <tr>
    <td><text text="password"/></td>
    <td><input type="password" class="xxs" name="j_password" size="15" />  </td>
  </tr>

  <tr>
    <td></td>
    <td>
      <userLogin html="new-user.html" title="registerMe" />
    </td>
  </tr>
  <tr>
    <td></td>
    <td><br/><input type="submit" name="s" value="logOn" /></td>
  </tr>
</table>
<returnUri />
</form>

<!--span class="xs">If you do not remember your Password, click "Give me a new Password" and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
<include name="include/commonFooter" />
</BODY>

</HTML>