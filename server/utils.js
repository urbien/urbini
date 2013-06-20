var Q = require('q'),
    http = require('http'),
  _ = require('underscore'),
    parseURL = require('url').parse;


String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

function parseResponse(response) {
  var dfd = Q.defer();
  var str = '';
  //defer[method](error, response, body);
  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });
  
  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    dfd.resolve(str);
  });
  
  return dfd.promise;
}

module.exports = {
  /**
   * promise-based interface to making GET request
   **/
  get: function(url, options) {
    options = options || {};
    var defer = Q.defer(),
        parsed = parseURL(url);
        
    _.defaults(options, {
      host: parsed.host, 
      path: parsed.path,
      headers: {
        'user-agent': 'Mozilla/5.0'
      }
    });
  
    callback = function(response) {
      parseResponse(response).then(defer.resolve);
    },
    req = http.request(options, callback);
    
    req.on("error", function(e){
    debugger;
      defer.reject(e);
    });
  
  req.end();
  
    return defer.promise;
  },

  /**
   * promise-based interface to making POST request
   **/
  post: function(url) {
    return this.get(url, {
      method: 'POST'
    });
  },
  
  getQueryString: function(paramMap, options) {
    options = options || {};
    var keys = [],
    qs = '';
    for (var p in paramMap) {
      if (typeof paramMap[p] !== 'undefined') {
        keys.push(p);
      }
    }

    keys.sort();
    for (i = 0; i < keys.length; i++) {
      keys[i] = keys[i] + '=' + encodeURIComponent(paramMap[keys[i]]);
    }

    return keys.join(options.delimiter || '&');
  }
};