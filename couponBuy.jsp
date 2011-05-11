<div style="padding:10px; background-color:#cccccc">
<table bgcolor="#FFFFFF" border="0" cellpadding="10" class="obval_item" style="border:2px dashed">
  <tr>
    <td width="10%"></td>
    <td width="40%"><h2><property name="coupon.vendor.name" noIcon="y"/> </h2>
    <h3><property name="coupon.title" noIcon="y"/></h3></td>
    <td width="5%"></td>
    <td width="40%"><div style="display:table-cell; vertical-align:top"><font style="font-size:24px"><property name="customer" noIcon="y" /></font><property name="customer.thumb" noIcon="y" /></div>    </td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td rowspan="2"><property name="coupon.image" /></td>
    <td></td>
    <td>
        <div style="background-color:#CCCCCC;padding: 10px 10px 10px 10px;">
        <font size="+1" color="#FFFFFF"><text text="Your coupon code is" /> &#160;<b><property name="couponID" /> &#45; <property name="couponSecret" /></b></font>
        
        <where value="quantity &gt; 1"><br><font size="+1" color="#FFFFFF"><text text="You have" />&#160;<property name="quantity" noIcon="y" />&#160;<text text="coupons" /></font></br></where>
        </div>
        <br />
      <h3 class="csp_33"><text text="How to redeem"/></h3>
        <li><text text="Print this coupon" /></li>
        <li><text text="Take this coupon with you" /></li>    </td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td valign="top">
      <h3 class="csp_33"><text text="Address"/></h3>
      <ul>
        <li><b><property name="coupon.vendor.name" noIcon="y" /></b></li>
        <li><text text="Phone" />&#160;<property name="coupon.vendor.phone" noIcon="y"/></li>
        <li><text text="Website" />&#160;<property name="coupon.vendor.website" noIcon="y"/></li>
        <where value="coupon.vendor.address1 != null"><li><text text="Address" />&#160;
        <property name="coupon.vendor.address1" noIcon="y"/></li></where>
        <where value="coupon.vendor.postalCode != null"><li><text text="Postcode" />&#160;
        <property name="coupon.vendor.postalCode" noIcon="y"/></li></where>
      </ul>    </td>
    <td></td>
  </tr>
  <tr valign="top">
    <td></td>
    <td>      <h3><text text="Fine print"/></h3>
     
        <property name="coupon.conditions" noIcon="y"/>    
        <text text="This coupon must be redeemed by" />&#160;<property name="coupon.redeemBy" noIcon="y"/>        </td>
    <td></td>
    <td><mapMaker width="300" height="300" /></td>
    <td></td>
  </tr>

</table>

</div>