<div id="keyboard" itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem" style="display:none">
	<form id="filter" method="post" action="FormRedirect" autocomplete="off">
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
		      <input type="text" class="input1" size="27" maxsize="200" name=".title" value="" onKeyPress="return checkOnKeyPress(this, event);" />
		      <input type="hidden" name=".forum_select" value="" />
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
