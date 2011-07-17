<div>
<text text="Your payment completed successfully for" /> <property name="forum" href="y" noIcon="y"/> 
<br/>
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <text text="Payment completed" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.paymentConfirmationTime" />
      <claimCouponLink />
      <br/><br/>
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.thumb" />
    </where>  
    <br/><br/>
		<newComment/>
</div>