/**********************************
 * Adaptor to platform services
 **********************************/
var Boost = {
  majorVersion : 1,
  minorVersion : 0,

  /* platform services */
  eventManager        : null,
  user                : null,
  xmpp                : null,
  notifier            : null,
  cache               : null,
  geoLocation         : null,
  camera              : null,
  logger              : null,
  phone               : null,
  keyboard            : null,
  view                : null, // window or view of this browser
  browserHistory      : null,
  zoom                : null,


  eventHandlers       : new Array(),
  eventObjects        : new Array(),

  /* initialize platform-specific services */
  init:  function() {
    var $t = Boost;
    var needHandler;
    
    if (typeof jsiEventManager != 'undefined') {
      $t.eventManager         = jsiEventManager;
    }
    else if (typeof document.BhoostApplet != 'undefined' &&
        typeof document.BhoostApplet.getEventManager != 'undefined') {
      $t.eventManager = document.BhoostApplet.getEventManager();
      Boost.log('adding jsi from Applet: ' + $t.eventManager);
    }
    else {
      // default implementation
      $t.eventManager = {
         hasEvent :         function () { return false; }
        ,readyForEvents:    function () {  }
        ,readyForNextEvent: function () {  }
        ,isEventsViaTimer:  function () { return false; }
        ,getEventInstance:  function () { return null; }
        ,subscribe:         function () {  }
        ,unsubscribe:       function () {  }
      };
      Boost.log('no eventManager');
    }
    if (typeof jsiUser != 'undefined') {
      $t.user                 = jsiUser;
      needHandler = true;
    }
    if (typeof jsiNotification != 'undefined') {
      $t.notifier             = jsiNotification;
      needHandler = true;
    }
    if (typeof jsiXmpp != 'undefined') {
      $t.xmpp                 = jsiXmpp;
      $t.eventObjects['xmpp'] = jsiXmppEvent;
      needHandler = true;
    }
    else if (typeof document.BhoostApplet != 'undefined' &&
        typeof document.BhoostApplet.getXmppInstance != 'undefined') {
      $t.xmpp = document.BhoostApplet.getXmppInstance();
      $t.eventObjects['xmpp'] = $t.eventManager.getEventInstance('xmpp');
      needHandler = true;
      Boost.log('adding xmpp jsi from Applet: ' + $t.xmpp);
    }
    if (typeof jsiBrowserHistory != 'undefined') {
      $t.browserHistory                 = jsiBrowserHistory;
      $t.eventObjects['browserHistory'] = jsiBrowserHistoryEvent;
      needHandler = true;
    }
    if (typeof jsiZoom != 'undefined') {
      $t.zoom                           = jsiZoom;
      needHandler = true;
    }
    if (typeof jsiGeoLocation != 'undefined') {
      $t.geoLocation                    = jsiGeoLocation;
      $t.geoLocation.setMinDistance(1000);
      $t.geoLocation.setMinTime(300000);
      $t.eventObjects['geoLocation']    = jsiGeoLocationEvent;
      needHandler = true;
    }
    if (typeof jsiCamera != 'undefined') {
      $t.camera                         = jsiCamera;
      $t.eventObjects['camera']         = jsiCameraEvent;
      needHandler = true;
    }
    if (typeof jsiLog != 'undefined') {
      $t.logger                         = jsiLog;
      needHandler = true;
    }
    if (typeof jsiCall != 'undefined') {
      $t.phone                          = jsiCall;
      needHandler = true;
    }
    if (typeof jsiKeyboard != 'undefined') {
      $t.keyboard                       = jsiKeyboard;
      $t.eventObjects['key']            = jsiKeyEvent;
      needHandler = true;
    }
    if (typeof jsiCache != 'undefined') {
      $t.cache                          = jsiCache;
    }
    if (needHandler) {
      if ($t.eventManager.isEventsViaTimer()) {
        Boost.log("unqueuing events via timer");
        setInterval($t.eventArrived, 1000);
      }
      else {
        if (Browser.android) {
        Boost.log('adding native keydown event handler');
        addEvent(document, 'keypress', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        addEvent(document, 'keydown', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        addEvent(document, 'keyup', $t.eventArrived, false); // this fake key event is programatically injected by android LablZ adapter
        }
      }
    }

    if (typeof jsiView != 'undefined')
      $t.view = jsiView;
    else {
      // default implementation
      $t.view = {
        setProgressIndeterminate: function(b) {
          $t.log('setting progress indeterminate');
          if (b)
            document.body.style.cursor = "wait";
          else
            document.body.style.cursor = "default";
        },
        setProgress : function(progressPercent) {
          if (progressPercent != 100)
            document.body.style.cursor = "wait";
          else
            document.body.style.cursor = "default";
        },
        setTitle: function (text) {
          document.title = text;
        }
      };
    }

    for (var h in Boost.eventHandlers) {
      Boost.log('handlers: ' + h);
    }
    for (var h in Boost.eventObjects) {
      Boost.log('eventObjects: ' + h);
    }

  },

  log: function(text) {
    var $t = Boost;
    if ($t.logger) {
      $t.logger.log("Boost: " + text);
    }
    else if (!Browser.ie && typeof console != 'undefined') {
      console.log("Boost: " + text);
    }
//    else {
//      alert("Boost: " + text);
//    }
  },

  logDB: function() {
    var $t = Boost;
    if ($t.logger)
      $t.logger.logDB();
  },

  /**
   * Register a handler for a specific platform event.
   * Allows to add multiple handlers. Handlers are called in FIFO order.
   */
  addEventHandler:  function(eventType, handler) {
    var $t = Boost;
    var handlers = $t.eventHandlers[eventType];
    if (handlers == null) {
      handlers = new Array();
      $t.eventHandlers[eventType] = handlers;
    }
    Boost.log('adding handler for type: ' + eventType);
    if (typeof $t.eventManager.subscribe == 'function') {
      $t.eventManager.subscribe(eventType);
    }
    handlers[handlers.length] = handler;
    //Boost.log('added handler: ' + handlers[handlers.length - 1]);
  },

  /******* private members ********/

  /**
   * Dispatches events from the underlying platform to the proper event handler
   */
  eventArrived:  function(e) {
//    Boost.log('eventArrived()');
    var $t = Boost;
    if (e) {
      var code;
      if (typeof (e.getKeyCode) != 'undefined')
        code = e.getKeyCode(); // on android forced to use function, not keyCode property
      else
        codee = getKeyCode(e);
      //var code = e.keyCode;
      Boost.log('got native key event: ' + e + ', code=' + code);
      if (code != 39) // process only fake key event
        return true;
    }
    var hasEvent = $t.eventManager.hasEvent();
//    Boost.log('$t.eventManager.hasEvent(): ' + hasEvent);
    var propagate = true;
    if (hasEvent) {
      $t.eventManager.popEvent();
      Boost.log('after $t.eventManager.popEvent()');
      var eventType = $t.eventManager.getEventType();
      Boost.log('eventType: ' + eventType);
      var handlers = $t.eventHandlers[eventType];
      var eventObject = $t.eventObjects[eventType];
      Boost.log('eventObject: ' + eventObject);
      if (handlers) {
        for (var i=0; i<handlers.length; i++) {

          var handler = handlers[i];
          if (handler == null)
            continue;
          Boost.log('calling handler for event \'' + eventType + '\' with event object: ' + eventObject);
//          try {
            propagate = handler(eventObject);
            if (!propagate)
              break;
//          } catch(e) {
//            Boost.log('failed on handler for event \'' + eventType + '\' with event object: ' + eventObject + ':  ' + e);
//          }
        }
      }
//      $t.eventManager.popEvent();
    }
//    Boost.log('readyForNextEvent()');
    var em = $t.eventManager;
    if (typeof em.readyForNextEvent != 'undefined')
      $t.eventManager.readyForNextEvent();
    if (propagate)
      return true;
    else
      return stopEventPropagation(e);
  }
}


/**********************************
 * Mobile
 **********************************/
 var Mobile = {
  currentUrl:  null,
  urlToDivs:   null,
  chatRooms:   null,
  browsingHistory:       null,
  browsingHistoryTitles: null,
  browsingHistoryPos: 0,
 _preventingDoubleClick: false,
  myName: null,
  XMPPHost: null,
  XMPPChatService: null,
  myBuddy: null,
  privateRooms: null,
  isHistoryView : false,
  curHash : "", // helps to chatch back (forward) button
  $t: null,

  log: function(text) {
    Boost.log(text);
  },

  init: function(event) {
    var $t = Mobile;
    if (!Browser.mobile)
      return;
    Boost.view.setProgressIndeterminate(false);
		
    // process redirect ourselves so that page is loaded into cache, added to history, etc.
    var redirect = document.getElementById('$redirect');
    var location;
    if (redirect)
      location = redirect.getAttribute('href');
    if (location) {
      Boost.log('redirecting to page: ' + location)
      var link = {href: location, id: null}
      $t.getPage(event, link);
      return;
    }

    Boost.addEventHandler('xmpp', $t.onChatMessage);
    Boost.addEventHandler('key',  $t.onKey);
    Boost.addEventHandler('camera', $t.onCameraEvent);
    Boost.addEventHandler('geoLocation',  $t.onGeoLocation);
    
    addEvent(document.body, 'click',  $t.onClick, false);
		
    Boost.view.setProgressIndeterminate(false);
    if (Boost.cache)
      Boost.cache.cookieSync();

    var u = new Array();
    $t.urlToDivs = u;
    u = new Array();
    $t.chatRooms = u;

    $t.onPageLoad();
    var myDiv = document.getElementById('myScreenName');
    if (myDiv)
      $t.myName = myDiv.innerHTML;

    myDiv = document.getElementById('XMPPHost');
    if (myDiv)
      $t.XMPPHost = myDiv.innerHTML;
    myDiv = document.getElementById('XMPPChatService');
//    if (myDiv)
//      $t.XMPPChatService = myDiv.innerHTML;
    Boost.log('myName: ' + $t.myName + "; XMPPHost: " + $t.XMPPHost);
    if (Boost.xmpp) {
      if (typeof Boost.xmpp.setHost != 'undefined')
      Boost.xmpp.setHost($t.XMPPHost);
//      if (typeof Boost.xmpp.setChatService != 'undefined')
//      Boost.xmpp.setChatService($t.XMPPChatService);
      Boost.log('xmpp.login: ' + $t.myName);
      if ($t.myName != null && $t.myName.length != 0)
        Boost.xmpp.login($t.myName, $t.myName);
    }
    var pr = new Array();
    $t.privateRooms = pr;

    $t.checkLocation();

    Boost.log("$t.eventManager.readyForEvents();");
    Boost.eventManager.readyForEvents();
  },

  onPageLoad: function(newUrl, div) {
    var $t = Mobile;
    Boost.log("webview.db");
//    Boost.logDB();

    if (!Boost.xmpp)
      return;

    $t.enterChatRoom(newUrl, div);
  },

  enterChatRoom: function(chatRoomUrl, div) {
    var $t = Mobile;
    if (!div)
      return;
    if (!Boost.xmpp)
      return;
/*
    // time of the last message
    var d = document.getElementById('lastIMtime');
    if (!d)
      return;
    var time = d.innerHTML;
    Boost.log('lastIMtime: ' + time);
    //Boost.xmpp.init(time);
*/
    var chatRoomId = $t._getChatRoomId(div);
    if (chatRoomId) {
      chatRoomId = chatRoomId.toLowerCase();
      if (Boost.xmpp) {
//        var chatRoomId = "marco@conference.conference.lablz.com";  // hack
        Boost.log('chatRoom: ' + chatRoomId);
        $t.chatRooms[chatRoomId] = chatRoomUrl;
        Boost.log('chatRoomUrl: ' + $t.chatRooms[chatRoomId]);
        Boost.xmpp.setChatRoom(chatRoomId);
      }
    }
  },

  _getChatRoomId: function (div) {
    var chatRoomId = null;
    var divs = div.getElementsByTagName('div');
    var chatRoomDiv;
    for (var i=0; i<divs.length  &&  chatRoomDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == '-chatRoom')
        chatRoomDiv = tDiv;
    }
    if (chatRoomDiv)
      chatRoomId = chatRoomDiv.innerHTML;
    if (chatRoomId)
      chatRoomId.toLowerCase();
    return chatRoomId;
  },

  autoLogin: function(url) {
    var $t = Mobile;
    if (!url)
      url = document.location.href;
    if (url.indexOf('user-login.html') == -1)
      return;
    Boost.log('autoLogin: ' + url);
    var loginform = document.forms['loginform'];
    var jstest = loginform.elements['.jstest'];
    jstest.value = "ok"; // server will know that JavaScript worked
    var username = loginform.elements['j_username'];
    pw.value = 'mark';
    var pw = loginform.elements['j_password'];
    username.value = 'mark';
    //if (Boost.xmpp) {
      //Boost.xmpp.login(username.value, pw.value);
    //}
    /*
    if (typeof hash == 'undefined') {
      var script = '<script src="register/hashScript.js" type="text/javascript" language="JavaScript"></script>';
      div = document.createElement("DIV");
      document.body.appendChild(div);
      div.innerHTML = script;
    }
    */
    hash(loginform, 'j_security_check');

    var params = getFormFilters(loginform, true, new Array());
    //var urlFields = document.location.split('?');
    var url = loginform.action;
    //postRequest(event, url, params, null, null, function() {}, true);
  },

  onKey: function(e) {
    var $t = Mobile;
    var k = e.getKeyCode();
    Boost.log('got key event: ' + k);

    if (k == 4) { //back
      // if history view is opened then just close it.
      if ($t.isHistoryView) {
        $t.hideHistoryView($t.getCurrentPageDiv());
        return stopEventPropagation(e);
      }
      $t.oneStep(null, -1);
      return stopEventPropagation(e);
    }
    else if (k == 1) { // menu button
      $t.showOptionsMenu();
      return stopEventPropagation(e);
    }
    return true;
  },

  getCurrentUrl: function() {
		if (!this.currentUrl)
			return window.location.href;
    return this.currentUrl;
  },

  getCurrentPageDiv: function() {
    var $t = Mobile;
    if (!$t.urlToDivs || !$t.currentUrl || !$t.urlToDivs[$t.currentUrl]) {
      return document.getElementById('mainDiv');
    }
    return $t.urlToDivs[$t.currentUrl];
  },

  showOptionsMenu: function() {
    var $t = Mobile;
    if ($t.isHistoryView) {
      $t.hideHistoryView($t.getCurrentPageDiv());
      return false;
    }
    var optionsDiv = document.getElementById('menu_Options');
    if (!$t.urlToDivs) {
      var u = new Array();
      $t.urlToDivs = u;
    }
    var currentDiv = $t.getCurrentPageDiv();
    $t.displayActionsAndViewsFor(currentDiv, optionsDiv);
    MobileMenuAnimation.show(currentDiv);
    return true;
  },

  onChatMessage: function(e) {
    Boost.log('onChatMessage(): ' + e);
    var $t = Mobile;
    var text = e.getBody();
    if (!text)
      return;
    text += '';
    if (text == "This room is not anonymous.")
      return;
    var sender = e.getSender();
    if (sender)
      sender += '';
    var messageType  = e.getMessageType();
    if (messageType)
      messageType += '';
    var room = e.getChatRoom();
    if (room)
      room += '';
    Boost.log('sender: ' + sender + '; message: ' + text + "; messageType: " + messageType + '; chatRoom: ' + room);
/*
    if (messageType == null) {
      if (text == 'available' || text == 'unavailable')
        messageType = 'presence';
      else
        messageType = 'normal';
    }
*/
    var currentDiv = $t.urlToDivs[$t.currentUrl];
    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      $t.urlToDivs[0] = currentDiv;
    }

    Boost.log('onChatMessage: getChatRoom(): ' + room);
    var roomUrl = null;
    var imDiv = null
    if (room == null) { // private msg
      if (messageType != 'normal'  &&  messageType != 'chat')
        return;
      imDiv = $t.insertPrivateMessage(e, sender);
    }
    else {
      room = room.toLowerCase();
      roomUrl = $t.chatRooms[room];
      if (roomUrl == null) {
        Boost.log("no chat room found for " + room + ", message: " + text);
        return;
      }
      Boost.log("room url: " + roomUrl);
      var roomDiv = $t.urlToDivs[roomUrl];
      Boost.log("room div: " + roomDiv + ', room div id: ' + roomDiv.id);
      $t.insertChatMessage(e, roomDiv);
    }

    var currentRoom;
    if (!currentDiv) {
      Boost.log("no current div - can't detect chat room");
    }
    else {
      /*
       *  put message into current chatRoom div
       */
      currentRoom = $t._getChatRoomId(currentDiv);
      Boost.log("current chat room : " + currentRoom);
      if (!currentRoom) {
        Boost.log("no chat room in current div, sending a proper notification");
        // notify using sound/lights
        if (Boost.notifier) {
          Boost.log("sending notification");
          var ringerMode = Boost.notifier.getRingerMode();
          Boost.notifier.createNotification();
          Boost.notifier.setRing();
          var vibArray = [1000,1000,1000,4];
          Boost.notifier.setVibrate(vibArray);
          Boost.notifier.setInsistent(false);
          Boost.notifier.sendNotification();
        }
        return;
      }
      currentRoom = currentRoom.toLowerCase();
      roomUrl = $t.chatRooms[currentRoom];
      if (roomUrl == null) {
        Boost.log("no current chat room found for " + currentRoom);
        return;
      }
      Boost.log("current room url: " + roomUrl);
      var roomDiv = $t.urlToDivs[roomUrl];
      if (imDiv  &&  currentDiv != imDiv) {
        Boost.log("current room div: " + roomDiv + ', room div id: ' + roomDiv.id);
        $t.insertChatMessage(e, roomDiv);
      }
    }



/*
    if (roomUrl == $t.currentUrl) {
      // notify(true);
    }
    else {
      // notify(false);
    }

    var tbodies = roomDiv.getElementsByTagName('tbody');
    var ctbody;
    for (var i=0; i<tbodies.length  &&  !ctbody; i++) {
      if (tbodies[i]  &&  tbodies[i].id  &&  tbodies[i].id == 't_chat')
        ctbody = tbodies[i];
    }

    var curTr;
    var trs = ctbody.getElementsByTagName('tr');
    Boost.log("room trs: " + trs);
    for (var i=0; i<trs.length  &&  !curTr; i++)
      if (trs[i]  &&  trs[i].id  &&  trs[i].id == 'tr_empty')
        curTr = trs[i];
    if (curTr == null)
      return;

    var newTr = copyTableRow(ctbody, 1, curTr);
    newTr.className = '';
    var elms = newTr.getElementsByTagName('td');
    elms[0].innerHTML = text;
    var date = new Date(e.getTime());
    var mins = date.getMinutes();
    Boost.log("room 1: ");
    if (mins < 10)
      mins = '0' + mins;
    var hours = date.getHours();
    if (hours < 10)
      hours = '0' + hours;
    elms[1].innerHTML = '<tt>' + hours + ':' + mins + '</tt>';
    Boost.log("room elms: " + elms[1].innerHTML);
    var sender = e.getSender();
    Boost.log("sender: " + sender);
    Boost.log("slashindex: " + sender.indexOf('/'));
    if (sender && sender.indexOf('/') != -1) {
      var s = sender.split('/');
      Boost.log("part1: " + s[0]);
      if (s && s.length > 0) {
        Boost.log("part2: " + s[1]);
        sender = s[s.length - 1];
      }
    }

    var imgTable = newTr.getElementsByTagName('table');
    var imgTds = imgTable[0].getElementsByTagName('td');
    var img = imgTds[0].getElementsByTagName('img');
    var anchor = imgTds[0].getElementsByTagName('a');

    var href = 'contactInfo?name=' + sender;
    anchor[0].href = href;
    img[0].src = 'contactInfo?name=' +  sender + '&thumb=y';

    var anchor1 = imgTds[1].getElementsByTagName('a');
    anchor1[0].href = href;
    anchor1[0].innerHTML = sender;

    ctbody.appendChild(newTr);
    window.scrollTo(0, 3000);
//    android.scroll();
//    d.innerHTML = d.innerHTML + text + "</br>";
 *
 */
  },

  insertPrivateMessage: function(e, sender) {
    var $t = Mobile;

    var divId = sender;
    var idx = sender.indexOf('/');
    if (idx != -1)
      divId = sender.substring(0, idx);
    var div = $t.urlToDivs[divId];
    Boost.log('insertPrivateMessage(): sender: ' + sender + '; div: '+ div);
    if (div == null) {
      var div_empty = document.getElementById('im_empty');
      Boost.log('empty div:' + div_empty);
      div = document.createElement('DIV');
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      insertAfter(currentDiv.parentNode, div, currentDiv);
      $t.privateRooms[divId] = sender;
      setInnerHtml(div, div_empty.innerHTML);
      div.id = divId.toLowerCase();
      div.style.display = 'none';
      div.style.visibility = "hidden";
      $t.urlToDivs[divId] = div;
      $t.activatePrivateChat(div, sender);
    }
//    div.style.display = 'inline';
//    div.style.visibility = "visible";

    Mobile.insertChatMessage(e, div);
    return div;
  },

  activatePrivateChat : function(div, roomUrl) {
    var forms = div.getElementsByTagName('form');
    var form = forms[0];
//    form = document.forms[form.name];
    var idx = roomUrl.indexOf('@');
    var roomName = roomUrl.substring(0, idx);
    form.name = roomName;
    form.id = roomName;
    addEvent(form, 'submit', addWithoutProcessing, false);
  },

  insertChatMessage: function(e, roomDiv) {
    var tbodies = roomDiv.getElementsByTagName('tbody');
    var ctbody;
    for (var i=0; i<tbodies.length  &&  !ctbody; i++) {
      if (tbodies[i]  &&  tbodies[i].id  &&  tbodies[i].id == 't_chat')
        ctbody = tbodies[i];
    }
    var curTr;
    var trs = ctbody.getElementsByTagName('tr');
    for (var i=0; i<trs.length  &&  !curTr; i++)
      if (trs[i]  &&  trs[i].id  &&  trs[i].id == 'tr_empty')
        curTr = trs[i];
    if (curTr == null)
      return;

    var newTr = copyTableRow(ctbody, 1, curTr);
    newTr.id = '';
    newTr.className = '';
    var elms = newTr.getElementsByTagName('td');
    elms[0].innerHTML = e.getBody();
    var date = new Date(e.getTime());
    var mins = date.getMinutes();
    if (mins < 10)
      mins = '0' + mins;
    var hours = date.getHours();
    if (hours < 10)
      hours = '0' + hours;
    elms[1].innerHTML = '<tt>' + hours + ':' + mins + '</tt>';
    var sender = e.getSender();
    sender = sender + "";
    var idx = sender.lastIndexOf('@');
    var addHref = true;
    if (idx == -1) {
      var lablzStr = 'lablz.com/';
      var cutoffIndex = sender.lastIndexOf('lablz.com') + lablzStr.length;
      Boost.log("cutoffindex: " + cutoffIndex);
      Boost.log("new name:" +	" " + sender.substring(cutoffIndex));
      if (sender && sender.lastIndexOf('lablz.com') != -1)
        sender = sender.substring(cutoffIndex);
    }
    else {
      if (sender.indexOf('showtime') == 0) {
        addHref = false;
        var idx1 = sender.lastIndexOf('/');
        if (idx1 == -1)
          sender = sender.substring(0, idx);
        else
          sender = sender.substring(idx1 + 1);
      }
      else
        sender = sender.substring(0, idx);
    }
    var imgTable = newTr.getElementsByTagName('table');
    var imgTds = imgTable[0].getElementsByTagName('td');
    var img = imgTds[0].getElementsByTagName('img');
    var anchor = imgTds[0].getElementsByTagName('a');
    var anchor1 = imgTds[1].getElementsByTagName('a');
    if (addHref) {
      var href = 'contactInfo?name=' + sender;
      anchor[0].href = href;
      img[0].src = 'contactInfo?name=' +  sender + '&thumb=y';
      anchor1[0].href = href;
      anchor1[0].innerHTML = sender;
    }
    else
      imgTds[1].innerHTML = sender;

    ctbody.appendChild(newTr);
    window.scrollTo(0, 3000);
    if (typeof Boost.view.refocus != 'undefined')
      Boost.view.refocus();
//    setTimeout("Mobile.doSelection()", 50);
  },

  doSelection: function() {
    $t = Mobile;
    //Boost.log('doSelection() currentUrl:' +  $t.currentUrl);
    if (!$t.currentUrl) {
      $t.currentUrl = document.location.href;
    }
    var currentDiv = $t.getCurrentPageDiv();
    //Boost.log('doSelection() currentDiv:' +  currentDiv.id);
    var forms = currentDiv.getElementsByTagName('FORM');
    if (!forms || forms.length == 0)
      return;
    //Boost.log('doSelection() forms:' +  forms.length);
    var form = forms[0];
    var inputField = form.elements['.title'];
    //Boost.log('doSelection() inputField:' +  inputField.name);
    if (inputField)
      inputField.focus();
  },

  onGeoLocation: function(e) {
    var $t = Mobile;
    var callback = function() { Boost.log("finished posting geolocation event") };
    var a = document.getElementsByTagName('A');
    var params = 'latitude=' + e.getLatitude() + '&longitude=' + e.getLongitude()
    Boost.log('onGeoLocation: ' + params);
    postRequest(e, 'location', params, null, a[0], callback);
  },

  onCameraEvent: function(e) {
    var $t = Mobile;
    var url = e.getUrl();
    var privateIm = $t.myBuddy + '@' + $t.XMPPHost;
    Boost.log(privateIm);
    var img = "";

///////////
    if ($t.privateRooms)
      privateRoomId = $t.privateRooms[privateIm];
    var div;
    if (privateRoomId)
      div = $t.urlToDivs[privateIm];
    else
      privateRoomId = privateIm;
    var currentDiv = $t.urlToDivs[$t.currentUrl];

    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      $t.urlToDivs[$t.currentUrl] = currentDiv;
      $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
    }
    var img = "<img src=\"" + url + "\" width='" + ($t.getScreenWidth() / 2) + "'/>";
    privateIm = privateIm.toLowerCase();
    if (!div) {
      $t.privateRooms[privateRoomId] = privateIm;
      var div_empty = document.getElementById('im_empty');
      Boost.log("cloneDiv: im_empty");
      var div = document.createElement('DIV');
//      var div = cloneNode(div_empty);
      insertAfter(currentDiv.parentNode, div, currentDiv);
      setInnerHtml(div, div_empty.innerHTML);
      $t.activatePrivateChat(div, privateIm);

      // newUrl is sender in this case
      div.id = privateIm;
      div.className = '';
      Boost.log("Sending Photo to: " + privateIm);
      $t.urlToDivs[privateIm] = div;
    }
    var e = {
        getBody:   function() {return img},
        getSender: function() {return $t.myName + '@' + $t.XMPPHost},
        getTime:   function() {return new Date().getTime()}
      };
    $t.currentUrl = privateIm;
    Mobile.insertChatMessage(e, div);
    MobilePageAnimation.showPage(currentDiv, div);
    $t.setLocationHash(url);
///////////
    Boost.xmpp.sendMessage("<a href='" + url + "'>" + img + "</a>", privateIm + "/marco-android");
    Boost.log('Photo url for Avatar: ' + url);
  },

  mobileMenu: function(e, link) {
    var $t = Mobile;

    var id = link.id;
    var newUrl = link.href;
    var optionsDiv = document.getElementById('menu_Options');
    if (!id) {
      if (optionsDiv) {
        optionsDiv.style.visibility = "hidden";
        optionsDiv.style.display = "none";
      }

      return newUrl;
    }
    if (id == 'optionsMenu') {
      $t.changePresentationItemsState();
      if($t.showOptionsMenu() == false)
        stopEventPropagation(e);
      return null;
    }
		
		if (id == 'menu_Add') {
			var a = $t.getElementById('add_url_hdn');
			DataEntry.show(a.href);
			newUrl = null;
		}
		if (id == 'menu_Edit') {
			var a = $t.getElementById('edit_url_hdn');
			if (a == null)
				return stopEventPropagation(e);
			DataEntry.show(a.href);
			newUrl = null;
		}
		if (id == 'menu_Delete') {
			var a = $t.getElementById('delete_url_hdn');
			if (a.href.indexOf("l.html") != -1) 
		  	newUrl = a.href;
		  else {
		  	doConfirm("Do you realy want to delete this resource?");
		  	newUrl = null;
		  }
		}
		
    if (id == 'menu_Desktop') {
      var uri = $t.currentUrl;
      var idx = uri.indexOf('-mobile=');
      if (idx != -1) {
        var idx1 = uri.indexOf('&', idx);
        if (idx1 == -1)
          uri = uri.substring(0, idx);
        else {
          if (uri.charAt(idx - 1) == '&')
            uri = uri.substring(0, idx - 1) + uri.substring(idx1);
          else
            uri = uri.substring(0, idx) + uri.substring(idx1 + 1);
        }
      }
      var idx2 = uri.indexOf('#');
      if (idx2 == -1)
      uri += '&-desktop=y';
      else
        uri = uri.substring(0, idx2) + '&-desktop=y';   
      Boost.view.setProgressIndeterminate(true);
      document.location.replace(uri);
      return null;
    }
    if (id == 'menu_cancel') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        var u = new Array();
        u[0] = $t.currentDiv;
        $t.urlToDivs = u;
      }
       return null;
    }
    if (id == 'menu_exit') {
	  BrowserDialog.confirm("Do you really want to exit this application?", $t.onExisCallback);
      return null;
    }
    if (id == 'menu_Refresh') {
      // Write browsing history to the server and load it when loading new page
      Boost.view.setProgressIndeterminate(true);
      document.location.replace($t.currentUrl);
      return null;
    }
    /*
    if (id == 'menu_logoff') {
      // Write browsing history to the server and load it when loading new page
      var a = $t.getElementById('logoff_url_hdn');
      DataEntry.show(a.href);
      newUrl = null;
    }
    */
    if (id == 'menu_Reload') {
      Boost.view.setProgressIndeterminate(true);
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      
      document.location.reload();
      return null;
    }
    if (id == 'menu_History') {
      if (typeof Boost.zoom) {
         // zoom out to appropriate percentage
         // unhide the divs in urlToDivs
        if (typeof Boost.zoom != 'undefined')
         $t.showHistoryView();
      }
      return null;
    }
    if (id == 'menu_List') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;
      var idx = newUrl.indexOf('-featured=');
      if (idx != -1) {
        idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
      }

      var idx = newUrl.indexOf('-grid=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-list=y';
      }
      else if (newUrl.indexOf('-list=') == -1)
        newUrl = newUrl + '&-list=y';
    }
    else if (id == 'menu_Grid') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;

      var idx = newUrl.indexOf('-featured=');
      if (idx != -1) {
        idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
      }

      idx = newUrl.indexOf('-list=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-grid=y';
      }
      else {
        idx = newUrl.indexOf('-grid=');
        if (idx == -1)
          newUrl += '&-grid=y';
      }
    }
    else if (id == 'menu_LargeGrid') {
      optionsDiv.style.visibility = "hidden";
      optionsDiv.style.display = "none";
      newUrl = $t.currentUrl;

      var idx = newUrl.indexOf('-featured=');
      if (idx == -1)
        newUrl += '&-featured=y';

      idx = newUrl.indexOf('-list=');
      if (idx != -1) {
        var idx1 = newUrl.indexOf('&', idx);
        if (idx1 == -1) {
          if (newUrl.charAt(idx - 1) == '&')
            idx--;
          newUrl = newUrl.substring(0, idx);
        }
        else
          newUrl = newUrl.substring(0, idx) + newUrl.substring(idx1 + 1);
        newUrl += '&-grid=y';
      }
      else {
        idx = newUrl.indexOf('-grid=');
        if (idx == -1)
          newUrl += '&-grid=y';
      }
    }
    else if (id.indexOf('actions_Photo_') != -1) {
      if (!Boost.camera)
        return null;
      $t.myBuddy = id.substring(14);
      Boost.camera.takePicture(newUrl);
      Boost.log('picture was taken');
      return null;
    }
    else if (id == 'actions_IM') {
      var privateRoomId;
      var idx0 = newUrl.indexOf('@');
      var s = newUrl.substring(0, idx0);
      var idx01 = s.lastIndexOf('/');
      if (idx01 != -1)
        newUrl = s.substring(idx01 + 1) + newUrl.substring(idx0);

//      newUrl = newUrl.substring(idx + 1) + partUrl;
      Boost.log("privateIM: " + newUrl);
      if ($t.privateRooms)
        privateRoomId = $t.privateRooms[newUrl];
      var div;
      if (privateRoomId)
        div = $t.urlToDivs[newUrl];
      else
        privateRoomId = newUrl;
      var currentDiv = $t.urlToDivs[$t.currentUrl];
      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        $t.urlToDivs[$t.currentUrl] = currentDiv;
        $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
      }
      if (!div) {
        $t.privateRooms[privateRoomId] = newUrl;
        var div_empty = document.getElementById('im_empty');
        Boost.log("cloneDiv: im_empty");
        var div = document.createElement('DIV');
//        var div = cloneNode(div_empty);
        insertAfter(currentDiv.parentNode, div, currentDiv);
        setInnerHtml(div, div_empty.innerHTML);
        $t.activatePrivateChat(div, newUrl);

        // newUrl is sender in this case
        newUrl = newUrl.toLowerCase();
        div.id = newUrl;
        div.className = '';
        Boost.log("'IM me' clicked on: " + div.id);
        $t.urlToDivs[newUrl] = div;
        var e = {
          getBody:   function() {return "Please 'IM' me"},
          getSender: function() {return $t.myName + '@' + $t.XMPPHost},
          getTime:   function() {return new Date().getTime()}
        };
        Mobile.insertChatMessage(e, div);
      }
      else
        Boost.log("found div: " + newUrl);
