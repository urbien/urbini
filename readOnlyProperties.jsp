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
      <div align="center"><font color="red"><b><errorMessage /></b></font></div>
    </td></tr>
    <tr><td colspan="3"><br/>
<a target="pane2"> </a>
<div id="pane2" />
<div id="gallery" style="display:none;position:absolute">
  <table bgcolor="#1b62b6">
    <tr valign="top"><td class="largeImage" valign="top"><img id="galleryImage" src="about:blank"></img></td></tr> 
    <!--tr valign="top"><td class="largeImageWithHide" valign="top"><img id="galleryImage" src="about:blank"></img><img src="icons/hide.gif" border="0" width="16" height="16" align="top" onclick="return hide('gallery')" style="cursor: pointer" title="click to close"></img></td></tr-->
  </table>
</div>

    <div id="allowSearchHighlighting2">
      <readOtherSiteInfo />
      <include name="${type}_details_main.jsp" alt="propertySheet.jsp" />
<hideBlock id="hideBlock1">
      <div align="right"><measurement/></div>
      <p/>
<include name="${type}_details_bottom_1.jsp"/>
      <newComment/>
</hideBlock>
    </div>
    </td>
    </tr>
    </table>
</td>
</tr></table>

</center>
<iframe name="bottomFrame" id="bottomFrame" src="javascript: ;" scrolling="no" frameborder="0" style="overflow:visible; width:0;height:0"> </iframe>
</div>
