define('synchronizer', ['globals', 'underscore', 'utils', 'backbone', 'events', 'indexedDB'], function(G, _, U, Backbone, Events, IndexedDBModule) {

  var MAX_DATA_AGE = G.MAX_DATA_AGE = 180000,
      NO_DB = G.dbType === 'none',
      RESOLVED_PROMISE = G.getResolvedPromise(),
      REJECTED_PROMISE = G.getRejectedPromise(),
      REF_STORE;

  function getLastFetchedTimestamp(resOrJson) {
    return U.getValue(resOrJson, '_lastFetchedOn') || U.getValue(resOrJson, 'davGetLastModified');
  };

  function log() {
    var args = [].slice.call(arguments);
    args.unshift("synchronizer");
    G.log.apply(G, args);
  };

  //////////////////// SYNCHRONIZER /////////////////

  function Synchronizer(method, data, options) {
    this.method = method;
    this.options = options;
    this.data = this.options['for'] = data;
  };

  Synchronizer.prototype.sync = function() {
    return this['_' + this.method]();
  };

  Synchronizer.prototype._isUpdate = function() {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._setLastFetched = function() {
    if (this.info.lastFetchedOn) {
      var ifMod = {
        "If-Modified-Since": new Date(this.info.lastFetchedOn).toUTCString()
      };

      this.options.headers = this.options.headers || {};
      _.extend(this.options.headers, ifMod);
    }
  }

  Synchronizer.prototype._delayedFetch = function() {
    return this._fetchFromServer(100);
  };

  Synchronizer.prototype._fetchFromServer = function(delay) {
    var self = this,
        options = this.options,
        url = options.url,
        dfd,
        promise,
        isResource;

    dfd = this.data.getFetchDeferred(url);
    if (dfd) {
      if (!dfd._delayed)
        return dfd.promise();
      else {
        dfd._delayed = false;
        promise = dfd.promise();
      }
    }
    else {
      dfd = $.Deferred();
      promise = dfd.promise();
      isResource = U.isModel(this.data);

      if (!isResource)
        this.data.setFetchDeferred(url, dfd);
      else
        this.data.setFetchDeferred(dfd);

      promise.always(function() {
        self.data.clearFetchDeferred(url);
      }).done(this._success).fail(this._error);
    }

    if (!G.online) {
      dfd.rejectWith(this.data, [null, {code: 0, type: 'offline', details: 'This action requires you to be online'}, options]);
      return;
    }

    if (!options.url) {
      dfd.rejectWith(this.data, [null, {code: 400, type: 'not_found', details: 'This resource cannot be fetched directly, it probably came bundled with another'}, options]);
      return;
    }

    if (isResource && U.isTempUri(this.data.getUri())) {
      dfd.rejectWith(this.data, [this.data, {code: 204}, this.options]);
      return;
    }

    if (this._isUpdate() && !this._isForceFetch())
      this._setLastFetched();

    if (delay) {
      setTimeout(this._fetchFromServer.bind(this), delay);
      dfd._delayed = true;
      return promise;
    }

    var intermediatePromise;
    // if (this._isSyncRequest() || !G.hasWebWorkers)
    //   intermediatePromise = this._defaultSync();
    // else {
      intermediatePromise = U.ajax({
        url: options.url,
        type: 'GET',
        headers: options.headers,
        'for': this.data
      });
    // }

    intermediatePromise.done(function(data, status, xhr) {
      dfd.resolveWith(self.data, [data, status, xhr]);
    }).fail(function(xhr, status, msg) {
  //    if (xhr.status === 304)
  //      return;

      log('error', 'failed to get resources from url', options.url, msg);
      dfd.rejectWith(this.data, [null, xhr, options]);
    });

    return promise;
  };

  Synchronizer.prototype._defaultSync = function() {
//    if (this._isSyncRequest())
//      this.options.timeout = 10000;

    var self = this,
        tName = 'sync ' + this.options.url;

//    G.startedTask(tName);
//    this.options.success = function() {
//      G.finishedTask(tName);
//    }

    return Backbone.defaultSync(this.method, this.data, this.options);
  };

  Synchronizer.prototype._queryDB = function() {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._getKey = function() {
    throw "This function must be overridden";
  };

  Synchronizer.prototype._preProcess = function() {
    if (this.info)
      return true;

    var self = this;
    this.data._dirty = 0;
    this.info = {
      isSyncRequest: this.options.sync || false,
      isForceFetch: this.options.sync || this.options.forceFetch,
      now: G.currentServerTime(),
      vocModel: this.data.vocModel,
      key: this._getKey()
    };

    this.info.isUpdate = this._isUpdate();
    if (this.info.isUpdate)
      this.info.lastFetchedOn = this._getLastFetchedOn();

    this._error = this.options.error || function(model, err, options) {
      log('error', 'failed to {0} {1}'.format(self.method, self._getKey()));
    };

    this._success = this.options.success || function(resp, status, xhr) {
      log('error', 'success: {0} {1}'.format(self.method, self._getKey()));
    };

    return true;
  };

  _.each(['isForceFetch', 'isUpdate', 'isSyncRequest'], function(infoProp) {
    Synchronizer.prototype['_' + infoProp] = function() {
      return this.info[infoProp];
    };
  });

  _.each(['now', 'vocModel', 'lastFetchedOn'], function(infoProp) {
    Synchronizer.prototype['_get' + infoProp.capitalizeFirst()] = function() {
      return this.info[infoProp];
    };
  });

  Synchronizer.prototype._read = function(options) {
    var self = this,
        keepGoing = this._preProcess(),
        promise;

    if (!keepGoing)
      return keepGoing;

    if (this._isForceFetch())
      return this._fetchFromServer();

    promise = this._queryDB().then(function(results) {
      self.options.sync = false;
      self.data._setLastFetchOrigin('db');
      log('db', "got resources from db: " + self.info.vocModel.type);
      self._onDBSuccess(results);
    }, this._onDBError.bind(this));

    promise._url = this.options.url;
    return promise;
  };

  Synchronizer.prototype._onDBSuccess = function(results) {
    throw "This function must be overridden";
  };

  Synchronizer.prototype.canFetchFromServer = function() {
    throw "This function must be overridden";
  },

  Synchronizer.prototype._onDBError = function(err) {
    if (this.options.dbOnly)
      this._error(this.data, {type: 'not_found'}, this.options);
    else if (G.online) {
      if (!this.canFetchFromServer()) {
        debugger;
        this._error(this.data, {code: 400, type: 'not_found'});
      }
      else
        this._fetchFromServer();
    }
    else if (this._isSyncRequest())
      this._error(this.data, {type: 'offline'}, this.options);
  };

  Synchronizer.prototype._isStale = function() {
    return Synchronizer.isStale(this._getLastFetchedOn(), this._getNow());
  };

  Synchronizer.getLastFetched = function(obj, now) {
    now = now || G.currentServerTime();
    if (!obj)
      return now;

    var ts,
        type = U.getObjectType(obj).toLowerCase();

    switch (type) {
      case '[object array]':
        ts = _.reduce(obj, function(memo, next)  {
          return Math.min(memo, getLastFetchedTimestamp(next) || 0);
        }, Infinity);
        break;
      case '[object object]':
        ts = getLastFetchedTimestamp(obj);
        break;
      case '[object number]':
        ts = obj;
        break;
    }

    return ts || 0;
  };

  Synchronizer.isStale = function(timestamp, now) {
    return !timestamp || now - timestamp > MAX_DATA_AGE;
  };

  Synchronizer.addItems = function(classUri, items) {
    var IDB = IndexedDBModule.getIDB();
    if (!IDB.hasStore(classUri)) {
      var dfd = $.Deferred();
      U.require('resourceManager').done(function(RM) {
        RM.upgrade([classUri]).done(function() {
          Synchronizer.addItems(classUri, items).done(dfd.resolve).fail(dfd.reject);
        }).fail(dfd.reject);
      }).fail(dfd.reject);

      return dfd.promise();
    }

    if (classUri.startsWith('http')) {
      var vocModel = U.getModel(classUri);
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        items[i] = U.isModel(item) ? item.toJSON() : item;
      }
    }

    return IDB.put(classUri, items);
  };

  Synchronizer.init = _.once(function() {
    REF_STORE = G.getRefStoreInfo();
  });

  return Synchronizer;
});
