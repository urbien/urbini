<div>
<!-- Attributions>
  Font Awesome - http://fortawesome.github.com/Font-Awesome
</Attributions-->

<!-- Templates -->
<script type="text/template" id="resource-list">
  <!-- Resource list page -->
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}"></div> 
  <div id="{{= viewId + 'r' }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}" data-position="right"></div> 
  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="mapHolder" data-role="none"></div>
  <div id="sidebarDiv" class="ui-content" role="main">
    <ul id="sidebar"  data-role="listview" data-theme="{{= G.theme.list }}"  data-filter-theme="{{= G.theme.list }}" 
    {{ if (this.collection.models.length > 5) { }}
     data-filter="{{= this.canSearch }}" data-filter-placeholder="{{= loc(obj.placeholder || 'search') }}"
   {{ } }}
   ></ul>
    <div id="nabs_grid" class="masonry">
    </div>
    <!-- ul id="columns">
    </ul -->
    <table class="table-stroke" width="100%" style="display:none" id="comments">
    </table>
    <form data-ajax="false" id="mv" action="#">
      <input type="submit" id="mvSubmit" value="{{= loc('submit') }}" />
      <div data-role="fieldcontain">
        <fieldset data-role="controlgroup" id="mvChooser">
        </fieldset>
      </div>
    </form>  
    <form data-ajax="false" id="editRlForm" action="#">
      <input type="submit" id="editRlSubmit" value="Submit" />
      <ul data-role="listview" data-theme="{{= G.theme.list }}" id="editRlList" class="action-list" data-inset="true">
      </ul>
    </form>  
  </div>
  
  <!-- div data-role="footer" class="ui-bar" data-theme="{{= G.theme.footer }}">
     <a data-role="button" data-icon="repeat" id="homeBtn" target="#">Home</a -->
     <!-- "Next" button removed after endless page introduction>
     {{ if (this.collection.length > this.collection.perPage) { }}
       <a data-role="button" data-shadow="false" data-icon="arrow-right" id="nextPage" target="#" class="next" style="float:right;">{{= loc('next') }}</a>
     {{ }                                                       }}
     -->
  <!-- /div -->
</script>  
 
<script type="text/template" id="resource">
  <!-- Single resource view -->  
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}"></div>
  <div id="{{= viewId + 'r' }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}" data-position="right"></div> 

  <!-- div id="headerMessageBar"></div -->
  <div id="headerDiv"></div>
  <div id="resourceViewHolder">
    <div class="ui-grid-a" style="width: 100%;padding-right:10px;">
      <div class="ui-block-a" id="resourceImage"><!-- style="width:auto" --></div>
      <div id="mainGroup" class="ui-block-b" style="min-width: 130px;padding-left:7px;"></div>
      <div id="buyGroup" class="ui-block-b" style="min-width: 130px"></div>
    </div>
    <div id="resourceImageGrid" data-role="content" style="padding: 2px;" data-theme="{{= G.theme.photogrid }}" class="grid-listview hidden"></div>
    <div id="photogridHeader" style="top: -3px;" data-role="footer" data-theme="{{= G.theme.photogrid }}" class="hidden"><h3></h3></div>
    <div id="photogrid" style="padding: 7px;" data-theme="{{= G.theme.photogrid }}" data-role="content" class="grid-listview hidden"></div>
    
    {{ if (this.vocModel.type.endsWith("Impersonations")) { }}
          <div style="padding:10px;"><a data-role="button" class="{{= 'ui-btn-hover-' + G.theme.swatch }}" data-icon="heart" data-theme="{{= G.theme.swatch }}" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: this.resource.get('_uri'), '-makeId': G.nextId()}) }}">{{= loc('wooMe') }}</a></div>
    {{ } }}
    <ul data-role="listview" data-inset="true" data-shadow="false" style="padding: 10px;" data-theme="{{= G.theme.list }}" id="resourceView">
    </ul>
    <div id="about" class="hidden" style="padding: 7px;" data-theme="{{= G.theme.photogrid }}"></div>
    
    {{ if ($('#other')) { }}
      <!--br/>
      <br/-->
    {{ } }}
    
    <ul data-role="listview" data-theme="{{= G.theme.list }}" id="cpView" class="ui-listview" data-inset="true" style="padding: 10px;">
    </ul>
  </div>
  <div data-role="footer" class="ui-bar" data-theme="{{= G.theme.footer }}">
     <a data-role="button" data-shadow="false" data-icon="repeat" id="homeBtn" target="#">Home</a>
     <a data-role="button" data-shadow="false" data-icon="edit" id="edit" target="#" style="float:right;" id="edit">{{= loc('edit') }}</a>
  </div>
</script>  

