//'use strict';
define('views/Header', [
  'globals',
  'events',
  'utils',
  'vocManager',
  'views/BasicView',
  'physicsBridge',
  'domUtils',
  'lib/fastdom'
], function(G, Events, U, Voc, BasicView, Physics, DOM, Q) {
  var TOUCHEND = G.browser.touch ? 'touchend' : 'click';
  var SPECIAL_BUTTONS = ['enterTournament', 'forkMe', 'publish', 'doTry', 'testPlug', 'resetTemplate', 'installApp'];
  var REGULAR_BUTTONS = ['back', 'cancel', 'save', 'mapIt', 'add', 'video', 'chat', 'login', 'rightMenu', 'help'];
  var commonTypes = G.commonTypes;
  var friendlyTypes = [G.commonTypes.Urbien, 'http://urbien.com/voc/dev/ImpressBackup/Movie', 'http://urbien.com/voc/dev/ImpressBackup/Artist', 'model/social/App'];
  var searchModeTypes = ['commerce/trading/Feed', 'commerce/trading/Event'].map(U.getTypeUri);
  var editablePhysicsConstants = ['drag', 'springStiffness', 'springDamping', 'tilt'];
  var NO_PROP = '_NO_PROP_';
  var ModalDialog;
  var CLOSED_QUICKSTART = [];
  var showFilter = (function() {
//    return U.isUserInRole(U.getUserRole(), 'siteOwner');
    return false;
  })();

  return BasicView.extend({
//    viewType: 'any',
    style: {
      opacity: 1//, //DOM.maxOpacity
//      zIndex: 10001
    },
    _draggable: false,
    _showSearchOnLoad: true,
    autoFinish: false,
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', /*'makeWidget', 'makeWidgets',*/ 'fileUpload', 'refresh', 'onFilter', 'updateQuickstart'); //, '_updateInfoErrorBar', 'checkErrorList', 'sendToCall');
      BasicView.prototype.initialize.apply(this, arguments);
      options = options || {};
      _.extend(this, options);
      this.viewId = options.viewId;
      this.locationHref = window.location.hash;
      if (this.resource) {
        function update(res, options) {
//          G.log(this.TAG, 'events', 'change event received for', U.getDisplayName(this.resource));
          if (options && options.skipRefresh)
            return;

          this.refresh();
        }

        this.resource.on('change', update, this);
        this.resource.on('inlineList', update, this);
      }

      var self = this;
      var vocModel = this.vocModel;
      var type = vocModel && vocModel.type;

      this.makeTemplate(this.template, 'template', type);
      this.makeTemplate('headerButtonsTemplate', 'headerButtonsTemplate', type);
      this.on('destroyed', function() {
        self.buttonViews = {};
      });

      this._filter = {
        type: this.vocModel.type,
        params: {}
      };
      
      this.searchMeta = this.collection && U.filterObj(this.collection.params, U.isMetaParameter);
      if (this.hasFilter) {
        this.makeTemplate('searchTemplate', 'searchTemplate', type);
        this.makeTemplate('filterTemplate', 'filterTemplate', type);
        this.makeTemplate('filterConditionTemplate', 'filterConditionTemplate', type);
        this.makeTemplate('filterConditionInputTemplate', 'filterConditionInputTemplate', type);
      }

      this.makeTemplate('physicsConstantsTemplate', 'physicsConstantsTemplate', vocModel && vocModel.type);

      if (this.resource && /^view/.test(this.hash) && this.resource.isA('Activatable'))
        this.activatedProp = vocModel.properties[U.getCloneOf(vocModel, 'Activatable.activated')[0]];

//      if (this.collection) {
//        var self = this,
//            params = this.hashParams,
//            forRes = params.$forResource,
//            forResType = forRes && U.getTypeUri(forRes),
//            forResModel = forRes && U.getModel(forResType),
//            $params = params.$indicator || params.$params,
//            forTradle = $params ? _.toQueryParams($params).tradle : params.tradle,
//            name,
//            uri;
//
//        if (forTradle) {
//          this.folder = {
//            name: 'Tradle',
//            uri: forTradle
//          }
//        }
//        else if (forRes) {
//          this.folder = {
//            name: forResModel ? forResModel.displayName : forResType.slice(forResType.lastIndexOf('/') + 1).uncamelize(true),
//            uri: forRes
//          }
//
//          if (U.getTypeUri(forRes).endsWith('commerce/trading/TradleIndicator')) {
//            U.getResourcePromise(forRes).done(function(indicator) {
//              self.folder = {
//                name: 'Tradle',
//                uri: indicator.get('tradle')
//              }
//
//              self.refreshFolder();
//            });
//          }
//        }
//      }
//      else if (this.resource && U.isA(vocModel, 'FolderItem')) {
//        var pName = this.hashParams.$rootFolderProp || U.getCloneOf(vocModel, 'FolderItem.rootFolder')[0] || U.getCloneOf(vocModel, 'FolderItem.folder')[0];
//        if (pName) {
//          this.folder = {
//            shortName: pName,
//            name: U.getPropDisplayName(vocModel.properties[pName])
//          };
//        }
//      }

//      if (this.resource) {
//        this.listenTo(this.resource, 'change', this.updateQuickstart);
//        this.listenTo(this.resource, 'inlineList', this.updateQuickstart);
//      }

      return this;
    },

    getButtonTemplate: function(button) {
      var name = button + 'ButtonTemplate';
      if (!this[name])
        this.makeTemplate(name, name, this.vocModel.type);

      return this[name];
    },

//     getButtonViews: function() {
//       /*
//       if (this.hashParams['-embed']) {
//         this.btnsReq = G.getResolvedPromise();
//         return;
//       }
//       */

//       var res = this.resource;
//       var vocModel = this.vocModel;
//       var type = vocModel && vocModel.type;
//       this.calcSpecialButtons();
//       this.isGeo = this._isGeo();
// //      _.extend(this, options);
//       this.makeTemplate(this.template, 'template', type);
//       this.makeTemplate('fileUpload', 'fileUploadTemplate', type);
//       this.info = this.hashParams['-info'];

//       var buttons = this.buttons;
//       if (!this.hash.startsWith('chat') && res && _.any(_.values(_.pick(commonTypes, 'App', 'Handler', 'Jst')), function(type) { return U.isAssignableFrom(res.vocModel, type); }))
//         buttons.publish = true;
// //      else if (res  &&  U.isA(this.vocModel, 'Templatable')) {
// //        var cOf = U.getCloneOf(this.vocModel, 'Templatable.isTemplate');
// //        if (cOf.length  &&  res.get(cOf[0])) {
// //          var cOf = U.getCloneOf(this.vocModel, 'Templatable.clones');
// //          if (cOf.length)
// //            buttons.publish = true;
// //        }
// //      }
//       else if (vocModel && this.hash.startsWith('chooser')  &&  U.isAssignableFrom(this.vocModel, G.commonTypes.WebClass))
//         buttons.publish = true;

//       var btnOptions = {
//         model: this.model,
//         parentView: this,
//         viewId: this.viewId
//       };

//       var reqdButtons = [];
//       buttons = U.filterObj(buttons, function(key, val) {
//         return val;
//       });

//       for (var btn in buttons) {
//         btn = btn.camelize(true); // capitalize first letter
//         reqdButtons.push('views/{0}Button'.format(btn));
//       }

//       this.buttonViews = {};
//       var self = this;
//       this.btnsReq = U.require(reqdButtons, function() {
//         var i = 0;
//         for (var btn in buttons) {
//           var model = arguments[i++];
//           if (G.isBootstrap())
//             model = model.extend({tagName: 'div'}, {});

//           self.buttonViews[btn] = self.buttonViews[btn] || self.addChild(new model(btnOptions));
//         }
//       });

//       this.ready = $.when(this.btnsReq, this.getFetchPromise());
//     },

    recalcTitle: function() {
      this.pageTitle = null;
      this.calcTitle();
    },

    calcTitle: function() {
      if (this.pageTitle != null) {
        this._title = this.title = this.pageTitle;
        return this;
      }

      // only use hash the first time
      if (!this.hash)
        this.hash = window.location.hash;

      var hash = this.hash;
      var res = this.model;
      var title, titleHTML;
      if (hash && G.tabs) {
        var decHash = decodeURIComponent(hash);
        var matches = _.filter(G.tabs, function(t) {
          return t.hash == hash || decodeURIComponent(t.hash) == decHash
        });

        if (matches.length)
          title = matches[0].title;
      }

      if (!title) {
        if (hash) {
          title = this.hashParams.$title;
          title = title  &&  title.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/, ":").replace(/&#160;/, ":").replace(/&nbsp;/g, " ").replace(/&#160;/g, " ");
        }

        if (!title && res) {
          if (U.isCollection(res))
            title = U.getPlural(res);
          else {
            title = U.getDisplayName(res);
            if (this._hashInfo.route != 'make') {
              if (!U.isAssignableFrom(this.vocModel, "Contact"))
                this.pageTitle = res.isLoaded() ? this.vocModel['displayName'] + ": " + title : title;
            }
          }
        }
      }

      document.title = this._title = title;
      this.title = titleHTML || title;

      return this;
    },

    events: (function() {
      var events = {
        'change .activatable input'                  : 'activate',
        'change #fileUpload'                         : 'fileUpload',
        'change .physicsConstants input'             : 'changePhysics',
        'click .categories'                          : 'showCategories',
  //      'click #installApp'         : 'installApp',
        'click #moreRanges'                          : 'showMoreRanges',
        'click .filterCondition i.ui-icon-remove-sign, .filterCondition i.ui-icon-remove': 'removeFilterCondition',
        'click .filterCondition i.ui-icon-plus-sign, .filterCondition i.ui-icon-plus' : 'addFilterCondition',
        'change .propertySelector'                   : 'changeFilterConditionProperty',
        'click .filter'                              : 'focusFilter',
        'keyup .searchInput'                         : 'search',
        'keyup .filterConditionInput input'          : 'onFilter',
        'change .filterConditionInput select'        : 'onFilter',
        'change .filterConditionInput input'         : 'onFilter',
        'click .bookmark'                            : 'loadBookmark',
        'click .searchBar .ui-icon-cancel'           : 'toggleFilter',
        'click.header .quickstart .ui-icon-remove'   : 'hideQuickstart',
        'click i.help'                               : 'showQuickstart',
        'click .pageTitle'                           : 'onClickTitle'
  //      'click.header'                                 : 'checkHideQuickstart'
      };

      events[TOUCHEND + ' .filterToggle'] = 'toggleFilter'; // input focus trick for mobile browsers (call input.focus() on 'touchend')
      return events;
    })(),

//    modelEvents: {
//      'change': 'updateQuickstart',
//      'inlineList': 'updateQuickstart'
//    },

    activate: function(e, force) {
      e && Events.stopEvent(e);
      var self = this;
      U.require('views/ModalDialog').done(function(MD) {
        ModalDialog = MD;
        return self._activate(e, force);
      });
    },

    _activate: function(e, force) {
      var params = {},
          res = this.resource,
          pName = this.activatedProp.shortName,
          activating = !this.resource.get(pName);

      function deactivate() {
        e.selectorTarget.checked = false;
      };

      if (activating && U.isAssignableFrom(this.vocModel, "commerce/trading/Tradle")) {
        var msg;

        var defaultTitle = "New tradle";

//        if (G.currentUser.firstName)
//          defaultTitle += G.currentUser.firstName.substring(0, 1);
//        if (G.currentUser.lastName)
//          defaultTitle += G.currentUser.lastName.substring(0, 1);
//
//        defaultTitle += "'s Tradle";
        if (this.resource.get('title') == defaultTitle)
          msg = 'Please give your Tradle a title before you activate it';
//        else if (!this.resource.get('description'))
//          msg = 'Please give your Tradle a description';

        if (msg) {
          deactivate();
          Events.trigger('navigate', U.makeMobileUrl('edit', this.resource.getUri(), {
            '-info': msg,
            '$editCols': 'title,description'
          }));

          return;
        }
      }

      if (!force && activating && U.isAssignableFrom(this.vocModel, "commerce/trading/Tradle")) {
        var self = this,
            tradle = this.resource,
//            numNotifications = U.getBacklinkCount(tradle, 'notifications'),
            numOrders = U.getBacklinkCount(tradle, 'orders'),
            numRules = U.getBacklinkCount(tradle, 'tradleRules'),
            dateRulesChanged = tradle.get('dateRulesChanged') || 0,
            dateOrdersChanged = tradle.get('dateOrdersChanged') || 0,
            dateBacktested = tradle.get('dateBacktested') || 0,
            spinner,
            undoMsg;

        if (!numRules)
          undoMsg = "Your Tradle doesn't have any rules yet!";
        else if (!numOrders)// && !numNotifications) {
          undoMsg = "To do a dry run, add at least one trade to your Tradle";

        if (undoMsg) {
          U.alert(undoMsg);
          deactivate();
          return;
        }

        if (dateBacktested <= Math.max(dateRulesChanged, dateOrdersChanged)) {
          function hide() {
            ModalDialog.hide();
            if (spinner)
              G.hideSpinner(spinner);

            var perf = self.getPageView().$('.expectedPerformance')[0];
            if (perf) {
              self.getPageView().toggleCollapsedEl(perf);
              self.getPageView().scrollToElement(perf);
            }
          }

          U.modalDialog({
            id: 'backtestDialog',
            header: 'Dry run the Tradle first?',
//            title: 'Click <b>Activate</b> to activate your Tradle without a dry run',
            details: '<p style="width:100%; text-align:center; font-style:italic;">(A dry run tests how this Tradle <br /> would perform in the last 7 days)</p>',
            img: '/images/tradle/target-practice-orange.png',
//            bgImg: 'http://mark.urbien.com/urbien/images/tradle/target-practice-orange.png',
            ok: 'Do a dry run',         // pass true to get default string 'Ok', or false to not have a button
            cancel: 'Activate immediately',    // pass true to get default string 'Cancel', or false to not have a button
            onok: function onok() {
              spinner = {
                name: 'backtestTradle',
                timeout: 10000,
                blockClick: true
              };

              G.showSpinner(spinner);
              tradle.save({
                backtest: true
              }, {
                sync: true,
                success: hide,
                error: function() {
                  debugger;
                  hide();
                }
              });
            },
            oncancel: function oncancel() {
              ModalDialog.hide();
              self.activate(null, true); // force
            }
          });

          return;
        }
      }

      params[this.activatedProp.shortName] = activating;
      this.resource.save(params, {
        userEdit: true,
        redirect: false
      });
    },

    onClickTitle: function(e) {
      var el = e.selectorTarget;
      if (!DOM.isEllipsisActive(el))
        return;

      Events.stopEvent(e);
      U.alert(el.textContent);
    },

    changePhysics: function(e) {
      var val = parseInt(e.target.value),
          type = 'verticalMain';

      switch (e.target.name) {
      case 'degree':
        val *= -1;
        break;
      case 'tilt':
        val -= 1; // min at 0 instead of 1
        val /= 100;
        break;
        // fall through;
      default:
        val /= 100;
        break;
      }

//      if (this._hashInfo.route == 'view') {
//        type = 'horizontal';
//      }

      switch (this._hashInfo.route) {
        case 'view':
          var i = friendlyTypes.length;

          while (i--) {
            if (U.isAssignableFrom(this.vocModel, friendlyTypes[i])) {
              type = 'horizontal';
              break;
            }
          }

        break;
      }

      this.log('PHYSICS: ' + e.target.name + ' = ' + val);
      Physics.there.set(type, e.target.name, val);
    },

    fileUpload: function(e) {
      Events.stopEvent(e);
      debugger;
      $('#fileUpload').attr('action', G.serverName + '/mkresource');
//      var returnUri = $('[$returnUri]');
//      if (returnUri) {
//        var fn = $(':file').value;
//        var idx = fn.lastIndexOf('/');
//        returnUri.attr('value', returnUri + '&originalImage=' + encodeURIComponent(G.pageRoot + '/wf/' + params['$location']) + fn.slice(idx));
//      }
      document.forms["fileUpload"].submit();
      /*
      $.ajax({
        url     : G.serverName + '/mkresource',
        type    : 'POST',
        enctype: 'multipart/form-data',
        data    : $('#fileUpload').serialize(),
        success : function( data ) {
           alert('Submitted');
        },
        error   : function( xhr, err ) {
           alert('Error');
        }
      });
      */

    },

    showMoreRanges: function(e) {
      Events.stopEvent(e);
      if (this.hashParams['$more']) {
        delete this.hashParams['$more'];
        this.hashParams['$less'] = 'y';
      }
      else {
        delete this.hashParams['$less'];
        this.hashParams['$more'] = 'y';
      }

      Events.trigger('navigate', U.makeMobileUrl('chooser', this.vocModel.type, this.hashParams), {trigger: true, replace: true, forceFetch: true});
    },

    showCategories: function(e) {
      Events.stopEvent(e);
      var self = this;
      Voc.getModels("aspects/tags/Tag").done(function() {
//        var options = _.getParamMap(self.locationHref);
//        var uri = U.makeMobileUrl('list', U.getModel("Tag").type, _.extend({application: self.vocModel.type, $title: "Categories"}, options));
        var params = {};
        var meta = self.vocModel.properties;
        for (var p in self.hashParams) {
          var m = meta[p];
          if (!m)
            continue;
          params['tagUses.(' + self.vocModel.type + ')taggable.' + p] = self.hashParams[p];
        }
        params['application'] = self.vocModel.type;
        params.$title = 'Categories';
        var fragment = U.makeMobileUrl('list', U.getModel("Tag").type, params); //, $orderBy: "tagUsesCount", $asc: "-1"});
        Events.trigger('navigate', fragment, {trigger: true, replace: true, forceFetch: true});
      }).fail(function() {
        Events.trigger('navigate', U.makeMobileUrl('list', self.vocModel.type));
      });
    },

    toggleFilter: function(e) {
      Events.stopEvent(e);
      // this.filterContainer.$empty();
      this._filter = _.pick(this._filter, 'type');

      switch (this.filterType) {
      case null:
      case undefined:
        this.showSearch();
//        this.redelegateEvents();
        break;
      case 'simple':
        if (showFilter) {
          this.showFilter();
//          this.redelegateEvents();
          break;
        }
        else {
          // fall through, don't show complex filter
        }
      case 'complex':
        this.hideFilter();
        break;
      }
    },

    hideFilter: function() {
      this.filterType = null;
      this.doFilter();
      // this.titleContainer.classList.remove('hidden');
      this.el.$removeClass('search-active');
      // this.filterIcon.className = this.searchIconClass;
      // this.filterContainer.classList.add('hidden');
//      this.redelegateEvents();
    },

    doFilter: _.debounce(function() {
      // HACK
      this.pageView.doFilter(this._filter);
    }, 100),

    initFilter: function() {
      if (!this.filterContainer) {
        // this.filterIcon = this.filter.$('i')[0];
        // this.searchIconClass = this.filterIcon.className;
        this.filterContainer = this.$('.filter')[0];
      }
    },

    showSearch: function() {
      this.initFilter();
      //this.titleContainer.classList.add('hidden');
      // if (showFilter)
      //   this.filterIcon.className = 'ui-icon-beaker';
      // else
      //   this.filterIcon.className = 'ui-icon-remove';

      this.filterType = 'simple';
      this.el.$addClass('search-active');
      this.filterContainer.$html(this.searchTemplate(this.getBaseTemplateData()));
      // this.filterContainer.classList.remove('hidden');
      this.getSearchInput().focus();
//      this.redelegateEvents();
    },

    getSearchInput: function() {
      return this.filterContainer.$('.searchBar input')[0];
    },

    showFilter: function() {
      debugger;
      //this.titleContainer.classList.add('hidden');
      this.filterType = 'complex';
      if (!this.filterProps) {
        this.filterProps = [];
        var meta = this.vocModel.properties,
            first = this.collection.models[0],
            userRole = U.getUserRole(),
            prop;

        for (var p in meta) {
          prop = meta[p];
          if (!U.isSystemProp(p) && U.isPrimitiveTypeProp(prop) && U.isPropVisible(first, prop, userRole)) {
            if (prop.range.toLowerCase().indexOf('date') == -1 &&
                !prop.notSearchable &&
                (!prop.cloneOf || prop.cloneOf.indexOf('Distance') == -1))
              this.filterProps.push(prop);
          }
        }
      }

      var tmpl_data = _.clone(this.getBaseTemplateData());
      tmpl_data.props = this.filterProps;
//      tmpl_data.cancelable = false;

      // this.filter.style.display = 'none';
//      this.filterIcon.className = 'ui-icon-remove';
      this.filterContainer.$html(this.filterTemplate());
      // this.filterContainer.classList.remove('hidden');
      this.filterContainer.$('ul')[0].$html(this.filterConditionTemplate(tmpl_data));
//      this.redelegateEvents();
    },

    removeFilterCondition: function(e) {
      var icon = e.selectorTarget,
          parent,
          select;

      while (parent = icon.parentNode) {
        if (parent.tagName == 'LI') {
          select = parent.$('select')[0];
          if (this.collection.params[select.value]) {
            delete this.collection.params[select.value];
            this.collection.reset();
          }

          parent.$remove();
          break;
        }
      }

      if (!this.$('.filterCondition').length)
        this.toggleFilter(e);

      this.onFilter();
//      this.redelegateEvents();
    },

    addFilterCondition: function(e) {
      var ul = this.filterContainer.$('ul')[0],
          childNodes = ul.childNodes,
          i = childNodes.length,
          select,
          condition,
          current = this.$('.propertySelector').$map(function(s) { return s.value });

      while (i--) {
        select = childNodes[i].$('.propertySelector')[0];
        if (select.value == NO_PROP) {
          select.focus();
          return;
        }
      }

      ul.$append(this.filterConditionTemplate(_.extend({
        props: _.filter(this.filterProps, function(p) {return current.indexOf(p.shortName) == -1})
      }, this.getBaseTemplateData())));

      condition = ul.lastChild;
      this.doChangeFilterConditionProperty(condition.$('select')[0], condition.$('.filterConditionInput')[0]);
//      this.redelegateEvents();
    },

    changeFilterConditionProperty: function(e) {
      var select = e.selectorTarget,
          input = select.parentNode.$('.filterConditionInput')[0];

      this.doChangeFilterConditionProperty(select, input);
//      this.redelegateEvents();
    },

    doChangeFilterConditionProperty: function(select, input) {
      var value = select.value,
          prop;

      if (value == NO_PROP)
        input.$empty();
      else {
        prop = this.vocModel.properties[select.value];
        input.$html(this.filterConditionInputTemplate(_.extend({
          prop: prop,
          value: U.getDefaultPropValue(prop)
        }, this.getBaseTemplateData())));
      }

//      var evt = document.createEvent("HTMLEvents");
//      evt.initEvent('change', true, true ); // event type, bubbling, cancelable
//      input.$('input,select')[0].dispatchEvent(evt);
      this.onFilter();
    },

    focusFilter: function(e) {
      // HACK - JQM does sth weird to prevent focus when we're not using their listfilter widget
      this.filterContainer.focus();
    },

    search: _.debounce(function(e) {
      var params = this._filter.params;
      if (e.target.value) {
        var newValue = 'davDisplayName,' + e.target.value;
        if (params.$like == newValue)
          return;

        params.$like = newValue;
      }
      else {
        if (!params.$like)
          return;

        delete params.$like;
      }

      this.doFilter();
    }, 20),

    onFilter: _.debounce(function(e) {
      var filters = this.$('.filterCondition'),
          filter,
          propName,
          value,
          params = this._filter.params,
          i = filters.length;

      while (i--) {
        filter = filters[i];
        propName = filter.$('select')[0].value;
        if (propName != NO_PROP) {
          value = filter.$('.filterConditionInput select, .filterConditionInput input')[0].value;
          params[propName] = value; // U.getFlatValue(this.vocModel.properties[propName], value);
        }
      }

      this.doFilter();
    }, 20),

    refresh: function() {
//      this.refreshCallInProgressHeader();
      this.refreshTitle();
      this.refreshActivated();
      this.refreshFolder();
      this.refreshButtons();
      this.calcSpecialButtons();
      this.renderSpecialButtons();
      this._updateQuickstart();
//      this.error = null;
//      this.renderError();
//      this.restyleNavbar();
      return this;
    },

    refreshButtons: function(el) {
      el = el || this.$('.headerUl')[0];
      var self = this,
          buttons = this.buttons,
          left = el.$('.headerLeft')[0],
          right = el.$('.headerRight')[0],
          isEditPage = ~buttons.indexOf('save');

      left.$empty();
      right.$empty();
      if (this.hasQuickstart() && buttons.indexOf('help') == -1)
        buttons.splice(1, 0, 'help');

      left.$append(this.getButtonTemplate(buttons[0])());
      right.$append(_.rest(buttons).map(function(btn) {
        return self.getButtonTemplate(btn)();
      }).join(''));

      if (isEditPage) {
        left.style.textAlign = right.style.textAlign = 'center';
        if (~buttons.indexOf('help')) {
          this.$('.titleHeaderL')[0].$append(right.$('.helpBtn')[0]);
        }
      }

      if (this.hasFilter) {
        this.categories = false; // HACK for now, search is more important at the moment
        right.$('.filterToggle').$hide();
        this.getFetchPromise().done(function() {
          if (self.collection.models.length > 10) {
            self.$('.filterToggle').$show();
            if (self.hasFilter)
              self.filterEl = self.$('.filterToggle')[0];

            if (self.filterEl) {
              if (self._showSearchOnLoad || self.hashParams.$search == 'y')
                self.showSearch();
            }
          }
        });
      }
    },

    refreshFolder: function() {
//      if (!this.folder)
//        return;
//
//      if (!this.folder.uri) {
//        this.folder.uri = (this.resource && this.resource.get(this.folder.shortName)) ||
//                          this.hashParams[this.folder.shortName] ||
//                          this.hashParams.$rootFolder ||
//                          this.hashParams.$forResource;
//      }
//
//      if (!this.folder.uri)
//        return;
//
//      var rootFolderEl = this.$('.rootFolder')[0];
//      if (!rootFolderEl)
//        return;
//
//      rootFolderEl.style.display = 'initial';
//      rootFolderEl.$('span')[0].textContent = this.folder.name;
//      rootFolderEl.href = U.makePageUrl('view', this.folder.uri);
    },

//    _getRootFolderHref: function() {
//      return U.makePageUrl('view', this.rootFolder, rootFolder.params);
//    },

    refreshActivated: function() {
      this._checkActivatable();
      if (this._activatable) {
        var activatable = this.$('.activatable')[0];
        if (activatable) {
          activatable.style.display = 'inline-block';
          activatable.$('input')[0].checked = this.resource.get(this.activatedProp.shortName) ? 'checked' : '';
        }
      }
    },

    _isGeo: function() {
      return !_.isEmpty(_.pick(this.buttons, 'mapIt', 'aroundMe'));
    },

    render: function(options) {
      var self = this,
          args = arguments,
          embed = this.hashParams["-embed"];

      if (!this.rendered) {
        this.onload(function() {
          if (self.pageView.TAG == 'ListPage') {
            self._updateSize();
            self._rail = [self.getContainerBodyId(), 0, 0, 0, -self._outerHeight];
//            self.on('resized', function() {
//              self._rail[4] = -self._outerHeight;
//              self.updateMason();
//            });

            self.addToWorld(null, false);
//            Physics.there.trackDrag(self.getContainerBodyId(), 'vel'); // 'pos' for exact tracking, 'vel' for parallax
            self.getPageView().listView.onload(function() {
//              Physics.there.trackDrag(self.getContainerBodyId(), 'vel', self.pageView.listView.getContainerBodyId()); // 'pos' for exact tracking, 'vel' for parallax
              Physics.there.rpc(self.getPageView().listView.mason.id, 'attachHeader', [self.getContainerBodyId(), 0.02]);
            });
          }

          if (!self.resource || self.resource.isLoaded())
            self._updateQuickstart();
//          if (self.pageView.TAG == 'ListPage') {
//            self.pageView.listView.onload(function() {
//              Physics.there.track(self.getContainerBodyId(), self.pageView.listView.getContainerBodyId(), 'vel');
//            });
//          }
//          else
//            Physics.there.track(self.getContainerBodyId(), self.pageView.getContainerBodyId(), 'vel');
        });
      }

      options = options || {};
      if (!this.buttons || options.buttons) {
        this.buttons = options.buttons;
        this.isGeo = this._isGeo();
        // this.getButtonViews();
      }

      // function doRender() {
        self.renderHelper.apply(self, args);
        self.finish();
        if (G.isBootstrap())
          self.$('.headerUl div').$attr('class', 'navbar-header');
        // if (G.coverImage) {
        //   self.$('.headerUl a').$forEach(function(elm) {
        //     elm.style.color = G.coverImage.background;
        //   });
        // }
      // };

      //  if (this.btnsReq.state() !== 'pending') {
      //     doRender();
      //     doRender = null;
      //   }
      // if (this.ready.state() == 'pending') {
      //   this.ready.done(function() {
      //     if (doRender)
      //       doRender();
      //     else
      //       self.refresh();
      //   });
      // }
    },

    refreshTitle: function() {
      this.recalcTitle();
      this.titleContainer.innerHTML = this.title;
      var title = this.$('.pageTitle')[0],
          length = this.title.length,
          fontSize;

      title.innerHTML = this.title;
      if (length < 20) {

      }
      else if (length < 80)
        fontSize = '20px';
      else if (length < 150)
        fontSize = '16px';

      if (fontSize)
        title.style['font-size'] = fontSize;

//      $('title').text(this.title);
      this.pageView.trigger('titleChanged', this._title);
    },

    calcSpecialButtons: function() {
      var commonTypes = G.commonTypes,
          res = this.resource,
          self = this;

      if (this.isEdit || this.isChat)
        return;

      _.each(SPECIAL_BUTTONS, function(btnName) {
        this[btnName] = false;
      }.bind(this));

      if (res  &&  !this.isAbout) {
//        if (this.isEdit && this.vocModel.type === G.commonTypes.Jst) {
//          var tName = res.get('templateName');
//          this.resetTemplate = tName && this.getOriginalTemplate(tName);
//        }

        var user = G.currentUser._uri;
        var isApp = U.isAssignableFrom(this.vocModel, commonTypes.App);
        if (isApp) {
          var appOwner = U.getLongUri1(res.get('creator') || user);
          var lastPublished = res.get('lastPublished');
          if ((user == appOwner || U.isUserInRole(U.getUserRole(), 'admin', res))  &&  (!lastPublished || (lastPublished  &&  res.get('lastModifiedWebClass') > lastPublished)))
            this.publish = true;

          var noWebClasses = !res.get('lastModifiedWebClass')  &&  res.get('dashboard') != null  &&  res.get('dashboard').indexOf('http') == 0;
          var wasPublished = res.get('lastModifiedWebClass') < res.get('lastPublished');
          if (/*res.getUri()  != G.currentApp._uri  &&  */ (noWebClasses ||  wasPublished)) {
            if (res.get('_uri') != G.currentApp._uri)
              this.doTry = true;
            this.forkMe = true;
          }
        }
//        else if (U.isA(this.vocModel, "Templatable")) {
//          var cOf = U.getCloneOf(this.vocModel, 'Templatable.isTemplate');
//          if (cOf.length  &&  res.get(cOf[0])) {
//            var cOf = U.getCloneOf(this.vocModel, 'Templatable.clones');
//            if (cOf.length)
//              this.forkMe = true;
//          }
//        }

        else if (!G.currentUser.guest) {
          if (U.isAssignableFrom(this.vocModel, commonTypes.Handler)) {
//          var plugOwner = U.getLongUri1(res.get('submittedBy') || user);
//          if (user == plugOwner)
            if (!this.resource.isNew())
              this.testPlug = true;
          }
          else {
            if (U.isAssignableFrom(this.vocModel, U.getLongUri1("media/publishing/Video"))  &&  this.hashParams['-tournament'])
              this.enterTournament = true;
          }
        }
      }
    },

    renderSpecialButtons: function() {
      if (true) // for now
        return;

      if (this.isEdit || this.isChat)
        return;

      var self = this;
      SPECIAL_BUTTONS.forEach(function(btn) {
        var el = self.$('#{0}Btn'.format(btn));
        if (el) {
          el.$empty();
          el.$hide();
        }
      });

      var pBtn = this.buttonViews.publish;
      if (this.publish) {
        this.assign('#publishBtn', pBtn);
        this.$('#publishBtn').$show();
      }
      else if (pBtn) {
        this.$('#publishBtn').$hide();
        var options = _.filter(SPECIAL_BUTTONS, _['!='].bind(_, 'publish'));  // equivalent to _.filter(SPECIAL_BUTTONS, function(btn) { return btn != 'publish' })
        options.forEach(function(option) {
          var method = '$hide',
              selector = '#{0}Btn'.format(option);

          if (self[option]) {
            self.assign(selector, pBtn, _.pick(self, option));
            method = '$show';
          }

          self.$(selector)[method]();
        });
      }

      var hash = window.location.hash;
      var isChooser =  hash  &&  hash.indexOf('#chooser/') == 0;
      if (isChooser  &&  U.isAssignableFrom(this.vocModel, "Image")) {
        var forResource = this.hashParams['forResource'];
        var location = this.hashParams['$location'];
        var returnUri = this.hashParams['$returnUri'];
        var pr = this.hashParams['$prop'];
        if (forResource  &&  location  &&  pr) {
          var self = this,
              type = U.getTypeUri(forResource),
              cModel = U.getModel(type);

          if (!cModel) {
            Voc.getModels(type).done(function() {
              cModel = U.getModel(type);
              if (cModel  &&  !cModel.properties[pr].readOnly) {
                var frag = document.createDocumentFragment(),
                    existing = self.$('#fileUpload')[0],
                    rules = ' data-formEl="true"';

                U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location, returnUri: returnUri }));
                if (existing)
                  DOM.replaceChildNodes(existing, frag);
                else
                  self.el.$append(frag);
              }
            });
          }
          else {
            var frag = document.createDocumentFragment(),
                existing = self.$('#fileUpload')[0],
                rules = ' data-formEl="true"';

            U.addToFrag(frag, self.fileUploadTemplate({name: pr, forResource: forResource, rules: rules, type: type, location: location }));
            if (existing)
              DOM.replaceChildNodes(existing, frag);
            else
              self.el.$append(frag);
          }

        }
      }

//      if (!this.publish  &&  !this.doTry  &&  !this.forkMe  &&  !this.testPlug  &&  !this.enterTournament  && )
      if (!_.any(SPECIAL_BUTTONS, function(b) { return this[b]; }.bind(this)))
        this.noButtons = true;
    },

    getPhysicsTemplateData: function() {
      if (!this._physicsTemplateData) {
        this._physicsTemplateData = {
            constants: {}
        };
      }

      var constants = this._physicsTemplateData.constants,
          i = editablePhysicsConstants.length,
          cName;

      while (i--) {
        cName = editablePhysicsConstants[i];
        constants[cName] = Physics.constants[cName];
      }

      if (this.pageView.TAG != 'ListPage') {
        var i = friendlyTypes.length,
            keepTilt = false;

        while (i--) {
          if (U.isAssignableFrom(this.vocModel, friendlyTypes[i])) {
            keepTilt = true;
            break;
          }
        }

        if (!keepTilt)
          delete constants.tilt;
      }

      return this._physicsTemplateData;
    },

    renderPhysics: function() {
      if (!this.physicsConstantsEl)
        this.physicsConstantsEl = this.el.querySelector('.physicsConstants');

      this.physicsConstantsEl.innerHTML = this.physicsConstantsTemplate(this.getPhysicsTemplateData());
    },

    restyleNavbar: function() {
      var navbar = this.$('[data-role="navbar"]')[0];
      $(navbar).navbar();
      navbar.classList.remove('ui-mini');
    },

    _checkActivatable: function() {
      if (this.activatedProp && this.resource.isLoaded() && !_.has(this, '_activatable'))
        this._activatable = this.activatedProp && U.isPropEditable(this.resource, this.activatedProp);
    },

    renderBookmarks: function() {
      if (!U.getCurrentUrlInfo().type.endsWith('commerce/trading/Feed'))
        return;

      this.bookmarksEl = this.$('.bookmarks')[0];
      if (!this.bookmarksTemplate)
        this.makeTemplate('bookmarksTemplate', 'bookmarksTemplate', this.vocModel.type);

      if (!this.bookmarks) {
        this.bookmarks = [{
          name: 'All',
          on: true,
          type: U.getTypeUri('commerce/trading/Feed')
        }, {
          name: 'Stocks',
          type: U.getTypeUri('commerce/trading/Stock')
        }, {
          name: 'Indexes',
          type: U.getTypeUri('commerce/trading/Index')
        }, {
          name: 'Commodities',
          type: U.getTypeUri('commerce/trading/Commodity')
        }, {
          name: 'Macro',
          type: U.getTypeUri('commerce/trading/FREDFeed')
        }, {
          name: 'This Tradle',
          type: U.getTypeUri('system/designer/WebProperty'),
          params: {
            domainUri: U.getTypeUri('commerce/trading/TradleEvent'),
            avoidDisplaying: false,
            allowRoles: null,
            subPropertyOf: null,
            propertyType: '!Date' 
          }
        }, {
          name: 'Tradles',
          type: U.getTypeUri('commerce/trading/Tradle')
        }];
      }

      this.bookmarksEl.$show().$html(this.bookmarksTemplate({
        bookmarks: this.bookmarks
      }));
    },

    loadBookmark: function(e) {
      var self = this,
          input = e.selectorTarget.$('input')[0],
          bookmarkName = input.value,
          bookmarks = this.bookmarksEl.$('input[type="radio"]'),
          bookmark = _.find(this.bookmarks, function(b) { 
            return b.name == bookmarkName; 
          }),
          type = bookmark.type,
          filter = this._filter.params,
          i = bookmarks.length,
          model,
          runFilter = function() {
            self.updateSearchBar(model);
            while (i--) {
              var b = bookmarks[i];
              b.parentElement.classList[b.checked ? 'add' : 'remove']('actionBtn');
            }
            
            for (var p in filter) {
              if (U.isNativeModelParameter(p) || U.whereParams[p])
                delete filter[p];
            }
            
            if (bookmark.params)
              _.extend(filter, bookmark.params);
            
            self._filter.type = type;
            filter.$offset = 0;
            self.doFilter();
          };

      if (this.$('.search-active').length) {
        var search = this.getSearchInput();
        if (search)
          search.focus();
      }

      input.checked = true;
      this._lastBookmark = input;
      if (bookmarkName == 'All')
        model = this.vocModel;
      else {
        model = U.getModel(type);
        if (!model) {
          if (e instanceof Event)
            Events.stopEvent(e);

          this._fetchingFilterType = type;
          Voc.getModels(type).done(function(m) {
            if (input == self._lastBookmark) {
              model = m;
              runFilter();
            }
          });

          return;
        }
      }

      runFilter();
    },

    updateSearchBar: function(model) {
      var input = this.getSearchInput(),
          searchPlaceholder = ' Search';

      if (!input)
        return;

      if (model) {
        var plural;
        if (U.isAssignableFrom(model, 'system/designer/WebProperty'))
          plural = 'Indicators';
        else
          plural = U.getPlural(model);
        
        searchPlaceholder += ' ' + plural; 
      }

      searchPlaceholder += '...';
      input.$attr('placeholder', searchPlaceholder);
    },

    renderHelper: function() {
      var self = this;
//      var isJQM = G.isJQM(); //!wl  ||  wl == 'Jquery Mobile';
      var res = this.resource; // undefined, if this is a header for a collection view
      var error = res && res.get('_error');
      if (error)
        this.error = error.details;

      this.calcSpecialButtons();
      if (this.rendered)
        this.html("");

      var isTemplates = this._hashInfo.route == 'templates';
      if (!isTemplates  &&  !res) {
        if (U.isAssignableFrom(this.vocModel, G.commonTypes.WebClass))
          this.categories = false;
        else if (U.isAssignableFrom(this.vocModel, G.commonTypes.App))
          this.categories = true;
        else if (U.isA(this.vocModel, 'Taggable')) {
          var cOf = U.getCloneOf(this.vocModel, 'Taggable.tags');
          if (cOf.length) {
            if (!this.vocModel.properties[cOf[0]].avoidDisplaying)
              this.categories = true;
          }
        }
      }
      else if (!res) {
        var hash = window.location.hash;
        var isChooser =  hash  &&  hash.indexOf('#chooser/') == 0;
        var prop = this.hashParams['$prop'];
        if (isChooser  &&  U.isAssignableFrom(this.vocModel, commonTypes.WebClass)  &&  prop /* == 'range'*/) {
          this.moreRanges = true;
          var type = this.hashParams['$type'];

          var pname;
          if (type) {
            var pModel = U.getModel(type);
            pname = U.getPropDisplayName(pModel.properties[prop]);
          }
          else
            pname =  this.vocModel.properties[prop].displayName;
          if (this.hashParams['$more'])
            this.moreRangesTitle = 'Less ' + pname;
          else
            this.moreRangesTitle = 'More ' + pname;
        }
      }

      var tmpl_data = this.getBaseTemplateData();

      tmpl_data.activatedProp = this.activatedProp;
      tmpl_data.folder = this.folder;

//      tmpl_data.physics = this.getPhysicsConstants(); //Physics.scrollerConstants[this._scrollerType]);
      if (U.isChatPage()) {
//        tmpl_data.more = _.param({
//          "data-position": "fixed"
//        });
      }
//      if (isJQM) {
//        if (!this.publish  &&  this.doTry  &&  this.forkMe)
//          tmpl_data.className = 'ui-grid-b';
//      }

      this.html(this.template(tmpl_data));
      this.titleContainer = this.$('.pageTitle')[0];
      this.renderPhysics();
      this.refreshTitle();
      this.refreshActivated();
      this.refreshFolder();
//      this.$el.prevObject.attr('data-title', this.pageTitle);
//      this.$el.prevObject.attr('data-theme', G.theme.list);
      this.getPageView().el.$data('title', this.pageTitle);
//      pageData.theme = G.theme.list;
      var frag = document.createDocumentFragment();
      frag.$append(this.headerButtonsTemplate());
      // var btns = this.buttonViews;
      var isMapItToggleable = !!this.collection;

//      var numBtns = _.size(btns);
      var paintedBtns = [];
      this.refreshButtons(frag);
//       REGULAR_BUTTONS.forEach(function(btnName) {
//         var btn = btns[btnName];
//         if (!btn)
//           return;

//         var btnOptions = {
//           force: true
//         };

//         if (btnName === 'mapIt') {
// //          this.isGeo = this.isGeo && this.collection && _.any(this.collection.models, function(m) {  return !_.isUndefined(m.get('latitude')) || !_.isUndefined(m.get('shapeJson'));  });
//           if (!self.isGeo)
//             return;

//           btnOptions.toggleable = isMapItToggleable;
//         }

//         paintedBtns.push(btn.el);
//         frag.appendChild(btn.render(btnOptions).el);
//       });

      // numBtns = paintedBtns.length;
      // var cols = numBtns;
      // var btnWidth = Math.round(100 * (100/cols))/100;
      // for (var i = 0; i < paintedBtns.length; i++) {
      //   paintedBtns[i].$css('width', btnWidth + '%');
      // }

      this.$('.headerUl')[0].$html(frag);

//      this.renderError();
      this.renderSpecialButtons();
      this.renderBookmarks();

//      if (G.isJQM())
//        this.$el.trigger('create');
      if (this.isEdit  ||  this.isChat  ||  this.noButtons) {
        this.$('.headerButtons').$addClass('hidden');
      }
//      if (isJQM) {
//        if (!this.noButtons  &&  !this.categories  &&  !this.moreRanges) {
//          this.$('#name').$removeClass('resTitle');
//          if (this.resource  &&  !this.isEdit) {
//            var pt = this.titleContainer;
//            if (pt.length) {
//              pt.$css({
//                'padding-bottom': '4px',
//                'border-bottom': '1px solid rgba(255,255,255,0.5)'
//              });
//            }
//          }
//          // this.$el.find('.pageTitle').css('margin-bottom', '0px');
//        }
//      }
      if (!this.noButtons  &&  !this.categories  &&  !this.moreRanges  &&  !this.isEdit /* &&  !G.isBB()*/) {
        this.$('#name.resTitle').$css('padding', '0px');
      }
//      var wl = G.currentApp.widgetLibrary;
//      if (isJQM) {
//        if (this.noButtons)
//          this.$('h4').$css('margin-top', '10px');
//        else
//          this.$('h4').$css('margin-top', '4px');
//      }

//       for (var btn in btns) {
//         var badge = btns[btn].$('.menuBadge');
//         if (badge.length) {
// //          if (G.isJQM())
// //            badge.$css('left', Math.floor(btnWidth/2) + '%');
// //          else
//             //badge.$css('left', '50%');
//         }
//       }
      // HACK
      // this hack is to fix loss of ui-bar-... class loss on header subdiv when going from masonry view to single resource view
      var header = this.$('.ui-header')[0];
      var barClass = 'ui-bar-c';//{0}'.format(G.theme.header);
      if (header && !header.classList.contains(barClass))
        header.classList.add(barClass);

      // END HACK

//      this.refreshCallInProgressHeader();
//      if (isJQM)
//        this.restyleNavbar();
      if (G.isTopcoat())
        this.$('li').$attr('class', 'topcoat-button-bar__item');

      this.finish();
      return this;
    },

    getQuickstartTemplate: function() {
      if (this.quickstartTemplate)
        return this.quickstartTemplate;

      var urlInfo = U.getCurrentUrlInfo(),
          params = urlInfo.params,
          forRes = params.$forResource,
          template;

      if (this.resource && this.resource.isAssignableFrom('commerce/trading/Tradle')) {
        var owner = this.resource.get('owner'),
            submittedBy = this.resource.get('submittedBy'),
            uri = G.currentUser._uri;

        if (uri == (owner || submittedBy))
          template = 'tradleViewQuickstartTemplate';
      }
      else if (urlInfo.route == 'chooser') {
        if (params.$propA == 'tradle' && params.$propB == 'feed')
          template = 'feedChooserQuickstartTemplate';
        else if (U.isAssignableFrom(this.vocModel, 'system/designer/WebProperty'))
          template = 'indicatorChooserQuickstartTemplate';
        else if (U.isAssignableFrom(this.vocModel, 'system/designer/WebClass')) {
          if (urlInfo.params.$createInstance == 'y')
            template = 'ruleChooserQuickstartTemplate';
          else
            template = 'indicatorVariantChooserQuickstartTemplate';
        }
      }

      if (!template)
        return null;

      this.makeTemplate(template, 'quickstartTemplate', this.vocModel.type);
      return this.quickstartTemplate;
    },

    hasQuickstart: function() {
      if (G.currentApp.appPath != 'Tradle')
        return false;

      var route = this._hashInfo.route;
      return (route == 'view' || route == 'chooser') && !!this.getQuickstartTemplate();
    },

    updateQuickstart: _.debounce(function() {
      this._updateQuickstart();
    }, 100),

    _updateQuickstart: function() {
      if (!this.hasQuickstart() || !this.rendered)
        return;

      if (U.isQuickstartAutohidden()) {
        this._quickstartNeedsUpdate = true;
        return;
      }

      this.quickstart = this.$('.quickstart')[0];
      this.quickstart.$html(this.quickstartTemplate());
      this.showQuickstart();
    },

    showQuickstart: function(e) {
      U.saveQuickstartSettings();
      if (this._quickstartNeedsUpdate) {
        delete this._quickstartNeedsUpdate;
        this._updateQuickstart();
        return;
      }

      this.getPageView().removeTooltips();
      this.quickstart = this.quickstart || this.$('.quickstart')[0];
      this.el.$addClass('quickstart-active');
      this.updateHeaderSize();

//      if (e)
//        e._showedQuickstart = true;
    },

