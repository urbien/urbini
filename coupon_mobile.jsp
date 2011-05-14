<div>
<table width="100%" class="obval_item mobile">

<tr valign="top">
	
<td id="coupon">
	<h2><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2>
	<div id="remaining_time_container">
     <div class="countdown_container">
         <where value="getTimeLeft() &lt; 86400  &amp;&amp; getTimeLeft() &gt; 0"> 
           <img src="images/obval/countdown.png" />
         </where>
         <where value="getTimeLeft() &gt; 86400"> 
           <img src="images/obval/countdown1.png" />
         </where>
         <where value="getTimeLeft() &gt; 0">
           <ul id="counter"><li class="countdown_label"><text text="Time Left To Buy"/></li><li class="timeLeft"><property name="timeLeftToBuy" noIcon="y"/></li></ul>
         </where>
         <where value="getTimeLeft() &lt;= 0">
           <ul id="counter"><li class="off_label"><text text="The deal is off"/>!</li></ul>
         </where>
       </div>
    </div>
	
		<table>
			<tr>
    <td class="photos"> <!--  id="everyscape"  -->
     <ul>
       <li><property name="featured" noIcon="y" /><!-- image --></li>
     </ul>
    </td>
    
		 <td id="deal_discount">
       <dl>
         <dt><text text="Value"/></dt>
         <dd><property name="dealValue" noIcon="y"/></dd>
       </dl>
       <dl>
         <dt><text text="Discount"/></dt>
         <dd><property name="discount" noIcon="y" /></dd>
       </dl>
       <dl>
         <dt><text text="You Save" /></dt>
         <dd><property name="dealDiscount" noIcon="y"/></dd>
       </dl>
     </td>
		 </tr>
		 </table>
		
		 <div id="number_sold_container">
       <where value="couponBuysQuantity &gt; 0">
          <text text="Bought"/>:&#160; 
					<span class="number"><property name="couponBuysQuantity" noIcon="y" /></span>&#160;
			 </where>
       <where value="couponsLeftToBuy == tippingPoint ">
         <text text="Be the first to buy"/>
       </where>
       <where value="couponsLeftToBuy &gt; 0">
         <span class="remaining">
           <text text="Short of"/>:&#160;
	         <property name="couponsLeftToBuy" noIcon="y" />
         </span>
       </where>
       <where value="couponsLeftToBuy &lt;= 0  &amp;&amp;  couponBuysQuantity &gt; 0  &amp;&amp;  getTimeLeft() &gt; 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
         <div class="join">
           <text text="Join us" />
         </div>
       </where>
     </div>

     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <where value="getTimeLeft() &gt; 0">
           <div><a id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
         </where>
         <where value="getTimeLeft() == null">
           <div style="text-decoration:line-through;color:red;"><a id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
         </where>
       </div>
     </div>
		
		<br/>
		<div class="highlights">
      <h3 class="csp_33"><text text="Highlights"/></h3>
      <ul>
         <li><property name="description" noIcon="y"/></li>
      </ul>
    </div><!-- highlights --> 
		<br />
		<div class="fine_print">
      <h3 class="csp_33"><text text="Fine print"/></h3>
      <ul>
        <li><property name="conditions" noIcon="y"/></li>
      </ul>
			
      <br/>
			
      <where value="redemptionLocationCount > 0">
      <ul>
        <li><h3><property name="redemptionLocation" br="y"/></h3></li>
      </ul>
      </where>
    </div><!-- fine print -->
		
</td>

</tr>
</table>
	
</div>



