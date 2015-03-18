//'use strict';
define('collections/ResourceList', [
  'globals',
  'utils',
  'error',
  'events',
  'lib/fastdom'
], function(G, U, Errors, Events, Q) {
  function log() {
    var args = [].slice.call(arguments);
    args.unshift("ResourceList");
    G.log.apply(G, args);
  };

  var DEFAULT_UPDATE_OPTIONS = {
    partOfUpdate: true
  };

  var DEFAULT_UPDATE_OPTIONS_NO_VALIDATION = {
    partOfUpdate: true,
    validateMembership: false
  };

  var tsProp = 'davGetLastModified';
  var listParams = ['perPage', 'offset'];
  var ResourceList = Backbone.Collection.extend({
    initialize: function(models, options) {
      if (!models && !options.model)
        throw new Error("resource list must be initialized with options.model or an array of models");

      if (!this.cid)
        this.cid = _.uniqueId('rl');

      options = options || {};
      _.extend(this, {
        page: 0,
        perPage: 10,
        offset: 0,
        firstPage: 0,
        params: {},
        model: (models && models.length && models[0].vocModel),
        listId: G.nextId()
      });

      for (var o in options) {
        if (typeof this[o] != 'function')
          this[o] = options[o];
      }

      var self = this,
          vocModel = this.vocModel = this.model,
          meta = vocModel.properties;

      _.bindAll(this, 'fetch', 'parse', '_parseQuery', 'getNextPage', 'getPreviousPage', 'getPageAtOffset', 'onSearch', 'onPing',
          'setPerPage', 'pager', 'getUrl', 'onResourceChange', 'disablePaging', 'enablePaging'); // fixes loss of context for 'this' within methods
//      this.on('add', this.onAdd, this);
      this.on('reset', this.onReset, this);
//      this.on('aroundMe', vocModel.getAroundMe);
      this.type = vocModel.type;
      this.shortName = vocModel.shortName || vocModel.shortName;
      this.displayName = vocModel.displayName;
//      this.baseUrl = G.apiUrl + this.shortName;
//      this.url = this.baseUrl;
      this.baseUrl = G.apiUrl + encodeURIComponent(this.type);
      this.url = this.baseUrl;
      if (options.params) {
        this._parseParams(options.params);
//        this.query = _.param(this.params);
      }
      else
        this._parseQuery(options._query);

      if (vocModel.adapter) {
        var validator = vocModel.adapter.validateCollection,
            valid = false;

        if (validator) {
          try {
            valid = validator.call(this);
          } catch (err) {
            // TODO handle error
          }
        }

//        if (!valid) {
//          // TODO handle error
//        }
      }

      this.calcBelongsFunction();
      if (options.cache !== false)
        this.announceNewList();

//      this.on('updated', function() {
//        debugger;
//      });
//
//      this.on('replaced', function() {
//        debugger;
//      });
//
//      this.on('added', function() {
//        debugger;
//      });

      if (!this['final']) {
//        this.listenTo(Events, 'delete', function(r) {
//          if (self.remove(r))
//            log("Removed element from list: ", r.getUri(), self.getUrl());
//        });

        this.listenTo(Events, 'newResource:' + this.type, function(resource, fromList) {
          // we are adding this resource to this collection at the moment
          if (self == fromList)
            return;

          self.filterAndAddResources([resource]);
//          setTimeout(function() {
//            Q.nonDom(self.filterAndAddResources.bind(self, [resource]), self);
//          }, 1000);
        });

        this.listenTo(Events, 'newResources:' + this.type, function(resources, fromList) {
          // we are adding this resource to this collection at the moment
          if (self == fromList)
            return;

          self.filterAndAddResources(resources);
//          setTimeout(function() {
//            Q.nonDom(self.filterAndAddResources.bind(self, resources), self);
//          }, 1000);
        });

        this.listenTo(Events, 'newResourceList:' + this.type, function(list) {
          if (self == list)
            return;

          self.filterAndAddResources(list.models);
//          setTimeout(function() {
//            Q.nonDom(self.filterAndAddResources.bind(self, list.models), self);
//          }, 1000);
        });
      }

      this.enablePaging();
      this.on('endOfList', this.disablePaging);
      this.resetRange();
      this._fetchDeferreds = {};
      this.setupSearch();
      log("info", "init " + this.shortName + " resourceList");

      this.on('change', this.onResourceChange, this);
      this.on('delete', this.onResourceDelete, this);
    },

    setupSearch: function() {
      this.stopListening(Events, 'getResourceList:' + this.vocModel.type, this.onSearch); // just in case
      this.listenTo(Events, 'getResourceList:' + this.vocModel.type, this.onSearch);

      this.stopListening(Events, 'getLists', this.onPing); // just in case
      this.listenTo(Events, 'getLists', this.onPing);
    },

    onSearch: function(query, cb) {
      if (this.query == query)
        cb(this);
    },

    onPing: function(cb) {
      cb(this);
    },

    calcBelongsFunction: function() {
      try {
        this.belongsInCollection = U.buildValueTester(this.params, this.vocModel) || G.trueFn;
        this._unbreak();
      } catch (err) {
        this.belongsInCollection = G.falseFn; // for example, the where clause might assume a logged in user
        this._break();
      }
    },

    resetRange: function() {
      if (!this.range)
        this.range = new Array(2);

      this.range[0] = 0;
      this.range[1] = this.models.length;
    },

    setRange: function(from, to) {
      if (from > this.range[0])
        this.collection.remove(this.collection.slice(this.from, from));

      this.range[0] = from;
      if (to < this.range[1])
        this.collection.remove(this.collection.slice(to, this.range[1]));

      this.range[1] = to;
    },

    getRange: function() {
      this.range[1] = this.models.length;
      return this.range;
    },

    setTotal: function(total) {
      this.total = total;
      this.trigger('total', total);
    },

    getTotal: function() {
      return this.total || null;
    },

//    clearRange: function(from, to) {
//      for (var i = from; i < to; i++) {
//        this.models[i] = null;
//      }
//
//      if (from == this.range[0])
//        this.range[0] = to;
//      else if (to == this.range[1])
//        this.range[1] = from;
//    },

    setStartIndex: function(start) {
      var range = this.getRange();
      if (start < range[0])
        throw "Can't set start index to where there are no models";

      if (start > range[1])
        throw "Start index must be lower than end index";

      this.remove(this.models.slice(this.range[0], start));
      this.range[0] = start;
    },

    setEndIndex: function(end) {
      var range = this.getRange();
      if (end > range[1])
        throw "Can't set end index to where there are no models";

      this.remove(this.models.slice(this.range[1]));
      this.range[1] = end;
    },

    filterAndAddResources: function(resources) {
//      if (this.adding) // avoid infinite loop
//        return;

      var self = this,
          added = [],
          type = self.type;

      for (var i = 0, len = resources.length; i < len; i++) {
        var resource = resources[i];
        if (resource.isAssignableFrom(type) &&!this.get(resource)) {
          if (this.belongsInCollection(resource))
            added.push(resource);
        }
      }

      if (added.length) {
        this.add(added, {
          announce: false,
          parse: false
        });
      }
    },

    announceNewList: function() {
      Events.trigger('newResourceList', this);
      Events.trigger('newResourceList:' + this.type, this);
    },

    clone: function() {
      return new ResourceList(this.models.slice(), _.extend(_.pick(this, ['model', 'rUri', 'title', 'total'].concat(listParams)), {cache: false, params: _.clone(this.params)}));
    },

    onResourceDelete: function(resource, options) {
      this.remove(resource, options);
    },

    onResourceChange: function(resource, options) {
      var removed;
      if (options.validateMembership !== false && !this.belongsInCollection(resource))
        removed = this.remove(resource);

      options = options || {};
      if (!removed && !options.partOfUpdate)
        this.trigger('updated', [resource]);
    },

    /**
     * assumes unsorted collection
     */
    add: function(resources, options) {
      if (_.isEmpty(resources))
        return;

      if (this['final'] && this.models.length)
        throw "This list is locked, it cannot be changed";

      options = _.defaults({}, options, { silent: false, parse: true });
      var self = this,
          colModel = this.vocModel,
          colType = colModel.type,
          multiAdd = _.isArray(resources),
          fromServer = this._getLastFetchOrigin() == 'server',
          params = this.modelParamsStrict,
          setInitialParams = fromServer && _.size(params),
          numBefore = this.length,
          models = this.models,
          added,
          numAfter,
          i,
          result;

      resources = multiAdd ? resources : [resources];
      if (!resources.length)
        return;

//      for (var i = 0; i < resources.length; i++) {
//        var r = resources[i];
//        if (!U.isModel(r)) {
//          var resType = U.getTypeUri(r._uri),
//              model;
//
//          if (resType != colType)
//            model = U.getModel(resType);
//
//          model = model || colModel;
//          resources[i] = new model(r, options);
//        }
//      }

      Backbone.Collection.prototype.add.call(this, resources, options);

      numAfter = this.length;
      if (numAfter <= numBefore)
        return;

      for (var i = numBefore; i < numAfter; i++) {
        var resource = models[i],
            uri = resource.getUri();

        if (setInitialParams) {
          // we may be end up requesting models with $select=..., or $omit=..., so we should set the provided ones right now, in case they're omitted from the fetch response
          resource.set(params, {silent: true});
        }
      }

      if (multiAdd && !this.resetting) {
        added = models.slice(numBefore);
        this.trigger('added', added);
      }

      if (options.announce !== false) {
        added = added || models.slice(numBefore);
        Events.trigger('newResources', added, this);
        Events.trigger('newResources:' + this.type, added, this);
      }

      return result;
    },
//    replace: function(resource, oldUri) {
//      if (U.isModel(oldUri))
//        this.remove(oldUri)
//      else
//        this.remove(resource);
//
//      this.add([resource]); // to make it act like multi-add, so it triggers an 'added' event
//      this.trigger('replaced', resource, oldUri);
//    },

    getNextPage: function(options) {
      var params = options.params,
          offset = params && _.has(params, '$offset') ? params.$offset : this.length;

      this.setOffset(offset);
      return this.pager(options);
    },
    getPreviousPage: function () {
      this.setOffset(this.offset - this.perPage);
      this.setOffset(Math.max(0, this.offset));
      this.pager();
    },
    getPageAtOffset: function(offset) {
      this.setOffset(offset);
      this.pager();
    },
    pager: function(options) {
      this.page = Math.floor(this.offset / this.perPage);
      options = options || {};
      options.sync = true;
      options.nextPage = true;
      var length = this.models.length;
      if (length)
        options.from = this.models[length - 1].getUri();

      return this.fetch(options);
    },
    setPerPage: function(perPage) {
      this.page = this.firstPage;
      this.perPage = perPage;
      this.pager();
    },
    getUrl: function(params) {
      params = params ? _.clone(params) : {};
      params.$minify = params.$mobile = 'y';
      for (var p in this.params) {
        if (p == '_uri' || !U.isMetaParameter(p) || (U.isApiMetaParameter(p) && p != '$offset' && p != '$limit')) {
          params[p] = this.params[p];
        }
      }

      if (this.params  &&  window.location.hash  && window.location.hash.startsWith('#chooser/'))
        params.$chooser = 'y';

      var adapter = this.vocModel.adapter;
      if (adapter && adapter.getCollectionUrl)
        return adapter.getCollectionUrl.call(this, params);

      return this.baseUrl + '?' + _.param(params);
    },

    _parseQuery: function(query) {
      var params;
      if (query)
        params = U.getQueryParams(query);
      else
        params = this.params || {};

      this._parseParams(params);
    },

    _parseParams: function(params) {
      var modelParams = {},
          strict = {},
          meta = this.vocModel.properties;

      for (var name in params) {
        var val = params[name],
            prop;

        if (name == '$offset') {
          this.setOffset(parseInt(val)); // offset is special because we need it for lookup in db
          this.page = Math.floor(this.offset / this.perPage);
        }
        else if (name == '$limit') {
          this.perPage = params.$limit = parseInt(val);
        }
        else if (!/^-/.test(name)) {
          modelParams[name] = val;
          if (/^[a-zA-Z_]+/.test(name)) {
            prop = meta[name];
            if (prop && val !== undefined) {
              if (prop.range != 'string' && /^[<>!]+/.test(val)) { // ignore inequalities
                continue;
              }
              if ((U.isResourceProp(prop) || U.isTypeProp(prop)) && !/^http|sql/.test(val)) { // ignore non-uri values for resource-ranged props
                continue;
              }
            }

            if (val === 'null') val = null;
            
            strict[name] = val;
          }
        }
      }

      this.params = params;
      this.modelParams = modelParams;
      this.modelParamsStrict = strict;
      this.url = this.baseUrl + (_.size(this.params) ? "?" + _.param(this.params) : ''); //this.getUrl();
      this.query = U.getQueryString(modelParams, true); // sort params in alphabetical order for easier lookup
    },

    isAll: function(interfaceNames) {
      return U.isAll(this.vocModel, interfaceNames);
    },
    isOneOf: function(interfaceNames) {
      return U.isOneOf(this.vocModel, interfaceNames);
    },
    isA: function(interfaceName) {
      return U.isA(this.vocModel, interfaceName);
    },

    setOffset: function(offset) {
      if (typeof offset !== 'undefined')
        this.offset = offset;
    },

    parse: function(response) {
      if (this._getLastFetchOrigin() !== 'db')
        this._lastFetchedOn = G.currentServerTime();

      var vocModel = this.vocModel,
          type = vocModel.type;

      for (var i = 0, len = response.length; i < len; i++) {
        var res = response[i];
        if (!U.isModel(res)) {
          res._uri = U.getLongUri1(res._uri, vocModel);
        }
      }

      var adapter = this.vocModel.adapter;
      if (adapter && adapter.parseCollection)
        return adapter.parseCollection.call(this, response);

      if (!response)
        return [];

      return response;
    },

    set: function(resources, options) {
      options = _.defaults(options || {}, DEFAULT_UPDATE_OPTIONS);
//      var start = _.now();
//      try {
        return Backbone.Collection.prototype.set.call(this, resources, options);
//      } finally {
//        log("Collection.set for {0} resources took {1}ms".format(resources.length, _.now() - start | 0));
//      }
    },

    disablePaging: function() {
      console.log("disabling paging");
      this._outOfData = true;
      window._setTimeout(this.enablePaging, 3 * 60000);
    },

    enablePaging: function() {
      console.log("enabling paging");
      this._outOfData = false;
    },

    isOutOfResources: function() {
      return this._outOfData || this.range[1] >= this.total;
    },

    reset: function(models, options) {
      delete this.total;
      if (this['final'] && this.models.length)
        throw "This list is locked, it cannot be changed";

      this.params.$offset = 0;
      this.enablePaging();
      var needsToBeStored = models && models.length && !U.isModel(models[0]);

      this.resetting = true;
      try {
        return Backbone.Collection.prototype.reset.apply(this, arguments);
      } finally {
        this.resetting = false;
      }

      if (needsToBeStored)
        Events.trigger('updatedResources', this.models, this.vocModel.type);
    },

    isBroken: function() {
      return this._broken;
    },

    _break: function() {
      this._broken = true;
    },

    _unbreak: function() {
      this._broken = false;
    },

    onReset: function(model, options) {
      if (options.params) {
        this._parseParams(options.params);
        try {
//          this.belongsInCollection = U.buildValueTester(this.params, this.vocModel) || G.trueFn;
          this.calcBelongsFunction();
          this._unbreak();
        } catch (err) {
          this.belongsInCollection = G.falseFn; // for example, the where clause might assume a logged in user
          this._break();
        }

        this._lastFetchedOn = null;
      }

      this.setupSearch();
    },

    remove: function(models, options) {
      var l = this.models.length;
      Backbone.Collection.prototype.remove.apply(this, arguments);
      if (this.models.length < l) {
        this.trigger('removed', models);
        return true;
      }

      return false;
    },

    fetch: function(options) {
      options = options || {};
      _.defaults(options, {
        headers: {
          'Range-Need-Total': true
        },
        update: true,
        remove: false,
        parse: true
      });

      var self = this,
          vocModel = this.vocModel,
          origOptions = _.clone(options),
          success = options.success,
          error = options.error = options.error || Errors.getBackboneErrorHandler(),
          adapter = vocModel.adapter,
          params = this.params,
          extraParams = options.params || {},
          urlParams,
          colParams = _.clone(this.modelParams),
          limit;

      if (this['final']) {
        error(this, {status: 204, details: "This list is locked"}, options);
        return G.getRejectedPromise();
      }

      if (!extraParams.$omit && !extraParams.$select && !this.params.$omit && !this.params.$select) {
        if (!this.offset || !this.models.length) {
          if (!_.has(vocModel, 'splitRequest'))
            U.setSplitRequest(vocModel);

          if (vocModel.splitRequest)
            extraParams.$select = U.splitRequestFirstHalf;
        }
      }

      if (!_.has(extraParams, '$offset') && this.offset)
        params.$offset = this.offset;

      this.rUri = options.rUri;
      urlParams = this.rUri ? _.getParamMap(this.rUri) : {};
      if (!_.isEmpty(urlParams)) {
        limit = urlParams.$limit;
        limit = limit && parseInt(limit);
      }
      if (!limit)
        limit = extraParams.$limit || this.perPage;

      if (limit > 50)
        options.timeout = 5000 + limit * 50;

      options.limit = params.$limit = limit;
      try {
        options.url = this.getUrl(extraParams);
      } catch (err) {
        error(this, {status: 204, details: err.message}, options);
        return G.getRejectedPromise();
      }

//      if (this.currentlyFetching && this.currentlyFetching.url == options.url) {
//
//      }

      options.error = function(xhr, resp, options) {
        if (!_.isEqual(colParams, self.modelParams))
          return self.fetch(origOptions);

        self._lastFetchedOn = G.currentServerTime();
        if (error)
          error.call(self, self, resp, options);
      }

      options.success = function(resp, status, xhr) {
        if (!_.isEqual(colParams, self.modelParams))
          return self.fetch(origOptions);

        if (self._getLastFetchOrigin() === 'db') {
          if (success)
            return success(resp, status, xhr);

          return;
        }

        var now = G.currentServerTime(),
            code = xhr.status,
            select = extraParams && extraParams.$select,
            pagination = xhr.getResponseHeader("X-Pagination"),
            total = xhr.getResponseHeader("X-Range-Total"),
            mojo = xhr.getResponseHeader("X-Mojo");

        if (pagination) {
          try {
            pagination = JSON.parse(pagination);
            self.setOffset(pagination.offset);
            if (self.offset)
              log("info", "received page, offset = " + self.offset);

            self.page = Math.floor(self.offset / self.perPage);
          } catch (err) {
          }
        }

        if (total != null)
          self.setTotal(parseInt(total));

        if (mojo) {
          try {
            mojo = JSON.parse(mojo);
            if (mojo = mojo.edit) {
              for (var i = 0, len = resp.length; i < len; i++) {
                resp[i].edit = mojo;
              }
            }
          } catch (err) {
          }
        }

        function err() {
          debugger;
          log('error', code, options.url);
          error(self, resp || {code: code}, options);
        }

        self._lastFetchedOn = now;
        switch (code) {
          case 200:
            if (!resp)
              debugger;

            break;
          case 204:
            self.trigger('endOfList');
            if (success)
              success([], status, xhr);

            return;
          case 304:
//            var ms = self.models.slice(options.start, options.end);
            var models = self.models,
                start = options.start || 0,
                end = options.end || (start + params.$limit);

            end = Math.min(end, models.length);
            if (typeof start != 'undefined' && typeof end != 'undefined') {
              for (var i = start; i < end; i++) {
                models[i].set({'_lastFetchedOn': now}, {silent: true});
              }
            }

//            _.each(ms, function(m) {
//              m.set({'_lastFetchedOn': now}, {silent: true});
//            });
//
//            self.trigger('endOfList');
            if (success)
              success([], status, xhr);

            return;
          default:
            err();
            return;
        }

        options.modelParams = colParams;
        self.update(resp, options);
        if (success)
          success(resp, status, xhr);

        if (!select || select == '$all')
          return;

        var first = self.models[0];
        if (!first)
          return;

        var props = U.parsePropsList(select, self.vocModel),
            atts = U.filterObj(first.attributes, function(key) { return /^[a-zA-Z]+$/.test(key) }),
            nonSelectedProps = _.difference(_.keys(atts), props),
            hasNonSelectedProps = _.isEmpty(_.pick(atts, nonSelectedProps));

        if (hasNonSelectedProps)
          return;

        var newOptions = {
          forceFetch: true,
          forceMerge: true,
          params: _.extend(_.omit(extraParams, '$select'), {
            $omit: select,
            $blCounts: 'y' // might as well make the most of this request
          })
        };

//        G.whenNotRendering(self.fetch.bind(self, newOptions));
        self.fetch(newOptions);
      };

      if (this.offset && !this._outOfData) {
        log("info", "fetching next page, from " + this.offset + ", to: " + (this.offset + limit));
      }

      this._fetching = true;
      return this.sync('read', this, options);
    },

    _setLastFetchOrigin: function(lfo) {
      this.lastFetchOrigin = lfo;
    },

    _getLastFetchOrigin: function() {
      return this.lastFetchOrigin;
    },

    update: function(resources, options) {
      if (!resources || !resources.length)
        return;

      if (this._getLastFetchOrigin() === 'db') {
//        var numBefore = this.models.length;
        this.add(resources, _.defaults({
          parse: false // make sure parse if false
        }, options));

        return;
      }

      resources = this.parse(resources);

      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // An alternative is to override Backbone.Collection.reset() method and do some magic there.

      var forceMerge = options.forceMerge,
          added = [],
          skipped = [],
          updated = [],
          now = G.currentServerTime();

      for (var i = 0; i < resources.length; i++) {
        var r = resources[i];
        r._lastFetchedOn = now;
        var uri = r._uri,
            saved = this.get(uri),
            ts = saved && saved.get(tsProp) || 0,
            newLastModified = r[tsProp],
            newData = saved && saved.changedAttributes(r), // new prop values, including meta props like _uri, _lastFetchedOn, etc.
            newModelProps = newData && U.filterObj(newData, U.isModelParameter);

        if ((forceMerge && newModelProps && _.size(newModelProps)) || !newLastModified || newLastModified > ts) {
          if (saved) {
            saved.loadInlined(newData);
            saved.set(newData, DEFAULT_UPDATE_OPTIONS_NO_VALIDATION);

            updated.push(saved);
          }
          else {
            added.push(r);
          }
        }
        else
          saved && saved.set({'_lastFetchedOn': now}, {silent: true});
      }

      if (added.length + updated.length) {
        if (added.length)
          this.add(added);

        if (updated.length)
          this.trigger('updated', updated);

        // not everyone who cares about resources being updated has access to the collection
        Events.trigger('updatedResources', _.union(updated, added), this.vocModel.type);
      }
//      else if (this.params.$offset)
//        this.trigger('endOfList');

      return this;
    },

    isFetching: function(url) {
      return url ? _.has(this._fetchDeferreds, url) : !_.isEmpty(this._fetchDeferreds);
    },

    getFetchDeferred: function(url) {
      return this._fetchDeferreds[url];
    },

    setFetchDeferred: function(url, deferred) {
      this._fetchDeferreds[url] = deferred;
    },

    clearFetchDeferred: function(url) {
      delete this._fetchDeferreds[url];
    },

    destroy: function() {
      this.stopListening();
      this.remove(this.models);
    },

    getResourceInstance: function(model, atts, options) {
      if (arguments.length == 2) {
        atts = model;
        options = atts;
        model = this.vocModel
      }

      return U.getResourceInstance(model, atts, options);
    }
  }, {
    displayName: 'ResourceList'
  });

//  _.toTimedFunction(Backbone.Collection.prototype, 'set');
  return ResourceList;
});
