<html>
  <head>
    <include name="commonHead.jsp" />
    <style> 
				body { 
				 text-align:center; /* for IE */
				}
				
				div#wrapper { 
				  text-align:left; /* reset text alignment */ 
				  max-width:1024px; /* or a percentage, or whatever */ 
				  margin:0 auto; /* for the rest */ 
				  width: expression(document.body.clientWidth > 1026? "1024px" : "auto");  /* for IE */
        }
    </style>    
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
    <include name="requiredFooter.jsp"/>
    <div hide="y">
      <include name="include/commonFooter" alt="include/commonFooter.jsp" />
      <chatAutoStart/>
    </div>
  </div><!-- abc -->
  </div><!-- wrapper -->

  </body>
</html>


