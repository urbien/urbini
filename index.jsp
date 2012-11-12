<div>
<!-- Templates -->
<script type="text/template" id="resource-list">
  <div id="headerDiv"></div>
  <!--div id="map" data-role="none"></div-->
  <div id="mapHolder" height="200px" width="100%" data-role="none"></div>
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
    <div align="center"><img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage }}"></img></div> 
    <ul data-role="listview" data-theme="c" id="resourceView" class="action-list" data-inset="true"></ul>
    <!--ul id="sidebar" data-role="listview" class="ui-listview" data-inset="true" data-theme="c">
    </ul -->
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="stringTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="dateTemplate">
    <span>{{ new Date(value / 1000) }}</span>
</script>

<script type="text/template" id="intTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="moneyTemplate">
  <span>{{ value.currency + value.value }}</span>
</script>

<script type="text/template" id="complexDateTemplate">
  <span>{{ typeof displayName != 'undefined' ? displayName : new Date(value.date / 1000) }}</span>
</script>

<script type="text/template" id="resourceTemplate">
  <span><a href="{{ Lablz.serverName + '/bb#view/' + encodeURIComponent(value) }}">{{ typeof displayName == 'undefined' ? value : displayName }}</a></span>
</script>

<script type="text/template" id="mapItemTemplate">
<span><a href="{{ Lablz.serverName + '/bb#view/' + encodeURIComponent(value) }}">{{ typeof displayName == 'undefined' ? value : displayName }} {{ image ? '<br />' + image : '' }} </a></span>
</script>

<script type="text/template" id="imageTemplate">
    <span><img src="{{ value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.slice(5) : Lablz.serverName + value }}" /></span>
    <!--span><img src="{{ value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.slice(5) : Lablz.serverName + value }}" {{ width ? " width='" + width + "'" : '' }} {{ height ? " height='" + height + "'" : '' }} /></span-->
</script>

<script type="text/template" id="listItemTemplate">
  <a href='#view/{{ encodeURIComponent(_uri) }}'><img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage }}" /><h3>{{ davDisplayName }}</h3><p>{{ (typeof latinName == 'undefined') ? '' : latinName }}</p></a>
</script>

<script type="text/template" id="propRowTemplate">
   <li>{{ name }}<div style="float: right; font-weight: normal;">{{ value }}</div></li>
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
    <h1 id="pageTitle">{{ this.pageTitle }}</h1>
    <div id="headerRight"></div>
  </div>
</script>

</div>
