<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="c"></div> 
  <div id="headerDiv"></div>
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" class="ui-content" data-role="content" role="main">
    <ul id="sidebar" data-role="listview" class="ui-listview" data-theme="c"></ul>
    <div id="nabs_grid" class="masonry">
    </div>
    <!-- ul id="columns">
    </ul -->
    <table data-role="table" data-mode="reflow" class="table-stroke" width="100%" id="comments">
    </table>
  </div>
  
  <div data-role="footer" class="ui-bar" data-theme="d">
     <a data-role="button" data-icon="home" id="homeBtn" target="#">Home</a>
     <!-- nextPage button removed after endless page introduction -->
     <a data-role="button" data-icon="arrow-right" id="nextPage" target="#" class="next" style="float:right;">Next</a>
  </div>
</script>  
 
<script type="text/template" id="resource">
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="c"></div> 
  <div id="headerDiv"></div>
  <div id="resourceViewHolder" data-role="content">
    <div id="resourceImage"></div><br/>
    <ul data-role="listview" data-theme="c" id="resourceView" class="action-list">
    </ul>
    {{ if ($('#other')) { }}
      <br/>
      <br/>
    {{ } }}
    <ul data-role="listview" data-theme="c" id="cpView" class="ui-listview">
    </ul>
  </div>

  <div data-role="footer" class="ui-bar" data-theme="d">
     <a data-role="button" data-icon="home" id="homeBtn" target="#">Home</a>
     <a data-role="button" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">Edit</a>
  </div>
</script>  

<script type="text/template" id="menuP">
   <ul data-role="listview" id="menuItems">
   </ul>
</script>  

<script type="text/template" id="menu">
  <div id="headerDiv" data-theme="a"></div>
  <div id="menuHolder" data-role="content" data-theme="a">
    <ul data-role="listview" data-theme="a" id="menuItems" class="action-list" data-inset="true">
    </ul>
  </div>
  
  <div data-role="footer" class="ui-bar" data-theme="d">
     <a data-role="button" data-icon="home" id="homeBtn" target="#">Home</a>
  </div>
</script>  

<script type="text/template" id="stringPT">
  {{ if (typeof value != 'undefined' && value.indexOf('<span') == -1) { }}
     <span>{{= value }}</span>
  {{ } }}
  {{ if (typeof value != 'undefined' && value.indexOf('<span') == 0) { }}
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
  <span>{{= Lablz.U.getFormattedDate(value) }}</span>
</script>

<script type="text/template" id="durationPT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Lablz.U.getFormattedDuration(value) }}</span>
</script>

<!--script type="text/template" id="datePT">
    <span>{{= new Date(value / 1000) }}</span>
</script -->

<script type="text/template" id="booleanPT">
  <span>{{= typeof value === 'undefined' || !value ? 'No' : 'Yes' }}</span>
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
  <span>{{= (typeof value.currency === 'undefined' ? '$' : value.currency) + (typeof value.value === 'undefined' ? 0 : value.value) }}</span>
</script>

<!--script type="text/template" id="durationPT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Lablz.U.getFormattedDate(value) }}</span>
</script-->

<script type="text/template" id="complexDatePT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Lablz.U.getFormattedDate(value) }}</span>
</script>

<script type="text/template" id="resourcePT">
  <span><a style="text-decoration:none" href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(value) }}">{{= typeof displayName == 'undefined' ? value : displayName }}</a></span>
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
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(_uri) }}">
    <img src="{{= typeof image != 'undefined' ? (image.indexOf('/Image') == 0 ? image.slice(6) : image) : 'icons/blank.png'}}" 
    {{ if (typeof width != 'undefined') { }}  
      style="
        width:{{= width }}px; height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
    {{ } }}
    />      
    {{= viewCols }}
  </a>
  {{ if (typeof distance != 'undefined') { }}
    <span class="ui-li-count">{{= distance }}</span>
  {{ } }}
</script>

<script type="text/template" id="listItemTemplateNoImage">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(_uri) }}">
    {{= viewCols }}
  </a>
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

<script type="text/template" id="cpTemplate">
   <li><a href="{{= Lablz.pageRoot + '#' + encodeURIComponent(range) + '?' + backlink + '=' + encodeURIComponent(_uri) + '&$title=' + encodeURIComponent(name) }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a href="#" data-shortName="{{= shortName }}" data-icon="plus"></a></li>
</script>

<script type="text/template" id="cpTemplateNoAdd">
   <li><a href="{{= Lablz.pageRoot + '#' + encodeURIComponent(range) + '?' + backlink + '=' + encodeURIComponent(_uri) + '&$title=' + encodeURIComponent(name)}}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a target="#" data-theme="c" data-icon="arrow-r"></a></li>
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

<!--script type="text/template" id="editButtonTemplate">
  <a id="edit" target="#" class="icon next ui-btn-right">Edit</a>
</script-->

