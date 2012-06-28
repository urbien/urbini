<div id="register" align="center">
<table cellspacing="0" cellpadding="0">
<tr>
<td>
<include name="user-login-help.jsp"/>
</td>
<td><table border="0" cellpadding="0" cellspacing="0" cols="2" class="userLogin"><tr><td align="center">
          <h2><property name="owner.name"/></h2>
        </td>
      </tr>
  <tr>
    <td><authenticateByFacebook/></td>
  </tr>
	<tr>
    <td>
    	<registration/>
		  <registration href="y"/>
		</td>
  </tr>
      <tr><td>
  <form id="loginForm" name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
    <table class="rounded_rect_tbl" border="0" cellpadding="3" cellspacing="0" cols="2" width="100%">
      <!--tr>
        <td colspan="2" valign="middle" align="center" height="40">
          <span class="large-poweredBy"><property name="owner.longName"/></span>
          <property name="descriptionOfSite"/>
        </td>
      </tr-->
      <tr>
        <td colspan="2" align="CENTER">
          <errorMessage/>
        </td>
      </tr>
      <tr>
        <td width="40%" class="nowrap" align="right"><text text="User name:"/></td>
        <td>
          <loginFormUserName />
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
           <a href="register/password-reminder.html"><span style="font-size: 11px;"><text text="Forgot password?" /></span></a>
        </td>
      </tr>
      <tr>
        
        
      <!--  
      <td align="right"><registration href="y"/></td>
      -->  
        
        
        <td align="center" colspan="2">
          <input type="submit" value="Sign In" name="logonButton"/><registerNewUser/>
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
	</table>
</td>
<td></td>
</tr>
</table>
</div>
