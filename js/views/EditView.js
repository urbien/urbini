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
], function(G, $, _, Backbone, Templates, Events, Errors, U, Voc, RM, BasicView) {
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return p.charAt(0) != '_' && p != 'davDisplayName' && U.isPropEditable(res, prop, role);
  };
    
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 'resetResource', 'onSelected', 'setValue', 'getRedirect'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.editRowTemplate = _.template(Templates.get('editRowTemplate'));
      this.resource.on('change', this.refresh, this);
      this.TAG = 'EditView';
      this.action = options && options.action || 'edit';
      this.parentView = options && options.parentView;
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
      'click': 'click'
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
      function onChoose(res) {
        G.log(self.TAG, 'testing', res.toJSON());
        var props = {};
        props[prop] = res.get('_uri');
        self.resource.set(props, {skipValidation: true, skipRefresh: true});
        e.target.innerHTML = res.get('davDisplayName');
        G.Router.navigate(hash, {trigger:true, replace: true});
//        G.Router.changePage(self.parentView);
        // set text
      }
      
      Events.once('chooser', onChoose, this);
      this.router.navigate('chooser/' + encodeURIComponent(U.getTypeUri(this.vocModel.properties[prop].range)), {trigger: true});
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
      this.originalResource = this.resource.toJSON();
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
    getRedirect: function() {
      var res = this.model;
      var vocModel = this.vocModel;
      var redirectAction = vocModel.onCreateRedirectToAction || 'PROPFIND';
      var redirectTo = vocModel.onCreateRedirectTo;
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
                redirectParams[pName] = res.get(pName).value;
                var bl = redirectTo.slice(dotIdx + 1);
                var blProp = range.properties[bl];
                if (blProp)
                  redirectPath = blProp.range;
                else
                  G.log(self.TAG, 'error', 'couldn\'t get model for range', prop.range);
              }
              else
                G.log(self.TAG, 'error', 'couldn\'t get model for range', prop.range);
            }
            
            redirectPath = redirectPath || vocModel.properties[redirectTo].type._uri;
          }
          else 
            redirectPath = vocModel.type;
          
          redirectPath = encodeURIComponent(redirectPath);
          break;
        case 'PROPFIND':
        case 'PROPPATCH':
          redirectPath = redirectAction === 'PROPFIND' ? 'view/' : 'edit/';
          if (!redirectTo || redirectTo === '-$this') {
            redirectPath = encodeURIComponent(res.get('_uri'));
          }
          else {
            var prop = vocModel.properties[redirectTo];
            if (prop.backLink) {
              redirectPath = encodeURIComponent(res.get('_uri'));
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
        default:
          G.log(self.TAG, 'error', 'unsupported onCreateRedirectToAction', redirectAction);
          redirectPath = encodeURIComponent(vocModel.type);
          break;
      }
      
      var redirectMsg = vocModel.onCreateRedirectToMessage;
      if (redirectMsg)
        redirectParams['-info='] = redirectMsg;
      
      return redirectRoute + redirectPath + (_.size(redirectParams) ? '?' + $.param(redirectParams) : '');
    },
    submit: function(e) {
      Events.stopEvent(e);
      var res = this.resource; 
      if (res.getUri()) {
        this.router.navigate(this.getRedirect(res), {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
        return;
      }
      
      var inputs = this.$form.find('input');;
      inputs.attr('disabled', true);
      var self = this,
          action = this.action, 
          url = G.apiUrl, 
          form = this.$form, 
          vocModel = this.vocModel,
          baseParams = {'$returnMade': 'y'};
      
      var succeeded = false;
      var onSuccess = function() {
        if (succeeded)
          return;
        
        succeeded = true;
        var props = U.filterObj(action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]/.test(name)}); // starts with a letter
        if (this.action === 'edit' && !_.size(props))
          return;
        
        // TODO: use Backbone's res.save(props), or res.save(props, {patch: true})
        
        _.extend(props, baseParams);
//        _.extend(props, {type: vocModel.type, uri: res.get('_uri')});
        var callback = function(xhr, status) {
          inputs.attr('disabled', false);
          if (status !== 'success') {
            alert('There was an error with your request, please resubmit');
            return;
          }
          
          switch (xhr.status) {
          case 304:
            alert('No changes made');
            $('input').attr('disabled', false);
            break;
          case 200:
            var json;
            try {
              json = JSON.parse(xhr.responseText);
              if (json.error) {
//                self.resetResource();
                switch (json.error.code) {
                case 401:
                  Errors.errDialog({msg: 'You are not authorized to make these changes', delay: 100});
                  break;
//                case 409:
//                  break;
                default:
                  Errors.errDialog({msg: json.error.details, delay: 100});
                  break;
                }
                
                G.log(self.TAG, 'error', JSON.stringify(json));
                return;
              }
              else {
                res.set(json, {skipRefresh: true});
              }
            } catch (err) {
            }
            
            Events.trigger('refresh', res, res.get('_uri'));
            setTimeout(function() {RM.addItem(res)}, 100);
            break;
//          case 404:
//            alert('The item you\'re editing doesn\'t exist');
          }

          self.router.navigate(self.getRedirect(res), {trigger: true, replace: true, forceRefresh: true, removeFromView: true});
        }
        
        $.ajax({type:'POST', url: url, data: $.param(props), complete: callback});
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
          url += 'e/' + encodeURIComponent(res.get('_uri'));
          break;
      }
      
      res.lastFetchOrigin = 'edit';
      var errors = res.validate(res.attributes, {validateAll: true, skipRefresh: true});
      if (typeof errors === 'undefined')
        onSuccess();
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
        if (collection != this.resource.collection || !_.contains(modified, this.resource.get('_uri')))
          return this;
      }
      
      if (this.$ul.hasClass('ui-listview')) {
        var lis = this.$('li').detach();
        this.render();
        this.$ul.trigger('create');
        this.$ul.listview('refresh');
      }
      else
        this.$ul.listview().listview('refresh');
    },
    click: Events.defaultClickHandler,
    onSelected: function(e) {
      this.setValue(e.target.name, e.target.value, null, this.fieldError);
    },
    setValue: function(name, val, onValidated, onValidationError) {
      var change = {}, res = this.resource;
      change[name] = val;
      res.lastFetchOrigin = 'edit';
      res.set(change, {validateAll: false, error: onValidationError, validated: onValidated, skipRefresh: true});
    },
    render: function(options) {
      G.log(this.TAG, "render");
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var res = this.resource;
      var type = res.type;
      var self = this;
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
      var propGroups = U.getPropertiesWith(meta, "propertyGroupList", true); // last param specifies to return array
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
      var displayedProps = {};
      
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
            if (!prop) {
              delete json[p];
              continue;
            }

            _.extend(prop, {shortName: p});
            if (!willShow(res, prop, userRole))
              continue;
  
            displayedProps[p] = true;
            var pInfo = U.makeEditProp(prop, json[p], formId);
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
          if (_.has(backlinks, p))
            continue;
          
          _.extend(prop, {shortName: p});
          if (!prop) {
            delete json[p];
            continue;
          }

          if (!willShow(res, prop, userRole))
            continue;
          
          displayedProps[p] = true;
          var pInfo = U.makeEditProp(prop, json[p], formId);
          if (!groupNameDisplayed) {
            U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
            groupNameDisplayed = true;
          }
  
          U.addToFrag(frag, this.editRowTemplate(pInfo));
        }
      }        
        
      if (!options || options.setHTML)
        (this.$ul = this.$('#fieldsList')).html(frag);
      
      var doc = document;
      this.$form = form = this.$('form');
      var inputs = form.find('input');
      var view = this;
      inputs.each(function(idx, input) {
//        var input = inputs[i];
        var i = input;
        var name = i.name;
        var jin = $(i);
        var jparent = jin.parent();
        var validated = function() {
          jparent.find('label.error').remove();
//          i.focus();
        };

        var onFocusout = function() {
          self.setValue(this.name, this.value, validated, self.fieldError);          
        };
        
        jin.focusout(onFocusout);
//        jin.keyup(onFocusout);
      });
      
      form.find('input.required').each(function() {
        $(this).prev('label').addClass('req');
      });
      
      form.find('select').change(this.onSelected);
      
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
