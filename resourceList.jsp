<html>
<include name="include/commonHeader.html"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td valign="top" width="10%">
<include name="include/commonLeft.html"/>
</td>
<td valign="top" width="90%">
<form action="FormRedirect" name="tableResourceList" method="POST">
  <tableResourceList />
  <input type="hidden" name="action" value="changeProperty"></input>
  <br />
  <center>
  <font face="sans-serif,arial" size="-1">
  <input type="submit" name="submit"          value="Confirm"></input>
  <input type="submit" name="addResource" value="Add new resource"></input>
</font>
</center>
<showSetProperties/>
</form>
</td></tr></table>
<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter.html"/>
</html>
