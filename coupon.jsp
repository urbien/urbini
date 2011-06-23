<div>
<table width="100%" class="obval_item" cellpadding="0" cellspacing="0" border="0">
<!--tr width="100%" valign="middle" height="74">
  <td colspan="2" style="border: 1px solid #d9d9d9;">
     <h2><div><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2>
  </td>
</tr-->
<tr valign="top">
<td id="coupon">
<div >
   <!--h2 class="fn control_title"><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></h2-->
   <div style="position: relative">
    <div id="everyscape" class="photo">
     <ul>
       <li><!--property name="image" frame="y" noIcon="y" / --> <slideShow/><!-- image --></li>
     </ul>
     <div id="h2"><property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where></div>
     
     <div id="deal_discount" class="${overlay}">
       <where value="couponType == null || couponType == 'Standard'">
         <!--dl>
           <dt><text text="Value"/></dt>
           <dd><property name="dealValue" noIcon="y"/></dd>
         </dl -->
       </where>
       <dl>
         <dt><text text="Discount"/></dt>
         <dd><property name="discount" noIcon="y" /></dd>
       </dl>
       <where value="couponType == null || couponType == 'Standard'">
         <dl>
           <dt><text text="You Save" /></dt>
           <dd><property name="dealDiscount" noIcon="y"/></dd>
         </dl>
       </where>
     </div>
     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <where value="isBuyable()">
           <where value="dealPrice &gt; 0">
             <div>
             	 <a max_width="500" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a>
	           </div>
           </where>
           <where value="dealPrice == 0">
             <div>
               <a max_width="500" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="FREE!"/></a>
               <!--a max_width="500" id="-inner" class="coupon_buy button_buy_gift" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;gift=true&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Gift!"/></a-->
             </div>
           </where>
         </where>
         <where value="getTime() &lt; dateFeatured || !isBuyable()">
           <where value="dealPrice &gt; 0">
             <div style="text-decoration:line-through;color:red;"><a max_width="500" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
           </where>
           <where value="dealPrice == 0">
             <div style="text-decoration:line-through;color:red;"><a max_width="500" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="FREE!"/></a></div>
           </where>
         </where>
       </div>
     </div>
     <div id="buy_to_friend">
       <a class="buy_gift" id="-inner" href="mkResource.html?-$action=mkResource&amp;gift=y&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon">
       <img src="icons/24-gift.png" width="24"/><br/>
       <where value="photo != null">
       <where value="photo.overlay != null">
         <where value="photo.overlay == 'lightTextLightBackground'">
           <span style="color: #f85400">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'lightTextDarkBackground'">
           <span style="color: #ffffff">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'darkTextDarkBackground'">
           <span style="color: #ffffff">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'darkTextLightBackground'">
           <span style="color: #ffffff">
           <text text="Gift"/>
           </span>
         </where>
       </where>
       <where value="photo.overlay == null">
         <span style="color: #ffffff">
         <text text="Gift"/>
         </span>
       </where>
       </where>
       </a>
     </div>
     <div id="remaining_time_container">
       <div class="countdown_container ${overlay}">
         <where value="getTimeLeft() &lt; 86400  &amp;&amp; getTimeLeft() &gt; 0"> 
           <img src="images/obval/countdown.png" />
         </where>
         <where value="getTimeLeft() &gt; 86400"> 
           <img src="images/obval/countdown1.png" />
         </where>
         <where value="isBuyable()">
           <ul id="counter">
             <li class="deal_titles"><text text="Time Left To Buy"/></li>
             <li class="time_left"><property name="timeLeftToBuy" noIcon="y"/></li>
           </ul>
         </where>
         <where value="!isBuyable()">
           <where value="mainCoupon.tippedAt != null &amp;&amp; dateExpired &lt; getTime()">
             <ul id="counter"><li class="time_left"><text text="The deal is over"/>!</li></ul>
           </where>
           <where value="mainCoupon.tippedAt == null &amp;&amp; dateExpired != null &amp;&amp; dateExpired &lt; getTime()">
             <ul id="counter"><li class="time_left"><text text="The deal is off"/>!</li></ul>
           </where>
           <where value="cap != null &amp;&amp; couponBuysQuantity &gt;= cap">
             <ul id="counter"><li class="time_left"><text text="Sold out"/>!</li></ul>
           </where>
           <where value="dateFeatured != null &amp;&amp; dateFeatured &gt; getTime()">
             <ul id="counter"><li class="time_left"><text text="Not yet featured"/>!</li></ul>
           </where>
         </where>
       </div>
    <where value="isBuyable()">
      <div id="number_sold_container" class="${overlay}">
       <where value="totalCouponBuysQuantity &gt; 0">
          <div class="time_left"><text text="Bought"/>:&#160; 
          <span class="number"><property name="totalCouponBuysQuantity" noIcon="y" /></span>&#160;</div>
       </where>
       <where value="dealPrice &gt; 0  &amp;&amp;  mainCoupon.tippingPoint &gt; 1 &amp;&amp;  couponsLeftToBuy == mainCoupon.tippingPoint">
         <div class="time_left">
           <text text="Be the first to buy"/>
         </div>
       </where>
       <where value="dealPrice &gt; 0  &amp;&amp;  mainCoupon.tippingPoint == 1 &amp;&amp;  couponsLeftToBuy == 1">
         <div class="time_left">
           <text text="Be the first to buy"/>
         </div>
       </where>
       <where value="couponsLeftToBuy &gt; 0  &amp;&amp; totalCouponBuysQuantity &gt; 0">
         <div class="deal_titles">
           <text text="Short of"/>:&#160;
           <property name="couponsLeftToBuy" noIcon="y" />
         </div>
       </where>
       <where value="couponsLeftToBuy &lt;= 0  &amp;&amp;  totalCouponBuysQuantity &gt; 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
       </where>
       <where value="dealPrice &lt;= 0  &amp;&amp;  couponBuysQuantity &lt; cap  &amp;&amp; couponsLeftToBuy &lt;= 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
       </where>
       <where value="dealPrice &lt;= 0  &amp;&amp;  totalCouponBuysQuantity == null">
         <div class="time_left"><text text="Be the first to try"/></div>
       </where>
     </div>
     </where>
     </div>
    </div>
    </div>
  <div id="conditions" style="padding-bottom:10px;">
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
      <where value="redemptionLocationsCount &gt; 0">
      <!--div id="locations" style="position: absolute; bottom: 100px; left: 15px;" -->
      <ul style="padding-left:5px; padding-bottom: 10px; padding-top: 5px; background: rgba(127, 127, 127, 0.1);">
        <li id="h3"><property name="redemptionLocations" labelOnly="y"/>
 
        <where value="redemptionLocationsCount &gt; 2">
          <property name="redemptionLocations" noLabel="y"/>
        </where>
        </li>
        <li><siteResourceList uri="l.html?bUri=-$this%26m_p=redemptionLocations%26b_p=coupon&amp;-list=y&amp;-limit=12&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/RedemptionLocation&amp;-suppressHeader=y&amp;-inRowW=3&amp;-titleLink=y"/></li>
      </ul>
      <!--  /div -->
      </where>
    </div><!-- fine print -->
    <div class="more_items">
    <!--h3 class="csp_33"><text text="more deals"/></h3>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape=this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;.dateExpired_From=tomorrow&amp;-inRow=1&amp;-title=Future+deals&amp;-limit=3&amp;-featured=y&amp;basedOnTemplate=null"/>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape_select=-$this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=!null&amp;dateExpired_From=tomorrow&amp;-inRow=1&amp;-title=Upcoming+deals&amp;-limit=3&amp;-featured=y&amp;basedOnTemplate=null"/ -->
    </div>
    <!-- video -->
    <div><property name="video" noIcon="y"/> </div>
  </div>
    <!--h3 class="csp_33"><text text="more deals"/></h3-->
    <siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;cityScape=this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;.dateExpired_From=tomorrow&amp;-inRowW=3&amp;-title=Future+deals&amp;-limitW=1&amp;-featured=y&amp;basedOnTemplate=null"/>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;cityScape_select=-$this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=!null&amp;dateExpired_From=tomorrow&amp;-inRowW=3&amp;-title=Upcoming+deals&amp;-limitW=1&amp;-featured=y&amp;basedOnTemplate=null"/>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;type=http://www.hudsonfog.com/voc/system/readHistory/MyTrackedRead&amp;-title=My+recently+viewed&amp;-gridCols=forResource&amp;-viewCols=forResource&amp;-limitW=1&amp;-grid=y&amp;-inRowW=5&amp;application_select=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;application_verified=y&amp;$order=dateAccessed&amp;-asc=-1"/>
  </div>
</td>

</tr>
<!--tr><td>
</td></tr-->
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



