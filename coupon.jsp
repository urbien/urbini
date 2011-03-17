<div id="obval_item">
   <h2 class="fn control_title"><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2>
   <div class="left">
     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <where value="timeLeftToBuy &gt; 0">
           <div><a id="-inner" class="coupon_buy button" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
         </where>
         <where value="timeLeftToBuy == null">
           <div style="text-decoration:line-through;color:red;"><a id="-inner" class="coupon_buy button" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
         </where>
       </div>
     </div>
     <div id="deal_discount">
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
     </div>
     <!-- div id="for_a_friend">Buy it for a friend!</div -->
     <div id="likeAndComment"><like value="Like"/></div>
     <div id="remaining_time_container">
       <div class="countdown_container">
         <where value="timeLeftToBuy &lt; 86400  &amp;&amp; timeLeftToBuy &gt; 0"> 
           <img src="images/obval/countdown.png" />
         </where>
         <where value="timeLeftToBuy &gt; 86400"> 
           <img src="images/obval/countdown1.png" />
         </where>
         <where value="timeLeftToBuy &gt; 0">
           <ul id="counter"><li class="countdown_label"><text text="Time Left To Buy"/></li><li class="timeLeft"><property name="timeLeftToBuy" noIcon="y"/></li></ul>
         </where>
         <where value="timeLeftToBuy &lt;= 0">
           <ul id="counter"><li class="off_label"><text text="The deal is off"/>!</li></ul>
         </where>
       </div>
     </div>
     <div id="number_sold_container">
       <where value="couponBuysQuantity &gt; 0">
          <text text="Bought"/>:&#160; 
					<span class="number"><property name="couponBuysQuantity" noIcon="y" /></span>&#160;
			 </where>
       <where value="couponsLeftToBuy == tippingPoint ">
         <text text="Be first one to buy"/>
       </where>
       <where value="couponsLeftToBuy &gt; 0">
         <div class="remaining">
           <text text="Short of"/>:&#160;
	         <property name="couponsLeftToBuy" noIcon="y" />
         </div>
       </where>
       <where value="couponsLeftToBuy &lt;= 0  &amp;&amp;  couponBuysQuantity &gt; 0  &amp;&amp;  timeLeftToBuy &gt; 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
         <div class="join">
           <text text="Join us" />
           <!--text text="Tipped when"/> 
           <property name="tippedAt" noIcon="y"/> <text text="with" / > 
           <property name="tippingPoint" noIcon="y"/> bought -->
         </div>
       </where>
     </div>
	<!--	 
     <div class="optimizer_test_share_links_v2">
       <div class="variant_2">
         <div class="sharing">
           <p class="share_label">Share:</p>
           <div class="share">
             <ul class="share_links">
               <li class="twitter_share" title="Share with twitter.">Tweet!</li>
               <li class="email_share" title="Share with email.">Email!</li>
               <li class="facebook_like" title="Like it!"></li>
             </ul>
           </div>
         </div>
      </div>
    </div>
  -->
	</div>
  <div class="right">
    <div id="everyscape" class="photos">
     <ul>
       <li><property name="image" noIcon="y" /><!-- image --></li>
     </ul>
    </div>
    <div class="fine_print">
      <h3 class="csp_33"><text text="Fine print"/></h3>
      <ul>
        <li><property name="conditions" noIcon="y"/></li>
      </ul>
      <br/>
      <where value="redemptionLocationCount > 0">
      <!-- h3><text text="Available locations"/></h3 -->
      <!--siteResourceList uri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/RedemptionLocation&amp;coupon_select=-$this&amp;coupon_verified=y&amp;-suppressHeader=y&amp;-gridCols=vendor&amp;-grid=y&amp;-inRowW=3"/ -->
      <ul>
        <li><h3><property name="redemptionLocation" br="y"/></h3></li>
      </ul>
      </where>
    </div><!-- fine print -->
    <div class="highlights">
      <h3 class="csp_33"><text text="Highlights"/></h3>
      <ul>
         <li><property name="description" noIcon="y"/></li>
      </ul>
    </div><!-- highlights -->
  </div>
	
	<script type="text/javascript" language="JavaScript">
		<![CDATA[
			function likeCallback() {
				incrementOnCouponPage("like");
			}
			function commentCallback() {
				incrementOnCouponPage("comments");
			}
			function incrementOnCouponPage(id) {
				var div = document.getElementById(id);
				anchor = div.getElementsByTagName("a")[0];
				var textNode = anchor.childNodes[0];
				textNode.nodeValue = parseInt(textNode.nodeValue) + 1 + " ";
			}
		]]>	  		
	</script>
	
</div>



