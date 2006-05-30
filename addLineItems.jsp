<div>
<font color="red"><b><errorMessage /></b></font>
<hideBlock id="hideBlock">
<watchNote/>
</hideBlock>

<barApplet/>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td width="110%" colspan="2"><!--br/-->
		<form name="categoryTextSearch">
		  <searchHistory/>
		  <categoryTextSearch />
		  <resourcesSearch resourcesUri="/sql/text/search/resources" />
		  <filesSearch filesUri="text/search/files" />
		</form>
    <taskTreeControl/>

    <table width="100%" cellspacing="10" cellpadding="0" border="0">
    <tr valign="top">
	    <td width="70%">
	      <mkResourceForLineItems/>
				<div id="keyboard" style="display:none">
					<style type="text/css">
					  .simpleButton {border:solid #808080 1px; color: darkblue; font-size:16pt; height:40pt; cursor: pointer; cursor: hand;}
					  .filterButton {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:30px;text-decoration:none}
					  .input1 {background-color:#EDF5F5; border-bottom: 1px solid #C0C9D7; border-left: 1px solid #C0C9D7; border-right: 1px solid #AFC4D5; border-top:1px solid #AFC4D5; color:#000066; height:40px; text-decoration:none; font-weight:bold; font-size:35px;}
					  .specialKeys {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:40pt;text-decoration:none; cursor: pointer; cursor: hand; font-weight:bold; font-size:16pt;}
					  .xxs {font-size:10pt;}
					</style>

				<script language="JavaScript1.2" type="text/javascript">
					function clearAll() {
					  document.getElementById('filter').elements['.title'].value = '';
				    document.getElementById('keyboard').style.display='none';
				    if (menuGroupDiv)
				      menuGroupDiv.style.display = 'inline';
				    document.getElementById('pane2').style.display = 'none';
					  var pane2 = document.getElementById('pane2');
					  if (pane2) {
					    pane2.innerHTML = null;
					    pane2.style.display = 'inline';
					  }
					}

					function clearOne() {
					  var v = document.getElementById('filter').elements['.title'].value;
					  if (!v)
					    return;
					  if (v.length == 1)
				  	  document.getElementById('filter').elements['.title'].value = '';
				  	else
				      document.getElementById('filter').elements['.title'].value = v.substring(0, v.length - 1);
					}
					function add(e) {
					  var value = document.getElementById('filter').elements['.title'].value;
				    var ch = e.innerHTML;
				    if (ch == 'Space')
					    ch = ' ';

					  document.getElementById('filter').elements['.title'].value = value + ch;
					}
					function callAddAndShow(tr, event) {
				    addAndShowItems(tr, event);
				    document.getElementById('keyboard').style.display='none';
					  document.getElementById('filter').elements['.title'].value = '';
        clearAll();
					}
					function checkOnKeyPress(tr, event) {
				    var keyCode = getKeyCode(event);
				    if (keyCode == 13)
				      callAddAndShow(tr, event);
					}
				</script>

					<form itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem" id="filter" method="post" action="FormRedirect" AUTOCOMPLETE="off">

					<table width="100%" border="0" cellspacing="10" cellpadding="0" cols="10">
					<tr>
				  <td align="left" colspan="10">
				    <table>
					  <tr>
					    <td>
							  <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
								<tr onClick="clearAll();" style="cursor: pointer; cursor: hand;">
								  <td width="17"></td>
								  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0"/></td>
								  <td class="but_center"><span style="color: rgb(75, 115, 75); ">CLOSE</span></td>
								  <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0"/></td>
								</tr>
							  </table>
							</td>
					    <td>
					      <input type="text" class="input1" size="27" maxsize="200" name=".title" value="" onKeyPress="return checkOnKeyPress(this, event);"/>
					      <input type="hidden" name=".forum_select" value=""/>
					    </td>
					    <td>
						    <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
							  <tr onClick="addAndShowItems(this, event); document.getElementById('keyboard').style.display='none'; clearAll();" style="cursor: pointer; cursor: hand;">
							    <td width="17"></td>
					  		  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0"/></td>
						  	  <td class="but_center"><span style="color: rgb(75, 115, 75); ">SUBMIT</span></td>
							    <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0"/></td>
							  </tr>
						    </table>
							</td>
							<td>
							  <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
								<tr onClick="clearOne();" style="cursor: pointer; cursor: hand;">
								  <td width="17"></td>
								  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0"/></td>
								  <td class="but_center"><span style="color: rgb(75, 115, 75); ">CLR</span></td>
								  <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0"/></td>
				  		  </tr>
					  	  </table>
					  	</td>
						</tr>
						</table>
				  </td>
					</tr>
					<tr>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">Q</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">W</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">E</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">R</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">T</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">Y</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">U</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">I</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">O</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)" width="10%">P</td>
					</tr>
					<tr>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">A</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">S</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">D</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">F</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">G</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">H</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">J</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">K</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">L</td>
					</tr>
					<tr>
					   <td></td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">Z</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">X</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">C</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">V</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">B</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">N</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onClick="add(this)">M</td>
					</tr>
					<tr>
					   <td></td>
					   <td bgcolor="#A2B5CD" align="middle" class="specialKeys" onClick="add(this)" colspan="6">Space</td>
					   <td colspan="3"></td>
					</tr>
					</table>
					</form>
				</div>

	    </td>
	    <td width="30%">
        <a target="pane2"></a><div id="pane2" style="position:absolute;"/>
	      <div id="resourceList_div"><siteResourceList/></div>
	    </td>
    </tr>
    <tr itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem">
      <td width="70%">
        <table width="100%" cellspacing="5" cellpadding="0" border="0">
        <tr>
          <td align="center" class="categoryButton" onClick="document.location.href='Recall_Orders.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/hospitality/spa/Ticket&amp;sealed_select=false&amp;sealed_verified=y&amp;$order=http://www.hudsonfog.com/voc/hospitality/spa/Ticket/checkInTime&amp;-asc=-1&amp;-grid=1&amp;-inRow=2&amp;serviceStart_From=today&amp;serviceStart=today&amp;serviceStart_To=today&amp;hideHideBlock=y'">Recall orders</td>
        </tr>

        </table>
      </td>
      <td></td>
    </tr>
    <tr>
      <td width="70%">
        <backTo/>
      </td>
      <td></td>
    </tr>
    <iframe id="resourceList" name="resourceList" style="display:none;" scrolling="no" frameborder="0" src="about:blank"> </iframe>
    </table>
    <div align="right"><measurement/></div>
  </td>
  </tr>
</table>
<br />
</div>
