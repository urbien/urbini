define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils',
  'cache!views/BasicView'
], function(G, $, __jqm__, _, Backbone, Templates, Events, U, BasicView) {
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    return p.charAt(0) != '_' && p != 'davDisplayName' && !prop.displayNameElm && U.isPropVisible(res, prop, role);
  };

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'refresh'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.propRowTemplate = _.template(Templates.get('propRowTemplate'));
      this.propRowTemplate2 = _.template(Templates.get('propRowTemplate2'));
      this.propGroupsDividerTemplate = _.template(Templates.get('propGroupsDividerTemplate'));
      this.resource.on('change', this.refresh, this);
      this.TAG = 'ResourceView';
  //    Lablz.Events.on('refresh', this.refresh);
      return this;
    },
    events: {
      'click': 'click'
    },
    refresh: function() {
      var res = this.resource;
      if (res.lastFetchOrigin === 'edit')
        return;
      
      var collection, modified;
      if (arguments[0] instanceof Backbone.Collection) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != res.collection || !_.contains(modified, res.get('_uri')))
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
      var res = this.resource;
      var vocModel = this.vocModel;
      var meta = vocModel.properties;
      var userRole = U.getUserRole();
      var json = res.toJSON();
      var frag = document.createDocumentFragment();
  
      var propGroups = U.getPropertiesWith(meta, "propertyGroupList", true); // last param specifies to return array
//      propGroups = propGroups.length ? propGroups : U.getPropertiesWith(vocModel.properties, "propertyGRoupsList", true);
      propGroups = _.sortBy(propGroups, function(pg) {
        return pg.index;
      });
      
      var backlinks = U.getPropertiesWith(meta, "backLink");
//      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;
      
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;
      if (propGroups.length) {
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p) || !_.has(json, p) || _.has(backlinks, p))
              continue;
            
            var prop = meta[p];
            if (!prop) {
              delete json[p];
              continue;
            }
                  
            if (!willShow(res, prop, userRole))
              continue;
  
            displayedProps[p] = true;
            json[p] = U.makeProp(prop, json[p]);
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            // remove HTML tags, test length of pure text
            var v = json[p].value.replace(/(<([^>]+)>)/ig, '').trim();
            if (json[p].name.length + v.length > maxChars)
              U.addToFrag(frag, this.propRowTemplate2(json[p]));
            else
              U.addToFrag(frag, this.propRowTemplate(json[p]));
          }
        }
      }
      
      var otherLi;
      groupNameDisplayed = false;
      var numDisplayed = _.size(displayedProps);
      for (var p in json) {
        if (!/^[a-zA-Z]/.test(p))
          continue;

        var prop = meta[p];
        if (!_.has(json, p) || displayedProps[p] || _.has(backlinks, p))
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
        if (!U.isPropVisible(res, prop))
          continue;
  
        if (numDisplayed  &&  !groupNameDisplayed) {
          otherLi = '<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">';
  //        this.$el.append('<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'); 
          groupNameDisplayed = true;
        }
        
        json[p] = U.makeProp(prop, json[p]);
        var v = json[p].value.replace(/(<([^>]+)>)/ig, '').trim();
        if (otherLi) {
          if (json[p].name.length + v.length > maxChars)
            otherLi += this.propRowTemplate2(json[p]);
          else
            otherLi += this.propRowTemplate(json[p]);
        }
        else {
          if (json[p].name.length + v.length > maxChars)
            U.addToFrag(frag, this.propRowTemplate2(json[p]));
          else
            U.addToFrag(frag, this.propRowTemplate(json[p]));
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
    displayName: 'ResourceView'
  });
});
