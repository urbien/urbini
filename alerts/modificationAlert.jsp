<div>
<br/>
<div style="border: 2px solid #f55200; background-color: #fefefe;">
<table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr style="padding: 9px; background-color: #ef6f16;">
    <td colspan="3" style="padding: 12px"><logo srcHuge="images/logo10.png" srcLarge="icons/logo-large.png"/></td>
  </tr>
<tr>
  <td width="2%"></td>
  <td>
    <br/>
		<text text="Dear"/> <property name="to.firstName" href="y" noIcon="y"/> <property name="to.lastName" href="y" noIcon="y"/>,
		<br/><br/>
		<!--property name="subject" href="y"/-->
		<property name="forum" type="y"/>  <property name="forum" href="y" noIcon="y"/> <text text="was modified"/> 
		<br/><br/>
		<where value="modification != null">
		  <text text="Changes made by" /> <property name="sender.firstName" href="y" /> <property name="sender.lastName" href="y" /> <text text="are below:" />
		</where>
  </td>
	<td align="right" valign="top">
		<!--a href="#"><IMG src="icons/logo-large.png" border="0" height="32" align="right" /></a -->
	</td>
</tr>
<tr>
  <td></td>
  <td colspan="2">
		<!--propertySheet name="modification"/-->
    <br/>
		<property name="modification.newValues" noIcon="y"/>
    <br/>
    <where value="modification == null">
      <br/>
  		  <property name="description" noIcon="y"/>
      <br/>
		</where>
		<text text="Customer Service"/>
		<br/>
		<!--siteOwner/>
		<br/>
		<b><text text="Powered by"/></b> <a href="http://lablz.com" target="_blank">Lablz</a -->
	</td>
</tr>
</table>
    <br/>
</div>
</div>