<div style='vertical-align: middle'>
  <form name="loginform" action="j_register" method="POST" autocomplete="off" onSubmit="Boost.user.signup(this.j_username.value);">
    <table width="200" align="center" bgcolor="#cbcbcb" cellpadding="2" cellspacing="0">
      <tr>
        <td>
          <table width="100%" border="0" align="center" cellpadding="3" cellspacing="0" cols="2" bgcolor="#FFFFFF">
            <tr class="register">
              <td>
                <table width="100%" border="0" align="center" cellpadding="3" cellspacing="3" bgcolor="#FFFFFF">
                  <tr>
                    <td class="poweredBy-td" valign="middle" height="50">
                      <a href="http://lablz.com" target="_blank" style="text-decoration: none">
                        <span class="large-poweredBy" style="padding-left: 30px">Lablz</span>&#160;<span class="large-poweredBy-b">Bhoost</span>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="CENTER"><img src="images/spacer.gif" border="0" height="10"/><br/>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="middle"><errorMessage/><span style="color:darkblue;font-weight:bold"><text text="Enter your re-activation code:"/></span><br/>
                <input type="Text" class="input" name="j_username" size="20" maxlength="50" />
              </td>
            </tr>
            <tr>
              <td><br/></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <returnUri />
  </form>
</div>