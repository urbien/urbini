<div>

<table  border="0" cellpadding="10" class="obval_item">
  <tr>
    <td width="60%"><h2><property name="coupon.vendor.name" noIcon="y"/> </h2>
    <h3><property name="coupon.title" noIcon="y"/></h3></td>
    <td width="3%"></td>
    <td><h2><property name="customer" noIcon="y" /></h2><text text=" this is your coupon"/></td>
  </tr>
  <tr>
    <td colspan="3"></td>
  </tr>
  <tr>
    <td rowspan="2"><property name="coupon.featured" /></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td></td>

    <td>
        <li>Please follow these simple steps to redeem this coupon</li>
        <li>Print this coupon</li>
        <li>Your unique code is &#160;<b><property name="couponSecret" /></b></li>
        <li>Take this coupon with you to <property name="coupon.vendor.name" noIcon="y" /></li>  
        <br /> 
      <h3 class="csp_33"><text text="Address"/></h3>
      <ul>
        <li><text text="Phone" />&#160;<property name="coupon.vendor.phone" noIcon="y"/></li>
        <li><text text="Website" />&#160;<property name="coupon.vendor.website" noIcon="y"/></li>
        <where value="coupon.vendor.address1 != null"><li><text text="Address" />&#160;<property name="coupon.vendor.address1" noIcon="y"/></li></where>
        <where value="coupon.vendor.postalCode != null"><li><text text="post code" />&#160;<property name="coupon.vendor.postalCode" noIcon="y"/></li></where>
      </ul>
    </td>
  </tr>
  <tr>
    <td>	        <div class="fine_print">
      <h3><text text="Fine print"/></h3>
     
        <li><property name="coupon.conditions" noIcon="y"/></li>

        <li>This coupon must be redeemed by <property name="coupon.redeemBy" noIcon="y"/></li>
        <where value="couponSecret != null"><li><property name="couponSecret" noIcon="y"/></li></where>
      
      <br/>
   </div><!-- fine print -->
	</td>
    <td></td>
    <td><mapMaker /></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
  </tr>
  <tr>
    <td valign="top">      
     </td>
    <td></td>
    <td valign="top">
   </td>
  </tr>
  <tr>
    <td colspan="3">
		</td>
    </tr>
</table>
  
</div>