<div>
<errorMessage />
<table id="resourceList" width="100%" border="0" cellspacing="0" cellpadding="0">
	<tr noInner="y" class="fts" valign="bottom">
  	<td colspan="2"><table width="100%"><tr><td><fullTextSearchChoice/></td><td><filter/></td><td><pagingResources /></td></tr></table></td>
	</tr>
  <tr  valign="top">
  <td colspan="2">
    
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top">
    <include name="${type}_left.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
    <td valign="top" align="middle" width="100%">
		<form name="categoryTextSearch">
			  <searchHistory/>
			  <categoryTextSearch />
			  <resourcesSearch resourcesUri = "text/search/resources" />
			  <filesSearch     filesUri     = "text/search/files" />
		</form>
    <taskTreeControl/>
    <parallelResourceList />
    <div align="right"><measurement/></div>
    <createResources/><br/>
    <filterUrl />
  </td>
  <include name="${type}_right.jsp"/>         <!-- this jsp will be included in ResourceList page only-->
  </tr>
</table>
</td>  
</tr>
</table>
</div>

