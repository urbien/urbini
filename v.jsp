<div>
<!-- THe next iframe is the floating iframe for RTE for writing comments//-->
<iframe style='border : 1px outset;position:absolute;background-color:#ffffff;display:none;' id='description' name='description' width='0' height='0' src="javascript: ;"></iframe>
<center>

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
	    <tr valign="top"><td class="largeImage" valign="top"><img id="galleryImage" src="javascript: ;"></img></td></tr>
	    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="javascript: ;"ap></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer;" title="click to close"></img></td></tr-->
	  </table>
    </div>

    <div id="allowSearchHighlighting2">
      <readOtherSiteInfo />
			<getResource/>
			<table width="100%" border="0" cellspacing="0" cellpadding="0" id="dataEntry">
		  <tr noInner="y" class="ftsLine"><td>
			  <table class="ftsq" width="100%">
			  <tr>
			    <td><include name="searchText.jsp"/></td>
			  </tr>
			  </table>
		  </td></tr>
		  <tr>
		    <td><pagingResources /><include name="${type}_details_main.jsp" alt="propertySheet.jsp" /></td>
		  </tr>
		  <tr itype="http://www.hudsonfog.com/voc/aspects/commerce/SoftBuyable">
		    <td align="middle"><download/></td>
		  </tr>
			</table>
<hideBlock id="hideBlock1">
      <div align="right"><measurement/></div>
<include name="${type}_details_bottom_1.jsp"/>
      <newComment/>
      <p/><br/>
      <chatHistory/>
</hideBlock>
    </div>

    </td>
    </tr>
    </table>
</td>
</tr></table>

</center>
<PointOfSale/>
</div>
