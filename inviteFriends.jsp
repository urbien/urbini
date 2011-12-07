<div id="invite" align="center">
<errorMessage/>
<br /><br /><br /><br />
<div style="color:red;text-size:15px;font-weight:bold"><text text="Please be patient after clicking Submit, the guy that we have running to all the providers is only human." />
<br /><br /><br />
<form method="POST" action="social/importContacts">
<table width="40%" height="100%" border="0" cellspacing="5" cellpadding="0"><tbody>
  <tr>
    <td align="left">
      <label for="email_box">Email / ID</label>
    </td>
    <td>
      <input type="text" name="email_box" id="email_box" value="" />
    </td>
  </tr>
  <tr>
    <td align="left">
      <label for="password_box">Password</label>
    </td>
    <td>
      <input type="password" name="password_box" id="password_box" value="" />
    </td>
  </tr>
  <tr>
    <td align="left">
      <label for="provider_box">Email domain / Social net</label>
    </td>
    <td>
      <select name="provider_box" id="provider_box">
        <option value=""></option>
        <!--- this is the list of all providers, some don't work. The ones that work (theoretically) are below -->
        <!--optgroup label="Email Providers">
        <option value="Abv,abv">Abv</option>
        <option value="AOL,aol">AOL</option>
        <option value="Apropo,apropo">Apropo</option>
        <option value="Atlas,atlas">Atlas</option>
        <option value="Aussiemail,aussiemail">Aussiemail</option>
        <option value="Azet,azet">Azet</option>
        <option value="Bigstring,bigstring">Bigstring</option>
        <option value="Bordermail,bordermail">Bordermail</option>
        <option value="Canoe,canoe">Canoe</option>
        <option value="Care2,care2">Care2</option>
        <option value="Clevergo,clevergo">Clevergo</option>
        <option value="Doramail,doramail">Doramail</option>
        <option value="Evite,evite">Evite</option>
        <option value="FastMail,fastmail">FastMail</option>
        <option value="5Fm,fm5">5Fm</option>
        <option value="Freemail,freemail">Freemail</option>
        <option value="Gawab,gawab">Gawab</option>
        <option value="GMail,gmail">GMail</option>
        <option value="GMX.net,gmx_net">GMX.net</option>
        <option value="Graffiti,graffiti">Grafitti</option>
        <option value="Live/Hotmail,hotmail">Live/Hotmail</option>
        <option value="Hushmail,hushmail">Hushmail</option>
        <option value="Inbox.com,inbox">Inbox.com</option>
        <option value="India,india">India</option>
        <option value="IndiaTimes,indiatimes">IndiaTimes</option>
        <option value="Inet,inet">Inet</option>
        <option value="Interia,interia">Interia</option>
        <option value="KataMail,katamail">KataMail</option>
        <option value="Kids,kids">Kids</option>
        <option value="Libero,libero">Libero</option>
        <option value="LinkedIn,linkedin">LinkedIn</option>
        <option value="Lycos,lycos">Lycos</option>
        <option value="Mail2World,mail2world">Mail2World</option>
        <option value="Mail.com,mail_com">Mail.com</option>
        <option value="Mail.in,mail_in">Mail.in</option>
        <option value="Mail.ru,mail_ru">Mail.ru</option>
        <option value="Meta,meta">Meta</option>
        <option value="MSN,msn">MSN</option>
        <option value="Mynet.com,mynet">Mynet.com</option>
        <option value="Netaddress,netaddress">Netaddress</option>
        <option value="Nz11,nz11">Nz11</option>
        <option value="O2,o2">O2</option>
        <option value="OperaMail,operamail">OperaMail</option>
        <option value="Plaxo,plaxo">Plaxo</option>
        <option value="Pochta,pochta">Pochta</option>
        <option value="Popstarmail,popstarmail">Popstarmail</option>
        <option value="Rambler,rambler">Rambler</option>
        <option value="Rediff,rediff">Rediff</option>
        <option value="Sapo.pt,sapo">Sapo.pt</option>
        <option value="Techemail,techemail">Techemail</option>
        <option value="Terra,terra">Terra</option>
        <option value="Uk2,uk2">Uk2</option>
        <option value="Virgilio,virgilio">Virgilio</option>
        <option value="Walla,walla">Walla</option>
        <option value="Web.de,web_de">Web.de</option>
        <option value="Wp.pt,wpl">Wp.pt</option>
        <option value="Xing,xing">Xing</option>
        <option value="Yahoo!,yahoo">Yahoo!</option>
        <option value="Yandex,yandex">Yandex</option>
        <option value="YouTube,youtube">YouTube</option>
        <option value="Zapakmail,zapak">Zapakmail</option>
        </optgroup>
        <optgroup label="Social Networks">
        <option value="Badoo,badoo">Badoo</option>
        <option value="Bebo,bebo">Bebo</option>
        <option value="Bookcrossing,bookcrossing">Bookcrossing</option>
        <option value="Brazencareerist,brazencareerist">Brazencareerist</option>
        <option value="Cyworld,cyworld">Cyworld</option>
        <option value="Eons,eons">Eons</option>
        <option value="Facebook,facebook">Facebook</option>
        <option value="Faces,faces">Faces</option>
        <option value="Famiva,famiva">Famiva</option>
        <option value="Fdcareer,fdcareer">Fdcareer</option>
        <option value="Flickr,flickr">Flickr</option>
        <option value="Flingr,flingr">Flingr</option>
        <option value="Flixster,flixster">Flixster</option>
        <option value="Friendfeed,friendfeed">Friendfeed</option>
        <option value="Friendster,friendster">Friendster</option>
        <option value="Hi5,hi5">Hi5</option>
        <option value="Hyves,hyves">Hyves</option>
        <option value="Kincafe,kincafe">Kincafe</option>
        <option value="Konnects,konnects">Konnects</option>
        <option value="Koolro,koolro">Koolro</option>
        <option value="Last.fm,lastfm">Last.fm</option>
        <option value="Livejournal.livejournal">Livejournal</option>
        <option value="Lovento,lovento">Lovento</option>
        <option value="Meinvz,meinvz">Meinvz</option>
        <option value="Mevio,mevio">Mevio</option>
        <option value="Motortopia,motortopia">Motortopia</option>
        <option value="Multiply,multiply">Multiply</option>
        <option value="Mycatspace,mycatspace">Mycatspace</option>
        <option value="Mydogspace,mydogspace">Mydogspace</option>
        <option value="MySpace,myspace">MySpace</option>
        <option value="NetLog,netlog">NetLog</option>
        <option value="Ning,ning">Ning</option>
        <option value="Orkut,orkut">Orkut</option>
        <option value="Perfspot,perfspot">Perfspot</option>
        <option value="Plazes,plazes">Plazes</option>
        <option value="Plurk,plurk">Plurk</option>
        <option value="Skyrock,skyrock">Skyrock</option>
        <option value="Tagged,tagged">Tagged</option>
        <option value="Twitter,twitter">Twitter</option>
        <option value="Vimeo,vimeo">Vimeo</option>
        <option value="Vkontakte,vkontakte">Vkontakte</option>
        <option value="Xanga,xanga">Xanga</option>
        <option value="Xuqa,xuqa">Xuqa</option>
        </optgroup-->        
        <!--- end list of all providers  -->


        <optgroup label="Email Providers">
        <option value="AOL,aol">AOL</option>
        <option value="Apropo,apropo">Apropo</option>
        <option value="Atlas,atlas">Atlas</option>
        <option value="Aussiemail,aussiemail">Aussiemail</option>
        <option value="Azet,azet">Azet</option>
        <option value="Bigstring,bigstring">Bigstring</option>
        <option value="Bordermail,bordermail">Bordermail</option>
        <option value="Doramail,doramail">Doramail</option>
        <option value="Evite,evite">Evite</option>
        <option value="FastMail,fastmail">FastMail</option>
        <option value="5Fm,fm5">5Fm</option>
        <option value="Gawab,gawab">Gawab</option>
        <option value="GMail,gmail">GMail</option>
        <option value="Live/Hotmail,hotmail">Live/Hotmail</option>
        <option value="Inbox.com,inbox">Inbox.com</option>
        <option value="India,india">India</option>
        <option value="Inet,inet">Inet</option>
        <option value="Interia,interia">Interia</option>
        <option value="KataMail,katamail">KataMail</option>
        <option value="Libero,libero">Libero</option>
        <option value="LinkedIn,linkedin">LinkedIn</option>
        <option value="Lycos,lycos">Lycos</option>
        <option value="Mail2World,mail2world">Mail2World</option>
        <option value="Mail.com,mail_com">Mail.com</option>
        <option value="Mail.in,mail_in">Mail.in</option>
        <option value="Mynet.com,mynet">Mynet.com</option>
        <option value="Netaddress,netaddress">Netaddress</option>
        <option value="Nz11,nz11">Nz11</option>
        <option value="O2,o2">O2</option>
        <option value="OperaMail,operamail">OperaMail</option>
        <option value="Rambler,rambler">Rambler</option>
        <option value="Rediff,rediff">Rediff</option>
        <option value="Techemail,techemail">Techemail</option>
        <option value="Virgilio,virgilio">Virgilio</option>
        <option value="Walla,walla">Walla</option>
        <option value="Zapakmail,zapak">Zapakmail</option>
        </optgroup>
        <optgroup label="Social Networks">
        <option value="Bookcrossing,bookcrossing">Bookcrossing</option>
        <option value="Cyworld,cyworld">Cyworld</option>
        <option value="Eons,eons">Eons</option>
        <option value="Faces,faces">Faces</option>
        <option value="Flickr,flickr">Flickr</option>
        <option value="Flixster,flixster">Flixster</option>
        <option value="Friendster,friendster">Friendster</option>
        <option value="Hyves,hyves">Hyves</option>
        <option value="Kincafe,kincafe">Kincafe</option>
        <option value="Konnects,konnects">Konnects</option>
        <option value="Koolro,koolro">Koolro</option>
        <option value="Last.fm,lastfm">Last.fm</option>
        <option value="Livejournal.livejournal">Livejournal</option>
        <option value="Meinvz,meinvz">Meinvz</option>
        <option value="Mevio,mevio">Mevio</option>
        <option value="Mycatspace,mycatspace">Mycatspace</option>
        <option value="Mydogspace,mydogspace">Mydogspace</option>
        <option value="MySpace,myspace">MySpace</option>
        <option value="NetLog,netlog">NetLog</option>
        <option value="Ning,ning">Ning</option>
        <option value="Orkut,orkut">Orkut</option>
        <option value="Skyrock,skyrock">Skyrock</option>
        <option value="Xuqa,xuqa">Xuqa</option>
        </optgroup>      
      </select>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <br />
      <input type="submit" name="import" value="Import Contacts" />
    </td>
  </tr>
</table>
</form>
</div>