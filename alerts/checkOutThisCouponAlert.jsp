<div>
    <where value="sender != null">
      <where value="sender.firstName != null">
        <property name="sender.firstName" type="y"/> <text text="says this coupon is so you!">
      </where>
      <where value="sender.firstName == null">
        <property name="sender.email" type="y"/> <text text="says this coupon is so you!">
      </where>
    </where>
    <where value="sender == null">
      <property name="sender.email" type="y"/> <text text="says this coupon is so you!">
    </where>
    <br /><br />
    <property name="forum" type="y"/> "<property name="forum" href="y"/>"
    <br/><br />
    <couponCityScape />
    <br/><br />
    <property name="resourceMediumImage" noIcon="y" />
    <br/><br />
</div>