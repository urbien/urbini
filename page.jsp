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
<hideBlock>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr class="abc">
      <td valign="top" align="center">
        <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
        <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
      </td>
    </tr>
    </table>
</hideBlock>
    <!--filter/-->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr class="abc">
<hideBlock>
      <rightPanelPropertySheet id="fts_filter" ifParameter="-q,-cat"/>
      <include name="${type}_left.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_left.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
</hideBlock>
      <td valign="top">
        <div id="corePageContent"> <file/></div><!-- core page content -->
      </td>
<hideBlock>
      <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
</hideBlock>
    </tr>
    </table>
    </div><!-- main skin -->
<hideBlock>
    <codeBehindThePage showDialog="y"/>
</hideBlock>
    <include name="requiredFooter.jsp"/>
<hideBlock>
    <include name="include/commonFooter"/>
    <chatAutoStart/>
</hideBlock>
  </div><!-- abc -->

  </body>
</html>


