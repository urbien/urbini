<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <div id="headerDiv"></div>
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" class="ui-content" data-role="content" role="main">
    <ul id="sidebar" data-role="listview" class="ui-listview" data-theme="c"></ul>
    <ul id="columns">
    </ul>
    <table data-role="table" data-mode="reflow" class="table-stroke" width="100%" id="comments">
    </table>
  </div>
  
  <div data-role="footer" class="ui-footer ui-bar-c">
     <a id="homeBtn" target="#" class="icon home">Home</a>
     <!-- nextPage button removed after endless page introduction -->
     <a id="nextPage" target="#" class="icon next ui-btn-right">Next</a>
  </div>
</script>  

<script type="text/template" id="resource">
  <div id="headerDiv"></div>
  <div id="resourceViewHolder" data-role="content" style="margin-top: -15px;">
    <div id="resourceImage"></div><br/>
    <ul data-role="listview" data-theme="c" id="resourceView" class="action-list">
    </ul>
    <br/>
    <br/>
    <ul data-role="listview" data-theme="c" id="cpView" class="ui-listview">
    </ul>
  </div>

  <div data-role="footer">
     <a id="homeBtn" target="#" class="icon home">Home</a>
     <!--a id="edit" target="#" class="icon next ui-btn-right">Edit</a-->
  </div>
</script>  

<script type="text/template" id="menu">
  <div id="headerDiv" data-theme="a"></div>
  <div id="menuHolder" data-role="content" data-theme="e">
    <ul data-role="listview" data-theme="e" id="menuItems">
    </ul>
  </div>
  
  <div data-role="footer">
     <a id="homeBtn" target="#" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="stringPT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="emailPT">
  <a href="mailto:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="emailPET">
  <span><input class="email" value="{{= value }}" /></span>
</script>

<script type="text/template" id="UrlPT">
  <a href="{{= value.href }}">{{= value.linkText }}</a>
</script>

<script type="text/template" id="UrlPET">
  <span><input value="{{= value.href }}" /></span>
</script>

<script type="text/template" id="telPT">
  <a href="tel:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="telPET">
  <span><input class="tel" value="{{= value }}" /></span>
</script>

<script type="text/template" id="datePT">
    <span>{{= Lablz.U.getFormattedDate(value) }}</span>
</script>
<!--script type="text/template" id="datePT">
    <span>{{= new Date(value / 1000) }}</span>
</script -->

<script type="text/template" id="datePET">
  <span><input value="{{= new Date(value / 1000) }}" /></span>
</script>

<script type="text/template" id="booleanPT">
  <span>{{= value }}</span>
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

<script type="text/template" id="moneyPT">
  <span>{{= value.currency + value.value }}</span>
</script>

<script type="text/template" id="durationPT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Lablz.U.getFormattedDate(value) }}</span>
</script>

<script type="text/template" id="complexDatePT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Lablz.U.getFormattedDate(value) }}</span>
</script>

<script type="text/template" id="resourcePT">
  <span><a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(value) }}">{{= typeof displayName == 'undefined' ? value : displayName }}</a></span>
</script>

<!--script type="text/template" id="mapItemTemplate">
<span><a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(value) }}">{{= typeof displayName == 'undefined' ? value : displayName }} {{= image ? '<br />' + image : '' }} </a></span>
</script-->

<script type="text/template" id="mapItemTemplate">
  <ul style="list-style-type:none">
    <li><span><a href="{{= (Lablz.pageRoot + '#view/' + encodeURIComponent(uri)) }}"> {{= resourceLink }} </a></span></li>
    {{ _.forEach(rows, function(val, key) { }} 
      <li>{{= key }}: {{= val.value }}</li>
    {{ }); }}
    {{ if (typeof image != 'undefined') { }}
    <span><a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(uri) }}"> {{= image ? '<br />' + image : '' }} </a></span>
    {{ } }}
  </ul>
</script>

<script type="text/template" id="imagePT">
  <img src="{{= value }}"></img>
</script>

<script type="text/template" id="listItemTemplate">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(_uri) }}"><img align="middle" src="{{= typeof mediumImage != 'undefined' ? (mediumImage.indexOf('/Image') == 0 ? mediumImage.slice(6) : mediumImage) : typeof featured != 'undefined' ? (featured.indexOf('Image/') == 0 ? featured.slice(6) : featured) : 'icons/blank.png'}}" /><h3>{{= davDisplayName }}</h3></a>
  {{ if (typeof distance != 'undefined') { }}
    <span class="ui-li-count">{{= distance }}</span>
  {{ } }}
