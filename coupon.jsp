<div>
<table width="100%" class="obval_item">
<tr width="100%" valign="middle" height="74">
  <td colspan="2" style="border: 1px solid #d9d9d9;">
     <h2><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2>
  </td>
</tr>
<tr valign="top">
<td id="coupon">
<div>
   <!--h2 class="fn control_title"><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2-->
   <div class="left">
     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <where value="isBuyable()">
           <where value="dealPrice &gt; 0">
             <div><a max_width="400" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
           </where>
           <where value="dealPrice == 0">
             <div><a max_width="400" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="FREE!"/></a></div>
           </where>
         </where>
         <where value="new Date().getTime() &lt; dateFeatured || !isBuyable()">
           <div style="text-decoration:line-through;color:red;"><a max_width="400" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
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
     <div id="remaining_time_container">
       <div class="countdown_container">
         <where value="getTimeLeft() &lt; 86400  &amp;&amp; getTimeLeft() &gt; 0"> 
           <img src="images/obval/countdown.png" />
         </where>
         <where value="getTimeLeft() &gt; 86400"> 
           <img src="images/obval/countdown1.png" />
         </where>
         <where value="isBuyable()">
           <ul id="counter"><li class="countdown_label"><text text="Time Left To Buy"/></li><li class="timeLeft"><property name="timeLeftToBuy" noIcon="y"/></li></ul>
         </where>
         <where value="!isBuyable()">
           <where value="tippedAt != null">
             <ul id="counter"><li class="off_label"><text text="The deal is over"/>!</li></ul>
           </where>
           <where value="tippedAt == null &amp;&amp; dateExpired != null &amp;&amp; dateExpired + 24 * 3600 * 1000 &lt; new Date().getTime()">
             <ul id="counter"><li class="off_label"><text text="The deal is off"/>!</li></ul>
           </where>
            <where value="cap != null &amp;&amp; couponBuysQuantity &gt;= cap">
             <ul id="counter"><li class="off_label"><text text="Sold out"/>!</li></ul>
           </where>
           <where value="dateFeatured != null &amp;&amp; dateFeatured &gt; new Date().getTime()">
             <ul id="counter"><li class="off_label"><text text="Not yet featured"/>!</li></ul>
           </where>
         </where>
       </div>
     </div>
     <where value="isBuyable()">
     <div id="number_sold_container">
       <where value="couponBuysQuantity &gt; 0">
          <text text="Bought"/>:&#160; 
          <span class="number"><property name="couponBuysQuantity" noIcon="y" /></span>&#160;
       </where>
       <where value="dealPrice &gt; 0  &amp;&amp;  tippingPoint &gt; 1 &amp;&amp;  couponsLeftToBuy == tippingPoint">
         <text text="Be the first to buy"/>
       </where>
       <where value="couponsLeftToBuy &gt; 0">
         <br />
         <div class="remaining">
           <text text="Short of"/>:&#160;
           <property name="couponsLeftToBuy" noIcon="y" />
         </div>
       </where>
       <where value="couponsLeftToBuy &lt;= 0  &amp;&amp;  couponBuysQuantity &gt; 0  &amp;&amp;  isBuyable()">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
         <div class="join">
           <text text="Join us" />
         </div>
       </where>
       <where value="dealPrice &lt;= 0  &amp;&amp;  couponBuysQuantity == null">
         <text text="Be the first to try"/>
       </where>
     </div>
     </where>
  </div>
  <div class="right">
    <div id="everyscape" class="photos">
     <ul>
       <li><property name="image" noIcon="y" /><!-- image --></li>
     </ul>
    </div>
    <div class="highlights">
      <h3 class="csp_33"><text text="Highlights"/></h3>
      <ul>
         <li><property name="description" noIcon="y"/></li>
      </ul>
    </div><!-- highlights -->
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
    <!-- video -->
    <div><property name="video" noIcon="y"/> </div>
  </div>
  </div>
</td>
<td valign="top">
<div class="more_items">
  <siteResourceList uri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;-inRow=1&amp;-adTitle=Future+deals&amp;-limit=3&amp;-featured=y"/>
  <siteResourceList uri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=!null&amp;dateExpired_From=tomorrow&amp;-inRow=1&amp;-adTitle=Upcoming+deals&amp;-limit=3&amp;-featured=y"/>
</div>
</td>
</tr>
</table>
  <script type="text/javascript">
  <![CDATA[
      function likeCallback(event, div, hotspot, content, url, params, http_request) {
        incrementOnCouponPage("like");
        var target = getEventTarget(event);
        var text = getTextContent(target);
        target.parentNode.appendChild(document.createTextNode(text.substr(0, text.length -1)));
        target.parentNode.removeChild(target);
        
        if (content) {
          printRepostLink(content);
        }
        else {
          toConsole('no content');
        } 

/*        if (http_request)
          repostToVK(http_request);
        else {
          toConsole('no http_request');
        } */
      }
      function commentCallback(event, div, hotspot, content, url, params, http_request) {
        toConsole('in commentCallback');
        incrementOnCouponPage("comments");
        if (content)
          printRepostLink(content);
        else {
          toConsole('no content');
        } 

/*        if (http_request)
          repostToVK(http_request);
        else {
          toConsole('no http_request');
        } */
      }
      function incrementOnCouponPage(id) {
        var div = document.getElementById(id);
        img = div.getElementsByTagName("img")[0];
        var textNode = img.previousSibling; //anchor.childNodes[0];
        var curNum = parseInt(textNode.nodeValue);
        textNode.nodeValue = (isNaN(curNum) ? 0 : curNum) + 1 + " ";
      }
    ]]>       
  </script>
  
</div>



