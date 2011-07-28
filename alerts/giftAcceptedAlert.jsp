<div>
    <where value="forum.giftTo != null">
      <where value="forum.giftTo.firstName != null">
        <text text="You sent a gift to:" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.giftTo.firstName" href="y" noIcon="y"/>&#160;
        <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.giftTo.lastName" href="y" noIcon="y"/> 
      </where>
      <where value="forum.giftTo.firstName == null">
        <text text="You sent a gift to:" /> <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.giftTo.email" href="y" noIcon="y"/> 
      </where>
    </where>
  
    <br/><br/>    
    <text text="The gift has been received and accepted. We're sure some thanks were involved." /> 
    <br/><br/>    
    <property name="forum" href="y" noIcon="y"/> 
    <br/><br/>
    <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.thumb" />
</div>