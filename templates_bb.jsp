<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <!-- Resource list page -->
  <section id="{{= viewId }}" data-type="sidebar" style="visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" data-position="right" style="left:auto;right:0;visibility:hidden;z-index:10001"></section> 
  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" role="main">
    <section data-type="list" data-theme="{{= G.theme.list }}" data-filter-theme="{{= G.theme.list }}">
      <ul id="sidebar"></ul>
    </section>
    <div id="nabs_grid" class="masonry">
    </div>
    
    <table class="table-stroke" width="100%" style="display:none" id="comments">
    </table>
    <form data-ajax="false" id="mv" action="#">
      <input type="submit" id="mvSubmit" value="{{= loc('submit') }}" />
      <div data-role="fieldcontain">
        <fieldset data-role="controlgroup" id="mvChooser">
        </fieldset>
      </div>
    </form>  
    <form data-ajax="false" id="editRlForm" action="#">
      <input type="submit" id="editRlSubmit" value="Submit" />
      <ul data-role="listview" data-theme="{{= G.theme.list }}" id="editRlList" class="action-list" data-inset="true">
      </ul>
    </form>  
  </div>
</script>  
 
<script type="text/template" id="resource">
  <!-- Single resource view -->  
  <section id="{{= viewId }}" data-type="sidebar" style="visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" data-position="right" style="left:auto;right:0;visibility:hidden;z-index:10001"></section> 

  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="resourceViewHolder">
    <div style="width: 100%;padding-right:10px;overflow:hidden">
      <div id="resourceImage" style="width:50%;float:left;margin:0; padding:0;"><!-- style="width:auto" --></div>
      <div id="mainGroup"></div>
      <div id="buyGroup" class="ui-block-b" style="width:50%; min-width: 130px"></div>
    </div>
    <div id="resourceImageGrid" data-role="content" style="padding: 2px;" data-theme="{{= G.theme.photogrid }}" class="grid-listview hidden"></div>
    <div id="photogridHeader" style="top: -3px;" data-role="footer" data-theme="{{= G.theme.photogrid }}" class="hidden"><h3></h3></div>
    <div id="photogrid" style="padding: 7px;" data-theme="{{= G.theme.photogrid }}" data-role="content" class="grid-listview hidden"></div>
    
    {{ if (this.vocModel.type.endsWith("Impersonations")) { }}
       <div style="padding:10px;"><a data-role="button" class="{{= 'ui-btn-hover-' + G.theme.swatch }}" data-icon="heart" data-theme="{{= G.theme.swatch }}" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: this.resource.get('_uri'), '-makeId': G.nextId()}) }}">{{= loc('wooMe') }}</a></div>
    {{ } }}
    
    <section data-type="list" data-theme="{{= G.theme.list }}" data-filter-theme="{{= G.theme.list }}">
      <ul style="padding: 10px;" data-theme="{{= G.theme.list }}" id="resourceView">
      </ul>
    </section>
    <div id="about" class="hidden" style="padding: 7px;" data-theme="{{= G.theme.photogrid }}"></div>
    
    {{ if ($('#other')) { }}
      <!--br/>
      <br/-->
    {{ } }}
    <section data-type="list" data-theme="{{= G.theme.list }}" data-filter-theme="{{= G.theme.list }}">
      <ul data-theme="{{= G.theme.list }}" id="cpView" style="padding: 10px;">
      </ul>
    </section>
  </div>
  <!--div data-role="footer" class="ui-bar" data-theme="{{= G.theme.footer }}">
     <a data-role="button" data-shadow="false" data-icon="repeat" id="homeBtn" target="#">Home</a>
     <a data-role="button" data-shadow="false" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">{{= loc('edit') }}</a>
  </div-->
  <br/>
</script>  


