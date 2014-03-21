<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <!-- Resource list page -->
  <section id="{{= viewId }}" data-type="sidebar" data-position="right" style="position:absolute;visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" data-position="right" style="position:absolute;visibility:hidden;z-index:10001"></section> 
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
    <div  id="sidebar" data-type="list" class="topcoat-list__container">
    </div>
    </section>
    <div id="nabs_grid" class="masonry"></div>
    
    <table class="table-stroke" width="100%" style="display:none" id="comments">
    </table>
    <form data-ajax="false" id="mv" action="#">
      <div style="width:100%;padding-top:1rem;text-align:center">
      <button type="submit" class="topcoat-button--large--cta" style="width:90%;" id="mvSubmit">
        {{= loc('submit') }}
       </button>
      </div>
      <div data-role="fieldcontain">
        <fieldset data-role="controlgroup" id="mvChooser">
        </fieldset>
      </div>
    </form>  
    <form data-ajax="false" id="editRlForm" action="#">
      <input type="submit" id="editRlSubmit" value="Submit" />
      <ul id="editRlList">
      </ul>
    </form>  
  </div>
</script>  
 
<script type="text/template" id="resource">
  <!-- Single resource view -->  
  <section id="{{= viewId }}" data-type="sidebar" style="position:absolute;visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" data-position="right" style="position:absolute;visibility:hidden;z-index:10001"></section> 

  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="resourceViewHolder">
    <div style="width: 100%;position:relative;min-height:40px;overflow:hidden">
      {{ if (this.isImageCover) { }} 
        <div id="resourceImage" style="position:absolute;z-index:1"></div>
        <div data-role="footer" class="thumb-gal-header hidden" 
          style="opacity:0.7;position:absolute;top:251px;width:100%;background:#eee;text-shadow:none;color:{{= G.coverImage ? G.coverImage.background : '#eeeeee' }}"><h3></h3></div>    
        <div id="mainGroup" style="top:0px;right:1.3rem;"></div>
      {{ } }}
      {{ if (!this.isImageCover) { }}
        <div id="resourceImage" style="width:50%;float:left;margin:0; padding:0;{{= U.getArrayOfPropertiesWith(this.vocModel.properties, "mainGroup") &&  U.isA(this.vocModel, 'ImageResource') ? 'min-height:210px;' : ''}}" ><!-- style="width:auto" --></div>
        <div id="mainGroup" style="right:1.3rem;"></div>
      {{ } }}
      <!--div id="buyGroup" class="ui-block-b" style="width:50%; min-width: 130px"></div-->
    </div>
    <div id="resourceImageGrid" data-role="content" style="padding: 2px;" class="grid-listview hidden"></div>
    
    {{ if (!this.isImageCover) { }}
      <div data-role="footer" class="thumb-gal-header hidden"><h3></h3></div>    
    {{ } }}
    <div id="photogrid" data-inset="true" data-filter="false" class="thumb-gal hidden"></div>
    {{ if (this.vocModel.type.endsWith("Impersonations")) { }}
       <div style="text-align:center;width:100%;padding-bottom:0.5rem">
       <button class="topcoat-button--cta" style="width:80%;font-size:1.8rem; padding:0.5rem 0; font-weight:bold;">
         <a href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: this.resource.get('_uri'), '-makeId': G.nextId()}) }}">{{= loc('wooMe') }}
         </a>
       </button>
       </div>
    {{ } }}
    
    <ul class="topcoat-list__container" id="resourceView">
    </ul>
    <div id="about" class="hidden" style="padding: 7px;"></div>
    
    {{ if ($('#other')) { }}
      <!--br/>
      <br/-->
    {{ } }}
    <ul class="topcoat-list__container" id="cpView">
    </ul>
  </div>
  <br/>
</script>  

