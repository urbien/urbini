<div width="1%">
<form name="searchForm" method="GET" action="searchResult.html" valign="middle" style="margin-bottom:0; margin-top:0; vertical-align: middle">
 <nobr>
   <input type="hidden" name="-$action"   value="searchText" ></input>
   <input type="text" class="input" size="12" name="q" value="-- Search --" onClick="onFormFieldClick(searchForm, this)" onChange="onFormFieldChange(searchForm, this, '-- Search --')" onBlur="onFormFieldChange(searchForm, this, '-- Search --')" style="padding: 0px; margin-right: 0; margin-left: 0; vertical-align: middle; text-align: center;"/>
     <fullTextSearchChoice/>&#160;
   <input type="submit" name="search" class="button1" value="Go"  style="padding: 0px; margin-right: 0; margin-left: 0; vertical-align: middle"></input>
 </nobr>
 <input type="hidden" name="resourcesUri" value="/sql/text/search/resources" />
 <input type="hidden" name="filesUri" value="text/search/files" />
 <input type="hidden" name="excelUri" value="text/search/excels" />
</form>
</div>