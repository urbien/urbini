//'use strict';
define('views/ResourceView', [
  'globals',
  'underscore', 
  'events', 
  'utils',
  'views/BasicView',
  'lib/gauge'
], function(G, _, Events, U, BasicView, Gauges) {
//  var D3, DC, Crossfilter, 
  var StockCharts;
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    var doShow = p.charAt(0) != '_' && p != 'davDisplayName'  &&  !prop.avoidDisplayingInView  &&  U.isPropVisible(res, prop, role);
    // if property marked as Display name element show only on case it is of resource range.
    return doShow ? (!prop.displayNameElm  ||  prop.setLinkTo  ||  prop.range.indexOf("/") != -1) : doShow;
      
  };
  var BIGGER_BETTER_PERCENT = [[0.0, "#00ff00" ], [1.0, "#00aa00"]],
      BIGGER_WORSE_PERCENT = [[0.0, "#00ff00" ], [0.50, "#ffff00"], [1.0, "#ff0000"]];

  function theBiggerTheBetter(prop) {
    var pName = prop.shortName;
    if (pName == 'risk' || pName == 'maxDrawdown')
      return false;
    else
      return true;
  }

  return BasicView.extend({
    autoFinish: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      _.each(['propRowTemplate', 'propRowTemplate2', 'propRowTemplate3', 'propGroupsDividerTemplate', 'priceTemplate', 'buyTemplate', 'sellTemplate'], function(t) {
        this.makeTemplate(t, t, this.vocModel.type);
      }.bind(this));
      
      var res = this.resource;
      res.on('change', this.refresh, this);
      var uri = res.getUri(), self = this;
//      if (U.isTempUri(uri)) {
//        Events.once('synced:' + uri, function(data) {
//          if (self.isActive()) {
//            var newUri = data._uri;
//            self.router.navigate('view/' + encodeURIComponent(newUri), {trigger: false, replace: true});
//          }
//        });
//      }

      var codemirrorModes = U.getRequiredCodemirrorModes(this.resource, 'view');
      this.isCode = !!codemirrorModes.length; // we don't need to use the actual modes, just need to know whether we need codemirror stuff
      var promises = [this.getFetchPromise()];
      if (this.isCode)
        promises.push(U.require(['codemirror', 'codemirrorCss'].concat(codemirrorModes)));
      
      this.ready = $.when.apply($, promises);
      if (options.isBuyGroup) {
        this.isBuyGroup = true;
//        var purchasesBLProp, 
//            vocModel = this.vocModel;
//        
//        if (res.isA("ItemListing"))
//          purchasesBLProp = U.getCloneOf(vocModel, "ItemListing.ordersPlaced")[0];
//        else if (res.isA("Buyable"))
//          purchasesBLProp = U.getCloneOf(vocModel, "Buyable.orderItems")[0];
//        
//        if (!purchasesBLProp)
//          this.isBuyGroup = false;
//        else
        this.purchasesBacklinkProp = this.vocModel.properties[options.purchasesBLProp];
      }
      this.isTradle = U.isAssignableFrom(this.vocModel, 'commerce/trading/Tradle');
      if (this.isTradle)
        this.makeTemplate('gaugesTemplate', 'gaugesTemplate', this.vocModel.type)

      this.toggleVisibility(true); // set to invisible until it's rendered
      return this;
    },
    
    events: {
      'click': 'click',
      'click [data-display="collapsed"]': 'showOther'
    },
    
    pageEvents: {
      'click .dc-chart .reset': 'resetStockChart'
    },
    
    resetStockChart: function(e) {
      e.preventDefault();
      var parent = e.target.parentElement,
          cls = parent.classList,
          chartCl;
      
      for (var i = 0; i < cls.length; i++) {
        var cl = cls[i];
        if (cl != 'dc-chart' && cl.endsWith('-chart')) {
          chartCl = cl;
          break;
        }
      }
      
      switch (chartCl) {
      case 'monthly-move-chart':
        this.stockCharts.moveChart.filterAll();
        this.stockCharts.volumeChart.filterAll();
        break;
      case 'yearly-bubble-chart':
        this.stockCharts.yearlyBubbleChart.filterAll();
        break;
      case 'gain-loss-chart':
        this.stockCharts.gainOrLossChart.filterAll();
        break;
      case 'quarter-chart':
        this.stockCharts.quarterChart.filterAll();
        break;
      case 'day-of-week-chart':
        this.stockCharts.dayOfWeekChart.filterAll();
        break;
      case 'fluctuation-chart':
        this.stockCharts.fluctuationChart.filterAll();
        break; 
      default:
        return;
      }
      
      window.dc.redrawAll();
    },
    
    click: function(e) {
      var t = e.target;
      var tagName;
      while (t  &&  (tagName = t.tagName.toLowerCase())  &&  tagName != 'a') {
        t = t.parentElement;
      }
      
      if (tagName != 'a'  ||  !t.id)
        return;

      if (t.href == window.location.href)
        return;
      
      if (!this.isBuyGroup)
        return;      
        
      if (t.id != 'buy') {
        if (t.id == 'sell')
          Events.stopEvent(e);
        
        return;
      }
      
      var href = t.href;
      if (href && !G.domainRegExp.test(href)) {
        Events.trigger('navigate', href);
        return;
      }
      
      Events.stopEvent(e);
      var res = this.resource;
      var bl = this.purchasesBacklinkProp;
      var cbType = bl.range;
      var props = {};
      props[bl.backLink] = res.getUri();
      return this.router.navigate(U.makeMobileUrl('make', U.getLongUri1(cbType), props));
    },
    showOther: function(e) {
      var t = e.target;
      var tagName = t.tagName.toLowerCase();
      if (tagName == 'a')
        return;
      
//      var wl = G.currentApp.widgetLibrary
//      if (wl  &&  wl != 'Jquery Mobile') {
      Events.stopEvent(e);
      
      while (t.parentNode  &&  t.parentNode.tagName.toLowerCase() != 'ul')
        t = t.parentNode; 
      t.parentNode.$('ul').$toggleClass('hidden');
      this.getPageView().invalidateSize();        
      return;
//      }
    },
    refresh: function(resource, options) {
      options = options || {};
      if (options.skipRefresh || options.fromDB)
        return;
      
      var res = this.resource;   
      
//      if (res.lastFetchOrigin === 'edit')
//        return;
      
      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != res.collection || !_.contains(modified, res.getUri()))
          return this;
      }

      this.render();
    },
