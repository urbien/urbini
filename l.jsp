<div>
<div nonPda="T">
<hideBlock id="hideBlock">
  <watchNote/>
</hideBlock>
<getResource/>

<div id="gallery" class = "box" style="width:auto !important; width:1px;height:auto !important; height:1px;display:none;position:absolute;" itype="http://www.hudsonfog.com/voc/model/portal/ImageResource">
  <table bgcolor="#ffffff" cellpadding="0" cellspacing="0">
  	<tr><td>
	    <div id="titleBar" class="drag" dragcontainer="gallery"></div>
    </td></tr>
    <tr valign="top"><td class="largeImage" style="padding:5px;" valign="top"><img id="galleryImage" src="about:blank"></img></td></tr>
    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="about:blank"></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer;" title="click to close"></img></td></tr-->
  </table>
</div>

<errorMessage />

<table id="resourceList" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td><pagingResources /></td>
</tr>
<tr valign="top">
  <td width="110%" colspan="2"><!--br/-->
		<div>
		  <searchHistory/>
		  <resourcesSearch resourcesUri="/sql/text/search/resources" />
		  <filesSearch     filesUri="text/search/files" />
      <excelsSearch    excelsUri    = "text/search/excels" />
		</div>
    <taskTreeControl/>
    <div id="siteResourceList">
      <errorMessage additems="y"/>
      <siteResourceList />
      <br/>
  	  <uploadAttachment/>
      <createResources/><br/>
    </div>
    <div align="right"><measurement/></div>
    <readOtherSiteInfo />
<hideBlock>
    <br/>
    <uploadMsProject/>
    <uploadToDelegatedFileSystem/>
<br/><br/>
    <pieChart/>
    <script language="JavaScript">
      var horizontalFilter_FIELDS = new Array();
    </script>
    <form name="horizontalFilter" id="filter" method="POST">
      <br/>
      <horizontalFilter />
    </form>
</hideBlock>
  </td>
  <td width="5%" id="rightPanelPropertySheet" valign="top" align="left">
<hideBlock>
   <include name="commonFilterLocal.jsp" />
    <!--menu toolbar="filterLocal" type="onpage" title="false"/-->
</hideBlock>
  </td>
  </tr>
</table>
</div>

<div pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td colspan="2">
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <taskTreeControl/>
      <siteResourceList />
      <createResources/>
      <div align="right"><measurement/></div>
    </form>
    </td></tr>

    </table>
</td></tr></table>

<hideBlock>
<br />
<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
<script language="JavaScript">
  var horizontalFilter_FIELDS = new Array();
</script>
<form name="horizontalFilter" id="filter" method="POST" autocomplete="off">
  <br/>
    <horizontalFilter />
</form>
</hideBlock>
</div>

</div>
