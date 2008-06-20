<div width="1%" style="display:inline">
<form name="searchForm" method="GET" action="l.html" class="ftSearch">
 <div style="white-space: nowrap;display:inline">
<table class="ftSearch" cellspacing="0" cellpadding="0" border="0">
  <tr><td>
    <input type="hidden" name="-$action" value="searchText" />
    <input type="text" class="input" size="25" name="-q" value="-- Search --" onclick="onFormFieldClick(searchForm, this)" onChange="onFormFieldChange(searchForm, this, '-- Search --')" onBlur="onFormFieldChange(searchForm, this, '-- Search --')" /><input type="image" name="search" tooltip1="help/textSearch.html" src="icons/search.gif" value="Go" style="border: none; padding: 0px; margin-left: 0; margin-right: 0; vertical-align: middle" />
  </td></tr>
  <tr><td>
    <fullTextSearchChoice/>
  </td></tr>
</table>
 </div>
 <input type="hidden" name="resourcesUri" value="text/search/resources" />
 <input type="hidden" name="filesUri" value="text/search/files" />
 <input type="hidden" name="excelUri" value="text/search/excels" />
</form>
</div>