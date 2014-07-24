<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <!-- Resource list page -->
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 
  <!-- div class="headerMessageBar"></div -->
  <div class="headerDiv"></div>
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" role="main">
  <!--
   {{ if (this.collection.models.length > 5) { }}
    <form role="search">
      <p>
        <input type="text" placeholder="Search..." required="">
        <button type="reset">Clear</button>
      </p>
    </form>
   {{ } }}
   -->
    <section  id="sidebar" data-type="list">
    </section>
    <div id="nabs_grid" class="masonry"></div>
    
    <table class="table-stroke" width="100%" style="display:none" id="comments">
    </table>
    <form data-ajax="false" id="mv" action="#">
      <div style="width:100%;padding-top:1rem;text-align:center">
        <button type="submit" style="background-color:#eee; width:90%" id="mvSubmit">{{= loc('submit') }}</button>
      </div>
      <div data-role="fieldcontain">
        <fieldset data-role="controlgroup" id="mvChooser">
        </fieldset>
      </div>
    </form>  
    <form data-ajax="false" id="editRlForm" action="#">
      <input type="submit" id="editRlSubmit" value="Submit" />
      <ul data-role="listview" id="editRlList" class="action-list" data-inset="true">
      </ul>
    </form>  
  </div>
</script>  

<script type="text/template" id="scrollbarTemplate">
  <span id="{{= obj.id || 'scrollbar' + G.nextId() }}" class="scrollbar" style="position:absolute; {{= (obj.width ? 'width:' + width + 'px;' : '') + (obj.height ? 'height:' + height + 'px;' : '') }}">
    <div class="scrollbarinner">
    </div>
  </span>
</script>

<script type="text/template" id="resource">
<!-- Single resource view -->  
<section id="{{= viewId }}" data-type="sidebar"></section>
<section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 

<!-- div class="headerMessageBar"></div -->
<div class="headerDiv"></div>
<div id="resourceViewHolder">
  <div style="width: 100%;position:relative;padding-right:10px;overflow:hidden;margin-left:0;" class="container_16">

    {{ if (this.isImageCover) { }} 
      <div id="resourceImage" style="margin:0;position:absolute;z-index:1" class="grid_3"></div>
      <div data-role="footer" class="thumb-gal-header hidden" 
        style="opacity:0.7;position:absolute;top:251px;width:100%;background:#eee;text-shadow:none;color:{{= G.darkColor }};">
        <h3></h3>
      </div>    
      <div id="mainGroup" style="padding-right:5px;" {{= U.isAssignableFrom(this.vocModel, 'Tradle') ? 'class="grid_10"' : ''}}></div>
    {{ } }}
    {{ if (!this.isImageCover) { }}
      <div id="resourceImage" style="width:50%;float:left;margin:0; padding:0;{{= U.getArrayOfPropertiesWith(this.vocModel.properties, "mainGroup") &&  U.isA(this.vocModel, 'ImageResource') ? 'min-height:160px;' : ''}}" ><!-- style="width:auto" --></div>
      <div id="mainGroup" style="padding-right:5px;"></div>
    {{ } }}

    <!--div id="resourceImage" style="width:50%;float:left;margin:0; padding:0;"--><!-- style="width:auto" --></div>
    <!--div id="buyGroup" class="ui-block-b" style="width:50%; min-width: 130px"></div-->
  </div>
  <div id="resourceImageGrid" data-role="content" style="padding: 2px;" class="hidden"></div>
  {{ if (!this.isImageCover) { }}
    <div data-role="footer" class="thumb-gal-header hidden"><h3></h3></div>    
  {{ } }}
  
  <div class="thumb-gal-header hidden"><h3></h3></div>
  <!--div id="photogrid" style="padding: 7px;" data-role="content" class="hidden">
  </div-->
  
  <div id="photogrid" data-inset="true" data-filter="false" class="thumb-gal hidden">
  </div>
  {{ if (this.vocModel.type.endsWith("Impersonations")) { }}
     <div style="padding:10px;"><a data-role="button" class="ui-btn-hover-c" data-icon="heart" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: this.resource.get('_uri'), '-makeId': G.nextId()}) }}">{{= loc('wooMe') }}</a></div>
  {{ } }}
  
  <div class="stockCharts hidden"></div>
  <section data-type="list">
    <ul id="resourceView">
    </ul>
  </section>
  <div id="about" class="hidden" style="padding: 7px;"></div>
  
  {{ if (document.getElementById('other')) { }}
    <!--br/>
    <br/-->
  {{ } }}
  <section data-type="list">
    <ul id="cpView">
    </ul>
  </section>
</div>
<!--div data-role="footer" class="ui-bar">
   <a data-role="button" data-shadow="false" data-icon="repeat" id="homeBtn" target="#">Home</a>
   <a data-role="button" data-shadow="false" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">{{= loc('edit') }}</a>
</div-->
<br/>
</script>  

<script type="text/template" id="feedChooserQuickstartTemplate">
<div class="quickstart-content">
  <i class="ui-icon-remove"></i>
  <h2>Quickstart</h2>
  <h3>There are a TON of feeds on Tradle. Here's how to find the one you need</h3>
  <ol class="quickstart-options">
    <li>
      <a href="#" class="mini-cta" data-selector=".subClass:nth-child(2)" data-tooltip="Choose one of these feed categories" data-direction="bottom">Choose a category</a>
      OR
      <a href="#" class="mini-cta" data-selector=".ui-icon-search,.searchInput" data-tooltip="Click here to search for a feed by name" data-direction="bottom-left">Search by name</a>
    </li>
    <li>
      <a href="#" class="mini-cta" data-selector="section[data-type=&quot;list&quot;]" data-tooltip="Click any of the feeds shown below to see the indicators it provides" data-direction="top">Choose a feed</a> from the filtered down list
    </li>          
  </ol>
</div>
</script>

<script type="text/template" id="indicatorChooserQuickstartTemplate">
<div class="quickstart-content">
  <i class="ui-icon-remove"></i>
  <h2>Quickstart</h2>
  <h3>This feed provides the following indicators. Choose one to add to your Tradle (you can choose more later)</h3>
  <ol class="quickstart-options">
    <li>
      <a href="#" class="mini-cta" data-selector="section[data-type=&quot;list&quot;]" data-tooltip="Click on a row to choose an indicator" data-direction="top">Choose an indicator</a>
    </li>          
  </ol>
</div>
</script>

<script type="text/template" id="indicatorVariantChooserQuickstartTemplate">
<div class="quickstart-content">
  <i class="ui-icon-remove"></i>
  <h2>Quickstart</h2>
  <h3>You're almost done! This indicator has technicals. Choose one or more to add to your Tradle, then click the <i style="font-size: 20px; border: 1px solid; padding: 0 4px; margin: 5px;" class="ui-icon-ok" style="font-size:20px;"></i>icon at the top of the page</h3>
</div>
</script>

<script type="text/template" id="tradleViewQuickstartTemplate">
<div class="quickstart-content">
  {{ var res = this.resource, name = res.get('title'), desc = res.get('description'), ils = res.getInlineLists() || {}, rules = ils.tradleRules, nRules = rules && rules.length, indicators = ils.indicators, nIndicators = indicators && indicators.length; }}
  {{ var alerts = ils.notifications, trades = ils.orders, nTrades = trades && trades.length, nAnything = nIndicators || nRules || nTrades, activated = res.get('activated'), isPublic = res.get('isPublic'); }}
  {{ var currentStep = !nIndicators ? 0 : !nRules ? 1 : !nTrades ? 2 : 3; }}
  <i class="ui-icon-remove"></i>
  <h2>Quickstart
    <subtitle>
    {{ if (currentStep < 3) { }}
      {{= [0, 1, 2].map(function(step) { return '<span class="step-{0}">{1}</span>'.format(currentStep == step ? 'current' : currentStep > step ? 'complete' : 'incomplete', ++step) }).join('-') }}
    {{ }                     }}
    {{ if (currentStep >= 3) { }}
      complete
    {{ }                     }}
    </subtitle>
  </h2>
  {{ if (currentStep < 3) { }}
  {{ if (!desc && !nAnything) { }}
  <h3>Welcome to your new tradle!</h3>
  {{ }            }}
  <h3>Step {{= (currentStep + 1) }} is to...</h3>
  <ul class="quickstart-options" style="list-style:none;">
    {{ if (currentStep == 0) { }}
    <li>
      <a class="mini-cta" href="#" data-selector="header [data-shortname=&quot;feeds&quot;] i" data-tooltip="Click here to add indicators" data-direction="left">Add indicators</a> to your tradle.
    </li>
    {{ }                       }}          
    {{ if (currentStep == 1) { }}
    <li>
      <a class="mini-cta" href="#" data-selector="li[data-backlink=&quot;indicators&quot;]" data-tooltip="Click an indicator to make a rule with it" data-direction="top">Create rules</a> out of the indicators you've chosen
    </li>
    {{ }                       }}          
    {{ if (currentStep == 2) { }}
    <li>
      <a class="mini-cta" href="#" data-selector="header [data-shortname=&quot;orders&quot;] i" data-tooltip="Click here to add trades" data-direction="left">Add trades</a> to be executed when your tradle fires
    </li>
    {{ }                       }}          
  </ul>
  {{ }                     }}

  {{ if (currentStep >= 3) { }}
  <h3>Don't forget to:</h3>
  <ul class="quickstart-options">
    {{ if (name == 'New tradle') { }}
      <!-- if there's no description and we're not ready to activate yet -->
      <li>
        <a class="mini-cta" href="#" data-selector=".socialLinks .ui-icon-edit" data-tooltip="Click here to edit the name and description" data-direction="bottom">Name</a> your tradle
      </li>
    {{ }                                        }}
    {{ if (!isPublic && nRules) { }}
      <li>
        Make your tradle <a class="mini-cta" href="#" data-selector=".socialLinks .ui-icon-edit" data-tooltip="Click to edit, then flip the 'Public' switch to 'On'" data-direction="bottom">Public</a> to share it with the world
      </li>
    {{ }                                        }}
    {{ if (isPublic) { }}
      <li>
        <a class="mini-cta" href="#" data-selector=".socialLinks .ui-icon-twitter" data-tooltip="Click here whenever you want to Tweet your tradle" data-direction="bottom">Tweet</a> your tradle
      </li>
    {{ }                                        }}
    {{ if (!activated && nRules) { }}
      <li>
        <a class="mini-cta" href="#" data-selector=".activatable" data-tooltip="This switch turns your tradle on or off" data-direction="left">Activate</a> your tradle. {{= this.vocModel.properties.activated.comment || '' }}
      </li>
    {{ }                                        }}
  </ul>
  {{ }                     }}
</div>
</script>

<script type="text/template" id="ftItemTemplate">
  <li class="ftItem">
    <a href="{{= location.uri }}" target="_blank" style="padding:10px 0">
      <span style="float:right;">
        {{= U.toMDYString(Date.parse(lifecycle.lastPublishDateTime)) }}
      </span>
      <span style="display:block; font-size:1.6rem; font-weight:bold;">
        {{= title.title }}
      </span>
      <span style="display:block; font-size:1.4rem;color:#757575;">
        {{= summary.excerpt }}
      </span>
      <span>
        {{= editorial.byline }}
      </span>
    </a>
  </li>
</script>

<script type="text/template" id="inlineListItemTemplate">
<!-- one row of an inline backlink in view mode -->


<li data-viewid="{{= viewId }}" data-uri="{{= resource.getUri() }}" data-backlink="{{= backlink }}"
{{ if (isTrade) { }}
  style="text-align:center;padding:0;border:none;background:#3777a1;border-bottom:1px solid #ddd;" class="trades"
{{ } }}
  >  
  <a href="{{= href }}" data-uri="{{= resource.getUri() }}" data-backlink="{{= backlink }}" {{= obj._problematic ? 'class="problematic"' : '' }} style="{{= obj.img || obj.needsAlignment ? '' : 'padding:1rem 0;'}} {{= obj.noclick ? 'cursor:default;' : 'cursor:pointer;' }}">
    {{ if (obj.img) { }}
      <img data-lazysrc="{{= img.indexOf('/Image') == 0 ? img.slice(6) : img }}" 
      {{ if (obj.top) { }}  
      style="max-height:none;max-width:none;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      {{ if (!obj.top) { }}  
        style="max-height:80px;max-width:80px;"
      {{ } }}
      data-for="{{= U.getImageAttribute(resource, imageProperty) }}"
      class="lazyImage" />
    {{ } }}
    {{ if (!obj.img  &&  obj.needsAlignment) { }}
      <img src="{{= G.getBlankImgSrc() }}" height="80" style="vertical-align:middle;"/> 
    {{ } }}
    <span style="{{= obj.img || obj.needsAlignment ? 'position:absolute;padding:10px;' : ''}}{{= isTrade ? 'font-size:2.5rem;color:aliceblue;' : 'font-size:1.6rem;' }}font-weight:bold;">{{= obj.gridCols  ? (obj.gridCols.indexOf(name) == -1 ? name + '<br/>' + gridCols : gridCols) : name }}</span>
  </a>
  {{ if (typeof comment != 'undefined') { }}
    <p>{{= comment }}</p>
  {{ } }}
</li>
</script>

<script type="text/template" id="actionsOverlayTemplate">
  <div class="anim-overlay centered {{= active ? 'anim-overlay-active' : '' }}" data-uri="{{= _uri }}">
    <div class="drawer-tab-left">
      <i class="ui-icon-chevron-left vcenteredA"></i>
    </div>
    <div class="anim-overlay-content vcenteredA">
      {{ var cols = _.compact(_.values(actions)).length; }}
      {{ if (actions.cancel) {     }}
        <div class="span_1_of_{{= cols }}" style="color:#f00;">
          <i class="ui-icon-remove" data-action="cancel"></i>
        </div>
      {{  }                       }}
      {{ if (actions.add) {     }}
        <div class="span_1_of_{{= cols }}">
          <i class="ui-icon-plus" data-action="add"></i>
        </div>
      {{  }                       }}
      {{ if (actions.edit) {     }}
        <div class="span_1_of_{{= cols }}">
          <i class="ui-icon-edit" data-action="edit"></i>
        </div>
      {{  }                       }}
      {{ if (actions.comment) {      }}
        <div class="span_1_of_{{= cols }}">
          <i class="ui-icon-comments" data-action="comment"></i>
        </div>
      {{  }                       }}
    </div>
    <div class="drawer-tab-right">
      <i class="ui-icon-chevron-right vcenteredA"></i>
    </div>
  </div>
