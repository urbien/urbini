<div align="center">
<font color="red"><b><errorMessage /></b></font>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top" width="95%">
<center>
<table width="98%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
  <td valign="top" width="100%" class="keywordsearch">
   <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="90%">
    <menu toolbar="toolbar1"  activate="onMouseOver"/>
    <menu toolbar="transport" activate="onMouseOver"/>
    <menu toolbar="search"    activate="onMouseOver"/>
    <menu toolbar="toolbar2"  activate="onMouseOver"/>
    <menu toolbar="toolbar3"  activate="onMouseOver"/>
    <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/recurrence/ScheduledItem" activate="onMouseOver"/>
    <print image="images/printerIcon.gif"/>
    <saveInExcel allow="owner" image="images/excel.gif"/>
    <pdaToPc image="images/pda.gif"/>
    <showHideWindows/>
    </td>
    <!--td valign="top" align="right" width="20%"><changePassword/><userLogOff html="user-login.html"/>&#160;</td-->
    <form name="searchForm" method="GET" action="searchResult.html" valign="middle">
      <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
    </form>
    </tr></table></td>
  </tr>
</table></center></td></tr></table>
<br/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top" width="95%">
     <!--div align="right"><span class="xs"><language display="horizontal"/></span></div-->
     <!--menu toolbar="toolbar1"  activate="onMouseOver"/>
     <menu toolbar="search"    activate="onMouseOver"/>
     <menu toolbar="toolbar2"  activate="onMouseOver"/-->
     <!--menu toolbar="toolbar3" exclude="Support" activate="onMouseOver"/-->

     <!--center><b><font color="red"><errorMessage /></font></b></center-->
     <form id="filter" name="tablePropertyList" method="post" >
       <tablePropertyList action="mkResource"/>
       <input type="hidden" name="returnHtml" value="list.html"/>
       <input type="hidden" name="html" value="mkResource.html"/>
       <div align="right"><span class="xs"><measurement/></span></div>
       <input type="hidden" name="action" value="mkResource"></input>
       <br />
       <center>
         <input type="submit" name="submit" value="  Submit  "></input>
         &#160;&#160;
         <input type="submit" name="cancel" value="  Cancel  "></input>
       </center>
       <showSetProperties/>
     </form>
   </td>
   </tr>
</table>
</div>
