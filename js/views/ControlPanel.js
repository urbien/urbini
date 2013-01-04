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
    tagName: "tr",
    initialize: function(options) {
      _.bindAll(this, 'render','click', 'refresh'); // fixes loss of context for 'this' within methods
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.cpTemplate = _.template(Templates.get('cpTemplate'));
      this.cpTemplateNoAdd = _.template(Templates.get('cpTemplateNoAdd'));
      this.model.on('change', this.refresh, this);
      this.TAG = 'ControlPanel';
  //    Globals.Events.on('refresh', this.refresh);
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
      
      this.$el.trigger('create');
    },
//    tap: Events.defaultTapHandler,  
    click: Events.defaultClickHandler,
    render: function(options) {
      G.log(this.TAG, "render");
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
            var n = prop.displayName;
            var range = prop.range; //U.getClassName(prop.range); 
            var isPropEditable = U.isPropEditable(json, prop);
            
            var doShow = false;
            var cnt;
            if (!_.has(json, p)) { 
              cnt = count > 0 ? count : 0;
              
              if (cnt != 0 || isPropEditable)
                doShow = true;
//              U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
            }
            else {
              var v = json[p].value;
              cnt = json[p].count;
              if (typeof cnt == 'undefined'  ||  !cnt)
                cnt = 0;
              if (cnt != 0 ||  isPropEditable)
                doShow = true;
//                U.addToFrag(frag, this.cpTemplateNoValue({name: n}));
//              else
            }
            if (doShow) {
              if (!groupNameDisplayed) {
                U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
                groupNameDisplayed = true;
              }
              var uri = U.getShortUri(this.model.get('_uri'), this.model.constructor); 
              
              if (isPropEditable)
                U.addToFrag(frag, this.cpTemplate({range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri}));
              else
                U.addToFrag(frag, this.cpTemplateNoAdd({range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri}));
//              if (isPropEditable)
//                U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
//              else
//                U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
            }
          }
        }
      }
      
      groupNameDisplayed = false;
      var tmpl_data;
      for (var p in json) {
        var prop = meta[p];
        if (displayedProps  &&  _.contains(displayedProps, p))  
          continue;
        var count = -1;
        if (!_.contains(backlinks, prop)) {
          if (p.length <= 5  ||  p.indexOf('Count') != p.length - 5) 
            continue;
          var pp = p.substring(0, p.length - 5);
          var pMeta = meta[pp];
          if (!pMeta  ||  !pMeta.backLink) 
            continue;
          count = json[p];
          p = pp;
          prop = pMeta;
          tmpl_data = _.extend(json, {p: {count: count}});
        }
        if (count == -1) {
          if (!prop  ||  (!_.has(json, p)  &&  typeof prop.readOnly != 'undefined')) {
            delete json[p];
            continue;
          }
        }
              
        if (!U.isPropVisible(json, prop))
          continue;
  
        var isPropEditable = U.isPropEditable(json, prop);
        var doShow = false;
//        json[p] = U.makeProp(prop, json[p]);
        var n = prop.displayName;
        var cnt;
        if (!_.has(json, p)) {
          cnt = count > 0 ? count : 0;
          if (cnt != 0 || isPropEditable)
            doShow = true;
        }
        else {
          var v = json[p].value;
          cnt = json[p].count;
          if (typeof cnt == 'undefined'  ||  !cnt)
            cnt = 0;
          if (isPropEditable  ||  cnt != 0)
            doShow = true;
        }
        if (doShow) {
//          if (isPropEditable)
//            U.addToFrag(frag, this.cpTemplate({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
//          else
//            U.addToFrag(frag, this.cpTemplateNoAdd({propName: p, name: n, value: cnt, _uri: this.model.get('_uri')}));
//          var range = U.getClassName(prop.range);
          var range = prop.range;
          var uri = U.getShortUri(this.model.get('_uri'), this.model.constructor); 
          if (isPropEditable)
            U.addToFrag(frag, this.cpTemplate({range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri}));
          else
            U.addToFrag(frag, this.cpTemplateNoAdd({range: range, backlink: prop.backLink, name: n, value: cnt, _uri: uri}));
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
