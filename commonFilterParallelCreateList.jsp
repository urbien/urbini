<div>
<table border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td>    
      <script language="JavaScript">
        var rightPanelPropertySheet_FIELDS = new Array();
	function disableSubmitButton(form) {
	  if (document.all || document.getElementById) {
            form.submit.disabled = true; 
            form.submit.value = 'Please wait';
            form.submit.style.cursor = 'wait'; 
            form.clear.style.visibility = 'hidden'; 
          }
	}
      </script>
      <form name="rightPanelPropertySheet" method="POST" action="FormRedirect" onSubmit="disableSubmitButton(this)"><!-- onsubmit="clearUnModifiedFields(rightPanelPropertySheet_FIELDS)"-->
        <rightPanelPropertySheet />
        <input type="hidden" name="action" value="searchParallel"></input>
        <input type="hidden" name="action1" value="createResources"/>
        <input type="hidden" name="create"  value="1"/>
      </form>
    </td>
  </tr>
</table>
<div>