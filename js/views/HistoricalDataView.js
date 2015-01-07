define('views/HistoricalDataView', [
  'globals',
  'utils',
  'events',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList'
], function(G, U, Events, BasicView, Voc, ResourceList) {

  var RawValue = G.DEV_PACKAGE_PATH + 'Technicals/RawValue';
  var PreviousValue = G.DEV_PACKAGE_PATH + 'Technicals/PreviousValue';

  function getEventType(feedUri) {
    var feedType = U.getTypeUri(feedUri);
    if (/\/commerce\/trading\/(Stock|Index|Commodity)$/.test(feedType))
      return feedType + 'Event';
    else
      throw "unable to derive event type from feed uri " + feedUri;
  }

  function getVariantUri(indicator) {
    var variantUri = indicator.get('variantUri');
    if (variantUri == RawValue || variantUri == PreviousValue) {
      variantUri = indicator.get('eventPropertyUri');
      variantUri = variantUri.slice(0, variantUri.lastIndexOf('/'));
    }

    return variantUri;
  }

  function getEventPropertyName(indicator) {
    var uri = indicator.get('eventPropertyUri');
    return uri.slice(uri.lastIndexOf('/') + 1);
  }

  function getCols(listModel, indicator) {
    var cols,
        meta = listModel.properties,
        date,
        value;

    if (U.isAssignableFrom(listModel, 'commerce/trading/Event')) {
      date = U.getSubpropertyOf(listModel, 'dateOccurred');
      if (!date)
        return null;

      value = meta[getEventPropertyName(indicator)];
    }
    else {
      date = meta.date || meta.time;
      value = meta.value;
    }

    return date && value && {
      date: date,
      value: value
    };
  }

  function cleanIndicatorName(indicator) {
    return U.getDisplayName(indicator).replace('Previous Value', '').replace('()', '').trim();
  }

  function toTable(list, indicator, cols) {
    return {
      heading: cleanIndicatorName(indicator),
      cols: cols,
      resources: list.models
    };
  };

  /**
   * @param  {[Array]} options.cols
   * @param  {[Array]} options.title
   * @param  {[Collection]} options.list
   * @return {[String]}
   */
  function toTableData(options) {
    var listModel = options.list.vocModel,
        listProps = listModel.properties,
        cols = options.cols[0].shortName ? _.pluck(options.cols, 'shortName') : options.cols,
        colsWithValues = [],
        rows = options.list.map(function(model) {
          var row = [],
              hasNonZeroes = false,
              val;

          for (var i = 0; i < cols.length; i++) {
            val = model.get(cols[i]);
            row.push(val);
            if (!U.isDateProp(listProps[cols[i]]))
              hasNonZeroes = hasNonZeroes || val;

            colsWithValues[i] = colsWithValues[i] || val;
          }

          return hasNonZeroes ? row : null;
        }),
        i = cols.length;

    rows = _.compact(rows);

    while (i--) {
      if (!colsWithValues[i]) {
        cols.splice(i, 1);
        for (var j = 0; j < rows.length; j++) {
          rows[j].splice(i, 1);
        }
      }
    }

    if (!rows.length || !rows[0].length)
      return null;

    return _.defaults({
      rows: rows,
      cols: cols.map(function(c) { return typeof c == 'string' ? listProps[c] : c; })
    }, options);
  };

  return BasicView.extend({
    autoFinish: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'renderHelper');
      BasicView.prototype.initialize.apply(this, arguments);
      this._isComparison = this.vocModel.shortName.endsWith('ByRule');
      if (this._isComparison)
        this._leftMinusRight = this.vocModel.shortName.indexOf('MoreThan') != -1;

      // this.makeTemplate(this._isComparison ? 'historicalDataTemplate1' : 'historicalDataTemplate', 'template', this.vocModel.type);
      this.makeTemplate('tableTemplate', 'template', this.vocModel.type);
      var order = U.contextual('Order');
      this.isOrder = order &&  this.resource.isAssignableFrom(order);
      this.isRule = this.resource.isAssignableFrom('commerce/trading/Rule');
    },

    // events: {
    //   'click th[data-shortname]': 'sortBy'
    // },

    // sortBy: function(e) {
    //   var shortName = e.selectorTarget.$data('shortname');
    //   if (shortName)
    //     this._sortBy(shortName);
    // },

    // _sortBy: function(shortName) {
    //   if (true)
    //     return;

    //   if (table.order == shortName) {
    //     table.resources.reverse();
    //   }
    //   else {
    //     table.order = shortName;
    //     // this.historicalData.sortBy(this._sortBy);
    //     table.rows.sort(function(a, b) {
    //       return a[shortName] - b[shortName];
    //     });

    //     // if (_.isEqual(sorted, table.resources))
    //     //   sorted.reverse();
    //     // table.resources = sorted;
    //   }

    //   this.render();
    // },

    loadHistoricalData: function() {
      if (this._historicalDataPromise)
        return this._historicalDataPromise;

      // var self = this;
      // return this._historicalDataPromise = $.Deferred(function(dfd) {
      //   var now = +new Date(),
      //       value = 1000;

      //   self.historicalData = [];
      //   for (var i = 0; i < 100; i++) {
      //     self.historicalData.push({
      //       date: U.getFormattedDate1(new Date(now -= 24 * 3600 * 1000)),
      //       value: value += (Math.random() * 50 - 25)
      //     });
      //   }

      //   dfd.resolve();
      // }).promise();

      return this._historicalDataPromise = this._loadHistoricalData();
    },

    _loadHistoricalData: function() {
      if (this.isRule)
        return this.loadHistoricalDataForRule();
      else if (this.isOrder)
        return this.loadHistoricalDataForOrder();
      else
        return G.getRejectedPromise();
    },

    loadHistoricalDataForOrder: function() {
//      if (U.getUserRole() != 'siteOwner' && U.getUserRole() != 'admin')
//        return;

      var self = this,
          order = this.resource,
          securityUri = order.get('security'),
          dfd = $.Deferred();

      Voc.getModels(getEventType(securityUri)).done(function(eventModel) {
        var events = self._events = new ResourceList(null, {
          model: eventModel,
          params: {
            feed: securityUri,
            $limit: 100,
            $orderBy: 'dateOccurred',
            $asc: 0
          }
        });

        events.fetch({
          success: function() {
            if (!events.length)
              return;

            self._table = toTableData({
              list: events,
              cols: ['dateOccurred'].concat(U.getEventCols(eventModel)),
              title: 'Historical Data'
            });

            if (self._table) {
              self.subscribeToDataQueries();
              dfd.resolve();
            }
          }
        });
      });

      return dfd.promise();
    },

    loadHistoricalDataForRule: function() {
      var self = this,
          res = this.resource,
          indicatorUri = res.get('indicator'),
          compareWithUri = res.get('compareWith'),
          promises = [U.getResourcePromise(indicatorUri)],
          dfd = $.Deferred();

      if (compareWithUri)
        promises.push(U.getResourcePromise(compareWithUri));

      $.when.apply($, promises).done(function(indicator, compareWith) {
        self.indicators = {};
        var variants = [];
        for (var i = 0; i < arguments.length; i++) {
          var indicator = arguments[i];
          if (indicator) {
            self.indicators[indicator.getUri()] = indicator;
            _.pushUniq(variants, getVariantUri(indicator));
          }
        }

        if (!variants.length)
          dfd.reject();

        Voc.getModels(variants).done(function() {
          self.historicalDataLists = {};
          self.historicalDataTables = {};
          _.map(self.indicators, function(indicator, uri) {
            var model = U.getModel(getVariantUri(indicator));
            if (!model)
              return;

            var cols = getCols(model, indicator);
            if (!cols)
              return;

            var dateProp = cols.date.shortName,
                valProp = cols.value.shortName,
                params = {
                  $orderBy: dateProp,
                  $select: dateProp + ',' + valProp,
                  $asc: 0
                };

            if (U.isAssignableFrom(model, 'commerce/trading/Event'))
              params[valProp] = '!null';

            if (U.isHeterogeneousEvent(model))
              params.feed = indicator.get('feed');

            var list = new ResourceList(null, {
              model: model,
              params: params
            });

            list.fetch({
              params: {
                $limit: 100
              },
              success: function() {
                if (list.length) {
                  self.historicalDataLists[uri] = list;
                  if (self._isComparison && _.size(self.historicalDataLists) == 2) {
                    var table = self.buildComparisonTable();
                    if (table) {
                      self._table = table;
                      dfd.resolve();
                    }

                    return;
                  }

                  self._table = toTableData({
                    list: list,
                    cols: [cols.date, cols.value],
                    title: 'Historical Data',
                    heading: cleanIndicatorName(indicator)
                  });

                  // var table = toTable(list, indicator, cols);
                  if (!self._table)
                    return;

                  self.historicalDataTables[uri] = self._table;
                  self._table.order = dateProp;
                  // if (_.size(self.historicalDataLists) > 1) {
                  //   self.historicalDataLists._comparison = getComparisonTable(self.historicalDataLists.values().concat(cols));
                  // }

                  if (self._isComparison)
                    dfd.notify();
                  else
                    dfd.resolve();
                }
              },

              error: function() {
                debugger;
                dfd.reject();
              }
            });
          });
        });
      });

      return dfd.promise();
    },

    subscribeToDataQueries: function() {
      if (this._subscribedToDataQueries)
        return;

      this._subscribedToDataQueries = true;
      if (!this.isOrder || !this._events || !this._events.length)
        return false;

      var self = this,
          events = this._events,
          dateOccurred = U.getSubpropertyOf(events.model, 'dateOccurred'),
          latestEvent = dateOccurred && events.max(function(event) {
            return event.get(dateOccurred.shortName);
          }),
          lastTradePrice = U.isModel(latestEvent) && (latestEvent.get('lastTradePrice') || latestEvent.get('open'));

      if (lastTradePrice) {
        this.listenTo(Events, 'getStockQuote:' + this.resource.get('security'), function(cb) {
          cb(lastTradePrice);
        });
      }
    },

    buildComparisonTable: function() {
      var i1 = this.indicators[this.resource.get('indicator')],
          i2 = this.indicators[this.resource.get('compareWith')],
          // heading = cleanIndicatorName(i1) + " - " + cleanIndicatorName(i2),
          l1 = this.historicalDataLists[i1.getUri()],
          l2 = this.historicalDataLists[i2.getUri()],
          cols1 = getCols(U.getModel(getVariantUri(i1)), i1),
          cols2 = getCols(U.getModel(getVariantUri(i2)), i2),
          cols = [cols1.date, i1.getDisplayName(), i2.getDisplayName(), '% Difference'],
          p1 = cols1.value.shortName,
          p2 = cols2.value.shortName,
          d1 = cols1.date.shortName,
          d2 = cols2.date.shortName,
          rows = [];
          // data = {
          //   date: [],
          //   v1: [],
          //   v2: [],
          //   diff: []
          // };

          // dates = _.uniq(l1.pluck(cols1.date.shortName).concat(cols2.date.shortName)).sort(function(a, b) { return a - b; });

      l1.models.sort(function(a, b) { return b.get(d1) - a.get(d1); });
      l2.models.sort(function(a, b) { return b.get(d2) - a.get(d2); });

      var i = 0, j = 0;//, k = 0;
      for (; i < l1.length || j < l2.length;) {
        var m1 = l1.models[i],
            m2 = l2.models[j],
            date1 = m1 && m1.get(d1),
            date2 = m2 && m2.get(d2),
            date = date1 && date2 ? Math.max(date1, date2) : date1 || date2,
            v1 = date == date1 && m1.get(p1),
            v2 = date == date2 && m2.get(p2),
            v1IsNum = typeof v1 == 'number',
            v2IsNum = typeof v2 == 'number',
            diff = '',
            row = [],
            left = this._leftMinusRight ? v1 : v2,
            right = this._leftMinusRight ? v2 : v1;

        if (!v1IsNum && !v2IsNum)
          continue;

        if (v1IsNum && v2IsNum) {
          if (right === 0) {
            diff = left == 0 ? 0 : left > 0 ? Infinity : -Infinity;
          }
          else {
            diff = 100 * (left - right) / Math.abs(right);
          }
        }

        // row[d1] = date;
        // row[cols[1]] = v1;
        // row[cols[2]] = v2;
        // row[cols[3]] = diff;
        row.push(
          date,
          v1IsNum ? v1 : '',
          v2IsNum ? v2 : '',
          diff
        );

        rows.push(row);

        // data.date[k] = date;
        // data.v1[k] = v1;
        // data.v2[k] = v2;
        // data.diff[k] = diff;

        if (date == date1)
          i++;

        if (date == date2)
          j++;
      }

      return {
        // heading: heading,
        title: '% Difference',
        cols: cols,
        rows: rows
      };
    },

    drawChart: function() {
      this.chartLibsPromise = U.require(['dc', 'crossfilter', 'colorbrewer', 'd3', 'stockCharts']).done(function(_DC, _Crossfilter, _Colorbrewer, _D3, _StockCharts) {
        StockCharts = _StockCharts;
      });
    },

    render: function() {
      this.loadHistoricalData().progress(this.renderHelper)
                               .done(this.renderHelper); // repaint when new data arrives
    },

    renderHelper: function() {
      this.html(this.template(this._table));
      this.getPageView().invalidateSize();
      this.finish();
    }
  }, {
    displayName: 'HistoricalDataView'
  });
});
