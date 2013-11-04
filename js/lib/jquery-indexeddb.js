//'use strict';
define('jqueryIndexedDB', ['globals', 'indexedDBShim'], function(G) {
  var usingShim = G.dbType == 'shim';
	var indexedDB = usingShim ? window.shimIndexedDB : window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
  var IDBCursor = window.IDBCursor || window.webkitIDBCursor || {};
  if (typeof IDBCursor.PREV === "undefined")
    IDBCursor.PREV = "prev";
  
  if (typeof IDBCursor.NEXT === "undefined")
    IDBCursor.NEXT = "next";
  
  function getDefaultTransaction(mode) {
    switch (mode) {
      case 0:
			  return usingShim ? mode : "readonly";
      case 1:
        return usingShim ? mode : "readwrite";
      case "readwrite":
      case "readonly":
				return mode;
      default:
				return IDBTransaction.READ_WRITE || "readwrite";
    }
	};
	
	function abort(idbTransaction) {
	  idbTransaction && idbTransaction.readyState !== idbTransaction.DONE && idbTransaction.abort();
	};
	
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("jqueryIndexedDB", "db");
    G.log.apply(G, args);
  };

//  var pendingReqs = {},
//      pendingTrans = {},
  var pendingTransactions = [],
      pendingTransDfd = $.Deferred().resolve(),
      readyForVersionChange = pendingTransDfd.promise();
  
  function startedTransaction(idbTransaction) {
    pendingTransactions.push(idbTransaction);
    pendingTransDfd = $.Deferred();
    readyForVersionChange = pendingTransDfd.promise();
  };
  
  function finishedTransaction(idbTransaction) {
    var idx = pendingTransactions.indexOf(idbTransaction);
    if (~idx)
      Array.removeFromTo(pendingTransactions, idx, idx + 1);
    
    if (!pendingTransactions.length)
      pendingTransDfd.resolve();
  };

  $.extend({
    /**
     * The IndexedDB object used to open databases
     * @param {Object} dbName - name of the database
     * @param {Object} config - version, onupgradeneeded, onversionchange, schema
     */
    "indexedDB": function(dbName, config) {
      if (config) {
        // Parse the config argument
        if (typeof config === "number") config = {
          "version": config
        };

        var version = config.version;
        if (config.schema && !version) {
          var max = -1;
          for (var key in config.schema) {
            max = max > key ? max : key;
          }
          version = config.version || max;
        }
      }


      var wrap = {
        "request": function(req, args) {
          return $.Deferred(function(dfd) {
            try {
              var idbRequest = typeof req === "function" ? req(args) : req;
              idbRequest.onsuccess = function(e) {
                
                dfd.resolveWith(idbRequest, [idbRequest.result, e]);
              };
              idbRequest.onerror = function(e) {
								log("req failed", idbRequest, e, this);
                dfd.rejectWith(idbRequest, [idbRequest.error, e]);
              };
              if (typeof idbRequest.onblocked !== "undefined" && idbRequest.onblocked === null) {
                idbRequest.onblocked = function(e) {
								  debugger;
									log("Blocked", idbRequest, e, this);
                  var res;
                  try {
                    res = idbRequest.result;
                  } catch (e) {
                    res = null; // Required for Older Chrome versions, accessing result causes error 
                  }
                  dfd.notifyWith(idbRequest, [res, e]);
                };
              }
              if (typeof idbRequest.onupgradeneeded !== "undefined" && idbRequest.onupgradeneeded === null) {
                idbRequest.onupgradeneeded = function(e) {
                  
                  dfd.notifyWith(idbRequest, [idbRequest.result, e]);
                };
              }
            } catch (e) {
						  debugger;
              e.name = "exception";
              dfd.rejectWith(idbRequest, ["exception", e]);
            }
          });
        },
        // Wraps the IDBTransaction to return promises, and other dependent methods
        "transaction": function(idbTransaction) {
          return {
            "objectStore": function(storeName) {
              try {
                return wrap.objectStore(idbTransaction.objectStore(storeName));
              } catch (e) {
								abort(idbTransaction);
                return wrap.objectStore(null);
              }
            },
            "createObjectStore": function(storeName, storeParams) {
              try {
                return wrap.objectStore(idbTransaction.db.createObjectStore(storeName, storeParams));
              } catch (e) {
                abort(idbTransaction);
              }
            },
            "deleteObjectStore": function(storeName) {
              try {
                idbTransaction.db.deleteObjectStore(storeName);
              } catch (e) {
                abort(idbTransaction);
              }
            },
            "abort": function() {
              idbTransaction.abort();
            }
          };
        },
        "objectStore": function(idbObjectStore) {
          var result = {};
          // Define CRUD operations
          var crudOps = ["add", "put", "get", "delete", "clear", "count"];
          for (var i = 0; i < crudOps.length; i++) {
            result[crudOps[i]] = (function(op) {
              return function() {
                return wrap.request(function(args) {
                  return idbObjectStore[op].apply(idbObjectStore, args);
                }, arguments);
              };
            })(crudOps[i]);
          }

          result.each = function(callback, range, direction) {
            return wrap.cursor(function() {
              if (direction) {
                return idbObjectStore.openCursor(wrap.range(range), direction);
              } else {
                return idbObjectStore.openCursor(wrap.range(range));
              }
            }, callback);
          };

          result.getAll = function(range, direction) {
            return result._getAll(range, direction);
          };
          
          result.getAllKeys = function(range, direction) {
            return result._getAll(range, direction, true);
          };
					
					result._getAll = function(range, direction, keysOnly) {
            return $.Deferred(function(dfd) {
              var results = [];
              var callback = keysOnly ? function(result) {
                results.push(this.result.primaryKey);
              } : function(result) {
                results.push(result.value);
              }
              
//              var cPromise = 
              wrap.cursor(function() {
                var op = keysOnly ? "openKeyCursor" : "openCursor";
                if (direction) {
                  return idbObjectStore[op](wrap.range(range), direction);
                } else {
                  return idbObjectStore[op](wrap.range(range));
                }
              }, callback).done(function() {
                dfd.resolve(results);
              }).fail(function() {
                dfd.rejectWith(this, arguments);
              });
              
//              function finish() {
//                var oncomplete = this.transaction.oncomplete;
//                this.transaction.oncomplete = function() {
//                  log('getAll transaction for store ' + idbObjectStore.name + ' complete');
//                  oncomplete.apply(this, arguments);
//                  if (cPromise.state() === 'resolved')
//                    dfd.resolve(results);
//                  else
//                    dfd.rejectWith(this, arguments);
//                }
//              }
//              
//              cPromise.always(finish);
            }).promise();
					};
					
          result.index = function(name) {
            return wrap.index(function() {
              return idbObjectStore.index(name);
            });
          };

          result.createIndex = function(prop, options, indexName) {
            if (arguments.length === 2 && typeof options === "string") {
              indexName = arguments[1];
              options = null;
            }
            if (!indexName) {
              indexName = prop;
            }
            return wrap.index(function() {
              return idbObjectStore.createIndex(indexName, prop, options);
            });
          };

          result.deleteIndex = function(indexName) {
            return idbObjectStore.deleteIndex(indexName);
          };

          return result;
        },

        "range": function(r) {
          if ($.isArray(r)) {
            if (r.length === 1) {
              return IDBKeyRange.only(r[0]);
            } else {
						  var lower = r[0], upper = r[1], lOpen = typeof r[2] === 'boolean' ? r[2] : true, uOpen = typeof r[3] === 'boolean' ? r[3] : true;
						  if (lower && upper)
						    return IDBKeyRange.bound(lower, upper, lOpen, uOpen);
						  else if (lower)
                return IDBKeyRange.lowerBound(lower, lOpen);
              else
                return IDBKeyRange.upperBound(upper, uOpen);
            }
					} else if (typeof r === "undefined" || r === null) {
            return null;
          } else {
						return r.lower || r.upper ? r : IDBKeyRange.only(r);
          }
        },

        "cursor": function(idbCursor, callback) {
          return $.Deferred(function(dfd) {
            try {
              
              var cursorReq = typeof idbCursor === "function" ? idbCursor() : idbCursor;
              cursorReq.onsuccess = function(e) {
                
                if (!cursorReq.result) {
                  dfd.resolveWith(cursorReq, [null, e]);
                  return;
                }
                var elem = {
                  // Delete, update do not move 
                  "delete": function() {
                    return wrap.request(function() {
                      return cursorReq.result["delete"]();
                    });
                  },
                  "update": function(data) {
                    return wrap.request(function() {
                      return cursorReq.result["update"](data);
                    });
                  },
                  "next": function(key) {
                    this.data = key;
                  },
                  "key": cursorReq.result.key,
                  "value": cursorReq.result.value
                };
                
                dfd.notifyWith(cursorReq, [elem, e]);
                var result = callback.apply(cursorReq, [elem]);
                
                try {
                  if (result === false) {
                    dfd.resolveWith(cursorReq, [null, e]);
                  } else if (typeof result === "number") {
                    cursorReq.result["advance"].apply(cursorReq.result, [result]);
                  } else {
                    if (elem.data) cursorReq.result["continue"].apply(cursorReq.result, [elem.data]);
                    else cursorReq.result["continue"]();
                  }
                } catch (e) {
                  
                  dfd.rejectWith(cursorReq, [cursorReq.result, e]);
                }
              };
              cursorReq.onerror = function(e) {
                
                dfd.rejectWith(cursorReq, [cursorReq.result, e]);
              };
            } catch (e) {
              
              e.type = "exception";
              dfd.rejectWith(cursorReq, [null, e]);
            }
          });
        },

        "index": function(index) {
          try {
            var idbIndex = (typeof index === "function" ? index() : index);
          } catch (e) {
//						idbIndex = null;
					  throw e;
          }
          
					var indexWrapper = {
            "each": function(callback, range, direction) {
              return wrap.cursor(function() {
                if (direction) {
                  return idbIndex.openCursor(wrap.range(range), direction);
                } else {
                  return idbIndex.openCursor(wrap.range(range));
                }

              }, callback);
            },
            "eachKey": function(callback, range, direction) {
              return wrap.cursor(function() {
                if (direction) {
                  return idbIndex.openKeyCursor(wrap.range(range), direction);
                } else {
                  return idbIndex.openKeyCursor(wrap.range(range));
                }
              }, callback);
            },
            "get": function(key) {
              if (typeof idbIndex.get === "function") {
                return wrap.request(idbIndex.get(key));
              } else {
                return idbIndex.openCursor(wrap.range(key));
              }
            },
            "count": function() {
              if (typeof idbIndex.count === "function") {
                return wrap.request(idbIndex.count());
              } else {
                throw "Count not implemented for cursors";
              }
            },
            "getKey": function(key) {
              if (typeof idbIndex.getKey === "function") {
                return wrap.request(idbIndex.getKey(key));
              } else {
                return idbIndex.openKeyCursor(wrap.range(key));
              }
						},
						"_getAll": function(range, direction, keysOnly) { 
						  return $.Deferred(function(dfd) {
						    var results = [];
						    var callback = keysOnly ? function(result) {
						      results.push(this.result.primaryKey);
						    } : function(result) {
                  results.push(result.value);
                }
						    
						    wrap.cursor(function(){
						      var op = keysOnly ? "openKeyCursor" : "openCursor";
						      if (direction) {
						        return idbIndex[op](wrap.range(range), direction);
						      } else {
						        return idbIndex[op](wrap.range(range));
						      }
						    }, callback).done(function() {
						      dfd.resolve(results);
						    }).fail(function() {
						      dfd.reject();
						    });
						  }).promise();
            }
						,
            "getAll": function(callback, range, direction){
						  return indexWrapper._getAll.apply(this, arguments);
						}
//            "getAllKeys": function(callback, range, direction){
//              return this._getAll.apply(this, [callback, range, direction, true]);
//            }
          };
					
					return indexWrapper;
        }
      };


      // Start with opening the database
			var dbPromise = readyForVersionChange.then(function() {
			  return wrap.request(function(){
				//console.log("Trying to open DB with", version);
//				return version ? openReqShim(dbName, version) : openReqShim(dbName);
        return version ? indexedDB.open(dbName, parseInt(version)) : indexedDB.open(dbName);
      });
			});
      dbPromise.then(function(db, e) {
        
        db.onversionchange = function() {
          // Try to automatically close the database if there is a version change request
          if (!(config && config.onversionchange && config.onversionchange() !== false)) {
            db.close();
          }
        };
      }, function(error, e) {
        debugger;
        // Nothing much to do if an error occurs
      }, function(db, e) {
        if (e && e.type === "upgradeneeded") {
          if (config && config.schema) {
            // Assuming that version is always an integer 
						console.log("Upgrading DB to ", db.version);
            for (var i = e.oldVersion + 1; i <= e.newVersion; i++) {
              typeof config.schema[i] === "function" && config.schema[i].call(this, wrap.transaction(this.transaction));
            }
          }
          if (config && typeof config.upgrade === "function") {
            config.upgrade.call(this, wrap.transaction(this.transaction));
          }
        }
      });

      return $.extend(dbPromise, {
        "cmp": function(key1, key2) {
          return indexedDB.cmp(key1, key2);
        },
        "deleteDatabase": function() {
          // Kinda looks ugly coz DB is opened before it needs to be deleted. 
          // Blame it on the API 
          return $.Deferred(function(dfd) {
            dbPromise.then(function(db, e) {
              db.close();
              wrap.request(function() {
                return indexedDB.deleteDatabase(dbName);
              }).then(function(result, e) {
                dfd.resolveWith(this, [result, e]);
              }, function(error, e) {
                dfd.rejectWith(this, [error, e]);
              }, function(db, e) {
                dfd.notifyWith(this, [db, e]);
              });
            }, function(error, e) {
              dfd.rejectWith(this, [error, e]);
            }, function(db, e) {
              dfd.notifyWith(this, [db, e]);
            });
          });
        },
        "transaction": function(storeNames, mode) {
          !$.isArray(storeNames) && (storeNames = [storeNames]);
          mode = getDefaultTransaction(mode);
          return $.Deferred(function(dfd) {
            var idbTransaction;
            dfd.promise().always(function() {
//              delete pendingTrans[transName];
              finishedTransaction(idbTransaction);
            });
            
            dbPromise.then(function(db, e) {
              try {
                
                idbTransaction = db.transaction(storeNames, mode);
                idbTransaction._blahblah = storeNames;
                idbTransaction._dfd = dfd;
								startedTransaction(idbTransaction);
                
                idbTransaction.onabort = idbTransaction.onerror = function(e) {
                  dfd.rejectWith(idbTransaction, [e]);
                };
                idbTransaction.oncomplete = function(e) {
                  dfd.resolveWith(idbTransaction, [e]);
                };
              } catch (e) {
								console.log("Creating a transaction failed", e, storeNames, mode, this);
                e.type = "exception";
                dfd.rejectWith(this, [e]);
                return;
              }
              try {
                dfd.notifyWith(idbTransaction, [wrap.transaction(idbTransaction)]);
              } catch (e) {
                e.type = "exception";
                dfd.rejectWith(this, [e]);
              }
            }, function(err, e) {
              dfd.rejectWith(this, [e, err]);
            }, function(res, e) {
              
              //dfd.notifyWith(this, ["", e]);
            });

          });
        },
        "objectStore": function(storeName, mode) {
          var me = this,
            result = {};

          function op(callback) {
            return $.Deferred(function(dfd) {
              function onTransactionProgress(trans, callback) {
                try {
                  
                  callback(trans.objectStore(storeName)).then(function(result, e) {
                    dfd.resolveWith(this, [result, e]);
                  }, function(err, e) {
                    dfd.rejectWith(this, [err, e]);
                  });
                } catch (e) {
                  
                  e.name = "exception";
                  dfd.rejectWith(trans, [e, e]);
                }
              }
              me.transaction(storeName, getDefaultTransaction(mode)).then(function() {
                
                // Nothing to do when transaction is complete
              }, function(err, e) {
                // If transaction fails, CrudOp fails
								if (err && err.code === err.NOT_FOUND_ERR && (mode === true || typeof mode === "object")) {
									//console.log("Object Not found, so will try to create one now");
                  var db = this.result;
                  db.close();
									dbPromise = readyForVersionChange.then(function() {
									  return wrap.request(function(){
										//console.log("Now trying to open the database again", db.version);
//										return openReqShim(dbName, (parseInt(db.version, 10) || 1) + 1);
                    return indexedDB.open(dbName, (parseInt(db.version, 10) || 1) + 1);
                  });
								  });
                  dbPromise.then(function(db, e) {
                    
                    db.onversionchange = function() {
                      // Try to automatically close the database if there is a version change request
                      if (!(config && config.onversionchange && config.onversionchange() !== false)) {
                        db.close();
                      }
                    };
                    me.transaction(storeName, getDefaultTransaction(mode)).then(function() {
                      
                      // Nothing much to do
                    }, function(err, e) {
                      dfd.rejectWith(this, [err, e]);
                    }, function(trans, e) {
                      
                      onTransactionProgress(trans, callback);
                    });
                  }, function(err, e) {
                    dfd.rejectWith(this, [err, e]);
                  }, function(db, e) {
                    if (e.type === "upgradeneeded") {
                      try {
                        
                        db.createObjectStore(storeName, mode === true ? {
                          "autoIncrement": true
                        } : mode);
                        
                      } catch (ex) {
                        
                        dfd.rejectWith(this, [ex, e]);
                      }
                    }
                  });
                } else {
								  debugger;
									console.log("Error in transaction inside object store", err);
                  dfd.rejectWith(this, [err, e]);
                }
              }, function(trans) {
                
                onTransactionProgress(trans, callback);
              });
            });
          }

          function crudOp(opName, args) {
            return op(function(wrappedObjectStore) {
              return wrappedObjectStore[opName].apply(wrappedObjectStore, args);
            });
          }

          function indexOp(opName, indexName, args) {
            return op(function(wrappedObjectStore) {
              var index = wrappedObjectStore.index(indexName);
              return index[opName].apply(index[opName], args);
            });
          }

					var crud = ["add", "delete", "get", "put", "clear", "count", "each", "getAll", "getAllKeys"];
          for (var i = 0; i < crud.length; i++) {
            result[crud[i]] = (function(op) {
              return function() {
                return crudOp(op, arguments);
              };
            })(crud[i]);
          }

          result.index = function(indexName) {
            return {
              "each": function(callback, range, direction) {
                return indexOp("each", indexName, [callback, range, direction]);
              },
              "eachKey": function(callback, range, direction) {
                return indexOp("eachKey", indexName, [callback, range, direction]);
              },
              "get": function(key) {
                return indexOp("get", indexName, [key]);
              },
              "count": function() {
                return indexOp("count", indexName, []);
              },
              "getKey": function(key) {
                return indexOp("getKey", indexName, [key]);
              },
							"getAll": function(range, direction){
							  return indexOp("_getAll", indexName, [range, direction]);
							},
              "getAllKeys": function(range, direction){
                return indexOp("_getAll", indexName, [range, direction, true]);
              }
            };
          };

          return result;
        }
      });
    }
  });

	if (usingShim) {
	  $.indexedDB.IDBCursor = idbModules.IDBCursor;
	  $.indexedDB.IDBTransaction = idbModules.IDBTransaction;
	}
	else {
    $.indexedDB.IDBCursor = IDBCursor;
    $.indexedDB.IDBTransaction = IDBTransaction;
	}
	
  $.idb = $.indexedDB;
});
