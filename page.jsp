<html>
  <head>
    <include name="commonHead.jsp" />
  </head>
  <body id="body">

  <div id="wrapper">
  <div class="abc">
    <include name="requiredHeader.jsp"/>
    <getResource/>
    <div id="mainskin" class="blue">
    <include name="menu.jsp"/>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr class="abc">
      <div hide="y">
        <rightPanelPropertySheet id="fts_filter" ifParameter="-q,-cat"/>
      </div>
      <td valign="top" width="100%">
        <div id="corePageContent"> <file/></div><!-- core page content -->
      </td>
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
  </div><!-- wrapper -->

  </body>
</html>


