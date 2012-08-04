<div>
  <errorMessage />
  <!-- START CloudSponge -->  
  <!-- Include these scripts to import address books with CloudSponge -->
  <script type="text/javascript" src="https://api.cloudsponge.com/address_books.js"></script>

  <h2 style="margin-top:60px; margin-left:20px; margin-bottom:25px">Invite your friends</h2>
  <!--p>MANUAL</p>
  <div id="emailsList"></div>
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=yahoo', '', 'width=900,height=600,resizable,scrollbars')">Import Yahoo Contacts</a>
  <br />
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=gmail', '', 'width=900,height=600,resizable,scrollbars')">Import GMail Contacts</a>
  <br />
  <a href="javascript:window.open('http://mark.obval.com/urbien/social/cloudsponge?service=windowslive', '', 'width=900,height=600,resizable,scrollbars')">Import WindowsLive Contacts</a-->

  <!-- Any link with a class="cs_import" will start the import process -->
  <!--p>VIA WIDGET</p>
  <a class="cs_import" id="cloudspongeImport">Add from Address Book</a-->

  <script type="text/javascript" charset="utf-8">
  <![CDATA[
    var imported = false;
    var csPageOptions = {
      domain_key:"ZV2PFWE5BLX4EZQKZ4S8", 
      afterSubmitContacts : function(contacts, source, owner) {
        var json = [];
        for (var i = 0; i < contacts.length; i++) {
          var contact = contacts[i];
          json.push({first_name: contact.first_name, last_name: contact.last_name, email: contact.primaryEmail()});
        }
        
        postRequest(null, "social/importContacts", "contacts=" + encodeURIComponent(JSON.stringify(json)), null, null, null);
        imported = contacts.length > 0;
      },  
      beforeClosing : function() {
        toConsole("beforeClosing, imported = " + imported + ", redirect to: " + addOrReplaceUrlParam(window.location.href, "-info", "Your friends are on the way. Feel free to import more."));
        if (imported)
          window.location.href = addOrReplaceUrlParam(window.location.href, "-info", "We've sent invites to your selected friends and you'll see them on your profile once they join Urbien. Feel free to invite more.");
      },
    };
        
//    window.startImport = function(params) {
//      toConsole("starting import...");
//      postRequest(null, "social/cloudsponge", params, null, null, printEmails);
//    }
//    
//    window.printEmails = function(e, div, hotspot, content, url) {
//      if (content == null)
//        return;
//      
//      document.getElementById("emailsList").innerHTML = content;
//    }
  ]]>
  </script>
  
  <!--p>
    <a href="#" onClick="javascript:cloudsponge.launch('yahoo'); return false;"><img src="icons/yahoo32.png" alt="Yahoo" />Yahoo</a>
    <a href="#" onClick="javascript:cloudsponge.launch('gmail'); return false;"><img src="icons/google32.png" alt="GMail" />GMail</a>
    <a href="#" onClick="javascript:cloudsponge.launch('windowslive'); return false;"><img src="icons/msn32.png" alt="Windows Live / Hotmail / MSN" />Windows Live / Hotmail / MSN</a>
    <a href="#" onClick="javascript:cloudsponge.launch('aol'); return false;"><img src="icons/aol32.png" alt="AOL" />AOL</a>
    <a href="#" onClick="javascript:cloudsponge.launch('plaxo'); return false;"><img src="icons/plaxo32.png" alt="Plaxo" />Plaxo</a>
    <a href="#" onClick="javascript:cloudsponge.launch('addressbook'); return false;"><img src="icons/addressbook32.png" alt="Address Book" />Address Book</a>
    <a href="#" onClick="javascript:cloudsponge.launch('outlook'); return false;"><img src="icons/outlook32.png" alt="Outlook" />Outlook</a>
  </p-->
  <center>
  <table style="border-spacing:25px;">
    <tr>
    <td><a href="#" onClick="javascript:cloudsponge.launch('yahoo'); return false;"><img src="icons/yahoo128.png" alt="Yahoo" /></a></td>
    <td><a href="#" onClick="javascript:cloudsponge.launch('gmail'); return false;"><img src="icons/google128.png" alt="GMail" /></a></td>
    <td><a href="#" onClick="javascript:cloudsponge.launch('windowslive'); return false;"><img src="icons/msn128.png" alt="Windows Live / Hotmail / MSN" /></a></td>
    <td><a href="#" onClick="javascript:cloudsponge.launch('aol'); return false;"><img src="icons/aol128.png" alt="AOL" /></a></td>
    <td><a href="#" onClick="javascript:cloudsponge.launch('plaxo'); return false;"><img src="icons/plaxo128.png" alt="Plaxo" /></a></td>
    <!--td><a href="#" onClick="javascript:cloudsponge.launch('addressbook'); return false;"><img src="icons/addressbook128.png" alt="Address Book" /></a><td-->
    <td><a href="#" onClick="javascript:cloudsponge.launch('outlook'); return false;"><img src="icons/outlook128.png" alt="Outlook" /></a></td>
    </tr>
  </table>
  </center>
  <p style="text-align:right; margin-right:20px; font-size:20px"><a href="#" onClick="javascript:window.location.href=getBaseUri() + 'profile'; return false;">Continue &#187;</a></p>
</div>