//    tap: Events.defaultTapHandler,  
//    click: Events.defaultClickHandler,
    
//    pruneProps: function(json) {
//      if (this.resource.isA("VideoResource")) {
//        var videoHtml5Prop = U.getCloneOf(this.vocModel, "VideoResource.videoHtml5")[0];
//        if (videoHtml5Prop)
//          delete json[videoHtml5Prop];
//      }
//    },
    
    render: function() {
      var self = this,
          args = arguments,
          invisible = false;
      
      if (!this.resource.isLoaded()) {
        this.toggleVisibility(true);
        invisible = true;
      }
      
      return this.ready.then(function() {
        self.renderHelper.apply(self, args);
        if (invisible)
          self.toggleVisibility();
        
        self.finish();
      });
    },
    
    renderHelper: function(options) {
      var self = this;
      var res = this.resource;
      var vocModel = this.vocModel;
      var frag = document.createDocumentFragment();
//      if (res.isA("CollaborationPoint"))
//        this.renderCollaborationPoint(frag);

      var params = _.getParamMap(window.location.hash);
      var isApp = U.isAssignableFrom(vocModel, G.commonTypes.App);
      var isAbout = (isApp  &&  !!params['$about']  &&  !!res.get('description')) || !!params['$fs'];
//      var isAbout = isApp  &&  !!params['$about']  &&  !!res.get('description');
      if (isAbout  &&  isApp) {
        this.el.classList.remove('hidden');
        this.el.$html(res.get('description'));
//        if (G.isJQM())
//          this.$el.trigger('create');
        
        return this;
      }
      var meta = vocModel.properties;
      var userRole = U.getUserRole();
      var json = res.attributes;
//      var json = res.toJSON();
//      this.pruneProps(json);


      var currentAppProps = U.getCurrentAppProps(meta);
      var propGroups;
      if (this.isBuyGroup) {
        this.el.$css({
          'float': "right",
          width: "45%",
          'min-width': "130"
        });
        
        var color = ['rgba(156, 156, 255, 0.95)', 'rgba(255, 0, 255, 0.8)', 'rgba(255, 255, 0, 0.95)', 'rgba(32, 173, 176, 0.8)', 'rgba(255, 156, 156, 0.8)', 'purple'];
        var colorIdx = 0;

        if (this.vocModel.type.endsWith("coupon/Coupon")) {
          if (json.discount < 90) {
            U.addToFrag(frag, this.priceTemplate({color: color[1], name: 'Discount', shortName: 'discount', value: U.getFlatValue(meta.discount, json.discount)})); //res.get('discount')})));
            U.addToFrag(frag, this.priceTemplate({color: color[0], name: 'You save', shortName: 'dealDiscount', value: U.getFlatValue(meta.dealAmount, json.dealValue) - U.getFlatValue(meta.dealPrice, res.get('dealPrice'))}));
          }
          else
            U.addToFrag(frag, this.priceTemplate({color: color[0], name: 'Deal value', shortName: 'dealValue', value: U.getFlatValue(meta.dealAmount, json.dealValue)}));
          
          var buyUrl = U.makePageUrl('make', 'http://www.hudsonfog.com/voc/commerce/coupon/CouponBuy', {coupon: this.resource.get('_uri'), '-makeId': G.nextId()});
          U.addToFrag(frag, this.buyTemplate({color: color[2], name: 'Price', shortName: 'dealPrice', value: U.getFlatValue(meta.dealPrice, res.get('dealPrice')), buyUrl: buyUrl}));
        }
        else {        
//          U.addToFrag(frag, this.priceTemplate(_.extend({color: color[1], name: 'Discount', shortName: 'discount', value: U.getFlatValue(meta.discount, json.discount)}))); //res.get('discount')})));
//          U.addToFrag(frag, this.priceTemplate(_.extend({color: color[0], name: 'You save', shortName: 'dealDiscount', value: U.getFlatValue(meta.dealAmount, json.dealAmount) - U.getFlatValue(meta.price, res.get('price'))})));
          var buyUrl = res.get('ItemListing.externalBuyUrl');
          U.addToFrag(frag, this.buyTemplate({color: color[2], name: meta['price'].displayName, shortName: 'price', value: U.getFlatValue(meta.price, res.get('price')), buyUrl: buyUrl}));
          U.addToFrag(frag, this.sellTemplate({color: color[2], background: 'rgba(255, 0, 0, 0.9)'}));
        }
        this.el.$html(frag);
        
//        if (G.isJQM())
//          this.$el.trigger('create');
        
        return this;
      }
      
      propGroups = U.getPropertiesWith(meta, "propertyGroupList"); // last param specifies to return array
//      propGroups = propGroups.length ? propGroups : U.getPropertiesWith(vocModel.properties, "propertyGRoupsList", true);
      propGroups = _.sortBy(propGroups, function(pg) {
        return pg.index;
      });
      
      var backlinks = U.getPropertiesWith(meta, "backLink");
//      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;

      if (isAbout) {
        var d = U.getCloneOf(vocModel, 'Submission.description');
        if (d.length > 0) {
          var val = res.get(d[0]);
          if (val) {
//            var val = U.makeProp({resource: res, propName: d, prop: meta[p], value: res.get(d)});
//            U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
            this.el.classList.remove('hidden');
            U.addToFrag(frag, '<div id="Description">' + val + '</div>');
            this.el.$html(frag);
            /*
            if (G.isJQM()) {
              if (this.el.$hasClass('ui-listview')) {
                this.$el.trigger('create');      
                this.$el.listview('refresh');
              }
              else
                this.$el.trigger('create');
            }
            */
            return this;
          }
        }
      }
      if (this.isTradle  &&  !G.currentUser.guest) {
        this.makeTemplate('socialLinksTemplate', 'socialTemplate', this.vocModel.type);
        U.addToFrag(frag, this.socialTemplate.call(this, {uri: this.resource.getUri()}));
      }
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var isJQM = G.isJQM();
      var isBB = G.isBB();
      var drawGauges;

      if (propGroups.length) {
        var grCollapsed, gr;
        for (var i = 0; i < propGroups.length; i++) {
          if (i != 0  &&  grCollapsed) {
            if (!isBB)
              gr += "</ul></li>";
            else
              gr += "</ul></section>";
            U.addToFrag(frag, gr);
            gr = null;
          }
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p) || !_.has(json, p) || _.has(backlinks, p))
              continue;
            
            var prop = meta[p];
            if (!prop) {
//              delete json[p];
              continue;
            }
                  
            if (!willShow(res, prop, userRole))
              continue;
  
            if (prop['app']  &&  (!currentAppProps || currentAppProps.indexOf(p) == -1))
              continue;
            displayedProps[p] = true;
            var val = U.makeProp(res, prop, res.get(p));
            grCollapsed = grMeta.displayCollapsed;
            if (!groupNameDisplayed) {
              if (!grMeta.skipLabelInGroup) {
                if (grCollapsed) {
                  if (isJQM)
                    gr = '<li id="' + grMeta.shortName + '" data-display="collapsed" style="border:0px;' + (G.theme.backgroundImage ? 'background-image: url(' + G.theme.backgroundImage + ')' : '') + '" data-content-theme="' + G.theme.list + '"  data-theme="' + G.theme.list + '"><h3 style="margin:0px;"><i class="ui-icon-plus-sign"></i>&#160;' + grMeta.displayName + '</h3><ul class="hidden"">';
                  else if (isBB)
                    gr = '<section id="' + grMeta.shortName + '" data-display="collapsed"><header style="margin:0px;cursor:pointer;' + (G.coverImage ? 'color:' + G.coverImage.background + ';border-bottom:0.1rem solid ' + G.coverImage.background + ';"' : '') + '"><i class="ui-icon-plus-sign"></i>&#160;' + grMeta.displayName + '</header><ul class="other hidden">';
                  else if (G.isTopcoat())
                    gr = '<li id="' + grMeta.shortName + '" data-display="collapsed topcoat-list__item" ' +  (G.coverImage ? 'style="text-shadow:none;background:' + G.coverImage.color + ';color: ' + G.coverImage.background + ';"' : '') + '><h3><i class="ui-icon-plus-sign"></i>&#160;' + grMeta.displayName + '</h3><ul class="topcoat-list__container hidden">';
                  else if (G.isBootstrap())
                    gr = '<li id="' + grMeta.shortName + '" data-display="collapsed"><h3 style="font-size:18px;"><i class="ui-icon-plus-sign"></i>&#160;' + grMeta.displayName + '</h3><ul class="list-group-container hidden">';
                  if (this.isTradle  &&  grMeta.shortName == 'expectedPerformance') {
                    if (this.resource.get('maxDrawdown') || this.resource.get('profit')) {
                      gr += '<li style="background:#2e3b4e;text-align:center;"><div class="gauges" style="display:inline-block">' + this.gaugesTemplate({
                        gauges: [{
                          shortName: 'profit',
                          name: 'Profit'
                        }, {
                          shortName: 'maxDrawdown',
                          name: 'Risk'
                        }]
                      }) + '<div></li>';
                      drawGauges = true;
//                      this.drawGauges();
                    }
                  }
                }
                
                else
                  U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              }
              groupNameDisplayed = true;
            }
  
            // remove HTML tags, test length of pure text
            var v = U.removeHTML(val.value).trim();
            if (prop.code) {
              val.value = this.__prependNumbersDiv(prop, val.value);          
            }
            if (grCollapsed)
              gr += this.getPropRow(val, v);
            else
              U.addToFrag(frag, this.getPropRow(val, v));
//            json[p] = val;
          }
        }
        if (i != 0  &&  grCollapsed) {
          if (!isBB)
            gr += "</ul></li>";
          else
            gr += "</ul></section>";
          U.addToFrag(frag, gr);
      
        }
      }
      var otherLi;
      groupNameDisplayed = false;
      var numDisplayed = _.size(displayedProps);
      if (!this.isBuyGroup  &&  this.vocModel.type.endsWith("/Coupon")) {
        displayedProps['price'] = true;
        displayedProps['dealAmount'] = true;
        displayedProps['value'] = true;
        displayedProps['discount'] = true;
      }
      for (var p in json) {
        if (!/^[a-zA-Z]/.test(p))
          continue;

        var prop = meta[p];
        if (!_.has(json, p) || displayedProps[p] || _.has(backlinks, p))
          continue;
        
        if (!prop) {
//          delete json[p];
          continue;
        }
        if (prop['app']  &&  (!currentAppProps || currentAppProps.indexOf(p) == -1))
          continue;
        if (prop.autoincrement)
          continue;
//        if (prop.displayNameElm)
//          continue;
        if (!willShow(res, prop)) //(!U.isPropVisible(res, prop))
          continue;
  
//        var wl = G.currentApp.getWidgetLibrary();
//        var isJQM = au!wl  ||  wl == 'Jquery Mobile';
//        var isBB = !isJQM  &&  wl == 'Building Blocks';
        if (numDisplayed  &&  !groupNameDisplayed) {
//          var wl = G.currentApp.widgetLibrary;
          var otherTitle = "Other";
          if (isJQM)
            otherLi = '<li id="other" data-display="collapsed" style="border:0px;' + (G.theme.backgroundImage ? 'background-image: url(' + G.theme.backgroundImage + ')' : '') + '" data-content-theme="' + G.theme.list + '"  data-theme="' + G.theme.list + '"><h3 style="margin:0px;"><i class="ui-icon-plus-sign"></i>&#160;' + otherTitle + '</h3><ul class="hidden"">';
          else if (isBB)
            otherLi = '<section id="other" data-display="collapsed"><header style="margin:0px;cursor:pointer;' + (G.coverImage ? 'color:' + G.coverImage.background + ';border-bottom:0.1rem solid ' + G.coverImage.background + ';"' : '') + '"><i class="ui-icon-plus-sign"></i>&#160;' + otherTitle + '</header><ul class="other hidden">';
          else if (G.isTopcoat())
            otherLi = '<li id="other" data-display="collapsed topcoat-list__item" ' +  (G.coverImage ? 'style="text-shadow:none;background:' + G.coverImage.color + ';color: ' + G.coverImage.background + ';"' : '') + '><h3><i class="ui-icon-plus-sign"></i>&#160;' + otherTitle + '</h3><ul class="topcoat-list__container hidden">';
          else if (G.isBootstrap())
            otherLi = '<li id="other" data-display="collapsed"><h3 style="font-size:18px;"><i class="ui-icon-plus-sign"></i>&#160;' + otherTitle + '</h3><ul class="list-group-container hidden">';
  //        this.$el.append('<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'); 
          groupNameDisplayed = true;
        }
        
        displayedProps[p] = true;
        var val = U.makeProp(res, prop, res.get(p));
        if (prop.code) {
          val.value = this.__prependNumbersDiv(prop, val.value);          
        }
        
        var v = U.removeHTML(val.value).trim();
        if (otherLi)
          otherLi += this.getPropRow(val, v);
        else 
          U.addToFrag(frag, this.getPropRow(val, v));
      }
      
      if (otherLi) {
        if (!isBB)
          otherLi += "</ul></li>";
        else
          otherLi += "</ul></section>";
        U.addToFrag(frag, otherLi);
      }
  //    if (displayedProps.length  &&  groupNameDisplayed)
  //      this.$el.append("</ul></li>");
      
  //    var j = {"props": json};
  //    this.$el.html(html);
      this.el.$html(frag);
      if (drawGauges)
        this.drawGauges();

