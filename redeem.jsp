<div id="redeem" align="center">
  <errorMessage/>
  
  <br /><br />
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="redeem">
    <tr>
      <td>
        <redeemedCouponBuy />
      </td>
    </tr>
    <!--where value="getContact() != null &amp;&amp; getContact().vendor != null"-->
      <where value="getRequest().getParameter('cbUri') == null || getRequest().getParameter('couponId') != null">
        <tr>
          <td align="center" style="background-color:#BBBBBB">
            <text text="Redeem a coupon" />
          </td>
        </tr>
        <tr>
          <td align="center">
            <form id="redeemForm" name="redeemCBform" action="redeemCouponBuy" method="POST" autocomplete="off">
              <table border="0" cellpadding="3" cellspacing="0" cols="2" width="100%">
                <tr>
                  <td width="40%" class="nowrap" align="right"><text text="Coupon Secret:"/></td>
                  <td>
                    <input type="Text" class="input" id="secret" name="couponSecret" size="20" maxlength="50"/>
                  </td>
                  <td>
                    <couponUriInputField />
                    <!--input type="hidden" class="input" id="couponUri" name="coupon" size="20" maxlength="50"/-->
                  </td>
                  <td valign="center">
                    <input type="submit" value="Redeem!" name="redeemButton"/>
                  </td>
                </tr>
              </table>
            </form>
          </td>
        </tr>
      </where>
    <!--/where-->
  </table>

    <script type="text/javascript" language="JavaScript">
<![CDATA[   
/*  function setCouponUri() {
    var couponUri = getUrlParam(window.location.href, "coupon");
    document.getElementById("couponUri").value = decodeURIComponent(couponUri);
  }
  setTimeout(setCouponUri, 50);
*/

  function focusRedeem() {
    var f = document.forms['redeemForm'];
    if (f) {
      var u = f.elements['couponSecret'];
      if (u && u.type && u.type != 'hidden')
         try {
         u.focus();} catch (e) { }
    }
    else {
      // wait for the form ready
      setTimeout(focusRedeem, 50);
    }
    
    return true;
  }
  setTimeout(focusRedeem, 50);
]]>       
    </script>
</div>