<html>
  <include name="commonHead.jsp" />  
  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <div nonPda="T">
    <include name="include/commonHeader.jsp"/>
    <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" /></a>
    <changePassword/><userLogOff html="user-login.html"/>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
        <file/>
      </td>
    </tr>
    </table>

    <!--br></br-->
    <center><codeBehindThePage allow="admin"/> </center>
    <br/><br/>
    <include name="requiredFooter"/>
<hideBlock>      
    <include name="include/commonFooter"/>
</hideBlock>      
  </div>

  <div pda="T">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
       <file/>
      </td>
    </tr>
    </table>
    <include name="requiredFooter"/>
  </div>

  </body>
</html>


