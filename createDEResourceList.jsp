<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td>
<errorMessage />
<getResource/>
<table width="100%" border="0" cellspacing="0" cellpadding="5" id="dataEntry">
  <tr>
   <td valign="top">
     <div style="display: inline;" >
     <form  id="filter" name="tablePropertyList" method="post" action="mkresource" autocomplete="off" style="display: inline; margin: 0;">
       <panelBlock on_page="y">
				 <tablePropertyList />
				 <div align="right"><span class="xs"><measurement/></span></div>
	       <input type="hidden" name="-$action" value="mkResource" />
       </panelBlock>
			 <br />

      <siteResourceList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="-create"  value="1" />
			<br />
      <center><input type="submit" name="submit" /></center>
    </form>
    </div>
  </td>
	
<!--	Touch UI: removed filter from a page.
  <td width="10%" id="rightPanelPropertySheet" valign="top" align="left">
    <br/>
    <menuBar id="menuBar1">
    <rightPanelPropertySheet />
    </menuBar>
  </td>
-->	
  </tr>
</table>
</td></tr>
</table>
<br />

</div>

