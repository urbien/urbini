<div>
<!--include name="readOnlyResourceTitle.jsp" /-->
<!--hideBlock id="hideBlock">
<table width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr valign="top" class="keywordsearch">
  <td valign="top" width="100%" class="keywordsearch">
   <table width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td width="90%">
    <menu toolbar="toolbar1"        activate="onMouseOver"/>
    <menu toolbar="helpdesk"        activate="onMouseOver" allow="admin" />
    <menu toolbar="transport"       activate="onMouseOver"/>
    <menu toolbar="search"          activate="onMouseOver"/>
    <menu toolbar="toolbar2"        activate="onMouseOver"/>
    <menu toolbar="support"         activate="onMouseOver" allow="admin"/>
    <menu toolbar="personalization" activate="onMouseOver"/>

    </td>
    <td valign="top" align="right" width="10%">
      <include name="searchText.jsp"/>
    </td>
   </tr></table></td>
  </tr>
</table>
</hideBlock-->
<form name="categoryTextSearch">
  <searchHistory/>
  <categoryTextSearch />
  <resourcesSearch resourcesUri = "text/search/resources" />
  <filesSearch filesUri         = "text/search/files" />
</form>
</div>