<script type="text/template" id="inlineListItemTemplate">
<!-- one row of an inline backlink in view mode -->
<li data-viewid="{{= viewId }}" class="topcoat-list__item" {{= obj.img ? 'style="padding:0;"' : ''}}>
  <a href="{{= _uri }}" {{= obj._problematic ? 'class="problematic"' : '' }}>
    {{ if (obj.img) { }}
      <img data-lazysrc="{{= img.indexOf('/Image') == 0 ? img.slice(6) : img }}" 
      {{ if (obj.top) { }}  
      style="max-height:none;max-width:none;
        height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      {{ if (!obj.top) { }}  
        style="max-height:80px;max-width:px;"
      {{ } }}
      
      class="lazyImage" data-for="{{= U.getImageAttribute(resource, imageProperty) }}" />
    {{ } }}
  </a>
        <span style="font-size:1.6rem;font-weight:bold;">{{= name }}{{= obj.gridCols ? '<br/>' + gridCols : '' }}</span>
  
  {{ if (typeof comment != 'undefined') { }}
    <p>{{= comment }}</p>
  {{ } }}
  </a>
</li>
</script>

<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li class="topcoat-list__item" data-propName="{{= shortName }}" {{= obj.comment ? 'style="min-height: 4rem;"' : '' }}>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     
   <!--a target="#" data-shortName="{{= shortName }}" data-title="{{= title }}" class="cp">
     <i class="ui-icon-plus-sign"></i>
   </a-->

     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" class="cpA">{{= name }}
     </a>
     <div style="color:{{= G.lightColor }};font-weight:bold;background:{{= G.darkColor }};display:inline;position:absolute;right:1rem;font-size: 11px;top:1.5rem;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
     
     {{ if (typeof comment != 'undefined') { }}
       <p style="font-size:1.3rem;color:#808080; position:absolute;top:2rem;">{{= comment }}</p>
     {{ } }}
   </li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
<!-- readonly backlink in resource view -->
<li class="topcoat-list__item" data-propName="{{= shortName }}">
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" class="cpA">{{= name }}
     
     <!--span class="ui-li-count">{{= value }}</span></a><a target="#" data-icon="chevron-right" data-iconshadow="false" class="cp" -->
     </a>
     <div style="display:inline;position:absolute;right:1rem;top:1rem;font-size: 11px;border-radius:1rem;border: 1px solid {{= G.darkColor }};padding: 0.1rem 0.3rem;">{{= value }}</div>
   </li>
</script>

<script type="text/template" id="cpMainGroupTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 <div style="width:100%;padding:5px;">
 {{ if (!obj.value  &&  !obj.chat) { }}  
   <a data-shortName="{{= shortName }}" data-title="{{= title }}" href="#">
	   <button class="topcoat-button--cta" style="cursor:pointer; width:95%;border:1px solid {{= borderColor }}; background-color: {{= color }}">
	     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
	   </button>  
   </a>
 {{ } }}
 {{ if (obj.value || obj.chat) { }}  
   <a data-propName="{{= shortName }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}" style="width:95%;">
     <button class="topcoat-button--cta" style="width:95%;border:1px solid {{= borderColor }}; background-color: {{= color }}">
       <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
       {{= obj.value ? '<div style="display:inline-block;position:absolute;top:-35%;right:1px"><span class="counter" style="padding:1px 5px;background:#EEF;border-radius:1rem;font-size:1.2rem;">' + value + '</span></div>' :  ''  }}
    </button>
   </a>
 {{ } }}
 </script>

<script type="text/template" id="cpMainGroupTemplateH">
<!-- button for an important backlink on a resource on the resource's view page (horizontal mode) -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
  <button class="topcoat-button--cta hmg" style="text-shadow:0 1px 0 {{= borderColor }};border:1px solid {{= borderColor }}; background-color: {{= color }}">
 {{ if (!obj.value) { }}  
   <a data-shortName="{{= shortName }}" href="#" data-title="{{= title }}">
      <span>{{= obj.icon ? '<i class="' + icon + '" style="margin-left:-5px;"></i>' : '' }} {{= name }}</span> 
   </a>
 {{ } }}
 {{ if (obj.value) { }}  
   <a data-propName="{{= shortName }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <!-- {{= obj.icon ? '<i class="' + icon + '" style="font-size:20px;top:35%"></i>' : '' }} -->
     <span>{{= obj.icon ? '<i class="ui-icon-star" style="font-size:20px;top:35%"></i>' : '' }} {{= name }}{{= value != 0 ? '<span style="float: right;position:relative;margin-right:-10px;margin-top: -17px;" class="ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span>' : ''  }}</span>
   </a>
 {{ } }}
 </button>

</script>


<script type="text/template" id="listItemTemplate">
  <!-- bb one row on a list page -->
  {{ var action = action ? action : 'view' }}
  <div style="margin:0" data-viewid="{{= viewId }}">
  {{ if (!obj.v_submitToTournament) { }}
    <div style="padding-left: 90px;{{= obj.image ? 'min-height:59px;' : '' }}" data-uri="{{= U.makePageUrl(action, _uri) }}">
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    <div style="padding-left: 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
  {{ } }}
    <img data-lazysrc="{{= obj.image ? (image.indexOf('/Image') == 0 ? image.slice(6) : image) : G.getBlankImgSrc() }}"  
    {{ if (obj.right) { }}  
      style="position:absolute;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px); {{= obj.mH ? 'max-height:' + mH + 'px;' : '' }} {{= obj.mW ? 'max-width:' + mW + 'px;' : '' }}"
    {{ } }}
    {{ if (!obj.right && obj.image) { }}
      style="max-height: 80px;position:absolute;max-height: 80px;max-width: 80px;left:0px; margin-top:-0.7em"
    {{ } }} s
    class="lazyImage" data-for="{{= U.getImageAttribute(this.resource, this.imageProperty) }}" />
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
    {{ if (!obj.isJst  &&  obj._hasSubmittedBy) { }}
      style="min-height:59px;"
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
    <p style="padding-top:0.5rem;">{{= comment }}</p>
  {{ } }}
  </div>
  </div>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
  <!-- row divider / property group header in resource view -->
  <li class="topcoat-list__header" {{= G.coverImage ? 'style="text-shadow:none;background:' + G.coverImage.color + ';color: ' + G.coverImage.background + ';"' : '' }}><h3>{{= value }}</h3></li>
</script>

<script type="text/template" id="saveButtonTemplate">
  <!-- header button for saving changes -->
  <button class="topcoat-button-bar__button">
    <a target="#"><i class="ui-icon-ok"></i></a>
  </button>
</script>

<script type="text/template" id="cancelButtonTemplate">
  <!-- header button for canceling changes -->
  <button class="topcoat-button-bar__button">
    <a target="#"><i class="ui-icon-remove"></i></a>
  </button>
</script>

<script type="text/template" id="mapItButtonTemplate">
  <!-- button that toggles map view -->
  <button class="topcoat-button-bar__button">
   <a id="mapIt" target="#"><i class="ui-icon-map-marker"></i></a>
  </button>
</script>

<script type="text/template" id="backButtonTemplate">
  <!-- The UI back button (not the built-in browser one) -->
    <button class="topcoat-button-bar__button">
     <a target="#" class="back"><i class="ui-icon-chevron-left"></i></a>
    </button>
</script>

<script type="text/template" id="chatButtonTemplate">
  <!-- Button that opens up a chat page -->
    <button class="topcoat-button-bar__button">
  <a href="{{= url || '#' }}"><i class="ui-icon-comments-alt"></i>
    {{= '<span class="menuBadge">{0}</span>'.format(obj.unreadMessages || '') }}
  </a>
    </button>
</script>

<script type="text/template" id="videoButtonTemplate">
  <!-- Button that toggles video chat -->
  <a target="#" ><i class="ui-icon-facetime-video"></i>Video</a>
</script>

<script type="text/template" id="addButtonTemplate">
  <!-- button used for creating new resources -->
    <button class="topcoat-button-bar__button" style="overflow:visible">
  <a target="#"><i class="ui-icon-plus-sign"></i></a>
    </button>
</script>

<script type="text/template" id="menuButtonTemplate">
  <!-- button that toggles the menu panel -->
  <button class="topcoat-button-bar__button">
  <a target="#" href="#{{= viewId }}"><i class="ui-icon-reorder"></i>
    {{= <span class="menuBadge" style="top:1rem">{0}</span>'.format(obj.newAlerts || '') }}
  </a>
  <!--span style="position: absolute;"><i class="ui-icon-sort"></i></span-->
  </button>
</script>

<script type="text/template" id="rightMenuButtonTemplate">
  <!-- button that toggles the object properties panel -->
  <button class="topcoat-button-bar__button">
  <a target="#" href="#{{= viewId }}"><i class="ui-icon-reorder"></i></a><!--{{= '<span class="menuBadge">{0}</span>'.format(obj.count || '') }}-->
    {{= '<span class="topcoat-notification">{0}</span>'.format(obj.newAlerts || '') }}
    </a>
  <!--span style="position: absolute;font-size:14px;top:-0.2rem;"><i class="ui-icon-sort"></i></span-->
  </button>
</script>

<script type="text/template" id="loginButtonTemplate">
  <!-- button that summons the login popup -->
  <button class="topcoat-button-bar__button" style="width:100%">
    <a target="#"><i class="ui-icon-signin"></i></a>
  </button>
</script>

<!--script type="text/template" id="loginPopupTemplate">
  <!-- login popup with various social network based logins -->
  {{ var canDismiss = typeof dismissible === 'undefined' || dismissible == true; }}
  <section id="login_popup" style="position:absolute; top:15%; border:1px solid #aaa; border-radius:1rem; z-index:1000000; background:#d2d2d2;width:250px;text-align:center;">
  <div style="padding:0 1rem 1rem 1rem;">
    <h4 style="text-align:center;margin:10px 0;color:#757575;" id="loginMsg">{{= msg }}</h4>
    {{ _.forEach(nets, function(net) { }} 
    <button class="topcoat-button-bar__button" style="width:100%;margin-top:1rem;padding:0.5rem;">
      <a href="{{= net.url }}" style="text-align:center;border-radius:1rem;width:85%;font-weight:bold;" {{= net.name == 'Facebook' ? ' target="_top"' : '' }}>
        <i style="padding-top:0.3rem;margin-left:0.5rem;" class="big_symbol 
        {{ if(net.name == "Facebook") { }} ui-icon-facebook-sign {{ } }}
        {{ if(net.name == "Google") { }} ui-icon-google-plus-sign {{ } }}
        {{ if(net.name == "Twitter") { }} ui-icon-twitter-sign {{ } }}
        {{ if(net.name == "LinkedIn") { }} ui-icon-linkedin-sign {{ } }}
        {{ if(net.name == "Live") { }} ui-icon-live-sign {{ } }}
          ">
       </i>
       {{= net.name }}
      </a>
    </button><br/sw>
    {{ }); }}
    <!--h5>Login by Email</h5>
    <form id="loginForm" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
      <table>
        <tr><td>Email: </td><td><input name="j_username" /></td></tr>
        <tr><td>Password: </td><td><input type="password" name="j_password" /></td></tr>
        <tr><td colspan="2"><input type="submit" value="Submit" /></td></tr>
      </table>
    </form-->
  </section>
</script-->

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
    <section class="component">
      <ul  id="headerUl" class="topcoat-button-bar" style="width:100%">
      </ul>
    </section>
  </div>
  <div id="buttons">  
    {{ if (this.categories) { }}
       <div style="margin:10px 0 0 10px; float:left"><a id="categories" href="#" {{= G.coverImage ? 'style="color:' + G.coverImage.background + ';background:' + G.coverImage.color +';"' : '' }}>
       <i class="ui-icon-tags"></i></a></div> 
    {{ } }} 
    {{= this.moreRanges ? '<div style="margin:10px 0 0 10px; float:left"><a id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '<i class="ui-icon-tags"></i></a></div>' : '' }}
    <div id="name" class="resTitle" style="background:{{= G.darkColor }}; {{= this.categories ? 'width: 100%;' :  'min-height: 20px;' }}" align="center">
      <h4 id="pageTitle" style="font-weight:normal;color:{{= G.coverImage ? G.coverImage.color : '#eeeeee;'}}">{{= this.title }}</h4>
      {{= this.filter ? "<div class='filter'></div>" : "" }}
      <div align="center" {{= obj.className ? 'class="' + className + '"' : '' }} id="headerButtons">
        <button style="max-width:200px; display: inline-block;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="doTryBtn" class="topcoat-button--cta">
          {{ if (obj.tryApp) { }}
              {{= tryApp }}
          {{ } }}
        </button>
        <button style="max-width:200px; display: inline-block;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="forkMeBtn" class="topcoat-button--cta">
          {{ if (obj.forkMeApp) { }}
              {{= forkMeApp }}
          {{ } }}
        </button>
        <button style="max-width:400px;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="publishBtn" class="headerSpecialBtn topcoat-button--cta">
          {{ if (obj.publishApp) { }}
              {{= publish }}
          {{ } }}
        </button>
        <button style="max-width:200px;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="testPlugBtn" class="headerSpecialBtn topcoat-button--cta">
          {{ if (obj.testPlug) { }}
              {{= testPlug }}
          {{ } }}
        </button>
        <button style="max-width:200px;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="installAppBtn"  class="headerSpecialBtn topcoat-button--cta">
          {{ if (obj.installApp) { }}
            {{= installApp }}
          {{ } }}
        </button>
        <button style="max-width:320px;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background : ''}}" id="enterTournamentBtn" class="headerSpecialBtn topcoat-button--cta">
          {{ if (obj.enterTournament) { }}
              {{= enterTournament }}
          {{ } }}
        </button>
        <button style="max-width:320px;{{= G.coverImage ? 'background-color:' + G.coverImage.color + ';color:' + G.coverImage.background + ';color:' + G.coverImage.background : ''}}" id="resetTemplateBtn" class="headerSpecialBtn topcoat-button--cta">
          {{ if (obj.resetTemplate) { }}
              {{= resetTemplate }}
          {{ } }}
        </button>
      </div>
    </div>  
    <div class="physicsConstants" style="background-color:#606060; color: #ffffff; display:none;"></div>
  </div>
</script>

<script type="text/template" id="menuP">
  <!-- Left-side slide-out menu panel -->
  <ul id="menuItems" class="topcoat-list__container menuItems">
  </ul>
</script>  

<script type="text/template" id="rightMenuP">
  <!-- Right-side slide-out menu panel -->
  <ul id="rightMenuItems"  class="topcoat-list__container menuItems">
  </ul>
</script>  

<script type="text/template" id="menuItemTemplate">
  <!-- one item on the left-side slide-out menu panel -->
  <li style="{{= obj.image ? 'padding-top: 0;padding-right:0px;' : 'padding-bottom:0px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" class="topcoat-list__item{{= obj.cssClass ? ' ' + cssClass : '' }}" 
      {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl) + '"' : '' }} >
    
    {{ if (obj.image) { }}   
      <img src="{{= obj.image || 'icons/blank.png'}}" class="thumb" 
    {{ if (obj.clip_right) { }}  
      style="
        right:-{{= right }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= clip_right }}px, {{= bottom }}px, {{= clip_left }}px);"
    {{ } }}
      /> 
    {{ } }}
    <div style="min-height:38px;max-width:100%;padding-top:10px;font-size:18px;margin-left:15px;" 
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
      <i style="position:absolute;right:1.5rem;top:1rem;font-size:2rem;" class="ui-icon-{{= icon }} home"></i>
    {{ }               }}
  </li>
