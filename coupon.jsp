<div id="main" class="clearfix">
  <div id="content">
    <div class="deals hproduct ">
       <div class="deal clearfix">
         <h2 class="fn control_title"><property name="title" noIcon="y" /></h2>
         <div class="primary">
           <div id="price_tag">
             <div id="price_tag_inner">
               <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
               <a id="buy_btn" href="mkresource?type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;customer=-$me&amp;coupon=-$this">Buy</a>
             </div>
           </div>
           <div id="deal_discount" class="clearfix">
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
           <div id="for_a_friend">Buy it for a friend!</div>
           <div id="remaining_time_container">
             <div class="countdown_container clearfix">
               <img src="images/obval/hourglass.gif" alt="Hourglass"/>
               <ul id="counter"><li class="countdown_label">Time Left To Buy</li><li><property name="timeLeftToBuy" noIcon="y"/></li></ul>
             </div>
           </div>
           <div id="number_sold_container" data-periodical_ajax_updater="data-periodical_ajax_updater" data-path="/deals/elthos-spa/deal_status.json" data-json_key="number_sold_container" data-interval="300" style="">
             <where value="couponsLeftToBuy &gt; 0 &amp;&amp;  couponBuysCount &gt; 0">
               <table class="status">
               <tbody><tr class="sum"><td class="deal_left"><span class="number"><property name="couponBuysCount" noIcon="y" /></span></td><td class="deal_right">bought</td></tr>
               </tbody></table>
             </where>
             <where value="couponsLeftToBuy == tippingPoint ">
               <table class="status"><tr>
               <td colspan="2" id="first">
               <text text="Be first one to buy"/>
               </td></tr></table>
             </where>
             <where value="couponsLeftToBuy &gt; 0 ">
               <table class="status">
               <tbody><tr class="remaining">
               <td colspan="2" class="full">
               <property name="couponsLeftToBuy" noIcon="y" />&#160;
               <text text="more needed to get the deal"/>
               </td></tr>
               </tbody></table>
             </where>
             <where value="couponsLeftToBuy &lt;= 0 &amp;&amp;  couponBuysCount &gt; 0">
               <div class="tipped_check_mark">
                 <span><img width="27" height="28" title="" src="images/obval/check_mark.png" class="ib" alt=""/><text text="The deal is on!"/></span>
               </div>
               <div class="tipped_at"></div>
               <p class="tipping"><span class="number"><property name="tippedAt" noIcon="y"/></span> bought</p>
               <p class="tipping"></p>
             </where>
           </div>
             <div><like value="Like"/>&#160;<like value="DontLike"/></div>
           <div class="optimizer_test_share_links_v2">
             <div class="variant_2">
               <div class="sharing">
                 <p class="share_label">Share:</p>
                 <div class="share">
                   <ul class="share_links clearfix">
                     <li class="twitter_share" title="Share with twitter.">Tweet!</li>
                     <li class="email_share" title="Share with email.">Email!</li>
                     <li class="facebook_like" title="Like it!"></li>
                   </ul>
                 </div>
               </div>
            </div>
          </div>
        </div>
        <div class="secondary">
          <div id="everyscape" class="photos">
            <ul>
              <li><property name="image" noIcon="y" /><!-- image --></li>
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
    </div>
  </div>
</div>



