<div>
<font color="red"><b><errorMessage /></b></font>
<hideBlock id="hideBlock">
<style type="text/css">
  .simpleButton {border:solid #808080 1px; color: darkblue; font-size:16pt; height:40pt; cursor: pointer;}
  .filterButton {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:30px;text-decoration:none}
  .input1 {background-color:#EDF5F5; border-bottom: 1px solid #C0C9D7; border-left: 1px solid #C0C9D7; border-right: 1px solid #AFC4D5; border-top:1px solid #AFC4D5; color:#000066; height:40px; text-decoration:none; font-weight:bold; font-size:35px;}
  .specialKeys {background: #F0F2F6;border-bottom: 1px solid #104A7B;border-right: 1px solid #104A7B;border-left: 1px solid #AFC4D5;border-top:1px solid #AFC4D5;color:#000066;height:40pt;text-decoration:none; cursor: pointer; font-weight:bold; font-size:16pt;}
  .xxs {font-size:10pt;}
</style>
<watchNote/>
</hideBlock>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr valign="top">
  <td width="110%" colspan="2">
		<form name="categoryTextSearch">
		  <searchHistory/>
		  <categoryTextSearch />
		  <resourcesSearch resourcesUri="/sql/text/search/resources" />
		  <filesSearch filesUri="text/search/files" />
		</form>
    <taskTreeControl/>

    <table width="100%" cellspacing="3" cellpadding="0" border="0">
    <tr valign="top">
	    <td width="70%">
	      <mkResourceForLineItems/>
	      <include name="keyboard.jsp"/>
		    <form name="horizontalFilter" id="filter" method="POST" action="addLineItems.html" itype="http://www.hudsonfog.com/voc/hospitality/spa/RetailItem">
		      <br/>
		      <horizontalFilter />
		    </form>
	    </td>
	    <td width="30%">
		    <table width="100%">
		      <tr>
		      <td align="middle" itype="http://www.hudsonfog.com/voc/hospitality/spa/TicketItem">
		   	    <a href="$this"><property name="customer.firstName"/>&#160;<property name="customer.lastName"/>&#160;<property name="ticketNumber"/></a>&#160;<property name="locker"/>
		     	</td>
		     	</tr>
		      <tr itype="http://www.hudsonfog.com/voc/hospitality/orders/BarItem">
		      <td>
		        <table width="100%" cellspacing="5" cellpadding="0" border="0">
			        <tr>
			          <td align="center" class="categoryButton" onclick="rel('plain/Recall_Orders.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/hospitality/spa/Ticket&amp;sealed_select=false&amp;sealed_verified=y&amp;$order=http://www.hudsonfog.com/voc/hospitality/spa/Ticket/checkInTime&amp;-asc=-1&amp;-grid=1&amp;-inRow=2&amp;serviceStart_From=today&amp;serviceStart=today&amp;serviceStart_To=today&amp;hideHideBlock=y');">Recall orders</td>
			          <td><a id="$currentItem.$._cancelled_boolean_refresh"><img src="icons/status_not_cancelled-extra-large.gif" class="cursor" width="48" height="48" border="0" /></a></td>
                <td><img src="icons/notes-extra-large.gif" border="0" title="Add new 'Comments'" width="48" height="48"  class="cursor" onclick="var div=showKeyboard(this, event);" /></td>
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
      </td></tr>
      <tr>
      <td width="70%">
        <backTo/>
      </td>
      <td></td>
    </tr>
    </table>
  </td>
  </tr>
</table>
<barApplet/>
<br />
</div>
