<div style="padding: 10px">
  <table width="100%">
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
  <tr>
    <td width="1%">&#160;</td>
    <td>       
    <text text="Your payment completed successfully for" /> <couponBuyList />. 
      <br/>
      <text text="Payment completed" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.paymentConfirmationTime" />.
      <claimCouponLink /><br/><br/>
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.coupon.bigFeatured" frame="y"/>
      <br/>
      <where value="forum.gifteeEmail == null">
        <center><giftIfOverLimit /></center>
      </where>
      <!--insertJoke variation="You're mouse is dangerously low on clicks, click something before it's too late!" /-->
      <br /><br />
    </td>
  </tr>
  </where>
  <where value="forum.gifteeEmail == null">
  <tr>
    <td width="1%" style="text-align:center"><giftThisCoupon /></td>
    <td width="99%"><insertJoke variation="Feeling generous? Give your coupon to someone (else)! Somewhere in this email is a poorly veiled opportunity to bribe your boss." /></td>
  </tr>
  </where>
  <tr>
    <td width="1%" style="text-align:center"><like value="Like" forum="coupon" /></td>
    <td width="99%"><insertJoke variation="Like this coupon? We can't hear you...click louder." /></td>
  </tr>
  <tr>
    <td width="1%" style="text-align:center"><newComment onlyIcon="y" forum="coupon"/></td>
    <td width="99%"><insertJoke variation="We're listening for once. Speak into your keyboard (supported on Windows, Mac, Ubuntu and weak minds). Now click." /></td>
  </tr>
  <tr>
    <td width="1%" style="text-align:center"><localLink href="/l.html?&amp;-max=y&amp;-b=35796"><localImage src="icons/give-me-more.png" /></localLink></td>
    <td width="99%"><insertJoke variation="Please sir, can I have some more?" /></td>
  </tr>
    <showIntent forum="coupon" />
 </table>
        
  <br/><br/>
</div>