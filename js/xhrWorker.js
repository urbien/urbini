importScripts('io.js');
onmessage = function(event) {
  var options = event.data;
  var type = options.type;
  var xhr = sendXhr(options);
  var status = xhr.status;
  if (status > 399 && status < 600)
    postMessage({error: {code: status}});    
  else
    postMessage((type && type.toUpperCase() == 'JSON') ? JSON.parse(xhr.responseText) : xhr.responseText);
}