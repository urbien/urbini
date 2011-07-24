<div id="redeem" align="center">
  <errorMessage/>
  
  <br /><br />
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="redeem">
    <tr>
      <td>
        <redeemedCouponBuy />
      </td>
    </tr>
    <where value="getRequest().getParameter('suggester') == null || getRequest().getParameter('suggestedItem') != null">
      <tr>
        <td style="text-align:center">
          <localImage reqParam="suggestedItem" /><br /><br />
        </td>
      </tr>
      <tr>
        <td align="center" style="background-color:#BBBBBB">
          <text text="Suggest to a friend" />
        </td>
      </tr>
      <tr>
        <td align="center">
          <form id="suggestForm" name="suggestForm" action="social/suggest" method="POST" autocomplete="off">
            <table border="0" cellpadding="3" cellspacing="0" cols="2" width="100%">
              <tr>
                <td width="40%" class="nowrap" align="right"><text text="Your friend's email"/></td>
                <td>
                  <input type="Text" class="input" id="email" name="email" size="20" maxlength="50"/>
                </td>
                <td>
                  <input type="hidden" class="input" id="suggester" name="suggester"/>
                </td>
                <td>
                  <input type="hidden" class="input" id="suggestedItem" name="suggestedItem"/>
                </td>
                <td>
                  <input type="hidden" class="input" id="sig" name="sig"/>
                </td>
                <td valign="center">
                  <input type="submit" value="Suggest!" name="suggestButton"/>
                </td>
              </tr>
            </table>
          </form>
        </td>
      </tr>
    </where>
  </table>

    <script type="text/javascript" language="JavaScript">
<![CDATA[   
  function setHiddenFields() {
    var suggester = getUrlParam(window.location.href, "suggester");
    var suggestedItem = getUrlParam(window.location.href, "suggestedItem");
    var sig = getUrlParam(window.location.href, "sig");
    document.getElementById("suggester").value = decodeURIComponent(suggester);
    document.getElementById("suggestedItem").value = decodeURIComponent(suggestedItem);
    document.getElementById("sig").value = decodeURIComponent(sig);
  }
  setTimeout(setHiddenFields, 50);


  function focus() {
    var f = document.forms['suggestForm'];
    if (f) {
      var u = f.elements['email'];
      if (u && u.type && u.type != 'hidden')
         try {
         u.focus();} catch (e) { }
    }
    else {
      // wait for the form ready
      setTimeout(focus, 50);
    }
    
    return true;
  }
  setTimeout(focus, 50);
]]>       
    </script>
</div>