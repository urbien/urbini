      var serverName = "mark.obval.com/obval"; 
//      var serverName = "aurora2.lablz.com";
//      var serverName = "www.obval.com";
//    var serverName = "dev.obval.com";
      var apiUrl = "http://" + serverName + "/api/v1/";
      var secureApiUrl = "https://" + serverName + "/api/v1/";


      // make api call with JSONP. Feed data received to function with name = callbackName 
      // where query is sth like "Coupon?where=...&select=..."      
      function makeApiCall(query, callbackName) {
        var fullUrl = apiUrl + query + "&callback=" + callbackName;
        var script = document.createElement('script');
        script.src = fullUrl;
        document.body.appendChild(script);        
      }

      function makeSecureApiCall(query, callbackName) {
        var fullUrl = secureApiUrl + query + "&callback=" + callbackName;
        var script = document.createElement('script');
        script.src = fullUrl;
        document.body.appendChild(script);        
      }
      
      function makeAuthenticatedApiCall(query, callbackName) {
        if (window.location.hash.length == 0) {
          var appID = "f57c0964f4442fc37597aede2f05681";
          var path = secureApiUrl + 'authenticate?';
          var queryParams = ['client_id=' + appID, 'redirect_uri=' + window.location, 'response_type=token']; //, 'state=' + ]; // CSRF protection
          var query = queryParams.join('&');
          var url = path + query;
          window.location = url;
        } 
        else {
          var access_token = window.location.hash.substring(1); // sth like 'access_token=erefkdsnfkldsjflkdsjflsdfs'
          makeSecureApiCall(query + "&" + access_token, callbackName);
        }
      }

      function printJson(response) {
        var div = document.getElementById('lablz_data');
        var str = JSON.stringify(response, undefined, 2);
        output(str);
      }
      
      function output(inp) {
        toConsole(inp);
        var pre = document.createElement('pre');
        pre.innerHTML = inp;
        document.getElementById('lablz_data').appendChild(pre);
      }

      // convert imageUri to imageUrl 
      function getImageUrl(imgUri) {
        return imgUri == null ? null : 'http://' + serverName + '/' + imgUri.substring(imgUri.indexOf('url=') + 4);
      }