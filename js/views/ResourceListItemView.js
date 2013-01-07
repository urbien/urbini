define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!events', 
  'cache!templates', 
  'cache!utils'
], function(G, $, __jqm__, _, Backbone, Events, Templates, U) {
  return Backbone.View.extend({
    tagName:"li",
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      if (options.hasImages)
        this.template = _.template(Templates.get('listItemTemplate'));
      else
        this.template = _.template(Templates.get('listItemTemplateNoImage'));
      
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      this.parentView = options && options.parentView;
      return this;
    },
    events: {
      'click': 'click'
    },
//    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render: function(event) {
      var m = this.model;
      var meta = m.__proto__.constructor.properties;
      meta = meta || m.properties;
      if (!meta)
        return this;
      var json = this.model.toJSON();
      var distance = this.model.get('distance');
      if (typeof distance != 'undefined') {
        var meta = this.model.__proto__.constructor.properties;
        var prop = meta['distance'];
        var d = U.getCloneOf(meta, 'Distance.distance');
        if (d)
          json['distance'] = distance + ' mi';
      }
      var grid = U.getGridCols(m);
      var viewCols = '';
          
      if (grid) {
        for (var row in grid) {
          if (i == 0)
            i++;
          else
            viewCols += "<br/>";
          var pName = grid[row].propertyName;
          var range = meta[pName].range;
          var s = range.indexOf('/') != -1 ? json[pName].displayName  ||  json[pName] : grid[row].value;
          var isDate = meta[pName].range == 'date'; 
          if (!meta[pName].skipLabelInGrid) {
//            if (isDate)
//              viewCols += '<div style="display:inline;float:right; top:10px;"><span class="label">' + row + ':</span><span style="font-weight:normal">' + s + '</span></div>';
//            else
              viewCols += '<div style="display:inline"><span class="label">' + row + ':</span><span style="font-weight:normal">' + s + '</span></div>';
          }
          else
            viewCols += '<span style="font-weight:normal">' + s + '</span>';
        }
      }


      var dn = ''; //son['davDisplayName'];
//      if (!dn) { 
      var dnProps = U.getDisplayNameProps(meta);
        var first = true;
        for (var i=0; i<dnProps.length; i++) {
          var value = json[dnProps[i]];
          if (value  &&  typeof value != 'undefined') {
            if (first)
              first = false;
            else
              dn += ' ';
            dn += (value.displayName) ? value.displayName : value;
          }
        }
        json['davDisplayName'] = dn;
        if (!viewCols.length) 
          viewCols = '<h3>' + dn + '</h3>';
        json['viewCols'] = viewCols;
//      }

      this.$el.html(this.template(json));
      return this;
    }
  });  
});
