<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr style="background:#f0f9e7">
    <td align="right"><pagingResources /></td>
    <td><mobileDashboard/></td>
    </tr>
  </table>
  <siteResourceList/>
  <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
  <include name="requiredFooter.jsp"/>
  </body>
</html>


