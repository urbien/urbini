<html xmlns:vml="urn:schemas-microsoft-com:vml">
  <head>
    <!--include name="commonHead.jsp"/-->  
  <title />

  <object id="VMLRender" classid="CLSID:10072CEC-8CC1-11D1-986E-00A0C955B42E"></object>
  <style>
    vml\:* { behavior: url(#VMLRender) }
    A {behavior: url(#default#AnchorClick);}
  </style>

  <link rel="SHORTCUT ICON"                href="icons/icon.ico" />
  <link rel="ICON"                         href="icons/icon.ico" />
  <link rel="stylesheet"   type="text/css" href="styles/properties.css" />

  <link href="styles/common.css"     type="text/css" rel="stylesheet" />
  <link href="styles/menu.css"       type="text/css" rel="stylesheet" />
  <link href="styles/tree.css" type="text/css" rel="stylesheet" />
  <link href="calendar/calendar.css" type="text/css" rel="stylesheet" /> 

  <SCRIPT language="JavaScript" src="menu.js"></SCRIPT>
  <SCRIPT language="JavaScript" src="forms.js"></SCRIPT>


  <script language="JavaScript" src="calendar/cal_tpl1.js"></script>
  <script language="JavaScript" src="calendar/cal_strings.js"></script>
  <script language="JavaScript" src="calendar/calendar.js"></script>
  <script language="JavaScript" src="gantt/dependencies.js"></script>
  <script language="JavaScript" src="pngfix.js"></script>
  <!--[if gte IE 5.5000]> our xml parser removes all comments :-(
  <![endif]-->


  </head>

  <div nonPda="T">
    <table width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td width="80%" valign="top"><resourceTypeLabel/></td>
        <td width="20%"><include name="include/commonHeader"/>
          <div align="right"><a href="http://hudsonfog.com"><font face="verdana, sans-serif, arial" color="darkBlue">powered by  <b>HudsonFog</b></font></a></div>
        </td>
      </tr>
    </table>

    <include name="searchText.jsp"/>
 
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td valign="top" width="100%">
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


