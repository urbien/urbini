<div id="textdiv4" class="popMenu" pda="T">
<table bgcolor="#FFFFFF" border="0" cellpadding="0" cellspacing="0">
<tr><td>
<div style="border-style:solid; border-width: 1px; border-color:#666666 #666666 #666666 #666666">
<div style="border-style:solid; border-width: 1px; border-color:#F9F8F7 #F9F8F7 #F9F8F7 #F9F8F7">
<table border="0" cellpadding="0" cellspacing="0">
<tr>
  <td unselectable="on" bgcolor="#0055e6" class="cswmItem" style="padding-left:3">
    <b><font color="FFFFFF">Schedule</font></b>
  </td>
  <td unselectable="on" bgcolor="#0055e6" style="padding-right:3; padding-top:3; padding-bottom:3" align="right">
    <A title="Close" onclick="menuOpenClose('textdiv4')" 
       href="javascript://"><IMG alt="Click here to close" 
       src="images/button_popup_close.gif" 
       border="0" style="display:block"></IMG>
    </A>
  </td>
</tr>
<tr>
  <td bgcolor="#FFFFFF" colspan="2">

<form name="scheduleForm" action="page2schedule" method="GET">
  <table cellpadding="5">
    <tr nonPda="T">
      <td><b><text text="Schedule:"/></b></td>
    </tr>
    <tr><td>
    <table border="0" cellpadding="3" cellspacing="2">
      <tr><td bgcolor="#e3e2df" class="cswmItemSubtitle">Subject:</td><td bgcolor="#e3e2df"><input name="name" class="formMenuInput"/></td></tr>
		<tr> 
		  <td bgcolor="#e3e2df" class="cswmItemSubtitle">Format:</td>
		  <td bgcolor="#e3e2df"> <select name="format" onchange="onRecChange()" class="formMenuInput">
			  <option value="html">HTML</option>
			  <option value="xls">Excel</option>
			</select></td>
		</tr>
      <tr><td bgcolor="#e3e2df" class="cswmItemSubtitle">Repeat:</td>
	  <td bgcolor="#e3e2df">
        <select name="rec" onchange="onRecChange()" class="formMenuInput">
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </td>
      </tr>
      <tr><td bgcolor="#e3e2df" class="cswmItemSubtitle"><div id="titleDiv"></div></td><td bgcolor="#e3e2df"><div id="valueDiv"></div></td></tr>
      <tr><td bgcolor="#e3e2df" class="cswmItemSubtitle">Time:</td>
      <td bgcolor="#e3e2df">
        <table><tr><td>
          <select name="hour" class="formMenuInput">
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
          <select name="min" class="formMenuInput">
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
    <tr><td><input type="submit" value="Schedule" class="cswmItemSubtitle"/></td></tr>
  </table>
</form>
</td></tr>
</table>
</div></div>
</td></tr>
  </table>
</div>