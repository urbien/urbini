<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr valign="top">
      <td width="100%">
        <form action="list.html" name="siteResourceList">
          <div align="left"><backLink /></div>
          <table width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td width="20%" valign="top"><folderTreeControl/></td>
            <td width="80%" valign="top"><siteResourceList /></td>
          </tr>
          </table>
          <div align="right"><measurement/></div>
          <createResources/>
        </form>
        <br/><pieChart/>
        <script language="JavaScript">
          var horizontalFilter_FIELDS = new Array();
					function disableSubmitButtonH(form) {
					  if (document.all || document.getElementById) {
            form.submit.disabled = true;
            form.submit.value = 'Please wait';
            form.submit.style.cursor = 'wait';
            form.clear_.style.visibility = 'hidden';
          }
				}
        </script>
        <form name="horizontalFilter" id="filter" method="POST">
          <br/>
          <horizontalFilter />
        </form>
      </td>
      <td width="10%" id="rightPanelPropertySheet" valign="top" align="left">
        <br/>
       <include name="commonFilter.jsp" />
       <!--menu toolbar="filterLocal" type="onpage" title="false"/-->
      </td>
      </tr>
    </table>
  </td>
</tr>
</table>
<br/>
<br/>
</div>

