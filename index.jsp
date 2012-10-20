<div id="jQUi">
  <div id="header">
    <a id="backButton" href="javascript:;" class="button" style="visibility: hidden">Back</a> 
    <h1 id="pageTitle">Urbien</h1> 
  </div>
  <div id="content">
    <h2>hey</h2>
  
    <div id="sidebarDiv">
      <ul id='sidebar'>
      </ul>
    </div>
  </div>
  
  <!--h2>One Urbien at a time</h2-->
    <div id="navbar">
       <a target="#welcome" class="icon home">Home</a>
    </div>
    <!-- nav>
        <div class='title'>Home</div>
        <ul>
            <li class="icon home mini"><a href="#main">Home</a></li>
        </ul>
    </nav>
    <nav id="second_nav">
        <div class='title'>Second</div>
        <ul>
            <li class="icon info mini"><a href="#about">About</a></li>
        </ul>
    </nav -->
<!-- Templates -->
<!-- script type="text/javascript">
  if (Backbone.history.length != 0)
    $.ui.showBackButton = true;
</script -->

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