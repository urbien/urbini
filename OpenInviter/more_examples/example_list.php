<?php
include('../openinviter.php');
$inviter=new OpenInviter();
$oi_services=$inviter->getPlugins();
$contents="<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'><html>";
$contents.="<head>
<style type='text/css'>
body {
	background: #f0f0f0;
	margin: 0;
	padding: 0;
	font: 10px normal Verdana, Arial, Helvetica, sans-serif;
	color: #444;
}
h1 {font-size: 3em; margin: 20px 0;}
.container {width: 680px; margin: 10px auto;}
ul.tabs {
	margin: 0;
	padding: 0;
	float: left;
	list-style: none;
	height: 32px;
	border-bottom: 1px solid #999;
	border-left: 1px solid #999;
	width: 100%;
}
ul.tabs li {
	float: left;
	margin: 0;
	padding: 0;
	height: 31px;
	line-height: 31px;
	border: 1px solid #999;
	border-left: none;
	margin-bottom: -1px;
	background: #e0e0e0;
	overflow: hidden;
	position: relative;
}
ul.tabs li a {
	text-decoration: none;
	color: #000;
	display: block;
	font-size: 1.2em;
	padding: 0 20px;
	border: 1px solid #fff;
	outline: none;
}
ul.tabs li a:hover {
	background: #ccc;
}	
html ul.tabs li.active, html ul.tabs li.active a:hover  {
	background: #fff;
	border-bottom: 1px solid #fff;
}
.tab_container {
	border: 1px solid #999;
	border-top: none;
	clear: both;
	float: left; 
	width: 100%;
	background: #fff;
	-moz-border-radius-bottomright: 5px;
	-khtml-border-radius-bottomright: 5px;
	-webkit-border-bottom-right-radius: 5px;
	-moz-border-radius-bottomleft: 5px;
	-khtml-border-radius-bottomleft: 5px;
	-webkit-border-bottom-left-radius: 5px;
}
.tab_content {
	padding: 20px;
	font-size: 1.2em;
}
.tab_content h2 {
	font-weight: normal;
	padding-bottom: 10px;
	border-bottom: 1px dashed #ddd;
	font-size: 1.8em;
}
.tab_content h3 a{
	color: #254588;
}
.tab_content img {
	float: left;
	margin: 0 20px 20px 0;
	border: 1px solid #ddd;
	padding: 5px;
}
</style>
<script type='text/javascript'
src='http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.min.js'></script>
<script type='text/javascript'>
$(document).ready(function() 
	{
	$('.tab_content').hide();
	$('ul.tabs li:first').addClass('active').show();
	$('.tab_content:first').show();

	$('ul.tabs li').click(function() 
		{
		$('ul.tabs li').removeClass('active');
		$(this).addClass('active');
		$('.tab_content').hide();
		var activeTab = $(this).find('a').attr('href');
		$(activeTab).fadeIn();
		return false;
		});
	});
</script>
<script type='text/javascript' src='js/jquery.mousewheel-3.0.4.pack.js'></script>
<script type='text/javascript' src='js/jquery.fancybox-1.3.4.pack.js'></script>
<link rel='stylesheet' type='text/css' href='css/jquery.fancybox-1.3.4.css' media='screen' />
<link rel='stylesheet' href='css/style.css'/>
<script type='text/javascript'>
$(document).ready(function() 
	{
";
$contents.=createJsServices('email');
$contents.=createJsServices('social');
$contents.="
});
</script>
</head>
<body>
<div class='container'>
	<h1>Select service example</h1>
    <ul class='tabs'>
        <li><a href='#email'>Email Services</a></li>
        <li><a href='#social'>Social Services</a></li>        
    </ul>
	<div style='position:absolute;top:40px;right:270px;'><a href='http://openinviter.com/'><img src='http://openinviter.com/images/banners/banner_blue_1.gif?nr=118' border='0' alt='Powered by OpenInviter.com' title='Powered by OpenInviter.com'></a></div>
<div class='tab_container'>
";
$contents.=createHtmlServices('email');
$contents.=createHtmlServices('social');
$contents.="</div></body></html>";
echo $contents;$contents="";

function createJsServices($type)
	{
	global $oi_services;
	$contents="";	
	foreach($oi_services[$type] as $service=>$data)
		$contents.="$('#{$service}').fancybox({ 'autoScale' : true, 'overlayShow': true, 'overlayShow': true, 'transitionIn': 'elastic', 'transitionOut': 'none', 'type': 'iframe', 'autoDimensions': true });\n";
	return $contents;
	}

function createHtmlServices($type)
	{
	global $oi_services;
	$contents="<style type='text/css'>
	.crop_image_{$type} { background-image:url('imgs/{$type}_services.png'); border:none; display:block; height:60px; margin:0; padding:0; width:130px; }
	</style>
	";
	$nCols=5;$c=0;$r=-1;$smallImageWidth=130;$smallImageHeight=60;
	$contents.="<div id='{$type}' class='tab_content'><table cellspacing='0' cellpadding='0' style='border: medium none;'>";
	foreach($oi_services[$type] as $service=>$data)
		if (strpos($oi_services[$type][$service]['name'],'DEV')!==FALSE) unset($oi_services[$type][$service]);
	foreach($oi_services[$type] as $service=>$data)
		{
		$r++;
		if ($c % $nCols==0) { $c=0; $contents.="<tr>"; }
		$contents.="
					<td align='center'>
						<a href='get_contacts.php?provider_box={$service}' id='{$service}'>
							<div style='background-position: 0px ".(-$smallImageHeight*$r)."px;' class='crop_image_{$type}'></div>
						</a>
					</td>					
					";	
		$c++;
		if ($c % $nCols==0) $contents.="</tr>";	
		}
	$contents.="</tr></table></div>";
	return $contents;
	}

?>