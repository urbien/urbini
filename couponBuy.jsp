<div style="padding:10px; background-color:#cccccc">
<style>
  @media print {
    body { color: #444444; background-color: white }
  }
  .galleryItem_css3 { margin:0px}
  .csp_33 { color:444444}
</style>
<table bgcolor="#FFFFFF" border="0" cellpadding="10" style="border:2px dashed">
  <tr height="1%"><td colspan="5"></td></tr>
  <tr>
    <td width="5%"></td>
    <td width="40%" style="vertical-align:top"><h1><hostSignature /></h1><h2><property name="coupon.vendor.name" noIcon="y"/> </h2>
    <h3><property name="coupon.title" noIcon="y"/></h3></td>
    <td width="5%"></td>
    <td width="45%" style="vertical-align:top">
      <div style="display:block; vertical-align:top; width:100%">
        <table width="100%">
          <tr>
            <td style="vertical-align:top; align:left; width:99%"><div style="height:17px"></div> <!--- to align with qr image, since qr image comes with a whitespace border -->
              <where value="giftTo == null">
                <property name="customer.mediumImage" frame="y" noIcon="y" /><font style="font-size:24px"><property name="customer" noIcon="y" /></font>
              </where>
              <where value="giftTo == null &amp;&amp; gifteeEmail != null">
                <br />(<text text="Gifted but not yet accepted" />)
              </where>
              <where value="giftTo != null">
                <where value="giftTo.getUri() == getContact()">
                  <property name="giftTo.thumb" frame="y" noIcon="y" /><font style="font-size:24px"><property name="giftTo" noIcon="y" /></font>
                </where>
              </where>
            </td>
            <td style="vertical-align:top; align:right; width:1%">
              <couponBuyQRCode />
            </td>
          </tr>
        </table>
      </div>
    </td>
    <td align="right" valign="top">
    </td>
  </tr>
  <tr>
    <td></td>
    <td rowspan="2" valign="top"><property frame="y" name="coupon.bigFeatured" /><h2><property name="dealPrice" noIcon="y" /></h2>
    <where value="coupon.couponType == null || coupon.couponType == 'Standard'"> <text text="No extra payment to vendor is required"/> </where>
    </td>
    <td></td>
    <td>
        <div style="background-color:#CCCCCC;padding: 10px 10px 10px 10px">
          <where value="cancelled"><font size="+1" color="#ef6f16"><b><text text="This coupon has been canceled" /></b></font></where>
          <where value="!cancelled">
            <where value="paymentStatus == 'Success'">
              <font size="+1" color="#FFFFFF"><text text="Coupon #" />:&#160;<b>
              <where value="redeemed">
                <text text="REDEEMED" />
              </where>
              <where value="!redeemed">
                <where value="gifteeEmail == null &amp;&amp; giftTo == null">                 <!-- if coupon hasn't been gifted -->
                  <where value="mustBeGifted">
                    <editMe type="http://www.hudsonfog.com/voc/commerce/coupon/GiftYourCoupon" linkText="Gift me!" />
                  </where>
                  <where value="!mustBeGifted">
                    <property name="couponID" />&#45;<property name="couponSecret" />
                  </where>
                </where>
                <where value="gifteeEmail != null">                           <!-- if coupon has been gifted but not delivered yet -->
                  <where value="giftTo == null || gifteeEmail != giftTo.email">
                    <where value="giftTo == null || giftTo.getUri() == getContact()">
                      <text text="Gifted to" /> <property name="gifteeEmail" /><br />
                      <text text="If this is incorrect, please" />&#160;<editMe type="http://www.hudsonfog.com/voc/commerce/coupon/GiftYourCoupon" linkText="regift" /><br />
                      <text text="Correct?" />&#160;<confirmGiftTransfer />
                    </where>
                    <where value="giftTo != null &amp;&amp; giftTo.getUri() != getContact()">
                      <text text="Gifted" />
                    </where>
                  </where>
                </where>
                <where value="gifteeEmail == null &amp;&amp; giftTo != null">               <!-- if coupon has been gifted and delivered -->
                  <where value="giftTo.getUri() != getContact() &amp;&amp; giftFrom.getUri() != getContact()">
                    <text text="Gifted" />
                  </where>
                  <where value="giftTo.getUri() == getContact() || giftFrom.getUri() == getContact()">
                    <where value="mustBeGifted">
                      <where value="giftTo.getUri() == getContact()">
                        <editMe linkText="Gift me!" />
                      </where>
                      <where value="giftTo.getUri() != getContact()">
                        <text text="Gifted" />
                      </where>
                    </where>
                    <where value="!mustBeGifted">
                      <property name="couponID" />&#45;<property name="couponSecret" />
                    </where>
                  </where>
                </where>
              </where>
              </b></font>
            </where>
          <where value="paymentStatus == 'Abandoned'"><font size="+1" color="#ef6f16"><b><text text="You abandoned this transaction half-way" /></b></font></where>
          <where value="paymentStatus == 'Pending'"><font size="+1" color="#ef6f16"><b><text text="This coupon is still waiting for payment" /></b></font></where>
          <where value="paymentStatus == 'Failure'"><font size="+1" color="#ef6f16"><b><text text="Payment Failed" /></b></font></where>
          </where>        
        </div>
        <br />
        <div align="left">
          <table width="100%">
            <tr>
              <td width="50%" style="align:left">
                <where value="giftTo == null || gifteeEmail != null || getContact().getUri() == giftTo">
                  <div class="button" style="width:80%"><editMe linkText="Gift it"/></div>
                </where>
              </td>
              <td width="50%" style="align:right">
                <a href="#" class="button noprint" style="width:80%;align:right" onclick="window.print();return false;"><text text="Print" /></a>
              </td>
            </tr>
          </table>
        </div>
        
        <where value="paymentStatus != 'Success' &amp;&amp; paymentTutorial != null">
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
          <br />
          <where value="redeemFrom != null &amp;&amp; redeemTo != null">
            <text text="This coupon is valid from #### to ####" params="redeemFrom,redeemTo" />
          </where>
          <where value="redeemFrom == null">
            <text text="This coupon can be redeemed as soon as the deal tips" /> 
          </where>
          <!--where value="redeemFrom != null">
            <text text="This coupon is valid from" />&#160;<property name="coupon.redeemFrom" noIcon="y"/>
          </where>
          <br /><br />
          <text text="This coupon is valid until" />&#160;<property name="coupon.redeemBy" noIcon="y"/--> 
        </where>
    </td>
    <td>
    </td>
    <td>
    <where value="coupon.redemptionLocationsCount != null &amp;&amp; coupon.redemptionLocationsCount > 1">
      <couponBuyRedemptionLocation />
      <br /><br />
    </where>
    <mapMaker width="400" height="400" />
    <br /><br />
    </td>
    <td></td>
  </tr>
</table>
</div>