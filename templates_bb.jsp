<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <!-- Resource list page -->
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 
  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
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

<script type="text/template" id="resource">
  <!-- Single resource view -->  
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 

  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="resourceViewHolder">
    <div style="width: 100%;position:relative;padding-right:10px;overflow:hidden">

      {{ if (this.isImageCover) { }} 
        <div id="resourceImage" style="position:absolute;z-index:1"></div>
        <div data-role="footer" class="thumb-gal-header hidden" 
          style="opacity:0.7;position:absolute;top:251px;width:100%;background:#eee;text-shadow:none;color:{{= G.darkColor }};"><h3></h3></div>    
        <div id="mainGroup" style="top:0px;right:1.3rem;"></div>
      {{ } }}
      {{ if (!this.isImageCover) { }}
        <div id="resourceImage" style="width:50%;float:left;margin:0; padding:0;{{= U.getArrayOfPropertiesWith(this.vocModel.properties, "mainGroup") &&  U.isA(this.vocModel, 'ImageResource') ? 'min-height:210px;' : ''}}" ><!-- style="width:auto" --></div>
        <div id="mainGroup" style="right:1.3rem;"></div>
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
    
    <section data-type="list">
      <ul id="resourceView" style="padding:10px;">
      </ul>
    </section>
    <div id="about" class="hidden" style="padding: 7px;"></div>
    
    {{ if ($('#other')) { }}
      <!--br/>
      <br/-->
    {{ } }}
    <section data-type="list">
      <ul id="cpView" style="margin: -10px 0 0 10px;">
      </ul>
    </section>
  </div>
  <!--div data-role="footer" class="ui-bar">
     <a data-role="button" data-shadow="false" data-icon="repeat" id="homeBtn" target="#">Home</a>
     <a data-role="button" data-shadow="false" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">{{= loc('edit') }}</a>
  </div-->
  <br/>
</script>  

<script type="text/template" id="inlineListItemTemplate">
<!-- one row of an inline backlink in view mode -->
<li data-viewid="{{= viewId }}">
  <a href="{{= _uri }}" {{= obj._problematic ? 'class="problematic"' : '' }}>
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
    <span style="position:absolute;padding:1rem 0 1rem 0;font-size:1.6rem;font-weight:bold;">{{= name }}{{= obj.gridCols ? '<br/>' + gridCols : '' }}</span>
  </a>
  {{ if (typeof comment != 'undefined') { }}
    <p>{{= comment }}</p>
  {{ } }}
  </a>
</li>
</script>

<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li data-propName="{{= shortName }}">
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     
   <a target="#" data-shortName="{{= shortName }}" data-title="{{= title }}" class="cp">
     <i class="ui-icon-plus-sign"></i>
   </a>
<p>
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" class="cpA">{{= name }}
     </a>
     <div style="display:inline;position:absolute;right:4rem;font-size: 11px;top:1.5rem;border-radius:1rem;border: 1px solid #777;padding: 0.1rem 0.3rem;">{{= value }}</div>
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
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" class="cpA">{{= name }}
     
     <!--span class="ui-li-count">{{= value }}</span></a><a target="#" data-icon="chevron-right" data-iconshadow="false" class="cp" -->
     </a>
     <div style="display:inline;position:absolute;right:4rem;top:1rem;font-size: 11px;border-radius:1rem;border: 1px solid #777;padding: 0.1rem 0.3rem;">{{= value }}</div>
</p>     
   </li>
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
   <a role="button" data-shortName="{{= shortName }}" style="width:auto;margin:5px;text-align:left; border: 1px solid #ccc; min-width:115px; float:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="#" data-title="{{= title }}">
      <span>{{= obj.icon ? '<i class="' + icon + '" style="margin-left:-5px;"></i>' : '' }} {{= name }}</span> 
   </a>
 {{ } }}
 {{ if (obj.value) { }}  
   <a role="button" data-propName="{{= shortName }}" style="width:auto;margin:5px;text-align:left; border: 1px solid #ccc; min-width:115px;float:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <!-- {{= obj.icon ? '<i class="' + icon + '" style="font-size:20px;top:35%"></i>' : '' }} -->
     <span>{{= obj.icon ? '<i class="ui-icon-star" style="font-size:20px;top:35%"></i>' : '' }} {{= name }}{{= value != 0 ? '<span style="float: right;position:relative;margin:-17px -10px 0 0;" class="ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span>' : ''  }}</span>
   </a>
 {{ } }}
</script>


