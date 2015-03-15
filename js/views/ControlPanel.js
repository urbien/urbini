//'use strict';
define('views/ControlPanel', [
  'globals',
  'underscore',
  'events',
  'utils',
  'views/BasicView',
  'vocManager',
  'collections/ResourceList',
  'lib/fastdom',
  'physicsBridge'
], function(G, _, Events, U, BasicView, Voc, ResourceList, Q, Physics) {
 
  var ORDERS = U.getTradleOrdersProp(),
      appPath = G.currentApp.appPath,
      ORDERS_NAME = appPath == 'Restaurant' ? 'ORDERS' : 'TRADES',
      ADD_ORDERS_HINT = 'ADD ' + ORDERS_NAME + ' TO BE EXECUTED WHEN THIS TRADLE FIRES',
      ADD_ORDERS_BTN_TEXT = '+ADD ' + ORDERS_NAME;
  
  function getLi(el) {
    return el.tagName == 'LI' ? el : el.$closest('li');
  };

  function getBacklinkSub(vocModel, bl) {
    if (vocModel.shortName == 'Tradle' && bl == 'indicators')
      return 'feeds';

    return bl;
  };
  

  function shouldPaintOverlay(res, blProp) {
    if (!res)
      return false;

    if (res.isAssignableFrom('commerce/trading/Tradle')) {
      if (blProp.shortName == 'notifications' || !U.isPropEditable(res, blProp))
        return false;
    }

    return true;
  };

  function getIndicatorsCount(res) {
    if (typeof res == 'number')
      return res;

    var il = res.getInlineList('indicators');
    if (il)
      return il.length;

    return res.get('indicatorsCount');
  };

  function getIndicatorsCountBlock(res) {
    return '<div class="cnt">INDICATORS<span class="cntBadge">' + getIndicatorsCount(res) + '</span></div>';
  };

  var SLIDER_CL = 'slider';
  var SLIDER_ACTIVE_CL = 'slider-active';
  var CLICK_INDICATOR = 'Click an indicator to create a rule with it';
  var CLICK_INDICATOR1 = 'To remove this rule, swipe right to left.<br /><br />If you\'re looking for indicators, click the large "IF" button above';

  return BasicView.extend({
    tagName: "tr",
    autoFinish: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh', 'add', 'insertInlineScroller', 'removeInlineScroller', 'toggleInlineScroller', 'doRenderFT',
                      'restoreCollapsables', 'paintOverlay', 'showOverlay', 'hideOverlays'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', type);
      this.makeTemplate('inlineListItemTemplate', 'inlineListItemTemplate', type);
      this.makeTemplate('inlineAddTemplate', 'inlineAddTemplate', type);

//      this.makeTemplate('comment-item', 'commentItemTemplate', type);
      this.makeTemplate('cpTemplate', '_cpTemplate', type);
      this.makeTemplate('cpMainGroupTemplate', 'cpMainGroupTemplate', type);
      this.makeTemplate('cpMainGroupTemplateH', 'cpMainGroupTemplateH', type);
      this.makeTemplate('cpTemplateNoAdd', 'cpTemplateNoAdd', type);
      this.listenTo(this.resource, 'change', this.refresh);
      this.isMainGroup = options.isMainGroup;
      this.dontStyle = this.isMainGroup && options.dontStyle;
      this._backlinkInfo = {};
      return this;
    },

    modelEvents: {
      'inlineList': 'updateInlineList',
      'change': 'update'
    },

    events: {
//      'click a[data-shortName]': 'click',
      'click [data-cancel]': 'cancel',
      'click #mainGroup a[data-shortName]': 'add',
      'click .add': 'add',
      'click [data-backlink]': 'clickInlined',
      'swipeleft [data-backlink]': 'onswipeleft',
      'click .drawer-tab-left': 'onswipeleft',
      'swiperight [data-backlink]': 'onswiperight',
      'click .drawer-tab-right': 'onswiperight',
//      'click a[data-shortName]': 'lookupFrom',
//      'pinchout li[data-propname]': 'insertInlineScroller',
//      'pinchin li[data-propname]': 'removeInlineScroller',
      'hold li[data-propname]': 'toggleInlineScroller',
      'click [data-action="cancel"]': 'actionCancel',
      'click [data-action="add"]': 'actionAdd',
      'click [data-action="edit"]': 'actionEdit',
      'click [data-action="comment"]': 'actionComment',
      'click header .cta:not(.disabled)': 'backlinkAction',
      'click .anim-overlay': Events.stopEvent
//        ,
//      'click': 'click'
    },

    myEvents: {
      'inactive': 'delayedHideOverlays'
    },

    updateInlineList: function(res, propName, event, arg) {
      if (event == 'removed') {
        if (arg) {
          if (U.isModel(arg))
            arg = [arg];

          arg.map(this.stopListening);
        }
      }

      this.update();
    },

    delayedHideOverlays: function() {
      var self = this;
      setTimeout(function() {
        self.hideOverlays();
      }, 100);
    },

    hideOverlays: function() {
      this.$('.anim-overlay-active').$removeClass('anim-overlay-active');
    },

    paintOverlay: function(li) {
      var blProp = this.vocModel.properties[li.$data('backlink')],
          vocModel = U.getModel(blProp.range),
          uri = li.$data('uri'),
          res = U.getResource(uri),
          overlay = li.$('.anim-overlay')[0],
          overlayHTML;

      if (!res) {
        if (uri)
          U.getResourcePromise(uri).done(this.paintOverlay.bind(this, li));

        return;
      }

      if (!shouldPaintOverlay(this.resource, blProp))
        return false;

      var actions = {
        cancel: res.isA('Cancellable') && !res.get('Cancellable.cancelled'),
        edit: !U.isAssignableFrom(vocModel, 'commerce/trading/Rule', 'commerce/trading/TradleIndicator'),
        add: U.isPropEditable(res, blProp),
        comment: res.isA('CollaborationPoint') // || this.resource.isA('CollaborationPoint')
      };

      if (!_.any(actions, function(v, k) { return v }))
        return false;

      if (!this.actionsOverlayTemplate)
        this.makeTemplate('actionsOverlayTemplate', 'actionsOverlayTemplate', this.vocModel.type);

      overlayHTML = this.actionsOverlayTemplate({
        _uri: uri,
        actions: actions,
        active: li.$hasClass('anim-overlay-active')
      });

      if (overlay)
        overlay.$remove();

      li.$prepend(overlayHTML);
      overlay = li.$('.anim-overlay')[0];
      return true;
    },

    onswiperight: function(e) {
      this.hideOverlays();
    },

    onswipeleft: function(e) {
      var self = this,
          li = getLi(e.selectorTarget);

      if (!li)
        return;

      this.hideOverlays();
      if (this.paintOverlay(li)) {
        setTimeout(function() {
          self.showOverlay(li);
        }, 1);
      }
    },

    showOverlay: function(li) {
//      li.$('.anim-overlay').$addClass('anim-overlay-active');
      li.$addClass('anim-overlay-active');
    },

    actionCancel: function(e) {
      this.cancel(e);
    },

    actionAdd: function(e) {
      Events.stopEvent(e);
      var li = getLi(e.target),
          backlink = li.$data('backlink'),
          isTradle = this.vocModel.shortName == 'Tradle';

      if (isTradle && backlink == 'tradleRules') {
        U.alert(CLICK_INDICATOR1);
        return;
      }
      else {
        var self = this;
        this.addToBacklink(backlink);
      }
    },

    actionEdit: function(e) {
      Events.stopEvent(e);
      this.hideOverlays();
      var li = getLi(e.target),
          uri = U.getResource(li.$data('uri'));

      Events.trigger('navigate', U.makeMobileUrl('edit', uri));
    },

    actionComment: function(e) {
      Events.stopEvent(e);
      var li = getLi(e.target),
          res = U.getResource(li.$data('uri')),
          vocModel;

      if (!res.isA('CollaborationPoint'))
        res = this.resource;

      vocModel = res.vocModel;
      if (!res.isA('CollaborationPoint')) {
        U.alert("Sorry, no comments allowed here!");
        return;
      }

      this.addToBacklink(this.vocModel.properties[U.getCloneOf(vocModel, 'CollaborationPoint.comments')]);
    },

    cancel: function(e) {
      Events.stopEvent(e);
      var li = getLi(e.selectorTarget);
      if (!li) {
        debugger;
        return;
      }

      var uri = li.$data('uri'),
          res,
          getRes;

      if (!uri) {
        debugger;
        return;
      }

      res = U.getResource(uri);
      if (res)
        getRes = G.getResolvedPromise();
      else {
        getRes = Voc.getModels(this.vocModel.properties[li.$data('backlink')].range).done(function(listModel) {
          res = new listModel({
            _uri: uri
          });
        });
      }

      getRes.done(function() {
        res.cancel({
          redirect: false,
          skipRefresh: true
        });
      });
    },

    getIndicatorsBlock: function() {
      return this.$('section[data-backlink="indicators"]');
    },

    getTradesBlock: function() {
      return this.$('section[data-backlink="{0}"]'.format(ORDERS));
    },

    hideIndicators: function(e) {
      var block = this.getIndicatorsBlock();
      if (block.length) {
        block.$removeClass(SLIDER_ACTIVE_CL);
        var page = this.getPageView();
        page.invalidateSizeIn(300);
        page.invalidateSizeIn(500);
        return true;
      }
    },

    // hideTrades: function(e) {
    //   var block = this.getTradesBlock();
    //   if (block.length) {
    //     block.$removeClass(SLIDER_ACTIVE_CL);
    //     var page = this.getPageView();
    //     page.invalidateSizeIn(300);
    //     page.invalidateSizeIn(500);
    //     return true;
    //   }
    // },

    showIndicators: function() {
      var el = this.getIndicatorsBlock()[0],
          page = this.getPageView(),
          li,
          hasIndicators;

      if (!el)
        return;

      el.$addClass(SLIDER_ACTIVE_CL);
      page.invalidateSizeIn(300);
      page.invalidateSizeIn(500);

      /*
      page.scrollToElement(el, false);
      li = el.$('li');
      if (li.length > 1) {
        li = li.length > 2 ? li[1] : li[0];

        page.addTooltip({
          el: li,
          tooltip: CLICK_INDICATOR,
          direction: 'bottom',
          type: 'info',
          style: 'square'
        });
      }
      */

      return true;
    },

    // showTrades: function() {
    //   var el = this.getTradesBlock()[0],
    //       page = this.getPageView(),
    //       li,
    //       hasIndicators;

    //   if (!el)
    //     return;

    //   el.$addClass(SLIDER_ACTIVE_CL);
    //   page.invalidateSizeIn(300);
    //   page.invalidateSizeIn(500);
    //   return true;
    // },

    toggleIndicators: function() {
      var block = this.getIndicatorsBlock()[0];
      if (!block)
        return;

      if (block.$hasClass(SLIDER_ACTIVE_CL))
        this.hideIndicators();
      else
        this.showIndicators();
    },

    toggleTrades: function() {
      var block = this.getTradesBlock()[0];
      if (!block)
        return;

      var add = block.$('li[data-action="add"]')[0];
      if (add)
        add.$remove();
      else {
        add = this.inlineAddTemplate({
          backlink: ORDERS,
          hint: ADD_ORDERS_HINT,
          action : ADD_ORDERS_BTN_TEXT
        });

        block.$append(add);
      }

      this.getPageView().invalidateSize();

      // if (block.$hasClass(SLIDER_ACTIVE_CL))
      //   this.hideTrades();
      // else
      //   this.showTrades();
    },

    backlinkAction: function(e) {
      var t = e.selectorTarget,
          shortName = t.$data('shortname');

      Events.stopEvent(e);
      if (shortName == ORDERS)
        return this.toggleTrades();

      if (shortName == 'tradleRules')
        return this.toggleIndicators();
    },

//    click: function(e) {
//      var t = e.target;
//      while (t && t.tagName != 'A') {
//        t = t.parentNode;
//      }
//
//      if (!t)
//        return;
//      this.prop = this.vocModel.properties[t.$data('propname')];
//      if (prop)
//        G.log(this.TAG, "Recording step for tour: selector = 'propName'; " + " value = '" + t.$data('propname') + "'");
//    },

    cpTemplate: function(data) {
      var action = 'list',
          self = this,
          prop = data.prop,
          isEditable = U.isPropEditable(this.resource, data.prop, U.getUserRole()),
          params = {
            $title: data.title
          };

      params[data.backlink] = data._uri;
      if (isEditable && !data.prop.lookupFrom && !U.getBacklinkCount(this.resource, data.shortName)) {
        params.$backLink = data.backlink;
        action = 'make';
        var attProp;
      }
      
      if (U.isA(this.vocModel, 'FileSystem')) {
        attProp = U.getCloneOf(this.vocModel, 'FileSystem.attachmentsUrl');
        if (attProp.length) {
          params.$location = this.resource.get(attProp[0]);
          params.$prop = data.prop.shortName;
        }
      }

      data.params = params;
      _.copyInto(params, data, '$orderBy', '$asc');
      data.action = action;
      return this._cpTemplate(data);
    },

    _addNoIntersection: function(prop, target) {
      var params = {
        '$backLink': prop.backLink,
          '-makeId': G.nextId()
        },
        title = target && target.$data('title');

      if (title)
        params.$title = title;

      if (title)
        params.$title = title;

      params[prop.backLink] = this.resource.getUri();
      if (U.isAssignableFrom(this.vocModel, 'commerce/trading/TradleFeed') && prop.range.endsWith('commerce/trading/Rule')) {
        _.extend(params, this.resource.pick('eventClass', 'eventClassRangeUri', 'feed', 'tradle', 'feed.displayName'));
      }

      Events.trigger('navigate', U.makeMobileUrl('make', prop.range, params));
      this.log('add', 'user wants to add to backlink');
    },

//    lookupFrom: function(e) {
//      var data = e.selectorTarget.dataset,
//          res = this.resource,
//          meta = this.vocModel.properties,
//          lookupFrom = data.lookupfrom.split('.'),
//          base = meta[lookupFrom[0]],
//          baseVal = res.get(base.shortName),
//          toProp = meta[data.shortname],
//          info = {
//            params: {
//              $backLink: toProp.shortName,
//            },
//            action: 'make'
//          };
//
//      return Voc.getModels([base.range, toProp.range]).then(function(baseModel, blModel) {
//        if (U.isA(blModel, 'Templatable')) {
//          var bl = baseModel.properties[lookupFrom[1]];
//          var params = U.filterObj(info.params, U.isModelParameter);
//          info.params = U.filterObj(info.params, U.isMetaParameter);
//          info.params[U.getCloneOf(blModel, 'Templatable.isTemplate')[0]] = true;
//          info.params[bl.backLink] = baseVal;
//          info.params.$template = _.param(params);
//        }
//
//        if (U.isA(model, 'Folder') && U.isA(blModel, 'FolderItem')) {
//          var rootFolder = U.getCloneOf(blModel, 'FolderItem.rootFolder')[0],
//              parentFolder = U.getCloneOf(model, 'Folder.parentFolder')[0];
//
//          if (rootFolder && parentFolder) {
//            rootFolder = blModel.properties[rootFolder];
//            parentFolder = model.properties[parentFolder];
//            if (rootFolder.range == parentFolder.range) {
//              var val = res.get('Folder.parentFolder');
//              info.params.$rootFolder = val;
//              info.params.$rootFolderProp = rootFolder.shortName;
//            }
//          }
//        }
//
//        return info;
//      });
//    },

    clickInlined: function(e) {
      var link = e.selectorTarget,
          dataBL = link.$data('backlink'),
          add = link.$data('action') == 'add',
          isSection = link.tagName == 'SECTION';

      if (add || isSection)
        return;

      if (dataBL == 'tradleRules') {
        Events.stopEvent(e);
        U.alert(CLICK_INDICATOR1);
        return;
      }

      if (dataBL != 'indicators' || !this.vocModel.type.endsWith('commerce/trading/Tradle')) {
        var href = link.$data('href') || link.href;
        if (href)
          Events.trigger('navigate', href);
        else
          Events.stopEvent(e);

        return;
      }

      Events.stopEvent(e);
      var indicators = this.resource.getInlineList('indicators'),
          indicator = indicators.get(link.$data('uri')),
          propRange = indicator.get('eventPropertyRangeUri'),
          eventRange = indicator.get('eventClassRangeUri'),
          eventPropertyUri = indicator.get('eventPropertyUri'),
          isEnum = /\/EnumProperty$/.test(propRange),
          propType = indicator.get('propertyType'),
          params = {
            indicator: indicator.getUri(),
            feed: indicator.get('feed'),
            tradle: indicator.get('tradle'),
            tradleFeed: indicator.get('tradleFeed'),
            'tradleFeed.displayName': indicator.get('tradleFeed.displayName')
          },
          subClassOf;

      var sf = indicator.get('pollFrequency');

      if (sf)
        params.sustainFrequency = sf;
      if (propRange)
        params.eventPropertyRangeUri = propRange;
      if (eventRange)
        params.eventClassRangeUri = eventRange;

      this.hideIndicators();

      switch (propType) {
      case 'Text':
        subClassOf = isEnum ? 'commerce/trading/EnumRule' : 'commerce/trading/StringRule';
        break;
      case 'Date':
        subClassOf = 'commerce/trading/DateRule';
        break;
      case 'Link':
        subClassOf = 'commerce/trading/LinkRule';
        break;
      case 'YesNo':
        subClassOf = 'commerce/trading/BooleanRule';
        break;
//      /* falls through */
      default:
        subClassOf = 'commerce/trading/NumericRule';
        break;
      }

      if (isEnum || propType == 'Link' || propType == 'YesNo') { // no subclasses
//        var params = _.extend(U.filterObj(this.resource.attributes, U.isNativeModelParameter), props);
        params.$title = indicator.get('feed.displayName') + ' ' + U.getDisplayName(indicator) + ' IS...';
        params.eventPropertyRangeUri = propRange;
        Events.trigger('navigate', U.makeMobileUrl('make', subClassOf, params));
        return;
      }

      var ruleParams = {
        subClassOfUri: G.defaultVocPath + subClassOf,
        $createInstance: 'y',
        $props: _.param(params),
        $title: (indicator.get('feed.displayName') || '') + ' ' + U.getDisplayName(indicator)
      };

      var showCompareWithRules = indicators.any(function(i) {
        return i != indicator && i.get('eventPropertyRangeUri') == propRange && i.get('eventClassRangeUri') == eventRange;
      });

      if (!showCompareWithRules) {
        // ruleParams.$notin = 'name,MoreThanIndicatorByRule,LessThanIndicatorByRule';
        // ruleParams.$and = 'davClassUri=' + _.encode('!' + U.getTypeUri('commerce/trading/MoreThanIndicatorByRule')) + '&' +
        //                   'davClassUri=' + _.encode('!' + U.getTypeUri('commerce/trading/LessThanIndicatorByRule'));

        ruleParams.$and = 'name=' + _.encode('!MoreThanIndicatorByRule') + '&' +
                          'name=' + _.encode('!LessThanIndicatorByRule');

        // HACK!
        // ruleParams.name = "!MoreThanIndicatorByRule";
        // ruleParams.davClassUri = "!" + U.getTypeUri('commerce/trading/LessThanIndicatorByRule');
      }

      if (propType == 'Percent' || (eventPropertyUri && eventPropertyUri).endsWith('/commerce/trading/TradleEvent/timesFiredSinceActivation')) {
        var and = 'name=' + _.encode('!RoseMoreThanRule') + '&' + 'name=' + _.encode('!FellMoreThanRule');
        ruleParams.$and = ruleParams.$and ? ruleParams.$and + '&' + and : and;
      }

      Events.trigger('navigate', U.makeMobileUrl('chooser', 'system/designer/WebClass', ruleParams));
    },

    add: function(e) {
//      var t = e.target;
//      while (t && t.tagName != 'A') {
//        t = t.parentNode;
//      }
//
//      if (!t)
//        return;
//
//      Events.stopEvent(e);
      var t = e.selectorTarget;
      if (t.tagName != 'A')
        return;

      Events.stopEvent(e);
//      if ($(t).parents('.__dragged__').length)
//        return;

      var shortName = t.$data('shortname');
      this.addToBacklink(this.vocModel.properties[shortName], t);
    },

    addToBacklink: function(prop, t) {
      prop = this.vocModel.properties[getBacklinkSub(this.vocModel, prop.shortName || prop)];
      var self = this,
          setLinkTo = prop.setLinkTo,
          shortName = prop.shortName;

//      ,
//          count = U.getBacklinkCount(this.resource, shortName);
//
//      if (count > 0) {
//        Events.trigger('navigate', t.href);
//        return;
//      }

//      this.log("Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");
      if (setLinkTo) {
        shortName = setLinkTo;
        prop = this.vocModel.properties[shortName];
      }

//      G.log(this.TAG, "Recording step for tour: selector = 'data-shortname'; value = '" + shortName + "'");

      Voc.getModels(prop.range).done(function(pModel) {
        if (!U.isAssignableFrom(pModel, 'Intersection')) {
          self._addNoIntersection(prop, t);
          return;
        }

        var a = U.getCloneOf(pModel, 'Intersection.a')[0];
        var b = U.getCloneOf(pModel, 'Intersection.b')[0];
        if (!a  &&  !b) {
          self._addNoIntersection(prop, t);
          return;
        }

        var meta = pModel.properties,
            title = self.hashParams.$title,
            propA = meta[a],
            propB = meta[b],
            aUri = a == prop.backLink ? self.resource.get('_uri') : null,
            bUri = !aUri  &&  b == prop.backLink ? self.resource.get('_uri') : null;

        if (!title) {
          if (self.resource.isAssignableFrom('commerce/trading/Tradle') && prop.shortName == 'feeds')
            title = 'Choose an indicator';
          else
            title = U.makeHeaderTitle(self.resource.get('davDisplayName'), pModel.displayName);
        }

        if (!aUri  &&  !bUri) {
          self._addNoIntersection(prop, t);
          return;
        }

        if (!aUri && propA.readOnly || !bUri && propB.readOnly) {
          self._addNoIntersection(prop, t);
          return;
        }

        var uri = aUri == null ? bUri : aUri;
        var rtype = aUri == null ? propA.range : propB.range;
        var params = {
          $forResource: uri,
          $propA: a,
          $propB: b,
          $type:  pModel.type,
          $title: title
        };

        var where = aUri == null ? propA.where : propB.where;
        if (where)
          _.extend(params, U.getQueryParams(where));

/*        if (!params.$orderBy && U.isA(pModel, 'ImageResource')) {
          var imgProp = U.getCloneOf(pModel, 'ImageResource.originalImage')[0];
          if (imgProp) {
            params.$orderBy = imgProp;
            params.$asc = 0;
          }
        }
*/
        Events.trigger('navigate', U.makeMobileUrl('chooser', rtype, params), {trigger: true});
        G.log(self.TAG, 'add', 'user wants to add to backlink');
//        var params = {
//          '$backLink': prop.backLink,
//          '-makeId': G.nextId(),
//          '$title': t.$data('title')
//        };
//
//        params[prop.backLink] = self.resource.getUri();
//
//        self.router.navigate('make/{0}?{1}'.format(encodeURIComponent(prop.range), _.param(params)), {trigger: true});
//        G.log(self.TAG, 'add', 'user wants to add to backlink');
      });
    },

    isActionButton: function(prop) {
      var dn = U.getPropDisplayName(prop);
      return ~['IF', 'THEN'].indexOf(dn.toUpperCase()) && {
        editable: U.isPropEditable(this.resource, prop)
      };
    },

    renderInlineList: function(name, frag, displayedProps) {
      this._renderInlineList(name, frag, displayedProps);
      if (name == 'indicators') {
        var add = this.inlineAddTemplate({
          backlink: name,
          hint: '"IF" RULES ARE BUILT WITH INDICATORS',
          action : '+ADD INDICATORS'
        });

        U.addToFrag(frag, add);
      }
      // else if (name == 'orders') {
      // }
    },

    _renderInlineList: function(name, frag, displayedProps) {
      var list = this.resource.getInlineList(name),
          vocModel = this.vocModel,
          meta = this.vocModel.properties,
          resources = list.models,
          listVocModel = list.vocModel,
          listMeta = listVocModel.properties,
          isCancelable = U.isA(listVocModel, 'Cancellable'),
          prop = meta[name],
          propDisplayName = U.getPropDisplayName(prop),
          canceledProp,
          isRule = U.isAssignableFrom(listVocModel, 'commerce/trading/Rule'),
          isNotification = U.isAssignableFrom(listVocModel, 'commerce/trading/Notification'),
          isIndicator = U.isAssignableFrom(listVocModel, 'commerce/trading/TradleIndicator'),
          order = U.contextual('Order'),
          isTrade = order  &&  U.isAssignableFrom(listVocModel, order),
          addTradeSection = isTrade && function() {
            var el = document.createElement('section');
            el.$data('backlink', name);
            // el.className = [SLIDER_CL, SLIDER_ACTIVE_CL].join(' ');
            frag.appendChild(el);
            frag = el;
          },
          canAdd = !isRule && !isTrade && U.canAddToBacklink(this.resource, prop), // don't allow add other than by clicking individual indicators
          linkToEdit = U.isAssignableFrom(listVocModel, G.commonTypes.WebProperty, 'commerce/trading/Notification'),
          action = linkToEdit ? 'edit' : 'view',
          template;

      if (isRule && !this.compareIndicatorsTemplate)
        this.makeTemplate('inlineCompareIndicatorsRuleTemplate', 'compareIndicatorsTemplate', listVocModel.type);

      template = isRule ? this.compareIndicatorsTemplate : this.inlineListItemTemplate;
      if (list.length && isCancelable) {
        canceledProp = listMeta[U.getCloneOf(listVocModel, 'Cancellable.cancelled')[0]];
        isCancelable = canceledProp && U.isPropEditable(list.models[0], canceledProp);
      }

      var indicatorsCount = getIndicatorsCount(this.resource);
      if (!list.length) {
        if ((isTrade && !this.resource.inlineLists[ORDERS].length)  ||  (isRule  && !this.resource.inlineLists['tradleRules'].length)) {
          var v = propDisplayName;
          if (isRule) {
            if  (indicatorsCount) {
              v += getIndicatorsCountBlock(indicatorsCount);
            }
          }
          U.addToFrag(frag, this.propGroupsDividerTemplate({
            value: v,
            add: canAdd,
            shortName: getBacklinkSub(vocModel, name),
            style: prop.propertyStyle,
            indicatorsCount: isRule ? indicatorsCount : 0,
            actionBtn: this.isActionButton(prop)
          }));

          if (isTrade) {
            addTradeSection();
          }

          return;
        }
//        return;
      }

      var gr = '', isBB = G.isBB(), isTopcoat = G.isTopcoat(), prop = meta[name], isBootstrap = G.isBootstrap();

      var displayCollapsed = prop.displayCollapsed;
      if (isIndicator) {
        var rulesList = this.resource.getInlineList('tradleRules');
        displayCollapsed = rulesList && rulesList.length;
      }

      if (!isIndicator && (list.length || canAdd)) {
        if (displayCollapsed  &&  list.length) {
          if (isBB)
            gr = '<section data-shortname="' + name + '" data-display="collapsed" style="cursor:pointer;">';
          else if (isTopcoat)
            gr = '<li data-shortname="' + name + '" data-display="collapsed topcoat-list__item" ' +  (G.coverImage ? 'style="text-shadow:none;background:' + G.coverImage.color + ';color: ' + G.coverImage.background + ';"' : '') + '><h3><i class="ui-icon-plus-sign"></i>&#160;' + prop.displayName + '</h3><ul class="topcoat-list__container">';
          else if (isBootstrap)
            gr = '<li data-shortname="' + name + '" data-display="collapsed"><h3 style="font-size:18px;"><i class="ui-icon-plus-sign"></i>&#160;' + prop.displayName + '</h3><ul class="list-group-container">';

          var style = prop.propertyStyle;
          if (name == 'indicators')
            style = (style || '') + ';display:none;';
          gr += this.propGroupsDividerTemplate({
            value: propDisplayName,
            add: canAdd,
            shortName: getBacklinkSub(vocModel, name),
            style: style,
            actionBtn: this.isActionButton(prop),
            displayCollapsed: displayCollapsed
          });
          if (isBB)
            gr += '<ul>';

        }
        else {
          var v = propDisplayName;
          if  (isRule  &&  indicatorsCount) {
            v += getIndicatorsCountBlock(indicatorsCount);
          }
          U.addToFrag(frag, this.propGroupsDividerTemplate({
            value: v,
            add: canAdd,
            indicatorsCount: isRule ? indicatorsCount : 0,
            shortName: getBacklinkSub(vocModel, name),
            actionBtn: this.isActionButton(prop),
            style: prop.propertyStyle
          }));
        }
      }

      if (!list.length && !isTrade)
        return;

      if (isTrade) {
        addTradeSection();
      }

//      if (!list.length) {
//        if (isRule  ||  isTrade)
//          U.addToFrag(frag, this.propGroupsDividerTemplate({
//            value: propDisplayName,
//            add: canAdd,
//            shortName: getBacklinkSub(vocModel, name),
//            style: prop.propertyStyle
//          }));
//        return;
//      }

      var hasImages;
      for (var i = 0, l = resources.length; i < l; i++) {
        var iRes = resources[i];
        if (!iRes.getUri())
          continue;

        var params = {
              viewId: this.cid,
              comment: iRes.comment,
              _problematic: iRes.get('_error'),
              name: U.getDisplayName(iRes),
              backlink: name,
              isIndicator: isIndicator
            },
            grid = U.getCols(iRes, 'grid', true);

//        if (isRule) {
////          var uri = iRes.getUri(),
////              type = U.getTypeUri(uri);
////
////          if (/ThanIndicator/.test(type)) {
////            if (!this.compareIndicatorsTemplate)
////              this.makeTemplate('inlineCompareIndicatorsRuleTemplate', 'compareIndicatorsTemplate', listVocModel.type);
//
//            template = this.compareIndicatorsTemplate;
////          }
//        }
        if (isTrade) {
//          var title = iRes.get('title');
//          if (title) {
//            var idx = title.indexOf(":");
//            iRes.attributes.davDisplayName = idx == -1 ? title : title.substring(idx + 2);
//          }
//          else {
          if (G.currentApp.appPath == 'Tradle')
            iRes.attributes.davDisplayName = iRes.get('action') + " " + iRes.get('quantity') + " " + iRes.get('security.displayName');
          else if (G.currentApp.appPath == 'Restaurant')
            iRes.attributes.davDisplayName = iRes.get('title');
//          }
          params.name = iRes.attributes.davDisplayName;
        }
        else if (U.isA(listVocModel, 'Intersection')) {
          var oH, oW, ab;
          var a = U.getCloneOf(listVocModel, 'Intersection.a')[0];
          var b = U.getCloneOf(listVocModel, 'Intersection.b')[0];
          if (a == meta[name].backLink) {
            var n = iRes.get(b + '.displayName');
            if (n)
              params.name = n;
            params.img = iRes.get('bThumb');
            params.imageProperty = 'bThumb';
            oW = 'bOriginalWidth';
            oH = 'bOriginalHeight';
            ab = b;
          }
          else {
            var n = iRes.get(a + '.displayName');
            if (n)
              params.name = n;
            params.img = iRes.get('aThumb');
            params.imageProperty = 'aThumb';
            oW = 'aOriginalWidth';
            oH = 'aOriginalHeight';
            ab = a;
          }
          if (grid) {
            var gridCols = '';
            var aLabel = listMeta[a].displayName;
            var bLabel = listMeta[b].displayName;
            for (var row in grid) {
              if (row != aLabel  &&  row != bLabel)
                gridCols += grid[row].value;
            }
            if (gridCols)
              params.gridCols = gridCols;
          }
          var w = iRes.get(oW),
              h = iRes.get(oH);
          if (w  &&  h) {
            var range = listMeta[ab].range;
            var rm = U.getModel(U.getLongUri1(range));
            if (U.isA(rm, 'ImageResource')) {
              var rmeta = rm.properties;
              var imgP = imageP  &&  imageP.indexOf('Featured') == -1 ? U.getCloneOf(rm, 'ImageResource.smallImage') : U.getCloneOf(rm, 'ImageResource.mediumImage');
              maxDim = imgP  &&  rmeta[imgP].maxImageDimension;
              var clip = U.clipToFrame(80, 80, w, h, maxDim);
              if (clip) {
                params.top = clip.clip_top;
                params.right = clip.clip_right;
                params.bottom = clip.clip_bottom;
                params.left = clip.clip_left;
                params.height = json.top + json.bottom;
              }
              else {
                var dim = U.fitToFrame(80, 80, w / h);
                params.width = dim.w;
                params.height = dim.h;
                params.top = dim.y; //w > h ? dim.y : dim.y + (atts[oH] - atts[oW]) / 2;
                params.right = dim.w - dim.x;
                params.bottom = dim.h - dim.y; ////w > h ? dim.h - dim.y : dim.h - dim.y + (atts[oH] - atts[oW]) / 2;
                params.left = dim.x;
              }
            }
          }

        }
        else {
          if (grid) {
            var gridCols = '';
            for (var row in grid) {
              gridCols += grid[row].value;
            }

            // make self-referential indicators: color: rgba(40, 146, 198, 0.65);
            params.gridCols = gridCols;
          }
          if (U.isA(listVocModel, 'ImageResource')) {
            var imgProp = U.getImageProperty(iRes, true);
            if (imgProp) {
              var img = iRes.get(imgProp);
              if (img) {
                params.imageProperty = imgProp;
                params.img = img;
                var oW = U.getCloneOf(listVocModel, 'ImageResource.originalWidth');
                var oH;
                if (oW)
                  oH = U.getCloneOf(listVocModel, 'ImageResource.originalHeight');

                if (oW  &&  oH  &&  (typeof iRes.get(oW) != 'undefined' &&  typeof  iRes.get(oH) != 'undefined')) {

//                  this.$el.addClass("image_fitted");
//
                  var dim = U.fitToFrame(80, 80, iRes.get(oW) / iRes.get(oH));
                  params.width = dim.w;
                  params.height = dim.h;
                  params.top = oW > oH ? dim.y : dim.y + (iRes.get(oH) - iRes.get(oW)) / 2;
                  params.right = dim.w - dim.x;
                  params.bottom = oW > oH ? dim.h - dim.y : dim.h - dim.y + (iRes.get(oH) - iRes.get(oW)) / 2;
                  params.left = dim.x;
                }
              }
            }
          }
        }

        if (isCancelable) {
          params.Cancelable = {
            canceled: iRes.get(canceledProp.shortName)
          }
        }

        if (isRule) {
          params.href = '#';
          params.noclick = true;
        }
        else
          params.href = U.makePageUrl(action, iRes.getUri(), { $title: params.name });

        params.isLast = (i == l - 1);
//        // HACK for today
//        else {
//          if (isNotification  &&  iRes.get('davDisplayName') == "null")
//            iRes.attributes.davDisplayName = 'Please choose how you want to be notified';
//
//          params.href = U.makePageUrl(action, iRes.getUri(), { $title: params.name });
//        }
        params.resource = iRes;
        if (params.img)
          hasImages = true;
        else if (hasImages)
          params.needsAlignment = true;
        params.isTrade = isTrade;
        params.isIndicator = isIndicator;
        if (displayCollapsed)
          gr += template.call(this, params);
        else
        U.addToFrag(frag, template.call(this, params));
        displayedProps[name] = true;
        this.stopListening(iRes, 'change', this.update);
        this.listenTo(iRes, 'change', this.update);
      }
      if (displayCollapsed) {
        if (isBB)
          gr += "</ul></section>";
        else
          gr += "</ul></li>";
        U.addToFrag(frag, gr);
      }
    },

//    addInlineList: function(list) {
//      this.inlined = this.inlined || [];
//      if (~this.inlined.indexOf(list))
//        return;
//
//      var self = this;
//      _.each(['updated', 'added', 'reset', 'removed'], function(event) {
//        self.stopListening(list, event);
//        self.listenTo(list, event, function(resources) {
//          resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//          var options = {
//            force: true
//          };
//
//          options[event] = true;
//          self.refresh(resources, options);
//        });
//      });
//    },

    toggleInlineScroller: function(e) {
      var pName = e.selectorTarget.$data('propname');
      var li = e.selectorTarget,
          pName = li.$data('propname'),
          info = this._backlinkInfo[pName];

      if (info && info.scroller)
        this.removeInlineScroller(e);
      else
        this.insertInlineScroller(e);
    },

    removeInlineScroller: function(e) {
      e.gesture.preventDefault();
      e.gesture.stopPropagation();
      e.gesture.stopDetect();
      e.stopPropagation();

      var self = this,
          li = e.selectorTarget,
          pName = li.$data('propname'),
          info = this._backlinkInfo[pName];

      if (info.scroller) {
        info.scroller.mason.destroy(true, function() {
          info.scroller.mason = null;
          info.scroller.destroy(true); // don't remove element
          li.$empty();
          for (var i = 0; i < info.originalContent.length; i++) {
            li.appendChild(info.originalContent[i]);
          }

          self.removeChild(info.scroller);
          info.scroller = null;
          info.originalContent = null;
        });
      }
    },

    insertInlineScroller: function(e) {
      e.gesture.preventDefault();
      e.gesture.stopPropagation();
      e.gesture.stopDetect();
      e.stopPropagation();
      var li = e.selectorTarget,
          pName = li.$data('propname'),
          info = this._backlinkInfo[pName];

      if (!info || !info.scroller) {
        // TODO - check count, if 0, don't bother or throw up an error message
        if (!info)
          this._backlinkInfo[pName] = {};

        this._insertInlineScroller(li, pName);
      }
    },

    _insertInlineScroller: function(li, pName) {
      var self = this,
          prop = this.vocModel.properties[pName],
          modelPromise = Voc.getModels(prop.range),
          viewPromise = U.require('views/HorizontalListView'),
          listDfd = $.Deferred(),
          params = {},
          list,
          info = this._backlinkInfo[pName];

      function fail() {
        // TODO: tell user
      };

      params[prop.backLink] = this.resource.getUri();

      modelPromise.done(function(blModel) {
        if (!U.isA(blModel, 'ImageResource'))
          return fail();

        list = new ResourceList(null, {
          model: blModel,
          params: params
        });

        list.fetch({
          success: listDfd.resolve,
          error: listDfd.reject
        });
      }).fail(fail);

      $.when(viewPromise, listDfd.promise()).done(function(HorizontalListView) {
        if (!list.length)
          return fail();

        var headerId = pName + '-gal-header',
            galleryId = pName + '-gal';

        info.originalContent = li.childNodes.$slice();
        li.innerHTML = _.template("<div id=\"{{= headerId }}\" style=\"top: -3px;\" data-role=\"footer\" data-theme=\"{{= G.theme.photogrid }}\" class=\"thumb-gal-header\"><h3>{{= title }}</h3></div>" +
        		                      "<div id=\"{{= galleryId }}\" data-inset=\"true\" data-filter=\"false\" class=\"thumb-gal\"></div>")({
          G: G,
          headerId: headerId,
          galleryId: galleryId,
          title: U.getPropDisplayName(prop)
        });


        info.scroller = new HorizontalListView({
          el: li.$('#' + galleryId)[0],
          model: list,
          parentView: self
        });

        info.scroller.render();
        self.addChild(info.scroller);
      }).fail(fail);
    },

    refresh: function(res, options) {
      options = options || {};
      if (options.partOfUpdate || options.skipRefresh)
        return;

      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.getUri()))
          return this;
      }

      this.render();
//      this._queueTask(this._refreshListview, this);
    },

