<html>
<siteTitle />
<center>

<table width="95%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr  valign="top" class="keywordsearch">
      <td valign="top" width="70%">
      <subscribeNote/>
      <img src="icons/icon.gif" width="16" height="16" align="middle" pda="T"/>
      <img src="icons/icon_divider.gif" align="middle" border="0" pda="T"/>

      <!-- Auto-generated menus -->
      <span class="xs" nonPda="T">
      <menu toolbar="toolbar1" activate="onMouseOver"/>
      <menu toolbar="transport" activate="onMouseOver"/>
      <menu toolbar="search" activate="onMouseOver"/>
      <menu toolbar="toolbar3" activate="onMouseOver"/>
      </span>
      <span class="xs" pda="T">
      <menu toolbar="toolbar1"/>
      <menu toolbar="transport"/>
      <menu toolbar="search"/>
      <menu toolbar="toolbar3"/>
      </span>
      <span class="xs">
        <print image="images/printerIcon.gif"/>
      </span>
      <pdaToPc image="images/pda.gif"/>
      
      <script language="JavaScript">
        var w = 640/3, h = 480/3, cw = w/2, ch = h/2;

        function openChatWindow() {
          if (window.screen) {
            w = Math.floor(screen.availWidth/2);
            h = Math.floor(screen.availHeight/2);
            cw = Math.floor(screen.availWidth/4);
            ch = Math.floor((screen.availHeight)/4);
          }
          var url = 'chatRoom?title=' + document.title + '&#38;referer=' + escape(window.location);
          window.open(url, 'chat','width='+w+',height='+h+',top='+ch+',left='+cw+', menubar=no, status=no, location=no, toolbar=no, scrollbars=no, resizable=yes');
        }
      </script>
      <a href="javascript://" title="Chat Room" onclick="openChatWindow();"><img src="icons/webchat.png" alt="Chat room for this page" border="0" width="20" height="20" align="middle"/></a>
      <showHideWindows/>
      </td>
      <td valign="top" align="right" width="15%"><changePassword/><userLogOff html="user-login.html"/></td>
<form name="searchForm" method="GET" action="searchResult.html" valign="middle">
      <td valign="top" align="right" width="15%"><include name="searchText.jsp"/></td>
</form>
    </tr>
    <tr> 
    <td colspan="3">
      <font color="red"><center><b><errorMessage /></b></center></font>
      <!--siteHistory /-->
      <readOtherSiteInfo />
      <tablePropertyList />
      <div align="right"><measurement/></div>
      <p/>
      <table width="100%" cellpadding="3" cellspacing="0" border="0">
      <tr class="dark">
        <td valign="top" width="5%"><edit html="editProperties.html"/></td>
        <td valign="top" width="5%"><delete/></td>
        <td valign="top" width="20%"><b><invite/></b></td>
        <td valign="top" width="20%"><b><approve itype="http://www.hudsonfog.com/voc/system/parse/WorkItem"/></b></td>
        <!--td valign="top" width="%"></td-->
        <td valign="top" width="50%"><subscribe/></td>
      </tr>
      </table>
      <reloadDocuments/>
    <br/><br/>
<newComment/>
      <comments /> 

    </td></tr>
    </table>
</td>
</tr></table>
</center>

<br/><br/><div align="left"><span class="xs"><hudsonFog />
</span></div>
</html>