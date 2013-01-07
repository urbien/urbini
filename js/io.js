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
  var headers = options.headers;
  if (headers) {
    for (var name in headers)
      xhr.setRequestHeader(name, headers[name]);
  }
  
  var params = options.data;
  if (method === 'POST') {
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    var tmp = [];
    tmp.push("async=1");
    for (var name in params) {
      tmp.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
    }
    
    if (tmp.length)
      params = tmp.join('&');
  }
  else
    options.url = url + (url.indexOf('?') === -1 ? url + '?' : '&') + 'async=1';
  
  xhr.send(params);
  return xhr;
}
