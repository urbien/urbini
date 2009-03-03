<div width="1%" style="display:inline">
<form name="searchForm" method="GET" action="l.html" class="ftSearch">
 <div style="white-space: nowrap;display:inline">
<table class="ftSearch" cellspacing="0" cellpadding="0" border="0">
  <tr class="menuLine"><td valign="bottom">
    <input type="hidden" name="-$action" value="searchText" />
    <!--input type="hidden" name="-cat" value="on" /-->
    <input type="text" class="ftsq" size="35" name="-q" value="-- Search --" onclick="onFormFieldClick(searchForm, this)" onChange="onFormFieldChange(searchForm, this, '-- Search --')" onBlur="onFormFieldChange(searchForm, this, '-- Search --')" />
    <fullTextSearchChoice/>
  </td></tr>
</table>
 </div>
 <input type="hidden" name="resourcesUri" value="text/search/resources" />
 <input type="hidden" name="filesUri" value="text/search/files" />
 <input type="hidden" name="excelUri" value="text/search/excels" />
</form>
</div>