<script type="text/template" id="bookmarkletIphoneStaticPageTemplate">
<style>
  .bookmarkletPage-tableview-grouped {
    background: #f2f2f2;
    padding: 10px 10px 1px;
    width: 300px;
  }

  .bookmarkletPage-section {
    -webkit-text-size-adjust: none;
    font-family: "Helvetica Neue", sans-serif;
    background: #fff;
    border-radius: 10px;
    padding: 10px;
    width: 280px;
    border: 1px solid #d9d9d9;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .bookmarkletPage a { color: #1389e5; }
  
  .bookmarkletPage-section h1, .bookmarkletPage-section h2, .bookmarkletPage-section h3, .bookmarkletPage-section h4, .bookmarkletPage-section h5, .bookmarkletPage-section h6 {
    font-size: 16px;
    font-weight: bold;
  }

  .bookmarkletPage-section p {
    margin-top: 10px;
  }

  .bookmarkletPage-section li {
    margin-top: 10px;
  }
</style>
<div class="bookmarkletPage-tableview-grouped">
<div class="bookmarkletPage-section">
    <h1><strong>Installing the Aha! Bookmarklet for iPhone</strong></h1>
    <p>Before you begin, be aware that it is much easier to install the iPhone bookmark in Firefox or Safari on your computer, and then synchronize your iPhone or iPod touch using iTunes.</p>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 1: Bookmark this page.</h2>
    <p>Tap the middle icon below, then tap <strong>Add Bookmark</strong>, then tap Save.</p>
</div>

<div class="bookmarkletPage-section">
  <h2>Step 2: Select the text and copy it.</h2>
  <textarea style="width: 280px; height: 170px; margin-top: 10px;">javascript:void(function loadAha(d, params) {var e = d.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src','//urbien.com/js/aha.js?r='+Math.random()*99999999 + '&' + (params || ''));d.body.appendChild(e)}(document, "aha=y"))</textarea>
  <ol style="float: right; width: 280px; list-style-position: inside;">
    <li>Tap inside.</li>
    <li>Tap and hold for a bit, then release.</li>
    <li>Tap <strong>Select All.</strong></li>
    <li>Tap <strong>Copy.</strong></li>
    <li>Tap <strong>Done</strong>.</li>
  </ol>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 3: Edit the bookmark.</h2>
    <p>1. Tap the Bookmarks button in the toolbar.</p>
    <p>2. Tap <strong>Edit</strong>. Select the <strong>Aha!</strong> bookmark to edit.</p>
    <p>3. Tap its URL, tap the <strong>x</strong> to clear it, tap-and-hold for the magnifying glass, then tap <strong>Paste</strong>.</p>
    <p>4. Save the changes by tapping <strong>Done</strong>.</p>
</div>

<div class="bookmarkletPage-section">
    <h2>Step 4: Installation complete.</h2>
    <p>Installation should be complete!</p>
    <p>Select the <strong>Aha!</strong> bookmark from your Bookmarks list to use it.</p>
    <p>As soon as this can be made simpler, it will be. Thank you for your patience, and thank you for using Aha!</p>

</div>
</div>
</script>

<script type="text/template" id="bookmarkletAndroidStaticPageTemplate">
<div style="margin: 0px 10px 0px 10px;">
  <div>
    <h1><strong>Using the Aha! Bookmarklet on Android</strong></h1>
    <p class="red" style="font-weight:bold">First, make sure to install the Aha! bookmark on your desktop Chrome.</p>
    <p>Then when you browse a page you'd like to Aha! or Huh?, tap the address bar and type in <strong>aha</strong>. See the image below for reference. Now click the starred bookmark that says <strong>Aha!</strong></p>
    <p><img src="{{= G.serverName + '/images/aha/Android bookmark.png' }}" style="max-width:100%" />
  </div>
</div>
</script>

<script type="text/template" id="bookmarkletDesktopStaticPageTemplate">
  <div style="text-align:center">
    <h1>Drag the button below to your browser's bookmark bar</h1>
    <ul class="nav">
      <li><a onclick="javascript:alert('Drag me to your bookmarks bar!'); return false;" href="javascript:void(function loadAha(d, params) {var e = d.createElement('script');e.setAttribute('type','text/javascript');e.setAttribute('charset','UTF-8');e.setAttribute('src','//urbien.com/js/aha.js?r='+Math.random()*99999999 + '&' + (params || ''));d.body.appendChild(e)}(document, 'aha=y'))" style="font-size:30px">Aha!</a></li>
    </ul>
  </div>
</script>

<script type="text/template" id="chatPageTemplate">
  <!-- Chat page -->
  <div id="{{= viewId }}" data-role="panel" data-display="overlay" style="z-index: 3000;" data-theme="{{= G.theme.menu}}"></div> 
  <div id="{{= viewId + 'r' }}" data-role="panel" data-display="overlay" style="z-index: 3001;" data-theme="{{= G.theme.menu }}" data-position="right"></div> 
  <div id="headerDiv"></div>
  <div id="videoChat" class="videoChat">
    <div id="localMedia"></div>
    <div id="remoteMedia"></div>
  </div>    
  <!--div id="headerMessageBar" style="opacity:0.7"></div-->
  <!--div id="localVideoMonitor" style="z-index:100;width:100%;height:100%;left:0;top:0;position:fixed;">
  </div-->
  <div id="ringtoneHolder" style="visibility: hidden; display: none;">
  </div>
  
  <div id="inChatGoodies" style="width:100%;position:absolute; z-index: 100">
    <div id="inChatBacklinks" style="position:absolute;padding:5px;top:130px;z-index:2000"></div>
    <div id="inChatStats" style="position:relative;"></div>
  </div>
  <div id="chatDiv" role="main" data-role="content" class="chat-holder">
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
    <div id="textChat"> <!--style="margin: 0px 10px 0px 10px" -->
      <!--h3>Text Chat</h3-->
      <div id="messages" width="100%">
      </div>
    </div>
  {{ }                                          }}
  </div>
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
  <div data-role="footer" data-position="fixed" data-theme="{{= G.theme.header }}" class="fieldcontain closespacing forceinline" style="z-index:3000">
    <div class="floatleft">
      <button id="chatCaptureBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-camera"></i></button>
    </div>
    {{ if (this.isAgent) { }}
    <div class="floatleft">
      <button id="chatReqLocBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-eye-open"></i></button>
    </div>
    {{ }                     }}
    {{ if (this.isClient) { }}
    <div class="floatleft" style="padding-top:0px">
      <!--input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
      <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label-->
      <button id="chatShareLocBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-map-marker"></i></button>
    </div>  
    {{ }                     }}
    <div class="floatleft" style="width:40%">
      <input type="text" id="chatMessageInput" class="miniinputheight" value="" data-mini="true" />
    </div>  
    <div class="floatleft">
      <button id="chatSendBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true">{{= loc('send') }}</button>
    </div>
  </div>
  {{ } }}
</script>  

<script type="text/template" id="chatMessageTemplate1">
  <table width="100%">
    <tr>
      {{ if (!obj.info && !obj.self && obj.senderIcon) { }}
        <td width="1%"><img src="{{= obj.senderIcon }}" height="20" style="margin-right:10px" /></td> 
      {{ }                 }}
      
      <td width="100%">
        <div class="{{= 'bubble' + (obj.sender ? (obj.self ? '-left' : '-right') : '') }}">
          {{ if (obj.sender) { }}
            <span class="{{= obj.self ? 'speaker-self' : 'speaker-other' }}">{{= sender }}</span> ({{= time }}): 
          {{ }                 }}
      
          {{ if (obj.info && obj.senderIcon) { }}
            <img src="{{= obj.senderIcon }}" height="20" style="margin-right:10px" /> 
          {{ }                 }}
          
          <span class="{{= obj.info ? 'chat-info' : obj.self ? 'chat-message-outgoing' : 'chat-message-incoming' }}">
            {{ if (obj['private']) { }}
              <span class="private-message"><i>{{= '(' + loc('privateMsg') + ')' }}</i></span> 
            {{ }                 }}
            {{= obj.sender ? message : '{0} ({1})'.format(message, time) }}
          </span>
        </div>
      </td>
      
      {{ if (!obj.info && obj.self && obj.senderIcon) { }}
        <td width="1%"><img src="{{= obj.senderIcon }}" height="20" style="margin-left:10px" /></td> 
      {{ }                 }}
    </tr>
  </table>
</script>

<!--script type="text/template" id="chatResourceMessageTemplate">
  <h3><a href="{{= U.makePageUrl('view', _uri) }}">{{= displayName }}</a></h3>
  {{ if (obj.image) {                      }}
     <a href="{{= U.makePageUrl('view', _uri) }}"><img src="{{= U.getExternalFileUrl(image) }}" /></a>
  {{ }                                     }}
  {{ for (var p in props) {                }}
     <p>{{= p }}: {{= props[p] }}</p>
  {{ }                                     }}
</script-->

<script type="text/template" id="chatResourceLinkMessageTemplate">
  <strong><a href="{{= href }}">{{= text }}</a></strong>
</script>

<script type="text/template" id="chatMessageTemplate">
  <table width="100%" class="height_tracker">
    <tr>
      <td width="100%">
        <div class="{{= 'chat_msg ' + (obj.sender ? (obj.self ? 'msg_sent' : 'msg_recvd') : 'msg_recvd') }}">
         <!--  {{ if (obj.sender) { }}
            <div class="chat_user"><div><img class="med user_pic" src="{{= obj.senderIcon }}" /></div></div>
          {{ }                 }}
          {{ if (obj.info && obj.senderIcon) { }}
         -->
          {{ if (obj.senderIcon) { }}
            <div class="chat_user"><div><img class="med user_pic" src="{{= obj.senderIcon }}" /></div></div> 
          {{ }                 }}
          
          <div class="chat_copy">
            {{ if (obj.isPrivate) { }}
              <p class="private-message"><i> (Private message) </i></p> 
            {{ }                 }}
            <!-- p>{{= obj.sender ? message : '{0} ({1})'.format(message, time) }}</p -->
            <p>{{= message }}</p>
          </div>
          <div class="posted_on">
          {{ if (obj.sender) { }}
            <strong>{{= sender }}</strong>&#160;&#160;{{= time }}
          {{ }                 }}
          </div>
        </div>
      </td>
    </tr>
  </table>
</script>

<script type="text/template" id="socialNetworkPageTemplate">
<!-- View where the user can connect various social networks -->  
  <div id="{{= this.cid }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}"></div>
  <div id="{{= this.cid + 'r' }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}" data-position="right"></div> 
  <div id="headerDiv"></div>
  <div id="socialButtons" style="min-width:200px; margin: 0 auto;"></div>
</script>  

<script type="text/template" id="socialNetButtonTemplate">
  <div class="{{= obj['class'] || '' }}" style="text-align:center;">
    <!--button data-icon="{{= icon }}" data-inline="true" data-net="{{= net }}">{{= net }}</button-->
    <a href="#" data-role="button" data-net="{{= net }}">
      <i class="{{= 'ui-icon-' + icon}}" style="font-size: 20px; float:left;"></i>
      <i class="{{= obj.connected ? 'ui-icon-remove-sign' : 'ui-icon-ok-circle'}}" style="font-size: 20px; float:right"></i>
    </a>
  </div>
</script>

<script type="text/template" id="genericOptionsDialogTemplate">
  <div data-role="popup" id="{{= id }}" data-overlay-theme="a" data-theme="c">
    <ul data-role="listview" data-inset="false" data-theme="d"> 
      <li data-role="divider" data-theme="e" style="font-size: 20px;">{{= title }}</li>
      {{ _.each(options, function(option) { }}
        <li data-icon="false" style="padding:5px 20px;"><a href="{{= option.href || '#' }}" style="font-size: 20px;" id="{{= option.id }}" >{{= option.text }}</a></li>
      {{ })                                 }}
    </ul>
  </div>
</script>

<script type="text/template" id="genericOptionsDialogTemplate1">
  <div data-role="popup" id="{{= id }}" data-overlay-theme="a" data-theme="c">
    <ul data-role="listview" data-inset="true" data-theme="d">
      <li data-role="divider" data-theme="e">{{= title }}</li>
      {{ _.each(options, function(option) { }}
        <li><a href="{{= option.href || '#' }}" id="{{= option.id }}" >{{= option.text }}</a></li>
      {{ })                                 }}
    </ul>
  </div>
</script>

<script type="text/template" id="genericDialogTemplate">
<div data-role="popup" id="{{= id }}" data-overlay-theme="a" data-theme="c" data-dismissible="{{= obj.ok === false && obj.cancel === false }}" class="ui-content">
  {{ if (obj.header) { }}
  <div data-role="header" id="header" data-theme="a" class="ui-corner-top">
    <h1>{{= header }}</h1>
  </div>
  {{ }                 }}
  
  {{ if (obj.ok === false && obj.cancel === false) { }}
    <a href="#" data-cancel="cancel" data-rel="back" data-role="button" data-theme="{{= G.theme.menu }}" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>
  {{ }                 }}

  <div data-role="content" data-theme="d" class="ui-corner-bottom ui-content">
    {{= obj.title ? '<h3 class="ui-title">{0}</h3>'.format(title) : '' }}
    {{= obj.img ? '<img style="display:block" src="{0}" />'.format(img)                 : '' }}
    {{= obj.details ? '<p style="display:block">{0}</p>'.format(details)                 : '' }}
    
    <div style="display:block">
    {{ if (obj.cancel) { }}
    <a href="#" data-role="button" data-cancel="" data-inline="true" data-rel="back" data-theme="{{= G.theme.footer }}">{{= loc(typeof cancel === 'string' ? cancel : 'cancel') }}</a>
    {{ }                 }}
    
    {{ if (obj.ok) { }}
    <a href="#" data-role="button" data-ok="" data-inline="true" data-rel="back" data-transition="flow" data-theme="{{= G.theme.activeButton }}">{{= loc(typeof ok === 'string' ? ok : 'ok') }}</a>
    {{ }                 }}
    </div>
  </div>
</div>
</script>

<script type="text/template" id="chatViewTemplate1">
  <div id="chatHolder" class="chat-holder">
   <!--
   {{ if (obj.video || obj.audio) { }}
    <div id="videoChat" class="videoChat">
      <div id="localMedia"></div>
      <div id="remoteMedia"></div>
    </div>    
  {{ }                }}

    <div id="ringtoneHolder" style="visibility: hidden; display: none;">
    </div>
  -->
  {{ if (!this.isWaitingRoom || this.isAgent) { }}
    <div id="textChat"> <!--style="margin: 0px 10px 0px 10px" -->
      <!--h3>Text Chat</h3-->
      <div id="messages" width="100%">
      </div>
    </div>
        <div data-role="footer" data-position="fixed" data-theme="{{= G.theme.header }}" class="fieldcontain closespacing forceinline" style="z-index:3000">
      <!--table>
        <tr>
          <td>
            <button id="chatCaptureBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-camera"></i></button>
          </td>
          {{ if (this.isAgent) { }}
          <td>
            <button id="chatReqLocBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-eye-open"></i></button>
          </td>
          {{ }                     }}
          {{ if (this.isClient) { }}
          <td>
            <input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
            <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label>
          </td>
          {{ }                     }}
          <td colspan="50">
            <input type="text" id="chatMessageInput" value="" data-mini="true" />
          </td>
          <td>
            <button id="chatSendBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true">{{= loc('send') }}</button>
          </td>
        </tr>
      </table-->
      <div class="floatleft">
        <button id="chatCaptureBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-camera"></i></button>
      </div>
      {{ if (this.isAgent) { }}
      <div class="floatleft">
        <button id="chatReqLocBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-eye-open"></i></button>
      </div>
      {{ }                     }}
      {{ if (this.isClient) { }}
      <div class="floatleft" style="padding-top:0px">
        <!--input type="radio" id="chatShareLocBtn" value="off" data-mini="true" />
        <label for="chatShareLocBtn"><i class="ui-icon-map-marker"></i></label-->
        <button id="chatShareLocBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true"><i class="ui-icon-map-marker"></i></button>
      </div>  
      {{ }                     }}
      <div class="floatleft" style="width:40%">
        <input type="text" id="chatMessageInput" class="miniinputheight" value="" data-mini="true" />
      </div>  
      <div class="floatleft">
        <button id="chatSendBtn" data-theme="{{= G.theme.activeButton }}" data-mini="true">{{= loc('send') }}</button>
      </div>
    </div>
    
    <!--div data-role="footer" data-position="fixed" data-theme="{{= G.theme.header }}">
      <div id="chatInputs" style="padding:0 0 0 5px;">
        <div style="width:10%; margin: 2px 5px 0 0; float:left"><button id="chatCaptureBtn" data-theme="{{= G.theme.activeButton }}" data-icon="camera" data-iconpos="notext">{{= loc('capture') }}</button></div>
        <div style="width:65%; float:left"><input type="text" id="chatMessageInput" value="" /></div>
        <div style="width:20%; padding-right:5px; margin-top: 2px; float:right"><button id="chatSendBtn" class="submit" type="submit" data-theme="{{= G.theme.activeButton }}">{{= loc('send') }}</button></div>
      </div>
    </div-->
  {{ }                                          }}
  </div>
</script>

<script type="text/template" id="audioPlayerTemplate">
  <audio controls style="padding:20px 0 5px 13px;">
{{    _.each(sources, function(source) { }}      
      <source src="{{= source }}" type="{{= 'audio/' + source.slice(source.lastIndexOf('.') + 1) }}">
      Your browser does not support this audio player
{{    }); }}
  </audio>
</script>

<script type="text/template" id="videoPlayerTemplate">
  <video controls="true" {{= _.has(obj, 'autoplay') ? "autoplay='{0}'".format(autoplay) : '' }} preload="{{= obj.preload ? preload : 'metadata' }}" 
  {{= obj.width ? " width='{0}'.format(width)" : '' }}
  {{= obj.height ? " height='{0}'.format(height)" : '' }}
  {{ if (obj.poster) {               }}
  {{= " poster='{0}'".format(poster) }}
  {{ }                               }}
  >
    <source src="{{= src }}" type="{{= 'video/' + src.slice(src.lastIndexOf('.') + 1) }}" />
  </video>
</script>

<script type="text/template" id="menuP">
  <!-- Left-side slide-out menu panel -->
  <ul data-role="none" data-theme="{{= G.theme.menu }}" id="menuItems" class="menuItems">
  </ul>
</script>  

<script type="text/template" id="rightMenuP">
  <!-- Right-side slide-out menu panel -->
  <ul data-role="none" data-theme="{{= G.theme.menu }}" id="rightMenuItems" class="menuItems">
  </ul>
</script>  

<script type="text/template" id="stringPT">
  <!-- Left-side slide-out menu panel -->
  {{ if (typeof value != 'undefined' && value.indexOf('<span') == -1) { }}
     <span style="white-space: normal;opacity:0.5;">{{= value }}</span>
  {{ } }}
  {{ if (typeof value != 'undefined' && value.indexOf('<span') != -1) { }}
    {{= value }}
  {{ } }}
</script>
  
<script type="text/template" id="longStringPT">
  {{ if (typeof value != 'undefined' && value.indexOf('<span') == -1) { }}
     <span style="white-space: normal; color: #777;">{{= value }}</span>
  {{ } }}
  {{ if (typeof value != 'undefined' && value.indexOf('<span') != -1) { }}
    {{= value }}
  {{ } }}
</script>

<script type="text/template" id="emailPT">
  <a href="mailto:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="UrlPT">
  <a href="{{= value.href }}">{{= value.linkText }}</a>
</script>

<script type="text/template" id="telPT">
  <a href="tel:{{= value }}">{{= value }}</a>
</script>

<script type="text/template" id="datePT">
  <span>{{= G.U.getFormattedDate(value) }}</span>
</script>

<script type="text/template" id="durationPT">
  <span>{{= typeof displayName !== 'undefined' ? displayName : G.U.getFormattedDuration(value) }}</span>
</script>

<!--script type="text/template" id="datePT">
    <span>{{= new Date(value / 1000) }}</span>
</script -->

<script type="text/template" id="booleanPT">
  <span>{{= loc(typeof value === 'undefined' || !value ? 'no' : 'yes') }}</span>
</script>

<script type="text/template" id="intPT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="floatPT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="doublePT">
  <span>{{= value }}</span>
</script>

<script type="text/template" id="moneyPT">
  <span>{{= (typeof value.currency === 'undefined' ? '$' : value.currency) + (typeof value.value === 'undefined' ? (typeof value === 'number' ? value : 0) : value.value) }}</span>
</script>

<!--script type="text/template" id="durationPT">
  <span>{{= typeof displayName != 'undefined' ? displayName : G.U.getFormattedDate(value) }}</span>
</script-->

<script type="text/template" id="complexDatePT">
  <span>{{= typeof displayName != 'undefined' ? displayName : (U.isCloneOf(prop, 'ScheduledItem.start')  || U.isCloneOf(prop, 'ScheduledItem.end') ? G.U.getFormattedDate1(value) :  G.U.getFormattedDate(value)) }}</span>
</script>

<script type="text/template" id="resourcePT">
  <span><a style="text-decoration:none" href="{{= U.makePageUrl('view', value) }}">{{= typeof displayName == 'undefined' ? value : displayName }}</a></span>
</script>

<!--script type="text/template" id="mapItemTemplate">
<span><a href="{{= U.makePageUrl('view', value) }}">{{= typeof displayName == 'undefined' ? value : displayName }} {{= image ? '<br />' + image : '' }} </a></span>
</script-->

<script type="text/template" id="mapItemTemplate">
  <!-- one map popup -->
  <ul style="list-style-type:none">
    <li><span><a href="{{= U.makePageUrl('view', uri) }}"> {{= resourceLink }} </a></span></li>
    {{ _.forEach(rows, function(val, key) { }} 
      <li>{{= key }}: {{= val.value }}</li>
    {{ }); }}
    {{ if (typeof image != 'undefined') { }}
    <span><a href="{{= U.makePageUrl('view', uri) }}"> {{= image ? '<br />' + image : '' }} </a></span>
    {{ } }}
  </ul>
</script>

<script type="text/template" id="imagePT">
  <img src="{{= value }}"></img>
</script>


<script type="text/template" id="editListItemTemplate">
  <!-- one row of a list in edit mode -->
  <input data-formEl="true" name="{{= _uri + '.$.' + editProp }}" value="{{= editPropValue }}" /> 
  {{= viewCols }}
</script>


<script type="text/template" id="listItemTemplate">
  <!-- one row on a list page -->
  {{ var action = action ? action : 'view' }}
  <div class="ui-btn-inner ui-li ui-li-has-thumb" style="cursor:pointer;">
  {{ if (typeof v_submitToTournament == 'undefined') { }}
    <div class="ui-btn-text" style="padding:.7em 10px 10px 90px;min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri) }}">
  {{ } }}
  {{ if (typeof v_submitToTournament != 'undefined') { }}
    <div class="ui-btn-text" style="padding:.7em 10px 0 90px; min-height:59px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
  {{ } }}
    <img src="{{= typeof image != 'undefined' ? (image.indexOf('/Image') == 0 ? image.slice(6) : image) : 'icons/blank.png'}}" 
    {{ if (typeof obj.width != 'undefined') { }}  
      style="
        height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
    {{ } }}
    class="ui-li-thumb" /></i> 
    {{= viewCols }}
  </div>
  </div>
  <!--
  {{ if (this.resource.isA('Buyable')  &&  price  &&  price.value) { }}
   <div class="buyButton" id="{{= G.nextId() }}" data-role="button" style="margin-top:15px;" data-icon="shopping-cart" data-iconpos="right" data-mini="true">
     {{ if (typeof price == 'object') { }} 
       {{= price.currency + price.value }}
       {{= price.value < 10 ? '&nbsp;&nbsp;&nbsp;' : price.value < 100 ? '&nbsp;&nbsp;' : price.value < 1000 ? '&nbsp;' : ''}}
     {{ } }}
     {{ if (typeof price != 'object') { }} 
       {{= 'U$' + price }}
       {{= price < 10 ? '&nbsp;&nbsp;&nbsp;' : price < 100 ? '&nbsp;&nbsp;' : price < 1000 ? '&nbsp;' : ''}}
     {{ } }}
   </div>
  {{ } }}
  {{= obj.showCount ? '<span class="ui-li-count">' + obj[showCount].count + '</span>' : '' }} 
  -->  
  {{ if (typeof distance != 'undefined') { }}
    <span class="ui-li-count">{{= Math.round(distance * 100) /100  + ' ' + distanceUnits }}</span>
  {{ } }}
  <!--
  {{ if (typeof v_submitToTournament != 'undefined') { }}
    <a class="b" href="{{= v_submitToTournament.uri }}" data-role="button" data-icon="star" data-theme="e" data-iconpos="notext">Submit to {{= v_submitToTournament.name }}</a>
  {{ } }}
  -->
</script>

<script type="text/template" id="listItemTemplateNoImage">
  <!-- one row on a list page (no image) -->
  <div class="ui-btn-inner ui-li" style="border:none; padding:10px; cursor:pointer;">
  {{ var isJst = this.vocModel.type === G.commonTypes.Jst; }}
  {{ if (!obj.v_submitToTournament) { }}  
    <div class="ui-btn-text"
    {{ if (isJst) { }}
      style="padding: .7em 10px 10px 0px;"
    {{ } }}
    {{ if (!isJst  &&  obj._hasSubmittedBy) { }}
      style="min-height:59px;"
    {{ } }}
    <!--
    {{ if (!isJst  &&  !obj._hasSubmittedBy) { }}
      style="min-height:39px;"
    {{ } }}
    -->
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    style="padding:.7em 10px 10px 0px;min-height:39px;"
  {{ } }}
  >
   <!-- data-uri="{{= liUri }}" -->
  {{= viewCols }}
  {{ if (U.isAssignableFrom(this.vocModel, 'model/study/QuizQuestion')  &&  obj.alreadyAnsweredByMe) { }}
    <div style="position:relative;float:right;margin-right:10px;"><i class="ui-icon-check" style="font-size:25px;color:red;"></i></div>
  {{ } }}
  
  {{ if (this.resource.isA('Buyable')  &&  price  &&  price.value) { }}
   <div class="buyButton" id="{{= G.nextId() }}" data-role="button" style="margin-top:15px;" data-icon="shopping-cart" data-iconpos="right" data-mini="true">
     {{= price.currency + price.value }}
     {{= price.value < 10 ? '&nbsp;&nbsp;&nbsp;' : price.value < 100 ? '&nbsp;&nbsp;' : price.value < 1000 ? '&nbsp;' : ''}}
   </div>
  {{ } }}  
  {{ if (U.isA(this.vocModel, 'Distance')  &&  obj.distance) { }}
    <span class="ui-li-count">{{= distance + ' mi' }}</span>
  {{ } }}
  {{= obj.showCount ? '<span class="ui-li-count">' + obj[showCount].count + '</span>' : '' }} 
  <!--
  {{ if (typeof v_submitToTournament != 'undefined') { }}
    <a href="{{= v_submitToTournament.uri }}" data-role="button" data-icon="plus" data-theme="e" data-iconpos="notext"></a>
  {{ } }}
  -->  
  
  {{ if (obj.comment) { }}
    <p>{{= comment }}</p>
  {{ } }}
  </div>
  </div>
</script>

<script type="text/template" id="listItemTemplateNoImage1">
  <!-- one row on a list page (no image) -->
  <div class="ui-btn-inner ui-li" style="border:none; padding:10px; cursor:pointer;">
  {{ var action = action ? action : 'view'; }}
  {{ var detached = this.resource.detached; }}
  {{ var isJst = this.vocModel.type === G.commonTypes.Jst; }}
  {{ if (!obj.v_submitToTournament) { }}  
    {{ if (isJst) { }}
      <div class="ui-btn-text" style="padding: .7em 10px 10px 0px;min-height:39px;" data-uri="{{= U.makePageUrl(detached ? 'make' : 'edit', detached ? this.vocModel.type : _uri, detached && {templateName: templateName, modelDavClassUri: modelDavClassUri, forResource: G.currentApp._uri, $title: $title}) }}">
    {{ } }}
    {{ if (!isJst) { }}
      <div class="ui-btn-text" style="min-height:39px;" data-uri="{{= U.makePageUrl(action, _uri) }}">
    {{ } }}
  {{ } }}
  {{ if (obj.v_submitToTournament) { }}
    <div class="ui-btn-text" style="padding:.7em 10px 10px 0px;min-height:39px;" data-uri="{{= U.makePageUrl(action, _uri, {'-tournament': v_submitToTournament.uri, '-tournamentName': v_submitToTournament.name}) }}">
  {{ } }}
  
  {{= viewCols }}
  </div>
  {{ if (this.resource.isA('Buyable')  &&  price  &&  price.value) { }}
   <div class="buyButton" id="{{= G.nextId() }}" data-role="button" style="margin-top:15px;" data-icon="shopping-cart" data-iconpos="right" data-mini="true">
     {{= price.currency + price.value }}
     {{= price.value < 10 ? '&nbsp;&nbsp;&nbsp;' : price.value < 100 ? '&nbsp;&nbsp;' : price.value < 1000 ? '&nbsp;' : ''}}
   </div>
  {{ } }}  
  {{ if (U.isA(this.vocModel, 'Distance')  &&  obj.distance) { }}
    <span class="ui-li-count">{{= distance + ' mi' }}</span>
  {{ } }}
  <!--
  {{ if (typeof v_submitToTournament != 'undefined') { }}
    <a href="{{= v_submitToTournament.uri }}" data-role="button" data-icon="plus" data-theme="e" data-iconpos="notext"></a>
  {{ } }}
  -->  
  
  {{ if (obj.comment) { }}
    <p style="padding-left: 15px;">{{= comment }}</p>
  {{ } }}
  </div>
</script>

  <!-- one item on the left-side slide-out menu panel -->
<!--script type="text/template" id="menuItemTemplate">
  <li {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }}>
    <img src="{{= obj.image ? image : 'icons/blank.png'}}" class="ui-li-thumb" /> 
    <a {{= obj.image ? 'style="margin-left:35px;"' : '' }} id="{{= typeof id === 'undefined' ? G.nextId() : id}}" link="{{= obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl }}">
      {{= title }}
    </a>
  </li>
</script -->

<script type="text/template" id="menuItemTemplate">
  <!-- one item on the left-side slide-out menu panel -->
  <li style="cursor: pointer;min-height: 42px; {{= obj.image ? 'padding-top: 0;padding-right:0px;padding-bottom: 7px;' : 'padding-bottom:0px; margin-bottom:-10px;' }}"  id="{{= obj.id ? obj.id : G.nextId() }}" {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} 
      {{= (obj.mobileUrl || obj.pageUrl) ? ' data-href="' + (obj.mobileUrl ? G.pageRoot + '#' + mobileUrl : pageUrl) + '"' : '' }} >
    
    <!-- {{ if (!obj.homePage) { }} -->   
    <img src="{{= obj.image ? image : 'icons/blank.png'}}" class="thumb" 
    {{ if (typeof obj.width != 'undefined'  &&  obj.width.length) { }}  
      style="
        width:{{= width }}px; height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
    {{ } }}
    /> 
    <!-- {{ } }} -->
    <div class="gradientEllipsis" style="min-height:38px;max-width:100%;font-size:18px;margin-left:15px;float:left;{{= obj.image ? 'padding-top:10px;' : '' }}" 
      {{ if (obj.data) {                              }}
      {{   for (var d in data) {                      }}
      {{=    ' data-{0}="{1}"'.format(d, data[d])     }}
      {{   }                                          }}
      {{ }                                            }}
    >
    
    {{ if (obj.icon  &&  obj.homePage) { }}
      <i class="ui-icon-{{= icon }}" style="float-left; font-size: 20px; padding-right: 5px;"></i>
    {{ }               }}
      {{= title }}
      {{= obj.image || title.length < 20 ? '' : '<div class="dimmer">' }}
    </div>
    
    {{ if (obj.icon  &&  !obj.homePage) { }}
      <i class="ui-icon-{{= icon }}" style="float:right; font-size: 16px;"></i>
    {{ }               }}
  </li>
</script>

<script type="text/template" id="menuItemNewAlertsTemplate">
  <!-- Notifications item on the left-side slide-out menu panel -->
  <li style="min-height:30px;cursor:pointer;" {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }} data-href="{{= pageUrl }}">
    <div style="font-size:18px;"  id="{{= typeof id === 'undefined' ? G.nextId() : id}}">
      {{= title }}   <span class="ui-li-count">{{= newAlerts }}</span> 
    </div>
  </li>
