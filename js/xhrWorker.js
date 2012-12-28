importScripts('io.js');
onmessage = function(event) {
  var options = event.data;
  var type = options.type;
  var result = get(options.url);
  postMessage(type == 'JSON' ? JSON.parse(result) : result);
}