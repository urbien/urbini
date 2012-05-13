<div>
    <where value="forum.getType() == 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
	 	  <text text="We hope you have a pleasant purchasing experience with:" />  
      <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.featured" />
      <br /><br />
      <text text="You can check the status of your transaction in 'Purchasing history'" /> <onYourProfile />
    </where>  
    <where value="forum.getType() != 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy'">
      <text text="We hope your #### went smoothly." params="forum.getDisplayName()" />
      <br /><br />
      <text text="You can check the status of your transaction in 'Deposits'" /> <onYourProfile />
    </where>  
    <br /><br />
    <supportLink />
</div>