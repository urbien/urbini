<div>

  <!--facebookLocalLikeWidget /-->
  <where value="Packages.hudsonfog.voc.system.parse.FileSystem.davClass.isAssignableFrom(Packages.com.fogx.webdav.DavClass.getDavClass(getType())) &amp;&amp; 
	  Packages.com.fogx.webdav.DavClass.getDavClass(getType()).getProperty(Packages.hudsonfog.voc.system.parse.FileSystem._hasAudio) &amp;&amp;
	  hasAudio">
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js" language="JavaScript" type="text/javascript"></script>
    <script src="jquery.jplayer.min.js" language="JavaScript" type="text/javascript"></script>
    <script src="jplayer.playlist.min.js" language="JavaScript" type="text/javascript"></script>
  </where>

  <buyButton />
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
  		
      <div id="fts" hide="y">      
    		<table width="100%" border="0" cellspacing="0" cellpadding="0"><!-- itype="!http://www.hudsonfog.com/voc/model/social/IntentMessage" -->
    		  <tr noInner="y" class="fts" itype="!http://www.hudsonfog.com/voc/classifieds/siteTemplates/Slide">
    				<td><fullTextSearchChoice place="middle"/></td><td><filter/></td><td><pagingResources /></td>
    		  </tr>
        </table>		  
      </div>

      <subscribeNote/>
  	  <errorMessage />
      <superMap />
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
              <tr itype="http://www.hudsonfog.com/voc/model/portal/Comment">
                <td colspan="3"><br/><br/><reply/></td>
              </tr>
        <hideBlock id="hideBlock1">
          		<!--
							<tr class="v_footer">
        		  <td>
                <div align="right"><measurement/></div>
             
                <chatHistory/>
              </td>
              </tr>
							-->
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
              <tr><td><include name="${type}_details_bottom.jsp"/></td></tr>
              <tr><include name="socialLinks.jsp"/></tr>

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
