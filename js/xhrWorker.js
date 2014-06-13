onmessage = function(e){
  var command = commands[e.data.command];
  if (command)
    command(e.data.config);
};

var canBlob = typeof Blob !== 'undefined',
    originUrl = 'http://mark.obval.com/urbien';

function sendXhr(options) {
  var url = options.url,
      method = (options.type || 'GET').toUpperCase(),
      isPOST = method === 'POST', 
      isGET = method === 'GET',
      params = options.data,
      upload = false;
  
  if (typeof params !== 'undefined' && typeof params !== 'string') {
    var tmp = [];
    for (var name in params) {
      var val = params[name];
      if (canBlob && val instanceof Blob) {
        params = toFormData(params);
        upload = true;
        break;
      }
      
      tmp.push(encodeURIComponent(name) + '=' + encodeURIComponent(params[name]));
    }

    if (!upload)
      params = tmp.join('&');
  }
  
  if (!upload && params && isGET)
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

  xhr.send(params || "")
  return xhr;
}

function arrayBufferDataUri(raw) {
  var base64 = '';
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
 
  var bytes = new Uint8Array(raw);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
 
  var a, b, c, d;
  var chunk;
 
  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
   // Combine the three bytes into a single integer
   chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
 
   // Use bitmasks to extract 6-bit segments from the triplet
   a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
   b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
   c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
   d = chunk & 63 // 63       = 2^6 - 1
   // Convert the raw binary segments to the appropriate ASCII encoding
   base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }
 
  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
   chunk = bytes[mainLength]
 
   a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
   // Set the 4 least significant bits to zero
   b = (chunk & 3) << 4 // 3   = 2^2 - 1
   base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
   chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
 
   a = (chunk & 16128) >> 8 // 16128 = (2^6 - 1) << 8
   b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4
   // Set the 2 least significant bits to zero
   c = (chunk & 15) << 2 // 15    = 2^4 - 1
   base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
 
  return "data:image/png;base64," + base64;
}

var commands = {
  getImage: function(url, format) {
    if (!/^http:/.test(url))
      url = originUrl + (/^\//.test(url) ? '' : '/') + url; 
  
    var req = new XMLHttpRequest();
    req.overrideMimeType('text/plain; charset=x-user-defined')
    req.open('GET', url, false);
    req.responseType = format == 'dataUrl' ? 'arraybuffer' : 'blob';
    req.send(null);
    var data = req.mozResponseArrayBuffer || req.response;
    if (format == 'dataUrl')
      data = data && arrayBufferDataUri(data);
    
    postMessage(data);
  },
  xhr: function(options) {
    var dataType = options.dataType || 'JSON';
    
    delete options.dataType;
    var xhr;
    try {
      xhr = sendXhr(options);
    } catch (err) {
      debugger;
      postMessage({
        responseHeaders: [],
        status: 400, 
        data: {
          type: 'other', 
          details: err.message
        }
      });
      
      return;
    }
    
    var status = xhr.status;
    var text = xhr.responseText;
    var resp = {
      status: status,
      responseText: text,
      responseHeaders: xhr.getAllResponseHeaders()
    };
    
    if (text && dataType && dataType.toUpperCase() == 'JSON') {
      try {
        resp.data = JSON.parse(text);
        resp.responseText = null;
      } catch (err) {
        resp.data = {code: 400, type: 'other', details: "Couldn't parse response text: " + text};
      }
    }
    
    postMessage(resp);  //TODO: when we figure out transferrable objects, add parameter
  }
};

function toFormData(data) {
  var fd = new FormData();
  if (!data)
    return fd;
  
  var blobbed = false;
  for (var prop in data) {
    var val = data[prop];
    if (canBlob && val instanceof Blob) {
      if (!blobbed) {
        blobbed = true;
//        fd.append('enctype', "multipart/form-data");
        fd.append('-$action', 'upload');
      }
      
      fd.append(prop, val, prop);
    }
    else {
      fd.append(prop, val);
      continue;
    }
    
  }
  
  return fd;
}



/*
 * FormData for XMLHttpRequest 2  -  Polyfill for Web Worker  (c) 2012 Rob W
 * License: Creative Commons BY - http://creativecommons.org/licenses/by/3.0/
 * - append(name, value[, filename])
 * - toString: Returns an ArrayBuffer object
 * 
 * Specification: http://www.w3.org/TR/XMLHttpRequest/#formdata
 *                http://www.w3.org/TR/XMLHttpRequest/#the-send-method
 * The .append() implementation also accepts Uint8Array and ArrayBuffer objects
 * Web Workers do not natively support FormData:
 *                http://dev.w3.org/html5/workers/#apis-available-to-workers
 **/

(function() {
    // Export variable to the global scope
    (this == undefined ? self : this)['FormData'] = FormData;

    var ___send$rw = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype['send'] = function(data) {
        if (data instanceof FormData) {
            if (!data.__endedMultipart) data.__append('--' + data.boundary + '--\r\n');
            data.__endedMultipart = true;
            this.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data.boundary);
            data = new Uint8Array(data.data).buffer;
        }
        // Invoke original XHR.send
        return ___send$rw.call(this, data);
    };

    function FormData() {
        // Force a Constructor
        if (!(this instanceof FormData)) return new FormData();
        // Generate a random boundary - This must be unique with respect to the form's contents.
        this.boundary = '------RWWorkerFormDataBoundary' + Math.random().toString(36);
        var internal_data = this.data = [];
        /**
        * Internal method.
        * @param inp String | ArrayBuffer | Uint8Array  Input
        */
        this.__append = function(inp) {
            var i=0, len;
            if (typeof inp === 'string') {
                for (len=inp.length; i<len; i++)
                    internal_data.push(inp.charCodeAt(i) & 0xff);
            } else if (inp && inp.byteLength) {/*If ArrayBuffer or typed array */
                if (!('byteOffset' in inp))   /* If ArrayBuffer, wrap in view */
                    inp = new Uint8Array(inp);
                for (len=inp.byteLength; i<len; i++)
                    internal_data.push(inp[i] & 0xff);
            }
        };
    }
    /**
    * @param name     String                                  Key name
    * @param value    String|Blob|File|Uint8Array|ArrayBuffer Value
    * @param filename String                                  Optional File name (when value is not a string).
    **/
    FormData.prototype['append'] = function(name, value, filename) {
        if (this.__endedMultipart) {
            // Truncate the closing boundary
            this.data.length -= this.boundary.length + 6;
            this.__endedMultipart = false;
        }
        var valueType = Object.prototype.toString.call(value),
            part = '--' + this.boundary + '\r\n' + 
                'Content-Disposition: form-data; name="' + name + '"';

        if (/^\[object (?:Blob|File)(?:Constructor)?\]$/.test(valueType)) {
            return this.append(name,
                            new Uint8Array(new FileReaderSync().readAsArrayBuffer(value)),
                            filename || value.name);
        } else if (/^\[object (?:Uint8Array|ArrayBuffer)(?:Constructor)?\]$/.test(valueType)) {
            part += '; filename="'+ (filename || 'blob').replace(/"/g,'%22') +'"\r\n';
            part += 'Content-Type: application/octet-stream\r\n\r\n';
            this.__append(part);
            this.__append(value);
            part = '\r\n';
        } else {
            part += '\r\n\r\n' + value + '\r\n';
        }
        this.__append(part);
    };
})();