</script>

<script type="text/template" id="homeMenuItemTemplate">
  <!-- app home page menu item -->
  <li {{= obj.icon ? 'data-icon="' + icon + '"' : ''}} {{= typeof cssClass == 'undefined' ? '' : ' class="' + cssClass + '"' }}  id="{{= typeof id == 'undefined' ? 'home123' : id }}">
    <img style="float: right;" src="{{= typeof image != 'undefined' ? image : 'icons/blank.png'}}" class="ui-li-thumb" /> 
    <a {{= typeof image != 'undefined' ? 'style="margin-left:35px;"' : '' }} target="#">
      {{= title }}
    </a>
  </li>
</script>

<script type="text/template" id="menuHeaderTemplate">
  <!-- menu header -->
  <li data-icon="{{= icon }}" data-theme="{{= G.theme.menu}}" {{= obj.cssClass ? ' class="' + cssClass + '"' : '' }} style="font-size:18px;font-weight: normal;">
    {{= title }}
  </li>
</script>

<script type="text/template" id="propRowTemplate">
  <!-- wrapper for one row on a list page (short) -->
  <li data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="float: right; font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="inlineListItemTemplate">
<!-- one row of an inline backlink in view mode -->
<li data-icon="false">
  <i class="icon-home"></i>
  
  <a href="{{= _uri }}" {{= obj._problematic ? 'class="problematic"' : '' }}>{{= name }} {{= obj.gridCols ? '<br/>' + gridCols : '' }}
    {{ if (obj.img) { }}
      <img src="{{= img.indexOf('/Image') == 0 ? img.slice(6) : img }}" 
      {{ if (obj.width) { }}  
      style="max-height:none;max-width:none;
        height:{{= height }}px;
        left:-{{= left }}px; top:-{{= top }}px;
        clip:rect({{= top }}px, {{= right }}px, {{= bottom }}px, {{= left }}px);"
      {{ } }}
      
      />
    {{ } }}
  </a>
  {{ if (typeof comment != 'undefined') { }}
    <p style="padding-left: 15px;">{{= comment }}</p>
  {{ } }}
  </a>
