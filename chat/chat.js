var autoScrolling = 'yes';

function isScrollBarActivated() {
  if(parent.frames['chatContents'].document.body.scrollHeight < parent.frames['chatContents'].document.body.clientHeight)
    return 0;
  else 
    return 1;
}

function isScrollBarAtBottom()
{
  var scrollH = parent.frames['chatContents'].document.body.scrollTop;
  parent.frames['chatContents'].window.scrollBy(0,2);
  if (Math.abs(scrollH-parent.frames['chatContents'].document.body.scrollTop)<=1)
    return 1;
  else {
    parent.frames['chatContents'].window.scrollBy(0,-2);return 0;
  }
}

function funSetWritingStatus(idElementWritingStatus)
{
  if(parent.userList.document.getElementById(idElementWritingStatus) != null)
    parent.userList.document.getElementById(idElementWritingStatus).src = 'icons/chatWritingStatus.gif';
  timeId = setInterval("if(parent.userList.document.getElementById('" + idElementWritingStatus + "')!=null)parent.userList.document.getElementById('"+idElementWritingStatus+"').src = 'icons/chatWritingStatus.gif'",1000);
  setTimeout("if(parent.userList.document.getElementById('" + idElementWritingStatus + "')!=null) parent.userList.document.getElementById('"+idElementWritingStatus+"').src = 'icons/chatNotWritingStatus.gif';clearInterval("+timeId+");",5001);
}

