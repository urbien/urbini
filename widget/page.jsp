<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>

  <div id="mainskin" class="blue">
	  <div id="mainDiv">
		  <tablePropertyList/>
		  <siteResourceList/>
		  <pagingResources/>
	  </div>
  </div>
  <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
  <include name="requiredFooter.jsp"/>
  </body>
</html>


