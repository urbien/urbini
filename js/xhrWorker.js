importScripts('io.js');
onmessage = function(event) {
  var options = event.data;
  var type = options.type;
  var xhr = sendXhr(options);
  var status = xhr.status;
  if (status > 399 && status < 600)
    postMessage({error: {code: status}});    
  else {
    var status = xhr.status;
    var text = xhr.responseText;
    var resp = {
      status: status, 
      responseText: text
    };
    
    if (type && type.toUpperCase() == 'JSON')
      resp.data = status == 200 ? JSON.parse(text) : null;
      
    postMessage(resp);
  }
}