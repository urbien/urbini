define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils'
], function(G, $, __jqm__, _, Backbone, Templates, Events, U) {
  return Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'tap', 'click', 'refresh'); // fixes loss of context for 'this' within methods
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.cpTemplate = _.template(Templates.get('cpTemplate'));
      this.cpTemplateNoValue = _.template(Templates.get('cpTemplateNoValue'));
      this.model.on('change', this.refresh, this);
  //    Globals.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
      'click': 'click',
      'tap': 'tap',
    },
    refresh: function() {
      var collection, modified;
      if (arguments[0] instanceof Backbone.Collection) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != this.model.collection || !_.contains(modified, this.model.get('_uri')))
          return this;
      }
      
      this.$el.trigger('create');
    },
    tap: Events.defaultTapHandler,  
    click: Events.defaultClickHandler,
    render: function(options) {
      console.log("render CP");
      var type = this.model.type;
      var meta = this.model.__proto__.constructor.properties;
      meta = meta || this.model.properties;
      if (!meta)
        return this;
      
      var json = this.model.toJSON();
      var frag = document.createDocumentFragment();
  
      var list = _.toArray(meta);
      var propGroups = U.getPropertiesWith(list, "propertyGroupList");
      var backlinks = U.getPropertiesWith(list, "backLink");
      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;
      
      var displayedProps = [];
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      var first;
      if (propGroups) {
        for (var i=0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = grMeta["displayName"];
          var props = grMeta["propertyGroupList"].split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            var prop = meta[p];
            if ((displayedProps  &&  _.contains(displayedProps, p)) || 
                !_.contains(backlinks, prop))
              continue;

            if (!prop  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
              delete json[p];
              continue;
            }
                  
            if (!U.isPropVisible(json, prop))
              continue;
  
            displayedProps[idx++] = p;
//            json[p] = U.makeProp(prop, json[p]);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
            var n = meta[p].displayName;
            if (!_.has(json, p)) 
              U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
            else {
              var v = json[p].value;
              var cnt = json[p].count;
              if (typeof cnt == 'undefined'  ||  !cnt)
                U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
              else
                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
            }
          }
        }
      }
      
      groupNameDisplayed = false;
      for (var p in json) {
        var prop = meta[p];
        if ((displayedProps  &&  _.contains(displayedProps, p)) || 
            !_.contains(backlinks, prop))
          continue;

        if (!prop  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
          delete json[p];
          continue;
        }
              
        if (!U.isPropVisible(json, prop))
          continue;
  
//        json[p] = U.makeProp(prop, json[p]);
        var n = meta[p].displayName;
        if (!_.has(json, p)) 
          U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
        else {
          var v = json[p].value;
          var cnt = json[p].count;
          if (typeof cnt == 'undefined'  ||  !cnt)
            U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
          else
            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
        }
      }
      
      if (!options || options.setHTML)
        this.$el.html(frag);
      var self = this;
  
      this.rendered = true;
      return this;
    }
  });
});