</li>
</script>

<script type="text/template" id="cpTemplate">
<!-- readwrite backlink in resource view -->
<li data-propName="{{= shortName }}"
{{= obj.inline ? ' data-theme="{0}">'.format(G.theme.footer) : '' }}
>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a href="#" data-shortName="{{= shortName }}" data-title="{{= title }}" class="cp" data-icon="plus-sign" data-theme="{{= G.theme.list }}">
     {{ if (typeof comment != 'undefined') { }}
       <p style="padding-left: 15px;">{{= comment }}</p>
     {{ } }}
     </a>
   </li>
</script>

<script type="text/template" id="priceTemplate">
   <div data-role="button" data-shortName="{{= shortName }}" style="cursor: pointer;text-align:left; background:none; background-color: {{= color }}" href="#">
     {{= name }}<br/> 
     <span style="font-size: 20px;cursor:pointer;">{{= shortName == 'discount' ? '' : '$' }}{{= value }}{{= shortName == 'discount' ? '%' : '' }}</span>
   </div>
</script>

<script type="text/template" id="buyTemplate">
<!-- button for an important buyable resource on the resource's view page -->
<div>
   <a data-role="button" id="buy" data-ajax="false" class="ui-li-has-count" style="text-align:left; background:none; background-color: {{= color }}" href="{{= buyUrl }}">
      <span style="float:right;padding-left:3px;">Buy for<br/><span style="font-size: 20px;"> ${{= value }}</span></span><i class="ui-icon-shopping-cart" style="color:red; margin-left: -10px; font-size:35px;top:35%;"></i>
   </a>
</div>   
</script>

<script type="text/template" id="sellTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
<div>
   <a data-role="button" id="sell" data-ajax="false" class="ui-li-has-count" style="text-align:left; background:none;  padding: 6px 0;background-color: {{= background }}; color: {{= color }};" href="#">
      <span style="font-size: 24px; border: none;">Sell</span>
   </a>
