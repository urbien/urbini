var autoScrolling = 'yes';
var windowTitle = parent.document.title;
var pos=0;
var titleTimeOut;
var titleScrollHandler;
var windowHasFocus='true';
var timeDelta = 0; // difference between server and client time

    function isScrollBarActivated() {
	    if(parent.document.getElementById('chatContents').scrollHeight < parent.document.getElementById('chatContents').clientHeight)
        return 0;
       else return 1;
    }

    function isScrollBarAtBottom() {
      var obj = parent.document.getElementById('chatContents'); 
	    var a = obj.scrollTop;  obj.scrollTop = obj.scrollTop + 2; 
	    if(Math.abs(a - obj.scrollTop)<=1)
	      return 1;
	     else {
		     obj.scrollTop = obj.scrollTop - 2; 
		     return 0;
		   }
	    return 1;
    }
    
    function funSetWritingStatus(idElementWritingStatus) {
      if(parent.document.getElementById(idElementWritingStatus)!=null)
        parent.document.getElementById(idElementWritingStatus).src = 'icons/chatWritingStatus.gif';
      timeId = setInterval("if(parent.document.getElementById('" + idElementWritingStatus + "')!=null)parent.document.getElementById('"+idElementWritingStatus+"').src = 'icons/chatWritingStatus.gif'",1000);
      setTimeout("if(parent.document.getElementById('" + idElementWritingStatus + "')!=null) parent.document.getElementById('"+idElementWritingStatus+"').src = 'icons/chatNotWritingStatus.gif';clearInterval("+timeId+");",5001); 
    }

    function scrollTitle() { 
   	 	if(parent.isWindowInFocus == "blured") {
        parent.document.title = windowTitle.substring(pos,windowTitle.length)+windowTitle.substring(0,pos);
        pos = (pos + 1) % windowTitle.length;
      }
    } 
	   
    // ------- START ------- INSERT MESSAGES -------------------------------------
    function insertMessages(gmtOffset,tm,userColor,userId, messageArray,notificationMode) {   
      if(messageArray[0].indexOf('!-statusUser') == 0) { // if this is a message that changes chat member status than ...
        parent.setOnlineStatus(userId, messageArray[0].substring(12,messageArray[0].length-6)); // function in chatJS.js that changes icon near the chat member according to the status (away, online, DND, na)
        return;
      }
      
	    if(messageArray[messageArray.length-2] == "") {
		    messageArray[messageArray.length-2] = messageArray[messageArray.length-1];
		    messageArray.length = messageArray.length - 1;
		  }
		
		  if(isScrollBarAtBottom())
        autoScrolling = 'yes';
       else autoScrolling = 'no';

      //--------------------------  START -------------  INVITATION MESSAGES ------------------------
       	// this is an invitation message
		  if(messageArray[0].indexOf('!-invt')==0) {
			  if(messageArray[0].indexOf('!-invtPrvRoom')==0) {
			    messageArray[0] = messageArray[0].replace("!-invtPrvRoom","");
			    parent.window.location = messageArray[0];
			    return;
			  }
			  
			  if (notificationMode==0 && window.focus && parent.isWindowInFocus=='blured')window.focus();
    			else if (notificationMode==1 && parent.isWindowInFocus=='blured')alert('New mes came to your chat room');
    				else if(notificationMode==2 && parent.isWindowInFocus=='blured') {
						  newwindow=window.open('','newMes','height=100,width=350,resizable=yes'); 
						  //newwindow.document.writeln("invitation message came to the chat room!<font color='blue' style='cursor:pointer' onclick='chatwindow=window.open(\"\",\"chat\");chatwindow.focus();window.close();'>Set focus to the chat window</font><br>");
						  newwindow.document.writeln("");
              newwindow.document.writeln("<img src='images/alert.gif' width='16' height='16' title='invitation message came to the chat room!'><span class=xs><font color='#63B4EF' id='timeNid["+timeNiD+"]'>["+getTimeStr(gmtOffset,tm)+"]</font><img src='icons/classes/invited.gif'>: <font onclick='window.close()' color=''>"+messageArray[0].replace("!-invt","").replace("target=_top","target='chat'")+"</font></span><img src='images/show.gif' width='16' height='16' title='Set focus to the chat window' style='cursor:pointer' onclick='chatwindow=window.open(\"\",\"chat\");chatwindow.focus();window.close();'><hr>");
					  }
        if(parent.chatSoundPresent == 1 && parent.soundViaApplet == 0 && parent.isWindowInFocus == "blured" && parent.document.getElementById('realUserName').value!=userId && userId!="<img src='icons/information.gif' width='19' height='17'>")
		      try {
            parent.document.getElementById('sound1').Play();
          } catch(e) {
             	if (document.all) {
               	parent.document.all.sound.src = 'chat/DingDong.wav';
             	}
           	}
			   else 
           if(parent.chatSoundPresent == 1 && parent.soundViaApplet == 1 && parent.isWindowInFocus == "blured" && parent.document.getElementById('realUserName').value!=userId) {
             parent.document.getElementById("soundAppletDiv").innerHTML = "<APPLET CODE='SoundApplet.class' height='0' width='0'></APPLET>";
           }
        var timeNiD = 0; 
		    while(parent.document.getElementById('timeNid['+timeNiD+']')) 
          timeNiD++;
        parent.document.getElementById('body1').innerHTML += " <font size='-2' color='#63B4EF' id='timeNid["+timeNiD+"]'>["+getTimeStr(gmtOffset,tm)+"]</font><img src='icons/classes/invited.gif'>: "+messageArray[0].replace("!-invt","").replace("target='_self'","target='_top'")+"<br>";
        if(autoScrolling == 'yes')  {
	       	 parent.document.getElementById('chatContents').scrollTop = parent.document.getElementById('chatContents').scrollHeight;
        }
        return;
      }
      //--------------------------  FINISH -------------  INVITATION MESSAGES ------------------------      

      // message that says the chat creation time
      // correct time is loaded and function breaks.
		  if((userId == "ChatAdministrator")&&(messageArray[0]=="?alias")) {
		    parent.document.formScrollLock.chatStartedAt.value = tm;
        return;
      }
		 
      // message that says the about somebody's writing status
		  if(messageArray[messageArray.length-1].substring(0,messageArray[messageArray.length-1].lastIndexOf('?alias'))=="..w..") {
        var idWriting = 'w'+userId;funSetWritingStatus(idWriting);
		    return;
      }
		
      // Start title scrolling in the cases that are in the if statement.
      // Title must scroll for 3 seconds.
      clearInterval(titleScrollHandler); // stop scrolling
      clearTimeout(titleTimeOut);
      parent.document.title=windowTitle;
      if(parent.isWindowInFocus == "blured" && parent.document.getElementById('realUserName').value!=userId && userId!="<img src='icons/information.gif' width='19' height='17'>" && userId != "ChatAdministrator") {
			  //clearInterval(titleScrollHandler);
        //clearTimeout(titleTimeOut);
			  titleScrollHandler = setInterval("scrollTitle()",100);
			  titleTimeOut = setTimeout("parent.document.title=windowTitle; clearInterval(titleScrollHandler);",3000);
		  }
  		
      // ---- START --- Play sound via browsers sound support (inbuild Internet Explorer opportunity to play sound and FireFox plugins)
      if(parent.chatSoundPresent == 1 && parent.soundViaApplet == 0 && parent.isWindowInFocus == "blured" && parent.document.getElementById('realUserName').value!=userId && userId!="<img src='icons/information.gif' width='19' height='17'>")
		    try {
          parent.document.getElementById('sound1').Play();
        } catch(e) {
            if (document.all) {
              parent.document.all.sound.src = 'chat/DingDong.wav';
            }
          }
			 else 
         if(parent.chatSoundPresent == 1 && parent.soundViaApplet == 1 && parent.isWindowInFocus == "blured" && parent.document.getElementById('realUserName').value!=userId) {
           parent.document.getElementById("soundAppletDiv").innerHTML = "<APPLET CODE='SoundApplet.class' height='0' width='0'></APPLET>";
         }
      // ---- Finish --- Play sound via browsers sound support (inbuild Internet Explorer opportunity to play sound and FireFox plugins)
        
		  var userAlias = messageArray[messageArray.length-1];
      userAlias = userAlias.substring(userAlias.lastIndexOf('?alias')+1,userAlias.length);
      messageArray[messageArray.length-1] = messageArray[messageArray.length-1].substring(0,messageArray[messageArray.length-1].lastIndexOf('?alias'));
      var doc = parent.document;
      var bodyRef = doc.getElementById('body1');
      if (bodyRef == null) return;
      var messageString = '';
    
      if(userId=='ChatAdministrator') { 
			  messageString+="<img src='icons/information.gif' align=bottom><span class=xs>"; 
		  } else {
          messageString += '<span class=xs><font color='+userColor+'>'; 
		    }

    	var time = getTimeStr(gmtOffset,tm-timeDelta);
      if(tm == 0)
        time = "";
      var messageStringTimeN ='';
		  messageStringTimeN+="<font size='-2'"; 
      if(userId=='ChatAdministrator') {
			  messageStringTimeN += ' style="color:#63B4EF;'; 
		  } else {
			    messageStringTimeN += ' style="color:'+userColor+';> ';
		    }
      if(doc.getElementById('timeNid[0]') != null) {
			  if(doc.getElementById('timeNid[0]').style.display!='none') {
				  messageStringTimeN+='display:inline" '; 
			  } else {
				    messageStringTimeN+='display:none" '; 
			    }
		  } else {
			    messageStringTimeN+='display:inline"'; 
		    }
        
		  var timeNiD = 0; 
		  
      // get "time index" of the time elements.
      // timeNiD will contain the last "free" index of the time objects (fonts that display time)
      // the reason of the creation of such objects array is the "display/disable timestamps" feature.
      while(doc.getElementById('timeNid['+timeNiD+']'))
		    timeNiD++;
      
      messageStringTimeN += ' id="timeNid['+timeNiD+']">'; 
      if(userId!='ChatAdministrator') { 
		    messageString+=userId;
      }
		  messageString+="</font>";
      if(time != "")
        messageStringTimeN += ' [' + time + '] </font>'; 
       else messageStringTimeN += '</font>'; 
      bodyRef.innerHTML+=messageStringTimeN + messageString + ': </span> ';
      var usernameString = '';
		
	    if(userId=='ChatAdministrator') {
		    usernameString += '<span class=xs><font color=' + messageArray[0].substring(0,messageArray[0].indexOf('-')-1) + '>'; 
		    usernameString += messageArray[0].substring(messageArray[0].indexOf('-')+1,messageArray[0].indexOf('+ ')+1);
			  usernameString=usernameString.substring(0,usernameString.length-1);
		    usernameString += '</font>';     
		    var messageS = messageArray[0].substring(messageArray[0].indexOf('+ '),messageArray[0].length);
		    messageS = messageS.replace("+","");
		    usernameString += messageS + '</span><br>';
		    bodyRef.innerHTML += usernameString;
      } else {
          if(userAlias.substring(5,userAlias.length) != parent.document.getElementById('aliasUser').value){ // no notification will be done to the sender
		        if (notificationMode==0 && window.focus && parent.isWindowInFocus=='blured') window.focus();
    	        else if (notificationMode==1 && parent.isWindowInFocus=='blured') alert('New mes came to your chat room');
    	          else if(notificationMode==2 && parent.isWindowInFocus=='blured') {
				               var mesStr = "";
				               for (i = 0; i < messageArray.length; i++) 
                       mesStr += messageArray[i];
				               newwindow=window.open('','newMes','height=100,width=350,resizable=yes'); 
				               newwindow.document.writeln("<img src='images/alert.gif' width='16' height='16' title='new mes came to the chat room'>" + messageStringTimeN + messageString + " </span>" + mesStr + " <img src='images/openFor.gif' width='16' height='16' title='Set focus to the chat window' style='cursor:pointer' onclick='chatwindow=window.open(\"\",\"chat\");chatwindow.focus();window.close();'><hr>");
			          }
		      }
		      var messageFull = "";	
		      for (i = 0; i < messageArray.length; i++)
		        messageFull += messageArray[i] + "<br>";
			    addMessageText(messageFull,doc,userId,userAlias);
        }
        
      if(autoScrolling == 'yes') {
        parent.document.getElementById('chatContents').scrollTop = parent.document.getElementById('chatContents').scrollHeight;
		  }

      return true;
    }
    // ------- FINISH ------- INSERT MESSAGES -------------------------------------

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
    
	  function setUserAlias(alias) {
      parent.document.postForm.aliasUser.value = alias; 
      parent.document.postFormWritingStatus.aliasUser.value = alias;
    }
	
	  function addMessageText(stringWithUrl,  // stringWithUrl - text to insert 
                            doc,            // userAlias - members name - "Nikolay Skripnik" f.e.
                            userAlias, 
                            contactURI) {   // contactURI - members uri
      var bodyRef = doc.getElementById('body1');       // bodyRef - the place where the text should be inserted to
      var color = '#ffffff';
		  var numberId = 0;
		  if(doc.getElementById(contactURI+'['+numberId+']')) 
		    color = doc.getElementById(contactURI+'['+numberId+']').style.backgroundColor;
		  while(doc.getElementById(contactURI+'['+numberId+']')) 
        numberId++;
		  var inHTML = "<span class='xs'>";
      inHTML +=    "<font style='background-color:" + color + "' id=\"" + contactURI+"["+numberId+"]" + "\">";
      inHTML +=     stringWithUrl;
      inHTML +=    "</font>";
      inHTML +=    "</span>";
		  bodyRef.innerHTML += inHTML;
	  }
	
	function ss_addEvent(elm, 
                       evType, 
                       useCapture, 
                       contactURI,
                       nameOfTheInsertedFont,
                       realName,color,
                       userInfoDisplay,
                       sendPrivMessageDisplay,
                       inviteToPrivChatDisplay,
                       inviteToChatRoomDisplay,
                       highlightDisplay) { 
    if (elm.addEventListener){ 
		  elm.addEventListener(evType, function () {
                                     window.parent.showOpsMenu(contactURI, 
                                                               realName, 
                                                               color,
                                                               nameOfTheInsertedFont,
                                                               userInfoDisplay,
                                                               sendPrivMessageDisplay,
                                                               inviteToPrivChatDisplay,
                                                               inviteToChatRoomDisplay,
                                                               highlightDisplay);
                                   }, useCapture); 
		} else if (elm.attachEvent) { 
			    var r = elm.attachEvent("on"+evType, function () {
                                                 window.parent.showOpsMenu(contactURI, 
                                                                           realName, 
                                                                           color,
                                                                           nameOfTheInsertedFont,
                                                                           userInfoDisplay,
                                                                           sendPrivMessageDisplay,
                                                                           inviteToPrivChatDisplay,
                                                                           inviteToChatRoomDisplay,
                                                                           highlightDisplay);
                                               } ); 
	 	    } 
	}
	
	function memberIcon_addEventMOver(elm,
                                    evType,
                                    useCapture,
                                    time) {
		if (elm.addEventListener){ 
		  elm.addEventListener(evType, function () {
                                     var d = new Date(time); 
                                     var d1 = new Date(); 
                                     var dif = d1-d;
                                     d1.setHours(0);
                                     d1.setMinutes(0);
                                     d1.setSeconds(0);
                                     d1.setMilliseconds(dif);	
                                     elm.title = elm.title.substring(0,elm.title.search(' for'))+' for ' +d1.getHours()+':'+d1.getMinutes()+':'+d1.getSeconds()
                                   }, useCapture);
		} else if (elm.attachEvent){ 
			  var r = elm.attachEvent("on"+evType, function () {
                                               var d = new Date(time);
                                               var d1 = new Date(); 
                                               var dif = d1-d;
                                               d1.setHours(0);
                                               d1.setMinutes(0);
                                               d1.setSeconds(0);
                                               d1.setMilliseconds(dif);	
                                               elm.title=elm.title.substring(0,elm.title.search(' for'))+' for ' +d1.getHours()+':'+d1.getMinutes()+':'+d1.getSeconds();
                                             }); 
	 	  } 
	}
    
	// LIST OF MEMBERS IN OTHER CHAT ROOMS, THAT CAN BE INVITEd
  function insertMembersForInvitation(membersArray,
                                      timeMembersArray,
                                      nameRoomUserIn,
                                      linkToResourcePage, 
                                      aliasesArray, 
                                      linkToContactPageArray, 
                                      membersOnlineStatusArray,
                                      isInSupportGroupArray) {
		var showPanel = 0;
		var bodyRef = parent.document.getElementById('divUsersInvite');
		
		for(i=0; i<membersArray.length; i++) {
      if(parent.document.getElementById(aliasesArray[i])==null){
        showPanel=1;
        break;
      }
    }
		if(showPanel==0)
      return;
	  
    var inHTML = "";  
		inHTML += "<br>";
    inHTML += "<font color=\"#33A3D2\">";
    inHTML += "<span class=xs>";
    inHTML += "<b>Other Chats:</b>";
    inHTML += "</span></font><br>";
		for(i=0; i<membersArray.length; i++) {	
		  if( !parent.document.getElementById(aliasesArray[i]) ) {
         if(membersOnlineStatusArray[i] == 'null') 
           membersOnlineStatusArray[i] = 'online';
		     var onlineSince = new Date(parseInt(timeMembersArray[i]));
			   inHTML += "<input type='hidden' id='infoCP"+ aliasesArray[i] +"' value='"+ linkToContactPageArray[i] +"'>";
         inHTML += "<input type='hidden' id='userRoomIn"+membersArray[i]+"' value='"+nameRoomUserIn[i]+"'>";
         inHTML += "<input type='hidden' id='info"+membersArray[i]+"' value='"+timeMembersArray[i]+"'>";
         // START -- icon. onMouseOver event is attached to this icon. Information about chat user is deisplayed when mouse over
         inHTML += "<img id='infoCP"+ aliasesArray[i] +"icon' onMouseOver='";
         inHTML +=   "var d = new Date(parseInt("+timeMembersArray[i]+"));";
         inHTML +=   "var d1 = new Date();";
         inHTML +=   "var dif = d1-d;";
         inHTML +=   "d1.setHours(0);";
         inHTML +=   "d1.setMinutes(0);";
         inHTML +=   "d1.setSeconds(0);";
         inHTML +=   "d1.setMilliseconds(dif);";
         inHTML +=   "this.title = this.title.substring(";
         inHTML +=       "0,";
         inHTML +=       "this.title.search(\" for\")";
         inHTML +=     ")";
         inHTML +=     "+\" for \" + d1.getHours() + \":\" + d1.getMinutes() + \":\" + d1.getSeconds();";
         inHTML += "'";
         inHTML += " title='"+parent.setTitleToUserIcon(membersArray[i],timeMembersArray[i],nameRoomUserIn[i])+" for'";
         inHTML += " src='images/icon_mini_profile_" + membersOnlineStatusArray[i] + ".gif'";
         inHTML += " width='16'";
         inHTML += " height='16'";
         inHTML += ">";
         
         if(isInSupportGroupArray[i] == "true") {
           inHTML += "<img onclick=askForHelp('"+ aliasesArray[i] +"') title='This chat member is in support group.' src='icons/help.gif' width='16' height='16' style='cursor:pointer'> "
         }
         
         // FINISH -- icon. onMouseOver event is attached to this icon. Information about chat user is deisplayed when mouse over
         inHTML += "<span class=xs>";

         inHTML += "<font onMouseOver='";
         inHTML +=   "var d = new Date(parseInt("+timeMembersArray[i]+"));";
         inHTML +=   "var d1 = new Date();";
         inHTML +=   "var dif = d1 - d;";
         inHTML +=   "d1.setHours(0);";
         inHTML +=   "d1.setMinutes(0);";
         inHTML +=   "d1.setSeconds(0);";
         inHTML +=   "d1.setMilliseconds(dif);";
         inHTML +=   "this.title = this.title.substring(0,this.title.search(\" for\")) + \" for \" + d1.getHours() + \":\" + d1.getMinutes() + \":\" + d1.getSeconds();' ";
         inHTML += "style='cursor:pointer' ";
         inHTML += "title='"+parent.setTitleToUserIcon(membersArray[i],timeMembersArray[i],nameRoomUserIn[i])+" for' ";
         inHTML += "onclick='window.parent.showOpsMenu(\"" + aliasesArray[i] + "\",\"" + membersArray[i] + "\", \"\",\"" + aliasesArray[i] + "\",\"inline\",\"inline\",\"inline\",\"inline\",\"none\",\"inline\",\"inline\");'";
         inHTML += ">";
         inHTML += membersArray[i];
         inHTML += "</font>";

         inHTML += "</span>";
         inHTML += "<input id='linkToResource" + membersArray[i] + "' onclick='alert(this.id)' type='hidden' value=" + linkToResourcePage[i] + ">";
         inHTML += "<br>";
         if(parent.document.getElementById('userOpsPanelUserName').innerHTML==membersArray[i])
         window.parent.showOpsMenu(aliasesArray[i],membersArray[i], '#000000',membersArray[i],'inline','inline','inline','inline','none','inline','inline');
       }
		}
	  inHTML += "<br><br><br><br><!--input type='hidden' value='' name='message' id='message'//--><!--input type='hidden' name='nameUser' id='nameUser' value=''//-->";
    inHTML += "</form>";
    bodyRef.innerHTML += inHTML;
    
	  if(!(document.getElementById('inv'+parent.document.getElementById('userOpsPanelUserName')) || 
         document.getElementById('c'+parent.document.getElementById('userOpsPanelUserName'))
        ))
      parent.hideOpsMenu();
	}
  
	function insertMembers(membersArray,usersInfArray,linkToContactPageArray, membersOnlineStatusArray, isInSupportGroupArray) {
	  var docum = parent.document;
	  docum.getElementById("bodyMembersKeeper").removeChild(docum.getElementById("divUsersContainer"));
    if(docum.getElementById("divUsersInvite"))
      docum.getElementById("bodyMembersKeeper").removeChild(docum.getElementById("divUsersInvite"));
	  var bodyRef = docum.getElementById('bodyMembersKeeper');
    if (bodyRef == null) 
      return;
    var divUsers = docum.createElement('div');
    divUsers.id = 'divUsersContainer';
    var divUsersInvite = docum.createElement('div');
    divUsersInvite.id = 'divUsersInvite';
    for (i = 0; i < membersArray.length; i+=2) {
		  // alert(linkToContactPageArray[i]); // alerts link to the contact home page (information page)
			var nameUserOnline = membersArray[i+1];
      var realUserName = membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
      //if(parent.document.getElementById('userOpsPanelUserName').innerHTML==realUserName)
			if(parent.document.getElementById('sendPrivateMessagesToUser').innerHTML==membersArray[i+1])
			  window.parent.showOpsMenu(nameUserOnline, 
                                  realUserName, 
                                  membersArray[i].substring(membersArray[i].lastIndexOf('-')+1,
                                  membersArray[i].length),nameUserOnline,
                                  'inline',
                                  'inline',
                                  'inline',
                                  'none',
                                  'inline',
                                  'none',
                                  'none');
      
      userI = docum.createElement('img');
      userI.id = 'infoCP'+ nameUserOnline + 'icon';
      if(membersOnlineStatusArray[i] == 'null') 
        membersOnlineStatusArray[i] = 'online';
      userI.src='images/icon_mini_profile_' + membersOnlineStatusArray[i] + '.gif';
      userI.width = 16; 
      userI.height = 16;
      userI.title = 'member is present since ' + getTimeStr(0,parseInt(usersInfArray[i]))+' for';
      memberIcon_addEventMOver(userI,"mouseover",false,parseInt(usersInfArray[i]));
      divUsers.appendChild(userI);
      
      if(isInSupportGroupArray[i] == "true") {
        userSupport = docum.createElement('img');
        userSupport.src='icons/help.gif';
        userSupport.width = 16; 
        userSupport.height = 16;
        userSupport.title = 'This chat member is in support group.';
        //userSupport.style.cursor = 'pointer';
        divUsers.appendChild(userSupport);
      }
            
			var userInfCP = docum.createElement('input'); // link to the contact home page (information page)
      userInfCP.type='hidden';
      userInfCP.value=linkToContactPageArray[i];
			userInfCP.id='infoCP'+nameUserOnline;
			divUsers.appendChild(userInfCP);
			
			userInf = docum.createElement('input');
      userInf.type='hidden';
      userInf.value=usersInfArray[i];
      userInf.id='info'+realUserName;
      userInf.color=membersArray[i].substring(membersArray[i].lastIndexOf('-')+1,membersArray[i].length);
      divUsers.appendChild(userInf);
			
      var spanF = docum.createElement('span');
			spanF.className = 'xs';
			divUsers.appendChild(spanF);
      var userF = docum.createElement('font');
      userF.title = 'member is present since ' + getTimeStr(0,parseInt(usersInfArray[i])) + ' for';
      memberIcon_addEventMOver(userF,"mouseover",false,parseInt(usersInfArray[i]));
      userF.style.cursor='pointer';
      userF.color = membersArray[i].substring(membersArray[i].lastIndexOf('-')+1, membersArray[i].length);
	    userF.id='c'+membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
      ss_addEvent(userF,"click",false,nameUserOnline,nameUserOnline,membersArray[i].substring(0,membersArray[i].lastIndexOf('-')),userF.color,'inline','inline','inline','none','inline');
			userF.appendChild(docum.createTextNode(membersArray[i].substring(0,membersArray[i].lastIndexOf('-'))));
   		spanF.appendChild(userF);

			var contactUriField = docum.createElement('input');
			contactUriField.type = "hidden";
			contactUriField.value = nameUserOnline;
			contactUriField.id = nameUserOnline;
			contactUriField.color = membersArray[i].substring(membersArray[i].lastIndexOf('-')+1,membersArray[i].length);
			spanF.appendChild(contactUriField);
			
	    if(realUserName!=parent.document.getElementById("realUserName").value) {
        divUsers.appendChild(docum.createTextNode(' '));
        var statusWriting = docum.createElement('img');
        statusWriting.id = 'w'+membersArray[i].substring(0,membersArray[i].lastIndexOf('-'));
        statusWriting.style.width=14; statusWriting.style.height=14;
        statusWriting.src='icons/chatNotWritingStatus.gif';
        statusWriting.style.verticalAlign='top';
        statusWriting.alt='"typing/not typing" status';
        statusWriting.title='"typing/not typing" status';
        divUsers.appendChild(statusWriting);}
		    divUsers.appendChild(docum.createElement('br'));
      }
      
      bodyRef.appendChild(divUsers);
      bodyRef.appendChild(divUsersInvite);
    }