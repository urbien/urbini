<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top" width="90%">

    <table width="97%" align="center" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
      <td valign="top" width="80%" class="topBar">
        <span class="xs">
        <menu toolbar="toolbar1"  activate="onMouseOver"/>
        <menu toolbar="transport" activate="onMouseOver"/>
        <menu toolbar="search"    activate="onMouseOver"/>
        <menu toolbar="toolbar2"  activate="onMouseOver"/>
        <!--menu toolbar="toolbar3"  activate="onMouseOver"/-->
        <pdaToPc image="images/pda.gif"/>
        </span>
      </td>
      <td valign="top" align="right" width="20%" class="topBar"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    </table>
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td colspan="2">
     <font color="red"><center><b><errorMessage /></b></center></font>
   
    <form name="tablePropertyList" method="post" action="FormRedirect?edit=true">
      <tablePropertyList />
      <div align="right"><measurement/></div>
      <input type="hidden" name="action" value="showPropertiesForEdit"></input>
      <br></br>
      <center>
        <input type="submit" name="submit" value="Submit changes"></input>
        &#160;&#160;<input type="submit" name="cancel" value="  Cancel  "></input>
      </center>
    </form>
   </td>
   </tr>
   </table>
</td></tr></table>
<div align="left"><span class="xs"><hudsonFog /></span></div>
</div>
