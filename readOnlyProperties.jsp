<div>
<!-- THe next iframe is the floating iframe for RTE for writing comments//-->
<iframe style='border : 1px outset;position:absolute;background-color:#ffffff;display:none;' id='description' name='description' width='0' height='0'></iframe>
<center>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
  <td valign="top">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td colspan="3">
      <subscribeNote/>
      <div align="center"><font color="red"><b><errorMessage /></b></font></div>
    </td></tr>
    
    <tr  valign="top">
      <td colspan="3">
<hideBlock id="hideBlock">      
      <table width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr style="background-image: url('images/toolbar_bg.gif')" NOWRAP="y">
        <td width="1"><img src="images/toolbar_bg2.gif" border="0" width="1" height="23"/></td>
        <td  height="23" style="PADDING-RIGHT: 8px; PADDING-LEFT: 8px; FONT-WEIGHT: bold">

		      <img src="icons/icon.gif" width="16" height="16" align="middle" pda="T"/>
		      <img src="icons/icon_divider.gif" align="middle" border="0" pda="T"/>
		
		      <!-- Auto-generated menus -->
		      <span class="xs" nonPda="T">
				    <include name="${package}_menu.jsp"/>
				    <menu toolbar="trades"            activate="onMouseOver"/>
				    <menu toolbar="crm"               activate="onMouseOver"/>
				    <menu toolbar="projectManagement" activate="onMouseOver"/>
				    <menu toolbar="realEstate"        activate="onMouseOver"/>

			      <menu toolbar="resourceOperations" activate="onMouseOver"/>
			      <menu toolbar="transport"          activate="onMouseOver"/>
			      <menu toolbar="search"             activate="onMouseOver"/>
			      <menu toolbar="toolbar2"           activate="onMouseOver"/>
			      <menu toolbar="support"            activate="onMouseOver" allow="admin"/>
			      <menu toolbar="personalization"    activate="onMouseOver"/>
			      <menu toolbar="calendarAndChart"   activate="onMouseOver"/>
		      </span>
		      <span class="xs" pda="T">
			      <menu toolbar="toolbar1"/>
			      <menu toolbar="transport"/>
			      <menu toolbar="search"/>
			      <menu toolbar="toolbar2"/>
			      <menu toolbar="support"         allow="admin"/>
			      <menu toolbar="personalization"/>
			
			      <menu toolbar="calendarAndChart" itype="http://www.hudsonfog.com/voc/model/company/Contact" activate="onMouseOver"/>
		      </span>
		
		      <span class="xs">
		        <print image="icons/printerIcon.gif"/>
		      </span>
		      <pdaToPc image="icons/pda.gif"/>
		      
		      <a href="javascript://" title="Chat Room" onclick="openChatWindow(escape(document.title), escape(window.location), 'false');" itype="http://www.hudsonfog.com/voc/model/portal/Annotated"><img src="icons/webchat.gif" alt="Chat room for this page" border="0" width="16" height="16" align="middle"/></a>
          <a href="javascript://" title="Chat with the agent" onclick="openChatWindow(escape(document.title), escape(window.location), 'true');" itype="http://www.hudsonfog.com/voc/model/portal/Annotated"><img src="icons/webchat.gif" alt="Chat with the agent" border="0" width="16" height="16" align="middle"/></a>
		      <showHideWindows/>
	      </td>
	
	      <!--td valign="top" align="right" width="15%"><changePassword/><userLogOff html="user-login.html"/></td-->
	      <td valign="middle" align="right" width="15%"><include name="searchText.jsp"/></td>
	      <td width="1"><img src="images/toolbar_bg2.gif" border="0" width="1" height="23"/></td>
      </tr>

      </table>
</hideBlock>
      </td>
    </tr>

    <tr><td colspan="3"><br/>
<a target="pane2"> </a>
<div id="pane2" />
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
<hideBlock>
  <br/><br/><div align="left"><span class="xs"><hudsonFog /></span></div>
</hideBlock>
<iframe name="bottomFrame" id="bottomFrame" src="about:blank" scrolling="no" frameborder="0" style="overflow:visible; width:0;height:0"> </iframe>  
</div>
