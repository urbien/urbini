  function addEvent(obj, evType, fn){
 	  if (obj.addEventListener){
	    obj.addEventListener(evType, fn, true);
		  return true;
		} else if (obj.attachEvent){
		    var r = obj.attachEvent("on"+evType, fn);
		    return r;
			 } else {
			    return false;
			   }
  }

	function myErrorHandler() {
	  return true;
	}
		
	function closeChatWindow() {
	  var moveToPriv = confirm('Would you like to leave a room but stay in rts? You will be moved to your private room.'); 
		var url = '/chatRoom?title=' + escape('Contact '+document.getElementById('realUserName').value) + '&privateR=true&referer=' + escape(document.getElementById('infoCP'+document.getElementById('aliasUserUri').value).value); 
		if(moveToPriv) {
		  window.location = url;
	  } 
		 else window.close();
  }
 
		function checkOnlineStatus() {
		  try {
		    if(thread.document.body.innerHTML.length == 0 || threadIframeContent == 0) 
			  threadIframeContent = thread.document.body.innerHTML.length;
		    else
			  if(thread.document.body.innerHTML.length == threadIframeContent)
			  {
				var disconnectWindow = window.open("about:blank","disconnectPage","width=240,height=70,toolbar=0,resizable=no");
			    disconnectWindow.document.write("<center>The connection with the chat server was lost!<br>");
			    disconnectWindow.document.write("<a href='' onclick='window.opener.document.getElementById(\"thread\").src = window.opener.document.getElementById(\"thread\").src; window.close()' title='reconnect chat'><font face='Arial'>Reconnect chat</font></a>     <a href='' onclick='window.close();window.opener.close();' title='reconnect chat'><font face='Arial'>Close chat</font></a></center>");
			  }
		    threadIframeContent = thread.document.body.innerHTML.length;
		    tmOut = setTimeout("checkOnlineStatus()",60000);
		  } catch (er) {
			    var disconnectWindow = window.open("about:blank","","width=240,height=70,toolbar=0,resizable=no");
			    disconnectWindow.document.write("<center>The connection with the chat server was lost!<br>");
			    disconnectWindow.document.write("<a href='about:blank' onclick='window.opener.document.getElementById(\"thread\").src = window.opener.document.getElementById(\"thread\").src; window.opener.checkOnlineStatus(); window.close();' title='reconnect chat'><font face='Arial'>Reconnect chat</font></a>     <a href='' onclick='window.close();window.opener.close();' title='reconnect chat'><font face='Arial'>Close chat</font></a></center>");
		    }
		  return null;
		}

		function onResizeEventHandler() {
		  document.getElementById("chatContents").style.width = 0;
	    document.getElementById("userList").style.width = 0;
		  document.getElementById("chatContents").style.height = 10;
	    document.getElementById("userList").style.height = 10;		  
		  document.getElementById("chatContents").style.width = document.getElementById("tdChatContents").clientWidth;
		  document.getElementById("userList").style.width = document.getElementById("tdUserList").clientWidth;
      document.getElementById("chatContents").style.height = document.getElementById("tdChatContents").clientHeight - 2;
		  document.getElementById("chatContents").style.height = document.getElementById("tdChatContents").clientHeight - 2;
		  document.getElementById("chatContents").style.height = document.getElementById("tdChatContents").clientHeight - 2;
      document.getElementById("userList").style.height = document.getElementById("tdUserList").clientHeight - 2;
		  document.getElementById("userList").style.height = document.getElementById("tdUserList").clientHeight - 2;
		  document.getElementById("userList").style.height = document.getElementById("tdUserList").clientHeight - 2;
		  document.getElementById("userList").style.height = document.getElementById("tdUserList").clientHeight - 2;
      document.getElementById("userList").style.height = document.getElementById("tdUserList").clientHeight - 2;
		  document.getElementById("chatContents").style.height = document.getElementById("tdChatContents").clientHeight - 2;
		}

	  var resizedWindow = 0;
	  var timeStampsOn = 1;
      
    // chat room was opened and time of how long this chat room is already opened is counted.
    // Time when the chat room was opened is loaded from servlet and the difference between current time and the loaded time is displayed.
    function chatTimerActive() { 
      var timerId = setInterval(
              "document.formScrollLock.chatStartedAt.value = "
            + "  parseInt(document.formScrollLock.chatStartedAt.value) + 1000;"
            + "var dt = new Date(00,0,0,0,0,0);"
            + "dt.setHours(0);"
            + "dt.setMinutes(0);"
            + "dt.setSeconds(0);"
            + "dt.setMilliseconds(parseInt(document.formScrollLock.chatStartedAt.value));"
            + "var getHours =  dt.getHours();"
            + "var getMinutes = dt.getMinutes();"
            + "var getSeconds = dt.getSeconds();"
            + "if(dt.getHours() < 10) getHours = '0'+getHours;"
            + "if(getMinutes < 10) getMinutes = '0'+getMinutes;"
            + "if(getSeconds < 10) getSeconds = '0'+getSeconds;"
            + "if(parseInt(document.formScrollLock.chatStartedAt.value)){"
            +   "document.formScrollLock.chatStart.value=''+getHours+':'+getMinutes+':'+getSeconds;"
            +  "}"
            +  "else document.formScrollLock.chatStart.value='loading time...';", 1000);
    }
	  
    // looks for URLs in the message
    function loadURL(stringWithUrl) {
	    var httpPresent = false;
	    firstEntrance = -1;
 
	    var firstEntrance_1 = stringWithUrl.indexOf('http:\/\/');
	    var firstEntrance_2 = stringWithUrl.indexOf('www.');

	    if(firstEntrance_1==-1 && firstEntrance_2==-1) return stringWithUrl;
	  
	    if(firstEntrance_1!=-1 && firstEntrance_2==-1) {firstEntrance = firstEntrance_1; httpPresent = true;}
	      else 
		      if(firstEntrance_1==-1 && firstEntrance_2!=-1) firstEntrance = firstEntrance_2;
		        else
			        if(firstEntrance_1 < firstEntrance_2) {firstEntrance = firstEntrance_1; httpPresent = true;}
			          else
				          if(firstEntrance_2 < firstEntrance_1) firstEntrance = firstEntrance_2;

	    if(firstEntrance != -1) {
		    var urlLink = "";
		    var idexOfTheEndOfTheUrl = firstEntrance;
		    for(;idexOfTheEndOfTheUrl < stringWithUrl.length;idexOfTheEndOfTheUrl++) {
			    if(stringWithUrl.charAt(idexOfTheEndOfTheUrl)==' ') {
				    if(stringWithUrl.charAt(idexOfTheEndOfTheUrl-1)=='.')
					    idexOfTheEndOfTheUrl=idexOfTheEndOfTheUrl-1;
				    break;
			    }
	      }
	      if(stringWithUrl.charAt(idexOfTheEndOfTheUrl-1)=='.')
		      idexOfTheEndOfTheUrl--;
		    urlLink += stringWithUrl.substring(0,firstEntrance);
		    urlLink += " <a target='_blank' href='";

        if(!httpPresent)
          urlLink_href='http:\/\/' + stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);
         else 
           urlLink_href=stringWithUrl.substring(firstEntrance,idexOfTheEndOfTheUrl);

        urlLink += urlLink_href + "'>" + urlLink_href + "</a>";
		    var restUrl = stringWithUrl.substring(idexOfTheEndOfTheUrl, stringWithUrl.length);
        return urlLink + loadURL(restUrl);
	    }
	  }	
    
	  // JS replaceAll function
    function replaceAllRecursion(str, replStr, replWithStr) {
	    if(str.indexOf(replStr)>=0) 
	      return f(str.replace(replStr, replWithStr), replStr, replWithStr)
	     else 
	       return str;
  	}
	
	  // JS recursive replace all function
    function replaceAll(str, replStr, replWithStr) {
	    while(str.indexOf(replStr)>=0)
	      str = str.replace(replStr, replWithStr);
	    return str;
	  }  

   /* "cleans" chat message content
    * This function removes additional but not needed lines that were added by RTE (cuz of iframe in design mode specific and difference between FireFox and Internet Explorer)
    * This function replaces <A href="www. with <A href="http://www.
    * This function looks for images signs in the message and replaces these signes with html <img> that will be displayed instead of the image
    */
    function cleanChatMessage(message) {
		  message = replaceAll(message, "<P>", "");
		  message = replaceAll(message, "</P>", "");
		  message = replaceAll(message, "\n", "");
      if(!document.all) message = replaceAll(message, "\r", ""); // just FF needs this correction. Elseway FF ads additional line.
		 
		  message = replaceAll(message, "<A href=\"www.", "<A href=\"http://www.");
      message = replaceAll(message, "<A href=", "<a target='_blank' href=");
		  message = replaceAll(message, "<a href=\"www.", "<a href=\"http://www.");
      message = replaceAll(message, "<a href=", "<a target='_blank' href=");
      
		  message = replaceAll(message, ":)","<img src='images/smileys/smiley.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ":-)","<img src='images/smileys/smiley.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ":(","<img src='images/smileys/sad.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ":-(","<img src='images/smileys/sad.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ";)","<img src='images/smileys/wink.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ";-)","<img src='images/smileys/wink.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ":D","<img src='images/smileys/laughting.gif' width='17' height='17' align='bottom'>");
		  message = replaceAll(message, ":-D","<img src='images/smileys/laughting.gif' width='17' height='17' align='bottom'>");

      return message;
    }

   /* "immediate sending messages" feature. The general idea is that the message must be sent immdeiately for the sender.
    * This means that the sender must see his sent message immediately on on the chat content div. So, thread.insertMessages
    * function is used to send the message to himself and the sent message is not added to the messages list for this member on the
    * server's side.
    */    
    function sendImmediateMessage(messageValue) {
      // offset definition
      var dt = new Date(); 
      var def = dt.getTimezoneOffset()/60;
      // alias of the sender is added
      messageValue[messageValue.length-1] += '?alias'+document.getElementById("aliasUser").value;
			// insertMessages function is called from thread iframe for immediate sending of the message for the sender
      thread.insertMessages(-def,
        dt.getTime(),
        document.getElementById(document.getElementById("aliasUser").value).color,
        document.getElementById("realUserName").value,
				messageValue);
    }
    
    // this function submits the message for all chat members and runs sendImmediateMessage function for immediate message sending for the sender
    function sendMessageF() {
		  // checks whether it is a private message. If the message doesn't start with "[" then it is not a private
      // message and this is a message to all chat members
      if (document.postForm.message.value.charAt(0) != "[") 
        document.postForm.nameUser.value = "all"; // nameUser is the contact's uri (contact that receives private message).
          
      // "clean" the message. Looking for smiles and "www." entries are reolaced with "http://www.".
      document.postForm.message.value = cleanChatMessage(document.postForm.message.value); 
      // submits the message - submitting of html form "postForm"
		  document.getElementById("postForm").submit();

     /* "immediate sending messages" feature. The general idea is that the message must be sent immdeiately for the sender.
      * This means that the sender must see his sent message immediately on on the chat content div. So, thread.insertMessages
      * function is used to send the message to himself and the sent message is not added to the messages list for this member on the
      * server's side.
      */
      if (document.postForm.message.value != "") {
        sendImmediateMessage(document.postForm.message.value.split("\n")); 
      }
      document.postForm.message.value = ""; 
      document.postForm.nameUser.value = "all";
     /* FireFox doesn't show cursor in RTE's iframe if the iframe doesn't have anything inside it.
      * This is why <br> tag is added to the content to show cursor is there is nothing in RTE chat's iframe.
      * User's entered text is added in front of the <br> tag (before it) when the chat member starts typing anything.
      * That is why this <br> tag is removed when the member sends the message
      */
      if(!document.all)
        frames.messageRTE.document.body.innerHTML = '<br>';
       else frames.messageRTE.document.body.innerHTML = '';	
    }
    
    // send message when the chat member sends the message via pushing on the send button
    function sendMessageOnButton() {
     /* FireFox doesn't show cursor in RTE's iframe if the iframe doesn't have anything inside it.
      * This is why <br> tag is added to the content to show cursor is there is nothing in RTE chat's iframe.
      * User's entered text is added in front of the <br> tag (before it) when the chat member starts typing anything.
      * That is why this <br> tag is removed when the member sends the message
      */      
      if(!document.all && frames.messageRTE.document.body.innerHTML.lastIndexOf('<br>') == frames.messageRTE.document.body.innerHTML.length - 4)
        frames.messageRTE.document.body.innerHTML = frames.messageRTE.document.body.innerHTML.substring(0,frames.messageRTE.document.body.innerHTML.length - 4);

	    updateRTE('messageRTE'); // updates RTE content. This means the content of the RTE's design mode iframe is loaded to document.postForm.messageRTE.value
		  document.postForm.message.value = document.postForm.messageRTE.value;
      // sends the message itself. postForm form is submitted. Immediate sending feature is also run here.
      sendMessageF();
    }    
    
    // key handling for chat RTE's iframe. Sending of messages on shortcuts.
    function handleKey(e) {
	    textChanged = true;
	    updateRTE('messageRTE'); // updates RTE content. This means the content of the RTE's design mode iframe is loaded to document.postForm.messageRTE.value
	  	var kk = navigator.appName == 'Netscape' ? e.which : e.keyCode;
      if (
			  ((kk == 10 || (e.ctrlKey && kk==13))&&(sendShortcut == 1))   ||
			  (kk==13 && sendShortcut==2 && !e.ctrlKey && !e.altKey && !e.shiftKey) 
      ) {
        if(e.type == "keyup") { // clear RTE content on keyUp on shortCut
          frames.messageRTE.document.body.innerHTML = ""; 
          if(!document.all) frames.messageRTE.document.body.innerHTML = '<br>';
          return;
        }
       /* FireFox doesn't show cursor in RTE's iframe if the iframe doesn't have anything inside it.
        * This is why <br> tag is added to the content to show cursor is there is nothing in RTE chat's iframe.
        * User's entered text is added in front of the <br> tag (before it) when the chat member starts typing anything.
        * That is why this <br> tag is removed when the member sends the message
        */
        if(!document.all && (frames.messageRTE.document.body.innerHTML.lastIndexOf('<br>') == frames.messageRTE.document.body.innerHTML.length - 4)) {
          frames.messageRTE.document.body.innerHTML = frames.messageRTE.document.body.innerHTML.substring(0,frames.messageRTE.document.body.innerHTML.length - 4);
        }
        updateRTE('messageRTE'); // updates RTE content. This means the content of the RTE's design mode iframe is loaded to document.postForm.messageRTE.value
		    document.postForm.message.value = document.postForm.messageRTE.value;
        
        // sends the message itself. postForm form is submitted. Immediate sending feature is also run here.
        setTimeout("sendMessageF()",200);
      } 
      // chat member's writing status. Member's writing status alert is sent every 10 chars (including the first char)
		  else if (document.postForm.messageRTE.value.length%10 == 0) {
        document.getElementById("postFormWritingStatus").submit();
      }
    }
	  
    // Show/hide timestamps
	  function clockOn(obj) {
	    if(timeStampsOn==1)	{
			  obj.src='icons/clock.gif';
			  timeStampsOn=0;
			  var i = 0;
			  while(document.getElementById('timeNid['+i+']')) {
				  document.getElementById('timeNid['+i+']').style.display='none';
				  i++;
			  }
		  }
       else {
			   obj.src='icons/clockOn.png';
			   timeStampsOn = 1;
			   var i = 0;
			   while(document.getElementById('timeNid['+i+']')) {
				   document.getElementById('timeNid['+i+']').style.display='inline';
			     i++;
         }
       }
		  document.postForm.message.focus();
	  }

	  function chatHistoryImageOnClick(obj) {
	  	if(resizedWindow==1) { 
				resizedWindow=0; 
				obj.src='icons/chatHistory.gif'; 
				window.resizeBy(-150,0); 
				document.getElementById('historyiFrame').style.width=0; 
			} 
       else { 
				 resizedWindow=1; 
				 obj.src='icons/chatHistoryActive.gif'; 
				 window.resizeBy(150,0); 
				 document.getElementById('historyiFrame').style.width=150; 
			 }
	  }
	  
    function hideOpsMenu() {
      document.getElementById("userOpsPanel").style.display = "none";
    }

    function showOpsMenu(userContactURI,user, userColor, privateTo,userInfoDisplay,sendPrivMessageDisplay,inviteToPrivChatDisplay,inviteToChatRoomDisplay,highlightDisplay,linkToResource,joinChatRoom) {
      var oldDisplay = document.getElementById("userOpsPanel").style.display.indexOf("none");
		
      if (document.all) {
        document.getElementById("userOpsPanel").style.display = "inline";
      }
       else {
         document.getElementById("userOpsPanel").style.display = "table-row";
       }

		  if(oldDisplay>=0) {
		    document.getElementById("chatContents").style.height = parseInt(document.getElementById("chatContents").clientHeight) - parseInt(document.getElementById("userOpsPanel").clientHeight);
	      document.getElementById("userList").style.height = parseInt(document.getElementById("userList").clientHeight) - parseInt(document.getElementById("userOpsPanel").clientHeight);
		  }
				
		  if((s = document.getElementById(user+'[0]'))&&(s.style.background == '#ffffff' || s.style.background.search('255, 255, 255')>0))
			  document.getElementById("highlightDisplay").src="images/highlight.gif";
		   else document.getElementById("highlightDisplay").src="images/fadelight.gif";
		  
      try {	
		    document.getElementById("sendPrivateMessagesToUser").value = privateTo;
		    document.getElementById("sendPrivateMessagesToUserRealName").value = user;
		    document.getElementById("userOpsPanelUserName").innerHTML = user;
        document.getElementById("userOpsPanelUserName").style.color = userColor;
		
		    document.getElementById("userInfoDisplay").style.display = userInfoDisplay;
		    document.getElementById("sendPrivMessageDisplay").style.display = sendPrivMessageDisplay;
		    document.getElementById("inviteToPrivChatDisplay").style.display = inviteToPrivChatDisplay;
		    document.getElementById("inviteToChatRoomDisplay").style.display = inviteToChatRoomDisplay;
		    document.getElementById("highlightDisplay").style.display = highlightDisplay;
		    document.getElementById("linkToResource").style.display = linkToResource;
		    document.getElementById("joinChatRoom").style.display = joinChatRoom;
		  } catch(ex){}
		  
      onResizeEventHandler();
    }
    
    function hideOpsMenu() {
      document.getElementById("userOpsPanel").style.display = "none";
		  onResizeEventHandler();
    }
	  
    function privateMessageIconClick() {
		  if(document.postForm.nameUser.value.indexOf("all")==-1)	{
        document.postForm.nameUser.value="all";
			  if(frames.messageRTE.document.body.innerHTML.indexOf("[")==0 && frames.messageRTE.document.body.innerHTML.indexOf("]: ")>0) {
				  frames.messageRTE.document.body.innerHTML = frames.messageRTE.document.body.innerHTML.substring(frames.messageRTE.document.body.innerHTML.indexOf("]:")+3,frames.messageRTE.document.body.innerHTML.length);
			  }
			  return;
		  }

		  document.postForm.nameUser.value = document.getElementById('sendPrivateMessagesToUser').value; 
		  frames.messageRTE.document.body.innerHTML = '['+document.getElementById('sendPrivateMessagesToUserRealName').value + ']: ' + frames.messageRTE.document.body.innerHTML;
	  }
	  
    function inviteToChatRoomIconClick() {
	    document.getElementById("nameUser").value = document.getElementById("sendPrivateMessagesToUser").value;
		  document.inviteUser.message.value="!-invtUser <font color='#FFCC00'><strong>" + parent.document.getElementById("realUserName").value + "</strong></font> invites you to the chat room <a target=_top href=" + window.location + ">" + thread.windowTitle+ "</a>";
		  document.inviteUser.submit();
		  var dt = new Date();
		  thread.insertMessages(0, dt.getTime(), '#63B4EF', "<img src='icons/information.gif' width='19' height='17'>",	new Array("Your invitation to "+document.getElementById('sendPrivateMessagesToUserRealName').value+" was just sent.?alias1"));
	  }
	  
	  /* 
     * invitation to the private room.
     * THe message "User Surname Name invites you to private chat room here"
     * "here" is a link. This is a link with onclick handler. If the chat member accepts the invitation he clicks on
     * "here" link and the message (notification) is sent to the invitation sender as an onclick event.
     */
    function inviteToPrivateChatRoomIconClick() {
	    document.getElementById("nameUser").value = document.getElementById("sendPrivateMessagesToUser").value;
		  var url = 'chatRoom?title=' + escape('Contact '+document.getElementById("realUserName").value) + '&#38;referer=' + escape(document.getElementById('infoCP'+document.getElementById("aliasUserUri").value).value);
		  document.inviteUser.message.value = "!-invtUser <font color='#FFCC00'><strong>" + 
                                          parent.document.getElementById("realUserName").value + 
                                          "</strong></font>" +
                                          " invites you to private chat room" +
                                          "<a onclick=\"" +
                                            "try {" +
                                              "document.getElementById('nameUser').value = '" + document.getElementById("aliasUserUri").value + "';" +
                                              "document.inviteUser.message.value = '!-invt'+document.getElementById('realUserName').value+ ' accepted your invitation to the one-on-one chat. Click <a href=\\'"+url+"&privateRoom=true\\'>" +
                                                                                    "here</a> to join.';document.inviteUser.submit();" +
                                            "}catch(er){}\" target=_top href=" + url + "&privateRoom=true>" +
                                          " here</a>"; 
		  document.inviteUser.submit();
		  var dt = new Date();
		  thread.insertMessages(0, dt.getTime(), '#63B4EF', "<img src='icons/information.gif' width='19' height='17'>",	new Array("Your invitation to "+document.getElementById('sendPrivateMessagesToUserRealName').value+" was just sent.?alias1"));
	  }
	  
	  function highlightMessagesIconClick() {
		  var doc = document;
		  if((s = doc.getElementById('alias'+document.getElementById("sendPrivateMessagesToUser").value+'[0]'))&&(s.style.backgroundColor == '#ffffff' || s.style.backgroundColor.search('255, 255, 255')>0))	{
        color='#ffff00'; 
        document.getElementById("highlightDisplay").src="images/fadelight.gif";
      }
		   else {
         color='#ffffff';
         document.getElementById("highlightDisplay").src="images/highlight.gif";
       }
		  var i = 0;
		  while(s = doc.getElementById('alias'+document.getElementById("sendPrivateMessagesToUser").value+'['+i+']')) {
        s.style.backgroundColor=color;i++;
      }
	  }	  
	  	  	  
	  function showUserInfWindow() {
		  var infWind = window.open("user Information","userInf","width=500,height=100");
		  var time = thread.getTimeStr(0,parseInt(document.getElementById('info'+document.getElementById('userOpsPanelUserName').innerHTML).value));
		  infWind.document.write("user <font color="+document.getElementById('info'+document.getElementById('userOpsPanelUserName').innerHTML).color+"><b>" + document.getElementById('userOpsPanelUserName').innerHTML + "</b></font> is online since:  " + time);
		  infWind.document.write("<br>Chat room the user is present in:  "+document.getElementById('userRoomIn'+document.getElementById('userOpsPanelUserName').innerHTML).value);
	  }

	  function setTitleToUserIcon(user,time,roomName) {	
		  var time = parent.thread.getTimeStr(0,parseInt(time));
		  var s = "member is present in chat room \""+roomName+"\" since " + time;
		  return s;
	  } 
    
    function addRTE() {
      //Usage: writeRichText(fieldname, html, width, height, buttons)
      var rteString = "";
      if(!document.all) rteString = "<BR>";
      writeRichText('messageRTE', rteString, '100%', 0, true, false, false, true);
      // set iframe's margin to 0 on keydown or click
      addEvent(frames['messageRTE'].document, 'click', function() {frames['messageRTE'].document.body.style.margin = 0;}, false);
      addEvent(frames['messageRTE'].document, 'keydown', function() {frames['messageRTE'].document.body.style.margin = 0;}, false);
      // add keydown handler to RTE's iframe. This is done for handling shortcuts to send the message and
      // for handling chat member's typing event (for checking member's writing status)
      addEvent(frames['messageRTE'].document, 'keydown', handleKey, false);
      addEvent(frames['messageRTE'].document, 'keyup', handleKey, false); // clear RTE content if sending on Enter. Elseway additional ampty first line is left.

    }
    
