<div width="1%">
<form name="searchForm" method="GET" action="localSearchResults.html" style="margin-bottom:0; margin-top:0; vertical-align: middle">
 <div style="white-space: nowrap">
   <input type="hidden" name="-$action"   value="searchText" ></input>
   <input type="text" class="input" size="25" name="-q" value="-- Search --" onclick="onFormFieldClick(searchForm, this)" onChange="onFormFieldChange(searchForm, this, '-- Search --')" onBlur="onFormFieldChange(searchForm, this, '-- Search --')"/>
     <fullTextSearchChoice/><input type="image" name="search" tooltip1="help/textSearch.html" src="icons/search.gif" value="Go" style="border: none; padding: 0px; margin-left: 0; margin-right: 0; vertical-align: middle"></input>
 </div>
 <input type="hidden" name="resourcesUri" value="/sql/text/search/resources" />
 <input type="hidden" name="filesUri" value="text/search/files" />
 <input type="hidden" name="excelUri" value="text/search/excels" />
</form>
</div>