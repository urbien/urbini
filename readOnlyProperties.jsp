<html>
<siteTitle />
<include name="include/commonHeader"/>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="90%" />
  </colgroup>
<tr>
  <td width="10%"></td>
  <td width="90%"></td>
</tr>
<tr>
  <td valign="top">
    <include name="include/commonLeft"/>
    <include name="commonLeft.jsp"/>
  </td>
  <td width="90%" valign="top">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top" width="80%" class="topBar"><span class="xs"><language/>|<print image="images/printerIcon.gif"/></span></td>
      <td valign="top" align="right" width="20%" class="topBar"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr> 
    <td colspan="2">
    <form name="tablePropertyList" action="FormRedirect">
      <!--siteHistory /-->
      <tablePropertyList />
      <readOnlySiteInfo />
      <div align="right"><measurement/></div>
      <p/>
      <edit html="editProperties.html"/>
      <showSetProperties />
    </form>
    </td></tr>
    </table>
</td>
</tr></table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter"/>
</html>