/*
      var currentDiv = $t.urlToDivs[$t.currentUrl];

      if (!currentDiv) {
        currentDiv = document.getElementById('mainDiv');
        $t.urlToDivs[$t.currentUrl] = currentDiv;
        $t.browsingHistory[$t.browsingHistoryPos] = $t.currentUrl;
      }
*/
/*
      currentDiv.style.display = 'none';
      currentDiv.style.visibility = "hidden";
      div.style.display = 'inline';
      div.classname = '';
      div.style.visibility = "visible";
*/
      MobilePageAnimation.showPage(currentDiv, div);
      $t.setLocationHash(newUrl);

      Boost.log('currentDiv.parentNode:' + currentDiv.parentNode.id);
//      insertAfter(currentDiv.parentNode, div, currentDiv);

      $t.browsingHistoryPos++;
      $t.browsingHistory[$t.browsingHistoryPos] = newUrl;
      $t.currentUrl = newUrl;
      if (Boost.xmpp)
        Boost.xmpp.sendMessage("Please 'IM' me", newUrl + "/marco-android");
      return null;
    }

	// hide menu
    optionsDiv.style.visibility = "hidden";
    optionsDiv.style.display = "none";

    return newUrl;
  },
	
	onExisCallback : function(toExit) {
		if (toExit)
			Boost.view.exit();
	},
	
  changePresentationItemsState: function() {
      var item, level;
      var optionsDiv = document.getElementById('menu_Options');

      var selectedItemId = 'menu_Grid';
      var url = Mobile.currentUrl || window.location.href;
      if (url.indexOf('-list=') != -1)
        selectedItemId = 'menu_List';
      else if (url.indexOf('-featured=') != -1)
        selectedItemId = 'menu_LargeGrid';

      item = getChildById(optionsDiv, 'menu_List');
      level = (selectedItemId == 'menu_List') ? 0.5 : 1;
      changeOpacity(item, level);

      item = getChildById(optionsDiv, 'menu_Grid');
      level = (selectedItemId == 'menu_Grid') ? 0.5 : 1;
      changeOpacity(item, level);

      item = getChildById(optionsDiv, 'menu_LargeGrid');
      level = (selectedItemId == 'menu_LargeGrid') ? 0.5 : 1;
      changeOpacity(item, level);
  },

  writeBrowsingHistoryOnServer: function(e, link) {
    if ($t.browsingHistory <= 1)
      return;
    var params = '';
    for (var i=0; i<$t.browsingHistory.length; i++) {
      if (i != 0)
        params += ';';
      var pageUrl = $t.browsingHistory[i];
      params += ';pageUrl=' + encodeURIComponent(pageUrl) + '&title=';
      var div = $t.urlToDivs[pageUrl];
      var divs = div.getElementsByTagName('div');
      var titleDiv;
      for (var i=0; i<divs.length  &&  titleDiv == null; i++) {
        var tDiv = divs[i];
        if (tDiv.id  &&  tDiv.id == 'title')
          params += encodeURIComponent(tDiv.innerHTML);
      }
    }
  },

  /***** solves problem of Back button and history for Ajax *****/
  setLocationHash: function(newUrl) {

    this.curHash = newUrl;
    location.hash = encodeURIComponent(newUrl);

    /*
    if (location.hash != "")
      return;
    */
  },
  checkLocation: function() {
    var $t = Mobile;
    var hashVal;
    if (Browser.gecko)
      hashVal = location.hash.substr(1);
    else
      hashVal = decodeURIComponent(location.hash).substr(1);

    if (hashVal.length == 0) {
      hashVal = location.href;
      if (!$t.curHash)
        $t.curHash = hashVal;
    }

    if ($t.curHash && hashVal != $t.curHash) {
      // check back or forward
      if ($t.browsingHistory &&
            $t.browsingHistory[$t.browsingHistoryPos - 1] == hashVal) {
        $t.oneStep(null, -1, false);
      }
      else if ($t.browsingHistory &&
            $t.browsingHistory[$t.browsingHistoryPos + 1] == hashVal) {
        $t.oneStep(null, 1, false);
      }
      else {
        $t.getPage(null, hashVal);
      }
      $t.curHash = hashVal;
      Mobile.changePresentationItemsState();
    }
    setTimeout($t.checkLocation, 100);
  },

  showHistoryView : function() {
    var TOP_OFFSET = 100; // for "big" topBar
    var SPACE = 30;
    this.isHistoryView = true;

    MobileMenuAnimation.hide();
    var scrWidth = this.getScreenWidth();
    if (Boost.zoom)
      Boost.zoom.setZoomWidth(scrWidth * 2 + SPACE * 3);

    var idx = 0;
    var fstColBottom = TOP_OFFSET;
    var sndColBottom = TOP_OFFSET;

    for (var url in this.urlToDivs) {
      var div = this.urlToDivs[url]
      var divStl = div.style;
      if (!divStl)
        continue;

      // show BIG topBar
      if (idx == 0) {
        var parent = div.parentNode;
        var bigTopBar = getChildByAttribute(parent, "className", "topBar_big");
        if (!bigTopBar) {
          bigTopBar = document.createElement('div');
          bigTopBar.className = "topBar_big";
          var htmlTmp = "<a onclick=\"Mobile.onHistoryList();\" class='button'>List</a>";
          htmlTmp += "<a onclick=\"Mobile.hideHistoryView(Mobile.getCurrentPageDiv());\" class='button_left'>Back</a>";
          bigTopBar.innerHTML = htmlTmp;
          parent.appendChild(bigTopBar);
        }
        bigTopBar.style.display = "";
      }
      var isFirstCol = (idx % 2 == 0) ? true : false;

      if(isFirstCol) {
        divStl.left = SPACE;
        divStl.top = SPACE + fstColBottom;
      }
      else {
        divStl.left = scrWidth + SPACE * 2;
        divStl.top = SPACE + sndColBottom;
      }

      divStl.width = scrWidth;
      divStl.position = "absolute";
      divStl.border = "solid 1px #000";

      divStl.visibility = "visible";
      divStl.display = "";

      if (isFirstCol)
        fstColBottom += SPACE + div.clientHeight;
      else
        sndColBottom += SPACE + div.clientHeight;

      // show title text instead the topBar minified pages.
      var topBar = getChildByAttribute(div, "className", "topBar");
      if (topBar) {
        topBar.className = "topBar_history";
        // page title can require text.
        var title = getChildByAttribute(div, "className", "title");
        if (title.innerHTML.length == 0) {
          var titleText = this.getPageTitle(div);
          title.innerHTML = titleText;
        }
      }
      if (!this.urlToDivs[url].onclick) {
        this.urlToDivs[url].onclick = this.onPageSelectFromHistoryView;
        this.urlToDivs[url].ondblclick = this.onPageSelectFromHistoryView;
      }
      //addEvent(this.urlToDivs[url], "click",  this.onPageSelectFromHistoryView, true);
      this.setTitleText("History View - Mobile Social Net");
      idx++;
    }
  },
  hideHistoryView: function(targetPage) {
    var $t = Mobile;
    // hide all pages
    for (var url in $t.urlToDivs) {
      var div = $t.urlToDivs[url]
      var divStl = div.style;
      if (!divStl)
        continue;

      divStl.visibility = "hidden";
      divStl.display = "none";
      divStl.border = "";

      var topBar = getChildByAttribute(div, "className", "topBar_history");
      if (topBar)
        topBar.className = "topBar";

      $t.isHistoryView = false;

      $t.urlToDivs[url].onclick = null;
      $t.urlToDivs[url].ondblclick = null;
     // removeEvent($t.urlToDivs[url], "click",  $t.onPageSelectFromHistoryView, true);
    }
    // show target page
    var targetPageStl = targetPage.style;
    targetPageStl.border  = "";
    targetPageStl.left = 0;
    targetPageStl.top = MobilePageAnimation.getPageTopOffset();
    targetPageStl.visibility = "visible";
    targetPageStl.display = "";

    // hide the bigTopBar
    var parent = targetPage.parentNode;
    var bigTopBar = getChildByAttribute(parent, "className", "topBar_big");
    if (bigTopBar)
      bigTopBar.style.display = "none";

    window.scrollTo(0, 0);
    // return to normal scale
    if (Boost.zoom) {
      Boost.zoom.setZoomWidth($t.getScreenWidth());
    }
    $t.setTitle(targetPage);
  },
  onPageSelectFromHistoryView: function(e) {
    var $t = Mobile;

    if (!$t.isHistoryView)
      return;

    e = getDocumentEvent(e);
    var target = getEventTarget(e);
    var targetPage = getAncestorById(target, "mainDiv");
    if (!targetPage)
      targetPage = getAncestorByAttribute(target, "className", "mobile_page");

    if (!targetPage)
      return;

    $t.hideHistoryView(targetPage);
    return stopEventPropagation(e);
  },

  onHistoryList: function() {
    // need to implement
  },

  onClick: function(e) {
		var $t = Mobile;
    e = getDocumentEvent(e);
		
    var l = getEventTarget(e);
//    if (!Popup.android  &&  l.tagName.toUpperCase() != 'A'  &&  l.tagName.toUpperCase() != 'IMG')
//      return;

    var link = getAncestorByTagName(l, "a"); //getAnchorForEventTarget1(l);
    if (!link || !link.href || link.href == null)
      return true;
    var ln = link.href;
    if ($t._preventingDoubleClick)
			return stopEventPropagation(e);

    if (ln.startsWith('tel:')) {
      if (Boost.phone) {
        Boost.phone.dial(ln.substring(4));
        return stopEventPropagation(e);
      }
      else
        return true;
    }
    var idx = ln.indexOf(':');
    // take precautions to load only normal urls via ajax
    if (idx != -1) {
      var ln1 = ln.substring(0, idx);
      if (idx + 1 == ln.length)
        return true;
      var c = ln.charAt(idx + 1);
      if (ln1.match(/^[a-zA-Z]+$/) && // schema is letters only
         !(c >= '0' && c <= '9')) { // if no number after colon (e.g. :8080) - then it must be a schema
        // we plan to handle these URL schemas soon
        //if (ln.startsWith('sms:') || ln.startsWith('mailto:') || ln.startsWith('wtai:'))
        if (ln1 != 'http' && ln1 != 'https' && ln1 != 'about' && ln1 != 'javascript')
          return true;
      }
    }

    if (ln.endsWith('.gif') || ln.endsWith('.png') || ln.endsWith('.jpg') || ln.endsWith('.jpeg') || ln.endsWith('.svg')
         || (ln.startsWith('javascript') && link.id.length == 0))
      return true;
    return $t.getPage(e, link);
  },

	// intoCurrentPage in case of data entry
  getPage: function(e, link, intoCurrentPage) {
    var $t = Mobile;
    if (!$t.currentUrl) {
      $t.currentUrl = document.location.href;
      var s = new Array();
      s[0] = $t.currentUrl;
      $t.browsingHistory = s;
    }

		BottomToolbar.hide();

    var newUrl;
    if (typeof link == 'string')
      newUrl = link;
    else {
      // mobileMenu returns link.href or url based on
      // menu item ID.
      newUrl = $t.mobileMenu(e, link);
    }
    if (!newUrl) {
      return stopEventPropagation(e);
    }

    var isMore;
    var isRemoteLink;
    if (link.target) {
      // Remote link like 'Locate <avatar>'
      if (link.target == '_self') {
        Boost.view.setProgressIndeterminate(true);
        document.location.replace(newUrl);
        return;
      }
      isMore = link.target == '_replace';
      if (isMore) {
        var id = link.id;
        if (id  &&  id.startsWith('recNmb_')) {
//          var recNmb = parseInt(id.substring(7));
          var newRecNmb = parseInt(id.substring(7));// + 10;
          link.id = 'recNmb_' + newRecNmb;
          var idx = $t.currentUrl.indexOf('recNmb=');
          if (idx == -1)
            newUrl = $t.currentUrl + '&recNmb=' + newRecNmb;
          else {
            var idx1 = $t.currentUrl.indexOf('&', idx);
            if (idx1 == -1)
              newUrl = $t.currentUrl.substring(0, idx) + '&recNmb=' + newRecNmb;
            else
              newUrl = $t.currentUrl.substring(0, idx) + $t.currentUrl.substring(idx1) + '&recNmb=' + newRecNmb;
          }
        }
      }
    }
    if (!newUrl  ||  newUrl == 'about:blank' && !isMore)
      return stopEventPropagation(e);
    var isRefresh = newUrl == 'refresh';
    if (!isRefresh && !isMore && !intoCurrentPage)
      $t.browsingHistoryPos++;

    var currentDiv;
    if ($t.urlToDivs)
       currentDiv = $t.urlToDivs[$t.currentUrl];
    if (!currentDiv) {
      currentDiv = document.getElementById('mainDiv');
      var s = new Array();
      s[$t.currentUrl] = currentDiv;
      $t.urlToDivs = s;
      //$t.urlToDivs[$t.currentUrl] = currentDiv;
    }
    if ($t.currentUrl == newUrl) {
      currentDiv.style.visibility = "visible";
      currentDiv.style.display = "inline";
      return stopEventPropagation(e);
    }
    if (isRefresh)
      newUrl = $t.currentUrl;
    else if (!isMore) {
      $t.browsingHistory[$t.browsingHistoryPos] = newUrl;

      // clear forward history
      for (var i=$t.browsingHistoryPos + 1; i<$t.browsingHistory.length; i++) {
        if (!$t.browsingHistory[i])
          break;
        $t.browsingHistory[i] = null;
      }
    }

    var div;
    if (isMore) {
			if (intoCurrentPage) 
	  		div = currentDiv;
		  else {
		  	div = document.createElement("DIV");
		  	// class "mobile_page" to distinguish it as a page.
				div.className = "mobile_page";
				div.style.visibility = "hidden";
				div.style.display = "none";
			}
    }
    else {
	  // page is in history
	  div = $t.urlToDivs[newUrl];
      $t.currentUrl = newUrl;
      if (div  &&  !isRefresh) {
        $t.setTitle(div);
        MobilePageAnimation.showPage(currentDiv, div);
        $t.setLocationHash(newUrl);
        return stopEventPropagation(e);
      }
			
			// new mobile page
			if (intoCurrentPage) 
	  		div = currentDiv;
	  	else {
	  		div = document.createElement("DIV");
				div.className = "mobile_page";
				div.style.visibility = "hidden";
				div.style.display = "none";
				if (currentDiv) 
					insertAfter(currentDiv.parentNode, div, currentDiv);
				else 
					document.body.appendChild(div);
			}
			$t.urlToDivs[newUrl] = div;
    }
    var urlParts = newUrl.split('?');
    var url = urlParts[0];
    var idx = url.lastIndexOf('/');
    if (url.indexOf('.html') != -1)
      url = url.substring(0, idx + 1) + 'm' + url.substring(idx);
    var loadedFromCache = false;
    if (Boost.cache) {
      var id = link.id;
      if (id  &&  (id == 'menu_Reload' || id == 'menu_Refresh'))
        loadedFromCache = false;

      /*
      else {
        var content = Boost.cache.get(newUrl);
        if (content) {
          Boost.log("getting content from cache for url " + newUrl);
          loadedFromCache = true;
          loadPage(e, div, link, content, div);
        }
      }
      */
    }
    if (isMore)
      loadFromCache = false;
    if (loadedFromCache == true)
      return stopEventPropagation(e);

    $t._preventingDoubleClick = true;
    if (isMore)
      postRequest(e, url, urlParts[1], div, link, $t._loadMoreItems);
    else
      postRequest(e, url, urlParts[1], div, link, loadPage);

		// loadPage
    function loadPage(event, div, hotspot, content, url) {
			$t._preventingDoubleClick = false;

			// if server returned HTML containing "panel_block"
			// then it is data entry dialog with error message.
			if (content.indexOf("panel_block") != -1) {
				// "roll back" appending of new div
				div.parentNode.removeChild(div);
				delete $t.urlToDivs[$t.currentUrl];
				$t.browsingHistoryPos--;
				$t.currentUrl = $t.browsingHistory[$t.browsingHistoryPos];
			
				DataEntry.onDataEntryLoaded(event, div, hotspot, content, null, true);
		    // hides the location bar
		    scrollTo(0, 1);
				return;
		  }

			// hack: in case if serever returns full html page instead
			//(page with error message, for example; generated from widget/page.jsp)
			// mobile_page div content then retrieve mobile_page content only
			var page = getDomObjectFromHtml(content, "className", "mobile_page");
			if (page != null) {
				page.id = "";
	  		content = page.innerHTML;
	  	}
			
			setInnerHtml(div, content);
			$t.setTitle(div);

			// init for each new 'mobile' page
			FormProcessor.initForms();
							
			// in case of data entry put content in current div, so no sliding effect
			if (intoCurrentPage)
				return;

      $t.onPageLoad(newUrl, div);
      if (Boost.cache && loadedFromCache == false) {
        Boost.log("putting content into cache from " + newUrl);
        Boost.cache.put(newUrl, content);
      }
      if (currentDiv != null)
        MobilePageAnimation.showPage(currentDiv, div);
      else {
        div.style.visibility = "visible";
        div.style.display = "inline";
        Boost.view.setProgressIndeterminate(false);
      }
//      var offset = getElementCoords(div);
//      window.scroll(offset.left, offset.top);
      $t.setLocationHash(newUrl);
    }
    return stopEventPropagation(e);
  },
	
  _loadMoreItems: function(event, div, hotspot, content) {
    var $t = Mobile;
    setInnerHtml(div, content);
    var elms = div.getElementsByTagName('table');
    var table;
    for (var i=0; i<elms.length  &&  !tt; i++) {
      var tt = elms[i];
      if (tt.id && tt.id.startsWith('siteRL_'))
        table = tt;
    }
    $t._preventingDoubleClick = false;
    if (!table)
      return;
    var tbody = table.getElementsByTagName('tbody')[0];

    var currentDiv = $t.urlToDivs[$t.currentUrl];
    elms = currentDiv.getElementsByTagName('tr');
    var tr;
    var totalsTR;
    var headerTR;

    for (var i=0; i<elms.length; i++) {
      var tt = elms[i];
      if (tt.id) {
        if (!tr  &&  tt.id == '_replace')
        tr = tt;
        else if (totalsTR  &&  tt.id == 'totals')
          totalsTR = tt;
        else if (tt.id == 'header')
          headerTR = tt;
      }
    }
    if (!tr)
      return;

    var curTbody = tr.parentNode;

    elms = tbody.childNodes;
    for (var i=0; i<elms.length; i++)
      curTbody.appendChild(elms[i]);
    var coords = getElementCoords(tr);
    tr.className = "hdn";
    tr.id = '';
    if (totalsTR) {
      totalsTR.className = 'hdn';
      totalsTR.id = '';
    }
    Boost.view.setProgressIndeterminate(false);
    Boost.log('left = ' + coords.left + '; top = ' + coords.top);
    window.scrollTo(coords.left, coords.top);
  },

  // browsing history forward and backward
  // softKeyPressed: default = true
  oneStep: function(e, step, softKeyPressed) {
    if (typeof softKeyPressed == 'undefined')
      softKeyPressed = true;

		Filter.hide();
		DataEntry.hide();
		
		// optionsDiv is common for all mobile pages
    var optionsDiv = document.getElementById('menu_Options');
    // options menu opened no passes in history
    if (optionsDiv && optionsDiv.style.visibility == "visible")
      return;

    var $t = Mobile;
    $t.browsingHistoryPos += step;

    var l = $t.browsingHistory ? $t.browsingHistory.length : 0;

    if ($t.browsingHistoryPos < 0  || $t.browsingHistoryPos >= l) {
      $t.browsingHistoryPos -= step;
      if (e)
        return stopEventPropagation(e);
      else
        return;
    }

    var url = $t.browsingHistory[$t.browsingHistoryPos];
    if (!url) {
      $t.browsingHistoryPos -= step;
      if (e)
        return stopEventPropagation(e);
      else
        return;
    }
    var div = $t.urlToDivs[url];

    if (!$t.currentUrl)
      $t.currentUrl = document.location.href;
    var currentDiv = $t.urlToDivs[$t.currentUrl];
    $t.currentUrl = url;

    if (div) {
      var title = $t.setTitle(div);
//      if (Popup.android)
//        Boost.browserHistory.writeHistory(url, title);
      Boost.log("starting sliding");
      
      if (softKeyPressed) {
				$t.curHash = null;
				history.go(step);
        
        var hashVal;
        if (Browser.gecko)
					hashVal = location.hash.substr(1);
				else
					hashVal = decodeURIComponent(location.hash).substr(1);
				if (hashVal.length == 0) {
					hashVal = location.href;
				}
					$t.curHash = hashVal;
			}
      
			BottomToolbar.updateNavigationButtons();
      MobilePageAnimation.showPage(currentDiv, div, step < 0);
    }
    if (e)
      return stopEventPropagation(e);
    else
      return;
  },

	isBackAvailable : function() {
		if (!this.browsingHistory)
			return false;
		return this.browsingHistoryPos > 0;
	},
	
	isForwardAvailable : function() {
		if (!this.browsingHistory)
			return false;
		return this.browsingHistoryPos < this.browsingHistory.length - 1;
	},

  displayActionsAndViewsFor: function(div, optionsDiv) {
    var $t = Mobile;
    var isAdd = $t.getElementById('add_url_hdn') != null;
    var isEdit = $t.getElementById('edit_url_hdn') != null;
    var isDelete = $t.getElementById('delete_url_hdn') != null;
    
    var addA = document.getElementById('menu_Add');
    var addTd = addA.parentNode;
    if (isAdd)
      addTd.className = '';
    else
      addTd.className = 'hdn';
    var editA = document.getElementById('menu_Edit');
    var editTd = editA.parentNode;
    if (isEdit)
      editTd.className = '';
    else
      editTd.className = 'hdn';
    var delA = document.getElementById('menu_Delete');
    var delTd = delA.parentNode;
    if (isDelete)
      delTd.className = '';
    else
      delTd.className = 'hdn';

    var divs = div.getElementsByTagName('div');
    var viewsDiv;
    for (var i=0; i<divs.length  &&  viewsDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == 'options_Views')
        viewsDiv = tDiv;
    }
    var views;
    if (viewsDiv) {
      views = viewsDiv.innerHTML;
      if (!views  ||  trim(views).length == 0)
        views = null;
      else
        views = views.split(',');
    }
    var trs = optionsDiv.getElementsByTagName('table');
    var viewsTr;
    for (var i=0; i<trs.length  &&  !viewsTr; i++) {
      var tr = trs[i];
      if (!tr.id  ||  tr.id != 'menu_Views')
        continue;
      viewsTr = tr;
    }
    if (!viewsTr)
      return;
    if (views) {
      viewsTr.style.visibility = "visible";
      viewsTr.style.display = "inline";
    }
    else {
      viewsTr.style.visibility = "hidden";
      viewsTr.style.display = "none";
      return;
    }

    var tds = viewsTr.getElementsByTagName('td');
    var found;
    for (var i=0; i<tds.length; i++) {
      var td = tds[i];
      var id = td.id;
      if (!id)
        continue;
      found = false;
      for (var j=0; j<views.length  &&  !found; j++) {
        if (views[j] == id) {
          td.style.visibility = "visible";
          found = true;
        }
      }
      if (!found)
        td.style.visibility = "hidden";
    }

  },
  getPageTitle: function(pageDiv) {
    var divs = pageDiv.getElementsByTagName('div');
    var titleDiv;
    for (var i=0; i<divs.length  &&  titleDiv == null; i++) {
      var tDiv = divs[i];
      if (tDiv.id  &&  tDiv.id == 'title') {
        titleDiv = tDiv;
        break;
      }
    }
    var t = null;
    if (titleDiv)
      t = titleDiv.innerHTML;

    return t;
  },
  setTitle: function(pageDiv) {
    var title = this.getPageTitle(pageDiv);
    if (!title)
      return null;
    this.setTitleText(title);
    return title;
  },
  setTitleText: function(title) {
    if (Boost.view && typeof Boost.view.setTitle != 'undefined') {
      Boost.log("setting title to: " + title);
      Boost.view.setTitle(title);
    }
    else
      document.title = title;
  },
  refresh: function(e) {
    $t = Mobile;
    if ($t.currentUrl) {
      document.location.href = $t.currentUrl;
      return stopEventPropagation(e);
    }
  },

  getScreenWidth : function() {
    if (Boost.zoom)
      return Boost.zoom.getScreenWidth();
    else
      return getWindowSize()[0];
  },
	// currently all mobile pages in a document, so return element from the current page
	getElementById : function(id) {
	 return getChildById(this.getCurrentPageDiv(), id);
	}
}


