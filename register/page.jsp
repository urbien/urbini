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
<![CDATA[		
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
	
			function addWorkEmail(e) {
			  var a = getTargetElement(e);
			  if (!a)
			    return;
			  var elm = document.getElementById("workEmail");
			  if (!elm  ||  !elm.value)
			    return;
			  var href = a.href;  
			  var idx = href.indexOf("redirect_uri=");
			  var idx1 = href.indexOf("&", idx);
/*			  href = href.substring(0, idx1) + encodeURIComponent("?workEmail=" + elm.value) + href.substring(idx1);*/
			  href = href + encodeURIComponent("?workEmail=" + encodeURIComponent(elm.value));

  			alert(href);    
			  a.href = href;  
			}
			function getDocumentEvent(e) {
			  if (e) return e;
			  if (!window) return null;
			  if (window.event)
			    return window.event;
			  else
			    return null;
			}
			function getTargetElement(e) {
			  e = getDocumentEvent(e); if (!e) return null;
			  var elem;
			  var elem1 = e.target;
			  if (elem1) {
			    if (e.currentTarget && (e.currentTarget != elem1)) {
  	        elem = e.currentTarget;
			    }
			    else
			      elem = elem1;
			  }
			  else {
			    elem = e.srcElement;
			    if(elem.parentNode && elem.parentNode.tagName.toLowerCase() == "a")
			      elem = elem.parentNode;
			  }
			  return elem;
			}

			//setTimeout(jsTester, 1000);
			jsTester();
]]>	  		
		</script>
		
  </body>
</html>
