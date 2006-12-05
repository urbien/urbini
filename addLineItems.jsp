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
					  .simpleButton {border:solid #808080 1px; color: darkblue; font-size:16pt; height:40pt; cursor: pointer;}
					  .filterButton {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:30px;text-decoration:none}
					  .input1 {background-color:#EDF5F5; border-bottom: 1px solid #C0C9D7; border-left: 1px solid #C0C9D7; border-right: 1px solid #AFC4D5; border-top:1px solid #AFC4D5; color:#000066; height:40px; text-decoration:none; font-weight:bold; font-size:35px;}
					  .specialKeys {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:40pt;text-decoration:none; cursor: pointer; font-weight:bold; font-size:16pt;}
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

					<form itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem" id="filter" method="post" action="FormRedirect" autocomplete="off">

					<table width="100%" border="0" cellspacing="10" cellpadding="0" cols="10">
					<tr>
				  <td align="left" colspan="10">
				    <table>
					  <tr>
					    <td>
							  <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
								<tr onclick="clearAll();" class="cursor">
								  <td width="17"></td>
								  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0" alt=""/></td>
								  <td class="but_center"><span style="color: rgb(75, 115, 75); ">CLOSE</span></td>
								  <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0" alt=""/></td>
								</tr>
							  </table>
							</td>
					    <td>
					      <input type="text" class="input1" size="27" maxsize="200" name=".title" value="" onKeyPress="return checkOnKeyPress(this, event);"/>
					      <input type="hidden" name=".forum_select" value=""/>
					    </td>
					    <td>
						    <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
							  <tr onclick="addAndShowItems(this, event); document.getElementById('keyboard').style.display='none'; clearAll();" class="cursor">
							    <td width="17"></td>
					  		  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0" alt=""/></td>
						  	  <td class="but_center"><span style="color: rgb(75, 115, 75); ">SUBMIT</span></td>
							    <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0" alt=""/></td>
							  </tr>
						    </table>
							</td>
							<td>
							  <table class="button_grey" style="display: inline;" border="0" cellpadding="0" cellspacing="0">
								<tr onclick="clearOne();" class="cursor">
								  <td width="17"></td>
								  <td class="but_left"><img src="images/1x1.gif" class="but_left" border="0" alt=""/></td>
								  <td class="but_center"><span style="color: rgb(75, 115, 75); ">CLR</span></td>
								  <td class="but_right"><img src="images/1x1.gif" class="but_right" border="0" alt=""/></td>
				  		  </tr>
					  	  </table>
					  	</td>
						</tr>
						</table>
				  </td>
					</tr>
					<tr>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">Q</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">W</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">E</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">R</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">T</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">Y</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">U</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">I</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">O</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)" width="10%">P</td>
					</tr>
					<tr>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">A</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">S</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">D</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">F</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">G</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">H</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">J</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">K</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">L</td>
					</tr>
					<tr>
					   <td></td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">Z</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">X</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">C</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">V</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">B</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">N</td>
					   <td bgcolor="#A2B5CD" align="middle" class="simpleButton" onclick="add(this)">M</td>
					</tr>
					<tr>
					   <td></td>
					   <td bgcolor="#A2B5CD" align="middle" class="specialKeys" onclick="add(this)" colspan="6">Space</td>
					   <td colspan="3"></td>
					</tr>
					</table>
					</form>
				</div>
    <form name="horizontalFilter" id="filter" method="POST" action="addLineItems.html" itype="http://www.hudsonfog.com/voc/hospitality/spa/RetailItem">
      <br/>
      <horizontalFilter />
    </form>

	    </td>
	    <td width="30%">
	    <table width="100%">
      <tr><td align="middle" itype="http://www.hudsonfog.com/voc/hospitality/spa/TicketItem">
   	    <property name="customer.firstName"/>&#160;<property name="customer.lastName"/>&#160;<property name="ticketNumber"/>&#160;<property name="locker"/>
     	</td></tr>
      <tr itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem">
      <td>
        <table width="100%" cellspacing="5" cellpadding="0" border="0">
        <tr>
          <td align="center" class="categoryButton" onclick="document.location.href='Recall_Orders.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/hospitality/spa/Ticket&amp;sealed_select=false&amp;sealed_verified=y&amp;$order=http://www.hudsonfog.com/voc/hospitality/spa/Ticket/checkInTime&amp;-asc=-1&amp;-grid=1&amp;-inRow=2&amp;serviceStart_From=today&amp;serviceStart=today&amp;serviceStart_To=today&amp;hideHideBlock=y'">Recall orders</td>
        </tr>

        </table>
      </td>
      </tr>
      <tr><td>
        <a target="pane2"></a><div id="pane2" style="position:absolute;"/>
	      <div id="resourceList_div">
          <div id="errorMessage"><errorMessage /></div>
	        <siteResourceList/>
	      </div>
	    </td>
    </tr>
    </table>
    </td>
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
