<html>
<head>
  <LINK HREF="styles/common.css" TYPE="text/css" rel="stylesheet" />
  <link href="styles/menu.css" type="text/css" rel="stylesheet" />
  <SCRIPT language="JavaScript" src="menu.js"></SCRIPT>
  <SCRIPT language="JavaScript" src="forms.js"></SCRIPT>

	<!-- link here filter file for desired data format:
	see comments in filter files for formats descriptions -->
	<script language="JavaScript" src="calendar/cal_tpl1.js"></script>
	<script language="JavaScript" src="calendar/cal_strings.js"></script>
	<script language="JavaScript" src="calendar/calendar.js"></script>
	<!-- define the view of calendar with css rules -->
	<link rel="stylesheet" href="calendar/calendar.css"/>
</head>
<div nonPda="T">
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
  <tr>
    <td width="80%" valign="top"><resourceTypeLabel/></td>
    <td width="20%"><include name="include/commonHeader"/><div align="right"><font face="verdana, sans-serif, arial" color="darkBlue">powered by  <b>HudsonFog</b></font></div></td>
  </tr>
</table>

   <include name="searchText.jsp"/>

  <!--include name="include/commonHeader"/-->
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td valign="top" width="1%">
      <!--include name="include/commonLeft"/-->
      <!--include name="commonLeft.jsp"/-->
    </td>
    <td valign="top" width="99%">
      <file/>
    </td>
   </tr>
   </table>

  <br></br>
  <include name="include/commonFooter"/>
  <include name="requiredFooter"/>
</div>

<div pda="T">
  <include name="commonHeader"/>
  <BODY text="#000000" bgColor="#ffffff" leftMargin="0" topMargin="0" marginwidth="0" marginheight="0">
  <!--img src="icons/icon.gif" width="16"/-->

  <include name="commonLeft.jsp"/>

  <table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <!--td valign="top" width="2%">
      <include name="commonLeft.jsp"/>
    </td-->
    <td valign="top" width="100%">
     <file/>
    </td>
  </tr>
  </table>
  <include name="requiredFooter"/>
</div>

</html>