//    checkHideQuickstart: function(e) {
//      if (!this.hasQuickstart() || !this.quickstart || !this.quickstart.$hasClass('quickstart-active') || (e && e._showedQuickstart))
//        return;
//
//      if (e.target.$closest('.quickstart-active') == null)
//        this.hideQuickstart(e, true);
//    },

    hideQuickstart: function(e) {
      if (!this.quickstart || !this.el.$hasClass('quickstart-active'))
        return;

      U.saveQuickstartSettings(true);
      if (this.getPageView().TAG == 'ListPage' && arguments.length == 1)
        noTooltip = true;

      this.el.$removeClass('quickstart-active');
      this.updateHeaderSize();

//      if (noTooltip)
//        return;
//
//      var self = this;
//      setTimeout(function() {
//        self.getPageView().addTooltip(helpIcon, 'You can always launch Quickstart again by clicking here', 'bottom-left');
//      }, 300);
    },

    updateHeaderSize: _.debounce(function() {
      this.invalidateSize();
      this.getPageView().invalidateSize();
      var lv = this.getPageView().listView;
      if (lv)
        lv.invalidateSize();
    }, 500)
//    ,
//    getContainerBodyOptions: function() {
//      var options = BasicView.prototype.getContainerBodyOptions.apply(this, arguments);
//      options.z = 1;
//      return options;
//    }
  },
  {
    displayName: 'Header'
  });
});
