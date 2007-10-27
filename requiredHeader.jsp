<div>
  <div id="pane2" style="position:absolute; visibility:hidden;" />

  <div id="system_tooltip" style="visibility:hidden; padding:0; position:absolute; z-index:10000; top:0px; left:-400px; width:220px;">
	    <div class="framed" id="tt_frame">
        <div class="f_tt"></div>
        <div class="f_r"><div class="f_rr"></div>
            <div class="f_b"><div class="f_bb"><div></div></div>
                <div class="f_l"><div class="f_ll"><div></div></div>
                    <div class="f_c"  id="tt_inner">
                        <div class="tt_button" id="opt_btn">
                        	<a onclick="javascript: advancedTooltip.onOptionsBtn();"><img src="icons/tooltip-toggle.gif" /></a>
                        </div>
                         <div id="content" style="font-size:12px;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>

  <iframe id='tooltipIframe' name="tooltipIframe" scrolling='no' frameborder='0' style="position:absolute; top:0px; left:0px; visibility:hidden; display:none;" src="about:blank"> </iframe>
  <iframe id="popupFrame"    name="popupFrame"    scrolling="no" frameborder="0" style="position:absolute; top:0px; left:0px; visibility:hidden; display:none;" src="about:blank"> </iframe>
  <iframe id='popupIframe'   name='popupIframe'   scrolling='no' frameborder='0' style="position:absolute; top:0px; left:0px; visibility:hidden; display:none;" src="about:blank"> </iframe>
  <iframe id='dialogIframe'  name='dialogIframe'  scrolling='no' frameborder='0' style="position:absolute; top:0px; left:0px; visibility:hidden; display:none;" src="about:blank"> </iframe>

	<iframe id='hiddenIframe' name="hiddenIframe" style="width:0px;height:0px" frameborder="0"> </iframe>

</div>

