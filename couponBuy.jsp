<div style="padding:10px; background-color:#cccccc">
<table bgcolor="#FFFFFF" border="0" cellpadding="10" class="obval_item" style="border:2px dashed">
  <tr>
    <td width="10%"></td>
    <td width="40%"><h2><property name="coupon.vendor.name" noIcon="y"/> </h2>
    <h3><property name="coupon.title" noIcon="y"/></h3></td>
    <td width="5%"></td>
    <td width="40%">
    <div style="display:table-cell; vertical-align:top">
      <where value="giftTo == null">
        <property name="customer.thumb" frame="y" noIcon="y" /><font style="font-size:24px"><property name="customer" noIcon="y" /></font>
      </where>
      <where value="giftTo == null &amp;&amp; gifteeEmail != null">
        <br />(<text text="Gifted but not yet accepted" />)
      </where>
      <where value="giftTo != null">
        <property name="giftTo.thumb" frame="y" noIcon="y" /><font style="font-size:24px"><property name="giftTo" noIcon="y" /></font>
      </where>
    </div>
    </td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td rowspan="2"><property frame="y" name="coupon.featured" /></td>
    <td></td>
    <td>
        <div style="background-color:#CCCCCC;padding: 10px 10px 10px 10px;">
	        <where value="cancelled"><font size="+1" color="#ef6f16"><b><text text="This coupon has been canceled" /></b></font></where>
	        <where value="!cancelled">
						<where value="paymentStatus == 'Success'">
							<font size="+1" color="#FFFFFF"><text text="Coupon #" />:&#160;<b>
              <where value="redeemed">
                <text text="REDEEMED" />
              </where>
              <where value="!redeemed">
							  <property name="couponID" />&#45;<property name="couponSecret" />
							</where>
							</b></font>
						  <!--br/><font size="+1" color="#FFFFFF"><text text="Quantity" />:&#160;<property name="quantity" noIcon="y" /></font> &#160;<a href="#" class="button noprint" onclick="window.print();return false;"><text text="Print" /></a-->
    
						</where>
				  <where value="paymentStatus == 'Pending'"><font size="+1" color="#ef6f16"><b><text text="This coupon is still waiting for payment" /></b></font></where>
          <where value="paymentStatus == 'Failure'"><font size="+1" color="#ef6f16"><b><text text="Payment Failed" /></b></font></where>
					</where>        
	      </div>
        <br />
        <where value="paymentStatus == 'Pending' &amp;&amp; paymentTutorial != null">
            <h3 class="csp_33"><text text="How to pay"/></h3>
            <li><property name="paymentTutorial" href="y" /></li>
            <br />
        </where>
        <where value="!cancelled &amp;&amp; paymentStatus == 'Success'">
      			<h3 class="csp_33"><text text="How to redeem"/></h3>
        		<li><text text="Print this coupon" /></li>
		        <li><text text="Take this coupon with you" /></li>    
        </where>
        </td>
    <td></td>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td valign="top">
      <h3 class="csp_33"><text text="Address"/></h3>
      <ul>
        <li><b><property name="coupon.vendor.name" noIcon="y" /></b></li>
        <where value="location != null">
          <li><text text="Phone" />&#160;
            <property name="location.vendor.phone" noIcon="y"/>
          </li>
          <li><text text="Website" />&#160;<property name="coupon.(http://www.hudsonfog.com/voc/model/company/ExternalOrganization)vendor.website" href="y"/></li>
          <where value="location.vendor.address1 != null">
            <li><text text="Address" />&#160;
              <property name="location.vendor.address1" noIcon="y"/>
            </li>
          </where>
          <where value="location.vendor.postalCode != null">
            <li><text text="Postal code" />&#160;
              <property name="location.vendor.postalCode" noIcon="y"/>
            </li>
          </where>
        </where>
        <where value="location == null">
          <li><text text="Phone" />&#160;
            <property name="coupon.vendor.phone" noIcon="y"/>
          </li>
          <li><text text="Website" />&#160;
            <property name="coupon.(http://www.hudsonfog.com/voc/model/company/ExternalOrganization)vendor.website" href="y"/>
          </li>
          <where value="coupon.vendor.address1 != null">
            <li><text text="Address" />&#160;
              <property name="coupon.vendor.address1" noIcon="y"/>
            </li>
          </where>
          <where value="coupon.vendor.postalCode != null">
            <li><text text="Postal code" />&#160;
              <property name="coupon.vendor.postalCode" noIcon="y"/>
            </li>
          </where>
        </where>
      </ul>    </td>
    <td></td>
  </tr>
  <tr valign="top">
    <td></td>
    <td>      <h3><text text="Fine print"/></h3>
     
        <property name="coupon.conditions" noIcon="y"/>    
        <where value="!cancelled &amp;&amp; paymentStatus == 'Success'">
        <text text="This coupon must be redeemed by" />&#160;<property name="coupon.redeemBy" noIcon="y"/> 
        </where>
    </td>
    <td>
    </td>
    <td>
    <where value="coupon.redemptionLocationsCount != null &amp;&amp; coupon.redemptionLocationsCount > 1">
      <couponBuyRedemptionLocation />
      <br /><br />
    </where>
    <mapMaker width="300" height="300" />
    </td>
    <td></td>
  </tr>

</table>

</div>