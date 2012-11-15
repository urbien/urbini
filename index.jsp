<div>
<!-- Templates -->
<script type="text/template" id="resource-list">
  <div id="headerDiv"></div>
  <!--div id="map" data-role="none"></div-->
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" class="ui-content" data-role="content" role="main">
    <ul id="sidebar" data-role="listview" class="ui-listview" data-theme="c">
    </ul>
  </div>
  
  <div data-role="footer" class="ui-footer ui-bar-c" data-position="fixed">
     <a target="#welcome" class="icon home">Home</a>
     <a id="nextPage" target="#" class="icon next ui-btn-right">Next</a>
  </div>
</script>  

<script type="text/template" id="resource">
  <div id="headerDiv"></div>
  <div id="resourceView" data-role="content">
    <!-- div align="center"><img align="middle" src="{{= typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage }}"></img></div --> 
    <div align="center"><img align="middle" src="{{= typeof mediumImage != 'undefined' ? (mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage) : (typeof featured == 'undefined' ? 'icons/blank.png' : (featured.indexOf('Image/') == 0 ? Lablz.serverName + featured.slice(5) : Lablz.serverName + featured)) }}"></img></div> 
    <ul data-role="listview" data-theme="c" id="resourceView" class="action-list" data-inset="true"></ul>
    <!--ul id="sidebar" data-role="listview" class="ui-listview" data-inset="true" data-theme="c">
    </ul -->
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="stringPT">
  <span>{{= value }}</span>
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
    <span>{{= Utils.getFormattedDate(value) }}</span>
</script>
<!--script type="text/template" id="datePT">
    <span>{{= new Date(value / 1000) }}</span>
</script -->

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

<script type="text/template" id="complexDatePT">
  <span>{{= typeof displayName != 'undefined' ? displayName : Utils.getFormattedDate(value) }}</span>
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
      <li>{{= key }}: {{= val }}</li>
    {{ }); }}
    {{ if (typeof image != 'undefined') { }}
    <span><a href="{{= Lablz.pageRoot + '#view/' + encodeURIComponent(uri) }}"> {{= image ? '<br />' + image : '' }} </a></span>
    {{ } }}
  </ul>
</script>

<script type="text/template" id="imagePT">
    <span><img src="{{= value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.slice(5) : Lablz.serverName + value }}" /></span>
    <!--span><img src="{{= value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.slice(5) : Lablz.serverName + value }}" {{= width ? " width='" + width + "'" : '' }} {{= height ? " height='" + height + "'" : '' }} /></span-->
</script>

<script type="text/template" id="listItemTemplate">
  <a href = "{{= Lablz.pageRoot + '#view/' + encodeURIComponent(_uri) }}"><img align="middle" src="{{= typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage }}" /><h3>{{= davDisplayName }}</h3><p>{{= (typeof latinName == 'undefined') ? '' : latinName }}</p></a>
</script>

<script type="text/template" id="propRowTemplate">
   <li>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
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
  <a id="mapIt" target="#" data-role="button" data-icon="map" class="icon next">Map It</a>
</script>

<script type="text/template" id="mapTemplate">
  <div id="map" class="map" data-role="none"></div>
</script>

<script type="text/template" id="backButtonTemplate">
  <a id="back" target="#" data-role="button" data-icon="back" class="back">Back</a>
</script>

<script type="text/template" id="aroundMeButtonTemplate">
  <a id="aroundMe" target="#" data-role="button" class="icon next">Around Me</a>
</script>

<script type="text/template" id="headerTemplate">
  <div id="header" data-role="header" class="ui-header ui-bar-c" role="banner" data-position="fixed">
    <div id="headerLeft"></div>
    <div id="errMsg"></div>
    <h1 id="pageTitle">{{= this.pageTitle }}</h1>
    <div id="headerRight"></div>
  </div>
</script>

</div>
