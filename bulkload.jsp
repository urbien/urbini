<div align="center">
<!--script language="JavaScript1.2" type="text/javascript">
  function submitForm() {
    if (uploadProject.file.value.length < 1) 
      return false; 
    if (document.all || document.getElementById) { 
      uploadProject.submit.disabled = true; 
      uploadProject.submit.value = 'Please wait'; 
      uploadProject.submit.style.cursor = 'wait'; 
    }
  }
</script-->
	<table width="100%" id="resourceList" cellpadding="0" cellspacing="0">
	<tr><td class="nobr"> 
		<form id="filter" name="bulkLoad" method="post" action="mkresource" autocomplete="off" enctype="multipart/form-data" onSubmit="submitForm()" >
      <input type="file" name="file" size="20" />&#160;<input type="submit" name="submit" value="  Upload   "/>
      <input type="hidden" name="-$action" value="bulkload" />
      <input type="hidden" name="location" value="restore" />
    </form>
  </td></tr></table>
	
</div>

