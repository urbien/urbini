<div align="center">
<include name="commonHead.jsp" />
<errorMessage />
<getResource/>
<table width="100%" border="0" cellspacing="0" cellpadding="0" id="dataEntry">
  <tr>
  <td valign="top">
     <div style="display: inline;">
     <form id="filter" name="tablePropertyList" method="post" action="mkresource" autocomplete="off" style="display: inline; margin: 0;">
       <tablePropertyList/>
       <div align="right"><span class="xs"><measurement/></span></div>
       <input type="hidden" name="-$action" value="mkResource" />
       <br />
       <div style="text-align: center">
         <input type="submit" name="submit" value="  Submit  " onclick="return saveButtonClicked(event, this);" />
         <span style="width: 10px" />
         <input type="submit" name="cancel" value="  Cancel  " onclick="return saveButtonClicked(event, this);" />
       </div>
     </form>
     </div>
  </td>
  </tr>
</table>
</div>