<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li data-propName="{{= shortName }}"
{{= obj.inline ? ' data-theme="{0}">'.format(G.theme.footer) : '' }}
>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     
   <a target="#" data-shortName="{{= shortName }}" data-title="{{= title }}" class="cp" style="position:absolute;top:4px;right:0px;font-size:22px;">
     <i class="ui-icon-plus-sign"></i>
   </a>
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">{{= name }}
     <div style="display:inline;position:absolute;right:30px;font-size: 11px;float-right;border-radius:1rem;border: 1px solid #777;padding: 0.1rem 0.3rem;">{{= value }}</div>
     {{ if (typeof comment != 'undefined') { }}
       <p style="padding: 0;font-size:12px;color:#808080; line-height:1rem;">{{= comment }}</p>
     {{ } }}
     </a>
   </li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
<!-- readonly backlink in resource view -->
<li data-propName="{{= shortName }}"
  {{= obj.inline ? ' data-theme="{0}">'.format(G.theme.activeButton) : '' }}
>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">{{= name }}
     
     <div style="display:inline;position:absolute;right:30px;font-size: 11px;float-right;border-radius:1rem;border: 1px solid #777;padding: 0.1rem 0.3rem;">{{= value }}</div>
     <!--span class="ui-li-count">{{= value }}</span></a><a target="#" data-theme="{{= G.theme.list }}" data-icon="chevron-right" data-iconshadow="false" class="cp" -->
     </a>
   </li>
</script>

<script type="text/template" id="cpMainGroupTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!value  &&  !chat) { }}  
   <a role="button" data-shortName="{{= shortName }}" data-title="{{= title }}" style="border:1px solid {{= borderColor }}; background-color: {{= color }}" href="#">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>
   </a>
 {{ } }}
 {{ if (obj.value != 'undefined' || chat) { }}  
   <a role="button" data-propName="{{= shortName }}" style="border:1px solid {{= borderColor }}; background-color: {{= color }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <span><i class="{{= icon }}"></i>&#160;{{= name }}</span>{{= obj.value ? '<span class="counter">' + value + '</span>' :  ''  }}
   </a>
 {{ } }}
</script>


<script type="text/template" id="listItemTemplate">
  <!-- bb one row on a list page -->
  {{ var action = action ? action : 'view' }}
  <div style="cursor:pointer;" data-viewid="{{= viewId }}">
  {{ if (typeof v_submitToTournament == 'undefined') { }}
    <div style="padding:.7em 10px 10px 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri) }}">
  {{ } }}
  {{ if (typeof v_submitToTournament != 'undefined') { }}
    <div style="padding:.7em 10px 0 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
  {{ } }}
    <img {{= typeof image != 'undefined' ? 'src="' + (image.indexOf('/Image') == 0 ? image.slice(6) : image) + '"' : 'src="icons/blank.png" style="position:absolute;left:0px"'}}" 
    {{ if (obj.right) { }}  
      style="position:absolute;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px); {{= obj.mH ? 'max-height:' + mH + 'px;' : '' }} {{= obj.mW ? 'max-width:' + mW + 'px;' : '' }}"
    {{ } }}
    {{ if (!obj.right && obj.image) { }}
      style="max-height: 80px;position:absolute;max-height: 80px;max-width: 80px;margin-left:-90px; margin-top:-0.7em"
    {{ } }}  
    data-for="{{= U.getImageAttribute(this.resource, this.imageProperty) }}" />
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
  {{= obj.showCount ? '<span class="ui-li-count">' + obj[showCount].count + '</span>' : '' }} 
  {{ if (obj.comment) { }}
    <p>{{= comment }}</p>
  {{ } }}
  </div>
  </div>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
  <!-- row divider / property group header in resource view -->
  <header>{{= value }}</header>
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
  <a target="#" {{= obj.empty ? 'class="hint--bottom hint--always" data-hint="Add item"' : '' }}><i class="ui-icon-plus-sign"></i></a>
</script>

<script type="text/template" id="menuButtonTemplate">
  <!-- button that toggles the menu panel -->
  <a target="#" href="#{{= viewId }}"><i class="ui-icon-reorder"></i>
    {{= '<span class="menuBadge">{0}</span>'.format(obj.newAlerts || '') }}
  </a>
</script>

