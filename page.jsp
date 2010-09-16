<html>
  <head>
    <include name="commonHead.jsp" />
  </head>
  <body id="body">

  <div class="abc">
    <include name="requiredHeader.jsp"/>
    <getResource/>
    <div id="mainskin" class="blue">
    <include name="menu.jsp"/>
    <div hide="y">
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr class="abc">
        <td valign="top" align="center">
          <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
          <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
        </td>
      </tr>
      </table>
    </div>
    <!--filter/-->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr class="abc">
      <div hide="y">
        <rightPanelPropertySheet id="fts_filter" ifParameter="-q,-cat"/>
        <!--include name="${type}_left.jsp"/-->         <!-- this jsp will be included in ResourceList page only-->
        <!--include name="${type}_details_left.jsp"/--> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
      </div>
      <td valign="top" width="100%">
        <div id="corePageContent"> <file/></div><!-- core page content -->
      </td>
      <div hide="y">
        <!--include name="${type}_right.jsp"/-->         <!-- this jsp will be included in ResourceList page only-->
        <!--include name="${type}_details_right.jsp"/--> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
      </div>
    </tr>
    </table>
    </div><!-- main skin -->
    <div hide="y">
      <codeBehindThePage showDialog="y"/>
    </div>
    <include name="requiredFooter.jsp"/>
    <div hide="y">
      <include name="include/commonFooter"/>
      <chatAutoStart/>
    </div>
  </div><!-- abc -->

  </body>
</html>