</script>

<script type="text/template" id="inlineCompareIndicatorsRuleTemplate">
<li data-viewid="{{= viewId }}" data-backlink="{{= backlink }}" data-uri="{{= resource.getUri() }}" style="background:white; padding:0;" class="tradleRules">
  {{ var byPercent = ~resource.getUri().indexOf('ByRule?'); }}
  <div class="cf" style="font-size:1.6rem;font-weight:bold;text-align:center; height: auto; padding:1rem 0; width: 100%">
    <div style="float:left; width:40%; height:100%;">
      {{ if (resource.get('feedImage')) { }}
        <img style="padding-left:1rem;float:left;af" src="{{= resource.get('feedImage') }}" />
      {{ }                               }}
      <div class="rule1">
        {{= resource.get('indicator.displayName') }}
      </div>
      <div>
        {{ if (resource.get('tradleFeed')) { }}
        <a style="text-decoration:none; font-weight: 100;font-size:1.4rem;" href="{{= U.makeMobileUrl('view', resource.get('tradleFeed')) }}">
          {{= resource.get('tradleFeed.displayName') }}
        </a>
        {{ }                               }}
      </div>
    </div>
    <div style="float:left; width:20%; height:100%; font-size:2.3rem;">
    {{ var op = U.getRuleOperator(resource), lop = op.toLowerCase(); }}
    {{ var cl = lop == 'rose' ? 'ui-icon-arrow-up' : lop == 'fell' ? 'ui-icon-arrow-down' : ''; }}
      <div style="font-size:4.5rem;color:#2c94c5;" class="{{= cl }}">
        {{= cl ? '' : op }}
      </div>
      {{ if (byPercent) {   }}
      <div>
        <span style="font-size:1.5rem;">BY</span> 
        {{= resource.get('percentValue') }}%
      </div>
      {{ }                        }}
    </div>
    <div style="float:left; width:40%; height:100%;">
    {{ if (resource.get('compareWith')) {   }}
      {{ if (resource.get('compareWithFeedImage')) { }}
        <img style="float:right;" src="{{= resource.get('compareWithFeedImage') }}" />
      {{ }                               }}
      <div class="rule1">
        {{= resource.get('compareWith.displayName') }}
      </div>
      <div>
        {{ if (resource.get('compareWithTradleFeed')) { }}
        <a href="{{= U.makeMobileUrl('view', resource.get('compareWithTradleFeed')) }}" style="text-decoration:none; font-weight: 100;">
          {{= resource.get('compareWithTradleFeed.displayName') }}
        </a>
        {{ }                               }}
      </div>
    {{ }                        }}
    {{ if (!resource.get('compareWith')) {  }}
      <div style="font-size:4rem;padding-bottom:1rem;">
        {{= U.getRuleValue(resource) }}
      </div>
    {{ }                        }}
    </div>
  </div>
</li>
</script>

<script type="text/template" id="socialLinksTemplate">
<!-- Social Links -->
<li class="socialLinks" style="font-weight: normal;color:#3777a1;">
  {{ var owner = this.resource.get('owner'), submittedBy = this.resource.get('submittedBy'), user = G.currentUser._uri, isOwner = user && user == (owner || submittedBy); }}
  {{ if (user && (user == owner || user == submittedBy)) { }}
    <a class="socialAction" href="{{= U.makePageUrl('edit', this.resource.getUri(), {$editCols: 'activated,title,description,isPublic'}) }}"><span class="ui-icon-edit" data-url="{{= uri }}">&#160;EDIT</span></a>
  {{ } }}
  {{ if (U.getBacklinkCount(this.resource, 'tradleRules')) { }}
    <a href="{{= U.getTwitterLink(this.resource) }}" class="socialAction" data-url="{{= uri }}"><span class="ui-icon-twitter" target="_blank">&#160;TWEET</span></a>
  {{ } }}
  <a href="{{= U.makePageUrl('view', uri + '&$clone=y') }}" class="socialAction" data-url="{{= uri }}"><span class="ui-icon-fork">&#160;CLONE</span></a>
  <a href="{{= G.serverName }}/widget/embed.html?uri={{= encodeURIComponent(uri) }}" class="socialAction" data-url="{{= uri }}"><span class="ui-icon-embed">&#160;EMBED</span></a>
</li>
</script>

<script type="text/template" id="privateBetaPageTemplate">
  <div class="section light" id="section_bg">
  <div class="section-content">
    <div class="title-block">
    {{ var guest = G.currentUser.guest, activated = G.currentUser.isActivated; }}
    {{ if (guest) { }} 
      <span class="section-title">Sign up for early access</span>
      <span class="section-title _2">Get involved now!</span>
    {{ }                                 }}
    {{ if (activated) { }} 
      <span class="section-title">You got early access!</span>
      <span class="section-title _2">See how to make the most of your Tradle membership below</span>
    {{ }                                 }}
    {{ if (!guest && !activated) { }} 
      <span class="section-title">There are {{= G.currentUser.numberInLine }} users ahead of you</span>
      <span class="section-title _2">But don't wait, get involved now!</span>
    {{ }                                 }}
    </div>
    <div class="group">
      <div class="col span_1_of_3">
        <i class="ui-icon-users"></i>
        <h4 style="font-weight:100;">Sign up 3 people</h4>
        <p>
          <strong>Get access & the invites to give away</strong>
          <div>
            {{ var n = G.currentUser.referredInstalls || 0; }}
            Post any Tradle URL anywhere online and earn rewards on signups and sales you facilitate.
            {{ if (G.currentUser.guest ) { }}
              <a href="#" class="link reqLogin">Login</a> and all links in your address bar become personalized.
            {{ }                            }}
            {{ if (!G.currentUser.guest ) { }}
            You've signed up 
              <span style="color:#00B608;font-size:16px">{{= n }}</span> {{= n == 1 ? 'person' : 'people' }} so far. Link below is an example link you can use.
              <input type="text" style="width:80%; margin: 10px auto; display: block;" onfocus="Lablz.U.selectInputText(arguments[0]);" value="{{= U.getReferrerLink() }}" readonly="readonly" />
            {{ }                            }}
          </div>
        </p>
        <div>
          <a href="app/Tradle/article/sql/www.hudsonfog.com/voc/media/publishing/Article?articleId=32005" class="link">learn more</a>
        </div>
      </div>
      <div class="col span_1_of_3">
        <i class="ui-icon-cart" style="color:#9CF7A0;"></i>
        <h4 style="font-weight:100;">Subscribe to paid services</h4>
        <p>
          <strong>Gain influence over priority features</strong>
          <div>
            Get instant access. Gain right to upvote/downvote <a href="app/Tradle/list/software/crm/Feature">features in our pipeline</a> and suggest new features.  
          </div>
        </p>
        <div>
          <a href="app/Tradle/article/sql/www.hudsonfog.com/voc/media/publishing/Article?articleId=32005" class="link">learn more</a>
        </div>
      </div>
      <div class="col span_1_of_3">
        <i class="ui-icon-comments" style="color:#6798F0;"></i>
        <h4 style="font-weight:100;">Advise us</h4>
        <p>
          <strong>Help us grow our business fast</strong>
          <div>
            We pledge to make it worthwhile for you in the form of shares in Tradle. Please contact us to discuss the opportunity.
          </div>
        </p>
        <div>
          <a href="app/Tradle/article/sql/www.hudsonfog.com/voc/media/publishing/Article?articleId=32005" class="link">learn more</a>
        </div>
      </div>
    </div>
  </div>  
  </div>
</script>

<script type="text/template" id="articlePageTemplate">
  <section class="menuLeft" data-type="sidebar"></section>
  <section class="menuRight" data-type="sidebar"></section> 
  <div class="headerDiv" style="padding-top: 10px;">
    <ul class="headerUl">
    </ul>
  </div>
  <div class="section"></div>
</script>

<script type="text/template" id="articleViewTemplate">
  <div class="section-content">
    <div class="title-block">
      <span class="section-title">{{= title }}</span>  
    </div>
    <div style="text-align: left;padding: 30px;">
      {{= body }}
    </div>
  </div>
</script>

<script type="text/template" id="colTemplate">
  <div class="section-content">
    <div class="title-block">
      <span class="section-title" style="color:#83C2E0">{{= obj.title || '' }}</span>
      <span class="section-title _2">{{= obj.subTitle || '' }}</span>
    </div>
    <div class="group">
    {{ for (var i = 0, l = cols.length; i < l; i++)  {               }}
    {{   var col = cols[i];                                          }}
      <div class="col span_1_of_{{= l }}" style="{{= (l < 3 ? 'text-align:center;' : '') + (l == 1 ? 'float:none;width:100%;' : '') }}">
      {{ if (col.icon) {                                             }} 
        <i class="{{= col.icon['class'] }}" style="color:{{= col.icon.color }}"></i>
      {{ }                                                           }}
      {{ if (col.img) {                                              }}
        <div class="headshot1">
          <img src="{{= col.img }}" style="border-color: #C5E4FF;" />
        </div>
      {{ }                                                           }}
      {{ if (col.title) {                                            }} 
        <h4 style="font-weight:100;">{{= col.title }}</h4>
      {{ }                                                         }}
      {{ if (col.subTitle || col.body) {                           }} 
        <p>
        {{ if (col.subTitle) {                                       }} 
          <strong>{{= col.subTitle }}</strong>
        {{ }                                                         }}
        {{ if (col.body) {                                           }} 
          <div style="{{= l < 3 ? 'text-align:left;padding: 30px;' : '' }}">{{= col.body }}</div>
        {{ }                                                         }}
        </p>
      {{ }                                                         }}
      {{ if (col.link) {                                           }} 
        <a href="{{= col.link.href }}" class="{{= col.link.className || 'link' }}">{{= col.link.text }}</a>
      {{ }                                                         }}
      </div>
    {{ }                                                             }}
    </div>
    {{ if (obj.action) {                                             }} 
    <div style="text-align:center;">
      <a href="{{= action.href }}" class="cta">{{= action.text }}</a>
    </div>
    {{ }                                                             }}
  </div>  
</script>

<script type="text/template" id="pricingPageTemplate">
  <div class="section light" id="section_bg">
    <section id="viewHome" data-type="sidebar"></section>
    <section id="viewHomer" data-type="sidebar"></section>
    <div class="headerHP" style="position:absolute;top:0px;width: 100%;">
      <section id="viewHome" class="menuLeft" data-type="sidebar" style="position:absolute;height:100%;opacity:0.95;background:#2d2d2d;visibility:hidden;z-index:10001"></section>
      <div id="hpRightPanel" style="font-size:30px; cursor: pointer; float: right; margin-right: 5px;">
        <span style="cursor:pointer; font-size: 30px;vertical-align:middle;"><i style="color:#7aaac3;padding:5px 0;" class="ui-icon-reorder"></i></span>
      </div>
    </div>
    <div class="section-content" style="margin:0 auto;">
      <div class="title-block">
        <h1 class="section-title">Pricing for Individuals</h1>
        <h3 class="section-title _2">Creating and running tradles</h3>
        <h3 class="section-title _2"><a href="app/Tradle/static/pricing1PageTemplate" class="link" style="font-size: 20px">Pricing for Companies</a></h3>
      </div>
      <div class="pricing-section group">
        <div class="col span_1_of_3 pricing-1">
          <h4 style="color:#000;font-weight:100;">
            Free
          </h4>
          <div class="pricing-note">
            Sign up now, no credit card needed 
          </div>
          <div class="pricing-price">
            <span class="pricing-amount">0</span>
            <span class="pricing-unit">$</span>
          </div>
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Unlimited public tradles</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Free 5-day backtesting</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Free historical data</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy1" href="#">Get Now</a>
          </div>
        </div>
        <div class="col span_1_of_3 pricing-2">
          <h4 style="color:#000;font-weight:100;">
            Small
          </h4>
          <div class="pricing-note">
            Start making some money 
          </div>
          
          <div class="pricing-price">
            <span class="pricing-amount">19</span>
            <span class="pricing-unit">$/mo</span>
          </div>
    
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">5 private tradles</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">A month of backtesting</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">1 tradle listed for sale</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy" data-buyitem="basic" href="pay/?$amount=$19">Buy Now</a>
          </div>
        </div>
        <div class="col span_1_of_3 pricing-3">
          <h4 style="color:#000;font-weight:100;">
            Medium
          </h4>
          <div class="pricing-note">
            For emerging money managers
          </div>
          
          <div class="pricing-price">
            <span class="pricing-amount">99</span>
            <span class="pricing-unit">$/mo</span>
          </div>
    
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">25 private tradles</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">A year of backtesting</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">5 tradles listed for sale</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy" data-buyitem="pro" href="pay/?$amount=$99">Buy Now</a>
          </div>
        </div>
      </div>
    </div>  
  </div>
</script>

