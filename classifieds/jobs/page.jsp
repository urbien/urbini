<html>
  <include name="commonHead.jsp" />

  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">
  <link href="images/styles/common.css"     type="text/css" rel="stylesheet" />
  <include name="classifieds/jobs/jobsHeader.jsp"/>
	<!-- MENU -->

   <table class="tabs" id="menu" cellspacing="0" cellpadding="0" border="0" align="center">
	   <tr>
	     <td>
		     <table border="0" cellpadding="0" cellspacing="0" align="center">
			     <tr>
				     <td><menu toolbar="resourceOperations" activate="onMouseOver" /></td>
		         <td class="oneTab" id="1fade">
		           <table border="0" cellspacing="0" cellpadding="0" align="center" height="33">
		             <tr>
		             <td class="left" id="1"> </td>
		             <td class="middle" id="2">
		                <a href="classifieds/jobs/"><img src="icons/homePage.gif" width="16" height="16" border="0" align="absmiddle" /> Home </a>
		             </td>
		             <td class="right" id="3"> </td>
		            </tr>
		          </table>
		         </td>
 				     <td><menu toolbar="recruiting"         activate="onMouseOver" /></td>
	 			     <td><menu toolbar="helpdesk"           activate="onMouseOver" allow="admin" /></td>
				     <td><menu toolbar="search"             activate="onMouseOver"/></td>
		 		     <td><menu toolbar="toolbar2"           activate="onMouseOver"/></td>
				     <td><menu toolbar="support"            activate="onMouseOver" allow="admin"/></td>
				     <!--td><menu toolbar="personalization"    activate="onMouseOver"/></td-->
				     <!--td><menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/></td-->
  				   <td><print image="icons/printerIcon.gif"/></td>
					   <td><saveInExcel allow="owner" image="images/excel.gif"/></td>
					   <td><pdaToPc image="icons/pda.gif"/></td>
					   <!--td><listGrid/></td-->
				     <td><showHideWindows/></td>
		 	     </tr>
  	     </table>
	     </td>
	     <!--td valign="bottom" align="right" width="100">
	       <include name="searchText.jsp"/>
	     </td-->
	   </tr>
   </table>

    <table class="null19" border="0" cellpadding="0" cellspacing="0">
      <tbody>
        <tr class="null22">
          <td>&#160;</td>

          <td class="null21"><nobr><img src="images/jobs/template/pixel.gif" alt="" class="null20" border="0" vspace="12" /></nobr></td>

          <td>&#160;</td>
        </tr>
      </tbody>
    </table>

  <div nonPda="T">
    <include name="requiredHeader.jsp"/>
    <include name="${type}_top.jsp"/>          <!-- this jsp will be included in ResourceList page only-->
    <include name="${type}_details_top.jsp"/>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
        <div id="corePageContent"> <file/> </div>
      </td>
      <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
      <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    </tr>
    </table>

    <include name="classifieds/jobs/jobsFooter.jsp" />
    <include name="requiredFooter.jsp"/>
  </div>

  </body>
</html>


