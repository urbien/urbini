<html>
<include name="include/commonHeader_ru.uhtml"/>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <colgroup>
    <col width="10%" /> 
    <col width="80%" />
    <col width="10%" />
  </colgroup>
<tr>
  <td width="10%"></td>
  <td width="80%"></td>
  <td width="10%"></td>
</tr>
<tr>
  <td colspan="2"><span class="xs"><language/>|<print image="images/printerIcon.gif" /></span></td>
  <td align="right"><userLogOff html="user-login.html"/></td>
</tr>
<tr><td valign="top">
<include name="include/commonLeft_ru.uhtml"/>
</td><td valign="top" align="left">
<form name="tablePropertyList" action="FormRedirect">
  <siteHistory />
  <!--div align="right"><language/><print image="images/printerIcon.gif" /></div-->
  <tablePropertyList />
  <readOnlySiteInfo />
  <div align="right"><measurement/></div>
  <p/>
  <edit html="editProperties_ru.html"/>
  <showSetProperties />
</form>
</td></tr>
</table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter_ru.uhtml"/>
</html>