function insertMessages(gmtOffset, tm, userColor, userId, messageArray) {
  if (!isScrollBarActivated() || isScrollBarAtBottom())
    autoScrolling = 'yes';
  else 
    autoScrolling = 'no';

  if (messageArray[0].indexOf('!-invt') == 0) {
    parent.frames['chatContents'].document.getElementById('body1').innerHTML += 
      "<img src='icons/classes/invited.gif'> <span class=xs><font color='#63B4EF'>[" +
      getTimeStr(gmtOffset,tm) +
      "]</font>: " +
      messageArray[0].replace("!-invt","").replace("target='_self'","target='_top'") +
      "</span><br>";       
    if (autoScrolling == 'yes') {
      var contentWindow = parent.document.getElementById('chatContents').contentWindow;
      contentWindow.scrollTo(0,contentWindow.document.body.scrollHeight);
    }
    return;
  }
         
  if ((userId == "ChatAdministrator") && (messageArray[0]=="?")) {
    var date = new Date(tm);
    var dt = new Date();
  
    var timeChatActive = dt - date;
    dt.setHours(0);
    dt.setMinutes(0);
    dt.setSeconds(0);
    dt.setMilliseconds(timeChatActive);
    parent.document.formScrollLock.chatStartedAt.value = timeChatActive;
    return;
  }

  if (messageArray[messageArray.length-1].substring(0,messageArray[messageArray.length-1].lastIndexOf('?')) == "..w..") {
    var idWriting = 'w' + userId;
    funSetWritingStatus(idWriting);
    return;
  }

  var userAlias = messageArray[messageArray.length-1];
  userAlias = userAlias.substring(userAlias.lastIndexOf('?') + 1, userAlias.length);

  messageArray[messageArray.length-1] = messageArray[messageArray.length-1].substring(0,messageArray[messageArray.length-1].lastIndexOf('?'));
  var doc = parent.frames['chatContents'].document;
  var bodyRef = doc.getElementById('body1');
  if (bodyRef == null)
    return;
  var messageString = ''; // message string which will be added using innerHTML+=messageString
  if (userId == 'ChatAdministrator') { 
    messageString += "<img src='icons/information.gif' align=bottom><span class=xs>"; 
    userN = doc.createElement('img');
    userN.src = 'icons/information.gif'; 
    userN.align= 'bottom';
  } else {
    messageString += '<span class=xs><font color=' + userColor + '>'; 
    userN = doc.createElement('font'); 
    userN.color = userColor;
  }
  var time = getTimeStr(gmtOffset,tm);

  var messageStringTimeN = '';
  messageStringTimeN += "<font "; 
  var timeN = doc.createElement('font');
  timeN.size -= 1;

  if (userId == 'ChatAdministrator') {
    messageStringTimeN += ' style=\"color:#63B4EF;'; 
    timeN.style.color = '#63B4EF';
  } else {
    messageStringTimeN += ' style=\"color:'+userColor+';> ';
  }

  if (doc.getElementById('timeNid[0]') != null) {
    if(doc.getElementById('timeNid[0]').style.display != 'none') {
      messageStringTimeN += 'display:inline\" '; 
      timeN.style.display = 'inline';
    } else {
      messageStringTimeN += 'display:none\" '; 
      timeN.style.display='none';
    }
  } else {
    messageStringTimeN += 'display:inline\"'; 
    timeN.style.display='inline';
  }

  var timeNiD = 0; 
  while (doc.getElementById('timeNid['+timeNiD+']')) {
    timeNiD++;
  }
  messageStringTimeN += ' id=\"timeNid['+timeNiD+']\">'; 
  timeN.id = 'timeNid['+timeNiD+']';

  if (userId != 'ChatAdministrator') { 
    messageString += userId;
    userN.appendChild(doc.createTextNode(userId));
    messageString += "</font>";
  }
  messageStringTimeN += ' [' + time + ']</font>'; 
  timeN.appendChild(doc.createTextNode(' [' + time + ']'));

  bodyRef.innerHTML += messageString + messageStringTimeN + ':</span> ';
    
  var usernameString = '';
  if (userId == 'ChatAdministrator') {
    usernameString += '<span class=xs><font color=' + messageArray[0].substring(0,messageArray[0].indexOf('-')-1) + '>'; 
    username = doc.createElement('font');
    username.color = messageArray[0].substring(0,messageArray[0].indexOf('-') - 1);
    usernameString += messageArray[0].substring(messageArray[0].indexOf('-')+1,messageArray[0].indexOf(' '));
    username.appendChild(doc.createTextNode(messageArray[0].substring(messageArray[0].indexOf('-')+1,messageArray[0].indexOf(' '))));
    usernameString += '</font>';
    usernameString += messageArray[0].substring(messageArray[0].indexOf(' '),messageArray[0].length) + '</span><br>';
    bodyRef.innerHTML += usernameString;
  } else { 
    for (i = 0; i < messageArray.length; i++) {
      loadUrl(messageArray[i],bodyRef,doc,userId);
      var newBR = doc.createElement('br');
      bodyRef.appendChild(newBR);
    }
  }

  if (autoScrolling == 'yes') {
    var contentWindow = parent.document.getElementById('chatContents').contentWindow;
    contentWindow.scrollTo(0,contentWindow.document.body.scrollHeight);
  }
}

function getTimeStr(gmtOffset,tm) {
  var date = new Date(tm);
  var time = '';

  var hours = date.getHours();
  if (hours > 12)
    hours = hours - 12;
  time += hours + ':';

  var min = date.getMinutes();
  if (min < 10)
    time += '0';
  time += min + ':';

  var sec = date.getSeconds();
  if (sec < 10)
    time += '0';
  time += sec;

  var ampm=' AM';
  if (date.getHours() > 12)
    ampm=' PM';
  time += ampm;
  return time;
}

//* ****************PRIVATE MESSAGES
function setUserAlias(alias) {
  parent.document.postForm.aliasUser.value = alias; 
  parent.document.postFormWritingStatus.aliasUser.value = alias;
}

