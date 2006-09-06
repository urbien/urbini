//var w = 640/3, h = 480/3, cw = w/2, ch = h/2;


function openChat() {
  openChatWindow(escape(document.title), escape(window.location), false);
}

function openChatWindow(title, resUrl, isChatWithTheAgent) {
  if (window.screen) {
    w = 700;//Math.floor(screen.availWidth/2) + 50;
    h = 600;//Math.floor(screen.availHeight/2)-125;
    //cw = Math.floor(screen.availWidth/4);
    //ch = Math.floor(screen.availHeight/4);
    ch = 0;
    cw = screen.availWidth - w - 15;
  }
  var url = 'chatRoom?title=' + title;
  if (resUrl.indexOf('uri') == -1) {
    if(document.getElementById('loggedContact').href == null){
      alert('Sorry, you should sign in first');
      return;
    }
    url += '&referer=' + escape(document.getElementById('loggedContact').href);
  }
  else
    url += '&referer=' + resUrl;
  if (isChatWithTheAgent)
    url += '&isChatWithTheAgent=true';
  window.open(url, 'chat','width='+w+',height='+h+',top='+ch+',left='+cw+', menubar=no, status=no, location=no, toolbar=no, scrollbars=no, resizable=yes');
}

function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  } else {
    var expires = "";
  }
  document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') 
      c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) 
      return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name,"",-1);
}