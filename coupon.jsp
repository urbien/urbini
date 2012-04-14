<div>
<table width="100%" class="obval_item" cellpadding="0" cellspacing="0" border="0">
<tr valign="top">
<td id="coupon">
<div>
   <div style="position: relative">
    <div id="everyscape" class="photo">
     <ul>
       <li><!--property name="image" frame="y" noIcon="y" / --> <slideShow/><!-- image --></li>
     </ul>
     <div id="h2">
       <property name="title" noIcon="y" /><where value="vendor != null">&#160;-&#160;<property name="vendor" noIcon="y" /></where>
       <!--a  href="about:blank" class="coupon_buy conditions button_buy" style="align:right; color:#000000" onclick="showHide('rules', event);"><text text="Details!"/></a -->
       
        <!-- div class="conditions" onclick="showHide('rules', event);"><text text="Conditions!"/></div -->
     </div>
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
       <where value="couponType == 'BuyLimitedDiscount'">
         <dl>
           <dt><text text="You Save" /></dt>
           <dd><property name="dealValue" noIcon="y"/></dd>
         </dl>
       </where>
     </div>
     <div id="price_tag">
       <div id="price_tag_inner">
         <div id="amount"><property name="dealPrice" noIcon="y" /></div>&#160;&#160;
         <where value="isBuyable()">
           <where value="affiliateUrl != null">
             <a max_width="500" full_height="705" class="coupon_buy button_buy" href="-$this.affiliateUrl"><text text="Get it on"/><span style="font-size:14px;float:left; color:#fff;margin-top:-8px;padding-left:22px;"><property name="publisher.name" /></span></a>           
           </where>
           <where value="affiliateUrl == null">
             <where value="dealPrice &gt; 0">
               <where value="couponVariantsCount &gt; 0">
                 <div>
                 	 <a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;-inner=y&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a>
    	           </div>
  	           </where>
               <where value="couponVariantsCount &lt;= 0">
                 <div>
                   <a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;-inner=y&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a>
                 </div>
               </where>
             </where>
             <where value="dealPrice == 0">
               <div>
                 <a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;-inner=y&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="FREE!"/></a>
                 <!--a max_width="500" id="-inner" class="coupon_buy button_buy_gift" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;gift=true&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Gift!"/></a-->
               </div>
             </where>
           </where>
         </where>
         <where value="getTime() &lt; dateFeatured || !isBuyable()">
           <where value="dealPrice &gt; 0">
             <where value="couponVariantsCount &gt; 0">
               <div style="text-decoration:line-through;color:red;"><a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
             </where>
             <where value="couponVariantsCount &lt;= 0">
               <div style="text-decoration:line-through;color:red;"><a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="Buy!"/></a></div>
             </where>
           </where>
           <where value="dealPrice == 0">
             <div style="text-decoration:line-through;color:red;"><a max_width="500" full_height="705" id="-inner" class="coupon_buy button_buy" href="mkResource.html?-$action=mkResource&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon"><text text="FREE!"/></a></div>
           </where>
         </where>
       </div>
			 <where value="couponVariantsCount &gt; 0">
			    <a id="-inner" class="other_variants pointer" onmousedown="onVariantsMouseDown(this);" href="l.html?-$action=searchLocal&amp;-more=y&amp;-sidebar=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;-title=Coupon+variants&amp;-gridCols=title,dealPrice,discount&amp;-viewCols=title,dealPrice,discount&amp;-limitW=5&amp;-grid=y&amp;-inRowW=1&amp;basedOnTemplate_select=-$this&amp;basedOnTemplate_verified=y&amp;cancelled_select=false&amp;cancelled_verified=y&amp;-featured=y&amp;dateExpired_From=tomorrow"><text text="more" /></a>
			 </where>
     </div>
     <div id="buy_to_friend">
       &#160;<like value="Like"/><!--vkontakteLikeWidget / -->
       <div class="lc" style="display:inline"><a class="lc" id="-inner" href="mkResource.html?-$action=mkResource&amp;gift=y&amp;displayProps=y&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy&amp;bUri=-$this%26m_p=couponBuys%26b_p=coupon">
       <img src="icons/gift.png"/>&#160;
       <where value="photo != null">
       <where value="photo.overlay != null">
         <where value="photo.overlay == 'lightTextLightBackground'">
           <span style="color: #f85400">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'lightTextDarkBackground'">
           <span style="color: #808080">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'darkTextDarkBackground'">
           <span style="color: #808080">
           <text text="Gift"/>
           </span>
         </where>
         <where value="photo.overlay == 'darkTextLightBackground'">
           <span style="color: #808080">
           <text text="Gift"/>
           </span>
         </where>
       </where>
       <where value="photo.overlay == null">
         <span style="color: #808080">
         <text text="Gift"/>
         </span>
       </where>
       </where>
       </a></div>
       <!--a  href="about:blank" class="coupon_buy conditions button_buy" onclick="showHide('rules', event);"><text text="Details!"/></a -->
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
           <where value="cap != null &amp;&amp; couponBuysCount &gt;= cap">
             <ul id="counter"><li class="time_left"><text text="Sold out"/>!</li></ul>
           </where>
           <where value="dateFeatured != null &amp;&amp; dateFeatured &gt; getTime()">
             <ul id="counter"><li class="time_left"><text text="Not yet featured"/>!</li></ul>
           </where>
         </where>
       </div>
    <where value="isBuyable()">
      <div id="number_sold_container" class="${overlay}">
       <where value="totalCouponBuysCount &gt; 0">
          <div class="time_left"><text text="Bought"/>:&#160; 
          <span class="number"><property name="totalCouponBuysCount" noIcon="y" /></span>&#160;</div>
       </where>
       <!--where value="dealPrice &gt; 0  &amp;&amp;  mainCoupon.tippingPoint &gt;= 1 &amp;&amp;  couponsLeftToBuy == mainCoupon.tippingPoint">
         <div class="time_left">
           <text text="Be the first to buy"/>
         </div>
       </where-->
       <where value="dealPrice &gt; 0  &amp;&amp;  totalCouponBuysCount == 0">
         <div class="time_left">
           <text text="Be the first to buy"/>
         </div>
       </where>
       <where value="couponsLeftToBuy &gt; 0  &amp;&amp; totalCouponBuysCount &gt; 0">
         <div class="deal_titles">
           <text text="Short of"/>:&#160;
           <property name="couponsLeftToBuy" noIcon="y" />
         </div>
       </where>
       <where value="couponsLeftToBuy &lt;= 0  &amp;&amp;  totalCouponBuysCount &gt; 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
       </where>
       <!--where value="dealPrice &lt;= 0  &amp;&amp;  couponBuysQuantity &lt; cap  &amp;&amp; couponsLeftToBuy &lt;= 0">
         <div class="dealOn">
           <img width="27" height="27" src="images/obval/check_mark.png" alt=""/><text text="The deal is on"/>!
         </div>
       </where-->
       <!--where value="cap != null &amp;&amp; availableToBuy != null &amp;&amp; availableToBuy &lt;= maxPerPerson"><br />
         <ul id="counter"><li class="time_left"><span style="color: #f85400"><text text="Hurry! Only"/> <property name="availableToBuy" /> <text text="left!"/></span></li></ul>
       </where-->
       <where value="dealPrice &lt;= 0  &amp;&amp;  totalCouponBuysCount == null">
         <div class="time_left"><text text="Be the first to try"/></div>
       </where>
     </div>
     </where>
     </div>
    </div>
    </div>
  <div id="conditions"><!-- style="padding-bottom:10px;" -->
   <div class="darkTextVeryLightBackground">
   <!--div id="likeAndComment">
     <table cellpadding="5" width="100%">
     <tr>
       <td width="40%"><like value="Like"/></td>
       <td width="10%"><vkontakteLikeWidget /></td>
       <td width="30%">
         <span class="nowrap"><text text="Act to" /></span> <a href="v.html?uri=sql/www.hudsonfog.com/voc/media/publishing/Article%3FarticleId%3D32155" style="color: #F55200;"><text text="gain reputation" /></a>!
       </td>
        <td align="right" id="details"></td>
       
       </tr>
     </table>
   </div-->
   </div>
   <br/>
   <div id="rules"><!-- class="hdn" -->
    <div class="highlights">
      <h3 class="csp_33"><text text="Highlights"/></h3>
      <div class="displayIn4lines hideImg">
         <property name="description" noIcon="y"/>
         <br/>
         <tagCategories/>
         <br/><br/>
      <where value="couponVariantsCount &gt; 0">
      <ul style="padding-left:5px; padding-bottom: 10px; padding-top: 5px; background: rgba(127, 127, 127, 0.1);">
        <li id="h3">
          <property name="couponVariants" labelOnly="y"/>
          <!--property name="couponVariants" noLabel="y"/ -->
        </li>
        <li>
          <siteResourceList uri="l.html?bUri=-$this%26m_p%3dcouponVariants%26b_p%3dbasedOnTemplate&amp;-list=y&amp;-viewCols=shortTitle,dealPrice,discount&amp;-limit=12&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;-inRowW=1&amp;-titleLink=y&amp;canceled_select=false&amp;canceled_verified=y&amp;dateExpired_From=tomorrow&amp;-big=n"/>
        </li>
      </ul>
      </where>
			</div>
    </div><!-- highlights -->
    <div class="fine_print">
      <a name="fp"></a>
      <h3 class="csp_33"><text text="Fine print"/></h3>
      <div class="displayIn4lines hideImg">
      <ul>
        <li><property name="conditions" noIcon="y"/></li>
        <li><text text="Must be redeemed by"/>&#160;<property name="redeemBy" noIcon="y"/></li>
      </ul>
      <where value="redemptionLocationsCount &gt; 0">
      <!--div id="locations" style="position: absolute; bottom: 100px; left: 15px;" -->
      <ul style="padding-left:5px; padding-bottom: 10px; padding-top: 5px; background: rgba(127, 127, 127, 0.1);">
        <li id="h3"><property name="redemptionLocations" labelOnly="y"/>
 
        <where value="redemptionLocationsCount &gt; 2">
          <property name="redemptionLocations" noLabel="y"/>
        </where>
        </li>
        <li><siteResourceList uri="l.html?bUri=-$this%26m_p=redemptionLocations%26b_p=coupon&amp;-list=y&amp;-viewCols=address&amp;-limit=12&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/RedemptionLocation&amp;-suppressHeader=y&amp;-inRowW=3&amp;-titleLink=y&amp;canceled=false"/></li>
      </ul>
      <!--  /div -->
      </where>
			</div>
    </div><!-- fine print -->
		</div>
		<!-- button to extend details -->
		<center style="clear: both; height: auto !important; height: 1px;">
			<a id="more_details_btn" class="button hdn" style="width: 97%; margin-top: -4px; padding: 0;" href="javascript: ;" onclick="ShowHideCouponDetailes.onclick(this);">
				<span><text text="Show More" />&#9660;</span><span style="display: none;"><text text="Show Less" />&#9650;</span>
			</a>
		</center>
		<br/>
		
    <!--div class="more_items">
    <h3 class="csp_33"><text text="more deals"/></h3>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape=this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;.dateExpired_From=tomorrow&amp;-inRow=1&amp;-title=Future+deals&amp;-limit=3&amp;-featured=y&amp;-big=n&amp;basedOnTemplate=null"/>
    <siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape_select=-$this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=!null&amp;dateExpired_From=tomorrow&amp;-inRow=1&amp;-title=Upcoming+deals&amp;-limit=3&amp;-big=n&amp;-featured=y&amp;basedOnTemplate=null"/>
    </div -->
    <!-- video -->
    <div><property name="video" noIcon="y"/> </div>
  </div>
	<!--
		<div id="docked_bar">
	-->	
    <!--h3 class="csp_33"><text text="more deals"/></h3-->
    <!--siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;event=-$this&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/CheckIn&amp;-inRowW=6&amp;-title=Check+Ins&amp;-limitW=1&amp;basedOnTemplate=null"/ -->
    <siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape=-$this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;.dateExpired_From=tomorrow&amp;-inRowW=3&amp;-title=Future+deals&amp;-limitW=1&amp;-featured=y&amp;-big=n&amp;basedOnTemplate=null"/>
  <relatedResources uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;-limitW=20&amp;-inRowW=20&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateExpired_From=tomorrow&amp;dateFeatured=!null&amp;-featured=y&amp;basedOnTemplate=null&amp;-big=n&amp;-grid=y;&amp;-nab=n" orUri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;cityScape=-$this.cityScape&amp;cityScape.isNational=true" />
  <siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;type=http://www.hudsonfog.com/voc/system/readHistory/MyTrackedRead&amp;-title=My+recently+viewed&amp;-gridCols=forResource&amp;-viewCols=forResource&amp;-limitW=1&amp;-grid=y&amp;-inRowW=5&amp;application_select=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;application_verified=y&amp;$order=dateAccessed&amp;-asc=-1&amp;-big=n&amp;-nab=n"/>

 		<!--
		</div>
  	-->
	</div>
