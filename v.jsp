<div>
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td colspan="3">
      <subscribeNote/>
      <errorMessage />
    </td></tr>
    <tr><td colspan="3">

    <div id="gallery" style="background-color:#fff; display:none;position:absolute" itype="http://www.hudsonfog.com/voc/model/portal/ImageResource">
	  <table bgcolor="#1b62b6">
	  	<tr><td id="titleBar" dragcontainer="gallery"></td></tr>
	    <tr valign="top"><td class="largeImage" valign="top"><img id="galleryImage" src="about:blank"></img></td></tr>
	    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="javascript: ;"ap></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer;" title="click to close"></img></td></tr-->
	  </table>
    </div>

    <div id="allowSearchHighlighting2">
      <readOtherSiteInfo />
			<getResource/>
			<table width="100%" border="0" cellspacing="0" cellpadding="0" id="dataEntry">
			<!--tr><td colspan="3"><resourceTitle/></td></tr-->
      <div hide="y">			
		  <tr noInner="y" class="fts" itype="!http://www.hudsonfog.com/voc/classifieds/siteTemplates/Slide">
				<td><fullTextSearchChoice/></td><td><filter/></td><td><pagingResources /></td>
		  </tr>
      </div>		  
		  <tr>
		  <td colspan="3">
  		  <table width="100%" cellpadding="0" cellspacing="0">
  		  <tr>
  		    <include name="${type}_details_left.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
  		    <td><include name="${type}_details_main.jsp" alt="propertySheet.jsp" /></td>
          <include name="${type}_details_right.jsp"/> <!-- _details_ is a keyword meaning that this jsp will be included in PropertySheet page only-->
  		  </tr>
  		  </table>
		  </td>
		  <tr>
		  <tr itype="http://www.hudsonfog.com/voc/aspects/commerce/SoftBuyable">
		    <td align="middle" colspan="3"><download/></td>
		  </tr>
			</table>
<hideBlock id="hideBlock1">
      <div align="right"><measurement/></div>
<include name="${type}_details_bottom_1.jsp"/>
      <newComment/>
      <!--p/><br/-->
      <chatHistory/>
</hideBlock>
    </div>

    </td>
    </tr>
    </table>
</td>
</tr></table>

<PointOfSale/>
<filterUrl />
</div>
