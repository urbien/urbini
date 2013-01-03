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
            dn += value;
          }
        }
        json['davDisplayName'] = dn;
//      }

      this.$el.html(this.template(json));
      return this;
    }
  });  
});