<script type="text/template" id="pricing1PageTemplate">
  <div class="section light" id="section_bg">
    <section id="viewHome" data-type="sidebar"></section>
    <section id="viewHomer" data-type="sidebar"></section>
    <div class="headerHP" style="position:absolute;top:0px;width: 100%;">
      <section id="viewHome" class="menuLeft" data-type="sidebar" style="position:absolute;height:100%;opacity:0.95;background:#2d2d2d;visibility:hidden;z-index:10001"></section>
      <div id="hpRightPanel" style="font-size:30px; cursor: pointer; float: right; margin-right: 5px;">
        <span style="cursor:pointer; font-size: 30px;vertical-align:middle;"><i style="color:#7aaac3;padding:5px 0;" class="ui-icon-reorder"></i></span>
      </div>
    </div>
    <div class="section-content" style="margin:0 auto;">
      <div class="title-block">
        <h1 class="section-title">Pricing for Companies</h1>
        <h3 class="section-title _2">Idea harvesting, PR, fundraising</h3>
      </div>
      <div class="pricing-section group">
        <div class="col span_1_of_3 pricing-1">
          <h4 style="color:#000;font-weight:100;">
            Silver
          </h4>
          <div class="pricing-item-price-note">
            What you get here is an absolute steal 
          </div>
          <div class="pricing-price">
            <span class="pricing-amount">1K</span>
            <span class="pricing-unit">$/mo</span>
          </div>
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Monitor clones of your tradle</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Top the sale of any clone you seeded</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Access to leaderboard of clones you seeded</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy1" href="pay/?$amount=$1,000">Buy Now</a>
          </div>
        </div>
        <div class="col span_1_of_3 pricing-2">
          <h4 style="color:#000;font-weight:100;">
            Gold
          </h4>
          <div class="pricing-item-price-note">
            Decrease fundraising costs 
          </div>
          
          <div class="pricing-price">
            <span class="pricing-amount">10K</span>
            <span class="pricing-unit">$/mo</span>
          </div>
    
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Your logo in tradle embeds</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Affiliate sales</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Feed packages</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy2" href="pay/?$amount=$10,000">Buy Now</a>
          </div>
        </div>
        <div class="col span_1_of_3 pricing-3">
          <h4 style="color:#000;font-weight:100;">
            Platinum
          </h4>
          <div class="pricing-item-price-note">
            For emerging quant funds
          </div>
          
          <div class="pricing-price">
            <span class="pricing-amount">Call</span>
            <span class="pricing-unit"></span>
          </div>
    
          <ul class="pricing-items">
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Full</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Algo trading</p>            
            </li>
    
            <li class="pricing-item">
              <i class="ui-icon-ok"></i>
              <p class="pricing-title">Services</p>            
            </li>  
          </ul>
          <div class="section-footer">
            <a class="cta buy3" href="make/commerce/trading/Lead?$title=Get+a+callback&$editCols=description">Get a callback</a>
          </div>
        </div>
      </div>
    </div>  
  </div>
</script>

<script type="text/template" id="advisorsPageTemplate">
  <div class="section light" id="section_bg">
    <div class="section-content" style="margin:0 auto; padding-left:20px;padding-right:20px;">
      <div class="title-block">
        <h1 class="section-title">Our Advisors</h1>
        <h3 class="section-title _2">We sneeze and they bless us</h3>
      </div>
      {{ for (var i = 0; i < advisors.length / 4; i++) { }}
      <div class="pricing-section group">
      {{   for (var j = 0; j < 4 && i * 4 + j < advisors.length; j++) {  }}
      {{     var advisor = advisors[i * 4 + j];          }}
        <div class="col span_1_of_4 thin contact">
          <div class="headshot">
            <img src="{{= U.getExternalFileUrl(advisor.featured) }}" />
          </div>
          <span class="contact-title _2">{{= advisor.davDisplayName }}</span>
          <span class="contact-title _3">
            {{= advisor.title }}
            {{= advisor.company ? '<br />@<br />' + advisor.company : '' }}
          </span>
          <ul class="section-footer" style="padding:0;">
            {{ if (advisor.linkedin) { }}
            <li class="contact-endpoint">
              <a class="link" href="{{= advisor.linkedin }}" target="_blank">profile</a>
            </li>
            {{ }                      }}

            {{ if (advisor.twitter) { }}
            <li class="contact-endpoint">
              <a class="link" href="http://twitter.com/{{= advisor.twitter }}" target="_blank">@{{= advisor.twitter }}</a>
            </li>
            {{ }                      }}
          </ul>
        </div>
      {{   }                                             }}
      </div>
      {{ }                                               }}
    </div>  
  </div>
</script>

