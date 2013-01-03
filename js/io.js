function sendXhr(options) {
  var url = options.url;
  var method = (options.method || 'GET').toUpperCase();
  var xhr;
  if (XMLHttpRequest) {              
    xhr = new XMLHttpRequest();              
  } else {                                  
    xhr = new ActiveXObject("Microsoft.XMLHTTP");
  }
  
  xhr.open(method, url, false);
  
  var params = options.data;
  if (method === 'POST') {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    var tmp = [];
    for (var name in params) {
      tmp.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
    }
    
    if (tmp.length)
      params = tmp.join('&');
  }
  
  xhr.send(params);
  return xhr;
}