</div>   
</script>

<script type="text/template" id="cpMainGroupTemplate">
<!-- button for an important backlink on a resource on the resource's view page -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!value  &&  !chat) { }}  
   <a data-role="button" data-shadow="false" data-shortName="{{= shortName }}" data-title="{{= title }}" style="text-align:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; border:1px solid {{= borderColor }}; background-color: {{= color }}" href="#">
     <span style="font-size: 18px;"><i class="{{= icon }}" style="right: -20px;"></i>&#160;{{= name }}</span>
   </a>
 {{ } }}
 {{ if (obj.value != 'undefined' || chat) { }}  
   <a data-role="button" data-shadow="false" data-propName="{{= shortName }}" data-ajax="false" class="ui-li-has-count" style="text-align:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; border:1px solid {{= borderColor }}; background-color: {{= color }}" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <span style="font-size: 18px;"><i class="{{= icon }}" style="right: -20px; top:35%"></i>&#160;{{= name }}</span>{{= obj.value ? '<span style="float: right;position:relative;margin: -17px;" class="ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span>' :  ''  }}


   </a>
 {{ } }}
</script>

<script type="text/template" id="cpMainGroupTemplateH">
<!-- button for an important backlink on a resource on the resource's view page (horizontal mode) -->
 {{ var params = {}; }}
 {{ params[backlink] = _uri; }}
 {{ if (!value) { }}  
   <a data-role="button" data-shadow="false" data-shortName="{{= shortName }}" data-title="{{= title }}" style="text-align:left; border: 1px solid #ccc; min-width:115px; float:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="#">
       <span style="font-size: 18px;">{{= obj.icon ? '<i class="' + icon + '" style="margin-left:-5px;"></i>' : '' }} {{= name }}</span> 
   </a>
 {{ } }}
 {{ if (typeof value != 'undefined') { }}  
   <a data-role="button" data-shadow="false" data-propName="{{= shortName }}" data-ajax="false" class="ui-li-has-count" style="text-align:left; border: 1px solid #ccc; min-width:115px;float:left; background:none; text-shadow:0 1px 0 {{= borderColor }}; background-color: {{= color }}; border:1px solid {{= borderColor }};" href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">
     <!-- {{= obj.icon ? '<i class="' + icon + '" style="font-size:20px;top:35%"></i>' : '' }} -->
     <span style="font-size: 18px;">{{= obj.icon ? '<i class="ui-icon-star" style="font-size:20px;top:35%"></i>' : '' }} {{= name }}{{= value != 0 ? '<span style="float: right;position:relative;margin: -17px;" class="ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span>' : ''  }}</span>
   </a>
 {{ } }}
</script>

<script type="text/template" id="cpTemplateNoAdd">
<!-- readonly backlink in resource view -->
<li data-propName="{{= shortName }}"
  {{= obj.inline ? ' data-theme="{0}">'.format(G.theme.activeButton) : '' }}
>
     {{ var params = {}; }}
     {{ params[backlink] = _uri; }}
     <a href="{{= U.makePageUrl('list', range, _.extend(params, {'$title': title})) }}">{{= name }}<span class="ui-li-count">{{= value }}</span></a><a target="#" data-theme="{{= G.theme.list }}" data-icon="chevron-right" data-iconshadow="false" class="cp"></a>
   </li>
</script>

<script type="text/template" id="propRowTemplate2">
  <!-- wrapper for one row on a list page (long) -->
  <li data-shortname="{{= shortName }}" {{= obj.rules || '' }}>{{= name }}<div style="font-weight: normal;">{{= value }}</div></li>
</script>

<script type="text/template" id="propGroupsDividerTemplate">
  <!-- row divider / property group header in resource view -->
  <li data-theme="{{= G.theme.list }}" data-role="list-divider">{{= value }}</li>
</script>

<!--script type="text/template" id="viewTemplate">
  <div>
    {{ for (var name in props) { }} 
      {{ if (props.hasOwnProperty(name)) { }}
        <div class="propRow">{{ name }}: {{ props[name] }}</div>
      {{ } }}
    {{ } }}
  </div>
</script-->

<!--script type="text/template" id="editButtonTemplate">
  <a id="edit" target="#" class="icon next ui-btn-right">Edit</a>
</script-->

<script type="text/template" id="mapItButtonTemplate">
  <!-- button that toggles map view -->
  <a id="mapIt" target="#" data-icon="map-marker">Map It</a>
</script>

<script type="text/template" id="mapTemplate">
  <!-- map holder -->
  <div id="map" class="map" data-role="none"></div>
</script>

<script type="text/template" id="backButtonTemplate">
  <!-- The UI back button (not the built-in browser one) -->
  <a target="#" data-icon="chevron-left" class="back">Back</a>
</script>

<script type="text/template" id="chatButtonTemplate">
  <!-- Button that opens up a chat page -->
  <a href="{{= url || '#' }}" data-icon="comments-alt">Chat
    {{= '<span class="menuBadge">{0}</span>'.format(obj.unreadMessages || '') }}
  </a>
</script>

<script type="text/template" id="videoButtonTemplate">
  <!-- Button that toggles video chat -->
  <a target="#" data-icon="facetime-video">Video</a>
</script>

<script type="text/template" id="addButtonTemplate">
  <!-- button used for creating new resources -->
  <a target="#" data-icon="plus-sign" {{= obj.empty ? 'class="hint--bottom hint--always" data-hint="Add item"' : '' }}>Create</a>
  <!-- a target="#" data-icon="plus-sign" class="hint--bottom hint--always" data-hint="Add item">Create</a -->
</script>

<script type="text/template" id="menuButtonTemplate">
  <!-- button that toggles the menu panel -->
  <a target="#" href="#{{= viewId }}" data-icon="reorder">Menu
    {{= '<span class="menuBadge">{0}</span>'.format(obj.newAlerts || '') }}
  </a>
</script>

<script type="text/template" id="rightMenuButtonTemplate">
  <!-- button that toggles the object properties panel -->
  <a target="#" href="#{{= viewId }}" data-icon="indent-right">{{= (obj.title ? title : 'Properties') + '<span class="menuBadge">{0}</span>'.format(obj.count || '') }}
  </a>
</script>

<script type="text/template" id="loginButtonTemplate">
  <!-- button that summons the login popup -->
  <a target="#" data-icon="signin">{{= loc('signIn') }}</a>
</script>

<script type="text/template" id="buyPopupTemplate">
  <!-- popup for trial / purchase -->
  <div id="buy_popup" style="text-align: center; background: #eeeeee;" data-role="popup" data-transition="slidedown" data-overlay-theme="{{= G.theme.menu }}" class="ui-content">
    <!-- a href="#" data-rel="back" data-role="button" data-theme="{{= G.theme.activeButton }}" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a -->
    <div data-theme="c" role="main">
      <h4 id="buyMsg">{{= msg }}</h4>
      <a data-mini="true" data-role="button"  data-inline="true" id="buyLink" href="{{= href }}">{{= loc('buy') }}<span style="display:none;" id="buyName">{{= displayName }}</span></a> 
      <a data-mini="true" data-role="button"  data-inline="true" id="tryLink" href="{{= href }}">{{= loc('try') }}<span style="display:none;" id="buyName">{{= displayName }}</span></a> 
      <a data-mini="true" data-role="button"  data-inline="true" id="cancel" data-rel="back">{{= loc('cancel') }}</a> 
    </div>
  </div>
</script>

<script type="text/template" id="loginPopupTemplate">
  <!-- login popup with various social network based logins -->
  {{ var canDismiss = typeof dismissible === 'undefined' || dismissible == true; }}
  <div id="login_popup" data-role="popup" data-transition="slidedown" data-overlay-theme="{{= G.theme.menu }}" data-dismissible="false" class="ui-content">
    <h4 style="color: #aaa" id="loginMsg">{{= msg }}</h4>
    <a href="#" data-cancel="cancel" data-rel="back" data-role="button" data-theme="{{= G.theme.menu }}" data-icon="delete" data-iconpos="notext" class="ui-btn-right"></a>
    
    {{ _.forEach(nets, function(net) { }} 

    <a data-role="button" href="{{= net.url }}" {{= net.name == 'Facebook' ? ' target="_top"' : '' }}>
        <span class="big_symbol 
      {{ if(net.name == "Facebook") { }} ui-icon-facebook-sign {{ } }}
      {{ if(net.name == "Google") { }} ui-icon-google-plus-sign {{ } }}
      {{ if(net.name == "Twitter") { }} ui-icon-twitter-sign {{ } }}
      {{ if(net.name == "LinkedIn") { }} ui-icon-linkedin-sign {{ } }}
      {{ if(net.name == "Live") { }} ui-icon-live-sign {{ } }}
        ">
       </span>
     {{= net.name }}
    </a>

    {{ }); }}

    <!--h5>Login by Email</h5>
    <form id="loginForm" action="j_security_check" method="POST" onsubmit="return hash(this, 'j_security_check')" autocomplete="off">
      <table>
        <tr><td>Email: </td><td><input name="j_username" /></td></tr>
        <tr><td>Password: </td><td><input type="password" name="j_password" /></td></tr>
        <tr><td colspan="2"><input type="submit" value="Submit" /></td></tr>
      </table>
    </form-->
  </div>
</script>

<script type="text/template" id="socialConnectButtonTemplate">
  <li id="login">   
    <a target="#" data-icon="signin"></a>
  </li>
</script>

<script type="text/template" id="logoutButtonTemplate">
  <li id="logout">
    <a id="logout" target="#" data-icon="signout">{{= loc('signOut') }}</a>
  </li>
</script>

<!--script type="text/template" id="aroundMeButtonTemplate">
  <!-- button for toggling ordering of results by geo-promixity to the user -->
  <a target="#" data-icon="map-marker">{{= loc('aroundMe') }}</a>
</script-->

<script type="text/template" id="publishBtnTemplate">
  <!-- button to (re-)publish an app, i.e. a glorified 'Save App' button -->
  <a target="#" data-icon="book" id="publish" data-role="button" data-position="notext">{{= loc(wasPublished ? 'appChangedClickToRepublish' : 'publishAppWhenDone') }}</a>
</script>

<script type="text/template" id="resetTemplateBtnTemplate">
<!-- button to reset a template to its default value -->
<a target="#" data-icon="retweet" id="resetTemplate" data-role="button" data-position="notext" data-mini="true">{{= loc('resetToDefault') }}</a>
</script>

