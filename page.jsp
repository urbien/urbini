<html>
  <head>
    <include name="commonHead.jsp" />
  </head>
  <body id="body">

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="include/commonHeader.jsp"/>
<menuBar id="menuBar1">
<table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" class="toppad">
  <tr valign="top">
  <td valign="top">
   <table cellspacing="0" cellpadding="0" border="0" align="center">
   <tr>
    <td>
      <table cellpadding="0" cellspacing="0" class="tabs">
      <tr>
        <td nowrap="nowrap"><menu toolbar="file" activate="onMouseOver"/></td>
		    <!--include name="${package}_menu.jsp"/-->
		    <td nowrap="nowrap"><menu toolbar="toolbar1"            /></td>
		    <td nowrap="nowrap"><menu toolbar="trades"              /></td>
		    <td nowrap="nowrap"><menu toolbar="scheduling"          /></td>
		    <td nowrap="nowrap"><menu toolbar="products"            /></td>
		    <td nowrap="nowrap"><menu toolbar="crm"                 /></td>
		    <td nowrap="nowrap"><menu toolbar="projectManagement"   /></td>
		    <td nowrap="nowrap"><menu toolbar="realEstate"          /></td>
		    <td nowrap="nowrap"><menu toolbar="helpdesk"           allow="admin" /></td>
		    <td nowrap="nowrap"><menu toolbar="transport"           /></td>
		    <td nowrap="nowrap"><menu toolbar="search"              /></td>
		    <td nowrap="nowrap"><menu toolbar="toolbar2"            /></td>
		    <td nowrap="nowrap"><menu toolbar="personalization"     /></td>
		    <td nowrap="nowrap"><menu toolbar="calendarAndChart"   itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem,http://www.hudsonfog.com/voc/model/company/Contact" /></td>
		    <td nowrap="nowrap"><print image="icons/printerIcon.gif"/></td>
		    <td nowrap="nowrap"><saveInExcel allow="owner" image="images/excel.gif"/></td>
		    <!--td nowrap="nowrap"><pdaToPc image="icons/pda.gif"      /></td-->
		    <td nowrap="nowrap"><chat                               /></td>
		    <td nowrap="nowrap"><showHideWindows                    /></td>
	    </tr>
	    </table>
    </td>
    <td valign="middle" align="right" width="100">
      <include name="searchText.jsp"/>
    </td>
    <td valign="top" nowrap="nowrap">
      <a href="#"><IMG src="images/logo.gif" border="0" height="32" align="right" /></a>
    </td>
   </tr></table></td>
  </tr>
  <tr><td class="line" height="40" valign="middle"><resourceTypeLabel/></td></tr>
  <tr bgcolor="#F1F1F1">
  <td>
	  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
	  <tr>
	    <td class="welcome" valign="top">
	      <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a>
	      <changePassword/><userLogOff html="user-login.html"/><registerNewUser/>
	    </td>
	    <td valign="middle" nowrap="nowrap"  align="right">
	      <a href="http://universalplatform.com/home"><img src="icons/up.gif" align="absmiddle" border="0"/><span  class="poweredBy" style="padding-left: 5px">on Universal</span><span class="poweredBy-b">Platform</span></a>
	    </td>
	  </tr>
	  </table>
  </td>
  </tr>
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