function loadUrl(stringWithUrl,bodyRef,doc,userAlias) {
  var firstEntrance = stringWithUrl.indexOf('http:\\/\\/');
  var httpPresent = true;
  if (firstEntrance == -1) { 
    firstEntrance = stringWithUrl.indexOf('www.');
    httpPresent = false;
  }
  if (firstEntrance != -1) {
    var idexOfTheEndOfTheUrl = firstEntrance;
    for (;idexOfTheEndOfTheUrl < stringWithUrl.length; idexOfTheEndOfTheUrl++) {
      if (stringWithUrl.charAt(idexOfTheEndOfTheUrl) == ' ') {
        if (stringWithUrl.charAt(idexOfTheEndOfTheUrl - 1) == '.') {
          idexOfTheEndOfTheUrl = idexOfTheEndOfTheUrl - 1;
        }
        break;
      }
    }
    if (stringWithUrl.charAt(idexOfTheEndOfTheUrl-1) == '.') {
      idexOfTheEndOfTheUrl--;
    }

    var spanObj = doc.createElement('span');
    spanObj.className = "xs";
    bodyRef.appendChild(spanObj);

    var fontMes = doc.createElement('font');
    fontMes.color='#000000';
    var numberId = 0;
    if (doc.getElementById(userAlias+'['+numberId+']')) { 
      var color = doc.getElementById(userAlias+'['+numberId+']').style.background;
      fontMes.style.background = color;
    }
    while (doc.getElementById(userAlias+'['+numberId+']'))
      numberId++;
    fontMes.id = userAlias+'['+numberId+']';

    fontMes.appendChild(doc.createTextNode(stringWithUrl.substring(0,firstEntrance)));
    spanObj.appendChild(fontMes);
    var urlLink = doc.createElement('a');
    if (!httpPresent)
      urlLink.href = 'http:\/\/' + stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
    else 
      urlLink.href = stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
    urlLink.appendChild(doc.createTextNode(stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl)));
    urlLink.target='_blank';
    bodyRef.appendChild(urlLink);
    loadUrl(stringWithUrl.substring(idexOfTheEndOfTheUrl,stringWithUrl.length),bodyRef,doc,userAlias);
  } else {
    var spanObj = doc.createElement('span');
    spanObj.className = "xs";
    bodyRef.appendChild(spanObj);

    var fontMes = doc.createElement('font');
    fontMes.color='#000000';
    var numberId = 0;
    var color = '#ffffff';
    if (doc.getElementById(userAlias+'['+numberId+']')) 
      color = doc.getElementById(userAlias+'['+numberId+']').style.background;
    fontMes.style.background = color;
    while (doc.getElementById(userAlias+'['+numberId+']'))
      numberId++;
    fontMes.id=userAlias+'['+numberId+']';
    fontMes.appendChild(doc.createTextNode(stringWithUrl));
    spanObj.appendChild(fontMes);
  }
}

function ss_addEvent(elm, evType, useCapture, nameOfTheInsertedFont,
                     realName, color, userInfoDisplay, sendPrivMessageDisplay,
                     inviteToPrivChatDisplay, inviteToChatRoomDisplay, highlightDisplay) {
  if (elm.addEventListener) {
    elm.addEventListener(evType, 
      function () {
        window.parent.showOpsMenu(realName, color, nameOfTheInsertedFont, userInfoDisplay, sendPrivMessageDisplay, inviteToPrivChatDisplay, inviteToChatRoomDisplay, highlightDisplay);
      }, 
      useCapture);
  } else if (elm.attachEvent) {
    var r = elm.attachEvent("on"+evType, 
      function () {
        window.parent.showOpsMenu(realName, color, nameOfTheInsertedFont, userInfoDisplay, sendPrivMessageDisplay, inviteToPrivChatDisplay, inviteToChatRoomDisplay, highlightDisplay);
      });
  }
}

