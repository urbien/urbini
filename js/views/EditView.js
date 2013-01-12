define([
  'globals',
  'cache!jquery', 
//  'cache!validator', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!error', 
  'cache!utils',
  'cache!vocManager',
  'cache!resourceManager',
  'cache!views/BasicView'
], function(G, $, /*__jqValidate__,*/ __jqm__, _, Backbone, Templates, Events, Error, U, Voc, RM, BasicView) {
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return p.charAt(0) != '_' && p != 'davDisplayName' && U.isPropEditable(res, prop, role);
  };
    
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel', 'fieldError', 'set', 'resetForm', 'resetResource'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.editRowTemplate = _.template(Templates.get('editRowTemplate'));
      this.resource.on('change', this.refresh, this);
      this.router = G.Router || Backbone.History;
      this.TAG = 'EditView';
      this.action = options && options.action || 'edit';
      
      var params = U.getQueryParams();
      var bl = {};
      bl[params.backLink] = params.on;
      this.resource.set(bl, {silent: true});
      this.originalResource = this.resource.toJSON();

      return this;
    },
    events: {
      'submit form': 'submit',
//      'click#cancel': 'cancel',
      'click': 'click'
    },
    set: function(params) {
      _.extend(this, params);
    },
    resetResource: function() {
      this.resource.set(this.originalResource, {skipRefresh: true});      
    },
    resetForm: function() {
      $('form').clearForm();      
      this.originalResource = this.resource.toJSON();
    },
    fieldError: function(resource, errors) {
      var badInputs = [];
      for (name in errors) {
        var input = this.$form.find('input[name="{0}"]'.format(name));
        badInputs.push(input);
        var id = input[0].id;
        var err = this.$form.find('label.error[for="{0}"]'.format(id));
        var msg = errors[name];
        if (err.length) {
          err[0].innerText = msg;
        }
        else {
          var label = document.createElement('label');
          label.innerHTML = msg;
          label.setAttribute('for', id);
          label.setAttribute('class', 'error');
          input[0].parentNode.insertBefore(label, input.nextSibling);
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
      var redirectPath = '';
      switch (redirectAction) {
        case 'LIST':
          if (redirectTo)
            redirect = vocModel.properties[redirectTo].type._uri; 
          else 
            redirect = vocModel.type;
          
          break;
        case 'PROPFIND':
        case 'PROPPATCH':
          redirectPath = redirectAction === 'PROPFIND' ? 'view/' : 'edit/';
          if (!redirectTo || redirectTo === '-$this')
            redirect = res.get('_uri');
          else
            redirect = res.get(redirectTo);
          
          break;
        default:
          G.log(self.TAG, 'error', 'unsupported onCreateRedirectToAction', redirectAction);
          redirect = vocModel.type;
          break;
      }
      
      redirect = redirectPath + encodeURIComponent(redirect);            
      var redirectMsg = vocModel.onCreateRedirectToMessage;
      if (redirectMsg)
        redirect += '?-info=' + encodeURIComponent(redirectMsg);
      
      return redirect;
    },
    submit: function(e) {
      e.preventDefault();
      if (e.originalEvent.explicitOriginalTarget.id === 'cancel') 
        return this.cancel.apply(this, arguments);
      
      var inputs = this.$form.find('input');;
      inputs.attr('disabled', true);
      var self = this,
          action = this.action, 
          url = G.apiUrl, 
          form = this.$form, 
          res = this.resource, 
          vocModel = this.vocModel,
          baseParams = {'$returnMade': 'y'};
      
      var onSuccess = function() {
        var props = U.filterObj(action === 'make' ? res.attributes : res.changed, function(name, val) {return /^[a-zA-Z]/.test(name)}); // starts with a letter
        if (this.action === 'edit' && !_.size(props))
          return;
        
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
                self.resetResource();
                switch (json.error.code) {
                case 401:
                  Error.errDialog({msg: 'You are not authorized to make these changes', delay: 100});
                  break;
                default:
                  Error.errDialog({msg: json.error.details, delay: 100});
                  break;
                }
                
                G.log(self.TAG, 'error', JSON.stringify(json));
                return;
              }
              else {
                res.set(json);
              }
            } catch (err) {
            }
            
            Events.trigger('refresh', res, res.get('_uri'));
            setTimeout(function() {RM.addItem(res)}, 100);
            break;
//          case 404:
//            alert('The item you\'re editing doesn\'t exist');
          }

          self.router.navigate(self.getRedirect(res), {trigger: true, replace: true, forceRefresh: true});
        }
        
        $.ajax({type:'POST', url: url, data: $.param(props), complete: callback});
      };
      
      var onError = function(res, errors) {
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
      
//      var inputs = this.$('input');
      var props = {};
      for (var i = 0; i < inputs.length; i++) { // skip first (uri)
        var input = inputs[i];
        var name = input.name;
        var val = input.value || undefined;
        props[name] = val;
      }

      if (!_.size(props))
        onSuccess();
      else {
        res.lastFetchOrigin = 'edit';
        res.once('change', onSuccess, this);
        res.set(props, {validateAll: true, error: onError});
      }
    },
    cancel: function(e) {
      e.preventDefault();
      window.history.back();
//      this.router.navigate(window.location.hash.replace('#edit/', 'view/'), {trigger: true, replace: false});
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
    render: function(options) {
      G.log(this.TAG, "render");
      var res = this.resource;
      var type = res.type;
      var meta = this.vocModel.properties;
      if (!meta)
        return this;
      
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
      var propGroups = U.getPropertiesWith(meta, "propertyGroupList", true); // last param specifies to return array
      propGroups = propGroups.sort(function(a, b) {return a.index < b.index});
      var backlinks = U.getPropertiesWith(meta, "backLink");
      
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
  
            var pInfo = U.makeEditProp(prop, json[p], formId);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            U.addToFrag(frag, this.eRowTemplate(json[p]));
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
          var self = this;                  
          var val = this.value;
          var change = {};
          change[this.name] = val;
          res.lastFetchOrigin = 'edit';
          res.set(change, {validateAll: false, error: view.fieldError, validated: validated});
        };
        
        jin.focusout(onFocusout);
//        jin.keyup(onFocusout);
      });
      
      form.find('input.required').each(function() {
        $(this).prev('label').addClass('req');
      });
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditView'
  });
});