<script type="text/template" id="mapItButtonTemplate">
  <li>
    <a id="mapIt" target="#" data-icon="globe">Map It</a>
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

<script type="text/template" id="addButtonTemplate">
  <li id="addBtn">
    <a target="#" data-icon="plus-sign">Create</a>
  </li>  
</script>

<script type="text/template" id="menuButtonTemplate">
  <li id="menuBtn">
    <a target="#" href="#{{= viewId }}" data-icon="reorder">Menu</a>
  </li>  
</script>

<script type="text/template" id="loginButtonTemplate">
  <li id="login">   
    <a target="#" data-icon="signin">Sign In</a>
  </li>
</script>

<script type="text/template" id="loginPopupTemplate">
  <div id="login_popup" style="text-align: center; background: #eeeeee;" data-role="popup" data-transition="slidedown" data-overlay-theme="a" class="ui-content">
    <h4>Login through Social Network</h4>
    <a href="#" data-rel="back" data-role="button" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>
    {{ _.forEach(nets, function(net) { }} 

    <a data-role="button" href="{{= net.url }}"> 
        <span class="big_symbol 
        {{ if(net.socialNet == "Facebook") { }} ui-icon-facebook-sign {{ } }}
        {{ if(net.socialNet == "Google") { }} ui-icon-google-plus-sign {{ } }}
        {{ if(net.socialNet == "Twitter") { }} ui-icon-twitter-sign {{ } }}
        {{ if(net.socialNet == "Live") { }} ui-icon-live-sign {{ } }}
        {{ if(net.socialNet == "LinkedIn") { }} ui-icon-linkedin-sign {{ } }}
        "/ >
       </span>
       {{= net.socialNet }}
    </a>

    {{ }); }}

    <!--h5>Login by Email</h5>
    <form id="loginForm" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
      <table>
        <tr><td>Email: </td><td><input name="j_username" /></td></tr>
        <tr><td>Password: </td><td><input type="password" name="j_password" /></td></tr>
        <tr><td colspan="2"><input type="submit" value="Submit" /></td></tr>
      </table>
    </form-->
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


<script type="text/template" id="comment-item">
<td width="1%" valign="top">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(submitter) }}">
    <img src="{{= obj['submitter.thumb'] }}" />
  </a>
</td>
<td class="cl" valign="top">
  <a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(submitter) }}">
    {{= obj['submitter.displayName'] }}
  </a><br/>
  {{= (typeof description == 'undefined') ? title : description }}
  <br/><br/>
  <span class="commentListDate">{{= obj['submitTime.displayName'] }}</span>
  <br/>
  <a data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'mkResource.html?.vote=Like&amp;-changeInplace=y&amp;type=http://www.hudsonfog.com/voc/aspects/tags/Vote&amp;bUri=' + encodeURIComponent('sql?uri=' + encodeURIComponent(_uri)) }}">
  </a>
</td>
</script>

<script type="text/template" id="masonry-mod-list-item">
  <div class="anab">
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img border="0" src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"
        {{ if (typeof imgWidth != 'undefined') { }} 
         style="width: {{= imgWidth }}px; height:{{= imgHeight }}px;"
         {{ } }}
         ></img>
      </a>
    </div>
  </div>
  <table width="100%" class="modP">
    <tr>
      <td class="urbien" width="55px">
        <a href="{{= modifiedBy }}">
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
          <a data-icon="comment" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= Lablz.pageRoot + '#make/' + encodeURIComponent('http://www.hudsonfog.com/voc/model/portal/Comment') +'?forum=' + v_showCommentsFor + '&amp;-makeId=' + Lablz.nextId() }}">
          </a>
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= Lablz.pageRoot + '#make/' + encodeURIComponent('http://www.hudsonfog.com/voc/aspects/tags/Vote') + '?.vote=Like&amp;votable=' + v_showVotesFor  + '&amp;-makeId=' + Lablz.nextId() }}"> 
          </a>
        {{ } }}
        <!--
        {{ if (typeof v_showRenabFor != 'undefined') { }}
          <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
          </a>
        {{ } }}
        -->
        </div>
    </td>
    </tr>
  </table>
</script>

<script type="text/template" id="masonry-list-item">
  <div class="anab">
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img border="0" src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"
         {{ if (typeof imgWidth != 'undefined') { }}
           style="width: {{= imgWidth }}px; height:{{= imgHeight }}px;"
         {{ } }}
         ></img>
      </a>
    </div>
  <div class="nabRL">
    <div>
      {{= gridCols }}
    </div>
    <div class="btn">
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a data-icon="comment" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= Lablz.pageRoot + '#make/' + encodeURIComponent('http://www.hudsonfog.com/voc/model/portal/Comment') +'?forum=' + v_showCommentsFor + '&amp;-makeId=' + Lablz.nextId() }}">
          </a>
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= Lablz.pageRoot + '#make/' + encodeURIComponent('http://www.hudsonfog.com/voc/aspects/tags/Vote') + '?.vote=Like&amp;votable=' + v_showVotesFor + '&amp;-makeId=' + Lablz.nextId() }}"> 
          </a>
        {{ } }}
        <!--
        {{ if (typeof v_showRenabFor != 'undefined') { }}
          <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?-inPage=y&amp;originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
          </a>
        {{ } }}
        -->
     </div>
  </div>     
