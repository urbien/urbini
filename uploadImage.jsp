<html>
<include name="include/commonHeader.html" />

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="20%">
    <include name="include/commonLeft.html" />
  </td>
  <td valign="top" align="middle">
    <form name="uploadImage" action="FormRedirect" method="POST" enctype="multipart/form-data">

      <center><font color="darkblue"><b>Enter file name: </b></font>
      <input type="file" name="file"></input></center>
      <br></br>
      <input type="hidden" name="action" value="upload"></input>
      <center><input type="submit" name="upload" value="Confirm upload"></input></center>
      <showSetProperties />
    </form>
  </td>
</tr></table>
<br />
<include name="include/commonFooter.html" />
</html>

</body>
</html>