/**********************************************
 * MobilePageAnimation
 * + checks orientation and fit page width
 **********************************************/
var MobilePageAnimation = {
  INTERVAL : 0, // ms
  STEPS_NUM : 6,

  curDiv : null,
  newDiv : null,
  rightToLeft : true,

  wndWidth : null,

  totalOffset : 0,
  step : 1,

  pageTopOffset : null,

  isInitialized : false,

  init : function() {
    this.isInitialized = true;
    this.wndWidth = Mobile.getScreenWidth();

    var div = document.getElementById('mainDiv');
    if (div) {
      div.style.width = this.wndWidth;
      div.position = "absolute";
      this.curDiv = div;
      this.pageTopOffset = getTop(div);
    }
    setTimeout(this.checkOrientation, 200);
  },
  
  showPage : function(curDiv, newDiv, isBack) {
    if (!this.isInitialized) {
      if (Browser.ie) // some problem with initialization in iE (?)
        this.init();
      else  
        return; // expected not loaded DOM
    }

    if(!curDiv || !newDiv)
      return;

    this.curDiv = curDiv;
    this.newDiv = newDiv;
    if (typeof isBack == 'undefined' || isBack == false)
      this.rightToLeft = true;
    else
      this.rightToLeft = false;
   
    // hides the location bar
    scrollTo(0, 1)
    setTimeout("MobilePageAnimation._animate();", this.INTERVAL);
  },

  _animate : function() {
    var thisObj = MobilePageAnimation;

    if(!thisObj.curDiv || !thisObj.newDiv)
      return;

    var newDivStl = thisObj.newDiv.style;
    var curDivStl = thisObj.curDiv.style;
    var x;

    var arg = (thisObj.step - thisObj.STEPS_NUM / 2) / 1.5;
    var delta = thisObj.wndWidth / 2.6 * Math.exp(-arg*arg);
    thisObj.totalOffset += delta;

    // 1. calculation
    // 1.1. right to left
    if(thisObj.rightToLeft) {
      if(thisObj.step == thisObj.STEPS_NUM)
        x = 0;
      else
        x = thisObj.wndWidth - thisObj.totalOffset;

      curDivStl.left  = x - thisObj.wndWidth;
      newDivStl.left =  x;
    }
    // 1.2. left to right // for "Back"
    else {
      if(thisObj.step == thisObj.STEPS_NUM)
        x = thisObj.wndWidth;
      else
        x = thisObj.totalOffset;

      newDivStl.left  = x - thisObj.wndWidth;
      curDivStl.left =  x;
    }
    if (thisObj.step == 1) {
      newDivStl.top = thisObj.pageTopOffset;
      newDivStl.width  = thisObj.wndWidth;
      newDivStl.position = "absolute";

      curDivStl.width  = thisObj.wndWidth;
      curDivStl.position = "absolute";

      newDivStl.visibility = "visible";
      newDivStl.display = "";
    }

    if(thisObj.step < thisObj.STEPS_NUM) {
      thisObj.step++;
      setTimeout("MobilePageAnimation._animate();", thisObj.INTERVAL);
    }
    else { // stop animation
      thisObj.curDiv.style.visibility = "hidden";
      thisObj.curDiv.style.display = "none";
      thisObj.totalOffset = 0;
      thisObj.step = 1;
      if (Boost.view) {
        Boost.view.setProgressIndeterminate(false);
        if (Boost.view.refocus)
          Boost.view.refocus();
      }
    }
  },
  getPageTopOffset : function() {
    return this.pageTopOffset;
  },
  
  checkOrientation : function() {
    var $t = MobilePageAnimation;
    var wndWidth = Mobile.getScreenWidth();
    
    if (wndWidth != $t.wndWidth) {
      $t.wndWidth = wndWidth;
      if ($t.curDiv)
        $t.curDiv.style.width = wndWidth;
    }
    setTimeout($t.checkOrientation, 200);
  }
}


