<div style='vertical-align: middle'>
  <form name="loginform" action="j_register" method="POST" autocomplete="off">
    <table width="430" align="center" bgcolor="#cbcbcb" cellpadding="2" cellspacing="0">
      <tr>
        <td>
          <table width="100%" border="0" align="center" cellpadding="3" cellspacing="0" cols="2" bgcolor="#FFFFFF">
            <tr class="register">
              <td colspan="2">
                <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" bgcolor="#FFFFFF">
                  <tr>
                    <td class="poweredBy-td" valign="middle" align="left" height="50">
                      <a href="http://lablz.com" target="_blank" style="text-decoration: none">
                        <span class="large-poweredBy" style="padding-left: 50px">Universal</span><span class="large-poweredBy-b">Platform</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="CENTER"><img src="images/spacer.gif" border="0" height="10"/><br/>
                      <hr size="1" style="color:#cbcbcb"/>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" rowspan="3" width="40%"><img src="images/keys.gif" border="0" /></td>
              <td><errorMessage/><text text="User name:"/><br/>
                <userId/>
                <input type="hidden" name="-updateUser" value="y" />
                <input type="hidden" name="-sessionId" value="" />
              </td>
            </tr>
            <tr>
              <td> <text text="Password:"/><br/>
                <input type="Password" class="login" name="j_password"  size="30" maxlength="50" />
              </td>
            </tr>
            <tr>
              <td> <text text="Re-enter Password:"/><br/>
                <input type="Password" class="login" name="j_password_reenter"  size="30" maxlength="50" />
              </td>
            </tr>
            <tr>
              <td align="CENTER" colspan="2"> <br />
                <input type="submit" value="    Logon    " name="logonButton" />
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
    <returnUri />
  </form>
</div>