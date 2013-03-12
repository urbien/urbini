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
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return !U.isSystemProp(p) && U.isPropEditable(res, prop, role);
  };

  var scrollerTypes = ['date', 'duration']; //, 'enum'];
//  var getScrollerModuleName = function(scrollerType) {
//    switch (scrollerType) {
//    case 'datetime':
//      return 'mobiscroll-datetime';
//    case 'duration':
//      return 'mobiscroll-duration';
//    case 'enum':
//      return 'mobiscroll-enum';
//      return
//    }
//    return 'mobiscroll-' + scrollerType;
//  }
    
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 
                      'resetResource', 'onSelected', 'setValues', 'redirect', 'getInputs', 'getScrollers', 'getValue', 'addProp', 
                      'scrollDate', 'scrollDuration', 'scrollEnum'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propGroupsDividerTemplate = this.makeTemplate('propGroupsDividerTemplate');
      this.editRowTemplate = this.makeTemplate('editRowTemplate');
      this.hiddenPropTemplate = this.makeTemplate('hiddenPET');
      this.resource.on('change', this.refresh, this);
      this.TAG = 'EditView';
      this.action = options && options.action || 'edit';
//      this.backlinkResource = options.backlinkResource;
      
      var meta = this.vocModel.properties;
      var params = U.getQueryParams();
      var init = this.initialParams = U.getQueryParams(params, this.vocModel) || {};
      for (var shortName in init) {
        var prop = meta[shortName];
        if (U.isResourceProp(prop)) {
          var uri = init[shortName];
          var res = C.getResource(uri);
          if (res) {
            init[shortName + '.displayName'] = U.getDisplayName(res);
          }
        }
      }
//      var bl = params.$backLink;
//      if (bl) {
//        this.backLink = bl;
//        init[bl] = params[bl];
//      }
      
      this.resource.set(init, {silent: true});
      this.originalResource = this.resource.toJSON();
      
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
    
    scrollDate: function(e) {
      this.mobiscroll(e, 'date');
    },

    scrollDuration: function(e) {
      this.mobiscroll(e, 'duration');
    },

    scrollEnum: function(e) {
      this.mobiscroll(e, 'enum');
    },

//    /**
//     * up the counter on the backlink
//     */
//    incrementBLCount: function() {
//      var bl = this.backlinkResource,
//          blPropName = this.backLink;
//      
//      if (bl && blPropName) {
//        var blModel = bl.vocModel;
//        if (blModel) {
//          var backlinks = U.getPropertiesWith(blModel.properties, "backLink");
//          for (var blName in backlinks) {
//            var prop = backlinks[blName];
//            if (prop && prop.backLink === blPropName) {
//              var val = bl.get(blName);
//              if (val) {
//                val.count++;
//                bl.set(blName, val);
//              }
//            }
//          }
//        }
//      }
//    },
    
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

        
          settings.__type = scrollerType;
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
        