/**********************************
 * MobileMenuAnimation
 **********************************/
var MobileMenuAnimation = {
  TOP_OFFSET : 60,
  optionsDiv : null,
	editItem : null,

  // default: effectIdx = 1 - "fading effect"
  show : function(curPageDiv, effectIdx) {
    effectIdx = effectIdx || 1;
    //if (!this.isInitialized)
    //  return;
		if (this.optionsDiv == null) {
			this.optionsDiv = document.getElementById('menu_Options');
			this.editItem = getChildById(this.optionsDiv, 'menu_Edit');
		}
    var optDivStl = this.optionsDiv.style;
    // hide menu if it is already opened
    if(optDivStl.visibility == "visible") {
      this.hide();
      return;
    }
    if (effectIdx == 1 && !Browser.ie) {
      this.opaqueAnimation(this.optionsDiv, 0.25, 1.0, 0.35);
    }

		this.setEditItemState();
		
    if (optDivStl.position == '')
      optDivStl.position = 'absolute';
    optDivStl.zIndex = curPageDiv.style.zIndex + 1;
    optDivStl.display = "block";
    optDivStl.visibility = "visible";
  },
	
	setEditItemState : function() {
		var page = Mobile.getCurrentPageDiv();
		var a = getChildById(page, 'edit_url_hdn');
		if (a == null) 
			//this.editItem.style.visibility = "hidden";
			changeOpacity(this.editItem, 0.3);
		else
			//this.editItem.style.visibility = "";
			changeOpacity(this.editItem, 1.0);
			
	},
	
  hide : function() {
    var optDivStl = this.optionsDiv.style;
    optDivStl.display = "none";
    optDivStl.visibility = "hidden";
  },
  opaqueAnimation : function(div, from, to, step) {
    this.TIME_OUT = 0;
    this.div = div;
    this.from = from;
    this.to = to;
    this.step = step;
    this.counter = 0;

    this._animate = function() {
      var thisObj = MobileMenuAnimation;
      var level = thisObj.from + thisObj.step * thisObj.counter;
      if (level > thisObj.to)
        level = thisObj.to;
      changeOpacity(thisObj.div, level);
      thisObj.counter++;
      if (level < thisObj.to)
        setTimeout(function(){ thisObj._animate()},
          thisObj.TIME_OUT);
    }
    this._animate();
  }
}