//    _refreshListview: function() {
//      if (!this.$el.hasClass('ui-listview'))
//        this.$el.trigger('create');
//      else {
//        this.$el.trigger('create');
//        this.$el.listview('refresh');
//      }
//    },

    render: function(options) {
      var invisible = false;
      if (!this.resource.isLoaded()) {
        this.toggleVisibility(true);
        invisible = true;
      }

      var self = this;
      return this.getFetchPromise().done(function() {
        self.renderHelper(options);
        if (invisible)
          self.toggleVisibility();
      });
    },

    renderFT: _.debounce(function() {
      if (!this.isMainGroup  &&  
          G.currentApp.appPath == 'Tradle' &&
          this.resource.getInlineList('tradleRules')  &&  
          this.resource.getInlineList('tradleRules').length) {
        this.fetchFTArticles().done(this.doRenderFT);
      }
    }, 500),

    fetchFTArticles: function() {
      console.log("FETCHING FINANCIAL TIMES ARTICLES");
      return U.ajax({url: G.serverName + "/ftTradle?uri=" + encodeURIComponent(this.resource.getUri()), type: "GET"});
//      return U.resolvedPromise([{
//          "summary":{
//          "excerpt":"If, like me, you think that the future for adventurous investors is to give up on share tips and star fund managers and"
//       },
//       "id":"b0be19f8-fc79-11de-bc51-00144feab49a",
//       "title":{
//          "title":"David Stevenson: A hedge against inflation, and a play on energy"
//       },
//       "aspectSet":"article",
//       "editorial":{
//          "byline":"By David Stevenson"
//       },
//       "location":{
//          "uri":"http://www.ft.com/cms/s/2/b0be19f8-fc79-11de-bc51-00144feab49a.html"
//       },
//       "lifecycle":{
//          "initialPublishDateTime":"2010-01-08T17:18:17Z",
//          "lastPublishDateTime":"2010-01-08T17:18:17Z"
//       },
//       "apiUrl":"http://api.ft.com/content/items/v1/b0be19f8-fc79-11de-bc51-00144feab49a",
//           "modelVersion":"1"
//         }, {
//           "summary":{
//           "excerpt":"If, like me, you think that the future for adventurous investors is to give up on share tips and star fund managers and"
//        },
//        "id":"b0be19f8-fc79-11de-bc51-00144feab49a",
//        "title":{
//           "title":"David Stevenson: A hedge against inflation, and a play on energy"
//        },
//        "aspectSet":"article",
//        "editorial":{
//           "byline":"By David Stevenson"
//        },
//        "location":{
//           "uri":"http://www.ft.com/cms/s/2/b0be19f8-fc79-11de-bc51-00144feab49a.html"
//        },
//        "lifecycle":{
//           "initialPublishDateTime":"2010-01-08T17:18:17Z",
//           "lastPublishDateTime":"2010-01-08T17:18:17Z"
//        },
//        "apiUrl":"http://api.ft.com/content/items/v1/b0be19f8-fc79-11de-bc51-00144feab49a",
//        "modelVersion":"1"
//      }]);
    },

    doRenderFT: function(resultsO) {
      if (!resultsO)
        return;

      var results = resultsO['results'];
      if (!results || !results.length)
        return;

      if (!this.ftItemTemplate)
        this.makeTemplate('ftItemTemplate', 'ftItemTemplate');

      var frag = document.createDocumentFragment();

      U.addToFrag(frag, this.propGroupsDividerTemplate({
        value: 'Related Financial Times Articles',
        add: false,
        'class': 'ftItem'
      }));

      for (var i = 0; i < results.length; i++) {
        U.addToFrag(frag, this.ftItemTemplate(results[i]));
      }

      this.el.$('.ftItem').$remove();
      this.el.appendChild(frag);
      this.getPageView().invalidateSize();
    },

    renderHelper: function(options) {
      var self = this;
      var res = this.resource;
      var vocModel = this.vocModel;
      var type = res.type;
      var meta = vocModel.properties;
      if (!meta)
        return this;

      var indicatorsBlock = this.getIndicatorsBlock()[0];
      var tradesBlock = this.getTradesBlock()[0];
      var showIndicators = indicatorsBlock && indicatorsBlock.$hasClass(SLIDER_ACTIVE_CL);
      // var showTrades = tradesBlock && tradesBlock.$hasClass(SLIDER_ACTIVE_CL);

      var json = this.getBaseTemplateData(); //res.toJSON();
      var atts = res.attributes;
      var frag = document.createDocumentFragment();

      var mainGroup = U.getArrayOfPropertiesWith(meta, "mainGroup");
      if (this.isMainGroup  &&  !mainGroup.length)
        return;

      var isHorizontal;
      var isTradle = U.isAssignableFrom(this.vocModel, 'Tradle');
      if (this.isMainGroup && !this.dontStyle) {
        if ((!U.isA(this.vocModel, 'ImageResource')  &&  !U.isA(this.vocModel, 'Intersection')) ||  isTradle) {
          if (!isTradle) {
            this.el.$css("float", "left");
            this.el.$css("width", "100%");
          }
          isHorizontal = true;
        }
        else {
          this.el.$css("float", "right");
          this.el.$css("max-width", "220px");
          this.el.$css("min-width", "130px");
        }
      }
      var isChat = window.location.hash.indexOf('#chat') == 0;
      var mainGroupArr = mainGroup &&  mainGroup.length ? mainGroup[0]['propertyGroupList'].splitAndTrim(',') : null;
      var propGroups = this.isMainGroup &&  mainGroup ?  mainGroup : U.getArrayOfPropertiesWith(meta, "propertyGroupList");

      propGroups.sort(function(a, b) {
        return a.index - b.index;
      });

      var backlinks = U.getBacklinks(meta);
//      var displayInline = !this.isMainGroup && U.getPropertiesWith(this.vocModel.properties, [{name: "displayInline", value: true}, {name: "backLink"}]);
//      if (displayInline && _.size(displayInline)) {
////        this.stopListening(res, 'inlineList', this.update);
////        this.listenTo(res, 'inlineList', this.update);
//        if (_.size(res.inlineLists)) {
//          // either all the lists will be on the resource (if it's being loaded from the server), in which case we either paint them in this render call or wait for the 'inlineList' event...
//        }
//        else {
//          // ...or we have to fetch them separately, and once again, wait for the 'inlineList' event
//          var self = this;
//          var ranges = [];
//          var inlineLists = {};
//          _.each(displayInline, function(prop, name) {
//            _.pushUniq(ranges, U.getTypeUri(prop.range));
//          });
//
//          Voc.getModels(ranges).done(function() {
//            _.each(displayInline, function(prop, name) {
//              var params = U.getListParams(res, prop);
//              var type = U.getTypeUri(prop.range);
//              var listModel = U.getModel(type);
//              var inlineList = C.getResourceList(listModel, U.getQueryString(params, true));
////              var firstTime = true;
//              if (inlineList) {
//                self.addInlineList(inlineList);
//                return;
//              }
//
//              function onsuccess() {
////                if (firstTime) {
////                  firstTime = false;
////                }
//
//                if (!inlineList.isFetching() && !inlineList.isOutOfResources()) // get them all!
//                  inlineList.getNextPage(fetchOptions);
//                else
//                  self.refresh();
//              };
//
//              var fetchOptions = {
//                  success: onsuccess,
//                  error: function() {
//                    debugger;
//                  }
//                },
//                currentlyInlined = res.inlineLists || {};
//
//              inlineList = new ResourceList(null, {model: listModel, params: params});
//              if (!res._settingInlineList && !currentlyInlined[name])
//                res.setInlineList(name, inlineList);
//
//              self.addInlineList(inlineList);
//              inlineList.fetch(fetchOptions);
//
//              self.listenTo(Events, 'preparingModelForDestruction.' + inlineList.cid, function() {
//                Events.trigger('saveModelFromUntimelyDeath.' + inlineList.cid);
//              });
//            });
//          });
//        }
//      }

      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;

      var role = U.getUserRole();
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var first;

      var currentAppProps = U.getCurrentAppProps(meta);
      var title = U.getDisplayName(res);
      var color = ['rgba(156, 156, 255, 0.7)', 'rgba(255, 0, 255, 0.7)', 'rgba(32, 173, 176, 0.7)', 'rgba(255, 255, 0, 0.7)', 'rgba(255, 156, 156, 0.7)', 'purple'];
      var borderColor = ['rgba(156, 156, 255, 1)', 'rgba(255, 0, 255, 1)','rgba(32, 173, 176, 1)', 'rgba(255, 255, 0, 1)', 'rgba(255, 156, 156, 1)', 'purple'];
      var color1 = ['yellow', 'rgba(156, 156, 255, 0.8)', '#9999ff', 'magenta', 'lightseagreen', '#ff9999', 'purple'];
      var colorIdx = 0;
//      if (title)
//        title = ' for ' + title;

      _.each(propGroups, function(gProp) {
        var list = _.map(gProp.propertyGroupList.split(','), function(p) {return p.trim()});
        _.each(list, function(p) {
          var prop = meta[p];
          if (prop && prop.mainGroup)
            delete displayInline[p];
        }.bind(this));
      });

      if (!this.isMainGroup && !_.isEmpty(res.getInlineLists())) {
        var list = [],
            inline = res.getInlineLists();

        for (var name in inline) {
          list.push(this.vocModel.properties[name]);
        }

        var props = _.sortBy(list, function(prop) {
          return prop.dataProviderPropertyIndex;
        });

        var indicators;
        for (var i=0; i<props.length; i++) {
          var name = props[i].shortName;
          if (name == 'indicators')
            indicators = name;
          else {
            if (~name.toLowerCase().indexOf('orders') && name != ORDERS)
              continue;
            
            this.renderInlineList(name, frag, displayedProps);
          }
        }

        if (indicators) {
          var header = frag.$('header[data-shortname="tradleRules"]')[0];
          if (header) {
            var el = document.createElement('section');
            el.$data('backlink', indicators);
            el.className = 'slider';
            this.renderInlineList(indicators, el, {});
            el.$after(header);
          }
        }
      }
      var vCols = this.hashParams.$viewCols ? this.hashParams.$viewCols.split(',') : null;

      if (propGroups.length) {
//        var tmpl_data = {};
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          if (!this.isMainGroup  &&  grMeta.mainGroup)
            continue;
          var avoidDisplaying = grMeta.avoidDisplayingInView;

          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p))
              continue;
            if (vCols  &&  vCols.indexOf(p) == -1)
              continue;


            var prop = meta[p];
            if (!prop || prop.displayInline || displayedProps[p] || !_.has(backlinks, p))
              continue;
            if (prop['app']  &&  (!currentAppProps  || currentAppProps.indexOf(p) == -1))
              continue;
            if (!prop  ||  prop.mainBackLink  ||  (!_.has(atts, p)  &&  typeof prop.readOnly != 'undefined'))
              continue;
            if (!U.isPropVisible(res, prop))
              continue;

            displayedProps[p] = true;
            if (avoidDisplaying)
              continue;

            var n = U.getPropDisplayName(prop);
            var range = prop.range;
            var isPropEditable = U.isPropEditable(res, prop, role);

            var doShow = false;
            var cnt;
            var pValue = this.resource.get(p); //json[p];
            if (!_.has(atts, p)) {
              var count = pValue ? pValue.count : 0;
              cnt = count > 0 ? count : 0;

              if (cnt != 0 || isPropEditable)
                doShow = true;
//              U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
            }
            else {
              var v = pValue.value;
              cnt = pValue.count;
              if (typeof cnt == 'undefined'  ||  !cnt)
                cnt = 0;
              if (cnt != 0 ||  isPropEditable)
                doShow = true;
//                U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
//              else
            }

            if (!doShow)
              continue;

            if (cnt == 1  && prop.displayInline  &&  prop.maxCardinality  == cnt) {
              colorIdx++;
              continue;
            }
            if (!this.isMainGroup  &&  !groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName, style: grMeta.propertyStyle}));
              groupNameDisplayed = true;
            }