//      if (hasSocialLinks) {
//        this.el.style.marginTop = '-6rem';
//      }
      /*
      if (G.isJQM()) {
        if (this.el.$hasClass('ui-listview')) {
          this.$el.trigger('create');      
          this.$el.listview('refresh');
        }
        else
          this.$el.trigger('create');
      }
      */
      if (_.isEmpty(displayedProps))
        this.el.$hide();
      else
        this.el.$show();

      if (this.isCode && CodeMirror) {
//        var doc = document;
//        var codeNodes = this.$('[data-code]');
//        _.each(codeNodes, function(codeNode) {
//          var lineNo = 1;
//          var output = $(codeNode).find('pre')[0];
//          var text = output.innerHTML.trim();
//          if (!text.length)
//            return;
//          
//          var numbers = this.$('div#{0}_numbers'.format(codeNode.$data('shortname')))[0];
//          output.innerHTML = numbers.innerHTML = '';
//          function highlight(line) {
//            numbers.appendChild(doc.createTextNode(String(lineNo++)));
//            numbers.appendChild(doc.createElement("BR"));
//            for (var i = 0; i < line.length; i++) { 
//              output.appendChild(line[i]);
//            }
//            
//            output.appendChild(doc.createElement("BR"));
//          }
//
//          highlightText(text, highlight);
//        }.bind(this));
        
        var textareas = this.$('textarea[data-code]'),
            textarea,
            editor,
            i = textareas.length;
        
        while (i--) {
          textarea = textareas[i];
          var mode = textarea.$data('code');
          switch (mode) {
            case 'html':
              mode = 'text/html';
              break;
            case 'css':
              mode = 'css';
              break;
//            case 'js':
//              mode = 'javascript';
//              break;
            default: {
//              debugger;
              mode = 'javascript';
              break;
            }
          }
          
          editor = CodeMirror.fromTextArea(textarea, {
            dragDrop: false,
            mode: mode,
            tabMode: 'indent',
            lineNumbers: true,
            viewportMargin: Infinity,
            tabSize: 2,
            readOnly: true
          });
          
          // sometimes the textarea will have invisible letters, or be of a tiny size until you type in it. This is a preventative measure that seems to work
          setTimeout(editor.refresh.bind(editor), 50);
//          $(".Codemirror").focus();
//          var $this = $(this);
        }
      }
      else if (U.isAssignableFrom(vocModel, "Stock") || U.isAssignableFrom(vocModel, "Index")) {
        this.chartHolder = this.getPageView().el.$('.stockCharts')[0];
        if (!this.chartHolder)
          return;

        var cb = '_urbienJSONPCallback' + G.nextId();
        window[cb] = function(data) {
          delete window[cb];
          var q = data && data.query,
              results = q && q.results,
              rows = results && results.row;
          
          if (rows && rows.length)
            self.drawStockChart(data.query.results.row);
        };
        
//        this.chartLibsPromise = U.require(['dc', 'crossfilter', 'd3']).done(function(_DC, _Crossfilter, _D3) {
        this.chartLibsPromise = U.require(['dc', 'crossfilter', 'colorbrewer', 'd3', 'stockCharts']).done(function(_DC, _Crossfilter, _Colorbrewer, _D3, _StockCharts) {
//          DC = _DC;
//          Crossfilter = _Crossfilter;
//          D3 = _D3;
          StockCharts = _StockCharts;
        });
        
        // get chart for the last year
//        var now = new Date(),
//            month = now.getMonth(),
//            day = now.getDate(),
//            year = now.getFullYear();
//        
//        var yahooIChartUrl = "http://ichart.yahoo.com/table.csv?" + _.param({
//          s: res.get('symbol'),
//          // from date
//          a: month,
//          b: day,
//          c: year - 1,
//          // to date
//          d: month,
//          e: day,
//          f: year
//        });

        var yahooIChartUrl,
            chartParams = {
              s: res.get('symbol'),
              g: 'd' // daily interval
            },
            fromDate,
            rangeCenter = this.hashParams.$date,
            rangeSize = this.hashParams.$dateRange;
        
        if (rangeCenter) {
          rangeCenter = parseInt(rangeCenter);
          fromDate = new Date(rangeCenter - rangeSize / 2);
        }
        else
          fromDate = new Date(new Date().getTime() - 365 * 24 * 3600 * 1000);

        fromMonth = fromDate.getMonth(),
        fromDay = fromDate.getDate(),
        fromYear = fromDate.getFullYear();
        
        chartParams.a = fromMonth;
        chartParams.b = fromDay;
        chartParams.c = fromYear;

        if (rangeCenter) {
          var toDate = new Date(rangeCenter + rangeSize / 2);
          chartParams.d = toDate.getMonth();
          chartParams.e = toDate.getDate();
          chartParams.f = toDate.getFullYear();
        }
        
        var yahooIChartUrl = "http://ichart.yahoo.com/table.csv?" + _.param(chartParams);
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.async = true;
        script.src = "//query.yahooapis.com/v1/public/yql?" + _.param({
          q: "select * from csv where url = '" + yahooIChartUrl + "'",
          format: 'json',
//          diagnostics: true,
          callback: cb
        });
        
        document.head.appendChild(script);
      }

      return this;
    },
    
    drawStockChart: function(data) {
      var self = this;
      this.chartLibsPromise.done(function() {
        self._drawStockChart(data);
      });
    },
    
    _drawStockChart: function(data) {
      var self = this,
          colNames = data[0],
          n = data.length,
          row,
          numberFormat = d3.format(".2f"),
          dateFormat = d3.time.format("%Y-%m-%d"),
          dateCol,
          openCol,
          closeCol,
          volumeCol,
          colName;
      
      for (var p in colNames) {
        colName = colNames[p];
        switch (colName.toLowerCase()) {
        case 'date':
          dateCol = p;
          break;
        case 'open':
          openCol = p;
          break;
        case 'close':
          closeCol = p;
          break;
        case 'volume':
          volumeCol = p;
          break;
        }
      }
      
      for (var i = 1; i < n; i++) {
        row = data[i];
        row.dd = dateFormat.parse(row[dateCol]);
        row.month = d3.time.month(row.dd); // pre-calculate month for better performance
        row.close = +row[closeCol]; // coerce to number
        row.open = +row[openCol]; // coerce to number
        row.volume = +row[volumeCol]; // coerce to number
      }
      
      Array.removeFromTo(data, 0, 1);
      if (!this.stockChartsTemplate)
        this.makeTemplate('stockChartsTemplate', 'stockChartsTemplate', this.vocModel.type);
      
      this.chartHolder.$html(this.stockChartsTemplate());
      this.stockCharts = StockCharts(data, this.chartHolder);
      this.chartHolder.classList.remove('hidden');
      this.getPageView().invalidateSize();
//      this.redelegateEvents();
    },

    _maxChars: 30,
    _maxCharsBeforeSkippingLabel: 100,
    getPropRow: function (val, v) {
      var valLength = val.name.length + v.length;
      if (valLength > this._maxCharsBeforeSkippingLabel)
        return this.propRowTemplate3(val);
      else if (valLength > this._maxChars)
        return this.propRowTemplate2(val);
      else
        return this.propRowTemplate(val);
    },
    
