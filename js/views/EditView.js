define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils',
  'cache!vocManager'
], function(G, $, __jqm__, _, Backbone, Templates, Events, U, Voc) {
  return Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh'); // fixes loss of context for 'this' within methods
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.model.on('change', this.refresh, this);
      this.TAG = 'EditView';
  //    Lablz.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
      'click': 'click'
    },
    refresh: function() {
      var collection, modified;
      if (arguments[0] instanceof Backbone.Collection) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.model.collection || !_.contains(modified, this.model.get('_uri')))
          return this;
      }
      
      if (this.$el.hasClass('ui-listview')) {
        var lis = this.$('li').detach();
        this.render();
        this.$el.trigger('create');
        this.$el.listview('refresh');
      }
      else
        this.$el.listview().listview('refresh');
    },
//    tap: Events.defaultTapHandler,  
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
      if (propGroups) {
        for (var i=0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            var prop = meta[p];
            if (!_.has(json, p) || _.contains(backlinks, prop)) //  || _.contains(gridCols, p))
              continue;
            
            if (!prop) {
              delete json[p];
              continue;
            }
                  
            if (p.charAt(0) == '_')
              continue;
            if (p == 'davDisplayName')
              continue;
            if (prop.displayNameElm)
              continue;
            if (!U.isPropVisible(json, prop) || prop.readOnly)
              continue;
  
            displayedProps[idx++] = p;
            var pHtml = U.makePropEdit(prop, json[p]);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
//            json[p] = json[p].replace(/(<([^>]+)>)/ig, '').trim();
            U.addToFrag(frag, pHtml);
//            if (json[p].name.length + v.length > maxChars)
//              U.addToFrag(frag, this.propRowTemplate2(json[p]));
//            else
//              U.addToFrag(frag, this.propRowTemplate(json[p]));
          }
        }
      }
      
      var otherLi;
      groupNameDisplayed = false;
      for (var p in json) {
        var prop = meta[p];
        if (!_.has(json, p) || (displayedProps  &&  _.contains(displayedProps, p)) ||  _.contains(backlinks, prop))
          continue;
        
        if (!prop) {
          delete json[p];
          continue;
        }
              
        if (p.charAt(0) == '_')
          continue;
        if (p == 'davDisplayName')
          continue;
        if (prop.displayNameElm)
          continue;
        if (!U.isPropVisible(json, prop) || prop.readOnly)
          continue;
  
        if (displayedProps.length  &&  !groupNameDisplayed) {
          otherLi = '<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">';
  //        this.$el.append('<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'); 
          groupNameDisplayed = true;
        }
        
        var pHtml = U.makePropEdit(prop, json[p]);
//        var v = json[p].value.replace(/(<([^>]+)>)/ig, '').trim();
        if (otherLi) {
//          if (json[p].name.length + v.length > maxChars)
//            otherLi += this.propRowTemplate2(json[p]);
//          else
//            otherLi += this.propRowTemplate(json[p]);
          otherLi += pHtml;
        }
        else {
//          if (json[p].name.length + v.length > maxChars)
//            U.addToFrag(frag, this.propRowTemplate2(json[p]));
//          else
//            U.addToFrag(frag, this.propRowTemplate(json[p]));
          U.addToFrag(frag, pHtml);
        }
      }
      
      if (otherLi) {
        otherLi += "</ul></li>";
        U.addToFrag(frag, otherLi);
      }
  //    if (displayedProps.length  &&  groupNameDisplayed)
  //      this.$el.append("</ul></li>");
      
  //    var j = {"props": json};
  //    this.$el.html(html);
      if (!options || options.setHTML)
        this.$el.html(frag);
      var self = this;
  
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'EditView'
  });
});
