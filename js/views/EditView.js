//'use strict';
define([
  'globals',
  'events', 
  'error', 
  'utils',
  'cache',
  'vocManager',
  'views/BasicView'
], function(G, Events, Errors, U, C, Voc, BasicView) {
  function willShow(res, prop, role) {
    var p = prop.shortName;
    return !prop.formula  &&  !U.isSystemProp(p) && U.isPropEditable(res, prop, role);
  };

  var scrollerTypes = ['date', 'duration'];
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 
                      'onSelected', 'setValues', 'redirect', 'getInputs', 'getScrollers', 'getValue', 'addProp', 
                      'scrollDate', 'scrollDuration', 'scrollEnum'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      var type = this.vocModel.type;
      this.makeTemplate('propGroupsDividerTemplate', 'propGroupsDividerTemplate', type);
      this.makeTemplate('editRowTemplate', 'editRowTemplate', type);
      this.makeTemplate('hiddenPET', 'hiddenPropTemplate', type);
      this.makeTemplate('buyPopupTemplate', 'popupTemplate', type);

      this.resource.on('change', this.refresh, this);
      this.action = options && options.action || 'edit';
//      this.backlinkResource = options.backlinkResource;
      
      // maybe move this to router
      var codemirrorModes = U.getRequiredCodemirrorModes(this.vocModel);
      this.isCode = codemirrorModes.length;
//      this.resource.set(init, {silent: true});
//      this.edited = {};
      
      var readyDfd = $.Deferred(function(defer) {
        if (this.isCode) {
          U.require(['codemirror', 'codemirrorCss'].concat(codemirrorModes), function() {
            defer.resolve();
          }, this);
        }
        else
          defer.resolve();        
      }.bind(this));
      
      this.ready = readyDfd.promise();
      Events.on('pageChange', function(from, to) {
        // don't autosave new resources, they have to hit submit on this one...or is that weird
        if (!this.isChildOf(from) || this.resource.isNew() || U.getHash().startsWith('chooser')) 
          return;
        
        var unsaved = this.resource.getUnsavedChanges();
        if (_.size(unsaved))
          this.resource.save();
      }.bind(this));

      Events.on('active', function(active) {
        if (active)
          this.canceled = false;
      }.bind(this));
      
      this.autoFinish = false;
      return this;
    },
    events: {
      'click .cancel': 'cancel',
      'submit form': 'submit',
      'click .resourceProp': 'chooser',
      'click input[data-duration]': 'scrollDuration',
      'click input[data-date]': 'scrollDate',
      'click select[data-enum]': 'scrollEnum',
      'click': 'click'
    },

    disable: function(msg) {
//      var meta = this.vocModel.properties;
//      this.getInputs().each(function() {
//        var prop = meta[this.name];
//        if (prop.script) {
//          var codemirror = $.data(textarea, 'codemirror');
//          if (codemirror) {
//            
//          }
//        }
//          
//          
//        switch (this.tagName.toLowerCase()) {
//        case 'textarea':
//          this.
//        }
//        
//        $(this).addClass('ui-disabled');
//      });
//      
//      this.$('*').attr('disabled', true);
      Events.trigger('info', {info: msg, page: this.getPageView(), persist: true});
    },
    
    scrollDate: function(e) {
      this.mobiscroll(e, 'date');
    },

    scrollDuration: function(e) {
      this.mobiscroll(e, 'duration');
    },

    scrollEnum: function(e) {
      this.mobiscroll(e, 'enum');
    },

    mobiscroll: function(e, scrollerType) {
      var inits = this.initializedScrollers = this.initializedScrollers || {};
      if (inits[scrollerType])
        return;
      
      inits[scrollerType] = true;
      $(e.target).blur(); // hack to suppress keyboard that would open on this input field
      Events.stopEvent(e);
      
//      // mobiscrollers don't disappear on their own when you hit the back button
//      Events.once('changePage', function() {
//        $('.jqm, .dw-modal').remove();
//      });
      
      var self = this;
      var thisName = e.target.name;
      var meta = this.vocModel.properties;
      var modules = ['mobiscroll'];
      if (scrollerType === 'duration')
        modules.push('mobiscroll-duration');
      
      U.require(modules, function() {
        _.each(self.getScrollers(), function(input) {
          var name = input.name;
          var prop = meta[name];
          // default to enum
          var settings = {
            theme: 'jqm',
            display: 'modal',
            mode:'scroller',
            label: U.getPropDisplayName(prop),
            shortName: name,
            onSelect: self.onSelected,
            input: input
          };

          scrollerType = settings.__type = _.find(['date', 'duration'], function(type) {
            return _.has(input.dataset, type);
          });
//          var scroller;
//          if (scrollerType === 'enum') {
//            var type = U.getLongUri1(prop.facet),
//                values = _.pluck(G.typeToEnum[type].values, 'displayName');
//            
//            scrollerModule.makeEnumScroller(type, values);
//            scroller = $(this).mobiscroll()[type](settings);
//          }
//          else
          var scroller;
//          var scroller = $(this).mobiscroll()['duration'](settings);
          switch (scrollerType) {
            case 'date':
            case 'duration':
              var isDate = scrollerType === 'date';
              scroller = $(input).mobiscroll()[scrollerType](settings);
              var val = input.value && parseInt(input.value);
              if (typeof val === 'number')
                scroller.mobiscroll(isDate ? 'setDate' : 'setSeconds', isDate ? new Date(val) : val, true);
              
              break;
//            default:
//              var wheel = _.pluck(G.typeToEnum[U.getLongUri1(prop.facet)].values, 'displayName');
//              settings.wheels = [wheel];
//              scroller = $(input).mobiscroll().select(settings);
//              var val = input.value;
//              if (val)
//                scroller.mobiscroll('setValue', val, true);
//              
//              break;            
          }
          
          if (name === thisName)
            scroller.click().focus();
        });
      });
    },

    onChoose: function(e, prop) {
      var hash = window.location.href;
      hash = hash.slice(hash.indexOf('#') + 1);
      var self = this, 
          commonTypes = G.commonTypes,
          vocModel = this.vocModel;
      
      return function(options) {
        var chosenRes;
        var checked;
        var isBuy = options.buy;
        var isMultiValue = !isBuy  &&  options.model != null;
        if (isBuy)
          chosenRes =  options.model;
        else if (isMultiValue) {
          chosenRes =  options.model;
          checked = options.checked;
        }
        else
          chosenRes = options;
        
        G.log(this.TAG, 'testing', chosenRes.attributes);
        var props = {};
        var link = e.target;
        if (isMultiValue) {
          var innerHtml = '';
          var set = '';
          var input;
          for (var i=0; i<checked.length; i++) {
  //          var val = $('label[for="' + checked[i].id + '"]')[0].value;
            var style = checked[i].style;
            if (style  &&  style.display  == 'none')
              continue;
            if (i != 0)
              innerHtml += ', ';
            innerHtml += checked[i].name;
            input = checked[i].value;
            $(link.parentNode).append($(input));
            if (i != 0)
              set += ',';
            set += input;
          }
//          input = '<input type="checkbox" checked="checked" data-formel="true" name="' + prop + '"' + ' value="' + innerHtml + '" style="display:none" />';
//          set += input;
//          $(link.parentNode).append($(input));
          var html = link.innerHTML;
          var idx = html.indexOf('</label>');
          var idx1 = html.indexOf('<br>');
          link.innerHTML = idx1 == -1 ? html.substring(0, idx + 8) + ' ' + innerHtml : html.substring(0, idx + 8) + ' ' + innerHtml;
//          $(link).attr("data-formel", "true");
          props[prop] = innerHtml; //set;
          props[prop + '.displayName'] = innerHtml;
          this.resource.set(props, {skipValidation: true, skipRefresh: true});
          this.setValues(props, {skipValidation: true, skipRefresh: false});
          this.setResourceInputValue(link, set);
        }
        
        else {
          if (!isBuy  &&  chosenRes.isA('Buyable')  &&  this.$el.find('.buyButton')) {
    //        Events.trigger('buy', this.model);
            var price = chosenRes.get('price');
            if (price  &&  price.value) { 
              Events.stopEvent(e);
              var $popup = $('#buy_popup');
              var dn = U.getDisplayName(chosenRes);
              var msg = 'Try ' + chosenRes.vocModel.displayName + ': ' + dn + 'for free for 3 days'; // + ' for ' + price.currency + price.value;
              var href = chosenRes.getUri();          
              var html = this.popupTemplate({href: href, msg: msg, displayName: dn, title: 'New ' + chosenRes.vocModel.displayName});
              if ($popup.length == 0) {
                $($(document).find($('.ui-page-active'))[0]).append(html);
                
      //          $('body').append(html);
                $popup = $('#buy_popup');
              }
              else {
                $('#buyMsg').html(msg);
                $('#buyLink').attr('href', href);
                $('#tryLink').attr('href', href);
                $('#buyName').html(dn);
              }
              $popup.trigger('create');
              $popup.popup().popup("open");
              return;
            }
          }
          var uri = chosenRes.getUri();
          props[prop] = uri;
          var resName = U.getDisplayName(chosenRes);
          if (resName)
            props[prop + '.displayName'] = resName;
          this.setValues(props, {skipValidation: true, skipRefresh: false});
          var pr = vocModel.properties[prop];
          var dn = pr.displayName;
          if (!dn)
            dn = prop.charAt(0).toUpperCase() + prop.slice(1);
          var name = chosenRes.get('davDisplayName');
          link.innerHTML = '<span style="font-weight:bold">' + dn + '</span> ' + chosenRes.get('davDisplayName');
          this.setResourceInputValue(link, uri);
          if (U.isAssignableFrom(vocModel, commonTypes.App)  &&  U.isAssignableFrom(chosenRes.vocModel, commonTypes.Theme)) {
            if (G.currentApp) {
              var cUri = G.currentApp._uri;
              if (cUri.indexOf('http') == -1) {
                cUri = U.getLongUri1(cUri);
                G.currentApp._uri = cUri;
              }
              if (this.resource.getUri() == cUri) {
                var themeSwatch = chosenRes.get('swatch');
                if (themeSwatch  &&  !G.theme.swatch != themeSwatch) 
                  G.theme.swatch = themeSwatch;
              }
            }
          }
        }
        Events.trigger('back');
//        this.router.navigate(hash, {trigger: true, replace: true});
      }.bind(this);
//      G.Router.changePage(self.parentView);
      // set text
    },

    chooser: function(e) {
      Events.stopEvent(e);
      var el = e.target;
      var prop = e.target.name;
      var self = this;
      var vocModel = this.vocModel, type = vocModel.type, res = this.resource, uri = res.getUri();
      var pr = vocModel.properties[prop];
      Events.off('chooser:' + prop); // maybe Events.once would work better, so we don't have to wear out the on/off switch 
      Events.on('chooser:' + prop, this.onChoose(e, prop), this);
      var params = {};
      if (pr.where) {
        params = U.getQueryParams(pr.where);
        for (var p in params) {
          var val = params[p];
          if (val.startsWith("$this")) { // TODO: fix String.prototyep.startsWith in utils.js to be able to handle special (regex) characters in regular strings
            if (val === '$this')
              params[p] = res.getUri();
            else {
              val = res.get(val.slice(6));
              if (val)
                params[p] = val;
              else
                delete params[p];
            }
          }
        }
        
        if (!pr.multiValue  &&  !U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) {
          params.$prop = prop;
          return this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), params), {trigger: true});
        }
      }
      
      if (pr.multiValue) {
        var prName = pr.displayName;
        if (!prName)
          prName = pr.shortName;
//        var url = U.makeMobileUrl('chooser', U.getTypeUri(pr.lookupFrom), {$multiValue: prop, $type: type, $forResource: uri});
        params.$type = type;
        params.$multiValue = prop;
        if (this.action == 'make') {
//          if (U.isAssignableFrom(vocModel, 'AppInstall')) {
//            params.$checked = 'y'; // check all by default
//          }
        }
        else
          params.$forResource = uri;
        
        params.$title = U.makeHeaderTitle(vocModel.displayName, prName);
        var mvList = (e.target.text || e.target.textContent).trim(); //e.target.innerText;
        mvList = mvList.slice(U.getPropDisplayName(pr).length + 1);
        params['$' + prop] = mvList;
        this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.lookupFromType), params), {trigger: true});
        return;
      }
      if (U.isAssignableFrom(vocModel, G.commonTypes.WebProperty)) { 
        var title = U.getQueryParams(window.location.hash)['$title'];
        var t;
        if (!title)
          t = vocModel.displayName;
        else {
          var idx = title.indexOf('</span>');
          t =  title.substring(0, idx + 7) + "&nbsp;&nbsp;" + vocModel.displayName;
        }
        var domain = U.getLongUri1(res.get('domain'));
        var rParams = {
            $prop: pr.shortName,
            $type:  vocModel.type,
            $title: t,
            $forResource: domain
          };

        if (vocModel.type.endsWith('BacklinkProperty')) {
          var pf = U.getLongUri1(res.get('parentFolder'));
          if (G.currentUser.guest) 
            _.extend(rParams, {parentFolder: pf});
          else {
            var params = {parentFolder: pf, creator: '_me'};
            _.extend(rParams, {$or: U.getQueryString(params, {delimiter: '||'})});
          }
        }
//          var params = '&$prop=' + pr.shortName + '&$type=' + encodeURIComponent(this.vocModel.type) + '&$title=' + encodeURIComponent(t);
//          params += '&$forResource=' + encodeURIComponent(this.model.get('domain'));

//          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)) + "?" + params, {trigger: true});
        this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
        return;
      }
      
      var range = U.getLongUri1(pr.range);
      var prModel = U.getModel(range);
      var isImage = prModel  &&  U.isAssignableFrom(prModel, "Image");
      if (!isImage  &&  !prModel) {
        var idx = range.indexOf('/Image');
        isImage = idx != -1  &&  idx == range.length - 6;
      }
      if (isImage) {
        var prName = pr.displayName;
        if (!prName)
          prName = pr.shortName;
        var rParams = { forResource: res.getUri(), $prop: pr.shortName, $location: res.get('attachmentsUrl'), $title: U.makeHeaderTitle(vocModel.displayName, prName) };
        this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
        return;
      }

      var rParams = {
        $prop: pr.shortName,
        $type: vocModel.type
      };
      
      this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.range), rParams), {trigger: true});