//    renderCollaborationPoint: function(frag) {
//      if (!this.authorTemplate)
//        this.authorTemplate = this.makeTemplate('authorTemplate', 'authorTemplate', model.type);
//      
//      var res = this.resource,
//          model = this.vocModel,
//          desc = res.get("Submission.description"),
//          authorPropName = U.getCloneOf(vocModel, "Submission.submittedBy")[0],
//          authorName = res.get(authorPropName + ".displayName"),
//          authorThumb = res.get(authorPropName + ".thumb"),
//          authorHtml = this.authorTemplate({
//            img: authorThumb && U.getExternalFileUrl(authorThumb),
//            name: authorName
//          }),
//          dateSubmitted = res.get("Submission.dateSubmitted"),
//          dateDiv = document.createElement('div'),
//      
//      dateDiv.classList.add('dateSubmitted');
//      dateDiv.textContent = dateSubmitted;
//      U.addToFrag(frag, authorHtml);
//      frag.appendChild(dateDiv);
//
//      <li class="collaborationPoint"></li>
//      this.el.classList.add("collaborationPoint");
//      
//    },
    
    __prependNumbersDiv: function(prop, html) {
//      return '<div id="{0}_numbers" style="float: left; width: 2em; margin-right: .5em; text-align: right; font-family: monospace; color: #CCC;"></div>'.format(prop.shortName) + html;
      return html;
    },
    _gaugeValues: {},
    drawGauges: function() {
//      U.require('lib/gauge').done(this.doDrawGauges);
//    },
//
//    doDrawGauges: function(Gauges) {
      var meta = this.vocModel.properties;
      var canvases = this.el.$('canvas');
      for (var i = 0; i < canvases.length; i++) {
        var canvas = canvases[i];
        var pName = canvas.$data('shortname');
        var value = this.resource.get(pName);
//        var refresh = false;
        if (value === undefined)
          continue;
        
//        if (value === this._gaugeValues[pName])
//          refresh = true;
        
        this._gaugeValues[pName] = value;
        var prop = meta[pName];
        var isPercent = prop.facet == 'Percent';
        var isMoney = prop.range.endsWith('Money');
        var gauge = new Gauges.Gauge(canvas);
        gauge.setOptions({
          textPrefix: isMoney ? '$' : '',
          textSuffix: isPercent ? '%' : '',
          lines: 12,
          angle: 0,
          lineWidth: 0.44,
          fontSize: '1rem',
          pointer: {
            length: 0.9,
            strokeWidth: 0.035,
            color: '#000000'
          },
//          limitMax: 'false', 
          percentColors: theBiggerTheBetter(prop) ? BIGGER_BETTER_PERCENT : BIGGER_WORSE_PERCENT, // !!!!
          strokeColor: '#E0E0E0',
          generateGradient: true
        });
      
        gauge.setTextField(canvas.previousElementSibling);
        gauge.maxValue = 100 * Math.ceil(value / 100);
        gauge.animationSpeed = 10;
        gauge.set(value);
//        if (update) {
//          gauge.ctx.clearRect(0, 0, gauge.ctx.canvas.width, gauge.ctx.canvas.height);
//          gauge.render();
//        }
      }
    }
    

  }, {
    displayName: 'ResourceView'
  });
});
