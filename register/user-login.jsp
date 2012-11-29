<div id="register" align="center">

<!-- style -->
<style>
.userLogin .rounded_rect_tbl { padding: 3px 10px 10px 10px; }
.userLogin .rounded_rect_tbl td { border: none; }
.userLogin #errorMessage { max-width: 420px; }
.userLogin .input { width: 300px !important; height: 25px; 
  border-radius: 3px 3px 3px 3px;
   /*
    
    box-shadow: 0 0 0 #000000, 0 3px 3px #EEEEEE inset;
*/
}


	.userLogin .prompt {
	  opacity: 0.6;
	  bottom: 1px;
	  /*color: #999999;*/
	  cursor: text;
	  font-size: 13px;
	  height: 20px;
	  /* top: 4px; */
	  left: 4px;
	  line-height: 20px;
	  padding: 4px;
	  position: absolute;
	  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
	  white-space: nowrap;
	  z-index: 1;
	  font-size: 100%;
	}
</style>


<table cellspacing="0" cellpadding="0">
<tr>
<td>
<include name="user-login-help.jsp"/>
</td>
<td><table border="0" cellpadding="0" cellspacing="0" cols="2" class="userLogin"><tr><td align="center">
          <h2><property name="owner.name"/></h2>
        </td>
      </tr>
      <tr><td>
      <!-- The plugin will be embedded into this div //-->
      <!--div id="social_login_container"></div>

      <script type="text/javascript">
       oneall.api.plugins.social_login.build("social_login_container", {
        'providers' :  ['facebook', 'github', 'google', 'hyves', 'linkedin', 'livejournal', 'mailru', 'openid', 'paypal', 'skyrock', 'stackexchange', 'steam', 'twitter', 'vkontakte', 'windowslive', 'wordpress', 'yahoo'], 
        'grid_size_x': '3',
        'grid_size_y': '5',
        'css_theme_uri': 'https://oneallcdn.com/css/api/socialize/themes/buildin/signin/large-v1.css',
        'callback_uri': 'http://mark.obval.com/urbien/social/oneall'
       });
      </script-->
    </td></tr>
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
        <!--
        <td width="40%" class="nowrap" align="right"><text text="User name:"/></td>
        -->
        <td>
          <loginFormUserName />
        </td>
      </tr>
      <tr>
        <!-- 
          <td align="right"> <text text="Password:"/></td>
        -->
        <td>
	        <div class="relative">
	          <input id="password_input" type="password" class="input" name="j_password"  size="15" maxlength="50"/>
	          <label class="prompt no_selection" for="password_input">
	            <text text="Password"/>
	          </label>
	        </div>
	        <a style="float: right;" href="register/password-reminder.html"><span style="font-size: 11px;"><text text="Forgot password?&#160;" /></span></a>
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

<script type="text/javascript">
<![CDATA[ 
var PromptField = {
	bind : function(fields) {
    for (var i = 0; i < fields.length; i++) {
    	fields[i].onfocus  = this.handler;
      fields[i].onkeydown  = this.handler;
      fields[i].onblur  = this.handler;
      var label = getNextSibling(fields[i]);
      setTransitionProperty(label, "opacity 0.2s linear");
    }
  },
	handler : function(event) {
    var field = getEventTarget(event);
    var label = getNextSibling(field);
    if (event.type == "focus")
      label.style.opacity = 0.3;
    else if (event.type == "keydown")
      label.style.visibility = "hidden";
    else if (event.type == "blur" && field.value.length == 0){
      label.style.opacity = 0.6;
      label.style.visibility = "";
    }
  }
}
PromptField.bind([document.getElementById("password_input"), document.getElementById("j_username")]);
]]>
</script>



</div>
