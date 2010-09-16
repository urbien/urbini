<div id="RL">
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
    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="javascript: ;"></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer;" title="click to close"></img></td></tr-->
  </table>
</div>

<errorMessage />


<table id="resourceList" width="100%" cellspacing="0" cellpadding="0" border="0">
	<tr noInner="y" class="fts" valign="bottom">
  	<td><fullTextSearchChoice/></td><td><filter/></td><td align="right"><pagingResources /></td>
	</tr>
  <tr itype="http://www.hudsonfog.com/voc/system/designer/WebClass">    
    <td colspan="3" align="center"><filter addToTab="y"/></td>
  </tr>
	<tr valign="top">
	  <td colspan="3">
	  <table width="100%" cellspacing="0" cellpadding="0" border="0">
	  <tr valign="top">
    <include name="${type}_left.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
	
    <td width="100%">
  		<div>
  		  <searchHistory/>
  		  <resourcesSearch resourcesUri = "text/search/resources" />
  		  <filesSearch     filesUri     = "text/search/files" />
        <excelsSearch    excelsUri    = "text/search/excels" />
  		</div>
      <taskTreeControl/>
      <div id="siteResourceList">
        <categories/>
        <errorMessage additems="y"/>
        <siteResourceList />
    	  <uploadAttachment/>
        <createResources/>
      </div>
      <div align="right"><measurement/></div>
      <readOtherSiteInfo />
  <hideBlock>
      <uploadMsProject/>
      <uploadToDelegatedFileSystem/>
      <pieChart/>
  	<filterUrl />
  </hideBlock>
  </td>
  <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->

  </tr>
</table>
</td>
  </tr>
</table>
 
</div>
