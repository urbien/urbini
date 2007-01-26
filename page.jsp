<html>
  <head>
    <include name="commonHead.jsp" />
  </head>
  <body id="body">

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="include/commonHeader.jsp"/>
<getResource/>
<menuBar id="menuBar1">
<!--div style="padding-top:10;white-space:nowrap" /-->
<table width="100%" cellspacing="0" cellpadding="0" border="0" id="mainMenu" class="toppad">
   <tr>
    <td>
        <menu toolbar="file" activate="onMouseOver"/>
		    <!--include name="${package}_menu.jsp"/-->
		    <menu toolbar="toolbar1"            />
		    <menu toolbar="trades"              />
		    <menu toolbar="scheduling"          />
		    <menu toolbar="products"            />
		    <menu toolbar="crm"                 />
		    <menu toolbar="projectManagement"   />
		    <menu toolbar="realEstate"          />
		    <menu toolbar="helpdesk"           allow="admin" />
		    <menu toolbar="transport"           />
		    <menu toolbar="search"              />
		    <menu toolbar="toolbar2"            />
		    <menu toolbar="personalization"     />
		    <menu toolbar="calendarAndChart"   itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem,http://www.hudsonfog.com/voc/model/company/Contact" />
		    <print image="icons/printerIcon.gif"/>
		    <saveInExcel allow="owner" image="images/excel.gif"/>
		    <!--pdaToPc image="icons/pda.gif"      /-->
		    <chat                               />
		    <showHideWindows                    />
        <include name="searchText.jsp"/>
        <a href="#"><logo src="images/logo.gif" /></a>
        <img allow="admin" id="menuLink_codeBehindThePage" title="View Source&lt;br&gt; This page is based solely on the declarative code that you can inspect by clicking on the links in popup" class="cursor" src="icons/codeBehindThePage.jpg" height="33" onclick="menuOnClick(event)" align="middle" />
    </td>
  </tr>
  <tr>
    <td class="line" valign="middle"><resourceTypeLabel/></td>
  </tr>
  <tr bgcolor="#F1F1F1">
    <td>
	  <table width="100%">
	  <tr>
      <td class="welcome" valign="top">
	      <a href="help.html"> <img src="icons/help.gif" title="Site Help. Describes Operations, Menus, Navigation, Search" border="0" align="absmiddle"/></a>
	      <changePassword/><userLogOff html="user-login.html"/><registerNewUser/><myProfile property="unread" />
	    </td>
	    <td valign="middle" nowrap="nowrap"  align="right">
	      <a href="http://universalplatform.com/home"><img src="icons/up.gif" align="absmiddle" border="0"/><span  class="poweredBy" style="padding-left: 5px">on Universal</span><span class="poweredBy-b">Platform</span></a>
	    </td>
	  </tr>
	  </table>
  </td>
  </tr>
  <tr>
    <td align="middle"><alphabeticIndex/></td>
  </tr>
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
    <br/><br/>
    <center><codeBehindThePage allow="admin" showDialog="y"/> </center>
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


