<HTML>

<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" align="middle">

<br />
<form name="loginform" action="j_security_check" method="POST"  onsubmit="return hash(this, 'j_security_check')">
<center>

<table cellpadding="0" border="0" cellspacing="0" width="256">
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

  <!--tr>
    <td></td>
    <td>
      <userLogin html="new-user.html" title="registerMe" />
    </td>
  </tr-->
  <tr>
    <td></td>
    <td><br/><input type="submit" name="s" value="logOn" /></td>
  </tr>
</table>
</center>
<returnUri />
<challenge />
</form>

<!--span class="xs">If you do not remember your Password, click "Give me a new Password" and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<!--div align="left"><span class="xs"><hudsonFog /></span></div-->      <!-- link to Portal page for current category -->
</BODY>

</HTML>