define([
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!events', 
  'cache!templates' 
], function($, __jqm__, _, Backbone, Events, Templates) {
  return Backbone.View.extend({
    tagName:"li",
    initialize: function(options) {
      _.bindAll(this, 'render', 'tap'); // fixes loss of context for 'this' within methods
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
      'tap': 'tap',
      'click': 'click'
    },
    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,  
    render: function(event) {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });  
});
