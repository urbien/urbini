<form name="searchForm" method="GET" action="searchResult.html">
<table width="100%" border="0" cellpadding="3" cellspacing="0">
  <tr valign="top" class="keywordsearch">
    <td ><changePassword/><userLogOff html="user-login.html"/></td>
    <td align="right">
 <nobr><input type="text" size="12" name="q" value="-- Search --" class="text" onClick="onFormFieldClick(searchForm, this)" onChange="onFormFieldChange(searchForm, this, '-- Search --')" onBlur="onFormFieldChange(searchForm, this, '-- Search --')"/><input type="submit" name="search" class="button1" value="Go"></input></nobr>
 <input type="hidden" name="resourcesUri" value="/sql/text/search/resources" />
 <input type="hidden" name="filesUri" value="text/search/files" />
 <input type="hidden" name="excelUri" value="text/search/excels" />
    </td>
  </tr>
</table>
</form>