<HTML>
<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/>
<br />
<center>
<form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')">
    <table border="0" cellpadding="0" cellspacing="3" width="256" cols="2">
      <tr> 
        <td align="CENTER" rowspan="2"><img src="images/keys.gif" border="0" /></td>
        <td align="RIGHT"><text text="User ID:"/><img src="images/spacer.gif" border="0" width="5"/></td>
        <td> 
          <input type="Text" class="xxs" name="j_username" size="10" maxlength="50"/>
        </td>
      </tr>
      <tr> 
        <td align="RIGHT"> <text text="Password:"/><img src="images/spacer.gif" border="0" width="5"/></td>
        <td> 
          <input type="Password" class="xxs" name="j_password"  size="10" maxlength="50"/>
        </td>
      </tr>
      <tr> 
        <td align="CENTER" colspan="3"> <br />
          <input type="submit" value="Log on"/>
        </td>
      </tr>
    </table>
  <returnUri />
  <challenge />
</form>
</center>
</body>
</HTML>