//        var isIntersection = self.vocModel;
//        if (isIntersection) {
//          
//        }
        
        G.log(this.TAG, 'testing', chosenRes.attributes);
        var props = {};
        var link = e.target;
        if (isMultiValue) {
          var set = '';
          var innerHtml = '';
          for (var i=0; i<checked.length; i++) {
  //          var val = $('label[for="' + checked[i].id + '"]')[0].value;
            var style = checked[i].style;
            if (style  &&  style.display  == 'none')
              continue;
            if (i != 0)
              innerHtml += ', ';
            innerHtml += checked[i].name;
            set += '<input type="checkbox" checked="checked" data-formel="true" name="' + prop + '_select"' + ' value="' + checked[i].value + '"' + ' style="display:none" />';
          }
          link.innerHTML = innerHtml;
          link.parentNode.innerHTML += set;
        }
        else if (!isBuy  &&  chosenRes.isA('Buyable')  &&  this.$el.find('.buyButton')) {
          Events.stopEvent(e);
  //        Events.trigger('buy', this.model);
          var popupTemplate = this.makeTemplate('buyPopupTemplate');
          var $popup = $('#buy_popup');
          var price = chosenRes.get('price');
          var dn = U.getDisplayName(chosenRes);
          var msg = 'Try ' + chosenRes.vocModel.displayName + ': ' + dn + 'for free for 3 days'; // + ' for ' + price.currency + price.value;
          var href = chosenRes.get('_uri');          
          var html = popupTemplate({href: href, msg: msg, displayName: dn, title: 'New ' + chosenRes.vocModel.displayName});
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
        else {
          var uri = chosenRes.getUri();
          props[prop] = uri;
          this.resource.set(props, {skipValidation: true, skipRefresh: true});
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
              if (this.resource.get('_uri') == cUri) {
                var themeSwatch = chosenRes.get('swatch');
                if (themeSwatch  &&  !G.theme.swatch != themeSwatch) 
                  G.theme.swatch = themeSwatch;
              }
            }
          }
        }
        
        this.router.navigate(hash, {trigger: true, replace: true});
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
        
        if (!pr.multiValue) {
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
        var mvList = e.target.innerText;
        mvList = mvList.slice(U.getPropDisplayName(pr).length + 1);
        params['$' + prop] = mvList;
        this.router.navigate(U.makeMobileUrl('chooser', U.getTypeUri(pr.lookupFrom), params), {trigger: true});
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
        var rParams = { forResource: res.get('_uri'), $prop: pr.shortName, $location: res.get('attachmentsUrl'), $title: U.makeHeaderTitle(vocModel.displayName, prName) };
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
    resetResource: function() {
      this.resource.clear({silent: true, skipRefresh: true});
      this.resource.set(this.originalResource, {skipRefresh: true});
    },
    resetForm: function() {
      $('form').clearForm();      
//      this.originalResource = this.resource.toJSON();
    },
    getInput: function(selector) {
      return this.$form.find('input').or('textarea').find(selector);
    },
    getInputs: function() {
//      return this.$form.find('.formElement,.resourceProp');
      return this.$form.find('[data-formEl]');
    },
    getScrollers: function() {
//      return _.uniq(this.$form.find('.i-txt').add(this.$form.find('select')));
      return this.$form.find('.i-txt');
    },
    fieldError: function(resource, errors) {
      if (arguments.length === 1)
        errors = resource;
      
      var badInputs = [];
      var errDiv = this.$form.find('div[name="errors"]');
      errDiv.empty();
      for (name in errors) {
        var msg = errors[name];
        var madeError = false;
        var input = this.$form.find('input[name="{0}"]'.format(name));
        var id;
        if (input.length) {        
          badInputs.push(input);
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
          scrollTop: badInputs[0].offset().top - 10
        }, 1000);
      }
    },
    redirect: function(options) {
      var params = U.getQueryParams();
      if (params.$returnUri) 
        return this.router.navigate(params.$returnUri, {trigger: true, replace: false, forceFetch: true});
      
      if (this.action === 'edit')
        return this.router.navigate(U.makeMobileUrl(this.resource), {trigger: true, replace: true});
        
      var res = this.resource,
          uri = res.getUri(),
          vocModel = this.vocModel,
          webPropType = G.commonTypes.WebProperty,
          self = this;
      
      if (U.isAssignableFrom(vocModel, U.getLongUri1('system/designer/InterfaceImplementor')))
        return this.router.navigate(U.makeMobileUrl('list', webPropType, {domain: uri, '-info': 'Change interface property names and attributes as you will'}), {trigger: true, forceFetch: true});        
      else if (U.isAssignableFrom(vocModel, webPropType)) {
        return this.router.navigate(U.makeMobileUrl('list', webPropType, {domain: uri}), {trigger: true, forceFetch: true});        
//        window.history.back();
//        var cloneOf = res.get('cloneOf');
//        if (cloneOf && cloneOf.count > 0)
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
      if (!redirectTo) 
        redirectTo = U.getContainerProperty(vocModel);
 
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
                  self.router.navigate(U.makeMobileUrl('view', uri), {trigger: true});
                  return;
                }
              }
              else {
                var args = arguments;
                Voc.getModels(range).done(function() {
                  self.redirect.apply(self, args);
                }).fail(function() {
                  self.router.navigate(U.makeMobileUrl('view', uri), {trigger: true});
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
    getValue: function(input) {
      var jInput = $(input);
      var val;
      
      var p = this.vocModel.properties[input.name];
      if (p  &&  p.multiValue)
        val = input.innerHTML;
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
        this.redirect({trigger: true, replace: true, forceFetch: true, removeFromView: true});
        return;
      }
      
      var inputs = this.getInputs();
      inputs.attr('disabled', true);
      var self = this,
          action = this.action, 
          url = G.apiUrl, 
          form = this.$form, 
          vocModel = this.vocModel;
      
      var atts = {};
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.name;
        if (_.isUndefined(name))
          continue;
        
        val = this.getValue(input);
        if (name.indexOf('_select') == -1  ||  !this.vocModel.properties[name.substring(0, name.length - 7)].multiValue)
          atts[name] = val;
        else {
          var v = atts[name];
          if (!v) {
            v = [];
            atts[name] = v;
          }
          v.push(val);
        }
      }
      
      var succeeded = false;
      var onSuccess = function() {
        if (succeeded)
          return;
        
        succeeded = true;
        var props = U.filterObj(action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]+/.test(name)}); // starts with a letter
//        var props = atts;
        if (isEdit && !_.size(props))
          return;
        
        // TODO: use Backbone's res.save(props), or res.save(props, {patch: true})
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
            self.redirect({trigger: true, replace: true, removeFromView: true});
          }, 
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
      
      this.resetResource();
