<html>
<script language="JavaScript" src="calendar/calendar1.html"></script>

<siteTitle />

<pda nonPda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td>

<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="90%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <colgroup>
      <col width="90%" /> 
      <col width="10%" />
    </colgroup>
    <tr valign="top">
      <td valign="top" width="90%"><span class="xs"><div id="language" class="popMenu"><language/></div><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/><pdaToPc image="images/pda.gif"/></span></td>
      <td valign="top" width="10%"><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>

    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <div align="right"><measurement/></div>
      <addNewResource html="mkResource.html"/> 
      <reloadDocuments/>
      <createResources/>
      <showSetProperties />
    </form>
  <br/><pieChart/>

    </td>
    <td valign="top" align="left" bgcolor="eeeeee">

    <include name="searchText.jsp" />
    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0"><tr><td align="middle" class="title">
      <input type="submit" name="submit"  class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
      <input type="submit" name="submit" class="button1" value="Filter"></input>
      <input type="submit" name="clear"  class="button1" value="Clear"></input>
      <input type="hidden" name="action" value="searchLocal"></input>
      </td></tr></table>   
    </form>
  </td>
</tr>

</table>
</td></tr>
</table>
</td></tr>
</table>
<br />
</pda>

<pda pda="T">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td valign="top" align="middle" width="100%">
    <table width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr valign="top"><td valign="top">
      <img src="icons/icon.gif" width="16" height="16" align="middle"/>
      <A title="Shortcuts" href="javascript://" onClick="menuOpenClose('textdiv')" ><IMG src="images/shortcuts.gif"  width="16" height="16" align="middle" border="0"/></A>&#160;
      <A title="Search"    href="javascript://" onClick="menuOpenClose('textdiv1')"><IMG src="images/search.gif"  width="16" height="16" align="middle" border="0"/></A>&#160;
      <A title="Filter"    href="javascript://" onClick="menuOpenClose('textdiv2')"><IMG src="images/filter.gif"  width="16" height="16" align="middle" border="0"/></A>&#160;
      <A title="Email"     href="javascript://" onClick="menuOpenClose('textdiv3')"><IMG src="images/email.gif"  width="16" height="16" align="middle" border="0"/></A>&#160;
      <A title="Schedule"  href="javascript://" onClick="menuOpenClose('textdiv4')"><IMG src="images/calendar.gif"  width="16" height="16" align="middle" border="0"/></A>&#160;
      <A title="Languages"  href="javascript://" onClick="menuOpenClose('language')"><IMG src="images/globus.gif" align="middle" border="0"/></A>&#160;
      <A title="Warehouses" href="javascript://" onClick="menuOpenClose('warehousesDiv')"><IMG src="icons/warehouse.gif" align="middle" border="0"/></A>&#160;
      <A title="Vessels"   href="javascript://" onClick="menuOpenClose('vesselsDiv')"><IMG src="icons/vessel.gif" align="middle" border="0"/></A>&#160;
      <A title="Wagons"    href="javascript://" onClick="menuOpenClose('wagonsDiv')"><IMG src="icons/wagon.gif" align="middle" border="0"/></A>&#160;
      <A title="Trains"    href="javascript://" onClick="menuOpenClose('trainsDiv')"><IMG src="icons/train.gif" align="middle" border="0"/></A>&#160;
      <A title="Trucks"    href="javascript://" onClick="menuOpenClose('trucksDiv')"><IMG src="icons/truck.gif" align="middle" border="0"/></A>&#160;
      
      <span class="xs"><language/></span><print image="images/printerIcon.gif"/><saveInExcel allow="owner" image="images/excel.gif"/>
      <pdaToPc image="images/pda.gif"/><changePassword/><userLogOff html="user-login.html"/></td>
    </tr>
    <tr valign="top"><td>
    <form action="list.html" name="siteResourceList">
      <div align="left"><backLink /></div>
      <siteResourceList />
      <createResources/>
      <div align="right"><measurement/></div>
    </form>
    </td></tr>
    </table>
</td></tr></table>
<br />

<div>
  <div id="textdiv2" class="popMenu">

<table border="0" cellspacing="0" cellpadding="0">
<tr  valign="top">
  <td><include name="searchText.jsp" /></td>
