<div id="register" align="center">
  <form id="loginForm" name="loginform" action="jj_security_check" method="POST" autocomplete="off">
    <table border="0" cellpadding="3" cellspacing="0" cols="2" class="userLogin">
      <tr>
        <td colspan="2" class="poweredBy-td" valign="middle" align="center" height="40">
          <span class="large-poweredBy">
            <property name="owner.longName"/>
          </span>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="CENTER">
          <errorMessage/>
        </td>
      </tr>
      <tr>
        <td>

          <table class="rounded_rect_tbl">
            <tr>
              <td width="40%" class="nowrap" align="right">
                <text text="User name:"/>
              </td>
              <td>
                <input type="Text" class="input" name="j_username" size="15" maxlength="50"/>
              </td>
            </tr>
            <tr>
              <!--td width="40%" class="nowrap" align="right"><text text="Enter the code shown"/></td-->
              <td colspan="2">
                <captcha/>
              </td>
            </tr>
            <tr>
              <td align="middle" colspan="2" valign="CENTER">
                <input type="submit" value="Submit" name="logonButton"/>
                <input type="hidden" name="-passwordReminder" value="y"/>
                <input type="hidden" name=".jstest" value=""/>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: center; font-size: 14px;">
                Please check your email after submit!
              </td>
            </tr>
          </table>
          
        </td>
      </tr>
      <tr>
        <td colspan="2">
          <userLogOff html="user-login.html" button="y" class="button" style="text-align: center;"/>
        </td>
      </tr>
    </table>
    
    <returnUri/>
  </form>
  
</div>
