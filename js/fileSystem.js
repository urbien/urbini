define('fileSystem', ['globals'], function(G) {
  window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
  if (!window.requestFileSystem)
    return null;
  
  function error(level, e, defer) {
    debugger;
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
    defer.reject(e);
  };
  
  function dataURLToBlob(dataURL, contentType) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
      var parts = dataURL.split(',');
      var contentType = parts[0].split(':')[1];
      var raw = parts[1];

      return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    contentType = contentType || parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
  };

  function readAsBlob(file, contentType) {
    this.readAsDataURL(file);
    var onload = this.onload;
    this.onload = function(event) {
      event.target.result = dataURLToBlob(event.target.result, contentType);
      onload(event);
    };
  };
  
  function getFile(filePath) {
    return $.Deferred(function(defer) {
      getFileEntry(filePath).done(function(fileEntry) {
        fileEntry.file(defer.resolve, getErrorFunc('file read error', defer));
      }).fail(getErrorFunc('fileEntry error', defer));
    }).promise();
  };
  
  function readFile(options) {
    return $.Deferred(function(defer) {
      options = options || {};
      var format = options.format || 'DataURL',
          file = options.file,
          filePath = options.filePath,
          contentType = options.contentType;
  
      var reader = new window.FileReader(),
          method = 'readAs' + format,
          blobby = method === 'readAsBlob',
          raw = method === 'readAsFile';
          
      if (!blobby && !raw && !reader[method]) {
        defer.reject();
        throw new Error('Invalid format ' + format);
      }
  
      var filePromise = file ? $.Deferred().resolve(file).promise() : getFile(filePath);
      filePromise.then(function(file) {
        if (raw) {
          defer.resolve(file);
          return;
        }
          
        if (blobby)
          method = 'readAsDataURL';
        
        reader[method](file);
        reader.onload = function(e) {
          var res = e.target.result;
          defer.resolve(blobby ? dataURLToBlob(res, contentType) : res);
        };
      }, getErrorFunc('fileEntry error', defer));
    }).promise();
  };
  
  function getFileSystem(options) {
    options = options || {};
    return $.Deferred(function(defer) {
      window.requestFileSystem(options.type || TEMP, options.size || 0, defer.resolve, defer.reject);    
    }).promise();
  };
  
  function getFileEntry(filePath, options) {
    return $.Deferred(function(defer) {
      getFileSystem({
        type: TEMP
      }).done(function(fileSystem) {
        fileSystem.root.getFile(filePath, options || {create: false}, defer.resolve, getErrorFunc('fileEntry error', defer));
      }).fail(getErrorFunc('requestFileSystem error', defer));
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

  var TEMP = window.TEMPORARY;
  var FileSystem = {
    TAG: 'fileSystem',
    getFileSystem: getFileSystem,
    getFileEntry: getFileEntry,
    createDirectory: function(fileSystem, dir) {
      return this.getDirectory.apply(this, Array.prototype.slice.call(arguments).concat({create: true}));
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
      var fsDfd = $.Deferred();
      if (fileSystem.root && fileSystem.name)
        fsDfd.resolve(fileSystem);
      else {
        var numArgs = arguments.length;
        if (numArgs < 3) {
          dir = fileSystem;
          options = dir;
          fileSystem = null;
        }
        
        getFileSystem({
          type: TEMP,
          size: 0
        }).done(fdDfd.resolve).fail(fsDfd.reject);
      }

      var fsPromise = fsDfd.promise();
      var self = this;
      dir = /\/$/.test(dir) ? dir : dir + '/';
      return $.Deferred(function(defer) {
        fsPromise.done(function(fileSystem) {
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
        });
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
    
        getFileSystem({
          type: TEMP,
          size: size
        }).done(function(fileSystem) {
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
        }).fail(getErrorFunc('requestfileSystem error', defer));
      }).promise();
    }
  }

  var formats = ['DataURL', 'Blob', 'Text', 'ArrayBuffer', 'BinaryString', 'File'];
  $.each(formats, function(idx, format) {
    // provide convenient handles, FileSystem.readFileAsDataURL, FileSystem.readFileAsText, etc.
    FileSystem['readAs' + format] = function(filePath, contentType) {
      var info = {
        format: format
      };
      
      info[filePath instanceof File ? 'file' : 'filePath'] = filePath;
      if (contentType)
        info.contentType = contentType;
      
      return readFile(info);
    }
  });
  
  return FileSystem;
});