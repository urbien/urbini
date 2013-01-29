define([
  'globals',
  'cache!jquery', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!error', 
  'cache!utils',
  'cache!vocManager',
  'cache!resourceManager',
  'cache!views/BasicView'
//  ,
//  'cache!mobiscroll',
//  'cache!mobiscroll-duration'
], function(G, $, _, Backbone, Templates, Events, Errors, U, Voc, RM, BasicView) {
  var scrollDfd;
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return p.charAt(0) != '_' && p != 'davDisplayName' && U.isPropEditable(res, prop, role);
  };
    
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 'resetResource', 'onSelected', 'setValues', 'redirect', 'getInputs', 'getValue'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.editRowTemplate = _.template(Templates.get('editRowTemplate'));
      this.resource.on('change', this.refresh, this);
      this.TAG = 'EditView';
      this.action = options && options.action || 'edit';
      this.backlinkModel = options.backlinkModel;
      
      var params = U.getQueryParams();
      var initial = U.getQueryParams(params, this.vocModel) || {};
      if (params.backLink && params.on)
        initial[params.backLink] = params.on;      
      this.resource.set(initial, {silent: true});
      this.originalResource = this.resource.toJSON();
      
      return this;
    },
    events: {
      'click .cancel': 'cancel',
      'submit form': 'submit',
      'click .resourceProp': 'chooser',
      'click': 'click',
      'click input[data-datetime]': 'mobiscroll'
    },
    mobiscroll: function(e) {
      if ($.mobiscroll)
        return true;
      
      var thisName = e.target.name;
      var meta = this.vocModel.properties;
      $(e.target).blur(); // hack to suppress keyboard that would open on this input field
      Events.stopEvent(e);
      require(['cache!mobiscroll', 'cache!mobiscroll-duration'], function() {
        // mobiscrollers
        var today = new Date();
        var thisScroller;
        form.find('.i-txt').each(function() {
          var name = this.name;
          var prop = meta[name];
          var isDate = U.isDateProp(prop);
          var isTime = U.isTimeProp(prop);
          var settings = {
            theme: 'jqm',
            display: 'modal',
            mode:'scroller',
            label: U.getPropDisplayName(prop),
            shortName: name,
            onSelect: self.onSelected,
            input: this
//              parseValue: U.toDateParts
//              ,
//              formatResult: function(d) {
//                if (_.isUndefined(d[0]))
//                  return today;
//                else
//                  return new Date(d[2], d[0], d[1]);
//              }
          };
          
          if (isDate) 
            settings.isDate = true;
          else if (isTime)
            settings.isTime = true;
          
          var scroller = $(this).mobiscroll()[isDate ? 'date' : 'duration'](settings);
//          var scroller = $(this).mobiscroll()['duration'](settings);
          var val = this.value && parseInt(this.value);
          if (typeof val === 'number')
            scroller.mobiscroll(isDate ? 'setDate' : 'setSeconds', isDate ? new Date(val) : val, true);
          
          if (name === thisName)
            scroller.click().focus();
        });
//        $(e.target).trigger('click');        
      });
    },
    chooser: function(e) {
      Events.stopEvent(e);
      var el = e.target;
      var prop = e.target.name;
//      if (!prop)
//        return;
      
      var self = this;
      var hash = window.location.href;
      hash = hash.slice(hash.indexOf('#') + 1);
      function onChoose(options) {
        var res;
        var checked;
        var isMultiValue = options.model; 
        if (isMultiValue) {
          res =  options.model;
          checked = options.checked;
        }
        else
          res = options;
        G.log(self.TAG, 'testing', res.attributes);
        var props = {};
        var link = e.target;
        if (isMultiValue) {
          var set = '';
          var innerHtml = '';
          for (var i=0; i<checked.length; i++) {
//            var val = $('label[for="' + checked[i].id + '"]')[0].value;
            var style = checked[i].style;
            if (style  &&  style.display  == 'none')
              continue;
            if (i != 0)
              innerHtml += ', ';
            innerHtml += checked[i].name;
            set += '<input type="checkbox" checked="true" data-formel="true" name="' + prop + '_select"' + ' value="' + checked[i].value + '"' + ' style="display:none" />';
          }
          link.innerHTML = innerHtml;
          link.parentNode.innerHTML += set;
        }
        else {
          props[prop] = res.getUri();
          self.resource.set(props, {skipValidation: true, skipRefresh: true});
          link.innerHTML = res.get('davDisplayName');
          $(link).data('uri', res.getUri());
        }
        self.router.navigate(hash, {trigger:true, replace: true});
//        G.Router.changePage(self.parentView);
        // set text
      }
      
      var pr = this.vocModel.myProperties[prop]  ||  this.vocModel.properties[prop];
      if (pr.multiValue) {
        Events.once('chooser', onChoose, this);
        this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.lookupFrom)) + "?$multiValue=y", {trigger: true});
      }
      else { 
        Events.once('chooser', onChoose, this);
        this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(pr.range)), {trigger: true});
      }
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
    redirect: function(res, options) {
      var vocModel = this.vocModel;
      var redirectAction = vocModel.onCreateRedirectToAction || 'SOURCE';
      var redirectTo = vocModel.onCreateRedirectTo;
      // check if we came here by backlink
      if (!redirectTo) 
        redirectTo = U.getContainerProperty(vocModel);
 
      var redirectParams = {};      
      var redirectRoute = '';
      var redirectPath = '';
      switch (redirectAction) {
        case 'LIST':
          if (redirectTo) { 
            var dotIdx = redirectTo.indexOf('.');
            if (dotIdx != -1) {
              var pName = redirectTo.slice(0, dotIdx);
              var prop = vocModel.properties[pName];
              var range = U.getLongUri(prop.range);
              range = range && Voc.typeToModel[range];
              if (range) {
                redirectParams[pName] = res.get(pName);
                var bl = redirectTo.slice(dotIdx + 1);
                var blProp = range.properties[bl];
                if (blProp)
                  redirectPath = blProp.range;
                else
                  G.log(this.TAG, 'error', 'couldn\'t get model for range', prop.range);
              }
              else
                G.log(this.TAG, 'error', 'couldn\'t get model for range', prop.range);
            }
            
            redirectPath = redirectPath || vocModel.properties[redirectTo].type._uri;
          }
          else  
            redirectPath = vocModel.type;
          
          redirectPath = encodeURIComponent(redirectPath);
          options.forceRefresh = true;
          break;
        case 'PROPFIND':
        case 'PROPPATCH':
          redirectPath = redirectAction === 'PROPFIND' ? 'view/' : 'edit/';
          if (!redirectTo || redirectTo === '-$this') {
            redirectPath = encodeURIComponent(res.getUri());
          }
          else {
            var prop = vocModel.properties[redirectTo];
            if (prop.backLink) {
              redirectPath = encodeURIComponent(res.getUri());
//              redirectPath = 'make/'; //TODO: make this work for uploading images
            }
            else {
              var target = res.get(redirectTo);
              target = target.value || target;
              redirectPath = encodeURIComponent(target);
            }
          }
          
          redirectRoute = 'view/';
          break;
        case 'SOURCE':
          redirectPath = this.source;
          if (_.isUndefined(redirectPath)) {
            redirectPath = encodeURIComponent(this.resource.getUri());
            redirectRoute = 'view/';
          }
          options.forceRefresh = true;
          break;
        default:
          G.log(this.TAG, 'error', 'unsupported onCreateRedirectToAction', redirectAction);
          redirectPath = encodeURIComponent(vocModel.type);
          options.forceRefresh = true;
          break;
      }
      
      var redirectMsg = vocModel.onCreateRedirectToMessage;
      if (redirectMsg)
        redirectParams['-info='] = redirectMsg;
      
      var redirect = redirectRoute + redirectPath + (_.size(redirectParams) ? '?' + $.param(redirectParams) : '');
      this.router.navigate(redirect, options);
    },
    getValue: function(input) {
      var jInput = $(input);
      var val;
      
      var p = this.vocModel.properties[input.name];
      if (p  &&  p.multiValue)
        val = input.innerHTML;
      else
        val = input.tagName === 'A' ? jInput.data('uri') : input.value;
      if (_.contains(input.classList, 'boolean'))
        return val === 'Yes' ? true : false;
      else {
        var date = jInput.data('data-datetime');
        if (date)
          return date;
        else
          return val;
      }
    },
    submit: function(e) {
      Events.stopEvent(e);
      var isEdit = (this.action === 'edit');
      var res = this.resource; 
      if (!isEdit && res.getUri()) {
        this.redirect(res, {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
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
          self.getInputs().attr('disabled', false);
          var code = xhr.code || xhr.status;
          if (xhr.statusText === 'error' || code === 0) {            
            Errors.errDialog({msg: 'There was en error with your request, please try again', delay: 100});
            return;
          }
          
          var json = {};
          try {
            json = JSON.parse(xhr.responseText);
          } catch (err) {
          }
          
          var msg = json.error.details;
          switch (code) {
            case 401:
              Errors.errDialog({msg: msg || 'You are not authorized to make these changes', delay: 100});
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
          success: function(resource, response, options) {
            if (response.error) {
              onSaveError(resource, response, options);
              return;
            }
            
            $('.formElement').attr('disabled', false);
            self.redirect(res, {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
          },
          
          error: onSaveError
        });
        
//        _.extend(props, baseParams);
//        _.extend(props, {type: vocModel.type, uri: res.getUri()});
//        var callback = function(xhr, status) {
//          inputs.attr('disabled', false);
//          if (status !== 'success') {
//            alert('There was an error with your request, please resubmit');
//            return;
//          }
//          
//          switch (xhr.status) {
//          case 304:
//            alert('No changes made');
//            $('input').attr('disabled', false);
//            break;
//          case 200:
//            var json;
//            try {
//              json = JSON.parse(xhr.responseText);
//              if (json.error) {
////                self.resetResource();
//                switch (json.error.code) {
//                case 401:
//                  Errors.errDialog({msg: 'You are not authorized to make these changes', delay: 100});
//                  break;
////                case 409:
////                  break;
//                default:
//                  Errors.errDialog({msg: json.error.details, delay: 100});
//                  break;
//                }
//                
//                G.log(self.TAG, 'error', JSON.stringify(json));
//                return;
//              }
//              else {
//                res.set(json, {skipRefresh: true});
//              }
//            } catch (err) {
//            }
//            
//            Events.trigger('refresh', res, res.getUri());
//            setTimeout(function() {RM.addItem(res)}, 100);
//            break;
////          case 404:
////            alert('The item you\'re editing doesn\'t exist');
//          }
//
//          self.router.navigate(self.getRedirect(res), {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
//        }
//        
//        $.ajax({type:'POST', url: url, data: $.param(props), complete: callback});
      };
      
      var onError = function(errors) {
        res.off('change', onSuccess, self);
        self.fieldError.apply(self, arguments);
        inputs.attr('disabled', false);
//        alert('There are errors in the form, please review');
      };
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
      var errors = res.validate(atts, {validateAll: true, skipRefresh: true});
      if (typeof errors === 'undefined') {
        this.setValues(atts, {skipValidation: true});
        onSuccess();
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
      if (data instanceof Backbone.Collection) {
        collection = data;
        modified = arguments[1];
        if (collection != this.resource.collection || !_.contains(modified, this.resource.getUri()))
          return this;
      }
      
      if (this.$el.hasClass('ui-listview'))
        this.$el.listview('refresh');
      else
        this.$el.trigger('create');

//      if (this.$ul.hasClass('ui-listview')) {
//        var lis = this.$('li').detach();
//        this.render();
//        this.$ul.trigger('create');
//        this.$ul.listview('refresh');
//      }
//      else
//      this.$ul.listview().listview('refresh');
    },
    click: function(e) {
      if (e.target.tagName === 'select') {
        Events.stopEvent(e);
        return;
      }
      
      return Events.defaultClickHandler(e);
    },
    onSelected: function(e) {
      var atts = {};
      if (arguments.length > 1) {
        var val = arguments[0];
        var scroller = arguments[1];
        var settings = scroller.settings;
        var name = settings.shortName,
            input = settings.input;
        if (settings.isDate) {
          var millis = atts[name] = new Date(val).getTime();
          $(input).data('data-datetime', millis);
        }
        else if (settings.isTime) {
          var secs = atts[name] = scroller.getSeconds();
          $(input).data('data-datetime', secs);
        }
        else
          debugger;
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
    render: function(options) {
      var self = this;
      var args = arguments;
      if (scrollDfd && !scrollDfd.isResolved()) {
        scrollDfd.done(function() {self.render.apply(self, args)});
        return;
      }
      
      G.log(this.TAG, "render");
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var res = this.resource;
      var type = res.type;
      var json = res.attributes;
      var frag = document.createDocumentFragment();
      var propGroups = U.getPropertiesWith(meta, "propertyGroupList", true); // last param specifies to return array
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
      var displayedProps = {};

      var params = U.filterObj(this.action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]/.test(name)}); // starts with a letter

      var formId = G.nextId();
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var rules = {};
      var userRole = U.getUserRole();
      if (propGroups.length) {
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p) || _.has(backlinks, p)) //  || _.contains(gridCols, p))
              continue;
            
            var prop = meta[p];
            if (params[p]  &&  prop.containerMember)
              continue;
            if (!prop) {
//              delete json[p];
              continue;
            }

            _.extend(prop, {shortName: p});
            if (!willShow(res, prop, userRole))
              continue;
  
            displayedProps[p] = true;
            var pInfo = U.makeEditProp(prop, json[p], formId, Voc);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            U.addToFrag(frag, this.editRowTemplate(pInfo));
          }
        }
      }
      else {
        for (var p in meta) {
          if (!/^[a-zA-Z]/.test(p))
            continue;
          
          var prop = meta[p];
          if (params[p]  &&  prop.containerMember)
            continue;
          if (_.has(backlinks, p)  ||  U.isCloneOf(prop, "Cancellable.cancelled"))
            continue;
          
          _.extend(prop, {shortName: p});
          if (!prop) {
//            delete json[p];
            continue;
          }

          if (!willShow(res, prop, userRole))
            continue;
          
          displayedProps[p] = true;
          var pInfo = U.makeEditProp(prop, json[p], formId, Voc);
          if (!groupNameDisplayed) {
            U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
            groupNameDisplayed = true;
          }
  
          U.addToFrag(frag, this.editRowTemplate(pInfo));
        }
      }        
        
      (this.$ul = this.$('#fieldsList')).html(frag);
      this.$ul.trigger('create');
//        this.$ul.listview('refresh');
      
      var doc = document;
      this.$form = form = this.$('form');
      var inputs = this.getInputs(); //form.find('input');
      var view = this;
      
      var initInputs = function(inputs) {
        for (var i=0; i<inputs.length; i++) {
          var i = inputs[i];
//          var i = input;
          var name = i.name;
          var jin = $(i);
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
//      inputs.each(function(idx, input) {
////        var input = inputs[i];
//        var i = input;
//        var name = i.name;
//        var jin = $(i);
//        var jparent = jin.parent();
//        var validated = function() {
//          jparent.find('label.error').remove();
////          i.focus();
//        };
//
//        var onFocusout = function() {
//          self.setValue(this.name, this.value, validated, self.fieldError);          
//        };
//        
//        jin.focusout(onFocusout);
////        jin.keyup(onFocusout);
//      });
//      
//      texts.each(function(idx, textarea) {
//  //      var input = inputs[i];
//        var i = textarea;
//        var name = i.name;
//        var jin = $(i);
//        var jparent = jin.parent();
//        var validated = function() {
//          jparent.find('label.error').remove();
//  //        i.focus();
//        };
//  
//        var onFocusout = function() {
//          self.setValue(this.name, this.value, validated, self.fieldError);          
//        };
//        
//        jin.focusout(onFocusout);
//  //      jin.keyup(onFocusout);
//      });
        
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
