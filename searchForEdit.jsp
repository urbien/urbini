<html>
<include name="include/commonHeader.html"/>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr><td valign="top">
<include name="include/commonLeft.html"/>
</td>
<td valign="top">
<form name="searchPropertyList" method="POST" action="FormRedirect">
  <searchPropertyList />
  <br></br>
  <center>
  <input type="submit" name="submit" value="  Search  "></input>  
  </center>
  <input type="hidden" name="action" value="searchDatabaseForEdit"></input>
  <br></br>
  <showSetProperties />
</form>
</td></tr></table>

<br></br>
<div align="left"><span class="xs"><hudsonFog /></span></div>
<include name="include/commonFooter.html"/>
</html>
