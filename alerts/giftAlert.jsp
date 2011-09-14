<div>
    <text text="You got a gift:" /> "<property name="forum" href="y"/>"
    <br/><br/>
    <property name="(http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy)forum.featured" noIcon="y" />
    <br/><br/>
    <where value="resourceDescription != null">
      <property name="resourceDescription" href="y" noIcon="y" />
    </where>
    
    <where value="forum.mustBeGifted">
      <font style='color:red'>
      <where value="forum.forceRegift">
        <text text="NOTE: Whoever gave you this coupon has decreed that you must give it as a gift to someone else! Not that you needed a lesson in generosity of course." />
      </where>
      <where value="!forum.forceRegift">
        <text text="NOTE: You're over the limit for this coupon, you're going to have to gift this coupon to someone else!" />
      </where>
      </font>
      <br /><br />
    </where>
    <center><getYourGiftB /></center>
    <br /><br /><br />
    <table width="100%" cellpadding="5">       
      <tr>
        <td width="1%" style="text-align:center"><giftThisCoupon /></td>
        <td width="99%"><insertJoke variation="Feeling generous? Give your coupon to someone (else)! Somewhere in this email is a poorly veiled opportunity to bribe your boss." /></td>
      </tr>
    </table>
</div>