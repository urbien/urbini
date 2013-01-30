/* This Source Code Form is subject to the terms of the Mozilla Public
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Represents a queriable index. Call methods on the returned object
 * to create queries.
 *
 * Example:
 *
 *   var query = Index("make").eq("BMW");
 *
 */

define(['indexedDBShim', 'jqueryIndexedDB'], function() {
//  function init() {
//    (function() {
////    IDBIndex.prototype.getAllKeys = IDBIndex.prototype.getAllKeys || IDBIndex.prototype.mozGetAllKeys;
////    IDBIndex.prototype.getAll = IDBIndex.prototype.getAll || IDBIndex.prototype.mozGetAll;
//      var getAll_ = function(fn, range, direction) {
//        return $.Deferred(function(dfd){
//          // This is the most common use of IDBKeyRange. If more specific uses of
//          // cursors are needed then a full wrapper should be created.
//          var request;
//          try {
//            if (range) {
//              request = this[fn](range instanceof IDBKeyRange ? range : IDBKeyRange.bound(range, range), direction || IDBCursor.NEXT);
//            } else {
//              request = this[fn](null, direction || IDBCursor.NEXT);
//            }
//          } catch (err) {
////            d.onerror && d.onerror(err);
//            dfd.rejectWith(request, [err]);
//            return null;
//          }
//          
//          var result = [];
//          request.onsuccess = function(ev) {
//            var cursor = ev.target.result;
//            if (cursor) {
//              result.push(cursor.value || cursor.primaryKey);
//              cursor['continue']();
//            }
//            else {
//              dfd.resolveWith(request, result);
////              d.result = result;
////              d.onsuccess && d.onsuccess(ev);
//            }
//          };
//          
////          request.onerror = d.onerror;
//          return d;
//        });
//      };
//  
//      var methods = {
//        getAllKeys: function(bound, direction) {
//          return getAll_.call(this, 'openKeyCursor', bound, direction);
//        },
//        
//        getAll: function(bound, direction) {
//          return getAll_.call(this, 'openCursor', bound, direction);
//        },
//        
//        openKeyCursor: function(bound, direction) {
//          var req = {};
//          var ocReq = bound ? this.openCursor(bound, direction) : this.openCursor(direction);
//          var toReturn = [];
//          ocReq.onsuccess = function(event) {
//            var cursor = event.target.result;
//            if (cursor) {
//              toReturn.push(cursor.primaryKey);
//              cursor['continue']();
//            }
//            else {
//              req.result = toReturn;
//              req.onsuccess && req.onsuccess.call(self, toReturn);
//            }
//          };
//          
//          ocReq.onerror = function(event) {
//            req.onerror && req.onerror.call(self, event);
//          };
//          
//          return req;
//        }
//      };
//  
//      var args = arguments;
//      for (var i = 0; i < args.length; i++) {
//        var obj = args[i];
//        for (var m in methods) {
//          if (!obj.prototype[m]) {
//            obj.getAll_ = getAll_;
//            for (var method in methods) {
//              obj.prototype[method] = obj.prototype[method] || obj.prototype['moz' + method] || methods[method];
//            }
//            
//            break;
//          }
//        }
//      }
//      
//  //    // TODO: for now, override native methods, so we can implement limit and offset
//  //    for (var i = 0; i < args.length; i++) {
//  //      var obj = args[i];
//  //      for (var m in methods) {
//  //        obj.prototype[m] = methods[m];
//  //      }
//  //    }
//    })(IDBIndex, IDBObjectStore);
//  }
  var IDBCursor = $.indexedDB.IDBCursor;
  function Index(name) {
    function queryMaker(op) {
      return function () {
        return IndexQuery(name, op, arguments);
      };
    }
    
    return {
      all:     queryMaker("all"), // for sorting
      eq:      queryMaker("eq"),
      neq:     queryMaker("neq"),
      gt:      queryMaker("gt"),
      gteq:    queryMaker("gteq"),
      lt:      queryMaker("lt"),
      lteq:    queryMaker("lteq"),
      between: queryMaker("between"),
      betweeq: queryMaker("betweeq"),
      oneof:   function oneof() {
        var values = Array.prototype.slice.call(arguments);
        var query = IndexQuery(name, "eq", [values.shift()]);
        while (values.length) {
          query = query.or(IndexQuery(name, "eq", [values.shift()]));
        }
        return query;
      }
    }
  }
  
//  /**
//   * Helper that notifies a 'success' event on a request, with a given
//   * result object. This is typically either a cursor or a result array.
//   */
//  function notifySuccess(request, result) {
//    var event = {type: "success",
//                 target: request}; //TODO complete event interface
//    request.readyState = IDBRequest.DONE;
//    request.result = result;
//    if (typeof request.onsuccess == "function") {
//      request.onsuccess(event);
//    }
//  }
//  
//  /**
//   * Create a cursor object.
//   */
//  function Cursor(store, request, keys, keyOnly) {
//    var cursor = {
//      "continue": function continue_() {
//        if (!keys.length) {
//          notifySuccess(request, undefined);
//          return;
//        }
//        var key = keys.shift();
//        if (keyOnly) {
//          cursor.key = key;
//          notifySuccess(request, cursor);
//          return;
//        }
//        var r = store.get(key);
//        r.onsuccess = function onsuccess() {
//          cursor.key = key;
//          cursor.value = r.result;
//          notifySuccess(request, cursor);
//        };
//      }
//      //TODO complete cursor interface
//    };
//    return cursor;
//  }
//  
//  /**
//   * Create a request object.
//   */
//  function Request() {
//    return {
//      result: undefined,
//      onsuccess: null,
//      onerror: null,
//      readyState: IDBRequest.LOADING
//      // TODO complete request interface
//    };
//  }
//  
//  /**
//   * Create a request that will receive a cursor.
//   *
//   * This will also kick off the query, instantiate the Cursor when the
//   * results are available, and notify the first 'success' event.
//   */
//  function CursorRequest(store, queryFunc, keyOnly) {
//    var request = Request();
//    queryFunc(store, function (keys) {
//      var cursor = Cursor(store, request, keys, keyOnly);
//      cursor.continue();
//    });
//    return request;
//  }
  
  /**
   * Create a request that will receive a result array.
   *
   * This will also kick off the query, build up the result array, and
   * notify the 'success' event.
   */
  function ResultRequest(store, queryFunc, keyOnly, limit, offset) {
    var op = keyOnly ? "getAllKeys" : "getAll";
    return queryFunc(store, op).promise();
  }
  
  /**
   * Provide a generic way to create a query object from a query function.
   * Depending on the implementation of that query function, the query could
   * produce results from an index, combine results from other queries, etc.
   */
  function Query(queryFunc, toString) {
  
    var query = {
  
      // Sadly we need to expose this to make Intersection and Union work :(
      _queryFunc: queryFunc,
      
      and: function and(query2) {
        return Intersection(query, query2);
      },
  
      or: function or(query2) {
        return Union(query, query2);
      },
  
//      openCursor: function openCursor(store) {
//        return CursorRequest(store, queryFunc, false);
//      },
//  
//      openKeyCursor: function openKeyCursor(store) {
//        return CursorRequest(store, queryFunc, true);
//      },
  
      getAll: function getAll(store) {
        return ResultRequest(store, queryFunc, false);
      },
  
      getAllKeys: function getAllKeys(store) {
        return ResultRequest(store, queryFunc, true);
      },
      
      sort: function(column, reverse) {
        return Index(column).all().setDirection(reverse ? IDBCursor.PREV : IDBCursor.NEXT).and(query);
      },

      setDirection: function(direction) {
        this.direction = direction;
        return this;
      },

      setLimit: function(limit) {
        this.limit = limit;
        return this;
      },
      
      setOffset: function(offset) {
        this.offset = offset;
        return this;        
      },
      
      setPrimaryKey: function(pKey) {
        this.primaryKey = pKey;
      },
      
      toString: toString
    };
    
    return query;
  }
  
  /**
   * Create a query object that queries an index.
   */
  function IndexQuery(indexName, operation, values) {
    var negate = false;
    var limit, offset, direction = IDBCursor.NEXT;
    var op = operation;
    if (op == "neq") {
      op = "eq";
      negate = true;
    }
  
    function makeRange() {
      var range;
      switch (op) {
        case "all":
//          range = values[0] ? IDBKeyRange.lowerBound(values[0], true) : undefined;
          range = values[0] ? [values[0], null, false, true] : undefined;
          break;
        case "eq":
//          range = IDBKeyRange.only(values[0]);
          range = values[0];
          break;
        case "lt":
//          range = IDBKeyRange.upperBound(values[0], true);
          range = [null, values[0], true, false];
          break;
        case "lteq":
//          range = IDBKeyRange.upperBound(values[0]);
          range = [null, values[0], true, true];
          break;
        case "gt":
//          range = IDBKeyRange.lowerBound(values[0], true);
          range = [values[0], null, false, true];
          break;
        case "gteq":
//          range = IDBKeyRange.lowerBound(values[0]);
//          range.upperOpen = true;
          range = [values[0], null, true, true];
          break;
        case "between":
//          range = IDBKeyRange.bound(values[0], values[1], true, true);
          range = [values[0], values[1], false, false];
          break;
        case "betweeq":
//          range = IDBKeyRange.bound(values[0], values[1]);
          range = [values[0], values[1], true, true];
          break;
      }
      
      return range;
    }

    /**
     * @param op getAll or getAllKeys
     */
    function queryIndex(store, op) {
      return $.Deferred(function(defer) {
        var qLimit = query.limit,
            qOffset = query.offset,
            direction = query.direction || direction;
        
        var index = store.index(indexName);
        var range = makeRange();
        var request = range ? index[op](range, direction) : index[op](undefined, direction);
        request.done(function(result, event) {
          if (!negate) {
            defer.resolve(arrayLimit(arrayOffset(result, qOffset), qLimit));
            return;
          }
          
          request = index[op];
          request.done(function(all, event) {
            defer.resolve(arrayLimit(arrayOffset(arraySub(all, result), qOffset), qLimit));
          }).fail(function(err, event) {
            debugger;
            console.log("err: " + JSON.stringify(err));
            defer.reject.apply(arguments);
          });
        }).fail(function(err, event) {
          console.log("err: " + JSON.stringify(err));
          debugger;
          defer.reject();
        });
      });      
    }
  
    var args = arguments;
    function toString() {
      return "IndexQuery(" + Array.prototype.slice.call(args).toSource().slice(1, -1) + ")";
    }
  
    var query = Query(queryIndex, toString);
    return query;
  }

  var SetOps = {Intersection: {name: 'Intersection', op: arrayIntersect}, Union: {name: 'Union', op: arrayUnion}};
  function SetOperation(setOp) {
    return function(query1, query2) {
//      if (!query1.indexed || !query2.indexed)
      var query;
      function queryFunc(store, op) {
        var dfd = $.Deferred();
        $.when(query1._queryFunc(store, op), query2._queryFunc(store, op)).then(function(results1, results2) {
          dfd.resolve(arrayLimit(arrayOffset(setOp.op(results1, results2, query1.primaryKey || query2.primaryKey), query.offset), query.limit));
        }, function(err) {
          debugger;
        }, function(event) {
          debugger;
        });
        
        return dfd;
      }
  
      function toString() {
        return setOp.name + "(" + query1.toString() + ", " + query2.toString() + ")";
      }
      
      return (query = Query(queryFunc, toString));
    }
  }
  
  /**
   * Create a query object that performs the intersection of two given queries.
   */
  function Intersection(query1, query2) {
    return SetOperation(SetOps.Intersection)(query1, query2);
  }
  
  /**
   * Create a query object that performs the union of two given queries.
   */
  function Union(query1, query2) {
    return SetOperation(SetOps.Union)(query1, query2);
  }
  
  function arraySub(minuend, subtrahend, primaryKey) {
    if (!minuend.length || !subtrahend.length)
      return minuend;
    
    var minKeys = primaryKey ? primaryKeys(minuend, primaryKey) : minuend;
    return subtrahend.filter(function(item) {
      item = primaryKey ? item[primaryKey] : item;
      return subtrahend.indexOf(item) == -1;
    });
  }

  function arrayOffset(foo, offset) {
    if (!offset)
      return foo;
    if (offset > foo.length)
      return [];
    
    return foo.slice(offset);
  }

  function arrayLimit(foo, limit) {
    if (!limit || limit > foo.length)
      return foo;

    return foo.slice(0, limit);
  }

  function arrayUnion(foo, bar) {
    if (!foo.length) {
      return bar;
    }
    if (!bar.length) {
      return foo;
    }
    
    return foo.concat(arraySub(bar, foo));
  }
  
  function primaryKeys(items, key) {
    var keys = [];
    for (var i = 0; i < items.length; i++) {
      keys.push(items[i][key]);
    }
    
    return keys;
  }
  
  function arrayIntersect(foo, bar, primaryKey) {
    if (!foo.length)
      return foo;
    if (!bar.length)
      return bar;
    
//    var fooKeys = primaryKey ? primaryKeys(foo, primaryKey) : foo;
    var barKeys = primaryKey ? primaryKeys(bar, primaryKey) : bar;
    return foo.filter(function(item) {
      item = primaryKey ? item[primaryKey] : item;
      return barKeys.indexOf(item) != -1;
    });
  }
  
  return {
//    init: init,
    Index: Index,
//    notifySuccess: notifySuccess,
//    Cursor: Cursor,
//    Request: Request,
//    CursorRequest: CursorRequest,
    ResultRequest: ResultRequest,
    Query: Query,
    IndexQuery: IndexQuery,
    Intersection: Intersection,
    Union: Union
//    ,
//    arraySub: arraySub,
//    arrayUnion: arrayUnion,
//    arrayIntersect: arrayIntersect,
//    offset: offset,
//    limit: limit
  };
});
