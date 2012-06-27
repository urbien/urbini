<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# urbienne: http://ogp.me/ns/fb/urbienne#">
    <include name="commonHead.jsp" />
  </head>
  <body id="body">
  <include name="requiredHeader.jsp"/>
  <div id="wrapper">
  <div class="abc">
    <contactUri />
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
  <!--script type="text/javascript" src="http://s.skimresources.com/js/27470X860433.skimlinks.js"></script-->

  <!-- START CloudSponge -->  
  <!-- Include these scripts to import address books with CloudSponge -->
  <!--script type="text/javascript" src="https://api.cloudsponge.com/address_books.js"></script-->
  <script type="text/javascript" charset="utf-8">
  <![CDATA[
    var csPageOptions = {
      domain_key:"ZV2PFWE5BLX4EZQKZ4S8", 
      afterSubmitContacts : function(contacts, source, owner) {
        var json = [];
        for (var i = 0; i < contacts.length; i++) {
          var contact = contacts[i];
          json.push({first_name: contact.first_name, last_name: contact.last_name, email: contact.primaryEmail()});
        }
        
        postRequest(null, "social/importContacts", "contacts=" + encodeURIComponent(JSON.stringify(json)), null, null, afterImport);
      },  
    };
    
    afterImport = function(response) {
      toConsole("afterImport");
      toConsole(response);
    }
  ]]>       
  </script>

  <!-- Any link with a class="cs_import" will start the import process -->
  <!--a class="cs_import">Add from Address Book</a>
  
  <div id="emailsList"></div>
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=yahoo', '', 'width=900,height=600,resizable,scrollbars')">Import Yahoo Contacts</a>
  <br />
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=gmail', '', 'width=900,height=600,resizable,scrollbars')">Import GMail Contacts</a>
  <br />
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=windowslive', '', 'width=900,height=600,resizable,scrollbars')">Import WindowsLive Contacts</a-->

  <script type="text/javascript" charset="utf-8">
  <![CDATA[
    window.startImport = function(params) {
      toConsole("starting import...");
      postRequest(null, "social/cloudsponge", params, null, null, printEmails);
    }
    
    window.printEmails = function(e, div, hotspot, content, url) {
      if (content == null)
        return;
      
      document.getElementById("emailsList").innerHTML = content;
    }
  ]]>
  </script>
  <authenticateByFacebook />
  </body>
</html>


