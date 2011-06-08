<div id="redeem" align="center">
  <errorMessage/>
  
  <br /><br />
  <table border="0" cellpadding="3" cellspacing="0" cols="2" class="redeem">
    <tr>
      <td>
        <redeemedCouponBuy />
      </td>
    </tr>
    <where value="getRequest().isUserInRole('admin') || getRequest().isUserInRole('owner')">
      <where value="getRequest().getParameter('cbUri') == null || getRequest().getParameter('couponId') != null">
        <tr>
          <td align="center" style="background-color:#BBBBBB">
            <text text="Check if coupon is valid" />
          </td>
        </tr>
        <tr>
          <td align="center">
            <form id="checkIDForm" name="checkIDForm" action="redeemCouponBuy" method="POST" autocomplete="off">
              <table border="0" cellpadding="3" cellspacing="0" cols="2" width="100%">
                <tr>
                  <td width="40%" class="nowrap" align="right"><text text="Coupon ID:"/></td>
                  <td>
                      <input type="Text" class="input" name="couponId" size="20" maxlength="50"/>
                  </td>
                  <td valign="center">
                    <input type="submit" value="Check ID" name="redeemButton"/>
                  </td>
                </tr>
              </table>
            </form>
            <br />
          </td>
        </tr>
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
                      <input type="Text" class="input" name="couponSecret" size="20" maxlength="50"/>
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
    </where>
  </table>
</div>