//              var uri = U.getShortUri(res.getUri(), vocModel);
            var uri = res.getUri();
            var t = U.makeHeaderTitle(title, n);
            if (colorIdx == color.length)
              colorIdx = 0;
            var icon;
            if (prop.displayInline) {
              cnt = 0;
              icon = "ui-icon-plus-sign";
            }
            else
              icon = prop['icon'];
            var tmpl_data = {};

            tmpl_data.prop = prop;
            tmpl_data.icon = null;
            tmpl_data.range = range;
            tmpl_data.backlink = prop.backLink;
            tmpl_data.shortName = p;
            tmpl_data.name = n;
            tmpl_data.value = cnt;
            tmpl_data._uri = uri;
            tmpl_data.title = t;
            tmpl_data.comment = prop.comment;
            tmpl_data.borderColor = isTradle ? "#000" : borderColor[colorIdx];
            tmpl_data.color = isTradle ? "rgba(64, 64, 64, 0.7);" : color[colorIdx];
            tmpl_data.chat = isChat;
            
            if (prop.propertyStyle)
              tmpl_data.style = prop.propertyStyle;
            var bl = prop.backLinkSortDescending;
            if (bl) {
              tmpl_data['$orderBy'] = bl;
              tmpl_data['$asc'] = 0;
            }
            if (isTradle)
              tmpl_data['isTradle'] = true;