//        var w = pr.where;
//        var wOr =  pr.whereOr;
//        if (!w  &&  !wOr)
//          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)), {trigger: true});
//        else {
//          var s = w || wOr;
//            
//          s = w.replace(' ', '').replace('==', '=').replace('!=', '=!');
//          s = w ? w.replace('&&', '&') : wOr; 
//          this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)) + '?' + (w ? '$and=' : '$or=') + encodeURIComponent(s), {trigger: true});
//        }
    },
    set: function(params) {
      _.extend(this, params);
    },
    resetForm: function() {
      $('form').clearForm();      
    },
    getInputs: function() {
      return this.$form.find('[data-formEl]');
    },
    getScrollers: function() {
      return this.$form.find('.i-txt');
    },
    isScroller: function(input) {
      input = input instanceof $ ? input : $(input);
      return input.hasClass('i-txt');
    },
    fieldError: function(resource, errors) {
      if (arguments.length === 1)
        errors = resource;
      
      var badInputs = [];
      var errDiv = this.$form.find('div[name="errors"]');
      errDiv.empty();
      var inputs = this.getInputs();
      for (name in errors) {
        var msg = errors[name];
        var madeError = false;
        var input = inputs.filter(function(idx, inp) {
          return (inp.name === name);
        });
        
        var id;
        if (input.length) {
          badInputs.push(input[0]);
          var id = input[0].id;
          var err = this.$form.find('label.error[for="{0}"]'.format(id));
          if (err.length) {
            err[0].innerText = msg;
            madeError = true;
          }
        }
        
        if (!madeError) {
          var label = document.createElement('label');
          label.innerHTML = msg;
          if (id)
            label.setAttribute('for', id);
          label.setAttribute('class', 'error');
          if (input.length)
            input[0].parentNode.insertBefore(label, input.nextSibling);
          else
            errDiv[0].appendChild(label);
        }
      }
      
      if (badInputs.length) {
        $('html, body').animate({
          scrollTop: $(badInputs[0]).offset().top - 10
        }, 1000);
      }
    },
    
    redirect: function(options) {
      var params = U.getQueryParams();
      var options = _.extend({replace: true, trigger: true}, options || {});

      if (params.$returnUri) 
        return this.router.navigate(params.$returnUri, _.extend({forceFetch: true}, options));
        
      var res = this.resource,
          uri = res.getUri(),
          vocModel = this.vocModel,
          webPropType = G.commonTypes.WebProperty,
          self = this;

      if (this.action === 'edit') {
//        if (U.isAssignableFrom(vocModel, webPropType))
//          this.router.navigate(U.makeMobileUrl('view', res.get('domain')), _.extend({forceFetch: true}, options));
//        else
          Events.trigger('back');
        
        return;
      }  
      
      if (U.isAssignableFrom(vocModel, U.getLongUri1('system/designer/InterfaceImplementor'))) {
        var iClName = U.getValueDisplayName(res, 'interfaceClass');
        var title = iClName ? U.makeHeaderTitle(iClName, 'Properties') : 'Interface properties';
        return this.router.navigate(U.makeMobileUrl('list', webPropType, {domain: res.get('implementor'), $title: title}), _.extend({forceFetch: true}, options));
      }
      else if (U.isAssignableFrom(vocModel, webPropType)) {
//        var wClName = U.getValueDisplayName(res, 'domain');
//        var title = wClName ? U.makeHeaderTitle(wClName, 'Properties') : 'Properties';
//        return this.router.navigate(U.makeMobileUrl('list', webPropType, {domain: res.get('domain'), $title: title}), _.extend({forceFetch: true}, options));
        var propType = res.get('propertyType');
        switch (propType) {
          case 'Link':
          case 'Collection':
            return this.router.navigate(U.makeMobileUrl('edit', res), _.extend({forceFetch: true}, options));
          default: 
            return this.router.navigate(U.makeMobileUrl('view', res.get('domain')), _.extend({forceFetch: true}, options));
        }        
      }
      else if (U.isAssignableFrom(vocModel, G.commonTypes.App) && G.online) {
        var isFork = res.get('forkedFrom');
        var preMsg = isFork ? 'Forking in progress, hold on to your hair.' : 'Setting up your app, hold on to your knickers.';
        var postMsg = isFork ? 'Forking complete, gently release your hair' : 'App setup complete';
        $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, preMsg, false);
        res.on('error', function(error) {
          $.mobile.hidePageLoadingMsg();          
        });
        
        res.once('sync', function() {
          $.mobile.hidePageLoadingMsg();
          $.mobile.showPageLoadingMsg($.mobile.pageLoadErrorMessageTheme, postMsg, false);
          setTimeout($.mobile.hidePageLoadingMsg, 3000);
          res.fetch({forceFetch: true});
        });
      }
      
      if (res.isA('Redirectable')) {
        var redirect = U.getCloneOf(vocModel, 'Redirectable.redirectUrl');
        if (!redirect.length)
          redirect = U.getCloneOf(vocModel, 'ElectronicTransaction.redirectUrl');  // TODO: undo hack
        if (redirect.length) {
          redirect = res.get(redirect);
          if (redirect) {
            window.location.href = redirect;
            return;
          }
        }
      }
      
      var redirectAction = vocModel.onCreateRedirectToAction || 'SOURCE',
          redirectParams = {},
          action = '',
          redirectPath = '',
          redirectTo = vocModel.onCreateRedirectTo;
      // check if we came here by backlink
      if (!redirectTo && params.$backLink) 
        redirectTo = U.getContainerProperty(vocModel);
 
      if (!redirectAction) {
        Events.trigger('back');
        return;
      }
      
      switch (redirectAction) {
        case 'LIST':
          if (redirectTo) { 
            var dotIdx = redirectTo.indexOf('.');
            if (dotIdx != -1) {
              var pName = redirectTo.slice(0, dotIdx),
                  prop = vocModel.properties[pName],
                  range = U.getLongUri1(prop.range),
                  rangeCl = U.getModel(range);
              
              if (rangeCl) {
                redirectParams[pName] = res.get(pName);
                var bl = redirectTo.slice(dotIdx + 1);
                var blProp = rangeCl.properties[bl];
                if (blProp)
                  redirectPath = blProp.range;
                else {
                  G.log(this.TAG, 'error', 'couldn\'t create redirect', redirectTo);
                  self.router.navigate(U.makeMobileUrl('view', uri), options);
                  return;
                }
              }
              else {
                var args = arguments;
                Voc.getModels(range).done(function() {
                  self.redirect.apply(self, args);
                }).fail(function() {
                  self.router.navigate(U.makeMobileUrl('view', uri), options);
                })
                
                return;
              }
            }
            
            redirectPath = redirectPath || U.getTypeUri(vocModel.properties[redirectTo]._uri);
          }
          else  
            redirectPath = vocModel.type;
          
          options.forceFetch = true;
          break;
        case 'PROPFIND':
        case 'PROPPATCH':
          if (!redirectTo || redirectTo === '-$this') {
            redirectPath = uri;
          }
          else {
            var prop = vocModel.properties[redirectTo];
            if (prop.backLink) {
              redirectPath = uri;
//              redirectPath = 'make/'; //TODO: make this work for uploading images
            }
            else {
              var target = res.get(redirectTo);
              if (target) {
                target = target.value || target;
                redirectPath = target;
              }
              else
                redirectPath = uri;
            }
          }
          
          action = redirectAction === 'PROPFIND' ? 'view' : 'edit';
          break;
        case 'SOURCE':
          redirectPath = this.source;
          if (_.isUndefined(redirectPath)) {
            redirectPath = uri;
            action = 'view';
          }
          
          options.forceFetch = true;
          break;
        default:
          G.log(this.TAG, 'error', 'unsupported onCreateRedirectToAction', redirectAction);
          redirectPath = vocModel.type;
          options.forceFetch = true;
          break;
      }
      
      var redirectMsg = vocModel.onCreateRedirectToMessage;
      if (redirectMsg)
        redirectParams['-info'] = redirectMsg;
      
      this.router.navigate(U.makeMobileUrl(action, redirectPath, redirectParams), options);
    },
    
    getAtt: function(att) {
//      var edits = res.getUnsavedChanges();
      var result = {}, displayName;
//      if (_.has(edits, att)) {
//        result.value = edits[att];        
//        displayName = edits[att + '.displayName'];
//      }
//      else {
        result.value = this.resource.get(att);
        displayName = U.getValueDisplayName(this.resource, att);
//      }
      
      if (_.isUndefined(result.value))
        return undefined;
      
      if (displayName)
        result.displayName = displayName;
      
      return result;
    },
    
    getValue: function(input) {
      var jInput = $(input);
      var val;
      
      var p = this.vocModel.properties[input.name];
      if (p  &&  p.multiValue)
        val = this.getResourceInputValue(jInput); //input.innerHTML;
      else
        val = input.tagName === 'A' ? this.getResourceInputValue(jInput) : input.value;
      if (_.contains(input.classList, 'boolean'))
        return val === 'Yes' ? true : false;
      else {
        for (var i = 0; i < scrollerTypes.length; i++) {
          var data = jInput.data('data-' + scrollerTypes[i]);
          if (data)
            return data;
        }
        
        return val;
      }
    },
    submit: function(e) {
      if (G.currentUser.guest) {
        // TODO; save to db before making them login? To prevent losing data entry
        Events.trigger('req-login', {returnUri: U.getPageUrl(this.action, this.vocModel.type, res.attributes)});
        return;
      }
      
      Events.stopEvent(e);
      var isEdit = (this.action === 'edit');
      var res = this.resource, 
          uri = res.getUri();
      
      if (!isEdit && uri) {
//        this.incrementBLCount();
        debugger;
        this.redirect({forceFetch: true});
        return;
      }
      
      var inputs = this.getInputs();
      inputs.attr('disabled', true);
      var self = this,
          action = this.action, 
          url = G.apiUrl, 
          form = this.$form, 
          vocModel = this.vocModel,
          meta = vocModel.properties;
      
      var atts = {};
      // TODO: get rid of this whole thing, resource.getUnsavedChanges() should have all the changes
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.name;
        if (_.isUndefined(name))
          continue;
        
        val = this.getValue(input);
//        if (name.indexOf('_select') == -1  ||  !meta[name.substring(0, name.length - 7)].multiValue) {
//          atts[name] = val;
//          _.extend(atts, U.filterObj(res.attributes, function(att) {return att.startsWith(name + '.')}));
//        }
//        else {
        if (name.indexOf('_select') == -1  &&  meta[name].multiValue) {
          atts[name] = res.get(name);
          var v = val.split(',');
          atts[name + '_select'] = v;
//          var v = atts[name];
//          if (!v) {
//            v = [];
//            atts[name] = v;
//          }
//          v.push(val);
        }
        else if (input.dataset.code) {
          atts[name] = $(input).data('codemirror').getValue();
        }
      }
      
      var succeeded = false;
      var onSuccess = function() {
        if (succeeded)
          return;
        
        succeeded = true;
        var props = U.filterObj(res.getUnsavedChanges(), function(name, val) {return /^[a-zA-Z]+/.test(name)}); // starts with a letter
//        var props = atts;
        if (isEdit && !_.size(props)) {
          debugger; // user didn't modify anything?
          self.redirect();
          return;
        }
        
        var onSaveError = function(resource, xhr, options) {
          var err;
          if (resource.status) {
            err = xhr;
            xhr = resource;
            resource = null;
          }
          
          self.getInputs().attr('disabled', false);
          var code = xhr ? xhr.code || xhr.status : 0;
          if (!code || xhr.statusText === 'error') {
            Errors.errDialog({msg: 'There was en error with your request, please try again', delay: 100});
            return;
          }
          
          var json = {};
          try {
            json = JSON.parse(xhr.responseText);
          } catch (err) {
          }
          
          var msg = json.error.details;
          // TODO: undo this hack
          if (msg && msg.startsWith("You don't have enough funds")) {
            Errors.errDialog({msg: "You don't have enough funds on your account, please make a deposit", delay: 100});
            var successUrl = window.location.href; 
            setTimeout(function() {
              var params = {
                toAccount: G.currentUser._uri,
                transactionType: 'Deposit',
                successUrl: successUrl
//                successUrl: G.serverName + '/' + G.pageRoot + '#aspects%2fcommerce%2fTransaction?transactionType=Deposit&$orderBy=dateSubmitted&$asc=0'
              };
              
              window.location.href = G.serverName + '/' + G.pageRoot + '#make/aspects%2fcommerce%2fTransaction?' + $.param(params);
            }, 2000);
            return;
          }
          
          switch (code) {
            case 401:
              Events.trigger('req-login');
//              Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
//              Events.on(401, msg || 'You are not unauthorized to make these changes');
              break;
            case 404:
              debugger;
              Errors.errDialog({msg: msg || 'Item not found', delay: 100});
              break;
            case 409:
              debugger;
              Errors.errDialog({msg: msg || 'The resource you\re attempting to create already exists', delay: 100});
              break;
            default:
              Errors.errDialog({msg: msg || xhr.error && xhr.error.details, delay: 100});
//              debugger;
              break;
          }
        };
        
        res.save(props, {
          sync: !U.canAsync(this.vocModel),
          success: function(resource, response, options) {
            self.getInputs().attr('disabled', false);
            res.lastFetchOrigin = null;
            self.disable('Changes submitted');
            self.redirect();
          }, 
//          skipRefresh: true,
          error: onSaveError
        });
      }.bind(this);
      
      var onError = function(errors) {
        res.off('change', onSuccess, this);
        this.fieldError.apply(this, arguments);
        inputs.attr('disabled', false);
//        alert('There are errors in the form, please review');
      }.bind(this);
