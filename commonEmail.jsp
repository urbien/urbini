<div id="textdiv3" class="popMenu" pda="T"> 
  <div class="popMenuTitle" pda="T"> 
    <table width="320" cellpadding="2">
      <tr> 
        <td><b><font color="FFFFFF">E-mail</font></b></td>
        <td align="right"><a title="Close" href="javascript://" onClick="menuOpenClose('textdiv3')"><IMG alt="Click here to close" src="images/button_popup_close.gif" border="0"/></a></td>
      </tr>
    </table>
  </div>
  <form name="emailForm" action="page2email" method="GET">
    <table cellpadding="5">
      <tr nonPda="T"> 
        <td><b><text text="E-mail:"/></b></td>
      </tr>
      <tr> 
        <td> <table border="0" cellspacing="2" cellpadding="3">
            <tr> 
              <td bgcolor="#DCDCEB"><b>Subject:</b></td>
              <td bgcolor="#DCDCEB"><input name="subject"></input>
                </td>
            </tr>
            <tr> 
              <td bgcolor="#DCDCEB"><b>E-mail:</b></td>
              <td bgcolor="#DCDCEB"><input name="to"></input>
                </td>
            </tr>
            <tr> 
              <td bgcolor="#DCDCEB"><b>Format:</b></td>
              <td bgcolor="#DCDCEB"> <select name="rec" onchange="onRecChange()">
                  <option value="html">HTML</option>
                  <option value="xls">Excel</option>
                </select> </td>
            </tr>
          </table></td>
      </tr>
      <tr>
        <td><input type="submit" value="Send"></input>
        </td>
      </tr>
    </table>
  </form>
</div>
