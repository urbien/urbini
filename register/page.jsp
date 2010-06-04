<html>

  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body" login="true">
    
     <robotDetector/>
    
    <include name="include/commonHeader.jsp"/>

    <script src="register/hashScript.js" type="text/javascript" language="JavaScript"></script>

    <table width="100%"  height="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td><file/></td>
      </tr>
    </table>

		<script type="text/javascript" language="JavaScript">
			function jsTester() {
				var f = document.forms['loginform'];
	
				if (typeof Mobile != 'undefined') {
					var page = Mobile.getCurrentPageDiv();
					f = getChildByAttribute(page, "name", 'loginform');
				}
				
				if (f) {
		      var jstest = f.elements['.jstest'];
		      jstest.value = "ok"; // server will know that JavaScript worked
					var u = f.elements['j_username'];
		      if (u)
						if (u.type)
							if (u.type != 'hidden')
			         try {
			         	u.focus();
							 } catch (e) { }
		   	}
			}
	
			//setTimeout(jsTester, 1000);
			jsTester();
		
		</script>
		
  </body>
</html>
