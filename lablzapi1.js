var serverName = "mark.obval.com/obval"; 
//var serverName = "aurora2.lablz.com";
//var serverName = "www.obval.com";
//var serverName = "dev.obval.com";
var apiUrl = "http://" + serverName + "/api/v1/";
var secureApiUrl = "https://" + serverName + "/api/v1/";
var appId;

Lablz = {};

Lablz.init = function (id) {
  appId = id;
}

      // make api call with JSONP. Feed data received to function with name = callbackName 
      // where query is sth like "Coupon?where=...&select=..."
      // default to HTTPS
Lablz.simpleCall = function(query, callbackName, secure) {
  var fullUrl = (typeof secure == 'undefined' || secure ? secureApiUrl : apiUrl) + query + "&callback=" + callbackName;
  var script = document.createElement('script');
  script.src = fullUrl;
  document.body.appendChild(script);        
}
      
Lablz.call = function(query, callbackName) {
  if (appId == null)
    throw new "init must be called before authenticatedCall";
  if (window.location.hash.length == 0) {
    var path = secureApiUrl + 'authenticate?';
    var queryParams = ['client_id=' + appId, 'redirect_uri=' + window.location, 'response_type=token']; //, 'state=' + ]; // CSRF protection
    var query = queryParams.join('&');
    var url = path + query;
    window.location = url;
  } 
  else {
    var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'
    makeSecureApiCall(query + "&" + access_token, callbackName);
  }
}

Lablz.printJson = function(response) {
  var div = document.getElementById('lablz_data');
  var str = JSON.stringify(response, undefined, 2);
  output(str);
}
      
Lablz.output = function(inp) {
  toConsole(inp);
  var pre = document.createElement('pre');
  pre.innerHTML = inp;
  document.getElementById('lablz_data').appendChild(pre);
}
      // convert imageUri to imageUrl 
Lablz.getImageUrl = function(imgUri) {
  return imgUri == null ? null : 'http://' + serverName + '/' + imgUri.substring(imgUri.indexOf('url=') + 4);
}