/** Set password and deviceId for mobile registration */
function setHiddenFields() {
//  Boost.log("setHiddenFields()");
  var f = document.forms['loginform'];
  var wasSubmitted = f.getAttribute("wasSubmitted");
  if (wasSubmitted) {
//    Boost.log("Can not submit the same form twice");
    return false;
  }
  f.setAttribute("wasSubmitted", "true");
  var userId = f.elements['j_username'];
  Boost.user.setUserId(userId.value);
  var avatarName = f.elements['name'];
  avatarName.value = userId.value;

  var pwd = f.elements['j_password'];
  pwd.value = Boost.user.getPassword();

  var deviceId = f.elements['j_deviceId'];
  deviceId.value = Boost.user.getDeviceId();
}

function addWithoutProcessing(event) {
  var $t = Mobile;
  var chatRoom = $t.currentUrl;
  var idx = chatRoom.indexOf('@');
  var elms = this.getElementsByTagName('INPUT');
  for (var i=0; i<elms.length; i++) {
    var elm = elms[i];
    if (elm.name == '.title')
      subject = elm;
  }
  var contactName = $t.myScreenName;
  var tbodyId = 't_chat';
  return addBeforeProcessing(chatRoom, tbodyId, subject, event);
}
// adds comment/resource before server confirms that resource was successfully created
function addBeforeProcessing(chatRoom, tbodyId, subject, event) {
  chatRoom = chatRoom.toLowerCase();
  var retCode = stopEventPropagation(event);
  var $t = Mobile;
  var msg;
  msg = subject.value;
  subject.value = '';
  if (Browser.mobile) {
    window.scrollTo(0, 3000);
//    subject.focus();
//    android.scroll();
//    Boost.log('sending message: ' + msg);
//    chatRoom = "neoyou@conference.sage";  // hack
    var roomUrl = $t.chatRooms[chatRoom];
    if (!roomUrl  &&  chatRoom.indexOf('@') != -1) {
      roomUrl = chatRoom;
//      Boost.xmpp.sendMessage(msg, roomUrl + "/marco-android");
    }
//    else
//      Boost.xmpp.sendMessage(msg, null);
    var roomDiv = $t.urlToDivs[roomUrl];
//    Boost.log('roomUrl: ' + roomUrl + '; roomDiv: ' + roomDiv);
    var chatIdDiv = document.getElementById('-chat')
    var e = {
      getBody:   function() {return msg},
      getSender: function() {return $t.myName + '@' + $t.XMPPHost},
      getTime:   function() {return new Date().getTime()}
    };
    $t.insertChatMessage(e, roomDiv);
  }
  /*
  else {
    var form = document.forms['tablePropertyList'];
    var params = getFormFilters(form, true) + "&-noRedirect=y";
    postRequest(event, 'mkresource', params, div, newTr, updateTR);
  }
  */
  return retCode;

  function updateTR(event, body, hotspot, content)  {
  }
}


