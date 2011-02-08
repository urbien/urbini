<div id="register" align="center">
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="userLogin"><tr><td>
  <form name="loginform" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
    <table border="0" cellpadding="3" cellspacing="0" cols="2">
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
  <div id="fb-root"></div>
  <div xmlns:fb="http://www.facebook.com/2008/fbml">
  <script src="http://connect.facebook.net/en_US/all.js"></script>
	<script>
<![CDATA[
		  FB.init({appId: '8841648310', status: true, cookie: true, xfbml: true});
      FB.Event.subscribe('auth.login', function(response) {
        window.location.reload();
      });
		  
		  FB.Event.subscribe('auth.sessionChange', function(response) {
		    if (response.session) {
		      alert("A user has logged in, and a new cookie has been saved");
		    } else {
		      alert("The user has logged out, and the cookie has been cleared");
		    }
		  });
]]>	  
  </script>

	
<!--fb:login-button perms="email,offline_access,publish_stream,user_groups,read_friendlists,manage_friendlists" registration-url="http://newcrm.lablz.com"></fb:login-button-->	
  <!--a href="https://graph.facebook.com/oauth/authorize?client_id=8841648310&amp;display=page&amp;redirect_uri=http://newcrm.lablz.com/social/fbsignup&amp;scope=publish_stream,email,offline_access,user_groups,read_friendlists,manage_friendlists
"><span class="blue"><text text="Login to Facebook and authorize" /></span></a-->
  </div>
  
  
</div>