//      this.setValues(atts, {validateAll: false, skipRefresh: true});
      res.lastFetchOrigin = 'edit';
      atts = U.mapObj(atts, function(att, val) {
        return att.endsWith("_select") ? [att.match(/(.*)_select$/)[1], val.join(',')] : [att, val];
      });
      
      atts = _.extend({}, res.attributes, this.initialParams, atts);
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
      window.history.back();
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
      if (e.target.tagName === 'select') {
        Events.stopEvent(e);
        return;
      }
      
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
    setValues: function(atts, options) {
      var res = this.resource;
      res.lastFetchOrigin = 'edit';
      res.set(atts, _.extend({validateAll: false, error: options.onValidationError, validated: options.onValidated, skipRefresh: true}, options));
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
      if (_.has(info.backlinks, p)  ||  U.isCloneOf(prop, "Cancellable.cancelled", this.vocModel))
        return;

      _.extend(prop, {shortName: p});
      var res = this.resource;
      if (!willShow(res, prop, info.userRole))
        return;
      
      info.displayedProps[p] = true;
      var pInfo = U.makeEditProp(this.resource, prop, info.formId);
      if (!info.groupNameDisplayed) {
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
    render: function(options) {
      G.log(this.TAG, "render");
      var self = this;
      var args = arguments;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var res = this.resource;
      var type = res.type;
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
      var propGroups = U.getArrayOfPropertiesWith(meta, "propertyGroupList"); // last param specifies to return array
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
      var displayedProps = {};

      var params = U.filterObj(this.action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]/.test(name)}); // starts with a letter
      var formId = G.nextId();
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var userRole = U.getUserRole();
      var info = {values: json, userRole: userRole, frag: frag, displayedProps: displayedProps, params: params, backlinks: backlinks, formId: formId};
      if (propGroups.length) {
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
            if (meta[p]  &&  (meta[p].readOnly  ||  (this.action != 'make'  &&  meta[p].immutable  &&  json[p])))
              continue;

            this.addProp(_.extend(info, {name: p, prop: meta[p], propertyGroupName: pgName, groupNameDisplayed: groupNameDisplayed}));
            groupNameDisplayed = true;
          }
        }
        
        var reqd = U.getPropertiesWith(meta, [{name: "required", value: true}, {name: "readOnly", values: [undefined, false]}]);
        var init = this.initialParams;
        for (var p in reqd) {
          p = p.trim();
          if (typeof init[p] !== 'undefined')
            continue;
          if (meta[p]  &&  (meta[p].readOnly  ||  (this.action != 'make'  &&  meta[p].immutable  &&  json[p])))
            continue;
          
          _.extend(info, {name: p, prop: reqd[p]});
          this.addProp(info);
        }        
      }
      else {
        for (var p in meta) {
          p = p.trim();
          if (meta[p].readOnly || (this.action != 'make'  &&  meta[p].immutable  &&  json[p]))
            continue;
          if (this.action != 'make'  &&  meta[p].immutable  &&  json[p])
            continue;
          _.extend(info, {name: p, prop: meta[p]});
          this.addProp(info);
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
      var view = this;
      
      var initInputs = function(inputs) {
        for (var i=0; i<inputs.length; i++) {
          var input = inputs[i];
//          var i = input;
          var name = input.name;
          var jin = $(input);
          var jparent = jin.parent();
          var validated = function() {
            jparent.find('label.error').remove();
  //          i.focus();
          };
  
          var onFocusout = function() {
            var atts = {};
            atts[this.name] = this.value;
            self.setValues(atts, {onValidated: validated, onValidationError: self.fieldError});
          };
          
          jin.focusout(onFocusout);
        }
//        jin.keyup(onFocusout);
      };

      initInputs(inputs);        
      form.find('[required]').each(function() {
        $(this).prev('label').addClass('req');
      });
      
      form.find('select').change(this.onSelected);
      form.find("input").bind("keydown", function(event) {
        // track enter key
        var keycode = (event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode));
        if (keycode == 13) { // keycode for enter key
          // force the 'Enter Key' to implicitly click the Submit button
          Events.stopEvent(event);
          form.submit();
          return false;
        } else  {
          return true;
        }
      }); // end of function
      
      form.find('.resourceProp').each(function() {
        var val = self.originalResource[this.name];
        if (val)
          self.setResourceInputValue(this, val);
      });
      
//      if (_.size(displayedProps) === 1) {
//        var prop = meta[U.getFirstProperty(displayedProps)];
//        if (Templates.getPropTemplate(prop, true) === 'resourcePET') {
//          this.$('a[name="' + prop.shortName + '"]').trigger('click');
//        }
//      }
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditView'
  });
});
