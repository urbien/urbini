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
  <script src="http://vkontakte.ru/js/api/openapi.js" type="text/javascript"></script>
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

	<div id="vk_api_transport"></div>
	<a href="javascript:doLogin()" id="vk_login"><img src="icons/vkLogin.png" width="127" height="21" /></a><br />
  <a href="javascript:doLogout()" id="vk_logout">I'm way better looking than this guy!</a>
	
	<script>
	<![CDATA[
//		window.onload = function() { // when the page loads
		    // initialize vkApp
      var redirectPath = '/obval/social/vksignup'; 
		  var settings = 7;  // 7 = notify, friends, photos 
		  window.vkAsyncInit = function() {
		    VK.init({
		        apiId: 2153829, 
		        nameTransportPath: '/xd_receiver.html'
		    });
		  };
		  setTimeout(function() {
		    var el = document.createElement('script');
		    el.type = 'text/javascript';
		    el.src = 'http://vkontakte.ru/js/api/openapi.js?3';
		    el.async = true;
		    document.getElementById('vk_api_transport').appendChild(el);
		  }, 0);
//		}
			function doLogin() {
        var redirected = false;
	      VK.Auth.getLoginStatus(
	    	  function (response) {
		    	  if (response.session) {
//              if (!checkSettings()) { // try to acquire permission settings in login function 
//                return;
//              }
              redirected = true;
              window.location = redirectPath;			    	  
		    	  }
	    	  }
	    	);
	    	if (redirected) {
		    	return;
	    	}
		    VK.Auth.login(
	        function (response) {
            if (response.session) {
           	  redirected = true;
              window.location = redirectPath;
            } else {
            }
	        },
	        settings
	      );
	    }
		  function checkSettings() {
			  VK.api('getUserSettings', {}, function(data) {
	        if(data.response & settings == settings) {
//	           VK.callMethod('showSettingsBox', settings);
	           return false;
	        }
	        return true;
		    });
		  }
			function doLogout() {
			  VK.Auth.logout(
					function () {
						window.location.reload();
					}
			  );
		  }
	]]>   	
	</script>
	
<!--fb:login-button perms="email,offline_access,publish_stream,user_groups,read_friendlists,manage_friendlists" registration-url="http://newcrm.lablz.com"></fb:login-button-->	
  <!--a href="https://graph.facebook.com/oauth/authorize?client_id=8841648310&amp;display=page&amp;redirect_uri=http://newcrm.lablz.com/social/fbsignup&amp;scope=publish_stream,email,offline_access,user_groups,read_friendlists,manage_friendlists
"><span class="blue"><text text="Login to Facebook and authorize" /></span></a-->
  </div>
  
  
</div>
