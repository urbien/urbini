define(['globals'], function(G) {
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  if (!window.requestFileSystem)
    return null;
  
  function error(level, e, defer) {
    var msg = '';

    switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
    case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
    case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
    case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
    case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
    default:
        msg = 'Unknown Error';
        break;
    }

    if (msg === 'SECURITY_ERR')
        msg = 'SECURITY_ERR: Are you using chrome incognito mode? It seems that access to "requestFileSystem" API is denied.';

    G.log(G.TAG, 'fileSystem', msg);
    defer.reject({
      error: level + ': ' + msg
    });
  };
    
  function dataURLToBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      var parts = dataURL.split(',');
      var contentType = parts[0].split(':')[1];
      var raw = parts[1];

      return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
  };

  function readAsBlob(file) {
    this.readAsDataURL(file);
    var onload = this.onload;
    this.onload = function(event) {
      event.target.result = dataURLToBlob(event.target.result);
      onload(event);
    };
  };
  
  function readFile(options) {
    return $.Deferred(function(defer) {
      options = options || {};
      var format = options.format || 'DataURL',
          filePath = options.filePath;
  
      var reader = new window.FileReader();
      var method = 'readAs' + format;
      var blobby = method === 'readAsBlob';
      if (!reader[method] && !blobby) {
        defer.reject();
        throw new Error('Invalid format ' + format);
      }
  
      getFileEntry(filePath).done(function(fileEntry) {
        fileEntry.file(function(file) {
          if (blobby)
            method = 'readAsDataURL';
          
          reader[method](file);
          reader.onload = function(e) {
            var res = e.target.result;
            defer.resolve(blobby ? dataURLToBlob(res) : res);
          };
          
        }, getErrorFunc('file read error', defer));
      }).fail(getErrorFunc('fileEntry error', defer));  
    }).promise();
  }
  
  function getFileEntry(filePath) {
    return $.Deferred(function(defer) {
      window.requestFileSystem(window.TEMPORARY, 0, onsuccess, getErrorFunc('requestFileSystem error', defer));
      function onsuccess(fileSystem) {
        function gotFile(fileEntry) {
          defer.resolve(fileEntry);
        }
        
        fileSystem.root.getFile(filePath, {create: false}, gotFile, getErrorFunc('fileEntry error', defer));
      }
    }).promise();
  };

  function getDir(fileSystem, path, options) {
    var self = this; 
    return $.Deferred(function(defer) {
      fileSystem.root.getDirectory(path, options || {create: true}, function(dirEntry) {
        defer.resolve(dirEntry);
      }, function(e) {
        defer.reject(e);
      });
    }).promise();
  };
  
  function getErrorFunc(level, dfd1) {
    return function(e, dfd2) {
      error(level, e, dfd2 || dfd1);
    }
  }

  var FileSystem = {
    TAG: 'fileSystem',
    
    createDirectory: function(fileSystem, dir) {
      return this.getDirectory(fileSystem, dir, {create: true});
    },
    
    deleteFile: function(path) {
      debugger;
      return $.Deferred(function(defer) {
        getFileEntry(path).done(function(fileEntry) {
          fileEntry.remove(defer.resolve, getErrorFunc('delete file', defer));
        }).fail(getErrorFunc('fileEntry error', defer));
      }).promise();
    },
    
    getDirectory: function(fileSystem, dir, options) {
      var self = this;
      dir = /\/$/.test(dir) ? dir : dir + '/';
      return $.Deferred(function(defer) {
        function next(promise, path) {
          var nextLevel = $.Deferred();
          promise.done(function() {
            getDir(fileSystem, path, options || {create: false}).done(nextLevel.resolve).fail(nextLevel.reject);
          }).fail(defer.reject);
          
          return nextLevel.promise();
        }

        var idx = 0;
        var promise = $.Deferred().resolve();
        while ((idx = dir.indexOf('/', idx + 1)) != -1) {
          promise = next(promise, dir.slice(0, idx));
        }
        
        promise.done(defer.resolve).fail(defer.reject);
      }).promise();
    },
    
    /**
     * config should have 'blob' and 'filePath' properties, filePath being 'path/to/filePath'
     */
    writeFile: function(config) {
      var self = this;
      return $.Deferred(function(defer) {        
        var blob = config.blob,
            size = blob.size,
            type = blob.type,
            filePath = config.filePath;
    
        window.requestFileSystem(window.TEMPORARY, size, onsuccess, getErrorFunc('requestfileSystem error', defer));    
        function onsuccess(fileSystem) {
            var directoryDfd = $.Deferred();
            var dirs = filePath.split(/[\\\/]/);
            if (dirs.length == 1) 
              directoryDfd.resolve();
            else {
              filePath = dirs.splice(dirs.length - 1)[0];
              directoryDfd = self.createDirectory(fileSystem, dirs.join('/'));
            }
            
            directoryDfd.done(function(dirEntry) {
              dirEntry.getFile(filePath, {
                  create: true,
                  exclusive: false
              }, onsuccess, getErrorFunc('fileSystem error', defer));
      
              function onsuccess(fileEntry) {
                  fileEntry.createWriter(onsuccess, getErrorFunc('fileEntry error', defer));
      
                  function onsuccess(fileWriter) {
                      fileWriter.onwriteend = function (e) {
                          defer.resolve(fileEntry);
                      };
      
                      fileWriter.onerror = getErrorFunc('fileWriter error', defer);
      
                      blob = new Blob([blob], {
                          type: type
                      });
      
                      fileWriter.write(blob);
                  }
              }
            }).fail(error);
        }    
      }).promise();
    }
  }

  var formats = ['DataURL', 'Blob', 'Text', 'ArrayBuffer', 'BinaryString'];
  $.each(formats, function(idx, format) {
    // provide convenient handles, FileSystem.readFileAsDataURL, FileSystem.readFileAsText, etc.
    FileSystem['readAs' + format] = function(filePath, context) {
      return readFile({
        filePath: filePath,
        format: format
      });
    }
  });
  
  return FileSystem;
});