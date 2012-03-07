<!-- 
This JSP is full html page and contains 1st "mobile" page
for further "mobile" pages m/page.jsp is used.
However this JSP is used for pages containig errors message too (?)
-->

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html>
  <head>
    <include name="commonHead.jsp"/>
  </head>

  <body id="body">
  <include name="requiredHeader.jsp"/>
  <!-- include name="BhoostApplet.jsp" /-->
  <div id="wrapperM">
  <div id="mainskin" class="blue">
    <options />
    <div id="myScreenName" class="hdn" />
    <div id="im_empty" class="hdn" />
	  <div id="mainDiv" class="mobile_page">
	  	<include name="mobileFooter.jsp" />
	  	<errorMessage />
	    <views />
      <siteTitle name="title" />
		  <!--tablePropertyList/ -->
      <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
		  <siteResourceList/>
      <parallelResourceList/>
      <resourcesSearch resourcesUri = "text/search/resources" />
      <filesSearch     filesUri     = "text/search/files" />
      <excelsSearch    excelsUri    = "text/search/excels" />
      <pagingResources/>
		  <menu toolbar="file" flat="y"/>
		  <filterUrl />
	  </div>
	</div>
    </div>
	
	<!-- for dialogs painting  -->
		<file/>
	
  <include name="requiredFooter.jsp"/>
  </body>
</html>