<script type="text/template" id="doTryBtnTemplate">
  <!-- button that spirits you away to go try a particular app -->
  <a target="#" data-icon="circle-arrow-up" id="doTry" data-role="button" data-position="notext">{{= loc('gotoApp') }}</a>
</script>

<script type="text/template" id="installAppBtnTemplate">
  <!-- button that installs a given app when clicked -->
  <a target="#" data-icon="plus-sign" id="installApp" data-role="button" data-position="notext" style="background:#0F0;color:#FFF">{{= loc('install') }}</a>
</script>

<script type="text/template" id="forkMeBtnTemplate">
  <!-- a la Github's Fork It button, let's you clone an existing app -->
  <a target="#" data-icon="copy" id="forkMe" data-role="button" data-position="notext">{{= loc('forkMe') }}</a>
</script>

<script type="text/template" id="enterTournamentBtnTemplate">
  <!-- button that will enter the user into a tournament -->
  <a target="#" data-icon="star" id="enterTournament" data-theme="e" data-role="button" data-position="notext">{{= loc('enterData') + ': ' + name }}</a>
</script>

<script type="text/template" id="testPlugBtnTemplate">
  <!-- button that allows you to test a script connecting two apps -->
  <a target="#" data-icon="bolt" id="testPlug" data-role="button" data-position="notext">{{= loc('testThisPlug') }}</a>
</script>

<script type="text/template" id="callInProgressHeaderTemplate1">
  <div id="backToCall" style="display:inline" width="99%">
    <a href="{{= url }}" data-role="none" style="font-size:20px">{{= {{= title }}</a>
  </div>
  <div id="sendToCall" style="display:inline;" width="1%">
    <!--a href="#" data-role="button" data-icon="upload" data-iconpos="notext">Send link to call</a-->
    <a href="#" data-role="none"><i class="ui-icon-upload" style="font-size:24px;padding-left:10px;"></i></a>
  </div>
</script>

<script type="text/template" id="callInProgressHeaderTemplate">
  <div class="ui-grid-d mygrid">
    <div class="ui-block-a" id="backToCall"><button data-icon="phone" data-iconpos="notext" data-inline="true" data-mini="true" style="background:#0f2">{{= loc('backToCall') }}</button></div>
    <div class="ui-block-b"></div>
    <div class="ui-block-c" id="sendToCall" style="text-align:center"><button data-icon="arrow-up" data-iconpos="notext" data-inline="true" data-mini="true">{{= loc('sendToCall') }}</button></div>
    <div class="ui-block-d"></div>
    <div class="ui-block-e" id="hangUp" style="text-align:right"><button data-icon="phone" data-iconpos="notext" data-inline="true" data-mini="true" style="background:#f02">{{= loc('hangUp') }}</button></div>
  </div>
</script>

<script type="text/template" id="callInProgressHeaderTemplate2">
  <ul data-role="listview" data-inset="true">
    <li id="backToCall" width="99%">
      <a href="{{= url }}" data-role="button" data-iconpos="notext" data-icon="phone">{{= title }}</a>
    </li>
    <li id="callFunctions">
      <a href="#" id="sendToCall" data-role="none" data-iconpos="notext" data-icon="upload" data-role="button">{{= loc('sendToCall') }}</a>
    </li>
  </ul>
</script>

<script type="text/template" id="headerTemplate">
  <!-- the page header, including buttons and the page title, used for all pages except the home page -->
  <div id="callInProgress" data-theme="{{= G.theme.header}}"></div>
  <div data-role="header" class="ui-header" data-theme="{{= G.theme.header}}" id="header" {{= obj.style ? style + ';z-index:1000;': 'style="z-index:1000;"' }} {{= obj.more || '' }} >
    <div data-role="navbar">
      <ul id="headerUl" class="navbarUl">
      </ul>
    </div>
    {{= this.categories ? '<div style="margin:0px 0 0 3px; float:left"><a data-role="button" data-iconpos="notext" data-icon="tags" id="categories" href="#"></a></div>' : '' }} 
<!--    {{= this.categories ? '<div style="padding:5px 10px; float:left"><a id="categories" href="#"><i class="ui-icon-tags" style="margin-top:4px; font-size:20px;"></i></a></div>' : '' }} -->

    {{= this.moreRanges ? '<div style="margin:0px 0 0 3px; float:left"><a data-role="button" data-icon="tags" id="moreRanges" data-mini="true" href="#">' + this.moreRangesTitle + '</a></div>' : '' }}
<!--    {{= U.isAssignableFrom(this.vocModel, G.commonTypes.App) && (typeof this.resource == 'undefined') ? '<div style="margin:0px 0 0 3px; float:left"><a data-role="button" data-icon="tags" id="categories" data-mini="true" href="#">Categories</a></div>' : '' }} -->
    <div id="name" class="resTitle" {{= this.categories ? 'style="width: 95%;"' : 'style="min-height: 20px"' }} align="center">
      <h4 id="pageTitle" style="font-weight:normal;">{{= this.title }}</h4>
      <div align="center" {{= obj.className ? 'class="' + className + '"' : '' }} style="margin-top: -7px;" id="headerButtons">
        <div style="max-width:200px; display: inline-block;" id="doTryBtn"  class="{{= obj.className ? 'ui-block-a' : '' }}">
          {{ if (obj.tryApp) { }}
              {{= tryApp }}
          {{ } }}
        </div>
        <div style="max-width:200px; display: inline-block;" id="forkMeBtn"  class="{{= obj.className ? 'ui-block-b' : '' }}">
          {{ if (obj.forkMeApp) { }}
              {{= forkMeApp }}
          {{ } }}
        </div>
        <div style="max-width:400px;" id="publishBtn" class="headerSpecialBtn">
          {{ if (obj.publishApp) { }}
              {{= publish }}
          {{ } }}
        </div>
        <div style="max-width:200px;" id="testPlugBtn" class="headerSpecialBtn">
          {{ if (obj.testPlug) { }}
              {{= testPlug }}
          {{ } }}
        </div>
        <div style="max-width:200px;" id="installAppBtn"  class="headerSpecialBtn">
          {{ if (obj.installApp) { }}
            {{= installApp }}
          {{ } }}
        </div>
        <div style="max-width:320px;" id="enterTournamentBtn" class="headerSpecialBtn">
          {{ if (obj.enterTournament) { }}
              {{= enterTournament }}
          {{ } }}
        </div>
        <div style="max-width:320px;" id="resetTemplateBtn" class="headerSpecialBtn">
          {{ if (obj.resetTemplate) { }}
              {{= resetTemplate }}
          {{ } }}
        </div>
      </div>
    </div>
    <!--div id="headerErrorBar">
    </div-->
  </div>
</script>

<script type="text/template" id="messageBarTemplate">
  <div class="headerMessageBar {{= obj['class'] || '' }}">
    <h3 id="{{= obj.id || 'messageBar' + G.nextId() }}">
      {{ if (obj.icon) { }}
        <i class="{{= 'ui-icon-' + icon}}"></i>
      {{ }               }}
      
      {{= message }}      
    </h3>
  </div>
</script>

<script type="text/template" id="headerErrorBar">
  <div style="{{= obj.style || '' }}">
  {{= obj.info ? '<h3 id="headerInfo"><i class="ui-icon-' + (obj.icon || 'warning-sign') + '"></i> ' + info + '</h3>' : '' }}
  {{= obj.error ? '<h3 id="headerError">' + (obj.withIcon ? '<i class="ui-icon-ban-circle"></i>' : '') + error + '</h3>' : ''}}
  </div>
</script>

<script type="text/template" id="comment-item">
<td width="1%" valign="top">
  <a href="{{= U.makePageUrl('view', submitter) }}">
    <img src="{{= obj['submitter.thumb'] }}" />
  </a>
</td>
<td width="99%" class="cl" valign="top">
  <span class="commentListDate" style="float:right;">{{= G.U.getFormattedDate(submitTime, true) }}</span>
  <a href="{{= U.makePageUrl('view', submitter) }}">
    {{= obj['submitter.displayName'] }}
  </a><br/>
  {{= (typeof description == 'undefined') ? title : description }}
  <br/>
  <a href="#" style="font-size: 12px" class="like"><i class="ui-icon-heart-empty"></i></a>
  {{ if (obj.votes) { }} 
    <span>{{= votes.count ? votes.count : '' }}</span>
  {{ } }}
  <a href="#" style="float:right" id="reply">Reply</a>
</td>
</script>

<script type="text/template" id="masonry-mod-list-item">
  <div class="anab">
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img border="0" src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"
        {{ if (typeof imgWidth != 'undefined') { }} 
         style="width: {{= imgWidth }}px; height:{{= imgHeight }}px;"
         {{ } }}
         ></img>
      </a>
    </div>
  </div>
  <table width="100%" class="modP">
    <tr>
      <td class="urbien" width="55px">
        <a href="{{= modifiedBy }}">
          <img border="0" src="{{= typeof v_modifiedByPhoto != 'undefined' ? v_modifiedByPhoto : 'icons/blank.png' }}"></img>
        </a>
      </td>
      <td>
        <span class="action">{{= typeof v_action == 'undefined' ? '' : v_action }}</span>&#160;
        <div id="resourceHolder"><a href="{{= rUri }}" class="pLink">{{= resourceDisplayName }}</a></div>
        <br/><br/>&#160;
        <span class="commentListDate">{{= G.U.getFormattedDate(dateModified) }}</span>
      </td>
    </tr>
  </table>
  <table width="100%">
    <tr>
    <td colspan="2">
      <div class="btn" style="background:#eeeeee; padding: 10px 0 0 5px;margin:-3px;">
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <!--a data-icon="comments" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor, '-makeId': G.nextId()}) }}">
          </a -->
          <a style="float:left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor.uri, '-makeId': G.nextId()}) }}">Comment
          </a>
          {{ if (v_showCommentsFor.count) { }}
            <a style="float:right; font-size:12px;" href="{{= U.makePageUrl('list', 'model/portal/Comment', {forum: v_showCommentsFor.uri}) }} "><span class="ui-icon-comment-alt"></span>{{= v_showCommentsFor.count }}</a>
          {{ } }}
          
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <!--a  data-icon="heart" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}"> 
          </a -->
          <a class="like" style="float: left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}">
          {{ if (typeof v_showCommentsFor != 'undefined') { }}
             &#160;&#160;&#8226;
          {{ } }}
          &#160;&#160;Like 
          </a>
          {{ if (v_showVotesFor.count) { }}
          <div style="float:right; font-size:12px;"> 
            <a href="{{= U.makePageUrl('list', 'aspects/tags/Vote', {votable: v_showVotesFor.uri, $title: davDisplayName + ' liked by'}) }}"><span class="ui-icon-heart-empty"></span>{{= v_showVotesFor.count }}</a> 
          </div>
          {{ } }}
