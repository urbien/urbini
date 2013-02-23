//if (typeof JSON === 'undefined' || !JSON.parse || !JSON.stringify)
//  importScripts('lib/json2.js');
//importScripts('io.js');
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

onmessage = function(event) {
  var options = event.data;
  var dataType = options.dataType || 'JSON';
  delete options.dataType;
  var xhr = sendXhr(options);
  var status = xhr.status;
  var text = xhr.responseText;
  var resp = {
    status: status,
    responseText: text
  };
  
  if (text && dataType && dataType.toUpperCase() == 'JSON') {
    try {
      resp.data = JSON.parse(text);
      resp.responseText = null;
    } catch (err) {
      resp.error = {code: status, type: 'other', details: "Couldn't parse response text"};
    }
  }
  
  if (status > 399 && status < 600)
    postMessage(resp);    
  else {
    postMessage(resp);
  }
}