</script>

<script type="text/template" id="menuItemNewAlertsTemplate">
  <!-- Notifications item on the left-side slide-out menu panel -->
  <li class="topcoat-list__item{{= typeof cssClass == 'undefined' ? '' : ' ' + cssClass }}" data-href="{{= pageUrl }}">
    <div style="margin-top:15px;min-height:38px;max-width:100%;font-size:18px;margin-left:15px;position:relative;"  id="{{= typeof id === 'undefined' ? G.nextId() : id}}">
      {{= title }}   <span class="topcoat-notification">{{= newAlerts }}</span> 
    </div>
  </li>
</script>

<script type="text/template" id="homeMenuItemTemplate">
  <!-- app home page menu item -->
  <li class="topcoat-list__item{{= obj.cssClass ? '' : ' ' + cssClass }}"  id="{{= typeof id == 'undefined' ? 'home123' : id }}">
    <img src="{{= typeof image != 'undefined' ? image : G.getBlankImgSrc() }}" style="float: right;" /> 
    <a {{= typeof image != 'undefined' ? 'style="margin-left:35px;"' : '' }} target="#">
      {{= title }}
    </a>
  </li>
</script>

<!--script type="text/template" id="propRowTemplate">
  <li data-shortname="{{= shortName }}" class="topcoat-list__item" {{= obj.rules || '' }} {{= G.coverImage ? ' style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}<div style="float:right;font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="propRowTemplate2">
  <li data-shortname="{{= shortName }}" class="topcoat-list__item" {{= obj.rules || '' }} {{= G.coverImage ? ' style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}<div style="display:inline-block;margin-left:1.5rem;font-weight: normal;">{{= value }}</div></li>
</script-->




<script type="text/template" id="propRowTemplate">
  <!-- wrapper for one row on a list page (short) -->
  <li class="section group topcoat-list__item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>
    <div class="col span_1_of_2" {{= G.coverImage ? 'style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div>
    <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} style="font-weight: normal;">{{= value }}</div>
  </li>
</script>

<script type="text/template" id="propRowTemplate2">
  <!-- wrapper for one row on a list page (long) -->
  <li class="section group topcoat-list__item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}>
    <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} {{= G.coverImage ? ' style="color:' + G.coverImage.background + ';"' : '' }}>{{= name }}</div>
    <div {{= value.length < 500 ? 'class="col span_1_of_2"' : '' }} style="font-weight: normal;">{{= value }}</div>
  </li>
</script>

<script type="text/template" id="propRowTemplate3">
  <!-- wrapper for one row on a list page (longest) -->
  <li class="section group topcoat-list__item" data-shortname="{{= shortName }}" {{= obj.rules || '' }}><div class="col" style="font-weight: normal;font-family:Trebuchet MS;">{{= value }}</div></li>
</script>





<script type="text/template" id="menuHeaderTemplate">
  <!-- menu header -->
  <li class="topcoat-list__item{{= obj.cssClass ? ' ' + cssClass : '' }}" style="min-height:38px;max-width:100%;font-size:18px;padding:15px 0 0 15px;"><div><i class="ui-icon-" + {{= icon }}"></i>
    {{= title }}
  </div
  ></li>
</script>

<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
  <section id="{{= viewId }}" data-type="sidebar" style="position:absolute;visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" style="position:absolute;visibility:hidden;z-index:10001"></section> 
<!--div id="headerMessageBar"></div-->
  <div id="headerDiv"></div>
  <div id="resourceEditView">
  <!-- div id="resourceImage"></div -->
  <form data-ajax="false" id="{{= viewId + '_editForm'}}" action="#">
  <ul id="fieldsList" class="editList topcoat-list__container">
  </ul>
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
  <input type="checkbox" name="{{= davDisplayName }}" id="{{= id }}" value="{{= _uri }}" {{= obj._checked ? 'checked="checked"' : '' }} />
  <div class="topcoat-checkbox__checkmark"></div>
  <label for="{{= id }}" class="topcoat-checkbox">{{= davDisplayName }} <!-- {{= obj._thumb ? '<img src="' + _thumb + '" style="float:right;max-height:40px;" />' : '' }}-->
  </label>
</script>

<script type="text/template" id="editRowTemplate">
  <!-- one property row in edit mode -->
  <li data-role="fieldcontain" class="topcoat-list__item {{= !_.isUndefined(prop.maxSize) && prop.maxSize > 100 && !prop.multiValue ? 'textarea' : ''}}">{{= value }}</li>
</script>

<script type="text/template" id="stringPET">
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 100; }}
  {{ if (name) { }}
    <label for="{{= id }}" class="ui-input-text" {{= isInput ? '' : 'style="vertical-align:top"' }}>{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="3" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }}  class="ui-input-text topcoat-text-input">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!name) { }}
  <div> 
    <{{= isInput ? 'input type="text"' : 'textarea  rows="3"' }} name="{{= shortName }}" id="{{= id }}"  value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }} class="ui-input-text topcoat-text-input">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  </div>
  {{ } }} 
