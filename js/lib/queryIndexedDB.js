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

//'use strict';
define('queryIndexedDB', ['jqueryIndexedDB'], function() {
  var IDBCursor = $.indexedDB.IDBCursor;
  var DEFAULT_PRIMARY_KEY = '__uri';
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
        var values;
        if (Object.prototype.toString.call(arguments[0]) === '[object Array]')
          values = arguments[0];
        else
          values = Array.prototype.slice.call(arguments);

        var query = IndexQuery(name, "eq", [values.shift()]);
        while (values.length) {
          query = query.or(IndexQuery(name, "eq", [values.shift()]));
        }
        return query;
      },
      noneof:  function oneof() {
        var values;
        if (Object.prototype.toString.call(arguments[0]) === '[object Array]')
          values = arguments[0];
        else
          values = Array.prototype.slice.call(arguments);

        var query = IndexQuery(name, "neq", [values.shift()]);
        while (values.length) {
          query = query.and(IndexQuery(name, "neq", [values.shift()]));
        }

        return query;
      }
    }
  }

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

      getAll: function getAll(store) {
        return ResultRequest(store, queryFunc, false);
      },

      getAllKeys: function getAllKeys(store) {
        return ResultRequest(store, queryFunc, true);
      },

      sort: function(column, reverse) {
        if (typeof column === 'function')
          this.sortFunction = column;
        else
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
        return this;
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
          range = values[0] ? [values[0], null] : undefined;
          break;
        case "eq":
          range = values[0];
          break;
        case "lt":
          range = [null, values[0], true, true];
          break;
        case "lteq":
          range = [null, values[0], true, false];
          break;
        case "gt":
          range = [values[0], null, true, true];
          break;
        case "gteq":
          range = [values[0], null, false, true];
          break;
        case "between":
          range = [values[0], values[1], true, true];
          break;
        case "betweeq":
          range = [values[0], values[1], false, false];
          break;
      }

      return range;
    }

    /**
     * @param op getAll or getAllKeys
     */
    function queryIndex(store, op) {
//      console.log("querying index: " + indexName);
      return $.Deferred(function(defer) {
//        var qLimit = query.limit,
        var qOffset = query.offset,
            direction = query.direction || direction,
            sort = query.sortFunction;

        var index = store.index(indexName);
        var range = makeRange();
        var request = typeof range !== 'undefined' ? index[op](range, direction) : index[op](undefined, direction);
        request.done(function(result, event) {
          if (!negate) {
//            console.log("querying index finished: " + indexName);
//            defer.resolve(arrayLimit(arrayOffset(result.sort(sort), qOffset), qLimit));
            // we don't want to LIMIT every time, until we're done with the whole operation (this may be a subquery and by limiting now, we may not have enough later)
            defer.resolve(arrayOffset(sort ? result.sort(sort) : result, qOffset));
            return;
          }

          request = store.getAll();
//          request = index[op]();
          request.done(function(all, event) {
//            defer.resolve(arrayLimit(arrayOffset(arraySub(all, result).sort(sort), qOffset), qLimit));
//            console.log("querying index finished: " + indexName);
            defer.resolve(arrayOffset(arraySub(all, result).sort(sort), qOffset));
          }).fail(function(err, event) {
            debugger;
            console.log("err: " + JSON.stringify(err));
            defer.reject.apply(arguments);
          });
        }).fail(function(err, event) {
          console.log("err: " + JSON.stringify(err));
          debugger;
          defer.reject.apply(arguments);
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

  var SetOps = {
    Intersection: {
      name: 'Intersection',
      op: arrayIntersect
    },
    Union: {
      name: 'Union',
      op: arrayUnion
    }
  };

  function SetOperation(setOp) {
    return function(query1, query2) {
      var query;
      function queryFunc(store, op) {
        var q1 = query1._queryFunc(store, op),
            q2 = query2._queryFunc(store, op);

        return $.when(q1, q2).then(function(results1, results2) {
          var sort = query.sortFunction,
              unsorted = setOp.op(results1, results2, query1.primaryKey || query2.primaryKey),
              sorted = sort ? unsorted.sort() : unsorted;

          return arrayLimit(arrayOffset(sorted, query.offset), query.limit);
        }, function(err) {
          debugger;
        }, function(event) {
          debugger;
        });
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

    primaryKey = primaryKey || DEFAULT_PRIMARY_KEY;
//    var minKeys = primaryKey ? primaryKeys(minuend, primaryKey) : minuend;
    var subKeys = primaryKeys(subtrahend, primaryKey);
    return minuend.filter(function(item) {
      item = item[primaryKey]; //primaryKey ? item[primaryKey] : item;
      return subKeys.indexOf(item) == -1;
    });
  }

  function arrayOffset(foo, offset) {
    if (!offset)
      return foo;
    if (offset > foo.length)
      return [];

    return Array.removeFromTo(foo, 0, offset);
  }

  function arrayLimit(foo, limit) {
    if (!limit || limit > foo.length)
      return foo;

    return Array.removeFromTo(foo, limit, foo.length);
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

    primaryKey = primaryKey || DEFAULT_PRIMARY_KEY;
//    var fooKeys = primaryKey ? primaryKeys(foo, primaryKey) : foo;
//    var barKeys = primaryKey ? primaryKeys(bar, primaryKey) : bar;
    var barKeys = primaryKeys(bar, primaryKey);
    return foo.filter(function(item) {
      item = item[primaryKey]; //primaryKey ? item[primaryKey] : item;
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
