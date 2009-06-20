<div id="mainskin" class="blue">
<div style='vertical-align: middle; padding-top:5px'>
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
    <table width="430" align="center" class="loginBorder" cellpadding="2" cellspacing="0">
      <tr>
        <td>
          <table width="100%" border="0" align="center" cellpadding="3" cellspacing="0" cols="2" class="userLogin">
            <tr class="register">
              <td colspan="2">
                <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" class="userLogin">
                  <tr>
                    <td class="poweredBy-td" valign="middle" align="left" height="50">
                      <a href="http://universalplatform.com" target="_blank" style="text-decoration: none">
                        <span class="large-poweredBy" style="padding-left: 50px">Universal</span><span class="large-poweredBy-b">Platform</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="CENTER"><img src="images/spacer.gif" border="0" height="10"/><br/>
                      <errorMessage/>
                      <hr size="1" style="color:#cbcbcb"/>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" rowspan="2" width="40%"><img src="images/keys.gif" border="0" /></td>
              <td><text text="User name:"/><br/>
                <input type="Text" class="login" name="j_username" size="30" maxlength="50"/>
              </td>
            </tr>
            <tr>
              <td> <text text="Password:"/><br/>
                <input type="Password" class="login" name="j_password"  size="30" maxlength="50"/>
              </td>
            </tr>
            <tr>
              <td width="40%"> <!--registerNewUser/--> <br /><br /></td>
              <td valign="CENTER">
                <input type="submit" class="lButton" value="    Logon    " name="logonButton"/><registerNewUser/>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" class="userLogin">
                  <tr>
                    <td colspan="2" valign="bottom">
                      <hr size="1" style="color:#cbcbcb"/>
                    </td>
                  </tr>
                  <tr>
                    <td width="1%" valign="bottom"><a href="logonfaq.html"><img src="images/loginhelp.jpg" border="0" /></a></td>
                    <td valign="bottom"><a href="logonfaq.html"><span class="xxs">Logon help page</span></a></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <returnUri /> <challenge />
  </form>
<!-- erasing the cookie set by the first page on login in case if auto chat start
     is enabled. Cookie is set to prevent chat window to popup when user clicks the back
     button. -->
<!--     
<script language="JavaScript">
  eraseCookie("chatWindowOpened");
</script>
-->

</div>
</div>