//              var common = {range: range, backlink: prop.backLink, shortName: p, name: n, value: cnt, _uri: uri, title: t, comment: prop.comment, borderColor: borderColor[colorIdx], color: color[colorIdx], chat: isChat};
            colorIdx++;
            if (this.isMainGroup) {
//                if (!icon)
//                  icon = 'ui-icon-star-empty';
              tmpl_data.icon = icon;
              if (isHorizontal)
                U.addToFrag(frag, this.cpMainGroupTemplateH(tmpl_data));
              else
                U.addToFrag(frag, this.cpMainGroupTemplate(tmpl_data));
            }
            else {
              if (isPropEditable) {
                if (U.isCloneOf(prop, 'Templatable.clones', this.vocModel)) {
                  if (U.isCloneOf(prop, 'Templatable.clones', this.vocModel)) {
                    if  (cnt > 0)
                      U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));
                  }
                  U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));
                }
                else
                  U.addToFrag(frag, this.cpTemplate(tmpl_data));
              }
              else
                U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));
            }
//              if (isPropEditable)
//                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
//              else
//                U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
          }
        }
      }
      if (!this.isMainGroup) {
        groupNameDisplayed = false;
//        var tmpl_data = {};
        var cnt = 0;
        var isSCM = G.currentApp.appPath == 'SCM';
        for (var p in meta) {
          cnt++;
          if (!/^[a-zA-Z]/.test(p))
            continue;
          if (vCols  &&  vCols.indexOf(p) == -1)
            continue;

          var prop = meta[p];
          if (prop.displayInline || _.has(displayedProps, p) || !_.has(backlinks, p))
            continue;

          if (prop['app']  &&  (!currentAppProps  || currentAppProps.indexOf(p) == -1))
            continue;

          if (mainGroupArr  &&  ~mainGroupArr.indexOf(p))
            continue;

          var count = -1;
          if (_.has(atts, p + 'Count')) {
            count = atts[p + 'Count'];
            json[p] = {count: count};
          }

//          if (!_.has(backlinks, p)) {
//            var idx;
//            if (p.length <= 5  ||  p.indexOf('Count') != p.length - 5)
//              continue;
//
//            var pp = p.substring(0, p.length - 5);
//            if (_.has(displayedProps, pp))
//              continue;
//
//            var pMeta = meta[pp];
//            if (!pMeta  ||  !pMeta.backLink || atts[pp])
//              continue;
//            count = atts[p];
////            p = pp;
//            prop = pMeta;
//            json[pp] = {count: count};
//            p = pp;
//          }

          hasValue = _.has(atts, p);
          if (count == -1) {
            if (!prop)
              continue;
            if (!_.has(atts, p)) {
              if (typeof prop.readOnly != 'undefined') {
    //            delete json[p];
                continue;
              }
            }
            else {
              if (atts[p].count)
                count = atts[p].count;
              else if (!isSCM  &&  prop.range.indexOf('/voc/dev/') == -1)
                continue;
            }
          }

          if (!U.isPropVisible(res, prop))
            continue;

          var isPropEditable = U.isPropEditable(res, prop, role);
          var doShow = false;
          var n = U.getPropDisplayName(prop);
          var cnt;
          var pValue = atts[p];
          if (!hasValue) {
            cnt = count > 0 ? count : 0;
            if (cnt != 0 || isPropEditable)
              doShow = true;
          }
          else {
            var v = pValue.value;
            cnt = pValue.count;
            if (typeof cnt == 'undefined'  ||  !cnt)
              cnt = 0;
            if (isPropEditable  ||  cnt != 0)
              doShow = true;
          }
          if (doShow) {
            displayedProps[p] = true;
  //          if (isPropEditable)
  //            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          else
  //            U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: res.getUri()}));
  //          var range = U.getClassName(prop.range);
            var range = prop.range;
  //          var uri = U.getShortUri(res.getUri(), vocModel);
            var uri = res.getUri();
            var t = title + "&nbsp;&nbsp;<span class='ui-icon-caret-right'></span>&nbsp;&nbsp;" + n;

            var tmpl_data = {};

            tmpl_data.prop = prop;
            tmpl_data.range = range;
            tmpl_data.shortName = p;
            tmpl_data.backlink = prop.backLink;
            tmpl_data.value = cnt;
            tmpl_data._uri = uri;
            tmpl_data.title = t;
            tmpl_data.comment = prop.comment;
            tmpl_data.name = n;
            tmpl_data.prop = prop;
            if (prop.propertyStyle)
              tmpl_data.style = prop.propertyStyle;

            var bld = prop.backLinkSortDescending,
                bla = prop.backLinkSortAscending,
                bl = bla || bld;

            if (bl) {
              tmpl_data['$orderBy'] = bl;
              tmpl_data['$asc'] = !!bla;
            }
//            var common = {range: range, shortName: p, backlink: prop.backLink, value: cnt, _uri: uri, title: t, comment: comment, name: n};
            if (isPropEditable) {
              if (U.isCloneOf(prop, 'Templatable.clones', this.vocModel)) {
                if  (cnt > 0)
                  U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));
              }
              else
                U.addToFrag(frag, this.cpTemplate(tmpl_data));
            }
            else
              U.addToFrag(frag, this.cpTemplateNoAdd(tmpl_data));
          }
        }
      }