<script type="text/template" id="bookmarkletIphonePageTemplate">
<style>
  .bookmarkletPage-tableview-grouped {
    background: #f2f2f2;
    padding: 10px 10px 1px;
    width: 300px;
  }

  .bookmarkletPage-section {
    -webkit-text-size-adjust: none;
    font-family: "Helvetica Neue", sans-serif;
    background: #fff;
    border-radius: 10px;
    padding: 10px;
    width: 280px;
    border: 1px solid #d9d9d9;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .bookmarkletPage a { color: #1389e5; }
  
  .bookmarkletPage-section h1, .bookmarkletPage-section h2, .bookmarkletPage-section h3, .bookmarkletPage-section h4, .bookmarkletPage-section h5, .bookmarkletPage-section h6 {
    font-size: 16px;
    font-weight: bold;
  }

  .bookmarkletPage-section p {
    margin-top: 10px;
  }

  .bookmarkletPage-section li {
    margin-top: 10px;
  }
</style>
<div class="bookmarkletPage-tableview-grouped">
<div class="bookmarkletPage-section">
    <h1><strong>Installing the Aha! Bookmarklet for iPhone</strong></h1>
    <p>Before you begin, be aware that it is much easier to install the iPhone bookmark in Firefox or Safari on your computer, and then synchronize your iPhone or iPod touch using iTunes.</p>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 1: Bookmark this page.</h2>
    <p>Tap the middle icon below, then tap <strong>Add Bookmark</strong>, then tap Save.</p>
</div>

<div class="bookmarkletPage-section">
  <h2>Step 2: Select the text and copy it.</h2>
  <textarea style="width: 280px; height: 170px; margin-top: 10px;">javascript:void(function loadAha(d, params) {var e = d.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src','//urbien.com/js/aha.js?r='+Math.random()*99999999 + '&' + (params || ''));d.body.appendChild(e)}(document, "aha=y"))</textarea>
  <ol style="float: right; width: 280px; list-style-position: inside;">
    <li>Tap inside.</li>
    <li>Tap and hold for a bit, then release.</li>
    <li>Tap <strong>Select All.</strong></li>
    <li>Tap <strong>Copy.</strong></li>
    <li>Tap <strong>Done</strong>.</li>
  </ol>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 3: Edit the bookmark.</h2>
    <p>1. Tap the Bookmarks button in the toolbar.</p>
    <p>2. Tap <strong>Edit</strong>. Select the <strong>Aha!</strong> bookmark to edit.</p>
    <p>3. Tap its URL, tap the <strong>x</strong> to clear it, tap-and-hold for the magnifying glass, then tap <strong>Paste</strong>.</p>
    <p>4. Save the changes by tapping <strong>Done</strong>.</p>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 4: Installation complete.</h2>
    <p>Installation should be complete!</p>
    <p>Select the <strong>Aha!</strong> bookmark from your Bookmarks list to use it.</p>
    <p>As soon as this can be made simpler, it will be. Thank you for your patience, and thank you for using Aha!</p>

</div>
</div>
</script>

<script type="text/template" id="bookmarkletAndroidPageTemplate">
<div style="margin: 0px 10px 0px 10px;">
  <div>
    <h1><strong>Using the Aha! Bookmarklet on Android</strong></h1>
    <p class="red" style="font-weight:bold">First, make sure to install the Aha! bookmark on your desktop Chrome.</p>
    <p>Then when you browse a page you'd like to Aha! or Huh?, tap the address bar and type in <strong>aha</strong>. See the image below for reference. Now click the starred bookmark that says <strong>Aha!</strong></p>
    <p><img src="{{= G.serverName + '/images/aha/Android bookmark.png' }}" style="max-width:100%" />
  </div>
</div>
</script>

<script type="text/template" id="bookmarkletDesktopPageTemplate">
  <div style="text-align:center">
    <h1>Drag the button below to your browser's bookmarks bar</h1>
    <ul class="nav">
      <li><a onclick="javascript:alert('Drag me to your bookmarks bar!'); return false;" href="javascript:void(function loadAha(d, params) {var e = d.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src','//urbien.com/js/aha.js?r='+Math.random()*99999999 + '&' + (params || ''));d.body.appendChild(e)}(document, 'aha=y'))" style="font-size:30px">Aha!</a></li>
    </ul>
  </div>
</script>

<script type="text/template" id="bookmarkletDesktopStaticPageTemplate">
  <div style="text-align:center">
    <h1>Drag the button below to your browser's bookmarks bar</h1>
    <ul class="nav">
      <li><a onclick="javascript:alert('Drag me to your bookmarks bar!'); return false;" href="javascript:void(function loadAha(d, params) {var e = d.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src','//urbien.com/js/aha.js?r='+Math.random()*99999999 + '&' + (params || ''));d.body.appendChild(e)}(document, 'aha=y'))" style="font-size:30px">Aha!</a></li>
    </ul>
  </div>
</script>

<script type="text/template" id="chatPageTemplate">
  <!-- Chat page -->
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" style="z-index: 3000;" data-theme="a" data-position="right"></div> 
  <div id="{{= viewId + 'r' }}" data-role="panel" data-display="overlay" style="z-index: 3001;" data-theme="a" data-position="right"></div> 
  <div class="headerDiv"></div>
  <div id="videoChat" class="videoChat">
    <div id="localMedia"></div>
    <div id="remoteMedia"></div>
  </div>    
  <!--div class="headerMessageBar" style="opacity:0.7"></div-->
  <!--div id="localVideoMonitor" style="z-index:100;width:100%;height:100%;left:0;top:0;position:fixed;">
  </div-->
  <div id="ringtoneHolder" style="visibility: hidden; display: none;">
  </div>
  
  <div id="inChatGoodies" style="width:100%;position:absolute; z-index: 100">
    <div id="inChatBacklinks" style="position:absolute;padding:5px;top:130px;z-index:2000"></div>
    <div id="inChatStats" style="position:relative;"></div>
  </div>
  <div id="chatDiv" role="main" data-role="content" class="chat-holder">
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
    <div id="textChat"> <!--style="margin: 0px 10px 0px 10px" -->
      <!--h3>Text Chat</h3-->
      <div id="messages" width="100%">
      </div>
    </div>
  {{ }                                          }}
  </div>
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
  <div data-role="footer" data-position="fixed" data-theme="d" class="fieldcontain closespacing forceinline" style="z-index:3000">
    <div class="floatleft">
      <button id="chatCaptureBtn" data-theme="a" data-mini="true"><i class="ui-icon-camera"></i></button>
    </div>
    {{ if (this.isAgent) { }}
    <div class="floatleft">
      <button id="chatReqLocBtn" data-theme="a" data-mini="true"><i class="ui-icon-eye-open"></i></button>
    </div>
    {{ }                     }}
    {{ if (this.isClient) { }}
    <div class="floatleft" style="padding-top:0px">
      <!--input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
      <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label-->
      <button id="chatShareLocBtn" data-theme="a" data-mini="true"><i class="ui-icon-map-marker"></i></button>
    </div>  
    {{ }                     }}
    <div class="floatleft" style="width:40%">
      <input type="text" id="chatMessageInput" class="miniinputheight" value="" data-mini="true" />
    </div>  
    <div class="floatleft">
      <button id="chatSendBtn" data-theme="a" data-mini="true">{{= loc('send') }}</button>
    </div>
  </div>
  {{ } }}
</script>  

<script type="text/template" id="chatMessageTemplate1">
  <table width="100%">
    <tr>
      {{ if (!obj.info && !obj.self && obj.senderIcon) { }}
        <td width="1%"><img src="{{= obj.senderIcon }}" height="20" style="margin-right:10px" /></td> 
      {{ }                 }}
      
      <td width="100%">
        <div class="{{= 'bubble' + (obj.sender ? (obj.self ? '-left' : '-right') : '') }}">
          {{ if (obj.sender) { }}
            <span class="{{= obj.self ? 'speaker-self' : 'speaker-other' }}">{{= sender }}</span> ({{= time }}): 
          {{ }                 }}
      
          {{ if (obj.info && obj.senderIcon) { }}
            <img src="{{= obj.senderIcon }}" height="20" style="margin-right:10px" /> 
          {{ }                 }}
          
          <span class="{{= obj.info ? 'chat-info' : obj.self ? 'chat-message-outgoing' : 'chat-message-incoming' }}">
            {{ if (obj['private']) { }}
              <span class="private-message"><i>{{= '(' + loc('privateMsg') + ')' }}</i></span> 
            {{ }                 }}
            {{= obj.sender ? message : '{0} ({1})'.format(message, time) }}
          </span>
        </div>
      </td>
      
      {{ if (!obj.info && obj.self && obj.senderIcon) { }}
        <td width="1%"><img src="{{= obj.senderIcon }}" height="20" style="margin-left:10px" /></td> 
      {{ }                 }}
    </tr>
  </table>
</script>

<!--script type="text/template" id="chatResourceMessageTemplate">
  <h3><a href="{{= U.makePageUrl('view', _uri) }}">{{= displayName }}</a></h3>
  {{ if (obj.image) {                      }}
     <a href="{{= U.makePageUrl('view', _uri) }}"><img src="{{= U.getExternalFileUrl(image) }}" /></a>
  {{ }                                     }}
  {{ for (var p in props) {                }}
     <p>{{= p }}: {{= props[p] }}</p>
  {{ }                                     }}
</script-->

<script type="text/template" id="chatResourceLinkMessageTemplate">
  <strong><a href="{{= href }}">{{= text }}</a></strong>
</script>

<script type="text/template" id="chatMessageTemplate">
  <table width="100%" class="height_tracker">
    <tr>
      <td width="100%">
        <div class="{{= 'chat_msg ' + (obj.sender ? (obj.self ? 'msg_sent' : 'msg_recvd') : 'msg_recvd') }}">
         <!--  {{ if (obj.sender) { }}
            <div class="chat_user"><div><img src="{{= obj.senderIcon }}" class="med user_pic" /></div></div>
          {{ }                 }}
          {{ if (obj.info && obj.senderIcon) { }}
         -->
          {{ if (obj.senderIcon) { }}
            <div class="chat_user"><div><img src="{{= obj.senderIcon }}" class="med user_pic" /></div></div> 
          {{ }                 }}
          
          <div class="chat_copy">
            {{ if (obj.isPrivate) { }}
              <p class="private-message"><i> (Private message) </i></p> 
            {{ }                 }}
            <!-- p>{{= obj.sender ? message : '{0} ({1})'.format(message, time) }}</p -->
            <p>{{= message }}</p>
          </div>
          <div class="posted_on">
          {{ if (obj.sender) { }}
            <strong>{{= sender }}</strong>&#160;&#160;{{= time }}
          {{ }                 }}
          </div>
        </div>
      </td>
    </tr>
  </table>
</script>

<script type="text/template" id="socialNetworkPageTemplate">
<!-- View where the user can connect various social networks -->  
  <div id="{{= this.cid }}" data-role="panel" data-display="overlay" data-theme="a" data-position="right"></div>
  <div id="{{= this.cid + 'r' }}" data-role="panel" data-display="overlay" data-theme="a" data-position="right"></div> 
  <div class="headerDiv"></div>
  <div id="socialButtons" style="min-width:200px; margin: 0 auto;"></div>
</script>  

<script type="text/template" id="socialNetButtonTemplate">
  <div class="{{= obj['class'] || '' }}" style="text-align:center;">
    <!--button data-icon="{{= icon }}" data-inline="true" data-net="{{= net }}">{{= net }}</button-->
    <a href="#" data-role="button" data-net="{{= net }}">
      <i class="{{= 'ui-icon-' + icon}}" style="font-size: 20px; float:left;"></i>
      <!--i class="{{= obj.connected ? 'ui-icon-remove-sign' : 'ui-icon-ok-circle'}}" style="font-size: 20px; float:right"></i-->
      <i class="ui-icon-circle" style="font-size: 20px; float:right; color: {{= obj.connected === undefined ? '#FF0000' : obj.connected ? '#00FF00' : '#FFFF00' }}"></i>
    </a>
  </div>
</script>

<script type="text/template" id="genericOptionsDialogTemplate">
  <div data-role="popup" id="{{= id }}" data-overlay-theme="a" data-theme="c">
    <ul data-role="listview" data-inset="false" data-theme="d"> 
      <li data-role="divider" data-theme="e" style="font-size: 20px;">{{= title }}</li>
      {{ _.each(options, function(option) { }}
        <li data-icon="false" style="padding:5px 20px;"><a href="{{= option.href || '#' }}" style="font-size: 20px;" id="{{= option.id }}" >{{= option.text }}</a></li>
      {{ })                                 }}
    </ul>
  </div>
</script>

<script type="text/template" id="genericOptionsDialogTemplate1">
  <div data-role="popup" id="{{= id }}" data-overlay-theme="a" data-theme="c">
    <ul data-role="listview" data-inset="true" data-theme="d">
      <li data-role="divider" data-theme="e">{{= title }}</li>
      {{ _.each(options, function(option) { }}
        <li><a href="{{= option.href || '#' }}" id="{{= option.id }}" >{{= option.text }}</a></li>
      {{ })                                 }}
    </ul>
  </div>
</script>

<script type="text/template" id="chatViewTemplate1">
  <div id="chatHolder" class="chat-holder">
   <!--
   {{ if (obj.video || obj.audio) { }}
    <div id="videoChat" class="videoChat">
      <div id="localMedia"></div>
      <div id="remoteMedia"></div>
    </div>    
  {{ }                }}

    <div id="ringtoneHolder" style="visibility: hidden; display: none;">
    </div>
  -->
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
    <div id="textChat"> <!--style="margin: 0px 10px 0px 10px" -->
      <!--h3>Text Chat</h3-->
      <div id="messages" width="100%">
      </div>
    </div>
        <div data-role="footer" data-position="fixed" data-theme="d" class="fieldcontain closespacing forceinline" style="z-index:3000">
      <!--table>
        <tr>
          <td>
            <button id="chatCaptureBtn" data-theme="a" data-mini="true"><i class="ui-icon-camera"></i></button>
          </td>
          {{ if (this.isAgent) { }}
          <td>
            <button id="chatReqLocBtn" data-theme="a" data-mini="true"><i class="ui-icon-eye-open"></i></button>
          </td>
          {{ }                     }}
          {{ if (this.isClient) { }}
          <td>
            <input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
            <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label>
          </td>
          {{ }                     }}
          <td colspan="50">
            <input type="text" id="chatMessageInput" value="" data-mini="true" />
          </td>
          <td>
            <button id="chatSendBtn" data-theme="a" data-mini="true">{{= loc('send') }}</button>
          </td>
        </tr>
      </table-->
      <div class="floatleft">
        <button id="chatCaptureBtn" data-theme="a" data-mini="true"><i class="ui-icon-camera"></i></button>
      </div>
      {{ if (this.isAgent) { }}
      <div class="floatleft">
        <button id="chatReqLocBtn" data-theme="a" data-mini="true"><i class="ui-icon-eye-open"></i></button>
      </div>
      {{ }                     }}
      {{ if (this.isClient) { }}
      <div class="floatleft" style="padding-top:0px">
        <!--input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
        <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label-->
        <button id="chatShareLocBtn" data-theme="a" data-mini="true"><i class="ui-icon-map-marker"></i></button>
      </div>  
      {{ }                     }}
      <div class="floatleft" style="width:40%">
        <input type="text" id="chatMessageInput" class="miniinputheight" value="" data-mini="true" />
      </div>  
      <div class="floatleft">
        <button id="chatSendBtn" data-theme="a" data-mini="true">{{= loc('send') }}</button>
      </div>
    </div>
    
  {{ }                                          }}
  </div>
</script>

<script type="text/template" id="audioPlayerTemplate">
  <audio controls style="padding:20px 0 5px 13px;">
{{    _.each(sources, function(source) { }}      
      <source src="{{= source }}" type="{{= 'audio/' + source.slice(source.lastIndexOf('.') + 1) }}">
      Your browser does not support this audio player
{{    }); }}
  </audio>
</script>

<script type="text/template" id="videoPlayerTemplate">
  <video controls="true" {{= _.has(obj, 'autoplay') ? "autoplay='{0}'".format(autoplay) : '' }} preload="{{= obj.preload ? preload : 'metadata' }}" 
  {{= obj.width ? " width='{0}'.format(width)" : '' }}
  {{= obj.height ? " height='{0}'.format(height)" : '' }}
  {{ if (obj.poster) {               }}
  {{= " poster='{0}'".format(poster) }}
  {{ }                               }}
  >
    <source src="{{= src }}" type="{{= 'video/' + src.slice(src.lastIndexOf('.') + 1) }}" />
  </video>
</script>

<script type="text/template" id="menuP">
<!-- Left-side slide-out menu panel -->
<ul class="menuItems" id="menuItems" style="background:{{= G.darkColor }};"></ul>
</script>  

<script type="text/template" id="rightMenuP">
<!-- Right-side slide-out menu panel -->
<ul id="rightMenuItems" class="menuItems" style="background:{{= G.darkColor }};"></ul>
</script>  

<script type="text/template" id="stringPT">
  <!-- Left-side slide-out menu panel -->
  {{ if (obj.value  &&  value.indexOf('<') != 0) { }}
     <div style="white-space: normal;font-size:16px;">{{= value }}</div>
  {{ } }}
  {{ if (obj.value  &&  value.indexOf('<') == 0) { }}
    {{= value }}
  {{ } }}
</script>
  
<script type="text/template" id="longStringPT">
  {{ if (typeof value != 'undefined' && value.indexOf('<span') == -1) { }}
     <span style="white-space: normal; font-size:16px; color: #777;">{{= value }}</span>
  {{ } }}
  {{ if (typeof value != 'undefined' && value.indexOf('<span') != -1) { }}
    {{= value }}
  {{ } }}
</script>

<script type="text/template" id="emailPT">
  <a href="mailto:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="UrlPT">
  <a href="{{= value.href }}">{{= value.linkText }}</a>
</script>

<script type="text/template" id="telPT">
  <a href="tel:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="datePT">
  <!--span>{{= G.U.getFormattedDate(value) }}</span-->
  <span>{{= typeof displayName != 'undefined' ? displayName : (prop.dateFormat ?  U.getFormattedDate2(value, prop.dateFormat) : (U.isCloneOf(prop, 'ScheduledItem.start')  || U.isCloneOf(prop, 'ScheduledItem.end') ? G.U.getFormattedDate1(value) :  G.U.getFormattedDate(value))) }}</span>
</script>

<script type="text/template" id="durationPT">
  <span>{{= typeof displayName !== 'undefined' ? displayName : G.U.getFormattedDuration(value) }}</span>
</script>

<!--script type="text/template" id="datePT">
    <span>{{= new Date(value / 1000) }}</span>
</script -->

<script type="text/template" id="booleanPT">
  <span>{{= loc(typeof value === 'undefined' || !value ? 'no' : 'yes') }}</span>
</script>

<script type="text/template" id="intPT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="floatPT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="doublePT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="percentPT">
  <span>{{= value + '%' }}</span>
</script>

<script type="text/template" id="moneyPT">
  <span>{{= (typeof value.currency === 'undefined' ? '$' : value.currency) + (typeof value.value === 'undefined' ? (typeof value === 'number' ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0) : value.value) }}</span>
</script>

<!--script type="text/template" id="durationPT">
  <span>{{= typeof displayName != 'undefined' ? displayName : G.U.getFormattedDate(value) }}</span>
</script-->

<script type="text/template" id="complexDatePT">
  <span>{{= typeof displayName != 'undefined' ? displayName : (prop.dateFormat ?  U.getFormattedDate2(value, prop.dateFormat) : (U.isCloneOf(prop, 'ScheduledItem.start')  || U.isCloneOf(prop, 'ScheduledItem.end') ? G.U.getFormattedDate1(value) :  G.U.getFormattedDate(value))) }}</span>
</script>

<script type="text/template" id="resourcePT">
  <span><a style="text-decoration:none" href="{{= U.makePageUrl('view', value, obj.params) }}">{{= typeof displayName == 'undefined' ? value : displayName }}</a></span>
</script>

<!--script type="text/template" id="mapItemTemplate">
<span><a href="{{= U.makePageUrl('view', uri) }}">{{= typeof displayName == 'undefined' ? uri : displayName }} {{= image ? '<br />' + image : '' }} </a></span>
</script-->

<script type="text/template" id="mapItemTemplate">
  <!-- one map popup -->
  <ul style="list-style-type:none">
    <li><span><a href="{{= U.makePageUrl('view', uri) }}"> {{= resourceLink }} </a></span></li>
    {{ _.forEach(rows, function(val, key) { }} 
      <li>{{= key }}: {{= val.value }}</li>
    {{ }); }}
    {{ if (typeof image != 'undefined') { }}
    <span><a href="{{= U.makePageUrl('view', uri) }}"> {{= image ? '<br />' + image : '' }} </a></span>
    {{ } }}
  </ul>
</script>

<script type="text/template" id="imagePT">
  <img data-lazysrc="{{= value }}" class="lazyImage" data-for="{{= this.resource ? U.getImageAttribute(this.resource, prop.shortName) : '' }}"></img>
</script>


<script type="text/template" id="editListItemTemplate">
  <!-- one row of a list in edit mode -->
  <input data-formEl="true" name="{{= _uri + '.$.' + editProp }}" value="{{= editPropValue }}" /> 
  {{= viewCols }}
</script>


<script type="text/template" id="listItemTemplate">
<!-- bb one row on a list page -->
{{ var action = action ? action : 'view' }}
<div style="margin:0" data-viewid="{{= viewId }}">
{{ if (!obj.v_submitToTournament) { }}
  <div style="padding:1.25rem 0 1rem 90px;min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri) }}">
{{ } }}
{{ if (obj.v_submitToTournament) { }}
  <div style="padding:.7em 10px 0 90px; min-height:59px;position:relative;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
{{ } }}
  <img data-lazysrc="{{= typeof image != 'undefined' ? (image.indexOf('/Image') == 0 ? image.slice(6) : image) : G.getBlankImgSrc() }}"  
  {{ if (obj.right) { }}  
    style="position:absolute;
      left:-{{= left }}px; top:-{{= top }}px;
      clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px); {{= obj.mH ? 'max-height:' + mH + 'px;' : '' }} {{= obj.mW ? 'max-width:' + mW + 'px;' : '' }}"
  {{ } }}
  {{ if (!obj.right && obj.image) { }}
    style="max-height: 80px;position:absolute;max-height: 80px;max-width: 80px;margin-left:-90px; margin-top:-0.7em"
  {{ } }}  
  data-for="{{= U.getImageAttribute(this.resource, this.imageProperty) }}"
  class="lazyImage" />
  {{= viewCols }}
</div>
</div>
</script>

<script type="text/template" id="listItemTemplateNoImage">
<!-- one row on a list page (no image) -->
<div data-viewid="{{= viewId }}">
{{ if (!obj.v_submitToTournament) { }}  
  <div
  {{ if (obj.isJst) { }}
    style="padding: .7em 10px 10px 0px;"
  {{ } }}
  {{ if (!obj.isJst  &&  (obj._hasSubmittedBy || !obj.v_submitToTournament)) { }}
    style="padding: 1.25rem 1rem;"
  {{ } }}
{{ } }}
{{ if (obj.v_submitToTournament) { }}
  style="padding:.7em 10px 10px 0px;min-height:39px;"
{{ } }}
>
{{= viewCols }}
{{ if (U.isAssignableFrom(this.vocModel, 'model/study/QuizQuestion')  &&  obj.alreadyAnsweredByMe) { }}
  <div style="position:relative;float:right;margin-right:10px;"><i class="ui-icon-check" style="font-size:25px;color:red;"></i></div>
{{ } }}

{{ if (this.resource.isA('Buyable')  &&  price  &&  price.value) { }}
 <div class="buyButton" id="{{= G.nextId() }}" data-role="button" style="margin-top:15px;" data-icon="shopping-cart" data-iconpos="right" data-mini="true">
   {{= price.currency + price.value }}
   {{= price.value < 10 ? '&nbsp;&nbsp;&nbsp;' : price.value < 100 ? '&nbsp;&nbsp;' : price.value < 1000 ? '&nbsp;' : ''}}
 </div>
{{ } }}  
{{ if (this.resource.isA('Distance')  &&  obj.distance) { }}
  <span class="ui-li-count">{{= distance + ' mi' }}</span>
{{ } }}
{{= obj.showCount ? '<span class="ui-li-count">' + obj.showCount.count + '</span>' : '' }} 
{{ if (obj.comment) { }}
  <p style="padding:0.5rem 0 0 1.5rem;">{{= comment }}</p>
{{ } }}
{{ if (obj.defaultValue) { }}
  <div style="margin-left: 2rem;">({{= defaultValue.name }}: {{= defaultValue.value }})</div>
{{ }                       }}
</div>
</div>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
<!-- row divider / property group header in resource view -->
<header style="position:relative;{{= obj.style ? obj.style : G.coverImage ? 'color:' + G.coverImage.background + ';' : '' }}" class="{{= obj.class || '' }}">
{{= obj.displayCollapsed ? '<i class="ui-icon-plus-sign"></i> ': '' }}  
{{= obj.style ? '<div style="padding:1rem;display:inline-block;">' : '' }}
  {{= value }}
{{= obj.style ? '</div>' : '' }}
  {{ if (obj.add) { }}
    <a href="#" class="add cf lightText" style="cursor:pointer; position:absolute; right:10px;color:red;font-weight:bold;font-size:2rem;{{= obj.style ? 'top:2rem;' : '' }}" data-shortname="{{= shortName }}"><i class="ui-icon-plus"></i></a>
  {{ }              }}