</td>

</tr>
</table>
    <!--siteResourceList uri="l.html?-$action=searchLocal&amp;cityScape=-$this.cityScape&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateFeatured=null&amp;.dateExpired_From=tomorrow&amp;-inRowW=3&amp;-title=Future+deals&amp;-limitW=1&amp;-featured=y&amp;-big=n&amp;basedOnTemplate=null"/>
	<relatedResources uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;-limitW=20&amp;-inRowW=20&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;dateExpired_From=tomorrow&amp;dateFeatured=!null&amp;-featured=y&amp;basedOnTemplate=null&amp;-big=n&amp;-grid=y;&amp;-nab=n&amp;-title=Related" orUri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;cityScape=-$this.cityScape&amp;cityScape.isNational=true" />
	<siteResourceList uri="l.html?-$action=searchLocal&amp;-sidebar=y&amp;type=http://www.hudsonfog.com/voc/system/readHistory/MyTrackedRead&amp;-title=My+recently+viewed&amp;-gridCols=forResource&amp;-viewCols=forResource&amp;-limitW=1&amp;-grid=y&amp;-inRowW=5&amp;application_select=http://www.hudsonfog.com/voc/commerce/coupon/Coupon&amp;application_verified=y&amp;$order=dateAccessed&amp;-asc=-1&amp;-big=n&amp;-nab=n"/ -->
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
        
        repostCallback(event, div, hotspot, content, url, params, http_request);
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

        repostCallback(event, div, hotspot, content, url, params, http_request);
      }
      function incrementOnCouponPage(id) {
        var div = document.getElementById(id);
        img = div.getElementsByTagName("img")[0];
        var textNode = img.previousSibling; //anchor.childNodes[0];
        var curNum = parseInt(textNode.nodeValue);
        textNode.nodeValue = (isNaN(curNum) ? 0 : curNum) + 1 + " ";
      }
			
			var ShowHideCouponDetailes = {
				textDiv1 : null,
				textDiv2 : null,
				isOpening : null,
				delta : null,
				scrollHeight1 : null,
				scrollHeight2 : null,
				
				init : function() {
					var button = document.getElementById("more_details_btn");
					var conditionsDiv = getAncestorById(button, "conditions")
					var highlights = getChildByClassName(conditionsDiv, "highlights");
					this.textDiv1 = getChildByClassName(highlights, "displayIn4lines");
					var finePrint = getChildByClassName(conditionsDiv, "fine_print");
					this.textDiv2 = getChildByClassName(finePrint, "displayIn4lines");
					if (this.textDiv1.scrollHeight >= this.textDiv1.offsetHeight ||
							this.textDiv2.scrollHeight >= this.textDiv2.offsetHeight)
						button.className = "button";
					else {
						this.textDiv1.className = "";
						this.textDiv1.className = "";
					}	
				},
				onclick : function(button) {
					var $t = ShowHideCouponDetailes;
					$t.isOpening = isElemOfClass($t.textDiv1, "displayIn4lines");
					$t._showMoreCouponDetailesAnimation(true);
					getFirstChild(button).style.display = $t.isOpening ? "none" : "inline";
					getLastChild(button).style.display = $t.isOpening ? "inline" : "none";
					button.style.marginTop = $t.isOpening ? 4 : -4; // overlap in hidden state
				},
				
				_showMoreCouponDetailesAnimation : function(isStart) {
					var $t = ShowHideCouponDetailes;
					
					if (isStart) { // prepare to animation
						$t.textDiv1.style.height = this.textDiv1.offsetHeight;
						$t.textDiv1.style.overflow = "hidden";
						$t.textDiv2.style.height = this.textDiv2.offsetHeight;
						$t.textDiv2.style.overflow = "hidden";
						$t.textDiv1.className = $t.isOpening ? "" : "displayIn4lines hideImg";
						$t.textDiv2.className = $t.isOpening ? "" : "displayIn4lines hideImg";
						$t.delta = Math.max(this.textDiv1.scrollHeight / 7, this.textDiv2.scrollHeight / 7);
						
						$t.scrollHeight1 = $t.textDiv1.scrollHeight;
						$t.scrollHeight2 = $t.textDiv2.scrollHeight;
					}
					var h = parseInt(this.textDiv1.style.height) + ($t.isOpening ? $t.delta : -$t.delta);
					if (($t.isOpening && ($t.scrollHeight1 > h || $t.scrollHeight2 > h)) ||
							(!$t.isOpening && h > 56)) {
						$t.textDiv1.style.height = h;
						$t.textDiv2.style.height = h;
						setTimeout(function f() { $t._showMoreCouponDetailesAnimation(); }, 30);
					}
					else { // stop animation
						$t.textDiv1.style.height = "";
						$t.textDiv1.style.overflow = "";
						$t.textDiv2.style.height = "";
						$t.textDiv2.style.overflow = "";
					}	
				}
			}
			runJSCode("ShowHideCouponDetailes.init()", null, "common.js");
			
			// bar docked to bottom edge
			var DockedBar = {
				bar : null,
				init : function() {
					this.bar = document.getElementById("docked_bar");
					document.body.appendChild(this.bar);
					this.bar.style.display = "block";
				}
			}
//			runJSCode("DockedBar.init()", null, "common.js");
		
//		RelatedResourcesSlider - moved to menu.js
		
			// substitudes -$this with coupon ID
			function onVariantsMouseDown(a) {
				var loc= window.location.href;
				var id = loc.match(/\/\d+\/|\/\d+$/)[0].replace(/\//g, "");
				a.href = a.href.replace("-$this", id);
				alert(a.href);
			}
			
    ]]>       
  </script>
  
</div>



					