/*******************************************************************
* SpriteAnimation - use it instead animated GIF on iPhone
* if parent is "undefined"  then place it in right top corner of screen
*******************************************************************/
function spriteAnimation(src, parent) {
  var $t = this;
  
  this.RIGHT_OFFSET = "7px";
  this.TOP_OFFSET = "50px";
  this.zIndex = "100";

  this.stl = null;

  this.parent = parent;
  
  this.frameWidth; 
  this.frameHeight;
  this.framesAmt;
  this.frameTimeout;
  
  this.step = 0;
  
  this._init = function(src) {
    var div = document.createElement("div");
    this.stl = div.style;
    this.stl.display = "none";
    this.stl.zIndex = this.zIndex;
    
    this.stl.background = "url(" + src + ") 0px 0px";
    
    if (this.parent)
      this.parent.appendChild(div);
    else {
      this.stl.position = "absolute";
      this.stl.right = this.RIGHT_OFFSET;
      this.stl.top = this.TOP_OFFSET;
      document.body.appendChild(div);
    }
  }
  
  this.show = function(frameWidth, frameHeight, framesAmt, frameTimeout) {
    this.frameWidth = frameWidth; 
    this.frameHeight = frameHeight;

    this.framesAmt = framesAmt;
    this.frameTimeout = frameTimeout;
    
    this.stl.width = this.frameWidth + "px";
    this.stl.height = this.frameHeight + "px";
    
    this.stl.display = "";
    setTimeout(this._showFrame, this.frameTimeout);
  }
  
  this.hide = function() {
    this.stl.display = "none";
  }
  
  this._showFrame = function() {
    if ($t.stl.display.toLowerCase() == 'none')
      return;
      
    $t.stl.backgroundPosition = -$t.step * $t.frameWidth + "px " +
        $t.frameHeight + "px";
    
    $t.step++;
    $t.step = $t.step % $t.framesAmt;
    setTimeout($t._showFrame, $t.frameTimeout);
  }
  
  // call initialization function
  this._init(src);
}

