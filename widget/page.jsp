<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>
  <!--table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
    <td><mobileDashboard/></td>
    </tr>
  </table-->
  <tablePropertyList/>
  <siteResourceList/>
  <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
  <include name="requiredFooter.jsp"/>
  </body>
</html>


