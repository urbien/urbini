<div>
  <form name="emailForm" id="emailForm" action="page2email" method="GET">
    <table cellpadding="5">
      <tr nonPda="T"> 
        <td><b><text text="E-mail:"/></b></td>
      </tr>
      <tr> 
        <td> <table border="0" cellspacing="2" cellpadding="3">
            <tr> 
              <td bgcolor="#e3e2df" class="cswmItemSubtitle">Subject:</td>
              <td bgcolor="#e3e2df"><input name="subject" class="formMenuInput"></input>
                </td>
            </tr>
            <tr> 
              <td bgcolor="#e3e2df" class="cswmItemSubtitle">E-mail:</td>
              <td bgcolor="#e3e2df"><input name="to" class="formMenuInput"></input>
                </td>
            </tr>
            <tr id="email_formatTr" style="display:tableRow" allow="owner"> 
              <td bgcolor="#e3e2df" class="cswmItemSubtitle">Format:</td>
              <td bgcolor="#e3e2df"> 
                <select name="format" onchange="onRecChange()" class="formMenuInput">
                  <option value="html">HTML</option>
                  <option value="xls">Excel</option>
                </select>
              </td>
            </tr>
            <script language="JavaScript">
              var url = new String(window.location);
              if (url.indexOf("readOnlyProperties.html") != -1 &amp;&amp; document.getElementById("email_formatTr")) {
                document.getElementById("email_formatTr").style.display="none";
              }
            </script>
          </table></td>
      </tr>
      <tr>
        <td><input type="submit" value="Send" class="cswmItemSubtitle"></input>
            <input type="submit" value="Cancel" class="cswmItemSubtitle" onClick="menuClose2(document.getElementById('menudiv_Email')); return false"/>
        </td>
      </tr>
    </table>
  </form>
</div>