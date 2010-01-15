<!-- 
This JSP is full html page and contains 1st "mobile" page
for further "mobile" pages m/page.jsp is used.
However this JSP is used for pages containig errors message too (?)
-->
<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>
  <!-- include name="BhoostApplet.jsp" /-->
  <div id="mainskin" class="blue">
    <options />
    <div id="myScreenName" class="hdn" />
    <div id="im_empty" class="hdn" />
	  <div id="mainDiv" class="mobile_page">
	  	<errorMessage />
	    <views />
      <siteTitle name="title" />
		  <tablePropertyList/>
		  <siteResourceList/>
		  <pagingResources/>
		  <menu toolbar="file" flat="y"/>
		  <filterUrl />
	
	  </div>
	</div>
	
  <include name="requiredFooter.jsp"/>
  </body>
</html>


