<div id="obval_item">
   <h2 class="fn control_title"><property name="title" noIcon="y" /></h2>
   <div class="left">
     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <div><a id="-inner" class="coupon_buy button" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
       </div>
     </div>
     <div id="deal_discount">
       <dl>
         <dt><text text="Value"/></dt>
         <dd><property name="dealValue" noIcon="y"/></dd>
       </dl>
       <dl>
         <dt><text text="Discount"/></dt>
         <dd><property name="discount" noIcon="y" />%</dd>
       </dl>
       <dl>
         <dt><text text="You Save" /></dt>
         <dd><property name="dealDiscount" noIcon="y"/></dd>
       </dl>
     </div>
     <!-- div id="for_a_friend">Buy it for a friend!</div -->
     <div id="like"><like value="Like"/><where value="commentsCount &gt; 0"><br/><property name="comments" noIcon="y"/></where></div>
     <div id="remaining_time_container">
       <div class="countdown_container">
         <where value="timeLeftToBuy &lt; 86400"> 
           <img src="images/obval/countdown.png" />
         </where>
         <where value="timeLeftToBuy &gt; 86400"> 
           <img src="images/obval/countdown1.png" />
         </where>
         <ul id="counter"><li class="countdown_label"><text text="Time Left To Buy"/></li><li><property name="timeLeftToBuy" noIcon="y"/></li></ul>
       </div>
     </div>
     <div id="number_sold_container" data-periodical_ajax_updater="data-periodical_ajax_updater" data-path="/deals/elthos-spa/deal_status.json" data-json_key="number_sold_container" data-interval="300" style="">
       <where value="couponBuysQuantity &gt; 0">
					<span class="number"><property name="couponBuysQuantity" noIcon="y" /></span>
					bought
			 </where>
       <where value="couponsLeftToBuy == tippingPoint ">
         <text text="Be first one to buy"/>
       </where>
       <where value="couponsLeftToBuy &gt; 0 ">
         <div class="remaining">
	         <property name="couponsLeftToBuy" noIcon="y" />&#160;
     	    <text text="more needed to get the deal"/>
         </div>
       </where>
       <where value="couponsLeftToBuy &lt;= 0 &amp;&amp;  couponBuysQuantity &gt; 0">
         <div class="tipped_check_mark">
           <span><img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on!"/></span>
         </div>
         <div class="tipped_at"><span class="number"><text text="Tipped at"/> <property name="tippedAt" noIcon="y"/></span>
         <text text="with" /> <span class="number"><property name="tippingPoint" noIcon="y"/></span> bought</div>
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
     <div>
      <ul>
      	<li><property name="vendor" noIcon="y"></property></li>
     	</ul>
     </div>
    <div class="fine_print">
      <h3><text text="Fine print"/></h3>
      <ul>
        <li><property name="conditions" noIcon="y"/></li>
      </ul>
    </div><!-- fine print -->
    <div class="highlights">
      <h3><text text="Highlights"/></h3>
      <ul>
         <li><property name="description" noIcon="y"/></li>
      </ul>
    </div>
  </div>
</div>



