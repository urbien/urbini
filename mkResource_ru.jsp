<html>
<include name="include/commonHeader_ru.uhtml"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td valign="top">
<include name="include/commonLeft_ru.uhtml"/>
</td>
<td valign="top">
<form name="tablePropertyList" method="post" action="FormRedirect">
  <div align="right"><span class="xs"><language/></span></div>
  <tablePropertyList action="mkResource"/>
  <input type="hidden" name="returnHtml" value="list_ru.html"/>
  <input type="hidden" name="html" value="mkResource_ru.html"/>
  <div align="right"><span class="xs"><measurement/></span></div>
  <input type="hidden" name="action" value="mkResource"></input>
  <br />
  <center>
    <input type="submit" name="saveAndCancel" value="saveAndCancel"></input>
    <input type="submit" name="saveAndAdd"    value="saveAndAdd"></input>
    <input type="submit" name="cancel"        value="cancel"></input>
  </center>
  <showSetProperties/>
</form>
</td></tr></table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter_ru.uhtml"/>
</html>
