<html>
  <include name="commonHead.jsp" />

  <body id="body" text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">

  <include name="classifieds/jobs/jobsHeader.jsp"/>
	<!-- MENU -->
   <table id="menu" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
	   <tr NOWRAP="y">
	     <td  valign="middle">
		     <table border="0" cellpadding="0" cellspacing="0" align="center">
			     <tr><td valign="middle">
				     <menu toolbar="resourceOperations" activate="onMouseOver"/>
 				     <menu toolbar="recruiting"         activate="onMouseOver"/>
	 			     <menu toolbar="helpdesk"           activate="onMouseOver" allow="admin" />
				     <menu toolbar="search"             activate="onMouseOver"/>
		 		     <menu toolbar="toolbar2"           activate="onMouseOver"/>
				     <menu toolbar="support"            activate="onMouseOver" allow="admin"/>
				     <menu toolbar="personalization"    activate="onMouseOver"/>
				     <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/>
  				   <print image="icons/printerIcon.gif"/>
					   <saveInExcel allow="owner" image="images/excel.gif"/>
					   <pdaToPc image="icons/pda.gif"/>
					   <listGrid/>
				     <showHideWindows/>
				   </td>
		 	     </tr>
  	     </table>
	     </td>
	     <td valign="bottom" align="right" width="100">
	       <include name="searchText.jsp"/>
	     </td>
	   </tr>
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


