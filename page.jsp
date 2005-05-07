<html>
  <include name="commonHead.jsp" />
  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <div nonPda="T">
    <include name="include/commonHeader.jsp"/>
<hideBlock>
    <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" /></a>
    <changePassword/><userLogOff html="user-login.html"/><registerNewUser/>
</hideBlock>
    <table width="100%" border="0" cellspacing="0" cellpadding="3">
    <tr>
      <td valign="top" colspan="2">
        <include name="${type}_top.jsp"/>
        <!--table width="100%"><tr><td class="folders"><siteResourceList uri="localSearchResults.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/classifieds/jobs/Job&amp;jobCategory_groupBy=on&amp;-adTitle=Job+categories"/></td></tr></table-->
      </td>
    </tr>
    <tr>
      <td valign="top">
        <file/>
      </td>
      <td valign="top">
        <include name="${type}_right.jsp"/>
        <!--table width="100%"><tr><td class="folders"><siteResourceList uri="localSearchResults.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/classifieds/jobs/Job&amp;jobCategory_groupBy=on&amp;-adTitle=Job+categories"/></td></tr></table-->
      </td>
    </tr>
    </table>

    <br></br>
<hideBlock>
    <center><codeBehindThePage allow="admin"/> </center>
</hideBlock>
    <br/><br/>
    <include name="requiredFooter.jsp"/>
<hideBlock>
    <include name="include/commonFooter"/>
    <chatAutoStart/>
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
    <include name="requiredFooter.jsp"/>
  </div>

  </body>
</html>


