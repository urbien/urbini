<div>
<!-- Templates -->
<script type="text/template" id="resource-list">
  <div data-role="header" class="ui-header ui-bar-c" role="banner">
    <h1 id="pageTitle">{{ this.model.className }}</h1> 
    <!--div id="mapBtnDiv" class="ui-screen-hidden"><a href="#" id="mapIt" data-icon="map" class="back ui-btn-right">Map It</a></div-->
    <a href="#" id="mapIt" data-icon="map" class="back ui-btn-right ui-screen-hidden">Map It</a>
  </div>
  <div  id="sidebarDiv" class="ui-content" data-role="content" role="main">
    <div id="listMap"></div>
    <ul id="sidebar" data-role="listview" class="ui-listview" data-theme="c">
    </ul>
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  
<script type="text/template" id="resource">
  <div data-role="header"  class="ui-header ui-bar-c" role="banner">
    <a href="#" data-icon="back" class="back ui-btn-left">Back</a>
    <h1 id="pageTitle">{{ davDisplayName }}</h1> 
    <a href="#" id="mapIt" data-icon="map" class="back ui-btn-right ui-screen-hidden">Map It</a>
  </div>
  <!--div id="resourceMap" class="map"></div-->
  <div data-role="content">
    <div id="resourceMap"></div>
    <div align="center"><img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.slice(5) : Lablz.serverName + mediumImage }}"></img></div> 
    <ul data-role="listview" data-theme="c" id="resourceView" class="action-list" data-inset="true"></ul>
    <!--ul id="sidebar" data-role="listview" class="ui-listview" data-inset="true" data-theme="c">
    </ul -->
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
</script>  

<script type="text/template" id="mapTemplate">
  <div id="map"></div>
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
<span><a href="{{ Lablz.serverName + '/bb#view/' + value }}">{{ typeof displayName == 'undefined' ? value : displayName }} {{ image ? '<br />' + image : '' }} </a></span>
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

