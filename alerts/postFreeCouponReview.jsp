<div>
  <where value="forum.coupon.rewardForCheckIn == null">
    <text text="If you want to get a leg up on the competition for free tickets for the next event, do this one minute review and earn some points."/><br /><br /> 
    <text text="NOTE: you get points whether you went to the event or not, so don't be afraid to be honest."/><br/><br/>
  </where>    
  <where value="forum.coupon.rewardForCheckIn != null">
    <text text="Earn #### #### by checking in for this deal!" params="forum.coupon.rewardForCheckIn.value,forum.coupon.rewardForCheckIn.currency" />
  </where>
    <br/><br/>
    <property name="resourceMediumImage" noIcon="y" /><br /><br />
    <br/><br/>
    <h3><text text="So fess up, did you go to this event?"/></h3><br /> 
    <!--reviewCouponLinks /-->
    <createReview text="Yes" />
  
</div>