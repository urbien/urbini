<div align="center" id="register">
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="userLogin">
    <tr height="40">
      <td  colspan="2" align="center" class="poweredBy-td" valign="middle">
        <a href="http://universalplatform.com" target="_blank" style="text-decoration: none">
          <span class="large-poweredBy"><property name="owner.longName"/></span>
        </a>
      </td>
    </tr>
    <tr>
      <td colspan="2" align="CENTER">
      </td>
    </tr>
    <tr>
      <td class="xl" colspan="2" align="middle"><span class="rxl"><text text="Invalid user name or password"/></span><br/><br/></td>
    </tr>
    <tr>
      <td class="nowrap" align="right"><text text="User name:"/></td>
      <td>
        <input type="Text" class="input" name="j_username" size="15" maxlength="50" />
      </td>
    </tr>
    <tr>
      <td align="right"> <text text="Password:"/></td>
      <td>
        <input type="Password" class="input" name="j_password"  size="15" maxlength="50" />
      </td>
    </tr>
    <tr>
      <td colspan="2" align="center" class="nowrap"><br/>
        <input type="submit" value="Sign In" name="logonButton" /><registerNewUser/>
      </td>
    </tr>
    <tr>
      <td colspan="2"><br/></td>
    </tr>
    <!--tr>
      <td colspan="2">
        <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" bgcolor="#FFFFFF">
          <tr>
            <td colspan="2" valign="bottom">
              <hr size="1" color="#cbcbcb"/>
            </td>
          </tr>
          <tr>
            <td width="1%" valign="bottom"><a href="logonfaq.html"><img src="images/loginhelp.jpg" border="0" /></a></td>
            <td valign="bottom"><span class="xxs"><a href="logonfaq.html">Logon
              help page</a></span></td>
          </tr>
        </table>
      </td>
    </tr-->
  </table>
    <returnUri /> <challenge />
  </form>
</div>