</header>
</script>

<script type="text/template" id="menuItemTemplate">
<!-- one item on the left-side slide-out menu panel -->
<li style="position:relative;{{= obj.image ? 'padding-top: 0;padding-right:0px;' : 'padding-bottom:0px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} 
    {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + "/" + mobileUrl : pageUrl) + '"' : '' }} >
  
  <!-- {{ if (!obj.homePage) { }} -->   
  <img src="{{= obj.image || 'icons/blank.png'}}" class="thumb" 
  {{ if (obj.clip_right) { }}  
    style="
      right:-{{= right }}px; top:-{{= top }}px;
      clip:rect({{= top }}px, {{= clip_right }}px, {{= bottom }}px, {{= clip_left }}px);"
  {{ } }}
  {{ if (!obj.clip_right) { }}
    style="right: 0;"  
  {{ } }}
  /> 
  <!-- {{ } }} -->
  <div class="gradientEllipsis mi1" style="min-height:38px;max-width:100%;font-size:18px;margin-left:15px;{{= obj.image ? 'padding-top:10px;' : '' }}" 
    {{ if (obj.data) {                              }}
    {{   for (var d in data) {                      }}
    {{=    ' data-{0}="{1}"'.format(d, data[d])     }}
    {{   }                                          }}
    {{ }                                            }}
  >
  
  {{ if (obj.icon  &&  obj.homePage) { }}
    <i class="ui-icon-{{= icon }}" style="float-left; font-size: 20px; padding-right: 5px;"></i>
  {{ }               }}
    {{= title }}
    {{= obj.image || title.length < 20 || obj.social  ? '' : '<div class="dimmer">' }}
  </div>
  
  {{ if (obj.icon  &&  !obj.homePage) { }}
    <i class="ui-icon-{{= icon }} home"></i>
  {{ }               }}
</li>
</script>

<script type="text/template" id="menuItemNewAlertsTemplate">
<!-- Notifications item on the left-side slide-out menu panel -->
<li class="mi" {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }} data-href="{{= pageUrl }}">
  <div style="padding:15px 0 15px 15px;"  id="{{= typeof id === 'undefined' ? G.nextId() : id}}">
    {{= title }}   {{= obj.newAlerts ? '<span class="acounter">' +  newAlerts + '</span>' : '' }} 
  </div>
</li>
</script>

<script type="text/template" id="homeMenuItemTemplate">
<!-- app home page menu item -->
<li {{= obj.icon ? 'data-icon="' + icon + '"' : ''}} {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }}  id="{{= typeof id == 'undefined' ? 'home123' : id }}">
  <img src="{{= typeof image != 'undefined' ? image : G.getBlankImgSrc() }}" style="float: right;" /> 
  <a {{= typeof image != 'undefined' ? 'style="margin-left:35px;"' : '' }} target="#">
    {{= title }}
  </a>
</li>
</script>

<script type="text/template" id="menuHeaderTemplate">
  <!-- menu {{= G.coverImage ? ' style="color:' + G.coverImage.darkColor + ';"' : '' }}header -->
  <li {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} class="mi" style="margin: 15px 0 0 15px;"><i class="ui-icon-{{= icon }}"></i>
    {{= title }}
  </li>
</script>

<script type="text/template" id="propRowTemplate">
<!-- wrapper for one row on a list page (short) -->
<li class="section group" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>
  <div class="col span_1_of_2" {{= G.coverImage ? 'style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div>
  <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} style="font-weight: normal;">{{= value }}</div>
</li>
</script>

<script type="text/template" id="propRowTemplate2">
<!-- wrapper for one row on a list page (long) -->
<li class="section group" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>
  <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} {{= G.coverImage ? ' style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div>
  <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} style="font-weight: normal;">{{= value }}</div>
</li>
</script>

<script type="text/template" id="propRowTemplate3">
<!-- wrapper for one row on a list page (longest) -->
<li class="section group" data-shortname="{{= shortName }}" {{= obj.rules || '' }}><div class="col" style="font-weight: normal;font-family:Trebuchet MS;">{{= value }}</div></li>
</script>

<script type="text/template" id="menuHeaderTemplate">
<!-- menu {{= G.coverImage ? ' style="color:' + G.coverImage.darkColor + ';"' : '' }}header -->
<li {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} class="mi" style="margin: 15px 0 0 15px;"><i class="ui-icon-{{= icon }}"></i>
  {{= title }}
</li>
</script>

<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li data-propName="{{= shortName }}">
     {{ if (obj.prop && prop.where) _.extend(params, U.getQueryParams(prop.where)); }}
   <!--a target="#" data-shortName="{{= shortName }}" data-title="{{= title }}" class="cp">
     <i class="ui-icon-plus-sign"></i>
   </a-->
<p>
     <a {{= prop.lookupFrom ? 'data-lookupFrom=' + prop.lookupFrom : '' }} data-shortName="{{= shortName }}" href="{{= U.makePageUrl(action, range, params) }}" class="cpA">{{= name }}
     </a>
     <div style="color:{{= G.lightColor }};font-weight:bold;background:{{= G.darkColor }};display:inline;position:absolute;right:1rem;font-size: 1.5rem;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
</p>     
     {{ if (typeof comment != 'undefined') { }}
       <br/><p style="padding: 0.7rem 0;font-size:1.3rem;color:#808080; line-height:1.5rem;">{{= comment }}</p>
     {{ } }}
   </li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
<!-- readonly backlink in resource view -->
<li data-propName="{{= shortName }}">
<p>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     {{ if (obj.$order) { params.$orderBy = $order; params.$asc = $asc;} }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" class="cpA">{{= name }}
     
     <!--span class="ui-li-count">{{= value }}</span></a><a target="#" data-icon="chevron-right" data-iconshadow="false" class="cp" -->
     </a>
     <div style="{{= G.darkColor }}display:inline;position:absolute;right:1rem;font-size: 1.5rem;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
</p>     
   </li>
</script>

<script type="text/template" id="priceTemplate">
   <div data-role="button" data-shortName="{{= shortName }}" style="cursor: pointer;text-align:left; background:none; background-color: {{= color }}" href="#">
     {{= name }}<br/> 
     <span style="font-size: 20px;cursor:pointer;">{{= shortName == 'discount' ? '' : '$' }}{{= value }}{{= shortName == 'discount' ? '%' : '' }}</span>
   </div>
</script>

<script type="text/template" id="buyTemplate">
<!-- button for an important buyable resource on the resource's view page -->
<div>
   <a data-role="button" id="buy" data-ajax="false" class="ui-li-has-count" style="text-align:left; background:none; background-color: {{= color }}" href="{{= buyUrl }}">
      <span style="float:right;padding-left:3px;">Buy for<br/><span style="font-size: 20px;"> ${{= value }}</span></span><i class="ui-icon-shopping-cart" style="color:red; margin-left: -10px; font-size:35px;top:35%;"></i>
   </a>
</div>   
</script>

<script type="text/template" id="sellTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
<div>
   <a data-role="button" id="sell" data-ajax="false" class="ui-li-has-count" style="text-align:left; background:none;  padding: 6px 0;background-color: {{= background }}; color: {{= color }};" href="#">
      <span style="font-size: 24px; border: none;">Sell</span>
   </a>
</div>   
</script>

<script type="text/template" id="cpMainGroupTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!obj.value  &&  !chat) { }}  
   <a role="button" data-shortName="{{= shortName }}" data-title="{{= title }}" style="border:1px solid {{= borderColor }}; background-color: {{= color }}" href="#">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
   </a>
 {{ } }}
 {{ if (obj.value || obj.chat) { }}  
   <a role="button" data-propName="{{= shortName }}" style="border:1px solid {{= borderColor }}; background-color: {{= color }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
     
     <!-- {{= obj.value ? '<span class="counter">' + value + '</span>' :  ''  }} -->
     {{= obj.value ? '<div class="counter">' + value + '</div>' :  ''  }}
   </a>
 {{ } }}
</script>

<script type="text/template" id="cpMainGroupTemplateH">
<!-- button for an important backlink on a resource on the resource's view page (horizontal mode) -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!obj.value) { }}  
   <a role="button" data-shortName="{{= shortName }}" style="width:auto;padding:2px 10px;margin:3px;text-align:left; border: 1px solid #ccc;min-width:115px; {{= U.isAssignableFrom(this.vocModel, 'Tradle') ? 'float:right;color:#ddd;' : 'float:left;'}}  background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="#" data-title="{{= title }}">
      <span><i class="{{= icon }}" style="margin-left:-5px;padding-right:3px;"></i>{{= name }}</span> 
   </a>
 {{ } }}
 {{ if (obj.value) { }}  
   <a role="button" data-propName="{{= shortName }}"  style="width:auto;padding:2px 10px;margin:3px;text-align:left; border: 1px solid #ccc;min-width:115px; {{= U.isAssignableFrom(this.vocModel, 'Tradle') ? 'float:right;color:#ddd;' : 'float:left;'}} background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <!-- {{= obj.icon ? '<i class="' + icon + '" style="font-size:20px;top:35%"></i>' : '' }} -->
     <span>{{= obj.icon ? '<i class="ui-icon-star" style="font-size:20px;top:35%"></i>' : '' }} {{= name }}{{= value != 0 ? '<span style="float:right;color:#000;" class="counter">' + value + '</span>' : ''  }}</span>
   </a>
 {{ } }}
</script>

<script type="text/template" id="mapTemplate">
  <!-- map holder -->
  <div id="map" class="map" data-role="none"></div>
</script>

<script type="text/template" id="saveButtonTemplate">
<!-- header button for saving changes -->
<a target="#"><i class="ui-icon-ok"style="margin-left:-.7rem;padding-right:.7rem;color:#666;"></i><span style="position:absolute;top:7px;">Save</span></a>
</script>

<script type="text/template" id="cancelButtonTemplate">
<!-- header button for canceling changes -->
<a target="#"><i class="ui-icon-remove" style="margin-left:-.7rem;padding-right:.7rem;color:#666;"></i><span style="position:absolute;top:7px;">Cancel</span></a>
</script>

<script type="text/template" id="mapItButtonTemplate">
<!-- button that toggles map view -->
<a id="mapIt" target="#"><i class="ui-icon-map-marker"></i></a>
</script>

<script type="text/template" id="backButtonTemplate">
<!-- The UI back button (not the built-in browser one) -->
<a target="#" class="back" style="color: {{= G.darkColor }};"><i class="ui-icon-chevron-left"></i></a>
</script>

<script type="text/template" id="chatButtonTemplate">
<!-- Button that opens up a chat page -->
<a href="{{= url || '#' }}"><i class="ui-icon-comments-alt"></i>
  {{= '<span class="menuBadge">{0}</span>'.format(obj.unreadMessages || '') }}
</a>
</script>

<script type="text/template" id="videoButtonTemplate">
<!-- Button that toggles video chat -->
<a target="#" ><i class="ui-icon-facetime-video"></i>Video</a>
</script>

<script type="text/template" id="addButtonTemplate">
<!-- button used for creating new resources -->
<a target="#"><i class="ui-icon-plus" style="color: {{= G.darkColor }};"></i></a>
</script>

<script type="text/template" id="rightMenuButtonTemplate">
<!-- button that toggles the object properties panel -->
<a target="#" style="cursor: pointer; color: {{= G.darkColor }};"><i class="{{= obj.icon || 'ui-icon-reorder' }}"></i></a><!-- {{= (obj.title ? title : 'Properties') + '<span class="menuBadge">{0}</span>'.format(obj.count || '') }} -->
  {{= !this.viewId  ||  this.viewId.indexOf('viewHome') != -1 ? '' : '<span class="menuBadge">{0}</span>'.format(obj.newAlerts || '') }}
</span>
</script>

<script type="text/template" id="loginButtonTemplate">
<!-- button that summons the login popup -->
<a target="#"><i class="ui-icon-signin"></i></a>
</script>

<script type="text/template" id="paymentOptionsTemplate">
  <div class="section">
    <div class="section-content" style="margin:0 auto; padding-left:20px;padding-right:20px;">
      <div class="title-block">
        <h1 class="section-title">Payment Options</h1>
        {{ if (obj.amount) { }}
          <h2 style="padding:20px;color:#31B131;">Amount: {{= amount }}</h2>
        {{ }                 }}
      </div>
      <div class="group" style="text-align:center;">
        <div class="col span_1_of_1" style="width:100%;">
          <span>
            Currently we accept bitcoin payments here:
          </span>
          <div>
            <img src="images/tradle/bitcoinQRCode.png" style="display:block;margin: 0 auto;" />
            <input type="text" style="width:300px;" onfocus="Lablz.U.selectInputText(arguments[0]);" value="{{= '12vyT3q8UAADihwh8y214AEee79ZYXiMUH' }}" readonly="readonly" />
          </div>
        </div>
      </div>
    </div>
    <div class="section-footer">
      <span style="font-size:16px">
        We will soon be accepting payment via PayPal, Amazon, and debit/credit card
      </span>
    </div>
  </div>
</script>

