<table>
<tr>
<td></td>
<td>
<include name="${type}_details_top.jsp"/>
</td>
<td></td>
</tr>
<tr>
<td width="25%" align="center">
<include name="${type}_details_left.jsp"/>
</td>
<td>
<div align="center">
	
	<getResource/>

	<panelBlock>
		<form id="filter" name="tablePropertyList" method="post" action="mkresource" autocomplete="off" style="display: inline; margin: 0;">
		 <errorMessage />
		 
		 <tablePropertyList/>
		 
		 
		 
		 <div align="right"><span class="xs"><measurement/></span></div>
		 <input type="hidden" name="-$action" value="mkResource" />
		
		</form>
	</panelBlock>
</div>
</td>
<td width="25%">
<include name="${type}_details_right.jsp"/>
</td>
</tr>
</table>