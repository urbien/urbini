<html>
<include name="requiredHeader.jsp"/>
<include name="include/commonHeader"/>

<script language="JavaScript" src="register/hashScript.js"></script>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
<td valign="top" width="90%">

<file/>
</td></tr></table>

<br></br>
<include name="requiredFooter"/>

<script type="text/javascript" language="JavaScript">
  function focusOnUserName() {
    var f = document.loginform;
    if (f != null)
      f.j_username.focus();
    return true;
  }
  addEvent(window, 'load', function() {setTimeout(focusOnUserName, 0);}, false);
</script>

<include name="include/commonFooter"/>

</html>
