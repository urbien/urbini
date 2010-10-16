<div id="register" align="center">
  <form name="captcha" method="POST" autocomplete="off" action="jj_security_check?-captchaLogin=y">
    <table border="0" cellpadding="3" cellspacing="0" cols="2" class="userLogin">
      <tr>
        <td colspan="2" class="poweredBy-td" valign="middle" align="center" height="40">
          <span class="large-poweredBy"><property name="owner.longName"/></span>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="CENTER">
          <errorMessage/>
        </td>
      </tr>
      <tr>
        <td>
           <captcha/>
           <returnUri/>
        </td>
      </tr>
      <tr>
        <td align="middle" colspan="2" valign="CENTER"><br/>
          <input type="submit" value="Submit" name="logonButton"/>
        </td>
      </tr>
      <tr>
        <td colspan="2"><br/></td>
      </tr>
    </table>
    <returnUri />
  </form>

</div>