<script type="text/template" id="rightMenuButtonTemplate">
  <!-- button that toggles the object properties panel -->
  <a target="#" href="#{{= viewId }}"><i class="ui-icon-indent-right"></i></a>{{= '<span class="menuBadge">{0}</span>'.format(obj.count || '') }}
  </a>
</script>

<script type="text/template" id="loginButtonTemplate">
  <!-- button that summons the login popup -->
  <a target="#"><i class="ui-icon-signin"></i></a>
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
  <a target="#" data-icon="star" id="enterTournament" data-theme="e" data-role="button" data-position="notext">{{= loc('enterData') + ': ' + name }}</a>
</script>

<script type="text/template" id="testPlugBtnTemplate">
  <!-- button that allows you to test a script connecting two apps -->
  <a target="#" data-icon="bolt" id="testPlug" data-role="button" data-position="notext">{{= loc('testThisPlug') }}</a>
</script>

<script type="text/template" id="headerTemplate">
  <!-- the page header, including buttons and the page title, used for all pages except the home page -->
  <div id="callInProgress"></div>
  <div id="header" {{= obj.style ? style + ';z-index:1000;': 'style="z-index:1000;"' }} {{= obj.more || '' }} >
    <div class="hdr">
      <ul id="headerUl">
      </ul>
    </div>
  </div>
  <div id="buttons">  
    {{= this.categories ? '<div style="margin:10px 0 0 10px; float:left"><a id="categories" href="#"><i class="ui-icon-tags"></i></a></div>' : '' }} 
    {{= this.moreRanges ? '<div style="margin:10px 0 0 10px; float:left"><a id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '<i class="ui-icon-tags"></i></a></div>' : '' }}
    <div id="name" class="resTitle" {{= this.categories ? 'style="width: 100%;"' : 'style="min-height: 20px"' }} align="center">
      <h4 id="pageTitle" style="font-weight:normal;">{{= this.title }}</h4>
      <div align="center" {{= obj.className ? 'class="' + className + '"' : '' }} style="margin-top: -7px;" id="headerButtons">
        <div style="max-width:200px; display: inline-block;" id="doTryBtn">
          {{ if (obj.tryApp) { }}
              {{= tryApp }}
          {{ } }}
        </div>
        <div style="max-width:200px; display: inline-block;" id="forkMeBtn">
          {{ if (obj.forkMeApp) { }}
              {{= forkMeApp }}
          {{ } }}
        </div>
        <div style="max-width:400px;" id="publishBtn" class="headerSpecialBtn">
          {{ if (obj.publishApp) { }}
              {{= publish }}
          {{ } }}
        </div>
        <div style="max-width:200px;" id="testPlugBtn" class="headerSpecialBtn">
          {{ if (obj.testPlug) { }}
              {{= testPlug }}
          {{ } }}
        </div>
        <div style="max-width:200px;" id="installAppBtn"  class="headerSpecialBtn">
          {{ if (obj.installApp) { }}
            {{= installApp }}
          {{ } }}
        </div>
        <div style="max-width:320px;" id="enterTournamentBtn" class="headerSpecialBtn">
          {{ if (obj.enterTournament) { }}
              {{= enterTournament }}
          {{ } }}
        </div>
        <div style="max-width:320px;" id="resetTemplateBtn" class="headerSpecialBtn">
          {{ if (obj.resetTemplate) { }}
              {{= resetTemplate }}
          {{ } }}
        </div>
      </div>
    </div>
  </div>
</script>

<script type="text/template" id="menuP">
  <!-- Left-side slide-out menu panel -->
  <ul class="menuItems panel" id="menuItems">
  </ul>
</script>  

<script type="text/template" id="rightMenuP">
  <!-- Right-side slide-out menu panel -->
  <ul data-theme="{{= G.theme.menu }}" id="rightMenuItems" class="menuItems">
  </ul>
</script>  

<script type="text/template" id="menuItemTemplate">
  <!-- one item on the left-side slide-out menu panel -->
  <li style="cursor: pointer;min-height: 42px; {{= obj.image ? 'padding-top: 0;padding-right:0px;padding-bottom: 7px;' : 'padding-bottom:0px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} 
      {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl) + '"' : '' }} >
    
    <!-- {{ if (!obj.homePage) { }} -->   
    <img src="{{= obj.image || 'icons/blank.png'}}" class="thumb" 
    {{ if (typeof obj.width != 'undefined'  &&  obj.width.length) { }}  
      style="
        width:{{= width }}px; height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
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
    <div style="margin:15px 0 0 15px;"  id="{{= typeof id === 'undefined' ? G.nextId() : id}}">
      {{= title }}   <span class="acounter">{{= newAlerts }}</span> 
    </div>
  </li>
</script>

<script type="text/template" id="homeMenuItemTemplate">
  <!-- app home page menu item -->
  <li {{= obj.icon ? 'data-icon="' + icon + '"' : ''}} {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }}  id="{{= typeof id == 'undefined' ? 'home123' : id }}">
    <img src="{{= typeof image != 'undefined' ? image : 'icons/blank.png'}}" style="float: right;" /> 
    <a {{= typeof image != 'undefined' ? 'style="margin-left:35px;"' : '' }} target="#">
      {{= title }}
    </a>
  </li>
</script>

<script type="text/template" id="propRowTemplate">
  <!-- wrapper for one row on a list page (short) -->
  <li data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="menuHeaderTemplate">
  <!-- menu header -->
  <li {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} class="mi" style="margin: 15px 0 0 15px;"><i class="ui-icon-" + {{= icon }}"></i>
    {{= title }}
  </li>
</script>

<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
  <section id="{{= viewId }}" data-type="sidebar" style="visibility:hidden;z-index:10001"></section>
  <section id="{{= viewId + 'r' }}" data-type="sidebar" data-position="right" style="left:auto;right:0;visibility:hidden;z-index:10001"></section> 
<!--div id="headerMessageBar"></div-->
<div id="headerDiv"></div>
<div id="resourceEditView">
  <div id="resourceImage"></div>
  <form data-ajax="false" id="{{= viewId + '_editForm'}}" action="#">
    <ul id="fieldsList" data-role="listview" data-theme="{{= G.theme.list }}" id="fieldsList" class="action-list" data-inset="true">
    </ul>
    <div name="errors" style="float:left"></div>
    {{ if (this.resource.isAssignableFrom("InterfaceImplementor")) }}
    <div data-role="fieldcontain" id="ip">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><a target="#" id="check-all" data-icon="check" data-role="button" data-mini="true" data-theme="{{= G.theme.activeButton }}">{{= loc('checkAll') }}</a></div>
        <div class="ui-block-b"><a target="#" id="uncheck-all" data-icon="sign-blank" data-role="button" data-mini="true" data-theme="{{= G.theme.footer }}">{{= loc('uncheckAll') }}</a></div>
      </fieldset>
      <fieldset data-role="controlgroup" id="interfaceProps">
      </fieldset>
    </div>
    {{                                                             }}
    
    <div class="ui-body ui-body-b">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><button type="cancel" id="cancel" data-theme="{{= G.theme.footer }}" class="cancel">{{= obj.cancel || loc('cancel') }}</button></div>
        <div class="ui-block-b"><button type="submit" id="submit" data-theme="{{= G.theme.activeButton }}" class="submit">{{= obj.submit || loc('submit') }}</button></div>
      </fieldset>
    </div>

  </form>
  <br/>
  {{ if (U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"))) { }}
    <table class="ui-btn-up-g" width="100%" style="padding: 5px" id="comments">
    </table>
  {{ } }}
</div>


  <!--div data-role="footer" class="ui-bar" data-theme="{{= G.theme.footer }}">
     <a data-role="button" data-icon="repeat" id="homeBtn" target="#">Home</a>
  </div-->
</script>

<script type="text/template" id="stringPET">
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 100; }}
  {{ if (name) { }}
  <label for="{{= id }}" data-theme="{{= G.theme.list }}">{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="10" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }} data-mini="true">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!name) { }}
    <{{= isInput ? 'input type="text"' : 'textarea  style="width: 100%" rows="10"' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : _.htmlEscape(value) }}" {{= rules }} data-mini="true">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
</script>

</div>