<script type="text/template" id="blockchainInfoButtonTemplate">
  <div class="blockchainInfoBtn">
    <div class="blockchain stage-begin" style="display:none;">
      <a class="cta">Send us Bitcoin</a>
    </div>
    <div class="blockchain stage-ready" style="display:none;">
      <p align="center">Please send [[price_in_btc]] to Bitcoin Address: <b>[[address]]</b></p>
      <p align="center" class="qr-code"></p>
    </div>
    <div class="blockchain stage-paid" style="display:none;">
      <b>[[value]] BTC</b> Received. Thank You.
    </div>
    <div class="blockchain stage-error" style="display:none;">
      <font color="red">[[error]]</font>
    </div>
  </div>
</script>

<script type="text/template" id="buyPopupTemplate">
  <!-- popup for trial / purchase -->
  <div id="buy_popup" style="text-align: center; background: #eeeeee;" data-role="popup" data-transition="slidedown" data-overlay-theme="a" class="ui-content">
    <!-- a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a -->
    <div data-theme="c" role="main">
      <h4 id="buyMsg">{{= msg }}</h4>
      <a data-mini="true" data-role="button"  data-inline="true" id="buyLink" href="{{= href }}">{{= loc('buy') }}<span style="display:none;" id="buyName">{{= displayName }}</span></a> 
      <a data-mini="true" data-role="button"  data-inline="true" id="tryLink" href="{{= href }}">{{= loc('try') }}<span style="display:none;" id="buyName">{{= displayName }}</span></a> 
      <a data-mini="true" data-role="button"  data-inline="true" id="cancel" data-rel="back">{{= loc('cancel') }}</a> 
    </div>
  </div>
</script>

<script type="text/template" id="emailFormTemplate">
<div style="padding: 1rem;">
  <label for="firstName">First name</label>
  <input type="text" placeholder="First name" name="firstName" value="{{= firstName }}">
  <label for="lastName">Last name</label>
  <input type="text" placeholder="Last name" name="lastName" value="{{= lastName }}">
  <label for="email">Email</label>
  <input type="text" placeholder="Email address" name="email" value="{{= email }}" required="">
</div>
</script>

<script type="text/template" id="genericDialogTemplate">
  <!--div class="modal-popup" style="height: auto; background:{{= G.lightColor }}; color:{{= G.darkColor }};"-->
  <div class="modal-popup" style="height: auto; color: black; background: white;{{= obj.media ? 'margin:0;padding:0;width:100%;' : '' }}">
    {{ if (obj.header) { }}
      <h2 style="margin-bottom: 0; padding: 1rem 1rem; background:#eee; text-align:center;">{{= header }}</h2>
    {{ }                 }}
    
    {{ if (obj.media) { }}
    {{=  obj.media       }}
    {{ }                 }}
    
    {{ if (obj.ok === false && obj.cancel === false && obj.dismissible) { }}
      <div class="closeBtn"></div>
    {{ }                 }}
  
    {{ if (obj.ok || obj.cancel)                     { }}
    <div>
      {{ if (obj.title) { }}
      <h3 style="padding:1rem 1rem; font-weight:100;">{{= title }}</h3>
      {{ }                }}
      {{ if (obj.img) { }}
        <img src="{{= img }}" style="display:block; width: 100%;" />    
      {{ }              }}
      {{ if (obj.details) { }}
      <div style="padding:1rem 1rem; width:100%;box-sizing: border-box;">{{= details }}</div>
      {{ }                }}
      
      <div style="text-align:center;">
      {{ if (obj.cancel) { }}
      <a href="#" class="dialogBtn" data-cancel="true">{{= loc(typeof cancel === 'string' ? cancel : 'cancel') }}</a>
      {{ }                 }}
      
      {{ if (obj.ok) { }}
      <a href="#" class="dialogBtn actionBtn" data-ok="true">{{= loc(typeof ok === 'string' ? ok : 'ok') }}</a>
      {{ }                 }}
      </div>
    </div>
    {{ }                                              }}
  </div>
</script>

<script type="text/template" id="loginPopupTemplate">
{{ if (obj.msg) { }}
<span class="headerMessageBar" style="z-index: 100000; background: yellow;">
  {{= msg }}
</span>
{{ }              }}
<table id="login_popup" class="social-login modal-popup">
  <!--h2>LOGIN</h2-->
  <tr>
    <td class="facebook">
      <div class="encircled">
        <i class="big_symbol ui-icon-facebook"></i>
      </div>
      <br />
      <span>Login with Facebook</span>
    </td>
    <td class="twitter">
      <div class="encircled">
        <i class="big_symbol ui-icon-twitter"></i>
      </div>
      <br />
      <span>Login with Twitter</span>
    </td>
  </tr>
  <tr>
    <td class="linkedin" colspan="2">
      <div class="encircled">
        <i class="big_symbol ui-icon-linkedin"></i>
      </div>
      <br />
      <span>Login with LinkedIn</span>
    </td>
  </tr>
  <tr>
    <td class="google">
      <div class="encircled">
        <i class="big_symbol ui-icon-google-plus"></i>
      </div>
      <br />
      <span>Login with Google+</span>
    </td>
    <td class="live">
      <div class="encircled">
        <i class="big_symbol ui-icon-windows-live"></i>
      </div>
      <br />
      <span>Login with Live</span>
    </td>
  </tr>
</table>
</script>

<script type="text/template" id="socialConnectButtonTemplate">
  <li id="login">   
    <a target="#" data-icon="signin"></a>
  </li>
</script>

<script type="text/template" id="publishBtnTemplate">
  <!-- button to (re-)publish an app, i.e. a glorified 'Save App' button -->
  <a target="#" data-icon="book" id="publish" data-role="button" data-position="notext">{{= loc(wasPublished ? 'appChangedClickToRepublish' : 'publishAppWhenDone') }}</a>  
</script>

<script type="text/template" id="resetTemplateBtnTemplate">
<!-- button to reset a template to its default value -->
  <a target="#" id="resetTemplate" data-role="button" data-position="notext" data-mini="true">{{= loc('resetToDefault') }}</a>
</script>

<script type="text/template" id="doTryBtnTemplate">
  <!-- button that spirits you away to go try a particular app -->
  <a target="#" data-icon="circle-arrow-up" id="doTry" data-role="button" data-position="notext">{{= loc('gotoApp') }}</a>
</script>

<script type="text/template" id="installAppBtnTemplate">
  <!-- button that installs a given app when clicked -->
  <a target="#" data-icon="plus-sign" id="installApp" data-role="button" data-position="notext" style="background:#0F0;color:#FFF">{{= loc('install') }}</a>
</script>

<script type="text/template" id="forkMeBtnTemplate">
  <!-- a la Github's Fork It button, let's you clone an existing app -->
  <a target="#" data-icon="copy" id="forkMe" data-role="button" data-position="notext">{{= loc('forkMe') }}</a>
  <!-- a target="#" id="forkMe" role="button" style="font-size:1rem"><i class="ui-icon-circle-arrow-up"></i>&#160;{{= loc('forkMe') }}</a -->
</script>

<script type="text/template" id="enterTournamentBtnTemplate">
  <!-- button that will enter the user into a tournament -->
  <a target="#" data-icon="star" id="enterTournament" data-theme="e" data-role="button" data-position="notext">{{= loc('enterData') + ': ' + name }}</a>
</script>

<script type="text/template" id="testPlugBtnTemplate">
  <!-- button that allows you to test a script connecting two apps -->
  <a target="#" data-icon="bolt" id="testPlug" data-role="button" data-position="notext">{{= loc('testThisPlug') }}</a>
</script>

