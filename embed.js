embed_HF_widget();
function embed_HF_widget() {
  var scripts = document.getElementsByTagName('script');
  var thisScript = scripts[scripts.length - 1];
  var queryStr = thisScript.src.replace(/^[^\?]+\??/,'');
  if (!queryStr)
    return;

  var params = new Array ();
  // breaking key=value pairs out on the semi-colon (;) or ampersand1 (&)
  var pairs = queryStr.split(/[;&]/);
  for (var i = 0; i < pairs.length; i++) {
    var key_val = pairs[i].split('=');
    if (!key_val || key_val.length != 2)
      continue;
    var key = unescape(key_val[0]);
    var val = unescape(key_val[1]);
    val = val.replace(/\+/g, ' ');
    params[key] = val;
  }
  var iframeParams = "";
  // surports parameters: 1)url 2)width 3)height
  for(i in params) {
    if(i == "url")
      iframeParams += " src=" + params[i];
    else if(i == "width")
      iframeParams += " width=" + params[i];
    else if(i == "height")
      iframeParams += " height=" + params[i];
  }
  var html = "<iframe " + iframeParams + "> </iframe>";
  document.write(html);
}
