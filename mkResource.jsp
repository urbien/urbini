<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
  <td valign="top" width="95%">
     <!--div align="right"><span class="xs"><language display="horizontal"/></span></div-->
     <menu toolbar="toolbar1"  activate="onMouseOver"/>
     <menu toolbar="search"    activate="onMouseOver"/>
     <menu toolbar="toolbar2"  activate="onMouseOver"/>
     <!--menu toolbar="toolbar3" exclude="Support" activate="onMouseOver"/-->

     <center><b><font color="red"><errorMessage /></font></b></center>
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