var CueLoading = {
  animation : null,
  init : function() {
    this.animation = new spriteAnimation("/images/skin/iphone/loading_sprite.png");
  },
  show : function() {
    this.animation.show(36, 36, 9, 100);
  },
  hide : function() {
    this.animation.hide();
  }
}

/********************************************
* BottomToolbar
* note: current code was fitted for Android's emulator
*********************************************/
var BottomToolbar = {
  HEIGHT : 50,
  DELAY : 3000, // delay before hide

  toolbar : null,
	
	//bottomLevel : null,
	offset : null,
  
	timerId : null,
  
  init : function() {
    this.createToolbarObject();
   
	 	this.offset = this.HEIGHT;
		this.setBottomLevelOffset(this.offset);
	 
		if (Browser.iPhone) 
			addEvent(document, "touchend", this.ontouch, false);
		else	
    	addEvent(document, "click", this.ontouch, false);

		// hide the toolbar on "scrolling" (?)
		addEvent(document, "touchmove", this.hide, false);

		this.timerId = setTimeout(BottomToolbar.down, this.DELAY);
	},
  
  createToolbarObject : function() {
    this.toolbar = document.createElement("div");
    this.toolbar.id = "bottom_toolbar";
    this.toolbar.style.height = this.HEIGHT;
		
    if (Browser.palmApp)
      this.toolbar.innerHTML =
        "<a href=\"javascript: ;\" style=\"visibility: hidden;\" onclick=\"Mobile.oneStep(event, -1);\"><img src=\"../images/skin/iphone/back_button.png\" /></a>"
        + "<a href=\"javascript: ;\" style=\"visibility: hidden;\" onclick=\"Mobile.oneStep(event, 1);\"><img src=\"../images/skin/iphone/forward_button.png\" /></a>"
        + "<a href=\"javascript: ;\" onclick=\"Filter.show();\"><img src=\"../images/skin/iphone/search_filter_button.png\" /></a>"
        + "<a id='optionsMenu' href=\"javascript: ;\"><img src=\"../images/skin/iphone/menu_button.png\" /></a>" 
        + "<a href=\"javascript: ;\"  onclick=\"document.location.reload();\"><img src=\"../images/skin/iphone/reload_button.png\" /></a>";
    else
      this.toolbar.innerHTML =
        "<a href=\"javascript: ;\" onclick=\"Filter.show();\"><img src=\"../images/skin/iphone/search_filter_button.png\" /></a>"
        + "<a  id='optionsMenu' href=\"javascript: ;\"><img src=\"../images/skin/iphone/menu_button.png\" /></a>"; 
 
    document.body.appendChild(this.toolbar);
  },
  
  ontouch : function(e) {
		var $t = BottomToolbar;
		
		//$t.updateBottomLevel(e);
		
		$t.hide();
		
		clearTimeout($t.timerId); 
    var e = getDocumentEvent(e);
    var target = getEventTarget(e);
    var tagName = target.tagName.toLowerCase();
    
		// touch in the toolbar
		if (getAncestorById(target, "bottom_toolbar") != null)
			return true;
		
		// show the toolbar only if clicked on free / not handled space
    if (tagName == "input" || tagName == "a")
      return;

		// click inside a dialog; skip it
		if (getParentDialog(target) != null)
			return;
		
		//$t.updateNavigationButtons();
   	
		$t.up();
  },
  
  updateNavigationButtons : function() {
		if (!Browser.palmApp)
			return;

			var anchors = this.toolbar.getElementsByTagName('a');
			// show / hide back and forward buttons
			anchors[0].style.visibility = Mobile.isBackAvailable() ? "visible" : "hidden";
			anchors[1].style.visibility = Mobile.isForwardAvailable() ? "visible" : "hidden";
	},
	
	// immediate hide the toolbar
  hide : function() {
		var $t = BottomToolbar;
		$t.toolbar.style.display = "none";
		$t.offset = 0;
  },
  
	up : function() {
		var $t = BottomToolbar;
		if ($t.offset == 0) 
			$t.toolbar.style.display = "block";
		
		// end of sliding
		if ($t.offset >= $t.HEIGHT) {
			$t.offset = $t.HEIGHT;
			$t.setBottomLevelOffset($t.offset);
			$t.timerId = setTimeout(BottomToolbar.down, $t.DELAY);
			return;
		}	 
		
		$t.setBottomLevelOffset($t.offset);
		
		$t.offset += 5;
		$t.timerId = setTimeout($t.up, 25);
	},
	
	down : function() {
		var $t = BottomToolbar;

		// end of sliding
		if ($t.offset <= 0) {
			$t.offset = 0;
			$t.setBottomLevelOffset($t.offset);
			$t.toolbar.style.display = "none";
			return;
		}	 
		
		$t.setBottomLevelOffset($t.offset);
		
		$t.offset -= 5;
		$t.timerId = setTimeout($t.down, 25);
	},
	
	setBottomLevelOffset : function(offset) {
		//if (this.bottomLevel == null)
		//	this.updateBottomLevel();
		
		var h = getWindowSize()[1];
		var bottomLevel = window.pageYOffset + h;

		this.toolbar.style.top = bottomLevel - offset;
	}
/*	
	updateBottomLevel : function(e) {
		var h = getWindowSize()[1];
		this.bottomLevel = h;
		//if (typeof e != 'undefined')
		//	this.bottomLevel = (e.pageY - e.screenY) + h;
		this.bottomLevel = window.pageYOffset - window.screenY + h;
	}
*/
}