<script type="text/template" id="callInProgressHeaderTemplate1">
  <div id="backToCall" style="display:inline" width="99%">
    <a href="{{= url }}" data-role="none" style="font-size:20px">{{= {{= title }}</a>
  </div>
  <div id="sendToCall" style="display:inline;" width="1%">
    <!--a href="#" data-role="button" data-icon="upload" data-iconpos="notext">Send link to call</a-->
    <a href="#" data-role="none"><i class="ui-icon-upload" style="font-size:24px;padding-left:10px;"></i></a>
  </div>
</script>

<script type="text/template" id="callInProgressHeaderTemplate">
  <div class="ui-grid-d mygrid">
    <div class="ui-block-a" id="backToCall"><button data-icon="phone" data-iconpos="notext" data-inline="true" data-mini="true" style="background:#0f2">{{= loc('backToCall') }}</button></div>
    <div class="ui-block-b"></div>
    <div class="ui-block-c" id="sendToCall" style="text-align:center"><button data-icon="arrow-up" data-iconpos="notext" data-inline="true" data-mini="true">{{= loc('sendToCall') }}</button></div>
    <div class="ui-block-d"></div>
    <div class="ui-block-e" id="hangUp" style="text-align:right"><button data-icon="phone" data-iconpos="notext" data-inline="true" data-mini="true" style="background:#f02">{{= loc('hangUp') }}</button></div>
  </div>
</script>

<script type="text/template" id="callInProgressHeaderTemplate2">
  <ul data-role="listview" data-inset="true">
    <li id="backToCall" width="99%">
      <a href="{{= url }}" data-role="button" data-iconpos="notext" data-icon="phone">{{= title }}</a>
    </li>
    <li id="callFunctions">
      <a href="#" id="sendToCall" data-role="none" data-iconpos="notext" data-icon="upload" data-role="button">{{= loc('sendToCall') }}</a>
    </li>
  </ul>
</script>

<script type="text/template" id="headerTemplate">
<!-- the page header, including buttons and the page title, used for all pages except the home page -->
<div id="callInProgress"></div>
<div class="header" {{= obj.style ? style : 'style="background:#efefef;color:' + G.darkColor + '"' }} {{= obj.more || '' }} >
  <div class="hdr">
  <section role="region">
    <header style="background: none;height:inherit;">
    <ul class="headerUl" style="position:relative;">
    </ul>
    </header>
  </section>
  </div>
</div>
<div id="buttons" class="header2" style="white-space: nowrap; position:relative; height: 50px; background:{{= G.darkColor }};color:{{= G.lightColor }}">
  <div class="cf vcenteredR" style="z-index:1; width:20%;float:left;background:inherit;">
    <span class="placeholder"></span>
    {{ if (this.categories) { }}
       <div style="display:inline-block; margin-left: 5px; font-size: 1.5rem;">
         <a class="categories lightText" href="#">
           <i class="ui-icon-tags"></i>
         </a>
       </div> 
    {{ } }} 
    {{= this.moreRanges ? '<div style="margin:10px 0 0 10px; float:left"><a id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '<i class="ui-icon-tags"></i></a></div>' : '' }}
    {{ if (folder) { }}
      <a class="rootFolder actionBtn" style="display: none; padding: 4px 10px; margin-left: 5px; font-size: 1.5rem;" href="#">
        <i class="ui-icon-chevron-left" style="padding: 0px 3px 0px 0px"></i>
        <span>{{= folder.name }}</span>
      </a>
    {{ }                     }}
  </div>
  <div id="name" class="cf vcenteredR resTitle" style="z-index:0; width:60%;float:left;background:inherit;" align="center">
    <h4 id="pageTitle" style="text-overflow: ellipsis; font-weight:normal;color:{{= G.lightColor }};">{{= this.title }}</h4>
    {{= this.filter ? "<div class='filter'></div>" : "" }}
    <div align="center" class="headerButtons {{= obj.className || '' }}">
      <button style="max-width:200px; display: inline-block;" id="doTryBtn">
        {{ if (obj.tryApp) { }}
            {{= tryApp }}
        {{ } }}
      </button>
      <button style="max-width:200px; display: inline-block;" id="forkMeBtn">
        {{ if (obj.forkMeApp) { }}
            {{= forkMeApp }}
        {{ } }}
      </button>
      <button style="max-width:400px;" id="publishBtn" class="headerSpecialBtn">
        {{ if (obj.publishApp) { }}
            {{= publish }}
        {{ } }}
      </button>
      <button style="max-width:200px;" id="testPlugBtn" class="headerSpecialBtn">
        {{ if (obj.testPlug) { }}
            {{= testPlug }}
        {{ } }}
      </button>
      <button style="max-width:200px;" id="installAppBtn"  class="headerSpecialBtn">
        {{ if (obj.installApp) { }}
          {{= installApp }}
        {{ } }}
      </button>
      <button style="max-width:320px;" id="enterTournamentBtn" class="headerSpecialBtn">
        {{ if (obj.enterTournament) { }}
            {{= enterTournament }}
        {{ } }}
      </button>
      <button style="max-width:320px;" id="resetTemplateBtn" class="headerSpecialBtn">
        {{ if (obj.resetTemplate) { }}
            {{= resetTemplate }}
        {{ } }}
      </button>
    </div>
  </div>
  <div class="cf vcenteredR" style="z-index:1; width:20%;float:left;background:inherit;">
    {{ if (activatedProp) { }}
      <section class="activatable" style="float: right; display: none;">
        <label class="pack-switch">
          <input type="checkbox" name="{{= activatedProp.shortName }}" class="formElement boolean" {{= this.resource.get(activatedProp.shortName) ? 'checked="checked"' : '' }} />
          <span></span>
        </label>
      </section>
    {{ }                     }}
    {{ if (this.filter) { }}
      <div style="margin-right: 5px; float: right;"><a class="filterToggle lightText" href="#"><i class="ui-icon-search"></i></a></div> 
    {{ }                  }}
    <i class="help ui-icon-help" style="{{= this.hasQuickstart() ? '' : 'display:none;' }}"></i>
    <div style="clear:both;"></div>
  </div>
</div>
<div class="physicsConstants" style="display:none; background-color: #606060; color:#FFFFFF; display:none;"></div>
<div class="subClasses" style="display:none; padding: 5px; background-color:#ddd; display:none;"></div>
<div class="quickstart"></div>
</script>

<script type="text/template" id="subClassesTemplate">
{{ for (var i = 0; i < subClasses.length; i++) {  }}
{{  var c = subClasses[i];                        }}
  <label class="subClass {{= c.on ? 'actionBtn' : '' }}">
    <input type="radio" name="subClass" data-type="{{= c.type || '' }}" data-on="{{= !!c.on }}" value="{{= c.name }}" />
    {{= c.name }}
  </label>
{{ }                                              }}
</script>

<script type="text/template" id="searchTemplate">
  <!-- Filter conditions for complex queries -->
  <div class="searchBar">
    <input type="text" class="searchInput" style="font-family: tradle" placeholder="&#xe090; Search" />
  </div>
</script>  

<script type="text/template" id="filterTemplate">
  <!-- Filter conditions for complex queries -->
  <ul class="filterConditions" id="filterConditions">
  </ul>
</script>  

<script type="text/template" id="filterConditionTemplate">
<!--li class="filterCondition {{= obj.cancelable == false ? '' : 'cancelable' }}"-->
  <li class="filterCondition" id="filterCondition{{= G.nextId() }}">
  {{ if (obj.cancelable !== false) { }}
    <i class="ui-icon-remove-sign"></i>
  {{ }                 }}
    <i class="ui-icon-plus-sign"></i>
    <select class="propertySelector">
      <option value="_NO_PROP_">--Select property--</option>
      {{ for (var i = 0; i < props.length; i++) { }}
          <option value="{{= props[i].shortName }}">{{= U.getPropDisplayName(props[i]) }}</option>
      {{ }                                        }}
    </select>
    <div class="filterConditionInput">
    </div>
  </li>
</script>

<!--script type="text/template" id="filterConditionInputTemplate">
{{ switch (prop.range || prop.facet) { }}
{{ case 'boolean':                     }}
  <select>
    <option value="true" {{= obj.value == true ? 'selected' : '' }}>True</option>
    <option value="false" {{= obj.value == false ? 'selected' : '' }}>False</option>
  </select>
{{ break;                              }}
{{ case 'int':                         }}
{{ case 'long':                        }}
{{ case 'float':                       }}
{{ case 'double':                      }}
  <input type="number" value="{{= value }}" />
{{ break;                              }}
{{ case 'string':                      }}
{{ default:                            }}
  <input type="text" value="{{= value }}" />
{{ break;                              }}
{{ }                                   }}
</script-->

<script type="text/template" id="filterConditionInputTemplate">
{{ if (prop.range == 'boolean') { }}
  <select>
    <option value="true" {{= value == true ? 'selected' : '' }}>True</option>
    <option value="false" {{= value == true ? '' : 'selected' }}>False</option>
  </select>
{{ }                            }}

{{ if (~U.primitiveTypes.ints.indexOf(prop.range) || ~U.primitiveTypes.floats.indexOf(prop.range)) { }}
  <input type="number" value="{{= typeof value == 'undefined' ? '' : value }}" />
{{ }                            }}

{{ if (prop.range == 'string') { }}
  <input type="text" value="{{= value }}" />
{{ }                            }}
</script>

<script type="text/template" id="headerErrorBar">
  <div style="{{= obj.style || '' }}">
  {{= obj.info ? '<h3 class="headerInfo"><i class="ui-icon-' + (obj.icon || 'warning-sign') + '"></i> ' + info + '</h3>' : '' }}
  {{= obj.error ? '<h3 class="headerError">' + (obj.withIcon ? '<i class="ui-icon-ban-circle"></i>' : '') + error + '</h3>' : ''}}
  </div>
</script>

<script type="text/template" id="comment-item">
<td valign="top">
  <a href="{{= U.makePageUrl('view', submitter) }}" style="position:relative;"> 
    <img src="{{= obj['submitter.thumb'] }}" 
    
      {{ if (obj.top) { }}     
        style="position:absolute; left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
    />
  </a>
</td>
<td class="cl" style="padding-left:60px;" valign="top">
  <span class="commentListDate" style="float:right;">{{= G.U.getFormattedDate(submitTime, true) }}</span>
  <a href="{{= U.makePageUrl('view', submitter) }}">
    {{= obj['submitter.displayName'] }}
  </a><br/>
  {{= (typeof description == 'undefined') ? title : description }}
  <br/>
  <a href="#" style="font-size: 12px" class="like"><i class="ui-icon-heart-empty"></i></a>
  {{ if (obj.votes) { }} 
    <span>{{= votes.count ? votes.count : '' }}</span>
  {{ } }}
  <a href="#" style="float:right" id="reply">Reply</a>
</td>
</script>

<script type="text/template" id="masonry-mod-list-item">
  <div class="anab" data-viewid="{{= viewId }}">
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img data-lazysrc="{{= obj.resourceMediumImage || G.getBlankImgSrc() }}" border="0" 
        {{ if (typeof imgWidth != 'undefined') { }} 
         style="width: {{= imgWidth }}px; height:{{= imgHeight }}px;"
         {{ } }}
        
         data-for="{{= U.getImageAttribute(this.resource, 'resourceMediumImage') }}"
         class="lazyImage" />
      </a>
    </div>
  </div>
  <div class="nabRL">
  <table width="100%" class="modP">
    <tr>
      <td class="urbien" width="55px">
        <a href="{{= modifiedBy }}">
          <img data-lazysrc="{{= obj.v_modifiedByPhoto || G.getBlankImgSrc() }}" class="lazyImage" data-for="{{= U.getImageAttribute(this.resource, 'v_modifiedByPhoto') }}" border="0" />
        </a>
      </td>
      <td>
        <span class="action">{{= typeof v_action == 'undefined' ? '' : v_action }}</span>&#160;
        <div id="resourceHolder"><a href="{{= rUri }}" class="pLink">{{= obj.resourceDisplayName || this.resource.get('forResource.displayName') || '' }}</a></div>
        <br/><br/>&#160;
        <span class="commentListDate">{{= G.U.getFormattedDate(dateModified) }}</span>
      </td>
    </tr>
  </table>
  <div class="nabBtn" style="background:#eeeeee; padding: 10px 0 0 5px;margin:-3px;">
    {{ if (typeof v_showCommentsFor != 'undefined') { }}
      <!--a data-icon="comments" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor, '-makeId': G.nextId()}) }}">
      </a -->
      <a style="float:left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor.uri, '-makeId': G.nextId()}) }}">Comment
      </a>
      {{ if (v_showCommentsFor.count) { }}
        <a style="float:right; font-size:12px;" href="{{= U.makePageUrl('list', 'model/portal/Comment', {forum: v_showCommentsFor.uri}) }} "><span class="ui-icon-comment-alt"></span>{{= v_showCommentsFor.count }}</a>
      {{ } }}
      
    {{ } }}
    {{ if (typeof v_showVotesFor != 'undefined') { }}
      <!--a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}"> 
      </a -->
      <a class="like" style="float: left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}">
      {{ if (typeof v_showCommentsFor != 'undefined') { }}
         &#160;&#160;&#8226;
      {{ } }}
      &#160;&#160;Like 
      </a>
      {{ if (v_showVotesFor.count) { }}
      <div style="float:right; font-size:12px;"> 
        <a href="{{= U.makePageUrl('list', 'aspects/tags/Vote', {votable: v_showVotesFor.uri, $title: davDisplayName + ' liked by'}) }}"><span class="ui-icon-heart-empty"></span>{{= v_showVotesFor.count }}</a> 
      </div>
      {{ } }}
<!--          {{ if (v_showVotesFor.count) { }}
             v_showVotesFor.count
          {{ } }}
-->          
    {{ } }}
    <!--
    {{ if (typeof v_showRenabFor != 'undefined') { }}
      <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
      </a>
    {{ } }}
    -->
    </div>
  </div>
</script>

<script type="text/template" id="masonry-list-item">
  <!-- a masonry item brick -->
  
  <div class="galleryItem_css3">
    <a href="{{= obj.rUri || 'about:blank' }}">
      <img data-lazysrc="{{= obj.resourceMediumImage || G.blankImgDataUrl }}" {{= obj.width ? 'width="' + width + '"' : '' }} {{= obj.height ? 'height="' + height + '"' : '' }} class="lazyImage" data-for="{{= U.getImageAttribute(this.resource, imageProperty) }}" />
    </a>
  </div>
  <!-- {{= typeof friendsCount == 'undefined' ? '' : '<div class="appBadge">' + friendsCount + '</div>' }} -->
  {{= typeof friendMeCount == 'undefined' ? '' : '<div class="appBadge"><a style="color:white; position:absolute;" href="' + friendMeUri + '">' + friendMeCount + '</a></div>' }}
  <div class="nabRL">
    <div class="gridCols">
      {{= gridCols }}
    </div>
    {{ if (typeof v_showCommentsFor != 'undefined'  ||  typeof v_showVotesFor != 'undefined' ) { }}
      <!-- div style="background: #eeeeee; padding-top: 10px; padding-bottom: 0px;" class="btn" -->
      <div class="nabBtn">

        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a style="position:absolute;left:10px;" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor.uri, '-makeId': G.nextId()}) }}">Comment
          </a>
          {{ if (v_showCommentsFor.count) { }}
            <a style="position:absolute;right:40px;" href="{{= U.makePageUrl('list', 'model/portal/Comment', {forum: v_showCommentsFor.uri}) }} "><span class="ui-icon-comment-alt"></span>{{= v_showCommentsFor.count }}</a>
          {{ } }}
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <a style="position:absolute;left:70px;" class="like" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}">
          {{ if (typeof v_showCommentsFor != 'undefined') { }}
             &#160;&#160;&#8226;
          {{ } }}
          &#160;&#160;Like 
          </a>
          {{ if (v_showVotesFor.count) { }}
            <a style="position:absolute;right:10px;" href="{{= U.makePageUrl('list', 'aspects/tags/Vote', {votable: v_showVotesFor.uri, $title: davDisplayName + ' liked by'}) }}"><span class="ui-icon-heart-empty"></span>{{= v_showVotesFor.count }}</a> 
          {{ } }}
        {{ } }}
        <!--
        {{ if (typeof tryApp != 'undefined') { }}
            <a href="{{= tryApp }}">&#160;&#160;&#8226;&#160;&#160;<span style="color:#f54416;">Try</span></a>
        {{ } }}
        -->
     </div>
    {{ } }}
    {{ if (obj.v_submitForTournament) { }}
      <div><a  class="b" href="{{= v_submitForTournament }}" data-role="button" data-icon="star" data-theme="e">Submit an entry</a></div>
    {{ } }}
  </div>     
        {{= typeof isIdea == 'undefined' ? '' : '<p class="ui-li-aside ui-li-desc">Idea</p>'}}
</script>

<!--script type="text/template" id="gridColTemplate">
  <gridCol data-prop="{{= property }}">
    <span data-prop="{{= property }}" class="label">{{= label }}</span>
    {{ if (obj.href) { }}
      <a href="{{= obj.href }}">{{= value }}</a>
    {{ }               }}
    
    {{ if (!obj.href) { }}
      <span>{{= value }}</span>
    {{ }               }}
  </gridCol>
</script-->

<script type="text/template" id="fileUpload">
  <!-- a file upload form -->
  
  <form data-ajax="false" id="fileUpload" action="#" method="POST" enctype="multipart/form-data">
    <div data-role="fieldcontain">
      <input {{= rules }} type="file" name="{{= name }}" id="file" />
      <input {{= rules }} type="hidden" name="uri" value="{{= forResource }}" />
      <input name="-$action" type="hidden" value="upload" />
      <input name="type" type="hidden" value="{{= type }}" />
      <input name="location" type="hidden" value="{{= G.serverName + '/wf/' + location }}" />
      <input name="$returnUri" type="hidden" value="{{= window.location.href }}" />
    </div>
  </form>
</script>

