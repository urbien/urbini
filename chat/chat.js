var w = 640/3, h = 480/3, cw = w/2, ch = h/2;

function openChatWindow(title, resUrl) {
  if (window.screen) {
    w = Math.floor(screen.availWidth*2/3);
    h = Math.floor(screen.availHeight*2/3);
    cw = Math.floor(screen.availWidth/6);
    ch = Math.floor((screen.availHeight)/6);
  }
  var url = 'chatRoom?title=' + title + '&referer=' + resUrl;
  window.open(url, 'chat','width='+w+',height='+h+',top='+ch+',left='+cw+', menubar=no, status=0, location=no, toolbar=no, scrollbars=no, status=no, resizable=yes');
}