<script type="text/template" id="listItemTemplate">
  <!-- bb one row on a list page -->
  {{ var action = action ? action : 'view' }}
  <div style="margin:0" data-viewid="{{= viewId }}">
  {{ if (!obj.v_submitToTournament) { }}
    <div style="padding:1.25rem 0 1.25rem 90px;{{= obj.image ? 'min-height:59px;' : '' }}" data-uri="{{= U.makePageUrl(action, _uri) }}">
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    <div style="padding:.7em 10px 0 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
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
  </div>
  </div>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
  <!-- row divider / property group header in resource view -->
  <header {{= G.coverImage ? 'style="color:' + G.coverImage.background + ';border-bottom:1px solid ' + G.coverImage.background + ';"' : '' }}>{{= value }}</header>
</script>

<script type="text/template" id="saveButtonTemplate">
  <!-- header button for saving changes -->
  <a target="#"><i class="ui-icon-ok"></i></a>
</script>

<script type="text/template" id="cancelButtonTemplate">
  <!-- header button for canceling changes -->
  <a target="#"><i class="ui-icon-remove"></i></a>
</script>

<script type="text/template" id="mapItButtonTemplate">
  <!-- button that toggles map view -->
  <a id="mapIt" target="#"><i class="ui-icon-map-marker"></i></a>
</script>

<script type="text/template" id="backButtonTemplate">
  <!-- The UI back button (not the built-in browser one) -->
  <a target="#" class="back"><i class="ui-icon-chevron-left"></i></a>
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
  <a target="#"><i class="ui-icon-plus-sign"></i></a>
</script>

<script type="text/template" id="menuButtonTemplate">
  <!-- button that toggles the menu panel -->
  <a target="#" href="#{{= viewId }}"><i class="ui-icon-reorder"></i>
    {{= '<span class="menuBadge">{0}</span>'.format(obj.newAlerts || '') }}
  </a>
</script>

<script type="text/template" id="rightMenuButtonTemplate">
  <!-- button that toggles the object properties panel -->
  <a target="#" href="#{{= viewId }}"><i class="{{= obj.icon || 'ui-icon-reorder' }}"></i></a><!-- {{= (obj.title ? title : 'Properties') + '<span class="menuBadge">{0}</span>'.format(obj.count || '') }} -->
    {{= '<span class="menuBadge">{0}</span>'.format(obj.newAlerts || '') }}
  </a>
</script>

<script type="text/template" id="loginButtonTemplate">
  <!-- button that summons the login popup -->
  <a target="#"><i class="ui-icon-signin"></i></a>
</script>

<script type="text/template" id="loginPopupTemplate">
  <!-- login popup with various social network based logins -->
  {{ var canDismiss = typeof dismissible === 'undefined' || dismissible == true; }}
  <section id="login_popup" role="region" class="loginPopup">
  <ul class="compact">
    <h4 style="margin:10px 0;color:#757575;" id="loginMsg">{{= msg }}</h4>
    {{ _.forEach(nets, function(net) { }} 
<li>
    <a role="button" href="{{= net.url }}" class="lpButton" {{= net.name == 'Facebook' ? ' target="_top"' : '' }}>
      <i class="big_symbol 
      {{ if(net.name == "Facebook") { }} ui-icon-facebook-sign {{ } }}
      {{ if(net.name == "Google") { }} ui-icon-google-plus-sign {{ } }}
      {{ if(net.name == "Twitter") { }} ui-icon-twitter-sign {{ } }}
      {{ if(net.name == "LinkedIn") { }} ui-icon-linkedin-sign {{ } }}
      {{ if(net.name == "Live") { }} ui-icon-live-sign {{ } }}
        ">
       </i>
     <span>{{= net.name }}</span>
    </a>
</li>
    {{ }); }}
</ul>
    <!--h5>Login by Email</h5>
    <form id="loginForm" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
      <table>
        <tr><td>Email: </td><td><input name="j_username" /></td></tr>
        <tr><td>Password: </td><td><input type="password" name="j_password" /></td></tr>
        <tr><td colspan="2"><input type="submit" value="Submit" /></td></tr>
      </table>
    </form-->
  </section>
</script>

<script type="text/template" id="genericDialogTemplate">
<section role="region" class="loginPopup" id="{{= id }}">
  {{ if (obj.header) { }}
  <div data-role="header" id="header" class="ui-corner-top">
    <h1>{{= header }}</h1>
  </div>
  {{ }                 }}
  
  {{ if (obj.ok === false && obj.cancel === false) { }}
    <a href="#" data-cancel="cancel" data-rel="back" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>
  {{ }                 }}

  <div data-role="content" class="ui-corner-bottom ui-content">
    {{= obj.title ? '<h3 class="ui-title">{0}</h3>'.format(title) : '' }}
    {{ if (obj.img) { }}
      <img src="{{= img }}" style="display:block" />    
    {{ }              }}
    {{= obj.details ? '<p style="display:block">{0}</p>'.format(details)                 : '' }}
    
    <div style="display:block">
    {{ if (obj.cancel) { }}
    <a href="#" role="button" data-cancel="" class="lpButton">{{= loc(typeof cancel === 'string' ? cancel : 'cancel') }}</a>
    {{ }                 }}
    
    {{ if (obj.ok) { }}
    <a href="#" role="button" data-ok="" class="lpButton">{{= loc(typeof ok === 'string' ? ok : 'ok') }}</a>
    {{ }                 }}
    </div>
  </div>
</section>
</script>

<script type="text/template" id="logoutButtonTemplate">
  <li id="logout">
    <a id="logout" target="#" data-icon="signout">{{= loc('signOut') }}</a>
  </li>
</script>

<script type="text/template" id="publishBtnTemplate">
  <!-- button to (re-)publish an app, i.e. a glorified 'Save App' button -->
  <a target="#" data-icon="book" id="publish" data-role="button" data-position="notext">{{= loc(wasPublished ? 'appChangedClickToRepublish' : 'publishAppWhenDone') }}</a>
</script>

<script type="text/template" id="resetTemplateBtnTemplate">
<!-- button to reset a template to its default value -->
<a target="#" data-icon="retweet" id="resetTemplate" data-role="button" data-position="notext" data-mini="true">{{= loc('resetToDefault') }}</a>
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
</script>

<script type="text/template" id="enterTournamentBtnTemplate">
  <!-- button that will enter the user into a tournament -->
  <a target="#" data-icon="star" id="enterTournament" data-role="button" data-position="notext">{{= loc('enterData') + ': ' + name }}</a>
</script>

<script type="text/template" id="testPlugBtnTemplate">
  <!-- button that allows you to test a script connecting two apps -->
  <a target="#" data-icon="bolt" id="testPlug" data-role="button" data-position="notext">{{= loc('testThisPlug') }}</a>
</script>

<script type="text/template" id="headerTemplate">
  <!-- the page header, including buttons and the page title, used for all pages except the home page -->
  <div id="callInProgress"></div>
  <div id="header" {{= obj.style ? style : '' }} {{= obj.more || '' }} >
    <div class="hdr">
    <section role="region">
      <header>
      <ul id="headerUl">
      </ul>
      </header>
    </section>
    </div>
  </div>
  <div id="buttons">  
    {{ if (this.categories) { }}
       <div style="margin:10px 0 0 10px; float:left"><a id="categories" href="#" {{= G.coverImage ? 'style="color:' + G.lightColor + ';background:' + G.coverImage.darkColor +';"' : '' }}>
       <i class="ui-icon-tags"></i></a></div> 
    {{ } }} 
    {{= this.moreRanges ? '<div style="margin:10px 0 0 10px; float:left"><a id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '<i class="ui-icon-tags"></i></a></div>' : '' }}
    <div id="name" class="resTitle" style="background:{{= G.darkColor }};color:{{= G.lightColor }}; {{= this.categories ? 'width: 100%;' :  'min-height: 20px;' }}" align="center">
      <h4 id="pageTitle" style="font-weight:normal;color:{{= G.lightColor }};">{{= this.title }}</h4>
      <div align="center" {{= obj.className ? 'class="' + className + '"' : '' }} id="headerButtons">
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
    <div class="physicsConstants" style="display:none; background-color:#606060; color:#FFFFFF; padding:5px; display:none;"></div>
  </div>
</script>

<script type="text/template" id="menuP">
  <!-- Left-side slide-out menu panel -->
  <ul class="menuItems" id="menuItems"></ul>
</script>  

<script type="text/template" id="rightMenuP">
  <!-- Right-side slide-out menu panel -->
  <ul id="rightMenuItems" class="menuItems"></ul>
</script>  

<script type="text/template" id="menuItemTemplate">
  <!-- one item on the left-side slide-out menu panel -->
  <li style="{{= obj.image ? 'padding-top: 0;padding-right:0px;' : 'padding-bottom:0px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} 
      {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl) + '"' : '' }} >
    
    <!-- {{ if (!obj.homePage) { }} -->   
    <img src="{{= obj.image || 'icons/blank.png'}}" class="thumb" 
    {{ if (obj.clip_right) { }}  
      style="
        right:-{{= right }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= clip_right }}px, {{= bottom }}px, {{= clip_left }}px);"
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
      {{= obj.image || title.length < 20 ? '' : '<div class="dimmer">' }}
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

<script type="text/template" id="propRowTemplate">
  <!-- wrapper for one row on a list page (short) -->
  <li class="section group" data-shortname="{{= shortName }}" {{= obj.rules || '' }}><div class="col span_1_of_2" {{= G.coverImage ? 'style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div><div class="col span_1_of_2" style="font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="propRowTemplate2">
  <!-- wrapper for one row on a list page (long) -->
  <li class="section group" data-shortname="{{= shortName }}" {{= obj.rules || '' }}><div class="col span_1_of_2" {{= G.coverImage ? ' style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div><div class="col span_1_of_2" style="font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="menuHeaderTemplate">
  <!-- menu {{= G.coverImage ? ' style="color:' + G.coverImage.darkColor + ';"' : '' }}header -->
  <li {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} class="mi" style="margin: 15px 0 0 15px;"><i class="ui-icon-" + {{= icon }}"></i>
    {{= title }}
  </li>
</script>

<!-- EDIT TEMPLATES -->g
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
  <section id="{{= viewId }}" data-type="sidebar"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar"></section> 
<!--div id="headerMessageBar"></div-->
  <div id="headerDiv"></div>
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

<script type="text/template" id="mvListItem">
  <!-- a multivalue input for edit forms -->
  {{ var id = G.nextId() }}
  <label class="pack-checkbox">
    <input type="checkbox" name="{{= davDisplayName }}" id="{{= id }}"  class="pack-checkbox" value="{{= _uri }}" {{= obj._checked ? 'checked="checked"' : '' }} />
    <span></span>
  </label>
  <label for="{{= id }}">{{= davDisplayName }}<!-- {{= obj._thumb ? '<img src="' + _thumb + '" style="float:right;max-height:40px;" />' : '' }}--></label>
</script>


<script type="text/template" id="editRowTemplate">
  <!-- one property row in edit mode -->
  <li data-role="fieldcontain">{{= value }}</li>
</script>

<script type="text/template" id="stringPET">
<div id="_prim">
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 250; }}
  {{ if (name) { }}
    <label for="{{= id }}" class="ui-input-text" style="{{= isInput ? '' : 'vertical-align:top;' }}color:{{= G.darkColor }};">{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="3" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}  class="ui-input-text">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!name) { }}
  <div> 
    <{{= isInput ? 'input type="text"' : 'textarea  rows="10"' }} name="{{= shortName }}" id="{{= id }}"  value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}>{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  </div>
  {{ } }}
</div>   
</script>

<script type="text/template" id="booleanPET">
<div id="_prim">
  {{ if (name && name.length > 0) { }}
    <label for="{{= id }}" style="color:{{= G.darkColor }}">{{= name }}</label>
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  {{ } }}
  <section>
  <label class="pack-switch" style="right: 2rem;top:0rem;left:auto;position:absolute;color:{{= G.darkColor }};">
    <input type="checkbox" name="{{= shortName }}" id="{{= id }}" class="formElement boolean" />
    <span style="top:2rem"></span>
  </label>
  </section>
<!--  {{= typeof comment == 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }} -->
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
  <a target="#"  name="{{= shortName }}" style="{{= !obj.img ? 'padding-top:0.5rem;' : 'padding: 0 1.5rem;'}}" class="resourceProp" id="{{= id }}" {{= rules }}> 
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
<div id="_prim">
  <label for="{{= id }}" class="ui-input-text" style="color:{{= G.darkColor }};">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" class="ui-input-text" value="{{= typeof value === 'undefined' ? '' : value }}" />
</div>
</script>

<script type="text/template" id="emailPET">
<div id="_prim">
  <label for="{{= id }}" class="ui-input-text" style="color:{{= G.darkColor }};">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' }}ui-input-text" {{= rules }} />
</div>
</script>

<script type="text/template" id="hiddenPET">
  <input type="hidden" name="{{= shortName }}" id="{{= id }}" value="{{= value }}" class="{{= 'formElement ' }}ui-input-text" {{= rules }} />
</script>

<script type="text/template" id="longEnumPET">
<div id="_prim">
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
</div>