<script type="text/template" id="horizontalListItem">
  <a style="position:absolute" href="{{= target }}">
    {{ if (obj.image) { }}
      <img data-lazysrc="{{= image }}" class="lazyImage" data-for="{{= U.getImageAttribute(this.resource, imageProperty) }}" 
      {{ if (obj.right) { }}  
          style="position:absolute; left:-{{= left }}px; top:-{{= top }}px;
          clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      />    
    {{ }              }}
  </a> 
  <div class="phOverlay">
    {{= obj.title ? '<h3>{0}</h3>'.format(obj.title) : '' }}
    {{= obj.caption  &&  obj.caption.trim() ? '<p>{0}</p>'.format(obj.caption) : '' }}
    {{= typeof obj.superscript !== 'undefined' ? '<p class="ui-li-aside">{0}</p>'.format(superscript) : '' }}
  </div>
</script>

<script type="text/template" id="intersectionListItemTemplate">
  <li data-viewid="{{= viewId }}"> {{= a + b }} </li>
</script>

<script type="text/template" id="intersectionListItemTemplate">
  <li data-viewid="{{= viewId }}">
    {{= a }}
    {{= b }}
  </li>
</script>

<script type="text/template" id="photogridTemplate">
  <!-- an image grid with per-image overlays -->

    <ul data-role="listview" data-inset="true" data-filter="false" style="width:100%; list-style-type:none">
    {{ for (var i = 0; i < items.length; i++) { }}
    {{   var item = items[i];                   }}
<!--      <li style="{{= ('float: ' + (item.float || 'left')) + (i > 0 && i < items.length - 1 ? ';margin-left: 13%; margin-right:13%;' : '') }}">    -->
      <li style="{{= (item.width ? ';width:' + item.width : '') + (item.height ? ';height:' + item.height : '') + (item.margin ? ';margin:' + item.margin : '') }}">
        <a href="{{= item.target }}">
          {{ if (item.image) { }}
            <img data-lazysrc="{{= item.image }}" class="lazyImage" data-for="{{= U.getImageAttribute(item, item.imageProperty) }}" />    
          {{ }              }}

          {{= item.title ? '<h3>{0}</h3>'.format(item.title) : '' }}
          {{= item.caption ? '<p>{0}</p>'.format(item.caption) : '' }}
          {{= typeof item.superscript !== 'undefined' ? '<p class="ui-li-aside">{0}</p>'.format(item.superscript) : '' }}
        </a> 
      </li>
      {{ if (item.arrow) { }}
         <li class="connect" style="padding:0px; border:0;"><i class="ui-icon-chevron-right"></i></li>
         <!--li style="float: left; top:60px; padding:0px; border:0;" data-inset="false"><i style="color: #FFC96C; font-size:20px;" class="ui-icon-chevron-right"></i></li-->
      {{ }                 }}
    {{ } }}
    </ul>
</script>

<script type="text/template" id="messageListTemplate">
<!-- collapsible error list -->

{{  _.each(messages, function(msg) {  }}
     <span style="display:block;position:relative;" id="{{= msg.id }}" class="headerMessageBar {{= msg['class'] || obj['class'] || '' }}">
  {{ if (msg.link) {            }}
       <a href="{{= msg.link }}">
  {{ }                        }}
  {{ if (msg.icon) {    }}
       <i class="ui-icon-{{= msg.icon }}"></i>
  {{ }                  }}
  
    {{= msg.message }}
    
  {{ if (msg.link) {            }}
       </a>
  {{ }                        }}
  
  {{ if (!msg.link && msg.icon) {    }}
       <i class="ui-icon-{{= msg.icon }}"></i>
  {{ }                               }}
       <i class="ui-icon-remove closeparent" style="position:absolute;right:5px"></i>
     </span>
{{  });                           }}

</script>

<script type="text/template" id="physicsConstantsTemplate">
{{ for (var p in constants) { }}
  <div>
    <label for="{{= p }}">{{= p.splitCamelCase(true) }}</label><br/>
    <input type="range" id="{{= p }}" name="{{= p }}" value={{= constants[p] * 100 }} min="1" max="99">
  </div>  
{{ }                    }}
  <!--div>
    <label for="degree">Sensitivity</label><br/>
    <input type="range" id="degree" name="degree" value={{= degree }} min="-10" max="10">
  </div-->
</script>

<script type="text/template" id="stockChartsTemplate">
<!--div class="row">
    <div class="yearly-bubble-chart dc-chart">
        <p class="chartHeading">Yearly Performance</p> (radius: fluctuation/quote ratio, color: gain/loss)
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>
</div-->

<div class="row">
    <div class="gain-loss-chart">
        <p class="chartHeading">Days by Gain/Loss</p>
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>

    <div class="quarter-chart">
        <p class="chartHeading">Quarters</p>
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>

    <div class="day-of-week-chart">
        <p class="chartHeading">Day of Week</p>
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>

    <div class="fluctuation-chart">
        <p class="chartHeading">Days by Fluctuation (%)</p>
        <span class="reset" style="display: none;">range: <span class="filter"></span></span>
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>
</div>

<div class="row">
    <div class="monthly-move-chart">
        <p class="chartHeading">Monthly Quote Abs Move & Volume/500,000 Chart</p>
        <span class="reset" style="display: none;">range: <span class="filter"></span></span>
        <a class="reset" style="display: none;">(reset)</a>
        <div class="clearfix"></div>
    </div>
</div>

<div class="row">
    <div class="monthly-volume-chart">
    </div>
    <p class="muted pull-right" style="margin-right: 15px;">select a time range to zoom in</p>
</div>

</script>

<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 
<!--div class="headerMessageBar"></div-->
  <div class="headerDiv"></div>
  <div id="resourceEditView">
  <!-- div id="resourceImage"></div -->
  <form data-ajax="false" id="{{= viewId + '_editForm'}}" action="#">
  <section data-type="list">
    <ul id="fieldsList" class="editList">
    </ul>
  </section>
    <div name="errors" style="float:left"></div>
    {{ if (this.resource.isAssignableFrom("InterfaceImplementor")) { }}
    <div data-role="fieldcontain" id="ip">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><a target="#" id="check-all" data-icon="check" data-role="button" data-mini="true">{{= loc('checkAll') }}</a></div>
        <div class="ui-block-b"><a target="#" id="uncheck-all" data-icon="sign-blank" data-role="button" data-mini="true">{{= loc('uncheckAll') }}</a></div>
      </fieldset>
      <fieldset data-role="controlgroup" id="interfaceProps">
      </fieldset>
    </div>
    {{ }                                                             }}
  </form>
  
  {{ if (U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"))) { }}
    <br/><table class="ui-btn-up-g" width="100%" style="padding: 5px" id="comments">
    </table>
  {{ } }}
</div>
</script>


  <!--div data-role="footer" class="ui-bar" data-theme="d">
     <a data-role="button" data-icon="repeat" id="homeBtn" target="#">Home</a>
  </div-->
</script>

<script type="text/template" id="mvListItem">
<!-- a multivalue input for edit forms -->
{{ var id = G.nextId() }}
<label class="pack-checkbox">
  <input type="checkbox" name="davDisplayName" id="{{= id }}" value="{{= _uri }}" {{= obj._checked ? 'checked="checked"' : '' }} />
  <span></span>
</label>
<label for="{{= id }}">{{= this.hashParams.$gridCols && viewCols ? viewCols : davDisplayName }}<!-- {{= obj._thumb ? '<img src="' + _thumb + '" style="float:right;max-height:40px;" />' : '' }}--></label>
</script>

<script type="text/template" id="interfacePropTemplate">
  <!-- a interface props chooser input for edit forms -->
  <div class="ui-controlgroup-controls">
    {{ var id = G.nextId() }}
    <!-- input data-formel="true" type="checkbox" name="interfaceClass.properties" id="{{= id }}" value="{{= interfaceProps }}" {{= typeof _checked === 'undefined' ? '' : 'checked="checked"' }} / -->
    <input data-formel="true" data-mini="true" type="checkbox" {{= obj.disabled ? 'disabled' : '' }} name="interfaceProperties" id="{{= id }}" value="{{= interfaceProps }}" {{= obj._checked ? 'checked="checked"' : '' }} />
    <label for="{{= id }}">
      {{= davDisplayName }} 
      {{= obj.required ? '(Required)' : '' }}
      {{= obj.comment ? '<br><span style="font-size:12px;font-weight:normal;">' + comment + '</span>' : '' }}
    </label>
  </div>
</script>


<script type="text/template" id="editRowTemplate">
  <!-- one property row in edit mode -->
  <li data-role="fieldcontain">{{= value }}</li>
</script>

<script type="text/template" id="shortEnumPET">
  <fieldset data-role="controlgroup" data-type="horizontal" data-mini="true">
    <legend>{{= name }}</legend>
    {{ for (var o in options) { }} 
    {{   var p = options[o], displayName = U.getPropDisplayName(p); }}
         <input type="radio" name="radio-choice-b" name="radio-choice-b" id="{{= id + '.' + displayName }}" {{= rules }} value="{{= displayName }}" {{= typeof value !== 'undefined' && o === value ? 'checked="checked"' : '' }} />
         <label for="{{= id + '.' + displayName }}">{{= displayName }}</label>
    {{ } }}
  </fieldset>
</script>

<script type="text/template" id="stringPET">
<div class="_prim"
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 250; }}
  {{ if (obj.name) { }}
    ><label for="{{= id }}" class="ui-input-text" style="{{= isInput ? '' : 'vertical-align:top;' }}color:{{= G.darkColor }};">{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="3" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}  class="ui-input-text">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!obj.name) { }}
  style="text-align:center;"><div> 
    <{{= isInput ? 'input type="text"' : 'textarea  rows="10" style="width:95%;"' }} name="{{= shortName }}" id="{{= id }}"  value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}>{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  </div>
  {{ } }}
</div>   
</script>

<script type="text/template" id="percentPET">
<div class="_prim">
  <label for="{{= id }}"  class="ui-input-text" >{{= name }}</label>
  <input type="range" name="{{= shortName }}" id="{{= id }}" value="{{= obj.value ? value : '0' }}" {{= rules }} data-mini="true" max="100" min="0" style="width:65%;vertical-align:middle;" onchange="document.getElementById(event.target.id + '_text').innerHTML = event.target.value + '%';"/>
  <div id="{{= id }}_text" style="display:inline-block;vertical-align:middle;padding-left:.5rem;font-size:2rem;color:#7aaac3;font-weight:bold;"></div>
</div>
</script>

<script type="text/template" id="booleanPET">
<div class="_prim">
  {{ if (name && name.length > 0) { }}
    <label for="{{= id }}" style="color:{{= G.darkColor }}">{{= name }}</label>
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  {{ } }}
  <section>
  <label class="pack-switch" style="right: 2rem;top:0rem;left:auto;position:absolute;color:{{= G.darkColor }};">
    <input type="checkbox" {{= prop.editDisabled ? 'disabled="disabled"' : '' }} name="{{= shortName }}" id="{{= id }}" class="formElement boolean" {{= obj.value ? 'checked="checked"' : '' }} />
    <span style="top:2rem"></span>
  </label>
  </section>
<!--  {{= typeof comment == 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }} -->
</div>
</script>

<script type="text/template" id="emailPET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text" style="color:{{= G.darkColor }};">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' }}ui-input-text" {{= rules }} />
</div>
</script>

<script type="text/template" id="hiddenPET">
  <input type="hidden" name="{{= shortName }}" id="{{= id }}" value="{{= value }}" class="{{= 'formElement ' }}ui-input-text" {{= rules }} />
</script>

<script type="text/template" id="longEnumPET">
<div class="_prim">
  {{ if (name && name.length > 0) { }}
  <label for="{{= id }}" class="select" style="color:{{= G.darkColor }};">{{= name }}</label>
  {{ } }}
  
  <select name="{{= shortName }}" id="{{= id }}" data-mini="true" {{= rules }} >
    {{= value ? '<option value="{0}">{0}</option>'.format(value) : '' }}
    {{ _.each(options, function(option) { }} 
    {{   if (option.displayName === value) return; }}
    {{   var val = option.displayName; }}
    <option value="{{= val }}">{{= val }}</option>
    {{ }); }}
  </select>
</div>
</script>


<script type="text/template" id="moneyPET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text" style="color:{{= G.darkColor }}; white-space:nowrap;">{{= name }} <b>{{= typeof value.currency === 'undefined' ? '($)' : value.currency }}</b></label>
  <input type="text" name="{{= shortName }}" id="{{= id }}" value="{{= obj.value ? value : '' }}" {{= rules }} class="ui-input-text"></input>
</div>
</script>

<script type="text/template" id="datePET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input id="{{= id }}" name="{{= shortName }}" {{= rules }} class="i-txt ui-input-text" value="{{= value }}" />
</div>
</script>

<script type="text/template" id="resourcePET">
  {{ if (prop.range && ((isImage && prop.camera) || isVideo || isAudio)) { }}
    <a href="#cameraPopup" class="cameraCapture" target="#" data-prop="video">
      <i class="{{= isVideo ? 'ui-icon-facetime-video' : isAudio ? 'ui-icon-circle' : 'ui-icon-camera' }}"></i>
    </a>
    {{ if (!G.canWebcam) { }}
      <input data-role="none" type="file" class="cameraCapture" accept="{{= isVideo ? 'video/*' : isAudio ? 'audio/*' : 'image/*' }};capture=camera;" style="visibility:hidden; display:none;" data-prop="{{= shortName }}" />
    {{ }                   }}
  {{ }                                                                                                                                                                                        }}

  <!-- a target="#"  name="{{= shortName }}" {{= !obj.img ? 'style="padding-top:0.5rem;"' : ''}} class="resourceProp" id="{{= id }}" {{= rules }} --> 
  <a target="#"  name="{{= shortName }}" style="{{= !obj.img ? '' : 'padding: 0 1.5rem;'}}" class="resourceProp" id="{{= id }}" {{= rules }}> 
    {{ if (obj.img) { }}    
      <img name="{{= shortName }}" src="{{= img }}" style="
      
      {{ if (typeof obj.width != 'undefined') { }}  
          height:{{= height }}px;
          left:-{{= left }}px; top:-{{= top }}px;
          clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);vertical-align
          :middle;"
      {{ } }}
      {{ if (typeof obj.width == 'undefined') { }}  
          max-height: 50px;
      {{ } }}
      
      "/>
    {{ }              }}
    
    <label for="{{= id }}" style="font-weight:normal;color:{{= G.darkColor }};">{{= name }}</label>
    {{= typeof displayName === 'undefined' || !displayName ? (typeof value === 'undefined' ||  value.length == 0 ? '' : value) : displayName }}
    {{ if (!obj.value) { }}
      {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }}
    {{ } }} 
    <div class="triangle"></div>
  </a>
  
  <!-- {{= typeof multiValue === 'undefined' ? '' : value }} -->
</script>
<script type="text/template" id="telPET">
<div class="_prim">
  <label for="{{= id }}" class="ui-input-text" style="color:{{= G.darkColor }};">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" class="ui-input-text" value="{{= typeof value === 'undefined' ? '' : value }}" />
</div>
</script>

<script type="text/template" id="srcPT">
  <div class="_prim" data-type="src" style="padding-left:0;">
    {{= value }}
  </div>
</script>

<script type="text/template" id="cameraPopupTemplate">
  <div data-role="popup" id="cameraPopup" data-overlay-theme="a" data-dismissible="false" class="ui-content ui-body-d">
    <div>
    {{ if (obj.video || obj.image) { }}
      <video id="camVideo" autoplay="autoplay"></video>
      <canvas id="canvas" width="100%" height="0"></canvas>
    {{ }                }}
    {{ if (obj.video || obj.audio) { }}
      <div id="camPreview">
      </div>
    {{ }                }}
    </div>
    <a href="#" data-rel="back" data-role="button" id="cameraCancelBtn" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right">Close</a>
    <div style="text-align:center">
      <a data-role="button" data-icon="{{= obj.video || obj.audio ? 'circle' : 'camera' }}" id="cameraShootBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">{{= obj.video || obj.audio ? 'Record' : 'Shoot' }}</a>
      <a data-role="button" data-icon="ok" id="cameraSubmitBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">I'll take it</a>
    </div>
  </div>
</script>

<script type="text/template" id="multivaluePET">
  <a target="#" name="{{= shortName }}" class="multivalueProp" >{{= typeof displayName === 'undefined' || !displayName ? name : displayName }}
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  </a>
</script>

<script type="text/template" id="scrollEnumPET">
  <label for="{{= id }}">{{= name }}</label>
  <input id="{{= id }}" class="i-txt" name="{{= shortName }}" {{= rules }} data-mini="true" value="{{= value }}" />
</script>

<!-- END EDIT TEMPLATES -->

<script type="text/template" id="gaugesTemplate">
{{ for (var i = 0; i < gauges.length; i++) { }}
{{ var gauge = gauges[i];                    }}
  <div class="gauge">
    <div class="gaugeTextfield"></div>
    <canvas id="{{= gauge.shortName }}Gauge" data-shortname="{{= gauge.shortName }}"></canvas>
    <label for="{{= gauge.shortName }}">{{= gauge.name }}</label>
  </div>
{{ }                                         }}
</script>

</div>
