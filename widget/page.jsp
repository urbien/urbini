<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>

  <div id="mainskin" class="blue">
    <options />
	  <div id="mainDiv">
      <siteTitle name="title" />
  <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
		  <!--tablePropertyList/-->
		  <siteResourceList/>
		  <pagingResources/>
	  </div>
  </div>
  <include name="requiredFooter.jsp"/>
  </body>
</html>


