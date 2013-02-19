//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'events', 
  'templates',
  'views/BasicView'
], function(G, $, _, Events, Templates, BasicView) {
  return BasicView.extend({
    tagName: 'tr',
    className: 'commentList',
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      this.template = _.template(Templates.get('comment-item'));
      
      // resourceListView will call render on this element
  //    this.model.on('change', this.render, this);
      return this;
    },
    events: {
//      'click': 'click'
    },
//    tap: Events.defaultTapHandler,
//    click: Events.defaultClickHandler,  
    render: function(event) {
      var json = this.resource.toJSON();
      var thumb = json['submitter.thumb'];
      if (thumb) {
        var idx = thumb.indexOf('=');
        json['submitter.thumb'] = thumb.slice(idx + 1);
      }
        
      this.$el.html(this.template(json));
      return this;
    }
  }, {
    displayName: 'CommentListItemView'
  });  
});
