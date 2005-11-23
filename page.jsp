<html>
  <head>
    <include name="commonHead.jsp" />
  </head>
  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="include/commonHeader.jsp"/>
<hideBlock>
    <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" /></a>
    <changePassword/><userLogOff html="user-login.html"/><registerNewUser/>
</hideBlock>
<menuBar>
<table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
  <tr valign="top">
  <td valign="top">
   <table cellspacing="0" cellpadding="0" border="0" class="tabs" align="center">
   <tr>
    <td>
      <table cellpadding="0" cellspacing="0">
      <tr>
        <td NOWRAP="y"><menu toolbar="file" activate="onMouseOver"/></td>
		    <!--include name="${package}_menu.jsp"/-->
		    <td NOWRAP="y"><menu toolbar="toolbar1"            /></td>
		    <td NOWRAP="y"><menu toolbar="trades"              /></td>
		    <td NOWRAP="y"><menu toolbar="scheduling"          /></td>
		    <td NOWRAP="y"><menu toolbar="products"            /></td>
		    <td NOWRAP="y"><menu toolbar="crm"                 /></td>
		    <td NOWRAP="y"><menu toolbar="projectManagement"   /></td>
		    <td NOWRAP="y"><menu toolbar="realEstate"          /></td>
		    <td NOWRAP="y"><menu toolbar="helpdesk"           allow="admin" /></td>
		    <td NOWRAP="y"><menu toolbar="transport"           /></td>
		    <td NOWRAP="y"><menu toolbar="search"              /></td>
		    <td NOWRAP="y"><menu toolbar="toolbar2"            /></td>
		    <td NOWRAP="y"><menu toolbar="personalization"     /></td>
		    <td NOWRAP="y"><menu toolbar="calendarAndChart"   itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem,http://www.hudsonfog.com/voc/model/company/Contact" /></td>
		    <td NOWRAP="y"><print image="icons/printerIcon.gif"/></td>
		    <td NOWRAP="y"><saveInExcel allow="owner" image="images/excel.gif"/></td>
		    <td NOWRAP="y"><pdaToPc image="icons/pda.gif"      /></td>
		    <td NOWRAP="y"><listGrid                           /></td>
		    <td NOWRAP="y"><showHideWindows                    /></td>
	    </tr>
	    </table>
    </td>
    <td valign="middle" align="right" width="100">
      <include name="searchText.jsp"/>
    </td>
    <td width="1"><img src="images/toolbar_bg2.gif" border="0" width="1" height="23"/></td>
   </tr></table></td>
  </tr>
  <tr><td class="line" height="40" valign="middle"><!--resourceTypeLabel/--></td></tr>
  <tr><td colspan="2" align="middle"><alphabeticIndex/></td></tr>
</table>
</menuBar>
<hideBlock>
    <table width="100%" border="0" cellspacing="0" cellpadding="3">
    <tr>
      <td valign="top">
        <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
        <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
      </td>
    </tr>
    </table>
</hideBlock>
    <filter/>
    <table width="100%" border="0" cellspacing="0" cellpadding="3">
    <tr>
<hideBlock>
      <include name="${type}_left.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_left.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
</hideBlock>
      <td valign="top">
        <div id="corePageContent"> <file/> </div>
      </td>
<hideBlock>
      <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
</hideBlock>
    </tr>
    </table>

<hideBlock>
    <br></br>
    <center><codeBehindThePage allow="admin"/> </center>
    <br/><br/>
</hideBlock>
    <include name="requiredFooter.jsp"/>
<hideBlock>
    <include name="include/commonFooter"/>
    <chatAutoStart/>
</hideBlock>
  </div>

  <div pda="T">
    <include name="requiredHeader.jsp"/>
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
       <file/>
      </td>
    </tr>
    </table>
    <include name="requiredFooter.jsp"/>
  </div>

  </body>
</html>


