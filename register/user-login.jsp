<div id="register" align="center">
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="userLogin"><tr><td>
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
    <table border="0" cellpadding="3" cellspacing="0" cols="2" width="100%">
      <tr>
        <td colspan="2" valign="middle" align="center" height="40">
          <span class="large-poweredBy"><property name="owner.longName"/></span>
          <property name="descriptionOfSite"/>
        </td>
      </tr>
      <tr>
        <td colspan="2" align="CENTER">
          <errorMessage/>
        </td>
      </tr>
      <tr>
        <td width="40%" class="nowrap" align="right"><text text="User name:"/></td>
        <td>
          <input type="Text" class="input" name="j_username" size="15" maxlength="50"/>
        </td>
      </tr>
      <tr>
        <td align="right"> <text text="Password:"/></td>
        <td>
          <input type="Password" class="input" name="j_password"  size="15" maxlength="50"/>
        </td>
      </tr>
      <tr>
        <td></td>
        <td>
           <a href="register/password-reminder.html"><span class="red"><text text="Forgot password?" /></span></a>
        </td>
      </tr>
      <tr>
        <td align="middle" colspan="2" valign="CENTER"><br/>
          <input type="submit" value="Sign In" name="logonButton"/><registerNewUser/>
				  <br/><br/>
				  <!--authenticateByFacebook/ -->
        </td>
      </tr>
      <!--tr>
        <td colspan="2"><br/></td>
      </tr-->
    </table>
    <returnUri /> <challenge />
  </form>
  </td></tr>
  <tr><td>
	  <authenticateByFacebook/>
	</td></tr>
	</table>
    
</div>