</tr>
<tr><td>    
    <form name="rightPanelPropertySheet" method="POST" action="FormRedirect">
      <table border="1" cellpadding="3" cellspacing="0">
      <tr><td align="middle" class="title">
        <input type="submit" name="submit"  class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
      </td></tr>
      <tr><td><rightPanelPropertySheet /></td></tr>
      <tr><td align="middle" class="title">
        <input type="submit" name="submit" class="button1" value="Filter"></input>
        <input type="submit" name="clear"  class="button1" value="Clear"></input>
        <input type="hidden" name="action" value="searchLocal"></input>
      </td></tr></table>   
    </form>
</td></tr></table>
</div>

<div id="textdiv3" class="popMenu">
<form name="emailForm" action="page2email" method="GET">
  <table cellpadding="5">
    <tr><td>
      <table border="1" cellpadding="5">
        <tr><td><b>Subject:</b></td><td><input name="subject"></input></td></tr>
        <tr><td><b>E-mail:</b></td><td><input name="to"></input></td></tr>
      </table>
    </td></tr>
    <tr><td><input type="submit" value="Send"></input></td></tr>
  </table>
</form>
</div>

<div id="textdiv4" class="popMenu">
<form name="scheduleForm" action="page2schedule" method="GET">
  <table cellpadding="5"><tr><td>
    <table border="1" cellpadding="5">
      <tr><td><b>Subject:</b></td><td><input name="name"/></td></tr>
      <tr><td><b>Repeat:</b></td>
      <td>
        <select name="rec" onchange="onRecChange()">
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </td>
      </tr>
      <tr><td><div id="titleDiv"></div></td><td><div id="valueDiv"></div></td></tr>
      <tr><td><b>Time:</b></td>
      <td>
        <table><tr><td>
          <select name="hour">
            <option>00</option>
            <option>01</option>
            <option>02</option>
            <option>03</option>
            <option>04</option>
            <option>05</option>
            <option>06</option>
            <option>07</option>
            <option>08</option>
            <option>09</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>13</option>
            <option>14</option>
            <option>15</option>
            <option>16</option>
            <option>17</option>
            <option>18</option>
            <option>19</option>
            <option>20</option>
            <option>21</option>
            <option>22</option>
            <option>23</option>
          </select>
        </td>
        <td>:</td>
        <td>
          <select name="min">
            <option>00</option>
            <option>01</option>
            <option>02</option>
            <option>03</option>
            <option>04</option>
            <option>05</option>
            <option>06</option>
            <option>07</option>
            <option>08</option>
            <option>09</option>
            <option>11</option>
            <option>12</option>
            <option>13</option>
            <option>14</option>
            <option>15</option>
            <option>16</option>
            <option>17</option>
            <option>18</option>
            <option>19</option>
            <option>20</option>
            <option>21</option>
            <option>22</option>
            <option>23</option>
            <option>24</option>
            <option>25</option>
            <option>26</option>
            <option>27</option>
            <option>28</option>
            <option>29</option>
            <option>30</option>
            <option>31</option>
            <option>32</option>
            <option>33</option>
            <option>34</option>
            <option>35</option>
            <option>36</option>
            <option>37</option>
            <option>38</option>
            <option>39</option>
            <option>40</option>
            <option>41</option>
            <option>42</option>
            <option>43</option>
            <option>44</option>
            <option>45</option>
            <option>46</option>
            <option>47</option>
            <option>48</option>
            <option>49</option>
            <option>50</option>
            <option>51</option>
            <option>52</option>
            <option>53</option>
            <option>54</option>
            <option>55</option>
            <option>56</option>
            <option>57</option>
            <option>58</option>
            <option>59</option>
          </select>
        </td></tr></table>
      </td></tr></table>
    </td></tr>
    <tr><td><input type="submit" value="Schedule"/></td></tr>
  </table>
</form>
</div>

</div>
<table border="0" cellspacing="0" cellpadding="0">
  <tr><td><pieChart/></td></tr>
</table>
</pda>
<br/>


<div align="left"><span class="xs"><hudsonFog /></span></div>      <!-- link to Portal page for current category -->
</html>

