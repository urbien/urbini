<html>
<include name="include/commonHeader.html"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td valign="top" width="10%">
<include name="include/commonLeft.html"/>
</td>
<td valign="top" width="90%">
<form name="tablePropertyList" method="post" action="FormRedirect">
   <div align="right"><span class="xs"><language/></span></div>
   <tablePropertyList action="mkResource"/>
   <input type="hidden" name="returnHtml" value="list.html"/>
   <input type="hidden" name="html" value="mkResource.html"/>
   <div align="right"><span class="xs"><measurement/></span></div>
   <input type="hidden" name="action" value="mkResource"></input>
   <br />
  <center>
    <input type="submit" name="saveAndCancel" value="Save"></input>
    <input type="submit" name="saveAndAdd"    value="Save and Add new resource"></input>
    <input type="submit" name="cancel"        value="Cancel"></input>
  </center>
  <showSetProperties/>
</form>
</td></tr></table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter.html"/>
</html>
