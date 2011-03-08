<div>
	
	<!--include name="BhoostApplet.jsp" /-->
  <getResource/>
  <views />
  <siteTitle name="title" />
  <!--tablePropertyList/-->
  <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
  <siteResourceList/>
  <parallelResourceList/>
  <resourcesSearch resourcesUri = "text/search/resources" />
  <filesSearch     filesUri     = "text/search/files" />
  <excelsSearch    excelsUri    = "text/search/excels" />
  <menu toolbar="file" flat="y"/>
  
  <filterUrl />
  <pagingResources/>
  
</div>

