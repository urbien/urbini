<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
<hideBlock>    
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr bgcolor="#F1F1F1">
	    <td class="welcomeBig" valign="top">
	      <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a>
	      <changePassword/><userLogOff html="user-login.html"/><registerNewUser/>
	    </td>
	    <td valign="middle" nowrap="nowrap"  align="right">
	      <a href="http://universalplatform.com/home"><img src="icons/universalPlatform.gif" align="absmiddle" border="0"/><span  class="poweredBy" style="padding-left: 5px">on Universal</span><span class="poweredBy-b">Platform</span></a>
	    </td>
	  </tr>
    </table>
</hideBlock>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" colspan="2" width="100%">
        <div id="corePageContent"> <file/> </div>
      </td>
    </tr>
    </table>

    <br></br>
    <include name="requiredFooter.jsp"/>
  </div>

  </body>
</html>