</div>
<!--/div -->
</script>


<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="c"></div> 
<div id="headerDiv"></div>
<div id="resourceEditView" data-role="content">
  <div id="resourceImage"></div><br/>
  <form data-ajax="false" id="editForm" action="#">
    <ul data-role="listview" data-theme="c" id="fieldsList" class="action-list" data-inset="true">
    </ul>
    
    <div name="errors" style="float:left"></div>
    <div class="ui-body ui-body-b">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><button type="cancel" id="cancel" data-theme="d" class="cancel">Cancel</button></div>
        <div class="ui-block-b"><button type="submit" id="submit" data-theme="a">Submit</button></div>
      </fieldset>
    </div>
  </form>
</div>


  <div data-role="footer" class="ui-bar" data-theme="d">
     <a data-role="button" data-icon="home" id="homeBtn" target="#">Home</a>
  </div>
</script>  


<script type="text/template" id="emailPET">
  <label for="{{= id }}">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' + classes }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="editRowTemplate">
  <li data-role="fieldcontain">{{= value }}<br />
  {{= typeof comment === 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }}
  </li>
</script>

<script type="text/template" id="telPET">
  <label for="{{= id }}">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' + classes }}" />
</script>

<script type="text/template" id="longEnumPET">
  <label for="{{= id }}" class="select">{{= name }}</label>
  <select name="{{= shortName }}" id="{{= id }}" data-native-menu="false" class="{{= 'formElement ' + classes }}" data-mini="true" >
    <option>{{= value || '' }}</option>
    {{ for (var o in options) { }} 
    {{   if (o === value) continue; }}
    {{   var p = options[o]; }}
    <option value="{{= p.shortName }}">{{= U.getPropDisplayName(p) }}</option>
    {{ } }}
  </select>
</script>

<!--script type="text/template" id="shortEnumPET">
  <fieldset data-role="controlgroup" data-type="horizontal" data-mini="true">
    <legend>{{= name }}</legend>
    {{ for (var o in options) { }} 
    {{   var p = options[o]; }}
         <input type="radio" name="radio-choice-b" id="{{= id + '.' + p.shortName }}" value="{{= p.shortName }}" {{= typeof value !== 'undefined' && o === value ? 'checked="checked"' : '' }} />
         <label for="{{= id + '.' + p.shortName }}">{{= U.getPropDisplayName(p) }}</label>
    {{ } }}
  </fieldset>
</script-->

<script type="text/template" id="stringPET">
  <label for="{{= id }}">{{= name }}</label> 
  <!--input type="{{= typeof type === 'undefined' ? 'text' : type }}" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" placeholder="{{= typeof comment === 'undefined' ? '' : comment }}" /-->
  <{{= _.isUndefined(prop.maxSize) ? 'input' : prop.maxSize < 100 ? 'input' : 'textarea rows="5" cols="20" ' }} type="{{= typeof type === 'undefined' ? 'text' : type }}" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' + classes }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="telPET">
<label for="{{= id }}">{{= name }}</label> 
<input type="tel" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' + classes }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="emailPET">
<label for="{{= id }}">{{= name }}</label> 
<input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement ' + classes }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="resourcePET">
  <!--label for="{{= id }}" class="select">{{= name }}</label-->
  <a target="#" name="{{= shortName }}" class="resourceProp" >{{= typeof displayName === 'undefined' || !displayName ? name : displayName }}</a>

  <!--label for="{{= id }}" class="select">{{= name }}</label>
  <select name="{{= shortName }}" id="{{= id }}" class="{{= 'resourceProp' + classes }}" data-mini="true">
    <option value="{{= typeof value === 'undefined' ? '' : value }}">{{= name }}</option>
    <option value="test">Not supported</option>
  </select-->
</script>

<script type="text/template" id="multivaluePET">
  <a target="#" name="{{= shortName }}" class="multivalueProp" >{{= typeof displayName === 'undefined' || !displayName ? name : displayName }}</a>
</script>

<script type="text/template" id="booleanPET">
  <label for="{{= id }}">{{= name }}</label>
  <select name="{{= shortName }}" id="{{= id }}" data-role="slider" class="{{= 'formElement boolean ' + classes }}" data-mini="true">
    <option>{{= typeof value === 'undefined' || !value ? 'No' : 'Yes' }}</option>
    <option>{{= typeof value === 'undefined' || !value ? 'Yes' : 'No' }}</option>
  </select>
</script>

<!-- END EDIT TEMPLATES -->

</div>