//---------START--------------INSERT MEMBERS FOR INVITATION(membersArray)------------------
function insertMembersForInvitation(membersArray) {
  var bodyRef = parent.frames['userList'].document.getElementById('divUsersInvite');
  if (membersArray.length > 1)
    bodyRef.innerHTML += "<br><font color='#33A3D2'><span class=xs><b>Other Rooms:</b></span><br>";  
  for (i = 0; i < membersArray.length; i++) {
    if (!parent.frames['userList'].document.getElementById('c'+membersArray[i]) && 
        !parent.frames['userList'].document.getElementById('inv'+membersArray[i])) {
      bodyRef.innerHTML += "<img id='inv"+membersArray[i]+"' src='images/icon_mini_profile.gif' width='16' height='16'><span class=xs><font style='cursor:pointer' onclick='window.parent.showOpsMenu(\"" + membersArray[i] + "\", \"\",\"" + membersArray[i] + "\",\"inline\",\"none\",\"inline\",\"inline\",\"none\");'>" + membersArray[i] + "</font></span><br>";
      if (parent.document.getElementById('userOpsPanelUserName').innerHTML == membersArray[i])
        window.parent.showOpsMenu(membersArray[i], '#000000', membersArray[i], 'inline', 'none', 'inline', 'inline', 'none');
    }
  }
  bodyRef.innerHTML += "<br><input type='hidden' value='' name='message' id='message'><input type='hidden' name='nameUser' id='nameUser' value=''></form>";             
  if (!(document.getElementById('inv'+parent.document.getElementById('userOpsPanelUserName')) || document.getElementById('c'+parent.document.getElementById('userOpsPanelUserName'))))
    parent.hideOpsMenu();
}
  
//---------START--------------INSERT MEMBERS(membersArray)------------------
function insertMembers(membersArray) {
  var docum = parent.frames['userList'].document;
  docum.getElementById("bodyMembersKeeper").removeChild(docum.getElementById("divUsersContainer"));
  if (docum.getElementById("divUsersInvite"))
    docum.getElementById("bodyMembersKeeper").removeChild(docum.getElementById("divUsersInvite"));
  var bodyRef = docum.getElementById('bodyMembersKeeper');
  if (bodyRef == null) 
    return;
  var divUsers = docum.createElement('div');
  divUsers.id = 'divUsersContainer';
  var divUsersInvite = docum.createElement('div');
  divUsersInvite.id = 'divUsersInvite';
  for (i = 0; i < membersArray.length; i+=2) {
    var nameUserOnline = membersArray[i+1];
    var realUserName = membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
    //user id. "Administrator" for example
    if (parent.document.getElementById('userOpsPanelUserName').innerHTML==realUserName)
      window.parent.showOpsMenu(realUserName, membersArray[i].substring(membersArray[i].lastIndexOf('-')+1,membersArray[i].length),nameUserOnline,'inline','inline','inline','none','inline');
    userI = docum.createElement('img');
    userI.src='images/icon_mini_profile.gif';
    userI.width = 16; userI.height = 16;
    divUsers.appendChild(userI);
    var spanF = docum.createElement('span');
    spanF.className = 'xs';
    divUsers.appendChild(spanF);
    var userF = docum.createElement('font');
    userF.style.cursor='pointer';
    userF.color = membersArray[i].substring(membersArray[i].lastIndexOf('-')+1,membersArray[i].length);
    userF.id='c'+membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
    // added to define a real user name color. It is a sendOnEneter task.
    ss_addEvent(userF,"click",false,nameUserOnline,membersArray[i].substring(0,membersArray[i].lastIndexOf('-')),userF.color,'inline','inline','inline','none','inline');
    userF.appendChild(docum.createTextNode(membersArray[i].substring(0,membersArray[i].lastIndexOf('-'))));
    spanF.appendChild(userF);
    //-----START ------------------- TYPING/NOT TYPING STATUS IMAGE ------------------------
    if (realUserName != parent.document.getElementById("realUserName").value) {
      divUsers.appendChild(docum.createTextNode(' '));
      var statusWriting = docum.createElement('img');
      statusWriting.id = 'w'+membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
      statusWriting.style.width=14; statusWriting.style.height=14;
      statusWriting.src='icons/chatNotWritingStatus.gif';
      statusWriting.style.verticalAlign='top';
      statusWriting.alt='\"typing/not typing\" status';
      statusWriting.title='\"typing/not typing\" status';
      divUsers.appendChild(statusWriting);
    }
    //-----FINISH ------------------- TYPING/NOT TYPING STATUS IMAGE ------------------------   
    divUsers.appendChild(docum.createElement('br'));
  }
  bodyRef.appendChild(divUsers);
  bodyRef.appendChild(divUsersInvite);
}