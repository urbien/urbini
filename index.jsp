<div>
  <div data-role="header">
    <h1 id="pageTitle">Urbien</h1> 
  </div>
  <div data-role="content">
    <h2>hey</h2>
    <div id="resourceView">
    </div>
    <div id="sidebarDiv">
      <ul id="sidebar">
      </ul>
    </div>
  </div>
  
  <div data-role="footer">
     <a target="#welcome" class="icon home">Home</a>
  </div>
<!-- Templates -->

<script type="text/template" id="stringTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="dateTemplate">
    <span>{{ new Date(value/1000) }}</span>
</script>

<script type="text/template" id="intTemplate">
    <span>{{ value }}</span>
</script>

<script type="text/template" id="uriTemplate">
    <span><a href="{{ value.indexOf('http') == 0 ? value : Lablz.serverName + '/v/' + value }}">{{ value }}</a></span>
</script>

<script type="text/template" id="imageTemplate">
    <span><img src="{{ value.indexOf('http') == 0 ? value : value.indexOf('Image/') == 0 ? Lablz.serverName + value.substring(5) : Lablz.serverName + value }}" /></span>
</script>

<script type="text/template" id="listItemTemplate">
  <a data-transition='slide' href='#view/{{ _uri }}'><img align="middle" src="{{ typeof mediumImage == 'undefined' ? 'icons/blank.png' : mediumImage.indexOf('Image/') == 0 ? Lablz.serverName + mediumImage.substring(5) : Lablz.serverName + mediumImage }}" />&#160;{{ davDisplayName }}</a>
</script>

<script type="text/template" id="propRowTemplate">
  <div>
    <div class="propRow">{{ name }}: {{ value }}</div>
  </div>
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

</div>