<!--          {{ if (v_showVotesFor.count) { }}
             v_showVotesFor.count
          {{ } }}
-->          
        {{ } }}
        <!--
        {{ if (typeof v_showRenabFor != 'undefined') { }}
          <a data-icon="pushpin" data-iconpos="notext" data-inline="true" data-role="button" data-mini="true" href="{{= 'nabit?originalImageUrl=' + encodeURIComponent(v_showRenabFor) + '&amp;sourceUrl=' + encodeURIComponent(rUri) }}">
          </a>
        {{ } }}
        -->
        </div>
    </td>
    </tr>
  </table>
</script>

<script type="text/template" id="masonry-list-item">
  <!-- a masonry item brick -->
  
  <div class="anab">
  <!--
    {{ if (typeof creatorThumb != 'undefined') { }}
       <div style="padding: 5px; float:left;">
        <a href="{{= typeof creator == 'undefined' ? 'about:blank' : creator }}">
           <img src="{{= creatorThumb }}" height="60" />
        </a>
      </div>
       <div style="padding: 5px; float:left;">
        <a href="{{= typeof creator == 'undefined' ? 'about:blank' : creator }}">
          {{= creatorDisplayName }}
        </a>
        {{= typeof dateSubmitted == 'undefined' ? '' : '<p style="color:#aaa">' + G.U.getFormattedDate(dateSubmitted) + '</p>'}}
      </div>
      
    {{ } }}
   -->
    <div class="galleryItem_css3">
      <a href="{{= typeof rUri == 'undefined' ? 'about:blank' : rUri }}">
        <img  src="{{= typeof resourceMediumImage == 'undefined' ? 'icons/blank.png' : resourceMediumImage }}"
         {{= typeof imgWidth != 'undefined' ? 'style="width:' + imgWidth + 'px; height:' + imgHeight + 'px;"' : '' }}
        ></img>
      </a>
    </div>
    <!-- {{= typeof friendsCount == 'undefined' ? '' : '<div class="appBadge">' + friendsCount + '</div>' }} -->
    {{= typeof friendMeCount == 'undefined' ? '' : '<div class="appBadge"><a style="color:white;" href="' + friendMeUri + '">' + friendMeCount + '</a></div>' }}
  <div class="nabRL">
    <div>
      {{= gridCols }}
    </div>
    {{ if (typeof v_showCommentsFor != 'undefined'  ||  typeof v_showVotesFor != 'undefined' ) { }}
      <div style="background: #eeeeee; padding-top: 10px; padding-bottom: 0px;" class="btn">
        {{ if (typeof v_showCommentsFor != 'undefined') { }}
          <a style="float:left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/model/portal/Comment', {$editCols: 'description', forum: v_showCommentsFor.uri, '-makeId': G.nextId()}) }}">Comment
          </a>
          {{ if (v_showCommentsFor.count) { }}
            <a style="float:right; font-size:12px;" href="{{= U.makePageUrl('list', 'model/portal/Comment', {forum: v_showCommentsFor.uri}) }} "><span class="ui-icon-comment-alt"></span>{{= v_showCommentsFor.count }}</a>
          {{ } }}
        {{ } }}
        {{ if (typeof v_showVotesFor != 'undefined') { }}
          <a class="like" style="float: left" href="{{= U.makePageUrl('make', 'http://www.hudsonfog.com/voc/aspects/tags/Vote', {vote: 'Like', votable: v_showVotesFor.uri, '-makeId': G.nextId()}) }}">
          {{ if (typeof v_showCommentsFor != 'undefined') { }}
             &#160;&#160;&#8226;
          {{ } }}
          &#160;&#160;Like 
          </a>
          {{ if (v_showVotesFor.count) { }}
          <div style="float:right; font-size:12px;"> 
            <a href="{{= U.makePageUrl('list', 'aspects/tags/Vote', {votable: v_showVotesFor.uri, $title: davDisplayName + ' liked by'}) }}"><span class="ui-icon-heart-empty"></span>{{= v_showVotesFor.count }}</a> 
          </div>
          {{ } }}
        {{ } }}
        <!--
        {{ if (typeof tryApp != 'undefined') { }}
            <a href="{{= tryApp }}" style="float:left;">&#160;&#160;&#8226;&#160;&#160;<span style="color:#f54416;">Try</span></a>
        {{ } }}
        -->
     </div>
    {{ } }}
    {{ if (typeof v_submitForTournament != 'undefined') { }}
      <a class="b" href="{{= v_submitForTournament }}" data-role="button" data-icon="star" data-theme="e">Submit an entry</a>
    {{ } }}
  </div>     
        {{= typeof isIdea == 'undefined' ? '' : '<p class="ui-li-aside ui-li-desc">Idea</p>'}}
</div>
</script>


<script type="text/template" id="fileUpload">
  <!-- a file upload form -->
  
  <form data-ajax="false" id="fileUpload" action="#" method="POST" enctype="multipart/form-data">
    <div data-role="fieldcontain">
      <input {{= rules }} type="file" name="{{= name }}" id="file" />
      <input {{= rules }} type="hidden" name="uri" value="{{= forResource }}" />
      <input name="-$action" type="hidden" value="upload" />
      <input name="type" type="hidden" value="{{= type }}" />
      <input name="location" type="hidden" value="{{= G.serverName + '/wf/' + location }}" />
      <input name="$returnUri" type="hidden" value="{{= window.location.href }}" />
    </div>
  </form>
</script>

<script type="text/template" id="photogridTemplate">
  <!-- an image grid with per-image overlays -->

    <ul data-role="listview" data-inset="true" data-filter="false" style="width:100%; list-style-type:none">
    {{ for (var i = 0; i < items.length; i++) { }}
    {{   var item = items[i];                   }}
<!--      <li style="{{= ('float: ' + (item.float || 'left')) + (i > 0 && i < items.length - 1 ? ';margin-left: 13%; margin-right:13%;' : '') }}">    -->
      <li style="{{= ('float: ' + (item.float || 'left')) + (item.width ? ';width:' + item.width : '') + (item.height ? ';height:' + item.height : '') + (item.margin ? ';margin:' + item.margin : '') }}">
        <a href="{{= item.target }}">
          {{= item.image ? '<img src="{0}" />'.format(item.image) : '' }}
          {{= item.title ? '<h3>{0}</h3>'.format(item.title) : '' }}
          {{= item.caption ? '<p>{0}</p>'.format(item.caption) : '' }}
          {{= typeof item.superscript !== 'undefined' ? '<p class="ui-li-aside">{0}</p>'.format(item.superscript) : '' }}
        </a> 
      </li>
      {{ if (item.arrow) { }}
         <li class="connect" style="padding:0px; border:0;"><i class="ui-icon-chevron-right"></i></li>
         <!--li style="float: left; top:60px; padding:0px; border:0;" data-inset="false"><i style="color: #FFC96C; font-size:20px;" class="ui-icon-chevron-right"></i></li-->
      {{ }                 }}
    {{ } }}
    </ul>
</script>