</script>

<script type="text/template" id="booleanPET">
  <label class="topcoat-switch" style="z-index:10001;float:right;">
    <input type="checkbox" name="{{= shortName }}" id="{{= id }}" class="formElement topcoat-switch__input" {{= obj.value ? 'checked="checked"' : '' }} />
    <div class="topcoat-switch__toggle"></div>
  </label>
  {{ if (name && name.length > 0) { }}
    <label for="{{= id }}">{{= name }}</label>
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  {{ } }}
<!--  {{= typeof comment == 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }} -->
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

  <!--a target="#"  name="{{= shortName }}" class="resourceProp" id="{{= id }}" {{= rules }}--> 
  <a target="#"  name="{{= shortName }}" style="min-height:3rem;" class="resourceProp" id="{{= id }}" {{= rules }}> 
    {{ if (obj.img) { }}    
      <img name="{{= shortName }}" src="{{= img }}" style="
      
      {{ if (typeof obj.width != 'undefined') { }}  
          height:{{= height }}px;
          left:-{{= left }}px; top:-{{= top }}px;
          clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);vertical-align:middle;"
      {{ } }}
      {{ if (typeof obj.width == 'undefined') { }}  
          max-height: 50px;
      {{ } }}
      
      "/>
    {{ }              }}
    
    <label for="{{= id }}" style="font-weight:normal">{{= name }}</label>
    {{= typeof displayName === 'undefined' || !displayName ? (typeof value === 'undefined' ||  value.length == 0 ? '' : value) : displayName }}
    {{ if (!obj.value) { }}
      {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }}
    {{ } }} 
    <div class="triangle"></div>
  </a>
  
  <!-- {{= typeof multiValue === 'undefined' ? '' : value }} -->
