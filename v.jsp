<div>
  <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td colspan="3">
  
    <div id="gallery" style="background-color:#fff; display:none;position:absolute" itype="http://www.hudsonfog.com/voc/model/portal/ImageResource">
    <table bgcolor="#1b62b6">
    	<tr><td id="titleBar" dragcontainer="gallery"></td></tr>
      <tr valign="top"><td class="largeImage" valign="top"><img id="galleryImage" src="about:blank"></img></td></tr>
    </table>
    </div>
  
    <div id="allowSearchHighlighting2">
      <readOtherSiteInfo />
  		<getResource/>
      <div hide="y">      
    		<table width="100%" border="0" cellspacing="0" cellpadding="0">
    		  <tr noInner="y" class="fts" itype="!http://www.hudsonfog.com/voc/classifieds/siteTemplates/Slide">
    				<td><fullTextSearchChoice/></td><td><location/><filter/></td><td><pagingResources /></td>
    		  </tr>
        </table>		  
      </div>
      <subscribeNote/>
  	  <errorMessage />
  		<table width="100%" cellpadding="0" cellspacing="0" border="0">
  		  <tr><include name="${type}_details_top.jsp"/></tr>  <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
  	  </table>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" id="dataEntry">
      <tr valign="top">
  	  <td>
  		  <table width="100%" cellpadding="0" cellspacing="0">
  		  <tr>
          <div hide="y">      
    		    <include name="${type}_details_left.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
    		  </div>
  		    <td valign="top" width="100%"><include name="${type}_details_main.jsp" alt="propertySheet.jsp" />

        	  <table width="100%" cellpadding="0" cellspacing="0">
          	  <tr itype="http://www.hudsonfog.com/voc/aspects/commerce/SoftBuyable">
          	    <td align="middle" colspan="3"><download/></td>
          	  </tr>
        <hideBlock id="hideBlock1">
          		<tr class="v_footer">
        		  <td>
                <div align="right"><measurement/></div>
                <!--newComment/ -->
                <chatHistory/>
              </td>
              </tr>
        </hideBlock>
            </table>
          </td>
          <div hide="y">      
            <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
          </div>
        </tr>
        <div hide="y">      
        <tr>
          <td align="middle" colspan="3">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><include name="${type}_details_bottom_1.jsp"/></tr>
            </table>
          </td>
        </tr>
        </div>
      </table>
    </td>
    </tr>
  </table>
    </div>
    </td>
    </tr>
  </table>

<PointOfSale/>
<filterUrl />

</div>