//
      switch (action) {
        case 'make':
          url += 'm/' + encodeURIComponent(vocModel.type);
          break;
        case 'edit':
          url += 'e/' + encodeURIComponent(res.getUri());
          break;
      }
      
      atts = U.mapObj(atts, function(att, val) {
        return att.endsWith("_select") ? [att.match(/(.*)_select$/)[1], val.join(',')] : [att, val];
      });
      
      atts = _.extend({}, res.getUnsavedChanges(), atts);
      var errors = res.validate(atts, {validateAll: true, skipRefresh: true});
      if (typeof errors === 'undefined') {
        this.setValues(atts, {skipValidation: true});
        onSuccess();
        self.getInputs().attr('disabled', false);
      }
      else
        onError(errors);
    },
    cancel: function(e) {
      Events.stopEvent(e);
      if (this.action === 'edit') {
        this.resource.clear();
        this.resource.set(this.originalResource);
      }
        
      this.canceled = true;
      Events.trigger('back');
    },
    refresh: function(data, options) {
      if (options && options.skipRefresh)
        return;
      
      var collection, modified;
      if (U.isCollection(data)) {
        collection = data;
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.getUri()))
          return this;
      }
      
      this.render();
    },
    click: function(e) {
      var from = e.target;
      if (from.tagName === 'select') {
        Events.stopEvent(e);
        return;
      }
//      var data = from.dataset;
//      if (data.duration)
//        Events.stopEvent(e) && this.scrollDuration(e);
//      else if (data.date)
//        Events.stopEvent(e) && this.scrollDate(e);
      
      return true;
//      return Events.defaultClickHandler(e);
    },
    onSelected: function(e) {
      var atts = {};
      if (arguments.length > 1) {
        var val = arguments[0];
        var scroller = arguments[1];
        var settings = scroller.settings;
        var name = settings.shortName,
            input = settings.input;
        
        switch (settings.__type) {
          case 'date': {
            var millis = atts[name] = new Date(val).getTime();
            $(input).data('data-date', millis);
            break;
          }
          case 'duration': {
            var secs = atts[name] = scroller.getSeconds();
            $(input).data('data-duration', secs);
            break;
          }
          case 'enum': {
            $(input).data('data-enum', atts[name] = scroller.getEnumValue());
            break;
          }
          default:
            debugger;
        }
      }
      else {
        var t = e.target;
        atts[t.name] = t.value;
      }
//      Events.stopEvent(e);
      this.setValues(atts, {onValidationError: this.fieldError});
    },
    
    setValues: function(key, val, options) {
      var atts;
      if (_.isObject(key)) {
        atts = key;
        options = val;
      } else {
        (atts = {})[key] = val;
      }
      
      if (this.canceled)
        return false;
      
      options = options || {};
      var res = this.resource;
      var onValidated = options.onValidated;      
      var onInvalid = options.onValidationError;
      if (onInvalid)
        res.once('invalid', onInvalid);
      
      var set = res.set(atts, _.extend({
        validate: true,
        skipRefresh: true, 
        userEdit: true
      }, options));
      
      if (set)
        onValidated && onValidated();
      
      return set;
    },
    addProp: function(info) {
      var p = info.name;
      if (!/^[a-zA-Z]/.test(p) || info.displayedProps[p])
        return;
      
      var prop = info.prop;
      if (!prop) {
//        delete json[p];
        return;
      }
      
      if (info.params[p]  &&  prop.containerMember) {
        if (prop.required) {
          var rules = ' data-formEl="true"';
          var longUri = U.getLongUri1(info.params[p]);
          U.addToFrag(info.frag, this.hiddenPropTemplate({value: longUri, shortName: p, id: info.formId, rules: rules }));
        }
        
        return;
      }
      
      if (_.has(info.backlinks, p))
        return;
      if (U.isCloneOf(prop, "Cancellable.cancelled", this.vocModel)) {
        if (window.location.hash.startsWith('#make/')  || prop.avoidDisplayingInEdit)
          return;
      }
      _.extend(prop, {shortName: p});
      var res = this.resource;
      if (!willShow(res, prop, info.userRole))
        return;
      
      info.displayedProps[p] = true;
      var pInfo = U.makeEditProp(this.resource, prop, this.getAtt(p), info.formId);
      if (!info.groupNameDisplayed  &&  info.propertyGroupName) {
        U.addToFrag(info.frag, this.propGroupsDividerTemplate({value: info.propertyGroupName}));
        info.groupNameDisplayed = true;
      }

      U.addToFrag(info.frag, this.editRowTemplate(pInfo));
    },
    getResourceInputValue: function(input) {
      input = input instanceof $ ? input : $(input);
      return input.data('uri');
    },
    setResourceInputValue: function(input, value) {
      input = input instanceof $ ? input : $(input);
      input.data('uri', value);
    },
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
        this.finish();
      }.bind(this));
    },
    renderHelper: function(options) {
      var self = this;
      var args = arguments;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var res = this.resource;
      if (!this.originalResource)
        this.originalResource = res.toJSON();
      
      var type = res.type;
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
      var propGroups = U.getArrayOfPropertiesWith(meta, "propertyGroupList"); // last param specifies to return array
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
      var displayedProps = {};
      
      var reqParams = U.getParamMap(window.location.href);
      var editCols = reqParams['$editCols'];
      var editProps = editCols ? editCols.replace(/\s/g, '').split(',') : null;
        
      if (!editProps) {
        propsForEdit = this.vocModel.propertiesForEdit;
        editProps = propsForEdit  &&  this.action === 'edit' ? propsForEdit.replace(/\s/g, '').split(',') : null;
        if (!editProps  &&  this.action == 'make'  &&  this.vocModel.type.endsWith('WebProperty')) {
          editProps = ['label', 'propertyType'];
        }  
      }
      
      var params = U.filterObj(this.action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]/.test(name)}); // starts with a letter
      var formId = G.nextId();
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var userRole = U.getUserRole();
      var info = {values: json, userRole: userRole, frag: frag, displayedProps: displayedProps, params: params, backlinks: backlinks, formId: formId};
      if (propGroups.length  &&  !editCols) {
        if (propGroups.length > 1  &&  propGroups[0].shortName != 'general') {
          var generalGroup = $.grep(propGroups, function(item, i) {
            return item.shortName == 'general';
          });
          
          if (generalGroup.length) {
            $.each(propGroups, function(i){
              if(propGroups[i]  &&  propGroups[i].shortName === 'general') propGroups.splice(i,1);
            });
            propGroups.unshift(generalGroup[0]);
          }
        }
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (editProps  &&  $.inArray(p, editProps) == -1)
              continue;

            if (meta[p]  &&  (meta[p].readOnly  ||  (this.action != 'make'  &&  meta[p].immutable  &&  this.getAtt(p))))
              continue;
            this.addProp(_.extend(info, {name: p, prop: meta[p], propertyGroupName: pgName, groupNameDisplayed: groupNameDisplayed}));
            groupNameDisplayed = true;
          }
        }
        if (!editProps) {
          var reqd = U.getPropertiesWith(meta, [{name: "required", value: true}, {name: "readOnly", values: [undefined, false]}]);
          var init = this.originalResource; //_.extend({}, this.originalResource); //, res.getUnsavedChanges());
          for (var p in reqd) {
            p = p.trim();
            if (typeof init[p] !== 'undefined')
              continue;
            if (meta[p]  &&  (meta[p].readOnly  ||  (this.action != 'make'  &&  meta[p].immutable  &&  this.getAtt(p))))
              continue;
            
            _.extend(info, {name: p, prop: reqd[p]});
            this.addProp(info);
            displayedProps[p] = true;
          }        
        }
      }
      for (var p in reqParams) {
        if (!meta[p]  || displayedProps[p])
          continue;
        _.extend(info, {name: p, prop: meta[p], val: reqParams[p]});
        
        var h =  '<input data-formel="true" type="hidden" name="' + p + '" value="' + reqParams[p] + '"/>';
        U.addToFrag(info.frag, h);
//        this.addProp(info);
        displayedProps[p] = true;
      }
      if (!propGroups.length || editProps) {
        for (var p in meta) {
          p = p.trim();
          if (displayedProps[p])
            continue;
          if (editProps  &&  $.inArray(p, editProps) == -1)
            continue;
          if (meta[p].readOnly || (this.action != 'make'  &&  meta[p].immutable  &&  this.getAtt(p)))
            continue;
          if (this.action != 'make'  &&  meta[p].immutable  &&  this.getAtt(p))
            continue;
          _.extend(info, {name: p, prop: meta[p]});
          this.addProp(info);
          displayedProps[p] = true;
        }        
      }        
      
      (this.$ul = this.$('#fieldsList')).html(frag);
      if (this.$ul.hasClass('ui-listview')) {
        this.$ul.trigger('create');
        this.$ul.listview('refresh');
      }
      else
        this.$ul.trigger('create');

