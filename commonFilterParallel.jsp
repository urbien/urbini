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
          }
	}
      </script>
      <form name="rightPanelPropertySheet" method="POST" action="FormRedirect" onSubmit="disableSubmitButton(this)"><!-- onsubmit="clearUnModifiedFields(rightPanelPropertySheet_FIELDS)"-->
        <rightPanelPropertySheet />
        <input type="hidden" name="action" value="searchParallel"></input>
      </form>
    </td>
  </tr>
</table>
</div>