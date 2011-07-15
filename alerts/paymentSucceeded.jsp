<div>
<text text="Your payment completed successfully for" /> <property name="forum" href="y" noIcon="y"/> 
<br/>
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <text text="Payment completed" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.paymentConfirmationTime" />
      <where value="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.isGuestBuy">
        <text text="To claim the coupon you bought, register by clicking the link below:" />
        <localLink href="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.successUrl" />
      </where>  
    </where>  
<br/><br/>
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.thumb" />
    </where>  
    <br/><br/>
		<newComment/>
</div>