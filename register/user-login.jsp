<HTML>
<body onload="document.loginform.j_username.focus();">
<include name="hashScript.html"/> <br />
<center>
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')">
    <table width="258" align="center" bgcolor="#CCCCCC">
      <tr> 
        <td> <table width="256" border="0" align="center" cellpadding="0" cellspacing="3" cols="2" bgcolor="#FFFFFF">
            <tr> 
              <td colspan="3" align="CENTER"><a href="http://hudsonfog.com/" target="_blank"><img src="images/PoweredbyHudsonFog.gif" border="0" /></a></td>
            </tr>
            <tr> 
              <td colspan="3" align="CENTER"><img src="images/spacer.gif" border="0" height="10"/></td>
            </tr>
            <tr> 
              <td align="CENTER" rowspan="2"><img src="images/keys.gif" border="0" /></td>
              <td align="RIGHT"><text text="User ID:"/><img src="images/spacer.gif" border="0" width="5"/></td>
              <td> <input type="Text" class="xxs" name="j_username" size="10" maxlength="50"/> 
              </td>
            </tr>
            <tr> 
              <td align="RIGHT"> <text text="Password:"/><img src="images/spacer.gif" border="0" width="5"/></td>
              <td> <input type="Password" class="xxs" name="j_password"  size="10" maxlength="50"/> 
              </td>
            </tr>
            <tr> 
              <td align="CENTER" colspan="3"> <br /> <input type="submit" value="Log on"/> 
              </td>
            </tr>
            <tr> 
              <td colspan="3" align="CENTER"><img src="images/spacer.gif" border="0" height="5"/></td>
            </tr>
          </table></td>
      </tr>
    </table>
    <returnUri /> <challenge /> 
  </form>
</center>
</body>
</HTML>