//        this.$ul.listview('refresh');
      
      var doc = document;
      var form = this.$form = this.$('form');
      var inputs = this.getInputs(); //form.find('input');
      
      var initInputs = function(inputs) {
        _.each(inputs, function(input) {
          if (self.isScroller(input))
            return;
          
          var $in = $(input);
          var $parent = $in.parent();
          var validated = function() {
            $parent.find('label.error').remove();
  //          i.focus();
          };
  
          var setValues = _.debounce(function() {
            self.setValues(this.name, this.value, {onValidated: validated, onValidationError: self.fieldError});
          }, 500);
          
          $in.on('input', function() {
            if ($(this).data('codemirror'))
              return;
            
            setValues.apply(this, arguments);
          });
          
          $in.focusout(setValues);
        });
//        $in.keyup(onFocusout);
      };

      initInputs(inputs);        
      form.find('[required]').each(function() {
        form.find('label[for="{0}"]'.format(this.id)).addClass('req');
      });
      
      form.find('select').change(this.onSelected).each(function() {
        var name = this.name;
        if (_.isUndefined(res.get(name)))
          return;
        
        if (this.value)
          self.setValues(name, this.value);
      });
      
      form.find("input").bind("keydown", function(event) {
        // track enter key
        var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
        if (keycode == 13) { // keycode for enter key
          // force the 'Enter Key' to implicitly click the Submit button
          Events.stopEvent(event);
          var input = event.target;
          var name = input.name;
          var $in = $(input);
          var $parent = $in.parent();
          var validated = function() {
            $parent.find('label.error').remove();
          };
  
          var didSet = self.setValues(name, input.value, {onValidated: validated, onValidationError: self.fieldError});
          if (didSet)
            form.submit();
          
          return false;
        } else  {
          return true;
        }
      }); // end of function
            
      var edits = res.getUnsavedChanges();
      form.find('.resourceProp').each(function() {
        var name = this.name;
        var value = res.get(name);
        if (_.isUndefined(value))
          value = this.value;
        
        this.setResourceInputValue(this, value);
      }.bind(this));
      
