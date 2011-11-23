<div>
<table width="950" border="0" cellspacing="5" cellpadding="5">
<tr>
  <td colspan="5" style="font-size:14px;border:2px solid #999999; padding:10px;">
  <div style="float:left;">
  <div align="left" style="margin:20px;font-size:2em; color:#333333"><property name="name" noIcon="y" /></div>
  <div align="left" style="margin-left:40px; font-size:1.3em; color:#777777"><where value="slogan != null">&#8220;<property name="slogan" noIcon="y" />&#8221;</where></div>
  </div>
  <div align="right" style="float:right;margin:20px"><property name="featured"  noIcon="y" /></div>
  </td>
</tr>
<tr>
  <td valign="center"><div style="padding:20px; float:left; font-size:1.2em;"><div><property name="address1" noIcon="y" /></div>
  <div><property name="town" noIcon="y" /></div>
  <div><property name="county" noIcon="y" /></div>
  <div><property name="postalCode" noIcon="y" /></div>
  <div><property name="country.name" noIcon="y" /></div>
  <div><text text="Phone" /> <property name="phone" noIcon="y" /> </div>    
  <where value="fax != null"><div><text text="Fax" /> <property name="fax" noIcon="y" /> </div></where>    
  <div style="padding-top:10px"><b><property name="website" href="y" /></b></div>
  <div><property name="email" href="y" /></div>
  <div style="margin-top:10px"><mapMaker width="250" height="200" /></div>
  </div></td>
  <td colspan="4" valign="top" style="padding:20px;"><property name="description" noIcon="y" /></td>
  </tr>
  <tr>
  <td colspan="5" align="right" style="font-size:12px; margin:4px;">
  <where value="getContact().vendor.name != name">
  <a href="claimYourBiz.html">Is this your business?  Claim your site today for free!</a>
  </where>
  <where value="getContact().vendor.name == name">
  <div>
  <property name="-$me.firstName">,&#160;<text text="you can start building your business now" />
  <div><a href="claimYourBiz.html">See what things you can do here</a></div>
  </div>
  </where>
  </td>
  </tr>
<tr>
  <td colspan="5" valign="center"><siteResourceList uri="l.html?-$action=searchLocal&amp;type=http://www.hudsonfog.com/voc/media/publishing/ProductType&amp;suppliers.company_verified=y&amp;suppliers.company_select=-$this&amp;-gridCols=description&amp;-title=Our+Products&amp;-inRowW=8&amp;-titleLink=y&amp;-suppressHeader=y&amp;-sidebar=right"/></td>
</tr>
<tr align="left">
  <td valign="top" width="30%"><siteResourceList uri="l.html?-$action=searchLocal&amp;associatedWith=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/News&amp;-sidebar=right&amp;-inRow=1&amp;-title=Our+News&amp;-titleLink=y"/></td>
  <td valign="top" width="30%"><siteResourceList uri="l.html?-$action=searchLocal&amp;associatedWith=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Blog&amp;-sidebar=right&amp;-inRow=1&amp;-title=Our+Blog&amp;-titleLink=y"/></td>
  <td valign="top" width="30%" colspan="3"><siteResourceList uri="l.html?-$action=searchLocal&amp;associatedWith=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Article&amp;-sidebar=right&amp;-inRow=1&amp;-title=Our+Features&amp;-titleLink=y"/></td>
</tr>
<tr>
  <td colspan="5" align="left"><siteResourceList uri="l.html?-$action=searchLocal&amp;company=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Event&amp;-title=Our+upcoming+Events&amp;-titleLink=y&amp;-inRowW=6&amp;-sidebar=right"/></td>
</tr>
<!--tr>
<td colspan="5"><siteResourceList uri="l.html?-$action=searchLocal&amp;associatedWith=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Job&amp;-title=Vacancies&amp;-sidebar=right&amp;-titleLink=y&amp;-inRowW=6&amp;-list=y&amp;-suppressHeader=y&amp;-gridCols=title,skillCategory,jobCategory,city,maximumSalary"/></td>
</tr-->
<tr>
<td colspan="5"><siteResourceList uri="l.html?-$action=searchLocal&amp;associatedWith=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Job&amp;-title=Vacancies&amp;-sidebar=right&amp;-titleLink=y&amp;-inRowW=6"/></td>
</tr>
<tr>
  <td colspan="5" valign="top" align="left"><siteResourceList uri="l.html?-$action=searchLocal&amp;company=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Brochure&amp;-titleLink=y&amp;-sidebar=right&amp;-inRowW=5&amp;-title=Our+Brochures"/></td>
</tr>
<tr>
  <td colspan="5" valign="top"><siteResourceList uri="l.html?-$action=searchLocal&amp;company=-$this&amp;type=http://www.hudsonfog.com/voc/media/publishing/Video&amp;-title=Some+Vidoes&amp;-titleLink=y&amp;-inRowW=6&amp;-sidebar=right"/></td>
</tr>
</table>
</div>