</script>

<script type="text/template" id="listItemTemplateNoImage">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(_uri) }}"><h3>{{= davDisplayName }}</h3></a>
  {{ if (typeof distance != 'undefined') { }}
    <span class="ui-li-count">{{= distance }}</span>
  {{ } }}
</script>

<script type="text/template" id="menuItemTemplate">
  <li><a id="{{= typeof id === 'undefined' ? Lablz.nextId() : id}}" href="{{= typeof mobileUrl !== 'undefined' ? Lablz.pageRoot + '#' + mobileUrl : pageUrl }}"><h3>{{= title }}</h3></a></li>
</script>

<script type="text/template" id="propRowTemplate">
   <li>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
</script>

<!-- script type="text/template" id="cpTemplate">
   <li><a href="{{= Lablz.pageRoot + '#' + encodeURIComponent(_uri) + '/' + propName }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a href="#" data-icon="plus"></a></li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
   <li><a href="{{= Lablz.pageRoot + '#' + encodeURIComponent(_uri) + '/' + propName }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a target="#" data-theme="c" data-icon="arrow-r"></a></li>
</script -->

<script type="text/template" id="cpTemplate">
   <li><a href="{{= Lablz.pageRoot + '#' + range + '?' + backlink + '=' + encodeURIComponent(_uri) }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a href="#" data-icon="plus"></a></li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
   <li><a href="{{= Lablz.pageRoot + '#' + range + '?' + backlink + '=' + encodeURIComponent(_uri) }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a target="#" data-theme="c" data-icon="arrow-r"></a></li>
</script>

<script type="text/template" id="propRowTemplate2">
   <li>{{= name }}<div style="font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
   <li data-role="list-divider">{{= value }}</li>
</script>

<!--script type="text/template" id="viewTemplate">
  <div>
    {{ for (var name in props) { }} 
      {{ if (props.hasOwnProperty(name)) { }}
        <div class="propRow">{{ name }}: {{ props[name] }}</div>
      {{ } }}
    {{ } }}
  </div>
</script-->

<script type="text/template" id="mapItButtonTemplate">
  <li id="mapIt">
    <a target="#" data-icon="globe">Map It</a>
  </li>
</script>

<script type="text/template" id="mapTemplate">
  <div id="map" class="map" data-role="none"></div>
</script>

<script type="text/template" id="backButtonTemplate">
  <li id="back">
    <a target="#" data-icon="chevron-left" class="back">Back</a>
  </li>  
</script>

<script type="text/template" id="menuButtonTemplate">
  <li id="menuBtn">
    <a target="#" data-icon="reorder" class="menu">Menu</a>
  </li>  
</script>

<script type="text/template" id="loginButtonTemplate">
  <li id="login">   
    <a target="#" data-icon="signin">Sign In</a>
  </li>
</script>

<script type="text/template" id="loginPopupTemplate">
  <div id="login_popup" style="text-align: center;" data-role="popup" data-transition="slidedown" data-overlay-theme="a" class="ui-content">
    <h5>Login through Social Networks</h5>
    <a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>
    {{ _.forEach(nets, function(net) { }} 
      <a href="{{= net.url }}"><img src="{{= net.icon }}" /></a>
    {{ }); }}
  </div>
</script>

<script type="text/template" id="socialConnectButtonTemplate">
  <li id="login">   
    <a target="#" data-icon="signin"></a>
  </li>
</script>

<script type="text/template" id="logoutButtonTemplate">
  <li id="logout">
    <a id="logout" target="#" data-icon="signout">Sign Out</a>
  </li>
</script>

<script type="text/template" id="aroundMeButtonTemplate">
  <li id="aroundMe">
    <a target="#" data-icon="map-marker">Around Me</a>
  </li>
</script>

<script type="text/template" id="headerTemplate">
  <div data-role="header" class="ui-header ui-bar-c">
    <div id="errMsg"></div>
    <div data-role="navbar">
      <ul id="headerUl"></ul>
    </div>
    <div id="name" align="center">
      <h3 style="margin: 8px;" id="pageTitle">{{= this.pageTitle }}</h3>
    </div>
  </div>
</script>


