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

define(['cache!indexedDBShim'], function() {
  (function() {
//    IDBIndex.prototype.getAllKeys = IDBIndex.prototype.getAllKeys || IDBIndex.prototype.mozGetAllKeys;
//    IDBIndex.prototype.getAll = IDBIndex.prototype.getAll || IDBIndex.prototype.mozGetAll;
    var getAll_ = function(fn, range, direction) {
      // This is the most common use of IDBKeyRange. If more specific uses of
      // cursors are needed then a full wrapper should be created.
      var d = {};
      var request;
      try {
        if (range) {
          request = this[fn](range instanceof IDBKeyRange ? range : IDBKeyRange.bound(range, range), direction || IDBCursor.NEXT);
        } else {
          request = this[fn](null, direction || IDBCursor.NEXT);
        }
      } catch (err) {
        d.onerror && d.onerror(err);
        return null;
      }
      
      var result = [];
      request.onsuccess = function(ev) {
        var cursor = ev.target.result;
        if (cursor) {
          result.push(cursor.value || cursor.primaryKey);
          cursor['continue']();
        }
        else {
          d.result = result;
          d.onsuccess && d.onsuccess(ev);
        }
      };
      
      request.onerror = d.onerror;
      return d;
    };

    var methods = {
      getAllKeys: function(bound, direction) {
        return getAll_.call(this, 'openKeyCursor', bound, direction);
      },
      
      getAll: function(bound, direction) {
        return getAll_.call(this, 'openCursor', bound, direction);
      },
      
      openKeyCursor: function(bound, direction) {
        var req = {};
        var ocReq = bound ? this.openCursor(bound, direction) : this.openCursor(direction);
        var toReturn = [];
        ocReq.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            toReturn.push(cursor.primaryKey);
            cursor['continue']();
          }
          else {
            req.result = toReturn;
            req.onsuccess && req.onsuccess.call(self, toReturn);
          }
        };
        
        ocReq.onerror = function(event) {
          req.onerror && req.onerror.call(self, event);
        };
        
        return req;
      }
    };

    var args = arguments;
    for (var i = 0; i < args.length; i++) {
      var obj = args[i];
      for (var m in methods) {
        if (!obj.prototype[m]) {
          obj.getAll_ = getAll_;
          for (var method in methods) {
            obj.prototype[m] = obj.prototype[m] || obj.prototype['moz' + m] || methods[method];
          }
          
          break;
        }
      }
    }
  })(IDBIndex, IDBObjectStore);
  
  function Index(name, direction) {
    function queryMaker(op) {
      return function () {
        return IndexQuery(name, op, direction, arguments);
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
        var query = IndexQuery(name, "eq", direction, [values.shift()]);
        while (values.length) {
          query = query.or(IndexQuery(name, "eq", direction, [values.shift()]));
        }
        return query;
      }
    }
  }
  
  /**
   * Helper that notifies a 'success' event on a request, with a given
   * result object. This is typically either a cursor or a result array.
   */
  function notifySuccess(request, result) {
    var event = {type: "success",
                 target: request}; //TODO complete event interface
    request.readyState = IDBRequest.DONE;
    request.result = result;
    if (typeof request.onsuccess == "function") {
      request.onsuccess(event);
    }
  }
  
  /**
   * Create a cursor object.
   */
  function Cursor(store, request, keys, keyOnly) {
    var cursor = {
      continue: function continue_() {
        if (!keys.length) {
          notifySuccess(request, undefined);
          return;
        }
        var key = keys.shift();
        if (keyOnly) {
          cursor.key = key;
          notifySuccess(request, cursor);
          return;
        }
        var r = store.get(key);
        r.onsuccess = function onsuccess() {
          cursor.key = key;
          cursor.value = r.result;
          notifySuccess(request, cursor);
        };
      }
      //TODO complete cursor interface
    };
    return cursor;
  }
  
  /**
   * Create a request object.
   */
  function Request() {
    return {
      result: undefined,
      onsuccess: null,
      onerror: null,
      readyState: IDBRequest.LOADING
      // TODO complete request interface
    };
  }
  
  /**
   * Create a request that will receive a cursor.
   *
   * This will also kick off the query, instantiate the Cursor when the
   * results are available, and notify the first 'success' event.
   */
  function CursorRequest(store, queryFunc, keyOnly) {
    var request = Request();
    queryFunc(store, function (keys) {
      var cursor = Cursor(store, request, keys, keyOnly);
      cursor.continue();
    });
    return request;
  }
  
  /**
   * Create a request that will receive a result array.
   *
   * This will also kick off the query, build up the result array, and
   * notify the 'success' event.
   */
  function ResultRequest(store, queryFunc, keyOnly) {
    var request = Request();
    queryFunc(store, function (keys) {
      if (keyOnly || !keys.length) {
        notifySuccess(request, keys);
        return;
      }
      var results = [];
      function getNext() {
        var r = store.get(keys.shift());
        r.onsuccess = function onsuccess() {
          results.push(r.result);
          if (!keys.length) {
            notifySuccess(request, results);
            return;
          }
          getNext();
        };
      }
      getNext();
    });
    return request;
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
  
      openCursor: function openCursor(store) {
        return CursorRequest(store, queryFunc, false);
      },
  
      openKeyCursor: function openKeyCursor(store) {
        return CursorRequest(store, queryFunc, true);
      },
  
      getAll: function getAll(store) {
        return ResultRequest(store, queryFunc, false);
      },
  
      getAllKeys: function getAllKeys(store) {
        return ResultRequest(store, queryFunc, true);
      },
      
      sort: function(column, reverse) {
        return Index(column, reverse ? IDBCursor.PREV : IDBCursor.NEXT).all().and(query);
      },
  
      toString: toString
    };
    
    return query;
  }
  
  /**
   * Create a query object that queries an index.
   */
  function IndexQuery(indexName, operation, direction, values) {
    var negate = false;
    direction = direction || IDBCursor.NEXT;
    var op = operation;
    if (op == "neq") {
      op = "eq";
      negate = true;
    }
  
    function makeRange() {
      var range;
      switch (op) {
        case "all":
          range = values[0] ? IDBKeyRange.lowerBound(values[0], true) : null;
          break;
        case "eq":
          range = IDBKeyRange.only(values[0]);
          break;
        case "lt":
          range = IDBKeyRange.upperBound(values[0], true);
          break;
        case "lteq":
          range = IDBKeyRange.upperBound(values[0]);
          break;
        case "gt":
          range = IDBKeyRange.lowerBound(values[0], true);
          break;
        case "gteq":
          range = IDBKeyRange.lowerBound(values[0]);
          range.upperOpen = true;
          break;
        case "between":
          range = IDBKeyRange.bound(values[0], values[1], true, true);
          break;
        case "betweeq":
          range = IDBKeyRange.bound(values[0], values[1]);
          break;
      }
      
      return range;
    }
  
    function queryKeys(store, callback) {
      var index = store.index(indexName);
      var range = makeRange();
      var request = range ? index.getAllKeys(range, direction) : index.getAllKeys(undefined, direction);
      request.onsuccess = function onsuccess(event) {
        var result = request.result;
        if (!negate) {
          callback(result);
          return;
        }
  
        // Deal with the negation case. This means we fetch all keys and then
        // subtract the original result from it.
        request = index.getAllKeys();
        request.onsuccess = function onsuccess(event) {
          var all = request.result;
          callback(arraySub(all, result));
        };
      };
      
      request.onerror = function onerror(event) {
        console.log("err: " + JSON.stringify(event));
      }
    }
  
    var args = arguments;
    function toString() {
      return "IndexQuery(" + Array.prototype.slice.call(args).toSource().slice(1, -1) + ")";
    }
  
    return Query(queryKeys, toString);
  }

  var SetOps = {Intersection: {name: 'Intersection', op: arrayIntersect}, Union: {name: 'Union', op: arrayUnion}};
  function SetOperation(setOp) {
    return function(query1, query2) {
//      if (!query1.indexed || !query2.indexed)
      function queryKeys(store, callback) {
        var firstResult;
        var finish = function(keys) {
//          console.log('finished query: ' + (this == query1 ? query1 : query2).toString());
          if (!firstResult)
            firstResult = keys;            
          else 
            callback(setOp.op(firstResult, keys))
        }
    
        query1._queryFunc(store, finish);
//        console.log('started query: ' + query1.toString());
        query2._queryFunc(store, finish);
//        console.log('started query: ' + query2.toString());
      }
  
      function toString() {
        return setOp.name + "(" + query1.toString() + ", " + query2.toString() + ")";
      }
      
      return Query(queryKeys, toString);
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
  
  
  function arraySub(minuend, subtrahend) {
    if (!minuend.length || !subtrahend.length) {
      return minuend;
    }
    return minuend.filter(function(item) {
      return subtrahend.indexOf(item) == -1;
    });
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
  
  function arrayIntersect(foo, bar) {
    if (!foo.length) {
      return foo;
    }
    if (!bar.length) {
      return bar;
    }
    return foo.filter(function(item) {
      return bar.indexOf(item) != -1;
    });
  }
  
  return {
    Index: Index,
    notifySuccess: notifySuccess,
    Cursor: Cursor,
    Request: Request,
    CursorRequest: CursorRequest,
    ResultRequest: ResultRequest,
    Query: Query,
    IndexQuery: IndexQuery,
    Intersection: Intersection,
    Union: Union,
    arraySub: arraySub,
    arrayUnion: arrayUnion,
    arrayIntersect: arrayIntersect
  };
});
