if (typeof JSON === 'undefined' || !JSON.parse || !JSON.stringify)
  importScripts('lib/json2.js');
importScripts('io.js');
onmessage = function(event) {
  var options = event.data;
  var type = options.type;
  var xhr = sendXhr(options);
  var status = xhr.status;
  var text = xhr.responseText;
  var resp = {
    status: status,
    responseText: text
  };
  
  if (type && type.toUpperCase() == 'JSON') {
    resp.data = JSON.parse(text);
    resp.responseText = null;
  }
  
  if (status > 399 && status < 600)
    postMessage(resp);    
  else {
      
    postMessage(resp);
  }
}