<!--script type="text/template" id="resourceEdit">
<div id="headerDiv"></div>
<div id="resourceEditView" data-role="content">
  <form data-ajax="false" action="#">
    <ul data-role="listview" data-theme="c" id="resourceEditView" class="action-list" data-inset="true"></ul>
    <button id="save" target="#" class="ui-btn-left">Save</button>
    <button id="cancel" target="#" class="ui-btn-right">Cancel</button>
  </form>
</div>

<div data-role="footer">
   <a target="#welcome" class="icon home">Home</a>
</div>
</script-->  

<!--script type="text/template" id="stringPET">
<label for="{{= shortName }}">{{= name }}</label>
<span><input id="{{= shortName }}" value="{{= value }}" /></span>
</script-->

<script type="text/template" id="comment-item">
<td width="1%" valign="top">
  <a href="{{=Lablz.pageRoot + '#view/' + encodeURIComponent(submitter.value) }}">
    <img src="{{= obj['submitter.thumb'] }}" />
  </a>
</td>
<td class="cl" valign="top">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(submitter.value) }}">
    {{= submitter.displayName }}
  </a><br/>
  {{= (typeof description == 'undefined') ? title : description }}
  <br/><br/>
  <span class="commentListDate">{{= submitTime.displayName }}</span>
  <br/>
  <a data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?.vote=Like&amp;-changeInplace=y&amp;type=http://www.hudsonfog.com/voc/aspects/tags/Vote&amp;bUri=' + encodeURIComponent('sql?uri=' + encodeURIComponent(_uri)) }}">
  </a>
</td>
</script>

<script type="text/template" id="masonry-mod-list-item">
  <div class="anab">
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img border="0" src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"></img>
      </a>
    </div>
  </div>
  <table width="100%" class="modP">
    <tr>
      <td class="urbien" width="1%">
        <a href="{{= modifiedBy.value }}">
          <img border="0" src="{{= typeof v_modifiedByPhoto != 'undefined' ? v_modifiedByPhoto : 'icons/blank.png' }}"></img>
        </a>
      </td>
      <td>
        <span class="action">{{= typeof v_action == 'undefined' ? '' : v_action }}</span>&#160;
        <div id="resourceHolder"><a href="{{= rUri }}" class="pLink">{{= resourceDisplayName }}</a></div>
        <br/><br/>&#160;
        <span class="commentListDate">{{= Lablz.U.getFormattedDate(dateModified) }}</span>
      </td>
    </tr>
  </table>
  <table width="100%">
    <tr>
    <td colspan="2">
      <div class="btn">
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a data-icon="comment" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?type=http://www.hudsonfog.com/voc/model/portal/Comment&amp;-commentList=y&amp;bUri=sql%3furi%3d' +  encodeURIComponent(v_showCommentsFor) }}">
          </a>
        {{ } }}
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?.vote=Like&amp;-changeInplace=y&amp;type=http://www.hudsonfog.com/voc/aspects/tags/Vote&amp;bUri=sql%3furi%3d' + encodeURIComponent(v_showVotesFor) }}"> 
          </a>
        {{ } }}
        {{ if (typeof v_showRenabFor != 'undefined') { }}
          <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?-inPage=y&amp;originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
            <!--Nab-->
          </a>
        {{ } }}
        </div>
    </td>
    </tr>
  </table>
</script>

<script type="text/template" id="masonry-list-item">
  <!--div class="anab" -->
  <div class="pin1">
    <!-- p style="display: inline-block;"/ -->
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img border="0" src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"></img>
      </a>
    </div>
  <div class="nabRL">
    <div>
      <!-- a href="{{= rUri }}" class="pLink">{{= davDisplayName }}</a><br/ -->
  {{= gridCols }}
    </div>
    <div class="btn">
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a data-icon="comment" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?type=http://www.hudsonfog.com/voc/model/portal/Comment&amp;-commentList=y&amp;bUri=sql%3furi%3d' +  encodeURIComponent(v_showCommentsFor) }}">
          </a>
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?.vote=Like&amp;-changeInplace=y&amp;type=http://www.hudsonfog.com/voc/aspects/tags/Vote&amp;bUri=sql%3furi%3d' + encodeURIComponent(v_showVotesFor) }}"> 
          </a>
        {{ } }}
        {{ if (typeof v_showRenabFor != 'undefined') { }}
          <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?-inPage=y&amp;originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
          </a>
        {{ } }}
     </div>
  </div>
  </div>     
<!--/div -->
</script>

</div>