//      if (this.hashParams.$tour) {
//        var s = this.$el.find(this.hashParams.$tourS + '=' + this.hashParams.$tourV);
//        s.css('class', 'hint--left');
//        s.css('class', 'hint--always');
//        s.css('data-hint', this.hashParams.$tourM);
//      }

//      var self = this;
//      var problems = $('.problematic');
//      problems.each(function() {
//        $(this).css('color', '#f66');
//        if (!this.innerHTML.startsWith('<i'))
//          this.innerHTML = '<i class="ui-icon-ban-circle"></i> ' + this.innerHTML;
//      });

//      if (G.isJQM()) {
//        this.$el.trigger('create');
////        if (this.el.$hasClass('ui-listview'))  //this.rendered &&
////          this.$el.listview('refresh');
//      }

      Q.write(function() {
        this.el.$html(frag);
        if (!this.isMainGroup) {
          this.$('li[data-backlink]').$forEach(this.paintOverlay);
//          var bls = this.$('li[data-backlink]');
//          bls.$forEach(this.paintOverlay);
//          bls.$forEach(this.showOverlay);
//          setTimeout(this.hideOverlays, 1000);
        }

        if (isTradle)
          this.renderFT();

        if (this.rendered) {
          this.restoreCollapsables();
          if (showIndicators)
            this.showIndicators();

          // if (showTrades)
          //   this.showTrades();
        }
//        this.addToWorld(null, false);
//        this.addToWorld({
//          slidingWindow: true
//        }, false);
        this.finish();
//        Q.read(function() {
//          var self = this,
//              id;
//
//          this.propBricks = this.$('[data-propname],header').$map(function(el) {
//            id = el.$data('propname') || el.innerText;
//            Physics.here.addBody(el, id);
//            return self.buildBrick({
//              _id: id,
//              el: el
//            });
//          });
//
//          this.addBricksToWorld(this.propBricks);
//        }, this);
      }, this);

      return this;
    }
  }, {
    displayName: 'ControlPanel'
  });
});
