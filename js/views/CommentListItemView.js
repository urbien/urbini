define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!events', 
  'cache!templates' 
], function(G, $, __jqm__, _, Backbone, Events, Templates) {
  return Backbone.View.extend({
    tagName: 'tr',
    className: 'commentList',
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.template = _.template(Templates.get('comment-item'));
      
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
      var json = this.model.toJSON();
      var thumb = json['submitter.thumb'];
      if (thumb) {
        var idx = thumb.indexOf('=');
        json['submitter.thumb'] = thumb.slice(idx + 1);
      }
        
      this.$el.html(this.template(json));
      return this;
    }
  });  
});
