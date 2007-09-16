<div style='vertical-align: middle'>
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
    <table bgcolor="#cbcbcb" cellpadding="2" cellspacing="0"  align="center" style="margin-top: 0%; width: 30em">
      <tr>
        <td>
          <table width="100%" border="0" align="center" cellpadding="3" cellspacing="0" cols="2" bgcolor="#FFFFFF">
            <tr class="register">
              <td colspan="2">
                <table width="100%" border="0" align="center" cellpadding="0" cellspacing="3" bgcolor="#FFFFFF" class="poweredBy-td">
                  <tr>
                    <td width="10%">
                      <img src='icons/logo-large.gif' border='0' align='left' />
                    </td>
                    <td style='margin-left: 20%; text-align: center'>
                      <a href="http://lablz.com" target="_blank">
                        <span class="poweredBy-b" style='font-size: 140%'>on </span> <span class="poweredBy" style='font-size: 140%'>Universal</span><span class="poweredBy-b" style='font-size: 140%'>Platform</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" rowspan="2" width="30%"><img src="images/keys.gif" border="0" /></td>
              <td><text text="User name:"/><br/>
                <input type="Text" style="background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-bottom:1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:19px;text-decoration:none; font-size:11px" name="j_username" size="30" maxlength="50"/>
              </td>
            </tr>
            <tr>
              <td> <text text="Password:"/><br/>
                <input type="Password" style="background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-bottom:1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:19px;text-decoration:none; font-size:11px" name="j_password"  size="30" maxlength="50"/>
              </td>
            </tr>
            <tr>
              <td width="40%"> <!--registerNewUser/--> <br /><br /></td>
              <td valign="CENTER"><br/>
                <input type="submit" style="background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:19px;text-decoration:none;cursor: pointer; font-size:11px" value="    Logon    " name="logonButton"/><registerNewUser/>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" bgcolor="#FFFFFF">
                  <tr>
                    <td colspan="2" valign="bottom">
                      <hr size="1" style="color:#cbcbcb"/>
                    </td>
                  </tr>
                  <tr>
                    <td width="1%" valign="bottom"><a href="logonfaq.html"><img src="images/loginhelp.jpg" border="0" /></a></td>
                    <td valign="bottom"><span class="xxs"><a href="logonfaq.html">Logon
                      help page</a></span></td>
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
<script language="JavaScript">
  eraseCookie("chatWindowOpened");
</script>

</div>