//      if (_.size(displayedProps) === 1) {
//        var prop = meta[U.getFirstProperty(displayedProps)];
//        if (Templates.getPropTemplate(prop, true) === 'resourcePET') {
//          this.$('a[name="' + prop.shortName + '"]').trigger('click');
//        }
//      }
      
      if (this.isCode && CodeMirror) {
        this.attachCodeMirror();
      }
      
      return this;
    },
    
    attachCodeMirror: function() {
      this.makeTemplate('resetTemplateBtnTemplate', 'resetTemplate', this.vocModel.type);
      var form = this.$form;
      var view = this;
      var res = this.resource;
      var meta = this.vocModel.properties;
      var isTemplate = this.vocModel.type === G.commonTypes.Jst;
      form.find('textarea[data-code]').each(function() {
        var textarea = this;
        var $textarea = $(this);
        var code = textarea.dataset.code;
        var propName = textarea.name;
        var mode;
        switch (code) {
          case 'html':
            mode = 'text/html';
            break;
          case 'css':
            mode = 'css';
            break;
          default: {
            mode = 'javascript';
            break;
          }
        }
        
        var editor = CodeMirror.fromTextArea(textarea, {
          mode: mode,
          tabMode: 'indent',
          lineNumbers: true,
          viewportMargin: Infinity,
          tabSize: 2
        });
        
        // TODO: fix this so it can save changes as you type, but not lose focus
        editor.on('change', _.debounce(function() {
          var newVal = editor.getValue();
          view.setValues(propName, newVal);
        }, 500));
        
        var prop = meta[propName];
        var defaultText;
        if (isTemplate)
          defaultText = view.getOriginalTemplate(res.get('templateName')) || U.DEFAULT_HTML_PROP_VALUE;
        else
          defaultText = U['DEFAULT_{0}_PROP_VALUE'.format(code.toUpperCase())];
        
        var changeHandler;
        if (defaultText) {
          var reset = $(view.resetTemplate());
          var resetText = reset[0].innerText;
          var didReset = false;
          var prevValue = defaultText;
          var resetHandler = function() {
            didReset = !didReset;
            prevValue = defaultText;
            reset.find('.ui-btn-text').text(resetText);
            editor.off('change', resetHandler);
          };
          
          reset.click(function(e) {
            editor.off('change', resetHandler);
            Events.stopEvent(e);
            var newValue = prevValue;
            prevValue = editor.getValue();
            editor.setValue(newValue);
            didReset = !didReset;
            reset.find('.ui-btn-text').text(didReset ? 'Undo reset' : resetText);
            if (didReset)    
              editor.on('change', resetHandler);
          });
          
          reset.insertAfter($textarea.next());
          reset.button();
          if (defaultText === textarea.value) {
            reset.addClass('ui-disabled');
            changeHandler = function(from, to, text, removed, next) {
              if (!text && to.text && to.text.length) {
                reset.removeClass('ui-disabled')
                editor.off('change', changeHandler);
              }
            };                
          }
        }
        
        changeHandler && editor.on('change', changeHandler);
        setTimeout(function() {
          // sometimes the textarea will have invisible letters, or be of a tiny size until you type in it. This is a preventative measure that seems to work
          editor.refresh.apply(editor);
          editor.scrollIntoView({line: 0, ch: 0});
          $textarea.focus();
        }.bind(textarea), 50);
        
        $.data(textarea, 'codemirror', editor);
      });
    }
  }, {
    displayName: 'EditView'
  });
});
