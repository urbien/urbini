var canBlob = typeof Blob !== 'undefined';
function sendXhr(options) {
  var url = options.url;
  
  var method = (options.type || 'GET').toUpperCase();
  var isPOST = method === 'POST', 
      isGET = method === 'GET';
  
  var params = options.data,
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
    
  xhr.send(params)
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
