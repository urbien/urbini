<HTML>
<include name="include/commonHeader" />
<!--include name="script.html" /-->

<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
  <col width="10%"/>
  <col width="80%"/>
  <col width="10%"/>
  </colgroup>
<tr>
  <td valign="top" width="10%">
    <include name="include/commonLeft" />
  </td>
  <td valign="top" align="middle" width="80%">

<br />

<center>  
<form name="loginform" action="j_security_check" method="POST">
<table border="0" cellpadding="0" cellspacing="0" width="100%" cols="2">
  <colgroup>
  <col width="50%"/>
  <col width="50%"/>
  </colgroup>
  <tr>
    <td class="xl" colspan="2" align="center"><text text="missingPassword"/><br/></td>
  </tr>
  
  <tr>
    <td align="RIGHT"><text text="userId"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><userId/></td>
  </tr>
  <tr><td align="RIGHT">  
    <text text="enterOldPassword"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password"  class="xxs" size="10" maxlength="50"/></td>
  </tr>
  <tr><td align="RIGHT">  
    <text text="enterNewPassword"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password_new" class="xxs"  size="10" maxlength="50"/></td>
  </tr>
  <tr><td align="RIGHT">  
    <text text="reenterNewPassword"/><img src="images/spacer.gif" border="0" width="5"/></td>
    <td><input type="Password" name="j_password_reenter"  class="xxs" size="10" maxlength="50"/></td>
  </tr>
  <tr>
    <td align="CENTER" colspan="2">
      <br />
      <input type="Submit" value="submitChanges"/>
      <input type="hidden" name="j_password_change" value="x"/>
    </td>
  </tr
</table>
  <returnUri />
</form>
</center>

<!--span class="xs">If you do not remember your Password, click &quot;Give me a new Password&quot; and we will send it to the email address you specified when you registered.</span-->
</td></tr></table>

<include name="include/commonFooter" />
</BODY>

</HTML>