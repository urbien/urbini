define('views/HistoricalDataView', [
  'globals',
  'utils',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList'
], function(G, U, BasicView, Voc, ResourceList) {

  var RawValue = G.DEV_PACKAGE_PATH + 'Technicals/RawValue';
  var PreviousValue = G.DEV_PACKAGE_PATH + 'Technicals/PreviousValue';

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
      date = meta.date;
      value = meta.value;
    }

    return date && value && {
      date: date,
      value: value
    };
  }

  function toTable(list, indicator, cols) {
    return {
      heading: U.getDisplayName(indicator).replace('Previous Value', '').replace('()', '').trim(),
      cols: cols,
      resources: list.models
    };
  };

  return BasicView.extend({
    autoFinish: false,
    template: 'historicalDataTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', 'renderHelper');
      BasicView.prototype.initialize.apply(this, arguments);
      this.makeTemplate(this.template, 'template', this.vocModel.type);
    },

    events: {
      'click th[data-shortname]': 'sortBy'
    },

    sortBy: function(e) {
      var shortname = e.selectorTarget.$data('shortname'),
          indicator = e.selectorTarget.$closest('table').$data('indicator'),
          table = this.historicalDataTables[indicator];

      this._sortBy(table, shortname);
    },

    _sortBy: function(table, shortname) {
      if (table.order == shortname) {
        table.resources.reverse();
      }
      else {
        table.order = shortname;
        // this.historicalData.sortBy(this._sortBy);
        var sorted = _.sortBy(table.resources, function(obj) { return obj[shortname]; });
        if (_.isEqual(sorted, table.resources))
          sorted.reverse();

        table.resources = sorted;
      }

      this.render();
    },

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
            var variantUri = getVariantUri(indicator);
            if (variants.indexOf(variantUri) == -1) {
              self.indicators[indicator.getUri()] = indicator;
              variants.push(variantUri);
            }
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
                  $asc: false
                };

            params[valProp] = '!null';
            if (U.isHeterogeneousEvent(model)) {
              params[U.getSubpropertyOf(model, 'feed').shortName] = indicator.get('feed');
            }

            var list = new ResourceList(null, {
              model: model,
              params: params
            });

            list.fetch({
              success: function() {
                if (list.length) {
                  self.historicalDataLists[uri] = list;
                  var table = toTable(list, indicator, cols);
                  if (table) {
                    self.historicalDataTables[uri] = table;
                    table.order = dateProp;
                    dfd.notify();
                  }
                }
              }
            });
          });
        });
      });

      return (this._historicalDataPromise = dfd.promise());
    },

    drawChart: function() {
      this.chartLibsPromise = U.require(['dc', 'crossfilter', 'colorbrewer', 'd3', 'stockCharts']).done(function(_DC, _Crossfilter, _Colorbrewer, _D3, _StockCharts) {
        StockCharts = _StockCharts;
      });
    },

    render: function() {
      this.loadHistoricalData().progress(this.renderHelper); // repaint when new data arrives
    },

    renderHelper: function() {
      // var list = this.historicalData.models,
      //     model = this.historicalData.vocModel,
      //     meta = model.properties,
      //     l = list.length,
      //     props,
      //     data;

      // if (!l || !dataEl)
      //   return;

      // dataEl.$html(this.historicalDataTemplate({ cols: props.map(function(p) { return meta[p]; }), resources: models }));

      this.html(this.template({
        tables: this.historicalDataTables
      }));

      this.getPageView().invalidateSize();
      this.finish();
    }
  }, {
    displayName: 'HistoricalDataView'
  });
});

