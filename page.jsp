<html>
  <include name="commonHead.jsp" />
  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="include/commonHeader.jsp"/>
<hideBlock>
    <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" /></a>
    <changePassword/><userLogOff html="user-login.html"/><registerNewUser/>
</hideBlock>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top">
  <td valign="top" width="100%">
   <table width="100%" cellspacing="0" cellpadding="0" border="0">
   <tr style="background-image: url('images/toolbar_bg.gif')" NOWRAP="y">
    <td width="1"><img src="images/toolbar_bg2.gif" border="0" width="1" height="23"/></td>
    <td  height="23" style="PADDING-RIGHT: 8px; PADDING-LEFT: 8px; FONT-WEIGHT: bold">
      <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td>
		    <menu toolbar="resourceOperations" activate="onMouseOver"/>
		    <include name="${package}_menu.jsp"/>
		    <menu toolbar="trades"            activate="onMouseOver"/>
		    <menu toolbar="crm"               activate="onMouseOver"/>
		    <menu toolbar="projectManagement" activate="onMouseOver"/>
		    <menu toolbar="realEstate"        activate="onMouseOver"/>
		    <menu toolbar="helpdesk"          activate="onMouseOver" allow="admin" />
		    <menu toolbar="transport"         activate="onMouseOver"/>
		    <menu toolbar="search"            activate="onMouseOver"/>
		    <menu toolbar="toolbar2"          activate="onMouseOver"/>
		    <menu toolbar="support"           activate="onMouseOver" allow="admin"/>
		    <menu toolbar="personalization"   activate="onMouseOver"/>
		    <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/>
		    <print image="icons/printerIcon.gif"/>
		    <saveInExcel allow="owner" image="images/excel.gif"/>
		    <pdaToPc image="icons/pda.gif"/>
		    <listGrid/>
		    <showHideWindows/>
	    </td>
	    </tr></table>
    </td>
    <td valign="middle" align="right" width="100">
      <include name="searchText.jsp"/>
    </td>
    <td width="1"><img src="images/toolbar_bg2.gif" border="0" width="1" height="23"/></td>
   </tr></table></td>
  </tr>
  <tr><td colspan="2" align="middle"><alphabeticIndex/></td></tr>
</table>

    <table width="100%" border="0" cellspacing="0" cellpadding="3">
    <tr>
      <td valign="top">
        <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
        <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
      </td>
    </tr>
    </table>
    <table width="100%" border="0" cellspacing="0" cellpadding="3">
    <tr>
      <td valign="top">
        <div id="corePageContent"> <file/> </div>
      </td>
      <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    </tr>
    </table>

    <br></br>
<hideBlock>
    <center><codeBehindThePage allow="admin"/> </center>
</hideBlock>
    <br/><br/>
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


