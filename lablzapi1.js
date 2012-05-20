//var serverName = "mark.obval.com/urbien"; 
//var serverName = "aurora2.lablz.com";
var serverName = "urbien.com";
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
  var separator = query.indexOf('?') == -1 ? '?' : '&';
  var fullUrl = (typeof secure == 'undefined' || secure ? secureApiUrl : apiUrl) + query + separator + "callback=" + callbackName;
  var script = document.createElement('script');
  script.src = fullUrl;
  document.body.appendChild(script);        
}

Lablz.call = function(query, callbackName) {
  if (appId == null)
    throw new Error("init must be called before authenticatedCall");
  if (window.location.hash.length == 0) {
    var path = secureApiUrl + 'authenticate?';
    var queryParams = ['client_id=' + appId, 'redirect_uri=' + window.location, 'response_type=token']; //, 'state=' + ]; // CSRF protection
    var qry = queryParams.join('&');
    var url = path + qry;
    window.location = url;
  } 
  else {
    var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'
    var separator = query.indexOf('?') == -1 ? '?' : '&';
    Lablz.simpleCall(query + separator + access_token, callbackName, true);
  }
}

//Lablz.call = function(path, select, where, callbackName) {
//  if (appId == null)
//    throw new Error("init must be called before authenticated call is made");
//  if (window.location.hash.length == 0) {
//    var authPath = secureApiUrl + 'authenticate?';
//    var queryParams = ['client_id=' + encodeURIComponent(appId), 'redirect_uri=' + encodeURIComponent(window.location), 'response_type=token']; //, 'state=' + ]; // CSRF protection
//    var qry = queryParams.join('&');
//    var url = authPath + qry;
//    window.location = url;
//  } 
//  else {
//    var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'
//    var separator = query.indexOf('?') == -1 ? '?' : '&';
//    var query = "";
//    if (select)
//      query += "select=" + encodeURIComponent(select) + "&";
//    if (where)
//      query += "where=" + encodeURIComponent(where) + "&";
//    Lablz.simpleCall(path + '?' + query + access_token, callbackName, true);
//  }
//}

Lablz.printJson = function(response, overwrite) {
  var div = document.getElementById('lablz_data');
  if (div == null) {
    div = document.createElement('div');
    div.id = 'lablz_data';
    document.body.appendChild(div);
  }
  var str = JSON.stringify(response, undefined, 2);
  var pre = document.createElement('pre');
  pre.innerHTML = str;
  if (overwrite)
    div.innerHTML = "";
  div.appendChild(pre);
}
      // convert imageUri to imageUrl 
Lablz.getImageUrl = function(imgUri) {
  return imgUri == null ? null : 'http://' + serverName + imgUri.substring(imgUri.indexOf('Image') + 5);
}