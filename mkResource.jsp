<div align="center">
<font color="red"><b><errorMessage /></b></font>

<!--hideBlock>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top">
<center>
<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
  <td valign="top" width="100%" class="keywordsearch">
   <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="90%">
    <include name="${package}_menu.jsp"/>
    <menu toolbar="trades"            activate="onMouseOver"/>
    <menu toolbar="crm"               activate="onMouseOver"/>
    <menu toolbar="projectManagement" activate="onMouseOver"/>
    <menu toolbar="realEstate"        activate="onMouseOver"/>
    <menu toolbar="transport"       activate="onMouseOver"/>
    <menu toolbar="search"          activate="onMouseOver"/>
    <menu toolbar="toolbar2"        activate="onMouseOver"/>
    <menu toolbar="support"         activate="onMouseOver" allow="admin"/>
    <menu toolbar="personalization" activate="onMouseOver"/>

    <pdaToPc image="icons/pda.gif"/>
  </td>
  <td valign="top" align="right" width="10%"><include name="searchText.jsp"/></td>
  </tr></table></td>
  </tr>
</table>
</center></td></tr></table>
</hideBlock-->
<br/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top">
     <form id="filter" name="tablePropertyList" method="post" >
       <tablePropertyList action="mkResource"/>
       <input type="hidden" name="returnHtml" value="list.html"/>
       <input type="hidden" name="html" value="mkResource.html"/>
       <div align="right"><span class="xs"><measurement/></span></div>
       <input type="hidden" name="-$action" value="mkResource"></input>
       <br />
       <center>
         <input type="submit" name="submit" value="  Submit  "></input>
         &#160;&#160;
         <input type="submit" name="cancel" value="  Cancel  "></input>
       </center>
     </form>
   </td>
   </tr>
</table>
</div>
