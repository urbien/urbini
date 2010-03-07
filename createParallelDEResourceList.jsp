<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td>
<errorMessage />
<getResource/>

    <table width="100%" cellspacing="0" cellpadding="5" border="0">
    <tr valign="top"><td width="100%">
      <form id="filter" name="tablePropertyList" method="post" action="mkresource" autocomplete="off" style="display: inline; margin: 0;">
       <panelBlock on_page="y">
         <tablePropertyList/>
         <div align="right"><span class="xs"><measurement/></span></div>
         <input type="hidden" name="-$action" value="mkResource" />
       </panelBlock>
       <br />
       
      <parallelResourceList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="-parallel" value="y" />
      <input type="hidden" name="-create"  value="1" />
      <center><input type="submit" name="submit" /></center>
    </form>
    </td>
    <td width="1%" id="rightPanelPropertySheet" valign="top" align="left">
      <menuBar id="menuBar1">
      <!--panelBlock on_page="y"-->
        <rightPanelPropertySheet />
      <!--/panelBlock-->
      </menuBar>
    </td>
  </tr>
  </table>
  </td>
</tr>
</table>
</div>
