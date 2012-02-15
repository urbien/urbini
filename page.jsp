<html xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml" xmlns:lablz_china="http://mark.obval.com/obval/ns#">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# urbienne: http://ogp.me/ns/fb/urbienne#">
    <include name="commonHead.jsp" />
    <style> 
				body { 
				 text-align:center; /* for IE */
				}
				
				div#wrapper { 
				  text-align:left; /* reset text alignment */ 
				  max-width:960px; /* or a percentage, or whatever */ 
				  margin:0 auto; /* for the rest */ 
				  width: expression(document.body.clientWidth > 962? "960px" : "auto");  /* for IE */
        }
    </style>    
  </head>
  <body id="body">
  <include name="requiredHeader.jsp"/>
  <div id="wrapper">
  <div class="abc">
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

  <script type="text/javascript">
  <![CDATA[
      function repostCallback(event, div, hotspot, content, url, params, http_request) {
        toConsole('in repostCallback');
        if (content)
          printRepostOptions(content);
        else {
          toConsole('no content');
        }
      }
    ]]>       
  </script>
  
  <cityAdsPixel />
  <clickburner />
  </body>
</html>


