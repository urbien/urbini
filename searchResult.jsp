<html>
<include name="include/commonHeader" />
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="10%">
    <include name="include/commonLeft" />
  </td>
  <td width="80%" valign="top" align="middle">
    <!--fullTextSearchResult /-->
    <resourcesSearch resourcesUri = "/sql/text/search/resources"/>
    <filesSearch     filesUri     = "text/search/files" />
    <excelsSearch    excelsUri    = "text/search/excels" />
  </td>
  <td width="10%" valign="top">
    <include name="searchText.jsp" />
  </td>
</tr></table>
<br />
<include name="include/commonFooter" />
</html>
