<div>
    <text text="Your payment failed to complete for" /> <property name="forum" href="y" noIcon="y"/>
    <br/><br />
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.thumb" />
    </where>  
    <where value="forum.paymentMethod.potentialProblems != null">
      <br/><br />
      <text text="If you attempted to make a purchase but had trouble, please try again but make sure that:" />
      <br/><br />
      <property name="(http://www.hudsonfog.com/voc/aspects/commerce/ElectronicTransaction)forum.paymentMethod.potentialProblems" />
    </where>  
    <where value="forum.paymentMethod.potentialProblems == null">
      <text text="Please check with your payment service." />
      <br />
    </where>  
    <br />
    <supportLink />
    <br /><br />
		<newComment/>
</div>