<html>
<include name="include/commonHeader_ru.uhtml"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td valign="top">
<include name="include/commonLeft_ru.uhtml"/>
</td>
<td valign="top">
<form action="FormRedirect" name="tableResourceList">
  <tableResourceList />
  <input type="hidden" name="action" value="changeProperty"></input>
  <br />
  <center>
  <font face="sans-serif,arial" size="-1">
  <input type="submit" name="submit"      value="confirm"></input>
  <input type="submit" name="addResource" value="addNew"></input>
</font>
</center>
<showSetProperties/>
</form>
</td></tr></table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter.uhtml"/>
</html>
