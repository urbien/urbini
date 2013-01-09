define([
  'globals',
  'cache!jquery', 
//  'cache!validator', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils',
  'cache!vocManager'
], function(G, $, /*__jqValidate__,*/ __jqm__, _, Backbone, Templates, Events, U, Voc) {
  var willShow = function(p, prop, json, role) {          
    return p.charAt(0) != '_' && p != 'davDisplayName' && U.isPropEditable(json, prop, role);
  };
  
  return Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh', 'submit', 'cancel'); // fixes loss of context for 'this' within methods
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.editRowTemplate = _.template(Templates.get('editRowTemplate'));
      this.model.on('change', this.refresh, this);
      this.TAG = 'EditView';
      return this;
    },
    events: {
      'submit form': 'submit',
      'cancel form': 'cancel',
      'click': 'click'
    },
    submit: function(e) {
      e.preventDefault();
      console.log('form submitted');
      var onSuccess = function() {
//        model.off('change', onSuccess);
        $.ajax({type:'POST', url: 'proppatch', data: form.serialize(), success: function(response) {
          alert(response);
        }});
      };
      
      var form = this.$form;
      var onError = function(model, errors) {
        for (name in errors) {
          var err = form.find('input[name="' + name + '"]');
          var msg = errors[name];
          if (err.length)
            err[0].innerText = msg;
          else {
            var label = doc.createElement('label');
            label.innerHTML = msg;
            label.setAttribute('for', name);
            label.setAttribute('class', 'error');
            input.parentNode.insertBefore(label, input.nextSibling);
          }
        }
        
        alert('There are errors in the form, please review');
      };
//
      var inputs = this.$('input');
      var change = {}, model = this.model;
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.name;
        var val = input.value;
        change[name] = val;
      }

      model.lastFetchOrigin = 'edit';
//      model.on('change', onSuccess, this);
      model.set(change, {validateAll: false, error: onError, validated: onSuccess});
    },
    cancel: function() {
    },
    refresh: function() {
      var collection, modified;
      if (arguments[0] instanceof Backbone.Collection) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.model.collection || !_.contains(modified, this.model.get('_uri')))
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
      var model = this.model;
      var type = model.type;
      var meta = model.constructor.properties;
      if (!meta)
        return this;
      
      var json = model.toJSON();
      var frag = document.createDocumentFragment();
      U.addToFrag(frag, '<input type="hidden" name="uri" value="{0}" />'.format(model.get('_uri')));
  
      var list = _.toArray(meta);
      var propGroups = U.getPropertiesWith(list, "propertyGroupList");
      var backlinks = U.getPropertiesWith(list, "backLink");
      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;
      
      var displayedProps = [];
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var rules = {};
      var role = U.getUserRole();
      var userRole = U.getUserRole();
      if (propGroups) {
        for (var i=0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            var prop = meta[p];
            if (_.contains(backlinks, prop)) //  || _.contains(gridCols, p))
              continue;
            
            if (!prop) {
              delete json[p];
              continue;
            }

            if (!willShow(p, prop, json, userRole))
              continue;
  
            displayedProps[idx++] = p;
            var pHtml = U.makePropEdit(prop, json[p], userRole);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            U.addToFrag(frag, this.editRowTemplate(pHtml));
          }
        }
      }
      
      var otherLi;
      groupNameDisplayed = false;
      for (var p in json) {
        var prop = meta[p];
        if ((displayedProps  &&  _.contains(displayedProps, p)) ||  _.contains(backlinks, prop))
          continue;
        
        if (!prop) {
          delete json[p];
          continue;
        }
              
        if (!willShow(p, prop, json, userRole))
          continue;
  
        if (displayedProps.length  &&  !groupNameDisplayed) {
          otherLi = '<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">';
          groupNameDisplayed = true;
        }
        
        displayedProps[idx++] = p;
        var pHtml = U.makePropEdit(prop, json[p], userRole);
        if (otherLi) {
          otherLi += this.editRowTemplate(pHtml);
        }
        else {
          U.addToFrag(frag, this.editRowTemplate(pHtml));
        }
      }
      
      if (otherLi) {
        otherLi += "</ul></li>";
        U.addToFrag(frag, otherLi);
      }

      if (!options || options.setHTML)
        (this.$ul = this.$('#fieldsList')).html(frag);
      
      var doc = document;
      this.$form = form = this.$('form');
      var inputs = form.find('input');
      for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        var name = input.name;
        var jin = $(input);
        var jparent = jin.parent();
        var onFocusout = function() {
          var self = this;
          var onSuccess = function() {
//            model.off('change', onSuccess);
//            jparent.find('label[generated="true"]').remove();
          };
          
          var onError = function(model, errors) {
            var err = jparent.find('label[generated="true"]');
            var msg = errors[name];
            if (err.length)
              err[0].innerHTML = msg;
            else {
              var label = doc.createElement('label');
              label.innerHTML = msg;
              label.setAttribute('for', name);
              label.setAttribute('generated', 'true');
              label.setAttribute('class', 'error');
              input.parentNode.insertBefore(label, input.nextSibling);
            }
          };
        
          var change = {};
          change[this.name] = this.value === '' ? undefined : this.value;
          model.lastFetchOrigin = 'edit';
//          model.on('change', onSuccess, this);
          model.set(change, {validateAll: false, error: onError, validated: onSuccess});
        };
        
        jin.focusout(onFocusout);
      }
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditView'
  });
});
