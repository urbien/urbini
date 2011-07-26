<div>
<text text="Your payment completed successfully for" /> <property name="forum" href="y" noIcon="y"/> 
<br/>
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <text text="Payment completed" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.paymentConfirmationTime" />
      <claimCouponLink />
      <br/><br/>
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.featured" />
      <br /><br />
      <insertJoke variation="You're mouse is dangerously low on clicks, click something before it's too late!" />
      <br /><br />
      <table width="100%" cellpadding="5">       
        <where value="gifteeEmail == null">
          <tr>
            <td width="1%" style="text-align:center"><giftThisCoupon /></td>
            <td width="99%"><text text="Feeling generous? Give your coupon to someone (else)! Somewhere in this email is a poorly veiled opportunity to bribe your boss." /></td>
          </tr>
        </where>
        <tr>
      <!--like value="Like" type="Obval" /-->
          <td width="1%" style="text-align:center"><like value="Like" type="forum" /></td>
          <td width="99%"><text text="Like this coupon? We can't hear you...click louder." /></td>
        </tr>
        <tr>
          <td width="1%" style="text-align:center"><newComment onlyIcon="y" forum="coupon"/></td>
          <td width="99%"><text text="We're listening for once. Speak into your keyboard (supported on Windows, Mac, Ubuntu and weak minds). Now click." /></td>
        </tr>
        <showIntent />
      </table>
    </where>  
    <br/><br/>
</div>