<!-- script type="text/template" id="photogridTemplate">
    <ul data-role="listview" data-inset="true">
    {{ #items }}
      <li style="{{= 'float: ' + (float || 'left') }}">
        <a href="{{= target }}">
          {{= image ? '<img src="{0}" />'.format(image) : '' }}
          {{= title ? '<h2>{0}</h2>'.format(title) : '' }}
          {{= caption ? '<p>{0}</p>'.format(caption) : '' }}
          {{= typeof superscript !== 'undefined' ? '<p class="ui-li-aside">{0}</p>'.format(superscript) : '' }}
        </a> 
      </li>
      {{ if (arrow) { }}
         <li class="connect" style="padding:0px; border:0;"><i class="ui-icon-chevron-right"></i></li>
      {{ }                 }}
    {{ /items }}
    </ul>
</script -->


<script type="text/template" id="messageListTemplate">
<!-- collapsible error list -->

<div id="messageList" data-theme="{{= obj.theme ||  G.theme.error || 'c' }}">
{{  _.each(messages, function(msg) {  }}
     <div style="display:block" id="{{= msg.id }}" class="headerMessageBar {{= msg['class'] || obj['class'] || '' }}">
  {{ if (msg.link) {            }}
       <a href="{{= msg.link }}">
  {{ }                        }}
  {{ if (msg.icon) {    }}
       <i class="ui-icon-{{= msg.icon }}"></i>
  {{ }                  }}
  
    {{= msg.message }}
    
  {{ if (msg.link) {            }}
       </a>
  {{ }                        }}
  
  {{ if (!msg.link && msg.icon) {    }}
       <i class="ui-icon-{{= msg.icon }}"></i>
  {{ }                               }}
       <i class="ui-icon-delete closeparent"></i>
     </div>
{{  });                           }}
</div>

</script>

<!-- EDIT TEMPLATES -->
<script type="text/template" id="resourceEdit">
<!-- the edit page for any particular resource -->
<div id="{{= viewId }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.menu }}"></div> 
<div id="{{= viewId + 'r' }}" data-role="panel" data-display="overlay" data-theme="{{= G.theme.propertiesMenu }}" data-position="right"></div> 
<!--div id="headerMessageBar"></div-->
<div id="headerDiv"></div>
<div id="resourceEditView">
  <div id="resourceImage"></div>
  <form data-ajax="false" id="{{= viewId + '_editForm'}}" action="#">
    <ul data-role="listview" data-theme="{{= G.theme.list }}" id="fieldsList" class="action-list" data-inset="true">
    </ul>
    
    <div name="errors" style="float:left"></div>
    {{ if (this.resource.isAssignableFrom("InterfaceImplementor")) }}
    <div data-role="fieldcontain" id="ip">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><a target="#" id="check-all" data-icon="check" data-role="button" data-mini="true" data-theme="{{= G.theme.activeButton }}">Check All</a></div>
        <div class="ui-block-b"><a target="#" id="uncheck-all" data-icon="sign-blank" data-role="button" data-mini="true" data-theme="{{= G.theme.footer }}">Uncheck All</a></div>
      </fieldset>
      <fieldset data-role="controlgroup" id="interfaceProps">
      </fieldset>
    </div>
    {{                                                             }}
    
    <div class="ui-body ui-body-b">
      <fieldset class="ui-grid-a">
        <div class="ui-block-a"><button type="cancel" id="cancel" data-theme="{{= G.theme.footer }}" class="cancel">{{= obj.cancel || 'Cancel' }}</button></div>
        <div class="ui-block-b"><button type="submit" id="submit" data-theme="{{= G.theme.activeButton }}" class="submit">{{= obj.submit || 'Submit' }}</button></div>
      </fieldset>
    </div>

  </form>
  <br/>
  {{ if (U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"))) { }}
    <table class="ui-btn-up-g" width="100%" style="padding: 5px" id="comments">
    </table>
  {{ } }}
</div>


  <div data-role="footer" class="ui-bar" data-theme="{{= G.theme.footer }}">
     <a data-role="button" data-icon="repeat" id="homeBtn" target="#">Home</a>
  </div>
</script>

<script type="text/template" id="mvListItem">
  <!-- a multivalue input for edit forms -->
  {{ var id = G.nextId() }}
  
  <input type="checkbox" name="{{= davDisplayName }}" id="{{= id }}" value="{{= _uri }}" {{= obj._checked ? 'checked="checked"' : '' }} />
  <label for="{{= id }}">{{= davDisplayName }}<!-- {{= obj._thumb ? '<img style="float:right;max-height:40px;" src="' + _thumb + '" />' : '' }}--></label>
</script>

<script type="text/template" id="interfacePropTemplate">
  <!-- a interface props chooser input for edit forms -->
  <div class="ui-controlgroup-controls">
    {{ var id = G.nextId() }}
    <!-- input data-formel="true" type="checkbox" name="interfaceClass.properties" id="{{= id }}" value="{{= interfaceProps }}" {{= typeof _checked === 'undefined' ? '' : 'checked="checked"' }} / -->
    <input data-formel="true" data-mini="true" type="checkbox" {{= obj.disabled ? 'disabled' : '' }} name="interfaceProperties" id="{{= id }}" value="{{= interfaceProps }}" {{= obj._checked ? 'checked="checked"' : '' }} />
    <label for="{{= id }}">
      {{= davDisplayName }} 
      {{= obj.required ? '(Required)' : '' }}
      {{= obj.comment ? '<br><span style="font-size:12px;font-weight:normal;">' + comment + '</span>' : '' }}
    </label>
  </div>
</script>


<script type="text/template" id="emailPET">
  <label for="{{= id }}">{{= name }}</label>
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="editRowTemplate">
  <!-- one property row in edit mode -->
  <li data-icon="false" data-role="fieldcontain">{{= value }}
  </li>
</script>

<script type="text/template" id="telPET">
  <label for="{{= id }}">{{= name }}</label>
  <input type="tel" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" />
</script>

<script type="text/template" id="longEnumPET">
  {{ if (name && name.length > 0) { }}
  <label for="{{= id }}" class="select">{{= name }}</label>
  {{ } }}
  
  <select name="{{= shortName }}" id="{{= id }}" data-mini="true" {{= rules }} >
    {{= value ? '<option value="{0}">{0}</option>'.format(value) : '' }}
    {{ _.each(options, function(option) { }} 
    {{   if (option.displayName === value) return; }}
    {{   var val = option.displayName; }}
    <option value="{{= val }}">{{= val }}</option>
    {{ }); }}
  </select>
</script>

<script type="text/template" id="shortEnumPET">
  <fieldset data-role="controlgroup" data-type="horizontal" data-mini="true">
    <legend>{{= name }}</legend>
    {{ for (var o in options) { }} 
    {{   var p = options[o], displayName = U.getPropDisplayName(p); }}
         <input type="radio" name="radio-choice-b" name="radio-choice-b" id="{{= id + '.' + displayName }}" {{= rules }} value="{{= displayName }}" {{= typeof value !== 'undefined' && o === value ? 'checked="checked"' : '' }} />
         <label for="{{= id + '.' + displayName }}">{{= displayName }}</label>
    {{ } }}
  </fieldset>
</script>

<script type="text/template" id="stringPET">
  {{ var isInput =  _.isUndefined(prop.maxSize) ||  prop.maxSize < 100; }}
  {{ if (name) { }}
  <label for="{{= id }}" data-theme="{{= G.theme.list }}">{{= name }}</label>
    <{{= isInput ? 'input type="text"' : 'textarea rows="10" cols="20" ' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : U.htmlEscape(value) }}" {{= rules }} data-mini="true">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
  {{ if (!name) { }}
    <{{= isInput ? 'input type="text"' : 'textarea  style="width: 100%" rows="10"' }} name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : U.htmlEscape(value) }}" {{= rules }} data-mini="true">{{= typeof value != 'undefined' && !isInput ? value : '' }}</{{= isInput  ? 'input' :  'textarea' }}>
  {{ } }} 
</script>

<script type="text/template" id="moneyPET">
  <label for="{{= id }}" data-theme="{{= G.theme.list }}">{{= name }} <b>{{= typeof value.currency === 'undefined' ? '$' : value.currency }}</b></label>
  <input type="text" name="{{= shortName }}" id="{{= id }}" value="{{= obj.value ? value : '' }}" {{= rules }} data-mini="true"></input>
</script>

<script type="text/template" id="telPET">
<label for="{{= id }}">{{= name }}</label> 
<input type="tel" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement' }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="emailPET">
  <label for="{{= id }}">{{= name }}</label> 
  <input type="email" name="{{= shortName }}" id="{{= id }}" value="{{= typeof value === 'undefined' ? '' : value }}" class="{{= 'formElement' }}" {{= rules }} data-mini="true" />
</script>

<script type="text/template" id="hiddenPET">
  <input type="hidden" name="{{= shortName }}" id="{{= id }}" value="{{= value }}" class="{{= 'formElement' }}" {{= rules }} />
</script>

<script type="text/template" id="resourcePET">
  <a target="#"  name="{{= shortName }}" class="resourceProp" id="{{= id }}" {{= rules }} 
    {{ if (obj.img) { }}    
      style="padding-left: 55px; padding-bottom:0px; min-height: 40px;"><img name="{{= shortName }}" src="{{= img }}" style="max-height: 50px;"/>
    {{ }              }}
    {{ if (!obj.img) { }}    
       >
    {{ } }}   
    <label style="font-weight: bold;" for="{{= id }}">{{= name }}</label>
    {{= typeof displayName === 'undefined' || !displayName ? (typeof value === 'undefined' ||  value.length == 0 ? '' : value) : displayName }}
    {{ if (!obj.value) { }}
      {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }}
    {{ } }} 
  </a>
  
  {{ if (prop.range && ((isImage && prop.camera) || isVideo || isAudio)) { }}
    <a href="#cameraPopup" class="cameraCapture" target="#" data-icon="{{= isVideo ? 'facetime-video' : isAudio ? 'circle' : 'camera' }}" data-prop="{{= shortName }}"></a>
    {{ if (!G.canWebcam) { }}
      <input data-role="none" type="file" class="cameraCapture" accept="{{= isVideo ? 'video/*' : isAudio ? 'audio/*' : 'image/*' }};capture=camera;" style="visibility:hidden; display:none;" data-prop="{{= shortName }}" />
    {{ }                   }}
  {{ }                                                                                                                                                                                        }}
  <!-- {{= typeof multiValue === 'undefined' ? '' : value }} -->
</script>

<script type="text/template" id="cameraPopupTemplate">
  <div data-role="popup" id="cameraPopup" data-overlay-theme="{{= G.theme.menu }}" data-dismissible="false" class="ui-content ui-body-d">
    <div>
    {{ if (obj.video || obj.image) { }}
      <video id="camVideo" autoplay="autoplay"></video>
      <canvas id="canvas" width="100%" height="0"></canvas>
    {{ }                }}
    {{ if (obj.video || obj.audio) { }}
      <div id="camPreview">
      </div>
    {{ }                }}
    </div>
    <a href="#" data-rel="back" data-role="button" id="cameraCancelBtn" data-theme="a" data-icon="delete" data-iconpos="notext" class="ui-btn-right">Close</a>
    <div style="text-align:center">
      <a data-role="button" data-icon="{{= obj.video || obj.audio ? 'circle' : 'camera' }}" id="cameraShootBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">{{= obj.video || obj.audio ? 'Record' : 'Shoot' }}</a>
      <a data-role="button" data-icon="ok" id="cameraSubmitBtn" target="#" class="ui-disabled" data-inline="true" data-mini="true" style="margin: 0 auto;">I'll take it</a>
    </div>
  </div>
</script>

<script type="text/template" id="multivaluePET">
  <a target="#" name="{{= shortName }}" class="multivalueProp" >{{= typeof displayName === 'undefined' || !displayName ? name : displayName }}
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  </a>
</script>

<script type="text/template" id="booleanPET">
  {{ if (name && name.length > 0) { }}
    <label for="{{= id }}">{{= name }}</label>
    {{= typeof comment == 'undefined' ? '' : '<br/><span class="comment">' + comment + '</span>' }} 
  {{ } }}
  <select name="{{= shortName }}" id="{{= id }}" {{= rules }} data-role="slider" class="formElement boolean" data-mini="true">
    <option {{= !obj.value ? 'selected="selected"' : '' }}>No</option>
    <option {{= obj.value ? 'selected="selected"' : '' }}>Yes</option>
  </select>
<!--  {{= typeof comment == 'undefined' ? '' : '<span class="comment">' + comment + '</span>' }} -->
</script>

<script type="text/template" id="datePET">
  <label for="{{= id }}">{{= name }}</label>
  <input id="{{= id }}" class="i-txt" name="{{= shortName }}" {{= rules }} data-mini="true" value="{{= value }}" />
  <!--input type="hidden" id="{{= id + '.hidden' }}" name="{{= shortName }}" {{= rules }} data-mini="true" /-->
</script>

<script type="text/template" id="scrollEnumPET">
  <label for="{{= id }}">{{= name }}</label>
  <input id="{{= id }}" class="i-txt" name="{{= shortName }}" {{= rules }} data-mini="true" value="{{= value }}" />
</script>

<!-- END EDIT TEMPLATES -->

</div>
