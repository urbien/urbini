<html>
  <include name="commonHead.jsp" />

  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <include name="classifieds/jobs/jobsHeader.jsp"/>
  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
    <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
        <div id="corePageContent"> <file/> </div>
      </td>
      <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    </tr>
    </table>

    <include name="classifieds/jobs/jobsFooter.jsp" />
    <include name="requiredFooter.jsp"/>
  </div>

  </body>
</html>