// ASK for help in chat. THe people that are responsible for support will help.
    function askForHelp(){
      parent.document.postForm.nameUser.value = 'allChatsHelp'; // notes that all chat members that are responsible for support in all rooms must receive the message
      var alertToSupportInvitation = "helpSubmitted(&#39;" + document.getElementById("realUserName").value + "&amp#39;s ask for support submitted&#39;)";
      parent.document.postForm.message.value="<font color=\"#ff0000\"><strong>Need support. Click <a onmousedown=\"" + alertToSupportInvitation + "\" href=\"" + window.location + "\">here</a> to join in chat.</strong></font>"; 
      parent.document.postForm.submit();
      parent.document.postForm.nameUser.value = "all";
    }
    function helpSubmitted(messageText){
      parent.document.postForm.aliasUser.value = parent.document.getElementById('aliasUserUri').value;
      parent.document.postForm.nameUser.value = 'allChatsHelp'; // notes that all chat members that are responsible for support in all rooms must receive the message
      parent.document.postForm.message.value = messageText; 
      parent.document.postForm.submit();
      parent.document.postForm.nameUser.value = "all";
    }
// --------START----------------   ONLINE STATUS -------(ONLINE, AWAY, DND, NA)--------------------------------------    
    // function that sends the new status of the user to all chat rooms to all chat member.
    function changeOnlineStatus(status){
      parent.document.postForm.nameUser.value = 'allChats'; // notes that all chat members in all rooms must receive the message
      parent.document.postForm.message.value="!-statusUser" + status; // message containes "!-statusUser" mask to notify that this is the message with the new member's status. status - is the new status: away, online, DND, na
      parent.document.postForm.submit();
      parent.document.postForm.nameUser.value = "all";
      setOnlineStatus(document.getElementById('aliasUserUri').value, status); // change status for the sender
    }
    
    // function that changes icon near the chat member according to the status (away, online, DND, na)
    function setOnlineStatus(userId, status) {
      if(document.getElementById("infoCP" + userId + "icon"))
        document.getElementById("infoCP" + userId + "icon").src = "/images/icon_mini_profile_" + status + ".gif";
    }
    
    var onlineStatusMenuTimer; //timer for online status menu. Menu must disappear if more than 2 seconds passed

    // show awailable chat member modes (away, online, DND, na) to let the chat meber choose the status for himself
    function showAwailableOnlineModes(obj) {
      document.getElementById('dvOnlineStatus').style.display='inline';
      document.getElementById('dvOnlineStatus').style.top=findPosY(obj) + obj.offsetHeight;
      document.getElementById('dvOnlineStatus').style.left=findPosX(obj) - 5;
    }
    
    // hide online statuses menu after 2 seconds after mouse out event
    function onlineStatusIconMouseOut() {
      clearTimeout(onlineStatusMenuTimer);
      onlineStatusMenuTimer = setTimeout("document.getElementById('dvOnlineStatus').style.display='none';",2000);
    }
    
    // mouse out. Statuses menu must not be visible any more. It must dissappear in 2 seconds.
    function clearTimeoutForStatusMenu(){
      clearTimeout(onlineStatusMenuTimer);
    }
    
    function statusMenuMouseOut() {
      onlineStatusIconMouseOut()
    }
// --------FINISH----------------   ONLINE STATUS -------(ONLINE, AWAY, DND, NA)--------------------------------------    

    function findPosX(obj) {
      var curleft = 0;
      if (obj.offsetParent) {
        while (obj.offsetParent) {
          curleft += obj.offsetLeft;
          obj = obj.offsetParent;
        }
      }
      else if (obj.x)
        curleft += obj.x;
      return curleft;
    }

    function findPosY(obj) {
      var curtop = 0;
      if (obj.offsetParent) {
        while (obj.offsetParent) {
          curtop += obj.offsetTop;
          obj = obj.offsetParent;
        }
      }
      else if (obj.y)
        curtop += obj.y;
      return curtop;
    }