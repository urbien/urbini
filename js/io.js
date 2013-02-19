function sendXhr(options) {
  var url = options.url;
  
  var method = (options.type || 'GET').toUpperCase();
  var isPOST = method === 'POST', 
      isGET = method === 'GET';
  
  var params = options.data;
  if (typeof params !== 'undefined' && typeof params !== 'string') {
    var tmp = [];
    for (var name in params) {
      tmp.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
    }
    
    params = tmp.join('&');
  }
  
  if (params && isGET)
    url = url + '?' + params;
  
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
  
  if (isPOST)
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    
  xhr.send(params);
  return xhr;
}