</script>
<script type="text/template" id="telPET">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" class="ui-input-text topcoat-text-input" value="{{= typeof value === 'undefined' ? '' : value }}" />
</script>

<script type="text/template" id="emailPET">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' }}ui-input-text topcoat-text-input" {{= rules }} />
</script>

<script type="text/template" id="hiddenPET">
  <input type="hidden" name="{{= shortName }}" id="{{= id }}" value="{{= value }}" class="{{= 'formElement ' }}ui-input-text topcoat-text-input" {{= rules }} />
</script>

<script type="text/template" id="cameraPopupTemplate">
  <div id="cameraPopup" class="cameraPopup">
    <div style="position:relative">
    <a href="#" data-rel="back" id="cameraCancelBtn">
      <i class="ui-icon-remove-sign"></i>
    </a>
    {{ if (obj.video || obj.image) { }}
      <video id="camVideo" autoplay="autoplay"></video>
      <canvas id="canvas" width="100%" height="0"></canvas>
    {{ }                }}
    {{ if (obj.video || obj.audio) { }}
      <div id="camPreview">
      </div>
    {{ }                }}
    </div>
    <div style="text-align:center; padding:1rem 0;">
    <button class="topcoat-button" style="width:30%;">
      <a id="cameraShootBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">
        <i class="{{= obj.video || obj.audio ? 'icon-circle' : 'icon-camera' }}"></i>
        
        {{= obj.video || obj.audio ? 'Record' : 'Shoot' }}
      </a>
    </button>  
    <button class="topcoat-button" style="width:30%;">
      <a data-icon="ok" id="cameraSubmitBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">
        <i class="ui-icon-ok"></i>
        I'll take it
      </a>
    </button>  
    </div>
  </div>
</script>
<script type="text/template" id="moneyPET">
  <label for="{{= id }}" class="ui-input-text"">{{= name }} <b>{{= typeof value.currency === 'undefined' ? '$' : value.currency }}</b></label>
  <input type="text" name="{{= shortName }}" id="{{= id }}" value="{{= obj.value ? value : '' }}" {{= rules }} class="topcoat-text-input"></input>
</script>
<script type="text/template" id="datePET">
  <label for="{{= id }}" class="ui-input-text">{{= name }}</label>
  <input id="{{= id }}" class="i-txt topcoat-text-input" name="{{= shortName }}" {{= rules }} data-mini="true" value="{{= value }}" />
  <!--input type="hidden" id="{{= id + '.hidden' }}" name="{{= shortName }}" {{= rules }} data-mini="true" /-->
</script>
</div>


